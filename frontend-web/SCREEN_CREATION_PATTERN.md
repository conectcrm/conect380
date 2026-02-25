# Screen Creation Pattern (Canonical Reference)

## Status

This file is now a short entrypoint to the canonical screen standard.

The previous content was based on older patterns (legacy header/breadcrumb + local width control)
and no longer reflects the current `layout-v2` standard used in the system.

## Canonical Document (use this first)

- `docs/features/ARQUITETURA_PADRONIZACAO_TELAS.md`

## Complementary References

- `frontend-web/src/components/layout-v2/RouteTemplateFrame.tsx`
- `frontend-web/src/components/layout-v2/templates/PageTemplates.tsx`
- `frontend-web/src/components/layout-v2/components/PageHeader.tsx`
- `frontend-web/src/components/layout-v2/components/FiltersBar.tsx`
- `frontend-web/src/components/layout-v2/components/Card.tsx`
- `frontend-web/src/features/clientes/ClientesPage.tsx`
- `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx`

## Required Workflow (summary)

1. Identify the route typology (`LIST`, `SETTINGS`, `DASHBOARD`, `FORM`, etc.).
2. Fix route typology in `RouteTemplateFrame` before adjusting local layout.
3. Refactor page structure with `layout-v2` components.
4. Standardize states (loading, error, empty).
5. Standardize list/table/mobile behavior and modals (when applicable).
6. Validate build and manual UX checks.

## PR / QA Checklist

Use:

- `docs/features/CHECKLIST_PADRONIZACAO_TELAS.md`

