# GDN-506 - Daily smoke suite in production

- RunId: 20260307-212827
- Inicio: 2026-03-07 21:28:27
- Fim: 2026-03-07 21:28:29
- DuracaoSegundos: 2.49
- BaseUrl: http://192.168.200.44:3001
- DryRun: false
- Status: PASS

## Etapas
- [PASS] authenticate_admin :: base=http://192.168.200.44:3001
- [PASS] smoke_health :: url=http://192.168.200.44:3001/health status=200
- [PASS] smoke_guardian_overview :: base=http://192.168.200.44:3001 status=200
- [PASS] smoke_guardian_companies :: base=http://192.168.200.44:3001 status=200
- [PASS] smoke_guardian_billing_subscriptions :: base=http://192.168.200.44:3001 status=200
- [PASS] smoke_guardian_critical_audit :: base=http://192.168.200.44:3001 status=200
- [PASS] billing_suspend_reactivate_flow :: empresa_id=250cc3ac-617b-4d8b-be6e-b14901e4edde suspend_status=200 reactivate_status=200

## Resultado
- Suite diaria de smoke validada com sucesso.
