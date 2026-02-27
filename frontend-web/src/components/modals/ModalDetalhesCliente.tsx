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
  Globe,
  FileText,
  ClipboardList,
} from 'lucide-react';
import { Cliente, ClienteAttachment } from '../../services/clientesService';
import { AvatarUpload } from '../upload/AvatarUpload';
import { FileUpload } from '../upload/FileUpload';
import { UploadResult } from '../../services/uploadService';

type ClienteNotasResumo = {
  total: number;
  importantes: number;
};

type ClienteDemandasResumo = {
  total: number;
  abertas: number;
  urgentes: number;
};

interface ModalDetalhesClienteProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: Cliente | null;
  onEdit?: (cliente: Cliente) => void;
  onDelete?: (clienteId: string) => void;
  onOpenProfile?: (clienteId: string) => void;
  onAvatarUpdate?: (clienteId: string, avatar: UploadResult) => void;
  onAttachmentAdd?: (clienteId: string, attachment: UploadResult) => void;
  attachments?: ClienteAttachment[];
  attachmentsLoading?: boolean;
  onAttachmentRemove?: (clienteId: string, attachmentId: string) => void;
  notasResumo?: ClienteNotasResumo | null;
  demandasResumo?: ClienteDemandasResumo | null;
  relacionamentosLoading?: boolean;
}

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Nao informado';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return 'Nao informado';
  }

  return parsedDate.toLocaleDateString('pt-BR');
};

const formatCurrency = (value?: number): string => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return 'Nao informado';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
};

const ensureSiteProtocol = (site?: string): string | null => {
  if (!site) {
    return null;
  }

  if (site.startsWith('http://') || site.startsWith('https://')) {
    return site;
  }

  return `https://${site}`;
};

