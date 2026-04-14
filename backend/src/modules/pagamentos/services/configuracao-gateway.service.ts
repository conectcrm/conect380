import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConfiguracaoGateway,
  GatewayMode,
  GatewayProvider,
} from '../entities/configuracao-gateway.entity';
import {
  CreateConfiguracaoGatewayDto,
  ListConfiguracoesGatewayDto,
  UpdateConfiguracaoGatewayDto,
} from '../dto/configuracao-gateway.dto';
import {
  assertGatewayProviderEnabled,
  shouldLogGatewayProviderBlockedInEnv,
} from './gateway-provider-support.util';

@Injectable()
export class ConfiguracaoGatewayService {
  private readonly logger = new Logger(ConfiguracaoGatewayService.name);

  constructor(
    @InjectRepository(ConfiguracaoGateway)
    private readonly configuracaoRepository: Repository<ConfiguracaoGateway>,
  ) {}

  async create(dto: CreateConfiguracaoGatewayDto, empresaId: string): Promise<ConfiguracaoGateway> {
    const modo = dto.modoOperacao ?? GatewayMode.SANDBOX;
    this.assertGatewayProviderEnabledWithTelemetry(dto.gateway, empresaId, 'configuracao.create');
    await this.ensureUniqueCombination(empresaId, dto.gateway, modo);

    const configuracao = this.configuracaoRepository.create({
      ...dto,
      empresa_id: empresaId,
      modoOperacao: modo,
      metodosPermitidos: dto.metodosPermitidos ?? [],
      credenciais: dto.credenciais ?? {},
      configuracoesAdicionais: dto.configuracoesAdicionais ?? null,
    });

    return this.configuracaoRepository.save(configuracao);
  }

  async findAll(
    empresaId: string,
    filtros: ListConfiguracoesGatewayDto = {} as ListConfiguracoesGatewayDto,
  ): Promise<ConfiguracaoGateway[]> {
    const query = this.configuracaoRepository
      .createQueryBuilder('configuracao')
      .where('configuracao.empresa_id = :empresaId', { empresaId })
      .orderBy('configuracao.created_at', 'DESC');

    if (filtros?.gateway) {
      query.andWhere('configuracao.gateway = :gateway', { gateway: filtros.gateway });
    }

    if (filtros?.modoOperacao) {
      query.andWhere('configuracao.modo_operacao = :modo', { modo: filtros.modoOperacao });
    }

    if (filtros?.status) {
      query.andWhere('configuracao.status = :status', { status: filtros.status });
    }

    return query.getMany();
  }

  async findOne(id: string, empresaId: string): Promise<ConfiguracaoGateway> {
    const configuracao = await this.configuracaoRepository.findOne({
      where: { id, empresa_id: empresaId },
    });

    if (!configuracao) {
      throw new NotFoundException('Configuração de gateway não encontrada');
    }

    return configuracao;
  }

  async update(
    id: string,
    dto: UpdateConfiguracaoGatewayDto,
    empresaId: string,
  ): Promise<ConfiguracaoGateway> {
    const configuracao = await this.findOne(id, empresaId);

    const targetGateway = dto.gateway ?? configuracao.gateway;
    const targetModo = dto.modoOperacao ?? configuracao.modoOperacao;
    this.assertGatewayProviderEnabledWithTelemetry(
      targetGateway,
      empresaId,
      'configuracao.update',
      { configuracaoId: configuracao.id },
    );

    if (dto.gateway || dto.modoOperacao || (dto.status && dto.status !== configuracao.status)) {
      await this.ensureUniqueCombination(empresaId, targetGateway, targetModo, configuracao.id);
    }

    Object.assign(configuracao, {
      ...dto,
      modoOperacao: targetModo,
      gateway: targetGateway,
      metodosPermitidos: dto.metodosPermitidos ?? configuracao.metodosPermitidos,
      credenciais: dto.credenciais ?? configuracao.credenciais,
      configuracoesAdicionais: dto.configuracoesAdicionais ?? configuracao.configuracoesAdicionais,
    });

    return this.configuracaoRepository.save(configuracao);
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const configuracao = await this.findOne(id, empresaId);
    await this.configuracaoRepository.remove(configuracao);
  }

  private async ensureUniqueCombination(
    empresaId: string,
    gateway: GatewayProvider,
    modo: GatewayMode,
    ignoreId?: string,
  ): Promise<void> {
    const existing = await this.configuracaoRepository.findOne({
      where: {
        empresa_id: empresaId,
        gateway,
        modoOperacao: modo,
      },
    });

    if (existing && existing.id !== ignoreId) {
      throw new ConflictException(
        'Já existe uma configuração ativa para este gateway e ambiente dentro da empresa',
      );
    }
  }

  private assertGatewayProviderEnabledWithTelemetry(
    gateway: GatewayProvider,
    empresaId: string,
    operation: string,
    extra: Record<string, unknown> = {},
  ): void {
    try {
      assertGatewayProviderEnabled(gateway);
    } catch (error) {
      if (error instanceof NotImplementedException && shouldLogGatewayProviderBlockedInEnv()) {
        this.logger.warn(
          JSON.stringify({
            event: 'gateway_provider_blocked',
            operation,
            empresaId,
            gateway,
            nodeEnv: process.env.NODE_ENV || process.env.APP_ENV || 'unknown',
            enabledProvidersRaw: process.env.PAGAMENTOS_GATEWAY_ENABLED_PROVIDERS || '',
            allowUnimplemented:
              String(process.env.PAGAMENTOS_GATEWAY_ALLOW_UNIMPLEMENTED || '').toLowerCase() ===
              'true',
            ...extra,
          }),
        );
      }
      throw error;
    }
  }
}
