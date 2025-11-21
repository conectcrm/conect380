/**
 * 👤 Cliente Card - Componente de card de cliente com upload de avatar
 */

import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Tag,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Camera,
  Paperclip
} from 'lucide-react';
import { AvatarUpload } from '../upload/AvatarUpload';
import { FileUpload } from '../upload/FileUpload';
import { Cliente } from '../../services/clientesService';
import { UploadResult } from '../../services/uploadService';

interface ClienteCardProps {
  cliente: Cliente;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (clienteId: string) => void;
  onView?: (cliente: Cliente) => void;
  onAvatarUpdate?: (clienteId: string, avatar: UploadResult) => void;
  onAttachmentAdd?: (clienteId: string, attachment: UploadResult) => void;
}

export const ClienteCard: React.FC<ClienteCardProps> = ({
  cliente,
  onEdit,
  onDelete,
  onView,
  onAvatarUpdate,
  onAttachmentAdd
}) => {
  const [showAttachments, setShowAttachments] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cliente': return 'bg-green-100 text-green-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'lead': return 'bg-yellow-100 text-yellow-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'cliente': return 'Cliente';
      case 'prospect': return 'Prospect';
      case 'lead': return 'Lead';
      case 'inativo': return 'Inativo';
      default: return status;
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
    <div
      className="bg-white rounded-lg border border-gray-200 hover:border-[#159A9C] hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer"
      onClick={() => onView?.(cliente)}
    >
      {/* Status Bar */}
      <div className={`h-1 ${cliente.status === 'cliente' ? 'bg-green-500' :
          cliente.status === 'prospect' ? 'bg-blue-500' :
            cliente.status === 'lead' ? 'bg-yellow-500' : 'bg-gray-400'
        }`}></div>

      <div className="p-4">
        {/* Header: Avatar e Nome */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="relative flex-shrink-0">
            <AvatarUpload
              currentAvatar={cliente.avatar ?? cliente.avatarUrl}
              onAvatarChange={handleAvatarChange}
              size="sm"
              className="border-2 border-gray-100 group-hover:border-[#159A9C] transition-colors"
            />
            {/* Status Indicator */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${cliente.status === 'cliente' ? 'bg-green-500' :
                cliente.status === 'prospect' ? 'bg-blue-500' :
                  cliente.status === 'lead' ? 'bg-yellow-500' : 'bg-gray-400'
              }`}></div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#159A9C] transition-colors">
              {cliente.nome}
            </h3>
            {cliente.empresa && (
              <p className="text-xs text-gray-600 truncate mt-0.5">
                {cliente.empresa}
              </p>
            )}
          </div>

          {/* Menu de ações - sempre visível em hover */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView?.(cliente);
              }}
              className="p-1 text-gray-400 hover:text-[#159A9C] hover:bg-[#DEEFE7] rounded transition-colors"
              title="Ver detalhes"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(cliente);
              }}
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Editar"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Informações de Contato Essenciais */}
        <div className="space-y-1 mb-3">
          {cliente.email && (
            <div className="flex items-center text-xs text-gray-600">
              <Mail className="w-3 h-3 mr-1.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{cliente.email}</span>
            </div>
          )}
          {cliente.telefone && (
            <div className="flex items-center text-xs text-gray-600">
              <Phone className="w-3 h-3 mr-1.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{cliente.telefone}</span>
            </div>
          )}
        </div>

        {/* Tags principais (máximo 2) */}
        {cliente.tags && cliente.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {cliente.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {cliente.tags.length > 2 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-dashed border-gray-300">
                +{cliente.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer: Status e Data */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(cliente.status)}`}>
            {getStatusLabel(cliente.status)}
          </span>

          <div className="flex items-center space-x-2 text-xs text-gray-500">
            {/* Indicador de anexos se existirem */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAttachments(!showAttachments);
              }}
              className="p-0.5 hover:text-gray-700 transition-colors"
              title="Anexos"
            >
              <Paperclip className="w-3 h-3" />
            </button>

            <span>
              {new Date(cliente.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit'
              })}
            </span>
          </div>
        </div>

        {/* Seção de Anexos (Expansível) - Simplificada */}
        {showAttachments && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Anexos</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttachments(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <FileUpload
              category="client-attachment"
              onUploadSuccess={handleAttachmentAdd}
              multiple={true}
              compact={true}
              className="mb-2"
            />

            {/* Lista simplificada de anexos */}
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">
                📄 2 docs
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
