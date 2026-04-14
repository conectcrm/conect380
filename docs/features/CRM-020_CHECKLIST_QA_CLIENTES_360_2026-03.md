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

- [x] Acessar tela de clientes e validar carregamento sem erro.
- [x] Buscar por nome e confirmar filtragem correta.
- [x] Buscar por documento e confirmar filtragem correta.
- [x] Filtrar por status (`lead`, `prospect`, `cliente`, `inativo`).
- [x] Filtrar por tipo (`pessoa_fisica`, `pessoa_juridica`).
- [x] Filtrar por tag e conferir resultados.
- [x] Filtrar follow-up (`pendente` e `vencido`).
- [x] Filtrar por `origem` e por `responsavelId`.
- [x] Limpar filtros e confirmar retorno ao estado inicial.

## Bloco 2 - Cadastro e edicao

- [x] Criar cliente com campos obrigatorios (`nome`, `email`) e validar sucesso.
- [x] Criar cliente preenchendo dados adicionais (endereco, observacoes, tags, follow-up).
- [x] Criar/editar cliente preenchendo dados comerciais (`origem`, `responsavel_id`).
- [x] Editar cliente existente e confirmar persistencia dos campos alterados.
- [x] Validar mensagens de erro para campos invalidos (ex.: email invalido).
- [x] Validar confirmacao visual de sucesso apos salvar.

## Bloco 3 - Perfil do cliente

- [x] Abrir perfil a partir da listagem (modal/pagina conforme fluxo atual).
- [x] Confirmar exibicao dos dados basicos do cliente.
- [x] Confirmar exibicao de tags e follow-up no perfil.
- [x] Confirmar exibicao de `origem` e `responsavel_id` no perfil.
- [x] Validar abertura de perfil para cliente com e sem dados opcionais.

## Bloco 4 - Integracoes principais do perfil

- [x] Resumo de tickets carrega com contadores (`total`, `abertos`, `resolvidos`).
- [x] Resumo de propostas carrega sem erro.
- [x] Resumo de contratos carrega sem erro.
- [x] Resumo de faturas carrega sem erro.
- [x] Acoes de navegacao para modulos relacionados mantem contexto de cliente.

## Bloco 5 - Exportacao e consistencia

- [x] Exportar CSV sem filtros e validar download.
- [x] Exportar CSV com filtros ativos e validar recorte.
- [x] Confirmar colunas de contrato no CSV (`tags`, `ultimo_contato`, `proximo_contato`, `origem`, `responsavel_id`).

## Bloco 6 - Estados e UX

- [x] Validar estado de loading na listagem.
- [x] Validar estado vazio para busca sem resultado.
- [x] Validar estado de erro em falha de API (mensagem amigavel).
- [x] Validar responsividade basica (desktop e mobile).

## Observacoes da rodada assistida local (2026-03-12)

- Itens marcados como concluidos nos blocos 1-6 foram validados por automacao (`npm run test:e2e:clientes`, `npm run test:e2e:clientes:ux`, `npm run test:e2e:clientes:cadastro-perfil` e `npm run test:e2e:clientes:evidencias`) em modo mock.
- Ajustes de UI aplicados na mesma rodada:
  - filtros de listagem para `tag`, `follow-up`, `origem` e `responsavelId` agora estao expostos na barra de filtros;
  - `origem` e `responsavel_id` agora sao exibidos no perfil do cliente.
- Pendencias atuais para sign-off final: rodada manual em ambiente alvo e registro formal de aprovacao QA.

## Execucao manual em ambiente alvo

- Runbook: `docs/features/CRM-020_RUNBOOK_SIGNOFF_MANUAL_2026-03.md`
- Template de resultado: `docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv`
- Criacao de sessao de execucao: `npm run qa:crm020:signoff:init -- homolog`
- Baseline local pre-preenchido (opcional, para acelerar preenchimento): `npm run qa:crm020:signoff:seed:local -- docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_local-mock.csv`
- Baseline de homolog pre-preenchido desta rodada: `docs/features/CRM-020_SIGNOFF_RESULTADOS_20260312_homolog-prep.csv` (32 PASS, 7 PENDENTE)
- Completar apenas os 7 pendentes com evidencias reais (opcional): `npm run qa:crm020:signoff:pendings:complete -- docs/features/CRM-020_SIGNOFF_RESULTADOS_20260312_homolog-prep.csv docs/features/CRM-020_SIGNOFF_RESULTADOS_20260312_homolog-final.csv --executor qa.lider --date 2026-03-12 --preflight-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_20260312.md --bugs-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_20260312.md --approval-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_20260312.md`
- Protecao: `pendings:complete` bloqueia evidencia com placeholders (`TODO`) e checkbox pendente (`[ ]`); para teste tecnico somente, adicionar `--allow-placeholder-evidence`.
- Arquivo de evidencia final da rodada (template inicial): `docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_20260312.md`
- Consolidacao de resultado: `npm run qa:crm020:signoff:report -- docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv homolog`
- Gate de validacao final: `npm run qa:crm020:signoff:validate -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv`
- Fechamento em comando unico (report + validate): `npm run qa:crm020:signoff:close -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv homolog`
- Fechamento parcial (permitindo pendencias): `npm run qa:crm020:signoff:close:allow-pending -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv homolog`
- Fechamento completo com aplicacao automatica no checklist (somente gate estrito, sem `--allow-pending`): `npm run qa:crm020:signoff:close:apply -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv homolog docs/features/evidencias/CRM020_SIGNOFF_MANUAL_SUMMARY_YYYYMMDD.md docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md`
- Finalizacao completa (completa pendencias + fechamento estrito + aplicacao checklist): `npm run qa:crm020:signoff:finalize -- --input docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog-prep.csv --output docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog-final.csv --environment homolog --summary-output docs/features/evidencias/CRM020_SIGNOFF_MANUAL_SUMMARY_YYYYMMDD_homolog.md --checklist docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md --executor qa.lider --date 2026-03-12 --preflight-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_YYYYMMDD.md --bugs-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_YYYYMMDD.md --approval-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_YYYYMMDD.md`
- Aplicacao automatica do sign-off no checklist oficial (somente com gate PASS): `npm run qa:crm020:signoff:apply -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv homolog docs/features/evidencias/CRM020_SIGNOFF_MANUAL_SUMMARY_YYYYMMDD.md`
- Evidencias de homolog/producao devem ser publicadas em `docs/features/evidencias/`.

