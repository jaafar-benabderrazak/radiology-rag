#!/bin/bash

# ==============================================
# Google Cloud Run - FREE Deployment Script
# ==============================================

set -e

echo "🚀 Radiology RAG - Google Cloud Deployment"
echo "=========================================="
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed!"
    echo "📝 Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ gcloud CLI detected"
echo ""

# Get or create project
echo "📋 Google Cloud Project Setup"
echo "------------------------------"
read -p "Enter your GCP Project ID (or press Enter to create new): " PROJECT_ID

if [ -z "$PROJECT_ID" ]; then
    # Generate project ID
    RANDOM_ID=$(date +%s | tail -c 6)
    PROJECT_ID="radiology-rag-$RANDOM_ID"
    echo "Creating new project: $PROJECT_ID"
    
    gcloud projects create $PROJECT_ID --name="Radiology RAG Demo"
    echo "✅ Project created"
fi

# Set project
gcloud config set project $PROJECT_ID
echo "✅ Using project: $PROJECT_ID"
echo ""

# Set region
REGION="us-central1"
gcloud config set run/region $REGION
echo "✅ Region set to: $REGION"
echo ""

# Enable APIs
echo "🔧 Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  sqladmin.googleapis.com \
  aiplatform.googleapis.com \
  secretmanager.googleapis.com \
  --quiet

echo "✅ APIs enabled"
echo ""

# Get API keys
echo "🔑 API Keys Setup"
echo "-----------------"
read -p "Enter your Gemini API Key: " GEMINI_KEY
read -p "Enter a secret key (min 32 chars, or press Enter to generate): " SECRET_KEY

if [ -z "$SECRET_KEY" ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    echo "Generated secret key: $SECRET_KEY"
fi

# Store secrets
echo "Storing secrets..."
echo -n "$GEMINI_KEY" | gcloud secrets create gemini-api-key --data-file=- --replication-policy="automatic" 2>/dev/null || \
  echo -n "$GEMINI_KEY" | gcloud secrets versions add gemini-api-key --data-file=-

echo -n "$SECRET_KEY" | gcloud secrets create app-secret-key --data-file=- --replication-policy="automatic" 2>/dev/null || \
  echo -n "$SECRET_KEY" | gcloud secrets versions add app-secret-key --data-file=-

echo "✅ Secrets stored"
echo ""

# Grant permissions
echo "Setting permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" --quiet

gcloud secrets add-iam-policy-binding app-secret-key \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor" --quiet

echo "✅ Permissions configured"
echo ""

# Deploy Backend
echo "🏗️  Deploying Backend..."
echo "------------------------"
cd backend

gcloud run deploy radiology-backend \
  --source . \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=10 \
  --min-instances=0 \
  --timeout=300 \
  --set-env-vars="ENVIRONMENT=production,USE_VERTEX_AI=true,GCP_PROJECT_ID=$PROJECT_ID,GCP_REGION=$REGION" \
  --set-secrets="GEMINI_API_KEY=gemini-api-key:latest,SECRET_KEY=app-secret-key:latest" \
  --quiet

BACKEND_URL=$(gcloud run services describe radiology-backend --region=$REGION --format='value(status.url)')
echo "✅ Backend deployed: $BACKEND_URL"
echo ""

# Deploy Frontend
echo "🎨 Deploying Frontend..."
echo "------------------------"
cd ../frontend

gcloud run deploy radiology-frontend \
  --source . \
  --region=$REGION \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=5 \
  --min-instances=0 \
  --set-env-vars="VITE_API_URL=$BACKEND_URL" \
  --quiet

FRONTEND_URL=$(gcloud run services describe radiology-frontend --region=$REGION --format='value(status.url)')
echo "✅ Frontend deployed: $FRONTEND_URL"
echo ""

# Update backend CORS
echo "🔧 Configuring CORS..."
gcloud run services update radiology-backend \
  --region=$REGION \
  --update-env-vars="ALLOWED_ORIGINS=$FRONTEND_URL" \
  --quiet

echo "✅ CORS configured"
echo ""

# Summary
echo "================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "🌐 Your application is now live:"
echo ""
echo "   Frontend:  $FRONTEND_URL"
echo "   Backend:   $BACKEND_URL"
echo "   API Docs:  $BACKEND_URL/docs"
echo ""
echo "👤 Default credentials:"
echo "   Admin:     admin@radiology.com / admin123"
echo "   Doctor:    doctor@hospital.com / doctor123"
echo ""
echo "⚠️  IMPORTANT: Change default passwords immediately!"
echo ""
echo "💰 Cost: FREE for 90 days with $300 credit"
echo "   After credits: ~$15-25/month for light usage"
echo ""
echo "📊 Monitor usage:"
echo "   https://console.cloud.google.com/run?project=$PROJECT_ID"
echo ""
echo "📖 View logs:"
echo "   gcloud run services logs read radiology-backend --region=$REGION"
echo ""
echo "================================================"
