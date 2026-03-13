# Decisao de Fluxo - Fechamento de Oportunidades no Pipeline - 2026-03

## Objetivo

Definir um fluxo operacional coerente para fechamento de oportunidades no Pipeline CRM, sem misturar a visao operacional de abertas com a visao historica de fechadas.

## Decisoes aprovadas

1. A visao padrao do Pipeline continua sendo `Abertas`.
2. A visao `Abertas` mostra apenas estagios operacionais:
   - `Leads`
   - `Qualificacao`
   - `Proposta`
   - `Negociacao`
   - `Fechamento`
3. `Ganho` e `Perdido` deixam de depender de coluna visivel na visao `Abertas`.
4. O fechamento passa a acontecer por acoes explicitas no card e no modal de detalhes.
5. A visao `Fechadas` passa a ser a area de consulta e reabertura de oportunidades encerradas.

## Regras operacionais

1. Drag and drop no Kanban continua restrito a movimentacoes entre estagios abertos.
2. `Marcar como ganho`:
   - disponivel para oportunidades abertas em `Fechamento`;
   - encerra a oportunidade e a move para a visao `Fechadas`.
3. `Marcar como perdido`:
   - disponivel por acao explicita;
   - exige motivo de perda obrigatorio;
   - encerra a oportunidade e a move para a visao `Fechadas`.
4. `Reabrir`:
   - disponivel apenas para oportunidades encerradas;
   - retorna a oportunidade para `Fechamento`.
5. `Arquivar`, `Restaurar` e `Lixeira` continuam no fluxo de lifecycle, separados do fechamento comercial.

## Regras de UX

1. Cards em `Fechamento` exibem acoes rapidas de `Ganho` e `Perdido`.
2. Cards em outros estagios mantem o fechamento via menu de acoes e modal de detalhes.
3. O modal de edicao nao deve permitir fechar a oportunidade por selecao direta de estagio terminal.
4. O modal de detalhes e o menu de acoes devem expor o fluxo de fechamento de forma explicita.

## Impacto esperado

1. Eliminar a contradicao entre filtro `Abertas` e colunas `Ganho/Perdido`.
2. Tornar o fluxo de fechamento mais claro para o usuario.
3. Preservar auditoria e motivo obrigatorio para perdas.
4. Reduzir ambiguidade entre `estagio` comercial e `lifecycle_status`.
