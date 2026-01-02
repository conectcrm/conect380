# 📦 Mapa de Módulos ConectCRM

**Última Atualização**: 1º de janeiro de 2026

---

## 📊 Visão Geral

ConectCRM possui **61 tabelas** organizadas em **5 módulos principais**:

| Módulo | Tabelas | Percentual | Descrição |
|--------|---------|------------|-----------|
| **Atendimento** | 19 | 31.1% | Tickets, Filas, Equipes, SLA |
| **CRM/Vendas** | 6 | 9.8% | Clientes, Propostas, Contratos |
| **Financeiro** | 6 | 9.8% | Faturas, Pagamentos, Assinaturas |
| **Automação/IA** | 7 | 11.5% | Fluxos, Bot, IA Insights |
| **Configurações** | 8 | 13.1% | Empresas, Usuários, Planos |
| **Outros** | 15 | 24.6% | Tags, Categorias, Logs |

---

## 🎯 MÓDULO 1: ATENDIMENTO (19 tabelas)

### Propósito
Gerenciar todo o ciclo de atendimento omnichannel, desde a recepção da demanda até a resolução.

### Entidades Principais

#### 1.1 Tickets/Demandas
```
atendimento_tickets
atendimento_demandas
├── cliente_id (FK → clientes)
├── atendente_id (FK → atendimento_atendentes)
├── equipe_id (FK → equipes)
├── fila_id (FK → atendimento_filas)
├── canal_id (FK → canais)
└── status, prioridade, sla_violado
```

#### 1.2 Organização
```
equipes                          # Times de atendimento
atendimento_filas                # Filas de distribuição
atendimento_atendentes           # Agentes/Atendentes
```

#### 1.3 Comunicação
```
atendimento_mensagens            # Mensagens do chat
atendimento_notas                # Notas internas
```

#### 1.4 Gestão
```
atendimento_tags                 # Etiquetas
niveis_atendimento               # SLA levels
sla_event_logs                   # Logs de SLA
atendimento_status               # Status customizados
status_customizados              # Status personalizados
```

#### 1.5 IA e Automação
```
atendimento_ai_insights          # Insights de IA
atendimento_ai_metricas          # Métricas de IA
atendimento_base_conhecimento    # KB para bot
```

#### 1.6 Integrações
```
atendimento_integracoes_config   # Configurações de integrações
atendimento_redmine_integrations # Integração Redmine
```

### Relacionamentos Chave
- Ticket → Cliente (N:1)
- Ticket → Atendente (N:1)
- Ticket → Equipe (N:1)
- Ticket → Fila (N:1)
- Ticket → Mensagens (1:N)

---

## 💼 MÓDULO 2: CRM/VENDAS (6 tabelas)

### Propósito
Gerenciar relacionamento com clientes, oportunidades de venda e contratos.

### Entidades Principais

#### 2.1 Clientes e Contatos
```
clientes                         # Empresas/Pessoas
contatos                         # Contatos individuais
└── cliente_id (FK → clientes)
```

#### 2.2 Vendas
```
oportunidades                    # Leads/Oportunidades
cotacoes                         # Propostas/Cotações
├── itens_cotacao                # Produtos da cotação
│   ├── produto_id
│   └── cotacao_id
└── anexos_cotacao               # Arquivos da cotação
```

#### 2.3 Contratos
```
contratos                        # Contratos fechados
├── cliente_id (FK → clientes)
├── cotacao_id (FK → cotacoes)
└── gera → Faturas (Financeiro)
```

### Funil de Vendas
```
Lead → Oportunidade → Cotação → Contrato → Fatura
  ↓         ↓            ↓          ↓         ↓
Cliente  Qualificação  Proposta  Fechamento  Cobrança
```

### Relacionamentos Chave
- Cliente → Tickets (1:N)
- Cliente → Oportunidades (1:N)
- Cliente → Contratos (1:N)
- Oportunidade → Cotação (1:N)
- Cotação → Contrato (1:1)
- Contrato → Faturas (1:N)

