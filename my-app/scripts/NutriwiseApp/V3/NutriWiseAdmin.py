import sqlite3
import datetime
import pandas as pd

class NutriWiseAdmin:
    """
    Handles all administrative functions: Database setup (schema and initial data), 
    and adding new food items to the master tables.
    """
    DB_NAME = 'NutriWise.db'
    
    # Your COMPLETE SQL SETUP BLOCK (Schema + Reference Data)
    NUTRIWISE_SETUP_SQL = """
        -- Table 1: NUTRI_REF_Nutrient (Master list of nutrients and their RDI)
        CREATE TABLE IF NOT EXISTS NUTRI_REF_Nutrient (
            nutrient_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            unit TEXT NOT NULL,
            rdi_daily REAL NOT NULL,
            rdi_weekly REAL
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
        
        -- Chicken Breast (Protein)
        INSERT INTO NUTRI_MAP_Content (food_id, nutrient_id, value_per_portion) 
        SELECT 
            (SELECT food_id FROM NUTRI_REF_Food WHERE name='Chicken Breast'), 
            (SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Protein'), 
            31.0
        WHERE NOT EXISTS (
            SELECT 1 FROM NUTRI_MAP_Content 
            WHERE food_id=(SELECT food_id FROM NUTRI_REF_Food WHERE name='Chicken Breast') 
            AND nutrient_id=(SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Protein')
        );
        
        -- Apple (Vitamin C)
        INSERT INTO NUTRI_MAP_Content (food_id, nutrient_id, value_per_portion) 
        SELECT 
            (SELECT food_id FROM NUTRI_REF_Food WHERE name='Apple'), 
            (SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Vitamin C'), 
            8.4
        WHERE NOT EXISTS (
            SELECT 1 FROM NUTRI_MAP_Content 
            WHERE food_id=(SELECT food_id FROM NUTRI_REF_Food WHERE name='Apple') 
            AND nutrient_id=(SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Vitamin C')
        );
        
        -- Lentils (Iron)
        INSERT INTO NUTRI_MAP_Content (food_id, nutrient_id, value_per_portion) 
        SELECT 
            (SELECT food_id FROM NUTRI_REF_Food WHERE name='Lentils (Cooked)'), 
            (SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Iron'), 
            3.3
        WHERE NOT EXISTS (
            SELECT 1 FROM NUTRI_MAP_Content 
            WHERE food_id=(SELECT food_id FROM NUTRI_REF_Food WHERE name='Lentils (Cooked)') 
            AND nutrient_id=(SELECT nutrient_id FROM NUTRI_REF_Nutrient WHERE name='Iron')
        );
    """

    def __init__(self):
        self.conn = sqlite3.connect(self.DB_NAME)
        self.cursor = self.conn.cursor()
        print("Admin: Executing full SQL setup (Schema and Initial Data)...")
        self.cursor.executescript(self.NUTRIWISE_SETUP_SQL)
        self.conn.commit()
        print("Admin: Database setup complete.")
        
    def add_food_item(self, food_name, category, portion_size_g, nutrient_values):
        """
        Admin function to insert a new food item and its nutrient values into 
        the reference tables (NUTRI_REF_Food and NUTRI_MAP_Content).
        """
        try:
            # 1. Insert into NUTRI_REF_Food
            self.cursor.execute("""
                INSERT INTO NUTRI_REF_Food (name, category, portion_size_g) 
                VALUES (?, ?, ?)
            """, (food_name, category, portion_size_g))
            
            food_id = self.cursor.lastrowid # Get the ID of the newly inserted food
            
            # 2. Map nutrient names to their IDs
            self.cursor.execute("SELECT nutrient_id, name FROM NUTRI_REF_Nutrient")
            nutrient_map = {name: id for id, name in self.cursor.fetchall()}

            # 3. Insert into NUTRI_MAP_Content
            for nutrient_name, value in nutrient_values.items():
                if nutrient_name in nutrient_map:
                    nutrient_id = nutrient_map[nutrient_name]
                    self.cursor.execute("""
                        INSERT INTO NUTRI_MAP_Content (food_id, nutrient_id, value_per_portion) 
                        VALUES (?, ?, ?)
                    """, (food_id, nutrient_id, value))
                else:
                    print(f"⚠️ Admin Warning: Nutrient '{nutrient_name}' not found in master list. Skipping.")

            self.conn.commit()
            return f"✅ Admin: Successfully added custom food: {food_name}."

        except sqlite3.IntegrityError:
            self.conn.rollback()
            return f"❌ Admin Error: Food '{food_name}' already exists in the database."
        except Exception as e:
            self.conn.rollback()
            return f"❌ Admin Error: An unexpected error occurred: {e}"

    def close(self):
        """Closes the database connection."""
        self.conn.close()

