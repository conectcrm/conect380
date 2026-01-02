import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RedmineService } from '../services/redmine.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedmineConfig } from '../entities/redmine-config.entity';
import { CreateRedmineConfigDto } from '../dto/create-redmine-config.dto';
import { UpdateRedmineConfigDto } from '../dto/update-redmine-config.dto';

@Controller('redmine')
@UseGuards(JwtAuthGuard)
export class RedmineController {
  constructor(
    private readonly redmineService: RedmineService,
    @InjectRepository(RedmineConfig)
    private readonly configRepository: Repository<RedmineConfig>,
  ) { }

  /**
   * GET /redmine/config/:empresaId - Obter configuração Redmine
   */
  @Get('config/:empresaId')
  async getConfig(@Param('empresaId') empresaId: string) {
    const config = await this.redmineService.getConfig(empresaId);

    if (!config) {
      throw new HttpException('Configuração Redmine não encontrada', 404);
    }

    // Não retornar API key
    const { redmineApiKeyEncrypted, ...configSemApiKey } = config;
    return configSemApiKey;
  }

  /**
   * POST /redmine/config - Criar/atualizar configuração Redmine
   */
  @Post('config')
  async saveConfig(@Body() dto: CreateRedmineConfigDto) {
    // Verificar se já existe
    const existente = await this.configRepository.findOne({
      where: { empresaId: dto.empresaId },
    });

    if (existente) {
      // Atualizar
      Object.assign(existente, dto);
      const saved = await this.configRepository.save(existente);

      // Limpar cache do cliente HTTP
      this.redmineService.clearClientCache(dto.empresaId);

      return saved;
    }

    // Criar novo
    const config = this.configRepository.create(dto);
    return await this.configRepository.save(config);
  }

  /**
   * PUT /redmine/config/:empresaId - Atualizar configuração
   */
  @Put('config/:empresaId')
  async updateConfig(
    @Param('empresaId') empresaId: string,
    @Body() dto: UpdateRedmineConfigDto,
  ) {
    const config = await this.configRepository.findOne({
      where: { empresaId },
    });

    if (!config) {
      throw new HttpException('Configuração não encontrada', 404);
    }

    Object.assign(config, dto);
    const saved = await this.configRepository.save(config);

    // Limpar cache
    this.redmineService.clearClientCache(empresaId);

    return saved;
  }

  /**
   * POST /redmine/demanda/:demandaId/criar-issue - Criar issue no Redmine
   */
  @Post('demanda/:demandaId/criar-issue')
  async criarIssue(@Param('demandaId') demandaId: string) {
    return await this.redmineService.criarIssueParaDemanda(demandaId);
  }

  /**
   * POST /redmine/demanda/:demandaId/atualizar-issue - Atualizar issue no Redmine
   */
  @Post('demanda/:demandaId/atualizar-issue')
  async atualizarIssue(@Param('demandaId') demandaId: string) {
    await this.redmineService.atualizarIssueRedmine(demandaId);
    return { success: true, message: 'Issue atualizada com sucesso' };
  }

  /**
   * GET /redmine/demanda/:demandaId/integration - Obter status integração
   */
  @Get('demanda/:demandaId/integration')
  async getIntegration(@Param('demandaId') demandaId: string) {
    const integration = await this.redmineService.getIntegration(demandaId);

    if (!integration) {
      return {
        integrado: false,
        message: 'Demanda não possui integração com Redmine'
      };
    }

    return {
      integrado: true,
      ...integration,
      linkIssue: await this.redmineService.getLinkIssue(demandaId),
    };
  }

  /**
   * GET /redmine/demanda/:demandaId/link - Obter link da issue
   */
  @Get('demanda/:demandaId/link')
  async getLinkIssue(@Param('demandaId') demandaId: string) {
    const link = await this.redmineService.getLinkIssue(demandaId);

    if (!link) {
      throw new HttpException('Issue não encontrada', 404);
    }

    return { link };
  }

  /**
   * POST /redmine/sincronizar/:empresaId - Forçar sincronização bidirecional
   */
  @Post('sincronizar/:empresaId')
  async sincronizar(@Param('empresaId') empresaId: string) {
    await this.redmineService.sincronizarDeRedmine(empresaId);
    return { success: true, message: 'Sincronização executada' };
  }

  /**
   * POST /redmine/testar/:empresaId - Testar conexão
   */
  @Post('testar/:empresaId')
  async testarConexao(@Param('empresaId') empresaId: string) {
    const sucesso = await this.redmineService.testarConexao(empresaId);

    if (!sucesso) {
      throw new HttpException('Falha ao conectar com Redmine', 500);
    }

    return { success: true, message: 'Conexão com Redmine OK' };
  }
}
