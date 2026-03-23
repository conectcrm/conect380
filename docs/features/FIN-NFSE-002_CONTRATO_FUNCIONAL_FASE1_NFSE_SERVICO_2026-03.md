# FIN-NFSE-002 - Contrato Funcional Fase 1 de NFSe de Servico (2026-03)

Status: Aprovado para baseline funcional de fase inicial
Origem: evolucao de `FIN-NFE-001_MINUTA_REQUISITOS_NFE_NFSE_2026-03.md`
Data: 2026-03
Escopo: Fiscal / Financeiro / emissao inicial de NFSe de servico

## 1. Objetivo

Definir a primeira fase funcional suportada para o dominio fiscal do Conect360, reduzindo ambiguidade entre NFe e NFSe e evitando que a promessa fiscal vire implementacao genérica sem contrato.

## 2. Decisao de fase

Para a fase 1, o escopo oficial fica restrito a:

- NFSe de servico;
- emissao sob demanda manual/assistida;
- integracao com provedor externo fiscal;
- rastreabilidade a partir de documento comercial/financeiro elegivel.

Racional desta fase:

- o repositorio hoje nao apresenta suporte tecnico fiscal implementado;
- o dominio comercial atual ja trabalha com contratos cujo tipo pode ser `servico`, `produto`, `misto` ou `manutencao`;
- uma primeira fase por NFSe de servico reduz escopo regulatorio e evita misturar o contrato inicial com NFe de mercadoria.

## 3. Principios

- NFSe nao e extensao trivial de fatura ou pagamento;
- a fase 1 nao cobre NFe de produto;
- emissao fiscal depende de provedor externo ou camada fiscal dedicada;
- contrato, fatura e pagamento continuam sendo dominios de origem, nao substitutos da nota fiscal;
- toda emissao precisa ser auditavel por tenant.

## 4. Entidade funcional esperada do dominio fiscal v1

### 4.1 Campos minimos obrigatorios

- `id` (identificador interno da nota)
- `empresa_id`
- `tipoDocumento = nfse`
- `status` (`rascunho` | `pendente_emissao` | `emitida` | `rejeitada` | `cancelada`)
- `clienteId` ou referencia ao tomador
- `origemTipo` (`contrato` | `fatura` | `emissao_manual`)
- `origemId`
- `servicos` (itens de servico elegiveis)
- `valorTotal`
- `createdAt`
- `updatedAt`

### 4.2 Campos minimos opcionais

- `contratoId`
- `faturaId`
- `numeroNota`
- `protocolo`
- `chaveAcesso` ou identificador do provedor
- `xmlUrl` ou referencia ao XML armazenado
- `pdfUrl` ou referencia ao DANFSe/PDF
- `motivoRejeicao`
- `metadataProvedor`
- `dataEmissao`
- `dataCancelamento`

## 5. Operacoes obrigatorias da fase 1

### 5.1 Preparar rascunho fiscal

O sistema deve conseguir montar um rascunho fiscal a partir de origem elegivel.

Origens permitidas na fase 1:

- contrato de servico elegivel;
- fatura elegivel;
- emissao manual autorizada.

Regras:

- origem deve pertencer ao tenant;
- origem precisa conter dados minimos do cliente/tomador e do servico;
- sistema nao deve emitir NFSe sem validacao minima de elegibilidade.

### 5.2 Solicitar emissao ao provedor externo

Regras:

- emissao deve partir de `rascunho` para `pendente_emissao`;
- retorno do provedor deve atualizar a nota para `emitida` ou `rejeitada`;
- falha tecnica deve ser auditavel sem perder o rascunho.

### 5.3 Consultar status da NFSe

O sistema deve permitir consultar:

- status atual;
- numero/protocolo;
- motivo de rejeicao quando houver;
- artefatos associados (XML/PDF) quando disponiveis.

### 5.4 Cancelar NFSe emitida

Regras:

- cancelamento depende das regras do provedor/município suportado;
- cancelamento deve manter historico e motivacao;
- cancelamento fiscal nao implica automaticamente estorno financeiro ou cancelamento juridico do contrato.

## 6. Elegibilidade da fase 1

Uma emissao fiscal da fase 1 so pode ocorrer quando:

- a origem estiver vinculada ao tenant correto;
- houver cliente/tomador identificado;
- houver item/objeto de servico elegivel;
- houver configuracao fiscal minima da empresa emissora;
- houver provider fiscal homologado para a fase.

## 7. Fronteira de dominio

- Contratos:
  - fornecem contexto comercial/juridico e podem originar emissao elegivel.
- Faturamento:
  - fornece documento financeiro e dados de cobranca, mas nao substitui a NFSe.
- Fiscal:
  - controla emissao, retorno de provedor, protocolo, rejeicao e cancelamento.

## 8. Fora de escopo desta fase 1

- NFe de produto;
- emissao automatica full sem validacao humana;
- cobertura nacional de todos os municipios e cenarios fiscais;
- XML legado retroativo;
- SPED e obrigacoes acessorias ampliadas;
- contingencia fiscal multiambiente detalhada;
- reconciliacao tributaria completa.

## 9. Criterios de aceite minimos

- criar rascunho fiscal NFSe a partir de origem elegivel;
- impedir emissao sem dados minimos do tomador/servico;
- solicitar emissao ao provedor com rastreabilidade;
- registrar retorno como `emitida` ou `rejeitada`;
- consultar numero/protocolo/motivo de rejeicao sem ambiguidade;
- cancelar nota emitida mantendo historico auditavel.

## 10. Dependencias abertas da fase 1

1. Escolher provedor fiscal homologado.
2. Definir municipio/escopo inicial de operacao.
3. Definir configuracao fiscal minima da empresa emissora.
4. Definir regra de gatilho oficial entre contrato, fatura e emissao manual.
5. Definir politica de armazenamento de XML/PDF/protocolo.

## 11. Backlog imediatamente derivado

- FIN-NFSE-003: checklist de QA e sign-off da fase 1 de NFSe.
- FIN-NFSE-004: backlog tecnico de integracao com provedor fiscal.
- FIN-NFSE-005: contrato funcional futuro de NFe de produto, se entrar em roadmap.

Resultado: o dominio fiscal deixa de estar apenas em minuta genérica e passa a ter primeira fase funcional explicitamente escolhida e delimitada.
