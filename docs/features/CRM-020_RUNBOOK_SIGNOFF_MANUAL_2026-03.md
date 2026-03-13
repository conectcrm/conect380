# CRM-020 - Runbook de Sign-off Manual (Homolog/Producao)

## Objetivo

Executar e registrar a validacao manual final do modulo Clientes 360 em ambiente alvo (sem mocks), concluindo o sign-off do CRM-020.

## Escopo

- Confirmar os comportamentos ja validados localmente em automacao.
- Confirmar operacao real de ponta a ponta (frontend + backend + dados reais controlados).
- Registrar evidencias e aprovacao final de QA.

## Entradas obrigatorias

- URL do frontend alvo (homolog/producao).
- URL da API alvo.
- Usuario com permissao de CRUD de clientes.
- Base com ao menos:
  - 1 lead
  - 1 prospect
  - 1 cliente
  - 1 cliente com tags, follow-up, origem e responsavel comercial

## Preflight de ambiente (obrigatorio)

1. Validar acesso ao frontend alvo:
   - Abrir URL e confirmar carregamento da tela de login.
2. Validar autenticacao:
   - Login com usuario QA e acesso a `/clientes`.
3. Validar API alvo:
   - Confirmar que a listagem responde sem erro na tela de clientes.
4. Validar permissao:
   - Usuario consegue criar/editar cliente e abrir perfil.

## Execucao manual do checklist

1. Usar como referencia principal:
   - `docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md`
2. Registrar resultado item a item no template:
   - `docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv`
   - Opcional: criar arquivo de sessao para nao alterar o template:
     - `npm run qa:crm020:signoff:init -- homolog`
   - Opcional: gerar baseline local pre-preenchido (blocos 1-6 em PASS com evidencias da rodada local/mock):
     - `npm run qa:crm020:signoff:seed:local -- docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_local-mock.csv`
3. Registrar evidencias em:
   - `docs/features/evidencias/`
4. Padrao de evidencias sugerido:
   - `CRM020_SIGNOFF_MANUAL_YYYYMMDD_<tipo>.png|csv|txt`
5. Gerar resumo consolidado apos preencher CSV:
   - Exemplo usando template: `npm run qa:crm020:signoff:report -- docs/features/CRM-020_SIGNOFF_RESULTADOS_2026-03_TEMPLATE.csv homolog`
   - Exemplo usando arquivo de sessao: `npm run qa:crm020:signoff:report -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv homolog`
6. Validar gate final de aprovacao:
   - `npm run qa:crm020:signoff:validate -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv`
   - Opcional (acompanhamento parcial sem bloquear): `node scripts/qa/validate-crm020-signoff.mjs docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv --allow-pending`
7. Opcional: completar automaticamente apenas os 7 itens pendentes (pre-condicoes + sign-off final) apos validacao manual real:
   - Evidencia base sugerida: `docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_TEMPLATE.md` (copiar para arquivo da rodada e preencher)
   - Exemplo de arquivo da rodada: `docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_20260312.md`
   - O comando bloqueia arquivo de evidencia com placeholders (`TODO`) ou checkbox pendente (`[ ]`). Use `--allow-placeholder-evidence` apenas para teste tecnico.
   - Comando:
     - `npm run qa:crm020:signoff:pendings:complete -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog-prep.csv docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog-final.csv --executor qa.lider --date 2026-03-12 --preflight-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_YYYYMMDD.md --bugs-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_YYYYMMDD.md --approval-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_YYYYMMDD.md`
8. Opcao de fechamento em comando unico:
   - `npm run qa:crm020:signoff:close -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv homolog`
   - Modo parcial (aceita pendencias): `npm run qa:crm020:signoff:close:allow-pending -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv homolog`
   - Fechamento completo com aplicacao automatica no checklist (somente gate estrito, sem `--allow-pending`): `npm run qa:crm020:signoff:close:apply -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv homolog docs/features/evidencias/CRM020_SIGNOFF_MANUAL_SUMMARY_YYYYMMDD.md docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md`
   - Finalizacao completa (completa pendencias + fechamento estrito + aplicacao checklist): `npm run qa:crm020:signoff:finalize -- --input docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog-prep.csv --output docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog-final.csv --environment homolog --summary-output docs/features/evidencias/CRM020_SIGNOFF_MANUAL_SUMMARY_YYYYMMDD_homolog.md --checklist docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md --executor qa.lider --date 2026-03-12 --preflight-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_YYYYMMDD.md --bugs-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_YYYYMMDD.md --approval-evidence docs/features/evidencias/CRM020_SIGNOFF_HOMOLOG_FINAL_YYYYMMDD.md`
9. Aplicar sign-off no checklist oficial (executa validacao estrita antes da escrita):
   - `npm run qa:crm020:signoff:apply -- docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv homolog docs/features/evidencias/CRM020_SIGNOFF_MANUAL_SUMMARY_YYYYMMDD.md`
   - Opcional (flags avancadas via node): `node scripts/qa/apply-crm020-signoff.mjs --input docs/features/CRM-020_SIGNOFF_RESULTADOS_YYYYMMDD_homolog.csv --environment homolog --summary docs/features/evidencias/CRM020_SIGNOFF_MANUAL_SUMMARY_YYYYMMDD.md --checklist docs/features/CRM-020_CHECKLIST_QA_CLIENTES_360_2026-03.md --date 2026-03-12`

## Evidencias minimas esperadas

- Captura da listagem com filtros.
- Captura da listagem sem resultados (estado vazio).
- Captura do estado de erro amigavel (quando aplicavel no ambiente).
- Captura de cadastro com sucesso.
- Captura de edicao com sucesso.
- Captura de validacao de erro de e-mail invalido.
- Captura de perfil com dados opcionais.
- Captura de perfil sem dados opcionais.
- CSV exportado sem filtros.
- CSV exportado com filtros.

## Criterio de aprovacao

- Todos os itens do checklist CRM-020 com resultado `PASS`.
- Nenhum bug `critico` ou `bloqueante` aberto para o modulo.
- QA Lead e Product Owner com aprovacao registrada.
- Para itens com `PASS`, `FAIL` ou `BLOQUEADO`, preencher:
  - `evidencia` (arquivo local existente ou URL);
  - `executado_por`;
  - `executado_em` (YYYY-MM-DD ou ISO datetime).

## Registro de decisao final

- Data da execucao:
- Ambiente alvo:
- Responsavel QA:
- Resultado final:
  - [ ] Aprovado para producao
  - [ ] Reprovado (requer correcao)
- Ticket/card de aprovacao:
- Observacoes finais:
