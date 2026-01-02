import React, { useState, useEffect } from 'react';
import { X, Link2, AlertCircle, Loader2, Search, Plus, User, Building2 } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../services/api';
import { clientesService, Cliente } from '../../../../services/clientesService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: () => void;
  ticketAtual?: any;
}

export function VincularClienteModal({ isOpen, onClose, onSucesso, ticketAtual }: Props) {
  const { user } = useAuth();
  const [busca, setBusca] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [mostrarCriarCliente, setMostrarCriarCliente] = useState(false);

  // Dados do novo cliente
  const [novoClienteNome, setNovoClienteNome] = useState('');
  const [novoClienteEmail, setNovoClienteEmail] = useState('');
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [novoClienteTipo, setNovoClienteTipo] = useState<'pessoa_fisica' | 'pessoa_juridica'>(
    'pessoa_fisica',
  );
  const [novoClienteDocumento, setNovoClienteDocumento] = useState('');

  const [buscando, setBuscando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Reset form quando modal abre
  useEffect(() => {
    if (isOpen) {
      resetForm();
      // Auto-preencher busca com nome do contato se disponível
      if (ticketAtual?.contatoNome) {
        setBusca(ticketAtual.contatoNome);
      }
    }
  }, [isOpen, ticketAtual]);

  // Buscar clientes com debounce
  useEffect(() => {
    if (busca.length < 3) {
      setClientesEncontrados([]);
      return;
    }

    const timer = setTimeout(async () => {
      await buscarClientes(busca);
    }, 500);

    return () => clearTimeout(timer);
  }, [busca]);

  const resetForm = () => {
    setBusca('');
    setClientesEncontrados([]);
    setClienteSelecionado(null);
    setMostrarCriarCliente(false);
    setNovoClienteNome('');
    setNovoClienteEmail('');
    setNovoClienteTelefone('');
    setNovoClienteTipo('pessoa_fisica');
    setNovoClienteDocumento('');
    setErro('');
  };

  const buscarClientes = async (termo: string) => {
    setBuscando(true);
    setErro('');

    try {
      const clientes = await clientesService.searchClientes(termo);
      setClientesEncontrados(clientes);

      if (clientes.length === 0) {
        setErro('Nenhum cliente encontrado. Crie um novo cliente abaixo.');
      }
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error);
      setErro('Erro ao buscar clientes. Tente novamente.');
    } finally {
      setBuscando(false);
    }
  };

  const handleVincular = async () => {
    if (!ticketAtual) {
      setErro('Nenhum ticket selecionado');
      return;
    }

    let clienteId = clienteSelecionado?.id;

    // Se não tem cliente selecionado, criar novo
    if (!clienteId && mostrarCriarCliente) {
      if (!novoClienteNome.trim()) {
        setErro('Informe o nome do cliente');
        return;
      }

      if (!novoClienteEmail.trim()) {
        setErro('Informe o email do cliente');
        return;
      }

      setLoading(true);
      setErro('');

      try {
        // Criar novo cliente
        const novoCliente = await clientesService.createCliente({
          nome: novoClienteNome.trim(),
          email: novoClienteEmail.trim(),
          telefone: novoClienteTelefone.trim() || ticketAtual.contatoTelefone,
          tipo: novoClienteTipo,
          documento: novoClienteDocumento.trim() || undefined,
          status: 'cliente', // Novo cliente já vira cliente ativo
        });

        clienteId = novoCliente.id;
        console.log('✅ Novo cliente criado:', clienteId);
      } catch (error: any) {
        console.error('❌ Erro ao criar cliente:', error);
        const responseMessage = error?.response?.data?.message;
        const normalizedMessage = Array.isArray(responseMessage)
          ? responseMessage.join('. ')
          : responseMessage;
        const fallbackMessage = error instanceof Error ? error.message : undefined;
        setErro(normalizedMessage || fallbackMessage || 'Erro ao criar cliente');
        setLoading(false);
        return;
      }
    }

    // Validação: precisa ter cliente selecionado ou criado
    if (!clienteId) {
      setErro('Selecione um cliente ou crie um novo');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const empresaId = user?.empresa?.id;

      // Vincular cliente ao ticket
      // Endpoint: PATCH /atendimento/tickets/:id com clienteId
      await api.patch(
        `/atendimento/tickets/${ticketAtual.id}`,
        { clienteId },
        { params: { empresaId } },
      );

      console.log('✅ Cliente vinculado ao ticket:', clienteId);

      // Fechar modal
      onClose();

      // Resetar form
      resetForm();

      // Chamar callback de sucesso (recarrega tickets)
      onSucesso();

      // Toast de sucesso
      mostrarToastSucesso();
    } catch (error: any) {
      console.error('❌ Erro ao vincular cliente:', error);
      const responseMessage = error?.response?.data?.message;
      const normalizedMessage = Array.isArray(responseMessage)
        ? responseMessage.join('. ')
        : responseMessage;
      const fallbackMessage = error instanceof Error ? error.message : undefined;
      setErro(normalizedMessage || fallbackMessage || 'Erro ao vincular cliente');
    } finally {
      setLoading(false);
    }
  };

  const mostrarToastSucesso = () => {
    const toast = document.createElement('div');
    toast.className =
      'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2';
    toast.innerHTML = `
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>Cliente vinculado com sucesso!</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleClickBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClickBackdrop}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Link2 className="h-6 w-6 text-[#159A9C]" />
              Vincular Cliente
            </h2>
            {ticketAtual && (
              <p className="text-sm text-gray-500 mt-1">
                Ticket #{ticketAtual.numero} • {ticketAtual.contatoNome || 'Sem nome'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Fechar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Erro */}
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{erro}</p>
            </div>
          )}

          {/* Buscar Cliente Existente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Cliente Existente
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                disabled={loading || mostrarCriarCliente}
                placeholder="Digite nome, email ou telefone do cliente..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              {buscando && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 animate-spin" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Digite pelo menos 3 caracteres para buscar</p>
          </div>

          {/* Lista de Clientes Encontrados */}
          {clientesEncontrados.length > 0 && !mostrarCriarCliente && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {clientesEncontrados.length} cliente(s) encontrado(s):
              </p>
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                {clientesEncontrados.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => setClienteSelecionado(cliente)}
                    disabled={loading}
                    className={`w-full p-4 text-left border-b last:border-b-0 transition-colors ${
                      clienteSelecionado?.id === cliente.id
                        ? 'bg-[#159A9C]/10 border-[#159A9C]'
                        : 'hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          cliente.tipo === 'pessoa_juridica'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-green-100 text-green-600'
                        }`}
                      >
                        {cliente.tipo === 'pessoa_juridica' ? (
                          <Building2 className="h-5 w-5" />
                        ) : (
                          <User className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{cliente.nome}</div>
                        <div className="text-sm text-gray-600">{cliente.email}</div>
                        {cliente.telefone && (
                          <div className="text-xs text-gray-500 mt-1">{cliente.telefone}</div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              cliente.status === 'cliente'
                                ? 'bg-green-100 text-green-800'
                                : cliente.status === 'lead'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {cliente.status === 'cliente'
                              ? 'Cliente'
                              : cliente.status === 'lead'
                                ? 'Lead'
                                : cliente.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {cliente.tipo === 'pessoa_juridica' ? 'PJ' : 'PF'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {!mostrarCriarCliente && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>
          )}

          {/* Botão: Criar Novo Cliente */}
          {!mostrarCriarCliente && (
            <button
              onClick={() => {
                setMostrarCriarCliente(true);
                setClienteSelecionado(null);
                // Auto-preencher nome se disponível
                if (ticketAtual?.contatoNome) {
                  setNovoClienteNome(ticketAtual.contatoNome);
                }
                // Auto-preencher telefone
                if (ticketAtual?.contatoTelefone) {
                  setNovoClienteTelefone(ticketAtual.contatoTelefone);
                }
              }}
              disabled={loading}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#159A9C] hover:bg-[#159A9C]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-gray-700 font-medium"
            >
              <Plus className="h-5 w-5" />
              Criar Novo Cliente
            </button>
          )}

          {/* Formulário: Criar Novo Cliente */}
          {mostrarCriarCliente && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-[#159A9C]" />
                  Novo Cliente
                </h3>
                <button
                  onClick={() => {
                    setMostrarCriarCliente(false);
                    setNovoClienteNome('');
                    setNovoClienteEmail('');
                    setNovoClienteTelefone('');
                    setNovoClienteDocumento('');
                  }}
                  disabled={loading}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>

              {/* Tipo de Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cliente *
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setNovoClienteTipo('pessoa_fisica')}
                    disabled={loading}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      novoClienteTipo === 'pessoa_fisica'
                        ? 'border-[#159A9C] bg-[#159A9C]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <User className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Pessoa Física</div>
                  </button>
                  <button
                    onClick={() => setNovoClienteTipo('pessoa_juridica')}
                    disabled={loading}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                      novoClienteTipo === 'pessoa_juridica'
                        ? 'border-[#159A9C] bg-[#159A9C]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Building2 className="h-5 w-5 mx-auto mb-1" />
                    <div className="text-sm font-medium">Pessoa Jurídica</div>
                  </button>
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome {novoClienteTipo === 'pessoa_juridica' ? 'da Empresa' : 'Completo'} *
                </label>
                <input
                  type="text"
                  value={novoClienteNome}
                  onChange={(e) => setNovoClienteNome(e.target.value)}
                  disabled={loading}
                  placeholder={
                    novoClienteTipo === 'pessoa_juridica'
                      ? 'Razão Social'
                      : 'Nome completo do cliente'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={novoClienteEmail}
                  onChange={(e) => setNovoClienteEmail(e.target.value)}
                  disabled={loading}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={novoClienteTelefone}
                  onChange={(e) => setNovoClienteTelefone(e.target.value)}
                  disabled={loading}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Documento (CPF/CNPJ) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {novoClienteTipo === 'pessoa_juridica' ? 'CNPJ' : 'CPF'}
                </label>
                <input
                  type="text"
                  value={novoClienteDocumento}
                  onChange={(e) => setNovoClienteDocumento(e.target.value)}
                  disabled={loading}
                  placeholder={
                    novoClienteTipo === 'pessoa_juridica' ? '00.000.000/0000-00' : '000.000.000-00'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleVincular}
            disabled={loading || (!clienteSelecionado && !mostrarCriarCliente)}
            className="px-6 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Vinculando...
              </>
            ) : (
              <>
                <Link2 className="h-5 w-5" />
                Vincular Cliente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
