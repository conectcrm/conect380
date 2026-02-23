# QUICK_FIXES

## Status de aplicacao
- 2026-02-20: itens abaixo aplicados no codigo.
- 2026-02-20: validacao automatizada mobile executada com sucesso em `e2e/mobile-responsiveness-smoke.spec.ts`.
- 2026-02-20: reteste completo concluido (frontend unit tests, backend tests e smoke mobile e2e).

1. Inbox mobile navigation unblock (P0) - APLICADO
- Arquivo: frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx
- Troca rapida:
  - Em < lg, renderizar lista de tickets (drawer ou tela dedicada) em vez de esconder totalmente com hidden lg:flex.
  - Adicionar botao de alternancia Lista/Chat e retorno para lista quando ticket estiver aberto.

2. Remover largura minima fixa da barra de selecao multipla (P1) - APLICADO
- Arquivo: frontend-web/src/features/propostas/components/SelecaoMultipla.tsx:125
- Troca rapida:
  - De: min-w-[400px]
  - Para: w-[calc(100vw-1rem)] max-w-xl min-w-0
  - Complementar: flex-wrap e gap-y-2 para botoes no mobile.

3. Corrigir spans de formulario para mobile (P1) - APLICADO
- Arquivo: frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx
- Troca rapida:
  - De: col-span-2 (linhas 456, 541, 565, 696, 840)
  - Para: md:col-span-2

4. Evitar overflow na barra de acoes em massa de usuarios (P2) - APLICADO
- Arquivo: frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx:1133
- Troca rapida:
  - Container: flex-col sm:flex-row gap-3
  - Grupo de botoes: flex flex-wrap gap-2

5. Smoke E2E mobile versionado (validacao recorrente) - APLICADO
- Arquivo: e2e/mobile-responsiveness-smoke.spec.ts
- Escopo rapido:
  - Breakpoints: 320, 360, 375, 390, 414, 430
  - Rotas criticas: inbox, propostas, configuracao empresa, configuracao usuarios
  - Amostra expandida: dashboard + modulos MVP
  - Checagem de overflow horizontal e fluxo minimo de navegacao mobile

6. Menu mobile com itens invisiveis + perfil sem interacao (drawer) - APLICADO
- Arquivos:
  - frontend-web/src/components/navigation/HierarchicalNavGroup.tsx
  - frontend-web/src/components/layout/DashboardLayout.tsx
  - e2e/mobile-responsiveness-smoke.spec.ts
- Troca rapida:
  - Paleta especifica para `instanceId=\"mobile\"` no menu (texto/icone escuros em fundo branco).
  - Fechamento do drawer limpa submenu ativo (`setActiveSubmenuPanel(null)`), evitando camada residual.
  - Test IDs adicionados para abrir/fechar menu mobile e validacao E2E de perfil pos-fechamento.
  - Ao abrir drawer no mobile, menus de topo (perfil/idioma/usuario) sao fechados e o tray de acoes da topbar fica com `pointer-events-none` ate o drawer fechar.

7. Agenda mobile: remover compressao por sidebar fixa (P1) - APLICADO
- Arquivo: frontend-web/src/features/agenda/AgendaPage.tsx
- Troca rapida:
  - De: `flex overflow-hidden` + `w-80 border-l`
  - Para: `flex-col xl:flex-row` + sidebar `w-full xl:w-80` com card responsivo
  - Ajuste adicional: paddings mobile (`px-4`, `p-3`) e toolbar com `flex-wrap`.

8. Agenda: modo Dia real e modo Semana com largura controlada (P1) - APLICADO
- Arquivos:
  - frontend-web/src/features/agenda/AgendaPage.tsx
  - frontend-web/src/components/calendar/WeekView.tsx
- Troca rapida:
  - Novo prop `daysToShow` no `WeekView` (`7` para semana e `1` para dia).
  - Wrapper com `overflow-x-auto` + `min-w` para evitar esmagamento em 320-430px.
  - Correção da linha de hora atual com zero-padding (`09:00` em vez de `9:00`).

9. Agenda: tipo/responsavel persistidos no estado local (P2) - APLICADO
- Arquivos:
  - frontend-web/src/features/agenda/AgendaPage.tsx
  - frontend-web/src/components/calendar/CreateEventModal.tsx
  - frontend-web/src/hooks/useCalendar.ts
