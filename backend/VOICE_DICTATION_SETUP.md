# Voice Dictation with Whisper AI

## Overview

The Voice Dictation feature allows radiologists to dictate reports using their voice instead of typing. It uses OpenAI's Whisper AI, a state-of-the-art speech recognition model specifically designed to handle medical terminology and multilingual dictation.

## Features

### 1. **High-Accuracy Transcription**
- OpenAI Whisper AI models (tiny to large)
- Medical terminology recognition
- Context-aware transcription with specialty prompts
- Multilingual support (English, French, Arabic, Spanish, etc.)

### 2. **Two Modes**
- **Local Whisper**: Run Whisper models locally (free, private)
- **OpenAI API**: Use cloud Whisper API (paid, most accurate)

### 3. **Real-Time Recording**
- Visual audio level feedback
- Recording timer
- Stop and transcribe on demand
- Automatic insertion into report form

### 4. **Medical Context**
- Specialty-specific prompts (radiology, cardiology, etc.)
- Common medical terms pre-loaded
- Improves recognition accuracy for medical language

### 5. **Supported Audio Formats**
- WebM (browser recording default)
- MP3, MP4, WAV, M4A
- MPEG, MPGA

## Setup Instructions

### Option 1: Local Whisper (Recommended for Privacy)

#### 1. Install Whisper Dependencies

**In Dockerfile or running container:**
```dockerfile
# Add to backend/Dockerfile
RUN pip install openai-whisper
RUN apt-get update && apt-get install -y ffmpeg
```

**Or install in running container:**
```bash
docker exec -it radiology-backend-local pip install openai-whisper
docker exec -it radiology-backend-local apt-get update && apt-get install -y ffmpeg
```

#### 2. Configure Environment Variables

Add to `.env`:
```bash
# Voice Dictation
VOICE_DICTATION_ENABLED=true
WHISPER_MODEL=base  # tiny, base, small, medium, large
WHISPER_LANGUAGE=auto  # auto-detect or specify (en, fr, ar, etc.)
```

#### 3. Choose Whisper Model

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| tiny | 75MB | Fastest | Low | Quick drafts, testing |
| base | 142MB | Fast | Good | **Recommended for most users** |
| small | 466MB | Medium | Better | Higher accuracy needed |
| medium | 1.5GB | Slow | High | Professional use |
| large | 2.9GB | Slowest | Best | Maximum accuracy |

**Recommendation:** Start with `base` model for best speed/accuracy balance.

#### 4. Restart Backend

```bash
docker-compose restart backend
```

#### 5. Test Voice Dictation

1. Open the application
2. Go to Report Generator
3. Click the microphone button
4. Allow microphone access
5. Start speaking
6. Click "Stop & Transcribe"
7. Text should appear in the clinical indication field

---

### Option 2: OpenAI Whisper API (Cloud)

#### Advantages:
- Most accurate transcription
- No local compute requirements
- Always up-to-date model
- Handles background noise better

#### Disadvantages:
- Costs money ($0.006/minute)
- Requires internet connection
- Audio sent to OpenAI servers
- Privacy concerns for PHI

#### Setup:

1. **Get OpenAI API Key**
   - Sign up at https://platform.openai.com/
   - Go to API Keys section
   - Create new secret key
   - Copy the key

2. **Configure Environment**
   ```bash
   USE_OPENAI_WHISPER_API=true
   OPENAI_API_KEY=sk-...your-key-here
   VOICE_DICTATION_ENABLED=true
   ```

3. **Install OpenAI Library**
   ```bash
   docker exec -it radiology-backend-local pip install openai
   ```

4. **Restart Backend**
   ```bash
   docker-compose restart backend
   ```

---

## API Endpoints

### Transcribe Audio

```bash
POST /api/voice/transcribe

Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: multipart/form-data

Body (form-data):
  audio: [audio file]
  language: "en" | "fr" | "ar" | "auto"
  specialty: "radiology" | "cardiology" | "neurology" | "general"

Response:
{
  "success": true,
  "text": "Patient presents with acute onset chest pain...",
  "language": "en",
  "segments": [
    {
      "start": 0.0,
      "end": 3.5,
      "text": "Patient presents with acute onset chest pain"
    }
  ],
  "duration": 15.2,
  "method": "local_whisper",
  "model": "base"
}
```

### Get Service Status

```bash
GET /api/voice/status

Response:
{
  "enabled": true,
  "method": "local_whisper",
  "model": "base",
  "language": "auto",
  "supported_formats": [".mp3", ".mp4", ".wav", ".webm", ".m4a"],
  "model_loaded": true
}
```

