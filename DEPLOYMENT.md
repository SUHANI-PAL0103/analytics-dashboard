# Deployment Guide

This guide covers deploying the full-stack analytics application to production.

## 🏗️ Architecture Overview

**Production Setup:**
- Frontend (Next.js): Vercel
- Backend API (Express): Vercel Serverless Functions or separate hosting
- Database: Managed PostgreSQL (Supabase/Neon/Render)
- Vanna AI: Render/Railway/Fly.io

---

## 📦 Pre-Deployment Checklist

- [ ] All code committed to GitHub
- [ ] Environment variables documented
- [ ] Database schema finalized
- [ ] API endpoints tested locally
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Groq API key obtained
- [ ] Production database created

---

## 1️⃣ Deploy Database (PostgreSQL)

### Option A: Supabase (Recommended - Free Tier Available)

1. Go to https://supabase.com
2. Create new project
3. Get connection string from Settings → Database
4. Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

### Option B: Neon (Free Tier with Serverless)

1. Go to https://neon.tech
2. Create project
3. Copy connection string
4. Format: `postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]`

### Option C: Render PostgreSQL

1. Go to https://render.com
2. New → PostgreSQL
3. Choose free or paid plan
4. Copy Internal Database URL

**After creating database:**

```powershell
# Update DATABASE_URL in apps/api/.env
# Run migrations
cd apps\api
npx prisma migrate deploy
npx prisma generate

# Seed production data
npm run db:seed
```

---

## 2️⃣ Deploy Vanna AI Service

### Option A: Render (Recommended)

1. **Push to GitHub** (if not already)
```powershell
git add .
git commit -m "Vanna AI service ready for deployment"
git push origin main
```

2. **Deploy on Render**
   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `analytics-vanna-ai`
     - **Root Directory:** `services/vanna`
     - **Environment:** `Python 3`
     - **Build Command:** `pip install -r requirements.txt`
     - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - **Plan:** Free (or paid for better performance)

3. **Add Environment Variables** in Render dashboard:
   ```
   DATABASE_URL=postgresql://[your-production-db-url]
   GROQ_API_KEY=your-groq-api-key-here
   VANNA_API_KEY=your-secure-random-key
   PORT=10000
   ```

4. **Deploy** - Render will build and deploy automatically
5. **Get URL** - Copy the deployed URL (e.g., `https://analytics-vanna-ai.onrender.com`)

### Option B: Railway

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select `services/vanna` directory
4. Add environment variables
5. Deploy

### Option C: Fly.io

```powershell
# Install Fly CLI
iwr https://fly.io/install.ps1 -useb | iex

# Login
fly auth login

# Deploy from services/vanna directory
cd services\vanna
fly launch
# Follow prompts, set environment variables
fly deploy
```

---

## 3️⃣ Deploy Backend API

### Option A: Vercel (Recommended if using Next.js API Routes)

If you want to combine frontend and backend:

1. **Move API routes to Next.js** (Optional - convert Express routes to Next.js API routes in `apps/web/app/api`)

### Option B: Separate Express Deployment on Render

1. **Render Dashboard** → New → Web Service
2. Configure:
   - **Name:** `analytics-api`
   - **Root Directory:** `apps/api`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

3. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://[production-db]
   PORT=10000
   VANNA_API_BASE_URL=https://analytics-vanna-ai.onrender.com
   VANNA_API_KEY=your-secure-random-key
   NODE_ENV=production
   ```

4. **Deploy**

5. **Get API URL** (e.g., `https://analytics-api.onrender.com`)

---

## 4️⃣ Deploy Frontend (Next.js)

### Vercel Deployment (Recommended)

