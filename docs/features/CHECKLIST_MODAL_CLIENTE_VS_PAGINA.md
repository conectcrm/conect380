# Checklist - Modal de Detalhes do Cliente vs Pagina Completa

## Objetivo

Definir, de forma objetiva, quais informacoes e acoes devem ficar no modal de detalhes do cliente e quais devem ficar na pagina completa (`/clientes/:id`).

## Regra de decisao

- Use **modal** para consulta rapida e decisao imediata.
- Use **pagina completa** para contexto denso, historico detalhado e operacoes de maior risco.
- Se um bloco exigir scroll longo, multiplas secoes ou upload/gestao extensa, deve ir para pagina.

## Escopo obrigatorio do modal

- [ ] Identificacao basica do cliente (nome, avatar, status).
- [ ] Contato rapido (email, telefone e endereco resumido).
- [ ] Detalhes curtos (tipo, data de cadastro).
- [ ] Resumo de anexos e historico em abas compactas.
- [ ] Acoes rapidas de baixo risco: fechar, editar, excluir (com confirmacao), abrir perfil completo.
- [ ] Tempo de abertura e leitura rapida sem navegacao secundaria obrigatoria.

## Escopo obrigatorio da pagina completa

- [ ] Header com contexto completo e acoes principais.
- [ ] Blocos detalhados de contato, endereco e dados adicionais.
- [ ] Relacionamentos consolidados (notas internas, demandas, tags).
- [ ] Area de arquivos e documentos com upload/listagem/acoes.
- [ ] Historico completo de cadastro e atualizacao.
- [ ] Estados completos de loading, erro e vazio.

## Itens que nao devem ficar no modal

- [ ] Fluxos longos de edicao com muitos campos.
- [ ] Upload e gestao extensa de anexos.
- [ ] Informacoes densas que exigem scroll vertical prolongado.
- [ ] Operacoes com dependencia de multiplas etapas.

## Criterios de aceite (UX)

- [ ] Usuario consegue validar dados principais no modal em ate alguns segundos.
- [ ] Botao "Abrir perfil completo" aparece sempre que houver rota de detalhe.
- [ ] Navegacao modal -> pagina preserva contexto do cliente selecionado.
- [ ] Pagina completa apresenta todas as informacoes sem sobrecarregar o modal.

## Cobertura de teste recomendada

- [ ] E2E: abrir modal de cliente pela lista, validar CTA e navegar para `/clientes/:id`.
- [ ] E2E: validar render de dados essenciais da pagina de perfil apos navegacao.
- [ ] QA manual mobile: modal continua legivel e CTA continua acessivel.
