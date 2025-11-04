"""
Database Migration Script - Add new columns for Report History and Custom Templates features
"""
from sqlalchemy import text
from database import engine, SessionLocal
from models import Base

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
            try:
                conn.execute(text("""
                    ALTER TABLE reports
                    ADD COLUMN user_id INTEGER REFERENCES users(id)
                """))
                print("  ✓ Added user_id column")
            except Exception as e:
                if "already exists" in str(e) or "duplicate column" in str(e).lower():
                    print("  ⚠ user_id column already exists, skipping")
                else:
                    raise

            # Add modality column if it doesn't exist
            try:
                conn.execute(text("""
                    ALTER TABLE reports
                    ADD COLUMN modality VARCHAR(50)
                """))
                print("  ✓ Added modality column")
            except Exception as e:
                if "already exists" in str(e) or "duplicate column" in str(e).lower():
                    print("  ⚠ modality column already exists, skipping")
                else:
                    raise

            # Add indexes on new columns
            try:
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reports_modality ON reports(modality)"))
                print("  ✓ Added index on modality")
            except Exception as e:
                print(f"  ⚠ Index creation skipped: {e}")

            try:
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reports_patient_name ON reports(patient_name)"))
                print("  ✓ Added index on patient_name")
            except Exception as e:
                print(f"  ⚠ Index creation skipped: {e}")

            try:
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_reports_created_at ON reports(created_at)"))
                print("  ✓ Added index on created_at")
            except Exception as e:
                print(f"  ⚠ Index creation skipped: {e}")

            # Check and add columns to templates table
            print("\n📝 Updating 'templates' table...")

            # Add created_by_user_id column if it doesn't exist
            try:
                conn.execute(text("""
                    ALTER TABLE templates
                    ADD COLUMN created_by_user_id INTEGER REFERENCES users(id)
                """))
                print("  ✓ Added created_by_user_id column")
            except Exception as e:
                if "already exists" in str(e) or "duplicate column" in str(e).lower():
                    print("  ⚠ created_by_user_id column already exists, skipping")
                else:
                    raise

            # Add is_system_template column if it doesn't exist
            try:
                conn.execute(text("""
                    ALTER TABLE templates
                    ADD COLUMN is_system_template BOOLEAN DEFAULT TRUE
                """))
                print("  ✓ Added is_system_template column")
            except Exception as e:
                if "already exists" in str(e) or "duplicate column" in str(e).lower():
                    print("  ⚠ is_system_template column already exists, skipping")
                else:
                    raise

            # Add is_shared column if it doesn't exist
            try:
                conn.execute(text("""
                    ALTER TABLE templates
                    ADD COLUMN is_shared BOOLEAN DEFAULT FALSE
                """))
                print("  ✓ Added is_shared column")
            except Exception as e:
                if "already exists" in str(e) or "duplicate column" in str(e).lower():
                    print("  ⚠ is_shared column already exists, skipping")
                else:
                    raise

            # Update existing templates to be marked as system templates
            try:
                result = conn.execute(text("""
                    UPDATE templates
                    SET is_system_template = TRUE
                    WHERE created_by_user_id IS NULL
                """))
                print(f"  ✓ Marked {result.rowcount} existing templates as system templates")
            except Exception as e:
                print(f"  ⚠ Update skipped: {e}")

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
