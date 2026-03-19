import React, { useState } from 'react';
import {
  BaseModal,
  FormField,
  FormInput,
  FormTextarea,
  ModalButton,
} from '../../../components/modals/BaseModal';
import { toastService } from '../../../services/toastService';
import {
  Pencil,
  Mail,
  MessageSquare,
  Download,
  Share2,
  Loader2,
  FileText,
  CreditCard,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Star,
} from 'lucide-react';
import { emailServiceReal } from '../../../services/emailServiceReal';
import { PropostaCompleta } from '../services/propostasService';
import { clientesService } from '../../../services/clientesService';
import { DadosProposta, pdfPropostasService } from '../../../services/pdfPropostasService';
import { portalClienteService } from '../../../services/portalClienteService';
import { contratoService } from '../../../services/contratoService';
import {
  faturamentoService,
  FormaPagamento,
  TipoFatura,
} from '../../../services/faturamentoService';
import { propostasService as propostasApiService } from '../../../services/propostasService';
import { authService } from '../../../services/authService';
import { empresaConfigService } from '../../../services/empresaConfigService';
import { minhasEmpresasService } from '../../../services/minhasEmpresasService';
import { useNavigate } from 'react-router-dom';
import ModalEnviarWhatsApp from '../../../components/whatsapp/ModalEnviarWhatsApp';
import { triggerSalesCelebration } from '../../../components/feedback/SalesCelebrationHost';
import { useGlobalConfirmation } from '../../../contexts/GlobalConfirmationContext';
import {
  MENSAGEM_PROPOSTA_SEM_ITENS,
  extrairItensComerciaisDaProposta,
  propostaPossuiItensComerciais,
} from '../utils/propostaItens';

type ClienteContatoData = {
  id?: string;
  nome: string;
  email: string;
  telefone: string;
  empresa?: string;
};

type EmpresaPdfData = {
  nome: string;
  email?: string;
  telefone?: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  logo?: string;
};

const CLIENTE_DETAILS_TTL = 5 * 60 * 1000; // 5 minutos
const CLIENTE_DETAILS_COOLDOWN_TTL = 30 * 1000; // Evita loop de erros
const CLIENTE_DETAILS_MIN_INTERVAL_MS = 300; // Debounce/throttle curto entre buscas
const EMPRESA_DETAILS_TTL = 5 * 60 * 1000; // 5 minutos
const AUTOMACAO_FLUXO_MENSAGEM =
  'Automacao de contrato/fatura ainda indisponivel nesta versao. Use os modulos de Contratos e Faturamento.';
const OBSERVACOES_OPERACIONAIS_REGEX = [
  /^proposta enviada por e-?mail/i,
  /^proposta enviada via e-?mail/i,
  /^proposta enviada por whatsapp/i,
  /^status alterado /i,
  /^solicitacao automatica /i,
  /^gerada automaticamente /i,
];
const clienteDetailsCache = new Map<
  string,
  { data: ClienteContatoData | null; expiresAt: number }
>();
const clienteDetailsPending = new Map<string, Promise<ClienteContatoData | null>>();
const empresaDetailsCache = new Map<string, { data: EmpresaPdfData; expiresAt: number }>();
const empresaDetailsPending = new Map<string, Promise<EmpresaPdfData>>();
let lastClienteLookupAt = 0;

const normalizarNomeCliente = (nome: string) => nome.trim().toLowerCase();
const normalizarDocumento = (value: unknown) => String(value || '').replace(/\D/g, '');
const DATA_ISO_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATA_BR_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

const formatarDataLocalIso = (date: Date): string => {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const normalizarDataIsoSemTimezone = (value: unknown, fallback: Date): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatarDataLocalIso(value);
  }

  const text = String(value || '').trim();
  if (!text) {
    return formatarDataLocalIso(fallback);
  }

  if (DATA_ISO_REGEX.test(text)) {
    return text;
  }

  const matchBr = text.match(DATA_BR_REGEX);
  if (matchBr) {
    const [, dia, mes, ano] = matchBr;
    return `${ano}-${mes}-${dia}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return formatarDataLocalIso(fallback);
  }

  return formatarDataLocalIso(parsed);
};

const armazenarNoCache = (nome: string, data: ClienteContatoData | null, ttl: number) => {
  const normalizado = normalizarNomeCliente(nome);
  clienteDetailsCache.set(normalizado, {
    data,
    expiresAt: Date.now() + ttl,
  });
};

const obterClienteNoCache = (nome: string): ClienteContatoData | null | undefined => {
  const normalizado = normalizarNomeCliente(nome);
  const cache = clienteDetailsCache.get(normalizado);

  if (!cache) {
    return undefined;
  }

  if (cache.expiresAt < Date.now()) {
    clienteDetailsCache.delete(normalizado);
    return undefined;
  }

  return cache.data;
};

const aguardarJanelaBuscaCliente = async () => {
  const agora = Date.now();
  const diff = agora - lastClienteLookupAt;
  if (diff < CLIENTE_DETAILS_MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, CLIENTE_DETAILS_MIN_INTERVAL_MS - diff));
  }
  lastClienteLookupAt = Date.now();
};

const buscarClienteComCache = async (nome: string): Promise<ClienteContatoData | null> => {
  if (!nome) {
    return null;
  }

  const normalizado = normalizarNomeCliente(nome);

  const cache = obterClienteNoCache(normalizado);
  if (cache !== undefined) {
    return cache;
  }

  const promessaExistente = clienteDetailsPending.get(normalizado);
  if (promessaExistente) {
    return promessaExistente;
  }

  const promessa = (async () => {
    try {
      if (clientesService.isSearchRateLimited()) {
        const cooldownMs = Math.max(
          CLIENTE_DETAILS_COOLDOWN_TTL,
          clientesService.getSearchCooldownRemaining(),
        );
        console.warn(
          `Busca de clientes em cooldown (${cooldownMs}ms restantes). Ignorando requisicao para "${nome}".`,
        );
        armazenarNoCache(nome, null, cooldownMs);
        return null;
      }

      await aguardarJanelaBuscaCliente();
      let clientes = await clientesService.searchClientes(nome);

      if ((!clientes || clientes.length === 0) && nome.includes(' ')) {
        const termoAlternativo = nome
          .split(' ')
          .map((parte) => parte.trim())
          .filter((parte) => parte.length >= 3)
          .sort((a, b) => b.length - a.length)[0];

        if (termoAlternativo && termoAlternativo.toLowerCase() !== nome.toLowerCase()) {
          if (clientesService.isSearchRateLimited()) {
            console.warn(
              `Busca de clientes interrompida por cooldown durante variacao do nome "${nome}".`,
            );
          } else {
            await aguardarJanelaBuscaCliente();
            clientes = await clientesService.searchClientes(termoAlternativo);
          }
        }
      }

      if (clientes && clientes.length > 0) {
        const clienteExato = clientes.find(
          (c) => c.nome?.toLowerCase().trim() === nome.toLowerCase().trim(),
        );

        const clienteEncontrado = clienteExato || clientes[0];

        const data: ClienteContatoData = {
          id:
            typeof clienteEncontrado.id === 'string' && clienteEncontrado.id.trim()
              ? clienteEncontrado.id
              : undefined,
          nome: clienteEncontrado.nome || nome,
          email: clienteEncontrado.email || '',
          telefone: clienteEncontrado.telefone || '',
        };

        armazenarNoCache(nome, data, CLIENTE_DETAILS_TTL);
        return data;
      }

      armazenarNoCache(nome, null, CLIENTE_DETAILS_COOLDOWN_TTL);
      return null;
    } catch (error) {
      const status = (error as any)?.response?.status;
      if (status === 429) {
        console.warn(
          `Limite de requisicoes atingido ao buscar cliente "${nome}". Aplicando cooldown curto.`,
        );
        const cooldownMs = Math.max(
          CLIENTE_DETAILS_COOLDOWN_TTL,
          clientesService.getSearchCooldownRemaining() || CLIENTE_DETAILS_COOLDOWN_TTL,
        );
        armazenarNoCache(nome, null, cooldownMs);
      }
      return null;
    } finally {
      clienteDetailsPending.delete(normalizado);
    }
  })();

  clienteDetailsPending.set(normalizado, promessa);
  return promessa;
};

const toTextoNaoVazio = (value: unknown): string | undefined => {
  const text = String(value || '').trim();
  return text || undefined;
};

const normalizarLogoEmpresaPdf = (value: unknown): string | undefined => {
  const logo = String(value || '').trim();
  if (!logo) {
    return undefined;
  }

  if (logo.startsWith('data:image/')) {
    return logo;
  }

  if (/^https?:\/\//i.test(logo)) {
    return logo;
  }

  if (logo.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${logo}`;
  }

  if (typeof window !== 'undefined' && /^\.?\/?[\w\-./]+$/.test(logo) && /[/.]/.test(logo)) {
    const caminhoNormalizado = logo.replace(/^\.?\//, '');
    return `${window.location.origin}/${caminhoNormalizado}`;
  }

  return undefined;
};

const formatarEnderecoEmpresaPdf = (
  enderecoRaw: unknown,
): { endereco?: string; cidade?: string; estado?: string; cep?: string } => {
  if (!enderecoRaw) {
    return {};
  }

  if (typeof enderecoRaw === 'string') {
    return { endereco: toTextoNaoVazio(enderecoRaw) };
  }

  if (typeof enderecoRaw !== 'object') {
    return {};
  }

  const enderecoObj = enderecoRaw as Record<string, unknown>;
  const rua = toTextoNaoVazio(enderecoObj.rua);
  const numero = toTextoNaoVazio(enderecoObj.numero);
  const complemento = toTextoNaoVazio(enderecoObj.complemento);
  const bairro = toTextoNaoVazio(enderecoObj.bairro);
  const cidade = toTextoNaoVazio(enderecoObj.cidade);
  const estado = toTextoNaoVazio(enderecoObj.estado);
  const cep = toTextoNaoVazio(enderecoObj.cep);

  const partesEndereco = [rua, numero, complemento, bairro].filter(
    (item): item is string => Boolean(item),
  );

  return {
    endereco: partesEndereco.length > 0 ? partesEndereco.join(', ') : undefined,
    cidade,
    estado,
    cep,
  };
};

const armazenarEmpresaNoCache = (key: string, data: EmpresaPdfData) => {
  empresaDetailsCache.set(key, {
    data,
    expiresAt: Date.now() + EMPRESA_DETAILS_TTL,
  });
};

const obterEmpresaNoCache = (key: string): EmpresaPdfData | undefined => {
  const cache = empresaDetailsCache.get(key);
  if (!cache) {
    return undefined;
  }
  if (cache.expiresAt < Date.now()) {
    empresaDetailsCache.delete(key);
    return undefined;
  }
  return cache.data;
};

const montarEnderecoEmpresaLinha = (empresa: EmpresaPdfData): string => {
  const cidadeEstado = [empresa.cidade, empresa.estado].filter(
    (value): value is string => Boolean(value && value.trim()),
  );
  const partes = [empresa.endereco, cidadeEstado.join(' - ') || undefined, empresa.cep].filter(
    (value): value is string => Boolean(value && value.trim()),
  );
  return partes.join(' | ');
};

// Tipo uniao para aceitar tanto PropostaCompleta quanto o formato da UI
type PropostaUI = {
  id: string;
  numero: string;
  cliente: string;
  cliente_contato: string;
  titulo: string;
  valor: number;
  status: string;
  data_criacao: string;
  data_vencimento: string;
  data_aprovacao: string | null;
  vendedor: string;
  descricao: string;
  probabilidade: number;
  categoria: string;
  aprovacaoInterna?: {
    obrigatoria?: boolean;
    status?: 'nao_requer' | 'pendente' | 'aprovada' | 'rejeitada' | string;
    motivo?: string;
    limiteDesconto?: number;
    descontoDetectado?: number;
    observacoes?: string;
  };
  lembretes?: Array<{
    id: string;
    status?: 'agendado' | 'enviado' | 'cancelado' | string;
  }>;
};

interface PropostaActionsProps {
  proposta: PropostaCompleta | PropostaUI;
  onEditProposta?: (proposta: PropostaCompleta | PropostaUI) => void;
  onPropostaUpdated?: () => void;
  className?: string;
  showLabels?: boolean;
  actionScope?: 'all' | 'share' | 'flow';
}

type PromptDialogState = {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmText: string;
  cancelText: string;
  value: string;
  required?: boolean;
  multiline?: boolean;
  inputType?: 'text' | 'email';
  error?: string;
  confirmVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  validate?: (value: string) => string | null;
};

type PlanoComponentePdf = {
  childItemId: string;
  componentRole: 'included' | 'required' | 'optional' | 'recommended' | 'addon';
  quantity?: number;
  nome?: string;
};

