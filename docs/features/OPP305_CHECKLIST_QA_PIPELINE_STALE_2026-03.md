# OPP-305 - Checklist QA Pipeline stale (2026-03)

## 1. Objetivo

Validar o comportamento funcional e visual da deteccao de oportunidades paradas no Pipeline e no modal de detalhes, sem regressao de lifecycle.

## 2. Pre-condicoes

- [ ] Tenant com lifecycle habilitado.
- [ ] Usuario com permissao `config.automacoes.manage` para editar politica.
- [ ] Usuario sem permissao para validar modo somente leitura.
- [ ] Base com oportunidades abertas com e sem atividade recente.

## 3. Evidencias automatizadas

- [x] Consolidado: `npm run test:opp305:stale`
- [x] `backend`: `npm test -- modules/oportunidades/oportunidades.stale-rules.spec.ts modules/oportunidades/oportunidades.stage-rules.spec.ts --runInBand`
- [x] `backend`: `npm test -- modules/oportunidades/oportunidades.controller.spec.ts --runInBand`
- [x] `frontend-web`: `CI=true npm test -- oportunidadesService.stale.test.ts --watch=false --runInBand`
- [x] `frontend-web`: `npm run type-check`
- [x] Relatorio consolidado: `docs/features/evidencias/OPP305_RELATORIO_QA_STALE_20260306-100919.md`
- [x] Smoke homologacao (dry-run): `npm run test:opp305:homolog:dryrun` -> `docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_20260306-092704.md`
- [x] Smoke homologacao (real/local) - tentativa inicial com falha de autenticacao/intermitencia:
  - `powershell -ExecutionPolicy Bypass -File scripts/qa-opp305-stale-homologacao.ps1 -BaseUrl http://localhost:3001 -Email <usuario> -Senha <senha>`
  - `docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_20260306-110142.md`
- [x] Smoke homologacao (real/local) - rerun autenticado em PASS:
  - `powershell -ExecutionPolicy Bypass -File scripts/qa-opp305-stale-homologacao.ps1 -BaseUrl http://localhost:3001 -Email <usuario> -Senha <senha>`
  - `docs/features/evidencias/OPP305_HOMOLOG_API_SMOKE_20260306-110229.md`
  - Resultado: 5/5 PASS, sem `401`.

## 4. Cenarios de QA manual

## 4.1 Politica stale no Pipeline

- [ ] Abrir Pipeline na visao `Abertas`.
- [ ] Validar exibicao do bloco "Politica de oportunidades paradas".
- [ ] Alterar `Limite para marcar parada (dias)` e salvar.
- [ ] Alterar `Autoarquivar oportunidades paradas` e `Dias para autoarquivar` e salvar.
- [ ] Validar botao `Reverter` restaurando rascunho local antes de salvar.
- [ ] Validar que usuario sem permissao ve modo somente leitura (sem salvar).

## 4.2 Sinalizacao visual de stale

- [ ] Validar badge `Parada Xd` no card Kanban de oportunidade aberta stale.
- [ ] Validar badge `Parada Xd` na linha da listagem em modo tabela.
- [ ] Validar ausencia do badge para oportunidade nao stale.
- [ ] Validar ausencia do badge para oportunidades nao abertas (arquivada/lixeira/fechada).

## 4.3 Modal de detalhes

- [ ] Abrir oportunidade stale e validar badge `Parada Xd` no topo do modal.
- [ ] Validar alerta "Oportunidade sem interacao recente" com dias e ultima interacao.
- [ ] Validar que alerta nao aparece para oportunidade nao stale.
- [ ] Validar coexistencia com alerta de SLA (sem sobreposicao visual quebrada).

## 4.4 Regressao de lifecycle

- [ ] Executar arquivar/restaurar/reabrir/excluir a partir do modal de detalhes.
- [ ] Confirmar que mover para lixeira vs excluir permanente segue a visao correta.
- [ ] Validar DnD bloqueado fora da visao `Abertas`.

## 5. Criterios de aceite

- [ ] Configuracao stale salva sem erro e reflete em recarga.
- [ ] Destaque visual stale aparece apenas onde faz sentido.
- [ ] Nenhum fluxo de lifecycle regrediu apos os ajustes.
- [ ] Sem erro de tipagem/build apos alteracoes.

## 6. Resultado da rodada

- Data: 2026-03-06
- Ambiente: local (desenvolvimento)
- Responsavel: Codex (execucao automatizada)
- Resultado final: `GO tecnico (automatizado)` / `PENDENTE QA manual em homolog`
- Observacoes:
  - Todas as suites automatizadas da OPP-305 passaram sem falhas.
  - Smoke real da API stale reexecutado com credencial valida local em 2026-03-06 e concluiu com 5/5 PASS.
  - A decisao final de rollout permanece dependente da rodada manual em tenant piloto.
