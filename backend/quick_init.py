"""Quick database initialization without heavy dependencies"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import bcrypt

# Simple config
DATABASE_URL = "sqlite:///./radiology_db.sqlite"

# Import models
from models import Base, User, UserRole, Template

def get_password_hash(password: str) -> str:
    """Hash a password"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def init_quick():
    """Quick init"""
    print(f"Creating database: {DATABASE_URL}")

    # Create engine
    engine = create_engine(DATABASE_URL)

    # Create all tables
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables created")

    # Create session
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        # Check for admin user
        admin_email = "admin@radiology.com"
        existing = db.query(User).filter(User.email == admin_email).first()

        if not existing:
            print("Creating admin user...")
            admin = User(
                email=admin_email,
                username="admin",
                full_name="Admin User",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                hospital_name="VitaScribe",
                is_active=True,
                is_verified=True
            )
            db.add(admin)
            db.commit()
            print("✓ Admin created")
            print(f"\nLogin with:")
            print(f"  Email: {admin_email}")
            print(f"  Password: admin123")
        else:
            print("✓ Admin already exists")

        # Create a demo template
        existing_tpl = db.query(Template).count()
        if existing_tpl == 0:
            print("Creating demo template...")
            demo_template = Template(
                template_id="chest-xray-normal",
                title="Chest X-Ray - Normal",
                keywords=["chest", "xray", "normal", "lungs", "heart"],
                skeleton="""FINDINGS:
The heart size is normal. The mediastinal contours are unremarkable. The lungs are clear without consolidation, effusion, or pneumothorax. No acute osseous abnormalities.

IMPRESSION:
No acute cardiopulmonary abnormality.""",
                category="Chest Imaging",
                language="en",
                is_active=True
            )
            db.add(demo_template)
            db.commit()
            print("✓ Demo template created")

    finally:
        db.close()

    print("\n✓ Database ready!")

if __name__ == "__main__":
    init_quick()
