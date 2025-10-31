# Radiology RAG - Production Deployment Guide

This guide covers deploying the Radiology RAG application to production with HTTPS/SSL support.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Server Setup](#server-setup)
4. [Deployment Steps](#deployment-steps)
5. [Cloud Platform Guides](#cloud-platform-guides)
6. [SSL/HTTPS Setup](#sslhttps-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)

## Quick Start

For the impatient (but please read the full guide later):

```bash
# 1. Clone and configure
git clone https://github.com/yourusername/radiology-rag.git
cd radiology-rag
git checkout claude/setup-radiology-docker-services-011CUbfwqGA7BmujzTVkH5rG

# 2. Configure environment
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# 3. Deploy
chmod +x scripts/*.sh
./scripts/deploy.sh

# 4. Setup SSL
./scripts/setup-ssl.sh
```

Access your application at: `https://yourdomain.com`

## Prerequisites

### Server Requirements

**Minimum Specifications:**
- **CPU:** 4 cores
- **RAM:** 8 GB
- **Storage:** 50 GB SSD
- **OS:** Ubuntu 22.04 LTS (recommended) or any Linux with Docker support

**Recommended Specifications:**
- **CPU:** 8+ cores
- **RAM:** 16+ GB
- **Storage:** 100+ GB SSD
- **OS:** Ubuntu 22.04 LTS

### Required Software

1. **Docker** (20.10+)
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   ```

2. **Docker Compose** (2.0+)
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Git**
   ```bash
   sudo apt update
   sudo apt install git -y
   ```

### Domain & DNS Setup

1. **Purchase a domain** (e.g., from Namecheap, GoDaddy, Google Domains)

2. **Configure DNS A Records:**
   ```
   Type    Name    Value              TTL
   A       @       YOUR_SERVER_IP     3600
   A       www     YOUR_SERVER_IP     3600
   ```

3. **Wait for DNS propagation** (can take up to 48 hours, usually 1-2 hours)
   ```bash
   # Verify DNS propagation
   nslookup yourdomain.com
   ```

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git nano ufw fail2ban

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Configure fail2ban (protection against brute force)
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Create Deployment User

```bash
# Create user
sudo adduser radiology

# Add to docker group
sudo usermod -aG docker radiology

# Switch to deployment user
su - radiology
```

### 3. Clone Repository

```bash
cd ~
git clone https://github.com/yourusername/radiology-rag.git
cd radiology-rag
git checkout claude/setup-radiology-docker-services-011CUbfwqGA7BmujzTVkH5rG
```

## Deployment Steps

### Step 1: Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

**Required Configuration:**

```bash
# Domain
DOMAIN=yourdomain.com
FRONTEND_API_URL=https://api.yourdomain.com

# Database - CHANGE THESE!
POSTGRES_PASSWORD=your_secure_db_password_here
REDIS_PASSWORD=your_secure_redis_password_here

# AI API Key - REQUIRED
GEMINI_API_KEY=your_gemini_api_key_here
```

**Get Gemini API Key:**
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and paste into `.env.production`

### Step 2: Update Nginx Configuration

```bash
# Edit nginx configuration with your domain
nano nginx/conf.d/radiology.conf

# Replace all instances of yourdomain.com with your actual domain
# Use Ctrl+\ in nano for find and replace
```

### Step 3: Deploy Application

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh
```

This will:
- Pull latest code
- Build Docker images
- Start all services
- Initialize database
- Create default users

**Monitor deployment:**
```bash
# Watch logs
docker-compose -f docker-compose.prod.yml logs -f

# Check service status
docker-compose -f docker-compose.prod.yml ps
```

### Step 4: Setup SSL/HTTPS

**Important:** Wait for DNS propagation before running this!

```bash
# Test DNS first
nslookup yourdomain.com

# Setup SSL (production certificates)
export SSL_EMAIL=your-email@example.com
./scripts/setup-ssl.sh

# Or for testing (staging certificates)
export SSL_STAGING=true
export SSL_EMAIL=your-email@example.com
./scripts/setup-ssl.sh
```

**Certificate Auto-Renewal:**
- Certificates automatically renew every 12 hours via certbot container
- No manual intervention required

### Step 5: Verify Deployment

```bash
# Check all services are healthy
docker-compose -f docker-compose.prod.yml ps

# Test endpoints
curl https://yourdomain.com/health
curl https://yourdomain.com/api/auth/login

# View logs
docker-compose -f docker-compose.prod.yml logs backend
```

**Access your application:**
- Frontend: https://yourdomain.com
- API Documentation: https://yourdomain.com/docs
- Health Check: https://yourdomain.com/health

**Default Credentials:**
- Admin: `admin@radiology.com` / `admin123`
- Doctor: `doctor@hospital.com` / `doctor123`

**⚠️ CRITICAL: Change default passwords immediately!**

## Cloud Platform Guides

### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t3.xlarge (4 vCPU, 16 GB RAM)
   - Storage: 100 GB gp3
   - Security Group: Allow ports 22, 80, 443

2. **Configure Elastic IP**
   ```bash
   # Allocate and associate an Elastic IP
   # Update DNS A record with Elastic IP
   ```

3. **Connect and Deploy**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   # Follow "Server Setup" and "Deployment Steps" above
   ```

### DigitalOcean Droplet

1. **Create Droplet**
   - Image: Ubuntu 22.04 LTS
   - Plan: Premium Intel - 8 GB / 4 CPUs
   - Add Block Storage: 100 GB

2. **Configure Firewall**
   - Inbound: SSH (22), HTTP (80), HTTPS (443)
   - Outbound: All

3. **Deploy**
   ```bash
   ssh root@your-droplet-ip
   # Follow deployment steps
   ```

### Google Cloud Platform (GCP)

1. **Create Compute Engine Instance**
   ```bash
   gcloud compute instances create radiology-rag \
     --machine-type=n1-standard-4 \
     --image-family=ubuntu-2204-lts \
     --image-project=ubuntu-os-cloud \
     --boot-disk-size=100GB \
     --tags=http-server,https-server
   ```

2. **Configure Firewall Rules**
   ```bash
   gcloud compute firewall-rules create allow-http --allow tcp:80
   gcloud compute firewall-rules create allow-https --allow tcp:443
   ```

3. **SSH and Deploy**
   ```bash
   gcloud compute ssh radiology-rag
   # Follow deployment steps
   ```

### Azure VM

1. **Create Virtual Machine**
   - Image: Ubuntu Server 22.04 LTS
   - Size: Standard D4s v3 (4 vCPUs, 16 GB RAM)
   - Inbound ports: 22, 80, 443

2. **Configure DNS**
   - Create DNS name label
   - Update A records

3. **Deploy**
   ```bash
   ssh azureuser@your-vm-ip
   # Follow deployment steps
   ```

## SSL/HTTPS Setup

### Manual SSL Setup

If automatic setup fails:

```bash
# Create directories
mkdir -p certbot/conf certbot/www

# Stop nginx
docker-compose -f docker-compose.prod.yml stop nginx

# Get certificate
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com

# Start nginx
docker-compose -f docker-compose.prod.yml up -d nginx
```

### SSL Troubleshooting

**Certificate not found:**
```bash
# Check certificate location
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/yourdomain.com/

# Verify nginx config
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

**DNS issues:**
```bash
# Verify DNS propagation
dig yourdomain.com +short
nslookup yourdomain.com

# Wait for DNS to propagate completely
```

**Rate limiting:**
- Let's Encrypt has rate limits (5 certificates per week per domain)
- Use staging environment for testing: `SSL_STAGING=true`

## Monitoring & Maintenance

### Service Management

```bash
# View all services
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# Restart a service
docker-compose -f docker-compose.prod.yml restart [service_name]

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start all services
docker-compose -f docker-compose.prod.yml up -d
```

### Database Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U radiology_user radiology_templates > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20240101.sql | docker-compose -f docker-compose.prod.yml exec -T postgres psql -U radiology_user radiology_templates
```

### Log Management

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs --tail=100 -f

# Clear logs
docker-compose -f docker-compose.prod.yml down
docker system prune -a --volumes -f
docker-compose -f docker-compose.prod.yml up -d
```

### Health Monitoring

```bash
# Check backend health
curl https://yourdomain.com/health

# Check all services
docker-compose -f docker-compose.prod.yml ps

# Monitor resource usage
docker stats
```

### Automated Backups

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /home/radiology/radiology-rag/scripts/backup.sh
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service_name]

# Check resource usage
docker stats

# Verify environment variables
docker-compose -f docker-compose.prod.yml config
```

### Database Connection Issues

```bash
# Check postgres is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec backend python -c "from database import engine; engine.connect()"

# Reset database
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec backend python init_db.py
```

### Nginx 502 Bad Gateway

```bash
# Check backend is running
docker-compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker-compose -f docker-compose.prod.yml logs backend

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### SSL Certificate Issues

```bash
# Verify certificate files exist
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/yourdomain.com/

# Test nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Renew certificates manually
docker-compose -f docker-compose.prod.yml run --rm certbot renew
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Increase server resources if needed
```

## Security Best Practices

### 1. Change Default Credentials

```bash
# Login as admin
# Go to https://yourdomain.com/docs
# Use /api/auth/change-password endpoint
```

### 2. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### 3. Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Secure Environment Variables

```bash
# Protect .env.production
chmod 600 .env.production

# Never commit to git
echo ".env.production" >> .gitignore
```

### 5. Enable Fail2Ban

```bash
# Install fail2ban
sudo apt install fail2ban -y

# Configure for nginx
sudo nano /etc/fail2ban/jail.local
```

Add:
```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

### 6. Database Security

- Use strong passwords
- Regular backups
- Restrict network access
- Enable SSL for database connections

### 7. API Rate Limiting

Consider adding rate limiting to nginx configuration:

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20;
    # ... rest of config
}
```

## Performance Optimization

### 1. Enable Caching

Already enabled in production configuration:
- Redis for application caching
- Nginx response caching
- Browser caching via headers

### 2. Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_reports_doctor_name ON reports(doctor_name);
```

### 3. Resource Limits

Edit `docker-compose.prod.yml` to add resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Scaling Considerations

### Horizontal Scaling

For high traffic, consider:

1. **Load Balancer** (AWS ELB, Nginx, HAProxy)
2. **Multiple Backend Instances**
3. **Separate Database Server**
4. **Redis Cluster**
5. **CDN for Frontend** (CloudFlare, CloudFront)

### Vertical Scaling

Increase server resources:
- More CPU cores
- More RAM
- Faster storage (NVMe SSD)

## Support

For issues or questions:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Review this documentation
3. Check GitHub issues
4. Contact support team

## License

[Your License Here]
