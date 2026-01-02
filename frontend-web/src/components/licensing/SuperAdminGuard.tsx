import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SuperAdminGuardProps {
  children: React.ReactNode;
}

const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[#159A9C] mb-4"></div>
          <p className="text-gray-600 text-lg">Validando permissões avançadas...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-red-100 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-[#002333] mb-2">Acesso restrito</h2>
          <p className="text-gray-600 mb-4">
            Esta área é exclusiva para usuários com perfil <strong>Super Admin</strong>. Solicite ao
            administrador principal a concessão do acesso ou volte para o painel principal.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
          >
            Ir para o dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SuperAdminGuard;