- Troca rapida:
  - Mapear `eventType` do modal para `CalendarEvent.type`.
  - Alinhar opcoes de tipo (incluindo `Ligacao`) entre criacao e filtro da agenda.
  - Preencher colaborador/responsavel ao salvar.
  - Filtro de colaborador expandido para considerar tambem `responsavel` e `attendees`.
  - Merge no hook apos create/update para manter filtros funcionais durante a sessao.

10. Agenda: toolbar funcional (P2) - APLICADO
- Arquivos:
  - frontend-web/src/features/agenda/AgendaPage.tsx
  - e2e/mobile-responsiveness-smoke.spec.ts
- Troca rapida:
  - `Download` passou a exportar CSV da agenda filtrada.
  - `Settings` passou a abrir modal real de preferencias da agenda.
  - Preferencias salvas em localStorage (`agenda:show-stats-panel` e `agenda:open-filters-default`).

11. Smoke E2E agenda em mobile (P1) - APLICADO
- Arquivo: e2e/mobile-responsiveness-smoke.spec.ts
- Troca rapida:
  - Adicao de `/agenda` na lista critica.
  - Validacao de botoes de visao (Semana/Dia), exportacao, configuracoes e ajuste do modal ao viewport.

12. Notificacoes: nao duplicar no polling/read sync (P1) - APLICADO
- Arquivo: frontend-web/src/components/notifications/__tests__/NotificationCenter.polling.test.tsx
- Troca rapida:
  - Teste cobrindo mesmo `id` em polls consecutivos sem duplicar item.
  - Teste cobrindo `markAsRead` seguido de novo polling mantendo estado sincronizado.

13. Regressao dedicada: drawer mobile x perfil/topbar (P0) - APLICADO
- Arquivo: e2e/mobile-drawer-profile.spec.ts
- Troca rapida:
  - Novo spec dedicado para `/dashboard` em 320/390/430.
  - Valida que, com drawer aberto, `topbar-actions-tray` e botao de perfil ficam sem interacao (`pointer-events: none`).
  - Valida que, apos fechar drawer, interacao e menu de perfil (`Meu Perfil`) voltam ao normal.
  - Integrado ao fluxo operacional: `.production/scripts/smoke-mvp-ui.ps1` executa esse guard por padrao (com `-SkipMobileGuard` opcional).

14. Pipeline mobile: toolbar/filtros/kanban/paginacao (P1) - APLICADO
- Arquivos:
  - frontend-web/src/pages/PipelinePage.tsx
  - e2e/mobile-responsiveness-smoke.spec.ts
- Troca rapida:
  - Toolbar de visualizacao em mobile com `grid-cols-2` e botoes centralizados (Kanban/Lista/Calendario/Graficos visiveis).
  - Barra de filtros convertida para `flex-col` + `flex-wrap` no mobile, evitando compressao de acoes.
  - Dropdown de filtros salvos com largura responsiva (`w-full` no mobile).
  - Colunas kanban com largura responsiva por viewport (`w-[min(20rem,calc(100vw-6rem))]`).
  - Paginacao ajustada para stack no mobile e faixa de paginas com `overflow-x-auto`.
  - Toolbar do calendario com media query mobile para evitar quebra de controles.
  - Smoke mobile reforcado com `assertPipelineMobileActions` em `/pipeline` nos breakpoints 320/360/375/390/414/430.

15. Cobertura expandida de rotas roteadas no smoke mobile (P1) - APLICADO
- Arquivo: e2e/mobile-responsiveness-smoke.spec.ts
- Troca rapida:
  - Breakpoint minimo da varredura expandida ajustado para 320 (`SAMPLE_BREAKPOINTS = [320, 430]`) e rotas publicas com `PUBLIC_BREAKPOINTS = [320, 430]`.
  - Lista `EXPANDED_ROUTES` ampliada para incluir telas ativas adicionais de CRM, Atendimento, Configuracoes, Admin, Financeiro e perfil.
  - Nova lista `PUBLIC_ROUTES` adicionada para validar login/registro/recuperacao/captura em mobile.
  - Detector de permissao ajustado para considerar apenas a pagina explicita de `Acesso negado`, evitando falso positivo por texto em toasts/conteudo.
  - Resultado de validacao: `npm run test:e2e:mobile:guard` com `3 passed`; unica excecao de rota pulada por permissao real foi `/empresas/minhas`.
