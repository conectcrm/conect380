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
  actions?: React.ReactNode;
}

export const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  actions,
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

  // Estados para sistema de busca
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults] = useState([
    { id: 1, type: 'cliente', title: 'João Silva', subtitle: 'cliente@email.com' },
    { id: 2, type: 'proposta', title: 'Proposta #001', subtitle: 'R$ 15.000,00' },
    { id: 3, type: 'contrato', title: 'Contrato #123', subtitle: 'Ativo até 12/2025' },
  ]);

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

      if (showSearchResults && !target.closest('[data-dropdown="search"]')) {
        setShowSearchResults(false);
      }
    };

    if (showNotifications || showUserMenu || showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showUserMenu, showSearchResults]);

  // Effect para atalho de teclado da busca
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder*="Buscar"]',
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      if (event.key === 'Escape') {
        setShowSearchResults(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal Refatorado - Dashboard Fênix CRM */}
      <header className="bg-white shadow-lg border-b sticky top-0 z-20" role="banner">
        <div className="w-full max-w-[1440px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Seção Esquerda: Logo + Dashboard Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                  style={{ backgroundColor: currentPalette.colors.primary }}
                >
                  F
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Fênix CRM</h1>
                  <p className="text-sm text-gray-600 hidden sm:block">
                    Dashboard - Visão geral do seu negócio
                  </p>
                </div>
              </div>
            </div>

            {/* Seção Central: Campo de Busca */}
            <div className="flex-1 max-w-md mx-4 hidden lg:block" data-dropdown="search">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSearchResults(searchQuery.length > 0)}
                  placeholder="Buscar clientes, propostas, contratos..."
                  className="block w-full pl-10 pr-16 py-2.5 border border-gray-300 rounded-xl bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white text-sm transition-all duration-200"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <kbd className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs bg-white text-gray-600 font-medium">
                    ⌘K
                  </kbd>
                </div>

                {/* Dropdown de Resultados de Busca */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">
                          Resultados para "{searchQuery}"
                        </span>
                        <span className="text-xs text-gray-500">
                          {searchResults.length} encontrado{searchResults.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {searchResults
                        .filter(
                          (result) =>
                            result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            result.subtitle.toLowerCase().includes(searchQuery.toLowerCase()),
                        )
                        .map((result) => (
                          <div
                            key={result.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium ${result.type === 'cliente'
                                    ? 'bg-blue-500'
                                    : result.type === 'proposta'
                                      ? 'bg-green-500'
                                      : 'bg-purple-500'
                                  }`}
                              >
                                {result.type === 'cliente'
                                  ? 'C'
                                  : result.type === 'proposta'
                                    ? 'P'
                                    : 'CT'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {result.title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                              </div>
                              <div className="text-xs text-gray-400 capitalize">{result.type}</div>
                            </div>
                          </div>
                        ))}

                      {searchResults.filter(
                        (result) =>
                          result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          result.subtitle.toLowerCase().includes(searchQuery.toLowerCase()),
                      ).length === 0 && (
                          <div className="p-6 text-center">
                            <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Nenhum resultado encontrado</p>
                            <p className="text-xs text-gray-400">Tente usar outros termos</p>
                          </div>
                        )}
                    </div>

                    <div className="p-3 border-t bg-gray-50">
                      <button className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
                        Ver todos os resultados
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seção Direita: Status + Notificações + Idioma + Usuário */}
            <div className="flex items-center gap-3">
              {/* Status Online */}
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${isOnline
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
              >
                {isOnline ? (
                  <Wifi className="w-4 h-4 animate-pulse" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
                <span className="text-sm font-medium hidden md:inline">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Notificações com Badge */}
              <div className="relative" data-dropdown="notifications">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 rounded-full hover:bg-gray-100 transition-colors group"
                  title="Notificações"
                >
                  <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                {/* Dropdown de Notificações */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notificações</h3>
                        {notifications.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {notifications.length} nova{notifications.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 leading-relaxed">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Nenhuma notificação</p>
                          <p className="text-xs text-gray-400">Você está em dia!</p>
                        </div>
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 border-t bg-gray-50">
                        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                          Ver todas as notificações
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Seletor de Idioma com Bandeira */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <span className="text-lg">🇧🇷</span>
                <span className="text-sm font-medium text-gray-700 hidden lg:inline">
                  Português
                </span>
              </div>

              {/* Avatar/Menu do Usuário */}
              <div className="relative" data-dropdown="user-menu">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
                  title={`${formatUserName(user?.nome || 'Admin Sistema')} - ${formatCompanyName(user?.empresa?.nome || 'Fênix CRM Demo')}`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatUserName(user?.nome || 'Admin Sistema')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatCompanyName(user?.empresa?.nome || 'Fênix CRM Demo')}
                    </p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown do Usuário - Design Moderno */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border shadow-xl z-50 overflow-hidden">
                    {/* Header do Profile */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {formatUserName(user?.nome || 'Admin Sistema')}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {user?.email || 'admin@fenixcrm.com'}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <p className="text-xs text-gray-500 truncate">
                              {formatCompanyName(user?.empresa?.nome || 'Fênix CRM Demo')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Options */}
                    <div className="p-2">
                      <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <Settings className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Configurações</span>
                          <p className="text-xs text-gray-500">Preferências e conta</p>
                        </div>
                      </button>
                      <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <MessageCircle className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">
                            Central de Ajuda
                          </span>
                          <p className="text-xs text-gray-500">Suporte e documentação</p>
                        </div>
                      </button>
                    </div>

                    {/* Logout Section */}
                    <div className="p-2 border-t bg-gray-50">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 p-3 text-left hover:bg-red-50 rounded-lg transition-colors group"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                          <LogOut className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-red-600">Sair do Sistema</span>
                          <p className="text-xs text-red-500">Finalizar sessão atual</p>
                        </div>
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
        <div className="bg-white rounded-xl border border-[#DEEFE7] shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id={headingId} className="text-2xl font-semibold text-[#002333] tracking-tight">
                {title}
              </h2>
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
            {actions && (
              <div className="flex items-center gap-3 flex-wrap" aria-label="Ações do dashboard">
                {actions}
              </div>
            )}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};
