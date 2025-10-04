import sqlite3
import os

# --- Configuration from your master_config.json ---
# You need the live path for the currently selected database.
LIVE_DB_PATH = "C:\\sqllite3\\db\\active_db.db" 

# The SQL script content should be loaded here (e.g., from the code block above)
SQL_SCRIPT = """
-- PASTE THE ENTIRE SQL BLOCK FROM SECTION 1 HERE
-- Including all CREATE TABLE and INSERT INTO commands
"""

def create_and_seed_db(db_path, sql_script):
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Executes all semicolon-separated commands in the script
        cursor.executescript(sql_script)
        conn.commit()
        print(f"✅ Database tables created and reference data inserted successfully in {db_path}.")

    except sqlite3.Error as e:
        print(f"❌ An SQLite error occurred: {e}")
    finally:
        if conn:
            conn.close()

# Example Call:
# create_and_seed_db(LIVE_DB_PATH, SQL_SCRIPT)