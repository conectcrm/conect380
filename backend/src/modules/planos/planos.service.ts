import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
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

  async listarTodos(includeInactive = false): Promise<Plano[]> {
    const where = includeInactive ? undefined : { ativo: true };

    return this.planoRepository.find({
      where,
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
      throw new NotFoundException(`Plano com ID ${id} nao encontrado`);
    }

    return plano;
  }

  async buscarPorCodigo(codigo: string): Promise<Plano> {
    const plano = await this.planoRepository.findOne({
      where: { codigo },
      relations: ['modulosInclusos', 'modulosInclusos.modulo'],
    });

    if (!plano) {
      throw new NotFoundException(`Plano com codigo ${codigo} nao encontrado`);
    }

    return plano;
  }

  async criar(dados: CriarPlanoDto): Promise<Plano> {
    const planoExistente = await this.planoRepository.findOne({
      where: { codigo: dados.codigo },
    });

    if (planoExistente) {
      throw new ConflictException(`Plano com codigo ${dados.codigo} ja existe`);
    }

    const modulosInclusos = await this.validarModulosInclusos(dados.modulosInclusos);

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
    await this.associarModulos(planoSalvo.id, modulosInclusos);

    return this.buscarPorId(planoSalvo.id);
  }

  async atualizar(id: string, dados: AtualizarPlanoDto): Promise<Plano> {
    const plano = await this.buscarPorId(id);

    if (dados.codigo && dados.codigo !== plano.codigo) {
      const planoExistente = await this.planoRepository.findOne({
        where: { codigo: dados.codigo },
      });

      if (planoExistente) {
        throw new ConflictException(`Plano com codigo ${dados.codigo} ja existe`);
      }
    }

    const modulosInclusos = await this.validarModulosInclusos(dados.modulosInclusos);
    const { modulosInclusos: _ignored, ...dadosPlano } = dados;

    Object.assign(plano, dadosPlano);
    const planoAtualizado = await this.planoRepository.save(plano);

    await this.planoModuloRepository.delete({ plano: { id } });
    await this.associarModulos(id, modulosInclusos);

    return this.buscarPorId(planoAtualizado.id);
  }

  async remover(id: string): Promise<void> {
    const plano = await this.buscarPorId(id);

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
        `Nao e possivel excluir este plano pois existem ${assinaturasAtivas[0].total} empresa(s) com assinatura ativa. Desative o plano ao inves de exclui-lo.`,
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

  private async validarModulosInclusos(modulosIds: string[]): Promise<string[]> {
    const moduloIdsNormalizados = Array.from(
      new Set((modulosIds || []).map((id) => String(id).trim()).filter(Boolean)),
    );

    if (moduloIdsNormalizados.length === 0) {
      throw new BadRequestException('Plano deve possuir ao menos um modulo vinculado');
    }

    const modulosExistentes = await this.moduloSistemaRepository.find({
      where: { id: In(moduloIdsNormalizados) },
      select: ['id'],
    });

    const existentes = new Set(modulosExistentes.map((modulo) => modulo.id));
    const modulosInvalidos = moduloIdsNormalizados.filter((id) => !existentes.has(id));

    if (modulosInvalidos.length > 0) {
      throw new BadRequestException(
        `Modulos informados nao existem no catalogo: ${modulosInvalidos.join(', ')}`,
      );
    }

    return moduloIdsNormalizados;
  }

  private async associarModulos(planoId: string, modulosIds: string[]): Promise<void> {
    if (modulosIds.length === 0) {
      return;
    }

    const vinculos = modulosIds.map((moduloId) =>
      this.planoModuloRepository.create({
        plano: { id: planoId },
        modulo: { id: moduloId },
      }),
    );

    await this.planoModuloRepository.save(vinculos);
  }

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
