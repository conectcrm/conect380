# 🔗 Integração End-to-End: Bot/Triagem → Núcleos → Departamentos → Atendentes

**Data**: 28 de outubro de 2025  
**Status**: 🟡 Parcialmente Implementado  
**Objetivo**: Testar fluxo completo desde WhatsApp até atribuição de atendente

---

## 📊 Estado Atual da Integração

### ✅ **O Que JÁ Funciona:**

1. **Backend - FlowEngine** (`backend/src/modules/triagem/engine/flow-engine.ts`):
   - ✅ Método `resolverMenuNucleos()` - busca núcleos dinamicamente
   - ✅ Método `resolverMenuDepartamentos()` - busca departamentos dinamicamente
   - ✅ 3 Cenários de roteamento implementados:
     - Cenário 1: Núcleo COM departamentos → lista departamentos
     - Cenário 2: Núcleo SEM departamentos, COM atendentes → transfere direto
     - Cenário 3: Núcleo vazio → avança para coleta de dados

2. **Backend - NucleoService** (`backend/src/modules/triagem/services/nucleo.service.ts`):
   - ✅ Retorna estrutura completa com departamentos e atendentes
   - ✅ Suporta filtros (ativo, com departamentos, etc.)

3. **Frontend - Gestão de Núcleos** (`frontend-web/src/pages/GestaoNucleosPage.tsx`):
   - ✅ UI expandível mostrando departamentos vinculados
   - ✅ Modal para vincular/desvincular departamentos
   - ✅ Modal para gerenciar atendentes diretos do núcleo

4. **Frontend - Gestão de Departamentos** (`frontend-web/src/pages/GestaoDepartamentosPage.tsx`):
   - ✅ CRUD completo de departamentos
   - ✅ Drag-and-drop para reordenação
   - ✅ Vinculação de agentes aos departamentos

---

## ⚠️ **O Que Precisa Ser Testado/Validado:**

### 1. **FluxoBuilder → Núcleos Dinâmicos**

**Problema Identificado** (em `ANALISE_FLUXO_TRIAGEM_COPIA.md`):
- ❌ Fluxos existentes têm núcleos/departamentos **hardcoded**
- ❌ Não usam busca dinâmica (`opcoes: []`)
- ❌ Núcleos/departamentos do banco **não aparecem** no bot

**Exemplo de Fluxo ERRADO** (atual):
```json
{
  "etapaInicial": "MENU_NUCLEOS",
  "etapas": {
    "MENU_NUCLEOS": {
      "id": "MENU_NUCLEOS",
      "tipo": "menu",
      "mensagem": "Escolha o núcleo:",
      "opcoes": [
        {"texto": "Suporte Técnico", "proximaEtapa": "menu_suporte"},
        {"texto": "Administrativo", "proximaEtapa": "menu_administrativo"},
        {"texto": "Comercial", "proximaEtapa": "menu_comercial"}
      ]
    }
  }
}
```

**Exemplo de Fluxo CORRETO** (esperado):
```json
{
  "etapaInicial": "boas-vindas",
  "etapas": {
    "boas-vindas": {
      "id": "boas-vindas",
      "tipo": "menu",
      "mensagem": "Olá! Selecione o núcleo desejado:",
      "opcoes": [],  // ← Busca dinâmica ativa! FlowEngine preenche em runtime
      "resolverOpcoesDinamicamente": "nucleos"  // ← Indica que deve buscar do banco
    },
    "escolha-departamento": {
      "id": "escolha-departamento",
      "tipo": "menu",
      "mensagem": "Escolha o departamento:",
      "opcoes": [],  // ← Busca dinâmica ativa!
      "resolverOpcoesDinamicamente": "departamentos"
    },
    "coleta-nome": {
      "id": "coleta-nome",
      "tipo": "pergunta",
      "mensagem": "Para prosseguir, qual é o seu nome completo?",
      "proximaEtapa": "coleta-email"
    },
    "transferir-atendimento": {
      "id": "transferir-atendimento",
      "tipo": "acao",
      "acao": "transferir",
      "configuracao": {
        "criarTicket": true,
        "destino": {
          "tipo": "departamento",
          "departamentoId": "{{destinoDepartamentoId}}"
        }
      }
    }
  }
}
```

