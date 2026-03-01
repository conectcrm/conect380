import React, { useState } from 'react';
import { toastService } from '../../../services/toastService';
import {
  Eye,
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
import ModalEnviarWhatsApp from '../../../components/whatsapp/ModalEnviarWhatsApp';

type ClienteContatoData = {
  nome: string;
  email: string;
  telefone: string;
  empresa?: string;
};

const CLIENTE_DETAILS_TTL = 5 * 60 * 1000; // 5 minutos
const CLIENTE_DETAILS_COOLDOWN_TTL = 30 * 1000; // Evita loop de erros
const CLIENTE_DETAILS_MIN_INTERVAL_MS = 300; // Debounce/throttle curto entre buscas
const AUTOMACAO_FLUXO_MENSAGEM =
  'Automacao de contrato/fatura ainda indisponivel nesta versao. Use os modulos de Contratos e Faturamento.';
const clienteDetailsCache = new Map<
  string,
  { data: ClienteContatoData | null; expiresAt: number }
>();
const clienteDetailsPending = new Map<string, Promise<ClienteContatoData | null>>();
let lastClienteLookupAt = 0;

const normalizarNomeCliente = (nome: string) => nome.trim().toLowerCase();

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
          `⚠️ Busca de clientes em cooldown (${cooldownMs}ms restantes). Ignorando requisição para "${nome}".`,
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
              `⚠️ Busca de clientes interrompida por cooldown durante variação do nome "${nome}".`,
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
          `⚠️ Limite de requisições atingido ao buscar cliente "${nome}". Aplicando cooldown curto.`,
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

// Tipo união para aceitar tanto PropostaCompleta quanto o formato da UI
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
  onViewProposta: (proposta: PropostaCompleta | PropostaUI) => void;
  onPropostaUpdated?: () => void;
  className?: string;
  showLabels?: boolean;
  hideView?: boolean;
}

