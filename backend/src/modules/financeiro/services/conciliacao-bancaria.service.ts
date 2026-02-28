import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Papa from 'papaparse';
import { Repository } from 'typeorm';
import {
  ConciliarItemExtratoDto,
  DesconciliarItemExtratoDto,
  ExecutarMatchingAutomaticoDto,
  ImportarExtratoBancarioDto,
  QueryCandidatosConciliacaoDto,
  QueryImportacoesExtratoDto,
  QueryItensImportacaoExtratoDto,
} from '../dto/conciliacao-bancaria.dto';
import { ContaBancaria } from '../entities/conta-bancaria.entity';
import { ContaPagar } from '../entities/conta-pagar.entity';
import { ExtratoBancarioImportacao, TipoArquivoExtratoBancario } from '../entities/extrato-bancario-importacao.entity';
import {
  ExtratoBancarioItem,
  OrigemConciliacaoExtratoBancario,
  TipoLancamentoExtratoBancario,
} from '../entities/extrato-bancario-item.entity';

type ArquivoImportacaoExtrato = Pick<
  Express.Multer.File,
  'originalname' | 'mimetype' | 'size' | 'buffer'
>;

type ErroImportacaoExtrato = {
  linha?: number;
  mensagem: string;
  conteudo?: unknown;
};

type LancamentoExtratoNormalizado = {
  dataLancamento: Date;
  descricao: string;
  valor: number;
  tipo: TipoLancamentoExtratoBancario;
  documento?: string;
  referenciaExterna?: string;
  saldoPosLancamento?: number;
  dadosOriginais: Record<string, unknown>;
};

type ResultadoNormalizacaoExtrato = {
  lancamentos: LancamentoExtratoNormalizado[];
  erros: ErroImportacaoExtrato[];
};

type ImportacaoExtratoResponse = {
  id: string;
  contaBancariaId: string;
  nomeArquivo: string;
  tipoArquivo: TipoArquivoExtratoBancario;
  totalLancamentos: number;
  totalEntradas: number;
  totalSaidas: number;
  periodoInicio?: string;
  periodoFim?: string;
  createdAt: string;
};

type ItemImportacaoExtratoResponse = {
  id: string;
  importacaoId: string;
  dataLancamento: string;
  descricao: string;
  documento?: string;
  referenciaExterna?: string;
  tipo: TipoLancamentoExtratoBancario;
  valor: number;
  saldoPosLancamento?: number;
  conciliado: boolean;
  contaPagarId?: string;
  contaPagarNumero?: string;
  contaPagarDescricao?: string;
  contaPagarFornecedorNome?: string;
  dataConciliacao?: string;
  conciliadoPor?: string;
  conciliacaoOrigem?: OrigemConciliacaoExtratoBancario;
  motivoConciliacao?: string;
  auditoriaConciliacao: Array<Record<string, unknown>>;
  createdAt: string;
};

type ResultadoImportacaoExtratoResponse = {
  importacao: ImportacaoExtratoResponse;
  resumo: {
    totalLancamentos: number;
    totalEntradas: number;
    totalSaidas: number;
    periodoInicio?: string;
    periodoFim?: string;
  };
  erros: ErroImportacaoExtrato[];
  itensPreview: ItemImportacaoExtratoResponse[];
};

type ContaPagarCandidataConciliacaoResponse = {
  id: string;
  numero: string;
  numeroDocumento?: string;
  descricao: string;
  fornecedorNome?: string;
  dataPagamento?: string;
  dataVencimento?: string;
  valorTotal: number;
  valorPago: number;
  score: number;
  criterios: string[];
};

type ItemConciliadoAutomaticamente = {
  itemId: string;
  contaPagarId: string;
  score: number;
  criterios: string[];
};

type ResultadoMatchingAutomaticoResponse = {
  importacaoId: string;
  totalItensAnalisados: number;
  totalConciliados: number;
  totalPendentes: number;
  itensConciliados: ItemConciliadoAutomaticamente[];
};

type OpcaoBuscaCandidatos = {
  limite: number;
  toleranciaDias: number;
};

type CandidatoConciliacaoInterno = {
  conta: ContaPagar;
  score: number;
  criterios: string[];
};

@Injectable()
export class ConciliacaoBancariaService {
  constructor(
    @InjectRepository(ExtratoBancarioImportacao)
    private readonly importacaoRepository: Repository<ExtratoBancarioImportacao>,
    @InjectRepository(ExtratoBancarioItem)
    private readonly itemRepository: Repository<ExtratoBancarioItem>,
    @InjectRepository(ContaBancaria)
    private readonly contaBancariaRepository: Repository<ContaBancaria>,
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: Repository<ContaPagar>,
  ) {}

