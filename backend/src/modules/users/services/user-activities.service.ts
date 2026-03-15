import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserActivity, AtividadeTipo } from '../entities/user-activity.entity';
import { User } from '../user.entity';

@Injectable()
export class UserActivitiesService {
  private readonly logger = new Logger(UserActivitiesService.name);

  constructor(
    @InjectRepository(UserActivity)
    private readonly userActivityRepository: Repository<UserActivity>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async listarAtividades(
    empresaId: string,
    filters: {
      limit?: number;
      usuarioId?: string;
      tipo?: AtividadeTipo;
      dataInicio?: string;
      dataFim?: string;
    } = {},
  ): Promise<any[]> {
    try {
      this.logger.log(`Listando atividades recentes para empresa ${empresaId}`);

      const requestedLimit =
        typeof filters.limit === 'number' && Number.isFinite(filters.limit) ? filters.limit : 20;
      const limit = Math.max(1, Math.min(200, Math.trunc(requestedLimit)));

      const query = this.userActivityRepository
        .createQueryBuilder('activity')
        .leftJoinAndSelect('activity.usuario', 'usuario')
        .where('activity.empresaId = :empresaId', { empresaId })
        .orderBy('activity.createdAt', 'DESC')
        .take(limit);

      if (filters.usuarioId) {
        query.andWhere('activity.usuarioId = :usuarioId', { usuarioId: filters.usuarioId });
      }

      if (filters.tipo) {
        query.andWhere('activity.tipo = :tipo', { tipo: filters.tipo });
      }

      if (filters.dataInicio) {
        const parsed = new Date(filters.dataInicio);
        if (!Number.isNaN(parsed.getTime())) {
          query.andWhere('activity.createdAt >= :dataInicio', { dataInicio: parsed.toISOString() });
        }
      }

      if (filters.dataFim) {
        const parsed = new Date(filters.dataFim);
        if (!Number.isNaN(parsed.getTime())) {
          query.andWhere('activity.createdAt <= :dataFim', { dataFim: parsed.toISOString() });
        }
      }

      const atividades = await query.getMany();

      // Transformar para o formato esperado pelo frontend
      return atividades.map((atividade) => ({
        id: atividade.id,
        tipo: this.mapTipoAtividade(atividade.tipo),
        usuario: {
          nome: atividade.usuario?.nome || 'Usuário desconhecido',
          avatar_url: atividade.usuario?.avatar_url,
        },
        descricao: atividade.descricao,
        timestamp: atividade.createdAt,
        detalhes: atividade.detalhes,
      }));
    } catch (error) {
      this.logger.error('Erro ao listar atividades:', error.message);
      return [];
    }
  }

  private mapTipoAtividade(tipo: AtividadeTipo): string {
    // Map do enum do backend para as strings do frontend
    const mapeamento = {
      [AtividadeTipo.LOGIN]: 'login',
      [AtividadeTipo.LOGOUT]: 'logout',
      [AtividadeTipo.CRIACAO]: 'criacao',
      [AtividadeTipo.EDICAO]: 'edicao',
      [AtividadeTipo.EXCLUSAO]: 'exclusao',
      [AtividadeTipo.ALTERACAO_STATUS]: 'alteracao_status',
      [AtividadeTipo.RESET_SENHA]: 'reset_senha',
    };

    return mapeamento[tipo] || 'login';
  }

  async registrarAtividade(
    usuarioId: string,
    empresaId: string,
    tipo: AtividadeTipo,
    descricao: string,
    detalhes?: string,
  ): Promise<UserActivity> {
    try {
      const novaAtividade = this.userActivityRepository.create({
        usuarioId,
        empresaId,
        tipo,
        descricao,
        detalhes,
      });

      return await this.userActivityRepository.save(novaAtividade);
    } catch (error) {
      this.logger.error(`Erro ao registrar atividade: ${error.message}`);
      throw error;
    }
  }
}
