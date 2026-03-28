# Inventario de Modulos, Paginas e Features

Data de referencia: 2026-03-27  
Fontes: `frontend-web/src/config/menuConfig.ts`, `frontend-web/src/App.tsx`, `backend/src/modules/planos/planos.defaults.ts`

## 1) Modulos disponiveis no sistema

- `CRM` (essencial)
- `ATENDIMENTO` (essencial)
- `VENDAS`
- `COMPRAS`
- `FINANCEIRO`
- `BILLING`
- `ADMINISTRACAO`

## 2) Matriz funcional por modulo (visao comercial)

### CORE/BASE (transversal, nao vendido isoladamente)

Features/paginas base:

- `/dashboard`
- `/notifications`
- `/perfil`
- `/login`
- `/registro`
- `/verificar-email`
- `/esqueci-minha-senha`
- `/recuperar-senha`
- `/trocar-senha`
- `/termos`
- `/privacidade`
- `/portal/*`

Observacao: hoje nao existe um modulo `CORE` explicito; parte destas rotas e liberada por contexto de autenticacao/perfil.

### CRM

Menu principal:

- `/crm/clientes`
- `/crm/contatos`
- `/crm/leads`
- `/crm/agenda`
- `/crm/pipeline`
- `/relatorios` (analytics comercial no hub)

Rotas complementares/legadas:

- `/clientes`
- `/clientes/:id`
- `/crm/clientes/:id`
- `/contatos`
- `/leads`
- `/crm/interacoes`
- `/interacoes`
- `/pipeline`
- `/oportunidades`
- `/agenda`
- `/agenda/eventos/:id`
- `/crm/agenda/eventos/:id`
- `/funil-vendas` (alias)

### ATENDIMENTO

Menu principal:

- `/atendimento/inbox`
- `/atendimento/tickets`
- `/atendimento/automacoes`
- `/atendimento/equipe`
- `/atendimento/analytics`
- `/atendimento/configuracoes`

Rotas complementares/operacionais:

- `/atendimento/chat`
- `/atendimento/tickets/novo`
- `/atendimento/tickets/:id`
- `/atendimento/distribuicao`
- `/atendimento/distribuicao/dashboard`
- `/atendimento/fechamento-automatico`
- `/atendimento/dashboard-analytics`
- `/atendimento/bot`
- `/atendimento/regras`
- `/demandas`
- `/demandas/:id`
- `/nuclei/atendimento/demandas`
- `/nuclei/atendimento/demandas/:id`
- `/nuclei/atendimento/tickets`
- `/nuclei/atendimento/tickets/novo`
- `/nuclei/atendimento/filas`
- `/nuclei/atendimento/atendentes`
- `/nuclei/atendimento/skills`
- `/nuclei/atendimento/templates`
- `/nuclei/atendimento/canais/email`
- `/nuclei/atendimento/sla/configuracoes`
- `/nuclei/atendimento/sla/dashboard`
- `/nuclei/atendimento/distribuicao/configuracao`
- `/nuclei/atendimento/distribuicao/skills`
- `/nuclei/atendimento/distribuicao/dashboard`
- `/configuracoes/tickets`
- `/configuracoes/tickets/niveis`
- `/configuracoes/tickets/status`
- `/configuracoes/tickets/tipos`

### VENDAS

Menu principal:

- `/vendas/propostas`
- `/contratos`
- `/vendas/produtos`
- `/vendas/veiculos`

Rotas complementares/legadas:

- `/propostas`
- `/propostas/:id`
- `/vendas/propostas/:id`
- `/contratos/:id`
- `/produtos`
- `/produtos/categorias`
- `/veiculos`

Relatorios associados:

- `/relatorios/comercial/propostas-contratos`

### COMPRAS

Menu principal:

- `/financeiro/cotacoes`
- `/financeiro/compras/aprovacoes`

Rotas complementares/legadas:

- `/cotacoes`
- `/orcamentos`
- `/vendas/cotacoes`
- `/aprovacoes/pendentes`
- `/vendas/aprovacoes`

Features esperadas:

