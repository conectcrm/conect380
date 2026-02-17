# ============================================
# ConectCRM - Build Script (Windows PowerShell)
# ============================================
# Build completo: Backend + Frontend + Docker
# ============================================

param(
  [switch]$SkipTests,
  [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 ConectCRM - Build Script v1.0" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Verificar Pré-requisitos
# ============================================
Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow

$requirements = @{
  "Node.js"        = { node --version }
  "npm"            = { npm --version }
  "Docker"         = { docker --version }
  "Docker Compose" = { docker-compose --version }
}

foreach ($req in $requirements.GetEnumerator()) {
  try {
    $version = & $req.Value 2>&1
    Write-Host "  ✅ $($req.Key): $version" -ForegroundColor Green
  }
  catch {
    Write-Host "  ❌ $($req.Key): NÃO ENCONTRADO" -ForegroundColor Red
    exit 1
  }
}

Write-Host ""

# ============================================
# 2. Build Backend
# ============================================
Write-Host "🔧 Building Backend..." -ForegroundColor Yellow

Push-Location "$PSScriptRoot\..\..\backend"

Write-Host "  📦 Instalando dependências..." -ForegroundColor Gray
npm ci --legacy-peer-deps | Out-Null

Write-Host "  🔨 Compilando TypeScript..." -ForegroundColor Gray
npm run build

if (-not $SkipTests) {
  Write-Host "  🧪 Executando testes..." -ForegroundColor Gray
  npm test 2>&1 | Out-Null
}

Write-Host "  ✅ Backend compilado!" -ForegroundColor Green

Pop-Location
Write-Host ""

# ============================================
# 3. Build Frontend
# ============================================
Write-Host "🎨 Building Frontend..." -ForegroundColor Yellow

Push-Location "$PSScriptRoot\..\..\frontend-web"

Write-Host "  📦 Instalando dependências..." -ForegroundColor Gray
npm ci --legacy-peer-deps | Out-Null

Write-Host "  🔨 Build de produção..." -ForegroundColor Gray
$env:REACT_APP_API_URL = "http://localhost:3500"
npm run build

Write-Host "  ✅ Frontend compilado!" -ForegroundColor Green

Pop-Location
Write-Host ""

# ============================================
# 4. Build Docker Images
# ============================================
Write-Host "🐳 Building Docker Images..." -ForegroundColor Yellow

Push-Location "$PSScriptRoot\.."

Write-Host "  🔨 Building Backend Image..." -ForegroundColor Gray
docker build `
  -f docker/Dockerfile.backend `
  -t conectcrm-backend:latest `
  -t conectcrm-backend:$(Get-Date -Format "yyyyMMdd-HHmmss") `
  ..

Write-Host "  🔨 Building Frontend Image..." -ForegroundColor Gray
docker build `
  -f docker/Dockerfile.frontend `
  -t conectcrm-frontend:latest `
  -t conectcrm-frontend:$(Get-Date -Format "yyyyMMdd-HHmmss") `
  --build-arg REACT_APP_API_URL="http://localhost:3500" `
  ..

Pop-Location

Write-Host "  ✅ Docker Images criadas!" -ForegroundColor Green
Write-Host ""

# ============================================
# 5. Verificar Imagens
# ============================================
Write-Host "📊 Imagens Docker criadas:" -ForegroundColor Yellow
docker images | Select-String "conectcrm" | ForEach-Object {
  Write-Host "  $_" -ForegroundColor Gray
}
Write-Host ""

# ============================================
# 6. Resumo
# ============================================
Write-Host "✅ BUILD CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "  1. Testar localmente: docker-compose -f .production/docker-compose.yml up" -ForegroundColor White
Write-Host "  2. Validar backend: curl http://localhost:3500/health" -ForegroundColor White
Write-Host "  3. Validar frontend: http://localhost:3000" -ForegroundColor White
Write-Host ""

