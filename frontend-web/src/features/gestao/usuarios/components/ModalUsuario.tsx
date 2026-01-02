import React, { useState, useEffect } from 'react';
import {
  Usuario,
  NovoUsuario,
  AtualizarUsuario,
  UserRole,
  ROLE_LABELS,
} from '../../../../types/usuarios/index';
import { X, User, Mail, Phone, Shield, Save, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ModalUsuarioProps {
  usuario?: Usuario;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSubmit: (dados: NovoUsuario | AtualizarUsuario) => Promise<Usuario | null>;
}

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).filter(([value]) => value !== UserRole.SUPERADMIN);

export const ModalUsuario: React.FC<ModalUsuarioProps> = ({
  usuario,
  isOpen,
  onClose,
  onSuccess,
  onSubmit,
}) => {
  // Importa o contexto de autenticação para obter o usuário logado
  // @ts-ignore
  const { user } = require('../../../../hooks/useAuth').useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    role: UserRole.USER,
    ativo: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const isEdit = !!usuario;

  useEffect(() => {
    if (isOpen) {
      // Reset estado da senha para maior segurança
      setShowSenha(false);

      if (usuario) {
        setFormData({
          nome: usuario.nome,
          email: usuario.email,
          senha: '',
          telefone: usuario.telefone || '',
          role: usuario.role,
          ativo: usuario.ativo,
        });
      } else {
        setFormData({
          nome: '',
          email: '',
          senha: '',
          telefone: '',
          role: UserRole.USER,
          ativo: true,
        });
      }
    }
  }, [isOpen, usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim() || !formData.email.trim()) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    if (!isEdit && !formData.senha.trim()) {
      toast.error('Senha é obrigatória para novos usuários');
      return;
    }

    setIsSubmitting(true);

    try {
      let dados: NovoUsuario | AtualizarUsuario;

      if (isEdit) {
        dados = {
          id: usuario!.id,
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone || undefined,
          role: formData.role,
          ativo: formData.ativo,
        };
      } else {
        dados = {
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          telefone: formData.telefone || undefined,
          role: formData.role,
          empresa_id: user?.empresa?.id || '',
          ativo: formData.ativo,
        };
      }

      const resultado = await onSubmit(dados);
      if (resultado) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <User className="w-6 h-6 text-[#159A9C]" />
              <h3 className="text-lg font-semibold text-gray-900">
                {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Nome completo do usuário"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                  required
                />
              </div>
            </div>

            {/* Senha (apenas para novos usuários) */}
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <input
                  type={showSenha ? 'text' : 'password'}
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  placeholder="Senha do usuário"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                  autoComplete="new-password"
                  required
                />
                <div className="mt-1">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showSenha}
                      onChange={(e) => setShowSenha(e.target.checked)}
                      className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                    />
                    <span className="ml-2 text-sm text-gray-600">Mostrar senha</span>
                  </label>
                </div>
              </div>
            )}

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                />
              </div>
            </div>

            {/* Perfil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C]"
                  required
                >
                  {usuario?.role === UserRole.SUPERADMIN && (
                    <option value={UserRole.SUPERADMIN}>
                      {ROLE_LABELS[UserRole.SUPERADMIN]}
                    </option>
                  )}
                  {ROLE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                />
                <span className="ml-2 text-sm text-gray-700">Usuário ativo</span>
              </label>
            </div>

            {/* Botões */}
            <div className="flex items-center justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#159A9C] text-white px-4 py-2 rounded-lg hover:bg-[#138A8C] transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isEdit ? 'Atualizar' : 'Criar'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
