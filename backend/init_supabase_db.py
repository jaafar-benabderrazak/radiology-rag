"""Initialize Supabase PostgreSQL database with tables and seed data"""
import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import settings
from database import Base
from models import Template, User, UserRole
from template_loader import load_templates_from_files
from auth import get_password_hash
import time

def test_supabase_connection(database_url: str, max_retries: int = 5) -> bool:
    """Test connection to Supabase with retries"""
    print("Testing Supabase connection...")

    for attempt in range(max_retries):
        try:
            engine = create_engine(database_url, pool_pre_ping=True)
            with engine.connect() as conn:
                result = conn.execute(text("SELECT version();"))
                version = result.fetchone()[0]
                print(f"✓ Successfully connected to PostgreSQL: {version}")
                engine.dispose()
                return True
        except Exception as e:
            print(f"Connection attempt {attempt + 1}/{max_retries} failed: {e}")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                print(f"✗ Failed to connect after {max_retries} attempts")
                return False

    return False

def init_supabase_database():
    """Create all tables and seed initial data in Supabase"""

    # Get database URL from environment
    database_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")

    if not database_url:
        print("✗ Error: SUPABASE_DATABASE_URL or DATABASE_URL environment variable not set")
        print("\nPlease set one of the following:")
        print("  export SUPABASE_DATABASE_URL='postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres'")
        print("  or")
        print("  export DATABASE_URL='postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres'")
        sys.exit(1)

    # Mask password for display
    display_url = database_url.split('@')[1] if '@' in database_url else database_url
    print(f"\n{'='*60}")
    print(f"Initializing Supabase Database")
    print(f"{'='*60}")
    print(f"Connection: {display_url}")

    # Test connection first
    if not test_supabase_connection(database_url):
        sys.exit(1)

    # Create engine with Supabase-optimized settings
    print("\nCreating database engine with connection pooling...")
    engine = create_engine(
        database_url,
        pool_pre_ping=True,          # Verify connections before using
        pool_size=10,                # Connection pool size (Supabase free tier supports ~60 connections)
        max_overflow=20,             # Allow up to 30 total connections
        pool_recycle=300,            # Recycle connections every 5 minutes
        connect_args={
            "connect_timeout": 10,
            "options": "-c statement_timeout=30000"  # 30 second query timeout
        },
        echo=False  # Set to True for SQL debugging
    )

    # Create all tables
    print("\nCreating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully")
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Check if templates already exist
        print("\nChecking for existing templates...")
        existing = db.query(Template).count()
        if existing > 0:
            print(f"✓ Database already has {existing} templates")
        else:
            # Load templates from .docx files
            print("Loading templates from .docx files in /app/templates/...")
            templates_data = load_templates_from_files()

            if templates_data:
                print(f"Seeding {len(templates_data)} templates from files...")

                for tpl_data in templates_data:
                    template = Template(**tpl_data)
                    db.add(template)

                db.commit()
                print(f"✓ Seeded {len(templates_data)} templates successfully")

                # Print loaded templates
                print("\nLoaded templates:")
                for tpl in templates_data:
                    print(f"  - {tpl['template_id']}: {tpl['title']}")
                    print(f"    Keywords: {', '.join(tpl['keywords'][:5])}")
                    print(f"    Category: {tpl.get('category', 'General')}")
            else:
                print("⚠ No .docx template files found in /app/templates/")
                print("ℹ️  You can add templates later via the application UI")

        # Create default users if they don't exist
        print("\n" + "="*60)
        print("Setting up default users...")
        print("="*60)

        admin_email = "admin@radiology.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()

        if not existing_admin:
            print("\nCreating admin user...")
            admin_user = User(
                email=admin_email,
                username="admin",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                hospital_name="Radiology System",
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
            print("✓ Admin user created successfully")
            print(f"\n{'='*60}")
            print(f"Admin Credentials:")
            print(f"{'='*60}")
            print(f"  Email:    {admin_email}")
            print(f"  Password: admin123")
            print(f"\n⚠️  IMPORTANT: Change the admin password after first login!")
            print(f"{'='*60}")
        else:
            print("✓ Admin user already exists")

        # Create a sample doctor user
        doctor_email = "doctor@hospital.com"
        existing_doctor = db.query(User).filter(User.email == doctor_email).first()

        if not existing_doctor:
            print("\nCreating sample doctor user...")
            doctor_user = User(
                email=doctor_email,
                username="doctor1",
                full_name="Dr. John Smith",
                hashed_password=get_password_hash("doctor123"),
                role=UserRole.DOCTOR,
                hospital_name="General Hospital",
                specialization="Radiology",
                license_number="RAD-12345",
                is_active=True,
                is_verified=True
            )
            db.add(doctor_user)
            db.commit()
            print("✓ Sample doctor user created successfully")
            print(f"\n{'='*60}")
            print(f"Doctor Credentials:")
            print(f"{'='*60}")
            print(f"  Email:    {doctor_email}")
            print(f"  Password: doctor123")
            print(f"{'='*60}")
        else:
            print("✓ Sample doctor user already exists")

        # Verify table creation
        print("\n" + "="*60)
        print("Database Summary:")
        print("="*60)
        with engine.connect() as conn:
            # Get all tables
            tables_result = conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = [row[0] for row in tables_result]
            print(f"Tables created: {len(tables)}")
            for table in tables:
                print(f"  - {table}")

            # Get user count
            user_count = db.query(User).count()
            template_count = db.query(Template).count()
            print(f"\nData summary:")
            print(f"  Users: {user_count}")
            print(f"  Templates: {template_count}")

    except Exception as e:
        print(f"\n✗ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()
        engine.dispose()

    print("\n" + "="*60)
    print("✓ Supabase Database initialization complete!")
    print("="*60)
    print("\nNext steps:")
    print("  1. Change the admin password after first login")
    print("  2. Configure your .env file with SUPABASE_DATABASE_URL")
    print("  3. Start your application with the Supabase database")
    print("\nFor production deployment:")
    print("  - Enable Row Level Security (RLS) in Supabase dashboard")
    print("  - Set up connection pooling via Supabase pooler")
    print("  - Configure automatic backups in Supabase settings")
    print("  - Monitor database performance in Supabase dashboard")
    print("="*60 + "\n")

if __name__ == "__main__":
    init_supabase_database()
