# main.py
import os
from pathlib import Path
from typing import List, Optional, Literal
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime

# Google Generative AI
import google.generativeai as genai

# Local imports
from config import settings
from database import get_db, Base, engine
from models import Template, Report, User, CriticalNotification, NotificationStatus, NotificationPriority
from cache_service import cache
from vector_service import vector_service
from document_generator import DocumentGenerator, PDFConverter
from ai_analysis_service import ai_analysis_service
from auth import get_current_active_user, get_current_admin_user
from routers import auth_router, users_router, reports_router, templates_router, suggestions_router, notifications_router, backup_router, voice_router, dicom_router
from critical_findings_detector import critical_detector
from notification_service import notification_service

# Configure Gemini
if not settings.GEMINI_API_KEY:
    raise RuntimeError("Set GEMINI_API_KEY (or GOOGLE_API_KEY) in environment/.env")

genai.configure(api_key=settings.GEMINI_API_KEY)

# --- FastAPI app with CORS ---
app = FastAPI(title="Radiology RAG API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication routers
app.include_router(auth_router.router)
app.include_router(users_router.router)

# Include new feature routers
app.include_router(reports_router.router)
app.include_router(templates_router.router)
app.include_router(suggestions_router.router)
app.include_router(notifications_router.router)
app.include_router(backup_router.router)
app.include_router(voice_router.router)
app.include_router(dicom_router.router)

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    import logging
    from template_loader import load_templates_from_files
    from auth import get_password_hash
    from sqlalchemy.orm import Session

    logger = logging.getLogger(__name__)

    print("=" * 60)
    print("Starting Radiology RAG Backend...")
    print("=" * 60)

    # Force recreate database tables to ensure schema is up-to-date
    # This is safe for ephemeral deployments (Replit, Cloud Run)
    try:
        print("Recreating database tables...")
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created with latest schema")

        # Load templates after creating tables
        from database import SessionLocal
        db = SessionLocal()
        try:
            print("Loading templates from .docx files...")
            templates_data = load_templates_from_files()

            if templates_data:
                for tpl_data in templates_data:
                    template = Template(**tpl_data)
                    db.add(template)
                db.commit()
                print(f"✓ Loaded {len(templates_data)} templates")
            else:
                print("⚠ No template files found (will use empty database)")

            # Create default admin user
            admin_user = User(
                email="admin@radiology.com",
                username="admin",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                is_active=True,
                is_verified=True
            )
            db.add(admin_user)

            # Create default doctor user
            doctor_user = User(
                email="doctor@hospital.com",
                username="doctor1",
                full_name="Dr. John Smith",
                hashed_password=get_password_hash("doctor123"),
                role="doctor",
                hospital_name="General Hospital",
                is_active=True,
                is_verified=True
            )
            db.add(doctor_user)
            db.commit()
            print("✓ Default users created (admin/admin123, doctor/doctor123)")

        except Exception as e:
            print(f"⚠ Template/user loading warning: {e}")
            db.rollback()
        finally:
            db.close()

    except Exception as e:
        print(f"⚠ Database initialization warning: {e}")
        # Try to create tables even if drop fails (for first run)
        Base.metadata.create_all(bind=engine, checkfirst=True)
        print("✓ Database tables ready")

    # Initialize services (already done in their constructors)
    print("✓ Cache service initialized")
    print("✓ Vector service initialized")
    print("✓ Authentication system ready")

    print("=" * 60)
    print("Backend ready!")
    print("=" * 60)

# ---------- Request/Response models ----------
class Meta(BaseModel):
    doctorName: Optional[str] = "Dr. John Doe"
    hospitalName: Optional[str] = "General Hospital"
    referrer: Optional[str] = "—"
    patient_name: Optional[str] = "[Name not provided]"
    study_datetime: Optional[str] = None
    accession: Optional[str] = "CR-000001"

class GenerateRequest(BaseModel):
    input: str
    templateId: Optional[str] = "auto"  # Changed to Optional[str] for flexibility
    meta: Optional[Meta] = None
    use_rag: bool = True  # Enable RAG by default for auto mode

class GenerateResponse(BaseModel):
    report: str
    templateTitle: str
    templateId: str
    highlights: List[str] = []
    similar_cases: List[dict] = []
    report_id: Optional[int] = None  # ID of the saved report
    critical_findings: Optional[dict] = None  # Critical findings detection results

class TemplateResponse(BaseModel):
    id: int
    template_id: str
    title: str
    keywords: List[str]
    category: Optional[str]

class TemplateDetailResponse(BaseModel):
    id: int
    template_id: str
    title: str
    keywords: List[str]
    skeleton: str
    category: Optional[str]
    language: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

class TemplateCreateRequest(BaseModel):
    template_id: str
    title: str
    keywords: List[str]
    skeleton: str
    category: Optional[str] = None
    language: Optional[str] = 'fr'
    is_active: bool = True

class TemplateUpdateRequest(BaseModel):
    title: Optional[str] = None
    keywords: Optional[List[str]] = None
    skeleton: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    is_active: Optional[bool] = None

class ReportHistoryResponse(BaseModel):
    id: int
    patient_name: Optional[str]
    accession: Optional[str]
    indication: str
    template_title: str
    created_at: datetime

# ---------- Helper Functions ----------
SYSTEM_INSTRUCTIONS = (
    "You are a professional radiology reporting assistant. "
    "CRITICAL: You MUST follow the provided template structure EXACTLY. "
    "Rules:\n"
    "1. Keep ALL sections, headers, and formatting from the template\n"
    "2. Replace ALL placeholders like <fill>, <à remplir>, <concisely>, etc. with actual clinical findings\n"
    "3. Fill EVERY section - do NOT leave any <placeholders> unfilled\n"
    "4. Do NOT skip any sections from the template\n"
    "5. Do NOT add extra sections not in the template\n"
    "6. Use professional medical terminology appropriate for formal radiology reports\n"
    "7. Base your findings on the clinical indication provided\n"
    "8. Use negative findings when appropriate (e.g., 'No evidence of pulmonary embolism', 'Pas de signe de...', 'Normal')\n"
    "9. Be concise but complete in each section\n"
    "10. Do NOT include markdown formatting, code blocks, or backticks\n"
    "Output ONLY the completed report with all placeholders filled."
)

def choose_template_auto(text: str, db: Session) -> Optional[Template]:
    """
    Auto-select template based on keywords with intelligent scoring

    Uses weighted keyword matching to prioritize:
    - Anatomical terms (highest priority)
    - Specific medical terms (high priority)
    - Generic terms (lower priority)
    """
    templates = db.query(Template).filter(Template.is_active == True).all()
    if not templates:
        return None

    low = text.lower()

    # Anatomical keywords that should have highest priority
    # These strongly indicate specific body regions/organs
    anatomical_keywords = {
        # Liver/biliary
        'segment', 'segmentaire', 'foie', 'hépatique', 'hepatique', 'biliaire', 'bile',
        'vésicule', 'vesicule', 'cholédoque', 'choledoque', 'voies biliaires',
        # Intestines
        'intestin', 'grêle', 'grele', 'iléon', 'ileon', 'jéjunum', 'jejunum', 'duodénum', 'duodenum',
        'côlon', 'colon', 'rectum', 'sigmoïde', 'sigmoide', 'caecum', 'cecum',
        # Spine
        'vertèbre', 'vertebre', 'rachis', 'cervical', 'thoracique', 'lombaire', 'sacré', 'sacre',
        'disque', 'disc', 'l1', 'l2', 'l3', 'l4', 'l5', 's1', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7',
        # Joints
        'genou', 'cheville', 'épaule', 'epaule', 'coude', 'poignet', 'hanche',
        # Brain
        'cérébr', 'cerebr', 'encéph', 'enceph', 'cerveau',
        # Chest
        'pulmonaire', 'poumon', 'thorax', 'médiastin', 'mediastin',
        # Breast
        'sein', 'mammaire', 'breast',
        # Other
        'rein', 'rénal', 'renal', 'pancréa', 'pancrea', 'rate', 'splén', 'splen'
    }

    # Specific medical terms (medium-high priority)
    specific_keywords = {
        'lésion', 'lesion', 'masse', 'tumeur', 'kyste', 'nodule',
        'sténose', 'stenose', 'dilatation', 'compression', 'hernie',
        'fracture', 'luxation', 'rupture', 'déchirure', 'dechirure',
        'hypodense', 'hyperdense', 'rehaussement', 'enhancement',
        'ischémie', 'ischemie', 'infarctus', 'hémorragie', 'hemorragie'
    }

    def score_template(template: Template) -> float:
        """Calculate weighted score for template match"""
        score = 0.0
        matched_anatomical = 0
        matched_specific = 0
        matched_generic = 0

        for keyword in template.keywords:
            kw_lower = keyword.lower()

            if kw_lower not in low:
                continue

            # Check if keyword is anatomical (highest weight)
            is_anatomical = any(anat in kw_lower for anat in anatomical_keywords)
            if is_anatomical:
                # Anatomical keywords get weight of 10
                score += 10.0
                matched_anatomical += 1
                continue

            # Check if keyword is specific medical term (high weight)
            is_specific = any(spec in kw_lower for spec in specific_keywords)
            if is_specific:
                # Specific medical terms get weight of 3
                score += 3.0
                matched_specific += 1
                continue

            # Generic keyword (baseline weight)
            score += 1.0
            matched_generic += 1

        # Bonus for title match (indicates template is very relevant)
        if template.title.lower() in low or any(word in low for word in template.title.lower().split()):
            score += 5.0

        # Debug logging
        if matched_anatomical > 0 or matched_specific > 0:
            print(f"  {template.title}: score={score:.1f} (anat={matched_anatomical}, spec={matched_specific}, gen={matched_generic})")

        return score

    # Score all templates
    print(f"Auto-selecting template for: {text[:100]}...")
    scored_templates = [(t, score_template(t)) for t in templates]

    # Sort by score (highest first)
    scored_templates.sort(key=lambda x: x[1], reverse=True)

    # Return template with highest score, or None if no matches
    if scored_templates and scored_templates[0][1] > 0:
        best_template = scored_templates[0][0]
        best_score = scored_templates[0][1]
        print(f"✓ Selected: {best_template.title} (score: {best_score:.1f})")
        return best_template

    # Fallback: use simple keyword count
    print("⚠ No good match found, using simple keyword count")
    best = max(templates, key=lambda t: sum(1 for k in t.keywords if k.lower() in low))
    return best

def format_skeleton(skeleton: str, meta: Meta, indication: str) -> str:
    """Format template skeleton with metadata"""
    study_datetime = meta.study_datetime or datetime.now().strftime("%Y-%m-%d %H:%M")

    return skeleton.format(
        doctor_name=meta.doctorName,
        hospital_name=meta.hospitalName,
        referrer=meta.referrer,
        patient_name=meta.patient_name,
        study_datetime=study_datetime,
        accession=meta.accession,
        indication=indication.strip()
    )

# ---------- API Endpoints ----------
# Note: Root endpoint "/" is defined at the bottom of this file
# to serve the frontend after static files are mounted

@app.get("/templates", response_model=List[TemplateResponse])
async def list_templates(db: Session = Depends(get_db)):
    """Get all available templates"""
    templates = db.query(Template).filter(Template.is_active == True).all()
    return [
        TemplateResponse(
            id=t.id,
            template_id=t.template_id,
            title=t.title,
            keywords=t.keywords,
            category=t.category
        )
        for t in templates
    ]

@app.get("/admin/templates", response_model=List[TemplateDetailResponse])
async def list_all_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all templates including inactive ones (admin only)"""
    templates = db.query(Template).order_by(Template.created_at.desc()).all()
    return templates

@app.get("/templates/{template_id}", response_model=TemplateDetailResponse)
async def get_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get template details by ID (admin only)"""
    template = db.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@app.post("/admin/templates", response_model=TemplateDetailResponse, status_code=201)
async def create_template(
    template_data: TemplateCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create a new template (admin only)"""
    # Check if template_id already exists
    existing = db.query(Template).filter(Template.template_id == template_data.template_id).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"Template with ID '{template_data.template_id}' already exists"
        )

    # Create new template
    new_template = Template(
        template_id=template_data.template_id,
        title=template_data.title,
        keywords=template_data.keywords,
        skeleton=template_data.skeleton,
        category=template_data.category,
        language=template_data.language,
        is_active=template_data.is_active,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )

    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return new_template

@app.put("/admin/templates/{template_id}", response_model=TemplateDetailResponse)
async def update_template(
    template_id: str,
    template_data: TemplateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update an existing template (admin only)"""
    template = db.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Update fields if provided
    if template_data.title is not None:
        template.title = template_data.title
    if template_data.keywords is not None:
        template.keywords = template_data.keywords
    if template_data.skeleton is not None:
        template.skeleton = template_data.skeleton
    if template_data.category is not None:
        template.category = template_data.category
    if template_data.language is not None:
        template.language = template_data.language
    if template_data.is_active is not None:
        template.is_active = template_data.is_active

    template.updated_at = datetime.now()

    db.commit()
    db.refresh(template)

    return template

@app.delete("/admin/templates/{template_id}", status_code=204)
async def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Soft delete a template by marking it as inactive (admin only)"""
    template = db.query(Template).filter(Template.template_id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    template.is_active = False
    template.updated_at = datetime.now()

    db.commit()

    return None

@app.post("/generate", response_model=GenerateResponse)
async def generate(
    req: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Generate radiology report from clinical text (requires authentication)"""

    meta = req.meta or Meta()

    # Use current user's information as the reporting radiologist
    if not meta.doctorName or meta.doctorName == "Dr. John Doe":
        meta.doctorName = current_user.full_name
    if not meta.hospitalName or meta.hospitalName == "General Hospital":
        meta.hospitalName = current_user.hospital_name or "General Hospital"

    if not meta.study_datetime:
        meta.study_datetime = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Check cache first
    cache_key_data = {
        "input": req.input,
        "templateId": req.templateId,
        "meta": meta.dict()
    }
    cached_result = cache.get("generate", cache_key_data)
    if cached_result:
        print("✓ Returning cached result")
        return GenerateResponse(**cached_result)

    # Pick template
    template = None
    if req.templateId and req.templateId != "auto":
        template = db.query(Template).filter(
            Template.template_id == req.templateId,
            Template.is_active == True
        ).first()
        if not template:
            raise HTTPException(status_code=404, detail=f"Template '{req.templateId}' not found")
    else:
        # Auto-select template
        template = choose_template_auto(req.input, db)
        if not template:
            raise HTTPException(status_code=404, detail="No suitable template found")

    # Search for similar cases if RAG enabled and in auto mode
    similar_cases = []
    if req.use_rag and req.templateId == "auto":
        similar_cases = vector_service.search_similar_cases(
            query=req.input,
            limit=3,
            category=template.category
        )

    # Format skeleton with metadata
    formatted_skeleton = format_skeleton(template.skeleton, meta, req.input)

    # Compose prompt for Gemini
    user_prompt = f"""
Indication text (verbatim user input):
\"\"\"{req.input.strip()}\"\"\"

Hospital: {meta.hospitalName}
Reporting Radiologist: {meta.doctorName}
Referring Physician: {meta.referrer}
Patient: {meta.patient_name}
Study Date/Time: {meta.study_datetime}
Accession/ID: {meta.accession}
"""

    # Add similar cases context if available
    if similar_cases:
        user_prompt += "\n\nSimilar Cases for Reference:\n"
        for i, case in enumerate(similar_cases, 1):
            user_prompt += f"\n{i}. {case['text'][:200]}... (similarity: {case['score']:.2f})\n"

    # Determine language instruction based on template language
    template_lang = getattr(template, 'language', 'fr')  # Default to French if not set
    language_instructions = {
        'fr': "IMPORTANT: Generate the ENTIRE report in FRENCH. All medical terminology and text must be in French.",
        'en': "IMPORTANT: Generate the ENTIRE report in ENGLISH. All medical terminology and text must be in English.",
        'ar': "IMPORTANT: Generate the ENTIRE report in ARABIC. All medical terminology and text must be in Arabic (right-to-left)."
    }
    lang_instruction = language_instructions.get(template_lang, language_instructions['fr'])

    user_prompt += f"""

{lang_instruction}

INSTRUCTIONS:
You must produce a complete radiology report following the template below EXACTLY.
- Keep the EXACT structure, sections, headers, and formatting
- Replace ALL <fill>, <à remplir>, and similar placeholders with appropriate clinical findings
- Base your findings on the indication text above
- Fill EVERY section - leave NO placeholders unfilled
- Use professional medical terminology in {template_lang.upper()}
- Output plain text only (no markdown, no code blocks, no backticks)
- The report MUST be in the SAME LANGUAGE as the template ({template_lang.upper()})

TEMPLATE TO FOLLOW:

{formatted_skeleton}

Now generate the COMPLETE report with all placeholders filled IN {template_lang.upper()}:
""".strip()

    # Call Gemini - combine system instructions with user prompt
    # Gemini doesn't support "system" role in messages
    try:
        model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=SYSTEM_INSTRUCTIONS
        )
        resp = model.generate_content(user_prompt)

        # Extract text
        report_text = (resp.text or "").strip()

        if not report_text:
            raise HTTPException(
                status_code=500,
                detail="Gemini API returned empty response. Please try again."
            )
    except HTTPException:
        # Re-raise HTTPException without modification
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Gemini API error: {error_msg}")

        # Provide user-friendly error messages based on error type
        if "API_KEY" in error_msg.upper() or "PERMISSION_DENIED" in error_msg:
            raise HTTPException(
                status_code=500,
                detail="Invalid or missing Gemini API key. Please check your GEMINI_API_KEY in Replit Secrets."
            )
        elif "QUOTA" in error_msg.upper() or "RESOURCE_EXHAUSTED" in error_msg:
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Please try again later or upgrade your API plan."
            )
        elif "RATE_LIMIT" in error_msg.upper():
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please wait a moment and try again."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate report: {error_msg}"
            )

    # Detect critical findings
    critical_results = critical_detector.detect_critical_findings(
        report_text=report_text,
        indication=req.input
    )

    # Generate highlights - extract key phrases from IMPRESSION/CONCLUSION section
    highlights: List[str] = []

    # Find and highlight the conclusion/impression section
    import re
    conclusion_patterns = [
        r'(?:IMPRESSION|CONCLUSION|SYNTHÈSE|DIAGNOSTIC)[\s:]*\n(.+?)(?=\n\n|\Z)',
        r'(?:^|\n)(?:IMPRESSION|CONCLUSION|SYNTHÈSE)[\s:]*\n(.+?)(?=\n[A-Z]|\Z)'
    ]

    for pattern in conclusion_patterns:
        match = re.search(pattern, report_text, re.MULTILINE | re.DOTALL | re.IGNORECASE)
        if match:
            conclusion_text = match.group(1).strip()
            # Split into sentences and highlight key ones
            sentences = [s.strip() for s in re.split(r'[.!]\s+', conclusion_text) if s.strip()]
            for sentence in sentences[:3]:  # Highlight first 3 sentences of conclusion
                if len(sentence) > 10:
                    highlights.append(sentence)
            break

    # Highlight key medical findings (both positive and negative)
    key_phrases = [
        # Negative findings (English)
        r"No evidence of [^.!]+",
        r"No [^.!]+ identified",
        r"Unremarkable [^.!]+",
        r"Normal [^.!]+",
        r"No significant [^.!]+",
        # Positive findings (English)
        r"[^.!]+ consistent with [^.!]+",
        r"[^.!]+ suggestive of [^.!]+",
        r"Evidence of [^.!]+",
        r"Suspicious for [^.!]+",
        # Negative findings (French)
        r"Pas d[e']? [^.!]+",
        r"Absence d[e']? [^.!]+",
        r"Aucun[e]? [^.!]+",
        r"Sans [^.!]+",
        # Positive findings (French)
        r"Compatible avec [^.!]+",
        r"En faveur d[e']? [^.!]+",
        r"Présence d[e']? [^.!]+",
        r"Signes de [^.!]+"
    ]

    for phrase_pattern in key_phrases:
        matches = re.finditer(phrase_pattern, report_text, re.IGNORECASE)
        for match in matches:
            phrase = match.group(0).strip()
            if 5 < len(phrase) < 150:  # Reasonable length
                highlights.append(phrase)

    # Extract modality from template category or title
    modality = template.category if template.category else None
    if not modality:
        # Try to extract from title (e.g., "CT Head", "MRI Brain", etc.)
        title_upper = template.title.upper()
        for mod in ["CT", "MRI", "X-RAY", "ULTRASOUND", "PET"]:
            if mod in title_upper:
                modality = mod
                break

    # Save report to database
    report_id = None
    try:
        report = Report(
            template_id=template.id,
            user_id=current_user.id,  # Track who created it
            patient_name=meta.patient_name,
            accession=meta.accession,
            doctor_name=meta.doctorName,
            hospital_name=meta.hospitalName,
            referrer=meta.referrer,
            indication=req.input,
            generated_report=report_text,
            study_datetime=meta.study_datetime,
            modality=modality,  # Add modality for filtering
            similar_cases_used=similar_cases,  # Store RAG context
            highlights=list(set(highlights))  # Store highlights
        )
        db.add(report)
        db.commit()
        db.refresh(report)  # Get the generated ID
        report_id = report.id
        print(f"✓ Report saved with ID: {report_id}")

        # Handle critical findings notification
        if critical_results['requires_notification'] and meta.referrer:
            try:
                print(f"⚠️  Critical findings detected, creating notification...")

                # Create notification record
                notification = CriticalNotification(
                    report_id=report.id,
                    sent_by_user_id=current_user.id,
                    recipient_email=meta.referrer if '@' in str(meta.referrer) else f"{meta.referrer}@hospital.com",
                    critical_findings=critical_results['findings'],
                    priority=NotificationPriority.CRITICAL if critical_results['highest_severity'] == 'critical' else NotificationPriority.URGENT,
                    status=NotificationStatus.PENDING,
                    notification_method='email'
                )
                db.add(notification)
                db.commit()
                db.refresh(notification)

                # Send email notification
                # Extract relevant excerpt from report (first 500 chars of impression/conclusion)
                report_excerpt = report_text[:500] if len(report_text) <= 500 else report_text[:497] + "..."

                email_sent = notification_service.send_critical_finding_notification(
                    recipient_email=notification.recipient_email,
                    patient_name=meta.patient_name or "Unknown Patient",
                    accession=meta.accession or "N/A",
                    findings=critical_results['findings'],
                    report_excerpt=report_excerpt,
                    radiologist_name=current_user.full_name,
                    notification_id=notification.id
                )

                if email_sent:
                    notification.status = NotificationStatus.SENT
                    notification.sent_at = datetime.now()
                    db.commit()
                    print(f"✓ Critical findings notification sent successfully")
                else:
                    print(f"⚠️  Failed to send notification email")

            except Exception as e:
                print(f"Error creating/sending critical notification: {e}")
                db.rollback()

    except Exception as e:
        print(f"Error saving report: {e}")
        db.rollback()

    # Prepare response
    response_data = {
        "report": report_text,
        "templateTitle": template.title,
        "templateId": template.template_id,
        "highlights": list(set(highlights)),
        "similar_cases": similar_cases,
        "report_id": report_id,
        "critical_findings": critical_results if critical_results['has_critical'] else None
    }

    # Cache the result
    cache.set("generate", cache_key_data, response_data)

    return GenerateResponse(**response_data)

