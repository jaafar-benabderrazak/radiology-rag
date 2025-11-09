# Replit Deployment Guide

This guide explains how to deploy the Radiology RAG application on Replit with authentication working from any device.

## Quick Start (2 Minutes)

### 1. Import to Replit

**Option A: From GitHub**
1. Go to [Replit](https://replit.com/)
2. Click "Create Repl" → "Import from GitHub"
3. Paste: `https://github.com/jaafar-benabderrazak/radiology-rag`
4. Branch: `claude/doctor-user-management-011CUfTU67T65RF7aQZUpKp2`

**Option B: Direct Link**
- Visit: `https://replit.com/github/jaafar-benabderrazak/radiology-rag`

### 2. Add API Key

1. Click the **Secrets** icon (🔒) in the left sidebar
2. Add a new secret:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Google Gemini API key
3. Get a free API key at: https://makersuite.google.com/app/apikey

### 3. Run

Click the **Run** button at the top. The application will:
- Install dependencies
- Build the frontend
- Initialize the database
- Start the server

### 4. Access from Any Device

Your app will be available at:
```
https://your-repl-name.your-username.repl.co
```

Share this URL with anyone - authentication will work from any device! 🎉

## How It Works

### Architecture

This deployment uses a **unified server** approach:

```
┌─────────────────────────────────────────┐
│  Replit (Single Origin)                 │
│  https://your-app.repl.co               │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  FastAPI Backend (Port 8000)       │ │
│  │                                     │ │
│  │  ├─ API Routes: /api/*, /generate  │ │
│  │  └─ Frontend: / (React SPA)        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Key Features:**
- ✅ Frontend and backend on same origin (no CORS issues)
- ✅ Automatic API URL detection
- ✅ Works from any device
- ✅ Single port deployment (8000)
- ✅ Automatic frontend rebuild on start

### Smart API Detection

The frontend automatically detects the correct API URL:

```javascript
// In production (Replit):
// Uses: https://your-app.repl.co

// In local development:
// Uses: http://localhost:8000
```

Debug logs in browser console show the detected URL.

## Configuration Files

### `.replit`
Main configuration - defines how to run the app.

### `replit.nix`
System dependencies (Python, Node.js, PostgreSQL).

### `start-replit.sh`
Startup script that:
1. Checks for API key
2. Installs Python dependencies
3. Builds frontend
4. Initializes database
5. Starts unified server

## Troubleshooting

### "GEMINI_API_KEY not set"

**Solution:**
1. Click Secrets (🔒) icon
2. Add `GEMINI_API_KEY` with your API key
3. Restart the Repl

### "Failed to fetch" when logging in

**Check browser console** (F12) for API detection logs:
```
[API Config] Production mode - Using same origin: https://your-app.repl.co
```

**If it shows localhost:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check that you're accessing via Replit URL, not localhost

**If still failing:**
1. Check Network tab in DevTools
2. Look for failed requests
3. Verify URL is correct (not localhost)

### Frontend not loading

**Solution:**
1. Open Replit Shell
2. Run:
   ```bash
   cd frontend
   npm run build
   ```
3. Restart the Repl

### Database errors

**Solution:**
1. Open Replit Shell
2. Run:
   ```bash
   cd backend
   python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
   ```
3. Restart the Repl

## Manual Setup (Advanced)

If you want to customize the deployment:

### 1. Clone Repository

```bash
git clone https://github.com/jaafar-benabderrazak/radiology-rag.git
cd radiology-rag
git checkout claude/doctor-user-management-011CUfTU67T65RF7aQZUpKp2
```

### 2. Set Environment Variables

Create a `.env` file in the root:
```bash
GEMINI_API_KEY=your_api_key_here
DATABASE_URL=sqlite:///./radiology.db
ENVIRONMENT=production
```

### 3. Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
npm run build
```

### 4. Run

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection | `sqlite:///./radiology.db` |
| `ENVIRONMENT` | Environment mode | `production` |
| `SECRET_KEY` | JWT secret key | Auto-generated |

## Features Enabled

✅ **Authentication System**
- User registration and login
- JWT token-based auth
- Admin and doctor roles
- User management

✅ **Report Generation**
- AI-powered radiology reports
- Template-based generation
- Multi-language support

✅ **Report History**
- View past reports
- Search and filter
- Export to Word/PDF

✅ **Template Management**
- Create custom templates
- Edit existing templates
- Share templates with team

✅ **AI Analysis**
- Report summarization
- Validation and quality checks
- Key findings extraction

## Performance Tips

### For Production Use

1. **Enable Replit Always On** (paid feature)
   - Keeps your app running 24/7
   - No cold starts

2. **Use PostgreSQL** (for high traffic)
   - Better than SQLite for production
   - Add PostgreSQL add-on in Replit

3. **Upgrade to Paid Tier**
   - More CPU/RAM
   - Faster performance

### For Development

- Use the current SQLite setup
- Free tier works great for testing
- Cold starts take ~10 seconds

## Security Notes

### API Keys

- ✅ Store in Replit Secrets (encrypted)
- ❌ Never commit to git
- ❌ Never share publicly

### CORS

Current setting: `allow_origins=["*"]`

For production, update `backend/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app.repl.co"],  # Specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Cost

### Free Tier

✅ **Replit**: Free for public projects
✅ **Gemini API**: Free tier (15 req/min, 1,500 req/day)
✅ **SQLite**: Free, included

### Paid Options

💰 **Replit Hacker Plan** ($7/month)
- Always On
- More resources
- Private projects

💰 **Gemini Paid Tier** ($0.00025/1K chars)
- Higher rate limits (60 req/min)
- Better for production

## Support

### Issues

If you encounter problems:
1. Check browser console (F12) for errors
2. Check Replit console for backend errors
3. Review this troubleshooting guide

### Debug Logs

The app includes extensive logging:
- **Browser console**: Frontend API detection
- **Replit console**: Backend startup and errors

### Need Help?

Open an issue on GitHub with:
- Error messages
- Browser console logs
- Replit console logs
- Steps to reproduce

## Next Steps

After deployment:

1. **Create Admin User**
   - Register first user
   - Manually set role to 'admin' in database

2. **Add Templates**
   - Upload .docx template files
   - Or create templates in UI

3. **Test Features**
   - Generate reports
   - Try different templates
   - Test from mobile device

4. **Customize**
   - Update branding
   - Add custom templates
   - Configure settings

Enjoy your deployed Radiology RAG application! 🚀
