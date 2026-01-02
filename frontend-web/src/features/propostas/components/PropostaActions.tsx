import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Eye,
  Mail,
  MessageSquare,
  Download,
  Share2,
  Send,
  Loader2,
  FileText,
  CreditCard,
  PlayCircle,
  CheckCircle,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { emailServiceReal } from '../../../services/emailServiceReal';
import { PropostaCompleta } from '../services/propostasService';
import { clientesService } from '../../../services/clientesService';
import { pdfPropostasService } from '../../../services/pdfPropostasService';
import ModalEnviarWhatsApp from '../../../components/whatsapp/ModalEnviarWhatsApp';
import { faturamentoService } from '../../../services/faturamentoService';
import { contratoService } from '../../../services/contratoService';
import { faturamentoAPI } from '../../../services/faturamentoAPI';
import { api } from '../../../services/api';

type ClienteContatoData = {
  nome: string;
  email: string;
  telefone: string;
};

const CLIENTE_DETAILS_TTL = 5 * 60 * 1000; // 5 minutos
const CLIENTE_DETAILS_COOLDOWN_TTL = 30 * 1000; // Evita loop de erros
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
};

interface PropostaActionsProps {
  proposta: PropostaCompleta | PropostaUI;
  onViewProposta: (proposta: PropostaCompleta | PropostaUI) => void;
  className?: string;
  showLabels?: boolean;
}

