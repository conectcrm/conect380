import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AprovarLoteContasPagarDto,
  AprovarContaPagarDto,
  ContaPagarAnexoDto,
  CreateContaPagarDto,
  QueryExportacaoContasPagarDto,
  QueryHistoricoExportacaoContasPagarDto,
  QueryContasPagarDto,
  RegistrarPagamentoContaPagarDto,
  ReprovarContaPagarDto,
  UpdateContaPagarDto,
} from '../dto/conta-pagar.dto';
import { ContaPagar } from '../entities/conta-pagar.entity';
import { Fornecedor } from '../entities/fornecedor.entity';
import { ContaBancaria } from '../entities/conta-bancaria.entity';
import {
  ContaPagarExportacao,
  ContaPagarExportacaoFormato,
  ContaPagarExportacaoStatus,
} from '../entities/conta-pagar-exportacao.entity';
import { EmpresaConfig } from '../../empresas/entities/empresa-config.entity';
import * as ExcelJS from 'exceljs';

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
  aprovadoPor?: string;
  dataAprovacao?: string;
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

type AcaoAprovacaoLote = 'aprovar' | 'reprovar';

type ResultadoAprovacaoLoteItem = {
  contaId: string;
  acao: AcaoAprovacaoLote;
  sucesso: boolean;
  mensagem?: string;
  conta?: ContaPagarResponse;
};

