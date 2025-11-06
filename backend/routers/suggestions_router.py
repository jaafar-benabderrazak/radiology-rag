"""
AI Suggestions Router - Provides AI-powered clinical suggestions
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import google.generativeai as genai
from config import settings

from database import get_db
from models import User, Report
from auth import get_current_active_user

router = APIRouter(prefix="/api/suggestions", tags=["ai-suggestions"])

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Pydantic schemas
class DifferentialRequest(BaseModel):
    findings: str
    modality: Optional[str] = None
    clinical_context: Optional[str] = None
    language: str = "en"

class DifferentialResponse(BaseModel):
    differentials: List[dict]  # List of {diagnosis: str, probability: str, reasoning: str}
    additional_workup: List[str]
    language: str

class FollowUpRequest(BaseModel):
    findings: str
    impression: str
    modality: str
    language: str = "en"

class FollowUpResponse(BaseModel):
    recommendations: List[dict]  # List of {study: str, timeframe: str, reason: str}
    acr_appropriateness: Optional[str]
    language: str

class ImpressionRequest(BaseModel):
    findings: str
    modality: str
    clinical_indication: Optional[str] = None
    language: str = "en"

class ImpressionResponse(BaseModel):
    impression: str
    severity: str  # "normal", "mild", "moderate", "severe", "critical"
    key_points: List[str]
    language: str

class ICD10Request(BaseModel):
    findings: str
    impression: str
    language: str = "en"

class ICD10Response(BaseModel):
    codes: List[dict]  # List of {code: str, description: str, relevance: str}
    language: str

@router.post("/differential", response_model=DifferentialResponse)
async def suggest_differential(
    request: DifferentialRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate differential diagnoses based on findings
    """
    lang_instruction = "in French" if request.language == "fr" else "in English"

    prompt = f"""You are an expert radiologist. Based on the following imaging findings, provide a differential diagnosis.

Modality: {request.modality or "Not specified"}
Clinical Context: {request.clinical_context or "Not provided"}

Findings:
{request.findings}

Please provide {lang_instruction}:
1. A list of 3-5 most likely differential diagnoses, ranked by probability
2. Brief reasoning for each diagnosis (1-2 sentences)
3. Suggested additional workup or imaging if needed

Format your response as JSON:
{{
    "differentials": [
        {{"diagnosis": "diagnosis name", "probability": "most likely/likely/possible", "reasoning": "brief explanation"}},
        ...
    ],
    "additional_workup": ["test 1", "test 2", ...]
}}
"""

    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt)

        # Parse JSON response
        import json
        # Extract JSON from markdown code blocks if present
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)

        return DifferentialResponse(
            differentials=result.get("differentials", []),
            additional_workup=result.get("additional_workup", []),
            language=request.language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate differential: {str(e)}")

@router.post("/followup", response_model=FollowUpResponse)
async def suggest_followup(
    request: FollowUpRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Suggest appropriate follow-up imaging based on findings
    """
    lang_instruction = "in French" if request.language == "fr" else "in English"

    prompt = f"""You are an expert radiologist. Based on the following findings and impression, recommend appropriate follow-up imaging.

Modality: {request.modality}

Findings:
{request.findings}

Impression:
{request.impression}

Please provide {lang_instruction}:
1. Recommended follow-up studies with timeframes
2. Rationale for each recommendation
3. ACR Appropriateness Criteria reference if applicable

Format as JSON:
{{
    "recommendations": [
        {{"study": "study name", "timeframe": "3 months/6 months/1 year", "reason": "explanation"}},
        ...
    ],
    "acr_appropriateness": "reference or guideline if applicable"
}}
"""

    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt)

        import json
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)

        return FollowUpResponse(
            recommendations=result.get("recommendations", []),
            acr_appropriateness=result.get("acr_appropriateness"),
            language=request.language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate follow-up: {str(e)}")

@router.post("/impression", response_model=ImpressionResponse)
async def generate_impression(
    request: ImpressionRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Generate a concise impression from detailed findings
    """
    lang_instruction = "in French" if request.language == "fr" else "in English"

    prompt = f"""You are an expert radiologist. Based on the following findings, generate a clear and concise impression section.

Modality: {request.modality}
Clinical Indication: {request.clinical_indication or "Not provided"}

Findings:
{request.findings}

Please provide {lang_instruction}:
1. A concise impression (2-4 sentences max)
2. Severity assessment (normal/mild/moderate/severe/critical)
3. Key points in bullet format

Format as JSON:
{{
    "impression": "concise impression text",
    "severity": "normal/mild/moderate/severe/critical",
    "key_points": ["point 1", "point 2", ...]
}}
"""

    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt)

        import json
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)

        return ImpressionResponse(
            impression=result.get("impression", ""),
            severity=result.get("severity", "normal"),
            key_points=result.get("key_points", []),
            language=request.language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate impression: {str(e)}")

@router.post("/icd10", response_model=ICD10Response)
async def suggest_icd10_codes(
    request: ICD10Request,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Suggest appropriate ICD-10 codes based on findings and impression
    """
    lang_instruction = "in French" if request.language == "fr" else "in English"

    prompt = f"""You are an expert medical coder. Based on the following radiology findings and impression, suggest appropriate ICD-10 codes.

Findings:
{request.findings}

Impression:
{request.impression}

Please provide {lang_instruction}:
1. List of relevant ICD-10 codes with descriptions
2. Relevance level (primary/secondary/differential)

Format as JSON:
{{
    "codes": [
        {{"code": "ICD-10 code", "description": "description", "relevance": "primary/secondary/differential"}},
        ...
    ]
}}
"""

    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt)

        import json
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        result = json.loads(text)

        return ICD10Response(
            codes=result.get("codes", []),
            language=request.language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate ICD-10 codes: {str(e)}")

@router.post("/quick-suggest")
async def quick_suggest(
    findings: str,
    suggestion_type: str,  # "differential", "followup", "impression", "icd10"
    current_user: User = Depends(get_current_active_user)
):
    """
    Quick suggestion endpoint for inline help
    """
    if suggestion_type not in ["differential", "followup", "impression", "icd10"]:
        raise HTTPException(status_code=400, detail="Invalid suggestion type")

    prompt_map = {
        "differential": f"Provide 2-3 brief differential diagnoses for: {findings}",
        "followup": f"Suggest appropriate follow-up imaging for: {findings}",
        "impression": f"Generate a 1-sentence impression for: {findings}",
        "icd10": f"Suggest 2-3 relevant ICD-10 codes for: {findings}"
    }

    try:
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        response = model.generate_content(prompt_map[suggestion_type])

        return {"suggestion": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate suggestion: {str(e)}")
