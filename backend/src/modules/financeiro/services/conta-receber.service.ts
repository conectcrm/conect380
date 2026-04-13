import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Fatura, FormaPagamento, StatusFatura, TipoFatura } from '../../faturamento/entities/fatura.entity';
import { PagamentoService } from '../../faturamento/services/pagamento.service';
import { FaturamentoService } from '../../faturamento/services/faturamento.service';
import { InadimplenciaOperacionalService } from './inadimplencia-operacional.service';
import {
  CriarLancamentoAvulsoContaReceberDto,
  ContaReceberItemResponse,
  ListContasReceberResponse,
  OrigemContaReceber,
  QueryContasReceberDto,
  ReenviarCobrancaContaReceberDto,
  RegistrarRecebimentoContaReceberDto,
  ResumoContasReceberResponse,
  StatusContaReceber,
  TipoLancamentoAvulsoContaReceber,
} from '../dto/conta-receber.dto';

@Injectable()
export class ContaReceberService {
  constructor(
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    private readonly pagamentoService: PagamentoService,
    private readonly faturamentoService: FaturamentoService,
    private readonly inadimplenciaOperacionalService: InadimplenciaOperacionalService,
  ) {}

  async findAll(
    empresaId: string,
    query: QueryContasReceberDto = {},
  ): Promise<ListContasReceberResponse> {
    const page = Number.isFinite(query.page as number) ? Math.max(Number(query.page), 1) : 1;
    const pageSize = Number.isFinite(query.pageSize as number)
      ? Math.min(Math.max(Number(query.pageSize), 1), 200)
      : 20;

    const itens = await this.listarItensFiltrados(empresaId, query);
    const inicio = (page - 1) * pageSize;
    const fim = inicio + pageSize;

    return {
      data: itens.slice(inicio, fim),
      total: itens.length,
      page,
      pageSize,
    };
  }

  async obterResumo(
    empresaId: string,
    query: QueryContasReceberDto = {},
  ): Promise<ResumoContasReceberResponse> {
    const itens = await this.listarItensFiltrados(empresaId, query);

    const resumoInicial: ResumoContasReceberResponse = {
      totalTitulos: itens.length,
      valorTotal: 0,
      valorRecebido: 0,
      valorEmAberto: 0,
      valorVencido: 0,
      quantidadePendentes: 0,
      quantidadeParciais: 0,
      quantidadeRecebidas: 0,
      quantidadeVencidas: 0,
      quantidadeCanceladas: 0,
      aging: {
        aVencer: 0,
        vencido1a30: 0,
        vencido31a60: 0,
        vencido61mais: 0,
      },
    };

    return itens.reduce((acc, item) => {
      acc.valorTotal += item.valorTotal;
      acc.valorRecebido += item.valorPago;
      acc.valorEmAberto += item.valorEmAberto;

      if (item.status === 'pendente') acc.quantidadePendentes += 1;
      if (item.status === 'parcial') acc.quantidadeParciais += 1;
      if (item.status === 'recebida') acc.quantidadeRecebidas += 1;
      if (item.status === 'vencida') acc.quantidadeVencidas += 1;
      if (item.status === 'cancelada') acc.quantidadeCanceladas += 1;

      const saldoAberto = item.valorEmAberto > 0 && item.status !== 'cancelada' && item.status !== 'recebida';
      if (saldoAberto) {
        if (item.diasAtraso <= 0) {
          acc.aging.aVencer += item.valorEmAberto;
        } else if (item.diasAtraso <= 30) {
          acc.aging.vencido1a30 += item.valorEmAberto;
        } else if (item.diasAtraso <= 60) {
          acc.aging.vencido31a60 += item.valorEmAberto;
        } else {
          acc.aging.vencido61mais += item.valorEmAberto;
        }
      }

      if (item.status === 'vencida') {
        acc.valorVencido += item.valorEmAberto;
      }

      return acc;
    }, resumoInicial);
  }

