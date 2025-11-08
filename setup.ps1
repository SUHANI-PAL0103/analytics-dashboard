# Analytics Dashboard Setup & Verification Guide
# Run this step by step in PowerShell

Write-Host "=== Analytics Dashboard Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install root dependencies
Write-Host "Step 1: Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Root dependencies installed" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red; exit }

# Step 2: Install API dependencies
Write-Host "`nStep 2: Installing API dependencies..." -ForegroundColor Yellow
Set-Location apps\api
npm install
if ($LASTEXITCODE -eq 0) { Write-Host "✅ API dependencies installed" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red; exit }
Set-Location ..\..

# Step 3: Install Web dependencies
Write-Host "`nStep 3: Installing Web dependencies..." -ForegroundColor Yellow
Set-Location apps\web
npm install
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Web dependencies installed" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red; exit }
Set-Location ..\..

# Step 4: Setup Python environment
Write-Host "`nStep 4: Setting up Python virtual environment..." -ForegroundColor Yellow
Set-Location services\vanna
python -m venv .venv
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Virtual environment created" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red; exit }

.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Python dependencies installed" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red; exit }
deactivate
Set-Location ..\..

# Step 5: Start Docker PostgreSQL
Write-Host "`nStep 5: Starting PostgreSQL database..." -ForegroundColor Yellow
docker compose up -d
Start-Sleep -Seconds 5
if ($LASTEXITCODE -eq 0) { Write-Host "✅ PostgreSQL started" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red; exit }

# Step 6: Run Prisma migrations
Write-Host "`nStep 6: Running database migrations..." -ForegroundColor Yellow
Set-Location apps\api
npx prisma migrate dev --name init
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Migrations completed" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red; exit }

npx prisma generate
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Prisma client generated" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red; exit }

# Step 7: Seed database
Write-Host "`nStep 7: Seeding database..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Database seeded successfully" -ForegroundColor Green } else { Write-Host "❌ Failed" -ForegroundColor Red; exit }
Set-Location ..\..

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Get your free Groq API key from: https://console.groq.com/" -ForegroundColor White
Write-Host "2. Update .env files with your GROQ_API_KEY" -ForegroundColor White
Write-Host "3. Run 'npm run dev:all' to start all services" -ForegroundColor White
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "  - Dashboard: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "  - API: http://localhost:4000" -ForegroundColor White
Write-Host "  - Vanna AI: http://localhost:8000" -ForegroundColor White
Write-Host "  - Prisma Studio: Run 'npm run db:studio'" -ForegroundColor White
Write-Host ""
