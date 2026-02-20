# PR: Mobile Drawer Visibility + Profile Interaction Fix

## Branch / Commit
- Branch: `chore/mvp-effective-change-gate-20260218`
- Commit: `a84d14105d267f87e37ef309499f86311fd7a705`
- Data: `2026-02-20`

## Contexto
No mobile (320-430), o drawer lateral exibiu itens clicaveis com baixa/nenhuma visibilidade e, em alguns fluxos, o botao de perfil no topo ficava sem resposta apos interacoes com o menu.

## Causa raiz
1. O menu mobile reutilizava classes de cor da sidebar desktop escura (texto/icone claros em fundo branco).
2. O estado de submenu ativo podia permanecer apos fechar o drawer, mantendo camada residual e prejudicando interacoes no topo.

## O que foi alterado
- `frontend-web/src/components/navigation/HierarchicalNavGroup.tsx`
  - Introduzido branch por instancia (`instanceId === "mobile"`).
  - Paleta mobile aplicada para texto/icone com contraste em fundo branco.
- `frontend-web/src/components/layout/DashboardLayout.tsx`
  - Criada rotina `closeMobileSidebar` para fechar drawer + limpar submenu ativo.
  - Limpeza de submenu ativo tambem em mudanca de rota.
  - Adicionados test ids:
    - `data-testid="mobile-menu-open"`
    - `data-testid="mobile-menu-close"`
- `e2e/mobile-responsiveness-smoke.spec.ts`
  - Incluida verificacao dedicada:
    - abrir drawer mobile
    - validar visibilidade/cor do item de menu
    - fechar drawer
    - validar abertura do menu de perfil
- Atualizacao de auditoria/documentacao:
  - `RESPONSIVE_AUDIT.md`
  - `QUICK_FIXES.md`
  - `USED_UI_INVENTORY.md`

## Evidencia de validacao
### 1) Type-check frontend
```bash
cd frontend-web
npm run type-check
```
Resultado: `OK`

### 2) Build frontend
```bash
cd frontend-web
npm run build
```
Resultado: `Compiled successfully`

### 3) Smoke mobile principal (Playwright)
```bash
npx playwright test e2e/mobile-responsiveness-smoke.spec.ts --project=chromium --reporter=list
```
Resultado: `1 passed`

### 4) Verificacao complementar (viewports 390 e 430)
Resultado:
```json
{
  "results": [
    {
      "width": 390,
      "dashboardLabelColor": "rgb(21, 154, 156)",
      "profileMenuOpened": true
    },
    {
      "width": 430,
      "dashboardLabelColor": "rgb(21, 154, 156)",
      "profileMenuOpened": true
    }
  ]
}
```

## Risco e rollback
- Risco baixo: alteracoes focadas em estilos/estado do drawer mobile e seletores de teste.
- Rollback: reverter commit `a84d141`.

## Checklist
- [x] Sem overflow horizontal em fluxos validados
- [x] Menu mobile com contraste adequado
- [x] Botao de perfil interativo apos abrir/fechar drawer
- [x] Type-check e build frontend verdes
- [x] Smoke E2E mobile verde
