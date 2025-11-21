import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Building, User, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Cliente {
  id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  tipoPessoa: 'fisica' | 'juridica';
}

interface ClienteFormData {
  nome: string;
  email: string;
  telefone: string;
  tipoPessoa: 'fisica' | 'juridica';
  documento: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
}

interface ModalNovoClienteProps {
  isOpen: boolean;
  onClose: () => void;
  onClienteCriado: (cliente: Cliente) => void;
  isLoading?: boolean;
}

const clienteSchema = yup.object({
  nome: yup.string().required('Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  telefone: yup.string().required('Telefone é obrigatório'),
  tipoPessoa: yup.string().oneOf(['fisica', 'juridica']).required('Tipo é obrigatório'),
  documento: yup.string().required('Documento é obrigatório'),
  endereco: yup.string(),
  cidade: yup.string(),
  estado: yup.string(),
  cep: yup.string(),
  observacoes: yup.string().max(500, 'Observações não podem ter mais de 500 caracteres')
});

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const ModalNovoCliente: React.FC<ModalNovoClienteProps> = ({
  isOpen,
  onClose,
  onClienteCriado,
  isLoading = false
}) => {
  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<ClienteFormData>({
    resolver: yupResolver(clienteSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      tipoPessoa: 'fisica',
      documento: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      observacoes: ''
    }
  });

  const tipoPessoa = watch('tipoPessoa');

  const onSubmit = async (data: ClienteFormData) => {
    try {
      const novoCliente: Cliente = {
        id: `cliente_${Date.now()}`,
        nome: data.nome,
        documento: data.documento,
        email: data.email,
        telefone: data.telefone,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        tipoPessoa: data.tipoPessoa
      };

      onClienteCriado(novoCliente);
      reset();
      onClose();

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente. Tente novamente.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[500px] md:w-[600px] lg:w-[700px] max-w-[800px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Novo Cliente</h2>
              <p className="text-sm text-gray-600">Adicione um novo cliente à proposta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Tipo de Pessoa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Pessoa
            </label>
            <div className="flex space-x-4">
              <Controller
                name="tipoPessoa"
                control={control}
                render={({ field }) => (
                  <>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value="fisica"
                        checked={field.value === 'fisica'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Pessoa Física</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value="juridica"
                        checked={field.value === 'juridica'}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <Building className="h-4 w-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Pessoa Jurídica</span>
                    </label>
                  </>
                )}
              />
            </div>
          </div>

          {/* Grid de campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Nome */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tipoPessoa === 'fisica' ? 'Nome Completo' : 'Razão Social'} *
              </label>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={tipoPessoa === 'fisica' ? 'Digite o nome completo' : 'Digite a razão social'}
                  />
                )}
              />
              {errors.nome && (
                <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
              )}
            </div>

            {/* Documento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'} *
              </label>
              <Controller
                name="documento"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={tipoPessoa === 'fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                  />
                )}
              />
              {errors.documento && (
                <p className="text-red-500 text-sm mt-1">{errors.documento.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...field}
                      type="email"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone *
              </label>
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...field}
                      type="tel"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                )}
              />
              {errors.telefone && (
                <p className="text-red-500 text-sm mt-1">{errors.telefone.message}</p>
              )}
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <Controller
                name="endereco"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...field}
                      type="text"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                )}
              />
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <Controller
                name="cidade"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome da cidade"
                  />
                )}
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione o estado</option>
                    {estados.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* CEP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <Controller
                name="cep"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="00000-000"
                  />
                )}
              />
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <Controller
                name="observacoes"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Informações adicionais sobre o cliente..."
                  />
                )}
              />
              {errors.observacoes && (
                <p className="text-red-500 text-sm mt-1">{errors.observacoes.message}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Criando...' : 'Criar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
