import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgendaEvento, AgendaPrioridade, AgendaStatus } from './agenda-evento.entity';
import {
  AgendaEventoFiltroDto,
  CreateAgendaEventoDto,
  UpdateAgendaEventoDto,
} from './dto/agenda-evento.dto';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(AgendaEvento)
    private readonly agendaRepository: Repository<AgendaEvento>,
  ) {}

  private sanitize<T extends Partial<CreateAgendaEventoDto | UpdateAgendaEventoDto>>(
    payload: T,
  ): T {
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

  async create(dto: CreateAgendaEventoDto, empresaId: string): Promise<AgendaEvento> {
    try {
      const sanitized = this.sanitize(dto);
      const entity = this.agendaRepository.create({
        ...sanitized,
        empresa_id: empresaId,
        inicio: new Date(dto.inicio),
        fim: dto.fim ? new Date(dto.fim) : null,
        all_day: dto.all_day ?? false,
        status: dto.status ?? AgendaStatus.CONFIRMADO,
        prioridade: dto.prioridade ?? AgendaPrioridade.MEDIA,
        attendees: dto.attendees?.length ? dto.attendees : null,
      });

      return await this.agendaRepository.save(entity);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar evento de agenda');
    }
  }

  async findAll(empresaId: string, filtros: AgendaEventoFiltroDto) {
    try {
      const page = filtros.page ?? 1;
      const limit = filtros.limit ?? 20;
      const skip = (page - 1) * limit;

      const query = this.agendaRepository
        .createQueryBuilder('agenda')
        .where('agenda.empresa_id = :empresaId', { empresaId });

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

      return createPaginatedResponse(data, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao listar eventos de agenda');
    }
  }

  async findOne(id: string, empresaId: string): Promise<AgendaEvento> {
    const agendaEvento = await this.agendaRepository.findOne({
      where: { id, empresa_id: empresaId },
    });

    if (!agendaEvento) {
      throw new NotFoundException('Evento não encontrado');
    }

    return agendaEvento;
  }

  async update(id: string, dto: UpdateAgendaEventoDto, empresaId: string): Promise<AgendaEvento> {
    try {
      const existing = await this.findOne(id, empresaId);
      const sanitized = this.sanitize(dto);

      if (dto.inicio) {
        (sanitized as any).inicio = new Date(dto.inicio);
      }

      if (dto.fim) {
        (sanitized as any).fim = new Date(dto.fim);
      }

      const merged = this.agendaRepository.merge(existing, sanitized);
      await this.agendaRepository.save(merged);

      return this.findOne(id, empresaId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar evento de agenda');
    }
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const existing = await this.findOne(id, empresaId);
    await this.agendaRepository.remove(existing);
  }
}