---

## 💰 MÓDULO 3: FINANCEIRO (6 tabelas)

### Propósito
Gestão completa de faturamento, pagamentos e cobrança recorrente.

### Entidades Principais

#### 3.1 Faturamento
```
faturas                          # Notas fiscais/Boletos
├── cliente_id (FK → clientes)
├── contrato_id (FK → contratos)
├── itens_fatura                 # Itens da fatura
│   └── produto_id
└── status, valor_total, vencimento
```

#### 3.2 Pagamentos
```
pagamentos                       # Transações de pagamento
├── fatura_id (FK → faturas)
└── gateway, metodo, status
```

#### 3.3 Recorrência
```
assinaturas_contrato             # Contratos recorrentes
planos_cobranca                  # Planos de assinatura
```

#### 3.4 Operacional
```
contas_pagar                     # Despesas da empresa
```

### Fluxo de Cobrança
```
Contrato → Fatura → Pagamento → Confirmação
    ↓
Assinatura → Fatura Recorrente (mensal/anual)
```

### Relacionamentos Chave
- Fatura → Cliente (N:1)
- Fatura → Contrato (N:1)
- Fatura → Pagamentos (1:N)
- Assinatura → Plano de Cobrança (N:1)

---

## 🤖 MÓDULO 4: AUTOMAÇÃO/IA (7 tabelas)

### Propósito
Automação de processos e aplicação de IA para triagem, respostas e insights.

### Entidades Principais

#### 4.1 Fluxos de Automação
```
fluxos_automatizados             # Workflows
eventos_fluxo                    # Eventos que disparam fluxos
fluxos_triagem                   # Fluxo de triagem do bot
sessoes_triagem                  # Sessões ativas de triagem
triagem_logs                     # Logs de execução
```

#### 4.2 Templates
```
message_templates                # Templates de mensagens
templates_mensagem_triagem       # Templates do bot
```

### Tipos de Automação
1. **Triagem Automática**: Bot IA classifica tickets
2. **Respostas Automáticas**: Templates personalizados
3. **Roteamento Inteligente**: IA escolhe melhor atendente
4. **Follow-ups**: Agendamento de ações
5. **Insights Preditivos**: IA prevê comportamento

### Relacionamentos Chave
- Fluxo → Eventos (1:N)
- Fluxo → Ações (1:N)
- Sessão Triagem → Cliente (N:1)
- Template → Mensagens (1:N)

---

## ⚙️ MÓDULO 5: CONFIGURAÇÕES (8 tabelas)

### Propósito
Configurações globais, multi-tenant, usuários e permissões.

### Entidades Principais

#### 5.1 Multi-Tenant
```
empresas                         # Tenants (cada empresa)
assinaturas_empresas             # Planos das empresas
planos                           # Planos disponíveis
modulos_sistema                  # Módulos ativáveis
```

#### 5.2 Usuários
```
users                            # Usuários do sistema
user_activities                  # Logs de atividades
audit_logs                       # Auditoria completa
```

#### 5.3 Canais
```
canais                           # WhatsApp, Email, Chat, etc.
```

### Hierarquia Multi-Tenant
```
Empresa (Tenant)
  ├── Usuários
  ├── Clientes
  ├── Tickets
  ├── Faturas
  └── Configurações
```

### Relacionamentos Chave
- Empresa → TODAS as entidades (1:N) via empresa_id
- Usuário → Empresa (N:1)
- Usuário → Atividades (1:N)

---

## 🔗 MÓDULO 6: OUTROS (15 tabelas)

### Propósito
Entidades auxiliares e de suporte.

### Categorias

#### 6.1 Classificação
```
categorias                       # Categorias de produtos/tickets
tags                             # Tags gerais
```

