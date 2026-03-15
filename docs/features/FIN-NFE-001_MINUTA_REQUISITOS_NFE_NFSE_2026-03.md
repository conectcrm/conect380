# FIN-NFE-001 - Minuta de Requisitos para NFe / NFSe

Status: Minuta inicial para refinamento
Origem: lacuna formal registrada em `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
Data: 2026-03
Escopo: Financeiro / Fiscal

## 1. Objetivo

Definir o baseline de requisitos para emissao e acompanhamento de NFe/NFSe sem permitir implementacao oportunistica baseada apenas em promessa de roadmap.

## 2. Premissas

- NFe/NFSe nao e extensao trivial de fatura ou pagamento.
- O dominio fiscal exige contrato proprio, integracao externa e trilha de auditoria.
- A primeira versao deve distinguir claramente nota fiscal de produto e nota fiscal de servico.

## 3. Escopo funcional minimo esperado

### 3.1 Gatilho de emissao

O sistema deve definir quando uma nota pode ser emitida.

Exemplos possiveis para refinamento:

- apos pagamento confirmado;
- apos fechamento comercial/fatura validada;
- por emissao manual autorizada.

### 3.2 Dados fiscais minimos

O dominio deve considerar no minimo:

- empresa emissora;
- cliente/tomador;
- itens/servicos;
- valores, impostos e natureza da operacao;
- municipio/UF quando aplicavel;
- referencia ao documento comercial de origem.

### 3.3 Estado da nota

Estados minimos esperados:

- rascunho;
- pendente de emissao;
- emitida;
- rejeitada;
- cancelada.

### 3.4 Auditoria e consulta

O sistema deve permitir:

- consultar numero e situacao da nota;
- registrar protocolo, chave e motivo de rejeicao;
- manter historico de tentativas.

## 4. Fronteira de dominio

- Financeiro:
  - documento comercial de origem e conciliacao economica.
- Fiscal:
  - regras de emissao, validacao governamental, protocolo e cancelamento.
- Contratos:
  - podem originar base comercial, mas nao substituem o dominio fiscal.

## 5. Fora de escopo desta minuta inicial

- cobertura completa de todos os municipios brasileiros;
- calculo tributario nacional completo;
- contingencia fiscal multiambiente detalhada;
- importacao retroativa de XML legado;
- SPED e obrigacoes acessorias ampliadas.

## 6. Perguntas obrigatorias para o contrato v1

- qual nota sera suportada primeiro: NFe, NFSe ou ambas por fases?
- a emissao sera interna ou via provedor externo?
- qual e o gatilho oficial de emissao?
- qual o modelo de cancelamento e estorno?
- qual o nivel minimo de armazenamento de XML/PDF e protocolo?

## 7. Criterios de aceite de uma futura v1

- emitir nota do tipo suportado com rastreabilidade;
- registrar chave/protocolo e retorno do provedor;
- consultar status sem ambiguidade;
- tratar rejeicao com motivo auditavel;
- impedir emissao sem dados minimos validados.

## 8. Proximos documentos necessarios

- contrato funcional v1 por tipo de nota suportado;
- backlog tecnico de integracao fiscal;
- checklist de QA e homologacao fiscal.

Resultado: NFe/NFSe deixa de ser apenas promessa aberta e passa a ter baseline de refinamento obrigatorio.