  async criarLancamentoAvulso(
    dto: CriarLancamentoAvulsoContaReceberDto,
    empresaId: string,
    userId?: string,
  ) {
    const actor = String(userId || 'sistema').trim() || 'sistema';
    const correlationId =
      String(dto.correlationId || '').trim() || `conta-receber:avulso:criacao:${Date.now()}`;
    const origemId =
      String(dto.origemId || '').trim() || `financeiro.contas-receber.avulso.criar:${actor}`;

    const descricao = String(dto.descricao || '').trim();
    if (!descricao) {
      throw new BadRequestException('Descricao do lancamento avulso e obrigatoria');
    }

    const valor = this.toMoney(dto.valor);
    if (valor <= 0) {
      throw new BadRequestException('Valor do lancamento avulso deve ser maior que zero');
    }
    const tipoLancamentoAvulso = this.normalizarTipoLancamentoAvulso(dto.tipoLancamentoAvulso);

    const usuarioResponsavelId = this.resolverUsuarioResponsavelId(dto.usuarioResponsavelId, actor);

    const faturaCriada = await this.faturamentoService.criarFatura(
      {
        clienteId: dto.clienteId,
        usuarioResponsavelId,
        tipo: TipoFatura.ADICIONAL,
        descricao,
        formaPagamentoPreferida:
          (dto.formaPagamentoPreferida as FormaPagamento | undefined) || FormaPagamento.A_COMBINAR,
        dataVencimento: dto.dataVencimento,
        observacoes: dto.observacoes,
        itens: [
          {
            descricao,
            quantidade: 1,
            valorUnitario: valor,
            unidade: 'un',
          },
        ],
      },
      empresaId,
      { id: actor },
      { origemOperacional: 'avulso' },
    );

    const metadadosAtualizados = this.buildMetadadosOrigemAvulso(
      faturaCriada.metadados as Record<string, unknown> | null | undefined,
      correlationId,
      origemId,
      actor,
      tipoLancamentoAvulso,
    );
    faturaCriada.metadados = metadadosAtualizados as any;
    await this.faturaRepository.save(faturaCriada);

    const faturaAtualizada = await this.obterFaturaOperacional(faturaCriada.id, empresaId);

    return {
      correlationId,
      origemId,
      contaReceber: this.mapContaReceber(faturaAtualizada),
    };
  }

  async registrarRecebimento(
    faturaId: number,
    dto: RegistrarRecebimentoContaReceberDto,
    empresaId: string,
    userId?: string,
  ) {
    const fatura = await this.obterFaturaOperacional(faturaId, empresaId);
    const conta = this.mapContaReceber(fatura);

    if (conta.status === 'cancelada') {
      throw new BadRequestException('Nao e possivel registrar recebimento em titulo cancelado');
    }
    if (conta.status === 'recebida') {
      throw new BadRequestException('Titulo ja recebido integralmente');
    }

    const valorSolicitado = this.toMoney(dto.valor);
    if (valorSolicitado <= 0) {
      throw new BadRequestException('Valor de recebimento deve ser maior que zero');
    }
    if (valorSolicitado > conta.valorEmAberto) {
      throw new BadRequestException(
        `Valor informado (${valorSolicitado.toFixed(2)}) excede saldo em aberto (${conta.valorEmAberto.toFixed(2)})`,
      );
    }

    const actor = String(userId || 'sistema').trim() || 'sistema';
    const correlationId =
      String(dto.correlationId || '').trim() || `conta-receber:${faturaId}:recebimento:${Date.now()}`;
    const origemId =
      String(dto.origemId || '').trim() || `financeiro.contas-receber.registrar-recebimento:${actor}`;

    const observacoes = dto.observacoes?.trim();
    const observacoesComAuditoria = observacoes
      ? `${observacoes} | usuario=${actor}`
      : `Recebimento registrado por ${actor}`;

    const pagamento = await this.pagamentoService.registrarPagamentoManual(
      {
        faturaId,
        valor: valorSolicitado,
        metodoPagamento: String(dto.metodoPagamento || 'transferencia').trim().toLowerCase(),
        dataPagamento: dto.dataPagamento,
        observacoes: observacoesComAuditoria,
        correlationId,
        origemId,
      },
      empresaId,
    );

    const faturaAtualizada = await this.obterFaturaOperacional(faturaId, empresaId);
    await this.inadimplenciaOperacionalService.avaliarCliente(empresaId, faturaAtualizada.clienteId, {
      actorId: actor,
      motivo: 'Reavaliacao automatica apos baixa manual em contas a receber.',
      trigger: 'baixa_manual',
    });
    return {
      correlationId,
      origemId,
      pagamento: {
        id: pagamento.id,
        status: pagamento.status,
        valor: this.toMoney(pagamento.valor),
        dataPagamento: pagamento.dataAprovacao
          ? this.toDateTimeLabel(pagamento.dataAprovacao)
          : this.toDateTimeLabel(new Date()),
        metodoPagamento: pagamento.metodoPagamento || null,
        gatewayTransacaoId: pagamento.gatewayTransacaoId || null,
      },
      contaReceber: this.mapContaReceber(faturaAtualizada),
    };
  }

