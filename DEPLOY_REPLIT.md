# 🚀 Deploy to Replit (FREE & Instant!)

Deploy your Radiology RAG demo to Replit in **30 seconds** - completely FREE!

---

## ✨ Why Replit?

- ✅ **Completely FREE** for public projects
- ✅ **Instant deployment** (no setup needed)
- ✅ **Online IDE** included
- ✅ **Auto-restarts** when you make changes
- ✅ **Built-in secrets** management
- ✅ **Share with a link**

**Perfect for demos and quick testing!**

---

## 🚀 Quick Deploy (30 Seconds!)

### Option 1: One-Click Deploy

[![Run on Replit](https://replit.com/badge/github/yourusername/radiology-rag)](https://replit.com/new/github/yourusername/radiology-rag)

1. **Click the button above** (or go to https://replit.com/new/github/yourusername/radiology-rag)
2. **Login** to Replit (free account)
3. **Wait 10 seconds** for environment setup
4. **Add your Gemini API key** (see below)
5. **Click "Run"** ▶️
6. **Done!** Your app is live! 🎉

### Option 2: Import from GitHub

1. **Go to**: https://replit.com/
2. **Click**: "+ Create Repl"
3. **Select**: "Import from GitHub"
4. **Paste**: `https://github.com/yourusername/radiology-rag`
5. **Click**: "Import from GitHub"
6. **Done!** Replit auto-detects configuration

---

## 🔑 Setup Gemini API Key

### Get Your FREE API Key

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Add to Replit Secrets

1. **In Replit**, look for the **🔒 Secrets** icon in left panel (or Tools → Secrets)
2. **Click "New Secret"**
3. **Key**: `GEMINI_API_KEY`
4. **Value**: Paste your API key
5. **Add Secret**

**That's it!** Click "Run" and your app starts.

---

## 📱 Access Your App

After clicking "Run":

```
🌐 Your app is live at:
   https://your-repl-name.your-username.repl.co

📖 API Documentation:
   https://your-repl-name.your-username.repl.co/docs

🔧 Backend API:
   https://your-repl-name.your-username.repl.co/api/...
```

**Share this URL** with anyone to demo your app!

---

## 🎨 Add Frontend (Optional)

Your backend is running! To add the React frontend:

### Option A: Separate Frontend Repl (Recommended)

1. **Create new Repl** → "React" template
2. **Copy** `frontend/` folder contents
3. **Update** `src/lib/api.ts`:
   ```typescript
   const API_BASE_URL = "https://your-backend-repl.repl.co"
   ```
4. **Run** the frontend Repl
5. **Done!** Two separate apps (cleaner)

### Option B: Serve from Backend (Simple)

The backend already serves the frontend at the root URL!

1. **Frontend builds** automatically when backend starts
2. **Access** at: `https://your-repl-name.repl.co/`
3. **API** still at: `https://your-repl-name.repl.co/api/...`

---

## ⚙️ Configuration

### Environment Variables

Replit automatically uses `.env` or Secrets. Configure in Secrets tab:

| Key | Value | Required |
|-----|-------|----------|
| `GEMINI_API_KEY` | Your API key from Google | ✅ Yes |
| `SECRET_KEY` | Any 32+ char string | ⚠️ Auto-generated |
| `ALLOWED_ORIGINS` | `*` (allows all) | ⚠️ Set for production |

**Optional:**
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` - For email notifications
- Custom domain settings

### Database

Replit automatically uses:
- **SQLite** (local file database)
- **In-memory** Redis/Qdrant (simplified for free tier)

For production, upgrade to:
- **Replit Database** (key-value store)
- **External PostgreSQL** (ElephantSQL free tier)

---

## 🔧 Customization

### Modify the Code

1. **Click** on any file in Replit
2. **Edit** directly in the browser
3. **Save** → App auto-restarts
4. **Refresh** your app URL

### Add Templates

1. **Upload** .docx templates to `backend/templates/`
2. **Restart** the app
3. **Templates** auto-load on startup

### Enable Features

Edit `.env` or Secrets:

```bash
# Email notifications
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Backup system
BACKUP_ENABLED=true

# Voice dictation
VOICE_DICTATION_ENABLED=true
```

---

## 💰 Cost

**FREE forever** for public projects!

### Free Tier Includes:
- ✅ Unlimited public Repls
- ✅ 1 GB RAM per Repl
- ✅ 1 GB storage
- ✅ Always-on URL
- ✅ Auto-restart on changes
- ✅ Built-in secrets management

### Limitations (Free Tier):
- ⚠️ Code is public
- ⚠️ Repl sleeps after inactivity (wakes on request)
- ⚠️ Limited compute resources

### Upgrade Options:
- **Hacker Plan**: $7/month
  - Private Repls
  - Always-on (no sleep)
  - 2 GB RAM
  - 5 GB storage
  - Faster CPU

---

## 🚀 Performance

### What to Expect:

| Feature | Performance |
|---------|------------|
| Startup | 10-30 seconds |
| Response Time | 1-3 seconds |
| Concurrent Users | 5-10 (free tier) |
| Storage | 1 GB (enough for demos) |

### Tips for Better Performance:

1. **Keep Repl Awake**:
   - Use [UptimeRobot](https://uptimerobot.com/) (free)
   - Ping your URL every 5 minutes
   
2. **Optimize Database**:
   - Use external PostgreSQL for better performance
   - [ElephantSQL](https://www.elephantsql.com/) - 20MB free

3. **Upgrade to Hacker**:
   - Always-on (no sleep)
   - Better resources
   - Only $7/month

---

## 🐛 Troubleshooting

### App Won't Start

**Check Console output:**
- Look for red error messages
- Most common: Missing `GEMINI_API_KEY`

**Solution:**
1. Add API key to Secrets
2. Click "Stop" then "Run"

### "Database locked" Error

**Cause:** SQLite doesn't handle concurrent writes well

**Solution:**
1. Use external PostgreSQL:
   ```bash
   # In Secrets, add:
   DATABASE_URL=postgresql://user:pass@host/db
   ```
2. Free PostgreSQL: https://www.elephantsql.com/

### "Out of Memory" Error

**Cause:** Limited RAM on free tier

**Solutions:**
1. Reduce model size (use smaller embeddings)
2. Upgrade to Hacker plan ($7/mo)
3. Use external services:
   - External database
   - External vector store

### Slow Performance

**Cause:** Cold start (Repl was sleeping)

**Solutions:**
1. Keep alive with UptimeRobot
2. Upgrade to Hacker (always-on)
3. Use external services for heavy lifting

---

## 🔒 Security

### For Demos (Public):
- ✅ Use Secrets for API keys
- ✅ Change default passwords
- ✅ Don't store sensitive data

### For Production:
- ⚠️ **Upgrade to Hacker** (private Repls)
- ⚠️ Use **strong passwords**
- ⚠️ Enable **HTTPS only**
- ⚠️ Use **external database** with backups
- ⚠️ Set **ALLOWED_ORIGINS** to your domain

---

## 📊 Monitor Usage

### View Logs

1. Click **"Console"** tab in Replit
2. See real-time logs
3. Debug errors

### Check API Requests

1. Visit: `https://your-repl.repl.co/docs`
2. Try API endpoints
3. See response times

### Database

View SQLite database:
```bash
# In Replit Shell
cd backend
sqlite3 radiology.db
> .tables
> SELECT * FROM users;
> .quit
```

---

## 🌟 Pro Tips

### 1. Keep Repl Awake (Free)

Use UptimeRobot to ping your URL:
1. Go to: https://uptimerobot.com/
2. Add monitor: `https://your-repl.repl.co/health`
3. Check every 5 minutes
4. **Free forever!**

### 2. Custom Domain

Add your own domain:
1. Replit Settings → Domain
2. Add CNAME record
3. Point to your Repl

### 3. Auto-Deploy from GitHub

Enable GitHub integration:
1. Connect GitHub account
2. Import from repo
3. Auto-updates on push

### 4. Use External Services

Upgrade specific components:
- **Database**: ElephantSQL (20MB free)
- **Redis**: Redis Cloud (30MB free)
- **Storage**: Cloudinary (10GB free)

---

## 📈 Scaling Up

### When to Move Beyond Replit:

- **>100 reports/day**: Consider Google Cloud Run
- **Need privacy**: Upgrade to Hacker or use other platform
- **High availability**: Use managed platform (Render, Railway)
- **Multiple users**: Need better resources

### Migration Path:

1. **Start**: Replit (FREE demo)
2. **Grow**: Replit Hacker ($7/mo)
3. **Scale**: Google Cloud Run ($15-25/mo)
4. **Enterprise**: Dedicated VPS ($40+/mo)

---

## ✅ Deployment Checklist

Before sharing your demo:

- [ ] Added `GEMINI_API_KEY` to Secrets
- [ ] Changed default admin password
- [ ] Tested report generation
- [ ] Uploaded template .docx files (optional)
- [ ] Configured email notifications (optional)
- [ ] Set up UptimeRobot (optional, keeps awake)
- [ ] Tested on mobile
- [ ] Shared URL with team

---

## 🆚 Replit vs Other Platforms

| Feature | Replit Free | Google Cloud | Render |
|---------|-------------|--------------|--------|
| **Cost** | $0 | $0 (90 days) | $0 (limited) |
| **Setup Time** | 30 sec | 5 min | 10 min |
| **Code Privacy** | Public | Private | Private |
| **Always On** | No | Yes | No |
| **Resources** | 1GB RAM | 2GB RAM | 512MB RAM |
| **Best For** | Quick demos | Production | Startups |

**Winner for instant demos: Replit!** 🏆

---

## 🎓 Learn More

- **Replit Docs**: https://docs.replit.com/
- **Replit Community**: https://replit.com/talk
- **Python on Replit**: https://docs.replit.com/programming-ide/introduction-to-the-workspace
- **Deploy from GitHub**: https://docs.replit.com/category/github

---

## 🆘 Need Help?

### Replit Support:
- Docs: https://docs.replit.com/
- Community: https://replit.com/talk
- Discord: https://replit.com/discord

### App Support:
- Check `README.md` for app documentation
- Check `DEPLOY_FREE.md` for other deployment options
- Check `DEPLOYMENT.md` for production deployments

---

## 🎉 You're Done!

Your Radiology RAG app is now live on Replit!

**Share your demo:**
```
🌐 https://your-repl-name.your-username.repl.co
```

**What's next?**
1. ✅ Test report generation
2. ✅ Upload custom templates
3. ✅ Share with your team
4. 🚀 Deploy to production (Google Cloud Run)

---

**Happy demoing!** 🎊
