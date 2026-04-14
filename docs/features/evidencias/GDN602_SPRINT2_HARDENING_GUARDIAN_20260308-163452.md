# GDN-602 - Evidencia Sprint 2 (Hardening Guardian)

## Data
- 2026-03-08

## Contexto
- Objetivo da etapa: reforcar isolamento de operacoes administrativas no namespace Guardian e tornar a validacao de seguranca um gate automatico no CI.

## Entregas aplicadas
- `backend/test/guardian/guardian-unauthorized-access.e2e-spec.ts`
  - Corrigido bootstrap E2E com mock de `AssinaturaDueDateSchedulerService`.
- `backend/test/guardian/guardian-permission-action-matrix.e2e-spec.ts`
  - Corrigido bootstrap E2E com mock de `AssinaturaDueDateSchedulerService`.
- `backend/test/guardian/guardian-admin-operations-suite.e2e-spec.ts`
  - Corrigido bootstrap E2E com mock de `AssinaturaDueDateSchedulerService`.
  - Adicionada validacao do endpoint critico:
    - `POST /guardian/bff/billing/subscriptions/jobs/due-date-cycle`
  - Assertiva de execucao do scheduler (`runDueDateStatusCycle`) incluida.
- `backend/package.json`
  - Novo script de gate de hardening:
    - `test:e2e:guardian:hardening`
- `.github/workflows/ci.yml`
  - Novo job `backend-e2e-guardian-hardening` com paths-filter dedicado.
  - Job integrado ao `final-status` como gate obrigatorio.

## Logica de validacao executada
- `npm --prefix backend run test:e2e -- ./guardian/guardian-unauthorized-access.e2e-spec.ts ./guardian/guardian-permission-action-matrix.e2e-spec.ts ./guardian/guardian-admin-operations-suite.e2e-spec.ts`: PASS (11 testes)
- `npm --prefix backend run test:e2e:guardian:hardening`: PASS (11 testes)
- `npm --prefix backend run type-check`: PASS

## Cobertura da regra de Sprint 2
- [x] Validacao 401/403 por perfil e endpoint guardian
- [x] Validacao de operacao critica administrativa no namespace guardian
- [x] Gate automatizado em CI para hardening guardian

## Gate local
- Sprint 2 (hardening backend guardian): PASS
- Proximo passo recomendado: executar a suite completa de hardening com banco (`guardian-mfa-session` e `guardian-backend-bypass`) em job CI com PostgreSQL para cobrir MFA de ponta a ponta e tentativa de bypass em AppModule real.
