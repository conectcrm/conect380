import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Proposta } from '../propostas/proposta.entity';
import { Pagamento } from '../faturamento/entities/pagamento.entity';
import { Fatura } from '../faturamento/entities/fatura.entity';
import { ComissaoLancamento } from './entities/comissao-lancamento.entity';
import { ComissaoLancamentoParticipante } from './entities/comissao-lancamento-participante.entity';

type PropostaComissaoConfigShape = {
  participantes?: Array<{ usuarioId: string; percentual: number; papel?: string }>;
  observacoes?: string;
};

function roundMoney(value: number): number {
  return Number((Number(value || 0) || 0).toFixed(2));
}

@Injectable()
export class ComissoesService {
  private readonly logger = new Logger(ComissoesService.name);

  constructor(
    @InjectRepository(ComissaoLancamento)
    private readonly lancamentoRepository: Repository<ComissaoLancamento>,
    @InjectRepository(ComissaoLancamentoParticipante)
    private readonly participanteRepository: Repository<ComissaoLancamentoParticipante>,
    @InjectRepository(Proposta)
    private readonly propostaRepository: Repository<Proposta>,
    private readonly dataSource: DataSource,
  ) {}

  async obterConfigProposta(propostaId: string, empresaId?: string): Promise<PropostaComissaoConfigShape | null> {
    const wherePrimary = empresaId ? ({ id: propostaId, empresaId } as any) : ({ id: propostaId } as any);
    let proposta = await this.propostaRepository.findOne({
      where: wherePrimary,
      select: ['id', 'empresaId', 'vendedor_id', 'comissaoConfig'] as any,
    });
    if (!proposta && empresaId) {
      proposta = await this.propostaRepository.findOne({
        where: { id: propostaId } as any,
        select: ['id', 'empresaId', 'vendedor_id', 'comissaoConfig'] as any,
      });
    }
    const config = (proposta as any)?.comissaoConfig as PropostaComissaoConfigShape | null | undefined;
    return config && typeof config === 'object' ? config : null;
  }

  async salvarConfigProposta(
    propostaId: string,
    empresaId: string | undefined,
    payload: PropostaComissaoConfigShape,
  ): Promise<PropostaComissaoConfigShape> {
    const normalized: PropostaComissaoConfigShape = {
      participantes: Array.isArray(payload?.participantes)
        ? payload.participantes
            .map((p) => ({
              usuarioId: String(p?.usuarioId || '').trim(),
              percentual: Number(p?.percentual || 0),
              papel: p?.papel ? String(p.papel).trim() : undefined,
            }))
            .filter((p) => Boolean(p.usuarioId))
        : [],
      observacoes: payload?.observacoes ? String(payload.observacoes).trim() : undefined,
    };

    const where = empresaId ? ({ id: propostaId, empresaId } as any) : ({ id: propostaId } as any);
    const result = await this.propostaRepository.update(where, { comissaoConfig: normalized as any } as any);
    if (empresaId && (result as any)?.affected === 0) {
      await this.propostaRepository.update({ id: propostaId } as any, { comissaoConfig: normalized as any } as any);
    }
    return normalized;
  }

  private extractPropostaIdFromFatura(fatura: Fatura): string | null {
    const metadados = (fatura?.metadados || {}) as any;
    const propostaId =
      (metadados?.comercial?.propostaId as string | undefined) ||
      (metadados?.propostaId as string | undefined);
    const normalized = String(propostaId || '').trim();
    return normalized || null;
  }

