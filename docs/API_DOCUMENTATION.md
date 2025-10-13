# 📡 Documentação de APIs - ConectCRM Omnichannel

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [APIs REST](#apis-rest)
4. [WebSocket Events](#websocket-events)
5. [Códigos de Status](#códigos-de-status)
6. [Exemplos de Uso](#exemplos-de-uso)

---

## 🌐 Visão Geral

### Base URLs

| Ambiente | Backend REST | WebSocket |
|----------|-------------|-----------|
| **Desenvolvimento** | `http://localhost:3001` | `ws://localhost:3001` |
| **Produção** | `https://api.seudominio.com.br` | `wss://api.seudominio.com.br` |

### Formato de Resposta Padrão

```json
{
  "success": true,
  "message": "Mensagem descritiva",
  "data": { ... },
  "total": 10,
  "timestamp": "2025-10-11T12:00:00.000Z"
}
```

---

## 🔐 Autenticação

### POST /auth/login

Realiza login e retorna token JWT.

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@empresa.com",
  "password": "senha123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "usuario@empresa.com",
      "empresa_id": "uuid",
      "role": "admin"
    },
    "expires_in": "7d"
  }
}
```

**Usar token em requisições:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🔌 APIs REST

### 1. Canais

#### GET /atendimento/canais

Lista todos os canais da empresa.

**Headers:**
```http
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "WhatsApp Principal",
      "tipo": "whatsapp",
      "ativo": true,
      "config": {
        "credenciais": {
          "whatsapp_api_token": "EAAxxxxx",
          "whatsapp_phone_number_id": "123456789012345"
        }
      },
      "createdAt": "2025-10-11T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

#### POST /atendimento/canais

Cria um novo canal.

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "nome": "WhatsApp Principal",
  "tipo": "whatsapp",
  "config": {
    "credenciais": {
      "whatsapp_api_token": "EAAxxxxx",
      "whatsapp_phone_number_id": "123456789012345",
      "whatsapp_business_account_id": "987654321098765"
    }
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Canal criado com sucesso",
  "data": {
    "id": "uuid",
    "nome": "WhatsApp Principal",
    "tipo": "whatsapp",
    "ativo": true
  }
}
```

---

#### POST /atendimento/canais/validar

Valida credenciais de integração.

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "tipo": "whatsapp",
  "credenciais": {
    "whatsapp_api_token": "EAAxxxxx",
    "whatsapp_phone_number_id": "123456789012345",
    "whatsapp_business_account_id": "987654321098765"
  }
}
```

**Response (200 OK) - Sucesso:**
```json
{
  "success": true,
  "data": {
    "valido": true,
    "mensagem": "Credenciais válidas! Número: +551199999999 (Verified Name: MinhaEmpresa)",
    "detalhes": {
      "phoneNumber": "+551199999999",
      "verifiedName": "MinhaEmpresa",
      "quality": "GREEN"
    }
  }
}
```

**Response (200 OK) - Falha:**
```json
{
  "success": true,
  "data": {
    "valido": false,
    "mensagem": "Credenciais inválidas: Invalid OAuth access token"
  }
}
```

**Tipos Suportados:**
- `whatsapp` - WhatsApp Business API
- `openai` - OpenAI GPT
- `anthropic` - Anthropic Claude
- `telegram` - Telegram Bot
- `twilio` - Twilio API

---

#### PUT /atendimento/canais/:id

Atualiza um canal existente.

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "nome": "WhatsApp Vendas",
  "ativo": true,
  "config": {
    "credenciais": { ... }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Canal atualizado com sucesso",
  "data": { ... }
}
```

---

#### DELETE /atendimento/canais/:id

Deleta um canal.

**Headers:**
```http
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Canal removido com sucesso"
}
```

---

### 2. Tickets (Atendimentos)

#### GET /atendimento/tickets

Lista tickets da empresa.

**Query Parameters:**
- `status` - Filtrar por status: `aberto`, `em_andamento`, `aguardando_cliente`, `resolvido`, `fechado`
- `filaId` - Filtrar por fila
- `atendenteId` - Filtrar por atendente
- `page` - Página (padrão: 1)
- `limit` - Itens por página (padrão: 20)

**Headers:**
```http
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "numero": 12345,
      "status": "em_andamento",
      "prioridade": "media",
      "assunto": "Dúvida sobre produto",
      "cliente": {
        "id": "uuid",
        "nome": "Maria Santos",
        "telefone": "+5511999999999"
      },
      "atendente": {
        "id": "uuid",
        "nome": "João Silva"
      },
      "fila": {
        "id": "uuid",
        "nome": "Suporte"
      },
      "canal": {
        "id": "uuid",
        "tipo": "whatsapp",
        "nome": "WhatsApp Principal"
      },
      "createdAt": "2025-10-11T12:00:00.000Z",
      "updatedAt": "2025-10-11T12:30:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

