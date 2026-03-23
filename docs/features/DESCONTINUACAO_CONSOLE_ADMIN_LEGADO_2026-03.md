# Descontinuacao do Console Admin Legado (2026-03)

## 1. Objetivo

Registrar a descontinuacao do modelo legado de console administrativo no frontend principal.

## 2. Rotas descontinuadas

1. `/admin/console`
2. `/admin/relatorios`
3. `/admin/auditoria`
4. `/admin/monitoramento`
5. `/admin/analytics`
6. `/admin/conformidade`
7. `/admin/acesso`

## 3. Arquivos removidos

1. `frontend-web/src/pages/AdminConsolePage.tsx`
2. `frontend-web/src/pages/admin/AdminConformidadePage.tsx`

## 4. Ajustes aplicados para remover legado

1. Rotas removidas de `frontend-web/src/App.tsx`.
2. Menu administrativo atualizado em `frontend-web/src/config/menuConfig.ts`.
3. Nucleo de administracao atualizado em `frontend-web/src/config/nucleusModulesConfig.ts`.
4. Layout por rota atualizado em `frontend-web/src/components/layout-v2/RouteTemplateFrame.tsx`.
5. Link legado removido da lista de empresas em `frontend-web/src/features/admin/empresas/EmpresasListPage.tsx`.
6. Escopo MVP atualizado em `frontend-web/src/config/mvpScope.ts`.

## 5. Rotas administrativas ativas apos descontinuacao

1. `/nuclei/administracao`
2. `/admin/empresas`
3. `/admin/empresas/:id`
4. `/admin/empresas/:empresaId/modulos`
5. `/admin/usuarios` (redirect para `/configuracoes/usuarios`)
6. `/admin/sistema`
7. `/admin/branding` (redirect para `/admin/sistema`)
