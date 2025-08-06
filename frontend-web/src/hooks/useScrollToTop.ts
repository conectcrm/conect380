import { useEffect } from 'react';

/**
 * Hook personalizado para rolar automaticamente para o topo da página.
 * Pode ser usado em qualquer componente que precisa garantir que
 * o usuário veja o conteúdo desde o início.
 * 
 * @param dependency - Dependência opcional que, quando muda, 
 *                     faz o scroll acontecer novamente
 * @param smooth - Se deve usar animação suave (padrão: true)
 */
export const useScrollToTop = (dependency?: any, smooth: boolean = true) => {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, [dependency, smooth]);
};

/**
 * Função utilitária para rolar para o topo programaticamente
 * @param smooth - Se deve usar animação suave (padrão: true)
 */
export const scrollToTop = (smooth: boolean = true) => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: smooth ? 'smooth' : 'auto'
  });
};
