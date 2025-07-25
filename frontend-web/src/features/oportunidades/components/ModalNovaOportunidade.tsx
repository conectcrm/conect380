import React, { useState } from 'react';
import { NovaOportunidade, EstagioOportunidade, PrioridadeOportunidade, OrigemOportunidade } from '../../../types/oportunidades/index';
import { User, DollarSign, Target, Building, X } from 'lucide-react';
import { useOportunidades } from '../hooks/useOportunidades';

interface ModalNovaOportunidadeProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalNovaOportunidade: React.FC<ModalNovaOportunidadeProps> = ({ isOpen, onClose }) => {
  const { criarOportunidade } = useOportunidades();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<NovaOportunidade>({
    titulo: '',
    descricao: '',
    valor: 0,
    probabilidade: 50,
    estagio: EstagioOportunidade.LEADS,
    prioridade: PrioridadeOportunidade.MEDIA,
    origem: OrigemOportunidade.WEBSITE,
    tags: [],
    dataFechamentoEsperado: undefined,
    responsavelId: '',
    clienteId: undefined,
    nomeContato: '',
    emailContato: '',
    telefoneContato: '',
    empresaContato: ''
  });

  const formatMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const parseMoeda = (valor: string): number => {
    return parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  };

  const handleInputChange = (field: keyof NovaOportunidade, value: string | number | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseMoeda(rawValue);
    handleInputChange('valor', numericValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await criarOportunidade(formData);
      onClose();
      // Reset form
      setFormData({
        titulo: '',
        descricao: '',
        valor: 0,
        probabilidade: 50,
        estagio: EstagioOportunidade.LEADS,
        prioridade: PrioridadeOportunidade.MEDIA,
        origem: OrigemOportunidade.WEBSITE,
        tags: [],
        dataFechamentoEsperado: undefined,
        responsavelId: '',
        clienteId: undefined,
        nomeContato: '',
        emailContato: '',
        telefoneContato: '',
        empresaContato: ''
      });
    } catch (error) {
      console.error('Erro ao criar oportunidade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Nova Oportunidade</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Informações da Oportunidade
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Implementação de CRM para empresa X"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Estimado *
                </label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formatMoeda(formData.valor)}
                    onChange={handleValorChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fechamento Prevista
                </label>
                <input
                  type="date"
                  value={formData.dataFechamentoEsperado ? new Date(formData.dataFechamentoEsperado).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleInputChange('dataFechamentoEsperado', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estágio
                </label>
                <select
                  value={formData.estagio}
                  onChange={(e) => handleInputChange('estagio', e.target.value as EstagioOportunidade)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={EstagioOportunidade.LEADS}>Leads</option>
                  <option value={EstagioOportunidade.QUALIFICACAO}>Qualificação</option>
                  <option value={EstagioOportunidade.PROPOSTA}>Proposta</option>
                  <option value={EstagioOportunidade.NEGOCIACAO}>Negociação</option>
                  <option value={EstagioOportunidade.FECHAMENTO}>Fechamento</option>
                  <option value={EstagioOportunidade.GANHO}>Ganho</option>
                  <option value={EstagioOportunidade.PERDIDO}>Perdido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={formData.prioridade}
                  onChange={(e) => handleInputChange('prioridade', e.target.value as PrioridadeOportunidade)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={PrioridadeOportunidade.BAIXA}>Baixa</option>
                  <option value={PrioridadeOportunidade.MEDIA}>Média</option>
                  <option value={PrioridadeOportunidade.ALTA}>Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Probabilidade (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probabilidade}
                  onChange={(e) => handleInputChange('probabilidade', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Probabilidade de fechamento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Origem
                </label>
                <select
                  value={formData.origem}
                  onChange={(e) => handleInputChange('origem', e.target.value as OrigemOportunidade)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={OrigemOportunidade.WEBSITE}>Website</option>
                  <option value={OrigemOportunidade.INDICACAO}>Indicação</option>
                  <option value={OrigemOportunidade.TELEFONE}>Telefone</option>
                  <option value={OrigemOportunidade.EMAIL}>Email</option>
                  <option value={OrigemOportunidade.REDES_SOCIAIS}>Redes Sociais</option>
                  <option value={OrigemOportunidade.EVENTO}>Evento</option>
                  <option value={OrigemOportunidade.PARCEIRO}>Parceiro</option>
                  <option value={OrigemOportunidade.CAMPANHA}>Campanha</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => handleInputChange('descricao', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descreva os detalhes da oportunidade..."
              />
            </div>
          </div>

          {/* Informações do Cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Informações do Cliente
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Contato *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomeContato}
                  onChange={(e) => handleInputChange('nomeContato', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do contato principal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa
                </label>
                <div className="relative">
                  <Building className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.empresaContato}
                    onChange={(e) => handleInputChange('empresaContato', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.emailContato}
                  onChange={(e) => handleInputChange('emailContato', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.telefoneContato}
                  onChange={(e) => handleInputChange('telefoneContato', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsável
                </label>
                <input
                  type="text"
                  value={formData.responsavelId}
                  onChange={(e) => handleInputChange('responsavelId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição da oportunidade..."
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Criando...' : 'Criar Oportunidade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
