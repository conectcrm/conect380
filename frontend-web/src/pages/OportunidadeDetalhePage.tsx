import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  Edit3,
  FileText,
  Mail,
  Phone,
  Plus,
  Tag,
  Trash2,
  TrendingUp,
  User2,
  Users,
  X,
} from 'lucide-react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import ModalMotivoPerda from '../components/oportunidades/ModalMotivoPerda';
import { triggerSalesCelebration } from '../components/feedback/SalesCelebrationHost';
import RichTextToolbarField from '../components/common/RichTextToolbarField';
import { useGlobalConfirmation } from '../contexts/GlobalConfirmationContext';
import { oportunidadesService } from '../services/oportunidadesService';
import { toastService } from '../services/toastService';
import { markdownToHtml } from '../utils/richTextMarkdown';
import usuariosService from '../services/usuariosService';
import {
  Atividade,
  AtualizarOportunidade,
  Oportunidade,
  OportunidadeHistoricoEstagioItem,
  OportunidadeVendedorEnvolvido,
} from '../types/oportunidades';
import {
  EstagioOportunidade,
  LifecycleStatusOportunidade,
  OrigemOportunidade,
  PrioridadeOportunidade,
  TipoAtividade,
} from '../types/oportunidades/enums';
import { Usuario } from '../types/usuarios';

type OportunidadeDetalheEventoContext = {
  kind: 'oportunidade' | 'atividade';
  title: string;
  dataEvento?: Date | string | null;
  tipoAtividadeLabel?: string;
  responsavelNome?: string;
  descricao?: string;
};

type OportunidadeDetalheLocationState = {
  from?: string;
  initialTab?: 'detalhes' | 'atividades';
  eventContext?: OportunidadeDetalheEventoContext | null;
};

type WorkspaceTab = 'resumo' | 'atividades' | 'historico';
type ComposerTemplate = 'atividade' | 'anotacao' | 'reuniao' | 'chamada' | 'email';
type ComposerPrioridade = 'baixa' | 'media' | 'alta';
type ComposerTemplateUiConfig = {
  titleLabel: string;
  titlePlaceholder: string;
  titlePrefixInDescricao: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  showDate: boolean;
  showTime: boolean;
  showResponsavel: boolean;
  showPrioridade: boolean;
  showMeetingFields: boolean;
  includePrioridadeInDescricao: boolean;
  includeHorarioInDescricao: boolean;
};

type ActivityComposerState = {
  template: ComposerTemplate;
  tipo: TipoAtividade;
  titulo: string;
  descricao: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  prioridade: ComposerPrioridade;
  local: string;
  videochamada: string;
  responsavelId: string;
};

type VendedorEnvolvidoView = {
  id: string;
  nome: string;
  origem: 'responsavel_principal' | 'vendedor_envolvido';
  papel?: string;
  vinculoId?: string;
};

type OportunidadeInlineEditForm = {
  titulo: string;
  descricao: string;
  valor: string;
  probabilidade: string;
  estagio: EstagioOportunidade;
  prioridade: PrioridadeOportunidade;
  origem: OrigemOportunidade;
  dataFechamentoEsperado: string;
  responsavelId: string;
  nomeContato: string;
  empresaContato: string;
  emailContato: string;
  telefoneContato: string;
};

const ETAPAS_PIPELINE: Array<{ estagio: EstagioOportunidade; label: string }> = [
  { estagio: EstagioOportunidade.LEADS, label: 'Leads' },
  { estagio: EstagioOportunidade.QUALIFICACAO, label: 'Qualificacao' },
  { estagio: EstagioOportunidade.PROPOSTA, label: 'Proposta' },
  { estagio: EstagioOportunidade.NEGOCIACAO, label: 'Negociacao' },
  { estagio: EstagioOportunidade.FECHAMENTO, label: 'Fechamento' },
];

const ESTAGIO_LABEL: Record<EstagioOportunidade, string> = {
  [EstagioOportunidade.LEADS]: 'Leads',
  [EstagioOportunidade.QUALIFICACAO]: 'Qualificacao',
  [EstagioOportunidade.PROPOSTA]: 'Proposta',
  [EstagioOportunidade.NEGOCIACAO]: 'Negociacao',
  [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
  [EstagioOportunidade.GANHO]: 'Ganho',
  [EstagioOportunidade.PERDIDO]: 'Perdido',
};

const TIPO_ATIVIDADE_LABEL: Record<TipoAtividade, string> = {
  [TipoAtividade.LIGACAO]: 'Ligacao',
  [TipoAtividade.EMAIL]: 'Email',
  [TipoAtividade.REUNIAO]: 'Reuniao',
  [TipoAtividade.NOTA]: 'Nota',
  [TipoAtividade.TAREFA]: 'Tarefa',
};

const TEMPLATE_TO_TIPO: Record<ComposerTemplate, TipoAtividade> = {
  atividade: TipoAtividade.TAREFA,
  anotacao: TipoAtividade.NOTA,
  reuniao: TipoAtividade.REUNIAO,
  chamada: TipoAtividade.LIGACAO,
  email: TipoAtividade.EMAIL,
};

const COMPOSER_TABS: Array<{ id: ComposerTemplate; label: string }> = [
  { id: 'atividade', label: 'Atividade' },
  { id: 'anotacao', label: 'Anotacoes' },
  { id: 'reuniao', label: 'Agendar reuniao' },
  { id: 'chamada', label: 'Chamada' },
  { id: 'email', label: 'E-mail' },
];

const COMPOSER_TEMPLATE_CONFIG: Record<ComposerTemplate, ComposerTemplateUiConfig> = {
  atividade: {
    titleLabel: 'Titulo da tarefa',
    titlePlaceholder: 'Ex: Alinhamento comercial',
    titlePrefixInDescricao: 'Titulo',
    descriptionLabel: 'Descricao',
    descriptionPlaceholder: 'Detalhes da atividade e proximos passos',
    showDate: true,
    showTime: true,
    showResponsavel: true,
    showPrioridade: true,
    showMeetingFields: false,
    includePrioridadeInDescricao: true,
    includeHorarioInDescricao: true,
  },
  anotacao: {
    titleLabel: 'Titulo da anotacao',
    titlePlaceholder: 'Ex: Observacao da negociacao',
    titlePrefixInDescricao: 'Titulo',
    descriptionLabel: 'Anotacao',
    descriptionPlaceholder: 'Registre observacoes importantes',
    showDate: false,
    showTime: false,
    showResponsavel: false,
    showPrioridade: false,
    showMeetingFields: false,
    includePrioridadeInDescricao: false,
    includeHorarioInDescricao: false,
  },
  reuniao: {
    titleLabel: 'Titulo da reuniao',
    titlePlaceholder: 'Ex: Reuniao de proposta',
    titlePrefixInDescricao: 'Titulo',
    descriptionLabel: 'Descricao',
    descriptionPlaceholder: 'Objetivo, pauta e encaminhamentos da reuniao',
    showDate: true,
    showTime: true,
    showResponsavel: true,
    showPrioridade: true,
    showMeetingFields: true,
    includePrioridadeInDescricao: true,
    includeHorarioInDescricao: true,
  },
  chamada: {
    titleLabel: 'Titulo da chamada',
    titlePlaceholder: 'Ex: Follow-up telefonico',
    titlePrefixInDescricao: 'Titulo',
    descriptionLabel: 'Descricao',
    descriptionPlaceholder: 'Resultado da chamada e proximos passos',
    showDate: true,
    showTime: true,
    showResponsavel: true,
    showPrioridade: true,
    showMeetingFields: false,
    includePrioridadeInDescricao: true,
    includeHorarioInDescricao: true,
  },
  email: {
    titleLabel: 'Assunto',
    titlePlaceholder: 'Ex: Follow-up da proposta',
    titlePrefixInDescricao: 'Assunto',
    descriptionLabel: 'Descricao',
    descriptionPlaceholder: 'Resumo do e-mail e pontos importantes',
    showDate: true,
    showTime: false,
    showResponsavel: true,
    showPrioridade: true,
    showMeetingFields: false,
    includePrioridadeInDescricao: true,
    includeHorarioInDescricao: false,
  },
};

const COMPOSER_SUBMIT_LABEL: Record<ComposerTemplate, string> = {
  atividade: 'Adicionar atividade',
  anotacao: 'Adicionar anotacao',
  reuniao: 'Agendar reuniao',
  chamada: 'Registrar chamada',
  email: 'Registrar e-mail',
};

const COMPOSER_META_DETAIL_PATTERN =
  /^- (Titulo|Assunto|Prioridade|Horario|Local|Videochamada):\s+/i;

const PRIORIDADE_LABEL: Record<string, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
};

const ORIGEM_LABEL: Record<string, string> = {
  website: 'Website',
  indicacao: 'Indicacao',
  telefone: 'Telefone',
  email: 'E-mail',
  redes_sociais: 'Redes sociais',
  evento: 'Evento',
  parceiro: 'Parceiro',
  campanha: 'Campanha',
};

const LIFECYCLE_LABEL: Record<LifecycleStatusOportunidade, string> = {
  [LifecycleStatusOportunidade.OPEN]: 'Aberta',
  [LifecycleStatusOportunidade.WON]: 'Ganha',
  [LifecycleStatusOportunidade.LOST]: 'Perdida',
  [LifecycleStatusOportunidade.ARCHIVED]: 'Arquivada',
  [LifecycleStatusOportunidade.DELETED]: 'Na lixeira',
};

const NEXT_ACTION_STATUS_LABEL: Record<'overdue' | 'due_soon' | 'future', string> = {
  overdue: 'Atrasada',
  due_soon: 'Proxima',
  future: 'Planejada',
};

const formatarMoeda = (valor: number): string =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);

const formatarData = (value?: Date | string | null): string => {
  if (!value) return 'Nao informado';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Nao informado';
  return parsed.toLocaleDateString('pt-BR');
};

