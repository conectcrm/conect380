# 🧪 GUIA DE TESTES - Sistema de Tickets WhatsApp

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Instalação de Dependências](#instalação-de-dependências)
3. [Preparação do Ambiente](#preparação-do-ambiente)
4. [Testes Automatizados](#testes-automatizados)
5. [Testes Manuais](#testes-manuais)
6. [Verificação no Banco de Dados](#verificação-no-banco-de-dados)
7. [Teste de WebSocket](#teste-de-websocket)
8. [Cenários de Teste](#cenários-de-teste)
9. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

### Backend Rodando
```powershell
cd C:\Projetos\conectcrm\backend
npm run start:dev
```

✅ **Verificar**: Backend deve estar rodando na porta 3001
- URL: http://localhost:3001
- Health check: http://localhost:3001/api/health (se disponível)

### PostgreSQL Rodando
```powershell
docker ps
```

✅ **Verificar**: Container `conectcrm-postgres` deve estar ativo

### Canal WhatsApp Configurado
- Acesse o sistema e configure um canal WhatsApp
- Anote o `phone_number_id` da configuração
- Certifique-se de que o canal está **ATIVO**

---

## 📦 Instalação de Dependências

```powershell
cd C:\Projetos\conectcrm\backend

# Instalar dependências dos scripts de teste
npm install axios socket.io-client
```

---

## 🛠️ Preparação do Ambiente

### 1. Obter Token de Autenticação

```powershell
# Fazer login e obter token
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -Body (@{
    email = "admin@conectsuite.com.br"
    password = "Admin@123"
} | ConvertTo-Json) -ContentType "application/json"

$token = $response.access_token
Write-Host "Token: $token"
```

### 2. Listar Canais WhatsApp

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$canais = Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/canais" -Headers $headers -Method GET
$canais | Where-Object { $_.tipo -eq 'whatsapp' } | Format-List
```

### 3. Anotar Informações
- ✅ `empresaId`: ID da empresa
- ✅ `canalId`: ID do canal WhatsApp
- ✅ `phone_number_id`: ID do telefone do WhatsApp Business

---

## 🤖 Testes Automatizados

### Teste Completo de Integração

```powershell
cd C:\Projetos\conectcrm\backend
node test-webhook-integration.js
```

**O que este teste faz:**
1. ✅ Faz login no sistema
2. ✅ Busca canal WhatsApp configurado
3. ✅ Simula webhook do WhatsApp
4. ✅ Verifica criação automática de ticket
5. ✅ Verifica salvamento de mensagens
6. ✅ Verifica resposta automática da IA (se ativada)
7. ✅ Testa reutilização de ticket (mesma conversa)

**Saída esperada:**
```
🚀 INICIANDO TESTES DE INTEGRAÇÃO WEBHOOK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 PASSO 1: Fazendo login...
✅ Login realizado! Token: eyJhbGciOiJIUzI1NiIsInR5cC...

📱 PASSO 2: Buscando canal WhatsApp...
✅ Canal encontrado: WhatsApp Suporte (ID: abc-123)

📨 PASSO 3: Simulando webhook do WhatsApp...
✅ Webhook processado com sucesso!

🎫 PASSO 4: Verificando ticket criado...
✅ Ticket criado: #000001
📋 Status: ABERTO
📋 Origem: WHATSAPP

💬 PASSO 5: Verificando mensagens do ticket...
✅ 2 mensagem(ns) encontrada(s)
📋 Mensagem 1: CLIENTE - "Olá, preciso de ajuda..."
📋 Mensagem 2: BOT - "Olá! Como posso ajudar..."

📊 RELATÓRIO FINAL DE TESTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 1. Login
✅ 2. Buscar Canal WhatsApp
✅ 3. Enviar Webhook
✅ 4. Ticket Criado
✅ 5. Mensagens Salvas
✅ 6. Resposta IA
✅ 7. Reutilização de Ticket

📊 Taxa de sucesso: 100%
```

---

## 🔌 Teste de WebSocket

### Executar Monitor de WebSocket

```powershell
cd C:\Projetos\conectcrm\backend
node test-webhook-websocket.js
```

**O que acontece:**
- Script conecta ao WebSocket
- Aguarda notificações em tempo real
- Exibe cada mensagem recebida

**Deixe este script rodando** e envie uma mensagem via WhatsApp para testar.

**Saída esperada:**
```
🔌 TESTE DE WEBSOCKET - NOTIFICAÇÕES EM TEMPO REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[10:30:15] ✅ Conectado ao WebSocket! (ID: abc123)
[10:30:15] 👂 Aguardando notificações...
[10:30:15] 💡 Envie uma mensagem via WhatsApp para testar

[10:32:45] 📨 NOVA MENSAGEM RECEBIDA!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "id": "uuid-123",
  "ticketId": "ticket-uuid",
  "tipo": "TEXTO",
  "remetente": "CLIENTE",
  "conteudo": "Olá, preciso de ajuda",
  "createdAt": "2025-10-12T10:32:45.000Z"
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[10:32:45] 👂 Aguardando próximas notificações...
```

---

## 🧪 Testes Manuais

### Teste 1: Enviar Mensagem de Texto

**Ação**: Envie uma mensagem de texto via WhatsApp para o número configurado

**Mensagem sugerida**: 
```
Olá, preciso de ajuda com faturamento
```

**Verificações:**
1. ✅ Webhook recebido (verificar logs do backend)
2. ✅ Ticket criado automaticamente
3. ✅ Mensagem salva no banco
4. ✅ Notificação WebSocket enviada
5. ✅ Resposta automática da IA (se configurada)

**Logs esperados no backend:**
```
[NestJS] Log   📱 Processando mensagem do WhatsApp...
[NestJS] Log   📩 Nova mensagem recebida
[NestJS] Log      De: 5511999999999
[NestJS] Log      Tipo: text
[NestJS] Log      Conteúdo: Olá, preciso de ajuda...
[NestJS] Log   📱 Canal encontrado: WhatsApp Suporte
[NestJS] Log   🎫 Ticket: abc-123 (Número: 000001)
[NestJS] Log   💾 Mensagem salva: msg-123
[NestJS] Log   🔔 Notificação enviada via WebSocket
[NestJS] Log   🤖 Acionando IA para resposta automática
[NestJS] Log   ✅ Resposta automática enviada!
[NestJS] Log   ✅ Mensagem processada
```

---

### Teste 2: Reutilizar Ticket Existente

**Ação**: Envie outra mensagem do mesmo número

**Mensagem sugerida**: 
```
Continuo aguardando retorno
```

**Verificações:**
1. ✅ Nenhum novo ticket criado
2. ✅ Mensagem adicionada ao ticket existente
3. ✅ Campo `ultima_mensagem_em` atualizado

---

### Teste 3: Enviar Mídia (Imagem)

**Ação**: Envie uma imagem via WhatsApp

**Verificações:**
1. ✅ Tipo de mensagem = `IMAGEM`
2. ✅ Campo `midia` (JSONB) contém metadados:
   - `id`: ID da mídia no WhatsApp
   - `mime_type`: tipo MIME (image/jpeg)
   - `sha256`: hash da imagem
   - `caption`: legenda (se houver)

---

### Teste 4: Múltiplos Clientes Simultâneos

**Ação**: Envie mensagens de 3 números diferentes

**Verificações:**
1. ✅ 3 tickets diferentes criados
2. ✅ Cada ticket com seu próprio histórico de mensagens
3. ✅ Nenhuma mensagem misturada entre tickets

---

## 🗄️ Verificação no Banco de Dados

### Conectar ao PostgreSQL

```powershell
# Via Docker
docker exec -it conectcrm-postgres psql -U postgres -d conectcrm

# Ou via psql local
psql -h localhost -p 5432 -U postgres -d conectcrm
```

### Executar Queries de Verificação

```sql
-- Copiar e colar as queries do arquivo:
-- test-verificacao-tickets.sql

-- Ou executar via arquivo:
\i C:/Projetos/conectcrm/backend/test-verificacao-tickets.sql
```

### Verificação Rápida

```sql
-- Status geral do sistema
SELECT 
    (SELECT COUNT(*) FROM atendimento_tickets WHERE origem = 'WHATSAPP') as total_tickets,
    (SELECT COUNT(*) FROM atendimento_tickets WHERE origem = 'WHATSAPP' AND status = 'ABERTO') as tickets_abertos,
    (SELECT COUNT(*) FROM atendimento_mensagens m JOIN atendimento_tickets t ON m.ticket_id = t.id WHERE t.origem = 'WHATSAPP') as total_mensagens;
```

---

## 🎯 Cenários de Teste

### Cenário 1: Novo Cliente - Primeira Mensagem
**Objetivo**: Verificar criação automática de ticket

| Passo | Ação | Resultado Esperado |
|-------|------|-------------------|
| 1 | Enviar mensagem de novo número | Ticket criado com status ABERTO |
| 2 | Verificar banco de dados | Registro em `atendimento_tickets` |
| 3 | Verificar mensagem salva | Registro em `atendimento_mensagens` |
| 4 | Verificar campos | `contato_telefone`, `contato_nome`, `data_abertura` preenchidos |

---

### Cenário 2: Cliente Retornando - Ticket Aberto
**Objetivo**: Verificar reutilização de ticket

| Passo | Ação | Resultado Esperado |
|-------|------|-------------------|
| 1 | Enviar nova mensagem do mesmo número | Nenhum novo ticket criado |
| 2 | Verificar banco de dados | Apenas 1 ticket aberto para o número |
| 3 | Verificar mensagens | Nova mensagem adicionada ao ticket existente |
| 4 | Verificar timestamp | `ultima_mensagem_em` atualizado |

---

### Cenário 3: Resposta Automática IA
**Objetivo**: Verificar funcionamento da IA

| Passo | Ação | Resultado Esperado |
|-------|------|-------------------|
| 1 | Enviar mensagem de texto | Mensagem do cliente salva |
| 2 | Aguardar 2-5 segundos | Resposta da IA gerada |
| 3 | Verificar WhatsApp | Resposta recebida no celular |
| 4 | Verificar banco | Mensagem com remetente = 'BOT' |

---

### Cenário 4: Notificação em Tempo Real
**Objetivo**: Verificar WebSocket funcionando

| Passo | Ação | Resultado Esperado |
|-------|------|-------------------|
| 1 | Executar `test-webhook-websocket.js` | Conectado ao WebSocket |
| 2 | Enviar mensagem via WhatsApp | Notificação recebida imediatamente |
| 3 | Verificar console | Dados da mensagem exibidos |
| 4 | Verificar latência | < 500ms |

---

## 🔧 Troubleshooting

### ❌ Erro: "Canal não encontrado"

**Causa**: `phone_number_id` não configurado ou incorreto

**Solução**:
1. Verificar configuração do canal:
```sql
SELECT id, nome, tipo, configuracao
FROM canais
WHERE tipo = 'whatsapp' AND ativo = true;
```

2. Atualizar `phone_number_id`:
```sql
UPDATE canais
SET configuracao = jsonb_set(
    configuracao,
    '{credenciais,whatsapp_phone_number_id}',
    '"SEU_PHONE_NUMBER_ID"'
)
WHERE id = 'CANAL_ID';
```

---

### ❌ Erro: "Ticket não criado"

**Causa**: Erro na integração ou serviço

**Solução**:
1. Verificar logs do backend
2. Verificar se TicketService está registrado:
```typescript
// backend/src/modules/atendimento/atendimento.module.ts
providers: [..., TicketService, ...]
```

3. Recompilar backend:
```powershell
cd C:\Projetos\conectcrm\backend
npm run build
npm run start:dev
```

---

### ❌ Erro: "WebSocket não conecta"

**Causa**: Autenticação ou configuração incorreta

**Solução**:
1. Verificar token válido
2. Verificar CORS habilitado
3. Verificar firewall/antivírus

---

### ❌ Mensagens duplicadas

**Causa**: Webhook processado múltiplas vezes

**Solução**:
1. Verificar `idExterno` único:
```sql
SELECT id_externo, COUNT(*)
FROM atendimento_mensagens
GROUP BY id_externo
HAVING COUNT(*) > 1;
```

2. Adicionar constraint de unicidade (se necessário):
```sql
CREATE UNIQUE INDEX idx_mensagens_id_externo 
ON atendimento_mensagens(id_externo) 
WHERE id_externo IS NOT NULL;
```

---

## 📊 Métricas de Sucesso

### ✅ Sistema Funcionando Corretamente Se:

1. **Criação de Tickets**: Taxa de sucesso > 99%
2. **Tempo de Resposta**: Webhook processado < 2 segundos
3. **Reutilização**: Tickets reutilizados corretamente
4. **IA**: Respostas geradas < 5 segundos
5. **WebSocket**: Latência < 500ms
6. **Persistência**: 100% das mensagens salvas no banco

---

## 📝 Relatório de Teste

### Template

```markdown
# Relatório de Teste - [DATA]

## Ambiente
- Backend: http://localhost:3001
- Database: conectcrm-postgres
- Canal: [NOME_DO_CANAL]

## Resultados

### Cenário 1: Novo Cliente
- ✅ Ticket criado: #000001
- ✅ Mensagem salva: msg-123
- ✅ Tempo de processamento: 1.2s

### Cenário 2: Reutilização
- ✅ Ticket reutilizado corretamente
- ✅ Nova mensagem adicionada

### Cenário 3: IA
- ✅ Resposta gerada em 3.5s
- ✅ Mensagem enviada com sucesso

### Cenário 4: WebSocket
- ✅ Notificação recebida em 245ms
- ✅ Dados corretos

## Métricas Finais
- Taxa de sucesso: 100%
- Tempo médio de resposta: 1.8s
- Total de tickets testados: 5
- Total de mensagens: 12

## Observações
[Notas adicionais]
```

---

## 🎉 Próximos Passos

Após validar todos os testes:

1. ✅ Integrar frontend com WebSocket
2. ✅ Implementar dashboard de atendimento
3. ✅ Adicionar filtros e busca avançada
4. ✅ Configurar alertas e notificações
5. ✅ Implementar métricas e relatórios

---

## 📞 Suporte

Problemas ou dúvidas? Verifique:
- Logs do backend: `C:\Projetos\conectcrm\backend\logs`
- Documentação do sistema: `C:\Projetos\conectcrm\docs`
- Issues no GitHub: [Se aplicável]
