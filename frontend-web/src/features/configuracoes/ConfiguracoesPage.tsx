import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { BackToNucleus } from '../../components/navigation/BackToNucleus';
import { emailServiceReal } from '../../services/emailServiceReal';
import {
  Settings,
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Database,
  Key,
  Mail,
  Phone,
  Building,
  Save,
  Eye,
  EyeOff,
  TestTube,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react';

const ConfiguracoesPage: React.FC = () => {
  // Estados
  const [activeTab, setActiveTab] = useState('perfil');
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
  });

  // Estados para configuração de email
  const [emailConfig, setEmailConfig] = useState({
    provider: 'gmail',
    gmail: {
      user: '',
      password: '',
    },
    sendgrid: {
      apiKey: '',
      fromEmail: '',
    },
    smtp: {
      host: '',
      port: 587,
      user: '',
      password: '',
      secure: false,
    },
    empresa: {
      nome: 'ConectCRM',
      email: 'contato@conectcrm.com',
      telefone: '(11) 99999-9999',
      endereco: 'São Paulo/SP',
    },
  });
  const [testando, setTestando] = useState(false);
  const [emailTeste, setEmailTeste] = useState('');
  const [resultadoTeste, setResultadoTeste] = useState<any>(null);
  const [salvandoEmail, setSalvandoEmail] = useState(false);

  // Carregar configurações de email
  useEffect(() => {
    const configSalva = localStorage.getItem('conectcrm-email-config');
    if (configSalva) {
      setEmailConfig(JSON.parse(configSalva));
    } else {
      // Carregar das variáveis de ambiente
      setEmailConfig((prev) => ({
        ...prev,
        provider: process.env.REACT_APP_EMAIL_PROVIDER || 'gmail',
        gmail: {
          user: process.env.REACT_APP_EMAIL_USER || '',
          password: process.env.REACT_APP_EMAIL_PASSWORD || '',
        },
        empresa: {
          nome: process.env.REACT_APP_EMPRESA_NOME || 'ConectCRM',
          email: process.env.REACT_APP_EMPRESA_EMAIL || 'contato@conectcrm.com',
          telefone: process.env.REACT_APP_EMPRESA_TELEFONE || '(11) 99999-9999',
          endereco: process.env.REACT_APP_EMPRESA_ENDERECO || 'São Paulo/SP',
        },
      }));
    }
    setEmailTeste(localStorage.getItem('conectcrm-email-teste') || '');
  }, []);

  // Funções para email
  const salvarConfiguracaoEmail = () => {
    setSalvandoEmail(true);
    try {
      localStorage.setItem('conectcrm-email-config', JSON.stringify(emailConfig));
      toast.success('Configurações de e-mail salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSalvandoEmail(false);
    }
  };

  const testarEmail = async () => {
    if (!emailTeste) {
      toast.error('Digite um e-mail para teste');
      return;
    }

    setTestando(true);
    setResultadoTeste(null);

    try {
      localStorage.setItem('conectcrm-email-teste', emailTeste);
      // Usar a configuração atual em vez das variáveis de ambiente
      const resultado = await emailServiceReal.testarConfiguracaoComConfig(emailTeste, emailConfig);
      setResultadoTeste(resultado);

      if (resultado.success) {
        toast.success('E-mail de teste enviado com sucesso!');
      } else {
        toast.error(`Erro no teste: ${resultado.error}`);
      }
    } catch (error) {
      console.error('Erro no teste de e-mail:', error);
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date(),
      };
      setResultadoTeste(errorResult);
      toast.error('Erro ao testar e-mail');
    } finally {
      setTestando(false);
    }
  };

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'email', label: 'E-mail', icon: Mail },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'aparencia', label: 'Aparência', icon: Palette },
    { id: 'empresa', label: 'Empresa', icon: Building },
    { id: 'sistema', label: 'Sistema', icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'perfil':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    defaultValue="João Silva"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                  <input
                    type="email"
                    defaultValue="joao.silva@fenixcrm.com"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="tel"
                    defaultValue="(11) 99999-9999"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                  <input
                    type="text"
                    defaultValue="Administrador"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Foto do Perfil</h3>
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                    <User className="h-10 w-10 text-gray-600" />
                  </div>
                </div>
                <div>
                  <button className="bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Alterar foto
                  </button>
                  <p className="text-sm text-gray-500 mt-1">JPG, GIF ou PNG. Máximo de 1MB.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'seguranca':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Alterar Senha</h3>
              <div className="grid grid-cols-1 gap-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                  <input
                    type="password"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Autenticação de Dois Fatores
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">2FA Desabilitado</p>
                    <p className="text-sm text-gray-600">
                      Adicione uma camada extra de segurança à sua conta
                    </p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    Habilitar 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'email':
        return (
          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900">Configuração de E-mail</h3>
              <p className="text-sm text-gray-600 mt-1">
                Configure o servidor de e-mail para envio automático de propostas e notificações.
              </p>
            </div>

            {/* Seleção do Provedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Provedor de E-mail
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['gmail', 'sendgrid', 'smtp'].map((provider) => (
                  <div
                    key={provider}
                    onClick={() => setEmailConfig((prev) => ({ ...prev, provider }))}
                    className={`relative cursor-pointer rounded-lg border p-4 hover:bg-gray-50 ${
                      emailConfig.provider === provider
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={emailConfig.provider === provider}
                        onChange={() => {}}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {provider === 'gmail' && '📧 Gmail SMTP'}
                          {provider === 'sendgrid' && '🚀 SendGrid'}
                          {provider === 'smtp' && '⚙️ SMTP Customizado'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {provider === 'gmail' && 'Mais fácil para começar'}
                          {provider === 'sendgrid' && 'Profissional e confiável'}
                          {provider === 'smtp' && 'Configuração personalizada'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configurações específicas do provedor */}
            <div className="bg-gray-50 rounded-lg p-6">
              {emailConfig.provider === 'gmail' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configuração Gmail SMTP</h4>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-700">
                        <strong>Importante:</strong> Use uma "Senha de App" do Gmail, não sua senha
                        normal.
                        <a
                          href="https://myaccount.google.com/security"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline ml-1"
                        >
                          Gerar senha de app
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail Gmail
                      </label>
                      <input
                        type="email"
                        value={emailConfig.gmail.user}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({
                            ...prev,
                            gmail: { ...prev.gmail, user: e.target.value },
                          }))
                        }
                        placeholder="seu-email@gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Senha de App (16 caracteres)
                      </label>
                      <input
                        type="password"
                        value={emailConfig.gmail.password}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({
                            ...prev,
                            gmail: { ...prev.gmail, password: e.target.value },
                          }))
                        }
                        placeholder="xxxx xxxx xxxx xxxx"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {emailConfig.provider === 'sendgrid' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configuração SendGrid</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={emailConfig.sendgrid.apiKey}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({
                            ...prev,
                            sendgrid: { ...prev.sendgrid, apiKey: e.target.value },
                          }))
                        }
                        placeholder="SG.xxxxxxxxxxxxxxxxxx"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail do Remetente
                      </label>
                      <input
                        type="email"
                        value={emailConfig.sendgrid.fromEmail}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({
                            ...prev,
                            sendgrid: { ...prev.sendgrid, fromEmail: e.target.value },
                          }))
                        }
                        placeholder="contato@suaempresa.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {emailConfig.provider === 'smtp' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Configuração SMTP Customizado</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Servidor SMTP
                      </label>
                      <input
                        type="text"
                        value={emailConfig.smtp.host}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({
                            ...prev,
                            smtp: { ...prev.smtp, host: e.target.value },
                          }))
                        }
                        placeholder="smtp.seudominio.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Porta</label>
                      <input
                        type="number"
                        value={emailConfig.smtp.port}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({
                            ...prev,
                            smtp: { ...prev.smtp, port: parseInt(e.target.value) || 587 },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Usuário
                      </label>
                      <input
                        type="text"
                        value={emailConfig.smtp.user}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({
                            ...prev,
                            smtp: { ...prev.smtp, user: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                      <input
                        type="password"
                        value={emailConfig.smtp.password}
                        onChange={(e) =>
                          setEmailConfig((prev) => ({
                            ...prev,
                            smtp: { ...prev.smtp, password: e.target.value },
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={emailConfig.smtp.secure}
                      onChange={(e) =>
                        setEmailConfig((prev) => ({
                          ...prev,
                          smtp: { ...prev.smtp, secure: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">Conexão segura (SSL/TLS)</label>
                  </div>
                </div>
              )}
            </div>

            {/* Informações da Empresa */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Informações da Empresa</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={emailConfig.empresa.nome}
                    onChange={(e) =>
                      setEmailConfig((prev) => ({
                        ...prev,
                        empresa: { ...prev.empresa, nome: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail da Empresa
                  </label>
                  <input
                    type="email"
                    value={emailConfig.empresa.email}
                    onChange={(e) =>
                      setEmailConfig((prev) => ({
                        ...prev,
                        empresa: { ...prev.empresa, email: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                  <input
                    type="text"
                    value={emailConfig.empresa.telefone}
                    onChange={(e) =>
                      setEmailConfig((prev) => ({
                        ...prev,
                        empresa: { ...prev.empresa, telefone: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                  <input
                    type="text"
                    value={emailConfig.empresa.endereco}
                    onChange={(e) =>
                      setEmailConfig((prev) => ({
                        ...prev,
                        empresa: { ...prev.empresa, endereco: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Teste de E-mail */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                <TestTube className="h-5 w-5 mr-2" />
                Testar Configuração
              </h4>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="email"
                    value={emailTeste}
                    onChange={(e) => setEmailTeste(e.target.value)}
                    placeholder="Digite seu e-mail para teste"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={testarEmail}
                  disabled={testando || !emailTeste}
                  className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Testando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Testar
                    </>
                  )}
                </button>
              </div>

              {resultadoTeste && (
                <div
                  className={`mt-4 p-4 rounded-md ${
                    resultadoTeste.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <div className="flex">
                    {resultadoTeste.success ? (
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <h5
                        className={`font-medium ${
                          resultadoTeste.success ? 'text-green-800' : 'text-red-800'
                        }`}
                      >
                        {resultadoTeste.success ? 'Teste bem-sucedido!' : 'Erro no teste'}
                      </h5>
                      <p
                        className={`text-sm ${
                          resultadoTeste.success ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {resultadoTeste.success
                          ? `E-mail enviado via ${resultadoTeste.provider}. Verifique sua caixa de entrada.`
                          : resultadoTeste.error}
                      </p>
                      {resultadoTeste.messageId && (
                        <p className="text-xs text-gray-500 mt-1">ID: {resultadoTeste.messageId}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={salvarConfiguracaoEmail}
                disabled={salvandoEmail}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {salvandoEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </div>
        );
      case 'notificacoes':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Preferências de Notificação
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Notificações por E-mail</p>
                      <p className="text-sm text-gray-600">
                        Receber atualizações sobre propostas e clientes
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.email}
                      onChange={(e) =>
                        setNotifications({ ...notifications, email: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-t">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Notificações Push</p>
                      <p className="text-sm text-gray-600">Receber notificações no navegador</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.push}
                      onChange={(e) =>
                        setNotifications({ ...notifications, push: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-t">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Notificações SMS</p>
                      <p className="text-sm text-gray-600">Receber alertas importantes por SMS</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.sms}
                      onChange={(e) =>
                        setNotifications({ ...notifications, sms: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'aparencia':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tema</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border-2 border-blue-500 rounded-lg p-4 cursor-pointer">
                  <div className="w-full h-20 bg-white border rounded mb-2"></div>
                  <p className="text-sm font-medium text-center">Claro</p>
                </div>
                <div className="border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400">
                  <div className="w-full h-20 bg-gray-800 border rounded mb-2"></div>
                  <p className="text-sm font-medium text-center">Escuro</p>
                </div>
                <div className="border-2 border-gray-300 rounded-lg p-4 cursor-pointer hover:border-gray-400">
                  <div className="w-full h-20 bg-gradient-to-r from-white to-gray-800 border rounded mb-2"></div>
                  <p className="text-sm font-medium text-center">Sistema</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Idioma</h3>
              <select className="block w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
          </div>
        );

      case 'empresa':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Empresa</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    defaultValue="Fênix CRM Solutions Ltda"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                  <input
                    type="text"
                    defaultValue="12.345.678/0001-90"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail Corporativo
                  </label>
                  <input
                    type="email"
                    defaultValue="contato@fenixcrm.com"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone Comercial
                  </label>
                  <input
                    type="tel"
                    defaultValue="(11) 3333-4444"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logradouro</label>
                  <input
                    type="text"
                    defaultValue="Av. Paulista, 1234"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <input
                    type="text"
                    defaultValue="São Paulo"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                  <input
                    type="text"
                    defaultValue="01310-100"
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'sistema':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Sistema</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Versão:</span>
                  <span className="text-sm text-gray-900">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Última Atualização:</span>
                  <span className="text-sm text-gray-900">10/12/2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Status do Sistema:</span>
                  <span className="text-sm text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Backup & Restauração</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-300 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Backup Automático</p>
                    <p className="text-sm text-gray-600">Último backup: Hoje, 03:00</p>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                    Fazer Backup
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Logs do Sistema</h3>
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <div className="space-y-1 text-gray-700">
                  <div>[2024-12-10 14:30:12] INFO: Sistema iniciado com sucesso</div>
                  <div>[2024-12-10 14:29:45] INFO: Conectado ao banco de dados</div>
                  <div>[2024-12-10 14:29:30] INFO: Carregando configurações...</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="CRM"
          nucleusPath="/nuclei/crm"
          currentModuleName="Configurações"
        />
      </div>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <p className="text-gray-600">Gerencie suas preferências e configurações do sistema</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 bg-gray-50">
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-8">
              {renderContent()}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-end">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
