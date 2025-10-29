# Template Guide - Creating Custom Radiology Templates

## Overview

The Radiology RAG system now **automatically loads** templates from Word documents (`.docx` files) in the `templates/` folder. Simply add a `.docx` file and restart the backend - it will appear in the UI!

## Template Structure

Each `.docx` template file should follow this structure:

```
Line 1: Template Title
Line 2: Keywords (comma-separated)
Rest:   Template skeleton with placeholders
```

### Example Template Structure

```
IRM Enterographie – Maladie de Crohn

Keywords: entero, enterographie, crohn, ileo, intestin, maladie inflammatoire, irm

Rapport de Radiologie
Médecin référent: {referrer}
Radiologue: {doctor_name}

Patient: {patient_name}
Étude: IRM Enterographie
Date/Heure de l'étude: {study_datetime}
N° Accession: {accession}

Indication:
{indication}

Technique:
Acquisition en coupes axiales et coronales T2, T1 avant et après injection de produit de contraste.

Résultats:
• Intestin grêle: <à remplir>
• Mésentère: <à remplir>
• Ganglions: <à remplir>
• Complications: <aucune ou décrire>

Impression:
<conclusion principale>

Signé électroniquement par {doctor_name}, {study_datetime}
```

## Required Elements

### 1. Title (Line 1)
The first line becomes the template title displayed in the UI.

**Examples:**
- `IRM Enterographie – Maladie de Crohn`
- `CT Pulmonary Angiography – PE Protocol`
- `Échographie Abdominale – Foie et Voies Biliaires`

### 2. Keywords (Line 2)
Keywords help the AI auto-detect the correct template based on clinical text.

**Format options:**
- `Keywords: word1, word2, word3`
- `Mots-clés: mot1, mot2, mot3`
- `Tags: tag1, tag2, tag3`
- Or just comma-separated words

**Best practices:**
- Include modality: `irm`, `ct`, `scanner`, `echo`, `radiographie`
- Include anatomy: `foie`, `poumon`, `intestin`, `cerveau`
- Include pathology: `crohn`, `embolie`, `lithiase`, `tumeur`
- Include common terms: `douleur abdominale`, `dyspnée`, `fièvre`
- Mix French and English for bilingual support

**Example:**
```
Keywords: entero, enterographie, crohn, maladie inflammatoire, irm, intestin, ileo, diarrhée
```

### 3. Template Skeleton (Rest of Document)
The report structure with placeholders for dynamic content.

## Placeholders

Use these placeholders in your template - they will be filled automatically:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{patient_name}` | Patient's name | Jean Dupont |
| `{doctor_name}` | Radiologist name | Dr. Marie Curie |
| `{referrer}` | Referring physician | Dr. Pasteur |
| `{hospital_name}` | Hospital name | Hôpital Général |
| `{study_datetime}` | Study date/time | 2025-10-29 14:30 |
| `{accession}` | Accession number | CR-12345 |
| `{indication}` | Clinical indication | Patient's symptoms entered by user |

## AI Fill Instructions

Use special markers to tell the AI what to generate:

- `<à remplir>` - AI will fill based on indication
- `<remplir concisément>` - Brief description
- `<normal ou anormal>` - AI decides
- `<aucune ou décrire>` - Conditional fill
- `<conclusion principale>` - Main finding

**French examples:**
```
Résultats:
• Foie: <à remplir>
• Vésicule biliaire: <normale ou anormale>
• Voies biliaires: <pas de dilatation ou décrire>
• Complications: <aucune ou lister>

Impression:
1) <diagnostic principal>
2) <diagnostic secondaire si applicable>
```

**English examples:**
```
Findings:
• Lungs: <fill>
• Pleura: <normal or describe abnormalities>
• Heart: <normal size or enlarged>
• Bones: <unremarkable or describe findings>

Impression:
<main conclusion>
```

## Automatic Category Detection

The system automatically detects the template category:

| Category | Keywords Detected |
|----------|-------------------|
| **CT** | ct, scanner, tomodensitométrie, tdm, ctpa |
| **IRM** | irm, mri, résonance magnétique |
| **X-Ray** | radiographie, radio, x-ray, cxr, thorax |
| **Ultrasound** | échographie, echo, ultrasound, us |
| **PET** | tep, pet, tomographie par émission |
| **Angiography** | angiographie, angiography, angio |

## Language Support

✅ **French** - Fully supported
✅ **English** - Fully supported
✅ **Mixed** - You can use both in same template

## Adding a New Template

### Step 1: Create Word Document

1. Open Microsoft Word or LibreOffice
2. Type the template following the structure above
3. Save as `.docx` format

### Step 2: Name the File

The filename becomes the template ID (lowercase, with underscores).

**Examples:**
- `ENTERO.docx` → template_id: `entero`
- `IRM BILIAIRE.docx` → template_id: `irm_biliaire`
- `CT_CHEST_PE.docx` → template_id: `ct_chest_pe`

### Step 3: Copy to templates/ Folder

```bash
# On Windows (your case)
copy "C:\path\to\your\template.docx" "C:\Users\j.benabderrazak\OneDrive - Reply\Bureau\work\radiology-rag\radiology-rag\templates\"

# On Linux/Mac
cp /path/to/template.docx /home/user/radiology-rag/templates/
```

### Step 4: Restart Backend

The system loads templates on startup:

```powershell
# Windows
docker-compose restart backend
docker-compose logs -f backend
```

You'll see:
```
Loading templates from files...
Found 2 template files:
  Loading: ENTERO.docx
    ✓ Loaded: IRM Enterographie – Maladie de Crohn
  Loading: IRM BILIAIRE.docx
    ✓ Loaded: IRM des Voies Biliaires
