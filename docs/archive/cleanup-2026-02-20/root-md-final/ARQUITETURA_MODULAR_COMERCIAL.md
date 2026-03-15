# 🏗️ ARQUITETURA MODULAR PARA COMERCIALIZAÇÃO

**Data**: 03 de novembro de 2025  
**Objetivo**: Organizar sistema ConectCRM para venda modular com licenças independentes  
**Status**: Análise Estratégica Completa

---

## 📊 SUMÁRIO EXECUTIVO

### Situação Atual
- **8 módulos** identificados no sistema
- **52 funcionalidades** distribuídas
- **3 sobreposições críticas** detectadas (Clientes, Núcleos, Departamentos)
- **Paths inconsistentes** (mix de /gestao/*, /atendimento/*, /nuclei/*)

### Problema de Negócio
**Sistema será comercializado por módulos separados** - clientes podem comprar apenas Atendimento, ou apenas CRM, ou combos. Arquitetura atual tem:
- ❌ Features duplicadas entre módulos (confusão de licenciamento)
- ❌ Dependências cruzadas não documentadas
- ❌ Impossível determinar "o que vem no módulo X"

### Solução Proposta
✅ **Reorganização modular clara** com:
- Fronteiras bem definidas por módulo
- Licenciamento independente
- Cross-module dependencies documentadas
- Estratégia de upsell/cross-sell

---

## 🎯 MÓDULOS COMERCIAIS PROPOSTOS

### 📦 SKU 1: PLATAFORMA BASE (Obrigatório - Incluído em todos)
**Preço**: Incluído em qualquer licença  
**Descrição**: Funcionalidades core do sistema

#### Funcionalidades:
- ✅ **Dashboard Principal** (`/dashboard`)
  - Visão geral multi-módulo
  - KPIs consolidados
  
- ✅ **Configurações Globais** (`/nuclei/configuracoes`)
  - Gestão de Empresa
  - **Gestão de Usuários** (tabela users - todos os perfis)
  - Integrações (WhatsApp, Email, APIs)
  - Notificações
  - Segurança
  - Backup/Sincronização
  
- ✅ **Perfil do Usuário** (`/perfil`)
  - Dados pessoais
  - Foto, senha, preferências

#### Justificativa:
- Todo cliente precisa configurar empresa e usuários
- Base técnica para outros módulos funcionarem
- Não é vendível separadamente

---

### 📦 SKU 2: ATENDIMENTO (Customer Support)
**Preço Sugerido**: R$ 199/mês (até 5 atendentes)  
**Cor do Módulo**: Purple (#9333EA)  
**Descrição**: Suporte omnichannel com WhatsApp, chat e triagem inteligente

#### Funcionalidades Core:
- ✅ **Dashboard de Atendimento** (`/atendimento`)
  - Tickets abertos/fechados
  - Tempo médio resposta
  - Taxa de resolução
  - Performance por atendente
  
- ✅ **Central de Atendimento** (`/atendimento/central`)
  - Listagem de tickets
  - Filtros (status, prioridade, atendente)
  - Atribuição manual/automática
  
- ✅ **Chat Integrado** (`/atendimento/chat`)
  - WhatsApp Business API
  - Chat web (widget)
  - Mensagens em tempo real
  - Envio de mídia/áudio
  
- ✅ **Gestão de Equipes** (`/gestao/equipes`)
  - Criar/editar equipes
  - Atribuir atendentes
  - Capacidade por equipe
  
- ✅ **Gestão de Atendentes** (`/gestao/atendentes`) ⚠️ DEPRECAR
  - **AÇÃO**: Redirecionar para `/gestao/usuarios?aba=atendentes`
  - Motivo: Usuários agora é unificado (Plataforma Base)
  
- ✅ **Núcleos de Atendimento** (`/gestao/nucleos`)
  - Criar/editar núcleos (ex: Suporte, Vendas, Financeiro)
  - Associar equipes a núcleos
  
- ✅ **Departamentos** (`/gestao/departamentos`)
  - Criar/editar departamentos
  - Definir responsáveis
  
- ✅ **Atribuições Automáticas** (`/gestao/atribuicoes`)
  - Regras de distribuição
  - Round-robin, carga balanceada
  
- ✅ **Fluxos de Triagem** (`/gestao/fluxos`)
  - Construtor visual (drag-drop)
  - Etapas, condições, ações
  - Bots de atendimento
  
- ✅ **Relatórios de Atendimento**
  - Performance por período
  - Tickets por categoria
  - SLA/tempo médio
  
- ✅ **Supervisão** (Admin)
  - Monitoramento em tempo real
  - Intervir em atendimentos
  - Histórico completo

#### Dependências:
- **users** (Plataforma Base) - atendentes são users com permissão ATENDIMENTO
- **empresas** (Plataforma Base) - multi-tenant

#### Upsell/Cross-sell:
- Se cliente tem Atendimento + CRM → pode vincular tickets a clientes CRM
- Se cliente tem Atendimento + Billing → pode consultar faturas durante atendimento

---

### 📦 SKU 3: CRM (Customer Relationship Management)
**Preço Sugerido**: R$ 299/mês (até 10 usuários)  
**Cor do Módulo**: Blue (#2563EB)  
**Descrição**: Gestão completa de clientes, contatos e relacionamento

#### Funcionalidades Core:
- ✅ **Dashboard CRM** (`/nuclei/crm`)
  - Total de clientes/contatos
  - Leads por funil
  - Conversão
  
- ✅ **Gestão de Clientes** (`/clientes`) ⚠️ OWNER PRIMÁRIO
  - CRUD completo
  - Histórico de interações
  - Documentos anexados
  - Contratos vinculados
  
- ✅ **Gestão de Contatos** (`/contatos`)
  - Múltiplos contatos por cliente
  - Cargos, telefones, emails
  
- ✅ **Gestão de Leads** (pipeline)
  - Captura de leads
  - Qualificação
  - Funil de conversão
  
- ✅ **Pipeline Visual**
  - Kanban de oportunidades
  - Arraste entre etapas
  - Probabilidade de fechamento
  
- ✅ **Relatórios CRM**
  - Origem de leads
  - Taxa de conversão
  - Tempo médio no funil

#### Dependências:
- **users** (Plataforma Base) - vendedores são users com permissão CRM
- **empresas** (Plataforma Base)

#### Upsell/Cross-sell:
- CRM → Vendas (propostas e cotações para clientes)
- CRM → Billing (assinaturas para clientes)
- CRM → Atendimento (suporte para clientes CRM)

---

### 📦 SKU 4: VENDAS (Sales Management)
**Preço Sugerido**: R$ 349/mês (até 10 vendedores)  
**Cor do Módulo**: Green (#16A34A)  
**Descrição**: Gestão de propostas, cotações, produtos e funil de vendas

#### Funcionalidades Core:
- ✅ **Dashboard de Vendas** (`/nuclei/vendas`)
  - Total de propostas
  - Funil de vendas
  - Ticket médio
  - Meta vs realizado
  
- ✅ **Gestão de Propostas** (`/propostas`)
  - Criar/editar propostas
  - Templates personalizados
  - Envio por email
  - Assinatura digital
  
- ✅ **Cotações/Orçamentos** (`/cotacoes`, `/orcamentos`)
  - Múltiplas versões
  - Comparativo de preços
  - Aprovação do cliente
  
- ✅ **Funil de Vendas** (`/funil-vendas`)
  - Etapas customizáveis
  - Probabilidade por etapa
  - Forecast de receita
  
- ✅ **Gestão de Produtos** (`/produtos`)
  - Catálogo de produtos/serviços
  - Preços, descrições, imagens
  - SKU, estoque (básico)
  
- ✅ **Categorias de Produtos** (`/produtos/categorias`)
  - Organização hierárquica
  
- ✅ **Combos/Pacotes** (`/combos`)
  - Produtos agrupados
  - Desconto por combo
  
- ✅ **Metas de Vendas** (`/configuracoes/metas`)
  - Metas por vendedor/equipe
  - Acompanhamento mensal
  
- ✅ **Relatórios de Vendas**
  - Performance por vendedor
  - Produtos mais vendidos
  - Conversão do funil

#### Dependências:
- **clientes** (CRM) - propostas são para clientes ⚠️ CROSS-MODULE
- **users** (Plataforma Base) - vendedores

#### Upsell/Cross-sell:
- Vendas → CRM (gestão de clientes que recebem propostas)
- Vendas → Billing (converter proposta em assinatura)
- Vendas → Financeiro (gerar faturamento de proposta)

---

### 📦 SKU 5: FINANCEIRO (Financial Management)
**Preço Sugerido**: R$ 249/mês  
**Cor do Módulo**: Orange (#EA580C)  
**Descrição**: Controle financeiro completo com contas a pagar/receber

#### Funcionalidades Core:
- ✅ **Dashboard Financeiro** (`/nuclei/financeiro`)
  - Receitas vs despesas
  - Saldo atual
  - Fluxo de caixa projetado
  
- ✅ **Faturamento** (`/financeiro/faturamento`, `/faturamento`)
  - Notas fiscais (integração)
  - Histórico de faturamento
  
- ✅ **Contas a Receber** (`/financeiro/contas-receber`)
  - Títulos a receber
  - Baixas, parciais
  - Relatório de inadimplência
  
- ✅ **Contas a Pagar** (`/financeiro/contas-pagar`)
  - Títulos a pagar
  - Agendamento de pagamentos
  - Previsão de saídas
  
- ✅ **Fornecedores** (`/financeiro/fornecedores`)
  - Cadastro de fornecedores
  - Histórico de compras
  
- ✅ **Fluxo de Caixa** (interno)
  - Entradas/saídas diárias
  - Projeção 30/60/90 dias
  
- ✅ **Relatórios Financeiros** (`/financeiro/relatorios`)
  - DRE simplificado
  - Balanço
  - Gráficos de tendência
  
- ✅ **Conciliação Bancária** (`/financeiro/conciliacao`)
  - Importar extratos
  - Conciliar lançamentos
  
- ✅ **Centro de Custos** (`/financeiro/centro-custos`)
  - Categorização de despesas
  - Análise por centro
  
- ✅ **Tesouraria** (`/financeiro/tesouraria`)
  - Movimentações bancárias
  - Transferências entre contas

#### Dependências:
- **clientes** (CRM) - contas a receber de clientes ⚠️ CROSS-MODULE
- **fornecedores** (próprio) - contas a pagar

#### Upsell/Cross-sell:
- Financeiro → Billing (integração de pagamentos de assinaturas)
- Financeiro → Vendas (faturamento de propostas)

---

### 📦 SKU 6: BILLING (Subscription Management)
**Preço Sugerido**: R$ 199/mês  
**Cor do Módulo**: Green (#16A34A)  
**Descrição**: Gestão de assinaturas, planos recorrentes e pagamentos

#### Funcionalidades Core:
- ✅ **Dashboard Billing** (`/nuclei/billing`, `/billing`, `/assinaturas`)
  - MRR (Monthly Recurring Revenue)
  - Churn rate
  - Assinaturas ativas/canceladas
  
- ✅ **Gestão de Assinaturas**
  - Criar/pausar/cancelar assinaturas
  - Upgrades/downgrades
  - Ciclos de cobrança
  
- ✅ **Gestão de Planos**
  - Planos recorrentes (mensal, anual)
  - Preços, features, limites
  
- ✅ **Faturas** (invoices)
  - Geração automática
  - Envio por email
  - Link de pagamento
  
- ✅ **Gestão de Pagamentos**
  - Integração gateways (Stripe, Pagarme, etc.)
  - Status de pagamentos
  - Retry de falhas

#### Dependências:
- **clientes** (CRM) - assinaturas são de clientes ⚠️ CROSS-MODULE
- **users** (Plataforma Base)

#### Upsell/Cross-sell:
- Billing → Financeiro (integração de receitas recorrentes)
- Billing → CRM (gestão dos clientes assinantes)

---

### 📦 SKU 7: ADMINISTRAÇÃO (Enterprise - Multi-Tenant)
**Preço Sugerido**: R$ 999/mês (Enterprise/SaaS only)  
**Cor do Módulo**: Blue (#2563EB)  
**Descrição**: Super admin para gestão de múltiplas empresas (SaaS)

#### Funcionalidades Core:
- ✅ **Dashboard Admin** (`/nuclei/administracao`)
  - Total de empresas cadastradas
  - Licenças ativas
  - Uso de recursos
  
- ✅ **Gestão de Empresas** (`/admin/empresas`, `/gestao/empresas`)
  - CRUD de empresas (tenants)
  - Ativar/desativar
  - Módulos contratados por empresa
  
- ✅ **Usuários do Sistema** (super admin)
  - Ver todos os usuários de todas as empresas
  - Acessar como (impersonate)
  
- ✅ **Relatórios Globais** (`/admin/relatorios`)
  - Uso agregado
  - Performance do SaaS
  
- ✅ **Auditoria** (`/admin/auditoria`)
  - Logs de ações críticas
  - Alterações de configuração
  
- ✅ **Monitoramento** (`/admin/monitoramento`)
  - Saúde dos serviços
  - Uptime
  
- ✅ **Analytics** (`/admin/analytics`)
  - Métricas de uso por módulo
  - Features mais usadas
  
- ✅ **Conformidade** (`/admin/conformidade`)
  - LGPD/GDPR
  - Termos de uso
  
- ✅ **Controle de Acesso** (`/admin/acesso`)
  - Permissões globais

#### Dependências:
- Todos os módulos (visão agregada)

#### Justificativa:
- Apenas para modelo SaaS (software vendido como serviço)
- Cliente final (empresa) NÃO precisa deste módulo
- Apenas o provedor do software usa

---

## 🔄 RESOLUÇÃO DE SOBREPOSIÇÕES

### ❌ PROBLEMA 1: "Clientes" aparece em Atendimento E CRM

**Situação Atual**:
- Menu Atendimento → "Clientes" (`/clientes`)
- Menu CRM → "Clientes" (`/clientes`)

**Decisão**:
- ✅ **Owner primário**: CRM (feature principal)
- ✅ **Atendimento**: Remove do menu, usa referência cross-module

**Implementação**:
```typescript
// menuConfig.ts - REMOVER de Atendimento:
{
  id: 'atendimento',
  children: [
    // ... outras features
    // ❌ REMOVER:
    // { id: 'atendimento-clientes', title: 'Clientes', href: '/clientes' }
  ]
}

// CRM mantém:
{
  id: 'crm',
  children: [
    { id: 'crm-clientes', title: 'Clientes', href: '/clientes' } // ✅ OWNER
  ]
}
```

**Licenciamento**:
- Cliente compra **APENAS Atendimento**: NÃO tem tela de clientes (pode inserir nome manualmente no ticket)
- Cliente compra **Atendimento + CRM**: Tickets podem ser vinculados a clientes do CRM
- Cliente compra **APENAS CRM**: Tem gestão completa de clientes

---

### ❌ PROBLEMA 2: "Núcleos" aparece em Atendimento E Configurações

**Situação Atual**:
- Menu Atendimento → "Núcleos de Atendimento" (`/gestao/nucleos`)
- Menu Configurações → "Núcleos de Atendimento" (`/gestao/nucleos`)

**Decisão**:
- ✅ **Owner**: Atendimento (feature específica do módulo)
- ✅ **Configurações**: REMOVER (não é configuração global)

**Implementação**:
```typescript
// menuConfig.ts - REMOVER de Configurações:
{
  id: 'configuracoes',
  children: [
    // ❌ REMOVER:
    // { id: 'configuracoes-nucleos', title: 'Núcleos de Atendimento', href: '/gestao/nucleos' }
  ]
}

// Atendimento mantém:
{
  id: 'atendimento',
  children: [
    { id: 'atendimento-nucleos', title: 'Núcleos', href: '/gestao/nucleos' } // ✅ OWNER
  ]
}
```

**Licenciamento**:
- Núcleos são conceito exclusivo do módulo Atendimento
- Sem Atendimento = sem núcleos

---

### ❌ PROBLEMA 3: "Departamentos" aparece em Atendimento E Configurações

**Situação Atual**:
- Menu Atendimento → "Departamentos" (`/gestao/departamentos`)
- Menu Configurações → "Departamentos" (`/configuracoes/departamentos`)

**Decisão**:
- ✅ **Owner**: Atendimento (usado na triagem/atribuição)
- ✅ **Configurações**: REMOVER (ou manter se for uso global futuro)

**Análise**:
- Se departamentos são APENAS para atendimento (ex: Suporte, Comercial, Financeiro no chat) → Owner é Atendimento
- Se departamentos serão usados em OUTROS módulos (ex: CRM precisa saber departamento do cliente) → Poderia ficar em Configurações

**Recomendação**: 
- Por ora, **mover para Atendimento** (uso atual é só lá)
- Se futuramente outros módulos precisarem, criar "Departamentos Globais" em Configurações

**Implementação**:
```typescript
// menuConfig.ts - REMOVER de Configurações:
{
  id: 'configuracoes',
  children: [
    // ❌ REMOVER (por ora):
    // { id: 'configuracoes-departamentos', title: 'Departamentos', href: '/configuracoes/departamentos' }
  ]
}

// Atendimento mantém:
{
  id: 'atendimento',
  children: [
    { id: 'atendimento-departamentos', title: 'Departamentos', href: '/gestao/departamentos' } // ✅ OWNER
  ]
}
```

---

### ✅ PROBLEMA 4: "Usuários" (global) vs "Atendentes" (específico)

**Situação Atual**:
- Configurações → "Usuários" (`/gestao/usuarios`) - tabela `users`, todos os perfis
- Atendimento → "Atendentes" (`/gestao/atendentes`) - **DEPRECADO**, era tabela antiga

**Decisão** (JÁ IMPLEMENTADA):
- ✅ **Usuários** fica em Configurações (Plataforma Base) - CORRETO
- ✅ **Atendentes** em Atendimento deve REDIRECIONAR para `/gestao/usuarios?aba=atendentes`
- ✅ Ou criar uma VIEW filtrada (sem CRUD, só leitura) que lista users com permissão ATENDIMENTO

**Implementação Proposta**:
```typescript
// GestaoAtendentesPage.tsx - OPÇÃO 1: Redirect
useEffect(() => {
  navigate('/gestao/usuarios?aba=atendentes');
}, []);

// OPÇÃO 2: View somente-leitura
// Mostra lista de users com permissão ATENDIMENTO
// Botão "Gerenciar Atendentes" redireciona para /gestao/usuarios?aba=atendentes
```

**Licenciamento**:
- Usuários são Plataforma Base (todos clientes têm)
- Atendentes são users com permissão ATENDIMENTO (só quem compra módulo Atendimento)

---

## 🛣️ PADRONIZAÇÃO DE ROTAS

### ❌ Problema: Mix de paths

Atualmente:
- `/gestao/*` (antigo)
- `/atendimento/*` (direto)
- `/nuclei/*` (novo padrão)
- `/configuracoes/*` (misto)

### ✅ Solução: Padrão único

```
/nuclei/<modulo>           → Landing page do núcleo (dashboard)
/<modulo>/*                → Features diretas do módulo
/gestao/*                  → Features de gestão (config do módulo)
/configuracoes/*           → Configurações globais (Plataforma Base)
/admin/*                   → Super admin (Administração)
```

### 📋 Tabela de Reorganização

| Feature | Rota Atual | Rota Proposta | Módulo Owner |
|---------|-----------|---------------|--------------|
| **Dashboard Atendimento** | `/atendimento` | `/atendimento` ✅ | Atendimento |
| **Chat** | `/atendimento/chat` | `/atendimento/chat` ✅ | Atendimento |
| **Equipes** | `/gestao/equipes` | `/atendimento/equipes` 🔄 | Atendimento |
| **Núcleos** | `/gestao/nucleos` | `/atendimento/nucleos` 🔄 | Atendimento |
| **Atribuições** | `/gestao/atribuicoes` | `/atendimento/atribuicoes` 🔄 | Atendimento |
| **Departamentos** | `/gestao/departamentos` | `/atendimento/departamentos` 🔄 | Atendimento |
| **Fluxos** | `/gestao/fluxos` | `/atendimento/fluxos` 🔄 | Atendimento |
| **Atendentes** | `/gestao/atendentes` | **REDIRECT** → `/configuracoes/usuarios?aba=atendentes` | ~~Deprecado~~ |
| | | | |
| **Dashboard CRM** | `/nuclei/crm` | `/nuclei/crm` ✅ | CRM |
| **Clientes** | `/clientes` | `/crm/clientes` 🔄 | CRM |
| **Contatos** | `/contatos` | `/crm/contatos` 🔄 | CRM |
| | | | |
| **Dashboard Vendas** | `/nuclei/vendas` | `/nuclei/vendas` ✅ | Vendas |
| **Propostas** | `/propostas` | `/vendas/propostas` 🔄 | Vendas |
| **Cotações** | `/cotacoes` | `/vendas/cotacoes` 🔄 | Vendas |
| **Produtos** | `/produtos` | `/vendas/produtos` 🔄 | Vendas |
| **Combos** | `/combos` | `/vendas/combos` 🔄 | Vendas |
| | | | |
| **Dashboard Financeiro** | `/nuclei/financeiro` | `/nuclei/financeiro` ✅ | Financeiro |
| **Contas Receber** | `/financeiro/contas-receber` | `/financeiro/contas-receber` ✅ | Financeiro |
| **Faturamento** | `/faturamento` | `/financeiro/faturamento` 🔄 | Financeiro |
| | | | |
| **Dashboard Billing** | `/billing` | `/billing` ✅ | Billing |
| **Assinaturas** | `/assinaturas` | `/billing/assinaturas` 🔄 | Billing |
| | | | |
| **Usuários** | `/gestao/usuarios` | `/configuracoes/usuarios` 🔄 | Plataforma Base |
| **Empresa** | `/configuracoes/empresa` | `/configuracoes/empresa` ✅ | Plataforma Base |
| **Integrações** | `/configuracoes/integracoes` | `/configuracoes/integracoes` ✅ | Plataforma Base |
| | | | |
| **Admin Empresas** | `/admin/empresas` | `/admin/empresas` ✅ | Administração |

**Legenda**:
- ✅ Já está correto
- 🔄 Precisa mudar

---

## 💰 ESTRATÉGIA DE LICENCIAMENTO

### Planos Propostos

#### 🥉 STARTER - R$ 199/mês
**Inclui**:
- ✅ Plataforma Base (Dashboard, Configurações, Usuários)
- ✅ **1 módulo à escolha** (Atendimento OU CRM OU Vendas OU Financeiro OU Billing)
- ✅ Até 5 usuários
- ✅ Suporte básico

**Exemplo**:
- Cliente escolhe Atendimento → Pode gerenciar tickets, mas não tem CRM de clientes

#### 🥈 BUSINESS - R$ 499/mês
**Inclui**:
- ✅ Plataforma Base
- ✅ **3 módulos à escolha**
- ✅ Até 15 usuários
- ✅ Suporte prioritário

**Exemplo**:
- Cliente escolhe Atendimento + CRM + Vendas → Pode vincular tickets a clientes e gerar propostas

#### 🥇 ENTERPRISE - R$ 999/mês
**Inclui**:
- ✅ Plataforma Base
- ✅ **TODOS os 5 módulos** (Atendimento + CRM + Vendas + Financeiro + Billing)
- ✅ Módulo Administração (multi-tenant, se aplicável)
- ✅ Usuários ilimitados
- ✅ Suporte 24/7
- ✅ Customizações

---

### Matriz de Features por Plano

| Feature | STARTER | BUSINESS | ENTERPRISE |
|---------|---------|----------|------------|
| **Plataforma Base** | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Usuários | ✅ (5) | ✅ (15) | ✅ (∞) |
| Configurações | ✅ | ✅ | ✅ |
| | | | |
| **Atendimento** | 🔘 1 módulo | 🔘 3 módulos | ✅ |
| Chat Omnichannel | Incluso se escolher | Incluso se escolher | ✅ |
| Triagem Inteligente | Incluso se escolher | Incluso se escolher | ✅ |
| Bots | ❌ | Incluso se escolher | ✅ |
| | | | |
| **CRM** | 🔘 1 módulo | 🔘 3 módulos | ✅ |
| Clientes | Incluso se escolher | Incluso se escolher | ✅ |
| Pipeline | Incluso se escolher | Incluso se escolher | ✅ |
| | | | |
| **Vendas** | 🔘 1 módulo | 🔘 3 módulos | ✅ |
| Propostas | Incluso se escolher | Incluso se escolher | ✅ |
| Funil | Incluso se escolher | Incluso se escolher | ✅ |
| | | | |
| **Financeiro** | 🔘 1 módulo | 🔘 3 módulos | ✅ |
| Contas Receber/Pagar | Incluso se escolher | Incluso se escolher | ✅ |
| Conciliação | ❌ | Incluso se escolher | ✅ |
| | | | |
| **Billing** | 🔘 1 módulo | 🔘 3 módulos | ✅ |
| Assinaturas | Incluso se escolher | Incluso se escolher | ✅ |
| Pagamentos Recorrentes | Incluso se escolher | Incluso se escolher | ✅ |
| | | | |
| **Administração** | ❌ | ❌ | ✅ (opcional) |

**Legenda**:
- ✅ Incluído
- ❌ Não incluído
- 🔘 Escolher X módulos

---

## 🔗 DEPENDÊNCIAS CROSS-MODULE

### Mapeamento de Dependências

```
┌─────────────────────┐
│  PLATAFORMA BASE    │
│  - users            │
│  - empresas         │
│  - configuracoes    │
└──────────┬──────────┘
           │
           ├─────────────┬─────────────┬─────────────┬─────────────┐
           │             │             │             │             │
    ┌──────▼──────┐ ┌───▼────┐  ┌─────▼─────┐ ┌─────▼──────┐ ┌──▼──────┐
    │ ATENDIMENTO │ │  CRM   │  │  VENDAS   │ │ FINANCEIRO │ │ BILLING │
    │             │ │        │  │           │ │            │ │         │
    │ - tickets   │ │- clien-│  │- propostas│ │- contas    │ │- assina-│
    │ - equipes   │ │  tes ◄─┼──┼─(ref)     │ │  receber   │ │  turas  │
    │ - fluxos    │ │- conta-│  │- produtos │ │- contas    │ │- planos │
    └─────────────┘ │  tos   │  │- cotacoes │ │  pagar     │ │- faturas│
                    └────▲───┘  └─────┬─────┘ └─────▲──────┘ └────▲────┘
                         │            │             │             │
                         └────────────┼─────────────┴─────────────┘
                                      │
                              (cross-references)
```

### Regras de Integração

#### 1. **Atendimento → CRM** (opcional)
- **Se cliente TEM ambos módulos**:
  - Ticket pode ser vinculado a `cliente_id` (tabela clientes do CRM)
  - Histórico do cliente mostra tickets
  - Filtro "Tickets deste cliente" em CRM
  
- **Se cliente NÃO TEM CRM**:
  - Campo `cliente_id` fica `null`
  - Atendente digita nome do cliente manualmente (campo texto)

**Implementação Backend**:
```typescript
// ticket.entity.ts
@Entity('tickets')
export class Ticket {
  @Column({ nullable: true })
  cliente_id?: string; // ⚠️ Nullable - só preenche se CRM ativo
  
  @Column({ nullable: true })
  cliente_nome_manual?: string; // Fallback se sem CRM
}

// ticket.service.ts
async criar(dto: CreateTicketDto, empresa_id: string) {
  // Verificar se empresa tem módulo CRM ativo
  const temCRM = await this.moduloService.isModuloAtivo(empresa_id, 'CRM');
  
  if (temCRM && dto.cliente_id) {
    // Vincular ao cliente do CRM
    ticket.cliente_id = dto.cliente_id;
  } else {
    // Usar nome manual
    ticket.cliente_nome_manual = dto.cliente_nome_manual;
  }
}
```

#### 2. **Vendas → CRM** (obrigatório)
- Propostas SEMPRE são para clientes
- **Vendas depende de CRM** (não pode vender sem ter clientes)
- Sugestão: Ao ativar Vendas, sistema sugere ativar CRM se não tiver

**Implementação**:
```typescript
// proposta.entity.ts
@Entity('propostas')
export class Proposta {
  @Column()
  cliente_id: string; // ⚠️ Obrigatório - proposta precisa de cliente
  
  @ManyToOne(() => Cliente)
  cliente: Cliente;
}
```

#### 3. **Financeiro → CRM** (opcional)
- Contas a receber podem ser de clientes CRM
- Mas também podem ser de "clientes avulsos" (sem CRM)

**Implementação**:
```typescript
// conta-receber.entity.ts
@Entity('contas_receber')
export class ContaReceber {
  @Column({ nullable: true })
  cliente_id?: string; // ⚠️ Nullable
  
  @Column({ nullable: true })
  cliente_nome?: string; // Fallback
}
```

#### 4. **Billing → CRM** (obrigatório)
- Assinaturas são de clientes
- **Billing depende de CRM**

---

## 🚀 PLANO DE MIGRAÇÃO

### Fase 1: Reorganizar Menu (1-2 horas)
**Arquivo**: `frontend-web/src/config/menuConfig.ts`

**Ações**:
1. ✅ Remover duplicatas:
   - Remover "Clientes" de Atendimento (manter só em CRM)
   - Remover "Núcleos" de Configurações (manter só em Atendimento)
   - Remover "Departamentos" de Configurações (manter só em Atendimento)

2. ✅ Ajustar paths (se implementar padronização):
   - `/gestao/equipes` → `/atendimento/equipes`
   - `/gestao/nucleos` → `/atendimento/nucleos`
   - `/clientes` → `/crm/clientes`
   - etc.

3. ✅ Reorganizar hierarquia:
```typescript
export const menuConfig: MenuConfig[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'atendimento',
    title: 'Atendimento',
    icon: Headphones,
    color: 'purple',
    children: [
      { id: 'atendimento-dashboard', title: 'Dashboard', href: '/atendimento' },
      { id: 'atendimento-central', title: 'Central', href: '/atendimento/central' },
      { id: 'atendimento-chat', title: 'Chat', href: '/atendimento/chat' },
      // ❌ REMOVER: { id: 'atendimento-clientes', ... } - vai pro CRM
      { id: 'atendimento-nucleos', title: 'Núcleos', href: '/atendimento/nucleos' },
      { id: 'atendimento-equipes', title: 'Equipes', href: '/atendimento/equipes' },
      { id: 'atendimento-departamentos', title: 'Departamentos', href: '/atendimento/departamentos' },
      // ... resto
    ],
  },
  {
    id: 'crm',
    title: 'CRM',
    icon: Users,
    color: 'blue',
    children: [
      { id: 'crm-dashboard', title: 'Dashboard', href: '/nuclei/crm' },
      { id: 'crm-clientes', title: 'Clientes', href: '/crm/clientes' }, // ✅ OWNER
      { id: 'crm-contatos', title: 'Contatos', href: '/crm/contatos' },
      { id: 'crm-leads', title: 'Leads', href: '/crm/leads' },
      { id: 'crm-pipeline', title: 'Pipeline', href: '/crm/pipeline' },
    ],
  },
  // ... outros módulos
  {
    id: 'configuracoes',
    title: 'Configurações',
    icon: Settings,
    color: 'purple',
    children: [
      { id: 'configuracoes-empresa', title: 'Empresa', href: '/configuracoes/empresa' },
      { id: 'configuracoes-usuarios', title: 'Usuários', href: '/configuracoes/usuarios' },
      // ❌ REMOVER: { id: 'configuracoes-nucleos', ... } - vai pro Atendimento
      // ❌ REMOVER: { id: 'configuracoes-departamentos', ... } - vai pro Atendimento
      { id: 'configuracoes-integracoes', title: 'Integrações', href: '/configuracoes/integracoes' },
      // ... resto
    ],
  },
];
```

### Fase 2: Atualizar Rotas (2-3 horas)
**Arquivo**: `frontend-web/src/App.tsx`

**Ações**:
1. Criar redirects para paths antigos:
```typescript
// Redirects para compatibilidade
<Route path="/gestao/equipes" element={<Navigate to="/atendimento/equipes" replace />} />
<Route path="/gestao/nucleos" element={<Navigate to="/atendimento/nucleos" replace />} />
<Route path="/clientes" element={<Navigate to="/crm/clientes" replace />} />
```

2. Atualizar rotas para novos paths:
```typescript
<Route path="/atendimento/equipes" element={<GestaoEquipesPage />} />
<Route path="/atendimento/nucleos" element={<GestaoNucleosPage />} />
<Route path="/crm/clientes" element={<ClientesPage />} />
```

### Fase 3: Atualizar BackToNucleus (1 hora)
**Arquivos**: Todas as páginas com `<BackToNucleus>`

**Exemplo**:
```typescript
// GestaoEquipesPage.tsx
<BackToNucleus 
  nucleusName="Atendimento" 
  nucleusPath="/nuclei/atendimento" // ✅ Consistente
/>

// ClientesPage.tsx
<BackToNucleus 
  nucleusName="CRM" 
  nucleusPath="/nuclei/crm" // ✅ Consistente
/>
```

### Fase 4: Sistema de Licenciamento (3-5 horas)
**Criar tabela de módulos**:

```sql
-- Migration: adicionar módulos à empresa
CREATE TABLE empresa_modulos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  modulo VARCHAR(50) NOT NULL, -- 'ATENDIMENTO', 'CRM', 'VENDAS', 'FINANCEIRO', 'BILLING'
  ativo BOOLEAN DEFAULT true,
  data_ativacao TIMESTAMP DEFAULT NOW(),
  data_expiracao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(empresa_id, modulo)
);

-- Dados iniciais (empresas existentes têm todos módulos)
INSERT INTO empresa_modulos (empresa_id, modulo, ativo)
SELECT id, 'ATENDIMENTO', true FROM empresas
UNION ALL
SELECT id, 'CRM', true FROM empresas
UNION ALL
SELECT id, 'VENDAS', true FROM empresas
UNION ALL
SELECT id, 'FINANCEIRO', true FROM empresas
UNION ALL
SELECT id, 'BILLING', true FROM empresas;
```

**Backend - Service de Módulos**:
```typescript
// modulo.service.ts
@Injectable()
export class ModuloService {
  async isModuloAtivo(empresa_id: string, modulo: ModuloEnum): Promise<boolean> {
    const registro = await this.moduloRepository.findOne({
      where: { empresa_id, modulo, ativo: true }
    });
    return !!registro;
  }
  
  async listarModulosAtivos(empresa_id: string): Promise<ModuloEnum[]> {
    const modulos = await this.moduloRepository.find({
      where: { empresa_id, ativo: true }
    });
    return modulos.map(m => m.modulo);
  }
}
```

**Frontend - Hook de Licenciamento**:
```typescript
// hooks/useModuloAtivo.ts
export const useModuloAtivo = (modulo: string): boolean => {
  const { user } = useAuth();
  const [ativo, setAtivo] = useState(false);
  
  useEffect(() => {
    const verificar = async () => {
      const modulosAtivos = await empresaService.getModulosAtivos();
      setAtivo(modulosAtivos.includes(modulo));
    };
    verificar();
  }, [modulo, user?.empresa_id]);
  
  return ativo;
};

// Uso em página:
const ClientesPage = () => {
  const temCRM = useModuloAtivo('CRM');
  
  if (!temCRM) {
    return (
      <div className="p-6 text-center">
        <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Módulo CRM não contratado
        </h2>
        <p className="text-gray-600 mb-6">
          Contrate o módulo CRM para acessar a gestão de clientes.
        </p>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg">
          Contratar CRM - R$ 299/mês
        </button>
      </div>
    );
  }
  
  return (
    // ... página normal
  );
};
```

### Fase 5: Filtrar Menu por Licença (1 hora)
**Atualizar menuConfig.ts**:

```typescript
// menuConfig.ts
export const getMenuParaEmpresa = (modulosAtivos: string[]): MenuConfig[] => {
  const menuCompleto: MenuConfig[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      id: 'atendimento',
      title: 'Atendimento',
      requiredModule: 'ATENDIMENTO', // ⚠️ Novo campo
      children: [...],
    },
    {
      id: 'crm',
      title: 'CRM',
      requiredModule: 'CRM', // ⚠️ Novo campo
      children: [...],
    },
    // ...
  ];
  
  // Filtrar itens que empresa tem licença
  return menuCompleto.filter(item => {
    if (!item.requiredModule) return true; // Dashboard, Configurações sempre visíveis
    return modulosAtivos.includes(item.requiredModule);
  });
};

// DashboardLayout.tsx
const DashboardLayout = () => {
  const [modulosAtivos, setModulosAtivos] = useState<string[]>([]);
  
  useEffect(() => {
    const carregar = async () => {
      const modulos = await empresaService.getModulosAtivos();
      setModulosAtivos(modulos);
    };
    carregar();
  }, []);
  
  const menuFiltrado = useMemo(() => 
    getMenuParaEmpresa(modulosAtivos), 
    [modulosAtivos]
  );
  
  return (
    <Sidebar items={menuFiltrado} />
  );
};
```

---

## 📊 MATRIZ DE DECISÃO

### Priorização de Ações

| Ação | Impacto Negócio | Esforço (horas) | ROI | Prioridade |
|------|-----------------|-----------------|-----|------------|
| **Remover duplicatas do menu** | 🔴 Alto | 1h | 🟢 Altíssimo | 🔥 P0 - Urgente |
| **Padronizar paths /nuclei/** | 🟡 Médio | 3h | 🟡 Médio | 🟠 P1 - Importante |
| **Sistema de licenciamento** | 🔴 Alto | 5h | 🟢 Alto | 🔥 P0 - Urgente |
| **Filtrar menu por licença** | 🔴 Alto | 1h | 🟢 Alto | 🔥 P0 - Urgente |
| **Cross-module dependencies** | 🟡 Médio | 3h | 🟡 Médio | 🟠 P1 - Importante |
| **Documentar módulos** | 🟢 Baixo | 2h | 🟢 Alto | 🟢 P2 - Desejável |

**Recomendação de Execução**:

1. **Sprint 1 (1 semana)** - Urgente para comercialização:
   - ✅ Remover duplicatas menu (1h)
   - ✅ Sistema licenciamento backend (5h)
   - ✅ Filtrar menu por licença (1h)
   - ✅ Documentar módulos (2h)
   - **Total**: 9 horas

2. **Sprint 2 (1 semana)** - Melhorias:
   - ✅ Padronizar paths /nuclei/ (3h)
   - ✅ Cross-module dependencies (3h)
   - ✅ Testes de licenciamento (3h)
   - **Total**: 9 horas

---

## 💡 OPORTUNIDADES DE RECEITA

### Cross-Sell (Venda Cruzada)

| Cliente Tem | Sugerir | Motivo | Conversão Estimada |
|-------------|---------|--------|-------------------|
| **Atendimento** | CRM | Vincular tickets a clientes | 60% |
| **CRM** | Vendas | Gerar propostas para clientes | 70% |
| **Vendas** | Financeiro | Faturar propostas aprovadas | 50% |
| **CRM + Vendas** | Billing | Assinaturas recorrentes | 40% |
| **Atendimento + CRM** | Billing | Suporte a assinantes | 30% |

### Upsell (Upgrade de Plano)

| Plano Atual | Upsell Para | Gatilho | Conversão Estimada |
|-------------|-------------|---------|-------------------|
| **Starter (1 módulo)** | Business (3 módulos) | Ao atingir 4 usuários | 40% |
| **Business (3 módulos)** | Enterprise (todos) | Ao atingir 12 usuários | 25% |
| **Business** | Enterprise | Solicitar customização | 60% |

### Bundling (Pacotes)

**Pacote "Gestão Completa"**: Atendimento + CRM + Vendas  
Preço: R$ 699/mês (vs R$ 847 separado) - **Desconto 17%**

**Pacote "Financeiro Total"**: Financeiro + Billing  
Preço: R$ 399/mês (vs R$ 448 separado) - **Desconto 11%**

---

## 🧪 CHECKLIST DE TESTES

### Testes de Licenciamento

- [ ] Empresa com **APENAS Atendimento**:
  - [ ] Menu mostra só Atendimento + Dashboard + Configurações
  - [ ] Acesso a `/crm/clientes` retorna 403 Forbidden
  - [ ] Tickets NÃO têm campo `cliente_id` (só nome manual)

- [ ] Empresa com **Atendimento + CRM**:
  - [ ] Menu mostra ambos módulos
  - [ ] Tickets podem vincular a clientes do CRM
  - [ ] Página de cliente mostra histórico de tickets

- [ ] Empresa com **TODOS módulos**:
  - [ ] Menu completo visível
  - [ ] Cross-references funcionam (proposta → cliente → ticket → fatura)

### Testes de Navegação

- [ ] BackToNucleus em todas as páginas apontam para `/nuclei/*`
- [ ] Redirects de paths antigos funcionam (ex: `/gestao/equipes` → `/atendimento/equipes`)
- [ ] Sidebar não mostra módulos não contratados

### Testes de Funcionalidade

- [ ] Criar ticket sem CRM (nome manual) funciona
- [ ] Criar ticket com CRM (vincular cliente) funciona
- [ ] Criar proposta (Vendas) exige cliente CRM
- [ ] Criar assinatura (Billing) exige cliente CRM

---

## 📝 DOCUMENTAÇÃO COMPLEMENTAR

### Para Time de Vendas

**Criar**: `docs/MODULOS_COMERCIAIS.md`
- Descrição de cada módulo
- Features incluídas
- Casos de uso
- Comparativo de planos
- Matriz de cross-sell

### Para Time de Implementação

**Criar**: `docs/LICENCIAMENTO_TECNICO.md`
- Como verificar módulo ativo (backend + frontend)
- Como adicionar novo módulo
- Como criar feature cross-module
- Troubleshooting de permissões

### Para Time de Suporte

**Criar**: `docs/FAQ_MODULOS.md`
- "Cliente não vê menu CRM" → Verificar licença
- "Erro ao criar proposta" → Precisa contratar CRM
- "Como ativar módulo X" → Processo de ativação

---

## 🎯 RESUMO EXECUTIVO FINAL

### O Que Fazer AGORA (Próximos 2-3 dias)

1. ✅ **Limpar menuConfig.ts** (1 hora)
   - Remover Clientes de Atendimento
   - Remover Núcleos de Configurações
   - Remover Departamentos de Configurações

2. ✅ **Criar sistema de licenciamento** (5 horas)
   - Tabela `empresa_modulos`
   - Service `ModuloService`
   - Hook `useModuloAtivo`

3. ✅ **Filtrar menu por licença** (1 hora)
   - Adicionar `requiredModule` em menuConfig
   - Função `getMenuParaEmpresa()`
   - Integrar no DashboardLayout

4. ✅ **Testar cenários** (2 horas)
   - Empresa só com Atendimento
   - Empresa com Atendimento + CRM
   - Empresa com todos módulos

**Total estimado**: **9 horas de desenvolvimento**

### Resultado Esperado

- ✅ Sistema 100% modular e comercializável
- ✅ Clientes podem comprar módulos separados
- ✅ Menu dinâmico por licença
- ✅ Cross-sell automatizado (sugestões no sistema)
- ✅ Receita recorrente previsível

---

## 📞 PRÓXIMOS PASSOS

Aguardo sua confirmação para:

1. **Começar a implementação?**
   - Limpar duplicatas do menu
   - Criar sistema de licenciamento
   - Filtrar menu por módulos ativos

2. **Ajustar a estratégia?**
   - Modificar preços sugeridos
   - Alterar bundling de módulos
   - Adicionar/remover features de módulos

3. **Focar em algo específico?**
   - Apenas reorganização do menu (rápido)
   - Apenas documentação comercial
   - Implementação completa

**Diga qual caminho seguir!** 🚀
