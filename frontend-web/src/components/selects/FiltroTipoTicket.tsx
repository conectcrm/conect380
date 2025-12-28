import React from 'react';
import { TipoTicket, tipoTicketLabels } from '../../services/ticketsService';

interface FiltroTipoTicketProps {
  value: TipoTicket | 'todos';
  onChange: (tipo: TipoTicket | 'todos') => void;
  className?: string;
  label?: string;
  showAllOption?: boolean;
}

/**
 * Componente de filtro por tipo de ticket
 * Sprint 2: Unificação Tickets + Demandas
 * 
 * @example
 * ```tsx
 * <FiltroTipoTicket
 *   value={filtroTipo}
 *   onChange={setFiltroTipo}
 *   label="Tipo de Ticket"
 * />
 * ```
 */
export const FiltroTipoTicket: React.FC<FiltroTipoTicketProps> = ({
  value,
  onChange,
  className = '',
  label = 'Tipo',
  showAllOption = true,
}) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[#002333] mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TipoTicket | 'todos')}
        className="w-full px-4 py-2 border border-[#B4BEC9] rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-transparent bg-white text-[#002333] transition-colors"
      >
        {showAllOption && (
          <option value="todos">Todos os tipos</option>
        )}
        {(Object.keys(tipoTicketLabels) as TipoTicket[]).map((tipo) => (
          <option key={tipo} value={tipo}>
            {tipoTicketLabels[tipo]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FiltroTipoTicket;
