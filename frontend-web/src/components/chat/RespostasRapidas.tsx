import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, X, Save, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useGlobalConfirmation } from '../../contexts/GlobalConfirmationContext';

import { API_BASE_URL } from '../../services/api';

const API_URL = API_BASE_URL;

interface RespostasRapidasProps {
  onSelecionarTemplate: (conteudo: string) => void;
  ticketAtual?: any;
  clienteAtual?: any;
}

interface Template {
  id: string;
  nome: string;
  conteudo: string;
  categoria: string;
  atalho: string;
  variaveis: string[];
  ativo: boolean;
}

interface VariavelInfo {
  chave: string;
  descricao: string;
  exemplo: string;
}

const CATEGORIAS = [
  { value: 'saudacao', label: 'Saudação', icon: '👋' },
  { value: 'despedida', label: 'Despedida', icon: '👋' },
  { value: 'faq', label: 'FAQ', icon: '❓' },
  { value: 'aguardando', label: 'Aguardando', icon: '⏳' },
  { value: 'resolucao', label: 'Resolução', icon: '✅' },
  { value: 'transferencia', label: 'Transferência', icon: '🔄' },
  { value: 'outro', label: 'Outro', icon: '📝' },
];

export function RespostasRapidas({
  onSelecionarTemplate,
  ticketAtual,
  clienteAtual,
}: RespostasRapidasProps) {
  const { confirm } = useGlobalConfirmation();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [modoEdicao, setModoEdicao] = useState(false);
  const [templateEditando, setTemplateEditando] = useState<Template | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [variaveis, setVariaveis] = useState<VariavelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Form states
  const [formNome, setFormNome] = useState('');
  const [formConteudo, setFormConteudo] = useState('');
  const [formCategoria, setFormCategoria] = useState('faq');
  const [formAtalho, setFormAtalho] = useState('');

  const empresaId = user?.empresa?.id;
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    carregarTemplates();
    carregarVariaveis();
  }, []);

  const carregarTemplates = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/atendimento/templates`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { empresaId, apenasAtivos: 'true' },
      });

      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error: any) {
      console.error('[RespostasRapidas] Erro ao carregar templates:', error);
      setErro('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const carregarVariaveis = async () => {
    try {
      const response = await axios.get(`${API_URL}/atendimento/templates/variaveis`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setVariaveis(response.data.data);
      }
    } catch (error: any) {
      console.error('[RespostasRapidas] Erro ao carregar variáveis:', error);
    }
  };

  const processarTemplate = async (template: Template) => {
    try {
      const dados = {
        nome: clienteAtual?.nome || ticketAtual?.contatoNome || 'Cliente',
        empresa: 'ConectCRM', // Pode vir do contexto
        ticket: ticketAtual?.numero || '000',
        email: clienteAtual?.email || '',
        telefone: clienteAtual?.telefone || ticketAtual?.contatoTelefone || '',
      };

      const response = await axios.post(
        `${API_URL}/atendimento/templates/processar/${template.id}`,
        dados,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { empresaId },
        },
      );

      if (response.data.success) {
        onSelecionarTemplate(response.data.data.mensagem);
      }
    } catch (error: any) {
      console.error('[RespostasRapidas] Erro ao processar template:', error);
      setErro('Erro ao processar template');
    }
  };

  const criarTemplate = async () => {
    if (!formNome.trim() || !formConteudo.trim()) {
      setErro('Nome e conteúdo são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setErro(null);

      const response = await axios.post(
        `${API_URL}/atendimento/templates`,
        {
          nome: formNome.trim(),
          conteudo: formConteudo.trim(),
          categoria: formCategoria,
          atalho: formAtalho.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { empresaId },
        },
      );

      if (response.data.success) {
        setSucesso('Template criado com sucesso!');
        resetForm();
        await carregarTemplates();
        setTimeout(() => setSucesso(null), 3000);
      }
    } catch (error: any) {
      console.error('[RespostasRapidas] Erro ao criar template:', error);
      setErro(error.response?.data?.message || 'Erro ao criar template');
    } finally {
      setLoading(false);
    }
  };

  const atualizarTemplate = async () => {
    if (!templateEditando || !formNome.trim() || !formConteudo.trim()) {
      setErro('Nome e conteúdo são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      setErro(null);

      const response = await axios.put(
        `${API_URL}/atendimento/templates/${templateEditando.id}`,
        {
          nome: formNome.trim(),
          conteudo: formConteudo.trim(),
          categoria: formCategoria,
          atalho: formAtalho.trim() || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { empresaId },
        },
      );

      if (response.data.success) {
        setSucesso('Template atualizado com sucesso!');
        resetForm();
        await carregarTemplates();
        setTimeout(() => setSucesso(null), 3000);
      }
    } catch (error: any) {
      console.error('[RespostasRapidas] Erro ao atualizar template:', error);
      setErro(error.response?.data?.message || 'Erro ao atualizar template');
    } finally {
      setLoading(false);
    }
  };

  const deletarTemplate = async (id: string) => {
    if (!(await confirm('Tem certeza que deseja deletar este template?'))) return;

    try {
      setLoading(true);
      await axios.delete(`${API_URL}/atendimento/templates/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { empresaId },
      });

      setSucesso('Template deletado com sucesso!');
      await carregarTemplates();
      setTimeout(() => setSucesso(null), 3000);
    } catch (error: any) {
      console.error('[RespostasRapidas] Erro ao deletar template:', error);
      setErro('Erro ao deletar template');
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicao = (template: Template) => {
    setTemplateEditando(template);
    setFormNome(template.nome);
    setFormConteudo(template.conteudo);
    setFormCategoria(template.categoria || 'faq');
    setFormAtalho(template.atalho || '');
    setMostrarFormulario(true);
    setModoEdicao(true);
  };

  const resetForm = () => {
    setTemplateEditando(null);
    setFormNome('');
    setFormConteudo('');
    setFormCategoria('faq');
    setFormAtalho('');
    setMostrarFormulario(false);
    setModoEdicao(false);
    setErro(null);
  };

  const inserirVariavel = (variavel: string) => {
    setFormConteudo((prev) => prev + ` {{${variavel}}}`);
  };

  const templatesFiltrados = templates.filter((t) => {
    // Evita crash quando backend não envia algum campo
    const nome = t.nome?.toLowerCase?.() || '';
    const conteudo = t.conteudo?.toLowerCase?.() || '';
    const atalho = t.atalho?.toLowerCase?.() || '';
    const buscaLower = busca.toLowerCase();

    const matchBusca =
      nome.includes(buscaLower) ||
      conteudo.includes(buscaLower) ||
      atalho.includes(buscaLower);

    const matchCategoria = categoriaFiltro === 'todas' || t.categoria === categoriaFiltro;

    return matchBusca && matchCategoria;
  });

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#159A9C]" />
            <h3 className="text-lg font-semibold text-gray-900">Respostas Rápidas</h3>
          </div>
          <button
            onClick={() => {
              resetForm();
              setMostrarFormulario(true);
            }}
            className="px-3 py-1.5 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Template
          </button>
        </div>

        {/* Busca e Filtros */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
            />
          </div>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
          >
            <option value="todas">Todas categorias</option>
            {CATEGORIAS.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="m-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {sucesso}
        </div>
      )}

      {/* Formulário */}
      {mostrarFormulario && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Template *
                </label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Boas-vindas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Atalho (opcional)
                </label>
                <input
                  type="text"
                  value={formAtalho}
                  onChange={(e) => setFormAtalho(e.target.value)}
                  placeholder="Ex: /bv"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={formCategoria}
                onChange={(e) => setFormCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
              <textarea
                value={formConteudo}
                onChange={(e) => setFormConteudo(e.target.value)}
                placeholder="Digite a mensagem do template..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
              />
            </div>

            {/* Variáveis disponíveis */}
            {variaveis.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Clique para inserir variáveis:</p>
                <div className="flex flex-wrap gap-2">
                  {variaveis.map((v) => (
                    <button
                      key={v.chave}
                      onClick={() => inserirVariavel(v.chave)}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                      title={v.descricao}
                    >
                      {`{{${v.chave}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2">
              <button
                onClick={modoEdicao ? atualizarTemplate : criarTemplate}
                disabled={loading}
                className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {modoEdicao ? 'Atualizar' : 'Criar'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Templates */}
      <div className="max-h-96 overflow-y-auto">
        {loading && templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin h-8 w-8 border-4 border-[#159A9C] border-t-transparent rounded-full mx-auto mb-2" />
            Carregando templates...
          </div>
        ) : templatesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Nenhum template encontrado</p>
            <p className="text-sm mt-1">
              {busca || categoriaFiltro !== 'todas'
                ? 'Tente ajustar os filtros'
                : 'Crie seu primeiro template acima'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {templatesFiltrados.map((template) => {
              const categoria = CATEGORIAS.find((c) => c.value === template.categoria);

              return (
                <div key={template.id} className="p-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => processarTemplate(template)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{template.nome}</span>
                        {template.atalho && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-mono">
                            {template.atalho}
                          </span>
                        )}
                        {categoria && <span className="text-xs">{categoria.icon}</span>}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{template.conteudo}</p>
                    </button>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => iniciarEdicao(template)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deletarTemplate(template.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
