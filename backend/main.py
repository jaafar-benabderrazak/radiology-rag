# main.py
import os
from typing import List, Optional, Literal
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Google Generative AI
import google.generativeai as genai

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("Set GEMINI_API_KEY (or GOOGLE_API_KEY) in environment/.env")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
# You can override via env: GEMINI_MODEL
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# --- FastAPI app with CORS ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Templates (server-side) ----------
class TemplateDef(BaseModel):
    id: str
    title: str
    keywords: List[str]
    skeleton: str  # Professional structure the model should fill

TEMPLATES: List[TemplateDef] = [
    TemplateDef(
        id="ctpa_pe",
        title="CT Pulmonary Angiography – Pulmonary Embolism (Formal)",
        keywords=["ctpa","pulmonary embolism","pe","angiography","shortness of breath","dyspnea","pleuritic"],
        skeleton=(
            "Radiology Report\n"
            "Referring Physician: {referrer}\n"
            "Reporting Radiologist: {doctor_name}\n\n"
            "Patient: {patient_name}\n"
            "Study: CT Pulmonary Angiography\n"
            "Body Part: Chest\n"
            "Study Date/Time: {study_datetime}\n"
            "Accession/ID: {accession}\n\n"
            "Indication:\n{indication}\n\n"
            "Technique:\n"
            "Helical acquisition from lung apices to bases following IV contrast with bolus tracking. "
            "Multiplanar reconstructions performed. Adequate opacification of the pulmonary arteries.\n\n"
            "Findings:\n"
            "• Pulmonary arteries: <fill concisely>\n"
            "• Right heart strain: <fill concisely>\n"
            "• Lungs and pleura: <fill concisely>\n"
            "• Mediastinum: <fill concisely or Unremarkable>\n"
            "• Upper abdomen: <fill concisely or Unremarkable>\n"
            "• Incidental findings: <None or list>\n\n"
            "Comparison: <None available or describe>\n\n"
            "Impression:\n"
            "1) <main conclusion>\n"
            "2) <secondary, if applicable>\n\n"
            "Signed electronically by {doctor_name}, {study_datetime}\n"
        )
    ),
    TemplateDef(
        id="cxr_normal",
        title="Chest X-ray – Normal (Formal)",
        keywords=["cxr","xray","x-ray","radiograph","chest","thorax","pa","lateral"],
        skeleton=(
            "Radiology Report\n"
            "Referring Physician: {referrer}\n"
            "Reporting Radiologist: {doctor_name}\n\n"
            "Patient: {patient_name}\n"
            "Study: Chest X-ray (PA/Lateral)\n"
            "Body Part: Chest\n"
            "Study Date/Time: {study_datetime}\n"
            "Accession/ID: {accession}\n\n"
            "Indication:\n{indication}\n\n"
            "Technique:\nStandard PA and lateral projections.\n\n"
            "Findings:\n"
            "• Cardiomediastinal silhouette within normal limits.\n"
            "• Lungs: <fill>\n"
            "• Pleura: <fill>\n"
            "• Bones: <fill>\n\n"
            "Impression:\n<one-line normal or key findings>\n\n"
            "Signed electronically by {doctor_name}, {study_datetime}\n"
        )
    ),
    TemplateDef(
        id="us_ruq",
        title="Ultrasound – Abdomen RUQ (Formal)",
        keywords=["ultrasound","us","ruq","gallbladder","cholelithiasis","biliary"],
        skeleton=(
            "Radiology Report\n"
            "Referring Physician: {referrer}\n"
            "Reporting Radiologist: {doctor_name}\n\n"
            "Patient: {patient_name}\n"
            "Study: Ultrasound – Abdomen (RUQ)\n"
            "Body Part: Right upper quadrant\n"
            "Study Date/Time: {study_datetime}\n"
            "Accession/ID: {accession}\n\n"
            "Indication:\n{indication}\n\n"
            "Technique:\nReal-time ultrasound with grayscale and color Doppler as appropriate.\n\n"
            "Findings:\n"
            "• Liver: <fill>\n"
            "• Gallbladder: <fill>\n"
            "• Bile ducts: <fill>\n"
            "• Pancreas: <fill>\n"
            "• Right kidney: <fill>\n\n"
            "Impression:\n<concise overall>\n\n"
            "Signed electronically by {doctor_name}, {study_datetime}\n"
        )
    ),
]

def choose_template_auto(text: str) -> TemplateDef:
    low = text.lower()
    best = max(TEMPLATES, key=lambda t: sum(1 for k in t.keywords if k in low))
    return best

# ---------- Request/Response models ----------
class Meta(BaseModel):
    doctorName: Optional[str] = "Dr. John Doe"
    hospitalName: Optional[str] = "General Hospital"
    referrer: Optional[str] = "—"
    patient_name: Optional[str] = "[Name not provided]"
    study_datetime: Optional[str] = "today"
    accession: Optional[str] = "CR-000001"

class GenerateRequest(BaseModel):
    input: str
    templateId: Literal["auto","ctpa_pe","cxr_normal","us_ruq"] = "auto"
    meta: Optional[Meta] = None

class GenerateResponse(BaseModel):
    report: str
    templateTitle: str
    highlights: List[str] = []

SYSTEM_INSTRUCTIONS = (
    "You are a radiology reporting assistant. "
    "Produce a formal, concise, professional report that fits the provided skeleton exactly. "
    "Do not include markdown, backticks, or extra commentary. "
    "Fill placeholders with best clinical wording based on the provided indication text. "
    "Prefer negative, precise phrasing when appropriate (e.g., 'No evidence of pulmonary embolism.')."
)

@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    meta = req.meta or Meta()
    # Pick template
    tpl = next((t for t in TEMPLATES if t.id == req.templateId), None) if req.templateId != "auto" else None
    if tpl is None:
        tpl = choose_template_auto(req.input)

    # Compose prompt for Gemini
    # We instruct the model to fill the skeleton using the input and meta
    user_prompt = f"""
Indication text (verbatim user input):
\"\"\"{req.input.strip()}\"\"\"

Hospital: {meta.hospitalName}
Reporting Radiologist: {meta.doctorName}
Referring Physician: {meta.referrer}
Patient: {meta.patient_name}
Study Date/Time: {meta.study_datetime}
Accession/ID: {meta.accession}

Using this skeleton, produce the final report (plain text only, no markdown):

{skeleton_with_placeholders := tpl.skeleton}
""".strip()

    # Call Gemini
    model = genai.GenerativeModel(MODEL_NAME)
    resp = model.generate_content(
        [
            {"role": "system", "parts": [SYSTEM_INSTRUCTIONS]},
            {"role": "user", "parts": [user_prompt]},
        ]
    )

    # Extract text
    text = (resp.text or "").strip()
    # Optionally provide a few highlight strings to help the UI mark input-derived phrases
    # (We pick the first sentence from input and common negatives)
    highlights: List[str] = []
    first_line = req.input.strip().split("\n")[0]
    if first_line:
        highlights.append(first_line[:200])
    for phrase in ["No evidence of pulmonary embolism", "No right heart strain", "No consolidation", "No effusion"]:
        if phrase.lower() in text.lower():
            highlights.append(phrase)

    return GenerateResponse(report=text, templateTitle=tpl.title, highlights=highlights)
