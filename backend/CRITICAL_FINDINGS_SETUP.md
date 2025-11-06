# Critical Findings Notification System

## Overview

The Critical Findings Notification System automatically detects life-threatening or urgent findings in radiology reports and sends immediate email notifications to referring physicians. This is a critical patient safety feature required in all medical imaging facilities.

## Features

### 1. **Automatic Detection**
- AI-powered keyword detection for critical findings
- 60+ predefined critical conditions across all imaging modalities
- Confidence scoring and context analysis
- Three severity levels: CRITICAL, URGENT, HIGH

### 2. **Email Notifications**
- Beautiful HTML emails with patient information
- Excerpt of relevant findings
- High-priority email flags
- Read receipt tracking
- Professional medical formatting

### 3. **Audit Trail**
- Complete notification log in database
- Timestamps for sent/read/acknowledged
- Notification status tracking
- Escalation workflow support

### 4. **Security & Compliance**
- HIPAA-compliant notification system
- Role-based access control
- Audit logging of all notifications
- Secure SMTP with TLS encryption

## Critical Findings Detected

### CRITICAL (Life-threatening - immediate action)

**Vascular Emergencies:**
- Aortic dissection/rupture
- Active hemorrhage
- Massive pulmonary embolism
- Ruptured aneurysm

**Neurological Emergencies:**
- Acute stroke (ischemic/hemorrhagic)
- Subarachnoid hemorrhage
- Epidural/subdural hematoma
- Brain herniation
- Acute hydrocephalus

**Cardiac Emergencies:**
- Cardiac tamponade
- Acute myocardial infarction

**Respiratory Emergencies:**
- Tension pneumothorax

**Abdominal Emergencies:**
- Free air/pneumoperitoneum
- Bowel perforation
- Ruptured spleen
- Mesenteric ischemia

**Oncologic Emergencies:**
- Spinal cord compression
- Superior vena cava syndrome

### URGENT (Serious - action within hours)

**Vascular:**
- Pulmonary embolism
- Deep vein thrombosis
- Expanding aneurysm

**Respiratory:**
- Large pneumothorax
- Lung abscess
- Empyema

**Abdominal:**
- Bowel obstruction
- Acute cholecystitis
- Acute pancreatitis
- Organ laceration

**Infectious:**
- Abscess
- Acute osteomyelitis

**Oncologic:**
- Pathologic fracture
- Suspicious mass/likely malignancy

### HIGH (Important - follow-up soon)

- Pneumonia
- Fractures (displaced, comminuted, open)
- Suspicious nodules/lesions
- Cannot exclude malignancy

## Setup Instructions

### 1. Run Database Migration

```bash
# Run the migration to create critical_notifications table
docker exec -it radiology-backend-local python migrate_critical_notifications.py
```

Expected output:
```
======================================================================
Running Critical Notifications Migration...
======================================================================

📋 Creating critical_notifications table...
  ✓ Created critical_notifications table
  ✓ Created index on report_id
  ✓ Created index on status
  ✓ Created index on created_at

======================================================================
✅ Migration completed successfully!
======================================================================
```

### 2. Configure Email Settings

Add these environment variables to your `.env` file or `docker-compose.yml`:

```bash
# Enable critical notifications
CRITICAL_NOTIFICATIONS_ENABLED=true

# SMTP Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password  # See instructions below

# Email sender
FROM_EMAIL=your_email@gmail.com
FROM_NAME=Radiology AI Suite - Critical Alerts
```

### 3. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication**:
   - Go to Google Account settings
   - Security → 2-Step Verification → Turn On

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password
   - Use this as `SMTP_PASSWORD`

3. **Important**: DO NOT use your regular Gmail password!

### 4. Other Email Providers

**Outlook/Office365:**
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
```

**SendGrid (Production Recommended):**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
```

**AWS SES:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_ses_smtp_username
SMTP_PASSWORD=your_ses_smtp_password
```

### 5. Restart Services

```bash
docker-compose -f docker-compose.local.yml restart backend
```

## How It Works

### 1. Report Generation
When a radiology report is generated:

```
User submits indication → AI generates report → Critical detector scans text
                                                         ↓
                                         Critical findings detected?
                                                    ↓ YES
                           Create notification record in database
                                                    ↓
                                Send email to referring physician
                                                    ↓
                              Track status (pending → sent → read → acknowledged)
```

### 2. Detection Algorithm

```python
1. Scan report text for 60+ critical keywords
2. Check context for negation words (e.g., "no evidence of")
3. Calculate confidence score (0.0 to 1.0)
4. Categorize findings (vascular, neurological, respiratory, etc.)
5. Determine severity (critical/urgent/high)
6. If confidence >= 0.5 and severity is critical/urgent → send notification
```

### 3. Email Notification

**Subject:** `🚨 CRITICAL FINDING - [Patient Name] - Accession: [Number]`

**Contains:**
- Patient information (name, accession, date/time)
- List of critical findings with severity badges
- Relevant excerpt from report
- Radiologist name and contact
- Action required notice
- Notification ID for tracking

## API Endpoints

### Get All Notifications
```bash
GET /api/notifications?status=pending&limit=50

# Returns list of notifications filtered by user role:
# - Doctors: notifications sent to them
# - Radiologists: notifications they sent
# - Admins: all notifications
```

### Get Single Notification
```bash
GET /api/notifications/{notification_id}

