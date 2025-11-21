import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FieldPath, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { empresaService, RegistrarEmpresaPayload } from '../../services/empresaService';
import {
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Check,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

// Validação do formulário
const registroSchema = yup.object({
  // Dados da Empresa
  empresa: yup.object({
    nome: yup.string().required('Nome da empresa é obrigatório'),
    cnpj: yup.string()
      .required('CNPJ é obrigatório')
      .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve ter formato XX.XXX.XXX/XXXX-XX'),
    email: yup.string().email('Email inválido').required('Email da empresa é obrigatório'),
    telefone: yup.string().required('Telefone é obrigatório'),
    endereco: yup.string().required('Endereço é obrigatório'),
    cidade: yup.string().required('Cidade é obrigatória'),
    estado: yup.string().required('Estado é obrigatório'),
    cep: yup.string()
      .required('CEP é obrigatório')
      .matches(/^\d{5}-\d{3}$/, 'CEP deve ter formato XXXXX-XXX'),
  }),
  // Dados do Usuário Administrador
  usuario: yup.object({
    nome: yup.string().required('Nome do administrador é obrigatório'),
    email: yup.string().email('Email inválido').required('Email é obrigatório'),
    senha: yup.string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .required('Senha é obrigatória'),
    confirmarSenha: yup.string()
      .oneOf([yup.ref('senha')], 'Senhas não conferem')
      .required('Confirmação de senha é obrigatória'),
    telefone: yup.string().required('Telefone do administrador é obrigatório'),
  }),
  // Plano Selecionado
  plano: yup.string().required('Selecione um plano'),
  // Termos
  aceitarTermos: yup.boolean().oneOf([true], 'Você deve aceitar os termos de uso'),
});

interface RegistroFormData {
  empresa: {
    nome: string;
    cnpj: string;
    email: string;
    telefone: string;
    endereco: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  usuario: {
    nome: string;
    email: string;
    senha: string;
    confirmarSenha: string;
    telefone: string;
  };
  plano: string;
  aceitarTermos: boolean;
}

// Planos disponíveis
const PLANOS = [
  {
    id: 'starter',
    nome: 'Starter',
    preco: 99,
    descricao: 'Ideal para pequenas empresas',
    recursos: [
      'Até 3 usuários',
      'Até 1.000 clientes',
      'Módulos básicos',
      '5GB de armazenamento',
      'Suporte por email'
    ],
    popular: false
  },
  {
    id: 'professional',
    nome: 'Professional',
    preco: 299,
    descricao: 'Para empresas em crescimento',
    recursos: [
      'Até 10 usuários',
      'Até 10.000 clientes',
      'Todos os módulos',
      '50GB de armazenamento',
      'White label básico',
      'Suporte prioritário'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 899,
    descricao: 'Para grandes operações',
    recursos: [
      'Usuários ilimitados',
      'Clientes ilimitados',
      'API completa',
      '500GB de armazenamento',
      'White label completo',
      'Suporte dedicado'
    ],
    popular: false
  }
];

export const RegistroEmpresaPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors }
  } = useForm<RegistroFormData>({
    resolver: yupResolver(registroSchema),
    defaultValues: {
      plano: 'professional' // Plano padrão
    }
  });

  const watchedPlano = watch('plano');

  // Função para buscar CEP
  const buscarCep = async (cep: string) => {
    if (cep.replace(/\D/g, '').length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setValue('empresa.endereco', `${data.logradouro}, ${data.bairro}`);
          setValue('empresa.cidade', data.localidade);
          setValue('empresa.estado', data.uf);
        }
      } catch (error) {
        console.log('Erro ao buscar CEP:', error);
      }
    }
  };

  // Função para formatar CNPJ
  const formatarCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  // Função para formatar CEP
  const formatarCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  // Função para formatar telefone
  const formatarTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const onSubmit = async (data: RegistroFormData) => {
    setIsSubmitting(true);

    try {
      const payload: RegistrarEmpresaPayload = {
        empresa: {
          nome: data.empresa.nome,
          cnpj: data.empresa.cnpj,
          email: data.empresa.email,
          telefone: data.empresa.telefone,
          endereco: data.empresa.endereco,
          cidade: data.empresa.cidade,
          estado: data.empresa.estado,
          cep: data.empresa.cep,
        },
        usuario: {
          nome: data.usuario.nome,
          email: data.usuario.email,
          senha: data.usuario.senha,
          telefone: data.usuario.telefone,
        },
        plano: data.plano,
        aceitarTermos: data.aceitarTermos,
      };

      const response = await empresaService.registrarEmpresa(payload);

      toast.success(response.message || 'Empresa registrada com sucesso! 🎉');
      toast.success('Verifique seu email para ativar a conta.');

      navigate('/login', {
        state: {
          message: 'Conta criada com sucesso! Faça login para continuar.',
          email: data.usuario.email,
        }
      });

    } catch (error: unknown) {
      console.error('Erro no registro:', error);
      const message = error instanceof Error
        ? error.message
        : 'Erro ao registrar empresa. Tente novamente.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building className="w-16 h-16 mx-auto text-[#159A9C] mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Dados da Empresa</h2>
        <p className="text-gray-600 mt-2">Vamos começar com as informações da sua empresa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Empresa *
          </label>
          <input
            {...register('empresa.nome')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Digite o nome da empresa"
          />
          {errors.empresa?.nome && (
            <p className="text-red-500 text-sm mt-1">{errors.empresa.nome.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CNPJ *
          </label>
          <input
            {...register('empresa.cnpj')}
            onChange={(e) => setValue('empresa.cnpj', formatarCNPJ(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="XX.XXX.XXX/XXXX-XX"
            maxLength={18}
          />
          {errors.empresa?.cnpj && (
            <p className="text-red-500 text-sm mt-1">{errors.empresa.cnpj.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Corporativo *
          </label>
          <input
            {...register('empresa.email')}
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="contato@empresa.com"
          />
          {errors.empresa?.email && (
            <p className="text-red-500 text-sm mt-1">{errors.empresa.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone *
          </label>
          <input
            {...register('empresa.telefone')}
            onChange={(e) => setValue('empresa.telefone', formatarTelefone(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
          {errors.empresa?.telefone && (
            <p className="text-red-500 text-sm mt-1">{errors.empresa.telefone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP *
          </label>
          <input
            {...register('empresa.cep')}
            onChange={(e) => {
              const formatted = formatarCEP(e.target.value);
              setValue('empresa.cep', formatted);
              if (formatted.length === 9) {
                buscarCep(formatted);
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="XXXXX-XXX"
            maxLength={9}
          />
          {errors.empresa?.cep && (
            <p className="text-red-500 text-sm mt-1">{errors.empresa.cep.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Endereço *
          </label>
          <input
            {...register('empresa.endereco')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Rua, número, bairro"
          />
          {errors.empresa?.endereco && (
            <p className="text-red-500 text-sm mt-1">{errors.empresa.endereco.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cidade *
          </label>
          <input
            {...register('empresa.cidade')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Nome da cidade"
          />
          {errors.empresa?.cidade && (
            <p className="text-red-500 text-sm mt-1">{errors.empresa.cidade.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado *
          </label>
          <select
            {...register('empresa.estado')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
          >
            <option value="">Selecione o estado</option>
            <option value="AC">Acre</option>
            <option value="AL">Alagoas</option>
            <option value="AP">Amapá</option>
            <option value="AM">Amazonas</option>
            <option value="BA">Bahia</option>
            <option value="CE">Ceará</option>
            <option value="DF">Distrito Federal</option>
            <option value="ES">Espírito Santo</option>
            <option value="GO">Goiás</option>
            <option value="MA">Maranhão</option>
            <option value="MT">Mato Grosso</option>
            <option value="MS">Mato Grosso do Sul</option>
            <option value="MG">Minas Gerais</option>
            <option value="PA">Pará</option>
            <option value="PB">Paraíba</option>
            <option value="PR">Paraná</option>
            <option value="PE">Pernambuco</option>
            <option value="PI">Piauí</option>
            <option value="RJ">Rio de Janeiro</option>
            <option value="RN">Rio Grande do Norte</option>
            <option value="RS">Rio Grande do Sul</option>
            <option value="RO">Rondônia</option>
            <option value="RR">Roraima</option>
            <option value="SC">Santa Catarina</option>
            <option value="SP">São Paulo</option>
            <option value="SE">Sergipe</option>
            <option value="TO">Tocantins</option>
          </select>
          {errors.empresa?.estado && (
            <p className="text-red-500 text-sm mt-1">{errors.empresa.estado.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="w-16 h-16 mx-auto text-[#159A9C] mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Administrador da Conta</h2>
        <p className="text-gray-600 mt-2">Criar o primeiro usuário administrador</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo *
          </label>
          <input
            {...register('usuario.nome')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="Digite seu nome completo"
          />
          {errors.usuario?.nome && (
            <p className="text-red-500 text-sm mt-1">{errors.usuario.nome.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            {...register('usuario.email')}
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="seu@email.com"
          />
          {errors.usuario?.email && (
            <p className="text-red-500 text-sm mt-1">{errors.usuario.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone *
          </label>
          <input
            {...register('usuario.telefone')}
            onChange={(e) => setValue('usuario.telefone', formatarTelefone(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
          {errors.usuario?.telefone && (
            <p className="text-red-500 text-sm mt-1">{errors.usuario.telefone.message}</p>
          )}
        </div>

        <div></div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Senha *
          </label>
          <div className="relative">
            <input
              {...register('usuario.senha')}
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.usuario?.senha && (
            <p className="text-red-500 text-sm mt-1">{errors.usuario.senha.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Senha *
          </label>
          <div className="relative">
            <input
              {...register('usuario.confirmarSenha')}
              type={showConfirmPassword ? 'text' : 'password'}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
              placeholder="Confirme sua senha"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.usuario?.confirmarSenha && (
            <p className="text-red-500 text-sm mt-1">{errors.usuario.confirmarSenha.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CreditCard className="w-16 h-16 mx-auto text-[#159A9C] mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Escolha seu Plano</h2>
        <p className="text-gray-600 mt-2">Selecione o plano ideal para sua empresa</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {PLANOS.map((plano) => (
          <div
            key={plano.id}
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${watchedPlano === plano.id
                ? 'border-[#159A9C] bg-[#DEEFE7]'
                : 'border-gray-200 hover:border-gray-300'
              } ${plano.popular ? 'ring-2 ring-[#159A9C] ring-opacity-50' : ''}`}
            onClick={() => setValue('plano', plano.id)}
          >
            {plano.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#159A9C] text-white px-4 py-1 rounded-full text-sm font-medium">
                  Mais Popular
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900">{plano.nome}</h3>
              <p className="text-gray-600 mt-2">{plano.descricao}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">R$ {plano.preco}</span>
                <span className="text-gray-600">/mês</span>
              </div>
            </div>

            <div className="mt-6">
              <ul className="space-y-3">
                {plano.recursos.map((recurso, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{recurso}</span>
                  </li>
                ))}
              </ul>
            </div>

            <input
              {...register('plano')}
              type="radio"
              value={plano.id}
              className="absolute top-4 right-4 w-5 h-5 text-[#159A9C] focus:ring-[#159A9C]"
            />
          </div>
        ))}
      </div>

      {errors.plano && (
        <p className="text-red-500 text-sm text-center">{errors.plano.message}</p>
      )}

      <div className="mt-8">
        <label className="flex items-center">
          <input
            {...register('aceitarTermos')}
            type="checkbox"
            className="w-5 h-5 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
          />
          <span className="ml-3 text-gray-700">
            Aceito os{' '}
            <a href="/termos" className="text-[#159A9C] hover:underline" target="_blank">
              Termos de Uso
            </a>
            {' '}e{' '}
            <a href="/privacidade" className="text-[#159A9C] hover:underline" target="_blank">
              Política de Privacidade
            </a>
          </span>
        </label>
        {errors.aceitarTermos && (
          <p className="text-red-500 text-sm mt-1">{errors.aceitarTermos.message}</p>
        )}
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step <= currentStep
                ? 'bg-[#159A9C] text-white'
                : 'bg-gray-200 text-gray-600'
              }`}
          >
            {step < currentStep ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-12 h-1 mx-2 ${step < currentStep ? 'bg-[#159A9C]' : 'bg-gray-200'
                }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEEFE7] to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#002333] mb-4">
            Criar Conta Empresarial
          </h1>
          <p className="text-xl text-gray-600">
            Junte-se a milhares de empresas que já usam o Fênix CRM
          </p>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                className={`px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 ${currentStep === 1 ? 'invisible' : ''
                  }`}
              >
                Voltar
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={async () => {
                    let camposEtapa: FieldPath<RegistroFormData>[] | null = null;

                    if (currentStep === 1) {
                      camposEtapa = [
                        'empresa.nome',
                        'empresa.cnpj',
                        'empresa.email',
                        'empresa.telefone',
                        'empresa.endereco',
                        'empresa.cidade',
                        'empresa.estado',
                        'empresa.cep',
                      ] as FieldPath<RegistroFormData>[];
                    } else if (currentStep === 2) {
                      camposEtapa = [
                        'usuario.nome',
                        'usuario.email',
                        'usuario.senha',
                        'usuario.confirmarSenha',
                        'usuario.telefone',
                      ] as FieldPath<RegistroFormData>[];
                    }

                    if (!camposEtapa) {
                      setCurrentStep(currentStep + 1);
                      return;
                    }

                    const valido = await trigger(camposEtapa, { shouldFocus: true });

                    if (valido) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      toast.error('Preencha os campos obrigatórios antes de continuar.');
                    }
                  }}
                  className="px-6 py-3 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white rounded-lg hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando Conta...
                    </>
                  ) : (
                    <>
                      Criar Conta Empresarial
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Já tem uma conta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-[#159A9C] hover:underline font-medium"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistroEmpresaPage;
