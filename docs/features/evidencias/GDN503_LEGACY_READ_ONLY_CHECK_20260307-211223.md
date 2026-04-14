# GDN-503 - Legacy backoffice read-only freeze validation

- RunId: 20260307-211224
- Inicio: 2026-03-07 21:12:24
- Fim: 2026-03-07 21:12:32
- DuracaoSegundos: 8.15
- DryRun: false
- Status: PASS

## Checklist de validacao
- [PASS] guard usa flag GUARDIAN_LEGACY_READ_ONLY
- [PASS] guard retorna codigo LEGACY_ADMIN_READ_ONLY
- [PASS] guard sinaliza header read-only
- [PASS] spec cobre MethodNotAllowedException
- [PASS] spec cobre cenarios read-only
- [PASS] env example declara GUARDIAN_LEGACY_READ_ONLY

## Evidencias de execucao

### Comando
npm --prefix backend run test -- modules/admin/guards/legacy-admin-transition.guard.spec.ts

### Saida resumida
> conect-crm-backend@1.0.0 test
> jest modules/admin/guards/legacy-admin-transition.guard.spec.ts

PASS src/modules/admin/guards/legacy-admin-transition.guard.spec.ts (5.984 s)
  LegacyAdminTransitionGuard
    âˆš permite rotas admin no modo legacy (3 ms)
    âˆš permite rotas no modo dual e sinaliza header de transicao (1 ms)
    âˆš bloqueia rotas admin no modo guardian_only (11 ms)
    âˆš aplica rollout canary conforme percentual configurado (1 ms)
    âˆš bloqueia operacoes de escrita no legado quando read-only ativo (5 ms)
    âˆš permite leitura no legado quando read-only ativo e sinaliza header
    âˆš bloqueia escrita em canary quando request permanece no legado e read-only ativo (1 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        6.236 s, estimated 8 s
Ran all test suites matching /modules\\admin\\guards\\legacy-admin-transition.guard.spec.ts/i.

## Resultado
- Freeze read-only do legado validado com sucesso.
