# ConectCRM Deploy Guide (Local Docker)

## Escopo
Este guia cobre deploy local em modo producao com Docker, sem uso de AWS.

## 1) Preparacao
```powershell
cd c:\Projetos\conectcrm\.production

# copiar env local
cp .env.production .env.production.local
# editar segredos e urls
```

Variaveis minimas:
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `DATABASE_NAME`
- `DATABASE_USERNAME`
- `FRONTEND_URL`

## 2) Build
```powershell
.\scripts\build-all.ps1
# opcional: .\scripts\build-all.ps1 -SkipTests
```

## 3) Subir stack
```powershell
docker compose up -d
docker compose ps
```

## 4) Health checks
```powershell
curl http://localhost:3500/health
curl http://localhost:3000
```

## 5) Validacoes de isolamento multi-tenant
No diretorio raiz do repositorio:
```powershell
# pacote completo de preflight
.\.production\scripts\preflight-go-live.ps1

# modo rapido (sem E2E)
.\.production\scripts\preflight-go-live.ps1 -SkipE2E
```

## 5.1) Validacoes do MVP comercial
Para release com escopo reduzido:
```powershell
$env:REACT_APP_MVP_MODE = "true"
.\.production\scripts\preflight-mvp-go-live.ps1

# smoke automatizado dos fluxos core do MVP
.\.production\scripts\smoke-mvp-core.ps1

# smoke UI do MVP (Playwright)
.\.production\scripts\smoke-mvp-ui.ps1

# kickoff da sessao de piloto (gera pacote de execucao e evidencias)
.\.production\scripts\start-mvp-pilot.ps1 -PilotName "piloto-comercial-lote-1" -SkipPreflight

# sugestao automatica de clientes piloto (com classificacao SUGERIDO/REVISAR_CONTATO/REVISAR_PERFIL)
.\.production\scripts\recommend-mvp-pilot-clients.ps1 -RunDir ".production\pilot-runs\<sessao>"

# finalizar contatos e janela de observacao do piloto (48h)
.\.production\scripts\finalize-mvp-pilot-clients.ps1 -RunDir ".production\pilot-runs\<sessao>" -WindowStart "2026-02-18 09:00" -WindowHours 48

# revisar clientes que ainda estiverem em REVISAR_PERFIL
.\.production\scripts\review-mvp-pilot-profiles.ps1 -RunDir ".production\pilot-runs\<sessao>" -Reviewer "time-comercial" -MinScore 1

# gerar plano de outreach comercial para os clientes selecionados
.\.production\scripts\prepare-mvp-pilot-outreach.ps1 -RunDir ".production\pilot-runs\<sessao>" -Owner "time-comercial"

# registro de evidencias durante a janela
.\.production\scripts\record-mvp-pilot-evidence.ps1 -RunDir ".production\pilot-runs\<sessao>" -Cliente "Cliente X" -Cenario "Criacao de lead" -Resultado PASS

# registro padronizado dos 5 cenarios funcionais
.\.production\scripts\record-mvp-pilot-functional-result.ps1 -RunDir ".production\pilot-runs\<sessao>" -Cliente "Cliente X" -Cenario CriacaoLead -Resultado PASS

# gerar planilha funcional da janela (5 cenarios x cliente)
.\.production\scripts\prepare-mvp-pilot-functional-sheet.ps1 -RunDir ".production\pilot-runs\<sessao>" -Force

# importar resultados preenchidos em lote
.\.production\scripts\import-mvp-pilot-functional-sheet.ps1 -RunDir ".production\pilot-runs\<sessao>" -SheetPath ".production\pilot-runs\<sessao>\functional-sheet.csv" -SkipIfAlreadyRecorded

# validacao final (falha se ainda houver linha pendente)
.\.production\scripts\import-mvp-pilot-functional-sheet.ps1 -RunDir ".production\pilot-runs\<sessao>" -SheetPath ".production\pilot-runs\<sessao>\functional-sheet.csv" -SkipIfAlreadyRecorded -Strict

# ciclo tecnico automatizado (monitoramento intensivo)
.\.production\scripts\run-mvp-pilot-cycle.ps1 -RunDir ".production\pilot-runs\<sessao>"
# se usar -SkipCoreSmoke/-SkipUiSmoke para diagnostico, rerodar sem skip antes do readiness final

# execucao automatizada dos cenarios funcionais (registra evidencias + roda coverage)
.\.production\scripts\run-mvp-pilot-functional-scenarios.ps1 -RunDir ".production\pilot-runs\<sessao>" -ProvisionMissingUsers
# quando API usa outro Postgres local, alinhar DB com parametros explicitos:
# .\.production\scripts\run-mvp-pilot-functional-scenarios.ps1 -RunDir ".production\pilot-runs\<sessao>" -DbContainerName conectsuite-postgres -DbUser postgres -DbName conectcrm -ProvisionMissingUsers

# cobertura funcional por cliente (fluxos core do piloto)
.\.production\scripts\check-mvp-pilot-functional-coverage.ps1 -RunDir ".production\pilot-runs\<sessao>"

# avaliacao objetiva de readiness do piloto
.\.production\scripts\assess-mvp-pilot-readiness.ps1 -RunDir ".production\pilot-runs\<sessao>" -BranchProtectionStatus Unknown
# por padrao, a cobertura funcional eh lida automaticamente do ultimo functional-coverage-*.md
```

