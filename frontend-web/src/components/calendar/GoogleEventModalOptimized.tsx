import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { CalendarEvent } from '../../types/calendar';
import { useResponsive, useBodyOverflow } from '../../hooks/useResponsive';
import { ResponsiveModal, AdaptiveColumns, ResponsiveCard } from '../layout/ResponsiveLayout';
import {
  FormField,
  BaseInput,
  BaseSelect,
  BaseTextarea,
  BaseButton,
  StatusPanel,
  StatusBadge,
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
  Phone,
  Video,
  Link,
  Bell,
  MoreVertical,
  Edit3,
  Globe,
  Lock,
  UserCheck,
  UserX,
  Eye,
  Settings,
} from 'lucide-react';

// Interface para participantes (estilo Google)
interface GoogleParticipant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'pending';
  role: 'organizer' | 'attendee' | 'optional';
  isGuest?: boolean;
  canModifyEvent?: boolean;
  canInviteOthers?: boolean;
  canSeeGuestList?: boolean;
}

// Interface para notificações
interface EventNotification {
  id: string;
  type: 'popup' | 'email';
  time: number; // minutos antes do evento
  timeUnit: 'minutes' | 'hours' | 'days' | 'weeks';
}

// Interface para recorrência
interface EventRecurrence {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval?: number;
  endType: 'never' | 'count' | 'until';
  endCount?: number;
  endDate?: string;
  byWeekday?: number[];
  byMonthDay?: number[];
}

// Interface do formulário
interface GoogleEventFormData {
  title: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  timezone: string;
  allDay: boolean;
  participants: GoogleParticipant[];
  notifications: EventNotification[];
  recurrence: EventRecurrence;
  visibility: 'public' | 'private' | 'confidential';
  calendar: string;
  conferenceLink?: string;
  attachments?: File[];
  color?: string;
  priority: 'low' | 'normal' | 'high';
  collaborator?: string;
  category?: string;
  tags?: string[];
}

interface GoogleEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GoogleEventFormData) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
  event?: CalendarEvent | null;
  isLoading?: boolean;
  availableCalendars?: Array<{ id: string; name: string; color: string }>;
  currentUser?: GoogleParticipant;
}

// Schema de validação
const googleEventSchema = yup.object({
  title: yup
    .string()
    .required('Título é obrigatório')
    .min(1, 'Título é obrigatório')
    .max(255, 'Título deve ter no máximo 255 caracteres'),

  start: yup.string().required('Data de início é obrigatória'),

  end: yup
    .string()
    .required('Data de fim é obrigatória')
    .test('end-after-start', 'Data de fim deve ser posterior ao início', function (value) {
      const { start } = this.parent;
      return !start || !value || new Date(value) > new Date(start);
    }),

  location: yup.string().max(255, 'Local deve ter no máximo 255 caracteres'),

  description: yup.string().max(8192, 'Descrição deve ter no máximo 8192 caracteres'),

  participants: yup.array().of(
    yup.object({
      email: yup.string().email('Email inválido').required('Email é obrigatório'),
      name: yup.string().required('Nome é obrigatório'),
    }),
  ),

  calendar: yup.string().required('Calendário é obrigatório'),

  visibility: yup
    .string()
    .oneOf(['public', 'private', 'confidential'])
    .required('Visibilidade é obrigatória'),

  priority: yup.string().oneOf(['low', 'normal', 'high']).required('Prioridade é obrigatória'),
});

// Cores padrão do Google Calendar
const EVENT_COLORS = [
  { id: 'blue', name: 'Azul', value: '#1a73e8', bg: 'bg-blue-500' },
  { id: 'green', name: 'Verde', value: '#137333', bg: 'bg-green-600' },
  { id: 'purple', name: 'Roxo', value: '#9334e6', bg: 'bg-purple-600' },
  { id: 'red', name: 'Vermelho', value: '#d93025', bg: 'bg-red-500' },
  { id: 'orange', name: 'Laranja', value: '#f57c00', bg: 'bg-orange-500' },
  { id: 'pink', name: 'Rosa', value: '#e91e63', bg: 'bg-pink-500' },
  { id: 'cyan', name: 'Ciano', value: '#00acc1', bg: 'bg-cyan-500' },
  { id: 'brown', name: 'Marrom', value: '#8d6e63', bg: 'bg-amber-700' },
  { id: 'gray', name: 'Cinza', value: '#616161', bg: 'bg-gray-500' },
];

