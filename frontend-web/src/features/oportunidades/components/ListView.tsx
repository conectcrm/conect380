import React from 'react';
import { Oportunidade, AtualizarOportunidade } from '../../../types/oportunidades/index';
import { List, Eye, Edit, Trash2, User, DollarSign, Calendar } from 'lucide-react';

interface ListViewProps {
  oportunidades: Oportunidade[];
  onVisualizarOportunidade: (oportunidade: Oportunidade) => void;
  onEditarOportunidade: (oportunidade: AtualizarOportunidade) => Promise<Oportunidade | null>;
  onExcluirOportunidade: (id: number) => Promise<boolean>;
}

export const ListView: React.FC<ListViewProps> = ({
  oportunidades,
  onVisualizarOportunidade,
  onEditarOportunidade,
  onExcluirOportunidade
}) => {
  if (oportunidades.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma oportunidade encontrada
        </h3>
        <p className="text-gray-600">
          Tente ajustar os filtros ou criar uma nova oportunidade
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Oportunidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente/Contato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estágio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responsável
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Esperada
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {oportunidades.map((oportunidade) => (
              <tr key={oportunidade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {oportunidade.titulo}
                      </div>
                      <div className="text-sm text-gray-500">
                        {oportunidade.probabilidade}% probabilidade
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {oportunidade.cliente?.nome || oportunidade.nomeContato || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {oportunidade.cliente?.empresa || oportunidade.empresaContato || ''}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-green-600">
                    {oportunidade.valorFormatado}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    oportunidade.estagio === 'won' ? 'bg-green-100 text-green-800' :
                    oportunidade.estagio === 'lost' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {oportunidade.estagio}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="text-sm text-gray-900">
                      {oportunidade.responsavel.nome}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {oportunidade.dataFechamentoEsperado 
                    ? new Date(oportunidade.dataFechamentoEsperado).toLocaleDateString('pt-BR')
                    : 'N/A'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onVisualizarOportunidade(oportunidade)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
