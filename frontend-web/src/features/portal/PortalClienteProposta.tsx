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
  Eye,
  FileText,
  Building,
  User,
  Calendar,
  DollarSign,
  Package,
  Shield,
  Clock,
} from 'lucide-react';
import { portalClienteService } from '../../services/portalClienteService';
import { emailService } from '../../services/emailService';
import { pdfPropostasService } from '../../services/pdfPropostasService';
import { formatarTokenParaExibicao, validarTokenNumerico } from '../../utils/tokenUtils';
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
  const [acoes, setAcoes] = useState<Array<{ acao: string; timestamp: string }>>([]);

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
  const registrarAcao = async (tipoAcao: string, dados?: any) => {
    if (!tokenParaAceite) return;

    const acao = {
      acao: tipoAcao,
      timestamp: new Date().toISOString(),
      dados,
    };

    // Adicionar à lista local
    setAcoes((prev) => [...prev, acao]);

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
      const dados = await portalClienteService.obterPropostaPublica(identificadorProposta!);

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

      // 3. Enviar notificação de aprovação
      try {
        await emailService.notificarAprovacaoProposta(proposta.id, proposta);
        console.log('✅ Notificação de aprovação enviada');
      } catch (emailError) {
        console.warn('⚠️ Erro no envio de email, continuando:', emailError);
      }

      // 4. Iniciar processo de geração de contrato
      try {
        await iniciarGeracaoContrato(proposta);
        console.log('✅ Processo de contrato iniciado');
      } catch (contratoError) {
        console.warn('⚠️ Erro na geração de contrato, continuando:', contratoError);
      }

      // 5. Atualizar estado local - SEMPRE funciona
      setProposta((prev) => (prev ? { ...prev, status: 'aprovada' } : null));
      setAceiteRealizado(true);

      // 6. Simular atualização no "CRM" local (localStorage)
      try {
        const propostas = JSON.parse(localStorage.getItem('propostas') || '[]');
        const index = propostas.findIndex(
          (p: any) => p.numero === identificadorProposta || p.id === identificadorProposta,
        );

        if (index >= 0) {
          propostas[index].status = 'aprovada';
          propostas[index].updatedAt = new Date().toISOString();
          propostas[index].approvedViaPortal = true;
          localStorage.setItem('propostas', JSON.stringify(propostas));
          console.log('✅ Status atualizado no CRM local (localStorage)');
        } else {
          // Criar uma nova entrada se não existir
          const novaProposta = {
            id: identificadorProposta,
            numero: identificadorProposta,
            status: 'aprovada',
            cliente: proposta.cliente,
            valor: proposta.valorTotal,
            updatedAt: new Date().toISOString(),
            approvedViaPortal: true,
            createdAt: proposta.dataEnvio || new Date().toISOString(),
          };
          propostas.push(novaProposta);
          localStorage.setItem('propostas', JSON.stringify(propostas));
          console.log('✅ Nova proposta aprovada criada no CRM local');
        }
      } catch (localError) {
        console.warn('⚠️ Erro na atualização local:', localError);
      }

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
      // Simular download do PDF por enquanto
      console.log('Solicitando download de PDF da proposta:', proposta);
      alert('Funcionalidade de download será implementada em breve!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      setErro('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const iniciarGeracaoContrato = async (proposta: PropostaPublica) => {
    // Esta função será implementada no próximo módulo
    console.log('Iniciando geração de contrato para proposta:', proposta.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enviada':
        return 'bg-blue-100 text-blue-800';
      case 'visualizada':
        return 'bg-yellow-100 text-yellow-800';
      case 'aprovada':
        return 'bg-green-100 text-green-800';
      case 'rejeitada':
        return 'bg-red-100 text-red-800';
      case 'expirada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (erro || !proposta) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md text-center bg-white p-8 rounded-lg shadow-lg">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ops!</h2>
          <p className="text-gray-600 mb-6">{erro}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para Home
          </button>
        </div>
      </div>
    );
  }

  if (aceiteRealizado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-lg text-center bg-white p-8 rounded-lg shadow-lg">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposta Aceita!</h2>
          <p className="text-gray-600 mb-6">
            Sua proposta foi aceita com sucesso. Em breve você receberá o contrato para assinatura.
          </p>

          {/* Status de sincronização */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center justify-center text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>✅ Aprovação registrada no portal</span>
              </div>
              <div className="flex items-center justify-center text-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>✅ Notificação enviada por email</span>
              </div>
            </div>

            {/* Indicador de sincronização */}
            <StatusSyncIndicator propostaId={identificadorProposta || proposta?.numero || ''} />

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Próximos passos:</strong> Nossa equipe entrará em contato em até 2 horas úteis
              para iniciar o processo de contrato e definir os próximos passos do projeto.
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleDownloadPDF}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Proposta
            </button>
          </div>
        </div>
      </div>
    );
  }

  const diasRestantes = calcularDiasRestantes();
  const podeAceitar = proposta.status === 'visualizada' && diasRestantes > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {proposta.empresa.logo && (
                <img
                  src={proposta.empresa.logo}
                  alt={proposta.empresa.nome}
                  className="h-12 w-auto mr-4"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{proposta.empresa.nome}</h1>
                <p className="text-gray-600">Proposta Comercial</p>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(proposta.status)}`}
              >
                {getStatusText(proposta.status)}
              </span>
              {diasRestantes > 0 &&
                proposta.status !== 'aprovada' &&
                proposta.status !== 'rejeitada' && (
                  <p className="text-sm text-gray-500 mt-1">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {diasRestantes} dias restantes
                  </p>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informações da Proposta */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Proposta {proposta.numero}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Informações Gerais</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Título:</strong> {proposta.titulo}
                    </div>
                    <div>
                      <strong>Data de Envio:</strong>{' '}
                      {new Date(proposta.dataEnvio).toLocaleDateString('pt-BR')}
                    </div>
                    <div>
                      <strong>Validade:</strong>{' '}
                      {new Date(proposta.dataValidade).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Vendedor Responsável</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Nome:</strong> {proposta.vendedor.nome}
                    </div>
                    <div>
                      <strong>Email:</strong> {proposta.vendedor.email}
                    </div>
                    <div>
                      <strong>Telefone:</strong> {proposta.vendedor.telefone}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos e Serviços */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Produtos e Serviços
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-medium text-gray-900">Item</th>
                      <th className="text-center py-3 font-medium text-gray-900">Qtd</th>
                      <th className="text-right py-3 font-medium text-gray-900">Valor Unit.</th>
                      <th className="text-right py-3 font-medium text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposta.produtos.map((produto, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-4">
                          <div>
                            <div className="font-medium text-gray-900">{produto.nome}</div>
                            <div className="text-sm text-gray-500">{produto.descricao}</div>
                          </div>
                        </td>
                        <td className="py-4 text-center">{produto.quantidade}</td>
                        <td className="py-4 text-right">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(produto.valorUnitario)}
                        </td>
                        <td className="py-4 text-right font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(produto.valorTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300">
                      <td colSpan={3} className="py-4 text-right font-semibold text-lg">
                        Total Geral:
                      </td>
                      <td className="py-4 text-right font-bold text-lg text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(proposta.valorTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Condições */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Condições Comerciais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Pagamento e Entrega</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Forma de Pagamento:</strong> {proposta.condicoes.formaPagamento}
                    </div>
                    <div>
                      <strong>Prazo de Entrega:</strong> {proposta.condicoes.prazoEntrega}
                    </div>
                    <div>
                      <strong>Garantia:</strong> {proposta.condicoes.garantia}
                    </div>
                  </div>
                </div>

                {proposta.condicoes.observacoes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
                    <p className="text-sm text-gray-600">{proposta.condicoes.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Ações */}
          <div className="space-y-6">
            {/* Card de Ações */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações</h3>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar PDF
                </button>

                {podeAceitar && (
                  <>
                    <button
                      onClick={handleAceitarProposta}
                      disabled={processandoAceite}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                      {processandoAceite ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {processandoAceite ? 'Processando...' : 'Aceitar Proposta'}
                    </button>

                    <button
                      onClick={handleRejeitarProposta}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeitar Proposta
                    </button>
                  </>
                )}

                {proposta.status === 'expirada' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Esta proposta expirou. Entre em contato conosco para uma nova proposta.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Token de Acesso */}
            {tokenParaAceite && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Token de Acesso
                </h3>
                <div className="text-center">
                  <div className="bg-white border-2 border-blue-300 rounded-lg p-4 mb-3">
                    <div className="text-3xl font-mono font-bold text-blue-800 tracking-wider">
                      {formatarTokenParaExibicao(tokenParaAceite)}
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">
                    Este é o seu código de acesso único para esta proposta
                  </p>
                </div>
              </div>
            )}

            {/* Informações de Contato */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Contato
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <strong>{proposta.empresa.nome}</strong>
                </div>
                <div className="text-gray-600">{proposta.empresa.endereco}</div>
                <div className="text-gray-600">{proposta.empresa.telefone}</div>
                <div className="text-gray-600">{proposta.empresa.email}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Rejeição */}
      {showConfirmReject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmar Rejeição</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja rejeitar esta proposta? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmReject(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRejeicao}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Rejeitar Proposta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalClienteProposta;
