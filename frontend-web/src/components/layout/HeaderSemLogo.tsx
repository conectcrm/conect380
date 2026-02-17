import React, { useState } from 'react';
import {
  Bell,
  Search,
  Settings,
  User,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  Globe,
  MessageCircle,
} from 'lucide-react';

interface HeaderSemLogoProps {
  userInfo?: {
    name: string;
    avatar?: string;
    role?: string;
    email?: string;
  };
  companyName?: string;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  className?: string;
}

/**
 * Header Sem Logo - Ultra Compacto e Otimizado
 *
 * Remove a logo para evitar aumento de altura no zoom
 * Mantém apenas o nome da empresa de forma minimalista
 * Altura fixa que não muda com zoom
 */
export const HeaderSemLogo: React.FC<HeaderSemLogoProps> = ({
  userInfo = {
    name: 'João Silva',
    role: 'Administrador',
    email: 'joao.silva@empresa.com',
  },
  companyName = 'Fênix CRM Demo',
  onThemeToggle,
  isDarkMode = false,
  className = '',
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Dados de exemplo para notificações
  const notifications = [
    {
      id: 1,
      title: 'Novo lead: Maria Santos',
      message: 'Lead qualificado aguardando contato',
      time: 'há 5 minutos',
      unread: true,
    },
    {
      id: 2,
      title: 'Proposta aprovada',
      message: 'Cliente ABC aprovou proposta #1234',
      time: 'há 2 horas',
      unread: true,
    },
    {
      id: 3,
      title: 'Meta de vendas',
      message: 'Você atingiu 85% da meta mensal',
      time: 'há 1 dia',
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <>
      {/* Header Principal - Altura Fixa */}
      <header
        className={`bg-white/95 backdrop-blur-sm border-b border-gray-200/80 sticky top-0 z-40 ${className}`}
      >
        <div className="h-12 px-4 flex items-center justify-between max-w-full overflow-hidden">
          {/* Seção Esquerda: Nome da Empresa + Busca */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Nome da Empresa - Compacto */}
            <div className="flex-shrink-0">
              <span className="text-sm font-semibold text-gray-900 truncate">{companyName}</span>
            </div>

            {/* Separador */}
            <div className="w-px h-4 bg-gray-300 hidden sm:block"></div>

            {/* Busca Global */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Buscar clientes, propostas, contratos..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50/80 border border-gray-200/50 rounded-md focus:ring-1 focus:ring-[#159A9C]/30 focus:border-[#159A9C]/50 focus:bg-white transition-all text-xs placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Seção Direita: Ações Compactas */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Status Online */}
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-700">Online</span>
            </div>

            {/* Idioma */}
            <button className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors">
              BR
            </button>

            {/* Toggle Tema */}
            <button
              onClick={onThemeToggle}
              className="p-1.5 rounded-md hover:bg-gray-100/80 transition-colors group"
              title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-gray-600 group-hover:text-amber-500 transition-colors" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-gray-600 group-hover:text-indigo-500 transition-colors" />
              )}
            </button>

            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 rounded-md hover:bg-gray-100/80 transition-colors group"
                title="Notificações"
              >
                <Bell className="w-3.5 h-3.5 text-gray-600 group-hover:text-[#159A9C] transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown de Notificações */}
              {showNotifications && (
                <div className="absolute right-0 mt-1 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${notification.unread ? 'bg-[#159A9C]/5' : ''
                          }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-xs font-medium ${notification.unread ? 'text-gray-900' : 'text-gray-700'
                                }`}
                            >
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                          </div>
                          {notification.unread && (
                            <div className="w-1.5 h-1.5 bg-[#159A9C] rounded-full mt-1 flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                    <button className="w-full text-xs text-[#159A9C] hover:text-[#0F7B7D] font-medium">
                      Ver todas as notificações
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Configurações */}
            <button
              className="p-1.5 rounded-md hover:bg-gray-100/80 transition-colors group"
              title="Configurações"
            >
              <Settings className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-700 transition-colors" />
            </button>

            {/* Separador */}
            <div className="w-px h-4 bg-gray-200 mx-1"></div>

            {/* Menu do Usuário Compacto */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100/80 transition-colors max-w-xs"
              >
                {/* Avatar Pequeno */}
                <div className="w-6 h-6 bg-[#159A9C] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-xs">
                    {userInfo.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </span>
                </div>

                {/* Info do Usuário - Oculta em mobile */}
                <div className="text-left min-w-0 hidden md:block">
                  <p className="text-xs font-medium text-gray-900 truncate max-w-24">
                    {userInfo.name}
                  </p>
                </div>

                <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
              </button>

              {/* Dropdown do Usuário */}
              {showUserMenu && (
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  {/* Cabeçalho do usuário */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#159A9C] rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-xs">
                          {userInfo.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {userInfo.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu de ações */}
                  <div className="py-1">
                    <button className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      Meu Perfil
                    </button>
                    <button className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                      <Settings className="w-3.5 h-3.5 text-gray-400" />
                      Configurações
                    </button>
                    <button className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
                      <MessageCircle className="w-3.5 h-3.5 text-gray-400" />
                      Ajuda
                    </button>
                  </div>

                  {/* Ações críticas */}
                  <div className="border-t border-gray-100 py-1">
                    <button className="w-full px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                      <LogOut className="w-3.5 h-3.5" />
                      Sair do Sistema
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linha de Status Adicional (Opcional) */}
        <div className="hidden lg:block px-4 py-1 bg-gray-50/80 border-t border-gray-200/50">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>Propostas - Acompanhe suas propostas comerciais</span>
              <span>•</span>
              <span>domingo, 20 de julho de 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-medium">Sistema Ativo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay para fechar dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </>
  );
};

export default HeaderSemLogo;
