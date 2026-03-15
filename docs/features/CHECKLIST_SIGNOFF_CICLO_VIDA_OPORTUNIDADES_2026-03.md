# Checklist de sign-off - Ciclo de Vida de Oportunidades (2026-03)

## 1. Objetivo

Registrar aprovacao formal para encerramento do plano de ciclo de vida de oportunidades, incluindo OPP-304 (rollout lifecycle) e OPP-305 (stale deals).

## 2. Evidencias obrigatorias

- [x] Status Sprint 4 publicado: `docs/features/OPP_CICLO_VIDA_SPRINT4_2026-03.md`
- [x] Status Sprint 5 publicado: `docs/features/OPP_CICLO_VIDA_SPRINT5_2026-03.md`
- [x] Checklist de piloto 48h versionado: `docs/features/OPP304_CHECKLIST_PILOTO_48H_CICLO_VIDA_2026-03.md`
- [x] Checklist de QA stale versionado: `docs/features/OPP305_CHECKLIST_QA_PIPELINE_STALE_2026-03.md`
- [x] Smoke lifecycle autenticado local com PASS:
  - `docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-100852.md`
- [x] Smoke lifecycle autenticado local (rodada complementar) com PASS:
  - `docs/features/evidencias/OPP304_PILOTO_API_SMOKE_20260306-110310.md`
- [x] Monitor quick autenticado local com PASS:
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-101435.md`
- [x] Monitor quick autenticado local (rodada complementar) com PASS:
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_20260306-110319.md`
- [x] Alinhamento de schema lifecycle documentado:
  - `docs/features/evidencias/OPP304_SCHEMA_REFRESH_20260306-101311.md`
- [x] Relatorio automatizado stale consolidado:
  - `docs/features/evidencias/OPP305_RELATORIO_QA_STALE_20260306-100919.md`
- [x] Smoke OPP-305 autenticado local sem `401`:
  - `docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_20260306-110229.md`
- [x] Janela de monitoramento OPP-304 iniciada em background (local):
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_BACKGROUND_START_20260306-110421.md`
- [ ] Janela real de monitoramento 48h em tenant piloto (OPP-304).
- [ ] Smoke OPP-305 autenticado sem `401` em homolog/producao.
- [ ] QA manual stale em homolog com resultado final por cenario.

## 3. Validacao funcional e operacional

- [ ] Fluxo lifecycle completo validado em tenant piloto (arquivar, restaurar, reabrir, lixeira, restaurar lixeira).
- [ ] Janela de 48h sem incidente P1/P2 aberto.
- [ ] Validacao de uso real com equipe comercial/operacoes.
- [ ] Rollback testado (flag off) ou justificativa formal para nao execucao.
- Responsavel QA:
- Responsavel Operacoes:
- Data:
- Observacoes:

## 4. Validacao stale deals (OPP-305)

- [ ] Politica stale validada por tenant piloto (`enabled`, `thresholdDays`).
- [ ] Execucao dry-run consistente com expectativa de negocio.
- [ ] Auto-arquivamento real validado (quando habilitado) com auditoria registrada.
- [ ] Sem regressao de lifecycle no Pipeline apos ativacao stale.
- Responsavel Produto:
- Responsavel Comercial:
- Data:
- Observacoes:

## 5. Decisao final

- Status final: [ ] GO  [ ] NO-GO
- GO tecnico: [ ] SIM  [ ] NAO
- GO negocio: [ ] SIM  [ ] NAO
- Condicionantes (se houver):
- Data da decisao:
- Responsavel final:

## 6. Proxima acao apos decisao

- [ ] Atualizar `docs/features/PLANO_EXECUCAO_CICLO_VIDA_OPORTUNIDADES_2026-03.md` com o status final dos gates.
- [ ] Publicar evidencias adicionais em `docs/features/evidencias/`.
- [ ] Comunicar encerramento formal para Produto, Operacoes e Comercial.
