import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contrato, StatusContrato } from '../entities/contrato.entity';
import {
  AssinaturaContrato,
  StatusAssinatura,
  TipoAssinatura,
} from '../entities/assinatura-contrato.entity';
import { Proposta } from '../../propostas/proposta.entity';
import { PropostasService } from '../../propostas/propostas.service';
import {
  ConfirmarAssinaturaExternaDto,
  CreateContratoDto,
  UpdateContratoDto,
} from '../dto/contrato.dto';
import { PdfContratoService } from './pdf-contrato.service';
import { AssinaturaDigitalService } from './assinatura-digital.service';

@Injectable()
export class ContratosService {
  private readonly logger = new Logger(ContratosService.name);
  private propostaRelationEnabled: boolean | null = null;

  constructor(
    @InjectRepository(Contrato)
    private contratoRepository: Repository<Contrato>,
    @InjectRepository(AssinaturaContrato)
    private assinaturaRepository: Repository<AssinaturaContrato>,
    @InjectRepository(Proposta)
    private propostaRepository: Repository<Proposta>,
    private propostasService: PropostasService,
    private pdfContratoService: PdfContratoService,
    private assinaturaDigitalService: AssinaturaDigitalService,
  ) {}

  async criarContrato(createContratoDto: CreateContratoDto, empresaId: string): Promise<Contrato> {
    try {
      let propostaIdVinculada: string | null = null;

      if (createContratoDto.propostaId) {
        // Validacao multi-tenant com lookup SQL enxuto para suportar schema legado de propostas.
        const propostaColumnsRows: Array<{ column_name?: string }> = await this.propostaRepository.query(
          `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'propostas'
          `,
        );
        const propostaColumns = new Set(
          propostaColumnsRows
            .map((row) => row.column_name)
            .filter((columnName): columnName is string => Boolean(columnName)),
        );
        const empresaColumn = propostaColumns.has('empresa_id')
          ? 'empresa_id'
          : propostaColumns.has('empresaId')
            ? 'empresaId'
            : null;

        if (!empresaColumn) {
          throw new NotFoundException('Proposta nao encontrada');
        }

        const emailDetailsColumn = propostaColumns.has('emailDetails')
          ? 'emailDetails'
          : propostaColumns.has('email_details')
            ? 'email_details'
            : propostaColumns.has('emaildetails')
              ? 'emaildetails'
              : null;

        const selectEmailDetails = emailDetailsColumn
          ? `, "${emailDetailsColumn}" AS email_details`
          : ', NULL::jsonb AS email_details';

        const propostaRows: Array<{
          id?: string;
          empresa_id?: string;
          status?: string;
          email_details?: unknown;
        }> =
          await this.propostaRepository.query(
            `
              SELECT id::text AS id, "${empresaColumn}"::text AS empresa_id, status::text AS status
              ${selectEmailDetails}
              FROM propostas
              WHERE id::text = $1
              LIMIT 1
            `,
            [createContratoDto.propostaId],
          );
        const proposta = propostaRows?.[0];

        if (!proposta?.id) {
          throw new NotFoundException('Proposta nao encontrada');
        }

        if (!proposta.empresa_id || proposta.empresa_id !== empresaId) {
          this.logger.warn(
            `Tentativa de criar contrato com proposta de outra empresa. ` +
              `Empresa do token: ${empresaId}, Empresa da proposta: ${proposta.empresa_id || 'indefinida'}`,
          );
          throw new ForbiddenException('Voce nao tem permissao para criar contrato com esta proposta');
        }

        const statusAtual = this.resolvePropostaFlowStatus(
          proposta.status,
          proposta.email_details,
        );
        if (!this.isPropostaElegivelParaContrato(statusAtual)) {
          throw new BadRequestException(
            `Proposta ${proposta.id} com status "${statusAtual}" nao pode gerar contrato. ` +
              'A proposta deve estar aprovada.',
          );
        }

        propostaIdVinculada = proposta.id;
      }

      // Gerar numero unico do contrato
      const numero = await this.gerarNumeroContrato();

      const contrato = this.contratoRepository.create({
        ...createContratoDto,
        empresa_id: empresaId,
        numero,
        status: StatusContrato.AGUARDANDO_ASSINATURA,
      });

      const contratoSalvo = await this.contratoRepository.save(contrato);

      // Gerar PDF do contrato
      const caminhoArquivoPDF = await this.pdfContratoService.gerarPDFContrato(contratoSalvo);

      // Atualizar com caminho do PDF e hash
      const hashDocumento = await this.pdfContratoService.calcularHashDocumento(caminhoArquivoPDF);

      contratoSalvo.caminhoArquivoPDF = caminhoArquivoPDF;
      contratoSalvo.hashDocumento = hashDocumento;

      const contratoAtualizado = await this.contratoRepository.save(contratoSalvo);

      this.logger.log(
        `Contrato criado: ${contratoAtualizado.numero}` +
          (propostaIdVinculada
            ? ` (vinculado a proposta ${propostaIdVinculada})`
            : ' (sem proposta vinculada)'),
      );

      await this.sincronizarStatusProposta(
        propostaIdVinculada,
        'contrato_gerado',
        empresaId,
        `Contrato ${contratoAtualizado.numero} gerado.`,
        'contratos',
      );

      return contratoAtualizado;
    } catch (error) {
      this.logger.error(`Erro ao criar contrato: ${error.message}`);

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Nao foi possivel criar o contrato');
    }
  }

