# GDN-107 - Entitlement backend (2026-03-07)

## Objetivo

Aplicar bloqueio de plano/modulo no backend para rotas sensiveis e remover bypass em caso de falha interna.

## Implementacao

1. Hardening no middleware de assinatura:
   - arquivo: `backend/src/modules/common/assinatura.middleware.ts`
   - mudou de fail-open para fail-closed:
     - antes: erro interno fazia `next()` e seguia sem validar entitlement;
     - agora: retorna `503` com `SUBSCRIPTION_CHECK_FAILED`.

2. Cobertura de rotas sensiveis:
   - adicionada resolucao de modulo por prefixo para grupos:
     - `CRM`, `ATENDIMENTO`, `VENDAS`, `FINANCEIRO`, `ADMINISTRACAO`, `DASHBOARD`, `IA`;
   - suporte a rotas com e sem prefixo `/api`.

3. Normalizacao de codigos de modulo:
   - comparacao agora usa codigos normalizados (ex.: `financeiro`, `FINANCEIRO`, `financeiro-pagamentos`);
   - aceita aliases por dominio para reduzir falso negativo de naming legado.

4. Enriquecimento do contexto de assinatura:
   - middleware continua populando `req.subscription` com status, limites e uso para observabilidade/app.

## Evidencias de teste

Arquivo:
- `backend/src/modules/common/assinatura.middleware.spec.ts`

Cenarios cobertos:
1. permite acesso quando modulo exigido esta incluido;
2. bloqueia acesso sensivel quando modulo nao esta no plano;
3. falha fechado (`503`) quando ocorre erro interno de validacao.
