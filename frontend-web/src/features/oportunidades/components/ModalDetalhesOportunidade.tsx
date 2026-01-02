import React, { useState, useEffect } from 'react';
import {
  Oportunidade,
  AtualizarOportunidade,
  EstagioOportunidade,
  PrioridadeOportunidade,
  OrigemOportunidade,
} from '../../../types/oportunidades/index';
import {
  type LucideIcon,
  User,
  DollarSign,
  Target,
  Building,
  X,
  Edit2,
  Save,
  AlertCircle,
} from 'lucide-react';

const asIcon = (IconComponent: LucideIcon) =>
  IconComponent as React.FC<React.SVGProps<SVGSVGElement>>;

const UserIcon = asIcon(User);
const DollarSignIcon = asIcon(DollarSign);
const TargetIcon = asIcon(Target);
const BuildingIcon = asIcon(Building);
const CloseIcon = asIcon(X);
const EditIcon = asIcon(Edit2);
const SaveIcon = asIcon(Save);
const AlertIcon = asIcon(AlertCircle);
import { useOportunidades } from '../hooks/useOportunidades';

interface ModalDetalhesOportunidadeProps {
  isOpen: boolean;
  oportunidade: Oportunidade | null;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}

const estagiosOptions: Array<{ value: EstagioOportunidade; label: string }> = [
  { value: EstagioOportunidade.LEADS, label: 'Leads' },
  { value: EstagioOportunidade.QUALIFICACAO, label: 'Qualificação' },
  { value: EstagioOportunidade.PROPOSTA, label: 'Proposta' },
  { value: EstagioOportunidade.NEGOCIACAO, label: 'Negociação' },
  { value: EstagioOportunidade.FECHAMENTO, label: 'Fechamento' },
  { value: EstagioOportunidade.GANHO, label: 'Ganhou' },
  { value: EstagioOportunidade.PERDIDO, label: 'Perdeu' },
];

const prioridadeOptions: Array<{ value: PrioridadeOportunidade; label: string }> = [
  { value: PrioridadeOportunidade.BAIXA, label: 'Baixa' },
  { value: PrioridadeOportunidade.MEDIA, label: 'Média' },
  { value: PrioridadeOportunidade.ALTA, label: 'Alta' },
];

const origemOptions: Array<{ value: OrigemOportunidade; label: string }> = [
  { value: OrigemOportunidade.WEBSITE, label: 'Website' },
  { value: OrigemOportunidade.INDICACAO, label: 'Indicação' },
  { value: OrigemOportunidade.TELEFONE, label: 'Telefone' },
  { value: OrigemOportunidade.EMAIL, label: 'Email' },
  { value: OrigemOportunidade.REDES_SOCIAIS, label: 'Redes Sociais' },
  { value: OrigemOportunidade.EVENTO, label: 'Evento' },
  { value: OrigemOportunidade.PARCEIRO, label: 'Parceiro' },
  { value: OrigemOportunidade.CAMPANHA, label: 'Campanha' },
];

