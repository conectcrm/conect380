import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransacaoGateway } from '../entities/transacao-gateway.entity';
import { ConfiguracaoGateway } from '../entities/configuracao-gateway.entity';
import {
  CreateTransacaoGatewayDto,
  ListTransacoesGatewayDto,
  UpdateTransacaoGatewayDto,
} from '../dto/transacao-gateway.dto';
import {
  GatewayMetodoPagamento,
  GatewayOperacao,
  GatewayTransacaoStatus,
} from '../entities/transacao-gateway.entity';
import { Fatura } from '../../faturamento/entities/fatura.entity';
import { Pagamento } from '../../faturamento/entities/pagamento.entity';
import {
  assertGatewayProviderEnabled,
  shouldLogGatewayProviderBlockedInEnv,
} from './gateway-provider-support.util';

@Injectable()
export class PagamentosGatewayService {
  private readonly logger = new Logger(PagamentosGatewayService.name);

  constructor(
    @InjectRepository(TransacaoGateway)
    private readonly transacaoRepository: Repository<TransacaoGateway>,
    @InjectRepository(ConfiguracaoGateway)
    private readonly configuracaoRepository: Repository<ConfiguracaoGateway>,
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    @InjectRepository(Pagamento)
    private readonly pagamentoRepository: Repository<Pagamento>,
  ) {}

  async registrarTransacao(
    dto: CreateTransacaoGatewayDto,
    empresaId: string,
  ): Promise<TransacaoGateway> {
    await this.ensureUniqueReferencia(dto.referenciaGateway, empresaId);
    const configuracao = await this.getConfiguracao(dto.configuracaoId, empresaId);
    this.assertGatewayProviderEnabledWithTelemetry(
      configuracao.gateway,
      empresaId,
      'transacao.registrar',
      {
        configuracaoId: configuracao.id,
        referenciaGateway: dto.referenciaGateway,
      },
    );

    const fatura = dto.faturaId ? await this.getFatura(dto.faturaId, empresaId) : undefined;
    const pagamento = dto.pagamentoId
      ? await this.getPagamento(dto.pagamentoId, empresaId)
      : undefined;

    const taxa = dto.taxa ?? 0;
    const valorBruto = dto.valorBruto ?? 0;
    const valorLiquido = dto.valorLiquido ?? valorBruto - taxa;

    const transacao = this.transacaoRepository.create({
      empresa_id: empresaId,
      configuracaoId: configuracao.id,
      faturaId: fatura?.id,
      pagamentoId: pagamento?.id,
      referenciaGateway: dto.referenciaGateway,
      status: dto.status ?? GatewayTransacaoStatus.PENDENTE,
      tipoOperacao: dto.tipoOperacao ?? GatewayOperacao.COBRANCA,
      metodo: dto.metodo ?? GatewayMetodoPagamento.PIX,
      origem: dto.origem ?? 'api',
      valorBruto,
      valorLiquido,
      taxa,
      payloadEnvio: dto.payloadEnvio ?? {},
      payloadResposta: dto.payloadResposta ?? {},
      mensagemErro: dto.mensagemErro,
      processadoEm: dto.processadoEm ? new Date(dto.processadoEm) : undefined,
    });

    return this.transacaoRepository.save(transacao);
  }

  async listarTransacoes(
    empresaId: string,
    filtros: ListTransacoesGatewayDto = {} as ListTransacoesGatewayDto,
  ): Promise<TransacaoGateway[]> {
    const query = this.transacaoRepository
      .createQueryBuilder('transacao')
      .leftJoinAndSelect('transacao.configuracao', 'configuracao')
      .where('transacao.empresa_id = :empresaId', { empresaId })
      .orderBy('transacao.created_at', 'DESC');

    if (filtros?.status) {
      query.andWhere('transacao.status = :status', { status: filtros.status });
    }

    if (filtros?.metodo) {
      query.andWhere('transacao.metodo = :metodo', { metodo: filtros.metodo });
    }

    if (filtros?.tipoOperacao) {
      query.andWhere('transacao.tipo_operacao = :tipoOperacao', {
        tipoOperacao: filtros.tipoOperacao,
      });
    }

    if (filtros?.gateway) {
      query.andWhere('configuracao.gateway = :gateway', { gateway: filtros.gateway });
    }

    if (typeof filtros?.faturaId === 'number' && !isNaN(filtros.faturaId)) {
      query.andWhere('transacao.fatura_id = :faturaId', { faturaId: filtros.faturaId });
    }

    if (filtros?.configuracaoId) {
      query.andWhere('transacao.configuracao_id = :configuracaoId', {
        configuracaoId: filtros.configuracaoId,
      });
    }

    if (filtros?.referenciaGateway) {
      query.andWhere('transacao.referencia_gateway = :referencia', {
        referencia: filtros.referenciaGateway,
      });
    }

    return query.getMany();
  }

  async obterTransacao(id: string, empresaId: string): Promise<TransacaoGateway> {
    const transacao = await this.transacaoRepository.findOne({
      where: { id, empresa_id: empresaId },
      relations: ['configuracao'],
    });

    if (!transacao) {
      throw new NotFoundException('Transação de gateway não encontrada');
    }

    return transacao;
  }

  async atualizarTransacao(
    id: string,
    dto: UpdateTransacaoGatewayDto,
    empresaId: string,
  ): Promise<TransacaoGateway> {
    const transacao = await this.obterTransacao(id, empresaId);
    let gatewayEfetivo = transacao.configuracao?.gateway;

    if (dto.configuracaoId && dto.configuracaoId !== transacao.configuracaoId) {
      const configuracao = await this.getConfiguracao(dto.configuracaoId, empresaId);
      this.assertGatewayProviderEnabledWithTelemetry(
        configuracao.gateway,
        empresaId,
        'transacao.atualizar_configuracao',
        {
          transacaoId: transacao.id,
          configuracaoId: configuracao.id,
        },
      );
      transacao.configuracaoId = configuracao.id;
      (transacao as any).configuracao = configuracao;
      gatewayEfetivo = configuracao.gateway;
    }

    if (gatewayEfetivo) {
      this.assertGatewayProviderEnabledWithTelemetry(gatewayEfetivo, empresaId, 'transacao.atualizar', {
        transacaoId: transacao.id,
        configuracaoId: transacao.configuracaoId,
      });
    }

    if (dto.referenciaGateway && dto.referenciaGateway !== transacao.referenciaGateway) {
      await this.ensureUniqueReferencia(dto.referenciaGateway, empresaId, transacao.id);
      transacao.referenciaGateway = dto.referenciaGateway;
    }

    if (typeof dto.faturaId === 'number') {
      const fatura = await this.getFatura(dto.faturaId, empresaId);
      transacao.faturaId = fatura.id;
    }

    if (typeof dto.pagamentoId === 'number') {
      const pagamento = await this.getPagamento(dto.pagamentoId, empresaId);
      transacao.pagamentoId = pagamento.id;
    }

    if (dto.status) {
      transacao.status = dto.status;
    }

    if (dto.tipoOperacao) {
      transacao.tipoOperacao = dto.tipoOperacao;
    }

    if (dto.metodo) {
      transacao.metodo = dto.metodo;
    }

    if (dto.origem) {
      transacao.origem = dto.origem;
    }

    if (dto.valorBruto !== undefined) {
      transacao.valorBruto = dto.valorBruto;
    }

    if (dto.taxa !== undefined) {
      transacao.taxa = dto.taxa;
    }

    if (dto.valorLiquido !== undefined) {
      transacao.valorLiquido = dto.valorLiquido;
    } else if (dto.valorBruto !== undefined || dto.taxa !== undefined) {
      const taxa = dto.taxa ?? transacao.taxa ?? 0;
      const bruto = dto.valorBruto ?? transacao.valorBruto ?? 0;
      transacao.valorLiquido = Number(bruto) - Number(taxa);
    }

    if (dto.payloadEnvio) {
      transacao.payloadEnvio = { ...transacao.payloadEnvio, ...dto.payloadEnvio };
    }

    if (dto.payloadResposta) {
      transacao.payloadResposta = { ...transacao.payloadResposta, ...dto.payloadResposta };
    }

    if (dto.mensagemErro !== undefined) {
      transacao.mensagemErro = dto.mensagemErro;
    }

    if (dto.processadoEm) {
      transacao.processadoEm = new Date(dto.processadoEm);
    }

    return this.transacaoRepository.save(transacao);
  }

  private async ensureUniqueReferencia(
    referencia: string,
    empresaId: string,
    ignoreId?: string,
  ): Promise<void> {
    const existente = await this.transacaoRepository.findOne({
      where: { referenciaGateway: referencia, empresa_id: empresaId },
    });

    if (existente && existente.id !== ignoreId) {
      throw new ConflictException('Já existe uma transação com esta referência para a empresa');
    }
  }

  private async getConfiguracao(id: string, empresaId: string): Promise<ConfiguracaoGateway> {
    const configuracao = await this.configuracaoRepository.findOne({
      where: { id, empresa_id: empresaId },
    });

    if (!configuracao) {
      throw new NotFoundException('Configuração de gateway não encontrada para a empresa');
    }

    return configuracao;
  }

  private async getFatura(id: number, empresaId: string): Promise<Fatura> {
    const fatura = await this.faturaRepository.findOne({
      where: { id, empresaId },
    });

    if (!fatura) {
      throw new NotFoundException('Fatura não encontrada para a empresa');
    }

    return fatura;
  }

  private async getPagamento(id: number, empresaId: string): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { id, empresaId },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado para a empresa');
    }

    return pagamento;
  }

  private assertGatewayProviderEnabledWithTelemetry(
    gateway: ConfiguracaoGateway['gateway'],
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
