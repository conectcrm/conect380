# Smoke Execution 2026-02-20

## Automated Checks

### Backend
- `npm run type-check` -> pass
- `npm run build` -> pass
- `npm run validate:permissions-governance` -> pass
  - 1 suite, 7 tests passed

### Frontend
- `npm run type-check` -> pass
- `npm run build` -> pass

## Runtime Smoke (Authenticated)

### Environment
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Note: both ports were already in use before this run.

### Login
- Initial credentials from docs returned `401`:
  - `admin@conect.com / admin123`
  - `admin@fenixcrm.com / admin123`
- Executed: `node backend/create-admin-user.js`
- Created/validated user:
  - `admin@conectsuite.com.br / admin123`
- Login succeeded and redirected to `/dashboard`.

### Route Navigation (post-login)
- `/dashboard` -> ok
- `/atendimento/inbox` -> ok
- `/pipeline` -> ok
- `/agenda` -> ok
- `/configuracoes` -> ok

### Mobile Width Checks (320 / 390 / 430)
- Routes tested:
  - `/dashboard`
  - `/atendimento/inbox`
  - `/pipeline`
  - `/agenda`
  - `/configuracoes`
- Result:
  - No horizontal overflow detected (`scrollWidth == innerWidth` on all tested routes/sizes).

## Findings

### Confirmed Mobile Issue
- Symptom reproduced:
  - With mobile drawer open, profile button is visible but not clickable.
- Evidence:
  - Click interception by drawer backdrop (`fixed inset-0 bg-gray-600 bg-opacity-75`).
- Likely source:
  - `frontend-web/src/components/layout/DashboardLayout.tsx:511`
  - Drawer shell/backdrop in:
    - `frontend-web/src/components/layout/DashboardLayout.tsx:508`
    - `frontend-web/src/components/layout/DashboardLayout.tsx:511`

### Mobile Drawer/Profile Revalidation (after fix)
- Status: resolved
- File updated:
  - `frontend-web/src/components/layout/DashboardLayout.tsx`
- Applied behavior:
  - Opening mobile drawer now closes profile/language/user menus before enabling sidebar.
  - Floating topbar actions tray is hidden/disabled on mobile while drawer is open.
- Runtime evidence (390px viewport):
  - Drawer open:
    - profile button `pointer-events: none` (no interception race with overlay)
    - menu entries rendered and visible
  - Drawer closed:
    - profile button `pointer-events: auto`
    - profile dropdown opens normally (`Meu Perfil`, `Alterar Perfil`, `Configurações`, `Sair`)
- Regression smoke:
  - `npx playwright test e2e/mobile-responsiveness-smoke.spec.ts --project=chromium --reporter=list`
  - Result: `1 passed`

### Dedicated Drawer/Profile Regression Test
- New guard:
  - `e2e/mobile-drawer-profile.spec.ts`
- Scope:
  - `/dashboard` on 320, 390 and 430 widths
  - Ensures topbar/profile pointer-events are blocked while drawer is open and restored after close
  - Ensures profile menu opens after drawer close (`Meu Perfil`)
- Execution:
  - `npx playwright test e2e/mobile-drawer-profile.spec.ts --project=chromium --reporter=list`
  - Result: `1 passed`
  - Combined regression run:
    - `npx playwright test e2e/mobile-responsiveness-smoke.spec.ts e2e/mobile-drawer-profile.spec.ts --project=chromium --reporter=list`
    - Result: `2 passed`
- Pipeline wiring:
  - Root script: `npm run test:e2e:mobile:guard`
  - Operational smoke script now executes this guard by default:
    - `.production/scripts/smoke-mvp-ui.ps1`
    - Optional bypass: `-SkipMobileGuard`
  - Execution evidence:
    - `powershell -NoProfile -ExecutionPolicy Bypass -File .production/scripts/smoke-mvp-ui.ps1`
    - Result: `MVP UI smoke result: PASS` (includes `mvp-smoke-ui` + mobile guard suite)

### Pipeline Mobile Revalidation (320-430)
- Status: resolved
- Files updated:
  - `frontend-web/src/pages/PipelinePage.tsx`
  - `e2e/mobile-responsiveness-smoke.spec.ts`
- Applied behavior:
  - View selector (Kanban/Lista/Calendario/Graficos) no longer clipped in mobile layout.
  - Filters/actions row wraps correctly without pushing controls off-screen.
  - Kanban columns and pagination now follow mobile-first sizing/stacking.
  - Calendar toolbar has mobile media-query fallback.
- Regression evidence:
  - `npx playwright test e2e/mobile-responsiveness-smoke.spec.ts --project=chromium --reporter=list`
  - Result: `1 passed`
  - `npm run test:e2e:mobile:guard`
  - Result: `2 passed`

### Operational Note
- During aggressive automated navigation loops, backend returned multiple `429 Too Many Requests` in console for some endpoints.
- This appears rate-limit related to test burst, not a compilation/runtime crash.

### Expanded Routed Mobile Sweep (2026-02-21)
- Objective:
  - Revalidate responsiveness consistency across additional active routed screens (beyond previous critical subset).
- File updated:
  - `e2e/mobile-responsiveness-smoke.spec.ts`
- Changes in guard:
  - Expanded route matrix (`EXPANDED_ROUTES`) with additional active screens.
  - Expanded sample breakpoints switched to `320` and `430`.
  - Added public routed sweep (`PUBLIC_ROUTES`) for login/registration/recovery/capture flows.
  - Permission-page detection now keys off explicit `Acesso negado` heading to avoid text-based false positives.
- Execution:
  - `npx playwright test e2e/mobile-responsiveness-smoke.spec.ts --project=chromium --reporter=list`
  - Result: `2 passed`
  - `npm run test:e2e:mobile:guard`
  - Result: `3 passed`
- Observation:
  - Permission-blocked route during this run: `/empresas/minhas` (responsive checks skipped by design in guard).
