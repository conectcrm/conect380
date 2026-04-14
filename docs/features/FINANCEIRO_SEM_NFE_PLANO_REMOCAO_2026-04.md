# Financeiro Sem NFe - Plano de Remocao (2026-04)

## Contexto
- Escopo atual do financeiro: faturas comerciais, recibos, links de pagamento, boletos (quando habilitado), baixa manual/online e PDF.
- Escopo fora da fase atual: emissao fiscal NF-e/NFS-e, integracao com autorizador fiscal, preflight fiscal e webhooks fiscais.

## Regras de negocio deste estagio
1. O sistema nao deve depender de provider fiscal para operar faturamento.
2. Documento financeiro valido no fluxo principal: `fatura`, `recibo`, `folha_pagamento`, `outro`.
3. Estados fiscais (`rascunho`, `emitida`, `cancelada`, etc.) nao fazem parte do fluxo operacional atual.
4. Webhook fiscal publico nao deve processar eventos quando fiscal estiver desligado.
5. Frontend nao deve induzir o usuario a operacoes fiscais quando o modulo fiscal estiver fora do escopo.

## Recursos removidos/ocultados nesta entrega
- Frontend
  - Bloco "Documento Fiscal" no modal de detalhes de fatura deixa de aparecer quando fiscal estiver desabilitado.
  - Modal de criacao/edicao permanece focado em documento financeiro interno (sem aviso de NF desabilitada).
  - Flag de fiscal foi endurecida para manter `fiscalDocumentsEnabled=false` nesta fase, independente de env.
- Backend
  - Endpoints fiscais (`/faturamento/**/documento-fiscal/**`) foram removidos do controller principal.
  - Controller de webhook fiscal publico foi removido do modulo de faturamento.
  - Flag de fiscal foi endurecida para manter `fiscalDocumentsEnabled=false` nesta fase, independente de env.
- Configuracao
  - Baselines `*.full.example` ajustadas para fiscal desligado por padrao neste estagio.

## Recursos que permanecem no codigo para fase futura
1. DTOs e servicos de documento fiscal.
2. Estrutura de diagnostico/preflight fiscal.
3. Campos de configuracao fiscal em empresa/configuracoes.

## Criterio de pronto para este estagio
1. Usuario financeiro nao visualiza operacoes de emissao NF na jornada padrao.
2. Nenhuma chamada fiscal e executada em ambiente com fiscal desligado.
3. Fluxo financeiro essencial roda integralmente sem dependencia de modulo fiscal.
