# OPP-305 - Homologacao API smoke

- RunId: 20260306-092754
- Inicio: 2026-03-06 09:27:54
- Fim: 2026-03-06 09:27:54
- BaseUrl: http://localhost:3001
- DryRun: false
- Total: 5
- PASS: 1
- FAIL: 4
- SKIPPED: 0

| ID | Etapa | Metodo | Status | Resultado | Duracao (s) |
| --- | --- | --- | ---: | --- | ---: |
| SMOKE-000 | Authenticate | POST | 0 | FAIL | 0 |
| SMOKE-001 | Health check | GET | 200 | PASS | 0.09 |
| SMOKE-002 | Get stale policy | GET | 401 | FAIL | 0.01 |
| SMOKE-003 | List stale deals | GET | 401 | FAIL | 0 |
| SMOKE-004 | Run dry-run auto archive | POST | 401 | FAIL | 0 |

## Resultado

Smoke de API com falhas. Revisar etapas FAIL e permissoes do usuario/token.

## Observacoes de erro

- SMOKE-000: Token nao informado. Use -Token ou informe -Email e -Senha para login automatico.
- SMOKE-002: O servidor remoto retornou um erro: (401) Não Autorizado.
- SMOKE-003: O servidor remoto retornou um erro: (401) Não Autorizado.
- SMOKE-004: O servidor remoto retornou um erro: (401) Não Autorizado.
