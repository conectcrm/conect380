# ============================================
# Helper Script - Gerenciar Docker Dev/Prod
# ============================================

param(
  [Parameter(Position = 0)]
  [ValidateSet('dev', 'prod', 'rebuild', 'logs', 'clean', 'test')]
  [string]$Comando = 'dev',
    
  [switch]$Follow,
  [switch]$Verbose,

  [ValidateSet('backend', 'frontend-dev', 'all')]
  [string]$Service = 'backend'
)

$ErrorActionPreference = "Stop"

function Write-Header($texto) {
  Write-Host "`n============================================" -ForegroundColor Cyan
  Write-Host $texto -ForegroundColor Yellow
  Write-Host "============================================`n" -ForegroundColor Cyan
}

function Write-Success($texto) {
  Write-Host "✅ $texto" -ForegroundColor Green
}

function Write-Info($texto) {
  Write-Host "ℹ️  $texto" -ForegroundColor Cyan
}

function Write-Warning($texto) {
  Write-Host "⚠️  $texto" -ForegroundColor Yellow
}

switch ($Comando) {
  'dev' {
    Write-Header "Iniciando Ambiente de DESENVOLVIMENTO"
        
    Write-Info "Parando containers antigos..."
    docker-compose down
        
    Write-Info "Rebuilding serviços de desenvolvimento (backend + frontend)..."
    docker-compose build backend frontend-dev
        
    Write-Info "Iniciando containers..."
    docker-compose up -d
        
    Start-Sleep -Seconds 5
        
    Write-Success "Ambiente iniciado!"
    Write-Info "Backend: http://localhost:3001"
    Write-Info "Frontend Dev: http://localhost:3000"
    Write-Info "Postgres: localhost:5432"
    Write-Info "Redis: localhost:6379"
        
    if ($Follow) {
      Write-Header "Logs (backend + frontend-dev) — Ctrl+C para sair"
      docker-compose logs -f backend frontend-dev
    }
    else {
      Write-Info "`nPara ver logs: docker-compose logs -f backend frontend-dev"
    }
  }
    
  'prod' {
    Write-Header "Iniciando Ambiente de PRODUÇÃO"
    Write-Warning "Este comando é para TESTE local de build de produção"
    Write-Warning "Para deploy real, use CI/CD ou docker-compose.prod.yml na AWS"
        
    Write-Info "Parando containers antigos..."
    docker-compose down
        
    Write-Info "Building imagem de produção..."
    docker build -f backend/Dockerfile.prod -t conectcrm-backend:prod ./backend
        
    Write-Success "Imagem de produção criada!"
    Write-Info "Para rodar: docker run -p 3001:3001 conectcrm-backend:prod"
  }
    
  'rebuild' {
    Write-Header "Rebuild Completo (sem cache)"
        
    Write-Info "Parando containers..."
    docker-compose down
        
    Write-Info "Removendo volumes (node_modules)..."
    docker volume rm conectsuite-backend-node-modules -ErrorAction SilentlyContinue
    docker volume rm conectsuite-frontend-node-modules -ErrorAction SilentlyContinue
        
    Write-Info "Rebuilding do zero..."
    docker-compose build --no-cache backend frontend-dev
        
    Write-Info "Iniciando containers..."
    docker-compose up -d
        
    Start-Sleep -Seconds 5
        
    Write-Success "Rebuild concluído!"
        
    if ($Follow) {
      docker-compose logs -f backend
    }
  }
    
  'logs' {
    Write-Header "Logs do Docker ($Service)"

    $services = switch ($Service) {
      'frontend-dev' { @('frontend-dev') }
      'all' { @('backend', 'frontend-dev') }
      default { @('backend') }
    }
        
    if ($Follow) {
      docker-compose logs -f @services
    }
    else {
      docker-compose logs --tail 50 @services
    }
  }
    
  'clean' {
    Write-Header "Limpeza Completa do Docker"
    Write-Warning "Isso vai remover TODOS os containers, volumes e imagens"
        
    $confirmacao = Read-Host "Tem certeza? (yes/no)"
        
    if ($confirmacao -eq 'yes') {
      Write-Info "Parando containers..."
      docker-compose down -v
            
      Write-Info "Removendo imagens do projeto..."
      docker images | Select-String "conectcrm|conectsuite" | ForEach-Object {
        $imageId = ($_ -split '\s+')[2]
        docker rmi $imageId -f
      }
            
      Write-Info "Limpando cache do Docker..."
      docker system prune -a -f
            
      Write-Success "Limpeza concluída!"
    }
    else {
      Write-Info "Operação cancelada"
    }
  }
    
  'test' {
    Write-Header "Testando Hot Reload"
        
    Write-Info "1. Verificando se backend está rodando..."
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -ErrorAction SilentlyContinue
        
    if ($response.StatusCode -eq 200) {
      Write-Success "Backend respondendo!"
    }
    else {
      Write-Warning "Backend não está respondendo. Inicie com: .\docker-helper.ps1 dev"
      exit 1
    }
        
    Write-Info "2. Criando arquivo de teste..."
    $testFile = "backend/src/test-hot-reload.ts"
    "// Teste hot reload - $(Get-Date)" | Out-File -FilePath $testFile -Encoding UTF8
        
    Write-Info "3. Aguardando 3 segundos..."
    Start-Sleep -Seconds 3
        
    Write-Info "4. Verificando logs..."
    $logs = docker-compose logs --tail 20 backend | Out-String
        
    if ($logs -match "File change detected") {
      Write-Success "✅ HOT RELOAD FUNCIONANDO!"
      Write-Info "Logs detectaram mudança no arquivo"
    }
    else {
      Write-Warning "❌ Hot reload NÃO detectou mudança"
      Write-Info "Verifique os volumes no docker-compose.yml"
    }
        
    Write-Info "5. Limpando arquivo de teste..."
    Remove-Item $testFile -ErrorAction SilentlyContinue
        
    Write-Success "Teste concluído!"
  }
}

# Mostrar ajuda se nenhum comando for passado
if ($args.Count -eq 0 -and $Comando -eq 'dev') {
  Write-Host @"

🐳 Docker Helper - ConectCRM
=============================

Uso: .\docker-helper.ps1 <comando> [opções]

Comandos:
  dev       Inicia ambiente de DESENVOLVIMENTO (padrão)
            - Hot reload ativo
            - Volumes montados (backend e frontend)
            - Sobe backend + frontend-dev
            - Logs em tempo real

  prod      Build de PRODUÇÃO (teste local)
            - Multi-stage build
            - Imagem otimizada
            - Sem volumes

  rebuild   Rebuild COMPLETO sem cache
            - Remove node_modules
            - Build do zero
            - Útil quando adicionar dependências

    logs      Ver logs de backend/frontend (use -Service backend|frontend-dev|all)
                        Use -Follow para logs em tempo real

  clean     Limpeza COMPLETA do Docker
            - Remove containers
            - Remove volumes
            - Remove imagens
            ⚠️  CUIDADO: Pede confirmação

  test      Testa se hot reload está funcionando
            - Cria arquivo temporário
            - Verifica logs
            - Remove arquivo

Opções:
  -Follow   Seguir logs em tempo real (Ctrl+C para sair)
  -Verbose  Mostrar comandos Docker executados
    -Service  (logs) Escolher backend, frontend-dev ou all

Exemplos:
  .\docker-helper.ps1 dev
  .\docker-helper.ps1 dev -Follow
  .\docker-helper.ps1 rebuild -Follow
  .\docker-helper.ps1 logs -Follow
  .\docker-helper.ps1 test
  .\docker-helper.ps1 clean

"@
}
