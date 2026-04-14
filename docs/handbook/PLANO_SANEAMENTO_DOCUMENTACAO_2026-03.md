# Plano de Saneamento da Documentacao - 2026-03

## 1. Objetivo

Listar exatamente quais arquivos hoje merecem:

1. arquivamento;
2. rotulagem explicita de escopo;
3. revisao ou reescrita;
4. consolidacao em fonte de verdade unica.

Este plano foi derivado da matriz em `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md` e da auditoria de documentacao atual.

## 2. Regras de decisao

### Arquivar

Aplicar quando o documento:

1. descreve estado antigo como se fosse atual;
2. conflita diretamente com evidencias recentes de codigo/testes;
3. nao deve mais ser usado como base de implementacao.

### Rotular escopo

Aplicar quando o documento continua util, mas pode ser confundido com documento principal do produto.

### Reescrever

Aplicar quando o documento tem valor, mas a mensagem atual induz decisao errada de produto ou arquitetura.

### Consolidar

Aplicar quando varios documentos cobrem o mesmo dominio sem uma fonte de verdade clara.

## 3. Arquivos prioritarios para acao

| Prioridade | Arquivo | Acao recomendada | Motivo |
| --- | --- | --- | --- |
| P0 | QUICKSTART.md | Reescrever parcialmente | Ja esta melhor alinhado com suite all-in-one, mas ainda precisa manter explicitamente o recorte de modulos e evitar leituras tacitas de "estado pronto" para todos os modulos. |
| P0 | backend/INDICE_DOCUMENTACAO.md | Rotular escopo no topo | Hoje parece indice geral, mas e indice de subsistema de tickets/WhatsApp. |
| P0 | docs/handbook/ROADMAP_MODULO_LEADS_CRM.md | Arquivar ou marcar como historico | Conflita com evidencias atuais do backend que ja validam Leads. |
| P0 | README.md | Revisar promessas futuras | Promete recursos sem requisito formal vigente localizado, como NFe/NFSe, assinatura eletronica e agenda/analytics completos. |
| P1 | docs/ROADMAP_OMNICHANNEL.md | Rotular escopo e status | Documento util, mas deve ser apresentado como roadmap do modulo Atendimento, nao do produto inteiro. |
| P1 | docs/README.md | Reescrever estrutura e escopo | Ainda privilegia historico de implementacao e webhook; serve pouco como guia atual de fonte de verdade. |
| P1 | docs/INDICE_DOCUMENTACAO.md | Ajuste fino de governanca | Deve linkar explicitamente para matriz de cobertura e para este plano de saneamento. |
| P1 | docs/implementation/AGENDA_INTEGRADA_NOTIFICACOES.md | Rotular como documentacao de implementacao | Nao deve ser lido como contrato funcional do modulo Agenda. |
| P1 | docs/handbook/AUDITORIA_DOCUMENTACAO_ATUAL.md | Atualizar recorte 2026-03 | A auditoria continua util, mas precisa referenciar os gaps atuais de requisitos futuros. |
| P2 | docs/features/PROPOSTA_ADMINISTRACAO_BACKOFFICE_CONECT360_2026-03.md | Manter e promover como referencia | Ja esta forte; pode virar exemplo de baseline de requisito/backlog por dominio. |

## 4. Acoes detalhadas por arquivo

### 4.1 QUICKSTART.md

Status: revisar

Acao:

1. manter como entrada tecnica de setup;
2. adicionar bloco curto de escopo no topo dizendo que Quick Start nao equivale a declaracao de prontidao de todos os modulos;
3. linkar explicitamente para:
   - `README.md`;
   - `VISAO_SISTEMA_2025.md`;
   - `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`.

Risco atual:

1. onboarding rapido sem distinguir setup tecnico de maturidade funcional por modulo.

### 4.2 backend/INDICE_DOCUMENTACAO.md

Status: rotular escopo

Acao:

1. inserir banner no topo:
   - "Indice documental do subsistema de Tickets/WhatsApp";
   - "Nao e a fonte principal do produto inteiro".
2. adicionar link para `docs/INDICE_DOCUMENTACAO.md` e `docs/handbook/MAPA_MODULOS_TECNICOS.md`.

Risco atual:

1. novos agentes/devs assumirem que o produto e primariamente WhatsApp/tickets.

### 4.3 docs/handbook/ROADMAP_MODULO_LEADS_CRM.md

Status: arquivar ou marcar como historico

Acao:

1. adicionar aviso no topo: "Documento historico";
2. apontar para evidencias atuais de backend/testes;
3. se houver versao vigente, substituir por novo documento de estado real;
4. se nao houver versao vigente, criar uma nota curta de reconciliacao antes de arquivar.

