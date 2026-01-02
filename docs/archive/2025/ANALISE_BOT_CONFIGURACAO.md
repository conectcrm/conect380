# 🤖 Análise do Bot - Configuração e Integração com Serviços

## 📊 Resumo Executivo

✅ **Status**: Bot TOTALMENTE integrado com os serviços do sistema  
✅ **Configuração**: Dinâmica via banco de dados  
✅ **Locais de Alteração**: Identificados e documentados

---

## 🔍 Como o Bot Funciona

### Fluxo de Funcionamento

```
1. Cliente envia mensagem WhatsApp
   ↓
2. Webhook processa e identifica empresa
   ↓
3. Bot busca fluxo publicado no banco
   ↓
4. FlowEngine interpreta etapas do fluxo
   ↓
5. Bot busca NÚCLEOS E DEPARTAMENTOS do banco (visivelNoBot = true)
   ↓
6. Cliente escolhe núcleo/departamento
   ↓
7. Sistema distribui ticket para atendente
   ↓
8. Ticket criado e atribuído
```

### Integração com Serviços ✅

O bot está **100% integrado** com os serviços do sistema:

1. ✅ **NucleoService** - Busca núcleos visíveis (`findOpcoesParaBot`)
2. ✅ **DepartamentoService** - Busca departamentos ativos
3. ✅ **AtribuicaoService** - Distribui tickets automaticamente
4. ✅ **TicketService** - Cria tickets no sistema
5. ✅ **WhatsAppSenderService** - Envia mensagens
6. ✅ **FlowEngine** - Interpreta fluxo configurado
7. ✅ **HorarioUtil** - Verifica horário de funcionamento

---

## 📍 Onde Alterar as Opções do Bot

### 🎯 1. Núcleos (Opções Principais)

**Onde configurar**: `Gestão de Núcleos` ou futuramente em `Atendimento → Configurações → Núcleos`

**Arquivo Frontend**: 
- `frontend-web/src/features/gestao/pages/GestaoNucleosPage.tsx`

**Campos que afetam o bot**:

```typescript
interface Nucleo {
  nome: string;                    // Nome exibido no menu do bot
  descricao: string;               // Descrição opcional
  cor: string;                     // Cor do núcleo (ex: #159A9C)
  icone: string;                   // Ícone (ex: "headset")
  ativo: boolean;                  // ⚠️ Se false, não aparece no bot
  visivelNoBot: boolean;           // ⚠️ CRÍTICO: Se false, oculta do bot
  prioridade: number;              // Ordem de exibição (menor = primeiro)
  horarioFuncionamento: object;    // Define quando núcleo está disponível
  mensagemBoasVindas: string;      // Mensagem ao cliente escolher o núcleo
  mensagemForaHorario: string;     // Mensagem fora do horário
}
```

**Configuração no banco**:
```sql
-- Ver núcleos visíveis no bot
SELECT id, nome, ativo, visivel_no_bot, prioridade
FROM nucleos_atendimento
WHERE ativo = true AND visivel_no_bot = true
ORDER BY prioridade ASC, nome ASC;

-- Ocultar núcleo do bot
UPDATE nucleos_atendimento
SET visivel_no_bot = false
WHERE nome = 'CSI';

-- Alterar ordem de exibição
UPDATE nucleos_atendimento
SET prioridade = 10
WHERE nome = 'Comercial';
```

**Tela de configuração**:
```
Gestão de Núcleos → Editar Núcleo → Checkbox "Visível no Bot"
```

---

### 🏢 2. Departamentos (Subopcões)

**Onde configurar**: Dentro de cada núcleo na tela de Gestão de Núcleos

**Arquivo Frontend**: 
- `frontend-web/src/features/gestao/pages/GestaoNucleosPage.tsx` (modal de departamentos)

**Campos que afetam o bot**:

```typescript
interface Departamento {
  nome: string;                    // Nome exibido no submenu do bot
  descricao: string;               // Descrição opcional
  nucleoId: string;                // Núcleo pai
  ativo: boolean;                  // ⚠️ Se false, não aparece
  visivelNoBot: boolean;           // ⚠️ CRÍTICO: Se false, oculta do bot
  ordem: number;                   // Ordem dentro do núcleo
}
```

