# Guia de Padronizacao de Telas - ConectCRM

## Objetivo
Este guia define como manter consistencia visual e tecnica no sistema sem forcar todas as telas a terem o mesmo layout.

Decisao oficial:
- O sistema deve ter `base unica de design` (tokens, componentes, estados, acessibilidade).
- Cada tela pode ter `layout e UX especificos` conforme a funcao do modulo.

Em resumo: design system unico, experiencia orientada por contexto.

## Principios
1. Consistencia onde reduz custo cognitivo.
2. Variacao onde melhora produtividade da tarefa.
3. Reuso de componentes antes de criar novos.
4. Padroes multi-tenant e seguranca sao obrigatorios.
5. Toda tela deve ser responsiva, acessivel e observavel.

## Camada Base Obrigatoria (Todas as Telas)
Estas regras sao obrigatorias em qualquer modulo.

### 1) Visual e Design Tokens
- Cores, espacos, bordas, tipografia e sombras devem vir do sistema ja definido.
- Estados visuais (`hover`, `focus`, `disabled`, `error`, `success`) devem ser consistentes.
- Nao criar paleta paralela por modulo sem aprovacao.

### 2) Componentes Base
- Priorizar componentes compartilhados (`buttons`, `inputs`, `modals`, `tables`, `cards`, `empty states`).
- Se um componente novo resolver problema recorrente, ele deve ser promovido para `shared`.

### 3) Estados de Interface
Toda tela deve implementar:
- Loading inicial.
- Loading de acao pontual (ex: salvar, exportar).
- Empty state com CTA.
- Error state com mensagem clara e acao de recuperacao.
- Feedback de sucesso/erro (toast ou bloco inline, conforme criticidade).

### 4) Acessibilidade
- Navegacao por teclado.
- Labels, `aria-*` e hierarquia semantica.
- Contraste minimo para leitura.
- Foco visivel em elementos interativos.

### 5) Performance
- Paginacao ou virtualizacao para listas grandes.
- Debounce de busca quando necessario.
- Evitar renderizacao pesada sem memoizacao.

### 6) Multi-tenant e Seguranca
- Nenhuma tela pode depender de filtro manual de empresa no frontend para isolamento.
- Toda acao sensivel deve respeitar permissoes e contexto da empresa ativa.
- Nao exibir dados de outro tenant em cache local, upload temporario ou fallback.

## Arquitetura de UX por Tipo de Tela
Nao existe uma unica composicao valida para tudo. Use o tipo de tela correto:

### Tipo A - Gestao em Lista (CRUD)
Exemplos:
- Clientes
- Contatos
- Fornecedores
- Produtos

Estrutura recomendada:
1. Header com contexto e acao primaria.
2. KPIs curtos (quando ajudarem decisao rapida).
3. Busca + filtros + acoes em massa.
4. Tabela ou cards com paginacao e ordenacao.
5. Modal ou pagina de detalhe/edicao.

Componentes recomendados:
- `StandardPageTemplate`
- `StandardDataTable`
- Modais padrao de cadastro/edicao

### Tipo B - Operacao em Tempo Real
Exemplos:
- Atendimento Omnichannel
- Distribuicao de fila
- Console operacional

Estrutura recomendada:
1. Layout com densidade maior de informacao.
2. Prioridade para tempo real, contexto e acao rapida.
3. Painel lateral de contexto (cliente/ticket) quando necessario.
4. Feedback de estado de conexao e latencia.

Componentes recomendados:
- Layouts especificos operacionais.
- Componentes compartilhados para formularios, badges e feedback.

Observacao:
- Nao forcar `StandardDataTable` em fluxo de operacao ao vivo.

### Tipo C - Analytics e Dashboard
Exemplos:
- Dashboards executivos
- Relatorios de desempenho

Estrutura recomendada:
1. Filtros de periodo/segmento.
2. KPIs principais no topo.
3. Graficos com leitura comparativa.
4. Tabela de detalhe opcional.

Regras:
- Visual deve privilegiar leitura de tendencia e comparacao.
- Evitar densidade de controles que atrapalhem analise.

### Tipo D - Configuracao e Administracao
Exemplos:
- Configuracoes da empresa
- Parametros de modulo
- Politicas e integracoes

Estrutura recomendada:
1. Navegacao por abas ou secoes.
2. Formularios com validacao forte.
3. Ajuda contextual curta por campo.
4. Log/auditoria quando a mudanca for sensivel.

### Tipo E - Fluxo Guiado (Wizard)
Exemplos:
- Onboarding
- Criacao de proposta complexa
- Configuracao inicial de integracao

Estrutura recomendada:
1. Passos claros com progresso.
2. Validacao por etapa.
3. Salvamento parcial quando possivel.
4. Revisao final antes de confirmar.

## Uso dos Templates Padrao
`StandardPageTemplate` e `StandardDataTable` continuam oficiais, mas com regra clara:

- Obrigatorio por padrao em telas Tipo A e boa parte de Tipo D.
- Opcional em Tipo C.
- Nao obrigatorio em Tipo B e Tipo E, onde o fluxo exige composicao especifica.

## Quando Criar Layout Especifico
Crie layout especifico somente se pelo menos um item for verdadeiro:
- O fluxo e em tempo real e requer alta densidade operacional.
- O template padrao piora tempo de execucao da tarefa.
- Existe necessidade de interacao que o template nao cobre sem gambiarras.
- Ha requisito de negocio critico (SLA, monitoramento ao vivo, triagem).

Se nenhum item for verdadeiro, use o template padrao.

## Checklist de PR (Obrigatorio)
Antes de aprovar tela nova ou refatorada:

1. A tela foi classificada em Tipo A, B, C, D ou E?
2. O motivo do layout escolhido esta documentado no PR?
3. Estados de loading, empty, erro e sucesso estao implementados?
4. Requisitos de acessibilidade basica foram atendidos?
5. Regras de multi-tenant e permissoes foram validadas?
6. Responsividade desktop/mobile esta validada?
7. Componentes compartilhados foram reutilizados onde fazia sentido?

## Padrao de Evolucao do Design System
Quando surgir necessidade nova:

1. Resolver primeiro no modulo com composicao local.
2. Validar se o padrao se repete em 2+ telas.
3. Se repetir, extrair para componente compartilhado.
4. Atualizar este guia com exemplo real.

## Aplicacao no ConectCRM (Diretriz Atual)
- `Clientes`, `Contatos`, `Fornecedores`: manter base Tipo A com variacoes leves por dominio.
- `Atendimento Omnichannel`: tratar como Tipo B (operacional), sem forcar template de lista.
- `Dashboards`: tratar como Tipo C.
- `Configuracoes`: tratar como Tipo D.

## Conclusao
Padronizacao no ConectCRM nao significa telas identicas.

Significa:
- Mesma linguagem visual e tecnica.
- Mesmos principios de qualidade.
- Experiencias diferentes quando a funcao da tela exigir.

Essa abordagem reduz inconsistencias sem sacrificar usabilidade por modulo.
