# GDN-001 - Matriz de Planos Guardian v1 (2026-03-07)

## Objetivo

Definir baseline unico de planos para uso comercial, billing e entitlement backend.

## Decisoes de nomenclatura (canonicas)

1. Plano canonico `STARTER` -> slug `starter`
2. Plano canonico `BUSINESS` -> slug `business`
3. Plano canonico `ENTERPRISE` -> slug `enterprise`
4. Alias aceitos temporariamente no backend:
   - `professional` e `pro` mapeiam para `business`

## Matriz comercial v1

| Plano | Preco mensal (BRL) | Usuarios | Clientes | Storage | API calls por dia | WhatsApp conexoes | Email envios por dia | White label | Suporte |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| STARTER | 99 | 3 | 1000 | 5 GB | 5000 | 1 | 100 | Nao | Email |
| BUSINESS | 299 | 10 | 10000 | 50 GB | 50000 | 5 | 1000 | Parcial | Prioritario |
| ENTERPRISE | 899 | Ilimitado* | Ilimitado* | 500 GB | 500000 | 20 | 10000 | Completo | Dedicado |

`*` Implementacao tecnica pode usar sentinela interna (`-1` ou valor alto) para ilimitado.

## Modulos inclusos por plano (entitlement)

| Plano | Modulos inclusos |
|---|---|
| STARTER | `CRM`, `ATENDIMENTO` |
| BUSINESS | `CRM`, `ATENDIMENTO`, `VENDAS`, `FINANCEIRO` |
| ENTERPRISE | `CRM`, `ATENDIMENTO`, `VENDAS`, `FINANCEIRO`, `BILLING`, `ADMINISTRACAO` |

## Estados comerciais de assinatura (baseline)

1. `trial`
2. `active`
3. `past_due`
4. `suspended`
5. `canceled`

## Regras de aplicacao para implementacao

1. Bloqueio de funcionalidade deve ocorrer no backend (entitlement), nao apenas no frontend.
2. Todo endpoint sensivel deve validar plano/modulo ativo antes da operacao.
3. Frontend deve apenas refletir status de entitlement retornado pelo backend.

## Pendencias para Sprint 0 seguintes

1. GDN-002: regras de trial, grace, suspensao e cancelamento.
2. GDN-003: prorrata e efetivacao de upgrade/downgrade.
3. GDN-004: pacote comercial e copy final para vendas.
4. GDN-005: matriz RBAC OWNER/SUPERADMIN/ADMIN.

## Fontes internas usadas nesta definicao

1. `backend/src/empresas/empresas.service.ts` (`listarPlanos`)
2. `backend/src/modules/empresas/services/empresa-modulo.service.ts` (`ativarPlano`)
3. `backend/src/modules/admin/services/admin-empresas.service.ts` (`getLimitesPadrao`, `getLimitesPadraoModulo`)
4. `frontend-web/src/services/modulosService.ts` (`ModuloEnum`, `PlanoEnum`)
