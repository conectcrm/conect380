import React, { useEffect, useState } from 'react';
import { MessageCircle, X, HelpCircle, Phone, Mail, Headphones, ExternalLink, Clock, Brain, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupportWidget } from '../../hooks/useSupportWidget';
import { ChatCompacto } from './ChatCompacto';

interface SupportWidgetProps {
  position?: 'bottom-right' | 'bottom-left';
  showOnPages?: string[];
  hideOnPages?: string[];
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({ 
  position = 'bottom-right',
  showOnPages = [],
  hideOnPages = []
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDirectChat, setShowDirectChat] = useState(false);
  const {
    isOpen,
    hasNewMessage,
    unreadCount,
    isAgentOnline,
    averageResponseTime,
    toggleWidget,
    closeWidget
  } = useSupportWidget();

  // Verificar se deve mostrar o widget na página atual
  const shouldShowWidget = () => {
    const currentPath = location.pathname;
    
    if (hideOnPages.length > 0 && hideOnPages.some(page => currentPath.includes(page))) {
      return false;
    }
    
    if (showOnPages.length > 0 && !showOnPages.some(page => currentPath.includes(page))) {
      return false;
    }
    
    return true;
  };

  // Fechar widget quando navegar para página de suporte
  useEffect(() => {
    if (location.pathname.includes('/suporte') && isOpen) {
      closeWidget();
    }
  }, [location.pathname, isOpen, closeWidget]);

  const handleNavigateToSupport = () => {
    navigate('/suporte');
    closeWidget();
  };

  const handleNavigateToChat = () => {
    navigate('/suporte');
    closeWidget();
    // Aqui você pode adicionar lógica para abrir diretamente a aba de chat
    setTimeout(() => {
      const chatTab = document.querySelector('[data-tab="chat"]') as HTMLElement;
      if (chatTab) {
        chatTab.click();
      }
    }, 100);
  };

  const handleOpenDirectChat = () => {
    setShowDirectChat(true);
    closeWidget();
  };

  const handleCloseDirectChat = () => {
    setShowDirectChat(false);
  };

  const handleTransferirParaAgente = (contexto: string, historico: any[]) => {
    console.log('Transferindo para agente:', { contexto, historico });
    setShowDirectChat(false);
    navigate('/suporte');
    setTimeout(() => {
      const chatTab = document.querySelector('[data-tab="chat"]') as HTMLElement;
      if (chatTab) {
        chatTab.click();
      }
    }, 100);
  };

  const handleNavigateToTickets = () => {
    navigate('/suporte');
    closeWidget();
    // Aqui você pode adicionar lógica para abrir diretamente a aba de tickets
    setTimeout(() => {
      const ticketsTab = document.querySelector('[data-tab="tickets"]') as HTMLElement;
      if (ticketsTab) {
        ticketsTab.click();
      }
    }, 100);
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  if (!shouldShowWidget()) return null;

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Widget Principal */}
      <div className="relative">
        {/* Popup de Opções */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden mb-2 animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#159A9C] to-[#0d7a7d] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Headphones className="w-5 h-5" />
                  <h3 className="font-semibold">Como podemos ajudar?</h3>
                </div>
                <button
                  onClick={closeWidget}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-sm text-gray-100">
                  Estamos aqui para você!
                </p>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isAgentOnline ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                  <span className="text-xs text-gray-100">
                    {isAgentOnline ? 'Online' : 'Fora do horário'}
                  </span>
                </div>
              </div>
            </div>

            {/* Opções de Suporte */}
            <div className="p-4 space-y-3">
              {/* Chat Direto com IA */}
              <button
                onClick={handleOpenDirectChat}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-all group"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 flex items-center space-x-1">
                    <span>IA Assistente</span>
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  </p>
                  <p className="text-sm text-gray-600">Chat direto e respostas instantâneas</p>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-xs text-purple-600 font-medium">Novo!</span>
                </div>
              </button>

              {/* Chat com Agente Humano */}
              <button
                onClick={handleNavigateToChat}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-[#159A9C] hover:bg-gray-50 transition-all group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Agente Humano</p>
                  <p className="text-sm text-gray-600">Suporte especializado</p>
                </div>
                <div className="flex items-center space-x-1">
                  <div className={`w-2 h-2 rounded-full ${isAgentOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-green-600 font-medium">
                    {isAgentOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </button>

              {/* Central de Suporte */}
              <button
                onClick={handleNavigateToSupport}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-[#159A9C] hover:bg-gray-50 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Central de Suporte</p>
                  <p className="text-sm text-gray-600">FAQ, tutoriais e mais</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>

              {/* Abrir Ticket */}
              <button
                onClick={handleNavigateToTickets}
                className="w-full flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-[#159A9C] hover:bg-gray-50 transition-all group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900">Abrir Ticket</p>
                  <p className="text-sm text-gray-600">Para questões complexas</p>
                </div>
              </button>

              {/* Linha divisória */}
              <div className="border-t border-gray-200 my-3"></div>

              {/* Contatos de Emergência */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Emergência 24h
                </p>
                
                <div className="flex space-x-2">
                  <a
                    href="tel:+551140028922"
                    className="flex-1 flex items-center justify-center space-x-2 p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-sm font-medium">Ligar</span>
                  </a>
                  
                  <a
                    href="mailto:urgente@conectcrm.com.br"
                    className="flex-1 flex items-center justify-center space-x-2 p-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Email</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Resposta: {averageResponseTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Satisfação: 98%</span>
                  <div className={`w-2 h-2 rounded-full ${isAgentOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botão Flutuante */}
        <button
          onClick={toggleWidget}
          className={`relative w-14 h-14 bg-gradient-to-r from-[#159A9C] to-[#0d7a7d] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
            isOpen ? 'rotate-180' : 'hover:scale-110'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-300" />
          ) : (
            <MessageCircle className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
          )}
          
          {/* Indicador de nova mensagem */}
          {(hasNewMessage || unreadCount > 0) && !isOpen && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              {unreadCount > 0 ? (
                <span className="text-xs font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
            </div>
          )}
          
          {/* Efeito de pulse quando há nova mensagem */}
          {hasNewMessage && !isOpen && (
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></div>
          )}
        </button>

        {/* Tooltip de apresentação */}
        {!isOpen && (
          <div className="absolute bottom-16 right-0 bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <p className="text-sm text-gray-700 font-medium">Precisa de ajuda?</p>
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          </div>
        )}
      </div>

      {/* Chat Direto */}
      {showDirectChat && (
        <div className={`
          fixed z-50 ${
            position === 'bottom-right' 
              ? 'bottom-4 right-4' 
              : 'bottom-4 left-4'
          }
        `}>
          <ChatCompacto
            onClose={handleCloseDirectChat}
            onTransferirParaAgente={handleTransferirParaAgente}
            autoFocus={true}
          />
        </div>
      )}
    </div>
  );
};
