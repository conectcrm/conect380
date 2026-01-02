import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Usuario, ROLE_LABELS, ROLE_COLORS } from '../../../../types/usuarios/index';
import { ModalDetalhesUsuario } from './ModalDetalhesUsuario';
import {
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  CheckSquare,
  Square,
  Users,
  Settings,
} from 'lucide-react';

interface TabelaUsuariosProps {
  usuarios: Usuario[];
  onEditarUsuario: (usuario: Usuario) => void;
  onExcluirUsuario: (usuario: Usuario) => void;
  onAlterarStatus: (usuario: Usuario) => void;
  onResetSenha: (usuario: Usuario) => void;
  onVisualizarPerfil: (usuario: Usuario) => void;
  onAcaoMassa?: (acao: 'ativar' | 'desativar' | 'excluir', usuarios: Usuario[]) => void;
}

type StatusSelecionados = {
  todosAtivos: boolean;
  todosInativos: boolean;
  mixtos: boolean;
  ativos: number;
  inativos: number;
  total: number;
};

export const TabelaUsuarios: React.FC<TabelaUsuariosProps> = ({
  usuarios,
  onEditarUsuario,
  onExcluirUsuario,
  onAlterarStatus: _onAlterarStatus,
  onResetSenha: _onResetSenha,
  onVisualizarPerfil: _onVisualizarPerfil,
  onAcaoMassa,
}) => {
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);
  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);

  // Funções para analisar status dos usuários selecionados
  const getUsuariosSelecionadosData = (): Usuario[] => {
    return usuarios.filter((usuario) => usuariosSelecionados.includes(usuario.id));
  };

  const getStatusUsuariosSelecionados = (): StatusSelecionados => {
    const usuariosData = getUsuariosSelecionadosData();
    const ativos = usuariosData.filter((u) => u.ativo).length;
    const inativos = usuariosData.filter((u) => !u.ativo).length;
    const total = usuariosData.length;

    return {
      todosAtivos: ativos === total,
      todosInativos: inativos === total,
      mixtos: ativos > 0 && inativos > 0,
      ativos,
      inativos,
      total,
    };
  };

  // Função para abrir modal de detalhes
  const abrirModalDetalhes = (usuario: Usuario): void => {
    if (_onVisualizarPerfil) {
      _onVisualizarPerfil(usuario);
    }
    setUsuarioSelecionado(usuario);
    setModalDetalheAberto(true);
  };

  const handleModalStatusChange = (usuario: Usuario, novoStatus: boolean): void => {
    _onAlterarStatus({ ...usuario, ativo: novoStatus });
  };

  // Funções de seleção múltipla
  const toggleSelecaoUsuario = (usuarioId: string): void => {
    setUsuariosSelecionados((prev) =>
      prev.includes(usuarioId) ? prev.filter((id) => id !== usuarioId) : [...prev, usuarioId],
    );
  };

  const selecionarTodos = (): void => {
    if (usuariosSelecionados.length === usuarios.length) {
      setUsuariosSelecionados([]);
    } else {
      setUsuariosSelecionados(usuarios.map((u) => u.id));
    }
  };

  const executarAcaoMassa = (acao: 'ativar' | 'desativar' | 'excluir'): void => {
    if (onAcaoMassa && usuariosSelecionados.length > 0) {
      let usuariosParaAcao = usuarios.filter((u) => usuariosSelecionados.includes(u.id));

      // Filtrar usuários baseado na ação e status atual
      if (acao === 'ativar') {
        // Apenas usuários inativos podem ser ativados
        usuariosParaAcao = usuariosParaAcao.filter((u) => !u.ativo);
      } else if (acao === 'desativar') {
        // Apenas usuários ativos podem ser desativados
        usuariosParaAcao = usuariosParaAcao.filter((u) => u.ativo);
      }

      // Se não há usuários elegíveis para a ação
      if (usuariosParaAcao.length === 0 && acao !== 'excluir') {
        toast.error(
          `Nenhum usuário selecionado pode ser ${acao === 'ativar' ? 'ativado' : 'desativado'}`,
          {
            icon: '⚠️',
            duration: 3000,
          },
        );
        return;
      }

      onAcaoMassa(acao, usuariosParaAcao);
      setUsuariosSelecionados([]);
    }
  };

  if (usuarios.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
        <p className="text-gray-600">Não há usuários que correspondam aos filtros aplicados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Barra de Ações em Massa */}
      {usuariosSelecionados.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {usuariosSelecionados.length} usuário(s) selecionado(s)
              </span>
              {(() => {
                const status = getStatusUsuariosSelecionados();
                if (status.mixtos) {
                  return (
                    <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                      {status.ativos} ativo(s) • {status.inativos} inativo(s)
                    </span>
                  );
                } else if (status.todosAtivos) {
                  return (
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                      Todos ativos
                    </span>
                  );
                } else {
                  return (
                    <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                      Todos inativos
                    </span>
                  );
                }
              })()}
            </div>
            <div className="flex items-center space-x-2">
              {(() => {
                const status = getStatusUsuariosSelecionados();
                const botoes = [];

                // Mostra botão "Ativar" apenas se há usuários inativos
                if (!status.todosAtivos) {
                  botoes.push(
                    <button
                      key="ativar"
                      onClick={() => executarAcaoMassa('ativar')}
                      className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center space-x-1"
                      title={
                        status.mixtos
                          ? `Ativar ${status.inativos} usuário(s) inativo(s)`
                          : `Ativar ${status.total} usuário(s)`
                      }
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Ativar{status.mixtos ? ` (${status.inativos})` : ''}</span>
                    </button>,
                  );
                }

                // Mostra botão "Desativar" apenas se há usuários ativos
                if (!status.todosInativos) {
                  botoes.push(
                    <button
                      key="desativar"
                      onClick={() => executarAcaoMassa('desativar')}
                      className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors flex items-center space-x-1"
                      title={
                        status.mixtos
                          ? `Desativar ${status.ativos} usuário(s) ativo(s)`
                          : `Desativar ${status.total} usuário(s)`
                      }
                    >
                      <UserX className="w-4 h-4" />
                      <span>Desativar{status.mixtos ? ` (${status.ativos})` : ''}</span>
                    </button>,
                  );
                }

                return botoes;
              })()}
              <button
                onClick={() => executarAcaoMassa('excluir')}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center space-x-1"
                title={`Excluir ${usuariosSelecionados.length} usuário(s) selecionado(s)`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
              <button
                onClick={() => setUsuariosSelecionados([])}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={selecionarTodos}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {usuariosSelecionados.length === usuarios.length ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : usuariosSelecionados.length > 0 ? (
                    <div className="w-5 h-5 bg-blue-600 rounded border-2 border-blue-600 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-sm"></div>
                    </div>
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contato
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Perfil
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <button
                    onClick={() => toggleSelecaoUsuario(usuario.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {usuariosSelecionados.includes(usuario.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      {usuario.avatar_url ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={usuario.avatar_url}
                          alt={usuario.nome}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{usuario.nome}</div>
                      <div className="text-xs text-gray-500">
                        ID: {usuario.id ? usuario.id.substring(0, 8) + '...' : 'ID inválido'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center">
                      <Mail className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                      <span className="truncate max-w-[180px]">{usuario.email}</span>
                    </div>
                    {usuario.telefone && (
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Phone className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                        <span>{usuario.telefone}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ROLE_COLORS[usuario.role]}`}
                  >
                    {ROLE_LABELS[usuario.role]}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {usuario.ativo ? (
                      <>
                        <UserCheck className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600 font-medium">Ativo</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-600 font-medium">Inativo</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative inline-block text-left" data-menu-container>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        abrirModalDetalhes(usuario);
                      }}
                      className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title={`Ver perfil de ${usuario.nome}`}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalhes */}
      {usuarioSelecionado && (
        <ModalDetalhesUsuario
          isOpen={modalDetalheAberto}
          onClose={() => {
            setModalDetalheAberto(false);
            setUsuarioSelecionado(null);
          }}
          usuario={usuarioSelecionado}
          onSalvarUsuario={onEditarUsuario}
          onExcluirUsuario={onExcluirUsuario}
          onAlterarStatus={handleModalStatusChange}
        />
      )}
    </div>
  );
};
