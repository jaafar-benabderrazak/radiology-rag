# Deploy Radiology RAG for FREE - Complete Guide

## 🎁 100% Free Deployment Options

This guide shows you how to deploy your Radiology RAG application completely **FREE** using:
- **Oracle Cloud Always Free Tier** (Best option - FREE FOREVER!)
- **Free Domain** from Freenom or free subdomain
- **Free SSL** from CloudFlare or Let's Encrypt

**Total Cost: $0/month** ✅

---

## Option 1: Oracle Cloud (RECOMMENDED - Always Free!)

### Why Oracle Cloud?
- ✅ **FREE FOREVER** (not a trial)
- ✅ **2 AMD VMs** with 1 GB RAM each OR **1 Ampere ARM VM** with 4 cores & 24 GB RAM
- ✅ **200 GB storage**
- ✅ **No credit card required** (in some regions)
- ✅ **No time limit**

### Step-by-Step Guide

#### 1. Create Oracle Cloud Account (10 minutes)

1. **Go to**: https://www.oracle.com/cloud/free/
2. Click **"Start for free"**
3. Fill in your information:
   - Email address
   - Country
   - Create password
4. **Verify email**
5. **Add payment method** (required but won't be charged)
   - They need it for verification only
   - Always Free services never charge

#### 2. Create Free VM Instance (5 minutes)

1. **Login to Oracle Cloud Console**: https://cloud.oracle.com
2. Click **"Create a VM instance"**
3. **Configure:**
   - **Name**: radiology-rag
   - **Placement**: Keep default
   - **Image**:
     - Click "Change Image"
     - Select **Ubuntu 22.04**
   - **Shape**:
     - Click "Change Shape"
     - Select **VM.Standard.E2.1.Micro** (Always Free)
     - Or **VM.Standard.A1.Flex** (ARM - 4 cores, 24GB RAM - Always Free!)
   - **Networking**: Keep default
   - **Add SSH Keys**:
     - Generate or upload your SSH key
     - Download the private key
   - **Boot volume**: Keep default (50 GB)

4. Click **"Create"**

5. **Note your Public IP** (e.g., 130.61.45.123)

#### 3. Configure Firewall (3 minutes)

1. In your VM instance page, click **"Subnet"**
2. Click your **Default Security List**
3. Click **"Add Ingress Rules"**

Add these 3 rules:

**Rule 1 - HTTP:**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port: 80
```

**Rule 2 - HTTPS:**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port: 443
```

**Rule 3 - Custom (API):**
```
Source CIDR: 0.0.0.0/0
IP Protocol: TCP
Destination Port: 8000
```

#### 4. Connect to Your Server (2 minutes)

**On Windows (PowerShell):**

```powershell
# Use the private key you downloaded
ssh -i path\to\your-private-key ubuntu@130.61.45.123
```

**First time connecting:**
- Type "yes" when asked about fingerprint
- You should see Ubuntu welcome message

#### 5. Configure Ubuntu Firewall (1 minute)

```bash
# Allow required ports
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8000 -j ACCEPT

# Save rules
sudo netfilter-persistent save
```

#### 6. Install Docker (3 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group to take effect
exit
```

**Reconnect:**
```powershell
ssh -i path\to\your-private-key ubuntu@130.61.45.123
```

**Verify:**
```bash
docker --version
docker-compose --version
```

#### 7. Get a Free Domain (5 minutes)

**Option A: Free Domain from Freenom (Real domain, 12 months free)**

1. Go to: https://www.freenom.com
2. Search for a domain (e.g., "myradiology")
3. Select a FREE domain (.tk, .ml, .ga, .cf, .gq)
4. Click "Get it now" → "Checkout"
5. Select period: 12 Months @ FREE
6. Create account and complete registration
7. **Configure DNS**:
   - My Domains → Manage Domain → Management Tools → Nameservers
   - Use Custom Nameservers:
     - `ns1.freenom.com`
     - `ns2.freenom.com`
   - Or use CloudFlare (recommended - see below)

**Option B: Free Subdomain from Afraid.org**

1. Go to: https://freedns.afraid.org
2. Create free account
3. Add a subdomain (e.g., myradiology.mooo.com)
4. Point to your Oracle Cloud IP

**Option C: Use IP address directly (No domain)**
- Access via: `http://130.61.45.123:8000`
- No SSL but works for testing

#### 8. Setup CloudFlare (Optional but Recommended - FREE SSL)

1. Go to: https://www.cloudflare.com
2. **Sign up** for free account
3. **Add your domain**
4. **Update nameservers** at Freenom to CloudFlare's nameservers
5. **Configure DNS**:
   - Add **A Record**:
     - Name: `@`
     - IPv4: Your Oracle Cloud IP
     - Proxy status: Proxied (orange cloud)
   - Add **A Record**:
     - Name: `www`
     - IPv4: Your Oracle Cloud IP
     - Proxy status: Proxied
6. **SSL/TLS Settings**:
   - Go to SSL/TLS
   - Set to "Flexible" (for free SSL)

**Wait 5-10 minutes for DNS to propagate**

#### 9. Deploy Application (5 minutes)

```bash
# Clone repository
cd ~
git clone https://github.com/jaafar-benabderrazak/radiology-rag.git
cd radiology-rag

# Checkout deployment branch
git checkout claude/production-deployment-011CUfTU67T65RF7aQZUpKp2

# Create environment file
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

**Edit these values:**

```bash
DOMAIN=yourdomain.tk                           # Your free domain
POSTGRES_PASSWORD=SecurePassword123!            # Strong password
REDIS_PASSWORD=AnotherSecurePass456!           # Strong password
GEMINI_API_KEY=your_api_key_here               # Get from Google AI Studio
```

**Save:** Ctrl+O, Enter, Ctrl+X

**Get Free Gemini API Key:**
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Get API Key"
3. Copy and paste into `.env.production`

#### 10. Update Nginx Configuration (1 minute)

```bash
# Replace domain
sed -i 's/yourdomain.com/yourdomain.tk/g' nginx/conf.d/radiology.conf

# Verify
cat nginx/conf.d/radiology.conf | grep server_name
```

#### 11. Deploy! (5 minutes)

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy application
./scripts/deploy.sh
```

**Wait for deployment to complete...**

**Check status:**
```bash
docker-compose -f docker-compose.prod.yml ps
```

All services should show "Up (healthy)"

#### 12. Access Your Application! 🎉

**If using CloudFlare with domain:**
- Visit: `https://yourdomain.tk`
- API Docs: `https://yourdomain.tk/docs`

**If using IP only:**
- Visit: `http://YOUR_IP:3000`
- API Docs: `http://YOUR_IP:8000/docs`

**Login with:**
- Email: `doctor@hospital.com`
- Password: `doctor123`

---

## Option 2: Google Cloud Platform (Free for 90 days)

### Why GCP?
- ✅ **$300 FREE credit** for 90 days
- ✅ More powerful than Oracle
- ✅ Easy to use

### Quick Steps:

1. **Sign up**: https://cloud.google.com/free
2. **Create VM**:
   ```bash
   gcloud compute instances create radiology-rag \
     --machine-type=e2-medium \
     --image-family=ubuntu-2204-lts \
     --image-project=ubuntu-os-cloud \
     --boot-disk-size=30GB
   ```
3. **Configure firewall**:
   ```bash
   gcloud compute firewall-rules create allow-http --allow tcp:80
   gcloud compute firewall-rules create allow-https --allow tcp:443
   ```
4. **Get IP**: `gcloud compute instances list`
5. **SSH**: `gcloud compute ssh radiology-rag`
6. **Follow steps 6-12** from Oracle guide above

---

## Option 3: Render.com (Limited Free Tier)

### Why Render?
- ✅ **No server management**
- ✅ **Automatic SSL**
- ✅ **Easy deployment**
- ⚠️ Services sleep after 15 minutes of inactivity
- ⚠️ Limited resources

### Limitations:
- Free PostgreSQL only 90 days
- Services sleep when inactive
- 750 hours/month free (enough for 1 service 24/7)

### Steps:

1. **Sign up**: https://render.com
2. **Create PostgreSQL**:
   - New → PostgreSQL
   - Name: radiology-db
   - Region: Closest to you
   - Plan: Free

3. **Create Redis** (use external free service):
   - Sign up at: https://redis.com/try-free/
   - Get connection string

4. **Deploy Backend**:
   - New → Web Service
   - Connect GitHub repo
   - Settings:
     - Name: radiology-backend
     - Environment: Docker
     - Plan: Free
     - Add environment variables from `.env.production`

5. **Deploy Frontend**:
   - New → Static Site
   - Build Command: `cd frontend && npm run build`
   - Publish Directory: `frontend/dist`

**Note:** Render free tier is very limited for this application. Oracle Cloud is much better!

---

## Option 4: Railway.app (Limited Free)

### Why Railway?
- ✅ **$5 free credit/month**
- ✅ **Easy deployment**
- ⚠️ Credits run out quickly with multiple services

### Steps:

1. **Sign up**: https://railway.app
2. **Deploy from GitHub**:
   - New Project → Deploy from GitHub
   - Select your repository
   - Add services (PostgreSQL, Redis, Backend, Frontend)
3. **Configure environment variables**
4. **Deploy**

**Note:** $5 credit is very limited. Will likely run out in a few days with all services.

---

## Comparison of Free Options

| Provider | Cost | Duration | Resources | Best For |
|----------|------|----------|-----------|----------|
| **Oracle Cloud** | FREE | Forever | 4 cores, 24GB RAM | Production ⭐ |
| **GCP** | FREE | 90 days | $300 credit | Testing |
| **Render** | FREE | Limited | Sleeps after 15 min | Demo |
| **Railway** | FREE | Few days | $5/month | Quick test |

**Winner: Oracle Cloud Always Free Tier** 🏆

---

## Free Domain Options

| Provider | Cost | Duration | Domain Types |
|----------|------|----------|--------------|
| **Freenom** | FREE | 12 months | .tk .ml .ga .cf .gq |
| **Afraid.org** | FREE | Forever | Subdomains |
| **InfinityFree** | FREE | Forever | Free subdomain |
| **No-IP** | FREE | 30 days | Dynamic DNS |

---

## Free SSL Options

| Provider | Cost | Setup |
|----------|------|-------|
| **CloudFlare** | FREE | Easy - Proxy through CF |
| **Let's Encrypt** | FREE | Automatic with certbot |
| **ZeroSSL** | FREE | Manual setup |

---

## Monitoring Your Free Tier Usage

### Oracle Cloud:
1. Go to: https://cloud.oracle.com
2. Click "Governance → Limits, Quotas and Usage"
3. Check "Always Free" resources

### Google Cloud:
1. Go to: https://console.cloud.google.com/billing
2. Check remaining credit

---

## Important Tips for Free Hosting

1. **Oracle Cloud**:
   - Don't delete Always Free resources or you can't recreate them
   - Keep VM running (they terminate idle VMs after 30 days)
   - Set up a cron job to keep it active

2. **Keep services active**:
   ```bash
   # Add to crontab (crontab -e)
   */10 * * * * curl https://yourdomain.tk/health
   ```

3. **Monitor resources**:
   ```bash
   # Check resource usage
   docker stats

   # Check disk space
   df -h
   ```

4. **Optimize for low resources**:
   - Reduce Docker image sizes
   - Limit memory per service
   - Use swap if needed

---

## Troubleshooting Free Deployments

### Oracle Cloud: Can't SSH
**Solution:**
```bash
# Check your security list has SSH (port 22) allowed
# Try using browser-based SSH from Oracle Console
```

### Freenom Domain Not Working
**Solution:**
- Wait 24 hours for DNS propagation
- Use CloudFlare nameservers for faster propagation
- Check DNS with: `nslookup yourdomain.tk`

### Out of Memory on Free Tier
**Solution:**
```bash
# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Services Keep Stopping (Render/Railway)
**Solution:**
- Upgrade to paid tier ($7-20/month)
- Or switch to Oracle Cloud (free forever)

---

## Next Steps After Free Deployment

1. ✅ **Test your application** thoroughly
2. ✅ **Change default passwords**
3. ✅ **Setup monitoring** (UptimeRobot - free)
4. ✅ **Backup database** regularly
5. ✅ **Consider upgrading** if you need 24/7 availability

---

## Cost Comparison (If You Upgrade Later)

| What | Free Option | Paid Option | Cost |
|------|-------------|-------------|------|
| Server | Oracle Free | DigitalOcean | $24/month |
| Domain | Freenom | .com domain | $12/year |
| SSL | CloudFlare | Included | FREE |
| **Total** | **$0/month** | **$25/month** |

---

## Recommended: Start Free, Upgrade Later

1. **Start with**: Oracle Cloud + Freenom + CloudFlare (100% FREE)
2. **Test for**: 1-3 months
3. **Then decide**: Keep free or upgrade based on usage
4. **If successful**: Buy .com domain ($12/year), keep Oracle Cloud (still free!)

---

## Summary: Best FREE Deployment Path

```
1. Oracle Cloud (Always Free VM) ←  Best choice!
2. Freenom (Free domain for 12 months)
3. CloudFlare (Free SSL + CDN)
4. Deploy with Docker Compose

= 100% FREE, Production-ready! 🎉
```

**Total Setup Time**: ~30-40 minutes
**Total Cost**: $0 forever (as long as you use Oracle Always Free tier)

---

## Need Help?

- Oracle Cloud docs: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm
- Freenom support: https://www.freenom.com/en/index.html
- CloudFlare docs: https://developers.cloudflare.com/

**Ready to deploy for FREE? Follow the Oracle Cloud guide above!** 🚀