- Gestao de cotacoes/orcamentos
- Esteira de aprovacao de compras

### FINANCEIRO

Menu principal:

- `/financeiro/faturamento`
- `/financeiro/contas-pagar`
- `/financeiro/fornecedores`
- `/financeiro/contas-bancarias`
- `/financeiro/centro-custos`
- `/financeiro/aprovacoes`
- `/financeiro/conciliacao`
- `/financeiro/relatorios`

Rotas complementares:

- `/financeiro/contas-receber`
- `/financeiro/fluxo-caixa`
- `/financeiro/tesouraria`
- `/financeiro/fornecedores/:fornecedorId`

Relatorios associados:

- `/relatorios/financeiro`

### BILLING (assinaturas/plano do produto)

Menu principal:

- `/billing/assinaturas`

Rotas complementares:

- `/billing`
- `/billing/planos`
- `/billing/faturas`
- `/billing/pagamentos`
- `/assinaturas`

### ADMINISTRACAO

Menu principal:

- `/empresas/minhas`
- `/configuracoes/usuarios`
- `/configuracoes/sistema`

Rotas complementares:

- `/gestao/empresas`
- `/gestao/nucleos`
- `/gestao/equipes`
- `/gestao/usuarios`
- `/gestao/permissoes`
- `/nuclei/configuracoes/empresas`
- `/empresas/:empresaId/configuracoes`
- `/empresas/:empresaId/relatorios`
- `/empresas/:empresaId/permissoes`
- `/empresas/:empresaId/usuarios`

## 3) Relatorios (hub e drill-down)

- `/relatorios` (hub)
- `/relatorios/comercial`
- `/relatorios/comercial/drilldown`
- `/relatorios/comercial/clientes-leads`
- `/relatorios/comercial/propostas-contratos`
- `/relatorios/agenda`
- `/relatorios/financeiro`

## 4) Configuracoes transversais (podem atravessar modulo)

- `/configuracoes/empresa`
- `/configuracoes/seguranca`
- `/configuracoes/email`
- `/configuracoes/metas`
- `/configuracoes/integracoes`
- `/configuracoes/departamentos`
- `/configuracoes/usuarios`
- `/configuracoes/sistema`

## 5) Pontos de sobreposicao para organizar os planos

1. `COMPRAS` ja existe no frontend/menu e nos seeds de plano, mas ainda ha acoplamento historico com `FINANCEIRO`:
   - Rotas de compras continuam sob prefixo `/financeiro/...`
   - Permissoes usadas no menu de compras ainda sao `financeiro.*`

2. Existem duas trilhas de aprovacao distintas:
   - `/financeiro/compras/aprovacoes` (compras)
   - `/financeiro/aprovacoes` (financeiro)
   Isso deve permanecer intencional e com naming claro no produto.

3. `CRM` e `ATENDIMENTO` estao marcados como essenciais nos defaults (`DEFAULT_MODULOS_SISTEMA`), entao por padrao entram em todo tenant/plano inicial.

4. Ha aliases legados (`/vendas/cotacoes`, `/cotacoes`, `/orcamentos`, etc.) que precisam ser mantidos em redirect para nao quebrar links antigos, mas nao devem guiar a modelagem comercial.

## 6) Recomendacao de pacote comercial (proposta objetiva)

- `CORE` (interno, nao vendavel): autenticacao, dashboard base, perfil, notificacoes, configuracoes essenciais.
- `CRM`: clientes, contatos, leads, pipeline, agenda comercial.
- `ATENDIMENTO`: inbox/chat/tickets/sla/automacoes de atendimento.
- `VENDAS`: propostas, contratos, catalogo comercial (produtos/veiculos).
- `COMPRAS`: cotacoes/orcamentos/aprovacoes de compras.
- `FINANCEIRO`: contas a pagar/receber, fluxo, conciliacao, tesouraria, relatorios financeiros.
- `BILLING`: assinatura e cobranca do proprio produto Conect360.
- `ADMINISTRACAO`: multitenant, empresas, usuarios, governanca e permissoes globais.

