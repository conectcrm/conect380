# GDN-408 - Alert observability validation

- RunId: 20260309-101347
- DryRun: true
- InputCsv: (synthetic/default)
- PaymentFailureThreshold: 3
- LatencyThresholdMs: 1500
- Status: PASS
- GeneratedAt: 2026-03-09 10:13:47

## Snapshot avaliado

| cycle_result | app_health_status | guardian_avg_latency_ms | payment_failure_indicators | daily_billing_audit_errors | failed_requests |
| --- | --- | ---: | ---: | ---: | ---: |
| PARTIAL | degraded | 2100 | 5 | 2 | 1 |

## Alertas acionados

- TotalAlertsTriggered: 5

| Code | Severity | Routing | Description |
| --- | --- | --- | --- |
| guardian_health_unavailable | P0 | N1,N2,N3 | Health status 'degraded' |
| guardian_partial_cycle | P2 | N1,N2 | cycle_result=PARTIAL failed_requests=1 |
| guardian_latency_high | P2 | N1,N2 | avg_latency_ms=2100 threshold_ms=1500 |
| guardian_payment_failure_indicator_high | P1 | N1,N2 | payment_failure_indicators=5 threshold=3 |
| guardian_billing_audit_errors | P1 | N1,N2,N3 | daily_billing_audit_errors=2 |
