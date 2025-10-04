import sqlite3
import os
import json
from abc import ABC, abstractmethod

# --- GLOBAL CONFIGURATION ---
MASTER_CONFIG_PATH = 'master_config.json' # Make sure your JSON is saved with this name

# ====================================================================
# CONFIGURATION & HELPER FUNCTIONS
# ====================================================================

def load_master_config():
    """Reads configuration from the master JSON file (key-map structure)."""
    print(f"Attempting to load master configuration from: {MASTER_CONFIG_PATH}")
    
    if not os.path.exists(MASTER_CONFIG_PATH):
        print(f"❌ Error: Master configuration file not found at {MASTER_CONFIG_PATH}.")
        return None

    try:
        with open(MASTER_CONFIG_PATH, 'r') as f:
            # Loads the dictionary where keys are DB names (e.g., 'inventory_db')
            config = json.load(f) 
            print("✅ Master configuration loaded successfully.")
            return config
    except json.JSONDecodeError as e:
        print(f"❌ Error decoding JSON in {MASTER_CONFIG_PATH}. Check your file format: {e}")
        return None
    except Exception as e:
        print(f"❌ An unexpected error occurred while reading config: {e}")
        return None

def get_table_schema(db_path, table_name):
    """Retrieves column details using PRAGMA table_info."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute(f"PRAGMA table_info({table_name})")
        return [(col[1], col[2], col[3]) for col in cursor.fetchall()]
    except sqlite3.Error as e:
        print(f"❌ Error retrieving schema for {table_name}: {e}")
        return None
    finally:
        if conn:
            conn.close()

# ====================================================================
# 1. INTERFACE DEFINITION
# ====================================================================

class InsertStrategy(ABC):
    """Interface for different data insertion strategies."""
    def __init__(self, db_path, config):
        self.db_path = db_path
        self.config = config 

    @abstractmethod
    def execute_insert(self, table_name, data=None):
        pass

# ====================================================================
# 2. CONCRETE STRATEGY IMPLEMENTATIONS
# ====================================================================

class StaticSqlInsert(InsertStrategy):
    """Strategy for inserting fixed data read from an external SQL file defined in config."""
    def execute_insert(self, table_name=None, data=None):
        sql_file = self.config.get('sql_file_path')
        print(f"--- Executing Static SQL Insert from {sql_file} ---")
        
        if not sql_file or not os.path.exists(sql_file):
            print(f"❌ Error: SQL file not found at {sql_file}")
            return

        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            with open(sql_file, 'r') as f:
                sql_script = f.read()

            cursor.executescript(sql_script)
            conn.commit()
            print("✅ Fixed data inserted successfully from SQL file.")

        except sqlite3.Error as e:
            print(f"❌ SQLite error during static insert: {e}")
        except Exception as e:
            print(f"❌ An unexpected error occurred: {e}")
        finally:
            if conn:
                conn.close()


class DynamicUserInputInsert(InsertStrategy):
    """Strategy for inserting a single record based on user input and dynamic schema."""
    
    def execute_insert(self, table_name, data=None):
        print(f"--- Executing Dynamic Insert for Table: {table_name} ---")
        schema = get_table_schema(self.db_path, table_name)
        if not schema: return
        
        column_names = []
        insert_values = []
        
        for name, data_type, not_null in schema:
            # Skip primary keys that are INTEGER
            if name.endswith("_id") and data_type == 'INTEGER': continue

            prompt = f"Enter value for '{name}' ({data_type}"
            if not_null: prompt += ", REQUIRED"
            prompt += "): "

            user_input = input(prompt)
            
            try:
                # Type handling and NOT NULL check
                value = user_input
                if data_type == 'INTEGER': value = int(user_input) if user_input else None
                elif data_type == 'REAL': value = float(user_input) if user_input else None
                
                if not_null and not value:
                    print(f"❌ Column '{name}' is required but was left empty. Aborting.")
                    return

                insert_values.append(value)
                column_names.append(name)

            except ValueError:
                print(f"❌ Invalid format for {data_type} in column {name}. Aborting.")
                return

        # Build and execute the dynamic SQL query
        cols_str = ", ".join(column_names)
        placeholders = ", ".join(["?"] * len(column_names))
        sql = f"INSERT INTO {table_name} ({cols_str}) VALUES ({placeholders})"
        
        conn = None
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute(sql, tuple(insert_values))
            conn.commit()
            print(f"\n✅ Successfully inserted 1 record into '{table_name}'. ID: {cursor.lastrowid}")
        except sqlite3.Error as e:
            print(f"❌ Error inserting record: {e}")
        finally:
            if conn:
                conn.close()


# ====================================================================
# 3. CONTEXT / FACTORY FUNCTION
# ====================================================================

def run_insert_operation(strategy_type: str, db_config, table_name=None):
    """Selects and runs the correct insertion strategy based on the chosen DB config."""
    db_path = db_config['live_path']
    
    if strategy_type == 'static':
        strategy = StaticSqlInsert(db_path, db_config)
        strategy.execute_insert() 
    elif strategy_type == 'dynamic':
        if not table_name:
            print("❌ Error: Dynamic insert requires a table name.")
            return
        strategy = DynamicUserInputInsert(db_path, db_config)
        strategy.execute_insert(table_name)
    else:
        print(f"❌ Unknown strategy type: {strategy_type}")


# ====================================================================
# 4. MAIN EXECUTION & MENUS
# ====================================================================

def select_database(master_config):
    """Prompts user to select a database by its key (e.g., 'inventory_db')."""
    print("\n--------------------------------------------")
    print(" 🛠️ Available Databases")
    print("--------------------------------------------")
    
    # Get keys for display
    db_keys = list(master_config.keys())
    for i, key in enumerate(db_keys):
        # Display the key/identifier and the actual DB filename
        db_name_in_file = master_config[key]['db_name'] 
        print(f"  {i+1}. {key} (File: {db_name_in_file})")
    
    try:
        db_choice = int(input("Enter number of the database to manage: ")) - 1
        
        if 0 <= db_choice < len(db_keys):
            selected_key = db_keys[db_choice]
            # Return the full configuration object for the selected DB
            return master_config[selected_key]
        else:
            print("❌ Invalid database selection.")
            return None
    except ValueError:
        print("❌ Invalid input.")
        return None

def select_table(db_config):
    """Prompts user to select a table from the 'managed_tables' list."""
    tables = db_config.get('managed_tables', [])
    if not tables:
        print(f"❌ No 'managed_tables' defined for {db_config['db_name']} in config.")
        return None

    print("\n--------------------------------------------")
    print(f" 🗃️ Tables in {db_config['db_name']}")
    print("--------------------------------------------")
    for i, name in enumerate(tables):
        print(f"  {i+1}. {name}")
    
    try:
        table_choice = int(input("Enter number of the table to insert into: ")) - 1
        if 0 <= table_choice < len(tables):
            return tables[table_choice]
        else:
            print("❌ Invalid table selection.")
            return None
    except ValueError:
        print("❌ Invalid input.")
        return None

def main_menu(master_config):
    """Handles the top-level application flow."""
    
    while True:
        db_config = select_database(master_config)
        if not db_config:
            break

        print(f"\nSuccessfully selected: {db_config['db_name']}")

        while True:
            print("\n\n--------------------------------------------")
            print(f" Managing: {db_config.get('db_name', 'N/A')} | Path: {db_config['live_path']}")
            print("--------------------------------------------")
            print("1. 📝 Static Insert (Run SQL script)")
            print("2. 👤 Dynamic Insert (Select table, manual input)")
            print("0. 🔙 Back to DB Selection / Exit")
            print("--------------------------------------------")
            
            choice = input("Enter option: ")

            if choice == '1':
                run_insert_operation('static', db_config)
            elif choice == '2':
                selected_table = select_table(db_config)
                if selected_table:
                    run_insert_operation('dynamic', db_config, selected_table)
            elif choice == '0':
                # Allows the user to select another DB or exit
                return 
            else:
                print("Invalid choice.")
        
if __name__ == "__main__":
    MASTER_CONFIG = load_master_config()
    if MASTER_CONFIG:
        # Loop to allow switching between databases without restarting the script
        while True:
            main_menu(MASTER_CONFIG) 
            
            continue_managing = input("\nContinue managing another database? (y/n): ").lower()
            if continue_managing != 'y':
                print("Exiting Database Manager. Goodbye! 👋")
                break