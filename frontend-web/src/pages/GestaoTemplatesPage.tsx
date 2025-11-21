/**
 * GESTÃO DE TEMPLATES DE MENSAGENS - CONECT CRM
 * Módulo: Atendimento
 * Cor: #9333EA (purple)
 */

import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  FileText,
  Eye,
  Copy,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import messageTemplateService, {
  MessageTemplate,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
} from '../services/messageTemplateService';

const GestaoTemplatesPage: React.FC = () => {
  // Estados principais
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');

  // Estados de UI
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);

  // Estados de variáveis
  const [variaveisDisponiveis, setVariaveisDisponiveis] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<CreateMessageTemplateDto>({
    nome: '',
    conteudo: '',
    categoria: '',
    atalho: '',
    variaveis: [],
  });

  // 🔐 empresaId removido - vem automaticamente do JWT no backend

  useEffect(() => {
    carregarDados();
    carregarVariaveis();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔐 empresaId vem do JWT no backend
      const dados = await messageTemplateService.listar(false);
      setTemplates(Array.isArray(dados) ? dados : []);
    } catch (err: unknown) {
      console.error('Erro ao carregar templates:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao carregar templates';
      setError(errorMsg);
      setTemplates([]);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const carregarVariaveis = async () => {
    try {
      const vars = await messageTemplateService.listarVariaveis();
      setVariaveisDisponiveis(vars);
    } catch (err) {
      console.error('Erro ao carregar variáveis:', err);
    }
  };

  const handleOpenDialog = (template?: MessageTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        nome: template.nome,
        conteudo: template.conteudo,
        categoria: template.categoria || '',
        atalho: template.atalho || '',
        variaveis: template.variaveis || [],
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        nome: '',
        conteudo: '',
        categoria: '',
        atalho: '',
        variaveis: [],
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    try {
      setError(null);

      console.log('📝 Dados do formulário:', formData);

      // Remover campo variaveis vazio - backend extrai automaticamente
      const dataToSend = {
        nome: formData.nome,
        conteudo: formData.conteudo,
        categoria: formData.categoria || undefined,
        atalho: formData.atalho || undefined,
      };

      console.log('📤 Payload preparado para envio:', dataToSend);

      if (editingTemplate) {
        // 🔐 empresaId vem do JWT no backend
        await messageTemplateService.atualizar(editingTemplate.id, dataToSend as UpdateMessageTemplateDto);
        toast.success('Template atualizado com sucesso!');
      } else {
        // 🔐 empresaId vem do JWT no backend
        const novoTemplate = await messageTemplateService.criar(dataToSend as CreateMessageTemplateDto);
        console.log('✅ Template criado:', novoTemplate);
        toast.success('Template criado com sucesso!');
      }

      setShowDialog(false);
      setEditingTemplate(null);

      // Aguardar um momento antes de recarregar para garantir que o banco processou
      await new Promise(resolve => setTimeout(resolve, 300));
      await carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao salvar template:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao salvar template';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja realmente deletar este template?')) return;

    try {
      setError(null);
      // 🔐 empresaId vem do JWT no backend
      await messageTemplateService.deletar(id);
      toast.success('Template deletado com sucesso!');
      carregarDados();
    } catch (err: unknown) {
      console.error('Erro ao deletar template:', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      const errorMsg = normalizedMessage || fallbackMessage || 'Erro ao deletar template';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handlePreview = (template: MessageTemplate) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };

  const handleCopyContent = (conteudo: string) => {
    navigator.clipboard.writeText(conteudo);
    toast.success('Conteúdo copiado para a área de transferência!');
  };

  const insertVariable = (variavel: string) => {
    setFormData({
      ...formData,
      conteudo: formData.conteudo + ` ${variavel}`,
    });
  };

  // Filtros
  const templatesFiltrados = templates.filter((template) => {
    const matchBusca = template.nome.toLowerCase().includes(busca.toLowerCase()) ||
      template.conteudo.toLowerCase().includes(busca.toLowerCase()) ||
      (template.atalho && template.atalho.toLowerCase().includes(busca.toLowerCase()));

    const matchCategoria = !categoriaFiltro || template.categoria === categoriaFiltro;

    return matchBusca && matchCategoria;
  });

  const categorias = Array.from(new Set(templates.map((t) => t.categoria).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Atendimento"
          nucleusPath="/nuclei/atendimento"
        />
      </div>

      {/* Container principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da página */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-8 w-8 mr-3 text-[#9333EA]" />
                <div>
                  <h1 className="text-3xl font-bold text-[#002333]">
                    Templates de Mensagens
                  </h1>
                  <p className="text-sm text-[#B4BEC9] mt-1">
                    Gerencie mensagens rápidas para atendimento
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={carregarDados}
                  disabled={loading}
                  className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
                <button
                  onClick={() => handleOpenDialog()}
                  className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Novo Template
                </button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B4BEC9]" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por nome, conteúdo ou atalho..."
                    className="w-full pl-10 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Categoria
                </label>
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                >
                  <option value="">Todas as categorias</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <RefreshCw className="h-8 w-8 text-[#9333EA] mx-auto mb-4 animate-spin" />
              <p className="text-[#B4BEC9]">Carregando templates...</p>
            </div>
          )}

          {/* Estado vazio */}
          {!loading && templatesFiltrados.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <FileText className="h-16 w-16 text-[#B4BEC9] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#002333] mb-2">
                {busca || categoriaFiltro ? 'Nenhum template encontrado' : 'Nenhum template cadastrado'}
              </h3>
              <p className="text-[#B4BEC9] mb-6">
                {busca || categoriaFiltro
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie seu primeiro template de mensagem para agilizar o atendimento'}
              </p>
              {!busca && !categoriaFiltro && (
                <button
                  onClick={() => handleOpenDialog()}
                  className="px-6 py-3 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] transition-colors inline-flex items-center gap-2 font-medium"
                >
                  <Plus className="h-5 w-5" />
                  Criar Primeiro Template
                </button>
              )}
            </div>
          )}

          {/* Grid de templates */}
          {!loading && templatesFiltrados.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templatesFiltrados.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-[#002333] mb-1">
                        {template.nome}
                      </h3>
                      {template.categoria && (
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-[#9333EA]/10 text-[#9333EA] rounded">
                          {template.categoria}
                        </span>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${template.ativo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {template.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {template.atalho && (
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4 text-[#9333EA]" />
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        /{template.atalho}
                      </code>
                    </div>
                  )}

                  <p className="text-sm text-[#B4BEC9] mb-4 line-clamp-3">
                    {template.conteudo}
                  </p>

                  {template.variaveis && template.variaveis.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-[#B4BEC9] mb-2">Variáveis:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.variaveis.slice(0, 3).map((v, idx) => (
                          <code key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {v}
                          </code>
                        ))}
                        {template.variaveis.length > 3 && (
                          <span className="text-xs text-[#B4BEC9]">
                            +{template.variaveis.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => handlePreview(template)}
                      className="flex-1 px-3 py-2 text-[#9333EA] hover:bg-[#9333EA]/10 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleCopyContent(template.conteudo)}
                      className="flex-1 px-3 py-2 text-[#9333EA] hover:bg-[#9333EA]/10 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar
                    </button>
                    <button
                      onClick={() => handleOpenDialog(template)}
                      className="p-2 text-[#9333EA] hover:bg-[#9333EA]/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog de Criação/Edição */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#002333]">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h2>
              <button
                onClick={() => setShowDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Nome do Template *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Boas-vindas, Despedida..."
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Atalho
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B4BEC9]">
                      /
                    </span>
                    <input
                      type="text"
                      value={formData.atalho}
                      onChange={(e) => setFormData({ ...formData, atalho: e.target.value })}
                      placeholder="Ex: oi, tchau, ajuda..."
                      className="w-full pl-7 pr-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Categoria
                  </label>
                  <input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Atendimento, Suporte, Vendas..."
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Conteúdo da Mensagem *
                </label>
                <textarea
                  value={formData.conteudo}
                  onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                  placeholder="Digite o conteúdo da mensagem... Use variáveis como {{nome}}, {{ticket}}, etc."
                  rows={8}
                  className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#002333] mb-2">
                  Variáveis Disponíveis
                </label>
                <div className="bg-gray-50 border border-[#B4BEC9] rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(variaveisDisponiveis).map((variavel) => (
                      <button
                        key={variavel}
                        onClick={() => insertVariable(variavel)}
                        className="px-3 py-1 bg-white border border-[#B4BEC9] rounded text-xs hover:bg-[#9333EA]/10 hover:border-[#9333EA] transition-colors"
                        title={variaveisDisponiveis[variavel]}
                      >
                        {variavel}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.nome || !formData.conteudo}
                className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {editingTemplate ? 'Salvar Alterações' : 'Criar Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Preview */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#002333]">Preview do Template</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#002333] mb-2">
                  {previewTemplate.nome}
                </h3>
                {previewTemplate.categoria && (
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-[#9333EA]/10 text-[#9333EA] rounded mb-3">
                    {previewTemplate.categoria}
                  </span>
                )}
              </div>

              <div className="bg-gray-50 border border-[#B4BEC9] rounded-lg p-4">
                <p className="text-sm text-[#002333] whitespace-pre-wrap">
                  {previewTemplate.conteudo}
                </p>
              </div>

              {previewTemplate.variaveis && previewTemplate.variaveis.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#002333] mb-2">
                    Variáveis utilizadas:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {previewTemplate.variaveis.map((v, idx) => (
                      <code key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {v}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {previewTemplate.atalho && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Atalho:</strong> Digite <code className="bg-white px-2 py-1 rounded">/{previewTemplate.atalho}</code> no chat
                  </p>
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  handleCopyContent(previewTemplate.conteudo);
                  setShowPreview(false);
                }}
                className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Copy className="h-4 w-4" />
                Copiar Conteúdo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoTemplatesPage;
