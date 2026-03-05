# setup.ps1 — One-shot dev environment bootstrap (Windows PowerShell)
# Run from the project root: .\setup.ps1

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Campus Sustainability AI — Setup Script"   -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# ── 1. Backend ──────────────────────────────────────────────────────────────
Write-Host "[1/4] Setting up Python backend..." -ForegroundColor Cyan
Set-Location "$Root\backend"

if (-not (Test-Path ".venv")) {
    Write-Host "  Creating virtual environment..."
    python -m venv .venv
}

Write-Host "  Activating venv and installing dependencies..."
.\.venv\Scripts\Activate.ps1
pip install --quiet -r requirements.txt

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "  Created backend/.env from example." -ForegroundColor Yellow
}

# ── 2. Frontend ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/4] Setting up Next.js frontend..." -ForegroundColor Cyan
Set-Location "$Root\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing npm packages..."
    npm install --silent
}

if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "  Created frontend/.env.local from example." -ForegroundColor Yellow
}

# ── 3. ML artefacts directory ───────────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Preparing ML artefacts directory..." -ForegroundColor Cyan
Set-Location "$Root"
New-Item -ItemType Directory -Force -Path "ml\artefacts" | Out-Null
Write-Host "  ml/artefacts/ ready."

# ── 4. Train models ─────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Training ML models (energy, agritech, airquality)..." -ForegroundColor Cyan
Set-Location "$Root\backend"
.\.venv\Scripts\python.exe "..\ml\train_all.py"

# ── Done ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  Setup complete!"                            -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "To start the platform:"
Write-Host "  Backend:  cd backend ; .venv\Scripts\activate ; uvicorn main:app --reload" -ForegroundColor White
Write-Host "  Frontend: cd frontend ; npm run dev" -ForegroundColor White
Write-Host "  Sensors:  cd sensors ; python simulator.py" -ForegroundColor White
Write-Host ""
Write-Host "Then open: http://localhost:3000" -ForegroundColor Cyan
