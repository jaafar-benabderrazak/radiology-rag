"""
Critical Findings Detection Service
Automatically detects critical/urgent findings in radiology reports for patient safety
"""
import re
from typing import List, Dict, Any
from enum import Enum

class FindingSeverity(str, Enum):
    CRITICAL = "critical"  # Life-threatening, requires immediate action
    URGENT = "urgent"     # Serious, requires action within hours
    HIGH = "high"         # Important, requires follow-up soon

# Critical keywords by category
CRITICAL_KEYWORDS = {
    # Life-threatening conditions (CRITICAL)
    "critical": [
        # Vascular emergencies
        "aortic dissection", "aortic rupture", "ruptured aneurysm", "active hemorrhage",
        "active bleeding", "massive hemorrhage", "acute arterial occlusion",

        # Neurological emergencies
        "acute stroke", "acute ischemic stroke", "hemorrhagic stroke", "subarachnoid hemorrhage",
        "subdural hematoma", "epidural hematoma", "acute hydrocephalus", "brainstem herniation",
        "uncal herniation", "tonsillar herniation", "midline shift",

        # Cardiac emergencies
        "cardiac tamponade", "acute myocardial infarction", "free air in pericardium",

        # Respiratory emergencies
        "tension pneumothorax", "massive pulmonary embolism", "large pulmonary embolism",

        # Abdominal emergencies
        "free air", "pneumoperitoneum", "ruptured spleen", "acute mesenteric ischemia",
        "bowel perforation", "perforated viscus", "acute appendicitis with perforation",

        # Infectious emergencies
        "necrotizing fasciitis", "gas gangrene", "septic emboli",

        # Oncologic emergencies
        "spinal cord compression", "superior vena cava syndrome",
    ],

    # Urgent findings (URGENT)
    "urgent": [
        # Vascular
        "pulmonary embolism", "deep vein thrombosis", "expanding aneurysm",
        "aortic aneurysm", "carotid dissection",

        # Neurological
        "acute infarct", "acute cerebral infarction", "acute intracranial hemorrhage",
        "mass effect", "acute hydrocephalus",

        # Respiratory
        "large pneumothorax", "pneumothorax", "lung abscess", "empyema",

        # Abdominal
        "bowel obstruction", "small bowel obstruction", "large bowel obstruction",
        "acute cholecystitis", "acute pancreatitis", "splenic laceration",
        "hepatic laceration", "renal laceration",

        # Infectious
        "abscess", "fluid collection", "acute osteomyelitis",

        # Oncologic
        "pathologic fracture", "suspicious mass", "likely malignancy",
    ],

    # High priority findings (HIGH)
    "high": [
        # Infections
        "pneumonia", "pyelonephritis", "cellulitis",

        # Fractures
        "fracture", "displaced fracture", "comminuted fracture",
        "open fracture", "hip fracture",

        # Suspicious findings
        "suspicious nodule", "suspicious lesion", "concerning finding",
        "recommend biopsy", "cannot exclude malignancy",
    ]
}

