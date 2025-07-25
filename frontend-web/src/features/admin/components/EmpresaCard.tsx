import React from 'react';
import {
  Building2,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from 'lucide-react';

interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  plano: 'starter' | 'professional' | 'enterprise';
  status: 'ativa' | 'trial' | 'suspensa' | 'inativa';
  usuariosAtivos: number;
  clientesCadastrados: number;
  ultimoAcesso: Date;
  dataExpiracao: Date;
  valorMensal: number;
}

interface EmpresaCardProps {
  empresa: Empresa;
  onClick: () => void;
}

export const EmpresaCard: React.FC<EmpresaCardProps> = ({ empresa, onClick }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ativa':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          label: 'Ativa'
        };
      case 'trial':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          label: 'Trial'
        };
      case 'suspensa':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          label: 'Suspensa'
        };
      case 'inativa':
        return {
          icon: Ban,
          color: 'text-red-600',
          bg: 'bg-red-50',
          border: 'border-red-200',
          label: 'Inativa'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          label: 'Desconhecido'
        };
    }
  };

  const getPlanoConfig = (plano: string) => {
    switch (plano) {
      case 'starter':
        return {
          label: 'Starter',
          color: 'text-blue-600',
          bg: 'bg-blue-100'
        };
      case 'professional':
        return {
          label: 'Professional',
          color: 'text-purple-600',
          bg: 'bg-purple-100'
        };
      case 'enterprise':
        return {
          label: 'Enterprise',
          color: 'text-orange-600',
          bg: 'bg-orange-100'
        };
      default:
        return {
          label: 'Básico',
          color: 'text-gray-600',
          bg: 'bg-gray-100'
        };
    }
  };

  const statusConfig = getStatusConfig(empresa.status);
  const planoConfig = getPlanoConfig(empresa.plano);
  const StatusIcon = statusConfig.icon;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isExpiringSoon = () => {
    const today = new Date();
    const daysUntilExpiration = Math.ceil(
      (empresa.dataExpiracao.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#159A9C] rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {empresa.nome}
            </h3>
            <p className="text-sm text-gray-500">
              {empresa.cnpj}
            </p>
          </div>
        </div>

        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.border} border`}>
          <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
          <span className={`text-xs font-medium ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Informações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Plano:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${planoConfig.bg} ${planoConfig.color}`}>
            {planoConfig.label}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Usuários:</span>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {empresa.usuariosAtivos}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Clientes:</span>
          <span className="text-sm font-medium text-gray-900">
            {empresa.clientesCadastrados.toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Último acesso:</span>
          <span className="text-sm text-gray-900">
            {formatDate(empresa.ultimoAcesso)}
          </span>
        </div>

        {empresa.status !== 'inativa' && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Expira em:</span>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className={`text-sm font-medium ${isExpiringSoon() ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(empresa.dataExpiracao)}
                </span>
              </div>
            </div>

            {empresa.valorMensal > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Valor mensal:</span>
                <span className="text-sm font-semibold text-green-600">
                  {formatCurrency(empresa.valorMensal)}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Alertas */}
      {isExpiringSoon() && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              Expira em breve!
            </span>
          </div>
        </div>
      )}

      {empresa.status === 'trial' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700">
            Período de teste ativo
          </span>
        </div>
      )}
    </div>
  );
};
