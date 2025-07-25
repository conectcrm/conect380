import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  User,
  Globe,
  Tag,
  FileText,
  Star,
  Calendar,
  Plus,
  Trash2
} from 'lucide-react';
import { Contato } from '../../features/contatos/services/contatosService';

interface ModalNovoContatoProps {
  contato?: Contato | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contato: Partial<Contato>) => void;
}

export const ModalNovoContato: React.FC<ModalNovoContatoProps> = ({
  contato,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Contato>>({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    cargo: '',
    status: 'prospecto',
    tipo: 'lead',
    fonte: '',
    proprietario: 'Maria Santos',
    data_nascimento: '',
    endereco: {
      rua: '',
      cidade: '',
      estado: '',
      cep: '',
      pais: 'Brasil'
    },
    redes_sociais: {
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: ''
    },
    tags: [],
    pontuacao_lead: 0,
    valor_potencial: 0,
    notas: '',
    categoria: 'Geral'
  });

  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contato) {
      setFormData({
        ...contato,
        endereco: contato.endereco || {
          rua: '',
          cidade: '',
          estado: '',
          cep: '',
          pais: 'Brasil'
        },
        redes_sociais: contato.redes_sociais || {
          linkedin: '',
          twitter: '',
          facebook: '',
          instagram: ''
        }
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        empresa: '',
        cargo: '',
        status: 'prospecto',
        tipo: 'lead',
        fonte: '',
        proprietario: 'Maria Santos',
        data_nascimento: '',
        endereco: {
          rua: '',
          cidade: '',
          estado: '',
          cep: '',
          pais: 'Brasil'
        },
        redes_sociais: {
          linkedin: '',
          twitter: '',
          facebook: '',
          instagram: ''
        },
        tags: [],
        pontuacao_lead: 0,
        valor_potencial: 0,
        notas: '',
        categoria: 'Geral'
      });
    }
    setErrors({});
  }, [contato, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome?.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.telefone?.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    if (!formData.empresa?.trim()) {
      newErrors.empresa = 'Empresa é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro quando o campo for preenchido
    if (errors[field] && value?.toString().trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleEnderecoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      endereco: {
        ...prev.endereco,
        [field]: value
      }
    }));
  };

  const handleRedesSociaisChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      redes_sociais: {
        ...prev.redes_sociais,
        [platform]: value
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  if (!isOpen) return null;

  const isEditing = !!contato;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#0d7a7d]">
          <h1 className="text-2xl font-bold text-white">
            {isEditing ? 'Editar Contato' : 'Novo Contato'}
          </h1>
          
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Coluna Esquerda */}
              <div className="space-y-6">
                
                {/* Informações Básicas */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Informações Básicas
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome *
                      </label>
                      <input
                        type="text"
                        value={formData.nome || ''}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                          errors.nome ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Nome completo"
                      />
                      {errors.nome && <p className="text-red-500 text-sm mt-1">{errors.nome}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="email@exemplo.com"
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefone *
                        </label>
                        <input
                          type="tel"
                          value={formData.telefone || ''}
                          onChange={(e) => handleInputChange('telefone', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                            errors.telefone ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="(11) 99999-9999"
                        />
                        {errors.telefone && <p className="text-red-500 text-sm mt-1">{errors.telefone}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Empresa *
                        </label>
                        <input
                          type="text"
                          value={formData.empresa || ''}
                          onChange={(e) => handleInputChange('empresa', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent ${
                            errors.empresa ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Nome da empresa"
                        />
                        {errors.empresa && <p className="text-red-500 text-sm mt-1">{errors.empresa}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cargo
                        </label>
                        <input
                          type="text"
                          value={formData.cargo || ''}
                          onChange={(e) => handleInputChange('cargo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Cargo na empresa"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={formData.data_nascimento || ''}
                        onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Classificação */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Classificação
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status || 'prospecto'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      >
                        <option value="prospecto">Prospecto</option>
                        <option value="ativo">Ativo</option>
                        <option value="cliente">Cliente</option>
                        <option value="inativo">Inativo</option>
                        <option value="ex-cliente">Ex-Cliente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={formData.tipo || 'lead'}
                        onChange={(e) => handleInputChange('tipo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      >
                        <option value="lead">Lead</option>
                        <option value="cliente">Cliente</option>
                        <option value="parceiro">Parceiro</option>
                        <option value="fornecedor">Fornecedor</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fonte
                      </label>
                      <select
                        value={formData.fonte || ''}
                        onChange={(e) => handleInputChange('fonte', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      >
                        <option value="">Selecione uma fonte</option>
                        <option value="Website">Website</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Google Ads">Google Ads</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Indicação">Indicação</option>
                        <option value="Feira/Evento">Feira/Evento</option>
                        <option value="Networking">Networking</option>
                        <option value="Telemarketing">Telemarketing</option>
                        <option value="Email Marketing">Email Marketing</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proprietário
                      </label>
                      <select
                        value={formData.proprietario || 'Maria Santos'}
                        onChange={(e) => handleInputChange('proprietario', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      >
                        <option value="Maria Santos">Maria Santos</option>
                        <option value="Pedro Costa">Pedro Costa</option>
                        <option value="Ana Silva">Ana Silva</option>
                        <option value="Lucas Oliveira">Lucas Oliveira</option>
                        <option value="Carla Santos">Carla Santos</option>
                        <option value="Roberto Lima">Roberto Lima</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <input
                        type="text"
                        value={formData.categoria || ''}
                        onChange={(e) => handleInputChange('categoria', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="Ex: Tecnologia, Saúde, Educação"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pontuação Lead (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.pontuacao_lead || 0}
                        onChange={(e) => handleInputChange('pontuacao_lead', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Potencial (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.valor_potencial || 0}
                        onChange={(e) => handleInputChange('valor_potencial', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="space-y-6">
                
                {/* Endereço */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endereço
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rua
                      </label>
                      <input
                        type="text"
                        value={formData.endereco?.rua || ''}
                        onChange={(e) => handleEnderecoChange('rua', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="Rua, número, complemento"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cidade
                        </label>
                        <input
                          type="text"
                          value={formData.endereco?.cidade || ''}
                          onChange={(e) => handleEnderecoChange('cidade', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Cidade"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Estado
                        </label>
                        <input
                          type="text"
                          value={formData.endereco?.estado || ''}
                          onChange={(e) => handleEnderecoChange('estado', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="Estado"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CEP
                        </label>
                        <input
                          type="text"
                          value={formData.endereco?.cep || ''}
                          onChange={(e) => handleEnderecoChange('cep', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="00000-000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          País
                        </label>
                        <input
                          type="text"
                          value={formData.endereco?.pais || 'Brasil'}
                          onChange={(e) => handleEnderecoChange('pais', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                          placeholder="País"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Redes Sociais */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Redes Sociais
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={formData.redes_sociais?.linkedin || ''}
                        onChange={(e) => handleRedesSociaisChange('linkedin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="https://linkedin.com/in/usuario"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Twitter
                      </label>
                      <input
                        type="url"
                        value={formData.redes_sociais?.twitter || ''}
                        onChange={(e) => handleRedesSociaisChange('twitter', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="https://twitter.com/usuario"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={formData.redes_sociais?.facebook || ''}
                        onChange={(e) => handleRedesSociaisChange('facebook', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="https://facebook.com/usuario"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={formData.redes_sociais?.instagram || ''}
                        onChange={(e) => handleRedesSociaisChange('instagram', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="https://instagram.com/usuario"
                      />
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Tags
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                        placeholder="Digite uma tag"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7d] transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar
                      </button>
                    </div>

                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:bg-gray-300 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notas */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#002333] mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Notas
                  </h3>
                  
                  <textarea
                    value={formData.notas || ''}
                    onChange={(e) => handleInputChange('notas', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none"
                    placeholder="Adicione observações sobre este contato..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0d7a7d] transition-colors"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Atualizar Contato' : 'Criar Contato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
