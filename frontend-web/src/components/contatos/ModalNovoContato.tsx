import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Mail,
  Phone,
  Building,
  User,
  FileText,
  Star,
  AlertCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ClienteSelect, { ClienteSelectValue } from '../selects/ClienteSelect';
import { contatosService, Contato, CreateContatoDto, UpdateContatoDto } from '../../services/contatosService';

interface ModalNovoContatoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contato?: Contato;
  clienteId?: string;
}

interface FormErrors {
  nome?: string;
  telefone?: string;
  email?: string;
  clienteId?: string;
}

const ModalNovoContato: React.FC<ModalNovoContatoProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contato,
  clienteId: clienteIdProp
}) => {
  const [loading, setLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteSelectValue | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    principal: false,
    observacoes: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const sanitizeTelefoneInput = (value: string): string => {
    if (!value) {
      return '';
    }

    let sanitized = value.replace(/[^0-9+\s()-]/g, '');

    // Permite apenas um sinal de + e sempre na primeira posição
    if (sanitized.includes('+')) {
      const semMais = sanitized.replace(/\+/g, '');
      sanitized = semMais ? `+${semMais}` : '+';
    }

    return sanitized;
  };

  useEffect(() => {
    if (contato) {
      setFormData({
        nome: contato.nome || '',
        email: contato.email || '',
        telefone: contato.telefone || '',
        cargo: contato.cargo || '',
        principal: contato.principal || false,
        observacoes: contato.observacoes || ''
      });
      if (contato.cliente) {
        setClienteSelecionado({
          id: contato.cliente.id,
          nome: contato.cliente.nome,
          documento: contato.cliente.documento,
          email: contato.cliente.email,
          telefone: contato.cliente.telefone,
          tipo: contato.cliente.tipo,
        });
      }
    } else {
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        cargo: '',
        principal: false,
        observacoes: ''
      });
      setClienteSelecionado(null);
    }
  }, [contato]);

  const handleClienteSelecionado = (cliente: ClienteSelectValue | null) => {
    setClienteSelecionado(cliente);
    if (errors.clienteId) {
      setErrors(prev => ({ ...prev, clienteId: undefined }));
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeTelefoneInput(e.target.value);
    setFormData(prev => ({ ...prev, telefone: value }));

    if (errors.telefone) {
      setErrors(prev => ({ ...prev, telefone: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!clienteSelecionado && !contato) {
      newErrors.clienteId = 'Selecione um cliente';
    }

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    const telefoneNormalizado = contatosService.normalizarTelefone(formData.telefone);
    const telefoneDigitos = telefoneNormalizado.replace(/\D/g, '');

    if (!telefoneNormalizado) {
      newErrors.telefone = 'Telefone é obrigatório';
    } else if (telefoneDigitos.length < 8 || telefoneDigitos.length > 15) {
      newErrors.telefone = 'Telefone deve estar no formato internacional (E.164)';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      const telefoneNormalizado = contatosService.normalizarTelefone(formData.telefone);

      if (contato) {
        const updateData: UpdateContatoDto = {
          nome: formData.nome,
          email: formData.email || undefined,
          telefone: telefoneNormalizado,
          cargo: formData.cargo || undefined,
          principal: formData.principal,
          observacoes: formData.observacoes || undefined
        };

        await contatosService.atualizar(contato.id, updateData);
        toast.success('Contato atualizado com sucesso!');
      } else {
        const clienteId = clienteSelecionado?.id || clienteIdProp;
        if (!clienteId) {
          toast.error('Cliente não selecionado');
          return;
        }

        const createData: CreateContatoDto = {
          nome: formData.nome,
          email: formData.email || undefined,
          telefone: telefoneNormalizado,
          cargo: formData.cargo || undefined,
          principal: formData.principal,
          observacoes: formData.observacoes || undefined
        };

        await contatosService.criar(clienteId, createData);
        toast.success('Contato criado com sucesso!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar contato');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-[#159A9C] to-[#0d7a7d] text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="w-5 h-5" />
            {contato ? 'Editar Contato' : 'Novo Contato'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-5">
            {!contato && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cliente *
                </label>
                <ClienteSelect
                  value={clienteSelecionado}
                  onChange={handleClienteSelecionado}
                  label={null}
                  error={errors.clienteId}
                  disabled={!!clienteIdProp}
                />
                {errors.clienteId && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.clienteId}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border ${errors.nome ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent`}
                  placeholder="Digite o nome completo"
                  disabled={loading}
                />
              </div>
              {errors.nome && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.nome}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Telefone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleTelefoneChange}
                  className={`w-full pl-10 pr-4 py-2.5 border ${errors.telefone ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent`}
                  placeholder="+55 11 99999-9999"
                  disabled={loading}
                  autoComplete="tel"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Informe o número completo com DDI (formato E.164). Ex: +44 20 7946 0958. Caso não inclua o DDI, será assumido o código +55.
              </p>
              {errors.telefone && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.telefone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent`}
                  placeholder="email@exemplo.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cargo
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="cargo"
                  value={formData.cargo}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  placeholder="Ex: Gerente de Compras"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                id="principal"
                name="principal"
                checked={formData.principal}
                onChange={handleChange}
                className="w-4 h-4 text-[#159A9C] border-gray-300 rounded focus:ring-[#159A9C]"
                disabled={loading}
              />
              <label htmlFor="principal" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <Star className="w-4 h-4 text-yellow-500" />
                Definir como contato principal
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Observações
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none"
                  placeholder="Adicione observações sobre este contato..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </form>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-[#159A9C] to-[#0d7a7d] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {contato ? 'Salvar Alterações' : 'Criar Contato'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalNovoContato;
