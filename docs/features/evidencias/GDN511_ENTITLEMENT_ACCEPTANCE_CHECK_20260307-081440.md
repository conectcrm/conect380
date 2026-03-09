# GDN-511 - Final acceptance entitlement backend

- RunId: 20260307-081441
- Inicio: 2026-03-07 08:14:41
- Fim: 2026-03-07 08:14:51
- DuracaoSegundos: 10.17
- DryRun: false
- Status: PASS

## Checks
- [PASS] entitlement error code presente: NO_SUBSCRIPTION :: ok
- [PASS] entitlement error code presente: SUBSCRIPTION_INACTIVE :: ok
- [PASS] entitlement error code presente: MODULE_NOT_INCLUDED :: ok
- [PASS] entitlement error code presente: SUBSCRIPTION_CHECK_FAILED :: ok
- [PASS] suite de testes entitlement backend :: exitCode=0

## Evidencia da suite

```text
> conect-crm-backend@1.0.0 test
> jest modules/common/assinatura.middleware.spec.ts modules/planos/subscription-state-machine.spec.ts modules/planos/assinaturas.controller.spec.ts

PASS src/modules/planos/subscription-state-machine.spec.ts (7.458 s)
PASS src/modules/common/assinatura.middleware.spec.ts (7.963 s)
PASS src/modules/planos/assinaturas.controller.spec.ts (8.428 s)

Test Suites: 3 passed, 3 total
Tests:       9 passed, 9 total
Snapshots:   0 total
Time:        9.193 s
Ran all test suites matching /modules\\common\\assinatura.middleware.spec.ts|modules\\planos\\subscription-state-machine.spec.ts|modules\\planos\\assinaturas.controller.spec.ts/i.
```

## Resultado
- Aceite final de entitlement backend validado com sucesso.
