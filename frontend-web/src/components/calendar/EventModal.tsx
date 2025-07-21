import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { CalendarEvent } from '../../types/calendar';
import { useResponsive, useBodyOverflow } from '../../hooks/useResponsive';
import {
  ResponsiveModal,
  AdaptiveColumns,
  ResponsiveCard
} from '../layout/ResponsiveLayout';
import {
  FormField,
  BaseInput,
  BaseSelect,
  BaseTextarea,
  BaseButton,
  StatusPanel,
  StatusBadge
} from '../base';
import { 
  Save, 
  X, 
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertTriangle,
  Copy,
  Trash2,
  Plus,
  UserPlus,
  Mail,
  Phone
} from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'organizer' | 'attendee' | 'optional';
}

interface EventFormData {
  title: string;
  description?: string;
  start: string; // YYYY-MM-DDTHH:mm format
  end: string;
  type: CalendarEvent['type'];
  priority: CalendarEvent['priority'];
  status: CalendarEvent['status'];
  location?: string;
  collaborator: string;
  participants: Participant[];
  allDay: boolean;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CalendarEvent, 'id'>) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  onDuplicate?: (eventId: string) => void;
  event?: CalendarEvent | null;
  initialDate?: Date;
  isLoading?: boolean;
}

// Schema de validação
const schema = yup.object({
  title: yup
    .string()
    .required('Título é obrigatório')
    .min(3, 'Título deve ter pelo menos 3 caracteres'),
    
  start: yup
    .string()
    .required('Data/hora de início é obrigatória'),
    
  end: yup
    .string()
    .required('Data/hora de fim é obrigatória')
    .test('after-start', 'Fim deve ser após o início', function(value) {
      const { start } = this.parent;
      if (!start || !value) return true;
      return new Date(value) > new Date(start);
    }),
    
  type: yup
    .string()
    .required('Tipo é obrigatório'),
    
  priority: yup
    .string()
    .required('Prioridade é obrigatória'),
    
  status: yup
    .string()
    .required('Status é obrigatório'),
    
  description: yup
    .string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres'),
    
  location: yup
    .string()
    .max(200, 'Localização deve ter no máximo 200 caracteres'),
    
  collaborator: yup
    .string()
    .required('Colaborador responsável é obrigatório'),
    
  participants: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required('Nome é obrigatório'),
        email: yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
        phone: yup.string().optional(),
        role: yup.string().oneOf(['organizer', 'attendee', 'optional']).required()
      })
    )
    .min(0, 'Pelo menos um participante deve ser adicionado')
});

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  event,
  initialDate,
  isLoading = false
}) => {
  const { isMobile, isTablet } = useResponsive();
  const { lockScroll, unlockScroll } = useBodyOverflow();
  
  // Estado para gerenciar participantes
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipant, setNewParticipant] = useState<Partial<Participant>>({
    name: '',
    email: '',
    phone: '',
    role: 'attendee'
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue
  } = useForm<EventFormData>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      start: '',
      end: '',
      type: 'meeting',
      priority: 'medium',
      status: 'confirmed',
      location: '',
      collaborator: '',
      participants: [],
      allDay: false
    }
  });

  // Gerenciar scroll do body
  useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [isOpen, lockScroll, unlockScroll]);

  // Opções para selects
  const typeOptions = [
    { value: 'meeting', label: '🤝 Reunião' },
    { value: 'call', label: '📞 Ligação' },
    { value: 'task', label: '✅ Tarefa' },
    { value: 'event', label: '📅 Evento' },
    { value: 'follow-up', label: '📧 Follow-up' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' }
  ];

  const statusOptions = [
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'pending', label: 'Pendente' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  // Opções de colaboradores (dados mock - em produção viriam da API)
  const collaboratorOptions = [
    { value: 'João Silva', label: 'João Silva' },
    { value: 'Maria Santos', label: 'Maria Santos' },
    { value: 'Pedro Costa', label: 'Pedro Costa' },
    { value: 'Ana Oliveira', label: 'Ana Oliveira' },
    { value: 'Carlos Ferreira', label: 'Carlos Ferreira' },
    { value: 'Lucia Mendes', label: 'Lucia Mendes' }
  ];

  // Funções para gerenciar participantes
  const addParticipant = () => {
    if (newParticipant.name && newParticipant.email) {
      const participant: Participant = {
        id: Date.now().toString(),
        name: newParticipant.name!,
        email: newParticipant.email!,
        phone: newParticipant.phone || '',
        role: newParticipant.role as 'organizer' | 'attendee' | 'optional' || 'attendee'
      };
      
      setParticipants(prev => [...prev, participant]);
      setValue('participants', [...participants, participant]);
      
      // Limpar formulário de novo participante
      setNewParticipant({
        name: '',
        email: '',
        phone: '',
        role: 'attendee'
      });
    }
  };

  const removeParticipant = (id: string) => {
    const updatedParticipants = participants.filter(p => p.id !== id);
    setParticipants(updatedParticipants);
    setValue('participants', updatedParticipants);
  };

  const updateParticipantRole = (id: string, role: Participant['role']) => {
    const updatedParticipants = participants.map(p => 
      p.id === id ? { ...p, role } : p
    );
    setParticipants(updatedParticipants);
    setValue('participants', updatedParticipants);
  };

  // Preencher formulário com dados do evento ou data inicial
  useEffect(() => {
    if (isOpen) {
      if (event) {
        const startStr = event.start.toISOString().slice(0, 16);
        const endStr = event.end.toISOString().slice(0, 16);
        
        // Converter attendees antigo para participantes
        const eventParticipants: Participant[] = event.attendees?.map((email, index) => ({
          id: `${index}`,
          name: email.split('@')[0], // Nome básico do email
          email: email,
          role: 'attendee' as const
        })) || [];
        
        setParticipants(eventParticipants);
        
        reset({
          title: event.title,
          description: event.description || '',
          start: startStr,
          end: endStr,
          type: event.type,
          priority: event.priority,
          status: event.status,
          location: event.location || '',
          collaborator: event.collaborator || '',
          participants: eventParticipants,
          allDay: event.allDay || false
        });
      } else if (initialDate) {
        const start = new Date(initialDate);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hora
        
        setParticipants([]);
        
        reset({
          title: '',
          description: '',
          start: start.toISOString().slice(0, 16),
          end: end.toISOString().slice(0, 16),
          type: 'meeting',
          priority: 'medium',
          status: 'confirmed',
          location: '',
          collaborator: '',
          participants: [],
          allDay: false
        });
      }
    }
  }, [event, initialDate, reset, isOpen]);

  // Watch para allDay
  const allDay = watch('allDay');
  
  useEffect(() => {
    if (allDay) {
      const startDate = watch('start');
      if (startDate) {
        const date = startDate.split('T')[0];
        setValue('start', `${date}T00:00`);
        setValue('end', `${date}T23:59`);
      }
    }
  }, [allDay, setValue, watch]);

  const onSubmit = async (data: EventFormData) => {
    const toastId = toast.loading(
      event ? 'Atualizando evento...' : 'Criando evento...'
    );

    try {
      const eventData: Omit<CalendarEvent, 'id'> = {
        title: data.title,
        description: data.description,
        start: new Date(data.start),
        end: new Date(data.end),
        type: data.type,
        priority: data.priority,
        status: data.status,
        location: data.location,
        collaborator: data.collaborator,
        attendees: participants.map(p => p.email), // Converter participantes para emails
        allDay: data.allDay
      };

      await onSave(eventData);
      
      toast.success(
        event ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!',
        { id: toastId }
      );
      
      setTimeout(() => {
        handleClose();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error(
        event ? 'Erro ao atualizar evento' : 'Erro ao criar evento',
        { id: toastId }
      );
    }
  };

  const handleClose = () => {
    reset();
    setParticipants([]);
    setNewParticipant({
      name: '',
      email: '',
      phone: '',
      role: 'attendee'
    });
    onClose();
  };

  const handleDelete = async () => {
    if (!event || !onDelete) return;
    
    // eslint-disable-next-line no-restricted-globals
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      const toastId = toast.loading('Excluindo evento...');
      
      try {
        await onDelete(event.id);
        toast.success('Evento excluído com sucesso!', { id: toastId });
        handleClose();
      } catch (error) {
        toast.error('Erro ao excluir evento', { id: toastId });
      }
    }
  };

  const handleDuplicate = () => {
    if (event && onDuplicate) {
      onDuplicate(event.id);
      handleClose();
    }
  };

  const currentType = watch('type');
  const currentPriority = watch('priority');
  const currentStatus = watch('status');

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title={event ? 'Editar Evento' : 'Novo Evento'}
      subtitle="Preencha as informações do evento"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AdaptiveColumns minWidth={isMobile ? 280 : isTablet ? 320 : 350}>
            {/* Coluna 1: Informações Básicas */}
            <ResponsiveCard className="h-fit">
              <h3 className="font-semibold text-gray-900 mb-4 text-responsive border-b pb-2">
                📋 Informações Básicas
              </h3>
              <div className="space-y-4">
                <FormField
                  label="Título do Evento"
                  error={errors.title?.message}
                  required
                >
                  <BaseInput
                    {...register('title')}
                    placeholder="Ex: Reunião com cliente"
                    error={!!errors.title}
                    className="w-full"
                  />
                </FormField>

                <FormField
                  label="Tipo de Evento"
                  error={errors.type?.message}
                  required
                >
                  <BaseSelect
                    {...register('type')}
                    error={!!errors.type}
                    options={typeOptions}
                    className="w-full"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    label="Prioridade"
                    error={errors.priority?.message}
                    required
                  >
                    <BaseSelect
                      {...register('priority')}
                      error={!!errors.priority}
                      options={priorityOptions}
                      className="w-full"
                    />
                  </FormField>

                  <FormField
                    label="Status"
                    error={errors.status?.message}
                    required
                  >
                    <BaseSelect
                      {...register('status')}
                      error={!!errors.status}
                      options={statusOptions}
                      className="w-full"
                    />
                  </FormField>

                  <FormField
                    label="Colaborador Responsável"
                    error={errors.collaborator?.message}
                    required
                  >
                    <BaseSelect
                      {...register('collaborator')}
                      error={!!errors.collaborator}
                      options={collaboratorOptions}
                      placeholder="Selecione o colaborador..."
                      className="w-full"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Evento de dia inteiro"
                >
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('allDay')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Dia inteiro</span>
                  </label>
                </FormField>
              </div>
            </ResponsiveCard>

            {/* Coluna 2: Data e Hora */}
            <ResponsiveCard className="h-fit">
              <h3 className="font-semibold text-gray-900 mb-4 text-responsive border-b pb-2">
                🕒 Data e Hora
              </h3>
              <div className="space-y-4">
                <FormField
                  label="Início"
                  error={errors.start?.message}
                  required
                >
                  <BaseInput
                    {...register('start')}
                    type="datetime-local"
                    error={!!errors.start}
                    className="w-full"
                  />
                </FormField>

                <FormField
                  label="Fim"
                  error={errors.end?.message}
                  required
                >
                  <BaseInput
                    {...register('end')}
                    type="datetime-local"
                    error={!!errors.end}
                    className="w-full"
                  />
                </FormField>

                <FormField
                  label="Localização"
                  error={errors.location?.message}
                >
                  <BaseInput
                    {...register('location')}
                    placeholder="Ex: Sala de reuniões, Online - Teams"
                    error={!!errors.location}
                    className="w-full"
                  />
                </FormField>

                <FormField
                  label="Evento de dia inteiro"
                >
                  <div className="flex items-center">
                    <input
                      {...register('allDay')}
                      type="checkbox"
                      className="rounded border-gray-300 text-[#159A9C] focus:ring-[#159A9C]"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Este evento dura o dia todo
                    </span>
                  </div>
                </FormField>
              </div>
            </ResponsiveCard>

            {/* Coluna 3: Participantes */}
            <ResponsiveCard className="h-fit">
              <h3 className="font-semibold text-gray-900 mb-4 text-responsive border-b pb-2">
                👥 Participantes
              </h3>
              
              {/* Lista de participantes existentes */}
              {participants.length > 0 && (
                <div className="space-y-2 mb-4">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-[#159A9C] text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {participant.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{participant.name}</p>
                            <p className="text-xs text-gray-600">{participant.email}</p>
                            {participant.phone && (
                              <p className="text-xs text-gray-500">{participant.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={participant.role}
                          onChange={(e) => updateParticipantRole(participant.id, e.target.value as Participant['role'])}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-900"
                        >
                          <option value="organizer">Organizador</option>
                          <option value="attendee">Participante</option>
                          <option value="optional">Opcional</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant.id)}
                          className="text-red-500 hover:text-red-700 p-1 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulário para adicionar novo participante */}
              <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900 text-sm flex items-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Participante
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={newParticipant.name || ''}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-sm bg-white text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <Mail className="w-3 h-3 inline mr-1" />
                      E-mail *
                    </label>
                    <input
                      type="email"
                      value={newParticipant.email || ''}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-sm bg-white text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <Phone className="w-3 h-3 inline mr-1" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={newParticipant.phone || ''}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-sm bg-white text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Função
                    </label>
                    <select
                      value={newParticipant.role || 'attendee'}
                      onChange={(e) => setNewParticipant(prev => ({ ...prev, role: e.target.value as Participant['role'] }))}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-sm bg-white text-gray-900"
                    >
                      <option value="attendee">Participante</option>
                      <option value="organizer">Organizador</option>
                      <option value="optional">Opcional</option>
                    </select>
                  </div>
                  
                  <button
                    type="button"
                    onClick={addParticipant}
                    disabled={!newParticipant.name || !newParticipant.email}
                    className="w-full bg-[#159A9C] text-white px-3 py-2 rounded-lg hover:bg-[#138A8C] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
              </div>
            </ResponsiveCard>

            {/* Coluna 4: Detalhes e Status */}
            <ResponsiveCard className="h-fit">
              <h3 className="font-semibold text-gray-900 mb-4 text-responsive border-b pb-2">
                📝 Detalhes
              </h3>
              <div className="space-y-4">
                <FormField
                  label="Colaborador Responsável"
                  error={errors.collaborator?.message}
                  required
                >
                  <BaseSelect
                    {...register('collaborator')}
                    error={!!errors.collaborator}
                    options={collaboratorOptions}
                    placeholder="Selecione o responsável..."
                    className="w-full"
                  />
                </FormField>

                <FormField
                  label="Descrição"
                  error={errors.description?.message}
                >
                  <BaseTextarea
                    {...register('description')}
                    rows={isMobile ? 4 : 6}
                    placeholder="Detalhes sobre o evento..."
                    error={!!errors.description}
                    className="w-full resize-none"
                  />
                </FormField>

                {/* Status Panel */}
                <StatusPanel title="Resumo do Evento">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Tipo e Status
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        <StatusBadge
                          status={currentStatus === 'confirmed' ? 'success' : currentStatus === 'pending' ? 'warning' : 'error'}
                          text={statusOptions.find(s => s.value === currentStatus)?.label}
                        />
                        <span className="text-sm text-gray-600">
                          {typeOptions.find(t => t.value === currentType)?.label}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Participantes
                      </label>
                      <div className="mt-1">
                        <span className="text-sm text-gray-700">
                          {participants.length === 0 ? 'Nenhum participante' : 
                           participants.length === 1 ? '1 participante' : 
                           `${participants.length} participantes`}
                        </span>
                        {participants.length > 0 && (
                          <div className="mt-1 flex -space-x-1">
                            {participants.slice(0, 3).map((participant) => (
                              <div
                                key={participant.id}
                                className="w-6 h-6 bg-[#159A9C] text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white"
                                title={participant.name}
                              >
                                {participant.name.charAt(0).toUpperCase()}
                              </div>
                            ))}
                            {participants.length > 3 && (
                              <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs font-medium border-2 border-white">
                                +{participants.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {currentPriority === 'high' && (
                      <div className="flex items-center text-sm text-red-600">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <span>Alta prioridade</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="break-words">
                        {event ? 'Editando evento existente' : 'Criando novo evento'}
                      </span>
                    </div>
                  </div>
                </StatusPanel>
              </div>
            </ResponsiveCard>
          </AdaptiveColumns>
        </div>

        {/* Footer com ações */}
        <div className="flex-shrink-0 border-t border-gray-200 mt-6 pt-4">
          <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'justify-between'}`}>
            {/* Ações do evento existente */}
            {event && (
              <div className={`flex gap-2 ${isMobile ? 'order-2' : ''}`}>
                {onDuplicate && (
                  <BaseButton
                    type="button"
                    variant="secondary"
                    onClick={handleDuplicate}
                    icon={<Copy className="w-4 h-4" />}
                    className={isMobile ? 'flex-1 justify-center' : ''}
                  >
                    Duplicar
                  </BaseButton>
                )}
                
                {onDelete && (
                  <BaseButton
                    type="button"
                    variant="danger"
                    onClick={handleDelete}
                    icon={<Trash2 className="w-4 h-4" />}
                    className={isMobile ? 'flex-1 justify-center' : ''}
                  >
                    Excluir
                  </BaseButton>
                )}
              </div>
            )}

            {/* Ações principais */}
            <div className={`flex gap-3 ${isMobile ? 'order-1' : 'ml-auto'}`}>
              <BaseButton
                type="button"
                variant="secondary"
                onClick={handleClose}
                icon={<X className="w-4 h-4" />}
                className={isMobile ? 'flex-1 justify-center' : ''}
              >
                Cancelar
              </BaseButton>
              
              <BaseButton
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={!isValid}
                icon={<Save className="w-4 h-4" />}
                className={isMobile ? 'flex-1 justify-center' : ''}
              >
                {event ? 'Atualizar' : 'Criar'} Evento
              </BaseButton>
            </div>
          </div>
        </div>
      </form>
    </ResponsiveModal>
  );
};
