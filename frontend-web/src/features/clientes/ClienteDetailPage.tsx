import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  CalendarDays,
  ClipboardList,
  Clock3,
  Edit,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Star,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import ModalNovoContato from '../../components/contatos/ModalNovoContato';
import ModalCadastroCliente from '../../components/modals/ModalCadastroCliente';
import { AvatarUpload } from '../../components/upload/AvatarUpload';
import { FileUpload } from '../../components/upload/FileUpload';
import {
  Card,
  EmptyState,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../components/layout-v2';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import { Cliente, ClienteAttachment, clientesService } from '../../services/clientesService';
import { Contato, contatosService } from '../../services/contatosService';
import { UploadResult } from '../../services/uploadService';

type DemandasResumo = {
  total: number;
  abertas: number;
  urgentes: number;
};

const statusLabelMap: Record<Cliente['status'], string> = {
  cliente: 'Cliente',
  lead: 'Lead',
  prospect: 'Prospect',
  inativo: 'Inativo',
};

const statusClassMap: Record<Cliente['status'], string> = {
  cliente: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  lead: 'border-amber-200 bg-amber-50 text-amber-700',
  prospect: 'border-sky-200 bg-sky-50 text-sky-700',
  inativo: 'border-slate-200 bg-slate-50 text-slate-700',
};

const resolveBaseClientesPath = (pathname: string) =>
  pathname.startsWith('/crm/') ? '/crm/clientes' : '/clientes';

const formatDate = (value?: string): string => {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nao informado';
  return date.toLocaleDateString('pt-BR');
};

const formatDateTime = (value?: string): string => {
  if (!value) return 'Nao informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Nao informado';
  return `${date.toLocaleDateString('pt-BR')} as ${date.toLocaleTimeString('pt-BR')}`;
};

const formatCurrency = (value?: number): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Nao informado';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

const ClienteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useGlobalConfirmation();

  const baseClientesPath = useMemo(
    () => resolveBaseClientesPath(location.pathname),
    [location.pathname],
  );

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [attachments, setAttachments] = useState<ClienteAttachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);
  const [isContatoModalOpen, setIsContatoModalOpen] = useState(false);
  const [contatoSelecionado, setContatoSelecionado] = useState<Contato | undefined>(undefined);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [contatosLoading, setContatosLoading] = useState(false);
  const [contatoActionId, setContatoActionId] = useState<string | null>(null);
  const [notasTotal, setNotasTotal] = useState<number | null>(null);
  const [demandasResumo, setDemandasResumo] = useState<DemandasResumo | null>(null);

  const loadCliente = useCallback(async (clienteId: string): Promise<Cliente> => {
    return clientesService.getClienteById(clienteId);
  }, []);

  const loadAttachments = useCallback(
    async (clienteId: string, silent = false): Promise<ClienteAttachment[]> => {
      try {
        setAttachmentsLoading(true);
        const data = await clientesService.listarAnexosCliente(clienteId);
        setAttachments(data);
        return data;
      } catch (fetchError) {
        console.error('Erro ao carregar anexos do cliente:', fetchError);
        setAttachments([]);
        if (!silent) {
          toast.error('Nao foi possivel carregar os anexos deste cliente.');
        }
        return [];
      } finally {
        setAttachmentsLoading(false);
      }
    },
    [],
  );

  const loadContatos = useCallback(
    async (clienteId: string, silent = false): Promise<Contato[]> => {
      try {
        setContatosLoading(true);
        const data = await contatosService.listarPorCliente(clienteId);
        setContatos(data);
        return data;
      } catch (fetchError) {
        console.error('Erro ao carregar contatos do cliente:', fetchError);
        setContatos([]);
        if (!silent) {
          toast.error('Nao foi possivel carregar os contatos vinculados.');
        }
        return [];
      } finally {
        setContatosLoading(false);
      }
    },
    [],
  );

  const loadRelacionamentos = useCallback(async (clienteId: string): Promise<void> => {
    const [notasResult, demandasResult] = await Promise.all([
      clientesService.contarNotasCliente(clienteId).catch(() => null),
      clientesService.contarDemandasCliente(clienteId).catch(() => null),
    ]);

    setNotasTotal(notasResult?.total ?? null);
    setDemandasResumo(demandasResult ?? null);
  }, []);

  const loadPageData = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError('Cliente invalido.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const clienteData = await loadCliente(id);
      setCliente(clienteData);

      await Promise.all([
        loadAttachments(id, true),
        loadRelacionamentos(id),
        loadContatos(id, true),
      ]);
    } catch (fetchError) {
      console.error('Erro ao carregar perfil do cliente:', fetchError);
      setError('Nao foi possivel carregar os detalhes do cliente.');
      setCliente(null);
      setAttachments([]);
      setContatos([]);
      setNotasTotal(null);
      setDemandasResumo(null);
    } finally {
      setLoading(false);
    }
  }, [id, loadAttachments, loadCliente, loadContatos, loadRelacionamentos]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const handleSaveCliente = async (
    clienteData: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    if (!id) return;

    try {
      setIsEditSaving(true);
      await clientesService.updateCliente(id, clienteData);
      setIsEditModalOpen(false);
      await loadPageData();
      toast.success('Cliente atualizado com sucesso.');
    } catch (saveError) {
      console.error('Erro ao atualizar cliente:', saveError);
      toast.error('Nao foi possivel atualizar o cliente.');
      throw saveError;
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleDeleteCliente = async () => {
    if (!id) return;

    const shouldDelete = await confirm('Tem certeza que deseja excluir este cliente?');
    if (!shouldDelete) return;

    try {
      await clientesService.deleteCliente(id);
      toast.success('Cliente excluido com sucesso.');
      navigate(baseClientesPath);
    } catch (deleteError) {
      console.error('Erro ao excluir cliente:', deleteError);
      toast.error('Nao foi possivel excluir o cliente.');
    }
  };

  const handleAvatarUpdate = (avatar: UploadResult) => {
    setCliente((current) =>
      current
        ? {
            ...current,
            avatar: avatar.url,
            avatarUrl: avatar.url,
            avatar_url: avatar.url,
          }
        : current,
    );
    toast.success('Avatar atualizado com sucesso.');
  };

  const handleAttachmentAdd = async (uploaded: UploadResult[]) => {
    if (!id || uploaded.length === 0) return;
    await loadAttachments(id, true);
    toast.success(`Anexo ${uploaded[0].fileName} adicionado com sucesso.`);
  };

  const handleAttachmentRemove = async (attachmentId: string) => {
    if (!id) return;

    try {
      await clientesService.removerAnexoCliente(id, attachmentId);
      setAttachments((current) => current.filter((item) => item.id !== attachmentId));
      toast.success('Anexo removido com sucesso.');
    } catch (removeError) {
      console.error('Erro ao remover anexo:', removeError);
      toast.error('Nao foi possivel remover este anexo.');
    }
  };

  const handleOpenNovoContato = () => {
    setContatoSelecionado(undefined);
    setIsContatoModalOpen(true);
  };

  const handleOpenEditarContato = (contato: Contato) => {
    setContatoSelecionado(contato);
    setIsContatoModalOpen(true);
  };

  const handleCloseContatoModal = () => {
    setIsContatoModalOpen(false);
    setContatoSelecionado(undefined);
  };

  const handleContatoSalvo = () => {
    if (!id) return;
    void loadContatos(id, true);
  };

  const handleDefinirContatoPrincipal = async (contato: Contato) => {
    if (!id) return;

    try {
      setContatoActionId(contato.id);
      await contatosService.definirPrincipal(contato.id);
      await loadContatos(id, true);
      toast.success('Contato principal atualizado com sucesso.');
    } catch (error) {
      console.error('Erro ao definir contato principal:', error);
      toast.error('Nao foi possivel definir o contato principal.');
    } finally {
      setContatoActionId(null);
    }
  };

  const handleRemoverContato = async (contato: Contato) => {
    if (!id) return;

    const shouldDelete = await confirm(`Tem certeza que deseja remover o contato ${contato.nome}?`);
    if (!shouldDelete) return;

    try {
      setContatoActionId(contato.id);
      await contatosService.remover(contato.id);
      await loadContatos(id, true);
      toast.success('Contato removido com sucesso.');
    } catch (error) {
      console.error('Erro ao remover contato:', error);
      toast.error('Nao foi possivel remover o contato.');
    } finally {
      setContatoActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <SectionCard className="space-y-4 p-4 sm:p-5">
          <LoadingSkeleton lines={5} />
        </SectionCard>
      </div>
    );
  }

  if (error || !cliente || !id) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <SectionCard className="p-4 sm:p-5">
          <EmptyState
            icon={<User className="h-5 w-5" />}
            title="Nao foi possivel abrir o cliente"
            description={error || 'Cliente nao encontrado.'}
            action={
              <Link
                to={baseClientesPath}
                className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para clientes
              </Link>
            }
          />
        </SectionCard>
      </div>
    );
  }

  const tipoLabel = cliente.tipo === 'pessoa_fisica' ? 'Pessoa Fisica' : 'Pessoa Juridica';
  const statusLabel = statusLabelMap[cliente.status] || cliente.status;
  const statusClass = statusClassMap[cliente.status] || statusClassMap.inativo;

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <User className="h-6 w-6 text-[#159A9C]" />
              Perfil do Cliente
            </span>
          }
          description="Visao completa do cliente com dados, anexos e historico do cadastro."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={baseClientesPath}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#CFDDE2] bg-white px-4 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition-colors hover:bg-[#0F7B7D]"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDeleteCliente();
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          }
        />

        <div className="rounded-2xl border border-[#DCE8EC] bg-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <AvatarUpload
                currentAvatar={cliente.avatar ?? cliente.avatarUrl}
                onAvatarChange={handleAvatarUpdate}
                size="lg"
                context={{ clienteId: id }}
                className="border-2 border-[#DCE8EC] hover:border-[#159A9C] transition-colors"
              />
              <div className="min-w-0 space-y-1">
                <h2 className="truncate text-xl font-semibold text-[#19384C]">{cliente.nome}</h2>
                {cliente.empresa ? (
                  <p className="flex items-center gap-1 text-sm text-[#5E7C8C]">
                    <Building className="h-4 w-4" />
                    {cliente.empresa}
                  </p>
                ) : null}
                {cliente.cargo ? <p className="text-sm text-[#5E7C8C]">{cliente.cargo}</p> : null}
              </div>
            </div>

            <span
              className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <InlineStats
          stats={[
            { label: 'Tipo', value: tipoLabel, tone: 'neutral' },
            {
              label: 'Contatos vinculados',
              value: String(contatos.length),
              tone: contatos.length > 0 ? 'accent' : 'neutral',
            },
            {
              label: 'Anexos',
              value: String(attachments.length),
              tone: attachments.length > 0 ? 'accent' : 'neutral',
            },
            {
              label: 'Notas internas',
              value: notasTotal === null ? '--' : String(notasTotal),
              tone: notasTotal && notasTotal > 0 ? 'accent' : 'neutral',
            },
            {
              label: 'Demandas abertas',
              value: demandasResumo === null ? '--' : String(demandasResumo.abertas),
              tone:
                demandasResumo && (demandasResumo.urgentes > 0 || demandasResumo.abertas > 0)
                  ? 'warning'
                  : 'neutral',
            },
          ]}
        />
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="space-y-6 p-4 xl:col-span-2">
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-[#19384C]">Contato</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  E-mail
                </p>
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
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  Telefone
                </p>
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

              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  Documento
                </p>
                <p className="text-sm text-[#355061]">{cliente.documento || 'Nao informado'}</p>
              </div>

              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  Site
                </p>
                {cliente.site ? (
                  <a
                    href={cliente.site}
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold text-[#19384C]">Contatos vinculados</h3>
              <button
                type="button"
                onClick={handleOpenNovoContato}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#CDE0E6] bg-white px-3 text-sm font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
              >
                <Plus className="h-4 w-4" />
                Novo contato
              </button>
            </div>

            {contatosLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" />
                Carregando contatos vinculados...
              </div>
            ) : contatos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                Nenhum contato vinculado a este cliente.
              </div>
            ) : (
              <div className="space-y-2">
                {contatos.map((contatoVinculado) => {
                  const isContatoActionLoading = contatoActionId === contatoVinculado.id;

                  return (
                    <div
                      key={contatoVinculado.id}
                      className="rounded-xl border border-[#DCE8EC] bg-white p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#19384C]">
                              {contatoVinculado.nome}
                            </p>
                            {contatoVinculado.principal ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                <Star className="h-3.5 w-3.5" />
                                Principal
                              </span>
                            ) : null}
                            {contatoVinculado.ativo === false ? (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                                Inativo
                              </span>
                            ) : null}
                          </div>

                          <p className="text-xs text-[#607B89]">
                            {contatoVinculado.cargo || 'Cargo nao informado'}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#355061]">
                            {contatoVinculado.email ? (
                              <a
                                href={`mailto:${contatoVinculado.email}`}
                                className="inline-flex items-center gap-1 text-[#159A9C] hover:text-[#0F7B7D]"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                {contatoVinculado.email}
                              </a>
                            ) : (
                              <span>Sem e-mail</span>
                            )}
                            {contatoVinculado.telefone ? (
                              <a
                                href={`tel:${contatoVinculado.telefone}`}
                                className="inline-flex items-center gap-1 text-[#159A9C] hover:text-[#0F7B7D]"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {contatosService.formatarTelefone(contatoVinculado.telefone)}
                              </a>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditarContato(contatoVinculado)}
                            disabled={isContatoActionLoading}
                            className="rounded-lg border border-[#D4E2E7] px-2.5 py-1 text-xs font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Editar
                          </button>
                          {!contatoVinculado.principal ? (
                            <button
                              type="button"
                              onClick={() => {
                                void handleDefinirContatoPrincipal(contatoVinculado);
                              }}
                              disabled={isContatoActionLoading}
                              className="rounded-lg border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Principal
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              void handleRemoverContato(contatoVinculado);
                            }}
                            disabled={isContatoActionLoading}
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-[#19384C]">Endereco</h3>
            <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
              <p className="inline-flex items-center gap-2 text-sm text-[#355061]">
                <MapPin className="h-4 w-4 text-[#6C8794]" />
                {cliente.endereco || 'Nao informado'}
              </p>
              <p className="mt-2 text-sm text-[#607B89]">
                {cliente.cidade || 'Cidade nao informada'}
                {cliente.estado ? ` - ${cliente.estado}` : ''}
                {cliente.cep ? ` - CEP ${cliente.cep}` : ''}
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-[#19384C]">Dados adicionais</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  Data de nascimento
                </p>
                <p className="text-sm text-[#355061]">{formatDate(cliente.data_nascimento)}</p>
              </div>
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  Genero
                </p>
                <p className="text-sm text-[#355061]">{cliente.genero || 'Nao informado'}</p>
              </div>
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  Profissao
                </p>
                <p className="text-sm text-[#355061]">{cliente.profissao || 'Nao informado'}</p>
              </div>
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  Renda
                </p>
                <p className="text-sm text-[#355061]">{formatCurrency(cliente.renda)}</p>
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
        </Card>

        <Card className="space-y-6 p-4">
          <section className="space-y-3">
            <h3 className="text-base font-semibold text-[#19384C]">Historico</h3>
            <div className="space-y-3">
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  <CalendarDays className="h-4 w-4" />
                  Cadastrado em
                </p>
                <p className="text-sm text-[#355061]">{formatDateTime(cliente.created_at)}</p>
              </div>
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  <Clock3 className="h-4 w-4" />
                  Ultima atualizacao
                </p>
                <p className="text-sm text-[#355061]">{formatDateTime(cliente.updated_at)}</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-[#19384C]">Relacionamentos</h3>
            <div className="space-y-3">
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  <FileText className="h-4 w-4" />
                  Notas internas
                </p>
                <p className="text-sm text-[#355061]">
                  {notasTotal === null ? 'Nao disponivel' : `${notasTotal} registro(s)`}
                </p>
              </div>
              <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  <ClipboardList className="h-4 w-4" />
                  Demandas
                </p>
                <p className="text-sm text-[#355061]">
                  {demandasResumo
                    ? `${demandasResumo.total} total, ${demandasResumo.abertas} abertas`
                    : 'Nao disponivel'}
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-[#19384C]">Tags</h3>
            {cliente.tags && cliente.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {cliente.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full border border-[#D8E8E4] bg-[#EFF7F4] px-2.5 py-1 text-xs font-medium text-[#1A8877]"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#607B89]">Nenhuma tag cadastrada.</p>
            )}
          </section>
        </Card>
      </div>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-[#19384C]">Arquivos e documentos</h3>
          <FileUpload
            category="client-attachment"
            onUploadSuccess={handleAttachmentAdd}
            multiple={true}
            context={{ clienteId: id }}
          />
        </div>

        {attachmentsLoading ? (
          <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-5 text-sm text-[#607B89]">
            Carregando anexos...
          </div>
        ) : attachments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-5 text-sm text-[#607B89]">
            Nenhum anexo vinculado a este cliente.
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCE8EC] bg-white px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#19384C]">{attachment.nome}</p>
                  <p className="text-xs text-[#607B89]">
                    {Math.max(0, Number(attachment.tamanho || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#D4E2E7] px-2.5 py-1 text-xs font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      void handleAttachmentRemove(attachment.id);
                    }}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ModalCadastroCliente
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveCliente}
        cliente={cliente}
        isLoading={isEditSaving}
      />

      <ModalNovoContato
        isOpen={isContatoModalOpen}
        onClose={handleCloseContatoModal}
        onSuccess={handleContatoSalvo}
        contato={contatoSelecionado}
        clienteId={id}
        clienteNome={cliente.nome}
      />
    </div>
  );
};

export default ClienteDetailPage;
