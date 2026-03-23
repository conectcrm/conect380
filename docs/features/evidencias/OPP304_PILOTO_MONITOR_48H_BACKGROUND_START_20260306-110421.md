# OPP-304 - Inicio de monitoramento 48h em background

- Data/hora de inicio: `2026-03-06 11:04:21`
- RunId do monitor: `20260306-110422`
- Ambiente: local (desenvolvimento)
- Responsavel: Codex (execucao assistida)
- Processo monitor: `PID 18244`
- Comando:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/monitor-opp304-piloto-48h.ps1 `
  -BaseUrl http://localhost:3001 `
  -Email <usuario> `
  -Senha <senha> `
  -IntervalSeconds 300 `
  -DurationHours 48
```

## Artefatos de apoio

- `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_BACKGROUND_20260306-110421.log`
- `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_BACKGROUND_20260306-110421.err.log`

## Observacao

- Esta evidencia registra o inicio da janela de 48h.
- Validacao inicial no log: `Ciclo 1 = PASS` (sem falhas nas probes).
- O relatorio consolidado esperado ao final da execucao permanece no padrao:
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_<timestamp>.md`
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_<timestamp>.csv`
