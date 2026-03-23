import { useEffect, useRef, useCallback } from 'react';

const BRANDING_CACHE_KEY = 'conect_system_branding_cache_v1';
const DEFAULT_NOTIFICATION_ICON = '/favicon.svg';

const resolveRuntimeAssetUrl = (url: string): string => {
  if (!url) {
    return url;
  }

  if (
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    const basePath = process.env.PUBLIC_URL || '';
    return `${basePath}${url}`;
  }

  return url;
};

const getCachedBrandingIcon = (): string => {
  try {
    const raw = localStorage.getItem(BRANDING_CACHE_KEY);
    if (!raw) {
      return resolveRuntimeAssetUrl(DEFAULT_NOTIFICATION_ICON);
    }

    const parsed = JSON.parse(raw) as { logoIconUrl?: string; faviconUrl?: string };
    return resolveRuntimeAssetUrl(parsed.logoIconUrl || parsed.faviconUrl || DEFAULT_NOTIFICATION_ICON);
  } catch {
    return resolveRuntimeAssetUrl(DEFAULT_NOTIFICATION_ICON);
  }
};

// ===== INTERFACES =====

export interface NotificacaoDesktopOptions {
  titulo: string;
  corpo: string;
  icone?: string;
  tag?: string; // Identificador único para evitar duplicatas
  onClick?: () => void;
  requireInteraction?: boolean; // Manter visível até usuário interagir
  silent?: boolean; // Não tocar som
}

interface UseNotificacoesDesktopReturn {
  permissao: NotificationPermission;
  suportado: boolean;
  solicitarPermissao: () => Promise<boolean>;
  mostrarNotificacao: (options: NotificacaoDesktopOptions) => void;
  fecharNotificacao: (tag: string) => void;
  fecharTodas: () => void;
}

// ===== HOOK =====

/**
 * Hook para gerenciar notificações desktop do navegador
 *
 * Funcionalidades:
 * - Solicitar permissão do usuário
 * - Exibir notificações desktop
 * - Tocar som (opcional)
 * - Callbacks ao clicar na notificação
 * - Gerenciar tags para evitar duplicatas
 * - Badge count no título da página
 *
 * @example
 * ```tsx
 * const {
 *   permissao,
 *   solicitarPermissao,
 *   mostrarNotificacao
 * } = useNotificacoesDesktop();
 *
 * // Solicitar permissão
 * if (permissao === 'default') {
 *   await solicitarPermissao();
 * }
 *
 * // Exibir notificação
 * mostrarNotificacao({
 *   titulo: 'Nova Mensagem',
 *   corpo: 'Cliente enviou: Olá, preciso de ajuda',
 *   tag: 'msg-123',
 *   onClick: () => console.log('Clicou na notificação')
 * });
 * ```
 */
export function useNotificacoesDesktop(): UseNotificacoesDesktopReturn {
  const notificacoesRef = useRef<Map<string, Notification>>(new Map());
  const tituloOriginalRef = useRef<string>(document.title);
  const contadorRef = useRef<number>(0);

  // Verificar se navegador suporta notificações
  const suportado = 'Notification' in window;

  // Permissão atual
  const permissao = suportado ? Notification.permission : ('denied' as NotificationPermission);

  // ===== SOLICITAR PERMISSÃO =====

  const solicitarPermissao = useCallback(async (): Promise<boolean> => {
    if (!suportado) {
      console.warn('⚠️ Notificações desktop não são suportadas neste navegador');
      return false;
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Permissão de notificações já concedida');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('❌ Permissão de notificações negada pelo usuário');
      return false;
    }

    try {
      const resultado = await Notification.requestPermission();
      console.log(`📢 Permissão de notificações: ${resultado}`);
      return resultado === 'granted';
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão de notificações:', error);
      return false;
    }
  }, [suportado]);

  // ===== ATUALIZAR BADGE COUNT =====

  const atualizarBadgeCount = useCallback((incremento: number) => {
    contadorRef.current = Math.max(0, contadorRef.current + incremento);

    if (contadorRef.current > 0) {
      document.title = `(${contadorRef.current}) ${tituloOriginalRef.current}`;
    } else {
      document.title = tituloOriginalRef.current;
    }
  }, []);

  const resetarBadgeCount = useCallback(() => {
    contadorRef.current = 0;
    document.title = tituloOriginalRef.current;
  }, []);

  // ===== MOSTRAR NOTIFICAÇÃO =====

  const mostrarNotificacao = useCallback(
    (options: NotificacaoDesktopOptions) => {
      if (!suportado) {
        console.warn('⚠️ Notificações desktop não suportadas');
        return;
      }

      if (Notification.permission !== 'granted') {
        console.warn('⚠️ Permissão de notificações não concedida');
        return;
      }

      // Se já existe notificação com essa tag, fechá-la
      if (options.tag && notificacoesRef.current.has(options.tag)) {
        const notificacaoAntiga = notificacoesRef.current.get(options.tag);
        notificacaoAntiga?.close();
      }

      try {
        // Criar notificação
        const runtimeBrandIcon = getCachedBrandingIcon();
        const notificacao = new Notification(options.titulo, {
          body: options.corpo,
          icon: options.icone || runtimeBrandIcon,
          badge: runtimeBrandIcon,
          tag: options.tag,
          requireInteraction: options.requireInteraction ?? false,
          silent: options.silent ?? false,
        });

        // Guardar referência
        if (options.tag) {
          notificacoesRef.current.set(options.tag, notificacao);
        }

        // Incrementar badge count
        atualizarBadgeCount(1);

        // Handler de clique
        notificacao.onclick = () => {
          window.focus();
          options.onClick?.();
          notificacao.close();
        };

        // Limpar referência ao fechar
        notificacao.onclose = () => {
          if (options.tag) {
            notificacoesRef.current.delete(options.tag);
          }
          atualizarBadgeCount(-1);
        };

        // Auto-fechar após 10 segundos (se não requireInteraction)
        if (!options.requireInteraction) {
          setTimeout(() => {
            notificacao.close();
          }, 10000);
        }

        console.log('✅ Notificação desktop exibida:', options.titulo);
      } catch (error) {
        console.error('❌ Erro ao exibir notificação:', error);
      }
    },
    [suportado, atualizarBadgeCount],
  );

  // ===== FECHAR NOTIFICAÇÃO =====

  const fecharNotificacao = useCallback((tag: string) => {
    const notificacao = notificacoesRef.current.get(tag);
    if (notificacao) {
      notificacao.close();
      notificacoesRef.current.delete(tag);
    }
  }, []);

  // ===== FECHAR TODAS =====

  const fecharTodas = useCallback(() => {
    notificacoesRef.current.forEach((notificacao) => {
      notificacao.close();
    });
    notificacoesRef.current.clear();
    resetarBadgeCount();
  }, [resetarBadgeCount]);

  // ===== CLEANUP =====

  useEffect(() => {
    // Salvar título original
    tituloOriginalRef.current = document.title;

    // Reset ao desmontar
    return () => {
      fecharTodas();
      document.title = tituloOriginalRef.current;
    };
  }, [fecharTodas]);

  // Reset badge count quando janela recebe foco
  useEffect(() => {
    const handleFocus = () => {
      resetarBadgeCount();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [resetarBadgeCount]);

  return {
    permissao,
    suportado,
    solicitarPermissao,
    mostrarNotificacao,
    fecharNotificacao,
    fecharTodas,
  };
}
