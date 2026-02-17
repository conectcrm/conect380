/**
 * Camadas visuais centralizadas para reduzir conflitos de sobreposicao.
 * Use em elementos posicionados (fixed/absolute/sticky).
 */
export const UI_LAYERS = {
  TOPBAR_HEADER: 'z-10',
  SIDEBAR_DESKTOP: 'z-20',
  MOBILE_SIDEBAR_SHELL: 'z-40',
  TOPBAR_FLOATING_ACTIONS: 'z-40',
  USER_MENU_DROPDOWN: 'z-40',
  POPOVER_DROPDOWN: 'z-50',
  SUBMENU_BACKDROP: 'z-[52]',
  SUBMENU_PANEL: 'z-[55]',
  OVERLAY_DROPDOWN: 'z-[60]',
} as const;
