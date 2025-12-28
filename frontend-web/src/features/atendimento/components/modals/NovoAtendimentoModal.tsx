import React, { useState, useEffect } from 'react';
import { X, Phone, MessageCircle, Mail, User, Building2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { api } from '../../../../services/api';
import { TipoTicket, tipoTicketLabels } from '../../../../services/ticketsService';

// ===== INTERFACES =====

export interface CanalAtendimento {
  id: string;
  nome: string;
  tipo: 'whatsapp' | 'telegram' | 'email' | 'chat' | 'telefone';
  ativo: boolean;
}

export interface Contato {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  clienteId?: string;
  clienteNome?: string;
}

export interface NovoAtendimentoData {
  canalId: string;
  contatoId?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  assunto?: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  // Sprint 2: Campos unificação Tickets
  tipo?: TipoTicket;
  titulo?: string;
  descricao?: string;
}

interface NovoAtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSucesso: (ticketId: string) => void;
}

// ===== COMPONENTE PRINCIPAL =====

export function NovoAtendimentoModal({ isOpen, onClose, onSucesso }: NovoAtendimentoModalProps) {
  const { user } = useAuth();

  // Estados
  const [canais, setCanais] = useState<CanalAtendimento[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCanais, setLoadingCanais] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<NovoAtendimentoData>({
    canalId: '',
    prioridade: 'media',
  });

  // Estados de busca
  const [buscaContato, setBuscaContato] = useState('');
  const [contatoSelecionado, setContatoSelecionado] = useState<Contato | null>(null);
  const [mostrarDropdownContatos, setMostrarDropdownContatos] = useState(false);
  const [modoNovoContato, setModoNovoContato] = useState(false);

  // ===== CARREGAR CANAIS =====

  useEffect(() => {
    if (isOpen) {
      carregarCanais();
    }
  }, [isOpen]);

  const carregarCanais = async () => {
    try {
      setLoadingCanais(true);
      setErro(null);

      const token = localStorage.getItem('authToken');
      const empresaId = user?.empresa?.id;

      const response = await api.get('/atendimento/canais', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { empresaId },
      });

      const canaisAtivos = (response.data?.data || response.data || []).filter(
        (c: CanalAtendimento) => c.ativo,
      );

      setCanais(canaisAtivos);

      // Selecionar primeiro canal automaticamente
      if (canaisAtivos.length > 0) {
        setFormData((prev) => ({ ...prev, canalId: canaisAtivos[0].id }));
      }
    } catch (error) {
      console.error('❌ Erro ao carregar canais:', error);
      setErro('Erro ao carregar canais de atendimento');
    } finally {
      setLoadingCanais(false);
    }
  };

  // ===== BUSCAR CONTATOS =====

  const buscarContatos = async (termo: string) => {
    if (termo.length < 2) {
      setContatos([]);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const empresaId = user?.empresa?.id;

      const response = await api.get('/crm/contatos', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          empresaId,
          busca: termo,
          limit: 10,
        },
      });

      setContatos(response.data?.data || response.data || []);
    } catch (error) {
      console.error('❌ Erro ao buscar contatos:', error);
    }
  };

  // ===== HANDLERS =====

  const handleBuscaContatoChange = (valor: string) => {
    setBuscaContato(valor);
    setMostrarDropdownContatos(true);

    if (valor.length >= 2) {
      buscarContatos(valor);
    } else {
      setContatos([]);
    }
  };

  const handleSelecionarContato = (contato: Contato) => {
    setContatoSelecionado(contato);
    setBuscaContato(contato.nome);
    setFormData((prev) => ({
      ...prev,
      contatoId: contato.id,
      contatoNome: undefined,
      contatoTelefone: undefined,
      contatoEmail: undefined,
    }));
    setMostrarDropdownContatos(false);
    setModoNovoContato(false);
  };

  const handleNovoContato = () => {
    setModoNovoContato(true);
    setContatoSelecionado(null);
    setBuscaContato('');
    setFormData((prev) => ({
      ...prev,
      contatoId: undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.canalId) {
      setErro('Selecione um canal de atendimento');
      return;
    }

    if (!contatoSelecionado && !modoNovoContato) {
      setErro('Selecione ou crie um contato');
      return;
    }

    if (modoNovoContato) {
      if (!formData.contatoNome || formData.contatoNome.trim().length === 0) {
        setErro('Informe o nome do contato');
        return;
      }
      if (!formData.contatoTelefone && !formData.contatoEmail) {
        setErro('Informe pelo menos telefone ou e-mail do contato');
        return;
      }
    }

    try {
      setLoading(true);
      setErro(null);

      const token = localStorage.getItem('authToken');
      const empresaId = user?.empresa?.id;

      // Payload para criar ticket
      const payload: any = {
        canalId: formData.canalId,
        assunto: formData.assunto || 'Novo atendimento',
        prioridade: formData.prioridade,
        empresaId,
        // Sprint 2: Campos unificação
        tipo: formData.tipo,
        titulo: formData.titulo,
        descricao: formData.descricao,
      };

      // Se contato existente
      if (contatoSelecionado) {
        payload.contatoId = contatoSelecionado.id;
      } else {
        // Se novo contato
        payload.contatoNome = formData.contatoNome;
        payload.contatoTelefone = formData.contatoTelefone;
        payload.contatoEmail = formData.contatoEmail;
      }

      const response = await api.post('/atendimento/tickets', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const ticketCriado = response.data?.data || response.data;

      console.log('✅ Ticket criado com sucesso:', ticketCriado);

      onSucesso(ticketCriado.id);
      handleClose();
    } catch (error: any) {
      console.error('❌ Erro ao criar ticket:', error);
      const mensagemErro =
        error.response?.data?.message || error.response?.data?.error || 'Erro ao criar atendimento';
      setErro(mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      canalId: canais.length > 0 ? canais[0].id : '',
      prioridade: 'media',
    });
    setBuscaContato('');
    setContatoSelecionado(null);
    setModoNovoContato(false);
    setErro(null);
    onClose();
  };

  // ===== RENDER =====

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-[#002333] flex items-center gap-3">
            <MessageCircle className="h-7 w-7 text-[#159A9C]" />
            Novo Atendimento
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Erro Global */}
          {erro && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{erro}</p>
            </div>
          )}

          {/* Canal de Atendimento */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Canal de Atendimento *
            </label>
            {loadingCanais ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando canais...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {canais.map((canal) => (
                  <button
                    key={canal.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, canalId: canal.id }))}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.canalId === canal.id
                        ? 'border-[#159A9C] bg-[#159A9C]/5'
                        : 'border-gray-200 hover:border-[#159A9C]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {canal.tipo === 'whatsapp' && <Phone className="h-5 w-5 text-green-600" />}
                      {canal.tipo === 'email' && <Mail className="h-5 w-5 text-blue-600" />}
                      {canal.tipo === 'chat' && (
                        <MessageCircle className="h-5 w-5 text-purple-600" />
                      )}
                      {canal.tipo === 'telefone' && <Phone className="h-5 w-5 text-orange-600" />}
                      <span className="font-medium text-sm text-[#002333]">{canal.nome}</span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">{canal.tipo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Busca de Contato */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#002333]">Contato *</label>
              {!modoNovoContato && (
                <button
                  type="button"
                  onClick={handleNovoContato}
                  className="text-sm text-[#159A9C] hover:text-[#0F7B7D] font-medium"
                >
                  + Novo contato
                </button>
              )}
            </div>

            {!modoNovoContato ? (
              <div className="relative">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={buscaContato}
                    onChange={(e) => handleBuscaContatoChange(e.target.value)}
                    onFocus={() => setMostrarDropdownContatos(true)}
                    placeholder="Digite nome, telefone ou e-mail..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                  />
                </div>

                {/* Dropdown de Contatos */}
                {mostrarDropdownContatos && contatos.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {contatos.map((contato) => (
                      <button
                        key={contato.id}
                        type="button"
                        onClick={() => handleSelecionarContato(contato)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-[#002333]">{contato.nome}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                          {contato.telefone && <span>{contato.telefone}</span>}
                          {contato.email && <span>{contato.email}</span>}
                        </div>
                        {contato.clienteNome && (
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {contato.clienteNome}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Contato Selecionado */}
                {contatoSelecionado && (
                  <div className="mt-3 p-3 bg-[#159A9C]/5 border border-[#159A9C]/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-[#002333]">{contatoSelecionado.nome}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {contatoSelecionado.telefone && (
                            <span>{contatoSelecionado.telefone}</span>
                          )}
                          {contatoSelecionado.telefone && contatoSelecionado.email && ' • '}
                          {contatoSelecionado.email && <span>{contatoSelecionado.email}</span>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setContatoSelecionado(null);
                          setBuscaContato('');
                          setFormData((prev) => ({ ...prev, contatoId: undefined }));
                        }}
                        className="p-1 hover:bg-white rounded transition-colors"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Formulário Novo Contato */
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#002333]">Dados do Novo Contato</span>
                  <button
                    type="button"
                    onClick={() => {
                      setModoNovoContato(false);
                      setFormData((prev) => ({
                        ...prev,
                        contatoNome: undefined,
                        contatoTelefone: undefined,
                        contatoEmail: undefined,
                      }));
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancelar
                  </button>
                </div>

                <input
                  type="text"
                  value={formData.contatoNome || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contatoNome: e.target.value }))
                  }
                  placeholder="Nome completo *"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />

                <input
                  type="tel"
                  value={formData.contatoTelefone || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contatoTelefone: e.target.value }))
                  }
                  placeholder="Telefone (ex: 11999999999)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />

                <input
                  type="email"
                  value={formData.contatoEmail || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, contatoEmail: e.target.value }))
                  }
                  placeholder="E-mail"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
                />

                <p className="text-xs text-gray-500">* Informe pelo menos telefone ou e-mail</p>
              </div>
            )}
          </div>

          {/* Assunto */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Assunto (opcional)
            </label>
            <input
              type="text"
              value={formData.assunto || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, assunto: e.target.value }))}
              placeholder="Breve descrição do motivo do contato..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>

          {/* Sprint 2: Tipo do Ticket */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Tipo (opcional)
            </label>
            <select
              value={formData.tipo || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, tipo: e.target.value as TipoTicket }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent bg-white"
            >
              <option value="">Selecione um tipo...</option>
              {(Object.keys(tipoTicketLabels) as TipoTicket[]).map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipoTicketLabels[tipo]}
                </option>
              ))}
            </select>
          </div>

          {/* Sprint 2: Título */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Título (opcional)
            </label>
            <input
              type="text"
              value={formData.titulo || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Título resumido do ticket..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent"
            />
          </div>

          {/* Sprint 2: Descrição */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={formData.descricao || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição detalhada do problema ou solicitação..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent resize-none"
            />
          </div>

          {/* Prioridade */
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">Prioridade</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  valor: 'baixa',
                  label: 'Baixa',
                  cor: 'bg-gray-100 text-gray-700 border-gray-300',
                },
                {
                  valor: 'media',
                  label: 'Média',
                  cor: 'bg-blue-100 text-blue-700 border-blue-300',
                },
                {
                  valor: 'alta',
                  label: 'Alta',
                  cor: 'bg-orange-100 text-orange-700 border-orange-300',
                },
                {
                  valor: 'urgente',
                  label: 'Urgente',
                  cor: 'bg-red-100 text-red-700 border-red-300',
                },
              ].map((prioridade) => (
                <button
                  key={prioridade.valor}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, prioridade: prioridade.valor as any }))
                  }
                  className={`px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                    formData.prioridade === prioridade.valor
                      ? prioridade.cor + ' ring-2 ring-offset-2'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {prioridade.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-white text-[#002333] border border-[#B4BEC9] rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingCanais}
              className="flex-1 px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4" />
                  Criar Atendimento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
