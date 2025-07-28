import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { PropostaCompleta } from '../services/propostasService';
import PropostaActions from './PropostaActions';
import {
  X,
  FileText,
  User,
  Calendar,
  DollarSign,
  Package,
  Percent,
  MapPin,
  Phone,
  Mail,
  Building
} from 'lucide-react';

interface ModalVisualizarPropostaProps {
  isOpen: boolean;
  onClose: () => void;
  proposta: PropostaCompleta | null;
}

const ModalVisualizarProposta: React.FC<ModalVisualizarPropostaProps> = ({
  isOpen,
  onClose,
  proposta
}) => {
  if (!isOpen || !proposta) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status?: string) => {
    const statusColors = {
      'rascunho': 'bg-gray-100 text-gray-800',
      'enviada': 'bg-blue-100 text-blue-800',
      'aprovada': 'bg-green-100 text-green-800',
      'rejeitada': 'bg-red-100 text-red-800'
    };
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status?: string) => {
    const statusText = {
      'rascunho': 'Rascunho',
      'enviada': 'Enviada',
      'aprovada': 'Aprovada',
      'rejeitada': 'Rejeitada'
    };
    return statusText[status as keyof typeof statusText] || 'Indefinido';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-[#159A9C] mr-3" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Proposta #{proposta.numero}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {proposta.titulo || 'Proposta comercial'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(proposta.status)}`}>
              {getStatusText(proposta.status)}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Ações de Compartilhamento */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Compartilhar Proposta
          </h4>
          <PropostaActions
            proposta={proposta}
            onViewProposta={() => { }}
            showLabels={true}
            className="flex-wrap"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações do Cliente */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Informações do Cliente
            </h4>

            <div className="space-y-3">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {proposta.cliente?.nome || 'Nome não informado'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {proposta.cliente?.tipoPessoa === 'juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                  </p>
                </div>
              </div>

              {proposta.cliente?.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{proposta.cliente.email}</span>
                </div>
              )}

              {proposta.cliente?.telefone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{proposta.cliente.telefone}</span>
                </div>
              )}

              {proposta.cliente?.endereco && (
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">
                    {proposta.cliente.endereco}
                    {proposta.cliente.cidade && `, ${proposta.cliente.cidade}`}
                    {proposta.cliente.estado && ` - ${proposta.cliente.estado}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Informações da Proposta */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Detalhes da Proposta
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">{formatCurrency(proposta.subtotal)}</span>
              </div>

              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-base font-semibold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-[#159A9C]">
                  {formatCurrency(proposta.total)}
                </span>
              </div>

              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Válida até: {formatDate(proposta.dataValidade)}
                  </p>
                  <p className="text-xs text-gray-600">
                    Criada em: {proposta.criadaEm ? formatDate(proposta.criadaEm) : 'N/A'}
                  </p>
                </div>
              </div>

              {typeof proposta.vendedor === 'object' && (
                <div className="flex items-center">
                  <Building className="w-4 h-4 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {proposta.vendedor.nome}
                    </p>
                    <p className="text-xs text-gray-600">Vendedor responsável</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Produtos */}
        {proposta.produtos && proposta.produtos.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
              Produtos / Serviços
            </h4>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qtd
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Unit.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Desconto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proposta.produtos.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.produto.nome}
                          </div>
                          {item.produto.descricao && (
                            <div className="text-sm text-gray-500">
                              {item.produto.descricao}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantidade}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.produto.preco)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.desconto}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Observações */}
        {proposta.observacoes && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
              Observações
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {proposta.observacoes}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalVisualizarProposta;
