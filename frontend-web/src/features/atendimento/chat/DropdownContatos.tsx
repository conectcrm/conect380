import React, { useState, useEffect } from 'react';
import {
  User,
  Star,
  Phone,
  Mail,
  Briefcase,
  Plus,
  X,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../../services/api';

const API_URL = API_BASE_URL;

// ========================================
// INTERFACES
// ========================================

export interface Contato {
  id: string;
  nome: string;
  email: string | null;
  telefone: string;
  cargo: string | null;
  departamento: string | null;
  principal: boolean;
  ativo: boolean;
  observacoes: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

interface DropdownContatosProps {
  clienteId: string;
  contatoAtualId?: string;
  onContatoSelecionado?: (contato: Contato) => void;
  onContatoAdicionado?: (contato: Contato) => void;
  className?: string;
}

interface NovoContatoForm {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  principal: boolean;
}

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export const DropdownContatos: React.FC<DropdownContatosProps> = ({
  clienteId,
  contatoAtualId,
  onContatoSelecionado,
  onContatoAdicionado,
  className = '',
}) => {
  // Estado
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mostrarFormNovoContato, setMostrarFormNovoContato] = useState(false);
  const [salvandoContato, setSalvandoContato] = useState(false);

  // Form de novo contato
  const [novoContato, setNovoContato] = useState<NovoContatoForm>({
    nome: '',
    email: '',
    telefone: '',
    cargo: '',
    departamento: '',
    principal: false,
  });

  // ========================================
  // CARREGAR CONTATOS
  // ========================================

  useEffect(() => {
    if (clienteId) {
      carregarContatos();
    }
  }, [clienteId]);

  const carregarContatos = async () => {
    setLoading(true);
    setErro(null);

    try {
      const token = localStorage.getItem('authToken');

      const response = await axios.get(`${API_URL}/api/crm/clientes/${clienteId}/contatos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Ordenar: principal primeiro, depois por nome
      const contatosOrdenados = response.data.sort((a: Contato, b: Contato) => {
        if (a.principal && !b.principal) return -1;
        if (!a.principal && b.principal) return 1;
        return a.nome.localeCompare(b.nome);
      });

      setContatos(contatosOrdenados);
      console.log('✅ Contatos carregados:', contatosOrdenados.length);
    } catch (error: any) {
      console.error('❌ Erro ao carregar contatos:', error);
      setErro(error.response?.data?.message || 'Erro ao carregar contatos');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // CRIAR NOVO CONTATO
  // ========================================

  const handleCriarContato = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!novoContato.nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }
    if (!novoContato.telefone.trim()) {
      setErro('Telefone é obrigatório');
      return;
    }

    setSalvandoContato(true);
    setErro(null);

    try {
      const token = localStorage.getItem('authToken');

      const payload = {
        nome: novoContato.nome.trim(),
        email: novoContato.email.trim() || null,
        telefone: novoContato.telefone.trim(),
        cargo: novoContato.cargo.trim() || null,
        departamento: novoContato.departamento.trim() || null,
        principal: novoContato.principal,
      };

      const response = await axios.post(
        `${API_URL}/api/crm/clientes/${clienteId}/contatos`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const contatoCriado = response.data;
      console.log('✅ Contato criado:', contatoCriado);

      // Atualizar lista
      await carregarContatos();

      // Callback
      if (onContatoAdicionado) {
        onContatoAdicionado(contatoCriado);
      }

      // Resetar form
      setNovoContato({
        nome: '',
        email: '',
        telefone: '',
        cargo: '',
        departamento: '',
        principal: false,
      });
      setMostrarFormNovoContato(false);
    } catch (error: any) {
      console.error('❌ Erro ao criar contato:', error);
      setErro(error.response?.data?.message || 'Erro ao criar contato');
    } finally {
      setSalvandoContato(false);
    }
  };

  // ========================================
  // TORNAR PRINCIPAL
  // ========================================

  const handleTornarPrincipal = async (contatoId: string) => {
    try {
      const token = localStorage.getItem('authToken');

      await axios.patch(
        `${API_URL}/api/crm/contatos/${contatoId}/principal`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log('✅ Contato marcado como principal');

      // Recarregar lista
      await carregarContatos();
    } catch (error: any) {
      console.error('❌ Erro ao tornar principal:', error);
      setErro(error.response?.data?.message || 'Erro ao atualizar contato');
    }
  };

  // ========================================
  // HANDLERS
  // ========================================

  const handleSelecionarContato = (contato: Contato) => {
    if (onContatoSelecionado) {
      onContatoSelecionado(contato);
    }
  };

  const handleCancelarNovoContato = () => {
    setMostrarFormNovoContato(false);
    setNovoContato({
      nome: '',
      email: '',
      telefone: '',
      cargo: '',
      departamento: '',
      principal: false,
    });
    setErro(null);
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" />
            Contatos do Cliente
          </h4>
          <span className="text-xs text-gray-500">
            {contatos.length} {contatos.length === 1 ? 'contato' : 'contatos'}
          </span>
        </div>

        {!mostrarFormNovoContato && (
          <button
            onClick={() => setMostrarFormNovoContato(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Adicionar Contato
          </button>
        )}
      </div>

      {/* Erro Global */}
      {erro && !mostrarFormNovoContato && (
        <div className="p-3 bg-red-50 border-b border-red-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-red-800">{erro}</p>
            <button
              onClick={() => setErro(null)}
              className="text-xs text-red-600 hover:text-red-800 mt-1 font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-6 flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-2" />
          <p className="text-sm text-gray-500">Carregando contatos...</p>
        </div>
      )}

      {/* Form Novo Contato */}
      {mostrarFormNovoContato && (
        <form onSubmit={handleCriarContato} className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
              <input
                type="text"
                value={novoContato.nome}
                onChange={(e) => setNovoContato({ ...novoContato, nome: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome completo"
                disabled={salvandoContato}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Telefone *</label>
              <input
                type="tel"
                value={novoContato.telefone}
                onChange={(e) => setNovoContato({ ...novoContato, telefone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(11) 98888-8888"
                disabled={salvandoContato}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={novoContato.email}
                onChange={(e) => setNovoContato({ ...novoContato, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@exemplo.com"
                disabled={salvandoContato}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cargo</label>
                <input
                  type="text"
                  value={novoContato.cargo}
                  onChange={(e) => setNovoContato({ ...novoContato, cargo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Gerente"
                  disabled={salvandoContato}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Departamento</label>
                <input
                  type="text"
                  value={novoContato.departamento}
                  onChange={(e) => setNovoContato({ ...novoContato, departamento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Vendas"
                  disabled={salvandoContato}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={novoContato.principal}
                onChange={(e) => setNovoContato({ ...novoContato, principal: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                disabled={salvandoContato}
              />
              <span className="text-xs text-gray-700">Marcar como contato principal</span>
            </label>

            {erro && (
              <div className="p-2 bg-red-100 border border-red-300 rounded-md flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-800">{erro}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelarNovoContato}
                className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={salvandoContato}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#159A9C] text-white rounded-md hover:bg-[#0F7B7D] transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={salvandoContato}
              >
                {salvandoContato ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista de Contatos */}
      {!loading && !mostrarFormNovoContato && contatos.length === 0 && (
        <div className="p-6 text-center">
          <User className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">Nenhum contato cadastrado</p>
          <p className="text-xs text-gray-500">Clique em "Adicionar Contato" acima</p>
        </div>
      )}

      {!loading && !mostrarFormNovoContato && contatos.length > 0 && (
        <div className="divide-y divide-gray-200">
          {contatos.map((contato) => (
            <div
              key={contato.id}
              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${contatoAtualId === contato.id ? 'bg-blue-50' : ''
                }`}
              onClick={() => handleSelecionarContato(contato)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                    {contato.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-semibold text-gray-900 truncate">
                        {contato.nome}
                      </h5>
                      {contato.principal && (
                        <span title="Contato Principal">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    {contato.cargo && (
                      <p className="text-xs text-gray-600 truncate flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {contato.cargo}
                        {contato.departamento && ` • ${contato.departamento}`}
                      </p>
                    )}
                  </div>
                </div>

                {!contato.principal && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTornarPrincipal(contato.id);
                    }}
                    className="text-gray-400 hover:text-yellow-500 transition-colors p-1"
                    title="Tornar principal"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs text-gray-600">
                {contato.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3" />
                    <span>{contato.telefone}</span>
                  </div>
                )}
                {contato.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{contato.email}</span>
                  </div>
                )}
              </div>

              {contatoAtualId === contato.id && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    <Check className="w-3 h-3" />
                    Contato atual
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownContatos;
