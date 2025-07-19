import React from 'react';
import { AccessibleButton } from '../common/AccessibleButton';
import { CalendarIcon, PlusIcon, BellIcon } from '../icons/DashboardIcons';

interface QuickActionsProps {
  onScheduleClick?: () => void;
  onNewProposalClick?: () => void;
  onNotificationsClick?: () => void;
}

export const QuickActionsWidget: React.FC<QuickActionsProps> = ({
  onScheduleClick,
  onNewProposalClick,
  onNotificationsClick
}) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border p-6"
      role="region"
      aria-label="Ações rápidas do dashboard"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Ações Rápidas
      </h3>

      <div className="space-y-4">
        {/* Agendar Reunião */}
        <AccessibleButton
          variant="outline"
          fullWidth
          leftIcon={<CalendarIcon size={20} />}
          onClick={onScheduleClick}
          aria-label="Agendar nova reunião ou compromisso"
          className="justify-start hover:bg-blue-50 hover:border-blue-300"
        >
          <div className="flex-1 text-left ml-3">
            <div className="font-medium text-gray-900">Agendar</div>
            <div className="text-sm text-gray-500">Nova reunião</div>
          </div>
        </AccessibleButton>

        {/* Nova Proposta */}
        <AccessibleButton
          variant="primary"
          fullWidth
          leftIcon={<PlusIcon size={20} />}
          onClick={onNewProposalClick}
          aria-label="Criar nova proposta comercial"
          className="justify-start"
        >
          <div className="flex-1 text-left ml-3">
            <div className="font-medium">Nova Proposta</div>
            <div className="text-sm opacity-90">Criar proposta</div>
          </div>
        </AccessibleButton>

        {/* Notificações */}
        <AccessibleButton
          variant="ghost"
          fullWidth
          leftIcon={<BellIcon size={20} />}
          onClick={onNotificationsClick}
          aria-label="Ver todas as notificações"
          className="justify-start hover:bg-gray-50"
        >
          <div className="flex-1 text-left ml-3">
            <div className="font-medium text-gray-900">Notificações</div>
            <div className="text-sm text-gray-500">3 não lidas</div>
          </div>
          <div 
            className="w-2 h-2 bg-red-500 rounded-full"
            aria-label="3 notificações não lidas"
          ></div>
        </AccessibleButton>
      </div>

      {/* Resumo de Atividades */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Próximas Atividades
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Reunião com João Silva
              </p>
              <p className="text-xs text-gray-500">
                Hoje, 14:30
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Follow-up Proposta #1234
              </p>
              <p className="text-xs text-gray-500">
                Amanhã, 09:00
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Vencimento Contrato ABC
              </p>
              <p className="text-xs text-gray-500">
                Em 3 dias
              </p>
            </div>
          </div>
        </div>
        
        <AccessibleButton
          variant="ghost"
          size="sm"
          fullWidth
          className="mt-4"
          aria-label="Ver todas as atividades programadas"
        >
          Ver todas as atividades
        </AccessibleButton>
      </div>
    </div>
  );
};
