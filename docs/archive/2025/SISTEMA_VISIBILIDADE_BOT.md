# 🤖 Sistema de Visibilidade de Núcleos e Departamentos no Bot

## 📋 Visão Geral

Este documento descreve o mecanismo de configuração que permite definir quais núcleos e departamentos aparecem no bot para seleção dos clientes.

## ✨ Funcionalidades Implementadas

### 1. **Backend**

#### Novos Campos nas Entidades

**NucleoAtendimento** (`nucleos_atendimento`)
- `visivel_no_bot` (boolean, default: true) - Controla se o núcleo aparece nas opções do bot

**Departamento** (`departamentos`)
- `visivel_no_bot` (boolean, default: true) - Controla se o departamento aparece nas opções do bot

#### Novo Endpoint para o Bot

```
GET /nucleos/bot/opcoes
```

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Resposta:**
```json
[
  {
    "id": "uuid-nucleo-1",
    "nome": "Suporte Técnico",
    "descricao": "Atendimento de problemas técnicos",
    "cor": "#3B82F6",
    "icone": "headset",
    "mensagemBoasVindas": "Olá! Bem-vindo ao Suporte Técnico...",
    "departamentos": [
      {
        "id": "uuid-dep-1",
        "nome": "Suporte Nível 1",
        "descricao": "Problemas básicos",
        "cor": "#6366F1",
        "icone": "help-circle"
      },
      {
        "id": "uuid-dep-2",
        "nome": "Suporte Nível 2",
        "descricao": "Problemas avançados",
        "cor": "#8B5CF6",
        "icone": "wrench"
      }
    ]
  },
  {
    "id": "uuid-nucleo-2",
    "nome": "Vendas",
    "descricao": "Atendimento comercial",
    "cor": "#10B981",
    "icone": "shopping-cart",
    "mensagemBoasVindas": "Olá! Como posso ajudar com sua compra?",
    "departamentos": [
      {
        "id": "uuid-dep-3",
        "nome": "Vendas - Novos Clientes",
        "descricao": "Atendimento para novos clientes",
        "cor": "#059669",
        "icone": "user-plus"
      }
    ]
  }
]
```

**Regras de Filtragem:**
- Apenas núcleos `ativo = true` E `visivelNoBot = true`
- Apenas departamentos `ativo = true` E `visivelNoBot = true`
- Ordenação por `prioridade` do núcleo (ASC) e depois por `nome`
- Departamentos ordenados por `ordem` (ASC) e depois por `nome`

### 2. **Frontend - Interface de Gestão**

#### Gestão de Núcleos (`/gestao-nucleos`)

**Novo Campo no Formulário:**
- ✅ Checkbox "Visível no Bot" 
  - Label: "Visível no Bot (permite que clientes selecionem este núcleo)"
  - Valor padrão: `true`
  - Aparece junto com o checkbox "Núcleo Ativo"

**Nova Coluna na Tabela:**
- Coluna "Bot" com badge visual:
  - 👁️ **Visível** (azul) - quando `visivelNoBot = true`
  - 🚫 **Oculto** (cinza) - quando `visivelNoBot = false`

#### Gestão de Departamentos (já existente)

O modal de cadastro/edição de departamentos deve ser atualizado para incluir:
- ✅ Checkbox "Visível no Bot"
- Badge na listagem similar aos núcleos

## 🔄 Fluxo de Uso no Bot

### Fluxo Sugerido

1. **Cliente inicia conversa**
   ```
   Bot: Olá! Como posso ajudar você hoje?
   ```

2. **Bot lista núcleos disponíveis**
   ```
   Bot: Por favor, selecione o setor que deseja:
   
   1️⃣ Suporte Técnico
   2️⃣ Vendas
   3️⃣ Financeiro
   ```

3. **Cliente escolhe núcleo**
   ```
   Cliente: 1
   ```

4. **Bot mostra departamentos do núcleo**
   ```
   Bot: Olá! Bem-vindo ao Suporte Técnico.
   
   Escolha o departamento:
   1️⃣ Suporte Nível 1 - Problemas básicos
   2️⃣ Suporte Nível 2 - Problemas avançados
   3️⃣ Infraestrutura - Servidores e rede
   ```

5. **Cliente escolhe departamento**
   ```
   Cliente: 2
   ```

6. **Bot confirma e roteia**
   ```
   Bot: Perfeito! Você será atendido pelo departamento de Suporte Nível 2.
   Um atendente estará com você em instantes...
   ```

## 📝 Exemplo de Integração com FluxoTriagem

```typescript
// No FluxoTriagem, buscar opções do bot
const opcoes = await fetch('/nucleos/bot/opcoes', {
  headers: { Authorization: `Bearer ${token}` }
}).then(r => r.json());

// Criar mensagem com botões/lista
const mensagemNucleos = {
  tipo: 'interactive',
  interactiveType: 'list',
  header: 'Selecione o setor',
  body: 'Por favor, escolha o setor desejado:',
  sections: [
    {
      title: 'Setores disponíveis',
      rows: opcoes.map((nucleo, idx) => ({
        id: `nucleo_${nucleo.id}`,
        title: nucleo.nome,
        description: nucleo.descricao
      }))
    }
  ]
};

// Após seleção do núcleo, mostrar departamentos
const nucleoSelecionado = opcoes.find(n => n.id === idEscolhido);
const mensagemDepartamentos = {
  tipo: 'interactive',
  interactiveType: 'list',
  header: nucleoSelecionado.nome,
  body: nucleoSelecionado.mensagemBoasVindas || 'Escolha o departamento:',
  sections: [
    {
      title: 'Departamentos',
      rows: nucleoSelecionado.departamentos.map((dep, idx) => ({
        id: `dep_${dep.id}`,
        title: dep.nome,
        description: dep.descricao
      }))
    }
  ]
};
```

