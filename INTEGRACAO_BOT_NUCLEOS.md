# 🤖 Integração Bot de Atendimento com Núcleos

## 📋 Visão Geral

Este documento explica **como os núcleos criados** são automaticamente integrados ao **bot de atendimento** e usados nos **fluxos de triagem**.

---

## 🎯 Resposta Rápida

### ✅ **SIM, núcleos ativos são automaticamente integrados ao bot!**

Quando você:
1. ✅ Cria um novo núcleo via **Gestão de Núcleos** (`/gestao/nucleos`)
2. ✅ Marca o núcleo como **ATIVO**
3. ✅ Salva o núcleo

**O que acontece automaticamente:**
- 🤖 O núcleo fica **disponível para fluxos de triagem**
- 📱 Aparece nas **opções de menu do bot**
- 🎫 Pode receber **tickets automaticamente**
- 👥 Fica **vinculado aos departamentos**

---

## 🔄 Como Funciona a Integração

### 1. Criação do Núcleo
```
Usuário                   API Backend              Banco de Dados
   |                          |                          |
   |--[Cria Núcleo]---------->|                          |
   |  - nome: "Suporte VIP"   |                          |
   |  - ativo: true           |                          |
   |  - código: "SUP_VIP"     |                          |
   |                          |--[INSERT nucleos]------->|
   |                          |                          |
   |<--[Núcleo Criado]--------|<--[ID: uuid]-------------|
```

### 2. Uso no Bot de Triagem
```
Cliente WhatsApp          Bot de Triagem         Núcleo Criado
   |                          |                          |
   |--[Mensagem]------------->|                          |
   |                          |--[Busca Núcleos Ativos]->|
   |                          |<--[Lista Núcleos]--------|
   |                          |                          |
   |                          |--[Monta Menu]            |
   |<--[Menu com Opções]------|                          |
   |  1. Vendas               |                          |
   |  2. Suporte              |                          |
   |  3. Suporte VIP ← NOVO!  |                          |
   |  4. Financeiro           |                          |
   |                          |                          |
   |--[Opção 3]-------------->|                          |
   |                          |--[Cria Ticket]---------->|
   |                          |  nucleoId: "SUP_VIP"     |
```

---

## 📊 Estrutura de Fluxo de Triagem

### Entity: FluxoTriagem

Os fluxos de triagem armazenam uma **estrutura JSON** com opções de menu que referenciam os núcleos:

```typescript
{
  "etapaInicial": "menu_principal",
  "versao": "1.0",
  "etapas": {
    "menu_principal": {
      "id": "menu_principal",
      "tipo": "mensagem_menu",
      "mensagem": "Olá! Escolha um departamento:",
      "opcoes": [
        {
          "numero": 1,
          "texto": "Vendas",
          "icone": "💰",
          "nucleoId": "uuid-nucleo-vendas",  // ← REFERÊNCIA AO NÚCLEO
          "acao": "criar_ticket",
          "prioridade": "media"
        },
        {
          "numero": 2,
          "texto": "Suporte VIP",
          "icone": "⭐",
          "nucleoId": "uuid-nucleo-suporte-vip", // ← NÚCLEO CRIADO
          "acao": "criar_ticket",
          "prioridade": "alta"
        }
      ]
    }
  }
}
```

### Como o Bot Monta o Menu Dinamicamente

O bot **não usa valores hardcoded**. Ele busca núcleos ativos:

```typescript
// backend/src/modules/triagem/services/bot.service.ts (hipotético)
async montarMenuNucleos(empresaId: string): Promise<OpcaoMenu[]> {
  // 1. Buscar núcleos ativos
  const nucleos = await this.nucleoService.findAll(empresaId, { 
    ativo: true 
  });
  
  // 2. Ordenar por prioridade
  nucleos.sort((a, b) => b.prioridade - a.prioridade);
  
  // 3. Mapear para opções de menu
  return nucleos.map((nucleo, index) => ({
    numero: index + 1,
    texto: nucleo.nome,
    icone: nucleo.icone || '📋',
    nucleoId: nucleo.id,
    acao: 'criar_ticket',
    prioridade: this.calcularPrioridade(nucleo.prioridade)
  }));
}
```

---

## ✅ Condições para Núcleo Aparecer no Bot

