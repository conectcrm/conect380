# UAT Checklist - Frontend Permission Hardening (2026-02-20)

## Objetivo
Validar que o frontend respeita permissao por menu, submenu e acesso direto por URL apos o hardening de rotas.

## Ambiente
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- Branch: `chore/mvp-effective-change-gate-20260218`

## Perfis de teste recomendados
- `admin`
- `gerente`
- `vendedor`
- `suporte`
- `financeiro`
- usuario restrito customizado (permissoes explicitas)

## Criterio de aprovacao
- Todos os itens obrigatorios como `PASS`.
- Qualquer `FAIL` em bloqueio de rota sensivel impede aprovacao.

## 1) Sidebar e submenu por permissao
- [ ] Usuario restrito nao visualiza menu nao permitido.
- [ ] Usuario restrito nao visualiza submenu nao permitido em `Atendimento`.
- [ ] Usuario restrito nao visualiza submenu nao permitido em `Comercial`.
- [ ] `admin` visualiza menus administrativos esperados.

## 2) Bloqueio de acesso direto por URL (obrigatorio)
- [ ] Sem `users.read`: `/nuclei/configuracoes/usuarios` -> `Acesso negado`.
- [ ] Sem `admin.empresas.manage`: `/admin/monitoramento` -> `Acesso negado`.
- [ ] Sem `config.automacoes.manage`: `/gestao/fluxos/novo/builder` -> `Acesso negado`.
- [ ] Sem permissao combinada: `/vendas/cotacoes` -> `Acesso negado`.

## 3) Rotas com permissao combinada (`match: all`)
- [ ] `/atendimento/tickets/novo` exige:
  - `atendimento.tickets.create`
  - `crm.clientes.read`
- [ ] `/vendas/cotacoes` exige:
  - `comercial.propostas.read`
  - `comercial.propostas.create`
  - `crm.clientes.read`
  - `crm.produtos.read`
- [ ] `/combos/novo` exige:
  - `crm.produtos.create`
  - `crm.produtos.read`
- [ ] `/financeiro/relatorios` exige:
  - `financeiro.faturamento.read`
  - `relatorios.read`

## 4) Cenarios positivos (acesso permitido)
- [ ] Usuario com permissao adequada acessa `/atendimento/inbox`.
- [ ] Usuario com permissao adequada acessa `/vendas/propostas`.
- [ ] Usuario com todas permissoes combinadas acessa `/vendas/cotacoes`.
- [ ] Usuario com todas permissoes combinadas acessa `/atendimento/tickets/novo`.

## 5) Regressao visual/comportamental
- [ ] Tela de bloqueio exibe mensagem clara e opcao `Voltar ao dashboard`.
- [ ] Dashboard de suporte sem `relatorios.read` mostra aviso de visao analitica restrita.
- [ ] Navegacao autenticada continua funcional em rotas permitidas.

## 6) Evidencia minima para aprovacao
- [ ] Screenshot da sidebar por perfil testado.
- [ ] Screenshot de ao menos 3 bloqueios de URL.
- [ ] Screenshot de ao menos 2 acessos permitidos.
- [ ] Resultado dos comandos:
  - `npm --prefix frontend-web run type-check`
  - `npm --prefix frontend-web test -- --watch=false --runInBand --runTestsByPath src/config/__tests__/menuConfig.permissions.test.ts`
  - `npm --prefix frontend-web run build`

## Resultado final
- Responsavel UAT:
- Data:
- Status: `PASS` | `FAIL`
- Observacoes:
