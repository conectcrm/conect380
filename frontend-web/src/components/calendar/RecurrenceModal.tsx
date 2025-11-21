import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  RotateCcw,
  Settings,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';

interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // A cada X dias/semanas/meses
  daysOfWeek?: number[]; // Para eventos semanais (0 = domingo, 1 = segunda, etc.)
  dayOfMonth?: number; // Para eventos mensais
  endType: 'never' | 'date' | 'occurrences';
  endDate?: string;
  occurrences?: number;
}

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pattern: RecurrencePattern) => void;
  startDate: string;
  eventTitle: string;
}

export const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  startDate,
  eventTitle
}) => {
  const [pattern, setPattern] = useState<RecurrencePattern>({
    type: 'weekly',
    interval: 1,
    daysOfWeek: [],
    endType: 'occurrences',
    occurrences: 10
  });

  const [preview, setPreview] = useState<Date[]>([]);

  // Nomes dos dias da semana
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Calcular preview das próximas ocorrências
  React.useEffect(() => {
    if (!startDate) return;

    const start = new Date(startDate);
    const occurrences: Date[] = [start];
    let current = new Date(start);
    const maxPreview = 10;

    // Gerar próximas ocorrências
    for (let i = 1; i < maxPreview; i++) {
      let next = new Date(current);

      switch (pattern.type) {
        case 'daily':
          next.setDate(current.getDate() + pattern.interval);
          break;

        case 'weekly':
          if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
            // Para eventos semanais com dias específicos
            const currentDayOfWeek = current.getDay();
            const nextDays = pattern.daysOfWeek
              .filter(day => day > currentDayOfWeek)
              .sort();

            if (nextDays.length > 0) {
              const nextDay = nextDays[0];
              next.setDate(current.getDate() + (nextDay - currentDayOfWeek));
            } else {
              // Próxima semana, primeiro dia selecionado
              const firstDay = Math.min(...pattern.daysOfWeek);
              next.setDate(current.getDate() + (7 - currentDayOfWeek + firstDay));
            }
          } else {
            next.setDate(current.getDate() + (7 * pattern.interval));
          }
          break;

        case 'monthly':
          if (pattern.dayOfMonth) {
            next.setMonth(current.getMonth() + pattern.interval);
            next.setDate(pattern.dayOfMonth);
          } else {
            next.setMonth(current.getMonth() + pattern.interval);
          }
          break;

        case 'yearly':
          next.setFullYear(current.getFullYear() + pattern.interval);
          break;
      }

      // Verificar limites
      if (pattern.endType === 'date' && pattern.endDate) {
        const endDate = new Date(pattern.endDate);
        if (next > endDate) break;
      }

      if (pattern.endType === 'occurrences' && pattern.occurrences) {
        if (i >= pattern.occurrences) break;
      }

      occurrences.push(next);
      current = next;
    }

    setPreview(occurrences);
  }, [pattern, startDate]);

  const handleSave = () => {
    // Validações
    if (pattern.type === 'weekly' && pattern.daysOfWeek && pattern.daysOfWeek.length === 0) {
      alert('Selecione pelo menos um dia da semana');
      return;
    }

    if (pattern.endType === 'occurrences' && (!pattern.occurrences || pattern.occurrences < 2)) {
      alert('Número mínimo de ocorrências é 2');
      return;
    }

    if (pattern.endType === 'date' && (!pattern.endDate || new Date(pattern.endDate) <= new Date(startDate))) {
      alert('Data final deve ser posterior à data inicial');
      return;
    }

    onSave(pattern);
  };

  const toggleDayOfWeek = (day: number) => {
    const current = pattern.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();

    setPattern(prev => ({ ...prev, daysOfWeek: updated }));
  };

  const getRecurrenceDescription = (): string => {
    const { type, interval, daysOfWeek, endType, endDate, occurrences } = pattern;

    let base = '';
    switch (type) {
      case 'daily':
        base = interval === 1 ? 'Todos os dias' : `A cada ${interval} dias`;
        break;
      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayLabels = daysOfWeek.map(d => dayNames[d]).join(', ');
          base = interval === 1
            ? `Toda semana: ${dayLabels}`
            : `A cada ${interval} semanas: ${dayLabels}`;
        } else {
          base = interval === 1 ? 'Toda semana' : `A cada ${interval} semanas`;
        }
        break;
      case 'monthly':
        base = interval === 1 ? 'Todo mês' : `A cada ${interval} meses`;
        break;
      case 'yearly':
        base = interval === 1 ? 'Todo ano' : `A cada ${interval} anos`;
        break;
    }

    let end = '';
    switch (endType) {
      case 'never':
        end = 'para sempre';
        break;
      case 'date':
        end = `até ${new Date(endDate!).toLocaleDateString('pt-BR')}`;
        break;
      case 'occurrences':
        end = `por ${occurrences} vezes`;
        break;
    }

    return `${base}, ${end}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[600px] md:w-[700px] lg:w-[900px] xl:w-[1000px] max-w-[1100px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configurar Recorrência
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {eventTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configurações */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Configurações</h3>

            {/* Tipo de recorrência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Repetir
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'daily', label: 'Diariamente' },
                  { value: 'weekly', label: 'Semanalmente' },
                  { value: 'monthly', label: 'Mensalmente' },
                  { value: 'yearly', label: 'Anualmente' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPattern(prev => ({ ...prev, type: option.value as any }))}
                    className={`p-3 text-sm font-medium rounded-lg border transition-colors ${pattern.type === option.value
                      ? 'bg-[#159A9C] text-white border-[#159A9C]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Intervalo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervalo
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">A cada</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={pattern.interval}
                  onChange={(e) => setPattern(prev => ({
                    ...prev,
                    interval: parseInt(e.target.value) || 1
                  }))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C]"
                />
                <span className="text-sm text-gray-600">
                  {pattern.type === 'daily' && (pattern.interval === 1 ? 'dia' : 'dias')}
                  {pattern.type === 'weekly' && (pattern.interval === 1 ? 'semana' : 'semanas')}
                  {pattern.type === 'monthly' && (pattern.interval === 1 ? 'mês' : 'meses')}
                  {pattern.type === 'yearly' && (pattern.interval === 1 ? 'ano' : 'anos')}
                </span>
              </div>
            </div>

            {/* Dias da semana (apenas para eventos semanais) */}
            {pattern.type === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias da semana
                </label>
                <div className="flex space-x-1">
                  {dayNames.map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDayOfWeek(index)}
                      className={`w-10 h-10 text-sm font-medium rounded-lg border transition-colors ${pattern.daysOfWeek?.includes(index)
                        ? 'bg-[#159A9C] text-white border-[#159A9C]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fim da recorrência */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Terminar
              </label>
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="endType"
                    checked={pattern.endType === 'never'}
                    onChange={() => setPattern(prev => ({ ...prev, endType: 'never' }))}
                    className="text-[#159A9C] focus:ring-[#159A9C]"
                  />
                  <span className="text-sm text-gray-700">Nunca</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="endType"
                    checked={pattern.endType === 'date'}
                    onChange={() => setPattern(prev => ({ ...prev, endType: 'date' }))}
                    className="text-[#159A9C] focus:ring-[#159A9C]"
                  />
                  <span className="text-sm text-gray-700">Em</span>
                  <input
                    type="date"
                    value={pattern.endDate || ''}
                    onChange={(e) => setPattern(prev => ({ ...prev, endDate: e.target.value }))}
                    disabled={pattern.endType !== 'date'}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-100"
                  />
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="endType"
                    checked={pattern.endType === 'occurrences'}
                    onChange={() => setPattern(prev => ({ ...prev, endType: 'occurrences' }))}
                    className="text-[#159A9C] focus:ring-[#159A9C]"
                  />
                  <span className="text-sm text-gray-700">Após</span>
                  <input
                    type="number"
                    min="2"
                    max="999"
                    value={pattern.occurrences || ''}
                    onChange={(e) => setPattern(prev => ({
                      ...prev,
                      occurrences: parseInt(e.target.value) || 2
                    }))}
                    disabled={pattern.endType !== 'occurrences'}
                    className="w-20 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#159A9C] disabled:bg-gray-100"
                  />
                  <span className="text-sm text-gray-700">ocorrências</span>
                </label>
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <RotateCcw className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    Resumo da Recorrência
                  </h4>
                  <p className="text-sm text-blue-700">
                    {getRecurrenceDescription()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Preview</h3>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h4 className="text-sm font-medium text-gray-900">
                  Próximas {Math.min(preview.length, 10)} ocorrências
                </h4>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {preview.slice(0, 10).map((date, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-md ${index === 0 ? 'bg-[#159A9C] text-white' : 'bg-white'
                      }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${index === 0 ? 'bg-white text-[#159A9C]' : 'bg-gray-100 text-gray-600'
                        }`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">
                        {date.toLocaleDateString('pt-BR', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {index === 0 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${index === 0 ? 'bg-white text-[#159A9C]' : 'bg-gray-200 text-gray-600'
                        }`}>
                        Original
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {preview.length > 10 && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  ... e mais {preview.length - 10} ocorrências
                </p>
              )}
            </div>

            {/* Avisos */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-900 mb-1">
                    Importante
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Todas as ocorrências terão as mesmas configurações</li>
                    <li>• Alterações na série afetarão todos os eventos futuros</li>
                    <li>• Você pode editar eventos individuais posteriormente</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-[#159A9C] text-white rounded-md hover:bg-[#138A8C] transition-colors flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Recorrência</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurrenceModal;
