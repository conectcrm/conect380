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
  Building,
  Package,
  Shield,
  Clock,
} from 'lucide-react';
import { portalClienteService } from '../../services/portalClienteService';
import { pdfPropostasService } from '../../services/pdfPropostasService';
import { formatarTokenParaExibicao } from '../../utils/tokenUtils';
import { StatusSyncIndicator } from './components/StatusSyncIndicator';
import { API_BASE_URL } from '../../services/api';

const PORTAL_API_BASE = `${API_BASE_URL}/api/portal`;

interface PropostaPublica {
  id: string;
  numero: string;
  titulo: string;
  status: 'enviada' | 'visualizada' | 'aprovada' | 'rejeitada' | 'expirada';
  dataEnvio: Date;
  dataValidade: Date;
  valorTotal: number;
  empresa: {
    nome: string;
    logo?: string;
    endereco: string;
    telefone: string;
    email: string;
  };
  cliente: {
    nome: string;
    email: string;
  };
  vendedor: {
    nome: string;
    email: string;
    telefone: string;
  };
  produtos: Array<{
    nome: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
  }>;
  condicoes: {
    formaPagamento: string;
    prazoEntrega: string;
    garantia: string;
    observacoes?: string;
  };
}

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
    if (!proposta) return;

    try {
      const dadosPdf = {
        numeroProposta: proposta.numero,
        titulo: proposta.titulo || `Proposta ${proposta.numero}`,
        descricao: proposta.condicoes.observacoes || '',
        dataEmissao: new Date(proposta.dataEnvio).toISOString().split('T')[0],
        dataValidade: new Date(proposta.dataValidade).toISOString().split('T')[0],
        empresa: {
          nome: proposta.empresa.nome,
          endereco: proposta.empresa.endereco,
          telefone: proposta.empresa.telefone,
          email: proposta.empresa.email,
          logo: proposta.empresa.logo,
        },
        cliente: {
          nome: proposta.cliente.nome,
          email: proposta.cliente.email || '',
        },
        vendedor: {
          nome: proposta.vendedor.nome,
          email: proposta.vendedor.email || '',
          telefone: proposta.vendedor.telefone || '',
        },
        itens: proposta.produtos.map((produto) => ({
          nome: produto.nome,
          descricao: produto.descricao,
          quantidade: Number(produto.quantidade || 0),
          valorUnitario: Number(produto.valorUnitario || 0),
          valorTotal: Number(produto.valorTotal || 0),
        })),
        subtotal: Number(proposta.valorTotal || 0),
        valorTotal: Number(proposta.valorTotal || 0),
        formaPagamento: proposta.condicoes.formaPagamento || 'A combinar',
        prazoEntrega: proposta.condicoes.prazoEntrega || 'A combinar',
        garantia: proposta.condicoes.garantia || '',
        validadeProposta: `${calcularDiasRestantes()} dias`,
        condicoesGerais: proposta.condicoes.observacoes ? [proposta.condicoes.observacoes] : [],
        observacoes: proposta.condicoes.observacoes || '',
      };

      await pdfPropostasService.downloadPdf('comercial', dadosPdf);
      await registrarAcao('download_pdf', { propostaNumero: proposta.numero });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      setErro('Erro ao gerar PDF. Tente novamente.');
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
      case 'enviada':
        return 'border border-[#BFDBFE] bg-[#DBEAFE] text-[#1D4ED8]';
      case 'visualizada':
        return 'border border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]';
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
      case 'enviada':
        return 'Enviada';
      case 'visualizada':
        return 'Visualizada';
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#159A9C] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#117C7E]"
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
  const podeAceitar = proposta.status === 'visualizada' && diasRestantes > 0;

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
                <FileText className="h-5 w-5 text-[#159A9C]" />
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
                <Package className="h-5 w-5 text-[#159A9C]" />
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
                        Total
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
                        <td className="py-4 text-right font-semibold text-[#19384C]">
                          {formatCurrency(produto.valorTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[#D9E5EA]">
                      <td
                        colSpan={3}
                        className="py-4 text-right text-lg font-semibold text-[#19384C]"
                      >
                        Total geral:
                      </td>
                      <td className="py-4 text-right text-lg font-bold text-[#159A9C]">
                        {formatCurrency(proposta.valorTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#DEE8EC] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)] sm:p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-[#19384C]">
                <Shield className="h-5 w-5 text-[#159A9C]" />
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#4B5A6C] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#3D4A5A]"
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
                      onClick={handleRejeitarProposta}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B91C1C]"
                    >
                      <XCircle className="h-4 w-4" />
                      Rejeitar proposta
                    </button>
                  </>
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
                      A proposta sera liberada para aceite apos sincronizacao completa do status.
                    </div>
                  )}
              </div>
            </section>

            {tokenParaAceite && (
              <section className="rounded-[18px] border border-[#C7DDF8] bg-[#EFF6FF] p-5 shadow-[0_16px_30px_-24px_rgba(30,64,175,0.2)]">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[#1E3A8A]">
                  <Shield className="h-5 w-5" />
                  Token de acesso
                </h3>
                <div className="text-center">
                  <div className="mb-3 rounded-lg border border-[#93C5FD] bg-white p-4">
                    <div className="break-all font-mono text-2xl font-bold tracking-[0.14em] text-[#1D4ED8]">
                      {formatarTokenParaExibicao(tokenParaAceite)}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-[#1E40AF]">
                    Codigo unico desta proposta para rastreio de acesso
                  </p>
                </div>
              </section>
            )}

            <section className="rounded-[18px] border border-[#DEE8EC] bg-white p-5 shadow-[0_16px_30px_-24px_rgba(16,57,74,0.28)]">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-[-0.01em] text-[#19384C]">
                <Building className="h-5 w-5 text-[#159A9C]" />
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
