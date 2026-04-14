# Relatorio de Comercializacao - Baseline 2026-03-22

## 1. Objetivo

Responder, de forma objetiva, quais modulos/fluxos do Conect360 estao em condicao de comercializacao **hoje** (2026-03-22), qual pacote inicial faz sentido e quais frentes devem ficar pos-MVP para reduzir risco operacional.

Este relatorio prioriza evidencias de codigo, testes e checklists vigentes do repositorio (na ordem recomendada em `docs/INDICE_DOCUMENTACAO.md`).

## 2. Fontes usadas (evidencias)

MVP/Go-live e evidencias:
- `docs/features/CHECKLIST_GO_LIVE_FLUXO_VENDAS_MVP_2026-03.md`
- `docs/features/evidencias/PREFLIGHT_GO_LIVE_CORE_20260305-083446.md`
- `docs/features/evidencias/PREFLIGHT_GO_LIVE_FULL_20260305-084855.md`
- `docs/features/evidencias/SMOKE_MVP_UI_20260305-084855.md`
- `docs/features/evidencias/CONTRATOS_MVP_VALIDACAO_LOCAL_20260305-092356.md`
- `docs/features/evidencias/AUDITORIA_PERMISSOES_COMPRAS_MVP_20260305.md`

Suite MVP (operacao):
- `.production/scripts/preflight-mvp-go-live.ps1`
- `.production/scripts/smoke-mvp-core.ps1`
- `.production/scripts/smoke-mvp-ui.ps1`
- `.production/MVP_GO_NO_GO_2026-02-17.md` (historico de GO em 2026-02)

Governanca e maturidade por dominio:
- `docs/handbook/MATRIZ_COBERTURA_REQUISITOS_2026-03.md`
- `docs/handbook/RELATORIO_FINAL_COBERTURA_REQUISITOS_2026-03.md`

Planos/pacotes comerciais (canonicos):
- `docs/features/GDN-001_MATRIZ_PLANOS_GUARDIAN_V1_2026-03-07.md`
- `docs/features/GDN-004_PACOTES_VENDAS_COPY_2026-03-07.md`
- `backend/src/modules/planos/planos.defaults.ts` (seed de planos/modulos)

## 3. Resumo executivo (recomendacao)

Recomendacao para comecar agora:
- Comercializar um **MVP de Vendas (GO Core / MVP mode)** como pacote inicial, porque cobre o fluxo validado:
  - Lead -> Pipeline/Oportunidade -> Proposta -> Contrato
  - Compras (cotacoes/aprovacoes) no nucleo financeiro
  - Analytics comercial
- Manter **Atendimento** fora do baseline comercial inicial (pos-MVP / estabilizacao).
- Manter **billing/faturamento/gateways em producao** fora do escopo inicial (continuam pos-MVP).

Alternativa (quando fizer sentido comercial):
- Comercializar um pacote **Starter (CRM)** para operacoes pequenas que queiram apenas leads/pipeline, com menor complexidade.
- Observacao: exige ajustar catalogo de planos/modulos (ou modulos ativos por empresa) para nao incluir Atendimento nesse pacote.

## 4. Mudanca relevante de escopo (2026-02 vs 2026-03)

Existe um ponto importante para alinhamento interno:
- Em `2026-02-17` (plano inicial), o MVP comercial estava mais restrito e citava financeiro/contratos como "fora do MVP".
- Em `2026-03` o escopo do MVP de vendas foi **formalmente ampliado** e validado para incluir:
  - Compras no nucleo financeiro (`/financeiro/cotacoes`, `/financeiro/compras/aprovacoes`)
  - Fechamento via contratos (`/contratos`, `/contratos/:id`)
Referencia: `docs/features/CHECKLIST_GO_LIVE_FLUXO_VENDAS_MVP_2026-03.md`.

Para "comecar com algo e ir avancando", use o escopo de 2026-03 como baseline atual.

