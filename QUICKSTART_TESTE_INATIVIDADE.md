# 🚀 Quick Start - Teste de Fechamento Automático

## ⚡ Teste Rápido (10 minutos)

### Pré-requisitos
- ✅ Backend rodando (`npm run start:dev`)
- ✅ Migration executada
- ✅ Ter um ticket ativo para teste
- ✅ Ter ID da empresa (UUID)

---

## 📋 Opção 1: Script Automatizado (Recomendado)

```powershell
# Executar script de teste
.\scripts\test-inactivity-system.ps1
```

O script vai:
1. Buscar/criar configuração de teste (5min timeout)
2. Pedir ID do ticket
3. Guiar você pelas etapas de teste
4. Forçar verificações manuais
5. Validar resultados

---

## 🔧 Opção 2: Teste Manual (Passo a Passo)

### 1️⃣ Criar Configuração (Postman/Thunder Client)

```http
POST http://localhost:3001/atendimento/configuracao-inatividade/{{EMPRESA_ID}}
Content-Type: application/json

{
  "timeoutMinutos": 5,
  "enviarAviso": true,
  "avisoMinutosAntes": 2,
  "mensagemAviso": "⚠️ Seu atendimento será fechado em breve por inatividade.",
  "mensagemFechamento": "✅ Atendimento encerrado por inatividade. Volte quando precisar!",
  "ativo": true,
  "statusAplicaveis": ["AGUARDANDO", "EM_ATENDIMENTO"]
}
```

**Resposta esperada**: HTTP 201 Created

---

### 2️⃣ Buscar Ticket para Teste (SQL)

```sql
SELECT 
    id, 
    numero, 
    contato_nome, 
    status, 
    ultima_mensagem_em
FROM atendimento_ticket
WHERE empresa_id = '{{EMPRESA_ID}}'
  AND status IN ('AGUARDANDO', 'EM_ATENDIMENTO')
ORDER BY created_at DESC
LIMIT 5;
```

**Copie o ID de um ticket para usar no próximo passo**

---

### 3️⃣ Simular 4 Minutos de Inatividade (SQL)

```sql
-- SUBSTITUIR {{TICKET_ID}}
UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '4 minutes'
WHERE id = '{{TICKET_ID}}';

-- Confirmar:
SELECT 
    numero, 
    status, 
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo
FROM atendimento_ticket
WHERE id = '{{TICKET_ID}}';
-- Deve mostrar ~4 minutos
```

---

### 4️⃣ Forçar Verificação - Aviso (Postman/Thunder Client)

```http
POST http://localhost:3001/atendimento/configuracao-inatividade/verificar-agora
```

**Verificar**:
- ✅ Logs backend: `✅ Aviso enviado com sucesso`
- ✅ WhatsApp: Cliente recebeu mensagem de aviso
- ✅ Resposta API: `{ "ticketsProcessados": 1 }`

---

### 5️⃣ Simular 7 Minutos de Inatividade (SQL)

```sql
-- SUBSTITUIR {{TICKET_ID}}
UPDATE atendimento_ticket
SET ultima_mensagem_em = NOW() - INTERVAL '7 minutes'
WHERE id = '{{TICKET_ID}}';

-- Confirmar:
SELECT 
    numero, 
    status, 
    EXTRACT(EPOCH FROM (NOW() - ultima_mensagem_em)) / 60 AS minutos_inativo
FROM atendimento_ticket
WHERE id = '{{TICKET_ID}}';
-- Deve mostrar ~7 minutos
```

---

### 6️⃣ Forçar Verificação - Fechamento (Postman/Thunder Client)

```http
POST http://localhost:3001/atendimento/configuracao-inatividade/verificar-agora
```

**Verificar**:
- ✅ Logs backend: `✅ Ticket fechado por inatividade`
- ✅ Logs backend: `✅ Mensagem de fechamento enviada`
- ✅ WhatsApp: Cliente recebeu mensagem de fechamento
- ✅ Resposta API: `{ "ticketsProcessados": 1 }`

