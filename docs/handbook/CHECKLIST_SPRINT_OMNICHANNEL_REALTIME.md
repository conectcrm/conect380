# Checklist de Sprints — Omnichannel Realtime (WebSocket)

Objetivo: consolidar o contrato de eventos do atendimento omnichannel (Socket.IO), garantir isolamento multi-tenant no tempo real, reduzir duplicações no frontend e encerrar a compatibilidade legada baseada em eventos com `_`.

## Escopo

Inclui:

- Contrato canônico de eventos (preferência por `:`)
- Isolamento por tenant (empresa) no realtime
- Padronização de payloads (principalmente tickets)
- Estratégia de compatibilidade legada com data de remoção
- Redução de duplicidade de conexões/hooks no frontend
- Checklist de testes manuais (smoke) e validações

Não inclui:

- Novas telas/UX (apenas estabilidade e padronização)
- Mudança de tema/layout
- Reescrever módulos inteiros (apenas ajustes incrementais)

## Onde está hoje (pontos de verdade)

Backend (emissão):

- `backend/src/modules/atendimento/gateways/atendimento.gateway.ts`
  - Emite canônicos: `mensagem:nova`, `ticket:novo`, `ticket:atualizado`
  - Emite legados (quando flag permite): `nova_mensagem`, `novo_ticket`, `ticket_atualizado`
  - Flag: `ATENDIMENTO_WS_EMIT_LEGACY_EVENTS` (default: habilitado; desligar com `false`)

Frontend (consumo canônico):

- `frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts` (hook “novo”, com singleton)
- `frontend-web/src/hooks/useWebSocket.ts` (hook “genérico”, separado)
- Listeners canônicos encontrados em:
  - `frontend-web/src/hooks/useChat.ts`
  - `frontend-web/src/hooks/useNotifications.ts`
  - `frontend-web/src/hooks/useMessagesRealtime.ts`
  - `frontend-web/src/hooks/useWhatsApp.ts`

Documentação existente:

- `docs/websocket-events.md` (documento principal de eventos)

---

# Sprint 1 — Hardening + Segurança Multi-tenant (Realtime)

Foco: garantir que o realtime não vaze eventos entre empresas e que o contrato canônico esteja “congelado” e bem documentado.

## 1) Contrato e documentação

- [ ] Atualizar `docs/websocket-events.md` com uma seção explícita “Compatibilidade Legada” contendo:
  - [ ] Lista de aliases legados ainda emitidos (ex.: `ticket_atualizado`)
  - [ ] Flag `ATENDIMENTO_WS_EMIT_LEGACY_EVENTS` e comportamento (default/on/off)
  - [ ] Prazo de remoção (Sprint 2)
- [ ] Declarar formalmente o contrato canônico mínimo (deve existir e permanecer estável):
  - [ ] `ticket:novo`
  - [ ] `ticket:atualizado`
  - [ ] `mensagem:nova`
  - [ ] `ticket:entrar` / `ticket:sair` (rooms)
  - [ ] `mensagem:digitando`

## 2) Isolamento multi-tenant no tempo real (crítico)

Problema atual (risco): há emissões globais via `this.server.emit(...)` no namespace, o que pode notificar usuários de outras empresas.

- [ ] Em `backend/src/modules/atendimento/gateways/atendimento.gateway.ts`:
  - [ ] Extrair `empresa_id`/`empresaId` do JWT no `handleConnection`
  - [ ] Guardar `empresaId` em `connectedClients`
  - [ ] Criar e usar “rooms por empresa”, por exemplo:
    - [ ] `empresa:${empresaId}` (broadcast da empresa)
    - [ ] `empresa:${empresaId}:atendentes` (fila/atendentes da empresa)
  - [ ] Trocar emissões globais por emissões por empresa quando o evento não for inerente a uma room específica:
    - [ ] `ticket:novo` → emitir em `empresa:${empresaId}` (ou `empresa:${empresaId}:atendentes` se fizer mais sentido)
    - [ ] `ticket:atualizado` → emitir em `empresa:${empresaId}`
    - [ ] `mensagem:nao-atribuida` → emitir em `empresa:${empresaId}:atendentes`
  - [ ] Manter emissões por ticket room (`ticket:${ticketId}`) para mensagens/status, mas garantir que apenas usuários da empresa possam chegar a esses eventos (Sprint 2 cobre autorização de join)

Critérios de aceite (Sprint 1):

- [ ] Usuário da Empresa A não recebe `ticket:novo`/`ticket:atualizado` disparado pela Empresa B
- [ ] Mensagem não atribuída notifica apenas atendentes da empresa correta

## 3) Payloads: consistência mínima

