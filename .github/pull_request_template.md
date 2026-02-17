## Descricao

Descreva objetivamente o que mudou e por que.

## Tipo de Mudanca

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Refatoracao
- [ ] Documentacao
- [ ] Performance
- [ ] Testes

## Modulos Afetados

- [ ] Backend
- [ ] Frontend
- [ ] Banco de Dados
- [ ] Integracoes
- [ ] Infra/DevOps
- [ ] Documentacao

## Issue Relacionada

Closes #<numero-da-issue>

## Escopo de UX (Frontend) - Obrigatorio se houver tela

### Classificacao da tela

- [ ] Tipo A - Gestao em Lista (CRUD)
- [ ] Tipo B - Operacao em Tempo Real
- [ ] Tipo C - Analytics/Dashboard
- [ ] Tipo D - Configuracao/Administracao
- [ ] Tipo E - Fluxo Guiado (Wizard)
- [ ] Nao se aplica (sem tela)

### Decisao de layout

- [ ] Usei template padrao (`StandardPageTemplate`/`StandardDataTable`)
- [ ] Usei layout especifico por necessidade de fluxo
- [ ] Nao se aplica

Se escolheu layout especifico, explique o motivo:

<!-- Exemplo: fluxo em tempo real, alta densidade operacional, template padrao piora execucao -->

### Checklist UX minimo (Obrigatorio se houver tela)

- [ ] Loading inicial implementado
- [ ] Loading de acao pontual implementado
- [ ] Empty state com CTA implementado
- [ ] Error state com recuperacao implementado
- [ ] Feedback de sucesso/erro implementado
- [ ] Responsividade desktop/mobile validada
- [ ] Acessibilidade basica (teclado, foco visivel, labels) validada

## Checklist Tecnico (Obrigatorio)

- [ ] Fiz self-review do codigo
- [ ] Atualizei documentacao relevante
- [ ] Nao deixei TODO/HACK sem justificativa
- [ ] Nao inclui dados sensiveis
- [ ] Nao introduzi warnings novos relevantes

## Multi-tenant e Seguranca (Obrigatorio quando aplicavel)

- [ ] Nenhuma mudanca multi-tenant
- [ ] Validado isolamento por `empresa_id` no backend
- [ ] Guardas/decorators de empresa validados (`EmpresaGuard`, `@EmpresaId`)
- [ ] Sem dependencia de filtro manual no frontend para isolamento
- [ ] Caches/fallbacks/upload local nao vazam dados entre tenants

## Banco de Dados (Obrigatorio quando aplicavel)

- [ ] Sem mudanca de banco
- [ ] Migration criada
- [ ] Migration testada localmente
- [ ] Rollback validado
- [ ] Indices relevantes revisados
- [ ] RLS/policy `tenant_isolation_*` revisada (se tabela multi-tenant)

## Testes

Descreva como validar:

1.
2.
3.

### Evidencias de teste

- [ ] Unitarios
- [ ] Integracao
- [ ] E2E
- [ ] Manual

Comandos executados:

```bash
# exemplo
npm run test
```

## Deploy

- [ ] Pode fazer deploy imediato
- [ ] Requer configuracao adicional
- [ ] Requer variaveis de ambiente novas
- [ ] Requer migration manual
- [ ] Requer restart de servicos

## Evidencias Visuais (se frontend)

Inclua screenshots/gif quando houver alteracao de interface.

## Notas para Revisao

Liste riscos, pontos de atencao e decisoes tecnicas relevantes.
