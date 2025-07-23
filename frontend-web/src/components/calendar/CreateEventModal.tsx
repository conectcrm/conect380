import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CalendarEvent } from '../../types/calendar';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  X,
  Clock,
  MapPin,
  Users,
  Bell,
  Mail,
  Plus,
  Trash2,
  Edit,
  UserCheck
} from 'lucide-react';

// Schema de validação
const eventSchema = yup.object({
  title: yup.string().required('Título é obrigatório'),
  isAllDay: yup.boolean(),
  startDate: yup.string().required('Data do evento é obrigatória'),
  startTime: yup.string().when('isAllDay', {
    is: false,
    then: (schema) => schema.required('Horário de início é obrigatório'),
    otherwise: (schema) => schema.notRequired()
  }),
  duration: yup.string().when('isAllDay', {
    is: false,
    then: (schema) => schema.required('Duração é obrigatória'),
    otherwise: (schema) => schema.notRequired()
  }),
  customDurationHours: yup.number().when('duration', {
    is: 'custom',
    then: (schema) => schema.min(0).max(23),
    otherwise: (schema) => schema.notRequired()
  }),
  customDurationMinutes: yup.number().when('duration', {
    is: 'custom',
    then: (schema) => schema.min(0).max(59),
    otherwise: (schema) => schema.notRequired()
  }),
  location: yup.string(),
  description: yup.string(),
  reminderTime: yup.number(),
  reminderType: yup.string(),
  emailOffline: yup.boolean(),
  participants: yup.array().of(yup.string()),
  attachments: yup.array().of(yup.string())
});

