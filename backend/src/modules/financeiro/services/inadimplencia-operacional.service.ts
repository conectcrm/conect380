import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmpresaConfig } from '../../empresas/entities/empresa-config.entity';
import { Fatura, StatusFatura } from '../../faturamento/entities/fatura.entity';
import {
  InadimplenciaOperacionalEventoResponseDto,
  InadimplenciaOperacionalResponseDto,
  QueryInadimplenciaOperacionalDto,
} from '../dto/inadimplencia-operacional.dto';
import {
  ClienteOperacaoFinanceiraEvento,
  TipoEventoOperacaoFinanceiraCliente,
} from '../entities/cliente-operacao-financeira-evento.entity';
import {
  ClienteOperacaoFinanceiraStatus,
  OrigemStatusOperacaoFinanceira,
  StatusOperacaoFinanceiraCliente,
} from '../entities/cliente-operacao-financeira-status.entity';

type PoliticaInadimplenciaEmpresa = {
  inadimplenciaAutomacaoAtiva: boolean;
  inadimplenciaDiasAviso: number;
  inadimplenciaDiasAcao: number;
  inadimplenciaAcao: 'nenhuma' | 'marcar_em_risco' | 'bloquear_operacao' | 'suspender_acesso';
  inadimplenciaModoExecucao: 'automatico' | 'manual_com_sugestao';
  inadimplenciaEscopo: 'cliente' | 'servico' | 'contrato' | 'recorrencia';
  inadimplenciaDesbloqueioAutomaticoNaBaixa: boolean;
};

type ResumoVencidosCliente = {
  saldoVencido: number;
  diasMaiorAtraso: number;
  quantidadeTitulosVencidos: number;
  faturaIds: number[];
};

export type ResumoReavaliacaoInadimplenciaEmpresa = {
  empresaId: string;
  clientesAvaliados: number;
  bloqueados: number;
  emRisco: number;
  ativos: number;
  falhas: number;
};

@Injectable()
export class InadimplenciaOperacionalService {
  constructor(
    @InjectRepository(EmpresaConfig)
    private readonly empresaConfigRepository: Repository<EmpresaConfig>,
    @InjectRepository(Fatura)
    private readonly faturaRepository: Repository<Fatura>,
    @InjectRepository(ClienteOperacaoFinanceiraStatus)
    private readonly statusRepository: Repository<ClienteOperacaoFinanceiraStatus>,
    @InjectRepository(ClienteOperacaoFinanceiraEvento)
    private readonly eventoRepository: Repository<ClienteOperacaoFinanceiraEvento>,
  ) {}

  async listarStatus(
    empresaId: string,
    filtros: QueryInadimplenciaOperacionalDto = {},
  ): Promise<InadimplenciaOperacionalResponseDto[]> {
    const limit = Math.min(Math.max(Number(filtros.limit) || 50, 1), 500);
    const query = this.statusRepository
      .createQueryBuilder('status')
      .leftJoinAndSelect('status.cliente', 'cliente')
      .where('status.empresaId = :empresaId', { empresaId })
      .orderBy('status.updatedAt', 'DESC')
      .limit(limit);

    if (filtros.status) {
      query.andWhere('status.statusOperacional = :statusOperacional', {
        statusOperacional: filtros.status,
      });
    }

    if (filtros.somenteComSaldoVencido) {
      query.andWhere('status.saldoVencido > 0');
    }

    if (filtros.busca?.trim()) {
      query.andWhere(
        "(LOWER(cliente.nome) LIKE :busca OR LOWER(COALESCE(cliente.email, '')) LIKE :busca)",
        { busca: `%${filtros.busca.trim().toLowerCase()}%` },
      );
    }

    const statuses = await query.getMany();
    return statuses.map((item) => this.mapStatusResponse(item));
  }

  async obterStatusCliente(
    empresaId: string,
    clienteId: string,
  ): Promise<{
    status: InadimplenciaOperacionalResponseDto;
    eventos: InadimplenciaOperacionalEventoResponseDto[];
  }> {
    const status = await this.avaliarCliente(empresaId, clienteId, {
      actorId: 'sistema',
      trigger: 'consulta',
    });
    const eventos = await this.listarEventosCliente(empresaId, clienteId);
    return { status, eventos };
  }

