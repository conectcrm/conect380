# Conect360 Admin Web

Aplicacao administrativa dedicada do Conect360 (ADM-301), separada da app operacional `frontend-web`.

## Objetivo

Entregar uma superficie de backoffice com:

1. autenticacao administrativa (`superadmin`, `admin`, `gerente`);
2. menu de governanca focado em operacoes criticas;
3. base de deploy isolado para subdominio administrativo.

## Execucao local

```bash
npm install
npm run dev
```

Por padrao a API usada e `http://localhost:3001`.

Para customizar:

```bash
cp .env.example .env
# ajustar VITE_ADMIN_API_URL
```

## Build

```bash
npm run build
```

O output e gerado em `admin-web/build`.

## Rotas iniciais

1. `/login`
2. `/` (dashboard de governanca)
3. `/governance/users`
4. `/governance/companies`
5. `/governance/audit`
6. `/governance/system`

## Deploy isolado

Arquivos base para deploy dedicado:

1. `admin-web/Dockerfile`
2. `admin-web/nginx.conf`
3. `docker-compose.admin-web.yml`
4. `deploy/admin-web.host-nginx.conf`