  async listarImportacoes(
    empresaId: string,
    filtros: QueryImportacoesExtratoDto = {},
  ): Promise<ImportacaoExtratoResponse[]> {
    const limite = this.normalizarLimite(filtros.limite, 20, 100);
    const query = this.importacaoRepository
      .createQueryBuilder('importacao')
      .where('importacao.empresaId = :empresaId', { empresaId })
      .orderBy('importacao.createdAt', 'DESC')
      .limit(limite);

    if (filtros.contaBancariaId) {
      query.andWhere('importacao.contaBancariaId = :contaBancariaId', {
        contaBancariaId: filtros.contaBancariaId,
      });
    }

    const importacoes = await query.getMany();
    return importacoes.map((item) => this.mapImportacaoResponse(item));
  }

  async listarItensImportacao(
    importacaoId: string,
    empresaId: string,
    filtros: QueryItensImportacaoExtratoDto = {},
  ): Promise<ItemImportacaoExtratoResponse[]> {
    const importacao = await this.importacaoRepository.findOne({
      where: { id: importacaoId, empresaId },
    });

    if (!importacao) {
      throw new NotFoundException('Importacao de extrato nao encontrada');
    }

    const limite = this.normalizarLimite(filtros.limite, 200, 500);
    const query = this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.contaPagar', 'contaPagar')
      .leftJoinAndSelect('contaPagar.fornecedor', 'fornecedor')
      .where('item.importacaoId = :importacaoId', { importacaoId })
      .andWhere('item.empresaId = :empresaId', { empresaId })
      .orderBy('item.dataLancamento', 'DESC')
      .addOrderBy('item.createdAt', 'DESC')
      .limit(limite);

    if (typeof filtros.conciliado === 'boolean') {
      query.andWhere('item.conciliado = :conciliado', {
        conciliado: filtros.conciliado,
      });
    }

    const itens = await query.getMany();

    return itens.map((item) => this.mapItemResponse(item));
  }

  async importarExtrato(
    dto: ImportarExtratoBancarioDto,
    arquivo: ArquivoImportacaoExtrato | undefined,
    empresaId: string,
    userId: string,
  ): Promise<ResultadoImportacaoExtratoResponse> {
    if (!arquivo) {
      throw new BadRequestException('Arquivo de extrato nao informado');
    }

    if (!arquivo.buffer || arquivo.buffer.length === 0) {
      throw new BadRequestException('Arquivo vazio');
    }

    const contaBancaria = await this.contaBancariaRepository.findOne({
      where: {
        id: dto.contaBancariaId,
        empresaId,
        ativo: true,
      },
    });

    if (!contaBancaria) {
      throw new BadRequestException('Conta bancaria nao encontrada ou inativa para a empresa ativa');
    }

    const tipoArquivo = this.identificarTipoArquivo(arquivo.originalname, arquivo.mimetype);
    if (!tipoArquivo) {
      throw new BadRequestException('Formato de arquivo nao suportado. Envie um arquivo OFX ou CSV');
    }

    const conteudo = arquivo.buffer.toString('utf-8');
    if (!conteudo.trim()) {
      throw new BadRequestException('Arquivo nao possui conteudo para importacao');
    }

    const normalizacao =
      tipoArquivo === TipoArquivoExtratoBancario.CSV
        ? this.normalizarLancamentosCsv(conteudo)
        : this.normalizarLancamentosOfx(conteudo);

    if (normalizacao.lancamentos.length === 0) {
      throw new BadRequestException({
        message: 'Nenhum lancamento valido encontrado no arquivo informado',
        erros: normalizacao.erros.slice(0, 100),
      });
    }

    const totalEntradas = this.somarValores(normalizacao.lancamentos, TipoLancamentoExtratoBancario.CREDITO);
    const totalSaidas = this.somarValores(normalizacao.lancamentos, TipoLancamentoExtratoBancario.DEBITO);
    const periodoInicio = this.obterMenorData(normalizacao.lancamentos);
    const periodoFim = this.obterMaiorData(normalizacao.lancamentos);
    const errosImportacao = normalizacao.erros.slice(0, 200);

    const transacao = await this.importacaoRepository.manager.transaction(async (manager) => {
      const importacao = manager.create(ExtratoBancarioImportacao, {
        empresaId,
        contaBancariaId: contaBancaria.id,
        nomeArquivo: arquivo.originalname || 'extrato-sem-nome',
        tipoArquivo,
        totalLancamentos: normalizacao.lancamentos.length,
        totalEntradas,
        totalSaidas,
        periodoInicio,
        periodoFim,
        status: 'processado',
        errosImportacao,
        criadoPor: userId || 'sistema',
      });

      const importacaoSalva = await manager.save(importacao);

      const itens = normalizacao.lancamentos.map((lancamento) =>
        manager.create(ExtratoBancarioItem, {
          importacaoId: importacaoSalva.id,
          empresaId,
          contaBancariaId: contaBancaria.id,
          dataLancamento: lancamento.dataLancamento,
          descricao: lancamento.descricao,
          documento: lancamento.documento,
          referenciaExterna: lancamento.referenciaExterna,
          tipo: lancamento.tipo,
          valor: lancamento.valor,
          saldoPosLancamento: lancamento.saldoPosLancamento,
          conciliado: false,
          dadosOriginais: lancamento.dadosOriginais,
        }),
      );

      const itensSalvos = await manager.save(itens);
      return { importacaoSalva, itensSalvos };
    });

    return {
      importacao: this.mapImportacaoResponse(transacao.importacaoSalva),
      resumo: {
        totalLancamentos: transacao.importacaoSalva.totalLancamentos,
        totalEntradas: Number(transacao.importacaoSalva.totalEntradas || 0),
        totalSaidas: Number(transacao.importacaoSalva.totalSaidas || 0),
        periodoInicio: this.toDateOnly(transacao.importacaoSalva.periodoInicio),
        periodoFim: this.toDateOnly(transacao.importacaoSalva.periodoFim),
      },
      erros: errosImportacao,
      itensPreview: transacao.itensSalvos.slice(0, 20).map((item) => this.mapItemResponse(item)),
    };
  }

  async executarMatchingAutomatico(
    importacaoId: string,
    empresaId: string,
    userId: string,
    dto: ExecutarMatchingAutomaticoDto = {},
  ): Promise<ResultadoMatchingAutomaticoResponse> {
    const importacao = await this.importacaoRepository.findOne({
      where: { id: importacaoId, empresaId },
    });

    if (!importacao) {
      throw new NotFoundException('Importacao de extrato nao encontrada');
    }

    const toleranciaDias =
      dto.toleranciaDias !== undefined
        ? Math.max(0, Math.min(10, Math.floor(Number(dto.toleranciaDias))))
        : 3;

    const itensPendentes = await this.itemRepository.find({
      where: {
        importacaoId,
        empresaId,
        conciliado: false,
        tipo: TipoLancamentoExtratoBancario.DEBITO,
      },
      order: {
        dataLancamento: 'DESC',
        createdAt: 'DESC',
      },
    });

    const itensConciliados: ItemConciliadoAutomaticamente[] = [];

    for (const item of itensPendentes) {
      const candidatos = await this.obterCandidatosConciliacaoInterno(item, empresaId, {
        limite: 5,
        toleranciaDias,
      });

      if (candidatos.length === 0) {
        continue;
      }

      const melhor = candidatos[0];
      const segundoMelhor = candidatos[1];

      if (melhor.score < 80) {
        continue;
      }

      if (segundoMelhor && melhor.score - segundoMelhor.score < 12) {
        continue;
      }

      await this.aplicarConciliacao(item, melhor.conta, 'automatica', userId || 'sistema', {
        observacao: `Matching automatico por ${melhor.criterios.join(', ')}`,
        score: melhor.score,
        criterios: melhor.criterios,
        acao: 'matching_automatico',
      });

      itensConciliados.push({
        itemId: item.id,
        contaPagarId: melhor.conta.id,
        score: melhor.score,
        criterios: melhor.criterios,
      });
    }

    return {
      importacaoId,
      totalItensAnalisados: itensPendentes.length,
      totalConciliados: itensConciliados.length,
      totalPendentes: itensPendentes.length - itensConciliados.length,
      itensConciliados,
    };
  }

  async listarCandidatosConciliacao(
    itemId: string,
    empresaId: string,
    filtros: QueryCandidatosConciliacaoDto = {},
  ): Promise<ContaPagarCandidataConciliacaoResponse[]> {
    const item = await this.obterItemComRelacionamentos(itemId, empresaId);
    const limite = this.normalizarLimite(filtros.limite, 10, 50);

    const candidatos = await this.obterCandidatosConciliacaoInterno(item, empresaId, {
      limite,
      toleranciaDias: 7,
    });

    return candidatos.map((candidato) => this.mapContaPagarCandidata(candidato));
  }

  async conciliarItemManual(
    itemId: string,
    dto: ConciliarItemExtratoDto,
    empresaId: string,
    userId: string,
  ): Promise<ItemImportacaoExtratoResponse> {
    const item = await this.obterItemComRelacionamentos(itemId, empresaId);
    const conta = await this.contaPagarRepository.findOne({
      where: { id: dto.contaPagarId, empresaId },
      relations: { fornecedor: true },
    });

    if (!conta) {
      throw new BadRequestException('Conta a pagar nao encontrada para a empresa ativa');
    }

    if (conta.status !== 'paga') {
      throw new BadRequestException('A conta a pagar selecionada precisa estar com status paga');
    }

    if (conta.contaBancariaId && conta.contaBancariaId !== item.contaBancariaId) {
      throw new BadRequestException(
        'A conta a pagar selecionada pertence a outra conta bancaria e nao pode ser conciliada',
      );
    }

    const candidatos = await this.obterCandidatosConciliacaoInterno(item, empresaId, {
      limite: 50,
      toleranciaDias: 10,
    });
    const candidatoSelecionado = candidatos.find((candidato) => candidato.conta.id === conta.id);

    await this.aplicarConciliacao(item, conta, 'manual', userId || 'sistema', {
      observacao: dto.observacao?.trim() || 'Conciliacao manual aplicada',
      score: candidatoSelecionado?.score,
      criterios: candidatoSelecionado?.criterios || [],
      acao: 'conciliacao_manual',
    });

    const atualizado = await this.obterItemComRelacionamentos(itemId, empresaId);
    return this.mapItemResponse(atualizado);
  }

