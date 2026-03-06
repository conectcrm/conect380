# Sprint 4 - Ciclo de Vida de Oportunidades (2026-03)

## 1. Objetivo da sprint

Entregar Fase 4 do plano de ciclo de vida sem pular etapas:

1. Rollout controlado por tenant com piloto monitorado.
2. Operacao assistida por 48h com criterio claro de rollback.
3. Runbook publicado para suporte, produto e operacao comercial.

## 2. Escopo da Sprint 4

Itens incluidos:

1. OPP-304

Itens explicitamente fora da Sprint 4:

1. OPP-305 (stale deals e auto-arquivamento opcional)

## 3. Sequencia obrigatoria (gate interno)

1. Gate A (preparo): lista de tenants piloto + flag + checklist de comunicacao.
2. Gate B (piloto): ativacao controlada + monitoramento de 48h.
3. Gate C (expansao): rollout por lote + validacao de estabilidade.

Regra:

1. Nao iniciar gate seguinte sem checklist de saida do gate atual.

## 4. Checklist de execucao por story

## OPP-304

- [ ] Definir tenants piloto e janela de ativacao.
- [ ] Ativar `crm_oportunidades_lifecycle_v1` para grupo piloto.
- [ ] Monitorar 48h:
  - erros HTTP de lifecycle;
  - tentativas de transicao invalida;
  - volume de acoes (arquivar, restaurar, reabrir, excluir).
- [ ] Executar checklist de rollback (flag off + validacao de retorno).
- [x] Publicar runbook operacional com rotina de suporte.
- [ ] Comunicar mudancas para equipe comercial/operacoes.

## 5. Criterios de pronto da Sprint 4

1. OPP-304 em status Done.
2. Piloto de 48h sem incidente P1/P2 aberto.
3. Rollout por lote executado com evidencia de monitoramento.
4. Runbook de operacao e rollback publicado.

## 6. Referencias

1. Plano completo:
   - `docs/features/PLANO_EXECUCAO_CICLO_VIDA_OPORTUNIDADES_2026-03.md`
2. Backlog tecnico:
   - `docs/features/OPP_CICLO_VIDA_BACKLOG_TECNICO_2026-03.md`
3. Runbook Sprint 4:
   - `docs/features/OPP304_ROLLOUT_RUNBOOK_CICLO_VIDA_2026-03.md`
4. Checklist piloto 48h:
   - `docs/features/OPP304_CHECKLIST_PILOTO_48H_CICLO_VIDA_2026-03.md`
5. Script de smoke operacional OPP-304:
   - `npm run test:opp304:piloto:dryrun`
   - `npm run test:opp304:piloto`
6. Script de monitoramento 48h OPP-304:
   - `npm run monitor:opp304:piloto:dryrun`
   - `npm run monitor:opp304:piloto:quick`
   - `powershell -ExecutionPolicy Bypass -File scripts/monitor-opp304-piloto-48h.ps1 -BaseUrl <url_homolog> -Token <jwt_valido> -IntervalSeconds 300 -DurationHours 48`

## 7. Status e evidencias (2026-03-06)

1. OPP-304-T2 parcialmente concluida:
   - runbook publicado em `docs/features/OPP304_ROLLOUT_RUNBOOK_CICLO_VIDA_2026-03.md`.
2. Automacao de pre-piloto entregue:
   - script `scripts/test-opp304-piloto-lifecycle.ps1`;
   - dry-run executado com sucesso (`docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-094312.md`);
   - execucao real local registrada (`docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-094306.md`).
3. Monitoramento automatizado de piloto publicado:
   - script `scripts/monitor-opp304-piloto-48h.ps1`;
   - dry-run de monitoramento (`docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-095317.md`);
   - rodada quick local de 2 ciclos (`docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-095244.md`).
4. Validacao tecnica autenticada concluida:
   - smoke lifecycle completo PASS (`docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-100852.md`);
   - monitor quick autenticado PASS (`docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-101435.md`);
   - rodada complementar de smoke lifecycle autenticado PASS (`docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-110310.md`);
   - rodada complementar de monitor quick autenticado PASS (`docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-110319.md`);
   - migration `AddOportunidadesLifecycleControls1808100000000` aplicada no backend local;
   - evidencia de migration + restart: `docs/features/evidencias/OPP304_SCHEMA_REFRESH_20260306-101311.md`.
5. Janela de monitoramento em andamento (ambiente local):
   - monitor OPP-304 de 48h iniciado em background (`PID 18244`);
   - evidencia de inicio: `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_BACKGROUND_START_20260306-110421.md`.
6. Pendencias para fechar Sprint 4:
   - autenticacao valida de tenant piloto em homolog/producao para endpoints protegidos;
   - ativacao da flag por tenant e monitoramento real de 48h;
   - checklist GO/NO-GO preenchido com evidencias operacionais.
