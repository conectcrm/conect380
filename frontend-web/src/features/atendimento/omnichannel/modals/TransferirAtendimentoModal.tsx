import React, { useState } from 'react';
import { X, UserPlus, Search, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';

interface TransferirAtendimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: TransferenciaData) => void;
  ticketAtual?: {
    id: string;
    contato: { nome: string };
    atendente?: { nome: string };
  };
}

export interface TransferenciaData {
  agenteId: string;
  motivo: string;
  notaInterna?: string;
  notificarAgente: boolean;
}

export const TransferirAtendimentoModal: React.FC<TransferirAtendimentoModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketAtual
}) => {
  const { currentPalette } = useTheme();

  const [buscaAgente, setBuscaAgente] = useState('');
  const [agenteSelecionado, setAgenteSelecionado] = useState<any>(null);
  const [motivo, setMotivo] = useState('');
  const [notaInterna, setNotaInterna] = useState('');
  const [notificarAgente, setNotificarAgente] = useState(true);

  // Mock de agentes (será substituído por API)
  const agentesMock = [
    { id: 'a1', nome: 'Ana Silva', avatar: 'AS', status: 'online', atendimentos: 3 },
    { id: 'a2', nome: 'Carlos Santos', avatar: 'CS', status: 'online', atendimentos: 5 },
    { id: 'a3', nome: 'Beatriz Lima', avatar: 'BL', status: 'ocupado', atendimentos: 8 },
    { id: 'a4', nome: 'Diego Costa', avatar: 'DC', status: 'offline', atendimentos: 0 }
  ];

  const agentesFiltrados = buscaAgente
    ? agentesMock.filter(a =>
      a.nome.toLowerCase().includes(buscaAgente.toLowerCase())
    )
    : agentesMock;

  const motivosComuns = [
    'Especialidade em outro setor',
    'Sobrecarga de atendimentos',
    'Ausência temporária',
    'Solicitação do cliente',
    'Melhor adequação ao perfil'
  ];

  const handleConfirmar = () => {
    if (!agenteSelecionado || !motivo) {
      alert('Selecione um agente e informe o motivo da transferência');
      return;
    }

    const dados: TransferenciaData = {
      agenteId: agenteSelecionado.id,
      motivo,
      notaInterna: notaInterna || undefined,
      notificarAgente
    };

    onConfirm(dados);
    handleFechar();
  };

  const handleFechar = () => {
    // Reset form
    setBuscaAgente('');
    setAgenteSelecionado(null);
    setMotivo('');
    setNotaInterna('');
    setNotificarAgente(true);
    onClose();
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'ocupado': return '#F59E0B';
      case 'offline': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'Disponível';
      case 'ocupado': return 'Ocupado';
      case 'offline': return 'Offline';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-[calc(100%-2rem)] sm:w-[500px] md:w-[600px] lg:w-[700px] max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: `${currentPalette.colors.primary}10` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentPalette.colors.primary, color: 'white' }}
            >
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Transferir Atendimento
              </h2>
              {ticketAtual && (
                <p className="text-sm text-gray-500">
                  Cliente: {ticketAtual.contato.nome}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleFechar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">
            {/* Busca e Seleção de Agente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transferir para *
              </label>

              {!agenteSelecionado ? (
                <>
                  {/* Campo de Busca */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={buscaAgente}
                      onChange={(e) => setBuscaAgente(e.target.value)}
                      placeholder="Buscar agente por nome..."
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                      style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                    />
                  </div>

                  {/* Lista de Agentes */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {agentesFiltrados.map((agente) => (
                      <button
                        key={agente.id}
                        onClick={() => setAgenteSelecionado(agente)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                              style={{ backgroundColor: currentPalette.colors.primary }}
                            >
                              {agente.avatar}
                            </div>
                            <div
                              className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                              style={{ backgroundColor: getStatusColor(agente.status) }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {agente.nome}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getStatusLabel(agente.status)} • {agente.atendimentos} atendimentos
                            </p>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getStatusColor(agente.status)}20`,
                            color: getStatusColor(agente.status)
                          }}
                        >
                          {agente.atendimentos === 0 ? 'Livre' : `${agente.atendimentos} tickets`}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                /* Agente Selecionado */
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: currentPalette.colors.primary }}
                      >
                        {agenteSelecionado.avatar}
                      </div>
                      <div
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white"
                        style={{ backgroundColor: getStatusColor(agenteSelecionado.status) }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {agenteSelecionado.nome}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getStatusLabel(agenteSelecionado.status)} • {agenteSelecionado.atendimentos} atendimentos ativos
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAgenteSelecionado(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Motivo da Transferência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da Transferência *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {motivosComuns.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMotivo(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${motivo === m
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    style={{
                      backgroundColor: motivo === m ? currentPalette.colors.primary : undefined
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ou digite um motivo personalizado..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
              />
            </div>

            {/* Nota Interna (Opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nota Interna (Opcional)
              </label>
              <textarea
                value={notaInterna}
                onChange={(e) => setNotaInterna(e.target.value)}
                placeholder="Adicione informações adicionais para o próximo agente..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm resize-none"
                style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
              />
              <p className="text-xs text-gray-500 mt-1">
                Esta nota será visível apenas para a equipe interna
              </p>
            </div>

            {/* Opção de Notificar */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="notificar"
                checked={notificarAgente}
                onChange={(e) => setNotificarAgente(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-0"
                style={{
                  accentColor: currentPalette.colors.primary,
                  '--tw-ring-color': currentPalette.colors.primary
                } as any}
              />
              <label htmlFor="notificar" className="text-sm text-gray-700 cursor-pointer flex-1">
                Notificar o agente sobre a transferência
                <span className="block text-xs text-gray-500 mt-0.5">
                  O agente receberá uma notificação em tempo real
                </span>
              </label>
            </div>

            {/* Aviso */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Atenção!</p>
                <p className="text-xs">
                  Ao transferir o atendimento, você não terá mais acesso a esta conversa.
                  O novo agente assumirá toda a responsabilidade pelo cliente.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleFechar}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!agenteSelecionado || !motivo}
            className="px-6 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: currentPalette.colors.primary }}
          >
            Transferir Atendimento
          </button>
        </div>
      </div>
    </div>
  );
};
