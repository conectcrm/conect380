import React, { useState, useEffect } from 'react';
import { X, Settings, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

interface CardConfig {
  id: string;
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
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
    if (isOpen) {
      // Inicializar com os cards atualmente ativos
      const cardsAtivos = cardsDisponiveis.filter((card) => card.isActive).map((card) => card.id);
      setCardsSelecionados(cardsAtivos);
      setErro('');
    }
  }, [isOpen, cardsDisponiveis]);

  const toggleCard = (cardId: string) => {
    setCardsSelecionados((prev) => {
      const isSelected = prev.includes(cardId);

      if (isSelected) {
        // Remover o card
        return prev.filter((id) => id !== cardId);
      } else {
        // Adicionar o card (máximo 4)
        if (prev.length >= 4) {
          setErro('Você pode selecionar no máximo 4 cards');
          return prev;
        }
        setErro('');
        return [...prev, cardId];
      }
    });
  };

  const handleSave = () => {
    if (cardsSelecionados.length === 0) {
      setErro('Selecione pelo menos 1 card');
      return;
    }

    if (cardsSelecionados.length > 4) {
      setErro('Você pode selecionar no máximo 4 cards');
      return;
    }

    onSave(cardsSelecionados);
    onClose();
  };

  const handleCancel = () => {
    setErro('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[600px] md:w-[700px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Configurar Cards do Dashboard</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              Selecione de 1 a 4 cards que deseja exibir no dashboard. Os cards selecionados se
              distribuirão automaticamente no espaço disponível.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Cards selecionados:</span>
              <span
                className={`font-semibold ${
                  cardsSelecionados.length > 4
                    ? 'text-red-600'
                    : cardsSelecionados.length >= 1
                      ? 'text-green-600'
                      : 'text-blue-600'
                }`}
              >
                {cardsSelecionados.length}/4
              </span>
            </div>

            {erro && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 text-sm">{erro}</span>
              </div>
            )}
          </div>

          {/* Grid de Cards Disponíveis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {cardsDisponiveis.map((card, index) => {
              const IconComponent = card.icon;
              const isSelected = cardsSelecionados.includes(card.id);
              const selectionOrder = cardsSelecionados.indexOf(card.id) + 1;

              return (
                <div
                  key={card.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => toggleCard(card.id)}
                >
                  {/* Indicador de seleção */}
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    {isSelected && (
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {selectionOrder}
                      </div>
                    )}
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>

                  {/* Preview do Card */}
                  <div className="pr-16">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                          {card.title}
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                      </div>
                      <div className={`p-3 bg-gradient-to-br ${card.gradient} rounded-lg`}>
                        <IconComponent className={`w-6 h-6 ${card.color}`} />
                      </div>
                    </div>
                  </div>

                  {/* Indicador visual de seleção */}
                  {isSelected && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                      <div className="absolute top-0 left-0 bg-blue-500 text-white px-2 py-1 text-xs font-semibold rounded-tl-lg rounded-br-lg">
                        Selecionado
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview dos Cards Selecionados */}
          {cardsSelecionados.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Preview - Como ficará no dashboard:
              </h3>
              <div
                className={`grid gap-4 p-4 bg-gray-50 rounded-lg ${
                  cardsSelecionados.length === 1
                    ? 'grid-cols-1'
                    : cardsSelecionados.length === 2
                      ? 'grid-cols-1 md:grid-cols-2'
                      : cardsSelecionados.length === 3
                        ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                        : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                }`}
              >
                {cardsSelecionados.map((cardId) => {
                  const card = cardsDisponiveis.find((c) => c.id === cardId);
                  if (!card) return null;

                  const IconComponent = card.icon;

                  return (
                    <div
                      key={cardId}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 scale-90 transform"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {card.title}
                          </p>
                          <p className={`text-lg font-bold mt-1 ${card.color}`}>
                            {typeof card.value === 'string' && card.value.length > 15
                              ? card.value.substring(0, 15) + '...'
                              : card.value}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                        </div>
                        <div className={`p-2 bg-gradient-to-br ${card.gradient} rounded-lg`}>
                          <IconComponent className={`w-4 h-4 ${card.color}`} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={cardsSelecionados.length === 0 || cardsSelecionados.length > 4}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
}