@app.get("/reports/history", response_model=List[ReportHistoryResponse])
async def get_report_history(
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get report generation history for current user"""
    reports = (
        db.query(Report)
        .join(Template)
        .filter(Report.user_id == current_user.id)  # Filter by current user
        .order_by(Report.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return [
        ReportHistoryResponse(
            id=r.id,
            patient_name=r.patient_name,
            accession=r.accession,
            indication=r.indication[:100] + "..." if len(r.indication) > 100 else r.indication,
            template_title=r.template.title,
            created_at=r.created_at
        )
        for r in reports
    ]

@app.get("/reports/{report_id}")
async def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific report by ID (must be owned by current user)"""
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id  # Ensure user owns this report
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or access denied")

    return {
        "id": report.id,
        "template_title": report.template.title,
        "patient_name": report.patient_name,
        "accession": report.accession,
        "doctor_name": report.doctor_name,
        "hospital_name": report.hospital_name,
        "indication": report.indication,
        "generated_report": report.generated_report,
        "study_datetime": report.study_datetime,
        "created_at": report.created_at
    }

@app.get("/reports/{report_id}/download/word")
async def download_report_word(
    report_id: int,
    highlight: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download a report as Word document (.docx)

    Args:
        report_id: The report ID
        highlight: Whether to highlight AI-generated content (default: False)
    """
    # Get report from database (ensure user owns it)
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or access denied")

    # Get template for formatting metadata
    template = report.template

    # Generate Word document
    generator = DocumentGenerator()
    try:
        docx_stream = generator.generate_word_document(
            report_text=report.generated_report,
            template_skeleton=template.skeleton,
            formatting_metadata=template.formatting_metadata,
            highlight_ai_content=highlight
        )

        # Generate filename
        patient_name = report.patient_name or "Patient"
        # Clean filename (remove special characters)
        safe_patient_name = "".join(c for c in patient_name if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_patient_name}_{report.accession or report_id}_Report.docx"

        # Return as streaming response
        return StreamingResponse(
            docx_stream,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        print(f"Error generating Word document: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating document: {str(e)}")

@app.get("/reports/{report_id}/download/pdf")
async def download_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Download a report as PDF document

    Args:
        report_id: The report ID

    Note: PDF generation requires LibreOffice, which is not available in lightweight deployments.
          For lightweight deployments, download the Word document instead.
    """
    # Check if LibreOffice is available
    import shutil
    if not shutil.which('soffice'):
        raise HTTPException(
            status_code=501,
            detail="PDF export is not available in this deployment. LibreOffice is not installed to reduce deployment size. Please download the Word document (.docx) instead, which can be opened in Microsoft Word, Google Docs, or LibreOffice."
        )

    # Get report from database (ensure user owns it)
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found or access denied")

    # Get template for formatting metadata
    template = report.template

    # Generate Word document first
    generator = DocumentGenerator()
    try:
        docx_stream = generator.generate_word_document(
            report_text=report.generated_report,
            template_skeleton=template.skeleton,
            formatting_metadata=template.formatting_metadata,
            highlight_ai_content=False  # No highlighting in PDF
        )

        # Convert to PDF
        converter = PDFConverter()
        pdf_stream = converter.convert_docx_to_pdf(docx_stream)

        # Generate filename
        patient_name = report.patient_name or "Patient"
        # Clean filename (remove special characters)
        safe_patient_name = "".join(c for c in patient_name if c.isalnum() or c in (' ', '-', '_')).strip()
        filename = f"{safe_patient_name}_{report.accession or report_id}_Report.pdf"

        # Return as streaming response
        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating PDF: {str(e)}")

@app.post("/reports/{report_id}/generate-summary")
async def generate_report_summary(
    report_id: int,
    max_length: int = 200,
    language: str = 'en',
    db: Session = Depends(get_db)
):
    """
    Generate an AI-powered concise summary/impression from a report

    Args:
        report_id: The report ID
        max_length: Maximum length of summary in words (default: 200)
        language: Language for summary (en or fr, default: en)
    """
    # Get report from database
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        # Generate summary using AI service with indication text and specified language
        result = ai_analysis_service.generate_summary(
            report.generated_report,
            indication_text=report.indication,
            max_length=max_length,
            language=language
        )

        # Update report with summary, conclusion, and language
        report.ai_summary = result['summary']
        report.ai_conclusion = result.get('conclusion', '')
        report.key_findings = result['key_findings']
        report.report_language = language
        db.commit()

        return {
            "status": "success",
            "report_id": report_id,
            "summary": result['summary'],
            "conclusion": result.get('conclusion', ''),
            "key_findings": result['key_findings'],
            "language": language
        }

    except Exception as e:
        print(f"Error generating summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@app.post("/reports/{report_id}/validate")
async def validate_report(
    report_id: int,
    language: str = 'en',
    db: Session = Depends(get_db)
):
    """
    Validate a report for inconsistencies and errors

    Checks for:
    - Contradictions between findings and impression
    - Logical inconsistencies
    - Missing critical information
    - Unfilled placeholders

    Args:
        report_id: The report ID
        language: Language for validation messages (en or fr, default: en)
    """
    # Get report from database
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        # Validate using AI service with specified language
        validation_result = ai_analysis_service.detect_inconsistencies(
            report.generated_report,
            language=language
        )

        # Determine status
        if validation_result['errors']:
            status = 'errors'
        elif validation_result['warnings']:
            status = 'warnings'
        else:
            status = 'passed'

        # Update report with validation results
        report.validation_status = status
        report.validation_errors = validation_result['errors']
        report.validation_warnings = validation_result['warnings']
        report.validation_details = validation_result['details']
        db.commit()

        return {
            "status": status,
            "report_id": report_id,
            "is_consistent": validation_result['is_consistent'],
            "severity": validation_result['severity'],
            "errors": validation_result['errors'],
            "warnings": validation_result['warnings'],
            "details": validation_result['details']
        }

    except Exception as e:
        print(f"Error validating report: {e}")
        raise HTTPException(status_code=500, detail=f"Error validating report: {str(e)}")

@app.get("/reports/{report_id}/analysis")
async def get_report_analysis(
    report_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the stored AI analysis (summary and validation) for a report

    Args:
        report_id: The report ID
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return {
        "report_id": report_id,
        "summary": {
            "text": report.ai_summary,
            "conclusion": report.ai_conclusion,
            "key_findings": report.key_findings,
            "language": report.report_language
        },
        "validation": {
            "status": report.validation_status,
            "errors": report.validation_errors or [],
            "warnings": report.validation_warnings or [],
            "details": report.validation_details or []
        }
    }

@app.post("/cache/clear")
async def clear_cache():
    """Clear all cached data"""
    cache.clear()
    return {"status": "success", "message": "Cache cleared"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "cache": "enabled" if cache.enabled else "disabled",
        "vector_db": "connected" if vector_service.client else "disconnected",
        "gemini_model": settings.GEMINI_MODEL
    }

# Serve static frontend files (for production deployment)
# Get the project root directory (parent of backend directory)
backend_dir = Path(__file__).resolve().parent
project_root = backend_dir.parent
frontend_dist = project_root / "frontend" / "dist"

if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    print(f"✓ Serving frontend from: {frontend_dist}")
    
    # Mount static assets (js, css, images, etc.) if they exist
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    # Root endpoint serves frontend
    @app.get("/")
    async def root_frontend():
        """Serve frontend for root path"""
        return FileResponse(frontend_dist / "index.html")
    
    # Catch-all route for SPA (Single Page Application) routing
    # This handles client-side routes like /dashboard, /reports, etc.
    # Note: API routes (/api/*) are already registered above and take precedence
    @app.get("/{full_path:path}")
    async def catch_all_frontend(full_path: str):
        """Serve frontend index.html for all non-API, non-static routes"""
        # Skip API routes - they're handled by specific endpoints above
        if full_path.startswith("api/") or full_path.startswith("health") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            # Let the actual API route handler process this
            # This shouldn't normally be reached since specific routes take precedence
            raise HTTPException(status_code=404, detail="Not Found")
        
        # Check if it's a file request (has extension)
        if "." in full_path.split("/")[-1]:
            # Try to serve the actual file
            file_path = frontend_dist / full_path
            if file_path.exists() and file_path.is_file():
                return FileResponse(file_path)
        
        # For all other routes, serve index.html (SPA routing)
        return FileResponse(frontend_dist / "index.html")
else:
    print("⚠ Frontend not built. Serving API only.")
    print(f"  Expected location: {frontend_dist}")
    print("  Run: cd frontend && npm run build")
    
    @app.get("/")
    async def root():
        """Root endpoint when frontend is not built"""
        return {
            "message": "Radiology RAG API",
            "status": "running",
            "version": "1.0.0",
            "docs": "/docs",
            "health": "/health",
            "note": "Frontend not built. Deploy will build it automatically."
        }
