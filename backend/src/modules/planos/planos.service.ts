import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Plano } from './entities/plano.entity';
import { ModuloSistema } from './entities/modulo-sistema.entity';
import { PlanoModulo } from './entities/plano-modulo.entity';
import { CriarPlanoDto } from './dto/criar-plano.dto';
import { AtualizarPlanoDto } from './dto/atualizar-plano.dto';

@Injectable()
export class PlanosService {
  constructor(
    @InjectRepository(Plano)
    private planoRepository: Repository<Plano>,

    @InjectRepository(ModuloSistema)
    private moduloSistemaRepository: Repository<ModuloSistema>,

    @InjectRepository(PlanoModulo)
    private planoModuloRepository: Repository<PlanoModulo>,

    private dataSource: DataSource,
  ) {}

  async listarTodos(): Promise<Plano[]> {
    return this.planoRepository.find({
      where: { ativo: true },
      relations: ['modulosInclusos', 'modulosInclusos.modulo'],
      order: { ordem: 'ASC', preco: 'ASC' },
    });
  }

  async buscarPorId(id: string): Promise<Plano> {
    const plano = await this.planoRepository.findOne({
      where: { id },
      relations: ['modulosInclusos', 'modulosInclusos.modulo'],
    });

    if (!plano) {
      throw new NotFoundException(`Plano com ID ${id} não encontrado`);
    }

    return plano;
  }

  async buscarPorCodigo(codigo: string): Promise<Plano> {
    const plano = await this.planoRepository.findOne({
      where: { codigo },
      relations: ['modulosInclusos', 'modulosInclusos.modulo'],
    });

    if (!plano) {
      throw new NotFoundException(`Plano com código ${codigo} não encontrado`);
    }

    return plano;
  }

  async criar(dados: CriarPlanoDto): Promise<Plano> {
    // Verificar se código já existe
    const planoExistente = await this.planoRepository.findOne({
      where: { codigo: dados.codigo },
    });

    if (planoExistente) {
      throw new ConflictException(`Plano com código ${dados.codigo} já existe`);
    }

    const plano = this.planoRepository.create({
      nome: dados.nome,
      codigo: dados.codigo,
      descricao: dados.descricao,
      preco: dados.preco,
      limiteUsuarios: dados.limiteUsuarios,
      limiteClientes: dados.limiteClientes,
      limiteStorage: dados.limiteStorage,
      limiteApiCalls: dados.limiteApiCalls,
      whiteLabel: dados.whiteLabel || false,
      suportePrioritario: dados.suportePrioritario || false,
      ativo: dados.ativo !== false,
      ordem: dados.ordem || 0,
    });

    const planoSalvo = await this.planoRepository.save(plano);

    // Associar módulos se fornecidos
    if (dados.modulosInclusos && dados.modulosInclusos.length > 0) {
      await this.associarModulos(planoSalvo.id, dados.modulosInclusos);
    }

    return this.buscarPorId(planoSalvo.id);
  }

  async atualizar(id: string, dados: AtualizarPlanoDto): Promise<Plano> {
    const plano = await this.buscarPorId(id);

    // Verificar conflito de código se estiver sendo alterado
    if (dados.codigo && dados.codigo !== plano.codigo) {
      const planoExistente = await this.planoRepository.findOne({
        where: { codigo: dados.codigo },
      });

      if (planoExistente) {
        throw new ConflictException(`Plano com código ${dados.codigo} já existe`);
      }
    }

    // Atualizar campos
    Object.assign(plano, dados);
    const planoAtualizado = await this.planoRepository.save(plano);

    // Atualizar módulos se fornecidos
    if (dados.modulosInclusos !== undefined) {
      // Remover associações existentes
      await this.planoModuloRepository.delete({ plano: { id } });

      // Adicionar novas associações
      if (dados.modulosInclusos.length > 0) {
        await this.associarModulos(id, dados.modulosInclusos);
      }
    }

    return this.buscarPorId(planoAtualizado.id);
  }

  async remover(id: string): Promise<void> {
    const plano = await this.buscarPorId(id);

    // Verificar se há assinaturas ativas vinculadas a este plano
    const assinaturasAtivas = await this.dataSource.query(
      `
      SELECT COUNT(*) as total 
      FROM assinaturas_empresas 
      WHERE plano_id = $1 AND status = 'ativa'
    `,
      [id],
    );

    if (assinaturasAtivas[0]?.total > 0) {
      throw new BadRequestException(
        `Não é possível excluir este plano pois existem ${assinaturasAtivas[0].total} empresa(s) com assinatura ativa. Desative o plano ao invés de excluí-lo.`,
      );
    }

    await this.planoRepository.remove(plano);
  }

  async desativar(id: string): Promise<Plano> {
    const plano = await this.buscarPorId(id);
    plano.ativo = false;
    return this.planoRepository.save(plano);
  }

  async ativar(id: string): Promise<Plano> {
    const plano = await this.buscarPorId(id);
    plano.ativo = true;
    return this.planoRepository.save(plano);
  }

  private async associarModulos(planoId: string, modulosIds: string[]): Promise<void> {
    for (const moduloId of modulosIds) {
      // Verificar se módulo existe
      const modulo = await this.moduloSistemaRepository.findOne({
        where: { id: moduloId },
      });

      if (modulo) {
        const planoModulo = this.planoModuloRepository.create({
          plano: { id: planoId },
          modulo: { id: moduloId },
        });

        await this.planoModuloRepository.save(planoModulo);
      }
    }
  }

  // Métodos para gerenciar módulos do sistema
  async listarModulosDisponiveis(): Promise<ModuloSistema[]> {
    return this.moduloSistemaRepository.find({
      where: { ativo: true },
      order: { ordem: 'ASC', nome: 'ASC' },
    });
  }

  async criarModuloSistema(dados: Partial<ModuloSistema>): Promise<ModuloSistema> {
    const modulo = this.moduloSistemaRepository.create(dados);
    return this.moduloSistemaRepository.save(modulo);
  }
}
