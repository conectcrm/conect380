# 🤖 Análise do Sistema de Bot Atual - ConectCRM

**Data**: 24 de outubro de 2025  
**Objetivo**: Avaliar sistema de bot existente e propor melhorias para gestão sem código

---

## 📊 RESUMO EXECUTIVO

### ✅ O Que JÁ Existe

O sistema atual possui uma **estrutura robusta e funcional** de bot de triagem:

1. **Backend Completo** (NestJS + TypeORM)
   - ✅ Fluxos configuráveis via JSON
   - ✅ Múltiplas etapas e ramificações
   - ✅ Integração com núcleos e departamentos
   - ✅ Webhook WhatsApp integrado
   - ✅ Sessões de triagem persistentes
   - ✅ Estatísticas e métricas

2. **Frontend de Gestão** (React + TypeScript)
   - ✅ CRUD de fluxos completo
   - ✅ Filtros avançados
   - ✅ Duplicação de fluxos
   - ✅ Publicação/Despublicação
   - ✅ Editor JSON (textarea)

### ⚠️ Limitações Identificadas

1. **Editor JSON Manual**
   - ❌ Gestor precisa entender estrutura JSON
   - ❌ Fácil cometer erros de sintaxe
   - ❌ Sem validação visual
   - ❌ Difícil visualizar fluxo completo
   - ❌ Não há preview em tempo real

2. **Falta de Interface Visual**
   - ❌ Sem drag & drop
   - ❌ Sem canvas de fluxo
   - ❌ Sem conexões visuais
   - ❌ Sem biblioteca de blocos

3. **Complexidade Técnica**
   - ❌ Requer conhecimento de:
     - Estrutura JSON
     - IDs de núcleos
     - IDs de departamentos
     - Sintaxe de condições
     - Tipos de ações

---

## 🏗️ ESTRUTURA ATUAL DO SISTEMA

### 📂 Backend (NestJS)

#### **Entities**

```typescript
// fluxo-triagem.entity.ts
interface EstruturaFluxo {
  etapaInicial: string;
  versao: string;
  etapas: Record<string, Etapa>;
  variaveis?: Record<string, VariavelConfig>;
}

interface Etapa {
  id: string;
  tipo: 'mensagem_menu' | 'pergunta_aberta' | 'validacao' | 'acao' | 'condicional';
  mensagem: string;
  opcoes?: OpcaoMenu[];
  timeout?: number;
  condicoes?: Condicao[];
  proximaEtapa?: string;
}

interface OpcaoMenu {
  valor: string;
  texto: string;
  descricao?: string;
  acao: 'proximo_passo' | 'transferir_nucleo' | 'transferir_atendente' | 'finalizar';
  proximaEtapa?: string;
  nucleoId?: string;
  salvarContexto?: Record<string, any>;
}
```

#### **Service Principal**

```typescript
// triagem-bot.service.ts
- processarMensagemWhatsApp(): Webhook entry point
- iniciarTriagem(): Cria nova sessão
- processarResposta(): Processa resposta do usuário
- montarRespostaEtapa(): Gera mensagem e opções
- executarAcao(): Executa ações (transferir, finalizar, etc.)
- avaliarCondicoes(): Lógica condicional
- criarOpcoesNucleos(): Menu dinâmico de núcleos
- criarOpcoesDepartamentos(): Menu dinâmico de departamentos
```

#### **Recursos Avançados**

- ✅ Botões interativos WhatsApp (Reply Buttons, List Messages)
- ✅ Reconhecimento de cliente cadastrado
- ✅ Preenchimento automático de dados
- ✅ Navegação condicional baseada em contexto
- ✅ Departamentos dinâmicos por núcleo
- ✅ Estatísticas completas (execuções, conclusões, abandonos)

### 📂 Frontend (React)

#### **Página de Gestão**

```typescript
// GestaoFluxosPage.tsx
Componentes:
- Lista de fluxos (cards)
- Filtros (tipo, status, publicação, canal)
- Modal de criação/edição
- Editor JSON (textarea)
- Botões: Duplicar, Publicar, Excluir
```

#### **Service de API**

```typescript
// fluxoService.ts
- listar(filtros)
- buscarPorId(id)
- criar(dto)
- atualizar(id, dto)
- duplicar(id, novoNome)
- publicar(id)
- despublicar(id)
- deletar(id)
```

