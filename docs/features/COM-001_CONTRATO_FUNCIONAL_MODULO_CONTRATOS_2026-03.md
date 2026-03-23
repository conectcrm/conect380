# COM-001 - Contrato Funcional do Modulo Contratos (v1)

Status: Aprovado para baseline funcional
Origem: lacuna identificada em `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
Data: 2026-03
Escopo: Backend `contratos` + integracao com propostas, cliente, PDF e assinatura

## 1. Objetivo

Definir o contrato funcional minimo do modulo Contratos como dominio proprio, separando claramente:

- contrato juridico/comercial;
- proposta de origem;
- assinatura do contrato;
- faturamento posterior.

## 2. Principios

- Todo contrato pertence a uma `empresa_id`.
- Contrato pode nascer de proposta, mas continua sendo entidade autonoma.
- Assinatura eletronica e um subfluxo do contrato, nao substitui o contrato.
- Fatura, cobranca e pagamento pertencem ao dominio Financeiro e nao sao colunas do contrato.
- PDF e hash documental sao artefatos do contrato, nao o contrato em si.

## 3. Entidade funcional `contrato`

### 3.1 Campos obrigatorios

- `id` (inteiro, gerado pelo sistema)
- `numero` (string unica)
- `clienteId` (uuid)
- `empresa_id` (uuid)
- `usuarioResponsavelId` (uuid)
- `tipo` (`servico` | `produto` | `misto` | `manutencao`)
- `status` (`aguardando_assinatura` | `assinado` | `cancelado` | `expirado`)
- `objeto` (text)
- `valorTotal` (decimal)
- `dataInicio` (date)
- `dataFim` (date)
- `dataVencimento` (date)
- `ativo` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### 3.2 Campos opcionais

- `propostaId` (uuid)
- `dataAssinatura` (date)
- `observacoes` (text)
- `clausulasEspeciais` (text)
- `condicoesPagamento` (json)
- `caminhoArquivoPDF` (text)
- `hashDocumento` (text)

## 4. Operacoes obrigatorias do modulo v1

### 4.1 Criar contrato

Endpoint de referencia: `POST /contratos`

Payload minimo:

- `clienteId`
- `usuarioResponsavelId`
- `tipo`
- `objeto`
- `valorTotal`
- `dataInicio`
- `dataFim`
- `dataVencimento`

Opcional:

- `propostaId`
- `observacoes`
- `clausulasEspeciais`
- `condicoesPagamento`

### 4.2 Listar contratos

Endpoint de referencia: `GET /contratos`

Filtros minimos:

- `status`
- `clienteId`
- `propostaId`
- `dataInicio`
- `dataFim`

### 4.3 Buscar contrato por identificador

Endpoints de referencia:

- `GET /contratos/:id`
- `GET /contratos/numero/:numero`

### 4.4 Atualizar contrato

Endpoint de referencia: `PUT /contratos/:id`

Regra:

- permitir ajuste apenas dos campos editaveis do DTO vigente;
- preservar identidade, tenant e historico de assinatura.

### 4.5 Cancelar contrato

Endpoint de referencia: `DELETE /contratos/:id`

Regra:

- cancelamento exige motivo quando politicas comerciais exigirem;
- cancelamento nao equivale a exclusao fisica do historico juridico.

## 5. Subfluxos associados

### 5.1 PDF do contrato

O sistema pode gerar e expor PDF do contrato como artefato do dominio.

### 5.2 Assinatura do contrato

O contrato pode passar por fluxo de assinatura interna ou externa.

Regra:

- a assinatura altera estado do contrato, mas nao redefine o contrato funcional base.

### 5.3 Faturamento posterior

O contrato pode originar faturas, cobrancas ou recorrencias.

Regra:

- esse desdobramento pertence ao dominio Financeiro e requer contratos proprios entre modulos.

## 6. Fora de escopo deste contrato v1

- politica juridica completa por tipo de assinatura;
- motor de clausulas versionadas;
- renegociacao automatica;
- aditivos contratuais completos;
- fiscalizacao NFe/NFSe;
- governanca de cobranca recorrente detalhada.

## 7. Regras de seguranca e acesso

- autenticacao obrigatoria;
- isolamento por `empresa_id` obrigatorio;
- permissoes comerciais de leitura, criacao, edicao e exclusao;
- endpoints publicos de assinatura externa devem ser regidos por fluxo proprio e validacao dedicada.

## 8. Criterios de aceite minimos

- criar contrato a partir de dados comerciais validos;
- listar e filtrar por status e cliente;
- consultar por `id` e por `numero`;
- atualizar clausulas, observacoes e prazos sem corromper o contrato;
- cancelar contrato com rastreabilidade.

## 9. Backlog imediatamente derivado

- COM-002: checklist funcional e QA do modulo Contratos.
- COM-003: contrato de integracao entre Contratos e Financeiro.
- COM-004: reconciliar contrato funcional com multi-tenancy pendente no legado tecnico.
- COM-005: alinhar fluxo de assinatura eletronica ao contrato especifico do subdominio.

Resultado: Contratos deixa de existir apenas como extensao do fluxo proposta -> fechamento e passa a ter contrato funcional minimo v1.
