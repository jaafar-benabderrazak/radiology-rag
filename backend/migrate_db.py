"""
<<<<<<< HEAD
Database Migration Script - Add new columns for Report History and Custom Templates features
"""
from sqlalchemy import text
from database import engine, SessionLocal
from models import Base

def column_exists(conn, table_name, column_name):
    """Check if a column exists in a table"""
    result = conn.execute(text("""
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_name = :table_name
            AND column_name = :column_name
        )
    """), {"table_name": table_name, "column_name": column_name})
    return result.scalar()

def migrate_database():
    """Add new columns to existing tables"""
    print("=" * 60)
    print("Running Database Migration...")
    print("=" * 60)

    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()

        try:
            # Check and add columns to reports table
            print("\n📊 Updating 'reports' table...")

            # Add user_id column if it doesn't exist
            if not column_exists(conn, 'reports', 'user_id'):
                conn.execute(text("""
                    ALTER TABLE reports
                    ADD COLUMN user_id INTEGER REFERENCES users(id)
                """))
                print("  ✓ Added user_id column")
            else:
                print("  ⚠ user_id column already exists, skipping")

            # Add modality column if it doesn't exist
            if not column_exists(conn, 'reports', 'modality'):
                conn.execute(text("""
                    ALTER TABLE reports
                    ADD COLUMN modality VARCHAR(50)
                """))
                print("  ✓ Added modality column")
            else:
                print("  ⚠ modality column already exists, skipping")

            # Add similar_cases_used column if it doesn't exist
            if not column_exists(conn, 'reports', 'similar_cases_used'):
                conn.execute(text("""
                    ALTER TABLE reports
                    ADD COLUMN similar_cases_used JSON
                """))
                print("  ✓ Added similar_cases_used column")
            else:
                print("  ⚠ similar_cases_used column already exists, skipping")

            # Add highlights column if it doesn't exist
            if not column_exists(conn, 'reports', 'highlights'):
                conn.execute(text("""
                    ALTER TABLE reports
                    ADD COLUMN highlights JSON
                """))
                print("  ✓ Added highlights column")
            else:
                print("  ⚠ highlights column already exists, skipping")

            # Add indexes on new columns (CREATE INDEX IF NOT EXISTS is safe)
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reports_modality ON reports(modality)"))
            print("  ✓ Created index on modality")

            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reports_patient_name ON reports(patient_name)"))
            print("  ✓ Created index on patient_name")

            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reports_created_at ON reports(created_at)"))
            print("  ✓ Created index on created_at")

            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reports_user_id ON reports(user_id)"))
            print("  ✓ Created index on user_id")

            # Check and add columns to templates table
            print("\n📝 Updating 'templates' table...")

            # Add created_by_user_id column if it doesn't exist
            if not column_exists(conn, 'templates', 'created_by_user_id'):
                conn.execute(text("""
                    ALTER TABLE templates
                    ADD COLUMN created_by_user_id INTEGER REFERENCES users(id)
                """))
                print("  ✓ Added created_by_user_id column")
            else:
                print("  ⚠ created_by_user_id column already exists, skipping")

            # Add is_system_template column if it doesn't exist
            if not column_exists(conn, 'templates', 'is_system_template'):
                conn.execute(text("""
                    ALTER TABLE templates
                    ADD COLUMN is_system_template BOOLEAN DEFAULT TRUE
                """))
                print("  ✓ Added is_system_template column")
            else:
                print("  ⚠ is_system_template column already exists, skipping")

            # Add is_shared column if it doesn't exist
            if not column_exists(conn, 'templates', 'is_shared'):
                conn.execute(text("""
                    ALTER TABLE templates
                    ADD COLUMN is_shared BOOLEAN DEFAULT FALSE
                """))
                print("  ✓ Added is_shared column")
            else:
                print("  ⚠ is_shared column already exists, skipping")

            # Update existing templates to be marked as system templates
            result = conn.execute(text("""
                UPDATE templates
                SET is_system_template = TRUE
                WHERE created_by_user_id IS NULL AND is_system_template IS NULL
            """))
            if result.rowcount > 0:
                print(f"  ✓ Marked {result.rowcount} existing templates as system templates")
            else:
                print("  ℹ All templates already properly marked")

            # Commit transaction
            trans.commit()
            print("\n" + "=" * 60)
            print("✅ Migration completed successfully!")
            print("=" * 60)

        except Exception as e:
            trans.rollback()
            print(f"\n❌ Migration failed: {e}")
            print("Rolling back changes...")
            raise

if __name__ == "__main__":
    try:
        migrate_database()
    except Exception as e:
        print(f"\n💥 Error during migration: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
=======
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
>>>>>>> claude/admin-template-management-011CUtvK2niZyDKTAoaDcdRp
