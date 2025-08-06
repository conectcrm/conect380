import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fatura, StatusFatura, TipoFatura } from '../entities/fatura.entity';
import { ItemFatura } from '../entities/item-fatura.entity';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { CreateFaturaDto, UpdateFaturaDto, GerarFaturaAutomaticaDto } from '../dto/fatura.dto';
import { EmailIntegradoService } from '../../propostas/email-integrado.service';

@Injectable()
export class FaturamentoService {
  private readonly logger = new Logger(FaturamentoService.name);

  constructor(
    @InjectRepository(Fatura)
    private faturaRepository: Repository<Fatura>,
    @InjectRepository(ItemFatura)
    private itemFaturaRepository: Repository<ItemFatura>,
    @InjectRepository(Contrato)
    private contratoRepository: Repository<Contrato>,
    private emailService: EmailIntegradoService,
  ) { }

  async criarFatura(createFaturaDto: CreateFaturaDto): Promise<Fatura> {
    try {
      // Verificar se o contrato existe
      const contrato = await this.contratoRepository.findOne({
        where: { id: createFaturaDto.contratoId },
        relations: ['proposta'],
      });

      if (!contrato) {
        throw new NotFoundException('Contrato não encontrado');
      }

      // Gerar número único da fatura
      const numero = await this.gerarNumeroFatura();

      // Calcular valor total dos itens
      const valorTotal = this.calcularValorTotalItens(createFaturaDto.itens);

      // Criar fatura
      const fatura = this.faturaRepository.create({
        ...createFaturaDto,
        numero,
        valorTotal,
        valorPago: 0,
        dataEmissao: new Date(),
        status: StatusFatura.PENDENTE,
      });

      const faturaSalva = await this.faturaRepository.save(fatura);

      // Criar itens da fatura
      const itens = createFaturaDto.itens.map(item =>
        this.itemFaturaRepository.create({
          ...item,
          faturaId: faturaSalva.id,
          valorTotal: item.quantidade * item.valorUnitario - (item.valorDesconto || 0),
        })
      );

      await this.itemFaturaRepository.save(itens);

      // Recarregar fatura com itens
      const faturaCompleta = await this.buscarFaturaPorId(faturaSalva.id);

      this.logger.log(`Fatura criada: ${faturaCompleta.numero}`);

      return faturaCompleta;
    } catch (error) {
      this.logger.error(`Erro ao criar fatura: ${error.message}`);
      throw new BadRequestException('Erro ao criar fatura');
    }
  }

  async gerarFaturaAutomatica(gerarFaturaDto: GerarFaturaAutomaticaDto): Promise<Fatura> {
    try {
      const contrato = await this.contratoRepository.findOne({
        where: { id: gerarFaturaDto.contratoId },
        relations: ['proposta'],
      });

      if (!contrato) {
        throw new NotFoundException('Contrato não encontrado');
      }

      if (!contrato.isAssinado()) {
        throw new BadRequestException('Contrato deve estar assinado para gerar fatura');
      }

      // Gerar fatura baseada no contrato
      const createFaturaDto: CreateFaturaDto = {
        contratoId: contrato.id,
        clienteId: contrato.clienteId,
        usuarioResponsavelId: contrato.usuarioResponsavelId,
        tipo: contrato.condicoesPagamento?.parcelas > 1 ? TipoFatura.PARCELA : TipoFatura.UNICA,
        descricao: `Fatura referente ao contrato ${contrato.numero} - ${contrato.objeto}`,
        formaPagamentoPreferida: this.mapearFormaPagamento(contrato.condicoesPagamento?.formaPagamento),
        dataVencimento: this.calcularDataVencimento(contrato),
        observacoes: gerarFaturaDto.observacoes,
        itens: [{
          descricao: contrato.objeto,
          quantidade: 1,
          valorUnitario: contrato.valorTotal,
          unidade: 'un',
          codigoProduto: `CT-${contrato.numero}`,
        }],
      };

      const fatura = await this.criarFatura(createFaturaDto);

      // Enviar email se solicitado
      if (gerarFaturaDto.enviarEmail) {
        await this.enviarFaturaPorEmail(fatura.id);
      }

      this.logger.log(`Fatura automática gerada para contrato ${contrato.numero}: ${fatura.numero}`);

      return fatura;
    } catch (error) {
      this.logger.error(`Erro ao gerar fatura automática: ${error.message}`);
      throw error;
    }
  }

