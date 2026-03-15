# GDN-206 - Remocao do client administrativo do bundle do sistema

## Data
- 2026-03-07

## Objetivo
- Remover do app cliente (`frontend-web`) a exposicao de rotas/menu/admin client que apontavam para operacoes de backoffice.

## Mudancas implementadas
- `App.tsx`
  - Removidos lazy imports e rotas de administracao legada:
    - `/nuclei/administracao`
    - `/admin/empresas`
    - `/admin/empresas/:id`
    - `/admin/empresas/:empresaId/modulos`
    - `/admin/usuarios`
    - `/admin/sistema`
    - `/admin/branding`
  - Redirect legado `'/gestao/empresas'` alterado para `'/empresas/minhas'`.
- `menuConfig.ts`
  - Removida secao de menu `administracao` (itens `admin-*`).
  - Removidas regras e aliases de permissao para caminhos `/admin/*`.
  - Mantido alias legado `'/gestao/empresas'` com modelo de permissao de `'/empresas/minhas'`.
- `RouteTemplateFrame.tsx`
  - Removidos padroes visuais que referenciavam `/admin/*` e `/nuclei/administracao`.
- `PortalClientePage.tsx`
  - Link de retorno alterado de `/nuclei/administracao` para `/dashboard`.
- Servico de branding
  - `systemBrandingService.ts` ficou apenas com API publica (`/system-branding/public`).
  - Criado `systemBrandingAdminService.ts` para endpoints `/admin/system-branding` (isola API admin fora do fluxo do app cliente).
  - `SystemBrandingPage` ajustada para usar o novo servico admin.

## Validacao executada
- Teste de permissao de menu:
  - `npm --prefix frontend-web run test -- --runTestsByPath src/config/__tests__/menuConfig.permissions.test.ts --watch=false`
- Build frontend:
  - `npm --prefix frontend-web run build`
- Verificacao de exposicao no bundle gerado:
  - busca por `admin/empresas`, `admin/system-branding`, `/admin/sistema`, `/admin/branding`, `/nuclei/administracao`
  - resultado: sem ocorrencias em `frontend-web/build/static/js`

