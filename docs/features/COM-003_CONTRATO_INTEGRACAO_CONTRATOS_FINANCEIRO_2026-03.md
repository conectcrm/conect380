# COM-003 - Contrato de Integracao Contratos -> Financeiro (v1)

Status: Aprovado para baseline de integracao
Origem: derivado de `COM-001_CONTRATO_FUNCIONAL_MODULO_CONTRATOS_2026-03.md`
Data: 2026-03
Escopo: Contratos, Faturas, Pagamentos e sincronizacao de status

## 1. Objetivo

Definir a fronteira oficial de integracao entre o modulo Contratos e o dominio Financeiro, evitando que contrato, fatura e pagamento se confundam como uma unica entidade.

## 2. Principios

- Contrato e a origem comercial/juridica da obrigacao.
- Fatura e o documento financeiro de cobranca vinculado a um contrato.
- Pagamento e o evento financeiro que baixa parcial ou totalmente uma fatura.
- O contrato nao persiste campos financeiros operacionais como se fossem colunas nativas do dominio.
- Toda integracao deve respeitar `empresa_id` e rastreabilidade cross-modulo.

## 3. Relacoes oficiais entre dominios

### 3.1 Contrato -> Fatura

- uma fatura pode referenciar um `contratoId`;
- um contrato pode originar uma ou varias faturas ao longo do tempo;
- a fatura deve carregar tambem `clienteId` e `usuarioResponsavelId` coerentes com o contexto do contrato ou da operacao financeira.

### 3.2 Fatura -> Pagamento

- uma fatura pode ter zero, um ou varios pagamentos;
- o pagamento atualiza o estado financeiro da fatura;
- o contrato recebe reflexo indireto desse estado por integracao, nunca por escrita financeira direta no contrato bruto.

## 4. Operacoes de integracao v1

### 4.1 Gerar fatura automatica a partir de contrato assinado

Referencia tecnica atual:

- `GerarFaturaAutomaticaDto` em `backend/src/modules/faturamento/dto/fatura.dto.ts`
- `gerarFaturaAutomatica` em `backend/src/modules/faturamento/services/faturamento.service.ts`

Regras:

- somente contrato elegivel pode gerar fatura automatica;
- contrato deve estar `assinado` para gerar fatura automaticamente;
- a fatura gerada deve herdar `contratoId`, `clienteId`, `usuarioResponsavelId` e descricao coerente com o contrato;
- o tipo da fatura pode variar conforme `condicoesPagamento` do contrato.

### 4.2 Criacao manual de fatura com referencia de contrato

Regras:

- `CreateFaturaDto` pode receber `contratoId` opcional;
- quando `contratoId` for informado, o Financeiro deve validar que o contrato pertence ao tenant;
- nao e permitido vincular fatura a contrato inexistente ou de outro tenant.

### 4.3 Sincronizacao de status

Regras minimas:

- alteracoes relevantes de pagamento/fatura devem refletir no contexto comercial por integracao controlada;
- a matriz de status entre contrato/proposta/fatura/pagamento deve ser normalizada por backlog especifico do fluxo Vendas -> Financeiro;
- divergencias devem ir para trilha auditavel e, quando necessario, fila de excecoes operacionais.

## 5. Campos minimos de integracao

### 5.1 Do contrato para o Financeiro

- `id`
- `numero`
- `clienteId`
- `empresa_id`
- `usuarioResponsavelId`
- `objeto`
- `valorTotal`
- `condicoesPagamento`
- `status`

### 5.2 Da fatura para referencia ao contrato

- `contratoId`
- `numero`
- `status`
- `valorTotal`
- `valorPago`
- `dataEmissao`
- `dataVencimento`

## 6. Regras de elegibilidade

- contrato cancelado nao deve originar nova fatura automatica;
- contrato nao assinado nao deve gerar fatura automatica no fluxo padrao;
- fatura vinculada a contrato deve preservar coerencia de tenant;
- pagamento nunca substitui assinatura do contrato;
- cancelamento financeiro nao equivale automaticamente a cancelamento juridico do contrato sem regra explicita.

## 7. Fora de escopo deste contrato de integracao v1

- politica fiscal de NFe/NFSe;
- estorno juridico/comercial completo do contrato;
- renegociacao automatica de cobranca;
- aditivos contratuais refletidos automaticamente em faturas historicas;
- analise contabil completa.

## 8. Observabilidade e auditoria

- integracoes devem usar `correlationId`/`origemId` quando o fluxo cruzar contrato, fatura e pagamento;
- eventos criticos devem ser rastreaveis em auditoria cross-modulo;
- falhas de sincronizacao devem ser direcionadas para mecanismos operacionais do backlog AP304.

## 9. Dependencias e riscos abertos

1. Pendencias legadas de schema e multi-tenancy entre Contrato e Fatura ainda exigem monitoramento tecnico.
2. A matriz final de transicoes comerciais/financeiras ainda depende do backlog AP304.
3. Assinatura eletronica continua sendo subdominio separado e nao deve ser inferida a partir de pagamento.

## 10. Evidencias atuais de suporte

1. Contrato funcional do modulo Contratos: `docs/features/COM-001_CONTRATO_FUNCIONAL_MODULO_CONTRATOS_2026-03.md`
2. Backlog tecnico do fluxo integrado: `docs/features/AP304_FECHAMENTO_FLUXO_VENDAS_FINANCEIRO_BACKLOG_2026-03.md`
3. Fatura possui `contratoId` e validacao de tenant no backend de faturamento.
4. Fluxo de geracao automatica de fatura a partir de contrato assinado ja existe no backend.

## 11. Proximos documentos necessarios

- checklist de QA dedicado da integracao Contratos -> Financeiro;
- refinamento da matriz oficial de status entre Contrato, Fatura e Pagamento;
- contrato especifico para acoplamento com NFe/NFSe quando existir emissao fiscal.

Resultado: Contratos e Financeiro passam a ter fronteira e regras de integracao explicitas, reduzindo ambiguidade entre documento comercial, cobranca e pagamento.
