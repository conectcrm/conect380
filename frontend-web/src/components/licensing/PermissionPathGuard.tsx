import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useModulosAtivos } from '../../hooks/useModuloAtivo';
import { canUserAccessPath } from '../../config/menuConfig';

interface PermissionPathGuardProps {
  children: React.ReactNode;
}

const PermissionPathGuard: React.FC<PermissionPathGuardProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [modulosAtivos, loadingModulos] = useModulosAtivos();

  if (loadingModulos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[#159A9C] mb-4"></div>
          <p className="text-gray-600 text-lg">Validando permissoes...</p>
        </div>
      </div>
    );
  }

  const hasAccess = canUserAccessPath(location.pathname, modulosAtivos, user);
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-red-100 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldAlert className="h-7 w-7 text-red-500" />
        </div>
        <h2 className="text-2xl font-semibold text-[#002333] mb-2">Acesso negado</h2>
        <p className="text-gray-600 mb-4">
          Voce nao possui permissao para acessar esta funcionalidade.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors text-sm font-medium"
        >
          Voltar ao dashboard
        </a>
      </div>
    </div>
  );
};

export default PermissionPathGuard;