---

### 7️⃣ Confirmar no Banco (SQL)

```sql
-- SUBSTITUIR {{TICKET_ID}}
SELECT 
    numero,
    status,
    data_fechamento,
    ultima_mensagem_em
FROM atendimento_ticket
WHERE id = '{{TICKET_ID}}';
```

**Resultado esperado**:
- `status` = `FECHADO`
- `data_fechamento` = (timestamp preenchido)

---

## ✅ Checklist de Sucesso

### Backend (Logs no Terminal)
- [ ] `🔍 Iniciando verificação de inatividade...`
- [ ] `🏢 Processando empresa: [Nome]`
- [ ] `⚠️ Enviando aviso para ticket [número]`
- [ ] `✅ Aviso enviado com sucesso`
- [ ] `🔒 Fechando ticket [número] por inatividade`
- [ ] `✅ Mensagem de fechamento enviada com sucesso`
- [ ] `✅ Ticket [número] fechado por inatividade`

### WhatsApp (Cliente)
- [ ] Recebeu mensagem de aviso (após 4min de teste)
- [ ] Recebeu mensagem de fechamento (após 7min de teste)

### Banco de Dados
- [ ] `status` mudou para `FECHADO`
- [ ] `data_fechamento` foi preenchida
- [ ] `ultima_mensagem_em` permanece com timestamp antigo

---

## 🎯 Próximos Testes (Opcional)

### Teste 2: Sem Aviso
```json
{
  "timeoutMinutos": 5,
  "enviarAviso": false,
  "ativo": true
}
```
- Ticket deve fechar diretamente sem aviso prévio

### Teste 3: Filtro por Status
```json
{
  "timeoutMinutos": 5,
  "statusAplicaveis": ["AGUARDANDO"],
  "ativo": true
}
```
- Apenas tickets em AGUARDANDO devem fechar

### Teste 4: Sistema Desativado
```http
PUT http://localhost:3001/atendimento/configuracao-inatividade/{{EMPRESA_ID}}/ativar
Content-Type: application/json

{ "ativo": false }
```
- Nenhum ticket deve fechar

---

## 🚨 Troubleshooting

### ❌ Aviso não foi enviado
**Causas possíveis**:
1. WhatsApp token inválido → Verificar `whatsapp_api_configs`
2. Número mal formatado → Deve ser `5511999999999` (sem +)
3. Backend não rodando → Verificar processo
4. Configuração inativa → Verificar `ativo = true`

### ❌ Ticket não fechou
**Causas possíveis**:
1. Timeout não atingido → Verificar `ultima_mensagem_em`
2. Status não aplicável → Verificar `statusAplicaveis`
3. Configuração não existe → Verificar GET da config
4. Sistema desativado → Verificar `ativo = true`

### ❌ Erro nos logs
**Verificar**:
- Logs completos do backend (stacktrace)
- Tabela existe? `SELECT * FROM atendimento_configuracao_inatividade LIMIT 1;`
- Entity registrada? Verificar `database.config.ts`
- Service iniciado? Procurar `✅ InactivityMonitorService iniciado`

---

## 📚 Arquivos de Referência

| Arquivo | Propósito |
|---------|-----------|
| `scripts/test-inactivity-system.ps1` | Script automatizado de teste |
| `scripts/test-inactivity-queries.sql` | Queries SQL úteis |
| `TESTE_FECHAMENTO_AUTOMATICO.md` | Guia detalhado completo |
| `CONSOLIDACAO_FECHAMENTO_AUTOMATICO.md` | Documentação técnica |

---

## 🎉 Sucesso!

Se todos os itens do checklist foram marcados:

✅ **Sistema funcionando perfeitamente!**

Próximos passos:
1. Ajustar timeouts para produção (24h, 48h, etc.)
2. Configurar empresas reais
3. Monitorar logs por 1 semana
4. Opcional: criar interface frontend

---

**Última atualização**: 05/11/2025  
**Tempo estimado**: 10 minutos  
**Status**: ✅ Pronto para uso
