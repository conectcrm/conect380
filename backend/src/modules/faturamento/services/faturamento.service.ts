import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Fatura, StatusFatura, TipoFatura } from '../entities/fatura.entity';
import { ItemFatura } from '../entities/item-fatura.entity';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { Cliente } from '../../clientes/cliente.entity';
import { PropostasService } from '../../propostas/propostas.service';
import { CreateFaturaDto, UpdateFaturaDto, GerarFaturaAutomaticaDto } from '../dto/fatura.dto';
import { EmailIntegradoService } from '../../propostas/email-integrado.service';

@Injectable()
export class FaturamentoService {
  private readonly logger = new Logger(FaturamentoService.name);
  private propostaRelationEnabled: boolean | null = null;

  constructor(
    @InjectRepository(Fatura)
    private faturaRepository: Repository<Fatura>,
    @InjectRepository(ItemFatura)
    private itemFaturaRepository: Repository<ItemFatura>,
    @InjectRepository(Contrato)
    private contratoRepository: Repository<Contrato>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    private propostasService: PropostasService,
    private emailService: EmailIntegradoService,
  ) {}

  async criarFatura(createFaturaDto: CreateFaturaDto, empresaId: string): Promise<Fatura> {
    try {
      let contrato: Contrato | null = null;

      if (createFaturaDto.contratoId) {
        // x" MULTI-TENANCY: Validar que contrato pertence  empresa
        contrato = await this.contratoRepository.findOne({
          where: { id: createFaturaDto.contratoId, empresa_id: empresaId },
        });

        if (!contrato) {
          throw new NotFoundException('Contrato no encontrado');
        }
      }

      // Gerar nmero nico da fatura
      const numero = await this.gerarNumeroFatura();

      // Calcular valor total dos itens
      const valorItens = this.calcularValorTotalItens(createFaturaDto.itens);
      const descontoGlobal = createFaturaDto.valorDesconto || 0;
      const valorTotal = Math.max(valorItens - descontoGlobal, 0);

      // Criar fatura
      const fatura = this.faturaRepository.create({
        ...createFaturaDto,
        numero,
        valorTotal,
        valorPago: 0,
        dataEmissao: new Date(),
        status: StatusFatura.PENDENTE,
        empresaId,
      });

      const faturaSalva = await this.faturaRepository.save(fatura);

      // Criar itens da fatura
      const itens = createFaturaDto.itens.map((item) =>
        this.itemFaturaRepository.create({
          ...item,
          faturaId: faturaSalva.id,
          valorTotal: this.calcularValorTotalItem(item),
        }),
      );

      await this.itemFaturaRepository.save(itens);

      // Recarregar fatura com itens
      const faturaCompleta = await this.buscarFaturaPorId(faturaSalva.id, empresaId);

      this.logger.log(`Fatura criada: ${faturaCompleta.numero}`);
      await this.sincronizarStatusPropostaPelaFatura(
        faturaCompleta,
        empresaId,
        'fatura_criada',
        'faturamento-criacao',
      );

      return faturaCompleta;
    } catch (error) {
      this.logger.error(`Erro ao criar fatura: ${error.message}`);
      throw new BadRequestException('Erro ao criar fatura');
    }
  }

  async gerarFaturaAutomatica(
    gerarFaturaDto: GerarFaturaAutomaticaDto,
    empresaId: string,
  ): Promise<Fatura> {
    try {
      // x" MULTI-TENANCY: Validar que contrato pertence  empresa
      const contrato = await this.contratoRepository.findOne({
        where: { id: gerarFaturaDto.contratoId, empresa_id: empresaId },
      });

      if (!contrato) {
        throw new NotFoundException('Contrato no encontrado');
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
        formaPagamentoPreferida: this.mapearFormaPagamento(
          contrato.condicoesPagamento?.formaPagamento,
        ),
        dataVencimento: this.calcularDataVencimento(contrato),
        observacoes: gerarFaturaDto.observacoes,
        itens: [
          {
            descricao: contrato.objeto,
            quantidade: 1,
            valorUnitario: contrato.valorTotal,
            unidade: 'un',
            codigoProduto: `CT-${contrato.numero}`,
          },
        ],
      };

      const fatura = await this.criarFatura(createFaturaDto, empresaId);

      // Enviar email se solicitado
      if (gerarFaturaDto.enviarEmail) {
        await this.enviarFaturaPorEmail(fatura.id, empresaId);
      }

      this.logger.log(
        `Fatura automtica gerada para contrato ${contrato.numero}: ${fatura.numero}`,
      );

      return fatura;
    } catch (error) {
      this.logger.error(`Erro ao gerar fatura automtica: ${error.message}`);
      throw error;
    }
  }

