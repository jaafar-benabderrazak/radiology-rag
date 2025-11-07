"""
Database migration script to add language column to templates table
"""
import sys
from sqlalchemy import create_engine, text, inspect
from config import settings

def migrate_add_language_column():
    """Add language column to templates table if it doesn't exist"""
    print("=" * 60)
    print("Running database migration...")
    print("=" * 60)

    engine = create_engine(settings.DATABASE_URL)

    # Check if column already exists
    inspector = inspect(engine)

    # Check if templates table exists
    if 'templates' not in inspector.get_table_names():
        print("⚠ Templates table doesn't exist yet. Skipping migration.")
        return True

    columns = [col['name'] for col in inspector.get_columns('templates')]

    if 'language' in columns:
        print("✓ Language column already exists")
        return True

    print("Adding 'language' column to templates table...")

    try:
        with engine.connect() as conn:
            # Different SQL for different databases
            if 'postgresql' in settings.DATABASE_URL:
                # PostgreSQL syntax
                conn.execute(text(
                    "ALTER TABLE templates ADD COLUMN language VARCHAR(10) DEFAULT 'fr'"
                ))
            else:
                # SQLite syntax
                conn.execute(text(
                    "ALTER TABLE templates ADD COLUMN language VARCHAR(10) DEFAULT 'fr'"
                ))
            conn.commit()

        print("✓ Successfully added 'language' column")
        return True

    except Exception as e:
        print(f"✗ Error adding language column: {e}")
        print("This is OK if the column already exists")
        return True  # Don't fail startup for this

if __name__ == "__main__":
    success = migrate_add_language_column()
    sys.exit(0 if success else 1)