### Get Medical Prompts

```bash
GET /api/voice/prompts

Response:
{
  "specialties": ["radiology", "cardiology", "neurology", "orthopedics", "general"],
  "prompts": {
    "radiology": "This is a radiology report dictation. Common terms include CT, MRI, X-ray...",
    "cardiology": "This is a cardiology report dictation. Common terms include ECG, echo..."
  }
}
```

---

## Usage Examples

### Frontend (TypeScript/React)

```typescript
import VoiceDictation from './components/VoiceDictation'

function ReportForm() {
  const [indication, setIndication] = useState('')

  return (
    <div>
      <textarea
        value={indication}
        onChange={(e) => setIndication(e.target.value)}
        placeholder="Clinical indication..."
      />

      <VoiceDictation
        onTranscription={(text) => {
          // Append transcribed text
          setIndication(prev => prev + '\n\n' + text)
        }}
        language="en"
        specialty="radiology"
      />
    </div>
  )
}
```

### Backend (Python)

```python
from transcription_service import transcription_service

# Transcribe audio file
with open('recording.webm', 'rb') as audio_file:
    result = transcription_service.transcribe_audio(
        audio_file=audio_file,
        filename='recording.webm',
        language='en',
        prompt=transcription_service.get_medical_prompt('radiology')
    )

if result['success']:
    print(f"Transcription: {result['text']}")
    print(f"Language: {result['language']}")
    print(f"Duration: {result['duration']} seconds")
else:
    print(f"Error: {result['error']}")
```

---

## Medical Specialty Prompts

The system uses context prompts to improve accuracy for medical terminology:

### Radiology
```
This is a radiology report dictation. Common terms include CT, MRI, X-ray,
ultrasound, angiography, contrast, enhancement, lesion, mass, nodule, opacity,
effusion, fracture, dislocation, stenosis, occlusion, hemorrhage, infarction,
ventricle, atrium, aorta, pulmonary, hepatic, renal, cerebral.
```

### Cardiology
```
This is a cardiology report dictation. Common terms include ECG, echocardiogram,
ejection fraction, coronary artery, myocardial infarction, arrhythmia, atrial
fibrillation, ventricular tachycardia, coronary stenosis, troponin, BNP.
```

### Neurology
```
This is a neurology report dictation. Common terms include MRI brain, CT head,
stroke, ischemia, hemorrhage, cerebral infarction, white matter, gray matter,
ventricles, cerebellum, brainstem, cranial nerves, encephalopathy.
```

---

## Troubleshooting

### Voice Dictation Not Available

**Symptoms:** Microphone button disabled or grayed out

**Solutions:**

1. **Check Browser Support**
   ```javascript
   // In browser console
   console.log(navigator.mediaDevices)
   // Should not be undefined
   ```

2. **Enable HTTPS**
   - Microphone access requires HTTPS (or localhost)
   - Use `https://` in production

3. **Check Configuration**
   ```bash
   curl http://localhost:8000/api/voice/status
   ```
   Should return `"enabled": true`

### Microphone Permission Denied

**Solution:**
- Click the lock icon in browser address bar
- Set microphone permission to "Allow"
- Refresh the page

### Transcription Fails

**Check Backend Logs:**
```bash
docker logs radiology-backend-local | grep -i "transcription"
```

**Common Issues:**

1. **Whisper not installed**
   ```bash
   docker exec -it radiology-backend-local pip install openai-whisper
   ```

2. **FFmpeg missing**
   ```bash
   docker exec -it radiology-backend-local apt-get install -y ffmpeg
   ```

3. **Model not downloaded**
   - First use downloads the model
   - May take 1-5 minutes depending on model size
   - Check logs for download progress

### Poor Transcription Accuracy

**Improvements:**

1. **Use better model**
   - Change from `tiny` to `base` or `small`
   - Restart backend after changing

2. **Speak clearly**
   - Enunciate medical terms
   - Pause between sentences
   - Reduce background noise

3. **Use medical prompts**
   - Select correct specialty
   - Adds context for medical terms

4. **Consider OpenAI API**
   - Most accurate option
   - Better with accents and noise

### Slow Transcription

**Causes:**
- Large Whisper model (medium/large)
- Slow CPU
- Long recording

**Solutions:**
- Use smaller model (base or small)
- Upgrade server CPU
- Keep recordings under 2 minutes
- Use OpenAI API (faster)

---

## Best Practices

