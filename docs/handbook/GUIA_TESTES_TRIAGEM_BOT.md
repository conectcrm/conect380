# 🧪 Guia de Testes - Sistema de Triagem Bot

## 🎯 Requisições Prontas para Copiar e Colar

### 🔐 1. FAZER LOGIN (Obter Token JWT)

```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "password": "sua-senha"
}
```

**Resposta Esperada:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

⚠️ **Copie o `access_token` e use em todas as próximas requisições!**

---

## 📋 2. NÚCLEOS DE ATENDIMENTO

### 2.1 Listar Todos os Núcleos

```http
GET http://localhost:3001/nucleos
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta Esperada (seed data):**
```json
[
  {
    "id": "uuid-1",
    "nome": "Suporte Técnico",
    "descricao": "Atendimento para questões técnicas e problemas de sistema",
    "cor": "#3B82F6",
    "icone": "wrench",
    "ativo": true,
    "prioridade": 1,
    "canais": ["whatsapp", "chat", "telegram"],
    "tipoDistribuicao": "round_robin",
    "capacidadeMaximaTickets": 50,
    "slaRespostaMinutos": 30,
    "slaResolucaoHoras": 4
  },
  {
    "id": "uuid-2",
    "nome": "Financeiro",
    "descricao": "Atendimento para questões financeiras, cobranças e pagamentos",
    "cor": "#10B981",
    "icone": "dollar-sign",
    "ativo": true,
    "prioridade": 2
  },
  {
    "id": "uuid-3",
    "nome": "Comercial",
    "descricao": "Atendimento para vendas, propostas e informações comerciais",
    "cor": "#F59E0B",
    "icone": "briefcase",
    "ativo": true,
    "prioridade": 3
  }
]
```

### 2.2 Criar Novo Núcleo

```http
POST http://localhost:3001/nucleos
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "nome": "SAC - Atendimento ao Cliente",
  "descricao": "Núcleo para atendimento geral e dúvidas",
  "cor": "#8B5CF6",
  "icone": "users",
  "ativo": true,
  "prioridade": 4,
  "canais": ["whatsapp", "chat"],
  "tipoDistribuicao": "load_balancing",
  "capacidadeMaxima": 30,
  "slaRespostaMinutos": 15,
  "slaResolucaoHoras": 2,
  "mensagemBoasVindas": "Bem-vindo ao SAC! Como posso ajudá-lo hoje?",
  "mensagemForaHorario": "Estamos fora do horário de atendimento. Retornaremos em breve.",
  "horarioFuncionamento": {
    "ativo": true,
    "inicio": "08:00",
    "fim": "18:00",
    "diasSemana": [1, 2, 3, 4, 5]
  },
  "tags": ["sac", "atendimento", "geral"]
}
```

### 2.3 Buscar Núcleo por ID

```http
GET http://localhost:3001/nucleos/uuid-do-nucleo
Authorization: Bearer SEU_TOKEN_AQUI
```

### 2.4 Atualizar Núcleo

```http
PUT http://localhost:3001/nucleos/uuid-do-nucleo
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "ativo": false,
  "capacidadeMaxima": 60,
  "mensagemBoasVindas": "Nova mensagem de boas-vindas!"
}
```

### 2.5 Filtrar Núcleos por Canal

```http
GET http://localhost:3001/nucleos/canal/whatsapp
Authorization: Bearer SEU_TOKEN_AQUI
```

### 2.6 Buscar Núcleo Disponível (Menor Carga)

```http
GET http://localhost:3001/nucleos/disponivel/whatsapp
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 🤖 3. TRIAGEM BOT

### 3.1 Criar Fluxo de Triagem Simples

**⚠️ IMPORTANTE: Substitua `ID_NUCLEO_SUPORTE`, `ID_NUCLEO_FINANCEIRO` pelos IDs reais obtidos no passo 2.1**

