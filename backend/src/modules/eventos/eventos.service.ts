import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Evento } from './evento.entity';
import { CreateEventoDto, UpdateEventoDto } from './dto/evento.dto';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private eventosRepository: Repository<Evento>,
  ) {}

  async create(createEventoDto: CreateEventoDto): Promise<Evento> {
    const evento = this.eventosRepository.create({
      ...createEventoDto,
      dataInicio: new Date(createEventoDto.dataInicio),
      dataFim: createEventoDto.dataFim ? new Date(createEventoDto.dataFim) : undefined,
    });

    return await this.eventosRepository.save(evento);
  }

  async findAll(userId: string, empresaId: string): Promise<Evento[]> {
    return await this.eventosRepository.find({
      where: {
        usuarioId: userId,
        empresaId: empresaId,
      },
      order: { dataInicio: 'ASC' },
    });
  }

  async findByPeriod(
    userId: string,
    empresaId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Evento[]> {
    return await this.eventosRepository.find({
      where: {
        usuarioId: userId,
        empresaId: empresaId,
        dataInicio: Between(startDate, endDate),
      },
      order: { dataInicio: 'ASC' },
    });
  }
  async findOne(id: string, userId: string, empresaId: string): Promise<Evento> {
    const evento = await this.eventosRepository.findOne({
      where: {
        id,
        usuarioId: userId,
        empresaId: empresaId,
      },
    });

    if (!evento) {
      throw new NotFoundException('Evento não encontrado');
    }

    return evento;
  }

  async update(
    id: string,
    updateEventoDto: UpdateEventoDto,
    userId: string,
    empresaId: string,
  ): Promise<Evento> {
    const evento = await this.findOne(id, userId, empresaId);

    // Converter datas se fornecidas
    const updateData: any = { ...updateEventoDto };
    if (updateEventoDto.dataInicio) {
      updateData.dataInicio = new Date(updateEventoDto.dataInicio);
    }
    if (updateEventoDto.dataFim) {
      updateData.dataFim = new Date(updateEventoDto.dataFim);
    }

    await this.eventosRepository.update(id, updateData);
    return await this.findOne(id, userId, empresaId);
  }

  async remove(id: string, userId: string, empresaId: string): Promise<void> {
    const evento = await this.findOne(id, userId, empresaId);
    await this.eventosRepository.delete(id);
  }

  async findConflicts(
    userId: string,
    empresaId: string,
    start: Date,
    end: Date,
    excludeEventId?: string,
  ): Promise<Evento[]> {
    const query = this.eventosRepository
      .createQueryBuilder('evento')
      .where('evento.usuarioId = :userId', { userId })
      .andWhere('evento.empresaId = :empresaId', { empresaId })
      .andWhere('evento.diaInteiro = false')
      .andWhere('evento.dataInicio < :end', { end })
      .andWhere('evento.dataFim > :start', { start });

    if (excludeEventId) {
      query.andWhere('evento.id != :excludeEventId', { excludeEventId });
    }

    return await query.getMany();
  }

  async getEventsByTipo(userId: string, empresaId: string, tipo: string): Promise<Evento[]> {
    return await this.eventosRepository.find({
      where: {
        usuarioId: userId,
        empresaId: empresaId,
        tipo: tipo as any,
      },
      order: { dataInicio: 'ASC' },
    });
  }

  async getEventStatsByPeriod(
    dataInicio: string,
    dataFim: string,
    usuarioId?: string,
    empresaId?: string,
  ): Promise<any> {
    const startDate = new Date(dataInicio);
    const endDate = new Date(dataFim);

    const whereCondition: any = {
      dataInicio: Between(startDate, endDate),
    };

    // Filtrar por usuário se fornecido
    if (usuarioId) {
      whereCondition.usuarioId = usuarioId;
    }

    // Filtrar por empresa se fornecido
    if (empresaId) {
      whereCondition.empresaId = empresaId;
    }

    const eventos = await this.eventosRepository.find({
      where: whereCondition,
      order: { dataInicio: 'ASC' },
    });

    // Estatísticas por tipo - mapear todos os tipos do enum
    const estatisticasPorTipo = {
      reuniao: 0,
      ligacao: 0,
      apresentacao: 0,
      visita: 0,
      'follow-up': 0,
      outro: 0,
    };

    // Estatísticas por status
    const estatisticasPorStatus = {
      pendente: 0,
      confirmado: 0,
      cancelado: 0,
      concluido: 0,
    };

    // Estatísticas por local
    const estatisticasPorLocal = {
      presencial: 0,
      virtual: 0,
    };

    const totalEventos = eventos.length;
    let eventosConcluidos = 0;
    let proximosEventos = 0;
    let eventosHoje = 0;

    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    eventos.forEach((evento) => {
      // Contagem por tipo - incluir todos os tipos do enum
      if (estatisticasPorTipo.hasOwnProperty(evento.tipo)) {
        estatisticasPorTipo[evento.tipo]++;
      }

      // Verificar se é hoje
      if (evento.dataInicio >= inicioHoje && evento.dataInicio <= fimHoje) {
        eventosHoje++;
      }

      // Verificar se é futuro (próximos eventos)
      if (evento.dataInicio > hoje) {
        proximosEventos++;
      }

      // Lógica para eventos concluídos baseada em data
      // Evento concluído se já passou (dataFim < agora ou dataInicio < agora se não tem dataFim)
      if (evento.dataFim && evento.dataFim < hoje) {
        eventosConcluidos++;
        estatisticasPorStatus['concluido']++;
      } else if (!evento.dataFim && evento.dataInicio < inicioHoje) {
        // Evento sem dataFim que começou antes de hoje
        eventosConcluidos++;
        estatisticasPorStatus['concluido']++;
      } else if (evento.dataInicio > hoje) {
        // Evento futuro
        estatisticasPorStatus['pendente']++;
      } else {
        // Evento em andamento
        estatisticasPorStatus['confirmado']++;
      }

      // Classificação por local baseada no tipo
      if (evento.tipo === 'reuniao' || evento.tipo === 'apresentacao' || evento.tipo === 'visita') {
        estatisticasPorLocal.presencial++;
      } else {
        estatisticasPorLocal.virtual++;
      }
    });

    return {
      totalEventos,
      eventosConcluidos,
      proximosEventos,
      eventosHoje,
      estatisticasPorTipo,
      estatisticasPorStatus,
      estatisticasPorLocal,
      produtividade: totalEventos > 0 ? (eventosConcluidos / totalEventos) * 100 : 0,
    };
  }

  async getEventStatsCurrentMonth(userId: string, empresaId: string): Promise<any> {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    return await this.getEventStatsByPeriod(
      inicioMes.toISOString().split('T')[0],
      fimMes.toISOString().split('T')[0],
      userId,
      empresaId,
    );
  }

  async getEventStatsCurrentWeek(userId: string, empresaId: string): Promise<any> {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);

    return await this.getEventStatsByPeriod(
      inicioSemana.toISOString().split('T')[0],
      fimSemana.toISOString().split('T')[0],
      userId,
      empresaId,
    );
  }
}
