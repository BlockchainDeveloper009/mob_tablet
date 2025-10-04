import sqlite3
import os
import datetime

# --- CONFIGURATION ---
DB_NAME = "NutriDB.sqlite"

# ====================================================================
# NUTRIWISE SCHEMA & SETUP SQL
# ====================================================================

NUTRIWISE_SETUP_SQL = """
-- Table 1: NUTRI_REF_Nutrient (Master list of nutrients and their RDI)
CREATE TABLE IF NOT EXISTS NUTRI_REF_Nutrient (
    nutrient_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    unit TEXT NOT NULL,
    rdi_daily REAL NOT NULL,
    rdi_weekly REAL -- (rdi_daily * 7)
);

-- Table 2: NUTRI_REF_Food (Inventory of food, categorized)
CREATE TABLE IF NOT EXISTS NUTRI_REF_Food (
    food_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL, 
    portion_size_g REAL NOT NULL
);

-- Table 3: NUTRI_MAP_Content (Links food to nutrient values per portion)
CREATE TABLE IF NOT EXISTS NUTRI_MAP_Content (
    content_id INTEGER PRIMARY KEY,
    food_id INTEGER NOT NULL,
    nutrient_id INTEGER NOT NULL,
    value_per_portion REAL NOT NULL,
    FOREIGN KEY (food_id) REFERENCES NUTRI_REF_Food (food_id),
    FOREIGN KEY (nutrient_id) REFERENCES NUTRI_REF_Nutrient (nutrient_id),
    UNIQUE (food_id, nutrient_id)
);

-- Table 4: NUTRI_USER_Consumption (Tracks user's actual intake)
CREATE TABLE IF NOT EXISTS NUTRI_USER_Consumption (
    entry_id INTEGER PRIMARY KEY,
    date TEXT NOT NULL, 
    food_id INTEGER NOT NULL,
    portions_eaten REAL NOT NULL, 
    FOREIGN KEY (food_id) REFERENCES NUTRI_REF_Food (food_id)
);

-- --- INSERT REFERENCE DATA (using ON CONFLICT DO NOTHING to prevent errors on re-run) ---

-- A. Insert into NUTRI_REF_Nutrient
INSERT INTO NUTRI_REF_Nutrient (name, unit, rdi_daily, rdi_weekly) VALUES
('Calories', 'kcal', 2000.0, 14000.0),
('Protein', 'g', 50.0, 350.0),
('Fiber', 'g', 30.0, 210.0),
('Vitamin C', 'mg', 75.0, 525.0),
('Iron', 'mg', 18.0, 126.0)
ON CONFLICT(name) DO NOTHING;

-- B. Insert into NUTRI_REF_Food
INSERT INTO NUTRI_REF_Food (name, category, portion_size_g) VALUES
('Broccoli', 'Veggie', 100.0),
('Apple', 'Fruit', 150.0),
('Lentils (Cooked)', 'Pulse', 100.0),
('Chicken Breast', 'Protein', 100.0)
ON CONFLICT(name) DO NOTHING;

-- C. Insert into NUTRI_MAP_Content (Linking Food to Nutrients - using subqueries for safety)

-- Broccoli (Protein)
INSERT INTO NUTRI_MAP_Content (food_id, nutrient_id, value_per_portion) 
SELECT 
    (SELECT food_id FROM NUTRI_REF_Food WHERE name='Broccoli'), 
    (SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Protein'), 
    2.8 
WHERE NOT EXISTS (
    SELECT 1 FROM NUTRI_MAP_Content 
    WHERE food_id=(SELECT food_id FROM NUTRI_REF_Food WHERE name='Broccoli') 
    AND nutrient_id=(SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Protein')
);

-- Lentils (Fiber)
INSERT INTO NUTRI_MAP_Content (food_id, nutrient_id, value_per_portion) 
SELECT 
    (SELECT food_id FROM NUTRI_REF_Food WHERE name='Lentils (Cooked)'), 
    (SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Fiber'), 
    7.9
WHERE NOT EXISTS (
    SELECT 1 FROM NUTRI_MAP_Content 
    WHERE food_id=(SELECT food_id FROM NUTRI_REF_Food WHERE name='Lentils (Cooked)') 
    AND nutrient_id=(SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Fiber')
);
"""

