import React, { useState } from 'react';
import ModalCadastroCliente from '../components/modals/ModalCadastroCliente';

export const ExemploModalCliente: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>Abrir Modal Cliente</button>

      <ModalCadastroCliente
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (cliente) => {
          console.log('Cliente salvo:', cliente);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default ExemploModalCliente;
