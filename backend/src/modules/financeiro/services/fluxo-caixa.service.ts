import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fatura, StatusFatura } from '../../faturamento/entities/fatura.entity';
import { ContaPagar } from '../entities/conta-pagar.entity';
import {
  AgrupamentoFluxoCaixa,
  ProjecaoFluxoCaixaResponse,
  QueryFluxoCaixaDto,
  ResumoFluxoCaixaResponse,
  SerieFluxoCaixaItemResponse,
} from '../dto/fluxo-caixa.dto';

type BucketInterno = {
  inicio: Date;
  fim: Date;
  item: SerieFluxoCaixaItemResponse;
};

type ItemProjecaoInterno = {
  data: string;
  entradasPrevistas: number;
  saidasPrevistas: number;
  saldoProjetadoAcumulado: number;
};

@Injectable()
export class FluxoCaixaService {
  constructor(
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    @InjectRepository(ContaPagar)
    private readonly contaPagarRepository: Repository<ContaPagar>,
  ) {}

  async obterResumo(
    empresaId: string,
    query: QueryFluxoCaixaDto = {},
  ): Promise<ResumoFluxoCaixaResponse> {
    const periodo = this.resolverPeriodo(query);
    const agrupamento = query.agrupamento || 'dia';

    const [faturas, contasPagar] = await Promise.all([
      this.faturaRepository.find({ where: { empresaId, ativo: true } }),
      this.contaPagarRepository.find({ where: { empresaId } }),
    ]);

    const buckets = this.criarBuckets(periodo.inicio, periodo.fim, agrupamento);

    for (const fatura of faturas) {
      const valorTotal = this.toMoney(fatura.valorTotal);
      const valorPago = this.toMoney(fatura.valorPago);
      const valorEmAberto = this.toMoney(Math.max(valorTotal - valorPago, 0));

      const statusCancelada = fatura.status === StatusFatura.CANCELADA;
      const statusRecebida = fatura.status === StatusFatura.PAGA || valorEmAberto <= 0;

      const dataPagamento = this.toDateOrNull(fatura.dataPagamento);
      if (valorPago > 0 && dataPagamento && this.isWithinPeriod(dataPagamento, periodo.inicio, periodo.fim)) {
        const bucket = this.findBucket(dataPagamento, buckets);
        if (bucket) {
          bucket.item.entradasRealizadas = this.toMoney(bucket.item.entradasRealizadas + valorPago);
        }
      }

      const dataVencimento = this.toDateOrNull(fatura.dataVencimento);
      if (
        !statusCancelada &&
        !statusRecebida &&
        valorEmAberto > 0 &&
        dataVencimento &&
        this.isWithinPeriod(dataVencimento, periodo.inicio, periodo.fim)
      ) {
        const bucket = this.findBucket(dataVencimento, buckets);
        if (bucket) {
          bucket.item.entradasPrevistas = this.toMoney(bucket.item.entradasPrevistas + valorEmAberto);
        }
      }
    }

    for (const conta of contasPagar) {
      const status = String(conta.status || '').toLowerCase();
      if (status === 'cancelada') {
        continue;
      }

      const valorBase = this.toMoney(conta.valorTotal ?? conta.valor);
      const valorPago = this.toMoney(conta.valorPago);
      const valorPagoEfetivo = status === 'paga' ? this.toMoney(valorPago > 0 ? valorPago : valorBase) : valorPago;
      const valorEmAberto = this.toMoney(Math.max(valorBase - valorPagoEfetivo, 0));

      const dataPagamento = this.toDateOrNull(conta.dataPagamento);
      if (
        status === 'paga' &&
        valorPagoEfetivo > 0 &&
        dataPagamento &&
        this.isWithinPeriod(dataPagamento, periodo.inicio, periodo.fim)
      ) {
        const bucket = this.findBucket(dataPagamento, buckets);
        if (bucket) {
          bucket.item.saidasRealizadas = this.toMoney(bucket.item.saidasRealizadas + valorPagoEfetivo);
        }
      }

      const dataVencimento = this.toDateOrNull(conta.dataVencimento);
      if (
        status !== 'paga' &&
        valorEmAberto > 0 &&
        dataVencimento &&
        this.isWithinPeriod(dataVencimento, periodo.inicio, periodo.fim)
      ) {
        const bucket = this.findBucket(dataVencimento, buckets);
        if (bucket) {
          bucket.item.saidasPrevistas = this.toMoney(bucket.item.saidasPrevistas + valorEmAberto);
        }
      }
    }

    const serie = buckets.map((bucket) => ({
      ...bucket.item,
      saldoLiquido: this.toMoney(
        bucket.item.entradasRealizadas +
          bucket.item.entradasPrevistas -
          bucket.item.saidasRealizadas -
          bucket.item.saidasPrevistas,
      ),
    }));

    const totais = serie.reduce(
      (acc, item) => {
        acc.entradasRealizadas = this.toMoney(acc.entradasRealizadas + item.entradasRealizadas);
        acc.saidasRealizadas = this.toMoney(acc.saidasRealizadas + item.saidasRealizadas);
        acc.entradasPrevistas = this.toMoney(acc.entradasPrevistas + item.entradasPrevistas);
        acc.saidasPrevistas = this.toMoney(acc.saidasPrevistas + item.saidasPrevistas);
        return acc;
      },
      {
        entradasRealizadas: 0,
        saidasRealizadas: 0,
        entradasPrevistas: 0,
        saidasPrevistas: 0,
      },
    );

    return {
      periodoInicio: this.toDateKey(periodo.inicio),
      periodoFim: this.toDateKey(periodo.fim),
      agrupamento,
      totais: {
        ...totais,
        saldoLiquidoRealizado: this.toMoney(totais.entradasRealizadas - totais.saidasRealizadas),
        saldoLiquidoPrevisto: this.toMoney(
          totais.entradasRealizadas +
            totais.entradasPrevistas -
            totais.saidasRealizadas -
            totais.saidasPrevistas,
        ),
      },
      serie,
    };
  }

