import React, { useState } from 'react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';
import { useUsuarios, useEstatisticasUsuarios } from './hooks/useUsuarios';
import { useAtividadesUsuarios } from './hooks/useAtividadesUsuarios';
import { Usuario } from '../../../types/usuarios/index';
import { useConfirmation } from '../../../hooks/useConfirmation';
import { ConfirmationModal } from '../../../components/common/ConfirmationModal';
import {
  EstatisticasCards,
  FiltrosUsuarios,
  TabelaUsuarios,
  ModalUsuarioModerno,
  ModalResetSenha,
  DashboardAtividades,
  ModalPerfilUsuario,
} from './components';
import {
  Users,
  Plus,
  Filter,
  Search,
  RefreshCw,
  Download,
  Settings,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const UsuariosPage: React.FC = () => {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarNovoUsuario, setMostrarNovoUsuario] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);
  const [mostrarResetSenha, setMostrarResetSenha] = useState<Usuario | null>(null);
  const { confirmationState, showConfirmation } = useConfirmation();
  const [mostrarPerfilUsuario, setMostrarPerfilUsuario] = useState<Usuario | null>(null);
  const [termoBusca, setTermoBusca] = useState('');

  const {
    usuarios,
    loading,
    error,
    filtros,
    carregarUsuarios,
    criarUsuario,
    atualizarUsuario,
    excluirUsuario,
    alterarStatusUsuario,
    resetarSenha,
    aplicarFiltros,
    limparFiltros,
  } = useUsuarios();

  const { estatisticas, loading: loadingEstatisticas } = useEstatisticasUsuarios();

  // Hook para buscar as atividades de usuários
  const {
    atividades,
    loading: loadingAtividades,
    error: errorAtividades,
  } = useAtividadesUsuarios();

  // Busca em tempo real com debounce
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (termoBusca.trim()) {
        aplicarFiltros({ busca: termoBusca });
      } else if (filtros.busca) {
        aplicarFiltros({ busca: '' });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [aplicarFiltros, filtros.busca, termoBusca]);

  const handleNovoUsuario = (): void => {
    setMostrarNovoUsuario(true);
  };

  const handleEditarUsuario = (usuario: Usuario): void => {
    setUsuarioSelecionado(usuario);
  };

  const handleResetSenha = (usuario: Usuario): void => {
    setMostrarResetSenha(usuario);
  };

  const handleVisualizarPerfil = (usuario: Usuario): void => {
    setMostrarPerfilUsuario(usuario);
  };

  const handleAtualizarPerfil = async (_dados: Partial<Usuario>): Promise<void> => {
    // Implementar lógica de atualização de perfil aqui
    toast.success('Perfil atualizado com sucesso!');
  };

  const handleExcluirUsuario = async (usuario: Usuario): Promise<void> => {
    showConfirmation({
      title: 'Excluir usuário',
      message: `Tem certeza que deseja excluir o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      icon: 'danger',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      onConfirm: async () => {
        await excluirUsuario(usuario.id);
      },
    });
  };

  const handleAlterarStatus = async (usuario: Usuario): Promise<void> => {
    const novoStatus = !usuario.ativo;
    const acao = novoStatus ? 'ativar' : 'desativar';

    showConfirmation({
      title: `${acao.charAt(0).toUpperCase() + acao.slice(1)} usuário`,
      message: `Tem certeza que deseja ${acao} o usuário "${usuario.nome}"?`,
      confirmText: acao.charAt(0).toUpperCase() + acao.slice(1),
      cancelText: 'Cancelar',
      icon: novoStatus ? 'success' : 'warning',
      confirmButtonClass: novoStatus
        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      onConfirm: async () => {
        await alterarStatusUsuario(usuario.id, novoStatus);
      },
    });
  };

  const handleAcaoMassa = async (
    acao: 'ativar' | 'desativar' | 'excluir',
    usuariosSelecionadosMassa: Usuario[],
  ): Promise<void> => {
    const nomes =
      usuariosSelecionadosMassa.length <= 3
        ? usuariosSelecionadosMassa.map((u) => u.nome).join(', ')
        : `${usuariosSelecionadosMassa
          .slice(0, 2)
          .map((u) => u.nome)
          .join(', ')} e mais ${usuariosSelecionadosMassa.length - 2} usuários`;

    const mensagem =
      acao === 'excluir'
        ? `Tem certeza que deseja excluir os usuários: ${nomes}? Esta ação não pode ser desfeita.`
        : `Tem certeza que deseja ${acao} os usuários: ${nomes}?`;

    const title =
      acao === 'excluir'
        ? `Excluir ${usuariosSelecionadosMassa.length} usuário${usuariosSelecionadosMassa.length > 1 ? 's' : ''}`
        : `${acao.charAt(0).toUpperCase() + acao.slice(1)} ${usuariosSelecionadosMassa.length} usuário${usuariosSelecionadosMassa.length > 1 ? 's' : ''}`;

    showConfirmation({
      title,
      message: mensagem,
      confirmText: acao === 'excluir' ? 'Excluir' : acao.charAt(0).toUpperCase() + acao.slice(1),
      cancelText: 'Cancelar',
      icon: acao === 'excluir' ? 'danger' : acao === 'ativar' ? 'success' : 'warning',
      confirmButtonClass:
        acao === 'excluir' || acao === 'desativar'
          ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
          : 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
      onConfirm: async () => {
        try {
          if (acao === 'excluir') {
            for (const usuario of usuariosSelecionadosMassa) {
              await excluirUsuario(usuario.id);
            }
            toast.success(
              `${usuariosSelecionadosMassa.length} usuário(s) excluído(s) com sucesso!`,
            );
          } else {
            const novoStatus = acao === 'ativar';
            for (const usuario of usuariosSelecionadosMassa) {
              await alterarStatusUsuario(usuario.id, novoStatus);
            }
            toast.success(
              `${usuariosSelecionadosMassa.length} usuário(s) ${acao === 'ativar' ? 'ativado(s)' : 'desativado(s)'} com sucesso!`,
            );
          }
        } catch (error) {
          console.error(`Erro ao ${acao} usuários em massa:`, error);
          toast.error(`Erro ao ${acao} usuários em massa`);
        }
      },
    });
  };

  const getCountFiltrosAtivos = (): number => {
    return Object.keys(filtros).filter((key) => {
      const valor = filtros[key as keyof typeof filtros];
      return valor !== undefined && valor !== '' && valor !== null;
    }).length;
  };

  const handleExportarUsuarios = (): void => {
    toast('Funcionalidade de exportação em desenvolvimento', {
      icon: 'ℹ️',
      duration: 3000,
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar usuários</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => carregarUsuarios(false)}
            className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <BackToNucleus
            nucleusName="Gestão"
            nucleusPath="/nuclei/gestao"
            currentModuleName="Gestão de Usuários"
          />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-[#159A9C]" />
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
              </div>

              {estatisticas && (
                <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <UserPlus className="w-4 h-4 mr-1" />
                    {estatisticas.totalUsuarios} usuários
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    {estatisticas.usuariosAtivos} ativos
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] w-64"
                />
              </div>

              {/* Filtros */}
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`
                  px-3 py-2 rounded-lg border transition-colors flex items-center space-x-2
                  ${mostrarFiltros
                    ? 'bg-[#159A9C] text-white border-[#159A9C]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }
                  ${getCountFiltrosAtivos() > 0 ? 'ring-2 ring-orange-200' : ''}
                `}
              >
                <Filter className="w-4 h-4" />
                <span>Filtros</span>
                {getCountFiltrosAtivos() > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getCountFiltrosAtivos()}
                  </span>
                )}
              </button>

              {/* Ações */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => carregarUsuarios(false)}
                  disabled={loading}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Atualizar"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handleExportarUsuarios}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Exportar"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Novo Usuário */}
              <button
                onClick={handleNovoUsuario}
                className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Usuário</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros Expandidos */}
        {mostrarFiltros && (
          <div className="border-t bg-gray-50">
            <FiltrosUsuarios
              filtros={filtros}
              aplicarFiltros={aplicarFiltros}
              limparFiltros={limparFiltros}
              onClose={() => setMostrarFiltros(false)}
            />
          </div>
        )}
      </div>

      {/* Estatísticas */}
      {estatisticas && !loadingEstatisticas && (
        <div className="bg-white border-b">
          <EstatisticasCards estatisticas={estatisticas} />
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-[#159A9C] mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Tabela Principal */}
            <div className="xl:col-span-3">
              <TabelaUsuarios
                usuarios={usuarios}
                onEditarUsuario={handleEditarUsuario}
                onExcluirUsuario={handleExcluirUsuario}
                onAlterarStatus={handleAlterarStatus}
                onResetSenha={handleResetSenha}
                onVisualizarPerfil={handleVisualizarPerfil}
                onAcaoMassa={handleAcaoMassa}
              />
            </div>

            {/* Dashboard de Atividades */}
            <div className="xl:col-span-1">
              <DashboardAtividades
                atividades={atividades || []}
                loading={loadingAtividades || false}
                error={errorAtividades || null}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <ModalUsuarioModerno
        isOpen={mostrarNovoUsuario}
        onClose={() => setMostrarNovoUsuario(false)}
        onSuccess={() => {
          setMostrarNovoUsuario(false);
        }}
        onSubmit={criarUsuario}
      />

      {usuarioSelecionado && (
        <ModalUsuarioModerno
          usuario={usuarioSelecionado}
          isOpen={!!usuarioSelecionado}
          onClose={() => setUsuarioSelecionado(null)}
          onSuccess={() => {
            setUsuarioSelecionado(null);
          }}
          onSubmit={atualizarUsuario}
        />
      )}

      {mostrarResetSenha && (
        <ModalResetSenha
          usuario={mostrarResetSenha}
          isOpen={!!mostrarResetSenha}
          onClose={() => setMostrarResetSenha(null)}
          onReset={resetarSenha}
        />
      )}

      {mostrarPerfilUsuario && (
        <ModalPerfilUsuario
          usuario={mostrarPerfilUsuario}
          isOpen={!!mostrarPerfilUsuario}
          onClose={() => setMostrarPerfilUsuario(null)}
          onSave={handleAtualizarPerfil}
        />
      )}

      {/* Modal de Confirmação */}
      <ConfirmationModal confirmationState={confirmationState} />
    </div>
  );
};

export default UsuariosPage;