# Automatically marks as "read" when recipient views
```

### Acknowledge Notification
```bash
POST /api/notifications/{notification_id}/acknowledge
{
  "note": "Patient contacted and scheduled for follow-up"
}

# Marks notification as acknowledged
# Only recipient can acknowledge
```

### Get Statistics
```bash
GET /api/notifications/stats/summary

# Returns:
{
  "total": 10,
  "pending": 2,
  "sent": 3,
  "read": 3,
  "acknowledged": 7,
  "unacknowledged": 3
}
```

## Testing

### 1. Test Critical Finding Detection

Generate a report with this indication:

```
Patient with acute chest pain and shortness of breath.
CT shows large filling defect in right pulmonary artery
consistent with acute pulmonary embolism.
```

You should see:
```
⚠️  Critical findings detected, creating notification...
✓ Critical findings notification sent successfully
```

### 2. Test Email Delivery

Check the recipient email inbox for:
- Subject: 🚨 CRITICAL FINDING
- HTML-formatted email with patient details
- Listed critical findings
- High-priority flag

### 3. Check Database

```bash
# View all notifications
docker exec -it radiology-postgres psql -U postgres -d radiology_db \
  -c "SELECT id, recipient_email, priority, status, sent_at FROM critical_notifications;"
```

## Workflow Examples

### Example 1: Emergency Department Referral

1. **Radiologist** generates CT head report
2. **System** detects "acute subdural hematoma"
3. **System** creates notification with CRITICAL priority
4. **System** sends email to ER physician (referrer)
5. **ER Physician** receives email within seconds
6. **ER Physician** clicks notification → marked as "read"
7. **ER Physician** takes action and clicks "Acknowledge"
8. **System** logs acknowledgment with timestamp

### Example 2: Outpatient Follow-up

1. **Radiologist** generates chest X-ray report
2. **System** detects "suspicious nodule, cannot exclude malignancy"
3. **System** creates notification with HIGH priority
4. **System** sends email to referring physician
5. **Physician** schedules follow-up CT in 3 months
6. **Physician** acknowledges with note: "Follow-up CT scheduled"

### Example 3: False Positive Handling

1. **System** detects "pulmonary embolism"
2. But context shows "No evidence of pulmonary embolism"
3. **Confidence score** drops to 0.3 (below threshold)
4. **No notification sent** (correct behavior)

## Customization

### Add Custom Keywords

Edit `backend/critical_findings_detector.py`:

```python
CRITICAL_KEYWORDS = {
    "critical": [
        # Add your custom keywords here
        "your custom critical finding",
    ],
    "urgent": [
        # Add urgent findings
    ]
}
```

### Change Confidence Threshold

In `critical_findings_detector.py`:

```python
def should_notify(self, findings):
    for finding in findings:
        if finding['confidence'] >= 0.5:  # Change threshold here
            return True
```

### Customize Email Template

Edit `backend/notification_service.py` in the `_compose_html_email()` method.

## Monitoring & Metrics

### Key Metrics to Track

1. **Notification Volume**
   - Total notifications sent per day/week/month
   - By severity level (critical vs urgent vs high)

2. **Response Time**
   - Time from notification sent → read
   - Time from read → acknowledged

3. **Acknowledgment Rate**
   - Percentage of notifications acknowledged
   - Average time to acknowledge

4. **False Positive Rate**
   - Notifications sent but not critical (user feedback)

### Alerts to Set Up

1. **Unacknowledged Notifications**
   - Alert if critical notification unacknowledged > 30 minutes

2. **Email Delivery Failures**
   - Alert if SMTP errors exceed threshold

3. **High Volume**
   - Alert if > 10 critical findings in 1 hour (unusual pattern)

## Troubleshooting

### Notifications Not Sending

1. **Check logs:**
```bash
docker logs radiology-backend-local | grep "critical"
```

2. **Verify environment variables:**
```bash
docker exec radiology-backend-local env | grep SMTP
```

3. **Test SMTP connection:**
```python
import smtplib
server = smtplib.SMTP('smtp.gmail.com', 587)
server.starttls()
server.login('your_email@gmail.com', 'your_app_password')
# Should succeed without errors
```

### Detection Not Working

1. **Check if keywords match:**
```python
from critical_findings_detector import critical_detector

result = critical_detector.detect_critical_findings(
    "Patient has acute subdural hematoma",
    ""
)
print(result)
# Should show has_critical=True
```

2. **Check confidence threshold**
3. **Review negation detection**

### Emails Going to Spam

1. **Use dedicated email service** (SendGrid, AWS SES)
2. **Set up SPF/DKIM records** for your domain
3. **Verify sender domain**
4. **Avoid spam trigger words** in subject

## Security Considerations

1. **PHI Protection**: Emails contain patient information - ensure HIPAA compliance
2. **Encryption**: Always use TLS for SMTP (port 587)
3. **Access Control**: Only authorized users can view notifications
4. **Audit Trail**: All notifications logged with timestamps
5. **Email Security**: Use app-specific passwords, not main credentials

## Future Enhancements

Potential improvements:
- SMS notifications via Twilio
- Push notifications to mobile app
- Escalation workflow (auto-escalate if not acknowledged in X minutes)
- Integration with PACS/RIS
- Real-time dashboard for notification monitoring
- Machine learning to improve detection accuracy
- Multi-language support for notifications

---

**Status**: ✅ Fully Functional
**Version**: 1.0.0
**Last Updated**: 2025-01-04