**Configuração no banco**:
```sql
-- Ver departamentos visíveis de um núcleo
SELECT d.id, d.nome, d.ativo, d.visivel_no_bot, d.ordem, n.nome as nucleo
FROM departamentos d
JOIN nucleos_atendimento n ON d.nucleo_id = n.id
WHERE d.ativo = true 
  AND d.visivel_no_bot = true
  AND n.visivel_no_bot = true
ORDER BY d.ordem ASC, d.nome ASC;

-- Ocultar departamento do bot
UPDATE departamentos
SET visivel_no_bot = false
WHERE nome = 'Cobrança';
```

**Tela de configuração**:
```
Gestão de Núcleos → Expandir Núcleo → Gerenciar Departamentos → Checkbox "Visível no Bot"
```

---

### 🎨 3. Fluxo de Conversa

**Onde configurar**: `Gestão de Fluxos` (Builder Visual)

**Arquivo Frontend**: 
- `frontend-web/src/features/atendimento/pages/FluxoBuilderPage.tsx`

**O que pode ser configurado**:

```typescript
interface FluxoTriagem {
  nome: string;                    // Nome do fluxo
  descricao: string;               // Descrição
  canal: string[];                 // ["whatsapp", "telegram"]
  ativo: boolean;                  // ⚠️ Se false, bot não usa
  publicado: boolean;              // ⚠️ Só fluxos publicados funcionam
  prioridade: number;              // Ordem de preferência
  estrutura: {
    etapas: {
      [key: string]: Etapa         // Etapas configuradas no builder
    }
  }
}

interface Etapa {
  tipo: string;                    // "mensagem", "menu", "pergunta", "condicional"
  mensagem: string;                // Texto exibido ao cliente
  opcoes?: BotOption[];            // Opções de menu
  validacao?: object;              // Regras de validação
  aguardaResposta: boolean;        // Se espera input do cliente
  proximaEtapa?: string;           // Próxima etapa do fluxo
}
```

**Como editar**:
```
1. Acessar: Gestão → Fluxos de Bot
2. Clicar em "Editar" no fluxo desejado
3. Usar builder visual para:
   - Adicionar/remover etapas
   - Alterar mensagens
   - Configurar opções de menu
   - Definir validações
4. Salvar e Publicar
```

**⚠️ IMPORTANTE**: Só fluxos com `publicado = true` funcionam!

---

## 🔧 Backend - Serviços Integrados

### 1. NucleoService.findOpcoesParaBot()

**Arquivo**: `backend/src/modules/triagem/services/nucleo.service.ts` (linha 287)

**O que faz**:
```typescript
async findOpcoesParaBot(empresaId: string): Promise<any[]> {
  // 1. Busca núcleos ativos e visíveis
  const nucleos = await this.nucleoRepository
    .createQueryBuilder('nucleo')
    .where('nucleo.empresaId = :empresaId', { empresaId })
    .andWhere('nucleo.ativo = true')
    .andWhere('nucleo.visivelNoBot = true')  // ⚡ FILTRO CRÍTICO
    .orderBy('nucleo.prioridade', 'ASC')
    .getMany();

  // 2. Para cada núcleo, busca departamentos visíveis
  const departamentos = await this.manager
    .getRepository('departamentos')
    .where('dep.nucleoId = :nucleoId', { nucleoId: nucleo.id })
    .andWhere('dep.ativo = true')
    .andWhere('dep.visivelNoBot = true')    // ⚡ FILTRO CRÍTICO
    .getMany();

  // 3. Verifica horário de funcionamento
  const verificacao = HorarioUtil.verificarDisponibilidade(
    nucleo.horarioFuncionamento,
    new Date()
  );

  // 4. Retorna estrutura hierárquica
  return {
    id: nucleo.id,
    nome: nucleo.nome,
    disponivel: verificacao.estaAberto,
    departamentos: [...]
  };
}
```

**Integração**:
- Chamado em `TriagemBotService.processarMensagemWhatsApp()`
- Chamado em `FlowEngine.buildResponse()` para montar menus dinâmicos

---

### 2. FlowEngine.buildResponse()

**Arquivo**: `backend/src/modules/triagem/engine/flow-engine.ts`

