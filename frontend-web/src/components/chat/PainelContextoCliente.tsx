import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DropdownContatos } from '../../features/atendimento/chat/DropdownContatos';
import { useAuth } from '../../hooks/useAuth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ========================================
// INTERFACES E TIPOS
// ========================================

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento?: string;
  empresa?: string;
  cargo?: string;
  segmento: 'VIP' | 'Regular' | 'Novo';
  primeiroContato: Date;
  ultimoContato: Date;
  tags?: string[];
}

interface Estatisticas {
  valorTotalGasto: number;
  totalTickets: number;
  ticketsResolvidos: number;
  ticketsAbertos: number;
  avaliacaoMedia: number;
  tempoMedioResposta: string;
}

interface TicketHistorico {
  id: string;
  numero: number;
  status: string;
  assunto: string;
  criadoEm: Date;
  canalId: string;
}

interface Historico {
  propostas: any[];
  faturas: any[];
  tickets: TicketHistorico[];
}

interface ContextoCliente {
  cliente: Cliente;
  estatisticas: Estatisticas;
  historico: Historico;
}

interface PainelContextoClienteProps {
  clienteId: string;
  ticketId: string;
  collapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

type AbaAtiva = 'info' | 'historico' | 'acoes';

// ========================================
// COMPONENTE PRINCIPAL
// ========================================

export function PainelContextoCliente({
  clienteId,
  ticketId,
  collapsed = false,
  onToggle,
  onClose,
}: PainelContextoClienteProps) {
  const { user } = useAuth();
  const [contexto, setContexto] = useState<ContextoCliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('info');

  // Carregar contexto do cliente
  useEffect(() => {
    if (clienteId && !collapsed) {
      carregarContexto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, collapsed]);

  const carregarContexto = async () => {
    setLoading(true);
    setErro(null);

    try {
      const token = localStorage.getItem('authToken');
      const empresaId = user?.empresa?.id;

      // Determinar se clienteId é um UUID ou telefone
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clienteId);

      let url: string;
      if (isUUID) {
        // Se for UUID, usar endpoint padrão
        url = `${API_URL}/api/atendimento/clientes/${clienteId}/contexto`;
      } else {
        // Se não for UUID (é telefone), usar endpoint por telefone
        const telefone = clienteId.replace('cliente-', ''); // Remove prefixo "cliente-"
        url = `${API_URL}/api/atendimento/clientes/por-telefone/${telefone}/contexto`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { empresaId },
      }
      );

      setContexto(response.data);
      console.log('✅ Contexto do cliente carregado:', response.data);
    } catch (error: any) {
      console.error('❌ Erro ao carregar contexto:', error);
      setErro(error.response?.data?.message || 'Erro ao carregar contexto do cliente');
    } finally {
      setLoading(false);
    }
  };

  // Se estiver colapsado, não renderizar
  if (collapsed) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <aside className="w-80 bg-white border-l shadow-lg flex flex-col">
        <div className="p-4 flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Carregando contexto...</p>
          </div>
        </div>
      </aside>
    );
  }

  // Error state
  if (erro || !contexto) {
    return (
      <aside className="w-80 bg-white border-l shadow-lg flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">📊 Contexto</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              ×
            </button>
          )}
        </div>
        <div className="p-4 flex items-center justify-center h-full">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">{erro || 'Erro ao carregar'}</p>
            <button
              onClick={carregarContexto}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-white border-l shadow-lg flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800">📊 Contexto do Cliente</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition text-xl"
            aria-label="Fechar painel"
          >
            ×
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="flex border-b bg-gray-50">
        <button
          className={`flex-1 py-3 text-sm font-medium transition ${abaAtiva === 'info'
            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
          onClick={() => setAbaAtiva('info')}
        >
          Info
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition ${abaAtiva === 'historico'
            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
          onClick={() => setAbaAtiva('historico')}
        >
          Histórico
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition ${abaAtiva === 'acoes'
            ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
            : 'text-gray-600 hover:text-gray-800'
            }`}
          onClick={() => setAbaAtiva('acoes')}
        >
          Ações
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="flex-1 overflow-y-auto">
        {abaAtiva === 'info' && <AbaInfo contexto={contexto} />}
        {abaAtiva === 'historico' && <AbaHistorico contexto={contexto} />}
        {abaAtiva === 'acoes' && <AbaAcoes clienteId={clienteId} ticketId={ticketId} />}
      </div>
    </aside>
  );
}

