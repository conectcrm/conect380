# Sprint 1 - Ciclo de Vida de Oportunidades (2026-03)

## 1. Objetivo da sprint

Entregar Fase 0 e Fase 1 do ciclo de vida de oportunidades, sem pular etapas:

1. Governanca funcional aprovada.
2. Backend base com migration, lifecycle, soft delete, restore, reabertura e testes.

## 2. Escopo da Sprint 1

Itens incluidos:

1. OPP-001
2. OPP-002
3. OPP-101
4. OPP-102
5. OPP-103
6. OPP-104
7. OPP-105

Itens explicitamente fora da Sprint 1:

1. OPP-201 a OPP-204 (Pipeline UX)
2. OPP-301 a OPP-305 (Dashboard/Analytics/Rollout/Stale)

## 3. Sequencia obrigatoria (gate interno)

1. Gate A (governanca): OPP-001 -> OPP-002
2. Gate B (dados): OPP-101
3. Gate C (API lifecycle): OPP-102 -> OPP-103 -> OPP-104
4. Gate D (qualidade): OPP-105

Regra:

1. Nao iniciar Gate seguinte sem checklist de saida do gate atual.

## 4. Planejamento sugerido por semana

## Semana 1

1. OPP-001 Matriz oficial.
2. OPP-002 Feature flag.
3. OPP-101 Migration + backfill.

## Semana 2

1. OPP-102 Soft delete/restore/hard delete controlado.
2. OPP-103 Reabertura.
3. OPP-104 Ajuste de listagem e metricas.
4. OPP-105 Testes de regressao backend.

## 5. Checklist de execucao por story

## OPP-001

- [ ] Documento de estados/transicoes versionado.
- [ ] Matriz de permissao por acao aprovada.
- [ ] Aprovações registradas em ata/evidencia.

## OPP-002

- [ ] Flag por tenant implementada.
- [ ] Flag exposta para frontend/telemetria.
- [ ] Rollback por flag validado.

## OPP-101

- [ ] Migration aplicada em homologacao.
- [ ] Indices criados e validados.
- [ ] Backfill executado e conferido.

## OPP-102

- [ ] Soft delete substitui delete padrao.
- [ ] Restore funcional por endpoint.
- [ ] Hard delete restrito por permissao.
- [ ] Auditoria registrada nas tres acoes.

## OPP-103

- [ ] Endpoint de reabertura implementado.
- [ ] Validacoes de permissao/transicao ativas.
- [ ] Evento de historico/auditoria registrado.

## OPP-104

- [ ] `findAll` considera lifecycle.
- [ ] `getPipelineData` considera lifecycle.
- [ ] `getMetricas` considera lifecycle.
- [ ] Compatibilidade legada preservada sob flag.

## OPP-105

- [ ] Testes unitarios de regras lifecycle.
- [ ] Testes e2e do fluxo completo backend.
- [ ] Pipeline de testes verde.

## 6. Criterios de pronto da Sprint 1

1. Todos os itens OPP-001..OPP-105 em status Done.
2. Sem bug critico/alto aberto nos fluxos backend lifecycle.
3. Evidencias de migration/backfill e suite de testes anexadas.
4. Feature flag apta para piloto (ainda desativada por padrao em producao).

## 7. Riscos da sprint e mitigacao

1. Risco: migração impactar base legada.
   Mitigacao:
   - rodar backfill em homologacao com amostra real.
   - validar tempo de execucao e lock antes de producao.
2. Risco: quebra de contrato atual do frontend.
   Mitigacao:
   - compatibilidade por flag.
   - testes de contrato nos endpoints.
3. Risco: hard delete usado indevidamente.
   Mitigacao:
   - permissao restrita.
   - trilha de auditoria obrigatoria.

## 8. Referencias

1. Plano completo:
   - `docs/features/PLANO_EXECUCAO_CICLO_VIDA_OPORTUNIDADES_2026-03.md`
2. Backlog tecnico:
   - `docs/features/OPP_CICLO_VIDA_BACKLOG_TECNICO_2026-03.md`
3. CSV Sprint 1:
   - `docs/features/BACKLOG_JIRA_CICLO_VIDA_OPORTUNIDADES_SPRINT1_2026-03.csv`
