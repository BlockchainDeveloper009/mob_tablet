"""
That's a smart way to manage your database\! Combining all these functions into a single script with a console menu makes it a powerful and easy-to-use database management utility.

Here is the complete, merged Python program, which presents a menu, handles user input, and calls the appropriate database functions.
"""

import sqlite3
import os
import shutil
from datetime import datetime

# --- Configuration ---
# REPLACE this path with the actual location of your database file
LIVE_DB_PATH = 'C:\\sqllite3\\db\\active_db.db'
# REPLACE this path with the directory for your backups
ARCHIVE_DIR = 'C:\\sqllite3\\db\\archive'

# ====================================================================
# DATABASE MANAGEMENT FUNCTIONS
# ====================================================================

## BACKUP FUNCTION (Option 1)
def create_backup_and_archive(live_path, archive_dir):
    """Creates a timestamped backup of the live database."""
    if not os.path.exists(live_path):
        print(f"\n❌ Error: Live database not found at {live_path}")
        return

    # Prepare file names and paths
    base_name, ext = os.path.splitext(os.path.basename(live_path))
    timestamp = datetime.now().strftime("_%Y%m%d_%H%M%S")
    backup_filename = f"{base_name}{timestamp}{ext}"
    archive_path = os.path.join(archive_dir, backup_filename)

    # Ensure the archive directory exists
    if not os.path.exists(archive_dir):
        print(f"Creating archive directory: {archive_dir}")
        os.makedirs(archive_dir)

    print(f"\nStarting backup of: {os.path.basename(live_path)}...")

    try:
        shutil.copy2(live_path, archive_path)
        print(f"✅ Backup successful. Archive saved as: {backup_filename}")
        print(f"   Full path: {archive_path}")

    except IOError as e:
        print(f"❌ Backup failed due to I/O error: {e}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

## SCHEMA CREATION FUNCTION (Option 2)
def create_schema(db_path):
    """Creates the necessary tables if they don't exist."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        print(f"\nConnected to database: {db_path}")

        sql_commands = """
        CREATE TABLE IF NOT EXISTS products (
            product_id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS orders (
            order_id INTEGER PRIMARY KEY,
            order_date TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            total REAL
        );
        CREATE TABLE IF NOT EXISTS order_items (
            item_id INTEGER PRIMARY KEY,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            FOREIGN KEY (order_id) REFERENCES orders (order_id),
            FOREIGN KEY (product_id) REFERENCES products (product_id)
        );
        """
        cursor.executescript(sql_commands)
        conn.commit()
        print("✅ All tables created or confirmed to exist.")

    except sqlite3.Error as e:
        print(f"❌ An SQLite error occurred during schema creation: {e}")
    finally:
        if conn:
            conn.close()

## INSERT SAMPLE DATA FUNCTION (Option 3)
def insert_sample_data(db_path):
    """Populates the tables with sample records."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        sql_insert_commands = """
        INSERT INTO products (name, price, stock) VALUES ('Laptop Pro 15', 1299.99, 50);
        INSERT INTO products (name, price, stock) VALUES ('Wireless Mouse X2', 25.50, 150);
        INSERT INTO products (name, price, stock) VALUES ('Mechanical Keyboard TKL', 85.00, 75);

        INSERT INTO orders (order_date, customer_name, total) VALUES ('2025-10-02 10:30:00', 'Alice Johnson', 0.00);
        INSERT INTO orders (order_date, customer_name, total) VALUES ('2025-10-02 14:45:00', 'Bob Smith', 0.00);

        INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 1, 1);
        INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 2, 2);
        INSERT INTO order_items (order_id, product_id, quantity) VALUES (2, 3, 1);
        INSERT INTO order_items (order_id, product_id, quantity) VALUES (2, 2, 3);
        """
        cursor.executescript(sql_insert_commands)
        conn.commit()
        print("\n✅ Sample data inserted successfully.")

    except sqlite3.Error as e:
        print(f"\n❌ An SQLite error occurred during data insertion: {e}")
    finally:
        if conn:
            conn.close()

## READ RECORDS FUNCTION (Option 4)
def get_all_products(db_path):
    """Fetches and prints all records from the products table."""
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("SELECT product_id, name, price, stock FROM products")
        
        column_names = [description[0] for description in cursor.description]
        print("\n--- Products Table ---")
        print(f"Schema: {', '.join(column_names)}")
        print("-" * 50)
        
        rows = cursor.fetchall()
        
        if rows:
            for row in rows:
                print(f"ID: {row[0]}, Name: {row[1]}, Price: ${row[2]:.2f}, Stock: {row[3]}")
        else:
            print("No products found.")

    except sqlite3.Error as e:
        print(f"❌ Error reading records: {e}")
    finally:
        if conn:
            conn.close()

## INSERT NEW PRODUCT (Option 5)
def handle_insert_product(db_path):
    """Prompts user for product details and inserts the new record."""
    print("\n--- Insert New Product ---")
    try:
        name = input("Enter Product Name: ")
        price = float(input("Enter Price (e.g., 99.99): "))
        stock = int(input("Enter Initial Stock Quantity: "))
    except ValueError:
        print("❌ Invalid input for price or stock. Please try again.")
        return

    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        sql = "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)"
        cursor.execute(sql, (name, price, stock))
        conn.commit()
        print(f"\n✅ Successfully inserted product: '{name}' (ID: {cursor.lastrowid})")

    except sqlite3.Error as e:
        print(f"❌ Error inserting record: {e}")
    finally:
        if conn:
            conn.close()

## UPDATE PRODUCT PRICE (Option 6)
def handle_update_product(db_path):
    """Prompts user for product ID and new price, then updates the record."""
    print("\n--- Update Product Price ---")
    try:
        product_id = int(input("Enter Product ID to Update: "))
        new_price = float(input("Enter NEW Price (e.g., 109.99): "))
    except ValueError:
        print("❌ Invalid input for ID or price. Please try again.")
        return

    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        sql = "UPDATE products SET price = ? WHERE product_id = ?"
        cursor.execute(sql, (new_price, product_id))
        conn.commit()
        
        if cursor.rowcount > 0:
            print(f"\n✅ Successfully updated Product ID {product_id}. New price: ${new_price:.2f}")
        else:
            print(f"\n⚠️ Warning: No product found with ID {product_id}.")

    except sqlite3.Error as e:
        print(f"❌ Error updating record: {e}")
    finally:
        if conn:
            conn.close()

# ====================================================================
# MAIN MENU LOGIC
# ====================================================================

def main_menu():
    """Presents the menu and handles user options."""
    while True:
        print("\n\n--------------------------------------------")
        print(" SQLite Database Manager")
        print("--------------------------------------------")
        print("1. 💾 Backup & Archive Current Database")
        print("2. 🏗️ Create/Verify Database Schema (Tables)")
        print("3. 🧪 Insert Sample Data (DANGER: Runs fixed SQL)")
        print("---")
        print("4. 🔎 Read All Products")
        print("5. ➕ Insert New Product (Manual Input)")
        print("6. 🔄 Update Product Price (Manual Input)")
        print("---")
        print("0. 🛑 Exit")
        print("--------------------------------------------")
        
        choice = input("Enter option number: ")

        if choice == '1':
            create_backup_and_archive(LIVE_DB_PATH, ARCHIVE_DIR)
        elif choice == '2':
            create_schema(LIVE_DB_PATH)
        elif choice == '3':
            insert_sample_data(LIVE_DB_PATH)
        elif choice == '4':
            get_all_products(LIVE_DB_PATH)
        elif choice == '5':
            handle_insert_product(LIVE_DB_PATH)
        elif choice == '6':
            handle_update_product(LIVE_DB_PATH)
        elif choice == '0':
            print("Exiting program. Goodbye! 👋")
            break
        else:
            print("Invalid option. Please enter a number from the menu.")

# Run the main program
if __name__ == "__main__":
    main_menu()
