"""
Migrate data from SQLite to Supabase PostgreSQL

This script safely migrates all data from your local SQLite database
to your Supabase PostgreSQL database, preserving all relationships and data integrity.

Usage:
    1. Set SUPABASE_DATABASE_URL in .env file
    2. Run: python migrate_sqlite_to_supabase.py
"""

import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, User, Template, Report, CriticalFinding, Notification, DICOMFile
import json

# ANSI color codes for pretty output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(70)}{Colors.END}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✓ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}✗ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ {text}{Colors.END}")

def get_table_count(session, model):
    """Get count of records in a table"""
    try:
        return session.query(model).count()
    except:
        return 0

def migrate_sqlite_to_supabase():
    """Main migration function"""

    print_header("SQLite to Supabase Migration Tool")

    # Get database URLs
    sqlite_url = "sqlite:///./radiology_db.sqlite"
    supabase_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")

    if not supabase_url:
        print_error("SUPABASE_DATABASE_URL or DATABASE_URL not set in environment")
        print_info("Please set your Supabase connection string:")
        print("  export SUPABASE_DATABASE_URL='postgresql://postgres:...'")
        sys.exit(1)

    # Check if SQLite database exists
    if not os.path.exists("radiology_db.sqlite"):
        print_error("SQLite database not found: radiology_db.sqlite")
        print_info("No data to migrate. You can proceed with Supabase initialization.")
        sys.exit(1)

    # Display connection info
    print_info(f"Source (SQLite): {sqlite_url}")
    print_info(f"Destination (Supabase): {supabase_url.split('@')[1] if '@' in supabase_url else 'unknown'}")

    # Confirmation prompt
    print(f"\n{Colors.YELLOW}{Colors.BOLD}WARNING:{Colors.END} This will:")
    print("  1. Copy all data from SQLite to Supabase")
    print("  2. Existing data in Supabase will be preserved (no deletion)")
    print("  3. Duplicate records will be skipped based on unique constraints")

    response = input(f"\n{Colors.BOLD}Continue with migration? (yes/no): {Colors.END}").strip().lower()
    if response != 'yes':
        print_warning("Migration cancelled by user")
        sys.exit(0)

    print_header("Connecting to Databases")

    try:
        # Create SQLite engine (source)
        print_info("Connecting to SQLite database...")
        sqlite_engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        SqliteSession = sessionmaker(bind=sqlite_engine)
        sqlite_session = SqliteSession()
        print_success("Connected to SQLite database")

        # Create Supabase engine (destination)
        print_info("Connecting to Supabase database...")
        supabase_engine = create_engine(
            supabase_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )

        # Test connection
        with supabase_engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print_success(f"Connected to Supabase: {version.split(',')[0]}")

        SupabaseSession = sessionmaker(bind=supabase_engine)
        supabase_session = SupabaseSession()

    except Exception as e:
        print_error(f"Database connection failed: {e}")
        sys.exit(1)

    # Create tables in Supabase if they don't exist
    print_header("Preparing Supabase Database")

    try:
        print_info("Creating tables in Supabase (if not exists)...")
        Base.metadata.create_all(bind=supabase_engine)
        print_success("Tables created/verified successfully")
    except Exception as e:
        print_error(f"Failed to create tables: {e}")
        sys.exit(1)

    # Get counts before migration
    print_header("Pre-Migration Database Summary")

    models = [
        ("Users", User),
        ("Templates", Template),
        ("Reports", Report),
        ("Critical Findings", CriticalFinding),
        ("Notifications", Notification),
        ("DICOM Files", DICOMFile)
    ]

    print(f"\n{Colors.BOLD}{'Table':<20} {'SQLite':<15} {'Supabase':<15}{Colors.END}")
    print("-" * 50)

    migration_plan = []
    for name, model in models:
        sqlite_count = get_table_count(sqlite_session, model)
        supabase_count = get_table_count(supabase_session, model)
        print(f"{name:<20} {sqlite_count:<15} {supabase_count:<15}")
        migration_plan.append((name, model, sqlite_count))

    total_records = sum(count for _, _, count in migration_plan)

    if total_records == 0:
        print_warning("\nNo data found in SQLite database. Nothing to migrate.")
        sys.exit(0)

    print(f"\n{Colors.BOLD}Total records to migrate: {total_records}{Colors.END}")

    # Start migration
    print_header("Starting Data Migration")

    migrated_counts = {}
    skipped_counts = {}
    error_counts = {}

    # Migration order (respects foreign key dependencies)
    for table_name, model, sqlite_count in migration_plan:
        if sqlite_count == 0:
            print_info(f"Skipping {table_name} (no records)")
            continue

        print(f"\n{Colors.BOLD}Migrating {table_name}...{Colors.END}")

        try:
            # Fetch all records from SQLite
            records = sqlite_session.query(model).all()

            migrated = 0
            skipped = 0
            errors = 0

            for record in records:
                try:
                    # Create a dictionary of the record's data
                    record_dict = {}
                    for column in model.__table__.columns:
                        value = getattr(record, column.name)
                        record_dict[column.name] = value

                    # Check if record already exists in Supabase
                    # For users and templates, check by email/template_id
                    if model == User:
                        existing = supabase_session.query(model).filter(
                            model.email == record.email
                        ).first()
                    elif model == Template:
                        existing = supabase_session.query(model).filter(
                            model.template_id == record.template_id
                        ).first()
                    else:
                        # For other models, check by ID
                        existing = supabase_session.query(model).filter(
                            model.id == record.id
                        ).first()

                    if existing:
                        skipped += 1
                        continue

                    # Create new record in Supabase
                    new_record = model(**record_dict)
                    supabase_session.add(new_record)
                    supabase_session.flush()  # Flush but don't commit yet
                    migrated += 1

                except Exception as e:
                    errors += 1
                    print_error(f"  Error migrating record: {e}")
                    supabase_session.rollback()

            # Commit all records for this table
            try:
                supabase_session.commit()
                print_success(f"Migrated {migrated} records, skipped {skipped} duplicates, {errors} errors")
            except Exception as e:
                print_error(f"Failed to commit {table_name}: {e}")
                supabase_session.rollback()
                errors += migrated
                migrated = 0

            migrated_counts[table_name] = migrated
            skipped_counts[table_name] = skipped
            error_counts[table_name] = errors

        except Exception as e:
            print_error(f"Failed to migrate {table_name}: {e}")
            error_counts[table_name] = sqlite_count

    # Post-migration summary
    print_header("Post-Migration Database Summary")

    print(f"\n{Colors.BOLD}{'Table':<20} {'Migrated':<15} {'Skipped':<15} {'Errors':<15}{Colors.END}")
    print("-" * 65)

    total_migrated = 0
    total_skipped = 0
    total_errors = 0

    for name, model in [(n, m) for n, m, _ in migration_plan]:
        migrated = migrated_counts.get(name, 0)
        skipped = skipped_counts.get(name, 0)
        errors = error_counts.get(name, 0)

        total_migrated += migrated
        total_skipped += skipped
        total_errors += errors

        print(f"{name:<20} {migrated:<15} {skipped:<15} {errors:<15}")

    print("-" * 65)
    print(f"{'TOTAL':<20} {total_migrated:<15} {total_skipped:<15} {total_errors:<15}")

    # Verify final counts
    print_header("Verifying Migration")

    print(f"\n{Colors.BOLD}{'Table':<20} {'Supabase Count':<15} {'Expected':<15}{Colors.END}")
    print("-" * 50)

    all_verified = True
    for name, model, original_count in migration_plan:
        final_count = get_table_count(supabase_session, model)
        expected = original_count + get_table_count(supabase_session, model) - migrated_counts.get(name, 0)

        status = "✓" if final_count > 0 or original_count == 0 else "✗"
        print(f"{name:<20} {final_count:<15} {status}")

        if original_count > 0 and final_count == 0:
            all_verified = False

    # Final summary
    print_header("Migration Complete")

    if total_errors == 0 and total_migrated > 0:
        print_success(f"Successfully migrated {total_migrated} records to Supabase!")
    elif total_errors > 0:
        print_warning(f"Migration completed with {total_errors} errors")
        print_info("Check the error messages above for details")
    else:
        print_info("No new records to migrate")

    if total_skipped > 0:
        print_info(f"Skipped {total_skipped} duplicate records")

    print(f"\n{Colors.BOLD}Next steps:{Colors.END}")
    print("  1. Verify your data in Supabase Dashboard > Database > Table Editor")
    print("  2. Test your application with the Supabase database")
    print("  3. Update your .env file to use SUPABASE_DATABASE_URL")
    print("  4. (Optional) Keep SQLite as backup: mv radiology_db.sqlite radiology_db.sqlite.backup")
    print()

    # Cleanup
    sqlite_session.close()
    supabase_session.close()
    sqlite_engine.dispose()
    supabase_engine.dispose()

if __name__ == "__main__":
    try:
        migrate_sqlite_to_supabase()
    except KeyboardInterrupt:
        print_warning("\nMigration interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