  async obterProjecao(
    empresaId: string,
    query: QueryFluxoCaixaDto = {},
  ): Promise<ProjecaoFluxoCaixaResponse> {
    const dias = this.clamp(query.janelaDias ?? 30, 1, 180);
    const hoje = this.startOfDay(new Date());
    const ate = this.endOfDay(this.addDays(hoje, dias - 1));

    const [faturas, contasPagar] = await Promise.all([
      this.faturaRepository.find({ where: { empresaId, ativo: true } }),
      this.contaPagarRepository.find({ where: { empresaId } }),
    ]);

    const itensMap = new Map<string, ItemProjecaoInterno>();
    for (let offset = 0; offset < dias; offset += 1) {
      const data = this.startOfDay(this.addDays(hoje, offset));
      const key = this.toDateKey(data);
      itensMap.set(key, {
        data: key,
        entradasPrevistas: 0,
        saidasPrevistas: 0,
        saldoProjetadoAcumulado: 0,
      });
    }

    for (const fatura of faturas) {
      const valorTotal = this.toMoney(fatura.valorTotal);
      const valorPago = this.toMoney(fatura.valorPago);
      const valorEmAberto = this.toMoney(Math.max(valorTotal - valorPago, 0));

      if (fatura.status === StatusFatura.CANCELADA || fatura.status === StatusFatura.PAGA || valorEmAberto <= 0) {
        continue;
      }

      const vencimento = this.toDateOrNull(fatura.dataVencimento);
      if (!vencimento || !this.isWithinPeriod(vencimento, hoje, ate)) {
        continue;
      }

      const key = this.toDateKey(vencimento);
      const item = itensMap.get(key);
      if (item) {
        item.entradasPrevistas = this.toMoney(item.entradasPrevistas + valorEmAberto);
      }
    }

    for (const conta of contasPagar) {
      const status = String(conta.status || '').toLowerCase();
      if (status === 'cancelada' || status === 'paga') {
        continue;
      }

      const valorBase = this.toMoney(conta.valorTotal ?? conta.valor);
      const valorPago = this.toMoney(conta.valorPago);
      const valorEmAberto = this.toMoney(Math.max(valorBase - valorPago, 0));
      if (valorEmAberto <= 0) {
        continue;
      }

      const vencimento = this.toDateOrNull(conta.dataVencimento);
      if (!vencimento || !this.isWithinPeriod(vencimento, hoje, ate)) {
        continue;
      }

      const key = this.toDateKey(vencimento);
      const item = itensMap.get(key);
      if (item) {
        item.saidasPrevistas = this.toMoney(item.saidasPrevistas + valorEmAberto);
      }
    }

    const itensOrdenados = Array.from(itensMap.values()).sort((a, b) => a.data.localeCompare(b.data));

    let saldoAcumulado = 0;
    for (const item of itensOrdenados) {
      saldoAcumulado = this.toMoney(saldoAcumulado + item.entradasPrevistas - item.saidasPrevistas);
      item.saldoProjetadoAcumulado = saldoAcumulado;
    }

    const totalEntradasPrevistas = this.toMoney(
      itensOrdenados.reduce((acc, item) => acc + item.entradasPrevistas, 0),
    );
    const totalSaidasPrevistas = this.toMoney(
      itensOrdenados.reduce((acc, item) => acc + item.saidasPrevistas, 0),
    );

    return {
      baseEm: this.toDateKey(hoje),
      ate: this.toDateKey(ate),
      dias,
      totalEntradasPrevistas,
      totalSaidasPrevistas,
      saldoProjetado: this.toMoney(totalEntradasPrevistas - totalSaidasPrevistas),
      itens: itensOrdenados,
    };
  }