✓ Seeded 2 templates successfully
```

### Step 5: Verify in UI

1. Open http://localhost:3000
2. Check the template dropdown
3. Your new template should appear!

## Example Templates

### French - IRM Enterographie

```
IRM Enterographie – Maladie de Crohn

Keywords: entero, enterographie, crohn, maladie inflammatoire, irm, intestin

Rapport de Radiologie
Médecin référent: {referrer}
Radiologue: {doctor_name}

Patient: {patient_name}
Étude: IRM Enterographie
Date/Heure: {study_datetime}
N° Accession: {accession}

Indication:
{indication}

Technique:
IRM abdominale avec séquences T2, T1 avant et après injection IV de gadolinium.

Résultats:
• Intestin grêle: <décrire épaississement, rehaussement, sténoses>
• Mésentère: <normal ou graisse mésentérique>
• Ganglions lymphatiques: <normaux ou augmentés>
• Complications: <fistules, abcès, occlusion - aucune ou décrire>

Impression:
<degré d'activité de la maladie de Crohn, localisation, complications>

Signé électroniquement par {doctor_name}, {study_datetime}
```

### English - CT Abdomen

```
CT Abdomen and Pelvis with Contrast

Keywords: ct, abdomen, pelvis, contrast, scanner, abdominal pain

Radiology Report
Referring Physician: {referrer}
Reporting Radiologist: {doctor_name}

Patient: {patient_name}
Study: CT Abdomen and Pelvis with IV Contrast
Study Date/Time: {study_datetime}
Accession/ID: {accession}

Indication:
{indication}

Technique:
Helical CT acquisition through the abdomen and pelvis following IV contrast administration.

Findings:
• Liver: <normal or describe lesions>
• Gallbladder: <normal or abnormal>
• Pancreas: <normal or findings>
• Spleen: <normal size or enlarged>
• Kidneys: <bilateral normal or describe>
• Bowel: <normal or obstruction/inflammation>
• Peritoneum: <no free fluid or describe>

Impression:
1) <primary finding>
2) <additional findings if present>

Electronically signed by {doctor_name}, {study_datetime}
```

### Bilingual - Échographie Hépatique / Liver Ultrasound

```
Échographie Hépatique – Liver Ultrasound

Keywords: echo, échographie, foie, liver, ultrasound, hepatique, hepatic

Rapport de Radiologie / Radiology Report
Médecin référent / Referring: {referrer}
Radiologue / Radiologist: {doctor_name}

Patient: {patient_name}
Étude / Study: Échographie abdominale / Abdominal Ultrasound
Date/Heure / Date/Time: {study_datetime}
N° / ID: {accession}

Indication:
{indication}

Technique / Technique:
Échographie abdominale en temps réel / Real-time abdominal ultrasound

Résultats / Findings:
• Foie / Liver: <normal ou stéatose, lésions>
• Vésicule / Gallbladder: <normale ou lithiases>
• Voies biliaires / Bile ducts: <pas de dilatation ou dilatées>

Impression:
<conclusion>

Signé électroniquement / Electronically signed by {doctor_name}, {study_datetime}
```

## Troubleshooting

### Template Not Loading

**Check logs:**
```powershell
docker-compose logs backend | Select-String "template"
```

**Common issues:**
1. **File not .docx** - Must be Word format, not .doc or .pdf
2. **Empty file** - Needs at least title and content
3. **Temporary file** - Files starting with `~$` are skipped
4. **Permission error** - Check file permissions

### Template Not Appearing in UI

1. **Check database:**
   ```powershell
   docker exec -it radiology-db psql -U radiology_user -d radiology_templates -c "SELECT template_id, title FROM templates;"
   ```

2. **Clear and reload:**
   ```powershell
   docker-compose down -v  # Warning: deletes data
   docker-compose up -d
   ```

### Keywords Not Working

- Use lowercase keywords
- Include variants: `irm`, `mri`, `resonance`
- Test with real clinical text
- Add more specific terms

## Advanced Features

### Custom Formatting

You can include:
- **Bold/Italic** - Will be preserved as plain text
- **Bullet points** - Use `•` or `-`
- **Section headers** - Use capitalization
- **Blank lines** - For spacing

### Multiple Sections

```
PARTIE 1: ABDOMEN SUPÉRIEUR
...

PARTIE 2: PELVIS
...

PARTIE 3: VAISSEAUX
...
```

### Conditional Sections

```
Si présence de lithiase:
• Taille: <mesurer>
• Localisation: <décrire>
• Complications: <aucune ou inflammation, occlusion>

Sinon:
• Vésicule biliaire normale
```

## Best Practices

✅ **DO:**
- Use clear, descriptive titles
- Include 5-10 relevant keywords
- Use consistent formatting
- Add specific fill instructions for AI
- Test with real clinical scenarios
- Use both French and English keywords

❌ **DON'T:**
- Use very generic keywords only
- Include personal/sensitive data in template
- Use complex nested placeholders
- Forget the `{indication}` placeholder
- Skip the title or keywords lines

## Need Help?

- Check `TROUBLESHOOTING.md` for common issues
- View logs: `docker-compose logs -f backend`
- Test in UI at http://localhost:3000
- Verify database: Check templates table

## Summary

1. Create `.docx` file with title, keywords, skeleton
2. Use `{placeholders}` for dynamic data
3. Add `<fill instructions>` for AI guidance
4. Copy to `templates/` folder
5. Restart backend
6. Template appears in UI automatically!

**That's it!** No code changes needed - just add Word documents to the folder! 🎉
