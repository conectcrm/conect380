import React from 'react';
import { EstatisticasUsuarios, ROLE_LABELS, UserRole } from '../../../../types/usuarios/index';
import { Users, UserCheck, UserX, Crown } from 'lucide-react';

interface EstatisticasCardsProps {
  estatisticas: EstatisticasUsuarios | null;
  loading?: boolean;
}

export const EstatisticasCards: React.FC<EstatisticasCardsProps> = ({ estatisticas, loading = false }) => {
  const safeStats: EstatisticasUsuarios = estatisticas || {
    totalUsuarios: 0,
    usuariosAtivos: 0,
    usuariosInativos: 0,
    distribuicaoPorRole: {
      admin: 0,
      manager: 0,
      vendedor: 0,
      user: 0,
    },
    ultimosLogins: 0,
  };
  const safeDistribuicao = safeStats.distribuicaoPorRole || {};
  const cards = [
    {
      titulo: 'Total de Usuários',
      valor: safeStats.totalUsuarios || 0,
      icone: Users,
      cor: 'text-blue-600',
      fundo: 'bg-blue-50'
    },
    {
      titulo: 'Usuários Ativos',
      valor: safeStats.usuariosAtivos || 0,
      icone: UserCheck,
      cor: 'text-green-600',
      fundo: 'bg-green-50'
    },
    {
      titulo: 'Usuários Inativos',
      valor: safeStats.usuariosInativos || 0,
      icone: UserX,
      cor: 'text-red-600',
      fundo: 'bg-red-50'
    },
    {
      titulo: 'Administradores',
      valor: safeDistribuicao[UserRole.ADMIN] || 0,
      icone: Crown,
      cor: 'text-purple-600',
      fundo: 'bg-purple-50'
    }
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icone = card.icone;

          return (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.titulo}
                  </p>
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      {card.valor.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className={`${card.fundo} p-3 rounded-lg`}>
                  <Icone className={`w-6 h-6 ${card.cor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribuição por Role */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Perfil</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            // Elementos de carregamento
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="text-center">
                <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mx-auto mb-1"></div>
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded mx-auto"></div>
              </div>
            ))
          ) : (
            // Dados reais
            Object.entries(safeDistribuicao).map(([role, quantidade]) => (
              <div key={role} className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {typeof quantidade === 'number' ? quantidade : 0}
                </div>
                <div className="text-sm text-gray-600">
                  {ROLE_LABELS[role as UserRole]}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
