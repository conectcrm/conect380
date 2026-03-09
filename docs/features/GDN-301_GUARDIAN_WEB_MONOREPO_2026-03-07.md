# GDN-301 - Publish guardian web app in monorepo

## Data
- 2026-03-07

## Objetivo
- Publicar uma app web dedicada (`guardian-web`) no monorepo, com autenticacao isolada e roteamento base para governanca.

## Implementacao
- Novo app no monorepo:
  - `guardian-web/` (scaffold dedicado a partir da base administrativa)
- Isolamento de autenticacao:
  - chaves locais exclusivas (`guardian_auth_token`, `guardian_user_data`)
  - env dedicada: `VITE_GUARDIAN_API_URL`
  - role permitida no cliente: `superadmin`
- Base de rotas publicada:
  - `/login`
  - `/`
  - `/governance/users`
  - `/governance/companies`
  - `/governance/audit`
  - `/governance/system`
- Gateway guardian integrado no frontend:
  - migra chamadas de `/admin/bff/*` para `/guardian/bff/*`
- Deploy isolado preparado:
  - `docker-compose.guardian-web.yml`
  - `deploy/guardian-web.host-nginx.conf`
  - `guardian-web/Dockerfile` ajustado para `VITE_GUARDIAN_API_URL`

## Validacao executada
- `npm --prefix guardian-web ci`
- `npm --prefix guardian-web run type-check`
- `npm --prefix guardian-web run build`

