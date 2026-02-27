import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pagamento, StatusPagamento, TipoPagamento } from '../entities/pagamento.entity';
import { Fatura, StatusFatura } from '../entities/fatura.entity';
import {
  CreatePagamentoDto,
  UpdatePagamentoDto,
  ProcessarPagamentoDto,
} from '../dto/pagamento.dto';
import { FaturamentoService } from './faturamento.service';

@Injectable()
export class PagamentoService {
  private readonly logger = new Logger(PagamentoService.name);

  constructor(
    @InjectRepository(Pagamento)
    private pagamentoRepository: Repository<Pagamento>,
    @InjectRepository(Fatura)
    private faturaRepository: Repository<Fatura>,
    private faturamentoService: FaturamentoService,
  ) {}

  private logEvento(evento: string, payload: Record<string, unknown>): void {
    this.logger.log(
      `[${evento}] ${JSON.stringify({
        service: PagamentoService.name,
        ...payload,
      })}`,
    );
  }

  async criarPagamento(
    createPagamentoDto: CreatePagamentoDto,
    empresaId: string,
  ): Promise<Pagamento> {
    try {
      // Verificar se a fatura existe
      const fatura = await this.faturaRepository.findOne({
        where: { id: createPagamentoDto.faturaId, empresaId },
      });

      if (!fatura) {
        throw new NotFoundException('Fatura no encontrada');
      }

      // Verificao direta do status em vez de usar o mtodo isPaga()
      if (fatura.status === StatusFatura.PAGA) {
        throw new BadRequestException('Fatura j est paga');
      }

      // Verificar se j existe pagamento com o mesmo transacaoId
      const pagamentoExistente = await this.pagamentoRepository.findOne({
        where: {
          transacaoId: createPagamentoDto.transacaoId,
          empresaId,
        },
      });

      if (pagamentoExistente) {
        throw new BadRequestException('J existe um pagamento com este ID de transao');
      }

      // Calcular valor lquido
      const taxa = createPagamentoDto.taxa || 0;
      const valorLiquido = createPagamentoDto.valor - taxa;

      const pagamento = this.pagamentoRepository.create({
        ...createPagamentoDto,
        valorLiquido,
        status: StatusPagamento.PENDENTE,
        empresaId,
      });

      const pagamentoSalvo = await this.pagamentoRepository.save(pagamento);

      this.logger.log(
        `Pagamento criado: ${pagamentoSalvo.transacaoId} para fatura ${fatura.numero}`,
      );

      return pagamentoSalvo;
    } catch (error) {
      this.logger.error(`Erro ao criar pagamento: ${error.message}`);
      throw error;
    }
  }

  async processarPagamento(
    processarPagamentoDto: ProcessarPagamentoDto,
    empresaId: string,
  ): Promise<Pagamento> {
    try {
      // Buscar pagamento pelo ID da transao do gateway
      const pagamento = await this.pagamentoRepository.findOne({
        where: {
          gatewayTransacaoId: processarPagamentoDto.gatewayTransacaoId,
          empresaId,
        },
        relations: ['fatura'],
      });

      if (!pagamento) {
        throw new NotFoundException('Pagamento no encontrado');
      }

      // Atualizar status do pagamento
      const statusAnteriorPagamento = pagamento.status;
      pagamento.status = processarPagamentoDto.novoStatus;
      pagamento.dataProcessamento = new Date();

      if (processarPagamentoDto.motivoRejeicao) {
        pagamento.motivoRejeicao = processarPagamentoDto.motivoRejeicao;
      }

      if (processarPagamentoDto.webhookData) {
        pagamento.dadosCompletos = {
          ...pagamento.dadosCompletos,
          webhookData: processarPagamentoDto.webhookData,
        };
      }

      // Se aprovado, marcar data de aprovao
      if (processarPagamentoDto.novoStatus === StatusPagamento.APROVADO) {
        pagamento.dataAprovacao = new Date();
      }

      const pagamentoAtualizado = await this.pagamentoRepository.save(pagamento);

      if (processarPagamentoDto.novoStatus === StatusPagamento.APROVADO) {
        // Persistir primeiro para que o recalculo da fatura enxergue este pagamento como aprovado.
        await this.atualizarStatusFatura(pagamento.faturaId, pagamento.valor, empresaId);
      }

      this.logEvento('PAGAMENTO_STATUS_CHANGE', {
        empresaId,
        pagamentoId: pagamentoAtualizado.id,
        faturaId: pagamentoAtualizado.faturaId,
        gatewayTransacaoId: pagamentoAtualizado.gatewayTransacaoId,
        statusAnterior: statusAnteriorPagamento,
        statusNovo: processarPagamentoDto.novoStatus,
      });

      this.logger.log(
        `Pagamento processado: ${pagamentoAtualizado.transacaoId} - Status: ${processarPagamentoDto.novoStatus}`,
      );

      return pagamentoAtualizado;
    } catch (error) {
      this.logger.error(`Erro ao processar pagamento: ${error.message}`);
      throw error;
    }
  }

