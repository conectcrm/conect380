import React, { useState } from 'react';
import { Phone, Mail, Edit, Eye, Paperclip } from 'lucide-react';
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
  onView,
  onAvatarUpdate,
  onAttachmentAdd,
}) => {
  const [showAttachments, setShowAttachments] = useState(false);

  const statusLabelMap: Record<string, string> = {
    cliente: 'Cliente',
    prospect: 'Prospect',
    lead: 'Lead',
    inativo: 'Inativo',
  };

  const statusBadgeMap: Record<string, string> = {
    cliente: 'border border-[#BEE4D8] bg-[#ECF7F3] text-[#0F7B7D]',
    prospect: 'border border-[#CFE3EA] bg-[#F1F7FA] text-[#2F7086]',
    lead: 'border border-[#E9DEBF] bg-[#FCF8EB] text-[#9A6B17]',
    inativo: 'border border-[#DCE3E8] bg-[#F5F8FA] text-[#617785]',
  };

  const statusDotMap: Record<string, string> = {
    cliente: 'bg-[#159A9C]',
    prospect: 'bg-[#3B82F6]',
    lead: 'bg-[#D29B2D]',
    inativo: 'bg-[#9AAEB8]',
  };

  const handleAvatarChange = (avatar: UploadResult): void => {
    if (!cliente.id) {
      return;
    }

    onAvatarUpdate?.(cliente.id, avatar);
  };

  const handleAttachmentAdd = (attachments: UploadResult[]): void => {
    if (attachments.length > 0 && cliente.id) {
      onAttachmentAdd?.(cliente.id, attachments[0]);
    }
  };

  const createdAtLabel = cliente.created_at
    ? new Date(cliente.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      })
    : '--';

  return (
    <div
      className="group cursor-pointer rounded-2xl border border-[#DCE7EB] bg-white p-4 transition-[border-color,box-shadow] hover:border-[#BFD7DD] hover:shadow-[0_14px_28px_-20px_rgba(16,57,74,0.38)]"
      onClick={() => onView?.(cliente)}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <AvatarUpload
            currentAvatar={cliente.avatar ?? cliente.avatarUrl}
            onAvatarChange={handleAvatarChange}
            size="sm"
            context={{ clienteId: cliente.id }}
            className="border border-[#D5E2E7] transition-colors group-hover:border-[#AFC9D1]"
          />
          <div
            className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white ${
              statusDotMap[cliente.status] ?? statusDotMap.inativo
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[#1B3B4E]">{cliente.nome}</h3>
          {cliente.empresa && (
            <p className="mt-0.5 truncate text-xs text-[#688391]">{cliente.empresa}</p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView?.(cliente);
            }}
            className="rounded-lg p-1 text-[#7A95A2] transition-colors hover:bg-[#EAF3F6] hover:text-[#159A9C]"
            title="Ver detalhes"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(cliente);
            }}
            className="rounded-lg p-1 text-[#7A95A2] transition-colors hover:bg-[#EAF3F6] hover:text-[#159A9C]"
            title="Editar"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-3 space-y-1.5">
        {cliente.email && (
          <div className="flex items-center text-xs text-[#587481]">
            <Mail className="mr-1.5 h-3 w-3 flex-shrink-0 text-[#8BA1AC]" />
            <span className="truncate">{cliente.email}</span>
          </div>
        )}
        {cliente.telefone && (
          <div className="flex items-center text-xs text-[#587481]">
            <Phone className="mr-1.5 h-3 w-3 flex-shrink-0 text-[#8BA1AC]" />
            <span className="truncate">{cliente.telefone}</span>
          </div>
        )}
      </div>

      {cliente.tags && cliente.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {cliente.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-md border border-[#DCE5EA] bg-[#F7FAFB] px-2 py-0.5 text-[11px] font-medium text-[#607987]"
            >
              {tag}
            </span>
          ))}
          {cliente.tags.length > 2 && (
            <span className="inline-flex items-center rounded-md border border-dashed border-[#CCDCE3] bg-[#FBFDFE] px-2 py-0.5 text-[11px] font-medium text-[#7D93A0]">
              +{cliente.tags.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[#E6EEF2] pt-2.5">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            statusBadgeMap[cliente.status] ?? statusBadgeMap.inativo
          }`}
        >
          {statusLabelMap[cliente.status] ?? cliente.status}
        </span>

        <div className="flex items-center gap-2 text-[11px] text-[#728B97]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAttachments(!showAttachments);
            }}
            className="rounded-md p-1 transition-colors hover:bg-[#EAF3F6] hover:text-[#446776]"
            title="Anexos"
          >
            <Paperclip className="h-3 w-3" />
          </button>

          <span>{createdAtLabel}</span>
        </div>
      </div>

      {showAttachments && (
        <div className="mt-3 border-t border-[#E6EEF2] pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[#4C6977]">Anexos</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAttachments(false);
              }}
              className="rounded-md px-1.5 py-0.5 text-xs text-[#728B97] transition-colors hover:bg-[#EFF5F7] hover:text-[#4C6977]"
            >
              x
            </button>
          </div>

          <FileUpload
            category="client-attachment"
            onUploadSuccess={handleAttachmentAdd}
            multiple={true}
            compact={true}
            context={{ clienteId: cliente.id }}
            className="mb-1"
          />
        </div>
      )}
    </div>
  );
};
