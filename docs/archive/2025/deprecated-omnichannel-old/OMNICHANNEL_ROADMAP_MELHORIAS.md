# 🚀 Roadmap de Melhorias Omnichannel - Priorizado

**Baseado em**: Zendesk, Intercom, Freshdesk, Salesforce Service Cloud  
**Data**: Dezembro 2025  
**Objetivo**: Elevar sistema a nível enterprise

---

## 📊 Matriz de Priorização (Impacto vs Esforço)

```
Alto Impacto │ 🔴 TEMPLATES    │ 🟡 MACROS      │
   ↑         │ 🔴 BUSCA ADV    │ 🟡 AUTOMAÇÕES  │
             │─────────────────┼────────────────│
             │ 🟢 AI SUGGEST   │ 🟢 VIDEO CALL  │
Baixo Impacto│ 🟢 CHAT INTERNO │                │
             └─────────────────┴────────────────→
               Baixo Esforço    Alto Esforço
```

**Legenda:**
- 🔴 **Quick Wins** (Alto Impacto + Baixo Esforço) → Implementar PRIMEIRO
- 🟡 **Strategic** (Alto Impacto + Alto Esforço) → Planejar bem
- 🟢 **Fill-Ins** (Baixo Impacto + Baixo Esforço) → Quando houver tempo
- ⚫ **Time Sinks** (Baixo Impacto + Alto Esforço) → Evitar

---

## 🎯 Q1 2026 (Jan-Mar): Quick Wins

### Sprint 1-2: Limpeza e Consolidação
**Duração**: 1-2 semanas  
**Esforço**: Baixo  
**Impacto**: Alto (estabilidade)

#### Atividades:
- [ ] **Remover código duplicado**
  - [ ] Deletar `mockData.ts`
  - [ ] Deletar `contexts/SocketContext.tsx` (usar hook)
  - [ ] Deletar `contexts/ToastContext.tsx` local (usar global)
  - [ ] Migrar imports para versões unificadas

- [ ] **Consolidar notificações**
  - [ ] Unificar sistema de notificações (1 contexto)
  - [ ] Remover PopupNotifications (usar desktop + toast)

**Resultado esperado**: -500 linhas de código, 0 duplicações

---

### Sprint 3-4: Templates de Resposta (CRÍTICO)
**Duração**: 2 semanas  
**Esforço**: Médio  
**Impacto**: MUITO ALTO

#### Por que é crítico?
- ✅ Zendesk: 70% dos atendentes usam templates
- ✅ Reduz tempo de resposta em 60-80%
- ✅ Padroniza comunicação
- ✅ Feature mais solicitada por usuários

#### Estrutura:

```typescript
// Backend: Entity Template
interface Template {
  id: string;
  titulo: string;
  conteudo: string;
  atalho: string; // Ex: /boas-vindas
  categoria: string; // Ex: "Saudações", "Resoluções"
  tags: string[];
  compartilhado: boolean; // Pessoal vs Equipe
  ativo: boolean;
  criadoPor: User;
  empresaId: string;
}

// Frontend: Editor de templates
<TemplateEditor
  onSelect={(template) => insertarTexto(template.conteudo)}
  onSearch={(query) => buscarTemplates(query)}
/>
```

#### Features:
- [ ] CRUD de templates (backend + frontend)
- [ ] Busca por atalho (Ex: digitar `/boas` sugere template)
- [ ] Categorização (saudações, despedidas, resoluções)
- [ ] Templates pessoais vs compartilhados
- [ ] Variáveis dinâmicas (`{{nome}}`, `{{numero_ticket}}`)
- [ ] Preview antes de inserir
- [ ] Estatísticas de uso

**Referência**: Zendesk Macros, Freshdesk Canned Responses

---

### Sprint 5-6: Busca Avançada (CRÍTICO)
**Duração**: 2 semanas  
**Esforço**: Médio  
**Impacto**: MUITO ALTO

#### Por que é crítico?
- ✅ Atendentes perdem 15-20 min/dia procurando tickets
- ✅ Busca atual só pesquisa nome/número
- ✅ Zendesk: busca full-text é feature básica

#### Features:

**Frontend:**
```typescript
interface BuscaAvancada {
  query: string; // Texto livre
  filtros: {
    status?: StatusAtendimentoType[];
    prioridade?: Prioridade[];
    severity?: Severity[];
    assignedLevel?: AssignedLevel[];
    canal?: CanalTipo[];
    atendente?: string;
    fila?: string;
    dataAbertura?: { de: Date; ate: Date };
    sla?: 'em_risco' | 'violado' | 'ok';
    tags?: string[];
  };
  ordenacao?: 'recente' | 'antigo' | 'prioridade' | 'sla';
}
```

