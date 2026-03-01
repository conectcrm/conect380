# Requisitos de Padronizacao de Telas (Layout V2)

## Objetivo

Este documento define o requisito oficial para padronizacao e refatoracao de telas no frontend.

Ele substitui o conteudo antigo deste arquivo (que estava focado em automacao/scaffolding) e passa a ser a referencia pratica para:

- novas telas
- refatoracoes visuais
- ajustes de largura/responsividade
- padronizacao de listagens, filtros, tabelas e modais

Escopo principal: telas no `frontend-web` usando `layout-v2`.

## Referencias canonicas (codigo)

Usar estas referencias antes de padronizar uma tela:

- `frontend-web/src/components/layout-v2/RouteTemplateFrame.tsx`
- `frontend-web/src/components/layout-v2/templates/PageTemplates.tsx`
- `frontend-web/src/components/layout-v2/AppShell.tsx`
- `frontend-web/src/components/layout-v2/components/PageHeader.tsx`
- `frontend-web/src/components/layout-v2/components/FiltersBar.tsx`
- `frontend-web/src/components/layout-v2/components/Card.tsx`
- `frontend-web/src/features/clientes/ClientesPage.tsx`
- `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx`

## Principio central

Antes de mexer no visual da tela, definir a tipologia da pagina (LIST / SETTINGS / DASHBOARD / FORM / DETAIL / AUTH / UTILITY). A largura, o espacamento e o comportamento visual base vem da tipologia e nao devem ser "corrigidos" com gambiarras locais.

## Tipologias de tela e regras

### 1. LIST (listas operacionais / CRUD)

Exemplos:

- Clientes
- Contatos
- Leads
- Gestao de Usuarios (padronizada para LIST)
- Meu Perfil (`/perfil`) quando estruturado com sidebar + multiplos cards densos (dados, notificacoes, seguranca, atividade)
- Pipeline (header/listagem, com corpo especializado)

Requisitos:

- usar `PageHeader` dentro de `SectionCard`
- usar `InlineStats` quando houver metricas de resumo
- usar `FiltersBar` para busca/filtros/acoes de filtro
- usar `DataTableCard` para listagens em tabela
- tratar responsividade com:
  - cards no mobile
  - tabela desktop
- estados obrigatorios: loading, erro, vazio

### 2. SETTINGS (configuracoes / formularios administrativos)

Exemplos:

- configuracoes gerais
- paginas administrativas sem listagem principal

Requisitos:

- layout mais contido (tipologia `SETTINGS`)
- cards empilhados por secao
- CTA de salvar consistente (preferencialmente em footer sticky em formularios longos)

Observacao:

- se a tela de configuracao tiver comportamento de listagem pesada (tabela + filtros + acoes em massa), pode receber excecao para `LIST` via `RouteTemplateFrame`.
- Exemplo real: `/configuracoes/usuarios`.
- Exemplo adicional: `/perfil` (apesar de ser "configuracao pessoal", usa composicao densa e largura de `LIST`).

### 3. DASHBOARD

Exemplos:

- dashboards de CRM/Financeiro/Atendimento

Requisitos:

- foco em cards, graficos e blocos de insight
- header mais leve (sem excesso de filtros de listagem)
- nao forcar `DataTableCard` como estrutura principal

### 4. FORM

Exemplos:

- builders
- formularios grandes de cadastro/edicao

Requisitos:

- tipologia `FORM` (largura contida)
- secao principal em cards por etapa
- CTA primario claro e persistente

### 5. DETAIL

Exemplos:

- tela de detalhe de entidade

Requisitos:

- foco em leitura e historico
- header contextual + cards de detalhes
- acoes agrupadas e hierarquizadas

### 6. FULL BLEED (casos especiais)

Exemplo:

- inbox/operacoes em tempo real

Requisitos:

- usar apenas quando a experiencia depende de area maxima de viewport
- configurar via `fullBleed` na regra de rota

## Requisito de largura e responsividade (obrigatorio)

### Regra

A largura da tela deve ser controlada por `RouteTemplateFrame` + `PageTemplate`, nao por `max-width` arbitrario dentro da pagina.

Obs: tipologias contidas (`SETTINGS` / `FORM`) devem ficar centralizadas pelo proprio `PageTemplate` (ex.: `max-w-*` + `mx-auto`). A pagina nao deve adicionar `mx-auto`/`max-w-*` local para "consertar".

Larguras padrao (referencia tecnica em `PageTemplates.tsx`):

- `LIST`: full width (sem `max-w-*` no template)
- `SETTINGS`: contida e centralizada (ex.: `max-w-[1280px]` + `mx-auto`)
- `FORM`: contida e centralizada (ex.: `max-w-[1200px]` + `mx-auto`)

Padrao operacional de implementacao (telas `LIST`):

- o container raiz da pagina deve seguir `className="space-y-4 pt-1 sm:pt-2"` quando aplicavel ao padrao V2
- o espacamento lateral global deve vir do shell (`shellSpacing.pageOuterX`)
- evitar duplicidade de padding lateral no root da pagina (`p-4`, `sm:p-5`) quando o shell ja controla o perimetro util

