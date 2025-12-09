import React, { useState } from 'react';
import {
  MessageSquare,
  Mail,
  Webhook,
  Globe,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';

export const CanaisTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WhatsApp Configuration
  const [whatsappConfig, setWhatsappConfig] = useState({
    ativo: false,
    metaAppId: '',
    metaAppSecret: '',
    phoneNumberId: '',
    businessAccountId: '',
    accessToken: '',
    webhookVerifyToken: '',
  });

  // Email/SMTP Configuration
  const [emailConfig, setEmailConfig] = useState({
    ativo: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: '',
    useTls: true,
  });

  // Chat Widget Configuration
  const [chatConfig, setChatConfig] = useState({
    ativo: false,
    widgetColor: '#159A9C',
    widgetPosition: 'bottom-right' as 'bottom-right' | 'bottom-left',
    welcomeMessage: 'Olá! Como posso ajudar você hoje?',
    allowedDomains: [''],
  });

  // Webhook Configuration
  const [webhookConfig, setWebhookConfig] = useState({
    ativo: false,
    url: '',
    secret: '',
    eventos: [] as string[],
  });

  const [showSensitiveData, setShowSensitiveData] = useState({
    metaAppSecret: false,
    accessToken: false,
    smtpPassword: false,
    webhookSecret: false,
  });

  const handleSaveWhatsApp = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar chamada ao backend
      // await canalService.configurarWhatsApp(whatsappConfig);

      // Simulação
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error('Erro ao salvar WhatsApp:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar chamada ao backend
      // await canalService.configurarEmail(emailConfig);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error('Erro ao salvar Email:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChat = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar chamada ao backend
      // await canalService.configurarChat(chatConfig);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error('Erro ao salvar Chat:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Implementar chamada ao backend
      // await canalService.configurarWebhook(webhookConfig);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      console.error('Erro ao salvar Webhook:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const toggleShowSensitive = (field: keyof typeof showSensitiveData) => {
    setShowSensitiveData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-6">
      {/* Mensagem de Sucesso/Erro */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Configurações salvas com sucesso!</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Erro ao salvar</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* WhatsApp Business API */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 mr-3 text-[#159A9C]" />
            <div>
              <h3 className="text-lg font-semibold text-[#002333]">WhatsApp Business API</h3>
              <p className="text-sm text-[#64748B] mt-1">
                Configure a integração com Meta WhatsApp Business Platform
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappConfig.ativo}
              onChange={(e) => setWhatsappConfig({ ...whatsappConfig, ativo: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#159A9C]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#159A9C]"></div>
          </label>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Meta App ID
              </label>
              <input
                type="text"
                value={whatsappConfig.metaAppId}
                onChange={(e) =>
                  setWhatsappConfig({ ...whatsappConfig, metaAppId: e.target.value })
                }
                disabled={!whatsappConfig.ativo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="123456789012345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Meta App Secret
              </label>
              <div className="relative">
                <input
                  type={showSensitiveData.metaAppSecret ? 'text' : 'password'}
                  value={whatsappConfig.metaAppSecret}
                  onChange={(e) =>
                    setWhatsappConfig({ ...whatsappConfig, metaAppSecret: e.target.value })
                  }
                  disabled={!whatsappConfig.ativo}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSensitive('metaAppSecret')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#159A9C]"
                >
                  {showSensitiveData.metaAppSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Phone Number ID
              </label>
              <input
                type="text"
                value={whatsappConfig.phoneNumberId}
                onChange={(e) =>
                  setWhatsappConfig({ ...whatsappConfig, phoneNumberId: e.target.value })
                }
                disabled={!whatsappConfig.ativo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="109876543210987"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Business Account ID
              </label>
              <input
                type="text"
                value={whatsappConfig.businessAccountId}
                onChange={(e) =>
                  setWhatsappConfig({ ...whatsappConfig, businessAccountId: e.target.value })
                }
                disabled={!whatsappConfig.ativo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="123456789012345"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Access Token (Permanente)
            </label>
            <div className="relative">
              <input
                type={showSensitiveData.accessToken ? 'text' : 'password'}
                value={whatsappConfig.accessToken}
                onChange={(e) =>
                  setWhatsappConfig({ ...whatsappConfig, accessToken: e.target.value })
                }
                disabled={!whatsappConfig.ativo}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <button
                type="button"
                onClick={() => toggleShowSensitive('accessToken')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#159A9C]"
              >
                {showSensitiveData.accessToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Webhook Verify Token
            </label>
            <input
              type="text"
              value={whatsappConfig.webhookVerifyToken}
              onChange={(e) =>
                setWhatsappConfig({ ...whatsappConfig, webhookVerifyToken: e.target.value })
              }
              disabled={!whatsappConfig.ativo}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="seu_token_secreto_aqui"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Token usado para verificar webhooks do Meta WhatsApp
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#159A9C] hover:text-[#0F7B7D] flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Acessar Meta App Dashboard
            </a>
            <button
              onClick={handleSaveWhatsApp}
              disabled={loading || !whatsappConfig.ativo}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar WhatsApp'}
            </button>
          </div>
        </div>
      </div>

      {/* Email/SMTP */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Mail className="h-6 w-6 mr-3 text-[#159A9C]" />
            <div>
              <h3 className="text-lg font-semibold text-[#002333]">Email / SMTP</h3>
              <p className="text-sm text-[#64748B] mt-1">
                Configure servidor de email para notificações e comunicação
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailConfig.ativo}
              onChange={(e) => setEmailConfig({ ...emailConfig, ativo: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#159A9C]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#159A9C]"></div>
          </label>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#002333] mb-2">
                SMTP Host
              </label>
              <input
                type="text"
                value={emailConfig.smtpHost}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                disabled={!emailConfig.ativo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="smtp.gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">Porta</label>
              <input
                type="number"
                value={emailConfig.smtpPort}
                onChange={(e) =>
                  setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) })
                }
                disabled={!emailConfig.ativo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="587"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Usuário SMTP
              </label>
              <input
                type="text"
                value={emailConfig.smtpUser}
                onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                disabled={!emailConfig.ativo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="seu-email@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Senha SMTP
              </label>
              <div className="relative">
                <input
                  type={showSensitiveData.smtpPassword ? 'text' : 'password'}
                  value={emailConfig.smtpPassword}
                  onChange={(e) =>
                    setEmailConfig({ ...emailConfig, smtpPassword: e.target.value })
                  }
                  disabled={!emailConfig.ativo}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => toggleShowSensitive('smtpPassword')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#159A9C]"
                >
                  {showSensitiveData.smtpPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Email de Envio
              </label>
              <input
                type="email"
                value={emailConfig.fromEmail}
                onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                disabled={!emailConfig.ativo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="noreply@suaempresa.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Nome do Remetente
              </label>
              <input
                type="text"
                value={emailConfig.fromName}
                onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                disabled={!emailConfig.ativo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="ConectCRM Atendimento"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="useTls"
              checked={emailConfig.useTls}
              onChange={(e) => setEmailConfig({ ...emailConfig, useTls: e.target.checked })}
              disabled={!emailConfig.ativo}
              className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded disabled:opacity-50"
            />
            <label htmlFor="useTls" className="ml-2 text-sm text-[#002333]">
              Usar TLS/STARTTLS (recomendado)
            </label>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleSaveEmail}
              disabled={loading || !emailConfig.ativo}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Email'}
            </button>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Globe className="h-6 w-6 mr-3 text-[#159A9C]" />
            <div>
              <h3 className="text-lg font-semibold text-[#002333]">Chat Widget (WebChat)</h3>
              <p className="text-sm text-[#64748B] mt-1">
                Configure o widget de chat para seu site
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={chatConfig.ativo}
              onChange={(e) => setChatConfig({ ...chatConfig, ativo: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#159A9C]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#159A9C]"></div>
          </label>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Cor do Widget
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={chatConfig.widgetColor}
                  onChange={(e) => setChatConfig({ ...chatConfig, widgetColor: e.target.value })}
                  disabled={!chatConfig.ativo}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer disabled:opacity-50"
                />
                <input
                  type="text"
                  value={chatConfig.widgetColor}
                  onChange={(e) => setChatConfig({ ...chatConfig, widgetColor: e.target.value })}
                  disabled={!chatConfig.ativo}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="#159A9C"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Posição no Site
              </label>
              <select
                value={chatConfig.widgetPosition}
                onChange={(e) =>
                  setChatConfig({
                    ...chatConfig,
                    widgetPosition: e.target.value as 'bottom-right' | 'bottom-left',
                  })
                }
                disabled={!chatConfig.ativo}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="bottom-right">Inferior Direito</option>
                <option value="bottom-left">Inferior Esquerdo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Mensagem de Boas-Vindas
            </label>
            <textarea
              value={chatConfig.welcomeMessage}
              onChange={(e) => setChatConfig({ ...chatConfig, welcomeMessage: e.target.value })}
              disabled={!chatConfig.ativo}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Olá! Como posso ajudar você hoje?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Domínios Permitidos
            </label>
            <input
              type="text"
              value={chatConfig.allowedDomains.join(', ')}
              onChange={(e) =>
                setChatConfig({
                  ...chatConfig,
                  allowedDomains: e.target.value.split(',').map((d) => d.trim()),
                })
              }
              disabled={!chatConfig.ativo}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="meusite.com, *.meusite.com"
            />
            <p className="text-xs text-[#64748B] mt-1">
              Separados por vírgula. Use * para wildcard.
            </p>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleSaveChat}
              disabled={loading || !chatConfig.ativo}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Chat Widget'}
            </button>
          </div>
        </div>
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Webhook className="h-6 w-6 mr-3 text-[#159A9C]" />
            <div>
              <h3 className="text-lg font-semibold text-[#002333]">Webhooks</h3>
              <p className="text-sm text-[#64748B] mt-1">
                Receba notificações em tempo real de eventos do sistema
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={webhookConfig.ativo}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, ativo: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#159A9C]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#159A9C]"></div>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">URL do Webhook</label>
            <input
              type="url"
              value={webhookConfig.url}
              onChange={(e) => setWebhookConfig({ ...webhookConfig, url: e.target.value })}
              disabled={!webhookConfig.ativo}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="https://seu-servidor.com/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Secret (Assinatura)
            </label>
            <div className="relative">
              <input
                type={showSensitiveData.webhookSecret ? 'text' : 'password'}
                value={webhookConfig.secret}
                onChange={(e) => setWebhookConfig({ ...webhookConfig, secret: e.target.value })}
                disabled={!webhookConfig.ativo}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="••••••••••••••••"
              />
              <button
                type="button"
                onClick={() => toggleShowSensitive('webhookSecret')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[#159A9C]"
              >
                {showSensitiveData.webhookSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Usado para assinar requisições e validar origem
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Eventos para Notificar
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {[
                'atendimento.criado',
                'atendimento.atualizado',
                'atendimento.finalizado',
                'mensagem.recebida',
                'mensagem.enviada',
                'contato.criado',
                'contato.atualizado',
              ].map((evento) => (
                <label key={evento} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={webhookConfig.eventos.includes(evento)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setWebhookConfig({
                          ...webhookConfig,
                          eventos: [...webhookConfig.eventos, evento],
                        });
                      } else {
                        setWebhookConfig({
                          ...webhookConfig,
                          eventos: webhookConfig.eventos.filter((ev) => ev !== evento),
                        });
                      }
                    }}
                    disabled={!webhookConfig.ativo}
                    className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-gray-300 rounded disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-[#002333]">{evento}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleSaveWebhook}
              disabled={loading || !webhookConfig.ativo}
              className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Webhooks'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
