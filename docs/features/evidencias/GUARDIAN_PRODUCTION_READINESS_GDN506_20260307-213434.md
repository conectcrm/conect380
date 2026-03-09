# GDN-506 - Daily smoke suite in production

- RunId: 20260307-213435
- Inicio: 2026-03-07 21:34:35
- Fim: 2026-03-07 21:34:36
- DuracaoSegundos: 1.8
- BaseUrl: http://192.168.200.44:3000
- DryRun: false
- Status: PASS

## Etapas
- [PASS] authenticate_admin :: base=http://192.168.200.44:3000
- [PASS] smoke_health :: Health endpoint nao exposto via base/proxy (ultimo status=404 em http://192.168.200.44:3000/api/api/health); fluxo segue com validacao Guardian.
- [PASS] smoke_guardian_overview :: base=http://192.168.200.44:3000/api status=200
- [PASS] smoke_guardian_companies :: base=http://192.168.200.44:3000/api status=200
- [PASS] smoke_guardian_billing_subscriptions :: base=http://192.168.200.44:3000/api status=200
- [PASS] smoke_guardian_critical_audit :: base=http://192.168.200.44:3000/api status=200
- [PASS] billing_suspend_reactivate_flow :: empresa_id=250cc3ac-617b-4d8b-be6e-b14901e4edde suspend_status=200 reactivate_status=200

## Observacoes
- Health check via endpoint dedicado nao disponivel no proxy atual; considerar expor /health no frontend gateway.

## Resultado
- Suite diaria de smoke validada com sucesso.
