# ⚠️ BACKEND PRECISA SER REINICIADO

## 🎯 Problema Atual

As alterações foram **compiladas** mas o backend **NÃO foi reiniciado**, por isso o bot ainda mostra as 5 opções antigas.

### Status Atual:
- ✅ Código modificado em `triagem-bot.service.ts`
- ✅ Backend recompilado (`npm run build`)
- ❌ **Backend NÃO foi reiniciado** ← PROBLEMA!
- ❌ Bot ainda usa código antigo em memória

---

## 🚀 SOLUÇÃO RÁPIDA

### Opção 1: Terminal Existente
Se você tem um terminal com backend rodando:

1. **Pare o backend:** Pressione `Ctrl+C`
2. **Inicie novamente:**
   ```powershell
   npm run start:dev
   ```
3. **Aguarde:** Ver mensagem "Backend rodando na porta 3001"

---

### Opção 2: Novo Terminal

1. **Abra PowerShell**
2. **Execute:**
   ```powershell
   cd C:\Projetos\conectcrm\backend
   npm run start:dev
   ```
3. **Aguarde:** Ver logs de inicialização

---

### Opção 3: Matar Processo e Reiniciar

Se não conseguir parar o backend normalmente:

```powershell
# Encontrar processo na porta 3001
netstat -ano | findstr :3001

# Resultado será algo como:
# TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    12345
#                                                   ^^^^^ PID

# Matar processo (substitua 12345 pelo PID real)
taskkill /PID 12345 /F

# Iniciar backend
cd C:\Projetos\conectcrm\backend
npm run start:dev
```

---

### Opção 4: Script Automático

Execute o script que criei:

```powershell
cd C:\Projetos\conectcrm
.\reiniciar-backend.ps1
```

Este script:
- ✅ Mata processos na porta 3001
- ✅ Inicia o backend automaticamente
- ✅ Aguarda inicialização

---

## 📋 Checklist de Reinicialização

### Durante o Reinício, Você Verá:

```
[Nest] INFO  [RouterExplorer] Mapped {/nucleos/bot/opcoes, GET}
[Nest] INFO  [NestApplication] Nest application successfully started
[Nest] INFO  Backend rodando na porta 3001
```

### Logs Importantes:

```
[NucleoService] Núcleo service inicializado  ← Serviço carregado
[TriagemBotService] Bot service inicializado  ← Bot carregado
```

---

## 🧪 Teste Após Reiniciar

### 1. Verificar Endpoint
```powershell
# Testar endpoint de núcleos
Invoke-RestMethod -Uri "http://localhost:3001/nucleos/bot/opcoes" `
  -Headers @{ Authorization = "Bearer SEU_TOKEN" }
```

**Resultado esperado:** JSON com apenas os núcleos visíveis:
```json
[
  {
    "id": "uuid-1",
    "nome": "Suporte",
    "departamentos": [...]
  },
  {
    "id": "uuid-2",
    "nome": "Financeiro",
    "departamentos": [...]
  }
]
```

### 2. Testar no WhatsApp

1. **Envie mensagem:** "Oi"
2. **Verifique menu:** Deve mostrar apenas 2 núcleos + opção 0

**Exemplo esperado:**
```
👋 Olá! Eu sou a assistente virtual da ConectCRM.
Escolha uma das opções abaixo para continuar:

1️⃣ Suporte
2️⃣ Financeiro

0️⃣ Falar direto com um atendente humano

❌ Digite SAIR para cancelar
```

### 3. Verificar Logs do Backend

Quando o bot montar o menu, você verá:
```
[TriagemBotService] Menu dinâmico montado com 2 núcleos visíveis
```

---

## 🔍 Se Ainda Não Funcionar

### Debug 1: Verificar se Backend Reiniciou
```powershell
# Ver quando o processo iniciou
Get-Process node | Where-Object {$_.StartTime -gt (Get-Date).AddMinutes(-5)}
```

Se não mostrar processos recentes, o backend não reiniciou.

---

### Debug 2: Verificar Logs do NucleoService
No console do backend, procure por:
```
[NucleoService] findOpcoesParaBot executado para empresa: ...
```

Se não aparecer, o método não está sendo chamado.

---

### Debug 3: Verificar Session no WhatsApp

Pode haver sessão antiga em cache. Delete a sessão:

```sql
-- No banco de dados
DELETE FROM sessoes_triagem 
WHERE telefone = 'SEU_NUMERO' 
AND status = 'em_andamento';
```

Depois envie "Oi" novamente.

---

## ⚠️ Problemas Comuns

### 1. Backend não Inicia
```
Error: Cannot find module...
```

**Solução:**
```powershell
cd backend
npm install
npm run start:dev
```

---

### 2. Porta 3001 em Uso
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solução:**
```powershell
# Matar processo
netstat -ano | findstr :3001
taskkill /PID [PID] /F
npm run start:dev
```

---

### 3. Erro de Compilação
```
Error: Cannot read property 'findOpcoesParaBot' of undefined
```

**Solução:**
```powershell
npm run build --prefix backend
cd backend
npm run start:dev
```

---

### 4. Bot Ainda Mostra 5 Opções

**Causas possíveis:**
1. ❌ Backend não reiniciou
2. ❌ Sessão antiga em cache
3. ❌ Código antigo ainda em memória
4. ❌ Fluxo hardcoded no banco

**Verificação:**
```sql
-- Ver estrutura do fluxo no banco
SELECT estrutura 
FROM fluxos_triagem 
WHERE id = '11111111-2222-3333-4444-555555555555';
```

Se o campo `estrutura` tem as 5 opções hardcoded, o problema é que o fluxo no banco não foi atualizado. A modificação que fizemos sobrescreve isso dinamicamente, mas só funciona se o backend estiver rodando com o código novo.

---

## ✅ Confirmação de Sucesso

Você saberá que funcionou quando:

1. **No console do backend:**
   ```
   [TriagemBotService] Menu dinâmico montado com 2 núcleos visíveis
   ```

2. **No WhatsApp:**
   - Menu mostra apenas 2 opções (seus núcleos)
   - Opção 0 (falar com atendente)
   - Total: 3 opções em vez de 5

3. **Selecionando opção 1:**
   - Bot pergunta nome
   - Fluxo continua normalmente
   - Ticket é criado no núcleo correto

---

## 🎯 Resumo

**Por que ainda mostra 5 opções?**
- Backend está rodando com código antigo em memória

**O que fazer?**
1. Parar backend (Ctrl+C)
2. Iniciar novamente (`npm run start:dev`)
3. Aguardar mensagem de inicialização
4. Testar no WhatsApp

**Tempo estimado:** 1-2 minutos para reiniciar

---

**Próximo passo:** Reinicie o backend agora! 🚀
