# 🔍 Validação de Ambiente - ConectCRM
# Verifica se todas as dependências e configurações estão corretas

param(
    [switch]$Fix,        # Tentar corrigir problemas automaticamente
    [switch]$Verbose,    # Modo verbose
    [switch]$Json        # Output em JSON
)

# Cores
$ColorSuccess = "Green"
$ColorWarning = "Yellow"
$ColorError = "Red"
$ColorInfo = "Cyan"

$results = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Checks = @{}
    Issues = @()
    CanDevelop = $true
}

if (-not $Json) {
    Clear-Host
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
    Write-Host "  🔍 VALIDAÇÃO DE AMBIENTE - ConectCRM" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
    Write-Host "  📅 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    Write-Host ""
}

# ========================================
# 1. NODE.JS
# ========================================
if (-not $Json) { Write-Host "  📦 NODE.JS" -ForegroundColor Yellow }

try {
    $nodeVersion = node --version 2>&1
    $npmVersion = npm --version 2>&1
    
    if ($nodeVersion -match "v(\d+)\.") {
        $nodeMajor = [int]$Matches[1]
        
        $results.Checks.Node = @{
            Installed = $true
            Version = $nodeVersion.ToString().Trim()
            NpmVersion = $npmVersion.ToString().Trim()
            Valid = $nodeMajor -ge 18
        }
        
        if ($nodeMajor -ge 18) {
            if (-not $Json) {
                Write-Host "     ✅ Node.js: $nodeVersion" -ForegroundColor $ColorSuccess
                Write-Host "     ✅ npm: $npmVersion" -ForegroundColor $ColorSuccess
            }
        } else {
            $results.CanDevelop = $false
            $results.Issues += "Node.js versão $nodeVersion incompatível (mínimo: v18)"
            
            if (-not $Json) {
                Write-Host "     ❌ Node.js: $nodeVersion (mínimo: v18)" -ForegroundColor $ColorError
                Write-Host "     💡 Solução: https://nodejs.org/" -ForegroundColor $ColorInfo
            }
        }
    }
} catch {
    $results.CanDevelop = $false
    $results.Checks.Node = @{ Installed = $false }
    $results.Issues += "Node.js não instalado"
    
    if (-not $Json) {
        Write-Host "     ❌ Node.js não instalado" -ForegroundColor $ColorError
        Write-Host "     💡 Solução: https://nodejs.org/" -ForegroundColor $ColorInfo
    }
}

if (-not $Json) { Write-Host "" }

# ========================================
# 2. DOCKER
# ========================================
if (-not $Json) { Write-Host "  🐳 DOCKER" -ForegroundColor Yellow }

try {
    $dockerVersion = docker --version 2>&1
    docker ps 2>&1 | Out-Null
    $dockerRunning = $LASTEXITCODE -eq 0
    
    $results.Checks.Docker = @{
        Installed = $true
        Version = $dockerVersion.ToString().Trim()
        Running = $dockerRunning
    }
    
    if ($dockerRunning) {
        if (-not $Json) {
            Write-Host "     ✅ Docker instalado: $dockerVersion" -ForegroundColor $ColorSuccess
            Write-Host "     ✅ Docker rodando" -ForegroundColor $ColorSuccess
        }
    } else {
        $results.CanDevelop = $false
        $results.Issues += "Docker não está rodando"
        
        if (-not $Json) {
            Write-Host "     ⚠️  Docker instalado mas não está rodando" -ForegroundColor $ColorWarning
            Write-Host "     💡 Solução: Iniciar Docker Desktop" -ForegroundColor $ColorInfo
        }
        
        if ($Fix) {
            if (-not $Json) { Write-Host "     🔧 Tentando iniciar Docker Desktop..." -ForegroundColor $ColorInfo }
            Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 10
        }
    }
} catch {
    $results.CanDevelop = $false
    $results.Checks.Docker = @{ Installed = $false }
    $results.Issues += "Docker não instalado"
    
    if (-not $Json) {
        Write-Host "     ❌ Docker não instalado" -ForegroundColor $ColorError
        Write-Host "     💡 Solução: https://www.docker.com/products/docker-desktop" -ForegroundColor $ColorInfo
    }
}

if (-not $Json) { Write-Host "" }

# ========================================
# 3. GIT
# ========================================
if (-not $Json) { Write-Host "  📚 GIT" -ForegroundColor Yellow }

try {
    $gitVersion = git --version 2>&1
    $gitBranch = git branch --show-current 2>&1
    
    $results.Checks.Git = @{
        Installed = $true
        Version = $gitVersion.ToString().Trim()
        Branch = $gitBranch.ToString().Trim()
    }
    
    if (-not $Json) {
        Write-Host "     ✅ Git: $gitVersion" -ForegroundColor $ColorSuccess
        Write-Host "     ✅ Branch atual: $gitBranch" -ForegroundColor $ColorSuccess
    }
} catch {
    $results.Checks.Git = @{ Installed = $false }
    $results.Issues += "Git não instalado"
    
    if (-not $Json) {
        Write-Host "     ❌ Git não instalado" -ForegroundColor $ColorError
        Write-Host "     💡 Solução: https://git-scm.com/downloads" -ForegroundColor $ColorInfo
    }
}