// Opções de timezone
const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: '(GMT-3) Brasília' },
  { value: 'America/New_York', label: '(GMT-5) New York' },
  { value: 'America/Los_Angeles', label: '(GMT-8) Los Angeles' },
  { value: 'Europe/London', label: '(GMT+0) Londres' },
  { value: 'Europe/Paris', label: '(GMT+1) Paris' },
  { value: 'Asia/Tokyo', label: '(GMT+9) Tóquio' },
];

// Opções de notificação
const NOTIFICATION_OPTIONS = [
  { minutes: 0, label: 'Na hora do evento' },
  { minutes: 5, label: '5 minutos antes' },
  { minutes: 10, label: '10 minutos antes' },
  { minutes: 15, label: '15 minutos antes' },
  { minutes: 30, label: '30 minutos antes' },
  { minutes: 60, label: '1 hora antes' },
  { minutes: 120, label: '2 horas antes' },
  { minutes: 1440, label: '1 dia antes' },
  { minutes: 10080, label: '1 semana antes' },
];

/**
 * GoogleEventModal - Modal de evento estilo Google Calendar Otimizado
 *
 * Modal avançado com layout otimizado que aproveita melhor o espaço:
 * - Interface expandida com campos maiores
 * - Layout responsivo com melhor uso do espaço
 * - Campos organizados em seções visuais
 * - Melhor legibilidade e usabilidade
 */
