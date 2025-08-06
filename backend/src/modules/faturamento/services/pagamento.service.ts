import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pagamento, StatusPagamento, TipoPagamento } from '../entities/pagamento.entity';
import { Fatura, StatusFatura } from '../entities/fatura.entity';
import { CreatePagamentoDto, UpdatePagamentoDto, ProcessarPagamentoDto } from '../dto/pagamento.dto';
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
  ) { }

  async criarPagamento(createPagamentoDto: CreatePagamentoDto): Promise<Pagamento> {
    try {
      // Verificar se a fatura existe
      const fatura = await this.faturaRepository.findOne({
        where: { id: createPagamentoDto.faturaId },
      });

      if (!fatura) {
        throw new NotFoundException('Fatura não encontrada');
      }

      if (fatura.isPaga()) {
        throw new BadRequestException('Fatura já está paga');
      }

      // Verificar se já existe pagamento com o mesmo transacaoId
      const pagamentoExistente = await this.pagamentoRepository.findOne({
        where: { transacaoId: createPagamentoDto.transacaoId },
      });

      if (pagamentoExistente) {
        throw new BadRequestException('Já existe um pagamento com este ID de transação');
      }

      // Calcular valor líquido
      const taxa = createPagamentoDto.taxa || 0;
      const valorLiquido = createPagamentoDto.valor - taxa;

      const pagamento = this.pagamentoRepository.create({
        ...createPagamentoDto,
        valorLiquido,
        status: StatusPagamento.PENDENTE,
      });

      const pagamentoSalvo = await this.pagamentoRepository.save(pagamento);

      this.logger.log(`Pagamento criado: ${pagamentoSalvo.transacaoId} para fatura ${fatura.numero}`);

      return pagamentoSalvo;
    } catch (error) {
      this.logger.error(`Erro ao criar pagamento: ${error.message}`);
      throw error;
    }
  }

  async processarPagamento(processarPagamentoDto: ProcessarPagamentoDto): Promise<Pagamento> {
    try {
      // Buscar pagamento pelo ID da transação do gateway
      const pagamento = await this.pagamentoRepository.findOne({
        where: { gatewayTransacaoId: processarPagamentoDto.gatewayTransacaoId },
        relations: ['fatura'],
      });

      if (!pagamento) {
        throw new NotFoundException('Pagamento não encontrado');
      }

      // Atualizar status do pagamento
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

      // Se aprovado, marcar data de aprovação
      if (processarPagamentoDto.novoStatus === StatusPagamento.APROVADO) {
        pagamento.dataAprovacao = new Date();

        // Atualizar status da fatura
        await this.atualizarStatusFatura(pagamento.faturaId, pagamento.valor);
      }

      const pagamentoAtualizado = await this.pagamentoRepository.save(pagamento);

      this.logger.log(`Pagamento processado: ${pagamentoAtualizado.transacaoId} - Status: ${processarPagamentoDto.novoStatus}`);

      return pagamentoAtualizado;
    } catch (error) {
      this.logger.error(`Erro ao processar pagamento: ${error.message}`);
      throw error;
    }
  }

  async buscarPagamentos(
    filtros?: {
      faturaId?: number;
      status?: StatusPagamento;
      metodoPagamento?: string;
      gateway?: string;
      dataInicio?: Date;
      dataFim?: Date;
    }
  ): Promise<Pagamento[]> {
    const query = this.pagamentoRepository
      .createQueryBuilder('pagamento')
      .leftJoinAndSelect('pagamento.fatura', 'fatura')
      .orderBy('pagamento.createdAt', 'DESC');

    if (filtros?.faturaId) {
      query.andWhere('pagamento.faturaId = :faturaId', { faturaId: filtros.faturaId });
    }

    if (filtros?.status) {
      query.andWhere('pagamento.status = :status', { status: filtros.status });
    }

    if (filtros?.metodoPagamento) {
      query.andWhere('pagamento.metodoPagamento = :metodoPagamento', { metodoPagamento: filtros.metodoPagamento });
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

  async buscarPagamentoPorId(id: number): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { id },
      relations: ['fatura', 'fatura.contrato'],
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    return pagamento;
  }

  async buscarPagamentoPorTransacao(transacaoId: string): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { transacaoId },
      relations: ['fatura', 'fatura.contrato'],
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    return pagamento;
  }

  async buscarPagamentoPorGatewayTransacao(gatewayTransacaoId: string): Promise<Pagamento> {
    const pagamento = await this.pagamentoRepository.findOne({
      where: { gatewayTransacaoId },
      relations: ['fatura', 'fatura.contrato'],
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado para esta transação do gateway');
    }

    return pagamento;
  }

  async atualizarPagamento(id: number, updatePagamentoDto: UpdatePagamentoDto): Promise<Pagamento> {
    const pagamento = await this.buscarPagamentoPorId(id);

    if (pagamento.isAprovado()) {
      throw new BadRequestException('Não é possível alterar pagamento já aprovado');
    }

    Object.assign(pagamento, updatePagamentoDto);

    const pagamentoAtualizado = await this.pagamentoRepository.save(pagamento);
    this.logger.log(`Pagamento atualizado: ${pagamentoAtualizado.transacaoId}`);

    return pagamentoAtualizado;
  }

  async estornarPagamento(id: number, motivo: string): Promise<Pagamento> {
    const pagamento = await this.buscarPagamentoPorId(id);

    if (!pagamento.isAprovado()) {
      throw new BadRequestException('Só é possível estornar pagamentos aprovados');
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
    });

    const estornoSalvo = await this.pagamentoRepository.save(estorno);

    // Atualizar status da fatura
    await this.atualizarStatusFatura(pagamento.faturaId, -pagamento.valor);

    this.logger.log(`Estorno criado: ${estornoSalvo.transacaoId} para pagamento ${pagamento.transacaoId}`);

    return estornoSalvo;
  }

  async obterEstatisticasPagamentos(
    filtros?: {
      dataInicio?: Date;
      dataFim?: Date;
      gateway?: string;
    }
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
      .where('pagamento.tipo = :tipo', { tipo: TipoPagamento.PAGAMENTO });

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

    pagamentos.forEach(pagamento => {
      estatisticas.valorTotal += pagamento.valor;
      estatisticas.valorLiquido += pagamento.valorLiquido;
      estatisticas.taxasTotal += pagamento.taxa;

      // Por método
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

  private async atualizarStatusFatura(faturaId: number, valorPagamento: number): Promise<void> {
    const fatura = await this.faturaRepository.findOne({
      where: { id: faturaId },
      relations: ['pagamentos'],
    });

    if (!fatura) return;

    // Calcular total pago (somando apenas pagamentos aprovados)
    const pagamentosAprovados = fatura.pagamentos.filter(p => p.isAprovado());
    const totalPago = pagamentosAprovados.reduce((total, p) => total + p.valor, 0);

    fatura.valorPago = totalPago;

    // Determinar status baseado no valor pago
    if (totalPago >= fatura.valorTotal) {
      fatura.status = StatusFatura.PAGA;
      fatura.dataPagamento = new Date();
    } else if (totalPago > 0) {
      fatura.status = StatusFatura.PARCIALMENTE_PAGA;
    } else {
      fatura.status = StatusFatura.PENDENTE;
      fatura.dataPagamento = null;
    }

    await this.faturaRepository.save(fatura);

    this.logger.log(`Status da fatura ${fatura.numero} atualizado para: ${fatura.status}`);
  }
}