if (-not $Json) { Write-Host "" }

# ========================================
# 4. DEPENDÊNCIAS DO PROJETO
# ========================================
if (-not $Json) { Write-Host "  📦 DEPENDÊNCIAS DO PROJETO" -ForegroundColor Yellow }

# Backend
$backendNodeModules = Test-Path "backend\node_modules"
$results.Checks.BackendDeps = @{ Installed = $backendNodeModules }

if ($backendNodeModules) {
    if (-not $Json) {
        Write-Host "     ✅ Backend node_modules instalado" -ForegroundColor $ColorSuccess
    }
} else {
    $results.Issues += "Backend node_modules não instalado"
    
    if (-not $Json) {
        Write-Host "     ❌ Backend node_modules não instalado" -ForegroundColor $ColorError
        Write-Host "     💡 Solução: cd backend && npm install" -ForegroundColor $ColorInfo
    }
    
    if ($Fix) {
        if (-not $Json) { Write-Host "     🔧 Instalando dependências do backend..." -ForegroundColor $ColorInfo }
        Push-Location backend
        npm install 2>&1 | Out-Null
        Pop-Location
    }
}

# Frontend
$frontendNodeModules = Test-Path "frontend-web\node_modules"
$results.Checks.FrontendDeps = @{ Installed = $frontendNodeModules }

if ($frontendNodeModules) {
    if (-not $Json) {
        Write-Host "     ✅ Frontend node_modules instalado" -ForegroundColor $ColorSuccess
    }
} else {
    $results.Issues += "Frontend node_modules não instalado"
    
    if (-not $Json) {
        Write-Host "     ❌ Frontend node_modules não instalado" -ForegroundColor $ColorError
        Write-Host "     💡 Solução: cd frontend-web && npm install" -ForegroundColor $ColorInfo
    }
    
    if ($Fix) {
        if (-not $Json) { Write-Host "     🔧 Instalando dependências do frontend..." -ForegroundColor $ColorInfo }
        Push-Location frontend-web
        npm install 2>&1 | Out-Null
        Pop-Location
    }
}

if (-not $Json) { Write-Host "" }

# ========================================
# 5. ARQUIVOS DE CONFIGURAÇÃO
# ========================================
if (-not $Json) { Write-Host "  ⚙️  ARQUIVOS DE CONFIGURAÇÃO" -ForegroundColor Yellow }

$backendEnv = Test-Path "backend\.env"
$dockerCompose = Test-Path "docker-compose.yml"

$results.Checks.ConfigFiles = @{
    BackendEnv = $backendEnv
    DockerCompose = $dockerCompose
}

if ($backendEnv) {
    if (-not $Json) {
        Write-Host "     ✅ backend\.env existe" -ForegroundColor $ColorSuccess
    }
} else {
    $results.Issues += "backend\.env não encontrado"
    
    if (-not $Json) {
        Write-Host "     ❌ backend\.env não encontrado" -ForegroundColor $ColorError
        Write-Host "     💡 Solução: Copiar .env.example para .env" -ForegroundColor $ColorInfo
    }
    
    if ($Fix -and (Test-Path "backend\.env.example")) {
        if (-not $Json) { Write-Host "     🔧 Criando .env a partir de .env.example..." -ForegroundColor $ColorInfo }
        Copy-Item "backend\.env.example" "backend\.env"
    }
}

if ($dockerCompose) {
    if (-not $Json) {
        Write-Host "     ✅ docker-compose.yml existe" -ForegroundColor $ColorSuccess
    }
} else {
    $results.Issues += "docker-compose.yml não encontrado"
    
    if (-not $Json) {
        Write-Host "     ❌ docker-compose.yml não encontrado" -ForegroundColor $ColorError
    }
}

if (-not $Json) { Write-Host "" }

# ========================================
# 6. PORTAS DISPONÍVEIS
# ========================================
if (-not $Json) { Write-Host "  🔌 PORTAS" -ForegroundColor Yellow }

$requiredPorts = @(3000, 3001, 5432)
$portsInUse = @()

foreach ($port in $requiredPorts) {
    $portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    
    if ($portInUse) {
        $portsInUse += $port
        
        if (-not $Json) {
            Write-Host "     ⚠️  Porta $port em uso" -ForegroundColor $ColorWarning
        }
    } else {
        if (-not $Json) {
            Write-Host "     ✅ Porta $port disponível" -ForegroundColor $ColorSuccess
        }
    }
}

$results.Checks.Ports = @{
    Required = $requiredPorts
    InUse = $portsInUse
    AllAvailable = $portsInUse.Count -eq 0
}

