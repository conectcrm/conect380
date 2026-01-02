# 🔧 Troubleshooting - Fluxo Não Funciona com Novas Alterações

## 🎯 Problema
Você publicou o fluxo no editor visual, mas as novas funcionalidades (confirmação formatada, reconhecimento de último departamento) não estão funcionando no WhatsApp.

---

## ✅ Checklist de Diagnóstico

### 1️⃣ Backend Atualizado?

**Verificar se backend foi reiniciado após mudanças no código:**

```powershell
# Ver quando o backend foi iniciado
Get-Process -Name node | Select-Object StartTime, Id

# Se StartTime for ANTES das 08:40 de hoje, precisa reiniciar!
```

**SOLUÇÃO: Reiniciar backend**
```powershell
# Parar backend (Ctrl+C no terminal do backend)
# OU matar processo:
Get-Process -Name node | Where-Object { $_.StartTime -lt (Get-Date).AddHours(-1) } | Stop-Process -Force

# Iniciar novamente
cd backend
npm run start:dev
```

---

### 2️⃣ Fluxo Tem a Etapa de Confirmação?

**Executar SQL para verificar:**

```sql
-- Abra o PostgreSQL e execute:
psql -U conectcrm -d conectcrm_db -p 5434

-- Cole o conteúdo de verificar-fluxo-ativo.sql
\i c:/Projetos/conectcrm/verificar-fluxo-ativo.sql
```

**Resultado Esperado:**
- ✅ Deve ter etapa `confirmar-dados-cliente` OU `confirmacao-dados`
- ✅ Etapa deve ter `proximaEtapa` apontando para próxima etapa

**Se NÃO tiver a etapa:**

#### **Opção A: Adicionar via SQL** (rápido)
```sql
\i c:/Projetos/conectcrm/corrigir-fluxo-confirmacao.sql
```

#### **Opção B: Recriar no Editor Visual** (recomendado)
1. Acessar `http://localhost:3000/admin/bot-builder`
2. Editar fluxo ativo
3. Adicionar bloco de confirmação:
   - **Tipo:** Menu
   - **ID:** `confirmar-dados-cliente`
   - **Mensagem:** (qualquer texto - será substituído automaticamente)
   - **Conexões:** 
     - **Entrada:** Conectar da etapa `coleta-empresa`
     - **Saída:** Conectar para `menu_nucleos` (ou próxima etapa)
4. Salvar e publicar novamente

---

### 3️⃣ Sessão Antiga Ativa?

**Problema:** WhatsApp pode estar usando sessão antiga (antes da publicação).

**SOLUÇÃO: Limpar sessões**

```sql
-- Ver sessões ativas
SELECT id, contato_telefone, etapa_atual, iniciada_em, status
FROM sessao_triagem
WHERE status = 'em_andamento'
ORDER BY iniciada_em DESC;

-- OPÇÃO 1: Finalizar sessões antigas (forçar restart)
UPDATE sessao_triagem
SET 
  status = 'finalizada',
  finalizada_em = NOW(),
  finalizada_por = 'admin_limpeza'
WHERE status = 'em_andamento'
  AND iniciada_em < NOW() - INTERVAL '10 minutes';

-- OPÇÃO 2: Deletar sessões de teste
DELETE FROM sessao_triagem
WHERE contato_telefone = '+55SEU_NUMERO_TESTE';
```

**Depois, envie nova mensagem no WhatsApp** para criar sessão nova com fluxo atualizado.

---

### 4️⃣ Logs do Backend

**Verificar o que está acontecendo em tempo real:**

1. Deixe terminal do backend visível
2. Envie mensagem no WhatsApp
3. Observe os logs:

**Logs Esperados:**
```
[TriagemBotService] Mensagem recebida de +5511999999999: "Oi"
[TriagemBotService] Iniciando triagem para contato...
[FlowEngine] Etapa atual: boas-vindas
[FlowEngine] Processando menu_nucleos
...
[FlowEngine] 📋 Mensagem de confirmação de dados formatada
```

