"""
Template Loader - Automatically loads radiology templates from .docx files
"""
import os
import re
from pathlib import Path
from typing import List, Dict, Optional
from docx import Document


class TemplateLoader:
    """Loads radiology templates from Word documents"""

    def __init__(self, templates_dir: str = "/app/templates"):
        self.templates_dir = Path(templates_dir)

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

    def _load_template(self, docx_path: Path) -> Optional[Dict]:
        """Load a single template from a .docx file"""
        doc = Document(docx_path)

        # Extract all text from paragraphs
        all_text = []
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                all_text.append(text)

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

        return {
            'template_id': template_id,
            'title': title,
            'keywords': keywords,
            'skeleton': skeleton,
            'category': category,
            'is_active': True
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


def load_templates_from_files(templates_dir: str = "/app/templates") -> List[Dict]:
    """
    Convenience function to load all templates from directory

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