**Backend:**
```typescript
// Elasticsearch ou PostgreSQL Full-Text Search
GET /api/atendimento/tickets/busca
{
  "query": "problema pagamento",
  "filtros": {
    "status": ["aberto", "em_atendimento"],
    "prioridade": ["alta", "urgente"],
    "periodo": "ultimos_7_dias"
  }
}
```

#### Implementação:
- [ ] Indexação full-text de mensagens (PostgreSQL tsvector ou Elasticsearch)
- [ ] UI de filtros avançados (sidebar expansível)
- [ ] Salvamento de filtros favoritos
- [ ] Busca por conteúdo de mensagens
- [ ] Highlighting de termos buscados
- [ ] Ordenação por relevância

**Referência**: Zendesk Search, Freshdesk Advanced Search

---

## 🎯 Q2 2026 (Abr-Jun): Produtividade

### Sprint 7-9: Macros e Ações em Lote
**Duração**: 3 semanas  
**Esforço**: Alto  
**Impacto**: MUITO ALTO

#### O que são Macros?
Ações em lote que atualizam múltiplos tickets de uma vez.

**Exemplo do Zendesk:**
```
Macro: "Escalar para N2 - Problema Técnico"
├─ Mudar status para "aguardando"
├─ Alterar prioridade para "alta"
├─ Atribuir para fila "Suporte N2"
├─ Adicionar tag "escalado"
├─ Adicionar nota interna "Escalado para análise técnica"
└─ Enviar template "Escalação - Aviso Cliente"
```

#### Estrutura:

```typescript
interface Macro {
  id: string;
  nome: string;
  descricao: string;
  acoes: Action[];
  atalho?: string; // Ex: Ctrl+Shift+E
}

type Action =
  | { tipo: 'status'; valor: StatusAtendimentoType }
  | { tipo: 'prioridade'; valor: Prioridade }
  | { tipo: 'atribuir'; valor: { fila?: string; atendente?: string } }
  | { tipo: 'adicionar_tag'; valor: string }
  | { tipo: 'adicionar_nota'; valor: string }
  | { tipo: 'enviar_template'; valor: string };
```

#### Features:
- [ ] Editor de macros (drag-and-drop de ações)
- [ ] Aplicar macro em 1 ticket
- [ ] Aplicar macro em múltiplos tickets selecionados
- [ ] Atalhos de teclado para macros
- [ ] Macros compartilhadas vs pessoais
- [ ] Auditoria de uso de macros

**Referência**: Zendesk Macros, Freshdesk Scenario Automations

---

### Sprint 10-12: Sistema de Automações
**Duração**: 3 semanas  
**Esforço**: Alto  
**Impacto**: ALTO

#### O que são Automações?
Regras que executam ações automaticamente baseadas em condições.

**Exemplos:**
```yaml
# Automação 1: Escalar se não respondido em 2h
Trigger:
  - Ticket está "aberto"
  - Última mensagem do cliente > 2 horas
  - Prioridade = "alta"
Ação:
  - Escalar para N2
  - Notificar supervisor
  - Adicionar nota interna

# Automação 2: Lembrete de follow-up
Trigger:
  - Ticket está "aguardando"
  - Última interação > 24 horas
Ação:
  - Enviar template "Follow-up"
  - Adicionar tag "follow-up-enviado"

# Automação 3: Atribuição inteligente
Trigger:
  - Novo ticket criado
  - Canal = "WhatsApp"
  - Tag = "vendas"
Ação:
  - Atribuir para fila "Comercial"
  - Definir prioridade "normal"
```

#### Estrutura:

```typescript
interface Automacao {
  id: string;
  nome: string;
  ativa: boolean;
  condicoes: Condition[];
  acoes: Action[];
  horario?: {
    diasSemana: number[]; // 0-6
    horaInicio: string; // "09:00"
    horaFim: string; // "18:00"
  };
}

type Condition =
  | { campo: 'status'; operador: '==' | '!='; valor: string }
  | { campo: 'prioridade'; operador: '==' | '>=' | '<='; valor: string }
  | { campo: 'tempo_sem_resposta'; operador: '>'; valor: number }
  | { campo: 'canal'; operador: 'in'; valor: string[] }
  | { campo: 'tag'; operador: 'contains'; valor: string };
```