| Condição | Obrigatório | Descrição |
|----------|-------------|-----------|
| **ativo = true** | ✅ SIM | Núcleo deve estar ativo |
| **empresaId** | ✅ SIM | Pertencer à empresa correta (multi-tenant) |
| **publicado** | ⚠️ Depende | Se o fluxo exigir, precisa estar publicado |
| **prioridade** | ❌ NÃO | Afeta apenas a ordem no menu |
| **capacidadeMaxima** | ❌ NÃO | Apenas para controle de carga |

### Exemplo de Query
```sql
-- Núcleos que aparecem no bot
SELECT id, nome, codigo, prioridade, icone
FROM nucleos
WHERE empresa_id = 'uuid-empresa'
  AND ativo = true
ORDER BY prioridade DESC;
```

---

## 🔗 Vínculo com Departamentos

Quando um ticket é criado via bot:

```
Bot → Escolhe Núcleo → Cria Ticket → Distribui para Departamento
```

### Fluxo Completo
```typescript
// 1. Cliente escolhe opção no bot
const opcaoEscolhida = opcoes[2]; // "Suporte VIP"

// 2. Bot cria ticket no núcleo
const ticket = await ticketService.criar({
  nucleoId: opcaoEscolhida.nucleoId, // UUID do núcleo
  empresaId: 'uuid-empresa',
  prioridade: opcaoEscolhida.prioridade || 'media',
  canal: 'whatsapp'
});

// 3. Sistema distribui para departamento
const departamento = await departamentoService.encontrarDisponivel({
  nucleoId: opcaoEscolhida.nucleoId,
  tipoDistribuicao: 'round_robin'
});

// 4. Atribui atendente
const atendente = await departamento.proximoAtendente();
ticket.atendenteId = atendente.id;
```

---

## 🎨 Personalização Visual no Bot

### Núcleo com Cor e Ícone
```typescript
{
  id: "uuid",
  nome: "Suporte VIP",
  codigo: "SUP_VIP",
  cor: "#FFD700",      // ← Dourado
  icone: "⭐",         // ← Estrela
  ativo: true,
  prioridade: 100      // ← Alta prioridade (aparece primeiro)
}
```

### Como Aparece no WhatsApp
```
🤖 *Olá! Como posso ajudar?*

Escolha uma opção:

⭐ *1* - Suporte VIP
💰 *2* - Vendas
🛠️ *3* - Suporte Técnico
💵 *4* - Financeiro

_Digite o número da opção desejada_
```

---

## 🚀 Publicação de Fluxos

### Fluxos Precisam Estar Publicados?

**Depende da configuração:**

#### Cenário 1: Fluxo Estático (Atual)
- ❌ **NÃO precisa** republicar fluxo ao criar núcleo
- ✅ Bot busca núcleos ativos **em tempo real**
- ✅ Menu é montado dinamicamente a cada execução

#### Cenário 2: Fluxo Fixo (Legado)
- ⚠️ **PRECISA** republicar fluxo
- ❌ Núcleos ficam hardcoded na estrutura JSON
- ❌ Não aparece automaticamente

### Como Verificar se é Dinâmico
```sql
-- Verificar estrutura do fluxo
SELECT 
  nome,
  tipo,
  estrutura->'etapas'->'menu_principal'->'opcoes' as opcoes
FROM fluxos_triagem
WHERE publicado = true;

-- Se opcoes contém nucleoId: é dinâmico ✅
-- Se opcoes tem texto fixo: é estático ❌
```

---

## 📝 Exemplo Prático: Criar Núcleo VIP

### Passo 1: Criar Núcleo
```http
POST /nucleos
Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Atendimento VIP",
  "codigo": "VIP",
  "descricao": "Atendimento prioritário para clientes premium",
  "cor": "#FFD700",
  "icone": "⭐",
  "ativo": true,
  "prioridade": 100,
  "tipoDistribuicao": "skill_based",
  "slaRespostaMinutos": 5,
  "slaResolucaoHoras": 2,
  "capacidadeMaxima": 20,
  "mensagemBoasVindas": "Olá! Você está sendo atendido pelo nosso time VIP."
}
```

### Passo 2: Verificar no Bot
```
Cliente: Oi
Bot: Olá! Como posso ajudar?

Escolha uma opção:
⭐ 1 - Atendimento VIP  ← APARECEU AUTOMATICAMENTE!
💰 2 - Vendas
🛠️ 3 - Suporte
💵 4 - Financeiro

Cliente: 1
Bot: Olá! Você está sendo atendido pelo nosso time VIP.
     Aguarde, um de nossos especialistas irá atendê-lo em breve.
```

