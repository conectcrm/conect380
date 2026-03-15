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
  AgendaPrioridade,
  AgendaStatus,
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

    const textFields = ['titulo', 'descricao', 'local', 'color'];
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

      const entity = this.agendaRepository.create({
        ...sanitized,
        empresa_id: empresaId,
        inicio: new Date(dto.inicio),
        fim: dto.fim ? new Date(dto.fim) : null,
        all_day: dto.all_day ?? false,
        status: dto.status ?? AgendaStatus.CONFIRMADO,
        prioridade: dto.prioridade ?? AgendaPrioridade.MEDIA,
        attendees: normalizedAttendees,
        attendee_responses: this.buildAttendeeResponses(normalizedAttendees, null, actorEmail),
        criado_por_id: actorUserId || null,
      });

      return await this.agendaRepository.save(entity);
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
  ): Promise<AgendaEvento> {
    try {
      const existing = await this.findOne(id, empresaId);
      const sanitized = this.sanitize(dto);

      if (dto.inicio) {
        (sanitized as any).inicio = new Date(dto.inicio);
      }

      if (dto.fim) {
        (sanitized as any).fim = new Date(dto.fim);
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

      const merged = this.agendaRepository.merge(existing, sanitized);
      await this.agendaRepository.save(merged);

      return this.findOne(id, empresaId);
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

  async remove(id: string, empresaId: string): Promise<void> {
    const existing = await this.findOne(id, empresaId);
    await this.agendaRepository.remove(existing);
  }
}