export const ModalDetalhesOportunidade: React.FC<ModalDetalhesOportunidadeProps> = ({
  isOpen,
  oportunidade,
  onClose,
  onUpdateSuccess,
}) => {
  const { atualizarOportunidade, loading } = useOportunidades();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AtualizarOportunidade>({
    id: 0,
    titulo: '',
    descricao: '',
    valor: 0,
    estagio: EstagioOportunidade.LEADS,
    probabilidade: 50,
    prioridade: PrioridadeOportunidade.MEDIA,
    nomeContato: '',
    emailContato: '',
    telefoneContato: '',
    empresaContato: '',
    dataFechamentoEsperado: '',
    origem: OrigemOportunidade.WEBSITE,
    observacoes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (oportunidade) {
      setFormData({
        id: oportunidade.id,
        titulo: oportunidade.titulo,
        descricao: oportunidade.descricao || '',
        valor: oportunidade.valor,
        estagio: oportunidade.estagio,
        probabilidade: oportunidade.probabilidade,
        prioridade: oportunidade.prioridade,
        nomeContato: oportunidade.nomeContato || '',
        emailContato: oportunidade.emailContato || '',
        telefoneContato: oportunidade.telefoneContato || '',
        empresaContato: oportunidade.empresaContato || '',
        dataFechamentoEsperado: oportunidade.dataFechamentoEsperado
          ? new Date(oportunidade.dataFechamentoEsperado).toISOString().split('T')[0]
          : '',
        origem: oportunidade.origem || OrigemOportunidade.WEBSITE,
        observacoes: oportunidade.observacoes || '',
      });
    }
  }, [oportunidade]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (!formData.nomeContato.trim()) {
      newErrors.nomeContato = 'Nome do contato é obrigatório';
    }

    if (!formData.emailContato.trim()) {
      newErrors.emailContato = 'Email do contato é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.emailContato)) {
      newErrors.emailContato = 'Email inválido';
    }

    if (formData.valor <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (formData.probabilidade < 0 || formData.probabilidade > 100) {
      newErrors.probabilidade = 'Probabilidade deve estar entre 0 e 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const payload: AtualizarOportunidade = {
        ...formData,
        dataFechamentoEsperado: formData.dataFechamentoEsperado
          ? typeof formData.dataFechamentoEsperado === 'string'
            ? formData.dataFechamentoEsperado
            : formData.dataFechamentoEsperado.toISOString()
          : null,
      };

      await atualizarOportunidade(payload);
      setIsEditing(false);
      onUpdateSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar oportunidade:', error);
    }
  };

  const handleCancel = () => {
    if (oportunidade) {
      setFormData({
        id: oportunidade.id,
        titulo: oportunidade.titulo,
        descricao: oportunidade.descricao || '',
        valor: oportunidade.valor,
        estagio: oportunidade.estagio,
        probabilidade: oportunidade.probabilidade,
        prioridade: oportunidade.prioridade,
        nomeContato: oportunidade.nomeContato || '',
        emailContato: oportunidade.emailContato || '',
        telefoneContato: oportunidade.telefoneContato || '',
        empresaContato: oportunidade.empresaContato || '',
        dataFechamentoEsperado: oportunidade.dataFechamentoEsperado
          ? new Date(oportunidade.dataFechamentoEsperado).toISOString().split('T')[0]
          : '',
        origem: oportunidade.origem || OrigemOportunidade.WEBSITE,
        observacoes: oportunidade.observacoes || '',
      });
    }
    setIsEditing(false);
    setErrors({});
  };

  const handleClose = () => {
    handleCancel();
    onClose();
  };

  const handleInputChange = (field: keyof AtualizarOportunidade, value: any) => {
    if (field === 'dataFechamentoEsperado') {
      const coercedValue = value ? String(value) : '';
      setFormData((prev) => ({ ...prev, [field]: coercedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const getPrioridadeColor = (prioridade: PrioridadeOportunidade) => {
    switch (prioridade) {
      case PrioridadeOportunidade.BAIXA:
        return 'bg-green-100 text-green-800';
      case PrioridadeOportunidade.MEDIA:
        return 'bg-yellow-100 text-yellow-800';
      case PrioridadeOportunidade.ALTA:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstagioColor = (estagio: EstagioOportunidade) => {
    switch (estagio) {
      case EstagioOportunidade.GANHO:
        return 'bg-green-100 text-green-800';
      case EstagioOportunidade.PERDIDO:
        return 'bg-red-100 text-red-800';
      case EstagioOportunidade.NEGOCIACAO:
        return 'bg-orange-100 text-orange-800';
      case EstagioOportunidade.PROPOSTA:
        return 'bg-blue-100 text-blue-800';
      case EstagioOportunidade.QUALIFICACAO:
        return 'bg-purple-100 text-purple-800';
      case EstagioOportunidade.LEADS:
        return 'bg-gray-100 text-gray-800';
      case EstagioOportunidade.FECHAMENTO:
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen || !oportunidade) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        <div className="inline-block w-[calc(100%-2rem)] sm:w-[700px] md:w-[800px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] px-6 py-4 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">Detalhes da Oportunidade</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                >
                  <EditIcon className="w-4 h-4 mr-1" />
                  Editar
                </button>
              )}
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <TargetIcon className="w-5 h-5 mr-2" />
                Informações Básicas
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título da Oportunidade
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={formData.titulo}
                        onChange={(e) => handleInputChange('titulo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.titulo && (
                        <p className="text-sm text-red-600 mt-1">{errors.titulo}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">{oportunidade.titulo}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  {isEditing ? (
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => handleInputChange('descricao', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{oportunidade.descricao || 'Não informado'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Informações de Venda */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <DollarSignIcon className="w-5 h-5 mr-2" />
                Informações de Venda
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Esperado
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="number"
                        value={formData.valor}
                        onChange={(e) => handleInputChange('valor', Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.valor && <p className="text-sm text-red-600 mt-1">{errors.valor}</p>}
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-green-600">
                      {oportunidade.valorFormatado}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estágio</label>
                  {isEditing ? (
                    <select
                      value={formData.estagio}
                      onChange={(e) => handleInputChange('estagio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {estagiosOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstagioColor(oportunidade.estagio)}`}
                    >
                      {estagiosOptions.find((e) => e.value === oportunidade.estagio)?.label ||
                        oportunidade.estagio}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Probabilidade
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="number"
                        value={formData.probabilidade}
                        onChange={(e) => handleInputChange('probabilidade', Number(e.target.value))}
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.probabilidade && (
                        <p className="text-sm text-red-600 mt-1">{errors.probabilidade}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${oportunidade.probabilidade}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{oportunidade.probabilidade}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                  {isEditing ? (
                    <select
                      value={formData.prioridade}
                      onChange={(e) => handleInputChange('prioridade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {prioridadeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadeColor(oportunidade.prioridade)}`}
                    >
                      {prioridadeOptions.find((p) => p.value === oportunidade.prioridade)?.label ||
                        oportunidade.prioridade}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Fechamento Esperada
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={
                        formData.dataFechamentoEsperado
                          ? typeof formData.dataFechamentoEsperado === 'string'
                            ? formData.dataFechamentoEsperado
                            : new Date(formData.dataFechamentoEsperado).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => handleInputChange('dataFechamentoEsperado', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {oportunidade.dataFechamentoEsperado
                        ? new Date(oportunidade.dataFechamentoEsperado).toLocaleDateString('pt-BR')
                        : 'Não informado'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Informações de Contato
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Contato
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={formData.nomeContato}
                        onChange={(e) => handleInputChange('nomeContato', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.nomeContato && (
                        <p className="text-sm text-red-600 mt-1">{errors.nomeContato}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">{oportunidade.nomeContato || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email do Contato
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="email"
                        value={formData.emailContato}
                        onChange={(e) => handleInputChange('emailContato', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {errors.emailContato && (
                        <p className="text-sm text-red-600 mt-1">{errors.emailContato}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">{oportunidade.emailContato || 'Não informado'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.telefoneContato}
                      onChange={(e) => handleInputChange('telefoneContato', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {oportunidade.telefoneContato || 'Não informado'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.empresaContato}
                      onChange={(e) => handleInputChange('empresaContato', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {oportunidade.empresaContato || 'Não informado'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <BuildingIcon className="w-5 h-5 mr-2" />
                Informações Adicionais
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
                  {isEditing ? (
                    <select
                      value={formData.origem}
                      onChange={(e) =>
                        handleInputChange('origem', e.target.value as OrigemOportunidade)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {origemOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">
                      {oportunidade.origem
                        ? origemOptions.find((option) => option.value === oportunidade.origem)
                            ?.label || oportunidade.origem
                        : 'Não informado'}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">{oportunidade.observacoes || 'Não informado'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Informações do Sistema */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Informações do Sistema</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Responsável:</span>
                  <p className="font-medium">{oportunidade.responsavel.nome}</p>
                </div>
                <div>
                  <span className="text-gray-500">Criado em:</span>
                  <p className="font-medium">
                    {oportunidade.criadoEm
                      ? new Date(oportunidade.criadoEm).toLocaleDateString('pt-BR')
                      : 'Não informado'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Atualizado em:</span>
                  <p className="font-medium">
                    {oportunidade.atualizadoEm
                      ? new Date(oportunidade.atualizadoEm).toLocaleDateString('pt-BR')
                      : 'Não informado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <SaveIcon className="w-4 h-4 mr-1" />
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
