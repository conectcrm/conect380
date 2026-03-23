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
  MessageCircle,
  Phone,
  Plus,
  Star,
  Tag,
  Trash2,
  User,
} from 'lucide-react';
import ModalNovoContato from '../../components/contatos/ModalNovoContato';
import ModalCadastroCliente from '../../components/modals/ModalCadastroCliente';
import ModalPlanoCobranca from '../../components/modals/ModalPlanoCobranca';
import { AvatarUpload } from '../../components/upload/AvatarUpload';
import { FileUpload } from '../../components/upload/FileUpload';
import {
  Card,
  EmptyState,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
} from '../../components/layout-v2';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';
import { isOmnichannelEnabled } from '../../config/featureFlags';
import { useAuth } from '../../hooks/useAuth';
import {
  Cliente,
  ClienteAttachment,
  ClienteContratosResumo,
  ClienteFaturasResumo,
  ClienteOmnichannelContexto,
  ClientePropostasResumo,
  ClienteTicketsResumo,
  clientesService,
} from '../../services/clientesService';
import { Contato, contatosService } from '../../services/contatosService';
import {
  faturamentoService,
  PlanoCobranca as PlanoCobrancaApi,
  StatusPlanoCobranca,
  TipoRecorrencia,
} from '../../services/faturamentoService';
import { UploadResult } from '../../services/uploadService';

type DemandasResumo = {
  total: number;
  abertas: number;
  urgentes: number;
};

type ClientePerfilTab =
  | 'tipo'
  | 'contatos'
  | 'anexos'
  | 'notas'
  | 'demandas'
  | 'tickets'
  | 'propostas'
  | 'contratos'
  | 'recorrencias'
  | 'faturas'
  | 'omnichannel';

type TicketsFiltroTab = 'abertos' | 'resolvidos';
type PropostasFiltroTab = 'pendentes' | 'negociacao' | 'aprovadas' | 'encerradas';
type ContratosFiltroTab = 'pendentes' | 'assinados' | 'encerrados';
type RecorrenciasFiltroTab = 'ativas' | 'pausadas' | 'canceladas' | 'expiradas';
type FaturasFiltroTab = 'pendentes' | 'pagas' | 'vencidas' | 'outras';

const ticketStatusLabelMap: Record<string, string> = {
  FILA: 'Fila',
  EM_ATENDIMENTO: 'Em atendimento',
  ENVIO_ATIVO: 'Envio ativo',
  AGUARDANDO_CLIENTE: 'Aguardando cliente',
  AGUARDANDO_INTERNO: 'Aguardando interno',
  CONCLUIDO: 'Concluido',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado',
};

const ticketStatusClassMap: Record<string, string> = {
  FILA: 'border-amber-200 bg-amber-50 text-amber-700',
  EM_ATENDIMENTO: 'border-sky-200 bg-sky-50 text-sky-700',
  ENVIO_ATIVO: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  AGUARDANDO_CLIENTE: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  AGUARDANDO_INTERNO: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  CONCLUIDO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  ENCERRADO: 'border-slate-200 bg-slate-50 text-slate-700',
  CANCELADO: 'border-rose-200 bg-rose-50 text-rose-700',
};

const propostaStatusLabelMap: Record<string, string> = {
  rascunho: 'Rascunho',
  pendente: 'Pendente',
  enviada: 'Enviada',
  visualizada: 'Visualizada',
  negociacao: 'Negociacao',
  em_negociacao: 'Em negociacao',
  em_analise: 'Em analise',
  aprovada: 'Aprovada',
  contrato_gerado: 'Contrato gerado',
  contrato_assinado: 'Contrato assinado',
  fatura_criada: 'Fatura criada',
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  rejeitada: 'Rejeitada',
  rejeitado: 'Rejeitada',
  cancelada: 'Cancelada',
  perdida: 'Perdida',
  expirada: 'Expirada',
};

const propostaStatusClassMap: Record<string, string> = {
  rascunho: 'border-slate-200 bg-slate-50 text-slate-700',
  pendente: 'border-slate-200 bg-slate-50 text-slate-700',
  enviada: 'border-sky-200 bg-sky-50 text-sky-700',
  visualizada: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  negociacao: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  em_negociacao: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  em_analise: 'border-sky-200 bg-sky-50 text-sky-700',
  aprovada: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  contrato_gerado: 'border-teal-200 bg-teal-50 text-teal-700',
  contrato_assinado: 'border-green-200 bg-green-50 text-green-700',
  fatura_criada: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  aguardando_pagamento: 'border-amber-200 bg-amber-50 text-amber-700',
  pago: 'border-lime-200 bg-lime-50 text-lime-700',
  rejeitada: 'border-rose-200 bg-rose-50 text-rose-700',
  rejeitado: 'border-rose-200 bg-rose-50 text-rose-700',
  cancelada: 'border-rose-200 bg-rose-50 text-rose-700',
  perdida: 'border-rose-200 bg-rose-50 text-rose-700',
  expirada: 'border-orange-200 bg-orange-50 text-orange-700',
};

