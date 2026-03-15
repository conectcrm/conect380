# Sprint 3 - Ciclo de Vida de Oportunidades (2026-03)

## 1. Objetivo da sprint

Entregar Fase 3 do ciclo de vida de oportunidades, sem pular etapas:

1. Dashboard V2 e Analytics alinhados ao lifecycle.
2. Integracoes internas (Leads e Propostas) compativeis com lifecycle.
3. Consistencia de metricas entre Pipeline, Dashboard e Analytics.

## 2. Escopo da Sprint 3

Itens incluidos:

1. OPP-301
2. OPP-302
3. OPP-303

Itens explicitamente fora da Sprint 3:

1. OPP-304 (rollout assistido)
2. OPP-305 (stale deals e automacao opcional)

## 3. Sequencia obrigatoria (gate interno)

1. Gate A (Dashboard): OPP-301
2. Gate B (Analytics): OPP-302
3. Gate C (Integracoes): OPP-303

Regra:

1. Nao iniciar gate seguinte sem checklist de saida do gate atual.

## 4. Checklist de execucao por story

## OPP-301

- [ ] Consultas de oportunidades ativas revisadas para lifecycle.
- [ ] Pipeline summary e funil ajustados para excluir `archived/deleted`.
- [ ] Snapshots/agregacoes diarias compativeis com novo modelo.

## OPP-302

- [ ] Analytics comercial revisado para lifecycle.
- [ ] Forecast e KPIs em tempo real sem contaminacao de `archived/deleted`.
- [ ] Compatibilidade legada preservada quando coluna lifecycle nao existir.

## OPP-303

- [ ] Leads mantem criacao de oportunidade em lifecycle `open`.
- [ ] Propostas legadas criando oportunidade com lifecycle `open` quando coluna existir.
- [ ] Fluxos legados sem regressao.

## 5. Criterios de pronto da Sprint 3

1. OPP-301..OPP-303 em Done.
2. Sem divergencia critica de metricas entre Pipeline e Dashboard V2.
3. Sem quebra de fluxos legados de Leads/Propostas.
4. Testes e type-check sem regressao.

## 6. Referencias

1. Plano completo:
   - `docs/features/PLANO_EXECUCAO_CICLO_VIDA_OPORTUNIDADES_2026-03.md`
2. Backlog tecnico:
   - `docs/features/OPP_CICLO_VIDA_BACKLOG_TECNICO_2026-03.md`
3. CSV Sprint 3:
   - `docs/features/BACKLOG_JIRA_CICLO_VIDA_OPORTUNIDADES_SPRINT3_2026-03.csv`
