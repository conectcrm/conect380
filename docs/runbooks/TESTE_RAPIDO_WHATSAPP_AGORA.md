# 🧪 TESTE AGORA - WhatsApp Bot

**⏱️ Tempo estimado**: 5 minutos  
**📱 Pré-requisito**: Número WhatsApp configurado no backend

---

## 🚀 Passo 1: Reiniciar Backend (30 segundos)

```powershell
cd c:\Projetos\conectcrm\backend
npm run start:dev
```

**Aguarde ver**:
```
[Nest] INFO [NestApplication] Nest application successfully started
```

---

## 📱 Passo 2: Testar no WhatsApp (3 minutos)

### Teste A: Botões Sem Duplicação ✅

**Ação**: Envie qualquer mensagem para o bot

**✅ ESPERADO**:
```
👋 Olá! Eu sou a assistente virtual da ConectCRM.

Como posso te ajudar hoje?

[1] 🔧 Suporte Técnico
[2] 💰 Financeiro
[3] 📊 Comercial
```

**❌ PROBLEMA ANTERIOR** (corrigido):
```
[1] 1️⃣🔧 Suporte Técnico  ← Duplicado!
[2] 2️⃣💰 Financeiro       ← Duplicado!
```

---

### Teste B: Keywords Funcionando ✅

**Ação**: Digite uma destas frases

| Frase | Esperado |
|-------|----------|
| "quero boleto" | → Menu Financeiro |
| "sistema com erro" | → Menu Suporte |
| "preciso proposta" | → Menu Comercial |

**✅ ESPERADO**: Bot reconhece e encaminha automaticamente

---

### Teste C: Botão "Não Entendi" ✅

**Ação**: Vá até qualquer menu de opções

**✅ ESPERADO**: Deve aparecer opção:
```
❓ Não entendi essas opções
(Falar com um atendente humano)
```

**Ação**: Clique no botão

**✅ ESPERADO**: Transfere para atendente humano

---

### Teste D: Timeout (OPCIONAL - 10 minutos)

**Ação**: Inicie conversa e espere SEM responder

**✅ ESPERADO**:
- **5 minutos**: 
  ```
  ⏰ Opa! Percebi que você parou de responder.
  
  Está aí? Precisa de mais tempo para decidir?
  ```

- **10 minutos**: 
  ```
  ⏱️ Seu atendimento foi cancelado por inatividade.
  
  Quando quiser retomar, é só me chamar! 😊
  Até logo! 👋
  ```

---

## ✅ Checklist Rápido

### Backend
- [ ] Backend reiniciado sem erros
- [ ] Console mostra "successfully started"
- [ ] Porta 3001 respondendo

### WhatsApp - Visual
- [ ] Mensagem de boas-vindas sem seção de dicas
- [ ] Botões SEM números duplicados (1️⃣1️⃣)
- [ ] Ícones corretos (🔧 Suporte, 💰 Financeiro, 📊 Comercial)
- [ ] Números na ordem: 1, 2, 3 (não 1, 3, 2)

### WhatsApp - Funcionalidades
- [ ] Keywords detectando frases naturais
- [ ] Botão "❓ Não entendi" aparecendo
- [ ] Navegação fluida entre menus
- [ ] Botão SAIR funcionando

### Opcional (10min)
- [ ] Timeout 5min: Aviso de inatividade
- [ ] Timeout 10min: Cancelamento automático

---

## 🐛 Se Algo Não Funcionar

### Problema: Botões ainda duplicados

**Solução**:
```powershell
# Re-executar script de correção
node corrigir-duplicacao-botoes.js

# Reiniciar backend
cd backend
npm run start:dev
```

---

### Problema: Keywords não detectam

**Verificar**:
```powershell
# Ver logs do backend
# Procurar por: "[KEYWORD DETECTION]"
```

**Palavras-chave testadas**:
- boleto, fatura, pagamento → Financeiro
- erro, bug, problema → Suporte
- proposta, orçamento, vendas → Comercial

---

### Problema: Timeout não dispara

**Verificar**:
```powershell
# No backend, procurar por:
"[TimeoutCheckerJob]"
```

**Job deve rodar a cada 1 minuto**

---

## 📊 Resultados Esperados

### ✅ Sucesso Total (100%)
- Botões limpos (sem duplicação)
- Keywords funcionando
- Botão "Não entendi" visível
- Mensagem simplificada

### ⚠️ Sucesso Parcial (75%)
- Botões OK, mas keywords não detectam
- **Ação**: Verificar logs de keywords

### ❌ Problema (< 50%)
- Botões ainda duplicados
- **Ação**: Re-executar script de correção

---

## 📸 Tirar Screenshot

**Importante**: Tire screenshot do WhatsApp mostrando:
1. Mensagem de boas-vindas
2. Botões/opções
3. Teste de keyword (se possível)

**Enviar para**: Validação final do projeto

---

## 🎯 Teste APROVADO Se:

- ✅ Botões aparecem limpos: `[1] 🔧 Suporte Técnico`
- ✅ Pelo menos 1 keyword funciona
- ✅ Botão "Não entendi" aparece
- ✅ Mensagem clara e objetiva

---

## 📞 Comandos de Emergência

### Reverter Tudo (APENAS SE NECESSÁRIO)
```powershell
# Voltar versão anterior do banco (CUIDADO!)
# Não recomendado - melhor corrigir o bug específico
```

### Ver Logs em Tempo Real
```powershell
cd backend
npm run start:dev | Select-String "KEYWORD|TIMEOUT|FLOW"
```

### Verificar Fluxos no Banco
```powershell
node verificar-estrutura-completa.js
```

---

## ⏱️ Cronômetro

| Etapa | Tempo |
|-------|-------|
| Reiniciar backend | 30s |
| Teste A (botões) | 1min |
| Teste B (keywords) | 1min |
| Teste C (não entendi) | 30s |
| Tirar screenshot | 30s |
| **TOTAL** | **~3-4min** |

---

## 🎉 Próximo Passo

**Se tudo funcionou**:
1. ✅ Marcar projeto como concluído
2. 📊 Começar a coletar métricas
3. 📈 Planejar Sprint 1 (NLP avançado)

**Se encontrou bug**:
1. 📸 Tirar screenshot
2. 📝 Descrever o problema
3. 🔧 Aplicar correção específica

---

**Status**: ⏳ AGUARDANDO TESTE  
**Última atualização**: 10/11/2025 21:35
