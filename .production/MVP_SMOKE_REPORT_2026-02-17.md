# MVP Smoke Report

Data: 2026-02-17  
Ambiente: `localhost:5434` / `conectcrm_test`

## 1) Execucao consolidada
Comando:
```powershell
.\.production\scripts\smoke-mvp-core.ps1
```

Resultado:
- PASS `Smoke E2E: auth + leads + pipeline + produtos (multi-tenancy)`
- PASS `Smoke E2E: propostas (isolamento)`
- PASS `Smoke E2E: atendimento inbox/triagem`

Status final: `MVP smoke result: PASS`

Comando UI:
```powershell
.\.production\scripts\smoke-mvp-ui.ps1
```

Resultado UI:
- PASS `MVP UI Smoke › deve autenticar e carregar rotas core do MVP`
- Cobertura UI: `/dashboard`, `/leads`, `/pipeline`, `/propostas`, `/atendimento/inbox`

## 2) Cobertura do checklist de smoke MVP
- Login e contexto de empresa: coberto em `test/multi-tenancy.e2e-spec.ts` (autenticacao de Empresa 1 e Empresa 2).
- Criacao de lead: coberto em `test/multi-tenancy.e2e-spec.ts`.
- Movimentacao no pipeline (oportunidades/atividades): coberto em `test/multi-tenancy.e2e-spec.ts`.
- Criacao e consulta de proposta: coberto em `test/isolamento-multi-tenant.e2e-spec.ts`.
- Atendimento inbox (abertura de ticket, mensagens e status): coberto em `test/atendimento/triagem.e2e-spec.ts`.

## 3) Observacoes
- O smoke automatizado valida regras multi-tenant e fluxos core por API/E2E.
- Branch protection foi validada em `DryRun` com `configure-branch-protection.ps1`; aplicacao real depende de `GITHUB_TOKEN` com permissao admin.
