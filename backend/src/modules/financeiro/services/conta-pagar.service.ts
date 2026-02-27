import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ContaPagarAnexoDto,
  CreateContaPagarDto,
  QueryContasPagarDto,
  RegistrarPagamentoContaPagarDto,
  UpdateContaPagarDto,
} from '../dto/conta-pagar.dto';
import { ContaPagar } from '../entities/conta-pagar.entity';
import { Fornecedor } from '../entities/fornecedor.entity';
import { ContaBancaria } from '../entities/conta-bancaria.entity';

type StatusContaPagarUI = 'em_aberto' | 'pago' | 'vencido' | 'agendado' | 'cancelado';

type ContaPagarResponse = {
  id: string;
  numero: string;
  fornecedorId: string;
  fornecedor: {
    id: string;
    nome: string;
    cnpjCpf: string;
    email?: string;
    telefone?: string;
    ativo: boolean;
    criadoEm: string;
    atualizadoEm: string;
  };
  descricao: string;
  numeroDocumento?: string;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento?: string;
  dataAgendamento?: string;
  valorOriginal: number;
  valorDesconto: number;
  valorMulta: number;
  valorJuros: number;
  valorTotal: number;
  valorPago: number;
  valorRestante: number;
  status: StatusContaPagarUI;
  categoria: string;
  prioridade: string;
  recorrente: boolean;
  frequenciaRecorrencia?: string;
  necessitaAprovacao: boolean;
  observacoes?: string;
  comprovantePagamento?: string;
  criadoPor: string;
  criadoEm: string;
  atualizadoPor?: string;
  atualizadoEm: string;
  tipoPagamento?: string;
  contaBancariaId?: string;
  anexos: Array<unknown>;
  tags: string[];
  parcelasGeradas?: number;
  grupoRecorrenciaId?: string;
};

type ResumoContasPagarResponse = {
  totalVencendoHoje: number;
  quantidadeVencendoHoje: number;
  totalMes: number;
  quantidadeMes: number;
  totalAtrasado: number;
  quantidadeAtrasado: number;
  totalPagoMes: number;
  quantidadePagoMes: number;
  proximosVencimentos: ContaPagarResponse[];
};

type ContaPagarResponseOverrides = Partial<{
  dataEmissao: string;
  categoria: string;
  prioridade: string;
  recorrente: boolean;
  frequenciaRecorrencia: string;
  tags: string[];
  tipoPagamento: string;
  contaBancariaId: string;
  valorOriginal: number;
  valorDesconto: number;
  valorMulta: number;
  valorJuros: number;
  valorPago: number;
  numero: string;
}>;

@Injectable()
export class ContaPagarService {
  constructor(
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: Repository<ContaPagar>,
    @InjectRepository(Fornecedor)
    private readonly fornecedorRepository: Repository<Fornecedor>,
    @InjectRepository(ContaBancaria)
    private readonly contaBancariaRepository: Repository<ContaBancaria>,
  ) {}

  async findAll(empresaId: string, filtros: QueryContasPagarDto = {}): Promise<ContaPagarResponse[]> {
    const contas = await this.buscarContasComFornecedor(empresaId, filtros);
    let mapped = contas.map((conta) => this.mapContaPagarResponse(conta));

    const statusFiltros = this.parseArrayFilter(filtros.status);
    if (statusFiltros.length > 0) {
      mapped = mapped.filter((conta) => statusFiltros.includes(conta.status));
    }

    const categoriaFiltros = this.parseArrayFilter(filtros.categoria);
    if (categoriaFiltros.length > 0) {
      mapped = mapped.filter((conta) => categoriaFiltros.includes(conta.categoria));
    }

    const prioridadeFiltros = this.parseArrayFilter(filtros.prioridade);
    if (prioridadeFiltros.length > 0) {
      mapped = mapped.filter((conta) => prioridadeFiltros.includes(conta.prioridade));
    }

    return mapped;
  }

