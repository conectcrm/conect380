# 🧪 Guia de Teste - Sistema de Aprovação de Cotações

**Status**: ✅ Ambiente Preparado  
**Data**: 15 de novembro de 2025  
**Navegador**: http://localhost:3000/comercial/minhas-aprovacoes

---

## ✅ Pré-requisitos (CONCLUÍDO)

- [x] Backend rodando na porta 3001
- [x] Frontend rodando na porta 3000  
- [x] Navegador aberto na página "Minhas Aprovações"
- [x] 2 cotações criadas em status `em_analise`:
  - **COT2025000004** - "Treino"
  - **COT2025000003** - "Compra e insumos humanods"
- [x] Aprovador: Mare Nildes

---

## 🎯 Teste 1: Aprovação COM Justificativa

### Ações no Navegador:

1. **Atualizar página**: Pressione `F5` no navegador
2. **Verificar lista**: As 2 cotações devem aparecer
3. **Clicar em Aprovar**: Botão verde na cotação #COT2025000004 (Treino)

### ✨ O que deve acontecer:

**Etapa 1 do Modal:**
- ✅ Modal abre com título "Aprovar ou Reprovar Cotação"
- ✅ Exibe dados da cotação:
  - Número: COT2025000004
  - Fornecedor: (nome do fornecedor)
  - Título: Treino
  - Valor Total: (valor formatado)
- ✅ Exibe 2 cards grandes:
  - **Card Verde**: "Aprovar Cotação" com ícone de check
  - **Card Vermelho**: "Reprovar Cotação" com ícone de X

**Ação:** Clique no **Card Verde** (Aprovar Cotação)

**Etapa 2 do Modal:**
- ✅ Título muda para "Justificativa da Aprovação"
- ✅ Mostra campo de texto: "Justificativa (opcional)"
- ✅ Placeholder: "Digite uma justificativa para a aprovação (opcional)..."
- ✅ Botão "Voltar" aparece (volta para etapa 1)
- ✅ Botão verde "Confirmar Aprovação"

**Ação:** Digite no campo: `"Aprovado conforme análise técnica e orçamento"`

**Ação:** Clique em **Confirmar Aprovação**

### ✅ Resultado Esperado:

- ✅ Toast verde aparece: "Cotação aprovada com sucesso!"
- ✅ Modal fecha automaticamente
- ✅ Cotação **COT2025000004** desaparece da lista
- ✅ Lista atualiza mostrando apenas 1 cotação restante

### 📊 Verificar no Banco de Dados:

Execute no terminal:
```powershell
.\verificar-cotacoes.ps1 -CotacaoId dfb39f71-31fa-4d42-8944-b33c9b06e21d
```

**Deve mostrar:**
- Status: `aprovada`
- Status Aprovação: `aprovado`
- Data Aprovação: (data/hora atual)
- Justificativa: `"Aprovado conforme análise técnica e orçamento"`
- Aprovador: Mare Nildes

---

## 🎯 Teste 2: Reprovação COM Justificativa

### Ações no Navegador:

1. **Clicar em Rejeitar**: Botão vermelho na cotação #COT2025000003

### ✨ O que deve acontecer:

**Etapa 1:** Modal abre (igual ao anterior)

**Ação:** Clique no **Card Vermelho** (Reprovar Cotação)

**Etapa 2:**
- ✅ Título: "Justificativa da Reprovação"
- ✅ Campo: "Justificativa (obrigatória) *"
- ✅ Placeholder: "Digite o motivo da reprovação (obrigatório)..."
- ✅ Botão "Voltar"
- ✅ Botão vermelho "Confirmar Reprovação"

**Ação:** NÃO digite nada (campo vazio)

**Ação:** Tente clicar em **Confirmar Reprovação**

### ✅ Validação Esperada:

- ✅ Botão deve estar **DESABILITADO** (opacidade reduzida)
- ✅ OU: Mensagem de erro aparece: "Justificativa obrigatória para reprovação"
- ✅ Modal NÃO fecha

**Ação:** Agora digite: `"Valor acima do orçamento aprovado para o trimestre"`

**Ação:** Clique em **Confirmar Reprovação**

### ✅ Resultado Esperado:

- ✅ Toast verde: "Cotação reprovada"
- ✅ Modal fecha
- ✅ Cotação **COT2025000003** desaparece
- ✅ Mensagem: "Nenhuma aprovação pendente no momento"

### 📊 Verificar no Banco:

```powershell
.\verificar-cotacoes.ps1 -CotacaoId cdd08171-4b3f-4df1-ac87-29ba94887609
```

**Deve mostrar:**
- Status: `rejeitada`
- Status Aprovação: `reprovado`
- Data Aprovação: (data/hora)
- Justificativa: `"Valor acima do orçamento aprovado para o trimestre"`

---

## 🎯 Teste 3: Ver Histórico de Aprovações

Execute no terminal:
```powershell
.\verificar-cotacoes.ps1 -Aprovadas
```

**Deve listar:**
- ✅ COT2025000004 - Treino - **Aprovado**
- ❌ COT2025000003 - Compra e insumos - **Reprovado**

Com datas, aprovador e justificativas.

---

## 🎯 Teste 4: Cancelamento do Modal

**Preparação:** Crie outra cotação em `em_analise` se necessário:
```powershell
$env:PGPASSWORD = "conectcrm123"
psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -c "UPDATE cotacoes SET status = 'em_analise' WHERE numero = 'COT2025000002';"
```

### Ações:

1. Atualizar página (F5)
2. Clicar em **Aprovar**
3. **Etapa 1:** Clicar no Card Verde
4. **Etapa 2:** Digitar alguma justificativa
5. Clicar em **Voltar** (deve voltar para Etapa 1)
6. Clicar no **X** (fechar modal)

### ✅ Resultado:

- ✅ Modal fecha
- ✅ Cotação PERMANECE na lista (sem alteração)
- ✅ Nada muda no banco de dados

---

## 📋 Checklist Final

Após todos os testes, verificar:

- [ ] Modal abre corretamente ✅
- [ ] Fluxo de 2 etapas funciona ✅
- [ ] Dados da cotação exibidos ✅
- [ ] Aprovação com justificativa OK ✅
- [ ] Aprovação sem justificativa OK ✅
- [ ] Reprovação exige justificativa (validação) ✅
- [ ] Reprovação com justificativa OK ✅
- [ ] Toast de sucesso aparece ✅
- [ ] Lista atualiza automaticamente ✅
- [ ] Banco atualiza corretamente ✅
- [ ] Cancelar não altera dados ✅

---

## 🐛 Reportar Problemas

Se encontrar algum problema, anotar:

1. **O que fez**: (ex: cliquei em aprovar)
2. **O que esperava**: (ex: modal abrir)
3. **O que aconteceu**: (ex: erro no console)
4. **Captura de tela**: (se possível)
5. **Console do navegador** (F12 → Console): copiar erros

---

## 🎉 Sucesso!

Se todos os testes passarem:
- ✅ Sistema de aprovação está **100% funcional**
- ✅ Validações funcionando
- ✅ Banco de dados sincronizado
- ✅ UI atualiza corretamente

**Próximo passo:** Implementar notificações por email/sistema ao aprovar/reprovar (opcional)

