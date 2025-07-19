import React from 'react';
import { useI18n } from '../../contexts/I18nContext';

const ClientesPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('clients.title')}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="btn-primary">
            {t('clients.add')}
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="card">
          <div className="text-center py-8 text-gray-500">
            Módulo de clientes será implementado aqui com:
            <ul className="mt-4 text-left max-w-md mx-auto space-y-2">
              <li>• Lista de clientes com paginação</li>
              <li>• Filtros por status e tipo</li>
              <li>• Modal para criar/editar clientes</li>
              <li>• Gestão de tags e observações</li>
              <li>• Histórico de interações</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientesPage;
