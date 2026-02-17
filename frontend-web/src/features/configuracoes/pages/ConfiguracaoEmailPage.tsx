import React, { useState, useEffect } from 'react';
import {
  Mail,
  Settings,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  Info,
  ExternalLink,
  CheckCircle,
  Clock,
  HelpCircle,
  Zap,
  Shield,
  Globe,
  Save,
  History,
  Trash2,
  Copy,
  Download,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { emailServiceReal } from '../../../services/emailServiceReal';
import {
  EMAIL_PROVIDERS,
  resolveEmailProvider,
} from '../../../config/emailConfig';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';

const ConfiguracaoEmailPage: React.FC = () => {
  const [providerAtual, setProviderAtual] = useState('gmail');
  const [statusConfig, setStatusConfig] = useState('not_configured'); // not_configured, configured, tested
  const [progressoConfig, setProgressoConfig] = useState(0); // 0-100
  const [salvando, setSalvando] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [historicoTestes, setHistoricoTestes] = useState<any[]>([]);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({
    provider: 'gmail',
    gmail: {
      user: '',
      password: '',
    },
    sendgrid: {
      apiKey: '',
    },
    awsSes: {
      accessKeyId: '',
      secretAccessKey: '',
      region: 'us-east-1',
    },
    customSmtp: {
      host: 'smtp.gmail.com',
      port: 587,
      user: '',
      password: '',
    },
    empresa: {
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
    },
  });

  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [testando, setTestando] = useState(false);
  const [emailTeste, setEmailTeste] = useState('');
  const [resultadoTeste, setResultadoTeste] = useState<any>(null);

  // Funções utilitárias
  const validarCampo = (campo: string, valor: string) => {
    const errors: Record<string, string> = {};

    switch (campo) {
      case 'gmail.user':
        if (valor && !valor.includes('@gmail.com')) {
          errors[campo] = 'Use um e-mail @gmail.com válido';
        }
        break;
      case 'gmail.password':
        if (valor && valor.length !== 16) {
          errors[campo] = 'Senha de app deve ter exatamente 16 caracteres';
        }
        break;
      case 'empresa.email':
        if (valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
          errors[campo] = 'Digite um e-mail válido';
        }
        break;
      case 'empresa.telefone':
        if (valor && !/^\([0-9]{2}\)\s[0-9]{4,5}-[0-9]{4}$/.test(valor)) {
          errors[campo] = 'Use o formato (11) 99999-9999';
        }
        break;
    }

    setValidationErrors((prev) => ({
      ...prev,
      ...errors,
      ...(Object.keys(errors).length === 0 ? { [campo]: '' } : {}),
    }));
  };

  const salvarConfiguracao = async () => {
    setSalvando(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simular delay
      localStorage.setItem('conectcrm-email-config', JSON.stringify(configuracoes));
      toast.success('✅ Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('❌ Erro ao salvar configurações');
    } finally {
      setSalvando(false);
    }
  };

  const exportarConfiguracao = () => {
    const config = { ...configuracoes };
    // Remover dados sensíveis para export
    config.gmail.password = '';
    config.sendgrid.apiKey = '';
    config.awsSes.secretAccessKey = '';

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'conectcrm-email-config.json';
    link.click();
    URL.revokeObjectURL(url);

    toast.success('📄 Configuração exportada (senhas removidas por segurança)');
  };

  const copiarConfiguracao = () => {
    const config = { ...configuracoes };
    config.gmail.password = '***';
    config.sendgrid.apiKey = '***';

    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast.success('📋 Configuração copiada para a área de transferência');
  };

  const limparHistorico = () => {
    setHistoricoTestes([]);
    localStorage.removeItem('conectcrm-email-historico');
    toast.success('🗑️ Histórico de testes limpo');
  };
  const calcularProgresso = () => {
    let progresso = 0;

    if (providerAtual === 'gmail') {
      if (configuracoes.gmail.user) progresso += 25;
      if (configuracoes.gmail.password) progresso += 25;
    } else if (providerAtual === 'sendgrid') {
      if (configuracoes.sendgrid.apiKey) progresso += 50;
    }

    if (configuracoes.empresa.nome) progresso += 15;
    if (configuracoes.empresa.email) progresso += 15;
    if (configuracoes.empresa.telefone) progresso += 10;

    if (resultadoTeste?.success) progresso += 25;

    return Math.min(progresso, 100);
  };

  const getStatusConfig = () => {
    const progresso = calcularProgresso();
    if (progresso === 0)
      return { status: 'not_configured', label: 'Não configurado', color: 'gray', icon: Clock };
    if (progresso < 50)
      return {
        status: 'partial',
        label: 'Configuração parcial',
        color: 'yellow',
        icon: AlertCircle,
      };
    if (!resultadoTeste?.success)
      return { status: 'configured', label: 'Configurado', color: 'blue', icon: Settings };
    return { status: 'tested', label: 'Configurado e testado', color: 'green', icon: CheckCircle };
  };

  const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  useEffect(() => {
    const envProvider = resolveEmailProvider(process.env.REACT_APP_EMAIL_PROVIDER);
    // Carregar configurações do localStorage ou variáveis de ambiente
    const configSalva = localStorage.getItem('conectcrm-email-config');
    if (configSalva) {
      try {
        const parsedConfig = JSON.parse(configSalva);
        const savedProvider = resolveEmailProvider(parsedConfig?.provider);

        setConfiguracoes((prev) => ({
          ...prev,
          ...parsedConfig,
          provider: savedProvider,
        }));
        setProviderAtual(savedProvider);
      } catch {
        setProviderAtual(envProvider);
      }
    } else {
      // Carregar das variáveis de ambiente
      setConfiguracoes((prev) => ({
        ...prev,
        provider: envProvider,
        gmail: {
          user: process.env.REACT_APP_EMAIL_USER || '',
          password: process.env.REACT_APP_EMAIL_PASSWORD || '',
        },
        sendgrid: {
          apiKey: process.env.REACT_APP_SENDGRID_API_KEY || '',
        },
        empresa: {
          nome: process.env.REACT_APP_EMPRESA_NOME || 'ConectCRM',
          email: process.env.REACT_APP_EMPRESA_EMAIL || 'contato@conectcrm.com',
          telefone: process.env.REACT_APP_EMPRESA_TELEFONE || '(11) 99999-9999',
          endereco: process.env.REACT_APP_EMPRESA_ENDERECO || 'São Paulo/SP',
        },
      }));
      setProviderAtual(envProvider);
    }

    // Carregar histórico de testes
    const historicoSalvo = localStorage.getItem('conectcrm-email-historico');
    if (historicoSalvo) {
      setHistoricoTestes(JSON.parse(historicoSalvo));
    }
    setEmailTeste(localStorage.getItem('conectcrm-email-teste') || '');
  }, []);

  // Atualizar progresso quando configurações mudarem
  useEffect(() => {
    setProgressoConfig(calcularProgresso());
  }, [configuracoes, resultadoTeste]);

  const testarEmail = async () => {
    if (!emailTeste) {
      toast.error('Digite um e-mail para teste');
      return;
    }

    setTestando(true);
    try {
      // Salvar configurações e email de teste
      localStorage.setItem('conectcrm-email-config', JSON.stringify(configuracoes));
      localStorage.setItem('conectcrm-email-teste', emailTeste);

      const resultado = await emailServiceReal.testarConfiguracao(emailTeste);

      const novoResultado = {
        success: resultado.success,
        error: resultado.error || null,
        messageId: resultado.messageId || null,
        provider: EMAIL_PROVIDERS[providerAtual as keyof typeof EMAIL_PROVIDERS]?.name,
        timestamp: new Date(),
        emailTeste,
        id: Date.now(),
      };

      setResultadoTeste(novoResultado);

      // Adicionar ao histórico
      const novoHistorico = [novoResultado, ...historicoTestes.slice(0, 9)]; // Manter apenas 10 últimos
      setHistoricoTestes(novoHistorico);
      localStorage.setItem('conectcrm-email-historico', JSON.stringify(novoHistorico));

      if (resultado.success) {
        toast.success('✅ E-mail de teste enviado com sucesso!');
      } else {
        toast.error(`❌ Erro: ${resultado.error}`);
      }
    } catch (error: any) {
      const erroResultado = {
        success: false,
        error: error.message,
        timestamp: new Date(),
        emailTeste,
        id: Date.now(),
      };

      setResultadoTeste(erroResultado);

      const novoHistorico = [erroResultado, ...historicoTestes.slice(0, 9)];
      setHistoricoTestes(novoHistorico);
      localStorage.setItem('conectcrm-email-historico', JSON.stringify(novoHistorico));

      toast.error(`❌ Erro ao testar: ${error.message}`);
    } finally {
      setTestando(false);
    }
  };

  const getProviderInfo = () => {
    const providers: Record<string, any> = {
      gmail: {
        setup:
          'Ative a verificação em 2 etapas no Gmail e gere uma "Senha de app" nas configurações de segurança.',
      },
      sendgrid: {
        setup:
          'Crie uma conta gratuita no SendGrid e gere uma API Key com permissões de envio de e-mail.',
      },
      'aws-ses': {
        setup: 'Configure suas credenciais AWS e ative o Amazon SES na região escolhida.',
      },
    };

    return providers[providerAtual];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Padronizado */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Configurações" nucleusPath="/nuclei/configuracoes" />
      </div>

      <div className="p-6">
        {/* Header da Página */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Mail className="h-8 w-8 mr-3 text-blue-600" />
                Configuração de E-mail
                {salvando && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 ml-3"></div>
                )}
              </h1>
              <p className="mt-2 text-gray-600">
                Configure provedores de e-mail e teste o envio de mensagens do sistema
              </p>
            </div>

            {/* Status da Configuração */}
            <div className="mt-4 sm:mt-0 flex items-center gap-3">
              {(() => {
                const status = getStatusConfig();
                const IconComponent = status.icon;
                return (
                  <div
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                      status.color === 'green'
                        ? 'bg-green-100 text-green-800'
                        : status.color === 'blue'
                          ? 'bg-blue-100 text-blue-800'
                          : status.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {status.label}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Barra de Progresso e Próximos Passos */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso da Configuração</span>
              <span className="text-sm text-gray-500">{progressoConfig}% completo</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  progressoConfig === 100
                    ? 'bg-green-500'
                    : progressoConfig >= 50
                      ? 'bg-blue-500'
                      : progressoConfig > 0
                        ? 'bg-yellow-500'
                        : 'bg-gray-400'
                }`}
                style={{ width: `${progressoConfig}%` }}
              ></div>
            </div>
          </div>

          {/* Dicas de Configuração */}
          {progressoConfig < 100 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Próximos passos:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {progressoConfig < 50 && (
                      <li>• Complete as configurações do provedor selecionado</li>
                    )}
                    {progressoConfig >= 50 && progressoConfig < 85 && (
                      <li>• Preencha os dados da empresa</li>
                    )}
                    {progressoConfig >= 85 && !resultadoTeste?.success && (
                      <li>• Teste a configuração de e-mail</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Seleção de Provedor */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Escolher Provedor</h3>
                  <Tooltip content="Selecione o serviço que enviará os e-mails">
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </Tooltip>
                </div>

                <div className="space-y-3">
                  {Object.entries(EMAIL_PROVIDERS).map(([key, provider]) => {
                    const isSelected = providerAtual === key;
                    const isConfigured =
                      key === 'gmail'
                        ? configuracoes.gmail.user && configuracoes.gmail.password
                        : key === 'sendgrid'
                          ? configuracoes.sendgrid.apiKey
                          : false;

                    return (
                      <div
                        key={key}
                        onClick={() => setProviderAtual(resolveEmailProvider(key))}
                        className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Badge de configurado */}
                        {isConfigured && (
                          <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            OK
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            {key === 'gmail' && <Globe className="w-5 h-5 text-blue-600 mr-2" />}
                            {key === 'sendgrid' && <Zap className="w-5 h-5 text-blue-600 mr-2" />}
                            {key === 'aws-ses' && <Shield className="w-5 h-5 text-blue-600 mr-2" />}
                            <h4 className="font-medium">{provider.name}</h4>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                        </div>

                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {provider.description}
                        </p>

                        <div className="flex items-center justify-between text-xs">
                          <div className="text-gray-500">📧 {provider.limits}</div>
                          {key === 'gmail' && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Grátis
                            </span>
                          )}
                          {key === 'sendgrid' && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Freemium
                            </span>
                          )}
                          {key === 'aws-ses' && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Pay per use
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info do Provedor Atual */}
                {getProviderInfo() && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-blue-900 mb-1">Como configurar:</h5>
                        <p className="text-sm text-blue-700">{getProviderInfo()?.setup}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Configurações */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Configurações do{' '}
                  {EMAIL_PROVIDERS[providerAtual as keyof typeof EMAIL_PROVIDERS]?.name}
                </h3>

                {/* Gmail SMTP */}
                {providerAtual === 'gmail' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            E-mail do Gmail
                          </label>
                          <Tooltip content="Seu endereço de e-mail do Gmail que enviará as mensagens">
                            <HelpCircle className="w-4 h-4 text-gray-400 ml-2" />
                          </Tooltip>
                        </div>
                        <input
                          type="email"
                          value={configuracoes.gmail.user}
                          onChange={(e) => {
                            setConfiguracoes((prev) => ({
                              ...prev,
                              gmail: { ...prev.gmail, user: e.target.value },
                            }));
                            validarCampo('gmail.user', e.target.value);
                          }}
                          placeholder="seu-email@gmail.com"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            validationErrors['gmail.user']
                              ? 'border-red-300 bg-red-50'
                              : configuracoes.gmail.user
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-300'
                          }`}
                        />
                        {validationErrors['gmail.user'] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <X className="w-4 h-4 mr-1" />
                            {validationErrors['gmail.user']}
                          </p>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Senha de App
                          </label>
                          <Tooltip content="Senha específica de 16 caracteres gerada nas configurações do Gmail">
                            <HelpCircle className="w-4 h-4 text-gray-400 ml-2" />
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <input
                            type={mostrarSenhas ? 'text' : 'password'}
                            value={configuracoes.gmail.password}
                            onChange={(e) => {
                              setConfiguracoes((prev) => ({
                                ...prev,
                                gmail: { ...prev.gmail, password: e.target.value },
                              }));
                              validarCampo('gmail.password', e.target.value);
                            }}
                            placeholder="Senha de 16 caracteres"
                            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              validationErrors['gmail.password']
                                ? 'border-red-300 bg-red-50'
                                : configuracoes.gmail.password &&
                                    configuracoes.gmail.password.length === 16
                                  ? 'border-green-300 bg-green-50'
                                  : 'border-gray-300'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setMostrarSenhas(!mostrarSenhas)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {mostrarSenhas ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        {validationErrors['gmail.password'] && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <X className="w-4 h-4 mr-1" />
                            {validationErrors['gmail.password']}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        🔐 Como gerar uma Senha de App no Gmail:
                      </h4>
                      <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                        <li>
                          Acesse{' '}
                          <a
                            href="https://myaccount.google.com/security"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center"
                          >
                            Segurança da Conta Google <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </li>
                        <li>Ative a "Verificação em duas etapas"</li>
                        <li>Vá em "Senhas de app" e gere uma nova senha</li>
                        <li>Escolha "Outro (nome personalizado)" e digite "ConectCRM"</li>
                        <li>Copie a senha de 16 caracteres gerada</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* SendGrid */}
                {providerAtual === 'sendgrid' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          API Key do SendGrid
                        </label>
                        <Tooltip content="Chave de API que começa com SG. gerada no painel do SendGrid">
                          <HelpCircle className="w-4 h-4 text-gray-400 ml-2" />
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <input
                          type={mostrarSenhas ? 'text' : 'password'}
                          value={configuracoes.sendgrid.apiKey}
                          onChange={(e) =>
                            setConfiguracoes((prev) => ({
                              ...prev,
                              sendgrid: { ...prev.sendgrid, apiKey: e.target.value },
                            }))
                          }
                          placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setMostrarSenhas(!mostrarSenhas)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {mostrarSenhas ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        🚀 Como criar uma API Key no SendGrid:
                      </h4>
                      <div className="text-sm text-blue-700">
                        <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                          <li>
                            Crie conta gratuita em{' '}
                            <a
                              href="https://sendgrid.com"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center"
                            >
                              SendGrid.com <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </li>
                          <li>Vá em Settings → API Keys</li>
                          <li>Crie uma nova API Key com permissões de "Mail Send"</li>
                          <li>Copie a chave (começa com SG.)</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dados da Empresa */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Dados da Empresa (aparecem nos e-mails)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Empresa
                      </label>
                      <input
                        type="text"
                        value={configuracoes.empresa.nome}
                        onChange={(e) =>
                          setConfiguracoes((prev) => ({
                            ...prev,
                            empresa: { ...prev.empresa, nome: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail da Empresa
                      </label>
                      <input
                        type="email"
                        value={configuracoes.empresa.email}
                        onChange={(e) => {
                          setConfiguracoes((prev) => ({
                            ...prev,
                            empresa: { ...prev.empresa, email: e.target.value },
                          }));
                          validarCampo('empresa.email', e.target.value);
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          validationErrors['empresa.email']
                            ? 'border-red-300 bg-red-50'
                            : configuracoes.empresa.email &&
                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuracoes.empresa.email)
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-300'
                        }`}
                      />
                      {validationErrors['empresa.email'] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <X className="w-4 h-4 mr-1" />
                          {validationErrors['empresa.email']}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefone
                      </label>
                      <input
                        type="text"
                        value={configuracoes.empresa.telefone}
                        onChange={(e) =>
                          setConfiguracoes((prev) => ({
                            ...prev,
                            empresa: { ...prev.empresa, telefone: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Endereço
                      </label>
                      <input
                        type="text"
                        value={configuracoes.empresa.endereco}
                        onChange={(e) =>
                          setConfiguracoes((prev) => ({
                            ...prev,
                            empresa: { ...prev.empresa, endereco: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={salvarConfiguracao}
                      disabled={salvando}
                      className="flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {salvando ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {salvando ? 'Salvando...' : 'Salvar Configurações'}
                    </button>

                    <button
                      onClick={exportarConfiguracao}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </button>

                    <button
                      onClick={copiarConfiguracao}
                      className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    💡 Dica: Exporte suas configurações para backup ou compartilhamento
                  </p>
                </div>
              </div>

              {/* Teste de E-mail */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Teste de E-mail</h3>
                  {historicoTestes.length > 0 && (
                    <button
                      onClick={() => setMostrarHistorico(!mostrarHistorico)}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                    >
                      <History className="w-4 h-4 mr-1" />
                      {mostrarHistorico ? 'Ocultar' : 'Ver'} Histórico ({historicoTestes.length})
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail para Teste
                    </label>
                    <input
                      type="email"
                      value={emailTeste}
                      onChange={(e) => setEmailTeste(e.target.value)}
                      placeholder="Digite um e-mail para testar"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={testarEmail}
                      disabled={testando || !emailTeste}
                      className="flex items-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      {testando ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      {testando ? 'Enviando...' : 'Enviar E-mail de Teste'}
                    </button>

                    {historicoTestes.length > 0 && (
                      <button
                        onClick={limparHistorico}
                        className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Histórico de Testes */}
                  {mostrarHistorico && historicoTestes.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">📊 Histórico de Testes</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {historicoTestes.map((teste, index) => (
                          <div
                            key={teste.id || index}
                            className={`p-3 rounded-lg border text-sm ${
                              teste.success
                                ? 'bg-green-50 border-green-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {teste.success ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                                ) : (
                                  <X className="w-4 h-4 text-red-600 mr-2" />
                                )}
                                <span className="font-medium">{teste.emailTeste}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(teste.timestamp).toLocaleString('pt-BR')}
                              </span>
                            </div>
                            {teste.error && (
                              <p className="mt-1 text-red-600 text-xs">{teste.error}</p>
                            )}
                            {teste.provider && (
                              <p className="mt-1 text-gray-600 text-xs">Via: {teste.provider}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resultado do Teste Atual */}
                  {resultadoTeste && (
                    <div
                      className={`p-4 rounded-lg border ${
                        resultadoTeste.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start">
                        {resultadoTeste.success ? (
                          <Check className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                        )}
                        <div>
                          <h5
                            className={`font-medium mb-1 ${
                              resultadoTeste.success ? 'text-green-900' : 'text-red-900'
                            }`}
                          >
                            {resultadoTeste.success
                              ? 'E-mail enviado com sucesso!'
                              : 'Erro no envio'}
                          </h5>
                          {resultadoTeste.success ? (
                            <div className="text-sm text-green-700 space-y-1">
                              <div>
                                📧 E-mail enviado para: <strong>{emailTeste}</strong>
                              </div>
                              {resultadoTeste.messageId && (
                                <div>
                                  🔗 ID da mensagem:{' '}
                                  <code className="bg-green-100 px-1 rounded">
                                    {resultadoTeste.messageId}
                                  </code>
                                </div>
                              )}
                              {resultadoTeste.provider && (
                                <div>
                                  ⚙️ Provedor: <strong>{resultadoTeste.provider}</strong>
                                </div>
                              )}
                              <div>
                                ⏰ Horário: {resultadoTeste.timestamp?.toLocaleString('pt-BR')}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-red-700">
                              <div>❌ Erro: {resultadoTeste.error}</div>
                              <div>
                                ⏰ Horário: {resultadoTeste.timestamp?.toLocaleString('pt-BR')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracaoEmailPage;