  async buscarFaturas(
    empresaId: string,
    filtros?: {
      status?: StatusFatura;
      clienteId?: string;
      contratoId?: number;
      dataInicio?: Date;
      dataFim?: Date;
    },
  ): Promise<Fatura[]> {
    // x" MULTI-TENANCY: Filtrar por empresa_id
    const query = this.faturaRepository
      .createQueryBuilder('fatura')
      .leftJoinAndSelect('fatura.contrato', 'contrato')
      .leftJoinAndSelect('fatura.usuarioResponsavel', 'usuario')
      .leftJoinAndSelect('fatura.itens', 'itens')
      .leftJoinAndSelect('fatura.pagamentos', 'pagamentos')
      .where('fatura.ativo = :ativo', { ativo: true })
      .andWhere('fatura.empresa_id = :empresaId', { empresaId });

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

    return query.orderBy('fatura.createdAt', 'DESC').getMany();
  }

  async buscarFaturasPaginadas(
    empresaId: string,
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    filtros?: {
      status?: StatusFatura;
      clienteId?: string;
      contratoId?: number;
      dataInicio?: Date;
      dataFim?: Date;
      q?: string;
    },
  ): Promise<{ faturas: any[]; total: number; resumo: any }> {
    const aplicarFiltros = (qb: any) => {
      if (filtros?.status) {
        qb.andWhere('fatura.status = :status', { status: filtros.status });
      }

      if (filtros?.clienteId) {
        qb.andWhere('fatura.clienteId = :clienteId', { clienteId: filtros.clienteId });
      }

      if (filtros?.contratoId) {
        qb.andWhere('fatura.contratoId = :contratoId', { contratoId: filtros.contratoId });
      }

      if (filtros?.dataInicio) {
        qb.andWhere('fatura.dataEmissao >= :dataInicio', { dataInicio: filtros.dataInicio });
      }

      if (filtros?.dataFim) {
        qb.andWhere('fatura.dataEmissao <= :dataFim', { dataFim: filtros.dataFim });
      }

      if (filtros?.q?.trim()) {
        const q = `%${filtros.q.trim().toLowerCase()}%`;
        qb.andWhere(
          new Brackets((searchQb) => {
            searchQb
              .where(`LOWER(COALESCE(fatura.numero, '')) LIKE :q`, { q })
              .orWhere(`LOWER(COALESCE(fatura.descricao, '')) LIKE :q`, { q })
              .orWhere(`LOWER(COALESCE(cliente.nome, '')) LIKE :q`, { q })
              .orWhere(`LOWER(COALESCE(contrato.numero, '')) LIKE :q`, { q });
          }),
        );
      }

      return qb;
    };

    // x MULTI-TENANCY: Filtrar por empresa_id
    const includePropostaRelation = await this.canLoadPropostaRelation();

    const queryBuilder = this.faturaRepository
      .createQueryBuilder('fatura')
      .leftJoinAndSelect('fatura.contrato', 'contrato')
      .leftJoinAndSelect('fatura.cliente', 'cliente')
      .leftJoinAndSelect('fatura.usuarioResponsavel', 'usuario')
      .leftJoinAndSelect('fatura.itens', 'itens')
      .leftJoinAndSelect('fatura.pagamentos', 'pagamentos')
      .where('fatura.ativo = :ativo', { ativo: true })
      .andWhere('fatura.empresa_id = :empresaId', { empresaId });

    if (includePropostaRelation) {
      queryBuilder.leftJoinAndSelect('contrato.proposta', 'proposta');
    }

    aplicarFiltros(queryBuilder);

    const [faturas, total] = await queryBuilder
      .orderBy(`fatura.${sortBy}`, sortOrder)
      .limit(pageSize)
      .offset((page - 1) * pageSize)
      .getManyAndCount();

    const resumoQueryBuilder = this.faturaRepository
      .createQueryBuilder('fatura')
      .leftJoin('fatura.contrato', 'contrato')
      .leftJoin('fatura.cliente', 'cliente')
      .where('fatura.ativo = :ativo', { ativo: true })
      .andWhere('fatura.empresa_id = :empresaId', { empresaId });

    aplicarFiltros(resumoQueryBuilder);

    const resumo = await resumoQueryBuilder
      .select([
        `COALESCE(SUM(fatura."valorTotal"), 0) AS "valorTotal"`,
        `COALESCE(SUM(fatura."valorPago"), 0) AS "valorRecebido"`,
        `COALESCE(SUM(fatura."valorTotal" - fatura."valorPago"), 0) AS "valorEmAberto"`,
      ])
      .getRawOne();

    return {
      faturas,
      total,
      resumo: resumo || {
        valorTotal: 0,
        valorRecebido: 0,
        valorEmAberto: 0,
      },
    };
  }

