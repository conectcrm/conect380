# MVP Go-Live Plan (Comercial)

Data base: 2026-02-17
Janela alvo de go-live: 2026-02-27

## 1) Escopo MVP fechado
Entram no MVP:
- Atendimento: inbox/chat, tickets, triagem e automacoes basicas.
- Comercial core: leads, pipeline (oportunidades), propostas e produtos.
- Multi-tenant: JWT + guardrails + RLS validado.

Ficam fora do MVP:
- Clientes/contatos/interacoes (escopo avancado).
- Financeiro, billing, faturamento e contratos.
- Cotacoes, combos e aprovacoes comerciais.

## 2) Gates tecnicos obrigatorios
Checklist de gate:
- Backend `type-check` e `build` em verde.
- Frontend `type-check` e `build` em verde com `REACT_APP_MVP_MODE=true`.
- `validate:multi-tenant` em verde.
- `apply:rls` + `validate:rls` com zero gaps.
- `test/atendimento/triagem.e2e-spec.ts` em verde.
- `test/isolamento-multi-tenant.e2e-spec.ts` em verde.
- `validate:lint-budget` em verde.

Comando unico:
```powershell
.\.production\scripts\preflight-mvp-go-live.ps1
```

## 3) Plano por dia
### Dia 1 (hoje)
- Ativar modo MVP no frontend (menu + bloqueio de rotas fora de escopo).
- Publicar checklist e fluxo de preflight MVP.
- Congelar escopo de release (somente P0/P1).

### Dia 2-3
- Corrigir drift de schema em ambiente de teste/homolog (ex.: `clientes.avatar_url`).
- Reexecutar migrations pendentes no banco alvo.
- Validar RLS completo nas tabelas com `empresa_id`.

### Dia 4-5
- Estabilizar E2E critico do MVP.
- Fechar regressao de lint budget.
- Rodar smoke manual ponta-a-ponta.

### Dia 6-7
- Piloto com clientes selecionados.
- Monitoramento intensivo e correcoes P0.
- Decisao Go/No-Go.

## 4) Smoke manual MVP
- Login e troca de contexto da empresa.
- Criacao de lead.
- Movimentacao no pipeline.
- Criacao e consulta de proposta.
- Atendimento inbox: abrir ticket, responder mensagem, atualizar status.

## 5) Decisao Go/No-Go
Go:
- Todos os gates tecnicos em verde.
- Smoke manual sem erro bloqueante.
- Branch protection e CI obrigatorios ativos.

No-Go:
- Qualquer falha em isolamento multi-tenant.
- Qualquer falha de RLS coverage.
- Qualquer falha em fluxo comercial core ou atendimento core.

## 6) Status de execucao (2026-02-17)
Gates tecnicos executados com sucesso:
- [x] Backend `type-check` e `build`.
- [x] Frontend `type-check` e `build` com `REACT_APP_MVP_MODE=true`.
- [x] `validate:multi-tenant`.
- [x] `apply:rls` + `validate:rls` (65 tabelas com `empresa_id`, 0 gaps).
- [x] `validate:lint-budget` (frontend warnings no limite do budget).
- [x] `test/atendimento/triagem.e2e-spec.ts`.
- [x] `test/isolamento-multi-tenant.e2e-spec.ts`.
- [x] `smoke-mvp-core.ps1` (auth + leads + pipeline + propostas + atendimento).
- [x] `smoke-mvp-ui.ps1` (login + dashboard + leads + pipeline + propostas + inbox).
- [x] `start-mvp-pilot.ps1` (sessao de piloto criada em `.production/pilot-runs/20260217-164422-piloto-comercial-lote-1`).
- [x] `run-mvp-pilot-cycle.ps1` (ciclo tecnico completo PASS em `.production/pilot-runs/20260217-174413-piloto-comercial-lote-1-full/cycles/20260217-175610`).
- [x] `run-mvp-pilot-cycle.ps1` (novo ciclo tecnico PASS em `.production/pilot-runs/20260217-174413-piloto-comercial-lote-1-full/cycles/20260217-203859`).
- [x] `run-mvp-pilot-cycle.ps1` (ciclo tecnico atualizado PASS em `.production/pilot-runs/20260217-174413-piloto-comercial-lote-1-full/cycles/20260217-205324`).
- [x] `run-mvp-pilot-cycle.ps1` (ciclo tecnico mais recente PASS em `.production/pilot-runs/20260217-174413-piloto-comercial-lote-1-full/cycles/20260218-080730`).
- [x] `assess-mvp-pilot-readiness.ps1` (GO_CONDICIONAL com blockers objetivos registrados em `.production/pilot-runs/20260217-174413-piloto-comercial-lote-1-full/readiness-*.md`).
- [x] `recommend-mvp-pilot-clients.ps1` atualizado para preencher lote 3/3 (SUGERIDO + REVISAR_CONTATO + REVISAR_PERFIL).
- [x] `configure-branch-protection.ps1 -DryRun` registrado na sessao piloto.
- [x] `git push origin main:develop` (branch `develop` criada no remoto).
- [x] `finalize-mvp-pilot-clients.ps1` aplicado (contatos + janela 48h preenchidos para os clientes da sessao).
- [x] `prepare-mvp-pilot-outreach.ps1` gerou `outreach.csv` para execucao comercial.
- [x] `review-mvp-pilot-profiles.ps1` executado (status de revisao de perfil resolvido).
- [x] `assess-mvp-pilot-readiness.ps1 -BranchProtectionStatus Applied -Simulation` em verde sem blockers e sem alertas.
- [x] `assess-mvp-pilot-readiness.ps1 -BranchProtectionStatus Applied` em simulacao retornou `GO` (sem blockers tecnicos).
- [x] `check-mvp-pilot-functional-coverage.ps1` executado (baseline de cobertura gerado para controle do roteiro por cliente).
- [x] `prepare-mvp-pilot-functional-sheet.ps1` executado (planilha `functional-sheet.csv` gerada para 3 clientes x 5 cenarios).
- [x] `import-mvp-pilot-functional-sheet.ps1 -DryRun` executado (importador validado sem linhas invalidas).

Pendencias para Go comercial:
- [ ] Confirmar branch protection e checks obrigatorios no repositorio de producao (token atual sem admin; aplicar com maintainer em `main` + `develop`).
- [ ] Executar janela do piloto com clientes selecionados e monitoramento intensivo continuo (usar a sessao criada e `MVP_PILOT_CHECKLIST_2026-02-17.md`).
- [ ] Reexecutar cobertura funcional ao final da janela com meta `MISSING=0`, `FAIL=0`, `BLOCKED=0`.

## 7) Atualizacao final (2026-02-18)
Fechamentos executados:
- [x] Branch protection confirmada em `main` e `develop`.
- [x] Janela piloto executada com evidencias completas.
- [x] Cobertura funcional final: `COVERAGE_OK` (`PASS=15`, `FAIL=0`, `BLOCKED=0`, `MISSING=0`).
- [x] `preflight-go-live.ps1` completo em PASS (com E2E).
- [x] `preflight-mvp-go-live.ps1` em PASS.
- [x] `smoke-mvp-core.ps1` em PASS.
- [x] `smoke-mvp-ui.ps1` em PASS.
- [x] Readiness final em GO: `readiness-20260218-094353-637.md`.

Status final para comercializacao:
- **GO** para rollout controlado do MVP comercial.
