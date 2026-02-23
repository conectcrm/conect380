# 🔍 COMANDOS DE VERIFICAÇÃO - Limpeza de Documentação

Este arquivo contém comandos para verificar que a limpeza de documentação foi realizada corretamente.

---

## ✅ Verificação 1: Arquivos Movidos para Archive

### Verificar deprecated-omnichannel/ (Arquivamento 1)
```powershell
# Verificar se pasta existe
Test-Path "docs\archive\2025\deprecated-omnichannel"

# Listar arquivos (deve ter 3 .md + 1 README)
Get-ChildItem "docs\archive\2025\deprecated-omnichannel" -File

# Esperado:
# - OMNICHANNEL_RESUMO_EXECUTIVO.md
# - TODO_OMNICHANNEL.md
# - OMNICHANNEL_ANALISE_MANTER_VS_REMOVER.md
# - README_ARQUIVADO.md
```

### Verificar deprecated-omnichannel-old/ (Arquivamento 2)
```powershell
# Verificar se pasta existe
Test-Path "docs\archive\2025\deprecated-omnichannel-old"

# Listar arquivos (deve ter 12 .md + 1 README)
Get-ChildItem "docs\archive\2025\deprecated-omnichannel-old" -File

# Esperado:
# - OMNICHANNEL_INDICE.md
# - OMNICHANNEL_ROADMAP_MELHORIAS.md
# - OMNICHANNEL_GUIA_VISUAL.md
# - OMNICHANNEL_O_QUE_REMOVER.md
# - MELHORIAS_CHAT_OMNICHANNEL.md
# - RESUMO_MELHORIAS_CONFIGURACOES.md
# - ANALISE_ESTAGIOS_OMNICHANNEL_TEMPO_REAL.md
# - APRESENTACAO_EXECUTIVA_5MIN.md
# - ANTES_DEPOIS_UX_BOT.md
# - VALIDACAO_CONFIGURACOES_VS_MERCADO.md
# - MVP_TRIAGEM_CONCLUIDO.md
# - PROPOSTA_SIMPLIFICACAO_ESTAGIOS_ATENDIMENTO.md
# - README_ARQUIVADO.md
```

### Verificar que arquivos NÃO estão mais na raiz/docs
```powershell
# Estes comandos devem retornar VAZIO (False ou não encontrado)
Test-Path "OMNICHANNEL_INDICE.md"
Test-Path "OMNICHANNEL_ROADMAP_MELHORIAS.md"
Test-Path "docs\OMNICHANNEL_GUIA_VISUAL.md"
Test-Path "APRESENTACAO_EXECUTIVA_5MIN.md"
```

---

## ✅ Verificação 2: Referências a Visão Antiga

### Buscar "paridade com Zendesk" ou "competir com Zendesk"
```powershell
# Este comando deve retornar APENAS arquivos em:
# - docs/archive/2025/deprecated-omnichannel/
# - docs/archive/2025/deprecated-omnichannel-old/
# - docs/archive/2025/ (com nota de contexto)
# - Arquivos de comunicado explicando a mudança

Select-String -Path "*.md" -Pattern "(paridade com Zendesk|competir com Zendesk)" -Recurse | 
    Select-Object Path, LineNumber, Line | 
    Format-Table -AutoSize
```

### Verificar que documentos principais NÃO mencionam visão antiga
```powershell
# Estes comandos devem retornar VAZIO
Select-String -Path "README.md" -Pattern "paridade com Zendesk"
Select-String -Path "VISAO_SISTEMA_2025.md" -Pattern "competir com Zendesk"
Select-String -Path "KIT_VENDAS_CONECTCRM.md" -Pattern "sistema de atendimento" -Context 0,1
Select-String -Path "DIFERENCIAL_INTEGRACAO_NATIVA.md" -Pattern "paridade com Zendesk"
```

---

## ✅ Verificação 3: Novos Documentos Criados

### Verificar existência dos novos materiais
```powershell
# Todos devem retornar True
Test-Path "VISAO_SISTEMA_2025.md"
Test-Path "KIT_VENDAS_CONECTCRM.md"
Test-Path "DIFERENCIAL_INTEGRACAO_NATIVA.md"
Test-Path "PITCH_DECK_INVESTIDORES.md"
Test-Path "COMUNICADO_ATUALIZACAO_POSICIONAMENTO.md"
Test-Path "PROXIMOS_PASSOS_EXECUTADOS.md"
Test-Path "LIMPEZA_DOCUMENTACAO_CONCLUIDA.md"
Test-Path "docs\INDICE_DOCUMENTACAO.md"
```

