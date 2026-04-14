# GDN-402 - Monitor billing and platform metrics

## Data
- 2026-03-07

## Objetivo
- Monitorar diariamente falhas de pagamento, latencia operacional e transicoes de status de assinatura no Guardian durante piloto.

## Implementacao
- Script de monitoramento publicado:
  - `scripts/monitor-guardian-billing-platform.ps1`
- Check de validacao em CI publicado:
  - `scripts/ci/guardian-billing-platform-monitor-check.ps1`

## Indicadores coletados por ciclo
- Plataforma:
  - status de `GET /health`
  - conectividade e latencia de banco via `GET /health/detailed`
  - latencia de endpoints Guardian (`overview`, `billing/subscriptions`, `audit/critical`)
- Billing:
  - distribuicao de assinaturas por `status_canonico` (`trial`, `active`, `past_due`, `suspended`, `canceled`)
  - indicador de falha de pagamento (`past_due + suspended`)
  - erros de operacao de billing via auditoria critica (`outcome=error`)
- Transicoes:
  - total diario de eventos `billing_subscription`
  - quantidades de `suspend/reactivate` com sucesso e erro

## Saidas geradas
- Timeline CSV por execucao:
  - `docs/features/evidencias/GDN402_GUARDIAN_MONITOR_<runId>.csv`
- Resumo consolidado:
  - `docs/features/evidencias/GDN402_GUARDIAN_MONITOR_<runId>.md`

## Comandos recomendados
- Dry-run tecnico:
  - `powershell -ExecutionPolicy Bypass -File scripts/monitor-guardian-billing-platform.ps1 -DryRun -MaxCycles 1`
- Janela diaria (exemplo):
  - `powershell -ExecutionPolicy Bypass -File scripts/monitor-guardian-billing-platform.ps1 -BaseUrl <url_backend> -Token <jwt_guardian> -IntervalSeconds 300 -DurationHours 24`
- Modo estrito (falhar ao detectar anomalia):
  - `powershell -ExecutionPolicy Bypass -File scripts/monitor-guardian-billing-platform.ps1 -BaseUrl <url_backend> -Token <jwt_guardian> -IntervalSeconds 300 -DurationHours 24 -FailOnAnomaly`

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-billing-platform-monitor-check.ps1`
- Resultado: PASS
