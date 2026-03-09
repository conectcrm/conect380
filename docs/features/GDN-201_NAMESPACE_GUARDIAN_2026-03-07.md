# GDN-201 - Namespace guardian (2026-03-07)

## Objetivo

Criar namespace backend isolado `guardian/*` como base de migracao do backoffice sensivel.

## Implementacao

1. Novo modulo dedicado:
   - `backend/src/modules/guardian/guardian.module.ts`
   - `backend/src/modules/guardian/guardian.controller.ts`

2. Grupo de rota isolado:
   - base path: `guardian`
   - endpoint inicial: `GET /guardian/health`

3. Controle de acesso inicial no namespace:
   - `JwtAuthGuard`
   - `RolesGuard`
   - `PermissionsGuard`
   - role: `SUPERADMIN`
   - permissao: `admin.empresas.manage`

4. Isolamento do middleware tenant:
   - `AppModule` atualizado para excluir `'/guardian/(.*)'` do `AssinaturaMiddleware`.
   - evita acoplamento com regras de assinatura do app cliente.

## Evidencia automatizada

Arquivo:
- `backend/src/modules/guardian/guardian.controller.spec.ts`

Cenarios:
1. namespace do controller em `guardian`;
2. metadata de role/permissao aplicada;
3. guards de autenticacao/autorizacao declarados no grupo de rota.

Comando:
- `npm --prefix backend run test -- src/modules/guardian/guardian.controller.spec.ts --runInBand`

Resultado:
- PASS
