import {
  AgendaAttendeeRsvpStatus,
  AgendaLocationType,
  AgendaPrioridade,
  AgendaReminderType,
  AgendaStatus,
  AgendaTipo,
} from './agenda-evento.entity';
import { AgendaService } from './agenda.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

describe('AgendaService - regras principais', () => {
  let service: AgendaService;

  const agendaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const userRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const notificationService = {
    create: jest.fn(),
  };

  const buildAgendaEvent = (overrides: Record<string, unknown> = {}) =>
    ({
      id: 'evt-1',
      empresa_id: 'empresa-1',
      titulo: 'Reuniao comercial',
      descricao: 'Descricao',
      inicio: new Date('2026-03-25T15:00:00.000Z'),
      fim: new Date('2026-03-25T16:00:00.000Z'),
      all_day: false,
      status: AgendaStatus.CONFIRMADO,
      prioridade: AgendaPrioridade.MEDIA,
      local: 'Sala 1',
      color: '#159A9C',
      tipo: AgendaTipo.REUNIAO,
      location_type: AgendaLocationType.PRESENCIAL,
      reminder_time: 10,
      reminder_type: AgendaReminderType.NOTIFICATION,
      email_offline: false,
      attachments: null,
      is_recurring: false,
      recurring_pattern: null,
      notes: null,
      responsavel_id: null,
      responsavel_nome: null,
      attendees: ['owner@acme.com', 'guest@acme.com'],
      attendee_responses: {
        'owner@acme.com': AgendaAttendeeRsvpStatus.CONFIRMED,
        'guest@acme.com': AgendaAttendeeRsvpStatus.PENDING,
      },
      criado_por_id: 'owner-id',
      created_at: new Date('2026-03-25T10:00:00.000Z'),
      updated_at: new Date('2026-03-25T10:00:00.000Z'),
      ...overrides,
    }) as any;

  const createQueryBuilderMock = () => {
    const queryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    return queryBuilder;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new AgendaService(
      agendaRepository as any,
      userRepository as any,
      notificationService as any,
    );
  });

  it('cria evento com campos estendidos e envia notificacao para participantes internos', async () => {
    agendaRepository.create.mockImplementation((payload: any) => payload);
    agendaRepository.save.mockImplementation(async (payload: any) => ({
      ...payload,
      id: 'evt-1',
    }));

    userRepository.findOne.mockResolvedValue({
      id: 'owner-id',
      nome: 'Owner Admin',
      email: 'owner@acme.com',
    });
    userRepository.find.mockResolvedValue([
      {
        id: 'guest-id',
        nome: 'Guest User',
        email: 'guest@acme.com',
      },
    ]);
    notificationService.create.mockResolvedValue({ id: 'notif-1' });

    const created = await service.create(
      {
        titulo: '  Reuniao comercial  ',
        descricao: '  alinhamento final  ',
        inicio: '2026-03-25T15:00:00.000Z',
        fim: '2026-03-25T16:00:00.000Z',
        tipo: AgendaTipo.REUNIAO,
        location_type: AgendaLocationType.VIRTUAL,
        reminder_time: 15,
        reminder_type: AgendaReminderType.BOTH,
        email_offline: true,
        attachments: [' https://cdn/logo.png '],
        notes: '  Observacoes extras ',
        responsavel_id: 'resp-1',
        responsavel_nome: '  Ana Silva ',
        attendees: ['OWNER@acme.com ', ' guest@acme.com'],
      },
      'empresa-1',
      'owner@acme.com',
      'owner-id',
    );

    expect(agendaRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        empresa_id: 'empresa-1',
        titulo: 'Reuniao comercial',
        descricao: 'alinhamento final',
        tipo: AgendaTipo.REUNIAO,
        location_type: AgendaLocationType.VIRTUAL,
        reminder_time: 15,
        reminder_type: AgendaReminderType.BOTH,
        email_offline: true,
        attachments: ['https://cdn/logo.png'],
        notes: 'Observacoes extras',
        responsavel_id: 'resp-1',
        responsavel_nome: 'Ana Silva',
        attendees: ['owner@acme.com', 'guest@acme.com'],
        attendee_responses: {
          'owner@acme.com': AgendaAttendeeRsvpStatus.CONFIRMED,
          'guest@acme.com': AgendaAttendeeRsvpStatus.PENDING,
        },
      }),
    );
    expect(created.id).toBe('evt-1');

    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 'empresa-1',
        userId: 'guest-id',
        type: NotificationType.SISTEMA,
        title: 'Novo convite na agenda',
        data: expect.objectContaining({
          action: 'created',
          eventId: 'evt-1',
          actorName: 'Owner Admin',
          actorUserId: 'owner-id',
        }),
      }),
    );
  });

  it('nao envia notificacao para o proprio ator ao criar evento', async () => {
    agendaRepository.create.mockImplementation((payload: any) => payload);
    agendaRepository.save.mockImplementation(async (payload: any) => ({
      ...payload,
      id: 'evt-2',
    }));

    userRepository.findOne.mockResolvedValue({
      id: 'owner-id',
      nome: 'Owner Admin',
      email: 'owner@acme.com',
    });
    userRepository.find.mockResolvedValue([
      {
        id: 'owner-id',
        nome: 'Owner Admin',
        email: 'owner@acme.com',
      },
      {
        id: 'guest-id',
        nome: 'Guest User',
        email: 'guest@acme.com',
      },
    ]);
    notificationService.create.mockResolvedValue({ id: 'notif-2' });

    await service.create(
      {
        titulo: 'Reuniao interna',
        inicio: '2026-03-25T15:00:00.000Z',
        attendees: ['owner@acme.com', 'guest@acme.com'],
      } as any,
      'empresa-1',
      undefined,
      'owner-id',
    );

    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'guest-id',
      }),
    );
  });

  it('notifica organizador quando participante responde RSVP com novo status', async () => {
    const existing = buildAgendaEvent({
      attendee_responses: {
        'owner@acme.com': AgendaAttendeeRsvpStatus.CONFIRMED,
        'guest@acme.com': AgendaAttendeeRsvpStatus.PENDING,
      },
    });

    agendaRepository.findOne.mockResolvedValue(existing);
    agendaRepository.save.mockImplementation(async (payload: any) => payload);

    userRepository.findOne.mockImplementation(async ({ where }: any) => {
      if (where?.id === 'owner-id') {
        return { id: 'owner-id', nome: 'Owner Admin', email: 'owner@acme.com' };
      }
      if (where?.email === 'guest@acme.com') {
        return { id: 'guest-id', nome: 'Guest User', email: 'guest@acme.com' };
      }
      return null;
    });
    notificationService.create.mockResolvedValue({ id: 'notif-rsvp' });

    await service.updateRsvp(
      'evt-1',
      { resposta: AgendaAttendeeRsvpStatus.CONFIRMED },
      'empresa-1',
      'guest@acme.com',
      'guest-id',
    );

    expect(agendaRepository.save).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledTimes(1);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        empresaId: 'empresa-1',
        userId: 'owner-id',
        type: NotificationType.SISTEMA,
        title: expect.stringContaining('Participante confirmou'),
        data: expect.objectContaining({
          source: 'agenda-rsvp',
          eventId: 'evt-1',
          attendeeEmail: 'guest@acme.com',
          response: AgendaAttendeeRsvpStatus.CONFIRMED,
        }),
      }),
    );
  });

  it('nao envia notificacao de RSVP quando resposta nao muda', async () => {
    const existing = buildAgendaEvent({
      attendee_responses: {
        'owner@acme.com': AgendaAttendeeRsvpStatus.CONFIRMED,
        'guest@acme.com': AgendaAttendeeRsvpStatus.CONFIRMED,
      },
    });

    agendaRepository.findOne.mockResolvedValue(existing);
    agendaRepository.save.mockImplementation(async (payload: any) => payload);

    await service.updateRsvp(
      'evt-1',
      { resposta: AgendaAttendeeRsvpStatus.CONFIRMED },
      'empresa-1',
      'guest@acme.com',
      'guest-id',
    );

    expect(agendaRepository.save).not.toHaveBeenCalled();
    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('faz fallback de listagem quando colunas estendidas da agenda nao existem no schema', async () => {
    const queryPrincipal = createQueryBuilderMock();
    const queryFallback = createQueryBuilderMock();
    const legacyEvent = buildAgendaEvent({
      tipo: undefined,
      location_type: undefined,
      reminder_time: undefined,
      reminder_type: undefined,
      email_offline: undefined,
      attachments: undefined,
      is_recurring: undefined,
      recurring_pattern: undefined,
      notes: undefined,
      responsavel_id: undefined,
      responsavel_nome: undefined,
      attendee_responses: undefined,
      criado_por_id: undefined,
    });

    queryPrincipal.getManyAndCount.mockRejectedValue(new Error('column agenda.tipo does not exist'));
    queryFallback.getManyAndCount.mockResolvedValue([[legacyEvent], 1]);

    agendaRepository.createQueryBuilder
      .mockReturnValueOnce(queryPrincipal as any)
      .mockReturnValueOnce(queryFallback as any);
    userRepository.find.mockResolvedValue([]);

    const result = await service.findAll('empresa-1', { page: 1, limit: 20 } as any, 'owner@acme.com');

    expect(agendaRepository.createQueryBuilder).toHaveBeenCalledTimes(2);
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: 'evt-1',
      status: AgendaStatus.CONFIRMADO,
      prioridade: AgendaPrioridade.MEDIA,
      tipo: AgendaTipo.EVENTO,
      location_type: AgendaLocationType.PRESENCIAL,
      reminder_time: null,
      reminder_type: null,
      email_offline: false,
      is_recurring: false,
      criado_por_id: null,
      my_rsvp: AgendaAttendeeRsvpStatus.PENDING,
    });
  });
});