## 6) Checklist de go-live
- [ ] Backend build OK
- [ ] Frontend build OK
- [ ] `validate:multi-tenant` OK
- [ ] `validate:rls` OK
- [ ] `validate:lint-budget` OK
- [ ] E2E principal OK
- [ ] `preflight-go-live.ps1` concluido sem falhas
- [ ] `preflight-mvp-go-live.ps1` concluido sem falhas (quando release for MVP)
- [ ] `smoke-mvp-core.ps1` concluido sem falhas (quando release for MVP)
- [ ] `smoke-mvp-ui.ps1` concluido sem falhas (quando release for MVP)
- [ ] `start-mvp-pilot.ps1` executado e pasta de sessao criada
- [ ] `recommend-mvp-pilot-clients.ps1` executado e `clients.csv` revisado
- [ ] `finalize-mvp-pilot-clients.ps1` executado com contato/janela preenchidos
- [ ] `review-mvp-pilot-profiles.ps1` executado para zerar pendencias de perfil
- [ ] `prepare-mvp-pilot-outreach.ps1` executado e `outreach.csv` publicado ao comercial
- [ ] `run-mvp-pilot-cycle.ps1` executado e `cycles/<timestamp>/summary.md` validado
- [ ] `record-mvp-pilot-functional-result.ps1` usado para registrar os 5 cenarios por cliente
- [ ] `prepare-mvp-pilot-functional-sheet.ps1` executado e planilha funcional distribuida
- [ ] `import-mvp-pilot-functional-sheet.ps1` executado apos preenchimento da planilha
- [ ] `run-mvp-pilot-functional-scenarios.ps1` executado (ou evidencias manuais equivalentes registradas)
- [ ] `check-mvp-pilot-functional-coverage.ps1` executado sem gaps (PASS em todos os cenarios por cliente)
- [ ] `assess-mvp-pilot-readiness.ps1` executado e relatorio sem blockers tecnicos
- [ ] Branch protection aplicada (`configure-branch-protection.ps1` ou UI)
- [ ] Health endpoint OK
- [ ] Login e fluxo critico testados manualmente

## 7) Operacao
```powershell
# logs
docker compose logs -f backend
docker compose logs -f frontend

# restart seletivo
docker compose restart backend
docker compose restart frontend
```

## 8) Rollback local
Opcao 1: reiniciar containers atuais
```powershell
docker compose restart backend frontend
```

Opcao 2: rebuild e subir novamente
```powershell
docker compose down
.\scripts\build-all.ps1
docker compose up -d
```

## 9) Troubleshooting rapido
- Backend nao sobe: validar `.env.production.local` e conexao do Postgres.
- Frontend sem API: conferir `REACT_APP_API_URL` no build.
- Falha multi-tenant: rodar `validate:multi-tenant` e corrigir arquivos listados.
- Falha RLS: reaplicar `apply:rls` e validar `validate:rls`.

## Nota
Fluxo AWS permanece desativado por escopo atual.

