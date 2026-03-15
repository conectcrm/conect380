# GDN-506 - Daily smoke suite in production

- RunId: 20260307-081437
- Inicio: 2026-03-07 08:14:37
- Fim: 2026-03-07 08:14:37
- DuracaoSegundos: 0.29
- BaseUrl: http://localhost:3001
- DryRun: false
- Status: FAIL

## Etapas
- [PASS] authenticate_admin :: base=http://localhost:3001
- [PASS] smoke_health :: url=http://localhost:3001/health status=200
- [FAIL] smoke_guardian_overview :: base=http://localhost:3001/api status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- [FAIL] smoke_guardian_companies :: base=http://localhost:3001/api status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- [FAIL] smoke_guardian_billing_subscriptions :: base=http://localhost:3001/api status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- [FAIL] smoke_guardian_critical_audit :: base=http://localhost:3001/api status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.

## Resultado
- Suite diaria de smoke com falhas. Revisar etapas acima.