  async buscarPagamentos(
    filtros: {
      faturaId?: number;
      status?: StatusPagamento;
      metodoPagamento?: string;
      gateway?: string;
      dataInicio?: Date;
      dataFim?: Date;
    } = {},
    empresaId: string,
  ): Promise<Pagamento[]> {
    const query = this.pagamentoRepository
      .createQueryBuilder('pagamento')
      .leftJoinAndSelect('pagamento.fatura', 'fatura')
      .where('pagamento.empresa_id = :empresaId', { empresaId })
      .orderBy('pagamento.createdAt', 'DESC');

    if (filtros?.faturaId) {
      query.andWhere('pagamento.faturaId = :faturaId', { faturaId: filtros.faturaId });
    }

    if (filtros?.status) {
      query.andWhere('pagamento.status = :status', { status: filtros.status });
    }

    if (filtros?.metodoPagamento) {
      query.andWhere('pagamento.metodoPagamento = :metodoPagamento', {
        metodoPagamento: filtros.metodoPagamento,
      });
    }

    if (filtros?.gateway) {
      query.andWhere('pagamento.gateway = :gateway', { gateway: filtros.gateway });
    }

    if (filtros?.dataInicio) {
      query.andWhere('pagamento.createdAt >= :dataInicio', { dataInicio: filtros.dataInicio });
    }

    if (filtros?.dataFim) {
      query.andWhere('pagamento.createdAt <= :dataFim', { dataFim: filtros.dataFim });
    }

    return query.getMany();
  }