- [ ] Padronizar payload mínimo de ticket em `ticket:novo` e `ticket:atualizado`:
  - [ ] `id` (sempre presente)
  - [ ] `ticketId` (sempre presente; pode ser igual ao `id`)
  - [ ] `status` (string)
  - [ ] `updatedAt` (date/ISO)
  - [ ] Incluir `empresaId` quando existir no backend (ajuda debug e filtragem defensiva no frontend)

## 4) Smoke tests rápidos (manual)

- [ ] Rodar backend: `npm run start:dev`
- [ ] Abrir 2 sessões (Empresa A e Empresa B) no frontend (ou 2 browsers)
- [ ] Ações:
  - [ ] Criar ticket na Empresa A → apenas Empresa A recebe `ticket:novo`
  - [ ] Enviar mensagem na Empresa B → apenas Empresa B recebe `mensagem:nova`
  - [ ] Transferir/encerrar (se aplicável) → observar se chega via `ticket:atualizado` (não via eventos “soltos”)

---

# Sprint 2 — Remoção de Legado + Consolidação Frontend + Autorização de Rooms

Foco: remover compatibilidade `_`, reduzir duplicação de sockets no frontend e fechar brecha de “join de ticket por ID”.

## 1) Remover eventos legados `_`

- [ ] Em `backend/src/modules/atendimento/gateways/atendimento.gateway.ts`:
  - [ ] Remover emissões de `nova_mensagem`, `novo_ticket`, `ticket_atualizado`
  - [ ] Remover a flag `ATENDIMENTO_WS_EMIT_LEGACY_EVENTS` e o código condicionado
  - [ ] Atualizar `docs/websocket-events.md` removendo a seção de compatibilidade (ou marcando como removida)

## 2) Consolidar WebSocket hook (evitar múltiplas conexões)

Estado atual: existem pelo menos 2 hooks concorrentes.

- [ ] Decidir 1 hook canônico no frontend:
  - Opção A (recomendado): padronizar em `frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts` (singleton + token refresh)
  - Opção B: evoluir `frontend-web/src/hooks/useWebSocket.ts` e descontinuar o hook de `features/`
- [ ] Migrar consumidores para o hook canônico:
  - [ ] `frontend-web/src/hooks/useChat.ts`
  - [ ] `frontend-web/src/hooks/useMessagesRealtime.ts`
  - [ ] `frontend-web/src/hooks/useNotifications.ts`
  - [ ] `frontend-web/src/hooks/useWhatsApp.ts`
- [ ] Garantir que há no máximo 1 conexão socket por sessão autenticada (exceto páginas explicitamente isoladas)

## 3) Autorização de rooms (ticket:entrar / ticket:sair)

Risco atual: qualquer usuário conectado pode tentar entrar em `ticket:{ticketId}` se souber o ID.

- [ ] No `ticket:entrar` do gateway:
  - [ ] Validar que o ticket pertence ao tenant do usuário
  - [ ] Validar que o usuário tem permissão (role/escopo) para acessar o ticket
  - [ ] Só então permitir `client.join(room)`

Observação: para validar com RLS, será necessário definir um contexto de tenant para consultas originadas do WebSocket (ex.: usar QueryRunner e executar `set_current_tenant(...)` antes de consultar).

## 4) Remover eventos “fantasma” no frontend

- [ ] No hook `frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts`:
  - [ ] Remover listeners `ticket_transferido` e `ticket_encerrado` (não há emissão no backend hoje)
  - [ ] Tratar transfer/encerramento via `ticket:atualizado` (status + campos)

## 5) Checklist de validação (Sprint 2)

- [ ] Com `ATENDIMENTO_WS_EMIT_LEGACY_EVENTS` inexistente/sempre desligado: sistema continua funcionando
- [ ] Nenhum `socket.on('ticket_atualizado'|'novo_ticket'|'nova_mensagem')` restante no frontend
- [ ] Usuário de outra empresa não consegue “forçar join” e receber eventos de ticket

---

## Notas de execução

- Prioridade de segurança: isolamento multi-tenant no realtime é bloqueante.
- Prioridade de estabilidade: consolidar hooks no frontend reduz bugs intermitentes (duplicação de listeners, mensagens duplicadas, leaks de memória).

## Referências úteis

- Eventos e rooms: `docs/websocket-events.md`
- Gateway: `backend/src/modules/atendimento/gateways/atendimento.gateway.ts`
- Hook omnichannel: `frontend-web/src/features/atendimento/omnichannel/hooks/useWebSocket.ts`
- Hook genérico: `frontend-web/src/hooks/useWebSocket.ts`