  async buscarFaturas(
    filtros?: {
      status?: StatusFatura;
      clienteId?: number;
      contratoId?: number;
      dataInicio?: Date;
      dataFim?: Date;
    }
  ): Promise<Fatura[]> {
    const query = this.faturaRepository
      .createQueryBuilder('fatura')
      .leftJoinAndSelect('fatura.contrato', 'contrato')
      .leftJoinAndSelect('fatura.usuarioResponsavel', 'usuario')
      .leftJoinAndSelect('fatura.itens', 'itens')
      .leftJoinAndSelect('fatura.pagamentos', 'pagamentos')
      .where('fatura.ativo = :ativo', { ativo: true });

    if (filtros?.status) {
      query.andWhere('fatura.status = :status', { status: filtros.status });
    }

    if (filtros?.clienteId) {
      query.andWhere('fatura.clienteId = :clienteId', { clienteId: filtros.clienteId });
    }

    if (filtros?.contratoId) {
      query.andWhere('fatura.contratoId = :contratoId', { contratoId: filtros.contratoId });
    }

    if (filtros?.dataInicio) {
      query.andWhere('fatura.dataEmissao >= :dataInicio', { dataInicio: filtros.dataInicio });
    }

    if (filtros?.dataFim) {
      query.andWhere('fatura.dataEmissao <= :dataFim', { dataFim: filtros.dataFim });
    }

    return query
      .orderBy('fatura.createdAt', 'DESC')
      .getMany();
  }

  async buscarFaturaPorId(id: number): Promise<Fatura> {
    const fatura = await this.faturaRepository.findOne({
      where: { id, ativo: true },
      relations: ['contrato', 'contrato.proposta', 'usuarioResponsavel', 'itens', 'pagamentos'],
    });

    if (!fatura) {
      throw new NotFoundException('Fatura não encontrada');
    }

    return fatura;
  }

  async buscarFaturaPorNumero(numero: string): Promise<Fatura> {
    const fatura = await this.faturaRepository.findOne({
      where: { numero, ativo: true },
      relations: ['contrato', 'contrato.proposta', 'usuarioResponsavel', 'itens', 'pagamentos'],
    });

    if (!fatura) {
      throw new NotFoundException('Fatura não encontrada');
    }

    return fatura;
  }

  async atualizarFatura(id: number, updateFaturaDto: UpdateFaturaDto): Promise<Fatura> {
    const fatura = await this.buscarFaturaPorId(id);

    if (fatura.isPaga()) {
      throw new BadRequestException('Não é possível alterar fatura já paga');
    }

    // Atualizar dados básicos
    Object.assign(fatura, updateFaturaDto);

    // Se alterou itens, recalcular valor total
    if (updateFaturaDto.itens) {
      // Remover itens existentes
      await this.itemFaturaRepository.delete({ faturaId: id });

      // Criar novos itens
      const novosItens = updateFaturaDto.itens.map(item =>
        this.itemFaturaRepository.create({
          ...item,
          faturaId: id,
          valorTotal: item.quantidade * item.valorUnitario - (item.valorDesconto || 0),
        })
      );

      await this.itemFaturaRepository.save(novosItens);

      // Recalcular valor total
      fatura.valorTotal = this.calcularValorTotalItens(updateFaturaDto.itens);
    }

    const faturaAtualizada = await this.faturaRepository.save(fatura);
    this.logger.log(`Fatura atualizada: ${faturaAtualizada.numero}`);

    return this.buscarFaturaPorId(faturaAtualizada.id);
  }

  async marcarComoPaga(id: number, valorPago: number): Promise<Fatura> {
    const fatura = await this.buscarFaturaPorId(id);

    if (fatura.isPaga()) {
      throw new BadRequestException('Fatura já está paga');
    }

    fatura.valorPago = valorPago;
    fatura.dataPagamento = new Date();

    if (valorPago >= fatura.valorTotal) {
      fatura.status = StatusFatura.PAGA;
    } else {
      fatura.status = StatusFatura.PARCIALMENTE_PAGA;
    }

    const faturaAtualizada = await this.faturaRepository.save(fatura);
    this.logger.log(`Fatura marcada como paga: ${faturaAtualizada.numero}`);

    return faturaAtualizada;
  }

  async cancelarFatura(id: number, motivo?: string): Promise<Fatura> {
    const fatura = await this.buscarFaturaPorId(id);

    if (fatura.isPaga()) {
      throw new BadRequestException('Não é possível cancelar fatura já paga');
    }

    fatura.status = StatusFatura.CANCELADA;
    if (motivo) {
      fatura.observacoes = `${fatura.observacoes || ''}\n\nCancelada: ${motivo}`;
    }

    const faturaAtualizada = await this.faturaRepository.save(fatura);
    this.logger.log(`Fatura cancelada: ${faturaAtualizada.numero}`);

    return faturaAtualizada;
  }