  async buscarContratos(
    empresaId: string,
    filtros?: {
      status?: StatusContrato;
      clienteId?: number;
      propostaId?: string;
      dataInicio?: Date;
      dataFim?: Date;
    },
  ): Promise<Contrato[]> {
    // 🔒 MULTI-TENANCY: Filtrar por empresa_id
    const query = this.contratoRepository
      .createQueryBuilder('contrato')
      .where('contrato.ativo = :ativo', { ativo: true })
      .andWhere('contrato.empresa_id = :empresaId', { empresaId });

    if (filtros?.status) {
      query.andWhere('contrato.status = :status', { status: filtros.status });
    }

    if (filtros?.clienteId) {
      query.andWhere('contrato.clienteId = :clienteId', { clienteId: filtros.clienteId });
    }

    if (filtros?.propostaId) {
      query.andWhere('contrato.propostaId = :propostaId', { propostaId: filtros.propostaId });
    }

    if (filtros?.dataInicio) {
      query.andWhere('contrato.dataInicio >= :dataInicio', { dataInicio: filtros.dataInicio });
    }

    if (filtros?.dataFim) {
      query.andWhere('contrato.dataFim <= :dataFim', { dataFim: filtros.dataFim });
    }

    return query.orderBy('contrato.createdAt', 'DESC').getMany();
  }

  async buscarContratoPorId(id: number, empresaId: string): Promise<Contrato> {
    const relations = ['usuarioResponsavel', 'assinaturas', 'assinaturas.usuario'];
    if (await this.canLoadPropostaRelation()) {
      relations.unshift('proposta');
    }

    // MULTI-TENANCY: Filtrar por empresa_id
    const contrato = await this.contratoRepository.findOne({
      where: { id, empresa_id: empresaId, ativo: true },
      relations,
    });

    if (!contrato) {
      throw new NotFoundException('Contrato nao encontrado');
    }

    return contrato;
  }

  async buscarContratoPorNumero(numero: string, empresaId: string): Promise<Contrato> {
    const relations = ['usuarioResponsavel', 'assinaturas', 'assinaturas.usuario'];
    if (await this.canLoadPropostaRelation()) {
      relations.unshift('proposta');
    }

    // MULTI-TENANCY: Filtrar por empresa_id
    const contrato = await this.contratoRepository.findOne({
      where: { numero, empresa_id: empresaId, ativo: true },
      relations,
    });

    if (!contrato) {
      throw new NotFoundException('Contrato nao encontrado');
    }

    return contrato;
  }

  async atualizarContrato(
    id: number,
    updateContratoDto: UpdateContratoDto,
    empresaId: string,
  ): Promise<Contrato> {
    // 🔒 MULTI-TENANCY: Validar empresa_id
    const contrato = await this.buscarContratoPorId(id, empresaId);

    if (contrato.status === StatusContrato.ASSINADO) {
      throw new BadRequestException('Nao e possivel alterar contrato ja assinado');
    }

    Object.assign(contrato, updateContratoDto);

    // Se alterou dados importantes, regenerar PDF
    const camposImportantes = [
      'objeto',
      'valorTotal',
      'dataInicio',
      'dataFim',
      'condicoesPagamento',
    ];
    const houveAlteracaoImportante = camposImportantes.some((campo) =>
      updateContratoDto.hasOwnProperty(campo),
    );

    if (houveAlteracaoImportante) {
      const novoCaminhoArquivoPDF = await this.pdfContratoService.gerarPDFContrato(contrato);
      const novoHashDocumento =
        await this.pdfContratoService.calcularHashDocumento(novoCaminhoArquivoPDF);

      contrato.caminhoArquivoPDF = novoCaminhoArquivoPDF;
      contrato.hashDocumento = novoHashDocumento;

      // Invalidar assinaturas pendentes
      await this.invalidarAssinaturasPendentes(id);
    }

    const contratoAtualizado = await this.contratoRepository.save(contrato);
    this.logger.log(`Contrato atualizado: ${contratoAtualizado.numero}`);

    return contratoAtualizado;
  }