  async findOne(id: string, empresaId: string): Promise<ContaPagarResponse> {
    const conta = await this.findContaEntity(id, empresaId);
    return this.mapContaPagarResponse(conta);
  }

  async create(
    createContaPagarDto: CreateContaPagarDto,
    empresaId: string,
  ): Promise<ContaPagarResponse> {
    await this.validarFornecedor(createContaPagarDto.fornecedorId, empresaId);
    if (createContaPagarDto.contaBancariaId) {
      await this.validarContaBancaria(createContaPagarDto.contaBancariaId, empresaId);
    }

    const valorOriginal = Number(createContaPagarDto.valorOriginal || 0);
    const valorDesconto = Number(createContaPagarDto.valorDesconto || 0);
    if (valorDesconto >= valorOriginal) {
      throw new BadRequestException('Valor de desconto nao pode ser maior ou igual ao valor original');
    }

    const valorMulta = 0;
    const valorJuros = 0;
    const valorTotal = this.calcularValorTotal(valorOriginal, valorDesconto, valorMulta, valorJuros);
    const dataEmissaoBase = createContaPagarDto.dataEmissao
      ? this.parseDateInputPreservingDay(createContaPagarDto.dataEmissao)
      : new Date();
    const dataVencimentoBase = this.parseDateInputPreservingDay(createContaPagarDto.dataVencimento);
    if (Number.isNaN(dataVencimentoBase.getTime())) {
      throw new BadRequestException('Data de vencimento invalida');
    }

    const quantidadeParcelas = Math.max(1, Number(createContaPagarDto.numeroParcelas || 1));
    const gerarSerieRecorrente = !!createContaPagarDto.recorrente && quantidadeParcelas > 1;
    const grupoRecorrenciaId = gerarSerieRecorrente ? randomUUID() : undefined;
    const datasVencimento = gerarSerieRecorrente
      ? this.gerarDatasRecorrencia(
          dataVencimentoBase,
          quantidadeParcelas,
          createContaPagarDto.frequenciaRecorrencia,
        )
      : [dataVencimentoBase];
    const anexosNormalizados = this.normalizarAnexos(createContaPagarDto.anexos);
    const tagsBase = Array.isArray(createContaPagarDto.tags) ? createContaPagarDto.tags : [];
    const contasCriadas: ContaPagar[] = [];

    for (let indice = 0; indice < datasVencimento.length; indice += 1) {
      const numero = await this.gerarNumeroConta(empresaId);
      const parcelaIndex = indice + 1;
      const tagsParcela = [...tagsBase];

      if (gerarSerieRecorrente) {
        tagsParcela.push(`parcela:${parcelaIndex}/${quantidadeParcelas}`);
        tagsParcela.push(`recorrencia_grupo:${grupoRecorrenciaId}`);
      }

      const numeroDocumento =
        gerarSerieRecorrente && createContaPagarDto.numeroDocumento?.trim()
          ? `${createContaPagarDto.numeroDocumento.trim()}-${String(parcelaIndex).padStart(2, '0')}/${String(
              quantidadeParcelas,
            ).padStart(2, '0')}`
          : createContaPagarDto.numeroDocumento?.trim() || undefined;

      const conta = this.contaPagarRepository.create({
        numero,
        descricao: createContaPagarDto.descricao.trim(),
        valor: valorTotal,
        valorOriginal,
        valorDesconto,
        valorMulta,
        valorJuros,
        valorTotal,
        valorPago: 0,
        valorRestante: valorTotal,
        dataEmissao: dataEmissaoBase,
        dataVencimento: datasVencimento[indice],
        status: 'pendente',
        categoria: (createContaPagarDto.categoria || 'outros').trim(),
        prioridade: (createContaPagarDto.prioridade || 'media').trim(),
        tipoPagamento: createContaPagarDto.tipoPagamento?.trim() || undefined,
        formaPagamento: createContaPagarDto.tipoPagamento?.trim() || undefined,
        contaBancariaId: createContaPagarDto.contaBancariaId?.trim() || undefined,
        centroCustoId: createContaPagarDto.centroCustoId?.trim() || undefined,
        recorrente: !!createContaPagarDto.recorrente,
        frequenciaRecorrencia: createContaPagarDto.frequenciaRecorrencia || undefined,
        necessitaAprovacao: false,
        tags: tagsParcela,
        anexos: anexosNormalizados,
        fornecedorId: createContaPagarDto.fornecedorId,
        empresaId,
        criadoPor: 'sistema',
        observacoes: createContaPagarDto.observacoes?.trim() || undefined,
        numeroDocumento,
      });

      const saved = await this.contaPagarRepository.save(conta);
      contasCriadas.push(saved);
    }

    const primeiraConta = contasCriadas[0];
    const withFornecedor = await this.findContaEntity(primeiraConta.id, empresaId);
    const resposta = this.mapContaPagarResponse(withFornecedor, {
      numero: primeiraConta.numero,
      dataEmissao: createContaPagarDto.dataEmissao,
      categoria: createContaPagarDto.categoria || 'outros',
      prioridade: createContaPagarDto.prioridade || 'media',
      recorrente: !!createContaPagarDto.recorrente,
      frequenciaRecorrencia: createContaPagarDto.frequenciaRecorrencia,
      tags: primeiraConta.tags,
      tipoPagamento: createContaPagarDto.tipoPagamento,
      valorOriginal,
      valorDesconto,
      valorMulta,
      valorJuros,
    });

    if (gerarSerieRecorrente) {
      resposta.parcelasGeradas = contasCriadas.length;
      resposta.grupoRecorrenciaId = grupoRecorrenciaId;
    }

    return resposta;
  }