const componentRoleLabelsPdf: Record<PlanoComponentePdf['componentRole'], string> = {
  included: 'Incluido',
  required: 'Obrigatorio',
  optional: 'Opcional',
  recommended: 'Recomendado',
  addon: 'Add-on',
};

const PropostaActions: React.FC<PropostaActionsProps> = ({
  proposta,
  onEditProposta,
  onPropostaUpdated,
  className = '',
  showLabels = false,
  actionScope = 'all',
}) => {
  const navigate = useNavigate();
  const { confirm } = useGlobalConfirmation();
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [clienteData, setClienteData] = useState<{
    nome: string;
    email: string;
    telefone: string;
  } | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [propostaPdfBuffer, setPropostaPdfBuffer] = useState<Uint8Array | null>(null);
  const [empresaNomeExibicao, setEmpresaNomeExibicao] = useState(
    () => toTextoNaoVazio(authService.getUser()?.empresa?.nome) || 'Sua empresa',
  );

  // NOVOS ESTADOS PARA AUTOMACAO
  const [gerandoContrato, setGerandoContrato] = useState(false);
  const [criandoFatura, setCriandoFatura] = useState(false);
  const [avancandoFluxo, setAvancandoFluxo] = useState(false);
  const [definindoComoPrincipal, setDefinindoComoPrincipal] = useState(false);
  const [decidindoAlcadaAprovacao, setDecidindoAlcadaAprovacao] = useState(false);
  const [decidindoAlcadaReprovacao, setDecidindoAlcadaReprovacao] = useState(false);
  const [promptDialog, setPromptDialog] = useState<PromptDialogState | null>(null);
  const propostaCompletaCacheRef = React.useRef<PropostaCompleta | null>(
    proposta && typeof (proposta as any).cliente === 'object'
      ? (proposta as PropostaCompleta)
      : null,
  );
  const promptResolverRef = React.useRef<((value: string | null) => void) | null>(null);

  // Funcao para detectar se e PropostaCompleta ou PropostaUI
  const isPropostaCompleta = (prop: PropostaCompleta | PropostaUI): prop is PropostaCompleta => {
    return 'cliente' in prop && typeof prop.cliente === 'object';
  };

  React.useEffect(() => {
    propostaCompletaCacheRef.current = isPropostaCompleta(proposta) ? proposta : null;
  }, [proposta]);

  React.useEffect(() => {
    return () => {
      if (promptResolverRef.current) {
        promptResolverRef.current(null);
        promptResolverRef.current = null;
      }
    };
  }, []);

  const closePromptDialog = React.useCallback(() => {
    if (promptResolverRef.current) {
      promptResolverRef.current(null);
      promptResolverRef.current = null;
    }
    setPromptDialog(null);
  }, []);

  const askForInput = React.useCallback(
    (
      config: Omit<PromptDialogState, 'isOpen' | 'value' | 'error'> & {
        defaultValue?: string;
      },
    ) =>
      new Promise<string | null>((resolve) => {
        promptResolverRef.current = resolve;
        setPromptDialog({
          ...config,
          isOpen: true,
          value: config.defaultValue ?? '',
          error: undefined,
        });
      }),
    [],
  );

  const submitPromptDialog = React.useCallback(() => {
    if (!promptDialog || !promptResolverRef.current) {
      setPromptDialog(null);
      return;
    }

    const normalizedValue = promptDialog.value.trim();

    if (promptDialog.required && !normalizedValue) {
      setPromptDialog((current) =>
        current ? { ...current, error: 'Este campo e obrigatorio.' } : current,
      );
      return;
    }

    if (promptDialog.validate) {
      const validationError = promptDialog.validate(normalizedValue);
      if (validationError) {
        setPromptDialog((current) =>
          current ? { ...current, error: validationError } : current,
        );
        return;
      }
    }

    const resolver = promptResolverRef.current;
    promptResolverRef.current = null;
    setPromptDialog(null);
    resolver(normalizedValue);
  }, [promptDialog]);

  const obterAprovacaoInterna = () => {
    const source = proposta as any;
    return source?.aprovacaoInterna || source?.emailDetails?.aprovacaoInterna || null;
  };

  const aprovacaoInternaAtual = obterAprovacaoInterna();
  const possuiAprovacaoPendente = Boolean(
    aprovacaoInternaAtual?.obrigatoria && aprovacaoInternaAtual?.status === 'pendente',
  );
  const bloqueadoPorAlcada = possuiAprovacaoPendente;

  const getUsuarioAtualAprovador = () => {
    try {
      const user = authService.getUser() as any;
      if (!user) {
        return { id: undefined, nome: 'Aprovador' };
      }
      return {
        id: user.id || user.userId || undefined,
        nome: user.nome || user.name || user.email || 'Aprovador',
      };
    } catch {
      return { id: undefined, nome: 'Aprovador' };
    }
  };

  const clienteDataBase = React.useMemo<ClienteContatoData>(() => {
    if (isPropostaCompleta(proposta)) {
      return {
        nome: proposta.cliente?.nome || 'Cliente',
        email: proposta.cliente?.email || '',
        telefone: proposta.cliente?.telefone || '',
      };
    }

    const nome = proposta.cliente || 'Cliente';
    const contato = String(proposta.cliente_contato || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const telefoneRegex = /\d{8,}/;

    return {
      nome,
      email: emailRegex.test(contato) ? contato : '',
      telefone: !emailRegex.test(contato) && telefoneRegex.test(contato) ? contato : '',
    };
  }, [proposta]);

  React.useEffect(() => {
    setClienteData(clienteDataBase);
  }, [clienteDataBase]);

  // Busca remota apenas sob demanda (acoes como email/whatsapp)
  const getClienteData = async (options?: { allowLookup?: boolean }) => {
    const dadosLocais = clienteDataBase;
    if (!options?.allowLookup) {
      return dadosLocais;
    }

    const nome = dadosLocais.nome || 'Cliente';
    const email = dadosLocais.email || '';
    const telefone = dadosLocais.telefone || '';

    const isEmailFicticio =
      email.includes('@cliente.com') ||
      email.includes('@cliente.temp') ||
      email.includes('@email.com');
    const precisaBuscarDadosReais = Boolean(nome && nome !== 'Cliente' && (isEmailFicticio || !email || !telefone));

    if (!precisaBuscarDadosReais) {
      return dadosLocais;
    }

    const dadosReais = await buscarClienteComCache(nome);
    if (!dadosReais) {
      return dadosLocais;
    }

    const dadosResolvidos: ClienteContatoData = {
      nome: dadosReais.nome || nome,
      email: dadosReais.email || email,
      telefone: dadosReais.telefone || telefone,
    };
    setClienteData(dadosResolvidos);
    return dadosResolvidos;
  };

  const getEmpresaDataPdf = async (): Promise<EmpresaPdfData> => {
    const usuarioLogado = authService.getUser();
    const empresaId = String(
      usuarioLogado?.empresa?.id || localStorage.getItem('empresaAtiva') || '',
    ).trim();
    const cacheKey = empresaId || 'empresa-default';

    const cache = obterEmpresaNoCache(cacheKey);
    if (cache) {
      return cache;
    }

    const pending = empresaDetailsPending.get(cacheKey);
    if (pending) {
      return pending;
    }

    const promise = (async () => {
      const empresaData: EmpresaPdfData = {
        nome: toTextoNaoVazio(usuarioLogado?.empresa?.nome) || 'Sua empresa',
        cnpj: toTextoNaoVazio(usuarioLogado?.empresa?.cnpj),
      };

      try {
        const config = (await empresaConfigService.getConfig()) as Record<string, any>;
        const geral = (config?.geral || {}) as Record<string, any>;

        const logoConfig =
          config?.logoUrl || config?.logo || geral?.logoUrl || geral?.logo;
        const emailConfig = config?.email || geral?.email || config?.smtpUsuario;
        const telefoneConfig = config?.telefone || geral?.telefone || config?.whatsappNumero;
        const enderecoConfig = config?.endereco || geral?.endereco;
        const cidadeConfig = config?.cidade || geral?.cidade;
        const estadoConfig = config?.estado || geral?.estado;
        const cepConfig = config?.cep || geral?.cep;
        const nomeConfig = config?.nome || geral?.nome;

        if (toTextoNaoVazio(nomeConfig)) {
          empresaData.nome = toTextoNaoVazio(nomeConfig) || empresaData.nome;
        }

        empresaData.logo = normalizarLogoEmpresaPdf(logoConfig) || empresaData.logo;
        empresaData.email = toTextoNaoVazio(emailConfig) || empresaData.email;
        empresaData.telefone = toTextoNaoVazio(telefoneConfig) || empresaData.telefone;
        empresaData.endereco = toTextoNaoVazio(enderecoConfig) || empresaData.endereco;
        empresaData.cidade = toTextoNaoVazio(cidadeConfig) || empresaData.cidade;
        empresaData.estado = toTextoNaoVazio(estadoConfig) || empresaData.estado;
        empresaData.cep = toTextoNaoVazio(cepConfig) || empresaData.cep;
      } catch {
        // Mantem fallback local quando config da empresa nao estiver disponivel.
      }

      if (empresaId) {
        try {
          const empresaCompleta = await minhasEmpresasService.getEmpresaById(empresaId);
          const enderecoDetalhado = formatarEnderecoEmpresaPdf(empresaCompleta?.endereco);
          const logoDetalhe = normalizarLogoEmpresaPdf(
            (empresaCompleta as any)?.configuracoes?.geral?.logo ||
              (empresaCompleta as any)?.configuracoes?.logo,
          );

          empresaData.nome = toTextoNaoVazio(empresaCompleta?.nome) || empresaData.nome;
          empresaData.cnpj = toTextoNaoVazio(empresaCompleta?.cnpj) || empresaData.cnpj;
          empresaData.email = toTextoNaoVazio(empresaCompleta?.email) || empresaData.email;
          empresaData.telefone = toTextoNaoVazio(empresaCompleta?.telefone) || empresaData.telefone;
          empresaData.endereco = enderecoDetalhado.endereco || empresaData.endereco;
          empresaData.cidade = enderecoDetalhado.cidade || empresaData.cidade;
          empresaData.estado = enderecoDetalhado.estado || empresaData.estado;
          empresaData.cep = enderecoDetalhado.cep || empresaData.cep;
          empresaData.logo = logoDetalhe || empresaData.logo;
        } catch {
          // Mantem dados ja obtidos; sem bloquear geracao do PDF.
        }
      }

      armazenarEmpresaNoCache(cacheKey, empresaData);
      return empresaData;
    })();

    empresaDetailsPending.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      empresaDetailsPending.delete(cacheKey);
    }
  };

  // Funcao para extrair dados da proposta independente do formato
  const getPropostaData = (fonte?: PropostaCompleta | PropostaUI) => {
    const propostaAtual = fonte || proposta;

    if (isPropostaCompleta(propostaAtual)) {
      return {
        id: propostaAtual.id || null,
        numero: propostaAtual.numero || 'N/A',
        total: propostaAtual.total || 0,
        dataValidade: propostaAtual.dataValidade
          ? normalizarDataIsoSemTimezone(propostaAtual.dataValidade, new Date())
          : normalizarDataIsoSemTimezone(undefined, new Date()),
        titulo: propostaAtual.titulo || 'Proposta comercial',
        status: propostaAtual.status || 'rascunho',
      };
    } else {
      return {
        id: propostaAtual.id || null,
        numero: propostaAtual.numero || 'N/A',
        total: (propostaAtual as any).valor || 0,
        dataValidade: normalizarDataIsoSemTimezone(propostaAtual.data_vencimento, new Date()),
        titulo: propostaAtual.titulo || 'Proposta comercial',
        status: propostaAtual.status || 'rascunho',
      };
    }
  };

  const statusFluxoAtual = String(getPropostaData().status || '')
    .trim()
    .toLowerCase();
  const oportunidadeVinculada = (proposta as any)?.oportunidade;
  const ehPropostaPrincipal = Boolean((proposta as any)?.isPropostaPrincipal);
  const podeDefinirComoPrincipal = Boolean(oportunidadeVinculada?.id) && !ehPropostaPrincipal;
  const editavelComoRascunho = statusFluxoAtual === 'rascunho';
  const statusEncerradoSemAcoesComerciais = ['rejeitada', 'expirada', 'pago'].includes(
    statusFluxoAtual,
  );
  const extrairHistoricoPayload = (response: any) => {
    if (!response || typeof response !== 'object') {
      return null;
    }

    if ('success' in response) {
      return (response as any).data || null;
    }

    return response;
  };
  const enriquecerFonteComItens = async (fonteBase: any, propostaIdValue?: string | null) => {
    let fonte = fonteBase;
    const propostaIdNormalizado = String(propostaIdValue || '')
      .trim();
    if (!propostaIdNormalizado) {
      return fonte;
    }

    try {
      const propostaDetalhada = await propostasApiService.findById(propostaIdNormalizado);
      if (propostaDetalhada) {
        fonte = {
          ...fonte,
          ...propostaDetalhada,
          cliente: (propostaDetalhada as any).cliente || fonte.cliente,
          vendedor: (propostaDetalhada as any).vendedor || fonte.vendedor,
        };
      }
    } catch (error) {
      console.warn('Nao foi possivel validar itens detalhados da proposta:', error);
    }

    if (propostaPossuiItensComerciais(fonte)) {
      return fonte;
    }

    try {
      const historicoResponse = await propostasApiService.obterHistoricoProposta(propostaIdNormalizado);
      const historicoData = extrairHistoricoPayload(historicoResponse);
      const versoesHistorico = Array.isArray(historicoData?.versoes) ? historicoData.versoes : [];
      if (versoesHistorico.length > 0) {
        const ultimaVersao = versoesHistorico[versoesHistorico.length - 1];
        fonte = {
          ...fonte,
          versoes: versoesHistorico,
          snapshot: ultimaVersao?.snapshot || fonte.snapshot,
          emailDetails: {
            ...(fonte?.emailDetails && typeof fonte.emailDetails === 'object'
              ? fonte.emailDetails
              : {}),
            versoes: versoesHistorico,
          },
        };
      }
    } catch (error) {
      console.warn('Nao foi possivel carregar historico da proposta para validar itens:', error);
    }

    return fonte;
  };
  const bloquearAcaoSemItens = async (acao: string) => {
    let propostaFonte: any = proposta;
    if (!propostaPossuiItensComerciais(propostaFonte)) {
      const propostaId = (proposta as any)?.id || getPropostaData().id;
      if (propostaId) {
        propostaFonte = await enriquecerFonteComItens(propostaFonte, String(propostaId));
      }
    }

    if (propostaPossuiItensComerciais(propostaFonte)) {
      return false;
    }

    toastService.error(`${acao}: ${MENSAGEM_PROPOSTA_SEM_ITENS}`);
    return true;
  };

  const formatarDataIso = (value: unknown, fallback: Date) => {
    return normalizarDataIsoSemTimezone(value, fallback);
  };

  const normalizarTextoComparacao = (value: unknown) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

  const formatarTelefoneBr = (value: unknown) => {
    const cleaned = String(value || '').replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return String(value || '').trim();
  };

  const normalizarComponentesPlanoPdf = (value: unknown): PlanoComponentePdf[] => {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((raw) => {
        if (!raw || typeof raw !== 'object') {
          return null;
        }

        const record = raw as Record<string, unknown>;
        const childItemId = String(record.childItemId || record.child_item_id || '').trim();
        if (!childItemId) {
          return null;
        }

        const componentRoleRaw = String(record.componentRole || record.component_role || 'included');
        const componentRole = (
          ['included', 'required', 'optional', 'recommended', 'addon'].includes(componentRoleRaw)
            ? componentRoleRaw
            : 'included'
        ) as PlanoComponentePdf['componentRole'];

        const quantity = Number(record.quantity);

        return {
          childItemId,
          componentRole,
          quantity: Number.isFinite(quantity) ? quantity : undefined,
          nome: typeof record.nome === 'string' ? record.nome : undefined,
        } as PlanoComponentePdf;
      })
      .filter((item): item is PlanoComponentePdf => Boolean(item));
  };

  const montarDescricaoComposicaoPlanoPdf = (
    componentesPlano: PlanoComponentePdf[],
    limit = 6,
  ): string | undefined => {
    if (!Array.isArray(componentesPlano) || componentesPlano.length === 0) {
      return undefined;
    }

    const linhas = componentesPlano.slice(0, limit).map((componente) => {
      const nome = componente.nome?.trim() || 'Item da composicao';
      const quantidade =
        typeof componente.quantity === 'number' && componente.quantity > 1
          ? ` x${componente.quantity}`
          : '';
      const papel = componentRoleLabelsPdf[componente.componentRole || 'included'] || 'Incluido';
      return `- ${nome}${quantidade} (${papel})`;
    });

    if (componentesPlano.length > limit) {
      linhas.push(`- +${componentesPlano.length - limit} componente(s) adicional(is)`);
    }

    return `Composicao do plano:\n${linhas.join('\n')}`;
  };

  const montarDescricaoItemPdf = (
    descricaoBase: string,
    tipoItem: unknown,
    componentesPlano: PlanoComponentePdf[],
  ): string | undefined => {
    const partes: string[] = [];
    if (descricaoBase) {
      partes.push(descricaoBase);
    }

    const tipoItemNormalizado = String(tipoItem || '')
      .trim()
      .toLowerCase();
    const temComposicao = Array.isArray(componentesPlano) && componentesPlano.length > 0;
    const descricaoJaTemComposicao = descricaoBase.toLowerCase().includes('composicao do plano');
    if ((tipoItemNormalizado === 'plano' || temComposicao) && !descricaoJaTemComposicao) {
      const descricaoComposicao = montarDescricaoComposicaoPlanoPdf(componentesPlano);
      if (descricaoComposicao) {
        partes.push(descricaoComposicao);
      }
    }

    const descricaoFinal = partes.join('\n\n').trim();
    return descricaoFinal || undefined;
  };

  const descreverFormaPagamentoPdf = (formaPagamento: unknown, parcelas?: unknown) => {
    const normalized = String(formaPagamento || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
    const normalizedKey = normalized.replace(/[^a-z0-9]/g, '');
    const numeroParcelas = Number(parcelas || 0);

    if (
      ['avista', 'aovista', 'pagamentoavista'].includes(normalizedKey) ||
      normalized.includes('a vista')
    ) {
      return 'A vista';
    }
    if (['boleto', 'boletobancario'].includes(normalizedKey)) {
      return 'Boleto bancario';
    }
    if (
      ['cartao', 'cartaocredito', 'creditcard', 'cartaodecredito'].includes(normalizedKey) ||
      normalized.includes('cartao')
    ) {
      return 'Cartao de credito';
    }
    if (normalizedKey === 'pix') {
      return 'PIX';
    }
    if (['parcelado', 'parcelamento', 'parcelas', 'parceladoem'].includes(normalizedKey)) {
      return numeroParcelas > 1 ? `Parcelado em ate ${numeroParcelas}x` : 'Parcelado';
    }

    return 'Conforme negociacao comercial';
  };

  const montarDadosPdfProposta = async (): Promise<DadosProposta> => {
    const cliente = await getClienteData({ allowLookup: true });
    const propostaData = getPropostaData();
    const propostaId = (proposta as any)?.id || propostaData.id;

    let fonteProposta: any = proposta as any;
    let itensOriginais = extrairItensComerciaisDaProposta(fonteProposta);

    if (itensOriginais.length === 0 && propostaId) {
      fonteProposta = await enriquecerFonteComItens(fonteProposta, String(propostaId));
      itensOriginais = extrairItensComerciaisDaProposta(fonteProposta);
    }

    if (!propostaPossuiItensComerciais(fonteProposta)) {
      throw new Error(MENSAGEM_PROPOSTA_SEM_ITENS);
    }

    const roundMoney = (value: unknown) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return 0;
      }
      return Math.round((numeric + Number.EPSILON) * 100) / 100;
    };

    const itens = itensOriginais.map((item: any, index: number) => {
      const produto = item?.produto && typeof item.produto === 'object' ? item.produto : item;
      const nome = String(
        produto?.nome ||
          produto?.titulo ||
          item?.nome ||
          item?.produtoNome ||
          item?.descricao ||
          `Item ${index + 1}`,
      ).trim();
      const quantidade = Math.max(0.01, Number(item?.quantidade ?? produto?.quantidade ?? 1));
      const valorUnitario = Math.max(
        0,
        Number(
          item?.precoUnitario ??
            item?.valorUnitario ??
            produto?.precoUnitario ??
            produto?.valorUnitario ??
            produto?.preco ??
            0,
        ),
      );
      const desconto = Math.max(0, Number(item?.desconto ?? produto?.desconto ?? 0));
      const valorTotalCalculado = valorUnitario * quantidade * (1 - desconto / 100);
      const valorTotal = Number(item?.subtotal ?? item?.valorTotal ?? valorTotalCalculado);
      const tipoItem = item?.tipoItem ?? produto?.tipoItem;
      const componentesPlano = normalizarComponentesPlanoPdf(
        item?.componentesPlano ??
          item?.componentes ??
          produto?.componentesPlano ??
          produto?.componentes,
      );
      const descricaoBase = String(
        produto?.descricao || item?.descricao || item?.detalhes || item?.observacoes || '',
      ).trim();

      return {
        nome,
        descricao: montarDescricaoItemPdf(descricaoBase, tipoItem, componentesPlano),
        quantidade,
        unidade:
          String(produto?.unidade || item?.unidade || item?.unidadeMedida || 'un').trim() || 'un',
        valorUnitario,
        desconto,
        valorTotal: roundMoney(Number.isFinite(valorTotal) ? valorTotal : valorTotalCalculado),
      };
    });

    const clampPercent = (value: unknown) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return 0;
      }
      return Math.min(100, Math.max(0, numeric));
    };

    const subtotalCalculado = roundMoney(
      itens.reduce((sum, item) => sum + Number(item.valorTotal || 0), 0),
    );
    const descontoRaw = Number(
      fonteProposta?.descontoGlobal ?? fonteProposta?.percentualDesconto ?? 0,
    );
    const impostosRaw = Number(
      fonteProposta?.impostos ?? fonteProposta?.percentualImpostos ?? 0,
    );

    const descontoGeral =
      Number.isFinite(descontoRaw) && descontoRaw > 100
        ? roundMoney(Math.max(0, descontoRaw))
        : roundMoney(subtotalCalculado * (clampPercent(descontoRaw) / 100));
    const subtotalPosDesconto = roundMoney(Math.max(0, subtotalCalculado - descontoGeral));
    let impostos =
      Number.isFinite(impostosRaw) && impostosRaw > 100
        ? roundMoney(Math.max(0, impostosRaw))
        : roundMoney(subtotalPosDesconto * (clampPercent(impostosRaw) / 100));

    const valorTotalEsperado = roundMoney(
      fonteProposta?.total ??
        propostaData.total ??
        fonteProposta?.valor ??
        subtotalPosDesconto + impostos,
    );
    let valorTotal = roundMoney(subtotalPosDesconto + impostos);
    const deltaTotal = roundMoney(valorTotalEsperado - valorTotal);

    if (Math.abs(deltaTotal) >= 0.01) {
      impostos = roundMoney(Math.max(0, impostos + deltaTotal));
      valorTotal = roundMoney(subtotalPosDesconto + impostos);
    }

    const subtotal = subtotalCalculado;
    const validadeDias = Number(fonteProposta?.validadeDias || 30);

    const dataEmissaoFonte =
      fonteProposta?.criadaEm ||
      fonteProposta?.createdAt ||
      fonteProposta?.data_criacao ||
      fonteProposta?.created_at;
    const dataValidadeFonte =
      fonteProposta?.dataValidade || fonteProposta?.data_vencimento || fonteProposta?.dataVencimento;
    const clienteFonte =
      fonteProposta?.cliente && typeof fonteProposta.cliente === 'object'
        ? fonteProposta.cliente
        : undefined;
    const vendedorFonte =
      fonteProposta?.vendedor && typeof fonteProposta.vendedor === 'object'
        ? fonteProposta.vendedor
        : undefined;
    const statusFonte = String(
      fonteProposta?.status || propostaData.status || 'rascunho',
    )
      .trim()
      .toLowerCase();
    const dataEmissaoIso = formatarDataIso(dataEmissaoFonte, new Date());
    const dataValidadeIso = formatarDataIso(
      dataValidadeFonte,
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );
    const dataEmissaoDate = new Date(dataEmissaoIso);
    const dataValidadeDate = new Date(dataValidadeIso);
    const diasPorPeriodo =
      !Number.isNaN(dataEmissaoDate.getTime()) && !Number.isNaN(dataValidadeDate.getTime())
        ? Math.max(
            1,
            Math.ceil(
              (dataValidadeDate.getTime() - dataEmissaoDate.getTime()) / (1000 * 60 * 60 * 24),
            ),
          )
        : undefined;
    const validadeProposta =
      diasPorPeriodo && Number.isFinite(diasPorPeriodo)
        ? `${diasPorPeriodo} dias corridos`
        : Number.isFinite(validadeDias) && validadeDias > 0
          ? `${validadeDias} dias corridos`
          : undefined;

    const descricaoRaw = String(fonteProposta?.descricao || '').trim();
    const observacoesRaw = String(fonteProposta?.observacoes || '').trim();
    const descricaoNormalizada = normalizarTextoComparacao(descricaoRaw);
    const observacoesNormalizada = normalizarTextoComparacao(observacoesRaw);
    const descricaoFinal =
      descricaoRaw && descricaoNormalizada !== observacoesNormalizada ? descricaoRaw : undefined;
    const observacoesFiltradas = observacoesRaw
      .split(/\r?\n/)
      .map((linha) => linha.trim())
      .filter((linha) => linha.length > 0)
      .filter(
        (linha) =>
          !OBSERVACOES_OPERACIONAIS_REGEX.some((regex) =>
            regex.test(normalizarTextoComparacao(linha)),
          ),
      );
    const observacoesFinal =
      observacoesFiltradas.length > 0 ? observacoesFiltradas.join('\n') : undefined;
    const empresaPdf = await getEmpresaDataPdf();
    const documentoClienteRaw = String(
      clienteFonte?.documento || (cliente as any)?.documento || '',
    ).trim();
    const documentoClienteNormalizado = normalizarDocumento(documentoClienteRaw);
    const tipoDocumentoCliente =
      documentoClienteNormalizado.length === 11
        ? 'CPF'
        : documentoClienteNormalizado.length === 14
          ? 'CNPJ'
          : documentoClienteRaw
            ? 'Documento'
            : undefined;
    const vendedorNomeFallback =
      String(
        vendedorFonte?.nome ||
          fonteProposta?.vendedor ||
          fonteProposta?.vendedorNome ||
          (proposta as any)?.vendedor ||
          '',
      ).trim() || 'Equipe comercial';
    const vendedorEmailFallback =
      String(
        vendedorFonte?.email || (proposta as any)?.vendedorEmail || '',
      ).trim() ||
      empresaPdf.email ||
      'comercial@empresa.com';

    return {
      numeroProposta: propostaData.numero,
      titulo: propostaData.titulo || 'Proposta Comercial',
      descricao: descricaoFinal,
      observacoes: observacoesFinal,
      status: statusFonte as DadosProposta['status'],
      dataEmissao: dataEmissaoIso,
      dataValidade: dataValidadeIso,
      empresa: {
        nome: empresaPdf.nome || 'Sua empresa',
        cnpj: empresaPdf.cnpj,
        email: empresaPdf.email,
        telefone: empresaPdf.telefone,
        endereco: empresaPdf.endereco,
        cidade: empresaPdf.cidade,
        estado: empresaPdf.estado,
        cep: empresaPdf.cep,
        logo: empresaPdf.logo,
      },
      cliente: {
        nome: String(clienteFonte?.nome || cliente.nome || '').trim() || 'Cliente',
        email: String(clienteFonte?.email || cliente.email || '').trim(),
        telefone: formatarTelefoneBr(clienteFonte?.telefone || cliente.telefone),
        empresa: String(clienteFonte?.empresa || (cliente as any)?.empresa || '').trim() || undefined,
        documento: documentoClienteRaw || undefined,
        tipoDocumento: tipoDocumentoCliente,
      },
      vendedor: {
        nome: vendedorNomeFallback,
        email: vendedorEmailFallback,
        telefone: formatarTelefoneBr(vendedorFonte?.telefone),
      },
      itens,
      subtotal: subtotal,
      descontoGeral: Number.isFinite(descontoGeral) ? descontoGeral : 0,
      percentualDesconto:
        subtotal > 0 && Number.isFinite(descontoGeral) ? (descontoGeral / subtotal) * 100 : 0,
      impostos: Number.isFinite(impostos) ? impostos : 0,
      valorTotal: Number.isFinite(valorTotal) ? valorTotal : subtotalCalculado,
      formaPagamento: descreverFormaPagamentoPdf(
        fonteProposta?.formaPagamento,
        fonteProposta?.parcelas,
      ),
      validadeProposta,
      condicoesGerais: [],
    };
  };

  const sincronizarStatusProposta = async (
    novoStatus:
      | 'rascunho'
      | 'enviada'
      | 'visualizada'
      | 'negociacao'
      | 'aprovada'
      | 'contrato_gerado'
      | 'contrato_assinado'
      | 'fatura_criada'
      | 'aguardando_pagamento'
      | 'pago'
      | 'rejeitada'
      | 'expirada',
    options?: { observacoes?: string; motivoPerda?: string; source?: string },
  ) => {
    const propostaData = getPropostaData();
    const propostaId = (proposta as any)?.id || propostaData.id;
    if (!propostaId) {
      return;
    }

    try {
      await propostasApiService.updateStatus(propostaId, novoStatus, {
        source: options?.source || 'fluxo',
        observacoes: options?.observacoes,
        motivoPerda: options?.motivoPerda,
      });
    } catch (error) {
      const mensagemErro = getErrorMessage(error, 'Erro ao sincronizar status da proposta.');
      const exigeAprovacaoInterna =
        novoStatus === 'aprovada' &&
        String(mensagemErro || '')
          .toLowerCase()
          .includes('aprovacao interna');

      if (exigeAprovacaoInterna) {
        try {
          await propostasApiService.solicitarAprovacaoInterna(propostaId, {
            solicitadaPorId:
              isPropostaCompleta(proposta) && proposta.vendedor?.id ? proposta.vendedor.id : undefined,
            solicitadaPorNome:
              isPropostaCompleta(proposta) && proposta.vendedor?.nome
                ? proposta.vendedor.nome
                : 'Fluxo comercial',
            observacoes:
              options?.observacoes ||
              'Solicitacao automatica de aprovacao por alcada durante tentativa de aprovar proposta.',
          });
          toastService.info(
            'A proposta exige aprovacao interna por desconto. Solicitacao enviada para aprovacao.',
          );

          window.dispatchEvent(
            new CustomEvent('propostaAtualizada', {
              detail: {
                propostaId,
                novoStatus: 'negociacao',
                fonte: 'aprovacao-interna',
                timestamp: new Date().toISOString(),
              },
            }),
          );
          return;
        } catch (erroSolicitacao) {
          throw new Error(
            getErrorMessage(
              erroSolicitacao,
              'Nao foi possivel solicitar aprovacao interna para esta proposta.',
            ),
          );
        }
      }

      throw error;
    }

    if (novoStatus === 'aprovada') {
      const propostaData = getPropostaData();
      const tituloProposta =
        String(propostaData.titulo || propostaData.numero || 'Proposta comercial').trim() ||
        'Proposta comercial';
      triggerSalesCelebration({
        kind: 'proposta-aprovada',
        subtitle: `"${tituloProposta}" foi aprovada.`,
      });
    }

    window.dispatchEvent(
      new CustomEvent('propostaAtualizada', {
        detail: {
          propostaId,
          novoStatus,
          motivoPerda: options?.motivoPerda,
          fonte: options?.source || 'fluxo',
          timestamp: new Date().toISOString(),
        },
      }),
    );
  };

  // NOVAS FUNCOES DE AUTOMACAO
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const isUuid = (value?: string | null): value is string =>
    Boolean(value && UUID_REGEX.test(String(value).trim()));

  const isNumericId = (value?: string | number | null) => /^\d+$/.test(String(value ?? '').trim());

  const formatDateOnly = (value: Date | string) => {
    const parsed = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return parsed.toISOString().split('T')[0];
  };

  const addDays = (base: Date, days: number) => {
    const copy = new Date(base);
    copy.setDate(copy.getDate() + days);
    return copy;
  };

  const getErrorMessage = (error: unknown, fallback: string) => {
    const err = error as any;
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      (Array.isArray(err?.response?.data?.errors) ? err.response.data.errors.join(', ') : null);
    return message || err?.message || fallback;
  };

  const carregarPropostaCompletaAutomacao = async (): Promise<PropostaCompleta | null> => {
    if (propostaCompletaCacheRef.current) {
      return propostaCompletaCacheRef.current;
    }

    const propostaId = String((proposta as any)?.id || getPropostaData().id || '').trim();
    if (!isUuid(propostaId)) {
      return null;
    }

    const mergeComPropostaAtual = (payload: any): PropostaCompleta => {
      const base = (proposta as any) || {};
      return {
        ...(base as any),
        ...(payload as any),
        cliente: (payload as any)?.cliente ?? base?.cliente,
        vendedor: (payload as any)?.vendedor ?? base?.vendedor,
        produtos:
          Array.isArray((payload as any)?.produtos) && (payload as any).produtos.length > 0
            ? (payload as any).produtos
            : Array.isArray(base?.produtos)
              ? base.produtos
              : [],
      } as PropostaCompleta;
    };

    try {
      const propostaDetalhada = await propostasApiService.findById(propostaId);
      if (propostaDetalhada && typeof propostaDetalhada === 'object') {
        const propostaCompleta = mergeComPropostaAtual(propostaDetalhada);
        propostaCompletaCacheRef.current = propostaCompleta;
        return propostaCompleta;
      }
    } catch (error) {
      console.warn('Falha ao carregar proposta detalhada para automacao via findById:', error);
    }

    try {
      const propostas = await propostasApiService.findAll();
      const propostaLista = Array.isArray(propostas)
        ? propostas.find((item) => String((item as any)?.id || '').trim() === propostaId)
        : null;
      if (propostaLista && typeof propostaLista === 'object') {
        const propostaCompleta = mergeComPropostaAtual(propostaLista);
        propostaCompletaCacheRef.current = propostaCompleta;
        return propostaCompleta;
      }
    } catch (error) {
      console.warn('Falha no fallback de automacao via lista de propostas:', error);
    }

    return null;
  };

  const resolverClienteIdAutomacao = async (propostaCompleta: PropostaCompleta): Promise<string | null> => {
    const clientePayload = (propostaCompleta as any)?.cliente;
    const candidatoDireto = [
      propostaCompleta.cliente?.id,
      (propostaCompleta as any)?.clienteId,
      (propostaCompleta as any)?.cliente_id,
      clientePayload && typeof clientePayload === 'object' ? (clientePayload as any)?.clienteId : null,
      clientePayload && typeof clientePayload === 'object' ? (clientePayload as any)?.idCliente : null,
      (propostaCompleta as any)?.emailDetails?.clienteId,
    ]
      .map((value) => String(value || '').trim())
      .find((value) => isUuid(value));

    if (candidatoDireto) {
      return candidatoDireto;
    }

    const emailCliente = String((clientePayload as any)?.email || '').trim().toLowerCase();
    const documentoCliente = normalizarDocumento((clientePayload as any)?.documento);
    const nomeCliente =
      typeof clientePayload === 'string'
        ? clientePayload.trim()
        : String((clientePayload as any)?.nome || (proposta as any)?.cliente || '').trim();

    try {
      const termosBusca = [emailCliente, documentoCliente, nomeCliente]
        .map((termo) => String(termo || '').trim())
        .filter((termo, index, source) => termo.length >= 3 && source.indexOf(termo) === index);

      for (const termo of termosBusca) {
        const pagina = await clientesService.getClientes({ search: termo, limit: 100, page: 1 });
        const clientes = Array.isArray(pagina?.data) ? pagina.data : [];
        const clienteExato =
          clientes.find((cliente) => {
            const id = String(cliente?.id || '').trim();
            if (!isUuid(id)) {
              return false;
            }

            const emailMatch =
              emailCliente &&
              String(cliente.email || '')
                .trim()
                .toLowerCase() === emailCliente;
            const documentoMatch =
              documentoCliente &&
              normalizarDocumento(cliente.documento || '') === documentoCliente;
            const nomeMatch =
              nomeCliente &&
              normalizarNomeCliente(cliente.nome || '') === normalizarNomeCliente(nomeCliente);

            return Boolean(emailMatch || documentoMatch || nomeMatch);
          }) ||
          clientes.find((cliente) => isUuid(String(cliente?.id || '').trim()));

        if (clienteExato?.id && isUuid(String(clienteExato.id).trim())) {
          return String(clienteExato.id).trim();
        }
      }
    } catch (error) {
      console.warn('Falha ao resolver cliente via listagem paginada:', error);
    }

    if (!nomeCliente) {
      return null;
    }

    const clienteComCache = await buscarClienteComCache(nomeCliente);
    if (isUuid(clienteComCache?.id || null)) {
      return String(clienteComCache?.id).trim();
    }

    try {
      const clientesEncontrados = await clientesService.searchClientes(nomeCliente);
      const clienteExato =
        clientesEncontrados.find(
          (cliente) =>
            normalizarNomeCliente(cliente.nome || '') === normalizarNomeCliente(nomeCliente),
        ) || clientesEncontrados[0];

      const clienteId = String(clienteExato?.id || '').trim();
      return isUuid(clienteId) ? clienteId : null;
    } catch {
      return null;
    }
  };

  const resolverUsuarioResponsavelIdAutomacao = (propostaCompleta: PropostaCompleta): string | null => {
    const vendedorPayload = (propostaCompleta as any)?.vendedor;
    const candidatoDireto = [
      propostaCompleta.vendedor?.id,
      (propostaCompleta as any)?.vendedorId,
      (propostaCompleta as any)?.vendedor_id,
      (propostaCompleta as any)?.usuarioResponsavelId,
      vendedorPayload && typeof vendedorPayload === 'object'
        ? (vendedorPayload as any)?.usuarioResponsavelId
        : null,
      (propostaCompleta as any)?.emailDetails?.usuarioResponsavelId,
    ]
      .map((value) => String(value || '').trim())
      .find((value) => isUuid(value));

    if (candidatoDireto) {
      return candidatoDireto;
    }

    try {
      const usuarioAtual = authService.getUser() as any;
      const usuarioAtualId = String(usuarioAtual?.id || usuarioAtual?.userId || '').trim();
      return isUuid(usuarioAtualId) ? usuarioAtualId : null;
    } catch {
      return null;
    }
  };

  const obterContextoAutomacao = async () => {
    const propostaCompleta =
      (isPropostaCompleta(proposta) ? proposta : null) || (await carregarPropostaCompletaAutomacao());

    if (!propostaCompleta) {
      throw new Error(
        'Nao foi possivel carregar os dados completos da proposta. Atualize a lista e tente novamente.',
      );
    }

    const propostaId = propostaCompleta.id || String((proposta as any)?.id || '').trim();
    const clienteId = await resolverClienteIdAutomacao(propostaCompleta);
    const usuarioResponsavelId = resolverUsuarioResponsavelIdAutomacao(propostaCompleta);

    if (!isUuid(propostaId)) {
      throw new Error('Proposta sem ID valido para gerar contrato/fatura.');
    }

    if (!isUuid(clienteId)) {
      throw new Error(
        'Cliente da proposta sem ID valido. Edite a proposta e selecione um cliente cadastrado antes de continuar.',
      );
    }

    if (!isUuid(usuarioResponsavelId)) {
      throw new Error(
        'Vendedor/responsavel da proposta sem ID valido. Defina o responsavel na proposta para continuar.',
      );
    }

    return {
      propostaCompleta,
      propostaId,
      clienteId,
      usuarioResponsavelId,
    };
  };

  const mapFormaPagamentoProposta = (propostaFonte?: PropostaCompleta): FormaPagamento | undefined => {
    const propostaAtual =
      propostaFonte || (isPropostaCompleta(proposta) ? proposta : propostaCompletaCacheRef.current);
    if (!propostaAtual) {
      return undefined;
    }

    const forma = String(propostaAtual.formaPagamento || '')
      .trim()
      .toLowerCase();
    if (forma === 'boleto') {
      return FormaPagamento.BOLETO;
    }
    if (forma === 'cartao' || forma === 'cartao_credito') {
      return FormaPagamento.CARTAO_CREDITO;
    }
    if (forma === 'pix') {
      return FormaPagamento.PIX;
    }

    return undefined;
  };

  const abrirContrato = (contratoId: string | number) => {
    const id = String(contratoId || '').trim();
    if (!id) {
      return;
    }
    navigate(`/contratos/${id}`);
  };

  const abrirFaturamento = (faturaId?: string | number) => {
    if (faturaId !== undefined && faturaId !== null && String(faturaId).trim() !== '') {
      navigate(`/financeiro/faturamento?faturaId=${String(faturaId)}`);
      return;
    }
    navigate('/financeiro/faturamento');
  };

  type ItemFaturaAutomacao = {
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    unidade: string;
    codigoProduto?: string;
    percentualDesconto: number;
    valorDesconto: number;
  };

  const roundCurrency = (value: unknown) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Math.round((parsed + Number.EPSILON) * 100) / 100;
  };

  const calcularTotalItensFatura = (itens: ItemFaturaAutomacao[]) =>
    roundCurrency(
      itens.reduce((total, item) => {
        const quantidade = Math.max(Number(item.quantidade || 0), 0.01);
        const valorUnitario = Math.max(Number(item.valorUnitario || 0), 0.01);
        const subtotal = quantidade * valorUnitario;
        const percentualDesconto = Math.min(100, Math.max(Number(item.percentualDesconto || 0), 0));
        const descontoPercentual = subtotal * (percentualDesconto / 100);
        const descontoValor = Math.max(Number(item.valorDesconto || 0), 0);
        return total + Math.max(0, subtotal - descontoPercentual - descontoValor);
      }, 0),
    );

  const montarPayloadFatura = (propostaFonte?: PropostaCompleta) => {
    const propostaAtual = propostaFonte || propostaCompletaCacheRef.current;
    const propostaData = getPropostaData(propostaAtual || undefined);
    const valorTotalEsperado = Math.max(roundCurrency(propostaData.total || 0), 0);
    let valorDescontoGlobal = 0;
    let possuiAjuste = false;

    let itens: ItemFaturaAutomacao[] = [];
    if (
      propostaAtual &&
      Array.isArray(propostaAtual.produtos) &&
      propostaAtual.produtos.length > 0
    ) {
      itens = propostaAtual.produtos.map((item) => ({
        descricao: String(item.produto?.nome || 'Item da proposta').trim() || 'Item da proposta',
        quantidade: Math.max(Number(item.quantidade || 1), 0.01),
        valorUnitario: Math.max(Number(item.produto?.preco || 0), 0.01),
        unidade: item.produto?.unidade || 'un',
        codigoProduto: String(item.produto?.id || '').trim() || undefined,
        percentualDesconto: Math.min(100, Math.max(Number(item.desconto || 0), 0)),
        valorDesconto: 0,
      }));
    } else {
      itens = [
        {
          descricao: propostaData.titulo || `Proposta ${propostaData.numero}`,
          quantidade: 1,
          valorUnitario: Math.max(Number(propostaData.total || 0), 0.01),
          unidade: 'un',
          percentualDesconto: 0,
          valorDesconto: 0,
        },
      ];
    }

    let totalItens = calcularTotalItensFatura(itens);
    const deltaInicial = roundCurrency(valorTotalEsperado - totalItens);

    if (deltaInicial > 0) {
      possuiAjuste = true;
      itens = [
        ...itens,
        {
          descricao: 'Ajuste financeiro (impostos/encargos da proposta)',
          quantidade: 1,
          valorUnitario: deltaInicial,
          unidade: 'un',
          percentualDesconto: 0,
          valorDesconto: 0,
        },
      ];
      totalItens = calcularTotalItensFatura(itens);
    } else if (deltaInicial < 0) {
      valorDescontoGlobal = Math.max(0, Math.abs(deltaInicial));
      valorDescontoGlobal = Math.min(valorDescontoGlobal, Math.max(totalItens - 0.01, 0));
    }

    const totalPosDesconto = roundCurrency(totalItens - valorDescontoGlobal);
    const deltaFinal = roundCurrency(valorTotalEsperado - totalPosDesconto);
    if (deltaFinal > 0) {
      possuiAjuste = true;
      itens = [
        ...itens,
        {
          descricao: 'Ajuste financeiro complementar',
          quantidade: 1,
          valorUnitario: deltaFinal,
          unidade: 'un',
          percentualDesconto: 0,
          valorDesconto: 0,
        },
      ];
      totalItens = calcularTotalItensFatura(itens);
    } else if (deltaFinal < 0) {
      valorDescontoGlobal = Math.min(
        roundCurrency(valorDescontoGlobal + Math.abs(deltaFinal)),
        Math.max(totalItens - 0.01, 0),
      );
    }

    return {
      itens,
      valorDescontoGlobal: roundCurrency(valorDescontoGlobal),
      valorTotalEsperado: roundCurrency(valorTotalEsperado),
      totalItensAntesDesconto: roundCurrency(totalItens),
      possuiAjuste,
    };
  };

  const automacaoAvancadaDisponivel = true;

  // Verificar se proposta pode gerar contrato
  const podeGerarContrato = () => {
    const status = String(getPropostaData().status || '')
      .trim()
      .toLowerCase();
    return status === 'aprovada' || status === 'aceita';
  };

  // Verificar se proposta pode criar fatura
  const podeCriarFatura = () => {
    const status = getPropostaData().status;
    return status === 'contrato_assinado';
  };

  // Gerar contrato a partir da proposta
  const handleGerarContrato = async () => {
    if (!podeGerarContrato()) {
      toastService.error('Apenas propostas aprovadas podem gerar contratos');
      return;
    }

    setGerandoContrato(true);
    try {
      const { propostaCompleta, propostaId, clienteId, usuarioResponsavelId } =
        await obterContextoAutomacao();
      const propostaData = getPropostaData(propostaCompleta);
      const valorTotal = Number(propostaData.total || 0);

      if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
        throw new Error('A proposta precisa ter valor total maior que zero para gerar contrato.');
      }

      const contratoExistente = await buscarContratoDaProposta(propostaId);

      if (contratoExistente) {
        toastService.info(
          `Ja existe contrato para esta proposta (${contratoExistente.numero || contratoExistente.id}).`,
        );
        abrirContrato(contratoExistente.id);
        onPropostaUpdated?.();
        return;
      }

      const hoje = new Date();
      const dataVencimento = propostaCompleta.dataValidade
        ? new Date(propostaCompleta.dataValidade)
        : addDays(hoje, 30);
      const dataFim = addDays(dataVencimento, 365);

      const contrato = await contratoService.criarContrato({
        propostaId,
        clienteId,
        usuarioResponsavelId,
        tipo: 'servico',
        objeto: propostaData.titulo || `Contrato referente a proposta ${propostaData.numero}`,
        valorTotal,
        dataInicio: formatDateOnly(hoje),
        dataFim: formatDateOnly(dataFim),
        dataVencimento: formatDateOnly(dataVencimento),
        observacoes: `Gerado automaticamente a partir da proposta ${propostaData.numero}.`,
      });

      await sincronizarStatusProposta('contrato_gerado', {
        source: 'automacao-contrato',
        observacoes: `Contrato ${contrato.numero || contrato.id} gerado a partir da proposta.`,
      });
      toastService.success(`Contrato ${contrato.numero || contrato.id} gerado com sucesso.`);
      abrirContrato(contrato.id);
      onPropostaUpdated?.();
    } catch (error) {
      console.error('Erro ao gerar contrato automatico:', error);
      toastService.error(getErrorMessage(error, 'Erro ao gerar contrato a partir da proposta.'));
    } finally {
      setGerandoContrato(false);
    }
  };

  const buscarContratoDaProposta = async (propostaId: string) => {
    try {
      const contratoFiltrado = await contratoService.buscarContratoPorPropostaId(propostaId);
      if (contratoFiltrado) {
        return contratoFiltrado;
      }
    } catch (error) {
      console.warn(
        'Falha ao buscar contrato por proposta via filtro dedicado. Aplicando fallback local.',
        error,
      );
    }

    const contratos = await contratoService.listarContratos();
    return (
      contratos.find(
        (contrato) => contrato.propostaId === propostaId && contrato.status !== 'cancelado',
      ) || null
    );
  };

  const resolverUsuarioAssinaturaExterna = (fallbackUsuarioId: string) => {
    try {
      const usuarioAtual = authService.getUser() as any;
      const usuarioAtualId = String(usuarioAtual?.id || usuarioAtual?.userId || '').trim();
      if (isUuid(usuarioAtualId)) {
        return usuarioAtualId;
      }
    } catch {
      // fallback para o usuario responsavel resolvido no contexto da proposta
    }

    return fallbackUsuarioId;
  };

  const confirmarAssinaturaExternaContrato = async (
    contratoId: string | number,
    usuarioAssinanteId: string,
  ) => {
    const contratoIdNormalizado = String(contratoId || '').trim();
    if (!isNumericId(contratoIdNormalizado)) {
      throw new Error('Contrato vinculado com ID invalido para registrar assinatura externa.');
    }

    if (!isUuid(usuarioAssinanteId)) {
      throw new Error('Usuario responsavel invalido para registrar assinatura externa.');
    }

    let tokenValidacao: string | undefined;

    try {
      const assinaturaCriada = await contratoService.criarAssinatura(contratoIdNormalizado, {
        usuarioId: usuarioAssinanteId,
        tipo: 'eletronica',
        dataExpiracao: addDays(new Date(), 1).toISOString(),
        metadados: {
          dispositivo: 'backoffice',
          navegador: 'fluxo_proposta',
          versaoApp: 'assinatura_externa_manual',
        },
      });
      tokenValidacao = assinaturaCriada?.tokenValidacao;
    } catch (error) {
      const mensagem = getErrorMessage(
        error,
        'Nao foi possivel preparar a assinatura externa do contrato.',
      );
      const assinaturaPendenteExistente = mensagem.toLowerCase().includes('pendente');
      if (!assinaturaPendenteExistente) {
        throw error;
      }

      const contratoAtualizado = await contratoService.buscarContrato(contratoIdNormalizado);
      tokenValidacao = contratoAtualizado.assinaturaDigital?.token || undefined;
    }

    if (!tokenValidacao) {
      throw new Error('Nao foi possivel obter token de assinatura para confirmar o contrato.');
    }

    const userAgent =
      typeof navigator !== 'undefined' && navigator.userAgent
        ? navigator.userAgent
        : 'backoffice';
    const hashAssinatura = `assinatura-externa-${contratoIdNormalizado}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    await contratoService.assinarContrato({
      tokenValidacao,
      hashAssinatura,
      userAgent,
      metadados: {
        dispositivo: 'backoffice',
        navegador: 'fluxo_proposta',
        versaoApp: 'assinatura_externa_manual',
      },
    });
  };

  const localizarFaturaRelacionada = async (): Promise<number | null> => {
    const propostaData = getPropostaData();
    const propostaId = String((proposta as any)?.id || propostaData.id || '').trim();

    if (propostaId) {
      try {
        const contrato = await buscarContratoDaProposta(propostaId);
        if (contrato && isNumericId(contrato.id)) {
          const respostaContrato = await faturamentoService.listarFaturasPaginadas({
            contratoId: Number(contrato.id),
            page: 1,
            pageSize: 1,
            sortBy: 'createdAt',
            sortOrder: 'DESC',
          });

          const faturaContrato = Array.isArray(respostaContrato.data)
            ? respostaContrato.data[0]
            : undefined;
          if (faturaContrato?.id) {
            return Number(faturaContrato.id);
          }
        }
      } catch (error) {
        console.warn('Falha ao localizar fatura por contrato vinculado:', error);
      }
    }

    const numeroProposta = String(propostaData.numero || '').trim();
    if (!numeroProposta) {
      return null;
    }

    try {
      const respostaPorBusca = await faturamentoService.listarFaturasPaginadas({
        q: numeroProposta,
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      });

      const faturas = Array.isArray(respostaPorBusca.data) ? respostaPorBusca.data : [];
      const faturaAssociada =
        faturas.find((fatura) =>
          String(fatura?.observacoes || '').toLowerCase().includes(numeroProposta.toLowerCase()),
        ) || faturas[0];

      if (faturaAssociada?.id) {
        return Number(faturaAssociada.id);
      }
    } catch (error) {
      console.warn('Falha ao localizar fatura por busca textual da proposta:', error);
    }

    return null;
  };

  const abrirFaturamentoParaPagamento = async () => {
    const faturaId = await localizarFaturaRelacionada();
    if (faturaId) {
      abrirFaturamento(faturaId);
      return;
    }

    abrirFaturamento();
    toastService.info(
      'Nao foi possivel localizar a fatura automaticamente. Use os filtros do financeiro para continuar.',
    );
  };

  // Criar fatura automatica
  const handleCriarFatura = async (options?: { ignoreStatusGate?: boolean }) => {
    if (!options?.ignoreStatusGate && !podeCriarFatura()) {
      toastService.error('Apenas propostas com contrato assinado podem gerar faturas');
      return;
    }

    setCriandoFatura(true);
    try {
      const { propostaCompleta, propostaId, clienteId, usuarioResponsavelId } =
        await obterContextoAutomacao();
      const propostaData = getPropostaData(propostaCompleta);
      const contrato = await buscarContratoDaProposta(propostaId);

      if (!contrato) {
        throw new Error(
          'Nenhum contrato encontrado para esta proposta. Gere o contrato antes da fatura.',
        );
      }

      if (String(contrato.status || '').toLowerCase() !== 'assinado') {
        throw new Error('O contrato precisa estar assinado antes de gerar a fatura.');
      }

      if (!isNumericId(contrato.id)) {
        throw new Error(
          'Contrato vinculado com ID invalido para faturamento automatico. Use o modulo de Faturamento.',
        );
      }

      const payloadFatura = montarPayloadFatura(propostaCompleta);
      const fatura = await faturamentoService.criarFatura({
        contratoId: String(contrato.id),
        clienteId,
        usuarioResponsavelId,
        tipo: TipoFatura.UNICA,
        dataVencimento: formatDateOnly(
          contrato.dataVencimento instanceof Date
            ? contrato.dataVencimento
            : propostaData.dataValidade,
        ),
        formaPagamento: mapFormaPagamentoProposta(propostaCompleta),
        observacoes: `Fatura gerada automaticamente a partir da proposta ${propostaData.numero}.${payloadFatura.possuiAjuste ? ' Valores ajustados para refletir desconto/impostos da proposta.' : ''}`,
        valorDesconto: payloadFatura.valorDescontoGlobal,
        itens: payloadFatura.itens,
      });

      await sincronizarStatusProposta('fatura_criada', {
        source: 'automacao-fatura',
        observacoes: `Fatura ${fatura.numero || fatura.id} criada a partir da proposta.`,
      });
      toastService.success(`Fatura ${fatura.numero || fatura.id} criada com sucesso.`);
      abrirFaturamento(fatura.id);
      onPropostaUpdated?.();
    } catch (error) {
      console.error('Erro ao criar fatura automatica:', error);
      toastService.error(getErrorMessage(error, 'Erro ao criar fatura a partir da proposta.'));
    } finally {
      setCriandoFatura(false);
    }
  };

  // Avancar para proxima etapa do fluxo
  const handleAvancarFluxo = async () => {
    setAvancandoFluxo(true);
    try {
      const propostaData = getPropostaData();
      const status = propostaData.status;

      if (bloqueadoPorAlcada && status === 'negociacao') {
        toastService.info(
          'A proposta esta aguardando aprovacao interna de alcada. Use os botoes de alcada para decidir.',
        );
        return;
      }

      // Determinar proxima acao baseada no status atual
      switch (status) {
        case 'rascunho':
          if (await bloquearAcaoSemItens('Avanco de fluxo bloqueado')) {
            return;
          }
          await handleSendEmail(); // Enviar proposta por email
          return;

        case 'enviada':
        case 'visualizada':
          await sincronizarStatusProposta('negociacao', {
            source: 'fluxo-avanco',
            observacoes:
              status === 'visualizada'
                ? 'Proposta visualizada avancada automaticamente para negociacao.'
                : 'Status avancado automaticamente para negociacao.',
          });
          toastService.success(
            status === 'visualizada'
              ? 'Proposta visualizada avancada para negociacao.'
              : 'Proposta avancada para negociacao.',
          );
          onPropostaUpdated?.();
          break;

        case 'negociacao': {
          const aprovar = await confirm({
            title: 'Encerrar negociacao da proposta',
            message:
              'Confirme para aprovar a proposta agora. Se preferir rejeitar, use cancelar e confirme a rejeicao na etapa seguinte.',
            confirmText: 'Aprovar proposta',
            cancelText: 'Rejeitar proposta',
            icon: 'info',
            confirmButtonClass: 'bg-[#159A9C] hover:bg-[#0F7B7D] focus:ring-[#159A9C]',
          });

          if (aprovar) {
            if (await bloquearAcaoSemItens('Aprovacao bloqueada')) {
              return;
            }
            await sincronizarStatusProposta('aprovada', {
              source: 'fluxo-avanco',
              observacoes: 'Proposta aprovada durante o fluxo de negociacao.',
            });
            toastService.success('Proposta marcada como aprovada.');
            onPropostaUpdated?.();
            break;
          }

          const confirmarRejeicao = await confirm({
            title: 'Confirmar rejeicao da proposta',
            message: 'A proposta sera marcada como rejeitada. Deseja continuar?',
            confirmText: 'Sim, rejeitar',
            cancelText: 'Voltar',
            icon: 'warning',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          });

          if (!confirmarRejeicao) {
            toastService.info('Negociacao mantida sem alteracoes.');
            break;
          }

          const motivoPerda = await askForInput({
            title: 'Registrar motivo da perda',
            message: 'Se quiser, descreva o motivo da rejeicao para manter o historico comercial mais completo.',
            placeholder: 'Cliente optou por outra proposta',
            confirmText: 'Rejeitar proposta',
            cancelText: 'Cancelar',
            defaultValue: 'Cliente optou por outra proposta',
            multiline: true,
            confirmVariant: 'danger',
          });

          if (motivoPerda === null) {
            toastService.info('Rejeicao cancelada.');
            break;
          }

          await sincronizarStatusProposta('rejeitada', {
            source: 'fluxo-avanco',
            motivoPerda: motivoPerda || undefined,
            observacoes: 'Proposta rejeitada durante o fluxo de negociacao.',
          });
          toastService.success('Proposta marcada como rejeitada.');
          onPropostaUpdated?.();
          break;
        }

        case 'aprovada': {
          const desejaGerarContrato = await confirm({
            title: 'Gerar contrato para esta venda?',
            message:
              'Se optar por gerar contrato, a proposta segue para assinatura. Se nao, a fatura sera criada diretamente.',
            confirmText: 'Gerar contrato',
            cancelText: 'Seguir sem contrato',
            icon: 'info',
            confirmButtonClass: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500',
          });

          if (desejaGerarContrato) {
            await handleGerarContrato();
            break;
          }

          const confirmarSemContrato = await confirm({
            title: 'Confirmar fluxo sem contrato',
            message: 'A fatura sera criada diretamente para esta proposta. Deseja continuar?',
            confirmText: 'Sim, criar fatura',
            cancelText: 'Voltar',
            icon: 'warning',
            confirmButtonClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
          });
          if (!confirmarSemContrato) {
            toastService.info('Fluxo mantido sem alteracoes.');
            break;
          }

          await handleCriarFaturaSemContrato();
          break;
        }

        case 'contrato_gerado': {
          const { propostaId, usuarioResponsavelId } = await obterContextoAutomacao();
          const contrato = await buscarContratoDaProposta(propostaId);
          if (!contrato) {
            toastService.info('Contrato nao encontrado. Gere o contrato para continuar o fluxo.');
            break;
          }

          const contratoAssinadoExternamente = await confirm({
            title: 'Confirmar assinatura externa',
            message:
              'Este contrato foi assinado fora do sistema? Ao confirmar, o contrato sera marcado como assinado e o fluxo seguira para faturamento.',
            confirmText: 'Sim, seguir para faturamento',
            cancelText: 'Nao, manter aguardando',
            icon: 'warning',
            confirmButtonClass: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500',
          });

          if (!contratoAssinadoExternamente) {
            toastService.info('Proposta mantida em aguardando assinatura de contrato.');
            abrirContrato(contrato.id);
            break;
          }

          if (String(contrato.status || '').toLowerCase() !== 'assinado') {
            const usuarioAssinanteId = resolverUsuarioAssinaturaExterna(usuarioResponsavelId);
            await confirmarAssinaturaExternaContrato(contrato.id, usuarioAssinanteId);
          }

          await sincronizarStatusProposta('contrato_assinado', {
            source: 'assinatura-externa-confirmada',
            observacoes: `Contrato ${contrato.numero || contrato.id} confirmado como assinado externamente.`,
          });
          toastService.success('Assinatura externa confirmada. Prosseguindo para faturamento.');
          await handleCriarFatura({ ignoreStatusGate: true });
          break;
        }

        case 'contrato_assinado':
          await handleCriarFatura(); // Criar fatura
          break;

        case 'fatura_criada':
          await sincronizarStatusProposta('aguardando_pagamento', {
            source: 'fluxo-avanco',
            observacoes: 'Fatura emitida e aguardando pagamento.',
          });
          toastService.success('Status atualizado para aguardando pagamento.');
          await abrirFaturamentoParaPagamento();
          onPropostaUpdated?.();
          break;

        case 'aguardando_pagamento':
          await abrirFaturamentoParaPagamento();
          break;

        case 'pago':
          toastService.info('Fluxo finalizado: proposta paga.');
          break;

        case 'rejeitada':
        case 'expirada':
          toastService.info('Fluxo encerrado para este status.');
          break;

        default:
          toastService.info('Esta proposta ja esta na ultima etapa do fluxo');
          return;
      }
    } catch (error) {
      console.error('Erro ao avancar fluxo:', error);
      toastService.error('Erro ao avancar fluxo. Tente novamente.');
    } finally {
      setAvancandoFluxo(false);
    }
  };

  const handleCriarFaturaSemContrato = async () => {
    setCriandoFatura(true);
    try {
      const { propostaCompleta, clienteId, usuarioResponsavelId } = await obterContextoAutomacao();
      const propostaData = getPropostaData(propostaCompleta);
      const hoje = new Date();
      const dataVencimento = propostaData.dataValidade
        ? formatDateOnly(propostaData.dataValidade)
        : formatDateOnly(addDays(hoje, 30));

      const payloadFatura = montarPayloadFatura(propostaCompleta);
      const fatura = await faturamentoService.criarFatura({
        clienteId,
        usuarioResponsavelId,
        tipo: TipoFatura.UNICA,
        dataVencimento,
        formaPagamento: mapFormaPagamentoProposta(propostaCompleta),
        observacoes: `Fatura gerada a partir da proposta ${propostaData.numero} sem contrato.${payloadFatura.possuiAjuste ? ' Valores ajustados para refletir desconto/impostos da proposta.' : ''}`,
        valorDesconto: payloadFatura.valorDescontoGlobal,
        itens: payloadFatura.itens,
      });

      await sincronizarStatusProposta('fatura_criada', {
        source: 'automacao-fatura-sem-contrato',
        observacoes: `Fatura ${fatura.numero || fatura.id} criada sem contrato para a proposta.`,
      });

      toastService.success(`Fatura ${fatura.numero || fatura.id} criada sem contrato.`);
      abrirFaturamento(fatura.id);
      onPropostaUpdated?.();
    } catch (error) {
      console.error('Erro ao criar fatura sem contrato:', error);
      toastService.error(getErrorMessage(error, 'Erro ao criar fatura sem contrato.'));
    } finally {
      setCriandoFatura(false);
    }
  };

  const handleAprovarAlcada = async () => {
    if (!possuiAprovacaoPendente) {
      return;
    }

    const propostaData = getPropostaData();
    const propostaId = (proposta as any)?.id || propostaData.id;
    if (!propostaId) {
      toastService.error('Proposta sem identificador para aprovar alcada.');
      return;
    }

    setDecidindoAlcadaAprovacao(true);
    try {
      const aprovador = getUsuarioAtualAprovador();
      await propostasApiService.decidirAprovacaoInterna(propostaId, {
        aprovada: true,
        usuarioId: aprovador.id,
        usuarioNome: aprovador.nome,
        observacoes: 'Aprovacao interna concluida via tela de propostas.',
      });

      await sincronizarStatusProposta('aprovada', {
        source: 'alcada-aprovada',
        observacoes: 'Proposta aprovada apos decisao da alcada interna.',
      });

      toastService.success('Alcada aprovada e proposta avancada para aprovada.');
      onPropostaUpdated?.();
    } catch (error) {
      console.error('Erro ao aprovar alcada interna:', error);
      toastService.error(getErrorMessage(error, 'Erro ao aprovar alcada interna.'));
    } finally {
      setDecidindoAlcadaAprovacao(false);
    }
  };

  const handleReprovarAlcada = async () => {
    if (!possuiAprovacaoPendente) {
      return;
    }

    const motivoReprovacao = await askForInput({
      title: 'Reprovar alcada interna',
      message: 'Informe o motivo da reprovacao. Esse texto ajuda a equipe comercial a corrigir a proposta.',
      placeholder: 'Descreva o motivo da reprovacao',
      confirmText: 'Confirmar reprovacao',
      cancelText: 'Cancelar',
      defaultValue: 'Desconto acima da politica comercial',
      multiline: true,
      confirmVariant: 'danger',
    });
    if (motivoReprovacao === null) {
      return;
    }

    const propostaData = getPropostaData();
    const propostaId = (proposta as any)?.id || propostaData.id;
    if (!propostaId) {
      toastService.error('Proposta sem identificador para reprovar alcada.');
      return;
    }

    setDecidindoAlcadaReprovacao(true);
    try {
      const aprovador = getUsuarioAtualAprovador();
      await propostasApiService.decidirAprovacaoInterna(propostaId, {
        aprovada: false,
        usuarioId: aprovador.id,
        usuarioNome: aprovador.nome,
        observacoes: motivoReprovacao || 'Reprovacao interna via tela de propostas.',
      });

      toastService.success('Alcada reprovada. A proposta permanece bloqueada para aprovacao.');
      onPropostaUpdated?.();
    } catch (error) {
      console.error('Erro ao reprovar alcada interna:', error);
      toastService.error(getErrorMessage(error, 'Erro ao reprovar alcada interna.'));
    } finally {
      setDecidindoAlcadaReprovacao(false);
    }
  };

  // Enviar proposta por email
  const handleSendEmail = async () => {
    if (await bloquearAcaoSemItens('Envio bloqueado')) {
      return;
    }

    const clienteData = await getClienteData({ allowLookup: true });

    // Validar se o email e valido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let emailFinal = (clienteData.email || '').trim();

    if (!emailFinal) {
      const emailInformado = await askForInput({
        title: 'Informar e-mail do cliente',
        message: `O cliente "${clienteData.nome}" nao possui e-mail cadastrado. Informe o endereco para enviar a proposta.`,
        placeholder: 'cliente@empresa.com',
        confirmText: 'Usar e-mail',
        cancelText: 'Cancelar',
        required: true,
        inputType: 'email',
        confirmVariant: 'primary',
        validate: (value) =>
          emailRegex.test(value) ? null : `E-mail informado e invalido: ${value || 'vazio'}`,
      });

      if (!emailInformado) {
        toastService.error('Envio cancelado - E-mail e obrigatorio');
        return;
      }

      emailFinal = emailInformado;
    }

    // DETECCAO DE EMAIL FICTICIO - Solicitar email real
    const isEmailFicticio =
      emailFinal.includes('@cliente.com') ||
      emailFinal.includes('@cliente.temp') ||
      emailFinal.includes('@email.com') ||
      emailFinal.includes('@exemplo.com') ||
      emailFinal.includes('@cliente.') ||
      emailFinal.includes('@temp.') ||
      emailFinal.includes('@ficticio.');

    if (isEmailFicticio) {
      const emailReal = await askForInput({
        title: 'Corrigir e-mail ficticio',
        message: `O e-mail cadastrado "${clienteData.email}" parece ficticio. Informe o e-mail real do cliente "${clienteData.nome}" para continuar.`,
        placeholder: 'cliente@empresa.com',
        confirmText: 'Corrigir e enviar',
        cancelText: 'Cancelar',
        required: true,
        inputType: 'email',
        confirmVariant: 'primary',
        validate: (value) =>
          emailRegex.test(value) ? null : `E-mail informado e invalido: ${value || 'vazio'}`,
      });

      if (!emailReal) {
        toastService.error('Envio cancelado - Email real e obrigatorio');
        return;
      }

      emailFinal = emailReal; // Usar o email real
      toastService.success(`Email corrigido para "${emailReal}"`);
    }

    setSendingEmail(true);
    try {
      const propostaData = getPropostaData();
      const propostaId = (proposta as any)?.id || (propostaData as any)?.id;
      if (!propostaId) {
        throw new Error('Proposta sem ID para gerar token do portal');
      }
      const token = await portalClienteService.gerarTokenPublico(String(propostaId));
      const empresaData = await getEmpresaDataPdf();
      const usuarioLogado = authService.getUser();
      const vendedorPayload = {
        nome:
          String(
            (proposta as any)?.vendedor?.nome ||
              (proposta as any)?.vendedorNome ||
              (proposta as any)?.vendedor ||
              usuarioLogado?.nome ||
              '',
          ).trim() || 'Equipe comercial',
        email:
          String(
            (proposta as any)?.vendedor?.email ||
              (proposta as any)?.vendedorEmail ||
              usuarioLogado?.email ||
              empresaData.email ||
              '',
          ).trim() || 'comercial@empresa.com',
        telefone:
          formatarTelefoneBr(
            (proposta as any)?.vendedor?.telefone || usuarioLogado?.telefone || empresaData.telefone,
          ) || '',
      };
      const empresaEndereco = montarEnderecoEmpresaLinha(empresaData);

      const emailData = {
        cliente: {
          nome: clienteData.nome,
          email: emailFinal, // Usar email real corrigido pelo usuario
        },
        proposta: {
          id: String(propostaId),
          numero: propostaData.numero,
          titulo: propostaData.titulo || 'Proposta comercial',
          valorTotal: propostaData.total,
          valor: propostaData.total,
          total: propostaData.total,
          dataValidade: propostaData.dataValidade,
          formaPagamento:
            String((proposta as any)?.formaPagamento || '').trim() || undefined,
          validadeDias: Number((proposta as any)?.validadeDias || 0) || undefined,
          dataEmissao:
            String((proposta as any)?.criadaEm || (proposta as any)?.createdAt || '').trim() ||
            undefined,
          clienteNome: clienteData.nome || undefined,
          vendedorNome: vendedorPayload.nome || undefined,
          empresaNome:
            empresaData.nome || toTextoNaoVazio(usuarioLogado?.empresa?.nome) || undefined,
          token: token,
        },
        vendedor: {
          nome: vendedorPayload.nome,
          email: vendedorPayload.email,
          telefone: vendedorPayload.telefone,
        },
        empresa: {
          nome: empresaData.nome || toTextoNaoVazio(usuarioLogado?.empresa?.nome) || 'Sua empresa',
          email: empresaData.email || vendedorPayload.email,
          telefone: formatarTelefoneBr(empresaData.telefone) || vendedorPayload.telefone,
          endereco: empresaEndereco || 'Nao informado',
        },
        portalUrl: `${window.location.origin}/portal`,
      };

      const resultado = await emailServiceReal.enviarPropostaParaCliente(emailData);

        if (resultado.success) {
          await sincronizarStatusProposta('enviada', {
            source: 'email',
            observacoes: `Proposta enviada por email para ${clienteData.nome} (${emailFinal}).`,
          });
          toastService.success(`Proposta enviada por email para ${emailFinal}`);
          onPropostaUpdated?.();
        } else {
        toastService.error(`Erro ao enviar email: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toastService.error('Erro ao enviar email da proposta');
    } finally {
      setSendingEmail(false);
    }
  };

  // Enviar proposta por WhatsApp
  const handleSendWhatsApp = async () => {
    if (await bloquearAcaoSemItens('Envio bloqueado')) {
      return;
    }

    const clienteWhatsapp = await getClienteData({ allowLookup: true });
    if (!clienteWhatsapp.telefone) {
      toastService.error('Cliente nao possui telefone cadastrado');
      return;
    }

    const dadosPDF = await montarDadosPdfProposta();
    setEmpresaNomeExibicao(dadosPDF.empresa.nome || 'Sua empresa');

    // Gerar PDF para anexar
    try {
      const pdfBlob = await pdfPropostasService.gerarPdf('comercial', dadosPDF);

      // Converter Blob para Uint8Array
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      setPropostaPdfBuffer(uint8Array);
    } catch (error) {
      console.error('Erro ao gerar PDF, enviando sem anexo:', error);
      setPropostaPdfBuffer(null);
    }

    setClienteData((prev) => ({
      nome: dadosPDF.cliente.nome || prev?.nome || 'Cliente',
      email: dadosPDF.cliente.email || prev?.email || '',
      telefone: dadosPDF.cliente.telefone || prev?.telefone || '',
    }));

    // Abrir modal do WhatsApp
    setShowWhatsAppModal(true);
  };

  // Download da proposta em PDF
  const handleDownloadPdf = async () => {
    if (await bloquearAcaoSemItens('Geracao de PDF bloqueada')) {
      return;
    }

    setDownloadingPdf(true);
    try {
      const propostaData = getPropostaData();
      const dadosPDF = await montarDadosPdfProposta();
      await pdfPropostasService.downloadPdf('comercial', dadosPDF);

      toastService.success(`PDF da proposta ${propostaData.numero} baixado`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toastService.error('Erro ao gerar PDF da proposta');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Compartilhar proposta
  const handleShare = async () => {
    if (await bloquearAcaoSemItens('Compartilhamento bloqueado')) {
      return;
    }

    const propostaData = getPropostaData();
    const propostaId = (proposta as any)?.id || (propostaData as any)?.id;
    if (!propostaId) {
      toastService.error('Proposta sem ID para gerar link do portal');
      return;
    }
    const token = await portalClienteService.gerarTokenPublico(String(propostaId));
    const clienteData = await getClienteData();
    const empresaData = await getEmpresaDataPdf();
    const shareUrl = `${window.location.origin}/portal/${propostaData.numero}/${token}`;
    const nomeEmpresaShare = empresaData.nome || empresaNomeExibicao;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Proposta ${propostaData.numero} - ${nomeEmpresaShare}`,
          text: `Proposta comercial para ${clienteData.nome}`,
          url: shareUrl,
        });
        toastService.success('Proposta compartilhada');
      } catch (error) {
        // Fallback para copia do link
        navigator.clipboard.writeText(shareUrl);
        toastService.success('Link da proposta copiado');
      }
    } else {
      // Fallback para navegadores sem suporte ao Web Share API
      navigator.clipboard.writeText(shareUrl);
      toastService.success('Link da proposta copiado');
    }
  };

  const handleDefinirComoPrincipal = async () => {
    const propostaId = String((proposta as any)?.id || getPropostaData().id || '').trim();
    if (!propostaId || !oportunidadeVinculada?.id) {
      toastService.error('A proposta precisa estar vinculada a uma oportunidade para ser principal.');
      return;
    }

    try {
      setDefinindoComoPrincipal(true);
      await propostasApiService.definirComoPrincipal(propostaId);
      toastService.success('Proposta principal definida com sucesso.');
      onPropostaUpdated?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao definir proposta principal.';
      toastService.error(message);
    } finally {
      setDefinindoComoPrincipal(false);
    }
  };

  const buttonClass = showLabels
    ? 'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors'
    : 'p-2 rounded-md transition-colors';
  const buttonThemeClass = {
    primary: 'text-[#159A9C] hover:bg-[#F2FBFA] hover:text-[#0F7B7D]',
    success: 'text-[#15803D] hover:bg-[#F0FDF4] hover:text-[#166534]',
    warning: 'text-[#B45309] hover:bg-[#FFF7ED] hover:text-[#92400E]',
    danger: 'text-[#DC2626] hover:bg-[#FEF2F2] hover:text-[#B91C1C]',
    neutral: 'text-[#607B89] hover:bg-[#F6FAFB] hover:text-[#244455]',
    accent: 'text-[#7C3AED] hover:bg-[#F5F3FF] hover:text-[#6D28D9]',
  } as const;
  const pagamentoControladoNoFinanceiro = statusFluxoAtual === 'aguardando_pagamento';
  const exibirEmailDireto = !statusEncerradoSemAcoesComerciais;
  const exibirWhatsApp = !statusEncerradoSemAcoesComerciais;
  const exibirCompartilhar = !statusEncerradoSemAcoesComerciais;
  const exibirGerarContrato = podeGerarContrato();
  const exibirCriarFatura = podeCriarFatura();
  const exibirAvancarFluxo = !statusEncerradoSemAcoesComerciais;
  const exibirAcoesCompartilhamento = actionScope === 'all' || actionScope === 'share';
  const exibirAcoesFluxo = actionScope === 'all' || actionScope === 'flow';
  const exibirSeparadorAutomacao =
    exibirAcoesCompartilhamento &&
    exibirAcoesFluxo &&
    (possuiAprovacaoPendente || exibirGerarContrato || exibirCriarFatura || exibirAvancarFluxo);
  const getFlowActionMeta = (
    status: string,
  ): {
    label: string;
    title: string;
  } => {
    switch (status) {
      case 'rascunho':
        return {
          label: 'Enviar proposta',
          title: 'Enviar proposta por email e avancar para enviada',
        };
      case 'enviada':
      case 'visualizada':
        return {
          label: 'Ir para negociacao',
          title: 'Avancar proposta para negociacao',
        };
      case 'negociacao':
        return {
          label: 'Decidir negociacao',
          title: 'Aprovar ou rejeitar a proposta para encerrar a negociacao',
        };
      case 'aprovada':
        return {
          label: 'Formalizar venda',
          title: 'Gerar contrato ou criar fatura a partir da proposta aprovada',
        };
      case 'contrato_gerado':
        return {
          label: 'Confirmar assinatura',
          title: 'Confirmar assinatura externa do contrato para seguir',
        };
      case 'contrato_assinado':
        return {
          label: 'Gerar fatura',
          title: 'Criar fatura automatica a partir do contrato assinado',
        };
      case 'fatura_criada':
        return {
          label: 'Ir para cobranca',
          title: 'Atualizar para aguardando pagamento e abrir o financeiro',
        };
      case 'aguardando_pagamento':
        return {
          label: 'Abrir financeiro',
          title: 'Pagamento desta proposta e controlado no modulo de faturamento',
        };
      default:
        return {
          label: 'Avancar Fluxo',
          title: pagamentoControladoNoFinanceiro
            ? 'Pagamento desta proposta e controlado no modulo de faturamento'
            : 'Avancar para proxima etapa do fluxo automatizado',
        };
    }
  };
  const flowActionMeta = getFlowActionMeta(statusFluxoAtual);

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {exibirAcoesFluxo && onEditProposta && editavelComoRascunho && (
        <button
          type="button"
          onClick={() => onEditProposta(proposta)}
          className={`${buttonClass} ${buttonThemeClass.neutral}`}
          title="Editar rascunho"
        >
          <Pencil className="w-4 h-4" />
          {showLabels && <span>Editar</span>}
        </button>
      )}

      {exibirAcoesFluxo && podeDefinirComoPrincipal && (
        <button
          type="button"
          onClick={handleDefinirComoPrincipal}
          disabled={definindoComoPrincipal}
          className={`${buttonClass} ${buttonThemeClass.warning} disabled:opacity-50`}
          title={`Definir como proposta principal de ${oportunidadeVinculada.titulo}`}
        >
          {definindoComoPrincipal ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Star className="w-4 h-4" />
          )}
          {showLabels && <span>Definir principal</span>}
        </button>
      )}

      {/* Email */}
      {exibirAcoesCompartilhamento && exibirEmailDireto && (
        <button
          type="button"
          onClick={handleSendEmail}
          disabled={sendingEmail}
          className={`${buttonClass} ${buttonThemeClass.success} disabled:cursor-not-allowed disabled:opacity-50`}
          title={clienteData?.email ? 'Enviar por email' : 'Informar e-mail e enviar'}
        >
          {sendingEmail ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {showLabels && <span>Email</span>}
        </button>
      )}

      {/* WhatsApp */}
      {exibirAcoesCompartilhamento && exibirWhatsApp && (
        <button
          type="button"
          onClick={handleSendWhatsApp}
          disabled={!clienteData?.nome}
          className={`${buttonClass} ${buttonThemeClass.success} disabled:cursor-not-allowed disabled:opacity-50`}
          title={
            clienteData?.telefone
              ? 'Enviar por WhatsApp'
              : 'Enviar por WhatsApp (telefone do cliente sera validado antes de gerar o PDF)'
          }
        >
          <MessageSquare className="w-4 h-4" />
          {showLabels && <span>WhatsApp</span>}
        </button>
      )}

      {/* Download PDF */}
      {exibirAcoesCompartilhamento && (
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          className={`${buttonClass} ${buttonThemeClass.danger} disabled:opacity-50`}
          title="Baixar PDF"
        >
          {downloadingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {showLabels && <span>PDF</span>}
        </button>
      )}

      {/* Compartilhar */}
      {exibirAcoesCompartilhamento && exibirCompartilhar && (
        <button
          type="button"
          onClick={handleShare}
          className={`${buttonClass} ${buttonThemeClass.accent}`}
          title="Compartilhar link"
        >
          <Share2 className="w-4 h-4" />
          {showLabels && <span>Compartilhar</span>}
        </button>
      )}

      {/* SEPARADOR VISUAL */}
      {exibirSeparadorAutomacao && <div className="mx-2 h-6 w-px bg-[#D4E2E7]"></div>}
      {/* Decisao de alcada */}
      {exibirAcoesFluxo && possuiAprovacaoPendente && (
        <>
          <span
            className={`${buttonClass} cursor-default border border-[#F4D58D] bg-[#FFF7ED] text-[#92400E]`}
            title={
              aprovacaoInternaAtual?.motivo ||
              'Proposta com desconto acima da politica. Exige aprovacao interna.'
            }
          >
            <ShieldAlert className="w-4 h-4" />
            {showLabels && <span>Alcada pendente</span>}
          </span>

          <button
            type="button"
            onClick={handleAprovarAlcada}
            disabled={decidindoAlcadaAprovacao || decidindoAlcadaReprovacao}
            className={`${buttonClass} ${buttonThemeClass.success} disabled:opacity-50`}
            title="Aprovar alcada interna"
          >
            {decidindoAlcadaAprovacao ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {showLabels && <span>Aprovar alcada</span>}
          </button>

          <button
            type="button"
            onClick={handleReprovarAlcada}
            disabled={decidindoAlcadaAprovacao || decidindoAlcadaReprovacao}
            className={`${buttonClass} ${buttonThemeClass.danger} disabled:opacity-50`}
            title="Reprovar alcada interna"
          >
            {decidindoAlcadaReprovacao ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldX className="w-4 h-4" />
            )}
            {showLabels && <span>Reprovar alcada</span>}
          </button>
        </>
      )}

      {/* NOVOS BOTOES DE AUTOMACAO */}

      {/* Gerar Contrato */}
      {exibirAcoesFluxo && exibirGerarContrato && (
        <button
          type="button"
          onClick={handleGerarContrato}
          disabled={gerandoContrato || !automacaoAvancadaDisponivel}
          className={`${buttonClass} ${buttonThemeClass.primary} disabled:opacity-50`}
          title={
            automacaoAvancadaDisponivel
              ? 'Gerar contrato a partir desta proposta'
              : 'Geracao automatica indisponivel nesta versao'
          }
        >
          {gerandoContrato ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          {showLabels && <span>Gerar Contrato</span>}
        </button>
      )}

      {/* Criar Fatura */}
      {exibirAcoesFluxo && exibirCriarFatura && (
        <button
          type="button"
          onClick={() => {
            void handleCriarFatura();
          }}
          disabled={criandoFatura || !automacaoAvancadaDisponivel}
          className={`${buttonClass} ${buttonThemeClass.success} disabled:opacity-50`}
          title={
            automacaoAvancadaDisponivel
              ? 'Criar fatura automatica'
              : 'Criacao automatica indisponivel nesta versao'
          }
        >
          {criandoFatura ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {showLabels && <span>Criar Fatura</span>}
        </button>
      )}

      {/* Avancar Fluxo */}
      {exibirAcoesFluxo && exibirAvancarFluxo && (
        <button
          type="button"
          onClick={handleAvancarFluxo}
          disabled={avancandoFluxo || bloqueadoPorAlcada}
          className={`${buttonClass} ${buttonThemeClass.warning} disabled:opacity-50`}
          title={flowActionMeta.title}
        >
          {avancandoFluxo ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          {showLabels && <span>{flowActionMeta.label}</span>}
        </button>
      )}

      {/* Modal WhatsApp */}
      {showWhatsAppModal && clienteData && (
        <ModalEnviarWhatsApp
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          proposta={{
            id: getPropostaData().numero,
            numero: getPropostaData().numero,
            cliente: {
              nome: clienteData.nome,
              whatsapp: clienteData.telefone,
              telefone: clienteData.telefone,
            },
            valorTotal: getPropostaData().total,
            empresa: {
              nome: empresaNomeExibicao,
            },
          }}
          pdfBuffer={propostaPdfBuffer}
          onSuccess={() => {
            toastService.success('Proposta enviada via WhatsApp!');
            setShowWhatsAppModal(false);
          }}
        />
      )}

      {promptDialog && (
        <BaseModal
          isOpen={promptDialog.isOpen}
          onClose={closePromptDialog}
          title={promptDialog.title}
          subtitle={promptDialog.message}
          size="medium"
          footer={
            <div className="flex items-center justify-end gap-3">
              <ModalButton type="button" variant="secondary" onClick={closePromptDialog}>
                {promptDialog.cancelText}
              </ModalButton>
              <ModalButton
                type="button"
                variant={promptDialog.confirmVariant || 'primary'}
                onClick={submitPromptDialog}
              >
                {promptDialog.confirmText}
              </ModalButton>
            </div>
          }
        >
          <FormField
            label="Detalhes"
            required={Boolean(promptDialog.required)}
            error={promptDialog.error}
          >
            {promptDialog.multiline ? (
              <FormTextarea
                value={promptDialog.value}
                onChange={(event) =>
                  setPromptDialog((current) =>
                    current
                      ? {
                          ...current,
                          value: event.target.value,
                          error: undefined,
                        }
                      : current,
                  )
                }
                placeholder={promptDialog.placeholder}
                rows={4}
                autoFocus
              />
            ) : (
              <FormInput
                type={promptDialog.inputType || 'text'}
                value={promptDialog.value}
                onChange={(event) =>
                  setPromptDialog((current) =>
                    current
                      ? {
                          ...current,
                          value: event.target.value,
                          error: undefined,
                        }
                      : current,
                  )
                }
                placeholder={promptDialog.placeholder}
                autoFocus
              />
            )}
          </FormField>
        </BaseModal>
      )}
    </div>
  );
};

export default PropostaActions;
