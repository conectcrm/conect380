# 🚀 GUIA DE INICIALIZAÇÃO RÁPIDA - MÓDULO OMNICHANNEL

## ⚡ Quick Start (5 minutos)

### **1. Instalar Redis (necessário para BullMQ)**

#### **Windows (via Chocolatey):**
```powershell
choco install redis-64
redis-server
```

#### **Windows (via Docker):**
```powershell
docker run -d -p 6379:6379 --name redis redis:alpine
```

#### **Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Mac
brew install redis
brew services start redis
```

### **2. Configurar Variáveis de Ambiente**

Adicione ao arquivo `.env` do backend:

```env
# ============================================
# ATENDIMENTO OMNICHANNEL
# ============================================

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI (obrigatório)
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini

# Anthropic (opcional)
ANTHROPIC_API_KEY=sk-ant-...

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=meu-token-secreto

# Telegram Bot (opcional)
TELEGRAM_BOT_TOKEN=123456:ABCdefGHIjklMNOpqrsTUVwxyz

# Twilio (opcional)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+5511999999999

# SendGrid (opcional)
SENDGRID_API_KEY=SG.xxxxxxxxxx
EMAIL_FROM=noreply@conectcrm.com

# AWS SES (opcional)
SES_ACCESS_KEY_ID=AKIAxxxxxxxxxx
SES_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxx
SES_REGION=us-east-1

# SMTP Genérico (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha
```

### **3. Executar Migration**

```bash
cd backend
npm run migration:run
```

**Resultado esperado:**
```
Migration CreateAtendimentoTables1728518400000 has been executed successfully.
```

### **4. Iniciar Backend**

```bash
npm run start:dev
```

### **5. Verificar se está funcionando**

```bash
# Testar endpoint de tickets
curl http://localhost:3000/atendimento/tickets \
  -H "Authorization: Bearer SEU_JWT_TOKEN"

# Resposta esperada:
# { "success": true, "data": [], "total": 0 }
```

---

## 🎯 **PRIMEIROS PASSOS**

### **Passo 1: Criar um Canal**

```bash
curl -X POST http://localhost:3000/atendimento/canais \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "WhatsApp Suporte",
    "tipo": "whatsapp_business",
    "descricao": "Canal principal de atendimento",
    "aiAutomatica": true
  }'
```

### **Passo 2: Configurar Integração do WhatsApp**

```bash
curl -X POST http://localhost:3000/atendimento/integracoes \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "whatsapp_business",
    "credenciais": {
      "phone_number_id": "SEU_PHONE_NUMBER_ID",
      "access_token": "SEU_ACCESS_TOKEN",
      "webhook_verify_token": "SEU_WEBHOOK_TOKEN"
    },
    "webhookUrl": "https://seu-dominio.com/api/atendimento/webhooks/whatsapp/CANAL_ID"
  }'
```

### **Passo 3: Criar uma Fila**

```bash
curl -X POST http://localhost:3000/atendimento/filas \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Fila Geral",
    "descricao": "Atendimento geral",
    "prioridade": 1,
    "slaMinutos": 30
  }'
```

### **Passo 4: Criar um Atendente**

```bash
curl -X POST http://localhost:3000/atendimento/atendentes \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@empresa.com",
    "telefone": "+5511999999999",
    "status": "online"
  }'
```

### **Passo 5: Atribuir Atendente à Fila**

```bash
curl -X POST http://localhost:3000/atendimento/filas/FILA_ID/atendentes \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "atendenteId": "ATENDENTE_ID",
    "capacidadeMaxima": 10
  }'
```

### **Passo 6: Ativar o Canal**

```bash
curl -X POST http://localhost:3000/atendimento/canais/CANAL_ID/ativar \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

---

## 🎨 **TESTAR FUNCIONALIDADES**

### **1. Criar um Ticket Manualmente**

```bash
curl -X POST http://localhost:3000/atendimento/tickets \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "canalId": "CANAL_ID",
    "contatoExterno": "+5511999998888",
    "filaId": "FILA_ID",
    "prioridade": "normal",
    "assunto": "Dúvida sobre produto"
  }'
```

### **2. Enviar uma Mensagem**

```bash
curl -X POST http://localhost:3000/atendimento/mensagens/enviar \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ticketId": "TICKET_ID",
    "conteudo": "Olá! Como posso ajudar você hoje?"
  }'
```

### **3. Listar Tickets**

```bash
curl http://localhost:3000/atendimento/tickets?status=aguardando \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

### **4. Ver Detalhes do Ticket (com AI Insights)**

```bash
curl http://localhost:3000/atendimento/tickets/TICKET_ID \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

---

## 🔌 **TESTAR WEBSOCKET**

### **Frontend (React/TypeScript):**

```typescript
import io from 'socket.io-client';

// Conectar ao WebSocket
const socket = io('http://localhost:3000/atendimento', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Eventos de conexão
socket.on('connect', () => {
  console.log('✅ Conectado ao WebSocket');
});

socket.on('disconnect', () => {
  console.log('❌ Desconectado');
});

// Entrar na sala de um ticket
socket.emit('entrar_ticket', { ticketId: 'TICKET_ID' });

// Escutar novas mensagens
socket.on('nova_mensagem', (mensagem) => {
  console.log('📨 Nova mensagem:', mensagem);
  // Atualizar interface
});

// Escutar atualizações de ticket
socket.on('ticket_atualizado', (ticket) => {
  console.log('🔄 Ticket atualizado:', ticket);
});

// Escutar quando atendente está digitando
socket.on('atendente_digitando', (data) => {
  console.log('⌨️ Digitando...', data.atendenteNome);
});

// Notificar que está digitando
const digitando = () => {
  socket.emit('digitando', {
    ticketId: 'TICKET_ID',
    atendenteNome: 'João'
  });
};

// Mudar status
const mudarStatus = (status) => {
  socket.emit('atualizar_status', { status });
};
```