  async update(
    id: string,
    updateContaPagarDto: UpdateContaPagarDto,
    empresaId: string,
  ): Promise<ContaPagarResponse> {
    const conta = await this.findContaEntity(id, empresaId);

    if (updateContaPagarDto.fornecedorId && updateContaPagarDto.fornecedorId !== conta.fornecedorId) {
      await this.validarFornecedor(updateContaPagarDto.fornecedorId, empresaId);
      conta.fornecedorId = updateContaPagarDto.fornecedorId;
    }

    if (updateContaPagarDto.descricao !== undefined) {
      conta.descricao = updateContaPagarDto.descricao.trim();
    }

    if (updateContaPagarDto.numeroDocumento !== undefined) {
      conta.numeroDocumento = updateContaPagarDto.numeroDocumento?.trim() || undefined;
    }

    if (updateContaPagarDto.dataEmissao) {
      conta.dataEmissao = this.parseDateInputPreservingDay(updateContaPagarDto.dataEmissao);
    }

    if (updateContaPagarDto.dataVencimento) {
      conta.dataVencimento = this.parseDateInputPreservingDay(updateContaPagarDto.dataVencimento);
    }

    if (updateContaPagarDto.observacoes !== undefined) {
      conta.observacoes = updateContaPagarDto.observacoes?.trim() || undefined;
    }

    if (updateContaPagarDto.categoria !== undefined) {
      conta.categoria = updateContaPagarDto.categoria?.trim() || 'outros';
    }

    if (updateContaPagarDto.prioridade !== undefined) {
      conta.prioridade = updateContaPagarDto.prioridade?.trim() || 'media';
    }

    if (updateContaPagarDto.tipoPagamento !== undefined) {
      conta.tipoPagamento = updateContaPagarDto.tipoPagamento?.trim() || undefined;
      conta.formaPagamento = updateContaPagarDto.tipoPagamento?.trim() || undefined;
    }

    if (updateContaPagarDto.contaBancariaId !== undefined) {
      if (updateContaPagarDto.contaBancariaId?.trim()) {
        await this.validarContaBancaria(updateContaPagarDto.contaBancariaId, empresaId);
      }
      conta.contaBancariaId = updateContaPagarDto.contaBancariaId?.trim() || undefined;
    }

    if (updateContaPagarDto.recorrente !== undefined) {
      conta.recorrente = !!updateContaPagarDto.recorrente;
    }

    if (updateContaPagarDto.frequenciaRecorrencia !== undefined) {
      conta.frequenciaRecorrencia = updateContaPagarDto.frequenciaRecorrencia || undefined;
    }

    if (updateContaPagarDto.tags !== undefined) {
      conta.tags = Array.isArray(updateContaPagarDto.tags) ? updateContaPagarDto.tags : [];
    }

    if (updateContaPagarDto.anexos !== undefined) {
      conta.anexos = this.normalizarAnexos(updateContaPagarDto.anexos);
    }

    if (updateContaPagarDto.centroCustoId !== undefined) {
      conta.centroCustoId = updateContaPagarDto.centroCustoId || undefined;
    }

    const valorAtual = Number(conta.valorTotal ?? conta.valor ?? 0);
    const valorOriginal =
      updateContaPagarDto.valorOriginal !== undefined
        ? Number(updateContaPagarDto.valorOriginal)
        : Number(conta.valorOriginal ?? valorAtual);
    const valorDesconto =
      updateContaPagarDto.valorDesconto !== undefined
        ? Number(updateContaPagarDto.valorDesconto)
        : Number(conta.valorDesconto ?? 0);
    const valorMulta = Number(conta.valorMulta ?? 0);
    const valorJuros = Number(conta.valorJuros ?? 0);

    if (
      updateContaPagarDto.valorOriginal !== undefined ||
      updateContaPagarDto.valorDesconto !== undefined
    ) {
      if (valorDesconto >= valorOriginal) {
        throw new BadRequestException(
          'Valor de desconto nao pode ser maior ou igual ao valor original',
        );
      }
      const valorTotal = this.calcularValorTotal(valorOriginal, valorDesconto, valorMulta, valorJuros);
      const valorPago = Number(conta.valorPago ?? 0);
      conta.valor = valorTotal;
      conta.valorOriginal = valorOriginal;
      conta.valorDesconto = valorDesconto;
      conta.valorTotal = valorTotal;
      conta.valorRestante = Math.max(valorTotal - valorPago, 0);
    }

    conta.atualizadoPor = 'sistema';

    const saved = await this.contaPagarRepository.save(conta);
    const withFornecedor = await this.findContaEntity(saved.id, empresaId);
    return this.mapContaPagarResponse(withFornecedor, {
      dataEmissao: updateContaPagarDto.dataEmissao,
      categoria: updateContaPagarDto.categoria || conta.categoria,
      prioridade: updateContaPagarDto.prioridade || conta.prioridade,
      recorrente: updateContaPagarDto.recorrente,
      frequenciaRecorrencia: updateContaPagarDto.frequenciaRecorrencia,
      tags: updateContaPagarDto.tags,
      tipoPagamento: updateContaPagarDto.tipoPagamento,
      contaBancariaId: updateContaPagarDto.contaBancariaId || conta.contaBancariaId,
      valorOriginal,
      valorDesconto,
      valorMulta,
      valorJuros,
    });
  }

