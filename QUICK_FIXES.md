# QUICK_FIXES

## Status de aplicacao
- 2026-02-20: itens abaixo aplicados no codigo.

1. Inbox mobile navigation unblock (P0) - APLICADO
- Arquivo: frontend-web/src/features/atendimento/omnichannel/ChatOmnichannel.tsx
- Troca rapida:
  - Em < lg, renderizar lista de tickets (drawer ou tela dedicada) em vez de esconder totalmente com hidden lg:flex.
  - Adicionar botao de alternancia Lista/Chat e retorno para lista quando ticket estiver aberto.

2. Remover largura minima fixa da barra de selecao multipla (P1) - APLICADO
- Arquivo: frontend-web/src/features/propostas/components/SelecaoMultipla.tsx:125
- Troca rapida:
  - De: min-w-[400px]
  - Para: w-[calc(100vw-1rem)] max-w-xl min-w-0
  - Complementar: flex-wrap e gap-y-2 para botoes no mobile.

3. Corrigir spans de formulario para mobile (P1) - APLICADO
- Arquivo: frontend-web/src/pages/empresas/ConfiguracaoEmpresaPage.tsx
- Troca rapida:
  - De: col-span-2 (linhas 456, 541, 565, 696, 840)
  - Para: md:col-span-2

4. Evitar overflow na barra de acoes em massa de usuarios (P2) - APLICADO
- Arquivo: frontend-web/src/features/gestao/pages/GestaoUsuariosPage.tsx:1133
- Troca rapida:
  - Container: flex-col sm:flex-row gap-3
  - Grupo de botoes: flex flex-wrap gap-2
