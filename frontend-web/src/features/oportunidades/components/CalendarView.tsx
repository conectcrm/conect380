import React from 'react';
import { Oportunidade } from '../../../types/oportunidades/index';
import { Calendar, Clock, RefreshCw } from 'lucide-react';

interface CalendarViewProps {
  oportunidades: Oportunidade[];
  onVisualizarOportunidade: (oportunidade: Oportunidade) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  oportunidades,
  onVisualizarOportunidade,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Visualização de Calendário</h3>
      <p className="text-gray-600 mb-4">Esta funcionalidade estará disponível em breve</p>
      <div className="text-sm text-gray-500">{oportunidades.length} oportunidades carregadas</div>
    </div>
  );
};
