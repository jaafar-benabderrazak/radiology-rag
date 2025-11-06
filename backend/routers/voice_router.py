"""
API Router for Voice Dictation
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from pydantic import BaseModel

from models import User
from auth import get_current_active_user
from transcription_service import transcription_service

router = APIRouter(prefix="/api/voice", tags=["voice"])

class TranscriptionResponse(BaseModel):
    success: bool
    text: Optional[str] = None
    language: Optional[str] = None
    segments: Optional[list] = None
    duration: Optional[float] = None
    method: Optional[str] = None
    model: Optional[str] = None
    error: Optional[str] = None

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    specialty: Optional[str] = Form("radiology"),
    current_user: User = Depends(get_current_active_user)
):
    """
    Transcribe audio file to text using Whisper AI

    Args:
        audio: Audio file (mp3, wav, webm, m4a, etc.)
        language: Language code (en, fr, ar, etc.) or None for auto-detect
        specialty: Medical specialty for context prompt (default: radiology)

    Returns:
        Transcription results with text, language, and segments
    """
    try:
        # Validate file
        if not audio.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Get medical context prompt
        prompt = transcription_service.get_medical_prompt(specialty)

        # Transcribe
        result = transcription_service.transcribe_audio(
            audio_file=audio.file,
            filename=audio.filename,
            language=language,
            prompt=prompt
        )

        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Transcription failed")
            )

        return TranscriptionResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@router.get("/status")
async def get_voice_status(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get voice dictation service status

    Returns:
        Service configuration and status
    """
    return transcription_service.get_status()

@router.get("/prompts")
async def get_medical_prompts(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get available medical specialty prompts

    Returns:
        List of available specialty prompts
    """
    specialties = ["radiology", "cardiology", "neurology", "orthopedics", "general"]

    return {
        "specialties": specialties,
        "prompts": {
            specialty: transcription_service.get_medical_prompt(specialty)
            for specialty in specialties
        }
    }
