# ConectCRM Production Workspace

## Objetivo
Este diretorio concentra o fluxo de build, validacao e operacao para release MVP em ambiente local Docker.

## Escopo atual
- Build backend + frontend + imagens Docker
- Subida local com Docker Compose
- Validacao de saude e isolamento multi-tenant
- Preflight e smoke do MVP
- Suporte ao ciclo de piloto comercial

## Requisitos
- Node.js 20+
- npm 10+
- Docker 24+
- Docker Compose 2+
- PowerShell 7+

## Estrutura principal
```text
.production/
  README.md
  DEPLOY.md
  docker-compose.yml
  configs/
  docker/
  scripts/
  pilot-runs/
```

## Quick start local
```powershell
cd c:\Projetos\conectcrm\.production

# 1) Preparar variaveis locais
cp .env.production .env.production.local
# editar .env.production.local

# 2) Build
.\scripts\build-all.ps1

# 3) Subir stack
docker compose up -d

# 4) Verificar
docker compose ps
curl http://localhost:3500/health
curl http://localhost:3000
```

## Endpoints esperados
- Backend: `http://localhost:3500`
- Frontend: `http://localhost:3000`
- Health: `http://localhost:3500/health`
- API Docs: `http://localhost:3500/api-docs`

## Validacao antes de go-live
No diretorio raiz do repositorio:
```powershell
# preflight completo
.\.production\scripts\preflight-go-live.ps1

# opcional: mais rapido, sem E2E
.\.production\scripts\preflight-go-live.ps1 -SkipE2E
```

## Fluxo MVP (escopo comercial)
```powershell
$env:REACT_APP_MVP_MODE = "true"

# checklist tecnico MVP
.\.production\scripts\preflight-mvp-go-live.ps1

# smoke core e UI
.\.production\scripts\smoke-mvp-core.ps1
.\.production\scripts\smoke-mvp-ui.ps1

# smoke de dashboard por perfil
.\.production\scripts\smoke-dashboard-role-scope.ps1 -BaseUrl http://127.0.0.1:3001
```

## Fluxo de piloto comercial (resumo)
```powershell
# 1) abrir sessao de piloto
.\.production\scripts\start-mvp-pilot.ps1 -PilotName "piloto-comercial-lote-1" -SkipPreflight

# 2) recomendar e ajustar clientes
.\.production\scripts\recommend-mvp-pilot-clients.ps1 -RunDir ".production\pilot-runs\<sessao>"
.\.production\scripts\finalize-mvp-pilot-clients.ps1 -RunDir ".production\pilot-runs\<sessao>" -WindowStart "2026-02-18 09:00" -WindowHours 48
.\.production\scripts\review-mvp-pilot-profiles.ps1 -RunDir ".production\pilot-runs\<sessao>" -Reviewer "time-comercial" -MinScore 1

# 3) preparar outreach
.\.production\scripts\prepare-mvp-pilot-outreach.ps1 -RunDir ".production\pilot-runs\<sessao>" -Owner "time-comercial"
.\.production\scripts\prepare-mvp-pilot-outreach-followup.ps1 -RunDir ".production\pilot-runs\<sessao>" -Owner "time-comercial"

# 4) registrar execucao funcional
.\.production\scripts\record-mvp-pilot-functional-result.ps1 -RunDir ".production\pilot-runs\<sessao>" -Cliente "Cliente X" -Cenario CriacaoLead -Resultado PASS
.\.production\scripts\prepare-mvp-pilot-functional-sheet.ps1 -RunDir ".production\pilot-runs\<sessao>" -Force
.\.production\scripts\import-mvp-pilot-functional-sheet.ps1 -RunDir ".production\pilot-runs\<sessao>" -SheetPath ".production\pilot-runs\<sessao>\functional-sheet.csv" -SkipIfAlreadyRecorded

# 5) cobertura e readiness
.\.production\scripts\run-mvp-pilot-functional-scenarios.ps1 -RunDir ".production\pilot-runs\<sessao>" -ProvisionMissingUsers
.\.production\scripts\check-mvp-pilot-functional-coverage.ps1 -RunDir ".production\pilot-runs\<sessao>"
.\.production\scripts\assess-mvp-pilot-readiness.ps1 -RunDir ".production\pilot-runs\<sessao>" -BranchProtectionStatus Unknown
```

## Scripts mais usados
- Build/deploy local:
  - `scripts/build-all.ps1`
  - `scripts/preflight-go-live.ps1`
  - `scripts/preflight-mvp-go-live.ps1`
- Smoke:
  - `scripts/smoke-mvp-core.ps1`
  - `scripts/smoke-mvp-ui.ps1`
  - `scripts/smoke-dashboard-role-scope.ps1`
- Isolamento:
  - `scripts/test-full-isolation.ps1`
  - `scripts/test-rls.ps1`
- Piloto:
  - `scripts/start-mvp-pilot.ps1`
  - `scripts/run-mvp-pilot-cycle.ps1`
  - `scripts/run-mvp-pilot-window-monitor.ps1`

## Operacao rapida
```powershell
# logs
docker compose logs -f backend
docker compose logs -f frontend

# restart seletivo
docker compose restart backend
docker compose restart frontend

# stop
docker compose down
```

## Seguranca
- Nunca commitar segredos reais em `.env.production` ou `.env.production.local`.
- Usar `.env.production` apenas como template.
- Revisar permissao de acesso aos artefatos em `pilot-runs/` antes de compartilhar.

## Documentos de referencia
- `./DEPLOY.md`
- `./CATALOGO_PERMISSOES_2026-02-19.md`
- `./MATRIZ_PERMISSOES_MVP_2026-02-19.md`
- `./MVP_PERMISSOES_QA_CHECKLIST_2026-02-19.md`
- `./MVP_DASHBOARD_ROLE_CHECKLIST_2026-02-19.md`
- `./PERMISSION_MATRIX_2026-02-19.md`
