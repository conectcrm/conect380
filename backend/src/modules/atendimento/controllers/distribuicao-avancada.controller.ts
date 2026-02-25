import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Permission } from '../../../common/permissions/permissions.constants';
import { DistribuicaoAvancadaService } from '../services/distribuicao-avancada.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DistribuicaoConfig } from '../entities/distribuicao-config.entity';
import { AtendenteSkill } from '../entities/atendente-skill.entity';
import { DistribuicaoLog } from '../entities/distribuicao-log.entity';
import { CreateDistribuicaoConfigDto } from '../dto/distribuicao/create-distribuicao-config.dto';
import { UpdateDistribuicaoConfigDto } from '../dto/distribuicao/update-distribuicao-config.dto';
import { CreateAtendenteSkillDto } from '../dto/distribuicao/create-atendente-skill.dto';
import { UpdateAtendenteSkillDto } from '../dto/distribuicao/update-atendente-skill.dto';

/**
 * Controller responsável pela gestão de distribuição automática avançada
 */
@Controller('distribuicao-avancada')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.ATENDIMENTO_FILAS_MANAGE)
export class DistribuicaoAvancadaController {
  private readonly logger = new Logger(DistribuicaoAvancadaController.name);

  constructor(
    private readonly distribuicaoService: DistribuicaoAvancadaService,

    @InjectRepository(DistribuicaoConfig)
    private readonly distribuicaoConfigRepo: Repository<DistribuicaoConfig>,

    @InjectRepository(AtendenteSkill)
    private readonly atendenteSkillRepo: Repository<AtendenteSkill>,

    @InjectRepository(DistribuicaoLog)
    private readonly distribuicaoLogRepo: Repository<DistribuicaoLog>,
  ) {}

  // ========================================
  // DISTRIBUIÇÃO DE TICKETS
  // ========================================

  /**
   * POST /distribuicao-avancada/distribuir/:ticketId
   * Distribui um ticket automaticamente
   */
  @Post('distribuir/:ticketId')
  @HttpCode(HttpStatus.OK)
  async distribuirTicket(
    @EmpresaId() empresaId: string,
    @Param('ticketId') ticketId: string,
    @Body() body: { requiredSkills?: string[] },
  ) {
    this.logger.log(`Distribuindo ticket ${ticketId}`);

    const atendente = await this.distribuicaoService.distribuirTicket(
      ticketId,
      body.requiredSkills,
      empresaId,
    );

    return {
      success: true,
      message: 'Ticket distribuído com sucesso',
      data: {
        ticketId,
        atendenteId: atendente.id,
        atendenteNome: atendente.nome,
      },
    };
  }

  /**
   * POST /distribuicao-avancada/realocar/:ticketId
   * Realoca um ticket para outro atendente
   */
  @Post('realocar/:ticketId')
  @HttpCode(HttpStatus.OK)
  async realocarTicket(
    @EmpresaId() empresaId: string,
    @Param('ticketId') ticketId: string,
    @Body() body: { novoAtendenteId: string; motivoRealocacao: string },
  ) {
    this.logger.log(`Realocando ticket ${ticketId} para ${body.novoAtendenteId}`);

    await this.distribuicaoService.realocarTicket(
      ticketId,
      body.novoAtendenteId,
      body.motivoRealocacao,
      empresaId,
    );

    return {
      success: true,
      message: 'Ticket realocado com sucesso',
    };
  }

  // ========================================
  // CONFIGURAÇÕES DE DISTRIBUIÇÃO
  // ========================================

  /**
   * GET /distribuicao-avancada/configuracoes
   * Lista todas as configurações de distribuição
   */
  @Get('configuracoes')
  async listarConfiguracoes(@EmpresaId() empresaId: string, @Query('filaId') filaId?: string) {
    const where = filaId ? { filaId, empresaId } : { empresaId };

    const configuracoes = await this.distribuicaoConfigRepo.find({
      where,
      relations: ['fila'],
      order: { fila: { nome: 'ASC' } },
    });

    return {
      success: true,
      data: configuracoes,
      total: configuracoes.length,
    };
  }

  /**
   * GET /distribuicao-avancada/configuracoes/:id
   * Busca configuração específica por ID
   */
  @Get('configuracoes/:id')
  async buscarConfiguracao(@EmpresaId() empresaId: string, @Param('id') id: string) {
    const config = await this.distribuicaoConfigRepo.findOne({
      where: { id, empresaId },
      relations: ['fila', 'filaBackup'],
    });

    if (!config) {
      return {
        success: false,
        message: 'Configuração não encontrada',
      };
    }

    return {
      success: true,
      data: config,
    };
  }

