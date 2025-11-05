import React, { useEffect, useMemo, useState } from 'react';
import {
  Workflow,
  RefreshCw,
  Plus,
  Search,
  Filter as FilterIcon,
  Copy,
  Rocket,
  Ban,
  Trash2,
  Code2,
  Layers,
  TrendingUp,
  Activity,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { KPICard } from '../../../components/common/KPICard';
import {
  fluxoService,
  FluxoTriagem,
  FilterFluxoDto,
  CreateFluxoDto,
} from '../../../services/fluxoService';

interface FormState {
  nome: string;
  descricao: string;
  tipo: string;
  canais: string[];
  estruturaJson: string;
  ativo: boolean;
}

const defaultEstrutura = {
  etapaInicial: 'inicio',
  etapas: {
    inicio: {
      id: 'inicio',
      tipo: 'mensagem_menu',
      mensagem: 'Bem-vindo! Como podemos ajudar?',
      opcoes: [
        {
          numero: 1,
          texto: 'Falar com suporte',
          proximaEtapa: 'suporte',
        },
        {
          numero: 2,
          texto: 'Falar com vendas',
          proximaEtapa: 'vendas',
        },
      ],
    },
    suporte: {
      id: 'suporte',
      tipo: 'mensagem_menu',
      mensagem: 'Estamos direcionando você para o núcleo de suporte.',
      proximaEtapa: 'fim',
    },
    vendas: {
      id: 'vendas',
      tipo: 'mensagem_menu',
      mensagem: 'Estamos direcionando você para o núcleo de vendas.',
      proximaEtapa: 'fim',
    },
    fim: {
      id: 'fim',
      tipo: 'acao',
      mensagem: 'Fluxo encerrado.',
      acao: 'finalizar',
    },
  },
};

const tiposFluxo = [
  { value: '', label: 'Todos os tipos' },
  { value: 'menu_opcoes', label: 'Menu de opções' },
  { value: 'menu_simples', label: 'Menu simples' },
  { value: 'arvore_decisao', label: 'Árvore de decisão' },
  { value: 'keyword_match', label: 'Keyword match' },
  { value: 'coleta_dados', label: 'Coleta de dados' },
  { value: 'condicional', label: 'Condicional' },
];

const canaisDisponiveis = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'webchat', label: 'Web Chat' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook Messenger' },
];

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Inativos' },
];

const publicadoOptions = [
  { value: '', label: 'Todos' },
  { value: 'true', label: 'Publicados' },
  { value: 'false', label: 'Rascunhos' },
];

const canaisFilterOptions = [
  { value: '', label: 'Todos os canais' },
  ...canaisDisponiveis,
];

const defaultFormState: FormState = {
  nome: '',
  descricao: '',
  tipo: 'menu_opcoes',
  canais: ['whatsapp'],
  estruturaJson: JSON.stringify(defaultEstrutura, null, 2),
  ativo: true,
};

const defaultFiltros = {
  search: '',
  tipo: '',
  ativo: '',
  publicado: '',
  canal: '',
};

type FiltrosState = typeof defaultFiltros;

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleString('pt-BR');
  } catch (error) {
    console.warn('Não foi possível formatar a data', dateString, error);
    return dateString;
  }
};

const canaisToString = (canais?: string[]) => {
  if (!Array.isArray(canais) || canais.length === 0) {
    return 'Não definido';
  }
  return canais.join(', ');
};

const parseJsonSafe = (value: string) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const montarFiltrosRequest = (filtros: FiltrosState): FilterFluxoDto => {
  const params: FilterFluxoDto = {};

  if (filtros.tipo) params.tipo = filtros.tipo;
  if (filtros.ativo) params.ativo = filtros.ativo === 'true';
  if (filtros.publicado) params.publicado = filtros.publicado === 'true';
  if (filtros.canal) params.canal = filtros.canal;

  return params;
};

const fluxoFiltrado = (lista: FluxoTriagem[], filtros: typeof defaultFiltros) => {
  const busca = filtros.search.trim().toLowerCase();

  return lista.filter((fluxo) => {
    const canaisAtuais = Array.isArray(fluxo.canais) ? fluxo.canais : [];
    const atendeBusca =
      busca.length === 0 ||
      fluxo.nome.toLowerCase().includes(busca) ||
      (fluxo.descricao ? fluxo.descricao.toLowerCase().includes(busca) : false);

    const atendeTipo = filtros.tipo ? fluxo.tipo === filtros.tipo : true;
    const atendeAtivo = filtros.ativo ? String(fluxo.ativo) === filtros.ativo : true;
    const atendePublicado = filtros.publicado ? String(fluxo.publicado) === filtros.publicado : true;
    const atendeCanal = filtros.canal ? canaisAtuais.includes(filtros.canal) : true;

    return atendeBusca && atendeTipo && atendeAtivo && atendePublicado && atendeCanal;
  });
};

