# ============================================
# Script de Deploy Backend - ConectCRM
# ============================================
# Automatiza o processo de build e deploy do backend na AWS
# 
# Uso: .\deploy-backend.ps1
# ============================================

param(
  [switch]$SkipBuild,
  [switch]$SkipTransfer,
  [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"

# Configurações
$AWS_IP = "56.124.63.239"
$AWS_USER = "ubuntu"
$AWS_KEY = "C:\Users\mults\Downloads\conect-crm-key.pem"
$IMAGE_NAME = "conectcrm-backend:latest"
$CONTAINER_NAME = "conectcrm-backend-prod"
$TAR_FILE = "backend.tar"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Deploy Backend - ConectCRM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build da imagem Docker
if (-not $SkipBuild) {
  Write-Host "📦 [1/4] Construindo imagem Docker..." -ForegroundColor Yellow
    
  $buildStart = Get-Date
    
  docker build -f .production/docker/Dockerfile.backend -t $IMAGE_NAME . 2>&1 | Tee-Object -Variable buildOutput
    
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao construir imagem!" -ForegroundColor Red
    exit 1
  }
    
  $buildEnd = Get-Date
  $buildDuration = ($buildEnd - $buildStart).TotalSeconds
    
  Write-Host "✅ Imagem construída em $([math]::Round($buildDuration, 1))s" -ForegroundColor Green
  Write-Host ""
}
else {
  Write-Host "⏭️  [1/4] Build pulado (--SkipBuild)" -ForegroundColor Gray
}

# 2. Exportar imagem
if (-not $SkipTransfer) {
  Write-Host "💾 [2/4] Exportando imagem para .tar..." -ForegroundColor Yellow
    
  if (Test-Path $TAR_FILE) {
    Remove-Item $TAR_FILE -Force
  }
    
  docker save $IMAGE_NAME -o $TAR_FILE
    
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao exportar imagem!" -ForegroundColor Red
    exit 1
  }
    
  $fileSize = [math]::Round((Get-Item $TAR_FILE).Length / 1MB, 2)
  Write-Host "✅ Arquivo exportado: $fileSize MB" -ForegroundColor Green
  Write-Host ""
    
  # 3. Transferir para AWS
  Write-Host "📤 [3/4] Transferindo para AWS..." -ForegroundColor Yellow
    
  $transferStart = Get-Date
    
  scp -i $AWS_KEY $TAR_FILE ${AWS_USER}@${AWS_IP}:/tmp/
    
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao transferir arquivo!" -ForegroundColor Red
    exit 1
  }
    
  $transferEnd = Get-Date
  $transferDuration = ($transferEnd - $transferStart).TotalSeconds
    
  Write-Host "✅ Transferido em $([math]::Round($transferDuration, 1))s" -ForegroundColor Green
  Write-Host ""
}
else {
  Write-Host "⏭️  [2/4] e [3/4] Transfer pulado (--SkipTransfer)" -ForegroundColor Gray
}

# 4. Deploy na AWS
if (-not $SkipDeploy) {
  Write-Host "🚀 [4/4] Fazendo deploy na AWS..." -ForegroundColor Yellow
    
  $deployScript = @"
# Carregar nova imagem
sudo docker load -i /tmp/$TAR_FILE

# Parar e remover container antigo
sudo docker stop $CONTAINER_NAME 2>/dev/null || true
sudo docker rm $CONTAINER_NAME 2>/dev/null || true

# Rodar novo container
sudo docker run -d \
  --name $CONTAINER_NAME \
  --network conectcrm-network \
  -p 3500:3001 \
  --restart unless-stopped \
  --env-file /home/ubuntu/.env.backend \
  $IMAGE_NAME

# Aguardar 5 segundos
sleep 5

# Verificar status
sudo docker ps --filter name=$CONTAINER_NAME --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# Mostrar últimas linhas do log
echo ""
echo "📋 Últimas linhas do log:"
sudo docker logs --tail 20 $CONTAINER_NAME
"@
    
  ssh -i $AWS_KEY ${AWS_USER}@${AWS_IP} $deployScript
    
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer deploy!" -ForegroundColor Red
    exit 1
  }
    
  Write-Host "✅ Deploy concluído!" -ForegroundColor Green
  Write-Host ""
}
else {
  Write-Host "⏭️  [4/4] Deploy pulado (--SkipDeploy)" -ForegroundColor Gray
}

# Limpeza local
if (Test-Path $TAR_FILE) {
  Remove-Item $TAR_FILE -Force
  Write-Host "🧹 Arquivo .tar local removido" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Deploy Backend Concluído!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Backend API: http://$AWS_IP:3500" -ForegroundColor White
Write-Host "  Swagger Docs: http://$AWS_IP:3500/api-docs" -ForegroundColor White
Write-Host ""
Write-Host "Comandos úteis:" -ForegroundColor Cyan
Write-Host "  Logs: ssh -i `"$AWS_KEY`" $AWS_USER@$AWS_IP 'sudo docker logs -f $CONTAINER_NAME'" -ForegroundColor White
Write-Host "  Status: ssh -i `"$AWS_KEY`" $AWS_USER@$AWS_IP 'sudo docker ps | grep backend'" -ForegroundColor White
Write-Host ""
