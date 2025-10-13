import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  Settings,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Zap,
  MessageSquare,
  Bot,
  Send,
  RefreshCw,
  ExternalLink,
  Key,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

interface IntegracaoConfig {
  id: string;
  tipo: string;
  ativo: boolean;
  credenciais: Record<string, any>;
  ultimoTeste?: Date;
  statusConexao?: 'conectado' | 'desconectado' | 'erro';
}

const IntegracoesPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [testando, setTestando] = useState<string | null>(null);
  const [mostrarSenhas, setMostrarSenhas] = useState<Record<string, boolean>>({});
  const [validandoToken, setValidandoToken] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [testeNumero, setTesteNumero] = useState('');
  const [testeMensagem, setTesteMensagem] = useState('Olá! Esta é uma mensagem de teste do ConectCRM 🚀');

  // Estados para cada integração
  const [whatsappConfig, setWhatsappConfig] = useState({
    ativo: false,
    phone_number_id: '',
    api_token: '',
    webhook_verify_token: '',
    business_account_id: ''
  });

  const [openaiConfig, setOpenaiConfig] = useState({
    ativo: false,
    api_key: '',
    model: 'gpt-4o-mini',
    max_tokens: 2000,
    temperature: 0.7,
    auto_responder: false // ✅ Novo campo
  });

  const [anthropicConfig, setAnthropicConfig] = useState({
    ativo: false,
    api_key: '',
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    auto_responder: false // ✅ Novo campo
  });

  const [telegramConfig, setTelegramConfig] = useState({
    ativo: false,
    bot_token: ''
  });

  const [twilioConfig, setTwilioConfig] = useState({
    ativo: false,
    account_sid: '',
    auth_token: '',
    phone_number: '',
    whatsapp_number: ''
  });

  // Carregar configurações ao montar
  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log('🔍 [Frontend] Carregando configurações...');

      const response = await fetch('/api/atendimento/canais', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const canais = result.data || [];

        console.log('✅ [Frontend] Configurações recebidas:', {
          total: canais.length,
          canais: canais.map((c: any) => ({ tipo: c.tipo, ativo: c.ativo, temCredenciais: !!c.configuracao?.credenciais }))
        });

        // Mapear cada canal para seu estado correspondente
        canais.forEach((canal: any) => {
          console.log('🔍 [Frontend] Processando canal:', canal.tipo, canal);

          // ⚠️ PULAR CANAIS SEM CONFIGURAÇÃO
          if (!canal.configuracao || !canal.configuracao.credenciais) {
            console.warn('⚠️ [Frontend] Canal sem credenciais:', canal.tipo);
            return;
          }

          const credenciais = canal.configuracao.credenciais;

          switch (canal.tipo) {
            case 'whatsapp':
              const whatsappData = {
                ativo: canal.ativo,
                phone_number_id: credenciais.whatsapp_phone_number_id || '',
                api_token: credenciais.whatsapp_api_token || '',
                webhook_verify_token: credenciais.whatsapp_webhook_verify_token || '',
                business_account_id: credenciais.whatsapp_business_account_id || ''
              };
              setWhatsappConfig(whatsappData);
              break;
            case 'openai':
              setOpenaiConfig({
                ativo: canal.ativo,
                api_key: credenciais.openai_api_key || '',
                model: credenciais.openai_model || 'gpt-4o-mini',
                max_tokens: credenciais.openai_max_tokens || 2000,
                temperature: credenciais.openai_temperature || 0.7
              });
              break;
            case 'anthropic':
              setAnthropicConfig({
                ativo: canal.ativo,
                api_key: credenciais.anthropic_api_key || '',
                model: credenciais.anthropic_model || 'claude-3-5-sonnet-20241022',
                max_tokens: credenciais.anthropic_max_tokens || 2000
              });
              break;
            case 'telegram':
              setTelegramConfig({
                ativo: canal.ativo,
                bot_token: credenciais.telegram_bot_token || ''
              });
              break;
            case 'twilio':
              setTwilioConfig({
                ativo: canal.ativo,
                account_sid: credenciais.twilio_account_sid || '',
                auth_token: credenciais.twilio_auth_token || '',
                phone_number: credenciais.twilio_phone_number || '',
                whatsapp_number: credenciais.twilio_whatsapp_number || ''
              });
              break;
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações de integrações');
    } finally {
      setLoading(false);
    }
  };

  const salvarIntegracao = async (tipo: string, config: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');

      // 🔍 PRIMEIRO: Verificar se já existe um canal deste tipo
      console.log('🔍 [Frontend] Verificando se canal existe:', tipo);

      const listaResponse = await fetch('/api/atendimento/canais', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let canalExistente: any = null;
      if (listaResponse.ok) {
        const result = await listaResponse.json();
        const canais = result.data || [];
        // Buscar canal do tipo especificado
        canalExistente = canais.find((c: any) => c.tipo === tipo);

        if (canalExistente) {
          console.log('✅ [Frontend] Canal existente encontrado:', canalExistente.id);
        } else {
          console.log('➕ [Frontend] Nenhum canal existente, criando novo');
        }
      }

      // Mapear config para formato da API
      let credenciais: Record<string, any> = {};

      switch (tipo) {
        case 'whatsapp':
          credenciais = {
            whatsapp_phone_number_id: config.phone_number_id,
            whatsapp_api_token: config.api_token,
            whatsapp_webhook_verify_token: config.webhook_verify_token,
            whatsapp_business_account_id: config.business_account_id
          };
          break;
        case 'openai':
          credenciais = {
            openai_api_key: config.api_key,
            openai_model: config.model,
            openai_max_tokens: config.max_tokens,
            openai_temperature: config.temperature
          };
          break;
        case 'anthropic':
          credenciais = {
            anthropic_api_key: config.api_key,
            anthropic_model: config.model,
            anthropic_max_tokens: config.max_tokens
          };
          break;
        case 'telegram':
          credenciais = {
            telegram_bot_token: config.bot_token
          };
          break;
        case 'twilio':
          credenciais = {
            twilio_account_sid: config.account_sid,
            twilio_auth_token: config.auth_token,
            twilio_phone_number: config.phone_number,
            twilio_whatsapp_number: config.whatsapp_number
          };
          break;
      }

      const requestBody = {
        nome: `${tipo.toUpperCase()} Principal`,
        tipo,
        configuracao: {
          credenciais
        }
      };

      // ✅ Se existe, fazer PUT (atualizar), senão POST (criar)
      const method = canalExistente ? 'PUT' : 'POST';
      const url = canalExistente
        ? `/api/atendimento/canais/${canalExistente.id}`
        : '/api/atendimento/canais';

      console.log('🔍 [Frontend] Enviando configuração:', {
        tipo,
        url,
        method,
        body: requestBody,
        token: token ? 'presente' : 'ausente'
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ [Frontend] Resposta de sucesso:', result);
        const acao = canalExistente ? 'atualizada' : 'criada';
        toast.success(`Integração ${tipo} ${acao} com sucesso!`);
        await carregarConfiguracoes();
      } else {
        const error = await response.json();
        console.error('❌ [Frontend] Erro ao salvar:', error);
        toast.error(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar integração:', error);
      toast.error('Erro ao salvar integração');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🔐 VALIDAR TOKEN WHATSAPP
  // ============================================
  const validarTokenWhatsApp = async () => {
    if (!whatsappConfig.api_token || !whatsappConfig.phone_number_id) {
      toast.error('Preencha o API Token e Phone Number ID primeiro!');
      return;
    }

    setValidandoToken(true);
    setTokenValido(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/atendimento/canais/validar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'whatsapp',
          credenciais: {
            whatsapp_api_token: whatsappConfig.api_token,
            whatsapp_phone_number_id: whatsappConfig.phone_number_id
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTokenValido(true);
        toast.success('✅ Token válido! Conexão com WhatsApp estabelecida.');
      } else {
        setTokenValido(false);
        toast.error(`❌ Token inválido: ${result.message || 'Verifique suas credenciais'}`);
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      setTokenValido(false);
      toast.error('Erro ao validar token WhatsApp');
    } finally {
      setValidandoToken(false);
    }
  };

  // ============================================
  // 📱 ENVIAR MENSAGEM DE TESTE
  // ============================================
  const enviarMensagemTeste = async () => {
    if (!testeNumero) {
      toast.error('Digite um número de telefone para teste!');
      return;
    }

    if (!whatsappConfig.api_token || !whatsappConfig.phone_number_id) {
      toast.error('Configure as credenciais do WhatsApp primeiro!');
      return;
    }

    // Validar formato do número
    const numeroLimpo = testeNumero.replace(/\D/g, '');
    if (numeroLimpo.length < 10) {
      toast.error('Número inválido! Use o formato: 5511999999999');
      return;
    }

    setTestando('whatsapp');

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/atendimento/canais/testar-mensagem', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'whatsapp',
          numero: numeroLimpo,
          mensagem: testeMensagem,
          credenciais: {
            whatsapp_api_token: whatsappConfig.api_token,
            whatsapp_phone_number_id: whatsappConfig.phone_number_id
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('✅ Mensagem enviada com sucesso!');
      } else {
        toast.error(`❌ Erro ao enviar: ${result.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem de teste:', error);
      toast.error('Erro ao enviar mensagem de teste');
    } finally {
      setTestando(null);
    }
  };

  const testarConexao = async (tipo: string) => {
    setTestando(tipo);
    try {
      const token = localStorage.getItem('authToken');

      // Mapear configuração baseado no tipo
      let credenciais: any = {};

      switch (tipo) {
        case 'whatsapp':
          credenciais = {
            whatsapp_api_token: whatsappConfig.api_token,
            whatsapp_phone_number_id: whatsappConfig.phone_number_id,
            whatsapp_business_account_id: whatsappConfig.business_account_id,
          };
          break;
        case 'openai':
          credenciais = {
            openai_api_key: openaiConfig.api_key,
            openai_model: openaiConfig.model || 'gpt-4',
          };
          break;
        case 'anthropic':
          credenciais = {
            anthropic_api_key: anthropicConfig.api_key,
            anthropic_model: anthropicConfig.model || 'claude-3-5-sonnet-20241022',
          };
          break;
        case 'telegram':
          credenciais = {
            telegram_bot_token: telegramConfig.bot_token,
          };
          break;
        case 'twilio':
          credenciais = {
            twilio_account_sid: twilioConfig.account_sid,
            twilio_auth_token: twilioConfig.auth_token,
          };
          break;
      }

      const response = await fetch('/api/atendimento/canais/validar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tipo, credenciais })
      });

      const result = await response.json();

      if (response.ok && result.success && result.data?.valido) {
        toast.success(result.data.mensagem || `Conexão com ${tipo} testada com sucesso!`);
      } else {
        const mensagemErro = result.data?.mensagem || result.message || 'Erro ao testar conexão';
        toast.error(`${tipo}: ${mensagemErro}`);
      }
    } catch (error: any) {
      console.error('Erro ao testar conexão:', error);
      toast.error(`Erro ao testar conexão com ${tipo}: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setTestando(null);
    }
  };

  const toggleMostrarSenha = (campo: string) => {
    setMostrarSenhas(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  if (loading && !whatsappConfig.api_token) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-purple-500" />
            Integrações Omnichannel
          </h1>
          <p className="text-gray-600 mt-1">
            Configure as integrações com serviços externos de mensageria e IA
          </p>
        </div>
        <button
          onClick={carregarConfiguracoes}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Recarregar
        </button>
      </div>

      {/* WhatsApp Business API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-green-500" />
            WhatsApp Business API
            {whatsappConfig.ativo && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Ativo
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Integração oficial do WhatsApp para empresas. Obtenha credenciais em{' '}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Meta Developers <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number ID
              </label>
              <input
                type="text"
                value={whatsappConfig.phone_number_id}
                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, phone_number_id: e.target.value })}
                placeholder="123456789012345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhas['whatsapp_token'] ? 'text' : 'password'}
                  value={whatsappConfig.api_token}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, api_token: e.target.value })}
                  placeholder="EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleMostrarSenha('whatsapp_token')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenhas['whatsapp_token'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook Verify Token
              </label>
              <input
                type="text"
                value={whatsappConfig.webhook_verify_token}
                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, webhook_verify_token: e.target.value })}
                placeholder="seu-token-secreto-webhook"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Account ID (opcional)
              </label>
              <input
                type="text"
                value={whatsappConfig.business_account_id}
                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, business_account_id: e.target.value })}
                placeholder="123456789012345"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* ============================================ */}
            {/* BOTÕES DE AÇÃO */}
            {/* ============================================ */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => salvarIntegracao('whatsapp', whatsappConfig)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Salvar Configuração
              </button>

              <button
                onClick={validarTokenWhatsApp}
                disabled={validandoToken || !whatsappConfig.api_token}
                className="flex items-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {validandoToken ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                Validar Token
              </button>

              {tokenValido !== null && (
                <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${tokenValido
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {tokenValido ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Token Válido
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Token Inválido
                    </>
                  )}
                </span>
              )}
            </div>

            {/* ============================================ */}
            {/* TESTE DE ENVIO DE MENSAGEM */}
            {/* ============================================ */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Testar Envio de Mensagem
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Número de Teste (com DDI)
                  </label>
                  <input
                    type="text"
                    value={testeNumero}
                    onChange={(e) => setTesteNumero(e.target.value)}
                    placeholder="5511999999999"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: DDI + DDD + Número (ex: 5511999999999)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Mensagem de Teste
                  </label>
                  <textarea
                    value={testeMensagem}
                    onChange={(e) => setTesteMensagem(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  onClick={enviarMensagemTeste}
                  disabled={testando === 'whatsapp' || !testeNumero || !whatsappConfig.api_token}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testando === 'whatsapp' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Mensagem de Teste
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-500" />
            OpenAI (GPT-4o, GPT-4o-mini)
            {openaiConfig.ativo && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Ativo
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            IA para respostas automáticas e chatbot. Obtenha sua API Key em{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              OpenAI Platform <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhas['openai_key'] ? 'text' : 'password'}
                  value={openaiConfig.api_key}
                  onChange={(e) => setOpenaiConfig({ ...openaiConfig, api_key: e.target.value })}
                  placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleMostrarSenha('openai_key')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenhas['openai_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
              </label>
              <select
                value={openaiConfig.model}
                onChange={(e) => setOpenaiConfig({ ...openaiConfig, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="gpt-4o">GPT-4o (Mais inteligente)</option>
                <option value="gpt-4o-mini">GPT-4o-mini (Recomendado - rápido e econômico)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais barato)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={openaiConfig.max_tokens}
                  onChange={(e) => setOpenaiConfig({ ...openaiConfig, max_tokens: parseInt(e.target.value) })}
                  min="100"
                  max="4000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (0-1)
                </label>
                <input
                  type="number"
                  value={openaiConfig.temperature}
                  onChange={(e) => setOpenaiConfig({ ...openaiConfig, temperature: parseFloat(e.target.value) })}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* ✅ NOVO: Toggle de Resposta Automática */}
            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    🤖 Respostas Automáticas
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Ativar respostas automáticas via IA para mensagens recebidas no WhatsApp
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={openaiConfig.auto_responder}
                    onChange={(e) => setOpenaiConfig({ ...openaiConfig, auto_responder: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              </label>
              {openaiConfig.auto_responder && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    ✅ Quando ativado, a IA responderá automaticamente às mensagens recebidas no WhatsApp usando o modelo GPT selecionado.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => salvarIntegracao('openai', openaiConfig)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Salvar Configuração
              </button>
              <button
                onClick={() => testarConexao('openai')}
                disabled={testando === 'openai' || !openaiConfig.api_key}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {testando === 'openai' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Testar Conexão
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anthropic Claude */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-purple-500" />
            Anthropic Claude
            {anthropicConfig.ativo && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                Ativo
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Alternativa ao OpenAI com modelos Claude. Obtenha sua API Key em{' '}
            <a
              href="https://console.anthropic.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Anthropic Console <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhas['anthropic_key'] ? 'text' : 'password'}
                  value={anthropicConfig.api_key}
                  onChange={(e) => setAnthropicConfig({ ...anthropicConfig, api_key: e.target.value })}
                  placeholder="sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleMostrarSenha('anthropic_key')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenhas['anthropic_key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modelo
              </label>
              <select
                value={anthropicConfig.model}
                onChange={(e) => setAnthropicConfig({ ...anthropicConfig, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Recomendado)</option>
                <option value="claude-3-opus-20240229">Claude 3 Opus (Mais inteligente)</option>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku (Mais rápido)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                value={anthropicConfig.max_tokens}
                onChange={(e) => setAnthropicConfig({ ...anthropicConfig, max_tokens: parseInt(e.target.value) })}
                min="100"
                max="4000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* ✅ NOVO: Toggle de Resposta Automática */}
            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    🤖 Respostas Automáticas
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    Ativar respostas automáticas via IA para mensagens recebidas no WhatsApp
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={anthropicConfig.auto_responder}
                    onChange={(e) => setAnthropicConfig({ ...anthropicConfig, auto_responder: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </div>
              </label>
              {anthropicConfig.auto_responder && (
                <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-xs text-purple-800">
                    ✅ Quando ativado, a IA responderá automaticamente às mensagens recebidas no WhatsApp usando o modelo Claude selecionado.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => salvarIntegracao('anthropic', anthropicConfig)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Salvar Configuração
              </button>
              <button
                onClick={() => testarConexao('anthropic')}
                disabled={testando === 'anthropic' || !anthropicConfig.api_key}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {testando === 'anthropic' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Testar Conexão
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Telegram Bot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Send className="w-6 h-6 text-cyan-500" />
            Telegram Bot
            {telegramConfig.ativo && (
              <span className="px-2 py-1 text-xs bg-cyan-100 text-cyan-800 rounded-full">
                Ativo
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Crie um bot através do @BotFather no Telegram e cole o token aqui
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhas['telegram_token'] ? 'text' : 'password'}
                  value={telegramConfig.bot_token}
                  onChange={(e) => setTelegramConfig({ ...telegramConfig, bot_token: e.target.value })}
                  placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz012345678"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleMostrarSenha('telegram_token')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenhas['telegram_token'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <h4 className="font-medium text-cyan-900 mb-2">Como criar um bot no Telegram:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-cyan-800">
                <li>Abra o Telegram e procure por @BotFather</li>
                <li>Envie o comando /newbot</li>
                <li>Escolha um nome e username para o bot</li>
                <li>Copie o token fornecido e cole acima</li>
              </ol>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => salvarIntegracao('telegram', telegramConfig)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Salvar Configuração
              </button>
              <button
                onClick={() => testarConexao('telegram')}
                disabled={testando === 'telegram' || !telegramConfig.bot_token}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {testando === 'telegram' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Testar Conexão
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Twilio (SMS + WhatsApp) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-red-500" />
            Twilio (SMS + WhatsApp)
            {twilioConfig.ativo && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                Ativo
              </span>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Envie SMS e mensagens WhatsApp via Twilio. Configure em{' '}
            <a
              href="https://www.twilio.com/console"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              Twilio Console <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account SID
              </label>
              <input
                type="text"
                value={twilioConfig.account_sid}
                onChange={(e) => setTwilioConfig({ ...twilioConfig, account_sid: e.target.value })}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Token
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhas['twilio_token'] ? 'text' : 'password'}
                  value={twilioConfig.auth_token}
                  onChange={(e) => setTwilioConfig({ ...twilioConfig, auth_token: e.target.value })}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => toggleMostrarSenha('twilio_token')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarSenhas['twilio_token'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (SMS)
              </label>
              <input
                type="text"
                value={twilioConfig.phone_number}
                onChange={(e) => setTwilioConfig({ ...twilioConfig, phone_number: e.target.value })}
                placeholder="+5511999999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={twilioConfig.whatsapp_number}
                onChange={(e) => setTwilioConfig({ ...twilioConfig, whatsapp_number: e.target.value })}
                placeholder="whatsapp:+14155238886"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => salvarIntegracao('twilio', twilioConfig)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                Salvar Configuração
              </button>
              <button
                onClick={() => testarConexao('twilio')}
                disabled={testando === 'twilio' || !twilioConfig.account_sid}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {testando === 'twilio' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                Testar Conexão
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aviso de Segurança */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 mb-1">Segurança das Credenciais</h3>
              <p className="text-sm text-amber-800">
                Todas as credenciais são armazenadas de forma criptografada no banco de dados.
                Nunca compartilhe suas chaves de API e sempre use tokens com permissões mínimas necessárias.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegracoesPage;
