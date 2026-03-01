# Checklist de Padronizacao de Telas (PR + QA)

## Objetivo

Checklist reutilizavel para refatorar telas no padrao `layout-v2`, com foco em consistencia visual, largura correta, responsividade e reducao de regressao.

Documento canonicamente vinculado a:

- `docs/features/ARQUITETURA_PADRONIZACAO_TELAS.md`

## Quando usar

Usar este checklist em qualquer uma destas situacoes:

- nova tela
- refatoracao visual
- migracao para `layout-v2`
- ajuste de largura/responsividade
- padronizacao de filtros/tabela/modal

## Fase 1: Diagnostico (antes de editar)

- [ ] Identifiquei a rota principal da tela (URL real).
- [ ] Verifiquei a tipologia aplicada em `frontend-web/src/components/layout-v2/RouteTemplateFrame.tsx`.
- [ ] Confirmei se a tela deve ser `LIST`, `SETTINGS`, `DASHBOARD`, `FORM`, `DETAIL` ou `FULL BLEED`.
- [ ] Confirmei se existe excecao de tipologia necessaria (ex.: configuracao com comportamento de lista).
- [ ] Validei excecoes documentadas de largura (ex.: `/configuracoes/usuarios` e `/perfil` usam `LIST`).
- [ ] Listei elementos redundantes existentes (logo duplicada, titulo duplicado, label de modulo duplicada, etc.).
- [ ] Mapeei os estados da tela: loading, erro, vazio, sucesso/feedback.

## Fase 2: Estrutura de layout (padrao visual)

### Para telas LIST

- [ ] Topo refatorado com `SectionCard`.
- [ ] Titulo e descricao usando `PageHeader`.
- [ ] Acoes principais no `PageHeader.actions` (Atualizar, Exportar, Novo, etc.).
- [ ] `PageHeader.filters` foi avaliado (opcional); nao exigir "Empresa ativa" como regra de tela.
- [ ] KPIs/resumos usando `InlineStats` quando fizer sentido.
- [ ] Barra de filtros migrada para `FiltersBar`.
- [ ] Listagem encapsulada em `DataTableCard`.

### Para telas SETTINGS

- [ ] Layout contido mantido (sem forcar largura de LIST sem justificativa).
- [ ] Secoes organizadas em cards.
- [ ] CTA de salvar claro e consistente.
- [ ] Formularios longos com footer sticky (recomendado).

### Para telas DASHBOARD

- [ ] Header sem excesso de controles de lista.
- [ ] Cards/graficos/insights organizados com hierarquia clara.
- [ ] Nao forcei estrutura de tabela como bloco principal.

## Fase 3: Largura e responsividade (critico)

- [ ] A largura da tela esta correta pela tipologia, nao por `max-w-*` local.
- [ ] Se houve ajuste de largura, ele foi feito em `RouteTemplateFrame` (regra de rota), e nao como gambiarra na pagina.
- [ ] Se a tela for `/perfil`, confirmei explicitamente que a tipologia permanece `LIST` (nao `SETTINGS`) salvo mudanca arquitetural justificada.
- [ ] Desktop: alinhamento lateral e espacamento compativeis com telas de referencia (ex.: Clientes).
- [ ] Mobile: filtros, botoes e blocos nao estao quebrando layout.
- [ ] Nenhum elemento importante ficou colado no background sem card/estrutura (titulo "solto").

## Fase 4: Estados obrigatorios

- [ ] Loading padronizado (`LoadingSkeleton` ou equivalente do modulo).
- [ ] Erro com mensagem clara + CTA para tentar novamente.
- [ ] Vazio sem filtro tratado.
- [ ] Vazio com filtro tratado (mensagem diferente, orientando ajuste de filtros).
- [ ] Feedback de sucesso/erro de acao (toast/banner) consistente.

## Fase 5: Tabelas e listagens (se aplicavel)

- [ ] Existe versao mobile em cards quando a tabela fica ilegivel em telas pequenas.
- [ ] Tabela desktop esta em container com `overflow-auto`.
- [ ] Cabecalho sticky implementado em tabelas longas (recomendado).
- [ ] Toolbar da listagem mostra contagem de registros.
- [ ] Paginacao visual implementada quando volume justificar.
- [ ] Selecao em massa (checkbox header) suporta `indeterminate` quando aplicavel.
- [ ] Selecao em massa respeita pagina visivel quando houver paginacao.
- [ ] Densidade de tabela (compacta/confortavel) avaliada para telas administrativas.

