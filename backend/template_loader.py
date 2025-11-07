"""
Template Loader - Automatically loads radiology templates from .docx files
"""
import os
import re
import json
from pathlib import Path
from typing import List, Dict, Optional, Any
from docx import Document
from docx.text.paragraph import Paragraph
from docx.text.run import Run


class TemplateLoader:
    """Loads radiology templates from Word documents"""

    def __init__(self, templates_dir: Optional[str] = None):
        # Try multiple possible locations for templates directory
        if templates_dir:
            self.templates_dir = Path(templates_dir)
        else:
            # Try different paths based on environment
            possible_paths = [
                Path("/app/templates"),  # Docker container
                Path(__file__).parent.parent / "templates",  # Relative to backend folder
                Path.cwd() / "templates",  # Current working directory
                Path("/home/runner/workspace/templates"),  # Replit deployment
            ]

            for path in possible_paths:
                if path.exists() and path.is_dir():
                    self.templates_dir = path
                    print(f"✓ Found templates directory: {path}")
                    break
            else:
                # Default to relative path if none found
                self.templates_dir = Path(__file__).parent.parent / "templates"
                print(f"⚠ Using default templates path: {self.templates_dir}")

    def load_all_templates(self) -> List[Dict]:
        """Load all .docx templates from the templates directory"""
        templates = []

        if not self.templates_dir.exists():
            print(f"⚠ Templates directory not found: {self.templates_dir}")
            return templates

        docx_files = list(self.templates_dir.glob("*.docx"))

        if not docx_files:
            print(f"⚠ No .docx files found in {self.templates_dir}")
            return templates

        print(f"Found {len(docx_files)} template files:")

        for docx_file in docx_files:
            try:
                # Skip temporary Word files (start with ~$)
                if docx_file.name.startswith('~$'):
                    continue

                print(f"  Loading: {docx_file.name}")
                template = self._load_template(docx_file)
                if template:
                    templates.append(template)
                    print(f"    ✓ Loaded: {template['title']}")
            except Exception as e:
                print(f"    ✗ Error loading {docx_file.name}: {e}")

        return templates

    def _extract_run_formatting(self, run: Run) -> Dict[str, Any]:
        """Extract formatting information from a run"""
        formatting = {
            'bold': run.bold if run.bold is not None else False,
            'italic': run.italic if run.italic is not None else False,
            'underline': run.underline if run.underline is not None else False,
            'font_name': run.font.name if run.font.name else None,
            'font_size': run.font.size.pt if run.font.size else None,
        }
        return formatting

    def _extract_paragraph_formatting(self, para: Paragraph) -> Dict[str, Any]:
        """Extract formatting information from a paragraph"""
        # Get paragraph-level formatting
        para_format = {
            'style': para.style.name if para.style else None,
            'alignment': str(para.alignment) if para.alignment else None,
        }

        # Extract runs with their text and formatting
        runs_data = []
        for run in para.runs:
            if run.text:  # Only include non-empty runs
                runs_data.append({
                    'text': run.text,
                    'formatting': self._extract_run_formatting(run)
                })

        return {
            'paragraph_format': para_format,
            'runs': runs_data
        }

    def _load_template(self, docx_path: Path) -> Optional[Dict]:
        """Load a single template from a .docx file"""
        doc = Document(docx_path)

        # Extract all text from paragraphs (for text processing)
        all_text = []
        # Store formatting metadata for each paragraph
        paragraphs_formatting = []

        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                all_text.append(text)
                # Extract formatting for this paragraph
                para_formatting = self._extract_paragraph_formatting(para)
                paragraphs_formatting.append(para_formatting)

        if len(all_text) < 2:
            print(f"      Warning: Not enough content in {docx_path.name}")
            return None

        # Template structure:
        # Line 1: Title
        # Line 2: Keywords (can be on separate line or in format "Keywords: x, y, z")
        # Rest: Template skeleton

        title = all_text[0]

        # Extract keywords from second line or find "Keywords:" line
        keywords = []
        skeleton_start_idx = 1

        # Check if second line has keywords
        keywords_line = all_text[1] if len(all_text) > 1 else ""

        # Look for "Keywords:", "Mots-clés:", "Tags:", etc.
        keywords_patterns = [
            r'(?:keywords?|mots[-\s]cl[ée]s?|tags?)[:\s]+(.+)',
            r'^(.+)$'  # If no keyword label, assume line 2 is keywords
        ]

        for i, line in enumerate(all_text[:5]):  # Check first 5 lines
            for pattern in keywords_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match and i > 0:  # Skip title line
                    keywords_text = match.group(1)
                    # Split by comma, semicolon, or whitespace
                    keywords = [k.strip() for k in re.split(r'[,;]+', keywords_text) if k.strip()]
                    skeleton_start_idx = i + 1
                    break
            if keywords:
                break

        # If no keywords found, use filename as keyword
        if not keywords:
            filename_base = docx_path.stem.lower()
            keywords = [filename_base.replace('_', ' ')]
            skeleton_start_idx = 1

        # Get the template skeleton (rest of the document)
        skeleton_lines = all_text[skeleton_start_idx:]
        skeleton = '\n'.join(skeleton_lines)

        # Generate template_id from filename
        template_id = self._generate_template_id(docx_path.stem)

        # Detect category from filename or title
        category = self._detect_category(title, docx_path.stem)

        # Detect language from template content (title + skeleton)
        full_text = title + '\n' + skeleton
        language = self._detect_language(full_text)

        # Store the formatting metadata as JSON string for database storage
        formatting_metadata = json.dumps(paragraphs_formatting)

        return {
            'template_id': template_id,
            'title': title,
            'keywords': keywords,
            'skeleton': skeleton,
            'category': category,
            'language': language,
            'is_active': True,
            'formatting_metadata': formatting_metadata
        }

    def _generate_template_id(self, filename: str) -> str:
        """Generate a clean template_id from filename"""
        # Convert to lowercase, replace spaces/special chars with underscores
        template_id = filename.lower()
        template_id = re.sub(r'[^a-z0-9]+', '_', template_id)
        template_id = template_id.strip('_')
        return template_id

    def _detect_category(self, title: str, filename: str) -> Optional[str]:
        """Detect template category from title or filename"""
        text = (title + ' ' + filename).lower()

        # Category detection patterns
        categories = {
            'CT': ['ct', 'scanner', 'tomodensitométrie', 'tdm', 'ctpa'],
            'IRM': ['irm', 'mri', 'imagerie par résonance', 'résonance magnétique'],
            'X-Ray': ['radiographie', 'radio', 'x-ray', 'xray', 'cxr', 'thorax'],
            'Ultrasound': ['échographie', 'echo', 'ultrasound', 'us', 'echographie'],
            'PET': ['tep', 'pet', 'tomographie par émission'],
            'Angiography': ['angiographie', 'angiography', 'angio'],
        }

        for category, patterns in categories.items():
            if any(pattern in text for pattern in patterns):
                return category

        return 'General'

    def _detect_language(self, text: str) -> str:
        """
        Detect language from template text content

        Uses simple keyword-based detection for French, English, Arabic, etc.
        Returns ISO 639-1 language code: 'fr', 'en', 'ar', etc.
        """
        text_lower = text.lower()

        # French indicators (common medical terms and section headers)
        french_indicators = [
            'échographie', 'irm', 'tomodensitométrie', 'radiographie',
            'indication', 'technique', 'résultats', 'conclusion',
            'synthèse', 'à remplir', 'données', 'examen', 'patient',
            'médecin', 'hôpital', 'étude', 'corps', 'poumons',
            'cœur', 'abdomen', 'cerveau', 'colonne', 'genou',
            'cheville', 'épaule', 'rachis', 'biliaire', 'hépatique',
            'mammaire', 'entéro', 'entier', 'cervical', 'lombaire'
        ]

        # English indicators
        english_indicators = [
            'indication', 'technique', 'findings', 'impression',
            'conclusion', 'fill', 'patient', 'study', 'examination',
            'physician', 'hospital', 'chest', 'abdomen', 'brain',
            'spine', 'knee', 'ankle', 'shoulder', 'liver', 'kidney',
            'unremarkable', 'normal', 'abnormal'
        ]

        # Arabic indicators
        arabic_indicators = ['المريض', 'الفحص', 'النتائج', 'الاستنتاج', 'التقنية']

        # Count occurrences
        french_count = sum(1 for word in french_indicators if word in text_lower)
        english_count = sum(1 for word in english_indicators if word in text_lower)
        arabic_count = sum(1 for word in arabic_indicators if word in text_lower)

        # Return language with highest count
        if french_count > english_count and french_count > arabic_count:
            return 'fr'
        elif arabic_count > 0:
            return 'ar'
        elif english_count > 0:
            return 'en'
        else:
            # Default to French for backward compatibility
            return 'fr'