**Se NÃO aparecer "📋 Mensagem de confirmação de dados formatada":**
- ❌ Fluxo não tem a etapa de confirmação
- ❌ OU etapa tem nome diferente (`confirmacao-dados` vs `confirmar-dados-cliente`)

---

### 5️⃣ Código Compilou Sem Erros?

**Verificar terminal do backend:**

```
[08:41:02] Found 3 errors. Watching for file changes.
```

❌ **Se tiver erros, o código antigo está rodando!**

**SOLUÇÃO:**
1. Corrigir erros TypeScript
2. Backend recompila automaticamente (watch mode)
3. Testar novamente

---

### 6️⃣ Webhook Configurado Corretamente?

**Verificar URL do webhook no Meta:**

```
https://6a9342270147.ngrok-free.app/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>
```

**Testar webhook manualmente:**
```powershell
# Simular mensagem do WhatsApp
curl -X POST http://localhost:3001/api/atendimento/webhooks/whatsapp/<ID_EMPRESA> `
  -H "Content-Type: application/json" `
  -H "X-Hub-Signature-256: sha256=<HMAC_GERADO_COM_APP_SECRET>" `
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "text": { "body": "Oi" }
          }]
        }
      }]
    }]
  }'
```

**Resultado Esperado:** Backend processa e registra log.

---

## 🚀 Solução Rápida (Ordem de Execução)

Execute estes passos na ordem:

### **Passo 1: Reiniciar Backend**
```powershell
# Terminal do backend: Ctrl+C
cd c:\Projetos\conectcrm\backend
npm run start:dev
```

### **Passo 2: Verificar Fluxo no Banco**
```sql
psql -U conectcrm -d conectcrm_db -p 5434

SELECT jsonb_object_keys(estrutura->'etapas') as etapas
FROM fluxos_triagem WHERE ativo = true;
```

**Se não tiver `confirmar-dados-cliente`:**

```sql
\i c:/Projetos/conectcrm/corrigir-fluxo-confirmacao.sql
```

### **Passo 3: Limpar Sessões Antigas**
```sql
UPDATE sessao_triagem
SET status = 'finalizada', finalizada_em = NOW()
WHERE status = 'em_andamento';
```

### **Passo 4: Testar no WhatsApp**
- Enviar nova mensagem
- Observar logs do backend
- Verificar se chega na confirmação formatada

---

## 🔍 Diagnóstico Avançado

### Ver Fluxo Completo Ativo
```sql
SELECT jsonb_pretty(estrutura)
FROM fluxos_triagem
WHERE ativo = true
LIMIT 1;
```

### Ver Contexto da Sessão Atual
```sql
SELECT 
  id,
  etapa_atual,
  jsonb_pretty(contexto) as dados_coletados,
  status
FROM sessao_triagem
WHERE contato_telefone = '+55SEU_NUMERO'
ORDER BY iniciada_em DESC
LIMIT 1;
```

### Ver Todos os Logs de uma Sessão
```sql
SELECT 
  created_at,
  acao,
  detalhes
FROM triagem_log
WHERE sessao_id = 'UUID_DA_SESSAO'
ORDER BY created_at;
```

---

## ❓ Ainda Não Funciona?

**Compartilhe estas informações:**

1. **Logs do backend** (últimas 50 linhas após enviar mensagem)
2. **Resultado do SQL:** `SELECT jsonb_object_keys(estrutura->'etapas') FROM fluxos_triagem WHERE ativo = true;`
3. **Etapa atual da sessão:** `SELECT etapa_atual FROM sessao_triagem WHERE status = 'em_andamento' LIMIT 1;`
4. **Erros de compilação:** (se houver)

---

## 📌 Resumo

**Principais causas do problema:**

1. ✅ **Backend não reiniciado** → Reiniciar
2. ✅ **Fluxo sem etapa de confirmação** → Adicionar via SQL ou editor visual
3. ✅ **Sessão antiga ativa** → Limpar sessões
4. ✅ **Erros de compilação** → Corrigir TypeScript
5. ✅ **Webhook desconfigurado** → Atualizar URL ngrok

**Na maioria dos casos, basta:**
1. Reiniciar backend
2. Limpar sessões
3. Testar novamente

✅ Boa sorte!