### Checklist de largura

Antes de dizer que "a largura esta errada", validar:

1. Qual rota a tela usa.
2. Qual tipologia essa rota recebe em `RouteTemplateFrame`.
3. Se a tela realmente e uma `LIST` ou `SETTINGS`.
4. Se existe excecao necessaria (ex.: `/configuracoes/usuarios`).
5. Se a rota e uma excecao documentada (ex.: `/perfil` = `LIST`).

Se a tipologia estiver correta e ainda assim a largura parecer "errada" (conteudo grudado a esquerda, ou max-width nao aplicando), revisar as classes do template em `frontend-web/src/components/layout-v2/templates/PageTemplates.tsx`.

Referencias praticas (padrao observado):

- `/configuracoes/usuarios` (arquivo `frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx`) e um exemplo de `LIST` em Configuracoes e nao usa `max-w-*` local.
- `/perfil` (arquivo `frontend-web/src/features/perfil/PerfilPage.tsx`) e um exemplo de tela pessoal com composicao densa que deve usar `LIST` para evitar largura contida excessiva.

### Anti-pattern (nao fazer)

- adicionar `max-w-* mx-auto` local para "compensar" tipologia errada
- misturar comportamento de `LIST` com tipologia `SETTINGS` sem justificativa
- tratar `/perfil` como `SETTINGS` por padrao sem validar a composicao atual da tela

## Estrutura visual obrigatoria para telas LIST (padrao adotado)

### Bloco 1: Header da pagina (em card)

Usar:

- `SectionCard`
- `PageHeader`
- `InlineStats` (se houver resumo relevante)

Requisitos:

- titulo unico da tela (sem duplicar com titulo de modulo)
- evitar logo duplicada dentro do conteudo quando o `AppShell` ja mostra branding
- descricao curta e contextual
- acoes principais no canto direito (Atualizar, Exportar, Novo, etc.)
- `PageHeader.filters` e opcional e nao deve exigir exibicao de "Empresa ativa"

### Bloco 2: Filtros e busca

Usar:

- `FiltersBar`

Requisitos:

- busca principal com icone e placeholder claro
- filtros em selects/inputs no mesmo padrao visual
- acao "Limpar" e/ou "Salvar view" quando existir fluxo de filtros complexos
- chips de filtros ativos quando houver mais de 1 criterio

### Bloco 3: Estados da pagina

Obrigatorio:

- `LoadingSkeleton`
- `EmptyState` para:
  - vazio sem filtro
  - vazio com filtro
- estado de erro com CTA de tentativa novamente

### Bloco 4: Listagem

Usar:

- `DataTableCard` como container visual

Requisitos:

- toolbar da listagem com contagem de registros
- suporte a densidade (opcional, recomendado em tabelas administrativas)
- responsividade:
  - mobile: cards
  - desktop: tabela
- cabecalho sticky em tabelas longas (recomendado)
- rodape com paginacao visual (quando o volume justificar)

### Bloco 5: Acoes em massa (quando aplicavel)

Requisitos:

- mostrar apenas quando houver selecao
- destacar impacto da acao (ativar/desativar/excluir)
- confirmar acoes destrutivas

## Requisito de UX para tabelas/listagens (aprendizados da tela de usuarios)

### Selecao

- checkbox do cabecalho deve suportar estado parcial (`indeterminate`)
- selecao em massa deve considerar a pagina visivel quando houver paginacao visual

### Tabela desktop

- `overflow-auto` em container da tabela
- `thead` sticky para listas longas
- densidade "Confortavel/Compacta" recomendada em telas administrativas

### Mobile

- nao "esmagar" tabela
- usar cards com:
  - avatar/identificacao
  - metadados principais
  - status em badges
  - acoes essenciais

## Requisitos de modal (padrao para telas administrativas)

Este requisito complementa o guia de modais existente, mas define o minimo visual/UX para modais de refatoracao rapida em `layout-v2`.

### Estrutura minima

- overlay escuro leve com blur discreto
- painel branco com borda e sombra
- header com titulo + fechar
- corpo com espacamento consistente
- footer sticky para CTA (em modais longos)

### Largura padrao de modais (obrigatorio)

- nenhum modal administrativo/financeiro deve ocupar toda a largura util em desktop
- usar sempre container com `w-full max-h-[90vh] overflow-y-auto` e limite de largura por tipologia

Largura por tipologia:

- detalhe/consulta: `max-w-[980px]`
- formulario complexo: `max-w-[1200px]`
- fluxo simples/confirmacao: entre `max-w-lg` e `max-w-3xl` conforme densidade

Regras complementares:

- evitar `max-w-4xl` generico para modal de detalhe quando causar efeito de "esticado" em monitores largos
- em resolucoes pequenas, manter `w-full` + padding do overlay (`p-4`) para nao gerar overflow horizontal

Referencias implementadas:

- `frontend-web/src/pages/faturamento/ModalDetalhesFatura.tsx` (`max-w-[980px]`)
- `frontend-web/src/pages/faturamento/ModalFatura.tsx` (`max-w-[1200px]`)
- `frontend-web/src/pages/faturamento/ModalPagamentos.tsx` (`max-w-3xl`)

### Formularios em modal

Requisitos:

- grid responsivo (`1 coluna` mobile, `2 colunas` desktop quando fizer sentido)
- labels consistentes
- inputs/selects com tokens visuais unificados
- mensagens de erro visiveis no proprio modal

### Encoding e acentuacao (obrigatorio)

Requisitos:

- todo texto de interface (titulo, label, placeholder, toast, tooltip) deve manter pt-BR com acentuacao correta
- manter cedilha e caixa correta quando aplicavel (`ç` e `Ç`)
- e proibido simplificar texto para "sem acento" em campos visiveis para o usuario (ex.: `Descricao`, `Informacoes`, `Acoes`)
- arquivos `.ts`, `.tsx`, `.js`, `.jsx` do frontend devem ser salvos em UTF-8
- ao revisar uma tela alterada, validar visualmente acentuacao em:
  - header e subtitulo
  - labels/placeholders
  - mensagens de erro e feedback

Validacao tecnica minima antes do merge:

1. executar `rg -n "Ã|Â|�" frontend-web/src` e garantir que nao existem ocorrencias novas nas telas alteradas
2. validar que o editor esta salvando com `charset = utf-8` (padrao definido em `.editorconfig`)

### Modais complexos (ex.: permissoes)

Requisitos adicionais:

- busca interna quando houver listas longas
- contador de itens selecionados
- estados vazios de busca
- "selecionar todos" por grupo

### Campos de midia (ex.: avatar/logo)

Recomendado:

- preview visual quando houver URL/arquivo selecionado

## Requisitos de consistencia de branding e hierarquia visual

### Nao duplicar identidade no mesmo viewport

Evitar:

- logo no sidebar + logo repetida no topo do conteudo sem necessidade
- label de modulo (ex.: "CRM") repetida ao lado de toggles/filtros se ja esta evidente no contexto
- titulo da pagina muito proximo do header global sem card/estrutura

### Regra pratica

- `AppShell` cuida da identidade global e navegacao
- a pagina cuida do contexto funcional (titulo, descricao, filtros, conteudo)

## Requisitos especificos para telas diferentes (nao forcar padrao unico)

### Pipeline / Board operacional

Deve seguir parcialmente o padrao de LIST:

- header, filtros e largura padronizados
- corpo pode ser especializado (kanban, board, colunas, drag-and-drop)

Nao exigir:

- tabela como estrutura principal

### Branding Global / Paginas de configuracao visual

Pode seguir `SETTINGS` ou `LIST` conforme composicao:

- `SETTINGS` quando for formulario puro
- `LIST` quando houver previews, tabelas, galerias ou blocos densos e necessidade de largura maior

### Auth / Login

Padrao proprio:

- nao reutilizar estrutura de `PageHeader`/`FiltersBar`
- branding e responsividade controlados por layout de autenticacao

## Processo de padronizacao de uma tela (passo a passo)

1. Identificar tipologia correta da rota.
2. Ajustar `RouteTemplateFrame` se a rota estiver na tipologia errada.
3. Remover elementos redundantes (logo/titulo/modulo duplicado).
4. Refatorar topo para `SectionCard + PageHeader`.
5. Migrar filtros para `FiltersBar`.
6. Padronizar estados (loading/erro/vazio).
7. Encapsular listagem em `DataTableCard` (se for LIST).
8. Ajustar responsividade (mobile cards + desktop table ou layout especifico).
9. Padronizar modais da tela.
10. Validar build e teste manual.

## Definition of Done (padronizacao visual)

Uma tela so pode ser considerada padronizada se:

- respeita a tipologia correta da rota
- usa componentes `layout-v2` nas areas equivalentes
- nao possui titulo/logo/contexto duplicado
- possui estados loading/erro/vazio
- possui responsividade funcional (mobile + desktop)
- possui hierarquia visual consistente (header, filtros, conteudo, acoes)
- compila com `npm run build`

## Validacao minima obrigatoria (manual)

Para cada tela refatorada:

1. Desktop:
   - largura e espacamento corretos
   - header alinhado com outras telas padrao
   - tabela/listagem sem overflow quebrado
2. Mobile:
   - filtros e acoes utilizaveis
   - listagem legivel
   - modais navegaveis
3. Interacoes:
   - busca/filtros
   - acoes principais
   - modais (abrir/fechar/salvar)

## Observacoes de manutencao

- Se uma nova excecao de largura for necessaria, registrar em `RouteTemplateFrame` com comentario curto explicando o motivo.
- Evitar criar novo "padrao local" por tela. Primeiro tentar encaixar em `layout-v2`.
- Quando a tela exigir comportamento fora do padrao (board, builder, full-bleed), padronizar o header/filtros e especializar apenas o corpo.
