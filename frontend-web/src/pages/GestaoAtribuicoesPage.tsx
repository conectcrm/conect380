import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  RefreshCw,
  Plus,
  Trash2,
  Users,
  Target,
  GitBranch,
  User,
  ChevronDown,
  ChevronUp,
  X,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import equipeService from '../services/equipeService';
import nucleoService from '../services/nucleoService';
import { departamentoService } from '../services/departamentoService';

interface Nucleo {
  id: string;
  nome: string;
  visivelNoBot: boolean;
  departamentos: Departamento[];
}

interface Departamento {
  id: string;
  nome: string;
}

interface Atendente {
  id: string;
  nome: string;
}

interface Equipe {
  id: string;
  nome: string;
  cor?: string;
}

interface AtribuicaoView {
  id: string;
  tipo: 'atendente' | 'equipe';
  atendenteId?: string;
  atendenteNome?: string;
  equipeId?: string;
  equipeNome?: string;
  equipeCor?: string;
  nucleoId?: string | null;
  nucleoNome?: string | null;
  departamentoId?: string | null;
  departamentoNome?: string | null;
}

interface GrupoResponsavel {
  chave: string;
  titulo: string;
  tipo: 'atendente' | 'equipe';
  itens: AtribuicaoView[];
}

interface GrupoNucleo {
  chave: string;
  titulo: string;
  itens: AtribuicaoView[];
}