#### 6.2 Serviços
```
tipos_servico                    # Tipos de serviço
fornecedores                     # Fornecedores
produtos                         # Produtos/Serviços
```

#### 6.3 Operacional
```
metas                            # Metas da empresa
evento                           # Eventos do sistema
nucleos_atendimento              # Núcleos/Departamentos
```

#### 6.4 Outros
```
departamentos
servicos
+ Mais 3 tabelas auxiliares
```

---

## 🔗 MAPA DE RELACIONAMENTOS GLOBAL

```
┌─────────────┐
│   EMPRESA   │  (Tenant Root)
└──────┬──────┘
       │
       ├──→ USUÁRIOS ──→ ATIVIDADES
       │
       ├──→ CLIENTES ───┬──→ TICKETS ───┬──→ MENSAGENS
       │                │                ├──→ NOTAS
       │                │                └──→ ATENDENTES
       │                │
       │                ├──→ OPORTUNIDADES
       │                │
       │                ├──→ COTAÇÕES ──→ CONTRATOS ──→ FATURAS ──→ PAGAMENTOS
       │                │
       │                └──→ CONTATOS
       │
       ├──→ EQUIPES ──→ ATENDENTES
       │
       ├──→ FILAS
       │
       ├──→ CANAIS (WhatsApp, Email, Chat)
       │
       ├──→ FLUXOS ──→ EVENTOS
       │
       ├──→ TEMPLATES
       │
       └──→ CONFIGURAÇÕES
```

---

## 📈 Métricas por Módulo

### Atendimento
- Total de Tickets
- Tempo Médio de Resposta (TMR)
- Tempo Médio de Solução (TMS)
- Taxa de SLA Violado
- Tickets por Atendente
- Satisfação do Cliente (CSAT)

### CRM/Vendas
- Total de Oportunidades
- Taxa de Conversão
- Valor do Pipeline
- Ticket Médio
- Contratos Fechados

### Financeiro
- Faturamento Mensal
- Taxa de Inadimplência
- MRR (Monthly Recurring Revenue)
- Churn Rate
- LTV (Lifetime Value)

### Automação/IA
- Taxa de Automação
- Precisão da Triagem (IA)
- Tempo Economizado
- Respostas Automáticas Enviadas

---

## 🚀 Integrações Entre Módulos

### 1. Ticket → Proposta → Contrato → Fatura
```
Atendimento → CRM → Financeiro
```

### 2. Cliente Universal
```
Cliente (CRM) ← usado por → Atendimento, Vendas, Financeiro
```

### 3. IA Conectada
```
Automação (IA) → Triagem de Tickets (Atendimento)
Automação (IA) → Insights de Vendas (CRM)
Automação (IA) → Previsão de Churn (Financeiro)
```

### 4. Auditoria Completa
```
Configurações (Audit Logs) ← registra → TODAS as ações de TODOS os módulos
```

---

## 📋 Checklist de Novo Módulo

Ao criar um novo módulo, SEMPRE verificar:

- [ ] Entity tem `empresa_id` (multi-tenant)
- [ ] Migration habilita RLS
- [ ] Relaciona com módulos existentes (Cliente, Empresa, etc.)
- [ ] Tem auditoria (created_at, updated_at, deleted_at)
- [ ] Service tem try-catch e logs
- [ ] Controller usa JwtAuthGuard
- [ ] Frontend tem página com BackToNucleus
- [ ] Registrado em App.tsx e menuConfig.ts
- [ ] Documentado neste arquivo

---

## 📚 Referências

- **Arquitetura**: `docs/ARQUITETURA.md`
- **Decisões Técnicas**: `docs/DECISOES_TECNICAS.md`
- **Multi-Tenant**: `SISTEMA_100_MULTI_TENANT_FINAL.md`
- **Testes**: `TESTES_MULTI_TENANT_COMPLETOS.md`

---

**Elaborado por**: Equipe ConectCRM  
**Revisão**: GitHub Copilot Agent