**O que faz**:
```typescript
async buildResponse(): Promise<RespostaBot> {
  // 1. Pega etapa atual da sessão
  const etapa = fluxo.estrutura.etapas[sessao.etapaAtual];

  // 2. Se etapa tem tipo "menu-nucleos" → busca núcleos dinâmicos
  if (etapa.tipo === 'menu' && etapa.opcoesDinamicas === 'nucleos') {
    const nucleos = await this.helpers.buscarNucleosParaBot(sessao);
    opcoes = criarOpcoesNucleos(nucleos);  // Formata para menu
  }

  // 3. Se etapa tem tipo "menu-departamentos" → busca departamentos
  if (etapa.tipo === 'menu' && etapa.opcoesDinamicas === 'departamentos') {
    const nucleoId = sessao.variaveis.nucleoEscolhido;
    const departamentos = nucleos.find(n => n.id === nucleoId).departamentos;
    opcoes = criarOpcoesDepartamentos(departamentos);
  }

  // 4. Substitui variáveis nas mensagens
  mensagem = mensagem.replace('{{nomeCliente}}', sessao.nomeContato);

  // 5. Retorna resposta formatada
  return {
    mensagem,
    opcoes,
    aguardaResposta: etapa.aguardaResposta
  };
}
```

**Variáveis disponíveis**:
- `{{nomeCliente}}` - Nome do contato
- `{{nucleoEscolhido}}` - Nome do núcleo selecionado
- `{{departamentoEscolhido}}` - Nome do departamento selecionado
- `{{telefone}}` - Telefone do contato

---

## 📋 Checklist de Configuração

### Para adicionar novo núcleo no bot:

- [ ] 1. Acessar **Gestão de Núcleos**
- [ ] 2. Clicar em **"Novo Núcleo"**
- [ ] 3. Preencher:
  - Nome (ex: "Financeiro")
  - Descrição (ex: "Dúvidas sobre pagamentos")
  - Cor (ex: "#0EA5E9")
  - Ícone (ex: "dollar-sign")
- [ ] 4. **✅ Marcar "Ativo"**
- [ ] 5. **✅ Marcar "Visível no Bot"**
- [ ] 6. Definir prioridade (ordem no menu)
- [ ] 7. Configurar horário de funcionamento
- [ ] 8. Adicionar mensagem de boas-vindas
- [ ] 9. Salvar
- [ ] 10. Testar no WhatsApp

### Para adicionar departamento:

- [ ] 1. Acessar **Gestão de Núcleos**
- [ ] 2. Expandir núcleo desejado
- [ ] 3. Clicar em **"Gerenciar Departamentos"**
- [ ] 4. Clicar em **"Novo Departamento"**
- [ ] 5. Preencher:
  - Nome (ex: "Cobrança")
  - Descrição (ex: "Equipe de cobrança")
- [ ] 6. **✅ Marcar "Ativo"**
- [ ] 7. **✅ Marcar "Visível no Bot"**
- [ ] 8. Definir ordem
- [ ] 9. Salvar
- [ ] 10. Testar no WhatsApp

### Para editar fluxo de conversa:

- [ ] 1. Acessar **Gestão → Fluxos de Bot**
- [ ] 2. Clicar em **"Editar"** no fluxo ativo
- [ ] 3. Usar builder visual para modificar etapas
- [ ] 4. Alterar mensagens conforme necessário
- [ ] 5. **⚠️ Salvar** (ícone de disquete)
- [ ] 6. **⚠️ Publicar** (botão "Publicar Versão")
- [ ] 7. Confirmar publicação
- [ ] 8. Testar no WhatsApp

---

## 🎯 Exemplo Prático: Como Aparece no Bot

### Configuração no Banco

```sql
-- Núcleos configurados
nucleos_atendimento:
  1. Comercial (visivelNoBot=true, prioridade=10)
  2. Financeiro (visivelNoBot=true, prioridade=20)
  3. Suporte (visivelNoBot=true, prioridade=30)
  4. CSI (visivelNoBot=false) ← NÃO APARECE

-- Departamentos do Comercial
departamentos:
  - Vendas (visivelNoBot=true, ordem=1)
  - Pós-Vendas (visivelNoBot=true, ordem=2)
```

### Como Cliente Vê no WhatsApp

```
Bot: 👋 Olá! Bem-vindo ao ConectCRM!
     Como posso te ajudar hoje?

     1️⃣ Comercial
     2️⃣ Financeiro
     3️⃣ Suporte Técnico

Cliente: 1

Bot: 🎯 Você escolheu: Comercial
     Qual setor deseja falar?

     1️⃣ Vendas
     2️⃣ Pós-Vendas

Cliente: 2

Bot: ✅ Perfeito! Você será atendido pela equipe de Pós-Vendas.
     Aguarde enquanto conectamos você com um atendente...

[Sistema cria ticket e distribui automaticamente]
```

---

## 🔄 Fluxo de Dados Completo