  async marcarComoAssinado(id: number, empresaId: string): Promise<Contrato> {
    // 🔒 MULTI-TENANCY: Validar empresa_id
    const contrato = await this.buscarContratoPorId(id, empresaId);
    const statusAnterior = contrato.status;
    const dataAssinaturaAnterior = contrato.dataAssinatura;

    if (contrato.status === StatusContrato.ASSINADO) {
      throw new BadRequestException('Contrato ja esta assinado');
    }

    // Verificar se todas as assinaturas obrigatórias foram realizadas
    const assinaturasAssinadas = contrato.assinaturas.filter((a) => a.isAssinado());

    if (assinaturasAssinadas.length === 0) {
      throw new BadRequestException('Nenhuma assinatura valida encontrada');
    }

    contrato.status = StatusContrato.ASSINADO;
    contrato.dataAssinatura = new Date();

    try {
      const contratoAtualizado = await this.contratoRepository.save(contrato);
      this.logger.log(`Contrato assinado: ${contratoAtualizado.numero}`);

      await this.sincronizarStatusProposta(
        contratoAtualizado.propostaId,
        'contrato_assinado',
        empresaId,
        `Contrato ${contratoAtualizado.numero} assinado.`,
        'contratos-assinatura',
        true,
      );

      return contratoAtualizado;
    } catch (error) {
      await this.contratoRepository.update(contrato.id, {
        status: statusAnterior,
        dataAssinatura: dataAssinaturaAnterior ?? null,
      });
      throw error;
    }
  }

  async cancelarContrato(id: number, empresaId: string, motivo?: string): Promise<Contrato> {
    // 🔒 MULTI-TENANCY: Validar empresa_id
    const contrato = await this.buscarContratoPorId(id, empresaId);

    if (contrato.status === StatusContrato.ASSINADO) {
      throw new BadRequestException('Nao e possivel cancelar contrato ja assinado');
    }

    contrato.status = StatusContrato.CANCELADO;
    if (motivo) {
      contrato.observacoes = `${contrato.observacoes || ''}\n\nCancelado: ${motivo}`;
    }

    const contratoAtualizado = await this.contratoRepository.save(contrato);
    this.logger.log(`Contrato cancelado: ${contratoAtualizado.numero}`);

    return contratoAtualizado;
  }

  async confirmarAssinaturaExterna(
    id: number,
    empresaId: string,
    usuarioConfirmacaoId?: string,
    payload?: ConfirmarAssinaturaExternaDto,
  ): Promise<Contrato> {
    const contrato = await this.buscarContratoPorId(id, empresaId);

    if (contrato.status === StatusContrato.CANCELADO) {
      throw new BadRequestException(
        'Nao e possivel confirmar assinatura externa em contrato cancelado',
      );
    }

    if (contrato.status === StatusContrato.EXPIRADO) {
      throw new BadRequestException(
        'Nao e possivel confirmar assinatura externa em contrato expirado',
      );
    }

    if (contrato.status === StatusContrato.ASSINADO) {
      throw new BadRequestException('Contrato ja esta assinado');
    }

    const dataAssinatura = payload?.dataAssinatura ? new Date(payload.dataAssinatura) : new Date();
    if (Number.isNaN(dataAssinatura.getTime())) {
      throw new BadRequestException('Data de assinatura invalida');
    }

    if (dataAssinatura.getTime() > Date.now()) {
      throw new BadRequestException('Data de assinatura nao pode ser futura');
    }

    const assinanteId = isUUID(String(usuarioConfirmacaoId || ''))
      ? String(usuarioConfirmacaoId)
      : contrato.usuarioResponsavelId;

    if (!isUUID(String(assinanteId || ''))) {
      throw new BadRequestException('Nao foi possivel identificar o usuario para registrar assinatura externa');
    }

    const assinatura = this.assinaturaRepository.create({
      contratoId: contrato.id,
      usuarioId: assinanteId,
      tipo: TipoAssinatura.PRESENCIAL,
      status: StatusAssinatura.ASSINADO,
      dataAssinatura,
      dataEnvio: new Date(),
      metadados: {
        dispositivo: 'backoffice',
        navegador: 'contratos',
        versaoApp: 'assinatura_externa_manual',
      },
    });

    const assinaturaSalva = await this.assinaturaRepository.save(assinatura);

    const observacoesAdicionais = payload?.observacoes?.trim();
    const registroAssinaturaExterna =
      `Assinatura externa confirmada em ${dataAssinatura.toISOString()}` +
      (observacoesAdicionais ? `. Obs: ${observacoesAdicionais}` : '.');

    const observacoesAtualizadas = [contrato.observacoes, registroAssinaturaExterna]
      .filter((item) => Boolean(item && String(item).trim().length > 0))
      .join('\n\n');

    try {
      // Atualiza campos escalares sem re-sincronizar a relacao `assinaturas`.
      // Isso evita que o TypeORM tente desvincular assinatura criada no mesmo fluxo.
      await this.contratoRepository.update(contrato.id, {
        status: StatusContrato.ASSINADO,
        dataAssinatura,
        observacoes: observacoesAtualizadas,
      });

      const contratoAtualizado = await this.buscarContratoPorId(contrato.id, empresaId);

      await this.sincronizarStatusProposta(
        contratoAtualizado.propostaId,
        'contrato_assinado',
        empresaId,
        `Contrato ${contratoAtualizado.numero} confirmado como assinado externamente.`,
        'contratos-assinatura-externa',
        true,
      );

      this.logger.log(`Assinatura externa confirmada para contrato: ${contratoAtualizado.numero}`);

      return contratoAtualizado;
    } catch (error) {
      // Rollback para evitar contrato/assinatura assinados sem atualizar proposta.
      await this.assinaturaRepository.delete(assinaturaSalva.id);
      await this.contratoRepository.update(contrato.id, {
        status: contrato.status,
        dataAssinatura: contrato.dataAssinatura ?? null,
        observacoes: contrato.observacoes ?? null,
      });
      throw error;
    }
  }

  async verificarContratosExpirados(): Promise<void> {
    const contratosExpirados = await this.contratoRepository
      .createQueryBuilder('contrato')
      .where('contrato.status = :status', { status: StatusContrato.AGUARDANDO_ASSINATURA })
      .andWhere('contrato.dataVencimento < :agora', { agora: new Date() })
      .andWhere('contrato.ativo = :ativo', { ativo: true })
      .getMany();

    for (const contrato of contratosExpirados) {
      contrato.status = StatusContrato.EXPIRADO;
      await this.contratoRepository.save(contrato);
      this.logger.log(`Contrato expirado: ${contrato.numero}`);
    }
  }

  private async gerarNumeroContrato(): Promise<string> {
    const ano = new Date().getFullYear();

    const ultimoContrato = await this.contratoRepository
      .createQueryBuilder('contrato')
      .where('contrato.numero LIKE :pattern', { pattern: `CT${ano}%` })
      .orderBy('contrato.numero', 'DESC')
      .getOne();

    let proximoNumero = 1;

    if (ultimoContrato) {
      const numeroAtual = parseInt(ultimoContrato.numero.replace(`CT${ano}`, ''));
      proximoNumero = numeroAtual + 1;
    }

    return `CT${ano}${proximoNumero.toString().padStart(6, '0')}`;
  }

  private async invalidarAssinaturasPendentes(contratoId: number): Promise<void> {
    await this.assinaturaRepository
      .createQueryBuilder()
      .update()
      .set({ status: StatusAssinatura.EXPIRADO })
      .where('contratoId = :contratoId', { contratoId })
      .andWhere('status = :status', { status: StatusAssinatura.PENDENTE })
      .execute();
  }

  private isPropostaElegivelParaContrato(status: string): boolean {
    return status === 'aprovada';
  }

  private resolvePropostaFlowStatus(status: unknown, emailDetails: unknown): string {
    const emailDetailsObj =
      emailDetails && typeof emailDetails === 'object' && !Array.isArray(emailDetails)
        ? (emailDetails as Record<string, unknown>)
        : {};
    const fluxoStatus = String(emailDetailsObj.fluxoStatus || '').trim();

    return this.normalizePropostaFlowStatus(fluxoStatus || status);
  }

  private normalizePropostaFlowStatus(value: unknown): string {
    const normalized = String(value || '')
      .trim()
      .toLowerCase();

    if (!normalized) {
      return 'rascunho';
    }

    switch (normalized) {
      case 'aceita':
      case 'approved':
        return 'aprovada';
      case 'contratoassinado':
        return 'contrato_assinado';
      case 'paid':
        return 'pago';
      default:
        return normalized;
    }
  }

  private async canLoadPropostaRelation(): Promise<boolean> {
    if (this.propostaRelationEnabled !== null) {
      return this.propostaRelationEnabled;
    }

    const rows: Array<{ column_name?: string }> = await this.propostaRepository.query(
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

  private async sincronizarStatusProposta(
    propostaId: string | null | undefined,
    status: string,
    empresaId: string,
    observacoes: string,
    source: string,
    obrigatoria = false,
  ): Promise<void> {
    if (!propostaId) {
      return;
    }

    try {
      await this.propostasService.atualizarStatus(
        propostaId,
        status,
        source,
        observacoes,
        undefined,
        empresaId,
      );
    } catch (error: any) {
      const mensagemErro =
        `Falha ao sincronizar status da proposta ${propostaId} para ${status}: ${error.message}`;

      if (obrigatoria) {
        this.logger.error(mensagemErro);
        throw new BadRequestException(
          'Nao foi possivel sincronizar o status da proposta vinculada ao contrato',
        );
      }

      this.logger.warn(mensagemErro);
    }
  }
}
