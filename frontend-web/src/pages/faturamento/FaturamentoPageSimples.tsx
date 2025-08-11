import React from 'react';

// Componente simples para teste, sem dependências complexas
export const FaturamentoPageSimples: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Módulo de Faturamento
      </h1>
      <p className="text-gray-600">
        Página de faturamento funcionando corretamente.
      </p>
      <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
        <p className="text-green-800">
          ✅ O componente está carregando sem erros!
        </p>
      </div>
    </div>
  );
};

export default FaturamentoPageSimples;