  async desconciliarItemManual(
    itemId: string,
    dto: DesconciliarItemExtratoDto,
    empresaId: string,
    userId: string,
  ): Promise<ItemImportacaoExtratoResponse> {
    const item = await this.obterItemComRelacionamentos(itemId, empresaId);

    if (!item.conciliado && !item.contaPagarId) {
      throw new BadRequestException('Item selecionado nao esta conciliado');
    }

    const contaAnteriorId = item.contaPagarId;
    item.conciliado = false;
    item.contaPagarId = undefined;
    item.contaPagar = undefined;
    item.dataConciliacao = undefined;
    item.conciliadoPor = undefined;
    item.conciliacaoOrigem = undefined;
    item.motivoConciliacao = dto.observacao?.trim() || undefined;
    item.auditoriaConciliacao = this.registrarAuditoriaConciliacao(item.auditoriaConciliacao, {
      acao: 'desconciliacao_manual',
      usuarioId: userId || 'sistema',
      observacao: dto.observacao?.trim(),
      contaPagarIdAnterior: contaAnteriorId,
      contaPagarIdNovo: undefined,
    });

    await this.itemRepository.save(item);
    const atualizado = await this.obterItemComRelacionamentos(itemId, empresaId);
    return this.mapItemResponse(atualizado);
  }