def load_templates_from_files(templates_dir: Optional[str] = None) -> List[Dict]:
    """
    Convenience function to load all templates from directory

    Args:
        templates_dir: Optional path to templates directory. If not provided,
                      will auto-detect based on environment.

    Returns:
        List of template dictionaries ready for database insertion
    """
    loader = TemplateLoader(templates_dir)
    return loader.load_all_templates()


# Default templates (fallback if no .docx files found)
DEFAULT_TEMPLATES = [
    {
        "template_id": "ctpa_pe",
        "title": "CT Pulmonary Angiography – Pulmonary Embolism",
        "keywords": ["ctpa", "pulmonary embolism", "pe", "angiography", "dyspnea"],
        "category": "CT",
        "language": "en",
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
Helical acquisition from lung apices to bases following IV contrast.

Findings:
• Pulmonary arteries: <fill>
• Right heart strain: <fill>
• Lungs and pleura: <fill>
• Mediastinum: Unremarkable
• Upper abdomen: Unremarkable

Impression:
1) <main conclusion>

Signed electronically by {doctor_name}, {study_datetime}
"""
    },
    {
        "template_id": "cxr_normal",
        "title": "Chest X-ray – Normal",
        "keywords": ["cxr", "xray", "chest", "radiograph"],
        "category": "X-Ray",
        "language": "en",
        "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: Chest X-ray
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Findings:
• Cardiomediastinal silhouette: Normal
• Lungs: Clear
• Pleura: Normal
• Bones: Normal

Impression:
<conclusion>

Signed electronically by {doctor_name}, {study_datetime}
"""
    }
]