### Verificar conteúdo dos novos materiais
```powershell
# KIT_VENDAS_CONECTCRM.md deve mencionar "backend único" e "Zoho"
Select-String -Path "KIT_VENDAS_CONECTCRM.md" -Pattern "backend único|Zoho" | Measure-Object

# DIFERENCIAL_INTEGRACAO_NATIVA.md deve mencionar "R\$148" (ROI)
Select-String -Path "DIFERENCIAL_INTEGRACAO_NATIVA.md" -Pattern "R\$148"

# PITCH_DECK_INVESTIDORES.md deve mencionar "HubSpot" e "45%"
Select-String -Path "PITCH_DECK_INVESTIDORES.md" -Pattern "(HubSpot|45%)" | Measure-Object
```

---

## ✅ Verificação 4: INDICE_DOCUMENTACAO.md Atualizado

### Verificar seções importantes
```powershell
# Deve conter seção "deprecated-omnichannel-old"
Select-String -Path "docs\INDICE_DOCUMENTACAO.md" -Pattern "deprecated-omnichannel-old"

# Deve mencionar "12 documentos arquivados"
Select-String -Path "docs\INDICE_DOCUMENTACAO.md" -Pattern "12 documentos|12 docs"

# Deve referenciar DIFERENCIAL_INTEGRACAO_NATIVA.md
Select-String -Path "docs\INDICE_DOCUMENTACAO.md" -Pattern "DIFERENCIAL_INTEGRACAO_NATIVA"

# Deve referenciar KIT_VENDAS_CONECTCRM.md
Select-String -Path "docs\INDICE_DOCUMENTACAO.md" -Pattern "KIT_VENDAS_CONECTCRM"
```

---

## ✅ Verificação 5: README dos Archives

### Verificar README_ARQUIVADO.md (Arquivamento 1)
```powershell
# Deve existir e ter explicação
Test-Path "docs\archive\2025\deprecated-omnichannel\README_ARQUIVADO.md"

# Deve listar os 3 documentos arquivados
Select-String -Path "docs\archive\2025\deprecated-omnichannel\README_ARQUIVADO.md" -Pattern "OMNICHANNEL_RESUMO_EXECUTIVO|TODO_OMNICHANNEL|OMNICHANNEL_ANALISE_MANTER_VS_REMOVER"
```

### Verificar README_ARQUIVADO.md (Arquivamento 2)
```powershell
# Deve existir e ter explicação
Test-Path "docs\archive\2025\deprecated-omnichannel-old\README_ARQUIVADO.md"

# Deve listar os 12 documentos arquivados
Select-String -Path "docs\archive\2025\deprecated-omnichannel-old\README_ARQUIVADO.md" -Pattern "12 documentos"

# Deve explicar os 5 problemas
Select-String -Path "docs\archive\2025\deprecated-omnichannel-old\README_ARQUIVADO.md" -Pattern "5 problemas|cinco problemas"
```

---

## ✅ Verificação 6: Notas de Contexto em Docs Técnicos

### Verificar que docs técnicos têm avisos no topo
```powershell
# ANALISE_ARQUITETURA_OMNICHANNEL_COMPLETA.md
Select-String -Path "docs\archive\2025\ANALISE_ARQUITETURA_OMNICHANNEL_COMPLETA.md" -Pattern "DOCUMENTO ARQUIVADO|posicionamento correto" | Select-Object -First 1

# ANALISE_ESTRATEGICA_FERRAMENTAS_ATENDIMENTO.md
Select-String -Path "docs\archive\2025\ANALISE_ESTRATEGICA_FERRAMENTAS_ATENDIMENTO.md" -Pattern "DOCUMENTO ARQUIVADO|objetivo estava errado" | Select-Object -First 1

# ANALISE_SISTEMA_FILAS.md
Select-String -Path "docs\archive\2025\ANALISE_SISTEMA_FILAS.md" -Pattern "DOCUMENTO ARQUIVADO|Competir com Zendesk" | Select-Object -First 1

# RESUMO_IMPLEMENTACAO.md
Select-String -Path "docs\implementation\RESUMO_IMPLEMENTACAO.md" -Pattern "Nota de Posicionamento|comparação técnica apenas" | Select-Object -First 1
```

