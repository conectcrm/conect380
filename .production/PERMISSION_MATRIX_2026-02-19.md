# Permission Matrix (2026-02-19)

## Goal
Define a scalable permission model covering all major system resources, with clear grouping for user management UI and backend enforcement.

## Domains

### Users / Governance
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

### Commercial
- `comercial.propostas.read`
- `comercial.propostas.create`
- `comercial.propostas.update`
- `comercial.propostas.delete`
- `comercial.propostas.send`

### Support / Atendimento
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
- Legacy accepted token: `ATENDIMENTO`

### Finance
- `financeiro.faturamento.read`
- `financeiro.faturamento.manage`
- `financeiro.pagamentos.read`
- `financeiro.pagamentos.manage`

### Configuration
- `config.empresa.read`
- `config.empresa.update`
- `config.integracoes.manage`
- `config.automacoes.manage`

## Default profile baseline
- `superadmin`: all permissions.
- `admin`: full operational + governance.
- `gerente`: broad cross-domain management, without `admin.empresas.manage`.
- `vendedor`: CRM/commercial operational set.
- `suporte`: atendimento-centric set + limited CRM read/update.
- `financeiro`: finance set + insights + selected CRM/commercial reads.

## Enforcement status (phase 2)
### Already protected with `PermissionsGuard`
- Dashboard and analytics: `dashboard.read`, `relatorios.read`.
- CRM core:
  - clientes + contatos (`crm.clientes.*`)
  - leads (`crm.leads.*`)
  - oportunidades (`crm.oportunidades.*`)
  - produtos (`crm.produtos.*`)
  - agenda/eventos (`crm.agenda.*`)
- Comercial:
  - propostas CRUD (`comercial.propostas.*`)
  - envio/pdf/email (`comercial.propostas.send`)
- Financeiro:
  - faturamento controller (`financeiro.faturamento.*`, `financeiro.pagamentos.*`)
  - gateways de pagamentos (`financeiro.pagamentos.*`)
  - fornecedores (`financeiro.pagamentos.read/manage`)
- Configuracoes:
  - empresa config (`config.empresa.read/update`)
  - empresa modulos/plano (`config.empresa.read/update`)
- Atendimento (cobertura principal):
  - tickets/chats (`atendimento.tickets.*`, `atendimento.chats.*`)
  - filas/distribuicao (`atendimento.filas.manage`)
  - SLA (`atendimento.sla.manage`)
  - canais/integracoes (`config.integracoes.manage`)
  - contexto/busca/demanda/atendentes com mapeamento para tickets/chats/filas
- Atendimento (legado e configuracoes):
  - tags, templates, notas de cliente (read/reply de chats)
  - configuracao de inatividade, niveis/status/tipos de servico (`atendimento.sla.manage`)
  - webhook de envio autenticado (`atendimento.chats.reply`) sem afetar webhooks publicos
- Fluxo e automacao:
  - triagem (fluxos, nucleos, departamentos, equipes, atribuicoes, sessao interna) com `config.automacoes.manage`
  - orquestrador com `config.automacoes.manage`
- Outros dominios:
  - interacoes CRM (`crm.clientes.*`)
  - contratos/comercial (`comercial.propostas.*`)
  - IA interna (`config.automacoes.manage`)
  - mercado pago autenticado (`financeiro.pagamentos.read/manage`), mantendo webhook publico
- Gestao de usuarios (catalogo canônico):
  - `GET /users/permissoes/catalogo` exposto no backend para servir grupos/labels/defaults por papel ao frontend.
  - `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx` passou a consumir o catalogo (com fallback local).

## Next enforcement phase
1. Evoluir o catalogo com tokens dedicados para contratos/triagem caso se queira separacao ainda mais fina de acesso.
2. Expandir E2E para recursos restantes e regras de negocio por escopo (ex.: owner/team) alem do bloqueio `403`.
3. Adicionar smoke UI automatizado que valide renderizacao dinamica do modal por papel (dados vindos do catalogo).

## Validacao automatizada adicionada
- `src/common/permissions/permissions.utils.spec.ts` validando:
  - defaults por perfil
  - normalizacao de aliases legados
  - avaliacao de permissoes requeridas
- `test/permissoes/perfis-acesso.e2e-spec.ts` validando matriz real por perfil (`admin`, `gerente`, `vendedor`, `suporte`, `financeiro`) em:
  - leitura: 16 rotas chave (`200/403`)
  - escrita: 8 rotas chave (`201/200/400` para perfis permitidos e `403` para perfis sem permissao)
