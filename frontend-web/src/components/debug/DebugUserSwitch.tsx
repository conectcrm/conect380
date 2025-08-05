import React, { useState } from 'react';
import { Settings, Eye, Code } from 'lucide-react';

type PerfilUsuario = 'gestor' | 'admin' | 'vendedor' | 'operacional' | 'financeiro' | 'suporte';

interface DebugModeProps {
  onUserChange: (user: any) => void;
  currentUser: any;
}

export const DebugUserSwitch: React.FC<DebugModeProps> = ({ onUserChange, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDevelopmentMode] = useState(process.env.NODE_ENV === 'development');

  // Não mostrar em produção
  if (!isDevelopmentMode) {
    return null;
  }

  const mockUsers = [
    {
      id: '1',
      nome: 'Admin Sistema',
      email: 'admin@conectcrm.com',
      perfil: 'admin',
      tipo: 'admin',
      role: 'admin'
    },
    {
      id: '2',
      nome: 'João Gestor',
      email: 'gestor@conectcrm.com',
      perfil: 'gestor',
      tipo: 'gestor',
      role: 'gestor'
    },
    {
      id: '3',
      nome: 'Maria Vendedora',
      email: 'vendedora@conectcrm.com',
      perfil: 'vendedor',
      tipo: 'vendedor',
      role: 'vendedor'
    },
    {
      id: '4',
      nome: 'Carlos Operacional',
      email: 'operacional@conectcrm.com',
      perfil: 'operacional',
      tipo: 'operacional',
      role: 'operacional'
    },
    {
      id: '5',
      nome: 'Ana Financeiro',
      email: 'financeiro@conectcrm.com',
      perfil: 'financeiro',
      tipo: 'financeiro',
      role: 'financeiro'
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botão para abrir o debug */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all"
        title="Debug: Trocar usuário"
      >
        <Code className="w-5 h-5" />
      </button>

      {/* Modal de debug */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white border border-gray-200 rounded-lg shadow-xl w-80 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Debug Mode - Trocar Usuário</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Modo desenvolvimento - simular diferentes usuários
            </p>
          </div>

          <div className="p-2">
            {mockUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  onUserChange(user);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left p-3 rounded-lg transition-all mb-1
                  ${currentUser?.id === user.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{user.nome}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    <div className="text-xs font-medium text-blue-600 mt-1">
                      Perfil: {user.perfil}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            ⚠️ Este componente só aparece em desenvolvimento
          </div>
        </div>
      )}

      {/* Overlay para fechar */}
      {isOpen && (
        <div
          className="fixed inset-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DebugUserSwitch;
