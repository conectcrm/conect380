# Relatorio consolidado - Homologacao Fluxo Vendas -> Financeiro

- RunId: 20260305-082014
- Inicio: 2026-03-05 08:20:14
- Fim: 2026-03-05 08:20:14
- Ambiente base: http://localhost:3001
- EmpresaId: -
- DryRun: true
- Total steps: 1
- PASS: 0
- FAIL: 0
- SKIPPED: 1

| ID | Etapa | Resultado | Duracao (s) | ExitCode | Evidencia |
| --- | --- | --- | ---: | ---: | --- |
| HOMO-001 | AP-301 webhook homologacao assistida | SKIPPED | 0 | 0 | docs\features\evidencias\AP301_HOMOLOGACAO_ASSISTIDA_20260305-082014.md |

## Comandos executados

- HOMO-001: powershell.exe -ExecutionPolicy Bypass -File C:\Projetos\conect360\scripts\test-ap301-webhook-homologacao.ps1 -EmpresaId  -WebhookSecret *** -ReferenciaGatewayAprovado  -Gateway pagseguro -BaseUrl http://localhost:3001 -OutputFile C:\Projetos\conect360\docs\features\evidencias\AP301_HOMOLOGACAO_ASSISTIDA_20260305-082014.md

## Resultado final

Pacote de homologacao pronto para execucao real em sandbox/real.