class CriticalFindingsDetector:
    """Detect critical findings in radiology reports"""

    def __init__(self):
        # Compile regex patterns for faster matching
        self.patterns = {}
        for severity, keywords in CRITICAL_KEYWORDS.items():
            self.patterns[severity] = [
                (keyword, re.compile(r'\b' + re.escape(keyword) + r'\b', re.IGNORECASE))
                for keyword in keywords
            ]

    def detect_critical_findings(self, report_text: str, indication: str = "") -> Dict[str, Any]:
        """
        Detect critical findings in report text

        Returns:
            {
                'has_critical': bool,
                'findings': [
                    {
                        'text': str,
                        'severity': str,
                        'category': str,
                        'confidence': float
                    }
                ],
                'highest_severity': str | None
            }
        """
        findings = []

        # Combine report and indication for analysis
        full_text = f"{indication}\n{report_text}"

        # Check for critical keywords
        for severity, patterns in self.patterns.items():
            for keyword, pattern in patterns:
                matches = pattern.finditer(full_text)
                for match in matches:
                    # Extract context around the match (50 chars before/after)
                    start = max(0, match.start() - 50)
                    end = min(len(full_text), match.end() + 50)
                    context = full_text[start:end].strip()

                    findings.append({
                        'text': keyword,
                        'severity': severity,
                        'category': self._categorize_finding(keyword),
                        'confidence': self._calculate_confidence(keyword, context, full_text),
                        'context': context
                    })

        # Remove duplicates and sort by severity
        findings = self._deduplicate_findings(findings)
        findings = sorted(findings, key=lambda x: self._severity_score(x['severity']), reverse=True)

        # Determine highest severity
        highest_severity = None
        if findings:
            highest_severity = findings[0]['severity']

        return {
            'has_critical': len(findings) > 0,
            'findings': findings,
            'highest_severity': highest_severity,
            'requires_notification': highest_severity in ['critical', 'urgent']
        }

    def _categorize_finding(self, keyword: str) -> str:
        """Categorize the finding by anatomical/system category"""
        keyword_lower = keyword.lower()

        if any(term in keyword_lower for term in ['aortic', 'aneurysm', 'hemorrhage', 'bleeding', 'embolism', 'thrombosis']):
            return 'vascular'
        elif any(term in keyword_lower for term in ['stroke', 'hematoma', 'hemorrhage', 'herniation', 'hydrocephalus', 'infarct']):
            return 'neurological'
        elif any(term in keyword_lower for term in ['pneumothorax', 'lung', 'pulmonary', 'respiratory']):
            return 'respiratory'
        elif any(term in keyword_lower for term in ['bowel', 'spleen', 'hepatic', 'abdominal', 'mesenteric', 'appendicitis']):
            return 'abdominal'
        elif any(term in keyword_lower for term in ['cardiac', 'myocardial', 'pericardium']):
            return 'cardiac'
        elif any(term in keyword_lower for term in ['abscess', 'necrotizing', 'septic', 'gangrene']):
            return 'infectious'
        elif any(term in keyword_lower for term in ['mass', 'malignancy', 'suspicious', 'nodule']):
            return 'oncologic'
        elif any(term in keyword_lower for term in ['fracture', 'bone']):
            return 'musculoskeletal'
        else:
            return 'other'

    def _calculate_confidence(self, keyword: str, context: str, full_text: str) -> float:
        """Calculate confidence score for the finding"""
        confidence = 0.7  # Base confidence

        # Increase confidence if keyword appears multiple times
        count = full_text.lower().count(keyword.lower())
        if count > 1:
            confidence += 0.1

        # Decrease confidence if negation words are nearby
        negation_words = ['no', 'not', 'without', 'negative for', 'ruled out', 'exclude']
        context_lower = context.lower()
        for neg in negation_words:
            if neg in context_lower:
                confidence -= 0.3
                break

        # Increase confidence for definitive language
        definitive_words = ['acute', 'active', 'confirmed', 'definite', 'identified']
        for word in definitive_words:
            if word in context_lower:
                confidence += 0.1
                break

        return max(0.0, min(1.0, confidence))

    def _deduplicate_findings(self, findings: List[Dict]) -> List[Dict]:
        """Remove duplicate findings"""
        seen = set()
        unique_findings = []

        for finding in findings:
            # Create a unique key based on text and severity
            key = (finding['text'].lower(), finding['severity'])
            if key not in seen:
                seen.add(key)
                unique_findings.append(finding)

        return unique_findings

    def _severity_score(self, severity: str) -> int:
        """Convert severity to numeric score for sorting"""
        scores = {
            'critical': 3,
            'urgent': 2,
            'high': 1
        }
        return scores.get(severity, 0)

    def should_notify(self, findings: List[Dict]) -> bool:
        """Determine if notification should be sent based on findings"""
        if not findings:
            return False

        # Notify if any critical or urgent findings with high confidence
        for finding in findings:
            if finding['severity'] in ['critical', 'urgent'] and finding['confidence'] >= 0.5:
                return True

        return False

# Singleton instance
critical_detector = CriticalFindingsDetector()