const PropostaActions: React.FC<PropostaActionsProps> = ({
  proposta,
  onViewProposta,
  onPropostaUpdated,
  className = '',
  showLabels = false,
  hideView = false,
}) => {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [clienteData, setClienteData] = useState<{
    nome: string;
    email: string;
    telefone: string;
  } | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [propostaPdfBuffer, setPropostaPdfBuffer] = useState<Uint8Array | null>(null);

  // 🚀 NOVOS ESTADOS PARA AUTOMAÇÃO
  const [gerandoContrato, setGerandoContrato] = useState(false);
  const [criandoFatura, setCriandoFatura] = useState(false);
  const [avancandoFluxo, setAvancandoFluxo] = useState(false);
  const [decidindoAlcadaAprovacao, setDecidindoAlcadaAprovacao] = useState(false);
  const [decidindoAlcadaReprovacao, setDecidindoAlcadaReprovacao] = useState(false);

  // Função para detectar se é PropostaCompleta ou PropostaUI
  const isPropostaCompleta = (prop: PropostaCompleta | PropostaUI): prop is PropostaCompleta => {
    return 'cliente' in prop && typeof prop.cliente === 'object';
  };

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

  // Função para extrair dados da proposta independente do formato
  const getPropostaData = () => {
    if (isPropostaCompleta(proposta)) {
      return {
        id: proposta.id || null,
        numero: proposta.numero || 'N/A',
        total: proposta.total || 0,
        dataValidade: proposta.dataValidade
          ? proposta.dataValidade.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        titulo: proposta.titulo || 'Proposta comercial',
        status: proposta.status || 'rascunho',
      };
    } else {
      return {
        id: proposta.id || null,
        numero: proposta.numero || 'N/A',
        total: (proposta as any).valor || 0,
        dataValidade: proposta.data_vencimento || new Date().toISOString().split('T')[0],
        titulo: proposta.titulo || 'Proposta comercial',
        status: proposta.status || 'rascunho',
      };
    }
  };

  const formatarDataIso = (value: unknown, fallback: Date) => {
    const parsed = value ? new Date(String(value)) : fallback;
    if (Number.isNaN(parsed.getTime())) {
      return fallback.toISOString().split('T')[0];
    }
    return parsed.toISOString().split('T')[0];
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

  const descreverFormaPagamentoPdf = (formaPagamento: unknown, parcelas?: unknown) => {
    const normalized = String(formaPagamento || '')
      .trim()
      .toLowerCase();
    const numeroParcelas = Number(parcelas || 0);

    if (normalized === 'avista' || normalized === 'a_vista' || normalized === 'a-vista') {
      return 'À vista';
    }
    if (normalized === 'boleto') {
      return 'Boleto bancário';
    }
    if (normalized === 'cartao' || normalized === 'cartao_credito') {
      return 'Cartão de crédito';
    }
    if (normalized === 'pix') {
      return 'PIX';
    }
    if (normalized === 'parcelado') {
      return numeroParcelas > 0 ? `Parcelado em até ${numeroParcelas}x` : 'Parcelado';
    }

    return 'Conforme negociação comercial';
  };

  const montarDadosPdfProposta = async (): Promise<DadosProposta> => {
    const cliente = await getClienteData({ allowLookup: true });
    const propostaData = getPropostaData();
    const propostaId = (proposta as any)?.id || propostaData.id;

    const extrairItensDaProposta = (fonte: any): any[] => {
      if (!fonte) {
        return [];
      }

      const listasDiretas = [
        fonte.produtos,
        fonte.itens,
        fonte.items,
        fonte.produtosSelecionados,
        fonte.snapshot?.produtos,
      ];

      for (const lista of listasDiretas) {
        if (Array.isArray(lista) && lista.length > 0) {
          return lista;
        }
      }

      const versoes = Array.isArray(fonte.versoes)
        ? fonte.versoes
        : Array.isArray(fonte.emailDetails?.versoes)
          ? fonte.emailDetails.versoes
          : [];
      if (versoes.length > 0) {
        const versoesOrdenadas = [...versoes].sort(
          (a: any, b: any) => Number(a?.versao || 0) - Number(b?.versao || 0),
        );
        const ultimaVersao = versoesOrdenadas[versoesOrdenadas.length - 1];
        const itensVersao = ultimaVersao?.snapshot?.produtos;
        if (Array.isArray(itensVersao) && itensVersao.length > 0) {
          return itensVersao;
        }
      }

      return [];
    };

    let fonteProposta: any = proposta as any;
    let itensOriginais = extrairItensDaProposta(fonteProposta);

    // Quando a linha da lista não carrega produtos completos, busca o detalhe da proposta.
    if (itensOriginais.length === 0 && propostaId) {
      try {
        const propostaDetalhada = await propostasApiService.findById(String(propostaId));
        if (propostaDetalhada) {
          fonteProposta = {
            ...fonteProposta,
            ...propostaDetalhada,
            cliente: (propostaDetalhada as any).cliente || fonteProposta.cliente,
            vendedor: (propostaDetalhada as any).vendedor || fonteProposta.vendedor,
          };
          itensOriginais = extrairItensDaProposta(propostaDetalhada as any);
        }
      } catch (error) {
        console.warn('Não foi possível carregar os itens detalhados da proposta para o PDF:', error);
      }
    }

    const itens = (
      itensOriginais.length > 0
        ? itensOriginais
        : [
            {
              nome: propostaData.titulo || 'Item da proposta',
              quantidade: 1,
              valorUnitario: Number(propostaData.total || 0),
              desconto: 0,
              valorTotal: Number(propostaData.total || 0),
            },
          ]
    ).map((item: any, index: number) => {
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

      return {
        nome,
        descricao: String(
          produto?.descricao || item?.descricao || item?.detalhes || item?.observacoes || '',
        ).trim(),
        quantidade,
        unidade:
          String(produto?.unidade || item?.unidade || item?.unidadeMedida || 'un').trim() || 'un',
        valorUnitario,
        desconto,
        valorTotal: Number.isFinite(valorTotal) ? valorTotal : valorTotalCalculado,
      };
    });

    const subtotalCalculado = itens.reduce((sum, item) => sum + Number(item.valorTotal || 0), 0);
    const subtotal = Number(fonteProposta?.subtotal ?? subtotalCalculado);
    const descontoGeral = Number(fonteProposta?.descontoGlobal ?? 0);
    const impostos = Number(fonteProposta?.impostos ?? 0);
    const valorTotal = Number(
      fonteProposta?.total ??
        propostaData.total ??
        fonteProposta?.valor ??
        subtotal - descontoGeral + impostos,
    );
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
    const observacoesFinal = observacoesRaw || undefined;

    return {
      numeroProposta: propostaData.numero,
      titulo: propostaData.titulo || 'Proposta Comercial',
      descricao: descricaoFinal,
      observacoes: observacoesFinal,
      status: statusFonte as DadosProposta['status'],
      dataEmissao: dataEmissaoIso,
      dataValidade: dataValidadeIso,
      empresa: {
        nome: 'ConectCRM',
      },
      cliente: {
        nome: String(clienteFonte?.nome || cliente.nome || '').trim() || 'Cliente',
        email: String(clienteFonte?.email || cliente.email || '').trim(),
        telefone: formatarTelefoneBr(clienteFonte?.telefone || cliente.telefone),
        empresa: String(clienteFonte?.empresa || (cliente as any)?.empresa || '').trim() || undefined,
      },
      vendedor: {
        nome:
          String(vendedorFonte?.nome || fonteProposta?.vendedor || '').trim() ||
          'Equipe comercial',
        email:
          String(vendedorFonte?.email || '').trim() ||
          'comercial@conectcrm.com',
        telefone: formatarTelefoneBr(vendedorFonte?.telefone),
      },
      itens,
      subtotal: Number.isFinite(subtotal) ? subtotal : subtotalCalculado,
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

  // 🚀 NOVAS FUNÇÕES DE AUTOMAÇÃO
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

  const obterContextoAutomacao = () => {
    if (!isPropostaCompleta(proposta)) {
      throw new Error(
        'Automacao disponivel apenas para propostas com dados completos de cliente e vendedor.',
      );
    }

    const propostaId = proposta.id;
    const clienteId = proposta.cliente?.id;
    const usuarioResponsavelId = proposta.vendedor?.id;

    if (!isUuid(propostaId)) {
      throw new Error('Proposta sem ID valido para gerar contrato/fatura.');
    }

    if (!isUuid(clienteId)) {
      throw new Error('Cliente da proposta sem ID valido. Atualize a proposta antes de continuar.');
    }

    if (!isUuid(usuarioResponsavelId)) {
      throw new Error('Vendedor/responsavel da proposta sem ID valido.');
    }

    return {
      propostaCompleta: proposta,
      propostaId,
      clienteId,
      usuarioResponsavelId,
    };
  };

  const mapFormaPagamentoProposta = (): FormaPagamento | undefined => {
    if (!isPropostaCompleta(proposta)) {
      return undefined;
    }

    switch (proposta.formaPagamento) {
      case 'boleto':
        return FormaPagamento.BOLETO;
      case 'cartao':
        return FormaPagamento.CARTAO_CREDITO;
      default:
        return undefined;
    }
  };

  const montarItensFatura = () => {
    const propostaData = getPropostaData();

    if (
      isPropostaCompleta(proposta) &&
      Array.isArray(proposta.produtos) &&
      proposta.produtos.length > 0
    ) {
      return proposta.produtos.map((item) => ({
        descricao: item.produto?.nome || 'Item da proposta',
        quantidade: Math.max(Number(item.quantidade || 1), 0.01),
        valorUnitario: Math.max(Number(item.produto?.preco || 0), 0.01),
        unidade: item.produto?.unidade || 'un',
        percentualDesconto: Number(item.desconto || 0),
        valorDesconto: 0,
      }));
    }

    return [
      {
        descricao: propostaData.titulo || `Proposta ${propostaData.numero}`,
        quantidade: 1,
        valorUnitario: Math.max(Number(propostaData.total || 0), 0.01),
        unidade: 'un',
        percentualDesconto: 0,
        valorDesconto: 0,
      },
    ];
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
        obterContextoAutomacao();
      const propostaData = getPropostaData();
      const valorTotal = Number(propostaData.total || 0);

      if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
        throw new Error('A proposta precisa ter valor total maior que zero para gerar contrato.');
      }

      const contratos = await contratoService.listarContratos();
      const contratoExistente = contratos.find(
        (contrato) => contrato.propostaId === propostaId && contrato.status !== 'cancelado',
      );

      if (contratoExistente) {
        toastService.info(
          `Ja existe contrato para esta proposta (${contratoExistente.numero || contratoExistente.id}).`,
        );
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
      onPropostaUpdated?.();
    } catch (error) {
      console.error('Erro ao gerar contrato automatico:', error);
      toastService.error(getErrorMessage(error, 'Erro ao gerar contrato a partir da proposta.'));
    } finally {
      setGerandoContrato(false);
    }
  };

  const buscarContratoDaProposta = async (propostaId: string) => {
    const contratos = await contratoService.listarContratos();
    return (
      contratos.find(
        (contrato) => contrato.propostaId === propostaId && contrato.status !== 'cancelado',
      ) || null
    );
  };

  // Criar fatura automática
  const handleCriarFatura = async () => {
    if (!podeCriarFatura()) {
      toastService.error('Apenas propostas com contrato assinado podem gerar faturas');
      return;
    }

    setCriandoFatura(true);
    try {
      const { propostaId, clienteId, usuarioResponsavelId } = obterContextoAutomacao();
      const propostaData = getPropostaData();
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
        formaPagamento: mapFormaPagamentoProposta(),
        observacoes: `Fatura gerada automaticamente a partir da proposta ${propostaData.numero}.`,
        itens: montarItensFatura(),
      });

      await sincronizarStatusProposta('fatura_criada', {
        source: 'automacao-fatura',
        observacoes: `Fatura ${fatura.numero || fatura.id} criada a partir da proposta.`,
      });
      toastService.success(`Fatura ${fatura.numero || fatura.id} criada com sucesso.`);
      onPropostaUpdated?.();
    } catch (error) {
      console.error('Erro ao criar fatura automatica:', error);
      toastService.error(getErrorMessage(error, 'Erro ao criar fatura a partir da proposta.'));
    } finally {
      setCriandoFatura(false);
    }
  };

  // Avançar para próxima etapa do fluxo
  const handleAvançarFluxo = async () => {
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

      // Determinar próxima ação baseada no status atual
      switch (status) {
        case 'rascunho':
          await handleSendEmail(); // Enviar proposta por email
          return;

        case 'enviada':
          await sincronizarStatusProposta('negociacao', {
            source: 'fluxo-avanco',
            observacoes: 'Status avancado automaticamente para negociacao.',
          });
          toastService.success('Proposta avancada para negociacao.');
          onPropostaUpdated?.();
          break;

        case 'negociacao': {
          const aprovar = window.confirm(
            'Deseja marcar esta proposta como APROVADA?\n\nClique em OK para aprovar ou Cancelar para rejeitar.',
          );

          if (aprovar) {
            await sincronizarStatusProposta('aprovada', {
              source: 'fluxo-avanco',
              observacoes: 'Proposta aprovada durante o fluxo de negociacao.',
            });
            toastService.success('Proposta marcada como aprovada.');
            onPropostaUpdated?.();
            break;
          }

          const motivoPerda = window.prompt(
            'Informe o motivo da perda (opcional):',
            'Cliente optou por outra proposta',
          );

          await sincronizarStatusProposta('rejeitada', {
            source: 'fluxo-avanco',
            motivoPerda: motivoPerda || undefined,
            observacoes: 'Proposta rejeitada durante o fluxo de negociacao.',
          });
          toastService.success('Proposta marcada como rejeitada.');
          onPropostaUpdated?.();
          break;
        }

        case 'aprovada':
          await handleGerarContrato(); // Gerar contrato
          break;

        case 'contrato_gerado': {
          const { propostaId } = obterContextoAutomacao();
          const contrato = await buscarContratoDaProposta(propostaId);
          if (!contrato) {
            toastService.info('Contrato nao encontrado. Gere o contrato para continuar o fluxo.');
            break;
          }

          if (String(contrato.status || '').toLowerCase() !== 'assinado') {
            toastService.info(
              'Aguardando assinatura do contrato. Assim que assinar, o fluxo avanca para faturamento.',
            );
            break;
          }

          await sincronizarStatusProposta('contrato_assinado', {
            source: 'fluxo-avanco',
            observacoes: `Contrato ${contrato.numero || contrato.id} assinado.`,
          });
          await handleCriarFatura();
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
          onPropostaUpdated?.();
          break;

        case 'aguardando_pagamento':
          toastService.info(
            'Pagamento deve ser confirmado no módulo de faturamento. A proposta será sincronizada automaticamente após a baixa da fatura.',
          );
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
      console.error('❌ Erro ao avançar fluxo:', error);
      toastService.error('Erro ao avançar fluxo. Tente novamente.');
    } finally {
      setAvancandoFluxo(false);
    }
  };

  const handleAprovarAlcada = async () => {
    if (!possuiAprovacaoPendente) {
      return;
    }

    const propostaData = getPropostaData();
    const propostaId = (proposta as any)?.id || propostaData.id;
    if (!propostaId) {
      toastService.error('Proposta sem identificador para aprovar alçada.');
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

      toastService.success('Alçada aprovada e proposta avançada para aprovada.');
      onPropostaUpdated?.();
    } catch (error) {
      console.error('Erro ao aprovar alçada interna:', error);
      toastService.error(getErrorMessage(error, 'Erro ao aprovar alçada interna.'));
    } finally {
      setDecidindoAlcadaAprovacao(false);
    }
  };

  const handleReprovarAlcada = async () => {
    if (!possuiAprovacaoPendente) {
      return;
    }

    const motivoReprovacao = window.prompt(
      'Informe o motivo da reprovação interna (opcional):',
      'Desconto acima da política comercial',
    );
    if (motivoReprovacao === null) {
      return;
    }

    const propostaData = getPropostaData();
    const propostaId = (proposta as any)?.id || propostaData.id;
    if (!propostaId) {
      toastService.error('Proposta sem identificador para reprovar alçada.');
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

      toastService.success('Alçada reprovada. A proposta permanece bloqueada para aprovação.');
      onPropostaUpdated?.();
    } catch (error) {
      console.error('Erro ao reprovar alçada interna:', error);
      toastService.error(getErrorMessage(error, 'Erro ao reprovar alçada interna.'));
    } finally {
      setDecidindoAlcadaReprovacao(false);
    }
  };

  // Enviar proposta por email
  const handleSendEmail = async () => {
    const clienteData = await getClienteData({ allowLookup: true });

    // Validar se o email é válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let emailFinal = (clienteData.email || '').trim();

    if (!emailFinal) {
      const emailInformado = prompt(
        `O cliente "${clienteData.nome}" não possui e-mail cadastrado.\n\nDigite o e-mail para envio da proposta:`,
      );

      if (!emailInformado) {
        toastService.error('Envio cancelado - E-mail é obrigatório');
        return;
      }

      if (!emailRegex.test(emailInformado)) {
        toastService.error('E-mail informado é inválido: ' + emailInformado);
        return;
      }

      emailFinal = emailInformado;
    }

    // 🚨 DETECÇÃO DE EMAIL FICTÍCIO - Solicitar email real
    const isEmailFicticio =
      emailFinal.includes('@cliente.com') ||
      emailFinal.includes('@cliente.temp') ||
      emailFinal.includes('@email.com') ||
      emailFinal.includes('@exemplo.com') ||
      emailFinal.includes('@cliente.') ||
      emailFinal.includes('@temp.') ||
      emailFinal.includes('@ficticio.');

    if (isEmailFicticio) {
      // Solicitar email real do usuário
      const emailReal = prompt(
        `O email cadastrado "${clienteData.email}" é fictício.\n\nPor favor, digite o email REAL do cliente "${clienteData.nome}":\n\n(Ex: dhonlenofreitas@hotmail.com)`,
      );

      if (!emailReal) {
        toastService.error('Envio cancelado - Email real é obrigatório');
        return;
      }

      if (!emailRegex.test(emailReal)) {
        toastService.error('Email informado é inválido: ' + emailReal);
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

      const emailData = {
        cliente: {
          nome: clienteData.nome,
          email: emailFinal, // ✅ Usar email real corrigido pelo usuário
        },
        proposta: {
          id: String(propostaId),
          numero: propostaData.numero,
          valorTotal: propostaData.total,
          dataValidade: propostaData.dataValidade,
          token: token,
        },
        vendedor: {
          nome: 'Vendedor',
          email: 'vendedor@conectcrm.com',
          telefone: '(62) 99668-9991',
        },
        empresa: {
          nome: 'ConectCRM',
          email: 'conectcrm@gmail.com',
          telefone: '(62) 99668-9991',
          endereco: 'Goiânia/GO',
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
    const dadosPDF = await montarDadosPdfProposta();

    if (!dadosPDF.cliente?.telefone) {
      toastService.error('Cliente não possui telefone cadastrado');
      return;
    }

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
    const propostaData = getPropostaData();
    const propostaId = (proposta as any)?.id || (propostaData as any)?.id;
    if (!propostaId) {
      toastService.error('Proposta sem ID para gerar link do portal');
      return;
    }
    const token = await portalClienteService.gerarTokenPublico(String(propostaId));
    const clienteData = await getClienteData();
    const shareUrl = `${window.location.origin}/portal/${propostaData.numero}/${token}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Proposta ${propostaData.numero} - ConectCRM`,
          text: `Proposta comercial para ${clienteData.nome}`,
          url: shareUrl,
        });
        toastService.success('Proposta compartilhada');
      } catch (error) {
        // Fallback para cópia do link
        navigator.clipboard.writeText(shareUrl);
        toastService.success('Link da proposta copiado');
      }
    } else {
      // Fallback para navegadores sem suporte ao Web Share API
      navigator.clipboard.writeText(shareUrl);
      toastService.success('Link da proposta copiado');
    }
  };

  const buttonClass = showLabels
    ? 'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors'
    : 'p-2 rounded-md transition-colors';
  const statusFluxoAtual = String(getPropostaData().status || '')
    .trim()
    .toLowerCase();
  const pagamentoControladoNoFinanceiro = statusFluxoAtual === 'aguardando_pagamento';
  const tituloBotaoFluxo = pagamentoControladoNoFinanceiro
    ? 'Pagamento desta proposta é controlado no módulo de faturamento'
    : 'Avançar para próxima etapa do fluxo automatizado';

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Visualizar */}
      {!hideView && (
        <button
          onClick={() => onViewProposta(proposta)}
          className={`${buttonClass} text-blue-600 hover:text-blue-900 hover:bg-blue-50`}
          title="Visualizar proposta"
        >
          <Eye className="w-4 h-4" />
          {showLabels && <span>Visualizar</span>}
        </button>
      )}

      {/* Email */}
      <button
        onClick={handleSendEmail}
        disabled={sendingEmail}
        className={`${buttonClass} text-green-600 hover:text-green-900 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={clienteData?.email ? 'Enviar por email' : 'Informar e-mail e enviar'}
      >
        {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {showLabels && <span>Email</span>}
      </button>

      {/* WhatsApp */}
      <button
        onClick={handleSendWhatsApp}
        disabled={!clienteData?.nome}
        className={`${buttonClass} text-green-500 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={
          clienteData?.telefone
            ? 'Enviar por WhatsApp'
            : 'Enviar por WhatsApp (o telefone será validado ao iniciar o envio)'
        }
      >
        <MessageSquare className="w-4 h-4" />
        {showLabels && <span>WhatsApp</span>}
      </button>

      {/* Download PDF */}
      <button
        onClick={handleDownloadPdf}
        disabled={downloadingPdf}
        className={`${buttonClass} text-red-600 hover:text-red-900 hover:bg-red-50 disabled:opacity-50`}
        title="Baixar PDF"
      >
        {downloadingPdf ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        {showLabels && <span>PDF</span>}
      </button>

      {/* Compartilhar */}
      <button
        onClick={handleShare}
        className={`${buttonClass} text-purple-600 hover:text-purple-900 hover:bg-purple-50`}
        title="Compartilhar link"
      >
        <Share2 className="w-4 h-4" />
        {showLabels && <span>Compartilhar</span>}
      </button>

      {/* ✨ SEPARADOR VISUAL */}
      <div className="h-6 w-px bg-gray-300 mx-2"></div>
      {/* Decisao de alcada */}
      {possuiAprovacaoPendente && (
        <>
          <span
            className={`${buttonClass} text-amber-700 bg-amber-50 border border-amber-200 cursor-default`}
            title={
              aprovacaoInternaAtual?.motivo ||
              'Proposta com desconto acima da politica. Exige aprovacao interna.'
            }
          >
            <ShieldAlert className="w-4 h-4" />
            {showLabels && <span>Alcada pendente</span>}
          </span>

          <button
            onClick={handleAprovarAlcada}
            disabled={decidindoAlcadaAprovacao || decidindoAlcadaReprovacao}
            className={`${buttonClass} text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 disabled:opacity-50`}
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
            onClick={handleReprovarAlcada}
            disabled={decidindoAlcadaAprovacao || decidindoAlcadaReprovacao}
            className={`${buttonClass} text-rose-700 hover:text-rose-900 hover:bg-rose-50 disabled:opacity-50`}
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

      {/* 🚀 NOVOS BOTÕES DE AUTOMAÇÃO */}

      {/* Gerar Contrato */}
      {podeGerarContrato() && (
        <button
          onClick={handleGerarContrato}
          disabled={gerandoContrato || !automacaoAvancadaDisponivel}
          className={`${buttonClass} text-blue-600 hover:text-blue-900 hover:bg-blue-50 disabled:opacity-50`}
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
      {podeCriarFatura() && (
        <button
          onClick={handleCriarFatura}
          disabled={criandoFatura || !automacaoAvancadaDisponivel}
          className={`${buttonClass} text-green-600 hover:text-green-900 hover:bg-green-50 disabled:opacity-50`}
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

      {/* Avançar Fluxo */}
      <button
        onClick={handleAvançarFluxo}
        disabled={avancandoFluxo || bloqueadoPorAlcada}
        className={`${buttonClass} text-orange-600 hover:text-orange-900 hover:bg-orange-50 disabled:opacity-50`}
        title={tituloBotaoFluxo}
      >
        {avancandoFluxo ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ArrowRight className="w-4 h-4" />
        )}
        {showLabels && <span>Avançar Fluxo</span>}
      </button>

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
              nome: 'ConectCRM',
            },
          }}
          pdfBuffer={propostaPdfBuffer}
          onSuccess={() => {
            toastService.success('Proposta enviada via WhatsApp!');
            setShowWhatsAppModal(false);
          }}
        />
      )}
    </div>
  );
};

export default PropostaActions;
