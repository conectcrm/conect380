# FIN-NFSE-004 - Backlog Tecnico do Provedor Fiscal da Fase 1 de NFSe (2026-03)

Status: Backlog tecnico inicial para refinamento
Origem: derivado de `FIN-NFSE-002_CONTRATO_FUNCIONAL_FASE1_NFSE_SERVICO_2026-03.md`
Data: 2026-03
Escopo: Fiscal / integracao com provedor externo de NFSe de servico

## 1. Objetivo

Definir o backlog tecnico minimo para viabilizar a fase 1 de NFSe de servico via provedor fiscal externo, sem misturar essa decisao com o contrato funcional de negocio.

## 2. Premissas

- a fase 1 depende de provedor externo ou camada fiscal dedicada;
- o repositório nao mostra hoje implementacao fiscal pronta;
- a escolha do provedor impacta payload, callbacks, artefatos e fluxo de homologacao;
- o tenant e a rastreabilidade da origem comercial/financeira continuam obrigatorios.

## 3. Historias tecnicas propostas

### FINNFSE004-01 - Abstracao de provider fiscal

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - interface unica de emissao/consulta/cancelamento;
  - adaptadores por provider homologado;
  - normalizacao de retorno de sucesso, rejeicao e falha tecnica.
- Criterios de aceite:
  - o dominio fiscal nao depende diretamente do payload cru do provider;
  - troca futura de provider fica tecnicamente viavel.

### FINNFSE004-02 - Configuracao fiscal por tenant

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - armazenamento de configuracao fiscal minima por empresa;
  - suporte a ambiente homologacao/producao;
  - validacao de preflight antes da emissao.
- Criterios de aceite:
  - tenant sem configuracao minima nao consegue emitir;
  - tenant configurado consegue preparar emissao de forma auditavel.

### FINNFSE004-03 - Emissao e callback/consulta

- Tipo: Story
- Estimativa: 8 pontos
- Entregas:
  - solicitar emissao ao provider;
  - tratar polling ou callback do provider;
  - atualizar status interno para `emitida` ou `rejeitada`.
- Criterios de aceite:
  - retorno do provider atualiza a nota corretamente;
  - falha tecnica nao apaga rascunho.

### FINNFSE004-04 - Armazenamento de artefatos fiscais

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - persistir referencias a XML/PDF/protocolo;
  - proteger acesso a artefatos por tenant e permissao;
  - registrar metadados do provider.
- Criterios de aceite:
  - operacao consegue localizar artefatos da nota emitida;
  - artefatos nao vazam entre tenants.

### FINNFSE004-05 - Cancelamento e observabilidade

- Tipo: Story
- Estimativa: 5 pontos
- Entregas:
  - integrar cancelamento fiscal com provider;
  - registrar motivo de cancelamento e retorno tecnico;
  - logs e correlacao por origem/tenant.
- Criterios de aceite:
  - cancelamento e rastreavel;
  - falhas tecnicas ficam acionaveis para operacao.

## 4. Dependencias abertas

1. Escolher provider fiscal homologado para a fase 1.
2. Definir municipio/escopo inicial de operacao.
3. Definir artefatos obrigatorios: XML, PDF, protocolo, chave.
4. Definir se callback ou polling sera a estrategia principal.
5. Definir politica de retencao de documentos fiscais.

## 5. Fora de escopo deste backlog inicial

- NFe de produto;
- cobertura multi-provider simultanea obrigatoria;
- motor tributario nacional completo;
- SPED e obrigacoes acessorias ampliadas;
- contingencia fiscal completa multicanal.

## 6. Proximo documento necessario

- decisao formal de provider e arquitetura fiscal da fase 1;
- evidencias de homologacao do fluxo emitida/rejeitada/cancelada.

Resultado: a fase fiscal inicial passa a ter backlog tecnico do provider, reduzindo o risco de uma integracao improvisada.
