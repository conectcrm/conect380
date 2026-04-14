# ADM-303 Break-Glass Rollout Checklist

## Scope
Operational checklist to deploy and validate the break-glass flow (temporary emergency access) delivered in ADM-303.

## 1. Pre-deploy
1. Ensure backend contains migration `CreateAdminBreakGlassAccesses1802894000000`.
2. Ensure `admin-web` build includes:
   - `SystemGovernancePage` with break-glass request/approval/revoke screens.
   - dashboard cards for pending/active break-glass metrics.
3. Confirm at least one `superadmin` and one `admin` active in target company.
4. Confirm staging smoke before production:
   - `GET /admin/bff/break-glass/requests?status=REQUESTED&limit=20`
   - `GET /admin/bff/break-glass/active?limit=20`

## 2. Deploy
1. Run release flow from `.production/RELEASE_RUNBOOK.md`.
2. Run migrations:
   - `docker compose run --rm backend npm run migration:run`
3. Confirm migration status:
   - `docker compose run --rm backend npm run migration:show`
   - Expected: `CreateAdminBreakGlassAccesses1802894000000` marked as `[X]`.

## 3. Functional smoke (mandatory)
Preferred automated execution:

```powershell
.\.production\scripts\smoke-adm303-break-glass.ps1 `
  -BaseUrl "https://<api-host>" `
  -RequesterEmail "<admin-requester@email>" `
  -RequesterPassword "<password>" `
  -ApproverEmail "<admin-approver@email>" `
  -ApproverPassword "<password>" `
  -TargetEmail "<target-usuario@email>" `
  -TargetPassword "<password>"
```

If MFA is enabled, pass `-RequesterMfaCode`, `-ApproverMfaCode` and `-TargetMfaCode`.

Manual fallback:

1. Login as `admin` and create a break-glass request in admin-web:
   - target user: `gerente` (or another non-superadmin profile)
   - permissions: `admin.empresas.manage`
   - duration: `20` minutes
   - reason filled.
2. Login as second approver (`superadmin` or `admin`, not requester) and approve.
3. Validate target user can access protected route while active:
   - `GET /admin/bff/companies?page=1&limit=10` returns `200`.
4. Revoke active access (or force expiration in homolog DB) and validate access is removed:
   - same route returns `403`.
5. Validate audit trail:
   - `GET /admin/bff/audit/activities?admin_only=true&limit=100`
   - entries include `categoria=admin_break_glass`.

## 4. Evidence to archive
1. Migration output (`migration:run` and `migration:show`).
2. API smoke screenshots or logs for request, approve, active, and revoke/expired.
3. Audit query output with `admin_break_glass` events.
4. Release commit/tag used in deployment.
5. Script report files:
   - `docs/features/evidencias/ADM303_SMOKE_*.json`
   - `docs/features/evidencias/ADM303_SMOKE_*.md`
