# COM-008 - Backlog Tecnico de Provider Externo para Assinatura Eletronica (2026-03)

Status: Backlog tecnico inicial para refinamento
Origem: derivado de `COM-005_CONTRATO_FUNCIONAL_ASSINATURA_ELETRONICA_2026-03.md`
Data: 2026-03
Escopo: Contratos / assinatura eletronica / provider externo opcional

## 1. Objetivo

Definir o backlog tecnico minimo para uma futura integracao formal com provider externo de assinatura eletronica, preservando o fluxo tokenizado interno como baseline do v1.

## 2. Premissas

- o backend atual ja cobre fluxo tokenizado interno e confirmacao externa/manual;
- provider externo e evolucao opcional, nao requisito do v1;
- a entidade de contrato e a de assinatura continuam sendo o dominio principal;
- integracao externa nao deve reduzir rastreabilidade, tenant ou capacidade de rollback operacional.

## 3. Historias tecnicas propostas

### COM008-01 - Abstracao de provider de assinatura

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - interface unica de envio, consulta de status e cancelamento;
  - adaptadores por provider homologado;
  - normalizacao de status externo para estados internos oficiais.
- Criterios de aceite:
  - o dominio interno nao depende de payload cru do provider;
  - troca de provider futuro permanece tecnicamente viavel.

### COM008-02 - Configuracao por tenant e credenciais

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - armazenamento seguro de configuracao por empresa;
  - suporte a ambientes distintos quando o provider oferecer homologacao/producao;
  - validacao preflight antes de envio externo.
- Criterios de aceite:
  - tenant sem configuracao nao dispara assinatura externa;
  - tenant configurado consegue validar conectividade e escopo minimo.

### COM008-03 - Disparo de envelope/documento externo

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - gerar artefato compativel com provider;
  - enviar envelope/documento para signatarios;
  - persistir `externalSignatureId` ou referencia equivalente.
- Criterios de aceite:
  - assinatura enviada ao provider fica vinculada ao contrato interno;
  - falha de envio nao marca assinatura como concluida.

### COM008-04 - Callback, polling e conciliacao de status

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - tratar webhook ou polling do provider;
  - converter eventos externos para `pendente`, `assinado`, `rejeitado`, `expirado`;
  - reconciliar divergencias com rastreabilidade.
- Criterios de aceite:
  - status externo atualiza assinatura interna de forma auditavel;
  - evento duplicado ou fora de ordem nao quebra o contrato.

### COM008-05 - Evidencias e artefatos do provider

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - persistir comprovantes, hashes e artefatos relevantes;
  - armazenar referencias a certificado/relatorio do provider quando disponivel;
  - associar evidencias ao contrato e a assinatura.
- Criterios de aceite:
  - operacao consegue auditar a assinatura externa sem perder contexto interno;
  - evidencias respeitam tenant e permissao.

### COM008-06 - Cancelamento, erro e rollback operacional

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - cancelar solicitacao externa quando aplicavel;
  - tratar timeouts, recusas tecnicas e falhas de callback;
  - garantir rollback coerente entre contrato e assinatura em cenario de falha obrigatoria.
- Criterios de aceite:
  - operacao diferencia erro tecnico, rejeicao do signatario e expiracao;
  - falha externa nao deixa contrato em estado indevido sem trilha operacional.

## 4. Dependencias abertas

1. Escolher provider inicial homologado.
2. Definir nivel juridico/evidencial minimo exigido.
3. Definir se o provider substitui ou complementa o fluxo tokenizado interno.
4. Definir politica de armazenamento de artefatos e comprovantes.

## 5. Fora de escopo deste backlog inicial

- multi-provider com roteamento automatico;
- ICP-Brasil completa obrigatoria;
- workflow juridico complexo com varias rubricas paralelas;
- prova de vida e biometria.

## 6. Proximo documento necessario

- decisao formal do provider inicial e contrato funcional da fase externa, se aprovada.

Resultado: a evolucao para provider externo deixa de ser uma intencao vaga e passa a ter backlog tecnico controlado, sem contaminar o baseline do fluxo interno atual.