  async reenviarCobranca(
    faturaId: number,
    dto: ReenviarCobrancaContaReceberDto,
    empresaId: string,
    userId?: string,
  ) {
    const fatura = await this.obterFaturaOperacional(faturaId, empresaId);
    const conta = this.mapContaReceber(fatura);

    if (conta.status === 'cancelada') {
      throw new BadRequestException('Nao e possivel reenviar cobranca de titulo cancelado');
    }
    if (conta.status === 'recebida') {
      throw new BadRequestException('Nao e necessario reenviar cobranca para titulo recebido');
    }

    const actor = String(userId || 'sistema').trim() || 'sistema';
    const correlationId =
      String(dto.correlationId || '').trim() || `conta-receber:${faturaId}:reenvio:${Date.now()}`;
    const origemId =
      String(dto.origemId || '').trim() || `financeiro.contas-receber.reenviar-cobranca:${actor}`;

    const resultado = await this.faturamentoService.enviarFaturaPorEmail(faturaId, empresaId, {
      email: dto.email,
      assunto: dto.assunto,
      conteudo: dto.conteudo,
    });

    return {
      correlationId,
      origemId,
      enviado: Boolean(resultado.enviado),
      simulado: Boolean(resultado.simulado),
      motivo: resultado.motivo || null,
      detalhes: resultado.detalhes || null,
      contaReceber: conta,
    };
  }

  private async listarItensFiltrados(
    empresaId: string,
    query: QueryContasReceberDto,
  ): Promise<ContaReceberItemResponse[]> {
    const faturas = await this.buscarFaturasBase(empresaId, query);
    const statusFiltrados = this.parseStatusFilter(query.status);
    const origensFiltradas = this.parseOrigemFilter(query.origem);

    let itens = faturas.map((fatura) => this.mapContaReceber(fatura));

    if (statusFiltrados.length > 0) {
      itens = itens.filter((item) => statusFiltrados.includes(item.status));
    }

    if (origensFiltradas.length > 0) {
      itens = itens.filter((item) => origensFiltradas.includes(item.origemTitulo));
    }

    itens.sort((a, b) => this.compararItens(a, b, query.sortBy, query.sortOrder));

    return itens;
  }

