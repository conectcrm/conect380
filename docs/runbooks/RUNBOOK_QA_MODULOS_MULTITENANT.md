# Runbook QA - Modulos Multi-tenant

## Objetivo
Validar que o controle de acesso por modulo esta consistente entre frontend e backend e que modulos essenciais permanecem ativos.

## Escopo validado nesta entrega
- Matriz de modulo por rota alinhada para:
  - `CRM`: clientes, contatos, leads, agenda.
  - `VENDAS`: propostas, contratos, produtos, veiculos.
  - `FINANCEIRO`: faturamento financeiro e rotas financeiras.
  - `BILLING`: assinatura/plano/upgrade.
- Modulos essenciais (`CRM`, `ATENDIMENTO`) obrigatorios em plano e sempre ativos para empresa.
- Troca de plano via assinatura sincronizando `empresa_modulos`.

## Preparacao
1. Tenha 3 empresas de teste:
   - Empresa A: plano `starter`.
   - Empresa B: plano `business`.
   - Empresa C: plano `enterprise`.
2. Tenha ao menos 1 usuario `admin` em cada empresa.
3. Limpe cache do navegador antes de cada rodada.

## Casos de teste principais

### 1) Essenciais sempre ativos
1. Logar na Empresa A (`starter`).
2. Acessar `GET /empresas/modulos/ativos` via frontend.
3. Confirmar que `CRM` e `ATENDIMENTO` estao presentes.
4. Tentar desativar `CRM` em configuracao de modulos.
5. Resultado esperado: bloqueio com erro de modulo essencial.

### 2) Produtos e veiculos em VENDAS
1. Logar em empresa sem `VENDAS` ativa.
2. Abrir `/produtos` e `/veiculos`.
3. Resultado esperado: bloqueio/licenciamento.
4. Ativar plano com `VENDAS`.
5. Reabrir `/produtos` e `/veiculos`.
6. Resultado esperado: acesso liberado.

### 3) Faturamento em FINANCEIRO (nao BILLING)
1. Logar em empresa com `FINANCEIRO` ativo e `BILLING` inativo.
2. Abrir `/financeiro/faturamento` e `/faturamento`.
3. Resultado esperado: acesso liberado.
4. Abrir `/billing/assinaturas`.
5. Resultado esperado: bloqueio por modulo `BILLING`.

### 4) Troca de plano sincroniza modulos imediatamente
1. Em empresa `starter`, abrir `/empresas/modulos/ativos`.
2. Trocar plano para `business` por fluxo de assinatura.
3. Atualizar pagina e consultar novamente `/empresas/modulos/ativos`.
4. Resultado esperado: `VENDAS` e `FINANCEIRO` ativos sem ajuste manual.

### 5) Rotas base de configuracao nao dependem de ADMINISTRACAO
1. Logar em empresa sem `ADMINISTRACAO`.
2. Acessar funcionalidades base de usuario/config da propria empresa.
3. Resultado esperado: acesso controlado por permissao/role, nao por bloqueio de modulo.

## Checklist rapido de aprovacao
- [ ] Empresa `starter` nao acessa `VENDAS`/`FINANCEIRO`.
- [ ] Empresa `business` acessa `VENDAS` e `FINANCEIRO`.
- [ ] Empresa sem `BILLING` nao acessa `/billing/*`.
- [ ] `CRM` e `ATENDIMENTO` sempre aparecem como ativos.
- [ ] Troca de plano reflete em `modulos/ativos` no mesmo fluxo.

## Troubleshooting
- Se houver divergencia UI/API, comparar:
  - `frontend-web/src/config/menuConfig.ts`
  - `backend/src/modules/common/assinatura.middleware.ts`
- Se modulo nao atualizar apos troca de plano, inspecionar:
  - `AssinaturasService.alterarPlano`
  - `EmpresaModuloService.sincronizarModulosPlano`
