"""
AI Analysis Service - Handles summary generation and inconsistency detection
"""
import re
from typing import Dict, List, Optional, Tuple
import google.generativeai as genai

from config import settings


class AIAnalysisService:
    """Service for AI-powered report analysis, summary generation, and validation"""

    def __init__(self):
        """Initialize the AI analysis service"""
        self.model_name = settings.GEMINI_MODEL

    def _detect_language(self, text: str) -> str:
        """
        Detect the language of the text

        Returns:
            Language code ('fr' for French, 'en' for English, 'ar' for Arabic, etc.)
        """
        text_lower = text.lower()

        # French indicators
        french_keywords = ['patient', 'radiographie', 'échographie', 'scanner', 'irm',
                          'résultats', 'conclusion', 'pas de', 'aucune', 'sans',
                          'examen', 'réalisé', 'étude', 'la', 'le', 'les', 'des']
        french_count = sum(1 for keyword in french_keywords if keyword in text_lower)

        # English indicators
        english_keywords = ['patient', 'radiograph', 'ultrasound', 'ct', 'mri',
                           'findings', 'impression', 'conclusion', 'no', 'none',
                           'examination', 'study', 'the', 'a', 'an', 'of']
        english_count = sum(1 for keyword in english_keywords if keyword in text_lower)

        # Arabic indicators
        arabic_pattern = re.compile(r'[\u0600-\u06FF]')
        has_arabic = bool(arabic_pattern.search(text))

        if has_arabic:
            return 'ar'
        elif french_count > english_count:
            return 'fr'
        else:
            return 'en'

    def generate_summary(self, report_text: str, indication_text: str = "", max_length: int = 200) -> Dict[str, str]:
        """
        Generate a concise summary/impression and conclusion from a full radiology report

        Args:
            report_text: The full report text
            indication_text: The original clinical indication (input)
            max_length: Maximum length of the summary in words

        Returns:
            Dict with 'summary', 'conclusion', 'key_findings', and 'language' keys
        """
        # Detect language of the report
        detected_language = self._detect_language(report_text)

        # Language-specific instructions
        language_instructions = {
            'fr': {
                'name': 'French',
                'summary_label': 'SYNTHÈSE',
                'conclusion_label': 'CONCLUSION',
                'example': 'Ex: "Absence d\'anomalie significative" ou "Pneumonie du lobe inférieur droit"'
            },
            'en': {
                'name': 'English',
                'summary_label': 'SUMMARY',
                'conclusion_label': 'CONCLUSION',
                'example': 'Ex: "No significant abnormality" or "Right lower lobe pneumonia"'
            },
            'ar': {
                'name': 'Arabic',
                'summary_label': 'الملخص',
                'conclusion_label': 'الخلاصة',
                'example': 'مثال: "لا توجد تشوهات كبيرة" أو "التهاب رئوي"'
            }
        }

        lang_config = language_instructions.get(detected_language, language_instructions['en'])

        # Prepare prompt for summary generation
        system_instruction = (
            f"You are an expert radiologist assistant. Generate a concise, clinically accurate "
            f"impression and conclusion from the provided radiology report in {lang_config['name']}. "
            f"Focus on the most important findings and their clinical significance. "
            f"CRITICAL: Respond ONLY in {lang_config['name']} language, matching the language of the report."
        )

        user_prompt = f"""
Based on the following radiology report, generate BOTH a summary and a conclusion in {lang_config['name']}.

ORIGINAL CLINICAL INDICATION:
\"\"\"{indication_text}\"\"\"

FULL RADIOLOGY REPORT:
\"\"\"{report_text}\"\"\"

Generate TWO sections:

1. {lang_config['summary_label']} (Concise impression - {max_length} words max):
   - Summarize the key imaging findings
   - Prioritize clinically significant findings
   - Use clear, professional medical terminology
   - Structure as numbered points if multiple findings
   {lang_config['example']}

2. {lang_config['conclusion_label']} (Clinical conclusion based on indication):
   - Address the original clinical question/indication
   - Provide clinical interpretation
   - Suggest follow-up if needed
   - Be direct and actionable

IMPORTANT:
- Write ONLY in {lang_config['name']}
- Do NOT include section headers in your response
- Separate the summary and conclusion with a blank line
- First paragraph = Summary, Second paragraph = Conclusion

Generate the response:
""".strip()

        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            response = model.generate_content(user_prompt)
            full_response = response.text.strip()

            # Split response into summary and conclusion
            paragraphs = [p.strip() for p in full_response.split('\n\n') if p.strip()]

            summary = paragraphs[0] if len(paragraphs) > 0 else full_response
            conclusion = paragraphs[1] if len(paragraphs) > 1 else ""

            # Extract key findings
            key_findings = self._extract_key_findings(report_text)

            return {
                "summary": summary,
                "conclusion": conclusion,
                "key_findings": key_findings,
                "language": detected_language
            }
        except Exception as e:
            print(f"Error generating summary: {e}")
            return {
                "summary": "Error generating summary. Please try again.",
                "conclusion": "",
                "key_findings": [],
                "language": detected_language
            }

    def detect_inconsistencies(self, report_text: str) -> Dict[str, any]:
        """
        Detect inconsistencies and errors in a radiology report

        Args:
            report_text: The full report text

        Returns:
            Dict with 'errors', 'warnings', 'is_consistent', and 'details' keys
        """
        # Extract different sections
        findings = self._extract_section(report_text, ["findings", "résultats", "observations"])
        impression = self._extract_section(report_text, ["impression", "conclusion", "synthèse"])

        errors = []
        warnings = []
        details = []

        # Check if key sections exist
        if not findings and not impression:
            errors.append("Report is missing both Findings and Impression sections")
            return {
                "errors": errors,
                "warnings": warnings,
                "is_consistent": False,
                "severity": "high",
                "details": ["Cannot perform consistency check without key sections"]
            }

        # Use AI to check for semantic inconsistencies
        system_instruction = (
            "You are an expert medical quality assurance assistant. Analyze radiology reports "
            "for inconsistencies, errors, and logical contradictions between findings and impressions."
        )

        user_prompt = f"""
Analyze the following radiology report for inconsistencies, errors, and contradictions.

REPORT:
{report_text}

Check for:
1. Contradictions between Findings and Impression/Conclusion
2. Severity mismatches (e.g., normal findings but abnormal conclusion)
3. Missing critical information
4. Logical inconsistencies
5. Unclear or ambiguous statements that could lead to misinterpretation

Respond in the following JSON-like format:
ERRORS: [list critical issues that must be fixed]
WARNINGS: [list minor issues or potential concerns]
INCONSISTENCIES: [list specific contradictions found]
SEVERITY: [high/medium/low]

Be specific and reference the conflicting statements.
""".strip()

        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            response = model.generate_content(user_prompt)
            analysis = response.text.strip()

            # Parse the AI response
            parsed_results = self._parse_validation_response(analysis)

            errors.extend(parsed_results.get('errors', []))
            warnings.extend(parsed_results.get('warnings', []))
            details.extend(parsed_results.get('inconsistencies', []))
            severity = parsed_results.get('severity', 'medium')

            # Add rule-based checks
            rule_based_checks = self._rule_based_validation(findings, impression)
            errors.extend(rule_based_checks['errors'])
            warnings.extend(rule_based_checks['warnings'])
            details.extend(rule_based_checks['details'])

            is_consistent = len(errors) == 0

            return {
                "errors": errors,
                "warnings": warnings,
                "is_consistent": is_consistent,
                "severity": severity if errors else ("medium" if warnings else "low"),
                "details": details
            }

        except Exception as e:
            print(f"Error detecting inconsistencies: {e}")
            return {
                "errors": [f"Validation service error: {str(e)}"],
                "warnings": [],
                "is_consistent": False,
                "severity": "unknown",
                "details": []
            }

    def _extract_section(self, text: str, section_keywords: List[str]) -> str:
        """Extract a specific section from the report"""
        text_lower = text.lower()

        for keyword in section_keywords:
            # Look for section headers
            pattern = rf'(?:^|\n)\s*{keyword}\s*:?\s*\n(.*?)(?=\n\s*[A-Z][a-z]+\s*:|$)'
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()

        return ""

    def _extract_key_findings(self, report_text: str) -> List[str]:
        """Extract key findings as bullet points"""
        findings = []

        # Look for bullet points or numbered lists
        bullet_pattern = r'(?:^|\n)\s*[•\-\*\d+\.]\s*(.+?)(?=\n|$)'
        matches = re.findall(bullet_pattern, report_text, re.MULTILINE)

        if matches:
            findings = [m.strip() for m in matches if len(m.strip()) > 10][:5]  # Top 5 findings

        return findings

    def _parse_validation_response(self, response: str) -> Dict[str, any]:
        """Parse the AI validation response"""
        result = {
            'errors': [],
            'warnings': [],
            'inconsistencies': [],
            'severity': 'medium'
        }

        # Extract errors
        errors_match = re.search(r'ERRORS?:\s*\[(.*?)\]', response, re.DOTALL | re.IGNORECASE)
        if errors_match:
            errors_text = errors_match.group(1)
            result['errors'] = [e.strip(' "\'') for e in errors_text.split(',') if e.strip()]

        # Extract warnings
        warnings_match = re.search(r'WARNINGS?:\s*\[(.*?)\]', response, re.DOTALL | re.IGNORECASE)
        if warnings_match:
            warnings_text = warnings_match.group(1)
            result['warnings'] = [w.strip(' "\'') for w in warnings_text.split(',') if w.strip()]

        # Extract inconsistencies
        inconsist_match = re.search(r'INCONSISTENC(?:Y|IES):\s*\[(.*?)\]', response, re.DOTALL | re.IGNORECASE)
        if inconsist_match:
            inconsist_text = inconsist_match.group(1)
            result['inconsistencies'] = [i.strip(' "\'') for i in inconsist_text.split(',') if i.strip()]

        # Extract severity
        severity_match = re.search(r'SEVERITY:\s*(\w+)', response, re.IGNORECASE)
        if severity_match:
            result['severity'] = severity_match.group(1).lower()

        return result

    def _rule_based_validation(self, findings: str, impression: str) -> Dict[str, List[str]]:
        """Apply rule-based validation checks"""
        errors = []
        warnings = []
        details = []

        if not findings:
            warnings.append("Findings section is empty or missing")

        if not impression:
            warnings.append("Impression/Conclusion section is empty or missing")

        # Check for conflicting sentiment
        if findings and impression:
            # Check for "normal" vs "abnormal" conflicts
            findings_normal = any(word in findings.lower() for word in ['normal', 'unremarkable', 'no abnormality', 'pas d\'anomalie'])
            findings_abnormal = any(word in findings.lower() for word in ['abnormal', 'lesion', 'mass', 'fracture', 'anomalie'])

            impression_normal = any(word in impression.lower() for word in ['normal', 'unremarkable', 'no abnormality', 'pas d\'anomalie'])
            impression_abnormal = any(word in impression.lower() for word in ['abnormal', 'lesion', 'mass', 'fracture', 'anomalie'])

            if findings_normal and impression_abnormal:
                errors.append("Contradiction: Findings suggest normal exam but impression indicates abnormality")
                details.append("Findings contain 'normal/unremarkable' while impression suggests abnormality")

            if findings_abnormal and impression_normal:
                errors.append("Contradiction: Findings describe abnormalities but impression suggests normal exam")
                details.append("Findings describe abnormalities while impression suggests normal exam")

        # Check for placeholders that weren't filled
        placeholder_patterns = [r'<[^>]+>', r'\{[^}]+\}', r'TODO', r'FILL', r'XXX']
        for pattern in placeholder_patterns:
            if re.search(pattern, findings + impression, re.IGNORECASE):
                errors.append(f"Unfilled placeholder detected: {pattern}")

        # Check for very short impression (likely incomplete)
        if impression and len(impression.split()) < 3:
            warnings.append("Impression section is very brief and may be incomplete")

        return {
            'errors': errors,
            'warnings': warnings,
            'details': details
        }


# Singleton instance
ai_analysis_service = AIAnalysisService()
