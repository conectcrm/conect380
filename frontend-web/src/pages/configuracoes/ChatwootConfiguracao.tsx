import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  MessageCircle,
  Settings,
  CheckCircle,
  XCircle,
  Users,
  Inbox,
  Save,
  TestTube,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Phone,
  Globe,
  Key,
  User,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';

interface ChatwootConfig {
  url: string;
  accessToken: string;
  apiKey: string;
  webhookUrl: string;
  enableNotifications: boolean;
  autoAssign: boolean;
  defaultAgentId?: string;
}

interface ChatwootInbox {
  id: number;
  name: string;
  channel_type: string;
  phone_number?: string;
  provider?: string;
  status: 'active' | 'inactive';
  webhook_url?: string;
}

interface ChatwootAgent {
  id: number;
  name: string;
  email: string;
  account_id: number;
  role: string;
  confirmed: boolean;
  availability_status: string;
}

interface ChatwootStats {
  total_conversations: number;
  open_conversations: number;
  resolved_conversations: number;
  pending_conversations: number;
  agents_online: number;
  total_agents: number;
}

const ChatwootConfiguracao: React.FC = () => {
  const [config, setConfig] = useState<ChatwootConfig>({
    url: '',
    accessToken: '',
    apiKey: '',
    webhookUrl: '',
    enableNotifications: true,
    autoAssign: false
  });

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [inboxes, setInboxes] = useState<ChatwootInbox[]>([]);
  const [agents, setAgents] = useState<ChatwootAgent[]>([]);
  const [stats, setStats] = useState<ChatwootStats | null>(null);
  const [activeTab, setActiveTab] = useState('configuracao');

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('conectcrm-chatwoot-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        // Testar conexão automaticamente se houver configuração
        if (parsedConfig.url && parsedConfig.accessToken) {
          testConnection(parsedConfig);
        }
      } catch (error) {
        console.error('Erro ao carregar configuração do Chatwoot:', error);
      }
    }
  }, []);

  // Testar conexão com Chatwoot
  const testConnection = async (configToTest = config) => {
    if (!configToTest.url || !configToTest.accessToken) {
      toast.error('URL e Token de Acesso são obrigatórios');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const baseUrl = configToTest.url.replace(/\/$/, '');

      // Testar conexão com API do Chatwoot
      const response = await fetch(`${baseUrl}/api/v1/accounts/1/inboxes`, {
        headers: {
          'Authorization': `Bearer ${configToTest.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInboxes(data.payload || []);
        setIsConnected(true);
        setTestResult({
          success: true,
          message: 'Conexão estabelecida com sucesso!',
          data: data
        });
        toast.success('Conectado ao Chatwoot com sucesso!');

        // Carregar agentes e estatísticas
        await Promise.all([
          loadAgents(configToTest),
          loadStats(configToTest)
        ]);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        setIsConnected(false);
        setTestResult({
          success: false,
          message: `Erro na conexão: ${response.status} - ${errorData.message || 'Verifique URL e token'}`,
          error: errorData
        });
        toast.error(`Erro na conexão: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setIsConnected(false);
      setTestResult({
        success: false,
        message: `Erro de rede: ${error instanceof Error ? error.message : 'Verifique a URL'}`,
        error: error
      });
      toast.error('Erro de conexão com o Chatwoot');
    } finally {
      setIsTesting(false);
    }
  };

  // Carregar agentes
  const loadAgents = async (configToUse = config) => {
    if (!configToUse.url || !configToUse.accessToken) return;

    try {
      const baseUrl = configToUse.url.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/v1/accounts/1/agents`, {
        headers: {
          'Authorization': `Bearer ${configToUse.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.payload || []);
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    }
  };

  // Carregar estatísticas
  const loadStats = async (configToUse = config) => {
    if (!configToUse.url || !configToUse.accessToken) return;

    try {
      const baseUrl = configToUse.url.replace(/\/$/, '');

      // Simular estatísticas (adapte conforme API do Chatwoot)
      const conversationsResponse = await fetch(`${baseUrl}/api/v1/accounts/1/conversations`, {
        headers: {
          'Authorization': `Bearer ${configToUse.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (conversationsResponse.ok) {
        const conversationsData = await conversationsResponse.json();
        const conversations = conversationsData.data?.payload || [];

        setStats({
          total_conversations: conversations.length,
          open_conversations: conversations.filter((c: any) => c.status === 'open').length,
          resolved_conversations: conversations.filter((c: any) => c.status === 'resolved').length,
          pending_conversations: conversations.filter((c: any) => c.status === 'pending').length,
          agents_online: agents.filter(a => a.availability_status === 'online').length,
          total_agents: agents.length
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Salvar configurações
  const saveConfig = () => {
    setIsLoading(true);

    try {
      localStorage.setItem('conectcrm-chatwoot-config', JSON.stringify(config));
      toast.success('Configurações salvas com sucesso!');

      // Testar conexão após salvar
      if (config.url && config.accessToken) {
        testConnection();
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'configuracao', label: 'Configuração', icon: Settings },
    { id: 'inboxes', label: 'Inboxes', icon: Inbox },
    { id: 'agentes', label: 'Agentes', icon: Users },
    { id: 'estatisticas', label: 'Estatísticas', icon: MessageCircle }
  ];

  const renderConfigTab = () => (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <div className={`p-4 rounded-lg border ${isConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center">
          {isConnected ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">Conectado ao Chatwoot</span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">Desconectado</span>
            </>
          )}
          <button
            onClick={() => testConnection()}
            disabled={isTesting}
            className="ml-auto flex items-center px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Testando...' : 'Testar'}
          </button>
        </div>
      </div>

      {/* Configurações Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Globe className="h-4 w-4 inline mr-1" />
            URL do Chatwoot
          </label>
          <input
            type="url"
            value={config.url}
            onChange={(e) => setConfig({ ...config, url: e.target.value })}
            placeholder="https://seu-chatwoot.com"
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            URL completa da sua instância do Chatwoot
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Key className="h-4 w-4 inline mr-1" />
            Token de Acesso
          </label>
          <input
            type="password"
            value={config.accessToken}
            onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
            placeholder="Seu token de acesso da API"
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Token gerado no Chatwoot (Profile → Access Tokens)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Key className="h-4 w-4 inline mr-1" />
            API Key (Opcional)
          </label>
          <input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            placeholder="Chave da API para webhooks"
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ExternalLink className="h-4 w-4 inline mr-1" />
            URL do Webhook
          </label>
          <input
            type="url"
            value={config.webhookUrl}
            onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            placeholder="https://seu-sistema.com/webhook/chatwoot"
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Configurações Avançadas */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Configurações Avançadas</h4>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enableNotifications}
              onChange={(e) => setConfig({ ...config, enableNotifications: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Habilitar notificações em tempo real</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.autoAssign}
              onChange={(e) => setConfig({ ...config, autoAssign: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Atribuição automática de conversas</span>
          </label>
        </div>

        {config.autoAssign && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agente Padrão
            </label>
            <select
              value={config.defaultAgentId || ''}
              onChange={(e) => setConfig({ ...config, defaultAgentId: e.target.value })}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione um agente</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id.toString()}>
                  {agent.name} ({agent.email})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Resultado do Teste */}
      {testResult && (
        <div className={`p-4 rounded-lg border ${testResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start">
            {testResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {testResult.message}
              </p>
              {testResult.data && (
                <p className="text-sm text-gray-600 mt-1">
                  {testResult.data.payload?.length || 0} inbox(es) encontrado(s)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={() => testConnection()}
          disabled={isTesting || !config.url || !config.accessToken}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <TestTube className="h-4 w-4 mr-2" />
          {isTesting ? 'Testando...' : 'Testar Conexão'}
        </button>

        <button
          onClick={saveConfig}
          disabled={isLoading}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );

  const renderInboxesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Inboxes do Chatwoot</h3>
        <button
          onClick={() => loadAgents()}
          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Atualizar
        </button>
      </div>

      {inboxes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum inbox encontrado</p>
          <p className="text-sm text-gray-400 mt-1">
            Configure a conexão primeiro ou crie inboxes no Chatwoot
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inboxes.map(inbox => (
            <div key={inbox.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{inbox.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${inbox.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                  }`}>
                  {inbox.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Tipo: <span className="font-medium">{inbox.channel_type}</span>
              </p>
              {inbox.phone_number && (
                <p className="text-sm text-gray-600">
                  <Phone className="h-4 w-4 inline mr-1" />
                  {inbox.phone_number}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAgentsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Agentes do Chatwoot</h3>
        <button
          onClick={() => loadAgents()}
          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Atualizar
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum agente encontrado</p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confirmado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agents.map(agent => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${agent.availability_status === 'online'
                        ? 'bg-green-100 text-green-800'
                        : agent.availability_status === 'busy'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                      {agent.availability_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {agent.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {agent.confirmed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Estatísticas do Chatwoot</h3>

      {!stats ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Carregando estatísticas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Conversas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_conversations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Conversas Abertas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.open_conversations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Resolvidas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved_conversations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Agentes Online</p>
                <p className="text-2xl font-bold text-gray-900">{stats.agents_online}/{stats.total_agents}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <MessageCircle className="h-8 w-8 text-blue-600 mr-3" />
          Configuração do Chatwoot
        </h2>
        <p className="text-gray-600 mt-1">
          Configure a integração com o Chatwoot para atendimento via WhatsApp e outros canais
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="py-6">
        {activeTab === 'configuracao' && renderConfigTab()}
        {activeTab === 'inboxes' && renderInboxesTab()}
        {activeTab === 'agentes' && renderAgentsTab()}
        {activeTab === 'estatisticas' && renderStatsTab()}
      </div>
    </div>
  );
};

export default ChatwootConfiguracao;