### 2. **Etapas Específicas a Validar**

| Etapa | ID Esperado | Tipo | O Que Testa |
|-------|-------------|------|-------------|
| **Boas-vindas** | `boas-vindas` | `menu` | Lista núcleos do banco dinamicamente |
| **Escolha Departamento** | `escolha-departamento` | `menu` | Lista departamentos do núcleo escolhido |
| **Coleta Nome** | `coleta-nome` | `pergunta` | Captura nome do usuário |
| **Coleta Email** | `coleta-email` | `pergunta` | Captura email do usuário |
| **Transferir** | `transferir-atendimento` | `acao` | Cria ticket e atribui atendente |

---

## 🧪 Plano de Teste End-to-End

### **Pré-requisitos:**

1. ✅ Backend rodando (porta 3001)
2. ✅ Frontend rodando (porta 3000)
3. ✅ Banco de dados com:
   - Pelo menos 2 núcleos ativos
   - Pelo menos 2 departamentos vinculados a núcleos
   - Pelo menos 2 agentes ativos vinculados a departamentos
4. ⚠️ WhatsApp conectado (Evolution API / Baileys)
5. ⚠️ Webhook configurado

---

### **Teste 1: Criar Fluxo Correto no FluxoBuilder**

**Objetivo**: Criar fluxo com busca dinâmica de núcleos e departamentos

**Passos**:
1. Acessar: http://localhost:3000/gestao/fluxos
2. Clicar **"Novo Fluxo"**
3. Preencher:
   - Nome: `Triagem Dinâmica - Teste`
   - Tipo: `triagem`
   - Canais: `whatsapp`
4. Clicar **"Editar no Builder"**
5. **Criar estrutura de blocos**:

   **Bloco 1: Boas-vindas (Menu de Núcleos)**
   - Tipo: `Menu`
   - Mensagem: `Olá! Escolha o núcleo de atendimento:`
   - Opções: `[]` (deixar vazio - busca dinâmica)
   - Metadados: `resolverOpcoesDinamicamente: "nucleos"`
   
   **Bloco 2: Escolha Departamento (Menu de Departamentos)**
   - Tipo: `Menu`
   - Mensagem: `Selecione o departamento:`
   - Opções: `[]` (deixar vazio - busca dinâmica)
   - Metadados: `resolverOpcoesDinamicamente: "departamentos"`
   
   **Bloco 3: Coleta de Nome**
   - Tipo: `Pergunta`
   - Mensagem: `Qual é o seu nome completo?`
   - Salvar em: `nomeCliente`
   
   **Bloco 4: Coleta de Email**
   - Tipo: `Pergunta`
   - Mensagem: `Qual é o seu email?`
   - Salvar em: `emailCliente`
   
   **Bloco 5: Transferir para Atendimento**
   - Tipo: `Ação`
   - Ação: `transferir`
   - Criar ticket: ✓ Sim
   - Destino: `departamento` (usar `{{destinoDepartamentoId}}`)

6. **Conectar blocos**:
   ```
   [Boas-vindas] → [Escolha Departamento] → [Coleta Nome] → [Coleta Email] → [Transferir]
   ```

7. Clicar **"Salvar"**
8. Clicar **"Publicar"**

**Resultado Esperado**:
- ✅ Fluxo salvo com sucesso
- ✅ Status: "Publicado"
- ✅ Ativo: Sim

---

### **Teste 2: Validar JSON Gerado**

**Objetivo**: Confirmar que JSON está correto para busca dinâmica

**Passos**:
1. Na página de fluxos, clicar no ícone **`</>`** (Visualizar JSON) do fluxo criado
2. Verificar estrutura:

```json
{
  "etapaInicial": "boas-vindas",
  "etapas": {
    "boas-vindas": {
      "id": "boas-vindas",
      "tipo": "menu",
      "mensagem": "Olá! Escolha o núcleo de atendimento:",
      "opcoes": []  // ← DEVE ESTAR VAZIO!
    },
    "escolha-departamento": {
      "id": "escolha-departamento",
      "tipo": "menu",
      "mensagem": "Selecione o departamento:",
      "opcoes": []  // ← DEVE ESTAR VAZIO!
    }
  }
}
```

**Resultado Esperado**:
- ✅ Campo `opcoes` está vazio (`[]`)
- ✅ IDs das etapas são exatamente: `boas-vindas` e `escolha-departamento`
- ✅ Sem etapas hardcoded (ex: `menu_suporte`, `menu_administrativo`)

---

### **Teste 3: Teste Manual via WhatsApp**

**Objetivo**: Validar fluxo real com usuário final

**Pré-requisito**: WhatsApp conectado + Webhook configurado

**Passos**:
1. Enviar mensagem para o WhatsApp conectado ao sistema
2. **Interação esperada**:

```
👤 Usuário: Oi
🤖 Bot: Olá! Escolha o núcleo de atendimento:
       1️⃣ Atendimento Geral
       2️⃣ CSI
       3️⃣ Comercial
       4️⃣ Financeiro
       5️⃣ Suporte Técnico

👤 Usuário: 1

🤖 Bot: Selecione o departamento:
       1️⃣ Suporte Nível 1
       2️⃣ Suporte Nível 2
       3️⃣ Help Desk

👤 Usuário: 1

🤖 Bot: Qual é o seu nome completo?

👤 Usuário: João Silva

🤖 Bot: Qual é o seu email?

👤 Usuário: joao@example.com

🤖 Bot: Perfeito! Estou transferindo você para o departamento Suporte Nível 1.
       Em breve um atendente irá atendê-lo. 😊

[Sistema cria ticket e atribui atendente automaticamente]
```

**Validações**:
- ✅ Núcleos listados vêm do banco de dados
- ✅ Departamentos listados são do núcleo escolhido
- ✅ Coleta de nome e email funciona
- ✅ Ticket criado automaticamente
- ✅ Atendente atribuído (pode verificar no sistema)

---

### **Teste 4: Teste de Cenário 2 (Núcleo sem Departamentos)**

**Objetivo**: Validar transferência direta ao núcleo quando não há departamentos

**Pré-requisito**: Ter 1 núcleo SEM departamentos, mas COM atendentes vinculados

**Passos**:
1. No sistema, criar/editar um núcleo:
   - Nome: `VIP`
   - Departamentos: 0 (nenhum vinculado)
   - Atendentes: 2 (vincular 2 agentes diretamente ao núcleo)
2. Enviar mensagem no WhatsApp
3. Escolher núcleo "VIP"

**Resultado Esperado**:
- ✅ Bot **NÃO** mostra menu de departamentos (pula essa etapa)
- ✅ Bot vai direto para coleta de dados
- ✅ Após coleta, transfere para um dos 2 atendentes do núcleo
- ✅ Ticket criado com `nucleoId` (não `departamentoId`)

---

### **Teste 5: Teste de Cenário 3 (Núcleo Vazio)**

**Objetivo**: Validar comportamento quando núcleo não tem nem departamentos nem atendentes

**Pré-requisito**: Ter 1 núcleo vazio (sem departamentos e sem atendentes)

**Passos**:
1. Criar núcleo: `Marketing` (vazio)
2. Enviar mensagem no WhatsApp
3. Escolher núcleo "Marketing"

**Resultado Esperado**:
- ✅ Bot avança para coleta de dados
- ✅ Ticket criado, mas SEM atendente atribuído (fica em fila geral)
- ✅ Log no backend: `⚠️ Núcleo sem departamentos e sem atendentes`

---

## 🐛 Problemas Conhecidos (a Corrigir)

