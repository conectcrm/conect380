# 🚀 Guia de Acesso Rápido - ConectCRM

## 📱 Sistemas de Atendimento Disponíveis

### 🆕 Sistema Omnichannel (NOVO - Recomendado!)

**URL Principal:**
```
http://localhost:3000/atendimento
```

#### ✨ Características:
- ✅ **WebSocket Nativo** - Comunicação em tempo real
- ✅ **Multi-canal** - WhatsApp, Email, Telegram, Web Chat
- ✅ **IA Integrada** - Respostas automáticas com OpenAI/Azure
- ✅ **Zero Dependência Externa** - 100% desenvolvido internamente
- ✅ **Performance** - Baixa latência, alta disponibilidade

#### 🎯 Como Acessar:

1. **Acesse diretamente**:
   ```
   http://localhost:3000/atendimento
   ```

2. **A interface carrega automaticamente**:
   - Conexão WebSocket automática
   - Lista de tickets na sidebar
   - Chat em tempo real
   - Indicadores de status

3. **Selecione um ticket** e comece a conversar!

---

### 📊 Sistema Legado (Chatwoot)

**URL Principal:**
```
http://localhost:3000/suporte
```

#### ⚠️ Características:
- Integração com Chatwoot (plataforma externa)
- Depende de serviço terceiro
- Configuração mais complexa

**Status**: Mantido para compatibilidade, mas recomendamos o sistema Omnichannel novo.

---

## 🔄 Comparação dos Sistemas

| Recurso | Omnichannel (Novo) | Suporte (Legado) |
|---------|-------------------|------------------|
| **URL** | `/atendimento` | `/suporte` |
| **WebSocket** | ✅ Nativo | ⚠️ Via Chatwoot |
| **IA Integrada** | ✅ OpenAI/Azure | ❌ Não |
| **Multi-canal** | ✅ WhatsApp, Email, etc | ⚠️ Limitado |
| **Dependência Externa** | ❌ Não | ✅ Chatwoot |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Recomendado** | ✅ **SIM** | ⚠️ Legado |

---

## 📋 Funcionalidades do Sistema Omnichannel

| Aba | Descrição | Ícone |
|-----|-----------|-------|
| **Overview** | Status geral do sistema | 📊 |
| **FAQ** | Perguntas frequentes | ❓ |
| **Tutoriais** | Guias em vídeo e texto | 🎥 |
| **Documentação** | Manuais e referências | 📚 |
| **Chat** | Atendimento em tempo real (WebSocket) | 💬 |
| **Tickets** | Gerenciar tickets de suporte | 🎫 |
| **IA Assistente** | Chatbot com IA (OpenAI/Azure) | 🤖 |
| **Métricas IA** | Desempenho do assistente virtual | 📊 |

---

## 🎯 Acesso Direto ao Chat

### Passo a Passo:

1. **Acesse a URL**:
   ```
   http://localhost:3000/suporte
   ```

2. **Clique na aba "Chat"** (ícone de headphone 🎧)

3. **Conexão Automática**: O WebSocket conectará automaticamente ao backend

4. **Selecione um Ticket**: Clique em um ticket da lista lateral

5. **Comece a Conversar**: Digite e envie mensagens em tempo real!

---

## 🔌 Componentes Integrados

### Frontend (React)

| Componente | Arquivo | Função |
|------------|---------|--------|
| `ChatWindow` | `components/chat/ChatWindow.tsx` | Interface principal do chat |
| `TicketList` | `components/chat/TicketList.tsx` | Lista de tickets |
| `MessageList` | `components/chat/MessageList.tsx` | Histórico de mensagens |
| `MessageInput` | `components/chat/MessageInput.tsx` | Envio de mensagens |
| `TypingIndicator` | `components/chat/TypingIndicator.tsx` | Indicador "digitando..." |
| `ChatBotIA` | `components/suporte/ChatBotIA.tsx` | Interface IA |

### Hooks Customizados

| Hook | Arquivo | Função |
|------|---------|--------|
| `useWebSocket` | `hooks/useWebSocket.ts` | Gerenciar conexão WebSocket |
| `useChat` | `hooks/useChat.ts` | Estado global do chat |

---

## 🚀 Como Testar

### Pré-requisitos

1. **Backend rodando**:
   ```bash
   cd backend
   npm run start:dev
   # ou
   npm run build && node dist/src/main.js
   ```
   - ✅ Porta: `3001`
   - ✅ WebSocket: `ws://localhost:3001`

2. **Frontend rodando**:
   ```bash
   cd frontend-web
   npm start
   ```
   - ✅ Porta: `3000`

3. **Banco de Dados**: PostgreSQL rodando

### Testando o Chat

1. **Faça Login** no sistema:
   ```
   http://localhost:3000/login
   ```
   - Email: `admin@conectcrm.com` (exemplo)
   - Senha: `admin123` (exemplo)

2. **Navegue para Suporte**:
   ```
   http://localhost:3000/suporte
   ```

3. **Clique na aba "Chat"**

4. **Verifique a conexão**:
   - Indicador "Online" deve aparecer (bolinha verde)
   - Console do navegador deve mostrar: `[WebSocket] Connected`

5. **Teste o envio de mensagem**:
   - Selecione um ticket
   - Digite uma mensagem
   - Clique em "Enviar"
   - Mensagem deve aparecer instantaneamente

6. **Teste a IA** (se habilitada):
   - Navegue para aba "IA Assistente"
   - Digite uma pergunta
   - Aguarde resposta automática

