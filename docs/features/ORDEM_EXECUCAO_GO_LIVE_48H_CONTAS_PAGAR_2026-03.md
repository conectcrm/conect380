# Ordem de Execucao - Go-live 48h (Contas a Pagar)

## 1. Objetivo

Executar a janela real de monitoramento por 48h apos go-live e fechar a decisao final de operacao (GO tecnico e GO negocio).

## 2. Pre-requisitos

1. Backend publicado e estavel no ambiente alvo.
2. Token operacional valido para coleta de alertas.
3. `EmpresaId` definido para o escopo de monitoramento.
4. Script disponivel:
   - `scripts/monitor-pos-go-live-vendas-financeiro.ps1`

## 3. Comando oficial

```powershell
npm run monitor:go-live:vendas-financeiro:48h
```

Para ambiente remoto (recomendado em producao):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/monitor-pos-go-live-vendas-financeiro.ps1 `
  -BaseUrl "https://api.seu-ambiente.com" `
  -IntervalSeconds 300 `
  -DurationHours 48 `
  -EmpresaId "<empresa-id>" `
  -BearerToken "<jwt-operacional>"
```

## 4. Evidencias obrigatorias

1. Timeline CSV:
   - `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_<runId>.csv`
2. Resumo consolidado:
   - `docs/features/evidencias/MONITORAMENTO_POS_GO_LIVE_48H_<runId>.md`
3. Atualizacao do sign-off:
   - `docs/features/CHECKLIST_SIGNOFF_FLUXO_VENDAS_FINANCEIRO_2026-03.md`

## 5. Criterio de encerramento

1. Janela de 48h concluida com evidencias publicadas.
2. Anomalias criticas tratadas ou com plano de contencao aprovado.
3. Decisao final registrada:
   - GO tecnico: `SIM` ou `NAO`
   - GO negocio: `SIM` ou `NAO`

## 6. Registro da execucao

- Data/hora inicio:
- Data/hora fim:
- Responsavel:
- RunId:
- Resultado GO tecnico:
- Resultado GO negocio:
- Link das evidencias:

