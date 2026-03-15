import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaModulo, ModuloEnum, PlanoEnum } from '../entities/empresa-modulo.entity';
import { CreateEmpresaModuloDto } from '../dto/create-empresa-modulo.dto';
import { UpdateEmpresaModuloDto } from '../dto/update-empresa-modulo.dto';

@Injectable()
export class EmpresaModuloService {
  private readonly logger = new Logger(EmpresaModuloService.name);

  constructor(
    @InjectRepository(EmpresaModulo)
    private readonly empresaModuloRepository: Repository<EmpresaModulo>,
  ) {}

  private normalizeModuloCode(value: string): string {
    return String(value || '')
      .trim()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]+/g, '_');
  }

  private mapearPlanoCodigoParaEnum(plano?: string | null): PlanoEnum | null {
    const normalized = String(plano || '').trim().toUpperCase();
    if (!normalized) {
      return null;
    }

    const aliases: Record<string, PlanoEnum> = {
      STARTER: PlanoEnum.STARTER,
      BASIC: PlanoEnum.STARTER,
      BASICO: PlanoEnum.STARTER,
      BUSINESS: PlanoEnum.BUSINESS,
      PROFESSIONAL: PlanoEnum.BUSINESS,
      PRO: PlanoEnum.BUSINESS,
      ENTERPRISE: PlanoEnum.ENTERPRISE,
      PREMIUM: PlanoEnum.ENTERPRISE,
      EMPRESARIAL: PlanoEnum.ENTERPRISE,
    };

    return aliases[normalized] || null;
  }

  async sincronizarModulosPlano(
    empresa_id: string,
    modulosCodigos: string[],
    planoCodigo?: string | null,
  ): Promise<void> {
    const codigosNormalizados = Array.from(
      new Set(
        (modulosCodigos || [])
          .map((codigo) => this.normalizeModuloCode(codigo))
          .filter(Boolean),
      ),
    );

    if (codigosNormalizados.length === 0) {
      throw new BadRequestException('Plano sem modulos validos para sincronizacao');
    }

    const planoEnum = this.mapearPlanoCodigoParaEnum(planoCodigo);
    const existentes = await this.empresaModuloRepository.find({
      where: { empresaId: empresa_id },
    });

    const existentesPorCodigo = new Map<string, EmpresaModulo>();
    for (const registro of existentes) {
      const codigoNormalizado = this.normalizeModuloCode(String(registro.modulo || ''));
      if (codigoNormalizado) {
        existentesPorCodigo.set(codigoNormalizado, registro);
      }
    }

    for (const codigo of codigosNormalizados) {
      const existente = existentesPorCodigo.get(codigo);

      if (existente) {
        const precisaAtualizar =
          !existente.ativo ||
          existente.plano !== (planoEnum ?? existente.plano) ||
          Boolean(existente.data_expiracao);

        if (precisaAtualizar) {
          await this.empresaModuloRepository.update(existente.id, {
            ativo: true,
            data_ativacao: new Date(),
            data_expiracao: null,
            plano: planoEnum ?? existente.plano,
          });
        }
        continue;
      }

      const novoModulo = this.empresaModuloRepository.create({
        empresaId: empresa_id,
        modulo: codigo as ModuloEnum,
        ativo: true,
        data_ativacao: new Date(),
        data_expiracao: null,
        plano: planoEnum,
      });
      await this.empresaModuloRepository.save(novoModulo);
    }

    for (const registro of existentes) {
      const codigoRegistro = this.normalizeModuloCode(String(registro.modulo || ''));
      if (registro.ativo && !codigosNormalizados.includes(codigoRegistro)) {
        await this.empresaModuloRepository.update(registro.id, { ativo: false });
      }
    }

    this.logger.log(
      `Sincronizacao de modulos concluida para empresa ${empresa_id}: ${codigosNormalizados.join(', ')}`,
    );
  }

  /**
   * Verifica se empresa tem módulo ativo
   * @param empresa_id ID da empresa
   * @param modulo Módulo a verificar
   * @returns true se módulo está ativo
   */
  async isModuloAtivo(empresa_id: string, modulo: ModuloEnum): Promise<boolean> {
    try {
      const registro = await this.empresaModuloRepository.findOne({
        where: { empresaId: empresa_id, modulo, ativo: true },
      });

      // Verificar se expirou
      if (registro && registro.data_expiracao) {
        const agora = new Date();
        if (agora > registro.data_expiracao) {
          // Módulo expirou, desativar automaticamente
          await this.empresaModuloRepository.update(registro.id, { ativo: false });
          return false;
        }
      }

      return !!registro;
    } catch (error) {
      console.error(`Erro ao verificar módulo ${modulo} para empresa ${empresa_id}:`, error);
      return false;
    }
  }

  /**
   * Lista todos os módulos ativos de uma empresa
   * @param empresa_id ID da empresa
   * @returns Array de módulos ativos
   */
  async listarModulosAtivos(empresa_id: string): Promise<ModuloEnum[]> {
    try {
      const modulos = await this.empresaModuloRepository.find({
        where: { empresaId: empresa_id, ativo: true },
        select: ['modulo'],
      });

      // Filtrar expirados
      const modulosValidos: ModuloEnum[] = [];
      for (const m of modulos) {
        const registro = await this.empresaModuloRepository.findOne({
          where: { empresaId: empresa_id, modulo: m.modulo },
        });

        if (registro && registro.data_expiracao) {
          const agora = new Date();
          if (agora > registro.data_expiracao) {
            await this.empresaModuloRepository.update(registro.id, { ativo: false });
            continue;
          }
        }

        modulosValidos.push(m.modulo);
      }

      return modulosValidos;
    } catch (error) {
      console.error(`Erro ao listar módulos ativos da empresa ${empresa_id}:`, error);
      return [];
    }
  }

  /**
   * Lista todos os módulos de uma empresa (ativos e inativos)
   * @param empresa_id ID da empresa
   * @returns Array de módulos
   */
  async listar(empresa_id: string): Promise<EmpresaModulo[]> {
    return await this.empresaModuloRepository.find({
      where: { empresaId: empresa_id },
      order: { modulo: 'ASC' },
    });
  }

  /**
   * Ativa módulo para empresa
   * @param empresa_id ID da empresa
   * @param dto Dados do módulo
   * @returns Módulo criado/atualizado
   */
  async ativar(empresa_id: string, dto: CreateEmpresaModuloDto): Promise<EmpresaModulo> {
    try {
      // Verificar se já existe
      const existente = await this.empresaModuloRepository.findOne({
        where: { empresaId: empresa_id, modulo: dto.modulo },
      });

      if (existente) {
        await this.empresaModuloRepository.update(existente.id, {
          ativo: true,
          data_ativacao: new Date(),
          data_expiracao: dto.data_expiracao ? new Date(dto.data_expiracao) : null,
          plano: dto.plano || existente.plano,
        });

        return await this.empresaModuloRepository.findOne({ where: { id: existente.id } });
      }

      const novoModulo = this.empresaModuloRepository.create({
        empresaId: empresa_id,
        modulo: dto.modulo,
        ativo: dto.ativo !== undefined ? dto.ativo : true,
        data_expiracao: dto.data_expiracao ? new Date(dto.data_expiracao) : null,
        plano: dto.plano || PlanoEnum.STARTER,
      });

      return await this.empresaModuloRepository.save(novoModulo);
    } catch (error) {
      this.logger.error(
        `Erro ao ativar módulo ${dto.modulo} para empresa ${empresa_id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(`Erro ao ativar módulo ${dto.modulo}`);
    }
  }

  /**
   * Desativa módulo de empresa
   * @param empresa_id ID da empresa
   * @param modulo Módulo a desativar
   */
  async desativar(empresa_id: string, modulo: ModuloEnum): Promise<void> {
    const registro = await this.empresaModuloRepository.findOne({
      where: { empresaId: empresa_id, modulo },
    });

    if (!registro) {
      throw new NotFoundException(`Módulo ${modulo} não encontrado para esta empresa`);
    }

    await this.empresaModuloRepository.update(registro.id, { ativo: false });
  }

  /**
   * Atualiza dados do módulo
   * @param empresa_id ID da empresa
   * @param modulo Módulo a atualizar
   * @param dto Dados a atualizar
   */
  async atualizar(
    empresa_id: string,
    modulo: ModuloEnum,
    dto: UpdateEmpresaModuloDto,
  ): Promise<EmpresaModulo> {
    const registro = await this.empresaModuloRepository.findOne({
      where: { empresaId: empresa_id, modulo },
    });

    if (!registro) {
      throw new NotFoundException(`Módulo ${modulo} não encontrado para esta empresa`);
    }

    await this.empresaModuloRepository.update(registro.id, dto);
    return await this.empresaModuloRepository.findOne({ where: { id: registro.id } });
  }

  /**
   * Ativa plano completo para empresa
   * @param empresa_id ID da empresa
   * @param plano Plano a ativar
   */
  async ativarPlano(empresa_id: string, plano: PlanoEnum): Promise<void> {
    const modulosPorPlano = {
      [PlanoEnum.STARTER]: [ModuloEnum.CRM, ModuloEnum.ATENDIMENTO],
      [PlanoEnum.BUSINESS]: [
        ModuloEnum.CRM,
        ModuloEnum.ATENDIMENTO,
        ModuloEnum.VENDAS,
        ModuloEnum.FINANCEIRO,
      ],
      [PlanoEnum.ENTERPRISE]: [
        ModuloEnum.CRM,
        ModuloEnum.ATENDIMENTO,
        ModuloEnum.VENDAS,
        ModuloEnum.FINANCEIRO,
        ModuloEnum.BILLING,
        ModuloEnum.ADMINISTRACAO,
      ],
    };

    const modulos = modulosPorPlano[plano] || [];

    if (modulos.length === 0) {
      this.logger.warn(`Nenhum módulo encontrado para plano ${plano}`);
      return;
    }

    await this.sincronizarModulosPlano(empresa_id, modulos, plano);

    this.logger.log(`Plano ${plano} ativado para empresa ${empresa_id}: ${modulos.length} módulos`);
  }

  /**
   * Obter plano atual da empresa
   * @param empresa_id ID da empresa
   * @returns Plano atual ou null
   */
  async getPlanoAtual(empresa_id: string): Promise<PlanoEnum | null> {
    const modulos = await this.listar(empresa_id);
    if (modulos.length === 0) return null;

    // Retorna o plano mais comum nos módulos ativos
    const planosAtivos = modulos.filter((m) => m.ativo).map((m) => m.plano);
    if (planosAtivos.length === 0) return null;

    const planoCounts = planosAtivos.reduce(
      (acc, plano) => {
        if (plano) {
          acc[plano] = (acc[plano] || 0) + 1;
        }
        return acc;
      },
      {} as Record<PlanoEnum, number>,
    );

    return Object.keys(planoCounts).sort(
      (a, b) => planoCounts[b as PlanoEnum] - planoCounts[a as PlanoEnum],
    )[0] as PlanoEnum;
  }

  /**
   * [TEMPORÁRIO] Popula módulos para TODAS as empresas com plano ENTERPRISE
   * ⚠️ Método de migração - remover após uso inicial
   */
  async seedAllEmpresas(): Promise<any> {
    try {
      // Buscar todas as empresas
      const empresas = await this.empresaModuloRepository.query('SELECT id, nome FROM empresas');

      const modulos = Object.values(ModuloEnum);
      const results = [];

      for (const empresa of empresas) {
        for (const modulo of modulos) {
          // Verificar se já existe
          const existe = await this.empresaModuloRepository.findOne({
            where: { empresaId: empresa.id, modulo },
          });

          if (!existe) {
            // Criar novo registro
            const novoModulo = this.empresaModuloRepository.create({
              empresaId: empresa.id,
              modulo,
              ativo: true,
              plano: PlanoEnum.ENTERPRISE,
              data_ativacao: new Date(),
            });
            await this.empresaModuloRepository.save(novoModulo);
            results.push({ empresa: empresa.nome, modulo, status: 'criado' });
          } else {
            // Atualizar para ENTERPRISE e ativo
            await this.empresaModuloRepository.update(existe.id, {
              ativo: true,
              plano: PlanoEnum.ENTERPRISE,
            });
            results.push({ empresa: empresa.nome, modulo, status: 'atualizado' });
          }
        }
      }

      return {
        total_empresas: empresas.length,
        total_modulos: modulos.length,
        total_registros: results.length,
        detalhes: results,
      };
    } catch (error) {
      console.error('Erro ao popular módulos:', error);
      throw new BadRequestException(`Erro ao popular módulos: ${error.message}`);
    }
  }
}
