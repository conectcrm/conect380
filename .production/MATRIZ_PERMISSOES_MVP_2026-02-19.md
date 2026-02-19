# Matriz de Permissao MVP (2026-02-19)

## Escopo
- Fonte: codigo atual da branch `chore/mvp-effective-change-gate-20260218`.
- Foco: autenticacao, usuarios, dashboard, assinaturas, configuracao de empresa, planos, admin empresas e DLQ.
- Perfis considerados: `superadmin`, `admin`, `gerente`, `vendedor`, `suporte`, `financeiro`.

## Legenda
- `OK`: permitido no endpoint.
- `OK*`: permitido com restricao adicional de escopo/alvo.
- `NO`: bloqueado por role/guard.
- `AUTH`: endpoint publico (nao depende de role autenticada).

## Regras Globais de Controle de Acesso
| Regra | Efeito pratico |
|---|---|
| `JwtAuthGuard` | Exige JWT valido nos controllers protegidos. |
| `EmpresaGuard` | Exige `user.empresa_id` para rotas multi-tenant. Sem isso, retorna 400. |
| `RolesGuard` | Aplica `@Roles(...)` com match exato de role (sem hierarquia implicita). |
| `AssinaturaMiddleware` | Exige assinatura ativa e modulo incluido no plano para rotas monitoradas. |
| `AssinaturaMiddleware` rota `/users` | Mapeada para modulo `usuarios` (hardening aplicado). |

## Matriz por Endpoint (Codigo Atual)
| Endpoint | Superadmin | Admin | Gerente | Vendedor | Suporte | Financeiro | Observacoes |
|---|---:|---:|---:|---:|---:|---:|---|
| `POST /auth/login` | AUTH | AUTH | AUTH | AUTH | AUTH | AUTH | Login local com throttle. |
| `POST /auth/register` | OK | OK | OK | NO | NO | NO | `empresa_id` do payload e ignorado; empresa vem do token. |
| `POST /auth/refresh` | OK | OK | OK | OK | OK | OK | Requer JWT valido. |
| `POST /auth/trocar-senha` | AUTH | AUTH | AUTH | AUTH | AUTH | AUTH | Endpoint publico, validacao feita por credenciais da troca. |
| `POST /auth/forgot-password` | AUTH | AUTH | AUTH | AUTH | AUTH | AUTH | Endpoint publico com throttle. |
| `POST /auth/reset-password` | AUTH | AUTH | AUTH | AUTH | AUTH | AUTH | Endpoint publico por token de recuperacao. |
| `GET /users/profile` | OK | OK | OK | OK | OK | OK | Requer JWT + empresa. |
| `PUT /users/profile` | OK* | OK* | OK* | OK* | OK* | OK* | So aceita campos de perfil; bloqueia role/empresa/permissoes/senha. |
| `POST /users/profile/avatar` | OK | OK | OK | OK | OK | OK | Requer JWT + empresa. |
| `GET /users/team` | OK | OK | OK | OK | OK | OK | Requer JWT + empresa. |
| `GET /users` | OK | OK | OK | NO | NO | NO | Lista com filtros. |
| `GET /users/estatisticas` | OK | OK | OK | NO | NO | NO | Estatisticas de usuarios da empresa. |
| `GET /users/atendentes` | OK | OK | OK | NO | NO | NO | Lista atendentes da empresa. |
| `POST /users` | OK* | OK* | OK* | NO | NO | NO | Permite criar apenas roles que o ator pode atribuir. |
| `PUT /users/:id` | OK* | OK* | OK* | NO | NO | NO | Exige permissao sobre role-alvo e valida campos permitidos. |
| `PUT /users/:id/reset-senha` | OK* | OK* | OK* | NO | NO | NO | Exige permissao sobre usuario-alvo. |
| `PATCH /users/:id/status` | OK* | OK* | OK* | NO | NO | NO | Exige permissao sobre usuario-alvo. |
| `PUT /users/bulk/ativar` | OK* | OK* | OK* | NO | NO | NO | Valida lista de IDs e permissao por alvo. |
| `PUT /users/bulk/desativar` | OK* | OK* | OK* | NO | NO | NO | Valida lista de IDs e permissao por alvo. |
| `GET /dashboard/kpis` | OK | OK | OK | OK* | OK* | OK* | `vendedor` e forcado para o proprio user em perfis nao privilegiados. |
| `GET /dashboard/vendedores-ranking` | OK | OK | OK | OK* | OK* | OK* | Perfis nao privilegiados veem somente o proprio no ranking. |
| `GET /dashboard/alertas` | OK | OK | OK | OK* | OK* | OK* | Perfis nao privilegiados recebem alertas do proprio escopo. |
| `GET /dashboard/resumo` | OK | OK | OK | OK* | OK* | OK* | Mesma regra de escopo do `kpis`. |
| `GET /assinaturas` | OK | OK | OK | OK | OK | OK | Requer JWT + empresa. |
| `GET /assinaturas/empresa/:empresaId` | OK | OK | OK | OK | OK | OK | `empresaId` de rota e ignorado; usa empresa do token. |
| `GET /assinaturas/empresa/:empresaId/limites` | OK | OK | OK | OK | OK | OK | `empresaId` de rota e ignorado; usa empresa do token. |
| `POST /assinaturas` | OK | OK | NO | NO | NO | NO | Mutacao de assinatura restrita. |
| `POST /assinaturas/checkout` | OK | OK | NO | NO | NO | NO | Mutacao de assinatura restrita. |
| `PATCH /assinaturas/empresa/:empresaId/plano` | OK | OK | NO | NO | NO | NO | Mutacao restrita. |
| `PATCH /assinaturas/empresa/:empresaId/cancelar` | OK | OK | NO | NO | NO | NO | Mutacao restrita. |
| `PATCH /assinaturas/empresa/:empresaId/suspender` | OK | OK | NO | NO | NO | NO | Mutacao restrita. |
| `PATCH /assinaturas/empresa/:empresaId/reativar` | OK | OK | NO | NO | NO | NO | Mutacao restrita. |
| `PATCH /assinaturas/empresa/:empresaId/contadores` | OK | OK | NO | NO | NO | NO | Mutacao restrita. |
| `POST /assinaturas/empresa/:empresaId/api-call` | OK | OK | NO | NO | NO | NO | Mutacao restrita. |
| `GET /empresas/config` | OK | OK | OK | OK | OK | OK | Requer JWT + empresa. |
| `PUT /empresas/config` | OK | OK | NO | NO | NO | NO | Altera configuracao da empresa. |
| `POST /empresas/config/reset` | OK | OK | NO | NO | NO | NO | Restaura padrao de configuracao. |
| `GET /planos` | OK | OK | OK | OK | OK | OK | Somente JWT; sem `@Roles` para leitura. |
| `GET /planos/modulos` | OK | OK | OK | OK | OK | OK | Somente JWT; sem `@Roles` para leitura. |
| `GET /planos/:id` | OK | OK | OK | OK | OK | OK | Somente JWT; sem `@Roles` para leitura. |
| `GET /planos/codigo/:codigo` | OK | OK | OK | OK | OK | OK | Somente JWT; sem `@Roles` para leitura. |
| `POST /planos` | OK | OK | NO | NO | NO | NO | Criacao de plano (superadmin/admin). |
| `PUT /planos/:id` | OK | OK | NO | NO | NO | NO | Edicao de plano (superadmin/admin). |
| `DELETE /planos/:id` | OK | OK | NO | NO | NO | NO | Remocao de plano (superadmin/admin). |
| `PUT /planos/:id/desativar` | OK | OK | NO | NO | NO | NO | Superadmin/admin only. |
| `PUT /planos/:id/ativar` | OK | OK | NO | NO | NO | NO | Superadmin/admin only. |
| `PUT /planos/:id/toggle-status` | OK | OK | NO | NO | NO | NO | Superadmin/admin only. |
| `ALL /admin/empresas/**` | OK | OK | NO | NO | NO | NO | Controller inteiro com `@Roles(superadmin, admin)`. |
| `POST /api/atendimento/filas/dlq/status` | OK | OK | NO | NO | NO | NO | DLQ superadmin/admin only. |
| `POST /api/atendimento/filas/dlq/reprocessar` | OK | OK | NO | NO | NO | NO | DLQ superadmin/admin only. |

