import sqlite3
import os

# --- Configuration ---
# Set the path to your ACTIVE SQLite database file (same as in script 1)
LIVE_DB_PATH = 'C:\\sqllite3\\db\\active_db.db'  # CHANGE THIS!

def create_schema(db_path):
    """
    Connects to the database and executes the table creation SQL commands.
    """
    conn = None
    try:
        # 1. Connect to the database. If the file doesn't exist, it will be created.
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print(f"Connected to database: {db_path}")

        # --- SQL Commands to Create Tables (YOUR SCHEMA GOES HERE) ---
        
        # Example 1: Products Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                product_id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                stock INTEGER DEFAULT 0
            );
        """)
        print("✅ Table 'products' created or already exists.")

        # Example 2: Orders Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                order_id INTEGER PRIMARY KEY,
                order_date TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                total REAL
            );
        """)
        print("✅ Table 'orders' created or already exists.")

        # Example 3: Order Items Table (Relationship Table)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                item_id INTEGER PRIMARY KEY,
                order_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                FOREIGN KEY (order_id) REFERENCES orders (order_id),
                FOREIGN KEY (product_id) REFERENCES products (product_id)
            );
        """)
        print("✅ Table 'order_items' created or already exists.")


        # 2. Commit the changes to make them permanent
        conn.commit()
        print("\nAll schema changes committed successfully.")

    except sqlite3.Error as e:
        print(f"❌ An SQLite error occurred during schema creation: {e}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")
    finally:
        # 3. Close the connection
        if conn:
            conn.close()
            print("Connection closed.")

# --- Execute the function ---
# Note: Before running this to create a NEW database structure,
# you would typically delete the old active database file 
# after the backup script successfully runs.
create_schema(LIVE_DB_PATH)