```http
POST http://localhost:3001/fluxos
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "nome": "Triagem Inicial - Menu Simples",
  "descricao": "Fluxo básico com 3 opções de atendimento",
  "tipo": "menu_simples",
  "canais": ["whatsapp"],
  "ativo": true,
  "estrutura": {
    "etapaInicial": "menu_principal",
    "etapas": {
      "menu_principal": {
        "id": "menu_principal",
        "mensagem": "Olá! Bem-vindo ao nosso atendimento. Como posso ajudar?",
        "opcoes": [
          {
            "valor": "1",
            "texto": "Suporte Técnico",
            "descricao": "Problemas técnicos, bugs, erros",
            "acao": "transferir_nucleo",
            "nucleoId": "ID_NUCLEO_SUPORTE"
          },
          {
            "valor": "2",
            "texto": "Financeiro",
            "descricao": "Pagamentos, cobranças, faturas",
            "acao": "transferir_nucleo",
            "nucleoId": "ID_NUCLEO_FINANCEIRO"
          },
          {
            "valor": "3",
            "texto": "Falar com Atendente",
            "descricao": "Atendimento humano direto",
            "acao": "transferir_nucleo",
            "nucleoId": "ID_NUCLEO_SUPORTE"
          }
        ]
      }
    }
  }
}
```

**Guarde o `id` do fluxo criado para os próximos testes!**

### 3.2 Iniciar Sessão de Triagem

```http
POST http://localhost:3001/triagem/iniciar
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "contatoTelefone": "5511999999999",
  "contatoNome": "João Silva",
  "fluxoId": "ID_DO_FLUXO_CRIADO",
  "canal": "whatsapp",
  "canalId": "whatsapp-business-123"
}
```

**Resposta Esperada:**
```json
{
  "mensagem": "Olá! Bem-vindo ao nosso atendimento. Como posso ajudar?\n\n1. Suporte Técnico\n   Problemas técnicos, bugs, erros\n\n2. Financeiro\n   Pagamentos, cobranças, faturas\n\n3. Falar com Atendente\n   Atendimento humano direto",
  "sessaoId": "uuid-da-sessao",
  "etapaAtual": "menu_principal",
  "opcoes": [...]
}
```

**Guarde o `sessaoId` para a próxima requisição!**

### 3.3 Responder Triagem (Escolher Opção)

```http
POST http://localhost:3001/triagem/responder
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "sessaoId": "ID_DA_SESSAO",
  "resposta": "1",
  "contatoTelefone": "5511999999999"
}
```

**Resposta Esperada:**
```json
{
  "mensagem": "✅ Você foi direcionado para o núcleo de Suporte Técnico. Em breve um atendente entrará em contato.",
  "sessaoId": "uuid-da-sessao",
  "finalizado": true,
  "nucleoId": "uuid-nucleo-suporte"
}
```

### 3.4 Testar Resposta Inválida

```http
POST http://localhost:3001/triagem/responder
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "sessaoId": "ID_DA_SESSAO",
  "resposta": "99",
  "contatoTelefone": "5511999999999"
}
```

**Resposta Esperada:**
```json
{
  "mensagem": "❌ Opção inválida. Por favor, escolha uma das opções:\n\n1. Suporte Técnico\n...",
  "sessaoId": "uuid-da-sessao",
  "etapaAtual": "menu_principal",
  "opcoes": [...]
}
```

### 3.5 Buscar Sessão Ativa por Telefone

```http
GET http://localhost:3001/triagem/sessao/5511999999999
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta (com sessão ativa):**
```json
{
  "ativa": true,
  "sessao": {
    "id": "uuid-da-sessao",
    "etapaAtual": "menu_principal",
    "status": "em_andamento",
    "iniciadoEm": "2025-10-16T10:30:00Z"
  }
}
```

**Resposta (sem sessão):**
```json
{
  "ativa": false,
  "mensagem": "Nenhuma sessão ativa encontrada"
}
```

### 3.6 Cancelar Sessão

```http
DELETE http://localhost:3001/triagem/sessao/uuid-da-sessao
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## 🎨 4. FLUXO AVANÇADO - Coleta de Dados

### 4.1 Criar Fluxo com Coleta de Nome e Problema

