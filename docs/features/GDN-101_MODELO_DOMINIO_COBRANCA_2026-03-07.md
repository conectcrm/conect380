# GDN-101 - Modelo de dominio de cobranca (2026-03-07)

## Objetivo

Entregar modelo canonico de cobranca sem quebrar estruturas ja usadas no produto.

## Estrategia aplicada

1. Reuso das tabelas atuais:
   - `assinaturas_empresas` (subscriptions)
   - `faturas` (invoices)
   - `pagamentos` (payments)
2. Exposicao canonica via views:
   - `billing_subscriptions`
   - `billing_invoices`
   - `billing_payments`
3. Criacao de ledger de eventos:
   - `billing_events`

## Entregas tecnicas

1. Migration:
   - `backend/src/migrations/1808101000000-CreateBillingDomainModelCompat.ts`
2. Entidade de eventos:
   - `backend/src/modules/faturamento/entities/billing-event.entity.ts`
3. Registro da entidade no TypeORM:
   - `backend/src/config/database.config.ts`

## Beneficios da abordagem

1. Evita duplicar dados financeiros.
2. Cria nomenclatura canonica para Guardian e integrações.
3. Permite evolucao incremental para maquina de estados de assinatura.

## Escopo desta entrega

1. Modelo de dados e estrutura de persistencia.
2. Nao inclui ainda workflow de transicao de estados (GDN-102+).
3. Nao inclui integracao de pagamento adicional (GDN-103+).
