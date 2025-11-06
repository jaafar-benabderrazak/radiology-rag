# 🆓 FREE Deployment Guide - Radiology RAG

Deploy your demo completely FREE using Google Cloud, Render, or other free-tier platforms.

---

## 🏆 Best Option: Google Cloud Run (with Gemini API)

**Why this is the BEST free option:**
- ✅ **$300 FREE credit** for 90 days (no credit card required initially)
- ✅ **Uses your current Gemini API** (no changes needed!)
- ✅ **Optional Vertex AI upgrade** for production (better rate limits)
- ✅ **2 million requests/month** free forever
- ✅ Professional infrastructure
- ✅ Auto-scaling

**Note**: Your app already uses Gemini API and works great! Vertex AI is just an optional upgrade for production deployments when you need higher rate limits (60 req/min vs 15 req/min).

### Step-by-Step Deployment

#### 1. Setup Google Cloud Account

```bash
# Go to: https://cloud.google.com/free
# Click "Get started for free"
# You get: $300 credit for 90 days
```

#### 2. Install Google Cloud SDK

**Windows (PowerShell):**
```powershell
# Download and install from:
# https://cloud.google.com/sdk/docs/install

# Or use installer:
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**Mac/Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### 3. Initialize and Login

```bash
# Login to Google Cloud
gcloud auth login

# Create new project
gcloud projects create radiology-rag-demo --name="Radiology RAG Demo"

# Set as default project
gcloud config set project radiology-rag-demo

# Enable required APIs (aiplatform is optional, only for Vertex AI)
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

#### 4. Setup Project

```bash
# Get your PROJECT_ID
export PROJECT_ID=$(gcloud config get-value project)
echo "Your Project ID: $PROJECT_ID"

# Set region
export REGION=us-central1
gcloud config set run/region $REGION
```

**Note**: We're NOT enabling Vertex AI here. Your app will use the regular Gemini API (free tier) which is perfect for demos!

#### 5. Create Databases

```bash
# Create Cloud SQL (PostgreSQL) - FREE tier
gcloud sql instances create radiology-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password=YOUR_PASSWORD_HERE

# Create database
gcloud sql databases create radiology_templates \
  --instance=radiology-db

# Create user
gcloud sql users create radiology_user \
  --instance=radiology-db \
  --password=YOUR_PASSWORD_HERE

# Create Redis (Memorystore) - Or use Redis Cloud free tier
# Note: Memorystore requires billing, use Redis Cloud free instead
# https://redis.com/try-free/ (30MB free forever)
```

#### 6. Store Secrets

```bash
# Store your secrets
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
echo -n "YOUR_SECRET_KEY_32_CHARS" | gcloud secrets create app-secret-key --data-file=-

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 7. Deploy Backend

```bash
cd backend

# Deploy to Cloud Run (using Gemini API)
gcloud run deploy radiology-backend \
  --source . \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --set-env-vars="ENVIRONMENT=production" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,SECRET_KEY=app-secret-key:latest"

