import React, { useState } from 'react';
import { X, AlertTriangle, MessageSquare, Calendar, Building2 } from 'lucide-react';
import { MotivoPerda } from '../../types/oportunidades';

interface ModalMotivoPerdaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dados: {
    motivoPerda: MotivoPerda;
    motivoPerdaDetalhes?: string;
    concorrenteNome?: string;
    dataRevisao?: string;
  }) => void;
  tituloOportunidade: string;
  valorOportunidade?: number;
  loading?: boolean;
}

// Configuração dos motivos de perda com ícones e descrições
const MOTIVOS_PERDA_CONFIG = [
  {
    value: MotivoPerda.PRECO,
    label: '💰 Preço',
    descricao: 'Valor acima do orçamento ou expectativa do cliente',
    icone: '💰',
  },
  {
    value: MotivoPerda.CONCORRENTE,
    label: '🏆 Concorrente',
    descricao: 'Cliente escolheu outra empresa/produto',
    icone: '🏆',
  },
  {
    value: MotivoPerda.TIMING,
    label: '⏰ Timing',
    descricao: 'Momento inadequado para o cliente',
    icone: '⏰',
  },
  {
    value: MotivoPerda.ORCAMENTO,
    label: '💸 Sem Orçamento',
    descricao: 'Cliente não tem budget aprovado',
    icone: '💸',
  },
  {
    value: MotivoPerda.PRODUTO,
    label: '❌ Produto/Serviço',
    descricao: 'Nossa solução não atende às necessidades',
    icone: '❌',
  },
  {
    value: MotivoPerda.PROJETO_CANCELADO,
    label: '🚫 Projeto Cancelado',
    descricao: 'Cliente cancelou o projeto/iniciativa',
    icone: '🚫',
  },
  {
    value: MotivoPerda.SEM_RESPOSTA,
    label: '👻 Sem Resposta',
    descricao: 'Cliente parou de responder (ghosting)',
    icone: '👻',
  },
  {
    value: MotivoPerda.OUTRO,
    label: '📝 Outro',
    descricao: 'Outro motivo não listado',
    icone: '📝',
  },
];

const ModalMotivoPerda: React.FC<ModalMotivoPerdaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tituloOportunidade,
  valorOportunidade,
  loading = false,
}) => {
  const [motivoPerda, setMotivoPerda] = useState<MotivoPerda | ''>('');
  const [motivoPerdaDetalhes, setMotivoPerdaDetalhes] = useState('');
  const [concorrenteNome, setConcorrenteNome] = useState('');
  const [dataRevisao, setDataRevisao] = useState('');

  if (!isOpen) return null;

  const handleConfirmar = () => {
    if (!motivoPerda) return;

    onConfirm({
      motivoPerda: motivoPerda as MotivoPerda,
      motivoPerdaDetalhes: motivoPerdaDetalhes.trim() || undefined,
      concorrenteNome:
        motivoPerda === MotivoPerda.CONCORRENTE && concorrenteNome.trim()
          ? concorrenteNome.trim()
          : undefined,
      dataRevisao: dataRevisao || undefined,
    });
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const isFormValid = motivoPerda !== '';
  const motivoSelecionado = MOTIVOS_PERDA_CONFIG.find((m) => m.value === motivoPerda);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - Vermelho para indicar perda */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Motivo da Perda</h2>
                <p className="text-white/90 text-sm mt-1">
                  📊 Esta informação é crucial para melhorar nosso processo de vendas
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Info da Oportunidade */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">
              Oportunidade Perdida
            </p>
            <p className="font-bold text-[#002333] mb-1">{tituloOportunidade}</p>
            {valorOportunidade && (
              <p className="text-sm text-[#002333]/60">
                Valor:{' '}
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  valorOportunidade,
                )}
              </p>
            )}
          </div>

          {/* Seleção de Motivo - Grid de Cards */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-3">
              Motivo da Perda <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MOTIVOS_PERDA_CONFIG.map((motivo) => (
                <button
                  key={motivo.value}
                  type="button"
                  onClick={() => setMotivoPerda(motivo.value)}
                  disabled={loading}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    ${
                      motivoPerda === motivo.value
                        ? 'border-red-600 bg-red-50 shadow-md'
                        : 'border-[#B4BEC9] hover:border-red-400 hover:bg-gray-50'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{motivo.icone}</span>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${motivoPerda === motivo.value ? 'text-red-700' : 'text-[#002333]'}`}
                      >
                        {motivo.label.replace(motivo.icone + ' ', '')}
                      </p>
                      <p className="text-xs text-[#002333]/60 mt-0.5">{motivo.descricao}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {motivoSelecionado && (
              <p className="mt-2 text-xs text-[#002333]/60 bg-blue-50 p-2 rounded">
                <strong>✅ Selecionado:</strong> {motivoSelecionado.descricao}
              </p>
            )}
          </div>

          {/* Nome do Concorrente (condicional) */}
          {motivoPerda === MotivoPerda.CONCORRENTE && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Nome do Concorrente (opcional)
              </label>
              <div className="relative">
                <div className="absolute top-1/2 -translate-y-1/2 left-3 text-[#002333]/40">
                  <Building2 className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={concorrenteNome}
                  onChange={(e) => setConcorrenteNome(e.target.value)}
                  placeholder="Ex: Empresa XYZ, Produto ABC..."
                  disabled={loading}
                  maxLength={100}
                  className="w-full pl-11 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm disabled:opacity-50"
                />
              </div>
              <p className="mt-1 text-xs text-amber-700">
                💡 Ajuda a identificar nossos principais concorrentes
              </p>
            </div>
          )}

          {/* Detalhes Adicionais */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Detalhes Adicionais (opcional)
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-[#002333]/40">
                <MessageSquare className="h-5 w-5" />
              </div>
              <textarea
                value={motivoPerdaDetalhes}
                onChange={(e) => setMotivoPerdaDetalhes(e.target.value)}
                placeholder="Descreva mais detalhes sobre a perda desta oportunidade... (opcional)"
                rows={4}
                disabled={loading}
                maxLength={1000}
                className="w-full pl-11 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm resize-none disabled:opacity-50"
              />
            </div>
            <p className="mt-1 text-xs text-[#002333]/60">
              {motivoPerdaDetalhes.length}/1000 caracteres
            </p>
          </div>

          {/* Data para Revisitar */}
          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Quando Revisitar? (opcional)
            </label>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-3 text-[#002333]/40">
                <Calendar className="h-5 w-5" />
              </div>
              <input
                type="date"
                value={dataRevisao}
                onChange={(e) => setDataRevisao(e.target.value)}
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-11 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm disabled:opacity-50"
              />
            </div>
            <p className="mt-1 text-xs text-[#002333]/60">
              📅 Defina uma data futura para entrar em contato novamente
            </p>
          </div>

          {/* Alerta sobre análise */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-blue-800">
              <strong>📊 Análise de Perdas:</strong> Estes dados serão usados para gerar relatórios
              de análise de perdas, identificar padrões e melhorar nossa taxa de conversão.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex items-center justify-between gap-3 border-t">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-[#002333] hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={!isFormValid || loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Confirmar Perda
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalMotivoPerda;
