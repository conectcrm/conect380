import React from 'react';
import { 
  Activity, 
  Clock, 
  User, 
  UserPlus, 
  UserMinus, 
  Settings, 
  Shield,
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Atividade } from '../hooks/useAtividadesUsuarios';

interface DashboardAtividadesProps {
  atividades: Atividade[];
  loading?: boolean;
  error?: string | null;
  maxItems?: number;
}

export const DashboardAtividades: React.FC<DashboardAtividadesProps> = ({
  atividades,
  loading = false,
  error = null
}) => {
  const getIconeAtividade = (tipo: Atividade['tipo']) => {
    switch (tipo) {
      case 'LOGIN':
        return <User className="w-4 h-4 text-green-600" />;
      case 'LOGOUT':
        return <User className="w-4 h-4 text-gray-600" />;
      case 'CRIACAO':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'EDICAO':
        return <Settings className="w-4 h-4 text-orange-600" />;
      case 'EXCLUSAO':
        return <UserMinus className="w-4 h-4 text-red-600" />;
      case 'ALTERACAO_STATUS':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'RESET_SENHA':
        return <Shield className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCorAtividade = (tipo: Atividade['tipo']) => {
    switch (tipo) {
      case 'LOGIN':
        return 'bg-green-50 border-green-200';
      case 'LOGOUT':
        return 'bg-gray-50 border-gray-200';
      case 'CRIACAO':
        return 'bg-blue-50 border-blue-200';
      case 'EDICAO':
        return 'bg-orange-50 border-orange-200';
      case 'EXCLUSAO':
        return 'bg-red-50 border-red-200';
      case 'ALTERACAO_STATUS':
        return 'bg-purple-50 border-purple-200';
      case 'RESET_SENHA':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatarTempo = (timestamp: Date) => {
    const agora = new Date();
    const diff = agora.getTime() - timestamp.getTime();
    const minutos = Math.floor(diff / (1000 * 60));
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Agora mesmo';
    if (minutos < 60) return `${minutos}m atrás`;
    if (horas < 24) return `${horas}h atrás`;
    if (dias < 7) return `${dias}d atrás`;
    
    return timestamp.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-[#159A9C]" />
            Atividades Recentes
          </h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-[#159A9C]" />
          Atividades Recentes
        </h3>
        <button className="text-sm text-[#159A9C] hover:text-[#138A8C] flex items-center">
          <Eye className="w-4 h-4 mr-1" />
          Ver todas
        </button>
      </div>

      {error ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-500">{error}</p>
        </div>
      ) : atividades.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma atividade recente</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {atividades.map((atividade) => (
            <div
              key={atividade.id}
              className={`p-3 rounded-lg border ${getCorAtividade(atividade.tipo)} transition-colors hover:shadow-sm`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIconeAtividade(atividade.tipo)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex-shrink-0">
                        {atividade.usuario.avatar_url ? (
                          <img
                            className="h-6 w-6 rounded-full object-cover"
                            src={atividade.usuario.avatar_url}
                            alt={atividade.usuario.nome}
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {atividade.usuario.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {atividade.usuario.nome}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatarTempo(atividade.timestamp)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-1">
                    {atividade.descricao}
                  </p>
                  
                  {atividade.detalhes && (
                    <p className="text-xs text-gray-500 mt-1">
                      {atividade.detalhes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
