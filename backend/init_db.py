"""Initialize database with tables and seed data"""
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings
from database import Base
from models import Template
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

        # Seed initial templates
        print("Seeding initial templates...")

        templates_data = [
            {
                "template_id": "ctpa_pe",
                "title": "CT Pulmonary Angiography – Pulmonary Embolism (Formal)",
                "keywords": ["ctpa", "pulmonary embolism", "pe", "angiography", "shortness of breath", "dyspnea", "pleuritic"],
                "category": "CT",
                "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: CT Pulmonary Angiography
Body Part: Chest
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Helical acquisition from lung apices to bases following IV contrast with bolus tracking. Multiplanar reconstructions performed. Adequate opacification of the pulmonary arteries.

Findings:
• Pulmonary arteries: <fill concisely>
• Right heart strain: <fill concisely>
• Lungs and pleura: <fill concisely>
• Mediastinum: <fill concisely or Unremarkable>
• Upper abdomen: <fill concisely or Unremarkable>
• Incidental findings: <None or list>

Comparison: <None available or describe>

Impression:
1) <main conclusion>
2) <secondary, if applicable>

Signed electronically by {doctor_name}, {study_datetime}
"""
            },
            {
                "template_id": "cxr_normal",
                "title": "Chest X-ray – Normal (Formal)",
                "keywords": ["cxr", "xray", "x-ray", "radiograph", "chest", "thorax", "pa", "lateral"],
                "category": "X-Ray",
                "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: Chest X-ray (PA/Lateral)
Body Part: Chest
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Standard PA and lateral projections.

Findings:
• Cardiomediastinal silhouette within normal limits.
• Lungs: <fill>
• Pleura: <fill>
• Bones: <fill>

Impression:
<one-line normal or key findings>

Signed electronically by {doctor_name}, {study_datetime}
"""
            },
            {
                "template_id": "us_ruq",
                "title": "Ultrasound – Abdomen RUQ (Formal)",
                "keywords": ["ultrasound", "us", "ruq", "gallbladder", "cholelithiasis", "biliary"],
                "category": "Ultrasound",
                "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: Ultrasound – Abdomen (RUQ)
Body Part: Right upper quadrant
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Real-time ultrasound with grayscale and color Doppler as appropriate.

Findings:
• Liver: <fill>
• Gallbladder: <fill>
• Bile ducts: <fill>
• Pancreas: <fill>
• Right kidney: <fill>

Impression:
<concise overall>

Signed electronically by {doctor_name}, {study_datetime}
"""
            }
        ]

        for tpl_data in templates_data:
            template = Template(**tpl_data)
            db.add(template)

        db.commit()
        print(f"✓ Seeded {len(templates_data)} templates successfully")

    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

    print("\n✓ Database initialization complete!")

if __name__ == "__main__":
    init_database()
