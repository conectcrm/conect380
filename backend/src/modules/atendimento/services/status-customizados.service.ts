import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusCustomizado } from '../../configuracoes-tickets/entities/status-customizado.entity';

@Injectable()
export class StatusCustomizadosService {
  constructor(
    @InjectRepository(StatusCustomizado)
    private readonly statusRepository: Repository<StatusCustomizado>,
  ) {}

  async listarPorEmpresa(empresaId: string): Promise<StatusCustomizado[]> {
    if (!empresaId) {
      console.warn('[StatusService] ⚠️ empresaId vazio, retornando array vazio');
      return [];
    }

    console.log(`[StatusService] 🔍 Buscando status para empresa: ${empresaId}`);
    const status = await this.statusRepository.find({
      where: { empresaId },
      relations: ['nivel'],
      order: { ordem: 'ASC' },
    });
    console.log(`[StatusService] ✅ ${status.length} status encontrados`);
    return status;
  }

  async listarPorNivel(empresaId: string, nivelId: string): Promise<StatusCustomizado[]> {
    if (!empresaId || !nivelId) {
      console.warn('[StatusService] ⚠️ empresaId ou nivelId vazio');
      return [];
    }

    console.log(`[StatusService] 🔍 Buscando status para empresa: ${empresaId}, nível: ${nivelId}`);
    const status = await this.statusRepository.find({
      where: { empresaId, nivelId },
      order: { ordem: 'ASC' },
    });
    console.log(`[StatusService] ✅ ${status.length} status encontrados`);
    return status;
  }

  async buscarPorId(id: string, empresaId: string): Promise<StatusCustomizado> {
    return this.statusRepository.findOne({
      where: { id, empresaId },
      relations: ['nivel'],
    });
  }
}