## Fase 6: Filtros e busca

- [ ] Busca principal tem placeholder claro e icone.
- [ ] Filtros usam o mesmo padrao visual de inputs/selects.
- [ ] Botao de limpar filtros (ou fluxo equivalente) existe quando necessario.
- [ ] Filtros ativos sao visiveis via chips/resumo quando ha multiplos criterios.
- [ ] Fluxos de "view salva" (se existirem) nao conflitam visualmente com filtros principais.

## Fase 7: Modais (se aplicavel)

- [ ] Modal com overlay, borda e sombra consistentes.
- [ ] Modal usa `w-full max-h-[90vh] overflow-y-auto` no container principal.
- [ ] Largura do modal esta correta por tipologia (detalhe `max-w-[980px]`, formulario complexo `max-w-[1200px]`, simples `max-w-lg` a `max-w-3xl`).
- [ ] Modal nao ficou "esticado" em desktop (sem ocupar largura excessiva).
- [ ] Header do modal com titulo + fechar.
- [ ] Corpo com espacamento uniforme.
- [ ] Footer sticky (em modais longos) com CTAs padronizados.
- [ ] Campos organizados em grid responsivo quando houver muitos inputs.
- [ ] Labels/inputs/selects/checkboxes seguem tokens visuais consistentes.
- [ ] Erros de formulario aparecem dentro do modal.
- [ ] Para listas longas no modal (ex.: permissoes), existe busca interna.
- [ ] Existe contador/contexto de selecao quando necessario.
- [ ] Campos de imagem/avatar/logo possuem preview (recomendado).

## Fase 8: Branding e hierarquia visual

- [ ] Nao existe logo duplicada desnecessaria no mesmo viewport.
- [ ] Nao existe titulo duplicado (modulo + pagina) sem funcao clara.
- [ ] `AppShell` fica responsavel pelo branding global.
- [ ] A pagina mostra apenas contexto funcional (titulo, descricao, filtros, conteudo).

## Fase 9: Validacao tecnica (obrigatoria)

- [ ] `npm run build` (frontend) executado com sucesso.
- [ ] Se houve mudanca de rota/permissao/layout global, teste de navegacao basico executado.
- [ ] Nao foram alteradas regras de negocio sem necessidade (escopo visual preservado).

## Fase 10: QA manual (Desktop + Mobile)

### Desktop

- [ ] Titulo/descricao/acoes no topo estao alinhados.
- [ ] Largura da pagina segue o padrao esperado da tipologia.
- [ ] Filtros e listagem estao visualmente consistentes com Clientes/Gestao de Usuarios.
- [ ] Tabela/cards sem overflow quebrado.
- [ ] Modais abrem/fecham/salvam sem layout quebrado.

### Mobile

- [ ] Header e botoes principais continuam utilizaveis.
- [ ] Filtros empilham corretamente.
- [ ] Listagem mobile (cards) esta legivel.
- [ ] Modais cabem no viewport e permitem scroll.

### Fluxos

- [ ] Busca funciona.
- [ ] Filtros funcionam.
- [ ] Acoes principais funcionam.
- [ ] Acoes destrutivas confirmam corretamente.
- [ ] Estados de feedback aparecem e somem corretamente (quando aplicavel).

## Checklist de PR (descricao da entrega)

Incluir no PR / entrega:

- [ ] Qual tipologia foi usada (e por que).
- [ ] Se houve ajuste em `RouteTemplateFrame`.
- [ ] Quais componentes `layout-v2` foram aplicados.
- [ ] Quais estados foram padronizados (loading/erro/vazio).
- [ ] Como ficou a responsividade (mobile cards / desktop table / full-bleed etc.).
- [ ] Evidencia visual (screenshots desktop e mobile) quando a mudanca for grande.
- [ ] Resultado do build (`npm run build`) informado.

## Saida esperada

Uma tela padronizada deve:

- parecer parte do mesmo sistema
- respeitar a tipologia correta de layout
- evitar duplicidade visual
- manter usabilidade em desktop e mobile
- compilar sem regressao

