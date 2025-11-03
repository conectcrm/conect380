import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Settings,
  Printer,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { pdfPropostasService, DadosProposta, TemplateInfo } from '../../services/pdfPropostasService';

const TemplatesPropostasPage: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('comercial');
  const [dadosProposta, setDadosProposta] = useState<DadosProposta>(
    pdfPropostasService.criarDadosExemplo()
  );
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    carregarTemplates();
  }, []);

  const carregarTemplates = async () => {
    try {
      const response = await pdfPropostasService.getTemplatesDisponiveis();
      setTemplates(response.templates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleGerarPdf = async () => {
    setLoading(true);
    try {
      await pdfPropostasService.downloadPdf(selectedTemplate, dadosProposta);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const html = await pdfPropostasService.previewHtml(selectedTemplate, dadosProposta);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      alert('Erro ao gerar preview. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    const keys = field.split('.');
    if (keys.length === 1) {
      setDadosProposta(prev => ({ ...prev, [field]: value }));
      return;
    }

    const [parentKey, childKey] = keys as [keyof DadosProposta, string];

    setDadosProposta(prev => {
      const parentValue = prev[parentKey];
      const parentObject =
        parentValue && typeof parentValue === 'object' && !Array.isArray(parentValue)
          ? (parentValue as Record<string, unknown>)
          : {};

      return {
        ...prev,
        [parentKey]: {
          ...parentObject,
          [childKey]: value
        }
      };
    });
  };

  const adicionarItem = () => {
    const novoItem = {
      nome: 'Novo Item',
      descricao: '',
      quantidade: 1,
      valorUnitario: 0,
      desconto: 0,
      valorTotal: 0
    };
    setDadosProposta(prev => ({
      ...prev,
      itens: [...prev.itens, novoItem]
    }));
  };

  const removerItem = (index: number) => {
    setDadosProposta(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const calcularTotais = () => {
    const subtotal = dadosProposta.itens.reduce((sum, item) => sum + item.valorTotal, 0);
    setDadosProposta(prev => ({
      ...prev,
      subtotal,
      valorTotal: subtotal - (prev.descontoGeral || 0) + (prev.impostos || 0)
    }));
  };

  useEffect(() => {
    calcularTotais();
  }, [dadosProposta.itens]);

  const gerarNovoDados = () => {
    setDadosProposta(pdfPropostasService.criarDadosExemplo());
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Templates de Propostas
        </h1>
        <p className="text-gray-600">
          Gerencie e teste templates de propostas comerciais
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Configurações */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-[#159A9C]" />
              Configurações
            </h2>

            {/* Seleção de Template */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.nome}
                  </option>
                ))}
              </select>
              {templates.find(t => t.id === selectedTemplate) && (
                <p className="mt-1 text-sm text-gray-500">
                  {templates.find(t => t.id === selectedTemplate)?.descricao}
                </p>
              )}
            </div>

            {/* Ações */}
            <div className="space-y-3">
              <button
                onClick={handlePreview}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4 mr-2" />
                )}
                Visualizar
              </button>

              <button
                onClick={handleGerarPdf}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#127577] disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Baixar PDF
              </button>

              <button
                onClick={gerarNovoDados}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Dados de Exemplo
              </button>
            </div>

            {/* Status */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Status da Proposta</h3>
              <select
                value={dadosProposta.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#159A9C]"
              >
                <option value="draft">Rascunho</option>
                <option value="sent">Enviada</option>
                <option value="approved">Aprovada</option>
                <option value="rejected">Rejeitada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Área Principal - Formulário */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-[#159A9C]" />
              Dados da Proposta
            </h2>

            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número da Proposta
                  </label>
                  <input
                    type="text"
                    value={dadosProposta.numeroProposta || ''}
                    onChange={(e) => handleInputChange('numeroProposta', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                    placeholder="Ex: 2025001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={dadosProposta.titulo}
                    onChange={(e) => handleInputChange('titulo', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                    placeholder="Título da proposta"
                  />
                </div>
              </div>

              {/* Cliente */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Dados do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={dadosProposta.cliente.nome}
                    onChange={(e) => handleInputChange('cliente.nome', e.target.value)}
                    placeholder="Nome do cliente"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <input
                    type="email"
                    value={dadosProposta.cliente.email}
                    onChange={(e) => handleInputChange('cliente.email', e.target.value)}
                    placeholder="Email do cliente"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <input
                    type="text"
                    value={dadosProposta.cliente.empresa || ''}
                    onChange={(e) => handleInputChange('cliente.empresa', e.target.value)}
                    placeholder="Empresa"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <input
                    type="text"
                    value={dadosProposta.cliente.telefone || ''}
                    onChange={(e) => handleInputChange('cliente.telefone', e.target.value)}
                    placeholder="Telefone"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                  />
                </div>
              </div>

              {/* Vendedor */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Dados do Vendedor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={dadosProposta.vendedor.nome}
                    onChange={(e) => handleInputChange('vendedor.nome', e.target.value)}
                    placeholder="Nome do vendedor"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                  />
                  <input
                    type="email"
                    value={dadosProposta.vendedor.email}
                    onChange={(e) => handleInputChange('vendedor.email', e.target.value)}
                    placeholder="Email do vendedor"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                  />
                </div>
              </div>

              {/* Condições */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <input
                    type="text"
                    value={dadosProposta.formaPagamento}
                    onChange={(e) => handleInputChange('formaPagamento', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prazo de Entrega
                  </label>
                  <input
                    type="text"
                    value={dadosProposta.prazoEntrega}
                    onChange={(e) => handleInputChange('prazoEntrega', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C]"
                  />
                </div>
              </div>

              {/* Valor Total */}
              <div className="bg-[#159A9C]/10 p-4 rounded-lg">
                <div className="text-center">
                  <span className="text-sm text-gray-600">Valor Total da Proposta</span>
                  <div className="text-3xl font-bold text-[#159A9C]">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(dadosProposta.valorTotal)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Preview */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-11/12 h-5/6 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Preview da Proposta</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  if (previewUrl) {
                    URL.revokeObjectURL(previewUrl);
                    setPreviewUrl('');
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-4">
              {previewUrl && (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border rounded"
                  title="Preview da Proposta"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPropostasPage;
