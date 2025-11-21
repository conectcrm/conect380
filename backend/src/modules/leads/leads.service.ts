import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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
import { Oportunidade, EstagioOportunidade } from '../oportunidades/oportunidade.entity';
import * as Papa from 'papaparse';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadsRepository: Repository<Lead>,
    @InjectRepository(Oportunidade)
    private readonly oportunidadesRepository: Repository<Oportunidade>,
  ) { }

  private sanitizeLeadInput<T extends Partial<CreateLeadDto> | Partial<UpdateLeadDto>>(payload: T): T {
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

  /**
   * Criar novo lead
   */
  async create(dto: CreateLeadDto, empresaId: string): Promise<Lead> {
    try {
      // Debug: verificar empresa_id
      console.log('🔍 [LeadsService.create] Empresa ID:', empresaId);

      const sanitizedDto = this.sanitizeLeadInput(dto);

      console.log('🔍 [LeadsService.create] DTO sanitizado:', sanitizedDto);

      const lead = this.leadsRepository.create({
        ...sanitizedDto,
        empresa_id: empresaId,
        status: sanitizedDto.status || StatusLead.NOVO,
        origem: sanitizedDto.origem || OrigemLead.MANUAL,
      });

      console.log('🔍 [LeadsService.create] Lead criado (antes do save):', {
        nome: lead.nome,
        email: lead.email,
        empresa_id: lead.empresa_id,
        status: lead.status,
        origem: lead.origem,
        score: lead.score,
      });

      // Calcular score inicial
      lead.score = this.calcularScore(lead);

      const savedLead = await this.leadsRepository.save(lead);

      console.log('✅ [LeadsService.create] Lead salvo com sucesso:', savedLead.id);

      // Buscar com relacionamentos
      return await this.findOne(savedLead.id, empresaId);
    } catch (error) {
      const detail = (error as any)?.detail || (error as Error).message;
      console.error('❌ [LeadsService.create] Erro ao criar lead:', {
        message: (error as any)?.message,
        code: (error as any)?.code,
        detail: (error as any)?.detail,
        stack: (error as any)?.stack,
        name: (error as any)?.name,
      });

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
   * Capturar lead de formulário público (sem autenticação)
   */
  async captureFromPublic(dto: CaptureLeadDto): Promise<Lead> {
    try {
      // Por enquanto, vamos usar uma empresa padrão para leads públicos
      // Em produção, isso deveria vir de um subdomínio ou parâmetro na URL
      const lead = this.leadsRepository.create({
        nome: dto.nome,
        email: dto.email,
        telefone: dto.telefone,
        empresa_nome: dto.empresa_nome,
        observacoes: dto.mensagem,
        origem: OrigemLead.FORMULARIO,
        status: StatusLead.NOVO,
        empresa_id: 'public-leads', // TODO: Implementar lógica de roteamento por empresa
      });

      lead.score = this.calcularScore(lead);

      return await this.leadsRepository.save(lead);
    } catch (error) {
      console.error('Erro ao capturar lead público:', error);
      throw new InternalServerErrorException('Erro ao capturar lead', error.message);
    }
  }

  /**
   * Listar todos os leads com filtros
   */
  async findAll(empresaId: string, filtros?: LeadFiltros): Promise<any> {
    try {
      console.log('🔍 [LeadsService.findAll] Buscando leads:', {
        empresa_id: empresaId,
        filtros,
      });

      const page = filtros?.page || 1;
      const limit = filtros?.limit || 50;
      const skip = (page - 1) * limit;

      const query = this.leadsRepository
        .createQueryBuilder('lead')
        .leftJoinAndSelect('lead.responsavel', 'responsavel')
        .where('lead.empresa_id = :empresa_id', { empresa_id: empresaId });

      // Filtros
      if (filtros?.status) {
        query.andWhere('lead.status = :status', { status: filtros.status });
      }

      if (filtros?.origem) {
        query.andWhere('lead.origem = :origem', { origem: filtros.origem });
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
          { busca: `%${filtros.busca}%` }
        );
      }

      // Aplicar paginação
      query.skip(skip).take(limit);
      query.orderBy('lead.created_at', 'DESC');

      const [leads, total] = await query.getManyAndCount();

      console.log('✅ [LeadsService.findAll] Leads encontrados:', {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        retornados: leads.length,
        ids: leads.map(l => l.id),
      });

      return {
        data: leads,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('❌ [LeadsService.findAll] Erro ao listar leads:', error);
      throw new InternalServerErrorException('Erro ao listar leads', error.message);
    }
  }

  /**
   * Buscar lead por ID
   */
  async findOne(id: string, empresaId: string): Promise<Lead> {
    try {
      const lead = await this.leadsRepository.findOne({
        where: {
          id,
          empresa_id: empresaId,
        },
        relations: ['responsavel', 'oportunidade'],
      });

      if (!lead) {
        throw new NotFoundException(`Lead com ID ${id} não encontrado`);
      }

      return lead;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar lead:', error);
      throw new InternalServerErrorException('Erro ao buscar lead', error.message);
    }
  }

  /**
   * Atualizar lead
   */
  async update(id: string, dto: UpdateLeadDto, empresaId: string): Promise<Lead> {
    try {
      const lead = await this.findOne(id, empresaId);

      const sanitizedDto = this.sanitizeLeadInput(dto);
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
      console.error('Erro ao atualizar lead:', error);
      throw new InternalServerErrorException('Erro ao atualizar lead', error.message);
    }
  }

  /**
   * Remover lead
   */
  async remove(id: string, empresaId: string): Promise<void> {
    try {
      const lead = await this.findOne(id, empresaId);

      if (lead.status === StatusLead.CONVERTIDO) {
        throw new BadRequestException('Não é possível deletar um lead já convertido');
      }

      await this.leadsRepository.remove(lead);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erro ao remover lead:', error);
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
  ): Promise<Oportunidade> {
    try {
      const lead = await this.findOne(leadId, empresaId);

      if (lead.status === StatusLead.CONVERTIDO) {
        throw new BadRequestException('Lead já foi convertido anteriormente');
      }

      // Criar oportunidade
      const oportunidade = this.oportunidadesRepository.create({
        titulo: `${lead.nome}${lead.empresa_nome ? ` - ${lead.empresa_nome}` : ''}`,
        descricao: dto.descricao || lead.observacoes || `Lead convertido: ${lead.nome}`,
        valor: dto.valor || 0,
        estagio: (dto.estagio as EstagioOportunidade) || EstagioOportunidade.LEADS,
        nomeContato: lead.nome,
        emailContato: lead.email,
        telefoneContato: lead.telefone,
        empresaContato: lead.empresa_nome,
        responsavel_id: lead.responsavel_id,
        probabilidade: 20, // Probabilidade inicial baixa
      });

      const savedOportunidade = await this.oportunidadesRepository.save(oportunidade);

      // Atualizar lead
      lead.status = StatusLead.CONVERTIDO;
      lead.oportunidade_id = savedOportunidade.id.toString();
      lead.convertido_em = new Date();
      await this.leadsRepository.save(lead);

      return savedOportunidade;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('Erro ao converter lead:', error);
      throw new InternalServerErrorException('Erro ao converter lead', error.message);
    }
  }

  /**
   * Obter estatísticas de leads
   */
  async getEstatisticas(empresaId: string): Promise<LeadEstatisticas> {
    try {
      console.log('🔍 [LeadsService.getEstatisticas] Calculando estatísticas para empresa:', empresaId);

      // Buscar todos os leads (sem paginação para estatísticas)
      const result = await this.findAll(empresaId, { limit: 10000 }); // Limite alto para pegar todos
      const leads = result.data;

      console.log('🔍 [LeadsService.getEstatisticas] Leads encontrados:', leads.length);

      const total = leads.length;
      const novos = leads.filter(l => l.status === StatusLead.NOVO).length;
      const contatados = leads.filter(l => l.status === StatusLead.CONTATADO).length;
      const qualificados = leads.filter(l => l.status === StatusLead.QUALIFICADO).length;
      const desqualificados = leads.filter(l => l.status === StatusLead.DESQUALIFICADO).length;
      const convertidos = leads.filter(l => l.status === StatusLead.CONVERTIDO).length;

      const taxaConversao = total > 0 ? (convertidos / total) * 100 : 0;

      const scoreMedio = total > 0
        ? Math.round(leads.reduce((sum, lead) => sum + lead.score, 0) / total)
        : 0;

      // Agrupamento por origem
      const origemMap = new Map<string, number>();
      leads.forEach(lead => {
        const origem = lead.origem || 'outro';
        origemMap.set(origem, (origemMap.get(origem) || 0) + 1);
      });
      const porOrigem = Array.from(origemMap.entries()).map(([origem, quantidade]) => ({
        origem,
        quantidade,
      }));

      // Agrupamento por responsável
      const responsavelMap = new Map<string, { nome: string; quantidade: number }>();
      leads.forEach(lead => {
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
      const porResponsavel = Array.from(responsavelMap.entries()).map(
        ([responsavel_id, data]) => ({
          responsavel_id,
          responsavel_nome: data.nome,
          quantidade: data.quantidade,
        }),
      );

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
      };

      console.log('✅ [LeadsService.getEstatisticas] Estatísticas calculadas:', estatisticas);

      return estatisticas;
    } catch (error) {
      console.error('❌ [LeadsService.getEstatisticas] Erro ao obter estatísticas:', error);
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
  async importFromCsv(
    csvContent: string,
    empresaId: string,
  ): Promise<ImportLeadResult> {
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
          let origem = OrigemLead.IMPORTACAO;
          if (row.origem) {
            const origemUpper = row.origem.toUpperCase();
            if (Object.values(OrigemLead).includes(origemUpper as OrigemLead)) {
              origem = origemUpper as OrigemLead;
            }
          }

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
            origem,
            observacoes: row.observacoes?.trim() || undefined,
            responsavel_id,
            empresa_id: empresaId,
            status: StatusLead.NOVO,
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
      console.error('Erro geral no import CSV:', error);
      throw new InternalServerErrorException(
        'Erro ao importar leads',
        error instanceof Error ? error.message : 'Erro desconhecido',
      );
    }
  }
}
