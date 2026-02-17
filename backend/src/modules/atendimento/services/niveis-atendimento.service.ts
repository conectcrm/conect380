import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NivelAtendimento } from '../../configuracoes-tickets/entities/nivel-atendimento.entity';

@Injectable()
export class NiveisAtendimentoService {
  constructor(
    @InjectRepository(NivelAtendimento)
    private readonly nivelRepository: Repository<NivelAtendimento>,
  ) {}

  async listarPorEmpresa(empresaId: string): Promise<NivelAtendimento[]> {
    if (!empresaId) {
      console.warn('[NiveisService] ⚠️ empresaId vazio, retornando array vazio');
      return [];
    }

    console.log(`[NiveisService] 🔍 Buscando níveis para empresa: ${empresaId}`);
    const niveis = await this.nivelRepository.find({
      where: { empresaId, ativo: true },
      order: { ordem: 'ASC' },
    });
    console.log(`[NiveisService] ✅ ${niveis.length} níveis encontrados`);
    return niveis;
  }

  async buscarPorId(id: string, empresaId: string): Promise<NivelAtendimento> {
    return this.nivelRepository.findOne({ where: { id, empresaId } });
  }
}
