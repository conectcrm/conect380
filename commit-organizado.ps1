# ==================================================
# 📦 Script de Commit Organizado - ConectCRM
# ==================================================
# Executa commits organizados por categoria
# Uso: .\commit-organizado.ps1

Write-Host "🚀 ConectCRM - Commit Organizado" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Função para confirmar commit
function Confirm-Commit {
    param($message)
    $response = Read-Host "Commit '$message'? (s/N)"
    return $response -eq 's' -or $response -eq 'S'
}

# Função para fazer commit
function Do-Commit {
    param($files, $message)
    
    Write-Host ""
    Write-Host "📝 Preparando commit..." -ForegroundColor Yellow
    Write-Host "   Mensagem: $message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Arquivos:" -ForegroundColor Gray
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            git add $file
            Write-Host "   ✓ $file" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ $file (não encontrado)" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    if (Confirm-Commit $message) {
        git commit -m $message
        Write-Host "   ✅ Commit realizado!" -ForegroundColor Green
    } else {
        git reset
        Write-Host "   ⏭ Commit pulado" -ForegroundColor Gray
    }
}

# ==================================================
# 1. Configuração do Repositório
# ==================================================
Write-Host "1️⃣  Configuração do Repositório" -ForegroundColor Cyan
$configFiles = @(
    ".gitignore",
    ".gitattributes",
    ".editorconfig",
    "CONTRIBUTING.md",
    "GUIA_COMMIT_PROFISSIONAL.md"
)
Do-Commit $configFiles "chore: configurar repositório profissionalmente

- Atualizar .gitignore para permitir documentação
- Adicionar .gitattributes para normalização de arquivos
- Criar .editorconfig para padronização de código
- Adicionar CONTRIBUTING.md com guias completos
- Criar guia de commit organizado"

# ==================================================
# 2. Documentação Principal
# ==================================================
Write-Host ""
Write-Host "2️⃣  Documentação Principal" -ForegroundColor Cyan
$docsFiles = @(
    "README.md",
    ".github/copilot-instructions.md",
    ".copilot-instructions.md",
    "INDICE_DOCUMENTACAO_IA.md",
    "GUIA_RAPIDO_AGENTE_IA.md",
    "COMANDOS_DIAGNOSTICO_IA.md",
    "QUICK_REFERENCE.md"
)
Do-Commit $docsFiles "docs: adicionar documentação principal do projeto

- Atualizar README com índice completo
- Copilot instructions para padronização
- Guias rápidos para desenvolvimento
- Índice de documentação para IA"

# ==================================================
# 3. Documentação de Features
# ==================================================
Write-Host ""
Write-Host "3️⃣  Documentação de Features (Sprint 1)" -ForegroundColor Cyan
$featureDocs = Get-ChildItem -Path . -Filter "CONSOLIDACAO_*.md" | Select-Object -ExpandProperty Name
$featureDocs += Get-ChildItem -Path . -Filter "IMPLEMENTACAO_*.md" | Select-Object -ExpandProperty Name
$featureDocs += Get-ChildItem -Path . -Filter "SPRINT1_*.md" | Select-Object -ExpandProperty Name
$featureDocs += Get-ChildItem -Path . -Filter "SISTEMA_*_COMPLETO.md" | Select-Object -ExpandProperty Name

if ($featureDocs.Count -gt 0) {
    foreach ($doc in $featureDocs) {
        git add $doc
    }
    
    if (Confirm-Commit "Documentação de Features") {
        git commit -m "docs(features): documentar implementações da Sprint 1

- Consolidação do sistema de atendimento
- Implementação de chat omnichannel
- Sistema de triagem inteligente
- Gestão de equipes e departamentos
- Sistema WhatsApp completo"
        Write-Host "   ✅ Commit realizado!" -ForegroundColor Green
    } else {
        git reset
        Write-Host "   ⏭ Commit pulado" -ForegroundColor Gray
    }
}

