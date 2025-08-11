import React, { useEffect } from 'react';
import { CheckCircle, X, Info, AlertTriangle, XCircle } from 'lucide-react';

export type TipoNotificacao = 'sucesso' | 'info' | 'aviso' | 'erro';

interface NotificacaoSucessoProps {
  isOpen: boolean;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const NotificacaoSucesso: React.FC<NotificacaoSucessoProps> = ({
  isOpen,
  tipo,
  titulo,
  mensagem,
  onClose,
  autoClose = true,
  duration = 3000
}) => {
  // Todos os hooks devem ser chamados antes de qualquer return condicional
  useEffect(() => {
    if (!isOpen || !autoClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, autoClose, duration, onClose]);

  // Criação dinâmica do keyframe CSS
  useEffect(() => {
    if (!isOpen || !autoClose) return;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes progress-shrink-${duration} {
        from { width: 100%; }
        to { width: 0%; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [isOpen, autoClose, duration]);

  // Return condicional deve vir APÓS todos os hooks
  if (!isOpen) return null;

  const getConfig = () => {
    switch (tipo) {
      case 'sucesso':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800',
          messageColor: 'text-green-700'
        };
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          messageColor: 'text-blue-700'
        };
      case 'aviso':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          titleColor: 'text-amber-800',
          messageColor: 'text-amber-700'
        };
      case 'erro':
        return {
          icon: XCircle,
          iconColor: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          messageColor: 'text-red-700'
        };
      default:
        return {
          icon: Info,
          iconColor: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          titleColor: 'text-gray-800',
          messageColor: 'text-gray-700'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 animate-in slide-in-from-right duration-300">
      <div className={`
        ${config.bgColor} ${config.borderColor} ${config.titleColor}
        border rounded-lg shadow-lg p-4
      `}>
        <div className="flex items-start">
          <div className={`flex-shrink-0 w-6 h-6 ${config.iconColor}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${config.titleColor}`}>
              {titulo}
            </h3>
            <p className={`mt-1 text-sm ${config.messageColor}`}>
              {mensagem}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className={`
              ml-4 flex-shrink-0 w-5 h-5 ${config.iconColor} 
              hover:opacity-75 transition-opacity
            `}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {autoClose && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all ease-linear ${
                  tipo === 'sucesso' ? 'bg-green-500' :
                  tipo === 'info' ? 'bg-blue-500' :
                  tipo === 'aviso' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{
                  width: '100%',
                  animation: `progress-shrink-${duration} ${duration}ms linear`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificacaoSucesso;
