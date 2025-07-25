import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Usuario, ROLE_LABELS, ROLE_COLORS } from '../../../../types/usuarios/index';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar,
  MapPin,
  Briefcase,
  Edit3,
  Save,
  UserCheck,
  UserX,
  MessageSquare,
  Copy,
  History,
  Key,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface ModalDetalhesUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario;
  onSalvarUsuario?: (usuario: Usuario) => void;
  onExcluirUsuario?: (usuario: Usuario) => void;
  onAlterarStatus?: (usuario: Usuario, novoStatus: boolean) => void;
}

interface TabAtiva {
  id: 'detalhes' | 'historico' | 'configuracoes';
  nome: string;
  icone: React.ReactNode;
}

const TABS: TabAtiva[] = [
  { id: 'detalhes', nome: 'Detalhes', icone: <User className="w-4 h-4" /> },
  { id: 'historico', nome: 'Histórico', icone: <History className="w-4 h-4" /> },
  { id: 'configuracoes', nome: 'Configurações', icone: <Settings className="w-4 h-4" /> }
];

export const ModalDetalhesUsuario: React.FC<ModalDetalhesUsuarioProps> = ({
  isOpen,
  onClose,
  usuario,
  onSalvarUsuario,
  onExcluirUsuario,
  onAlterarStatus
}) => {
  const [tabAtiva, setTabAtiva] = useState<'detalhes' | 'historico' | 'configuracoes'>('detalhes');
  const [modoEdicao, setModoEdicao] = useState(false);
  const [dadosUsuario, setDadosUsuario] = useState<Usuario>(usuario);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Função para formatar telefone WhatsApp
  const formatarTelefoneWhatsApp = (telefone: string): string => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    if (numeroLimpo.length === 10) {
      return `55${numeroLimpo}`;
    }
    if (numeroLimpo.length === 11) {
      return `55${numeroLimpo}`;
    }
    return numeroLimpo;
  };

  // Função para abrir WhatsApp
  const abrirWhatsApp = () => {
    if (usuario.telefone) {
      const numeroFormatado = formatarTelefoneWhatsApp(usuario.telefone);
      const mensagem = encodeURIComponent(`Olá ${usuario.nome}, como posso ajudá-lo hoje?`);
      const url = `https://wa.me/${numeroFormatado}?text=${mensagem}`;
      window.open(url, '_blank');
      toast.success('WhatsApp aberto!');
    } else {
      toast.error('Usuário não possui telefone cadastrado');
    }
  };

  // Função para enviar email
  const enviarEmail = () => {
    const subject = encodeURIComponent('Contato via ConectCRM');
    const body = encodeURIComponent(`Olá ${usuario.nome},\n\n`);
    window.open(`mailto:${usuario.email}?subject=${subject}&body=${body}`, '_blank');
    toast.success('Cliente de email aberto!');
  };

  // Função para copiar dados
  const copiarDados = () => {
    const info = `Nome: ${usuario.nome}\nEmail: ${usuario.email}\nPerfil: ${ROLE_LABELS[usuario.role]}\nStatus: ${usuario.ativo ? 'Ativo' : 'Inativo'}${usuario.telefone ? `\nTelefone: ${usuario.telefone}` : ''}`;
    navigator.clipboard.writeText(info);
    toast.success('Dados copiados para a área de transferência!');
  };

  // Função para salvar alterações
  const handleSalvar = async () => {
    if (!onSalvarUsuario) return;
    
    setIsLoading(true);
    try {
      await onSalvarUsuario(dadosUsuario);
      toast.success('Usuário atualizado com sucesso!');
      setModoEdicao(false);
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
      console.error('Erro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para alterar status
  const handleAlterarStatus = async () => {
    if (!onAlterarStatus) return;
    
    const novoStatus = !usuario.ativo;
    const acao = novoStatus ? 'ativar' : 'inativar';
    
    if (window.confirm(`Tem certeza que deseja ${acao} este usuário?`)) {
      setIsLoading(true);
      try {
        await onAlterarStatus(usuario, novoStatus);
        toast.success(`Usuário ${acao}do com sucesso!`);
      } catch (error) {
        toast.error(`Erro ao ${acao} usuário`);
        console.error('Erro:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Função para excluir usuário
  const handleExcluir = async () => {
    if (!onExcluirUsuario) return;
    
    if (window.confirm('⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\nTem certeza que deseja excluir permanentemente este usuário?')) {
      setIsLoading(true);
      try {
        await onExcluirUsuario(usuario);
        toast.success('Usuário excluído com sucesso!');
        onClose();
      } catch (error) {
        toast.error('Erro ao excluir usuário');
        console.error('Erro:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderDetalhes = () => (
    <div className="space-y-6">
      {/* Informações Principais */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Informações Principais</h3>
          <button
            onClick={() => setModoEdicao(!modoEdicao)}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {modoEdicao ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Nome Completo
            </label>
            {modoEdicao ? (
              <input
                type="text"
                value={dadosUsuario.nome}
                onChange={(e) => setDadosUsuario({ ...dadosUsuario, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900 font-medium">{usuario.nome}</div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            {modoEdicao ? (
              <input
                type="email"
                value={dadosUsuario.email}
                onChange={(e) => setDadosUsuario({ ...dadosUsuario, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <div className="text-gray-900">{usuario.email}</div>
            )}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              Telefone
            </label>
            {modoEdicao ? (
              <input
                type="tel"
                value={dadosUsuario.telefone || ''}
                onChange={(e) => setDadosUsuario({ ...dadosUsuario, telefone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="(00) 00000-0000"
              />
            ) : (
              <div className="text-gray-900">{usuario.telefone || 'Não informado'}</div>
            )}
          </div>

          {/* Perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Perfil de Acesso
            </label>
            {modoEdicao ? (
              <select
                value={dadosUsuario.role}
                onChange={(e) => setDadosUsuario({ ...dadosUsuario, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            ) : (
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[usuario.role]}`}>
                {ROLE_LABELS[usuario.role]}
              </div>
            )}
          </div>
        </div>

        {modoEdicao && (
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setModoEdicao(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>

      {/* Status e Datas */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status e Informações</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="flex items-center">
              {usuario.ativo ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Ativo</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Inativo</span>
                </div>
              )}
            </div>
          </div>

          {/* Data de Criação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Criado em
            </label>
            <div className="text-gray-900">
              {usuario.created_at ? new Date(usuario.created_at).toLocaleDateString('pt-BR') : 'Não informado'}
            </div>
          </div>

          {/* Último Acesso */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Último Login
            </label>
            <div className="text-gray-900">
              {usuario.ultimo_login ? new Date(usuario.ultimo_login).toLocaleDateString('pt-BR') : 'Nunca'}
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={abrirWhatsApp}
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            WhatsApp
          </button>

          <button
            onClick={enviarEmail}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            E-mail
          </button>

          <button
            onClick={copiarDados}
            className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar
          </button>

          <button
            onClick={handleAlterarStatus}
            disabled={isLoading}
            className={`flex items-center justify-center px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 ${
              usuario.ativo 
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {usuario.ativo ? <UserX className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
            {isLoading ? 'Processando...' : (usuario.ativo ? 'Inativar' : 'Ativar')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderHistorico = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Atividades</h3>
        
        <div className="space-y-4">
          {/* Exemplo de atividades */}
          <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">Usuário criado</div>
              <div className="text-sm text-gray-500">
                {usuario.created_at ? new Date(usuario.created_at).toLocaleString('pt-BR') : 'Data não informada'}
              </div>
            </div>
          </div>

          {usuario.ultimo_login && (
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">Último login</div>
                <div className="text-sm text-gray-500">
                  {new Date(usuario.ultimo_login).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderConfiguracoes = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Segurança</h3>
        
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <Key className="w-5 h-5 text-gray-500 mr-3" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">Redefinir Senha</div>
                <div className="text-sm text-gray-500">Enviar link para redefinição de senha</div>
              </div>
            </div>
          </button>

          <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border hover:bg-gray-50 transition-colors">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-gray-500 mr-3" />
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">Permissões</div>
                <div className="text-sm text-gray-500">Gerenciar permissões do usuário</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Zona de Perigo */}
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <h3 className="text-lg font-semibold text-red-900 mb-4">Zona de Perigo</h3>
        
        <button
          onClick={handleExcluir}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          {isLoading ? 'Excluindo...' : 'Excluir Usuário Permanentemente'}
        </button>
        
        <p className="text-sm text-red-700 mt-2">
          ⚠️ Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#159A9C] to-[#159A9C]/90">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{usuario.nome}</h2>
                <p className="text-sm text-white/80">{usuario.email}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTabAtiva(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    tabAtiva === tab.id
                      ? 'border-[#159A9C] text-[#159A9C]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icone}
                  <span className="ml-2">{tab.nome}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-96 overflow-y-auto">
            {tabAtiva === 'detalhes' && renderDetalhes()}
            {tabAtiva === 'historico' && renderHistorico()}
            {tabAtiva === 'configuracoes' && renderConfiguracoes()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