  /**
   * POST /distribuicao-avancada/configuracoes
   * Cria nova configuração de distribuição
   */
  @Post('configuracoes')
  @HttpCode(HttpStatus.CREATED)
  async criarConfiguracao(@EmpresaId() empresaId: string, @Body() dto: CreateDistribuicaoConfigDto) {
    this.logger.log(`Criando configuração para fila ${dto.filaId}`);

    const config = this.distribuicaoConfigRepo.create({ ...dto, empresaId });
    const saved = await this.distribuicaoConfigRepo.save(config);

    return {
      success: true,
      message: 'Configuração criada com sucesso',
      data: saved,
    };
  }

  /**
   * PUT /distribuicao-avancada/configuracoes/:id
   * Atualiza configuração existente
   */
  @Put('configuracoes/:id')
  async atualizarConfiguracao(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDistribuicaoConfigDto,
  ) {
    this.logger.log(`Atualizando configuração ${id}`);

    const config = await this.distribuicaoConfigRepo.findOne({
      where: { id, empresaId },
    });

    if (!config) {
      return {
        success: false,
        message: 'Configuração não encontrada',
      };
    }

    Object.assign(config, dto);
    const updated = await this.distribuicaoConfigRepo.save(config);

    return {
      success: true,
      message: 'Configuração atualizada com sucesso',
      data: updated,
    };
  }

  /**
   * DELETE /distribuicao-avancada/configuracoes/:id
   * Deleta configuração
   */
  @Delete('configuracoes/:id')
  async deletarConfiguracao(@EmpresaId() empresaId: string, @Param('id') id: string) {
    this.logger.log(`Deletando configuração ${id}`);

    const result = await this.distribuicaoConfigRepo.delete({ id, empresaId });

    if (result.affected === 0) {
      return {
        success: false,
        message: 'Configuração não encontrada',
      };
    }

    return {
      success: true,
      message: 'Configuração deletada com sucesso',
    };
  }

  // ========================================
  // SKILLS DE ATENDENTES
  // ========================================

  /**
   * GET /distribuicao-avancada/skills
   * Lista skills dos atendentes
   */
  @Get('skills')
  async listarSkills(@EmpresaId() empresaId: string, @Query('atendenteId') atendenteId?: string) {
    const where = atendenteId ? { atendenteId, empresaId } : { empresaId };

    const skills = await this.atendenteSkillRepo.find({
      where,
      relations: ['atendente'],
      order: { skill: 'ASC', nivel: 'DESC' },
    });

    return {
      success: true,
      data: skills,
      total: skills.length,
    };
  }

  /**
   * GET /distribuicao-avancada/skills/atendente/:atendenteId
   * Lista todas as skills de um atendente específico
   */
  @Get('skills/atendente/:atendenteId')
  async listarSkillsPorAtendente(
    @EmpresaId() empresaId: string,
    @Param('atendenteId') atendenteId: string,
  ) {
    const skills = await this.atendenteSkillRepo.find({
      where: { atendenteId, empresaId },
      order: { skill: 'ASC' },
    });

    return {
      success: true,
      data: skills,
      total: skills.length,
    };
  }

  /**
   * POST /distribuicao-avancada/skills
   * Adiciona skill para um atendente
   */
  @Post('skills')
  @HttpCode(HttpStatus.CREATED)
  async criarSkill(@EmpresaId() empresaId: string, @Body() dto: CreateAtendenteSkillDto) {
    this.logger.log(`Criando skill ${dto.skill} para atendente ${dto.atendenteId}`);

    // Verificar se skill já existe
    const skillExistente = await this.atendenteSkillRepo.findOne({
      where: {
        atendenteId: dto.atendenteId,
        skill: dto.skill,
        empresaId,
      },
    });

    if (skillExistente) {
      return {
        success: false,
        message: 'Skill já cadastrada para este atendente',
      };
    }

    const skill = this.atendenteSkillRepo.create({ ...dto, empresaId });
    const saved = await this.atendenteSkillRepo.save(skill);

    return {
      success: true,
      message: 'Skill criada com sucesso',
      data: saved,
    };
  }

  /**
   * PUT /distribuicao-avancada/skills/:id
   * Atualiza skill existente
   */
  @Put('skills/:id')
  async atualizarSkill(
    @EmpresaId() empresaId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAtendenteSkillDto,
  ) {
    this.logger.log(`Atualizando skill ${id}`);

    const skill = await this.atendenteSkillRepo.findOne({
      where: { id, empresaId },
    });

    if (!skill) {
      return {
        success: false,
        message: 'Skill não encontrada',
      };
    }

    Object.assign(skill, dto);
    const updated = await this.atendenteSkillRepo.save(skill);

    return {
      success: true,
      message: 'Skill atualizada com sucesso',
      data: updated,
    };
  }

