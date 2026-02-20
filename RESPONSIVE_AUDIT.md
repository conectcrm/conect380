# RESPONSIVE_AUDIT

## Escopo e criterio
- Breakpoints validados: 320, 360, 375, 390, 414, 430.
- Escopo limitado ao grafo ativo mapeado em `USED_UI_INVENTORY.md`.
- Auditoria aplicada apenas em rotas/componentes alcancaveis por runtime.

## Evidencia objetiva (Fase C)
- Data da validacao: 2026-02-20.
- Comando executado:
  - `npx playwright test e2e/mobile-responsiveness-smoke.spec.ts --project=chromium --reporter=list`
- Resultado:
  - `1 passed`
- Arquivo de validacao automatizada:
  - `e2e/mobile-responsiveness-smoke.spec.ts`
- Reteste de estabilidade (2026-02-20):
  - `frontend-web`: `CI=true npm test -- --watch=false --runInBand` -> `13 passed`
  - `backend`: `npm test -- --runInBand` -> `16 passed`
  - `e2e`: `npx playwright test e2e/mobile-responsiveness-smoke.spec.ts --project=chromium --reporter=list` -> `1 passed`

---

Rota: /atendimento/inbox

Status: ✅ OK

Problema:
- Antes do ajuste, em mobile havia risco de bloqueio de navegacao por lista/chat.
- Breakpoints testados: 320, 360, 375, 390, 414, 430.

Impacto:
- P0 potencial (navegacao principal do inbox).

Causa provavel:
- Fluxo mobile da coluna de lista estava acoplado ao layout desktop.

Correcao sugerida:
- Aplicada.
- Arquivo: `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx`
- Componente: `ChatOmnichannel`
- Trechos relevantes:
  - `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx:1053` (`mobileView === 'list' ? 'flex' : 'hidden'`)
  - `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx:1068` (`mobileView === 'chat' ? 'flex' : 'hidden'`)
  - `frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx:1075` (`Voltar para lista`)

Prioridade: P0 (Resolvido)

---

Rota: /vendas/propostas

Status: ✅ OK

Problema:
- Antes do ajuste, barra de selecao multipla podia exceder viewport em mobile.
- Breakpoints testados: 320, 360, 375, 390, 414, 430.

Impacto:
- P1 potencial (acoes em massa parcialmente cortadas).

Causa provavel:
- Largura minima fixa e sem adaptacao mobile-first.

Correcao sugerida:
- Aplicada.
- Arquivo: `frontend-web/src/features/propostas/components/SelecaoMultipla.tsx`
- Componente: `SelecaoMultipla`
- Trecho relevante:
  - `frontend-web/src/features/propostas/components/SelecaoMultipla.tsx:125`
  - Classe: `w-[calc(100vw-1rem)] ... sm:min-w-[400px] ... min-w-0` com `flex-wrap`

Prioridade: P1 (Resolvido)

---

Rota: /configuracoes/empresa

Status: ✅ OK

Problema:
- Antes do ajuste, spans de 2 colunas podiam gerar desalinhamento em grid de 1 coluna no mobile.
- Breakpoints testados: 320, 360, 375, 390, 414, 430.

Impacto:
- P1 potencial (formulario principal).

Causa provavel:
- Uso de `col-span-2` sem escopo de breakpoint.

Correcao sugerida:
- Aplicada.
- Arquivo: `frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx`
- Componente: `ConfiguracaoEmpresaPage`
- Trechos relevantes:
  - `frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx:456`
  - `frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx:541`
  - `frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx:565`
  - `frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx:696`
  - `frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx:840`
  - Classe aplicada: `md:col-span-2`

Prioridade: P1 (Resolvido)

---

Rota: /empresas/:empresaId/configuracoes

Status: ✅ OK

Problema:
- Mesma implementacao da rota `/configuracoes/empresa` (risco antigo idente).
- Breakpoints testados: 320, 360, 375, 390, 414, 430.

Impacto:
- P1 potencial (mesmo formulario em contexto multiempresa).

Causa provavel:
- Reuso da mesma pagina com spans sem escopo mobile (antes do ajuste).

Correcao sugerida:
- Aplicada na mesma pagina base.
- Arquivo: `frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx`
- Classe aplicada: `md:col-span-2`

Prioridade: P1 (Resolvido)

---

Rota: /configuracoes/usuarios

Status: ✅ OK

Problema:
- Antes do ajuste, barra de acoes em massa podia comprimir/estourar horizontalmente.
- Breakpoints testados: 320, 360, 375, 390, 414, 430.

Impacto:
- P2 potencial (usabilidade das acoes em massa).

Causa provavel:
- Layout sem quebra (`wrap`) para faixa estreita.

Correcao sugerida:
- Aplicada.
- Arquivo: `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx`
- Componente: `GestaoUsuariosPage`
- Trechos relevantes:
  - `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx:1133`
  - `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx:1137`
  - Classes: `flex flex-col ... sm:flex-row ...` e `flex flex-wrap gap-2`

Prioridade: P2 (Resolvido)

---

Rota: /agenda e /crm/agenda

Status: ✅ OK

Problema:
- Antes do ajuste, o layout principal da agenda mantinha sidebar fixa (`w-80`) ao lado do calendario e a visao semanal usava grade rigida de 8 colunas, comprimindo o conteudo no mobile.
- Breakpoints testados: 320, 360, 375, 390, 414, 430.

Impacto:
- P1 potencial (uso principal da agenda em mobile comprometido).

Causa provavel:
- Container principal sem adaptacao mobile-first e grade semanal sem estrategia para largura reduzida.

