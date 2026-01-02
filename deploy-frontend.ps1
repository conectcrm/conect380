#!/usr/bin/env pwsh
#####################################################
# Deploy Frontend para AWS EC2
# ConectCRM - Produção
#####################################################

$ErrorActionPreference = "Stop"

Write-Host "[Deploy] Frontend ConectCRM para AWS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Gray

# Configuração
$AWS_HOST = "56.124.63.239"
$AWS_USER = "ubuntu"
$SSH_KEY = "C:\Projetos\conectcrm\conectcrm-key.pem"
$LOCAL_BUILD = "frontend-web\build"
$REMOTE_PATH = "/var/www/conectcrm"

# Verificar se build existe
if (!(Test-Path "$LOCAL_BUILD\index.html")) {
  Write-Host "[ERRO] Build não encontrado em $LOCAL_BUILD" -ForegroundColor Red
  Write-Host "Execute primeiro: cd frontend-web && npm run build" -ForegroundColor Yellow
  exit 1
}

Write-Host "[OK] Build encontrado" -ForegroundColor Green

# Verificar se chave SSH existe
if (!(Test-Path $SSH_KEY)) {
  Write-Host "[ERRO] Chave SSH não encontrada em $SSH_KEY" -ForegroundColor Red
  Write-Host "Localize sua chave aws-conectcrm.pem e coloque em $HOME\.ssh\" -ForegroundColor Yellow
  exit 1
}

Write-Host "[OK] Chave SSH encontrada" -ForegroundColor Green

# Criar tarball temporário
Write-Host "[UPLOAD] Criando arquivo para upload..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$tempFile = "frontend-build-$timestamp.tar.gz"

# Usar tar do Windows 10+
tar -czf $tempFile -C $LOCAL_BUILD .

if (!(Test-Path $tempFile)) {
  Write-Host "[ERRO] Erro ao criar tarball" -ForegroundColor Red
  exit 1
}

Write-Host "[OK] Arquivo criado: $tempFile" -ForegroundColor Green

# Upload para AWS
Write-Host "[UPLOAD] Fazendo upload para AWS..." -ForegroundColor Yellow
try {
  & scp -i $SSH_KEY $tempFile "${AWS_USER}@${AWS_HOST}:/tmp/$tempFile"
    
  if ($LASTEXITCODE -ne 0) {
    throw "SCP falhou com código $LASTEXITCODE"
  }
    
  Write-Host "[OK] Upload concluído" -ForegroundColor Green
}
catch {
  Write-Host "[ERRO] Erro no upload: $_" -ForegroundColor Red
  Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
  exit 1
}

# Descompactar no servidor
Write-Host "[DEPLOY] Descompactando no servidor..." -ForegroundColor Yellow
try {
  $sshCommands = @"
set -e
cd /tmp
sudo mkdir -p $REMOTE_PATH
sudo tar -xzf $tempFile -C $REMOTE_PATH
sudo chown -R www-data:www-data $REMOTE_PATH
sudo chmod -R 755 $REMOTE_PATH
rm -f $tempFile
echo "[OK] Frontend deployed successfully!"
"@

  & ssh -i $SSH_KEY "${AWS_USER}@${AWS_HOST}" $sshCommands
    
  if ($LASTEXITCODE -ne 0) {
    throw "SSH commands failed with code $LASTEXITCODE"
  }
    
  Write-Host "[OK] Deploy concluído!" -ForegroundColor Green
}
catch {
  Write-Host "[ERRO] Erro no deploy remoto: $_" -ForegroundColor Red
  Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
  exit 1
}

# Limpar arquivo temporário local
Remove-Item $tempFile -Force
Write-Host "[CLEANUP] Arquivo temporário removido" -ForegroundColor Gray

Write-Host ""
Write-Host "================================================" -ForegroundColor Gray
Write-Host "[SUCESSO] DEPLOY CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "[URL] Frontend disponível em: http://$AWS_HOST" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Gray
