# AP-301 - Homologacao assistida de webhook (2026-03)

## 1. Objetivo

Padronizar a execucao dos cenarios C1..C5 do AP-301 com script reutilizavel e saida de evidencia.

Script:

- `scripts/test-ap301-webhook-homologacao.ps1`

## 2. Pre-condicoes

1. Backend alvo acessivel (ex.: `http://localhost:3001` ou URL de homologacao).
2. Configuracao ativa do gateway para a empresa alvo com `webhookSecret`.
3. `referenciaGateway` vinculada a pagamento real para os cenarios de aprovacao/rejeicao.

## 3. Parametros do script

- `EmpresaId` (obrigatorio)
- `WebhookSecret` (obrigatorio)
- `ReferenciaGatewayAprovado` (obrigatorio)
- `ReferenciaGatewayRejeitado` (opcional, default igual ao aprovado)
- `Gateway` (opcional: `mercado_pago|stripe|pagseguro`, default `pagseguro`)
- `BaseUrl` (opcional, default `http://localhost:3001`)
- `OutputFile` (opcional, caminho para salvar evidencia em markdown)
- `ColetarEvidenciasSql` (opcional, switch; coleta SQL automatica via Docker/psql)
- `PostgresContainer` (opcional; se vazio, tenta detectar automaticamente)
- `PostgresUser` (opcional, default `postgres`)
- `PostgresDatabase` (opcional, default `conectcrm`)

## 4. Execucao exemplo

```powershell
powershell -File scripts/test-ap301-webhook-homologacao.ps1 `
  -EmpresaId "11111111-1111-1111-1111-111111111111" `
  -WebhookSecret "whsec_hml_123" `
  -ReferenciaGatewayAprovado "gw-ref-aprovado-001" `
  -ReferenciaGatewayRejeitado "gw-ref-rejeitado-001" `
  -Gateway "pagseguro" `
  -BaseUrl "http://localhost:3001" `
  -ColetarEvidenciasSql `
  -PostgresContainer "conectsuite-postgres" `
  -PostgresUser "postgres" `
  -PostgresDatabase "conectcrm" `
  -OutputFile "docs/features/evidencias/AP301_HOMOLOGACAO_RESULTADO.md"
```

## 5. O que o script valida

1. C1 - evento valido aprovado (`200`, `duplicate=false`).
2. C2 - reenvio do mesmo evento (`200`, `duplicate=true`).
3. C3 - assinatura invalida (`401`).
4. C4 - evento de rejeicao (`200`, `duplicate=false`).
5. C5 - falha controlada com payload sem referencia (`500`).

## 6. Pos-validacao obrigatoria (SQL)

```sql
-- Eventos recebidos
select id, gateway, idempotency_key, event_id, status, referencia_gateway, erro, processado_em, created_at
from webhooks_gateway_eventos
where empresa_id = :empresaId
order by created_at desc;

-- Transacao de gateway
select id, referencia_gateway, status, tipo_operacao, origem, processado_em, updated_at
from transacoes_gateway_pagamento
where empresa_id = :empresaId and referencia_gateway in (:referenciaAprovado, :referenciaRejeitado);

-- Pagamento vinculado
select id, gateway_transacao_id, status, motivo_rejeicao, data_processamento, data_aprovacao, updated_at
from pagamentos
where empresa_id = :empresaId and gateway_transacao_id in (:referenciaAprovado, :referenciaRejeitado);
```

## 7. Observacoes

1. O script nao cria pagamento/fatura; usa referencias ja provisionadas no ambiente.
2. Para fechar AP-301 (14.2.3), anexar:
   - saida do script;
   - evidencias SQL (manuais ou automaticas via `-ColetarEvidenciasSql`);
   - logs da API com `eventId/idempotencyKey`.

## 8. Orquestracao integrada (opcional)

Para executar AP-301 junto com a regressao Vendas -> Financeiro e gerar relatorio consolidado:

- Script: `scripts/test-homologacao-fluxo-vendas-financeiro.ps1`
- Template de conclusao: `docs/features/RELATORIO_HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_2026-03_TEMPLATE.md`

Exemplo (sandbox/real):

```powershell
powershell -File scripts/test-homologacao-fluxo-vendas-financeiro.ps1 `
  -EmpresaId "11111111-1111-1111-1111-111111111111" `
  -WebhookSecret "whsec_hml_123" `
  -ReferenciaGatewayAprovado "gw-ref-aprovado-001" `
  -ReferenciaGatewayRejeitado "gw-ref-rejeitado-001" `
  -Gateway "pagseguro" `
  -BaseUrl "https://hml-api.exemplo.com" `
  -ColetarEvidenciasSql `
  -PostgresContainer "conectsuite-postgres" `
  -OutputDir "docs/features/evidencias"
```