  async registrarLancamentoPorPagamentoAprovado(input: {
    pagamento: Pagamento;
    fatura: Fatura;
    empresaId: string;
    origem?: string;
  }): Promise<ComissaoLancamento | null> {
    const pagamentoId = Number((input.pagamento as any)?.id);
    const faturaId = Number((input.fatura as any)?.id);
    if (!Number.isFinite(pagamentoId) || !Number.isFinite(faturaId)) {
      return null;
    }

    const empresaId = String(input.empresaId || '').trim();
    if (!empresaId) return null;

    const propostaId = this.extractPropostaIdFromFatura(input.fatura);
    const dataEvento =
      (input.pagamento as any)?.dataAprovacao ||
      (input.pagamento as any)?.dataProcessamento ||
      input.pagamento?.createdAt ||
      new Date();
    const date = new Date(dataEvento);
    const competenciaAno = date.getUTCFullYear();
    const competenciaMes = date.getUTCMonth() + 1;

    const valorBaseLiquido = roundMoney(
      Number((input.pagamento as any)?.valorLiquido ?? (input.pagamento as any)?.valor ?? 0),
    );

    try {
      return await this.dataSource.transaction(async (manager) => {
        const existing = await manager.getRepository(ComissaoLancamento).findOne({
          where: { empresaId, pagamentoId },
          relations: ['participantes'],
        });
        if (existing) return existing;

        let participantesConfig: Array<{ usuarioId: string; percentual: number; papel?: string }> = [];
        let configSource: string | null = null;

        if (propostaId) {
          const config = await this.obterConfigProposta(propostaId, empresaId);
          if (config?.participantes && config.participantes.length > 0) {
            participantesConfig = config.participantes
              .map((p) => ({
                usuarioId: String(p?.usuarioId || '').trim(),
                percentual: Number(p?.percentual || 0),
                papel: p?.papel ? String(p.papel).trim() : undefined,
              }))
              .filter((p) => Boolean(p.usuarioId));
            configSource = 'proposta.comissao_config';
          }
        }

        if (participantesConfig.length === 0) {
          this.logger.warn(
            `[Comissoes] Pagamento aprovado sem comissao configurada (empresa=${empresaId} pagamento=${pagamentoId} fatura=${faturaId} proposta=${propostaId || 'n/a'})`,
          );
        }

        const participantesCalculados = participantesConfig.map((p) => {
          const valor = roundMoney(valorBaseLiquido * (Number(p.percentual || 0) / 100));
          return { ...p, valorComissao: valor };
        });

        const valorComissaoTotal = roundMoney(
          participantesCalculados.reduce((sum, p) => sum + Number(p.valorComissao || 0), 0),
        );

        const lancamento = manager.getRepository(ComissaoLancamento).create({
          empresaId,
          propostaId,
          faturaId,
          pagamentoId,
          origem: String(input.origem || 'pagamento.aprovado'),
          competenciaAno,
          competenciaMes,
          dataEvento: date,
          valorBaseLiquido,
          valorComissaoTotal,
          status: 'pendente',
          metadata: {
            configSource,
            propostaId,
            fatura: {
              id: faturaId,
              numero: (input.fatura as any)?.numero || null,
            },
            pagamento: {
              id: pagamentoId,
              transacaoId: (input.pagamento as any)?.transacaoId || null,
              tipo: (input.pagamento as any)?.tipo || null,
              status: (input.pagamento as any)?.status || null,
              valor: roundMoney(Number((input.pagamento as any)?.valor ?? 0)),
              valorLiquido: valorBaseLiquido,
            },
          },
        });

        const saved = await manager.getRepository(ComissaoLancamento).save(lancamento);

        if (participantesCalculados.length > 0) {
          const participantes = participantesCalculados.map((p) =>
            manager.getRepository(ComissaoLancamentoParticipante).create({
              empresaId,
              lancamentoId: saved.id,
              usuarioId: p.usuarioId,
              papel: p.papel || null,
              percentual: Number(p.percentual || 0),
              valorComissao: Number(p.valorComissao || 0),
              metadata: null,
            }),
          );
          await manager.getRepository(ComissaoLancamentoParticipante).save(participantes);
        }

        const withRelations = await manager.getRepository(ComissaoLancamento).findOne({
          where: { id: saved.id },
          relations: ['participantes'],
        });
        return withRelations || saved;
      });
    } catch (error: any) {
      // Unique violation fallback (race condition): fetch existing
      const existing = await this.lancamentoRepository.findOne({
        where: { empresaId, pagamentoId },
        relations: ['participantes'],
      });
      if (existing) return existing;

      this.logger.error(
        `[Comissoes] Falha ao registrar lancamento (empresa=${empresaId} pagamento=${pagamentoId}): ${String(
          error?.message || error,
        )}`,
      );
      return null;
    }
  }

  async listarLancamentos(input: {
    empresaId: string;
    competenciaAno?: number;
    competenciaMes?: number;
    status?: string;
    usuarioId?: string;
    propostaId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ComissaoLancamento[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const empresaId = String(input.empresaId || '').trim();
    const page = Math.max(1, Number(input.page || 1));
    const limit = Math.min(200, Math.max(1, Number(input.limit || 20)));
    const skip = (page - 1) * limit;

    const qb = this.lancamentoRepository
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.participantes', 'p')
      .where('l.empresa_id = :empresaId', { empresaId })
      .orderBy('l.data_evento', 'DESC')
      .addOrderBy('l.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (Number.isFinite(Number(input.competenciaAno))) {
      qb.andWhere('l.competencia_ano = :ano', { ano: Number(input.competenciaAno) });
    }
    if (Number.isFinite(Number(input.competenciaMes))) {
      qb.andWhere('l.competencia_mes = :mes', { mes: Number(input.competenciaMes) });
    }
    if (input.status) {
      qb.andWhere('l.status = :status', { status: String(input.status).trim() });
    }
    if (input.propostaId) {
      qb.andWhere('l.proposta_id = :propostaId', { propostaId: String(input.propostaId).trim() });
    }
    if (input.usuarioId) {
      qb.andWhere('p.usuario_id = :usuarioId', { usuarioId: String(input.usuarioId).trim() });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
