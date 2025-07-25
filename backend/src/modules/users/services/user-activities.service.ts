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

  async listarAtividades(empresaId: string, limit: number = 20): Promise<any[]> {
    try {
      this.logger.log(`Listando atividades recentes para empresa ${empresaId}`);
      
      // Buscar atividades mais recentes para a empresa
      const atividades = await this.userActivityRepository.find({
        where: { empresaId },
        order: { createdAt: 'DESC' },
        take: limit,
        relations: ['usuario'],
      });

      // Transformar para o formato esperado pelo frontend
      return atividades.map(atividade => ({
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
    detalhes?: string
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
