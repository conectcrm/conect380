import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Loader2,
  AlertCircle,
  FileText,
  Activity,
  Plus as PlusIcon,
  Edit3,
  DollarSign,
  User,
  MessageSquare,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  Oportunidade,
  NovaOportunidade,
} from '../../types/oportunidades';
import { EstagioOportunidade, PrioridadeOportunidade, OrigemOportunidade } from '../../types/oportunidades/enums';
import { Usuario } from '../../types/usuarios';
import { useAuth } from '../../contexts/AuthContext';

interface ModalOportunidadeProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NovaOportunidade) => Promise<void>;
  oportunidade?: Oportunidade | null; // Se fornecida, é edição
  estagioInicial?: EstagioOportunidade; // Estágio padrão ao criar
  usuarios?: Usuario[]; // Lista de usuários para select
}

// Labels traduzidos dos enums
const ESTAGIOS_LABELS: Record<EstagioOportunidade, string> = {
  [EstagioOportunidade.LEADS]: 'Leads',
  [EstagioOportunidade.QUALIFICACAO]: 'Qualificação',
  [EstagioOportunidade.PROPOSTA]: 'Proposta',
  [EstagioOportunidade.NEGOCIACAO]: 'Negociação',
  [EstagioOportunidade.FECHAMENTO]: 'Fechamento',
  [EstagioOportunidade.GANHO]: 'Ganho',
  [EstagioOportunidade.PERDIDO]: 'Perdido',
};

const PRIORIDADES_LABELS: Record<PrioridadeOportunidade, string> = {
  [PrioridadeOportunidade.BAIXA]: 'Baixa',
  [PrioridadeOportunidade.MEDIA]: 'Média',
  [PrioridadeOportunidade.ALTA]: 'Alta',
};

const ORIGENS_LABELS: Record<OrigemOportunidade, string> = {
  [OrigemOportunidade.WEBSITE]: 'Website',
  [OrigemOportunidade.INDICACAO]: 'Indicação',
  [OrigemOportunidade.TELEFONE]: 'Telefone',
  [OrigemOportunidade.EMAIL]: 'E-mail',
  [OrigemOportunidade.REDES_SOCIAIS]: 'Redes Sociais',
  [OrigemOportunidade.EVENTO]: 'Evento',
  [OrigemOportunidade.PARCEIRO]: 'Parceiro',
  [OrigemOportunidade.CAMPANHA]: 'Campanha',
};

// Tipos de atividade
type TipoAtividade =
  | 'criacao'
  | 'estagio_alterado'
  | 'valor_alterado'
  | 'contato_atualizado'
  | 'nota_adicionada'
  | 'probabilidade_alterada'
  | 'data_alterada';

interface Atividade {
  id: string;
  tipo: TipoAtividade;
  descricao: string;
  data: Date;
  usuario?: string;
  detalhes?: {
    de?: string | number;
    para?: string | number;
  };
}

// Função para gerar atividades mock (temporário)
const gerarAtividadesMock = (oportunidade?: Oportunidade | null): Atividade[] => {
  if (!oportunidade) return [];

  const atividades: Atividade[] = [
    {
      id: '1',
      tipo: 'criacao',
      descricao: 'Oportunidade criada',
      data: new Date(oportunidade.createdAt),
      usuario: oportunidade.responsavel?.nome || 'Sistema',
    },
  ];

  // Se tem data de atualização diferente da criação, adiciona atividades
  if (oportunidade.updatedAt && oportunidade.createdAt !== oportunidade.updatedAt) {
    atividades.push({
      id: '2',
      tipo: 'estagio_alterado',
      descricao: `Estágio alterado para "${ESTAGIOS_LABELS[oportunidade.estagio]}"`,
      data: new Date(oportunidade.updatedAt),
      usuario: oportunidade.responsavel?.nome || 'Sistema',
      detalhes: {
        de: 'Leads',
        para: ESTAGIOS_LABELS[oportunidade.estagio],
      },
    });
  }

  // Ordenar por data (mais recente primeiro)
  return atividades.sort((a, b) => b.data.getTime() - a.data.getTime());
};

