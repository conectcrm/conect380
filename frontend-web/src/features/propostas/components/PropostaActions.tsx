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
import { pdfPropostasService } from '../../../services/pdfPropostasService';
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
const AUTOMACAO_FLUXO_MENSAGEM =
  'Automacao de contrato/fatura ainda indisponivel nesta versao. Use os modulos de Contratos e Faturamento.';
const clienteDetailsCache = new Map<
  string,
  { data: ClienteContatoData | null; expiresAt: number }
>();
const clienteDetailsPending = new Map<string, Promise<ClienteContatoData | null>>();

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

      let clientes = await clientesService.searchClientes(nome);

      if ((!clientes || clientes.length === 0) && nome.includes(' ')) {
        const partes = nome
          .split(' ')
          .map((parte) => parte.trim())
          .filter((parte) => parte.length >= 3);

        for (const parte of partes) {
          if (clientesService.isSearchRateLimited()) {
            console.warn(
              `⚠️ Busca de clientes interrompida por cooldown durante variação do nome "${nome}".`,
            );
            break;
          }

          clientes = await clientesService.searchClientes(parte);
          if (clientes && clientes.length > 0) {
            break;
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

  // Carregar dados do cliente quando o componente for montado
  const propostaIdentificador = React.useMemo(() => {
    if (!proposta) {
      return 'proposta_desconhecida';
    }

    if (isPropostaCompleta(proposta)) {
      return (
        proposta.id ||
        proposta.numero ||
        proposta.cliente?.id ||
        proposta.cliente?.nome ||
        'proposta_completa'
      );
    }

    return proposta.id || proposta.numero || proposta.cliente;
  }, [proposta]);

  React.useEffect(() => {
    let isMounted = true;

    const loadClienteData = async () => {
      const data = await getClienteData();
      if (isMounted) {
        setClienteData(data);
      }
    };

    loadClienteData();

    return () => {
      isMounted = false;
    };
  }, [propostaIdentificador]);

  // Função para extrair dados do cliente independente do formato
  const getClienteData = async () => {
    if (isPropostaCompleta(proposta)) {
      // ✅ Formato completo - verificar se precisa buscar dados reais
      const nome = proposta.cliente?.nome || 'Cliente';
      const email = proposta.cliente?.email || '';
      const telefone = proposta.cliente?.telefone || '';

      // 🚨 VERIFICAR SE EMAIL É FICTÍCIO E BUSCAR DADOS REAIS
      const isEmailFicticio =
        email.includes('@cliente.com') ||
        email.includes('@cliente.temp') ||
        email.includes('@email.com');

      if (nome && nome !== 'Cliente' && (isEmailFicticio || !telefone)) {
        const dadosReais = await buscarClienteComCache(nome);

        if (dadosReais) {
          return {
            nome: dadosReais.nome,
            email: dadosReais.email || email,
            telefone: dadosReais.telefone || telefone,
          };
        }
      }

      // Retornar dados originais se não conseguiu buscar reais
      return { nome, email, telefone };
    } else {
      // 🔧 Formato UI - buscar dados reais do cliente no backend
      const nome = proposta.cliente || 'Cliente';

      // 1️⃣ TENTATIVA: Verificar se cliente_contato já é um email válido
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let email = '';
      let telefone = '';

      // Verificar se cliente_contato contém email válido
      if (proposta.cliente_contato && emailRegex.test(proposta.cliente_contato)) {
        email = proposta.cliente_contato;
      } else if (proposta.cliente_contato && proposta.cliente_contato.includes('(')) {
        // Se contém parênteses, provavelmente é telefone
        telefone = proposta.cliente_contato;
      }

      // 2️⃣ TENTATIVA: Buscar cliente real por nome no backend (com cache para evitar 429)
      if (nome && nome !== 'Cliente') {
        const dadosReais = await buscarClienteComCache(nome);

        if (dadosReais) {
          return {
            nome: dadosReais.nome,
            email: dadosReais.email || email,
            telefone: dadosReais.telefone || telefone,
          };
        }
      }

      return { nome, email, telefone };
    }
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
    const status = getPropostaData().status;
    return status === 'aprovada' || status === 'aceita' || status === 'negociacao';
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
          await sincronizarStatusProposta('pago', {
            source: 'fluxo-avanco',
            observacoes: 'Pagamento confirmado no fluxo de propostas.',
          });
          toastService.success('Status atualizado para pago.');
          onPropostaUpdated?.();
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
    const clienteData = await getClienteData();

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
    const clienteData = await getClienteData();

    if (!clienteData?.telefone) {
      toastService.error('Cliente não possui telefone cadastrado');
      return;
    }

    // Gerar PDF para anexar
    try {
      const propostaData = getPropostaData();
      const pdfBlob = await pdfPropostasService.gerarPdf('proposta', {
        numeroProposta: propostaData.numero,
        titulo: propostaData.titulo,
        cliente: {
          nome: clienteData.nome,
          email: clienteData.email || '',
          telefone: clienteData.telefone,
        },
        vendedor: {
          nome: 'ConectCRM',
          email: 'vendedor@conectcrm.com',
        },
        empresa: { nome: 'ConectCRM' },
        valorTotal: propostaData.total,
        itens: [],
        formaPagamento: 'Conforme acordo',
        prazoEntrega: '30 dias',
        garantia: '12 meses',
        validadeProposta: '30 dias',
        condicoesGerais: [],
        observacoes: propostaData.titulo,
      });

      // Converter Blob para Uint8Array
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      setPropostaPdfBuffer(uint8Array);
    } catch (error) {
      console.error('Erro ao gerar PDF, enviando sem anexo:', error);
      setPropostaPdfBuffer(null);
    }

    // Abrir modal do WhatsApp
    setShowWhatsAppModal(true);
  };

  // Download da proposta em PDF
  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const clienteData = await getClienteData();
      const propostaData = getPropostaData();

      // Usar serviço real de PDF
      const dadosPDF = {
        numeroProposta: propostaData.numero,
        titulo: propostaData.titulo || 'Proposta Comercial',
        cliente: {
          nome: clienteData.nome,
          email: clienteData.email || '',
          telefone: clienteData.telefone,
          empresa: (clienteData as any).empresa,
        },
        vendedor: {
          nome: 'Admin',
          email: 'admin@conectcrm.com',
          telefone: '(11) 99999-9999',
        },
        itens: (propostaData as any).produtos || [],
        subtotal: (propostaData as any).subtotal || 0,
        valorTotal: propostaData.total || 0,
        formaPagamento: (propostaData as any).formaPagamento || 'A vista',
        prazoEntrega: '30 dias',
        validadeProposta: `${(propostaData as any).validadeDias || 30} dias`,
      };

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
        disabled={!clienteData?.telefone}
        className={`${buttonClass} text-green-500 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={clienteData?.telefone ? 'Enviar por WhatsApp' : 'Cliente sem telefone'}
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
        title="Avançar para próxima etapa do fluxo automatizado"
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
