import React, { useState } from 'react';
import { X, Link as LinkIcon, Search, Building2, User, CheckCircle } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';

interface VincularClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (clienteId: string) => void;
  contatoAtual?: {
    nome: string;
    telefone?: string;
    email?: string;
  };
}

export const VincularClienteModal: React.FC<VincularClienteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  contatoAtual
}) => {
  const { currentPalette } = useTheme();
  const [busca, setBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);

  // Mock de clientes
  const clientesMock = [
    { id: '1', nome: 'Empresa ABC Ltda', cnpj: '12.345.678/0001-90', contatos: 5 },
    { id: '2', nome: 'XYZ Comércio', cnpj: '98.765.432/0001-10', contatos: 3 },
    { id: '3', nome: 'Tech Solutions', cnpj: '11.222.333/0001-44', contatos: 8 }
  ];

  const clientesFiltrados = busca
    ? clientesMock.filter(c =>
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.cnpj.includes(busca)
      )
    : clientesMock;

  const handleConfirmar = () => {
    if (!clienteSelecionado) {
      alert('Selecione um cliente');
      return;
    }
    onConfirm(clienteSelecionado.id);
    handleFechar();
  };

  const handleFechar = () => {
    setBusca('');
    setClienteSelecionado(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: `${currentPalette.colors.primary}10` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentPalette.colors.primary, color: 'white' }}
            >
              <LinkIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Vincular Cliente CRM</h2>
              {contatoAtual && (
                <p className="text-sm text-gray-500">Contato: {contatoAtual.nome}</p>
              )}
            </div>
          </div>
          <button onClick={handleFechar} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar cliente por nome ou CNPJ..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {clientesFiltrados.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => setClienteSelecionado(cliente)}
                  className={`w-full px-4 py-3 rounded-lg transition-all text-left ${
                    clienteSelecionado?.id === cliente.id
                      ? 'border-2 shadow-md'
                      : 'border border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: clienteSelecionado?.id === cliente.id ? currentPalette.colors.primary : undefined,
                    backgroundColor: clienteSelecionado?.id === cliente.id ? `${currentPalette.colors.primary}10` : undefined
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-8 h-8" style={{ color: currentPalette.colors.primary }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{cliente.nome}</p>
                      <p className="text-xs text-gray-500">{cliente.cnpj} • {cliente.contatos} contatos</p>
                    </div>
                    {clienteSelecionado?.id === cliente.id && (
                      <CheckCircle className="w-5 h-5" style={{ color: currentPalette.colors.primary }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleFechar}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!clienteSelecionado}
            className="px-6 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: currentPalette.colors.primary }}
          >
            Vincular Cliente
          </button>
        </div>
      </div>
    </div>
  );
};
