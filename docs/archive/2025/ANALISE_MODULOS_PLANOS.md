# 🎯 Análise Completa de Módulos e Atualização de Planos

**Data**: 20 de novembro de 2025  
**Objetivo**: Mapear todas as funcionalidades implementadas e redistribuir módulos por plano de forma estratégica

---

## 📊 Módulos do Sistema (Enums)

### Backend - ModuloEnum
```typescript
enum ModuloEnum {
  ATENDIMENTO = 'ATENDIMENTO',
  CRM = 'CRM',
  VENDAS = 'VENDAS',
  FINANCEIRO = 'FINANCEIRO',
  BILLING = 'BILLING',
  ADMINISTRACAO = 'ADMINISTRACAO',
}
```

### Planos Disponíveis
```typescript
enum PlanoEnum {
  STARTER = 'STARTER',      // Plano básico
  BUSINESS = 'BUSINESS',    // Plano intermediário
  ENTERPRISE = 'ENTERPRISE' // Plano completo
}
```

---

## 🔍 Inventário Completo de Funcionalidades

### 📦 Plataforma Base (Todos os Planos)
**Sempre disponível, independente do plano:**

1. **Dashboard Principal**
   - Visão geral do sistema
   - KPIs básicos
   - Widgets configuráveis

2. **Perfil do Usuário**
   - Gerenciamento de perfil
   - Configurações pessoais
   - Troca de senha

3. **Configurações Básicas**
   - Preferências do sistema
   - Configurações de empresa (dados básicos)
   - Segurança e privacidade

---

### 🎧 Módulo ATENDIMENTO

**Funcionalidades Implementadas:**

#### Core Features
1. ✅ **Central de Atendimentos** (`/atendimento/central`)
   - Gestão de tickets
   - Status e prioridades
   - Histórico de interações

2. ✅ **Chat em Tempo Real** (`/atendimento/chat`)
   - Interface de chat
   - Mensagens instantâneas
   - Notificações em tempo real

3. ✅ **Gestão de Filas** (`/nuclei/atendimento/filas`)
   - Criação e configuração de filas
   - Atribuição de atendentes
   - Priorização de tickets

#### Sistemas Avançados
4. ✅ **Templates de Mensagens** (`/nuclei/atendimento/templates`)
   - Respostas rápidas
   - Templates personalizados
   - Variáveis dinâmicas

5. ✅ **SLA Tracking** (`/nuclei/atendimento/sla/`)
   - Dashboard de SLA
   - Configurações de tempo
   - Alertas de violação
   - Monitoramento em tempo real

6. ✅ **Distribuição Automática** (`/nuclei/atendimento/distribuicao/`)
   - Dashboard de distribuição
   - Configuração de regras
   - Sistema de Skills
   - Balanceamento de carga

7. ✅ **Fechamento Automático** (`/atendimento/fechamento-automatico`)
   - Regras de fechamento
   - Tempo de inatividade
   - Notificações

8. ✅ **Dashboard Analytics** (`/atendimento/dashboard-analytics`)
   - Métricas avançadas
   - Gráficos de performance
   - Análise de tendências

#### Supervisão (Admin)
9. ✅ **Supervisão de Atendimento** (`/atendimento/supervisao`)
   - Monitoramento de equipes
   - Performance de atendentes
   - Auditoria de atendimentos

**Relatórios:**
- Relatórios de Atendimento (`/relatorios/atendimento`)

---

### 👥 Módulo CRM (Base Comercial)

**Funcionalidades Implementadas:**

1. ✅ **Gestão de Clientes** (`/clientes`)
   - Cadastro completo
   - Histórico de interações
   - Segmentação
   - Tags e categorias

2. ✅ **Gestão de Contatos** (`/contatos`)
   - Múltiplos contatos por cliente
   - Cargos e departamentos
   - Canais de comunicação

3. ✅ **Gestão de Leads** (`/leads`)
   - Captura de leads
   - Qualificação
   - Conversão para clientes
   - Landing page pública (`/capture-lead`)

4. ✅ **Pipeline de Vendas** (`/pipeline`)
   - Funil visual (Kanban)
   - Estágios customizáveis
   - Oportunidades
   - Drag & drop

