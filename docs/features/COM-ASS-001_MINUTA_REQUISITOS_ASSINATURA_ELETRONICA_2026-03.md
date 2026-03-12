# COM-ASS-001 - Minuta de Requisitos para Assinatura Eletronica

Status: Minuta inicial para refinamento
Origem: lacuna formal registrada em `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
Data: 2026-03
Escopo: Comercial / Contratos / assinatura digital

## 1. Objetivo

Separar o subdominio de assinatura eletronica do modulo Contratos, definindo requisitos minimos antes de qualquer acoplamento adicional com provedores externos.

## 2. Premissas

- assinatura eletronica nao e sinonimo de contrato;
- assinatura e um fluxo de validacao/aceite associado ao documento;
- requisitos juridicos, experiencia do assinante e evidencias precisam ser rastreados.

## 3. Escopo funcional minimo esperado

### 3.1 Preparar assinatura

O sistema deve conseguir:

- vincular um documento contratual;
- definir signatarios;
- gerar status inicial de assinatura.

### 3.2 Coletar assinatura

O fluxo deve suportar ao menos uma modalidade inicial claramente definida.

Exemplos para refinamento:

- assinatura interna com aceite autenticado;
- assinatura externa com link seguro;
- confirmacao manual de retorno de provedor.

### 3.3 Atualizar status do contrato

Assinatura concluida, rejeitada ou expirada deve refletir no subfluxo do contrato sem apagar historico.

## 4. Estados minimos do subdominio

- pendente;
- enviada;
- assinada;
- rejeitada;
- expirada;
- cancelada.

## 5. Dados e evidencias minimas

- identificador do contrato/documento;
- signatario e canal de envio;
- data de envio;
- data da conclusao ou rejeicao;
- hash ou referencia do documento assinado;
- log de eventos do fluxo.

## 6. Fora de escopo desta minuta inicial

- adequacao juridica por jurisdicao detalhada;
- cadeia ICP-Brasil completa;
- multipla rubrica com workflow complexo;
- carimbo do tempo qualificado como obrigatorio;
- biometria e validacao documental avancada.

## 7. Dependencias para contrato v1

- definir modelo juridico aceito pela operacao;
- definir provider externo, se houver;
- definir expiracao, reenvio e rejeicao;
- definir evidencias minimas que precisam ser persistidas;
- definir checklist de QA e homologacao.

## 8. Criterios de aceite de uma futura v1

- iniciar fluxo de assinatura para contrato valido;
- acompanhar status sem ambiguidade;
- concluir assinatura com evidencia minima persistida;
- tratar expiracao e rejeicao sem perda de historico;
- refletir resultado no modulo Contratos.

## 9. Proximos documentos necessarios

- contrato funcional v1 do fluxo de assinatura escolhido;
- backlog tecnico de integracao com provedor;
- checklist de validacao juridica e operacional.

Resultado: assinatura eletronica deixa de ser promessa vaga e passa a ter escopo minimo para refinamento controlado.
