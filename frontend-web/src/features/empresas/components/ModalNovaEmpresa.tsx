import React, { useState } from 'react';
import { X, Building2, Mail, Phone, MapPin, CreditCard, AlertCircle } from 'lucide-react';
import { useEmpresas } from '../../../contexts/EmpresaContextAPIReal';

interface ModalNovaEmpresaProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalNovaEmpresa: React.FC<ModalNovaEmpresaProps> = ({ isOpen, onClose }) => {
  const { addEmpresa } = useEmpresas();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    planoSelecionado: 'Professional' as 'Starter' | 'Professional' | 'Enterprise',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const planos = [
    {
      nome: 'Starter' as const,
      preco: 79.9,
      descricao: 'Ideal para pequenas empresas',
      features: ['Até 10 usuários', 'API básica', 'Suporte por email', 'Backup manual'],
      cor: 'green',
      popular: false,
    },
    {
      nome: 'Professional' as const,
      preco: 199.9,
      descricao: 'Para empresas em crescimento',
      features: ['Até 50 usuários', 'API completa', 'Suporte prioritário', 'Backup automático'],
      cor: 'blue',
      popular: true,
    },
    {
      nome: 'Enterprise' as const,
      preco: 499.9,
      descricao: 'Para grandes organizações',
      features: [
        'Usuários ilimitados',
        'API + Webhooks',
        'Suporte 24/7',
        'Relatórios avançados',
        'White-label',
      ],
      cor: 'purple',
      popular: false,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome da empresa é obrigatório';
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ deve estar no formato 00.000.000/0000-00';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email deve ter um formato válido';
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const planoInfo = planos.find((p) => p.nome === formData.planoSelecionado)!;

      await addEmpresa({
        nome: formData.nome,
        cnpj: formData.cnpj,
        email: formData.email,
        telefone: formData.telefone,
        plano: {
          nome: planoInfo.nome,
          preco: planoInfo.preco,
          features: planoInfo.features,
        },
        status: 'trial',
        isActive: false,
        dataVencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        dataCriacao: new Date(),
        ultimoAcesso: new Date(),
      });

      // Reset form and close modal
      setFormData({
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
        planoSelecionado: 'Professional',
      });
      setStep(1);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-[calc(100%-2rem)] sm:w-[500px] md:w-[600px] lg:w-[700px] max-w-[800px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Nova Empresa</h2>
                <p className="text-sm text-gray-600">
                  {step === 1 ? 'Informações básicas' : 'Escolha seu plano'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            <div
              className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-[#159A9C]' : 'bg-gray-200'}`}
            ></div>
            <div
              className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-[#159A9C]' : 'bg-gray-200'}`}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Informações</span>
            <span>Plano</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            /* Step 1: Informações da Empresa */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20 focus:border-[#159A9C] ${
                    errors.nome ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Minha Empresa Ltda"
                />
                {errors.nome && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-3 h-3" />
                    {errors.nome}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ *</label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, cnpj: formatCNPJ(e.target.value) }))
                  }
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20 focus:border-[#159A9C] ${
                    errors.cnpj ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                {errors.cnpj && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-3 h-3" />
                    {errors.cnpj}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20 focus:border-[#159A9C] ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="contato@empresa.com.br"
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-3 h-3" />
                    {errors.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, telefone: formatPhone(e.target.value) }))
                    }
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C]/20 focus:border-[#159A9C] ${
                      errors.telefone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
                {errors.telefone && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                    <AlertCircle className="w-3 h-3" />
                    {errors.telefone}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Step 2: Seleção de Plano */
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Escolha seu plano</h3>
                <p className="text-gray-600">Comece com 30 dias grátis em qualquer plano</p>
              </div>

              <div className="grid gap-4">
                {planos.map((plano) => (
                  <div
                    key={plano.nome}
                    className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                      formData.planoSelecionado === plano.nome
                        ? 'border-[#159A9C] bg-[#159A9C]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, planoSelecionado: plano.nome }))
                    }
                  >
                    {plano.popular && (
                      <div className="absolute -top-3 left-6">
                        <span className="bg-[#159A9C] text-white text-xs font-bold px-3 py-1 rounded-full">
                          Mais Popular
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">{plano.nome}</h4>
                          <span className="text-2xl font-bold text-[#159A9C]">
                            {formatCurrency(plano.preco)}
                          </span>
                          <span className="text-gray-500">/mês</span>
                        </div>
                        <p className="text-gray-600 mb-4">{plano.descricao}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {plano.features.map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-sm text-gray-600"
                            >
                              <div className="w-1.5 h-1.5 bg-[#159A9C] rounded-full"></div>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex-shrink-0 ml-4">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            formData.planoSelecionado === plano.nome
                              ? 'border-[#159A9C] bg-[#159A9C]'
                              : 'border-gray-300'
                          }`}
                        >
                          {formData.planoSelecionado === plano.nome && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">Trial de 30 dias grátis</h4>
                    <p className="text-sm text-blue-700">
                      Você pode testar todos os recursos por 30 dias sem compromisso. Nenhum cartão
                      de crédito necessário.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Voltar
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              {step < 2 ? (
                <button
                  onClick={() => {
                    if (validateForm()) {
                      setStep(2);
                    }
                  }}
                  className="px-6 py-2 bg-[#159A9C] text-white font-medium rounded-lg hover:bg-[#0F7B7D] transition-colors"
                >
                  Continuar
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-[#159A9C] text-white font-medium rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Criando...
                    </>
                  ) : (
                    'Criar Empresa'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