# ====================================================================
# CORE DB FUNCTIONS
# ====================================================================

def connect_db():
    """Connects to the database and ensures schema/data is set up."""
    conn = None
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        
        # Executes all creation and insertion commands
        cursor.executescript(NUTRIWISE_SETUP_SQL)
        conn.commit()
        
        if not os.path.exists(DB_NAME):
             print(f"✅ Created new database: {DB_NAME}")
        print("✅ NutriWise Schema and Reference Data verified.")
        return conn
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return None

def get_available_foods(conn):
    """Retrieves list of available foods and their standard portion sizes."""
    cursor = conn.cursor()
    cursor.execute("SELECT food_id, name, portion_size_g, category FROM NUTRI_REF_Food ORDER BY category, name")
    return cursor.fetchall()

def insert_daily_consumption(conn, food_id, portions_eaten):
    """Inserts a new entry into the NUTRI_USER_Consumption table."""
    today = datetime.date.today().strftime('%Y-%m-%d')
    try:
        cursor = conn.cursor()
        sql = "INSERT INTO NUTRI_USER_Consumption (date, food_id, portions_eaten) VALUES (?, ?, ?)"
        cursor.execute(sql, (today, food_id, portions_eaten))
        conn.commit()
        print(f"\n✅ Logged {portions_eaten} portion(s) for food ID {food_id} on {today}.")
        return True
    except sqlite3.Error as e:
        print(f"❌ Error inserting data: {e}")
        return False

# ====================================================================
# USER INTERACTION
# ====================================================================

def handle_user_input(conn):
    """Guides the user through selecting a food and inputting portions."""
    foods = get_available_foods(conn)
    if not foods:
        print("❌ No foods found in NUTRI_REF_Food. Cannot log consumption.")
        return

    print("\n--- 🍽️ Log Today's Consumption ---")
    
    # Display available foods
    print("Available Foods:")
    food_map = {}
    current_category = ""
    for idx, (food_id, name, portion_g, category) in enumerate(foods, 1):
        if category != current_category:
            print(f"\n[{category.upper()}]")
            current_category = category
        print(f"  {idx}. {name} (ID: {food_id}, Portion: {portion_g}g)")
        food_map[idx] = food_id
        
    print("-" * 28)
    
    # Get food choice
    try:
        choice_idx = int(input("Enter the number of the food item you ate (0 to cancel): "))
        if choice_idx == 0:
            return
        
        food_id = food_map.get(choice_idx)
        if not food_id:
            print("❌ Invalid selection.")
            return

        # Get portions eaten
        portions = float(input(f"Enter number of portions eaten (e.g., 1.5, 2): "))
        if portions <= 0:
            print("❌ Portions must be greater than zero.")
            return

        # Perform the insert
        insert_daily_consumption(conn, food_id, portions)

    except ValueError:
        print("❌ Invalid input. Please enter a number.")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

# ====================================================================
# MAIN APP EXECUTION
# ====================================================================

def main():
    print(f"--- Welcome to NutriWise App Manager ---")
    
    conn = connect_db()
    if not conn:
        print("Aborting program due to database connection error.")
        return

    while True:
        print("\n--- Main Menu ---")
        print("1. 🍽️ Log New Daily Consumption")
        # In a later iteration, this would be the main logic:
        # print("2. 📊 View Weekly Nutrient Status & Get Suggestions") 
        print("0. Exit")
        
        choice = input("Enter option: ")
        
        if choice == '1':
            handle_user_input(conn)
        elif choice == '2':
            print("Feature coming soon! (Need to implement calculation logic)")
        elif choice == '0':
            print("Closing NutriWise. Goodbye! 👋")
            break
        else:
            print("Invalid option.")

    if conn:
        conn.close()

if __name__ == "__main__":
    main()