  private resolverPeriodo(query: QueryFluxoCaixaDto): { inicio: Date; fim: Date } {
    const hoje = this.startOfDay(new Date());

    const inicio = query.dataInicio
      ? this.startOfDay(this.toDateOrNull(query.dataInicio) || hoje)
      : this.startOfDay(new Date(hoje.getFullYear(), hoje.getMonth(), 1));

    const fim = query.dataFim
      ? this.endOfDay(this.toDateOrNull(query.dataFim) || inicio)
      : this.endOfDay(new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0));

    if (fim.getTime() < inicio.getTime()) {
      return { inicio, fim: this.endOfDay(inicio) };
    }

    return { inicio, fim };
  }

  private criarBuckets(inicio: Date, fim: Date, agrupamento: AgrupamentoFluxoCaixa): BucketInterno[] {
    const buckets: BucketInterno[] = [];

    if (agrupamento === 'dia') {
      let cursor = this.startOfDay(inicio);
      while (cursor.getTime() <= fim.getTime()) {
        const bucketInicio = this.startOfDay(cursor);
        const bucketFim = this.endOfDay(cursor);
        buckets.push(this.criarBucket(bucketInicio, bucketFim));
        cursor = this.addDays(cursor, 1);
      }
      return buckets;
    }

    if (agrupamento === 'semana') {
      let cursor = this.startOfDay(inicio);
      while (cursor.getTime() <= fim.getTime()) {
        const bucketInicio = this.startOfDay(cursor);
        const bucketFim = this.endOfDay(this.addDays(cursor, 6));
        buckets.push(this.criarBucket(bucketInicio, bucketFim.getTime() > fim.getTime() ? fim : bucketFim));
        cursor = this.addDays(cursor, 7);
      }
      return buckets;
    }

    let cursor = this.startOfDay(inicio);
    while (cursor.getTime() <= fim.getTime()) {
      const inicioMes = this.startOfDay(new Date(cursor.getFullYear(), cursor.getMonth(), 1));
      const fimMes = this.endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
      const bucketInicio = inicioMes.getTime() < inicio.getTime() ? inicio : inicioMes;
      const bucketFim = fimMes.getTime() > fim.getTime() ? fim : fimMes;
      buckets.push(this.criarBucket(bucketInicio, bucketFim));
      cursor = this.startOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    }

    return buckets;
  }

  private criarBucket(inicio: Date, fim: Date): BucketInterno {
    return {
      inicio,
      fim,
      item: {
        periodoInicio: this.toDateKey(inicio),
        periodoFim: this.toDateKey(fim),
        entradasRealizadas: 0,
        saidasRealizadas: 0,
        entradasPrevistas: 0,
        saidasPrevistas: 0,
        saldoLiquido: 0,
      },
    };
  }

  private findBucket(data: Date, buckets: BucketInterno[]): BucketInterno | undefined {
    return buckets.find((bucket) => this.isWithinPeriod(data, bucket.inicio, bucket.fim));
  }

  private isWithinPeriod(data: Date, inicio: Date, fim: Date): boolean {
    const target = this.startOfDay(data).getTime();
    return target >= this.startOfDay(inicio).getTime() && target <= this.startOfDay(fim).getTime();
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

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(Number(value) || 0, min), max);
  }

  private toMoney(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    return Number(parsed.toFixed(2));
  }
}
