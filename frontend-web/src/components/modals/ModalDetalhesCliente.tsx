/**
 * 👁️ Modal Detalhes Cliente - Modal completo para visualização de informações detalhadas
 */

import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Tag,
  Calendar,
  Edit,
  Trash2,
  Paperclip,
  Download,
  Eye,
  Star,
  MessageSquare,
} from 'lucide-react';
import { Cliente } from '../../services/clientesService';
import { AvatarUpload } from '../upload/AvatarUpload';
import { FileUpload } from '../upload/FileUpload';
import { UploadResult } from '../../services/uploadService';

interface ModalDetalhesClienteProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (clienteId: string) => void;
  onAvatarUpdate?: (clienteId: string, avatar: UploadResult) => void;
  onAttachmentAdd?: (clienteId: string, attachment: UploadResult) => void;
}

export const ModalDetalhesCliente: React.FC<ModalDetalhesClienteProps> = ({
  isOpen,
  onClose,
  cliente,
  onEdit,
  onDelete,
  onAvatarUpdate,
  onAttachmentAdd,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'anexos' | 'historico'>('info');

  if (!isOpen || !cliente) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cliente':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'prospect':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lead':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inativo':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'cliente':
        return 'Cliente';
      case 'prospect':
        return 'Prospect';
      case 'lead':
        return 'Lead';
      case 'inativo':
        return 'Inativo';
      default:
        return status;
    }
  };

  const handleAvatarChange = (avatar: UploadResult) => {
    onAvatarUpdate?.(cliente.id, avatar);
  };

  const handleAttachmentAdd = (attachments: UploadResult[]) => {
    if (attachments.length > 0) {
      onAttachmentAdd?.(cliente.id, attachments[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-[calc(100%-2rem)] sm:w-[700px] md:w-[800px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <AvatarUpload
                  currentAvatar={cliente.avatar ?? cliente.avatarUrl}
                  onAvatarChange={handleAvatarChange}
                  size="lg"
                  className="border-2 border-gray-200 hover:border-[#159A9C] transition-colors"
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{cliente.nome}</h2>
                  {cliente.empresa && (
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Building className="w-4 h-4 mr-1" />
                      {cliente.empresa}
                    </p>
                  )}
                  {cliente.cargo && <p className="text-sm text-gray-500">{cliente.cargo}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(cliente.status)}`}
                >
                  {getStatusLabel(cliente.status)}
                </span>

                <button
                  onClick={() => onEdit?.(cliente)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar Cliente"
                >
                  <Edit className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
                      onDelete?.(cliente.id);
                      onClose();
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir Cliente"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-8 mt-4">
              <button
                onClick={() => setActiveTab('info')}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Informações
              </button>
              <button
                onClick={() => setActiveTab('anexos')}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'anexos'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Anexos
              </button>
              <button
                onClick={() => setActiveTab('historico')}
                className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'historico'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Histórico
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Informações de Contato */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações de Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cliente.email && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <a
                            href={`mailto:${cliente.email}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {cliente.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {cliente.telefone && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Telefone</p>
                          <a
                            href={`tel:${cliente.telefone}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {cliente.telefone}
                          </a>
                        </div>
                      </div>
                    )}

                    {cliente.endereco && (
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Endereço</p>
                          <p className="text-sm text-gray-600">{cliente.endereco}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {cliente.tags && cliente.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {cliente.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informações Adicionais */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Detalhes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Tipo</p>
                      <p className="text-sm text-gray-600">
                        {cliente.tipo === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </p>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">Data de Cadastro</p>
                      <p className="text-sm text-gray-600">
                        {new Date(cliente.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'anexos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Arquivos e Documentos</h3>
                  <FileUpload
                    category="client-attachment"
                    onUploadSuccess={handleAttachmentAdd}
                    multiple={true}
                    compact={false}
                  />
                </div>

                {/* Lista de anexos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        📄
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">contrato.pdf</p>
                        <p className="text-xs text-gray-500">Adicionado em 15/01/2024</p>
                      </div>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        📊
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">proposta.xlsx</p>
                        <p className="text-xs text-gray-500">Adicionado em 10/01/2024</p>
                      </div>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'historico' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Histórico de Atividades</h3>

                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Cliente cadastrado</p>
                      <p className="text-xs text-gray-500">
                        {new Date(cliente.created_at).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(cliente.created_at).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Informações atualizadas</p>
                      <p className="text-xs text-gray-500">15/01/2024 às 14:30</p>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Documento anexado</p>
                      <p className="text-xs text-gray-500">10/01/2024 às 09:15</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => onEdit?.(cliente)}
                className="px-4 py-2 text-sm font-medium text-white bg-[#159A9C] border border-transparent rounded-md hover:bg-[#0F7B7D] transition-colors"
              >
                Editar Cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
