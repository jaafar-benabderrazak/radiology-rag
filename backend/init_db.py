"""Initialize database with tables and seed data"""
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings
from database import Base
from models import Template, User, UserRole
from template_loader import load_templates_from_files
from auth import get_password_hash
import json

def init_database():
    """Create all tables and seed initial data"""
    print(f"Connecting to database: {settings.DATABASE_URL}")

    # Create engine
    engine = create_engine(settings.DATABASE_URL)

    # Create all tables
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created successfully")

    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Check if templates already exist
        existing = db.query(Template).count()
        if existing > 0:
            print(f"✓ Database already has {existing} templates")
        else:
            # Load templates from .docx files ONLY
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
        # If they exist, update their passwords to ensure compatibility with current hashing
        print("\nChecking for default users...")
        admin_email = "admin@radiology.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()

        if not existing_admin:
            print("Creating admin user...")
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
            print(f"\nAdmin credentials:")
            print(f"  Email: {admin_email}")
            print(f"  Password: admin123")
            print(f"\n⚠️  IMPORTANT: Change the admin password after first login!")
        else:
            print("✓ Admin user already exists")
            # Update password to ensure it's using the current hashing method
            print("  Updating admin password to ensure compatibility...")
            existing_admin.hashed_password = get_password_hash("admin123")
            db.commit()
            print("  ✓ Admin password updated")

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
            print(f"\nDoctor credentials:")
            print(f"  Email: {doctor_email}")
            print(f"  Password: doctor123")
        else:
            print("✓ Sample doctor user already exists")
            # Update password to ensure it's using the current hashing method
            print("  Updating doctor password to ensure compatibility...")
            existing_doctor.hashed_password = get_password_hash("doctor123")
            db.commit()
            print("  ✓ Doctor password updated")

    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

    print("\n✓ Database initialization complete!")

if __name__ == "__main__":
    init_database()