const GestaoAtribuicoesPage: React.FC = () => {
  const [atribuicoes, setAtribuicoes] = useState<AtribuicaoView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'atendente' | 'nucleo'>('atendente');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);

  const [formTipo, setFormTipo] = useState<'atendente' | 'equipe'>('atendente');
  const [formAtendenteId, setFormAtendenteId] = useState('');
  const [formEquipeId, setFormEquipeId] = useState('');
  const [formNucleoId, setFormNucleoId] = useState('');
  const [formDepartamentoId, setFormDepartamentoId] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);

      const [equipesResponse, atendentesResponse, nucleosResponse] = await Promise.all([
        equipeService.listar(),
        equipeService.listarTodosAtendentes(),
        nucleoService.listar({ ativo: true, visivelNoBot: true }),
      ]);

      const equipesNormalizadas: Equipe[] = Array.isArray(equipesResponse)
        ? equipesResponse.map((equipe: any) => ({
          id: equipe.id,
          nome: equipe.nome,
          cor: equipe.cor,
        }))
        : [];

      const atendentesNormalizados: Atendente[] = Array.isArray(atendentesResponse)
        ? atendentesResponse
          .filter((atendente: any) => atendente && atendente.id && atendente.nome)
          .map((atendente: any) => ({ id: atendente.id, nome: atendente.nome }))
        : [];

      const nucleosVisiveis = Array.isArray(nucleosResponse)
        ? nucleosResponse.filter((nucleo: any) => nucleo?.visivelNoBot)
        : [];

      const nucleosComDepartamentos: Nucleo[] = await Promise.all(
        nucleosVisiveis.map(async (nucleo: any) => {
          try {
            const departamentos = await departamentoService.listarPorNucleo(nucleo.id);
            const departamentosNormalizados: Departamento[] = Array.isArray(departamentos)
              ? departamentos.map((dep: any) => ({ id: dep.id, nome: dep.nome || 'Departamento' }))
              : [];

            return {
              id: nucleo.id,
              nome: nucleo.nome,
              visivelNoBot: nucleo.visivelNoBot,
              departamentos: departamentosNormalizados,
            };
          } catch (departamentoErro) {
            console.error('Erro ao carregar departamentos do núcleo', nucleo.id, departamentoErro);
            return {
              id: nucleo.id,
              nome: nucleo.nome,
              visivelNoBot: nucleo.visivelNoBot,
              departamentos: [],
            };
          }
        }),
      );

      setEquipes(equipesNormalizadas);
      setAtendentes(atendentesNormalizados);
      setNucleos(nucleosComDepartamentos);

      await carregarAtribuicoes(equipesNormalizadas, atendentesNormalizados);
    } catch (err) {
      console.error('Erro ao carregar matriz de atribuições:', err);
      setError('Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const carregarAtribuicoes = async (equipesLista: Equipe[], atendentesLista: Atendente[]) => {
    const atribuicoesEquipePromises = equipesLista.map(async (equipe) => {
      try {
        const registros = await equipeService.listarAtribuicoes(equipe.id);
        if (!Array.isArray(registros)) return [];

        return registros.map((registro: any) => ({
          id: registro.id,
          tipo: 'equipe' as const,
          equipeId: equipe.id,
          equipeNome: equipe.nome,
          equipeCor: equipe.cor,
          nucleoId: registro.nucleoId || registro.nucleo?.id || null,
          nucleoNome: registro.nucleo?.nome || null,
          departamentoId: registro.departamentoId || registro.departamento?.id || null,
          departamentoNome: registro.departamento?.nome || null,
        }));
      } catch (err) {
        console.error('Erro ao listar atribuições da equipe', equipe.id, err);
        return [];
      }
    });

    const atribuicoesAtendentePromises = atendentesLista.map(async (atendente) => {
      try {
        const registros = await equipeService.listarAtribuicoesAtendente(atendente.id);
        if (!Array.isArray(registros)) return [];

        return registros.map((registro: any) => ({
          id: registro.id,
          tipo: 'atendente' as const,
          atendenteId: atendente.id,
          atendenteNome: atendente.nome,
          nucleoId: registro.nucleoId || registro.nucleo?.id || null,
          nucleoNome: registro.nucleo?.nome || null,
          departamentoId: registro.departamentoId || registro.departamento?.id || null,
          departamentoNome: registro.departamento?.nome || null,
        }));
      } catch (err) {
        console.error('Erro ao listar atribuições do atendente', atendente.id, err);
        return [];
      }
    });

    const [atribuicoesEquipe, atribuicoesAtendentes] = await Promise.all([
      Promise.all(atribuicoesEquipePromises),
      Promise.all(atribuicoesAtendentePromises),
    ]);

    const todasAtribuicoes = [...atribuicoesEquipe.flat(), ...atribuicoesAtendentes.flat()];
    setAtribuicoes(todasAtribuicoes);
  };

  const resetForm = () => {
    setFormTipo('atendente');
    setFormAtendenteId('');
    setFormEquipeId('');
    setFormNucleoId('');
    setFormDepartamentoId('');
    setError(null);
  };

  const handleSalvarAtribuicao = async () => {
    if (!formNucleoId) {
      toast.error('Selecione um núcleo');
      return;
    }

    try {
      setError(null);
      setIsSaving(true);

      if (formTipo === 'atendente') {
        if (!formAtendenteId) {
          toast.error('Selecione um atendente');
          return;
        }

        const duplicada = atribuicoes.some((atrib) =>
          atrib.tipo === 'atendente' &&
          atrib.atendenteId === formAtendenteId &&
          (atrib.nucleoId || null) === (formNucleoId || null) &&
          (atrib.departamentoId || null) === (formDepartamentoId || null),
        );

        if (duplicada) {
          toast.error('Este atendente já está atribuído a esse destino.');
          return;
        }

        const payloadAtendente: any = {
          atendenteId: formAtendenteId,
        };
        if (formNucleoId) payloadAtendente.nucleoId = formNucleoId;
        if (formDepartamentoId) payloadAtendente.departamentoId = formDepartamentoId;

        // Validar UUIDs antes de enviar
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(payloadAtendente.atendenteId)) {
          toast.error('ID do atendente inválido');
          console.error('❌ atendenteId inválido:', payloadAtendente.atendenteId);
          return;
        }
        if (payloadAtendente.nucleoId && !uuidRegex.test(payloadAtendente.nucleoId)) {
          toast.error('ID do núcleo inválido');
          console.error('❌ nucleoId inválido:', payloadAtendente.nucleoId);
          return;
        }
        if (payloadAtendente.departamentoId && !uuidRegex.test(payloadAtendente.departamentoId)) {
          toast.error('ID do departamento inválido');
          console.error('❌ departamentoId inválido:', payloadAtendente.departamentoId);
          return;
        }

        console.log('🚀 Enviando atribuição de atendente:', payloadAtendente);
        await equipeService.atribuirAtendente(payloadAtendente);
        toast.success('Atendente atribuído com sucesso!');
      } else {
        if (!formEquipeId) {
          toast.error('Selecione uma equipe');
          return;
        }

        const duplicada = atribuicoes.some((atrib) =>
          atrib.tipo === 'equipe' &&
          atrib.equipeId === formEquipeId &&
          (atrib.nucleoId || null) === (formNucleoId || null) &&
          (atrib.departamentoId || null) === (formDepartamentoId || null),
        );

        if (duplicada) {
          toast.error('Esta equipe já está atribuída a esse destino.');
          return;
        }

        const payloadEquipe: any = {
          equipeId: formEquipeId,
        };
        if (formNucleoId) payloadEquipe.nucleoId = formNucleoId;
        if (formDepartamentoId) payloadEquipe.departamentoId = formDepartamentoId;

        // Validar UUIDs antes de enviar
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(payloadEquipe.equipeId)) {
          toast.error('ID da equipe inválido');
          console.error('❌ equipeId inválido:', payloadEquipe.equipeId);
          return;
        }
        if (payloadEquipe.nucleoId && !uuidRegex.test(payloadEquipe.nucleoId)) {
          toast.error('ID do núcleo inválido');
          console.error('❌ nucleoId inválido:', payloadEquipe.nucleoId);
          return;
        }
        if (payloadEquipe.departamentoId && !uuidRegex.test(payloadEquipe.departamentoId)) {
          toast.error('ID do departamento inválido');
          console.error('❌ departamentoId inválido:', payloadEquipe.departamentoId);
          return;
        }

        console.log('🚀 Enviando atribuição de equipe:', payloadEquipe);
        await equipeService.atribuirEquipe(payloadEquipe);
        toast.success('Equipe atribuída com sucesso!');
      }

      setShowDialog(false);
      resetForm();
      await carregarDados();
    } catch (err) {
      console.error('❌ Erro ao salvar atribuição:', err);

      // Tentar extrair mensagem do backend
      const axiosError = err as any;
      let mensagem = 'Erro ao salvar atribuição';

      if (axiosError?.response?.data) {
        const data = axiosError.response.data;
        console.error('📋 Resposta do servidor:', data);

        // Log detalhado da mensagem
        if (data.message) {
          console.error('📨 Mensagem do backend:', data.message);
        }

        // Tentar pegar a mensagem de diferentes formatos possíveis
        if (typeof data.message === 'string') {
          mensagem = data.message;
        } else if (Array.isArray(data.message)) {
          mensagem = data.message.join('. ');
        } else if (data.mensagem) {
          mensagem = data.mensagem;
        } else if (data.error) {
          mensagem = data.error;
        }
      } else if (err instanceof Error) {
        mensagem = err.message;
      }

      setError(mensagem);
      toast.error(mensagem);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoverAtribuicao = async (atrib: AtribuicaoView) => {
    if (!window.confirm('Deseja remover esta atribuição?')) return;

    try {
      if (atrib.tipo === 'atendente') {
        await equipeService.removerAtribuicaoAtendente(atrib.id);
      } else {
        await equipeService.removerAtribuicaoEquipe(atrib.id);
      }
      toast.success('Atribuição removida com sucesso!');
      await carregarDados();
    } catch (err) {
      console.error('Erro ao remover atribuição:', err);
      toast.error('Não foi possível remover a atribuição.');
    }
  };

  const toggleExpanded = (key: string) => {
    const proximo = new Set(expandedItems);
    if (proximo.has(key)) {
      proximo.delete(key);
    } else {
      proximo.add(key);
    }
    setExpandedItems(proximo);
  };

  const gruposResponsavel = useMemo<GrupoResponsavel[]>(() => {
    const mapa = new Map<string, GrupoResponsavel>();

    atribuicoes.forEach((atrib) => {
      const chave = atrib.tipo === 'atendente'
        ? `atendente-${atrib.atendenteId}`
        : `equipe-${atrib.equipeId}`;
      const titulo = atrib.tipo === 'atendente'
        ? atrib.atendenteNome || 'Atendente'
        : atrib.equipeNome || 'Equipe';

      if (!mapa.has(chave)) {
        mapa.set(chave, { chave, titulo, tipo: atrib.tipo, itens: [] });
      }

      mapa.get(chave)!.itens.push(atrib);
    });

    return Array.from(mapa.values()).sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  }, [atribuicoes]);

  const gruposNucleo = useMemo<GrupoNucleo[]>(() => {
    const mapa = new Map<string, GrupoNucleo>();

    atribuicoes.forEach((atrib) => {
      const chave = atrib.nucleoId || 'sem-nucleo';
      const titulo = atrib.nucleoNome || 'Sem núcleo definido';

      if (!mapa.has(chave)) {
        mapa.set(chave, { chave, titulo, itens: [] });
      }

      mapa.get(chave)!.itens.push(atrib);
    });

    return Array.from(mapa.values()).sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
  }, [atribuicoes]);

  const totalAtribuicoes = atribuicoes.length;
  const totalAtendentes = new Set(
    atribuicoes.filter((a) => a.tipo === 'atendente').map((a) => a.atendenteId),
  ).size;
  const totalEquipes = new Set(
    atribuicoes.filter((a) => a.tipo === 'equipe').map((a) => a.equipeId),
  ).size;
  const totalNucleos = new Set(
    atribuicoes.map((a) => a.nucleoId).filter(Boolean),
  ).size;

  const nucleoSelecionado = nucleos.find((n) => n.id === formNucleoId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/nuclei/atendimento" />
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <header className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                    <Briefcase className="h-8 w-8 mr-3 text-[#9333EA]" />
                    Matriz de Atribuições
                    {loading && (
                      <span className="ml-3">
                        <RefreshCw className="h-6 w-6 text-[#9333EA] animate-spin" />
                      </span>
                    )}
                  </h1>
                  <p className="mt-2 text-[#B4BEC9]">
                    Defina quem atende cada núcleo e departamento do atendimento
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={carregarDados}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowDialog(true)}
                    className="bg-[#9333EA] hover:bg-[#7E22CE] text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    Nova Atribuição
                  </button>
                </div>
              </div>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <DashboardCard
              titulo="Total Atribuições"
              valor={totalAtribuicoes}
              icone={<Target className="h-8 w-8 text-blue-600" />}
              gradiente="from-blue-100 to-blue-200"
            />
            <DashboardCard
              titulo="Atendentes"
              valor={totalAtendentes}
              icone={<User className="h-8 w-8 text-green-600" />}
              gradiente="from-green-100 to-green-200"
            />
            <DashboardCard
              titulo="Equipes"
              valor={totalEquipes}
              icone={<Users className="h-8 w-8 text-purple-600" />}
              gradiente="from-purple-100 to-purple-200"
            />
            <DashboardCard
              titulo="Núcleos"
              valor={totalNucleos}
              icone={<GitBranch className="h-8 w-8 text-yellow-600" />}
              gradiente="from-yellow-100 to-yellow-200"
            />
          </section>

          <section className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('atendente')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'atendente'
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <User className="h-4 w-4" />
                Por Atendente/Equipe
              </button>
              <button
                onClick={() => setViewMode('nucleo')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${viewMode === 'nucleo'
                    ? 'bg-[#9333EA] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Target className="h-4 w-4" />
                Por Núcleo
              </button>
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <RefreshCw className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando atribuições...</p>
            </div>
          ) : atribuicoes.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma atribuição configurada</h3>
              <p className="text-gray-500 mb-6">
                Cadastre atribuições para direcionar atendentes e equipes aos núcleos corretos.
              </p>
              <button
                onClick={() => setShowDialog(true)}
                className="bg-[#9333EA] hover:bg-[#7E22CE] text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Criar primeira atribuição
              </button>
            </div>
          ) : viewMode === 'atendente' ? (
            <ViewPorResponsavel
              grupos={gruposResponsavel}
              expandedItems={expandedItems}
              onToggle={toggleExpanded}
              onRemover={handleRemoverAtribuicao}
            />
          ) : (
            <ViewPorNucleo
              grupos={gruposNucleo}
              expandedItems={expandedItems}
              onToggle={toggleExpanded}
              onRemover={handleRemoverAtribuicao}
            />
          )}
        </div>
      </div>

      {showDialog && (
        <ModalNovaAtribuicao
          formTipo={formTipo}
          setFormTipo={setFormTipo}
          formAtendenteId={formAtendenteId}
          setFormAtendenteId={setFormAtendenteId}
          formEquipeId={formEquipeId}
          setFormEquipeId={setFormEquipeId}
          formNucleoId={formNucleoId}
          setFormNucleoId={(valor) => {
            setFormNucleoId(valor);
            setFormDepartamentoId('');
          }}
          formDepartamentoId={formDepartamentoId}
          setFormDepartamentoId={setFormDepartamentoId}
          atendentes={atendentes}
          equipes={equipes}
          nucleos={nucleos}
          nucleoSelecionado={nucleoSelecionado}
          onSalvar={handleSalvarAtribuicao}
          onFechar={() => {
            setShowDialog(false);
            resetForm();
          }}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

interface DashboardCardProps {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
  gradiente: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ titulo, valor, icone, gradiente }) => (
  <div className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{titulo}</p>
        <p className="mt-2 text-3xl font-bold text-[#002333]">{valor}</p>
      </div>
      <div className={`p-4 bg-gradient-to-br ${gradiente} rounded-xl`}>{icone}</div>
    </div>
  </div>
);

interface ViewPorResponsavelProps {
  grupos: GrupoResponsavel[];
  expandedItems: Set<string>;
  onToggle: (key: string) => void;
  onRemover: (atrib: AtribuicaoView) => void;
}

const ViewPorResponsavel: React.FC<ViewPorResponsavelProps> = ({ grupos, expandedItems, onToggle, onRemover }) => (
  <div className="space-y-4">
    {grupos.map((grupo) => {
      const isExpanded = expandedItems.has(grupo.chave);
      return (
        <div key={grupo.chave} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
          <button
            type="button"
            onClick={() => onToggle(grupo.chave)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {grupo.tipo === 'atendente' ? (
                <User className="h-5 w-5 text-[#9333EA]" />
              ) : (
                <Users className="h-5 w-5 text-[#9333EA]" />
              )}
              <div>
                <h3 className="font-semibold text-[#002333]">{grupo.titulo}</h3>
                <p className="text-xs text-[#B4BEC9]">{grupo.itens.length} atribuições</p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {isExpanded && (
            <div className="px-6 pb-4 space-y-3 border-t">
              {grupo.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-[#002333]">
                      {item.nucleoNome || 'Sem núcleo definido'}
                      {item.departamentoNome && <span className="text-sm text-gray-500"> → {item.departamentoNome}</span>}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.tipo === 'atendente' ? 'Atribuição individual' : 'Atribuição da equipe'}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemover(item)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover atribuição"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

interface ViewPorNucleoProps {
  grupos: GrupoNucleo[];
  expandedItems: Set<string>;
  onToggle: (key: string) => void;
  onRemover: (atrib: AtribuicaoView) => void;
}

const ViewPorNucleo: React.FC<ViewPorNucleoProps> = ({ grupos, expandedItems, onToggle, onRemover }) => (
  <div className="space-y-4">
    {grupos.map((grupo) => {
      const isExpanded = expandedItems.has(grupo.chave);
      return (
        <div key={grupo.chave} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
          <button
            type="button"
            onClick={() => onToggle(grupo.chave)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-[#9333EA]" />
              <div>
                <h3 className="font-semibold text-[#002333]">{grupo.titulo}</h3>
                <p className="text-xs text-[#B4BEC9]">{grupo.itens.length} atribuições</p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {isExpanded && (
            <div className="px-6 pb-4 space-y-3 border-t">
              {grupo.itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-[#002333]">
                      {item.tipo === 'atendente' ? item.atendenteNome : item.equipeNome}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.tipo === 'atendente' ? 'Atendente' : 'Equipe'}
                      {item.departamentoNome && <span className="text-xs text-gray-400"> • {item.departamentoNome}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemover(item)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover atribuição"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

interface ModalNovaAtribuicaoProps {
  formTipo: 'atendente' | 'equipe';
  setFormTipo: (valor: 'atendente' | 'equipe') => void;
  formAtendenteId: string;
  setFormAtendenteId: (valor: string) => void;
  formEquipeId: string;
  setFormEquipeId: (valor: string) => void;
  formNucleoId: string;
  setFormNucleoId: (valor: string) => void;
  formDepartamentoId: string;
  setFormDepartamentoId: (valor: string) => void;
  atendentes: Atendente[];
  equipes: Equipe[];
  nucleos: Nucleo[];
  nucleoSelecionado?: Nucleo;
  onSalvar: () => Promise<void>;
  onFechar: () => void;
  isSaving: boolean;
}

const ModalNovaAtribuicao: React.FC<ModalNovaAtribuicaoProps> = ({
  formTipo,
  setFormTipo,
  formAtendenteId,
  setFormAtendenteId,
  formEquipeId,
  setFormEquipeId,
  formNucleoId,
  setFormNucleoId,
  formDepartamentoId,
  setFormDepartamentoId,
  atendentes,
  equipes,
  nucleos,
  nucleoSelecionado,
  onSalvar,
  onFechar,
  isSaving,
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#002333] flex items-center">
          <Plus className="h-5 w-5 mr-2 text-[#9333EA]" />
          Nova Atribuição
        </h2>
        <button onClick={onFechar} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#002333] mb-2">Tipo de Responsável *</label>
          <div className="flex gap-3">
            <button
              onClick={() => setFormTipo('atendente')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${formTipo === 'atendente'
                  ? 'border-[#9333EA] bg-purple-50 text-[#9333EA]'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <User className="h-5 w-5 mx-auto mb-1" />
              <span className="font-medium">Atendente</span>
            </button>
            <button
              onClick={() => setFormTipo('equipe')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${formTipo === 'equipe'
                  ? 'border-[#9333EA] bg-purple-50 text-[#9333EA]'
                  : 'border-gray-200 hover:border-gray-300'
                }`}
            >
              <Users className="h-5 w-5 mx-auto mb-1" />
              <span className="font-medium">Equipe</span>
            </button>
          </div>
        </div>

        {formTipo === 'atendente' ? (
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">Atendente *</label>
            <select
              value={formAtendenteId}
              onChange={(e) => setFormAtendenteId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            >
              <option value="">Selecione um atendente</option>
              {atendentes.length === 0 && <option disabled>Cadastre atendentes antes</option>}
              {atendentes.map((atendente) => (
                <option key={atendente.id} value={atendente.id}>
                  {atendente.nome}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">Equipe *</label>
            <select
              value={formEquipeId}
              onChange={(e) => setFormEquipeId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            >
              <option value="">Selecione uma equipe</option>
              {equipes.length === 0 && <option disabled>Cadastre equipes antes</option>}
              {equipes.map((equipe) => (
                <option key={equipe.id} value={equipe.id}>
                  {equipe.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-[#002333] mb-2">Núcleo *</label>
          <select
            value={formNucleoId}
            onChange={(e) => setFormNucleoId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
          >
            <option value="">Selecione um núcleo</option>
            {nucleos.length === 0 && <option disabled>Nenhum núcleo visível no bot</option>}
            {nucleos.map((nucleo) => (
              <option key={nucleo.id} value={nucleo.id}>
                {nucleo.nome}
              </option>
            ))}
          </select>
        </div>

        {nucleoSelecionado && nucleoSelecionado.departamentos.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">Departamento (opcional)</label>
            <select
              value={formDepartamentoId}
              onChange={(e) => setFormDepartamentoId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9333EA] focus:border-transparent"
            >
              <option value="">Selecione um departamento</option>
              {nucleoSelecionado.departamentos.map((departamento) => (
                <option key={departamento.id} value={departamento.id}>
                  {departamento.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
        <button
          onClick={onFechar}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          disabled={isSaving}
        >
          Cancelar
        </button>
        <button
          onClick={onSalvar}
          disabled={
            isSaving ||
            !formNucleoId ||
            (formTipo === 'atendente' && !formAtendenteId) ||
            (formTipo === 'equipe' && !formEquipeId)
          }
          className="px-6 py-2 bg-[#9333EA] hover:bg-[#7E22CE] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Salvando...' : 'Salvar Atribuição'}
        </button>
      </div>
    </div>
  </div>
);

export default GestaoAtribuicoesPage;
