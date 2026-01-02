import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoServico } from '../../configuracoes-tickets/entities/tipo-servico.entity';

@Injectable()
export class TiposServicoService {
  constructor(
    @InjectRepository(TipoServico)
    private readonly tipoRepository: Repository<TipoServico>,
  ) { }

  async listarPorEmpresa(empresaId: string): Promise<TipoServico[]> {
    if (!empresaId) {
      console.warn('[TiposService] ⚠️ empresaId vazio, retornando array vazio');
      return [];
    }

    console.log(`[TiposService] 🔍 Buscando tipos para empresa: ${empresaId}`);
    const tipos = await this.tipoRepository.find({
      where: { empresaId, ativo: true },
      order: { ordem: 'ASC' },
    });
    console.log(`[TiposService] ✅ ${tipos.length} tipos encontrados`);
    return tipos;
  }

  async buscarPorId(id: string): Promise<TipoServico> {
    return this.tipoRepository.findOne({ where: { id } });
  }
}