interface GestaoFluxosPageProps {
  hideBackButton?: boolean;
}

const GestaoFluxosPage: React.FC<GestaoFluxosPageProps> = ({ hideBackButton = false }) => {
  const navigate = useNavigate();
  const [fluxos, setFluxos] = useState<FluxoTriagem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFluxo, setEditingFluxo] = useState<FluxoTriagem | null>(null);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [filtros, setFiltros] = useState(() => ({ ...defaultFiltros }));
  const [jsonErro, setJsonErro] = useState<string | null>(null);

  const carregarFluxos = async (filtrosAtuais?: FilterFluxoDto) => {
    setLoading(true);
    setError(null);
    try {
      const dados = await fluxoService.listar(filtrosAtuais);
      const normalizados = Array.isArray(dados)
        ? dados.map((fluxo) => ({
          ...fluxo,
          canais: Array.isArray(fluxo.canais) ? fluxo.canais : [],
        }))
        : [];
      setFluxos(normalizados);
    } catch (err: unknown) {
      console.error('Erro ao carregar fluxos', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Não foi possível carregar os fluxos.');
      setFluxos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarFluxos();
  }, []);

  const fluxosFiltrados = useMemo(() => fluxoFiltrado(fluxos, filtros), [fluxos, filtros]);

  const totalFluxos = fluxos.length;
  const fluxosPublicados = fluxos.filter((fluxo) => fluxo.publicado).length;
  const fluxosAtivos = fluxos.filter((fluxo) => fluxo.ativo).length;
  const totalExecucoes = fluxos.reduce((acc, fluxo) => acc + (fluxo.totalExecucoes || 0), 0);

  const abrirModal = (fluxo?: FluxoTriagem) => {
    if (fluxo) {
      setEditingFluxo(fluxo);
      setFormState({
        nome: fluxo.nome,
        descricao: fluxo.descricao || '',
        tipo: fluxo.tipo,
        canais: Array.isArray(fluxo.canais) ? fluxo.canais : ['whatsapp'],
        estruturaJson: JSON.stringify(fluxo.estrutura, null, 2),
        ativo: fluxo.ativo,
      });
    } else {
      setEditingFluxo(null);
      setFormState(defaultFormState);
    }
    setJsonErro(null);
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingFluxo(null);
    setFormState(defaultFormState);
    setJsonErro(null);
  };

  const handleInputChange = (campo: keyof FormState, valor: string | boolean | string[]) => {
    setFormState((prev) => ({
      ...prev,
      [campo]: valor,
    }));
  };

  const handleSalvar = async () => {
    setIsSaving(true);
    setJsonErro(null);

    const estrutura = parseJsonSafe(formState.estruturaJson);
    if (!estrutura) {
      setJsonErro('Estrutura inválida. Verifique se o JSON está correto.');
      setIsSaving(false);
      return;
    }

    const payload: CreateFluxoDto = {
      nome: formState.nome,
      descricao: formState.descricao,
      tipo: formState.tipo as CreateFluxoDto['tipo'],
      canais: Array.isArray(formState.canais) ? formState.canais : ['whatsapp'],
      estrutura,
      ativo: formState.ativo,
    };

    try {
      if (editingFluxo) {
        await fluxoService.atualizar(editingFluxo.id, payload);
      } else {
        await fluxoService.criar(payload);
      }
      await carregarFluxos(montarFiltrosRequest(filtros));
      fecharModal();
    } catch (err) {
      console.error('Erro ao salvar fluxo', err);
      console.error('Response data:', (err as any)?.response?.data);
      console.error('Response status:', (err as any)?.response?.status);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Não foi possível salvar o fluxo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicar = async (fluxo: FluxoTriagem) => {
    try {
      await fluxoService.duplicar(fluxo.id, `${fluxo.nome} (cópia)`);
      await carregarFluxos(montarFiltrosRequest(filtros));
    } catch (err) {
      console.error('Erro ao duplicar fluxo', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Não foi possível duplicar o fluxo.');
    }
  };

  const handlePublicar = async (fluxo: FluxoTriagem) => {
    try {
      if (fluxo.publicado) {
        await fluxoService.despublicar(fluxo.id);
      } else {
        await fluxoService.publicar(fluxo.id, {
          mensagemPublicacao: 'Fluxo publicado via dashboard.',
          motivoPublicacao: 'Publicação manual via dashboard',
          ativo: true,
          definirComoPadrao: true,
        });
      }
      await carregarFluxos(montarFiltrosRequest(filtros));
    } catch (err) {
      console.error('Erro ao alterar publicação', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Não foi possível alterar a publicação.');
    }
  };

  const handleExcluir = async (fluxo: FluxoTriagem) => {
    if (!window.confirm(`Deseja realmente excluir o fluxo "${fluxo.nome}"?`)) {
      return;
    }

    try {
      await fluxoService.deletar(fluxo.id);
      await carregarFluxos(montarFiltrosRequest(filtros));
    } catch (err) {
      console.error('Erro ao excluir fluxo', err);
      const responseMessage = (err as any)?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = err instanceof Error ? err.message : undefined;
      setError(normalizedMessage || fallbackMessage || 'Não foi possível excluir o fluxo.');
    }
  };

  const handleAplicarFiltros = () => {
    carregarFluxos(montarFiltrosRequest(filtros));
  };

  const handleLimparFiltros = () => {
    setFiltros({ ...defaultFiltros });
    carregarFluxos();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {!hideBackButton && (
        <div className="bg-white border-b px-6 py-4 -mx-6 -mt-6 mb-6">
          <BackToNucleus nucleusName="Atendimento" nucleusPath="/nuclei/atendimento" />
        </div>
      )}

      {/* Dashboard Cards - Tema Crevasse */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KPICard
          titulo="Total de fluxos"
          valor={totalFluxos}
          icone={Workflow}
          descricao="📊 Visão geral"
          color="crevasse"
        />

        <KPICard
          titulo="Publicados"
          valor={fluxosPublicados}
          icone={Rocket}
          descricao="🚀 Prontos para uso"
          color="crevasse"
        />

        <KPICard
          titulo="Ativos"
          valor={fluxosAtivos}
          icone={Activity}
          descricao="⚙️ Em operação"
          color="crevasse"
        />

        <KPICard
          titulo="Execuções"
          valor={totalExecucoes}
          icone={TrendingUp}
          descricao="📈 Volume acumulado"
          color="crevasse"
        />
      </div>

      {/* Barra de Busca e Ações */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar fluxos..."
              value={filtros.search}
              onChange={(event) => setFiltros((prev) => ({ ...prev, search: event.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => carregarFluxos(montarFiltrosRequest(filtros))}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/gestao/fluxos/novo/builder')}
              className="inline-flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Novo Fluxo
            </button>
            <button
              onClick={() => abrirModal()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Editor JSON avançado"
            >
              <Code2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6" style={{ display: 'none' }}>
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar fluxos</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Digite o nome ou descrição"
                value={filtros.search}
                onChange={(event) => setFiltros((prev) => ({ ...prev, search: event.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(event) => setFiltros((prev) => ({ ...prev, tipo: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            >
              {tiposFluxo.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filtros.ativo}
              onChange={(event) => setFiltros((prev) => ({ ...prev, ativo: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Publicação</label>
            <select
              value={filtros.publicado}
              onChange={(event) => setFiltros((prev) => ({ ...prev, publicado: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            >
              {publicadoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Canal</label>
            <select
              value={filtros.canal}
              onChange={(event) => setFiltros((prev) => ({ ...prev, canal: event.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            >
              {canaisFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <button
            onClick={handleLimparFiltros}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpar filtros
          </button>
          <button
            onClick={handleAplicarFiltros}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] transition-colors"
          >
            <FilterIcon className="w-4 h-4" />
            Aplicar filtros
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-600 gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" /> Carregando fluxos...
        </div>
      ) : fluxosFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-dashed">
          <div className="px-6 py-12 text-center text-gray-600">
            <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filtros.search ? 'Nenhum fluxo encontrado com os filtros atuais' : 'Nenhum fluxo cadastrado'}
            </h3>
            <p className="text-gray-600 mb-5">
              {filtros.search
                ? 'Tente ajustar os filtros de busca para encontrar outros fluxos.'
                : 'Crie seu primeiro fluxo com o construtor visual - arraste, conecte e configure sem código!'}
            </p>
            <button
              onClick={() => navigate('/gestao/fluxos/novo/builder')}
              className="px-4 py-2 bg-[#159A9C] hover:bg-[#0F7B7D] text-white rounded-lg transition-colors inline-flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-5 h-5" /> Criar primeiro fluxo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fluxosFiltrados.map((fluxo) => (
            <div
              key={fluxo.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-[#159A9C]/10 flex items-center justify-center shadow-sm"
                    >
                      <Workflow className="h-6 w-6 text-[#159A9C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{fluxo.nome}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {fluxo.publicado ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Publicado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Rascunho
                          </span>
                        )}
                        {fluxo.ativo ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Inativo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/gestao/fluxos/${fluxo.id}/builder`)}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors group"
                    title="Abrir no construtor visual"
                  >
                    <Layers className="h-5 w-5 text-[#9333EA] group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                {fluxo.descricao && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{fluxo.descricao}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <p className="font-medium text-gray-900">Tipo</p>
                    <p>{fluxo.tipo}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Canais</p>
                    <p>{canaisToString(fluxo.canais)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Execuções</p>
                    <p>{fluxo.totalExecucoes}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Conclusões</p>
                    <p>{fluxo.totalConclusoes}</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-4 space-y-1">
                  <p>Atualizado em: {formatDate(fluxo.updatedAt)}</p>
                  <p>Publicado em: {formatDate(fluxo.publishedAt)}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {/* Botão PRINCIPAL - Abrir no Editor Visual */}
                  <button
                    onClick={() => navigate(`/gestao/fluxos/${fluxo.id}/builder`)}
                    className="flex-1 min-w-[200px] px-4 py-2 text-sm font-medium text-white bg-[#159A9C] hover:bg-[#0F7B7D] rounded-lg transition-colors"
                  >
                    <Layers className="w-4 h-4 inline mr-2" />
                    Editar Fluxo
                  </button>

                  {/* Botões secundários */}
                  <button
                    onClick={() => handleDuplicar(fluxo)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Duplicar fluxo"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => abrirModal(fluxo)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Ver/Editar JSON (avançado)"
                  >
                    <Code2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handlePublicar(fluxo)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${fluxo.publicado
                      ? 'border border-gray-300 hover:bg-gray-50 text-gray-700'
                      : 'bg-[#159A9C] text-white hover:bg-[#0F7B7D]'
                      }`}
                    title={fluxo.publicado ? 'Despublicar' : 'Publicar'}
                  >
                    {fluxo.publicado ? <Ban className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleExcluir(fluxo)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Excluir fluxo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingFluxo ? 'Editar fluxo' : 'Criar novo fluxo'}
                </h2>
                <p className="text-sm text-gray-600">Defina as informações básicas e cole a estrutura do fluxo em JSON.</p>
              </div>
              <button
                onClick={fecharModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome do fluxo</label>
                  <input
                    value={formState.nome}
                    onChange={(event) => handleInputChange('nome', event.target.value)}
                    placeholder="Fluxo de atendimento padrão"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    value={formState.tipo}
                    onChange={(event) => handleInputChange('tipo', event.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                  >
                    {tiposFluxo
                      .filter((tipo) => tipo.value !== '')
                      .map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={formState.descricao}
                  onChange={(event) => handleInputChange('descricao', event.target.value)}
                  placeholder="Explique o objetivo do fluxo para facilitar o entendimento da equipe."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canais habilitados</label>
                  <div className="flex flex-wrap gap-2">
                    {canaisDisponiveis.map((canal) => {
                      const checked = formState.canais.includes(canal.value);
                      return (
                        <label key={canal.value} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              const novoValor = event.target.checked
                                ? [...formState.canais, canal.value]
                                : formState.canais.filter((item) => item !== canal.value);
                              handleInputChange('canais', novoValor);
                            }}
                          />
                          {canal.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={formState.ativo}
                      onChange={(event) => handleInputChange('ativo', event.target.checked)}
                    />
                    Fluxo ativo
                  </label>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Estrutura (JSON)
                  <span className="text-xs font-normal text-gray-500">Cole a estrutura de etapas e opções do fluxo</span>
                </label>
                <textarea
                  value={formState.estruturaJson}
                  onChange={(event) => handleInputChange('estruturaJson', event.target.value)}
                  className="w-full h-64 font-mono text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
                />
                {jsonErro && <span className="text-sm text-red-600">{jsonErro}</span>}
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4" />
                    Exemplo rápido: etapa inicial "inicio" com opções para núcleos de suporte e vendas.
                  </div>
                  <button
                    onClick={() => handleInputChange('estruturaJson', JSON.stringify(defaultEstrutura, null, 2))}
                    className="text-[#9333EA] hover:text-[#7E22CE]"
                  >
                    Restaurar exemplo
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={fecharModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={isSaving}
                className="px-4 py-2 bg-[#9333EA] text-white rounded-lg hover:bg-[#7E22CE] disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : editingFluxo ? 'Atualizar fluxo' : 'Criar fluxo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoFluxosPage;


