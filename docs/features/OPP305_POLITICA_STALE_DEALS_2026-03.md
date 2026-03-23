# OPP-305 - Politica de stale deals e auto-arquivamento (2026-03)

## 1. Objetivo

Definir criterio operacional para identificar oportunidades paradas e, opcionalmente, arquivar automaticamente sem perda de historico.

## 2. Definicoes

1. Oportunidade parada (stale):
   - oportunidade aberta;
   - sem interacao relevante por `thresholdDays`.
2. Interacao relevante:
   - atualizacao da oportunidade;
   - atividade registrada;
   - evento de mudanca de estagio.

## 3. Configuracao por tenant

A politica e persistida na tabela `feature_flags_tenant` com chaves:

1. `crm_oportunidades_stale_policy_v1`
   - `enabled`: liga/desliga marcacao stale;
   - `rollout_percentage`: valor usado como `thresholdDays`.
2. `crm_oportunidades_stale_auto_archive_v1`
   - `enabled`: liga/desliga auto-arquivamento;
   - `rollout_percentage`: valor usado como `autoArchiveAfterDays`.

Observacao:

1. `autoArchiveAfterDays` nunca pode ser menor que `thresholdDays`.

## 4. Endpoints backend

1. `GET /oportunidades/lifecycle/stale-policy`
   - retorna politica resolvida do tenant.
2. `PATCH /oportunidades/lifecycle/stale-policy`
   - atualiza politica stale/auto-arquivamento.
3. `GET /oportunidades/stale`
   - lista oportunidades paradas com metadados (`stale_days`, `last_interaction_at`, `stale_since`).
4. `POST /oportunidades/stale/auto-archive/run`
   - executa auto-arquivamento manual (aceita `dry_run`).

## 5. Scheduler automatico

Servico:

1. `OportunidadesStaleMonitorService`

Comportamento:

1. Processa tenants ativos em lote.
2. Executa auto-arquivamento apenas quando:
   - lifecycle ativo no tenant;
   - stale policy ativa;
   - auto-arquivamento ativo.
3. Registra atividade de auditoria em cada oportunidade arquivada automaticamente.

## 6. Variaveis de ambiente

1. `OPORTUNIDADES_STALE_POLICY_ENABLED`
2. `OPORTUNIDADES_STALE_DEFAULT_DAYS`
3. `OPORTUNIDADES_STALE_AUTO_ARCHIVE_ENABLED`
4. `OPORTUNIDADES_STALE_AUTO_ARCHIVE_AFTER_DAYS`
5. `OPORTUNIDADES_STALE_MONITOR_ENABLED`
6. `OPORTUNIDADES_STALE_MONITOR_INTERVAL_MS`
7. `OPORTUNIDADES_STALE_AUTO_ARCHIVE_BATCH_SIZE`

## 7. Recomendacao inicial para producao

1. Ativar stale policy com `thresholdDays=30`.
2. Manter auto-arquivamento desligado na primeira semana.
3. Rodar `dry_run` manual diario para validar impacto.
4. Habilitar auto-arquivamento apenas apos validacao comercial.

## 8. Referencia de execucao

1. `docs/features/OPP305_ROTEIRO_ATIVACAO_CONTROLADA_STALE_2026-03.md`
2. `docs/features/OPP305_CHECKLIST_QA_PIPELINE_STALE_2026-03.md`
3. `npm run test:opp305:stale`
4. `npm run test:opp305:homolog`