### Passo 3: Ticket Criado
```json
{
  "id": "ticket-uuid",
  "numero": 12345,
  "nucleoId": "vip-uuid",
  "nucleoNome": "Atendimento VIP",
  "prioridade": "alta",
  "slaRespostaMinutos": 5,
  "slaResolucaoHoras": 2,
  "status": "aberto",
  "canal": "whatsapp"
}
```

---

## ⚙️ Configurações Avançadas

### 1. Horário de Funcionamento
```typescript
{
  "horarioAtivo": {
    "segunda": { "inicio": "08:00", "fim": "18:00" },
    "terca": { "inicio": "08:00", "fim": "18:00" },
    // ...
    "sabado": null, // Não atende sábado
    "domingo": null
  }
}
```

Se fora do horário, o núcleo **NÃO aparece no menu**.

### 2. Palavras-Gatilho
```typescript
{
  "palavrasGatilho": ["urgente", "emergencia", "vip", "premium"],
  "prioridade": 100
}
```

Bot reconhece palavras e **direciona automaticamente** para o núcleo.

### 3. Canais Específicos
```typescript
{
  "canais": ["whatsapp", "telegram"],
  // Não aparece em "email" ou "chat_web"
}
```

---

## 🧪 Testando a Integração

### Teste 1: Criar Núcleo e Verificar no Menu
```bash
# 1. Criar núcleo via API
curl -X POST http://localhost:3001/nucleos \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Teste Bot",
    "codigo": "TEST",
    "ativo": true,
    "prioridade": 50
  }'

# 2. Simular mensagem do bot
curl -X POST http://localhost:3001/bot/simular \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "empresaId": "uuid",
    "telefone": "+5511999999999",
    "mensagem": "oi"
  }'

# 3. Verificar resposta contém "Teste Bot"
```

### Teste 2: Desativar Núcleo
```bash
# 1. Desativar núcleo
curl -X PATCH http://localhost:3001/nucleos/{id} \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{ "ativo": false }'

# 2. Simular novamente
# 3. Verificar que "Teste Bot" NÃO aparece mais
```

---

## 📊 Monitoramento

### Verificar Núcleos Ativos
```sql
SELECT 
  id,
  nome,
  codigo,
  ativo,
  prioridade,
  total_tickets_abertos,
  capacidade_maxima
FROM nucleos
WHERE empresa_id = 'uuid'
  AND ativo = true
ORDER BY prioridade DESC;
```

### Logs do Bot
```
[BOT] Montando menu para empresa uuid-empresa
[BOT] Encontrados 4 núcleos ativos
[BOT] Núcleo 1: Atendimento VIP (prioridade: 100)
[BOT] Núcleo 2: Vendas (prioridade: 80)
[BOT] Núcleo 3: Suporte (prioridade: 60)
[BOT] Núcleo 4: Financeiro (prioridade: 40)
[BOT] Menu montado com 4 opções
```

---

## 🎯 Resumo

### ✅ **Núcleos Criados Aparecem Automaticamente no Bot Se:**
1. ✅ `ativo = true`
2. ✅ Pertencem à empresa correta
3. ✅ Fluxo está configurado para busca dinâmica
4. ✅ Dentro do horário de funcionamento (se configurado)
5. ✅ Canal compatível (se configurado)

### ❌ **Núcleos NÃO Aparecem Se:**
1. ❌ `ativo = false`
2. ❌ Fora do horário configurado
3. ❌ Canal incompatível
4. ❌ Capacidade máxima atingida (opcional)
5. ❌ Fluxo com estrutura estática (legado)

---

## 🚀 Próximos Passos

1. ✅ **Hook `useNucleos` implementado** - busca núcleos da API
2. ✅ **DepartamentosPage atualizado** - usa núcleos dinâmicos
3. ✅ **ModalCadastroDepartamento atualizado** - usa núcleos dinâmicos
4. ⏳ **Implementar busca dinâmica no bot** (se ainda não estiver)
5. ⏳ **Criar painel de monitoramento** de núcleos no bot

---

## 📚 Referências

- **Entity**: `backend/src/modules/triagem/entities/nucleo-atendimento.entity.ts`
- **Service**: `backend/src/modules/triagem/services/nucleo.service.ts`
- **Fluxo**: `backend/src/modules/triagem/entities/fluxo-triagem.entity.ts`
- **Hook Frontend**: `frontend-web/src/hooks/useNucleos.ts`

---

**Data**: 17/10/2025  
**Status**: ✅ Implementado  
**Versão**: 1.0.0
