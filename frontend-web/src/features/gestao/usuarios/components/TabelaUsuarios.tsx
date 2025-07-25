import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Usuario, ROLE_LABELS, ROLE_COLORS } from '../../../../types/usuarios/index';
import { ModalDetalhesUsuario } from './ModalDetalhesUsuario';
import { 
  Edit, 
  Trash2, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Key,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  Square,
  Users,
  AlertTriangle,
  Eye,
  MessageSquare,
  UserCircle,
  Shield,
  Copy,
  Download,
  Settings,
  FileText,
  Lock,
  Unlock,
  Edit3,
  Clock,
  Printer
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

export const TabelaUsuarios: React.FC<TabelaUsuariosProps> = ({
  usuarios,
  onEditarUsuario,
  onExcluirUsuario,
  onAlterarStatus,
  onResetSenha,
  onVisualizarPerfil,
  onAcaoMassa
}) => {
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<string[]>([]);
  const [mostrarAcoesMassa, setMostrarAcoesMassa] = useState(false);
  const [modalDetalheAberto, setModalDetalheAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);

  // Função para formatar telefone para WhatsApp
  const formatarTelefoneWhatsApp = (telefone: string): string => {
    // Remove todos os caracteres não numéricos
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    // Se não começar com 55 (código do Brasil), adiciona
    if (!numeroLimpo.startsWith('55')) {
      return `55${numeroLimpo}`;
    }
    
    return numeroLimpo;
  };

  // Função para abrir WhatsApp
  const abrirWhatsApp = (usuario: Usuario) => {
    if (usuario.telefone) {
      const numeroFormatado = formatarTelefoneWhatsApp(usuario.telefone);
      const mensagem = encodeURIComponent(`Olá ${usuario.nome}, como posso ajudá-lo hoje?`);
      const url = `https://wa.me/${numeroFormatado}?text=${mensagem}`;
      window.open(url, '_blank');
    }
  };

  // Função para copiar informações do usuário
  const copiarInformacoes = (usuario: Usuario) => {
    const info = `Nome: ${usuario.nome}\nEmail: ${usuario.email}\nPerfil: ${ROLE_LABELS[usuario.role]}\nStatus: ${usuario.ativo ? 'Ativo' : 'Inativo'}${usuario.telefone ? `\nTelefone: ${usuario.telefone}` : ''}`;
    navigator.clipboard.writeText(info);
    toast.success('Informações copiadas para a área de transferência!');
  };

  // Função para enviar email
  const enviarEmail = (usuario: Usuario) => {
    const subject = encodeURIComponent('Contato via CRM');
    const body = encodeURIComponent(`Olá ${usuario.nome},\n\n`);
    window.open(`mailto:${usuario.email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Função para abrir modal de detalhes
  const abrirModalDetalhes = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalDetalheAberto(true);
  };

  // Funções de seleção múltipla
  const toggleSelecaoUsuario = (usuarioId: string) => {
    setUsuariosSelecionados(prev => 
      prev.includes(usuarioId) 
        ? prev.filter(id => id !== usuarioId)
        : [...prev, usuarioId]
    );
  };

  const selecionarTodos = () => {
    if (usuariosSelecionados.length === usuarios.length) {
      setUsuariosSelecionados([]);
    } else {
      setUsuariosSelecionados(usuarios.map(u => u.id));
    }
  };

  const executarAcaoMassa = (acao: 'ativar' | 'desativar' | 'excluir') => {
    if (onAcaoMassa && usuariosSelecionados.length > 0) {
      const usuariosParaAcao = usuarios.filter(u => usuariosSelecionados.includes(u.id));
      onAcaoMassa(acao, usuariosParaAcao);
      setUsuariosSelecionados([]);
      setMostrarAcoesMassa(false);
    }
  };
  const formatarData = (data: Date) => {
    if (!data) return '-';
    const d = new Date(data);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const formatarDataRelativa = (data: Date) => {
    if (!data) return '-';
    const d = new Date(data);
    if (isNaN(d.getTime())) return '-';
    const diff = new Date().getTime() - d.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (dias === 0) return 'Hoje';
    if (dias === 1) return 'Ontem';
    if (dias < 7) return `${dias} dias atrás`;
    if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
    if (dias < 365) return `${Math.floor(dias / 30)} meses atrás`;
    return `${Math.floor(dias / 365)} anos atrás`;
  };

  if (usuarios.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
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
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => executarAcaoMassa('ativar')}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors flex items-center space-x-1"
              >
                <UserCheck className="w-4 h-4" />
                <span>Ativar</span>
              </button>
              <button
                onClick={() => executarAcaoMassa('desativar')}
                className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors flex items-center space-x-1"
              >
                <UserX className="w-4 h-4" />
                <span>Desativar</span>
              </button>
              <button
                onClick={() => executarAcaoMassa('excluir')}
                className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center space-x-1"
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
                            {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {usuario.nome}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {usuario.id ? usuario.id.substring(0, 8) + "..." : "ID inválido"}
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
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ROLE_COLORS[usuario.role]}`}>
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
                        console.log('🔧 CLIQUE DIRETO NO MODAL - Usuario:', usuario.nome, 'ID:', usuario.id);
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
          onAlterarStatus={(usuario, novoStatus) => {
            // Implementar lógica de alteração de status se necessário
            console.log('Alterar status:', usuario, novoStatus);
          }}
        />
      )}
    </div>
  );
};
