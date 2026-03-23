# Relatorio consolidado - Homologacao Fluxo Vendas -> Financeiro

- RunId: 20260305-082317
- Inicio: 2026-03-05 08:23:17
- Fim: 2026-03-05 08:23:19
- Ambiente base: http://localhost:3001
- EmpresaId: 250cc3ac-617b-4d8b-be6e-b14901e4edde
- DryRun: false
- Total steps: 1
- PASS: 1
- FAIL: 0
- SKIPPED: 0

| ID | Etapa | Resultado | Duracao (s) | ExitCode | Evidencia |
| --- | --- | --- | ---: | ---: | --- |
| HOMO-001 | AP-301 webhook homologacao assistida | PASS | 2.04 | 0 | docs\features\evidencias\AP301_HOMOLOGACAO_ASSISTIDA_20260305-082317.md |

## Comandos executados

- HOMO-001: powershell.exe -ExecutionPolicy Bypass -File C:\Projetos\conect360\scripts\test-ap301-webhook-homologacao.ps1 -EmpresaId 250cc3ac-617b-4d8b-be6e-b14901e4edde -WebhookSecret *** -ReferenciaGatewayAprovado GW-TXN-1771286584944 -Gateway mercado_pago -BaseUrl http://localhost:3001 -OutputFile C:\Projetos\conect360\docs\features\evidencias\AP301_HOMOLOGACAO_ASSISTIDA_20260305-082317.md -ReferenciaGatewayRejeitado GW-TXN-1771012054958 -ColetarEvidenciasSql -PostgresContainer conectsuite-postgres -PostgresUser postgres -PostgresDatabase conectcrm

## Resultado final

Homologacao automatizada concluida sem falhas nas etapas executadas.
