# ============================================
# ConectCRM - Deploy AWS Script (PowerShell)
# ============================================
# Transfer Docker images + Deploy na AWS
# ============================================

param(
  [Parameter(Mandatory = $true)]
  [string]$KeyPath = "c:\Projetos\conectcrm\conectcrm-key.pem",
    
  [Parameter(Mandatory = $true)]
  [string]$ServerIP = "56.124.63.239",
    
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 ConectCRM - Deploy AWS Script v1.0" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 1. Verificar Conexão SSH
# ============================================
Write-Host "🔍 Verificando conexão com AWS..." -ForegroundColor Yellow

$sshCommand = "ssh -i $KeyPath -o StrictHostKeyChecking=no ubuntu@$ServerIP 'echo OK'"

try {
  $result = Invoke-Expression $sshCommand
  if ($result -eq "OK") {
    Write-Host "  ✅ Conexão SSH estabelecida!" -ForegroundColor Green
  }
}
catch {
  Write-Host "  ❌ Falha na conexão SSH!" -ForegroundColor Red
  exit 1
}

Write-Host ""

# ============================================
# 2. Exportar Docker Images para Arquivos
# ============================================
Write-Host "📦 Exportando Docker Images..." -ForegroundColor Yellow

$exportDir = "$PSScriptRoot\..\..\temp-docker-export"
New-Item -ItemType Directory -Path $exportDir -Force | Out-Null

Write-Host "  💾 Exportando backend..." -ForegroundColor Gray
docker save conectcrm-backend:latest -o "$exportDir\backend.tar"

Write-Host "  💾 Exportando frontend..." -ForegroundColor Gray
docker save conectcrm-frontend:latest -o "$exportDir\frontend.tar"

$backendSize = (Get-Item "$exportDir\backend.tar").Length / 1MB
$frontendSize = (Get-Item "$exportDir\frontend.tar").Length / 1MB

Write-Host "  ✅ Backend: $([math]::Round($backendSize, 2)) MB" -ForegroundColor Green
Write-Host "  ✅ Frontend: $([math]::Round($frontendSize, 2)) MB" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
  Write-Host "⚠️ DRY RUN - Parando aqui (não fará deploy)" -ForegroundColor Yellow
  exit 0
}

# ============================================
# 3. Transfer Images para AWS
# ============================================
Write-Host "⬆️  Transferindo para AWS..." -ForegroundColor Yellow

Write-Host "  📤 Enviando backend.tar..." -ForegroundColor Gray
scp -i $KeyPath `
  -o StrictHostKeyChecking=no `
  "$exportDir\backend.tar" `
  "ubuntu@${ServerIP}:~/backend.tar"

Write-Host "  📤 Enviando frontend.tar..." -ForegroundColor Gray
scp -i $KeyPath `
  -o StrictHostKeyChecking=no `
  "$exportDir\frontend.tar" `
  "ubuntu@${ServerIP}:~/frontend.tar"

Write-Host "  ✅ Arquivos transferidos!" -ForegroundColor Green
Write-Host ""

# ============================================
# 4. Deploy no Servidor AWS
# ============================================
Write-Host "🚀 Executando deploy no servidor..." -ForegroundColor Yellow

$deployScript = @"
echo '🐳 Carregando Docker Images...'
sudo docker load -i ~/backend.tar
sudo docker load -i ~/frontend.tar

echo ''
echo '🛑 Parando containers antigos...'
sudo docker stop conectcrm-backend-prod conectcrm-frontend-prod 2>/dev/null || true

echo ''
echo '🗑️  Removendo containers antigos...'
sudo docker rm conectcrm-backend-prod conectcrm-frontend-prod 2>/dev/null || true

echo ''
echo '🚀 Iniciando novos containers...'

# Backend
sudo docker run -d \
  --name conectcrm-backend-prod \
  --restart unless-stopped \
  --network conectcrm-network \
  -p 3500:3500 \
  -e NODE_ENV=production \
  -e DATABASE_HOST=conectcrm-postgres-prod \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USERNAME=postgres \
  -e DATABASE_PASSWORD='$DATABASE_PASSWORD' \
  -e DATABASE_NAME=conectcrm \
  -e JWT_SECRET='$JWT_SECRET' \
  conectcrm-backend:latest

# Frontend
sudo docker run -d \
  --name conectcrm-frontend-prod \
  --restart unless-stopped \
  --network conectcrm-network \
  -p 3000:80 \
  conectcrm-frontend:latest

echo ''
echo '⏳ Aguardando inicialização (30s)...'
sleep 30

echo ''
echo '📊 Status dos containers:'
sudo docker ps --filter name=conectcrm --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo ''
echo '🧪 Testando backend health:'
curl -f http://localhost:3500/health && echo '✅ Backend OK' || echo '❌ Backend FALHOU'

echo ''
echo '🧪 Testando frontend:'
curl -f http://localhost:3000 && echo '✅ Frontend OK' || echo '❌ Frontend FALHOU'

echo ''
echo '🗑️  Limpando arquivos temporários...'
rm ~/backend.tar ~/frontend.tar

echo ''
echo '✅ DEPLOY CONCLUÍDO!'
"@

ssh -i $KeyPath -o StrictHostKeyChecking=no ubuntu@$ServerIP $deployScript

Write-Host ""

# ============================================
# 5. Limpeza Local
# ============================================
Write-Host "🧹 Limpando arquivos temporários locais..." -ForegroundColor Yellow
Remove-Item -Path $exportDir -Recurse -Force
Write-Host "  ✅ Limpeza concluída!" -ForegroundColor Green
Write-Host ""

# ============================================
# 6. Resumo
# ============================================
Write-Host "✅ DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "Acesse:" -ForegroundColor Cyan
Write-Host "  Backend:  http://$ServerIP`:3500" -ForegroundColor White
Write-Host "  Frontend: http://$ServerIP`:3000" -ForegroundColor White
Write-Host "  Health:   http://$ServerIP`:3500/health" -ForegroundColor White
Write-Host ""
