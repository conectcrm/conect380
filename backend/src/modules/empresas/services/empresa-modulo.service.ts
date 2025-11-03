import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaModulo, ModuloEnum, PlanoEnum } from '../entities/empresa-modulo.entity';
import { CreateEmpresaModuloDto } from '../dto/create-empresa-modulo.dto';
import { UpdateEmpresaModuloDto } from '../dto/update-empresa-modulo.dto';

@Injectable()
export class EmpresaModuloService {
  constructor(
    @InjectRepository(EmpresaModulo)
    private readonly empresaModuloRepository: Repository<EmpresaModulo>,
  ) {}

  /**
   * Verifica se empresa tem módulo ativo
   * @param empresa_id ID da empresa
   * @param modulo Módulo a verificar
   * @returns true se módulo está ativo
   */
  async isModuloAtivo(empresa_id: string, modulo: ModuloEnum): Promise<boolean> {
    try {
      const registro = await this.empresaModuloRepository.findOne({
        where: { empresa_id, modulo, ativo: true },
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
        where: { empresa_id, ativo: true },
        select: ['modulo'],
      });

      // Filtrar expirados
      const modulosValidos: ModuloEnum[] = [];
      for (const m of modulos) {
        const registro = await this.empresaModuloRepository.findOne({
          where: { empresa_id, modulo: m.modulo },
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
      where: { empresa_id },
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
    // Verificar se já existe
    const existente = await this.empresaModuloRepository.findOne({
      where: { empresa_id, modulo: dto.modulo },
    });

    if (existente) {
      // Atualizar existente
      await this.empresaModuloRepository.update(existente.id, {
        ativo: true,
        data_ativacao: new Date(),
        data_expiracao: dto.data_expiracao ? new Date(dto.data_expiracao) : null,
        plano: dto.plano || existente.plano,
      });

      return await this.empresaModuloRepository.findOne({ where: { id: existente.id } });
    }

    // Criar novo
    const novoModulo = this.empresaModuloRepository.create({
      empresa_id,
      modulo: dto.modulo,
      ativo: dto.ativo !== undefined ? dto.ativo : true,
      data_expiracao: dto.data_expiracao ? new Date(dto.data_expiracao) : null,
      plano: dto.plano || PlanoEnum.STARTER,
    });

    return await this.empresaModuloRepository.save(novoModulo);
  }

  /**
   * Desativa módulo de empresa
   * @param empresa_id ID da empresa
   * @param modulo Módulo a desativar
   */
  async desativar(empresa_id: string, modulo: ModuloEnum): Promise<void> {
    const registro = await this.empresaModuloRepository.findOne({
      where: { empresa_id, modulo },
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
      where: { empresa_id, modulo },
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
      [PlanoEnum.STARTER]: [ModuloEnum.ATENDIMENTO], // Exemplo: Starter só Atendimento
      [PlanoEnum.BUSINESS]: [ModuloEnum.ATENDIMENTO, ModuloEnum.CRM, ModuloEnum.VENDAS],
      [PlanoEnum.ENTERPRISE]: [
        ModuloEnum.ATENDIMENTO,
        ModuloEnum.CRM,
        ModuloEnum.VENDAS,
        ModuloEnum.FINANCEIRO,
        ModuloEnum.BILLING,
        ModuloEnum.ADMINISTRACAO,
      ],
    };

    const modulos = modulosPorPlano[plano] || [];

    // Ativar módulos do plano
    for (const modulo of modulos) {
      await this.ativar(empresa_id, { modulo, ativo: true, plano });
    }

    // Desativar módulos que não estão no plano
    const todosModulos = Object.values(ModuloEnum);
    for (const modulo of todosModulos) {
      if (!modulos.includes(modulo)) {
        try {
          await this.desativar(empresa_id, modulo);
        } catch (error) {
          // Ignora se módulo não existe
        }
      }
    }
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

    const planoCounts = planosAtivos.reduce((acc, plano) => {
      if (plano) {
        acc[plano] = (acc[plano] || 0) + 1;
      }
      return acc;
    }, {} as Record<PlanoEnum, number>);

    return Object.keys(planoCounts).sort(
      (a, b) => planoCounts[b as PlanoEnum] - planoCounts[a as PlanoEnum],
    )[0] as PlanoEnum;
  }
}
