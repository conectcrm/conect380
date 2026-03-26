# Go-live Mercado Pago (Conect360)

Este runbook fecha a ativacao de pagamentos externos no ambiente de producao.

## 1) Runtime env obrigatorio

No secret `CONTABO_RUNTIME_ENV_FILE` (usado no workflow de deploy), garantir:

```env
PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=mercado_pago
PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=...
MERCADO_PAGO_MOCK=false
REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=mercado_pago
REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false
```

## 2) Webhook no painel Mercado Pago

Configurar callback para:

`https://api.conect360.com/mercadopago/webhooks`

Recomendado:
- enviar eventos de pagamento (payment)
- manter assinatura/HMAC ativa
- usar o mesmo segredo em `MERCADO_PAGO_WEBHOOK_SECRET`

## 3) Deploy

Executar workflow:
- `Deploy Contabo Production`
- com `upload_runtime_env=true`

O workflow agora bloqueia deploy se:
- Mercado Pago estiver habilitado e faltar token/secret
- `MERCADO_PAGO_MOCK=true` em producao

## 4) Smoke pos-deploy

1. Abrir `Billing` com tenant nao proprietario.
2. Iniciar checkout de plano.
3. Confirmar que nao ocorre erro `503 Checkout Mercado Pago indisponivel`.
4. Realizar pagamento de teste no provedor.
5. Confirmar atualizacao de status no sistema apos webhook.

## 5) Diagnostico rapido

- Erro de checkout indisponivel:
  - validar `MERCADO_PAGO_ACCESS_TOKEN`
  - validar `PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS`
- Webhook rejeitado:
  - validar `MERCADO_PAGO_WEBHOOK_SECRET`
  - validar URL configurada no painel

## 6) Rollback operacional rapido

Se necessario, desabilitar gateway no runtime env e redeploy:

```env
PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=
REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=
```