```http
POST http://localhost:3001/fluxos
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "nome": "Triagem Avançada - Com Coleta de Dados",
  "descricao": "Fluxo que coleta nome e descrição do problema",
  "tipo": "arvore_decisao",
  "canais": ["whatsapp"],
  "ativo": true,
  "estrutura": {
    "etapaInicial": "boas_vindas",
    "variaveis": {
      "nome": "",
      "problema": ""
    },
    "etapas": {
      "boas_vindas": {
        "id": "boas_vindas",
        "mensagem": "Olá! Vamos começar coletando algumas informações.",
        "opcoes": [
          {
            "valor": "1",
            "texto": "Iniciar Atendimento",
            "acao": "proximo_passo",
            "proximaEtapa": "coleta_nome"
          },
          {
            "valor": "0",
            "texto": "Cancelar",
            "acao": "finalizar"
          }
        ]
      },
      "coleta_nome": {
        "id": "coleta_nome",
        "mensagem": "Por favor, me informe seu nome completo:",
        "tipo": "texto_livre",
        "aguardarResposta": true,
        "proximaEtapa": "coleta_problema"
      },
      "coleta_problema": {
        "id": "coleta_problema",
        "mensagem": "Obrigado {nome}! Agora me conte: qual é o problema que você está enfrentando?",
        "tipo": "texto_livre",
        "aguardarResposta": true,
        "proximaEtapa": "confirmar"
      },
      "confirmar": {
        "id": "confirmar",
        "mensagem": "Perfeito {nome}! Recebemos sua solicitação sobre: {problema}\n\nVamos direcionar você para nossa equipe.",
        "opcoes": [
          {
            "valor": "1",
            "texto": "Confirmar e Prosseguir",
            "acao": "transferir_nucleo",
            "nucleoId": "ID_NUCLEO_SUPORTE"
          }
        ]
      }
    }
  }
}
```

### 4.2 Testar Fluxo Completo

**Passo 1: Iniciar**
```http
POST http://localhost:3001/triagem/iniciar
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "contatoTelefone": "5511988888888",
  "contatoNome": "Maria Santos",
  "fluxoId": "ID_DO_FLUXO_AVANCADO",
  "canal": "whatsapp"
}
```

**Passo 2: Escolher "Iniciar Atendimento"**
```http
POST http://localhost:3001/triagem/responder
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "sessaoId": "ID_DA_SESSAO",
  "resposta": "1"
}
```

**Resposta:**
```json
{
  "mensagem": "Por favor, me informe seu nome completo:",
  "sessaoId": "...",
  "etapaAtual": "coleta_nome"
}
```

**Passo 3: Informar Nome**
```http
POST http://localhost:3001/triagem/responder
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "sessaoId": "ID_DA_SESSAO",
  "resposta": "João da Silva"
}
```

**Resposta:**
```json
{
  "mensagem": "Obrigado João da Silva! Agora me conte: qual é o problema que você está enfrentando?",
  "sessaoId": "...",
  "etapaAtual": "coleta_problema"
}
```

**Passo 4: Descrever Problema**
```http
POST http://localhost:3001/triagem/responder
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "sessaoId": "ID_DA_SESSAO",
  "resposta": "Não consigo fazer login no sistema"
}
```

**Resposta:**
```json
{
  "mensagem": "Perfeito João da Silva! Recebemos sua solicitação sobre: Não consigo fazer login no sistema\n\nVamos direcionar você para nossa equipe.\n\n1. Confirmar e Prosseguir",
  "sessaoId": "...",
  "etapaAtual": "confirmar"
}
```

**Passo 5: Confirmar**
```http
POST http://localhost:3001/triagem/responder
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "sessaoId": "ID_DA_SESSAO",
  "resposta": "1"
}
```

**Resposta Final:**
```json
{
  "mensagem": "✅ Você foi direcionado para o núcleo de Suporte Técnico. Em breve um atendente entrará em contato.",
  "sessaoId": "...",
  "finalizado": true,
  "nucleoId": "..."
}
```

