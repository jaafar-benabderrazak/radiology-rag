"""
Migration script to add user_id column to reports table
"""
from sqlalchemy import create_engine, inspect, text
from config import settings

def migrate_add_user_id_to_reports():
    """Add user_id column to reports table if it doesn't exist"""
    engine = create_engine(settings.DATABASE_URL)
    inspector = inspect(engine)

    # Check if reports table exists
    tables = inspector.get_table_names()
    if 'reports' not in tables:
        print("✓ Reports table doesn't exist yet, will be created with user_id")
        return True

    # Check if user_id column already exists
    columns = [col['name'] for col in inspector.get_columns('reports')]
    if 'user_id' in columns:
        print("✓ user_id column already exists in reports table")
        return True

    print("Adding user_id column to reports table...")
    try:
        with engine.connect() as conn:
            # Add user_id column
            conn.execute(text(
                "ALTER TABLE reports ADD COLUMN user_id INTEGER"
            ))
            conn.commit()
            print("✓ Successfully added user_id column to reports table")
            return True
    except Exception as e:
        print(f"✗ Error adding user_id column: {e}")
        return False

if __name__ == "__main__":
    migrate_add_user_id_to_reports()