## 5. Escopo MVP comercial (baseline vigente)

Fluxos que estao no MVP (validado):
- Fluxo principal: Lead -> Pipeline/Oportunidade -> Proposta -> Contrato
- Compras (nucleo financeiro):
  - `/financeiro/cotacoes`
  - `/financeiro/compras/aprovacoes`
- Analytics:
  - `/relatorios/analytics` (comercial)

Fluxos explicitamente fora do MVP (por risco/complexidade):
- Billing/faturamento completo e self-service de assinaturas (ate habilitar providers)
- Gateways de pagamento em producao sem providers explicitamente habilitados
- Financeiro completo (ex.: contas a pagar/conciliacao) fora do pacote MVP de vendas
- CRM avancado (clientes/contatos/interacoes/agenda expandida) como foco inicial de go-live comercial

## 6. O que podemos comercializar hoje (por modulo)

Legenda:
- "SIM (GA)": recomendavel vender como baseline hoje.
- "SIM (Pilot)": pode vender em piloto controlado, com expectativa alinhada.
- "NAO": evitar vender como promessa de curto prazo.

### 6.1 CRM (Modulo `CRM`)

Status: SIM (GA) no recorte MVP.

Escopo recomendado para vender agora:
- Leads + pipeline/oportunidades
- Analytics comercial (dashboard)

Evidencias:
- Preflight GO Core e Full (2026-03-05) em PASS
- Suite de smoke UI do MVP inclui `/leads` e `/pipeline`

Observacao:
- Clientes/contatos/interacoes e agenda existem no produto, mas nao sao o foco do baseline MVP comercial.

### 6.2 Atendimento (Modulo `ATENDIMENTO`)

Status: NAO (baseline comercial) no recorte MVP inicial.

Escopo recomendado para vender agora:
- Nao recomendado vender como promessa do MVP inicial.

Evidencias:
- Existem fluxos e endpoints implementados, mas ha sinais claros de features ainda em construcao:
  - Suites E2E de distribuicao/atribuicao tem varios `it.skip` e TODOs em `backend/test/atendimento/*`.
  - Rotas e UX de inbox/omnichannel dependem de flag e estabilizacao adicional.

Recomendacao:
- Tratar Atendimento como fase pos-MVP (ou piloto controlado) apos uma rodada de estabilizacao + smoke dedicado.

### 6.3 Vendas (Modulo `VENDAS`)

Status: SIM (GA) no recorte MVP.

Escopo recomendado para vender agora:
- Propostas
- Fechamento via contratos (rotas `/contratos/*`)

Evidencias:
- E2E dedicado de contratos: `docs/features/evidencias/CONTRATOS_MVP_VALIDACAO_LOCAL_20260305-092356.md`
- Smoke UI do MVP valida rotas core do comercial

### 6.4 Financeiro (Modulo `FINANCEIRO`)

Status: SIM (GA) apenas para **Compras MVP**.

Escopo recomendado para vender agora:
- Cotacoes e aprovacoes no nucleo financeiro (Compras MVP)

Evidencias:
- Escopo MVP documentado em `CHECKLIST_GO_LIVE_FLUXO_VENDAS_MVP_2026-03.md`
- Evidencia de auditoria de permissoes de compras por tenant: `AUDITORIA_PERMISSOES_COMPRAS_MVP_20260305.md`

Fora de escopo para vender agora:
- Contas a pagar/receber completo, conciliacao bancaria e fechamento financeiro mensal (tratar como fase seguinte).

### 6.5 Billing (Modulo `BILLING`)

Status: NAO como baseline inicial do go-live comercial.

Motivo:
- O modo Full exige providers habilitados e alinhados entre frontend e backend (`validate:release:vendas:full`).
- Para iniciar, o caminho de menor risco e operar sem self-service de pagamentos.

### 6.6 Administracao / Guardian (Modulo `ADMINISTRACAO`)

