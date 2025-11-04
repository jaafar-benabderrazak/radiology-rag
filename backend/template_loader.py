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

        # Store the formatting metadata as JSON string for database storage
        formatting_metadata = json.dumps(paragraphs_formatting)

        return {
            'template_id': template_id,
            'title': title,
            'keywords': keywords,
            'skeleton': skeleton,
            'category': category,
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
    },
    {
        "template_id": "ct_head_stroke",
        "title": "CT Head – Acute Stroke Protocol",
        "keywords": ["ct brain", "stroke", "cva", "head ct", "acute", "neuro"],
        "category": "CT",
        "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: CT Head Non-Contrast
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Non-contrast axial CT from skull base to vertex.

Findings:
• Gray-white differentiation: <fill>
• Hemorrhage: <fill>
• Ventricles and cisterns: <fill>
• Mass effect/midline shift: <fill>
• Skull and calvarium: Intact
• Visualized paranasal sinuses: <fill>

Impression:
1) <main conclusion>

ASPECTS Score (if applicable): <score>/10

Signed electronically by {doctor_name}, {study_datetime}
"""
    },
    {
        "template_id": "mri_brain_dementia",
        "title": "MRI Brain – Dementia/Cognitive Decline",
        "keywords": ["mri brain", "dementia", "alzheimer", "cognitive", "memory loss"],
        "category": "IRM",
        "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: MRI Brain
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Multiplanar, multisequence MRI including T1, T2, FLAIR, DWI.

Findings:
• Cerebral volume: <fill>
• Hippocampal volume: <fill>
• White matter changes: <fill>
• Gray matter: <fill>
• Vascular changes: <fill>
• Focal lesions: <fill>

Impression:
1) <main conclusion>

Signed electronically by {doctor_name}, {study_datetime}
"""
    },
    {
        "template_id": "ct_abdomen_pelvis",
        "title": "CT Abdomen/Pelvis with Contrast",
        "keywords": ["ct abdomen", "ct pelvis", "abdominal pain", "contrast"],
        "category": "CT",
        "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: CT Abdomen and Pelvis with IV Contrast
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Multidetector CT following IV contrast administration.

Findings:
• Liver: <fill>
• Gallbladder: <fill>
• Pancreas: <fill>
• Spleen: <fill>
• Kidneys: <fill>
• Bowel: <fill>
• Bladder: <fill>
• Appendix: <fill>
• Vasculature: <fill>
• Lymph nodes: <fill>
• Bones: <fill>

Impression:
1) <main conclusion>

Signed electronically by {doctor_name}, {study_datetime}
"""
    },
    {
        "template_id": "mri_spine_lumbar",
        "title": "MRI Lumbar Spine – Back Pain",
        "keywords": ["mri spine", "lumbar", "back pain", "sciatica", "radiculopathy"],
        "category": "IRM",
        "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: MRI Lumbar Spine
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Multiplanar, multisequence MRI of the lumbar spine.

Findings:
Vertebral bodies: <fill>
Disc spaces:
• L1-L2: <fill>
• L2-L3: <fill>
• L3-L4: <fill>
• L4-L5: <fill>
• L5-S1: <fill>

Spinal canal: <fill>
Neural foramina: <fill>
Facet joints: <fill>
Paraspinal soft tissues: <fill>

Impression:
1) <main conclusion>

Signed electronically by {doctor_name}, {study_datetime}
"""
    },
    {
        "template_id": "us_abdomen_general",
        "title": "Ultrasound Abdomen – General",
        "keywords": ["ultrasound", "echo", "abdomen", "us", "liver", "gallbladder"],
        "category": "Ultrasound",
        "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: Ultrasound Abdomen
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Real-time ultrasound of the abdomen.

Findings:
• Liver: <fill>
• Gallbladder: <fill>
• Bile ducts: <fill>
• Pancreas: <fill>
• Spleen: <fill>
• Kidneys: <fill>
• Aorta: <fill>
• Ascites: <fill>

Impression:
1) <main conclusion>

Signed electronically by {doctor_name}, {study_datetime}
"""
    },
    {
        "template_id": "xray_abdomen_obstruction",
        "title": "Abdominal X-ray – Bowel Obstruction",
        "keywords": ["abdominal xray", "kub", "obstruction", "bowel", "ileus"],
        "category": "X-Ray",
        "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: Abdominal X-ray (Supine/Upright)
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Findings:
• Bowel gas pattern: <fill>
• Dilated loops: <fill>
• Air-fluid levels: <fill>
• Free air: <fill>
• Soft tissues: <fill>
• Bones: <fill>

Impression:
1) <main conclusion>

Signed electronically by {doctor_name}, {study_datetime}
"""
    },
    {
        "template_id": "ct_chest_lung_nodule",
        "title": "CT Chest – Lung Nodule Follow-up",
        "keywords": ["ct chest", "lung nodule", "pulmonary nodule", "screening"],
        "category": "CT",
        "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: CT Chest
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Thin-section CT of the chest.

Findings:
• Nodules: <fill>
• Lungs: <fill>
• Mediastinum: <fill>
• Lymph nodes: <fill>
• Pleura: <fill>
• Chest wall: <fill>

Impression:
1) <main conclusion>
2) Lung-RADS Category: <category>

Signed electronically by {doctor_name}, {study_datetime}
"""
    },
    {
        "template_id": "mri_knee_meniscus",
        "title": "MRI Knee – Meniscal Tear/Ligament Injury",
        "keywords": ["mri knee", "meniscus", "acl", "ligament", "joint"],
        "category": "IRM",
        "skeleton": """Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: MRI Knee
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Multiplanar, multisequence MRI of the knee.

Findings:
• Medial meniscus: <fill>
• Lateral meniscus: <fill>
• ACL: <fill>
• PCL: <fill>
• MCL: <fill>
• LCL: <fill>
• Articular cartilage: <fill>
• Joint effusion: <fill>
• Bone marrow: <fill>

Impression:
1) <main conclusion>

Signed electronically by {doctor_name}, {study_datetime}
"""
    }
]
