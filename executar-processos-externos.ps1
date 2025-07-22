# 🚀 EXECUTOR DE PROCESSOS EXTERNOS
# Roda TypeScript, ESLint, Frontend e Backend fora do VS Code

param(
    [string]$Modo = "menu"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 PROCESSOS EXTERNOS - FENIX CRM" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location "c:\Projetos\fenixcrm"

function Start-Frontend {
    Write-Host "🌐 Iniciando Frontend React..." -ForegroundColor Yellow
    Set-Location "frontend-web"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
    Set-Location ".."
}

function Start-Backend {
    Write-Host "⚙️ Iniciando Backend NestJS..." -ForegroundColor Yellow  
    Set-Location "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run start:dev" -WindowStyle Normal
    Set-Location ".."
}

function Start-TypeScriptWatch {
    Write-Host "📝 Iniciando TypeScript Watch..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx tsc --watch --noEmit" -WindowStyle Normal
}

function Start-ESLintWatch {
    Write-Host "🔍 Iniciando ESLint Watch..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx eslint . --ext .ts,.tsx,.js,.jsx --watch" -WindowStyle Normal
}

function Show-Menu {
    Write-Host "🔧 ESCOLHA OS PROCESSOS PARA EXECUTAR:" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "[1] 🌐 Frontend React (porta 3000)" 
    Write-Host "[2] ⚙️  Backend NestJS (porta 3001)"
    Write-Host "[3] 🔄 Frontend + Backend"
    Write-Host "[4] 📝 TypeScript Compiler Watch" 
    Write-Host "[5] 🔍 ESLint Watch"
    Write-Host "[6] 🚀 TODOS os processos"
    Write-Host "[Q] ❌ Sair"
    Write-Host ""
    
    $choice = Read-Host "Escolha uma opção (1-6 ou Q)"
    
    switch ($choice.ToUpper()) {
        "1" { Start-Frontend }
        "2" { Start-Backend }
        "3" { 
            Start-Frontend
            Start-Backend 
        }
        "4" { Start-TypeScriptWatch }
        "5" { Start-ESLintWatch }
        "6" { 
            Start-Frontend
            Start-Backend
            Start-TypeScriptWatch
            Start-ESLintWatch
        }
        "Q" { 
            Write-Host "👋 Saindo..." -ForegroundColor Green
            return 
        }
        default { 
            Write-Host "⚠️ Opção inválida!" -ForegroundColor Red
            Show-Menu 
        }
    }
    
    Write-Host ""
    Write-Host "✅ PROCESSOS INICIADOS!" -ForegroundColor Green
    Write-Host "=======================" -ForegroundColor Green
    Write-Host "• VS Code agora funciona apenas como editor"
    Write-Host "• Processos pesados rodando externamente"
    Write-Host "• Frontend: http://localhost:3000"
    Write-Host "• Backend: http://localhost:3001"  
    Write-Host "• Use Ctrl+C nas janelas para parar"
    Write-Host ""
}

# Execução baseada no parâmetro
switch ($Modo.ToLower()) {
    "frontend" { Start-Frontend }
    "backend" { Start-Backend }
    "ambos" { 
        Start-Frontend
        Start-Backend 
    }
    "tsc" { Start-TypeScriptWatch }
    "eslint" { Start-ESLintWatch }
    "todos" { 
        Start-Frontend
        Start-Backend
        Start-TypeScriptWatch
        Start-ESLintWatch
    }
    default { Show-Menu }
}

Write-Host "🎯 Processos externos configurados!" -ForegroundColor Green