  async avaliarCliente(
    empresaId: string,
    clienteId: string,
    options?: {
      actorId?: string;
      motivo?: string;
      trigger?: 'consulta' | 'baixa_manual' | 'vencimento' | 'scheduler' | 'reavaliacao_manual';
    },
  ): Promise<InadimplenciaOperacionalResponseDto> {
    const actorId = String(options?.actorId || 'sistema').trim() || 'sistema';
    const politica = await this.obterPoliticaEmpresa(empresaId);
    const resumo = await this.calcularResumoTitulosVencidos(empresaId, clienteId);
    const atual = await this.statusRepository.findOne({
      where: { empresaId, clienteId },
      relations: { cliente: true },
    });

    const now = new Date();
    const estadoAnterior = atual?.statusOperacional ?? 'ativo';
    const bloqueioManual = Boolean(atual?.bloqueioManual);
    const proximoEstado = this.calcularEstadoOperacional(
      politica,
      resumo,
      bloqueioManual,
      estadoAnterior,
    );
    const proximaOrigem = this.calcularOrigemStatus(proximoEstado, bloqueioManual);

    const status = this.statusRepository.create({
      ...(atual || {}),
      empresaId,
      clienteId,
      statusOperacional: proximoEstado,
      origemStatus: proximaOrigem,
      bloqueioManual,
      saldoVencido: resumo.saldoVencido,
      diasMaiorAtraso: resumo.diasMaiorAtraso,
      quantidadeTitulosVencidos: resumo.quantidadeTitulosVencidos,
      ultimaAvaliacaoEm: now,
      bloqueadoEm: this.resolveBloqueadoEm(atual, proximoEstado, now),
      desbloqueadoEm: this.resolveDesbloqueadoEm(atual, estadoAnterior, proximoEstado, now),
      motivo: this.resolverMotivoAutomatico(politica, resumo, bloqueioManual, options?.motivo),
      metadata: {
        ...(atual?.metadata || {}),
        trigger: options?.trigger || 'consulta',
        acaoConfigurada: politica.inadimplenciaAcao,
        escopoAplicacao: politica.inadimplenciaEscopo,
        faturaIdsVencidas: resumo.faturaIds,
      },
    });

    const salvo = await this.statusRepository.save(status);
    await this.registrarEventoAvaliacao({
      status: salvo,
      estadoAnterior,
      actorId,
      motivo: options?.motivo || null,
      trigger: options?.trigger || 'consulta',
    });

    const completo = await this.statusRepository.findOne({
      where: { id: salvo.id },
      relations: { cliente: true },
    });

    return this.mapStatusResponse(completo || salvo);
  }

  async bloquearManual(
    empresaId: string,
    clienteId: string,
    actorId: string,
    motivo?: string,
  ): Promise<InadimplenciaOperacionalResponseDto> {
    const resumo = await this.calcularResumoTitulosVencidos(empresaId, clienteId);
    const atual = await this.statusRepository.findOne({
      where: { empresaId, clienteId },
      relations: { cliente: true },
    });
    const now = new Date();

    const status = this.statusRepository.create({
      ...(atual || {}),
      empresaId,
      clienteId,
      statusOperacional: 'bloqueado_manual',
      origemStatus: 'manual',
      bloqueioManual: true,
      saldoVencido: resumo.saldoVencido,
      diasMaiorAtraso: resumo.diasMaiorAtraso,
      quantidadeTitulosVencidos: resumo.quantidadeTitulosVencidos,
      ultimaAvaliacaoEm: now,
      bloqueadoEm: now,
      motivo: motivo?.trim() || 'Bloqueio manual aplicado pela operacao financeira.',
      metadata: {
        ...(atual?.metadata || {}),
        faturaIdsVencidas: resumo.faturaIds,
        ultimaAcaoManual: 'bloquear',
      },
    });

    const salvo = await this.statusRepository.save(status);
    await this.registrarEvento({
      empresaId,
      clienteId,
      statusId: salvo.id,
      tipoEvento: 'bloqueio_manual',
      estadoAnterior: atual?.statusOperacional ?? 'ativo',
      estadoNovo: 'bloqueado_manual',
      motivo: status.motivo,
      saldoVencido: resumo.saldoVencido,
      diasMaiorAtraso: resumo.diasMaiorAtraso,
      actorId,
      metadata: {
        faturaIdsVencidas: resumo.faturaIds,
      },
    });

    const completo = await this.statusRepository.findOne({
      where: { id: salvo.id },
      relations: { cliente: true },
    });

    return this.mapStatusResponse(completo || salvo);
  }

