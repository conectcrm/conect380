# Cleanup 2026-02-20

## Scope
- Remove files outside the active runtime flow.
- Archive temporary docs and audit artifacts from repository root.

## Technical Criteria
- Reachability graph from `frontend-web/src/index.tsx`.
- Traversal includes:
  - static imports
  - dynamic imports (`import('...')`)
  - barrel re-exports (`export ... from '...'`)
- Candidate removals only when file is not reachable from runtime graph.

## First Pass
- Removed high-confidence legacy patterns (`.OLD`, `.DEPRECATED`, `_Template`, `.new`, `broken`, `Teste`, unreachable `examples`).
- Archived root audit outputs into `docs/archive/cleanup-2026-02-20`.

## Second Pass (Aggressive)
- Generated full list: `docs/archive/cleanup-2026-02-20/UNREACHABLE_RUNTIME_CANDIDATES.txt`.
- Removed 280 additional unreachable code files (tests and `.d.ts` preserved in candidate generation).
- Removed legacy `frontend-web/src/__tests__` files that referenced deleted unreachable components.

## Validation
- Ran `npm run type-check` in `frontend-web`.
- Result: success (`tsc --noEmit` passed).

## Notes
- `pw-topbar.log` was copied to archive but could not be deleted from root because it is locked by another process.

## Final Root Markdown Sweep
- Maintained an operational whitelist of root docs (project readme, contribution/security/support, setup/quickstart, and root docs linked by `README.md`).
- Archived 187 additional root `.md` files to:
  - `docs/archive/cleanup-2026-02-20/root-md-final/`
- Generated inventories:
  - `docs/archive/cleanup-2026-02-20/ROOT_MD_FINAL_KEEP_LIST.txt`
  - `docs/archive/cleanup-2026-02-20/ROOT_MD_FINAL_MOVE_LIST.txt`
- Fixed one broken link in `README.md`:
  - `CHAT_REALTIME_README.md` -> `frontend-web/docs/FRONTEND_CHAT_REALTIME.md`

## Post-Cleanup Follow-up
- Added dedicated E2E regression guard for mobile drawer/profile interaction:
  - `e2e/mobile-drawer-profile.spec.ts`
- Validated together with mobile smoke suite:
  - `npx playwright test e2e/mobile-responsiveness-smoke.spec.ts e2e/mobile-drawer-profile.spec.ts --project=chromium --reporter=list`
  - Result: `2 passed`
- Added operational pipeline hook for the guard:
  - Root script: `npm run test:e2e:mobile:guard`
  - `.production/scripts/smoke-mvp-ui.ps1` now runs the mobile guard by default before go-live evidence closure.

## Dashboard V2 Follow-up (2026-02-21)
- Activated V1 vs V2 daily validation scheduler in `DashboardV2Module` provider list.
- Added external benchmark runner:
  - `backend/scripts/benchmark-dashboard-v2.js`
  - `backend` command: `npm run benchmark:dashboard-v2`
- Added scheduled monitoring workflow:
  - `.github/workflows/dashboard-v2-benchmark.yml`
  - Daily cron + manual dispatch + artifact upload + optional Pushgateway export.
- Added benchmark runbook:
  - `docs/archive/cleanup-2026-02-20/DASHBOARD_V2_BENCHMARK_EXTERNAL.md`
- Added secrets checklist by environment:
  - `docs/archive/cleanup-2026-02-20/DASHBOARD_V2_BENCHMARK_SECRETS_CHECKLIST.md`
- Added benchmark gate alerts:
  - `backend/config/alert-rules.yml` (group: `dashboard_v2_benchmark`)

## Dashboard V2 Layout Rollout + QA (2026-02-21)
- Implemented dashboard entry gate for controlled rollout:
  - `/dashboard` now resolves via `frontend-web/src/features/dashboard/DashboardHomeRoute.tsx`
  - V2 only for `administrador/gerente` with feature flag enabled.
  - Legacy fallback preserved with `DashboardLayout + DashboardRouter forceLegacy`.
- Upgraded `DashboardV2Shell` compatibility with existing mobile regression suite:
  - Added required test ids:
    - `mobile-menu-open`
    - `mobile-menu-close`
    - `mobile-sidebar-drawer`
    - `topbar-actions-tray`
  - Restored user menu + profile switching contract:
    - `button[data-user-menu]`
    - `Alterar Perfil`
    - `data-profile-selector` + `.max-h-64` option list
- Validation executed:
  - `npm --prefix frontend-web run type-check` -> pass
  - `npm --prefix frontend-web run build` -> pass
  - `npx playwright test e2e/mvp-smoke-ui.spec.ts --project=chromium --reporter=list` -> pass (1/1)
  - `npx playwright test e2e/mobile-responsiveness-smoke.spec.ts e2e/mobile-drawer-profile.spec.ts --project=chromium --reporter=list` -> pass (3/3)
- New V2 visual evidence generated:
  - `docs/archive/baseline-2026-02-21-dashboard-v2/dashboard-v2-viewport-1920x1080-2026-02-21.png`
  - `docs/archive/baseline-2026-02-21-dashboard-v2/dashboard-v2-fullpage-2026-02-21.png`
  - `docs/archive/baseline-2026-02-21-dashboard-v2/SNAPSHOT_METADATA.json`
