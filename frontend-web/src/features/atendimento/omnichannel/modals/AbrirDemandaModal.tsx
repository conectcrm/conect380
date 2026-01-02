import React, { useState } from 'react';
import { X, AlertCircle, Calendar, User } from 'lucide-react';
import { useTheme } from '../../../../contexts/ThemeContext';

interface AbrirDemandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: NovaDemanda) => void;
  ticketAtual?: {
    id: string;
    contato: { nome: string };
  };
}

export interface NovaDemanda {
  tipo: 'bug' | 'feature' | 'suporte' | 'melhoria';
  titulo: string;
  descricao: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  responsavelId?: string;
  prazo?: Date;
}

export const AbrirDemandaModal: React.FC<AbrirDemandaModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketAtual,
}) => {
  const { currentPalette } = useTheme();
  const [tipo, setTipo] = useState<'bug' | 'feature' | 'suporte' | 'melhoria'>('suporte');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState('');

  const tipos = [
    { value: 'bug', label: '🐛 Bug', cor: '#EF4444' },
    { value: 'feature', label: '✨ Feature', cor: '#8B5CF6' },
    { value: 'suporte', label: '🎧 Suporte', cor: '#10B981' },
    { value: 'melhoria', label: '🚀 Melhoria', cor: '#F59E0B' },
  ];

  const prioridades = [
    { value: 'baixa', label: 'Baixa', cor: '#10B981' },
    { value: 'media', label: 'Média', cor: '#F59E0B' },
    { value: 'alta', label: 'Alta', cor: '#EF4444' },
    { value: 'urgente', label: 'Urgente', cor: '#DC2626' },
  ];

  const handleConfirmar = () => {
    if (!titulo.trim() || !descricao.trim()) {
      alert('Preencha título e descrição');
      return;
    }

    const dados: NovaDemanda = {
      tipo,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      prioridade,
      responsavelId: responsavel || undefined,
      prazo: prazo ? new Date(prazo) : undefined,
    };

    onConfirm(dados);
    handleFechar();
  };

  const handleFechar = () => {
    setTipo('suporte');
    setTitulo('');
    setDescricao('');
    setPrioridade('media');
    setResponsavel('');
    setPrazo('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-[calc(100%-2rem)] sm:w-[500px] md:w-[600px] lg:w-[700px] max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: `${currentPalette.colors.primary}10` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentPalette.colors.primary, color: 'white' }}
            >
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Abrir Demanda</h2>
              {ticketAtual && (
                <p className="text-sm text-gray-500">
                  Vinculada ao atendimento de {ticketAtual.contato.nome}
                </p>
              )}
            </div>
          </div>
          <button onClick={handleFechar} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <div className="grid grid-cols-4 gap-2">
                {tipos.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value as any)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      tipo === t.value ? 'text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                    style={{ backgroundColor: tipo === t.value ? t.cor : undefined }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Título *</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Erro ao processar pagamento"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a demanda em detalhes..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm resize-none"
                style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
              <div className="grid grid-cols-4 gap-2">
                {prioridades.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPrioridade(p.value as any)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      prioridade === p.value ? 'text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                    style={{ backgroundColor: prioridade === p.value ? p.cor : undefined }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Responsável
                </label>
                <input
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Buscar responsável..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                  style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Prazo
                </label>
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:border-transparent text-sm"
                  style={{ '--tw-ring-color': currentPalette.colors.primary } as any}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <button
            onClick={handleFechar}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!titulo.trim() || !descricao.trim()}
            className="px-6 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: currentPalette.colors.primary }}
          >
            Criar Demanda
          </button>
        </div>
      </div>
    </div>
  );
};
