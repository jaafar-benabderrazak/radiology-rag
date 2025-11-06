# Radiology RAG - Quick Deployment Guide

## 🚀 Deploy in 5 Minutes

This is the express guide. For detailed instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Prerequisites

- Ubuntu 22.04 server with Docker installed
- Domain name pointing to your server IP
- Gemini API key

### Step 1: Server Setup (2 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Step 2: Clone & Configure (1 minute)

```bash
# Clone repository
git clone https://github.com/yourusername/radiology-rag.git
cd radiology-rag
git checkout claude/setup-radiology-docker-services-011CUbfwqGA7BmujzTVkH5rG

# Create production config
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Required changes in `.env.production`:**
```bash
DOMAIN=yourdomain.com                    # Your domain
POSTGRES_PASSWORD=change_this_password   # Strong password
REDIS_PASSWORD=change_this_password      # Strong password
GEMINI_API_KEY=your_api_key_here        # From Google AI Studio
```

### Step 3: Update Nginx Config (30 seconds)

```bash
# Replace yourdomain.com with your actual domain
sed -i 's/yourdomain.com/YOURDOMAIN.com/g' nginx/conf.d/radiology.conf
```

### Step 4: Deploy (1 minute)

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy application
./scripts/deploy.sh
```

### Step 5: Setup SSL (30 seconds)

```bash
# Setup HTTPS with Let's Encrypt
export SSL_EMAIL=your-email@example.com
./scripts/setup-ssl.sh
```

## ✅ Done!

Access your application:
- **Frontend:** https://yourdomain.com
- **API Docs:** https://yourdomain.com/docs
- **Health Check:** https://yourdomain.com/health

**Default Credentials:**
- Admin: `admin@radiology.com` / `admin123`
- Doctor: `doctor@hospital.com` / `doctor123`

**⚠️ CRITICAL: Change passwords immediately!**

## 📊 Verify Deployment

```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Test API
curl https://yourdomain.com/health
```

## 🛠️ Common Commands

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f [service]

# Restart service
docker-compose -f docker-compose.prod.yml restart [service]

# Stop all
docker-compose -f docker-compose.prod.yml down

# Start all
docker-compose -f docker-compose.prod.yml up -d

# Backup database
./scripts/backup.sh
```

## 🚨 Troubleshooting

**Service won't start:**
```bash
docker-compose -f docker-compose.prod.yml logs [service]
```

**SSL issues:**
```bash
# Verify DNS first
nslookup yourdomain.com

# Try staging SSL
export SSL_STAGING=true
./scripts/setup-ssl.sh
```

**502 Bad Gateway:**
```bash
# Check backend is running
docker-compose -f docker-compose.prod.yml ps backend

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 📚 Next Steps

1. **Change default passwords** - Use the API at `/docs`
2. **Setup backups** - Add cron job: `crontab -e`
   ```
   0 2 * * * /path/to/radiology-rag/scripts/backup.sh
   ```
3. **Configure monitoring** - Check logs regularly
4. **Review security** - See [DEPLOYMENT.md](DEPLOYMENT.md#security-best-practices)

## 🌐 Cloud-Specific Guides

### AWS EC2
```bash
# Launch t3.xlarge with Ubuntu 22.04
# Associate Elastic IP
# Follow steps above
```

### DigitalOcean
```bash
# Create 8GB Droplet with Ubuntu 22.04
# Add domain to networking
# Follow steps above
```

### Google Cloud
```bash
gcloud compute instances create radiology-rag \
  --machine-type=n1-standard-4 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=100GB

# SSH in and follow steps above
```

## 💡 Tips

- **DNS Propagation**: Wait 1-2 hours after setting up domain
- **SSL Staging**: Test with `SSL_STAGING=true` before production
- **Resource Monitoring**: Use `docker stats` to monitor usage
- **Backup Regularly**: Automate with cron jobs

## 📖 Full Documentation

For comprehensive guides, troubleshooting, and advanced configuration:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [AUTHENTICATION.md](AUTHENTICATION.md) - Authentication system docs
- [README.md](README.md) - Project overview

## 🆘 Support

Need help? Check:
1. Logs: `docker-compose -f docker-compose.prod.yml logs`
2. [DEPLOYMENT.md](DEPLOYMENT.md) troubleshooting section
3. GitHub Issues

---

**Deployment Time:** ~5 minutes
**Difficulty:** Easy
**Cost:** $5-20/month (depending on cloud provider)