  private async buscarFaturasBase(empresaId: string, query: QueryContasReceberDto): Promise<Fatura[]> {
    const qb = this.faturaRepository
      .createQueryBuilder('fatura')
      .leftJoinAndSelect('fatura.cliente', 'cliente')
      .where('fatura.ativo = :ativo', { ativo: true })
      .andWhere('fatura.empresa_id = :empresaId', { empresaId });

    if (query.clienteId) {
      qb.andWhere('fatura.clienteId = :clienteId', { clienteId: query.clienteId });
    }

    if (query.dataVencimentoInicio) {
      qb.andWhere('fatura.dataVencimento >= :dataVencimentoInicio', {
        dataVencimentoInicio: query.dataVencimentoInicio,
      });
    }

    if (query.dataVencimentoFim) {
      qb.andWhere('fatura.dataVencimento <= :dataVencimentoFim', {
        dataVencimentoFim: query.dataVencimentoFim,
      });
    }

    if (typeof query.valorMin === 'number') {
      qb.andWhere('fatura.valorTotal >= :valorMin', { valorMin: query.valorMin });
    }

    if (typeof query.valorMax === 'number') {
      qb.andWhere('fatura.valorTotal <= :valorMax', { valorMax: query.valorMax });
    }

    if (query.busca?.trim()) {
      const termo = `%${query.busca.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where(`LOWER(COALESCE(fatura.numero, '')) LIKE :termo`, { termo })
            .orWhere(`LOWER(COALESCE(fatura.descricao, '')) LIKE :termo`, { termo })
            .orWhere(`LOWER(COALESCE(cliente.nome, '')) LIKE :termo`, { termo });
        }),
      );
    }

    return qb.orderBy('fatura.dataVencimento', 'ASC').addOrderBy('fatura.createdAt', 'DESC').getMany();
  }

  private async obterFaturaOperacional(faturaId: number, empresaId: string): Promise<Fatura> {
    const fatura = await this.faturaRepository.findOne({
      where: { id: faturaId, empresaId, ativo: true },
      relations: ['cliente'],
    });

    if (!fatura) {
      throw new NotFoundException('Titulo de contas a receber nao encontrado');
    }

    return fatura;
  }

  private mapContaReceber(fatura: Fatura): ContaReceberItemResponse {
    const valorTotal = this.toMoney(fatura.valorTotal);
    const valorPago = this.toMoney(fatura.valorPago);
    const valorEmAberto = this.toMoney(Math.max(valorTotal - valorPago, 0));
    const status = this.resolverStatusContaReceber(fatura, valorEmAberto, valorPago, valorTotal);
    const diasAtraso = this.calcularDiasAtraso(fatura.dataVencimento, status);
    const origemTitulo = this.resolverOrigemContaReceber(fatura);

    return {
      id: fatura.id,
      numero: String(fatura.numero || ''),
      descricao: String(fatura.descricao || ''),
      clienteId: String(fatura.clienteId || ''),
      clienteNome: String(fatura.cliente?.nome || '').trim() || '-',
      clienteEmail: fatura.cliente?.email || null,
      status,
      origemTitulo,
      tipoLancamentoAvulso: this.resolverTipoLancamentoAvulso(fatura, origemTitulo),
      statusFatura: String(fatura.status || ''),
      createdAt: this.toDateTimeLabel(fatura.createdAt),
      dataEmissao: this.toDateLabel(fatura.dataEmissao),
      dataVencimento: this.toDateLabel(fatura.dataVencimento),
      valorTotal,
      valorPago,
      valorEmAberto,
      diasAtraso,
    };
  }

  private resolverStatusContaReceber(
    fatura: Fatura,
    valorEmAberto: number,
    valorPago: number,
    valorTotal: number,
  ): StatusContaReceber {
    if (fatura.status === StatusFatura.CANCELADA) {
      return 'cancelada';
    }

    if (fatura.status === StatusFatura.PAGA || (valorTotal > 0 && valorEmAberto <= 0)) {
      return 'recebida';
    }

    if (fatura.status === StatusFatura.VENCIDA) {
      return 'vencida';
    }

    const hoje = this.inicioDoDia(new Date());
    const vencimento = this.inicioDoDia(fatura.dataVencimento);
    if (valorEmAberto > 0 && vencimento < hoje) {
      return 'vencida';
    }

    if (fatura.status === StatusFatura.PARCIALMENTE_PAGA || valorPago > 0) {
      return 'parcial';
    }

    return 'pendente';
  }

  private parseStatusFilter(input?: string | string[]): StatusContaReceber[] {
    if (!input) {
      return [];
    }

    const valores = Array.isArray(input)
      ? input
      : String(input)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

    const validos: StatusContaReceber[] = ['pendente', 'parcial', 'recebida', 'vencida', 'cancelada'];
    return valores
      .map((valor) => String(valor).trim().toLowerCase())
      .filter((valor): valor is StatusContaReceber => validos.includes(valor as StatusContaReceber));
  }

  private parseOrigemFilter(input?: string | string[]): OrigemContaReceber[] {
    if (!input) {
      return [];
    }

    const valores = Array.isArray(input)
      ? input
      : String(input)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

    const validos: OrigemContaReceber[] = ['faturamento', 'avulso'];
    return valores
      .map((valor) => String(valor).trim().toLowerCase())
      .filter((valor): valor is OrigemContaReceber => validos.includes(valor as OrigemContaReceber));
  }

  private resolverOrigemContaReceber(fatura: Fatura): OrigemContaReceber {
    const origemRaw = String(
      (fatura.metadados as Record<string, unknown> | null | undefined)?.origemTitulo || '',
    )
      .trim()
      .toLowerCase();

    if (origemRaw === 'avulso') {
      return 'avulso';
    }

    return 'faturamento';
  }

  private resolverTipoLancamentoAvulso(
    fatura: Fatura,
    origemTitulo: OrigemContaReceber,
  ): TipoLancamentoAvulsoContaReceber | null {
    if (origemTitulo !== 'avulso') {
      return null;
    }

    const tipoRaw = String(
      (fatura.metadados as Record<string, unknown> | null | undefined)?.tipoLancamentoAvulso || '',
    )
      .trim()
      .toLowerCase();

    const tipoNormalizado = this.normalizarTipoLancamentoAvulso(tipoRaw as any);
    return tipoNormalizado;
  }

  private normalizarTipoLancamentoAvulso(
    value?: string | null,
  ): TipoLancamentoAvulsoContaReceber {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();

    const validos: TipoLancamentoAvulsoContaReceber[] = [
      'instalacao',
      'servico_avulso',
      'reembolso',
      'solicitacao_servico',
      'outro',
    ];

    if (validos.includes(normalized as TipoLancamentoAvulsoContaReceber)) {
      return normalized as TipoLancamentoAvulsoContaReceber;
    }

    return 'servico_avulso';
  }

  private resolverUsuarioResponsavelId(usuarioResponsavelId?: string, actor?: string): string {
    const candidatoDto = String(usuarioResponsavelId || '').trim();
    if (this.isUuidLike(candidatoDto)) {
      return candidatoDto;
    }

    const candidatoActor = String(actor || '').trim();
    if (this.isUuidLike(candidatoActor)) {
      return candidatoActor;
    }

    throw new BadRequestException(
      'usuarioResponsavelId e obrigatorio para lancamento avulso quando o usuario autenticado nao e UUID valido',
    );
  }

  private isUuidLike(value: string): boolean {
    if (!value) {
      return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private buildMetadadosOrigemAvulso(
    metadadosAtuais: Record<string, unknown> | null | undefined,
    correlationId: string,
    origemId: string,
    actor: string,
    tipoLancamentoAvulso: TipoLancamentoAvulsoContaReceber,
  ): Record<string, unknown> {
    return {
      ...(metadadosAtuais || {}),
      origemTitulo: 'avulso',
      origemLancamento: 'financeiro.contas-receber.avulso',
      tipoLancamentoAvulso,
      correlationId,
      origemId,
      usuarioId: actor,
      atualizadoEm: new Date().toISOString(),
    };
  }

  private compararItens(
    a: ContaReceberItemResponse,
    b: ContaReceberItemResponse,
    sortBy?: QueryContasReceberDto['sortBy'],
    sortOrder?: QueryContasReceberDto['sortOrder'],
  ): number {
    const campo = sortBy || 'dataVencimento';
    const ordem = String(sortOrder || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;

    const compareNumbers = (first: number, second: number) => (first - second) * ordem;
    const compareStrings = (first: string, second: string) =>
      first.localeCompare(second, 'pt-BR', { sensitivity: 'base' }) * ordem;

    if (campo === 'valorTotal') {
      return compareNumbers(a.valorTotal, b.valorTotal);
    }

    if (campo === 'valorEmAberto') {
      return compareNumbers(a.valorEmAberto, b.valorEmAberto);
    }

    if (campo === 'numero') {
      return compareStrings(a.numero, b.numero);
    }

    if (campo === 'cliente') {
      return compareStrings(a.clienteNome, b.clienteNome);
    }

    const aDate =
      campo === 'createdAt' ? new Date(a.createdAt).getTime() : new Date(a.dataVencimento).getTime();
    const bDate =
      campo === 'createdAt' ? new Date(b.createdAt).getTime() : new Date(b.dataVencimento).getTime();

    return compareNumbers(aDate, bDate);
  }

  private calcularDiasAtraso(dataVencimento: Date, status: StatusContaReceber): number {
    if (status !== 'vencida') {
      return 0;
    }

    const hoje = this.inicioDoDia(new Date());
    const vencimento = this.inicioDoDia(dataVencimento);
    const diffMs = hoje.getTime() - vencimento.getTime();
    return diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
  }

  private inicioDoDia(date: Date): Date {
    const clone = new Date(date);
    clone.setHours(0, 0, 0, 0);
    return clone;
  }

  private toDateLabel(value: Date | string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().slice(0, 10);
  }

  private toDateTimeLabel(value: Date | string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString();
  }

  private toMoney(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Number(parsed.toFixed(2));
  }
}