  async remove(id: string, empresaId: string): Promise<void> {
    const conta = await this.findContaEntity(id, empresaId);
    await this.contaPagarRepository.remove(conta);
  }

  async registrarPagamento(
    id: string,
    dto: RegistrarPagamentoContaPagarDto,
    empresaId: string,
  ): Promise<ContaPagarResponse> {
    const conta = await this.findContaEntity(id, empresaId);

    if (conta.status === 'cancelada') {
      throw new BadRequestException('Nao e possivel registrar pagamento em conta cancelada');
    }

    conta.dataPagamento = dto.dataPagamento
      ? this.parseDateInputPreservingDay(dto.dataPagamento)
      : new Date();
    conta.tipoPagamento = dto.tipoPagamento?.trim() || conta.tipoPagamento || undefined;
    conta.formaPagamento = dto.tipoPagamento?.trim() || conta.formaPagamento || conta.tipoPagamento;
    if (dto.contaBancariaId) {
      await this.validarContaBancaria(dto.contaBancariaId, empresaId);
    }
    conta.contaBancariaId = dto.contaBancariaId || conta.contaBancariaId || undefined;
    if (dto.comprovantePagamento !== undefined) {
      conta.comprovantePagamento = dto.comprovantePagamento?.trim() || undefined;
    }

    const valorTotal = Number(conta.valorTotal ?? conta.valor ?? 0);
    const valorPagoAtual = Number(conta.valorPago ?? (conta.status === 'paga' ? valorTotal : 0));
    const valorInformado = Number(dto.valorPago || 0);
    const valorParaRegistrar = valorInformado > 0 ? valorInformado : Math.max(valorTotal - valorPagoAtual, 0);
    const novoValorPago = Number((valorPagoAtual + valorParaRegistrar).toFixed(2));
    const novoValorRestante = Math.max(Number((valorTotal - novoValorPago).toFixed(2)), 0);

    conta.valorPago = novoValorPago;
    conta.valorRestante = novoValorRestante;
    conta.status = novoValorRestante <= 0 ? 'paga' : this.calcularStatusAberto(conta);
    conta.atualizadoPor = 'sistema';

    if (dto.observacoes?.trim()) {
      conta.observacoes = conta.observacoes
        ? `${conta.observacoes}\n${dto.observacoes.trim()}`
        : dto.observacoes.trim();
    }

    const saved = await this.contaPagarRepository.save(conta);
    const withFornecedor = await this.findContaEntity(saved.id, empresaId);

    return this.mapContaPagarResponse(withFornecedor, {
      tipoPagamento: dto.tipoPagamento,
      contaBancariaId: dto.contaBancariaId,
      valorPago: novoValorPago,
    });
  }