  async buscarFaturaPorId(id: number, empresaId: string): Promise<Fatura> {
    const relations = ['contrato', 'usuarioResponsavel', 'itens', 'pagamentos', 'cliente'];
    if (await this.canLoadPropostaRelation()) {
      relations.splice(1, 0, 'contrato.proposta');
    }

    // x" MULTI-TENANCY: Filtrar por empresa_id
    const fatura = await this.faturaRepository.findOne({
      where: { id, empresaId, ativo: true },
      relations,
    });

    if (!fatura) {
      throw new NotFoundException('Fatura no encontrada');
    }

    return fatura;
  }

  async buscarFaturaPorNumero(numero: string, empresaId: string): Promise<any> {
    const relations = ['contrato', 'usuarioResponsavel', 'itens', 'pagamentos', 'cliente'];
    if (await this.canLoadPropostaRelation()) {
      relations.splice(1, 0, 'contrato.proposta');
    }

    // x" MULTI-TENANCY: Filtrar por empresa_id
    const fatura = await this.faturaRepository.findOne({
      where: { numero, empresaId, ativo: true },
      relations,
    });

    if (!fatura) {
      throw new NotFoundException('Fatura no encontrada');
    }

    return fatura;
  }

  async atualizarFatura(
    id: number,
    updateFaturaDto: UpdateFaturaDto,
    empresaId: string,
  ): Promise<Fatura> {
    // x" MULTI-TENANCY: Validar empresa_id
    const fatura = await this.buscarFaturaPorId(id, empresaId);

    // Verificao direta do status em vez de usar o mtodo isPaga()
    if (fatura.status === StatusFatura.PAGA) {
      throw new BadRequestException('No  possvel alterar fatura j paga');
    }

    // Atualizar dados bsicos
    Object.assign(fatura, updateFaturaDto);

    // Se alterou itens, recalcular valor total
    if (updateFaturaDto.itens) {
      // Remover itens existentes
      await this.itemFaturaRepository.delete({ faturaId: id });

      // Criar novos itens
      const novosItens = updateFaturaDto.itens.map((item) =>
        this.itemFaturaRepository.create({
          ...item,
          faturaId: id,
          valorTotal: item.quantidade * item.valorUnitario - (item.valorDesconto || 0),
        }),
      );

      await this.itemFaturaRepository.save(novosItens);

      // Recalcular valor total
      fatura.valorTotal = this.calcularValorTotalItens(updateFaturaDto.itens);
    }

    const faturaAtualizada = await this.faturaRepository.save(fatura);
    this.logger.log(`Fatura atualizada: ${faturaAtualizada.numero}`);

    return this.buscarFaturaPorId(faturaAtualizada.id, empresaId);
  }