### 1. **Dictation Technique**
- Speak at normal pace (not too fast)
- Pronounce medical terms clearly
- Pause briefly between sentences
- State punctuation: "period", "comma", "new paragraph"

### 2. **Recording Length**
- Keep recordings under 2-3 minutes
- Break long reports into segments
- Transcribe and review incrementally

### 3. **Review Transcriptions**
- Always review for accuracy
- Check medical terminology spelling
- Verify numbers and measurements
- Edit as needed

### 4. **Privacy Considerations**
- **Local Whisper**: Audio stays on your server (HIPAA compliant)
- **OpenAI API**: Audio sent to OpenAI (review their BAA)
- Don't record patient names if using API
- Consider local model for sensitive data

### 5. **Model Selection**
- **Quick drafts**: tiny or base
- **Final reports**: small or medium
- **Research/publications**: large
- **Cost-sensitive**: local model
- **Accuracy-critical**: OpenAI API

---

## Performance Benchmarks

### Local Whisper Models (on 8-core CPU):

| Model | Download Size | RAM Usage | Speed | WER* |
|-------|--------------|-----------|-------|------|
| tiny | 75 MB | 1 GB | 32x realtime | 9.0% |
| base | 142 MB | 1 GB | 16x realtime | 5.5% |
| small | 466 MB | 2 GB | 6x realtime | 4.0% |
| medium | 1.5 GB | 5 GB | 2x realtime | 3.0% |
| large | 2.9 GB | 10 GB | 1x realtime | 2.5% |

*WER = Word Error Rate (lower is better)

### OpenAI Whisper API:

| Metric | Value |
|--------|-------|
| Cost | $0.006/minute |
| Speed | ~1-2 seconds per minute of audio |
| Accuracy | ~2.0% WER (best) |
| Max File Size | 25 MB |

---

## Advanced Configuration

### Custom Medical Prompts

Add custom medical terms to improve accuracy:

```python
# In transcription_service.py
CUSTOM_PROMPT = """
This is a radiology report for musculoskeletal imaging.
Common terms: tendon, ligament, cartilage, meniscus, ACL, PCL,
rotator cuff, supraspinatus, infraspinatus, subscapularis,
labrum, glenoid, acetabulum, femoral head.
"""

result = transcription_service.transcribe_audio(
    audio_file=audio,
    filename='recording.webm',
    prompt=CUSTOM_PROMPT
)
```

### Multiple Language Support

```python
# Detect language automatically
result = transcription_service.transcribe_audio(
    audio_file=audio,
    filename='recording.webm',
    language='auto'  # Auto-detect
)

# Or specify language
result = transcription_service.transcribe_audio(
    audio_file=audio,
    filename='recording.webm',
    language='fr'  # French
)
```

### Batch Processing

```python
import glob

for audio_file in glob.glob('recordings/*.webm'):
    with open(audio_file, 'rb') as f:
        result = transcription_service.transcribe_audio(
            audio_file=f,
            filename=audio_file,
            language='auto'
        )

        if result['success']:
            # Save transcription
            with open(audio_file + '.txt', 'w') as out:
                out.write(result['text'])
```

---

## Security & Privacy

### HIPAA Compliance

**Local Whisper:**
- ✅ Audio processed on your server
- ✅ No data sent to third parties
- ✅ HIPAA compliant
- ✅ Full control over data

**OpenAI API:**
- ⚠️ Audio sent to OpenAI servers
- ⚠️ Requires Business Associate Agreement (BAA)
- ⚠️ Review OpenAI's data retention policy
- ❌ Not recommended for PHI without BAA

### Data Protection

1. **Encryption in transit:** All audio uploads use HTTPS
2. **Temporary storage:** Audio files deleted after transcription
3. **No logging:** Transcribed text not logged by default
4. **Access control:** Requires authentication

---

## Roadmap

### Planned Features:

1. **Real-time streaming transcription**
   - Transcribe as you speak
   - Show text in real-time
   - Edit while speaking

2. **Voice commands**
   - "New paragraph"
   - "Insert measurement"
   - "Undo last sentence"

3. **Speaker diarization**
   - Multiple speakers
   - Distinguish radiologist vs. referring physician

4. **Custom vocabulary**
   - User-defined medical terms
   - Institution-specific terminology
   - Acronyms and abbreviations

5. **Quality metrics**
   - Confidence scores per word
   - Flag uncertain transcriptions
   - Suggest corrections

---

**Status**: ✅ Fully Functional
**Version**: 1.0.0
**Last Updated**: 2025-01-04
