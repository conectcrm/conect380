# Ordem de Execucao - Go-live 48h (Ciclo de Vida de Oportunidades)

## 1. Objetivo

Executar as pendencias operacionais finais do ciclo de vida de oportunidades e fechar a decisao formal de operacao (GO tecnico e GO negocio).

## 2. Pre-requisitos

1. Backend publicado e estavel no ambiente alvo (homolog/producao).
2. Tenant piloto definido com `empresa_id` confirmado.
3. Credencial valida do tenant piloto (`-Token` ou `-Email/-Senha`).
4. Canal de incidente definido para a janela de 48h.
5. Scripts disponiveis:
   - `scripts/test-opp304-piloto-lifecycle.ps1`
   - `scripts/monitor-opp304-piloto-48h.ps1`
   - `scripts/test-opp305-stale-homologacao.ps1`

## 3. Sequencia obrigatoria de execucao

1. OPP-304 - Validacao inicial autenticada do tenant piloto:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-opp304-piloto-lifecycle.ps1 `
  -BaseUrl "https://api.seu-ambiente.com" `
  -Token "<jwt-valido>" `
  -RunLifecycleActions `
  -OportunidadeId "<id_aberta>" `
  -ClosedOportunidadeId "<id_fechada>"
```

2. OPP-304 - Monitoramento real de 48h:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/monitor-opp304-piloto-48h.ps1 `
  -BaseUrl "https://api.seu-ambiente.com" `
  -Token "<jwt-valido>" `
  -IntervalSeconds 300 `
  -DurationHours 48
```

3. OPP-305 - Smoke autenticado da API stale:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/test-opp305-stale-homologacao.ps1 `
  -BaseUrl "https://api.seu-ambiente.com" `
  -Token "<jwt-valido>"
```

4. OPP-305 - QA manual em homolog:
   - executar cenarios da secao 4 em `docs/features/OPP305_CHECKLIST_QA_PIPELINE_STALE_2026-03.md`.

5. Fechamento:
   - registrar GO/NO-GO no checklist OPP-304 e no sign-off do plano.

## 4. Evidencias obrigatorias

1. OPP-304 smoke autenticado:
   - `docs/features/evidencias/OPP304_PILOTO_API_SMOKE_<timestamp>.md`
2. OPP-304 monitoramento 48h:
   - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_<timestamp>.md`
   - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_<timestamp>.csv`
3. OPP-305 smoke autenticado:
   - `docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_<timestamp>.md`
4. Sign-off final:
   - `docs/features/CHECKLIST_SIGNOFF_CICLO_VIDA_OPORTUNIDADES_2026-03.md`

## 5. Criterio de encerramento

1. Janela real de 48h de OPP-304 concluida com evidencia publicada.
2. OPP-305 validado sem erro de autenticacao nos endpoints protegidos.
3. QA manual de stale concluido sem bloqueador critico de lifecycle.
4. Decisao final registrada:
   - GO tecnico: `SIM` ou `NAO`
   - GO negocio: `SIM` ou `NAO`

## 6. Registro da execucao

- Data/hora inicio:
- Data/hora fim:
- Responsavel:
- Tenant piloto (`empresa_id`):
- RunId OPP-304 monitor:
- RunId OPP-305 smoke:
- Resultado GO tecnico:
- Resultado GO negocio:
- Links das evidencias:

### Registro local em andamento (2026-03-06)

- Data/hora inicio: `2026-03-06 11:04:21`
- Responsavel: Codex (execucao assistida local)
- PID do monitor OPP-304: `18244`
- RunId do monitor OPP-304: `20260306-110422`
- Evidencias:
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_BACKGROUND_START_20260306-110421.md`
  - `docs/features/evidencias/OPP304_PILOTO_MONITOR_48H_BACKGROUND_20260306-110421.log`
- Smoke OPP-305 autenticado local:
  - `docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_20260306-110229.md`
