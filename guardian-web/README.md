# Conect360 Guardian Web

Aplicacao dedicada de governanca do Conect360, publicada no monorepo como superficie separada da app operacional `frontend-web`.

## Objetivo

Entregar um painel guardian com:

1. autenticacao isolada;
2. acesso restrito a `superadmin`;
3. base de rotas operacionais de governanca;
4. deploy isolado para subdominio guardian.

## Execucao local

```bash
npm install
npm run dev
```

Por padrao a API usada e `http://localhost:3001`.

Para customizar:

```bash
cp .env.example .env
# ajustar VITE_GUARDIAN_API_URL
```

## Build

```bash
npm run build
```

O output e gerado em `guardian-web/build`.

## Rotas iniciais

1. `/login`
2. `/` (dashboard de governanca)
3. `/governance/users`
4. `/governance/companies`
5. `/governance/audit`
6. `/governance/system`

## Deploy isolado

Arquivos base para deploy dedicado:

1. `guardian-web/Dockerfile`
2. `guardian-web/nginx.conf`
3. `docker-compose.guardian-web.yml`
4. `deploy/guardian-web.host-nginx.conf`

