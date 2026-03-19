/**
 * Portal do Cliente - Página de Aceite de Proposta
 * Permite que clientes visualizem e aceitem propostas enviadas
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Download,
  FileText,
  MessageSquare,
  Building,
  Package,
  Shield,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { portalClienteService, type PropostaPublica } from '../../services/portalClienteService';
import { formatarTokenParaExibicao } from '../../utils/tokenUtils';
import { StatusSyncIndicator } from './components/StatusSyncIndicator';
import { API_BASE_URL } from '../../services/api';

const PORTAL_API_BASE = `${API_BASE_URL}/api/portal`;

const PortalClienteProposta: React.FC = () => {
  const { propostaId, propostaNumero, token } = useParams<{
    propostaId?: string;
    propostaNumero?: string;
    token?: string;
  }>();
  const navigate = useNavigate();

  // Usar propostaNumero se disponível, senão usar propostaId
  const identificadorProposta = propostaNumero || propostaId;

  // Token para aceite: usar token específico ou identificador da proposta
  const tokenParaAceite = token || identificadorProposta;

  const [proposta, setProposta] = useState<PropostaPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [processandoAceite, setProcessandoAceite] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aceiteRealizado, setAceiteRealizado] = useState(false);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [showSolicitarAjustes, setShowSolicitarAjustes] = useState(false);
  const [motivoAjustes, setMotivoAjustes] = useState('');
  const [processandoNegociacao, setProcessandoNegociacao] = useState(false);
  const [tempoVisualizacao, setTempoVisualizacao] = useState<number>(0);

  useEffect(() => {
    if (identificadorProposta) {
      carregarProposta();
    }
  }, [identificadorProposta]);

  // ✅ Hook para rastrear tempo de visualização
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (proposta && proposta.status !== 'aprovada' && proposta.status !== 'rejeitada') {
      interval = setInterval(() => {
        setTempoVisualizacao((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [proposta]);

  // ✅ Registrar visualização quando a página carrega
  useEffect(() => {
    if (proposta && tokenParaAceite) {
      registrarAcao('visualizacao_inicial');
    }
  }, [proposta, tokenParaAceite]);

  // ✅ Rastrear eventos de interação adicional
  useEffect(() => {
    const handleBeforeUnload = () => {
      registrarAcao('saida_pagina', {
        tempoVisualizacao: tempoVisualizacao,
        scrollPosition: window.scrollY,
      });
    };

    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 50) {
        registrarAcao('scroll_50_porcento', { scrollPercent });
      }
      if (scrollPercent > 90) {
        registrarAcao('scroll_completo', { scrollPercent });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registrarAcao('aba_inativa', { tempoVisualizacao });
      } else {
        registrarAcao('aba_ativa', { tempoVisualizacao });
      }
    };

    // Adicionar listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('scroll', handleScroll);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tempoVisualizacao, tokenParaAceite]);

  // ✅ Função para registrar ações do cliente
  const registrarAcao = async (tipoAcao: string, dados?: unknown) => {
    if (!tokenParaAceite) return;

    const acao = {
      acao: tipoAcao,
      timestamp: new Date().toISOString(),
      dados,
    };

    try {
      // ✅ Enviar para backend via portal API
      await fetch(`${PORTAL_API_BASE}/proposta/${tokenParaAceite}/acao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acao: tipoAcao,
          timestamp: acao.timestamp,
          ip: await obterIP(),
          userAgent: navigator.userAgent,
          dados: dados || {
            tempoVisualizacao: tempoVisualizacao,
            resolucaoTela: `${window.screen.width}x${window.screen.height}`,
            navegador: navigator.userAgent.split(' ')[0],
          },
        }),
      });

      console.log(`📊 Ação registrada: ${tipoAcao}`, acao);
    } catch (error) {
      console.warn('⚠️ Erro ao registrar ação:', error);
    }
  };

  // ✅ Função auxiliar para obter IP
  const obterIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '127.0.0.1';
    }
  };

  const carregarProposta = async () => {
    try {
      setLoading(true);
      const chaveAcesso = tokenParaAceite || identificadorProposta;

      if (!chaveAcesso) {
        setErro('Token da proposta ausente ou inválido.');
        return;
      }

      const dados = await portalClienteService.obterPropostaPublica(chaveAcesso);

      if (!dados) {
        setErro('Proposta não encontrada ou link inválido.');
        return;
      }

      // Verificar se proposta ainda é válida
      const agora = new Date();
      const dataValidade = new Date(dados.dataValidade);

      if (agora > dataValidade && dados.status === 'enviada') {
        dados.status = 'expirada';
        console.log('Proposta expirada, atualizando status localmente');
      }

      setProposta(dados);

      // ✅ Registrar visualização automaticamente se ainda não foi visualizada
      if (dados.status === 'enviada' && tokenParaAceite) {
        console.log('🔄 Registrando visualização automática...');

        try {
          // Registrar via portal API para sincronização automática
          await fetch(`${PORTAL_API_BASE}/proposta/${tokenParaAceite}/view`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ip: await obterIP(),
              userAgent: navigator.userAgent,
              timestamp: new Date().toISOString(),
              resolucaoTela: `${window.screen.width}x${window.screen.height}`,
              referrer: document.referrer,
            }),
          });

          // Atualizar status local para "visualizada"
          setProposta((prev) => (prev ? { ...prev, status: 'visualizada' } : null));
          console.log('✅ Status atualizado para "visualizada"');
        } catch (error) {
          console.warn('⚠️ Erro ao registrar visualização, continuando:', error);
          // Atualizar localmente mesmo se a API falhar
          setProposta((prev) => (prev ? { ...prev, status: 'visualizada' } : null));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar proposta:', error);
      setErro('Erro ao carregar a proposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAceitarProposta = async () => {
    if (!proposta || !tokenParaAceite) return;

    try {
      setProcessandoAceite(true);

      console.log('🚀 Iniciando processo de aceitação da proposta...');

      // ✅ Registrar ação de aceite
      await registrarAcao('aceite_iniciado', {
        valorProposta: proposta.valorTotal,
        tempoVisualizacao: tempoVisualizacao,
      });

      // 1. Atualizar status via portal do cliente
      await portalClienteService.atualizarStatus(tokenParaAceite, 'aprovada');
      console.log('✅ Status atualizado via portal');

      // ✅ Registrar conclusão do aceite
      await registrarAcao('aceite_concluido', {
        novoStatus: 'aprovada',
        metodoPagamento: 'pendente',
      });

      // 2. Tentar sincronizar com o CRM principal
      try {
        const syncResult = await portalClienteService.sincronizarComCRM(
          identificadorProposta!,
          'aprovada',
        );

        if (syncResult.success) {
          console.log('✅ Status sincronizado com CRM principal');
        } else {
          console.log('⏳ Sincronização pendente - será realizada posteriormente');
        }
      } catch (syncError) {
        console.warn('⚠️ Erro na sincronização, continuando com processo local:', syncError);
      }

      // 3. Iniciar processo de geração de contrato
      try {
        await iniciarGeracaoContrato(proposta);
        console.log('✅ Processo de contrato iniciado');
      } catch (contratoError) {
        console.warn('⚠️ Erro na geração de contrato, continuando:', contratoError);
      }

      // 4. Atualizar estado local - SEMPRE funciona
      setProposta((prev) => (prev ? { ...prev, status: 'aprovada' } : null));
      setAceiteRealizado(true);
      console.log('🎉 Proposta aprovada com sucesso! Verifique o CRM principal.');
    } catch (error) {
      console.error('❌ Erro ao aceitar proposta:', error);
      setErro('Erro ao aceitar a proposta. Tente novamente.');
    } finally {
      setProcessandoAceite(false);
    }
  };

  const handleRejeitarProposta = async () => {
    if (!proposta || !tokenParaAceite) return;

    // ✅ Registrar ação de rejeição iniciada
    await registrarAcao('rejeicao_iniciada', {
      valorProposta: proposta.valorTotal,
      tempoVisualizacao: tempoVisualizacao,
    });

    setShowConfirmReject(true);
  };

  const handleSolicitarAjustes = async () => {
    if (!proposta || !tokenParaAceite) return;

    await registrarAcao('negociacao_iniciada', {
      statusAtual: proposta.status,
      valorProposta: proposta.valorTotal,
      tempoVisualizacao: tempoVisualizacao,
    });

    setMotivoAjustes('');
    setShowSolicitarAjustes(true);
  };

  const confirmarSolicitacaoAjustes = async () => {
    if (!proposta || !tokenParaAceite) return;

    const motivoNormalizado = motivoAjustes.trim();
    if (motivoNormalizado.length < 8) {
      setErro('Descreva com mais detalhes o ajuste desejado (minimo de 8 caracteres).');
      return;
    }

    try {
      setProcessandoNegociacao(true);
      setErro(null);

      await portalClienteService.atualizarStatus(tokenParaAceite, 'negociacao', motivoNormalizado);

      await registrarAcao('negociacao_solicitada', {
        novoStatus: 'negociacao',
        motivoAjustes: motivoNormalizado,
      });

      setProposta((prev) => (prev ? { ...prev, status: 'negociacao' } : null));
      setShowSolicitarAjustes(false);
      setMotivoAjustes('');
    } catch (error) {
      console.error('Erro ao solicitar ajustes:', error);
      setErro('Nao foi possivel registrar a solicitacao de ajustes. Tente novamente.');
    } finally {
      setProcessandoNegociacao(false);
    }
  };

  const confirmarRejeicao = async () => {
    if (!proposta || !tokenParaAceite) return;

    try {
      console.log('🚫 Rejeitando proposta...');

      // ✅ Atualizar status via portal
      await portalClienteService.atualizarStatus(tokenParaAceite, 'rejeitada');

      // ✅ Registrar ação de rejeição concluída
      await registrarAcao('rejeicao_concluida', {
        novoStatus: 'rejeitada',
        motivoRejeicao: 'cliente_rejeitou',
      });

      // Atualizar estado local
      setProposta((prev) => (prev ? { ...prev, status: 'rejeitada' } : null));
      setShowConfirmReject(false);

      console.log('✅ Proposta rejeitada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao rejeitar proposta:', error);
      setErro('Erro ao rejeitar a proposta. Tente novamente.');
      setShowConfirmReject(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!proposta || !tokenParaAceite) return;

    try {
      const pdfBlob = await portalClienteService.baixarPdfPublico(tokenParaAceite, 'comercial');
      const fileUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = `proposta-${proposta.numero || 'portal'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      const message =
        error instanceof Error && error.message ? error.message : 'Erro ao gerar PDF. Tente novamente.';
      setErro(message);
    }
  };

  const iniciarGeracaoContrato = async (proposta: PropostaPublica) => {
    await registrarAcao('solicitacao_contrato', {
      propostaId: proposta.id,
      propostaNumero: proposta.numero,
      valor: proposta.valorTotal,
    });
    console.log('Solicitacao de contrato registrada para proposta:', proposta.id);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'border border-[#D1D5DB] bg-[#F3F4F6] text-[#374151]';
      case 'enviada':
        return 'border border-[#BFDBFE] bg-[#DBEAFE] text-[#1D4ED8]';
      case 'visualizada':
        return 'border border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]';
      case 'negociacao':
        return 'border border-[#FCD34D] bg-[#FEF3C7] text-[#92400E]';
      case 'aprovada':
        return 'border border-[#BBF7D0] bg-[#DCFCE7] text-[#166534]';
      case 'rejeitada':
        return 'border border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]';
      case 'expirada':
        return 'border border-[#D1D5DB] bg-[#E5E7EB] text-[#374151]';
      default:
        return 'border border-[#D1D5DB] bg-[#F3F4F6] text-[#374151]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho';
      case 'enviada':
        return 'Enviada';
      case 'visualizada':
        return 'Visualizada';
      case 'negociacao':
        return 'Negociacao';
      case 'aprovada':
        return 'Aprovada';
      case 'rejeitada':
        return 'Rejeitada';
      case 'expirada':
        return 'Expirada';
      default:
        return 'Desconhecido';
    }
  };

  const calcularDiasRestantes = () => {
    if (!proposta) return 0;
    const agora = new Date();
    const validade = new Date(proposta.dataValidade);
    const diferenca = validade.getTime() - agora.getTime();
    return Math.max(0, Math.ceil(diferenca / (1000 * 60 * 60 * 24)));
  };

  const formatCurrency = (valor: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(valor || 0));

  const formatPercent = (valor: number) => `${Number(valor || 0).toFixed(2)}%`;

  const normalizeHexColor = (value?: string, fallback = '#159A9C') => {
    const candidate = String(value || '').trim();
    const normalized = candidate.startsWith('#') ? candidate : `#${candidate}`;
    return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const sanitized = hex.replace('#', '');
    const r = Number.parseInt(sanitized.slice(0, 2), 16);
    const g = Number.parseInt(sanitized.slice(2, 4), 16);
    const b = Number.parseInt(sanitized.slice(4, 6), 16);
    return [r, g, b];
  };

  const colorWithAlpha = (hex: string, alpha: number) => {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${Math.min(1, Math.max(0, alpha))})`;
  };

  const resolvedPrimaryColor = normalizeHexColor(proposta?.empresa?.corPrimaria, '#159A9C');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6F7] px-4">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
          <div className="w-full max-w-md rounded-[18px] border border-[#DEE8EC] bg-white p-8 text-center shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
            <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-[#D4E2E7] border-t-[#159A9C]" />
            <p className="text-sm font-medium text-[#607B89]">Carregando proposta...</p>
          </div>
        </div>
      </div>
    );
  }

  if (erro || !proposta) {
    return (
      <div className="min-h-screen bg-[#F3F6F7] px-4">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
          <div className="w-full max-w-md rounded-[18px] border border-[#FECACA] bg-white p-8 text-center shadow-[0_16px_30px_-24px_rgba(127,29,29,0.25)]">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-[#DC2626]" />
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#19384C]">Ops!</h2>
            <p className="mt-2 text-sm text-[#607B89]">{erro}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#159A9C] px-5 text-sm font-medium text-white transition hover:bg-[#117C7E]"
            >
              Ir para Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (aceiteRealizado) {
    return (
      <div className="min-h-screen bg-[#F3F6F7] px-4 py-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center">
          <div className="w-full rounded-[18px] border border-[#BBF7D0] bg-white p-8 shadow-[0_16px_30px_-24px_rgba(22,101,52,0.28)]">
            <div className="mb-5 flex justify-center">
              <div className="rounded-full bg-[#DCFCE7] p-3">
                <CheckCircle className="h-10 w-10 text-[#166534]" />
              </div>
            </div>
            <h2 className="text-center text-2xl font-semibold tracking-[-0.02em] text-[#19384C]">
              Proposta aceita com sucesso
            </h2>
            <p className="mt-2 text-center text-sm text-[#607B89]">
              Recebemos seu aceite. Nosso time vai seguir com a geracao do contrato.
            </p>

            <div className="mt-6 rounded-xl border border-[#CFE6D9] bg-[#F4FBF7] p-4">
              <div className="space-y-2 text-sm text-[#166534]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Aprovacao registrada no portal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Time comercial notificado</span>
                </div>
              </div>

              <div className="mt-4">
                <StatusSyncIndicator propostaId={identificadorProposta || proposta?.numero || ''} />
              </div>

              <div className="mt-4 rounded-lg border border-[#C7DDF8] bg-[#EFF6FF] p-3 text-sm text-[#1E3A8A]">
                <strong>Proximos passos:</strong> nossa equipe entra em contato em ate 2 horas uteis
                para iniciar a etapa de contrato.
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition"
                style={{ backgroundColor: resolvedPrimaryColor }}
              >
                <Download className="h-4 w-4" />
                Baixar proposta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const diasRestantes = calcularDiasRestantes();
  const subtotalItens = proposta.produtos.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  const subtotalProposta = Number(proposta.subtotal || subtotalItens || 0);
  const descontoGlobalPercentual = Math.min(100, Math.max(0, Number(proposta.descontoGlobal || 0)));
  const impostosPercentual = Math.min(100, Math.max(0, Number(proposta.impostos || 0)));
  const valorDescontoItens = proposta.produtos.reduce((acc, item) => {
    const quantidade = Number(item.quantidade || 0);
    const valorUnitario = Number(item.valorUnitario || 0);
    const descontoItem = Math.min(100, Math.max(0, Number(item.desconto || 0)));
    return acc + quantidade * valorUnitario * (descontoItem / 100);
  }, 0);
  const valorDescontoGlobal = subtotalProposta * (descontoGlobalPercentual / 100);
  const valorTotalDescontos = valorDescontoItens + valorDescontoGlobal;
  const baseImpostos = Math.max(0, subtotalProposta - valorDescontoGlobal);
  const valorImpostos = baseImpostos * (impostosPercentual / 100);
  const totalProposta = Number(proposta.total || proposta.valorTotal || 0);
  const divergenciaSubtotal = subtotalItens - subtotalProposta;
  const exibirDivergenciaSubtotal =
    proposta.produtos.length > 0 &&
    Number.isFinite(divergenciaSubtotal) &&
    Math.abs(divergenciaSubtotal) > 0.01;

  const statusesComAceite = new Set(['enviada', 'visualizada', 'negociacao']);
  const podeAceitar = statusesComAceite.has(String(proposta.status || '').toLowerCase()) && diasRestantes > 0;
  const negociacaoAtiva = String(proposta.status || '').toLowerCase() === 'negociacao';

  const primaryColor = resolvedPrimaryColor;
  const primaryTintSoft = colorWithAlpha(primaryColor, 0.1);
  const primaryTintStrong = colorWithAlpha(primaryColor, 0.16);

  return (
    <div className="min-h-screen bg-[#F3F6F7] text-[#1E3A4B]">
      <header className="border-b border-[#D6E2E6] bg-white/95">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {proposta.empresa.logo && (
                <img
                  src={proposta.empresa.logo}
                  alt={proposta.empresa.nome}
                  className="h-11 w-auto rounded-md border border-[#E0EBEF] bg-white p-1"
                />
              )}
              <div>
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[#19384C]">
                  {proposta.empresa.nome}
                </h1>
                <p className="text-sm text-[#607B89]">Proposta comercial</p>
                <p className="text-xs text-[#6D8694]">
                  Registro no sistema: {new Date(proposta.criadaEm).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(proposta.status)}`}
              >
                {getStatusText(proposta.status)}
              </span>
              {diasRestantes > 0 &&
                proposta.status !== 'aprovada' &&
                proposta.status !== 'rejeitada' && (
                  <p className="mt-1 text-sm text-[#607B89]">
                    <Clock className="mr-1 inline h-4 w-4" />
                    {diasRestantes} dias restantes
                  </p>
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-[18px] border border-[#DEE8EC] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-[#19384C]">
                <FileText className="h-5 w-5" style={{ color: primaryColor }} />
                Proposta {proposta.numero}
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#607B89]">
                    Informacoes gerais
                  </h3>
                  <div className="space-y-2 text-sm text-[#244455]">
                    <div>
                      <span className="font-semibold text-[#19384C]">Titulo:</span>{' '}
                      {proposta.titulo}
                    </div>
                    <div>
                      <span className="font-semibold text-[#19384C]">Data de envio:</span>{' '}
                      {new Date(proposta.dataEnvio).toLocaleDateString('pt-BR')}
                    </div>
                    <div>
                      <span className="font-semibold text-[#19384C]">Validade:</span>{' '}
                      {new Date(proposta.dataValidade).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#607B89]">
                    Vendedor responsavel
                  </h3>
                  <div className="space-y-2 text-sm text-[#244455]">
                    <div>
                      <span className="font-semibold text-[#19384C]">Nome:</span>{' '}
                      {proposta.vendedor.nome}
                    </div>
                    <div>
                      <span className="font-semibold text-[#19384C]">Email:</span>{' '}
                      {proposta.vendedor.email}
                    </div>
                    <div>
                      <span className="font-semibold text-[#19384C]">Telefone:</span>{' '}
                      {proposta.vendedor.telefone}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#DEE8EC] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-[#19384C]">
                <Package className="h-5 w-5" style={{ color: primaryColor }} />
                Produtos e servicos
              </h2>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-y border-[#E1EBEF] bg-[#F8FBFC]">
                      <th className="py-3 text-left text-sm font-semibold text-[#19384C]">Item</th>
                      <th className="py-3 text-center text-sm font-semibold text-[#19384C]">Qtd</th>
                      <th className="py-3 text-right text-sm font-semibold text-[#19384C]">
                        Valor unit.
                      </th>
                      <th className="py-3 text-right text-sm font-semibold text-[#19384C]">
                        Desconto
                      </th>
                      <th className="py-3 text-right text-sm font-semibold text-[#19384C]">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposta.produtos.map((produto, index) => (
                      <tr key={index} className="border-b border-[#EEF3F6]">
                        <td className="py-4">
                          <div>
                            <div className="font-medium text-[#19384C]">{produto.nome}</div>
                            <div className="text-sm text-[#607B89]">{produto.descricao}</div>
                          </div>
                        </td>
                        <td className="py-4 text-center text-[#244455]">{produto.quantidade}</td>
                        <td className="py-4 text-right text-[#244455]">
                          {formatCurrency(produto.valorUnitario)}
                        </td>
                        <td className="py-4 text-right text-[#244455]">
                          {formatPercent(produto.desconto || 0)}
                        </td>
                        <td className="py-4 text-right font-semibold text-[#19384C]">
                          {formatCurrency(produto.subtotal || produto.valorTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#D9E5EA]">
                      <td colSpan={4} className="py-3 text-right text-sm font-medium text-[#607B89]">
                        Subtotal:
                      </td>
                      <td className="py-3 text-right text-sm font-semibold text-[#19384C]">
                        {formatCurrency(subtotalProposta)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-2 text-right text-sm font-medium text-[#607B89]">
                        Desconto global:
                      </td>
                      <td className="py-2 text-right text-sm font-semibold text-[#B45309]">
                        - {formatCurrency(valorDescontoGlobal)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-2 text-right text-sm font-medium text-[#607B89]">
                        Desconto por item (ja aplicado no subtotal):
                      </td>
                      <td className="py-2 text-right text-sm font-semibold text-[#B45309]">
                        {formatCurrency(valorDescontoItens)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="py-2 text-right text-sm font-medium text-[#607B89]">
                        Impostos:
                      </td>
                      <td className="py-2 text-right text-sm font-semibold text-[#19384C]">
                        {formatCurrency(valorImpostos)}
                      </td>
                    </tr>
                    <tr className="border-t-2 border-[#D9E5EA]">
                      <td colSpan={4} className="py-4 text-right text-lg font-semibold text-[#19384C]">
                        Total geral:
                      </td>
                      <td className="py-4 text-right text-lg font-bold" style={{ color: primaryColor }}>
                        {formatCurrency(totalProposta)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#DEE8EC] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-[#19384C]">
                <Shield className="h-5 w-5" style={{ color: primaryColor }} />
                Condicoes comerciais
              </h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#607B89]">
                    Pagamento e entrega
                  </h3>
                  <div className="space-y-2 text-sm text-[#244455]">
                    <div>
                      <span className="font-semibold text-[#19384C]">Forma de pagamento:</span>{' '}
                      {proposta.condicoes.formaPagamento}
                    </div>
                    <div>
                      <span className="font-semibold text-[#19384C]">Prazo de entrega:</span>{' '}
                      {proposta.condicoes.prazoEntrega}
                    </div>
                    <div>
                      <span className="font-semibold text-[#19384C]">Garantia:</span>{' '}
                      {proposta.condicoes.garantia}
                    </div>
                  </div>
                </div>

                {proposta.condicoes.observacoes && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[#607B89]">
                      Observacoes
                    </h3>
                    <p className="text-sm leading-6 text-[#355166]">
                      {proposta.condicoes.observacoes}
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-[18px] border border-[#DEE8EC] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
              <h3 className="mb-4 text-lg font-semibold tracking-[-0.01em] text-[#19384C]">
                Acoes
              </h3>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadPDF}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </button>

                {podeAceitar && (
                  <>
                    <button
                      onClick={handleAceitarProposta}
                      disabled={processandoAceite}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#159A52] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#128045] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processandoAceite ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {processandoAceite ? 'Processando...' : 'Aceitar proposta'}
                    </button>

                    <button
                      onClick={handleSolicitarAjustes}
                      disabled={processandoNegociacao}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#B45309] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processandoNegociacao ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      {processandoNegociacao ? 'Processando...' : 'Solicitar ajustes'}
                    </button>

                    <button
                      onClick={handleRejeitarProposta}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B91C1C]"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar proposta
                    </button>
                  </>
                )}

                {negociacaoAtiva && (
                  <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm text-[#92400E]">
                    Sua solicitacao de ajustes foi registrada. Nosso time comercial vai retornar com uma nova proposta.
                  </div>
                )}

                {proposta.status === 'expirada' && (
                  <div className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3">
                    <p className="text-sm text-[#92400E]">
                      Esta proposta expirou. Entre em contato para uma nova emissao.
                    </p>
                  </div>
                )}

                {!podeAceitar &&
                  proposta.status !== 'expirada' &&
                  proposta.status !== 'aprovada' &&
                  proposta.status !== 'rejeitada' && (
                    <div className="rounded-lg border border-[#D4E2E7] bg-[#F8FBFC] p-3 text-sm text-[#5A768C]">
                      O aceite fica disponivel quando a proposta estiver em etapa comercial ativa e
                      dentro da validade.
                    </div>
                  )}
              </div>
            </section>

            <section className="rounded-[18px] border border-[#DEE8EC] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
              <h3 className="mb-4 text-lg font-semibold tracking-[-0.01em] text-[#19384C]">
                Detalhes financeiros
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-[#F8FBFC] px-3 py-2 ring-1 ring-[#E7EFF3]">
                  <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Subtotal</p>
                  <p className="mt-1 text-sm font-semibold text-[#19384C]">
                    {formatCurrency(subtotalProposta)}
                  </p>
                </div>
                <div className="rounded-md bg-[#F8FBFC] px-3 py-2 ring-1 ring-[#E7EFF3]">
                  <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Descontos</p>
                  <p className="mt-1 text-sm font-semibold text-[#19384C]">
                    {formatPercent(descontoGlobalPercentual)}
                  </p>
                  <p className="mt-1 text-xs text-[#607B89]">Itens: {formatCurrency(valorDescontoItens)}</p>
                  <p className="text-xs text-[#607B89]">Global: {formatCurrency(valorDescontoGlobal)}</p>
                </div>
                <div className="rounded-md bg-[#F8FBFC] px-3 py-2 ring-1 ring-[#E7EFF3]">
                  <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Impostos</p>
                  <p className="mt-1 text-sm font-semibold text-[#19384C]">
                    {formatPercent(impostosPercentual)}
                  </p>
                  <p className="mt-1 text-xs text-[#607B89]">Valor: {formatCurrency(valorImpostos)}</p>
                </div>
                <div
                  className="rounded-md px-3 py-2 ring-1"
                  style={{ backgroundColor: primaryTintSoft, borderColor: primaryTintStrong }}
                >
                  <p className="text-[11px] uppercase tracking-wide text-[#607B89]">Total</p>
                  <p className="mt-1 text-lg font-bold" style={{ color: primaryColor }}>
                    {formatCurrency(totalProposta)}
                  </p>
                </div>
              </div>

              {exibirDivergenciaSubtotal && (
                <div className="mt-4 rounded-md border border-[#F7C78A] bg-[#FFF7EB] p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-[#B45309]" />
                    <div>
                      <p className="text-xs font-semibold text-[#92400E]">Conferencia financeira</p>
                      <p className="mt-1 text-xs text-[#92400E]">
                        Soma dos itens: {formatCurrency(subtotalItens)} | Subtotal da proposta:{' '}
                        {formatCurrency(subtotalProposta)} | Diferenca: {formatCurrency(divergenciaSubtotal)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {tokenParaAceite && (
              <section
                className="rounded-[18px] border p-5 shadow-[0_16px_30px_-24px_rgba(30,64,175,0.2)]"
                style={{ borderColor: primaryTintStrong, backgroundColor: primaryTintSoft }}
              >
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold" style={{ color: primaryColor }}>
                  <Shield className="h-5 w-5" />
                  Token de acesso
                </h3>
                <div className="text-center">
                  <div
                    className="mb-3 rounded-lg border bg-white p-4"
                    style={{ borderColor: primaryTintStrong }}
                  >
                    <div className="break-all font-mono text-2xl font-bold tracking-[0.14em]" style={{ color: primaryColor }}>
                      {formatarTokenParaExibicao(tokenParaAceite)}
                    </div>
                  </div>
                  <p className="text-xs font-medium" style={{ color: primaryColor }}>
                    Codigo unico desta proposta para rastreio de acesso
                  </p>
                </div>
              </section>
            )}

            <section className="rounded-[18px] border border-[#DEE8EC] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-[-0.01em] text-[#19384C]">
                <Building className="h-5 w-5" style={{ color: primaryColor }} />
                Contato
              </h3>

              <div className="space-y-2.5 text-sm text-[#355166]">
                <div>
                  <strong className="text-[#19384C]">{proposta.empresa.nome}</strong>
                </div>
                <div>{proposta.empresa.endereco}</div>
                <div>{proposta.empresa.telefone}</div>
                <div>{proposta.empresa.email}</div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {showSolicitarAjustes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1A2B]/55 p-4">
          <div className="w-full max-w-lg rounded-[18px] border border-[#F7C78A] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#19384C]">Solicitar ajustes</h3>
            <p className="mt-2 text-sm text-[#607B89]">
              Descreva o que voce gostaria de ajustar nesta proposta para nosso time comercial revisar.
            </p>

            <div className="mt-4">
              <label htmlFor="motivo-ajustes" className="mb-2 block text-sm font-medium text-[#355166]">
                Motivo dos ajustes
              </label>
              <textarea
                id="motivo-ajustes"
                value={motivoAjustes}
                onChange={(event) => setMotivoAjustes(event.target.value)}
                rows={5}
                maxLength={600}
                className="w-full rounded-lg border border-[#D4E2E7] px-3 py-2 text-sm text-[#19384C] outline-none transition focus:border-[#B45309] focus:ring-2 focus:ring-[#FDE68A]"
                placeholder="Ex.: preciso de ajuste de prazo, condicao de pagamento ou composicao dos itens..."
              />
              <p className="mt-1 text-right text-xs text-[#607B89]">{motivoAjustes.length}/600</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (!processandoNegociacao) {
                    setShowSolicitarAjustes(false);
                    setMotivoAjustes('');
                  }
                }}
                disabled={processandoNegociacao}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D4E2E7] px-4 text-sm font-medium text-[#355166] transition hover:bg-[#F4F8FA] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarSolicitacaoAjustes}
                disabled={processandoNegociacao}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#B45309] px-4 text-sm font-semibold text-white transition hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processandoNegociacao ? 'Enviando...' : 'Enviar solicitacao'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1A2B]/55 p-4">
          <div className="w-full max-w-md rounded-[18px] border border-[#FECACA] bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#19384C]">Confirmar rejeicao</h3>
            <p className="mt-2 text-sm text-[#607B89]">
              Tem certeza que deseja rejeitar esta proposta? Essa acao nao pode ser desfeita.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmReject(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D4E2E7] px-4 text-sm font-medium text-[#355166] transition hover:bg-[#F4F8FA]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRejeicao}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#DC2626] px-4 text-sm font-semibold text-white transition hover:bg-[#B91C1C]"
              >
                Rejeitar proposta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalClienteProposta;