// ========================================
// ABA: INFO
// ========================================

function AbaInfo({ contexto }: { contexto: ContextoCliente }) {
  const { cliente, estatisticas } = contexto;

  return (
    <div className="p-4 space-y-4">
      {/* Dados Básicos */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Dados Básicos</h3>
        <div className="space-y-2">
          <InfoItem icon="📧" label="Email" valor={cliente.email} />
          <InfoItem icon="📱" label="Telefone" valor={cliente.telefone} />
          {cliente.documento && <InfoItem icon="🆔" label="Documento" valor={cliente.documento} />}
          {cliente.empresa && <InfoItem icon="🏢" label="Empresa" valor={cliente.empresa} />}
          {cliente.cargo && <InfoItem icon="💼" label="Cargo" valor={cliente.cargo} />}
        </div>
      </div>

      {/* Dropdown de Contatos - NOVO! */}
      <div>
        <DropdownContatos
          clienteId={cliente.id}
          onContatoSelecionado={(contato) => {
            console.log('📞 Contato selecionado no painel:', contato);
          }}
          onContatoAdicionado={(contato) => {
            console.log('➕ Novo contato adicionado no painel:', contato);
          }}
        />
      </div>

      {/* Segmento */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Segmento</h3>
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${cliente.segmento === 'VIP'
            ? 'bg-yellow-100 text-yellow-800'
            : cliente.segmento === 'Novo'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
            }`}
        >
          {cliente.segmento === 'VIP' && '⭐ '}
          {cliente.segmento}
        </span>
      </div>

      {/* Tags */}
      {cliente.tags && cliente.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {cliente.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Estatísticas</h3>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon="💰"
            label="Total Gasto"
            valor={`R$ ${estatisticas.valorTotalGasto.toFixed(2)}`}
            cor="green"
          />
          <StatCard
            icon="🎫"
            label="Tickets"
            valor={`${estatisticas.totalTickets}`}
            cor="blue"
          />
          <StatCard
            icon="✅"
            label="Resolvidos"
            valor={`${estatisticas.ticketsResolvidos}`}
            cor="green"
          />
          <StatCard
            icon="⏱️"
            label="Abertos"
            valor={`${estatisticas.ticketsAbertos}`}
            cor="yellow"
          />
        </div>

        <div className="mt-3 space-y-2">
          <InfoItem
            icon="⭐"
            label="Avaliação"
            valor={`${estatisticas.avaliacaoMedia.toFixed(1)} / 5.0`}
          />
          <InfoItem
            icon="⚡"
            label="Tempo Médio"
            valor={estatisticas.tempoMedioResposta}
          />
        </div>
      </div>

      {/* Datas */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">📅 Datas</h3>
        <div className="space-y-2 text-xs text-gray-600">
          <div>
            <strong>Primeiro contato:</strong>{' '}
            {new Date(cliente.primeiroContato).toLocaleDateString('pt-BR')}
          </div>
          <div>
            <strong>Último contato:</strong>{' '}
            {new Date(cliente.ultimoContato).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// ABA: HISTÓRICO
// ========================================

function AbaHistorico({ contexto }: { contexto: ContextoCliente }) {
  const { historico } = contexto;

  return (
    <div className="p-4 space-y-4">
      {/* Propostas */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          📄 Propostas ({historico.propostas.length})
        </h3>
        {historico.propostas.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Nenhuma proposta encontrada</p>
        ) : (
          <div className="space-y-2">
            {historico.propostas.map((proposta: any, index: number) => (
              <div
                key={index}
                className="p-2 bg-gray-50 rounded border border-gray-200 text-xs"
              >
                <div className="font-medium">#{proposta.numero}</div>
                <div className="text-gray-600">{proposta.titulo}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Faturas */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          💰 Faturas ({historico.faturas.length})
        </h3>
        {historico.faturas.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Nenhuma fatura encontrada</p>
        ) : (
          <div className="space-y-2">
            {historico.faturas.map((fatura: any, index: number) => (
              <div
                key={index}
                className="p-2 bg-gray-50 rounded border border-gray-200 text-xs"
              >
                <div className="font-medium">#{fatura.numero}</div>
                <div className="text-gray-600">{fatura.descricao}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tickets Anteriores */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          🎫 Tickets Anteriores ({historico.tickets.length})
        </h3>
        {historico.tickets.length === 0 ? (
          <p className="text-xs text-gray-500 italic">Nenhum ticket anterior</p>
        ) : (
          <div className="space-y-2">
            {historico.tickets.map((ticket: TicketHistorico) => (
              <div
                key={ticket.id}
                className="p-2 bg-gray-50 rounded border border-gray-200 text-xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">Ticket #{ticket.numero}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${ticket.status === 'RESOLVIDO'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {ticket.status}
                  </span>
                </div>
                <div className="text-gray-600">{ticket.assunto || 'Sem assunto'}</div>
                <div className="text-gray-500 mt-1">
                  {new Date(ticket.criadoEm).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// ABA: AÇÕES
// ========================================

function AbaAcoes({ clienteId, ticketId }: { clienteId: string; ticketId: string }) {
  const handleCriarProposta = () => {
    console.log('🎯 Criar proposta para cliente:', clienteId);
    alert('Funcionalidade em desenvolvimento: Criar Proposta');
  };

  const handleCriarFatura = () => {
    console.log('💰 Criar fatura para cliente:', clienteId);
    alert('Funcionalidade em desenvolvimento: Criar Fatura');
  };

  const handleVerPerfilCompleto = () => {
    console.log('👤 Ver perfil completo do cliente:', clienteId);
    window.open(`/clientes/${clienteId}`, '_blank');
  };

  const handleAgendarFollowUp = () => {
    console.log('📅 Agendar follow-up para cliente:', clienteId);
    alert('Funcionalidade em desenvolvimento: Agendar Follow-up');
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ações Rápidas</h3>

      <ActionButton
        icon="📄"
        label="Nova Proposta"
        descricao="Criar proposta comercial"
        onClick={handleCriarProposta}
      />

      <ActionButton
        icon="💰"
        label="Nova Fatura"
        descricao="Gerar fatura para cliente"
        onClick={handleCriarFatura}
      />

      <ActionButton
        icon="📅"
        label="Agendar Follow-up"
        descricao="Agendar próximo contato"
        onClick={handleAgendarFollowUp}
      />

      <ActionButton
        icon="🔗"
        label="Ver Perfil CRM"
        descricao="Abrir cadastro completo"
        onClick={handleVerPerfilCompleto}
      />
    </div>
  );
}

// ========================================
// COMPONENTES AUXILIARES
// ========================================

function InfoItem({ icon, label, valor }: { icon: string; label: string; valor: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-base">{icon}</span>
      <div className="flex-1">
        <div className="text-gray-500">{label}</div>
        <div className="text-gray-900 font-medium">{valor}</div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  valor,
  cor,
}: {
  icon: string;
  label: string;
  valor: string;
  cor: string;
}) {
  const corClasses = {
    green: 'bg-green-50 text-green-800 border-green-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    red: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div className={`p-3 rounded border ${corClasses[cor as keyof typeof corClasses]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-base font-bold mt-1">{valor}</div>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  descricao,
  onClick,
}: {
  icon: string;
  label: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <div className="text-xs text-gray-500">{descricao}</div>
        </div>
      </div>
    </button>
  );
}