export const GoogleEventModal: React.FC<GoogleEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  event,
  isLoading = false,
  availableCalendars = [
    { id: 'primary', name: 'Principal', color: '#159A9C' },
    { id: 'work', name: 'Trabalho', color: '#137333' },
    { id: 'personal', name: 'Pessoal', color: '#9334e6' },
    { id: 'meetings', name: 'Reuniões', color: '#d93025' },
    { id: 'events', name: 'Eventos', color: '#f57c00' },
  ],
  currentUser = {
    id: 'current-user',
    name: 'Você',
    email: 'usuario@empresa.com',
    status: 'accepted',
    role: 'organizer',
    canModifyEvent: true,
    canInviteOthers: true,
    canSeeGuestList: true,
  },
}) => {
  const { isMobile, isTablet } = useResponsive();
  const { lockScroll, unlockScroll } = useBodyOverflow();

  // Estados locais
  const [activeTab, setActiveTab] = useState<'details' | 'participants' | 'options'>('details');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participantName, setParticipantName] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<GoogleEventFormData>({
    resolver: yupResolver(googleEventSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      start: '',
      end: '',
      location: '',
      timezone: 'America/Sao_Paulo',
      allDay: false,
      participants: [currentUser],
      notifications: [{ id: '1', type: 'popup', time: 10, timeUnit: 'minutes' }],
      recurrence: {
        frequency: 'none',
        endType: 'never',
      },
      visibility: 'private',
      calendar: 'primary',
      conferenceLink: '',
      color: 'blue',
      priority: 'normal',
      collaborator: '',
      category: '',
      tags: [],
    },
  });

  // Watchers
  const allDay = watch('allDay');
  const participants = watch('participants');
  const notifications = watch('notifications');
  const selectedColor = watch('color');
  const currentCalendar = watch('calendar');

  // Gerenciar scroll do body
  useEffect(() => {
    if (isOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }
    return () => unlockScroll();
  }, [isOpen, lockScroll, unlockScroll]);

  // Reset form quando abrir/fechar
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editar evento existente
        const eventData: GoogleEventFormData = {
          title: event.title,
          description: event.description || '',
          start: event.start.toISOString().slice(0, 16),
          end: event.end.toISOString().slice(0, 16),
          location: event.location || '',
          timezone: 'America/Sao_Paulo',
          allDay: event.allDay || false,
          participants: [currentUser],
          notifications: [{ id: '1', type: 'popup', time: 10, timeUnit: 'minutes' }],
          recurrence: {
            frequency: 'none',
            endType: 'never',
          },
          visibility: 'private',
          calendar: 'primary',
          conferenceLink: '',
          color: 'blue',
          priority: 'normal',
          collaborator: event.collaborator || '',
          category: event.category || '',
          tags: [],
        };
        reset(eventData);
      } else {
        // Novo evento
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);

        reset({
          title: '',
          description: '',
          start: now.toISOString().slice(0, 16),
          end: nextHour.toISOString().slice(0, 16),
          location: '',
          timezone: 'America/Sao_Paulo',
          allDay: false,
          participants: [currentUser],
          notifications: [{ id: '1', type: 'popup', time: 10, timeUnit: 'minutes' }],
          recurrence: {
            frequency: 'none',
            endType: 'never',
          },
          visibility: 'private',
          calendar: 'primary',
          conferenceLink: '',
          color: 'blue',
          priority: 'normal',
          collaborator: '',
          category: '',
          tags: [],
        });
      }
      setActiveTab('details');
    }
  }, [isOpen, event, reset, currentUser]);

  // Funções para gerenciar participantes
  const addParticipant = () => {
    if (!participantEmail || !participantName) {
      toast.error('Nome e email são obrigatórios');
      return;
    }

    const newParticipant: GoogleParticipant = {
      id: Date.now().toString(),
      name: participantName,
      email: participantEmail,
      status: 'pending',
      role: 'attendee',
      canModifyEvent: false,
      canInviteOthers: false,
      canSeeGuestList: true,
    };

    const currentParticipants = getValues('participants') || [];

    // Verificar se email já existe
    if (currentParticipants.some((p) => p.email === participantEmail)) {
      toast.error('Este email já foi adicionado');
      return;
    }

    setValue('participants', [...currentParticipants, newParticipant], { shouldValidate: true });
    setParticipantEmail('');
    setParticipantName('');
    toast.success('Participante adicionado!');
  };

  const removeParticipant = (participantId: string) => {
    const currentParticipants = getValues('participants') || [];
    const participant = currentParticipants.find((p) => p.id === participantId);

    if (participant?.role === 'organizer') {
      toast.error('Não é possível remover o organizador');
      return;
    }

    setValue(
      'participants',
      currentParticipants.filter((p) => p.id !== participantId),
      { shouldValidate: true },
    );

    toast.success('Participante removido!');
  };

  // Função para criar link de videoconferência
  const createMeetingLink = () => {
    const meetingId = Math.random().toString(36).substring(2, 15);
    const meetingLink = `https://meet.google.com/${meetingId}`;
    setValue('conferenceLink', meetingLink);
    toast.success('Link de reunião criado!');
  };

  // Submissão do formulário
  const onSubmit = async (data: GoogleEventFormData) => {
    const toastId = toast.loading(event ? 'Atualizando evento...' : 'Criando evento...');

    try {
      await onSave(data);

      toast.success(event ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!', {
        id: toastId,
      });

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      toast.error(event ? 'Erro ao atualizar evento' : 'Erro ao criar evento', { id: toastId });
    }
  };

  const handleClose = () => {
    reset();
    setActiveTab('details');
    setParticipantEmail('');
    setParticipantName('');
    onClose();
  };

  // Renderizar avatar do participante
  const renderParticipantAvatar = (participant: GoogleParticipant) => {
    if (participant.avatar) {
      return (
        <img
          src={participant.avatar}
          alt={participant.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      );
    }

    const initials = participant.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
    const colorIndex = participant.id.length % colors.length;

    return (
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${colors[colorIndex]}`}
      >
        {initials}
      </div>
    );
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={handleClose}
      title={event ? 'Editar Evento' : 'Novo Evento'}
      maxWidth="7xl"
      className="google-event-modal"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col min-h-[85vh]">
        {/* Tabs de navegação - Mais espaçosas */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-12">
            {[
              { id: 'details', label: 'Detalhes', icon: Edit3 },
              { id: 'participants', label: 'Participantes', icon: Users },
              { id: 'options', label: 'Opções', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-3 border-b-2 font-medium text-base transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {tab.label}
                    {tab.id === 'participants' && participants.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                        {participants.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Conteúdo das tabs - Layout expandido */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-8">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Coluna Esquerda - Informações principais */}
              <div className="space-y-8">
                {/* Informações Básicas */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
                  <h3 className="font-bold text-xl text-gray-900 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Edit3 className="w-5 h-5 text-white" />
                    </div>
                    Informações Básicas
                  </h3>
                  <div className="space-y-6">
                    <FormField label="Título do Evento" error={errors.title?.message} required>
                      <BaseInput
                        {...register('title')}
                        placeholder="Ex: Reunião de Planejamento"
                        error={!!errors.title}
                        className="w-full text-lg font-medium h-14 px-4"
                      />
                    </FormField>

                    <FormField label="Calendário" error={errors.calendar?.message} required>
                      <BaseSelect
                        {...register('calendar')}
                        error={!!errors.calendar}
                        options={availableCalendars.map((cal) => ({
                          value: cal.id,
                          label: cal.name,
                        }))}
                        className="w-full h-14 text-base"
                      />
                    </FormField>

                    <FormField
                      label="Descrição"
                      error={errors.description?.message}
                      hint="Adicione detalhes sobre o evento"
                    >
                      <BaseTextarea
                        {...register('description')}
                        rows={6}
                        placeholder="Descreva o que será discutido no evento..."
                        error={!!errors.description}
                        className="w-full resize-none text-base p-4"
                      />
                    </FormField>

                    {/* Cor do evento - Mais espaçosa */}
                    <FormField label="Cor do Evento">
                      <div className="flex flex-wrap gap-3">
                        {EVENT_COLORS.map((color) => (
                          <button
                            key={color.id}
                            type="button"
                            onClick={() => setValue('color', color.id)}
                            className={`w-10 h-10 rounded-xl ${color.bg} transition-all hover:scale-110 hover:shadow-lg ${
                              selectedColor === color.id
                                ? 'ring-3 ring-gray-400 ring-offset-2 scale-110'
                                : ''
                            }`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </FormField>
                  </div>
                </div>

                {/* Local e Videoconferência */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8">
                  <h3 className="font-bold text-xl text-gray-900 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    Local e Videoconferência
                  </h3>
                  <div className="space-y-6">
                    <FormField
                      label="Local"
                      error={errors.location?.message}
                      hint="Endereço ou nome do local"
                    >
                      <BaseInput
                        {...register('location')}
                        placeholder="Ex: Sala de Reuniões A - 2º Andar"
                        error={!!errors.location}
                        className="w-full h-14 px-4 text-base"
                      />
                    </FormField>

                    <FormField label="Videoconferência" hint="Link da reunião online">
                      <div className="space-y-4">
                        <BaseInput
                          {...register('conferenceLink')}
                          placeholder="https://meet.google.com/..."
                          className="w-full h-14 px-4 text-base"
                        />
                        <button
                          type="button"
                          onClick={createMeetingLink}
                          className="flex items-center gap-3 px-6 py-3 text-base text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors font-medium"
                        >
                          <Video className="w-5 h-5" />
                          Criar reunião do Google Meet
                        </button>
                      </div>
                    </FormField>

                    {/* Visibilidade e Prioridade */}
                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="Visibilidade" error={errors.visibility?.message}>
                        <BaseSelect
                          {...register('visibility')}
                          error={!!errors.visibility}
                          options={[
                            { value: 'public', label: '🌍 Público' },
                            { value: 'private', label: '🔒 Privado' },
                            { value: 'confidential', label: '👁️ Confidencial' },
                          ]}
                          className="w-full h-14 text-base"
                        />
                      </FormField>

                      <FormField label="Prioridade" error={errors.priority?.message}>
                        <BaseSelect
                          {...register('priority')}
                          error={!!errors.priority}
                          options={[
                            { value: 'low', label: '🔽 Baixa' },
                            { value: 'normal', label: '➖ Normal' },
                            { value: 'high', label: '🔴 Alta' },
                          ]}
                          className="w-full h-14 text-base"
                        />
                      </FormField>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Direita - Data/Hora e Opções */}
              <div className="space-y-8">
                {/* Data e Hora */}
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-8">
                  <h3 className="font-bold text-xl text-gray-900 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    Data e Hora
                  </h3>
                  <div className="space-y-6">
                    {/* Toggle para dia inteiro - Mais visível */}
                    <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                      <label className="text-base font-medium text-gray-700">
                        Evento de dia inteiro
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" {...register('allDay')} className="sr-only peer" />
                        <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        label="Data e Hora de Início"
                        error={errors.start?.message}
                        required
                      >
                        <BaseInput
                          {...register('start')}
                          type={allDay ? 'date' : 'datetime-local'}
                          error={!!errors.start}
                          className="w-full h-14 px-4 text-base"
                        />
                      </FormField>

                      <FormField label="Data e Hora de Fim" error={errors.end?.message} required>
                        <BaseInput
                          {...register('end')}
                          type={allDay ? 'date' : 'datetime-local'}
                          error={!!errors.end}
                          className="w-full h-14 px-4 text-base"
                        />
                      </FormField>
                    </div>

                    <FormField label="Fuso Horário" error={errors.timezone?.message}>
                      <BaseSelect
                        {...register('timezone')}
                        error={!!errors.timezone}
                        options={TIMEZONES}
                        className="w-full h-14 text-base"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Configurações Avançadas */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-8">
                  <h3 className="font-bold text-xl text-gray-900 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    Configurações
                  </h3>
                  <div className="space-y-6">
                    <FormField label="Colaborador Responsável">
                      <BaseInput
                        {...register('collaborator')}
                        placeholder="Nome do colaborador responsável"
                        className="w-full h-14 px-4 text-base"
                      />
                    </FormField>

                    <FormField label="Categoria">
                      <BaseSelect
                        {...register('category')}
                        options={[
                          { value: '', label: 'Selecionar categoria...' },
                          { value: 'reuniao', label: '🤝 Reunião' },
                          { value: 'apresentacao', label: '📊 Apresentação' },
                          { value: 'treinamento', label: '📚 Treinamento' },
                          { value: 'workshop', label: '🛠️ Workshop' },
                          { value: 'conferencia', label: '🎤 Conferência' },
                          { value: 'entrevista', label: '👥 Entrevista' },
                          { value: 'social', label: '🎉 Social' },
                          { value: 'outro', label: '📋 Outro' },
                        ]}
                        className="w-full h-14 text-base"
                      />
                    </FormField>

                    {/* Status do Evento */}
                    <StatusPanel title="Status do Evento">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Calendário Selecionado
                          </label>
                          <div className="mt-2 flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor:
                                  availableCalendars.find((c) => c.id === currentCalendar)?.color ||
                                  '#159A9C',
                              }}
                            />
                            <span className="text-base text-gray-700 font-medium">
                              {availableCalendars.find((c) => c.id === currentCalendar)?.name ||
                                'Principal'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Participantes
                          </label>
                          <p className="text-base text-gray-700 mt-2 font-medium">
                            {participants.length} {participants.length === 1 ? 'pessoa' : 'pessoas'}
                          </p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Notificações
                          </label>
                          <p className="text-base text-gray-700 mt-2 font-medium">
                            {notifications.length} ativa{notifications.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </StatusPanel>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'participants' && (
            <div className="space-y-8">
              {/* Adicionar participante - Layout expandido */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
                <h3 className="font-bold text-xl text-gray-900 mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  Adicionar Participante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Nome Completo" required>
                    <BaseInput
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full h-14 px-4 text-base"
                    />
                  </FormField>

                  <FormField label="Email" required>
                    <BaseInput
                      type="email"
                      value={participantEmail}
                      onChange={(e) => setParticipantEmail(e.target.value)}
                      placeholder="joao.silva@empresa.com"
                      className="w-full h-14 px-4 text-base"
                    />
                  </FormField>

                  <div className="flex items-end">
                    <BaseButton
                      type="button"
                      onClick={addParticipant}
                      variant="primary"
                      icon={<Plus className="w-5 h-5" />}
                      className="w-full h-14 text-base font-medium"
                    >
                      Adicionar
                    </BaseButton>
                  </div>
                </div>
              </div>

              {/* Lista de participantes - Mais espaçosa */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <h3 className="font-bold text-xl text-gray-900 mb-8 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  Participantes Convidados ({participants.length})
                </h3>

                <div className="space-y-4">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {renderParticipantAvatar(participant)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-gray-900 truncate text-lg">
                              {participant.name}
                              {participant.role === 'organizer' && (
                                <span className="ml-3 text-sm text-blue-600 font-bold bg-blue-100 px-3 py-1 rounded-full">
                                  ORGANIZADOR
                                </span>
                              )}
                            </p>
                          </div>
                          <p className="text-base text-gray-600 truncate mt-1">
                            {participant.email}
                          </p>
                          {participant.phone && (
                            <p className="text-sm text-gray-400 mt-1">{participant.phone}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                              participant.status === 'accepted'
                                ? 'bg-green-100 text-green-800'
                                : participant.status === 'declined'
                                  ? 'bg-red-100 text-red-800'
                                  : participant.status === 'tentative'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {participant.status === 'accepted' && (
                              <UserCheck className="w-4 h-4 mr-2" />
                            )}
                            {participant.status === 'declined' && (
                              <UserX className="w-4 h-4 mr-2" />
                            )}
                            {participant.status === 'tentative' && (
                              <AlertTriangle className="w-4 h-4 mr-2" />
                            )}
                            {participant.status === 'pending' && <Clock className="w-4 h-4 mr-2" />}
                            {participant.status === 'accepted'
                              ? 'Confirmado'
                              : participant.status === 'declined'
                                ? 'Recusou'
                                : participant.status === 'tentative'
                                  ? 'Tentativo'
                                  : 'Pendente'}
                          </span>
                        </div>
                      </div>

                      {participant.role !== 'organizer' && (
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant.id)}
                          className="ml-4 p-3 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Remover participante"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {participants.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                    <p className="text-xl mb-2">Nenhum participante adicionado</p>
                    <p className="text-base">Adicione participantes usando o formulário acima</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'options' && (
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-2xl p-8">
              <h3 className="font-bold text-xl text-gray-900 mb-8 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                Notificações e Opções Avançadas
              </h3>

              <div className="space-y-8">
                <FormField label="Notificações do Evento">
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border"
                      >
                        <BaseSelect
                          value={notification.type}
                          onChange={(e) => {
                            const updatedNotifications = notifications.map((n) =>
                              n.id === notification.id
                                ? { ...n, type: e.target.value as 'popup' | 'email' }
                                : n,
                            );
                            setValue('notifications', updatedNotifications);
                          }}
                          options={[
                            { value: 'popup', label: '💬 Notificação Popup' },
                            { value: 'email', label: '📧 Email' },
                          ]}
                          className="flex-1 h-12 text-base"
                        />

                        <BaseSelect
                          value={`${notification.time}`}
                          onChange={(e) => {
                            const updatedNotifications = notifications.map((n) =>
                              n.id === notification.id
                                ? { ...n, time: parseInt(e.target.value) }
                                : n,
                            );
                            setValue('notifications', updatedNotifications);
                          }}
                          options={NOTIFICATION_OPTIONS.map((opt) => ({
                            value: `${opt.minutes}`,
                            label: opt.label,
                          }))}
                          className="flex-1 h-12 text-base"
                        />

                        {notifications.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updatedNotifications = notifications.filter(
                                (n) => n.id !== notification.id,
                              );
                              setValue('notifications', updatedNotifications);
                            }}
                            className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newNotification: EventNotification = {
                          id: Date.now().toString(),
                          type: 'popup',
                          time: 10,
                          timeUnit: 'minutes',
                        };
                        setValue('notifications', [...notifications, newNotification]);
                      }}
                      className="flex items-center gap-3 px-6 py-3 text-base text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Adicionar notificação
                    </button>
                  </div>
                </FormField>

                {/* Configurações de Convidados */}
                <div className="bg-white p-6 rounded-xl border">
                  <h4 className="font-semibold text-lg text-gray-900 mb-6">
                    Configurações de Convidados
                  </h4>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 text-base cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        defaultChecked
                      />
                      <span>Convidados podem ver lista de participantes</span>
                    </label>

                    <label className="flex items-center gap-3 text-base cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Convidados podem convidar outros</span>
                    </label>

                    <label className="flex items-center gap-3 text-base cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        defaultChecked
                      />
                      <span>Convidados podem modificar evento</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer responsivo - Mais espaçoso */}
        <div className="flex-shrink-0 border-t border-gray-200 mt-8 pt-6 bg-gray-50 rounded-t-xl">
          <div className={`flex gap-4 px-6 pb-2 ${isMobile ? 'flex-col-reverse' : 'justify-end'}`}>
            <BaseButton
              type="button"
              variant="secondary"
              onClick={handleClose}
              icon={<X className="w-5 h-5" />}
              className={`${isMobile ? 'w-full justify-center' : ''} h-14 px-8 text-base font-medium`}
            >
              Cancelar
            </BaseButton>

            <BaseButton
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={!isValid}
              icon={<Save className="w-5 h-5" />}
              className={`${isMobile ? 'w-full justify-center' : ''} h-14 px-8 text-base font-medium`}
            >
              {event ? 'Atualizar Evento' : 'Salvar Evento'}
            </BaseButton>
          </div>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default GoogleEventModal;
