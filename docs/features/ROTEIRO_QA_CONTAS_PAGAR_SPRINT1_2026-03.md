# Roteiro Oficial de QA - Contas a Pagar Sprint 1 (2026-03)

## 1. Objetivo

Validar ponta a ponta o fluxo de contas a pagar com dados reais de conta bancaria e regras de permissao por perfil.

## 2. Escopo de validacao

1. Cadastro de conta a pagar sem conta bancaria.
2. Cadastro de conta a pagar com conta bancaria ativa.
3. Registro de pagamento com conta bancaria valida.
4. Bloqueio de pagamento com conta bancaria invalida/inativa.
5. Filtros de listagem (periodo, status, fornecedor, termo).
6. Permissoes por perfil (administrador, gerente, financeiro, operacional/comercial).

## 3. Ambiente e pre-condicoes

1. Ambiente: homologacao ou dev integrado com frontend + backend atualizados.
2. Base minima:
   - 2 fornecedores ativos.
   - 2 contas bancarias ativas da empresa.
   - 1 conta bancaria inativa da empresa.
   - 1 conta bancaria de outra empresa (para teste de isolamento).
3. Usuarios de teste:
   - `qa.admin` (administrador)
   - `qa.gerente` (gerente)
   - `qa.financeiro` (financeiro)
   - `qa.operacional` (operacional/comercial)
4. Rotas alvo:
   - `/financeiro/contas-pagar`
   - `/financeiro/contas-bancarias`
   - `/financeiro/aprovacoes`

## 4. Matriz de cenarios obrigatorios

| ID | Cenario | Perfil | Passos resumidos | Resultado esperado |
| --- | --- | --- | --- | --- |
| CP-001 | Criar conta sem conta bancaria | financeiro | Abrir modal `Nova conta`, preencher campos obrigatorios, salvar sem selecionar conta bancaria | Conta criada com sucesso, status inicial coerente e sem erro de validacao de conta bancaria |
| CP-002 | Criar conta com conta bancaria ativa | financeiro | Criar conta informando `contaBancariaId` ativo | Conta criada com sucesso e vinculada a conta bancaria selecionada |
| CP-003 | Registrar pagamento valido | financeiro | Abrir conta em aberto, registrar pagamento com conta bancaria ativa da mesma empresa | Pagamento concluido, status e valores atualizados, sem erro de permissao |
| CP-004 | Bloquear pagamento com conta inativa | financeiro | Forcar envio com `contaBancariaId` inativo | API retorna `400`, frontend exibe erro amigavel e nao baixa a conta |
| CP-005 | Bloquear pagamento com conta de outra empresa | financeiro | Forcar envio com `contaBancariaId` de outra empresa | API retorna `400`, sem alteracao na conta |
| CP-006 | Filtro por periodo e status | financeiro | Aplicar filtros na listagem | Grid reflete exatamente os filtros, sem regressao de paginacao |
| CP-007 | Filtro por fornecedor e termo | financeiro | Buscar por fornecedor e termo de descricao/numero | Resultado consistente com dados cadastrados |
| CP-008 | Permissao administrador | administrador | Acessar contas a pagar e executar operacoes principais | Acesso completo conforme regras de negocio |
| CP-009 | Permissao gerente | gerente | Acessar contas a pagar e validar operacoes permitidas | Acesso conforme perfil, sem escalacao indevida |
| CP-010 | Permissao financeiro | financeiro | Executar fluxo completo de cadastro + pagamento | Fluxo operacional completo para perfil financeiro |
| CP-011 | Restricao operacional/comercial | operacional/comercial | Tentar executar acoes financeiras restritas | Acoes bloqueadas com mensagem de permissao |

## 5. Casos de API para confirmar no QA

1. `POST /contas-pagar` sem `contaBancariaId` deve continuar funcional.
2. `POST /contas-pagar` com `contaBancariaId` invalido deve retornar `400`.
3. `POST /contas-pagar/:id/registrar-pagamento` com conta valida deve concluir.
4. `POST /contas-pagar/:id/registrar-pagamento` com conta invalida/inativa deve retornar `400`.

## 6. Evidencias obrigatorias por execucao

1. Captura de tela dos cenarios CP-001, CP-003, CP-004 e CP-011.
2. Registro de request/response (DevTools ou log backend) para falhas `400`.
3. Relatorio final com:
   - total de cenarios executados;
   - total aprovados/reprovados;
   - lista de bugs com severidade.

## 7. Template de relatorio de execucao

| ID cenario | Status (PASS/FAIL) | Evidencia | Observacao |
| --- | --- | --- | --- |
| CP-001 |  |  |  |
| CP-002 |  |  |  |
| CP-003 |  |  |  |
| CP-004 |  |  |  |
| CP-005 |  |  |  |
| CP-006 |  |  |  |
| CP-007 |  |  |  |
| CP-008 |  |  |  |
| CP-009 |  |  |  |
| CP-010 |  |  |  |
| CP-011 |  |  |  |

## 8. Criterio de saida (go/no-go)

1. Todos os cenarios criticos (CP-001, CP-003, CP-004, CP-011) em PASS.
2. Nenhum bug aberto de severidade critica/alta no fluxo de pagamento.
3. Validacao de permissao por perfil concluida sem bypass.