5. ✅ **Gestão de Oportunidades** (integrado ao Pipeline)
   - Criação e edição
   - Valor e probabilidade
   - Data de fechamento
   - Histórico

**Relatórios:**
- Relatórios de CRM (`/relatorios/crm`)

---

### 💰 Módulo VENDAS

**Funcionalidades Implementadas:**

#### Produtos e Serviços
1. ✅ **Gestão de Produtos** (`/produtos`)
   - Cadastro de produtos/serviços
   - Categorias (`/produtos/categorias`)
   - Preços e margens
   - Estoque (básico)

2. ✅ **Combos de Produtos** (`/combos`)
   - Criação de combos
   - Desconto em pacotes
   - Gestão de itens

#### Documentos Comerciais
3. ✅ **Propostas Comerciais** (`/propostas`)
   - Criação de propostas
   - Templates de propostas (`/propostas/templates`)
   - Nova proposta (`/propostas/nova`)
   - Envio por email
   - Portal do cliente (visualização pública)

4. ✅ **Cotações** (`/cotacoes`)
   - Solicitação de cotações
   - Comparação de fornecedores
   - Aprovação

5. ✅ **Aprovações Comerciais** (`/aprovacoes/pendentes`)
   - Workflow de aprovação
   - Alçadas por valor
   - Histórico de aprovações

6. ✅ **Contratos** (`/contratos`)
   - Gestão de contratos
   - Renovações
   - Aditivos

**Relatórios:**
- Relatórios de Vendas (`/relatorios/vendas`)

---

### 💵 Módulo FINANCEIRO

**Funcionalidades Implementadas:**

1. ✅ **Faturamento** (`/faturamento`)
   - Gestão de faturas
   - Emissão de notas
   - Histórico

2. ✅ **Contas a Receber** (`/financeiro/contas-receber`)
   - Controle de recebimentos
   - Baixa de títulos
   - Previsão de recebimentos

3. ✅ **Contas a Pagar** (`/financeiro/contas-pagar`)
   - Controle de pagamentos
   - Agendamento
   - Fornecedores

4. ✅ **Fluxo de Caixa** (`/financeiro/fluxo-caixa`)
   - Entradas e saídas
   - Projeções
   - Análise de saldo

5. ✅ **Gestão de Fornecedores** (`/financeiro/fornecedores`)
   - Cadastro de fornecedores
   - Histórico de compras
   - Avaliações

**Funcionalidades Planejadas (Under Construction):**
- 🚧 Relatórios Financeiros (`/nuclei/financeiro/relatorios`)
- 🚧 Conciliação Bancária (`/nuclei/financeiro/conciliacao`)
- 🚧 Centro de Custos (`/nuclei/financeiro/custos`)
- 🚧 Tesouraria (`/nuclei/financeiro/tesouraria`)

**Relatórios:**
- Relatórios Financeiros (`/relatorios/financeiro`)

---

### 💳 Módulo BILLING (Assinaturas Recorrentes)

**Funcionalidades Implementadas:**

1. ✅ **Gestão de Assinaturas** (`/billing/assinaturas`)
   - Assinaturas ativas
   - Ciclos de cobrança
   - Renovações automáticas

2. ✅ **Gestão de Planos** (`/billing/planos`)
   - Criação de planos
   - Preços e features
   - Trial periods

3. ✅ **Faturas Recorrentes** (`/billing/faturas`)
   - Geração automática
   - Histórico de faturas
   - Notas fiscais

4. ✅ **Gestão de Pagamentos** (`/billing/pagamentos`)
   - Métodos de pagamento
   - Gateway de pagamento
   - Histórico de transações

---

### 🏢 Módulo ADMINISTRAÇÃO (Enterprise)

**Funcionalidades Implementadas:**

1. ✅ **Gestão de Empresas** (`/admin/empresas`)
   - Multi-tenant
   - Configurações por empresa
   - Status e planos

2. ✅ **Usuários do Sistema** (`/admin/usuarios`)
   - Gestão global de usuários
   - Permissões cross-empresa

3. ✅ **Sistema** (`/admin/sistema`)
   - Configurações globais
   - Monitoramento
   - Logs do sistema

**Funcionalidades de Configuração:**

4. ✅ **Gestão de Usuários** (`/nuclei/configuracoes/usuarios`)
   - Criação de usuários
   - Perfis e permissões
   - Departamentos

5. ✅ **Gestão de Departamentos** (integrado em Configurações)
   - Estrutura organizacional
   - Equipes
   - Hierarquia

6. ✅ **Integrações** (`/nuclei/configuracoes/integracoes`)
   - WhatsApp Business
   - OpenAI / Anthropic (IA)
   - SendGrid (Email)
   - Stripe (Pagamentos)
   - Twilio (SMS)
   - Webhooks

**Funcionalidades Planejadas (Under Construction):**
- 🚧 Relatórios Avançados (`/nuclei/administracao/relatorios`)
- 🚧 Auditoria & Logs (`/nuclei/administracao/auditoria`)
- 🚧 Monitoramento de Sistema (`/nuclei/administracao/monitoramento`)
- 🚧 Dados & Analytics (`/nuclei/administracao/analytics`)
- 🚧 Políticas & Conformidade (`/nuclei/administracao/politicas`)
- 🚧 Controle de Acesso Avançado (`/nuclei/administracao/acesso`)

**Relatórios:**
- Analytics Gerais (`/relatorios/analytics`) - Admin only

---

### 📊 Funcionalidades Transversais

**Disponível para quem tem o módulo respectivo:**

1. **Relatórios** (`/relatorios`)
   - Por módulo contratado
   - Exportação (PDF, Excel)
   - Dashboards customizados

2. **Supervisão** (`/supervisao`) - Admin only
   - Por módulo contratado
   - Auditoria
   - Performance

3. **Configurações Avançadas**
   - Metas Comerciais (`/configuracoes/metas`)
   - Email (`/configuracoes/email`)
   - Backup & Sincronização (`/sistema/backup`)

---

## 🎯 Distribuição Atual vs. Recomendada

### ❌ Distribuição ATUAL (Simplista)

```typescript
STARTER:    [ATENDIMENTO]
BUSINESS:   [ATENDIMENTO, CRM, VENDAS]
ENTERPRISE: [ATENDIMENTO, CRM, VENDAS, FINANCEIRO, BILLING, ADMINISTRACAO]
```

**Problemas:**
- ❌ STARTER muito limitado (só atendimento)
- ❌ BUSINESS sem Financeiro (essencial para PMEs)
- ❌ ENTERPRISE muito caro para quem não precisa de Multi-tenant
- ❌ BILLING isolado (deveria ser parte do Financeiro)

---

## ✅ Distribuição RECOMENDADA (Estratégica)

### 🥉 STARTER - Essenciais para Pequenos Negócios
**Público-alvo**: Freelancers, MEIs, pequenos negócios (1-5 usuários)  
**Mensalidade sugerida**: R$ 99/mês

```typescript
STARTER: [
  'CRM',          // Base: Clientes + Contatos + Leads
  'ATENDIMENTO'   // Chat + Tickets básicos
]
```

**Funcionalidades incluídas:**
- ✅ Dashboard básico
- ✅ Gestão de Clientes, Contatos e Leads
- ✅ Pipeline de Vendas (funil simples)
- ✅ Central de Atendimentos (tickets básicos)
- ✅ Chat básico
- ✅ Relatórios simples (CRM + Atendimento)
- ✅ Até 5 usuários
- ✅ 1.000 clientes
- ✅ 5GB armazenamento

**O que NÃO tem:**
- ❌ Propostas comerciais (só PDF manual)
- ❌ Cotações e aprovações
- ❌ Controle financeiro
- ❌ Automações avançadas (SLA, distribuição)

---

### 🥈 BUSINESS - Completo para PMEs
**Público-alvo**: Pequenas e médias empresas (5-50 usuários)  
**Mensalidade sugerida**: R$ 299/mês

```typescript
BUSINESS: [
  'CRM',          // Base comercial completa
  'ATENDIMENTO',  // Atendimento completo
  'VENDAS',       // Propostas, cotações, produtos
  'FINANCEIRO'    // Gestão financeira completa
]
```

**Funcionalidades incluídas:**
- ✅ **Tudo do STARTER +**
- ✅ Propostas Comerciais (templates + envio automático)
- ✅ Cotações e Aprovações
- ✅ Gestão de Produtos e Combos
- ✅ Contratos
- ✅ **Financeiro Completo:**
  - Faturamento
  - Contas a Receber/Pagar
  - Fluxo de Caixa
  - Fornecedores
