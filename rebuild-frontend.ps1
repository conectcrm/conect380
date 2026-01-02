# ============================================
# Build Local e Deploy Frontend - Windows
# ============================================

Write-Host "🔨 Buildando frontend localmente com URLs HTTPS..." -ForegroundColor Yellow

# Navegar para frontend
Set-Location -Path "frontend-web"

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
  Write-Host "📦 Instalando dependências..." -ForegroundColor Cyan
  npm ci --legacy-peer-deps
}

# Build com variáveis HTTPS
Write-Host "🏗️  Buildando com REACT_APP_API_URL=https://conecthelp.com.br/api" -ForegroundColor Cyan
$env:REACT_APP_API_URL = "https://conecthelp.com.br/api"
$env:REACT_APP_WS_URL = "wss://conecthelp.com.br"

npm run build

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Erro no build!" -ForegroundColor Red
  Set-Location -Path ".."
  exit 1
}

Write-Host "✅ Build concluído!" -ForegroundColor Green

# Voltar para raiz
Set-Location -Path ".."

# Criar tar do build
Write-Host "📦 Comprimindo build..." -ForegroundColor Cyan
tar -czf frontend-build.tar.gz -C frontend-web/build .

# Enviar para EC2
Write-Host "🚀 Enviando para EC2..." -ForegroundColor Yellow
scp -i "conectcrm-key.pem" frontend-build.tar.gz ubuntu@56.124.63.239:~/

# Atualizar frontend na EC2
Write-Host "🔄 Atualizando container na EC2..." -ForegroundColor Yellow
ssh -i "conectcrm-key.pem" ubuntu@56.124.63.239 @"
cd apps
# Parar frontend
docker stop conectcrm-frontend-prod
docker rm conectcrm-frontend-prod

# Extrair novo build
mkdir -p frontend-web/build
tar -xzf ~/frontend-build.tar.gz -C frontend-web/build/

# Rebuildar imagem com novo build
docker-compose -f docker-compose.prod.yml build frontend

# Subir novamente
docker-compose -f docker-compose.prod.yml up -d frontend

# Limpar
rm ~/frontend-build.tar.gz

echo '✅ Frontend atualizado!'
"@

# Limpar arquivo local
Remove-Item frontend-build.tar.gz

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "✅ Deploy Frontend Concluído!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Teste agora: https://conecthelp.com.br" -ForegroundColor Cyan
Write-Host ""
