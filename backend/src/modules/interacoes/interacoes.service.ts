import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interacao, TipoInteracao } from './interacao.entity';
import { CreateInteracaoDto, UpdateInteracaoDto, InteracaoFiltroDto } from './dto/interacao.dto';
import { createPaginatedResponse } from '../../common/dto/pagination.dto';
import { AgendaService } from '../agenda/agenda.service';

@Injectable()
export class InteracoesService {
  constructor(
    @InjectRepository(Interacao)
    private readonly interacoesRepository: Repository<Interacao>,
    private readonly agendaService: AgendaService,
  ) {}

  private sanitize<T extends Partial<CreateInteracaoDto | UpdateInteracaoDto>>(payload: T): T {
    const sanitized = { ...payload } as Record<string, unknown>;

    const textFields = ['titulo', 'descricao', 'proxima_acao_descricao'];
    textFields.forEach((field) => {
      if (typeof sanitized[field] === 'string') {
        const trimmed = (sanitized[field] as string).trim();
        sanitized[field] = trimmed === '' ? undefined : trimmed;
      }
    });

    return sanitized as T;
  }

  async create(dto: CreateInteracaoDto, empresaId: string): Promise<Interacao> {
    try {
      const sanitized = this.sanitize(dto);
      const interacao = this.interacoesRepository.create({
        ...sanitized,
        empresa_id: empresaId,
      });

      const saved = await this.interacoesRepository.save(interacao);

      if (dto.agenda_evento) {
        const agenda = await this.agendaService.create(
          {
            ...dto.agenda_evento,
            titulo: dto.agenda_evento.titulo || dto.titulo || 'Interação',
            interacao_id: saved.id,
          },
          empresaId,
        );

        await this.interacoesRepository.update(saved.id, { agenda_event_id: agenda.id });
        return this.findOne(saved.id, empresaId);
      }

      return saved;
    } catch (error) {
      throw new InternalServerErrorException('Erro ao criar interação');
    }
  }

  async findAll(empresaId: string, filtros: InteracaoFiltroDto) {
    try {
      const page = filtros.page ?? 1;
      const limit = filtros.limit ?? 20;
      const skip = (page - 1) * limit;

      const query = this.interacoesRepository
        .createQueryBuilder('interacao')
        .leftJoinAndSelect('interacao.lead', 'lead')
        .leftJoinAndSelect('interacao.contato', 'contato')
        .leftJoinAndSelect('interacao.responsavel', 'responsavel')
        .where('interacao.empresa_id = :empresaId', { empresaId });

      if (filtros.tipo) {
        query.andWhere('interacao.tipo = :tipo', { tipo: filtros.tipo });
      }

      if (filtros.lead_id) {
        query.andWhere('interacao.lead_id = :lead_id', { lead_id: filtros.lead_id });
      }

      if (filtros.contato_id) {
        query.andWhere('interacao.contato_id = :contato_id', { contato_id: filtros.contato_id });
      }

      if (filtros.responsavel_id) {
        query.andWhere('interacao.responsavel_id = :responsavel_id', {
          responsavel_id: filtros.responsavel_id,
        });
      }

      if (filtros.dataInicio && filtros.dataFim) {
        query.andWhere('interacao.data_referencia BETWEEN :inicio AND :fim', {
          inicio: filtros.dataInicio,
          fim: filtros.dataFim,
        });
      }

      if (filtros.busca) {
        query.andWhere('(interacao.titulo ILIKE :busca OR interacao.descricao ILIKE :busca)', {
          busca: `%${filtros.busca}%`,
        });
      }

      query.orderBy('interacao.data_referencia', 'DESC');
      query.skip(skip).take(limit);

      const [data, total] = await query.getManyAndCount();

      return createPaginatedResponse(data, total, page, limit);
    } catch (error) {
      throw new InternalServerErrorException('Erro ao listar interações');
    }
  }

  async findOne(id: string, empresaId: string): Promise<Interacao> {
    const interacao = await this.interacoesRepository.findOne({
      where: { id, empresa_id: empresaId },
      relations: ['lead', 'contato', 'responsavel'],
    });

    if (!interacao) {
      throw new NotFoundException('Interação não encontrada');
    }

    return interacao;
  }

  async update(id: string, dto: UpdateInteracaoDto, empresaId: string): Promise<Interacao> {
    try {
      const existing = await this.findOne(id, empresaId);
      const sanitized = this.sanitize(dto);

      const updated = this.interacoesRepository.merge(existing, sanitized);
      await this.interacoesRepository.save(updated);

      if (dto.agenda_evento) {
        if (existing.agenda_event_id) {
          await this.agendaService.update(
            existing.agenda_event_id,
            {
              ...dto.agenda_evento,
              titulo: dto.agenda_evento.titulo || dto.titulo || existing.titulo || 'Interação',
            },
            empresaId,
          );
        } else {
          const agenda = await this.agendaService.create(
            {
              ...dto.agenda_evento,
              titulo: dto.agenda_evento.titulo || dto.titulo || existing.titulo || 'Interação',
              interacao_id: existing.id,
            },
            empresaId,
          );

          await this.interacoesRepository.update(existing.id, { agenda_event_id: agenda.id });
        }
      }

      return this.findOne(id, empresaId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro ao atualizar interação');
    }
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const existing = await this.findOne(id, empresaId);
    await this.interacoesRepository.remove(existing);
  }

  async getEstatisticas(empresaId: string) {
    try {
      const result = await this.interacoesRepository
        .createQueryBuilder('interacao')
        .select('interacao.tipo', 'tipo')
        .addSelect('COUNT(*)', 'quantidade')
        .where('interacao.empresa_id = :empresaId', { empresaId })
        .groupBy('interacao.tipo')
        .getRawMany();

      const total = result.reduce((sum, item) => sum + Number(item.quantidade || 0), 0);

      return {
        total,
        porTipo: result.map((item) => ({
          tipo: item.tipo as TipoInteracao,
          quantidade: Number(item.quantidade || 0),
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException('Erro ao calcular estatísticas de interações');
    }
  }
}
