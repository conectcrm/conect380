import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Fatura, FormaPagamento, StatusFatura, TipoFatura } from '../entities/fatura.entity';
import { ItemFatura } from '../entities/item-fatura.entity';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { Cliente } from '../../clientes/cliente.entity';
import { PropostasService } from '../../propostas/propostas.service';
import { CreateFaturaDto, UpdateFaturaDto, GerarFaturaAutomaticaDto } from '../dto/fatura.dto';
import { EmailIntegradoService } from '../../propostas/email-integrado.service';

export interface ResultadoEnvioFaturaEmail {
  enviado: boolean;
  simulado: boolean;
  motivo?: string;
  detalhes?: string;
}

export interface EnvioFaturaEmailOpcoes {
  email?: string;
  templateId?: string;
  assunto?: string;
  conteudo?: string;
}

export interface ResultadoCobrancaLoteItem {
  faturaId: number;
  numero?: string;
  statusOriginal?: StatusFatura;
  statusFinal?: StatusFatura;
  enviado: boolean;
  simulado: boolean;
  motivo?: string;
  detalhes?: string;
}

export interface ResultadoCobrancaLote {
  solicitadas: number;
  processadas: number;
  sucesso: number;
  simuladas: number;
  falhas: number;
  ignoradas: number;
  resultados: ResultadoCobrancaLoteItem[];
}

interface ItemCalculoFaturaInput {
  quantidade?: number;
  valorUnitario?: number;
  percentualDesconto?: number;
  valorDesconto?: number;
}

interface ResumoFinanceiroFatura {
  subtotalBrutoItens: number;
  descontoItens: number;
  subtotalLiquidoItens: number;
  descontoGlobal: number;
  baseCalculo: number;
  valorImpostos: number;
  percentualImpostos: number | null;
  valorTotal: number;
}

interface FaturaActorContext {
  id?: string;
  role?: string;
  permissions?: string[];
  permissoes?: string[];
}

interface PoliticaDocumentoFiscalResult {
  detalhes: Record<string, unknown> | null;
  auditoria?: {
    acao: string;
    motivo: string;
    alteracoes: Array<{
      campo: string;
      anterior: string | null;
      atual: string | null;
    }>;
  };
}

@Injectable()
export class FaturamentoService {
  private readonly logger = new Logger(FaturamentoService.name);
  private propostaRelationEnabled: boolean | null = null;
  private readonly statusElegiveisCobranca = new Set<StatusFatura>([
    StatusFatura.PENDENTE,
    StatusFatura.ENVIADA,
    StatusFatura.PARCIALMENTE_PAGA,
    StatusFatura.VENCIDA,
  ]);

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

