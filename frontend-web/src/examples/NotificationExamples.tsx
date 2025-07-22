// 🔔 Exemplos de Uso do Sistema de Notificações
// Este arquivo demonstra como integrar o sistema de notificações em outras partes do FenixCRM

import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

// Exemplo 1: Integração com Propostas
const PropostaExample = () => {
  const { addNotification, addReminder } = useNotifications();

  const handleCreateProposta = async (proposta: any) => {
    try {
      // Simular criação da proposta
      await createProposta(proposta);
      
      // Notificação de sucesso
      addNotification({
        title: 'Proposta Criada',
        message: `Proposta para ${proposta.clienteNome} foi criada com sucesso`,
        type: 'success',
        priority: 'high'
      });

      // Criar lembrete para follow-up
      addReminder({
        title: 'Follow-up da Proposta',
        entityType: 'proposta',
        entityId: proposta.id,
        dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        isRecurring: false
      });

    } catch (error) {
      addNotification({
        title: 'Erro na Proposta',
        message: 'Falha ao criar proposta. Tente novamente.',
        type: 'error',
        priority: 'high'
      });
    }
  };

  return null; // Componente de exemplo
};

// Exemplo 2: Integração com Clientes
const ClienteExample = () => {
  const { addNotification, addReminder } = useNotifications();

  const handleClienteInteraction = (clienteId: string, clienteNome: string) => {
    // Notificação de interação
    addNotification({
      title: 'Interação Registrada',
      message: `Nova interação com ${clienteNome}`,
      type: 'info',
      priority: 'medium'
    });

    // Lembrete para próximo contato
    addReminder({
      title: 'Próximo Contato',
      entityType: 'client',
      entityId: clienteId,
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 dias
      isRecurring: true
    });
  };

  return null;
};

// Exemplo 3: Notificações de Sistema
const SystemExample = () => {
  const { addNotification } = useNotifications();

  // Notificação de manutenção
  const scheduleMaintenanceNotification = () => {
    addNotification({
      title: 'Manutenção Programada',
      message: 'Sistema será atualizado às 23:00 hoje',
      type: 'warning',
      priority: 'high'
    });
  };

  // Notificação de novo recurso
  const announceNewFeature = () => {
    addNotification({
      title: 'Novo Recurso!',
      message: 'Sistema de notificações está disponível',
      type: 'success',
      priority: 'medium'
    });
  };

  return null;
};

// Exemplo 4: Notificações Automáticas
const AutomaticNotifications = () => {
  const { addNotification, addReminder } = useNotifications();

  // Verificar propostas vencendo
  const checkExpiringPropostas = () => {
    const expiringPropostas = getExpiringPropostas(); // Função hipotética
    
    expiringPropostas.forEach(proposta => {
      addNotification({
        title: 'Proposta Vencendo',
        message: `Proposta ${proposta.numero} vence em 2 dias`,
        type: 'warning',
        priority: 'high'
      });
    });
  };

  // Lembrete de aniversário de cliente
  const checkClientBirthdays = () => {
    const birthdayClients = getTodayBirthdays(); // Função hipotética
    
    birthdayClients.forEach(client => {
      addNotification({
        title: 'Aniversário do Cliente',
        message: `Hoje é aniversário de ${client.nome}!`,
        type: 'info',
        priority: 'medium'
      });
    });
  };

  return null;
};

// Exemplo 5: Hook Personalizado para Notificações de Vendas
export const useSalesNotifications = () => {
  const { addNotification, addReminder } = useNotifications();

  const notifyNewLead = (leadData: any) => {
    addNotification({
      title: 'Novo Lead',
      message: `${leadData.nome} demonstrou interesse`,
      type: 'success',
      priority: 'high'
    });

    // Lembrete para contato inicial
    addReminder({
      title: 'Contato Inicial',
      entityType: 'client',
      entityId: leadData.id,
      dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas
      isRecurring: false
    });
  };

  const notifyDealClosed = (dealData: any) => {
    addNotification({
      title: 'Venda Fechada! 🎉',
      message: `Parabéns! Venda de R$ ${dealData.valor} foi concluída`,
      type: 'success',
      priority: 'high'
    });
  };

  const notifyFollowUp = (clientData: any) => {
    addNotification({
      title: 'Follow-up Necessário',
      message: `Cliente ${clientData.nome} precisa de acompanhamento`,
      type: 'warning',
      priority: 'medium'
    });
  };

  return {
    notifyNewLead,
    notifyDealClosed,
    notifyFollowUp
  };
};

// Exemplo 6: Integração com Agenda
export const useAgendaNotifications = () => {
  const { addNotification, addReminder } = useNotifications();

  const scheduleAppointment = (appointment: any) => {
    addNotification({
      title: 'Reunião Agendada',
      message: `Reunião com ${appointment.clienteNome} agendada`,
      type: 'success',
      priority: 'medium'
    });

    // Lembrete 1 hora antes
    const reminderTime = new Date(appointment.dateTime.getTime() - 60 * 60 * 1000);
    addReminder({
      title: 'Reunião em 1 hora',
      entityType: 'reunião',
      entityId: appointment.id,
      dateTime: reminderTime,
      isRecurring: false
    });
  };

  const cancelAppointment = (appointment: any) => {
    addNotification({
      title: 'Reunião Cancelada',
      message: `Reunião com ${appointment.clienteNome} foi cancelada`,
      type: 'warning',
      priority: 'medium'
    });
  };

  return {
    scheduleAppointment,
    cancelAppointment
  };
};

// Funções auxiliares (simuladas)
const createProposta = async (proposta: any) => {
  // Simular API call
  return new Promise(resolve => setTimeout(resolve, 1000));
};

const getExpiringPropostas = () => {
  // Simular busca de propostas vencendo
  return [];
};

const getTodayBirthdays = () => {
  // Simular busca de aniversariantes
  return [];
};

export {
  PropostaExample,
  ClienteExample,
  SystemExample,
  AutomaticNotifications
};