#### Features:
- [ ] Editor visual de automações (if-then)
- [ ] Teste de automações (dry-run)
- [ ] Histórico de execuções
- [ ] Alertas se automação falhar
- [ ] Limites de execução (max 100/hora para evitar loops)
- [ ] Prioridade de automações (ordem de execução)

**Referência**: Zendesk Triggers, Freshdesk Automations, Intercom Rules

---

## 🎯 Q3 2026 (Jul-Set): Análise e Inteligência

### Sprint 13-15: Relatórios e Dashboards
**Duração**: 3 semanas  
**Esforço**: Médio-Alto  
**Impacto**: ALTO

#### KPIs Essenciais (Zendesk padrão):

**Performance de Atendimento:**
- **FRT** (First Response Time): Tempo até primeira resposta
- **AHT** (Average Handle Time): Tempo médio de resolução
- **TTR** (Time to Resolution): Tempo total até resolver
- **CSAT** (Customer Satisfaction): Satisfação do cliente
- **SLA Compliance**: % de tickets dentro do SLA

**Volume e Distribuição:**
- Tickets por status/prioridade/canal
- Tickets por atendente
- Backlog por fila
- Horários de pico

**Qualidade:**
- Taxa de reabertura
- Taxa de transferência
- Taxa de escalonamento
- Satisfação por atendente

#### Implementação:

```typescript
// Dashboard de Performance
interface DashboardAtendimento {
  periodo: { de: Date; ate: Date };
  metricas: {
    frt: { media: number; p50: number; p90: number };
    aht: { media: number; p50: number; p90: number };
    ttr: { media: number; p50: number; p90: number };
    slaCompliance: { total: number; dentro: number; violado: number };
    csat: { media: number; respostas: number };
  };
  distribuicao: {
    porStatus: Record<StatusAtendimentoType, number>;
    porPrioridade: Record<Prioridade, number>;
    porCanal: Record<CanalTipo, number>;
  };
  tendencias: {
    ticketsPorDia: Array<{ data: Date; total: number }>;
    frtPorDia: Array<{ data: Date; media: number }>;
  };
}
```

#### Features:
- [ ] Dashboard executivo (visão geral)
- [ ] Dashboard por atendente (performance individual)
- [ ] Dashboard por fila/equipe
- [ ] Gráficos interativos (Chart.js ou Recharts)
- [ ] Exportação para Excel/PDF
- [ ] Filtros dinâmicos (período, equipe, canal)
- [ ] Comparação de períodos (mês atual vs anterior)
- [ ] Alertas automáticos (se métrica degradar)

**Referência**: Zendesk Explore, Freshdesk Analytics

---

### Sprint 16-17: Tags e Categorização
**Duração**: 2 semanas  
**Esforço**: Baixo  
**Impacto**: MÉDIO

#### O que melhorar?
Atualmente tags existem no backend mas não há UI.

#### Features:
- [ ] UI de adicionar/remover tags no ticket
- [ ] Autocomplete de tags existentes
- [ ] Cores nas tags (customizável)
- [ ] Busca por tags
- [ ] Estatísticas de tags mais usadas
- [ ] Sugestão automática de tags (baseado em conteúdo)

**Referência**: Zendesk Tags, Intercom Tags

---

## 🎯 Q4 2026 (Out-Dez): Experiência e AI

### Sprint 18-20: Melhorias de UX
**Duração**: 3 semanas  
**Esforço**: Médio  
**Impacto**: MÉDIO

#### Melhorias:

1. **Timeline Unificada do Cliente**
   - Ver propostas, faturas, tickets em 1 linha do tempo
   - Integração com CRM
   - **Referência**: Salesforce Service Console

2. **Chat Interno (Team Collaboration)**
   - Atendentes comentarem sobre ticket
   - Menções (@atendente)
   - **Referência**: Zendesk Side Conversations

3. **Drag-and-Drop de Anexos**
   - Arrastar arquivo direto para chat
   - **Referência**: Padrão de mercado

4. **Modo Foco**
   - Esconder sidebar, maximizar chat
   - Atalho: F11
   - **Referência**: Zendesk Focus Mode

---

### Sprint 21-24: AI e Assistência Inteligente
**Duração**: 4 semanas  
**Esforço**: MUITO ALTO  
**Impacto**: ALTO (diferencial)

#### Features de IA:

