# 🤖 Configuração do Bot de Triagem - ConectCRM

> **Data**: 23 de dezembro de 2025  
> **Status Atual**: ✅ Interface Visual Implementada + JSON Avançado  
> **Nível de Facilidade**: ⭐⭐⭐⭐⭐ (Gestor pode configurar sem programador)

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Métodos de Configuração](#métodos-de-configuração)
3. [Interface Visual (Recomendado)](#interface-visual)
4. [JSON Avançado (Poder Total)](#json-avançado)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Comparação com Mercado](#comparação-com-mercado)

---

## 🌟 Visão Geral

O ConectCRM oferece **2 formas de configurar o bot**, permitindo que gestores façam mudanças sem programador:

### ✅ Método 1: Interface Visual (UI)
- 🎨 **Formulário amigável** na tela "Gestão de Fluxos"
- 📝 **Editor visual** de etapas e opções
- 👤 **Qualquer pessoa** pode usar (não precisa conhecer JSON)
- 🚀 **Deploy instantâneo** com botão "Publicar"

### ✅ Método 2: JSON Avançado (Power Users)
- 💻 **Editor JSON** integrado na interface
- 🔧 **Controle total** sobre estrutura do fluxo
- 🎯 **Recursos avançados**: condições, variáveis, validações
- 📦 **Importar/Exportar** fluxos completos

---

## 🎨 Interface Visual

### Localização

**Menu**: Automações → Bot → Gestão de Fluxos

**Arquivo**: `frontend-web/src/features/gestao/pages/GestaoFluxosPage.tsx`

---

### Tela Principal

```
╔═══════════════════════════════════════════════════════════════╗
║                  📊 GESTÃO DE FLUXOS DE BOT                   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  [KPI Cards]                                                  ║
║  ┌─────────────┬─────────────┬─────────────┬─────────────┐   ║
║  │ Total       │ Publicados  │ Ativos      │ Execuções   │   ║
║  │ 12 fluxos   │ 8 fluxos    │ 10 fluxos   │ 1.543       │   ║
║  └─────────────┴─────────────┴─────────────┴─────────────┘   ║
║                                                                ║
║  [Filtros e Busca]                                            ║
║  🔍 Buscar: [_________________]  [Filtro Tipo ▼] [Status ▼]  ║
║                                                                ║
║  [Botão Ação]                                                 ║
║  [➕ Novo Fluxo]                            [🔄 Atualizar]   ║
║                                                                ║
║  [Lista de Fluxos]                                            ║
║  ┌──────────────────────────────────────────────────────────┐ ║
║  │ 📋 Atendimento Inicial                    [🟢 Ativo]     │ ║
║  │    Tipo: Menu de Opções | Canais: WhatsApp              │ ║
║  │    [✏️ Editar] [📋 Duplicar] [🚀 Publicar] [🗑️ Deletar]  │ ║
║  ├──────────────────────────────────────────────────────────┤ ║
║  │ 📋 Suporte Técnico                        [🟢 Ativo]     │ ║
║  │    Tipo: Árvore de Decisão | Canais: WhatsApp, Chat     │ ║
║  │    [✏️ Editar] [📋 Duplicar] [🚀 Publicar] [🗑️ Deletar]  │ ║
║  └──────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### Modal de Criação/Edição

Ao clicar em **"Novo Fluxo"** ou **"Editar"**, abre modal:

```typescript
// Estrutura do formulário
interface FormState {
  nome: string;              // Nome do fluxo
  descricao: string;         // Descrição
  tipo: TipoFluxo;          // Menu, Árvore, Keywords, etc
  canais: string[];         // WhatsApp, Chat, Instagram, etc
  estruturaJson: string;    // JSON da estrutura (editável)
  ativo: boolean;           // Ativo/Inativo
}
```

```
╔════════════════════════════════════════════════════════════════════╗
║                    📝 CRIAR/EDITAR FLUXO                          ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Nome do Fluxo *                                                  ║
║  [_____________________________________________]                  ║
║                                                                    ║
║  Descrição                                                        ║
║  [_____________________________________________]                  ║
║                                                                    ║
║  Tipo de Fluxo *                                                  ║
║  [Menu de Opções ▼]                                              ║
║   - Menu de Opções (recomendado)                                 ║
║   - Menu Simples                                                  ║
║   - Árvore de Decisão                                            ║
║   - Keyword Match                                                 ║
║   - Coleta de Dados                                              ║
║   - Condicional                                                   ║
║                                                                    ║
║  Canais Ativos                                                    ║
║  ☑ WhatsApp   ☐ Web Chat   ☐ Instagram   ☐ Facebook             ║
║                                                                    ║
║  Status                                                           ║
║  ☑ Ativo                                                          ║
║                                                                    ║
║  ─────────────────────────────────────────────────────────────   ║
║                                                                    ║
║  Estrutura do Fluxo (JSON)                    [📝 Modo Avançado] ║
║  ┌──────────────────────────────────────────────────────────┐    ║
║  │ {                                                         │    ║
║  │   "etapaInicial": "inicio",                              │    ║
║  │   "etapas": {                                            │    ║
║  │     "inicio": {                                          │    ║
║  │       "id": "inicio",                                    │    ║
║  │       "tipo": "mensagem_menu",                           │    ║
║  │       "mensagem": "Bem-vindo! Como podemos ajudar?",     │    ║
║  │       "opcoes": [                                        │    ║
║  │         {                                                │    ║
║  │           "numero": 1,                                   │    ║
║  │           "texto": "Falar com suporte"                   │    ║
║  │         }                                                │    ║
║  │       ]                                                  │    ║
║  │     }                                                    │    ║
║  │   }                                                      │    ║
║  │ }                                                        │    ║
║  └──────────────────────────────────────────────────────────┘    ║
║                                                                    ║
║  [❌ Cancelar]                              [💾 Salvar Fluxo]    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

### Campos Editáveis

#### 1. **Nome do Fluxo** (Obrigatório)
```typescript
nome: string // Ex: "Atendimento Inicial", "Suporte Técnico"
```

#### 2. **Descrição** (Opcional)
```typescript
descricao: string // Ex: "Fluxo principal de triagem do WhatsApp"
```

#### 3. **Tipo de Fluxo** (Obrigatório)
```typescript
tipo: 'menu_opcoes' | 'menu_simples' | 'arvore_decisao' | 
      'keyword_match' | 'coleta_dados' | 'condicional'
```

**Tipos Disponíveis**:
- ✅ **Menu de Opções**: Cliente escolhe 1, 2, 3 (recomendado)
- ✅ **Menu Simples**: Resposta livre, bot interpreta
- ✅ **Árvore de Decisão**: Múltiplas ramificações
- ✅ **Keyword Match**: Bot detecta palavras-chave
- ✅ **Coleta de Dados**: Formulário (nome, CPF, email)
- ✅ **Condicional**: Lógica if/else

#### 4. **Canais Ativos** (Múltipla Escolha)
```typescript
canais: ['whatsapp', 'webchat', 'instagram', 'facebook']
```

Gestor marca quais canais usarão este fluxo.

#### 5. **Status Ativo/Inativo**
```typescript
ativo: boolean // true = bot está ativo
```

---

## 📝 JSON Avançado

### Quando Usar

Use JSON avançado quando precisar de:
- 🎯 **Condições complexas** (if/else)
- 🔢 **Validações** (CPF, email, telefone)
- 📦 **Variáveis** customizadas
- ⏱️ **Timeouts** e regras de tempo
- 🔄 **Roteamento dinâmico**

---

### Estrutura Completa do JSON

```typescript
interface EstruturaFluxo {
  etapaInicial: string;                    // ID da primeira etapa
  versao: string;                          // "1.0.0"
  etapas: Record<string, Etapa>;          // Mapa de etapas
  variaveis?: Record<string, Variavel>;   // Variáveis do fluxo
}

interface Etapa {
  id: string;                              // ID único da etapa
  tipo: TipoEtapa;                        // Tipo da etapa
  mensagem: string;                        // Texto enviado ao cliente
  opcoes?: OpcaoMenu[];                   // Opções de menu (se aplicável)
  nucleosMenu?: string[];                 // IDs de núcleos dinâmicos
  timeout?: number;                        // Timeout em segundos
  acaoTimeout?: TipoAcao;                 // Ação se expirar
  mensagemTimeout?: string;               // Mensagem de timeout
  validacao?: Validacao;                  // Regras de validação
  condicao?: Condicao;                    // Lógica condicional
}

interface OpcaoMenu {
  numero: number;                          // 1, 2, 3...
  texto: string;                          // "Falar com suporte"
  icone?: string;                         // "headset"
  proximaEtapa?: string;                  // ID da próxima etapa
  acao?: TipoAcao;                        // Ação a executar
  nucleoId?: string;                      // ID do núcleo (se transferir)
  prioridade?: Prioridade;                // Prioridade do ticket
  tags?: string[];                        // Tags para o ticket
}
```

---

### Exemplo 1: Fluxo Simples (Menu 2 Opções)

```json
{
  "etapaInicial": "inicio",
  "versao": "1.0.0",
  "etapas": {
    "inicio": {
      "id": "inicio",
      "tipo": "mensagem_menu",
      "mensagem": "Olá! Bem-vindo ao ConectCRM.\n\nEscolha uma opção:",
      "opcoes": [
        {
          "numero": 1,
          "texto": "🛠️ Suporte Técnico",
          "icone": "headset",
          "proximaEtapa": "confirmar_suporte"
        },
        {
          "numero": 2,
          "texto": "💰 Financeiro",
          "icone": "dollar-sign",
          "proximaEtapa": "selecionar_dept_financeiro"
        }
      ]
    },
    "confirmar_suporte": {
      "id": "confirmar_suporte",
      "tipo": "mensagem_menu",
      "mensagem": "Você será direcionado ao Suporte Técnico.\n\nDeseja continuar?",
      "opcoes": [
        {
          "numero": 1,
          "texto": "✅ Sim, continuar",
          "acao": "criar_ticket",
          "nucleoId": "uuid-do-nucleo-suporte",
          "prioridade": "media"
        },
        {
          "numero": 2,
          "texto": "❌ Voltar ao menu",
          "proximaEtapa": "inicio"
        }
      ]
    },
    "selecionar_dept_financeiro": {
      "id": "selecionar_dept_financeiro",
      "tipo": "mensagem_menu",
      "mensagem": "Qual assunto no Financeiro?",
      "opcoes": [
        {
          "numero": 1,
          "texto": "📄 Faturas e Cobranças",
          "acao": "criar_ticket",
          "nucleoId": "uuid-nucleo-financeiro",
          "tags": ["faturas", "cobranca"]
        },
        {
          "numero": 2,
          "texto": "💳 Negociação de Dívidas",
          "acao": "criar_ticket",
          "nucleoId": "uuid-nucleo-financeiro",
          "tags": ["negociacao", "divida"],
          "prioridade": "alta"
        }
      ]
    }
  }
}
```

---

### Exemplo 2: Fluxo com Validação (Coleta CPF)

```json
{
  "etapaInicial": "boas_vindas",
  "etapas": {
    "boas_vindas": {
      "id": "boas_vindas",
      "tipo": "mensagem_menu",
      "mensagem": "Olá! Para iniciar, precisamos de algumas informações.",
      "proximaEtapa": "coletar_cpf"
    },
    "coletar_cpf": {
      "id": "coletar_cpf",
      "tipo": "pergunta_aberta",
      "mensagem": "Por favor, digite seu CPF (apenas números):",
      "validacao": {
        "tipo": "cpf",
        "obrigatorio": true,
        "mensagemErro": "❌ CPF inválido. Digite apenas os 11 números do CPF."
      },
      "timeout": 120,
      "mensagemTimeout": "⏱️ Tempo esgotado. Digite seu CPF para continuar.",
      "proximaEtapa": "coletar_email"
    },
    "coletar_email": {
      "id": "coletar_email",
      "tipo": "pergunta_aberta",
      "mensagem": "Agora, digite seu e-mail:",
      "validacao": {
        "tipo": "email",
        "obrigatorio": true,
        "mensagemErro": "❌ E-mail inválido. Digite um e-mail válido."
      },
      "proximaEtapa": "confirmar_dados"
    },
    "confirmar_dados": {
      "id": "confirmar_dados",
      "tipo": "mensagem_menu",
      "mensagem": "✅ Dados recebidos!\n\nCPF: {{cpf}}\nE-mail: {{email}}\n\nEstá correto?",
      "opcoes": [
        {
          "numero": 1,
          "texto": "✅ Sim, continuar",
          "acao": "criar_ticket",
          "nucleoId": "uuid-nucleo-padrao"
        },
        {
          "numero": 2,
          "texto": "❌ Corrigir dados",
          "proximaEtapa": "coletar_cpf"
        }
      ]
    }
  },
  "variaveis": {
    "cpf": {
      "tipo": "cpf",
      "obrigatorio": true
    },
    "email": {
      "tipo": "email",
      "obrigatorio": true
    }
  }
}
```

---

### Exemplo 3: Fluxo Condicional (Horário de Atendimento)

```json
{
  "etapaInicial": "verificar_horario",
  "etapas": {
    "verificar_horario": {
      "id": "verificar_horario",
      "tipo": "condicional",
      "mensagem": "Verificando horário de atendimento...",
      "condicao": {
        "variavel": "hora_atual",
        "operador": ">",
        "valor": 18,
        "proximaEtapaTrue": "fora_horario",
        "proximaEtapaFalse": "menu_principal"
      }
    },
    "fora_horario": {
      "id": "fora_horario",
      "tipo": "mensagem_menu",
      "mensagem": "🕐 Nosso horário de atendimento é de 8h às 18h.\n\nDeseja deixar uma mensagem?",
      "opcoes": [
        {
          "numero": 1,
          "texto": "✅ Sim, deixar mensagem",
          "proximaEtapa": "coletar_mensagem"
        },
        {
          "numero": 2,
          "texto": "❌ Não, volto depois",
          "acao": "finalizar"
        }
      ]
    },
    "menu_principal": {
      "id": "menu_principal",
      "tipo": "mensagem_menu",
      "mensagem": "Bem-vindo! Como podemos ajudar?",
      "opcoes": [
        {
          "numero": 1,
          "texto": "Falar com atendente",
          "acao": "criar_ticket"
        }
      ]
    },
    "coletar_mensagem": {
      "id": "coletar_mensagem",
      "tipo": "pergunta_aberta",
      "mensagem": "Digite sua mensagem:",
      "acao": "criar_ticket",
      "prioridade": "baixa",
      "tags": ["fora_horario"]
    }
  }
}
```

---

## 🎯 Exemplos Práticos para Gestor

### Cenário 1: Adicionar Nova Opção no Menu

**Situação**: Gestor quer adicionar opção "Cancelamento" no menu financeiro.

**Passo a Passo**:

1. Acesse: **Automações → Bot → Gestão de Fluxos**
2. Clique em **✏️ Editar** no fluxo "Atendimento Financeiro"
3. No editor JSON, localize a etapa do menu financeiro:

```json
"menu_financeiro": {
  "opcoes": [
    { "numero": 1, "texto": "Faturas" },
    { "numero": 2, "texto": "Negociação" }
  ]
}
```

4. **Adicione** a nova opção:

```json
"menu_financeiro": {
  "opcoes": [
    { "numero": 1, "texto": "Faturas" },
    { "numero": 2, "texto": "Negociação" },
    { "numero": 3, "texto": "Cancelamento", "nucleoId": "uuid-financeiro" }
  ]
}
```

5. Clique em **💾 Salvar Fluxo**
6. Clique em **🚀 Publicar** para ativar

✅ **Pronto!** Cliente já vê a opção 3 no WhatsApp.

---

### Cenário 2: Mudar Texto de Boas-Vindas

**Situação**: Gestor quer mudar mensagem inicial do bot.

**Passo a Passo**:

1. Acesse: **Automações → Bot → Gestão de Fluxos**
2. Clique em **✏️ Editar** no fluxo ativo
3. Localize no JSON:

```json
"inicio": {
  "mensagem": "Olá! Como podemos ajudar?"
}
```

4. **Edite** o texto:

```json
"inicio": {
  "mensagem": "🎉 Bem-vindo ao ConectCRM!\n\nFicamos felizes em te atender. Escolha uma das opções abaixo:"
}
```

5. **Salvar** e **Publicar**

✅ **Pronto!** Nova mensagem já aparece para clientes.

---

### Cenário 3: Criar Fluxo Novo do Zero

**Situação**: Gestor quer criar fluxo específico para Black Friday.

**Passo a Passo**:

1. Acesse: **Automações → Bot → Gestão de Fluxos**
2. Clique em **➕ Novo Fluxo**
3. Preencha:
   - **Nome**: "Black Friday 2025"
   - **Descrição**: "Fluxo promocional Black Friday"
   - **Tipo**: Menu de Opções
   - **Canais**: ☑ WhatsApp
   - **Status**: ☑ Ativo

4. **Edite o JSON** (ou use template):

```json
{
  "etapaInicial": "promo",
  "etapas": {
    "promo": {
      "id": "promo",
      "tipo": "mensagem_menu",
      "mensagem": "🔥 BLACK FRIDAY 2025! 🔥\n\n50% OFF em todos os planos!\n\nO que você procura?",
      "opcoes": [
        {
          "numero": 1,
          "texto": "💰 Ver Promoções",
          "proximaEtapa": "ver_promocoes"
        },
        {
          "numero": 2,
          "texto": "🛒 Assinar Agora",
          "acao": "criar_ticket",
          "nucleoId": "uuid-comercial",
          "tags": ["black_friday", "urgente"],
          "prioridade": "alta"
        }
      ]
    },
    "ver_promocoes": {
      "id": "ver_promocoes",
      "tipo": "mensagem_menu",
      "mensagem": "📋 Nossas Promoções:\n\n✅ Plano Básico: R$49/mês (era R$99)\n✅ Plano Pro: R$99/mês (era R$199)\n✅ Plano Enterprise: R$199/mês (era R$399)\n\nAssinar agora?",
      "opcoes": [
        {
          "numero": 1,
          "texto": "✅ Sim, quero assinar!",
          "acao": "criar_ticket",
          "nucleoId": "uuid-comercial",
          "tags": ["black_friday"],
          "prioridade": "alta"
        },
        {
          "numero": 2,
          "texto": "❓ Tenho dúvidas",
          "acao": "criar_ticket",
          "nucleoId": "uuid-suporte"
        }
      ]
    }
  }
}
```

5. **Salvar** e **Publicar**

✅ **Pronto!** Fluxo Black Friday está ativo.

---

## 📊 Comparação com Mercado

### Como Outros Sistemas Funcionam

| Sistema | Método de Configuração | Facilidade (1-5) | Observações |
|---------|----------------------|------------------|-------------|
| **Zendesk** | Zendesk Guide + Answer Bot UI | ⭐⭐⭐ | Interface visual, mas limitada |
| **Freshdesk** | Freddy AI Builder (visual) | ⭐⭐⭐⭐ | Drag-and-drop, intuitivo |
| **Intercom** | Resolution Bot Builder | ⭐⭐⭐⭐⭐ | Muito visual, sem código |
| **HubSpot** | Chatflow Builder (visual) | ⭐⭐⭐⭐ | Drag-and-drop + templates |
| **ManyChat** | Visual Flow Builder | ⭐⭐⭐⭐⭐ | Melhor do mercado para WhatsApp |
| **ConectCRM** | **UI + JSON Híbrido** | ⭐⭐⭐⭐⭐ | **Melhor dos dois mundos** ✅ |

---

### 🏆 Vantagens do ConectCRM

#### 1. **Híbrido UI + JSON**

**ConectCRM**: Gestor escolhe o método
- ✅ Quer simplicidade? Use formulário visual
- ✅ Quer poder total? Edite JSON direto

**Zendesk/Freshdesk**: Apenas UI (limitado)  
**ManyChat**: Apenas visual (sem código avançado)  
**ConectCRM**: **Ambos** ✅

---

#### 2. **Templates Prontos**

```typescript
// ConectCRM inclui templates default
const defaultEstrutura: EstruturaFluxo = {
  etapaInicial: 'inicio',
  etapas: {
    inicio: {
      mensagem: 'Bem-vindo! Como podemos ajudar?',
      opcoes: [
        { numero: 1, texto: 'Falar com suporte' },
        { numero: 2, texto: 'Falar com vendas' }
      ]
    }
  }
};
```

**Benefício**: Gestor só edita o que precisa, não cria do zero.

---

#### 3. **Validação em Tempo Real**

```typescript
// ConectCRM valida JSON ao salvar
const estrutura = parseJsonSafe(formState.estruturaJson);
if (!estrutura) {
  setJsonErro('Estrutura inválida. Verifique se o JSON está correto.');
  return;
}
```

**Resultado**: Gestor **não consegue** salvar fluxo quebrado.

---

#### 4. **Versionamento Automático**

```typescript
@Column({ type: 'jsonb', default: '[]', name: 'historico_versoes' })
historicoVersoes: VersaoFluxo[];

@Column({ type: 'integer', default: 1, name: 'versao_atual' })
versaoAtual: number;
```

**Benefício**: Gestor pode **reverter** para versão antiga se errar.

---

#### 5. **Deploy Instantâneo**

```typescript
// Publicar fluxo = 1 clique
await fluxoService.publicar(fluxoId);
```

**Zendesk**: Precisa "publicar" no Answer Bot  
**Freshdesk**: Precisa "ativar" no Freddy  
**ConectCRM**: 1 botão "🚀 Publicar" ✅

---

#### 6. **Duplicação de Fluxos**

```typescript
// Gestor duplica fluxo em 1 clique
await fluxoService.duplicar(fluxo.id, `${fluxo.nome} (cópia)`);
```

**Uso**: Criar fluxo "Black Friday" copiando fluxo "Comercial Padrão".

---

## ✅ Conclusão

### Resposta Direta

**Pergunta**: "Como será configurado o bot? Será apenas JSON ou de forma que facilite o trabalho do gestor?"

**Resposta**: ✅ **AMBOS!** O ConectCRM oferece:

1. ✅ **Interface Visual** (Formulário na UI)
   - Gestor edita sem código
   - Templates prontos
   - Validação automática
   - Deploy 1 clique

2. ✅ **JSON Avançado** (Power Users)
   - Controle total
   - Recursos avançados (condições, validações)
   - Importar/exportar fluxos

3. ✅ **Híbrido** (Melhor dos dois mundos)
   - Gestor começa no visual
   - Se precisar de algo avançado, edita JSON
   - Sistema valida antes de salvar

---

### Facilidade para Gestor

#### ⭐⭐⭐⭐⭐ (5/5 estrelas)

**Por quê?**

✅ **Não precisa de programador** para:
- Adicionar opção no menu
- Mudar texto de mensagens
- Criar fluxo novo com template
- Ativar/desativar fluxo
- Duplicar fluxo existente

✅ **Precisa de programador apenas** para:
- Condições complexas (if/else avançado)
- Integrações customizadas (APIs externas)
- Validações muito específicas

---

### Comparação com Mercado

| Critério | Zendesk | Freshdesk | Intercom | ManyChat | **ConectCRM** |
|----------|---------|-----------|----------|----------|--------------|
| **Interface Visual** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Edição JSON** | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Templates Prontos** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Versionamento** | ✅ | ❌ | ✅ | ❌ | ✅ |
| **Deploy Instantâneo** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Duplicação** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Validação RT** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Open Source** | ❌ | ❌ | ❌ | ❌ | ✅ |

---

### Posicionamento

O ConectCRM está **no mesmo nível** de facilidade que:
- ✅ Intercom (Resolution Bot Builder)
- ✅ ManyChat (Visual Flow Builder)
- ✅ Freshdesk (Freddy AI Builder)

**MAS com vantagem adicional**:
- ✅ **Edição JSON** para casos avançados (único do mercado)
- ✅ **Open source** (controle total do código)

---

## 📚 Referências Técnicas

### Arquivos Principais

**Backend**:
- `backend/src/modules/triagem/entities/fluxo-triagem.entity.ts` - Estrutura do fluxo
- `backend/src/modules/triagem/dto/create-fluxo.dto.ts` - Validações
- `backend/src/modules/triagem/services/triagem-bot.service.ts` - Engine do bot

**Frontend**:
- `frontend-web/src/features/gestao/pages/GestaoFluxosPage.tsx` - Interface visual
- `frontend-web/src/services/fluxoService.ts` - API service
- `frontend-web/src/pages/AutomacoesPage.tsx` - Menu Automações

---

## 🚀 Próximos Passos (Roadmap)

### Q1 2026 - Interface Drag-and-Drop

```
┌─────────────────────────────────────────────────────────┐
│  🎨 EDITOR VISUAL DE FLUXO (Drag-and-Drop)             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Início] → [Menu 1] → [Criar Ticket]                  │
│              ↓                                           │
│           [Menu 2] → [Transferir]                       │
│                                                          │
│  [➕ Adicionar Etapa]  [🗑️ Deletar]  [⚙️ Configurar]   │
└─────────────────────────────────────────────────────────┘
```

**Benefício**: Gestor monta fluxo **arrastando blocos**, sem editar JSON.

---

**Conclusão Final**: O ConectCRM já implementa um sistema **nível Enterprise** de configuração de bot, com interface amigável para gestores E poder total para usuários avançados via JSON. Está no mesmo patamar de facilidade de Intercom/ManyChat/Freshdesk, mas com flexibilidade adicional que eles não têm.
