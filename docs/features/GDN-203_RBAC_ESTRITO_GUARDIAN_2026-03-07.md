# GDN-203 - RBAC estrito para namespace Guardian

## Data
- 2026-03-07

## Objetivo
- Exigir acesso estrito `SUPERADMIN` para rotas `guardian/*`, mantendo verificacao de permissoes granulares por endpoint.

## Mudancas implementadas
- `GuardianEmpresasController`:
  - `@Roles(UserRole.SUPERADMIN)` no nivel de classe.
  - Permissao `admin.empresas.manage` mantida.
- `GuardianBffController`:
  - `@Roles(UserRole.SUPERADMIN)` no nivel de classe.
  - Endpoints criticos com `@Roles(UserRole.SUPERADMIN)` explicito:
    - `POST /guardian/bff/access-change-requests/:id/approve`
    - `POST /guardian/bff/access-change-requests/:id/reject`
    - `POST /guardian/bff/break-glass/requests/:id/approve`
    - `POST /guardian/bff/break-glass/requests/:id/reject`
    - `POST /guardian/bff/break-glass/:id/revoke`
  - Permissoes por acao (`users.read`, `users.update`, `admin.empresas.manage`) preservadas.

## Compatibilidade
- Rotas legadas `admin/*` permanecem para transicao, sem alteracao de comportamento nesta entrega.

## Validacao executada
- Testes unitarios:
  - `guardian.controller.spec.ts`
  - `guardian-empresas.controller.spec.ts`
  - `guardian-bff.controller.spec.ts`
  - `admin-bff.controller.spec.ts`
- Build backend:
  - `npm --prefix backend run build`

