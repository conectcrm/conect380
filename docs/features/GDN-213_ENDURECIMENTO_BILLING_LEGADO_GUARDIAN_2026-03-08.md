# GDN-213 - Endurecimento de Billing legado e namespace Guardian

## Data
- 2026-03-08

## Objetivo
- Garantir que operacoes administrativas de billing/catalogo nao sejam executadas por endpoints legados fora de `guardian/*`.

## Mudancas implementadas
- Criado `GuardianPlanosController` (`/guardian/planos`) com governanca de catalogo:
  - listar planos
  - listar modulos disponiveis
  - buscar por id/codigo
  - criar/atualizar/remover
  - ativar/desativar/toggle status
- `GuardianModule` atualizado para registrar `GuardianPlanosController`.
- `GuardianBffController`:
  - adicionado endpoint `POST /guardian/bff/billing/subscriptions/jobs/due-date-cycle`
  - politica mantida: `SUPERADMIN` + `planos.manage`.
- `PlanosModule`:
  - exportado `AssinaturaDueDateSchedulerService` para uso no namespace Guardian.
- Endpoints legados de escrita endurecidos com `LegacyAdminTransitionGuard`:
  - `PlanosController`: `POST/PUT/DELETE` e toggles de status.
  - `AssinaturasController` (operacoes sensiveis): criar, suspender, reativar, contadores, api-call e job manual.

## Impacto esperado
- Fluxo cliente/self-service (leitura de planos e assinatura, upgrade/cancelamento por empresa) permanece funcional.
- Escritas administrativas legadas seguem politica de transicao e migram para `guardian/*`.

## Validacao
- Testes de metadata adicionados/atualizados:
  - `guardian-planos.controller.spec.ts`
  - `guardian-bff.controller.spec.ts`
  - `planos.controller.spec.ts`
  - `assinaturas.controller.spec.ts`
- Type-check e testes focados executados no backend.
