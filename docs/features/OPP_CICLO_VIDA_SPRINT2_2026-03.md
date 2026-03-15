# Sprint 2 - Ciclo de Vida de Oportunidades (2026-03)

## 1. Objetivo da sprint

Entregar Fase 2 do ciclo de vida de oportunidades, sem pular etapas:

1. Pipeline com visoes operacionais por lifecycle.
2. Acoes de lifecycle aplicadas em cards e modal de detalhes.
3. Contratos frontend alinhados ao backend com fallback seguro.
4. Regressao funcional do Pipeline sem bloqueadores.

## 2. Escopo da Sprint 2

Itens incluidos:

1. OPP-201
2. OPP-202
3. OPP-203
4. OPP-204

Itens explicitamente fora da Sprint 2:

1. OPP-301 a OPP-305 (Dashboard/Analytics/Integracoes/Rollout/Stale)

## 3. Sequencia obrigatoria (gate interno)

1. Gate A (visoes/filtros): OPP-201
2. Gate B (acoes UX): OPP-202
3. Gate C (contratos): OPP-203
4. Gate D (qualidade): OPP-204

Regra:

1. Nao iniciar gate seguinte sem checklist de saida do gate atual.

## 4. Planejamento sugerido por semana

## Semana 1

1. OPP-201 filtros rapidos e contadores.
2. OPP-202 acoes em cards/modais.

## Semana 2

1. OPP-203 contratos frontend (types/services).
2. OPP-204 QA funcional e regressao.

## 5. Checklist de execucao por story

## OPP-201

- [ ] Filtros rapidos `abertas`, `fechadas`, `arquivadas`, `lixeira` implementados.
- [ ] View operacional padrao em `abertas`.
- [ ] Contadores/chips atualizam de forma consistente.

## OPP-202

- [ ] Acoes de lifecycle no card e no modal de detalhes.
- [ ] Confirmacoes e mensagens de erro claras para operacao invalida.
- [ ] DnD bloqueado/permitido conforme regra de lifecycle.

## OPP-203

- [ ] `types/oportunidades` atualizado com lifecycle.
- [ ] `oportunidadesService` atualizado para novos endpoints lifecycle.
- [ ] Fallback para tenant sem flag ativa validado.

## OPP-204

- [ ] Roteiro funcional criar -> mover -> ganhar/perder -> reabrir -> arquivar -> restaurar -> excluir.
- [ ] Regressao em kanban/lista/calendario/grafico executada.
- [ ] Evidencias anexadas sem bloqueador aberto.

## 6. Criterios de pronto da Sprint 2

1. Todos os itens OPP-201..OPP-204 em status Done.
2. Nenhuma regressao critica/alta aberta no Pipeline.
3. UX aprovada em homologacao com fluxo lifecycle completo.
4. Contrato frontend/backend estavel com fallback para tenant legado.

## 7. Riscos da sprint e mitigacao

1. Risco: inconsistencias entre views do pipeline.
   Mitigacao:
   - recalcular estado apos toda acao lifecycle;
   - validar contadores/chips em todos os modos.
2. Risco: erro de permissao/transicao sem orientacao ao usuario.
   Mitigacao:
   - mapear mensagens backend no frontend;
   - padronizar toasts e mensagens de bloqueio.
3. Risco: tenant sem flag ativa receber UX nova sem suporte backend.
   Mitigacao:
   - fallback de acao para contrato legado;
   - ocultar/acomodar acoes indisponiveis.

## 8. Referencias

1. Plano completo:
   - `docs/features/PLANO_EXECUCAO_CICLO_VIDA_OPORTUNIDADES_2026-03.md`
2. Backlog tecnico:
   - `docs/features/OPP_CICLO_VIDA_BACKLOG_TECNICO_2026-03.md`
3. CSV Sprint 2:
   - `docs/features/BACKLOG_JIRA_CICLO_VIDA_OPORTUNIDADES_SPRINT2_2026-03.csv`
