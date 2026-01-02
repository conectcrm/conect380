# 🧪 TESTE COMPLETO: Fluxo de Atendimento (Bot → Atendente → Finalização)

**Data**: 10 de novembro de 2025  
**Objetivo**: Validar 100% do sistema de atendimento  
**Duração**: ~10 minutos

---

## 📋 PRÉ-REQUISITOS VERIFICADOS

### ✅ Sistema Operacional
```
Backend: 🟢 Rodando (porta 3001)
Frontend: 🟢 Rodando (porta 3000)
Database: 🟢 Conectado (porta 5434)
```

### ✅ Componentes Ativos
```
Canal WhatsApp:
  ID: ca89bf00-9e73-47a1-8dd0-1bfd2ed5ece7
  Status: ✅ ATIVO
  Phone: 704423209430762

Núcleos Visíveis no Bot:
  ✅ Suporte Técnico
  ✅ Comercial
  ✅ Financeiro
```

### ⚠️ IMPORTANTE: Criar Atendente de Teste
```
Status Atual: Nenhum atendente disponível
Ação Necessária: Criar/ativar pelo menos 1 atendente
```

---

## 🎯 FASE 1: Preparação do Ambiente

### Passo 1.1: Criar Atendente de Teste

**Opção A - Via Interface (Recomendado)**:
```
1. Acessar: http://localhost:3000/nuclei/atendimento/equipes
2. Clicar: "Nova Equipe"
3. Nome: "Equipe Teste"
4. Adicionar membros (usuários existentes)
5. Salvar

OU

1. Acessar: http://localhost:3000/nuclei/configuracoes/usuarios
2. Selecionar usuário existente
3. Ativar como atendente
4. Definir núcleo: "Suporte Técnico"
5. Max atendimentos: 5
6. Salvar
```

**Opção B - Via SQL (Rápido)**:
```sql
-- Verificar usuários existentes
SELECT id, nome, email FROM users LIMIT 5;

-- Tornar usuário atendente (substitua USER_ID)
INSERT INTO atendimento_atendentes (
  id,
  usuario_id,
  nucleo_id,
  status,
  disponivel,
  max_atendimentos_simultaneos,
  atendimentos_atuais
) VALUES (
  gen_random_uuid(),
  'USER_ID_AQUI',  -- ← Substituir pelo ID do usuário
  '22222222-3333-4444-5555-666666666661',  -- Suporte Técnico
  'online',
  true,
  5,
  0
);
```

### Passo 1.2: Verificar Atendente Criado
```sql
SELECT 
  u.nome as atendente,
  n.nome as nucleo,
  a.status,
  a.disponivel,
  a.atendimentos_atuais,
  a.max_atendimentos_simultaneos
FROM atendimento_atendentes a
JOIN users u ON a.usuario_id = u.id
JOIN nucleos_atendimento n ON a.nucleo_id = n.id
WHERE a.disponivel = true;
```

**Resultado Esperado**:
```
atendente | nucleo           | status | disponivel | atuais | max
----------|------------------|--------|------------|--------|----
João      | Suporte Técnico  | online | t          | 0      | 5
```

---

## 🤖 FASE 2: Teste do Bot (Webhook)

### Passo 2.1: Simular Webhook da Meta

