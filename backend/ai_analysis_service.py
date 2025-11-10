"""
AI Analysis Service - Handles summary generation and inconsistency detection
"""
import re
from typing import Dict, List, Optional, Tuple

# Import will be done lazily to avoid circular dependency
_llm_service = None

def get_llm_service():
    """Lazy import of LLM service to avoid circular dependency"""
    global _llm_service
    if _llm_service is None:
        from llm_service import llm_service
        _llm_service = llm_service
    return _llm_service


class AIAnalysisService:
    """Service for AI-powered report analysis, summary generation, and validation"""

    def __init__(self):
        """Initialize the AI analysis service"""
        pass

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

    def generate_summary(self, report_text: str, indication_text: str = "", max_length: int = 200, language: str = None) -> Dict[str, str]:
        """
        Generate a concise summary/impression and conclusion from a full radiology report

        Args:
            report_text: The full report text
            indication_text: The original clinical indication (input)
            max_length: Maximum length of the summary in words
            language: Language for output (en or fr). If None, auto-detect from report.

        Returns:
            Dict with 'summary', 'conclusion', 'key_findings', and 'language' keys
        """
        # Use provided language or detect from report
        if language:
            target_language = language
        else:
            target_language = self._detect_language(report_text)

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

        lang_config = language_instructions.get(target_language, language_instructions['en'])

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
            llm = get_llm_service()
            full_response = llm.generate_content(
                system_instruction=system_instruction,
                user_prompt=user_prompt
            )

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
                "language": target_language
            }
        except Exception as e:
            print(f"Error generating summary: {e}")
            return {
                "summary": "Error generating summary. Please try again.",
                "conclusion": "",
                "key_findings": [],
                "language": target_language
            }

    def detect_inconsistencies(self, report_text: str, language: str = 'en') -> Dict[str, any]:
        """
        Detect inconsistencies and errors in a radiology report

        Args:
            report_text: The full report text
            language: Language for validation messages (en or fr, default: en)

        Returns:
            Dict with 'errors', 'warnings', 'is_consistent', and 'details' keys
        """
        # Language-specific messages
        messages = {
            'en': {
                'missing_sections': "Report is missing both Findings and Impression sections",
                'cannot_check': "Cannot perform consistency check without key sections",
                'missing_findings': "Findings section is empty or missing",
                'missing_impression': "Impression/Conclusion section is empty or missing",
                'contradiction_normal_abnormal': "Contradiction: Findings suggest normal exam but impression indicates abnormality",
                'contradiction_abnormal_normal': "Contradiction: Findings describe abnormalities but impression suggests normal exam",
                'contradiction_details_1': "Findings contain 'normal/unremarkable' while impression suggests abnormality",
                'contradiction_details_2': "Findings describe abnormalities while impression suggests normal exam",
                'unfilled_placeholder': "Unfilled placeholder detected",
                'brief_impression': "Impression section is very brief and may be incomplete"
            },
            'fr': {
                'missing_sections': "Le rapport manque des sections Résultats et Impression",
                'cannot_check': "Impossible d'effectuer une vérification de cohérence sans sections clés",
                'missing_findings': "La section Résultats est vide ou manquante",
                'missing_impression': "La section Impression/Conclusion est vide ou manquante",
                'contradiction_normal_abnormal': "Contradiction: Les résultats suggèrent un examen normal mais l'impression indique une anomalie",
                'contradiction_abnormal_normal': "Contradiction: Les résultats décrivent des anomalies mais l'impression suggère un examen normal",
                'contradiction_details_1': "Les résultats contiennent 'normal/sans particularité' tandis que l'impression suggère une anomalie",
                'contradiction_details_2': "Les résultats décrivent des anomalies tandis que l'impression suggère un examen normal",
                'unfilled_placeholder': "Espace réservé non rempli détecté",
                'brief_impression': "La section Impression est très brève et peut être incomplète"
            }
        }

        msg = messages.get(language, messages['en'])

        # Extract different sections
        findings = self._extract_section(report_text, ["findings", "résultats", "observations"])
        impression = self._extract_section(report_text, ["impression", "conclusion", "synthèse"])

        errors = []
        warnings = []
        details = []

        # Check if key sections exist
        if not findings and not impression:
            errors.append(msg['missing_sections'])
            return {
                "errors": errors,
                "warnings": warnings,
                "is_consistent": False,
                "severity": "high",
                "details": [msg['cannot_check']]
            }

        # Use AI to check for semantic inconsistencies
        language_name = "French" if language == 'fr' else "English"
        system_instruction = (
            f"You are an expert medical quality assurance assistant. Analyze radiology reports "
            f"for inconsistencies, errors, and logical contradictions between findings and impressions. "
            f"Respond in {language_name}."
        )

        user_prompt = f"""
Analyze the following radiology report for inconsistencies, errors, and contradictions.
Respond in {language_name}.

REPORT:
{report_text}

Check for:
1. Contradictions between Findings and Impression/Conclusion
2. Severity mismatches (e.g., normal findings but abnormal conclusion)
3. Missing critical information
4. Logical inconsistencies
5. Unclear or ambiguous statements that could lead to misinterpretation

Respond in the following JSON-like format (in {language_name}):
ERRORS: [list critical issues that must be fixed]
WARNINGS: [list minor issues or potential concerns]
INCONSISTENCIES: [list specific contradictions found]
SEVERITY: [high/medium/low]

Be specific and reference the conflicting statements.
""".strip()

        try:
            llm = get_llm_service()
            analysis = llm.generate_content(
                system_instruction=system_instruction,
                user_prompt=user_prompt
            )

            # Parse the AI response
            parsed_results = self._parse_validation_response(analysis)

            errors.extend(parsed_results.get('errors', []))
            warnings.extend(parsed_results.get('warnings', []))
            details.extend(parsed_results.get('inconsistencies', []))
            severity = parsed_results.get('severity', 'medium')

            # Add rule-based checks
            rule_based_checks = self._rule_based_validation(findings, impression, msg)
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

    def _rule_based_validation(self, findings: str, impression: str, msg: Dict[str, str]) -> Dict[str, List[str]]:
        """Apply rule-based validation checks"""
        errors = []
        warnings = []
        details = []

        if not findings:
            warnings.append(msg['missing_findings'])

        if not impression:
            warnings.append(msg['missing_impression'])

        # Check for conflicting sentiment
        if findings and impression:
            # Check for "normal" vs "abnormal" conflicts
            findings_normal = any(word in findings.lower() for word in ['normal', 'unremarkable', 'no abnormality', 'pas d\'anomalie'])
            findings_abnormal = any(word in findings.lower() for word in ['abnormal', 'lesion', 'mass', 'fracture', 'anomalie'])

            impression_normal = any(word in impression.lower() for word in ['normal', 'unremarkable', 'no abnormality', 'pas d\'anomalie'])
            impression_abnormal = any(word in impression.lower() for word in ['abnormal', 'lesion', 'mass', 'fracture', 'anomalie'])

            if findings_normal and impression_abnormal:
                errors.append(msg['contradiction_normal_abnormal'])
                details.append(msg['contradiction_details_1'])

            if findings_abnormal and impression_normal:
                errors.append(msg['contradiction_abnormal_normal'])
                details.append(msg['contradiction_details_2'])

        # Check for placeholders that weren't filled
        placeholder_patterns = [r'<[^>]+>', r'\{[^}]+\}', r'TODO', r'FILL', r'XXX']
        for pattern in placeholder_patterns:
            if re.search(pattern, findings + impression, re.IGNORECASE):
                errors.append(f"{msg['unfilled_placeholder']}: {pattern}")

        # Check for very short impression (likely incomplete)
        if impression and len(impression.split()) < 3:
            warnings.append(msg['brief_impression'])

        return {
            'errors': errors,
            'warnings': warnings,
            'details': details
        }


# Singleton instance
ai_analysis_service = AIAnalysisService()
