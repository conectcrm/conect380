# Plano de Correcao - Integracoes da Tela de Cotacoes (Compras Internas)

## Objetivo

Estabilizar as integracoes que suportam o fluxo:

1. Solicitante cria cotacao
2. Envia para aprovacao
3. Aprovador decide
4. Cotacao aprovada vira pedido
5. Financeiro/Compras marca compra concluida (pagamento externo)

## Status Geral

- `CotacaoPage` e `cotacaoService`: base funcional e padronizada em `layout-v2`
- Integracoes satelite: parcialmente prontas
- Principais gaps restantes:
  - permissao cruzada entre modulos (Comercial / Financeiro / Users)
  - telas satelite fora do padrao `layout-v2`
  - `ContasPagarPage` sem backend/frontend reais (mock)

## Fase 1 (estabilidade de contrato e bugs funcionais) - Executada

### Entregas

- Alinhamento do `fornecedorService` com backend:
  - `id` como `string` (UUID)
  - filtro `busca` (com alias legado `nome`)
  - `alternarStatus` adaptado para endpoints reais (`desativar` / `PUT { ativo: true }`)
  - exclusao em lote com fallback sequencial (sem endpoint bulk)
- `FornecedoresPage` ajustada para selecao/exclusao por UUID (`string`)
- `MinhasAprovacoesPage`:
  - rota de retorno do empty state corrigida para `/vendas/cotacoes`
  - estado de erro visual com CTA de retry
  - remocao de `max-w-*` local em rota `LIST`

### Beneficio

- Reduz falhas de integracao entre Cotacao -> Fornecedores
- Corrige bug de navegacao em aprovacoes
- Melhora aderencia parcial ao requisito de estados da tela

## Fase 2 (critica) - Permissoes e Gating do Fluxo

Status: executada no codigo (QA por perfil ainda pendente)

### Entregas ja implementadas

- Backend `cotacao.controller` com:
  - `PermissionsGuard` no controller
  - permissao padrao `comercial.propostas.read`
  - overrides granulares em endpoints de create/update/delete/send/aprovacao/importacao/anexos
- `CotacaoPage` com gating visual de acoes por permissao:
  - criar, editar, excluir, enviar para aprovacao
  - aprovar/rejeitar em lote
- `ModalDetalhesCotacao` com gating adicional de editar/excluir/enviar por email
- `menuConfig` da rota `/vendas/cotacoes` ajustado para nao exigir CRM em `match: all`
- item de menu "Cotacoes" ajustado para permissao de `read` (em vez de `create`)
- Endpoint agregado no dominio `cotacao` para metadata de criacao/edicao (`fornecedores` + `aprovadores`)
- `ModalCadastroCotacao` passou a consumir metadata da propria `cotacao`, removendo dependencia direta de permissao dos modulos de `fornecedores` e `users`

### Pendencias desta fase

- Validar fluxo por perfil real (solicitante, aprovador, financeiro) em QA manual/E2E

### Problema tratado

A tela de cotacoes dependia de endpoints de:

- `fornecedores` (financeiro)
- `users` (usuarios/aprovadores)

Isso causava risco de bloqueio do perfil comercial ao abrir o modal de cadastro/edicao.

### Correcao proposta

1. Definir perfis e permissoes por etapa do fluxo
   - Solicitante (criar/editar/enviar)
   - Aprovador (aprovar/reprovar)
   - Compras/Financeiro (converter pedido / marcar adquirido)

2. Padronizar autorizacao no backend de `cotacao`
   - aplicar `PermissionsGuard` nos endpoints sensiveis ainda sem permissao granular
   - separar permissoes por acao (`read`, `create`, `update`, `delete`, `approve`, `purchase`)

3. Ajustar `menuConfig` da rota `/vendas/cotacoes`
   - remover acoplamento indevido com permissoes de CRM que nao sao obrigatorias para compras internas
   - evitar `match: 'all'` com permissoes heterogeneas que bloqueiam perfis validos

4. Adicionar gating de acoes na UI da `CotacaoPage`
   - esconder/desabilitar `Novo`, `Editar`, `Excluir`, `Aprovar`, `Enviar para aprovacao` por permissao
   - manter feedback consistente quando a API negar acao

