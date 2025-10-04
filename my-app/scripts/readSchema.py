import sqlite3
import os

def read_table_contents(db_path, limit=5):
    """
    Connects to an SQLite database, lists tables, and prints the schema (columns) 
    and the first few rows of content for each user-defined table.
    """
    # 1. Check if the file exists
    if not os.path.exists(db_path):
        print(f"❌ Error: Database file not found at path: {db_path}")
        return

    conn = None
    try:
        # 2. Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print(f"✅ Successfully connected to the database: {db_path}")

        # 3. Get the list of user-defined tables
        cursor.execute("""
            SELECT name 
            FROM sqlite_master 
            WHERE type='table' AND name NOT LIKE 'sqlite_%';
        """)
        tables = cursor.fetchall()

        if not tables:
            print("\nNo user-defined tables found in the database.")
            return

        print("\n--- Reading Table Schemas and Contents ---")

        # 4. Iterate through each table and read its contents
        for table_tuple in tables:
            table_name = table_tuple[0]
            print(f"\n==================================================")
            print(f"📚 Table Name: {table_name}")
            print(f"==================================================")

            try:
                # 5. Execute a SELECT query to get the data
                query = f"SELECT * FROM {table_name} LIMIT {limit};"
                cursor.execute(query)
                
                # 6. Get the Schema (Column Names)
                # The cursor's description attribute holds the column metadata
                column_names = [description[0] for description in cursor.description]
                print(f"📝 Schema (Columns): {', '.join(column_names)}")

                # 7. Fetch and print the data
                rows = cursor.fetchall()
                
                if rows:
                    print(f"📊 First {len(rows)} Rows (Maximum {limit}):")
                    for row in rows:
                        print(f"   {row}")
                else:
                    print("📊 Table is empty (0 rows).")

            except sqlite3.Error as e:
                print(f"⚠️ Error reading table '{table_name}': {e}")


    except sqlite3.Error as e:
        print(f"An SQLite connection error occurred: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # 8. Ensure the connection is closed
        if conn:
            conn.close()
            print("\n--------------------------------------------------")
            print("Connection closed.")

# --- Configuration ---
# REPLACE the directory and filename below with your actual path and file name
DB_DIRECTORY = r'C:\sqllite3\db\stocks_db'  # Example for Windows
# DB_DIRECTORY = '/home/user/data/dbs'             # Example for Linux/macOS
#DB_FILENAME = 'mydb.db'

# DB_DIRECTORY = '/home/user/data/dbs'             # Example for Linux/macOS
DB_FILENAME = 'stockdata.litedb'


# Construct the full path
FULL_DB_PATH = os.path.join(DB_DIRECTORY, DB_FILENAME)

# --- Run the function ---
# The second argument (e.g., 10) sets the maximum number of rows to print per table.
read_table_contents(FULL_DB_PATH, limit=10)