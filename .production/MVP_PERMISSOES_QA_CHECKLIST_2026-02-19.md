# MVP Permissoes - Checklist QA/UAT (2026-02-19)

## Pre-condicoes
- Ambiente com backend e frontend atualizados na branch `chore/mvp-effective-change-gate-20260218`.
- Usuarios de teste ativos para perfis: `superadmin`, `admin`, `gerente`, `vendedor`, `suporte`, `financeiro`.
- Empresa de teste com assinatura ativa e modulos `usuarios` e `dashboard` habilitados.
- Referencia de permissoes canonicas: `.production/CATALOGO_PERMISSOES_2026-02-19.md`.

## Criterio de aprovacao
- Cada item marcado como `PASS` quando comportamento observado bater com resultado esperado.
- Qualquer `FAIL` bloqueia aprovacao de PR de seguranca/permissoes.

## 1) Login e contexto de empresa
- [ ] `superadmin` faz login com sucesso.
- [ ] `admin` faz login com sucesso.
- [ ] `gerente` faz login com sucesso.
- [ ] `vendedor` faz login com sucesso.
- [ ] `suporte` faz login com sucesso.
- [ ] `financeiro` faz login com sucesso.
- [ ] Em todos os perfis autenticados, `/users/profile` retorna `empresa` preenchida.

## 2) Gestao de usuarios por hierarquia
- [ ] `superadmin` consegue criar usuario `admin`.
- [ ] `admin` nao consegue criar usuario `admin` (esperado: 403).
- [ ] `admin` consegue criar usuario `gerente`.
- [ ] `gerente` consegue criar usuario `vendedor`.
- [ ] `gerente` nao consegue criar usuario `financeiro` (esperado: 403).
- [ ] `vendedor` nao consegue criar usuario (esperado: 403).
- [ ] `suporte` nao consegue criar usuario (esperado: 403).
- [ ] `admin` nao consegue atualizar outro `admin` (esperado: 403).
- [ ] `gerente` nao consegue atualizar `admin` (esperado: 403).
- [ ] `admin` nao consegue resetar propria senha via `/users/:id/reset-senha` (esperado: 403).
- [ ] `superadmin` consegue gerenciar propria conta via endpoint admin quando necessario.

## 3) Integridade de payload em usuarios
- [ ] `PUT /users/profile` com `role` no payload retorna bloqueio (esperado: 403).
- [ ] `PUT /users/profile` com `empresa_id` no payload retorna bloqueio (esperado: 403).
- [ ] `PUT /users/profile` com campo desconhecido retorna erro (esperado: 400).
- [ ] Resposta de `POST /users` nao expoe campo `senha`.
- [ ] Resposta de `GET /users` nao expoe campo `senha` nos itens.

## 4) Dashboard por escopo de perfil
- [ ] `superadmin` pode consultar `/dashboard/kpis?vendedor=<outro_id>`.
- [ ] `admin` pode consultar `/dashboard/kpis?vendedor=<outro_id>`.
- [ ] `gerente` pode consultar `/dashboard/kpis?vendedor=<outro_id>`.
- [ ] `vendedor` com query `vendedor=<outro_id>` recebe dados apenas do proprio id.
- [ ] `suporte` com query `vendedor=<outro_id>` recebe dados apenas do proprio id.
- [ ] `financeiro` com query `vendedor=<outro_id>` recebe dados apenas do proprio id.

## 5) Assinaturas e configuracao da empresa
- [ ] `superadmin` consegue `POST /assinaturas/checkout`.
- [ ] `admin` consegue `POST /assinaturas/checkout`.
- [ ] `gerente` nao consegue `POST /assinaturas/checkout` (esperado: 403).
- [ ] `superadmin` consegue `PUT /empresas/config`.
- [ ] `admin` consegue `PUT /empresas/config`.
- [ ] `gerente` nao consegue `PUT /empresas/config` (esperado: 403).

## 6) Governanca (planos, admin empresas, DLQ)
- [ ] `superadmin` consegue `POST /planos`.
- [ ] `admin` consegue `POST /planos`.
- [ ] `gerente` nao consegue `POST /planos` (esperado: 403).
- [ ] `superadmin` consegue `GET /admin/empresas`.
- [ ] `admin` consegue `GET /admin/empresas`.
- [ ] `gerente` nao consegue `GET /admin/empresas` (esperado: 403).
- [ ] `superadmin` consegue `POST /api/atendimento/filas/dlq/status`.
- [ ] `admin` consegue `POST /api/atendimento/filas/dlq/status`.
- [ ] `suporte` nao consegue `POST /api/atendimento/filas/dlq/status` (esperado: 403).

## 7) Multi-tenant e bypass
- [ ] Criacao de usuario ignora `empresa_id` do payload e usa empresa do token.
- [ ] Endpoint `GET /assinaturas/empresa/:empresaId` ignora `:empresaId` da rota e usa empresa do token.
- [ ] Nao e possivel acessar dados de outra empresa com token valido de empresa diferente.

## 8) Regressao automatizada minima
- [ ] `npm --prefix backend run build`
- [ ] `npm --prefix backend run test:e2e -- test/admin/admin-empresas-guard.e2e-spec.ts`
- [ ] `npm --prefix backend run test -- src/modules/users/users.controller.spec.ts`
- [ ] `.production/scripts/smoke-dashboard-role-scope.ps1 -BaseUrl http://127.0.0.1:3001`

## 9) Compatibilidade de permissoes legadas
- [ ] Usuario com permissao explicita legada (ex.: `USERS_CREATE`) consegue acessar rota equivalente (`users.create`).
- [ ] Usuario sem role suficiente e sem permissao explicita nao acessa rota protegida por `@Permissions` (esperado: 403).

## Evidencias
- Anexar no PR:
  - print/arquivo de resultado dos comandos.
  - tabela simples de PASS/FAIL por bloco (1 a 8).
