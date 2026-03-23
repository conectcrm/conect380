# GDN-202 - Migracao de endpoints administrativos sensiveis para `guardian/*`

## Data
- 2026-03-07

## Objetivo
- Expor as operacoes administrativas sensiveis no namespace isolado `guardian/*`, reduzindo dependencia de `admin/*` para governanca do sistema.

## Escopo implementado
- Criado controller `GuardianEmpresasController` com base `guardian/empresas`, reutilizando `AdminEmpresasService`.
- Criado controller `GuardianBffController` com base `guardian/bff`, reutilizando `AdminBffService`.
- Mantido `AdminBffAuditInterceptor` nas rotas `guardian/bff` para preservar trilha de auditoria operacional.
- `GuardianModule` passou a registrar os novos controllers e dependencias necessarias (`AdminModule`, `UsersModule` e interceptor).
- Mantidas rotas legadas `admin/*` para compatibilidade durante transicao de clientes e frontend.

## Endpoints adicionados
- `GET|POST|PUT|PATCH|DELETE /guardian/empresas/...`
- `GET|POST /guardian/bff/...`

## Testes
- Adicionados testes de metadata:
  - `guardian-empresas.controller.spec.ts`
  - `guardian-bff.controller.spec.ts`
- Validacao prevista com:
  - testes unitarios dos novos controllers
  - build do backend

## Proximo passo
- `GDN-203`: endurecer RBAC do namespace Guardian para exigir politica estrita de SUPERADMIN + permissoes granulares.