const PropostaActions: React.FC<PropostaActionsProps> = ({
  proposta,
  onViewProposta,
  className = '',
  showLabels = false,
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

  // Função para detectar se é PropostaCompleta ou PropostaUI
  const isPropostaCompleta = (prop: PropostaCompleta | PropostaUI): prop is PropostaCompleta => {
    return 'cliente' in prop && typeof prop.cliente === 'object';
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
        numero: proposta.numero || 'N/A',
        total: proposta.valor || 0,
        dataValidade: proposta.data_vencimento || new Date().toISOString().split('T')[0],
        titulo: proposta.titulo || 'Proposta comercial',
        status: proposta.status || 'rascunho',
      };
    }
  };

  // Gerar token de acesso para a proposta
  const generateAccessToken = () => {
    // Gera um token numérico de 6 dígitos (mais fácil para o cliente)
    return Math.floor(Math.random() * 900000 + 100000).toString();
  };

  // 🚀 NOVAS FUNÇÕES DE AUTOMAÇÃO

  // Verificar se proposta pode gerar contrato
  const podeGerarContrato = () => {
    const status = getPropostaData().status;
    return status === 'aprovada' || status === 'aceita' || status === 'negociacao';
  };

  // Verificar se proposta pode criar fatura
  const podeCriarFatura = () => {
    const status = getPropostaData().status;
    return status === 'aprovada' || status === 'contrato_assinado';
  };

  // Gerar contrato a partir da proposta
  const handleGerarContrato = async () => {
    if (!podeGerarContrato()) {
      toast.error('Apenas propostas aprovadas podem gerar contratos');
      return;
    }

    setGerandoContrato(true);
    try {
      const propostaData = getPropostaData();
      const clienteData = await getClienteData();

      // Preparar dados no formato esperado pelo backend
      const contratoData = {
        propostaId: parseInt(propostaData.numero) || 1, // Converter para number
        clienteId: Date.now() % 999999, // Gerar ID único simples
        usuarioResponsavelId: 1, // ID do usuário responsável (vendedor)
        tipo: 'servico' as const, // Tipo do contrato
        objeto: propostaData.titulo || `Contrato referente à proposta ${propostaData.numero}`,
        valorTotal: propostaData.total,
        dataInicio: new Date().toISOString().split('T')[0], // Data de hoje
        dataFim: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano
        dataVencimento:
          propostaData.dataValidade ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        observacoes: `Contrato gerado automaticamente a partir da proposta ${propostaData.numero}`,
        condicoesPagamento: {
          parcelas: 1,
          formaPagamento: 'À vista',
          diaVencimento: 10,
          valorParcela: propostaData.total,
        },
      };

      // Usar o serviço de contratos
      const contrato = await contratoService.criarContrato(contratoData);

      if (contrato) {
        toast.success(`✅ Contrato ${contrato.numero} gerado com sucesso!`);

        // Disparar evento para atualizar a interface
        const eventoAtualizacao = new CustomEvent('propostaAtualizada', {
          detail: {
            propostaId: propostaData.numero,
            novoStatus: 'contrato_gerado',
            acao: 'contrato_gerado',
            contratoId: contrato.id,
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(eventoAtualizacao);

        // Abrir página do contrato gerado
        if (window.confirm('Deseja visualizar o contrato gerado?')) {
          window.open(`/contratos/${contrato.id}`, '_blank');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao gerar contrato:', error);
      toast.error('Erro ao gerar contrato. Tente novamente.');
    } finally {
      setGerandoContrato(false);
    }
  };

  // Criar fatura automática
  const handleCriarFatura = async () => {
    if (!podeCriarFatura()) {
      toast.error('Apenas propostas aprovadas podem gerar faturas');
      return;
    }

    setCriandoFatura(true);
    try {
      const propostaData = getPropostaData();
      const clienteData = await getClienteData();

      const faturaData = {
        contratoId: propostaData.numero, // Temporário até ter contrato real
        clienteId: propostaData.numero, // Temporário
        usuarioResponsavelId: 'user_temp', // Temporário
        tipo: 'entrada' as const,
        descricao: `Fatura referente à proposta ${propostaData.numero} - ${propostaData.titulo}`,
        dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        itens: [
          {
            descricao: propostaData.titulo,
            quantidade: 1,
            valorUnitario: propostaData.total,
            valorDesconto: 0,
          },
        ],
      };

      // Usar o serviço de faturamento
      const fatura = await faturamentoAPI.criarFatura(faturaData);

      if (fatura) {
        toast.success(`✅ Fatura ${fatura.numero} criada com sucesso!`);

        // Disparar evento para atualizar a interface
        const eventoAtualizacao = new CustomEvent('propostaAtualizada', {
          detail: {
            propostaId: propostaData.numero,
            novoStatus: 'fatura_criada',
            acao: 'fatura_criada',
            faturaId: fatura.numero,
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(eventoAtualizacao);

        // Navegar para página de faturamento (opcional)
        if (window.confirm('Deseja visualizar a fatura criada?')) {
          window.open(`/faturamento#fatura-${fatura.id}`, '_blank');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao criar fatura:', error);
      toast.error('Erro ao criar fatura. Tente novamente.');
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

      let proximaAcao = '';
      let novoStatus = '';

      // Determinar próxima ação baseada no status atual
      switch (status) {
        case 'rascunho':
          proximaAcao = 'enviar_proposta';
          novoStatus = 'enviada';
          await handleSendEmail(); // Enviar proposta por email
          break;

        case 'enviada':
        case 'negociacao':
          proximaAcao = 'aprovar_proposta';
          novoStatus = 'aprovada';
          // Marcar como aprovada no sistema
          toast.success('✅ Proposta marcada como aprovada');
          break;

        case 'aprovada':
          proximaAcao = 'gerar_contrato';
          novoStatus = 'contrato_gerado';
          await handleGerarContrato(); // Gerar contrato
          break;

        case 'contrato_gerado':
          proximaAcao = 'criar_fatura';
          novoStatus = 'fatura_criada';
          await handleCriarFatura(); // Criar fatura
          break;

        case 'fatura_criada':
          proximaAcao = 'aguardar_pagamento';
          novoStatus = 'aguardando_pagamento';
          toast('📧 Fatura enviada para cobrança automática', { icon: 'ℹ️' });
          break;

        default:
          toast('Esta proposta já está na última etapa do fluxo', { icon: 'ℹ️' });
          return;
      }

      // Disparar evento para atualizar a interface
      const eventoAtualizacao = new CustomEvent('propostaAtualizada', {
        detail: {
          propostaId: propostaData.numero,
          novoStatus: novoStatus,
          acao: proximaAcao,
          timestamp: new Date().toISOString(),
        },
      });
      window.dispatchEvent(eventoAtualizacao);
    } catch (error) {
      console.error('❌ Erro ao avançar fluxo:', error);
      toast.error('Erro ao avançar fluxo. Tente novamente.');
    } finally {
      setAvancandoFluxo(false);
    }
  };

  // Enviar proposta por email
  const handleSendEmail = async () => {
    const clienteData = await getClienteData();

    if (!clienteData.email) {
      toast.error('Cliente não possui email cadastrado');
      return;
    }

    // Validar se o email é válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteData.email)) {
      toast.error('Email do cliente é inválido: ' + clienteData.email);
      return;
    }

    // 🚨 DETECÇÃO DE EMAIL FICTÍCIO - Solicitar email real
    const isEmailFicticio =
      clienteData.email.includes('@cliente.com') ||
      clienteData.email.includes('@cliente.temp') ||
      clienteData.email.includes('@email.com') ||
      clienteData.email.includes('@exemplo.com') ||
      clienteData.email.includes('@cliente.') ||
      clienteData.email.includes('@temp.') ||
      clienteData.email.includes('@ficticio.');

    let emailFinal = clienteData.email;

    if (isEmailFicticio) {
      // Solicitar email real do usuário
      const emailReal = prompt(
        `O email cadastrado "${clienteData.email}" é fictício.\n\nPor favor, digite o email REAL do cliente "${clienteData.nome}":\n\n(Ex: dhonlenofreitas@hotmail.com)`,
      );

      if (!emailReal) {
        toast.error('Envio cancelado - Email real é obrigatório');
        return;
      }

      if (!emailRegex.test(emailReal)) {
        toast.error('Email informado é inválido: ' + emailReal);
        return;
      }

      emailFinal = emailReal; // Usar o email real
      toast.success(`Email corrigido de "${clienteData.email}" para "${emailReal}"`);
    }

    setSendingEmail(true);
    try {
      const token = generateAccessToken();
      const propostaData = getPropostaData();

      const emailData = {
        cliente: {
          nome: clienteData.nome,
          email: emailFinal, // ✅ Usar email real corrigido pelo usuário
        },
        proposta: {
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
        toast.success(`✅ Proposta enviada por email para ${clienteData.nome}`);
        // Criar evento personalizado para notificar a PropostasPage
        const eventoAtualizacao = new CustomEvent('propostaAtualizada', {
          detail: {
            propostaId: propostaData.numero,
            novoStatus: 'enviada', // Status automaticamente alterado pelo backend
            fonte: 'email',
            timestamp: new Date().toISOString(),
          },
        });

        // Disparar o evento globalmente
        window.dispatchEvent(eventoAtualizacao);

        // ⚡ OTIMIZADO: Remover segundo evento desnecessário para evitar auto-refresh
        // O evento único acima já é suficiente para atualizar a interface
      } else {
        toast.error(`❌ Erro ao enviar email: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar email da proposta');
    } finally {
      setSendingEmail(false);
    }
  };

  // Enviar proposta por WhatsApp
  const handleSendWhatsApp = async () => {
    const clienteData = await getClienteData();

    if (!clienteData?.telefone) {
      toast.error('Cliente não possui telefone cadastrado');
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
          empresa: clienteData.empresa,
        },
        vendedor: {
          nome: 'Admin',
          email: 'admin@conectcrm.com',
          telefone: '(11) 99999-9999',
        },
        itens: propostaData.produtos || [],
        subtotal: propostaData.subtotal || 0,
        valorTotal: propostaData.total || 0,
        formaPagamento: propostaData.formaPagamento || 'À vista',
        prazoEntrega: '30 dias',
        validadeProposta: `${propostaData.validadeDias || 30} dias`,
      };

      await pdfPropostasService.downloadPdf('comercial', dadosPDF);

      toast.success(`📄 PDF da proposta ${propostaData.numero} baixado`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF da proposta');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Compartilhar proposta
  const handleShare = async () => {
    const token = generateAccessToken();
    const propostaData = getPropostaData();
    const clienteData = await getClienteData();
    const shareUrl = `${window.location.origin}/portal-cliente/${propostaData.numero}/${token}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Proposta ${propostaData.numero} - ConectCRM`,
          text: `Proposta comercial para ${clienteData.nome}`,
          url: shareUrl,
        });
        toast.success('🔗 Proposta compartilhada');
      } catch (error) {
        // Fallback para cópia do link
        navigator.clipboard.writeText(shareUrl);
        toast.success('🔗 Link da proposta copiado');
      }
    } else {
      // Fallback para navegadores sem suporte ao Web Share API
      navigator.clipboard.writeText(shareUrl);
      toast.success('🔗 Link da proposta copiado');
    }
  };

  const buttonClass = showLabels
    ? 'flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors'
    : 'p-2 rounded-md transition-colors';

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Visualizar */}
      <button
        onClick={() => onViewProposta(proposta)}
        className={`${buttonClass} text-blue-600 hover:text-blue-900 hover:bg-blue-50`}
        title="Visualizar proposta"
      >
        <Eye className="w-4 h-4" />
        {showLabels && <span>Visualizar</span>}
      </button>

      {/* Email */}
      <button
        onClick={handleSendEmail}
        disabled={sendingEmail || !clienteData?.email}
        className={`${buttonClass} text-green-600 hover:text-green-900 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={clienteData?.email ? 'Enviar por email' : 'Cliente sem email'}
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

      {/* 🚀 NOVOS BOTÕES DE AUTOMAÇÃO */}

      {/* Gerar Contrato */}
      {podeGerarContrato() && (
        <button
          onClick={handleGerarContrato}
          disabled={gerandoContrato}
          className={`${buttonClass} text-blue-600 hover:text-blue-900 hover:bg-blue-50 disabled:opacity-50`}
          title="Gerar contrato a partir desta proposta"
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
          disabled={criandoFatura}
          className={`${buttonClass} text-green-600 hover:text-green-900 hover:bg-green-50 disabled:opacity-50`}
          title="Criar fatura automática"
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
        disabled={avancandoFluxo}
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
            toast.success('Proposta enviada via WhatsApp!');
            setShowWhatsAppModal(false);
          }}
        />
      )}
    </div>
  );
};

export default PropostaActions;
