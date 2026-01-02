import React from 'react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';

export const UsuariosPageSimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackToNucleus
          nucleusName="Administração"
          nucleusPath="/nuclei/administracao"
          currentModuleName="Usuários & Permissões"
        />

        <div className="mt-8">
          <h1 className="text-3xl font-bold text-gray-900">Usuários & Permissões</h1>
          <p className="text-lg text-gray-600 mt-2">
            Esta é a página de gestão de usuários e permissões. Se você está vendo isso, significa
            que a navegação está funcionando corretamente!
          </p>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Status da Página</h2>
          <div className="space-y-2">
            <p>✅ Rota funcionando</p>
            <p>✅ Componente carregado</p>
            <p>✅ BackToNucleus funcionando</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsuariosPageSimple;