1. **Push to GitHub** (if not done)
```powershell
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Import on Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure project:
     - **Framework Preset:** Next.js
     - **Root Directory:** `apps/web`
     - **Build Command:** `npm run build` (or leave default)
     - **Output Directory:** `.next`
     - **Install Command:** `npm install`

3. **Environment Variables** in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://analytics-api.onrender.com
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
   (If API is on same domain, use relative path `/api`)

4. **Deploy** - Vercel will auto-deploy

5. **Custom Domain** (Optional)
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records

---

## 5️⃣ Configure CORS & Security

### Update Vanna AI CORS (services/vanna/main.py)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",
        "https://your-custom-domain.com"
    ],  # Replace with your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Update API CORS (apps/api/src/index.ts)

```typescript
app.use(cors({
  origin: [
    'https://your-app.vercel.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
}));
```

---

## 6️⃣ Post-Deployment Verification

### Test API
```powershell
# Health check
curl https://analytics-api.onrender.com/health

# Stats endpoint
curl https://analytics-api.onrender.com/stats
```

### Test Vanna AI
```powershell
Invoke-RestMethod -Uri "https://analytics-vanna-ai.onrender.com/health"
```

### Test Frontend
1. Visit `https://your-app.vercel.app/dashboard`
2. Check all charts load
3. Test invoices table
4. Test chat interface

### Test Chat Flow End-to-End
1. Go to Chat with Data page
2. Enter: "Show top 5 vendors by spend"
3. Verify:
   - SQL is generated
   - Results appear
   - Export CSV works

---

## 🔒 Production Security Checklist

- [ ] Use strong, random API keys (not "changeme" or "your-secret-key-here")
- [ ] Enable HTTPS only (no HTTP)
- [ ] Set proper CORS origins (no wildcard `*` in production)
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting on API
- [ ] Use read-only database user for Vanna AI
- [ ] Enable database SSL connections
- [ ] Set up monitoring and logging
- [ ] Configure backup for database
- [ ] Use Vercel environment variables (encrypted)

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

**Vercel (Frontend):**
- Automatically deploys on every push to `main` branch
- Preview deployments for pull requests

**Render (API & Vanna):**
- Enable "Auto-Deploy" in service settings
- Deploys on every push to `main`

**Railway:**
- Auto-deploys by default

---

## 📊 Monitoring & Logs

### Vercel
- Dashboard → Your Project → Deployments
- Real-time logs
- Analytics (page views, performance)

### Render
- Dashboard → Service → Logs
- Metrics (CPU, memory, requests)

### Database
- Supabase: Dashboard → Database → Logs
- Neon: Dashboard → Operations
- Render: Dashboard → PostgreSQL → Metrics

---

## 💰 Cost Estimates

### Free Tier Setup (Good for MVP/Demo)
- **Vercel:** Free (Hobby plan)
- **Render:** Free (Web Service + PostgreSQL)
- **Groq API:** Free tier (rate limited)
- **Total:** $0/month

### Production Setup (Recommended)
- **Vercel Pro:** $20/month (better performance, analytics)
- **Render:** $7-25/month (paid web services)
- **Database (Supabase/Neon Pro):** $25/month
- **Total:** ~$50-70/month

---

## 🚀 Deployment Script

Create `deploy.ps1`:

```powershell
# Production deployment script

Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan

# Build frontend
Write-Host "`n1. Building frontend..." -ForegroundColor Yellow
cd apps\web
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Frontend build failed" -ForegroundColor Red; exit }
Write-Host "✅ Frontend built successfully" -ForegroundColor Green
cd ..\..

# Build API
Write-Host "`n2. Building API..." -ForegroundColor Yellow
cd apps\api
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ API build failed" -ForegroundColor Red; exit }
Write-Host "✅ API built successfully" -ForegroundColor Green
cd ..\..

# Run migrations
Write-Host "`n3. Running database migrations..." -ForegroundColor Yellow
cd apps\api
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Migration failed" -ForegroundColor Red; exit }
Write-Host "✅ Migrations completed" -ForegroundColor Green
cd ..\..

# Commit and push
Write-Host "`n4. Pushing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "Deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin main
Write-Host "✅ Pushed to GitHub" -ForegroundColor Green

Write-Host "`n✅ Deployment complete! Services will auto-deploy." -ForegroundColor Green
Write-Host "Check Vercel and Render dashboards for deployment status." -ForegroundColor Cyan
```

---

## 🐛 Troubleshooting Production Issues

### Issue: API can't connect to database
**Fix:**
- Verify `DATABASE_URL` in production environment variables
- Check database allows connections from your hosting provider's IP
- Enable SSL if required by database provider

### Issue: CORS errors in browser
**Fix:**
- Add Vercel domain to CORS `allow_origins` in API and Vanna
- Redeploy services after updating CORS config

### Issue: Vanna returns "Groq API error"
**Fix:**
- Verify `GROQ_API_KEY` is set correctly in Vanna environment
- Check Groq API usage limits
- Check Render logs for detailed error

### Issue: 500 errors in production
**Fix:**
- Check Render/Vercel logs
- Verify all environment variables are set
- Test API endpoints with curl
- Check database connectivity

---

## 📧 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Prisma Deployment:** https://www.prisma.io/docs/guides/deployment
- **Next.js Deployment:** https://nextjs.org/docs/deployment

---

## ✅ Post-Deployment Checklist

- [ ] Frontend loads at production URL
- [ ] All charts display data
- [ ] Invoices table works (search, pagination)
- [ ] Chat interface accepts queries
- [ ] SQL generation works
- [ ] Query results display correctly
- [ ] CSV export works
- [ ] API health endpoint responds
- [ ] Vanna health endpoint responds
- [ ] Database has production data
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Environment variables secured
- [ ] CORS configured correctly
- [ ] Monitoring enabled
- [ ] Backups configured

---

**Congratulations! Your production-grade analytics dashboard is now live! 🎉**
