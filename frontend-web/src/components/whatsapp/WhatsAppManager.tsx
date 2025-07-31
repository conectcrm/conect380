import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import {
  MessageCircle,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Phone,
  FileText,
  Settings,
  Smartphone,
  Users,
  RefreshCw,
  Zap
} from 'lucide-react';

interface WhatsAppStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  qrCode?: string;
  clientInfo?: any;
  lastConnected?: string;
}

interface WhatsAppChat {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage?: {
    body: string;
    timestamp: number;
    from: string;
  };
}

const WhatsAppManager: React.FC = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isConnected: false,
    isAuthenticated: false
  });
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<WhatsAppChat[]>([]);
  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);

  // Carregar status inicial
  useEffect(() => {
    loadStatus();
  }, []);

  // Função para carregar status
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setStatus(result.data);

        if (result.data.isConnected) {
          loadChats();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  // Função para carregar chats
  const loadChats = async () => {
    try {
      const response = await fetch('/api/whatsapp/chats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        setChats(result.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
    }
  };

  // Inicializar WhatsApp
  const handleInitialize = async () => {
    setLoading(true);
    setShowQRCode(true);

    try {
      const response = await fetch('/api/whatsapp/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Aguardar um momento e recarregar status
        setTimeout(() => {
          loadStatus();
        }, 2000);
      } else {
        const error = await response.json();
        alert(`Erro: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      alert('Erro ao inicializar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Desconectar WhatsApp
  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar o WhatsApp?')) return;

    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setStatus({
          isConnected: false,
          isAuthenticated: false
        });
        setChats([]);
        setShowQRCode(false);
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enviar mensagem de teste
  const handleSendTest = async () => {
    if (!testNumber.trim()) {
      alert('Digite um número para teste');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: testNumber
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert('Mensagem de teste enviada com sucesso!');
        setTestNumber('');
      } else {
        alert(`Erro: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao enviar teste:', error);
      alert('Erro ao enviar mensagem de teste');
    } finally {
      setLoading(false);
    }
  };

  // Formatar data
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  // Renderizar indicador de status
  const renderStatusIndicator = () => {
    if (status.isConnected) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Conectado</span>
        </div>
      );
    } else if (loading) {
      return (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Conectando...</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Desconectado</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <MessageCircle className="w-8 h-8 text-green-500" />
            WhatsApp Business
          </h1>
          <p className="text-gray-600 mt-1">
            Configure e gerencie o envio de propostas via WhatsApp
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-500" />
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Indicator */}
            <div className="flex items-center justify-between">
              {renderStatusIndicator()}

              <div className="flex gap-2">
                {!status.isConnected ? (
                  <button
                    onClick={handleInitialize}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    {loading ? 'Conectando...' : 'Conectar'}
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Desconectar
                  </button>
                )}
              </div>
            </div>

            {/* QR Code */}
            {status.qrCode && showQRCode && (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <QrCode className="w-5 h-5 text-blue-500" />
                  <span className="font-medium text-gray-700">
                    Escaneie o QR Code com seu WhatsApp
                  </span>
                </div>

                <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                  <img
                    src={status.qrCode}
                    alt="QR Code WhatsApp"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <p className="text-sm text-gray-600 mt-4">
                  1. Abra o WhatsApp no seu celular<br />
                  2. Toque no menu (⋮) e selecione "Dispositivos conectados"<br />
                  3. Toque em "Conectar um dispositivo"<br />
                  4. Escaneie este código QR
                </p>
              </div>
            )}

            {/* Client Info */}
            {status.isConnected && status.clientInfo && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-700">Conectado com sucesso!</span>
                </div>
                <div className="text-sm text-green-600">
                  <p><strong>Nome:</strong> {status.clientInfo.pushname}</p>
                  <p><strong>Número:</strong> +{status.clientInfo.wid?.user}</p>
                  {status.lastConnected && (
                    <p><strong>Última conexão:</strong> {new Date(status.lastConnected).toLocaleString('pt-BR')}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Section */}
      {status.isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              Teste de Envio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número para Teste (com DDD)
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={testNumber}
                    onChange={(e) => setTestNumber(e.target.value)}
                    placeholder="11999999999"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={loading || !testNumber.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Testar
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Digite apenas números (ex: 11999999999)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chats Recentes */}
      {status.isConnected && chats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              Conversas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chats.slice(0, 5).map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {chat.name || 'Sem nome'}
                      </span>
                      {chat.isGroup && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          Grupo
                        </span>
                      )}
                      {chat.unreadCount > 0 && (
                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {chat.lastMessage.body}
                      </p>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <span className="text-xs text-gray-400 ml-2">
                      {formatDate(chat.lastMessage.timestamp)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções de Uso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Como Usar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <h4 className="font-medium text-gray-900 mb-2">📱 Configuração Inicial:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Clique em "Conectar" para gerar o QR Code</li>
                <li>Escaneie com seu WhatsApp pessoal ou empresarial</li>
                <li>Aguarde a confirmação de conexão</li>
                <li>Teste o envio com seu próprio número</li>
              </ol>

              <h4 className="font-medium text-gray-900 mb-2 mt-4">🚀 Funcionalidades:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Envio automático</strong> de propostas via WhatsApp</li>
                <li><strong>Anexo de PDFs</strong> com as propostas</li>
                <li><strong>Mensagens personalizadas</strong> por cliente</li>
                <li><strong>Validação automática</strong> de números</li>
                <li><strong>Histórico</strong> de envios e status</li>
              </ul>

              <h4 className="font-medium text-gray-900 mb-2 mt-4">⚠️ Importante:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Mantenha o navegador aberto durante uso</li>
                <li>Use um WhatsApp Business se possível</li>
                <li>Teste sempre antes de usar em produção</li>
                <li>Respeite as políticas do WhatsApp</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppManager;