## 🎯 Casos de Uso

### Caso 1: Ocultar Núcleo Temporariamente
**Situação:** Núcleo em manutenção, mas não quer desativar completamente.

**Solução:**
1. Manter `ativo = true` (para não afetar atendimentos em andamento)
2. Definir `visivelNoBot = false` (novos clientes não verão esta opção)

### Caso 2: Departamento Interno
**Situação:** Departamento "Backoffice" não deve ser selecionável por clientes.

**Solução:**
- Criar departamento com `visivelNoBot = false`
- Atendentes podem mover tickets manualmente para este departamento

### Caso 3: Diferentes Canais
**Situação:** Alguns departamentos só atendem por WhatsApp, outros por chat web.

**Solução Futura:** 
- Adicionar campo `canais: string[]` em departamentos
- Filtrar por canal na API `/nucleos/bot/opcoes?canal=whatsapp`

## 🚀 Migration

Execute a migration para adicionar os campos:

```bash
# Backend
cd backend
npm run migration:run

# Ou manualmente:
psql -U usuario -d conectcrm < migrations/1729200000000-AddVisivelNoBotFields.ts
```

**SQL Manual:**
```sql
-- Adicionar campo em nucleos_atendimento
ALTER TABLE nucleos_atendimento 
ADD COLUMN visivel_no_bot BOOLEAN DEFAULT true;

-- Adicionar campo em departamentos
ALTER TABLE departamentos 
ADD COLUMN visivel_no_bot BOOLEAN DEFAULT true;

-- Criar índices para performance
CREATE INDEX idx_nucleos_visivel_bot ON nucleos_atendimento(visivel_no_bot) WHERE ativo = true;
CREATE INDEX idx_departamentos_visivel_bot ON departamentos(visivel_no_bot) WHERE ativo = true;
```

## 📊 Monitoramento

### Queries Úteis

**Verificar núcleos visíveis no bot:**
```sql
SELECT id, nome, ativo, visivel_no_bot, prioridade
FROM nucleos_atendimento
WHERE empresa_id = 'uuid-empresa'
  AND ativo = true
  AND visivel_no_bot = true
ORDER BY prioridade ASC, nome ASC;
```

**Verificar departamentos visíveis por núcleo:**
```sql
SELECT 
  n.nome as nucleo,
  d.nome as departamento,
  d.ativo,
  d.visivel_no_bot,
  d.ordem
FROM departamentos d
JOIN nucleos_atendimento n ON d.nucleo_id = n.id
WHERE d.nucleo_id = 'uuid-nucleo'
  AND d.ativo = true
  AND d.visivel_no_bot = true
ORDER BY d.ordem ASC, d.nome ASC;
```

## ✅ Checklist de Implementação

### Backend
- [x] Adicionar campo `visivel_no_bot` em `NucleoAtendimento`
- [x] Adicionar campo `visivel_no_bot` em `Departamento`
- [x] Criar migration para adicionar campos
- [x] Atualizar DTOs (Create/Update)
- [x] Implementar endpoint `/nucleos/bot/opcoes`
- [x] Adicionar filtros na query do service

### Frontend
- [x] Atualizar interface `Nucleo` no `nucleoService.ts`
- [x] Atualizar interface `CreateNucleoDto` no `nucleoService.ts`
- [x] Adicionar checkbox no formulário de núcleos
- [x] Adicionar coluna "Bot" na tabela de núcleos
- [ ] Adicionar checkbox no modal de departamentos
- [ ] Adicionar badge na listagem de departamentos

### Bot
- [ ] Integrar endpoint `/nucleos/bot/opcoes` no FluxoTriagem
- [ ] Implementar fluxo de seleção de núcleo
- [ ] Implementar fluxo de seleção de departamento
- [ ] Adicionar logs de analytics (qual núcleo/dep mais escolhido)

## 🎨 Melhorias Futuras

1. **Drag & Drop para Ordenação**
   - Interface visual para reordenar núcleos e departamentos
   
2. **Preview do Bot**
   - Visualizar como o cliente verá as opções antes de salvar

3. **Agendamento**
   - Configurar horários específicos de visibilidade
   - Ex: "Vendas" visível apenas em horário comercial

4. **A/B Testing**
   - Testar diferentes ordenações e medir conversão

5. **Analytics**
   - Dashboard mostrando:
     - Núcleos mais escolhidos
     - Departamentos mais procurados
     - Taxa de abandono por etapa
     - Tempo médio de seleção

## 📞 Suporte

Para dúvidas sobre implementação:
- Verificar logs do backend em `/logs`
- Usar Postman/Insomnia para testar endpoint manualmente
- Consultar exemplos neste documento
