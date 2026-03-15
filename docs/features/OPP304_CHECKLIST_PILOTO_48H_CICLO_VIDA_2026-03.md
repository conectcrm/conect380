# OPP-304 - Checklist de piloto 48h (2026-03)

## 1. Identificacao

- Tenant (`empresa_id`):
- Nome da empresa:
- Data/hora de inicio:
- Data/hora de encerramento:
- Responsavel tecnico:
- Responsavel negocio:

## 2. Preparacao (antes de ativar)

- [x] Flag `crm_oportunidades_lifecycle_v1` confirmada no tenant correto.
- [x] Usuario de teste com permissao de oportunidades validado.
- [x] Roteiro de smoke disponivel (`npm run test:opp304:piloto:dryrun` / `npm run test:opp304:piloto`).
- [ ] Canal de incidente definido.

## 2.1 Evidencias automatizadas (pre-piloto)

- [x] Smoke dry-run OPP-304 executado:
  - `npm run test:opp304:piloto:dryrun`
  - `docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-094312.md`
- [x] Smoke real local OPP-304 executado:
  - `npm run test:opp304:piloto`
  - `docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-094306.md`
  - Resultado: `health` PASS (200); endpoints protegidos com `401` sem token/credencial valida.
- [x] Monitor de 48h OPP-304 (dry-run tecnico):
  - `npm run monitor:opp304:piloto:dryrun`
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-095317.md`
- [x] Monitor de 48h OPP-304 (quick local):
  - `npm run monitor:opp304:piloto:quick`
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-095244.md`
  - Resultado: ciclos `PARTIAL` por `401` em endpoints protegidos sem autenticacao valida.
- [x] Smoke real autenticado com transicoes lifecycle:
  - `powershell -ExecutionPolicy Bypass -File scripts/test-opp304-piloto-lifecycle.ps1 -BaseUrl http://localhost:3001 -Email <usuario> -Senha <senha> -ApplyFlagPatch -FlagEnabled $true -RolloutPercentage 0 -RestoreAfterPatch $false -RunLifecycleActions -OportunidadeId <id_aberta> -ClosedOportunidadeId <id_fechada>`
  - `docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-100852.md`
  - Resultado: PASS completo (11/11 etapas).
- [x] Smoke real autenticado (rodada complementar local):
  - `powershell -ExecutionPolicy Bypass -File scripts/test-opp304-piloto-lifecycle.ps1 -BaseUrl http://localhost:3001 -Email <usuario> -Senha <senha> -RunLifecycleActions -OportunidadeId <id_aberta>`
  - `docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-110310.md`
  - Resultado: PASS sem falhas (8 PASS / 1 SKIPPED por `ClosedOportunidadeId` nao informado).
- [x] Monitor OPP-304 quick autenticado sem falhas:
  - `powershell -ExecutionPolicy Bypass -File scripts/monitor-opp304-piloto-48h.ps1 -BaseUrl http://localhost:3001 -Email <usuario> -Senha <senha> -IntervalSeconds 10 -MaxCycles 2`
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-101435.md`
  - Resultado: 2 ciclos PASS, sem 400/401/403.
- [x] Monitor OPP-304 quick autenticado (rodada complementar local):
  - `powershell -ExecutionPolicy Bypass -File scripts/monitor-opp304-piloto-48h.ps1 -BaseUrl http://localhost:3001 -Email <usuario> -Senha <senha> -IntervalSeconds 10 -MaxCycles 2`
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-110319.md`
  - Resultado: 2 ciclos PASS, sem 400/401/403.
- [x] Alinhamento de schema lifecycle e restart backend documentados:
  - `docs/features/evidencias/OPP304_SCHEMA_REFRESH_20260306-101311.md`
- [x] Janela de 48h iniciada em background (ambiente local):
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_BACKGROUND_START_20260306-110421.md`

## 3. Smoke imediato (T+30 min)

- [x] Listar oportunidades abertas.
- [x] Arquivar oportunidade de teste.
- [x] Restaurar oportunidade arquivada.
- [x] Reabrir oportunidade fechada.
- [x] Excluir para lixeira e restaurar.

## 4. Monitoramento tecnico

## Janela T+2 h

- [ ] Sem erro critico em endpoints de oportunidades.
- [ ] Sem pico anormal de `400` por transicao invalida.
- [ ] Sem pico anormal de `403` por permissao.

## Janela T+8 h

- [ ] Fluxo operacional com uso real confirmado.
- [ ] Sem incidente P1/P2 aberto.

## Janela T+24 h

- [ ] Pipeline e metricas comerciais sem divergencia critica reportada.
- [ ] Suporte sem chamado bloqueante recorrente.

## Janela T+48 h

- [ ] Estabilidade operacional mantida.
- [ ] Decisao de expandir rollout registrada.

## 5. Go/No-Go

- [ ] GO: expandir para proximo lote.
- [ ] NO-GO: executar rollback de flag.
- [ ] Justificativa registrada.

## 6. Evidencias anexadas

- [ ] Prints/logs da flag e endpoints.
- [ ] Registro de monitoramento por janela.
- [ ] Resultado final (GO/NO-GO).

## 7. Resultado da rodada tecnica (2026-03-06)

- Ambiente: local (desenvolvimento)
- Responsavel: Codex
- Resultado: `GO tecnico local (pre-piloto reforcado)` / `PENDENTE execucao em tenant piloto homolog/producao`
- Observacoes:
  - Script de smoke e monitor da Sprint 4 publicados e validados (dry-run e autenticado).
  - Migration de lifecycle aplicada localmente e backend reiniciado para atualizar cache de schema.
  - Execucao autenticada local validou novamente smoke lifecycle e monitor quick sem falhas em 2026-03-06.
  - Janela de monitoramento de 48h foi iniciada em background no ambiente local.
  - Permanece pendente o ciclo oficial em tenant piloto de homolog/producao com GO/NO-GO operacional.