  async verificarFaturasVencidas(): Promise<void> {
    const faturasVencidas = await this.faturaRepository
      .createQueryBuilder('fatura')
      .where('fatura.status = :status', { status: StatusFatura.PENDENTE })
      .andWhere('fatura.dataVencimento < :agora', { agora: new Date() })
      .andWhere('fatura.ativo = :ativo', { ativo: true })
      .getMany();

    for (const fatura of faturasVencidas) {
      fatura.status = StatusFatura.VENCIDA;
      await this.faturaRepository.save(fatura);
      this.logger.log(`Fatura vencida: ${fatura.numero}`);
    }
  }

  async enviarFaturaPorEmail(faturaId: number): Promise<boolean> {
    try {
      const fatura = await this.buscarFaturaPorId(faturaId);

      // Buscar dados do cliente para obter o email
      // Por enquanto, usar um email de exemplo
      const emailCliente = `cliente${fatura.clienteId}@exemplo.com`;

      const emailData = {
        to: emailCliente,
        subject: `Fatura ${fatura.numero} - Vencimento ${fatura.dataVencimento.toLocaleDateString('pt-BR')}`,
        html: this.gerarEmailFatura(fatura),
      };

      const sucesso = await this.emailService.enviarEmailGenerico(emailData);

      if (sucesso) {
        fatura.status = StatusFatura.ENVIADA;
        await this.faturaRepository.save(fatura);
        this.logger.log(`Fatura enviada por email: ${fatura.numero}`);
      }

      return sucesso;
    } catch (error) {
      this.logger.error(`Erro ao enviar fatura por email: ${error.message}`);
      return false;
    }
  }

  private calcularValorTotalItens(itens: any[]): number {
    return itens.reduce((total, item) => {
      const subtotal = item.quantidade * item.valorUnitario;
      const desconto = item.valorDesconto || 0;
      return total + (subtotal - desconto);
    }, 0);
  }

  private async gerarNumeroFatura(): Promise<string> {
    const ano = new Date().getFullYear();

    const ultimaFatura = await this.faturaRepository
      .createQueryBuilder('fatura')
      .where('fatura.numero LIKE :pattern', { pattern: `FT${ano}%` })
      .orderBy('fatura.numero', 'DESC')
      .getOne();

    let proximoNumero = 1;

    if (ultimaFatura) {
      const numeroAtual = parseInt(ultimaFatura.numero.replace(`FT${ano}`, ''));
      proximoNumero = numeroAtual + 1;
    }

    return `FT${ano}${proximoNumero.toString().padStart(6, '0')}`;
  }

  private mapearFormaPagamento(formaPagamento?: string): any {
    const mapeamento: Record<string, any> = {
      'PIX': 'pix',
      'Cartão de Crédito': 'cartao_credito',
      'Boleto': 'boleto',
      'Transferência': 'transferencia',
    };

    return mapeamento[formaPagamento] || 'pix';
  }

  private calcularDataVencimento(contrato: Contrato): string {
    const hoje = new Date();
    const vencimento = new Date(hoje);

    // Padrão: 30 dias a partir de hoje
    vencimento.setDate(hoje.getDate() + 30);

    // Se o contrato tem condições de pagamento específicas
    if (contrato.condicoesPagamento?.diaVencimento) {
      vencimento.setDate(contrato.condicoesPagamento.diaVencimento);

      // Se o dia já passou neste mês, vencer no próximo mês
      if (vencimento < hoje) {
        vencimento.setMonth(vencimento.getMonth() + 1);
      }
    }

    return vencimento.toISOString().split('T')[0];
  }

  private gerarEmailFatura(fatura: Fatura): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50;">💰 Nova Fatura Disponível</h1>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalhes da Fatura</h3>
          <p><strong>Número:</strong> ${fatura.numero}</p>
          <p><strong>Valor:</strong> R$ ${fatura.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Vencimento:</strong> ${fatura.dataVencimento.toLocaleDateString('pt-BR')}</p>
          <p><strong>Descrição:</strong> ${fatura.descricao}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/faturas/${fatura.id}" 
             style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            💳 Pagar Fatura
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px; text-align: center;">
          Este email foi enviado automaticamente pelo sistema ConectCRM.
        </p>
      </div>
    `;
  }
}
