import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { formatCompanyName, formatUserName } from '../../utils/textUtils';
import LanguageSelector from '../common/LanguageSelector';
import {
  Bell,
  Wifi,
  WifiOff,
  Search,
  Settings,
  MessageCircle,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  children,
  title,
  subtitle,
}) => {
  const { currentPalette } = useTheme();
  const { user, logout } = useAuth();
  const headingId = React.useId();
  const mainId = React.useId();

  // Estados para funcionalidades da barra superior
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifications] = useState([
    { id: 1, type: 'info', message: 'Nova proposta recebida', time: '2 min' },
    { id: 2, type: 'warning', message: 'Cliente aguarda retorno', time: '15 min' },
    { id: 3, type: 'success', message: 'Venda concluída', time: '1h' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Monitor de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Effect para fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (showNotifications && !target.closest('[data-dropdown="notifications"]')) {
        setShowNotifications(false);
      }

      if (showUserMenu && !target.closest('[data-dropdown="user-menu"]')) {
        setShowUserMenu(false);
      }
    };

    if (showNotifications || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showUserMenu]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Único e Unificado - SEM DUPLICAÇÕES */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-20" role="banner">
        <div className="w-full max-w-[1440px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo + Título da Página */}
            <div className="flex items-center gap-6">
              {/* Logo do Sistema */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: currentPalette.colors.primary }}
                >
                  F
                </div>
                <h1 className="text-lg font-bold text-gray-900">Fênix CRM</h1>
              </div>

              {/* Separador + Título da Página */}
              <div className="hidden md:flex items-center gap-4">
                <div className="w-px h-6 bg-gray-300"></div>
                <div>
                  <h2 id={headingId} className="text-lg font-semibold text-gray-800" tabIndex={0}>
                    {title}
                  </h2>
                  {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
                </div>
              </div>
            </div>

            {/* Actions + Menu do Usuário */}
            <div className="flex items-center gap-3">
              {/* Status de Conexão (compacto) */}
              <div className="hidden lg:flex items-center gap-2 px-2 py-1 rounded-md bg-gray-50">
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-green-600" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-600" />
                )}
                <span className="text-xs text-gray-600">{isOnline ? 'Online' : 'Offline'}</span>
              </div>

              {/* Busca Global */}
              <button
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title="Busca rápida"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm hidden md:inline">Buscar...</span>
              </button>

              {/* Notificações - ÚNICO */}
              <div className="relative" data-dropdown="notifications">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Dropdown de Notificações */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg border shadow-lg z-50">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold text-gray-900">Notificações</h3>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-3 border-b last:border-b-0 hover:bg-gray-50"
                        >
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 border-t">
                      <button className="text-sm text-[#159A9C] hover:underline">Ver todas</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Seletor de Idioma */}
              <LanguageSelector />

              {/* Menu do Usuário - ÚNICO */}
              <div className="relative" data-dropdown="user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {formatUserName(user?.nome || 'Admin Sistema')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCompanyName(user?.empresa?.nome || 'Fênix CRM Demo')}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown do Usuário */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg border shadow-lg z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatUserName(user?.nome || 'Admin Sistema')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user?.email || 'admin@fenixcrm.com'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatCompanyName(user?.empresa?.nome || 'Fênix CRM Demo')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                        <Settings className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Configurações</span>
                      </button>
                      <button className="w-full flex items-center gap-3 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
                        <MessageCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Ajuda</span>
                      </button>
                    </div>

                    <div className="p-2 border-t">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 p-2 text-left hover:bg-red-50 rounded-lg transition-colors text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sair</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main
        id={mainId}
        className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 sm:py-6 lg:py-8"
        role="main"
        aria-labelledby={headingId}
      >
        {children}
      </main>
    </div>
  );
};