---

## 🤖 **TESTAR IA**

### **1. Adicionar Conhecimento à Base (RAG)**

```bash
curl -X POST http://localhost:3000/atendimento/base-conhecimento \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Como funciona o produto X",
    "conteudo": "O produto X é uma solução completa que permite...",
    "categoria": "produtos",
    "tags": ["produto-x", "tutorial"]
  }'
```

### **2. Testar Análise de Sentimento**

O sistema analisa automaticamente cada mensagem. Para ver o resultado:

```bash
curl http://localhost:3000/atendimento/tickets/TICKET_ID \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

Retorna com `aiInsights`:
```json
{
  "sentimento": {
    "sentimento": "positivo",
    "score": 0.85,
    "analise": "Cliente demonstra satisfação..."
  }
}
```

### **3. Ver Predição de Churn**

```bash
curl http://localhost:3000/atendimento/ai/churn/TICKET_ID \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

---

## 📊 **MONITORAR O SISTEMA**

### **1. Estatísticas Gerais**

```bash
curl http://localhost:3000/atendimento/tickets/estatisticas/geral \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

### **2. Verificar Filas (BullMQ)**

Instale o Bull Board para visualizar as filas:

```bash
npm install @bull-board/express @bull-board/api
```

### **3. Logs do Backend**

```bash
# Ver logs em tempo real
npm run start:dev

# Os logs mostrarão:
# - Mensagens processadas
# - Análises de IA executadas
# - Webhooks recebidos
# - Erros e avisos
```

---

## 🔧 **CONFIGURAR WEBHOOKS**

### **WhatsApp Business API:**

1. Acesse o Facebook Developer Console
2. Vá em WhatsApp > Configuration
3. Configure o webhook:
  - URL: `https://seu-dominio.com/api/atendimento/webhooks/whatsapp/CANAL_ID`
   - Verify Token: O token definido nas integrações
   - Subscribe to: messages, message_status

### **Telegram:**

O webhook é configurado automaticamente ao ativar o canal.

### **Twilio:**

1. Acesse o Twilio Console
2. Vá em Phone Numbers > Active Numbers
3. Configure:
   - A Message Comes In: `https://seu-dominio.com/webhooks/twilio/CANAL_ID`
   - Status Callback URL: mesma URL

---

## 🐛 **TROUBLESHOOTING**

### **Redis não está rodando:**
```bash
# Verificar se Redis está ativo
redis-cli ping
# Deve retornar: PONG

# Se não funcionar, iniciar Redis
redis-server
```

### **Migration já foi executada:**
```bash
# Verificar migrations executadas
npm run migration:show

# Reverter se necessário
npm run migration:revert
```

### **Erro de autenticação OpenAI:**
```bash
# Verificar se a chave está correta
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### **WebSocket não conecta:**
- Verificar se o backend está rodando na porta correta
- Verificar CORS no backend
- Verificar se o token JWT é válido

### **Canal não ativa:**
- Verificar se as credenciais estão corretas
- Verificar logs do backend para erro específico
- Testar credenciais diretamente na API do canal

---

## 📚 **RECURSOS ADICIONAIS**

### **Documentação Completa:**
- `docs/implementation/OMNICHANNEL_COMPLETO.md`

### **Postman Collection:**
Importe a collection para testar todos os endpoints facilmente.

### **Exemplos de Código:**
- Frontend React: Ver documentação completa
- WebSocket: Exemplos acima
- Webhooks: Ver adapters em `backend/src/modules/atendimento/channels/`

---

## 🎯 **PRÓXIMAS INTEGRAÇÕES**

### **Adicionar Instagram/Facebook:**
1. Criar adapter `MetaAdapter`
2. Implementar Graph API
3. Configurar webhooks no Facebook

### **Adicionar WhatsApp via Twilio:**
Já suportado! Basta configurar o Twilio com tipo `whatsapp_twilio`.

### **Adicionar Telegram:**
Já implementado! Basta criar o bot e configurar o token.

---

## ✅ **CHECKLIST DE PRODUÇÃO**

Antes de colocar em produção:

- [ ] Redis configurado e estável
- [ ] Variáveis de ambiente em produção
- [ ] SSL/HTTPS configurado
- [ ] Webhooks configurados corretamente
- [ ] Backup do banco de dados
- [ ] Monitoramento configurado (logs, métricas)
- [ ] Testes executados
- [ ] Limite de requisições (rate limiting)
- [ ] Segurança de API keys
- [ ] CORS configurado corretamente

---

## 🆘 **SUPORTE**

Em caso de dúvidas:
1. Verificar documentação completa
2. Verificar logs do backend
3. Verificar exemplos de código
4. Testar endpoints com Postman

---

**Sistema pronto para uso! 🚀**

*Guia atualizado em 10/10/2025*
