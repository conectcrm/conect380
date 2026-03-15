## Summary
- Fixes mobile drawer items becoming visually invisible while still clickable.
- Fixes intermittent loss of profile-menu interaction after mobile drawer usage.
- Adds stable mobile selectors and expands mobile responsiveness smoke coverage.

## Root Cause
- Navigation styles were shared between desktop dark sidebar and mobile white drawer, causing low contrast on mobile.
- Submenu panel state could remain active after drawer close, leaving residual overlay behavior.

## Changes
- `frontend-web/src/components/navigation/HierarchicalNavGroup.tsx`
  - Added mobile-specific visual branch (`instanceId === "mobile"`) for readable icon/text states.
- `frontend-web/src/components/layout/DashboardLayout.tsx`
  - Added `closeMobileSidebar` routine to close drawer and clear active submenu state.
  - Added mobile test ids:
    - `data-testid="mobile-menu-open"`
    - `data-testid="mobile-menu-close"`
- `e2e/mobile-responsiveness-smoke.spec.ts`
  - Added targeted mobile check: open drawer, validate item visibility, close drawer, open profile menu.

## Validation
- Frontend type-check: ✅
- Frontend build: ✅
- Playwright smoke (`e2e/mobile-responsiveness-smoke.spec.ts`): ✅
- Final focused mobile QA (390/430, critical routes): ✅

## Notes
- `/atendimento/inbox` is fullscreen and does not render the dashboard topbar drawer by design.