**Criar arquivo de teste**: `test-webhook.json`
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "1922786858561358",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15550001234",
          "phone_number_id": "704423209430762"
        },
        "contacts": [{
          "profile": {
            "name": "Cliente Teste"
          },
          "wa_id": "5511999887766"
        }],
        "messages": [{
          "from": "5511999887766",
          "id": "wamid.test123",
          "timestamp": "1699632000",
          "text": {
            "body": "Olá"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Passo 2.2: Enviar Webhook para Backend
```powershell
# Via PowerShell
$body = Get-Content test-webhook.json -Raw
Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{ "X-Hub-Signature-256" = "sha256=<ASSINATURA_VALIDA>" }
```

**OU via curl (Git Bash)**:
```bash
curl -X POST http://localhost:3001/api/atendimento/webhooks/whatsapp/<ID_EMPRESA> \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=<ASSINATURA_VALIDA>" \
  -d @test-webhook.json
```

### Passo 2.3: Verificar Resposta do Bot

**Backend Logs** (ver terminal do backend):
```
[WhatsappWebhookService] Webhook recebido
[WhatsappWebhookService] Phone Number ID: 704423209430762
[WhatsappWebhookService] Canal encontrado: ca89bf00-9e73-47a1-8dd0-1bfd2ed5ece7
[TriagemBotService] Processando mensagem: "Olá"
[TriagemBotService] Cliente novo, iniciando conversa
[WhatsappInteractiveService] Enviando menu interativo
```

**Verificar no Banco**:
```sql
-- Contato criado?
SELECT * FROM atendimento_contatos 
WHERE telefone = '5511999887766'
ORDER BY created_at DESC LIMIT 1;

-- Conversa criada?
SELECT * FROM atendimento_conversas 
WHERE contato_id IN (
  SELECT id FROM atendimento_contatos WHERE telefone = '5511999887766'
)
ORDER BY created_at DESC LIMIT 1;

-- Mensagem recebida?
SELECT * FROM atendimento_mensagens 
WHERE conversa_id IN (
  SELECT id FROM atendimento_conversas 
  WHERE contato_id IN (
    SELECT id FROM atendimento_contatos WHERE telefone = '5511999887766'
  )
)
ORDER BY created_at DESC LIMIT 3;
```

**Resultado Esperado**:
```
✅ Contato criado: Cliente Teste (5511999887766)
✅ Conversa iniciada
✅ Mensagem "Olá" salva
✅ Bot respondeu com menu (se configurado para enviar via API)
```

---

## 🎫 FASE 3: Criação e Distribuição de Ticket

### Passo 3.1: Cliente Escolhe Opção do Menu

Simular resposta do cliente escolhendo "1" (Suporte Técnico):

**Arquivo**: `test-webhook-opcao.json`
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "1922786858561358",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15550001234",
          "phone_number_id": "704423209430762"
        },
        "contacts": [{
          "profile": {
            "name": "Cliente Teste"
          },
          "wa_id": "5511999887766"
        }],
        "messages": [{
          "from": "5511999887766",
          "id": "wamid.test456",
          "timestamp": "1699632060",
          "text": {
            "body": "1"
          },
          "type": "text",
          "context": {
            "from": "15550001234",
            "id": "wamid.test123"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

Enviar:
```powershell
$body = Get-Content test-webhook-opcao.json -Raw
Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{ "X-Hub-Signature-256" = "sha256=<ASSINATURA_VALIDA>" }
```

### Passo 3.2: Verificar Criação do Ticket

**Backend Logs**:
```
[TriagemBotService] Opção escolhida: 1 (Suporte Técnico)
[TriagemBotService] Criando ticket
[TicketService] Ticket criado: #12345
[DistribuicaoService] Distribuindo ticket para núcleo: Suporte Técnico
[DistribuicaoService] Atendente disponível encontrado
[TicketService] Ticket atribuído ao atendente: João
```

**Verificar no Banco**:
```sql
-- Ticket criado?
SELECT 
  t.id,
  t.numero_ticket,
  t.status,
  t.prioridade,
  n.nome as nucleo,
  u.nome as atendente,
  c.nome as cliente
FROM atendimento_tickets t
JOIN nucleos_atendimento n ON t.nucleo_id = n.id
LEFT JOIN users u ON t.atendente_id = u.id
JOIN atendimento_contatos c ON t.contato_id = c.id
WHERE c.telefone = '5511999887766'
ORDER BY t.created_at DESC LIMIT 1;
```

**Resultado Esperado**:
```
id: uuid-do-ticket
numero_ticket: #12345
status: em_atendimento
prioridade: media
nucleo: Suporte Técnico
atendente: João
cliente: Cliente Teste
```

---

## 💬 FASE 4: Chat em Tempo Real (Atendente ↔ Cliente)

### Passo 4.1: Acessar Interface de Chat

```
1. Abrir navegador: http://localhost:3000
2. Fazer login como atendente (João)
3. Navegar para: Chat de Atendimento
4. Verificar: Ticket #12345 deve aparecer na lista
5. Clicar no ticket para abrir
```

**Verificações na Interface**:
```
✅ Ticket aparece na lista de "Em Atendimento"
✅ Histórico de mensagens carregado
✅ Mensagens "Olá" e "1" visíveis
✅ Indicador de online do cliente
✅ Campo de digitação habilitado
```

### Passo 4.2: Atendente Envia Mensagem

Na interface:
```
1. Digitar: "Olá! Sou o João, como posso ajudar?"
2. Clicar em "Enviar" ou pressionar Enter
3. Aguardar confirmação
```

**Backend deve processar**:
```
[ChatGateway] Mensagem recebida do atendente
[WhatsappInteractiveService] Enviando via API da Meta
[WhatsappInteractiveService] Mensagem enviada com sucesso
[ChatGateway] Emitindo mensagem para frontend (Socket.io)
```

**Verificar no Banco**:
```sql
SELECT 
  m.id,
  m.conteudo,
  m.direcao,
  m.tipo,
  m.status,
  m.created_at
FROM atendimento_mensagens m
JOIN atendimento_conversas c ON m.conversa_id = c.id
JOIN atendimento_contatos ct ON c.contato_id = ct.id
WHERE ct.telefone = '5511999887766'
ORDER BY m.created_at DESC LIMIT 5;
```

**Resultado Esperado**:
```
Mensagens:
1. "Olá" (entrada, cliente)
2. "1" (entrada, cliente)
3. "Olá! Sou o João..." (saida, atendente) ← Nova mensagem
```

### Passo 4.3: Simular Resposta do Cliente

```powershell
# Arquivo: test-webhook-resposta.json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "1922786858561358",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "phone_number_id": "704423209430762"
        },
        "messages": [{
          "from": "5511999887766",
          "id": "wamid.test789",
          "timestamp": "1699632120",
          "text": {
            "body": "Preciso de ajuda com o sistema de login"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}

# Enviar
$body = Get-Content test-webhook-resposta.json -Raw
Invoke-RestMethod -Uri "http://localhost:3001/api/atendimento/webhooks/whatsapp/<ID_EMPRESA>" `
  -Method Post `
  -Body $body `
  -ContentType "application/json" `
  -Headers @{ "X-Hub-Signature-256" = "sha256=<ASSINATURA_VALIDA>" }
```

**Verificar na Interface**:
```
✅ Mensagem aparece INSTANTANEAMENTE no chat (Socket.io)
✅ Som de notificação (se configurado)
✅ Contador de mensagens não lidas (se estava em outro ticket)
```

### Passo 4.4: Continuação do Atendimento

Simular troca de mensagens:
```
Atendente: "Entendo. Você está conseguindo acessar a tela de login?"
Cliente: "Sim, mas quando coloco a senha, dá erro"
Atendente: "Vou resetar sua senha. Um momento..."
Atendente: "Pronto! Enviamos nova senha por email. Pode tentar?"
Cliente: "Funcionou! Muito obrigado!"
```

---

## ✅ FASE 5: Finalização do Atendimento

### Passo 5.1: Marcar Ticket como Resolvido

Na interface:
```
1. No chat ativo, localizar botão "Finalizar Atendimento"
2. Clicar no botão
3. Modal aparece solicitando:
   - Motivo do fechamento (dropdown)
   - Observações (textarea)
   - Avaliação (opcional)
4. Selecionar: "Problema Resolvido"
5. Observações: "Senha resetada com sucesso"
6. Clicar: "Confirmar Finalização"
```

**Backend Processa**:
```
[TicketService] Finalizando ticket #12345
[TicketService] Status alterado: em_atendimento → resolvido
[TicketService] Atendente liberado para novo atendimento
[DistribuicaoService] Atendente disponível: João (4/5 slots)
[NotificacaoService] Enviando mensagem de feedback para cliente
```

### Passo 5.2: Verificar Ticket Finalizado

```sql
SELECT 
  t.numero_ticket,
  t.status,
  t.created_at,
  t.updated_at,
  t.closed_at,
  t.tempo_total,
  t.tempo_primeira_resposta,
  u.nome as atendente,
  t.motivo_fechamento,
  t.observacoes_fechamento
FROM atendimento_tickets t
LEFT JOIN users u ON t.atendente_id = u.id
WHERE t.numero_ticket = '#12345';
```

**Resultado Esperado**:
```
numero_ticket: #12345
status: resolvido ✅
created_at: 2025-11-10 13:00:00
updated_at: 2025-11-10 13:15:00
closed_at: 2025-11-10 13:15:00
tempo_total: 15 minutos
tempo_primeira_resposta: 30 segundos
atendente: João
motivo_fechamento: Problema Resolvido
observacoes_fechamento: Senha resetada com sucesso
```

### Passo 5.3: Verificar Métricas

```sql
-- SLA atendido?
SELECT 
  COUNT(*) FILTER (WHERE tempo_primeira_resposta <= '00:05:00') as dentro_sla,
  COUNT(*) FILTER (WHERE tempo_primeira_resposta > '00:05:00') as fora_sla
FROM atendimento_tickets
WHERE created_at >= CURRENT_DATE;

-- Performance do atendente
SELECT 
  u.nome,
  COUNT(t.id) as total_atendimentos,
  AVG(EXTRACT(EPOCH FROM t.tempo_total)/60) as tempo_medio_minutos,
  COUNT(*) FILTER (WHERE t.status = 'resolvido') as resolvidos
FROM atendimento_tickets t
JOIN users u ON t.atendente_id = u.id
WHERE t.created_at >= CURRENT_DATE
GROUP BY u.id, u.nome;
```

---

## 📊 FASE 6: Validação Completa

### Checklist Final

**1. Bot Funcionando** ✅/❌
- [ ] Webhook recebe mensagens
- [ ] Bot identifica cliente novo
- [ ] Menu de opções enviado
- [ ] Opção do cliente processada corretamente

**2. Criação de Ticket** ✅/❌
- [ ] Ticket criado automaticamente
- [ ] Número sequencial gerado (#12345)
- [ ] Núcleo correto atribuído
- [ ] Prioridade definida

**3. Distribuição** ✅/❌
- [ ] Atendente disponível encontrado
- [ ] Ticket atribuído ao atendente
- [ ] Notificação enviada ao atendente
- [ ] Status alterado para "em_atendimento"

**4. Chat em Tempo Real** ✅/❌
- [ ] Mensagens do cliente chegam no sistema
- [ ] Mensagens do atendente enviadas via WhatsApp
- [ ] Socket.io funcionando (atualização instantânea)
- [ ] Histórico completo salvo no banco

**5. Finalização** ✅/❌
- [ ] Ticket finalizado com sucesso
- [ ] Status alterado para "resolvido"
- [ ] Métricas calculadas (tempo total, TMP)
- [ ] Atendente liberado para novos atendimentos

**6. Métricas e Relatórios** ✅/❌
- [ ] SLA calculado corretamente
- [ ] Tempo de primeira resposta registrado
- [ ] Tempo total de atendimento correto
- [ ] Dashboard atualizado com novos dados

---

## 🎯 Resultado Final Esperado

```
╔══════════════════════════════════════════════════════╗
║       TESTE COMPLETO DE ATENDIMENTO - SUCESSO        ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  ✅ Bot WhatsApp Funcionando                         ║
║  ✅ Webhook Processando Mensagens                    ║
║  ✅ Tickets Criados Automaticamente                  ║
║  ✅ Distribuição Inteligente Ativa                   ║
║  ✅ Chat em Tempo Real Operacional                   ║
║  ✅ Mensagens Bidirecionais (↔) Funcionando         ║
║  ✅ Finalização e Métricas OK                        ║
║  ✅ Socket.io Conectado                              ║
║  ✅ Banco de Dados Consistente                       ║
║                                                      ║
║  Sistema: 🟢 100% OPERACIONAL                        ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

---

## 🐛 Troubleshooting

### Problema: Bot não responde ao webhook
**Solução**:
```sql
-- Verificar se canal está ativo
SELECT * FROM atendimento_canais WHERE tipo = 'whatsapp';

-- Verificar logs do backend
cd backend && npm run start:dev
```

### Problema: Ticket não é criado
**Solução**:
```sql
-- Verificar núcleos visíveis
SELECT * FROM nucleos_atendimento WHERE visivel_no_bot = true;

-- Verificar fluxos ativos
SELECT * FROM bot_fluxos WHERE ativo = true;
```

### Problema: Nenhum atendente disponível
**Solução**:
```sql
-- Ver atendentes
SELECT * FROM atendimento_atendentes;

-- Ativar atendente
UPDATE atendimento_atendentes 
SET disponivel = true, status = 'online' 
WHERE usuario_id = 'USER_ID';
```

### Problema: Mensagens não aparecem em tempo real
**Solução**:
```javascript
// Frontend - Verificar Socket.io
// Abrir Console (F12)
console.log('Socket conectado:', socket.connected);

// Backend - Verificar Gateway
[ChatGateway] Cliente conectado: socket-id-123
```

---

## 📝 Comandos Rápidos

```powershell
# Ver tickets de hoje
$env:PGPASSWORD='conectcrm123'; psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -c "SELECT numero_ticket, status, created_at FROM atendimento_tickets WHERE created_at >= CURRENT_DATE ORDER BY created_at DESC;"

# Ver mensagens recentes
$env:PGPASSWORD='conectcrm123'; psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -c "SELECT conteudo, direcao, created_at FROM atendimento_mensagens ORDER BY created_at DESC LIMIT 10;"

# Ver atendentes disponíveis
$env:PGPASSWORD='conectcrm123'; psql -h localhost -p 5434 -U conectcrm -d conectcrm_db -c "SELECT u.nome, a.status, a.disponivel, a.atendimentos_atuais FROM atendimento_atendentes a JOIN users u ON a.usuario_id = u.id WHERE a.disponivel = true;"
```

---

**Tempo Total do Teste**: ~10-15 minutos  
**Complexidade**: Média  
**Pré-requisito**: Pelo menos 1 atendente disponível  
**Resultado**: Sistema 100% validado ✅
