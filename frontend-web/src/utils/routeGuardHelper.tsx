import React from 'react';
import RouteGuard from '../components/licensing/RouteGuard';
import { ModuloEnum } from '../services/modulosService';
import { getModuloInfo } from '../config/modulosConfig';

/**
 * Helper para criar RouteGuard de forma simplificada
 * Usa configuração centralizada de modulosConfig.ts
 * 
 * @example
 * // Em App.tsx
 * <Route 
 *   path="/crm/clientes" 
 *   element={protegerRota(ModuloEnum.CRM, <ClientesPage />)} 
 * />
 */
export const protegerRota = (
  modulo: ModuloEnum,
  children: React.ReactNode
): React.ReactElement => {
  const info = getModuloInfo(modulo);

  return (
    <RouteGuard
      modulo={modulo}
      moduloNome={info.nome}
      moduloDescricao={info.descricao}
      preco={info.preco}
      recursos={info.recursos}
    >
      {children}
    </RouteGuard>
  );
};
