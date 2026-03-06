# OPP-305 - Homologacao API smoke

- RunId: 20260306-092536
- Inicio: 2026-03-06 09:25:36
- Fim: 2026-03-06 09:25:37
- BaseUrl: http://localhost:3001
- DryRun: false
- Total: 5
- PASS: 0
- FAIL: 5
- SKIPPED: 0

| ID | Etapa | Metodo | Status | Resultado | Duracao (s) |
| --- | --- | --- | ---: | --- | ---: |
| SMOKE-000 | Authenticate | POST | 401 | FAIL | 0.24 |
| SMOKE-001 | Health check | GET | 0 | FAIL | 0.03 |
| SMOKE-002 | Get stale policy | GET | 401 | FAIL | 0.01 |
| SMOKE-003 | List stale deals | GET | 401 | FAIL | 0 |
| SMOKE-004 | Run dry-run auto archive | POST | 401 | FAIL | 0 |

## Resultado

Smoke de API com falhas. Revisar etapas FAIL e permissoes do usuario/token.

## Observacoes de erro

- SMOKE-000: O servidor remoto retornou um erro: (401) Não Autorizado.
- SMOKE-001: Referência de objeto não definida para uma instância de um objeto.
- SMOKE-002: O servidor remoto retornou um erro: (401) Não Autorizado.
- SMOKE-003: O servidor remoto retornou um erro: (401) Não Autorizado.
- SMOKE-004: O servidor remoto retornou um erro: (401) Não Autorizado.
