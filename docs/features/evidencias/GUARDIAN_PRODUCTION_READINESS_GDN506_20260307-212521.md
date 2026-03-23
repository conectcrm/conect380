# GDN-506 - Daily smoke suite in production

- RunId: 20260307-212522
- Inicio: 2026-03-07 21:25:22
- Fim: 2026-03-07 21:25:23
- DuracaoSegundos: 1.49
- BaseUrl: http://192.168.200.44:3000
- DryRun: false
- Status: FAIL

## Etapas
- [PASS] authenticate_admin :: base=http://192.168.200.44:3000
- [FAIL] smoke_health :: url=http://192.168.200.44:3000/api/api/health status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- [FAIL] smoke_guardian_overview :: base=http://192.168.200.44:3000/api status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- [FAIL] smoke_guardian_companies :: base=http://192.168.200.44:3000/api status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- [FAIL] smoke_guardian_billing_subscriptions :: base=http://192.168.200.44:3000/api status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- [FAIL] smoke_guardian_critical_audit :: base=http://192.168.200.44:3000/api status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.

## Resultado
- Suite diaria de smoke com falhas. Revisar etapas acima.
