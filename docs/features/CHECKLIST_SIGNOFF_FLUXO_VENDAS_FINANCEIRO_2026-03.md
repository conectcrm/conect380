# Checklist de sign-off - Fluxo Vendas -> Financeiro (2026-03)

## 1. Objetivo

Registrar aprovacao formal de QA, Produto e Financeiro para encerramento do ciclo AP-301/AP304 no fluxo integrado.

## 2. Evidencias obrigatorias

- [x] Relatorio consolidado de homologacao: `docs/features/evidencias/HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md`
- [x] Evidencia AP-301 webhook: `docs/features/evidencias/AP301_HOMOLOGACAO_ASSISTIDA_20260228-133245.md`
- [x] Evidencia regressao integrada: `docs/features/evidencias/REGRESSAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md`
- [x] Relatorio formal para aprovacao: `docs/features/RELATORIO_HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260228-133245.md`
- [x] Backlog AP304 atualizado: `docs/features/AP304_FECHAMENTO_FLUXO_VENDAS_FINANCEIRO_BACKLOG_2026-03.md`
- [x] Rodada complementar local (2026-03-05) de AP-301 + regressao:
  - `docs/features/evidencias/AP301_HOMOLOGACAO_ASSISTIDA_20260305-085018.md`
  - `docs/features/evidencias/REGRESSAO_FLUXO_VENDAS_FINANCEIRO_20260305-085018.md`
  - `docs/features/evidencias/HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260305-085018.md`

## 3. Validacao funcional (QA)

- [x] Cenarios C1..C5 do webhook conferidos.
- [x] Confirmacao de trilha de auditoria por `correlationId`.
- [x] Confirmacao de status final em proposta/fatura/pagamento.
- [x] Sem bugs criticos/altos abertos relacionados ao fluxo.
- Responsavel QA: Responsavel unico do projeto (autoaprovacao formal)
- Data: 2026-02-28
- Observacoes: validacao baseada nas evidencias automatizadas de homologacao e regressao (`RUN 20260228-133245`).

## 4. Validacao de negocio (Produto + Financeiro)

- [x] Resultado operacional aprovado para AP-301.
- [x] Resultado operacional aprovado para AP304 (incluindo fila de excecoes e reprocessamento).
- [x] Risco residual aceito.
- [x] Decisao final registrada (GO/NO-GO).
- Responsavel Produto: Responsavel unico do projeto (autoaprovacao formal)
- Responsavel Financeiro: Responsavel unico do projeto (autoaprovacao formal)
- Data: 2026-02-28
- Observacoes: modelo de governanca aplicado por owner unico (sem comite adicional de aprovacao).

## 5. Decisao final

- Status final: [x] GO  [ ] NO-GO
- Condicionantes (se houver): monitoramento pos-go-live de 48h com observabilidade ativa (guia/script publicados em `docs/features/MONITORAMENTO_POS_GO_LIVE_48H_VENDAS_FINANCEIRO_2026-03.md`).
- Proxima acao: executar janela real de 48h, anexar relatorio em `docs/features/evidencias/` e atualizar o sign-off final.

## 6. Preparacao operacional pos-go-live

- [x] Dry-run tecnico do monitoramento executado (`RunId 20260228-144233`) com artefatos em `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260228-144233.md` e `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260228-144233.csv`.
- [x] Dry-run tecnico complementar executado (`RunId 20260301-232945`) com artefatos em `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260301-232945.md` e `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260301-232945.csv` (health e metrics OK; anomalias `MONITOR_STALE_CYCLE` para triagem no go-live real).
- [x] Dry-run tecnico recalibrado executado (`RunId 20260305-083633`) com artefatos em `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260305-083633.md` e `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260305-083633.csv` (sem anomalias).
- [x] Rodada de monitoramento com token e coleta de alertas executada (`RunId 20260305-085356`) com triagem AP304 aplicada e validacao limpa em seguida (`RunId 20260305-085454`):
  - `docs/features/evidencias/AP304_TRIAGEM_ALERTAS_CRITICOS_LOCAL_20260305-085454.md`
  - `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260305-085454.md`
- [x] Janela de monitoramento 48h iniciada em background no ambiente local (`RunId 20260305-085611`, inicio em 2026-03-05 08:56:10):
  - `docs/features/evidencias/MONITORAMENTO_48H_BACKGROUND_START_20260305-085610.md`
- [x] Validacao dedicada de contratos MVP no ambiente local (API + escopo de rota):
  - `docs/features/evidencias/CONTRATOS_MVP_VALIDACAO_LOCAL_20260305-092356.md`
- [x] Migration de consistencia multi-tenant para fornecedores aplicada no banco local (`AlignFornecedorUniqueByEmpresa1802861000000`).
- [x] Preflight tecnico GO Full executado com PASS (`docs/features/evidencias/PREFLIGHT_GO_LIVE_FULL_20260305-084855.md`).
- [x] Smoke MVP UI complementar (desktop + mobile) executado com PASS (`docs/features/evidencias/SMOKE_MVP_UI_20260305-084855.md`).
- [ ] Janela real de 48h no ambiente de go-live.
- [ ] Atualizacao final de GO tecnico/negocio apos janela real.
