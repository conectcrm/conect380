# Catalogo de Permissoes (2026-02-19)

## Objetivo
- Centralizar permissoes granulares em um ponto unico.
- Manter compatibilidade com RBAC atual por `role`.
- Permitir evolucao para controles mais finos sem quebrar endpoints existentes.

## Implementacao no codigo
- Constantes e matriz base:
  - `backend/src/common/permissions/permissions.constants.ts`
- Resolucao/normalizacao de permissoes do usuario:
  - `backend/src/common/permissions/permissions.utils.ts`
- Decorator:
  - `backend/src/common/decorators/permissions.decorator.ts`
- Guard:
  - `backend/src/common/guards/permissions.guard.ts`

## Permissoes canonicas
- `users.profile.update`
- `users.read`
- `users.create`
- `users.update`
- `users.reset-password`
- `users.status.update`
- `users.bulk.update`
- `planos.manage`
- `admin.empresas.manage`
- `atendimento.dlq.manage`

## Mapeamento padrao por perfil
- `superadmin`: todas as permissoes
- `admin`:
  - todas de usuarios
  - `planos.manage`
  - `admin.empresas.manage`
  - `atendimento.dlq.manage`
- `gerente`:
  - todas de usuarios
- `vendedor`:
  - `users.profile.update`
- `suporte`:
  - `users.profile.update`
- `financeiro`:
  - `users.profile.update`

## Compatibilidade legado
- Alias legados (`USERS_CREATE`, `USERS_READ`, etc.) continuam aceitos e convertidos para formato canonico.
- Estrategia atual e aditiva: permissao efetiva do usuario = permissoes padrao do role + permissoes explicitas em `users.permissoes`.

## Endpoints ja protegidos por permissao
- `auth/register` -> `users.create`
- `users` (gestao e perfil) -> permissoes `users.*` correspondentes
- `admin/empresas/**` -> `admin.empresas.manage`
- `api/atendimento/filas/dlq/**` -> `atendimento.dlq.manage`
- mutacoes de `planos` -> `planos.manage`

## Recomendacao de rollout
1. Manter `@Roles` + `@Permissions` nos endpoints sensiveis (modelo atual).
2. Adicionar permissoes gradualmente modulo a modulo.
3. Quando houver maturidade, avaliar migracao de algumas regras de role para permissao pura.
