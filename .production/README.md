# ConectCRM Production Workspace

## Objetivo
Este diretorio concentra o fluxo de build e execucao para ambiente de producao local (Docker), sem dependencia de AWS neste momento.

## Escopo atual
- Build backend + frontend + imagens Docker
- Subida local com Docker Compose
- Validacao basica de saude
- Validacoes de isolamento multi-tenant

## Requisitos
- Node.js 20+
- npm 10+
- Docker 24+
- Docker Compose 2+
- PowerShell 7+

## Estrutura
```text
.production/
  README.md
  DEPLOY.md
  docker-compose.yml
  docker/
    Dockerfile.backend
    Dockerfile.frontend
  configs/
    nginx.conf
  scripts/
    build-all.ps1
    test-rls.ps1
    test-full-isolation.ps1
```

## Quick start (local)
```powershell
cd c:\Projetos\conectcrm\.production

# 1) Build completo
.\scripts\build-all.ps1

# 2) Preparar variaveis locais
cp .env.production .env.production.local
# editar .env.production.local

# 3) Subir stack
docker compose up -d

# 4) Verificar status
docker compose ps
```

## Endpoints esperados
- Backend: `http://localhost:3500`
- Frontend: `http://localhost:3000`
- Health: `http://localhost:3500/health`
- API Docs: `http://localhost:3500/api-docs`

## Validacoes recomendadas antes de producao
```powershell
# Executa checklist completo em um comando
.\scripts\preflight-go-live.ps1

# Opcional: sem E2E (mais rapido)
.\scripts\preflight-go-live.ps1 -SkipE2E
```

## Modo MVP (go-live comercial)
Para release do MVP comercial, habilitar escopo reduzido no frontend:
```powershell
$env:REACT_APP_MVP_MODE = "true"
```

Checklist tecnico do MVP:
```powershell
.\scripts\preflight-mvp-go-live.ps1
```

Smoke automatizado do MVP (fluxos core):
```powershell
.\scripts\smoke-mvp-core.ps1
```

Smoke UI do MVP (login + rotas core):
```powershell
.\scripts\smoke-mvp-ui.ps1
```

Kickoff de sessao piloto (gera pasta com checklist/evidencias/status):
```powershell
.\scripts\start-mvp-pilot.ps1 -PilotName "piloto-comercial-lote-1" -SkipPreflight
```

Sugestao automatica de clientes para a sessao (classifica `SUGERIDO`, `REVISAR_CONTATO` e `REVISAR_PERFIL`):
```powershell
.\scripts\recommend-mvp-pilot-clients.ps1 -RunDir ".production\pilot-runs\<sessao>"
```

Finalizacao de contatos e janela do piloto (ajusta contato suspeito + agenda 48h):
```powershell
.\scripts\finalize-mvp-pilot-clients.ps1 -RunDir ".production\pilot-runs\<sessao>" -WindowStart "2026-02-18 09:00" -WindowHours 48
```

Revisao final de clientes em `REVISAR_PERFIL`:
```powershell
.\scripts\review-mvp-pilot-profiles.ps1 -RunDir ".production\pilot-runs\<sessao>" -Reviewer "time-comercial" -MinScore 1
```

Plano de outreach comercial para os clientes do piloto:
```powershell
.\scripts\prepare-mvp-pilot-outreach.ps1 -RunDir ".production\pilot-runs\<sessao>" -Owner "time-comercial"
```

Registro rapido de evidencias do piloto:
```powershell
.\scripts\record-mvp-pilot-evidence.ps1 `
  -RunDir ".production\pilot-runs\<sessao>" `
  -Cliente "Codexa LTDA" `
  -Cenario "Criacao de lead" `
  -Resultado PASS `
  -Evidencia "screenshot://piloto/codexa-lead.png" `
  -Responsavel "time-oncall"
```

Registro padronizado de cenarios funcionais (recomendado para cobertura):
```powershell
.\scripts\record-mvp-pilot-functional-result.ps1 `
  -RunDir ".production\pilot-runs\<sessao>" `
  -Cliente "Codexa LTDA" `
  -Cenario CriacaoLead `
  -Resultado PASS `
  -Evidencia "screenshot://piloto/codexa-lead.png" `
  -Responsavel "time-oncall"
```

Gerar planilha funcional da janela (5 cenarios x cliente):
```powershell
.\scripts\prepare-mvp-pilot-functional-sheet.ps1 -RunDir ".production\pilot-runs\<sessao>" -Force
```

