# GDN-506 - Daily smoke suite in production

- RunId: 20260307-211737
- Inicio: 2026-03-07 21:17:37
- Fim: 2026-03-07 21:17:39
- DuracaoSegundos: 2.5
- BaseUrl: http://localhost:3001
- DryRun: false
- Status: PASS

## Etapas
- [PASS] authenticate_admin :: base=http://localhost:3001
- [PASS] smoke_health :: url=http://localhost:3001/health status=200
- [PASS] smoke_guardian_overview :: base=http://localhost:3001 status=200
- [PASS] smoke_guardian_companies :: base=http://localhost:3001 status=200
- [PASS] smoke_guardian_billing_subscriptions :: base=http://localhost:3001 status=200
- [PASS] smoke_guardian_critical_audit :: base=http://localhost:3001 status=200
- [PASS] billing_suspend_reactivate_flow :: empresa_id=250cc3ac-617b-4d8b-be6e-b14901e4edde suspend_status=200 reactivate_status=200

## Resultado
- Suite diaria de smoke validada com sucesso.