if (-not $Json) { Write-Host "" }

# ========================================
# 7. ESPAÇO EM DISCO
# ========================================
if (-not $Json) { Write-Host "  💾 ESPAÇO EM DISCO" -ForegroundColor Yellow }

$drive = Get-PSDrive C
$freeGB = [math]::Round($drive.Free / 1GB, 2)
$totalGB = [math]::Round(($drive.Used + $drive.Free) / 1GB, 2)
$percentUsed = [math]::Round(($drive.Used / ($drive.Used + $drive.Free)) * 100, 2)

$results.Checks.Disk = @{
    FreeGB = $freeGB
    TotalGB = $totalGB
    PercentUsed = $percentUsed
    Sufficient = $freeGB -gt 5
}

if ($freeGB -gt 10) {
    if (-not $Json) {
        Write-Host "     ✅ Espaço disponível: $freeGB GB / $totalGB GB" -ForegroundColor $ColorSuccess
    }
} elseif ($freeGB -gt 5) {
    $results.Issues += "Pouco espaço em disco ($freeGB GB)"
    
    if (-not $Json) {
        Write-Host "     ⚠️  Espaço disponível: $freeGB GB / $totalGB GB" -ForegroundColor $ColorWarning
        Write-Host "     💡 Recomendado: Pelo menos 10 GB livres" -ForegroundColor $ColorInfo
    }
} else {
    $results.CanDevelop = $false
    $results.Issues += "Espaço em disco crítico ($freeGB GB)"
    
    if (-not $Json) {
        Write-Host "     ❌ Espaço crítico: $freeGB GB / $totalGB GB" -ForegroundColor $ColorError
        Write-Host "     💡 Urgente: Liberar espaço em disco" -ForegroundColor $ColorInfo
    }
}

if (-not $Json) { Write-Host "" }

# ========================================
# 8. VARIÁVEIS DE AMBIENTE
# ========================================
if (-not $Json) { Write-Host "  🔐 VARIÁVEIS DE AMBIENTE" -ForegroundColor Yellow }

$envVarsOk = $true

if (Test-Path "backend\.env") {
    $envContent = Get-Content "backend\.env" -Raw
    
    $requiredVars = @(
        "DATABASE_HOST",
        "DATABASE_PORT",
        "DATABASE_USERNAME",
        "DATABASE_PASSWORD",
        "DATABASE_NAME",
        "JWT_SECRET"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var\s*=\s*.+") {
            $missingVars += $var
            $envVarsOk = $false
        }
    }
    
    $results.Checks.EnvVars = @{
        FileExists = $true
        AllPresent = $missingVars.Count -eq 0
        Missing = $missingVars
    }
    
    if ($missingVars.Count -eq 0) {
        if (-not $Json) {
            Write-Host "     ✅ Todas as variáveis obrigatórias presentes" -ForegroundColor $ColorSuccess
        }
    } else {
        $results.Issues += "Variáveis de ambiente faltando: $($missingVars -join ', ')"
        
        if (-not $Json) {
            Write-Host "     ❌ Variáveis faltando: $($missingVars -join ', ')" -ForegroundColor $ColorError
            Write-Host "     💡 Solução: Editar backend\.env" -ForegroundColor $ColorInfo
        }
    }
} else {
    $results.Checks.EnvVars = @{ FileExists = $false }
}

if (-not $Json) { Write-Host "" }

# ========================================
# RESUMO FINAL
# ========================================
if (-not $Json) {
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
    
    if ($results.CanDevelop -and $results.Issues.Count -eq 0) {
        Write-Host "  ✅ AMBIENTE PRONTO PARA DESENVOLVIMENTO" -ForegroundColor $ColorSuccess
    } elseif ($results.CanDevelop -and $results.Issues.Count -gt 0) {
        Write-Host "  ⚠️  AMBIENTE OK COM AVISOS" -ForegroundColor $ColorWarning
        Write-Host ""
        Write-Host "  Avisos ($($results.Issues.Count)):" -ForegroundColor $ColorWarning
        foreach ($issue in $results.Issues) {
            Write-Host "     • $issue" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ AMBIENTE NÃO ESTÁ PRONTO" -ForegroundColor $ColorError
        Write-Host ""
        Write-Host "  Problemas ($($results.Issues.Count)):" -ForegroundColor $ColorError
        foreach ($issue in $results.Issues) {
            Write-Host "     • $issue" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "  💡 Tente executar com -Fix para correção automática:" -ForegroundColor $ColorInfo
        Write-Host "     .\scripts\validate-environment.ps1 -Fix" -ForegroundColor Gray
    }
    
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor White
    Write-Host ""
}

# Output JSON se solicitado
if ($Json) {
    $results | ConvertTo-Json -Depth 5
}

# Código de saída
if ($results.CanDevelop) {
    exit 0
} else {
    exit 1
}