// Ícones por tipo de atividade
const ATIVIDADE_ICONS: Record<TipoAtividade, React.ElementType> = {
  criacao: PlusIcon,
  estagio_alterado: Activity,
  valor_alterado: DollarSign,
  contato_atualizado: User,
  nota_adicionada: MessageSquare,
  probabilidade_alterada: CheckCircle,
  data_alterada: Clock,
};

// Cores por tipo de atividade
const ATIVIDADE_CORES: Record<TipoAtividade, string> = {
  criacao: 'text-green-600 bg-green-50',
  estagio_alterado: 'text-blue-600 bg-blue-50',
  valor_alterado: 'text-amber-600 bg-amber-50',
  contato_atualizado: 'text-indigo-600 bg-indigo-50',
  nota_adicionada: 'text-purple-600 bg-purple-50',
  probabilidade_alterada: 'text-emerald-600 bg-emerald-50',
  data_alterada: 'text-orange-600 bg-orange-50',
};

const ModalOportunidade: React.FC<ModalOportunidadeProps> = ({
  isOpen,
  onClose,
  onSave,
  oportunidade,
  estagioInicial = EstagioOportunidade.LEADS,
  usuarios = [],
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'detalhes' | 'atividades'>('detalhes');
  const [formData, setFormData] = useState<NovaOportunidade>({
    titulo: '',
    descricao: '',
    valor: 0,
    probabilidade: 50,
    estagio: estagioInicial,
    prioridade: PrioridadeOportunidade.MEDIA,
    origem: OrigemOportunidade.WEBSITE,
    tags: [],
    dataFechamentoEsperado: '',
    responsavel_id: user?.id || '', // ✅ Corrigido - snake_case
    cliente_id: '', // ✅ Corrigido - snake_case
    nomeContato: '',
    emailContato: '',
    telefoneContato: '',
    empresaContato: '',
  });
  const [tagInput, setTagInput] = useState('');

  // Gerar atividades (mock temporário)
  const atividades = gerarAtividadesMock(oportunidade);

  // Preencher form com dados da oportunidade ao editar
  useEffect(() => {
    if (oportunidade) {
      setFormData({
        titulo: oportunidade.titulo,
        descricao: oportunidade.descricao || '',
        valor: Number(oportunidade.valor),
        probabilidade: oportunidade.probabilidade,
        estagio: oportunidade.estagio,
        prioridade: oportunidade.prioridade,
        origem: oportunidade.origem,
        tags: oportunidade.tags || [],
        dataFechamentoEsperado: oportunidade.dataFechamentoEsperado
          ? new Date(oportunidade.dataFechamentoEsperado).toISOString().split('T')[0]
          : '',
        responsavel_id: oportunidade.responsavel?.id || '', // ✅ Corrigido
        cliente_id: oportunidade.cliente?.id || '', // ✅ Corrigido
        nomeContato: oportunidade.nomeContato || '',
        emailContato: oportunidade.emailContato || '',
        telefoneContato: oportunidade.telefoneContato || '',
        empresaContato: oportunidade.empresaContato || '',
      });
    } else {
      // Reset ao criar nova
      setFormData({
        titulo: '',
        descricao: '',
        valor: 0,
        probabilidade: 50,
        estagio: estagioInicial,
        prioridade: PrioridadeOportunidade.MEDIA,
        origem: OrigemOportunidade.WEBSITE,
        tags: [],
        dataFechamentoEsperado: '',
        responsavel_id: '', // ✅ Corrigido
        cliente_id: '', // ✅ Corrigido
        nomeContato: '',
        emailContato: '',
        telefoneContato: '',
        empresaContato: '',
      });
    }
  }, [oportunidade, estagioInicial, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, [name]: numValue }));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData((prev) => ({
          ...prev,
          tags: [...(prev.tags || []), tagInput.trim()],
        }));
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.titulo.trim()) {
      return 'Título é obrigatório';
    }
    if (formData.valor < 0) {
      return 'Valor não pode ser negativo';
    }
    if (formData.probabilidade < 0 || formData.probabilidade > 100) {
      return 'Probabilidade deve estar entre 0 e 100';
    }
    if (!formData.responsavel_id) { // ✅ Corrigido
      return 'Responsável é obrigatório';
    }
    // Se não tem cliente, precisa ter pelo menos nome do contato
    if (!formData.cliente_id && !formData.nomeContato?.trim()) { // ✅ Corrigido
      return 'Informe um cliente ou pelo menos o nome do contato';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar oportunidade:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar oportunidade';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-[#002333]">
            {oportunidade ? 'Editar Oportunidade' : 'Nova Oportunidade'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-[#002333]" />
          </button>
        </div>

        {/* Tabs (apenas quando editando) */}
        {oportunidade && (
          <div className="sticky top-[73px] bg-white border-b z-10">
            <div className="px-6 flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('detalhes')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'detalhes'
                  ? 'border-[#159A9C] text-[#159A9C]'
                  : 'border-transparent text-[#002333]/60 hover:text-[#002333]'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Detalhes
                </div>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('atividades')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'atividades'
                  ? 'border-[#159A9C] text-[#159A9C]'
                  : 'border-transparent text-[#002333]/60 hover:text-[#002333]'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Atividades
                  <span className="px-2 py-0.5 bg-[#159A9C]/10 text-[#159A9C] rounded-full text-xs font-semibold">
                    {atividades.length}
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Erro</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Aba Detalhes */}
          {activeTab === 'detalhes' && (
            <>
              {/* Informações Básicas */}
              <div>
                <h3 className="text-lg font-semibold text-[#002333] mb-4">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Título */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Título <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      placeholder="Ex: Implantação CRM - Empresa XYZ"
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Descrição
                    </label>
                    <textarea
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleChange}
                      placeholder="Descreva os detalhes da oportunidade..."
                      rows={3}
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Valor (R$) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) => handleNumberChange('valor', e.target.value)}
                      placeholder="0,00"
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  {/* Probabilidade */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Probabilidade (%) <span className="text-red-600">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.probabilidade}
                        onChange={(e) => handleNumberChange('probabilidade', e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm font-semibold text-[#002333] w-12 text-right">
                        {formData.probabilidade}%
                      </span>
                    </div>
                  </div>

                  {/* Estágio */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Estágio <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="estagio"
                      value={formData.estagio}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                      required
                    >
                      {Object.entries(ESTAGIOS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Prioridade */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Prioridade <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="prioridade"
                      value={formData.prioridade}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                      required
                    >
                      {Object.entries(PRIORIDADES_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Origem */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Origem <span className="text-red-600">*</span>
                    </label>
                    <select
                      name="origem"
                      value={formData.origem}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                      required
                    >
                      {Object.entries(ORIGENS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Data de Fechamento Esperado */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Data de Fechamento Esperado
                    </label>
                    <input
                      type="date"
                      name="dataFechamentoEsperado"
                      value={typeof formData.dataFechamentoEsperado === 'string'
                        ? formData.dataFechamentoEsperado
                        : formData.dataFechamentoEsperado instanceof Date
                          ? formData.dataFechamentoEsperado.toISOString().split('T')[0]
                          : ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Tags */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#002333] mb-2">Tags</label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Digite e pressione Enter para adicionar"
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    />
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-[#159A9C]/10 text-[#159A9C] rounded-full text-sm flex items-center gap-2"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-[#0F7B7D]"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações de Contato */}
              <div>
                <h3 className="text-lg font-semibold text-[#002333] mb-4">Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cliente ID (futuro: select com busca) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Cliente (ID)
                    </label>
                    <input
                      type="text"
                      name="cliente_id"
                      value={formData.cliente_id}
                      onChange={handleChange}
                      placeholder="ID do cliente cadastrado"
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-[#002333]/60 mt-1">
                      Ou preencha os dados do contato abaixo
                    </p>
                  </div>

                  {/* Nome Contato */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Nome do Contato
                    </label>
                    <input
                      type="text"
                      name="nomeContato"
                      value={formData.nomeContato}
                      onChange={handleChange}
                      placeholder="João Silva"
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Email Contato */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      E-mail do Contato
                    </label>
                    <input
                      type="email"
                      name="emailContato"
                      value={formData.emailContato}
                      onChange={handleChange}
                      placeholder="joao@empresa.com.br"
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Telefone Contato */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Telefone do Contato
                    </label>
                    <input
                      type="tel"
                      name="telefoneContato"
                      value={formData.telefoneContato}
                      onChange={handleChange}
                      placeholder="(11) 98765-4321"
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Empresa Contato */}
                  <div>
                    <label className="block text-sm font-medium text-[#002333] mb-2">
                      Empresa do Contato
                    </label>
                    <input
                      type="text"
                      name="empresaContato"
                      value={formData.empresaContato}
                      onChange={handleChange}
                      placeholder="Empresa XYZ Ltda"
                      className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Responsável */}
              <div>
                <h3 className="text-lg font-semibold text-[#002333] mb-4">Atribuição</h3>
                <div>
                  <label className="block text-sm font-medium text-[#002333] mb-2">
                    Responsável <span className="text-red-600">*</span>
                  </label>
                  <select
                    name="responsavel_id"
                    value={formData.responsavel_id}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent text-sm"
                    required
                  >
                    <option value="">Selecione um responsável</option>
                    {usuarios.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome} {usuario.id === user?.id ? '(Você)' : ''}
                      </option>
                    ))}
                  </select>
                  {usuarios.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Carregando usuários...
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Aba Atividades */}
          {activeTab === 'atividades' && oportunidade && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#002333]">
                  Histórico de Atividades
                </h3>
                <p className="text-sm text-[#002333]/60">
                  {atividades.length} {atividades.length === 1 ? 'atividade' : 'atividades'}
                </p>
              </div>

              {/* Timeline */}
              <div className="relative">
                {/* Linha vertical */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                {/* Lista de atividades */}
                <div className="space-y-6">
                  {atividades.map((atividade, index) => {
                    const Icon = ATIVIDADE_ICONS[atividade.tipo];
                    const cores = ATIVIDADE_CORES[atividade.tipo];

                    return (
                      <div key={atividade.id} className="relative flex gap-4">
                        {/* Ícone */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${cores} flex items-center justify-center relative z-10`}>
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 bg-gray-50 rounded-lg p-4 border">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <p className="text-sm font-medium text-[#002333]">
                              {atividade.descricao}
                            </p>
                            <span className="text-xs text-[#002333]/60 whitespace-nowrap">
                              {atividade.data.toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* Detalhes adicionais */}
                          {atividade.detalhes && (
                            <div className="text-xs text-[#002333]/60 flex items-center gap-2 mt-2">
                              {atividade.detalhes.de && (
                                <>
                                  <span className="px-2 py-1 bg-white rounded border">
                                    {atividade.detalhes.de}
                                  </span>
                                  <span>→</span>
                                  <span className="px-2 py-1 bg-white rounded border font-medium">
                                    {atividade.detalhes.para}
                                  </span>
                                </>
                              )}
                            </div>
                          )}

                          {/* Usuário */}
                          {atividade.usuario && (
                            <p className="text-xs text-[#002333]/40 mt-2 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {atividade.usuario}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estado vazio */}
              {atividades.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-[#002333]/20 mx-auto mb-3" />
                  <p className="text-sm text-[#002333]/60">
                    Nenhuma atividade registrada ainda
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {oportunidade ? 'Atualizar' : 'Criar Oportunidade'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalOportunidade;