- ✅ **Atendimento Avançado:**
  - Filas e Templates
  - SLA Tracking
  - Distribuição Automática
  - Dashboard Analytics
- ✅ Até 50 usuários
- ✅ 10.000 clientes
- ✅ 50GB armazenamento
- ✅ Suporte prioritário

**O que NÃO tem:**
- ❌ Billing/Assinaturas recorrentes
- ❌ Multi-tenant (múltiplas empresas)
- ❌ Administração global do sistema

---

### 🥇 ENTERPRISE - Corporativo e Multi-tenant
**Público-alvo**: Grandes empresas, SaaS, revendedores (50+ usuários)  
**Mensalidade sugerida**: R$ 999/mês (ou customizado)

```typescript
ENTERPRISE: [
  'CRM',
  'ATENDIMENTO',
  'VENDAS',
  'FINANCEIRO',
  'BILLING',        // Diferencial: Assinaturas recorrentes
  'ADMINISTRACAO'   // Diferencial: Multi-tenant
]
```

**Funcionalidades incluídas:**
- ✅ **Tudo do BUSINESS +**
- ✅ **Billing (Assinaturas Recorrentes):**
  - Gestão de assinaturas
  - Planos e pricing
  - Faturas automáticas
  - Gateway de pagamento
- ✅ **Administração Multi-tenant:**
  - Gestão de múltiplas empresas
  - Controle global de usuários
  - Configurações por empresa
  - White-label (opcional)
- ✅ **Recursos Enterprise:**
  - Integrações avançadas (API completa)
  - Auditoria e compliance
  - Analytics avançado
  - Backup dedicado
- ✅ Usuários ilimitados
- ✅ Clientes ilimitados
- ✅ 500GB armazenamento
- ✅ Suporte dedicado (SLA garantido)
- ✅ Onboarding personalizado

---

## 🔄 Mudanças Necessárias no Código

### 1. Atualizar `empresa-modulo.service.ts`

**Arquivo**: `backend/src/modules/empresas/services/empresa-modulo.service.ts`

```typescript
async ativarPlano(empresa_id: string, plano: PlanoEnum): Promise<void> {
  const modulosPorPlano = {
    // ✅ NOVO: STARTER com CRM + ATENDIMENTO
    [PlanoEnum.STARTER]: [
      ModuloEnum.CRM,
      ModuloEnum.ATENDIMENTO
    ],
    
    // ✅ NOVO: BUSINESS com CRM + ATENDIMENTO + VENDAS + FINANCEIRO
    [PlanoEnum.BUSINESS]: [
      ModuloEnum.CRM,
      ModuloEnum.ATENDIMENTO,
      ModuloEnum.VENDAS,
      ModuloEnum.FINANCEIRO
    ],
    
    // ✅ ENTERPRISE: Tudo (inalterado)
    [PlanoEnum.ENTERPRISE]: [
      ModuloEnum.CRM,
      ModuloEnum.ATENDIMENTO,
      ModuloEnum.VENDAS,
      ModuloEnum.FINANCEIRO,
      ModuloEnum.BILLING,
      ModuloEnum.ADMINISTRACAO,
    ],
  };

  const modulos = modulosPorPlano[plano] || [];

  // Ativar módulos do plano
  for (const modulo of modulos) {
    await this.ativar(empresa_id, { modulo, ativo: true, plano });
  }

  // Desativar módulos que não estão no plano
  const todosModulos = Object.values(ModuloEnum);
  for (const modulo of todosModulos) {
    if (!modulos.includes(modulo)) {
      try {
        await this.desativar(empresa_id, modulo);
      } catch (error) {
        // Ignora se módulo não existe
      }
    }
  }
}
```

---

## 📊 Comparativo de Planos (Marketing)