  async obterResumo(
    empresaId: string,
    filtros: QueryContasPagarDto = {},
  ): Promise<ResumoContasPagarResponse> {
    const contas = await this.findAll(empresaId, filtros);
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59, 999);
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const isPago = (status: StatusContaPagarUI) => status === 'pago';
    const isCancelado = (status: StatusContaPagarUI) => status === 'cancelado';

    const valorConta = (conta: ContaPagarResponse) => Number(conta.valorTotal || 0);

    const parseDate = (value?: string) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const vencendoHoje = contas.filter((conta) => {
      if (isPago(conta.status) || isCancelado(conta.status)) return false;
      const venc = parseDate(conta.dataVencimento);
      return !!venc && venc >= inicioHoje && venc <= fimHoje;
    });

    const contasMes = contas.filter((conta) => {
      if (isCancelado(conta.status)) return false;
      const venc = parseDate(conta.dataVencimento);
      return !!venc && venc.getMonth() === mesAtual && venc.getFullYear() === anoAtual;
    });

    const atrasadas = contas.filter((conta) => {
      if (isPago(conta.status) || isCancelado(conta.status)) return false;
      const venc = parseDate(conta.dataVencimento);
      return !!venc && venc < inicioHoje;
    });

    const pagasMes = contas.filter((conta) => {
      if (!isPago(conta.status)) return false;
      const pagamento = parseDate(conta.dataPagamento);
      return !!pagamento && pagamento.getMonth() === mesAtual && pagamento.getFullYear() === anoAtual;
    });

    const proximosVencimentos = contas
      .filter((conta) => !isPago(conta.status) && !isCancelado(conta.status))
      .sort((a, b) => {
        const da = parseDate(a.dataVencimento)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const db = parseDate(b.dataVencimento)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return da - db;
      })
      .slice(0, 5);

