# ============================================
# Script de Deploy para AWS EC2 (PowerShell)
# ============================================

Write-Host "🚀 Iniciando deploy do ConectCRM na AWS..." -ForegroundColor Green

# ============================================
# 1. Verificar dependências
# ============================================
Write-Host "`n📋 Verificando dependências..." -ForegroundColor Yellow

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Host "❌ Docker não encontrado. Instale o Docker Desktop primeiro." -ForegroundColor Red
  exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
  Write-Host "❌ Docker Compose não encontrado. Instale o Docker Compose primeiro." -ForegroundColor Red
  exit 1
}

# ============================================
# 2. Configurar variáveis de ambiente
# ============================================
Write-Host "`n🔐 Configurando variáveis de ambiente..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env.production")) {
  Write-Host "❌ Arquivo backend\.env.production não encontrado!" -ForegroundColor Red
  Write-Host "📝 Copie .env.production.example e configure as variáveis:" -ForegroundColor Yellow
  Write-Host "   Copy-Item backend\.env.production.example backend\.env.production" -ForegroundColor Cyan
  exit 1
}

# ============================================
# 3. Parar containers antigos
# ============================================
Write-Host "`n🛑 Parando containers antigos..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml down 2>$null

# ============================================
# 4. Limpar imagens antigas (opcional)
# ============================================
Write-Host "`n🧹 Limpando imagens antigas..." -ForegroundColor Yellow
docker system prune -f

# ============================================
# 5. Build das imagens
# ============================================
Write-Host "`n🏗️  Fazendo build das imagens..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml build --no-cache

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Erro no build das imagens!" -ForegroundColor Red
  exit 1
}

# ============================================
# 6. Executar migrations do banco de dados
# ============================================
Write-Host "`n📊 Executando migrations do banco de dados..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d postgres

# Aguardar PostgreSQL iniciar
Write-Host "⏳ Aguardando PostgreSQL iniciar..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Executar migrations
docker-compose -f docker-compose.prod.yml run --rm backend npm run migration:run

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Erro ao executar migrations!" -ForegroundColor Red
  exit 1
}

# ============================================
# 7. Subir todos os serviços
# ============================================
Write-Host "`n🚀 Iniciando todos os serviços..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Erro ao iniciar serviços!" -ForegroundColor Red
  exit 1
}

# ============================================
# 8. Verificar status
# ============================================
Write-Host "`n✅ Verificando status dos containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps

# ============================================
# 9. Informações finais
# ============================================
Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "`n📝 Para ver os logs:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host "`n🔍 Para verificar o status:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.prod.yml ps" -ForegroundColor White
Write-Host "`n🌐 Acesse a aplicação:" -ForegroundColor Cyan
Write-Host "   Frontend: http://seu-ip-ou-dominio" -ForegroundColor White
Write-Host "   Backend:  http://seu-ip-ou-dominio:3001" -ForegroundColor White
Write-Host ""
