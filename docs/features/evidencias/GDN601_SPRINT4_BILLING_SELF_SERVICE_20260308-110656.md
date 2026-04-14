# GDN-601 - Evidencia Sprint 4 (Billing Self-service)

## Data
- 2026-03-08

## Contexto
- Objetivo da etapa: consolidar Billing do app cliente em modo self-service, com navegacao coerente por rota+query e sem sobreposicao com fluxo administrativo Guardian.

## Entregas aplicadas
- `frontend-web/src/pages/billing/index.tsx`
  - Navegacao de abas baseada em URL (`pathname` + `?tab=`), sem estado local solto para troca de visao.
  - Deep-link funcional para abas (`overview`, `usage`, `plans`, `payment`).
  - Fluxo de pagamento passa a depender de `planId` na URL quando necessario.
  - Back action padronizada para retornar ao resumo de assinatura.
- `frontend-web/src/components/Billing/PlanSelection.tsx`
  - Callback de selecao de plano agora informa contexto (`requiresPayment`).
  - Fluxo de alteracao de plano existente nao direciona indevidamente para checkout.
- `frontend-web/src/components/Billing/PaymentForm.tsx`
  - `planoSelecionado.periodo` e `features` tornam-se opcionais.
  - Fallback de periodo padrao: `Cobranca mensal`.
- `frontend-web/src/config/menuConfig.ts`
  - Semantica de menu ajustada para self-service:
    - Modulo: `Assinatura`
    - Itens: `Resumo da Assinatura` e `Planos e Upgrade`
  - Mantida separacao de cobranca/faturamento para `Financeiro`.
- `frontend-web/src/pages/billing/__tests__/BillingPage.routing.test.tsx`
  - Cobertura de navegacao por URL da BillingPage:
    - deep-link (`tab=usage` e `tab=payment&planId=...`)
    - fallback seguro (`tab=payment` sem `planId`)
    - transicao `plans -> payment` e `plans -> overview`
    - redirect de gestao de cobranca para `/financeiro/faturamento`
- `e2e/billing-self-service.spec.ts`
  - Validacao E2E real de fluxo billing cliente:
    - tabs self-service (`/billing/assinaturas?tab=usage`, `/billing/planos`)
    - fallback de `tab=payment` sem `planId`
    - redirects legados (`/billing/faturas` e `/billing/pagamentos`)
- `e2e/billing-self-service-negative-access.spec.ts`
  - Validacao E2E negativa para bloqueio de billing sem `planos.manage`:
    - sessao carregada com perfil sem permissao de billing
    - acesso a `/billing/assinaturas` e `/billing/planos` retorna tela `Acesso negado`
- `e2e/billing-finance-relay-permissions.spec.ts`
  - Validacao E2E dos relays legados Billing -> Financeiro:
    - com `financeiro.faturamento.read`, `/billing/faturas` e `/billing/pagamentos` redirecionam para `/financeiro/faturamento`
    - sem permissao financeira, ambos caminhos exibem `Acesso negado`
- `e2e/billing-session-security.spec.ts`
  - Validacao E2E de seguranca operacional de sessao no Billing:
    - token expirado + falha de refresh durante `/billing/assinaturas` -> redirect para `/login` com mensagem de sessao expirada
    - falha de refresh com `CONCURRENT_LOGIN` -> redirect para `/login` com mensagem de acesso em outro dispositivo
- `e2e/fixtures.ts`
  - Fixture de autenticacao reforcada para MFA:
    - detecta tela de validacao de seguranca
    - captura codigo MFA exibido em dev (ou usa `TEST_MFA_CODE`)
    - conclui login automaticamente para suites E2E
    - retry automatico de validacao MFA com reenvio quando necessario (estabilidade de execucao)

## Logica de validacao executada
- `npm run type-check` em `frontend-web`: PASS
- `npm run build` em `frontend-web`: PASS
- `CI=true npm test -- menuConfig.permissions.test.ts --runInBand` em `frontend-web`: PASS (28 testes)
- `CI=true npm test -- BillingPage.routing.test.tsx --runInBand` em `frontend-web`: PASS (6 testes)
- `CI=true npm test -- menuConfig.permissions.test.ts BillingPage.routing.test.tsx --runInBand` em `frontend-web`: PASS (34 testes)
- `CI=true npm test -- menuConfig.permissions.test.ts --runInBand` em `frontend-web`: PASS (29 testes)
- `npx playwright test e2e/billing-self-service.spec.ts --project=chromium --reporter=list`: PASS (1 teste)
- `npx playwright test e2e/billing-self-service-negative-access.spec.ts --project=chromium --reporter=list`: PASS (1 teste)
- `npx playwright test e2e/billing-self-service.spec.ts e2e/billing-self-service-negative-access.spec.ts --project=chromium --reporter=list`: PASS (2 testes)
- `npx playwright test e2e/billing-finance-relay-permissions.spec.ts --project=chromium --reporter=list`: PASS (2 testes)
- `npx playwright test e2e/billing-self-service.spec.ts e2e/billing-self-service-negative-access.spec.ts e2e/billing-finance-relay-permissions.spec.ts --project=chromium --reporter=list`: PASS (4 testes)
- `npx playwright test e2e/billing-session-security.spec.ts --project=chromium --reporter=list`: PASS (2 testes)
- `npx playwright test e2e/billing-self-service.spec.ts e2e/billing-self-service-negative-access.spec.ts e2e/billing-finance-relay-permissions.spec.ts e2e/billing-session-security.spec.ts --project=chromium --reporter=list`: PASS (6 testes)

## Cobertura da regra de Sprint 4
- [x] Navegacao por rota + query tab
- [x] Deep-link para abas
- [x] Refresh preserva aba atual
- [x] Remocao de submenu duplicado sem diferenca funcional
- [x] Billing cliente focado em assinatura/upgrade

## Gate local
- Sprint 4 (parcial de frontend self-service): PASS
- Proximo passo recomendado: incluir esses 6 specs no pipeline CI como gate obrigatorio de billing/guardian antes do go-live.