### 1. **Fluxos Existentes com Hardcode**

**Arquivo**: Qualquer fluxo criado antes desta implementação

**Problema**:
```json
{
  "MENU_NUCLEOS": {
    "opcoes": [
      {"texto": "Suporte Técnico", "proximaEtapa": "menu_suporte"},  // ← Hardcoded!
      {"texto": "Administrativo", "proximaEtapa": "menu_administrativo"}
    ]
  }
}
```

**Solução**:
1. Abrir fluxo no FluxoBuilder
2. Deletar todas as etapas hardcoded (`menu_suporte`, `menu_administrativo`, `menu_comercial`)
3. Criar etapas corretas com IDs: `boas-vindas` e `escolha-departamento`
4. Deixar `opcoes: []` vazio
5. Salvar e republicar

---

### 2. **FlowEngine Precisa de Log Melhor**

**Arquivo**: `backend/src/modules/triagem/engine/flow-engine.ts`

**Melhoria**: Adicionar logs mais detalhados:
```typescript
this.logger.log(`[FLOW ENGINE] 🔍 Resolvendo menu de núcleos...`);
this.logger.log(`[FLOW ENGINE] 📊 Encontrados ${nucleos.length} núcleos ativos`);
this.logger.log(`[FLOW ENGINE] 🎯 Núcleos: ${nucleos.map(n => n.nome).join(', ')}`);
```

---

### 3. **FluxoBuilder Precisa de Template**

**Objetivo**: Adicionar template "Triagem Dinâmica" no FluxoBuilder

**Implementação**:
1. Criar arquivo: `frontend-web/src/features/bot-builder/templates/triagem-dinamica.json`
2. Adicionar botão "Usar Template" na página de criação de fluxo
3. Template já vem com estrutura correta (núcleos + departamentos dinâmicos)

---

## 📋 Checklist de Integração

### Backend:
- [x] FlowEngine implementado com busca dinâmica
- [x] NucleoService retorna estrutura completa
- [x] 3 Cenários de roteamento implementados
- [ ] Logs detalhados em produção
- [ ] Tratamento de erro quando núcleo/departamento não existe
- [ ] Fallback quando todos os atendentes estão ocupados

### Frontend:
- [x] GestaoNucleosPage com vinculação de departamentos
- [x] GestaoDepartamentosPage com CRUD completo
- [x] FluxoBuilderPage com editor visual
- [ ] Template "Triagem Dinâmica" no builder
- [ ] Validação de fluxo (detectar hardcode)
- [ ] Preview de fluxo com dados reais

### Integração WhatsApp:
- [ ] Webhook configurado e testado
- [ ] Mensagens formatadas corretamente
- [ ] Botões interativos funcionando
- [ ] Timeout de sessão configurado
- [ ] Fallback para quando bot não entende

### Testes:
- [ ] Teste manual com WhatsApp real
- [ ] Teste dos 3 cenários de roteamento
- [ ] Teste de coleta de dados
- [ ] Teste de criação de ticket
- [ ] Teste de atribuição de atendente

---

## 🚀 Próximos Passos

### **Imediato** (Hoje):
1. ✅ Validar que FlowEngine está funcionando (logs do backend)
2. ⏳ Criar fluxo de teste no FluxoBuilder
3. ⏳ Testar manualmente via WhatsApp

### **Curto Prazo** (Esta Semana):
1. Corrigir fluxos existentes (remover hardcode)
2. Adicionar template "Triagem Dinâmica"
3. Melhorar logs do FlowEngine
4. Adicionar validação de fluxo

### **Médio Prazo** (Próximas 2 Semanas):
1. Implementar preview de fluxo com dados reais
2. Adicionar analytics (quais núcleos/departamentos mais escolhidos)
3. Implementar A/B testing de fluxos
4. Adicionar fallback inteligente

---

**Última Atualização**: 28 de outubro de 2025  
**Status**: 🟡 Aguardando testes manuais via WhatsApp
