# RESPONSIVE_AUDIT

## Escopo e criterio
- Breakpoints alvo avaliados: 320, 360, 375, 390, 414, 430.
- Auditoria aplicada somente ao grafo ativo de UI (rotas alcancaveis por runtime).
- Evidencia baseada em inspecao de codigo dos componentes em uso (arquivo + linha + classe responsiva).

## Status pos-auditoria
- 2026-02-20: quick fixes P0/P1/P2 aplicados no codigo para os itens listados neste documento.
- Validacao tecnica executada:
  - `npm run type-check` em `frontend-web`: OK
  - `npm run build` em `frontend-web`: OK

---

Rota: /atendimento/inbox

Status: ❌ Quebra

Problema:
- Breakpoints testados: 320, 360, 375, 390, 414, 430
- Arquivo: frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx
- Componente: ChatOmnichannel
- Trecho relevante:
  - 1037: grid grid-cols-1 lg:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr_320px]
  - 1040: hidden lg:flex (coluna da lista de atendimentos)
  - 1106: hidden xl:flex (painel do cliente)
  - 1078: texto instrui a selecionar ticket na lista da esquerda
- Classe/estilo responsavel: hidden lg:flex + ausencia de fluxo mobile alternativo para lista

Impacto:
- Em mobile, o usuario pode ficar sem caminho de navegacao para selecionar ticket, bloqueando o uso principal do inbox.

Causa provavel:
- A lista de atendimentos existe apenas em >= lg; o estado mobile nao tem drawer/lista equivalente (mobileView fixo em chat no componente).

Correcao sugerida:
- Criar fluxo mobile explicito para lista (drawer/fullscreen) e botao de alternancia lista/chat abaixo de lg.
- Exemplo minimo: renderizar AtendimentosSidebar quando !ticketSelecionado em < lg, e incluir botao Voltar para lista dentro de ChatArea.

Prioridade: P0

---

Rota: /vendas/propostas

Status: ⚠️ Atencao

Problema:
- Breakpoints testados: 320, 360, 375, 390
- Arquivo: frontend-web/src/features/propostas/components/SelecaoMultipla.tsx
- Componente: SelecaoMultipla
- Trecho relevante:
  - 125: min-w-[400px] em barra fixa de acoes em massa
- Classe/estilo responsavel: min-w-[400px]

Impacto:
- A barra fixa pode ultrapassar a viewport em telas <= 390px, gerando overflow horizontal e acoes parcialmente cortadas.

Causa provavel:
- Largura minima fixa maior que a largura util de tela em dispositivos menores.

Correcao sugerida:
- Substituir por largura fluida mobile-first:
  - w-[calc(100vw-1rem)] max-w-xl min-w-0
  - adicionar flex-wrap e gap vertical para acomodar botoes em 2 linhas quando necessario.

Prioridade: P1

---

Rota: /configuracoes/empresa

Status: ⚠️ Atencao

Problema:
- Breakpoints testados: 320, 360, 375, 390, 414, 430
- Arquivo: frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx
- Componente: ConfiguracaoEmpresaPage
- Trecho relevante:
  - 405: grid grid-cols-1 md:grid-cols-2
  - 456, 541, 565, 696, 840: itens com col-span-2 sem prefixo de breakpoint
- Classe/estilo responsavel: col-span-2 aplicado tambem no mobile (grid com 1 coluna)

Impacto:
- Campos e secoes podem forcar largura indevida, causar desalinhamento e risco de overflow horizontal em formularios.

Causa provavel:
- Span de 2 colunas ativo em breakpoints onde o container tem apenas 1 coluna.

Correcao sugerida:
- Trocar col-span-2 por md:col-span-2 nos blocos afetados.
- Manter grid-cols-1 no mobile e 2 colunas somente em md+.

Prioridade: P1

---

Rota: /empresas/:empresaId/configuracoes

Status: ⚠️ Atencao

Problema:
- Breakpoints testados: 320, 360, 375, 390, 414, 430
- Arquivo: frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx
- Componente: ConfiguracaoEmpresaPage
- Trecho relevante:
  - 405: grid grid-cols-1 md:grid-cols-2
  - 456, 541, 565, 696, 840: itens com col-span-2 sem prefixo de breakpoint
- Classe/estilo responsavel: col-span-2 sem escopo md+

Impacto:
- Mesmo impacto da rota /configuracoes/empresa (mesma pagina): risco de quebra visual em formulario no mobile.

Causa provavel:
- Reuso da mesma implementacao com spans nao condicionados por breakpoint.

Correcao sugerida:
- Padronizar todos os spans largos para md:col-span-2.

Prioridade: P1

---

Rota: /configuracoes/usuarios

Status: ⚠️ Atencao

Problema:
- Breakpoints testados: 320, 360, 375, 390
- Arquivo: frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx
- Componente: GestaoUsuariosPage
- Trecho relevante:
  - 1133: flex items-center justify-between (container de acoes em massa)
  - 1137: flex gap-2 (grupo de 3 botoes: Ativar/Desativar/Excluir)
- Classe/estilo responsavel: layout flex sem wrap para faixa estreita

Impacto:
- Quando ha selecao em massa, botoes podem comprimir demais ou estourar horizontalmente em telas pequenas.

Causa provavel:
- Barra de acoes desenhada para linha unica, sem fallback de quebra para mobile.

Correcao sugerida:
- Aplicar mobile-first no bloco:
  - container: flex-col sm:flex-row sm:items-center sm:justify-between gap-3
  - grupo de botoes: flex flex-wrap gap-2

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