5. Expor metadata de criacao/edicao pelo dominio `cotacao`
   - fornecedores ativos e aprovadores ativos da empresa
   - evitar dependencia direta de permissao de modulos satelite na abertura do modal

### Criterio de aceite

- Perfil comercial consegue criar/enviar cotacao sem depender de permissao financeira completa
- Perfil aprovador consegue analisar e decidir
- Perfil financeiro/compras consegue marcar adquirido sem ter acesso indevido a CRUD completo

## Fase 3 - Padronizacao `layout-v2` das telas satelite

Status: executada no codigo

### Entregas ja implementadas

- `MinhasAprovacoesPage` migrada para `layout-v2`:
  - `SectionCard + PageHeader + InlineStats`
  - `FiltersBar`
  - estados `loading / erro / vazio`
  - `DataTableCard` com toolbar
  - responsividade `cards mobile + tabela desktop`
  - `thead` sticky e checkbox de cabecalho com estado parcial (`indeterminate`)
- `FornecedoresPage` migrada para `layout-v2`:
  - `SectionCard + PageHeader + InlineStats`
  - `FiltersBar`
  - estados `loading / erro / vazio`
  - `DataTableCard` com toolbar e acoes em massa
  - responsividade `cards mobile + tabela desktop`
  - `thead` sticky e checkbox de cabecalho com estado parcial (`indeterminate`)
- `ContasPagarPage` migrada para `layout-v2` (mantendo dados mock):
  - `SectionCard + PageHeader + InlineStats`
  - `FiltersBar`
  - estados `loading / erro / vazio`
  - `DataTableCard` com toolbar e acoes em massa
  - responsividade `cards mobile + tabela desktop`
  - `thead` sticky e checkbox de cabecalho com estado parcial (`indeterminate`)

### Prioridade

1. `MinhasAprovacoesPage` (concluida)
2. `FornecedoresPage` (concluida)
3. `ContasPagarPage` (concluida)

### Requisitos (LIST)

- `SectionCard + PageHeader + InlineStats`
- `FiltersBar`
- `DataTableCard`
- estados `loading / erro / vazio`
- responsividade `cards mobile + tabela desktop`
- sem `max-w-*` local em rotas `LIST`

## Fase 4 - Integracao real de Contas a Pagar

### Situacao atual

- Backend `contas-pagar` (CRUD basico + registrar pagamento + resumo) implementado
- `contasPagarService` frontend implementado e `ContasPagarPage` conectada a API real
- `ModalContaPagar` aceita fornecedores reais (fallback para mock se carga falhar)
- Entidade/schema `ContaPagar` expandida para persistir campos ricos da UI (numero, categoria, prioridade, valores detalhados, tags, anexos, etc.)
- Integracao semi-automatica iniciada: cotacao com `pedido_gerado` pode gerar `conta a pagar` e gravar vinculo em `metadados.compra`

### Correcao proposta

1. Validar fluxo semi-automatico `cotacao -> conta a pagar` em QA por perfil (Financeiro)
2. Definir se o fluxo sera:
   - manual (usuario cria conta a pagar a partir da cotacao)
   - semi-automatico (acao "Gerar conta a pagar" na cotacao)
3. Adicionar testes de integracao da API de `contas-pagar`
4. Opcional: gerar conta a pagar automaticamente no `converter-pedido` (feature flag/regra por empresa)

## Fase 5 - Pedido de Compra real (substituir pedido sintetico)

### Situacao atual

- `converterEmPedido` gera identificador sintetico (`PED-...`) e grava metadados

### Correcao proposta

1. Criar entidade `pedido_compra`
2. Persistir itens/fornecedor/valores provenientes da cotacao
3. Relacionar `cotacao -> pedido_compra`
4. Criar tela/listagem de pedidos de compra

## Ordem recomendada de execucao

1. Fase 2 (permissoes/gating)
2. Fase 3 (padronizacao de telas satelite)
3. Fase 4 (contas a pagar real)
4. Fase 5 (pedido de compra real)

## Risco conhecido se parar agora

- Fluxo de cotacao funciona, mas com risco de bloqueio indevido por permissao (ou acesso amplo demais em alguns cenarios)
- Integracao com contas a pagar continua conceitual (sem operacao real)
