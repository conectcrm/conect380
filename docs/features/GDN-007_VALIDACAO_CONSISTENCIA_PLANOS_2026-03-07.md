# GDN-007 - Validacao de consistencia de planos (2026-03-07)

## Objetivo

Validar conflitos entre matriz comercial v1 e implementacao atual.

## Escopo validado

1. Matriz v1: `docs/features/GDN-001_MATRIZ_PLANOS_GUARDIAN_V1_2026-03-07.md`
2. Planos publicos: `backend/src/empresas/empresas.service.ts` (`listarPlanos`)
3. Entitlement por modulo: `backend/src/modules/empresas/services/empresa-modulo.service.ts` (`ativarPlano`)
4. Limites admin: `backend/src/modules/admin/services/admin-empresas.service.ts`

## Resultado

| Verificacao | Resultado | Evidencia |
|---|---|---|
| Precos baseline (99/299/899) | OK | `empresas.service.ts` |
| Modulos por plano (starter/business/enterprise) | OK | `empresa-modulo.service.ts` |
| Nomenclatura de plano unica (`business`) | NAO OK | coexistem `business` e `professional` |
| Limite de usuarios no starter | NAO OK | 3 em `listarPlanos` vs 5 em `getLimitesPadrao` |
| Trial padrao unico | NAO OK | 30 dias em registro vs 7 dias em admin |

## Gaps identificados para correcoes Sprint 1

1. Normalizar `professional` -> `business` em codigo e contratos.
2. Unificar limites starter em uma fonte oficial.
3. Unificar politica de trial em uma regra unica por canal (ou feature flag formal).

## Conclusao

1. Matriz v1 esta definida e utilizavel.
2. Existem 3 divergencias tecnicas que devem virar tarefas de ajuste antes de go-live.
