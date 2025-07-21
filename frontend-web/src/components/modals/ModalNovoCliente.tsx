import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { X, Building, User, Mail, Phone, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClienteFormData {
  nome: string;
  email: string;
  telefone?: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
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
  onClienteCriado: (cliente: any) => void;
  isLoading?: boolean;
}

const clienteSchema = yup.object({
  nome: yup.string().required('Nome é obrigatório').min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: yup.string().email('Email inválido').required('Email é obrigatório'),
  telefone: yup.string(),
  tipo: yup.string().oneOf(['pessoa_fisica', 'pessoa_juridica']).required('Tipo é obrigatório'),
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
  const { control, handleSubmit, watch, reset, formState: { errors, isValid } } = useForm<ClienteFormData>({
    resolver: yupResolver(clienteSchema),
    defaultValues: {
      tipo: 'pessoa_juridica'
    }
  });

  const tipoSelecionado = watch('tipo');

  const onSubmit = async (data: ClienteFormData) => {
    try {
      // Simular criação do cliente (aqui implementaríamos a chamada à API)
      const novoCliente = {
        id: Date.now().toString(),
        ...data,
        status: 'prospect' as const
      };

      // Aqui faria a chamada para a API
      // const cliente = await clientesService.create(data);
      
      toast.success(`Cliente ${data.nome} criado com sucesso!`);
      onClienteCriado(novoCliente);
      reset();
      onClose();
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <User className="w-6 h-6 text-[#159A9C] mr-2" />
              <h3 className="text-xl font-semibold text-gray-900">Novo Cliente</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Tipo de Pessoa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cliente *
              </label>
              <Controller
                name="tipo"
                control={control}
                render={({ field }) => (
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        {...field}
                        type="radio"
                        value="pessoa_fisica"
                        checked={field.value === 'pessoa_fisica'}
                        className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pessoa Física</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        {...field}
                        type="radio"
                        value="pessoa_juridica"
                        checked={field.value === 'pessoa_juridica'}
                        className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pessoa Jurídica</span>
                    </label>
                  </div>
                )}
              />
              {errors.tipo && (
                <p className="text-sm text-red-600 mt-1">{errors.tipo.message}</p>
              )}
            </div>

            {/* Grid de campos principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tipoSelecionado === 'pessoa_fisica' ? 'Nome Completo' : 'Razão Social'} *
                </label>
                <Controller
                  name="nome"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        {...field}
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                        placeholder={tipoSelecionado === 'pessoa_fisica' ? 'João Silva' : 'Empresa XYZ Ltda'}
                      />
                    </div>
                  )}
                />
                {errors.nome && (
                  <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>
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
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        {...field}
                        type="email"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  )}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <Controller
                  name="telefone"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        {...field}
                        type="tel"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  )}
                />
              </div>

              {/* Documento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {tipoSelecionado === 'pessoa_fisica' ? 'CPF' : 'CNPJ'} *
                </label>
                <Controller
                  name="documento"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        {...field}
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                        placeholder={tipoSelecionado === 'pessoa_fisica' ? '000.000.000-00' : '00.000.000/0000-00'}
                      />
                    </div>
                  )}
                />
                {errors.documento && (
                  <p className="text-sm text-red-600 mt-1">{errors.documento.message}</p>
                )}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                      placeholder="00000-000"
                    />
                  )}
                />
              </div>

              {/* Endereço */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <Controller
                  name="endereco"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        {...field}
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                        placeholder="Rua, Avenida, etc."
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                      placeholder="Cidade"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                    >
                      <option value="">Selecionar</option>
                      {estados.map(estado => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] resize-none"
                      placeholder="Informações adicionais sobre o cliente..."
                    />
                  )}
                />
                {errors.observacoes && (
                  <p className="text-sm text-red-600 mt-1">{errors.observacoes.message}</p>
                )}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isValid || isLoading}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#159A9C] hover:bg-[#0d7a7d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#159A9C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Salvando...' : 'Criar Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
