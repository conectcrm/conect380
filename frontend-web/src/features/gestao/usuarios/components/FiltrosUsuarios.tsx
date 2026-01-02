import React from 'react';
import {
  FiltrosUsuarios as IFiltrosUsuarios,
  UserRole,
  ROLE_LABELS,
} from '../../../../types/usuarios/index';
import { X, Filter, Calendar, Clock } from 'lucide-react';

interface FiltrosUsuariosProps {
  filtros: IFiltrosUsuarios;
  aplicarFiltros: (filtros: Partial<IFiltrosUsuarios>) => void;
  limparFiltros: () => void;
  onClose: () => void;
}

type OrdenacaoCampo = NonNullable<IFiltrosUsuarios['ordenacao']>;
type DirecaoOrdenacao = NonNullable<IFiltrosUsuarios['direcao']>;

export const FiltrosUsuarios: React.FC<FiltrosUsuariosProps> = ({
  filtros,
  aplicarFiltros,
  limparFiltros,
  onClose,
}) => {
  const ordenacaoAtual: OrdenacaoCampo = filtros.ordenacao || 'nome';
  const direcaoAtual: DirecaoOrdenacao = filtros.direcao || 'asc';

  const handleRoleChange = (role: UserRole | ''): void => {
    aplicarFiltros({ role });
  };

  const handleAtivoChange = (ativo: '' | 'true' | 'false'): void => {
    aplicarFiltros({
      ativo: ativo === '' ? '' : ativo === 'true',
    });
  };

  const handleOrdenacaoChange = (ordenacao: OrdenacaoCampo, direcao: DirecaoOrdenacao): void => {
    aplicarFiltros({
      ordenacao,
      direcao,
    });
  };

  const temFiltrosAtivos = Object.keys(filtros).some((key) => {
    const valor = filtros[key as keyof typeof filtros];
    return valor !== undefined && valor !== '' && valor !== null;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Perfil */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Perfil</label>
          <select
            value={filtros.role || ''}
            onChange={(e) => handleRoleChange(e.target.value as UserRole | '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
          >
            <option value="">Todos os perfis</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={filtros.ativo === '' ? '' : filtros.ativo ? 'true' : 'false'}
            onChange={(e) => handleAtivoChange(e.target.value as '' | 'true' | 'false')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
          >
            <option value="">Todos</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </select>
        </div>

        {/* Ordenação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
          <select
            value={ordenacaoAtual}
            onChange={(e) => handleOrdenacaoChange(e.target.value as OrdenacaoCampo, direcaoAtual)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
          >
            <option value="nome">Nome</option>
            <option value="email">Email</option>
            <option value="role">Perfil</option>
            <option value="created_at">Data de Criação</option>
            <option value="ultimo_login">Último Login</option>
          </select>
        </div>

        {/* Direção */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Direção</label>
          <select
            value={direcaoAtual}
            onChange={(e) =>
              handleOrdenacaoChange(ordenacaoAtual, e.target.value as DirecaoOrdenacao)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
          >
            <option value="asc">Crescente</option>
            <option value="desc">Decrescente</option>
          </select>
        </div>
      </div>

      {/* Filtros de Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Data de Criação */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Data de Criação
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">De:</label>
              <input
                type="date"
                value={filtros.dataInicio || ''}
                onChange={(e) => aplicarFiltros({ dataInicio: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Até:</label>
              <input
                type="date"
                value={filtros.dataFim || ''}
                onChange={(e) => aplicarFiltros({ dataFim: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
              />
            </div>
          </div>
        </div>

        {/* Último Login */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Último Login
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">De:</label>
              <input
                type="date"
                value={filtros.ultimoLoginInicio || ''}
                onChange={(e) => aplicarFiltros({ ultimoLoginInicio: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Até:</label>
              <input
                type="date"
                value={filtros.ultimoLoginFim || ''}
                onChange={(e) => aplicarFiltros({ ultimoLoginFim: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-500">
          {temFiltrosAtivos ? 'Filtros aplicados' : 'Nenhum filtro aplicado'}
        </div>

        <div className="flex items-center space-x-3">
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpar filtros
            </button>
          )}

          <button
            onClick={onClose}
            className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
