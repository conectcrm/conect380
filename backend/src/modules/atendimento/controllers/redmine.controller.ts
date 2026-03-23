import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaId } from '../../../common/decorators/empresa.decorator';
import { EmpresaGuard } from '../../../common/guards/empresa.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/permissions/permissions.constants';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateRedmineConfigDto } from '../dto/create-redmine-config.dto';
import { UpdateRedmineConfigDto } from '../dto/update-redmine-config.dto';
import { RedmineConfig } from '../entities/redmine-config.entity';
import { RedmineService } from '../services/redmine.service';

@Controller('redmine')
@UseGuards(JwtAuthGuard, EmpresaGuard, PermissionsGuard)
@Permissions(Permission.CONFIG_INTEGRACOES_MANAGE)
export class RedmineController {
  constructor(
    private readonly redmineService: RedmineService,
    @InjectRepository(RedmineConfig)
    private readonly configRepository: Repository<RedmineConfig>,
  ) {}

  @Get(['config', 'config/:empresaId'])
  async getConfig(@EmpresaId() empresaId: string) {
    const config = await this.redmineService.getConfig(empresaId);

    if (!config) {
      throw new HttpException('Configuracao Redmine nao encontrada', 404);
    }

    const { redmineApiKeyEncrypted, ...configSemApiKey } = config;
    return configSemApiKey;
  }

  @Post('config')
  async saveConfig(@EmpresaId() empresaId: string, @Body() dto: CreateRedmineConfigDto) {
    const existente = await this.configRepository.findOne({
      where: { empresaId },
    });

    if (existente) {
      Object.assign(existente, dto, { empresaId });
      const saved = await this.configRepository.save(existente);
      this.redmineService.clearClientCache(empresaId);
      return saved;
    }

    const config = this.configRepository.create({
      ...dto,
      empresaId,
    });

    return await this.configRepository.save(config);
  }

  @Put(['config', 'config/:empresaId'])
  async updateConfig(@EmpresaId() empresaId: string, @Body() dto: UpdateRedmineConfigDto) {
    const config = await this.configRepository.findOne({
      where: { empresaId },
    });

    if (!config) {
      throw new HttpException('Configuracao nao encontrada', 404);
    }

    Object.assign(config, dto, { empresaId });
    const saved = await this.configRepository.save(config);
    this.redmineService.clearClientCache(empresaId);

    return saved;
  }

  @Post('demanda/:demandaId/criar-issue')
  async criarIssue(@EmpresaId() empresaId: string, @Param('demandaId') demandaId: string) {
    return await this.redmineService.criarIssueParaDemanda(demandaId, empresaId);
  }

  @Post('demanda/:demandaId/atualizar-issue')
  async atualizarIssue(@EmpresaId() empresaId: string, @Param('demandaId') demandaId: string) {
    await this.redmineService.atualizarIssueRedmine(demandaId, empresaId);
    return { success: true, message: 'Issue atualizada com sucesso' };
  }

  @Get('demanda/:demandaId/integration')
  async getIntegration(@EmpresaId() empresaId: string, @Param('demandaId') demandaId: string) {
    const integration = await this.redmineService.getIntegration(demandaId, empresaId);

    if (!integration) {
      return {
        integrado: false,
        message: 'Demanda nao possui integracao com Redmine',
      };
    }

    return {
      integrado: true,
      ...integration,
      linkIssue: await this.redmineService.getLinkIssue(demandaId, empresaId),
    };
  }

  @Get('demanda/:demandaId/link')
  async getLinkIssue(@EmpresaId() empresaId: string, @Param('demandaId') demandaId: string) {
    const link = await this.redmineService.getLinkIssue(demandaId, empresaId);

    if (!link) {
      throw new HttpException('Issue nao encontrada', 404);
    }

    return { link };
  }

  @Post(['sincronizar', 'sincronizar/:empresaId'])
  async sincronizar(@EmpresaId() empresaId: string) {
    await this.redmineService.sincronizarDeRedmine(empresaId);
    return { success: true, message: 'Sincronizacao executada' };
  }

  @Post(['validar', 'validar/:empresaId'])
  async testarConexao(@EmpresaId() empresaId: string) {
    const sucesso = await this.redmineService.testarConexao(empresaId);

    if (!sucesso) {
      throw new HttpException('Falha ao conectar com Redmine', 500);
    }

    return { success: true, message: 'Conexao com Redmine OK' };
  }
}
