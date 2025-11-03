import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../contexts/I18nContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Check } from 'lucide-react';
import ConectCRMLogoFinal from '../../components/ui/ConectCRMLogoFinal';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  // Mostrar mensagem de sucesso se vier do registro
  useEffect(() => {
    const state = location.state as any;
    if (state?.message) {
      toast.success(state.message);
      if (state.email) {
        setEmail(state.email);
      }
    }

    // Verificar se a sessão expirou
    const sessionExpired = localStorage.getItem('sessionExpired');
    if (sessionExpired === 'true') {
      toast.error('Sua sessão expirou. Por favor, faça login novamente.');
      localStorage.removeItem('sessionExpired');
    }
  }, [location]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no login:', error);

      // ✅ VERIFICAR SE PRECISA TROCAR SENHA (primeiro acesso)
      if (error.message === 'TROCAR_SENHA' && error.data) {
        toast('🔑 Primeiro acesso detectado. Redirecionando...', { icon: '🔑' });
        navigate('/trocar-senha', {
          state: {
            userId: error.data.userId,
            email: error.data.email,
            nome: error.data.nome,
          }
        });
        return;
      }

      toast.error('Credenciais inválidas. Tente novamente.');
      setErrors({ email: 'Email ou senha incorretos' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#DEEFE7] via-white to-[#F0F9FA] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#159A9C] to-[#0F7B7D] relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <ConectCRMLogoFinal size="2xl" variant="full" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Transforme seus<br />
              <span className="text-[#DEEFE7]">negócios digitais</span>
            </h2>
            <p className="text-xl text-[#DEEFE7] mb-8">
              O CRM mais completo e intuitivo do mercado brasileiro
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            {[
              'Gestão completa de clientes e vendas',
              'Dashboard com métricas em tempo real',
              'Sistema de notificações inteligente',
              'Integração com principais ferramentas',
              'Suporte técnico especializado'
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-[#DEEFE7] rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-[#159A9C]" />
                </div>
                <span className="text-[#DEEFE7]">{feature}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5000+</div>
              <div className="text-sm text-[#DEEFE7]">Empresas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">99.9%</div>
              <div className="text-sm text-[#DEEFE7]">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-[#DEEFE7]">Suporte</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <ConectCRMLogoFinal size="lg" variant="full" />
            </div>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#002333] mb-2">
              Bem-vindo de volta!
            </h1>
            <p className="text-[#B4BEC9]">
              Faça login para acessar sua conta
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-[#002333] mb-2">
                  Email corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B4BEC9] w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="seu@empresa.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-[#002333] mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B4BEC9] w-5 h-5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    placeholder="Digite sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B4BEC9] hover:text-[#159A9C] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-[#B4BEC9]">Lembrar de mim</span>
                </label>
                <button
                  type="button"
                  onClick={() => {/* TODO: Implementar recuperação de senha */ }}
                  className="text-sm font-medium text-[#159A9C] hover:text-[#0F7B7D] transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#159A9C] to-[#0F7B7D] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-[#B4BEC9] font-medium">
                    Novo no Conect CRM?
                  </span>
                </div>
              </div>
            </div>

            {/* Sign Up CTA */}
            <div className="text-center space-y-4">
              <button
                type="button"
                onClick={() => navigate('/registro')}
                className="w-full bg-white border-2 border-[#159A9C] text-[#159A9C] py-3 px-4 rounded-xl font-semibold hover:bg-[#DEEFE7] transition-all flex items-center justify-center space-x-2"
              >
                <span>🚀 Criar Conta Empresarial</span>
              </button>

              {/* Benefits */}
              <div className="flex items-center justify-center space-x-6 text-xs text-[#B4BEC9]">
                <div className="flex items-center space-x-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>30 dias grátis</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Sem cartão</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check className="w-3 h-3 text-green-500" />
                  <span>Setup em 5 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-[#B4BEC9]">
              Ao continuar, você concorda com nossos{' '}
              <a href="/termos" className="text-[#159A9C] hover:underline">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="/privacidade" className="text-[#159A9C] hover:underline">
                Política de Privacidade
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