  /**
   * DELETE /distribuicao-avancada/skills/:id
   * Deleta skill
   */
  @Delete('skills/:id')
  async deletarSkill(@EmpresaId() empresaId: string, @Param('id') id: string) {
    this.logger.log(`Deletando skill ${id}`);

    const result = await this.atendenteSkillRepo.delete({ id, empresaId });

    if (result.affected === 0) {
      return {
        success: false,
        message: 'Skill não encontrada',
      };
    }

    return {
      success: true,
      message: 'Skill deletada com sucesso',
    };
  }

  // ========================================
  // LOGS E AUDITORIA
  // ========================================

  /**
   * GET /distribuicao-avancada/logs
   * Lista logs de distribuição com filtros
   */
  @Get('logs')
  async listarLogs(
    @EmpresaId() empresaId: string,
    @Query('ticketId') ticketId?: string,
    @Query('atendenteId') atendenteId?: string,
    @Query('filaId') filaId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const where: any = { empresaId };

    if (ticketId) where.ticketId = ticketId;
    if (atendenteId) where.atendenteId = atendenteId;
    if (filaId) where.filaId = filaId;

    if (dataInicio && dataFim) {
      where.timestamp = Between(new Date(dataInicio), new Date(dataFim));
    }

    const [logs, total] = await this.distribuicaoLogRepo.findAndCount({
      where,
      relations: ['ticket', 'atendente', 'fila'],
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /distribuicao-avancada/metricas
   * Retorna métricas de distribuição
   */
  @Get('metricas')
  async obterMetricas(@EmpresaId() empresaId: string, @Query('filaId') filaId?: string) {
    const where = filaId ? { filaId, empresaId } : { empresaId };

    // Total de distribuições
    const totalDistribuicoes = await this.distribuicaoLogRepo.count({ where });

    // Distribuições por algoritmo
    const porAlgoritmo = await this.distribuicaoLogRepo
      .createQueryBuilder('log')
      .select('log.algoritmo', 'algoritmo')
      .addSelect('COUNT(log.id)', 'total')
      .where('log.empresaId = :empresaId', { empresaId })
      .andWhere(filaId ? 'log.filaId = :filaId' : '1=1', { filaId })
      .groupBy('log.algoritmo')
      .getRawMany();

    // Realocações
    const totalRealocacoes = await this.distribuicaoLogRepo.count({
      where: { ...where, realocacao: true },
    });

    // Distribuições nas últimas 24h
    const ultimas24h = new Date();
    ultimas24h.setHours(ultimas24h.getHours() - 24);

    const distribuicoesRecentes = await this.distribuicaoLogRepo.count({
      where: {
        ...where,
        timestamp: Between(ultimas24h, new Date()),
      },
    });

    return {
      success: true,
      data: {
        totalDistribuicoes,
        totalRealocacoes,
        distribuicoesRecentes,
        porAlgoritmo,
      },
    };
  }

  /**
   * GET /distribuicao-avancada/metricas-performance
   * Retorna métricas de performance do service (cache, tempo médio, taxa de sucesso)
   */
  @Get('metricas-performance')
  async obterMetricasPerformance() {
    const metricas = this.distribuicaoService.obterMetricas();

    return {
      success: true,
      message: 'Métricas de performance do service',
      data: metricas,
    };
  }

  /**
   * POST /distribuicao-avancada/limpar-cache
   * Limpa o cache de configurações e skills (útil para forçar reload)
   */
  @Post('limpar-cache')
  @HttpCode(HttpStatus.OK)
  async limparCache() {
    this.distribuicaoService.limparCache();

    return {
      success: true,
      message: 'Cache limpo com sucesso',
    };
  }

  /**
   * GET /distribuicao-avancada/skills-disponiveis
   * Lista todas as skills cadastradas no sistema (únicas)
   */
  @Get('skills-disponiveis')
  async listarSkillsDisponiveis(@EmpresaId() empresaId: string) {
    const skills = await this.atendenteSkillRepo
      .createQueryBuilder('skill')
      .select('DISTINCT skill.skill', 'skill')
      .where('skill.empresaId = :empresaId', { empresaId })
      .andWhere('skill.ativo = :ativo', { ativo: true })
      .orderBy('skill.skill', 'ASC')
      .getRawMany();

    return {
      success: true,
      data: skills.map((s) => s.skill),
      total: skills.length,
    };
  }
}
