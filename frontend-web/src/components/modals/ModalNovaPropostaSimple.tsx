import React from 'react';
import { X } from 'lucide-react';

interface ModalNovaPropostaSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onPropostaCriada?: (proposta: any) => void;
}

export const ModalNovaPropostaSimple: React.FC<ModalNovaPropostaSimpleProps> = ({
  isOpen,
  onClose,
  onPropostaCriada,
}) => {
  console.log('🔍 ModalNovaPropostaSimple renderizando, isOpen:', isOpen);

  if (!isOpen) {
    console.log('🚫 Modal simples: isOpen = false, não renderizando');
    return null;
  }

  console.log('✅ Modal simples: isOpen = true, renderizando modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[calc(100%-2rem)] sm:w-[400px] md:w-[450px] lg:w-[500px] xl:w-[500px] max-w-[600px] overflow-hidden">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Nova Proposta - VERSÃO SIMPLES</h2>
            </div>
            <button
              onClick={() => {
                console.log('🔘 Botão fechar clicado');
                onClose();
              }}
              className="text-white hover:text-gray-200 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">🎉 Modal funcionando!</h3>
          <p className="mb-4">
            Se você está vendo este texto, o modal está sendo renderizado corretamente.
          </p>
          <p className="mb-4 text-sm text-gray-600">
            Este é um modal simplificado para testar se o problema é na estrutura básica ou na
            lógica complexa do modal original.
          </p>
          <button
            onClick={() => {
              console.log('🔘 Botão fechar (interno) clicado');
              onClose();
            }}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Fechar Modal
          </button>
        </div>
      </div>
    </div>
  );
};
