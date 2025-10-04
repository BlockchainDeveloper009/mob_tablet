import os
import shutil
from datetime import datetime

# --- Configuration ---
# Set the path to your ACTIVE SQLite database file
LIVE_DB_PATH = 'C:\\sqllite3\\db\\active_db.db'  # CHANGE THIS! (Use forward slashes or raw string 'r')

# The directory where you want to store the backups
ARCHIVE_DIR = 'C:\\sqllite3\\db\\archive'        # CHANGE THIS!

def create_backup_and_archive(live_path, archive_dir):
    """
    Creates a timestamped copy of the live database and moves it to the archive directory.
    """
    if not os.path.exists(live_path):
        print(f"❌ Error: Live database not found at {live_path}")
        return

    # 1. Prepare file names and paths
    base_name, ext = os.path.splitext(os.path.basename(live_path))
    timestamp = datetime.now().strftime("_%Y%m%d_%H%M%S") # e.g., _20251003_080726
    
    backup_filename = f"{base_name}{timestamp}{ext}"
    archive_path = os.path.join(archive_dir, backup_filename)

    # 2. Ensure the archive directory exists
    if not os.path.exists(archive_dir):
        print(f"Creating archive directory: {archive_dir}")
        os.makedirs(archive_dir)

    print(f"Starting backup of: {os.path.basename(live_path)}")

    try:
        # 3. Copy the file (this is the backup step)
        shutil.copy2(live_path, archive_path) # copy2 preserves metadata
        print(f"✅ Backup successful. Archive saved as: {backup_filename}")
        print(f"   Full path: {archive_path}")

    except IOError as e:
        print(f"❌ Backup failed due to I/O error: {e}")
    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

# --- Execute the function ---
create_backup_and_archive(LIVE_DB_PATH, ARCHIVE_DIR)