# GDN-407 - Validation webhook replay recovery test

## Data
- 2026-03-07

## Objetivo
- Validar recuperacao por replay de webhook e consistencia de dados em cenarios de duplicidade/reconciliacao.

## Implementacao
- Harness de validacao publicado:
  - `scripts/test-guardian-webhook-replay-recovery.ps1`
- Check CI publicado:
  - `scripts/ci/guardian-webhook-replay-recovery-check.ps1`

## Escopo coberto
- idempotencia de evento duplicado no webhook
- reconciliacao por lote de pagamentos recebidos
- consistencia de transicoes de assinatura em indisponibilidade temporaria do gateway

## Validacao executada
- `powershell -ExecutionPolicy Bypass -File scripts/ci/guardian-webhook-replay-recovery-check.ps1`
- Resultado: PASS
