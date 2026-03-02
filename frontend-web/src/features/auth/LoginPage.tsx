import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import Conect360Logo from '../../components/ui/Conect360Logo';
import { toastService } from '../../services/toastService';
import { MfaRequiredActionData } from '../../types';

interface MfaFlowState extends MfaRequiredActionData {
  expiresAt: number;
  resendAvailableAt: number;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const formatCountdown = (seconds: number) => {
  const total = Math.max(0, seconds);
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);

  const [mfaState, setMfaState] = useState<MfaFlowState | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaIsLoading, setMfaIsLoading] = useState(false);
  const [mfaIsResending, setMfaIsResending] = useState(false);
  const [mfaExpiresInSeconds, setMfaExpiresInSeconds] = useState(0);
  const [mfaResendInSeconds, setMfaResendInSeconds] = useState(0);

  const { login, verifyMfa, resendMfa } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;
    if (state?.message) {
      setRedirectMessage(state.message);
      toastService.success(state.message);

      if (state.email) {
        setEmail(state.email);
      }

      navigate(location.pathname, { replace: true, state: null });
    }

    const sessionExpired = localStorage.getItem('sessionExpired');
    if (sessionExpired === 'true') {
      toastService.error('Sua sessao expirou. Por favor, faca login novamente.');
      localStorage.removeItem('sessionExpired');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!mfaState) {
      setMfaExpiresInSeconds(0);
      setMfaResendInSeconds(0);
      return;
    }

    const updateCountdowns = () => {
      const now = Date.now();
      setMfaExpiresInSeconds(Math.max(0, Math.ceil((mfaState.expiresAt - now) / 1000)));
      setMfaResendInSeconds(Math.max(0, Math.ceil((mfaState.resendAvailableAt - now) / 1000)));
    };

    updateCountdowns();
    const timerId = window.setInterval(updateCountdowns, 1000);
    return () => window.clearInterval(timerId);
  }, [mfaState]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'E-mail e obrigatorio';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail invalido';
    }

    if (!password) {
      newErrors.password = 'Senha e obrigatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const applyMfaState = (data: MfaRequiredActionData) => {
    const now = Date.now();
    setMfaState({
      ...data,
      expiresAt: now + data.expiresInSeconds * 1000,
      resendAvailableAt: now + data.canResendAfterSeconds * 1000,
    });
    setMfaCode('');
    setMfaError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      toastService.success('Login realizado com sucesso!');
    } catch (error: unknown) {
      const errorMessage =
        isObject(error) && typeof error.message === 'string'
          ? error.message
          : error instanceof Error
            ? error.message
            : undefined;
      const backendMessage =
        isObject(error) &&
        isObject(error.response) &&
        isObject(error.response.data) &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : null;

      const errorData = isObject(error) ? error.data : undefined;

      if (errorMessage === 'TROCAR_SENHA' && isObject(errorData)) {
        const userId = typeof errorData.userId === 'string' ? errorData.userId : undefined;
        const emailFromData = typeof errorData.email === 'string' ? errorData.email : undefined;
        const nome = typeof errorData.nome === 'string' ? errorData.nome : undefined;
        const senhaTemporaria =
          typeof errorData.senhaTemporaria === 'string' ? errorData.senhaTemporaria : undefined;

        if (!userId || !emailFromData || !nome) {
          toastService.error('Nao foi possivel iniciar a troca de senha. Tente novamente.');
          return;
        }

        toastService.info('Primeiro acesso detectado. Redirecionando...');
        navigate('/trocar-senha', {
          state: {
            userId,
            email: emailFromData,
            nome,
            senhaTemporaria: senhaTemporaria || password,
          },
        });
        return;
      }

      if (errorMessage === 'MFA_REQUIRED' && isObject(errorData)) {
        const challengeId =
          typeof errorData.challengeId === 'string' ? errorData.challengeId : undefined;
        const emailMask = typeof errorData.email === 'string' ? errorData.email : '';
        const expiresInSeconds =
          typeof errorData.expiresInSeconds === 'number' ? errorData.expiresInSeconds : 600;
        const canResendAfterSeconds =
          typeof errorData.canResendAfterSeconds === 'number'
            ? errorData.canResendAfterSeconds
            : 30;

        if (!challengeId) {
          toastService.error('Nao foi possivel iniciar a verificacao em duas etapas.');
          return;
        }

        applyMfaState({
          challengeId,
          email: emailMask,
          expiresInSeconds,
          canResendAfterSeconds,
        });
        toastService.info('Codigo MFA enviado para o e-mail corporativo.');
        return;
      }

      if (backendMessage && backendMessage.toLowerCase().includes('temporariamente bloqueada')) {
        toastService.error(backendMessage);
        setErrors({ email: backendMessage });
        return;
      }

      toastService.error('Credenciais invalidas. Tente novamente.');
      setErrors({ email: 'E-mail ou senha incorretos' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mfaState) {
      return;
    }

    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setMfaError('Informe o codigo de 6 digitos enviado por e-mail.');
      return;
    }

    setMfaIsLoading(true);
    setMfaError(null);

    try {
      await verifyMfa(mfaState.challengeId, mfaCode.trim());
      toastService.success('Verificacao concluida com sucesso!');
    } catch (error) {
      const message =
        isObject(error) && typeof error.message === 'string'
          ? error.message
          : error instanceof Error
            ? error.message
            : '';

      if (message === 'MFA_REQUIRED') {
        setMfaError('Codigo invalido. Verifique e tente novamente.');
      } else {
        setMfaError('Nao foi possivel validar o codigo. Gere um novo codigo e tente novamente.');
      }
    } finally {
      setMfaIsLoading(false);
    }
  };

  const handleMfaResend = async () => {
    if (!mfaState || mfaIsResending || mfaResendInSeconds > 0) {
      return;
    }

    setMfaIsResending(true);
    setMfaError(null);

    try {
      const data = await resendMfa(mfaState.challengeId);
      applyMfaState(data);
      toastService.success('Novo codigo MFA enviado com sucesso.');
    } catch (error) {
      const message = error instanceof Error ? error.message : null;
      setMfaError(message || 'Nao foi possivel reenviar o codigo agora. Tente novamente.');
    } finally {
      setMfaIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaState(null);
    setMfaCode('');
    setMfaError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-[#159A9C] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-16 left-16 w-64 h-64 rounded-full bg-white/10"></div>
          <div className="absolute bottom-16 right-16 w-96 h-96 rounded-full bg-white/10"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-white/10"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full p-12 text-white">
          <div>
            <div className="mb-8 flex items-center">
              <Conect360Logo size="2xl" variant="full-light" className="w-auto" />
            </div>

            <h2 className="text-fluid-3xl font-bold mb-4">
              Unifique atendimento,
              <br />
              <span className="text-[#DEEFE7]">vendas e financeiro</span>
            </h2>
            <p className="text-fluid-lg text-[#DEEFE7] mb-10">
              Omnichannel, CRM, Financeiro e Automacao com IA no mesmo sistema.
            </p>
          </div>

          <div className="space-y-4">
            {[
              'Atendimento omnichannel (WhatsApp, e-mail, chat e telefone)',
              'CRM e Vendas (leads, oportunidades, propostas e contratos)',
              'Financeiro integrado (faturas, pagamentos e recorrencia)',
              'Automacao com IA (triagem, bot e insights)',
              'Analytics e dashboards com metricas em tempo real',
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5 w-5 h-5 bg-white/15 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-[#DEEFE7] leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3">
            {[
              { title: 'Omnichannel', subtitle: 'Inbox unificada' },
              { title: 'IA', subtitle: 'Triagem e automacoes' },
              { title: 'Multi-tenant', subtitle: 'Dados isolados' },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/15 bg-white/10 px-4 py-3"
              >
                <div className="text-sm font-semibold text-white">{item.title}</div>
                <div className="text-xs text-[#DEEFE7] mt-0.5">{item.subtitle}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Conect360Logo size="xl" variant="full" className="w-auto" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-fluid-2xl font-bold text-[#002333] mb-2">
              {mfaState ? 'Validacao de seguranca' : 'Bem-vindo de volta!'}
            </h1>
            <p className="text-[#B4BEC9]">
              {mfaState
                ? 'Informe o codigo enviado para concluir seu acesso administrativo.'
                : 'Faca login para acessar sua conta'}
            </p>

            {redirectMessage && !mfaState && (
              <div className="mt-5 rounded-lg border border-[#DEEFE7] bg-[#DEEFE7] px-4 py-3 text-left">
                <div className="flex items-start gap-2 text-sm text-[#002333]">
                  <CheckCircle2 className="h-5 w-5 text-[#159A9C] mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{redirectMessage}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            {mfaState ? (
              <form onSubmit={handleMfaSubmit} className="space-y-5">
                <div className="rounded-lg border border-[#DEEFE7] bg-[#F8FCFD] px-4 py-3 text-sm text-[#2E4A5A]">
                  Codigo enviado para <strong>{mfaState.email}</strong>.
                  <br />
                  Expira em <strong>{formatCountdown(mfaExpiresInSeconds)}</strong>.
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#002333] mb-2">
                    Codigo de verificacao
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B4BEC9] w-5 h-5" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={mfaCode}
                      maxLength={6}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setMfaCode(digitsOnly);
                        if (mfaError) setMfaError(null);
                      }}
                      className={`w-full pl-11 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                        mfaError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="000000"
                    />
                  </div>
                  {mfaError && <p className="text-red-500 text-sm mt-1">{mfaError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={mfaIsLoading}
                  className="w-full bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                >
                  {mfaIsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validando...</span>
                    </>
                  ) : (
                    <span>Validar codigo</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleMfaResend}
                  disabled={mfaIsResending || mfaResendInSeconds > 0}
                  className="w-full bg-white border border-[#159A9C] text-[#159A9C] px-4 py-2 rounded-lg hover:bg-[#159A9C]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {mfaIsResending
                    ? 'Reenviando codigo...'
                    : mfaResendInSeconds > 0
                      ? `Reenviar em ${formatCountdown(mfaResendInSeconds)}`
                      : 'Reenviar codigo'}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full text-sm text-[#6A8795] hover:text-[#159A9C] transition-colors"
                >
                  Voltar para tela de login
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#002333] mb-2">
                      E-mail corporativo
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B4BEC9] w-5 h-5" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        className={`w-full pl-11 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="seu@empresa.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#002333] mb-2">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#B4BEC9] w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password)
                            setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        className={`w-full pl-11 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent transition-colors ${
                          errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Digite sua senha"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#B4BEC9] hover:text-[#159A9C] transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

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
                      onClick={() => navigate('/esqueci-minha-senha')}
                      className="text-sm font-medium text-[#159A9C] hover:text-[#0F7B7D] transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <>
                        <span>Entrar</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="my-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-[#B4BEC9] font-medium">
                        Novo no Conect360?
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <button
                    type="button"
                    onClick={() => navigate('/registro')}
                    className="w-full bg-white border border-[#159A9C] text-[#159A9C] px-4 py-2 rounded-lg hover:bg-[#159A9C]/10 transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
                  >
                    <span>Criar Conta Empresarial</span>
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#B4BEC9]">
                    <div className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>30 dias gratis</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Sem cartao</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Setup em 5 min</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-8">
            <p className="text-xs text-[#B4BEC9]">
              Ao continuar, voce concorda com nossos{' '}
              <a href="/termos" className="text-[#159A9C] hover:underline">
                Termos de Uso
              </a>{' '}
              e{' '}
              <a href="/privacidade" className="text-[#159A9C] hover:underline">
                Politica de Privacidade
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
