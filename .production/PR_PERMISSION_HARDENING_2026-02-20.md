# PR - Frontend Permission Hardening (2026-02-20)

## Identificacao
- Branch: `chore/mvp-effective-change-gate-20260218`
- Commit principal: `0980745`
- Escopo: frontend (menu, guard de rota, validacao de acesso)

## Titulo sugerido
`feat(frontend): harden permission-based route access and route rules`

## Objetivo
- Remover exposicao de menus/rotas sem permissao.
- Bloquear acesso direto por URL em telas sensiveis.
- Tornar regras de rota mais estritas quando uma tela depende de mais de uma permissao.
- Reduzir regressao futura via testes automatizados.

## Resumo tecnico
1. Guard de rota por permissao
- Introduzido `PermissionPathGuard` para validar acesso por caminho de URL.
- Aplicado no fluxo autenticado do app.

2. Filtro de menu por permissao
- `getMenuParaEmpresa(modulosAtivos, user)` agora filtra por modulos + permissoes.
- Sidebar passa a exibir apenas opcoes permitidas para o usuario logado.

3. Regras explicitas de rota
- Expandido `ROUTE_PERMISSION_RULES` para rotas criticas de atendimento, comercial, financeiro, gestao e admin.
- Adicionado suporte de regra:
  - `match: 'any'` (padrao)
  - `match: 'all'` (todas as permissoes obrigatorias)

4. Endurecimento de matching de caminho
- Ajustado matching para impedir que item pai de menu libere subrota indevida por prefixo.
- Mantido nested access apenas para rotas folha.

5. Compatibilidade e normalizacao
- Mantida normalizacao de aliases legados de permissoes.
- Mantido fallback por role quando usuario nao possui permissoes explicitas.

## Regras com `match: all` adicionadas/fortalecidas
- `/atendimento/tickets/novo`:
  - `atendimento.tickets.create`
  - `crm.clientes.read`
- `/vendas/cotacoes`:
  - `comercial.propostas.read`
  - `comercial.propostas.create`
  - `crm.clientes.read`
  - `crm.produtos.read`
- `/combos/novo` e `/vendas/combos/novo`:
  - `crm.produtos.create`
  - `crm.produtos.read`
- `/combos/:id/editar` e `/vendas/combos/:id/editar`:
  - `crm.produtos.update`
  - `crm.produtos.read`
- `/financeiro/relatorios`:
  - `financeiro.faturamento.read`
  - `relatorios.read`

## Arquivos alterados (commit 0980745)
- `frontend-web/src/App.tsx`
- `frontend-web/src/components/layout/DashboardLayout.tsx`
- `frontend-web/src/components/licensing/PermissionPathGuard.tsx`
- `frontend-web/src/components/navigation/HierarchicalNavGroup.tsx`
- `frontend-web/src/config/menuConfig.ts`
- `frontend-web/src/config/__tests__/menuConfig.permissions.test.ts`
- `frontend-web/src/features/dashboard/AtendimentoRoleDashboard.tsx`
- `frontend-web/src/types/index.ts`

## Validacao executada
- `npm --prefix frontend-web run type-check` -> PASS
- `npm --prefix frontend-web test -- --watch=false --runInBand --runTestsByPath src/config/__tests__/menuConfig.permissions.test.ts` -> PASS
- `npm --prefix frontend-web run build` -> PASS

## Evidencia funcional (usuario restrito)
Usuario validado: `ledayane@gmail.com`

Comportamento observado:
- Sidebar exibiu apenas: `Dashboard`, `Atendimento`, `Comercial`.
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
  - `/atendimento/tickets/novo` (sem `crm.clientes.read`)

## Risco e mitigacao
Riscos:
- Bloqueio de rotas para perfis que antes acessavam por permissao incompleta.
- Mudanca de comportamento em telas que dependem de dados auxiliares (clientes/produtos/relatorios).

Mitigacoes:
- Regras `match: all` aplicadas apenas em rotas com dependencia comprovada.
- Testes de permissao cobrindo casos positivos e negativos.
- Validacao manual com usuario restrito real.

## Rollback
Rollback rapido (reverter apenas este hardening frontend):
```bash
git revert 0980745
```

Rollback parcial (se necessario):
- Reverter somente `frontend-web/src/config/menuConfig.ts` para desabilitar regras novas.
- Manter `PermissionPathGuard` ativo para nao reabrir bypass total.

## Checklist de merge
- [ ] Aprovar diff de `frontend-web/src/config/menuConfig.ts` com foco em regras novas.
- [ ] Confirmar matriz de permissao para perfis `suporte` e `vendedor`.
- [ ] Rodar smoke de navegacao com 2 usuarios restritos e 1 admin.
- [ ] Confirmar que nenhum menu/rota critica esta visivel sem permissao.
- [ ] Merge sem squash com referencia ao commit `0980745`.
