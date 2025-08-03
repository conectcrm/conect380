import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CalendarEvent } from '../../types/calendar';
import { User } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { usuariosService } from '../../services/usuariosService';
import { EventTemplatesSelector, useEventTemplate } from './EventTemplatesSelector';
import RecurrenceModal from './RecurrenceModal';
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
  User as UserIcon,
  RotateCcw,
  Copy,
  FileText,
  Phone,
  Presentation
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Schema de validação
const eventSchema = yup.object({
  title: yup.string().required('Título é obrigatório'),
  eventType: yup.string().oneOf(['reuniao', 'tarefa', 'evento', 'follow-up', 'call', 'demo']).required('Tipo de evento é obrigatório'),
  isAllDay: yup.boolean(),
  status: yup.string().oneOf(['confirmado', 'pendente', 'cancelado']).required('Status é obrigatório'),
  responsavel: yup.string().required('Responsável é obrigatório'),
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
  attachments: yup.array().of(yup.string()),
  isRecurring: yup.boolean(),
  recurrencePattern: yup.object().when('isRecurring', {
    is: true,
    then: (schema) => schema.required(),
    otherwise: (schema) => schema.notRequired()
  })
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
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  // Estados para templates e recorrência
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<any>(null);

  // Hook de notificações, autenticação e templates
  const { addReminder, showSuccess, showError } = useNotifications();
  const { user: usuarioAtual } = useAuth();
  const { applyTemplate } = useEventTemplate();

  // Configuração do formulário
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
      eventType: 'reuniao',
      isAllDay: false,
      status: 'confirmado',
      responsavel: '', // Será preenchido quando carregar usuários
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
      attachments: [],
      isRecurring: false,
      recurrencePattern: null
    }
  });

  const isAllDay = watch('isAllDay');

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

  // Opções de status do evento
  const statusOptions = [
    { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-800' },
    { value: 'pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' }
  ];

  // Buscar usuários da empresa
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!isOpen) return;

      setCarregandoUsuarios(true);
      try {
        // Buscar usuários reais da equipe
        const equipe = await usuariosService.buscarUsuariosEquipe();
        setUsuarios(equipe);

        console.log('Usuários carregados:', equipe);
        console.log('Usuário atual:', usuarioAtual);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        showError('Erro ao carregar lista de usuários', 'Tente novamente em alguns instantes');

        // Fallback para dados mock em caso de erro
        setUsuarios([
          {
            id: '1',
            nome: 'João Silva',
            email: 'joao@empresa.com',
            role: 'manager',
            idioma_preferido: 'pt-BR',
            empresa: { id: '1', nome: 'Empresa', slug: 'empresa' }
          },
          {
            id: '2',
            nome: 'Maria Santos',
            email: 'maria@empresa.com',
            role: 'vendedor',
            idioma_preferido: 'pt-BR',
            empresa: { id: '1', nome: 'Empresa', slug: 'empresa' }
          },
        ]);
      } finally {
        setCarregandoUsuarios(false);
      }
    };

    fetchUsuarios();
  }, [isOpen, showError]);

  // Pré-selecionar usuário atual quando os usuários carregarem
  useEffect(() => {
    if (usuarios.length > 0 && usuarioAtual && !event) {
      // Para novo evento, pré-selecionar o usuário atual
      const usuarioAtualNaLista = usuarios.find(u => u.id === usuarioAtual.id || u.email === usuarioAtual.email);
      if (usuarioAtualNaLista) {
        setValue('responsavel', usuarioAtualNaLista.id);
        console.log('Pré-selecionado usuário atual:', usuarioAtualNaLista.nome);
      } else if (usuarios.length > 0) {
        // Fallback para o primeiro usuário se o atual não estiver na lista
        setValue('responsavel', usuarios[0].id);
        console.log('Pré-selecionado primeiro usuário:', usuarios[0].nome);
      }
    }
  }, [usuarios, usuarioAtual, event, setValue]);

  // Inicializar dados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      if (event) {
        // Editando evento existente - não mostrar templates
        setShowTemplateSelector(false);

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
          eventType: event.eventType || 'reuniao',
          isAllDay: event.allDay || false,
          status: event.status === 'confirmed' ? 'confirmado' :
            event.status === 'cancelled' ? 'cancelado' : 'pendente',
          responsavel: event.responsavel || usuarios[0]?.id || '',
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
          attachments: [],
          isRecurring: false,
          recurrencePattern: null
        });

        setIsConfirmed(event.status === 'confirmed');
        setParticipants(event.attendees || []);
      } else {
        // Novo evento - mostrar seletor de templates se não foi selecionado ainda
        if (!selectedTemplate) {
          setShowTemplateSelector(true);
          return;
        }

        // Novo evento com dados padrão
        const defaultDate = selectedDate || new Date();
        const dateStr = defaultDate.toISOString().split('T')[0];

        reset({
          title: '',
          eventType: 'reuniao',
          isAllDay: false,
          status: 'confirmado',
          responsavel: usuarios[0]?.id || '',
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
          attachments: [],
          isRecurring: false,
          recurrencePattern: null
        });

        setIsConfirmed(true);
      }
    }
  }, [isOpen, event, selectedDate, reset, selectedTemplate, usuarios]);

  // Funções para gerenciar templates
  const handleSelectTemplate = (template: any) => {
    const { participantsToAdd } = applyTemplate(template, setValue, selectedDate);
    setParticipants(participantsToAdd);
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  };

  const handleSkipTemplate = () => {
    setShowTemplateSelector(false);
    setSelectedTemplate(null);
  };

  const handleChangeTemplate = () => {
    // Resetar formulário
    const defaultDate = selectedDate || new Date();
    const dateStr = defaultDate.toISOString().split('T')[0];

    reset({
      title: '',
      eventType: 'reuniao',
      isAllDay: false,
      status: 'confirmado',
      responsavel: usuarios[0]?.id || '',
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
      attachments: [],
      isRecurring: false,
      recurrencePattern: null
    });

    // Resetar participantes
    setParticipants([]);

    // Mostrar seletor novamente
    setSelectedTemplate(null);
    setShowTemplateSelector(true);
  };

  // Funções para gerenciar recorrência
  const handleOpenRecurrence = () => {
    setShowRecurrenceModal(true);
  };

  const handleSaveRecurrence = (pattern: any) => {
    setRecurrencePattern(pattern);
    setValue('isRecurring', true);
    setValue('recurrencePattern', pattern);
    setShowRecurrenceModal(false);
    showSuccess('Recorrência configurada', 'Padrão de repetição foi definido com sucesso');
  };

  const handleRemoveRecurrence = () => {
    setRecurrencePattern(null);
    setValue('isRecurring', false);
    setValue('recurrencePattern', null);
    showSuccess('Recorrência removida', 'Este evento não será mais repetido');
  };

  const handleAddRecurrence = () => {
    setShowRecurrenceModal(true);
  };

  const handleEditRecurrence = () => {
    setShowRecurrenceModal(true);
  };

  // Função para obter descrição legível da recorrência
  const getRecurrenceDescription = (pattern: any): string => {
    if (!pattern) return '';

    const { type, interval = 1, daysOfWeek, dayOfMonth } = pattern;

    switch (type) {
      case 'daily':
        return interval === 1 ? 'Diariamente' : `A cada ${interval} dias`;

      case 'weekly':
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = {
            0: 'Domingo', 1: 'Segunda', 2: 'Terça', 3: 'Quarta',
            4: 'Quinta', 5: 'Sexta', 6: 'Sábado'
          };
          const days = daysOfWeek.map((day: number) => dayNames[day as keyof typeof dayNames]).join(', ');
          return interval === 1 ? `Semanalmente (${days})` : `A cada ${interval} semanas (${days})`;
        }
        return interval === 1 ? 'Semanalmente' : `A cada ${interval} semanas`;

      case 'monthly':
        if (dayOfMonth) {
          return interval === 1 ? `Mensalmente (dia ${dayOfMonth})` : `A cada ${interval} meses (dia ${dayOfMonth})`;
        }
        return interval === 1 ? 'Mensalmente' : `A cada ${interval} meses`;

      case 'yearly':
        return interval === 1 ? 'Anualmente' : `A cada ${interval} anos`;

      default:
        return 'Personalizado';
    }
  };

  // Função para fechar o modal
  const handleClose = () => {
    // Resetar estados do template
    setShowTemplateSelector(!event); // Para novos eventos, mostrar templates na próxima abertura
    setSelectedTemplate(null);
    setRecurrencePattern(null);
    onClose();
  };

  // Função para duplicar evento
  const handleDuplicateEvent = () => {
    if (event) {
      // Duplicar evento existente
      const currentFormData = watch();
      const tomorrow = new Date(currentFormData.startDate);
      tomorrow.setDate(tomorrow.getDate() + 1);

      setValue('startDate', tomorrow.toISOString().split('T')[0]);
      setValue('title', `${currentFormData.title} (Cópia)`);

      showSuccess('Evento duplicado', 'Uma cópia do evento foi criada para amanhã');
    }
  };

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
        eventType: data.eventType,
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
        emailOffline: data.emailOffline,
        isRecurring: data.isRecurring || false,
        recurringPattern: data.recurrencePattern || null,
        category: selectedTemplate?.category || 'meeting',
        color: selectedTemplate?.color || '#3B82F6',
        type: selectedTemplate?.type || 'meeting',
        priority: selectedTemplate?.priority || 'medium'
      };

      await onSave(eventData);

      // Notificação de sucesso (apenas toast para feedback imediato)
      const isEditing = !!event;
      showSuccess(
        isEditing ? 'Evento Atualizado' : 'Evento Criado',
        isEditing
          ? `Evento "${data.title}" foi atualizado com sucesso`
          : `Evento "${data.title}" foi criado para ${new Date(data.startDate).toLocaleDateString('pt-BR')}`
      );

      // Criar lembrete automático se configurado (sem notificação adicional)
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
            active: true
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
      // Notificação de exclusão (apenas toast para feedback imediato)
      showSuccess(
        'Evento Excluído',
        `Evento "${event.title}" foi removido da agenda`
      );

      onDelete(event.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Mostrar seletor de templates primeiro para novos eventos
  if (showTemplateSelector && !event) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Novo Evento
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <EventTemplatesSelector
            onSelectTemplate={handleSelectTemplate}
            onSkip={handleSkipTemplate}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {event ? 'Editar evento' : 'Criar evento'}
            </h2>

            {/* Indicador de template usado */}
            {selectedTemplate && !event && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {selectedTemplate.icon}
                <span>{selectedTemplate.name}</span>
                <button
                  onClick={handleChangeTemplate}
                  className="text-blue-600 hover:text-blue-800 ml-1"
                  title="Alterar template"
                >
                  <Edit className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Indicador de recorrência */}
            {recurrencePattern && (
              <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                <RotateCcw className="w-3 h-3" />
                <span>Recorrente</span>
                <button
                  onClick={handleRemoveRecurrence}
                  className="text-purple-600 hover:text-purple-800 ml-1"
                  title="Remover recorrência"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Status do evento existente */}
            {event && (
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${watch('status') === 'confirmado' ? 'bg-green-100 text-green-800' :
                watch('status') === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                {statusOptions.find(opt => opt.value === watch('status'))?.label || 'Confirmado'}
              </div>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Seleção de template (apenas para novos eventos) */}
        {showTemplateSelector && !event && (
          <div className="p-6 border-b">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Escolha um template
              </h3>
              <p className="text-sm text-gray-600">
                Acelere a criação de eventos usando um template pré-configurado
              </p>
            </div>
            <EventTemplatesSelector
              onSelectTemplate={handleSelectTemplate}
              onSkip={handleSkipTemplate}
            />
          </div>
        )}

        {/* Form em formato paisagem */}
        {!showTemplateSelector && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Coluna Esquerda - Informações Principais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Informações do Evento</h3>

                {/* Linha: Título e Tipo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título *
                    </label>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="text"
                          placeholder="Título do evento"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    />
                    {errors.title && (
                      <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FileText className="w-3 h-3 inline mr-1" />
                      Tipo *
                    </label>
                    <Controller
                      name="eventType"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="reuniao">🤝 Reunião</option>
                          <option value="tarefa">✅ Tarefa</option>
                          <option value="evento">📅 Evento</option>
                          <option value="follow-up">📞 Follow-up</option>
                          <option value="call">☎️ Ligação</option>
                          <option value="demo">🎯 Demo</option>
                        </select>
                      )}
                    />
                    {errors.eventType && (
                      <p className="text-red-500 text-xs mt-1">{errors.eventType.message}</p>
                    )}
                  </div>
                </div>

                {/* Linha: Data e Hora */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data *
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
                    {errors.startDate && (
                      <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora *
                    </label>
                    <Controller
                      name="startTime"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="time"
                          disabled={watch('isAllDay')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      )}
                    />
                    {errors.startTime && (
                      <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duração
                    </label>
                    <Controller
                      name="duration"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={watch('isAllDay')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                          <option value="15">15min</option>
                          <option value="30">30min</option>
                          <option value="45">45min</option>
                          <option value="60">1h</option>
                          <option value="90">1h 30min</option>
                          <option value="120">2h</option>
                          <option value="180">3h</option>
                          <option value="240">4h</option>
                          <option value="480">8h</option>
                          <option value="custom">Personalizar</option>
                        </select>
                      )}
                    />
                  </div>
                </div>

                {/* Linha: Status e Responsável */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="confirmado">✅ Confirmado</option>
                          <option value="pendente">⏳ Pendente</option>
                          <option value="cancelado">❌ Cancelado</option>
                        </select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <UserIcon className="w-3 h-3 inline mr-1" />
                      Responsável *
                    </label>
                    <Controller
                      name="responsavel"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={carregandoUsuarios}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                          {carregandoUsuarios ? (
                            <option value="">Carregando...</option>
                          ) : (
                            <>
                              <option value="">Selecione</option>
                              {usuarios.map((usuario) => {
                                const isCurrentUser = usuarioAtual && (usuario.id === usuarioAtual.id || usuario.email === usuarioAtual.email);
                                return (
                                  <option key={usuario.id} value={usuario.id}>
                                    {usuario.nome} ({usuario.role}){isCurrentUser ? ' - Você' : ''}
                                  </option>
                                );
                              })}
                            </>
                          )}
                        </select>
                      )}
                    />
                    {errors.responsavel && (
                      <p className="text-red-500 text-xs mt-1">{errors.responsavel.message}</p>
                    )}
                  </div>
                </div>

                {/* Local */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    Local
                  </label>
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Local do evento"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  />
                </div>

                {/* Toggle Dia todo */}
                <div className="flex items-center justify-between py-2 px-3 border border-gray-200 rounded-lg bg-gray-50">
                  <label className="text-sm font-medium text-gray-700">
                    📅 Evento de dia inteiro
                  </label>
                  <Controller
                    name="isAllDay"
                    control={control}
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${field.value ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    )}
                  />
                </div>
              </div>

              {/* Coluna Direita - Descrição e Configurações Avançadas */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Detalhes e Configurações</h3>

                {/* Descrição Expandida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📝 Descrição
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={8}
                        placeholder="Descrição detalhada do evento, objetivos, agenda, participantes, materiais necessários, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    )}
                  />
                </div>

                {/* Participantes Compacto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Users className="w-3 h-3 inline mr-1" />
                    Participantes
                  </label>
                  <div className="space-y-2">
                    {participants.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {participants.slice(0, 3).map((participant, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {participant}
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(participant)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {participants.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{participants.length - 3} mais
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newParticipantEmail) {
                            handleAddParticipant(newParticipantEmail);
                            setNewParticipantEmail('');
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lembretes Compacto */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Bell className="w-3 h-3 inline mr-1" />
                      Lembrete
                    </label>
                    <Controller
                      name="reminderTime"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={0}>Sem lembrete</option>
                          <option value={5}>5 minutos antes</option>
                          <option value={10}>10 minutos antes</option>
                          <option value={15}>15 minutos antes</option>
                          <option value={30}>30 minutos antes</option>
                          <option value={60}>1 hora antes</option>
                          <option value={1440}>1 dia antes</option>
                        </select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <Controller
                      name="reminderType"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="notification">🔔 Notificação</option>
                          <option value="email">📧 Email</option>
                          <option value="both">📧🔔 Ambos</option>
                        </select>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="w-4 h-4 inline mr-1" />
                Responsável *
              </label>
              <Controller
                name="responsavel"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={carregandoUsuarios}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {carregandoUsuarios ? (
                      <option value="">Carregando usuários...</option>
                    ) : (
                      <>
                        <option value="">Selecione um responsável</option>
                        {usuarios.map((usuario) => {
                          const isCurrentUser = usuarioAtual && (usuario.id === usuarioAtual.id || usuario.email === usuarioAtual.email);
                          return (
                            <option key={usuario.id} value={usuario.id}>
                              {usuario.nome} ({usuario.role}){isCurrentUser ? ' - Você' : ''}
                            </option>
                          );
                        })}
                      </>
                    )}
                  </select>
                )}
              />
              {errors.responsavel && (
                <p className="text-red-500 text-sm mt-1">{errors.responsavel.message}</p>
              )}
              {carregandoUsuarios && (
                <p className="text-blue-500 text-sm mt-1 flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Carregando lista de usuários...
                </p>
              )}
            </div>

            {/* Configurações do Evento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Toggle Dia todo */}
              <div className="flex items-center justify-between py-3 border border-gray-200 rounded-lg px-4">
                <span className="text-sm text-gray-700">Dia todo</span>
                <Controller
                  name="isAllDay"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${field.value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  )}
                />
              </div>

              {/* Status do Evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status do Evento
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.status && (
                  <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
                )}
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

            {/* Recurrence Section */}
        {isRecurring && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuração de Recorrência
            </label>
            <button
              type="button"
              onClick={() => setIsRecurrenceModalOpen(true)}
              className="flex items-center gap-2 w-full p-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Repeat className="w-4 h-4" />
              <span className="text-sm text-gray-600">
                {recurrencePattern
                  ? `${recurrencePattern.type === 'daily' ? 'Diário' :
                    recurrencePattern.type === 'weekly' ? 'Semanal' :
                      recurrencePattern.type === 'monthly' ? 'Mensal' : 'Anual'}`
                  : 'Configurar Recorrência'
                }
              </span>
            </button>
          </div>
        )}

        {/* Notification Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notificação
          </label>
          <Controller
            name="notificacao"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="nenhuma">Nenhuma</option>
                <option value="email">Email</option>
                <option value="push">Push</option>
                <option value="ambos">Email e Push</option>
              </select>
            )}
          />
        </div>

        {/* Templates Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Usar Modelo
          </label>
          <EventTemplatesSelector
            onSelectTemplate={(template) => {
              setValue('titulo', template.title);
              setValue('descricao', template.description);
              setValue('eventType', template.type);
            }}
          />
        </div>

        {/* Recurrence Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recurrence"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="recurrence" className="text-sm text-gray-700">
            Evento recorrente
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : (event ? 'Atualizar' : 'Criar')}
          </button>
        </div>
      </form>
    </div>
      </div >

  {/* Recurrence Modal */ }
{
  isRecurrenceModalOpen && (
    <RecurrenceModal
      isOpen={isRecurrenceModalOpen}
      onClose={() => setIsRecurrenceModalOpen(false)}
      pattern={recurrencePattern}
      onSave={setRecurrencePattern}
    />
  )
}
    </div >
  );
};
