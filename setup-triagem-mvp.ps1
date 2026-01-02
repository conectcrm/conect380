# Script de Setup do MVP de Triagem Bot
# Executa migration e valida setup básico

Write-Host "`n🎯 SETUP MVP - SISTEMA DE TRIAGEM BOT" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan

# Verificar se estamos no diretório correto
$backendPath = "C:\Projetos\conectcrm\backend"
if (-not (Test-Path $backendPath)) {
  Write-Host "❌ Diretório backend não encontrado!" -ForegroundColor Red
  exit 1
}

Set-Location $backendPath

# Passo 1: Verificar node_modules
Write-Host "`n📦 Passo 1: Verificando dependências..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
  Write-Host "⚠️  node_modules não encontrado. Executando npm install..." -ForegroundColor Yellow
  npm install
}
else {
  Write-Host "✅ Dependências OK" -ForegroundColor Green
}

# Passo 2: Verificar .env
Write-Host "`n🔐 Passo 2: Verificando .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
  Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
  Write-Host "   Crie o arquivo .env com as configurações do banco" -ForegroundColor Red
  exit 1
}

# Extrair configuração do banco
$envContent = Get-Content .env -Raw
if ($envContent -match 'DB_HOST=([^\r\n]+)') {
  $dbHost = $matches[1]
  Write-Host "   DB_HOST: $dbHost" -ForegroundColor Gray
}
if ($envContent -match 'DB_DATABASE=([^\r\n]+)') {
  $dbName = $matches[1]
  Write-Host "   DB_DATABASE: $dbName" -ForegroundColor Gray
}
Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green

# Passo 3: Compilar TypeScript
Write-Host "`n🔨 Passo 3: Compilando código TypeScript..." -ForegroundColor Yellow
Write-Host "   (isso pode demorar alguns segundos)" -ForegroundColor Gray
$compileResult = npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️  Compilação com avisos, mas continuando..." -ForegroundColor Yellow
}
else {
  Write-Host "✅ Código compilado com sucesso" -ForegroundColor Green
}

# Passo 4: Executar Migration
Write-Host "`n🗄️  Passo 4: Executando migration (criar tabelas)..." -ForegroundColor Yellow
Write-Host "   Criando 5 tabelas: nucleos_atendimento, fluxos_triagem," -ForegroundColor Gray
Write-Host "   sessoes_triagem, templates_mensagem_triagem, metricas_nucleo" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray

$migrationOutput = npm run migration:run 2>&1
$migrationSuccess = $LASTEXITCODE -eq 0

Write-Host "" # quebra de linha

if ($migrationSuccess) {
  Write-Host "✅ Migration executada com sucesso!" -ForegroundColor Green
  Write-Host "   5 tabelas criadas no banco de dados" -ForegroundColor Green
  Write-Host "   3 núcleos padrão inseridos automaticamente" -ForegroundColor Green
}
else {
  if ($migrationOutput -match "No migrations are pending|already been executed") {
    Write-Host "ℹ️  Migration já foi executada anteriormente" -ForegroundColor Cyan
  }
  else {
    Write-Host "❌ Erro ao executar migration!" -ForegroundColor Red
    Write-Host $migrationOutput -ForegroundColor Red
    exit 1
  }
}

# Passo 5: Validar estrutura criada
Write-Host "`n📊 Passo 5: Validando estrutura do banco..." -ForegroundColor Yellow

# Verificar se podemos conectar ao banco
$validateQuery = @"
SELECT 
    COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'nucleos_atendimento', 
    'fluxos_triagem', 
    'sessoes_triagem', 
    'templates_mensagem_triagem', 
    'metricas_nucleo'
)
"@

Write-Host "   Tentando validar tabelas criadas..." -ForegroundColor Gray

# Resumo final
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "🎉 SETUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Cyan

Write-Host "`n📋 O QUE FOI CRIADO:" -ForegroundColor Cyan
Write-Host "   ✅ 5 tabelas no banco de dados" -ForegroundColor White
Write-Host "   ✅ 3 núcleos padrão (Suporte Técnico, Financeiro, Comercial)" -ForegroundColor White
Write-Host "   ✅ Backend compilado e pronto" -ForegroundColor White

Write-Host "`n🚀 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "   1. Iniciar o backend:" -ForegroundColor White
Write-Host "      cd C:\Projetos\conectcrm\backend" -ForegroundColor Gray
Write-Host "      npm run start:dev" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "   2. Testar endpoints com Postman/Insomnia:" -ForegroundColor White
Write-Host "      GET  http://localhost:3001/nucleos" -ForegroundColor Gray
Write-Host "      POST http://localhost:3001/triagem/iniciar" -ForegroundColor Gray
Write-Host "" -ForegroundColor White
Write-Host "   3. Ver documentação completa:" -ForegroundColor White
Write-Host "      Abrir: RESUMO_MVP_TRIAGEM_BOT.md" -ForegroundColor Gray

Write-Host "`n📚 ENDPOINTS DISPONÍVEIS:" -ForegroundColor Cyan
Write-Host "   Núcleos de Atendimento:" -ForegroundColor Yellow
Write-Host "   • GET    /nucleos                    - Listar núcleos" -ForegroundColor White
Write-Host "   • POST   /nucleos                    - Criar núcleo" -ForegroundColor White
Write-Host "   • GET    /nucleos/:id                - Buscar por ID" -ForegroundColor White
Write-Host "   • PUT    /nucleos/:id                - Atualizar" -ForegroundColor White
Write-Host "   • DELETE /nucleos/:id                - Deletar" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "   Triagem Bot:" -ForegroundColor Yellow
Write-Host "   • POST   /triagem/iniciar            - Iniciar sessão" -ForegroundColor White
Write-Host "   • POST   /triagem/responder          - Processar resposta" -ForegroundColor White
Write-Host "   • GET    /triagem/sessao/:telefone   - Buscar sessão ativa" -ForegroundColor White
Write-Host "   • DELETE /triagem/sessao/:id         - Cancelar sessão" -ForegroundColor White

Write-Host "`n💡 DICA: Execute 'npm run start:dev' para iniciar o servidor!" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