export const ModalDetalhesCliente: React.FC<ModalDetalhesClienteProps> = ({
  isOpen,
  onClose,
  cliente,
  onEdit,
  onDelete,
  onOpenProfile,
  onAvatarUpdate,
  onAttachmentAdd,
  attachments = [],
  attachmentsLoading = false,
  onAttachmentRemove,
  notasResumo = null,
  demandasResumo = null,
  relacionamentosLoading = false,
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

  useEffect(() => {
    if (!isOpen || !cliente) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, cliente]);

  if (!isOpen || !cliente) {
    return null;
  }

  const modalTitleId = `cliente-detalhes-title-${cliente.id}`;
  const tabInfoId = `cliente-detalhes-tab-info-${cliente.id}`;
  const tabAnexosId = `cliente-detalhes-tab-anexos-${cliente.id}`;
  const tabHistoricoId = `cliente-detalhes-tab-historico-${cliente.id}`;
  const panelInfoId = `cliente-detalhes-panel-info-${cliente.id}`;
  const panelAnexosId = `cliente-detalhes-panel-anexos-${cliente.id}`;
  const panelHistoricoId = `cliente-detalhes-panel-historico-${cliente.id}`;
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
  const siteUrl = ensureSiteProtocol(cliente.site);

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

  const getTipoLabel = (tipo: Cliente['tipo']) =>
    tipo === 'pessoa_fisica' ? 'Pessoa Fisica' : 'Pessoa Juridica';

  const handleAvatarChange = (avatar: UploadResult) => {
    onAvatarUpdate?.(cliente.id, avatar);
  };

  const handleAttachmentAdd = (uploadedAttachments: UploadResult[]) => {
    if (uploadedAttachments.length > 0) {
      onAttachmentAdd?.(cliente.id, uploadedAttachments[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      <div className="relative flex min-h-full items-center justify-center p-4 sm:p-6">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalTitleId}
          tabIndex={-1}
          className="relative flex w-full max-w-[1100px] flex-col overflow-hidden rounded-xl border border-[#DCE8EC] bg-white text-left shadow-2xl max-h-[90vh]"
        >
          <div className="sticky top-0 z-10 border-b border-[#E4EDF0] bg-white px-6 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <AvatarUpload
                  currentAvatar={cliente.avatar ?? cliente.avatarUrl}
                  onAvatarChange={handleAvatarChange}
                  size="lg"
                  context={{ clienteId: cliente.id }}
                  className="border-2 border-[#DCE8EC] transition-colors hover:border-[#159A9C]"
                />
                <div className="min-w-0">
                  <h2 id={modalTitleId} className="truncate text-xl font-semibold text-[#19384C]">
                    {cliente.nome}
                  </h2>
                  {cliente.empresa ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-[#607B89]">
                      <Building className="h-4 w-4" />
                      {cliente.empresa}
                    </p>
                  ) : null}
                  {cliente.cargo ? <p className="text-sm text-[#6C8794]">{cliente.cargo}</p> : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getStatusColor(cliente.status)}`}
                >
                  {getStatusLabel(cliente.status)}
                </span>
                <button
                  type="button"
                  onClick={() => onEdit?.(cliente)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                  title="Editar cliente"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete?.(cliente.id)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  title="Excluir cliente"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Fechar modal de detalhes do cliente"
                  onClick={onClose}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div role="tablist" aria-label="Detalhes do cliente" className="mt-4 flex gap-8">
              <button
                id={tabInfoId}
                type="button"
                role="tab"
                aria-selected={activeTab === 'info'}
                aria-controls={panelInfoId}
                onClick={() => setActiveTab('info')}
                className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                  activeTab === 'info'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Informacoes
              </button>
              <button
                id={tabAnexosId}
                type="button"
                role="tab"
                aria-selected={activeTab === 'anexos'}
                aria-controls={panelAnexosId}
                onClick={() => setActiveTab('anexos')}
                className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                  activeTab === 'anexos'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Anexos
              </button>
              <button
                id={tabHistoricoId}
                type="button"
                role="tab"
                aria-selected={activeTab === 'historico'}
                aria-controls={panelHistoricoId}
                onClick={() => setActiveTab('historico')}
                className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                  activeTab === 'historico'
                    ? 'border-[#159A9C] text-[#159A9C]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Historico
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <div
              id={panelInfoId}
              role="tabpanel"
              aria-labelledby={tabInfoId}
              hidden={activeTab !== 'info'}
              className="space-y-6"
            >
              <section className="space-y-3">
                <h3 className="text-base font-semibold text-[#19384C]">Informacoes de contato</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">Email</p>
                    {cliente.email ? (
                      <a
                        href={`mailto:${cliente.email}`}
                        className="inline-flex items-center gap-2 text-sm text-[#159A9C] hover:text-[#0F7B7D]"
                      >
                        <Mail className="h-4 w-4" />
                        {cliente.email}
                      </a>
                    ) : (
                      <p className="text-sm text-[#607B89]">Nao informado</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">Telefone</p>
                    {cliente.telefone ? (
                      <a
                        href={`tel:${cliente.telefone}`}
                        className="inline-flex items-center gap-2 text-sm text-[#159A9C] hover:text-[#0F7B7D]"
                      >
                        <Phone className="h-4 w-4" />
                        {cliente.telefone}
                      </a>
                    ) : (
                      <p className="text-sm text-[#607B89]">Nao informado</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3 md:col-span-2">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">Endereco</p>
                    {cliente.endereco ? (
                      <p className="inline-flex items-center gap-2 text-sm text-[#355061]">
                        <MapPin className="h-4 w-4 text-[#6C8794]" />
                        {cliente.endereco}
                      </p>
                    ) : (
                      <p className="text-sm text-[#607B89]">Nao informado</p>
                    )}
                    <p className="mt-1 text-sm text-[#607B89]">
                      {[cliente.cidade, cliente.estado].filter(Boolean).join(' - ') || 'Cidade nao informada'}
                      {cliente.cep ? ` - CEP ${cliente.cep}` : ''}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-[#19384C]">Perfil comercial</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">Tipo</p>
                    <p className="text-sm text-[#355061]">{getTipoLabel(cliente.tipo)}</p>
                  </div>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">Documento</p>
                    <p className="text-sm text-[#355061]">{cliente.documento || 'Nao informado'}</p>
                  </div>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                      Data de nascimento
                    </p>
                    <p className="text-sm text-[#355061]">{formatDate(cliente.data_nascimento)}</p>
                  </div>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">Genero</p>
                    <p className="text-sm text-[#355061]">{cliente.genero || 'Nao informado'}</p>
                  </div>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">Profissao</p>
                    <p className="text-sm text-[#355061]">{cliente.profissao || 'Nao informado'}</p>
                  </div>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">Renda</p>
                    <p className="text-sm text-[#355061]">{formatCurrency(cliente.renda)}</p>
                  </div>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3 md:col-span-2">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">Site</p>
                    {siteUrl ? (
                      <a
                        href={siteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-[#159A9C] hover:text-[#0F7B7D]"
                      >
                        <Globe className="h-4 w-4" />
                        {cliente.site}
                      </a>
                    ) : (
                      <p className="text-sm text-[#607B89]">Nao informado</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-[#19384C]">Relacionamentos</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                      <FileText className="h-4 w-4" />
                      Notas internas
                    </p>
                    <p className="text-sm text-[#355061]">
                      {relacionamentosLoading
                        ? 'Carregando...'
                        : notasResumo
                          ? `${notasResumo.total} registro(s) - ${notasResumo.importantes} importante(s)`
                          : 'Nao disponivel'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                      <ClipboardList className="h-4 w-4" />
                      Demandas
                    </p>
                    <p className="text-sm text-[#355061]">
                      {relacionamentosLoading
                        ? 'Carregando...'
                        : demandasResumo
                          ? `${demandasResumo.total} total - ${demandasResumo.abertas} abertas`
                          : 'Nao disponivel'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-base font-semibold text-[#19384C]">Observacoes</h3>
                <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                  <p className="whitespace-pre-wrap text-sm text-[#355061]">
                    {cliente.observacoes || 'Nenhuma observacao cadastrada.'}
                  </p>
                </div>
              </section>

              {cliente.tags && cliente.tags.length > 0 ? (
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-[#19384C]">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {cliente.tags.map((tag) => (
                      <span
                        key={`${cliente.id}-${tag}`}
                        className="inline-flex items-center gap-1 rounded-full border border-[#DCE8EC] bg-[#F4F8FA] px-3 py-1 text-xs font-medium text-[#355061]"
                      >
                        <Tag className="h-3.5 w-3.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>

            <div
              id={panelAnexosId}
              role="tabpanel"
              aria-labelledby={tabAnexosId}
              hidden={activeTab !== 'anexos'}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[#19384C]">Arquivos e documentos</h3>
                <FileUpload
                  category="client-attachment"
                  onUploadSuccess={handleAttachmentAdd}
                  multiple={true}
                  compact={false}
                  context={{ clienteId: cliente.id }}
                />
              </div>

              {attachmentsLoading ? (
                <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-6 text-center text-sm text-[#607B89]">
                  Carregando anexos...
                </div>
              ) : attachments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-6 text-center">
                  <Paperclip className="mx-auto mb-2 h-6 w-6 text-[#89A5B3]" />
                  <p className="text-sm font-medium text-[#355061]">
                    Nenhum anexo vinculado a este cliente.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-xl border border-[#DCE8EC] bg-white px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#19384C]">{attachment.nome}</p>
                        <p className="text-xs text-[#6C8794]">
                          {Math.max(0, Number(attachment.tamanho || 0) / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <div className="ml-3 flex items-center gap-2">
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-[#DCE8EC] px-2 py-1 text-xs text-[#355061] transition-colors hover:bg-[#F4F8FA]"
                        >
                          Abrir
                        </a>
                        <button
                          type="button"
                          onClick={() => onAttachmentRemove?.(cliente.id!, attachment.id)}
                          className="rounded-md p-1 text-red-500 transition-colors hover:bg-red-50"
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

            <div
              id={panelHistoricoId}
              role="tabpanel"
              aria-labelledby={tabHistoricoId}
              hidden={activeTab !== 'historico'}
              className="space-y-4"
            >
              <h3 className="text-base font-semibold text-[#19384C]">Historico de atividades</h3>

              <div className="space-y-4">
                {hasValidCreatedAt && createdAt ? (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#19384C]">Cliente cadastrado</p>
                      <p className="text-xs text-[#6C8794]">
                        {createdAt.toLocaleDateString('pt-BR')} as {createdAt.toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ) : null}

                {hasUpdateEvent && updatedAt ? (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Clock3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#19384C]">Cadastro atualizado</p>
                      <p className="text-xs text-[#6C8794]">
                        {updatedAt.toLocaleDateString('pt-BR')} as {updatedAt.toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ) : null}

                {!hasValidCreatedAt && !hasUpdateEvent ? (
                  <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-6 text-center">
                    <Clock3 className="mx-auto mb-2 h-6 w-6 text-[#89A5B3]" />
                    <p className="text-sm font-medium text-[#355061]">
                      Sem historico disponivel para este cliente.
                    </p>
                  </div>
                ) : null}

                <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                    Data de cadastro
                  </p>
                  <p className="text-sm text-[#355061]">{createdAtLabel}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-[#E4EDF0] bg-gray-50 px-6 py-3">
            <div className="flex flex-wrap justify-end gap-3">
              {onOpenProfile ? (
                <button
                  type="button"
                  onClick={() => onOpenProfile(cliente.id)}
                  className="rounded-md border border-[#159A9C]/40 bg-white px-4 py-2 text-sm font-medium text-[#159A9C] transition-colors hover:bg-[#F1FBFA]"
                >
                  Abrir perfil completo
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => onEdit?.(cliente)}
                className="rounded-md border border-transparent bg-[#159A9C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D]"
              >
                Editar cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