  async buscarPagamentoPorId(id: number, empresaId: string): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { id, empresaId },
      relations: ['fatura', 'fatura.contrato'],
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento no encontrado');
    }

    return pagamento;
  }

  async buscarPagamentoPorTransacao(transacaoId: string, empresaId: string): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { transacaoId, empresaId },
      relations: ['fatura', 'fatura.contrato'],
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento no encontrado');
    }

    return pagamento;
  }

  async buscarPagamentoPorGatewayTransacao(
    gatewayTransacaoId: string,
    empresaId: string,
  ): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { gatewayTransacaoId, empresaId },
      relations: ['fatura', 'fatura.contrato'],
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento no encontrado para esta transao do gateway');
    }

    return pagamento;
  }

  async atualizarPagamento(
    id: number,
    updatePagamentoDto: UpdatePagamentoDto,
    empresaId: string,
  ): Promise<Pagamento> {
    const pagamento = await this.buscarPagamentoPorId(id, empresaId);

    if (pagamento.isAprovado()) {
      throw new BadRequestException('No  possvel alterar pagamento j aprovado');
    }

    Object.assign(pagamento, updatePagamentoDto);

    const pagamentoAtualizado = await this.pagamentoRepository.save(pagamento);
    this.logger.log(`Pagamento atualizado: ${pagamentoAtualizado.transacaoId}`);

    return pagamentoAtualizado;
  }

  async estornarPagamento(id: number, motivo: string, empresaId: string): Promise<Pagamento> {
    const pagamento = await this.buscarPagamentoPorId(id, empresaId);

    if (!pagamento.isAprovado()) {
      throw new BadRequestException('S  possvel estornar pagamentos aprovados');
    }

    // Criar registro de estorno
    const estorno = this.pagamentoRepository.create({
      faturaId: pagamento.faturaId,
      transacaoId: `EST-${pagamento.transacaoId}-${Date.now()}`,
      tipo: TipoPagamento.ESTORNO,
      status: StatusPagamento.APROVADO,
      valor: -pagamento.valor, // Valor negativo para estorno
      taxa: 0,
      valorLiquido: -pagamento.valorLiquido,
      metodoPagamento: pagamento.metodoPagamento,
      gateway: pagamento.gateway,
      observacoes: `Estorno do pagamento ${pagamento.transacaoId}: ${motivo}`,
      dataProcessamento: new Date(),
      dataAprovacao: new Date(),
      empresaId,
    });

    const estornoSalvo = await this.pagamentoRepository.save(estorno);

    // Atualizar status da fatura
    await this.atualizarStatusFatura(pagamento.faturaId, -pagamento.valor, empresaId);

    this.logger.log(
      `Estorno criado: ${estornoSalvo.transacaoId} para pagamento ${pagamento.transacaoId}`,
    );

    return estornoSalvo;
  }

  async obterEstatisticasPagamentos(
    filtros: {
      dataInicio?: Date;
      dataFim?: Date;
      gateway?: string;
    } = {},
    empresaId: string,
  ): Promise<{
    totalPagamentos: number;
    valorTotal: number;
    valorLiquido: number;
    taxasTotal: number;
    porMetodo: Record<string, { quantidade: number; valor: number }>;
    porStatus: Record<string, { quantidade: number; valor: number }>;
  }> {
    const query = this.pagamentoRepository
      .createQueryBuilder('pagamento')
      .where('pagamento.tipo = :tipo', { tipo: TipoPagamento.PAGAMENTO })
      .andWhere('pagamento.empresa_id = :empresaId', { empresaId });

    if (filtros?.dataInicio) {
      query.andWhere('pagamento.createdAt >= :dataInicio', { dataInicio: filtros.dataInicio });
    }

    if (filtros?.dataFim) {
      query.andWhere('pagamento.createdAt <= :dataFim', { dataFim: filtros.dataFim });
    }

    if (filtros?.gateway) {
      query.andWhere('pagamento.gateway = :gateway', { gateway: filtros.gateway });
    }

    const pagamentos = await query.getMany();

    const estatisticas = {
      totalPagamentos: pagamentos.length,
      valorTotal: 0,
      valorLiquido: 0,
      taxasTotal: 0,
      porMetodo: {} as Record<string, { quantidade: number; valor: number }>,
      porStatus: {} as Record<string, { quantidade: number; valor: number }>,
    };

    pagamentos.forEach((pagamento) => {
      estatisticas.valorTotal += pagamento.valor;
      estatisticas.valorLiquido += pagamento.valorLiquido;
      estatisticas.taxasTotal += pagamento.taxa;

      // Por mtodo
      if (!estatisticas.porMetodo[pagamento.metodoPagamento]) {
        estatisticas.porMetodo[pagamento.metodoPagamento] = { quantidade: 0, valor: 0 };
      }
      estatisticas.porMetodo[pagamento.metodoPagamento].quantidade++;
      estatisticas.porMetodo[pagamento.metodoPagamento].valor += pagamento.valor;

      // Por status
      if (!estatisticas.porStatus[pagamento.status]) {
        estatisticas.porStatus[pagamento.status] = { quantidade: 0, valor: 0 };
      }
      estatisticas.porStatus[pagamento.status].quantidade++;
      estatisticas.porStatus[pagamento.status].valor += pagamento.valor;
    });

    return estatisticas;
  }

  private async atualizarStatusFatura(
    faturaId: number,
    valorPagamento: number,
    empresaId: string,
  ): Promise<void> {
    const fatura = await this.faturaRepository.findOne({
      where: { id: faturaId, empresaId },
      relations: ['pagamentos'],
    });

    if (!fatura) return;
    const statusAnterior = fatura.status;

    // Calcular total pago (somando apenas pagamentos aprovados)
    const pagamentosAprovados = fatura.pagamentos.filter((p) => p.isAprovado());
    const totalPago = Number(
      pagamentosAprovados
        .reduce((total, p) => total + Number(p.valor || 0), 0)
        .toFixed(2),
    );
    const valorTotalFatura = Number(fatura.valorTotal || 0);

    fatura.valorPago = totalPago;

    // Determinar status baseado no valor pago
    if (totalPago >= valorTotalFatura) {
      fatura.status = StatusFatura.PAGA;
      fatura.dataPagamento = new Date();
    } else if (totalPago > 0) {
      fatura.status = StatusFatura.PARCIALMENTE_PAGA;
    } else {
      fatura.status = StatusFatura.PENDENTE;
      fatura.dataPagamento = null;
    }

    await this.faturaRepository.save(fatura);
    await this.faturamentoService.sincronizarStatusPropostaPorFaturaId(fatura.id, empresaId);

    this.logEvento('FATURA_STATUS_RECALCULADO', {
      empresaId,
      faturaId: fatura.id,
      numero: fatura.numero,
      statusAnterior,
      statusNovo: fatura.status,
      valorTotal: valorTotalFatura,
      valorPago: totalPago,
      qtdPagamentosAprovados: pagamentosAprovados.length,
    });

    this.logger.log(`Status da fatura ${fatura.numero} atualizado para: ${fatura.status}`);
  }
}

