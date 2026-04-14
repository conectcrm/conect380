import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fatura, StatusFatura } from '../../faturamento/entities/fatura.entity';
import { ContaBancaria } from '../entities/conta-bancaria.entity';
import { ContaPagar } from '../entities/conta-pagar.entity';
import {
  AprovarTransferenciaTesourariaDto,
  CancelarTransferenciaTesourariaDto,
  CriarTransferenciaTesourariaDto,
  ListaMovimentacoesTesourariaResponse,
  MovimentacaoTesourariaItemResponse,
  PosicaoTesourariaResponse,
  QueryTesourariaMovimentacoesDto,
  QueryTesourariaPosicaoDto,
  ResultadoAprovacaoTransferenciaTesourariaResponse,
  ResultadoCancelamentoTransferenciaTesourariaResponse,
  ResultadoCriacaoTransferenciaTesourariaResponse,
} from '../dto/tesouraria.dto';
import {
  MovimentacaoTesouraria,
  MovimentacaoTesourariaStatus,
} from '../entities/movimentacao-tesouraria.entity';

@Injectable()
export class TesourariaService {
  constructor(
    @InjectRepository(ContaBancaria)
    private readonly contaBancariaRepository: Repository<ContaBancaria>,
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: Repository<ContaPagar>,
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    @InjectRepository(MovimentacaoTesouraria)
    private readonly movimentacaoRepository: Repository<MovimentacaoTesouraria>,
  ) {}

  async obterPosicao(
    empresaId: string,
    query: QueryTesourariaPosicaoDto = {},
  ): Promise<PosicaoTesourariaResponse> {
    const incluirInativas = Boolean(query.incluirInativas);
    const janelaDias = this.clamp(query.janelaDias ?? 30, 1, 180);

    const hoje = this.startOfDay(new Date());
    const limite = this.endOfDay(this.addDays(hoje, janelaDias - 1));

    const [contasBancarias, contasPagar, faturas] = await Promise.all([
      this.contaBancariaRepository.find({
        where: {
          empresaId,
          ...(incluirInativas ? {} : { ativo: true }),
        },
      }),
      this.contaPagarRepository.find({ where: { empresaId } }),
      this.faturaRepository.find({ where: { empresaId, ativo: true } }),
    ]);

    const saidasPorConta = new Map<string, number>();
    for (const conta of contasPagar) {
      const status = String(conta.status || '').toLowerCase();
      if (status === 'cancelada' || status === 'paga') {
        continue;
      }

      const vencimento = this.toDateOrNull(conta.dataVencimento);
      if (!vencimento || !this.isWithinPeriod(vencimento, hoje, limite)) {
        continue;
      }

      const valorBase = this.toMoney(conta.valorTotal ?? conta.valor);
      const valorPago = this.toMoney(conta.valorPago);
      const valorAberto = this.toMoney(Math.max(valorBase - valorPago, 0));
      if (valorAberto <= 0) {
        continue;
      }

      const contaBancariaId = conta.contaBancariaId;
      if (!contaBancariaId) {
        continue;
      }

      const acumulado = saidasPorConta.get(contaBancariaId) || 0;
      saidasPorConta.set(contaBancariaId, this.toMoney(acumulado + valorAberto));
    }

    let entradasPrevistasConsolidadas = 0;
    for (const fatura of faturas) {
      const statusCancelada = fatura.status === StatusFatura.CANCELADA;
      const valorTotal = this.toMoney(fatura.valorTotal);
      const valorPago = this.toMoney(fatura.valorPago);
      const valorAberto = this.toMoney(Math.max(valorTotal - valorPago, 0));
      const statusRecebida = fatura.status === StatusFatura.PAGA || valorAberto <= 0;

      if (statusCancelada || statusRecebida) {
        continue;
      }

      const vencimento = this.toDateOrNull(fatura.dataVencimento);
      if (!vencimento || !this.isWithinPeriod(vencimento, hoje, limite)) {
        continue;
      }

      entradasPrevistasConsolidadas = this.toMoney(entradasPrevistasConsolidadas + valorAberto);
    }

    const itens = contasBancarias
      .map((conta) => {
        const saldoAtual = this.toMoney(conta.saldo);
        const saidasProgramadas = this.toMoney(saidasPorConta.get(conta.id) || 0);
        const saldoProjetado = this.toMoney(saldoAtual - saidasProgramadas);

        return {
          contaBancariaId: conta.id,
          nomeConta: conta.nome,
          banco: conta.banco,
          agencia: conta.agencia,
          conta: conta.conta,
          tipoConta: conta.tipoConta,
          ativo: Boolean(conta.ativo),
          saldoAtual,
          saidasProgramadas,
          saldoProjetado,
        };
      })
      .sort((a, b) => b.saldoProjetado - a.saldoProjetado);

    const saldoAtualConsolidado = this.toMoney(itens.reduce((acc, item) => acc + item.saldoAtual, 0));
    const saidasProgramadasConsolidadas = this.toMoney(
      itens.reduce((acc, item) => acc + item.saidasProgramadas, 0),
    );

    return {
      referenciaEm: this.toDateKey(hoje),
      janelaDias,
      totalContas: itens.length,
      saldoAtualConsolidado,
      entradasPrevistasConsolidadas,
      saidasProgramadasConsolidadas,
      saldoProjetadoConsolidado: this.toMoney(
        saldoAtualConsolidado + entradasPrevistasConsolidadas - saidasProgramadasConsolidadas,
      ),
      itens,
    };
  }

