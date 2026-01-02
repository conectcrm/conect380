import React from 'react';
import {
  Edit3,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Fornecedor } from '../../../services/fornecedorService';
import { BaseModal } from '../../../components/modals/BaseModal';

interface ModalDetalhesFornecedorProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedor: Fornecedor;
  onEdit: (fornecedor: Fornecedor) => void;
}

export default function ModalDetalhesFornecedor({
  isOpen,
  onClose,
  fornecedor,
  onEdit,
}: ModalDetalhesFornecedorProps) {
  const formatarTelefone = (telefone: string): string => {
    if (!telefone) return '';
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    } else if (numeros.length === 10) {
      return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }
    return telefone;
  };

  const formatarDocumento = (documento: string): string => {
    if (!documento) return '';
    const numeros = documento.replace(/\D/g, '');
    if (numeros.length === 14) {
      return `${numeros.substring(0, 2)}.${numeros.substring(2, 5)}.${numeros.substring(5, 8)}/${numeros.substring(8, 12)}-${numeros.substring(12)}`;
    } else if (numeros.length === 11) {
      return `${numeros.substring(0, 3)}.${numeros.substring(3, 6)}.${numeros.substring(6, 9)}-${numeros.substring(9)}`;
    }
    return documento;
  };

  const formatarCEP = (cep: string): string => {
    if (!cep) return '';
    const numeros = cep.replace(/\D/g, '');
    if (numeros.length === 8) {
      return `${numeros.substring(0, 5)}-${numeros.substring(5)}`;
    }
    return cep;
  };

  const formatarData = (data: string): string => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEditClick = () => {
    onEdit(fornecedor);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Detalhes do Fornecedor" size="large">
      <div className="space-y-6">
        {/* Header com status */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{fornecedor.nome}</h3>
              {fornecedor.razaoSocial && (
                <p className="text-sm text-gray-600">{fornecedor.razaoSocial}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                fornecedor.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {fornecedor.ativo ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              {fornecedor.ativo ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados de Identificação */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Identificação
            </h4>

            {fornecedor.cnpj && (
              <div className="flex items-start space-x-3">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">CNPJ</p>
                  <p className="text-sm text-gray-900">{formatarDocumento(fornecedor.cnpj)}</p>
                </div>
              </div>
            )}

            {fornecedor.cpf && (
              <div className="flex items-start space-x-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">CPF</p>
                  <p className="text-sm text-gray-900">{formatarDocumento(fornecedor.cpf)}</p>
                </div>
              </div>
            )}

            {fornecedor.contato && (
              <div className="flex items-start space-x-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Contato</p>
                  <p className="text-sm text-gray-900">{fornecedor.contato}</p>
                </div>
              </div>
            )}
          </div>

          {/* Dados de Contato */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Contato</h4>

            {fornecedor.email && (
              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">E-mail</p>
                  <p className="text-sm text-gray-900">{fornecedor.email}</p>
                </div>
              </div>
            )}

            {fornecedor.telefone && (
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Telefone</p>
                  <p className="text-sm text-gray-900">{formatarTelefone(fornecedor.telefone)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Endereço */}
        {(fornecedor.endereco || fornecedor.cidade || fornecedor.estado || fornecedor.cep) && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Endereço
            </h4>
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
              <div className="space-y-1">
                {fornecedor.endereco && (
                  <p className="text-sm text-gray-900">
                    {fornecedor.endereco}
                    {fornecedor.numero && `, ${fornecedor.numero}`}
                  </p>
                )}
                {fornecedor.bairro && <p className="text-sm text-gray-600">{fornecedor.bairro}</p>}
                {(fornecedor.cidade || fornecedor.estado) && (
                  <p className="text-sm text-gray-600">
                    {fornecedor.cidade}
                    {fornecedor.cidade && fornecedor.estado && ', '}
                    {fornecedor.estado}
                  </p>
                )}
                {fornecedor.cep && (
                  <p className="text-sm text-gray-600">CEP: {formatarCEP(fornecedor.cep)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Observações */}
        {fornecedor.observacoes && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Observações
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{fornecedor.observacoes}</p>
            </div>
          </div>
        )}

        {/* Informações de Sistema */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Informações do Sistema
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Cadastrado em</p>
                <p className="text-sm text-gray-900">{formatarData(fornecedor.criadoEm)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Última atualização</p>
                <p className="text-sm text-gray-900">{formatarData(fornecedor.atualizadoEm)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleEditClick}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Editar
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