## Matriz de Gestao de Usuarios (Regra Fina)
| Ator | Pode criar/atribuir roles | Pode gerenciar alvos | Pode gerenciar a si no endpoint admin (`/users/:id*`) |
|---|---|---|---|
| `superadmin` | `superadmin`, `admin`, `gerente`, `vendedor`, `suporte`, `financeiro` | mesmos roles | Sim |
| `admin` | `gerente`, `vendedor`, `suporte`, `financeiro` | mesmos roles | Nao |
| `gerente` | `vendedor`, `suporte` | mesmos roles | Nao |
| `vendedor` | nenhum | nenhum | Nao |
| `suporte` | nenhum | nenhum | Nao |
| `financeiro` | nenhum | nenhum | Nao |

## Regras de Payload (Usuarios)
| Endpoint | Campos permitidos |
|---|---|
| `PUT /users/profile` | `nome`, `telefone`, `avatar_url`, `idioma_preferido`, `configuracoes` |
| `PUT /users/profile` (bloqueados) | `role`, `empresa_id`, `ativo`, `senha`, `permissoes`, `deve_trocar_senha` |
| `POST /users` | `nome`, `email`, `senha`, `telefone`, `role`, `permissoes`, `avatar_url`, `idioma_preferido`, `configuracoes`, `status_atendente`, `capacidade_maxima` |
| `PUT /users/:id` | `nome`, `email`, `telefone`, `role`, `permissoes`, `avatar_url`, `idioma_preferido`, `configuracoes`, `status_atendente`, `capacidade_maxima` |

## Observacoes Importantes para PR
1. `RolesGuard` faz comparacao exata de role. Sempre explicitar `superadmin` quando a rota for de governanca ampla.
2. O hardening recente remove exposicao de `senha` em respostas de usuarios e bloqueia escalacao de privilegio via payload.
3. O escopo de dashboard para perfis nao privilegiados e reduzido ao proprio `user.id`.
