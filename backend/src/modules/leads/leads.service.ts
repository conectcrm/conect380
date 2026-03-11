import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, StatusLead, OrigemLead } from './lead.entity';
import {
  CreateLeadDto,
  UpdateLeadDto,
  ConvertLeadDto,
  CaptureLeadDto,
  LeadFiltros,
  LeadEstatisticas,
  ImportLeadRow,
  ImportLeadResult,
} from './dto/lead.dto';
import { User } from '../users/user.entity';
import {
  Oportunidade,
  EstagioOportunidade,
  OrigemOportunidade,
  PrioridadeOportunidade,
} from '../oportunidades/oportunidade.entity';
import { OportunidadesService } from '../oportunidades/oportunidades.service';
import { Empresa } from '../../empresas/entities/empresa.entity';
import * as Papa from 'papaparse';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);
  private readonly leadColumnEnumCache = new Map<string, Set<string> | null>();

  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    private readonly oportunidadesService: OportunidadesService,
  ) {}


  private maskEmail(email?: string | null): string | null {
    if (!email || typeof email !== 'string') return null;
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return '[email]';
    const prefix = localPart.slice(0, 2);
    return `${prefix}${'*'.repeat(Math.max(localPart.length - 2, 2))}@${domain}`;
  }

  private maskPhone(phone?: string | null): string | null {
    if (!phone || typeof phone !== 'string') return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '[telefone]';
    const suffix = digits.slice(-4);
    return `${'*'.repeat(Math.max(digits.length - 4, 4))}${suffix}`;
  }

  private summarizeText(value?: string | null, max: number = 60): string | null {
    if (!value || typeof value !== 'string') return null;
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) return null;
    return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
  }

  private buildLeadPayloadLogMeta(payload: Partial<CreateLeadDto> | Partial<UpdateLeadDto>) {
    const p = payload as any;

    return {
      nome: this.summarizeText(payload.nome, 40),
      email: this.maskEmail(payload.email),
      telefone: this.maskPhone(payload.telefone),
      empresaNome: this.summarizeText(payload.empresa_nome, 40),
      origem: p.origem || null,
      status: p.status || null,
      responsavelId: payload.responsavel_id || null,
      observacoesResumo: this.summarizeText(payload.observacoes, 80),
    };
  }

  private buildLeadEntityLogMeta(lead: Lead) {
    return {
      id: lead.id || null,
      nome: this.summarizeText(lead.nome, 40),
      email: this.maskEmail(lead.email),
      telefone: this.maskPhone(lead.telefone),
      empresaId: lead.empresaId,
      status: lead.status,
      origem: lead.origem,
      score: lead.score,
    };
  }

  private buildFiltrosLogMeta(empresaId: string, filtros?: LeadFiltros) {
    return {
      empresaId,
      page: filtros?.page || 1,
      limit: filtros?.limit || 50,
      status: filtros?.status || null,
      origem: filtros?.origem || null,
      responsavelId: filtros?.responsavel_id || null,
      busca: this.summarizeText(filtros?.busca, 40),
      dataInicio: filtros?.dataInicio || null,
      dataFim: filtros?.dataFim || null,
    };
  }

  private logError(context: string, error: unknown): void {
    const err = error as any;
    const message = err?.message || 'Erro desconhecido';
    const detail = err?.detail || null;
    const code = err?.code || null;
    const stack = err instanceof Error ? err.stack : undefined;

    this.logger.error(`${context} message=${message} code=${code} detail=${detail}`, stack);
  }

  private sanitizeLeadInput<T extends Partial<CreateLeadDto> | Partial<UpdateLeadDto>>(
    payload: T,
  ): T {
    const sanitized = { ...payload } as Record<string, unknown>;

    if (typeof sanitized.nome === 'string') {
      const trimmedName = sanitized.nome.trim();
      sanitized.nome = trimmedName === '' ? undefined : trimmedName;
    }

    const fieldsToNormalize = [
      'email',
      'telefone',
      'empresa_nome',
      'observacoes',
      'responsavel_id',
      'origem',
      'status',
    ];

    fieldsToNormalize.forEach((field) => {
      if (!(field in sanitized)) {
        return;
      }

      const value = sanitized[field];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        sanitized[field] = trimmed === '' ? undefined : trimmed;
      }
    });

    return sanitized as T;
  }

  private mapearEstagioParaBanco(estagio: EstagioOportunidade): EstagioOportunidade {
    if (Object.values(EstagioOportunidade).includes(estagio)) {
      return estagio;
    }

    return EstagioOportunidade.LEADS;
  }

  private async getLeadColumnEnumValues(columnName: string): Promise<Set<string> | null> {
    if (this.leadColumnEnumCache.has(columnName)) {
      return this.leadColumnEnumCache.get(columnName) || null;
    }

    const metadataRows = await this.leadsRepository.query(
      `
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'leads'
          AND column_name = $1
        LIMIT 1
      `,
      [columnName],
    );

    const metadata = metadataRows?.[0] || null;
    if (!metadata || metadata.data_type !== 'USER-DEFINED' || !metadata.udt_name) {
      this.leadColumnEnumCache.set(columnName, null);
      return null;
    }

    const enumRows = await this.leadsRepository.query(
      `
        SELECT e.enumlabel
        FROM pg_type t
        INNER JOIN pg_namespace n ON n.oid = t.typnamespace
        INNER JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE n.nspname = 'public'
          AND t.typname = $1
        ORDER BY e.enumsortorder
      `,
      [metadata.udt_name],
    );

    const values = new Set<string>(
      (enumRows || [])
        .map((row: { enumlabel?: string }) => (row.enumlabel || '').toString().trim().toLowerCase())
        .filter((value: string) => value.length > 0),
    );

    const resolved = values.size > 0 ? values : null;
    this.leadColumnEnumCache.set(columnName, resolved);
    return resolved;
  }

  private normalizarStatusLead(status?: string | null): StatusLead {
    const normalized = (status || '').toString().trim().toLowerCase();
    switch (normalized) {
      case StatusLead.NOVO:
      case 'novo':
        return StatusLead.NOVO;
      case StatusLead.CONTATADO:
      case 'contatado':
        return StatusLead.CONTATADO;
      case StatusLead.QUALIFICADO:
      case 'qualificado':
        return StatusLead.QUALIFICADO;
      case StatusLead.CONVERTIDO:
      case 'convertido':
        return StatusLead.CONVERTIDO;
      case StatusLead.DESQUALIFICADO:
      case 'desqualificado':
      case 'perdido':
        return StatusLead.DESQUALIFICADO;
      default:
        return StatusLead.NOVO;
    }
  }

  private async mapearStatusLeadParaBanco(status?: string | null): Promise<string> {
    const normalized = this.normalizarStatusLead(status);
    const enumValues = await this.getLeadColumnEnumValues('status');

    if (!enumValues) {
      return normalized;
    }

    if (enumValues.has(normalized)) {
      return normalized;
    }

    if (normalized === StatusLead.DESQUALIFICADO && enumValues.has('perdido')) {
      return 'perdido';
    }

    if (enumValues.has(StatusLead.NOVO)) {
      return StatusLead.NOVO;
    }

    return Array.from(enumValues.values())[0] || normalized;
  }

  private normalizarOrigemLead(origem?: string): OrigemLead {
    if (!origem) {
      return OrigemLead.MANUAL;
    }

    const normalized = origem.trim().toLowerCase();
    if (!normalized) {
      return OrigemLead.MANUAL;
    }

    if (Object.values(OrigemLead).includes(normalized as OrigemLead)) {
      return normalized as OrigemLead;
    }

    switch (normalized) {
      case 'site':
      case 'website':
      case 'landing_page':
      case 'landing-page':
      case 'landing':
        return OrigemLead.FORMULARIO;
      case 'csv':
      case 'campanha':
      case 'publicidade':
      case 'ads':
        return OrigemLead.IMPORTACAO;
      case 'telefone':
      case 'email':
        return OrigemLead.MANUAL;
      case 'redes_sociais':
      case 'midia_social':
      case 'social':
      case 'social_media':
      case 'chat':
      case 'webchat':
      case 'instagram':
      case 'facebook':
      case 'linkedin':
        return OrigemLead.WHATSAPP;
      case 'parceiro':
        return OrigemLead.INDICACAO;
      case 'evento':
      case 'outros':
      case 'unknown':
        return OrigemLead.OUTRO;
      default:
        return OrigemLead.OUTRO;
    }
  }

  private async mapearOrigemLeadParaBanco(origem?: string): Promise<string> {
    const normalized = this.normalizarOrigemLead(origem);
    const enumValues = await this.getLeadColumnEnumValues('origem');

    if (!enumValues) {
      return normalized;
    }

    if (enumValues.has(normalized)) {
      return normalized;
    }

    const candidatesByOrigin: Record<OrigemLead, string[]> = {
      [OrigemLead.FORMULARIO]: ['formulario', 'site', 'website', 'outros'],
      [OrigemLead.IMPORTACAO]: ['importacao', 'campanha', 'outros'],
      [OrigemLead.API]: ['api', 'outros'],
      [OrigemLead.WHATSAPP]: ['whatsapp', 'chat', 'redes_sociais', 'outros'],
      [OrigemLead.MANUAL]: ['manual', 'outros'],
      [OrigemLead.INDICACAO]: ['indicacao', 'outros'],
      [OrigemLead.OUTRO]: ['outro', 'outros'],
    };

    for (const candidate of candidatesByOrigin[normalized] || []) {
      if (enumValues.has(candidate)) {
        return candidate;
      }
    }

    return Array.from(enumValues.values())[0] || normalized;
  }

  private normalizarLeadDoBanco(lead: Lead): Lead {
    const normalizedStatus = this.normalizarStatusLead(lead.status as unknown as string);
    const normalizedOrigem = lead.origem
      ? this.normalizarOrigemLead(lead.origem as unknown as string)
      : undefined;

    return {
      ...lead,
      status: normalizedStatus,
      origem: normalizedOrigem,
    } as Lead;
  }

  private mapearOrigemLeadParaOportunidade(origem?: string): OrigemOportunidade {
    switch (this.normalizarOrigemLead(origem)) {
      case OrigemLead.FORMULARIO:
        return OrigemOportunidade.WEBSITE;
      case OrigemLead.IMPORTACAO:
        return OrigemOportunidade.CAMPANHA;
      case OrigemLead.API:
      case OrigemLead.MANUAL:
        return OrigemOportunidade.WEBSITE;
      case OrigemLead.WHATSAPP:
        return OrigemOportunidade.REDES_SOCIAIS;
      case OrigemLead.INDICACAO:
        return OrigemOportunidade.INDICACAO;
      case OrigemLead.OUTRO:
      default:
        return OrigemOportunidade.PARCEIRO;
    }
  }

  private normalizeIdentifier(value?: string | null): string | undefined {
    if (!value || typeof value !== 'string') {
      return undefined;
    }
    const normalized = value.trim();
    return normalized === '' ? undefined : normalized;
  }

  private extractSubdominioFromHost(host?: string): string | undefined {
    const hostRaw = this.normalizeIdentifier(host);
    if (!hostRaw) {
      return undefined;
    }

    const firstHost = hostRaw.split(',')[0]?.trim().toLowerCase();
    if (!firstHost) {
      return undefined;
    }

    const withoutPort = firstHost.split(':')[0];
    if (!withoutPort || withoutPort === 'localhost' || withoutPort === '127.0.0.1') {
      return undefined;
    }

    const parts = withoutPort.split('.').filter(Boolean);
    if (parts.length < 3) {
      return undefined;
    }

    const subdominio = parts[0];
    if (!subdominio || subdominio === 'www') {
      return undefined;
    }

    return subdominio;
  }

  private async resolveEmpresaIdForPublicCapture(
    dto: CaptureLeadDto,
    context?: {
      host?: string;
      query?: Record<string, unknown>;
    },
  ): Promise<string> {
    const query = context?.query || {};
    const queryValue = (keys: string[]): string | undefined => {
      for (const key of keys) {
        const raw = query[key];
        if (typeof raw === 'string' && raw.trim() !== '') {
          return raw.trim();
        }
      }
      return undefined;
    };

    const empresaId = this.normalizeIdentifier(
      dto.empresa_id ||
        queryValue(['empresa_id', 'empresaId', 'tenant', 'tenant_id', 'tenantId']),
    );
    if (empresaId) {
      const empresa = await this.empresaRepository.findOne({
        where: { id: empresaId, ativo: true },
        select: ['id'],
      });
      if (empresa?.id) {
        return empresa.id;
      }
    }

    const empresaSlug = this.normalizeIdentifier(
      dto.empresa_slug || queryValue(['empresa_slug', 'empresaSlug', 'slug', 'empresa']),
    );
    if (empresaSlug) {
      const empresa = await this.empresaRepository.findOne({
        where: { slug: empresaSlug, ativo: true },
        select: ['id'],
      });
      if (empresa?.id) {
        return empresa.id;
      }
    }

    const empresaSubdominio = this.normalizeIdentifier(
      dto.empresa_subdominio ||
        queryValue(['empresa_subdominio', 'empresaSubdominio', 'subdominio']) ||
        this.extractSubdominioFromHost(context?.host),
    );
    if (empresaSubdominio) {
      const empresa = await this.empresaRepository.findOne({
        where: { subdominio: empresaSubdominio, ativo: true },
        select: ['id'],
      });
      if (empresa?.id) {
        return empresa.id;
      }
    }

    throw new BadRequestException(
      'Captura publica de lead requer identificacao da empresa (empresa_id, slug ou subdominio).',
    );
  }

  /**
   * Capturar lead de formulario publico (sem autenticacao)
   */
  async captureFromPublic(
    dto: CaptureLeadDto,
    context?: {
      host?: string;
      query?: Record<string, unknown>;
    },
  ): Promise<Lead> {
    try {
      const empresaId = await this.resolveEmpresaIdForPublicCapture(dto, context);
      return await this.create(
        {
          nome: dto.nome,
          email: dto.email,
          telefone: dto.telefone,
          empresa_nome: dto.empresa_nome,
          observacoes: dto.mensagem,
          origem: OrigemLead.FORMULARIO,
        },
        empresaId,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logError('[LeadsService.captureFromPublic] erro ao capturar lead publico', error);
      throw new InternalServerErrorException('Erro ao capturar lead', error.message);
    }
  }

  /**
   * Criar novo lead
   */
  async create(dto: CreateLeadDto, empresaId: string): Promise<Lead> {
    try {
      this.logger.debug(`[LeadsService.create] empresaId=${empresaId}`);

      const sanitizedDto = this.sanitizeLeadInput(dto);
      this.logger.debug(`[LeadsService.create] payload=${JSON.stringify(this.buildLeadPayloadLogMeta(sanitizedDto))}`);
      const origemBanco = await this.mapearOrigemLeadParaBanco(sanitizedDto.origem as string);
      const statusBanco = await this.mapearStatusLeadParaBanco(sanitizedDto.status as string);

      const lead = this.leadsRepository.create({
        ...sanitizedDto,
        empresaId,
        status: statusBanco as any,
        origem: origemBanco as any,
      });
      this.logger.debug(`[LeadsService.create] lead-before-save=${JSON.stringify(this.buildLeadEntityLogMeta(lead))}`);

      // Calcular score inicial
      lead.score = this.calcularScore(lead);

      const savedLead = await this.leadsRepository.save(lead);
      this.logger.log(`[LeadsService.create] lead salvo id=${savedLead.id}`);

      // Buscar com relacionamentos
      return await this.findOne(savedLead.id, empresaId);
    } catch (error) {
      const detail = (error as any)?.detail || (error as Error).message;
      this.logError('[LeadsService.create] erro ao criar lead', error);

      // Se for erro de validação do BadRequestException, propagar
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        detail ? `Erro ao criar lead: ${detail}` : 'Erro ao criar lead',
      );
    }
  }

  /**
   * Listar todos os leads com filtros
   */
  async findAll(empresaId: string, filtros?: LeadFiltros): Promise<any> {
    try {
      this.logger.debug(`[LeadsService.findAll] filtros=${JSON.stringify(this.buildFiltrosLogMeta(empresaId, filtros))}`);

      const page = filtros?.page || 1;
      const limit = filtros?.limit || 50;
      const skip = (page - 1) * limit;

      const query = this.leadsRepository
        .createQueryBuilder('lead')
        .leftJoinAndSelect('lead.responsavel', 'responsavel')
        .where('lead.empresa_id = :empresa_id', { empresa_id: empresaId });

      // Filtros
      if (filtros?.status) {
        const statusFiltro = filtros.status.toString().trim().toLowerCase();
        if (statusFiltro === 'operacionais' || statusFiltro === 'abertos') {
          query.andWhere('lead.status <> :statusConvertidoFiltro', {
            statusConvertidoFiltro: await this.mapearStatusLeadParaBanco(StatusLead.CONVERTIDO),
          });
        } else {
          query.andWhere('lead.status = :status', {
            status: await this.mapearStatusLeadParaBanco(statusFiltro),
          });
        }
      }

      if (filtros?.origem) {
        query.andWhere('lead.origem = :origem', {
          origem: await this.mapearOrigemLeadParaBanco(filtros.origem as string),
        });
      }

      if (filtros?.responsavel_id) {
        query.andWhere('lead.responsavel_id = :responsavel_id', {
          responsavel_id: filtros.responsavel_id,
        });
      }

      if (filtros?.dataInicio && filtros?.dataFim) {
        query.andWhere('lead.created_at BETWEEN :dataInicio AND :dataFim', {
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
        });
      }

      // Busca por texto
      if (filtros?.busca) {
        query.andWhere(
          '(lead.nome ILIKE :busca OR lead.email ILIKE :busca OR lead.empresa_nome ILIKE :busca)',
          { busca: `%${filtros.busca}%` },
        );
      }

      // Aplicar paginação
      query.skip(skip).take(limit);

      const statusQualificado = await this.mapearStatusLeadParaBanco(StatusLead.QUALIFICADO);
      const statusContatado = await this.mapearStatusLeadParaBanco(StatusLead.CONTATADO);
      const statusNovo = await this.mapearStatusLeadParaBanco(StatusLead.NOVO);
      const statusDesqualificado = await this.mapearStatusLeadParaBanco(
        StatusLead.DESQUALIFICADO,
      );
      const statusConvertido = await this.mapearStatusLeadParaBanco(StatusLead.CONVERTIDO);

      query
        .addSelect(
          `
            CASE
              WHEN lead.status = :statusQualificado THEN 0
              WHEN lead.status = :statusContatado THEN 1
              WHEN lead.status = :statusNovo THEN 2
              WHEN lead.status = :statusDesqualificado THEN 3
              WHEN lead.status = :statusConvertido THEN 4
              ELSE 5
            END
          `,
          'lead_status_prioridade',
        )
        .orderBy('lead.responsavel_id', 'ASC', 'NULLS FIRST')
        .addOrderBy('lead_status_prioridade', 'ASC')
        .addOrderBy('lead.score', 'DESC')
        .addOrderBy('lead.updated_at', 'DESC')
        .addOrderBy('lead.created_at', 'DESC')
        .setParameters({
          statusQualificado,
          statusContatado,
          statusNovo,
          statusDesqualificado,
          statusConvertido,
        });

      const [leads, total] = await query.getManyAndCount();
      const leadsNormalizados = leads.map((lead) => this.normalizarLeadDoBanco(lead));
      this.logger.debug(`[LeadsService.findAll] resultado=${JSON.stringify({ total, page, limit, totalPages: Math.ceil(total / limit), retornados: leadsNormalizados.length, ids: leadsNormalizados.map((l) => l.id) })}`);

      return {
        data: leadsNormalizados,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {      this.logError('[LeadsService.findAll] erro ao listar leads', error);
      throw new InternalServerErrorException('Erro ao listar leads', error.message);
    }
  }

  /**
   * Buscar lead por ID
   */
  async findOne(id: string, empresaId: string, normalizeResponse: boolean = true): Promise<Lead> {
    try {
      const lead = await this.leadsRepository.findOne({
        where: {
          id,
          empresaId,
        },
        relations: ['responsavel'],
      });

      if (!lead) {
        throw new NotFoundException(`Lead com ID ${id} não encontrado`);
      }

      return normalizeResponse ? this.normalizarLeadDoBanco(lead) : lead;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logError('[LeadsService.findOne] erro ao buscar lead', error);
      throw new InternalServerErrorException('Erro ao buscar lead', error.message);
    }
  }

  /**
   * Atualizar lead
   */
  async update(id: string, dto: UpdateLeadDto, empresaId: string): Promise<Lead> {
    try {
      const lead = await this.findOne(id, empresaId, false);

      const sanitizedDto = this.sanitizeLeadInput(dto);
      if (sanitizedDto.status !== undefined) {
        sanitizedDto.status = (await this.mapearStatusLeadParaBanco(
          sanitizedDto.status as string,
        )) as any;
      }
      if (sanitizedDto.origem !== undefined) {
        sanitizedDto.origem = (await this.mapearOrigemLeadParaBanco(
          sanitizedDto.origem as string,
        )) as any;
      }
      Object.assign(lead, sanitizedDto);

      // Recalcular score se campos relevantes mudaram
      if (
        sanitizedDto.email !== undefined ||
        sanitizedDto.telefone !== undefined ||
        sanitizedDto.observacoes !== undefined
      ) {
        lead.score = this.calcularScore(lead);
      }

      await this.leadsRepository.save(lead);

      return await this.findOne(id, empresaId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logError('[LeadsService.update] erro ao atualizar lead', error);
      throw new InternalServerErrorException('Erro ao atualizar lead', error.message);
    }
  }

  /**
   * Remover lead
   */
  async remove(id: string, empresaId: string): Promise<void> {
    try {
      const lead = await this.findOne(id, empresaId, false);

      if (lead.status === StatusLead.CONVERTIDO) {
        throw new BadRequestException('Não é possível deletar um lead já convertido');
      }

      await this.leadsRepository.remove(lead);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logError('[LeadsService.remove] erro ao remover lead', error);
      throw new InternalServerErrorException('Erro ao remover lead', error.message);
    }
  }

  /**
   * Converter lead em oportunidade
   */
  async converterParaOportunidade(
    leadId: string,
    dto: ConvertLeadDto,
    empresaId: string,
    actorUserId?: string,
  ): Promise<Oportunidade> {
    try {
      const lead = await this.findOne(leadId, empresaId, false);

      if (lead.status === StatusLead.CONVERTIDO) {
        throw new BadRequestException('Lead já foi convertido anteriormente');
      }

      const tituloOportunidade =
        this.normalizeIdentifier(dto.titulo) ||
        this.normalizeIdentifier(dto.titulo_oportunidade) ||
        `${lead.nome}${lead.empresa_nome ? ` - ${lead.empresa_nome}` : ''}`;

      const descricaoOportunidade =
        this.normalizeIdentifier(dto.descricao) ||
        this.normalizeIdentifier(dto.observacoes) ||
        this.normalizeIdentifier(lead.observacoes) ||
        `Lead convertido: ${lead.nome}`;

      const dataFechamentoEsperado =
        this.normalizeIdentifier(dto.dataFechamentoEsperado) ||
        this.normalizeIdentifier(dto.data_fechamento_prevista);

      const valorOportunidade =
        dto.valor !== undefined && dto.valor !== null
          ? dto.valor
          : dto.valor_estimado !== undefined && dto.valor_estimado !== null
            ? dto.valor_estimado
            : 0;
      const responsavelConversao =
        this.normalizeIdentifier((dto as any).responsavel_id) ||
        this.normalizeIdentifier(lead.responsavel_id) ||
        this.normalizeIdentifier(actorUserId);

      if (!responsavelConversao) {
        throw new BadRequestException(
          'Nao foi possivel converter o lead sem usuario responsavel definido.',
        );
      }

      // Criar oportunidade usando OportunidadesService (schema-aware e compativel com bancos legados)
      const savedOportunidade = await this.oportunidadesService.create(
        {
          titulo: tituloOportunidade,
          descricao: descricaoOportunidade,
          valor: valorOportunidade,
          probabilidade: 20,
          estagio: this.mapearEstagioParaBanco(
            (dto.estagio as EstagioOportunidade) || EstagioOportunidade.LEADS,
          ),
          prioridade: PrioridadeOportunidade.MEDIA,
          origem: this.mapearOrigemLeadParaOportunidade(lead.origem),
          responsavel_id: responsavelConversao as any,
          nomeContato: lead.nome,
          emailContato: lead.email,
          telefoneContato: lead.telefone,
          empresaContato: lead.empresa_nome,
          dataFechamentoEsperado,
        } as any,
        empresaId,
      );

      // Atualizar lead
      lead.responsavel_id = lead.responsavel_id || responsavelConversao;
      lead.status = StatusLead.CONVERTIDO;
      lead.oportunidade_id = savedOportunidade.id.toString();
      lead.convertido_em = new Date();
      await this.leadsRepository.save(lead);

      return savedOportunidade;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logError('[LeadsService.converterParaOportunidade] erro ao converter lead', error);
      throw new InternalServerErrorException('Erro ao converter lead', error.message);
    }
  }

  /**
   * Obter estatísticas de leads
   */
  async getEstatisticas(empresaId: string): Promise<LeadEstatisticas> {
    try {
      this.logger.debug(`[LeadsService.getEstatisticas] empresaId=${empresaId}`);

      // Buscar todos os leads (sem paginação para estatísticas)
      const result = await this.findAll(empresaId, { limit: 10000 }); // Limite alto para pegar todos
      const leads = result.data;
      this.logger.debug(`[LeadsService.getEstatisticas] leads encontrados=${leads.length}`);

      const total = leads.length;
      const novos = leads.filter((l) => l.status === StatusLead.NOVO).length;
      const contatados = leads.filter((l) => l.status === StatusLead.CONTATADO).length;
      const qualificados = leads.filter((l) => l.status === StatusLead.QUALIFICADO).length;
      const desqualificados = leads.filter((l) => l.status === StatusLead.DESQUALIFICADO).length;
      const convertidos = leads.filter((l) => l.status === StatusLead.CONVERTIDO).length;

      const taxaConversao = total > 0 ? (convertidos / total) * 100 : 0;

      const scoreMedio =
        total > 0 ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / total) : 0;

      // Agrupamento por origem
      const origemMap = new Map<string, number>();
      leads.forEach((lead) => {
        const origem = lead.origem || 'outro';
        origemMap.set(origem, (origemMap.get(origem) || 0) + 1);
      });
      const porOrigem = Array.from(origemMap.entries()).map(([origem, quantidade]) => ({
        origem,
        quantidade,
      }));

      // Agrupamento por responsável
      const responsavelMap = new Map<string, { nome: string; quantidade: number }>();
      leads.forEach((lead) => {
        if (lead.responsavel_id) {
          const key = lead.responsavel_id;
          const existing = responsavelMap.get(key);
          if (existing) {
            existing.quantidade++;
          } else {
            responsavelMap.set(key, {
              nome: lead.responsavel?.nome || 'Desconhecido',
              quantidade: 1,
            });
          }
        }
      });
      const porResponsavel = Array.from(responsavelMap.entries()).map(([responsavel_id, data]) => ({
        responsavel_id,
        responsavel_nome: data.nome,
        quantidade: data.quantidade,
      }));

      const estatisticas = {
        total,
        novos,
        contatados,
        qualificados,
        desqualificados,
        convertidos,
        taxaConversao,
        scoreMedio,
        porOrigem,
        porResponsavel,
      };      this.logger.debug(`[LeadsService.getEstatisticas] estatisticas=${JSON.stringify(estatisticas)}`);

      return estatisticas;
    } catch (error) {      this.logError('[LeadsService.getEstatisticas] erro ao obter estat?sticas', error);
      throw new InternalServerErrorException('Erro ao obter estatísticas', error.message);
    }
  }

  /**
   * Calcular score de qualificação do lead (0-100)
   * Algoritmo simples baseado em completude de dados
   */
  private calcularScore(lead: Lead): number {
    let score = 0;

    // Nome é obrigatório, mas não conta no score
    if (lead.email) score += 25;
    if (lead.telefone) score += 25;
    if (lead.empresa_nome) score += 20;
    if (lead.observacoes && lead.observacoes.length > 10) score += 15;
    if (lead.status === StatusLead.CONTATADO) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Import de leads via CSV
   */
  async importFromCsv(csvContent: string, empresaId: string): Promise<ImportLeadResult> {
    const result: ImportLeadResult = {
      total: 0,
      importados: 0,
      erros: 0,
      detalhes: [],
    };

    try {
      // Parse CSV usando papaparse
      const parseResult = Papa.parse<ImportLeadRow>(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      });

      if (parseResult.errors.length > 0) {
        throw new BadRequestException(
          `Erro ao fazer parse do CSV: ${parseResult.errors[0].message}`,
        );
      }

      const rows = parseResult.data;
      result.total = rows.length;
      const statusNovoBanco = await this.mapearStatusLeadParaBanco(StatusLead.NOVO);
      const origemImportacaoBanco = await this.mapearOrigemLeadParaBanco(OrigemLead.IMPORTACAO);

      // Processar cada linha
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const linha = i + 2; // +2 porque linha 1 é header e index começa em 0

        try {
          // Validação básica
          if (!row.nome || row.nome.trim().length === 0) {
            throw new Error('Nome é obrigatório');
          }

          // Validar origem se fornecida
          const origem = row.origem
            ? await this.mapearOrigemLeadParaBanco(row.origem)
            : origemImportacaoBanco;

          // Buscar responsável por email se fornecido
          let responsavel_id: string | undefined;
          if (row.responsavel_email) {
            const responsavel = await this.leadsRepository.manager.findOne(User, {
              where: {
                email: row.responsavel_email,
                empresa_id: empresaId,
              },
            });
            if (responsavel) {
              responsavel_id = responsavel.id;
            }
          }

          // Criar lead
          const lead = this.leadsRepository.create({
            nome: row.nome.trim(),
            email: row.email?.trim() || undefined,
            telefone: row.telefone?.trim() || undefined,
            empresa_nome: row.empresa_nome?.trim() || undefined,
            origem: origem as any,
            observacoes: row.observacoes?.trim() || undefined,
            responsavel_id,
            empresaId,
            status: statusNovoBanco as any,
          });

          // Calcular score
          lead.score = this.calcularScore(lead);

          // Salvar no banco
          await this.leadsRepository.save(lead);
          result.importados++;
        } catch (error) {
          result.erros++;
          result.detalhes.push({
            linha,
            erro: error instanceof Error ? error.message : 'Erro desconhecido',
            dados: row,
          });
        }
      }

      return result;
    } catch (error) {
      this.logError('[LeadsService.importFromCsv] erro geral no import CSV', error);
      throw new InternalServerErrorException(
        'Erro ao importar leads',
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
    }
  }
}