  async marcarComoPaga(id: number, valorPago: number, empresaId: string): Promise<Fatura> {
    // x" MULTI-TENANCY: Validar empresa_id
    const fatura = await this.buscarFaturaPorId(id, empresaId);

    // Verificao direta do status em vez de usar o mtodo isPaga()
    if (fatura.status === StatusFatura.PAGA) {
      throw new BadRequestException('Fatura j est paga');
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
    await this.sincronizarStatusPropostaPelaFatura(
      faturaAtualizada,
      empresaId,
      undefined,
      'faturamento-pagamento',
    );

    return faturaAtualizada;
  }

  async cancelarFatura(id: number, empresaId: string, motivo?: string): Promise<Fatura> {
    this.logger.log(`x [CANCELAR] Iniciando cancelamento da fatura ID: ${id}`);

    try {
      // x" MULTI-TENANCY: Validar empresa_id
      const fatura = await this.buscarFaturaPorId(id, empresaId);
      this.logger.log(
        `x [CANCELAR] Fatura encontrada: ${fatura.numero}, Status: ${fatura.status}`,
      );

      // Verificao direta do status em vez de usar o mtodo isPaga()
      if (fatura.status === StatusFatura.PAGA) {
        this.logger.log(`x [CANCELAR] Erro: Fatura j est paga`);
        throw new BadRequestException('No  possvel cancelar fatura j paga');
      }

      this.logger.log(`x [CANCELAR] Fatura no est paga, prosseguindo com cancelamento`);

      fatura.status = StatusFatura.CANCELADA;
      if (motivo) {
        fatura.observacoes = `${fatura.observacoes || ''}\n\nCancelada: ${motivo}`;
      }

      this.logger.log(`x [CANCELAR] Salvando fatura cancelada...`);
      const faturaAtualizada = await this.faturaRepository.save(fatura);
      await this.sincronizarStatusPropostaPelaFatura(
        faturaAtualizada,
        empresaId,
        undefined,
        'faturamento-cancelamento',
      );
      this.logger.log(`x [CANCELAR] Fatura cancelada com sucesso: ${faturaAtualizada.numero}`);

      return faturaAtualizada;
    } catch (error) {
      this.logger.error(`x [CANCELAR] Erro ao cancelar fatura ID ${id}: ${error.message}`);
      throw error;
    }
  }

  async excluirFatura(id: number, empresaId: string): Promise<Fatura> {
    this.logger.log(`x [EXCLUIR] Iniciando excluso da fatura ID: ${id}`);

    try {
      const fatura = await this.buscarFaturaPorId(id, empresaId);
      this.logger.log(`x [EXCLUIR] Fatura encontrada: ${fatura.numero}, Status: ${fatura.status}`);

      // Verificao direta do status em vez de usar o mtodo isPaga()
      if (fatura.status === StatusFatura.PAGA) {
        this.logger.log(`x [EXCLUIR] Erro: Fatura j est paga`);
        throw new BadRequestException('No  possvel excluir fatura j paga');
      }

      this.logger.log(`x [EXCLUIR] Fatura no est paga, prosseguindo com excluso`);

      // Marcar como inativa (excluso lgica) e cancelada
      const contratoIdOriginal = fatura.contratoId;
      fatura.ativo = false;
      fatura.status = StatusFatura.CANCELADA;
      fatura.observacoes = `${fatura.observacoes || ''}\n\nCancelada: Fatura excluda pelo usurio`;

      // Tambm limpar a relao com contrato para evitar problemas de integridade
      fatura.contratoId = null;

      this.logger.log(`x [EXCLUIR] Salvando fatura excluda...`);
      const faturaAtualizada = await this.faturaRepository.save(fatura);
      await this.sincronizarStatusPropostaPelaFatura(
        {
          ...faturaAtualizada,
          contratoId: contratoIdOriginal,
        } as Fatura,
        empresaId,
        undefined,
        'faturamento-cancelamento',
      );
      this.logger.log(`x [EXCLUIR] Fatura excluda com sucesso: ${faturaAtualizada.numero}`);

      return faturaAtualizada;
    } catch (error) {
      this.logger.error(`x [EXCLUIR] Erro ao excluir fatura ID ${id}: ${error.message}`);
      throw error;
    }
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

  async enviarFaturaPorEmail(
    faturaId: number,
    empresaId: string,
    emailDestinatario?: string,
  ): Promise<boolean> {
    try {
      const fatura = await this.buscarFaturaPorId(faturaId, empresaId);
      const cliente = await this.clienteRepository.findOne({
        where: { id: fatura.clienteId, empresaId },
      });

      if (!cliente) {
        throw new NotFoundException('Cliente da fatura nao encontrado');
      }

      const emailCliente = cliente.email?.trim();
      const emailDestino = emailDestinatario?.trim() || emailCliente;

      if (!emailDestino) {
        throw new BadRequestException('Cliente nao possui email cadastrado');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailDestino)) {
        throw new BadRequestException('Email de destinatario invalido');
      }

      const emailData = {
        to: emailDestino,
        subject: `Fatura ${fatura.numero} - Vencimento ${fatura.dataVencimento.toLocaleDateString('pt-BR')}`,
        html: this.gerarEmailFatura(fatura),
      };

      const sucesso = await this.emailService.enviarEmailGenerico(emailData);

      if (sucesso) {
        fatura.status = StatusFatura.ENVIADA;
        const faturaAtualizada = await this.faturaRepository.save(fatura);
        await this.sincronizarStatusPropostaPelaFatura(
          faturaAtualizada,
          empresaId,
          'aguardando_pagamento',
          'faturamento-email',
        );
        this.logger.log(`Fatura enviada por email: ${fatura.numero}`);
      }

      return sucesso;
    } catch (error) {
      this.logger.error(`Erro ao enviar fatura por email: ${error.message}`);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      return false;
    }
  }

  async sincronizarStatusPropostaPorFaturaId(
    faturaId: number,
    empresaId: string,
    contexto?: { correlationId?: string; origemId?: string; strict?: boolean },
  ): Promise<void> {
    try {
      const fatura = await this.buscarFaturaPorId(faturaId, empresaId);
      await this.sincronizarStatusPropostaPelaFatura(
        fatura,
        empresaId,
        undefined,
        'faturamento-recalculo',
        contexto,
      );
    } catch (error) {
      if (contexto?.strict) {
        throw error;
      }
      this.logger.warn(
        `Falha ao sincronizar proposta pela fatura ${faturaId}: ${error.message}`,
      );
    }
  }

  private mapStatusFaturaParaStatusProposta(status: StatusFatura): string | null {
    switch (status) {
      case StatusFatura.PAGA:
        return 'pago';
      case StatusFatura.CANCELADA:
        return 'contrato_assinado';
      case StatusFatura.ENVIADA:
      case StatusFatura.PENDENTE:
      case StatusFatura.PARCIALMENTE_PAGA:
      case StatusFatura.VENCIDA:
        return 'aguardando_pagamento';
      default:
        return null;
    }
  }

  private async sincronizarStatusPropostaPelaFatura(
    fatura: Fatura | null | undefined,
    empresaId: string,
    statusOverride?: string,
    source: string = 'faturamento',
    contexto?: { correlationId?: string; origemId?: string; strict?: boolean },
  ): Promise<void> {
    if (!fatura?.contratoId) {
      return;
    }

    const contratoComProposta =
      fatura.contrato?.propostaId
        ? fatura.contrato
        : await this.contratoRepository.findOne({
            where: { id: fatura.contratoId, empresa_id: empresaId },
          });

    const propostaId = contratoComProposta?.propostaId;
    if (!propostaId) {
      return;
    }

    const status = statusOverride || this.mapStatusFaturaParaStatusProposta(fatura.status);
    if (!status) {
      return;
    }

    const observacoes = `Sincronizacao via faturamento (${fatura.numero}) com status ${fatura.status}.`;
    try {
      await this.propostasService.atualizarStatus(
        propostaId,
        status,
        source,
        observacoes,
        undefined,
        empresaId,
        {
          correlationId: contexto?.correlationId,
          origemId: contexto?.origemId,
          entidade: 'fatura',
          entidadeId: fatura.id,
          numeroFatura: fatura.numero,
        },
      );
    } catch (error) {
      this.logger.warn(
        `Falha ao atualizar proposta ${propostaId} via faturamento: ${error.message}`,
      );
      await this.registrarAlertaStatusSincronizacaoDivergente({
        empresaId,
        faturaId: fatura.id,
        faturaNumero: fatura.numero,
        propostaId,
        statusFatura: fatura.status,
        statusPropostaDestino: status,
        erro: String(error?.message || error),
        source,
        correlationId: contexto?.correlationId,
        origemId: contexto?.origemId,
      });
      if (contexto?.strict) {
        throw error;
      }
    }
  }

  private async registrarAlertaStatusSincronizacaoDivergente(payload: {
    empresaId: string;
    faturaId: number;
    faturaNumero?: string;
    propostaId?: string | null;
    statusFatura: string;
    statusPropostaDestino: string;
    erro: string;
    source?: string;
    correlationId?: string;
    origemId?: string;
  }): Promise<void> {
    try {
      const referencia = `sync_status:fatura:${payload.faturaId}`;
      const auditoria = [
        {
          acao: 'gerado_automaticamente',
          origem: payload.source || 'faturamento',
          erro: payload.erro,
          timestamp: new Date().toISOString(),
        },
      ];

      await this.faturaRepository.manager.query(
        `
          INSERT INTO alertas_operacionais_financeiro (
            empresa_id,
            tipo,
            severidade,
            titulo,
            descricao,
            referencia,
            status,
            payload,
            auditoria,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2::alertas_operacionais_financeiro_tipo_enum,
            $3::alertas_operacionais_financeiro_severidade_enum,
            $4,
            $5,
            $6,
            'ativo'::alertas_operacionais_financeiro_status_enum,
            $7::jsonb,
            $8::jsonb,
            NOW(),
            NOW()
          )
        `,
        [
          payload.empresaId,
          'status_sincronizacao_divergente',
          'critical',
          'Divergencia de sincronizacao entre financeiro e vendas',
          `Falha ao sincronizar fatura ${payload.faturaNumero || payload.faturaId} para proposta.`,
          referencia,
          JSON.stringify({
            faturaId: payload.faturaId,
            faturaNumero: payload.faturaNumero || null,
            propostaId: payload.propostaId || null,
            statusFatura: payload.statusFatura,
            statusPropostaDestino: payload.statusPropostaDestino,
            erro: payload.erro,
            source: payload.source || 'faturamento',
            correlationId: payload.correlationId || null,
            origemId: payload.origemId || null,
          }),
          JSON.stringify(auditoria),
        ],
      );
    } catch (error) {
      this.logger.warn(
        `Falha ao registrar alerta de sincronizacao divergente (fatura=${payload.faturaId}): ${
          error?.message || error
        }`,
      );
    }
  }

  private async canLoadPropostaRelation(): Promise<boolean> {
    if (this.propostaRelationEnabled !== null) {
      return this.propostaRelationEnabled;
    }

    const rows: Array<{ column_name?: string }> = await this.faturaRepository.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'propostas'
          AND column_name = 'cliente'
        LIMIT 1
      `,
    );

    this.propostaRelationEnabled = Array.isArray(rows) && rows.length > 0;
    return this.propostaRelationEnabled;
  }

  private calcularValorTotalItens(itens: any[]): number {
    return itens.reduce((total, item) => total + this.calcularValorTotalItem(item), 0);
  }

  private calcularValorTotalItem(item: any): number {
    const subtotal = (item.quantidade || 0) * (item.valorUnitario || 0);
    const descontoPercentual = item.percentualDesconto
      ? (subtotal * item.percentualDesconto) / 100
      : 0;
    const descontoValor = item.valorDesconto || 0;

    const valorFinal = subtotal - descontoPercentual - descontoValor;

    // Evita valores negativos e limita a duas casas decimais
    return Math.max(Number(valorFinal.toFixed(2)), 0);
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
      PIX: 'pix',
      'Carto de Crdito': 'cartao_credito',
      Boleto: 'boleto',
      Transferncia: 'transferencia',
    };

    return mapeamento[formaPagamento] || 'pix';
  }

  private calcularDataVencimento(contrato: Contrato): string {
    const hoje = new Date();
    const vencimento = new Date(hoje);

    // Padro: 30 dias a partir de hoje
    vencimento.setDate(hoje.getDate() + 30);

    // Se o contrato tem condies de pagamento especficas
    if (contrato.condicoesPagamento?.diaVencimento) {
      vencimento.setDate(contrato.condicoesPagamento.diaVencimento);

      // Se o dia j passou neste ms, vencer no prximo ms
      if (vencimento < hoje) {
        vencimento.setMonth(vencimento.getMonth() + 1);
      }
    }

    return vencimento.toISOString().split('T')[0];
  }

  private gerarEmailFatura(fatura: Fatura): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50;">x" Nova Fatura Disponvel</h1>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalhes da Fatura</h3>
          <p><strong>Nmero:</strong> ${fatura.numero}</p>
          <p><strong>Valor:</strong> R$ ${fatura.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Vencimento:</strong> ${fatura.dataVencimento.toLocaleDateString('pt-BR')}</p>
          <p><strong>Descrio:</strong> ${fatura.descricao}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/faturas/${fatura.id}"
             style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            x" Pagar Fatura
          </a>
        </div>

        <p style="color: #666; font-size: 14px; text-align: center;">
          Este email foi enviado automaticamente pelo sistema ConectCRM.
        </p>
      </div>
    `;
  }
}
