import React, { useState } from 'react';
import {
  Bell,
  Search,
  Settings,
  User,
  Menu,
  X,
  ChevronDown,
  Home,
  Users,
  Package,
  BarChart3,
  CreditCard,
  FileText,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  userInfo?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  onMenuToggle?: () => void;
  className?: string;
}

/**
 * Header Otimizado - Sem Overflow e Informações Priorizadas
 * Baseado nas melhores práticas dos CRMs líderes de mercado
 */
export const HeaderOtimizado: React.FC<HeaderProps> = ({
  userInfo = { name: 'João Silva', role: 'Administrador' },
  onMenuToggle,
  className = '',
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      {/* Header Principal */}
      <header className={`bg-white border-b border-gray-200 sticky top-0 z-40 ${className}`}>
        <div className="h-16 px-4 flex items-center justify-between gap-4 max-w-full overflow-hidden">
          {/* Seção Esquerda: Logo + Menu Mobile */}
          <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
            {/* Menu Mobile */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Menu principal"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-[#159A9C] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="font-bold text-gray-900 text-lg hidden sm:block truncate">
                Fênix CRM
              </span>
            </div>
          </div>

          {/* Seção Central: Busca (oculta em mobile) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar clientes, produtos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Seção Direita: Ações + Usuário */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Busca Mobile */}
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  <span className="sr-only">3 notificações</span>
                </span>
              </button>

              {/* Dropdown de Notificações */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notificações</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-3 hover:bg-gray-50 border-b border-gray-100">
                      <p className="text-sm text-gray-900">Novo lead: Maria Santos</p>
                      <p className="text-xs text-gray-500 mt-1">há 5 minutos</p>
                    </div>
                    <div className="p-3 hover:bg-gray-50 border-b border-gray-100">
                      <p className="text-sm text-gray-900">Proposta aprovada</p>
                      <p className="text-xs text-gray-500 mt-1">há 2 horas</p>
                    </div>
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <button className="text-sm text-[#159A9C] hover:text-[#0F7B7D]">Ver todas</button>
                  </div>
                </div>
              )}
            </div>

            {/* Configurações (oculto em mobile) */}
            <button className="hidden sm:flex p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            {/* Menu do Usuário */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors max-w-48"
              >
                <div className="w-8 h-8 bg-[#159A9C] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{userInfo.name}</p>
                  <p className="text-xs text-gray-500 truncate">{userInfo.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>

              {/* Dropdown do Usuário */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{userInfo.name}</p>
                    <p className="text-sm text-gray-500">{userInfo.role}</p>
                  </div>
                  <div className="py-1">
                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Perfil
                    </button>
                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configurações
                    </button>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breadcrumb (opcional, aparece abaixo do header) */}
        <div className="hidden lg:block px-4 py-2 bg-gray-50 border-t border-gray-200">
          <nav className="text-sm text-gray-600">
            <span>Dashboard</span>
            <span className="mx-2">›</span>
            <span>Produtos</span>
            <span className="mx-2">›</span>
            <span className="text-gray-900">Cadastro</span>
          </nav>
        </div>
      </header>

      {/* Menu Mobile Overlay */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-gray-800 bg-opacity-50">
          <div className="w-64 h-full bg-white shadow-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#159A9C] rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <span className="font-bold text-gray-900">Fênix CRM</span>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <nav className="p-4 space-y-2">
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Home className="w-5 h-5" />
                Dashboard
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Users className="w-5 h-5" />
                Clientes
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Package className="w-5 h-5" />
                Produtos
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <BarChart3 className="w-5 h-5" />
                Relatórios
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <CreditCard className="w-5 h-5" />
                Financeiro
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <FileText className="w-5 h-5" />
                Propostas
              </a>
            </nav>

            {/* Busca no Menu Mobile */}
            <div className="p-4 border-t border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

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

export default HeaderOtimizado;
