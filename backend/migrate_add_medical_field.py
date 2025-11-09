"""
Migration script to add medical_field column to templates table
"""
from sqlalchemy import create_engine, text
from config import settings

DATABASE_URL = settings.DATABASE_URL

def migrate():
    """Add medical_field column to templates table"""
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        # Check if column already exists
        result = conn.execute(text("""
            SELECT COUNT(*)
            FROM pragma_table_info('templates')
            WHERE name='medical_field'
        """))
        exists = result.scalar() > 0

        if exists:
            print("✓ medical_field column already exists")
            return

        print("Adding medical_field column to templates table...")

        # Add the column with default value
        conn.execute(text("""
            ALTER TABLE templates
            ADD COLUMN medical_field VARCHAR(50) NOT NULL DEFAULT 'radiology'
        """))

        conn.commit()
        print("✓ medical_field column added successfully")
        print("  All existing templates set to 'radiology' field")

if __name__ == "__main__":
    migrate()