---

## 🎯 PROPOSTA DE MELHORIA

### 🚀 Solução: Construtor Visual de Fluxos (Flow Builder)

Manter a estrutura atual (que já funciona bem!) e adicionar camada visual por cima.

#### **Arquitetura Proposta**

```
┌─────────────────────────────────────────────────┐
│         INTERFACE VISUAL (Nova)                 │
│  ┌───────────────────────────────────────────┐  │
│  │  Canvas Drag & Drop (React Flow)          │  │
│  │  - Arrastar blocos                        │  │
│  │  - Conectar etapas                        │  │
│  │  - Configurar cada bloco                  │  │
│  └───────────────────────────────────────────┘  │
│              ▼                                   │
│  ┌───────────────────────────────────────────┐  │
│  │  Conversor Visual ↔ JSON                  │  │
│  │  - Transforma canvas em JSON              │  │
│  │  - Transforma JSON em canvas              │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│      ESTRUTURA JSON (Já existe)                 │
│  {                                              │
│    etapaInicial: "inicio",                      │
│    etapas: { ... },                             │
│    variaveis: { ... }                           │
│  }                                              │
└─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────┐
│      BACKEND (Sem alterações!)                  │
│  - triagem-bot.service.ts                       │
│  - fluxo-triagem.entity.ts                      │
│  - Webhook WhatsApp                             │
└─────────────────────────────────────────────────┘
```

#### **Benefícios da Abordagem**

✅ **Sem quebrar código existente**  
✅ **Backend continua igual**  
✅ **Fluxos atuais continuam funcionando**  
✅ **Editor JSON mantido como fallback**  
✅ **Migração gradual**

---

## 🎨 DETALHAMENTO DA SOLUÇÃO

### 📦 Biblioteca Recomendada: **React Flow**

**Por quê?**
- ✅ Open source e bem mantida
- ✅ TypeScript nativo
- ✅ Drag & Drop embutido
- ✅ Conexões automáticas
- ✅ Customização total
- ✅ Performance otimizada
- ✅ Mini-map e controles de zoom
- ✅ Documentação extensa

**Instalação:**
```bash
npm install reactflow
```

### 🧩 Tipos de Blocos (Nodes)

```typescript
// 1. Bloco de Mensagem
{
  tipo: 'mensagem',
  conteudo: 'Bem-vindo ao atendimento!',
  aguardarResposta: false
}

// 2. Bloco de Menu
{
  tipo: 'menu',
  mensagem: 'Escolha uma opção:',
  opcoes: [
    { numero: 1, texto: 'Suporte', nucleoId: 'xxx' },
    { numero: 2, texto: 'Vendas', nucleoId: 'yyy' }
  ]
}

// 3. Bloco de Pergunta
{
  tipo: 'pergunta',
  mensagem: 'Qual seu nome?',
  variavel: 'nome',
  validacao: 'texto'
}

// 4. Bloco de Condição
{
  tipo: 'condicao',
  se: 'clienteCadastrado === true',
  entao: 'etapa-X',
  senao: 'etapa-Y'
}

// 5. Bloco de Ação
{
  tipo: 'acao',
  acao: 'transferir_nucleo',
  nucleoId: 'xxx',
  departamentoId: 'yyy'
}

// 6. Bloco de Fim
{
  tipo: 'finalizar',
  mensagem: 'Atendimento encerrado!'
}
```

### 🎛️ Interface do Builder

#### **Layout**

```
┌─────────────────────────────────────────────────────────────────┐
│  📝 Fluxo: Atendimento Padrão          [Salvar] [Testar] [Pub]  │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                     │
│  BLOCOS    │                                                     │
│            │                CANVAS                               │
│  📨 Msg    │           (Área de arrastar)                        │
│  ❓ Menu   │                                                     │
│  📝 Perg   │     [Início] ──→ [Menu] ──→ [Ação]                 │
│  🔀 Cond   │                    │                                │
│  🎯 Ação   │                    └──→ [Fim]                       │
│  🏁 Fim    │                                                     │
│            │                                                     │
├────────────┼────────────────────────────────────────────────────┤
│ PREVIEW    │  CONFIGURAÇÕES DO BLOCO                            │
│            │                                                     │
│  Teste o   │  [Menu Principal]                                  │
│  fluxo     │  Mensagem: [Escolha uma opção:]                    │
│  aqui      │  Opções:                                           │
│            │    1. Suporte   → [Núcleo: Suporte Técnico ▼]     │
│            │    2. Vendas    → [Núcleo: Comercial ▼]           │
│            │  [+ Adicionar opção]                               │
└────────────┴────────────────────────────────────────────────────┘
```

