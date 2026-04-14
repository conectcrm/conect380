import React, { useEffect, useMemo, useState } from 'react';
import { X, Settings, Check, AlertCircle } from 'lucide-react';

interface CardConfig {
  id: string;
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  description: string;
  isActive: boolean;
}

interface ModalConfigurarCardsProps {
  isOpen: boolean;
  onClose: () => void;
  cardsDisponiveis: CardConfig[];
  onSave: (cardsSelecionados: string[]) => void;
}

export default function ModalConfigurarCards({
  isOpen,
  onClose,
  cardsDisponiveis,
  onSave,
}: ModalConfigurarCardsProps) {
  const [cardsSelecionados, setCardsSelecionados] = useState<string[]>([]);
  const [erro, setErro] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const cardsAtivos = cardsDisponiveis.filter((card) => card.isActive).map((card) => card.id);
    setCardsSelecionados(cardsAtivos);
    setErro('');
  }, [isOpen, cardsDisponiveis]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const toggleCard = (cardId: string) => {
    setCardsSelecionados((prev) => {
      const isSelected = prev.includes(cardId);

      if (isSelected) {
        return prev.filter((id) => id !== cardId);
      }

      if (prev.length >= 4) {
        setErro('Você pode selecionar no máximo 4 cards.');
        return prev;
      }

      setErro('');
      return [...prev, cardId];
    });
  };

  const handleSave = () => {
    if (cardsSelecionados.length === 0) {
      setErro('Selecione pelo menos 1 card.');
      return;
    }

    if (cardsSelecionados.length > 4) {
      setErro('Você pode selecionar no máximo 4 cards.');
      return;
    }

    onSave(cardsSelecionados);
    onClose();
  };

  const handleCancel = () => {
    setErro('');
    onClose();
  };

  const cardsSelecionadosDetalhes = useMemo(
    () =>
      cardsSelecionados
        .map((cardId) => cardsDisponiveis.find((card) => card.id === cardId))
        .filter((card): card is CardConfig => Boolean(card)),
    [cardsDisponiveis, cardsSelecionados],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0D1F2A]/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleCancel();
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-[980px] overflow-y-auto rounded-2xl border border-[#DCE8EC] bg-white shadow-[0_30px_60px_-30px_rgba(7,36,51,0.55)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-configurar-cards-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E1EAEE] bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECF7F3]">
              <Settings className="h-4 w-4 text-[#159A9C]" />
            </div>
            <h2 id="modal-configurar-cards-title" className="text-lg font-semibold text-[#173A4D]">
              Configurar cards do dashboard
            </h2>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E7784] transition hover:bg-[#F4F8FA]"
            aria-label="Fechar modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="mb-2 text-sm text-[#5E7784]">
              Selecione de 1 a 4 cards que deseja exibir no dashboard. Os cards selecionados se
              distribuirão automaticamente no espaço disponível.
            </p>
            <div className="flex items-center gap-2 text-sm text-[#5E7784]">
              <span>Cards selecionados:</span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  cardsSelecionados.length >= 1
                    ? 'border-[#CDE6DF] bg-[#ECF7F3] text-[#0F7B7D]'
                    : 'border-[#D4E2E7] bg-[#F6FAFB] text-[#5E7784]'
                }`}
              >
                {cardsSelecionados.length}/4
              </span>
            </div>

            {erro && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#F7D2D9] bg-[#FFF4F6] px-3 py-2 text-sm text-[#B4233A]">
                <AlertCircle className="h-4 w-4" />
                <span>{erro}</span>
              </div>
            )}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {cardsDisponiveis.map((card) => {
              const IconComponent = card.icon;
              const isSelected = cardsSelecionados.includes(card.id);
              const selectionOrder = cardsSelecionados.indexOf(card.id) + 1;

              return (
                <button
                  type="button"
                  key={card.id}
                  className={`relative w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-[#1A9E87] bg-[#ECF7F3] shadow-[0_10px_22px_-20px_rgba(15,57,74,0.4)]'
                      : 'border-[#DCE8EC] bg-white hover:border-[#C7D8DE] hover:bg-[#FAFCFD]'
                  }`}
                  onClick={() => toggleCard(card.id)}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="min-h-5">
                      {isSelected ? (
                        <span className="inline-flex items-center rounded bg-[#159A9C] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                          Selecionado
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#159A9C] text-[10px] font-bold text-white">
                          {selectionOrder}
                        </div>
                      )}
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                          isSelected ? 'border-[#159A9C] bg-[#159A9C]' : 'border-[#C7D8DE]'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="h-3 w-3 text-white" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-[#D4E2E7]" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5E7784]">
                        {card.title}
                      </p>
                      <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
                      <p className="mt-1 text-xs text-[#7D95A3]">{card.description}</p>
                    </div>
                    <div className={`rounded-lg bg-gradient-to-br p-3 ${card.gradient}`}>
                      <IconComponent className={`h-6 w-6 ${card.color}`} />
                    </div>
                  </div>

                  {isSelected && (
                    <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-[#1A9E87]" />
                  )}
                </button>
              );
            })}
          </div>

          {cardsSelecionados.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#173A4D]">
                Preview dos cards selecionados
              </h3>
              <div
                className={`grid gap-4 rounded-xl border border-[#E3EDF1] bg-[#FAFCFD] p-4 ${
                  cardsSelecionados.length === 1
                    ? 'grid-cols-1'
                    : cardsSelecionados.length === 2
                      ? 'grid-cols-1 md:grid-cols-2'
                      : cardsSelecionados.length === 3
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                }`}
              >
                {cardsSelecionadosDetalhes.map((card) => {
                  const IconComponent = card.icon;

                  return (
                    <div key={card.id} className="rounded-xl border border-[#E3EDF1] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#5E7784]">
                            {card.title}
                          </p>
                          <p className={`mt-1 text-lg font-bold ${card.color}`}>
                            {typeof card.value === 'string' && card.value.length > 15
                              ? card.value.substring(0, 15) + '...'
                              : card.value}
                          </p>
                          <p className="mt-1 text-xs text-[#7D95A3]">{card.description}</p>
                        </div>
                        <div className={`rounded-lg bg-gradient-to-br p-2 ${card.gradient}`}>
                          <IconComponent className={`h-4 w-4 ${card.color}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-[#E1EAEE] bg-[#F9FBFC] px-6 py-4">
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-9 items-center rounded-lg border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={cardsSelecionados.length === 0 || cardsSelecionados.length > 4}
            className="inline-flex h-9 items-center rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition hover:bg-[#117C7E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Salvar configuração
          </button>
        </div>
      </div>
    </div>
  );
}
