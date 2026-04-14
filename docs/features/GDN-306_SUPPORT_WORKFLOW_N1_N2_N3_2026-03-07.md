# GDN-306 - Define support workflow N1 N2 N3

## Data
- 2026-03-07

## Objetivo
- Publicar fluxo operacional Guardian com ownership, criterios de escalacao e trilha de comunicacao para suporte N1/N2/N3.

## Escopo operacional
- Cobertura:
  - `guardian-web` (painel de governanca)
  - Backend `guardian/*` (BFF, empresas, billing, auditoria)
  - Jobs e reconciliacao de assinatura
- Fora de escopo:
  - Funcionalidades de cliente final que nao passam por Guardian

## Modelo de atendimento
- N1 (Suporte):
  - Recebe chamado e classifica severidade.
  - Coleta evidencias minimas: empresa, usuario, horario, endpoint, request id.
  - Executa checagens guiadas em dashboard e runbook.
  - Resolve casos de operacao basica sem alteracao estrutural.
- N2 (Operacoes):
  - Assume incidentes sem resolucao em N1 ou com impacto moderado.
  - Executa validacoes de integridade de assinatura, reconciliacao e flags de transicao.
  - Decide rollback operacional de flag (`dual` ou `legacy`) quando necessario.
- N3 (Engenharia):
  - Atua em bug, degradacao critica, falha de seguranca ou necessidade de hotfix.
  - Corrige backend/frontend, valida teste regressivo e publica acao corretiva.
  - Fecha RCA e plano de prevencao.

## Severidade e SLA
- P1 (indisponibilidade critica Guardian ou risco de governanca): N1 triagem imediata, N2 em ate 10 min, N3 em ate 20 min.
- P2 (falha relevante sem indisponibilidade total): N1 em ate 15 min, N2 em ate 30 min, N3 em ate 2 h.
- P3 (defeito baixo impacto ou melhoria): tratativa em backlog com monitoramento diario.

## Escalacao
- Fluxo padrao:
  - N1 abre incidente e notifica N2.
  - N2 avalia mitigacao imediata e aciona N3 se necessario.
  - N3 aplica fix e devolve para N2 validar.
  - N1 comunica encerramento ao solicitante.
- Regra de transicao legado:
  - Se incidente afetar admin legado durante rollout, N2 pode reduzir canary ou voltar para `dual/legacy`.
  - Retorno para `guardian_only` somente apos validacao de estabilidade.

## Evidencias obrigatorias por chamado
- Severidade, timeline e responsavel por etapa.
- Endpoint/acao afetada (ex.: `guardian/bff/billing/subscriptions`).
- Resultado das validacoes tecnicas e acao tomada.
- Status final: resolvido, mitigado ou escalado para backlog.

## Resultado
- Runbook N1/N2/N3 publicado e pronto para uso nos itens de piloto/producao (`GDN-404` e `GDN-405`).