1. **Sugestão de Respostas**
   ```typescript
   interface SugestaoResposta {
     conteudo: string;
     confianca: number; // 0-1
     fonte: 'template' | 'historico' | 'kb';
     templateId?: string;
   }
   ```
   - Analisar mensagem do cliente
   - Sugerir 3 respostas baseadas em:
     - Templates existentes
     - Respostas passadas similares
     - Base de conhecimento
   - **Referência**: Zendesk Answer Bot, Intercom Fin

2. **Análise de Sentimento**
   ```typescript
   enum Sentimento {
     POSITIVO = 'positivo',
     NEUTRO = 'neutro',
     NEGATIVO = 'negativo',
     URGENTE = 'urgente' // raiva/frustração
   }
   ```
   - Analisar tom da mensagem
   - Alertar se cliente está insatisfeito
   - Sugerir escalonamento automático
   - **Referência**: Freshdesk Freddy AI

3. **Resumo Automático**
   - Gerar resumo de conversas longas
   - Útil para transferências
   - **Referência**: Claude/GPT integration

4. **Detecção de Intenção**
   - Classificar automaticamente (vendas, suporte, reclamação)
   - Roteamento inteligente
   - **Referência**: Intercom Resolution Bot

#### Tecnologias:
- OpenAI GPT-4 (ou similar)
- Sentiment Analysis (Azure Cognitive Services ou local)
- Vector Search (para busca semântica)

---

## 📋 Checklist de Implementação

### Para cada feature nova:

- [ ] **Design Document**
  - Problema que resolve
  - Wireframes / mockups
  - Casos de uso
  - Métricas de sucesso

- [ ] **Backend**
  - API endpoints
  - Validações
  - Testes unitários
  - Documentação Swagger

- [ ] **Frontend**
  - Componentes reutilizáveis
  - TypeScript types
  - Testes (Jest + React Testing Library)
  - Acessibilidade (WCAG 2.1)

- [ ] **QA**
  - Testes funcionais
  - Testes de performance
  - Testes de usabilidade

- [ ] **Documentação**
  - Guia do usuário
  - Changelog
  - Treinamento da equipe

---

## 🎯 Métricas de Sucesso

### Antes vs Depois das Melhorias

| Métrica | Antes | Meta Q4 2026 |
|---------|-------|--------------|
| **Tempo médio de resposta** | ? | < 2 minutos |
| **Tempo médio de resolução** | ? | < 30 minutos |
| **SLA compliance** | ? | > 95% |
| **CSAT** | ? | > 90% |
| **Produtividade (tickets/dia/atendente)** | ? | +40% |
| **Taxa de uso de templates** | 0% | > 70% |
| **Taxa de uso de macros** | 0% | > 50% |
| **Tickets auto-resolvidos por IA** | 0% | > 20% |

---

## 💰 Investimento Estimado

| Trimestre | Features | Esforço (dev-weeks) | Custo Estimado |
|-----------|----------|---------------------|----------------|
| **Q1 2026** | Limpeza + Templates + Busca | 6 semanas | 2 devs × 6 semanas |
| **Q2 2026** | Macros + Automações | 9 semanas | 2 devs × 9 semanas |
| **Q3 2026** | Relatórios + Tags + UX | 8 semanas | 2 devs × 8 semanas |
| **Q4 2026** | AI + Assistência | 4 semanas | 3 devs × 4 semanas |

**Total**: ~27 dev-weeks (~6-7 meses com 2 devs)

---

## 🎓 Benchmarks de Mercado

### Zendesk vs ConectCRM (após melhorias)

| Feature | Zendesk | ConectCRM (atual) | ConectCRM (Q4 2026) |
|---------|---------|-------------------|---------------------|
| Chat Omnichannel | ✅ | ✅ | ✅ |
| WebSocket Real-time | ✅ | ✅ | ✅ |
| Sistema de Filas | ✅ | ✅ | ✅ |
| SLA + Alertas | ✅ | ✅ | ✅ |
| Escalonamento N1/N2/N3 | ✅ | ✅ | ✅ |
| Templates de Resposta | ✅ | ❌ | ✅ |
| Busca Avançada | ✅ | ⚠️ Básica | ✅ |
| Macros | ✅ | ❌ | ✅ |
| Automações | ✅ | ❌ | ✅ |
| Relatórios | ✅ | ⚠️ Básico | ✅ |
| AI Assistant | ✅ | ❌ | ✅ |
| Chat Interno | ✅ | ❌ | ✅ |

**Conclusão**: Com roadmap completo, ConectCRM alcançará **paridade total** com Zendesk!

---

**Última atualização**: Dezembro 2025  
**Próxima revisão**: Q1 2026