### 🔧 Componentes Necessários

#### **1. FlowBuilder (Página Principal)**
```tsx
<FlowBuilder>
  <Toolbar />
  <BlockLibrary />
  <Canvas />
  <BlockConfig />
  <Preview />
</FlowBuilder>
```

#### **2. BlockLibrary (Biblioteca de Blocos)**
```tsx
<BlockLibrary>
  <Block type="mensagem" icon="📨" />
  <Block type="menu" icon="❓" />
  <Block type="pergunta" icon="📝" />
  <Block type="condicao" icon="🔀" />
  <Block type="acao" icon="🎯" />
  <Block type="finalizar" icon="🏁" />
</BlockLibrary>
```

#### **3. Canvas (React Flow)**
```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={customNodeTypes}
>
  <Background />
  <Controls />
  <MiniMap />
</ReactFlow>
```

#### **4. BlockConfig (Configuração do Bloco)**
```tsx
// Quando usuário clica em um bloco
<BlockConfig block={selectedBlock}>
  {block.tipo === 'menu' && (
    <MenuConfig
      mensagem={block.mensagem}
      opcoes={block.opcoes}
      onChange={updateBlock}
    />
  )}
  {block.tipo === 'acao' && (
    <AcaoConfig
      acao={block.acao}
      nucleos={nucleosDisponiveis}
      onChange={updateBlock}
    />
  )}
</BlockConfig>
```

---

## 🎬 ROADMAP DE IMPLEMENTAÇÃO

### 📅 Fase 1: MVP Básico (1-2 semanas)

**Objetivo**: Construtor visual funcional com tipos básicos

- [ ] Instalar e configurar React Flow
- [ ] Criar página `FluxoBuilderPage.tsx`
- [ ] Implementar biblioteca de blocos
- [ ] Canvas drag & drop
- [ ] Conversor JSON ↔ Visual
- [ ] Salvar fluxo visual no formato atual

**Blocos MVP**:
- ✅ Mensagem
- ✅ Menu (opções)
- ✅ Ação (transferir núcleo)
- ✅ Finalizar

### 📅 Fase 2: Recursos Avançados (2-3 semanas)

- [ ] Bloco de pergunta com validação
- [ ] Bloco de condição (if/else)
- [ ] Configuração de departamentos
- [ ] Contexto e variáveis
- [ ] Preview interativo (testar fluxo)
- [ ] Validação de fluxo (loops, etapas órfãs)

### 📅 Fase 3: UX e Polimento (1-2 semanas)

- [ ] Templates de fluxos prontos
- [ ] Importar fluxo JSON existente
- [ ] Histórico de versões
- [ ] Comparar versões
- [ ] Duplicar etapas
- [ ] Atalhos de teclado
- [ ] Tour guiado (onboarding)

---

## 📋 ESTRUTURA DE ARQUIVOS PROPOSTA

```
frontend-web/src/
├── features/
│   └── bot-builder/               # 🆕 Nova feature
│       ├── components/
│       │   ├── BlockLibrary.tsx
│       │   ├── Canvas.tsx
│       │   ├── BlockConfig.tsx
│       │   ├── Preview.tsx
│       │   └── blocks/            # Blocos customizados
│       │       ├── MensagemBlock.tsx
│       │       ├── MenuBlock.tsx
│       │       ├── PerguntaBlock.tsx
│       │       ├── CondicaoBlock.tsx
│       │       ├── AcaoBlock.tsx
│       │       └── FinalizarBlock.tsx
│       ├── hooks/
│       │   ├── useFlowBuilder.ts
│       │   ├── useBlockConfig.ts
│       │   └── useFlowConverter.ts  # JSON ↔ Visual
│       ├── types/
│       │   └── flow-builder.types.ts
│       └── utils/
│           ├── flowConverter.ts     # Converte JSON ↔ React Flow
│           ├── flowValidator.ts     # Valida integridade do fluxo
│           └── flowTemplates.ts     # Templates prontos
│
├── pages/
│   ├── GestaoFluxosPage.tsx        # ✅ Mantém página atual
│   └── FluxoBuilderPage.tsx        # 🆕 Nova página visual
│
└── services/
    └── fluxoService.ts              # ✅ Sem alterações
```

