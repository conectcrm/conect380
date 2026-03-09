# GDN-503 - Legacy backoffice read-only freeze validation

- RunId: 20260308-165249
- Inicio: 2026-03-08 16:52:49
- Fim: 2026-03-08 16:52:56
- DuracaoSegundos: 7.15
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

PASS src/modules/admin/guards/legacy-admin-transition.guard.spec.ts (5.835 s)
  LegacyAdminTransitionGuard
    âˆš permite rotas admin no modo legacy (3 ms)
    âˆš permite rotas no modo dual e sinaliza header de transicao (1 ms)
    âˆš bloqueia rotas admin no modo guardian_only (15 ms)
    âˆš usa guardian_only como padrao quando variavel de modo nao estiver definida (1 ms)
    âˆš aplica rollout canary conforme percentual configurado (2 ms)
    âˆš bloqueia operacoes de escrita no legado quando read-only ativo (1 ms)
    âˆš permite leitura no legado quando read-only ativo e sinaliza header
    âˆš bloqueia escrita em canary quando request permanece no legado e read-only ativo (1 ms)
    âˆš bloqueia patch de plano legado no modo dual mesmo com legado habilitado (1 ms)
    âˆš bloqueia patch de plano legado no modo canary mesmo quando request ficaria no legado (1 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        6.09 s, estimated 8 s
Ran all test suites matching /modules\\admin\\guards\\legacy-admin-transition.guard.spec.ts/i.

## Resultado
- Freeze read-only do legado validado com sucesso.
