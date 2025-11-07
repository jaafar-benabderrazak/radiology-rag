# Quick Start Guide - Replit Deployment

## 🚀 Deploy in 3 Steps

### Step 1: Set API Key
1. Click **Secrets** (🔒) in Replit sidebar
2. Add:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** Your Google Gemini API key
3. Get free API key: https://makersuite.google.com/app/apikey

### Step 2: Run
Click the **Run** button at the top

### Step 3: Login
Use demo credentials:
- **Email:** `doctor@hospital.com`
- **Password:** `doctor123`

---

## ✅ What's Fixed

1. **Templates Auto-Load** ✅
   - 11 radiology templates loaded automatically
   - No manual setup needed

2. **Voice Input Working** 🎤
   - Use Chrome, Edge, or Safari
   - Click 🎤 button to speak
   - Works in English and French

3. **Generation Working** ⚡
   - Login required (security)
   - Auto-select or manual template choice
   - AI-powered report generation

---

## 🌐 Browser Compatibility

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| App | ✅ | ✅ | ✅ | ✅ |
| Voice | ✅ | ✅ | ✅ | ❌ |
| All Features | ✅ | ✅ | ✅ | ⚠️ |

**Recommended:** Use Chrome for best experience

---

## 📖 How to Use

### 1. Generate a Report
1. Login with demo credentials
2. Select a template (or use "Auto-detect")
3. Enter clinical indication
   - Or use 🎤 voice input (Chrome)
4. Click "Generate Report"
5. View AI-generated report

### 2. Download Report
- **Word (.docx):** Original formatting
- **Word (Highlighted):** AI content marked
- **PDF:** Final version

### 3. AI Analysis Tools
- **Generate Summary:** Get concise summary
- **Validate Report:** Check for errors

---

## 🔧 Troubleshooting

### Templates Not Showing?
- **Check:** Backend logs for "✓ Loaded X templates"
- **Solution:** Restart application

### Voice Not Working?
- **Check:** Using Chrome, Edge, or Safari?
- **Solution:** Allow microphone permissions

### "Authentication Required" Error?
- **Solution:** Login with demo credentials
- **Email:** doctor@hospital.com
- **Password:** doctor123

### "Internal Server Error"?
- **Check:** GEMINI_API_KEY set in Secrets?
- **Solution:** Add API key and restart

---

## 📁 Templates Included

All templates auto-loaded:
1. IRM BILIAIRE (MRI Biliary)
2. IRM DE 1 (MRI)
3. IRM DE L (MRI)
4. IRM DE LA CHEVILLE (MRI Ankle)
5. IRM DU GENOU (MRI Knee)
6. IRM DU RACHIS CERVICAL (MRI Cervical Spine)
7. IRM DU RACHIS ENTIER (MRI Full Spine)
8. IRM DU RACHIS LOMBAIRE (MRI Lumbar Spine)
9. IRM HEPATIQUE (MRI Liver)
10. IRM MAMMAIRE (MRI Breast)
11. ENTERO (Enterography)

Plus 2 default templates (CT, X-ray)

---

## 🎯 Features

### ✅ Authentication System
- Secure login/registration
- JWT token-based
- Role-based access (Doctor/Admin)

### ✅ AI Report Generation
- Google Gemini AI
- Template-based structure
- Multi-language support (EN/FR)

### ✅ Voice Dictation
- Real-time speech-to-text
- English and French
- Browser-based (no server needed)

### ✅ RAG (Retrieval-Augmented Generation)
- Similar case retrieval
- Context-aware generation
- Improved accuracy

### ✅ Export Options
- Word (.docx) with formatting
- PDF generation
- Highlighted versions

### ✅ AI Analysis
- Auto-summary generation
- Report validation
- Error detection

---

## 🔐 Security

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Secure API endpoints
- ✅ Environment variables for secrets

---

## 📊 Backend Stack

- **Framework:** FastAPI
- **Database:** SQLite (default) / PostgreSQL
- **AI:** Google Gemini
- **Auth:** JWT tokens
- **Cache:** Redis (optional)
- **Vector DB:** Qdrant (optional)

---

## 🎨 Frontend Stack

- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** CSS-in-JS
- **Auth:** Context API

---

## 📞 Support

### Need Help?

1. **Documentation:** See [REPLIT_FIXES.md](./REPLIT_FIXES.md)
2. **Deployment:** See [DEPLOY_REPLIT.md](./DEPLOY_REPLIT.md)
3. **Backend Logs:** Check Replit console
4. **Browser Console:** Press F12

### Common Commands

```bash
# Start application
bash start-replit.sh

# Build for deployment
bash build-replit.sh

# Initialize database manually
cd backend && python init_db.py

# Check templates
ls -la templates/
```

---

## ✨ What's New in This Version

1. **Auto-Template Loading** 🎉
   - No manual database setup
   - Loads from .docx files automatically
   - Fallback to default templates

2. **Better Error Messages** 📝
   - Clear authentication errors
   - Template loading status
   - Detailed console logs

3. **Improved Startup** 🚀
   - Faster initialization
   - Better diagnostics
   - Status indicators

---

## 🎓 Demo Account

**Pre-configured doctor account:**
- **Email:** doctor@hospital.com
- **Password:** doctor123
- **Role:** Doctor
- **Hospital:** General Hospital
- **Specialization:** Radiology
- **License:** RAD-12345

**Create admin account:**
- **Email:** admin@radiology.com
- **Password:** admin123
- **Role:** Administrator

---

## 🚀 Production Deployment

For production use:

1. **Upgrade to paid tier** (Always On)
2. **Use PostgreSQL** (better than SQLite)
3. **Set strong passwords**
4. **Configure CORS** properly
5. **Enable rate limiting**
6. **Use external Redis** for caching
7. **Set up monitoring**

---

## 📈 Next Steps

After successful deployment:

1. **Create Users:** Register doctors
2. **Customize Templates:** Add your own .docx files
3. **Configure Settings:** Update hospital info
4. **Test Features:** Try all functionality
5. **Monitor Usage:** Check logs regularly

---

## 🎉 You're All Set!

Your Radiology RAG system is ready to use. Start generating AI-powered radiology reports! 🏥

**Access your app at:**
```
https://your-repl-name.your-username.repl.co
```

**Share with your team!** Everyone can register and start using it.

---

Made with ❤️ for Radiologists
