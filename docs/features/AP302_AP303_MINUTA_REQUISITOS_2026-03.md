# AP-302/AP-303 - Minuta de requisitos (2026-03)

## 1. Objetivo

Consolidar uma minuta unica de requisitos para:

1. AP-302: exportacao contabil/fiscal de contas a pagar.
2. AP-303: alertas operacionais financeiros.

Status deste documento:

1. proposta tecnica inicial (backend/frontend);
2. pendente validacao formal com Financeiro e Contabil.

## 2. AP-302 - Exportacao contabil/fiscal

### 2.1 Escopo funcional minimo

1. Exportar movimentos de contas a pagar em `csv` e `xlsx`.
2. Permitir filtro por:
   - periodo (emissao e vencimento);
   - centro de custo;
   - status;
   - fornecedor;
   - conta bancaria.
3. Gerar arquivo com colunas contabilmente uteis para conciliacao externa.

### 2.2 Campos minimos sugeridos

1. `empresaId`
2. `numeroDocumento`
3. `fornecedor`
4. `cnpjCpfFornecedor`
5. `categoriaDespesa`
6. `centroCusto`
7. `dataEmissao`
8. `dataVencimento`
9. `dataPagamento`
10. `statusConta`
11. `valorOriginal`
12. `valorPago`
13. `jurosMulta`
14. `desconto`
15. `contaBancaria`
16. `formaPagamento`
17. `referenciaGateway`
18. `observacoes`

### 2.3 Regras de negocio sugeridas

1. Exportacao respeita isolamento por `empresaId`.
2. Usuario sem permissao financeira nao pode exportar.
3. Arquivo precisa manter ordenacao previsivel (vencimento asc, id asc).
4. Valores monetarios devem sair normalizados com 2 casas.
5. Datas devem ser exportadas no formato ISO (`YYYY-MM-DD`).

### 2.4 Pontos para validacao com Financeiro/Contabil

1. Layout final de colunas obrigatorias e opcionais.
2. Separador decimal/milhar para sistema contabil alvo.
3. Necessidade de codigos contabil/fiscal adicionais (conta contabil, historico padrao, natureza).
4. Limite maximo de linhas por arquivo e necessidade de processamento assincrono.
5. Padrao de nome de arquivo.

## 3. AP-303 - Alertas operacionais

### 3.1 Escopo funcional minimo

1. Gerar alertas de vencimento e atraso de contas a pagar.
2. Gerar alertas de falha de conciliacao bancaria.
3. Gerar alertas de falha na integracao externa de pagamento (webhook/evento falho).
4. Exibir alertas no painel financeiro com contagem e lista.

### 3.2 Tipos de alerta sugeridos

1. `conta_vence_em_3_dias`
2. `conta_vencida`
3. `conciliacao_pendente_critica`
4. `webhook_pagamento_falha`
5. `exportacao_contabil_falha`

### 3.3 Regras de negocio sugeridas

1. Alerta deve ter severidade (`info|warning|critical`).
2. Alerta deve ter estado (`ativo|acknowledged|resolvido`).
3. Alertas duplicados para a mesma referencia devem ser consolidados.
4. Cada transicao de estado precisa de trilha de auditoria (`usuario`, `data`, `acao`).
5. Alertas devem respeitar permissao e escopo de empresa.

### 3.4 Pontos para validacao com Financeiro

1. Janela exata de vencimento (3, 5 ou 7 dias).
2. Definicao do que e "conciliacao critica".
3. Responsavel por acknowledgement dos alertas.
4. Necessidade de canais adicionais nesta fase (email/whatsapp) ou apenas painel.

## 4. Proximo passo sugerido

1. Validar esta minuta em reuniao curta com Financeiro + Contabil.
2. Fechar decisoes pendentes e congelar versao `v1` dos requisitos.
