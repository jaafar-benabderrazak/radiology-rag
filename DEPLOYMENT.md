# Radiology RAG - Deployment Guide

Complete guide to deploy the Radiology RAG application to production.

## Table of Contents

1. [Quick Deploy Options](#quick-deploy-options)
2. [Railway Deployment (Recommended)](#railway-deployment-recommended)
3. [Render Deployment](#render-deployment)
4. [DigitalOcean Deployment](#digitalocean-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Manual VPS Deployment](#manual-vps-deployment)
7. [Environment Variables](#environment-variables)
8. [SSL/HTTPS Setup](#sslhttps-setup)

---

## Quick Deploy Options

### Comparison

| Platform | Cost | Ease | Docker Support | Free Tier | Best For |
|----------|------|------|----------------|-----------|----------|
| **Railway** | $5+/mo | ⭐⭐⭐⭐⭐ | ✅ Yes | $5 credit | Quick deploy |
| **Render** | $7+/mo | ⭐⭐⭐⭐ | ✅ Yes | Limited | Startups |
| **DigitalOcean** | $12+/mo | ⭐⭐⭐ | ✅ Yes | $200 credit | Production |
| **Fly.io** | $5+/mo | ⭐⭐⭐⭐ | ✅ Yes | Limited | Docker apps |
| **AWS** | $20+/mo | ⭐⭐ | ✅ Yes | 12mo free | Enterprise |

---

## Railway Deployment (Recommended)

**Fastest and easiest deployment option**

### Prerequisites
- GitHub account
- Railway account (https://railway.app/)
- Your code pushed to GitHub

### Step 1: Prepare Your Repository

```bash
# Make sure latest code is pushed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Railway

1. **Go to Railway**: https://railway.app/
2. **Click "Start a New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository**: `radiology-rag`
5. **Railway will auto-detect** the docker-compose.yml

### Step 3: Configure Services

Railway will create services for each container. Configure them:

#### Backend Service
```bash
# Environment variables
DATABASE_URL=${POSTGRES_URL}
REDIS_URL=${REDIS_URL}
QDRANT_URL=http://qdrant.railway.internal:6333
GEMINI_API_KEY=your_gemini_api_key
SECRET_KEY=your_super_secret_key_here_change_me
ALLOWED_ORIGINS=https://your-app.railway.app
ENVIRONMENT=production
```

#### Frontend Service
```bash
VITE_API_URL=https://your-backend.railway.app
```

### Step 4: Add Databases

1. **Click "New" → "Database"**
2. **Add PostgreSQL**
3. **Add Redis**
4. **Connect to Backend** (Railway auto-connects)

### Step 5: Deploy

1. **Click "Deploy"**
2. **Wait 5-10 minutes** for build
3. **Access your app** at the generated URL

### Step 6: Custom Domain (Optional)

1. **Go to Settings** → **Networking**
2. **Click "Generate Domain"** or **Add Custom Domain**
3. **Update** `ALLOWED_ORIGINS` with new domain

---

## Render Deployment

### Step 1: Create Blueprint File

Create `render.yaml` in your project root:

```yaml
services:
  # PostgreSQL Database
  - type: pserv
    name: radiology-db
    env: docker
    plan: starter
    region: oregon
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend

  # Redis
  - type: redis
    name: radiology-cache
    plan: starter
    region: oregon

  # Backend
  - type: web
    name: radiology-backend
    env: docker
    plan: starter
    region: oregon
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    healthCheckPath: /health
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: radiology-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: radiology-cache
          type: redis
          property: connectionString
      - key: GEMINI_API_KEY
        sync: false
      - key: SECRET_KEY
        generateValue: true
      - key: ENVIRONMENT
        value: production

  # Frontend
  - type: web
    name: radiology-frontend
    env: docker
    plan: starter
    region: oregon
    dockerfilePath: ./frontend/Dockerfile
    dockerContext: ./frontend
    envVars:
      - key: VITE_API_URL
        fromService:
          name: radiology-backend
          type: web
          property: url

databases:
  - name: radiology-db
    plan: starter
    region: oregon

  - name: radiology-cache
    plan: starter
    region: oregon
```

### Step 2: Deploy

1. **Go to Render**: https://render.com/
2. **New** → **Blueprint**
3. **Connect repository**
4. **Render auto-deploys** from render.yaml
5. **Set environment variables**

---

## DigitalOcean Deployment

### Option 1: App Platform (Easy)

```bash
# Install doctl CLI
# Windows (PowerShell)
choco install doctl

# Login
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml
```

Create `.do/app.yaml`:

```yaml
name: radiology-rag
region: nyc
services:
  - name: backend
    github:
      repo: your-username/radiology-rag
      branch: main
      deploy_on_push: true
    source_dir: /backend
    dockerfile_path: backend/Dockerfile
    envs:
      - key: DATABASE_URL
        scope: RUN_AND_BUILD_TIME
        value: ${postgres.DATABASE_URL}
      - key: GEMINI_API_KEY
        scope: RUN_TIME
        type: SECRET
        value: your_key
    health_check:
      http_path: /health
    routes:
      - path: /api
    
  - name: frontend
    github:
      repo: your-username/radiology-rag
      branch: main
    source_dir: /frontend
    dockerfile_path: frontend/Dockerfile
    envs:
      - key: VITE_API_URL
        value: ${backend.PUBLIC_URL}
    routes:
      - path: /

databases:
  - name: postgres
    engine: PG
    version: "15"
    
  - name: redis
    engine: REDIS
    version: "7"
```

### Option 2: Droplet (Manual)

```bash
# 1. Create Droplet (Ubuntu 22.04)
# Size: 4GB RAM minimum ($24/mo)

# 2. SSH into droplet
ssh root@your_droplet_ip

# 3. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 4. Install Docker Compose
apt install docker-compose-plugin

# 5. Clone repository
git clone https://github.com/your-username/radiology-rag.git
cd radiology-rag

# 6. Create .env file
nano .env
# Add your environment variables

# 7. Deploy
docker compose -f docker-compose.prod.yml up -d

# 8. Setup nginx (already configured)
# Your app is now running on port 80
```

---

## AWS Deployment

### Using AWS ECS (Elastic Container Service)

1. **Install AWS CLI**:
```bash
# Windows
choco install awscli

# Configure
aws configure
```

2. **Create ECR Repositories**:
```bash
aws ecr create-repository --repository-name radiology-backend
aws ecr create-repository --repository-name radiology-frontend
```

3. **Build and Push Images**:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t radiology-backend .
docker tag radiology-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/radiology-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/radiology-backend:latest

# Build and push frontend
cd ../frontend
docker build -t radiology-frontend .
docker tag radiology-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/radiology-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/radiology-frontend:latest
```

4. **Create ECS Cluster**:
```bash
aws ecs create-cluster --cluster-name radiology-cluster
```

5. **Create RDS Database**:
```bash
aws rds create-db-instance \
  --db-instance-identifier radiology-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123 \
  --allocated-storage 20
```

6. **Deploy with CloudFormation** (use provided template)

---

## Manual VPS Deployment

### Any VPS (Linode, Vultr, Hetzner, etc.)

1. **Get a VPS**:
   - 4GB RAM minimum
   - 2 vCPUs
   - 80GB SSD
   - Ubuntu 22.04 LTS

2. **SSH into server**:
```bash
ssh root@your_server_ip
```

3. **Update system**:
```bash
apt update && apt upgrade -y
```

4. **Install Docker**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

5. **Install Docker Compose**:
```bash
apt install docker-compose-plugin -y
```

6. **Clone repository**:
```bash
cd /opt
git clone https://github.com/your-username/radiology-rag.git
cd radiology-rag
```

7. **Create environment file**:
```bash
nano .env
```

Paste:
```bash
# Database
POSTGRES_USER=radiology_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=radiology_templates

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Security
SECRET_KEY=your_super_secret_key_min_32_characters_long

# URLs
ALLOWED_ORIGINS=http://your-domain.com,https://your-domain.com
VITE_API_URL=http://your-domain.com

# Environment
ENVIRONMENT=production
```

8. **Deploy**:
```bash
docker compose -f docker-compose.prod.yml up -d
```

9. **Check status**:
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

10. **Setup firewall**:
```bash
ufw allow 22   # SSH
ufw allow 80   # HTTP
ufw allow 443  # HTTPS
ufw enable
```

---

## Environment Variables

### Required

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
POSTGRES_USER=radiology_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=radiology_templates

# Redis
REDIS_URL=redis://redis:6379

# Vector Database
QDRANT_URL=http://qdrant:6333

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here

# Security
SECRET_KEY=your_super_secret_key_here_min_32_chars
ACCESS_TOKEN_EXPIRE_MINUTES=30
ALGORITHM=HS256

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Environment
ENVIRONMENT=production
```

### Optional

```bash
# SMTP (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Backup
BACKUP_ENABLED=true
BACKUP_DIR=/app/backups
BACKUP_RETENTION_DAYS=30

# Voice Dictation
VOICE_DICTATION_ENABLED=true
WHISPER_MODEL=base

# DICOM
DICOM_ENABLED=true
DICOM_UPLOAD_DIR=/app/dicom_storage
DICOM_MAX_FILE_SIZE=104857600
```

---

## SSL/HTTPS Setup

### Option 1: Certbot (Let's Encrypt) - FREE

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot auto-configures nginx
# Certificate auto-renews
```

### Option 2: Cloudflare (Easy + Free)

1. **Add your domain to Cloudflare**
2. **Update nameservers** at your registrar
3. **Enable "Full" SSL** in Cloudflare SSL settings
4. **Done!** Cloudflare handles SSL

### Option 3: Manual SSL

1. **Get certificates** from your provider
2. **Copy to server**:
```bash
mkdir -p nginx/ssl
# Upload cert.pem and key.pem
```

3. **Update nginx.conf**:
Uncomment HTTPS server block in `nginx/nginx.conf`

4. **Restart nginx**:
```bash
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Post-Deployment Checklist

- [ ] Update `ALLOWED_ORIGINS` with your domain
- [ ] Change default admin password (admin@radiology.com / admin123)
- [ ] Setup SSL/HTTPS
- [ ] Configure backups
- [ ] Setup monitoring (optional)
- [ ] Add custom domain
- [ ] Test all features
- [ ] Load template .docx files
- [ ] Configure SMTP for email notifications
- [ ] Setup firewall rules
- [ ] Enable auto-scaling (if needed)

---

## Monitoring & Maintenance

### Health Checks

```bash
# Backend health
curl http://your-domain.com/health

# Database
docker exec radiology-db-prod pg_isready

# Logs
docker compose -f docker-compose.prod.yml logs -f backend
```

### Backup Database

```bash
# Manual backup
docker exec radiology-db-prod pg_dump -U radiology_user radiology_templates > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20250106.sql | docker exec -i radiology-db-prod psql -U radiology_user -d radiology_templates
```

---

## Troubleshooting

### Container won't start
```bash
docker compose -f docker-compose.prod.yml logs <service-name>
```

### Database connection issues
```bash
# Check if postgres is running
docker compose -f docker-compose.prod.yml ps postgres

# Check connection
docker exec radiology-db-prod psql -U radiology_user -d radiology_templates -c "SELECT 1"
```

### Out of memory
```bash
# Check memory usage
docker stats

# Increase VPS size or add swap:
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

## Cost Estimates

### Railway (Recommended for Demo)
- **Hobby Plan**: $5/month
- **Includes**: 512MB RAM, Postgres, Redis
- **Best for**: Demos, MVPs

### Render
- **Starter Plan**: $7/month per service
- **Total**: ~$21/month (Backend + Frontend + DB)
- **Best for**: Small production apps

### DigitalOcean
- **Droplet 4GB**: $24/month
- **Managed Postgres**: $15/month
- **Total**: ~$39/month
- **Best for**: Production with control

### AWS
- **t3.medium**: ~$30/month
- **RDS t3.micro**: ~$15/month
- **Total**: ~$45-60/month
- **Best for**: Enterprise, scaling

---

## Support

- **Documentation**: See README.md
- **Issues**: GitHub Issues
- **Email**: support@yourdomain.com

---

**Ready to deploy?** Choose your platform and follow the guide above!