Status: SIM (GA) como capacidade interna de operacao (nao como "modulo de valor" primario ao cliente no MVP).

O que isso habilita:
- Governanca e seguranca (RBAC/permissoes, trilha de auditoria, hardening admin)
- Backoffice e controles de rollout

Evidencias:
- Dominio classificado como "Forte" na matriz de cobertura 2026-03.
- Artefatos e smokes em `.production/` para governanca.

## 7. Pacotes comerciais (canonicos) e como vender hoje

Fonte canonica:
- `docs/features/GDN-004_PACOTES_VENDAS_COPY_2026-03-07.md` (preco/copy)
- `docs/features/GDN-001_MATRIZ_PLANOS_GUARDIAN_V1_2026-03-07.md` (modulos por plano)
- `backend/src/modules/planos/planos.defaults.ts` (seed e limites)

Nota (baseline 2026-03-22):
- Embora os pacotes canonicos incluam `ATENDIMENTO`, para o MVP inicial recomenda-se **nao comercializar/habilitar** este modulo ate estabilizacao.

### Starter (R$ 149/m)
- Modulos: CRM + ATENDIMENTO
- Quando oferecer: cliente quer organizar leads/pipeline e atendimento, sem fechamento via propostas/contratos e sem compras.

### Business (R$ 549/m) - RECOMENDADO PARA INICIO (MVP)
- Modulos: CRM + ATENDIMENTO + VENDAS + FINANCEIRO
- Como vender agora: habilitar **MVP mode** (GO Core) para:
  - liberar apenas o escopo MVP de vendas + compras
  - manter billing/faturamento/gateways fora (pos-MVP)

### Enterprise (R$ 1790/m)
- Modulos: CRM + ATENDIMENTO + VENDAS + FINANCEIRO + BILLING + ADMINISTRACAO
- Quando oferecer: quando billing/self-service e governanca completa estiverem no pacote final (ou quando o contrato justificar operacao dedicada).

## 8. Preparacao para comecar (checklist pratico)

### 8.1 Guardrails de release (Core vs Full)

GO Core (MVP comercial) deve garantir:
- `REACT_APP_MVP_MODE=true`
- `REACT_APP_PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false`
- `REACT_APP_PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=` (vazio)
- `PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED=false`
- `PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS=` (vazio)

Comando:
- `npm run validate:release:vendas:core`

### 8.2 Smoke/preflight (pacote MVP)

Antes de demos/pilotos:
- `.production/scripts/preflight-mvp-go-live.ps1`
- `.production/scripts/smoke-mvp-core.ps1`
- `.production/scripts/smoke-mvp-ui.ps1`

### 8.3 Omnichannel (inbox/chat)

O inbox depende de feature flag no build. No MVP inicial, mantenha desabilitado.

Quando for habilitar Atendimento:
- Garanta `REACT_APP_ENABLE_OMNICHANNEL=true` no build do frontend.

### 8.4 Piloto comercial (operacao controlada)

Se o objetivo for ativacao por ondas:
- `.production/MVP_ROLLOUT_WAVE1_2026-02-18.md`
- `.production/scripts/start-mvp-pilot.ps1`
- `.production/scripts/run-mvp-pilot-cycle.ps1`
- `.production/scripts/check-mvp-pilot-functional-coverage.ps1`
- `.production/scripts/assess-mvp-pilot-readiness.ps1`

## 9. O que deixar explicitamente pos-MVP (para nao travar o inicio)

Recomendacao de corte para reduzir risco e acelerar comercializacao:
- Billing self-service completo (checkout/upgrade/downgrade automatizado) e gateways em producao
- Fiscal (NFSe/NFe) e provider oficial
- Email omnichannel (inbound/threading) ate ter homologacao operacional no ambiente alvo
- Agenda e sincronizacao externa (Google/Outlook) ate fechar homologacao operacional
- Catalogo flexivel para todos os tenants (usar rollout controlado por allowlist)
