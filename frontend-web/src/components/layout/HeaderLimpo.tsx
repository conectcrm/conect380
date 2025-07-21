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
  HelpCircle
} from 'lucide-react';

interface HeaderLimpoProps {
  userInfo?: {
    name: string;
    avatar?: string;
    role?: string;
    email?: string;
  };
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  className?: string;
}

/**
 * Header Limpo - Sem Logo, Focado em Funcionalidades Essenciais
 * 
 * Princípios aplicados:
 * - Sem redundância de logo (já existe na sidebar)
 * - Sem breadcrumbs (título da página já informa onde está)
 * - Foco em ações rápidas e contexto do usuário
 * - Design minimalista e funcional
 */
export const HeaderLimpo: React.FC<HeaderLimpoProps> = ({
  userInfo = { 
    name: 'João Silva', 
    role: 'Administrador',
    email: 'joao.silva@empresa.com'
  },
  onThemeToggle,
  isDarkMode = false,
  className = ''
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Dados de exemplo para notificações
  const notifications = [
    {
      id: 1,
      title: 'Novo lead: Maria Santos',
      message: 'Lead qualificado aguardando contato',
      time: 'há 5 minutos',
      unread: true
    },
    {
      id: 2,
      title: 'Proposta aprovada',
      message: 'Cliente ABC aprovou proposta #1234',
      time: 'há 2 horas',
      unread: true
    },
    {
      id: 3,
      title: 'Meta de vendas',
      message: 'Você atingiu 85% da meta mensal',
      time: 'há 1 dia',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      {/* Header Principal */}
      <header className={`bg-white/95 backdrop-blur-sm border-b border-gray-200/80 sticky top-0 z-40 ${className}`}>
        <div className="h-14 px-6 flex items-center justify-between">
          
          {/* Seção Esquerda: Busca Global */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar clientes, produtos, contratos..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 focus:bg-white transition-all text-sm placeholder-gray-500"
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
              />
              
              {/* Dropdown de Busca Rápida */}
              {showSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Busca Rápida
                    </div>
                    <div className="space-y-1">
                      <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        Clientes
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-50 flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400" />
                        Produtos
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seção Direita: Ações e Usuário */}
          <div className="flex items-center gap-2">
            
            {/* Toggle Tema */}
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-lg hover:bg-gray-100/80 transition-colors group"
              title={isDarkMode ? 'Modo claro' : 'Modo escuro'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-gray-600 group-hover:text-amber-500 transition-colors" />
              ) : (
                <Moon className="w-4 h-4 text-gray-600 group-hover:text-indigo-500 transition-colors" />
              )}
            </button>

            {/* Ajuda */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100/80 transition-colors group"
              title="Ajuda e suporte"
            >
              <HelpCircle className="w-4 h-4 text-gray-600 group-hover:text-blue-500 transition-colors" />
            </button>

            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100/80 transition-colors group"
                title="Notificações"
              >
                <Bell className="w-4 h-4 text-gray-600 group-hover:text-blue-500 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown de Notificações */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notificações</h3>
                      {unreadCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                          {unreadCount} novas
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                          notification.unread ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              notification.unread ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {notification.time}
                            </p>
                          </div>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                    <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                      Ver todas as notificações
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Configurações Rápidas */}
            <button
              className="p-2 rounded-lg hover:bg-gray-100/80 transition-colors group"
              title="Configurações rápidas"
            >
              <Settings className="w-4 h-4 text-gray-600 group-hover:text-gray-700 transition-colors" />
            </button>

            {/* Separador */}
            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            {/* Menu do Usuário */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100/80 transition-colors max-w-xs"
              >
                {/* Avatar */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                
                {/* Info do Usuário */}
                <div className="text-left min-w-0 hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {userInfo.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {userInfo.role}
                  </p>
                </div>
                
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              {/* Dropdown do Usuário */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  {/* Cabeçalho do usuário */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {userInfo.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{userInfo.name}</p>
                        <p className="text-sm text-gray-500 truncate">{userInfo.email}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Menu de ações */}
                  <div className="py-2">
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                      <User className="w-4 h-4 text-gray-400" />
                      Meu Perfil
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                      <Settings className="w-4 h-4 text-gray-400" />
                      Configurações
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                      <Globe className="w-4 h-4 text-gray-400" />
                      Idioma
                    </button>
                  </div>
                  
                  {/* Ações críticas */}
                  <div className="border-t border-gray-100 py-2">
                    <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Sair do Sistema
                    </button>
                  </div>
                </div>
              )}
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

export default HeaderLimpo;
