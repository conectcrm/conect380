# OPP-305 - Homologacao API smoke

- RunId: 20260306-110229
- Inicio: 2026-03-06 11:02:29
- Fim: 2026-03-06 11:02:29
- BaseUrl: http://localhost:3001
- DryRun: false
- Total: 5
- PASS: 5
- FAIL: 0
- SKIPPED: 0

| ID | Etapa | Metodo | Status | Resultado | Duracao (s) |
| --- | --- | --- | ---: | --- | ---: |
| SMOKE-000 | Authenticate | POST | 201 | PASS | 0.17 |
| SMOKE-001 | Health check | GET | 200 | PASS | 0.02 |
| SMOKE-002 | Get stale policy | GET | 200 | PASS | 0.03 |
| SMOKE-003 | List stale deals | GET | 200 | PASS | 0.07 |
| SMOKE-004 | Run dry-run auto archive | POST | 201 | PASS | 0.03 |

## Resultado

Smoke de API concluido sem falhas.

## Observacoes de erro

- Nenhum erro registrado.