#### GET /atendimento/tickets/:id

Busca ticket por ID.

**Headers:**
```http
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "numero": 12345,
    "status": "em_andamento",
    "mensagens": [
      {
        "id": "uuid",
        "conteudo": "Olá, preciso de ajuda",
        "tipo": "texto",
        "direcao": "entrada",
        "lida": true,
        "createdAt": "2025-10-11T12:00:00.000Z"
      }
    ]
  }
}
```

---

#### POST /atendimento/tickets

Cria novo ticket.

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "clienteId": "uuid",
  "filaId": "uuid",
  "canalId": "uuid",
  "assunto": "Solicitação de suporte",
  "prioridade": "alta",
  "mensagem": "Preciso de ajuda urgente"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Ticket criado com sucesso",
  "data": {
    "id": "uuid",
    "numero": 12346,
    "status": "aberto"
  }
}
```

---

#### PUT /atendimento/tickets/:id/status

Atualiza status do ticket.

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "status": "resolvido",
  "observacao": "Problema resolvido via telefone"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Status atualizado com sucesso"
}
```

---

#### PUT /atendimento/tickets/:id/transferir

Transfere ticket para outro atendente/fila.

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "atendenteId": "uuid",
  "filaId": "uuid",
  "motivo": "Especialista em produto X"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Ticket transferido com sucesso"
}
```

---

### 3. Mensagens

#### GET /atendimento/mensagens/:ticketId

Lista mensagens de um ticket.

**Headers:**
```http
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "conteudo": "Olá, como posso ajudar?",
      "tipo": "texto",
      "direcao": "saida",
      "lida": true,
      "remetente": {
        "id": "uuid",
        "nome": "João Silva",
        "tipo": "atendente"
      },
      "createdAt": "2025-10-11T12:00:00.000Z"
    }
  ],
  "total": 15
}
```

---

#### POST /atendimento/mensagens

Envia nova mensagem.

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request (Texto):**
```json
{
  "ticketId": "uuid",
  "conteudo": "Obrigado pelo contato!",
  "tipo": "texto"
}
```

**Request (Imagem):**
```json
{
  "ticketId": "uuid",
  "tipo": "imagem",
  "mediaUrl": "https://...",
  "legenda": "Veja esta imagem"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Mensagem enviada",
  "data": {
    "id": "uuid",
    "conteudo": "Obrigado pelo contato!",
    "status": "enviada"
  }
}
```

---

### 4. Filas

#### GET /atendimento/filas

Lista filas da empresa.

**Headers:**
```http
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "Suporte Técnico",
      "descricao": "Dúvidas técnicas",
      "ativo": true,
      "atendentes": [
        {
          "id": "uuid",
          "nome": "João Silva"
        }
      ],
      "tempoMedioAtendimento": 15,
      "ticketsAbertos": 5
    }
  ],
  "total": 3
}
```

---

### 5. Atendentes

#### GET /atendimento/atendentes

Lista atendentes da empresa.

**Headers:**
```http
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@empresa.com",
      "status": "online",
      "filas": [
        {
          "id": "uuid",
          "nome": "Suporte"
        }
      ],
      "ticketsAtivos": 3,
      "ticketsHoje": 12
    }
  ],
  "total": 5
}
```

---

### 6. WebHooks (WhatsApp)

#### POST /atendimento/webhooks/whatsapp

Recebe eventos do WhatsApp Business API.

**Headers:**
```http
Content-Type: application/json
```

**Request (Mensagem Recebida):**
```json
{
  "entry": [
    {
      "changes": [
        {
          "value": {
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.xxxxx",
                "type": "text",
                "text": {
                  "body": "Olá, preciso de ajuda"
                },
                "timestamp": "1697030400"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Webhook processado"
}
```

---

#### GET /atendimento/webhooks/whatsapp

Verifica token do webhook (Meta).

**Query Parameters:**
- `hub.mode` - `subscribe`
- `hub.verify_token` - Token configurado
- `hub.challenge` - Desafio

**Response (200 OK):**
```
{hub.challenge}
```

---

### 7. IA / Chatbot

#### POST /atendimento/ia/responder

Gera resposta automática via IA.

**Headers:**
```http
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "ticketId": "uuid",
  "mensagem": "Qual é o horário de funcionamento?",
  "contexto": {
    "empresa": "MinhaEmpresa",
    "setor": "Atendimento"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "resposta": "Nosso horário de funcionamento é de segunda a sexta, das 9h às 18h.",
    "confianca": 0.95,
    "requer_atendente": false,
    "sugestoes": [
      "Falar com atendente",
      "Ver mais horários"
    ]
  }
}
```

---

## 📡 WebSocket Events

### Conexão

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});

socket.on('connect', () => {
  console.log('Conectado!', socket.id);
});
```

---

### Eventos Emitidos pelo Cliente

#### 1. join-empresa
Entrar em sala da empresa.

```javascript
socket.emit('join-empresa', { empresaId: 'uuid' });
```

---

#### 2. join-ticket
Entrar em sala de um ticket específico.

```javascript
socket.emit('join-ticket', { ticketId: 'uuid' });
```

---

#### 3. typing
Indicar que está digitando.

```javascript
socket.emit('typing', {
  ticketId: 'uuid',
  atendenteId: 'uuid',
  nome: 'João Silva'
});
```

---

#### 4. stop-typing
Parar de digitar.

```javascript
socket.emit('stop-typing', {
  ticketId: 'uuid',
  atendenteId: 'uuid'
});
```

---

#### 5. send-message
Enviar mensagem via WebSocket.

```javascript
socket.emit('send-message', {
  ticketId: 'uuid',
  conteudo: 'Mensagem via WebSocket',
  tipo: 'texto'
});
```

---

### Eventos Recebidos do Servidor

#### 1. nova-mensagem
Nova mensagem recebida.

```javascript
socket.on('nova-mensagem', (data) => {
  console.log('Nova mensagem:', data);
  /*
  {
    id: 'uuid',
    ticketId: 'uuid',
    conteudo: 'Olá!',
    tipo: 'texto',
    direcao: 'entrada',
    remetente: {
      nome: 'Maria Santos',
      telefone: '+5511999999999'
    },
    createdAt: '2025-10-11T12:00:00.000Z'
  }
  */
});
```

---

#### 2. ticket-atualizado
Status do ticket mudou.

```javascript
socket.on('ticket-atualizado', (data) => {
  console.log('Ticket atualizado:', data);
  /*
  {
    id: 'uuid',
    numero: 12345,
    status: 'em_andamento',
    atendenteId: 'uuid',
    updatedAt: '2025-10-11T12:00:00.000Z'
  }
  */
});
```

---

#### 3. novo-ticket
Novo ticket criado.

```javascript
socket.on('novo-ticket', (data) => {
  console.log('Novo ticket:', data);
  /*
  {
    id: 'uuid',
    numero: 12346,
    status: 'aberto',
    cliente: { ... },
    fila: { ... }
  }
  */
});
```

---

#### 4. atendente-typing
Atendente está digitando.

```javascript
socket.on('atendente-typing', (data) => {
  console.log('Digitando:', data);
  /*
  {
    ticketId: 'uuid',
    atendenteId: 'uuid',
    nome: 'João Silva',
    timestamp: '2025-10-11T12:00:00.000Z'
  }
  */
});
```

---

#### 5. atendente-stop-typing
Atendente parou de digitar.

```javascript
socket.on('atendente-stop-typing', (data) => {
  console.log('Parou de digitar:', data);
});
```

---

#### 6. mensagem-lida
Mensagem foi lida.

```javascript
socket.on('mensagem-lida', (data) => {
  console.log('Mensagem lida:', data);
  /*
  {
    mensagemId: 'uuid',
    ticketId: 'uuid',
    lida: true,
    lidaEm: '2025-10-11T12:00:00.000Z'
  }
  */
});
```

---

#### 7. resposta-ia
IA gerou resposta automática.

```javascript
socket.on('resposta-ia', (data) => {
  console.log('Resposta IA:', data);
  /*
  {
    ticketId: 'uuid',
    resposta: 'Resposta gerada pela IA',
    confianca: 0.95,
    requer_atendente: false
  }
  */
});
```

---

## 📊 Códigos de Status HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| **200** | OK | Requisição bem-sucedida |
| **201** | Created | Recurso criado com sucesso |
| **400** | Bad Request | Dados inválidos |
| **401** | Unauthorized | Token inválido ou ausente |
| **403** | Forbidden | Sem permissão |
| **404** | Not Found | Recurso não encontrado |
| **422** | Unprocessable Entity | Validação falhou |
| **500** | Internal Server Error | Erro no servidor |

---

## 💡 Exemplos de Uso

### Exemplo 1: Chat em Tempo Real

```javascript
// React Hook
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function useChat(ticketId) {
  const [mensagens, setMensagens] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const newSocket = io('http://localhost:3001', {
      auth: { token: `Bearer ${token}` }
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-ticket', { ticketId });
    });

    newSocket.on('nova-mensagem', (msg) => {
      setMensagens(prev => [...prev, msg]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [ticketId]);

  const enviarMensagem = (conteudo) => {
    socket.emit('send-message', {
      ticketId,
      conteudo,
      tipo: 'texto'
    });
  };

  return { mensagens, enviarMensagem };
}
```

---

### Exemplo 2: Validar e Salvar Integração

```javascript
async function configurarWhatsApp(token, phoneId, apiToken) {
  // 1. Validar credenciais
  const validacao = await fetch('/api/atendimento/canais/validar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tipo: 'whatsapp',
      credenciais: {
        whatsapp_api_token: apiToken,
        whatsapp_phone_number_id: phoneId
      }
    })
  });

  const resultValidacao = await validacao.json();

  if (!resultValidacao.data.valido) {
    throw new Error(resultValidacao.data.mensagem);
  }

  // 2. Salvar configuração
  const criacao = await fetch('/api/atendimento/canais', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nome: 'WhatsApp Principal',
      tipo: 'whatsapp',
      config: {
        credenciais: {
          whatsapp_api_token: apiToken,
          whatsapp_phone_number_id: phoneId
        }
      }
    })
  });

  return await criacao.json();
}
```

---

### Exemplo 3: Monitorar Tickets em Tempo Real

```javascript
function Dashboard() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:3001', {
      auth: {
        token: `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    socket.on('connect', () => {
      const empresaId = localStorage.getItem('empresaId');
      socket.emit('join-empresa', { empresaId });
    });

    socket.on('novo-ticket', (ticket) => {
      setTickets(prev => [ticket, ...prev]);
      // Notificação
      new Notification('Novo Ticket!', {
        body: `#${ticket.numero} - ${ticket.assunto}`
      });
    });

    socket.on('ticket-atualizado', (updated) => {
      setTickets(prev => prev.map(t => 
        t.id === updated.id ? { ...t, ...updated } : t
      ));
    });

    return () => socket.close();
  }, []);

  return (
    <div>
      <h1>Tickets Ativos: {tickets.length}</h1>
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}
```

---

## 📚 Links Úteis

- [Documentação Omnichannel](./OMNICHANNEL_CONFIGURACOES_INTEGRACOES.md)
- [Guia de Testes](./TESTES_INTEGRACOES.md)
- [Guia de Deploy](./GUIA_DEPLOY.md)
- [WebSocket Events](./websocket-events.md)

---

**Data:** 11/10/2025  
**Versão:** 1.0.0  
**Autor:** Equipe ConectCRM
