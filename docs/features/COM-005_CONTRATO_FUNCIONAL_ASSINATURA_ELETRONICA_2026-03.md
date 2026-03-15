# COM-005 - Contrato Funcional de Assinatura Eletronica (v1)

Status: Aprovado para baseline funcional
Origem: evolucao de `COM-ASS-001_MINUTA_REQUISITOS_ASSINATURA_ELETRONICA_2026-03.md`
Data: 2026-03
Escopo: Contratos / assinaturas / confirmacao manual externa

## 1. Objetivo

Definir o contrato funcional v1 do subdominio de assinatura eletronica associado ao modulo Contratos, com base na superficie efetivamente observada no backend.

## 2. Principios

- assinatura eletronica e subdominio do fluxo de contrato, nao substitui o contrato;
- o contrato continua sendo a entidade comercial/juridica principal;
- a assinatura registra evidencias, status e identidade do signatario;
- o v1 cobre o fluxo tokenizado interno e a confirmacao externa/manual ja suportada pelo backend;
- pagamento e faturamento nao equivalem a assinatura.

## 3. Entidade funcional `assinatura_contrato`

### 3.1 Campos obrigatorios

- `id` (inteiro, gerado pelo sistema)
- `contratoId` (inteiro)
- `usuarioId` (uuid)
- `tipo` (`digital` | `eletronica` | `presencial`)
- `status` (`pendente` | `assinado` | `rejeitado` | `expirado`)
- `createdAt` (timestamp)

### 3.2 Campos opcionais

- `certificadoDigital` (text)
- `hashAssinatura` (text)
- `ipAssinatura` (text)
- `userAgent` (text)
- `dataAssinatura` (timestamp)
- `motivoRejeicao` (text)
- `metadados` (json)
- `tokenValidacao` (text)
- `dataEnvio` (timestamp)
- `dataExpiracao` (timestamp)

## 4. Estados oficiais do fluxo v1

- `pendente`: solicitacao criada e ainda nao processada;
- `assinado`: assinatura concluida e persistida;
- `rejeitado`: assinatura recusada pelo fluxo do signatario;
- `expirado`: prazo expirado antes da conclusao.

## 5. Operacoes obrigatorias do subdominio v1

### 5.1 Criar solicitacao de assinatura

Endpoint de referencia: `POST /contratos/:id/assinaturas`

Payload base:

- `contratoId`
- `usuarioId`
- `tipo`
- `certificadoDigital` opcional
- `metadados` opcionais
- `dataExpiracao` opcional

Regras:

- contrato deve existir;
- contrato deve estar `aguardando_assinatura`;
- nao pode existir assinatura pendente duplicada para o mesmo usuario e contrato;
- o sistema gera `tokenValidacao` unico;
- o sistema registra `dataEnvio` e prazo de expiracao.

### 5.2 Consultar assinatura por contrato

Endpoint de referencia: `GET /contratos/:id/assinaturas`

Regra:

- listar assinaturas vinculadas ao contrato em ordem util para auditoria.

### 5.3 Consultar contexto de assinatura por token

Endpoint de referencia: `GET /contratos/assinar/:token`

Regras:

- token invalido deve ser rejeitado;
- token expirado deve atualizar o status para `expirado` quando aplicavel;
- a consulta deve retornar contexto suficiente do contrato/assinatura para o fluxo do signatario.

### 5.4 Processar assinatura tokenizada

Endpoint de referencia: `POST /contratos/assinar/processar`

Payload base:

- `tokenValidacao`
- `hashAssinatura`
- `ipAssinatura` opcional
- `userAgent` opcional
- `metadados` opcionais

Regras:

- somente assinaturas `pendente` podem ser processadas;
- token expirado nao pode ser processado;
- ao concluir, a assinatura vira `assinado` e registra evidencias de conclusao;
- o sistema verifica se o contrato deve refletir assinatura concluida;
- em falha de sincronizacao obrigatoria, deve haver rollback do estado da assinatura processada.

### 5.5 Rejeitar assinatura tokenizada

Endpoint de referencia: `POST /contratos/assinar/rejeitar`

Payload base:

- `tokenValidacao`
- `motivoRejeicao`

Regras:

- somente assinaturas `pendente` podem ser rejeitadas;
- a rejeicao deve persistir motivo auditavel.

### 5.6 Confirmar assinatura externa/manual

Endpoint de referencia: `POST /contratos/:id/confirmar-assinatura-externa`

Payload observado:

- `dataAssinatura` opcional
- `observacoes` opcionais

Regras:

- contrato cancelado ou expirado nao pode ser confirmado;
- data de assinatura nao pode ser invalida nem futura;
- o sistema precisa identificar usuario valido para registrar a confirmacao;
- a confirmacao gera registro de assinatura persistido e atualiza o contrato;
- em falha de sincronizacao obrigatoria, deve haver rollback do contrato e da assinatura criada.

## 6. Reflexos no contrato

- o contrato inicia em `aguardando_assinatura` quando depende de assinatura;
- assinatura valida pode atualizar o contrato para `assinado`;
- cancelamento do contrato invalida ou expira assinaturas pendentes conforme regra do service;
- historico de assinatura nao deve ser apagado por atualizacao operacional comum.

## 7. Evidencias minimas obrigatorias do v1

- hash ou referencia de assinatura quando processada;
- data da conclusao ou rejeicao;
- `ipAssinatura` e `userAgent` quando disponiveis;
- metadados opcionais do dispositivo/contexto;
- motivo de rejeicao quando houver;
- token de validacao e data de expiracao para fluxo pendente.

## 8. Fora de escopo deste contrato v1

- ICP-Brasil completa;
- biometria e prova de vida;
- multipla rubrica em workflow complexo;
- orquestracao multi-provider com roteamento automatico;
- carimbo do tempo qualificado como requisito obrigatorio.

## 9. Criterios de aceite minimos

- criar solicitacao de assinatura para contrato elegivel;
- impedir duplicidade de assinatura pendente por usuario;
- processar assinatura por token com persistencia de evidencias;
- rejeitar assinatura com motivo auditavel;
- expirar token vencido;
- confirmar assinatura externa/manual com rollback quando integracoes obrigatorias falharem;
- refletir assinatura valida no estado do contrato.

## 10. Backlog imediatamente derivado

- COM-007: checklist de QA do fluxo de assinatura eletronica.
- COM-008: backlog tecnico de provider externo, se a operacao adotar integracao formal.
- COM-009: alinhamento juridico e operacional das evidencias minimas exigidas.

Resultado: assinatura eletronica deixa de ser apenas minuta e passa a ter contrato funcional v1 alinhado ao backend existente.