---

## 💡 DECISÕES TÉCNICAS

### ✅ Manter Estrutura JSON Atual

**Por quê?**
- ✅ Backend já funciona perfeitamente
- ✅ Fluxos existentes continuam funcionando
- ✅ Migração zero-downtime
- ✅ Fallback sempre disponível (editor JSON)

### ✅ Camada Visual Opcional

**Por quê?**
- ✅ Usuários técnicos podem usar JSON
- ✅ Gestores usam interface visual
- ✅ Ambos geram mesmo resultado
- ✅ Flexibilidade máxima

### ✅ React Flow como Biblioteca

**Alternativas consideradas**:
- ❌ Criar do zero (muito tempo)
- ❌ diagram-js (complexo demais)
- ❌ mermaid (só visualização)
- ✅ **React Flow** (melhor custo-benefício)

---

## 🎯 PRÓXIMOS PASSOS SUGERIDOS

### Opção A: Começar pelo Backend (Ajustes)
Se precisar de mudanças na estrutura JSON atual para facilitar visual:
1. Analisar limitações do JSON atual
2. Propor novos campos opcionais
3. Criar migration se necessário

### Opção B: Começar pelo Frontend (Recomendado)
Construir visual sobre estrutura atual:
1. ✅ **Instalar React Flow**
2. ✅ **Criar página FluxoBuilderPage**
3. ✅ **Implementar canvas básico**
4. ✅ **Criar biblioteca de blocos**
5. ✅ **Conversor JSON ↔ Visual**
6. ✅ **Salvar no formato atual**

### Opção C: Protótipo Visual Primeiro
Validar UX antes de implementar:
1. Mockups no Figma/Sketch
2. Validar com gestores
3. Ajustar fluxo de uso
4. Implementar validado

---

## ❓ PERGUNTAS PARA DECISÃO

Antes de começar, precisamos decidir:

1. **Escopo inicial**: MVP básico ou funcionalidade completa?
2. **Prioridade**: Velocidade de entrega ou perfeição técnica?
3. **Migração**: Converter fluxos existentes ou começar do zero?
4. **Testes**: Ambiente de staging antes de produção?
5. **Treinamento**: Documentação + vídeos para gestores?

---

## 📊 ESTIMATIVA DE ESFORÇO

| Fase | Tempo | Complexidade | Risco |
|------|-------|--------------|-------|
| MVP Básico | 1-2 semanas | Média | Baixo |
| Recursos Avançados | 2-3 semanas | Alta | Médio |
| UX e Polimento | 1-2 semanas | Baixa | Baixo |
| **TOTAL** | **4-7 semanas** | - | - |

---

## ✅ CONCLUSÃO

### 🎯 Resumo

O sistema atual é **sólido e bem arquitetado**. Não precisa ser descartado, apenas **precisa de uma camada visual** para torná-lo acessível a gestores não-técnicos.

### 🚀 Recomendação

**Implementar construtor visual usando React Flow**, mantendo toda a lógica backend atual. Isso garante:

- ✅ **Zero-downtime**: Sistema continua funcionando
- ✅ **Baixo risco**: Camada visual separada
- ✅ **Flexibilidade**: Editor JSON mantido como fallback
- ✅ **Escalabilidade**: Fácil adicionar novos blocos
- ✅ **UX moderna**: Interface intuitiva para gestores

### 📞 Aguardando Decisão

Qual abordagem você prefere?
1. 🎨 **MVP Visual Rápido** (2 semanas)
2. 🏗️ **Implementação Completa** (6 semanas)
3. 🎭 **Protótipo Visual Primeiro** (validar UX)

---

**Próximo passo**: Diga por onde quer que eu comece e vamos implementar! 🚀