Importar resultados preenchidos da planilha:
```powershell
.\scripts\import-mvp-pilot-functional-sheet.ps1 `
  -RunDir ".production\pilot-runs\<sessao>" `
  -SheetPath ".production\pilot-runs\<sessao>\functional-sheet.csv" `
  -SkipIfAlreadyRecorded

# Validacao final (falha se ainda existir linha pendente)
.\scripts\import-mvp-pilot-functional-sheet.ps1 `
  -RunDir ".production\pilot-runs\<sessao>" `
  -SheetPath ".production\pilot-runs\<sessao>\functional-sheet.csv" `
  -SkipIfAlreadyRecorded `
  -Strict
```

Ciclo tecnico automatizado do piloto (health + logs + smoke + evidencias):
```powershell
.\scripts\run-mvp-pilot-cycle.ps1 -RunDir ".production\pilot-runs\<sessao>"
```
Se executar com `-SkipCoreSmoke` ou `-SkipUiSmoke`, rode um ciclo completo depois antes do readiness final.

Execucao automatizada dos 5 cenarios funcionais por cliente (gera evidencias e coverage):
```powershell
.\scripts\run-mvp-pilot-functional-scenarios.ps1 `
  -RunDir ".production\pilot-runs\<sessao>" `
  -ProvisionMissingUsers
```
Quando backend/API estiver ligado a outro Postgres local, alinhe os parametros do DB da API:
```powershell
.\scripts\run-mvp-pilot-functional-scenarios.ps1 `
  -RunDir ".production\pilot-runs\<sessao>" `
  -DbContainerName conectsuite-postgres `
  -DbUser postgres `
  -DbName conectcrm `
  -ProvisionMissingUsers
```

Cobertura funcional por cliente (cenarios core do piloto):
```powershell
.\scripts\check-mvp-pilot-functional-coverage.ps1 -RunDir ".production\pilot-runs\<sessao>"
```

Relatorio de prontidao do piloto (blockers + decisao automatizada):
```powershell
.\scripts\assess-mvp-pilot-readiness.ps1 -RunDir ".production\pilot-runs\<sessao>" -BranchProtectionStatus Unknown
```
Por padrao, o readiness usa o ultimo `functional-coverage-*.md` para decidir cobertura funcional (`Auto`).

Exemplo de fechamento final (branch aplicada + cobertura concluida):
```powershell
.\scripts\assess-mvp-pilot-readiness.ps1 `
  -RunDir ".production\pilot-runs\<sessao>" `
  -BranchProtectionStatus Applied `
  -FunctionalCoverageStatus COVERAGE_OK
```

Opcoes uteis:
```powershell
# Sem isolamento E2E (diagnostico rapido)
.\scripts\preflight-mvp-go-live.ps1 -SkipIsolationE2E

# Sem lint budget (somente troubleshooting)
.\scripts\preflight-mvp-go-live.ps1 -SkipLintBudget
```

## Operacao diaria
```powershell
# logs
docker compose logs -f backend
docker compose logs -f frontend

# restart pontual
docker compose restart backend
docker compose restart frontend

# parar stack
docker compose down
```

## Observacao sobre AWS
AWS foi retirado do fluxo atual por decisao de escopo. Quando for retomado, a estrategia de deploy remoto pode ser adicionada novamente em um guia separado.

## Proximo passo sugerido
Status atual: GO liberado para comercializacao controlada.
Para rollout comercial por escopo reduzido, usar `.production/MVP_GO_LIVE_PLAN_2026-02-17.md`.
Para execucao da primeira onda comercial, usar `.production/MVP_ROLLOUT_WAVE1_2026-02-18.md`.
Registrar decisao operacional em `.production/MVP_GO_NO_GO_2026-02-17.md`.
Para piloto controlado com clientes, usar `.production/MVP_PILOT_CHECKLIST_2026-02-17.md`.
Ver execucao de kickoff em `.production/MVP_PILOT_KICKOFF_2026-02-17.md`.
Para fechamento rapido da sessao atual, seguir `.production/pilot-runs/20260217-174413-piloto-comercial-lote-1-full/next-actions-20260218-1054.md`.

## Branch protection (automatizado)
```powershell
# DryRun
.\scripts\configure-branch-protection.ps1 -DryRun

# Aplicar no repo novo (token necessario)
$env:GITHUB_TOKEN = "ghp_xxx"
.\scripts\configure-branch-protection.ps1 -Owner conectcrm -Repo conect380

# Aplicar apenas em main (quando develop ainda nao existe)
.\scripts\configure-branch-protection.ps1 -Owner conectcrm -Repo conect380 -Branches main
```

