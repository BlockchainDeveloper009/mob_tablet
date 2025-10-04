import sqlite3
import datetime
import pandas as pd

class NutriWise:
    """
    Manages food logging and nutritional analysis, connecting directly to the 
    database defined by the provided SQL schema.
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
        # 1. Connect to the database
        self.conn = sqlite3.connect(self.DB_NAME)
        self.cursor = self.conn.cursor()
        
        # 2. Execute the entire SQL setup block to create/populate tables
        print("Executing full SQL setup...")
        self.cursor.executescript(self.NUTRIWISE_SETUP_SQL)
        self.conn.commit()
        print("Database setup complete.")
        
    # ----------------------------------------------------------------------
    # 1. Logging Function (Uses food_name to find food_id for logging)
    # ----------------------------------------------------------------------

    def log_food(self, date_str, food_name, portions=1.0):
        """Logs a user consumption entry."""
        self.cursor.execute("SELECT food_id FROM NUTRI_REF_Food WHERE name = ?", (food_name,))
        result = self.cursor.fetchone()
        
        if result:
            food_id = result[0]
            self.cursor.execute("""
                INSERT INTO NUTRI_USER_Consumption (date, food_id, portions_eaten) 
                VALUES (?, ?, ?)
            """, (date_str, food_id, portions))
            self.conn.commit()
            return f"✅ Logged {portions} portion(s) of {food_name}."
        else:
            return f"❌ Error: Food '{food_name}' not found in food database."
    
    # ----------------------------------------------------------------------
    # 2. Analysis Function (The Core Reporting Logic)
    # ----------------------------------------------------------------------

    def get_daily_intake_df(self, start_date_str, end_date_str):
        """
        Calculates daily nutrient intake by joining consumption, food, and content tables.
        Returns a Pandas DataFrame.
        """
        
        # SQL Query for Daily Nutrient Totals
        query = f"""
            SELECT
                T1.date,
                T4.name AS nutrient_name,
                SUM(T1.portions_eaten * T3.value_per_portion) AS daily_intake
            FROM NUTRI_USER_Consumption AS T1
            JOIN NUTRI_REF_Food AS T2 ON T1.food_id = T2.food_id
            JOIN NUTRI_MAP_Content AS T3 ON T2.food_id = T3.food_id
            JOIN NUTRI_REF_Nutrient AS T4 ON T3.nutrient_id = T4.nutrient_id
            WHERE T1.date BETWEEN ? AND ?
            GROUP BY T1.date, T4.name
            ORDER BY T1.date, T4.name
        """
        
        self.cursor.execute(query, (start_date_str, end_date_str))
        log_data = self.cursor.fetchall()
        
        # 1. Pivot data into a clean DataFrame
        df = pd.DataFrame(log_data, columns=['Date', 'Nutrient', 'Intake'])
        
        # Pivot the table to have nutrients as columns (ready for analysis)
        df_pivoted = df.pivot_table(
            index='Date', 
            columns='Nutrient', 
            values='Intake'
        ).reset_index()

        # 2. Fill missing days with 0 and format
        
        # Get the full date range
        start = datetime.datetime.strptime(start_date_str, '%Y-%m-%d')
        end = datetime.datetime.strptime(end_date_str, '%Y-%m-%d')
        date_range = [
            (start + datetime.timedelta(days=i)).strftime('%Y-%m-%d')
            for i in range((end - start).days + 1)
        ]
        
        full_df = pd.DataFrame({'Date': date_range}).merge(df_pivoted, on='Date', how='left').fillna(0)
        full_df['Day'] = pd.to_datetime(full_df['Date']).dt.strftime('%a')
        
        return full_df
    
    def get_rda_targets(self):
        """Fetches all nutrient targets from the reference table."""
        self.cursor.execute("SELECT name, rdi_daily, unit FROM NUTRI_REF_Nutrient")
        return {name: {'rda': rdi, 'unit': unit} for name, rdi, unit in self.cursor.fetchall()}
        
    def close(self):
        """Closes the database connection."""
        self.conn.close()


# --- DEMONSTRATION OF USAGE ---

# 1. Initialize the app (connects and executes your full SQL setup)
app = NutriWise()

# 2. Log food (writing to NUTRI_USER_Consumption)
start_date = '2025-10-01'
end_date = '2025-10-07'

print(app.log_food('2025-10-01', 'Apple', portions=1))
print(app.log_food('2025-10-01', 'Lentils (Cooked)', portions=2.5)) 
print(app.log_food('2025-10-02', 'Chicken Breast', portions=1))
print(app.log_food('2025-10-02', 'Broccoli', portions=3))

# 3. Retrieve and Analyze the data (The core logic for your report)
print("\n--- Generating Analysis Report from DB ---")
df_report = app.get_daily_intake_df(start_date, end_date)

# Display the resulting DataFrame which confirms data retrieval and calculation
print(df_report)

app.close()