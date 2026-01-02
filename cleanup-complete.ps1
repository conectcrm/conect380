# Script de Limpeza - ConectCRM
param([switch]$Backup, [switch]$DryRun)

$ErrorActionPreference = "Stop"
$removidos = 0
$erros = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  LIMPEZA COMPLETA - ConectCRM" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "MODO DRY-RUN - Simulacao apenas`n" -ForegroundColor Yellow
} elseif ($Backup) {
    Write-Host "MODO BACKUP - Arquivos serao movidos`n" -ForegroundColor Green
    $backupDir = ".\backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "Pasta de backup: $backupDir`n" -ForegroundColor Cyan
}

# Lista de arquivos
$arquivos = @(
    "frontend-web\src\pages\UploadDemoPage.tsx",
    "frontend-web\src\pages\TestePortalPage.tsx",
    "frontend-web\src\pages\GoogleEventDemo.tsx",
    "frontend-web\src\components\DebugContratos.tsx",
    "frontend-web\src\components\LoginDebug.tsx",
    "frontend-web\src\features\atendimento\omnichannel\mockData.ts",
    "frontend-web\src\features\atendimento\omnichannel\contexts\SocketContext.tsx",
    "frontend-web\src\features\atendimento\omnichannel\contexts\ToastContext.tsx",
    "frontend-web\src\pages\FunilVendas.jsx",
    "frontend-web\src\pages\FunilVendasAPI.jsx"
)

Write-Host "Verificando $($arquivos.Count) arquivos...`n" -ForegroundColor Cyan

foreach ($arquivo in $arquivos) {
    $fullPath = Join-Path $PSScriptRoot $arquivo
    
    if (Test-Path $fullPath) {
        Write-Host "Encontrado: $arquivo" -ForegroundColor White
        
        if ($DryRun) {
            Write-Host "  [DRY-RUN] Seria removido`n" -ForegroundColor Yellow
            $removidos++
        } elseif ($Backup) {
            try {
                $backupFilePath = Join-Path $backupDir $arquivo
                $backupFileDir = Split-Path $backupFilePath -Parent
                
                if (-not (Test-Path $backupFileDir)) {
                    New-Item -ItemType Directory -Path $backupFileDir -Force | Out-Null
                }
                
                Move-Item -Path $fullPath -Destination $backupFilePath -Force
                Write-Host "  Movido para backup`n" -ForegroundColor Green
                $removidos++
            } catch {
                Write-Host "  ERRO: $_`n" -ForegroundColor Red
                $erros++
            }
        } else {
            try {
                Remove-Item -Path $fullPath -Force
                Write-Host "  Removido`n" -ForegroundColor Green
                $removidos++
            } catch {
                Write-Host "  ERRO: $_`n" -ForegroundColor Red
                $erros++
            }
        }
    } else {
        Write-Host "Nao encontrado: $arquivo`n" -ForegroundColor Gray
    }
}

# Resumo
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESUMO" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "Arquivos que seriam removidos: $removidos" -ForegroundColor Yellow
} else {
    Write-Host "Arquivos processados: $removidos" -ForegroundColor Green
    Write-Host "Erros: $erros" -ForegroundColor $(if ($erros -eq 0) { "Green" } else { "Red" })
    
    if ($Backup -and $removidos -gt 0) {
        Write-Host "`nBackup salvo em: $backupDir" -ForegroundColor Cyan
    }
    
    if ($removidos -gt 0) {
        Write-Host "`nLimpeza concluida com sucesso!" -ForegroundColor Green
        Write-Host "Recomendado: Reiniciar o frontend (npm start)" -ForegroundColor Gray
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
exit 0
