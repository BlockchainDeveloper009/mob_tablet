import sqlite3
import os

def list_sqlite_tables(db_path):
    """
    Connects to an SQLite database at the given path and lists all user-defined tables.
    """
    # 1. Check if the file exists
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at path: {db_path}")
        return

    conn = None
    try:
        # 2. Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print(f"Successfully connected to the database: {db_path}")

        # 3. Query the sqlite_master table for user tables
        # The 'name NOT LIKE "sqlite_%"' part excludes internal system tables.
        cursor.execute("""
            SELECT name 
            FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%';
        """)

        # 4. Fetch all table names
        tables = cursor.fetchall()

        if tables:
            print("\nTables found in the database:")
            for i, table_tuple in enumerate(tables, 1):
                # The table name is the first (and only) element in the tuple
                print(f"  {i}. {table_tuple[0]}")
        else:
            print("\nNo user-defined tables found in the database.")

    except sqlite3.Error as e:
        print(f"An SQLite error occurred: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # 5. Ensure the connection is closed
        if conn:
            conn.close()
            print("\nConnection closed.")

# --- Configuration ---
# REPLACE the directory and filename below with your actual path and file name
DB_DIRECTORY = r'C:\sqllite3\db\stocks_db'  # Example for Windows
# DB_DIRECTORY = '/home/user/data/dbs'             # Example for Linux/macOS
DB_FILENAME = 'stockdata.litedb'

# Construct the full path
FULL_DB_PATH = os.path.join(DB_DIRECTORY, DB_FILENAME)

# --- Run the function ---
list_sqlite_tables(FULL_DB_PATH)