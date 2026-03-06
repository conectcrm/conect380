# Sprint 5 - Ciclo de Vida de Oportunidades (2026-03)

## 1. Objetivo da sprint

Entregar OPP-305 apos estabilizacao do go-live:

1. Marcar oportunidades paradas por inatividade (stale deals).
2. Permitir politica configuravel por tenant para stale e auto-arquivamento.
3. Habilitar automacao opcional de arquivamento por inatividade com auditoria.

## 2. Escopo da Sprint 5

Itens incluidos:

1. OPP-305

Itens explicitamente fora da Sprint 5:

1. Reestruturacao de funil customizavel por tenant.
2. Workflow designer de automacoes comerciais.
3. Integracoes externas de CRM terceiros.

## 3. Sequencia obrigatoria (gate interno)

1. Gate A (politica): definir criterio de stale por tenant.
2. Gate B (backend): endpoints de stale e configuracao.
3. Gate C (automacao): scheduler de auto-arquivamento opcional.
4. Gate D (qualidade): testes de regra e validacao de regressao.

Regra:

1. Nao ativar auto-arquivamento em producao sem politica aprovada por negocio.

## 4. Checklist de execucao por story

## OPP-305

- [x] Expor politica stale por tenant (`enabled`, `thresholdDays`).
- [x] Expor politica de auto-arquivamento (`autoArchiveEnabled`, `autoArchiveAfterDays`).
- [x] Expor endpoint para listar oportunidades paradas.
- [x] Expor endpoint para execucao manual de auto-arquivamento (dry-run opcional).
- [x] Implementar scheduler tenant-aware para auto-arquivamento opcional.
- [x] Garantir registro de atividade/auditoria nas oportunidades auto-arquivadas.
- [x] Cobrir regras com testes unitarios.

## 5. Criterios de pronto da Sprint 5

1. OPP-305 em status Done.
2. Politica stale configuravel por tenant sem redeploy.
3. Auto-arquivamento opcional com controles de seguranca (desligado por padrao em dev).
4. Testes de regra e type-check sem regressao.

## 6. Referencias

1. Plano completo:
   - `docs/features/PLANO_EXECUCAO_CICLO_VIDA_OPORTUNIDADES_2026-03.md`
2. Backlog tecnico:
   - `docs/features/OPP_CICLO_VIDA_BACKLOG_TECNICO_2026-03.md`
3. Politica operacional stale:
   - `docs/features/OPP305_POLITICA_STALE_DEALS_2026-03.md`
4. Roteiro de ativacao controlada:
   - `docs/features/OPP305_ROTEIRO_ATIVACAO_CONTROLADA_STALE_2026-03.md`
5. Checklist de QA manual da UX stale:
   - `docs/features/OPP305_CHECKLIST_QA_PIPELINE_STALE_2026-03.md`
6. Script de regressao consolidada OPP-305:
   - `npm run test:opp305:stale`
7. Script de smoke de homologacao da API stale:
   - `npm run test:opp305:homolog:dryrun`
   - `npm run test:opp305:homolog` (requer token ou credencial valida do tenant)

## 7. Status e evidencias (2026-03-06)

1. Backend OPP-305 concluido:
   - controller/service com endpoints `lifecycle/stale-policy`, `stale` e `stale/auto-archive/run`;
   - monitor `OportunidadesStaleMonitorService` tenant-aware;
   - registro de atividade de auditoria no auto-arquivamento.
2. Frontend Pipeline concluido:
   - badge `Parada Xd` em Kanban/Lista para oportunidades abertas stale;
   - bloco de configuracao da politica stale no card "Carteira do Pipeline";
   - destaque de stale no modal de detalhes da oportunidade.
3. Validacao automatizada executada:
   - consolidado: `npm run test:opp305:stale` (PASS=5, FAIL=0);
   - `backend`: `npm test -- modules/oportunidades/oportunidades.stale-rules.spec.ts modules/oportunidades/oportunidades.stage-rules.spec.ts --runInBand` (11 testes, 2 suites OK);
   - `backend`: `npm test -- modules/oportunidades/oportunidades.controller.spec.ts --runInBand` (7 testes, 1 suite OK);
   - `frontend-web`: `CI=true npm test -- oportunidadesService.stale.test.ts --watch=false --runInBand` (5 testes, 1 suite OK);
   - `frontend-web`: `npm run type-check` (OK).
4. Pendencia operacional fora do escopo de codigo:
   - executar checklist de ativacao controlada por tenant piloto conforme `OPP305_ROTEIRO_ATIVACAO_CONTROLADA_STALE_2026-03.md`.
5. Evidencia consolidada da ultima rodada automatizada:
   - `docs/features/evidencias/OPP305_RELATORIO_QA_STALE_20260306-100919.md`.
6. Smoke de homologacao preparado:
   - dry-run executado com sucesso via `npm run test:opp305:homolog:dryrun`;
   - evidencia: `docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_20260306-092704.md`.
7. Smoke real da API stale executado em ambiente local:
   - comando: `powershell -ExecutionPolicy Bypass -File scripts/qa-opp305-stale-homologacao.ps1 -BaseUrl http://localhost:3001 -Email <usuario> -Senha <senha>`;
   - tentativa inicial registrou falha de autenticacao/intermitencia (`docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_20260306-110142.md`);
   - rerun autenticado concluiu com `PASS=5` e `FAIL=0` (`docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_20260306-110229.md`).
