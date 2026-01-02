import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente que automaticamente rola para o topo da página
 * sempre que a rota muda. Resolve o problema de navegação
 * entre páginas mantendo a posição de scroll anterior.
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Rola para o topo da página sempre que a rota muda
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth', // Animação suave opcional
    });
  }, [pathname]);

  return null; // Este componente não renderiza nada
};

export default ScrollToTop;
