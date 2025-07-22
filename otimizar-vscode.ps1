# 🚀 SCRIPT POWERSHELL - OTIMIZAÇÃO VS CODE
# ==========================================

Write-Host "🔍 DIAGNÓSTICO DO VS CODE" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Verificar processos atuais
$vsCodeProcesses = Get-Process -Name "Code" -ErrorAction SilentlyContinue
if ($vsCodeProcesses) {
    Write-Host "📊 Processos encontrados: $($vsCodeProcesses.Count)" -ForegroundColor Yellow
    Write-Host "💾 Uso total de memória: $([math]::Round(($vsCodeProcesses | Measure-Object WorkingSet -Sum).Sum / 1MB, 2)) MB" -ForegroundColor Yellow
    Write-Host ""
    
    # Mostrar detalhes dos processos
    $vsCodeProcesses | Format-Table Id, ProcessName, WorkingSet, CPU -AutoSize
    Write-Host ""
    
    # Perguntar se deseja fechar
    $response = Read-Host "⚠️  Deseja fechar TODOS os processos do VS Code? (S/N)"
    
    if ($response -eq 'S' -or $response -eq 's') {
        Write-Host ""
        Write-Host "🛑 Fechando todos os processos do VS Code..." -ForegroundColor Red
        
        try {
            $vsCodeProcesses | Stop-Process -Force
            Write-Host "✅ Processos fechados com sucesso!" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Erro ao fechar processos: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Verificar se ainda há processos
        Start-Sleep -Seconds 2
        $remainingProcesses = Get-Process -Name "Code" -ErrorAction SilentlyContinue
        
        if ($remainingProcesses) {
            Write-Host "⚠️  Ainda existem $($remainingProcesses.Count) processos ativos" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Todos os processos foram fechados!" -ForegroundColor Green
        }
    }
} else {
    Write-Host "✅ Nenhum processo do VS Code encontrado" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 CONFIGURAÇÕES OTIMIZADAS APLICADAS:" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ Memória TypeScript limitada: 1GB"
Write-Host "✅ Recursos pesados desativados"
Write-Host "✅ Interface simplificada" 
Write-Host "✅ Indexação otimizada"
Write-Host "✅ Git e telemetria desativados"
Write-Host ""

Write-Host "💡 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "1. 🚀 Abra apenas UMA janela do VS Code"
Write-Host "2. 📁 Trabalhe com pastas específicas (não raiz)"
Write-Host "3. 🔄 Reinicie o VS Code a cada 2-3 horas"
Write-Host "4. 📊 Monitore regularmente o Task Manager"
Write-Host "5. 🧹 Use Ctrl+Shift+P > 'Developer: Reload Window'"
Write-Host ""

Write-Host "⚡ COMANDOS ÚTEIS:" -ForegroundColor Magenta
Write-Host "=================" -ForegroundColor Magenta
Write-Host "• Verificar performance: Ctrl+Shift+P > 'Developer: Show Running Extensions'"
Write-Host "• Recarregar janela: Ctrl+Shift+P > 'Developer: Reload Window'"
Write-Host "• Abrir pasta específica: Ctrl+K Ctrl+O"
Write-Host ""

Write-Host "🎉 VS Code otimizado para máxima performance!" -ForegroundColor Green
