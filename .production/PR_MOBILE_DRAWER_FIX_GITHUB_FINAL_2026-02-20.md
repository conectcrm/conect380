# fix: mobile drawer visibility and profile interaction

## Summary
- Fixes mobile drawer items becoming visually invisible while still clickable.
- Fixes profile button interaction after drawer open/close flows.
- Adds stable mobile selectors and dedicated E2E coverage for drawer/profile flow.

## Root Cause
- Desktop sidebar color classes were reused inside the white mobile drawer, causing low contrast.
- Active submenu state could persist after drawer close, leaving residual overlay behavior.

## Changes
- `frontend-web/src/components/navigation/HierarchicalNavGroup.tsx`
  - Added mobile-specific visual branch (`instanceId === "mobile"`).
  - Applied readable icon/text states for white drawer background.
- `frontend-web/src/components/layout/DashboardLayout.tsx`
  - Added `closeMobileSidebar` to close drawer and clear active submenu state.
  - Added mobile test ids:
    - `data-testid="mobile-menu-open"`
    - `data-testid="mobile-menu-close"`
- `e2e/mobile-responsiveness-smoke.spec.ts`
  - Added targeted mobile step:
    - open drawer
    - validate menu label visibility/contrast
    - close drawer
    - validate profile menu opens
- Docs/audit updates:
  - `RESPONSIVE_AUDIT.md`
  - `QUICK_FIXES.md`
  - `USED_UI_INVENTORY.md`
  - `.production/PR_MOBILE_DRAWER_FIX_2026-02-20.md`
  - `.production/PR_MOBILE_DRAWER_FIX_BODY_2026-02-20.md`
  - `.production/MOBILE_QA_FINAL_2026-02-20.md`

## Validation
- Frontend type-check: ✅
- Frontend build: ✅
- Playwright smoke (`e2e/mobile-responsiveness-smoke.spec.ts`): ✅
- Final focused mobile QA (390/430 + critical routes): ✅

## Notes
- `/atendimento/inbox` is fullscreen and does not render dashboard topbar drawer by design.

## Checklist
- [x] No horizontal overflow on validated mobile routes
- [x] Drawer menu items have visible contrast
- [x] Profile menu remains interactive after drawer close
- [x] Frontend build and type-check pass
- [x] E2E mobile smoke passes