---

## 🐛 Troubleshooting

### Problema: WebSocket não conecta

**Sintomas**:
- Indicador "Offline" (bolinha vermelha)
- Console: `WebSocket connection failed`

**Solução**:
1. Verifique se backend está rodando na porta `3001`
2. Verifique URL do WebSocket em `.env`:
   ```
   REACT_APP_WS_URL=ws://localhost:3001
   ```
3. Verifique CORS no backend (`main.ts`):
   ```typescript
   app.enableCors({
     origin: 'http://localhost:3000',
     credentials: true,
   });
   ```

### Problema: Lista de tickets vazia

**Sintomas**:
- Sidebar vazia
- Nenhum ticket aparece

**Solução**:
1. Criar tickets no banco de dados
2. Verificar endpoint `GET /tickets`:
   ```bash
   curl http://localhost:3001/tickets -H "Authorization: Bearer {token}"
   ```

### Problema: Mensagens não aparecem

**Sintomas**:
- Mensagem enviada mas não aparece na lista
- WebSocket conectado mas sem resposta

**Solução**:
1. Verificar console do navegador (erros JS)
2. Verificar logs do backend (NestJS)
3. Testar WebSocket manualmente:
   ```javascript
   const ws = new WebSocket('ws://localhost:3001');
   ws.onopen = () => {
     ws.send(JSON.stringify({ event: 'mensagem:enviar', data: {...} }));
   };
   ```

---

## 📊 Monitoramento

### Console do Navegador (DevTools)

Abra o console (`F12`) e procure por:

```
[WebSocket] Connecting to ws://localhost:3001...
[WebSocket] Connected successfully
[Chat] Token configurado: eyJ...
[Chat] Subscribed to events
[ChatWindow] Nova mensagem: { id: '...', conteudo: '...' }
```

### Logs do Backend (NestJS)

Procure por:

```
[Nest] LOG [AtendimentoGateway] Cliente conectado: abc123
[Nest] LOG [AtendimentoGateway] Cliente autenticado: user@email.com
[Nest] LOG [AtendimentoGateway] Mensagem recebida: { ticketId: '...' }
[Nest] LOG [AtendimentoGateway] Mensagem enviada para ticket: ...
```

---

## 🔗 URLs Importantes

| Recurso | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | `http://localhost:3000` | Aplicação React |
| **Login** | `http://localhost:3000/login` | Página de login |
| **Suporte** | `http://localhost:3000/suporte` | Página de atendimento |
| **Backend API** | `http://localhost:3001` | API REST NestJS |
| **WebSocket** | `ws://localhost:3001` | Conexão WebSocket |
| **Swagger** | `http://localhost:3001/api` | Documentação API |

---

## 📚 Documentação Relacionada

| Documento | Descrição |
|-----------|-----------|
| `docs/FRONTEND_CHAT_REALTIME.md` | Documentação completa do chat |
| `docs/websocket-events.md` | Eventos WebSocket disponíveis |
| `docs/IA_CHATBOT_DOCS.md` | Documentação da IA/Chatbot |
| `docs/E2E_TESTS_DOCS.md` | Testes E2E com Playwright |
| `e2e/README.md` | Guia rápido de testes |

---

## 🎨 Interface do Chat

### Layout Principal

```
┌─────────────────────────────────────────────────────────┐
│  ConectCRM - Suporte                                    │
├─────────────────────────────────────────────────────────┤
│  [Overview] [FAQ] [Tutoriais] [Docs] [Chat] [Tickets]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────────────────────────────┐    │
│  │ TICKETS  │  │         CHAT                      │    │
│  │          │  │                                   │    │
│  │ • Ticket │  │  ┌─────────────────────────────┐ │    │
│  │   #001   │  │  │ Cliente: Olá, preciso de    │ │    │
│  │          │  │  │ ajuda                       │ │    │
│  │ • Ticket │  │  └─────────────────────────────┘ │    │
│  │   #002   │  │                                   │    │
│  │          │  │  ┌─────────────────────────────┐ │    │
│  │ • Ticket │  │  │ Você: Como posso ajudar?    │ │    │
│  │   #003   │  │  └─────────────────────────────┘ │    │
│  │          │  │                                   │    │
│  └──────────┘  │  [Digite sua mensagem...] [Enviar]│    │
│                │                                   │    │
│                └───────────────────────────────────┘    │
│                                                          │
│  Status: 🟢 Online | Tickets: 12 | Atendentes: 3        │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Autenticação

### Token JWT

O sistema usa JWT para autenticação:

1. **Login**: `POST /auth/login`
2. **Token**: Armazenado no `localStorage`
3. **WebSocket**: Token enviado no handshake
4. **Validação**: Backend valida token em cada conexão

### Exemplo de Login

```javascript
const response = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@conectcrm.com',
    senha: 'admin123'
  })
});

const { token } = await response.json();
localStorage.setItem('authToken', token);
```

---

## 🌟 Próximos Passos

Após acessar o chat, você pode:

1. ✅ Enviar mensagens em tempo real
2. ✅ Ver indicador "digitando..."
3. ✅ Receber notificações de novas mensagens
4. ✅ Testar IA assistente (se habilitada)
5. ✅ Criar novos tickets
6. ✅ Filtrar tickets por status
7. ✅ Ver métricas de atendimento

---

**✅ Sistema pronto para uso!** 🚀

Para dúvidas, consulte a documentação completa em `docs/`.
