/**
 * Rotas do Portal do Cliente
 * Configuração de rotas públicas para acesso às propostas
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PortalClienteProposta from '../features/portal/PortalClienteProposta';

const PortalRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rota para formato direto PROP-YYYY-XXXXXX/TOKEN */}
      <Route path="/:propostaNumero/:token" element={<PortalClienteProposta />} />

      {/* Rota original com prefixo "proposta/" */}
      <Route path="/proposta/:propostaNumero/:token" element={<PortalClienteProposta />} />

      {/* Rota alternativa com apenas proposta ID */}
      <Route path="/proposta/:propostaId" element={<PortalClienteProposta />} />

      {/* Rota de fallback */}
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Portal do Cliente</h1>
              <p className="text-gray-600">Link inválido ou proposta não encontrada.</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default PortalRoutes;