---

## 🔍 5. VALIDAÇÕES E TESTES DE ERRO

### 5.1 Tentar Criar Núcleo Sem Nome

```http
POST http://localhost:3001/nucleos
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "descricao": "Núcleo sem nome"
}
```

**Resposta Esperada (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": ["O nome do núcleo é obrigatório"],
  "error": "Bad Request"
}
```

### 5.2 Tentar Responder Sessão Expirada

```http
POST http://localhost:3001/triagem/responder
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "sessaoId": "sessao-antiga-expirada",
  "resposta": "1"
}
```

**Resposta Esperada (400):**
```json
{
  "statusCode": 400,
  "message": "Sessão expirada. Inicie uma nova triagem.",
  "error": "Bad Request"
}
```

### 5.3 Buscar Núcleo Inexistente

```http
GET http://localhost:3001/nucleos/uuid-invalido-123
Authorization: Bearer SEU_TOKEN_AQUI
```

**Resposta Esperada (404):**
```json
{
  "statusCode": 404,
  "message": "Núcleo com ID uuid-invalido-123 não encontrado",
  "error": "Not Found"
}
```

---

## 📊 6. TESTAR MÉTRICAS E ESTATÍSTICAS

### 6.1 Incrementar Tickets Abertos

```http
POST http://localhost:3001/nucleos/ID_DO_NUCLEO/incrementar-tickets
Authorization: Bearer SEU_TOKEN_AQUI
```

### 6.2 Verificar Capacidade Atualizada

```http
GET http://localhost:3001/nucleos/ID_DO_NUCLEO
Authorization: Bearer SEU_TOKEN_AQUI
```

**Verificar campos:**
- `totalTicketsAbertos` (deve ter incrementado)
- `capacidadeMaximaTickets`

---

## ✅ CHECKLIST DE TESTES

Execute os testes na ordem:

### Básicos:
- [ ] Login funciona e retorna token
- [ ] GET /nucleos retorna 3 núcleos padrão
- [ ] POST /nucleos cria novo núcleo
- [ ] PUT /nucleos atualiza núcleo existente

### Triagem:
- [ ] POST /fluxos cria fluxo de triagem
- [ ] POST /triagem/iniciar inicia sessão e retorna primeira mensagem
- [ ] POST /triagem/responder processa resposta válida
- [ ] POST /triagem/responder rejeita resposta inválida
- [ ] Fluxo completo até transferência para núcleo funciona

### Avançados:
- [ ] Coleta de dados em fluxo avançado funciona
- [ ] Substituição de variáveis {nome}, {problema} funciona
- [ ] Sessão expira após 30 minutos
- [ ] GET /triagem/sessao/:telefone retorna sessão ativa
- [ ] DELETE /triagem/sessao cancela sessão

### Validações:
- [ ] DTOs validam campos obrigatórios
- [ ] Erros 400 retornam mensagens claras
- [ ] Erros 404 para recursos inexistentes
- [ ] JWT inválido retorna 401

---

## 🐛 TROUBLESHOOTING

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
# Verificar credenciais no .env
```

### Erro: "Migration already executed"
```bash
# Ignorar - migration já foi rodada anteriormente
```

### Erro: "JwtAuthGuard is not defined"
```bash
# Recompilar o backend:
cd backend
npm run build
npm run start:dev
```

### Erro: "Núcleo não encontrado"
```bash
# Executar migration novamente para popular seed data:
npm run migration:run
```

---

## 🎯 PRÓXIMO NÍVEL

Depois de validar todos os testes acima:

1. **Integrar com WhatsApp Real**
   - Implementar webhook `/triagem/webhook/whatsapp`
   - Conectar com WhatsApp Business API

2. **Criar Frontend**
   - Página de gestão de núcleos
   - Visual flow builder para criar fluxos

3. **Adicionar Features**
   - IA para fallback de respostas
   - Analytics e relatórios
   - Templates prontos de fluxos

---

**✅ PRONTO PARA TESTAR! Execute `npm run start:dev` e comece pelos testes básicos.**
