# Fluxo Proposto: Cotações para Compras Internas

## Objetivo

Padronizar o fluxo de cotação de compras internas:

1. Funcionário cria a cotação de insumos/produtos para uso interno
2. Cotação é enviada para aprovação
3. Responsável aprova ou reprova
4. Após aprovação, a cotação é convertida em pedido
5. Pagamento acontece fora do sistema
6. Sistema registra conclusão da compra (ex.: `adquirido`)

## Máquina de Estados Proposta (alvo)

### Estados

- `rascunho`
- `pendente_aprovacao`
- `em_analise_aprovacao` (opcional, se houver fila/triagem)
- `rejeitada`
- `aprovada`
- `pedido_gerado`
- `aguardando_pagamento_externo` (opcional)
- `adquirido` (ou `comprado`)
- `cancelada`

### Transições permitidas

- `rascunho -> pendente_aprovacao`
- `pendente_aprovacao -> em_analise_aprovacao` (opcional)
- `pendente_aprovacao -> aprovada`
- `pendente_aprovacao -> rejeitada`
- `em_analise_aprovacao -> aprovada`
- `em_analise_aprovacao -> rejeitada`
- `rejeitada -> rascunho` (ajuste e reenvio)
- `aprovada -> pedido_gerado`
- `pedido_gerado -> aguardando_pagamento_externo` (opcional)
- `pedido_gerado -> adquirido`
- `aguardando_pagamento_externo -> adquirido`
- `* -> cancelada` (com regra de permissão)

## Mapeamento com o modelo atual (incremental, sem quebra)

### Fase 1 (baixo risco, sem migration)

Usar os estados já existentes e complementar com metadados:

- `rascunho` -> `rascunho`
- `pendente_aprovacao` -> `pendente`
- `em_analise_aprovacao` -> `em_analise`
- `rejeitada` -> `rejeitada`
- `aprovada` -> `aprovada`
- `pedido_gerado` -> `convertida`
- `aguardando_pagamento_externo` -> `convertida` + `metadados.compra.status = 'aguardando_pagamento_externo'`
- `adquirido` -> `convertida` + `metadados.compra.status = 'adquirido'`

Vantagem:

- evita alterar enum no banco imediatamente
- permite começar o fluxo operacional completo

Limitação:

- `convertida` passa a representar múltiplas etapas de compra (precisa ler `metadados`)

### Fase 2 (modelo ideal, com migration)

Expandir `StatusCotacao` com estados específicos de compras:

- `pedido_gerado`
- `aguardando_pagamento_externo`
- `adquirido`

E migrar registros antigos:

- `convertida` -> `pedido_gerado` (ou derivar por `metadados`)

## Mudanças mínimas recomendadas no código (próximo passo)

### Backend (`backend/src/cotacao`)

- `cotacao.service.ts`
  - manter aprovação/reprovação apenas pelos endpoints específicos
  - adicionar endpoint/serviço para marcar compra externa:
    - `registrarPedidoGerado`
    - `marcarPagamentoExternoPendente` (opcional)
    - `marcarAdquirido`
  - persistir evidências em `metadados`:
    - número do pedido externo
    - data da compra
    - observação de pagamento externo

- `cotacao.controller.ts`
  - expor rotas dedicadas ao fluxo de compras (evitar `alterarStatus` genérico para estados críticos)

- `entities/cotacao.entity.ts`
  - Fase 1: usar `metadados`
  - Fase 2: ampliar `StatusCotacao`

- `dto/cotacao.dto.ts`
  - DTOs específicos para:
    - conversão em pedido
    - marcação de compra concluída
    - observações de pagamento externo

### Frontend (`frontend-web/src`)

- `services/cotacaoService.ts`
  - adicionar chamadas específicas:
    - `converterEmPedido`
    - `marcarAdquirido` (futuro)
    - `marcarPagamentoExternoPendente` (futuro, opcional)

- `ModalDetalhesCotacao.tsx`
  - botões condicionais por etapa:
    - `Aprovar/Rejeitar` quando `pendente|em_analise`
    - `Converter em Pedido` quando `aprovada`
    - `Marcar como Adquirido` quando `convertida` (Fase 1) ou `pedido_gerado`

- `CotacaoPage.tsx`
  - evitar ações em massa para etapas que exigem validação forte (já alinhado para aprovação/reprovação)

## Regras de permissão sugeridas

- Criador:
  - criar/editar `rascunho`
  - enviar para aprovação

- Aprovador:
  - aprovar/reprovar somente `pendente|em_analise`

- Compras/Financeiro:
  - converter em pedido
  - marcar etapa de compra/pagamento externo
  - marcar `adquirido`

## Observações

- `pagamento` fora do sistema não impede controle de processo:
  - o sistema pode registrar somente o status operacional e observações
- para auditoria, registrar usuário/data em cada transição crítica