Risco atual:

1. o arquivo declara Leads como gap critico e 0%, contrariando evidencias recentes.

### 4.4 README.md

Status: revisar promessas futuras

Acao:

1. manter posicionamento comercial da suite;
2. identificar explicitamente o que e:
   - implementado;
   - parcialmente implementado;
   - roadmap condicionado a requisito futuro;
3. evitar que promessas sem contrato formal soem como backlog pronto para execucao.

Pontos de atencao:

1. NFe/NFSe;
2. assinatura eletronica;
3. calendario com sincronizacao externa;
4. analytics/relatorios como modulo geral;
5. email como canal omnichannel completo.

### 4.5 docs/ROADMAP_OMNICHANNEL.md

Status: rotular escopo

Acao:

1. reforcar no topo que se trata do modulo Atendimento;
2. adicionar link para `VISAO_SISTEMA_2025.md` e `docs/INDICE_DOCUMENTACAO.md`;
3. evitar que seja usado como roadmap dominante do produto.

### 4.6 docs/README.md

Status: reescrever

Acao:

1. transformar em guia de navegacao documental atual;
2. reduzir enfase em historico de implementacao e webhook;
3. apontar para:
   - indice principal;
   - handbook;
   - matriz de cobertura;
   - areas de features vigentes.

Risco atual:

1. a pagina ainda induz leitura por pastas historicas, nao por fonte de verdade.

### 4.7 docs/INDICE_DOCUMENTACAO.md

Status: ajustar governanca

Acao:

1. adicionar secao "Fonte de verdade para requisitos";
2. linkar:
   - `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`;
   - `docs/handbook/PLANO_SANEAMENTO_DOCUMENTACAO_2026-03.md`;
   - `docs/features/` como area primaria de requisitos vigentes.

### 4.8 docs/implementation/AGENDA_INTEGRADA_NOTIFICACOES.md

Status: rotular implementacao

Acao:

1. manter o documento;
2. inserir banner dizendo que o arquivo descreve implementacao e nao substitui contrato funcional do modulo Agenda;
3. referenciar futuro documento de requisitos da Agenda quando existir.

### 4.9 docs/handbook/AUDITORIA_DOCUMENTACAO_ATUAL.md

Status: atualizar

Acao:

1. manter a auditoria de alinhamento all-in-one;
2. incluir novo bloco de risco sobre:
   - promessas de produto sem requisito formal;
   - divergencia Leads;
   - lacuna de contratos para Agenda, NFe/NFSe e assinatura eletronica.

## 5. Arquivos que NAO devem ser usados como base primaria de implementacao de requisito

Mesmo quando uteis, estes tipos de arquivo nao devem ser tratados como contrato funcional:

1. `docs/implementation/*.md`;
2. `docs/runbooks/*.md`;
3. `docs/features/evidencias/*.md`;
4. documentos historicos em `docs/archive/`;
5. docs de subsistema isolado fora de `docs/features/`, exceto quando explicitamente marcados como fonte vigente.

## 6. Ordem recomendada de execucao

### Fase 1 - Reducao imediata de ambiguidade

1. rotular `backend/INDICE_DOCUMENTACAO.md`;
2. revisar `README.md`;
3. marcar `docs/handbook/ROADMAP_MODULO_LEADS_CRM.md` como historico ou reconciliado;
4. reescrever `docs/README.md`.

### Fase 2 - Governanca de fonte de verdade

1. ajustar `docs/INDICE_DOCUMENTACAO.md`;
2. atualizar `docs/handbook/AUDITORIA_DOCUMENTACAO_ATUAL.md`;
3. rotular `docs/ROADMAP_OMNICHANNEL.md` e `docs/implementation/AGENDA_INTEGRADA_NOTIFICACOES.md`.

### Fase 3 - Fechamento das lacunas de requisitos futuros

1. criar contrato funcional da Agenda;
2. criar contrato funcional de Contratos como modulo autonomo;
3. criar minuta de requisitos de NFe/NFSe;
4. criar minuta de requisitos de assinatura eletronica;
5. criar backlog funcional do canal Email no Omnichannel.

## 7. Resultado esperado

Ao final do saneamento, um agente de IA ou desenvolvedor novo deve conseguir responder com baixa ambiguidade:

1. qual e a visao oficial do produto;
2. qual documento e a fonte de verdade de cada modulo;
3. o que esta implementado versus o que ainda e roadmap;
4. quais promessas futuras ainda nao podem virar implementacao sem contrato funcional.
