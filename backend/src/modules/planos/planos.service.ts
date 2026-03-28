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
import {
  DEFAULT_ESSENTIAL_MODULE_CODES,
  DEFAULT_MODULOS_SISTEMA,
  DEFAULT_PLANOS_SISTEMA,
} from './planos.defaults';

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
    await this.seedDefaultsIfEmpty();
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
    const codigoNormalizado = String(codigo || '').trim().toLowerCase();
    const codigosCanonicos = new Set(
      DEFAULT_PLANOS_SISTEMA.map((planoDefault) => String(planoDefault.codigo).toLowerCase()),
    );

    let plano = await this.planoRepository.findOne({
      where: { codigo },
      relations: ['modulosInclusos', 'modulosInclusos.modulo'],
    });

    if (!plano) {
      await this.seedDefaultsIfEmpty();
      plano = await this.planoRepository.findOne({
        where: { codigo },
        relations: ['modulosInclusos', 'modulosInclusos.modulo'],
      });
    }

    if (!plano) {
      throw new NotFoundException(`Plano com codigo ${codigo} nao encontrado`);
    }

    if (
      codigosCanonicos.has(codigoNormalizado) &&
      (!plano.modulosInclusos || plano.modulosInclusos.length === 0)
    ) {
      await this.bootstrapDefaults({ overwrite: false });
      plano = await this.planoRepository.findOne({
        where: { codigo },
        relations: ['modulosInclusos', 'modulosInclusos.modulo'],
      });
    }

    if (!plano || !plano.modulosInclusos || plano.modulosInclusos.length === 0) {
      throw new NotFoundException(`Plano com codigo ${codigo} sem modulos vinculados`);
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

    this.validarLimitesPlano(dados, { required: true });

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

    this.validarLimitesPlano(dados, { required: false });

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

  private validarLimitesPlano(
    dados: Partial<
      Pick<CriarPlanoDto, 'limiteUsuarios' | 'limiteClientes' | 'limiteStorage' | 'limiteApiCalls'>
    >,
    options: { required: boolean },
  ): void {
    this.validarLimiteNumerico('limiteUsuarios', dados.limiteUsuarios, options.required);
    this.validarLimiteNumerico('limiteClientes', dados.limiteClientes, options.required);
    this.validarLimiteNumerico('limiteStorage', dados.limiteStorage, options.required);
    this.validarLimiteNumerico('limiteApiCalls', dados.limiteApiCalls, options.required);
  }

  private validarLimiteNumerico(
    campo: 'limiteUsuarios' | 'limiteClientes' | 'limiteStorage' | 'limiteApiCalls',
    valor: number | null | undefined,
    required: boolean,
  ): void {
    if (valor === undefined || valor === null) {
      if (required) {
        throw new BadRequestException(`${this.getCampoLabel(campo)} e obrigatorio`);
      }
      return;
    }

    if (!Number.isInteger(valor)) {
      throw new BadRequestException(`${this.getCampoLabel(campo)} invalido. Use numero inteiro.`);
    }

    if (valor === 0 || valor < -1) {
      throw new BadRequestException(
        `${this.getCampoLabel(campo)} invalido. Use -1 para ilimitado ou inteiro >= 1.`,
      );
    }
  }

  private getCampoLabel(
    campo: 'limiteUsuarios' | 'limiteClientes' | 'limiteStorage' | 'limiteApiCalls',
  ): string {
    switch (campo) {
      case 'limiteUsuarios':
        return 'Limite de usuarios';
      case 'limiteClientes':
        return 'Limite de clientes';
      case 'limiteStorage':
        return 'Limite de storage';
      case 'limiteApiCalls':
        return 'Limite de API calls';
      default:
        return 'Limite do plano';
    }
  }

  private async validarModulosInclusos(modulosIds: string[]): Promise<string[]> {
    const moduloIdsNormalizados = Array.from(
      new Set((modulosIds || []).map((id) => String(id).trim()).filter(Boolean)),
    );

    if (moduloIdsNormalizados.length === 0) {
      throw new BadRequestException('Plano deve possuir ao menos um modulo vinculado');
    }

    const modulosInformados = await this.moduloSistemaRepository.find({
      where: { id: In(moduloIdsNormalizados) },
      select: ['id', 'codigo'],
    });

    const existentes = new Set(modulosInformados.map((modulo) => modulo.id));
    const modulosInvalidos = moduloIdsNormalizados.filter((id) => !existentes.has(id));

    if (modulosInvalidos.length > 0) {
      throw new BadRequestException(
        `Modulos informados nao existem no catalogo: ${modulosInvalidos.join(', ')}`,
      );
    }

    const modulosEssenciaisAtivos = await this.moduloSistemaRepository.find({
      where: { essencial: true, ativo: true },
      select: ['codigo'],
    });
    const codigosEssenciais = Array.from(
      new Set(
        (modulosEssenciaisAtivos.length > 0
          ? modulosEssenciaisAtivos.map((modulo) => modulo.codigo)
          : DEFAULT_ESSENTIAL_MODULE_CODES
        )
          .map((codigo) => String(codigo || '').trim().toUpperCase())
          .filter(Boolean),
      ),
    );

    if (codigosEssenciais.length > 0) {
      const codigosInformados = new Set(
        modulosInformados
          .map((modulo) => String(modulo.codigo || '').trim().toUpperCase())
          .filter(Boolean),
      );
      const essenciaisFaltantes = codigosEssenciais.filter((codigo) => !codigosInformados.has(codigo));

      if (essenciaisFaltantes.length > 0) {
        throw new BadRequestException(
          `Plano deve incluir os modulos essenciais: ${essenciaisFaltantes.join(', ')}`,
        );
      }
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

  async listarModulosDisponiveis(includeInactive = false): Promise<ModuloSistema[]> {
    await this.seedDefaultsIfEmpty();
    const where = includeInactive ? undefined : { ativo: true };

    return this.moduloSistemaRepository.find({
      where,
      order: { ordem: 'ASC', nome: 'ASC' },
    });
  }

  async criarModuloSistema(dados: Partial<ModuloSistema>): Promise<ModuloSistema> {
    const modulo = this.moduloSistemaRepository.create(dados);
    return this.moduloSistemaRepository.save(modulo);
  }

  async bootstrapDefaults(options?: { overwrite?: boolean }): Promise<{
    modulosCriados: number;
    modulosAtualizados: number;
    planosCriados: number;
    planosAtualizados: number;
    overwrite: boolean;
  }> {
    const overwrite = Boolean(options?.overwrite);
    let modulosCriados = 0;
    let modulosAtualizados = 0;
    let planosCriados = 0;
    let planosAtualizados = 0;

    const modulosByCode = new Map<string, ModuloSistema>();

    for (const moduloDefault of DEFAULT_MODULOS_SISTEMA) {
      let modulo = await this.moduloSistemaRepository.findOne({
        where: { codigo: moduloDefault.codigo },
      });

      if (!modulo) {
        modulo = this.moduloSistemaRepository.create({
          ...moduloDefault,
          ativo: true,
          essencial: Boolean(moduloDefault.essencial),
        });
        modulo = await this.moduloSistemaRepository.save(modulo);
        modulosCriados += 1;
      } else if (overwrite) {
        Object.assign(modulo, {
          ...moduloDefault,
          ativo: true,
          essencial: Boolean(moduloDefault.essencial),
        });
        modulo = await this.moduloSistemaRepository.save(modulo);
        modulosAtualizados += 1;
      }

      modulosByCode.set(moduloDefault.codigo, modulo);
    }

    for (const planoDefault of DEFAULT_PLANOS_SISTEMA) {
      let plano = await this.planoRepository.findOne({
        where: { codigo: planoDefault.codigo },
      });
      let convertedLegacyProfessional = false;

      if (!plano && planoDefault.codigo === 'business') {
        const legacyProfessional = await this.planoRepository.findOne({
          where: { codigo: 'professional' },
        });

        if (legacyProfessional) {
          plano = legacyProfessional;
          convertedLegacyProfessional = true;
        }
      }

      const payload = {
        nome: planoDefault.nome,
        codigo: planoDefault.codigo,
        descricao: planoDefault.descricao,
        preco: planoDefault.preco,
        limiteUsuarios: planoDefault.limiteUsuarios,
        limiteClientes: planoDefault.limiteClientes,
        limiteStorage: planoDefault.limiteStorage,
        limiteApiCalls: planoDefault.limiteApiCalls,
        whiteLabel: planoDefault.whiteLabel,
        suportePrioritario: planoDefault.suportePrioritario,
        ativo: true,
        ordem: planoDefault.ordem,
      };
      let shouldSyncModules = false;
      let existingModuleLinks = 0;

      if (!plano) {
        plano = this.planoRepository.create(payload);
        plano = await this.planoRepository.save(plano);
        planosCriados += 1;
        shouldSyncModules = true;
      } else if (overwrite || convertedLegacyProfessional) {
        const updatePayload = convertedLegacyProfessional && !overwrite
          ? {
              codigo: planoDefault.codigo,
              nome: planoDefault.nome,
              ativo: true,
              ordem: plano.ordem || planoDefault.ordem,
            }
          : payload;

        Object.assign(plano, updatePayload);
        plano = await this.planoRepository.save(plano);
        planosAtualizados += 1;
        shouldSyncModules = true;
      }

      if (plano && !shouldSyncModules) {
        existingModuleLinks = await this.planoModuloRepository.count({
          where: { plano: { id: plano.id } },
        });

        if (existingModuleLinks === 0) {
          shouldSyncModules = true;
        }
      }

      const moduleIds = planoDefault.modulosCodigos
        .map((codigo) => modulosByCode.get(codigo)?.id)
        .filter((id): id is string => Boolean(id));

      if (moduleIds.length === 0) {
        throw new BadRequestException(
          `Plano ${planoDefault.codigo} sem modulos validos para vinculo.`,
        );
      }

      if (shouldSyncModules) {
        await this.planoModuloRepository.delete({ plano: { id: plano.id } });
        await this.associarModulos(plano.id, moduleIds);
      }
    }

    return {
      modulosCriados,
      modulosAtualizados,
      planosCriados,
      planosAtualizados,
      overwrite,
    };
  }

  private async seedDefaultsIfEmpty(): Promise<void> {
    const planosExistentes = await this.planoRepository.find({
      select: ['codigo'],
    });
    const modulosExistentes = await this.moduloSistemaRepository.find({
      select: ['codigo'],
    });

    if (planosExistentes.length === 0 || modulosExistentes.length === 0) {
      await this.bootstrapDefaults({ overwrite: false });
      return;
    }

    const codigosPlanosExistentes = new Set(
      planosExistentes.map((plano) => String(plano.codigo || '').trim().toLowerCase()),
    );
    const codigosModulosExistentes = new Set(
      modulosExistentes.map((modulo) => String(modulo.codigo || '').trim().toLowerCase()),
    );

    const faltamPlanosCanonicos = DEFAULT_PLANOS_SISTEMA.some(
      (planoDefault) => !codigosPlanosExistentes.has(String(planoDefault.codigo).toLowerCase()),
    );
    const faltamModulosCanonicos = DEFAULT_MODULOS_SISTEMA.some(
      (moduloDefault) => !codigosModulosExistentes.has(String(moduloDefault.codigo).toLowerCase()),
    );

    if (!faltamPlanosCanonicos && !faltamModulosCanonicos) {
      return;
    }

    await this.bootstrapDefaults({ overwrite: false });
  }
}