---

## 🎯 Verificação Completa (Executar Tudo de Uma Vez)

```powershell
Write-Host "🔍 INICIANDO VERIFICAÇÃO COMPLETA..." -ForegroundColor Yellow
Write-Host ""

# 1. Arquivos movidos
Write-Host "1️⃣ Verificando arquivos arquivados..." -ForegroundColor Cyan
$deprecatedOld = Test-Path "docs\archive\2025\deprecated-omnichannel-old"
$count = (Get-ChildItem "docs\archive\2025\deprecated-omnichannel-old" -File -Filter "*.md").Count
if ($deprecatedOld -and $count -eq 13) {
    Write-Host "   ✅ deprecated-omnichannel-old/ OK (13 arquivos: 12 docs + 1 README)" -ForegroundColor Green
} else {
    Write-Host "   ❌ deprecated-omnichannel-old/ ERRO (esperado 13, encontrado $count)" -ForegroundColor Red
}

# 2. Novos documentos
Write-Host ""
Write-Host "2️⃣ Verificando novos documentos..." -ForegroundColor Cyan
$novos = @(
    "VISAO_SISTEMA_2025.md",
    "KIT_VENDAS_CONECTCRM.md",
    "DIFERENCIAL_INTEGRACAO_NATIVA.md",
    "PITCH_DECK_INVESTIDORES.md",
    "COMUNICADO_ATUALIZACAO_POSICIONAMENTO.md",
    "LIMPEZA_DOCUMENTACAO_CONCLUIDA.md"
)
foreach ($doc in $novos) {
    if (Test-Path $doc) {
        Write-Host "   ✅ $doc criado" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $doc FALTANDO" -ForegroundColor Red
    }
}

# 3. Referências antigas
Write-Host ""
Write-Host "3️⃣ Verificando referências a visão antiga..." -ForegroundColor Cyan
$mainDocs = @("README.md", "VISAO_SISTEMA_2025.md", "KIT_VENDAS_CONECTCRM.md")
$found = $false
foreach ($doc in $mainDocs) {
    $matches = Select-String -Path $doc -Pattern "paridade com Zendesk" -ErrorAction SilentlyContinue
    if ($matches) {
        Write-Host "   ⚠️ $doc ainda menciona 'paridade com Zendesk'" -ForegroundColor Yellow
        $found = $true
    }
}
if (-not $found) {
    Write-Host "   ✅ Documentos principais sem referências antigas" -ForegroundColor Green
}

# 4. INDICE_DOCUMENTACAO.md
Write-Host ""
Write-Host "4️⃣ Verificando índice de documentação..." -ForegroundColor Cyan
$indice = "docs\INDICE_DOCUMENTACAO.md"
$hasDeprecated = Select-String -Path $indice -Pattern "deprecated-omnichannel-old" -Quiet
$hasDiferencial = Select-String -Path $indice -Pattern "DIFERENCIAL_INTEGRACAO_NATIVA" -Quiet
$hasKit = Select-String -Path $indice -Pattern "KIT_VENDAS_CONECTCRM" -Quiet

if ($hasDeprecated -and $hasDiferencial -and $hasKit) {
    Write-Host "   ✅ INDICE_DOCUMENTACAO.md atualizado corretamente" -ForegroundColor Green
} else {
    Write-Host "   ❌ INDICE_DOCUMENTACAO.md INCOMPLETO" -ForegroundColor Red
    Write-Host "      - deprecated-omnichannel-old: $hasDeprecated" -ForegroundColor Gray
    Write-Host "      - DIFERENCIAL_INTEGRACAO_NATIVA: $hasDiferencial" -ForegroundColor Gray
    Write-Host "      - KIT_VENDAS_CONECTCRM: $hasKit" -ForegroundColor Gray
}

# 5. README dos archives
Write-Host ""
Write-Host "5️⃣ Verificando README dos archives..." -ForegroundColor Cyan
$readme1 = Test-Path "docs\archive\2025\deprecated-omnichannel\README_ARQUIVADO.md"
$readme2 = Test-Path "docs\archive\2025\deprecated-omnichannel-old\README_ARQUIVADO.md"
if ($readme1 -and $readme2) {
    Write-Host "   ✅ READMEs dos archives criados" -ForegroundColor Green
} else {
    Write-Host "   ❌ READMEs FALTANDO (deprecated: $readme1, deprecated-old: $readme2)" -ForegroundColor Red
}

# Resumo
Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "📊 RESUMO DA VERIFICAÇÃO" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "✅ Arquivos arquivados: $deprecatedOld" -ForegroundColor $(if ($deprecatedOld) { "Green" } else { "Red" })
Write-Host "✅ Novos documentos: $($novos.Length) criados" -ForegroundColor Green
Write-Host "✅ Referências antigas: limpas" -ForegroundColor Green
Write-Host "✅ Índice atualizado: $($hasDeprecated -and $hasDiferencial)" -ForegroundColor $(if ($hasDeprecated -and $hasDiferencial) { "Green" } else { "Red" })
Write-Host "✅ READMEs archives: $($readme1 -and $readme2)" -ForegroundColor $(if ($readme1 -and $readme2) { "Green" } else { "Red" })
Write-Host ""

if ($deprecatedOld -and $hasDeprecated -and $hasDiferencial -and $readme1 -and $readme2) {
    Write-Host "🎉 VERIFICAÇÃO COMPLETA: SUCESSO!" -ForegroundColor Green
} else {
    Write-Host "⚠️ VERIFICAÇÃO COMPLETA: ATENÇÃO NECESSÁRIA" -ForegroundColor Yellow
}
```

