# 🚀 Quick Start: Deploy to Production in 30 Minutes

This guide will get your radiology app live in production **today**.

## ✅ Prerequisites

- [ ] Gemini API key (https://makersuite.google.com/app/apikey)
- [ ] GitHub account
- [ ] Credit card (for hosting - most have free tiers)

---

## 📋 Step-by-Step Deployment

### Option A: Railway.app (Easiest - Recommended)

**Step 1: Set Up Database (5 minutes)**

1. Visit https://railway.app
2. Sign in with GitHub
3. Click "New Project" → "Provision PostgreSQL"
4. Copy the `DATABASE_URL` from "Connect" tab

**Step 2: Deploy Application (10 minutes)**

1. In Railway, click "New" → "GitHub Repo"
2. Select your `radiology-rag` repository
3. Railway will auto-detect and deploy

**Step 3: Configure Environment Variables (5 minutes)**

In Railway project settings, add these variables:

```bash
DATABASE_URL=(paste from Step 1)
GEMINI_API_KEY=your-api-key-here
SECRET_KEY=$(openssl rand -hex 32)
ALLOWED_ORIGINS=https://your-app.railway.app
USE_SQLITE=false
```

**Step 4: Initialize Database (2 minutes)**

SSH into Railway container or run locally:
```bash
python backend/init_production_db.py
```

**Step 5: Test & Go Live (5 minutes)**

1. Visit https://your-app.railway.app
2. Login with: `admin@radiology.com` / `admin123`
3. ⚠️ **IMMEDIATELY change password** in settings!
4. Test template creation
5. Generate a sample report

**Step 6: Add Custom Domain (Optional - 10 minutes)**

1. In Railway, go to Settings → Domains
2. Add your domain: `radiology.yourdomain.com`
3. Add CNAME record in your DNS:
   ```
   radiology.yourdomain.com → your-app.railway.app
   ```
4. Update `ALLOWED_ORIGINS` environment variable

**🎉 Done! Your app is live!**

**Total Cost:** ~$10-20/month

---

### Option B: Render.com (Free Tier Available)

**Step 1: Create Account**
1. Visit https://render.com
2. Sign up with GitHub

**Step 2: Create PostgreSQL Database**
1. Click "New +" → "PostgreSQL"
2. Name: `radiology-db`
3. Plan: Free or Starter ($7/mo)
4. Copy the "Internal Database URL"

**Step 3: Deploy Web Service**
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - **Name:** radiology-rag
   - **Environment:** Python 3
   - **Build Command:**
     ```bash
     cd frontend && npm ci && npm run build && cd ../backend && pip install -r requirements-deploy.txt
     ```
   - **Start Command:**
     ```bash
     cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```

**Step 4: Environment Variables**
```bash
DATABASE_URL=(paste Internal Database URL)
GEMINI_API_KEY=your-key
SECRET_KEY=$(openssl rand -hex 32)
USE_SQLITE=false
PYTHON_VERSION=3.11
```

**Step 5: Deploy**
- Click "Create Web Service"
- Wait 5-10 minutes for build
- Visit your app at `https://your-app.onrender.com`

**🎉 Done!**

**Total Cost:** Free (with sleep after 15 min inactivity) or $7/month

---

### Option C: AWS (Enterprise-Grade)

**For HIPAA compliance and larger deployments.**

See full AWS deployment guide: [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)

---

## 🔒 Post-Deployment Security Checklist

Within 24 hours of going live:

- [ ] Change default admin password
- [ ] Generate new SECRET_KEY (don't use example)
- [ ] Configure ALLOWED_ORIGINS to your actual domain
- [ ] Enable automatic database backups
- [ ] Set up error monitoring (Sentry - free tier)
- [ ] Review user permissions
- [ ] Test on mobile devices
- [ ] Set up uptime monitoring (UptimeRobot - free)

---

## 📊 Monitoring Your App

### Free Monitoring Tools:

**1. UptimeRobot** (https://uptimerobot.com)
- Monitor if your app is down
- Email/SMS alerts
- Free for 50 monitors

**2. Sentry** (https://sentry.io)
- Track errors and crashes
- Free for 5,000 events/month

Setup:
```bash
pip install sentry-sdk[fastapi]
```

```python
# backend/main.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production"
)
```

**3. Railway/Render Built-in Monitoring**
- View logs
- Monitor CPU/Memory
- See request metrics

---

## 🐛 Troubleshooting

### App won't start

**Check logs:**
- Railway: View → Logs
- Render: Logs tab

**Common issues:**
```bash
# Missing environment variable
Error: GEMINI_API_KEY not set
→ Add to environment variables

# Database connection failed
Error: could not connect to server
→ Check DATABASE_URL is correct
→ Ensure database is running

# Port binding error
Error: Address already in use
→ Use $PORT environment variable
```

### Can't login

```bash
# Reset admin password
psql $DATABASE_URL
UPDATE users SET hashed_password = '$2b$12$...' WHERE email = 'admin@radiology.com';
```

### Templates not loading

```bash
# Re-run database initialization
python backend/init_production_db.py
```

---

## 📈 Scaling Your App

### When you outgrow the free tier:

**Railway.app Scaling:**
- Increase resources: Settings → Resources
- Add more CPU/RAM as needed
- Costs scale automatically

**Render.com Scaling:**
- Upgrade to Starter: $7/month
- Upgrade database: $7/month
- Add more instances

**Moving to AWS:**
- When you hit 1000+ users
- When you need HIPAA compliance
- Estimated cost: $150-300/month

---

## 🆘 Need Help?

**Documentation:**
- Railway: https://docs.railway.app
- Render: https://render.com/docs
- FastAPI: https://fastapi.tiangolo.com

**Community:**
- Railway Discord: https://discord.gg/railway
- Render Community: https://community.render.com

---

## 🎯 What's Next?

After deploying successfully:

1. **Week 1:** Monitor for errors, gather feedback
2. **Week 2:** Add refresh tokens (see PRODUCTION_SETUP.md)
3. **Week 3:** Set up automated backups
4. **Week 4:** Performance testing & optimization
5. **Month 2:** HIPAA compliance review (if needed)

---

**Ready to deploy?** 🚀

Pick Railway or Render, follow the steps above, and you'll be live in 30 minutes!
