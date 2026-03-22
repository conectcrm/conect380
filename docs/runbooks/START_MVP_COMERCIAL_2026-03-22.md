# Runbook - Start MVP Comercial (GO Core) - 2026-03-22

## Objetivo

Subir o sistema no recorte MVP comercial (GO Core) e validar os fluxos que podem ser comercializados hoje (Vendas + Compras).

Nota: Atendimento fica fora do MVP inicial enquanto passa por estabilizacao.

Fonte do escopo: `docs/features/CHECKLIST_GO_LIVE_FLUXO_VENDAS_MVP_2026-03.md`.

## Pre-requisitos (minimo)

- Node.js 22.16+ e npm 10+
- Docker + Docker Compose (recomendado para subir dependencias)
- PowerShell 7+

## 1) Subir stack (desenvolvimento via Docker) - caminho rapido para demo

Comando:

```powershell
docker compose -f docker-compose.yml -f docker-compose.mvp.yml up -d
docker compose ps
```

Acessos esperados:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001/health`

Credencial padrao usada pelo smoke UI (ajuste conforme seu ambiente):
- `admin@conect360.com.br` / `admin123`

## 2) Validar guardrails GO Core (MVP mode)

```powershell
npm run validate:release:vendas:core
```

## 3) Smoke automatizado do MVP (backend + UI)

```powershell
.\.production\scripts\smoke-mvp-core.ps1 -SkipAtendimento
.\.production\scripts\smoke-mvp-ui.ps1
```

Observacao:
- `smoke-mvp-ui.ps1` roda `e2e/mvp-smoke-ui.spec.ts` e o guard mobile.

## 4) Smoke manual (roteiro de demo)

Fluxos:
- Login e troca de contexto/perfil
- Criar lead
- Mover pipeline
- Criar proposta
- Criar/abrir contrato
- Compras: `/financeiro/cotacoes` e `/financeiro/compras/aprovacoes`
- Atendimento: fora do MVP inicial (em estabilizacao). Se precisar validar, habilite o modulo e rode os smokes completos.

## 5) Pilot (ondas) - quando for ativacao controlada

```powershell
.\.production\scripts\start-mvp-pilot.ps1 -PilotName "piloto-comercial-wave1" -SkipPreflight
```

Depois seguir:
- `.production/MVP_ROLLOUT_WAVE1_2026-02-18.md`