  async listarMovimentacoes(
    empresaId: string,
    query: QueryTesourariaMovimentacoesDto = {},
  ): Promise<ListaMovimentacoesTesourariaResponse> {
    const limite = this.clamp(query.limite ?? 20, 1, 100);

    const qb = this.movimentacaoRepository
      .createQueryBuilder('movimentacao')
      .leftJoinAndSelect('movimentacao.contaOrigem', 'contaOrigem')
      .leftJoinAndSelect('movimentacao.contaDestino', 'contaDestino')
      .where('movimentacao.empresaId = :empresaId', { empresaId })
      .orderBy('movimentacao.createdAt', 'DESC')
      .take(limite);

    if (query.status) {
      qb.andWhere('movimentacao.status = :status', { status: query.status });
    }

    const [items, total] = await qb.getManyAndCount();
    return {
      data: items.map((item) => this.mapMovimentacao(item)),
      total,
      limite,
    };
  }

  async criarTransferencia(
    empresaId: string,
    dto: CriarTransferenciaTesourariaDto,
    userId?: string,
  ): Promise<ResultadoCriacaoTransferenciaTesourariaResponse> {
    const actor = this.normalizarUsuario(userId);
    const contaOrigemId = String(dto.contaOrigemId || '').trim();
    const contaDestinoId = String(dto.contaDestinoId || '').trim();
    const valor = this.toMoney(dto.valor);
    const descricao = this.toOptionalString(dto.descricao);

    if (!contaOrigemId || !contaDestinoId) {
      throw new BadRequestException('Informe conta de origem e conta de destino');
    }
    if (contaOrigemId === contaDestinoId) {
      throw new BadRequestException('A conta de origem deve ser diferente da conta de destino');
    }
    if (valor <= 0) {
      throw new BadRequestException('Valor da transferencia deve ser maior que zero');
    }

    const correlationId =
      this.toOptionalString(dto.correlationId) ||
      `tesouraria:transferencia:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const origemId =
      this.toOptionalString(dto.origemId) || `financeiro.tesouraria.transferencia:${actor}`;

    const existente = await this.movimentacaoRepository.findOne({
      where: { empresaId, correlationId },
      relations: ['contaOrigem', 'contaDestino'],
    });

    if (existente) {
      return { movimentacao: this.mapMovimentacao(existente) };
    }

    const [contaOrigem, contaDestino] = await Promise.all([
      this.contaBancariaRepository.findOne({ where: { id: contaOrigemId, empresaId, ativo: true } }),
      this.contaBancariaRepository.findOne({ where: { id: contaDestinoId, empresaId, ativo: true } }),
    ]);

    if (!contaOrigem) {
      throw new BadRequestException('Conta de origem nao encontrada ou inativa');
    }
    if (!contaDestino) {
      throw new BadRequestException('Conta de destino nao encontrada ou inativa');
    }

    const movimentacao = this.movimentacaoRepository.create({
      empresaId,
      contaOrigemId,
      contaDestinoId,
      valor,
      descricao,
      status: MovimentacaoTesourariaStatus.PENDENTE,
      correlationId,
      origemId,
      criadoPor: actor,
      atualizadoPor: actor,
      auditoria: this.appendAuditoria([], {
        acao: 'criacao',
        usuarioId: actor,
        statusAnterior: null,
        statusNovo: MovimentacaoTesourariaStatus.PENDENTE,
        valor,
      }),
    });

    const salvo = await this.movimentacaoRepository.save(movimentacao);
    salvo.contaOrigem = contaOrigem;
    salvo.contaDestino = contaDestino;

    return {
      movimentacao: this.mapMovimentacao(salvo),
    };
  }

  async aprovarTransferencia(
    id: string,
    empresaId: string,
    dto: AprovarTransferenciaTesourariaDto = {},
    userId?: string,
  ): Promise<ResultadoAprovacaoTransferenciaTesourariaResponse> {
    const actor = this.normalizarUsuario(userId);
    const observacao = this.toOptionalString(dto.observacao);

    return this.movimentacaoRepository.manager.transaction(async (manager) => {
      const movimentacaoRepository = manager.getRepository(MovimentacaoTesouraria);
      const contaRepository = manager.getRepository(ContaBancaria);

      const movimentacao = await movimentacaoRepository.findOne({
        where: { id, empresaId },
        relations: ['contaOrigem', 'contaDestino'],
      });

      if (!movimentacao) {
        throw new NotFoundException('Movimentacao de tesouraria nao encontrada');
      }

      const contaOrigem = await contaRepository.findOne({
        where: { id: movimentacao.contaOrigemId, empresaId, ativo: true },
      });
      const contaDestino = await contaRepository.findOne({
        where: { id: movimentacao.contaDestinoId, empresaId, ativo: true },
      });

      if (!contaOrigem) {
        throw new BadRequestException('Conta de origem da movimentacao nao encontrada ou inativa');
      }
      if (!contaDestino) {
        throw new BadRequestException('Conta de destino da movimentacao nao encontrada ou inativa');
      }

      if (movimentacao.status === MovimentacaoTesourariaStatus.CANCELADA) {
        throw new BadRequestException('Nao e possivel aprovar movimentacao cancelada');
      }

      if (movimentacao.status === MovimentacaoTesourariaStatus.APROVADA) {
        movimentacao.contaOrigem = contaOrigem;
        movimentacao.contaDestino = contaDestino;
        return {
          movimentacao: this.mapMovimentacao(movimentacao),
          saldoContaOrigem: this.toMoney(contaOrigem.saldo),
          saldoContaDestino: this.toMoney(contaDestino.saldo),
        };
      }

      const valor = this.toMoney(movimentacao.valor);
      const saldoOrigemAntes = this.toMoney(contaOrigem.saldo);
      const saldoDestinoAntes = this.toMoney(contaDestino.saldo);

      if (saldoOrigemAntes < valor) {
        throw new BadRequestException(
          `Saldo insuficiente na conta de origem. Saldo atual: ${saldoOrigemAntes.toFixed(2)}`,
        );
      }

      contaOrigem.saldo = this.toMoney(saldoOrigemAntes - valor);
      contaDestino.saldo = this.toMoney(saldoDestinoAntes + valor);
      contaOrigem.atualizadoPor = actor;
      contaDestino.atualizadoPor = actor;
      await contaRepository.save([contaOrigem, contaDestino]);

      const statusAnterior = movimentacao.status;
      movimentacao.status = MovimentacaoTesourariaStatus.APROVADA;
      movimentacao.atualizadoPor = actor;
      movimentacao.auditoria = this.appendAuditoria(movimentacao.auditoria, {
        acao: 'aprovacao',
        usuarioId: actor,
        observacao,
        statusAnterior,
        statusNovo: movimentacao.status,
        saldoOrigemAntes,
        saldoOrigemDepois: contaOrigem.saldo,
        saldoDestinoAntes,
        saldoDestinoDepois: contaDestino.saldo,
      });

      const salvo = await movimentacaoRepository.save(movimentacao);
      salvo.contaOrigem = contaOrigem;
      salvo.contaDestino = contaDestino;

      return {
        movimentacao: this.mapMovimentacao(salvo),
        saldoContaOrigem: this.toMoney(contaOrigem.saldo),
        saldoContaDestino: this.toMoney(contaDestino.saldo),
      };
    });
  }

  async cancelarTransferencia(
    id: string,
    empresaId: string,
    dto: CancelarTransferenciaTesourariaDto = {},
    userId?: string,
  ): Promise<ResultadoCancelamentoTransferenciaTesourariaResponse> {
    const actor = this.normalizarUsuario(userId);
    const observacao = this.toOptionalString(dto.observacao);

    const movimentacao = await this.movimentacaoRepository.findOne({
      where: { id, empresaId },
      relations: ['contaOrigem', 'contaDestino'],
    });

    if (!movimentacao) {
      throw new NotFoundException('Movimentacao de tesouraria nao encontrada');
    }

    if (movimentacao.status === MovimentacaoTesourariaStatus.APROVADA) {
      throw new BadRequestException('Nao e possivel cancelar movimentacao ja aprovada');
    }

    if (movimentacao.status !== MovimentacaoTesourariaStatus.CANCELADA) {
      const statusAnterior = movimentacao.status;
      movimentacao.status = MovimentacaoTesourariaStatus.CANCELADA;
      movimentacao.atualizadoPor = actor;
      movimentacao.auditoria = this.appendAuditoria(movimentacao.auditoria, {
        acao: 'cancelamento',
        usuarioId: actor,
        observacao,
        statusAnterior,
        statusNovo: movimentacao.status,
      });
      await this.movimentacaoRepository.save(movimentacao);
    }

    if (!movimentacao.contaOrigem || !movimentacao.contaDestino) {
      const [contaOrigem, contaDestino] = await Promise.all([
        this.contaBancariaRepository.findOne({ where: { id: movimentacao.contaOrigemId, empresaId } }),
        this.contaBancariaRepository.findOne({ where: { id: movimentacao.contaDestinoId, empresaId } }),
      ]);
      if (contaOrigem) movimentacao.contaOrigem = contaOrigem;
      if (contaDestino) movimentacao.contaDestino = contaDestino;
    }

    return {
      movimentacao: this.mapMovimentacao(movimentacao),
    };
  }

  private mapMovimentacao(item: MovimentacaoTesouraria): MovimentacaoTesourariaItemResponse {
    return {
      id: item.id,
      status: item.status,
      valor: this.toMoney(item.valor),
      descricao: item.descricao || undefined,
      contaOrigemId: item.contaOrigemId,
      contaOrigemNome: item.contaOrigem?.nome || item.contaOrigemId,
      contaDestinoId: item.contaDestinoId,
      contaDestinoNome: item.contaDestino?.nome || item.contaDestinoId,
      correlationId: item.correlationId,
      origemId: item.origemId || undefined,
      auditoria: Array.isArray(item.auditoria) ? item.auditoria : [],
      criadoPor: item.criadoPor || undefined,
      atualizadoPor: item.atualizadoPor || undefined,
      createdAt: this.toIso(item.createdAt),
      updatedAt: this.toIso(item.updatedAt),
    };
  }

  private appendAuditoria(
    auditoriaAtual: unknown,
    evento: Record<string, unknown>,
  ): Array<Record<string, unknown>> {
    const historico = Array.isArray(auditoriaAtual)
      ? [...(auditoriaAtual as Array<Record<string, unknown>>)]
      : [];

    historico.push({
      ...evento,
      timestamp: new Date().toISOString(),
    });

    return historico.slice(-120);
  }

  private toDateOrNull(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    const parsed = value instanceof Date ? new Date(value) : new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  private toIso(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString();
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private addDays(date: Date, days: number): Date {
    const clone = new Date(date);
    clone.setDate(clone.getDate() + days);
    return clone;
  }

  private startOfDay(date: Date): Date {
    const clone = new Date(date);
    clone.setHours(0, 0, 0, 0);
    return clone;
  }

  private endOfDay(date: Date): Date {
    const clone = new Date(date);
    clone.setHours(23, 59, 59, 999);
    return clone;
  }

  private isWithinPeriod(data: Date, inicio: Date, fim: Date): boolean {
    const target = this.startOfDay(data).getTime();
    return target >= this.startOfDay(inicio).getTime() && target <= this.startOfDay(fim).getTime();
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(Number(value) || 0, min), max);
  }

  private normalizarUsuario(userId?: string): string {
    const value = String(userId || '').trim();
    return value || 'sistema';
  }

  private toOptionalString(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized || undefined;
  }

  private toMoney(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Number(parsed.toFixed(2));
  }
}
