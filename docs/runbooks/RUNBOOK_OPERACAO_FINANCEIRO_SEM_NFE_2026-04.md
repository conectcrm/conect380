# Runbook - Operacao Financeiro Sem NFe (2026-04)

## 1) Objetivo
Padronizar a operacao diaria do Financeiro sem emissao fiscal oficial, cobrindo contas a receber, fluxo de caixa, tesouraria e alertas operacionais.

## 2) Escopo desta fase

Em escopo:
- `/financeiro/contas-receber`
- `/financeiro/fluxo-caixa`
- `/financeiro/tesouraria`
- `/financeiro/alertas-operacionais`

Fora de escopo:
- emissao oficial NFe/NFSe
- preflight fiscal oficial

## 3) Perfis e permissao minima

Leitura:
- `financeiro.faturamento.read`

Gestao:
- `financeiro.faturamento.manage`

## 4) Rotina diaria

### 4.1) Contas a receber
1. Acessar `/financeiro/contas-receber`.
2. Aplicar filtros de status e busca por cliente/titulo.
3. Priorizar titulos `vencida` e `parcial`.
4. Executar acoes operacionais:
   - `Registrar recebimento` para baixa parcial/integral.
   - `Reenviar cobranca` para titulos elegiveis.
5. Confirmar atualizacao de saldo em aberto e aging.

### 4.2) Fluxo de caixa
1. Acessar `/financeiro/fluxo-caixa`.
2. Revisar periodo atual (dia/semana/mes) e janela de projecao.
3. Validar:
   - saldo realizado;
   - saldo previsto;
   - diferenca previsto x realizado.
4. Em risco de saldo, acionar rotina de tesouraria.

### 4.3) Tesouraria
1. Acessar `/financeiro/tesouraria`.
2. Revisar posicao consolidada por conta e saldo projetado.
3. Se necessario, criar transferencia interna:
   - selecionar conta origem/destino;
   - informar valor e descricao;
   - criar transferencia (status `pendente`).
4. Aprovar ou cancelar transferencias pendentes conforme politica interna.
5. Confirmar saldo final nas contas envolvidas.

### 4.4) Alertas operacionais
1. Recalcular alertas operacionais financeiros.
2. Tratar alertas criticos primeiro:
   - `saldo_caixa_critico`
   - `conta_vencida`
   - `webhook_pagamento_falha`
3. Registrar `ack` e `resolver` com observacao objetiva.

## 5) Rotina semanal
1. Revisar aging de inadimplencia (a vencer, 1-30, 31-60, 61+).
2. Revisar janela de projecao de caixa de 30 a 60 dias.
3. Revisar transferencias canceladas e pendentes antigas.
4. Consolidar lista de desvios operacionais e plano corretivo.

## 6) Fechamento mensal (sem NFe)
1. Congelar filtros do periodo de fechamento.
2. Exportar evidencias de:
   - contas a receber (status/aging/saldo em aberto);
   - fluxo de caixa (resumo + projecao);
   - tesouraria (saldo consolidado + transferencias).
3. Validar ausencia de transferencias pendentes sem decisao.
4. Publicar ata de fechamento com responsavel, data e observacoes.

## 7) Contingencia operacional

### 7.1) Gateway de pagamento indisponivel
1. Operar baixa manual em contas a receber para casos confirmados.
2. Registrar observacao com origem do comprovante.
3. Reprocessar cobrancas apos normalizacao do gateway.

### 7.2) Divergencia de saldo de tesouraria
1. Filtrar transferencias pendentes e canceladas nas ultimas 24h.
2. Verificar se houve aprovacao duplicada ou cancelamento indevido.
3. Confirmar saldo de origem/destino apos cada aprovacao.
4. Se persistir, bloquear novas aprovacoes e escalar para suporte tecnico.

### 7.3) Alerta de saldo critico de caixa
1. Validar janela de projecao atual.
2. Priorizar cobrancas de titulos vencidos/parciais.
3. Replanejar saidas programadas nao criticas.
4. Recalcular alertas e registrar acao aplicada.

### 7.4) Falha ao reprocessar alerta
1. Registrar erro retornado no proprio alerta.
2. Tentar reprocessamento manual orientado pelo tipo do alerta.
3. Escalar para suporte tecnico quando houver bloqueio sistemico.

## 8) Evidencias minimas por operacao critica
- Correlation id da acao (quando aplicavel).
- Usuario executor.
- Timestamp da acao.
- Antes/depois de saldo (em aprovacoes de transferencia).
- Observacao de justificativa (cancelamentos e resolucoes).

## 9) Comandos de validacao recomendados
1. `npm --prefix backend run test -- tesouraria.service.spec.ts tesouraria.controller.spec.ts --runInBand`
2. `npm --prefix backend run test -- conta-receber.service.spec.ts conta-receber.controller.spec.ts fluxo-caixa.service.spec.ts fluxo-caixa.controller.spec.ts --runInBand`
3. `$env:CI='true'; npm --prefix frontend-web run test -- --runInBand --runTestsByPath src/services/__tests__/contasReceberService.test.ts src/services/__tests__/fluxoCaixaService.test.ts src/services/__tests__/tesourariaService.test.ts src/services/__tests__/alertasOperacionaisFinanceiroService.test.ts`
4. `npm --prefix backend run type-check`
5. `npm --prefix frontend-web run type-check`
