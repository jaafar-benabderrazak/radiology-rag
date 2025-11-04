"""
Notification Service for Critical Findings
Sends email notifications for critical radiology findings
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """Service for sending critical findings notifications"""

    def __init__(self):
        # Email configuration from environment variables
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        self.from_name = os.getenv("FROM_NAME", "Radiology AI Suite - Critical Alerts")

        # SMS configuration (optional - for future implementation)
        self.sms_enabled = os.getenv("SMS_ENABLED", "false").lower() == "true"

        # Notification settings
        self.enabled = os.getenv("CRITICAL_NOTIFICATIONS_ENABLED", "true").lower() == "true"

    def send_critical_finding_notification(
        self,
        recipient_email: str,
        patient_name: str,
        accession: str,
        findings: List[Dict[str, Any]],
        report_excerpt: str,
        radiologist_name: str,
        notification_id: int
    ) -> bool:
        """
        Send critical finding notification email

        Args:
            recipient_email: Email of referring physician
            patient_name: Patient name
            accession: Study accession number
            findings: List of critical findings
            report_excerpt: Relevant excerpt from report
            radiologist_name: Name of radiologist
            notification_id: Database ID of notification

        Returns:
            True if sent successfully, False otherwise
        """
        if not self.enabled:
            logger.info("Critical notifications disabled, skipping email")
            return False

        if not self.smtp_user or not self.smtp_password:
            logger.warning("SMTP credentials not configured, cannot send email")
            return False

        try:
            # Compose email
            subject = f"🚨 CRITICAL FINDING - {patient_name} - Accession: {accession}"

            html_body = self._compose_html_email(
                patient_name=patient_name,
                accession=accession,
                findings=findings,
                report_excerpt=report_excerpt,
                radiologist_name=radiologist_name,
                notification_id=notification_id
            )

            text_body = self._compose_text_email(
                patient_name=patient_name,
                accession=accession,
                findings=findings,
                report_excerpt=report_excerpt,
                radiologist_name=radiologist_name
            )

            # Send email
            success = self._send_email(
                to_email=recipient_email,
                subject=subject,
                html_body=html_body,
                text_body=text_body
            )

            if success:
                logger.info(f"Critical finding notification sent to {recipient_email} for accession {accession}")
            else:
                logger.error(f"Failed to send notification to {recipient_email}")

            return success

        except Exception as e:
            logger.error(f"Error sending critical finding notification: {e}")
            return False

    def _compose_html_email(
        self,
        patient_name: str,
        accession: str,
        findings: List[Dict],
        report_excerpt: str,
        radiologist_name: str,
        notification_id: int
    ) -> str:
        """Compose HTML email body"""

        findings_html = ""
        for finding in findings:
            severity_color = {
                'critical': '#DC2626',
                'urgent': '#EA580C',
                'high': '#CA8A04'
            }.get(finding['severity'], '#64748B')

            findings_html += f"""
            <div style="margin: 10px 0; padding: 10px; background-color: #FEF2F2; border-left: 4px solid {severity_color};">
                <strong style="color: {severity_color}; text-transform: uppercase;">{finding['severity']}</strong>: {finding['text']}
                <br/>
                <small style="color: #64748B;">Category: {finding['category']} | Confidence: {finding['confidence']*100:.0f}%</small>
            </div>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">🚨 Critical Finding Alert</h1>
                <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Immediate attention required</p>
            </div>

            <div style="background-color: #FFFFFF; padding: 20px; border: 1px solid #E5E7EB; border-top: none; border-radius: 0 0 8px 8px;">
                <h2 style="color: #DC2626; margin-top: 0;">Patient Information</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold; width: 40%;">Patient:</td>
                        <td style="padding: 8px 0;">{patient_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Accession:</td>
                        <td style="padding: 8px 0;">{accession}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Date/Time:</td>
                        <td style="padding: 8px 0;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Radiologist:</td>
                        <td style="padding: 8px 0;">{radiologist_name}</td>
                    </tr>
                </table>

                <h2 style="color: #DC2626;">Critical Findings Detected</h2>
                {findings_html}

                <h2 style="color: #1F2937; margin-top: 30px;">Report Excerpt</h2>
                <div style="background-color: #F9FAFB; padding: 15px; border-radius: 6px; border-left: 4px solid #6366F1; font-size: 14px; white-space: pre-wrap; font-family: monospace;">
{report_excerpt}
                </div>

                <div style="margin-top: 30px; padding: 15px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px;">
                    <strong style="color: #92400E;">⚠️ Action Required:</strong>
                    <p style="margin: 5px 0 0 0; color: #78350F;">
                        This notification requires acknowledgment. Please review the findings and take appropriate action.
                        If you have any questions, contact the radiology department immediately.
                    </p>
                </div>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 12px;">
                    <p>Radiology AI Suite - Critical Findings Alert System</p>
                    <p>Notification ID: {notification_id} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p style="margin-top: 10px;">
                        <strong style="color: #DC2626;">This is an automated critical findings alert. Immediate review is required.</strong>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        return html

    def _compose_text_email(
        self,
        patient_name: str,
        accession: str,
        findings: List[Dict],
        report_excerpt: str,
        radiologist_name: str
    ) -> str:
        """Compose plain text email body"""

        findings_text = "\n".join([
            f"  - [{finding['severity'].upper()}] {finding['text']} (Category: {finding['category']}, Confidence: {finding['confidence']*100:.0f}%)"
            for finding in findings
        ])

        text = f"""
🚨 CRITICAL FINDING ALERT 🚨

IMMEDIATE ATTENTION REQUIRED

Patient Information:
  Patient: {patient_name}
  Accession: {accession}
  Date/Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
  Radiologist: {radiologist_name}

Critical Findings Detected:
{findings_text}

Report Excerpt:
{report_excerpt}

⚠️ ACTION REQUIRED:
This notification requires acknowledgment. Please review the findings and take appropriate action.
If you have any questions, contact the radiology department immediately.

---
Radiology AI Suite - Critical Findings Alert System
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

This is an automated critical findings alert. Immediate review is required.
        """
        return text

    def _send_email(self, to_email: str, subject: str, html_body: str, text_body: str) -> bool:
        """Send email via SMTP"""
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['From'] = f"{self.from_name} <{self.from_email}>"
            message['To'] = to_email
            message['Subject'] = subject
            message['X-Priority'] = '1'  # High priority
            message['X-MSMail-Priority'] = 'High'
            message['Importance'] = 'high'

            # Attach both plain text and HTML
            text_part = MIMEText(text_body, 'plain')
            html_part = MIMEText(html_body, 'html')

            message.attach(text_part)
            message.attach(html_part)

            # Connect and send
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)

            return True

        except Exception as e:
            logger.error(f"SMTP error: {e}")
            return False

# Singleton instance
notification_service = NotificationService()
