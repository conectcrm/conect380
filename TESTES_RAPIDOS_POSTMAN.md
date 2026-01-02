# 🧪 TESTES RÁPIDOS - Triagem Bot MVP

## 📌 **Pré-requisitos**
- Backend rodando em `http://localhost:3001`
- Token JWT válido (fazer login primeiro)

---

## 🔐 **1. LOGIN (Obter Token)**

```http
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin@conectsuite.com.br",
  "password": "admin123"
}
```

**Copie o `accessToken` da resposta!**

---

## ✅ **2. TESTAR NÚCLEOS**

### 2.1) Listar núcleos (validar seed data)
```http
GET http://localhost:3001/nucleos
Authorization: Bearer SEU_TOKEN_AQUI
```
**Esperado:** 3 núcleos (Suporte Técnico, Financeiro, Comercial)

### 2.2) Criar novo núcleo (SAC)
```http
POST http://localhost:3001/nucleos
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "nome": "SAC - Atendimento ao Cliente",
  "descricao": "Atendimento geral e dúvidas",
  "codigo": "SAC",
  "cor": "#F59E0B",
  "icone": "phone",
  "ativo": true,
  "prioridade": 4,
  "slaRespostaMinutos": 45,
  "slaResolucaoHoras": 12,
  "canais": ["whatsapp", "chat"],
  "tipoDistribuicao": "load_balancing",
  "capacidadeMaximaTickets": 30,
  "mensagemBoasVindas": "👋 Bem-vindo ao SAC!",
  "tags": ["sac", "geral"]
}
```

### 2.3) Load balancing (núcleo disponível)
```http
GET http://localhost:3001/nucleos/disponivel/whatsapp
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## ✅ **3. TESTAR FLUXOS** (NOVO!)

### 3.1) Criar fluxo simples
```http
POST http://localhost:3001/fluxos
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "nome": "Triagem Principal WhatsApp",
  "descricao": "Menu principal para atendimento via WhatsApp",
  "codigo": "TRIAGE_WPP_MAIN",
  "tipo": "menu_opcoes",
  "canais": ["whatsapp"],
  "ativo": true,
  "prioridade": 10,
  "estrutura": {
    "etapaInicial": "boas_vindas",
    "versao": "1.0",
    "etapas": {
      "boas_vindas": {
        "id": "boas_vindas",
        "tipo": "mensagem_menu",
        "mensagem": "👋 Olá! Bem-vindo ao Conect CRM!\n\nComo posso ajudar você hoje?",
        "opcoes": [
          {
            "numero": 1,
            "texto": "🛠️ Suporte Técnico",
            "acao": "transferir_nucleo"
          },
          {
            "numero": 2,
            "texto": "💰 Financeiro",
            "acao": "transferir_nucleo"
          },
          {
            "numero": 3,
            "texto": "🎯 Comercial/Vendas",
            "acao": "transferir_nucleo"
          }
        ],
        "timeout": 300
      }
    },
    "variaveis": {
      "nome": { "tipo": "texto", "obrigatorio": false }
    }
  }
}
```

### 3.2) Listar fluxos
```http
GET http://localhost:3001/fluxos
Authorization: Bearer SEU_TOKEN_AQUI
```

### 3.3) Buscar fluxo por canal
```http
GET http://localhost:3001/fluxos/canal/whatsapp
Authorization: Bearer SEU_TOKEN_AQUI
```

### 3.4) Buscar fluxo padrão para WhatsApp
```http
GET http://localhost:3001/fluxos/padrao/whatsapp
Authorization: Bearer SEU_TOKEN_AQUI
```

### 3.5) Publicar fluxo (substitua {fluxoId})
```http
POST http://localhost:3001/fluxos/{fluxoId}/publicar
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "incrementarVersao": false
}
```

### 3.6) Estatísticas do fluxo
```http
GET http://localhost:3001/fluxos/{fluxoId}/estatisticas
Authorization: Bearer SEU_TOKEN_AQUI
```

### 3.7) Duplicar fluxo
```http
POST http://localhost:3001/fluxos/{fluxoId}/duplicar
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "novoNome": "Triagem Principal WhatsApp (Cópia)"
}
```

---

## ✅ **4. TESTAR TRIAGEM (End-to-End)**

### 4.1) Iniciar sessão de triagem
```http
POST http://localhost:3001/triagem/iniciar
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "contatoTelefone": "+5511999887766",
  "contatoNome": "João da Silva",
  "fluxoId": "COLE_AQUI_O_ID_DO_FLUXO_CRIADO",
  "canal": "whatsapp"
}
```

**Copie o `sessaoId` da resposta!**

### 4.2) Responder na triagem (opção 1 - Suporte)
```http
POST http://localhost:3001/triagem/responder
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json

{
  "sessaoId": "COLE_AQUI_O_SESSAO_ID",
  "resposta": "1",
  "contatoTelefone": "+5511999887766",
  "canal": "whatsapp"
}
```

**Esperado:** `finalizado: true` e `nucleoId` preenchido

### 4.3) Buscar sessão ativa
```http
GET http://localhost:3001/triagem/sessao/+5511999887766
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

- [ ] Login realizado e JWT obtido
- [ ] GET /nucleos retorna 3 núcleos seed
- [ ] POST /nucleos cria novo núcleo "SAC"
- [ ] GET /nucleos/disponivel/whatsapp faz load balancing
- [ ] POST /fluxos cria novo fluxo
- [ ] GET /fluxos lista todos os fluxos
- [ ] GET /fluxos/padrao/whatsapp retorna fluxo padrão
- [ ] POST /fluxos/:id/publicar publica o fluxo
- [ ] POST /triagem/iniciar inicia sessão com sucesso
- [ ] POST /triagem/responder processa resposta
- [ ] Resposta final inclui `finalizado: true`
- [ ] GET /triagem/sessao/:telefone retorna status correto

---

## 🎯 **ENDPOINTS TOTAIS: 23**

### Núcleos (9):
- GET /nucleos
- POST /nucleos
- GET /nucleos/:id
- PUT /nucleos/:id
- DELETE /nucleos/:id
- GET /nucleos/canal/:canal
- GET /nucleos/disponivel/:canal
- POST /nucleos/:id/incrementar-tickets
- POST /nucleos/:id/decrementar-tickets

### Fluxos (11 - NOVO!):
- GET /fluxos
- POST /fluxos
- GET /fluxos/:id
- PUT /fluxos/:id
- DELETE /fluxos/:id
- GET /fluxos/canal/:canal
- GET /fluxos/padrao/:canal
- POST /fluxos/:id/publicar
- POST /fluxos/:id/despublicar
- POST /fluxos/:id/duplicar
- GET /fluxos/:id/estatisticas

### Triagem (5):
- POST /triagem/iniciar
- POST /triagem/responder
- GET /triagem/sessao/:telefone
- DELETE /triagem/sessao/:sessaoId
- POST /triagem/webhook/whatsapp

---

## 🚀 **PRÓXIMO PASSO**

Agora você tem **23 endpoints funcionais**!

**Teste agora:**
1. Faça login
2. Crie um fluxo
3. Publique o fluxo
4. Inicie uma triagem
5. Responda e veja a sessão ser concluída

**Depois:**
- Crie o frontend (GestaoNucleosPage + GestaoFluxosPage)
- Integre o webhook WhatsApp real

---

**💡 Dica:** Use o Postman ou Insomnia para salvar esses requests em uma coleção!
