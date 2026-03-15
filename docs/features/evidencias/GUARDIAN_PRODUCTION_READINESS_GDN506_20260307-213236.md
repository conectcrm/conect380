# GDN-506 - Daily smoke suite in production

- RunId: 20260307-213236
- Inicio: 2026-03-07 21:32:36
- Fim: 2026-03-07 21:32:38
- DuracaoSegundos: 1.82
- BaseUrl: http://192.168.200.44:3000
- DryRun: false
- Status: FAIL

## Etapas
- [PASS] authenticate_admin :: base=http://192.168.200.44:3000
- [FAIL] smoke_health :: url=http://192.168.200.44:3000/api/api/health status=404 erro=O servidor remoto retornou um erro: (404) Não Localizado.
- [PASS] smoke_guardian_overview :: base=http://192.168.200.44:3000/api status=200
- [PASS] smoke_guardian_companies :: base=http://192.168.200.44:3000/api status=200
- [PASS] smoke_guardian_billing_subscriptions :: base=http://192.168.200.44:3000/api status=200
- [PASS] smoke_guardian_critical_audit :: base=http://192.168.200.44:3000/api status=200
- [PASS] billing_suspend_reactivate_flow :: empresa_id=250cc3ac-617b-4d8b-be6e-b14901e4edde suspend_status=200 reactivate_status=200

## Resultado
- Suite diaria de smoke com falhas. Revisar etapas acima.
