# Matriz Modulo x Permissao x Plano

Gerado automaticamente em: 2026-03-29T22:07:06.771Z
Fontes:
- `backend/src/common/permissions/permissions.constants.ts`
- `backend/src/modules/planos/planos.defaults.ts`

## 1) Modulos canonicos

| Modulo | Nome | Essencial |
| --- | --- | --- |
| `CRM` | CRM | Sim |
| `ATENDIMENTO` | Atendimento | Nao |
| `VENDAS` | Vendas | Nao |
| `FINANCEIRO` | Financeiro | Nao |
| `COMPRAS` | Compras | Nao |
| `BILLING` | Billing | Sim |
| `ADMINISTRACAO` | Administracao | Nao |

## 2) Modulo x Permissoes

### CRM

Total de permissoes: **20**

- `crm.agenda.create`
- `crm.agenda.delete`
- `crm.agenda.read`
- `crm.agenda.update`
- `crm.clientes.create`
- `crm.clientes.delete`
- `crm.clientes.read`
- `crm.clientes.update`
- `crm.leads.create`
- `crm.leads.delete`
- `crm.leads.read`
- `crm.leads.update`
- `crm.oportunidades.create`
- `crm.oportunidades.delete`
- `crm.oportunidades.read`
- `crm.oportunidades.update`
- `crm.produtos.create`
- `crm.produtos.delete`
- `crm.produtos.read`
- `crm.produtos.update`

### ATENDIMENTO

Total de permissoes: **10**

- `atendimento.chats.read`
- `atendimento.chats.reply`
- `atendimento.dlq.manage`
- `atendimento.filas.manage`
- `atendimento.sla.manage`
- `atendimento.tickets.assign`
- `atendimento.tickets.close`
- `atendimento.tickets.create`
- `atendimento.tickets.read`
- `atendimento.tickets.update`

### VENDAS

Total de permissoes: **6**

- `comercial.propostas.approve.override`
- `comercial.propostas.create`
- `comercial.propostas.delete`
- `comercial.propostas.read`
- `comercial.propostas.send`
- `comercial.propostas.update`

### FINANCEIRO

Total de permissoes: **18**

- `financeiro.alertas.manage`
- `financeiro.alertas.read`
- `financeiro.aprovacoes.manage`
- `financeiro.aprovacoes.read`
- `financeiro.centro-custos.manage`
- `financeiro.centro-custos.read`
- `financeiro.conciliacao.manage`
- `financeiro.conciliacao.read`
- `financeiro.contas-bancarias.manage`
- `financeiro.contas-bancarias.read`
- `financeiro.contas-pagar.manage`
- `financeiro.contas-pagar.read`
- `financeiro.faturamento.manage`
- `financeiro.faturamento.read`
- `financeiro.fornecedores.manage`
- `financeiro.fornecedores.read`
- `financeiro.pagamentos.manage`
- `financeiro.pagamentos.read`

### COMPRAS

Total de permissoes: **4**

- `compras.aprovacoes.manage`
- `compras.aprovacoes.read`
- `compras.cotacoes.manage`
- `compras.cotacoes.read`

### BILLING

Total de permissoes: **0**


### ADMINISTRACAO

Total de permissoes: **15**

- `admin.empresas.manage`
- `config.automacoes.manage`
- `config.empresa.read`
- `config.empresa.update`
- `config.integracoes.manage`
- `dashboard.read`
- `planos.manage`
- `relatorios.read`
- `users.bulk.update`
- `users.create`
- `users.profile.update`
- `users.read`
- `users.reset-password`
- `users.status.update`
- `users.update`

## 3) Plano x Modulo

| Plano | Codigo | CRM | ATENDIMENTO | VENDAS | FINANCEIRO | COMPRAS | BILLING | ADMINISTRACAO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Starter | `starter` | Sim | Sim | Nao | Nao | Nao | Sim | Nao |
| Business | `business` | Sim | Sim | Sim | Sim | Sim | Sim | Nao |
| Enterprise | `enterprise` | Sim | Sim | Sim | Sim | Sim | Sim | Sim |

## 4) Observacoes operacionais

- O modulo `BILLING` nao possui namespace proprio de permissao no backend hoje.
- Rotas de billing usam principalmente `planos.manage`, classificado em `ADMINISTRACAO`.
- `dashboard.read` e `relatorios.read` foram mantidas em `ADMINISTRACAO` por serem transversais.

