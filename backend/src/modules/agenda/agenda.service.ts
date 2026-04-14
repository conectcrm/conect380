import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AgendaAttendeeRsvpStatus,
  AgendaEvento,
  AgendaLocationType,
  AgendaPrioridade,
  AgendaReminderType,
  AgendaStatus,
  AgendaTipo,
} from './agenda-evento.entity';
import {
  AgendaEventoFiltroDto,
  CreateAgendaEventoDto,
  UpdateAgendaEventoDto,
  UpdateAgendaEventoRsvpDto,
} from './dto/agenda-evento.dto';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';
import { User } from '../users/user.entity';
import { NotificationService } from '../../notifications/notification.service';
import { NotificationType } from '../../notifications/entities/notification.entity';

@Injectable()
export class AgendaService {
  private readonly logger = new Logger(AgendaService.name);

  constructor(
    @InjectRepository(AgendaEvento)
    private readonly agendaRepository: Repository<AgendaEvento>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  private sanitize<T extends Partial<CreateAgendaEventoDto | UpdateAgendaEventoDto>>(payload: T): T {
    const sanitized = { ...payload } as Record<string, unknown>;

    const textFields = ['titulo', 'descricao', 'local', 'color', 'notes', 'responsavel_nome'];
    textFields.forEach((field) => {
      if (typeof sanitized[field] === 'string') {
        const trimmed = (sanitized[field] as string).trim();
        sanitized[field] = trimmed === '' ? undefined : trimmed;
      }
    });

    return sanitized as T;
  }

  private normalizeEmail(email?: string | null): string | null {
    if (!email || typeof email !== 'string') return null;
    const normalized = email.trim().toLowerCase();
    return normalized || null;
  }

  private normalizeAttendees(attendees?: string[] | null): string[] | null {
    if (!Array.isArray(attendees) || attendees.length === 0) return null;

    const normalized = Array.from(
      new Set(
        attendees
          .map((attendee) => this.normalizeEmail(attendee))
          .filter((attendee): attendee is string => !!attendee),
      ),
    );

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeAttachments(attachments?: string[] | null): string[] | null {
    if (!Array.isArray(attachments) || attachments.length === 0) return null;

    const normalized = Array.from(
      new Set(
        attachments
          .map((attachment) => (typeof attachment === 'string' ? attachment.trim() : ''))
          .filter((attachment): attachment is string => !!attachment),
      ),
    );

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeReminderTime(reminderTime?: number | null): number | null {
    if (typeof reminderTime !== 'number' || Number.isNaN(reminderTime)) return null;
    if (reminderTime <= 0) return null;
    return Math.floor(reminderTime);
  }

  private normalizeStatus(status: unknown): AgendaStatus {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === AgendaStatus.PENDENTE) return AgendaStatus.PENDENTE;
    if (normalized === AgendaStatus.CANCELADO) return AgendaStatus.CANCELADO;
    return AgendaStatus.CONFIRMADO;
  }

  private normalizePrioridade(prioridade: unknown): AgendaPrioridade {
    const normalized = String(prioridade || '').trim().toLowerCase();
    if (normalized === AgendaPrioridade.ALTA) return AgendaPrioridade.ALTA;
    if (normalized === AgendaPrioridade.BAIXA) return AgendaPrioridade.BAIXA;
    return AgendaPrioridade.MEDIA;
  }

  private normalizeLegacyEvento(raw: AgendaEvento): AgendaEvento {
    const inicio = new Date(raw.inicio);
    const fimRaw = raw.fim ? new Date(raw.fim) : null;

    return {
      ...raw,
      inicio: Number.isNaN(inicio.getTime()) ? new Date() : inicio,
      fim: fimRaw && !Number.isNaN(fimRaw.getTime()) ? fimRaw : null,
      all_day: Boolean(raw.all_day),
      status: this.normalizeStatus(raw.status),
      prioridade: this.normalizePrioridade(raw.prioridade),
      tipo: raw.tipo ?? AgendaTipo.EVENTO,
      location_type: raw.location_type ?? AgendaLocationType.PRESENCIAL,
      reminder_time: this.normalizeReminderTime(raw.reminder_time ?? null),
      reminder_type: raw.reminder_type ?? null,
      email_offline: Boolean(raw.email_offline),
      attachments: Array.isArray(raw.attachments) ? raw.attachments : null,
      is_recurring: Boolean(raw.is_recurring),
      recurring_pattern: raw.recurring_pattern ?? null,
      notes: raw.notes ?? null,
      responsavel_id: raw.responsavel_id ?? null,
      responsavel_nome: raw.responsavel_nome ?? null,
      attendee_responses: raw.attendee_responses ?? null,
      criado_por_id: raw.criado_por_id ?? null,
    };
  }

  private isAgendaSchemaColumnMissing(error: unknown): boolean {
    const message = String((error as { message?: string })?.message || '').toLowerCase();
    if (!message.includes('does not exist') || !message.includes('column')) {
      return false;
    }

    const mentionsAgendaTable = message.includes('agenda_eventos') || message.includes('agenda.');
    if (!mentionsAgendaTable) {
      return false;
    }

    const knownExtendedColumns = [
      'tipo',
      'location_type',
      'reminder_time',
      'reminder_type',
      'email_offline',
      'attachments',
      'is_recurring',
      'recurring_pattern',
      'notes',
      'responsavel_id',
      'responsavel_nome',
      'attendee_responses',
      'criado_por_id',
    ];

    return knownExtendedColumns.some((column) => message.includes(column));
  }

  private async findAllWithLegacySchemaFallback(
    empresaId: string,
    filtros: AgendaEventoFiltroDto,
    userEmail?: string,
  ) {
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 20;
    const skip = (page - 1) * limit;

    const query = this.agendaRepository
      .createQueryBuilder('agenda')
      .select([
        'agenda.id',
        'agenda.empresa_id',
        'agenda.titulo',
        'agenda.descricao',
        'agenda.inicio',
        'agenda.fim',
        'agenda.all_day',
        'agenda.status',
        'agenda.prioridade',
        'agenda.local',
        'agenda.color',
        'agenda.attendees',
        'agenda.interacao_id',
        'agenda.created_at',
        'agenda.updated_at',
      ])
      .where('agenda.empresa_id = :empresaId', { empresaId });

    if (userEmail) {
      query.andWhere(
        "(agenda.attendees IS NULL OR agenda.attendees = '[]'::jsonb OR agenda.attendees @> :attendeeFilter::jsonb)",
        {
          attendeeFilter: JSON.stringify([String(userEmail).trim().toLowerCase()]),
        },
      );
    }

    if (filtros.status) {
      query.andWhere('agenda.status = :status', { status: filtros.status });
    }

    if (filtros.prioridade) {
      query.andWhere('agenda.prioridade = :prioridade', { prioridade: filtros.prioridade });
    }

    if (filtros.interacao_id) {
      query.andWhere('agenda.interacao_id = :interacao_id', {
        interacao_id: filtros.interacao_id,
      });
    }

    if (filtros.dataInicio && filtros.dataFim) {
      query.andWhere('agenda.inicio BETWEEN :inicio AND :fim', {
        inicio: filtros.dataInicio,
        fim: filtros.dataFim,
      });
    }

    if (filtros.busca) {
      query.andWhere('(agenda.titulo ILIKE :busca OR agenda.descricao ILIKE :busca)', {
        busca: `%${filtros.busca}%`,
      });
    }

    query.orderBy('agenda.inicio', 'ASC');
    query.skip(skip).take(limit);

    const [data, total] = await query.getManyAndCount();
    const normalized = data.map((event) => this.normalizeLegacyEvento(event));
    const serialized = normalized.map((event) => this.serializeEventoParaUsuario(event, userEmail, null));

    return createPaginatedResponse(serialized, total, page, limit);
  }

  private formatEventDateLabel(event: AgendaEvento): string {
    const startDate = new Date(event.inicio);
    if (Number.isNaN(startDate.getTime())) return 'data indefinida';

    if (event.all_day) {
      return startDate.toLocaleDateString('pt-BR');
    }

    return startDate.toLocaleString('pt-BR');
  }

  private async resolveActorDisplayName(actorUserId?: string, actorEmail?: string): Promise<string> {
    if (actorUserId) {
      const actor = await this.userRepository.findOne({
        where: { id: actorUserId },
        select: {
          id: true,
          nome: true,
          email: true,
        },
      });

      const actorName = actor?.nome?.trim();
      if (actorName) return actorName;
      const actorEmailValue = actor?.email?.trim();
      if (actorEmailValue) return actorEmailValue;
    }

    const normalizedActorEmail = this.normalizeEmail(actorEmail);
    return normalizedActorEmail || 'Um usuário';
  }

  private async resolveInternalParticipantsByEmails(
    empresaId: string,
    attendees?: string[] | null,
    excludeEmail?: string | null,
  ) {
    const normalizedAttendees = this.normalizeAttendees(attendees);
    if (!normalizedAttendees?.length) return [];

    const excludedEmail = this.normalizeEmail(excludeEmail);
    const filteredAttendees = normalizedAttendees.filter((email) => email !== excludedEmail);
    if (!filteredAttendees.length) return [];

    const users = await this.userRepository.find({
      where: {
        empresa_id: empresaId,
        email: In(filteredAttendees),
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    return users.filter((user) => !!user.id && !!user.email);
  }

  private async notifyParticipantsAboutEvent(params: {
    action: 'created' | 'updated' | 'cancelled' | 'deleted';
    event: AgendaEvento;
    empresaId: string;
    users: Array<Pick<User, 'id' | 'nome' | 'email'>>;
    actorName: string;
    actorUserId?: string;
  }) {
    if (!params.users.length) return;

    const recipients = params.actorUserId
      ? params.users.filter((user) => !!user.id && user.id !== params.actorUserId)
      : params.users;

    if (!recipients.length) return;

    const titleByAction = {
      created: 'Novo convite na agenda',
      updated: 'Evento atualizado na agenda',
      cancelled: 'Evento cancelado na agenda',
      deleted: 'Evento removido da agenda',
    } as const;

    const messageByAction = {
      created: `${params.actorName} convidou você para o evento "${params.event.titulo}" em ${this.formatEventDateLabel(
        params.event,
      )}${params.event.local ? ` (${params.event.local})` : ''}.`,
      updated: `${params.actorName} atualizou o evento "${params.event.titulo}"${
        params.event.local ? ` (${params.event.local})` : ''
      }.`,
      cancelled: `${params.actorName} cancelou o evento "${params.event.titulo}"${
        params.event.local ? ` (${params.event.local})` : ''
      }.`,
      deleted: `${params.actorName} removeu o evento "${params.event.titulo}" da agenda.`,
    } as const;

    const results = await Promise.allSettled(
      recipients.map((user) =>
        this.notificationService.create({
          empresaId: params.empresaId,
          userId: user.id,
          type: NotificationType.SISTEMA,
          title: titleByAction[params.action],
          message: messageByAction[params.action],
          data: {
            modulo: 'agenda',
            action: params.action,
            eventId: params.event.id,
            eventTitle: params.event.titulo,
            eventStart: params.event.inicio ? new Date(params.event.inicio).toISOString() : null,
            eventEnd: params.event.fim ? new Date(params.event.fim).toISOString() : null,
            allDay: !!params.event.all_day,
            location: params.event.local || null,
            actorName: params.actorName,
            actorUserId: params.actorUserId || null,
          },
        }),
      ),
    );

    const failures = results.filter((result) => result.status === 'rejected').length;
    if (failures > 0) {
      this.logger.warn(
        `Falha parcial ao notificar participantes da agenda (action=${params.action}, event=${params.event.id}, failed=${failures}, total=${results.length})`,
      );
    }
  }

  private buildAttendeeResponses(
    attendees?: string[] | null,
    existing?: Record<string, AgendaAttendeeRsvpStatus> | null,
    autoConfirmEmail?: string | null,
  ): Record<string, AgendaAttendeeRsvpStatus> | null {
    const normalizedAttendees = this.normalizeAttendees(attendees);
    if (!normalizedAttendees?.length) return null;

    const normalizedAutoConfirmEmail = this.normalizeEmail(autoConfirmEmail);
    const responseMap: Record<string, AgendaAttendeeRsvpStatus> = {};

    normalizedAttendees.forEach((email) => {
      const current = existing?.[email];
      responseMap[email] =
        current ??
        (normalizedAutoConfirmEmail && email === normalizedAutoConfirmEmail
          ? AgendaAttendeeRsvpStatus.CONFIRMED
          : AgendaAttendeeRsvpStatus.PENDING);
    });

    return Object.keys(responseMap).length ? responseMap : null;
  }

  private resolveMyRsvp(event: AgendaEvento, userEmail?: string): AgendaAttendeeRsvpStatus | null {
    const normalizedUserEmail = this.normalizeEmail(userEmail);
    if (!normalizedUserEmail) return null;

    const normalizedAttendees = this.normalizeAttendees(event.attendees);
    if (!normalizedAttendees?.includes(normalizedUserEmail)) return null;

    return event.attendee_responses?.[normalizedUserEmail] ?? AgendaAttendeeRsvpStatus.PENDING;
  }

  private ensureUserCanAccessEvent(event: AgendaEvento, userEmail?: string) {
    const normalizedAttendees = this.normalizeAttendees(event.attendees);
    if (!normalizedAttendees?.length) return;

    const normalizedUserEmail = this.normalizeEmail(userEmail);
    if (!normalizedUserEmail || !normalizedAttendees.includes(normalizedUserEmail)) {
      throw new ForbiddenException('Acesso negado ao evento');
    }
  }

  private async notifyOrganizerAboutRsvp(
    event: AgendaEvento,
    empresaId: string,
    attendeeEmail: string,
    resposta: AgendaAttendeeRsvpStatus,
    actorUserId?: string,
  ) {
    if (!event.criado_por_id) return;
    if (actorUserId && actorUserId === event.criado_por_id) return;

    const attendeeUser = await this.userRepository.findOne({
      where: {
        empresa_id: empresaId,
        email: attendeeEmail,
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
    });

    const attendeeDisplayName =
      attendeeUser?.nome?.trim() || attendeeUser?.email?.trim() || attendeeEmail;

    const respostaLabelMap: Record<AgendaAttendeeRsvpStatus, string> = {
      [AgendaAttendeeRsvpStatus.PENDING]: 'marcou como pendente',
      [AgendaAttendeeRsvpStatus.CONFIRMED]: 'confirmou presença',
      [AgendaAttendeeRsvpStatus.DECLINED]: 'informou que não vai',
    };

    const titleMap: Record<AgendaAttendeeRsvpStatus, string> = {
      [AgendaAttendeeRsvpStatus.PENDING]: 'RSVP pendente atualizado',
      [AgendaAttendeeRsvpStatus.CONFIRMED]: 'Participante confirmou presença',
      [AgendaAttendeeRsvpStatus.DECLINED]: 'Participante recusou convite',
    };

    await this.notificationService.create({
      empresaId,
      userId: event.criado_por_id,
      type: NotificationType.SISTEMA,
      title: titleMap[resposta],
      message: `${attendeeDisplayName} ${respostaLabelMap[resposta]} no evento "${event.titulo}".`,
      data: {
        source: 'agenda-rsvp',
        eventId: event.id,
        attendeeEmail,
        attendeeUserId: attendeeUser?.id ?? null,
        response: resposta,
        title: event.titulo,
      },
    });
  }

  private async getCreatorNameMapByIds(criadoPorIds: Array<string | null | undefined>) {
    const uniqueIds = Array.from(
      new Set(
        criadoPorIds
          .map((id) => (typeof id === 'string' ? id.trim() : ''))
          .filter((id): id is string => !!id),
      ),
    );

    if (!uniqueIds.length) return new Map<string, string>();

    const users = await this.userRepository.find({
      where: {
        id: In(uniqueIds),
      },
      select: {
        id: true,
        nome: true,
      },
    });

    return new Map(users.map((user) => [user.id, user.nome]));
  }

  serializeEventoParaUsuario(event: AgendaEvento, userEmail?: string, criadoPorNome?: string | null) {
    const normalizedAttendees = this.normalizeAttendees(event.attendees);
    const normalizedResponses = this.buildAttendeeResponses(
      normalizedAttendees,
      event.attendee_responses,
      null,
    );

    return {
      ...event,
      attendees: normalizedAttendees,
      attendee_responses: normalizedResponses,
      criado_por_id: event.criado_por_id ?? null,
      criado_por_nome: criadoPorNome ?? null,
      my_rsvp: this.resolveMyRsvp(
        {
          ...event,
          attendees: normalizedAttendees ?? undefined,
          attendee_responses: normalizedResponses ?? undefined,
        } as AgendaEvento,
        userEmail,
      ),
    };
  }

  async listParticipants(empresaId: string) {
    const users = await this.userRepository.find({
      where: {
        empresa_id: empresaId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        email: true,
      },
      order: {
        nome: 'ASC',
      },
    });

    return users.map((user) => ({
      id: user.id,
      nome: user.nome,
      email: user.email,
    }));
  }

  async create(
    dto: CreateAgendaEventoDto,
    empresaId: string,
    actorEmail?: string,
    actorUserId?: string,
  ): Promise<AgendaEvento> {
    try {
      const sanitized = this.sanitize(dto);
      const normalizedAttendees = this.normalizeAttendees(dto.attendees);
      const normalizedAttachments = this.normalizeAttachments(dto.attachments);
      const reminderTime = this.normalizeReminderTime(dto.reminder_time);
      const actorName = await this.resolveActorDisplayName(actorUserId, actorEmail);

      const entity = this.agendaRepository.create({
        ...sanitized,
        empresa_id: empresaId,
        inicio: new Date(dto.inicio),
        fim: dto.fim ? new Date(dto.fim) : null,
        all_day: dto.all_day ?? false,
        status: dto.status ?? AgendaStatus.CONFIRMADO,
        prioridade: dto.prioridade ?? AgendaPrioridade.MEDIA,
        tipo: dto.tipo ?? AgendaTipo.EVENTO,
        location_type: dto.location_type ?? AgendaLocationType.PRESENCIAL,
        reminder_time: reminderTime,
        reminder_type: dto.reminder_type ?? null,
        email_offline: dto.email_offline ?? false,
        attachments: normalizedAttachments,
        is_recurring: dto.is_recurring ?? false,
        recurring_pattern: dto.recurring_pattern ?? null,
        notes: sanitized.notes ?? null,
        responsavel_id: dto.responsavel_id ?? null,
        responsavel_nome: sanitized.responsavel_nome ?? null,
        attendees: normalizedAttendees,
        attendee_responses: this.buildAttendeeResponses(normalizedAttendees, null, actorEmail),
        criado_por_id: actorUserId || null,
      });

      const savedEvent = await this.agendaRepository.save(entity);

      try {
        const internalParticipants = await this.resolveInternalParticipantsByEmails(
          empresaId,
          savedEvent.attendees,
          actorEmail,
        );
        await this.notifyParticipantsAboutEvent({
          action: 'created',
          event: savedEvent,
          empresaId,
          users: internalParticipants,
          actorName,
          actorUserId,
        });
      } catch (notificationError) {
        this.logger.warn(
          `Falha ao notificar participantes no create da agenda (event=${savedEvent.id}): ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`,
        );
      }

      return savedEvent;
    } catch (error) {
      this.logger.error(
        `Erro ao criar evento de agenda (empresa=${empresaId}): ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Erro ao criar evento de agenda');
    }
  }

  async findAll(empresaId: string, filtros: AgendaEventoFiltroDto, userEmail?: string) {
    try {
      const page = filtros.page ?? 1;
      const limit = filtros.limit ?? 20;
      const skip = (page - 1) * limit;

      const query = this.agendaRepository
        .createQueryBuilder('agenda')
        .where('agenda.empresa_id = :empresaId', { empresaId });

      if (userEmail) {
        query.andWhere(
          "(agenda.attendees IS NULL OR agenda.attendees = '[]'::jsonb OR agenda.attendees @> :attendeeFilter::jsonb)",
          {
            attendeeFilter: JSON.stringify([String(userEmail).trim().toLowerCase()]),
          },
        );
      }

      if (filtros.status) {
        query.andWhere('agenda.status = :status', { status: filtros.status });
      }

      if (filtros.prioridade) {
        query.andWhere('agenda.prioridade = :prioridade', { prioridade: filtros.prioridade });
      }

      if (filtros.interacao_id) {
        query.andWhere('agenda.interacao_id = :interacao_id', {
          interacao_id: filtros.interacao_id,
        });
      }

      if (filtros.dataInicio && filtros.dataFim) {
        query.andWhere('agenda.inicio BETWEEN :inicio AND :fim', {
          inicio: filtros.dataInicio,
          fim: filtros.dataFim,
        });
      }

      if (filtros.busca) {
        query.andWhere('(agenda.titulo ILIKE :busca OR agenda.descricao ILIKE :busca)', {
          busca: `%${filtros.busca}%`,
        });
      }

      query.orderBy('agenda.inicio', 'ASC');
      query.skip(skip).take(limit);

      const [data, total] = await query.getManyAndCount();
      const creatorNameMap = await this.getCreatorNameMapByIds(data.map((event) => event.criado_por_id));
      const serialized = data.map((event) =>
        this.serializeEventoParaUsuario(
          event,
          userEmail,
          event.criado_por_id ? creatorNameMap.get(event.criado_por_id) ?? null : null,
        ),
      );

      return createPaginatedResponse(serialized, total, page, limit);
    } catch (error) {
      if (this.isAgendaSchemaColumnMissing(error)) {
        this.logger.warn(
          'Schema legado detectado em agenda_eventos. Aplicando fallback de compatibilidade para listagem.',
        );
        try {
          return await this.findAllWithLegacySchemaFallback(empresaId, filtros, userEmail);
        } catch (fallbackError) {
          this.logger.error(
            `Falha no fallback de listagem da agenda (empresa=${empresaId}): ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`,
            fallbackError instanceof Error ? fallbackError.stack : undefined,
          );
        }
      }

      throw new InternalServerErrorException('Erro ao listar eventos de agenda');
    }
  }

  async findOne(id: string, empresaId: string, userEmail?: string): Promise<AgendaEvento> {
    const agendaEvento = await this.agendaRepository.findOne({
      where: { id, empresa_id: empresaId },
    });

    if (!agendaEvento) {
      throw new NotFoundException('Evento não encontrado');
    }

    this.ensureUserCanAccessEvent(agendaEvento, userEmail);
    return agendaEvento;
  }

  async serializeEventoParaUsuarioComCriador(event: AgendaEvento, userEmail?: string) {
    const creatorNameMap = await this.getCreatorNameMapByIds([event.criado_por_id]);
    const criadoPorNome = event.criado_por_id ? creatorNameMap.get(event.criado_por_id) ?? null : null;
    return this.serializeEventoParaUsuario(event, userEmail, criadoPorNome);
  }

  async update(
    id: string,
    dto: UpdateAgendaEventoDto,
    empresaId: string,
    actorEmail?: string,
    actorUserId?: string,
  ): Promise<AgendaEvento> {
    try {
      const existing = await this.findOne(id, empresaId, actorEmail);
      const sanitized = this.sanitize(dto);
      const actorName = await this.resolveActorDisplayName(actorUserId, actorEmail);

      if (dto.inicio) {
        (sanitized as any).inicio = new Date(dto.inicio);
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'fim')) {
        (sanitized as any).fim = dto.fim ? new Date(dto.fim) : null;
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'attendees')) {
        const normalizedAttendees = this.normalizeAttendees(dto.attendees ?? null);
        (sanitized as any).attendees = normalizedAttendees;
        (sanitized as any).attendee_responses = this.buildAttendeeResponses(
          normalizedAttendees,
          existing.attendee_responses,
          actorEmail,
        );
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'attachments')) {
        (sanitized as any).attachments = this.normalizeAttachments(dto.attachments ?? null);
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'reminder_time')) {
        (sanitized as any).reminder_time = this.normalizeReminderTime(dto.reminder_time ?? null);
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'reminder_type')) {
        (sanitized as any).reminder_type = dto.reminder_type ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'recurring_pattern')) {
        (sanitized as any).recurring_pattern = dto.recurring_pattern ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'notes')) {
        (sanitized as any).notes = sanitized.notes ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'responsavel_nome')) {
        (sanitized as any).responsavel_nome = sanitized.responsavel_nome ?? null;
      }

      if (Object.prototype.hasOwnProperty.call(dto, 'responsavel_id')) {
        (sanitized as any).responsavel_id = dto.responsavel_id ?? null;
      }

      const merged = this.agendaRepository.merge(existing, sanitized);
      await this.agendaRepository.save(merged);

      const updatedEvent = await this.findOne(id, empresaId, actorEmail);

      const notificationAction =
        updatedEvent.status === AgendaStatus.CANCELADO ? 'cancelled' : 'updated';

      try {
        const internalParticipants = await this.resolveInternalParticipantsByEmails(
          empresaId,
          updatedEvent.attendees,
          actorEmail,
        );
        await this.notifyParticipantsAboutEvent({
          action: notificationAction,
          event: updatedEvent,
          empresaId,
          users: internalParticipants,
          actorName,
          actorUserId,
        });
      } catch (notificationError) {
        this.logger.warn(
          `Falha ao notificar participantes no update da agenda (event=${updatedEvent.id}): ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`,
        );
      }

      return updatedEvent;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar evento de agenda');
    }
  }

  async updateRsvp(
    id: string,
    dto: UpdateAgendaEventoRsvpDto,
    empresaId: string,
    userEmail?: string,
    actorUserId?: string,
  ): Promise<AgendaEvento> {
    const existing = await this.findOne(id, empresaId, userEmail);
    const normalizedUserEmail = this.normalizeEmail(userEmail);
    const normalizedAttendees = this.normalizeAttendees(existing.attendees);

    if (!normalizedUserEmail || !normalizedAttendees?.includes(normalizedUserEmail)) {
      throw new ForbiddenException('Somente participantes podem responder ao convite');
    }

    const previousResponse =
      existing.attendee_responses?.[normalizedUserEmail] ?? AgendaAttendeeRsvpStatus.PENDING;

    if (previousResponse === dto.resposta) {
      return existing;
    }

    existing.attendees = normalizedAttendees;
    existing.attendee_responses = this.buildAttendeeResponses(
      normalizedAttendees,
      {
        ...(existing.attendee_responses || {}),
        [normalizedUserEmail]: dto.resposta,
      },
      null,
    );

    await this.agendaRepository.save(existing);

    if (previousResponse !== dto.resposta) {
      try {
        await this.notifyOrganizerAboutRsvp(
          existing,
          empresaId,
          normalizedUserEmail,
          dto.resposta,
          actorUserId,
        );
      } catch (error) {
        this.logger.warn(
          `Falha ao notificar organizador sobre RSVP (evento=${existing.id}, resposta=${dto.resposta}): ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return this.findOne(id, empresaId, userEmail);
  }

  async remove(
    id: string,
    empresaId: string,
    actorEmail?: string,
    actorUserId?: string,
  ): Promise<void> {
    const existing = await this.findOne(id, empresaId, actorEmail);

    try {
      const actorName = await this.resolveActorDisplayName(actorUserId, actorEmail);
      const internalParticipants = await this.resolveInternalParticipantsByEmails(
        empresaId,
        existing.attendees,
        actorEmail,
      );
      await this.notifyParticipantsAboutEvent({
        action: 'deleted',
        event: existing,
        empresaId,
        users: internalParticipants,
        actorName,
        actorUserId,
      });
    } catch (notificationError) {
      this.logger.warn(
        `Falha ao notificar participantes no remove da agenda (event=${existing.id}): ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`,
      );
    }

    await this.agendaRepository.remove(existing);
  }
}
