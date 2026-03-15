# Dashboard V2 Layout QA - 2026-02-21

## Escopo
- Validar rollout controlado do `/dashboard` (V2 por feature flag + fallback legado).
- Validar regressao de interacao mobile (drawer + topbar + menu de perfil).
- Gerar evidencias visuais do layout novo para comparacao com baseline anterior.

## Alteracoes-chave
- `frontend-web/src/features/dashboard/DashboardHomeRoute.tsx`
  - Gate por perfil (`administrador`/`gerente`) e feature flag para renderizar V2.
  - Fallback para legado com `DashboardLayout + DashboardRouter forceLegacy`.
- `frontend-web/src/features/dashboard/DashboardRouter.tsx`
  - Novo `forceLegacy` para desabilitar V2 no fallback.
- `frontend-web/src/features/dashboard-v2/useDashboardV2.ts`
  - `useDashboardV2Flag(enabled)` para evitar fetch desnecessario fora do escopo V2.
- `frontend-web/src/features/dashboard-v2/DashboardV2Shell.tsx`
  - Compatibilidade com suite mobile existente:
    - `data-testid="mobile-menu-open"`
    - `data-testid="mobile-menu-close"`
    - `data-testid="mobile-sidebar-drawer"`
    - `data-testid="topbar-actions-tray"`
  - Menu de usuario com:
    - `button[data-user-menu]`
    - acao `Alterar Perfil`
    - seletor `data-profile-selector` + lista `.max-h-64`
  - Bloqueio de interacao da topbar enquanto drawer mobile estiver aberto.

## Validacao tecnica
- `npm --prefix frontend-web run type-check` -> PASS
- `npm --prefix frontend-web run build` -> PASS

## Validacao E2E
- `npx playwright test e2e/mvp-smoke-ui.spec.ts --project=chromium --reporter=list` -> PASS (1/1)
- `npx playwright test e2e/mobile-responsiveness-smoke.spec.ts e2e/mobile-drawer-profile.spec.ts --project=chromium --reporter=list` -> PASS (3/3)
  - Observacao esperada: rota `/empresas/minhas` bloqueada por permissao no smoke mobile.

## Evidencias visuais (estado novo)
Diretorio:
- `docs/archive/baseline-2026-02-21-dashboard-v2/`

Arquivos:
- `docs/archive/baseline-2026-02-21-dashboard-v2/dashboard-v2-viewport-1920x1080-2026-02-21.png`
- `docs/archive/baseline-2026-02-21-dashboard-v2/dashboard-v2-fullpage-2026-02-21.png`
- `docs/archive/baseline-2026-02-21-dashboard-v2/SNAPSHOT_METADATA.json`

## Baseline anterior (estado antigo)
- `docs/archive/baseline-2026-02-21-dashboard/dashboard-atual-viewport-1920x1080-2026-02-21.png`
- `docs/archive/baseline-2026-02-21-dashboard/dashboard-atual-fullpage-2026-02-21.png`

## Status
- Dashboard V2 com shell novo: implementado.
- Rollout controlado por feature flag: implementado.
- Compatibilidade mobile/testes regressivos: validada.
