# GDN-406 - Light peak load validation

- RunId: 20260308-165126
- Inicio: 2026-03-08 16:51:26
- Fim: 2026-03-08 16:51:26
- BaseUrl: http://localhost:3001
- DryRun: true
- Iterations: 3
- IntervalMs: 1
- CSV: C:\Projetos\conect360\docs\features\evidencias\GDN406_LIGHT_LOAD_DRYRUN_20260308-165125.csv

## Resultado por endpoint

| Endpoint | Total | PASS | FAIL | Error % | Avg ms | P95 ms | Max ms | Limite P95 ms |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| health | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 800 |
| guardian-overview | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 1500 |
| guardian-billing-subscriptions | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 1800 |
| guardian-audit-critical | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 2000 |

## Anomalias

- Nenhuma anomalia detectada pelos limites configurados.
