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

    def generate_summary(self, report_text: str, max_length: int = 200) -> Dict[str, str]:
        """
        Generate a concise summary/impression from a full radiology report

        Args:
            report_text: The full report text
            max_length: Maximum length of the summary in words

        Returns:
            Dict with 'summary' and 'key_findings' keys
        """
        # Extract findings section if present
        findings_section = self._extract_section(report_text, ["findings", "résultats", "observations"])

        # Prepare prompt for summary generation
        system_instruction = (
            "You are an expert radiologist assistant. Generate a concise, clinically accurate "
            "impression/conclusion from the provided radiology report. Focus on the most important "
            "findings and their clinical significance."
        )

        user_prompt = f"""
Based on the following radiology report, generate a concise IMPRESSION/CONCLUSION section.

Requirements:
1. Summarize the key findings in {max_length} words or less
2. Prioritize clinically significant findings
3. Use clear, professional medical terminology
4. Structure as numbered points if multiple findings
5. Include any urgent or critical findings first
6. Do NOT include headers or labels, just the content

FULL REPORT:
{report_text}

Generate the IMPRESSION/CONCLUSION:
""".strip()

        try:
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_instruction
            )
            response = model.generate_content(user_prompt)
            summary = response.text.strip()

            # Also extract key findings
            key_findings = self._extract_key_findings(report_text)

            return {
                "summary": summary,
                "key_findings": key_findings
            }
        except Exception as e:
            print(f"Error generating summary: {e}")
            return {
                "summary": "Error generating summary. Please try again.",
                "key_findings": []
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