    return {
      totalVencendoHoje: vencendoHoje.reduce((acc, conta) => acc + valorConta(conta), 0),
      quantidadeVencendoHoje: vencendoHoje.length,
      totalMes: contasMes.reduce((acc, conta) => acc + valorConta(conta), 0),
      quantidadeMes: contasMes.length,
      totalAtrasado: atrasadas.reduce((acc, conta) => acc + valorConta(conta), 0),
      quantidadeAtrasado: atrasadas.length,
      totalPagoMes: pagasMes.reduce((acc, conta) => acc + valorConta(conta), 0),
      quantidadePagoMes: pagasMes.length,
      proximosVencimentos,
    };
  }

  private async buscarContasComFornecedor(
    empresaId: string,
    filtros: QueryContasPagarDto,
  ): Promise<ContaPagar[]> {
    const qb = this.contaPagarRepository
      .createQueryBuilder('conta')
      .leftJoinAndSelect('conta.fornecedor', 'fornecedor')
      .where('conta.empresaId = :empresaId', { empresaId });

    const busca = (filtros.termo || filtros.busca)?.trim();
    if (busca) {
      qb.andWhere(
        `(LOWER(conta.descricao) LIKE :busca OR LOWER(COALESCE(conta.numeroDocumento, '')) LIKE :busca OR LOWER(COALESCE(conta.numero, '')) LIKE :busca OR LOWER(COALESCE(conta.categoria, '')) LIKE :busca OR LOWER(COALESCE(fornecedor.nome, '')) LIKE :busca)`,
        { busca: `%${busca.toLowerCase()}%` },
      );
    }

    if (filtros.fornecedorId) {
      qb.andWhere('conta.fornecedorId = :fornecedorId', { fornecedorId: filtros.fornecedorId });
    }

    if (filtros.dataInicio) {
      qb.andWhere('conta.dataVencimento >= :dataInicio', { dataInicio: filtros.dataInicio });
    }

    if (filtros.dataFim) {
      qb.andWhere('conta.dataVencimento <= :dataFim', { dataFim: filtros.dataFim });
    }

    qb.orderBy('conta.dataVencimento', 'ASC').addOrderBy('conta.createdAt', 'DESC');
    return qb.getMany();
  }

  private async validarFornecedor(fornecedorId: string, empresaId: string): Promise<Fornecedor> {
    const fornecedor = await this.fornecedorRepository.findOne({
      where: { id: fornecedorId, empresaId },
    });

    if (!fornecedor) {
      throw new BadRequestException('Fornecedor nao encontrado para a empresa ativa');
    }

    return fornecedor;
  }

  private async validarContaBancaria(
    contaBancariaId: string,
    empresaId: string,
  ): Promise<ContaBancaria> {
    const contaBancaria = await this.contaBancariaRepository.findOne({
      where: {
        id: contaBancariaId,
        empresaId,
        ativo: true,
      },
    });

    if (!contaBancaria) {
      throw new BadRequestException('Conta bancaria nao encontrada ou inativa para a empresa ativa');
    }

    return contaBancaria;
  }

  private async findContaEntity(id: string, empresaId: string): Promise<ContaPagar> {
    const conta = await this.contaPagarRepository.findOne({
      where: { id, empresaId },
      relations: { fornecedor: true },
    });

    if (!conta) {
      throw new NotFoundException('Conta a pagar nao encontrada');
    }

    return conta;
  }

  private calcularValorTotal(
    valorOriginal: number,
    valorDesconto = 0,
    valorMulta = 0,
    valorJuros = 0,
  ): number {
    const total =
      Number(valorOriginal || 0) -
      Number(valorDesconto || 0) +
      Number(valorMulta || 0) +
      Number(valorJuros || 0);
    return total > 0 ? Number(total.toFixed(2)) : 0;
  }

  private async gerarNumeroConta(empresaId: string): Promise<string> {
    const anoMes = new Date().toISOString().slice(0, 7).replace('-', '');
    const prefixo = `CP-${anoMes}-`;

    const ultimoNumero = await this.contaPagarRepository
      .createQueryBuilder('conta')
      .select('conta.numero', 'numero')
      .where('conta.empresaId = :empresaId', { empresaId })
      .andWhere('conta.numero LIKE :prefixo', { prefixo: `${prefixo}%` })
      .orderBy('conta.numero', 'DESC')
      .limit(1)
      .getRawOne<{ numero?: string }>();

    const sequenciaAtual = Number(
      ultimoNumero?.numero?.split('-').pop()?.replace(/\D/g, '') || '0',
    );
    const proxima = String(sequenciaAtual + 1).padStart(4, '0');
    return `${prefixo}${proxima}`;
  }

  private calcularStatusAberto(conta: ContaPagar): 'pendente' | 'vencida' {
    const vencimento = new Date(conta.dataVencimento);
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    if (!Number.isNaN(vencimento.getTime()) && vencimento < inicioHoje) {
      return 'vencida';
    }

    return 'pendente';
  }

  private normalizarAnexos(anexos?: ContaPagarAnexoDto[] | unknown[]): Array<Record<string, unknown>> {
    if (!Array.isArray(anexos)) return [];

    return anexos
      .map((anexo) => {
        const item = (anexo || {}) as Record<string, unknown>;
        const nome = typeof item.nome === 'string' ? item.nome.trim() : '';
        if (!nome) return null;

        const tamanho = Number(item.tamanho || 0);
        return {
          nome,
          tipo: typeof item.tipo === 'string' && item.tipo.trim() ? item.tipo.trim() : 'application/octet-stream',
          tamanho: Number.isFinite(tamanho) && tamanho >= 0 ? tamanho : 0,
          ...(typeof item.url === 'string' && item.url.trim() ? { url: item.url.trim() } : {}),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }

  private gerarDatasRecorrencia(
    dataBase: Date,
    quantidadeParcelas: number,
    frequencia?: string,
  ): Date[] {
    const datas: Date[] = [];
    const base = new Date(dataBase);
    if (Number.isNaN(base.getTime())) return datas;

    for (let indice = 0; indice < quantidadeParcelas; indice += 1) {
      const dataParcela = new Date(base);
      if (indice > 0) {
        this.adicionarPeriodoRecorrencia(dataParcela, frequencia, indice);
      }
      datas.push(dataParcela);
    }

    return datas;
  }

  private adicionarPeriodoRecorrencia(data: Date, frequencia?: string, multiplicador = 1): void {
    const freq = (frequencia || 'mensal').toLowerCase();
    const mesesPorParcela =
      freq === 'bimestral'
        ? 2
        : freq === 'trimestral'
          ? 3
          : freq === 'semestral'
            ? 6
            : freq === 'anual'
              ? 12
              : 1;

    data.setMonth(data.getMonth() + mesesPorParcela * multiplicador);
  }

  private parseDateInputPreservingDay(value: string): Date {
    const raw = String(value || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return new Date(`${raw}T12:00:00`);
    }
    return new Date(raw);
  }

  private parseArrayFilter(value?: string | string[]): string[] {
    if (!value) return [];
    const raw = Array.isArray(value) ? value : String(value).split(',');
    return raw.map((item) => item.trim()).filter(Boolean);
  }

  private toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private asStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }

  private toDateOnly(value?: Date | string | null): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  private toIso(value?: Date | string | null): string {
    if (!value) return new Date(0).toISOString();
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return new Date(0).toISOString();
    return date.toISOString();
  }

  private buildNumero(conta: ContaPagar): string {
    if (conta.numero?.trim()) {
      return conta.numero.trim();
    }
    if (conta.numeroDocumento?.trim()) {
      return conta.numeroDocumento.trim();
    }
    return `CP-${conta.id.slice(0, 8).toUpperCase()}`;
  }

  private mapStatusToUi(conta: ContaPagar): StatusContaPagarUI {
    if (conta.status === 'paga') return 'pago';
    if (conta.status === 'cancelada') return 'cancelado';
    if (conta.status === 'vencida') return 'vencido';
    return this.calcularStatusAberto(conta) === 'vencida' ? 'vencido' : 'em_aberto';
  }

  private mapContaPagarResponse(
    conta: ContaPagar,
    overrides?: ContaPagarResponseOverrides,
  ): ContaPagarResponse {
    const valorOriginal = this.toNumber(
      overrides?.valorOriginal ?? conta.valorOriginal ?? conta.valor,
      0,
    );
    const valorDesconto = this.toNumber(overrides?.valorDesconto ?? conta.valorDesconto, 0);
    const valorMulta = this.toNumber(overrides?.valorMulta ?? conta.valorMulta, 0);
    const valorJuros = this.toNumber(overrides?.valorJuros ?? conta.valorJuros, 0);
    const valorTotal = this.toNumber(
      conta.valorTotal ?? conta.valor ?? this.calcularValorTotal(valorOriginal, valorDesconto, valorMulta, valorJuros),
      0,
    );
    const status = this.mapStatusToUi(conta);
    const valorPago = this.toNumber(
      overrides?.valorPago ?? conta.valorPago ?? (status === 'pago' ? valorTotal : 0),
      0,
    );
    const valorRestante = Math.max(
      this.toNumber(conta.valorRestante, valorTotal - valorPago),
      0,
    );
    const tags = overrides?.tags ?? this.asStringArray(conta.tags);
    const anexos = Array.isArray(conta.anexos) ? conta.anexos : [];
    const tipoPagamento =
      overrides?.tipoPagamento || conta.tipoPagamento || conta.formaPagamento || undefined;
    const contaBancariaId = overrides?.contaBancariaId || conta.contaBancariaId || undefined;

    return {
      id: conta.id,
      numero: overrides?.numero || this.buildNumero(conta),
      fornecedorId: conta.fornecedorId,
      fornecedor: {
        id: conta.fornecedor?.id || conta.fornecedorId,
        nome: conta.fornecedor?.nome || 'Fornecedor nao identificado',
        cnpjCpf: conta.fornecedor?.cnpjCpf || '',
        email: conta.fornecedor?.email || undefined,
        telefone: conta.fornecedor?.telefone || undefined,
        ativo: conta.fornecedor?.ativo ?? true,
        criadoEm: this.toIso(conta.fornecedor?.criadoEm),
        atualizadoEm: this.toIso(conta.fornecedor?.atualizadoEm),
      },
      descricao: conta.descricao,
      numeroDocumento: conta.numeroDocumento || undefined,
      dataEmissao: overrides?.dataEmissao || this.toDateOnly(conta.dataEmissao || conta.createdAt),
      dataVencimento: this.toDateOnly(conta.dataVencimento),
      dataPagamento: conta.dataPagamento ? this.toDateOnly(conta.dataPagamento) : undefined,
      dataAgendamento: conta.dataAgendamento ? this.toDateOnly(conta.dataAgendamento) : undefined,
      valorOriginal: this.toNumber(valorOriginal, 0),
      valorDesconto: this.toNumber(valorDesconto, 0),
      valorMulta: this.toNumber(valorMulta, 0),
      valorJuros: this.toNumber(valorJuros, 0),
      valorTotal,
      valorPago: this.toNumber(valorPago, 0),
      valorRestante,
      status,
      categoria: overrides?.categoria || conta.categoria || 'outros',
      prioridade: overrides?.prioridade || conta.prioridade || 'media',
      recorrente: overrides?.recorrente ?? !!conta.recorrente,
      frequenciaRecorrencia:
        overrides?.frequenciaRecorrencia || conta.frequenciaRecorrencia || undefined,
      necessitaAprovacao: !!conta.necessitaAprovacao,
      observacoes: conta.observacoes || undefined,
      comprovantePagamento: conta.comprovantePagamento || undefined,
      criadoPor: conta.criadoPor || 'sistema',
      criadoEm: this.toIso(conta.createdAt),
      atualizadoPor: conta.atualizadoPor || undefined,
      atualizadoEm: this.toIso(conta.updatedAt),
      tipoPagamento,
      contaBancariaId,
      anexos,
      tags,
    };
  }
}