type ResultadoAprovacaoLoteResponse = {
  total: number;
  sucesso: number;
  falha: number;
  itens: ResultadoAprovacaoLoteItem[];
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

type ExportacaoContasPagarResponse = {
  filename: string;
  contentType: string;
  buffer: Buffer;
  totalRegistros: number;
};

type HistoricoExportacaoContasPagarItem = {
  id: string;
  formato: ContaPagarExportacaoFormato;
  status: ContaPagarExportacaoStatus;
  nomeArquivo?: string;
  totalRegistros: number;
  erro?: string;
  filtros: Record<string, unknown>;
  usuarioId?: string;
  iniciadoEm: string;
  finalizadoEm?: string;
  createdAt: string;
};

type ExportacaoContaPagarLinha = {
  numero: string;
  numeroDocumento: string;
  fornecedor: string;
  cnpjCpfFornecedor: string;
  categoria: string;
  centroCustoId: string;
  dataEmissao: string;
  dataVencimento: string;
  dataPagamento: string;
  statusConta: string;
  valorOriginal: number;
  valorPago: number;
  valorRestante: number;
  valorTotal: number;
  contaBancariaId: string;
  formaPagamento: string;
  observacoes: string;
};

@Injectable()
export class ContaPagarService {
  constructor(
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: Repository<ContaPagar>,
    @InjectRepository(Fornecedor)
    private readonly fornecedorRepository: Repository<Fornecedor>,
    @InjectRepository(ContaBancaria)
    private readonly contaBancariaRepository: Repository<ContaBancaria>,
    @InjectRepository(ContaPagarExportacao)
    private readonly contaPagarExportacaoRepository: Repository<ContaPagarExportacao>,
    @InjectRepository(EmpresaConfig)
    private readonly empresaConfigRepository: Repository<EmpresaConfig>,
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

  async exportarContasPagar(
    empresaId: string,
    filtros: QueryExportacaoContasPagarDto = {},
    usuarioId = 'sistema',
  ): Promise<ExportacaoContasPagarResponse> {
    const formato = this.normalizarFormatoExportacao(filtros.formato);
    const filtrosNormalizados = this.normalizarFiltrosExportacao(filtros);
    const exportacao = this.contaPagarExportacaoRepository.create({
      empresaId,
      usuarioId,
      formato,
      status: ContaPagarExportacaoStatus.PROCESSANDO,
      filtros: filtrosNormalizados,
      totalRegistros: 0,
      iniciadoEm: new Date(),
    });
    await this.contaPagarExportacaoRepository.save(exportacao);

    try {
      const contas = await this.buscarContasParaExportacao(empresaId, filtros);
      const linhas = contas.map((conta) => this.mapContaPagarExportacao(conta));
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename =
        formato === ContaPagarExportacaoFormato.XLSX
          ? `contas-pagar-${timestamp}.xlsx`
          : `contas-pagar-${timestamp}.csv`;
      const contentType =
        formato === ContaPagarExportacaoFormato.XLSX
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv; charset=utf-8';
      const buffer =
        formato === ContaPagarExportacaoFormato.XLSX
          ? await this.gerarBufferXlsxExportacao(linhas)
          : this.gerarBufferCsvExportacao(linhas);

      exportacao.status = ContaPagarExportacaoStatus.SUCESSO;
      exportacao.nomeArquivo = filename;
      exportacao.totalRegistros = linhas.length;
      exportacao.finalizadoEm = new Date();
      exportacao.erro = undefined;
      await this.contaPagarExportacaoRepository.save(exportacao);

      return {
        filename,
        contentType,
        buffer,
        totalRegistros: linhas.length,
      };
    } catch (error) {
      exportacao.status = ContaPagarExportacaoStatus.FALHA;
      exportacao.finalizadoEm = new Date();
      exportacao.erro = this.extrairMensagemErro(error);
      await this.contaPagarExportacaoRepository.save(exportacao);
      throw error;
    }
  }

  async listarHistoricoExportacoes(
    empresaId: string,
    filtros: QueryHistoricoExportacaoContasPagarDto = {},
  ): Promise<HistoricoExportacaoContasPagarItem[]> {
    const qb = this.contaPagarExportacaoRepository
      .createQueryBuilder('exportacao')
      .where('exportacao.empresaId = :empresaId', { empresaId })
      .orderBy('exportacao.createdAt', 'DESC');

    if (filtros.formato) {
      qb.andWhere('exportacao.formato = :formato', { formato: filtros.formato });
    }

    if (filtros.status) {
      qb.andWhere('exportacao.status = :status', { status: filtros.status });
    }

    qb.limit(Math.max(1, Number(filtros.limite || 20)));

    const itens = await qb.getMany();
    return itens.map((item) => ({
      id: item.id,
      formato: item.formato,
      status: item.status,
      nomeArquivo: item.nomeArquivo,
      totalRegistros: item.totalRegistros,
      erro: item.erro,
      filtros: item.filtros || {},
      usuarioId: item.usuarioId,
      iniciadoEm: this.toIso(item.iniciadoEm),
      finalizadoEm: item.finalizadoEm ? this.toIso(item.finalizadoEm) : undefined,
      createdAt: this.toIso(item.createdAt),
    }));
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
    const alcadaAprovacaoFinanceira = await this.obterAlcadaAprovacaoFinanceira(empresaId);
    const necessitaAprovacao = this.calcularNecessitaAprovacaoConta(
      valorTotal,
      !!createContaPagarDto.necessitaAprovacao,
      alcadaAprovacaoFinanceira,
    );
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
        necessitaAprovacao,
        aprovadoPor: undefined,
        dataAprovacao: undefined,
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

    const valorContaAtualizado = Number(conta.valorTotal ?? conta.valor ?? 0);
    const alcadaAprovacaoFinanceira = await this.obterAlcadaAprovacaoFinanceira(empresaId);
    const necessitaAprovacaoManual =
      updateContaPagarDto.necessitaAprovacao !== undefined
        ? !!updateContaPagarDto.necessitaAprovacao
        : !!conta.necessitaAprovacao;
    const necessitaAprovacaoCalculada = this.calcularNecessitaAprovacaoConta(
      valorContaAtualizado,
      necessitaAprovacaoManual,
      alcadaAprovacaoFinanceira,
    );
    const necessitaAprovacaoAnterior = !!conta.necessitaAprovacao;

    conta.necessitaAprovacao = necessitaAprovacaoCalculada;

    if (!necessitaAprovacaoCalculada || !necessitaAprovacaoAnterior) {
      conta.aprovadoPor = undefined;
      conta.dataAprovacao = undefined;
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

    if (conta.necessitaAprovacao && !conta.dataAprovacao) {
      throw new BadRequestException(
        'Conta aguardando aprovacao financeira. Aprove a conta antes de registrar pagamento.',
      );
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

  async aprovar(
    id: string,
    dto: AprovarContaPagarDto,
    empresaId: string,
    userId: string,
  ): Promise<ContaPagarResponse> {
    const conta = await this.findContaEntity(id, empresaId);

    if (conta.status === 'cancelada') {
      throw new BadRequestException('Nao e possivel aprovar conta cancelada');
    }

    if (conta.status === 'paga') {
      throw new BadRequestException('Nao e possivel aprovar conta ja paga');
    }

    if (!conta.necessitaAprovacao) {
      throw new BadRequestException('Conta nao exige aprovacao financeira');
    }

    if (conta.dataAprovacao) {
      throw new BadRequestException('Conta ja foi aprovada');
    }

    conta.aprovadoPor = userId || 'sistema';
    conta.dataAprovacao = new Date();
    conta.atualizadoPor = userId || 'sistema';
    conta.status = this.calcularStatusAberto(conta);

    if (dto.observacoes?.trim()) {
      conta.observacoes = conta.observacoes
        ? `${conta.observacoes}\n${dto.observacoes.trim()}`
        : dto.observacoes.trim();
    }

    const saved = await this.contaPagarRepository.save(conta);
    const withFornecedor = await this.findContaEntity(saved.id, empresaId);
    return this.mapContaPagarResponse(withFornecedor);
  }

  async reprovar(
    id: string,
    dto: ReprovarContaPagarDto,
    empresaId: string,
    userId: string,
  ): Promise<ContaPagarResponse> {
    const conta = await this.findContaEntity(id, empresaId);

    if (conta.status === 'cancelada') {
      throw new BadRequestException('Conta ja esta cancelada');
    }

    if (conta.status === 'paga') {
      throw new BadRequestException('Nao e possivel reprovar conta ja paga');
    }

    if (!conta.necessitaAprovacao) {
      throw new BadRequestException('Conta nao exige aprovacao financeira');
    }

    if (conta.dataAprovacao) {
      throw new BadRequestException('Conta ja foi aprovada e nao pode ser reprovada');
    }

    const justificativa = dto.justificativa?.trim();
    if (!justificativa) {
      throw new BadRequestException('Justificativa obrigatoria para reprovar conta');
    }

    conta.status = 'cancelada';
    conta.aprovadoPor = undefined;
    conta.dataAprovacao = undefined;
    conta.atualizadoPor = userId || 'sistema';
    conta.observacoes = conta.observacoes
      ? `${conta.observacoes}\nReprovada por ${userId || 'sistema'}: ${justificativa}`
      : `Reprovada por ${userId || 'sistema'}: ${justificativa}`;

    const saved = await this.contaPagarRepository.save(conta);
    const withFornecedor = await this.findContaEntity(saved.id, empresaId);
    return this.mapContaPagarResponse(withFornecedor);
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

  async listarPendenciasAprovacao(
    empresaId: string,
    filtros: QueryContasPagarDto = {},
  ): Promise<ContaPagarResponse[]> {
    const contas = await this.findAll(empresaId, filtros);
    return contas.filter((conta) => this.isContaAguardandoAprovacao(conta));
  }

  async aprovarLote(
    dto: AprovarLoteContasPagarDto,
    empresaId: string,
    userId: string,
  ): Promise<ResultadoAprovacaoLoteResponse> {
    const contaIds = Array.from(
      new Set(
        (dto.contaIds || [])
          .map((item) => String(item || '').trim())
          .filter(Boolean),
      ),
    );

    if (contaIds.length === 0) {
      throw new BadRequestException('Informe ao menos uma conta para aprovacao em lote');
    }

    if (dto.acao === 'reprovar' && !dto.justificativa?.trim()) {
      throw new BadRequestException('Justificativa obrigatoria para reprovar em lote');
    }

    const itens: ResultadoAprovacaoLoteItem[] = [];

    for (const contaId of contaIds) {
      try {
        const conta =
          dto.acao === 'aprovar'
            ? await this.aprovar(
                contaId,
                { observacoes: dto.observacoes },
                empresaId,
                userId,
              )
            : await this.reprovar(
                contaId,
                { justificativa: String(dto.justificativa || '').trim() },
                empresaId,
                userId,
              );

        itens.push({
          contaId,
          acao: dto.acao,
          sucesso: true,
          conta,
        });
      } catch (error) {
        itens.push({
          contaId,
          acao: dto.acao,
          sucesso: false,
          mensagem: this.extrairMensagemErro(error),
        });
      }
    }

    const sucesso = itens.filter((item) => item.sucesso).length;

    return {
      total: itens.length,
      sucesso,
      falha: itens.length - sucesso,
      itens,
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

  private async buscarContasParaExportacao(
    empresaId: string,
    filtros: QueryExportacaoContasPagarDto,
  ): Promise<ContaPagar[]> {
    const qb = this.contaPagarRepository
      .createQueryBuilder('conta')
      .leftJoinAndSelect('conta.fornecedor', 'fornecedor')
      .where('conta.empresaId = :empresaId', { empresaId });

    if (filtros.fornecedorId) {
      qb.andWhere('conta.fornecedorId = :fornecedorId', { fornecedorId: filtros.fornecedorId });
    }

    if (filtros.contaBancariaId?.trim()) {
      qb.andWhere('conta.contaBancariaId = :contaBancariaId', {
        contaBancariaId: filtros.contaBancariaId.trim(),
      });
    }

    if (filtros.centroCustoId?.trim()) {
      qb.andWhere('conta.centroCustoId = :centroCustoId', {
        centroCustoId: filtros.centroCustoId.trim(),
      });
    }

    const statusFiltros = this.mapStatusFiltrosExportacao(filtros.status);
    if (statusFiltros.length > 0) {
      qb.andWhere('conta.status IN (:...status)', { status: statusFiltros });
    }

    if (filtros.dataVencimentoInicio) {
      qb.andWhere('conta.dataVencimento >= :dataVencimentoInicio', {
        dataVencimentoInicio: filtros.dataVencimentoInicio,
      });
    }

    if (filtros.dataVencimentoFim) {
      qb.andWhere('conta.dataVencimento <= :dataVencimentoFim', {
        dataVencimentoFim: filtros.dataVencimentoFim,
      });
    }

    if (filtros.dataEmissaoInicio) {
      qb.andWhere('conta.dataEmissao >= :dataEmissaoInicio', {
        dataEmissaoInicio: filtros.dataEmissaoInicio,
      });
    }

    if (filtros.dataEmissaoFim) {
      qb.andWhere('conta.dataEmissao <= :dataEmissaoFim', {
        dataEmissaoFim: filtros.dataEmissaoFim,
      });
    }

    qb.orderBy('conta.dataVencimento', 'ASC').addOrderBy('conta.id', 'ASC');
    return qb.getMany();
  }

  private normalizarFormatoExportacao(formato?: string): ContaPagarExportacaoFormato {
    return String(formato || 'csv').trim().toLowerCase() === 'xlsx'
      ? ContaPagarExportacaoFormato.XLSX
      : ContaPagarExportacaoFormato.CSV;
  }

  private normalizarFiltrosExportacao(
    filtros: QueryExportacaoContasPagarDto,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      formato: this.normalizarFormatoExportacao(filtros.formato),
      status: this.mapStatusFiltrosExportacao(filtros.status),
      fornecedorId: filtros.fornecedorId || null,
      contaBancariaId: filtros.contaBancariaId?.trim() || null,
      centroCustoId: filtros.centroCustoId?.trim() || null,
      dataVencimentoInicio: filtros.dataVencimentoInicio || null,
      dataVencimentoFim: filtros.dataVencimentoFim || null,
      dataEmissaoInicio: filtros.dataEmissaoInicio || null,
      dataEmissaoFim: filtros.dataEmissaoFim || null,
    };

    return payload;
  }

  private mapContaPagarExportacao(conta: ContaPagar): ExportacaoContaPagarLinha {
    const valorTotal = this.toNumber(conta.valorTotal ?? conta.valor, 0);
    const valorPago = this.toNumber(conta.valorPago, conta.status === 'paga' ? valorTotal : 0);
    const valorRestante = Math.max(this.toNumber(conta.valorRestante, valorTotal - valorPago), 0);

    return {
      numero: this.buildNumero(conta),
      numeroDocumento: conta.numeroDocumento || '',
      fornecedor: conta.fornecedor?.nome || '',
      cnpjCpfFornecedor: conta.fornecedor?.cnpjCpf || '',
      categoria: conta.categoria || '',
      centroCustoId: conta.centroCustoId || '',
      dataEmissao: this.toDateOnly(conta.dataEmissao),
      dataVencimento: this.toDateOnly(conta.dataVencimento),
      dataPagamento: this.toDateOnly(conta.dataPagamento),
      statusConta: this.mapStatusToUi(conta),
      valorOriginal: this.toNumber(conta.valorOriginal ?? conta.valor, 0),
      valorPago,
      valorRestante,
      valorTotal,
      contaBancariaId: conta.contaBancariaId || '',
      formaPagamento: conta.tipoPagamento || conta.formaPagamento || '',
      observacoes: conta.observacoes || '',
    };
  }

  private gerarBufferCsvExportacao(linhas: ExportacaoContaPagarLinha[]): Buffer {
    const headers = [
      'numero',
      'numero_documento',
      'fornecedor',
      'cnpj_cpf_fornecedor',
      'categoria',
      'centro_custo_id',
      'data_emissao',
      'data_vencimento',
      'data_pagamento',
      'status_conta',
      'valor_original',
      'valor_pago',
      'valor_restante',
      'valor_total',
      'conta_bancaria_id',
      'forma_pagamento',
      'observacoes',
    ];

    const escape = (value: unknown): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = linhas.map((linha) =>
      [
        linha.numero,
        linha.numeroDocumento,
        linha.fornecedor,
        linha.cnpjCpfFornecedor,
        linha.categoria,
        linha.centroCustoId,
        linha.dataEmissao,
        linha.dataVencimento,
        linha.dataPagamento,
        linha.statusConta,
        linha.valorOriginal.toFixed(2),
        linha.valorPago.toFixed(2),
        linha.valorRestante.toFixed(2),
        linha.valorTotal.toFixed(2),
        linha.contaBancariaId,
        linha.formaPagamento,
        linha.observacoes,
      ]
        .map(escape)
        .join(';'),
    );

    const csv = [headers.join(';'), ...rows].join('\n');
    return Buffer.from(`\uFEFF${csv}`, 'utf-8');
  }

  private async gerarBufferXlsxExportacao(linhas: ExportacaoContaPagarLinha[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Contas a pagar');

    worksheet.columns = [
      { header: 'Numero', key: 'numero', width: 20 },
      { header: 'Documento', key: 'numeroDocumento', width: 24 },
      { header: 'Fornecedor', key: 'fornecedor', width: 36 },
      { header: 'CNPJ/CPF', key: 'cnpjCpfFornecedor', width: 22 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Centro de custo', key: 'centroCustoId', width: 20 },
      { header: 'Data emissao', key: 'dataEmissao', width: 14 },
      { header: 'Data vencimento', key: 'dataVencimento', width: 16 },
      { header: 'Data pagamento', key: 'dataPagamento', width: 16 },
      { header: 'Status', key: 'statusConta', width: 14 },
      { header: 'Valor original', key: 'valorOriginal', width: 16 },
      { header: 'Valor pago', key: 'valorPago', width: 14 },
      { header: 'Valor restante', key: 'valorRestante', width: 16 },
      { header: 'Valor total', key: 'valorTotal', width: 14 },
      { header: 'Conta bancaria', key: 'contaBancariaId', width: 38 },
      { header: 'Forma pagamento', key: 'formaPagamento', width: 18 },
      { header: 'Observacoes', key: 'observacoes', width: 40 },
    ];

    linhas.forEach((linha) => {
      worksheet.addRow(linha);
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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

  private mapStatusFiltrosExportacao(value?: string | string[]): string[] {
    const raw = this.parseArrayFilter(value);
    if (raw.length === 0) return [];

    const mapped = raw
      .map((item) => {
        const status = item.toLowerCase();
        if (status === 'pago') return 'paga';
        if (status === 'vencido') return 'vencida';
        if (status === 'cancelado') return 'cancelada';
        if (status === 'em_aberto') return 'pendente';
        if (status === 'pendente' || status === 'paga' || status === 'vencida' || status === 'cancelada') {
          return status;
        }
        return '';
      })
      .filter(Boolean);

    return Array.from(new Set(mapped));
  }

  private isContaAguardandoAprovacao(
    conta: Pick<ContaPagarResponse, 'necessitaAprovacao' | 'dataAprovacao' | 'status'>,
  ): boolean {
    return Boolean(
      conta.necessitaAprovacao &&
        !conta.dataAprovacao &&
        conta.status !== 'pago' &&
        conta.status !== 'cancelado',
    );
  }

  private extrairMensagemErro(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
      if (Array.isArray(message)) {
        const first = message.find((item) => typeof item === 'string' && item.trim());
        if (first) {
          return first.trim();
        }
      }
    }

    return 'Falha ao processar aprovacao em lote';
  }

  private async obterAlcadaAprovacaoFinanceira(empresaId: string): Promise<number | null> {
    const config = await this.empresaConfigRepository.findOne({
      where: { empresaId },
    });

    const valor = Number(config?.alcadaAprovacaoFinanceira ?? 0);
    if (!Number.isFinite(valor) || valor <= 0) {
      return null;
    }

    return Number(valor.toFixed(2));
  }

  private calcularNecessitaAprovacaoConta(
    valorTotal: number,
    necessitaAprovacaoManual: boolean,
    alcadaAprovacaoFinanceira: number | null,
  ): boolean {
    if (necessitaAprovacaoManual) {
      return true;
    }

    if (alcadaAprovacaoFinanceira === null) {
      return false;
    }

    return Number(valorTotal || 0) >= alcadaAprovacaoFinanceira;
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
      aprovadoPor: conta.aprovadoPor || undefined,
      dataAprovacao: conta.dataAprovacao ? this.toIso(conta.dataAprovacao) : undefined,
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
