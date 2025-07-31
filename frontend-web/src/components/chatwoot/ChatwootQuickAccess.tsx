import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle as ChatIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as ErrorIcon,
  RefreshCw as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Users as PeopleIcon,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface ChatwootQuickAccessProps {
  className?: string;
  showStats?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface ChatwootStats {
  conversations: {
    open: number;
    resolved: number;
    pending: number;
    total: number;
  };
  service: string;
  timestamp: string;
}

const ChatwootQuickAccess: React.FC<ChatwootQuickAccessProps> = ({
  className = '',
  showStats = true,
  size = 'medium'
}) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<ChatwootStats | null>(null);
  const [error, setError] = useState<string>('');

  // Verificar status da conexão
  const checkStatus = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/chatwoot/status');
      const data = response.data;

      setConnected(data.success && data.status === 'connected');

      if (data.success && data.status === 'connected' && showStats) {
        await loadStats();
      }
    } catch (err) {
      console.error('❌ Erro ao verificar status:', err);
      setConnected(false);
      setError('Erro ao conectar');
    } finally {
      setLoading(false);
    }
  };

  // Testar conexão Chatwoot
  const testConnection = async (): Promise<void> => {
    try {
      setLoading(true);

      const response = await api.post('/chatwoot/test-connection');
      const data = response.data;

      if (data.success) {
        toast.success('✅ Conexão testada com sucesso!');
        // Recarregar status após teste bem-sucedido
        await checkStatus();
      } else {
        toast.error(`❌ Erro: ${data.message || 'Falha no teste de conexão'}`);
      }
    } catch (err) {
      console.error('❌ Erro no teste de conexão:', err);
      toast.error('Erro ao testar conexão com Chatwoot');
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async (): Promise<void> => {
    try {
      const response = await fetch('/api/chatwoot/stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
    }
  };

  // Verificar status inicial
  useEffect(() => {
    checkStatus();
  }, []);

  // Definir tamanhos baseado na prop size
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          card: 'min-h-[120px]',
          title: 'text-base',
          subtitle: 'text-xs',
          icon: 'w-8 h-8',
          iconInner: 'w-4 h-4',
          stats: 'text-sm',
          button: 'text-xs px-3 py-1'
        };
      case 'large':
        return {
          card: 'min-h-[200px]',
          title: 'text-xl',
          subtitle: 'text-sm',
          icon: 'w-16 h-16',
          iconInner: 'w-8 h-8',
          stats: 'text-lg',
          button: 'text-sm px-4 py-2'
        };
      default: // medium
        return {
          card: 'min-h-[160px]',
          title: 'text-lg',
          subtitle: 'text-sm',
          icon: 'w-12 h-12',
          iconInner: 'w-6 h-6',
          stats: 'text-base',
          button: 'text-sm px-3 py-2'
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div
      className={`${className} ${sizeClasses.card} bg-white border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 ${connected ? 'border-l-green-500 bg-gradient-to-br from-green-50 to-green-100' : 'border-l-red-500 bg-gradient-to-br from-red-50 to-red-100'
        }`}
    >
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`${sizeClasses.icon} rounded-xl flex items-center justify-center ${connected
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-600'
              }`}>
              <ChatIcon className={sizeClasses.iconInner} />
            </div>

            <div>
              <h3 className={`font-bold ${sizeClasses.title} ${connected ? 'text-green-800' : 'text-red-800'
                }`}>
                Chatwoot
              </h3>
              <p className={`${sizeClasses.subtitle} ${connected ? 'text-green-600' : 'text-red-600'
                }`}>
                Atendimento WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${connected
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
              {connected ? <CheckCircleIcon className="w-3 h-3" /> : <ErrorIcon className="w-3 h-3" />}
              {connected ? 'Conectado' : 'Desconectado'}
            </span>

            <button
              onClick={checkStatus}
              disabled={loading}
              className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${loading ? 'animate-spin' : ''}`}
              title="Atualizar status"
            >
              <RefreshIcon className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
            <ErrorIcon className="w-4 h-4 inline-block mr-1" />
            {error}
          </div>
        )}

        {/* Estatísticas */}
        {showStats && connected && stats && (
          <div className="flex-1 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/60 rounded-lg p-3 text-center border border-white/20">
                <div className={`font-bold ${sizeClasses.stats} text-blue-600`}>
                  {stats.conversations.open}
                </div>
                <div className="text-xs text-gray-600">Abertas</div>
              </div>

              <div className="bg-white/60 rounded-lg p-3 text-center border border-white/20">
                <div className={`font-bold ${sizeClasses.stats} text-green-600`}>
                  {stats.conversations.total}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>

            {stats.conversations.open > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                <TrendingUpIcon className="w-3 h-3" />
                <span>{stats.conversations.open} conversas aguardando atendimento</span>
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="space-y-2">
          {connected ? (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/configuracoes/chatwoot" className="block">
                <button className={`w-full ${sizeClasses.button} border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1`}>
                  <SettingsIcon className="w-4 h-4" />
                  Configurar
                </button>
              </Link>

              <button
                className={`w-full ${sizeClasses.button} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1`}
                onClick={() => window.open(process.env.REACT_APP_CHATWOOT_BASE_URL || 'http://localhost:3000', '_blank')}
              >
                <PeopleIcon className="w-4 h-4" />
                Atender
              </button>
            </div>
          ) : (
            <Link to="/configuracoes/chatwoot" className="block">
              <button className={`w-full ${sizeClasses.button} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1`}>
                <SettingsIcon className="w-4 h-4" />
                Configurar Integração
              </button>
            </Link>
          )}
        </div>

        {/* Timestamp */}
        {stats && (
          <p className="text-gray-500 text-center mt-2 text-xs">
            Atualizado em {new Date(stats.timestamp).toLocaleTimeString('pt-BR')}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatwootQuickAccess;
