# OPP-305 - Homologacao API smoke

- RunId: 20260306-110142
- Inicio: 2026-03-06 11:01:42
- Fim: 2026-03-06 11:02:01
- BaseUrl: http://localhost:3001
- DryRun: false
- Total: 5
- PASS: 0
- FAIL: 5
- SKIPPED: 0

| ID | Etapa | Metodo | Status | Resultado | Duracao (s) |
| --- | --- | --- | ---: | --- | ---: |
| SMOKE-000 | Authenticate | POST | 0 | FAIL | 4.13 |
| SMOKE-001 | Health check | GET | 0 | FAIL | 4.09 |
| SMOKE-002 | Get stale policy | GET | 0 | FAIL | 4.09 |
| SMOKE-003 | List stale deals | GET | 0 | FAIL | 4.09 |
| SMOKE-004 | Run dry-run auto archive | POST | 401 | FAIL | 2.08 |

## Resultado

Smoke de API com falhas. Revisar etapas FAIL e permissoes do usuario/token.

## Observacoes de erro

- SMOKE-000: Impossível conectar-se ao servidor remoto
- SMOKE-001: Impossível conectar-se ao servidor remoto
- SMOKE-002: Impossível conectar-se ao servidor remoto
- SMOKE-003: Impossível conectar-se ao servidor remoto
- SMOKE-004: O servidor remoto retornou um erro: (401) Não Autorizado.