```mermaid
graph TD
    A[Cliente WhatsApp] -->|Envia mensagem| B[Webhook Backend]
    B --> C{Sessão existe?}
    C -->|Não| D[Criar sessão]
    C -->|Sim| E[Buscar sessão]
    D --> F[Buscar fluxo publicado]
    E --> F
    F --> G[FlowEngine interpreta etapa]
    G --> H{Tipo de etapa?}
    H -->|Menu Núcleos| I[NucleoService.findOpcoesParaBot]
    H -->|Mensagem| J[Enviar mensagem]
    H -->|Pergunta| K[Aguardar resposta]
    I --> L[Filtrar visivelNoBot=true]
    L --> M[Verificar horário]
    M --> N[Buscar departamentos visíveis]
    N --> O[Montar menu dinâmico]
    O --> P[WhatsAppSender envia]
    P --> Q[Cliente responde]
    Q --> R{Escolheu núcleo?}
    R -->|Sim| S[Salvar em sessão]
    S --> T{Tem departamentos?}
    T -->|Sim| U[Mostrar submenu]
    T -->|Não| V[Criar ticket]
    U --> W[Cliente escolhe dept]
    W --> V
    V --> X[AtribuicaoService distribui]
    X --> Y[Ticket atribuído a atendente]
    Y --> Z[Bot transfere conversa]
```

---

## 🚨 Problemas Comuns e Soluções

### 1. Núcleo não aparece no bot

**Causas possíveis**:
- ✅ `ativo = false`
- ✅ `visivelNoBot = false`
- ✅ Horário de funcionamento fora
- ✅ Sem atendentes disponíveis

**Solução**:
```sql
-- Verificar configuração
SELECT id, nome, ativo, visivel_no_bot, horario_funcionamento
FROM nucleos_atendimento
WHERE nome = 'Nome do Núcleo';

-- Corrigir
UPDATE nucleos_atendimento
SET ativo = true, visivel_no_bot = true
WHERE nome = 'Nome do Núcleo';
```

### 2. Departamento não aparece

**Causas possíveis**:
- ✅ `ativo = false`
- ✅ `visivelNoBot = false`
- ✅ Núcleo pai não visível

**Solução**:
```sql
-- Verificar
SELECT d.nome, d.ativo, d.visivel_no_bot, n.nome as nucleo
FROM departamentos d
JOIN nucleos_atendimento n ON d.nucleo_id = n.id
WHERE d.nome = 'Nome do Departamento';

-- Corrigir
UPDATE departamentos
SET ativo = true, visivel_no_bot = true
WHERE nome = 'Nome do Departamento';
```

### 3. Bot não responde

**Causas possíveis**:
- ✅ Nenhum fluxo publicado
- ✅ Fluxo com erro de estrutura
- ✅ Webhook não configurado

**Solução**:
```sql
-- Verificar fluxo publicado
SELECT id, nome, ativo, publicado, canal
FROM fluxos_triagem
WHERE publicado = true AND ativo = true;

-- Se não houver, publicar um:
UPDATE fluxos_triagem
SET publicado = true, ativo = true
WHERE nome = 'Fluxo Padrão';
```

---

## 📊 Resumo Final

### ✅ Bot está integrado com:
1. ✅ NucleoService (busca núcleos dinâmicos)
2. ✅ DepartamentoService (busca departamentos)
3. ✅ AtribuicaoService (distribui tickets)
4. ✅ TicketService (cria tickets)
5. ✅ FlowEngine (interpreta fluxo)
6. ✅ HorarioUtil (verifica disponibilidade)

### 📍 Onde alterar opções do bot:

| O que alterar | Onde | Campo crítico |
|---------------|------|---------------|
| **Núcleos** | Gestão de Núcleos | `visivelNoBot` ✅ |
| **Departamentos** | Gestão de Núcleos → Departamentos | `visivelNoBot` ✅ |
| **Fluxo de conversa** | Gestão de Fluxos | `publicado` ✅ |
| **Mensagens** | FluxoBuilderPage (builder visual) | Etapas do fluxo |
| **Horários** | Gestão de Núcleos → Horário | `horarioFuncionamento` |
| **Ordem de exibição** | Gestão de Núcleos | `prioridade` |

### 🎯 Campo mais importante:

**`visivelNoBot = true`** 

Este campo controla se núcleo/departamento aparece no bot. Se estiver `false`, mesmo que ativo, não aparecerá!

---

**Autor**: Análise automatizada do sistema ConectCRM  
**Data**: 10 de novembro de 2025  
**Versão**: 1.0.0
