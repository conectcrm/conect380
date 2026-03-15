import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CalendarEvent } from '../../types/calendar';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import usuariosService from '../../services/usuariosService';
import agendaEventosService from '../../services/agendaEventosService';
import notificationService from '../../services/notificationService';
import { parseLocalDateInputValue, toLocalDateInputValue } from '../../utils/calendarUtils';
import {
  getAgendaEventNotificationId,
  getAgendaReminderId,
} from '../../features/agenda/agendaNotifications';
import {
  X,
  Clock,
  Users,
  Mail,
  Plus,
  Trash2,
  UserCheck,
  FileText,
  Phone,
  Calendar,
  CheckSquare,
  Monitor,
  Search,
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
  onSave: (eventData: any) => Promise<CalendarEvent | void> | CalendarEvent | void;
  onDelete?: (eventId: string) => Promise<void> | void;
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
  const [participantSearch, setParticipantSearch] = useState('');
  const [isParticipantSearchFocused, setIsParticipantSearchFocused] = useState(false);
  const [activeParticipantSearchIndex, setActiveParticipantSearchIndex] = useState(-1);
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string; email: string }[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [usuariosFetchAttempted, setUsuariosFetchAttempted] = useState(false);
  const modalPanelRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const participantsSectionRef = useRef<HTMLDivElement | null>(null);

  // Hook de notificações
  const { addNotification, addReminder, removeReminder, showSuccess, showError, showWarning } =
    useNotifications();

  // Hook de autenticação para obter usuário atual
  const { user: usuarioAtual } = useAuth();

  const hasUsersReadPermission = React.useMemo(() => {
    const permissionSet = new Set<string>();
    const permissionCandidates = [
      ...(Array.isArray((usuarioAtual as any)?.permissions) ? (usuarioAtual as any).permissions : []),
      ...(Array.isArray((usuarioAtual as any)?.permissoes) ? (usuarioAtual as any).permissoes : []),
    ];

    permissionCandidates.forEach((permission) => {
      if (typeof permission === 'string' && permission.trim()) {
        permissionSet.add(permission.trim().toLowerCase());
      }
    });

    return permissionSet.has('users.read');
  }, [usuarioAtual]);

  const isEmailLike = (value?: string | null) => !!value && /@/.test(value);

  const mergeUsuariosFallback = (
    items: Array<{ id?: string | null; nome?: string | null; email?: string | null }>,
  ) => {
    const normalized = items
      .map((item) => ({
        id: (item.id || '').trim(),
        nome: (item.nome || '').trim(),
        email: (item.email || '').trim(),
      }))
      .filter((item) => item.id && item.nome);

    if (normalized.length === 0) return;

    setUsuarios((prev) => {
      const merged = [...prev];
      const indexById = new Map(merged.map((user, index) => [user.id, index]));

      normalized.forEach((item) => {
        const existingIndex = indexById.get(item.id);

        if (existingIndex === undefined) {
          indexById.set(item.id, merged.length);
          merged.push({ id: item.id, nome: item.nome, email: item.email });
          return;
        }

        const existing = merged[existingIndex];
        merged[existingIndex] = {
          ...existing,
          nome: existing.nome || item.nome,
          email: existing.email || item.email,
        };
      });

      return merged;
    });
  };

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

  // Garantir opções mínimas para convidados sem permissão de users.read
  useEffect(() => {
    if (!isOpen) return;

    mergeUsuariosFallback([
      {
        id: usuarioAtual?.id || null,
        nome: usuarioAtual?.nome || 'Usuário atual',
        email: usuarioAtual?.email || null,
      },
      {
        id: event?.responsavelId || null,
        nome: event?.responsavel || null,
        email: isEmailLike(event?.collaborator) ? event?.collaborator : null,
      },
    ]);
  }, [isOpen, usuarioAtual, event?.responsavelId, event?.responsavel, event?.collaborator]);

  // Carregar usuários quando o modal abrir
  useEffect(() => {
    if (!isOpen || loadingUsuarios || usuariosFetchAttempted) return;

    const carregarUsuarios = async () => {
      setLoadingUsuarios(true);
      try {
        const listaUsuarios = hasUsersReadPermission
          ? (
              await usuariosService.listarUsuarios({
                limite: 1000,
              })
            ).usuarios
          : await agendaEventosService.listarParticipantesInternos();

        setUsuarios(
          listaUsuarios.map((user) => ({
            id: user.id,
            nome: user.nome,
            email: user.email,
          })),
        );
        setUsuariosFetchAttempted(true);
      } catch (error) {
        const status = (error as any)?.response?.status;

        if (status === 401 || status === 403) {
          setUsuariosFetchAttempted(true);
          console.warn(
            '[Agenda] Usuário sem permissão para listar participantes no modal; usando fallback local.',
          );
        } else {
          console.error('Erro ao carregar usuários:', error);
          showError(
            'Erro ao carregar lista de usuários',
            'Não foi possível carregar os usuários disponíveis',
          );
        }
      } finally {
        setLoadingUsuarios(false);
      }
    };

    carregarUsuarios();
  }, [isOpen, loadingUsuarios, usuariosFetchAttempted, hasUsersReadPermission, showError]);

  useEffect(() => {
    if (!isOpen) return;

    const activeElement = document.activeElement;
    previousFocusedElementRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;

    const focusTimer = window.setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select?.();
        return;
      }

      modalPanelRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      previousFocusedElementRef.current?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !modalPanelRef.current) return;

    const panel = modalPanelRef.current;

    const getFocusableElements = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => {
        if (element.getAttribute('aria-hidden') === 'true') return false;
        if (element.tabIndex < 0) return false;
        return !element.hasAttribute('disabled');
      });

    const handlePanelKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (!panel.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    panel.addEventListener('keydown', handlePanelKeyDown);

    return () => {
      panel.removeEventListener('keydown', handlePanelKeyDown);
    };
  }, [isOpen]);

  // Inicializar dados quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setParticipantSearch('');
      setIsParticipantSearchFocused(false);
      setShowAddParticipant(false);
      setActiveParticipantSearchIndex(-1);

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

        const visibleParticipants = sanitizeVisibleParticipants(event.attendees);

        reset({
          title: event.title,
          eventType: mapCalendarTypeToModalType(event.type),
          responsavel: event.responsavelId || usuarioAtual?.id || '',
          isAllDay: event.allDay || false,
          startDate: toLocalDateInputValue(startDate),
          startTime: startDate.toTimeString().slice(0, 5),
          duration: durationValue,
          customDurationHours: customHours,
          customDurationMinutes: customMinutes,
          locationType: event.locationType || 'presencial',
          location: event.location || '',
          description: event.description || '',
          status: event.status || 'pending',
          reminderTime: event.reminderTime ?? 10,
          reminderType: event.reminderType || 'notification',
          emailOffline: !!event.emailOffline,
          participants: visibleParticipants,
          attachments: event.attachments || [],
        });

        setParticipants(visibleParticipants);
        setAttachments(event.attachments || []);
      } else {
        // Novo evento
        const defaultDate = selectedDate || new Date();
        const dateStr = toLocalDateInputValue(defaultDate);

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
        setAttachments([]);
      }
    }
  }, [isOpen, event, selectedDate, reset]);

  useEffect(() => {
    if (!isParticipantSearchFocused || loadingUsuarios) {
      setActiveParticipantSearchIndex(-1);
      return;
    }

    const normalizedSearch = participantSearch.trim().toLowerCase();
    const availableUsersCount = usuarios.filter(
      (usuario) =>
        !!usuario.email &&
        !participants.some(
          (participant) => participant.toLowerCase() === usuario.email.toLowerCase(),
        ) &&
        (normalizedSearch.length === 0 ||
          usuario.nome.toLowerCase().includes(normalizedSearch) ||
          usuario.email.toLowerCase().includes(normalizedSearch)),
    ).length;

    const visibleOptionsCount = Math.min(availableUsersCount, 8);

    if (visibleOptionsCount === 0) {
      setActiveParticipantSearchIndex(-1);
      return;
    }

    setActiveParticipantSearchIndex((prev) => {
      if (prev >= 0 && prev < visibleOptionsCount) return prev;
      return 0;
    });
  }, [isParticipantSearchFocused, loadingUsuarios, participantSearch, usuarios, participants]);

  const formatEventDateLabel = (date: Date, allDay?: boolean) => {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'data indefinida';

    return allDay
      ? parsedDate.toLocaleDateString('pt-BR')
      : parsedDate.toLocaleString('pt-BR');
  };

  const mirrorBackendNotificationToContext = (
    backendNotification: {
      id: string;
      title: string;
      message: string;
      read: boolean;
      createdAt: string;
    },
    options: {
      type: 'success' | 'error' | 'warning' | 'info' | 'reminder';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      entityId?: string;
    },
  ) => {
    addNotification({
      id: backendNotification.id,
      type: options.type,
      title: backendNotification.title,
      message: backendNotification.message,
      read: backendNotification.read,
      timestamp: new Date(backendNotification.createdAt),
      priority: options.priority || 'medium',
      entityType: 'agenda',
      entityId: options.entityId,
      silent: true,
    });
  };

  const createAgendaLifecycleBackendNotification = async (params: {
    action: 'created' | 'updated' | 'cancelled' | 'deleted';
    eventId: string;
    eventTitle: string;
    eventStart?: Date;
    eventEnd?: Date;
    allDay?: boolean;
    location?: string;
    status?: string;
    eventType?: string;
    responsavelId?: string;
    attendeesCount?: number;
  }) => {
    if (!usuarioAtual?.id) return false;

    const configs = {
      created: {
        title: 'Evento criado na agenda',
        message: `Evento "${params.eventTitle}" foi criado para ${formatEventDateLabel(
          params.eventStart || new Date(),
          params.allDay,
        )}${params.location ? ` (${params.location})` : ''}.`,
        type: 'success' as const,
        priority: 'medium' as const,
      },
      updated: {
        title: 'Evento atualizado na agenda',
        message: `Evento "${params.eventTitle}" foi atualizado${
          params.location ? ` (${params.location})` : ''
        }.`,
        type: 'info' as const,
        priority: 'medium' as const,
      },
      cancelled: {
        title: 'Evento cancelado na agenda',
        message: `Evento "${params.eventTitle}" foi marcado como cancelado.`,
        type: 'warning' as const,
        priority: 'high' as const,
      },
      deleted: {
        title: 'Evento removido da agenda',
        message: `Evento "${params.eventTitle}" foi removido da agenda.`,
        type: 'warning' as const,
        priority: 'medium' as const,
      },
    } as const;

    const config = configs[params.action];

    try {
      const backendNotification = await notificationService.criar({
        userId: usuarioAtual.id,
        type: 'SISTEMA',
        title: config.title,
        message: config.message,
        data: {
          modulo: 'agenda',
          action: params.action,
          eventId: params.eventId,
          eventTitle: params.eventTitle,
          eventStart: params.eventStart ? new Date(params.eventStart).toISOString() : null,
          eventEnd: params.eventEnd ? new Date(params.eventEnd).toISOString() : null,
          allDay: !!params.allDay,
          location: params.location || null,
          status: params.status || null,
          eventType: params.eventType || null,
          responsavelId: params.responsavelId || null,
          attendeesCount: params.attendeesCount ?? 0,
        },
      });

      mirrorBackendNotificationToContext(backendNotification, {
        type: config.type,
        priority: config.priority,
        entityId: params.eventId,
      });

      return true;
    } catch (notificationError) {
      console.warn('Falha ao registrar notificação de agenda no backend:', notificationError);
      return false;
    }
  };

  const resolveInternalParticipantsByEmails = (emails: string[]) => {
    const seenEmails = new Set<string>();

    return emails
      .map((email) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || seenEmails.has(normalizedEmail)) return null;
        seenEmails.add(normalizedEmail);

        return usuarios.find((usuario) => usuario.email.toLowerCase() === normalizedEmail) || null;
      })
      .filter(
        (
          usuario,
        ): usuario is {
          id: string;
          nome: string;
          email: string;
        } => !!usuario && usuario.id !== usuarioAtual?.id,
      );
  };

  const notifyInternalAgendaParticipants = async (params: {
    users: { id: string; nome: string; email: string }[];
    action: 'updated' | 'cancelled' | 'deleted';
    eventId: string;
    eventTitle: string;
    eventStart: Date;
    allDay?: boolean;
    location?: string;
  }) => {
    if (!params.users.length) {
      return { attempted: 0, failed: 0 };
    }

    const actorName = usuarioAtual?.nome || 'Um usuário';
    const actionConfig = {
      updated: {
        title: 'Evento atualizado na agenda',
        message: `${actorName} atualizou o evento "${params.eventTitle}" (${formatEventDateLabel(
          params.eventStart,
          params.allDay,
        )})${params.location ? ` - ${params.location}` : ''}.`,
      },
      cancelled: {
        title: 'Evento cancelado na agenda',
        message: `${actorName} cancelou o evento "${params.eventTitle}"${
          params.location ? ` (${params.location})` : ''
        }.`,
      },
      deleted: {
        title: 'Evento removido da agenda',
        message: `${actorName} removeu o evento "${params.eventTitle}" da agenda.`,
      },
    } as const;

    const config = actionConfig[params.action];

    const results = await Promise.allSettled(
      params.users.map((usuario) =>
        notificationService.criar({
          userId: usuario.id,
          type: 'SISTEMA',
          title: config.title,
          message: config.message,
          data: {
            modulo: 'agenda',
            action: params.action,
            eventId: params.eventId,
            eventTitle: params.eventTitle,
            eventStart: new Date(params.eventStart).toISOString(),
            allDay: !!params.allDay,
            location: params.location || null,
            actorUserId: usuarioAtual?.id || null,
            actorName,
          },
        }),
      ),
    );

    return {
      attempted: results.length,
      failed: results.filter((result) => result.status === 'rejected').length,
    };
  };

  const sanitizeVisibleParticipants = (emails?: string[] | null) => {
    const currentUserEmail = usuarioAtual?.email?.trim().toLowerCase();
    const unique = new Set<string>();

    return (emails || []).filter((email) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) return false;
      if (currentUserEmail && normalizedEmail === currentUserEmail) return false;
      if (unique.has(normalizedEmail)) return false;
      unique.add(normalizedEmail);
      return true;
    });
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      let endDate: Date;

      if (data.isAllDay) {
        endDate = parseLocalDateInputValue(data.startDate);
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

      const persistedAttendees = Array.from(
        new Set(
          [
            ...participants.map((email) => email.trim().toLowerCase()),
            usuarioAtual?.email?.trim().toLowerCase(),
          ].filter((email): email is string => !!email),
        ),
      );

      const eventData = {
        title: data.title,
        eventType: data.eventType,
        responsavel: responsavelUsuario?.nome || data.responsavel,
        responsavelId: data.responsavel,
        allDay: data.isAllDay,
        start: data.isAllDay
          ? parseLocalDateInputValue(data.startDate)
          : new Date(`${data.startDate}T${data.startTime}`),
        end: endDate,
        locationType: data.locationType,
        location: data.location || '',
        description: data.description || '',
        status: data.status,
        attendees: persistedAttendees,
        reminderTime: data.reminderTime,
        reminderType: data.reminderType,
        emailOffline: data.emailOffline,
        attachments,
      };

      const savedEvent = (await onSave(eventData)) as CalendarEvent | undefined;
      const resolvedEventId =
        savedEvent?.id || event?.id || `agenda-temp-${eventData.start.getTime()}`;
      const reminderId = getAgendaReminderId(resolvedEventId);
      const isEditing = !!event;

      const previousParticipantEmails = new Set(
        (event?.attendees || []).map((email) => email.trim().toLowerCase()),
      );
      const participantEmailsToNotify = participants.filter((email) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) return false;
        if (isEditing && previousParticipantEmails.has(normalizedEmail)) return false;
        return true;
      });

      const internalParticipantUsers = participantEmailsToNotify
        .map((email) =>
          usuarios.find((usuario) => usuario.email.toLowerCase() === email.trim().toLowerCase()),
        )
        .filter(
          (
            usuario,
          ): usuario is {
            id: string;
            nome: string;
            email: string;
          } => !!usuario && usuario.id !== usuarioAtual?.id,
        );

      if (internalParticipantUsers.length > 0) {
        const actorName = usuarioAtual?.nome || 'Um usuário';
        const inviteTitle = isEditing ? 'Voce foi adicionado a um evento' : 'Novo convite na agenda';
        const inviteMessage = `${actorName} ${
          isEditing ? 'adicionou voce ao evento' : 'convidou voce para o evento'
        } "${data.title}"${
          data.isAllDay
            ? ` em ${parseLocalDateInputValue(data.startDate).toLocaleDateString('pt-BR')}`
            : ` em ${new Date(eventData.start).toLocaleString('pt-BR')}`
        }${data.location ? ` (${data.location})` : ''}.`;

        const inviteResults = await Promise.allSettled(
          internalParticipantUsers.map((usuario) =>
            notificationService.criar({
              userId: usuario.id,
              type: 'SISTEMA',
              title: inviteTitle,
              message: inviteMessage,
              data: {
                modulo: 'agenda',
                eventId: resolvedEventId,
                eventTitle: data.title,
                eventStart: eventData.start.toISOString(),
                allDay: !!data.isAllDay,
                location: data.location || null,
                invitedByUserId: usuarioAtual?.id || null,
                invitedByName: actorName,
              },
            }),
          ),
        );

        const failedInvites = inviteResults.filter((result) => result.status === 'rejected').length;
        if (failedInvites > 0) {
          showWarning(
            'Convites internos parciais',
            `Evento salvo, mas ${failedInvites} notificações para usuários internos não foram enviadas.`,
          );
        }
      }

      // Notificacao de sucesso
      showSuccess(
        isEditing ? 'Evento Atualizado' : 'Evento Criado',
        isEditing
          ? `Evento "${data.title}" foi atualizado com sucesso`
          : `Evento "${data.title}" foi criado para ${
              data.isAllDay
                ? parseLocalDateInputValue(data.startDate).toLocaleDateString('pt-BR')
                : new Date(eventData.start).toLocaleDateString('pt-BR')
            }`,
      );

      const lifecycleAction =
        isEditing && data.status === 'cancelled'
          ? 'cancelled'
          : isEditing
            ? 'updated'
            : 'created';

      const lifecycleNotificationSaved = await createAgendaLifecycleBackendNotification({
        action: lifecycleAction,
        eventId: resolvedEventId,
        eventTitle: data.title,
        eventStart: eventData.start,
        eventEnd: eventData.end,
        allDay: data.isAllDay,
        location: data.location || '',
        status: data.status,
        eventType: data.eventType,
        responsavelId: data.responsavel,
        attendeesCount: participants.length,
      });

      if (!lifecycleNotificationSaved) {
        addNotification({
          id: getAgendaEventNotificationId(lifecycleAction, resolvedEventId),
          title:
            lifecycleAction === 'created'
              ? 'Evento criado'
              : lifecycleAction === 'cancelled'
                ? 'Evento cancelado'
                : 'Evento atualizado',
          message:
            lifecycleAction === 'created'
              ? `Evento "${data.title}" agendado para ${formatEventDateLabel(eventData.start, data.isAllDay)}`
              : lifecycleAction === 'cancelled'
                ? `Evento "${data.title}" foi marcado como cancelado`
                : `Evento "${data.title}" foi modificado`,
          type: lifecycleAction === 'cancelled' ? 'warning' : 'success',
          priority: lifecycleAction === 'cancelled' ? 'high' : 'medium',
          entityType: 'agenda',
          entityId: resolvedEventId,
        });
      }

      if (isEditing && (lifecycleAction === 'updated' || lifecycleAction === 'cancelled')) {
        const newParticipantEmailsSet = new Set(
          participantEmailsToNotify.map((email) => email.trim().toLowerCase()),
        );
        const participantEmailsForChangeNotification = participants.filter((email) => {
          const normalizedEmail = email.trim().toLowerCase();
          if (!normalizedEmail) return false;
          return !newParticipantEmailsSet.has(normalizedEmail);
        });

        const internalParticipantsToNotify = resolveInternalParticipantsByEmails(
          participantEmailsForChangeNotification,
        );

        const participantChangeNotificationResult = await notifyInternalAgendaParticipants({
          users: internalParticipantsToNotify,
          action: lifecycleAction,
          eventId: resolvedEventId,
          eventTitle: data.title,
          eventStart: eventData.start,
          allDay: data.isAllDay,
          location: data.location || '',
        });

        if (participantChangeNotificationResult.failed > 0) {
          showWarning(
            'Atualização de participantes parcial',
            `Evento salvo, mas ${participantChangeNotificationResult.failed} notificações de ${lifecycleAction === 'cancelled' ? 'cancelamento' : 'atualização'} não foram enviadas aos participantes internos.`,
          );
        }
      }

      // Notificação específica sobre participantes
      if (participants.length > 0) {
        addNotification({
          id: getAgendaEventNotificationId('participants', resolvedEventId),
          title: '\u{1F465} Participantes Convidados',
          message: `${participants.length} participante(s) foram convidados para o evento`,
          type: 'info',
          priority: 'low',
          entityType: 'agenda',
          entityId: resolvedEventId,
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
            id: reminderId,
            title: `\u{1F514} Lembrete: ${data.title}`,
            message: `Evento em ${data.reminderTime} minutos${data.location ? ` - Local: ${data.location}` : ''}`,
            entityType: 'agenda',
            entityId: resolvedEventId,
            scheduledFor: reminderDateTime,
            active: true,
          });

          // Notificação sobre o lembrete criado
          addNotification({
            id: getAgendaEventNotificationId('reminder-configured', resolvedEventId),
            title: '⏰ Lembrete Configurado',
            message: `Você será lembrado ${data.reminderTime} minutos antes do evento`,
            type: 'info',
            priority: 'low',
            entityType: 'agenda',
            entityId: resolvedEventId,
          });
        }
      } else {
        removeReminder(reminderId);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      showError('Erro ao Salvar', 'Não foi possível salvar o evento. Tente novamente.');
    }
  };

  const handleAddParticipant = (email: string) => {
    const sanitizedEmail = email.trim().toLowerCase();
    const alreadyExists = participants.some(
      (participant) => participant.toLowerCase() === sanitizedEmail,
    );

    if (sanitizedEmail && !alreadyExists) {
      // Validação básica de e-mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        showError('E-mail inválido', 'Por favor, insira um e-mail válido');
        return;
      }

      setParticipants([...participants, sanitizedEmail]);
      setNewParticipantEmail('');
      setShowAddParticipant(false);

      showSuccess('Participante Adicionado', `${sanitizedEmail} foi adicionado ao evento`);
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

  const handleDelete = async () => {
    if (event && onDelete) {
      try {
        await onDelete(event.id);

        // Notificacao de exclusao
        showSuccess('Evento Exclu?do', `Evento "${event.title}" foi removido da agenda`);

        const deleteNotificationSaved = await createAgendaLifecycleBackendNotification({
          action: 'deleted',
          eventId: event.id,
          eventTitle: event.title,
          eventStart: event.start,
          eventEnd: event.end,
          allDay: event.allDay,
          location: event.location || '',
          status: event.status,
          eventType: event.type,
          responsavelId: event.responsavelId,
          attendeesCount: event.attendees?.length || 0,
        });

        if (!deleteNotificationSaved) {
          addNotification({
            id: getAgendaEventNotificationId('deleted', event.id),
            title: 'Evento Exclu?do',
            message: `Evento "${event.title}" foi removido da agenda`,
            type: 'warning',
            priority: 'medium',
            entityType: 'agenda',
            entityId: event.id,
          });
        }

        const internalParticipantsToNotify = resolveInternalParticipantsByEmails(event.attendees || []);
        const participantDeleteNotificationResult = await notifyInternalAgendaParticipants({
          users: internalParticipantsToNotify,
          action: 'deleted',
          eventId: event.id,
          eventTitle: event.title,
          eventStart: event.start,
          allDay: event.allDay,
          location: event.location || '',
        });

        if (participantDeleteNotificationResult.failed > 0) {
          showWarning(
            'Cancelamento de notificações parcial',
            `Evento removido, mas ${participantDeleteNotificationResult.failed} notificações para participantes internos não foram enviadas.`,
          );
        }

        onClose();
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        showError('Erro ao Excluir', 'Não foi possível excluir o evento. Tente novamente.');
      }
    }
  };
  if (!isOpen) return null;

  const selectedEventType = watch('eventType');
  const selectedStatus = watch('status');
  const selectedStartDate = watch('startDate');
  const selectedStartTime = watch('startTime');

  const eventTypeLabelMap: Record<string, string> = {
    reuniao: 'Reunião',
    ligacao: 'Ligação',
    tarefa: 'Tarefa',
    evento: 'Evento',
    'follow-up': 'Follow-up',
  };

  const statusLabelMap: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
  };

  const attendeeRsvpLabelMap: Record<'pending' | 'confirmed' | 'declined', string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    declined: 'Não vou',
  };

  const attendeeRsvpClassMap: Record<'pending' | 'confirmed' | 'declined', string> = {
    pending: 'border-yellow-200 bg-yellow-50 text-yellow-700',
    confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    declined: 'border-rose-200 bg-rose-50 text-rose-700',
  };

  const headerDateLabel = selectedStartDate
    ? new Intl.DateTimeFormat('pt-BR').format(new Date(`${selectedStartDate}T00:00:00`))
    : 'Sem data';
  const headerTimeLabel = isAllDay ? 'Dia todo' : selectedStartTime || 'Sem horário';
  const availableParticipantUsers = usuarios.filter(
    (usuario) =>
      !!usuario.email &&
      !participants.some((participant) => participant.toLowerCase() === usuario.email.toLowerCase()),
  );
  const normalizedParticipantSearch = participantSearch.trim().toLowerCase();
  const filteredParticipantUsers = availableParticipantUsers
    .filter((usuario) => {
      if (!normalizedParticipantSearch) return true;
      return (
        usuario.nome.toLowerCase().includes(normalizedParticipantSearch) ||
        usuario.email.toLowerCase().includes(normalizedParticipantSearch)
      );
    })
    .slice(0, 8);
  const isParticipantSearchDropdownOpen = isParticipantSearchFocused && !loadingUsuarios;
  const participantSearchListboxId = 'agenda-participant-search-results';
  const participantSearchStatusId = 'agenda-participant-search-status';
  const participantSearchHelpId = 'agenda-participant-search-help';
  const participantSearchTermLabel = participantSearch.trim();
  const participantSearchAnnouncement = loadingUsuarios
    ? 'Carregando usuários para seleção de participantes.'
    : availableParticipantUsers.length === 0
      ? 'Nenhum usuário disponível para adicionar como participante.'
      : normalizedParticipantSearch && filteredParticipantUsers.length === 0
        ? `Nenhum usuário encontrado para ${participantSearchTermLabel}.`
        : normalizedParticipantSearch
          ? `${filteredParticipantUsers.length} resultado(s) para ${participantSearchTermLabel}. Use seta para cima e para baixo para navegar e Enter para adicionar.`
          : `${Math.min(filteredParticipantUsers.length, 8)} participante(s) em exibição. Digite para filtrar a lista.`;

  const handleSelectParticipantUser = (email: string) => {
    handleAddParticipant(email);
    setParticipantSearch('');
    setIsParticipantSearchFocused(false);
    setActiveParticipantSearchIndex(-1);
  };

  const handleParticipantSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (loadingUsuarios) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsParticipantSearchFocused(false);
      setActiveParticipantSearchIndex(-1);
      return;
    }

    if (filteredParticipantUsers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsParticipantSearchFocused(true);
      setActiveParticipantSearchIndex((prev) =>
        prev < 0 || prev >= filteredParticipantUsers.length - 1 ? 0 : prev + 1,
      );
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsParticipantSearchFocused(true);
      setActiveParticipantSearchIndex((prev) =>
        prev <= 0 ? filteredParticipantUsers.length - 1 : prev - 1,
      );
      return;
    }

    if (e.key === 'Enter' && isParticipantSearchDropdownOpen && activeParticipantSearchIndex >= 0) {
      e.preventDefault();
      const activeUser = filteredParticipantUsers[activeParticipantSearchIndex];
      if (activeUser) {
        handleSelectParticipantUser(activeUser.email);
      }
    }
  };

  const handleFocusParticipantsSection = () => {
    participantsSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const getParticipantUserByEmail = (email: string) =>
    usuarios.find((usuario) => usuario.email.toLowerCase() === email.toLowerCase());

  const getParticipantMeta = (email: string) => {
    const usuario = getParticipantUserByEmail(email);
    const displayName = usuario?.nome?.trim() || email;
    const avatarLabel = usuario?.nome
      ? usuario.nome
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part.charAt(0).toUpperCase())
          .join('')
      : email.charAt(0).toUpperCase();

    return {
      email,
      displayName,
      avatarLabel: avatarLabel || email.charAt(0).toUpperCase(),
    };
  };

  const participantDisplayNames = participants.map((email) => getParticipantMeta(email).displayName);
  const participantRsvpEntries = participants.map((email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const response = (event?.attendeeResponses?.[normalizedEmail] ?? 'pending') as
      | 'pending'
      | 'confirmed'
      | 'declined';

    return {
      email,
      response,
      meta: getParticipantMeta(email),
    };
  });

  const participantRsvpCounts = participantRsvpEntries.reduce(
    (acc, entry) => {
      if (entry.response === 'confirmed') acc.confirmed += 1;
      else if (entry.response === 'declined') acc.declined += 1;
      else acc.pending += 1;
      return acc;
    },
    { confirmed: 0, declined: 0, pending: 0 },
  );

  const showParticipantRsvpSection = !!event && participantRsvpEntries.length > 0;

  return (
    <div
      className="fixed inset-0 z-[70] bg-[#002333]/55 backdrop-blur-[2px] p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={modalPanelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agenda-event-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="mx-auto flex h-full max-h-[96vh] w-full max-w-[1320px] flex-col overflow-hidden rounded-2xl border border-[#DEEFE7] bg-white shadow-[0_24px_80px_rgba(0,35,51,0.28)]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-[#DEEFE7] bg-white/95 px-4 py-3 backdrop-blur sm:px-5 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#159A9C]/12 text-[#159A9C]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="agenda-event-modal-title"
                    className="truncate text-base font-semibold text-[#002333] sm:text-lg"
                  >
                    {event ? 'Editar evento' : 'Criar evento'}
                  </h2>
                  <p className="text-xs text-[#5B7483] sm:text-sm">
                    Organize detalhes, horário e participantes em um único fluxo.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-[#DEEFE7] bg-[#F4FBF9] px-2.5 py-1 text-xs font-medium text-[#0F7B7D]">
                  {eventTypeLabelMap[selectedEventType || 'reuniao'] || 'Evento'}
                </span>
                <span className="inline-flex items-center rounded-full border border-[#DEEFE7] bg-white px-2.5 py-1 text-xs font-medium text-[#5B7483]">
                  {headerDateLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-[#DEEFE7] bg-white px-2.5 py-1 text-xs font-medium text-[#5B7483]">
                  {headerTimeLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-[#DEEFE7] bg-white px-2.5 py-1 text-xs font-medium text-[#5B7483]">
                  {statusLabelMap[selectedStatus || 'pending'] || 'Pendente'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar modal"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DEEFE7] text-[#5B7483] transition-colors hover:bg-[#F4FBF9] hover:text-[#002333]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form em formato paisagem */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12 xl:items-start">
            {/* Coluna 1 - Informações Básicas */}
            <div className="space-y-4 rounded-2xl border border-[#DEEFE7] bg-[#FBFDFC] p-4 sm:p-5 lg:col-span-1 xl:col-span-5">
              <h3 className="text-sm font-semibold text-[#002333] border-b border-[#DEEFE7] pb-2">
                Informações Básicas
              </h3>

              {/* Título */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">Título *</label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      ref={(element) => {
                        field.ref(element);
                        titleInputRef.current = element;
                      }}
                      type="text"
                      placeholder="Adicionar título"
                      className="w-full rounded-xl border border-[#C8D6DE] bg-white px-3 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-red-600 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Tipo de Evento */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">
                  Tipo de Evento *
                </label>
                <Controller
                  name="eventType"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => field.onChange('reuniao')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                          field.value === 'reuniao'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span className="text-xs font-medium">Reunião</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('ligacao')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                          field.value === 'ligacao'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                        }`}
                      >
                        <Phone className="w-3 h-3" />
                        <span className="text-xs font-medium">Ligação</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('tarefa')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                          field.value === 'tarefa'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                        }`}
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span className="text-xs font-medium">Tarefa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('evento')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                          field.value === 'evento'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                        }`}
                      >
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs font-medium">Evento</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('follow-up')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                          field.value === 'follow-up'
                            ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                            : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        <span className="text-xs font-medium">Follow-up</span>
                      </button>
                    </div>
                  )}
                />
                {errors.eventType && (
                  <p className="text-red-600 text-sm mt-1">{errors.eventType.message}</p>
                )}
              </div>

              {/* Responsável */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">
                  Responsável *
                </label>
                <Controller
                  name="responsavel"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full rounded-xl border border-[#C8D6DE] bg-white px-3 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
                      disabled={loadingUsuarios}
                    >
                      {loadingUsuarios ? (
                        <option value="">Carregando usuários...</option>
                      ) : (
                        <>
                          <option value="">Selecionar responsável</option>
                          {usuarios.map((usuario) => (
                            <option key={usuario.id} value={usuario.id}>
                              {usuario.email ? `${usuario.nome} (${usuario.email})` : usuario.nome}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                />
                {errors.responsavel && (
                  <p className="text-red-600 text-xs mt-1">{errors.responsavel.message}</p>
                )}
              </div>

              {/* Status do Evento */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">
                  Status do Evento *
                </label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => field.onChange('pending')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                          field.value === 'pending'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-medium">Pendente</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('confirmed')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                          field.value === 'confirmed'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                        }`}
                      >
                        <CheckSquare className="w-3 h-3" />
                        <span className="text-xs font-medium">Confirmado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange('cancelled')}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                          field.value === 'cancelled'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                        }`}
                      >
                        <X className="w-3 h-3" />
                        <span className="text-xs font-medium">Cancelado</span>
                      </button>
                    </div>
                  )}
                />
                {errors.status && (
                  <p className="text-red-600 text-xs mt-1">{errors.status.message}</p>
                )}
              </div>

              {/* Localização */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">Local *</label>

                {/* Tipo de Local */}
                <div className="mb-2">
                  <Controller
                    name="locationType"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => field.onChange('presencial')}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                            field.value === 'presencial'
                              ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                              : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                          }`}
                        >
                          <MapPinIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">Presencial</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange('virtual')}
                          className={`flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-medium transition-colors ${
                            field.value === 'virtual'
                              ? 'border-[#159A9C] bg-[#159A9C]/10 text-[#159A9C]'
                              : 'border-[#C8D6DE] bg-white text-[#4A6473] hover:bg-[#F8FAFC] hover:text-[#002333]'
                          }`}
                        >
                          <Monitor className="w-3 h-3" />
                          <span className="text-xs font-medium">Virtual</span>
                        </button>
                      </div>
                    )}
                  />
                  {errors.locationType && (
                    <p className="text-red-600 text-xs mt-1">{errors.locationType.message}</p>
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
                        : 'Endere?o ou nome do local';

                    return (
                      <input
                        {...field}
                        type="text"
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-[#C8D6DE] bg-white px-3 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
                      />
                    );
                  }}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">Descrição</label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                        rows={6}
                      placeholder="Adicionar descrição do evento..."
                      className="min-h-[148px] w-full rounded-xl border border-[#C8D6DE] bg-white px-3 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15 resize-y"
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-red-600 text-xs mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>

            {/* Coluna 2 - Data e Horário */}
            <div className="space-y-4 rounded-2xl border border-[#DEEFE7] bg-white p-4 sm:p-5 lg:col-span-1 xl:col-span-4">
              <h3 className="text-sm font-semibold text-[#002333] border-b border-[#DEEFE7] pb-2">Data e Horário</h3>

              {/* Data do evento e toggle dia todo */}
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">
                    Data do evento *
                  </label>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="date"
                        className="w-full rounded-xl border border-[#C8D6DE] bg-white px-3 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
                      />
                    )}
                  />
                </div>
                <label
                  htmlFor="isAllDay"
                  className="mb-0.5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#DEEFE7] bg-[#F8FAFC] px-3 py-2"
                >
                  <Controller
                    name="isAllDay"
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        id="isAllDay"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-[#C8D6DE] text-[#159A9C] focus:ring-[#159A9C]"
                      />
                    )}
                  />
                  <span className="whitespace-nowrap text-xs font-medium text-[#4A6473]">
                    O dia todo
                  </span>
                </label>
              </div>

              {/* Horário e Duração */}
              {!isAllDay && (
                <div className="grid grid-cols-2 gap-2">
                  {/* Horário de início */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">
                      Horário de início *
                    </label>
                    <Controller
                      name="startTime"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type="time"
                          className="w-full rounded-xl border border-[#C8D6DE] bg-white px-3 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
                        />
                      )}
                    />
                  </div>

                  {/* Duração */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">Duração</label>
                    <Controller
                      name="duration"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full rounded-xl border border-[#C8D6DE] bg-white px-3 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
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
                  <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">
                    Duração personalizada
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
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
                          className="w-20 rounded-xl border border-[#C8D6DE] bg-white px-2.5 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
                        />
                      )}
                    />
                    <span className="inline-flex items-center rounded-md bg-[#F4FBF9] px-2 py-1 text-xs font-medium text-[#4A6473]">
                      h
                    </span>
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
                          className="w-20 rounded-xl border border-[#C8D6DE] bg-white px-2.5 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
                        />
                      )}
                    />
                    <span className="inline-flex items-center rounded-md bg-[#F4FBF9] px-2 py-1 text-xs font-medium text-[#4A6473]">
                      min
                    </span>
                  </div>
                </div>
              )}

              {/* Exibir horário de término calculado */}
              {!isAllDay && watch('startTime') && watch('duration') && (
                <div className="rounded-xl border border-[#BDE5DE] bg-[#F4FBF9] p-3">
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
                <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">Lembrete</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Controller
                      name="reminderType"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="flex-1 rounded-xl border border-[#C8D6DE] bg-white px-3 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
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
                          className="w-20 rounded-xl border border-[#C8D6DE] bg-white px-2.5 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
                        />
                      )}
                    />

                    <span className="text-xs font-medium text-[#5B7483]">min antes</span>
                  </div>

                  <label className="inline-flex items-center gap-2 rounded-xl border border-[#DEEFE7] bg-[#F8FAFC] px-3 py-2">
                    <Controller
                      name="emailOffline"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-[#C8D6DE] text-[#159A9C] focus:ring-[#159A9C]"
                        />
                      )}
                    />
                    <span className="flex items-center text-xs font-medium text-[#4A6473]">
                      <Mail className="mr-1 h-3 w-3" />
                      E-mail se offline
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Coluna 3 - Participantes e Aҧҵes */}
            <div
              ref={participantsSectionRef}
              className="space-y-4 rounded-2xl border border-[#DEEFE7] bg-white p-4 sm:p-5 lg:col-span-2 xl:col-span-3 xl:sticky xl:top-4"
            >
              <h3 className="text-sm font-semibold text-[#002333] border-b border-[#DEEFE7] pb-2">Participantes</h3>

              {/* Participantes */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#4A6473]">
                  Participantes
                </label>

                {/* Lista de participantes adicionados */}
                {participants.length > 0 && (
                  <div className="mb-2 rounded-xl border border-[#DEEFE7] bg-[#F8FAFC] p-2">
                    <div className="flex flex-wrap gap-1.5">
                      {participants.map((email, index) => {
                        const participantMeta = getParticipantMeta(email);

                        return (
                        <div key={index} className="relative group">
                          {/* Avatar com tooltip */}
                          <div className="w-8 h-8 bg-[#159A9C] rounded-full flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:bg-[#0F7B7D] transition-colors relative">
                            {participantMeta.avatarLabel}

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
                            {participantMeta.displayName}
                            {participantMeta.displayName !== participantMeta.email && (
                              <span className="ml-1 text-white/80">({participantMeta.email})</span>
                            )}
                            {/* Seta do tooltip */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                        );
                      })}

                      {/* Contador de participantes */}
                      <div className="ml-1 flex items-center text-xs text-[#5B7483]">
                        <Users className="w-3 h-3 mr-1" />
                        {participants.length} participante{participants.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                )}

                {showParticipantRsvpSection && (
                  <div className="mb-3 rounded-xl border border-[#DEEFE7] bg-white p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#6A8795]">
                        Respostas dos participantes
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Confirmados {participantRsvpCounts.confirmed}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                          Não vão {participantRsvpCounts.declined}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-700">
                          Pendentes {participantRsvpCounts.pending}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {participantRsvpEntries.map((entry) => (
                        <div
                          key={`participant-rsvp-${entry.email}`}
                          className="flex flex-col gap-1 rounded-lg border border-[#E5EEF2] bg-[#FBFDFE] px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 text-xs font-medium text-[#355061]" title={entry.meta.email}>
                            <span className="block truncate">{entry.meta.displayName}</span>
                            {entry.meta.displayName !== entry.meta.email && (
                              <span className="block truncate text-[11px] text-[#6A8795]">{entry.meta.email}</span>
                            )}
                          </div>
                          <span
                            className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${attendeeRsvpClassMap[entry.response]}`}
                          >
                            {attendeeRsvpLabelMap[entry.response]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulário de adicionar participante */}
                {showAddParticipant ? (
                  <div className="mb-2 space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                        onKeyPress={handleKeyPressParticipant}
                        list="agenda-participants-suggestions"
                        placeholder="email@exemplo.com"
                        className="flex-1 rounded-xl border border-[#C8D6DE] bg-white px-3 py-2 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15"
                        autoFocus
                      />
                      <datalist id="agenda-participants-suggestions">
                        {availableParticipantUsers.map((usuario) => (
                          <option
                            key={`suggestion-${usuario.id}`}
                            aria-label="Remover participante"
                            label={`${usuario.nome} (${usuario.email})`}
                          />
                        ))}
                      </datalist>
                      <button
                        type="button"
                        onClick={handleAddParticipantFromInput}
                        className="inline-flex items-center justify-center rounded-xl bg-[#159A9C] px-2.5 py-2 text-white transition-colors hover:bg-[#0F7B7D]"
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
                        className="inline-flex items-center justify-center rounded-xl border border-[#C8D6DE] bg-white px-2.5 py-2 text-[#002333] transition-colors hover:bg-[#F8FAFC]"
                        title="Cancelar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2">
                    <div className="relative">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8F9B]" />
                        <input
                          type="text"
                          value={participantSearch}
                          onChange={(e) => setParticipantSearch(e.target.value)}
                          onFocus={() => {
                            setIsParticipantSearchFocused(true);
                          }}
                          onBlur={() => {
                            window.setTimeout(() => {
                              setIsParticipantSearchFocused(false);
                              setActiveParticipantSearchIndex(-1);
                            }, 120);
                          }}
                          onKeyDown={handleParticipantSearchKeyDown}
                          role="combobox"
                          aria-autocomplete="list"
                          aria-expanded={isParticipantSearchDropdownOpen}
                          aria-controls={participantSearchListboxId}
                          aria-describedby={`${participantSearchHelpId} ${participantSearchStatusId}`}
                          aria-activedescendant={
                            isParticipantSearchDropdownOpen && activeParticipantSearchIndex >= 0
                              ? `agenda-participant-option-${filteredParticipantUsers[activeParticipantSearchIndex]?.id ?? ''}`
                              : undefined
                          }
                          placeholder={
                            loadingUsuarios
                              ? 'Carregando usuários...'
                              : 'Buscar participante da equipe por nome ou e-mail'
                          }
                          disabled={loadingUsuarios || availableParticipantUsers.length === 0}
                          className="mb-1 w-full rounded-xl border border-[#C8D6DE] bg-white py-2 pl-10 pr-10 text-sm text-[#002333] shadow-sm transition focus:border-[#159A9C] focus:outline-none focus:ring-4 focus:ring-[#159A9C]/15 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#7A8F9B]"
                        />
                        <div
                          id={participantSearchStatusId}
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                          className="sr-only"
                        >
                          {participantSearchAnnouncement}
                        </div>
                        {participantSearch && (
                          <button
                            type="button"
                            onClick={() => {
                              setParticipantSearch('');
                              setActiveParticipantSearchIndex(-1);
                            }}
                            className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#7A8F9B] transition-colors hover:bg-[#F4FBF9] hover:text-[#002333]"
                            aria-label="Limpar busca de participante"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {isParticipantSearchDropdownOpen && (
                        <div
                          id={participantSearchListboxId}
                          role="listbox"
                          aria-busy={loadingUsuarios}
                          className="absolute z-20 mt-1 w-full rounded-xl border border-[#DEEFE7] bg-white p-1 shadow-[0_16px_32px_rgba(0,35,51,0.12)]"
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {filteredParticipantUsers.length > 0 ? (
                            <div className="max-h-52 overflow-y-auto">
                              {filteredParticipantUsers.map((usuario, optionIndex) => (
                                <button
                                  key={usuario.id}
                                  id={`agenda-participant-option-${usuario.id}`}
                                  type="button"
                                  role="option"
                                  aria-selected={activeParticipantSearchIndex === optionIndex}
                                  onMouseEnter={() => setActiveParticipantSearchIndex(optionIndex)}
                                  onClick={() => handleSelectParticipantUser(usuario.email)}
                                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                                    activeParticipantSearchIndex === optionIndex
                                      ? 'bg-[#F4FBF9] ring-1 ring-[#BDE5DE]'
                                      : 'hover:bg-[#F4FBF9]'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-[#002333]">
                                      {usuario.nome}
                                    </div>
                                    <div className="truncate text-xs text-[#5B7483]">
                                      {usuario.email}
                                    </div>
                                  </div>
                                  <Plus className="ml-2 h-4 w-4 shrink-0 text-[#159A9C]" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="px-3 py-2 text-xs text-[#5B7483]">
                              Nenhum usuário encontrado para a busca informada.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!loadingUsuarios && availableParticipantUsers.length > 0 && (
                      <div className="mt-2">
                        <p className="mb-1 text-xs font-medium text-[#5B7483]">
                          Sugestões rápidas
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {availableParticipantUsers.slice(0, 4).map((usuario) => (
                            <button
                              key={`quick-${usuario.id}`}
                              type="button"
                              onClick={() => handleSelectParticipantUser(usuario.email)}
                              className="inline-flex items-center gap-1 rounded-full border border-[#DEEFE7] bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#4A6473] transition-colors hover:border-[#BDE5DE] hover:bg-[#F4FBF9] hover:text-[#002333]"
                            >
                              <Plus className="h-3 w-3 text-[#159A9C]" />
                              <span className="max-w-[140px] truncate">{usuario.nome}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <p id={participantSearchHelpId} className="mt-2 text-xs text-[#5B7483]">
                      Pesquise e clique para adicionar. Se preferir, informe um e-mail manualmente.
                    </p>
                  </div>
                )}

                {!showAddParticipant && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddParticipant(true);
                      setParticipantSearch('');
                      setIsParticipantSearchFocused(false);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-1 py-1 text-xs font-medium text-[#159A9C] transition-colors hover:bg-[#F4FBF9] hover:text-[#0F7B7D]"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar participante
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Resumo de Participantes - Compacto */}
          {participants.length > 0 && (
            <div className="mt-4 rounded-2xl border border-[#DEEFE7] bg-gradient-to-r from-[#F4FBF9] to-white p-3 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-[#159A9C]" />
                  <h4 className="text-xs font-medium text-[#002333]">
                    Participantes Convidados ({participants.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleFocusParticipantsSection}
                  className="inline-flex items-center rounded-lg border border-[#DEEFE7] bg-white px-2 py-1 text-[11px] font-medium text-[#4A6473] transition-colors hover:bg-[#F4FBF9] hover:text-[#002333]"
                >
                  Gerenciar
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {/* Avatares dos participantes */}
                <div className="flex -space-x-1">
                  {participants.slice(0, 5).map((email, index) => {
                    const participantMeta = getParticipantMeta(email);

                    return (
                    <div key={index} className="relative group">
                      <div className="w-6 h-6 bg-[#159A9C] rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white hover:z-10 cursor-pointer">
                        {participantMeta.avatarLabel}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(email)}
                        className="absolute -top-1 -right-1 z-10 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                        title={`Remover ${participantMeta.displayName}`}
                        aria-label={`Remover ${participantMeta.displayName}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>

                      {/* Tooltip para o resumo */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20">
                        {participantMeta.displayName}
                        {participantMeta.displayName !== participantMeta.email && (
                          <span className="ml-1 text-white/80">({participantMeta.email})</span>
                        )}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                    );
                  })}

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
                    ? participantDisplayNames.join(', ')
                    : `${participantDisplayNames.slice(0, 2).join(', ')} e mais ${participants.length - 2} participante${participants.length - 2 !== 1 ? 's' : ''}`}
                </div>
              </div>

              <p className="text-xs text-[#002333] mt-2 flex items-center">
                <Mail className="w-3 h-3 mr-1" />
                Convites serão enviados por email automaticamente
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          </div>
          <div className="sticky bottom-0 z-10 border-t border-[#DEEFE7] bg-white/95 px-4 py-3 backdrop-blur sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
              {event && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Excluir</span>
                </button>
              )}
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#002333] transition-colors hover:bg-[#F8FAFC] sm:flex-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#159A9C] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0F7B7D] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {isSubmitting && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar evento'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;