## Regressao minima antes de deploy

- [x] Rodar suite de contrato backend (`clientes.contract.spec.ts`).
- [x] Rodar suite de contrato frontend (`clientesService.contract.test.ts`).
- [x] Rodar suite funcional backend (`clientes.controller.functional.spec.ts`).
- [x] Rodar suite E2E dedicada de clientes (`npm run test:e2e:clientes`).

## Evidencias obrigatorias

- [x] Captura da listagem com filtros aplicados.
- [x] Captura do cadastro/edicao com sucesso.
- [x] Captura do perfil com integracoes carregadas.
- [x] Captura ou anexo do CSV exportado.
- [x] Registro dos testes automatizados executados (comando + resultado).

### Registro de testes automatizados (2026-03-12)

1. Contrato backend (PASS)
   - Comando: `cd backend && npm test -- clientes.contract.spec.ts --runInBand`
   - Resultado: `1 suite passed`, `4/4 testes PASS`.
2. Funcional backend (PASS)
   - Comando: `cd backend && npm test -- clientes.controller.functional.spec.ts --runInBand`
   - Resultado: `1 suite passed`, `6/6 testes PASS`.
3. Contrato frontend (PASS)
   - Comando: `cd frontend-web && CI=true npm test -- --watch=false --runInBand src/services/__tests__/clientesService.contract.test.ts`
   - Resultado: `1 suite passed`, `3/3 testes PASS`.
4. Suite E2E clientes (PASS complementar)
   - Comando: `npm run test:e2e:clientes`
   - Resultado: `13/13 cenarios PASS` (chromium, `TEST_E2E_AUTH_MODE=mock`).
5. Suite E2E de evidencias CRM-020 (PASS complementar)
   - Comando: `npm run test:e2e:clientes:evidencias`
   - Resultado: `1/1 cenario PASS` (chromium, geracao de screenshots + CSV).
6. Suite E2E de estados/UX de clientes (PASS complementar)
   - Comando: `npm run test:e2e:clientes:ux`
   - Resultado: `4/4 cenarios PASS` (chromium, `TEST_E2E_AUTH_MODE=mock`).
7. Suite E2E de cadastro/perfil complementar (PASS complementar)
   - Comando: `npm run test:e2e:clientes:cadastro-perfil`
   - Resultado: `4/4 cenarios PASS` (chromium, `TEST_E2E_AUTH_MODE=mock`).

### Registro de evidencias visuais e exportacao (2026-03-12)

- Listagem com filtros:
  - `docs/features/evidencias/CRM020_QA_CLIENTES_360_20260312_listagem_filtros.png`
- Listagem apos limpar filtros:
  - `docs/features/evidencias/CRM020_QA_CLIENTES_360_20260312_listagem_limpa.png`
- Cadastro com sucesso:
  - `docs/features/evidencias/CRM020_QA_CLIENTES_360_20260312_cadastro_sucesso.png`
- Edicao com sucesso:
  - `docs/features/evidencias/CRM020_QA_CLIENTES_360_20260312_edicao_sucesso.png`
- Perfil (dados basicos):
  - `docs/features/evidencias/CRM020_QA_CLIENTES_360_20260312_perfil_dados_basicos.png`
- Perfil (integracoes):
  - `docs/features/evidencias/CRM020_QA_CLIENTES_360_20260312_perfil_integracoes.png`
- Exportacao CSV sem filtros:
  - `docs/features/evidencias/CRM020_QA_CLIENTES_360_20260312_export_sem_filtros.csv`
- Exportacao CSV com filtros:
  - `docs/features/evidencias/CRM020_QA_CLIENTES_360_20260312_export_com_filtros.csv`

Referencia desta rodada:
- `docs/features/evidencias/CRM020_QA_CLIENTES_360_20260312.md`

## Criterio de sign-off

- [ ] Todos os itens obrigatorios concluidos.
- [ ] Nenhum bug critico ou bloqueante aberto para o modulo.
- [ ] Aprovacao final de QA registrada no card CRM-020.
