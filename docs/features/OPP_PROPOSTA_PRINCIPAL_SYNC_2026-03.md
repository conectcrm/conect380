# OPP - Sincronizacao de Proposta Principal com Oportunidade

## Objetivo
Estabelecer um modelo hibrido entre `oportunidades` e `propostas`, onde:

- a oportunidade continua sendo a entidade operacional do pipeline
- a proposta continua tendo fluxo comercial proprio
- somente a `proposta principal` influencia automaticamente o estagio da oportunidade

## Regras

### Vinculo
- uma oportunidade pode ter varias propostas vinculadas
- apenas uma proposta pode ser a `principal`
- a proposta criada a partir da pipeline nasce vinculada a oportunidade de origem
- quando o rascunho e gerado pela pipeline, ele passa a ser a proposta principal

### Sincronizacao automatica
- `rascunho` da proposta principal: oportunidade avanca ate `Proposta`
- `enviada`, `visualizada`, `negociacao`: oportunidade avanca ate `Negociacao`
- `aprovada`, `contrato_gerado`: oportunidade avanca ate `Fechamento`
- `contrato_assinado`, `fatura_criada`, `aguardando_pagamento`, `pago`: oportunidade avanca ate `Ganho`

### Regras de seguranca
- a sincronizacao nunca faz rollback automatico de estagio
- oportunidade `ganha`, `perdida`, `arquivada` ou `excluida` nao e reaberta automaticamente
- `rejeitada` e `expirada` nao marcam `Perdido` automaticamente
- nesses casos, a UI apenas sinaliza que a oportunidade deve ser avaliada para perda

## Experiencia de uso

### Listagem de propostas
- propostas vinculadas exibem a oportunidade associada
- a proposta principal recebe badge `Principal`
- propostas vinculadas nao principais exibem a acao `Definir principal`

### Pipeline
- cards exibem resumo da proposta principal quando houver
- se a proposta principal estiver `rejeitada` ou `expirada`, o card mostra alerta de avaliacao para perda

## Impacto tecnico
- `propostas.oportunidade_id` segue sendo o vinculo estrutural
- `oportunidades.proposta_principal_id` define qual proposta dirige a sincronizacao
- a mudanca de estagio da oportunidade reutiliza o servico de oportunidades para preservar historico e stage events
