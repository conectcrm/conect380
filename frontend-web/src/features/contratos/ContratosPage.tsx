import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, FileText, Calendar, User, DollarSign, Eye, ArrowLeft } from 'lucide-react';
import { contratoService } from '../../services/contratoService';
export interface Contrato {
  id: string;
  numero: string;
  propostaId: string;
  cliente: {
    id?: string;
    nome: string;
    email: string;
    telefone?: string;
    documento?: string;
    endereco?: string;
  };
  valor: number;
  status: 'rascunho' | 'aguardando_assinatura' | 'assinado' | 'cancelado' | 'expirado';
  descricao: string;
  dataEmissao: Date;
  dataVencimento: Date;
  dataAssinatura?: Date;
  vendedor?: {
    id: string;
    nome: string;
    email: string;
  };
  assinaturaDigital?: {
    clienteAssinado: boolean;
    empresaAssinada: boolean;
    token: string;
    dataAssinatura?: Date;
  };
  observacoes?: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
  caminhoArquivoPDF?: string;
}

interface ContratosPageProps {
  contratoId?: string;
}

const ContratosPage: React.FC<ContratosPageProps> = ({ contratoId: propContratoId }) => {
  const { id: paramContratoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const contratoId = propContratoId || paramContratoId;

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baixandoPDF, setBaixandoPDF] = useState(false);

  useEffect(() => {
    if (contratoId) {
      carregarContrato(contratoId);
    } else {
      setError('ID do contrato não fornecido');
      setLoading(false);
    }
  }, [contratoId]);

  const carregarContrato = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const contratoData = await contratoService.buscarContrato(id);
      setContrato(contratoData);
    } catch (err) {
      console.error('❌ Erro ao carregar contrato:', err);
      setError('Erro ao carregar o contrato. Verifique se o ID está correto.');
    } finally {
      setLoading(false);
    }
  };

  const handleBaixarPDF = async () => {
    if (!contrato) return;

    try {
      setBaixandoPDF(true);
      const pdfBlob = await contratoService.baixarPDF(contrato.id);

      // Criar link para download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato-${contrato.numero || contrato.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Erro ao baixar PDF:', error);
      alert('Erro ao baixar o PDF do contrato');
    } finally {
      setBaixandoPDF(false);
    }
  };

  const formatarData = (data: string | Date) => {
    try {
      const dataObj = typeof data === 'string' ? new Date(data) : data;
      return dataObj.toLocaleDateString('pt-BR');
    } catch {
      return typeof data === 'string' ? data : data.toString();
    }
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      rascunho: 'bg-gray-100 text-gray-800',
      aguardando_assinatura: 'bg-yellow-100 text-yellow-800',
      assinado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
      vencido: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const statusTexts: Record<string, string> = {
      rascunho: 'Rascunho',
      aguardando_assinatura: 'Aguardando Assinatura',
      assinado: 'Assinado',
      cancelado: 'Cancelado',
      vencido: 'Vencido',
    };
    return statusTexts[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>

          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Contrato não encontrado</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir para Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Contrato não encontrado</h1>
            <p className="text-gray-600">O contrato solicitado não foi encontrado.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header com botão voltar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </button>

          <button
            onClick={handleBaixarPDF}
            disabled={baixandoPDF}
            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {baixandoPDF ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Baixando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </>
            )}
          </button>
        </div>

        {/* Card principal do contrato */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Header do contrato */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  <FileText className="h-6 w-6 mr-3" />
                  Contrato {contrato.numero}
                </h1>
                <p className="text-blue-100 mt-1">ID: {contrato.id}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contrato.status)} border`}
                >
                  {getStatusText(contrato.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Conteúdo do contrato */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Informações do Cliente */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Informações do Cliente
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Nome:</span>
                    <p className="text-gray-900">{contrato.cliente?.nome || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <p className="text-gray-900">{contrato.cliente?.email || 'Não informado'}</p>
                  </div>
                  {contrato.cliente?.telefone && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">Telefone:</span>
                      <p className="text-gray-900">{contrato.cliente.telefone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Informações Financeiras
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Valor:</span>
                    <p className="text-xl font-bold text-green-600">
                      {formatarValor(contrato.valor)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Data de Vencimento:</span>
                    <p className="text-gray-900">{formatarData(contrato.dataVencimento)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{contrato.descricao}</p>
              </div>
            </div>

            {/* Observações */}
            {contrato.observacoes && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Observações</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{contrato.observacoes}</p>
                </div>
              </div>
            )}

            {/* Metadados */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                Informações Adicionais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-sm font-medium text-gray-500">Data de Criação:</span>
                  <p className="text-gray-900">
                    {contrato.criadoEm
                      ? formatarData(contrato.criadoEm)
                      : formatarData(contrato.dataEmissao)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Última Atualização:</span>
                  <p className="text-gray-900">
                    {contrato.atualizadoEm ? formatarData(contrato.atualizadoEm) : 'Não informado'}
                  </p>
                </div>
                {contrato.propostaId && (
                  <div>
                    <span className="font-medium text-gray-500">Proposta de Origem:</span>
                    <p className="text-gray-900">#{contrato.propostaId}</p>
                  </div>
                )}
                {contrato.caminhoArquivoPDF && (
                  <div>
                    <span className="font-medium text-gray-500">Arquivo PDF:</span>
                    <p className="text-gray-900">Disponível</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContratosPage;