  async criarFatura(
    createFaturaDto: CreateFaturaDto,
    empresaId: string,
    actor?: FaturaActorContext,
  ): Promise<Fatura> {
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
      const politicaDocumentoFiscalCriacao = this.aplicarPoliticaDocumentoFiscal(
        this.normalizarDetalhesTributarios(createFaturaDto.detalhesTributarios),
        {
          contexto: 'criacao',
          actor,
        },
      );
      const detalhesTributariosNormalizados = politicaDocumentoFiscalCriacao.detalhes;

      const resumoFinanceiro = this.calcularResumoFinanceiroFatura(createFaturaDto.itens, {
        valorDescontoGlobal: createFaturaDto.valorDesconto,
        valorImpostos: createFaturaDto.valorImpostos,
        percentualImpostos: createFaturaDto.percentualImpostos,
        detalhesTributarios: detalhesTributariosNormalizados,
      });

      // Criar fatura
      const metadadosIniciais = politicaDocumentoFiscalCriacao.auditoria
        ? this.appendAuditoriaOperacaoFatura(undefined, {
            acao: politicaDocumentoFiscalCriacao.auditoria.acao,
            origem: 'faturamento.documento_fiscal',
            usuarioId: actor?.id,
            motivo: politicaDocumentoFiscalCriacao.auditoria.motivo,
            alteracoes: politicaDocumentoFiscalCriacao.auditoria.alteracoes.map((item) => ({
              campo: item.campo,
              anterior: item.anterior,
              atual: item.atual,
            })),
          })
        : undefined;

      const fatura = this.faturaRepository.create({
        contratoId: createFaturaDto.contratoId,
        clienteId: createFaturaDto.clienteId,
        usuarioResponsavelId: createFaturaDto.usuarioResponsavelId,
        tipo: createFaturaDto.tipo,
        descricao: createFaturaDto.descricao,
        formaPagamentoPreferida: createFaturaDto.formaPagamentoPreferida,
        dataVencimento: createFaturaDto.dataVencimento,
        observacoes: createFaturaDto.observacoes,
        numero,
        valorTotal: resumoFinanceiro.valorTotal,
        valorPago: 0,
        valorDesconto: resumoFinanceiro.descontoGlobal,
        valorImpostos: resumoFinanceiro.valorImpostos,
        percentualImpostos: resumoFinanceiro.percentualImpostos,
        diasCarenciaJuros: this.normalizarNumeroInteiro(createFaturaDto.diasCarenciaJuros, 0),
        percentualJuros: this.normalizarPercentual(createFaturaDto.percentualJuros),
        percentualMulta: this.normalizarPercentual(createFaturaDto.percentualMulta),
        detalhesTributarios: detalhesTributariosNormalizados,
        metadados: metadadosIniciais as any,
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
      periodoCampo?: 'emissao' | 'vencimento';
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

    const campoPeriodo =
      filtros?.periodoCampo === 'vencimento' ? 'fatura.dataVencimento' : 'fatura.dataEmissao';

    if (filtros?.dataInicio) {
      query.andWhere(`${campoPeriodo} >= :dataInicio`, { dataInicio: filtros.dataInicio });
    }

    if (filtros?.dataFim) {
      query.andWhere(`${campoPeriodo} <= :dataFim`, { dataFim: filtros.dataFim });
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
      periodoCampo?: 'emissao' | 'vencimento';
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

      const campoPeriodo =
        filtros?.periodoCampo === 'vencimento' ? 'fatura.dataVencimento' : 'fatura.dataEmissao';

      if (filtros?.dataInicio) {
        qb.andWhere(`${campoPeriodo} >= :dataInicio`, { dataInicio: filtros.dataInicio });
      }

      if (filtros?.dataFim) {
        qb.andWhere(`${campoPeriodo} <= :dataFim`, { dataFim: filtros.dataFim });
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
    userId?: string,
    actor?: FaturaActorContext,
  ): Promise<Fatura> {
    // x" MULTI-TENANCY: Validar empresa_id
    const fatura = await this.buscarFaturaPorId(id, empresaId);
    const estadoAntes = this.criarSnapshotAuditoriaFatura(fatura);

    // Verificao direta do status em vez de usar o mtodo isPaga()
    if (fatura.status === StatusFatura.PAGA) {
      throw new BadRequestException('No  possvel alterar fatura j paga');
    }

    if (updateFaturaDto.descricao !== undefined) {
      fatura.descricao = updateFaturaDto.descricao;
    }

    if (updateFaturaDto.dataVencimento !== undefined) {
      fatura.dataVencimento = new Date(updateFaturaDto.dataVencimento);
    }

    if (updateFaturaDto.observacoes !== undefined) {
      fatura.observacoes = updateFaturaDto.observacoes;
    }

    if (updateFaturaDto.formaPagamentoPreferida !== undefined) {
      fatura.formaPagamentoPreferida = updateFaturaDto.formaPagamentoPreferida;
    }

    if (updateFaturaDto.diasCarenciaJuros !== undefined) {
      fatura.diasCarenciaJuros = this.normalizarNumeroInteiro(updateFaturaDto.diasCarenciaJuros, 0);
    }

    if (updateFaturaDto.percentualJuros !== undefined) {
      fatura.percentualJuros = this.normalizarPercentual(updateFaturaDto.percentualJuros);
    }

    if (updateFaturaDto.percentualMulta !== undefined) {
      fatura.percentualMulta = this.normalizarPercentual(updateFaturaDto.percentualMulta);
    }

    const politicaDocumentoFiscalAtualizacao =
      updateFaturaDto.detalhesTributarios !== undefined
        ? this.aplicarPoliticaDocumentoFiscal(
            this.normalizarDetalhesTributarios(updateFaturaDto.detalhesTributarios),
            {
              contexto: 'atualizacao',
              actor,
              detalhesAtuais: this.normalizarDetalhesTributarios(fatura.detalhesTributarios),
            },
          )
        : {
            detalhes: this.normalizarDetalhesTributarios(fatura.detalhesTributarios),
          };

    const detalhesTributariosAtualizados = politicaDocumentoFiscalAtualizacao.detalhes;

    if (updateFaturaDto.detalhesTributarios !== undefined) {
      fatura.detalhesTributarios = detalhesTributariosAtualizados;
    }

    // Se alterou itens, recalcular valor total
    if (updateFaturaDto.itens) {
      // Remover itens existentes
      await this.itemFaturaRepository.delete({ faturaId: id });

      // Criar novos itens
      const novosItens = updateFaturaDto.itens.map((item) =>
        this.itemFaturaRepository.create({
          ...item,
          faturaId: id,
          valorTotal: this.calcularValorTotalItem(item),
        }),
      );

      await this.itemFaturaRepository.save(novosItens);
    }

    const itensParaCalculo: ItemCalculoFaturaInput[] = (
      updateFaturaDto.itens || fatura.itens || []
    ).map((item) => ({
      quantidade: Number(item.quantidade || 0),
      valorUnitario: Number(item.valorUnitario || 0),
      percentualDesconto: Number(item.percentualDesconto || 0),
      valorDesconto: Number(item.valorDesconto || 0),
    }));

    const resumoFinanceiro = this.calcularResumoFinanceiroFatura(itensParaCalculo, {
      valorDescontoGlobal:
        updateFaturaDto.valorDesconto !== undefined
          ? updateFaturaDto.valorDesconto
          : Number(fatura.valorDesconto || 0),
      valorImpostos:
        updateFaturaDto.valorImpostos !== undefined
          ? updateFaturaDto.valorImpostos
          : Number(fatura.valorImpostos || 0),
      percentualImpostos:
        updateFaturaDto.percentualImpostos !== undefined
          ? updateFaturaDto.percentualImpostos
          : fatura.percentualImpostos,
      detalhesTributarios: detalhesTributariosAtualizados,
    });

    fatura.valorDesconto = resumoFinanceiro.descontoGlobal;
    fatura.valorImpostos = resumoFinanceiro.valorImpostos;
    fatura.percentualImpostos = resumoFinanceiro.percentualImpostos;
    fatura.valorTotal = resumoFinanceiro.valorTotal;

    const itensAuditoria =
      Array.isArray(updateFaturaDto.itens) && updateFaturaDto.itens.length > 0
        ? updateFaturaDto.itens.map((item) => ({
            valorTotal: this.calcularValorTotalItem(item),
          }))
        : fatura.itens;
    const estadoDepois = this.criarSnapshotAuditoriaFatura({
      ...fatura,
      itens: itensAuditoria as any,
    } as Fatura);
    const alteracoes = this.compararSnapshotsAuditoriaFatura(estadoAntes, estadoDepois);
    if (alteracoes.length > 0) {
      fatura.metadados = this.appendAuditoriaOperacaoFatura(fatura.metadados, {
        acao: 'fatura_atualizada',
        origem: 'faturamento.atualizacao',
        usuarioId: userId,
        alteracoes,
      }) as any;
    }

    if (politicaDocumentoFiscalAtualizacao.auditoria) {
      fatura.metadados = this.appendAuditoriaOperacaoFatura(fatura.metadados, {
        acao: politicaDocumentoFiscalAtualizacao.auditoria.acao,
        origem: 'faturamento.documento_fiscal',
        usuarioId: userId,
        motivo: politicaDocumentoFiscalAtualizacao.auditoria.motivo,
        alteracoes: politicaDocumentoFiscalAtualizacao.auditoria.alteracoes.map((item) => ({
          campo: item.campo,
          anterior: item.anterior,
          atual: item.atual,
        })),
      }) as any;
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

  async cancelarFatura(
    id: number,
    empresaId: string,
    motivo?: string,
    userId?: string,
  ): Promise<Fatura> {
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
      const motivoCancelamento = (motivo || '').trim() || 'Motivo nao informado';
      const responsavel = userId || 'sistema';
      fatura.observacoes = `${fatura.observacoes || ''}\n\nCancelada por ${responsavel}: ${motivoCancelamento}`.trim();
      fatura.metadados = this.appendAuditoriaOperacaoFatura(fatura.metadados, {
        acao: 'fatura_cancelada',
        origem: 'faturamento.cancelamento',
        usuarioId: responsavel,
        motivo: motivoCancelamento,
      }) as any;

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

  async excluirFatura(id: number, empresaId: string, userId?: string): Promise<Fatura> {
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
      const responsavel = userId || 'sistema';
      const motivoExclusao = `Fatura excluida por ${responsavel}`;
      fatura.observacoes = `${fatura.observacoes || ''}\n\nCancelada: ${motivoExclusao}`.trim();
      fatura.metadados = this.appendAuditoriaOperacaoFatura(fatura.metadados, {
        acao: 'fatura_excluida',
        origem: 'faturamento.exclusao',
        usuarioId: responsavel,
        motivo: motivoExclusao,
      }) as any;

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

  async gerarCobrancaEmLote(faturaIds: number[], empresaId: string): Promise<ResultadoCobrancaLote> {
    const idsValidos = Array.from(
      new Set(
        (Array.isArray(faturaIds) ? faturaIds : [])
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );

    if (!idsValidos.length) {
      throw new BadRequestException('Informe ao menos uma fatura valida para gerar cobranca');
    }

    const resultados: ResultadoCobrancaLoteItem[] = [];
    let sucesso = 0;
    let simuladas = 0;
    let falhas = 0;
    let ignoradas = 0;

    for (const faturaId of idsValidos) {
      try {
        const fatura = await this.buscarFaturaPorId(faturaId, empresaId);

        if (!this.statusElegiveisCobranca.has(fatura.status)) {
          ignoradas += 1;
          resultados.push({
            faturaId,
            numero: fatura.numero,
            statusOriginal: fatura.status,
            statusFinal: fatura.status,
            enviado: false,
            simulado: false,
            motivo: 'status_nao_elegivel',
            detalhes: `Status atual (${fatura.status}) nao permite cobranca automatica.`,
          });
          continue;
        }

        const envio = await this.enviarFaturaPorEmail(fatura.id, empresaId);
        const envioReal = envio.enviado && !envio.simulado;

        if (envioReal) {
          sucesso += 1;
        } else if (envio.enviado && envio.simulado) {
          simuladas += 1;
        } else {
          falhas += 1;
        }

        resultados.push({
          faturaId,
          numero: fatura.numero,
          statusOriginal: fatura.status,
          statusFinal: envioReal ? StatusFatura.ENVIADA : fatura.status,
          enviado: envio.enviado,
          simulado: envio.simulado,
          motivo: envio.motivo,
          detalhes: envio.detalhes,
        });
      } catch (error) {
        falhas += 1;
        const detalhes = this.obterMensagemErroCobranca(error);
        this.logger.warn(
          `Falha ao processar cobranca da fatura ${faturaId} (empresa=${empresaId}): ${detalhes}`,
        );
        resultados.push({
          faturaId,
          enviado: false,
          simulado: false,
          motivo: 'erro_processamento',
          detalhes,
        });
      }
    }

    return {
      solicitadas: Array.isArray(faturaIds) ? faturaIds.length : 0,
      processadas: resultados.length,
      sucesso,
      simuladas,
      falhas,
      ignoradas,
      resultados,
    };
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

  private obterMensagemErroCobranca(error: unknown): string {
    if (!error) {
      return 'Erro desconhecido ao gerar cobranca.';
    }
    if (typeof error === 'string') {
      return error;
    }

    const erroComMensagem = error as { message?: unknown; response?: { data?: unknown } };
    if (typeof erroComMensagem.message === 'string' && erroComMensagem.message.trim().length > 0) {
      return erroComMensagem.message;
    }

    const responseData = erroComMensagem.response?.data;
    if (typeof responseData === 'string' && responseData.trim().length > 0) {
      return responseData;
    }

    if (responseData && typeof responseData === 'object') {
      const mensagem = (responseData as { message?: unknown }).message;
      if (typeof mensagem === 'string' && mensagem.trim().length > 0) {
        return mensagem;
      }
      if (Array.isArray(mensagem)) {
        const primeira = mensagem.find((item) => typeof item === 'string' && item.trim().length > 0);
        if (primeira) {
          return primeira;
        }
      }
    }

    return 'Erro desconhecido ao gerar cobranca.';
  }

  async enviarFaturaPorEmail(
    faturaId: number,
    empresaId: string,
    opcoesEnvio?: string | EnvioFaturaEmailOpcoes,
  ): Promise<ResultadoEnvioFaturaEmail> {
    try {
      const fatura = await this.buscarFaturaPorId(faturaId, empresaId);
      const opcoesNormalizadas = this.normalizarOpcoesEnvioEmail(opcoesEnvio);
      const cliente = await this.clienteRepository.findOne({
        where: { id: fatura.clienteId, empresaId },
      });

      if (!cliente) {
        throw new NotFoundException('Cliente da fatura nao encontrado');
      }

      const emailCliente = cliente.email?.trim();
      const emailDestino = opcoesNormalizadas.email?.trim() || emailCliente;

      if (!emailDestino) {
        throw new BadRequestException('Cliente nao possui email cadastrado');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailDestino)) {
        throw new BadRequestException('Email de destinatario invalido');
      }

      const assuntoPadrao = `Fatura ${fatura.numero} - Vencimento ${this.formatDatePtBr(
        fatura.dataVencimento,
      )}`;
      const assunto = opcoesNormalizadas.assunto?.trim() || assuntoPadrao;
      const conteudoTemplate = opcoesNormalizadas.conteudo?.trim();

      const emailData = {
        to: emailDestino,
        subject: assunto,
        html: conteudoTemplate
          ? this.gerarEmailFaturaCustomizado(fatura, conteudoTemplate)
          : this.gerarEmailFaturaPadrao(fatura),
      };

      const envio = await this.emailService.enviarEmailGenericoDetalhado(emailData, empresaId);

      if (envio.sucesso && !envio.simulado) {
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

      if (envio.sucesso && envio.simulado) {
        this.logger.warn(
          `Envio simulado da fatura ${fatura.numero}. Motivo: ${envio.motivo || 'desconhecido'}`,
        );
      }

      if (opcoesNormalizadas.templateId) {
        this.logger.log(
          `Template aplicado no envio da fatura ${fatura.numero}: ${opcoesNormalizadas.templateId}`,
        );
      }

      return {
        enviado: envio.sucesso,
        simulado: envio.simulado,
        motivo: envio.motivo,
        detalhes: envio.detalhes,
      };
    } catch (error) {
      this.logger.error(`Erro ao enviar fatura por email: ${error.message}`);

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      return {
        enviado: false,
        simulado: false,
        motivo: 'erro_envio',
        detalhes: error instanceof Error ? error.message : String(error),
      };
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
      `,
    );

    const availableColumns = new Set(
      (Array.isArray(rows) ? rows : [])
        .map((row) => String(row?.column_name || '').trim())
        .filter(Boolean),
    );

    const hasClienteJson = availableColumns.has('cliente');
    const hasOportunidadeLink =
      availableColumns.has('oportunidade_id') || availableColumns.has('oportunidadeId');

    this.propostaRelationEnabled = hasClienteJson && hasOportunidadeLink;
    return this.propostaRelationEnabled;
  }

  private criarSnapshotAuditoriaFatura(fatura: Fatura): Record<string, string | number | null> {
    const itens = Array.isArray(fatura.itens) ? fatura.itens : [];
    const subtotalItens = Number(
      itens.reduce((total, item) => total + Number(item?.valorTotal || 0), 0).toFixed(2),
    );

    return {
      descricao: String(fatura.descricao || '').trim() || null,
      dataVencimento: this.formatarDataAuditoria(fatura.dataVencimento),
      formaPagamentoPreferida: fatura.formaPagamentoPreferida || null,
      valorTotal: Number(Number(fatura.valorTotal || 0).toFixed(2)),
      valorDesconto: Number(Number(fatura.valorDesconto || 0).toFixed(2)),
      valorImpostos: Number(Number(fatura.valorImpostos || 0).toFixed(2)),
      percentualImpostos:
        fatura.percentualImpostos === null || fatura.percentualImpostos === undefined
          ? null
          : Number(Number(fatura.percentualImpostos).toFixed(4)),
      diasCarenciaJuros: Number(fatura.diasCarenciaJuros || 0),
      percentualJuros: Number(Number(fatura.percentualJuros || 0).toFixed(4)),
      percentualMulta: Number(Number(fatura.percentualMulta || 0).toFixed(4)),
      quantidadeItens: Number(itens.length || 0),
      subtotalItens,
    };
  }

  private compararSnapshotsAuditoriaFatura(
    antes: Record<string, string | number | null>,
    depois: Record<string, string | number | null>,
  ): Array<{
    campo: string;
    anterior: string | number | null;
    atual: string | number | null;
  }> {
    const campos = Array.from(new Set([...Object.keys(antes), ...Object.keys(depois)]));
    const alteracoes: Array<{
      campo: string;
      anterior: string | number | null;
      atual: string | number | null;
    }> = [];

    for (const campo of campos) {
      const valorAntes = antes[campo] ?? null;
      const valorDepois = depois[campo] ?? null;
      const mudou =
        typeof valorAntes === 'number' && typeof valorDepois === 'number'
          ? Math.abs(valorAntes - valorDepois) > 0.0001
          : valorAntes !== valorDepois;

      if (mudou) {
        alteracoes.push({
          campo,
          anterior: valorAntes,
          atual: valorDepois,
        });
      }
    }

    return alteracoes;
  }

  private appendAuditoriaOperacaoFatura(
    metadadosAtual: unknown,
    payload: {
      acao: string;
      origem: string;
      usuarioId?: string;
      motivo?: string;
      alteracoes?: Array<{
        campo: string;
        anterior: string | number | null;
        atual: string | number | null;
      }>;
    },
  ): Record<string, unknown> {
    const metadadosBase =
      metadadosAtual && typeof metadadosAtual === 'object' && !Array.isArray(metadadosAtual)
        ? { ...(metadadosAtual as Record<string, unknown>) }
        : {};

    const historicoAtual = Array.isArray(metadadosBase.auditoriaFinanceira)
      ? [...(metadadosBase.auditoriaFinanceira as Array<Record<string, unknown>>)]
      : [];

    historicoAtual.push({
      timestamp: new Date().toISOString(),
      acao: payload.acao,
      origem: payload.origem,
      usuarioId: payload.usuarioId || null,
      motivo: payload.motivo || null,
      alteracoes: Array.isArray(payload.alteracoes) ? payload.alteracoes : [],
    });

    metadadosBase.auditoriaFinanceira = historicoAtual.slice(-120);
    return metadadosBase;
  }

  private formatarDataAuditoria(valor?: Date | string | null): string | null {
    if (!valor) return null;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return null;
    return data.toISOString().slice(0, 10);
  }

  private calcularResumoFinanceiroFatura(
    itens: ItemCalculoFaturaInput[],
    config?: {
      valorDescontoGlobal?: number;
      valorImpostos?: number;
      percentualImpostos?: number | null;
      detalhesTributarios?: Record<string, unknown> | null;
    },
  ): ResumoFinanceiroFatura {
    const listaItens = Array.isArray(itens) ? itens : [];

    const subtotalBrutoItens = listaItens.reduce((total, item) => {
      const quantidade = this.toFiniteNumber(item.quantidade, 0);
      const valorUnitario = this.toFiniteNumber(item.valorUnitario, 0);
      return total + quantidade * valorUnitario;
    }, 0);

    const descontoItens = listaItens.reduce((total, item) => {
      const subtotalItem =
        this.toFiniteNumber(item.quantidade, 0) * this.toFiniteNumber(item.valorUnitario, 0);
      const descontoPercentual =
        subtotalItem * (this.normalizarPercentual(item.percentualDesconto) / 100);
      const descontoValor = this.toFiniteNumber(item.valorDesconto, 0);
      return total + descontoPercentual + descontoValor;
    }, 0);

    const subtotalLiquidoItens = listaItens.reduce((total, item) => {
      return total + this.calcularValorTotalItem(item);
    }, 0);

    const descontoGlobal = Math.max(0, this.toFiniteNumber(config?.valorDescontoGlobal, 0));
    const baseCalculo = Math.max(subtotalLiquidoItens - descontoGlobal, 0);
    const percentualImpostosEntrada = this.normalizarPercentualNullable(config?.percentualImpostos);
    let valorImpostos = Math.max(0, this.toFiniteNumber(config?.valorImpostos, 0));
    const valorImpostosDetalhados = this.extrairValorImpostosDosDetalhesTributarios(
      config?.detalhesTributarios,
    );

    if (valorImpostos <= 0 && valorImpostosDetalhados > 0) {
      valorImpostos = this.roundMoney(valorImpostosDetalhados);
    }

    if (valorImpostos <= 0 && percentualImpostosEntrada !== null && percentualImpostosEntrada > 0) {
      valorImpostos = this.roundMoney(baseCalculo * (percentualImpostosEntrada / 100));
    }

    let percentualImpostos = percentualImpostosEntrada;
    if (percentualImpostos === null && valorImpostos > 0 && baseCalculo > 0) {
      percentualImpostos = this.normalizarPercentual((valorImpostos / baseCalculo) * 100);
    }

    const valorTotal = this.roundMoney(Math.max(baseCalculo + valorImpostos, 0));

    return {
      subtotalBrutoItens: this.roundMoney(subtotalBrutoItens),
      descontoItens: this.roundMoney(descontoItens),
      subtotalLiquidoItens: this.roundMoney(subtotalLiquidoItens),
      descontoGlobal: this.roundMoney(descontoGlobal),
      baseCalculo: this.roundMoney(baseCalculo),
      valorImpostos: this.roundMoney(valorImpostos),
      percentualImpostos,
      valorTotal,
    };
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

  private toFiniteNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private roundMoney(value: number): number {
    return Math.round((this.toFiniteNumber(value, 0) + Number.EPSILON) * 100) / 100;
  }

  private normalizarPercentual(value: unknown): number {
    const parsed = this.toFiniteNumber(value, 0);
    return Math.max(0, Math.min(100, Number(parsed.toFixed(4))));
  }

  private normalizarPercentualNullable(value: unknown): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    return this.normalizarPercentual(value);
  }

  private normalizarNumeroInteiro(value: unknown, fallback = 0): number {
    const parsed = this.toFiniteNumber(value, fallback);
    return Math.max(0, Math.trunc(parsed));
  }

  private aplicarPoliticaDocumentoFiscal(
    detalhesInput: Record<string, unknown> | null,
    options: {
      contexto: 'criacao' | 'atualizacao';
      actor?: FaturaActorContext;
      detalhesAtuais?: Record<string, unknown> | null;
    },
  ): PoliticaDocumentoFiscalResult {
    const detalhes = this.normalizarDetalhesTributarios(detalhesInput);
    if (!detalhes) {
      return { detalhes: null };
    }

    const documentoRaw = detalhes.documento;
    if (!documentoRaw || typeof documentoRaw !== 'object' || Array.isArray(documentoRaw)) {
      return { detalhes };
    }

    const documento = { ...(documentoRaw as Record<string, unknown>) };
    const tipoDocumento = String(documento.tipo || '')
      .trim()
      .toLowerCase();
    const tipoFiscal = tipoDocumento === 'nfe' || tipoDocumento === 'nfse';

    if (!tipoFiscal) {
      const documentoSanitizado = {
        ...documento,
        geracaoAutomatica: false,
        emissorEsperado: 'interno',
      };
      return {
        detalhes: {
          ...detalhes,
          documento: documentoSanitizado,
        },
      };
    }

    const statusFiscalAtual = this.extrairStatusFiscalDosDetalhes(options.detalhesAtuais);
    const documentoAnterior = this.extrairSnapshotDocumentoFiscal(options.detalhesAtuais);
    const geracaoAutomatica = this.normalizarBoolean(documento.geracaoAutomatica, true);
    const numeroDocumento = this.normalizarTextoDocumento(documento.numero);
    const serieDocumento = this.normalizarTextoDocumento(documento.serie);
    const chaveAcessoDocumento = this.normalizarTextoDocumento(documento.chaveAcesso);
    const motivoManual = this.normalizarTextoDocumento(
      documento.motivoEdicaoManual || documento.manualReason || documento.motivoManual,
    );

    const houveMudancaIdentificador =
      numeroDocumento !== documentoAnterior.numero ||
      serieDocumento !== documentoAnterior.serie ||
      chaveAcessoDocumento !== documentoAnterior.chaveAcesso;
    const houveMudancaModo = geracaoAutomatica !== documentoAnterior.geracaoAutomatica;
    const houveMudancaMotivoManual = motivoManual !== documentoAnterior.motivoEdicaoManual;
    const houveMudancaManual = houveMudancaIdentificador || houveMudancaModo || houveMudancaMotivoManual;

    if (
      statusFiscalAtual &&
      ['emitida', 'cancelada'].includes(statusFiscalAtual) &&
      (houveMudancaIdentificador || houveMudancaModo)
    ) {
      throw new BadRequestException(
        'Documento fiscal ja emitido/cancelado. Numero, serie, chave e modo de geracao nao podem ser alterados.',
      );
    }

    if (!geracaoAutomatica) {
      const podeManual = this.usuarioPodeGerenciarDocumentoFiscalManual(options.actor);
      if (!podeManual && (options.contexto === 'criacao' || houveMudancaManual)) {
        throw new ForbiddenException(
          'Modo manual para documento fiscal e restrito a perfis financeiro/admin.',
        );
      }

      const motivoManualEfetivo = motivoManual || documentoAnterior.motivoEdicaoManual;
      const motivoObrigatorio =
        options.contexto === 'criacao' || houveMudancaIdentificador || houveMudancaModo;

      if (motivoObrigatorio && !motivoManualEfetivo) {
        throw new BadRequestException(
          'Informe o motivo da edicao manual para numero/serie/chave do documento fiscal.',
        );
      }

      if (!numeroDocumento) {
        throw new BadRequestException(
          'Informe o numero do documento fiscal ou habilite a geracao automatica.',
        );
      }

      if (tipoDocumento === 'nfe') {
        const numeroDigitos = String(numeroDocumento).replace(/\D/g, '');
        const serieDigitos = String(serieDocumento || '').replace(/\D/g, '');
        const chaveDigitos = String(chaveAcessoDocumento || '').replace(/\D/g, '');

        if (!numeroDigitos || numeroDigitos.length > 9) {
          throw new BadRequestException('Para NF-e, o numero fiscal deve ter ate 9 digitos.');
        }

        if (serieDocumento && (!serieDigitos || serieDigitos.length > 3)) {
          throw new BadRequestException('Para NF-e, a serie fiscal deve ter ate 3 digitos.');
        }

        if (chaveAcessoDocumento && chaveDigitos.length !== 44) {
          throw new BadRequestException(
            'Para NF-e, a chave de acesso manual deve ter exatamente 44 digitos.',
          );
        }
      }

      if (!motivoManual && motivoManualEfetivo) {
        documento.motivoEdicaoManual = motivoManualEfetivo;
      }
    }

    const documentoSanitizado: Record<string, unknown> = {
      ...documento,
      modelo: this.normalizarTextoDocumento(documento.modelo),
      numero: geracaoAutomatica ? null : numeroDocumento,
      serie: geracaoAutomatica ? null : serieDocumento,
      chaveAcesso: geracaoAutomatica ? null : chaveAcessoDocumento,
      geracaoAutomatica,
      emissorEsperado: tipoDocumento === 'nfe' ? 'sefaz' : 'provedor_municipal',
      motivoEdicaoManual: geracaoAutomatica
        ? null
        : motivoManual || documentoAnterior.motivoEdicaoManual,
      manualUpdatedAt:
        geracaoAutomatica || !houveMudancaManual
          ? documento.manualUpdatedAt || null
          : new Date().toISOString(),
      manualUpdatedBy:
        geracaoAutomatica || !houveMudancaManual ? documento.manualUpdatedBy || null : options.actor?.id || null,
    };

    const alteracoesManual = this.compararCamposDocumentoFiscal(
      {
        numero: documentoAnterior.numero,
        serie: documentoAnterior.serie,
        chaveAcesso: documentoAnterior.chaveAcesso,
        geracaoAutomatica: documentoAnterior.geracaoAutomatica ? 'true' : 'false',
        motivoEdicaoManual: documentoAnterior.motivoEdicaoManual,
      },
      {
        numero: documentoSanitizado.numero ? String(documentoSanitizado.numero) : null,
        serie: documentoSanitizado.serie ? String(documentoSanitizado.serie) : null,
        chaveAcesso: documentoSanitizado.chaveAcesso
          ? String(documentoSanitizado.chaveAcesso)
          : null,
        geracaoAutomatica: documentoSanitizado.geracaoAutomatica ? 'true' : 'false',
        motivoEdicaoManual: documentoSanitizado.motivoEdicaoManual
          ? String(documentoSanitizado.motivoEdicaoManual)
          : null,
      },
    );

    const auditoria =
      (!geracaoAutomatica || alteracoesManual.length > 0) &&
      (options.contexto === 'atualizacao' || !geracaoAutomatica)
        ? {
            acao: geracaoAutomatica
              ? 'documento_fiscal_modo_automatico'
              : 'documento_fiscal_edicao_manual',
            motivo: geracaoAutomatica
              ? 'Modo automatico habilitado para documento fiscal.'
              : motivoManual || 'Edicao manual de documento fiscal.',
            alteracoes: alteracoesManual,
          }
        : undefined;

    return {
      detalhes: {
        ...detalhes,
        documento: documentoSanitizado,
      },
      auditoria,
    };
  }

  private extrairStatusFiscalDosDetalhes(
    detalhes?: Record<string, unknown> | null,
  ): string | null {
    const base = this.normalizarDetalhesTributarios(detalhes);
    if (!base) {
      return null;
    }
    const fiscalRaw = base.fiscal;
    if (!fiscalRaw || typeof fiscalRaw !== 'object' || Array.isArray(fiscalRaw)) {
      return null;
    }
    const status = String((fiscalRaw as Record<string, unknown>).status || '')
      .trim()
      .toLowerCase();
    return status || null;
  }

  private extrairSnapshotDocumentoFiscal(
    detalhes?: Record<string, unknown> | null,
  ): {
    numero: string | null;
    serie: string | null;
    chaveAcesso: string | null;
    geracaoAutomatica: boolean;
    motivoEdicaoManual: string | null;
  } {
    const base = this.normalizarDetalhesTributarios(detalhes);
    if (!base) {
      return {
        numero: null,
        serie: null,
        chaveAcesso: null,
        geracaoAutomatica: true,
        motivoEdicaoManual: null,
      };
    }

    const documentoRaw = base.documento;
    if (!documentoRaw || typeof documentoRaw !== 'object' || Array.isArray(documentoRaw)) {
      return {
        numero: null,
        serie: null,
        chaveAcesso: null,
        geracaoAutomatica: true,
        motivoEdicaoManual: null,
      };
    }

    const documento = documentoRaw as Record<string, unknown>;
    return {
      numero: this.normalizarTextoDocumento(documento.numero),
      serie: this.normalizarTextoDocumento(documento.serie),
      chaveAcesso: this.normalizarTextoDocumento(documento.chaveAcesso),
      geracaoAutomatica: this.normalizarBoolean(documento.geracaoAutomatica, true),
      motivoEdicaoManual: this.normalizarTextoDocumento(
        documento.motivoEdicaoManual || documento.manualReason || documento.motivoManual,
      ),
    };
  }

  private compararCamposDocumentoFiscal(
    anterior: Record<string, string | null>,
    atual: Record<string, string | null>,
  ): Array<{ campo: string; anterior: string | null; atual: string | null }> {
    const campos = Array.from(new Set([...Object.keys(anterior), ...Object.keys(atual)]));
    const alteracoes: Array<{ campo: string; anterior: string | null; atual: string | null }> = [];

    for (const campo of campos) {
      const valorAnterior = anterior[campo] ?? null;
      const valorAtual = atual[campo] ?? null;
      if (valorAnterior !== valorAtual) {
        alteracoes.push({
          campo: `documento.${campo}`,
          anterior: valorAnterior,
          atual: valorAtual,
        });
      }
    }

    return alteracoes;
  }

  private usuarioPodeGerenciarDocumentoFiscalManual(actor?: FaturaActorContext): boolean {
    const role = String(actor?.role || '')
      .trim()
      .toLowerCase();
    if (role === 'superadmin' || role === 'admin' || role === 'financeiro') {
      return true;
    }

    const permissoes = new Set(
      [...(Array.isArray(actor?.permissions) ? actor.permissions : []), ...(Array.isArray(actor?.permissoes) ? actor.permissoes : [])]
        .map((item) => String(item || '').trim().toLowerCase())
        .filter(Boolean),
    );

    return permissoes.has('admin.empresas.manage');
  }

  private normalizarBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'sim', 'yes'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'nao', 'no'].includes(normalized)) {
        return false;
      }
    }
    return fallback;
  }

  private normalizarTextoDocumento(value: unknown): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private normalizarDetalhesTributarios(
    value?: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    return value;
  }

  private extrairValorImpostosDosDetalhesTributarios(
    value?: Record<string, unknown> | null,
  ): number {
    const detalhes = this.normalizarDetalhesTributarios(value);
    if (!detalhes) {
      return 0;
    }

    const tributosRaw = detalhes.tributos;
    if (!tributosRaw || typeof tributosRaw !== 'object' || Array.isArray(tributosRaw)) {
      return 0;
    }

    const tributos = tributosRaw as Record<string, unknown>;
    const totalDireto = this.toFiniteNumber(tributos.total, 0);
    if (totalDireto > 0) {
      return this.roundMoney(totalDireto);
    }

    const totalAplicado = this.toFiniteNumber(tributos.valorImpostosAplicado, 0);
    if (totalAplicado > 0) {
      return this.roundMoney(totalAplicado);
    }

    const ajusteManual = this.toFiniteNumber(tributos.ajusteManual, 0);
    const itens = Array.isArray(tributos.itens) ? tributos.itens : [];
    const totalItens = itens.reduce((acc, item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return acc;
      }
      const valor = this.toFiniteNumber((item as Record<string, unknown>).valor, 0);
      return acc + Math.max(0, valor);
    }, 0);

    return this.roundMoney(Math.max(totalItens, 0) + Math.max(ajusteManual, 0));
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

  private mapearFormaPagamento(formaPagamento?: string): FormaPagamento {
    if (!formaPagamento) {
      return FormaPagamento.PIX;
    }

    const normalizado = formaPagamento
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    const mapeamento: Record<string, FormaPagamento> = {
      pix: FormaPagamento.PIX,
      cartao_credito: FormaPagamento.CARTAO_CREDITO,
      'cartao de credito': FormaPagamento.CARTAO_CREDITO,
      cartao_debito: FormaPagamento.CARTAO_DEBITO,
      'cartao de debito': FormaPagamento.CARTAO_DEBITO,
      boleto: FormaPagamento.BOLETO,
      transferencia: FormaPagamento.TRANSFERENCIA,
      dinheiro: FormaPagamento.DINHEIRO,
      a_combinar: FormaPagamento.A_COMBINAR,
      'a combinar': FormaPagamento.A_COMBINAR,
    };

    return mapeamento[normalizado] || FormaPagamento.PIX;
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

  private normalizarOpcoesEnvioEmail(
    opcoesEnvio?: string | EnvioFaturaEmailOpcoes,
  ): EnvioFaturaEmailOpcoes {
    if (!opcoesEnvio) {
      return {};
    }

    if (typeof opcoesEnvio === 'string') {
      return { email: opcoesEnvio };
    }

    return opcoesEnvio;
  }

  private getFaturamentoPublicUrl(faturaId: number): string {
    const frontendBaseUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');
    const faturamentoPath = `/financeiro/faturamento?faturaId=${faturaId}`;
    return frontendBaseUrl ? `${frontendBaseUrl}${faturamentoPath}` : faturamentoPath;
  }

  private gerarEmailFaturaPadrao(fatura: Fatura): string {
    const urlFatura = this.getFaturamentoPublicUrl(fatura.id);
    const dataVencimentoFormatada = this.formatDatePtBr(fatura.dataVencimento);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2c3e50;">Nova Fatura Disponivel</h1>

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Detalhes da Fatura</h3>
          <p><strong>Numero:</strong> ${fatura.numero}</p>
          <p><strong>Valor:</strong> R$ ${fatura.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p><strong>Vencimento:</strong> ${dataVencimentoFormatada}</p>
          <p><strong>Descricao:</strong> ${fatura.descricao}</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${urlFatura}"
             style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Acessar Fatura
          </a>
        </div>

        <p style="color: #666; font-size: 14px; text-align: center;">
          Este email foi enviado automaticamente pelo sistema ConectCRM.
        </p>
      </div>
    `;
  }

  private gerarEmailFaturaCustomizado(fatura: Fatura, conteudo: string): string {
    const urlFatura = this.getFaturamentoPublicUrl(fatura.id);
    const conteudoSeguro = this.escapeHtml(conteudo).replace(/\r?\n/g, '<br />');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="line-height: 1.6; color: #2c3e50;">
          ${conteudoSeguro}
        </div>

        <div style="text-align: center; margin: 32px 0 12px;">
          <a href="${urlFatura}"
             style="background-color: #28a745; color: white; padding: 14px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Acessar Fatura
          </a>
        </div>

        <p style="color: #666; font-size: 13px; text-align: center;">
          Este email foi enviado automaticamente pelo sistema ConectCRM.
        </p>
      </div>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatDatePtBr(value: Date | string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('pt-BR');
  }
}
