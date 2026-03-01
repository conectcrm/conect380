# Monitoramento pos-go-live 48h - Fluxo Vendas -> Financeiro (2026-03)

## 1. Objetivo

Padronizar a janela de monitoramento de 48h apos go-live para os fluxos Sprint 1, AP-301 e AP304, com coleta automatizada, criterios de anomalia e trilha de evidencia.

## 2. Artefatos

- Script: `scripts/monitor-pos-go-live-vendas-financeiro.ps1`
- Comandos rapidos (root):
  - `npm run monitor:go-live:vendas-financeiro`
  - `npm run monitor:go-live:vendas-financeiro:48h`
- Saidas:
  - Timeline CSV: `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_<runId>.csv`
  - Resumo consolidado: `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_<runId>.md`

## 3. Parametros recomendados

- `-BaseUrl`: URL do backend monitorado.
- `-IntervalSeconds`: intervalo de coleta (recomendado: `300`).
- `-DurationHours`: duracao alvo (padrao: `48`).
- `-EmpresaId` + `-BearerToken`: habilita coleta da fila de alertas operacionais.
- `-MaxCycles`: util para dry-run tecnico sem esperar 48h.

## 4. Execucao recomendada

### 4.1 Dry-run tecnico (pre-go-live)

```powershell
npm run monitor:go-live:vendas-financeiro
```

### 4.2 Janela real de 48h (com fila de excecoes)

```powershell
npm run monitor:go-live:vendas-financeiro:48h
```

Para ambiente remoto e coleta completa da fila de alertas, usar execucao direta com parametros customizados:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/monitor-pos-go-live-vendas-financeiro.ps1 `
  -BaseUrl "https://api.seu-ambiente.com" `
  -IntervalSeconds 300 `
  -DurationHours 48 `
  -EmpresaId "<empresa-id>" `
  -BearerToken "<jwt-operacional>"
```

## 5. Criterios automatizados de anomalia

1. `HEALTH_UNAVAILABLE`: falha no endpoint `/health`.
2. `METRICS_UNAVAILABLE`: falha no endpoint `/metrics`.
3. `MONITOR_STALE_CYCLE`: idade do ultimo ciclo acima de `2 * intervalo + 60s`.
4. `MONITOR_HIGH_FAILURE_RATE`: taxa de `partial|fatal_error` acima de 20% no delta coletado.
5. `MONITOR_COMPANIES_FAILURE`: empresas com falha no ultimo ciclo do monitor.
6. `ALERTAS_CRITICAL_OPEN`: existencia de alertas criticos ativos na fila operacional.

## 6. Encerramento da janela

1. Anexar o resumo gerado em `docs/features/evidencias/`.
2. Fazer triagem das anomalias com o runbook AP304:
   - `docs/features/AP304_GOVERNANCA_RUNBOOK_OPERACIONAL_2026-03.md`
3. Atualizar:
   - `docs/features/CHECKLIST_SIGNOFF_FLUXO_VENDAS_FINANCEIRO_2026-03.md`
   - `docs/features/PLANO_EXECUCAO_CONTAS_PAGAR_2026.md`
4. Registrar decisao final:
   - GO tecnico
   - GO negocio

## 7. Status atual

- Guia e automacao publicados em 2026-02-28.
- Dry-run tecnico executado em 2026-02-28 (`RunId 20260228-144233`) com coleta concluida e evidencias em `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260228-144233.md` e `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_20260228-144233.csv`.
- Janela real de 48h: pendente da data efetiva de go-live no ambiente alvo.
