# GDN-405 - Exercicios praticos Guardian

## Data
- 2026-03-07

## Objetivo
- Validar capacidade operacional de N1/N2/N3 em cenarios reais simulados.

## Exercicio 1 - Falha de billing
- Cenario:
  - aumento de assinaturas `past_due` e falha em acao de reativacao.
- Execucao esperada:
  - N1 abre incidente com evidencias.
  - N2 roda monitor billing/plataforma e classifica severidade.
  - N3 avalia causa tecnica e orienta correcao/mitigacao.
- Evidencia:
  - relatorio de monitoramento + timeline do incidente.

## Exercicio 2 - Auditoria critica indisponivel
- Cenario:
  - consulta `audit/critical` falhando intermitente.
- Execucao esperada:
  - N1 interrompe operacao sensivel.
  - N2 executa mitigacao conforme runbook.
  - N3 valida restauracao e risco residual.
- Evidencia:
  - checklist de encerramento preenchido.

## Exercicio 3 - Rollback de transicao legado
- Cenario:
  - incidente durante modo `canary` com impacto operacional.
- Execucao esperada:
  - N2 executa rollback para `dual` e fallback para `legacy` se necessario.
  - N3 confirma estabilidade pos-rollback.
- Evidencia:
  - relatorio de drill com resultado PASS.

## Criterios de conclusao
- Incidente aberto e classificado corretamente.
- Escalacao realizada no tempo alvo.
- Mitigacao executada com evidencias.
- Encerramento com registro de acoes preventivas.