  async desbloquearManual(
    empresaId: string,
    clienteId: string,
    actorId: string,
    motivo?: string,
  ): Promise<InadimplenciaOperacionalResponseDto> {
    const resumo = await this.calcularResumoTitulosVencidos(empresaId, clienteId);
    const atual = await this.statusRepository.findOne({
      where: { empresaId, clienteId },
      relations: { cliente: true },
    });
    if (!atual) {
      throw new NotFoundException('Status operacional financeiro do cliente nao encontrado');
    }

    const now = new Date();
    const estadoNovo: StatusOperacaoFinanceiraCliente =
      resumo.quantidadeTitulosVencidos > 0 ? 'em_risco' : 'ativo';

    const status = this.statusRepository.create({
      ...atual,
      statusOperacional: estadoNovo,
      origemStatus: 'manual',
      bloqueioManual: false,
      saldoVencido: resumo.saldoVencido,
      diasMaiorAtraso: resumo.diasMaiorAtraso,
      quantidadeTitulosVencidos: resumo.quantidadeTitulosVencidos,
      ultimaAvaliacaoEm: now,
      desbloqueadoEm: now,
      motivo: motivo?.trim() || 'Desbloqueio manual aplicado pela operacao financeira.',
      metadata: {
        ...(atual.metadata || {}),
        faturaIdsVencidas: resumo.faturaIds,
        ultimaAcaoManual: 'desbloquear',
      },
    });

    const salvo = await this.statusRepository.save(status);
    await this.registrarEvento({
      empresaId,
      clienteId,
      statusId: salvo.id,
      tipoEvento: 'desbloqueio_manual',
      estadoAnterior: atual.statusOperacional,
      estadoNovo,
      motivo: status.motivo,
      saldoVencido: resumo.saldoVencido,
      diasMaiorAtraso: resumo.diasMaiorAtraso,
      actorId,
      metadata: {
        faturaIdsVencidas: resumo.faturaIds,
      },
    });

    const completo = await this.statusRepository.findOne({
      where: { id: salvo.id },
      relations: { cliente: true },
    });

    return this.mapStatusResponse(completo || salvo);
  }

