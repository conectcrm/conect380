# PR Body - Permission Hardening Frontend (2026-02-20)

## Title
`feat(frontend): harden permission-based route access and route rules`

## Summary
Este PR endurece o controle de acesso no frontend para reduzir exposicao de menus e bypass por URL.

Principais pontos:
- `PermissionPathGuard` para validar acesso por rota em tempo de navegacao.
- Filtro de menu por modulos + permissoes do usuario logado.
- Regras explicitas de permissao para rotas sensiveis (`ROUTE_PERMISSION_RULES`).
- Suporte a `match: 'all'` para rotas que exigem combinacao de permissoes.
- Ajuste de matching para evitar liberacao indevida por prefixo de item pai.
- Testes automatizados de permissao cobrindo cenarios positivos/negativos.

## Functional Impact
- Usuario sem permissao deixa de ver menus/submenus nao autorizados.
- Acesso direto por URL em paginas protegidas passa a bloquear com tela de `Acesso negado`.
- Rotas com dependencia de dados auxiliares exigem permissoes combinadas.

## Key Route Rules (`match: all`)
- `/atendimento/tickets/novo`:
  - `atendimento.tickets.create`
  - `crm.clientes.read`
- `/vendas/cotacoes`:
  - `comercial.propostas.read`
  - `comercial.propostas.create`
  - `crm.clientes.read`
  - `crm.produtos.read`
- `/combos/novo`, `/vendas/combos/novo`:
  - `crm.produtos.create`
  - `crm.produtos.read`
- `/combos/:id/editar`, `/vendas/combos/:id/editar`:
  - `crm.produtos.update`
  - `crm.produtos.read`
- `/financeiro/relatorios`:
  - `financeiro.faturamento.read`
  - `relatorios.read`

## Validation
- `npm --prefix frontend-web run type-check` -> PASS
- `npm --prefix frontend-web test -- --watch=false --runInBand --runTestsByPath src/config/__tests__/menuConfig.permissions.test.ts` -> PASS
- `npm --prefix frontend-web run build` -> PASS
- `.production/scripts/smoke-mvp-ui.ps1` -> PASS
- `.production/scripts/smoke-dashboard-role-scope.ps1 -BaseUrl http://127.0.0.1:3001` -> PASS

## Manual Evidence
Usuario de validacao: `ledayane@gmail.com`

Comportamento observado:
- Sidebar: `Dashboard`, `Atendimento`, `Comercial`.
- Submenus:
  - `Atendimento`: `Chat`, `Tickets`
  - `Comercial`: `Propostas`
- Rotas permitidas:
  - `/atendimento/inbox`
  - `/vendas/propostas`
- Rotas bloqueadas:
  - `/nuclei/configuracoes/usuarios`
  - `/vendas/cotacoes`
  - `/gestao/fluxos/novo/builder`
  - `/admin/monitoramento`
  - `/atendimento/tickets/novo` (quando faltar `crm.clientes.read`)

## Files Changed
- `frontend-web/src/App.tsx`
- `frontend-web/src/components/layout/DashboardLayout.tsx`
- `frontend-web/src/components/licensing/PermissionPathGuard.tsx`
- `frontend-web/src/components/navigation/HierarchicalNavGroup.tsx`
- `frontend-web/src/config/menuConfig.ts`
- `frontend-web/src/config/__tests__/menuConfig.permissions.test.ts`
- `frontend-web/src/features/dashboard/AtendimentoRoleDashboard.tsx`
- `frontend-web/src/types/index.ts`

## Risk / Rollback
Risco principal:
- perfis com permissao incompleta perderem acesso a rotas antes abertas por comportamento permissivo.

Rollback rapido:
```bash
git revert 0980745
```

## Merge Checklist
- [ ] Revisao de `menuConfig.ts` focada em regras de rota e aliases.
- [ ] Validacao UAT com perfil `suporte`, `vendedor` e `admin`.
- [ ] Confirmacao de que nao ha menu/rota critica visivel sem permissao.
