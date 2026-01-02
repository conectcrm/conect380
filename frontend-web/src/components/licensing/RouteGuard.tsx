import React from 'react';
import { useModuloAtivo } from '../../hooks/useModuloAtivo';
import { ModuloEnum } from '../../services/modulosService';
import ModuloBloqueado from './ModuloBloqueado';

interface RouteGuardProps {
  modulo: ModuloEnum;
  moduloNome: string;
  moduloDescricao: string;
  preco: string;
  recursos?: string[];
  children: React.ReactNode;
}

/**
 * Guard para proteger rotas que requerem módulo específico licenciado
 *
 * Se o módulo não estiver ativo, exibe tela de bloqueio com opção de contratar
 *
 * @example
 * // Em App.tsx
 * <Route
 *   path="/crm/clientes"
 *   element={
 *     <RouteGuard
 *       modulo={ModuloEnum.CRM}
 *       moduloNome="CRM"
 *       moduloDescricao="Gestão completa de clientes, contatos e relacionamento"
 *       preco="R$ 299"
 *       recursos={['Base de clientes ilimitada', 'Histórico completo', 'Pipeline']}
 *     >
 *       <ClientesPage />
 *     </RouteGuard>
 *   }
 * />
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({
  modulo,
  moduloNome,
  moduloDescricao,
  preco,
  recursos = [],
  children,
}) => {
  const [isAtivo, loading] = useModuloAtivo(modulo);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-[#159A9C] mb-4"></div>
          <p className="text-gray-600 text-lg">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Módulo não ativo - mostrar tela de bloqueio
  if (!isAtivo) {
    return (
      <ModuloBloqueado
        moduloNome={moduloNome}
        moduloDescricao={moduloDescricao}
        preco={preco}
        recursos={recursos}
      />
    );
  }

  // Módulo ativo - renderizar conteúdo
  return <>{children}</>;
};

export default RouteGuard;
