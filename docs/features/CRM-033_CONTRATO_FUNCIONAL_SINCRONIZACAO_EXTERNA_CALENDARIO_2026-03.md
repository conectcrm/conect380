# CRM-033 - Contrato Funcional de Sincronizacao Externa de Calendario (v1)

Status: Aprovado para baseline funcional
Origem: evolucao de `CRM-032_BACKLOG_TECNICO_SINCRONIZACAO_EXTERNA_CALENDARIO_2026-03.md`
Data: 2026-03
Escopo: Agenda / sincronizacao externa / primeiro provider

## 1. Objetivo

Definir o contrato funcional v1 da sincronizacao externa de calendario para a Agenda do CRM, estabelecendo fronteiras, ownership, direcao inicial de sync e politica minima de conflito.

## 2. Decisoes de fase do v1

- o v1 cobre um unico provider inicial por rollout controlado;
- o provider inicial e Google Calendar;
- a direcao inicial e CRM -> provider externo, com importacao externa limitada apenas ao que for explicitamente habilitado em fase posterior;
- a Agenda interna do CRM continua sendo a fonte primaria de verdade do evento;
- o v1 nao fecha sincronizacao bidirecional completa como requisito obrigatorio.

## 3. Principios

- sincronizacao externa e extensao da Agenda, nao substituicao do dominio interno;
- eventos internos devem continuar usaveis mesmo se o provider externo falhar;
- ownership do evento precisa ser rastreavel por tenant, usuario e provider;
- conflito nao pode gerar loop de atualizacao;
- rollout deve ser controlado por tenant/usuario/provider.

## 4. Entidades funcionais do subdominio

### 4.1 Conexao externa de calendario

Campos minimos:

- `id`
- `empresaId`
- `usuarioId`
- `provider` (`google_calendar`)
- `calendarId`
- `status` (`ativa` | `revogada` | `expirada` | `erro`)
- `escoposConcedidos`
- `ultimaSincronizacaoEm`
- `createdAt`
- `updatedAt`

### 4.2 Vinculo de evento externo

Campos minimos:

- `id`
- `agendaEventoId`
- `provider`
- `calendarId`
- `externalEventId`
- `direction` (`outbound`)
- `status` (`pendente` | `sincronizado` | `erro` | `desvinculado`)
- `ultimaTentativaEm`
- `ultimaSincronizacaoEm`
- `hashVersaoExterna` ou referencia equivalente

## 5. Operacoes obrigatorias do v1

### 5.1 Conectar calendario externo

Objetivo:

- permitir que usuario elegivel autorize o provider inicial para exportacao de eventos do CRM.

Regras:

- a conexao deve respeitar tenant e usuario;
- conexao revogada ou expirada nao pode seguir sincronizando;
- credenciais invalidas devem resultar em status operacional rastreavel.

### 5.2 Desconectar calendario externo

Objetivo:

- encerrar a sincronizacao futura sem apagar o historico interno da Agenda.

Regras:

- desconexao deve desabilitar novas exportacoes;
- eventos ja existentes no CRM nao podem ser perdidos;
- o sistema deve manter trilha auditavel da desconexao.

### 5.3 Exportar evento do CRM para Google Calendar

Objetivo:

- criar ou atualizar evento externo correspondente ao evento interno elegivel.

Campos elegiveis do evento:

- titulo
- descricao
- data/hora de inicio
- data/hora de fim
- local
- participantes elegiveis

Regras:

- apenas eventos internos elegiveis e vinculados a conexao ativa podem ser exportados;
- falha externa nao invalida o evento interno;
- exportacao deve persistir vinculo entre evento interno e `externalEventId`.

### 5.4 Reexportar ou atualizar evento sincronizado

Regras:

- alteracoes no CRM atualizam o evento externo vinculado quando a conexao estiver ativa;
- se o vinculo externo estiver corrompido ou ausente, a operacao deve ir para erro rastreavel, sem sobrescrever dados internos de forma silenciosa.

### 5.5 Cancelar ou desvincular exportacao

Regras:

- cancelamento ou exclusao do evento interno deve refletir a politica definida para o provider inicial;
- no v1, a prioridade e impedir evento zumbi no Google Calendar quando o evento interno foi explicitamente cancelado pelo CRM;
- falha externa de cancelamento nao pode reativar evento interno cancelado.

## 6. Politica oficial de ownership e conflito do v1

- o CRM e a fonte de verdade do v1;
- alteracoes feitas no Google Calendar nao retornam automaticamente ao CRM como requisito do v1;
- se houver divergencia entre CRM e provider, prevalece o estado do CRM na proxima exportacao autorizada;
- qualquer futura bidirecionalidade exigira contrato proprio de fase seguinte.

## 7. Seguranca, isolamento e observabilidade

- conexao, vinculo e logs devem respeitar `empresaId`;
- deve existir rastreabilidade por tenant, usuario, provider e evento interno;
- erro de autenticacao, erro de provider e erro de mapeamento devem ser distinguiveis;
- rollout deve poder ser desligado sem degradar a Agenda interna.

## 8. Fora de escopo deste contrato v1

- Outlook como provider obrigatorio na mesma fase;
- sincronizacao bidirecional completa;
- recorrencia avancada multi-provider;
- importacao historica massiva;
- reserva de salas, recursos e disponibilidade inteligente.

## 9. Criterios de aceite minimos

- conectar Google Calendar para usuario/tenant elegivel;
- exportar evento interno elegivel com criacao do vinculo externo;
- atualizar evento externo a partir de alteracao interna;
- impedir que falha externa corrompa o evento interno;
- permitir desconexao sem perder historico da Agenda;
- registrar erros operacionais de forma auditavel.

## 10. Backlog imediatamente derivado

- CRM-034: checklist de QA e sign-off da sincronizacao externa v1.
- CRM-035: backlog tecnico da fase bidirecional/importacao externa controlada.

Resultado: a sincronizacao externa deixa de ser apenas backlog aberto e passa a ter contrato funcional v1 com provider inicial, ownership e direcao de sync definidos.
