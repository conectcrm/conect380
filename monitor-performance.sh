#!/bin/bash
# 🚀 SCRIPT DE MONITORAMENTO - VS CODE PERFORMANCE
# ================================================

echo "🔍 DIAGNÓSTICO DE PERFORMANCE DO VS CODE"
echo "========================================"
echo ""

# Função para verificar processos
check_vscode_processes() {
    echo "📊 Processos do VS Code ativos:"
    echo "------------------------------"
    if command -v tasklist &> /dev/null; then
        # Windows
        tasklist /FI "IMAGENAME eq Code.exe" /FO TABLE 2>/dev/null || echo "Nenhum processo encontrado"
    elif command -v ps &> /dev/null; then
        # Linux/Mac
        ps aux | grep -i "code" | grep -v grep || echo "Nenhum processo encontrado"
    fi
    echo ""
}

# Função para verificar uso de memória
check_memory_usage() {
    echo "💾 Uso de Memória do Sistema:"
    echo "----------------------------"
    if command -v wmic &> /dev/null; then
        # Windows
        echo "Memória Total:"
        wmic computersystem get TotalPhysicalMemory /format:value | grep -v "^$"
        echo "Memória Disponível:"
        wmic OS get FreePhysicalMemory /format:value | grep -v "^$"
    elif command -v free &> /dev/null; then
        # Linux
        free -h
    elif command -v vm_stat &> /dev/null; then
        # Mac
        vm_stat
    fi
    echo ""
}

# Função para verificar extensões pesadas
check_extensions() {
    echo "🔌 Dicas para Extensões:"
    echo "----------------------"
    echo "✅ Mantenha apenas extensões essenciais ativas"
    echo "✅ Desative extensões não utilizadas frequentemente"
    echo "✅ Evite extensões que fazem análise em tempo real"
    echo "✅ Use Command Palette: 'Extensions: Show Running Extensions'"
    echo ""
}

# Função para dicas de otimização
optimization_tips() {
    echo "⚡ DICAS DE OTIMIZAÇÃO:"
    echo "====================="
    echo "1. 🎯 Abra apenas 1-2 janelas do VS Code"
    echo "2. 📁 Trabalhe com pastas específicas, não raiz do projeto"
    echo "3. 🔄 Reinicie o VS Code a cada 2-3 horas"
    echo "4. 💾 Use 'Developer: Reload Window' quando estiver lento"
    echo "5. 🚫 Feche abas não utilizadas regularmente"
    echo "6. 🔧 Use as configurações otimizadas já aplicadas"
    echo "7. 📊 Monitore o Task Manager/Activity Monitor"
    echo "8. 🧹 Limpe cache: Ctrl+Shift+P > 'Developer: Reload Window'"
    echo ""
}

# Executar diagnóstico
check_vscode_processes
check_memory_usage
check_extensions
optimization_tips

echo "🎉 CONFIGURAÇÕES JÁ APLICADAS:"
echo "============================="
echo "✅ Memória do TypeScript limitada para 1GB"
echo "✅ Recursos pesados do editor desativados"
echo "✅ Indexação e busca otimizadas"
echo "✅ Interface simplificada"
echo "✅ Git e extensões automáticas desativadas"
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Execute o script 'fechar-vscode-extras.bat'"
echo "2. Abra apenas a pasta do projeto atual"
echo "3. Monitore o desempenho regularmente"
echo ""
