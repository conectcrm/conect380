import React, { useState } from 'react';
import { Usuario } from '../../../../types/usuarios/index';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Bell, 
  Shield, 
  Eye, 
  EyeOff,
  Save,
  Upload,
  Camera,
  Calendar,
  Clock,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ModalPerfilUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario;
  onSave: (dados: Partial<Usuario>) => Promise<void>;
}

export const ModalPerfilUsuario: React.FC<ModalPerfilUsuarioProps> = ({
  isOpen,
  onClose,
  usuario,
  onSave
}) => {
  const [loading, setSaving] = useState(false);
  const [dadosUsuario, setDadosUsuario] = useState<Partial<Usuario>>({
    nome: usuario.nome,
    email: usuario.email,
    telefone: usuario.telefone || '',
    idioma_preferido: usuario.idioma_preferido,
    configuracoes: {
      tema: usuario.configuracoes?.tema || 'light',
      notificacoes: {
        email: usuario.configuracoes?.notificacoes?.email ?? true,
        push: usuario.configuracoes?.notificacoes?.push ?? true
      }
    }
  });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  // Funções para formatação de data
  const formatarData = (data: string | Date) => {
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    return dataObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarDataRelativa = (data: string | Date) => {
    const agora = new Date();
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    const diff = agora.getTime() - dataObj.getTime();
    const minutos = Math.floor(diff / (1000 * 60));
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutos < 1) return 'Agora mesmo';
    if (minutos < 60) return `${minutos}m atrás`;
    if (horas < 24) return `${horas}h atrás`;
    if (dias < 7) return `${dias}d atrás`;
    if (dias < 30) return `${Math.floor(dias / 7)} semanas atrás`;
    if (dias < 365) return `${Math.floor(dias / 30)} meses atrás`;
    return `${Math.floor(dias / 365)} anos atrás`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validação de senhas se fornecidas
      if (novaSenha || confirmarSenha) {
        if (novaSenha !== confirmarSenha) {
          toast.error('As senhas não coincidem');
          setSaving(false);
          return;
        }
        if (novaSenha.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          setSaving(false);
          return;
        }
      }

      const dadosParaSalvar = {
        ...dadosUsuario,
        ...(novaSenha && { senha: novaSenha })
      };

      await onSave(dadosParaSalvar);
      toast.success('Perfil atualizado com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simular upload de avatar
      const reader = new FileReader();
      reader.onload = (event) => {
        setDadosUsuario(prev => ({
          ...prev,
          avatar_url: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
      toast.success('Avatar carregado com sucesso!');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-[#159A9C]" />
            Meu Perfil
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              {dadosUsuario.avatar_url ? (
                <img
                  src={dadosUsuario.avatar_url}
                  alt={dadosUsuario.nome}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-medium text-gray-600">
                    {dadosUsuario.nome?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-[#159A9C] text-white p-2 rounded-full cursor-pointer hover:bg-[#138A8C] transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{dadosUsuario.nome}</h3>
              <p className="text-sm text-gray-500">{usuario.role}</p>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b pb-2">Dados Pessoais</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={dadosUsuario.nome || ''}
                    onChange={(e) => setDadosUsuario(prev => ({ ...prev, nome: e.target.value }))}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={dadosUsuario.email || ''}
                    onChange={(e) => setDadosUsuario(prev => ({ ...prev, email: e.target.value }))}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={dadosUsuario.telefone || ''}
                    onChange={(e) => setDadosUsuario(prev => ({ ...prev, telefone: e.target.value }))}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <select
                    value={dadosUsuario.idioma_preferido || 'pt-BR'}
                    onChange={(e) => setDadosUsuario(prev => ({ ...prev, idioma_preferido: e.target.value }))}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b pb-2 flex items-center">
              <Info className="w-4 h-4 mr-2 text-[#159A9C]" />
              Informações do Sistema
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                  Cadastrado em
                </div>
                <div className="text-sm text-gray-600">
                  {formatarData(usuario.created_at)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatarDataRelativa(usuario.created_at)}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  Último acesso
                </div>
                <div className="text-sm text-gray-600">
                  {usuario.ultimo_login ? formatarData(usuario.ultimo_login) : 'Nunca'}
                </div>
                {usuario.ultimo_login && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatarDataRelativa(usuario.ultimo_login)}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 mr-2 text-gray-500" />
                  ID do Usuário
                </div>
                <div className="text-xs text-gray-600 font-mono">
                  {usuario.id}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                  <Shield className="w-4 h-4 mr-2 text-gray-500" />
                  Status da Conta
                </div>
                <div className="text-sm">
                  {usuario.ativo ? (
                    <span className="text-green-600 font-medium">Ativa</span>
                  ) : (
                    <span className="text-red-600 font-medium">Inativa</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alterar Senha */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b pb-2">Alterar Senha</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="pl-10 pr-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                    placeholder="Deixe em branco para não alterar"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                    placeholder="Confirme a nova senha"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configurações */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b pb-2">Configurações</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tema
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tema"
                      value="light"
                      checked={dadosUsuario.configuracoes?.tema === 'light'}
                      onChange={(e) => setDadosUsuario(prev => ({
                        ...prev,
                        configuracoes: { ...prev.configuracoes, tema: e.target.value }
                      }))}
                      className="mr-2"
                    />
                    Claro
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tema"
                      value="dark"
                      checked={dadosUsuario.configuracoes?.tema === 'dark'}
                      onChange={(e) => setDadosUsuario(prev => ({
                        ...prev,
                        configuracoes: { ...prev.configuracoes, tema: e.target.value }
                      }))}
                      className="mr-2"
                    />
                    Escuro
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notificações
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dadosUsuario.configuracoes?.notificacoes?.email ?? true}
                      onChange={(e) => setDadosUsuario(prev => ({
                        ...prev,
                        configuracoes: {
                          ...prev.configuracoes,
                          notificacoes: {
                            ...prev.configuracoes?.notificacoes,
                            email: e.target.checked
                          }
                        }
                      }))}
                      className="mr-2"
                    />
                    <Bell className="w-4 h-4 mr-2 text-gray-400" />
                    Notificações por email
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dadosUsuario.configuracoes?.notificacoes?.push ?? true}
                      onChange={(e) => setDadosUsuario(prev => ({
                        ...prev,
                        configuracoes: {
                          ...prev.configuracoes,
                          notificacoes: {
                            ...prev.configuracoes?.notificacoes,
                            push: e.target.checked
                          }
                        }
                      }))}
                      className="mr-2"
                    />
                    <Bell className="w-4 h-4 mr-2 text-gray-400" />
                    Notificações push
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#159A9C] text-white px-6 py-2 rounded-lg hover:bg-[#138A8C] transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
