# Runbook - Fechamento Financeiro Mensal e Estorno (2026-03)

## 1) Objetivo
Padronizar o fechamento mensal do financeiro no Conect360, garantindo rastreabilidade de cobranca, recebimentos, divergencias, cancelamentos e estornos sem depender de planilha paralela.

## 2) Escopo
- Modulo de Faturamento (`/faturamento`)
- Contas a pagar (`/financeiro/contas-pagar`)
- Fluxo de conciliacao operacional

## 3) Perfis e permissao minima
- Operador financeiro (leitura):
  - `financeiro.faturamento.read`
  - `financeiro.pagamentos.read`
- Gestor financeiro (gestao):
  - `financeiro.faturamento.manage`
  - `financeiro.pagamentos.manage`

## 4) Pre-check (D-1 do fechamento)
1. Confirmar que nao existe deploy em andamento com migration pendente.
2. Garantir que o dashboard de faturamento carrega sem erro e com dados atualizados.
3. Validar permissao do usuario executor (leitura + gestao quando necessario).

## 5) Fechamento mensal - passo a passo

### 5.1 Atualizar base operacional
1. Acessar `Financeiro > Faturamento`.
2. Clicar em `Atualizar` no topo da tela.
3. Conferir periodo/filtros para o mes de fechamento.

### 5.2 Tratar divergencias obrigatorias
No dashboard de faturamento, revisar o painel `Validacao operacional de fechamento`:
- `Itens x total da fatura`
- `Estorno pendente de conciliacao`
- `Parcial sem baixa final`

Acoes:
1. Corrigir faturas divergentes (valor, itens, impostos, desconto).
2. Registrar pagamento/baixa para casos parciais pendentes.
3. Tratar estornos pendentes antes de consolidar o mes.

Criterio para seguir:
- Nenhuma divergencia critica pendente para o periodo de fechamento.

### 5.3 Relatorios de fechamento
Na aba `Relatorios` do faturamento, gerar e validar:
1. `Fechamento: fluxo de caixa`
2. `Fechamento: competencia mensal`
3. `Fechamento: aging de recebiveis`

Exportar evidencias:
- CSV e/ou Excel para arquivo operacional
- PDF para reporte executivo (quando aplicavel)

Campos de auditoria obrigatorios na exportacao:
- Numero
- Cliente
- Status
- Responsavel
- Origem
- Valor total / pago / em aberto
- Datas de emissao, vencimento, criacao e atualizacao

### 5.4 Cobranca em lote (se houver aberto/vencido)
1. Selecionar faturas elegiveis.
2. Acionar `Gerar Cobranca` em massa.
3. Validar retorno por item:
   - sucesso
   - simulado
   - falha
   - ignorado
4. Reprocessar manualmente falhas com motivo tecnico/comercial.

### 5.5 Contas a pagar (contrapartida do fechamento)
1. Revisar contas pendentes e vencidas.
2. Processar aprovacoes/reprovacoes pendentes.
3. Confirmar pagamentos realizados no periodo.
4. Validar centro de custo aplicado nas contas criticas.

## 6) Procedimento de estorno

### 6.1 Quando aplicar
- Pagamento indevido
- Cancelamento comercial apos recebimento
- Erro operacional de lancamento

### 6.2 Passos operacionais
1. Abrir a fatura e localizar o pagamento aprovado.
2. Acionar `Estornar` e informar motivo claro.
3. Confirmar atualizacao do status da fatura apos estorno.
4. Verificar refletencia no painel de divergencias e relatorios.
5. Registrar observacao final no atendimento financeiro/comercial (quando necessario).

### 6.3 Rastreabilidade minima esperada
- Registro de estorno criado
- Motivo registrado
- Usuario responsavel registrado
- Historico financeiro atualizado

## 7) Cancelamento de fatura
1. Cancelar apenas faturas nao pagas.
2. Informar motivo do cancelamento.
3. Confirmar sincronizacao de status comercial/financeiro.
4. Revalidar relatorios do periodo apos cancelamento.

## 8) Contingencia
Se gateway/email estiver indisponivel:
1. Continuar fechamento com status interno da fatura.
2. Registrar ocorrencia e operar envios em modo posterior.
3. Reexecutar cobranca em lote apos normalizacao.

## 9) Checklist final do fechamento
- [ ] Base atualizada e periodo correto aplicado
- [ ] Painel de divergencias revisado e tratado
- [ ] Fluxo de caixa validado
- [ ] Competencia mensal validada
- [ ] Aging de recebiveis validado
- [ ] Cobranca em lote processada (quando aplicavel)
- [ ] Estornos/cancelamentos conciliados
- [ ] Exportacoes de auditoria arquivadas

## 10) Evidencias recomendadas
- Export CSV/Excel/PDF do periodo
- Print do painel de divergencias zerado (ou com justificativa)
- Lista de estornos/cancelamentos executados
- Registro de responsavel e data do fechamento
