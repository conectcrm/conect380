import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Fatura, FormaPagamento, StatusFatura, TipoFatura } from '../entities/fatura.entity';
import { ItemFatura } from '../entities/item-fatura.entity';
import { Pagamento, StatusPagamento, TipoPagamento } from '../entities/pagamento.entity';
import { Contrato } from '../../contratos/entities/contrato.entity';
import { Cliente } from '../../clientes/cliente.entity';
import { EmpresaConfig } from '../../empresas/entities/empresa-config.entity';
import { PropostasService } from '../../propostas/propostas.service';
import { MercadoPagoService } from '../../mercado-pago/mercado-pago.service';
import {
  CreateFaturaDto,
  UpdateFaturaDto,
  GerarFaturaAutomaticaDto,
  TipoDocumentoFinanceiro,
} from '../dto/fatura.dto';
import {
  EmailEntregaDiagnostico,
  EmailIntegradoService,
} from '../../propostas/email-integrado.service';
import { getFinanceiroFeatureFlags } from '../financeiro-feature-flags';

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

export interface NumeroDocumentoFinanceiroGerado {
  tipoDocumento: TipoDocumentoFinanceiro;
  prefixo: string;
  ano: number;
  sequencial: number;
  numero: string;
}

export interface LinkPagamentoFaturaGerado {
  faturaId: number;
  numeroFatura: string;
  provider: 'mercado_pago';
  referenciaGateway: string;
  preferenceId?: string;
  link: string;
  expiraEm: string;
}

export interface PdfFaturaGerado {
  buffer: Buffer;
  filename: string;
}

export type StatusProntidaoCobranca = 'ok' | 'alerta' | 'bloqueio';

export interface CanalProntidaoCobranca {
  operacional: boolean;
  simulado: boolean;
  status: StatusProntidaoCobranca;
  detalhe: string;
  bloqueios: string[];
  alertas: string[];
}

export interface ProntidaoCobranca {
  statusGeral: StatusProntidaoCobranca;
  prontoParaCobrancaOnline: boolean;
  prontoParaCobrancaPorEmail: boolean;
  recomendacaoOperacional: string;
  gateway: CanalProntidaoCobranca;
  email: CanalProntidaoCobranca;
  geradoEm: string;
}

type GatewayPagamentoConfigSource = 'tenant' | 'env' | 'default';

interface GatewayPagamentoRuntimeConfig {
  provider: string | null;
  providerSource: GatewayPagamentoConfigSource;
  accessToken: string | null;
  accessTokenSource: GatewayPagamentoConfigSource;
  webhookSecret: string | null;
  webhookSecretSource: GatewayPagamentoConfigSource;
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
  private readonly financeiroFeatureFlags = getFinanceiroFeatureFlags();
  private propostaRelationEnabled: boolean | null = null;
  private readonly statusElegiveisCobranca = new Set<StatusFatura>([
    StatusFatura.PENDENTE,
    StatusFatura.ENVIADA,
    StatusFatura.PARCIALMENTE_PAGA,
    StatusFatura.VENCIDA,
  ]);
  private readonly tiposDocumentoFinanceiro = new Set<TipoDocumentoFinanceiro>([
    'fatura',
    'recibo',
    'nfse',
    'nfe',
    'folha_pagamento',
    'outro',
  ]);
  private readonly tiposDocumentoFinanceiroBloqueadosNoFaturamento = new Set<TipoDocumentoFinanceiro>([
    'folha_pagamento',
  ]);
  private readonly tiposDocumentoFiscal = new Set<TipoDocumentoFinanceiro>(['nfe', 'nfse']);
  private readonly formasPagamentoCobrancaOnline = new Set<FormaPagamento>([
    FormaPagamento.PIX,
    FormaPagamento.CARTAO_CREDITO,
    FormaPagamento.CARTAO_DEBITO,
    FormaPagamento.BOLETO,
  ]);
  private readonly mercadoPagoPaymentTypesSuportados = [
    'credit_card',
    'debit_card',
    'prepaid_card',
    'ticket',
    'account_money',
    'bank_transfer',
    'atm',
  ] as const;
  private readonly prefixosNumeroDocumentoFinanceiro: Record<string, string> = {
    fatura: 'FAT',
    recibo: 'REC',
    folha_pagamento: 'FPG',
    outro: 'DOC',
  };
  private readonly camposOrdenacaoFaturas: Record<string, string> = {
    createdAt: 'fatura.createdAt',
    dataVencimento: 'fatura.dataVencimento',
    valorTotal: 'fatura.valorTotal',
    numero: 'fatura.numero',
  };

  constructor(
    @InjectRepository(Fatura)
    private faturaRepository: Repository<Fatura>,
    @InjectRepository(ItemFatura)
    private itemFaturaRepository: Repository<ItemFatura>,
    @InjectRepository(Pagamento)
    private pagamentoRepository: Repository<Pagamento>,
    @InjectRepository(Contrato)
    private contratoRepository: Repository<Contrato>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    private propostasService: PropostasService,
    private emailService: EmailIntegradoService,
    @Optional()
    @Inject(forwardRef(() => MercadoPagoService))
    private readonly mercadoPagoService?: MercadoPagoService,
    @Optional()
    @InjectRepository(EmpresaConfig)
    private readonly empresaConfigRepository?: Repository<EmpresaConfig>,
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
      const formaPagamentoPreferida = this.validarFormaPagamentoDisponivel(
        createFaturaDto.formaPagamentoPreferida,
        'criacao de fatura',
      );

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
        formaPagamentoPreferida,
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

    const campoOrdenacao = this.resolverCampoOrdenacaoFaturas(sortBy);
    const direcaoOrdenacao: 'ASC' | 'DESC' = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const [faturas, total] = await queryBuilder
      .orderBy(campoOrdenacao, direcaoOrdenacao)
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

  async gerarPdfFatura(id: number, empresaId: string): Promise<PdfFaturaGerado> {
    const fatura = await this.buscarFaturaPorId(id, empresaId);
    const itens = Array.isArray(fatura.itens) ? fatura.itens : [];
    const valorTotal = this.toFiniteNumberPdf(fatura.valorTotal);
    const valorPago = this.toFiniteNumberPdf(fatura.valorPago);
    const valorAberto = Math.max(valorTotal - valorPago, 0);
    const clienteNome = this.escapeHtml(String(fatura.cliente?.nome || fatura.clienteId || '-'));
    const clienteEmail = this.escapeHtml(String(fatura.cliente?.email || '-'));
    const responsavel = this.escapeHtml(
      String((fatura as any)?.usuarioResponsavel?.nome || (fatura as any)?.usuarioResponsavel?.name || '-'),
    );
    const descricao = this.escapeHtml(String(fatura.descricao || '-'));
    const observacoes = this.escapeHtml(String(fatura.observacoes || '-'));

    const itensHtml =
      itens.length > 0
        ? itens
            .map((item, index) => {
              const quantidade = this.toFiniteNumberPdf(item.quantidade);
              const valorUnitario = this.toFiniteNumberPdf(item.valorUnitario);
              const valorItemTotal = this.toFiniteNumberPdf(item.valorTotal);
              const unidade = this.escapeHtml(String(item.unidade || 'un'));
              const descricaoItem = this.escapeHtml(String(item.descricao || `Item ${index + 1}`));

              return `
                <tr>
                  <td>${descricaoItem}</td>
                  <td style="text-align:center;">${quantidade.toLocaleString('pt-BR')}</td>
                  <td style="text-align:center;">${unidade}</td>
                  <td style="text-align:right;">${this.formatCurrencyPdf(valorUnitario)}</td>
                  <td style="text-align:right;">${this.formatCurrencyPdf(valorItemTotal)}</td>
                </tr>
              `;
            })
            .join('')
        : `<tr><td colspan="5" style="text-align:center;color:#6b7280;">Nenhum item informado.</td></tr>`;

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; font-size: 12px; }
            .header { border-bottom: 2px solid #159a9c; padding-bottom: 10px; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: bold; color: #0f172a; margin: 0; }
            .subtitle { margin-top: 4px; color: #475569; }
            .grid { display: flex; gap: 10px; margin-bottom: 12px; }
            .card { flex: 1; border: 1px solid #dce8ec; border-radius: 8px; padding: 8px; }
            .label { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; }
            .value { margin-top: 4px; font-size: 12px; font-weight: 600; color: #0f172a; }
            .section { margin-top: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e2e8f0; padding: 6px; }
            th { background: #f8fafc; text-align: left; font-size: 11px; }
            .footer { margin-top: 14px; color: #64748b; font-size: 10px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">Fatura ${this.escapeHtml(String(fatura.numero || id))}</p>
            <p class="subtitle">
              Emissao: ${this.formatDatePtBr(fatura.dataEmissao)} | Vencimento: ${this.formatDatePtBr(fatura.dataVencimento)}
            </p>
          </div>

          <div class="grid">
            <div class="card">
              <div class="label">Cliente</div>
              <div class="value">${clienteNome}</div>
              <div style="margin-top:2px;color:#475569;">${clienteEmail}</div>
            </div>
            <div class="card">
              <div class="label">Status</div>
              <div class="value">${this.escapeHtml(String(fatura.status || '-'))}</div>
              <div style="margin-top:2px;color:#475569;">Responsavel: ${responsavel}</div>
            </div>
            <div class="card">
              <div class="label">Totais</div>
              <div class="value">Total: ${this.formatCurrencyPdf(valorTotal)}</div>
              <div style="margin-top:2px;color:#475569;">Pago: ${this.formatCurrencyPdf(valorPago)} | Aberto: ${this.formatCurrencyPdf(valorAberto)}</div>
            </div>
          </div>

          <div class="section">
            <div class="label">Descricao</div>
            <div class="value" style="font-weight:500;">${descricao}</div>
          </div>

          <div class="section">
            <div class="label">Itens da fatura</div>
            <table>
              <thead>
                <tr>
                  <th>Descricao</th>
                  <th style="text-align:center;">Qtd</th>
                  <th style="text-align:center;">Unidade</th>
                  <th style="text-align:right;">Valor unit.</th>
                  <th style="text-align:right;">Valor total</th>
                </tr>
              </thead>
              <tbody>
                ${itensHtml}
              </tbody>
            </table>
          </div>

          <div class="section">
            <div class="label">Observacoes</div>
            <div style="margin-top:4px;">${observacoes}</div>
          </div>

          <div class="footer">
            Documento gerado automaticamente pelo modulo financeiro ConectCRM em ${this.formatDatePtBr(new Date())}.
          </div>
        </body>
      </html>
    `;

    const buffer = await this.gerarPdfBufferFromHtml(html);
    const numeroArquivo = this.sanitizarComponenteArquivoPdf(String(fatura.numero || id));

    return {
      buffer,
      filename: `fatura-${numeroArquivo}.pdf`,
    };
  }

  async gerarNumeroDocumentoFinanceiro(
    empresaId: string,
    tipoDocumentoInput: TipoDocumentoFinanceiro,
    anoReferencia?: number,
  ): Promise<NumeroDocumentoFinanceiroGerado> {
    const tipoDocumento = this.normalizarTipoDocumentoFinanceiro(tipoDocumentoInput);
    if (this.tiposDocumentoFiscal.has(tipoDocumento)) {
      throw new BadRequestException(
        'Para NF-e/NFS-e, use o fluxo de emissao fiscal automatica (SEFAZ/provedor municipal).',
      );
    }

    const anoAtual = new Date().getFullYear();
    const ano =
      typeof anoReferencia === 'number' && Number.isFinite(anoReferencia)
        ? Math.trunc(anoReferencia)
        : anoAtual;
    if (ano < 2000 || ano > anoAtual + 5) {
      throw new BadRequestException('Ano de referencia invalido para geracao do documento.');
    }

    const prefixo = this.obterPrefixoDocumentoFinanceiro(tipoDocumento);
    const prefixoNumero = `${prefixo}-${ano}-`;
    const numerosExistentes = await this.faturaRepository
      .createQueryBuilder('fatura')
      .select(`"fatura"."detalhesTributarios"->'documento'->>'numero'`, 'numero')
      .where('fatura.empresaId = :empresaId', { empresaId })
      .andWhere('fatura.ativo = :ativo', { ativo: true })
      .andWhere(`"fatura"."detalhesTributarios" IS NOT NULL`)
      .andWhere(`"fatura"."detalhesTributarios"->'documento'->>'tipo' = :tipoDocumento`, {
        tipoDocumento,
      })
      .andWhere(`"fatura"."detalhesTributarios"->'documento'->>'numero' LIKE :prefixoNumero`, {
        prefixoNumero: `${prefixoNumero}%`,
      })
      .andWhere(`EXTRACT(YEAR FROM fatura."createdAt") = :ano`, { ano })
      .orderBy('fatura.id', 'DESC')
      .limit(2000)
      .getRawMany<{ numero?: string | null }>();

    const maxSequencial = numerosExistentes.reduce((acc, row) => {
      const numero = String(row?.numero || '').trim();
      if (!numero.startsWith(prefixoNumero)) {
        return acc;
      }
      const trechoSequencial = numero.slice(prefixoNumero.length);
      if (!/^\d+$/.test(trechoSequencial)) {
        return acc;
      }
      const valor = Number.parseInt(trechoSequencial, 10);
      if (!Number.isFinite(valor)) {
        return acc;
      }
      return Math.max(acc, valor);
    }, 0);

    let sequencial = maxSequencial + 1;
    let numero = `${prefixoNumero}${String(sequencial).padStart(6, '0')}`;

    // Mitiga colisao quando ha concorrencia de geracao simultanea.
    while (
      await this.existeNumeroDocumentoFinanceiro(empresaId, tipoDocumento, numero, ano)
    ) {
      sequencial += 1;
      numero = `${prefixoNumero}${String(sequencial).padStart(6, '0')}`;
    }

    return {
      tipoDocumento,
      prefixo,
      ano,
      sequencial,
      numero,
    };
  }

  async gerarLinkPagamentoFatura(
    faturaId: number,
    empresaId: string,
    contexto?: {
      frontendBaseUrl?: string;
      backendBaseUrl?: string;
    },
  ): Promise<LinkPagamentoFaturaGerado> {
    if (!this.mercadoPagoService) {
      throw new BadRequestException(
        'Gateway de cobranca indisponivel no momento. Configure o Mercado Pago para gerar links.',
      );
    }

    const gatewayRuntime = await this.resolverGatewayPagamentoRuntime(empresaId);
    const providerNormalizado = gatewayRuntime.provider;
    if (providerNormalizado && providerNormalizado !== 'mercadopago') {
      throw new BadRequestException(
        `Provider de cobranca "${providerNormalizado}" ainda nao e suportado neste estagio. Configure "mercadopago" para gerar links online.`,
      );
    }

    const fatura = await this.buscarFaturaPorId(faturaId, empresaId);
    if (fatura.status === StatusFatura.CANCELADA) {
      throw new BadRequestException('Nao e possivel gerar link para fatura cancelada.');
    }
    if (fatura.status === StatusFatura.PAGA) {
      throw new BadRequestException('Fatura ja esta paga. Nao e necessario gerar novo link.');
    }
    const formaPagamentoCobrancaOnline = this.resolverFormaPagamentoCobrancaOnline(
      fatura.formaPagamentoPreferida,
    );

    const cliente = await this.clienteRepository.findOne({
      where: { id: fatura.clienteId, empresaId },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente da fatura nao encontrado.');
    }

    const emailCliente = String(cliente.email || '').trim();
    if (!emailCliente) {
      throw new BadRequestException('Cliente sem email cadastrado para envio/cobranca digital.');
    }

    const nomeCliente = String(cliente.nome || 'Cliente').trim() || 'Cliente';
    const [primeiroNome, ...sobrenomePartes] = nomeCliente.split(/\s+/).filter(Boolean);
    const sobrenome = sobrenomePartes.join(' ') || '-';

    const mockEnabled = this.isTruthy(process.env.MERCADO_PAGO_MOCK);
    const frontendBaseUrl = this.resolverBaseUrlPagamento({
      configurada: process.env.FRONTEND_URL || process.env.APP_FRONTEND_URL,
      contexto: contexto?.frontendBaseUrl,
      fallback: 'https://conect360.com',
      tipo: 'frontend',
      bloquearLocalPrivado: !mockEnabled,
    });
    const backendBaseUrl = this.resolverBaseUrlPagamento({
      configurada: process.env.WEBHOOK_BASE_URL || process.env.BACKEND_URL || process.env.API_URL,
      contexto: contexto?.backendBaseUrl,
      fallback: 'http://localhost:3001',
      tipo: 'backend',
      bloquearLocalPrivado: !mockEnabled,
    });

    if (!mockEnabled && this.isLocalOrPrivateUrl(frontendBaseUrl)) {
      throw new BadRequestException(
        'Link de pagamento exige URL publica no retorno. Configure FRONTEND_URL com dominio HTTPS publico.',
      );
    }

    if (!mockEnabled && this.isLocalOrPrivateUrl(backendBaseUrl)) {
      this.logger.warn(
        `WEBHOOK_BASE_URL local/privada (${backendBaseUrl}) pode impedir callbacks do Mercado Pago. Configure WEBHOOK_BASE_URL publico.`,
      );
    }

    const expiraEmDate = this.calcularDataExpiracaoCobranca(fatura.dataVencimento);
    const expiraEm = expiraEmDate.toISOString();
    const referenciaGateway = `fatura:${empresaId}:${fatura.id}`;
    const accessTokenOverride =
      gatewayRuntime.accessTokenSource === 'tenant' ? gatewayRuntime.accessToken : null;

    const preference = await this.mercadoPagoService.createPreference({
      items: [
        {
          id: String(fatura.id),
          title: `Fatura ${fatura.numero}`,
          currency_id: 'BRL',
          quantity: 1,
          unit_price: Number(fatura.valorTotal),
        },
      ],
      payer: {
        name: primeiroNome || 'Cliente',
        surname: sobrenome,
        email: emailCliente,
      },
      back_urls: {
        success: `${frontendBaseUrl}/faturamento?status=success&fatura=${fatura.id}`,
        failure: `${frontendBaseUrl}/faturamento?status=failure&fatura=${fatura.id}`,
        pending: `${frontendBaseUrl}/faturamento?status=pending&fatura=${fatura.id}`,
      },
      auto_return: 'approved',
      payment_methods: this.construirRestricoesPagamentoMercadoPago(
        formaPagamentoCobrancaOnline,
      ),
      notification_url: `${backendBaseUrl}/mercadopago/webhooks`,
      statement_descriptor: 'ConectCRM',
      external_reference: referenciaGateway,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: expiraEm,
    }, {
      accessTokenOverride,
    });

    const link = String(preference?.init_point || preference?.sandbox_init_point || '').trim();
    if (!link) {
      throw new BadRequestException('Gateway nao retornou URL de pagamento para esta cobranca.');
    }

    fatura.linkPagamento = link;
    fatura.formaPagamentoPreferida = formaPagamentoCobrancaOnline;
    fatura.metadados = {
      ...(fatura.metadados || {}),
      gateway: 'mercadopago',
      transactionId: String(preference?.id || referenciaGateway),
      paymentMethod: formaPagamentoCobrancaOnline,
    };
    await this.faturaRepository.save(fatura);
    await this.registrarPagamentoPendentePorLink({
      empresaId,
      fatura,
      referenciaGateway,
      linkPagamento: link,
      preferenceId: preference?.id ? String(preference.id) : undefined,
    });

    return {
      faturaId: fatura.id,
      numeroFatura: fatura.numero,
      provider: 'mercado_pago',
      referenciaGateway,
      preferenceId: preference?.id ? String(preference.id) : undefined,
      link,
      expiraEm,
    };
  }

  async obterProntidaoCobranca(empresaId: string): Promise<ProntidaoCobranca> {
    const gatewayRuntime = await this.resolverGatewayPagamentoRuntime(empresaId);
    const gateway = this.obterDiagnosticoGatewayCobranca(gatewayRuntime);
    const email = await this.obterDiagnosticoEmailCobranca(empresaId);
    const recomendacaoOperacional =
      'Fluxo recomendado: enviar a fatura ao cliente e registrar o recebimento em "Registrar Pgto" apos a confirmacao bancaria.';

    const statusGeral: StatusProntidaoCobranca = !email.operacional
      ? 'bloqueio'
      : gateway.status !== 'ok' || email.status !== 'ok'
        ? 'alerta'
        : 'ok';

    return {
      statusGeral,
      prontoParaCobrancaOnline: gateway.operacional,
      prontoParaCobrancaPorEmail: email.operacional,
      recomendacaoOperacional,
      gateway,
      email,
      geradoEm: new Date().toISOString(),
    };
  }

  private obterDiagnosticoGatewayCobranca(
    gatewayRuntime: GatewayPagamentoRuntimeConfig,
  ): CanalProntidaoCobranca {
    const bloqueios: string[] = [];
    const alertas: string[] = [];
    const ambienteProducao = this.isProductionRuntime();
    const tokenConfigurado = Boolean(gatewayRuntime.accessToken);
    const webhookSecretConfigurado = Boolean(gatewayRuntime.webhookSecret);
    const mockEnabled = this.isTruthy(process.env.MERCADO_PAGO_MOCK);
    const gatewayDisponivel = Boolean(this.mercadoPagoService);
    const providerNormalizado = gatewayRuntime.provider;

    if (!gatewayDisponivel) {
      alertas.push('Servico de gateway de pagamento nao carregado no backend.');
      return {
        operacional: false,
        simulado: false,
        status: 'alerta',
        detalhe: 'Gateway de pagamento indisponivel neste ambiente.',
        bloqueios,
        alertas,
      };
    }

    if (providerNormalizado && providerNormalizado !== 'mercadopago') {
      bloqueios.push(
        `Provider "${providerNormalizado}" configurado para a empresa, mas o backend suporta apenas "mercadopago" neste estagio.`,
      );
      return {
        operacional: false,
        simulado: false,
        status: 'bloqueio',
        detalhe:
          'Gateway da empresa nao suportado no fluxo atual. Ajuste o provider para "mercadopago".',
        bloqueios,
        alertas,
      };
    }

    if (tokenConfigurado) {
      if (gatewayRuntime.accessTokenSource === 'env') {
        alertas.push(
          'Credencial de gateway usando fallback global do ambiente (.env). Recomendado configurar token por empresa.',
        );
      }

      if (ambienteProducao && !webhookSecretConfigurado) {
        alertas.push(
          gatewayRuntime.webhookSecretSource === 'env'
            ? 'MERCADO_PAGO_WEBHOOK_SECRET nao configurado em producao para callbacks de pagamento.'
            : 'Webhook secret da empresa nao configurado para callbacks de pagamento em producao.',
        );
      }

      return {
        operacional: true,
        simulado: false,
        status: alertas.length > 0 ? 'alerta' : 'ok',
        detalhe:
          alertas.length > 0
            ? 'Gateway online ativo, porem com alertas de configuracao complementar.'
            : gatewayRuntime.accessTokenSource === 'tenant'
              ? 'Gateway online configurado com credencial da empresa para cobranca real.'
              : 'Gateway online configurado com credencial global do ambiente.',
        bloqueios,
        alertas,
      };
    }

    if (mockEnabled && !ambienteProducao) {
      alertas.push('MERCADO_PAGO_MOCK ativo sem token real. Cobranca online em modo simulado.');
      return {
        operacional: false,
        simulado: true,
        status: 'alerta',
        detalhe: 'Gateway em modo simulado. Configure token real para cobranca online.',
        bloqueios,
        alertas,
      };
    }

    alertas.push(
      'Token do Mercado Pago nao configurado para gerar cobranca online (empresa e ambiente).',
    );
    return {
      operacional: false,
      simulado: false,
      status: 'alerta',
      detalhe:
        'Gateway online indisponivel. Configure o token no Financeiro da empresa ou MERCADO_PAGO_ACCESS_TOKEN no ambiente.',
      bloqueios,
      alertas,
    };
  }

  private async obterDiagnosticoEmailCobranca(empresaId: string): Promise<CanalProntidaoCobranca> {
    const diagnosticoEmail: EmailEntregaDiagnostico =
      await this.emailService.obterDiagnosticoEntregaEmail(empresaId);
    const bloqueios: string[] = [];
    const alertas: string[] = [];

    if (diagnosticoEmail.status === 'bloqueio') {
      bloqueios.push(diagnosticoEmail.detalhe);
    }
    if (diagnosticoEmail.status === 'alerta') {
      alertas.push(diagnosticoEmail.detalhe);
    }

    return {
      operacional: diagnosticoEmail.operacional,
      simulado: diagnosticoEmail.simulado,
      status: diagnosticoEmail.status,
      detalhe: diagnosticoEmail.detalhe,
      bloqueios,
      alertas,
    };
  }

  private isProductionRuntime(): boolean {
    const runtime = String(process.env.NODE_ENV || process.env.APP_ENV || '').trim().toLowerCase();
    return runtime === 'production';
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
      fatura.formaPagamentoPreferida = this.validarFormaPagamentoDisponivel(
        updateFaturaDto.formaPagamentoPreferida,
        'atualizacao de fatura',
      );
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

  async gerarCobrancaFaturasVencidas(empresaId: string): Promise<ResultadoCobrancaLote> {
    const statusBloqueados = [StatusFatura.PAGA, StatusFatura.CANCELADA];
    const faturasVencidas = await this.faturaRepository
      .createQueryBuilder('fatura')
      .select('fatura.id', 'id')
      .where('fatura.dataVencimento < :agora', { agora: new Date() })
      .andWhere('fatura.ativo = :ativo', { ativo: true })
      .andWhere('fatura.empresa_id = :empresaId', { empresaId })
      .andWhere('fatura.status NOT IN (:...statusBloqueados)', { statusBloqueados })
      .getRawMany<{ id: number }>();

    const ids = faturasVencidas
      .map((item) => Number(item.id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (!ids.length) {
      return {
        solicitadas: 0,
        processadas: 0,
        sucesso: 0,
        simuladas: 0,
        falhas: 0,
        ignoradas: 0,
        resultados: [],
      };
    }

    return this.gerarCobrancaEmLote(ids, empresaId);
  }

  async verificarFaturasVencidas(
    empresaId: string,
  ): Promise<{ processados: number; sucesso: number; falhas: number }> {
    const faturasVencidas = await this.faturaRepository
      .createQueryBuilder('fatura')
      .where('fatura.status = :status', { status: StatusFatura.PENDENTE })
      .andWhere('fatura.dataVencimento < :agora', { agora: new Date() })
      .andWhere('fatura.ativo = :ativo', { ativo: true })
      .andWhere('fatura.empresa_id = :empresaId', { empresaId })
      .getMany();

    let sucesso = 0;
    let falhas = 0;

    for (const fatura of faturasVencidas) {
      fatura.status = StatusFatura.VENCIDA;
      try {
        await this.faturaRepository.save(fatura);
        this.logger.log(`Fatura vencida: ${fatura.numero}`);
        sucesso += 1;
      } catch (error) {
        falhas += 1;
        const mensagemErro =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message?: unknown }).message || 'erro desconhecido')
            : 'erro desconhecido';
        this.logger.error(`Erro ao atualizar status de vencida para fatura ${fatura.numero}: ${mensagemErro}`);
      }
    }

    return {
      processados: faturasVencidas.length,
      sucesso,
      falhas,
    };
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
    const tipoDocumento = String(documento.tipo || 'fatura')
      .trim()
      .toLowerCase() as TipoDocumentoFinanceiro;

    if (!this.tiposDocumentoFinanceiro.has(tipoDocumento)) {
      throw new BadRequestException('Tipo de documento financeiro invalido.');
    }

    if (this.tiposDocumentoFinanceiroBloqueadosNoFaturamento.has(tipoDocumento)) {
      throw new BadRequestException(
        'Tipo de documento "folha_pagamento" nao e permitido no faturamento de clientes.',
      );
    }

    const tipoFiscal = tipoDocumento === 'nfe' || tipoDocumento === 'nfse';

    if (tipoFiscal && !this.financeiroFeatureFlags.fiscalDocumentsEnabled) {
      throw new BadRequestException(
        this.financeiroFeatureFlags.fiscalDisabledReason ||
          'Emissao fiscal (NF-e/NFS-e) desabilitada neste ambiente.',
      );
    }

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

  private normalizarTipoDocumentoFinanceiro(
    tipoDocumentoInput: TipoDocumentoFinanceiro,
  ): TipoDocumentoFinanceiro {
    const tipoDocumento = String(tipoDocumentoInput || '')
      .trim()
      .toLowerCase() as TipoDocumentoFinanceiro;

    if (!this.tiposDocumentoFinanceiro.has(tipoDocumento)) {
      throw new BadRequestException('Tipo de documento financeiro invalido.');
    }

    if (this.tiposDocumentoFinanceiroBloqueadosNoFaturamento.has(tipoDocumento)) {
      throw new BadRequestException(
        'Tipo de documento "folha_pagamento" nao e permitido no faturamento de clientes.',
      );
    }

    if (this.tiposDocumentoFiscal.has(tipoDocumento) && !this.financeiroFeatureFlags.fiscalDocumentsEnabled) {
      throw new BadRequestException(
        this.financeiroFeatureFlags.fiscalDisabledReason ||
          'Emissao fiscal (NF-e/NFS-e) desabilitada neste ambiente.',
      );
    }

    return tipoDocumento;
  }

  private obterPrefixoDocumentoFinanceiro(tipoDocumento: TipoDocumentoFinanceiro): string {
    return this.prefixosNumeroDocumentoFinanceiro[tipoDocumento] || 'DOC';
  }

  private async existeNumeroDocumentoFinanceiro(
    empresaId: string,
    tipoDocumento: TipoDocumentoFinanceiro,
    numeroDocumento: string,
    ano: number,
  ): Promise<boolean> {
    const total = await this.faturaRepository
      .createQueryBuilder('fatura')
      .where('fatura.empresaId = :empresaId', { empresaId })
      .andWhere('fatura.ativo = :ativo', { ativo: true })
      .andWhere(`"fatura"."detalhesTributarios" IS NOT NULL`)
      .andWhere(`"fatura"."detalhesTributarios"->'documento'->>'tipo' = :tipoDocumento`, {
        tipoDocumento,
      })
      .andWhere(`"fatura"."detalhesTributarios"->'documento'->>'numero' = :numeroDocumento`, {
        numeroDocumento,
      })
      .andWhere(`EXTRACT(YEAR FROM fatura."createdAt") = :ano`, { ano })
      .getCount();

    return total > 0;
  }

  private isTruthy(value?: string | null): boolean {
    return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
  }

  private normalizarGatewayPagamentoProvider(value?: string | null): string | null {
    const raw = String(value || '')
      .trim()
      .toLowerCase();
    if (!raw) {
      return null;
    }
    if (raw === 'mercadopago' || raw === 'mercado_pago' || raw === 'mercado-pago') {
      return 'mercadopago';
    }
    return raw;
  }

  private async carregarConfigGatewayPagamentoEmpresa(empresaId: string): Promise<EmpresaConfig | null> {
    const tenantId = String(empresaId || '').trim();
    if (!tenantId || !this.empresaConfigRepository) {
      return null;
    }

    try {
      return await this.empresaConfigRepository.findOne({
        where: { empresaId: tenantId },
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao carregar configuracao de gateway da empresa ${tenantId}; fallback global sera aplicado.`,
      );
      return null;
    }
  }

  private async resolverGatewayPagamentoRuntime(
    empresaId: string,
  ): Promise<GatewayPagamentoRuntimeConfig> {
    const configEmpresa = await this.carregarConfigGatewayPagamentoEmpresa(empresaId);
    const tenantProvider = this.normalizarGatewayPagamentoProvider(configEmpresa?.gatewayPagamentoProvider);
    const tenantAccessToken = this.normalizarTextoDocumento(configEmpresa?.gatewayPagamentoAccessToken);
    const tenantWebhookSecret = this.normalizarTextoDocumento(configEmpresa?.gatewayPagamentoWebhookSecret);

    const envAccessToken = this.normalizarTextoDocumento(process.env.MERCADO_PAGO_ACCESS_TOKEN);
    const envWebhookSecret = this.normalizarTextoDocumento(process.env.MERCADO_PAGO_WEBHOOK_SECRET);
    const envProvider = this.normalizarGatewayPagamentoProvider(
      process.env.GATEWAY_PAGAMENTO_PROVIDER || (envAccessToken ? 'mercadopago' : null),
    );

    const provider = tenantProvider || envProvider;
    const accessToken = tenantAccessToken || envAccessToken;
    const webhookSecret = tenantWebhookSecret || envWebhookSecret;

    return {
      provider,
      providerSource: tenantProvider ? 'tenant' : envProvider ? 'env' : 'default',
      accessToken,
      accessTokenSource: tenantAccessToken ? 'tenant' : envAccessToken ? 'env' : 'default',
      webhookSecret,
      webhookSecretSource: tenantWebhookSecret ? 'tenant' : envWebhookSecret ? 'env' : 'default',
    };
  }

  private normalizarBaseUrl(value?: string | null): string | null {
    const raw = String(value || '').trim();
    if (!raw) {
      return null;
    }

    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }

      return parsed.toString().replace(/\/+$/, '');
    } catch {
      return null;
    }
  }

  private isLocalOrPrivateUrl(value?: string | null): boolean {
    const normalized = this.normalizarBaseUrl(value);
    if (!normalized) {
      return false;
    }

    try {
      const parsed = new URL(normalized);
      const host = parsed.hostname.toLowerCase();

      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '0.0.0.0' ||
        host === '::1' ||
        host.endsWith('.local')
      ) {
        return true;
      }

      if (host.startsWith('10.') || host.startsWith('192.168.')) {
        return true;
      }

      return /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
    } catch {
      return false;
    }
  }

  private resolverBaseUrlPagamento(params: {
    configurada?: string | null;
    contexto?: string | null;
    fallback: string;
    tipo: 'frontend' | 'backend';
    bloquearLocalPrivado: boolean;
  }): string {
    const configuradaNormalizada = this.normalizarBaseUrl(params.configurada);
    if (configuradaNormalizada) {
      return configuradaNormalizada;
    }

    const contextoNormalizado = this.normalizarBaseUrl(params.contexto);
    if (contextoNormalizado) {
      if (!params.bloquearLocalPrivado || !this.isLocalOrPrivateUrl(contextoNormalizado)) {
        return contextoNormalizado;
      }

      this.logger.warn(
        `[gerarLinkPagamentoFatura] Ignorando ${params.tipo}BaseUrl local/privada recebida na requisicao: ${contextoNormalizado}`,
      );
    }

    return this.normalizarBaseUrl(params.fallback) || params.fallback.replace(/\/+$/, '');
  }

  private resolverCampoOrdenacaoFaturas(sortBy?: string): string {
    const campo = String(sortBy || '').trim();
    return this.camposOrdenacaoFaturas[campo] || this.camposOrdenacaoFaturas.createdAt;
  }

  private calcularDataExpiracaoCobranca(dataVencimento: Date | string): Date {
    const hoje = new Date();
    const data = new Date(dataVencimento);

    if (Number.isNaN(data.getTime()) || data < hoje) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 7);
      return fallback;
    }

    data.setHours(23, 59, 59, 0);
    return data;
  }

  private resolverFormaPagamentoCobrancaOnline(
    formaPagamento?: FormaPagamento | null,
  ): FormaPagamento {
    const formaValidada =
      this.validarFormaPagamentoDisponivel(formaPagamento, 'fatura') || FormaPagamento.PIX;
    const formaNormalizada = this.normalizarFormaPagamentoComFallback(formaValidada);

    if (this.formasPagamentoCobrancaOnline.has(formaNormalizada)) {
      return formaNormalizada;
    }

    throw new BadRequestException(
      `Forma de pagamento "${formaNormalizada}" exige fluxo manual de recebimento. Para gerar link online, utilize PIX, cartao de credito, cartao de debito ou boleto.`,
    );
  }

  private construirRestricoesPagamentoMercadoPago(
    formaPagamento?: FormaPagamento | null,
  ): Record<string, unknown> {
    const permitirSomenteTiposPagamento = (
      paymentTypesPermitidos: readonly string[],
      defaults?: {
        defaultPaymentTypeId?: string;
        defaultPaymentMethodId?: string;
      },
    ): Record<string, unknown> => {
      const permitidos = new Set(paymentTypesPermitidos);
      const excludedPaymentTypes = this.mercadoPagoPaymentTypesSuportados
        .filter((paymentTypeId) => !permitidos.has(paymentTypeId))
        .map((paymentTypeId) => ({ id: paymentTypeId }));

      const restricoes: Record<string, unknown> = {};
      if (excludedPaymentTypes.length > 0) {
        restricoes.excluded_payment_types = excludedPaymentTypes;
      }
      if (defaults?.defaultPaymentTypeId) {
        restricoes.default_payment_type_id = defaults.defaultPaymentTypeId;
      }
      if (defaults?.defaultPaymentMethodId) {
        restricoes.default_payment_method_id = defaults.defaultPaymentMethodId;
      }
      return restricoes;
    };

    switch (formaPagamento) {
      case FormaPagamento.PIX:
        return permitirSomenteTiposPagamento(['bank_transfer'], {
          defaultPaymentTypeId: 'bank_transfer',
          defaultPaymentMethodId: 'pix',
        });
      case FormaPagamento.CARTAO_CREDITO:
        return permitirSomenteTiposPagamento(['credit_card'], {
          defaultPaymentTypeId: 'credit_card',
        });
      case FormaPagamento.CARTAO_DEBITO:
        return permitirSomenteTiposPagamento(['debit_card'], {
          defaultPaymentTypeId: 'debit_card',
        });
      case FormaPagamento.BOLETO:
        return permitirSomenteTiposPagamento(['ticket'], {
          defaultPaymentTypeId: 'ticket',
        });
      default:
        return {};
    }
  }

  private async registrarPagamentoPendentePorLink(params: {
    empresaId: string;
    fatura: Fatura;
    referenciaGateway: string;
    linkPagamento: string;
    preferenceId?: string;
  }): Promise<void> {
    const { empresaId, fatura, referenciaGateway, linkPagamento, preferenceId } = params;

    const existente = await this.pagamentoRepository.findOne({
      where: { empresaId, faturaId: fatura.id, gatewayTransacaoId: referenciaGateway },
    });

    const valorRestante = this.roundMoney(Math.max(Number(fatura.valorTotal) - Number(fatura.valorPago), 0));
    if (valorRestante <= 0) {
      return;
    }

    const dadosCompletos = {
      ...((existente?.dadosCompletos || {}) as Record<string, unknown>),
      linkPagamento,
      preferenceId: preferenceId || null,
      externalReference: referenciaGateway,
      origem: 'faturamento.link_pagamento',
      atualizadoEm: new Date().toISOString(),
    };

    if (existente) {
      if (existente.status === StatusPagamento.APROVADO) {
        return;
      }

      existente.status = StatusPagamento.PENDENTE;
      existente.valor = valorRestante;
      existente.valorLiquido = valorRestante;
      existente.taxa = 0;
      existente.metodoPagamento = String(
        fatura.formaPagamentoPreferida || FormaPagamento.A_COMBINAR,
      );
      existente.gateway = 'mercadopago';
      existente.dadosCompletos = dadosCompletos as any;
      existente.observacoes =
        existente.observacoes ||
        `Pagamento pendente via link para a fatura ${fatura.numero}.`;
      await this.pagamentoRepository.save(existente);
      return;
    }

    const pagamentoPendente = this.pagamentoRepository.create({
      empresaId,
      faturaId: fatura.id,
      transacaoId: this.gerarTransacaoIdPagamentoLink(fatura.id),
      tipo: TipoPagamento.PAGAMENTO,
      status: StatusPagamento.PENDENTE,
      valor: valorRestante,
      taxa: 0,
      valorLiquido: valorRestante,
      metodoPagamento: String(fatura.formaPagamentoPreferida || FormaPagamento.A_COMBINAR),
      gateway: 'mercadopago',
      gatewayTransacaoId: referenciaGateway,
      dadosCompletos: dadosCompletos as any,
      observacoes: `Pagamento pendente via link para a fatura ${fatura.numero}.`,
    });

    await this.pagamentoRepository.save(pagamentoPendente);
  }

  private gerarTransacaoIdPagamentoLink(faturaId: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const sufixo = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `LNK-${faturaId}-${timestamp}-${sufixo}`;
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

    const formaMapeada = mapeamento[normalizado] || FormaPagamento.PIX;
    return this.normalizarFormaPagamentoComFallback(formaMapeada);
  }

  private validarFormaPagamentoDisponivel(
    formaPagamento?: FormaPagamento | null,
    contexto?: string,
  ): FormaPagamento | undefined {
    if (!formaPagamento) {
      return undefined;
    }

    if (formaPagamento === FormaPagamento.BOLETO && !this.financeiroFeatureFlags.boletoEnabled) {
      const prefixo = contexto ? `${contexto}: ` : '';
      throw new BadRequestException(
        `${prefixo}${
          this.financeiroFeatureFlags.boletoDisabledReason ||
          'Boleto desabilitado neste ambiente para foco no fluxo financeiro essencial.'
        }`,
      );
    }

    return formaPagamento;
  }

  private normalizarFormaPagamentoComFallback(
    formaPagamento?: FormaPagamento | null,
  ): FormaPagamento {
    if (!formaPagamento) {
      return FormaPagamento.PIX;
    }

    if (formaPagamento === FormaPagamento.BOLETO && !this.financeiroFeatureFlags.boletoEnabled) {
      return FormaPagamento.PIX;
    }

    return formaPagamento;
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
    const frontendBaseUrl = this.normalizarBaseUrl(process.env.FRONTEND_URL);
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

  private async gerarPdfBufferFromHtml(html: string): Promise<Buffer> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const htmlPdfNode = require('html-pdf-node') as {
        generatePdf: (
          file: { content: string },
          options: Record<string, unknown>,
        ) => Promise<Buffer | Uint8Array>;
      };
      const pdfRaw = await htmlPdfNode.generatePdf(
        { content: html },
        {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '12mm',
            right: '10mm',
            bottom: '12mm',
            left: '10mm',
          },
        },
      );
      return Buffer.isBuffer(pdfRaw) ? pdfRaw : Buffer.from(pdfRaw);
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : 'Falha ao gerar o PDF da fatura no backend.';
      this.logger.error(`[gerarPdfFatura] ${mensagem}`);
      throw new BadRequestException('Nao foi possivel gerar o PDF da fatura.');
    }
  }

  private toFiniteNumberPdf(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private formatCurrencyPdf(value: unknown): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(this.toFiniteNumberPdf(value));
  }

  private sanitizarComponenteArquivoPdf(value: string): string {
    const sanitized = String(value || '')
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return sanitized || 'sem-numero';
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