  private async obterItemComRelacionamentos(
    itemId: string,
    empresaId: string,
  ): Promise<ExtratoBancarioItem> {
    const item = await this.itemRepository.findOne({
      where: { id: itemId, empresaId },
      relations: {
        contaPagar: {
          fornecedor: true,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item de extrato nao encontrado');
    }

    return item;
  }

  private async obterCandidatosConciliacaoInterno(
    item: ExtratoBancarioItem,
    empresaId: string,
    opcoes: OpcaoBuscaCandidatos,
  ): Promise<CandidatoConciliacaoInterno[]> {
    const limite = this.normalizarLimite(opcoes.limite, 10, 100);
    const toleranciaDias = Math.max(0, Math.min(30, Math.floor(Number(opcoes.toleranciaDias || 0))));
    const dataLancamento = item.dataLancamento instanceof Date ? item.dataLancamento : new Date(item.dataLancamento);
    const inicioBusca = new Date(dataLancamento);
    const fimBusca = new Date(dataLancamento);
    inicioBusca.setDate(inicioBusca.getDate() - Math.max(toleranciaDias, 5));
    fimBusca.setDate(fimBusca.getDate() + Math.max(toleranciaDias, 5));

    const query = this.contaPagarRepository
      .createQueryBuilder('conta')
      .leftJoinAndSelect('conta.fornecedor', 'fornecedor')
      .where('conta.empresaId = :empresaId', { empresaId })
      .andWhere('conta.status = :status', { status: 'paga' })
      .andWhere('conta.dataPagamento IS NOT NULL')
      .andWhere('conta.dataPagamento BETWEEN :inicioBusca AND :fimBusca', {
        inicioBusca: this.toDateOnly(inicioBusca),
        fimBusca: this.toDateOnly(fimBusca),
      })
      .orderBy('conta.dataPagamento', 'DESC')
      .addOrderBy('conta.createdAt', 'DESC')
      .limit(Math.max(limite * 5, 50));

    if (item.contaBancariaId) {
      query.andWhere('(conta.contaBancariaId = :contaBancariaId OR conta.contaBancariaId IS NULL)', {
        contaBancariaId: item.contaBancariaId,
      });
    }

    const contas = await query.getMany();
    const candidatos = contas
      .map((conta) => this.calcularPontuacaoCandidato(item, conta))
      .filter((candidato) => candidato.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite);

    return candidatos;
  }

  private calcularPontuacaoCandidato(
    item: ExtratoBancarioItem,
    conta: ContaPagar,
  ): CandidatoConciliacaoInterno {
    const criterios: string[] = [];
    let score = 0;

    const valorItem = Number(item.valor || 0);
    const valorConta = this.obterValorPagoConta(conta);
    const diffValor = Math.abs(valorItem - valorConta);

    if (diffValor <= 0.01) {
      score += 55;
      criterios.push('valor_exato');
    } else if (diffValor <= 1) {
      score += 30;
      criterios.push('valor_aproximado');
    } else if (diffValor <= 5) {
      score += 15;
      criterios.push('valor_toleravel');
    }

    const dataItem = item.dataLancamento instanceof Date ? item.dataLancamento : new Date(item.dataLancamento);
    const dataPagamento = conta.dataPagamento ? new Date(conta.dataPagamento) : null;
    if (dataPagamento) {
      const deltaDias = this.diffDias(dataItem, dataPagamento);
      if (deltaDias === 0) {
        score += 25;
        criterios.push('mesma_data');
      } else if (deltaDias <= 2) {
        score += 18;
        criterios.push('data_proxima');
      } else if (deltaDias <= 5) {
        score += 10;
        criterios.push('janela_data');
      }
    }

    if (item.contaBancariaId && conta.contaBancariaId === item.contaBancariaId) {
      score += 15;
      criterios.push('mesma_conta_bancaria');
    }

    const tokensReferencia = this.extrairTokensReferenciaItem(item);
    if (tokensReferencia.length > 0) {
      const baseConta = this.normalizarTextoComparacao(
        [
          conta.numero,
          conta.numeroDocumento,
          conta.descricao,
          conta.fornecedor?.nome,
        ]
          .filter(Boolean)
          .join(' '),
      );
      const encontrouReferencia = tokensReferencia.some((token) => baseConta.includes(token));
      if (encontrouReferencia) {
        score += 35;
        criterios.push('referencia_documento');
      }
    }

    return {
      conta,
      score,
      criterios,
    };
  }

  private async aplicarConciliacao(
    item: ExtratoBancarioItem,
    conta: ContaPagar,
    origem: OrigemConciliacaoExtratoBancario,
    usuarioId: string,
    metadata: {
      observacao?: string;
      acao: 'matching_automatico' | 'conciliacao_manual';
      score?: number;
      criterios?: string[];
    },
  ): Promise<void> {
    const contaPagarAnterior = item.contaPagarId;
    item.conciliado = true;
    item.contaPagarId = conta.id;
    item.dataConciliacao = new Date();
    item.conciliadoPor = usuarioId;
    item.conciliacaoOrigem = origem;
    item.motivoConciliacao = metadata.observacao?.slice(0, 500) || undefined;
    item.auditoriaConciliacao = this.registrarAuditoriaConciliacao(item.auditoriaConciliacao, {
      acao: metadata.acao,
      usuarioId,
      observacao: metadata.observacao,
      contaPagarIdAnterior: contaPagarAnterior,
      contaPagarIdNovo: conta.id,
      score: metadata.score,
      criterios: metadata.criterios,
    });

    await this.itemRepository.save(item);
  }

  private registrarAuditoriaConciliacao(
    historicoAtual: unknown,
    entrada: {
      acao: 'matching_automatico' | 'conciliacao_manual' | 'desconciliacao_manual';
      usuarioId: string;
      observacao?: string;
      contaPagarIdAnterior?: string;
      contaPagarIdNovo?: string;
      score?: number;
      criterios?: string[];
    },
  ): Array<Record<string, unknown>> {
    const historico = Array.isArray(historicoAtual)
      ? [...(historicoAtual as Array<Record<string, unknown>>)]
      : [];

    historico.push({
      acao: entrada.acao,
      usuarioId: entrada.usuarioId || 'sistema',
      data: new Date().toISOString(),
      observacao: entrada.observacao || undefined,
      contaPagarIdAnterior: entrada.contaPagarIdAnterior || undefined,
      contaPagarIdNovo: entrada.contaPagarIdNovo || undefined,
      score: typeof entrada.score === 'number' ? Number(entrada.score.toFixed(2)) : undefined,
      criterios: Array.isArray(entrada.criterios) ? entrada.criterios : undefined,
    });

    return historico.slice(-100);
  }

  private mapContaPagarCandidata(
    candidato: CandidatoConciliacaoInterno,
  ): ContaPagarCandidataConciliacaoResponse {
    const conta = candidato.conta;
    return {
      id: conta.id,
      numero: this.numeroContaPagar(conta),
      numeroDocumento: conta.numeroDocumento || undefined,
      descricao: conta.descricao,
      fornecedorNome: conta.fornecedor?.nome || undefined,
      dataPagamento: this.toDateOnly(conta.dataPagamento),
      dataVencimento: this.toDateOnly(conta.dataVencimento),
      valorTotal: Number(conta.valorTotal ?? conta.valor ?? 0),
      valorPago: this.obterValorPagoConta(conta),
      score: Number(candidato.score.toFixed(2)),
      criterios: candidato.criterios,
    };
  }

  private numeroContaPagar(conta: ContaPagar): string {
    if (conta.numero?.trim()) {
      return conta.numero.trim();
    }
    if (conta.numeroDocumento?.trim()) {
      return conta.numeroDocumento.trim();
    }
    return `CP-${conta.id.slice(0, 8).toUpperCase()}`;
  }

  private obterValorPagoConta(conta: ContaPagar): number {
    const valorPago = Number(conta.valorPago ?? 0);
    if (valorPago > 0) {
      return Number(valorPago.toFixed(2));
    }
    const valorTotal = Number(conta.valorTotal ?? conta.valor ?? 0);
    return Number(valorTotal.toFixed(2));
  }

  private extrairTokensReferenciaItem(item: ExtratoBancarioItem): string[] {
    const tokens = [
      item.documento,
      item.referenciaExterna,
      ...(item.descricao ? item.descricao.split(/\s+/g) : []),
    ]
      .map((value) => this.normalizarTextoComparacao(value))
      .filter((value) => value.length >= 3);

    return Array.from(new Set(tokens)).slice(0, 10);
  }

  private normalizarTextoComparacao(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private diffDias(a: Date, b: Date): number {
    const inicioA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
    const inicioB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
    return Math.abs(Math.round((inicioA - inicioB) / 86400000));
  }

  private normalizarLancamentosCsv(conteudo: string): ResultadoNormalizacaoExtrato {
    const erros: ErroImportacaoExtrato[] = [];
    const parseResult = Papa.parse<Record<string, unknown>>(conteudo, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => this.normalizarCabecalho(header),
    });

    if (parseResult.errors.length > 0) {
      parseResult.errors.forEach((erro) => {
        erros.push({
          linha: typeof erro.row === 'number' ? erro.row + 2 : undefined,
          mensagem: `Falha ao ler CSV: ${erro.message}`,
        });
      });
    }

    const linhas = Array.isArray(parseResult.data) ? parseResult.data : [];
    if (linhas.length === 0) {
      erros.push({ mensagem: 'Arquivo CSV sem linhas de dados' });
      return { lancamentos: [], erros };
    }

    const lancamentos: LancamentoExtratoNormalizado[] = [];

    linhas.forEach((linha, index) => {
      const numeroLinha = index + 2;

      try {
        const dataRaw = this.obterPrimeiroValor(linha, [
          'data',
          'data_lancamento',
          'data_movimento',
          'dt_lancamento',
          'dtmov',
          'date',
        ]);
        const dataLancamento = this.parseDataGenerica(dataRaw);
        if (!dataLancamento) {
          throw new Error('Data do lancamento invalida ou ausente');
        }

        const valorAssinado = this.extrairValorCsv(linha);
        if (valorAssinado === null) {
          throw new Error('Valor do lancamento invalido ou ausente');
        }

        const tipo =
          valorAssinado >= 0
            ? TipoLancamentoExtratoBancario.CREDITO
            : TipoLancamentoExtratoBancario.DEBITO;
        const valor = Number(Math.abs(valorAssinado).toFixed(2));

        const descricao =
          this.obterPrimeiroValor(linha, [
            'descricao',
            'historico',
            'descricao_historico',
            'memo',
            'name',
            'descricao_movimento',
            'description',
          ]) || 'Lancamento sem descricao';

        const documento = this.obterPrimeiroValor(linha, [
          'documento',
          'numero_documento',
          'checknum',
          'num_doc',
        ]);
        const referenciaExterna = this.obterPrimeiroValor(linha, [
          'referencia',
          'referencia_externa',
          'fitid',
          'id_transacao',
          'id',
        ]);
        const saldoPosLancamento = this.parseNumero(
          this.obterPrimeiroValor(linha, ['saldo', 'saldo_pos_lancamento', 'balance']),
        );

        lancamentos.push({
          dataLancamento,
          descricao,
          valor,
          tipo,
          documento: documento || undefined,
          referenciaExterna: referenciaExterna || undefined,
          saldoPosLancamento: saldoPosLancamento ?? undefined,
          dadosOriginais: linha,
        });
      } catch (error) {
        erros.push({
          linha: numeroLinha,
          mensagem: error instanceof Error ? error.message : 'Erro ao normalizar lancamento CSV',
          conteudo: linha,
        });
      }
    });

    return { lancamentos, erros };
  }

  private normalizarLancamentosOfx(conteudo: string): ResultadoNormalizacaoExtrato {
    const erros: ErroImportacaoExtrato[] = [];
    const blocosTransacao = conteudo.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];

    if (blocosTransacao.length === 0) {
      return {
        lancamentos: [],
        erros: [{ mensagem: 'Arquivo OFX sem blocos <STMTTRN> para importacao' }],
      };
    }

    const lancamentos: LancamentoExtratoNormalizado[] = [];

    blocosTransacao.forEach((bloco, index) => {
      try {
        const dataRaw = this.extrairTagOfx(bloco, 'DTPOSTED');
        const valorRaw = this.extrairTagOfx(bloco, 'TRNAMT');
        const memoRaw = this.extrairTagOfx(bloco, 'MEMO') || this.extrairTagOfx(bloco, 'NAME');
        const referenciaRaw = this.extrairTagOfx(bloco, 'FITID');
        const documentoRaw =
          this.extrairTagOfx(bloco, 'CHECKNUM') || this.extrairTagOfx(bloco, 'REFNUM');
        const saldoRaw = this.extrairTagOfx(bloco, 'BALAMT');

        const dataLancamento = this.parseDataGenerica(dataRaw);
        if (!dataLancamento) {
          throw new Error('Data do lancamento OFX invalida');
        }

        const valorAssinado = this.parseNumero(valorRaw);
        if (valorAssinado === null) {
          throw new Error('Valor do lancamento OFX invalido');
        }

        const tipo =
          valorAssinado >= 0
            ? TipoLancamentoExtratoBancario.CREDITO
            : TipoLancamentoExtratoBancario.DEBITO;
        const valor = Number(Math.abs(valorAssinado).toFixed(2));

        lancamentos.push({
          dataLancamento,
          descricao: memoRaw || `Lancamento OFX ${index + 1}`,
          valor,
          tipo,
          documento: documentoRaw || undefined,
          referenciaExterna: referenciaRaw || undefined,
          saldoPosLancamento: this.parseNumero(saldoRaw) ?? undefined,
          dadosOriginais: {
            dtposted: dataRaw,
            trnamt: valorRaw,
            memo: memoRaw,
            fitid: referenciaRaw,
            checknum: documentoRaw,
          },
        });
      } catch (error) {
        erros.push({
          linha: index + 1,
          mensagem: error instanceof Error ? error.message : 'Erro ao normalizar lancamento OFX',
        });
      }
    });

    return { lancamentos, erros };
  }

  private identificarTipoArquivo(
    nomeArquivo?: string,
    mimeType?: string,
  ): TipoArquivoExtratoBancario | null {
    const nome = String(nomeArquivo || '').toLowerCase();
    const mime = String(mimeType || '').toLowerCase();

    if (nome.endsWith('.csv')) {
      return TipoArquivoExtratoBancario.CSV;
    }
    if (nome.endsWith('.ofx')) {
      return TipoArquivoExtratoBancario.OFX;
    }

    if (mime.includes('csv') || mime.includes('excel') || mime.includes('text/plain')) {
      return TipoArquivoExtratoBancario.CSV;
    }
    if (mime.includes('ofx') || mime.includes('sgml') || mime.includes('xml')) {
      return TipoArquivoExtratoBancario.OFX;
    }

    return null;
  }

  private extrairValorCsv(row: Record<string, unknown>): number | null {
    const valorDireto = this.parseNumero(
      this.obterPrimeiroValor(row, [
        'valor',
        'valor_lancamento',
        'valor_movimento',
        'amount',
        'trnamt',
      ]),
    );
    if (valorDireto !== null) {
      return valorDireto;
    }

    const credito = this.parseNumero(
      this.obterPrimeiroValor(row, ['credito', 'valor_credito', 'entradas']),
    );
    const debito = this.parseNumero(
      this.obterPrimeiroValor(row, ['debito', 'valor_debito', 'saidas']),
    );

    if (credito === null && debito === null) {
      return null;
    }

    return Number(((credito || 0) - (debito || 0)).toFixed(2));
  }

  private extrairTagOfx(conteudo: string, tag: string): string | undefined {
    const regexComFechamento = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const matchComFechamento = conteudo.match(regexComFechamento);
    if (matchComFechamento?.[1]) {
      return this.normalizarTextoOfx(matchComFechamento[1]);
    }

    const regexSemFechamento = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
    const matchSemFechamento = conteudo.match(regexSemFechamento);
    if (matchSemFechamento?.[1]) {
      return this.normalizarTextoOfx(matchSemFechamento[1]);
    }

    return undefined;
  }

  private normalizarTextoOfx(value: string): string {
    return value
      .trim()
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  }

  private normalizarCabecalho(header: string): string {
    return String(header || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private obterPrimeiroValor(row: Record<string, unknown>, chaves: string[]): string | undefined {
    for (const chave of chaves) {
      const valor = row[chave];
      const texto = this.toTrimmedString(valor);
      if (texto) {
        return texto;
      }
    }
    return undefined;
  }

  private toTrimmedString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  private parseNumero(value: unknown): number | null {
    const raw = this.toTrimmedString(value);
    if (!raw) return null;

    let normalized = raw.replace(/\s+/g, '').replace(/R\$/gi, '');
    if (!normalized) return null;

    if (normalized.endsWith('-')) {
      normalized = `-${normalized.slice(0, -1)}`;
    }

    const hasComma = normalized.includes(',');
    const hasDot = normalized.includes('.');

    if (hasComma && hasDot) {
      if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      } else {
        normalized = normalized.replace(/,/g, '');
      }
    } else if (hasComma) {
      normalized = normalized.replace(',', '.');
    }

    normalized = normalized.replace(/[^0-9.+-]/g, '');

    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return Number(parsed.toFixed(2));
  }

  private parseDataGenerica(value: unknown): Date | null {
    const raw = this.toTrimmedString(value);
    if (!raw) return null;

    const matchOfx = raw.match(/^(\d{4})(\d{2})(\d{2})/);
    if (matchOfx) {
      return this.buildDateFromParts(Number(matchOfx[1]), Number(matchOfx[2]), Number(matchOfx[3]));
    }

    const matchIso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (matchIso) {
      return this.buildDateFromParts(Number(matchIso[1]), Number(matchIso[2]), Number(matchIso[3]));
    }

    const matchBr = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (matchBr) {
      return this.buildDateFromParts(Number(matchBr[3]), Number(matchBr[2]), Number(matchBr[1]));
    }

    const matchBrDash = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (matchBrDash) {
      return this.buildDateFromParts(
        Number(matchBrDash[3]),
        Number(matchBrDash[2]),
        Number(matchBrDash[1]),
      );
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return this.buildDateFromParts(parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate());
  }

  private buildDateFromParts(year: number, month: number, day: number): Date | null {
    const normalizedMonth = String(month).padStart(2, '0');
    const normalizedDay = String(day).padStart(2, '0');
    const date = new Date(`${year}-${normalizedMonth}-${normalizedDay}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
      return null;
    }

    return date;
  }

  private somarValores(
    lancamentos: LancamentoExtratoNormalizado[],
    tipo: TipoLancamentoExtratoBancario,
  ): number {
    return Number(
      lancamentos
        .filter((item) => item.tipo === tipo)
        .reduce((acc, item) => acc + Number(item.valor || 0), 0)
        .toFixed(2),
    );
  }

  private obterMenorData(lancamentos: LancamentoExtratoNormalizado[]): Date | undefined {
    if (lancamentos.length === 0) return undefined;
    return new Date(
      Math.min(...lancamentos.map((item) => item.dataLancamento.getTime())),
    );
  }

  private obterMaiorData(lancamentos: LancamentoExtratoNormalizado[]): Date | undefined {
    if (lancamentos.length === 0) return undefined;
    return new Date(
      Math.max(...lancamentos.map((item) => item.dataLancamento.getTime())),
    );
  }

  private normalizarLimite(
    valor: number | undefined,
    fallback: number,
    maximo: number,
  ): number {
    const parsed = Number(valor);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.min(Math.floor(parsed), maximo);
  }

  private toDateOnly(value?: Date | string): string | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString().slice(0, 10);
  }

  private toIso(value?: Date | string): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString();
  }

  private mapImportacaoResponse(item: ExtratoBancarioImportacao): ImportacaoExtratoResponse {
    return {
      id: item.id,
      contaBancariaId: item.contaBancariaId,
      nomeArquivo: item.nomeArquivo,
      tipoArquivo: item.tipoArquivo,
      totalLancamentos: Number(item.totalLancamentos || 0),
      totalEntradas: Number(item.totalEntradas || 0),
      totalSaidas: Number(item.totalSaidas || 0),
      periodoInicio: this.toDateOnly(item.periodoInicio),
      periodoFim: this.toDateOnly(item.periodoFim),
      createdAt: this.toIso(item.createdAt),
    };
  }

  private mapItemResponse(item: ExtratoBancarioItem): ItemImportacaoExtratoResponse {
    return {
      id: item.id,
      importacaoId: item.importacaoId,
      dataLancamento: this.toDateOnly(item.dataLancamento) || '',
      descricao: item.descricao,
      documento: item.documento || undefined,
      referenciaExterna: item.referenciaExterna || undefined,
      tipo: item.tipo,
      valor: Number(item.valor || 0),
      saldoPosLancamento:
        item.saldoPosLancamento !== undefined && item.saldoPosLancamento !== null
          ? Number(item.saldoPosLancamento)
          : undefined,
      conciliado: !!item.conciliado,
      contaPagarId: item.contaPagarId || undefined,
      contaPagarNumero: item.contaPagar ? this.numeroContaPagar(item.contaPagar) : undefined,
      contaPagarDescricao: item.contaPagar?.descricao || undefined,
      contaPagarFornecedorNome: item.contaPagar?.fornecedor?.nome || undefined,
      dataConciliacao: item.dataConciliacao ? this.toIso(item.dataConciliacao) : undefined,
      conciliadoPor: item.conciliadoPor || undefined,
      conciliacaoOrigem: item.conciliacaoOrigem || undefined,
      motivoConciliacao: item.motivoConciliacao || undefined,
      auditoriaConciliacao: Array.isArray(item.auditoriaConciliacao)
        ? item.auditoriaConciliacao
        : [],
      createdAt: this.toIso(item.createdAt),
    };
  }
}