# Get backend URL
export BACKEND_URL=$(gcloud run services describe radiology-backend --region=$REGION --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

#### 8. Deploy Frontend

```bash
cd ../frontend

# Deploy to Cloud Run
gcloud run deploy radiology-frontend \
  --source . \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=5 \
  --set-env-vars="VITE_API_URL=$BACKEND_URL"

# Get frontend URL
export FRONTEND_URL=$(gcloud run services describe radiology-frontend --region=$REGION --format='value(status.url)')
echo "Frontend URL: $FRONTEND_URL"
```

#### 9. Update CORS

```bash
# Update backend with frontend URL
gcloud run services update radiology-backend \
  --region=$REGION \
  --update-env-vars="ALLOWED_ORIGINS=$FRONTEND_URL"
```

#### 10. Access Your App! 🎉

```bash
echo "✅ Deployment complete!"
echo ""
echo "🌐 Frontend: $FRONTEND_URL"
echo "🔧 Backend:  $BACKEND_URL"
echo "📖 API Docs: $BACKEND_URL/docs"
echo ""
echo "👤 Default credentials:"
echo "   Admin:  admin@radiology.com / admin123"
echo "   Doctor: doctor@hospital.com / doctor123"
```

---

## 💰 Cost Breakdown (Google Cloud)

### Within Free Credits ($300 for 90 days)

| Service | Monthly Cost | Free Tier |
|---------|--------------|-----------|
| Cloud Run (Backend) | ~$15 | 2M requests free |
| Cloud Run (Frontend) | ~$8 | 2M requests free |
| Cloud SQL (db-f1-micro) | ~$10 | $300 credit |
| Gemini API | **FREE** | 15 req/min free tier |
| **Total** | **~$33/mo** | **FREE for 90 days!** |

### After Credits (Forever Free Tier)

- **Cloud Run**: 2 million requests/month FREE
- **Gemini API**: FREE (15 requests/min, 1500 requests/day)
- **Cloud SQL**: ~$10/month (smallest instance)

**Estimated cost after credits**: $10-15/month for light usage

**Optional Upgrade**: Switch to Vertex AI later if you need higher limits (60 req/min vs 15 req/min)

---

## 🆓 Alternative Free Options

### Option 2: Render Free Tier

**What's free:**
- ✅ 750 hours/month (enough for 1 service)
- ✅ PostgreSQL 90-day trial
- ✅ Auto-deploys from GitHub

**Limitations:**
- ⚠️ Services sleep after 15 mins inactivity
- ⚠️ 512MB RAM limit
- ⚠️ Limited to 1 web service

**How to deploy:**
```bash
# Just push your code with render.yaml
# Render auto-deploys from GitHub
# Follow: https://render.com/docs/deploy-from-git
```

---

### Option 3: Fly.io Free Tier

**What's free:**
- ✅ Up to 3 shared-cpu-1x VMs
- ✅ 3GB persistent volume storage
- ✅ 160GB outbound transfer

**Limitations:**
- ⚠️ Need credit card (not charged)
- ⚠️ Limited RAM (256MB)

**How to deploy:**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
flyctl launch
flyctl deploy
```

---

### Option 4: Railway ($5 Credit)

**What you get:**
- ✅ $5 free credit (no credit card)
- ✅ Runs for ~500 hours
- ✅ Easy GitHub integration

**Limitations:**
- ⚠️ Only $5 credit (runs ~2 weeks)
- ⚠️ Then $5/month after

**How to deploy:**
```bash
# 1. Go to: https://railway.app/new
# 2. Connect GitHub repo
# 3. Railway auto-detects config
# 4. Add environment variables
# 5. Deploy!
```

---

### Option 5: Replit (Quick Demo)

**What's free:**
- ✅ Completely free for public projects
- ✅ Online IDE
- ✅ Instant deployment

**Limitations:**
- ⚠️ Code is public
- ⚠️ Limited resources
- ⚠️ Project sleeps when inactive

**How to deploy:**
```bash
# 1. Go to: https://replit.com/
# 2. Import from GitHub
# 3. Run deployment script
# 4. Share the URL
```

---

## 🎯 Recommendation

**For serious demo (90 days free):**
→ **Google Cloud Run + Vertex AI** (Best option!)

**For quick test (few hours):**
→ **Replit** (Instant, no setup)

**For long-term free:**
→ **Render Free Tier** (Limited but works)

---

## 🔧 Gemini API vs Vertex AI (Optional)

### Default: Gemini API (FREE - Recommended for Demos)

**What you have now:**
```python
import google.generativeai as genai
genai.configure(api_key="YOUR_API_KEY")
model = genai.GenerativeModel('gemini-pro')
```

**Free tier limits (perfect for demos!):**
- ✅ 15 requests/minute
- ✅ 1,500 requests/day
- ✅ 32K token context
- ✅ **Completely FREE forever**
- ✅ No GCP project needed
- ✅ Works everywhere (local + deployed)

**This is what your app uses by default!**

### Optional: Vertex AI (for Heavy Production Use)

**Only switch if you need:**
- Higher quotas (60 requests/minute vs 15)
- Enterprise SLA
- Advanced monitoring

```python
from google.cloud import aiplatform
from vertexai.preview.generative_models import GenerativeModel

aiplatform.init(project="your-project-id", location="us-central1")
model = GenerativeModel("gemini-pro")
```

**When to use:**
- 🚀 Production with >1,500 reports/day
- 🏢 Enterprise requirements
- 📊 Need advanced monitoring

**For most demos and light production: Stick with Gemini API (free tier)!**

---

## 📊 Cost After Free Credits

### Google Cloud (Recommended)

**Monthly cost for 1000 reports/month:**
- Cloud Run: $2-5
- Cloud SQL: $10
- Vertex AI: $3-8
- **Total: $15-23/month**

### Render

**Monthly cost:**
- Starter Plan: $7/service × 3 = $21/month
- Database: $7/month
- **Total: $28/month**

---

## 🚀 Quick Start (Fastest Way)

### 5-Minute Google Cloud Deploy:

```bash
# 1. One-time setup
gcloud auth login
gcloud projects create radiology-demo
gcloud config set project radiology-demo

# 2. Deploy backend
cd backend
gcloud run deploy radiology-backend --source . --region=us-central1 --allow-unauthenticated

# 3. Deploy frontend
cd ../frontend
gcloud run deploy radiology-frontend --source . --region=us-central1 --allow-unauthenticated

# 4. Done! Get URLs
gcloud run services list
```

---

## 📝 Checklist

Before deploying:
- [ ] Google Cloud account created ($300 credit)
- [ ] gcloud CLI installed
- [ ] Gemini API key obtained
- [ ] Environment variables configured
- [ ] Services enabled (Cloud Run, Vertex AI, Cloud SQL)

After deploying:
- [ ] Frontend accessible
- [ ] Backend health check passes
- [ ] Can login with default credentials
- [ ] Can generate reports
- [ ] Change default passwords

---

## 🆘 Troubleshooting

### "Quota exceeded"

Use Vertex AI instead of Gemini API:
```bash
gcloud run services update radiology-backend \
  --update-env-vars="USE_VERTEX_AI=true,GCP_PROJECT_ID=$PROJECT_ID"
```

### "Service unavailable"

Check logs:
```bash
gcloud run services logs read radiology-backend --region=us-central1
```

### "Database connection failed"

Get connection string:
```bash
gcloud sql instances describe radiology-db
```

---

## 🎓 Learn More

- **Google Cloud Free Tier**: https://cloud.google.com/free
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **Vertex AI Pricing**: https://cloud.google.com/vertex-ai/pricing
- **Gemini API**: https://ai.google.dev/pricing

---

**Ready to deploy for FREE?** Start with Google Cloud Run - you'll have $300 credit and 90 days to try everything! 🚀
