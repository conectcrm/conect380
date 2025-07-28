import React, { useState } from 'react';

const TestModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  console.log('🧪 TestModal render - isOpen:', isOpen);

  if (!isOpen) {
    console.log('🚫 TestModal: isOpen = false, não renderizando');
    return null;
  }

  console.log('✅ TestModal: renderizando modal');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold mb-4">🧪 Modal de Teste</h2>
        <p className="mb-4">Se você está vendo isso, o sistema de modal funciona!</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export const ModalTest = () => {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    console.log('🔔 Botão teste clicado!');
    console.log('📊 Estado atual showModal:', showModal);
    setShowModal(true);
    console.log('✅ setShowModal(true) executado');
  };

  console.log('🧪 ModalTest render - showModal:', showModal);

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">🧪 Teste de Modal Simples</h3>
      <button
        onClick={handleClick}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Abrir Modal Teste
      </button>

      <TestModal
        isOpen={showModal}
        onClose={() => {
          console.log('🔔 Fechando modal teste');
          setShowModal(false);
        }}
      />
    </div>
  );
};

export default ModalTest;