  async listarEventosCliente(
    empresaId: string,
    clienteId: string,
    limit = 20,
  ): Promise<InadimplenciaOperacionalEventoResponseDto[]> {
    const eventos = await this.eventoRepository.find({
      where: { empresaId, clienteId },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return eventos.map((item) => this.mapEventoResponse(item));
  }

  async reavaliarEmpresa(
    empresaId: string,
    options?: {
      actorId?: string;
      trigger?: 'scheduler' | 'reavaliacao_manual';
    },
  ): Promise<ResumoReavaliacaoInadimplenciaEmpresa> {
    const clienteIds = await this.listarClienteIdsParaReavaliacao(empresaId);
    const resumo: ResumoReavaliacaoInadimplenciaEmpresa = {
      empresaId,
      clientesAvaliados: 0,
      bloqueados: 0,
      emRisco: 0,
      ativos: 0,
      falhas: 0,
    };

    for (const clienteId of clienteIds) {
      try {
        const status = await this.avaliarCliente(empresaId, clienteId, {
          actorId: options?.actorId || 'sistema',
          trigger: options?.trigger || 'scheduler',
        });
        resumo.clientesAvaliados += 1;
        if (
          status.statusOperacional === 'bloqueado_automatico' ||
          status.statusOperacional === 'bloqueado_manual'
        ) {
          resumo.bloqueados += 1;
        } else if (status.statusOperacional === 'em_risco') {
          resumo.emRisco += 1;
        } else {
          resumo.ativos += 1;
        }
      } catch {
        resumo.falhas += 1;
      }
    }

    return resumo;
  }

  private async obterPoliticaEmpresa(empresaId: string): Promise<PoliticaInadimplenciaEmpresa> {
    const config = await this.empresaConfigRepository.findOne({
      where: { empresaId },
    });

    return {
      inadimplenciaAutomacaoAtiva: Boolean(config?.inadimplenciaAutomacaoAtiva),
      inadimplenciaDiasAviso: Math.max(Number(config?.inadimplenciaDiasAviso ?? 3), 0),
      inadimplenciaDiasAcao: Math.max(Number(config?.inadimplenciaDiasAcao ?? 15), 0),
      inadimplenciaAcao: config?.inadimplenciaAcao || 'bloquear_operacao',
      inadimplenciaModoExecucao: config?.inadimplenciaModoExecucao || 'automatico',
      inadimplenciaEscopo: config?.inadimplenciaEscopo || 'cliente',
      inadimplenciaDesbloqueioAutomaticoNaBaixa:
        config?.inadimplenciaDesbloqueioAutomaticoNaBaixa ?? true,
    };
  }

  private async calcularResumoTitulosVencidos(
    empresaId: string,
    clienteId: string,
  ): Promise<ResumoVencidosCliente> {
    const hoje = this.startOfDay(new Date());
    const faturas = await this.faturaRepository
      .createQueryBuilder('fatura')
      .where('fatura.empresa_id = :empresaId', { empresaId })
      .andWhere('fatura.clienteId = :clienteId', { clienteId })
      .andWhere('fatura.ativo = :ativo', { ativo: true })
      .andWhere('fatura.status NOT IN (:...statuses)', {
        statuses: [StatusFatura.PAGA, StatusFatura.CANCELADA],
      })
      .getMany();

    return faturas.reduce<ResumoVencidosCliente>(
      (acc, item) => {
        const saldo = this.toMoney(Number(item.valorTotal || 0) - Number(item.valorPago || 0));
        const vencimento = this.startOfDay(new Date(item.dataVencimento));
        if (saldo <= 0 || vencimento >= hoje) {
          return acc;
        }

        const diasAtraso = this.diffDays(hoje, vencimento);
        acc.saldoVencido = this.toMoney(acc.saldoVencido + saldo);
        acc.diasMaiorAtraso = Math.max(acc.diasMaiorAtraso, diasAtraso);
        acc.quantidadeTitulosVencidos += 1;
        acc.faturaIds.push(Number(item.id));
        return acc;
      },
      {
        saldoVencido: 0,
        diasMaiorAtraso: 0,
        quantidadeTitulosVencidos: 0,
        faturaIds: [],
      },
    );
  }

  private async listarClienteIdsParaReavaliacao(empresaId: string): Promise<string[]> {
    const hoje = this.startOfDay(new Date());
    const faturasVencidas = await this.faturaRepository
      .createQueryBuilder('fatura')
      .select('DISTINCT fatura.clienteId', 'clienteId')
      .where('fatura.empresa_id = :empresaId', { empresaId })
      .andWhere('fatura.ativo = :ativo', { ativo: true })
      .andWhere('fatura.status NOT IN (:...statuses)', {
        statuses: [StatusFatura.PAGA, StatusFatura.CANCELADA],
      })
      .andWhere('fatura.dataVencimento < :hoje', { hoje })
      .getRawMany<{ clienteId: string }>();

    const statusAbertos = await this.statusRepository.find({
      where: { empresaId },
      select: { clienteId: true } as any,
    });

    const clienteIds = new Set<string>();
    for (const item of faturasVencidas) {
      if (item.clienteId) {
        clienteIds.add(item.clienteId);
      }
    }
    for (const item of statusAbertos) {
      if (item.clienteId) {
        clienteIds.add(item.clienteId);
      }
    }

    return Array.from(clienteIds);
  }

  private calcularEstadoOperacional(
    politica: PoliticaInadimplenciaEmpresa,
    resumo: ResumoVencidosCliente,
    bloqueioManual: boolean,
    estadoAnterior: StatusOperacaoFinanceiraCliente,
  ): StatusOperacaoFinanceiraCliente {
    if (bloqueioManual) {
      return 'bloqueado_manual';
    }

    if (!politica.inadimplenciaAutomacaoAtiva) {
      return 'ativo';
    }

    if (resumo.quantidadeTitulosVencidos === 0) {
      if (
        estadoAnterior === 'bloqueado_automatico' &&
        !politica.inadimplenciaDesbloqueioAutomaticoNaBaixa
      ) {
        return 'bloqueado_automatico';
      }
      return 'ativo';
    }

    const atingiuAcao = resumo.diasMaiorAtraso >= politica.inadimplenciaDiasAcao;
    const podeBloquearAutomaticamente =
      politica.inadimplenciaAutomacaoAtiva &&
      politica.inadimplenciaModoExecucao === 'automatico' &&
      atingiuAcao &&
      politica.inadimplenciaAcao !== 'nenhuma' &&
      politica.inadimplenciaAcao !== 'marcar_em_risco';

    if (podeBloquearAutomaticamente) {
      return 'bloqueado_automatico';
    }

    if (resumo.diasMaiorAtraso >= politica.inadimplenciaDiasAviso) {
      return 'em_risco';
    }

    return 'ativo';
  }

  private calcularOrigemStatus(
    status: StatusOperacaoFinanceiraCliente,
    bloqueioManual: boolean,
  ): OrigemStatusOperacaoFinanceira {
    if (bloqueioManual) {
      return 'manual';
    }

    if (status === 'ativo') {
      return 'sistema';
    }

    return 'automacao';
  }

  private resolverMotivoAutomatico(
    politica: PoliticaInadimplenciaEmpresa,
    resumo: ResumoVencidosCliente,
    bloqueioManual: boolean,
    motivo?: string,
  ): string | null {
    if (motivo?.trim()) {
      return motivo.trim();
    }

    if (bloqueioManual) {
      return 'Bloqueio manual mantido na reavaliacao automatica.';
    }

    if (!politica.inadimplenciaAutomacaoAtiva) {
      return 'Automacao de inadimplencia operacional desativada para esta empresa.';
    }

    if (resumo.quantidadeTitulosVencidos === 0) {
      return 'Cliente sem titulos vencidos em aberto.';
    }

    if (
      politica.inadimplenciaAutomacaoAtiva &&
      politica.inadimplenciaModoExecucao === 'automatico' &&
      resumo.diasMaiorAtraso >= politica.inadimplenciaDiasAcao &&
      politica.inadimplenciaAcao !== 'nenhuma' &&
      politica.inadimplenciaAcao !== 'marcar_em_risco'
    ) {
      return `Bloqueio automatico por inadimplencia acima de ${politica.inadimplenciaDiasAcao} dia(s).`;
    }

    if (resumo.diasMaiorAtraso >= politica.inadimplenciaDiasAviso) {
      return `Cliente em risco por titulos vencidos ha ${resumo.diasMaiorAtraso} dia(s).`;
    }

    return 'Cliente monitorado pela politica de inadimplencia.';
  }

  private resolveBloqueadoEm(
    atual: ClienteOperacaoFinanceiraStatus | null,
    proximoEstado: StatusOperacaoFinanceiraCliente,
    now: Date,
  ): Date | null {
    if (proximoEstado === 'bloqueado_automatico' || proximoEstado === 'bloqueado_manual') {
      return atual?.bloqueadoEm || now;
    }
    return null;
  }

  private resolveDesbloqueadoEm(
    atual: ClienteOperacaoFinanceiraStatus | null,
    estadoAnterior: StatusOperacaoFinanceiraCliente,
    proximoEstado: StatusOperacaoFinanceiraCliente,
    now: Date,
  ): Date | null {
    if (
      atual &&
      (estadoAnterior === 'bloqueado_automatico' || estadoAnterior === 'bloqueado_manual') &&
      proximoEstado !== 'bloqueado_automatico' &&
      proximoEstado !== 'bloqueado_manual'
    ) {
      return now;
    }
    return atual?.desbloqueadoEm || null;
  }

  private async registrarEventoAvaliacao(params: {
    status: ClienteOperacaoFinanceiraStatus;
    estadoAnterior: StatusOperacaoFinanceiraCliente;
    actorId: string;
    motivo: string | null;
    trigger: string;
  }) {
    let tipoEvento: TipoEventoOperacaoFinanceiraCliente = 'avaliacao';

    if (
      params.status.statusOperacional === 'bloqueado_automatico' &&
      params.estadoAnterior !== 'bloqueado_automatico'
    ) {
      tipoEvento = 'bloqueio_automatico';
    } else if (
      params.estadoAnterior === 'bloqueado_automatico' &&
      params.status.statusOperacional !== 'bloqueado_automatico' &&
      params.status.statusOperacional !== 'bloqueado_manual'
    ) {
      tipoEvento = 'desbloqueio_automatico';
    } else if (
      params.status.statusOperacional === 'em_risco' &&
      params.estadoAnterior !== 'em_risco'
    ) {
      tipoEvento = 'marcacao_risco';
    }

    await this.registrarEvento({
      empresaId: params.status.empresaId,
      clienteId: params.status.clienteId,
      statusId: params.status.id,
      tipoEvento,
      estadoAnterior: params.estadoAnterior,
      estadoNovo: params.status.statusOperacional,
      motivo: params.motivo || params.status.motivo,
      saldoVencido: Number(params.status.saldoVencido || 0),
      diasMaiorAtraso: Number(params.status.diasMaiorAtraso || 0),
      actorId: params.actorId,
      metadata: {
        trigger: params.trigger,
        bloqueioManual: params.status.bloqueioManual,
        quantidadeTitulosVencidos: params.status.quantidadeTitulosVencidos,
      },
    });
  }

  private async registrarEvento(params: {
    empresaId: string;
    clienteId: string;
    statusId: string | null;
    tipoEvento: TipoEventoOperacaoFinanceiraCliente;
    estadoAnterior: StatusOperacaoFinanceiraCliente | null;
    estadoNovo: StatusOperacaoFinanceiraCliente | null;
    motivo: string | null;
    saldoVencido: number;
    diasMaiorAtraso: number;
    actorId: string;
    metadata?: Record<string, unknown>;
  }) {
    const evento = this.eventoRepository.create({
      empresaId: params.empresaId,
      clienteId: params.clienteId,
      statusId: params.statusId,
      tipoEvento: params.tipoEvento,
      estadoAnterior: params.estadoAnterior,
      estadoNovo: params.estadoNovo,
      motivo: params.motivo,
      saldoVencido: this.toMoney(params.saldoVencido),
      diasMaiorAtraso: params.diasMaiorAtraso,
      atorId: params.actorId,
      metadata: params.metadata || null,
    });

    await this.eventoRepository.save(evento);
  }

  private mapStatusResponse(
    item: ClienteOperacaoFinanceiraStatus,
  ): InadimplenciaOperacionalResponseDto {
    return {
      id: item.id,
      empresaId: item.empresaId,
      clienteId: item.clienteId,
      statusOperacional: item.statusOperacional,
      origemStatus: item.origemStatus,
      motivo: item.motivo || null,
      bloqueioManual: Boolean(item.bloqueioManual),
      saldoVencido: this.toMoney(item.saldoVencido),
      diasMaiorAtraso: Number(item.diasMaiorAtraso || 0),
      quantidadeTitulosVencidos: Number(item.quantidadeTitulosVencidos || 0),
      ultimaAvaliacaoEm: item.ultimaAvaliacaoEm ? item.ultimaAvaliacaoEm.toISOString() : null,
      bloqueadoEm: item.bloqueadoEm ? item.bloqueadoEm.toISOString() : null,
      desbloqueadoEm: item.desbloqueadoEm ? item.desbloqueadoEm.toISOString() : null,
      metadata: (item.metadata as Record<string, unknown> | null) || null,
      cliente: item.cliente
        ? {
            id: item.cliente.id,
            nome: item.cliente.nome,
            email: item.cliente.email,
            documento: item.cliente.documento || null,
          }
        : null,
    };
  }

  private mapEventoResponse(
    item: ClienteOperacaoFinanceiraEvento,
  ): InadimplenciaOperacionalEventoResponseDto {
    return {
      id: item.id,
      tipoEvento: item.tipoEvento,
      estadoAnterior: item.estadoAnterior || null,
      estadoNovo: item.estadoNovo || null,
      motivo: item.motivo || null,
      saldoVencido: this.toMoney(item.saldoVencido),
      diasMaiorAtraso: Number(item.diasMaiorAtraso || 0),
      atorId: item.atorId || null,
      metadata: (item.metadata as Record<string, unknown> | null) || null,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private diffDays(a: Date, b: Date): number {
    return Math.max(0, Math.round((a.getTime() - b.getTime()) / 86400000));
  }

  private toMoney(value: unknown): number {
    const numeric = Number(value || 0);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Number(numeric.toFixed(2));
  }
}
