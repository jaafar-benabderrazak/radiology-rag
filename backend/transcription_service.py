"""
Voice Transcription Service using OpenAI Whisper
Converts speech to text for radiology report dictation
"""
import os
import tempfile
from pathlib import Path
from typing import Dict, Optional, BinaryIO
import logging

logger = logging.getLogger(__name__)

class TranscriptionService:
    """Service for speech-to-text transcription"""

    def __init__(self):
        # Configuration
        self.enabled = os.getenv("VOICE_DICTATION_ENABLED", "true").lower() == "true"
        self.whisper_model = os.getenv("WHISPER_MODEL", "base")  # tiny, base, small, medium, large
        self.language = os.getenv("WHISPER_LANGUAGE", "auto")  # auto-detect or specify (en, fr, ar, etc.)

        # OpenAI API (if using cloud Whisper)
        self.use_openai_api = os.getenv("USE_OPENAI_WHISPER_API", "false").lower() == "true"
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")

        # Supported audio formats
        self.supported_formats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm']

        # Initialize Whisper model
        self.model = None
        if self.enabled and not self.use_openai_api:
            self._load_whisper_model()

    def _load_whisper_model(self):
        """Load local Whisper model"""
        try:
            import whisper
            logger.info(f"Loading Whisper model: {self.whisper_model}")
            self.model = whisper.load_model(self.whisper_model)
            logger.info(f"✓ Whisper model loaded successfully")
        except ImportError:
            logger.warning("Whisper library not installed. Install with: pip install openai-whisper")
            self.enabled = False
        except Exception as e:
            logger.error(f"Failed to load Whisper model: {e}")
            self.enabled = False

    def transcribe_audio(
        self,
        audio_file: BinaryIO,
        filename: str,
        language: Optional[str] = None,
        prompt: Optional[str] = None
    ) -> Dict[str, any]:
        """
        Transcribe audio file to text

        Args:
            audio_file: Audio file binary stream
            filename: Original filename
            language: Language code (e.g., 'en', 'fr', 'ar') or None for auto-detect
            prompt: Optional context prompt to improve accuracy

        Returns:
            Dictionary with transcription results
        """
        if not self.enabled:
            return {
                "success": False,
                "error": "Voice dictation is disabled"
            }

        try:
            # Validate file format
            file_ext = Path(filename).suffix.lower()
            if file_ext not in self.supported_formats:
                return {
                    "success": False,
                    "error": f"Unsupported audio format: {file_ext}. Supported: {', '.join(self.supported_formats)}"
                }

            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
                tmp_file.write(audio_file.read())
                tmp_path = tmp_file.name

            try:
                # Transcribe using OpenAI API or local model
                if self.use_openai_api:
                    result = self._transcribe_with_openai_api(tmp_path, language, prompt)
                else:
                    result = self._transcribe_with_local_model(tmp_path, language, prompt)

                return result

            finally:
                # Clean up temporary file
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _transcribe_with_local_model(
        self,
        audio_path: str,
        language: Optional[str],
        prompt: Optional[str]
    ) -> Dict[str, any]:
        """Transcribe using local Whisper model"""
        if not self.model:
            return {
                "success": False,
                "error": "Whisper model not loaded"
            }

        try:
            logger.info(f"Transcribing audio with local Whisper model...")

            # Prepare transcription options
            transcribe_options = {
                "task": "transcribe",  # or "translate" for translation to English
                "fp16": False  # Disable FP16 for CPU compatibility
            }

            # Set language if specified
            if language and language != "auto":
                transcribe_options["language"] = language
            elif self.language != "auto":
                transcribe_options["language"] = self.language

            # Add context prompt if provided (helps with medical terminology)
            if prompt:
                transcribe_options["initial_prompt"] = prompt

            # Transcribe
            result = self.model.transcribe(audio_path, **transcribe_options)

            # Extract results
            text = result["text"].strip()
            detected_language = result.get("language", "unknown")

            # Extract segments with timestamps
            segments = []
            for segment in result.get("segments", []):
                segments.append({
                    "start": segment["start"],
                    "end": segment["end"],
                    "text": segment["text"].strip()
                })

            logger.info(f"✓ Transcription completed ({len(text)} chars, {len(segments)} segments)")

            return {
                "success": True,
                "text": text,
                "language": detected_language,
                "segments": segments,
                "duration": segments[-1]["end"] if segments else 0,
                "method": "local_whisper",
                "model": self.whisper_model
            }

        except Exception as e:
            logger.error(f"Local transcription failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def _transcribe_with_openai_api(
        self,
        audio_path: str,
        language: Optional[str],
        prompt: Optional[str]
    ) -> Dict[str, any]:
        """Transcribe using OpenAI Whisper API"""
        if not self.openai_api_key:
            return {
                "success": False,
                "error": "OpenAI API key not configured"
            }

        try:
            import openai

            logger.info("Transcribing audio with OpenAI Whisper API...")

            # Configure OpenAI
            openai.api_key = self.openai_api_key

            # Open audio file
            with open(audio_path, "rb") as audio_file:
                # Call Whisper API
                transcript = openai.Audio.transcribe(
                    model="whisper-1",
                    file=audio_file,
                    language=language if language != "auto" else None,
                    prompt=prompt,
                    response_format="verbose_json"  # Get detailed response with segments
                )

            # Extract results
            text = transcript.get("text", "").strip()
            detected_language = transcript.get("language", "unknown")

            # Extract segments
            segments = []
            for segment in transcript.get("segments", []):
                segments.append({
                    "start": segment.get("start", 0),
                    "end": segment.get("end", 0),
                    "text": segment.get("text", "").strip()
                })

            logger.info(f"✓ Transcription completed via OpenAI API ({len(text)} chars)")

            return {
                "success": True,
                "text": text,
                "language": detected_language,
                "segments": segments,
                "duration": transcript.get("duration", 0),
                "method": "openai_api",
                "model": "whisper-1"
            }

        except ImportError:
            return {
                "success": False,
                "error": "OpenAI library not installed. Install with: pip install openai"
            }
        except Exception as e:
            logger.error(f"OpenAI API transcription failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    def get_medical_prompt(self, specialty: str = "radiology") -> str:
        """
        Get context prompt with medical terminology to improve accuracy

        Args:
            specialty: Medical specialty (radiology, cardiology, etc.)

        Returns:
            Context prompt string
        """
        medical_prompts = {
            "radiology": (
                "This is a radiology report dictation. "
                "Common terms include CT, MRI, X-ray, ultrasound, angiography, "
                "contrast, enhancement, lesion, mass, nodule, opacity, effusion, "
                "fracture, dislocation, stenosis, occlusion, hemorrhage, infarction, "
                "ventricle, atrium, aorta, pulmonary, hepatic, renal, cerebral."
            ),
            "general": (
                "This is a medical report dictation. "
                "Common terms include patient, diagnosis, symptoms, treatment, "
                "examination, findings, impression, recommendation."
            )
        }

        return medical_prompts.get(specialty, medical_prompts["general"])

    def get_status(self) -> Dict[str, any]:
        """Get transcription service status"""
        return {
            "enabled": self.enabled,
            "method": "openai_api" if self.use_openai_api else "local_whisper",
            "model": self.whisper_model if not self.use_openai_api else "whisper-1",
            "language": self.language,
            "supported_formats": self.supported_formats,
            "model_loaded": self.model is not None if not self.use_openai_api else None,
            "openai_configured": bool(self.openai_api_key) if self.use_openai_api else None
        }

# Singleton instance
transcription_service = TranscriptionService()
