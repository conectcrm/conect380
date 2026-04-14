# GDN-208 - Immutable audit for critical actions

## Data
- 2026-03-07

## Objetivo
- Registrar trilha de auditoria imutavel para acoes criticas do namespace `guardian/*`, com actor, target, ip, timestamp e payload before/after.

## Mudancas implementadas
- Novo modelo de auditoria critica:
  - entity: `backend/src/modules/guardian/entities/guardian-critical-audit.entity.ts`
  - tabela: `guardian_critical_audits`
- Persistencia append-only:
  - service: `backend/src/modules/guardian/services/guardian-critical-audit.service.ts`
  - gravacao via `insert` (sem update)
  - sanitizacao e redacao de campos sensiveis (`token`, `password`, `cookie`, etc.)
- Captura automatica das acoes criticas:
  - interceptor: `backend/src/modules/guardian/interceptors/guardian-critical-audit.interceptor.ts`
  - aplicado em:
    - `GuardianEmpresasController`
    - `GuardianBffController`
  - coleta:
    - actor (`actorUserId`, role, email)
    - target (`targetType`, `targetId`)
    - contexto (`requestIp`, `userAgent`, `requestId`, route/method/status)
    - payloads (`beforePayload`, `afterPayload`, `errorMessage`)
  - escopo:
    - somente metodos mutaveis (`POST`, `PUT`, `PATCH`, `DELETE`)
- Imutabilidade em banco:
  - migration: `1808106000000-CreateGuardianCriticalAudits.ts`
  - trigger `trg_guardian_critical_audits_immutable` bloqueia `UPDATE` e `DELETE`.
- Integracao de modulo:
  - `GuardianModule` atualizado com `TypeOrmModule.forFeature([GuardianCriticalAudit])`, service e interceptor.
  - `DatabaseConfig` atualizado para carregar a entity.

## Validacao executada
- Testes:
  - `guardian-critical-audit.interceptor.spec.ts`
  - `guardian-empresas.controller.spec.ts`
  - `guardian-bff.controller.spec.ts`
  - `guardian.controller.spec.ts`
  - `guardian-mfa.guard.spec.ts`
  - `assinatura.middleware.spec.ts`
- Build backend:
  - `npm --prefix backend run build`

