# Matriz de Permissoes Atualizada (2026-03-03)

## 1. Objetivo

Consolidar a matriz de permissoes apos a evolucao recente de telas e ferramentas, com foco em:

1. Fluxos financeiros novos (contas a pagar, contas bancarias, conciliacao, alertas).
2. Ajustes de gating em cotacoes/compras internas.
3. Consistencia entre frontend (menu/rotas) e backend (PermissionsGuard).

## 2. Fontes canonicas usadas na revisao

1. `backend/src/common/permissions/permissions.constants.ts`
2. `frontend-web/src/config/menuConfig.ts`
3. Controllers com `@Permissions(...)` nos modulos financeiro, faturamento e pagamentos.
4. Suites de matriz E2E em `backend/test/permissoes/`.

## 3. Ajustes aplicados nesta revisao

1. `Financeiro > Contas a Pagar` agora exige `financeiro.pagamentos.read` (antes estava em `financeiro.faturamento.read`).
2. `Financeiro > Fornecedores` agora exige `financeiro.pagamentos.read` (antes estava em `financeiro.faturamento.read`).
3. Matriz de testes do frontend foi atualizada para refletir a regra atual de cotacoes:
   - acesso por `comercial.propostas.read` ou `financeiro.pagamentos.manage`;
   - sem dependencia obrigatoria de permissoes CRM extras.
4. Matrizes E2E de backend foram ampliadas para cobrir recursos novos:
   - `contas-pagar`
   - `contas-bancarias`
   - `conciliacao-bancaria`
   - `financeiro/alertas-operacionais`
5. Console administrativo legado foi descontinuado no frontend:
   - rotas removidas: `/admin/console`, `/admin/relatorios`, `/admin/auditoria`, `/admin/monitoramento`, `/admin/analytics`, `/admin/conformidade`, `/admin/acesso`;
   - navegação administrativa mantida apenas em rotas ativas de operação/governança.

6. Tela legada de permissoes foi descontinuada:
   - `/gestao/permissoes` e `/empresas/:empresaId/permissoes` agora redirecionam para `/configuracoes/usuarios`;
   - o modal de criacao de usuario utiliza catalogo canonico vindo de `/users/permissoes/catalogo`.
7. Aplicado `ADM-101` (menor privilegio por perfil):
   - `admin` deixou de receber, por default, permissoes operacionais de CRM/Comercial/Atendimento/Financeiro;
   - `admin` permanece com escopo de governanca (`usuarios`, `configuracoes`, `planos`, `admin.empresas`, `insights`);
   - matriz E2E foi atualizada para garantir bloqueio operacional do role `admin` sem permissoes explicitas.
8. Catalogo e combos foram separados por permissao canonica:
   - `crm.produtos.*` permanece para itens avulsos do catalogo;
   - `crm.combos.*` passou a governar leitura/escrita de combos.
9. Menu e rotas de combos passaram a usar permissao dedicada:
   - `comercial-combos` exige `crm.combos.read`;
   - `/combos/novo` e `/vendas/combos/novo` exigem `crm.combos.create` + `crm.combos.read`;
   - `/combos/:id/editar` e `/vendas/combos/:id/editar` exigem `crm.combos.update` + `crm.combos.read`.
10. Fallback do modal de usuarios foi alinhado ao catalogo canonico:
   - inclui opcoes `crm.combos.read/create/update/delete`;
   - default de `vendedor` mantem acesso de leitura a combos (`crm.combos.read`) para preservar operacao comercial.

## 4. Matriz por perfil (defaults)

| Perfil | Escopo principal (resumo) |
| --- | --- |
| `superadmin` | Todas as permissoes canonicas |
| `admin` | Governanca: Usuarios, Configuracoes, Planos, Admin Empresas, Perfil proprio e Insights |
| `gerente` | Usuarios, CRM, Comercial, Atendimento (sem DLQ), Config Empresa read e Automacoes |
| `vendedor` | Perfil proprio, Insights, CRM operacional de vendas e Comercial (sem delete) |
| `suporte` | Perfil proprio, Insights, CRM basico e Atendimento operacional |
| `financeiro` | Perfil proprio, Insights, Financeiro (faturamento/pagamentos read+manage), `comercial.propostas.read`, `crm.clientes.read` |

## 5. Matriz de telas e rotas criticas

| Rota/Tela | Permissao efetiva |
| --- | --- |
| `/vendas/cotacoes` | `comercial.propostas.read` **ou** `financeiro.pagamentos.manage` |
| `/financeiro/contas-pagar` | `financeiro.pagamentos.read` |
| `/financeiro/fornecedores` | `financeiro.pagamentos.read` |
| `/financeiro/fornecedores/:fornecedorId` | `financeiro.pagamentos.read` (herdado da rota base) |
| `/financeiro/contas-bancarias` | `financeiro.pagamentos.read` |
| `/financeiro/aprovacoes` | `financeiro.pagamentos.manage` |
| `/financeiro/conciliacao` | `financeiro.pagamentos.read` |
| `/financeiro/relatorios` | `financeiro.faturamento.read` **e** `relatorios.read` |
| `/vendas/combos` | `crm.combos.read` |
| `/combos/novo` | `crm.combos.create` **e** `crm.combos.read` |
| `/combos/:id/editar` | `crm.combos.update` **e** `crm.combos.read` |
| `/admin/empresas` | `admin.empresas.manage` + guard de superadmin na navegacao |
| `/admin/sistema` | `admin.empresas.manage` + guard de superadmin na navegacao |

## 6. Matriz de APIs novas de Financeiro

| Recurso/API | Read | Manage |
| --- | --- | --- |
| `contas-pagar` | `financeiro.pagamentos.read` | `financeiro.pagamentos.manage` |
| `contas-bancarias` | `financeiro.pagamentos.read` | `financeiro.pagamentos.manage` |
| `fornecedores` | `financeiro.pagamentos.read` | `financeiro.pagamentos.manage` |
| `conciliacao-bancaria` | `financeiro.pagamentos.read` | `financeiro.pagamentos.manage` |
| `financeiro/alertas-operacionais` | `financeiro.pagamentos.read` | `financeiro.pagamentos.manage` |
| `pagamentos/gateways/*` | `financeiro.pagamentos.read` | `financeiro.pagamentos.manage` |
| `faturamento/*` | `financeiro.faturamento.read` | `financeiro.faturamento.manage` |

## 7. Evidencia tecnica desta revisao

1. Frontend:
   - `frontend-web/src/config/menuConfig.ts`
   - `frontend-web/src/config/__tests__/menuConfig.permissions.test.ts`
2. Backend:
   - `backend/test/permissoes/perfis-acesso.e2e-spec.ts`
   - `backend/test/permissoes/perfis-acesso-vendas.e2e-spec.ts`
