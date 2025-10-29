"""Initialize database with tables and seed data"""
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings
from database import Base
from models import Template
from template_loader import load_templates_from_files, DEFAULT_TEMPLATES
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
            return

        # Try to load templates from .docx files
        print("Loading templates from files...")
        templates_data = load_templates_from_files()

        # If no templates found in files, use defaults
        if not templates_data:
            print("⚠ No template files found, using default templates")
            templates_data = DEFAULT_TEMPLATES

        print(f"Seeding {len(templates_data)} templates...")

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
