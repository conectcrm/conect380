import React, { useCallback, useEffect, useId, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Ghost,
  Info,
  PackageX,
  Trophy,
  Wallet,
  X,
} from 'lucide-react';
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
  errorMessage?: string | null;
}

type MotivoPerdaConfig = {
  value: MotivoPerda;
  label: string;
  descricao: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const MOTIVOS_PERDA_CONFIG: MotivoPerdaConfig[] = [
  {
    value: MotivoPerda.PRECO,
    label: 'Preço',
    descricao: 'Valor acima do orçamento ou expectativa do cliente',
    Icon: DollarSign,
  },
  {
    value: MotivoPerda.CONCORRENTE,
    label: 'Concorrente',
    descricao: 'Cliente escolheu outra empresa/produto',
    Icon: Trophy,
  },
  {
    value: MotivoPerda.TIMING,
    label: 'Timing',
    descricao: 'Momento inadequado para o cliente',
    Icon: Clock,
  },
  {
    value: MotivoPerda.ORCAMENTO,
    label: 'Sem orçamento',
    descricao: 'Cliente não tem budget aprovado',
    Icon: Wallet,
  },
  {
    value: MotivoPerda.PRODUTO,
    label: 'Produto/serviço',
    descricao: 'Nossa solução não atende às necessidades',
    Icon: PackageX,
  },
  {
    value: MotivoPerda.PROJETO_CANCELADO,
    label: 'Projeto cancelado',
    descricao: 'Cliente cancelou o projeto/iniciativa',
    Icon: Ban,
  },
  {
    value: MotivoPerda.SEM_RESPOSTA,
    label: 'Sem resposta',
    descricao: 'Cliente parou de responder',
    Icon: Ghost,
  },
  {
    value: MotivoPerda.OUTRO,
    label: 'Outro',
    descricao: 'Outro motivo não listado',
    Icon: Info,
  },
];

const ModalMotivoPerda: React.FC<ModalMotivoPerdaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  tituloOportunidade,
  valorOportunidade,
  loading = false,
  errorMessage = null,
}) => {
  const reactId = useId();
  const titleId = `modal-motivo-perda-title-${reactId}`;
  const descriptionId = `modal-motivo-perda-description-${reactId}`;
  const requiredErrorId = `modal-motivo-perda-required-error-${reactId}`;

  const [motivoPerda, setMotivoPerda] = useState<MotivoPerda | ''>('');
  const [motivoPerdaDetalhes, setMotivoPerdaDetalhes] = useState('');
  const [concorrenteNome, setConcorrenteNome] = useState('');
  const [dataRevisao, setDataRevisao] = useState('');
  const [requiredError, setRequiredError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    setMotivoPerda('');
    setMotivoPerdaDetalhes('');
    setConcorrenteNome('');
    setDataRevisao('');
    setRequiredError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  const isFormValid = motivoPerda !== '';
  const motivoSelecionado = MOTIVOS_PERDA_CONFIG.find((m) => m.value === motivoPerda);

  const handleConfirmar = () => {
    if (!motivoPerda) {
      setRequiredError('Selecione um motivo para registrar a perda.');
      return;
    }

    setRequiredError(null);

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

  return (
    <div
      data-testid="modal-motivo-perda"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#B4BEC9]">
        <div className="p-6 border-b border-[#B4BEC9]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <h2 id={titleId} className="text-xl font-bold text-[#002333]">
                  Motivo da perda
                </h2>
                <p id={descriptionId} className="text-sm text-[#002333]/70 mt-1">
                  Selecione o motivo principal e, se quiser, inclua detalhes para apoiar análises.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              aria-label="Fechar modal"
              className="p-2 rounded-lg transition-colors hover:bg-[#DEEFE7]/35 disabled:opacity-50"
            >
              <X className="h-5 w-5 text-[#002333]" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl p-4 border border-[#B4BEC9] bg-[#DEEFE7]/35">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-2">
              Oportunidade marcada como perdida
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

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-3">
              Motivo da perda <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MOTIVOS_PERDA_CONFIG.map((motivo) => (
                <button
                  key={motivo.value}
                  data-testid={`modal-motivo-perda-option-${motivo.value}`}
                  type="button"
                  onClick={() => {
                    setMotivoPerda(motivo.value);
                    setRequiredError(null);
                  }}
                  disabled={loading}
                  className={`
                    p-4 rounded-lg border text-left transition-all
                    ${
                      motivoPerda === motivo.value
                        ? 'border-[#159A9C] bg-[#DEEFE7]/35 shadow-sm ring-1 ring-[#159A9C]/25'
                        : 'border-[#B4BEC9] hover:border-[#159A9C] hover:bg-[#DEEFE7]/20'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:ring-2 focus:ring-[#159A9C]/40 focus:ring-offset-2
                  `}
                >
                  <div className="flex items-start gap-3">
                    <motivo.Icon
                      className={`h-5 w-5 mt-0.5 ${
                        motivoPerda === motivo.value ? 'text-[#159A9C]' : 'text-[#002333]/60'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#002333]">{motivo.label}</p>
                      <p className="text-xs text-[#002333]/60 mt-0.5">{motivo.descricao}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {requiredError && (
              <p
                id={requiredErrorId}
                className="mt-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-2"
              >
                {requiredError}
              </p>
            )}

            {motivoSelecionado && (
              <p className="mt-2 text-xs text-[#002333]/70 bg-[#DEEFE7]/35 border border-[#B4BEC9] p-2 rounded-lg">
                <strong className="text-[#002333]">Selecionado:</strong> {motivoSelecionado.descricao}
              </p>
            )}
          </div>

          {motivoPerda === MotivoPerda.CONCORRENTE && (
            <div className="rounded-lg p-4 border border-[#B4BEC9] bg-[#DEEFE7]/35">
              <label className="block text-sm font-medium text-[#002333] mb-2">
                Nome do concorrente (opcional)
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
                  className="w-full pl-11 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C]/30 focus:border-[#159A9C] text-sm disabled:opacity-50"
                />
              </div>
              <p className="mt-1 text-xs text-[#002333]/70">
                Ajuda a identificar os concorrentes mais frequentes.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Detalhes adicionais (opcional)
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 text-[#002333]/40">
                <Info className="h-5 w-5" />
              </div>
              <textarea
                value={motivoPerdaDetalhes}
                onChange={(e) => setMotivoPerdaDetalhes(e.target.value)}
                placeholder="Descreva mais detalhes sobre a perda desta oportunidade... (opcional)"
                rows={4}
                disabled={loading}
                maxLength={1000}
                className="w-full pl-11 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C]/30 focus:border-[#159A9C] text-sm resize-none disabled:opacity-50"
              />
            </div>
            <p className="mt-1 text-xs text-[#002333]/60">
              {motivoPerdaDetalhes.length}/1000 caracteres
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#002333] mb-2">
              Quando revisitar? (opcional)
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
                className="w-full pl-11 pr-4 py-2.5 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C]/30 focus:border-[#159A9C] text-sm disabled:opacity-50"
              />
            </div>
            <p className="mt-1 text-xs text-[#002333]/60">
              Defina uma data futura para tentar reabrir a oportunidade.
            </p>
          </div>

          <div className="rounded-lg p-3 border border-[#B4BEC9] bg-[#DEEFE7]/35">
            <p className="text-xs text-[#002333]/80">
              <strong className="text-[#002333]">Análise de perdas:</strong> estes dados são usados em
              relatórios para identificar padrões e melhorar a taxa de conversão.
            </p>
          </div>

          {errorMessage && (
            <div
              data-testid="modal-motivo-perda-error"
              className="bg-red-50 rounded-lg p-3 border border-red-200"
            >
              <p className="text-sm text-red-800">
                <strong>Não foi possível registrar a perda:</strong> {errorMessage}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white px-6 py-4 rounded-b-2xl flex items-center justify-between gap-3 border-t border-[#B4BEC9]">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-[#002333] hover:bg-[#DEEFE7]/35 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            data-testid="modal-motivo-perda-confirmar"
            type="button"
            onClick={handleConfirmar}
            disabled={loading}
            aria-disabled={!isFormValid || loading}
            aria-describedby={requiredError ? requiredErrorId : undefined}
            className={`px-6 py-2 bg-red-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#159A9C]/40 focus:ring-offset-2 ${
              isFormValid && !loading
                ? 'hover:bg-red-700'
                : 'opacity-60 cursor-not-allowed hover:bg-red-600'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Confirmar perda
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalMotivoPerda;