type EventFormData = yup.InferType<typeof eventSchema>;

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: any) => void;
  onDelete?: (eventId: string) => void;
  event?: CalendarEvent | null;
  selectedDate?: Date | null;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  selectedDate
}) => {
  const [isConfirmed, setIsConfirmed] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  
  // Hook de notificações
  const { addNotification, addReminder, showSuccess, showError } = useNotifications();

  // Função para calcular horário de término
  const calculateEndTime = (startTime: string, duration: string, customHours?: number, customMinutes?: number) => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    let durationMinutes = 0;

    if (duration === 'custom' && (customHours || customMinutes)) {
      durationMinutes = (customHours || 0) * 60 + (customMinutes || 0);
    } else {
      durationMinutes = parseInt(duration) || 0;
    }

    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };
  const [attachments, setAttachments] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<EventFormData>({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: '',
      isAllDay: false,
      startDate: '',
      startTime: '09:00',
      duration: '60',
      customDurationHours: 0,
      customDurationMinutes: 0,
      location: '',
      description: '',
      reminderTime: 10,
      reminderType: 'notification',
      emailOffline: false,
      participants: [],
      attachments: []
    }
  });

  const isAllDay = watch('isAllDay');

  // Inicializar dados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editando evento existente
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        // Calcular duração em minutos
        const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
        let durationValue = '60';
        let customHours = 0;
        let customMinutes = 0;

        // Verificar se é uma duração padrão
        const standardDurations = [15, 30, 45, 60, 90, 120, 180, 240, 480];
        if (standardDurations.includes(durationMinutes)) {
          durationValue = durationMinutes.toString();
        } else {
          durationValue = 'custom';
          customHours = Math.floor(durationMinutes / 60);
          customMinutes = durationMinutes % 60;
        }
        
        reset({
          title: event.title,
          isAllDay: event.allDay || false,
          startDate: startDate.toISOString().split('T')[0],
          startTime: startDate.toTimeString().slice(0, 5),
          duration: durationValue,
          customDurationHours: customHours,
          customDurationMinutes: customMinutes,
          location: event.location || '',
          description: event.description || '',
          reminderTime: 10,
          reminderType: 'notification',
          emailOffline: false,
          participants: event.attendees || [],
          attachments: []
        });
        
        setIsConfirmed(event.status === 'confirmed');
        setParticipants(event.attendees || []);
      } else {
        // Novo evento
        const defaultDate = selectedDate || new Date();
        const dateStr = defaultDate.toISOString().split('T')[0];
        
        reset({
          title: '',
          isAllDay: false,
          startDate: dateStr,
          startTime: '09:00',
          duration: '60',
          customDurationHours: 0,
          customDurationMinutes: 0,
          location: '',
          description: '',
          reminderTime: 10,
          reminderType: 'notification',
          emailOffline: false,
          participants: [],
          attachments: []
        });
        
        setIsConfirmed(true);
      }
    }
  }, [isOpen, event, selectedDate, reset]);

  const onSubmit = async (data: EventFormData) => {
    try {
      let endDate: Date;
      
      if (data.isAllDay) {
        endDate = new Date(data.startDate);
      } else {
        // Calcular data final baseada na duração
        const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
        let durationMinutes = 0;

        if (data.duration === 'custom') {
          durationMinutes = (data.customDurationHours || 0) * 60 + (data.customDurationMinutes || 0);
        } else {
          durationMinutes = parseInt(data.duration || '60');
        }

        endDate = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
      }

      const eventData = {
        title: data.title,
        allDay: data.isAllDay,
        start: data.isAllDay 
          ? new Date(data.startDate)
          : new Date(`${data.startDate}T${data.startTime}`),
        end: endDate,
        location: data.location || '',
        description: data.description || '',
        status: isConfirmed ? 'confirmed' : 'pending',
        attendees: participants,
        reminderTime: data.reminderTime,
        reminderType: data.reminderType,
        emailOffline: data.emailOffline
      };

      await onSave(eventData);

      // Notificação de sucesso
      const isEditing = !!event;
      showSuccess(
        isEditing ? 'Evento Atualizado' : 'Evento Criado',
        isEditing 
          ? `Evento "${data.title}" foi atualizado com sucesso`
          : `Evento "${data.title}" foi criado para ${new Date(data.startDate).toLocaleDateString('pt-BR')}`
      );

      // Adicionar notificação ao sistema
      addNotification({
        title: isEditing ? '📅 Evento Atualizado' : '📅 Novo Evento',
        message: isEditing 
          ? `Evento "${data.title}" foi modificado`
          : `Evento "${data.title}" agendado para ${new Date(data.startDate).toLocaleDateString('pt-BR')}`,
        type: 'success',
        priority: 'medium',
        entityType: 'agenda',
        entityId: eventData.start.getTime().toString()
      });

      // Notificação específica sobre participantes
      if (participants.length > 0) {
        addNotification({
          title: '👥 Participantes Convidados',
          message: `${participants.length} participante(s) foram convidados para o evento`,
          type: 'info',
          priority: 'low'
        });
      }

      // Criar lembrete automático se configurado
      if (data.reminderTime && data.reminderType && !data.isAllDay) {
        const reminderDateTime = new Date(eventData.start.getTime() - (data.reminderTime * 60 * 1000));
        
        // Só criar lembrete se for no futuro
        if (reminderDateTime > new Date()) {
          addReminder({
            title: `🔔 Lembrete: ${data.title}`,
            message: `Evento em ${data.reminderTime} minutos${data.location ? ` - Local: ${data.location}` : ''}`,
            entityType: 'agenda',
            entityId: eventData.start.getTime().toString(),
            scheduledFor: reminderDateTime,
            recurring: false
          });

          // Notificação sobre o lembrete criado
          addNotification({
            title: '⏰ Lembrete Configurado',
            message: `Você será lembrado ${data.reminderTime} minutos antes do evento`,
            type: 'info',
            priority: 'low'
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      showError(
        'Erro ao Salvar',
        'Não foi possível salvar o evento. Tente novamente.'
      );
    }
  };

  const handleAddParticipant = (email: string) => {
    if (email && !participants.includes(email)) {
      // Validação básica de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showError('Email Inválido', 'Por favor, insira um email válido');
        return;
      }
      
      setParticipants([...participants, email]);
      setNewParticipantEmail('');
      setShowAddParticipant(false);
      
      showSuccess('Participante Adicionado', `${email} foi adicionado ao evento`);
    }
  };

  const handleRemoveParticipant = (email: string) => {
    setParticipants(participants.filter(p => p !== email));
    showSuccess('Participante Removido', `${email} foi removido do evento`);
  };

  const handleAddParticipantFromInput = () => {
    if (newParticipantEmail.trim()) {
      handleAddParticipant(newParticipantEmail.trim());
    }
  };

  const handleKeyPressParticipant = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddParticipantFromInput();
    }
  };

  const handleDelete = () => {
    if (event && onDelete) {
      // Notificação de exclusão
      showSuccess(
        'Evento Excluído',
        `Evento "${event.title}" foi removido da agenda`
      );

      // Adicionar notificação ao sistema
      addNotification({
        title: '🗑️ Evento Excluído',
        message: `Evento "${event.title}" foi removido da agenda`,
        type: 'warning',
        priority: 'medium',
        entityType: 'agenda',
        entityId: event.id
      });

      onDelete(event.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? 'Editar evento' : 'Criar evento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form em formato paisagem */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-3 gap-8">
            {/* Coluna 1 - Informações Básicas */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informações Básicas</h3>
              
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Adicionar título"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Toggle Dia todo / Confirmado */}
              <div className="flex items-center justify-between py-3 border border-gray-200 rounded-lg px-4">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-700">Dia todo</span>
                  <Controller
                    name="isAllDay"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          field.value ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            field.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    )}
                  />
                  <span className="text-sm text-gray-700">Confirmado</span>
                </div>
              </div>

              {/* Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Local
                </label>
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Adicionar local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={4}
                      placeholder="Adicionar descrição"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  )}
                />
              </div>
            </div>

            {/* Coluna 2 - Data e Horário */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Data e Horário</h3>
              
              {/* Data do evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Data do evento *
                </label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                />
              </div>

              {/* Horário e Duração */}
              {!isAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Horário de início */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário de início *
                    </label>
                    <Controller
                      name="startTime"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="time"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    />
                  </div>

                  {/* Duração */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duração
                    </label>
                    <Controller
                      name="duration"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="15">15 minutos</option>
                          <option value="30">30 minutos</option>
                          <option value="45">45 minutos</option>
                          <option value="60">1 hora</option>
                          <option value="90">1h 30min</option>
                          <option value="120">2 horas</option>
                          <option value="180">3 horas</option>
                          <option value="240">4 horas</option>
                          <option value="480">8 horas</option>
                          <option value="custom">Personalizado</option>
                        </select>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Campo personalizado para duração */}
              {!isAllDay && watch('duration') === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração personalizada
                  </label>
                  <div className="flex space-x-2">
                    <Controller
                      name="customDurationHours"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          max="23"
                          placeholder="0"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    />
                    <span className="flex items-center text-sm text-gray-600">horas</span>
                    <Controller
                      name="customDurationMinutes"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="0"
                          max="59"
                          placeholder="0"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    />
                    <span className="flex items-center text-sm text-gray-600">minutos</span>
                  </div>
                </div>
              )}

              {/* Exibir horário de término calculado */}
              {!isAllDay && watch('startTime') && watch('duration') && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>Término previsto:</strong> {calculateEndTime(watch('startTime'), watch('duration'), watch('customDurationHours'), watch('customDurationMinutes'))}
                  </p>
                </div>
              )}

              {/* Lembrete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Bell className="w-4 h-4 inline mr-1" />
                  Lembrete
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="reminderType"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="notification">Notificação</option>
                          <option value="email">E-mail</option>
                          <option value="both">Ambos</option>
                        </select>
                      )}
                    />
                    
                    <Controller
                      name="reminderTime"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="number"
                          min="1"
                          max="60"
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    />
                    
                    <span className="text-sm text-gray-600">min antes</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="emailOffline"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      )}
                    />
                    <span className="text-sm text-gray-700 flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      E-mail se offline
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 3 - Participantes e Ações */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Participantes e Recursos</h3>
              
              {/* Participantes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Participantes
                </label>
                
                {/* Lista de participantes adicionados */}
                {participants.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {participants.map((email, index) => (
                        <div
                          key={index}
                          className="relative group"
                        >
                          {/* Avatar com tooltip */}
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:bg-blue-600 transition-colors relative">
                            {email.charAt(0).toUpperCase()}
                            
                            {/* Botão de remoção (aparece no hover) */}
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(email)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                              title="Remover participante"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Tooltip com email completo */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            {email}
                            {/* Seta do tooltip */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Contador de participantes */}
                      <div className="flex items-center text-sm text-gray-500 ml-2">
                        <Users className="w-4 h-4 mr-1" />
                        {participants.length} participante{participants.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulário de adicionar participante */}
                {showAddParticipant ? (
                  <div className="mb-3 space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        onKeyPress={handleKeyPressParticipant}
                        placeholder="email@exemplo.com"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddParticipantFromInput}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        title="Adicionar"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddParticipant(false);
                          setNewParticipantEmail('');
                        }}
                        className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddParticipant(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Selecionar participantes</option>
                      <option value="joao@empresa.com">João Silva (joao@empresa.com)</option>
                      <option value="maria@empresa.com">Maria Santos (maria@empresa.com)</option>
                      <option value="pedro@empresa.com">Pedro Costa (pedro@empresa.com)</option>
                      <option value="ana@empresa.com">Ana Oliveira (ana@empresa.com)</option>
                      <option value="carlos@empresa.com">Carlos Lima (carlos@empresa.com)</option>
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowAddParticipant(true)}
                  className="text-blue-600 text-sm hover:text-blue-800 flex items-center transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar participante
                </button>
              </div>
              
              {/* Recursos/Ativos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recursos
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Selecionar recursos</option>
                  <option value="sala1">Sala de Reuniões 1</option>
                  <option value="sala2">Sala de Reuniões 2</option>
                  <option value="projetor">Projetor</option>
                  <option value="notebook">Notebook</option>
                </select>
              </div>

              {/* Ações Rápidas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ações Rápidas</h4>
                <div className="space-y-2">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => {/* Duplicar evento */}}
                  >
                    Duplicar evento
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    onClick={() => {/* Criar série */}}
                  >
                    Criar evento recorrente
                  </button>
                  {event && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      onClick={handleDelete}
                    >
                      Excluir evento
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Resumo de Participantes */}
          {participants.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="flex items-center space-x-2 mb-3">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-medium text-blue-900">
                  Participantes Convidados ({participants.length})
                </h4>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Avatares dos participantes */}
                <div className="flex -space-x-2">
                  {participants.slice(0, 5).map((email, index) => (
                    <div
                      key={index}
                      className="relative group"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white hover:z-10 cursor-pointer">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Tooltip para o resumo */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                        {email}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Indicador de mais participantes */}
                  {participants.length > 5 && (
                    <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                      +{participants.length - 5}
                    </div>
                  )}
                </div>
                
                {/* Lista completa em texto pequeno */}
                <div className="flex-1 text-xs text-blue-600">
                  {participants.length <= 3 ? (
                    participants.join(', ')
                  ) : (
                    `${participants.slice(0, 2).join(', ')} e mais ${participants.length - 2} participante${participants.length - 2 !== 1 ? 's' : ''}`
                  )}
                </div>
              </div>
              
              <p className="text-xs text-blue-600 mt-3 flex items-center">
                <Mail className="w-3 h-3 mr-1" />
                Convites serão enviados por email automaticamente
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>SALVAR</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
