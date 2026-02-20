# Catalogo de Permissoes (2026-02-19)

## Objetivo
- Centralizar permissoes granulares em um ponto unico.
- Manter compatibilidade com RBAC atual por `role`.
- Permitir evolucao para controles mais finos sem quebrar endpoints existentes.

## Implementacao no codigo
- Constantes e matriz base:
  - `backend/src/common/permissions/permissions.constants.ts`
- Resolucao/normalizacao de permissoes do usuario:
  - `backend/src/common/permissions/permissions.utils.ts`
- Decorator:
  - `backend/src/common/decorators/permissions.decorator.ts`
- Guard:
  - `backend/src/common/guards/permissions.guard.ts`

## Permissoes canonicas (escopo atual)
### Usuarios / Governanca
- `users.profile.update`
- `users.read`
- `users.create`
- `users.update`
- `users.reset-password`
- `users.status.update`
- `users.bulk.update`
- `planos.manage`
- `admin.empresas.manage`

### Insights
- `dashboard.read`
- `relatorios.read`

### CRM
- `crm.clientes.read`
- `crm.clientes.create`
- `crm.clientes.update`
- `crm.clientes.delete`
- `crm.leads.read`
- `crm.leads.create`
- `crm.leads.update`
- `crm.leads.delete`
- `crm.oportunidades.read`
- `crm.oportunidades.create`
- `crm.oportunidades.update`
- `crm.oportunidades.delete`
- `crm.produtos.read`
- `crm.produtos.create`
- `crm.produtos.update`
- `crm.produtos.delete`
- `crm.agenda.read`
- `crm.agenda.create`
- `crm.agenda.update`
- `crm.agenda.delete`

### Comercial
- `comercial.propostas.read`
- `comercial.propostas.create`
- `comercial.propostas.update`
- `comercial.propostas.delete`
- `comercial.propostas.send`

### Atendimento
- `atendimento.chats.read`
- `atendimento.chats.reply`
- `atendimento.tickets.read`
- `atendimento.tickets.create`
- `atendimento.tickets.update`
- `atendimento.tickets.assign`
- `atendimento.tickets.close`
- `atendimento.filas.manage`
- `atendimento.sla.manage`
- `atendimento.dlq.manage`

### Financeiro
- `financeiro.faturamento.read`
- `financeiro.faturamento.manage`
- `financeiro.pagamentos.read`
- `financeiro.pagamentos.manage`

### Configuracoes
- `config.empresa.read`
- `config.empresa.update`
- `config.integracoes.manage`
- `config.automacoes.manage`

## Mapeamento padrao por perfil
- `superadmin`: todas as permissoes
- `admin`: operacao completa + governanca (`users.*`, CRM, comercial, atendimento, financeiro, configuracoes, `planos.manage`, `admin.empresas.manage`)
- `gerente`: operacao ampla sem `admin.empresas.manage` e sem `planos.manage`, com atendimento gerencial e automacoes
- `vendedor`: perfil comercial/CRM operacional
- `suporte`: atendimento + leituras/edicoes limitadas de CRM
- `financeiro`: financeiro + insights + leituras comerciais/CRM selecionadas

## Compatibilidade legado
- Alias legados (`USERS_CREATE`, `USERS_READ`, etc.) continuam aceitos e convertidos para formato canonico.
- Alias de role legados tambem sao aceitos na resolucao (`manager` -> `gerente`, `user` -> `suporte`).
- Estrategia atual e aditiva: permissao efetiva do usuario = permissoes padrao do role + permissoes explicitas em `users.permissoes`.
- Token legado explicitamente suportado para atribuicao manual: `ATENDIMENTO`.

## Endpoints ja protegidos por permissao
- `auth/register` -> `users.create`
- `users` (gestao e perfil) -> permissoes `users.*` correspondentes
- `dashboard`/`analytics` -> `dashboard.read` e `relatorios.read`
- CRM (clientes/leads/oportunidades/produtos/agenda) -> `crm.*`
- Comercial (propostas + envio/pdf/email) -> `comercial.propostas.*` e `comercial.propostas.send`
- Atendimento (tickets/chats/filas/sla/dlq) -> `atendimento.*`
- Financeiro (faturamento/pagamentos/fornecedores) -> `financeiro.*`
- Configuracoes (empresa/integracoes/automacoes) -> `config.*`
- `admin/empresas/**` -> `admin.empresas.manage`
- mutacoes de `planos` -> `planos.manage`

## Catalogo para frontend
- Endpoint: `GET /users/permissoes/catalogo`
- Retorna:
  - grupos com `id`, `label`, `description`, `roles`, `options`
  - `defaultsByRole`
  - `allPermissions`
  - `legacyAssignablePermissions`
- Consumidor atual: modal de cadastro/edicao em `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx` com fallback local.

## Recomendacao de rollout
1. Manter `@Roles` + `@Permissions` nos endpoints sensiveis (modelo atual).
2. Adicionar permissoes gradualmente modulo a modulo.
3. Quando houver maturidade, avaliar migracao de algumas regras de role para permissao pura.
