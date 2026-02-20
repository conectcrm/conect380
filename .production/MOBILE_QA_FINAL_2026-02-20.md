# Mobile QA Final - 2026-02-20

## Escopo
- Viewports: `390`, `430`
- Rotas críticas:
  - `/dashboard`
  - `/atendimento/inbox`
  - `/vendas/propostas`
  - `/configuracoes/empresa`
  - `/configuracoes/usuarios`

## Critérios validados
- Não redirecionar para login indevidamente
- Não exibir página de acesso negado
- Não ter overflow horizontal
- Quando houver `DashboardLayout`:
  - Abrir drawer mobile
  - Verificar item de menu visível com contraste
  - Fechar drawer
  - Abrir menu de perfil e validar `"Meu Perfil"`

## Resultado consolidado
- Execução: `2026-02-20T17:10:51.784Z`
- Base URL: `http://localhost:3000`
- Status geral: ✅ **PASS**

## Evidência por rota

| Width | Rota | Login Redirect | Permission Denied | Overflow X | Topbar Menu | Cor label drawer | Perfil abriu |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 390 | `/dashboard` | false | false | false | true | `rgb(21, 154, 156)` | true |
| 390 | `/atendimento/inbox` | false | false | false | false | n/a | n/a |
| 390 | `/vendas/propostas` | false | false | false | true | `rgb(51, 65, 85)` | true |
| 390 | `/configuracoes/empresa` | false | false | false | true | `rgb(51, 65, 85)` | true |
| 390 | `/configuracoes/usuarios` | false | false | false | true | `rgb(51, 65, 85)` | true |
| 430 | `/dashboard` | false | false | false | true | `rgb(21, 154, 156)` | true |
| 430 | `/atendimento/inbox` | false | false | false | false | n/a | n/a |
| 430 | `/vendas/propostas` | false | false | false | true | `rgb(51, 65, 85)` | true |
| 430 | `/configuracoes/empresa` | false | false | false | true | `rgb(51, 65, 85)` | true |
| 430 | `/configuracoes/usuarios` | false | false | false | true | `rgb(51, 65, 85)` | true |

## Observações
- `/atendimento/inbox` não expõe o botão do drawer/topbar por arquitetura da tela fullscreen; por isso os checks de menu/perfil são `n/a` nessa rota.
- Nas rotas com `DashboardLayout`, o fluxo menu mobile + perfil ficou estável em ambos os breakpoints.

