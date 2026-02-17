/**
 * 👁️ Modal Detalhes Cliente - Modal completo para visualização de informações detalhadas
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Tag,
  Edit,
  Trash2,
  Paperclip,
  Clock3,
} from 'lucide-react';
import { Cliente, ClienteAttachment } from '../../services/clientesService';
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
  attachments?: ClienteAttachment[];
  attachmentsLoading?: boolean;
  onAttachmentRemove?: (clienteId: string, attachmentId: string) => void;
}

export const ModalDetalhesCliente: React.FC<ModalDetalhesClienteProps> = ({
  isOpen,
  onClose,
  cliente,
  onEdit,
  onDelete,
  onAvatarUpdate,
  onAttachmentAdd,
  attachments = [],
  attachmentsLoading = false,
  onAttachmentRemove,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'anexos' | 'historico'>('info');
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || !cliente) {
      return;
    }

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const frameId = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const container = modalRef.current;
      if (!container) {
        return;
      }

      const focusableSelector =
        'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [contenteditable="true"], [tabindex]:not([tabindex="-1"])';

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => {
        if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
          return false;
        }

        return Boolean(
          element.offsetWidth || element.offsetHeight || element.getClientRects().length,
        );
      });

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (
          !activeElement ||
          activeElement === firstElement ||
          !container.contains(activeElement)
        ) {
          event.preventDefault();
          lastElement.focus();
        }
        return;
      }

      if (!activeElement || activeElement === lastElement || !container.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus?.();
    };
  }, [isOpen, cliente, onClose]);

  if (!isOpen || !cliente) return null;
  const modalTitleId = `cliente-detalhes-title-${cliente.id}`;

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

  const createdAt = cliente.created_at ? new Date(cliente.created_at) : null;
  const updatedAt = cliente.updated_at ? new Date(cliente.updated_at) : null;
  const hasValidCreatedAt = Boolean(createdAt && !Number.isNaN(createdAt.getTime()));
  const createdAtLabel = hasValidCreatedAt
    ? createdAt!.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Nao informado';
  const hasUpdateEvent = Boolean(
    hasValidCreatedAt &&
      updatedAt &&
      !Number.isNaN(updatedAt.getTime()) &&
      updatedAt.getTime() > createdAt.getTime(),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          tabIndex={-1}
          className="inline-block w-[calc(100%-2rem)] sm:w-[700px] md:w-[800px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg"
        >
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <AvatarUpload
                  currentAvatar={cliente.avatar ?? cliente.avatarUrl}
                  onAvatarChange={handleAvatarChange}
                  size="lg"
                  context={{ clienteId: cliente.id }}
                  className="border-2 border-gray-200 hover:border-[#159A9C] transition-colors"
                />
                <div>
                  <h2 id={modalTitleId} className="text-xl font-semibold text-gray-900">
                    {cliente.nome}
                  </h2>
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
                  type="button"
                  onClick={() => onEdit?.(cliente)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar Cliente"
                >
                  <Edit className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete?.(cliente.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir Cliente"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Fechar modal de detalhes do cliente"
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
                      <p className="text-sm text-gray-600">{createdAtLabel}</p>
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
                    context={{ clienteId: cliente.id }}
                  />
                </div>

                {attachmentsLoading ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                    <p className="text-sm text-gray-600">Carregando anexos...</p>
                  </div>
                ) : attachments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                    <Paperclip className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                    <p className="text-sm font-medium text-gray-800">
                      Nenhum anexo vinculado a este cliente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {attachment.nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {Math.max(0, Number(attachment.tamanho || 0) / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Abrir
                          </a>
                          <button
                            type="button"
                            onClick={() => onAttachmentRemove?.(cliente.id!, attachment.id)}
                            className="rounded-md p-1 text-red-500 hover:bg-red-50"
                            title="Remover anexo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'historico' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Historico de Atividades</h3>

                <div className="space-y-4">
                  {hasValidCreatedAt && createdAt && (
                    <div className="flex space-x-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Cliente cadastrado</p>
                        <p className="text-xs text-gray-500">
                          {createdAt.toLocaleDateString('pt-BR')} as{' '}
                          {createdAt.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}

                  {hasUpdateEvent && updatedAt && (
                    <div className="flex space-x-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <Clock3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Cadastro atualizado</p>
                        <p className="text-xs text-gray-500">
                          {updatedAt.toLocaleDateString('pt-BR')} as{' '}
                          {updatedAt.toLocaleTimeString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}

                  {!hasValidCreatedAt && !hasUpdateEvent && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                      <Clock3 className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                      <p className="text-sm font-medium text-gray-800">
                        Sem historico disponivel para este cliente.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                type="button"
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