const normalizeStatusKey = (status?: string): string => {
  return (status || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_');
};

const includesSome = (value: string, terms: string[]): boolean =>
  terms.some((term) => value.includes(term));

const getPropostaBucket = (status?: string): PropostasFiltroTab => {
  const normalized = normalizeStatusKey(status);

  if (!normalized) {
    return 'pendentes';
  }

  if (includesSome(normalized, ['rejeit', 'expir', 'cancel', 'perdid', 'recus', 'nao_aprov'])) {
    return 'encerradas';
  }

  if (
    includesSome(normalized, [
      'aprov',
      'ganh',
      'contrato_gerado',
      'contrato_assinado',
      'fatura_criada',
      'aguardando_pagamento',
      'pago',
      'assinad',
    ])
  ) {
    return 'aprovadas';
  }

  if (
    includesSome(normalized, ['negoci', 'analise', 'revisao', 'contraproposta', 'contra_proposta'])
  ) {
    return 'negociacao';
  }

  return 'pendentes';
};

const contratoStatusLabelMap: Record<string, string> = {
  aguardando_assinatura: 'Aguardando assinatura',
  assinado: 'Assinado',
  cancelado: 'Cancelado',
  expirado: 'Expirado',
};

const contratoStatusClassMap: Record<string, string> = {
  aguardando_assinatura: 'border-amber-200 bg-amber-50 text-amber-700',
  assinado: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  cancelado: 'border-rose-200 bg-rose-50 text-rose-700',
  expirado: 'border-slate-200 bg-slate-50 text-slate-700',
};

const isContratoPendenteStatus = (status?: string): boolean => {
  const normalized = (status || '').toLowerCase();
  return (
    normalized === 'aguardando_assinatura' ||
    normalized === 'pendente' ||
    normalized.includes('aguardando') ||
    normalized.includes('pendente')
  );
};

const isContratoAssinadoStatus = (status?: string): boolean =>
  (status || '').toLowerCase() === 'assinado';

const isContratoEncerradoStatus = (status?: string): boolean => {
  const normalized = (status || '').toLowerCase();
  return normalized === 'cancelado' || normalized === 'expirado' || normalized === 'encerrado';
};

const faturaStatusLabelMap: Record<string, string> = {
  pendente: 'Pendente',
  enviada: 'Enviada',
  paga: 'Paga',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
  parcialmente_paga: 'Parcialmente paga',
};

const faturaStatusClassMap: Record<string, string> = {
  pendente: 'border-amber-200 bg-amber-50 text-amber-700',
  enviada: 'border-sky-200 bg-sky-50 text-sky-700',
  paga: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  vencida: 'border-rose-200 bg-rose-50 text-rose-700',
  cancelada: 'border-slate-200 bg-slate-50 text-slate-700',
  parcialmente_paga: 'border-cyan-200 bg-cyan-50 text-cyan-700',
};

const planoStatusLabelMap: Record<string, string> = {
  [StatusPlanoCobranca.ATIVO]: 'Ativo',
  [StatusPlanoCobranca.PAUSADO]: 'Pausado',
  [StatusPlanoCobranca.CANCELADO]: 'Cancelado',
  [StatusPlanoCobranca.EXPIRADO]: 'Expirado',
};

const planoStatusClassMap: Record<string, string> = {
  [StatusPlanoCobranca.ATIVO]: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  [StatusPlanoCobranca.PAUSADO]: 'border-amber-200 bg-amber-50 text-amber-700',
  [StatusPlanoCobranca.CANCELADO]: 'border-rose-200 bg-rose-50 text-rose-700',
  [StatusPlanoCobranca.EXPIRADO]: 'border-slate-200 bg-slate-50 text-slate-700',
};

const tipoRecorrenciaLabelMap: Record<string, string> = {
  [TipoRecorrencia.MENSAL]: 'Mensal',
  [TipoRecorrencia.TRIMESTRAL]: 'Trimestral',
  [TipoRecorrencia.SEMESTRAL]: 'Semestral',
  [TipoRecorrencia.ANUAL]: 'Anual',
  [TipoRecorrencia.PERSONALIZADO]: 'Personalizado',
};

const isTicketResolvidoStatus = (status?: string): boolean => {
  const normalized = (status || '').toUpperCase();
  return normalized === 'CONCLUIDO' || normalized === 'ENCERRADO' || normalized === 'CANCELADO';
};

const isTicketAbertoStatus = (status?: string): boolean => !isTicketResolvidoStatus(status);

const isFaturaPagaStatus = (status?: string): boolean => {
  const normalized = (status || '').toLowerCase();
  return normalized === 'paga' || normalized === 'parcialmente_paga';
};

const isFaturaPendenteStatus = (status?: string): boolean => {
  const normalized = (status || '').toLowerCase();
  return normalized === 'pendente' || normalized === 'enviada';
};

const isFaturaVencidaStatus = (status?: string): boolean =>
  (status || '').toLowerCase() === 'vencida';

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

const toTimestamp = (value?: string): number => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortByAtualizacaoDesc = <T extends { atualizadoEm?: string }>(itens: T[]): T[] => {
  return [...itens].sort((a, b) => toTimestamp(b.atualizadoEm) - toTimestamp(a.atualizadoEm));
};

const ensureSiteProtocol = (site?: string | null): string | null => {
  if (!site) {
    return null;
  }

  if (site.startsWith('http://') || site.startsWith('https://')) {
    return site;
  }

  return `https://${site}`;
};

const ClienteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { confirm } = useGlobalConfirmation();
  const { user } = useAuth();

  const baseClientesPath = useMemo(
    () => resolveBaseClientesPath(location.pathname),
    [location.pathname],
  );
  const usuarioResponsavelId = String(user?.id || '').trim();

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
  const [ticketsResumo, setTicketsResumo] = useState<ClienteTicketsResumo | null>(null);
  const [propostasResumo, setPropostasResumo] = useState<ClientePropostasResumo | null>(null);
  const [contratosResumo, setContratosResumo] = useState<ClienteContratosResumo | null>(null);
  const [faturasResumo, setFaturasResumo] = useState<ClienteFaturasResumo | null>(null);
  const [contextoOmnichannel, setContextoOmnichannel] = useState<ClienteOmnichannelContexto | null>(
    null,
  );
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [propostasLoading, setPropostasLoading] = useState(false);
  const [contratosLoading, setContratosLoading] = useState(false);
  const [faturasLoading, setFaturasLoading] = useState(false);
  const [contextoLoading, setContextoLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ClientePerfilTab>('tipo');
  const [ticketsFiltroTab, setTicketsFiltroTab] = useState<TicketsFiltroTab>('abertos');
  const [contratosFiltroTab, setContratosFiltroTab] = useState<ContratosFiltroTab>('pendentes');
  const [propostasFiltroTab, setPropostasFiltroTab] = useState<PropostasFiltroTab>('pendentes');
  const [faturasFiltroTab, setFaturasFiltroTab] = useState<FaturasFiltroTab>('pendentes');
  const [planosCobranca, setPlanosCobranca] = useState<PlanoCobrancaApi[]>([]);
  const [planosCobrancaLoading, setPlanosCobrancaLoading] = useState(false);
  const [planosCobrancaTotal, setPlanosCobrancaTotal] = useState<number | null>(null);
  const [recorrenciasFiltroTab, setRecorrenciasFiltroTab] =
    useState<RecorrenciasFiltroTab>('ativas');
  const [isPlanoModalOpen, setIsPlanoModalOpen] = useState(false);
  const [planoAction, setPlanoAction] = useState<{
    id: number;
    action: 'gerar' | 'pausar' | 'reativar' | 'cancelar';
  } | null>(null);

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
    setTicketsLoading(true);
    setPropostasLoading(true);
    setContratosLoading(true);
    setFaturasLoading(true);
    setContextoLoading(isOmnichannelEnabled);

    const [
      notasResult,
      demandasResult,
      ticketsResult,
      propostasResult,
      contratosResult,
      faturasResult,
      contextoResult,
    ] = await Promise.all([
      clientesService.contarNotasCliente(clienteId).catch(() => null),
      clientesService.contarDemandasCliente(clienteId).catch(() => null),
      clientesService.getResumoTicketsCliente(clienteId).catch(() => null),
      clientesService.getResumoPropostasCliente(clienteId, 100).catch(() => null),
      clientesService.getResumoContratosCliente(clienteId).catch(() => null),
      clientesService.getResumoFaturasCliente(clienteId).catch(() => null),
      isOmnichannelEnabled
        ? clientesService.getContextoOmnichannelCliente(clienteId).catch(() => null)
        : Promise.resolve(null),
    ]);

    setNotasTotal(notasResult?.total ?? null);
    setDemandasResumo(demandasResult ?? null);
    setTicketsResumo(ticketsResult ?? null);
    setPropostasResumo(propostasResult ?? null);
    setContratosResumo(contratosResult ?? null);
    setFaturasResumo(faturasResult ?? null);
    setContextoOmnichannel(isOmnichannelEnabled ? (contextoResult ?? null) : null);
    setTicketsLoading(false);
    setPropostasLoading(false);
    setContratosLoading(false);
    setFaturasLoading(false);
    setContextoLoading(false);
  }, []);

  const loadPlanosCobranca = useCallback(
    async (clienteId: string, silent = false): Promise<PlanoCobrancaApi[]> => {
      try {
        setPlanosCobrancaLoading(true);
        const data = await faturamentoService.listarPlanosCobranca({ clienteId });
        const lista = Array.isArray(data) ? data : [];
        setPlanosCobranca(lista);
        setPlanosCobrancaTotal(lista.length);
        return lista;
      } catch (fetchError) {
        console.error('Erro ao carregar recorrencias do cliente:', fetchError);
        setPlanosCobranca([]);
        setPlanosCobrancaTotal(0);
        if (!silent) {
          toast.error('Nao foi possivel carregar as recorrencias deste cliente.');
        }
        return [];
      } finally {
        setPlanosCobrancaLoading(false);
      }
    },
    [],
  );

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
      setTicketsResumo(null);
      setPropostasResumo(null);
      setContratosResumo(null);
      setFaturasResumo(null);
      setContextoOmnichannel(null);
    } finally {
      setLoading(false);
    }
  }, [id, loadAttachments, loadCliente, loadContatos, loadRelacionamentos]);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    setActiveTab('tipo');
    setTicketsFiltroTab('abertos');
    setContratosFiltroTab('pendentes');
    setPropostasFiltroTab('pendentes');
    setFaturasFiltroTab('pendentes');
    setRecorrenciasFiltroTab('ativas');
    setPlanosCobranca([]);
    setPlanosCobrancaTotal(null);
    setIsPlanoModalOpen(false);
    setPlanoAction(null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    if (activeTab !== 'recorrencias') return;
    void loadPlanosCobranca(id);
  }, [activeTab, id, loadPlanosCobranca]);

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

  const handleOpenNovaRecorrencia = () => {
    if (!id) return;
    if (!usuarioResponsavelId) {
      toast.error('Usuario responsavel nao identificado.');
      return;
    }
    setIsPlanoModalOpen(true);
  };

  const handleGerarFaturaPlano = async (plano: PlanoCobrancaApi) => {
    if (!id) return;

    try {
      setPlanoAction({ id: plano.id, action: 'gerar' });
      const fatura = await faturamentoService.gerarFaturaPlanoCobranca(plano.id);
      toast.success('Fatura gerada com sucesso.');
      await loadPlanosCobranca(id, true);
      const query = `clienteId=${encodeURIComponent(id)}&cliente=${encodeURIComponent(
        cliente?.nome || '',
      )}`;
      navigate(`/financeiro/faturamento?faturaId=${String(fatura.id)}&${query}`);
    } catch (error) {
      console.error('Erro ao gerar fatura do plano:', error);
      toast.error('Nao foi possivel gerar a fatura.');
    } finally {
      setPlanoAction(null);
    }
  };

  const handlePausarPlano = async (plano: PlanoCobrancaApi) => {
    if (!id) return;

    const shouldPause = await confirm(`Pausar a recorrencia "${plano.nome}"?`);
    if (!shouldPause) return;

    try {
      setPlanoAction({ id: plano.id, action: 'pausar' });
      await faturamentoService.pausarPlanoCobranca(plano.id);
      toast.success('Recorrencia pausada.');
      await loadPlanosCobranca(id, true);
    } catch (error) {
      console.error('Erro ao pausar recorrencia:', error);
      toast.error('Nao foi possivel pausar a recorrencia.');
    } finally {
      setPlanoAction(null);
    }
  };

  const handleReativarPlano = async (plano: PlanoCobrancaApi) => {
    if (!id) return;

    const shouldReactivate = await confirm(`Reativar a recorrencia "${plano.nome}"?`);
    if (!shouldReactivate) return;

    try {
      setPlanoAction({ id: plano.id, action: 'reativar' });
      await faturamentoService.reativarPlanoCobranca(plano.id);
      toast.success('Recorrencia reativada.');
      await loadPlanosCobranca(id, true);
    } catch (error) {
      console.error('Erro ao reativar recorrencia:', error);
      toast.error('Nao foi possivel reativar a recorrencia.');
    } finally {
      setPlanoAction(null);
    }
  };

  const handleCancelarPlano = async (plano: PlanoCobrancaApi) => {
    if (!id) return;

    const shouldCancel = await confirm(`Cancelar a recorrencia "${plano.nome}"?`);
    if (!shouldCancel) return;

    try {
      setPlanoAction({ id: plano.id, action: 'cancelar' });
      await faturamentoService.cancelarPlanoCobranca(plano.id);
      toast.success('Recorrencia cancelada.');
      await loadPlanosCobranca(id, true);
    } catch (error) {
      console.error('Erro ao cancelar recorrencia:', error);
      toast.error('Nao foi possivel cancelar a recorrencia.');
    } finally {
      setPlanoAction(null);
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
  const clienteQuery = `clienteId=${encodeURIComponent(id)}&cliente=${encodeURIComponent(cliente.nome || '')}`;
  const siteUrl = ensureSiteProtocol(cliente.site);
  const relacionamentoBadge = (notasTotal ?? 0) + (demandasResumo?.abertas ?? 0);
  const ticketsAbertos = sortByAtualizacaoDesc(
    ticketsResumo?.tickets.filter((ticket) => isTicketAbertoStatus(ticket.status)) ?? [],
  );
  const ticketsResolvidos = sortByAtualizacaoDesc(
    ticketsResumo?.tickets.filter((ticket) => isTicketResolvidoStatus(ticket.status)) ?? [],
  );
  const ticketsExibidos = ticketsFiltroTab === 'abertos' ? ticketsAbertos : ticketsResolvidos;

  const propostasPorFiltro = (propostasResumo?.propostas || []).reduce<{
    pendentes: ClientePropostasResumo['propostas'];
    negociacao: ClientePropostasResumo['propostas'];
    aprovadas: ClientePropostasResumo['propostas'];
    encerradas: ClientePropostasResumo['propostas'];
  }>(
    (acc, proposta) => {
      const bucket = getPropostaBucket(proposta.status);
      acc[bucket].push(proposta);
      return acc;
    },
    { pendentes: [], negociacao: [], aprovadas: [], encerradas: [] },
  );

  const sortPropostas = (
    itens: ClientePropostasResumo['propostas'],
  ): ClientePropostasResumo['propostas'] =>
    [...itens].sort((a, b) => toTimestamp(b.atualizadaEm) - toTimestamp(a.atualizadaEm));

  const propostasPendentes = sortPropostas(propostasPorFiltro.pendentes);
  const propostasEmNegociacao = sortPropostas(propostasPorFiltro.negociacao);
  const propostasAprovadas = sortPropostas(propostasPorFiltro.aprovadas);
  const propostasEncerradas = sortPropostas(propostasPorFiltro.encerradas);
  const propostasExibidas =
    propostasFiltroTab === 'pendentes'
      ? propostasPendentes
      : propostasFiltroTab === 'negociacao'
        ? propostasEmNegociacao
        : propostasFiltroTab === 'aprovadas'
          ? propostasAprovadas
          : propostasEncerradas;

  const contratosPendentes = sortByAtualizacaoDesc(
    contratosResumo?.contratos.filter((contrato) => isContratoPendenteStatus(contrato.status)) ??
      [],
  );
  const contratosAssinados = sortByAtualizacaoDesc(
    contratosResumo?.contratos.filter((contrato) => isContratoAssinadoStatus(contrato.status)) ??
      [],
  );
  const contratosEncerrados = sortByAtualizacaoDesc(
    contratosResumo?.contratos.filter((contrato) => isContratoEncerradoStatus(contrato.status)) ??
      [],
  );
  const contratosExibidos =
    contratosFiltroTab === 'pendentes'
      ? contratosPendentes
      : contratosFiltroTab === 'assinados'
        ? contratosAssinados
        : contratosEncerrados;

  const faturasPendentes = sortByAtualizacaoDesc(
    faturasResumo?.faturas.filter((fatura) => isFaturaPendenteStatus(fatura.status)) ?? [],
  );
  const faturasPagas = sortByAtualizacaoDesc(
    faturasResumo?.faturas.filter((fatura) => isFaturaPagaStatus(fatura.status)) ?? [],
  );
  const faturasVencidas = sortByAtualizacaoDesc(
    faturasResumo?.faturas.filter((fatura) => isFaturaVencidaStatus(fatura.status)) ?? [],
  );
  const faturasOutras = sortByAtualizacaoDesc(
    faturasResumo?.faturas.filter(
      (fatura) =>
        !isFaturaPendenteStatus(fatura.status) &&
        !isFaturaPagaStatus(fatura.status) &&
        !isFaturaVencidaStatus(fatura.status),
    ) ?? [],
  );
  const faturasExibidas =
    faturasFiltroTab === 'pendentes'
      ? faturasPendentes
      : faturasFiltroTab === 'pagas'
        ? faturasPagas
        : faturasFiltroTab === 'vencidas'
          ? faturasVencidas
          : faturasOutras;

  const sortPlanosDesc = (itens: PlanoCobrancaApi[]): PlanoCobrancaApi[] => {
    return [...itens].sort((a, b) => {
      const aKey = String(a.updatedAt || a.createdAt || '');
      const bKey = String(b.updatedAt || b.createdAt || '');
      return toTimestamp(bKey) - toTimestamp(aKey);
    });
  };

  const planosAtivos = sortPlanosDesc(
    planosCobranca.filter((plano) => plano.status === StatusPlanoCobranca.ATIVO),
  );
  const planosPausados = sortPlanosDesc(
    planosCobranca.filter((plano) => plano.status === StatusPlanoCobranca.PAUSADO),
  );
  const planosCancelados = sortPlanosDesc(
    planosCobranca.filter((plano) => plano.status === StatusPlanoCobranca.CANCELADO),
  );
  const planosExpirados = sortPlanosDesc(
    planosCobranca.filter((plano) => plano.status === StatusPlanoCobranca.EXPIRADO),
  );

  const planosExibidos =
    recorrenciasFiltroTab === 'ativas'
      ? planosAtivos
      : recorrenciasFiltroTab === 'pausadas'
        ? planosPausados
        : recorrenciasFiltroTab === 'canceladas'
          ? planosCancelados
          : planosExpirados;

  const profileTabs: Array<{
    key: ClientePerfilTab;
    label: string;
    value: string;
    tone: 'neutral' | 'accent' | 'warning';
  }> = [
    { key: 'tipo', label: 'Tipo', value: tipoLabel, tone: 'neutral' },
    {
      key: 'contatos',
      label: 'Contatos vinculados',
      value: String(contatos.length),
      tone: contatos.length > 0 ? 'accent' : 'neutral',
    },
    {
      key: 'anexos',
      label: 'Anexos',
      value: String(attachments.length),
      tone: attachments.length > 0 ? 'accent' : 'neutral',
    },
    {
      key: 'notas',
      label: 'Notas internas',
      value: notasTotal === null ? '--' : String(notasTotal),
      tone: notasTotal && notasTotal > 0 ? 'accent' : 'neutral',
    },
    {
      key: 'demandas',
      label: 'Demandas abertas',
      value: demandasResumo === null ? '--' : String(demandasResumo.abertas),
      tone:
        demandasResumo && (demandasResumo.urgentes > 0 || demandasResumo.abertas > 0)
          ? 'warning'
          : 'neutral',
    },
    {
      key: 'tickets',
      label: 'Tickets',
      value: ticketsResumo === null ? '--' : String(ticketsResumo.total),
      tone: ticketsResumo && ticketsAbertos.length > 0 ? 'warning' : 'neutral',
    },
    {
      key: 'propostas',
      label: 'Propostas',
      value: propostasResumo === null ? '--' : String(propostasResumo.total),
      tone:
        propostasResumo && (propostasPendentes.length > 0 || propostasEmNegociacao.length > 0)
          ? 'warning'
          : 'neutral',
    },
    {
      key: 'contratos',
      label: 'Contratos',
      value: contratosResumo === null ? '--' : String(contratosResumo.total),
      tone: contratosResumo && contratosResumo.pendentes > 0 ? 'warning' : 'neutral',
    },
    {
      key: 'recorrencias',
      label: 'Recorrencias',
      value: planosCobrancaTotal === null ? '--' : String(planosCobrancaTotal),
      tone:
        typeof planosCobrancaTotal === 'number' && planosCobrancaTotal > 0 ? 'accent' : 'neutral',
    },
    {
      key: 'faturas',
      label: 'Faturas',
      value: faturasResumo === null ? '--' : String(faturasResumo.total),
      tone:
        faturasResumo && (faturasPendentes.length > 0 || faturasVencidas.length > 0)
          ? 'warning'
          : 'neutral',
    },
  ];

  if (isOmnichannelEnabled) {
    profileTabs.push({
      key: 'omnichannel',
      label: 'Segmento omnichannel',
      value: contextoOmnichannel?.cliente?.segmento || '--',
      tone:
        (contextoOmnichannel?.cliente?.segmento || '').toUpperCase() === 'VIP' ||
        relacionamentoBadge > 0
          ? 'accent'
          : 'neutral',
    });
  }

  const showContatoSection = activeTab === 'tipo';
  const showContatosSection = activeTab === 'contatos';
  const showEnderecoSection = activeTab === 'tipo';
  const showDadosAdicionaisSection = activeTab === 'tipo';
  const showObservacoesSection = activeTab === 'tipo';
  const showHistoricoSection = activeTab === 'tipo';
  const showNotasSection = activeTab === 'notas';
  const showDemandasSection = activeTab === 'demandas';
  const showResumoOmnichannelSection = isOmnichannelEnabled && activeTab === 'omnichannel';
  const showRelacionamentosSection =
    showNotasSection || showDemandasSection || showResumoOmnichannelSection;
  const showHistoricoOmnichannelSection = isOmnichannelEnabled && activeTab === 'omnichannel';
  const showTicketsSection = activeTab === 'tickets';
  const showPropostasSection = activeTab === 'propostas';
  const showContratosSection = activeTab === 'contratos';
  const showRecorrenciasSection = activeTab === 'recorrencias';
  const showFaturasSection = activeTab === 'faturas';
  const showTagsSection = activeTab === 'tipo';
  const showAnexosCard = activeTab === 'anexos';

  const showLeftCard =
    showContatoSection ||
    showContatosSection ||
    showEnderecoSection ||
    showDadosAdicionaisSection ||
    showObservacoesSection;
  const showRightCard =
    showHistoricoSection ||
    showRelacionamentosSection ||
    showHistoricoOmnichannelSection ||
    showTicketsSection ||
    showPropostasSection ||
    showContratosSection ||
    showRecorrenciasSection ||
    showFaturasSection ||
    showTagsSection;

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
          description="Visao 360 do cliente com dados cadastrais, relacionamento e historico comercial."
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
                <p className="text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                  {tipoLabel}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex h-8 items-center rounded-full border px-3 text-sm font-medium ${statusClass}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#DCE8EC] bg-white">
          <div className="flex overflow-x-auto px-2">
            {profileTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const valueClass =
                tab.tone === 'warning'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : tab.tone === 'accent'
                    ? 'bg-[#EAF8F8] text-[#0F7B7D] border-[#BFE8E8]'
                    : 'bg-[#F2F7F9] text-[#4F6C7A] border-[#DCE8EC]';

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-[#159A9C] text-[#0F7B7D]'
                      : 'border-transparent text-[#607B89] hover:border-[#CDE0E6] hover:text-[#355061]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex min-w-[24px] items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${valueClass}`}
                  >
                    {tab.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {showLeftCard || showRightCard ? (
        <div
          className={`grid grid-cols-1 gap-4 ${
            showLeftCard && showRightCard ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : ''
          }`}
        >
          {showLeftCard ? (
            <Card className="space-y-6 p-4">
              {showContatoSection ? (
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
                      <p className="text-sm text-[#355061]">
                        {cliente.documento || 'Nao informado'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                        Site
                      </p>
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
              ) : null}

              {showContatosSection ? (
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
              ) : null}

              {showEnderecoSection ? (
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
              ) : null}

              {showDadosAdicionaisSection ? (
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-[#19384C]">Dados adicionais</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                        Data de nascimento
                      </p>
                      <p className="text-sm text-[#355061]">
                        {formatDate(cliente.data_nascimento)}
                      </p>
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
                      <p className="text-sm text-[#355061]">
                        {cliente.profissao || 'Nao informado'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                        Renda
                      </p>
                      <p className="text-sm text-[#355061]">{formatCurrency(cliente.renda)}</p>
                    </div>
                  </div>
                </section>
              ) : null}

              {showDadosAdicionaisSection ? (
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-[#19384C]">Dados comerciais</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                        Origem
                      </p>
                      <p className="inline-flex items-center gap-2 text-sm text-[#355061]">
                        <Tag className="h-4 w-4 text-[#6C8794]" />
                        {cliente.origem || 'Nao informada'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                        Responsavel ID
                      </p>
                      <p className="inline-flex items-center gap-2 break-all text-sm text-[#355061]">
                        <User className="h-4 w-4 text-[#6C8794]" />
                        {cliente.responsavel_id || cliente.responsavelId || 'Nao informado'}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {showObservacoesSection ? (
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-[#19384C]">Observacoes</h3>
                  <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                    <p className="whitespace-pre-wrap text-sm text-[#355061]">
                      {cliente.observacoes || 'Nenhuma observacao cadastrada.'}
                    </p>
                  </div>
                </section>
              ) : null}
            </Card>
          ) : null}

          {showRightCard ? (
            <Card
              className={`space-y-6 p-4 ${showLeftCard ? 'xl:sticky xl:top-24 xl:self-start' : ''}`}
            >
              {showHistoricoSection ? (
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
                    <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                      <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                        <Phone className="h-4 w-4" />
                        Ultimo contato
                      </p>
                      <p className="text-sm text-[#355061]">
                        {formatDateTime(cliente.ultimo_contato || undefined)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                      <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                        <CalendarDays className="h-4 w-4" />
                        Proximo contato
                      </p>
                      <p className="text-sm text-[#355061]">
                        {formatDateTime(cliente.proximo_contato || undefined)}
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}

              {showRelacionamentosSection ? (
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-[#19384C]">Relacionamentos</h3>
                  <div className="space-y-3">
                    {showNotasSection ? (
                      <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                        <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                          <FileText className="h-4 w-4" />
                          Notas internas
                        </p>
                        <p className="text-sm text-[#355061]">
                          {notasTotal === null ? 'Nao disponivel' : `${notasTotal} registro(s)`}
                        </p>
                      </div>
                    ) : null}

                    {showDemandasSection ? (
                      <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                        <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                          <ClipboardList className="h-4 w-4" />
                          Demandas
                        </p>
                        <p className="text-sm text-[#355061]">
                          {demandasResumo
                            ? `${demandasResumo.total} total, ${demandasResumo.abertas} abertas e ${demandasResumo.urgentes} urgentes`
                            : 'Nao disponivel'}
                        </p>
                      </div>
                    ) : null}

                    {showResumoOmnichannelSection ? (
                      <div className="rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3">
                        <p className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#6C8794]">
                          <MessageCircle className="h-4 w-4" />
                          Contexto omnichannel
                        </p>
                        {contextoLoading ? (
                          <p className="text-sm text-[#607B89]">
                            Carregando contexto omnichannel...
                          </p>
                        ) : contextoOmnichannel ? (
                          <>
                            <p className="text-sm text-[#355061]">
                              Segmento {contextoOmnichannel.cliente.segmento}, avaliacao media{' '}
                              {contextoOmnichannel.estatisticas.avaliacaoMedia.toFixed(1)} e tempo
                              medio {contextoOmnichannel.estatisticas.tempoMedioResposta}.
                            </p>
                            <p className="mt-1 text-xs text-[#607B89]">
                              {contextoOmnichannel.estatisticas.ticketsAbertos} ticket(s) aberto(s),{' '}
                              {contextoOmnichannel.estatisticas.ticketsResolvidos} resolvido(s) e
                              ultimo contato em{' '}
                              {formatDateTime(contextoOmnichannel.cliente.ultimoContato)}.
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-[#607B89]">Nao disponivel</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {showHistoricoOmnichannelSection ? (
                <section className="space-y-3">
                  <h3 className="text-base font-semibold text-[#19384C]">Historico omnichannel</h3>

                  {contextoLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" />
                      Carregando historico omnichannel...
                    </div>
                  ) : !contextoOmnichannel || contextoOmnichannel.historico.tickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      Nenhum evento omnichannel recente encontrado para este cliente.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contextoOmnichannel.historico.tickets.slice(0, 3).map((ticket) => {
                        const statusChave = (ticket.status || '').toUpperCase();
                        const statusLabel = ticketStatusLabelMap[statusChave] || ticket.status;
                        const statusClass =
                          ticketStatusClassMap[statusChave] ||
                          'border-slate-200 bg-slate-50 text-slate-700';

                        return (
                          <div
                            key={ticket.id}
                            className="rounded-xl border border-[#DCE8EC] bg-white p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  to={`/atendimento/tickets/${ticket.id}`}
                                  className="text-sm font-semibold text-[#159A9C] hover:text-[#0F7B7D]"
                                >
                                  {ticket.numero ? `#${ticket.numero}` : 'Ticket'} -{' '}
                                  {ticket.assunto || 'Sem assunto'}
                                </Link>
                                <p className="mt-1 text-xs text-[#607B89]">
                                  Criado em {formatDateTime(ticket.criadoEm)}
                                  {ticket.canalId ? ` - Canal ${ticket.canalId}` : ''}
                                </p>
                              </div>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : null}

              {showTicketsSection ? (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#19384C]">Tickets</h3>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-lg border border-[#DCE8EC] bg-[#F8FCFD] p-1">
                        <button
                          type="button"
                          onClick={() => setTicketsFiltroTab('abertos')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            ticketsFiltroTab === 'abertos'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Abertos
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                            {ticketsAbertos.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTicketsFiltroTab('resolvidos')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            ticketsFiltroTab === 'resolvidos'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Resolvidos
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">
                            {ticketsResolvidos.length}
                          </span>
                        </button>
                      </div>

                      <Link
                        to={`/atendimento/tickets?${clienteQuery}`}
                        className="rounded-lg border border-[#D4E2E7] px-2.5 py-1 text-xs font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
                      >
                        Abrir atendimento
                      </Link>
                    </div>
                  </div>

                  {ticketsLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" />
                      Carregando tickets...
                    </div>
                  ) : !ticketsResumo || ticketsExibidos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      {ticketsFiltroTab === 'abertos'
                        ? 'Nenhum ticket aberto para este cliente.'
                        : 'Nenhum ticket resolvido para este cliente.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ticketsExibidos.map((ticket) => {
                        const statusLabel = ticketStatusLabelMap[ticket.status] || ticket.status;
                        const statusClass =
                          ticketStatusClassMap[ticket.status] ||
                          'border-slate-200 bg-slate-50 text-slate-700';

                        return (
                          <div
                            key={ticket.id}
                            className="rounded-xl border border-[#DCE8EC] bg-white p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  to={`/atendimento/tickets/${ticket.id}`}
                                  className="text-sm font-semibold text-[#159A9C] hover:text-[#0F7B7D]"
                                >
                                  {ticket.numero ? `#${ticket.numero}` : 'Ticket'} -{' '}
                                  {ticket.assunto || 'Sem assunto'}
                                </Link>
                                <p className="mt-1 text-xs text-[#607B89]">
                                  Atualizado em {formatDateTime(ticket.atualizadoEm)}
                                </p>
                              </div>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : null}

              {showPropostasSection ? (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#19384C]">Propostas</h3>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-lg border border-[#DCE8EC] bg-[#F8FCFD] p-1">
                        <button
                          type="button"
                          onClick={() => setPropostasFiltroTab('pendentes')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            propostasFiltroTab === 'pendentes'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Pendentes
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                            {propostasPendentes.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPropostasFiltroTab('negociacao')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            propostasFiltroTab === 'negociacao'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Negociacao
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[11px] text-sky-700">
                            {propostasEmNegociacao.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPropostasFiltroTab('aprovadas')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            propostasFiltroTab === 'aprovadas'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Aprovadas
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">
                            {propostasAprovadas.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPropostasFiltroTab('encerradas')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            propostasFiltroTab === 'encerradas'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Encerradas
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-700">
                            {propostasEncerradas.length}
                          </span>
                        </button>
                      </div>

                      <Link
                        to={`/vendas/propostas?${clienteQuery}`}
                        className="rounded-lg border border-[#D4E2E7] px-2.5 py-1 text-xs font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
                      >
                        Abrir propostas
                      </Link>
                    </div>
                  </div>

                  {propostasLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" />
                      Carregando propostas...
                    </div>
                  ) : !propostasResumo ? (
                    <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/40 p-3 text-sm text-amber-800">
                      Nao foi possivel carregar as propostas deste cliente agora. Tente atualizar a
                      pagina ou clique em &quot;Abrir propostas&quot; para validar a listagem
                      completa.
                    </div>
                  ) : propostasExibidas.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      {propostasFiltroTab === 'pendentes'
                        ? 'Nenhuma proposta pendente para este cliente.'
                        : propostasFiltroTab === 'negociacao'
                          ? 'Nenhuma proposta em negociacao para este cliente.'
                          : propostasFiltroTab === 'aprovadas'
                            ? 'Nenhuma proposta aprovada para este cliente.'
                            : 'Nenhuma proposta encerrada para este cliente.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {propostasExibidas.map((proposta) => {
                        const statusNormalizado = normalizeStatusKey(proposta.status);
                        const statusLabel =
                          propostaStatusLabelMap[statusNormalizado] ||
                          proposta.status ||
                          'Sem status';
                        const statusClass =
                          propostaStatusClassMap[statusNormalizado] ||
                          'border-slate-200 bg-slate-50 text-slate-700';

                        return (
                          <div
                            key={proposta.id}
                            className="rounded-xl border border-[#DCE8EC] bg-white p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  to={`/vendas/propostas?proposta=${proposta.id}&${clienteQuery}`}
                                  className="text-sm font-semibold text-[#159A9C] hover:text-[#0F7B7D]"
                                >
                                  {proposta.numero || 'Proposta'} -{' '}
                                  {proposta.titulo || 'Sem titulo'}
                                </Link>
                                <p className="mt-1 text-xs text-[#607B89]">
                                  Atualizada em {formatDateTime(proposta.atualizadaEm)}
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#355061]">
                                  Valor: {formatCurrency(proposta.valor)}
                                </p>
                              </div>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : null}

              {showContratosSection ? (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#19384C]">Contratos</h3>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-lg border border-[#DCE8EC] bg-[#F8FCFD] p-1">
                        <button
                          type="button"
                          onClick={() => setContratosFiltroTab('pendentes')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            contratosFiltroTab === 'pendentes'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Pendentes
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                            {contratosPendentes.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setContratosFiltroTab('assinados')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            contratosFiltroTab === 'assinados'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Assinados
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">
                            {contratosAssinados.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setContratosFiltroTab('encerrados')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            contratosFiltroTab === 'encerrados'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Encerrados
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-700">
                            {contratosEncerrados.length}
                          </span>
                        </button>
                      </div>

                      <Link
                        to={`/contratos?${clienteQuery}`}
                        className="rounded-lg border border-[#D4E2E7] px-2.5 py-1 text-xs font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
                      >
                        Abrir contratos
                      </Link>
                    </div>
                  </div>

                  {contratosLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" />
                      Carregando contratos...
                    </div>
                  ) : !contratosResumo || contratosExibidos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      {contratosFiltroTab === 'pendentes'
                        ? 'Nenhum contrato pendente para este cliente.'
                        : contratosFiltroTab === 'assinados'
                          ? 'Nenhum contrato assinado para este cliente.'
                          : 'Nenhum contrato encerrado para este cliente.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contratosExibidos.map((contrato) => {
                        const statusNormalizado = (contrato.status || '').toLowerCase();
                        const statusLabel =
                          contratoStatusLabelMap[statusNormalizado] ||
                          contrato.status ||
                          'Sem status';
                        const statusClass =
                          contratoStatusClassMap[statusNormalizado] ||
                          'border-slate-200 bg-slate-50 text-slate-700';

                        return (
                          <div
                            key={contrato.id}
                            className="rounded-xl border border-[#DCE8EC] bg-white p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  to={`/contratos/${contrato.id}`}
                                  className="text-sm font-semibold text-[#159A9C] hover:text-[#0F7B7D]"
                                >
                                  {contrato.numero || `Contrato ${contrato.id}`} - {contrato.tipo}
                                </Link>
                                <p className="mt-1 text-xs text-[#607B89]">
                                  Vigencia: {formatDate(contrato.dataInicio)} ate{' '}
                                  {formatDate(contrato.dataFim)}
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#355061]">
                                  Valor: {formatCurrency(contrato.valorTotal)}
                                </p>
                              </div>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : null}

              {showRecorrenciasSection ? (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#19384C]">Recorrencias</h3>
                    <button
                      type="button"
                      onClick={handleOpenNovaRecorrencia}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0F7B7D]"
                    >
                      <Plus className="h-4 w-4" />
                      Nova
                    </button>
                  </div>

                  <div className="inline-flex items-center rounded-lg border border-[#DCE8EC] bg-[#F8FCFD] p-1">
                    <button
                      type="button"
                      onClick={() => setRecorrenciasFiltroTab('ativas')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        recorrenciasFiltroTab === 'ativas'
                          ? 'bg-white text-[#0F7B7D] shadow-sm'
                          : 'text-[#607B89] hover:text-[#355061]'
                      }`}
                    >
                      Ativas
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">
                        {planosAtivos.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecorrenciasFiltroTab('pausadas')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        recorrenciasFiltroTab === 'pausadas'
                          ? 'bg-white text-[#0F7B7D] shadow-sm'
                          : 'text-[#607B89] hover:text-[#355061]'
                      }`}
                    >
                      Pausadas
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                        {planosPausados.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecorrenciasFiltroTab('canceladas')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        recorrenciasFiltroTab === 'canceladas'
                          ? 'bg-white text-[#0F7B7D] shadow-sm'
                          : 'text-[#607B89] hover:text-[#355061]'
                      }`}
                    >
                      Canceladas
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[11px] text-rose-700">
                        {planosCancelados.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecorrenciasFiltroTab('expiradas')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                        recorrenciasFiltroTab === 'expiradas'
                          ? 'bg-white text-[#0F7B7D] shadow-sm'
                          : 'text-[#607B89] hover:text-[#355061]'
                      }`}
                    >
                      Expiradas
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-700">
                        {planosExpirados.length}
                      </span>
                    </button>
                  </div>

                  {planosCobrancaLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" />
                      Carregando recorrencias...
                    </div>
                  ) : planosExibidos.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      {recorrenciasFiltroTab === 'ativas'
                        ? 'Nenhuma recorrencia ativa para este cliente.'
                        : recorrenciasFiltroTab === 'pausadas'
                          ? 'Nenhuma recorrencia pausada para este cliente.'
                          : recorrenciasFiltroTab === 'canceladas'
                            ? 'Nenhuma recorrencia cancelada para este cliente.'
                            : 'Nenhuma recorrencia expirada para este cliente.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {planosExibidos.map((plano) => {
                        const statusLabel =
                          planoStatusLabelMap[plano.status] || plano.status || 'Sem status';
                        const statusClass =
                          planoStatusClassMap[plano.status] ||
                          'border-slate-200 bg-slate-50 text-slate-700';
                        const periodicidade =
                          tipoRecorrenciaLabelMap[plano.tipoRecorrencia] ||
                          plano.tipoRecorrencia ||
                          'Recorrencia';
                        const isActing = planoAction?.id === plano.id;

                        return (
                          <div
                            key={plano.id}
                            className="rounded-xl border border-[#DCE8EC] bg-white p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  to={`/contratos/${String(plano.contratoId)}`}
                                  className="text-sm font-semibold text-[#159A9C] hover:text-[#0F7B7D]"
                                >
                                  {plano.nome || `Recorrencia ${plano.id}`}
                                </Link>
                                <p className="mt-1 text-xs text-[#607B89]">
                                  {periodicidade} • Vence dia {plano.diaVencimento} • Proxima:{' '}
                                  {formatDate(plano.proximaCobranca || undefined)}
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#355061]">
                                  Valor: {formatCurrency(plano.valorRecorrente)}
                                </p>
                              </div>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                              >
                                {statusLabel}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              {plano.status === StatusPlanoCobranca.ATIVO ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void handleGerarFaturaPlano(plano);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#D4E2E7] px-2.5 py-1 text-xs font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC] disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={isActing}
                                  >
                                    {isActing && planoAction?.action === 'gerar' ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#159A9C]" />
                                    ) : null}
                                    Gerar fatura
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void handlePausarPlano(plano);
                                    }}
                                    className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    disabled={isActing}
                                  >
                                    {isActing && planoAction?.action === 'pausar' ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-700" />
                                    ) : null}
                                    Pausar
                                  </button>
                                </>
                              ) : null}

                              {plano.status === StatusPlanoCobranca.PAUSADO ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleReativarPlano(plano);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  disabled={isActing}
                                >
                                  {isActing && planoAction?.action === 'reativar' ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                                  ) : null}
                                  Reativar
                                </button>
                              ) : null}

                              {plano.status !== StatusPlanoCobranca.CANCELADO &&
                              plano.status !== StatusPlanoCobranca.EXPIRADO ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleCancelarPlano(plano);
                                  }}
                                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-800 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                  disabled={isActing}
                                >
                                  {isActing && planoAction?.action === 'cancelar' ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-red-700" />
                                  ) : null}
                                  Cancelar
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : null}

              {showFaturasSection ? (
                <section className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-semibold text-[#19384C]">Faturas</h3>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-lg border border-[#DCE8EC] bg-[#F8FCFD] p-1">
                        <button
                          type="button"
                          onClick={() => setFaturasFiltroTab('pendentes')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            faturasFiltroTab === 'pendentes'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Pendentes
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700">
                            {faturasPendentes.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFaturasFiltroTab('pagas')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            faturasFiltroTab === 'pagas'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Pagas
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">
                            {faturasPagas.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFaturasFiltroTab('vencidas')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            faturasFiltroTab === 'vencidas'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Vencidas
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[11px] text-rose-700">
                            {faturasVencidas.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFaturasFiltroTab('outras')}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                            faturasFiltroTab === 'outras'
                              ? 'bg-white text-[#0F7B7D] shadow-sm'
                              : 'text-[#607B89] hover:text-[#355061]'
                          }`}
                        >
                          Outras
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-700">
                            {faturasOutras.length}
                          </span>
                        </button>
                      </div>

                      <Link
                        to={`/financeiro/faturamento?${clienteQuery}`}
                        className="rounded-lg border border-[#D4E2E7] px-2.5 py-1 text-xs font-medium text-[#355061] transition-colors hover:bg-[#F6FBFC]"
                      >
                        Abrir faturamento
                      </Link>
                    </div>
                  </div>

                  {faturasLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#DCE8EC] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      <Loader2 className="h-4 w-4 animate-spin text-[#159A9C]" />
                      Carregando faturas...
                    </div>
                  ) : !faturasResumo || faturasExibidas.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#D1E0E5] bg-[#FBFDFE] p-3 text-sm text-[#607B89]">
                      {faturasFiltroTab === 'pendentes'
                        ? 'Nenhuma fatura pendente para este cliente.'
                        : faturasFiltroTab === 'pagas'
                          ? 'Nenhuma fatura paga para este cliente.'
                          : faturasFiltroTab === 'vencidas'
                            ? 'Nenhuma fatura vencida para este cliente.'
                            : 'Nenhuma fatura nesta categoria para este cliente.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {faturasExibidas.map((fatura) => {
                        const statusNormalizado = (fatura.status || '').toLowerCase();
                        const statusLabel =
                          faturaStatusLabelMap[statusNormalizado] || fatura.status || 'Sem status';
                        const statusClass =
                          faturaStatusClassMap[statusNormalizado] ||
                          'border-slate-200 bg-slate-50 text-slate-700';

                        return (
                          <div
                            key={fatura.id}
                            className="rounded-xl border border-[#DCE8EC] bg-white p-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  to={`/financeiro/faturamento?faturaId=${String(fatura.id)}&${clienteQuery}`}
                                  className="text-sm font-semibold text-[#159A9C] hover:text-[#0F7B7D]"
                                >
                                  {fatura.numero || `Fatura ${fatura.id}`}
                                </Link>
                                <p className="mt-1 text-xs text-[#607B89]">
                                  Vencimento: {formatDate(fatura.dataVencimento)}
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#355061]">
                                  Pago {formatCurrency(fatura.valorPago)} de{' '}
                                  {formatCurrency(fatura.valorTotal)}
                                </p>
                              </div>
                              <span
                                className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              ) : null}

              {showTagsSection ? (
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
              ) : null}
            </Card>
          ) : null}
        </div>
      ) : null}

      {showAnexosCard ? (
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
      ) : null}

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

      <ModalPlanoCobranca
        isOpen={isPlanoModalOpen}
        onClose={() => setIsPlanoModalOpen(false)}
        clienteId={id}
        usuarioResponsavelId={usuarioResponsavelId}
        onCreated={() => {
          void loadPlanosCobranca(id, true);
        }}
      />
    </div>
  );
};

export default ClienteDetailPage;