# ==================================================
# 4. Guias Operacionais
# ==================================================
Write-Host ""
Write-Host "4️⃣  Guias Operacionais" -ForegroundColor Cyan
$guias = Get-ChildItem -Path . -Filter "GUIA_*.md" | Select-Object -ExpandProperty Name
$guias += Get-ChildItem -Path . -Filter "MANUAL_*.md" | Select-Object -ExpandProperty Name
$guias += Get-ChildItem -Path . -Filter "CHECKLIST_*.md" | Select-Object -ExpandProperty Name

if ($guias.Count -gt 0) {
    foreach ($guia in $guias) {
        git add $guia
    }
    
    if (Confirm-Commit "Guias Operacionais") {
        git commit -m "docs(guides): adicionar guias operacionais

- Guias de configuração (WhatsApp, Deploy, SSL)
- Manuais de uso (Construtor Visual, Testes)
- Checklists de validação
- Referências rápidas"
        Write-Host "   ✅ Commit realizado!" -ForegroundColor Green
    } else {
        git reset
        Write-Host "   ⏭ Commit pulado" -ForegroundColor Gray
    }
}

# ==================================================
# 5. Backend - Migrations
# ==================================================
Write-Host ""
Write-Host "5️⃣  Backend - Migrations" -ForegroundColor Cyan
if (Test-Path "backend/src/migrations") {
    Do-Commit @("backend/src/migrations/") "feat(database): adicionar migrations do sistema

Migrations incluídas:
- CreateDepartamentos
- CreateTriagemLogsTable
- EnableRowLevelSecurity
- AddContatoFotoToAtendimentoTickets
- CreateTriagemBotNucleosTables
- CreateEquipesAtribuicoesTables
- AddPrimeiraSenhaToUsersSimple
- CreateNotasClienteClean
- CreateDemandasClean
- AddHistoricoVersoes"
}

# ==================================================
# 6. Backend - Módulo Triagem
# ==================================================
Write-Host ""
Write-Host "6️⃣  Backend - Módulo Triagem" -ForegroundColor Cyan
if (Test-Path "backend/src/modules/triagem") {
    Do-Commit @("backend/src/modules/triagem/") "feat(triagem): implementar sistema de triagem inteligente

- Entities: Equipe, Atribuição, Núcleo, Fluxo
- Services: Triagem dinâmica, Bot WhatsApp
- Controllers: Gestão de equipes e departamentos
- DTOs: Validação completa com class-validator

Features:
- Triagem automática por IA
- Distribuição inteligente de atendimentos
- Gestão visual de fluxos
- Integração WhatsApp Business API"
}

# ==================================================
# 7. Backend - Módulo Atendimento
# ==================================================
Write-Host ""
Write-Host "7️⃣  Backend - Módulo Atendimento" -ForegroundColor Cyan
$atendimentoFiles = @(
    "backend/src/modules/atendimento/controllers/",
    "backend/src/modules/atendimento/services/",
    "backend/src/modules/atendimento/entities/",
    "backend/src/modules/atendimento/dto/",
    "backend/src/modules/atendimento/gateways/"
)

$existsAtendimento = $false
foreach ($file in $atendimentoFiles) {
    if (Test-Path $file) {
        $existsAtendimento = $true
        break
    }
}

if ($existsAtendimento) {
    Do-Commit $atendimentoFiles "feat(atendimento): implementar sistema omnichannel

- Controllers: Tickets, Mensagens, Atendentes
- Services: WhatsApp sender/webhook, Contexto cliente
- Entities: Ticket, Mensagem, Nota, Demanda
- Gateway: WebSocket para tempo real

Features:
- Chat omnichannel em tempo real
- Integração WhatsApp com IA
- Gestão de tickets e histórico
- Status online/offline de atendentes
- Player de áudio para mensagens de voz"
}

# ==================================================
# Continuar...
# ==================================================
Write-Host ""
Write-Host "✅ Commits principais concluídos!" -ForegroundColor Green
Write-Host ""
Write-Host "Para continuar com frontend e deploy, execute os comandos do GUIA_COMMIT_PROFISSIONAL.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Status atual:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Revisar commits: git log --oneline -10" -ForegroundColor Gray
Write-Host "   2. Continuar frontend: ver GUIA_COMMIT_PROFISSIONAL.md" -ForegroundColor Gray
Write-Host "   3. Push: git push origin consolidacao-atendimento" -ForegroundColor Gray
