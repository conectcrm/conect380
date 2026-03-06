# OPP-305 - Homologacao API smoke

- RunId: 20260306-092644
- Inicio: 2026-03-06 09:26:44
- Fim: 2026-03-06 09:26:44
- BaseUrl: http://localhost:3001
- DryRun: false
- Total: 5
- PASS: 1
- FAIL: 4
- SKIPPED: 0

| ID | Etapa | Metodo | Status | Resultado | Duracao (s) |
| --- | --- | --- | ---: | --- | ---: |
| SMOKE-000 | Authenticate | POST | 401 | FAIL | 0.1 |
| SMOKE-001 | Health check | GET | 200 | PASS | 0.06 |
| SMOKE-002 | Get stale policy | GET | 401 | FAIL | 0 |
| SMOKE-003 | List stale deals | GET | 401 | FAIL | 0 |
| SMOKE-004 | Run dry-run auto archive | POST | 401 | FAIL | 0 |

## Resultado

Smoke de API com falhas. Revisar etapas FAIL e permissoes do usuario/token.

## Observacoes de erro

- SMOKE-000: O servidor remoto retornou um erro: (401) Não Autorizado.
- SMOKE-002: O servidor remoto retornou um erro: (401) Não Autorizado.
- SMOKE-003: O servidor remoto retornou um erro: (401) Não Autorizado.
- SMOKE-004: O servidor remoto retornou um erro: (401) Não Autorizado.