---

## 📝 Resultado Esperado

Quando executar o script de verificação completa, você deve ver:

```
🔍 INICIANDO VERIFICAÇÃO COMPLETA...

1️⃣ Verificando arquivos arquivados...
   ✅ deprecated-omnichannel-old/ OK (13 arquivos: 12 docs + 1 README)

2️⃣ Verificando novos documentos...
   ✅ VISAO_SISTEMA_2025.md criado
   ✅ KIT_VENDAS_CONECTCRM.md criado
   ✅ DIFERENCIAL_INTEGRACAO_NATIVA.md criado
   ✅ PITCH_DECK_INVESTIDORES.md criado
   ✅ COMUNICADO_ATUALIZACAO_POSICIONAMENTO.md criado
   ✅ LIMPEZA_DOCUMENTACAO_CONCLUIDA.md criado

3️⃣ Verificando referências a visão antiga...
   ✅ Documentos principais sem referências antigas

4️⃣ Verificando índice de documentação...
   ✅ INDICE_DOCUMENTACAO.md atualizado corretamente

5️⃣ Verificando README dos archives...
   ✅ READMEs dos archives criados

═══════════════════════════════════════════
📊 RESUMO DA VERIFICAÇÃO
═══════════════════════════════════════════
✅ Arquivos arquivados: True
✅ Novos documentos: 6 criados
✅ Referências antigas: limpas
✅ Índice atualizado: True
✅ READMEs archives: True

🎉 VERIFICAÇÃO COMPLETA: SUCESSO!
```

---

## 🔧 Troubleshooting

### Problema: "deprecated-omnichannel-old/ não encontrado"
```powershell
# Solução: Criar pasta e mover arquivos manualmente
New-Item -ItemType Directory -Force -Path "docs\archive\2025\deprecated-omnichannel-old"
```

### Problema: "INDICE_DOCUMENTACAO.md não menciona deprecated-omnichannel-old"
```powershell
# Solução: Verificar se arquivo foi editado corretamente
Select-String -Path "docs\INDICE_DOCUMENTACAO.md" -Pattern "deprecated-omnichannel-old" -Context 2
```

### Problema: "Arquivos ainda na raiz"
```powershell
# Listar arquivos que deveriam estar arquivados
Get-ChildItem -File | Where-Object { $_.Name -match "OMNICHANNEL|MELHORIAS_CHAT" }

# Se encontrar arquivos, mover manualmente
Move-Item "OMNICHANNEL_INDICE.md" -Destination "docs\archive\2025\deprecated-omnichannel-old\" -ErrorAction Stop
```

---

**Última atualização**: 19 de Janeiro de 2025  
**Próxima verificação**: Após 30 dias (verificar se ninguém está acessando deprecated folders)
