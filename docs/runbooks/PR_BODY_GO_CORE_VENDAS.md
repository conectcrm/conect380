## Descricao

Padroniza o fechamento do Fluxo de Vendas em modo GO Core com guardrails de release, preflight de go-live e gates obrigatorios no CI.

Mudancas principais:

- Guardrail de flags GO Core/GO Full para frontend/backend.
- Script de preflight unico para validacao de release GO Core.
- Job CI para validar baseline de release flags.
- Job CI obrigatorio para E2E de vendas.
- Reforco de E2E multi-tenant com verificacao explicita de RLS/policies no core do pipeline.
- Documentacao de rollout e comandos de validacao.

## Tipo de Mudanca

- [ ] Bug fix
- [x] Nova feature
- [ ] Breaking change
- [ ] Refatoracao
- [x] Documentacao
- [ ] Performance
- [x] Testes

## Modulos Afetados

- [x] Backend
- [ ] Frontend
- [ ] Banco de Dados
- [ ] Integracoes
- [x] Infra/DevOps
- [x] Documentacao

## Issue Relacionada

N/A (consolidacao operacional de release GO Core)

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

- [x] Sem mudanca de banco
- [ ] Migration criada
- [ ] Migration testada localmente
- [ ] Rollback validado
- [ ] Indices relevantes revisados
- [ ] RLS/policy `tenant_isolation_*` revisada (se tabela multi-tenant)

## Testes

Descreva como validar:

1. Executar preflight completo GO Core.
2. Confirmar PASS de guardrails + build + E2E backend + E2E UI.
3. Validar CI com jobs `release-flags-guardrails` e `backend-e2e-vendas`.

### Evidencias de teste

- [ ] Unitarios
- [ ] Integracao
- [x] E2E
- [x] Manual

Comandos executados:

```bash
npm run validate:release:vendas:core
npm --prefix backend run build
npm --prefix backend run test:e2e -- test/multi-tenancy.e2e-spec.ts
npm --prefix backend run test:e2e:vendas
npm run test:e2e:pipeline-ui
npm run preflight:go-live:vendas:core
```

## Deploy

- [x] Pode fazer deploy imediato
- [ ] Requer configuracao adicional
- [ ] Requer variaveis de ambiente novas
- [ ] Requer migration manual
- [ ] Requer restart de servicos

## Evidencias Visuais (se frontend)

N/A

## Notas para Revisao

Pontos de atencao:

- Baseline validado para GO Core (MVP mode ativo, gateways bloqueados por default deny).
- GO Full permanece opcional e depende de configuracao real de providers em arquivos de ambiente de deploy.
- E2E de vendas agora esta em gate obrigatorio de CI para reduzir risco de regressao no fluxo comercial.