Correcao sugerida:
- Aplicada.
- Arquivos:
  - `frontend-web/src/features/agenda/AgendaPage.tsx`
  - `frontend-web/src/components/calendar/WeekView.tsx`
  - `frontend-web/src/components/calendar/CreateEventModal.tsx`
  - `frontend-web/src/hooks/useCalendar.ts`
  - `e2e/mobile-responsiveness-smoke.spec.ts`
- Trechos relevantes:
  - `frontend-web/src/features/agenda/AgendaPage.tsx:717` (acoes da toolbar com exportacao e configuracoes)
  - `frontend-web/src/features/agenda/AgendaPage.tsx:737` (layout `flex-col xl:flex-row` + sidebar responsiva)
  - `frontend-web/src/features/agenda/AgendaPage.tsx:766` (`daysToShow={7}`)
  - `frontend-web/src/features/agenda/AgendaPage.tsx:781` (`daysToShow={1}`)
  - `frontend-web/src/features/agenda/AgendaPage.tsx:887` (modal real de configuracoes da agenda)
  - `frontend-web/src/components/calendar/WeekView.tsx:121` (`overflow-x-auto` + `min-w` controlado)
  - `frontend-web/src/components/calendar/WeekView.tsx:45` (`currentTimeSlot` com zero-padding)
  - `frontend-web/src/components/calendar/CreateEventModal.tsx:86` (`mapCalendarTypeToModalType`)
  - `frontend-web/src/hooks/useCalendar.ts:208` (`getCollaborators` com `collaborator + responsavel + attendees`)
  - `frontend-web/src/hooks/useCalendar.ts:35`, `frontend-web/src/hooks/useCalendar.ts:68`, `frontend-web/src/hooks/useCalendar.ts:98` (filtro por tipo e merge do estado local apos create/update)
  - `e2e/mobile-responsiveness-smoke.spec.ts:17` (rota adicionada no smoke)

Prioridade: P1 (Resolvido)

---

Rota: /agenda e /crm/agenda

Status: ⚠️ Atenção

Problema:
- A API de agenda ainda nao possui campos dedicados para persistir `tipo` detalhado e `responsavel` no banco.
- Em recarregamento completo da pagina, alguns eventos podem voltar sem metadados avancados de filtro.

Impacto:
- P2 (filtros avancados podem perder granularidade entre sessoes).

Causa provavel:
- Contrato atual de `agenda_eventos` no backend persiste apenas campos base (titulo, datas, status, prioridade, local, attendees), sem colunas proprias para tipo/responsavel.

Correcao sugerida:
- Curto prazo: manter fallback local (ja aplicado), considerando `attendees` no filtro de responsavel/participante.
- Proximo passo: evoluir contrato backend para incluir `tipo` e `responsavel_id`/`responsavel_nome` em `agenda_eventos`.

Prioridade: P2

---

## Rotas auditadas sem quebra critica identificada
Status padrao: ✅ OK

- /:propostaNumero/:token
- /admin/console
- /admin/empresas
- /admin/empresas/:empresaId/modulos
- /admin/empresas/:id
- /atendimento
- /atendimento/analytics
- /atendimento/automacoes
- /atendimento/configuracoes
- /atendimento/distribuicao
- /atendimento/distribuicao/dashboard
- /atendimento/equipe
- /atendimento/fechamento-automatico
- /atendimento/tickets
- /atendimento/tickets/:id
- /atendimento/tickets/novo
- /capturar-lead
- /configuracoes
- /configuracoes/tickets/niveis
- /configuracoes/tickets/status
- /configuracoes/tickets/tipos
- /crm/leads
- /crm/pipeline
- /dashboard
- /empresas/:empresaId/backup
- /empresas/:empresaId/permissoes
- /empresas/:empresaId/relatorios
- /empresas/minhas
- /esqueci-minha-senha
- /login
- /nuclei/administracao
- /nuclei/crm
- /perfil
- /portal/*
- /proposta/:propostaId
- /proposta/:propostaNumero/:token
- /recuperar-senha
- /registro
- /relatorios/analytics
- /trocar-senha
- /vendas/produtos
- /verificar-email

---

Rota: /dashboard (validacao complementar de menu mobile)

Status: âœ… OK

Problema:
- Em mobile, itens do menu lateral podiam ficar visualmente invisiveis (clicaveis sem contraste) e o botao de perfil podia perder interacao apos uso do drawer.
- Breakpoints testados: 360, 390.

Impacto:
- P0 potencial (navegacao e acesso ao menu do usuario).

Causa provavel:
- Reuso de classes de cor da sidebar desktop escura dentro do drawer mobile com fundo branco.
- Estado de submenu ativo nao era limpo no fechamento do drawer mobile.

Correcao sugerida:
- Aplicada.
- Arquivos:
  - `frontend-web/src/components/navigation/HierarchicalNavGroup.tsx`
  - `frontend-web/src/components/layout/DashboardLayout.tsx`
  - `e2e/mobile-responsiveness-smoke.spec.ts`
- Trechos relevantes:
  - `frontend-web/src/components/navigation/HierarchicalNavGroup.tsx:80` (branch `instanceId === 'mobile'`)
  - `frontend-web/src/components/layout/DashboardLayout.tsx:151` (`closeMobileSidebar` limpa `setActiveSubmenuPanel(null)`)
  - `frontend-web/src/components/layout/DashboardLayout.tsx:521` (`data-testid=\"mobile-menu-close\"`)
  - `frontend-web/src/components/layout/DashboardLayout.tsx:627` (`data-testid=\"mobile-menu-open\"`)

Prioridade: P0 (Resolvido)
