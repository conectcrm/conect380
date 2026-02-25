## Descricao

Harden do backend do Fluxo de Vendas para cenarios de schema legado e isolamento multi-tenant.

Mudancas principais:

- Corrige compatibilidade do `TenantQueryRunnerPatcher` para evitar mudanca de shape em retorno de queries de escrita (`UPDATE/RETURNING`) quando `useStructuredResult` nao e boolean.
- Adiciona migrations corretivas para:
  - garantir tabelas/indices/FKs de contratos, assinaturas, faturas, itens de fatura e pagamentos;
  - alinhar colunas legadas em `propostas` (`total`, `criadaEm`, `atualizadaEm`, `vendedor_id`);
  - aplicar RLS/policies tenant (`tenant_isolation_*`) nas tabelas de vendas e tabelas remanescentes multi-tenant;
  - alinhar schema legado usado pela suite de permissoes.
- Ajusta servicos de propostas/contratos/faturamento/assinatura digital para conviver com schema legado sem quebrar relacoes opcionais.
- Ajusta agregacao de dashboard para usar consultas SQL robustas em schema legado.
- Inclui suite E2E dedicada de permissoes de vendas (`perfis-acesso-vendas.e2e-spec.ts`) e compatibilizacoes em testes sensiveis.

## Tipo de Mudanca

- [x] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [x] Refatoracao
- [x] Documentacao
- [x] Performance
- [x] Testes

## Modulos Afetados

- [x] Backend
- [ ] Frontend
- [x] Banco de Dados
- [ ] Integracoes
- [ ] Infra/DevOps
- [x] Documentacao

## Issue Relacionada

N/A (hardening corretivo para prontidao de producao do fluxo de vendas)

## Escopo de UX (Frontend) - Obrigatorio se houver tela

### Classificacao da tela

- [ ] Tipo A - Gestao em Lista (CRUD)
- [ ] Tipo B - Operacao em Tempo Real
- [ ] Tipo C - Analytics/Dashboard
- [ ] Tipo D - Configuracao/Administracao
- [ ] Tipo E - Fluxo Guiado (Wizard)
- [x] Nao se aplica (sem tela)

### Decisao de layout

- [ ] Usei template padrao (`StandardPageTemplate`/`StandardDataTable`)
- [ ] Usei layout especifico por necessidade de fluxo
- [x] Nao se aplica

Se escolheu layout especifico, explique o motivo:

N/A

### Checklist UX minimo (Obrigatorio se houver tela)

- [ ] Loading inicial implementado
- [ ] Loading de acao pontual implementado
- [ ] Empty state com CTA implementado
- [ ] Error state com recuperacao implementado
- [ ] Feedback de sucesso/erro implementado
- [ ] Responsividade desktop/mobile validada
- [ ] Acessibilidade basica (teclado, foco visivel, labels) validada

## Checklist Tecnico (Obrigatorio)

- [x] Fiz self-review do codigo
- [x] Atualizei documentacao relevante
- [x] Nao deixei TODO/HACK sem justificativa
- [x] Nao inclui dados sensiveis
- [x] Nao introduzi warnings novos relevantes

## Multi-tenant e Seguranca (Obrigatorio quando aplicavel)

- [ ] Nenhuma mudanca multi-tenant
- [x] Validado isolamento por `empresa_id` no backend
- [x] Guardas/decorators de empresa validados (`EmpresaGuard`, `@EmpresaId`)
- [x] Sem dependencia de filtro manual no frontend para isolamento
- [x] Caches/fallbacks/upload local nao vazam dados entre tenants

## Banco de Dados (Obrigatorio quando aplicavel)

- [ ] Sem mudanca de banco
- [x] Migration criada
- [x] Migration testada localmente
- [x] Rollback validado
- [x] Indices relevantes revisados
- [x] RLS/policy `tenant_isolation_*` revisada (se tabela multi-tenant)

## Testes

Descreva como validar:

1. Aplicar migrations (`npm --prefix backend run migration:run`).
2. Validar rollback/reapply (`migration:revert` em cadeia e novo `migration:run`).
3. Executar suites E2E de isolamento e vendas.
4. Executar build/type-check para garantir regressao zero no backend.

### Evidencias de teste

- [ ] Unitarios
- [ ] Integracao
- [x] E2E
- [x] Manual

Comandos executados:

```bash
npm --prefix backend run migration:show
npm --prefix backend run migration:run
# rollback validado em cadeia (8 reversoes)
npm --prefix backend run migration:revert
npm --prefix backend run validate:rls
npm --prefix backend run test:e2e -- test/permissoes/perfis-acesso.e2e-spec.ts
npm --prefix backend run test:e2e:vendas
npm --prefix backend run test:e2e:vendas:permissoes
npm --prefix backend run test:e2e -- test/multi-tenancy.e2e-spec.ts
npm --prefix backend run type-check
npm --prefix backend run build
```

## Deploy

- [x] Pode fazer deploy imediato
- [ ] Requer configuracao adicional
- [ ] Requer variaveis de ambiente novas
- [x] Requer migration manual
- [ ] Requer restart de servicos

## Evidencias Visuais (se frontend)

N/A

## Notas para Revisao

Arquivos-chave alterados:

- `backend/src/common/tenant/tenant-query-runner.patcher.ts`
- `backend/src/modules/propostas/propostas.service.ts`
- `backend/src/modules/contratos/services/contratos.service.ts`
- `backend/src/modules/contratos/services/assinatura-digital.service.ts`
- `backend/src/modules/faturamento/services/faturamento.service.ts`
- `backend/src/modules/dashboard/dashboard.service.ts`
- `backend/src/migrations/1802871000000-EnsureSalesContractsBillingTables.ts`
- `backend/src/migrations/1802872000000-EnableRlsSalesPaymentGatewayTables.ts`
- `backend/src/migrations/1802873000000-AlignLegacySchemaForPermissionsSuite.ts`
- `backend/src/migrations/1802874000000-AlignPropostasDateColumnsForDashboard.ts`
- `backend/src/migrations/1802875000000-AddVendedorIdToPropostasForDashboardScope.ts`
- `backend/src/migrations/1802876000000-EnableRlsRemainingTenantTables.ts`
- `backend/test/permissoes/perfis-acesso-vendas.e2e-spec.ts`

Pontos de atencao:

- Correcao aplicada na migration `1802873000000-AlignLegacySchemaForPermissionsSuite.ts` para tratar schema de `evento` sem coluna legada `empresaId`.
- Rollback validado localmente com ciclo completo `migration:run -> migration:revert (x8) -> migration:run`.
- A validacao de relacoes com `proposta` em contratos/faturamento/assinatura foi tornada adaptativa para ambientes legados.
- RLS foi expandido para tabelas que historicamente podiam escapar do isolamento em ambientes antigos.
