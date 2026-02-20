import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CalendarEvent } from '../../types/calendar';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import usuariosService from '../../services/usuariosService';
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
  UserCheck,
  FileText,
  Phone,
  Calendar,
  CheckSquare,
  Monitor,
  MapPin as MapPinIcon,
} from 'lucide-react';

// Schema de validação
const eventSchema = yup.object({
  title: yup.string().required('Título é obrigatório'),
  eventType: yup
    .string()
    .oneOf(['reuniao', 'ligacao', 'tarefa', 'evento', 'follow-up'])
    .required('Tipo de evento é obrigatório'),
  responsavel: yup.string().required('Responsável é obrigatório'),
  isAllDay: yup.boolean(),
  startDate: yup.string().required('Data do evento é obrigatória'),
  startTime: yup.string().when('isAllDay', {
    is: false,
    then: (schema) => schema.required('Horário de início é obrigatório'),
    otherwise: (schema) => schema.notRequired(),
  }),
  duration: yup.string().when('isAllDay', {
    is: false,
    then: (schema) => schema.required('Duração é obrigatória'),
    otherwise: (schema) => schema.notRequired(),
  }),
  customDurationHours: yup.number().when('duration', {
    is: 'custom',
    then: (schema) => schema.min(0).max(23),
    otherwise: (schema) => schema.notRequired(),
  }),
  customDurationMinutes: yup.number().when('duration', {
    is: 'custom',
    then: (schema) => schema.min(0).max(59),
    otherwise: (schema) => schema.notRequired(),
  }),
  locationType: yup
    .string()
    .oneOf(['presencial', 'virtual'])
    .required('Tipo de local é obrigatório'),
  location: yup.string(),
  description: yup.string(),
  status: yup
    .string()
    .oneOf(['confirmed', 'pending', 'cancelled'])
    .required('Status é obrigatório'),
  reminderTime: yup.number(),
  reminderType: yup.string(),
  emailOffline: yup.boolean(),
  participants: yup.array().of(yup.string()),
  attachments: yup.array().of(yup.string()),
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

const mapCalendarTypeToModalType = (type?: CalendarEvent['type']) => {
  switch (type) {
    case 'meeting':
      return 'reuniao';
    case 'call':
      return 'ligacao';
    case 'task':
      return 'tarefa';
    case 'follow-up':
      return 'follow-up';
    case 'event':
    default:
      return 'evento';
  }
};

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  selectedDate,
}) => {
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string; email: string }[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // Hook de notificações
  const { addNotification, addReminder, showSuccess, showError } = useNotifications();

  // Hook de autenticação para obter usuário atual
  const { user: usuarioAtual } = useAuth();

  // Função para calcular horário de término
  const calculateEndTime = (
    startTime: string,
    duration: string,
    customHours?: number,
    customMinutes?: number,
  ) => {
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
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: '',
      eventType: 'reuniao',
      responsavel: usuarioAtual?.id || '',
      isAllDay: false,
      startDate: '',
      startTime: '09:00',
      duration: '60',
      customDurationHours: 0,
      customDurationMinutes: 0,
      locationType: 'presencial',
      location: '',
      description: '',
      status: 'pending',
      reminderTime: 10,
      reminderType: 'notification',
      emailOffline: false,
      participants: [],
      attachments: [],
    },
  });

  const isAllDay = watch('isAllDay');

  // Carregar usuários quando o modal abrir
  useEffect(() => {
    if (isOpen && !loadingUsuarios && usuarios.length === 0) {
      const carregarUsuarios = async () => {
        setLoadingUsuarios(true);
        try {
          const { usuarios: listaUsuarios } = await usuariosService.listarUsuarios({
            limite: 1000,
          });
          setUsuarios(
            listaUsuarios.map((user) => ({
              id: user.id,
              nome: user.nome,
              email: user.email,
            })),
          );
        } catch (error) {
          console.error('Erro ao carregar usuários:', error);
          showError(
            'Erro ao carregar lista de usuários',
            'Não foi possível carregar os usuários disponíveis',
          );
        } finally {
          setLoadingUsuarios(false);
        }
      };
      carregarUsuarios();
    }
  }, [isOpen, loadingUsuarios, usuarios.length, showError]);

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
          eventType: mapCalendarTypeToModalType(event.type),
          responsavel: (event as any).responsavelId || usuarioAtual?.id || '',
          isAllDay: event.allDay || false,
          startDate: startDate.toISOString().split('T')[0],
          startTime: startDate.toTimeString().slice(0, 5),
          duration: durationValue,
          customDurationHours: customHours,
          customDurationMinutes: customMinutes,
          locationType: (event as any).locationType || 'presencial',
          location: event.location || '',
          description: event.description || '',
          status: event.status || 'pending',
          reminderTime: 10,
          reminderType: 'notification',
          emailOffline: false,
          participants: event.attendees || [],
          attachments: [],
        });

        setParticipants(event.attendees || []);
      } else {
        // Novo evento
        const defaultDate = selectedDate || new Date();
        const dateStr = defaultDate.toISOString().split('T')[0];

        reset({
          title: '',
          eventType: 'reuniao',
          responsavel: usuarioAtual?.id || '',
          isAllDay: false,
          startDate: dateStr,
          startTime: '09:00',
          duration: '60',
          customDurationHours: 0,
          customDurationMinutes: 0,
          locationType: 'presencial',
          location: '',
          description: '',
          status: 'pending',
          reminderTime: 10,
          reminderType: 'notification',
          emailOffline: false,
          participants: [],
          attachments: [],
        });
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
          durationMinutes =
            (data.customDurationHours || 0) * 60 + (data.customDurationMinutes || 0);
        } else {
          durationMinutes = parseInt(data.duration || '60');
        }

        endDate = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
      }

      // Encontrar o nome do usuário responsável
      const responsavelUsuario = usuarios.find((u) => u.id === data.responsavel);

      const eventData = {
        title: data.title,
        eventType: data.eventType,
        responsavel: responsavelUsuario?.nome || data.responsavel,
        responsavelId: data.responsavel,
        allDay: data.isAllDay,
        start: data.isAllDay
          ? new Date(data.startDate)
          : new Date(`${data.startDate}T${data.startTime}`),
        end: endDate,
        locationType: data.locationType,
        location: data.location || '',
        description: data.description || '',
        status: data.status,
        attendees: participants,
        reminderTime: data.reminderTime,
        reminderType: data.reminderType,
        emailOffline: data.emailOffline,
      };

      await onSave(eventData);

      // Notificação de sucesso
      const isEditing = !!event;
      showSuccess(
        isEditing ? 'Evento Atualizado' : 'Evento Criado',
        isEditing
          ? `Evento "${data.title}" foi atualizado com sucesso`
          : `Evento "${data.title}" foi criado para ${new Date(data.startDate).toLocaleDateString('pt-BR')}`,
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
        entityId: eventData.start.getTime().toString(),
      });

      // Notificação específica sobre participantes
      if (participants.length > 0) {
        addNotification({
          title: '👥 Participantes Convidados',
          message: `${participants.length} participante(s) foram convidados para o evento`,
          type: 'info',
          priority: 'low',
        });
      }

      // Criar lembrete automático se configurado
      if (data.reminderTime && data.reminderType && !data.isAllDay) {
        const reminderDateTime = new Date(
          eventData.start.getTime() - data.reminderTime * 60 * 1000,
        );

        // Só criar lembrete se for no futuro
        if (reminderDateTime > new Date()) {
          addReminder({
            title: `🔔 Lembrete: ${data.title}`,
            message: `Evento em ${data.reminderTime} minutos${data.location ? ` - Local: ${data.location}` : ''}`,
            entityType: 'agenda',
            entityId: eventData.start.getTime().toString(),
            scheduledFor: reminderDateTime,
            active: true,
          });

          // Notificação sobre o lembrete criado
          addNotification({
            title: '⏰ Lembrete Configurado',
            message: `Você será lembrado ${data.reminderTime} minutos antes do evento`,
            type: 'info',
            priority: 'low',
          });
        }
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      showError('Erro ao Salvar', 'Não foi possível salvar o evento. Tente novamente.');
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
    setParticipants(participants.filter((p) => p !== email));
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
      showSuccess('Evento Excluído', `Evento "${event.title}" foi removido da agenda`);

      // Adicionar notificação ao sistema
      addNotification({
        title: '🗑️ Evento Excluído',
        message: `Evento "${event.title}" foi removido da agenda`,
        type: 'warning',
        priority: 'medium',
        entityType: 'agenda',
        entityId: event.id,
      });

      onDelete(event.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg shadow-xl w-[calc(100%-2rem)] sm:w-[700px] md:w-[900px] lg:w-[1100px] xl:w-[1200px] max-w-[1400px] max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-[#002333]">
            {event ? 'Editar evento' : 'Criar evento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form em formato paisagem */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Coluna 1 - Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 border-b pb-1">
                Informações Básicas
              </h3>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Adicionar título"
                      className="w-full px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-sm text-[#002333]"
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.title.message}</p>
                )}
              </div>

              {/* Tipo de Evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Evento *
                </label>
                <Controller
                  name="eventType"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        onClick={() => field.onChange('reuniao')}
                        className={`flex items-center gap-1 p-2 border rounded-md transition-colors ${
                          field.value === 'reuniao'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#B4BEC9] bg-white text-[#002333] hover:bg-gray-50'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span className="text-xs font-medium">Reunião</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('ligacao')}
                        className={`flex items-center gap-1 p-2 border rounded-md transition-colors ${
                          field.value === 'ligacao'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#B4BEC9] bg-white text-[#002333] hover:bg-gray-50'
                        }`}
                      >
                        <Phone className="w-3 h-3" />
                        <span className="text-xs font-medium">Ligacao</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('tarefa')}
                        className={`flex items-center gap-1 p-2 border rounded-md transition-colors ${
                          field.value === 'tarefa'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#B4BEC9] bg-white text-[#002333] hover:bg-gray-50'
                        }`}
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span className="text-xs font-medium">Tarefa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('evento')}
                        className={`flex items-center gap-1 p-2 border rounded-md transition-colors ${
                          field.value === 'evento'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#B4BEC9] bg-white text-[#002333] hover:bg-gray-50'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs font-medium">Evento</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('follow-up')}
                        className={`flex items-center gap-1 p-2 border rounded-md transition-colors ${
                          field.value === 'follow-up'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#B4BEC9] bg-white text-[#002333] hover:bg-gray-50'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        <span className="text-xs font-medium">Follow-up</span>
                      </button>
                    </div>
                  )}
                />
                {errors.eventType && (
                  <p className="text-red-500 text-sm mt-1">{errors.eventType.message}</p>
                )}
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responsável *
                </label>
                <Controller
                  name="responsavel"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] focus:border-[#159A9C] text-sm text-[#002333]"
                      disabled={loadingUsuarios}
                    >
                      {loadingUsuarios ? (
                        <option value="">Carregando usuários...</option>
                      ) : (
                        <>
                          <option value="">Selecionar responsável</option>
                          {usuarios.map((usuario) => (
                            <option key={usuario.id} value={usuario.id}>
                              {usuario.nome} ({usuario.email})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                />
                {errors.responsavel && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.responsavel.message}</p>
                )}
              </div>

              {/* Status do Evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status do Evento *
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => field.onChange('pending')}
                        className={`flex items-center justify-center gap-1 p-2 border rounded-md transition-colors ${
                          field.value === 'pending'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-medium">Pendente</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('confirmed')}
                        className={`flex items-center justify-center gap-1 p-2 border rounded-md transition-colors ${
                          field.value === 'confirmed'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span className="text-xs font-medium">Confirmado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('cancelled')}
                        className={`flex items-center justify-center gap-1 p-2 border rounded-md transition-colors ${
                          field.value === 'cancelled'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span className="text-xs font-medium">Cancelado</span>
                      </button>
                    </div>
                  )}
                />
                {errors.status && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.status.message}</p>
                )}
              </div>

              {/* Localização */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local *</label>

                {/* Tipo de Local */}
                <div className="mb-2">
                  <Controller
                    name="locationType"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => field.onChange('presencial')}
                          className={`flex items-center justify-center gap-1 p-2 border rounded-md transition-colors ${
                            field.value === 'presencial'
                              ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                              : 'border-[#B4BEC9] bg-white text-[#002333] hover:bg-gray-50'
                          }`}
                        >
                          <MapPinIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">Presencial</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('virtual')}
                          className={`flex items-center justify-center gap-1 p-2 border rounded-md transition-colors ${
                            field.value === 'virtual'
                              ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                              : 'border-[#B4BEC9] bg-white text-[#002333] hover:bg-gray-50'
                          }`}
                        >
                          <Monitor className="w-3 h-3" />
                          <span className="text-xs font-medium">Virtual</span>
                        </button>
                      </div>
                    )}
                  />
                  {errors.locationType && (
                    <p className="text-red-500 text-xs mt-0.5">{errors.locationType.message}</p>
                  )}
                </div>

                {/* Detalhes do Local */}
                <Controller
                  name="location"
                  control={control}
                  render={({ field }) => {
                    const locationType = watch('locationType');
                    const placeholder =
                      locationType === 'virtual'
                        ? 'Link da reunião (Zoom, Teams, Meet, etc.)'
                        : 'Endereço ou nome do local';

                    return (
                      <input
                        {...field}
                        type="text"
                        placeholder={placeholder}
                        className="w-full px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm text-[#002333]"
                      />
                    );
                  }}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={4}
                      placeholder="Adicionar descrição do evento..."
                      className="w-full px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] resize-none text-sm text-[#002333]"
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Coluna 2 - Data e Horário */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 border-b pb-1">Data e Horário</h3>

              {/* Data do evento e toggle dia todo */}
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data do evento *
                  </label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="w-full px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm text-[#002333]"
                      />
                    )}
                  />
                </div>
                <div className="flex items-center space-x-1 pb-1.5">
                  <Controller
                    name="isAllDay"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="isAllDay"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 text-[#159A9C] focus:ring-[#159A9C] border-[#B4BEC9] rounded"
                      />
                    )}
                  />
                  <label
                    htmlFor="isAllDay"
                    className="text-xs font-medium text-gray-700 whitespace-nowrap"
                  >
                    O dia todo
                  </label>
                </div>
              </div>

              {/* Horário e Duração */}
              {!isAllDay && (
                <div className="grid grid-cols-2 gap-2">
                  {/* Horário de início */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horário de início *
                    </label>
                    <Controller
                      name="startTime"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="time"
                          className="w-full px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm text-[#002333]"
                        />
                      )}
                    />
                  </div>

                  {/* Duração */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração</label>
                    <Controller
                      name="duration"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm text-[#002333]"
                        >
                          <option value="15">15 min</option>
                          <option value="30">30 min</option>
                          <option value="45">45 min</option>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          className="w-16 px-2 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm text-[#002333]"
                        />
                      )}
                    />
                    <span className="flex items-center text-xs text-gray-600">h</span>
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
                          className="w-16 px-2 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm text-[#002333]"
                        />
                      )}
                    />
                    <span className="flex items-center text-xs text-gray-600">min</span>
                  </div>
                </div>
              )}

              {/* Exibir horário de término calculado */}
              {!isAllDay && watch('startTime') && watch('duration') && (
                <div className="bg-[#159A9C]/10 p-2 rounded-md">
                  <p className="text-xs text-[#002333]">
                    <strong>Término previsto:</strong>{' '}
                    {calculateEndTime(
                      watch('startTime'),
                      watch('duration'),
                      watch('customDurationHours'),
                      watch('customDurationMinutes'),
                    )}
                  </p>
                </div>
              )}

              {/* Lembrete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lembrete</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-1">
                    <Controller
                      name="reminderType"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="flex-1 px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm text-[#002333]"
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
                          className="w-16 px-2 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm text-[#002333]"
                        />
                      )}
                    />

                    <span className="text-xs text-gray-600">min antes</span>
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
                          className="w-4 h-4 text-[#159A9C] border-[#B4BEC9] rounded focus:ring-[#159A9C]"
                        />
                      )}
                    />
                    <span className="text-xs text-gray-700 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      E-mail se offline
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna 3 - Participantes e Ações */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900 border-b pb-1">Participantes</h3>

              {/* Participantes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Participantes
                </label>

                {/* Lista de participantes adicionados */}
                {participants.length > 0 && (
                  <div className="mb-2">
                    <div className="flex flex-wrap gap-1">
                      {participants.map((email, index) => (
                        <div key={index} className="relative group">
                          {/* Avatar com tooltip */}
                          <div className="w-8 h-8 bg-[#159A9C] rounded-full flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:bg-[#0F7B7D] transition-colors relative">
                            {email.charAt(0).toUpperCase()}

                            {/* Botão de remoção (aparece no hover) */}
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(email)}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                              title="Remover participante"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </div>

                          {/* Tooltip com email completo */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            {email}
                            {/* Seta do tooltip */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      ))}

                      {/* Contador de participantes */}
                      <div className="flex items-center text-xs text-gray-500 ml-1">
                        <Users className="w-3 h-3 mr-1" />
                        {participants.length} participante{participants.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulário de adicionar participante */}
                {showAddParticipant ? (
                  <div className="mb-2 space-y-1">
                    <div className="flex space-x-1">
                      <input
                        type="email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        onKeyPress={handleKeyPressParticipant}
                        placeholder="email@exemplo.com"
                        className="flex-1 px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] text-sm text-[#002333]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddParticipantFromInput}
                        className="px-2 py-1.5 bg-[#159A9C] text-white rounded-md hover:bg-[#0F7B7D] transition-colors"
                        title="Adicionar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddParticipant(false);
                          setNewParticipantEmail('');
                        }}
                        className="px-2 py-1.5 bg-gray-100 text-[#002333] border border-[#B4BEC9] rounded-md hover:bg-gray-200 transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2">
                    <select
                      className="w-full px-3 py-1.5 border border-[#B4BEC9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#159A9C] mb-1 text-sm text-[#002333]"
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
                  className="text-[#159A9C] text-xs hover:text-[#0F7B7D] flex items-center transition-colors"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar participante
                </button>
              </div>
            </div>
          </div>

          {/* Resumo de Participantes - Compacto */}
          {participants.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-center space-x-2 mb-2">
                <UserCheck className="w-4 h-4 text-[#159A9C]" />
                <h4 className="text-xs font-medium text-[#002333]">
                  Participantes Convidados ({participants.length})
                </h4>
              </div>

              <div className="flex items-center space-x-2">
                {/* Avatares dos participantes */}
                <div className="flex -space-x-1">
                  {participants.slice(0, 5).map((email, index) => (
                    <div key={index} className="relative group">
                      <div className="w-6 h-6 bg-[#159A9C] rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white hover:z-10 cursor-pointer">
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
                <div className="flex-1 text-xs text-[#002333]">
                  {participants.length <= 3
                    ? participants.join(', ')
                    : `${participants.slice(0, 2).join(', ')} e mais ${participants.length - 2} participante${participants.length - 2 !== 1 ? 's' : ''}`}
                </div>
              </div>

              <p className="text-xs text-[#002333] mt-2 flex items-center">
                <Mail className="w-3 h-3 mr-1" />
                Convites serão enviados por email automaticamente
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-3 mt-3 border-t">
            <div>
              {event && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors flex items-center space-x-1 text-sm"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Excluir</span>
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-white text-[#002333] border border-[#B4BEC9] rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-1.5 bg-[#159A9C] text-white rounded-md hover:bg-[#0F7B7D] transition-colors disabled:opacity-50 flex items-center space-x-1 text-sm font-medium"
              >
                {isSubmitting && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>SALVAR</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
