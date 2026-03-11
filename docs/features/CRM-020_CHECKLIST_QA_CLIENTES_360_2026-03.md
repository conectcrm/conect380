# CRM-020 - Checklist de QA do Modulo de Clientes 360

## Objetivo

Padronizar a validacao manual minima para releases do modulo de clientes, cobrindo cadastro, listagem, perfil e integracoes principais.

## Pre-condicoes

- [ ] Backend em execucao (`cd backend && npm run start:dev`).
- [ ] Frontend em execucao (`cd frontend-web && npm start`).
- [ ] Usuario com permissao para CRUD de clientes.
- [ ] Base de teste com pelo menos 3 clientes (lead, prospect e cliente).
- [ ] Pelo menos 1 cliente com tags, follow-up e dados comerciais (`origem`, `responsavel_id`).

## Bloco 1 - Listagem e filtros

- [ ] Acessar tela de clientes e validar carregamento sem erro.
- [ ] Buscar por nome e confirmar filtragem correta.
- [ ] Buscar por documento e confirmar filtragem correta.
- [ ] Filtrar por status (`lead`, `prospect`, `cliente`, `inativo`).
- [ ] Filtrar por tipo (`pessoa_fisica`, `pessoa_juridica`).
- [ ] Filtrar por tag e conferir resultados.
- [ ] Filtrar follow-up (`pendente` e `vencido`).
- [ ] Filtrar por `origem` e por `responsavelId`.
- [ ] Limpar filtros e confirmar retorno ao estado inicial.

## Bloco 2 - Cadastro e edicao

- [ ] Criar cliente com campos obrigatorios (`nome`, `email`) e validar sucesso.
- [ ] Criar cliente preenchendo dados adicionais (endereco, observacoes, tags, follow-up).
- [ ] Criar/editar cliente preenchendo dados comerciais (`origem`, `responsavel_id`).
- [ ] Editar cliente existente e confirmar persistencia dos campos alterados.
- [ ] Validar mensagens de erro para campos invalidos (ex.: email invalido).
- [ ] Validar confirmacao visual de sucesso apos salvar.

## Bloco 3 - Perfil do cliente

- [ ] Abrir perfil a partir da listagem (modal/pagina conforme fluxo atual).
- [ ] Confirmar exibicao dos dados basicos do cliente.
- [ ] Confirmar exibicao de tags e follow-up no perfil.
- [ ] Confirmar exibicao de `origem` e `responsavel_id` no perfil.
- [ ] Validar abertura de perfil para cliente com e sem dados opcionais.

## Bloco 4 - Integracoes principais do perfil

- [ ] Resumo de tickets carrega com contadores (`total`, `abertos`, `resolvidos`).
- [ ] Resumo de propostas carrega sem erro.
- [ ] Resumo de contratos carrega sem erro.
- [ ] Resumo de faturas carrega sem erro.
- [ ] Acoes de navegacao para modulos relacionados mantem contexto de cliente.

## Bloco 5 - Exportacao e consistencia

- [ ] Exportar CSV sem filtros e validar download.
- [ ] Exportar CSV com filtros ativos e validar recorte.
- [ ] Confirmar colunas de contrato no CSV (`tags`, `ultimo_contato`, `proximo_contato`, `origem`, `responsavel_id`).

## Bloco 6 - Estados e UX

- [ ] Validar estado de loading na listagem.
- [ ] Validar estado vazio para busca sem resultado.
- [ ] Validar estado de erro em falha de API (mensagem amigavel).
- [ ] Validar responsividade basica (desktop e mobile).

## Regressao minima antes de deploy

- [ ] Rodar suite de contrato backend (`clientes.contract.spec.ts`).
- [ ] Rodar suite de contrato frontend (`clientesService.contract.test.ts`).
- [ ] Rodar suite funcional backend (`clientes.controller.functional.spec.ts`).

## Evidencias obrigatorias

- [ ] Captura da listagem com filtros aplicados.
- [ ] Captura do cadastro/edicao com sucesso.
- [ ] Captura do perfil com integracoes carregadas.
- [ ] Captura ou anexo do CSV exportado.
- [ ] Registro dos testes automatizados executados (comando + resultado).

## Criterio de sign-off

- [ ] Todos os itens obrigatorios concluidos.
- [ ] Nenhum bug critico ou bloqueante aberto para o modulo.
- [ ] Aprovacao final de QA registrada no card CRM-020.
