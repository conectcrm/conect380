# Checklist Go-Live - Fluxo de Vendas MVP (2026-03)

## 1. Escopo MVP validado

1. Lead -> Pipeline/Oportunidade -> Proposta.
2. Compras no nucleo financeiro:
   - `/financeiro/cotacoes`
   - `/financeiro/compras/aprovacoes`
3. Fechamento:
   - `/contratos`
   - `/contratos/:id`
4. Fora do escopo MVP:
   - faturamento/billing completo;
   - gateways de pagamento em producao sem providers explicitamente habilitados.

## 2. Validacoes tecnicas executadas

1. Guardrails de release:
   - `npm run validate:release:vendas:core` -> PASS
   - `npm run validate:release:vendas:full` -> PASS
2. Frontend:
   - `npm run type-check` -> PASS
   - `npm test -- --runTestsByPath src/config/__tests__/menuConfig.permissions.test.ts --runInBand --watch=false` -> PASS
   - `npm test -- --runTestsByPath src/config/__tests__/mvpScope.test.ts --runInBand --watch=false` -> PASS
   - `powershell -ExecutionPolicy Bypass -File .production/scripts/smoke-mvp-ui.ps1 -SkipMobileGuard` -> PASS
   - `powershell -ExecutionPolicy Bypass -File .production/scripts/smoke-mvp-ui.ps1` -> PASS
3. Backend:
   - `npm run type-check` -> PASS
   - `npm test -- cotacao/cotacao.controller.spec.ts --runInBand` -> PASS
4. Preflight GO Core:
   - `npm run preflight:go-live:vendas:core` -> PASS
   - evidencia: `docs/features/evidencias/PREFLIGHT_GO_LIVE_CORE_20260305-083446.md`
5. Preflight GO Full:
   - `npm run preflight:go-live:vendas:full` -> PASS
   - evidencia: `docs/features/evidencias/PREFLIGHT_GO_LIVE_FULL_20260305-084855.md`

## 2.1 Evidencias geradas (2026-03-05)

1. Regressao integrada (PASS):
   - `docs/features/evidencias/REGRESSAO_FLUXO_VENDAS_FINANCEIRO_20260305-081811.md`
2. Homologacao integrada com regressao (PASS):
   - `docs/features/evidencias/HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260305-081811.md`
3. AP-301 preparado em dry-run (pendente dados reais):
   - `docs/features/evidencias/HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260305-082014.md`
4. AP-301 real com coleta SQL (PASS):
   - `docs/features/evidencias/AP301_HOMOLOGACAO_ASSISTIDA_20260305-APLICACAO_REAL.md`
5. Homologacao integrada (somente AP-301) com consolidado (PASS):
   - `docs/features/evidencias/AP301_HOMOLOGACAO_ASSISTIDA_20260305-082317.md`
   - `docs/features/evidencias/HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260305-082317.md`
6. Auditoria de permissao de compras por tenant (PASS):
   - `docs/features/evidencias/AUDITORIA_PERMISSOES_COMPRAS_MVP_20260305.md`
7. Monitoramento pos-go-live (execucao curta local):
   - `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260305-082619.md`
   - `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260305-082619.csv`
8. Monitoramento pos-go-live (execucao curta recalibrada, sem anomalias):
   - `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260305-083633.md`
   - `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260305-083633.csv`
   - referencia de ajuste: `scripts/monitor-pos-go-live-vendas-financeiro.ps1`
9. Smoke MVP UI (rodada complementar local desktop + mobile):
   - `docs/features/evidencias/SMOKE_MVP_UI_20260305-084855.md`
10. Homologacao integrada complementar (AP-301 + regressao, com coleta SQL):
   - `docs/features/evidencias/AP301_HOMOLOGACAO_ASSISTIDA_20260305-085018.md`
   - `docs/features/evidencias/REGRESSAO_FLUXO_VENDAS_FINANCEIRO_20260305-085018.md`
   - `docs/features/evidencias/HOMOLOGACAO_FLUXO_VENDAS_FINANCEIRO_20260305-085018.md`
11. Monitoramento com token + triagem AP304 local (PASS apos tratativa):
   - deteccao inicial: `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260305-085356.md`
   - validacao pos-triagem: `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260305-085454.md`
   - trilha de triagem: `docs/features/evidencias/AP304_TRIAGEM_ALERTAS_CRITICOS_LOCAL_20260305-085454.md`
12. Janela 48h iniciada em background no ambiente local (em andamento):
   - bootstrap: `docs/features/evidencias/MONITORAMENTO_48H_BACKGROUND_START_20260305-085610.md`
   - log de acompanhamento: `docs/features/evidencias/MONITORAMENTO_48H_BACKGROUND_20260305-085610.log`
13. Validacao dedicada de contratos MVP no ambiente local (PASS):
   - `docs/features/evidencias/CONTRATOS_MVP_VALIDACAO_LOCAL_20260305-092356.md`

## 3. Smoke operacional pendente (homolog/producao)

1. Subir backend e frontend.
2. Executar:
   - `powershell -ExecutionPolicy Bypass -File .production/scripts/smoke-mvp-ui.ps1`
   - Credencial padrao do smoke: `admin@conect360.com.br` / `admin123`
3. Evidenciar manualmente:
   - acesso a `/financeiro/cotacoes`;
   - acesso a `/financeiro/compras/aprovacoes`;
   - acesso a `/contratos`;
   - acesso a `/contratos/:id`;
   - bloqueio esperado em `/financeiro/contas-pagar` com MVP ativo.
   - observacao: contratos ja validados localmente (API + escopo MVP) em `CONTRATOS_MVP_VALIDACAO_LOCAL_20260305-092356.md`; pendente apenas evidencia no ambiente alvo.

## 4. Hardening minimo antes de producao

1. Confirmar perfis e permissoes por tenant:
   - comprador: `financeiro.pagamentos.read`
   - aprovador/compras: `financeiro.pagamentos.manage`
   - status atual (local): validado em `AUDITORIA_PERMISSOES_COMPRAS_MVP_20260305.md`
2. Revisar usuarios com apenas permissoes comerciais para garantir ausencia de acesso em rotas de compras.
   - status atual (local): validado em `AUDITORIA_PERMISSOES_COMPRAS_MVP_20260305.md`
3. Executar roteiro de QA integrado:
   - `docs/features/ROTEIRO_QA_FLUXO_VENDAS_FINANCEIRO_2026-03.md`
4. Anexar evidencias SQL/log para cenarios de webhook e idempotencia.
   - status atual (local): concluido em `AP301_HOMOLOGACAO_ASSISTIDA_20260305-APLICACAO_REAL.md`
5. Repetir AP-301 real no ambiente alvo (homolog/producao) com os parametros da empresa do cliente.
6. Executar monitoramento de 48h no ambiente alvo e tratar anomalias via AP304.