| Recurso | STARTER | BUSINESS | ENTERPRISE |
|---------|---------|----------|------------|
| **Usuários** | 5 | 50 | Ilimitado |
| **Clientes** | 1.000 | 10.000 | Ilimitado |
| **Armazenamento** | 5GB | 50GB | 500GB |
| | | | |
| **CRM Básico** | ✅ | ✅ | ✅ |
| Clientes e Contatos | ✅ | ✅ | ✅ |
| Leads | ✅ | ✅ | ✅ |
| Pipeline de Vendas | ✅ | ✅ | ✅ |
| Oportunidades | ✅ | ✅ | ✅ |
| | | | |
| **Atendimento Básico** | ✅ | ✅ | ✅ |
| Central de Atendimentos | ✅ | ✅ | ✅ |
| Chat em Tempo Real | ✅ | ✅ | ✅ |
| Gestão de Filas | ❌ | ✅ | ✅ |
| Templates de Mensagens | ❌ | ✅ | ✅ |
| SLA Tracking | ❌ | ✅ | ✅ |
| Distribuição Automática | ❌ | ✅ | ✅ |
| Dashboard Analytics | ❌ | ✅ | ✅ |
| | | | |
| **Comercial (Vendas)** | ❌ | ✅ | ✅ |
| Propostas Comerciais | ❌ | ✅ | ✅ |
| Templates de Propostas | ❌ | ✅ | ✅ |
| Cotações | ❌ | ✅ | ✅ |
| Aprovações | ❌ | ✅ | ✅ |
| Produtos e Combos | ❌ | ✅ | ✅ |
| Contratos | ❌ | ✅ | ✅ |
| | | | |
| **Financeiro** | ❌ | ✅ | ✅ |
| Faturamento | ❌ | ✅ | ✅ |
| Contas a Receber | ❌ | ✅ | ✅ |
| Contas a Pagar | ❌ | ✅ | ✅ |
| Fluxo de Caixa | ❌ | ✅ | ✅ |
| Fornecedores | ❌ | ✅ | ✅ |
| | | | |
| **Billing (Assinaturas)** | ❌ | ❌ | ✅ |
| Gestão de Assinaturas | ❌ | ❌ | ✅ |
| Cobrança Recorrente | ❌ | ❌ | ✅ |
| Gateway de Pagamento | ❌ | ❌ | ✅ |
| | | | |
| **Administração** | ❌ | ❌ | ✅ |
| Multi-tenant | ❌ | ❌ | ✅ |
| Gestão de Empresas | ❌ | ❌ | ✅ |
| White-label | ❌ | ❌ | ✅ |
| API Completa | ❌ | Básica | Avançada |
| | | | |
| **Suporte** | Email | Prioritário | Dedicado |
| **SLA** | - | 99% | 99.9% |
| **Mensalidade** | R$ 99 | R$ 299 | R$ 999+ |

---

## 🎯 Recomendações Estratégicas

### 1. Comunicação Clara
- ✅ Destacar que STARTER é para pequenos negócios (até 5 pessoas)
- ✅ BUSINESS é o "plano completo" para PMEs (recomendado)
- ✅ ENTERPRISE é para corporações e revendedores SaaS

### 2. Upsell Natural
- ✅ STARTER → BUSINESS: "Precisa de propostas comerciais e controle financeiro?"
- ✅ BUSINESS → ENTERPRISE: "Precisa de cobrança recorrente ou múltiplas empresas?"

### 3. Features Gate
- ✅ Bloquear features de módulos não contratados com tela de upgrade
- ✅ Permitir trial de 14 dias do plano superior
- ✅ Mostrar "crachás" de features premium no menu

### 4. Nomenclatura
- ✅ Considerar renomear planos:
  - STARTER → "Essentials" ou "Básico"
  - BUSINESS → "Professional" ou "Pro"
  - ENTERPRISE → "Enterprise" (manter)

---

## 📝 Checklist de Implementação

- [ ] 1. Atualizar `empresa-modulo.service.ts` com nova distribuição
- [ ] 2. Testar criação de empresa em cada plano
- [ ] 3. Validar que módulos corretos aparecem no menu
- [ ] 4. Atualizar documentação de planos (`/empresas/planos`)
- [ ] 5. Criar página de comparação de planos (marketing)
- [ ] 6. Implementar trials de 14 dias
- [ ] 7. Adicionar upgrade prompts nas features bloqueadas
- [ ] 8. Testar downgrade (remover módulos ao trocar plano)
- [ ] 9. Documentar limites por plano (usuários, clientes, storage)
- [ ] 10. Criar script de migração para empresas existentes

---

**Última atualização**: 20 de novembro de 2025, 22:20 BRT