# ----------------------------------------------------------------------
# ----------------------------------------------------------------------


    def _get_user_input(self, admin):
        """
        Interactive function to collect custom food data from the console, 
        with clear examples of expected input format.
        """
        # 1. Fetch available nutrients to prompt the user
        admin.cursor.execute("SELECT name, unit FROM NUTRI_REF_Nutrient")
        nutrients = {name: unit for name, unit in admin.cursor.fetchall()}
        
        print("\n-------------------------------------------")
        print("--- ADD NEW FOOD ITEM TO MASTER DATABASE ---")
        print("-------------------------------------------")
        
        # Get basic food details
        # Example: Turmeric Powder -> Turmeric Powder
        food_name = input("1. Enter Food Name (e.g., 'Turmeric Powder'): ").strip()
        
        # Example: Spice -> Spice
        category = input("2. Enter Category (e.g., 'Spice', 'Supplement'): ").strip()
        
        while True:
            try:
                # Example: 5.0 grams -> 5.0
                portion_size_input = input("3. Enter Standard Portion Size in grams (e.g., '5.0' for 1 tsp portion): ").strip()
                portion_size = float(portion_size_input)
                print(f"   (Saves to DB as portion_size_g = {portion_size})")
                break
            except ValueError:
                print("❗ Invalid input. Please enter a numerical value for the portion size (e.g., 5.0).")

        # Get nutrient contents
        nutrient_values = {}
        print("\n--- Enter Nutrient Values per Standard Portion (Enter 'n' or 0 to skip) ---")
        
        for name, unit in nutrients.items():
            while True:
                # Example: 15.0 (for Protein) -> 15.0
                value_str = input(f"   Enter {name} value ({unit}) per portion: ").strip().lower()
                
                if value_str in ('n', ''):
                    print(f"   ({name} skipped.)")
                    break
                try:
                    value = float(value_str)
                    if value >= 0:
                        nutrient_values[name] = value
                        print(f"   (Saves to DB as {name} = {value})")
                    break
                except ValueError:
                    print("❗ Invalid input. Please enter a number (e.g., 2.5) or 'n' to skip.")

        # Call the admin method to insert the data
        if food_name and category and portion_size > 0 and nutrient_values:
            result = admin.add_food_item(food_name, category, portion_size, nutrient_values)
            print(result)
        else:
            print("❌ Food item skipped. Ensure Name, Category, Portion Size, and at least one nutrient value are entered correctly.")

    def list_table_contents(self, table_name):
        """
        Retrieves and displays all rows from a specified reference table using Pandas.
        """
        valid_tables = ['NUTRI_REF_Nutrient', 'NUTRI_REF_Food', 'NUTRI_MAP_Content', 'NUTRI_USER_Consumption']
        
        if table_name not in valid_tables:
            print(f"❌ Error: Table '{table_name}' is not a valid reference table. Choose from: {', '.join(valid_tables)}")
            return

        try:
            query = f"SELECT * FROM {table_name}"
            df = pd.read_sql_query(query, self.conn)
            print(f"\n--- Contents of Table: {table_name} ({len(df)} rows) ---")
            print(df.to_string(index=False))
            print("-----------------------------------------------------")
            
        except pd.io.sql.DatabaseError as e:
            print(f"❌ Database Error while reading table {table_name}: {e}")
        except Exception as e:
            print(f"❌ An unexpected error occurred: {e}")

## Testing/Demonstration Environment
## Testing/Demonstration Environment
if __name__ == '__main__':
    # 1. ADMIN SETUP AND CUSTOMIZATION
    admin = NutriWiseAdmin()
    
    # Pre-add one item for immediate listing demonstration
    admin.add_food_item(
        food_name='Turmeric Powder', 
        category='Spice', 
        portion_size_g=5.0, 
        nutrient_values={'Iron': 1.0, 'Vitamin C': 0.5, 'Calories': 15}
    )
    
    while True:
        print("\nAdmin Menu:")
        print("  [A] - Add a new food item")
        print("  [L] - List contents of a reference table")
        print("  [Q] - Quit")
        action = input("Enter action: ").strip().lower()
        
        if action == 'a':
            _get_user_input(admin)
        
        elif action == 'l':
            table_name = input("Enter table name to list (e.g., NUTRI_REF_Food, NUTRI_REF_Nutrient): ").strip()
            admin.list_table_contents(table_name)
            
        elif action == 'q':
            print("Admin session closing. Database changes saved.")
            break
            
        else:
            print("Invalid command. Please enter 'A', 'L', or 'Q'.")
            
    admin.close()