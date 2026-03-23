# OPP-305 - Relatorio de regressao de qualidade (stale policy)

- RunId: 20260306-091251
- Inicio: 2026-03-06 09:12:51
- Fim: 2026-03-06 09:13:56
- Total: 5
- PASS: 5
- FAIL: 0

| ID | Suite | Resultado | Duracao (s) | ExitCode |
| --- | --- | --- | ---: | ---: |
| OPP305-BE-001 | Backend regras stale/lifecycle | PASS | 9.09 | 0 |
| OPP305-BE-002 | Backend controller stale parse | PASS | 9.08 | 0 |
| OPP305-BE-003 | Backend type-check | PASS | 6.07 | 0 |
| OPP305-FE-001 | Frontend service stale contract | PASS | 3.04 | 0 |
| OPP305-FE-002 | Frontend type-check | PASS | 37.33 | 0 |

## Comandos executados

- OPP305-BE-001: cd C:\Projetos\conect360\backend && npm run test -- modules/oportunidades/oportunidades.stale-rules.spec.ts modules/oportunidades/oportunidades.stage-rules.spec.ts --runInBand
- OPP305-BE-002: cd C:\Projetos\conect360\backend && npm run test -- modules/oportunidades/oportunidades.controller.spec.ts --runInBand
- OPP305-BE-003: cd C:\Projetos\conect360\backend && npm run type-check
- OPP305-FE-001: cd C:\Projetos\conect360\frontend-web && npm test -- oportunidadesService.stale.test.ts --watch=false --runInBand
- OPP305-FE-002: cd C:\Projetos\conect360\frontend-web && npm run type-check

## Resultado

Regressao automatizada concluida sem falhas.