const formatarDataHora = (value?: Date | string | null): string => {
  if (!value) return 'Nao informado';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Nao informado';
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const parseDateInput = (value: string): Date | undefined => {
  if (!value) return undefined;
  const [ano, mes, dia] = value.split('-').map(Number);
  if (!ano || !mes || !dia) return undefined;
  const parsed = new Date(ano, mes - 1, dia, 12, 0, 0, 0);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const toInputDate = (value: Date): string => {
  const yyyy = value.getFullYear();
  const mm = String(value.getMonth() + 1).padStart(2, '0');
  const dd = String(value.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toInputDateMaybe = (value?: Date | string | null): string => {
  if (!value) return '';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return toInputDate(parsed);
};

const parseDateTimeInput = (dateValue: string, timeValue?: string): Date | undefined => {
  if (!dateValue) return undefined;
  const [ano, mes, dia] = dateValue.split('-').map(Number);
  if (!ano || !mes || !dia) return undefined;

  if (!timeValue) {
    return parseDateInput(dateValue);
  }

  const [hora, minuto] = timeValue.split(':').map(Number);
  if (!Number.isFinite(hora) || !Number.isFinite(minuto)) {
    return parseDateInput(dateValue);
  }

  const parsed = new Date(ano, mes - 1, dia, hora, minuto, 0, 0);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const createDefaultComposerState = (): ActivityComposerState => ({
  template: 'atividade',
  tipo: TEMPLATE_TO_TIPO.atividade,
  titulo: '',
  descricao: '',
  data: toInputDate(new Date()),
  horaInicio: '',
  horaFim: '',
  prioridade: 'media',
  local: '',
  videochamada: '',
  responsavelId: '',
});

const createInlineEditFormFromOpportunity = (
  oportunidade: Oportunidade | null,
): OportunidadeInlineEditForm => {
  const responsavelId = String(oportunidade?.responsavel?.id || '').trim();

  return {
    titulo: String(oportunidade?.titulo || ''),
    descricao: String(oportunidade?.descricao || ''),
    valor: Number.isFinite(Number(oportunidade?.valor))
      ? String(Number(oportunidade?.valor))
      : '0',
    probabilidade: Number.isFinite(Number(oportunidade?.probabilidade))
      ? String(Number(oportunidade?.probabilidade))
      : '0',
    estagio: (oportunidade?.estagio || EstagioOportunidade.LEADS) as EstagioOportunidade,
    prioridade: (oportunidade?.prioridade || PrioridadeOportunidade.MEDIA) as PrioridadeOportunidade,
    origem: (oportunidade?.origem || OrigemOportunidade.WEBSITE) as OrigemOportunidade,
    dataFechamentoEsperado: toInputDateMaybe(oportunidade?.dataFechamentoEsperado || null),
    responsavelId,
    nomeContato: String(oportunidade?.nomeContato || oportunidade?.cliente?.nome || ''),
    empresaContato: String(
      oportunidade?.empresaContato || oportunidade?.cliente?.empresa || oportunidade?.cliente?.nome || '',
    ),
    emailContato: String(oportunidade?.emailContato || oportunidade?.cliente?.email || ''),
    telefoneContato: String(
      oportunidade?.telefoneContato || oportunidade?.cliente?.telefone || '',
    ),
  };
};

const getAtividadeIcon = (tipo: TipoAtividade | string) => {
  switch (String(tipo)) {
    case TipoAtividade.LIGACAO:
      return Phone;
    case TipoAtividade.EMAIL:
      return Mail;
    case TipoAtividade.REUNIAO:
      return Users;
    case TipoAtividade.TAREFA:
      return CheckCircle2;
    default:
      return FileText;
  }
};

const OportunidadeDetalhePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { confirm } = useGlobalConfirmation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [oportunidade, setOportunidade] = useState<Oportunidade | null>(null);
  const [lifecycleFeatureEnabled, setLifecycleFeatureEnabled] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [showModalMotivoPerda, setShowModalMotivoPerda] = useState(false);
  const [oportunidadeParaPerder, setOportunidadeParaPerder] = useState<Oportunidade | null>(null);
  const [erroMotivoPerda, setErroMotivoPerda] = useState<string | null>(null);
  const [loadingMudancaEstagio, setLoadingMudancaEstagio] = useState(false);
  const [inlineEditMode, setInlineEditMode] = useState(false);
  const [salvandoEdicaoInline, setSalvandoEdicaoInline] = useState(false);
  const [inlineAutoSaveStatus, setInlineAutoSaveStatus] = useState<
    'idle' | 'dirty' | 'saving' | 'saved' | 'invalid' | 'error'
  >('idle');
  const [inlineAutoSaveMessage, setInlineAutoSaveMessage] = useState(
    'Edicao automatica ativa.',
  );
  const [inlineEditForm, setInlineEditForm] = useState<OportunidadeInlineEditForm>(
    createInlineEditFormFromOpportunity(null),
  );
  const inlineLastSavedSignatureRef = useRef('');
  const inlineLastFailedSignatureRef = useRef('');
  const inlineAutoSaveSequenceRef = useRef(0);

  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('resumo');
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [loadingAtividades, setLoadingAtividades] = useState(false);
  const [composer, setComposer] = useState<ActivityComposerState>(createDefaultComposerState);
  const [salvandoAtividade, setSalvandoAtividade] = useState(false);
  const [concluindoAtividadeId, setConcluindoAtividadeId] = useState<string | number | null>(null);
  const [vendedoresEnvolvidosPersistidos, setVendedoresEnvolvidosPersistidos] = useState<
    OportunidadeVendedorEnvolvido[]
  >([]);
  const [loadingVendedoresEnvolvidos, setLoadingVendedoresEnvolvidos] = useState(false);
  const [vendedorApoioId, setVendedorApoioId] = useState('');
  const [adicionandoVendedorApoio, setAdicionandoVendedorApoio] = useState(false);
  const [removendoVendedorApoioId, setRemovendoVendedorApoioId] = useState<string | null>(null);
  const [historicoEstagios, setHistoricoEstagios] = useState<OportunidadeHistoricoEstagioItem[]>(
    [],
  );
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  const locationState = (location.state as OportunidadeDetalheLocationState | null) || null;
  const pipelineBasePath = useMemo(
    () => (location.pathname.startsWith('/crm/') ? '/crm/pipeline' : '/pipeline'),
    [location.pathname],
  );
  const backPath = useMemo(() => {
    const from = locationState?.from;
    if (typeof from === 'string' && from.trim()) {
      return from;
    }
    return pipelineBasePath;
  }, [locationState?.from, pipelineBasePath]);

  const initialTab = useMemo<'detalhes' | 'atividades'>(() => {
    const queryTab = String(searchParams.get('tab') || '').toLowerCase();
    if (queryTab === 'atividades') return 'atividades';
    if (locationState?.initialTab === 'atividades') return 'atividades';
    return 'detalhes';
  }, [locationState?.initialTab, searchParams]);

  const eventContext = locationState?.eventContext || null;

  useEffect(() => {
    setWorkspaceTab(initialTab === 'atividades' ? 'atividades' : 'resumo');
  }, [initialTab, oportunidade?.id]);

  const buildDetailPath = useCallback(
    (oportunidadeId: number | string) => `${pipelineBasePath}/oportunidades/${oportunidadeId}`,
    [pipelineBasePath],
  );

  const extrairMensagemErroApi = useCallback((err: any, fallback: string) => {
    const message = err?.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string' && message.trim()) return message;
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }, []);

  const getLifecycleStatus = useCallback((item: Oportunidade): LifecycleStatusOportunidade => {
    if (item.lifecycle_status) return item.lifecycle_status;
    if (item.estagio === EstagioOportunidade.GANHO) return LifecycleStatusOportunidade.WON;
    if (item.estagio === EstagioOportunidade.PERDIDO) return LifecycleStatusOportunidade.LOST;
    return LifecycleStatusOportunidade.OPEN;
  }, []);

  const isTerminalStage = useCallback(
    (estagio: EstagioOportunidade): boolean =>
      estagio === EstagioOportunidade.GANHO || estagio === EstagioOportunidade.PERDIDO,
    [],
  );

  const canMarkOpportunityAsWon = useCallback(
    (item: Oportunidade): boolean =>
      lifecycleFeatureEnabled &&
      getLifecycleStatus(item) === LifecycleStatusOportunidade.OPEN &&
      item.estagio === EstagioOportunidade.FECHAMENTO,
    [getLifecycleStatus, lifecycleFeatureEnabled],
  );

  const canMarkOpportunityAsLost = useCallback(
    (item: Oportunidade): boolean =>
      lifecycleFeatureEnabled &&
      getLifecycleStatus(item) === LifecycleStatusOportunidade.OPEN &&
      !isTerminalStage(item.estagio),
    [getLifecycleStatus, isTerminalStage, lifecycleFeatureEnabled],
  );

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoadingUsuarios(true);
      const response = await usuariosService.listarUsuarios({ ativo: true });
      setUsuarios(Array.isArray(response?.usuarios) ? response.usuarios : []);
    } catch (err) {
      console.warn('[OportunidadeDetalhe] Falha ao carregar usuarios para edicao.', err);
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  const carregarDetalhes = useCallback(async () => {
    const oportunidadeId = String(id ?? '').trim();
    if (!oportunidadeId) {
      setError('Oportunidade invalida.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [dados, lifecycleDecision] = await Promise.all([
        oportunidadesService.obterOportunidade(oportunidadeId),
        oportunidadesService
          .obterLifecycleFeatureFlag()
          .catch(() => ({ enabled: false, source: 'disabled', rolloutPercentage: 0 })),
      ]);

      setOportunidade(dados);
      setLifecycleFeatureEnabled(Boolean(lifecycleDecision.enabled));
    } catch (err: any) {
      console.error('[OportunidadeDetalhe] Erro ao carregar oportunidade:', err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Nao foi possivel carregar os detalhes da oportunidade.',
      );
      setOportunidade(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const carregarAtividades = useCallback(async (item: Oportunidade | null) => {
    if (!item?.id) {
      setAtividades([]);
      return;
    }

    try {
      setLoadingAtividades(true);
      const dados = await oportunidadesService.listarAtividades(item.id);
      setAtividades(dados);
    } catch (err) {
      console.error('[OportunidadeDetalhe] Erro ao carregar atividades:', err);
      setAtividades([]);
    } finally {
      setLoadingAtividades(false);
    }
  }, []);

  const carregarHistorico = useCallback(async (item: Oportunidade | null) => {
    if (!item?.id) {
      setHistoricoEstagios([]);
      return;
    }

    try {
      setLoadingHistorico(true);
      const dados = await oportunidadesService.listarHistoricoEstagios(item.id, 60);
      setHistoricoEstagios(Array.isArray(dados) ? dados : []);
    } catch (err) {
      console.error('[OportunidadeDetalhe] Erro ao carregar historico:', err);
      setHistoricoEstagios([]);
    } finally {
      setLoadingHistorico(false);
    }
  }, []);

  const carregarVendedoresEnvolvidos = useCallback(async (item: Oportunidade | null) => {
    if (!item?.id) {
      setVendedoresEnvolvidosPersistidos([]);
      return;
    }

    try {
      setLoadingVendedoresEnvolvidos(true);
      const dados = await oportunidadesService.listarVendedoresEnvolvidos(item.id);
      setVendedoresEnvolvidosPersistidos(Array.isArray(dados) ? dados : []);
    } catch (err: any) {
      const statusCode = Number(err?.response?.status || 0);
      if (statusCode !== 503) {
        console.error('[OportunidadeDetalhe] Erro ao carregar vendedores envolvidos:', err);
      }
      setVendedoresEnvolvidosPersistidos([]);
    } finally {
      setLoadingVendedoresEnvolvidos(false);
    }
  }, []);

  useEffect(() => {
    void carregarDetalhes();
    void carregarUsuarios();
  }, [carregarDetalhes, carregarUsuarios]);

  useEffect(() => {
    if (!oportunidade) return;
    void carregarAtividades(oportunidade);
    void carregarHistorico(oportunidade);
    void carregarVendedoresEnvolvidos(oportunidade);
  }, [carregarAtividades, carregarHistorico, carregarVendedoresEnvolvidos, oportunidade?.id]);

  useEffect(() => {
    if (!oportunidade?.responsavel?.id) return;
    setComposer((prev) =>
      prev.responsavelId ? prev : { ...prev, responsavelId: oportunidade.responsavel.id },
    );
  }, [oportunidade?.responsavel?.id]);

  useEffect(() => {
    setVendedorApoioId('');
    setRemovendoVendedorApoioId(null);
  }, [oportunidade?.id]);

  useEffect(() => {
    setInlineEditMode(false);
    setSalvandoEdicaoInline(false);
    setInlineAutoSaveStatus('idle');
    setInlineAutoSaveMessage('Edicao automatica ativa.');
    setInlineEditForm(createInlineEditFormFromOpportunity(oportunidade));
    inlineLastSavedSignatureRef.current = '';
    inlineLastFailedSignatureRef.current = '';
    inlineAutoSaveSequenceRef.current += 1;
  }, [oportunidade?.id]);

  const applyComposerTemplate = (template: ComposerTemplate) => {
    setComposer((prev) => ({
      ...prev,
      template,
      tipo: TEMPLATE_TO_TIPO[template],
      titulo: '',
      descricao: '',
      horaInicio: '',
      horaFim: '',
      local: template === 'reuniao' ? prev.local : '',
      videochamada: template === 'reuniao' ? prev.videochamada : '',
    }));
  };

  const formatarPrioridade = (value: ComposerPrioridade): string => {
    if (value === 'alta') return 'Alta';
    if (value === 'baixa') return 'Baixa';
    return 'Media';
  };

  const comporDescricaoAtividade = (state: ActivityComposerState): string => {
    const templateConfig = COMPOSER_TEMPLATE_CONFIG[state.template];
    const principal = state.descricao.trim();
    const detalhes: string[] = [];

    if (state.titulo.trim()) {
      detalhes.push(`${templateConfig.titlePrefixInDescricao}: ${state.titulo.trim()}`);
    }

    if (templateConfig.includePrioridadeInDescricao && state.prioridade) {
      detalhes.push(`Prioridade: ${formatarPrioridade(state.prioridade)}`);
    }

    if (templateConfig.includeHorarioInDescricao && (state.horaInicio || state.horaFim)) {
      const inicio = state.horaInicio || '--:--';
      const fim = state.horaFim || '--:--';
      detalhes.push(`Horario: ${inicio} - ${fim}`);
    }

    if (templateConfig.showMeetingFields && state.local.trim()) {
      detalhes.push(`Local: ${state.local.trim()}`);
    }

    if (templateConfig.showMeetingFields && state.videochamada.trim()) {
      detalhes.push(`Videochamada: ${state.videochamada.trim()}`);
    }

    if (detalhes.length === 0) {
      return principal;
    }

    return `${principal}\n\n${detalhes.map((item) => `- ${item}`).join('\n')}`;
  };

  const parseDescricaoAtividade = (
    descricao: string,
  ): { principal: string; detalhes: string[] } => {
    const normalized = String(descricao || '').trim();
    if (!normalized) {
      return { principal: '', detalhes: [] };
    }

    const linhas = normalized.split('\n');
    const detalhesColetados: string[] = [];
    let cursor = linhas.length - 1;

    while (cursor >= 0) {
      const linhaAtual = linhas[cursor].trim();

      if (!linhaAtual) {
        if (detalhesColetados.length > 0) {
          cursor -= 1;
          continue;
        }
        cursor -= 1;
        continue;
      }

      if (COMPOSER_META_DETAIL_PATTERN.test(linhaAtual)) {
        detalhesColetados.push(linhaAtual.replace(/^- /, '').trim());
        cursor -= 1;
        continue;
      }

      break;
    }

    const detalhes = detalhesColetados.reverse();
    const principal = linhas
      .slice(0, cursor + 1)
      .join('\n')
      .trim();

    return {
      principal: principal || normalized,
      detalhes,
    };
  };

  const handleVoltar = useCallback(() => {
    navigate(backPath);
  }, [backPath, navigate]);

  const buildInlineEditPayload = useCallback(
    (
      form: OportunidadeInlineEditForm,
      target: Oportunidade | null,
    ): {
      payload?: AtualizarOportunidade;
      signature?: string;
      reason?: string;
    } => {
      if (!target) {
        return { reason: 'Oportunidade nao disponivel para edicao.' };
      }

      const titulo = form.titulo.trim();
      if (titulo.length < 3) {
        return { reason: 'Titulo deve ter pelo menos 3 caracteres.' };
      }

      const responsavelId = form.responsavelId.trim();
      if (!responsavelId) {
        return { reason: 'Selecione um responsavel principal.' };
      }

      const valor = Number(form.valor);
      if (!Number.isFinite(valor) || valor < 0) {
        return { reason: 'Informe um valor valido maior ou igual a zero.' };
      }

      const probabilidade = Number(form.probabilidade);
      if (!Number.isFinite(probabilidade) || probabilidade < 0 || probabilidade > 100) {
        return { reason: 'A probabilidade deve estar entre 0 e 100.' };
      }

      const oportunidadeIdValue = target.id as unknown;
      const oportunidadeIdText = String(oportunidadeIdValue ?? '').trim();
      if (!oportunidadeIdText) {
        return { reason: 'Identificador de oportunidade invalido para atualizacao.' };
      }
      const clienteIdText = String(target.cliente?.id ?? '').trim();
      const nomeContato = form.nomeContato.trim();
      if (!clienteIdText && !nomeContato) {
        return {
          reason: 'Informe um cliente (cliente_id) ou pelo menos o nome do contato (nomeContato).',
        };
      }

      const payload: AtualizarOportunidade = {
        id:
          typeof oportunidadeIdValue === 'number'
            ? oportunidadeIdValue
            : (oportunidadeIdText as any),
        titulo,
        descricao: form.descricao.trim() || undefined,
        valor,
        probabilidade,
        estagio: form.estagio,
        prioridade: form.prioridade,
        origem: form.origem,
        dataFechamentoEsperado: form.dataFechamentoEsperado || undefined,
        responsavel_id: responsavelId,
        cliente_id: clienteIdText || undefined,
        nomeContato: nomeContato || undefined,
        empresaContato: form.empresaContato.trim() || undefined,
        emailContato: form.emailContato.trim() || undefined,
        telefoneContato: form.telefoneContato.trim() || undefined,
      };

      return {
        payload,
        signature: JSON.stringify(payload),
      };
    },
    [],
  );

  const handleAbrirEdicaoInline = () => {
    const nextForm = createInlineEditFormFromOpportunity(oportunidade);
    const built = buildInlineEditPayload(nextForm, oportunidade);

    setInlineEditForm(nextForm);
    setInlineEditMode(true);
    setSalvandoEdicaoInline(false);
    inlineAutoSaveSequenceRef.current += 1;
    inlineLastFailedSignatureRef.current = '';

    if (built.signature) {
      inlineLastSavedSignatureRef.current = built.signature;
      setInlineAutoSaveStatus('saved');
      setInlineAutoSaveMessage('Edicao automatica ativa.');
      return;
    }

    inlineLastSavedSignatureRef.current = '';
    setInlineAutoSaveStatus('invalid');
    setInlineAutoSaveMessage(built.reason || 'Preencha os campos obrigatorios para salvar.');
  };

  const handleCancelarEdicaoInline = () => {
    setInlineEditForm(createInlineEditFormFromOpportunity(oportunidade));
    setInlineEditMode(false);
    setSalvandoEdicaoInline(false);
    setInlineAutoSaveStatus('idle');
    setInlineAutoSaveMessage('Edicao automatica ativa.');
    inlineAutoSaveSequenceRef.current += 1;
    inlineLastSavedSignatureRef.current = '';
    inlineLastFailedSignatureRef.current = '';
  };

  useEffect(() => {
    if (!inlineEditMode || !oportunidade) return;

    const built = buildInlineEditPayload(inlineEditForm, oportunidade);
    if (!built.payload || !built.signature) {
      setInlineAutoSaveStatus('invalid');
      setInlineAutoSaveMessage(built.reason || 'Preencha os campos obrigatorios para salvar.');
      return;
    }

    if (built.signature === inlineLastSavedSignatureRef.current) {
      setInlineAutoSaveStatus('saved');
      setInlineAutoSaveMessage('Todas as alteracoes estao salvas.');
      return;
    }

    if (built.signature === inlineLastFailedSignatureRef.current) {
      setInlineAutoSaveStatus('error');
      setInlineAutoSaveMessage('Falha no auto save. Ajuste o campo e tente novamente.');
      return;
    }

    setInlineAutoSaveStatus('dirty');
    setInlineAutoSaveMessage('Alteracoes pendentes. Salvando automaticamente...');

    const sequence = ++inlineAutoSaveSequenceRef.current;
    const stageWasChanged = oportunidade.estagio !== built.payload.estagio;
    const ownerWasChanged =
      String(oportunidade.responsavel?.id || '') !== String(built.payload.responsavel_id || '');
    const timeout = setTimeout(async () => {
      try {
        setSalvandoEdicaoInline(true);
        setInlineAutoSaveStatus('saving');
        setInlineAutoSaveMessage('Salvando automaticamente...');
        const updated = await oportunidadesService.atualizarOportunidade(built.payload as any);
        if (sequence !== inlineAutoSaveSequenceRef.current) {
          return;
        }

        inlineLastSavedSignatureRef.current = built.signature as string;
        inlineLastFailedSignatureRef.current = '';
        setOportunidade(updated);
        setInlineAutoSaveStatus('saved');
        setInlineAutoSaveMessage('Alteracoes salvas automaticamente.');

        if (stageWasChanged) {
          void carregarHistorico(updated);
        }
        if (ownerWasChanged) {
          void carregarVendedoresEnvolvidos(updated);
        }
      } catch (err) {
        if (sequence !== inlineAutoSaveSequenceRef.current) {
          return;
        }
        console.error('[OportunidadeDetalhe] Erro no auto save da edicao inline:', err);
        const message = extrairMensagemErroApi(err, 'Nao foi possivel salvar as alteracoes.');
        inlineLastFailedSignatureRef.current = built.signature as string;
        setInlineAutoSaveStatus('error');
        setInlineAutoSaveMessage(message);
        toastService.error(message);
      } finally {
        if (sequence === inlineAutoSaveSequenceRef.current) {
          setSalvandoEdicaoInline(false);
        }
      }
    }, 900);

    return () => clearTimeout(timeout);
  }, [
    buildInlineEditPayload,
    carregarHistorico,
    carregarVendedoresEnvolvidos,
    extrairMensagemErroApi,
    inlineEditForm,
    inlineEditMode,
    oportunidade,
  ]);

  const handleClonarOportunidade = async (item: Oportunidade) => {
    const confirmou = await confirm({
      title: 'Duplicar oportunidade',
      message: 'Uma nova oportunidade sera criada com os mesmos dados comerciais.',
      confirmText: 'Duplicar',
      cancelText: 'Cancelar',
      icon: 'info',
    });

    if (!confirmou) return;

    const estagioClone = isTerminalStage(item.estagio) ? EstagioOportunidade.LEADS : item.estagio;
    const nomeContato = String(item.nomeContato || item.cliente?.nome || '').trim();

    try {
      const criada = await oportunidadesService.criarOportunidade({
        titulo: `${item.titulo} (Copia)`,
        descricao: item.descricao || undefined,
        valor: Number(item.valor || 0),
        probabilidade: Number(item.probabilidade || 0),
        estagio: estagioClone,
        prioridade: item.prioridade,
        origem: item.origem,
        dataFechamentoEsperado: item.dataFechamentoEsperado || undefined,
        responsavel_id: String(item.responsavel?.id || '').trim(),
        cliente_id: String(item.cliente?.id || '').trim() || undefined,
        nomeContato: nomeContato || undefined,
        emailContato: String(item.emailContato || item.cliente?.email || '').trim() || undefined,
        telefoneContato:
          String(item.telefoneContato || item.cliente?.telefone || '').trim() || undefined,
        empresaContato:
          String(item.empresaContato || item.cliente?.empresa || item.cliente?.nome || '').trim() ||
          undefined,
      });

      toastService.success('Oportunidade duplicada com sucesso.');
      navigate(buildDetailPath(criada.id), {
        replace: true,
        state: { from: backPath },
      });
    } catch (err: any) {
      console.error('[OportunidadeDetalhe] Erro ao duplicar oportunidade:', err);
      toastService.error(extrairMensagemErroApi(err, 'Nao foi possivel duplicar a oportunidade.'));
    }
  };

  const handleArquivarOportunidade = async (item: Oportunidade) => {
    const confirmou = await confirm({
      title: 'Arquivar oportunidade',
      message:
        'A oportunidade deixara de aparecer na carteira ativa, mas podera ser restaurada depois.',
      confirmText: 'Arquivar',
      cancelText: 'Cancelar',
      icon: 'warning',
    });

    if (!confirmou) return;

    await oportunidadesService.arquivarOportunidade(item.id);
    toastService.success('Oportunidade arquivada com sucesso.');
    await carregarDetalhes();
  };

  const handleRestaurarOportunidade = async (item: Oportunidade) => {
    const confirmou = await confirm({
      title: 'Restaurar oportunidade',
      message: 'A oportunidade voltara para a carteira ativa do pipeline.',
      confirmText: 'Restaurar',
      cancelText: 'Cancelar',
      icon: 'info',
    });

    if (!confirmou) return;

    await oportunidadesService.restaurarOportunidade(item.id);
    toastService.success('Oportunidade restaurada com sucesso.');
    await carregarDetalhes();
  };

  const handleReabrirOportunidade = async (item: Oportunidade) => {
    const confirmou = await confirm({
      title: 'Reabrir oportunidade',
      message:
        'A oportunidade retornara para o ciclo aberto e podera seguir novamente no funil comercial.',
      confirmText: 'Reabrir',
      cancelText: 'Cancelar',
      icon: 'warning',
    });

    if (!confirmou) return;

    await oportunidadesService.reabrirOportunidade(item.id);
    toastService.success('Oportunidade reaberta com sucesso.');
    await carregarDetalhes();
  };

  const handlePrepararPerdaOportunidade = (item: Oportunidade) => {
    if (!canMarkOpportunityAsLost(item)) {
      toastService.warning('Apenas oportunidades abertas podem ser marcadas como perdidas.');
      return;
    }

    setErroMotivoPerda(null);
    setOportunidadeParaPerder(item);
    setShowModalMotivoPerda(true);
  };

  const handleConfirmarPerda = async (dados: {
    motivoPerda: string;
    motivoPerdaDetalhes?: string;
    concorrenteNome?: string;
    dataRevisao?: string;
  }) => {
    if (!oportunidadeParaPerder) return;

    try {
      setLoadingMudancaEstagio(true);
      await oportunidadesService.atualizarEstagio(oportunidadeParaPerder.id, {
        estagio: EstagioOportunidade.PERDIDO,
        motivoPerda: dados.motivoPerda,
        motivoPerdaDetalhes: dados.motivoPerdaDetalhes,
        concorrenteNome: dados.concorrenteNome,
        dataRevisao: dados.dataRevisao,
      });

      setShowModalMotivoPerda(false);
      setOportunidadeParaPerder(null);
      setErroMotivoPerda(null);
      await carregarDetalhes();
      toastService.success('Oportunidade marcada como perdida com sucesso!');
    } catch (err) {
      const errorMessage = extrairMensagemErroApi(err, 'Erro ao marcar oportunidade como perdida');
      toastService.error(errorMessage);
      setErroMotivoPerda(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingMudancaEstagio(false);
    }
  };

  const handleMarcarOportunidadeComoGanha = async (item: Oportunidade) => {
    if (!canMarkOpportunityAsWon(item)) {
      toastService.warning(
        'Somente oportunidades abertas em Fechamento podem ser marcadas como ganho.',
      );
      return;
    }

    const confirmou = await confirm({
      title: 'Marcar oportunidade como ganha',
      message: 'Ao confirmar, a oportunidade sera encerrada como ganha.',
      confirmText: 'Marcar como ganho',
      cancelText: 'Cancelar',
      confirmButtonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      icon: 'success',
    });

    if (!confirmou) return;

    try {
      setLoadingMudancaEstagio(true);
      await oportunidadesService.atualizarEstagio(item.id, {
        estagio: EstagioOportunidade.GANHO,
      });
      await carregarDetalhes();
      toastService.success('Oportunidade marcada como ganha com sucesso!');
      triggerSalesCelebration({
        kind: 'venda-concluida',
        subtitle: `"${item.titulo}" foi marcada como ganha.`,
      });
    } catch (err) {
      const errorMessage = extrairMensagemErroApi(err, 'Erro ao marcar oportunidade como ganha');
      toastService.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoadingMudancaEstagio(false);
    }
  };

  const handleExcluirOportunidade = async (item: Oportunidade) => {
    const lifecycleAtual = getLifecycleStatus(item);
    const exclusaoDireta =
      !lifecycleFeatureEnabled || lifecycleAtual === LifecycleStatusOportunidade.DELETED;
    const confirmou = await confirm({
      title: exclusaoDireta
        ? 'Excluir oportunidade permanentemente'
        : 'Enviar oportunidade para lixeira',
      message: exclusaoDireta
        ? 'Esta acao e permanente e nao podera ser desfeita.'
        : 'A oportunidade sera enviada para a lixeira e podera ser restaurada posteriormente.',
      confirmText: exclusaoDireta ? 'Excluir permanente' : 'Enviar para lixeira',
      cancelText: 'Cancelar',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: 'danger',
    });

    if (!confirmou) return;

    await oportunidadesService.excluirOportunidade(item.id);
    toastService.success(
      lifecycleFeatureEnabled
        ? 'Oportunidade enviada para a lixeira.'
        : 'Oportunidade excluida com sucesso.',
    );
    navigate(backPath, { replace: true });
  };

  const handleExcluirOportunidadePermanente = async (item: Oportunidade) => {
    const confirmou = await confirm({
      title: 'Excluir oportunidade permanentemente',
      message: 'Esta acao remove o registro de forma definitiva. Use apenas quando tiver certeza.',
      confirmText: 'Excluir permanente',
      cancelText: 'Cancelar',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      icon: 'danger',
    });

    if (!confirmou) return;

    await oportunidadesService.excluirOportunidadePermanente(item.id);
    toastService.success('Oportunidade excluida permanentemente.');
    navigate(backPath, { replace: true });
  };

  const handleCriarAtividade = async () => {
    if (!oportunidade) return;
    const templateConfig = COMPOSER_TEMPLATE_CONFIG[composer.template];
    const descricaoPrincipal = composer.descricao.trim();
    if (!descricaoPrincipal) {
      switch (composer.template) {
        case 'anotacao':
          toastService.warning('Informe a anotacao.');
          break;
        case 'reuniao':
          toastService.warning('Informe a descricao da reuniao.');
          break;
        case 'chamada':
          toastService.warning('Informe a descricao da chamada.');
          break;
        case 'email':
          toastService.warning('Informe a descricao do e-mail.');
          break;
        default:
          toastService.warning('Informe a descricao da atividade.');
          break;
      }
      return;
    }

    if (templateConfig.showDate && !composer.data) {
      toastService.warning('Informe a data da atividade.');
      return;
    }

    if (composer.template === 'email' && !composer.titulo.trim()) {
      toastService.warning('Informe o assunto do e-mail.');
      return;
    }

    if (
      (composer.template === 'reuniao' || composer.template === 'chamada') &&
      !composer.horaInicio
    ) {
      toastService.warning(
        composer.template === 'reuniao'
          ? 'Informe o horario de inicio da reuniao.'
          : 'Informe o horario de inicio da chamada.',
      );
      return;
    }

    if (composer.horaFim && !composer.horaInicio) {
      toastService.warning('Informe a hora inicial para definir a hora final.');
      return;
    }

    if (composer.horaInicio && composer.horaFim && composer.horaFim < composer.horaInicio) {
      toastService.warning('A hora final deve ser maior que a hora inicial.');
      return;
    }

    if (
      composer.template === 'reuniao' &&
      !composer.local.trim() &&
      !composer.videochamada.trim()
    ) {
      toastService.warning('Informe local ou link da videochamada para a reuniao.');
      return;
    }

    const dataAtividade = templateConfig.showDate
      ? parseDateTimeInput(
          composer.data,
          templateConfig.showTime ? composer.horaInicio || undefined : undefined,
        )
      : new Date();

    if (templateConfig.showDate && !dataAtividade) {
      toastService.warning('Informe uma data valida para a atividade.');
      return;
    }

    const descricao = comporDescricaoAtividade(composer);

    try {
      setSalvandoAtividade(true);
      await oportunidadesService.criarAtividade({
        oportunidadeId: oportunidade.id as any,
        tipo: composer.tipo,
        descricao,
        dataAtividade,
        responsavelId: templateConfig.showResponsavel
          ? composer.responsavelId || undefined
          : undefined,
      });
      setComposer((prev) => ({
        ...prev,
        titulo: '',
        descricao: '',
        horaInicio: '',
        horaFim: '',
        local: '',
        videochamada: '',
      }));
      await carregarAtividades(oportunidade);
      toastService.success('Atividade registrada com sucesso.');
    } catch (err) {
      console.error('[OportunidadeDetalhe] Erro ao criar atividade:', err);
      toastService.error('Nao foi possivel registrar a atividade.');
    } finally {
      setSalvandoAtividade(false);
    }
  };

  const handleAdicionarVendedorApoio = async () => {
    if (!oportunidade) return;
    const lifecycleAtual = getLifecycleStatus(oportunidade);
    if (
      lifecycleAtual === LifecycleStatusOportunidade.ARCHIVED ||
      lifecycleAtual === LifecycleStatusOportunidade.DELETED
    ) {
      toastService.warning(
        'Restaure a oportunidade para alterar vendedores de apoio.',
      );
      return;
    }

    const targetId = vendedorApoioId.trim();
    if (!targetId) {
      toastService.warning('Selecione um vendedor para incluir na oportunidade.');
      return;
    }

    if (String(oportunidade.responsavel?.id || '').trim() === targetId) {
      toastService.info('Esse usuario ja e o responsavel principal da oportunidade.');
      return;
    }

    if (vendedoresEnvolvidosPersistidos.some((item) => item.vendedorId === targetId)) {
      toastService.info('Esse vendedor ja esta envolvido nesta oportunidade.');
      return;
    }

    const vendedorSelecionado = usuarios.find((item) => String(item.id) === targetId);
    if (!vendedorSelecionado) {
      toastService.warning('Vendedor selecionado nao encontrado.');
      return;
    }

    try {
      setAdicionandoVendedorApoio(true);
      await oportunidadesService.adicionarVendedorEnvolvido(oportunidade.id, {
        vendedor_id: vendedorSelecionado.id,
        papel: 'apoio',
      });
      await carregarVendedoresEnvolvidos(oportunidade);
      setVendedorApoioId('');
      toastService.success(`${vendedorSelecionado.nome} incluido como vendedor de apoio.`);
    } catch (err) {
      console.error('[OportunidadeDetalhe] Erro ao incluir vendedor de apoio:', err);
      toastService.error('Nao foi possivel incluir o vendedor de apoio.');
    } finally {
      setAdicionandoVendedorApoio(false);
    }
  };

  const handleRemoverVendedorApoio = async (vendedorId: string) => {
    if (!oportunidade) return;
    const lifecycleAtual = getLifecycleStatus(oportunidade);
    if (
      lifecycleAtual === LifecycleStatusOportunidade.ARCHIVED ||
      lifecycleAtual === LifecycleStatusOportunidade.DELETED
    ) {
      toastService.warning(
        'Restaure a oportunidade para alterar vendedores de apoio.',
      );
      return;
    }
    const vendedorIdNormalizado = String(vendedorId || '').trim();
    if (!vendedorIdNormalizado) return;

    try {
      setRemovendoVendedorApoioId(vendedorIdNormalizado);
      await oportunidadesService.removerVendedorEnvolvido(oportunidade.id, vendedorIdNormalizado);
      await carregarVendedoresEnvolvidos(oportunidade);
      toastService.success('Vendedor removido da oportunidade.');
    } catch (err) {
      console.error('[OportunidadeDetalhe] Erro ao remover vendedor de apoio:', err);
      toastService.error('Nao foi possivel remover o vendedor da oportunidade.');
    } finally {
      setRemovendoVendedorApoioId(null);
    }
  };

  const isAtividadeConcluida = useCallback(
    (atividade: Atividade) => String(atividade.status || '').toLowerCase() === 'completed',
    [],
  );

  const handleConcluirAtividade = async (atividade: Atividade) => {
    if (!oportunidade || isAtividadeConcluida(atividade)) return;

    try {
      setConcluindoAtividadeId(atividade.id);
      await oportunidadesService.concluirAtividade(oportunidade.id, atividade.id);
      await carregarAtividades(oportunidade);
      toastService.success('Atividade concluida com sucesso.');
    } catch (err) {
      toastService.error('Nao foi possivel concluir a atividade.');
    } finally {
      setConcluindoAtividadeId(null);
    }
  };

  const lifecycleStatusAtual = oportunidade
    ? getLifecycleStatus(oportunidade)
    : LifecycleStatusOportunidade.OPEN;
  const podeArquivar =
    Boolean(oportunidade) &&
    lifecycleFeatureEnabled &&
    lifecycleStatusAtual === LifecycleStatusOportunidade.OPEN &&
    !isTerminalStage(oportunidade.estagio);
  const podeRestaurar =
    Boolean(oportunidade) &&
    lifecycleFeatureEnabled &&
    (lifecycleStatusAtual === LifecycleStatusOportunidade.ARCHIVED ||
      lifecycleStatusAtual === LifecycleStatusOportunidade.DELETED);
  const podeReabrir =
    Boolean(oportunidade) &&
    lifecycleFeatureEnabled &&
    (oportunidade.estagio === EstagioOportunidade.GANHO ||
      oportunidade.estagio === EstagioOportunidade.PERDIDO);

  const etapaAtualIndex = useMemo(() => {
    if (!oportunidade) return -1;
    const index = ETAPAS_PIPELINE.findIndex((item) => item.estagio === oportunidade.estagio);
    if (index >= 0) return index;
    if (
      oportunidade.estagio === EstagioOportunidade.GANHO ||
      oportunidade.estagio === EstagioOportunidade.PERDIDO
    ) {
      return ETAPAS_PIPELINE.length - 1;
    }
    return -1;
  }, [oportunidade?.estagio]);

  const composerTemplateConfig = COMPOSER_TEMPLATE_CONFIG[composer.template];
  const prioridadeLabel =
    PRIORIDADE_LABEL[String(oportunidade?.prioridade || '').toLowerCase()] ||
    String(oportunidade?.prioridade || 'Nao informado');
  const origemLabel =
    ORIGEM_LABEL[String(oportunidade?.origem || '').toLowerCase()] ||
    String(oportunidade?.origem || 'Nao informado');
  const lifecycleStatusLabel = LIFECYCLE_LABEL[lifecycleStatusAtual] || 'Aberta';
  const lifecycleStatusBadgeClass =
    lifecycleStatusAtual === LifecycleStatusOportunidade.OPEN
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : lifecycleStatusAtual === LifecycleStatusOportunidade.WON
        ? 'border-green-200 bg-green-50 text-green-700'
        : lifecycleStatusAtual === LifecycleStatusOportunidade.LOST
          ? 'border-red-200 bg-red-50 text-red-700'
          : lifecycleStatusAtual === LifecycleStatusOportunidade.ARCHIVED
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : 'border-slate-200 bg-slate-100 text-slate-700';
  const engagementLabel =
    oportunidade?.engagement_signal === 'hot'
      ? 'Negociacao quente'
      : oportunidade?.engagement_signal === 'watch'
        ? 'Acompanhar'
        : 'Fluxo normal';
  const engagementBadgeClass =
    oportunidade?.engagement_signal === 'hot'
      ? 'border-red-200 bg-red-50 text-red-700'
      : oportunidade?.engagement_signal === 'watch'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-[#B4BEC9]/60 bg-[#F2F6F8] text-[#4B6272]';
  const nextActionStatusKey =
    oportunidade?.next_action_status && NEXT_ACTION_STATUS_LABEL[oportunidade.next_action_status]
      ? oportunidade.next_action_status
      : null;
  const nextActionStatusLabel = nextActionStatusKey
    ? NEXT_ACTION_STATUS_LABEL[nextActionStatusKey]
    : 'Sem proxima acao';
  const nextActionBadgeClass =
    nextActionStatusKey === 'overdue'
      ? 'border-red-200 bg-red-50 text-red-700'
      : nextActionStatusKey === 'due_soon'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  const contatoNome = (oportunidade?.nomeContato || oportunidade?.cliente?.nome || '').trim();
  const contatoEmpresa = (
    oportunidade?.empresaContato ||
    oportunidade?.cliente?.empresa ||
    oportunidade?.cliente?.nome ||
    ''
  ).trim();
  const contatoEmail = (oportunidade?.emailContato || oportunidade?.cliente?.email || '').trim();
  const contatoTelefone = (
    oportunidade?.telefoneContato ||
    oportunidade?.cliente?.telefone ||
    ''
  ).trim();
  const contatoEmailHref = contatoEmail ? `mailto:${contatoEmail}` : '';
  const contatoTelefoneHref = contatoTelefone
    ? `tel:${contatoTelefone.replace(/[^+\d]/g, '')}`
    : '';
  const usuariosById = useMemo(
    () => new Map(usuarios.map((item) => [String(item.id), item])),
    [usuarios],
  );
  const vendedoresEnvolvidos = useMemo<VendedorEnvolvidoView[]>(() => {
    const envolvidosMap = new Map<string, VendedorEnvolvidoView>();

    const adicionarVendedor = (input: {
      id?: string | null;
      nome?: string | null;
      origem: VendedorEnvolvidoView['origem'];
      papel?: string | null;
      vinculoId?: string | null;
    }) => {
      const normalizedId = String(input.id || '').trim();
      if (!normalizedId) return;

      const nomeResolved =
        String(input.nome || '').trim() || usuariosById.get(normalizedId)?.nome || 'Usuario';
      const current = envolvidosMap.get(normalizedId);
      if (current) {
        if (
          current.origem !== 'responsavel_principal' &&
          input.origem === 'responsavel_principal'
        ) {
          envolvidosMap.set(normalizedId, {
            ...current,
            nome: nomeResolved,
            origem: 'responsavel_principal',
            papel: undefined,
            vinculoId: undefined,
          });
        }
        return;
      }

      envolvidosMap.set(normalizedId, {
        id: normalizedId,
        nome: nomeResolved,
        origem: input.origem,
        papel: input.papel ? String(input.papel).trim() : undefined,
        vinculoId: input.vinculoId ? String(input.vinculoId).trim() : undefined,
      });
    };

    adicionarVendedor({
      id: oportunidade?.responsavel?.id,
      nome: oportunidade?.responsavel?.nome,
      origem: 'responsavel_principal',
    });

    vendedoresEnvolvidosPersistidos.forEach((item) => {
      adicionarVendedor({
        id: item.vendedorId,
        nome: item.nome,
        origem: 'vendedor_envolvido',
        papel: item.papel,
        vinculoId: item.id,
      });
    });

    return Array.from(envolvidosMap.values()).sort((a, b) => {
      if (a.origem === 'responsavel_principal' && b.origem !== 'responsavel_principal') return -1;
      if (b.origem === 'responsavel_principal' && a.origem !== 'responsavel_principal') return 1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });
  }, [
    oportunidade?.responsavel?.id,
    oportunidade?.responsavel?.nome,
    usuariosById,
    vendedoresEnvolvidosPersistidos,
  ]);
  const vendedoresDisponiveisParaApoio = useMemo(() => {
    if (!usuarios.length) return [];
    const envolvidosIds = new Set<string>();
    const responsavelPrincipalId = String(oportunidade?.responsavel?.id || '').trim();
    if (responsavelPrincipalId) {
      envolvidosIds.add(responsavelPrincipalId);
    }
    vendedoresEnvolvidosPersistidos.forEach((item) => {
      const vendedorId = String(item.vendedorId || '').trim();
      if (vendedorId) envolvidosIds.add(vendedorId);
    });
    return usuarios.filter((item) => !envolvidosIds.has(String(item.id)));
  }, [usuarios, oportunidade?.responsavel?.id, vendedoresEnvolvidosPersistidos]);
  const shouldShowPermanentDeleteAction =
    lifecycleFeatureEnabled && lifecycleStatusAtual === LifecycleStatusOportunidade.DELETED;
  const canInlineEditData =
    lifecycleStatusAtual !== LifecycleStatusOportunidade.ARCHIVED &&
    lifecycleStatusAtual !== LifecycleStatusOportunidade.DELETED;
  const canManageSupportSellers =
    lifecycleStatusAtual !== LifecycleStatusOportunidade.ARCHIVED &&
    lifecycleStatusAtual !== LifecycleStatusOportunidade.DELETED;
  const inlineStageOptions = useMemo(() => {
    const base = ETAPAS_PIPELINE.map((item) => item.estagio);
    if (base.includes(inlineEditForm.estagio)) {
      return base;
    }
    return [...base, inlineEditForm.estagio];
  }, [inlineEditForm.estagio]);
  const renderInlineEditTrigger = (label: string) => {
    if (inlineEditMode || !canInlineEditData) return null;
    return (
      <button
        type="button"
        onClick={handleAbrirEdicaoInline}
        aria-label={`Editar ${label}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-[#B4BEC9]/70 bg-white text-[#4B6272] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:bg-[#EEF5F8]"
        title={`Editar ${label}`}
      >
        <Edit3 className="h-3.5 w-3.5" />
      </button>
    );
  };
  const inlineAutoSaveBadgeClass =
    inlineAutoSaveStatus === 'saving'
      ? 'border-[#159A9C]/40 bg-[#DEEFE7] text-[#0F5F60]'
      : inlineAutoSaveStatus === 'saved'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : inlineAutoSaveStatus === 'dirty'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : inlineAutoSaveStatus === 'invalid'
            ? 'border-amber-200 bg-amber-50 text-amber-700'
            : inlineAutoSaveStatus === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-[#B4BEC9]/60 bg-[#F2F6F8] text-[#4B6272]';

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#B4BEC9]/35 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3 text-[#002333]/70">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#159A9C] border-t-transparent" />
          Carregando detalhes da oportunidade...
        </div>
      </div>
    );
  }

  if (error || !oportunidade) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 font-semibold">
          <AlertCircle className="h-5 w-5" />
          Nao foi possivel abrir a oportunidade
        </div>
        <p className="text-sm">{error || 'Registro nao encontrado.'}</p>
        <button
          type="button"
          onClick={handleVoltar}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar ao pipeline
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[#B4BEC9]/35 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleVoltar}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-1.5 text-sm font-medium text-[#1E3A4B] transition-colors hover:bg-[#DEEFE7]"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar ao pipeline
              </button>

              {inlineEditMode ? (
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6A7D89]">
                    Titulo da oportunidade
                  </span>
                  <input
                    type="text"
                    value={inlineEditForm.titulo}
                    onChange={(event) =>
                      setInlineEditForm((prev) => ({ ...prev, titulo: event.target.value }))
                    }
                    disabled={salvandoEdicaoInline}
                    className="w-full max-w-3xl rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-2xl font-bold text-[#0F2E43]"
                  />
                </label>
              ) : (
                <div className="group flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-[#0F2E43]">{oportunidade.titulo}</h1>
                  {renderInlineEditTrigger('titulo da oportunidade')}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm text-[#1E3A4B]/75">
                <span className="inline-flex items-center gap-1.5">
                  <User2 className="h-4 w-4 text-[#159A9C]" />
                  {inlineEditMode
                    ? usuariosById.get(String(inlineEditForm.responsavelId))?.nome ||
                      'Sem responsavel'
                    : oportunidade.responsavel?.nome || 'Sem responsavel'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-4 w-4 text-[#159A9C]" />
                  Criado em {formatarData(oportunidade.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => void handleClonarOportunidade(oportunidade)}
                disabled={inlineEditMode}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm font-medium text-[#1E3A4B] hover:bg-[#F4FAF7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Copy className="h-4 w-4 text-[#159A9C]" />
                Duplicar
              </button>

              {inlineEditMode && (
                <>
                  <span
                    className={`inline-flex items-center rounded-lg border px-3 py-2 text-xs font-semibold ${inlineAutoSaveBadgeClass}`}
                  >
                    {inlineAutoSaveStatus === 'saving'
                      ? 'Salvando...'
                      : inlineAutoSaveMessage}
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelarEdicaoInline}
                    disabled={salvandoEdicaoInline}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm font-semibold text-[#1E3A4B] hover:bg-[#F4FAF7] disabled:opacity-60"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </button>
                </>
              )}

              {canMarkOpportunityAsWon(oportunidade) && (
                <button
                  type="button"
                  disabled={loadingMudancaEstagio || inlineEditMode}
                  onClick={() => void handleMarcarOportunidadeComoGanha(oportunidade)}
                  className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Ganho
                </button>
              )}

              {canMarkOpportunityAsLost(oportunidade) && (
                <button
                  type="button"
                  disabled={loadingMudancaEstagio || inlineEditMode}
                  onClick={() => handlePrepararPerdaOportunidade(oportunidade)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <AlertCircle className="h-4 w-4" />
                  Perdido
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#D6E2E6] bg-white p-2 shadow-sm">
            <div className="w-full overflow-x-auto">
              <div className="flex min-w-[720px] overflow-hidden rounded-lg border border-[#D6E2E6]">
                {ETAPAS_PIPELINE.map((etapa, index) => {
                  const completed = etapaAtualIndex >= 0 && index < etapaAtualIndex;
                  const current = etapa.estagio === oportunidade.estagio;
                  const segmentClass = current
                    ? 'bg-[#159A9C] text-white'
                    : completed
                      ? 'bg-[#DEEFE7] text-[#0F5F60]'
                      : 'bg-white text-[#6A7D89]';

                  return (
                    <div
                      key={etapa.estagio}
                      aria-current={current ? 'step' : undefined}
                      className={`flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-semibold transition-colors ${segmentClass} ${
                        index > 0 ? 'border-l border-[#D6E2E6]' : ''
                      }`}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 opacity-80" />
                      ) : current ? (
                        <span className="h-2 w-2 rounded-full bg-white/80" />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-[#B4BEC9]" />
                      )}
                      <span className="truncate">{etapa.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-2 text-[11px] font-semibold text-[#6A7D89]">
              Etapa {Math.max(etapaAtualIndex + 1, 1)} de {ETAPAS_PIPELINE.length}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside>
          <div className="overflow-hidden rounded-2xl border border-[#B4BEC9]/35 bg-white shadow-sm">
            <section className="p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6A7D89]">
                Resumo comercial
              </h2>
              <div className="mt-3 space-y-3 text-sm text-[#1E3A4B]">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <Tag className="h-4 w-4 text-[#159A9C]" />
                    Estagio
                  </span>
                  {inlineEditMode ? (
                    <select
                      value={inlineEditForm.estagio}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({
                          ...prev,
                          estagio: event.target.value as EstagioOportunidade,
                        }))
                      }
                      disabled={salvandoEdicaoInline || lifecycleStatusAtual !== LifecycleStatusOportunidade.OPEN}
                      className="max-w-[180px] rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#1E3A4B]"
                    >
                      {inlineStageOptions.map((estagioOption) => (
                        <option key={estagioOption} value={estagioOption}>
                          {ESTAGIO_LABEL[estagioOption]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      <strong>{ESTAGIO_LABEL[oportunidade.estagio]}</strong>
                      {renderInlineEditTrigger('estagio')}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <AlertCircle className="h-4 w-4 text-[#159A9C]" />
                    Status
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${lifecycleStatusBadgeClass}`}
                  >
                    {lifecycleStatusLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <TrendingUp className="h-4 w-4 text-[#159A9C]" />
                    Probabilidade
                  </span>
                  {inlineEditMode ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={inlineEditForm.probabilidade}
                        onChange={(event) =>
                          setInlineEditForm((prev) => ({
                            ...prev,
                            probabilidade: event.target.value,
                          }))
                        }
                        disabled={salvandoEdicaoInline}
                        className="w-20 rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-right text-xs font-semibold text-[#1E3A4B]"
                      />
                      <span className="text-xs font-semibold text-[#4B6272]">%</span>
                    </div>
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      <strong>{oportunidade.probabilidade}%</strong>
                      {renderInlineEditTrigger('probabilidade')}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <FileText className="h-4 w-4 text-[#159A9C]" />
                    Valor
                  </span>
                  {inlineEditMode ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-[#4B6272]">R$</span>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={inlineEditForm.valor}
                        onChange={(event) =>
                          setInlineEditForm((prev) => ({ ...prev, valor: event.target.value }))
                        }
                        disabled={salvandoEdicaoInline}
                        className="w-28 rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-right text-xs font-semibold text-[#1E3A4B]"
                      />
                    </div>
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      <strong>{formatarMoeda(Number(oportunidade.valor || 0))}</strong>
                      {renderInlineEditTrigger('valor')}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6A7D89]">Prioridade</span>
                  {inlineEditMode ? (
                    <select
                      value={inlineEditForm.prioridade}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({
                          ...prev,
                          prioridade: event.target.value as PrioridadeOportunidade,
                        }))
                      }
                      disabled={salvandoEdicaoInline}
                      className="max-w-[180px] rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#1E3A4B]"
                    >
                      <option value={PrioridadeOportunidade.BAIXA}>Baixa</option>
                      <option value={PrioridadeOportunidade.MEDIA}>Media</option>
                      <option value={PrioridadeOportunidade.ALTA}>Alta</option>
                    </select>
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      <strong>{prioridadeLabel}</strong>
                      {renderInlineEditTrigger('prioridade')}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6A7D89]">Origem</span>
                  {inlineEditMode ? (
                    <select
                      value={inlineEditForm.origem}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({
                          ...prev,
                          origem: event.target.value as OrigemOportunidade,
                        }))
                      }
                      disabled={salvandoEdicaoInline}
                      className="max-w-[180px] rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#1E3A4B]"
                    >
                      {Object.entries(ORIGEM_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      <strong>{origemLabel}</strong>
                      {renderInlineEditTrigger('origem')}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <CalendarDays className="h-4 w-4 text-[#159A9C]" />
                    Fechamento previsto
                  </span>
                  {inlineEditMode ? (
                    <input
                      type="date"
                      value={inlineEditForm.dataFechamentoEsperado}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({
                          ...prev,
                          dataFechamentoEsperado: event.target.value,
                        }))
                      }
                      disabled={salvandoEdicaoInline}
                      className="rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#1E3A4B]"
                    />
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      <strong>{formatarData(oportunidade.dataFechamentoEsperado || null)}</strong>
                      {renderInlineEditTrigger('fechamento previsto')}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="border-t border-[#E1EAEE] p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6A7D89]">
                Contato e empresa
              </h2>
              <div className="mt-3 space-y-3 text-sm text-[#1E3A4B]">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <User2 className="h-4 w-4 text-[#159A9C]" />
                    Contato
                  </span>
                  {inlineEditMode ? (
                    <input
                      type="text"
                      value={inlineEditForm.nomeContato}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({ ...prev, nomeContato: event.target.value }))
                      }
                      disabled={salvandoEdicaoInline}
                      placeholder="Nome do contato"
                      className="w-[170px] rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#1E3A4B]"
                    />
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      <strong>{contatoNome || 'Nao informado'}</strong>
                      {renderInlineEditTrigger('contato')}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <Building2 className="h-4 w-4 text-[#159A9C]" />
                    Empresa
                  </span>
                  {inlineEditMode ? (
                    <input
                      type="text"
                      value={inlineEditForm.empresaContato}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({
                          ...prev,
                          empresaContato: event.target.value,
                        }))
                      }
                      disabled={salvandoEdicaoInline}
                      placeholder="Nome da empresa"
                      className="w-[170px] rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#1E3A4B]"
                    />
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      <strong>{contatoEmpresa || 'Nao informada'}</strong>
                      {renderInlineEditTrigger('empresa')}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <Mail className="h-4 w-4 text-[#159A9C]" />
                    E-mail
                  </span>
                  {inlineEditMode ? (
                    <input
                      type="email"
                      value={inlineEditForm.emailContato}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({
                          ...prev,
                          emailContato: event.target.value,
                        }))
                      }
                      disabled={salvandoEdicaoInline}
                      placeholder="email@empresa.com"
                      className="w-[170px] rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#1E3A4B]"
                    />
                  ) : (
                    <div className="group flex min-w-0 items-center gap-1.5">
                      {contatoEmailHref ? (
                        <a
                          href={contatoEmailHref}
                          className="max-w-[60%] truncate text-right font-semibold text-[#0F5F60] hover:underline"
                          title={contatoEmail}
                        >
                          {contatoEmail}
                        </a>
                      ) : (
                        <strong>Nao informado</strong>
                      )}
                      {renderInlineEditTrigger('e-mail de contato')}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <Phone className="h-4 w-4 text-[#159A9C]" />
                    Telefone
                  </span>
                  {inlineEditMode ? (
                    <input
                      type="text"
                      value={inlineEditForm.telefoneContato}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({
                          ...prev,
                          telefoneContato: event.target.value,
                        }))
                      }
                      disabled={salvandoEdicaoInline}
                      placeholder="(00) 00000-0000"
                      className="w-[170px] rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#1E3A4B]"
                    />
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      {contatoTelefoneHref ? (
                        <a
                          href={contatoTelefoneHref}
                          className="font-semibold text-[#0F5F60] hover:underline"
                          title={contatoTelefone}
                        >
                          {contatoTelefone}
                        </a>
                      ) : (
                        <strong>Nao informado</strong>
                      )}
                      {renderInlineEditTrigger('telefone de contato')}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="border-t border-[#E1EAEE] p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6A7D89]">
                Time comercial
              </h2>
              <div className="mt-3 space-y-3 text-sm text-[#1E3A4B]">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[#6A7D89]">
                    <User2 className="h-4 w-4 text-[#159A9C]" />
                    Responsavel principal
                  </span>
                  {inlineEditMode ? (
                    <select
                      value={inlineEditForm.responsavelId}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({
                          ...prev,
                          responsavelId: event.target.value,
                        }))
                      }
                      disabled={salvandoEdicaoInline || loadingUsuarios}
                      className="max-w-[180px] rounded-lg border border-[#B4BEC9]/70 bg-white px-2 py-1 text-xs font-semibold text-[#1E3A4B]"
                    >
                      <option value="">Selecione</option>
                      {usuarios.map((item) => (
                        <option key={String(item.id)} value={String(item.id)}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="group flex items-center gap-1.5">
                      <strong>{oportunidade.responsavel?.nome || 'Nao informado'}</strong>
                      {renderInlineEditTrigger('responsavel principal')}
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#6A7D89]">
                    Vendedores envolvidos
                  </p>
                  {loadingVendedoresEnvolvidos ? (
                    <p className="text-xs text-[#6A7D89]">Carregando vendedores envolvidos...</p>
                  ) : vendedoresEnvolvidos.length === 0 ? (
                    <p className="text-xs text-[#6A7D89]">
                      Nenhum vendedor adicional envolvido ate o momento.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {vendedoresEnvolvidos.map((item) => (
                        <div
                          key={item.id}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            item.origem === 'responsavel_principal'
                              ? 'border-[#159A9C]/40 bg-[#DEEFE7] text-[#0F5F60]'
                              : 'border-[#B4BEC9]/60 bg-[#F2F6F8] text-[#4B6272]'
                          }`}
                        >
                          <span>
                            {item.nome}
                            {item.papel ? ` - ${item.papel.replace(/_/g, ' ')}` : ''}
                          </span>
                          {item.origem === 'vendedor_envolvido' && (
                            <button
                              type="button"
                              onClick={() => void handleRemoverVendedorApoio(item.id)}
                              disabled={
                                inlineEditMode ||
                                !canManageSupportSellers ||
                                removendoVendedorApoioId !== null &&
                                removendoVendedorApoioId !== item.id
                              }
                              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#B4BEC9]/70 bg-white text-[10px] leading-none text-[#4B6272] hover:bg-[#EEF5F8] disabled:opacity-50"
                              title="Remover vendedor da oportunidade"
                            >
                              {removendoVendedorApoioId === item.id ? '...' : 'x'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 rounded-lg border border-[#E1EAEE] bg-[#F8FBFD] p-3">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-[#4B6272]">
                    Incluir vendedor de apoio
                    <select
                      value={vendedorApoioId}
                      onChange={(event) => setVendedorApoioId(event.target.value)}
                      disabled={
                        inlineEditMode ||
                        !canManageSupportSellers ||
                        loadingUsuarios ||
                        adicionandoVendedorApoio ||
                        loadingVendedoresEnvolvidos
                      }
                      className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                    >
                      <option value="">Selecione um vendedor</option>
                      {vendedoresDisponiveisParaApoio.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void handleAdicionarVendedorApoio()}
                    disabled={
                      inlineEditMode ||
                      !canManageSupportSellers ||
                      !vendedorApoioId ||
                      adicionandoVendedorApoio ||
                      loadingVendedoresEnvolvidos ||
                      vendedoresDisponiveisParaApoio.length === 0
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#127E80] disabled:opacity-60"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {adicionandoVendedorApoio ? 'Incluindo...' : 'Incluir vendedor'}
                  </button>
                  <p className="text-[11px] text-[#6A7D89]">
                    O vinculo fica salvo na oportunidade e, quando disponivel, gera notificacao para o vendedor
                    envolvido.
                  </p>
                </div>
              </div>
            </section>

            <section className="border-t border-[#E1EAEE] p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6A7D89]">
                Radar comercial
              </h2>
              <div className="mt-3 space-y-3 text-sm text-[#1E3A4B]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6A7D89]">Engajamento</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${engagementBadgeClass}`}
                  >
                    {engagementLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#6A7D89]">Proxima acao</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                      nextActionStatusKey
                        ? nextActionBadgeClass
                        : 'border-[#B4BEC9]/60 bg-[#F2F6F8] text-[#4B6272]'
                    }`}
                  >
                    {nextActionStatusLabel}
                  </span>
                </div>
                {oportunidade.next_action_at && (
                  <p className="text-xs text-[#4B6272]">
                    {TIPO_ATIVIDADE_LABEL[
                      (oportunidade.next_action_type || TipoAtividade.TAREFA) as TipoAtividade
                    ] || 'Atividade'}{' '}
                    em {formatarDataHora(oportunidade.next_action_at)}
                  </p>
                )}
                {oportunidade.next_action_description && (
                  <p className="rounded-lg border border-[#D6E2E6] bg-[#F8FBFD] px-2 py-1 text-xs text-[#4B6272]">
                    {oportunidade.next_action_description}
                  </p>
                )}
                {oportunidade.is_stale && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                    Oportunidade parada ha {oportunidade.stale_days ?? 0} dia(s).
                  </p>
                )}
              </div>
            </section>

            <section className="border-t border-[#E1EAEE] p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#6A7D89]">
                Ciclo de vida
              </h2>
              <div className="mt-3 space-y-1 text-xs text-[#4B6272]">
                <p>
                  Status atual: <strong>{lifecycleStatusLabel}</strong>
                </p>
                {lifecycleStatusAtual === LifecycleStatusOportunidade.ARCHIVED &&
                  oportunidade.archived_at && (
                    <p>Arquivada em {formatarDataHora(oportunidade.archived_at)}</p>
                  )}
                {lifecycleStatusAtual === LifecycleStatusOportunidade.DELETED &&
                  oportunidade.deleted_at && (
                    <p>Enviada para lixeira em {formatarDataHora(oportunidade.deleted_at)}</p>
                  )}
                {oportunidade.reopened_at && (
                  <p>Ultima reabertura em {formatarDataHora(oportunidade.reopened_at)}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {podeArquivar && (
                  <button
                    type="button"
                    disabled={inlineEditMode}
                    onClick={() => void handleArquivarOportunidade(oportunidade)}
                    className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A4B] hover:bg-[#F4FAF7] disabled:opacity-60"
                  >
                    Arquivar
                  </button>
                )}
                {podeRestaurar && (
                  <button
                    type="button"
                    disabled={inlineEditMode}
                    onClick={() => void handleRestaurarOportunidade(oportunidade)}
                    className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A4B] hover:bg-[#F4FAF7] disabled:opacity-60"
                  >
                    Restaurar
                  </button>
                )}
                {podeReabrir && (
                  <button
                    type="button"
                    disabled={inlineEditMode}
                    onClick={() => void handleReabrirOportunidade(oportunidade)}
                    className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A4B] hover:bg-[#F4FAF7] disabled:opacity-60"
                  >
                    Reabrir
                  </button>
                )}
                {shouldShowPermanentDeleteAction ? (
                  <button
                    type="button"
                    disabled={inlineEditMode}
                    onClick={() => void handleExcluirOportunidadePermanente(oportunidade)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir permanente
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={inlineEditMode}
                    onClick={() => void handleExcluirOportunidade(oportunidade)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {lifecycleFeatureEnabled ? 'Enviar para lixeira' : 'Excluir'}
                  </button>
                )}
              </div>
              <p className="mt-3 text-[11px] text-[#6A7D89]">
                Acoes respeitam as regras do pipeline e do ciclo de vida para evitar transicoes
                invalidas.
              </p>
            </section>
          </div>
        </aside>

        <div className="rounded-2xl border border-[#B4BEC9]/35 bg-white shadow-sm">
          <div className="border-b border-[#D6E2E6] px-3 py-2 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setWorkspaceTab('resumo')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  workspaceTab === 'resumo'
                    ? 'bg-[#159A9C] text-white'
                    : 'bg-[#F2F6F8] text-[#4B6272] hover:bg-[#E8EFF3]'
                }`}
              >
                Resumo
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceTab('atividades')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  workspaceTab === 'atividades'
                    ? 'bg-[#159A9C] text-white'
                    : 'bg-[#F2F6F8] text-[#4B6272] hover:bg-[#E8EFF3]'
                }`}
              >
                Atividades ({atividades.length})
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceTab('historico')}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  workspaceTab === 'historico'
                    ? 'bg-[#159A9C] text-white'
                    : 'bg-[#F2F6F8] text-[#4B6272] hover:bg-[#E8EFF3]'
                }`}
              >
                Historico
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {workspaceTab === 'resumo' && (
              <div className="space-y-4">
                {eventContext && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-[#1E3A4B]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                      Contexto de evento
                    </p>
                    <p className="mt-1 font-semibold text-[#0F2E43]">{eventContext.title}</p>
                    <p className="mt-1">Data: {formatarDataHora(eventContext.dataEvento)}</p>
                  </div>
                )}

                <div className="rounded-xl border border-[#D6E2E6] bg-[#F8FBFD] p-4">
                  <div className="group flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#0F2E43]">Descricao</p>
                    {renderInlineEditTrigger('descricao')}
                  </div>
                  {inlineEditMode ? (
                    <textarea
                      value={inlineEditForm.descricao}
                      onChange={(event) =>
                        setInlineEditForm((prev) => ({
                          ...prev,
                          descricao: event.target.value,
                        }))
                      }
                      disabled={salvandoEdicaoInline}
                      rows={6}
                      placeholder="Detalhes da oportunidade, contexto e proximos passos."
                      className="mt-2 w-full rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                    />
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-[#1E3A4B]/85">
                      {oportunidade.descricao?.trim() || 'Sem descricao registrada.'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {workspaceTab === 'atividades' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#D6E2E6] bg-[#F8FBFD] p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {COMPOSER_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => applyComposerTemplate(tab.id)}
                        disabled={salvandoAtividade}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                          composer.template === tab.id
                            ? 'border-[#159A9C] bg-[#159A9C] text-white'
                            : 'border-[#B4BEC9]/70 bg-white text-[#4B6272] hover:bg-[#EEF5F8]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
                    <label
                      className={`flex flex-col gap-1 text-xs font-semibold text-[#4B6272] ${
                        composerTemplateConfig.showDate || composerTemplateConfig.showTime
                          ? 'md:col-span-3'
                          : 'md:col-span-6'
                      }`}
                    >
                      {composerTemplateConfig.titleLabel}
                      <input
                        type="text"
                        value={composer.titulo}
                        onChange={(event) =>
                          setComposer((prev) => ({ ...prev, titulo: event.target.value }))
                        }
                        disabled={salvandoAtividade}
                        placeholder={composerTemplateConfig.titlePlaceholder}
                        className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                      />
                    </label>

                    {composerTemplateConfig.showDate && (
                      <label className="flex flex-col gap-1 text-xs font-semibold text-[#4B6272]">
                        Data
                        <input
                          type="date"
                          value={composer.data}
                          onChange={(event) =>
                            setComposer((prev) => ({ ...prev, data: event.target.value }))
                          }
                          disabled={salvandoAtividade}
                          className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                        />
                      </label>
                    )}

                    {composerTemplateConfig.showTime && (
                      <label className="flex flex-col gap-1 text-xs font-semibold text-[#4B6272]">
                        Inicio
                        <input
                          type="time"
                          value={composer.horaInicio}
                          onChange={(event) =>
                            setComposer((prev) => ({ ...prev, horaInicio: event.target.value }))
                          }
                          disabled={salvandoAtividade}
                          className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                        />
                      </label>
                    )}

                    {composerTemplateConfig.showTime && (
                      <label className="flex flex-col gap-1 text-xs font-semibold text-[#4B6272]">
                        Fim
                        <input
                          type="time"
                          value={composer.horaFim}
                          onChange={(event) =>
                            setComposer((prev) => ({ ...prev, horaFim: event.target.value }))
                          }
                          disabled={salvandoAtividade}
                          className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                        />
                      </label>
                    )}

                    {composerTemplateConfig.showResponsavel && (
                      <label className="md:col-span-3 flex flex-col gap-1 text-xs font-semibold text-[#4B6272]">
                        Responsavel
                        <select
                          value={composer.responsavelId}
                          onChange={(event) =>
                            setComposer((prev) => ({ ...prev, responsavelId: event.target.value }))
                          }
                          disabled={salvandoAtividade}
                          className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                        >
                          <option value="">Sem responsavel definido</option>
                          {usuarios.map((userOption) => (
                            <option key={userOption.id} value={userOption.id}>
                              {userOption.nome}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {composerTemplateConfig.showPrioridade && (
                      <label className="md:col-span-3 flex flex-col gap-1 text-xs font-semibold text-[#4B6272]">
                        Prioridade
                        <select
                          value={composer.prioridade}
                          onChange={(event) =>
                            setComposer((prev) => ({
                              ...prev,
                              prioridade: event.target.value as ComposerPrioridade,
                            }))
                          }
                          disabled={salvandoAtividade}
                          className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                        >
                          <option value="baixa">Baixa</option>
                          <option value="media">Media</option>
                          <option value="alta">Alta</option>
                        </select>
                      </label>
                    )}

                    {composerTemplateConfig.showMeetingFields && (
                      <>
                        <label className="md:col-span-3 flex flex-col gap-1 text-xs font-semibold text-[#4B6272]">
                          Local
                          <input
                            type="text"
                            value={composer.local}
                            onChange={(event) =>
                              setComposer((prev) => ({ ...prev, local: event.target.value }))
                            }
                            disabled={salvandoAtividade}
                            placeholder="Sala comercial / endereco"
                            className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                          />
                        </label>
                        <label className="md:col-span-3 flex flex-col gap-1 text-xs font-semibold text-[#4B6272]">
                          Link da videochamada
                          <input
                            type="url"
                            value={composer.videochamada}
                            onChange={(event) =>
                              setComposer((prev) => ({
                                ...prev,
                                videochamada: event.target.value,
                              }))
                            }
                            disabled={salvandoAtividade}
                            placeholder="https://meet.google.com/..."
                            className="rounded-lg border border-[#B4BEC9]/70 bg-white px-3 py-2 text-sm text-[#1E3A4B]"
                          />
                        </label>
                      </>
                    )}

                    <label className="md:col-span-6 flex flex-col gap-1 text-xs font-semibold text-[#4B6272]">
                      {composerTemplateConfig.descriptionLabel}
                      <RichTextToolbarField
                        value={composer.descricao}
                        onChange={(nextValue) =>
                          setComposer((prev) => ({ ...prev, descricao: nextValue }))
                        }
                        disabled={salvandoAtividade}
                        rows={5}
                        placeholder={composerTemplateConfig.descriptionPlaceholder}
                        helperText={
                          composer.template === 'anotacao'
                            ? 'As anotacoes ficam visiveis para o time comercial da oportunidade.'
                            : undefined
                        }
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleCriarAtividade()}
                      disabled={salvandoAtividade}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-3 py-2 text-sm font-semibold text-white hover:bg-[#127E80] disabled:opacity-60"
                    >
                      <Plus className="h-4 w-4" />
                      {salvandoAtividade ? 'Salvando...' : COMPOSER_SUBMIT_LABEL[composer.template]}
                    </button>
                  </div>
                </div>

                {loadingAtividades ? (
                  <div className="rounded-xl border border-[#D6E2E6] bg-white px-4 py-10 text-center text-sm text-[#4B6272]">
                    Carregando atividades...
                  </div>
                ) : atividades.length === 0 ? (
                  <div className="rounded-xl border border-[#D6E2E6] bg-white px-4 py-10 text-center text-sm text-[#4B6272]">
                    Nenhuma atividade registrada ainda.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {atividades.map((atividade) => {
                      const concluida = isAtividadeConcluida(atividade);
                      const Icone = getAtividadeIcon(atividade.tipo);
                      const descricaoRenderizada = parseDescricaoAtividade(atividade.descricao);
                      return (
                        <article
                          key={String(atividade.id)}
                          className="rounded-xl border border-[#D6E2E6] bg-white p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="mt-0.5 rounded-md bg-[#159A9C] p-1.5 text-white">
                                <Icone className="h-3.5 w-3.5" />
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-[#0F2E43]">
                                  {TIPO_ATIVIDADE_LABEL[atividade.tipo as TipoAtividade] ||
                                    String(atividade.tipo)}
                                </p>
                                <div
                                  className="mt-1 text-sm text-[#1E3A4B]/85 [&_a]:text-[#0F7B7D] [&_a]:underline [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc"
                                  dangerouslySetInnerHTML={{
                                    __html: markdownToHtml(
                                      descricaoRenderizada.principal || atividade.descricao,
                                    ),
                                  }}
                                />
                                {descricaoRenderizada.detalhes.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {descricaoRenderizada.detalhes.map((detalhe) => (
                                      <span
                                        key={`${atividade.id}-${detalhe}`}
                                        className="rounded-full border border-[#D1DEE6] bg-[#F5FAFD] px-2 py-0.5 text-[11px] font-semibold text-[#4B6272]"
                                      >
                                        {detalhe}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {!concluida && atividade.tipo !== TipoAtividade.NOTA && (
                              <button
                                type="button"
                                onClick={() => void handleConcluirAtividade(atividade)}
                                disabled={concluindoAtividadeId === atividade.id}
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                              >
                                {concluindoAtividadeId === atividade.id
                                  ? 'Concluindo...'
                                  : 'Concluir'}
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {workspaceTab === 'historico' && (
              <div className="space-y-3">
                {loadingHistorico ? (
                  <div className="rounded-xl border border-[#D6E2E6] bg-white px-4 py-10 text-center text-sm text-[#4B6272]">
                    Carregando historico...
                  </div>
                ) : historicoEstagios.length === 0 ? (
                  <div className="rounded-xl border border-[#D6E2E6] bg-white px-4 py-10 text-center text-sm text-[#4B6272]">
                    Nenhuma movimentacao de estagio encontrada.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {historicoEstagios.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-xl border border-[#D6E2E6] bg-white px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-[#0F2E43]">
                          {item.fromStage
                            ? `${ESTAGIO_LABEL[item.fromStage]} -> ${ESTAGIO_LABEL[item.toStage]}`
                            : `Entrada em ${ESTAGIO_LABEL[item.toStage]}`}
                        </p>
                        <p className="mt-1 text-xs text-[#6A7D89]">
                          {item.changedBy?.nome || 'Sistema'} - {formatarDataHora(item.changedAt)}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {showModalMotivoPerda && oportunidadeParaPerder && (
        <ModalMotivoPerda
          isOpen={showModalMotivoPerda}
          onClose={() => {
            setShowModalMotivoPerda(false);
            setOportunidadeParaPerder(null);
            setErroMotivoPerda(null);
          }}
          onConfirm={handleConfirmarPerda}
          tituloOportunidade={oportunidadeParaPerder.titulo}
          valorOportunidade={oportunidadeParaPerder.valor}
          loading={loadingMudancaEstagio}
          errorMessage={erroMotivoPerda}
        />
      )}
    </div>
  );
};

export default OportunidadeDetalhePage;


