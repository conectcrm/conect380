#!/usr/bin/env pwsh
# ============================================
# Helper: Abrir .env.production para edição
# ============================================

param(
    [switch]$Help
)

if ($Help) {
    Write-Host "`n📝 HELPER - Editar .env.production`n" -ForegroundColor Cyan
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\editar-env-producao.ps1       # Abre no VSCode (padrão)"
    Write-Host "  .\editar-env-producao.ps1 -Help # Esta ajuda`n"
    Write-Host "Editores disponíveis:" -ForegroundColor Yellow
    Write-Host "  1. VSCode (code)"
    Write-Host "  2. Notepad (notepad)"
    Write-Host "  3. PowerShell ISE (ise)`n"
    exit 0
}

$envFile = "backend\.env.production"

Write-Host "`n📝 Abrindo $envFile para edição...`n" -ForegroundColor Cyan

# Verificar se arquivo existe
if (-not (Test-Path $envFile)) {
    Write-Host "❌ ERRO: Arquivo $envFile não encontrado!" -ForegroundColor Red
    Write-Host "   Execute primeiro o processo de preparação.`n" -ForegroundColor Yellow
    exit 1
}

# Tentar abrir com VSCode
if (Get-Command code -ErrorAction SilentlyContinue) {
    Write-Host "✅ Abrindo no VSCode..." -ForegroundColor Green
    code $envFile
    
    Write-Host "`n📋 VALORES PARA PREENCHER:`n" -ForegroundColor Yellow
    Write-Host "  🔴 CRÍTICO:" -ForegroundColor Red
    Write-Host "     • DATABASE_HOST (IP do banco de produção)" -ForegroundColor White
    Write-Host "     • DATABASE_PASSWORD (senha forte)" -ForegroundColor White
    Write-Host "`n  🟡 IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "     • SMTP_USER e SMTP_PASS (email)" -ForegroundColor White
    Write-Host "     • GMAIL_USER e GMAIL_PASSWORD (mesmo email)" -ForegroundColor White
    Write-Host "     • WHATSAPP_ACCESS_TOKEN" -ForegroundColor White
    Write-Host "     • WHATSAPP_PHONE_NUMBER_ID" -ForegroundColor White
    Write-Host "`n  🟢 OPCIONAL:" -ForegroundColor Green
    Write-Host "     • OPENAI_API_KEY (se usar GPT)" -ForegroundColor White
    Write-Host "     • ANTHROPIC_API_KEY (se usar Claude)" -ForegroundColor White
    
    Write-Host "`n📖 Guia completo: PREENCHER_ENV_PRODUCAO.md" -ForegroundColor Cyan
    Write-Host "🔍 Após editar: .\validar-config-producao.ps1`n" -ForegroundColor Green
    
} elseif (Get-Command notepad -ErrorAction SilentlyContinue) {
    Write-Host "✅ Abrindo no Notepad..." -ForegroundColor Green
    notepad $envFile
} else {
    Write-Host "⚠️  Editor não encontrado. Abrindo com editor padrão..." -ForegroundColor Yellow
    Start-Process $envFile
}

Write-Host "`n🔐 LEMBRE-SE: NUNCA commite este arquivo no git!`n" -ForegroundColor Red
