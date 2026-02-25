import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { randomUUID } from 'crypto';
import { Proposta as PropostaEntity } from './proposta.entity';
import { User } from '../users/user.entity';
import { Cliente } from '../clientes/cliente.entity';

export interface Proposta {
  id: string;
  numero: string;
  titulo?: string;
  cliente: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
    documento?: string;
    status?: string;
  };
  produtos: Array<{
    id: string;
    nome: string;
    precoUnitario: number;
    quantidade: number;
    desconto: number;
    subtotal: number;
  }>;
  subtotal: number;
  descontoGlobal: number;
  impostos: number;
  total: number;
  valor: number; // Alias para total (compatibilidade com DTO)
  formaPagamento: 'avista' | 'boleto' | 'cartao' | 'pix' | 'recorrente';
  validadeDias: number;
  observacoes?: string;
  incluirImpostosPDF: boolean;
  status: 'rascunho' | 'enviada' | 'visualizada' | 'aprovada' | 'rejeitada' | 'expirada';
  dataVencimento?: string;
  criadaEm: string;
  atualizadaEm: string;
  createdAt: string; // Alias para criadaEm (compatibilidade com DTO)
  updatedAt: string; // Alias para atualizadaEm (compatibilidade com DTO)
  source?: string;
  vendedor?:
    | {
        id: string;
        nome: string;
        email: string;
        tipo: string;
        ativo: boolean;
      }
    | string;
  portalAccess?: {
    accessedAt?: string;
    ip?: string;
    userAgent?: string;
  };
  emailDetails?: {
    sentAt?: string;
    emailCliente?: string;
    linkPortal?: string;
  };
}

@Injectable()
export class PropostasService {
  private readonly logger = new Logger(PropostasService.name);
  private contadorId = 1;
  private tableColumnsCache = new Map<string, Set<string>>();

  constructor(
    @InjectRepository(PropostaEntity)
    private propostaRepository: Repository<PropostaEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
  ) {
    // Inicializar contador baseado nas propostas existentes
    this.inicializarContador();
  }

  private maskEmail(email?: string | null): string {
    if (!email) return '[email]';
    const [local, domain] = String(email).split('@');
    if (!domain) return '[email]';
    const localMasked =
      local.length <= 2 ? `${local[0] || '*'}*` : `${local.slice(0, 2)}***${local.slice(-1)}`;
    return `${localMasked}@${domain}`;
  }

  private summarizeText(text?: string | null, max = 60): string {
    if (!text) return '[vazio]';
    const normalized = String(text).replace(/\s+/g, ' ').trim();
    if (!normalized) return '[vazio]';
    return normalized.length > max ? `${normalized.slice(0, max)}...` : normalized;
  }

  private async inicializarContador() {
    try {
      // Importante: não usar findOne() aqui.
      // Em ambientes com schema legado, o entity atual pode conter colunas ainda não existentes
      // (ex.: cliente/produtos em JSONB). Então buscamos apenas o campo `numero`.
      const ultima = await this.propostaRepository
        .createQueryBuilder('p')
        .select('p.numero', 'numero')
        .orderBy('p.numero', 'DESC')
        .limit(1)
        .getRawOne<{ numero?: string }>();

      if (ultima?.numero) {
        const numeroMatch = ultima.numero.match(/(\d+)$/);
        if (numeroMatch) {
          this.contadorId = parseInt(numeroMatch[1]) + 1;
        }
      }
    } catch (error) {
      this.logger.warn(`Erro ao inicializar contador de propostas: ${error.message}`);
    }
  }

  private async getTableColumns(tableName: string): Promise<Set<string>> {
    if (this.tableColumnsCache.has(tableName)) {
      return this.tableColumnsCache.get(tableName)!;
    }

    const rows: Array<{ column_name?: string }> = await this.propostaRepository.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
      `,
      [tableName],
    );

    const columns = new Set(
      rows
        .map((row) => row.column_name)
        .filter((columnName): columnName is string => Boolean(columnName)),
    );

    this.tableColumnsCache.set(tableName, columns);
    return columns;
  }

  private isLegacyPropostasSchema(columns: Set<string>): boolean {
    return !columns.has('cliente');
  }

  private toIsoString(value: unknown): string {
    if (!value) {
      return new Date().toISOString();
    }

    const parsed = value instanceof Date ? value : new Date(value as string);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString();
    }

    return parsed.toISOString();
  }

  private normalizeStatusToDatabase(status: string | undefined, legacySchema: boolean): string {
    const normalized = (status || '').toString().toLowerCase().trim();

    if (!legacySchema) {
      return normalized || 'rascunho';
    }

    switch (normalized) {
      case 'aprovada':
      case 'aceita':
        return 'aceita';
      case 'visualizada':
      case 'enviada':
        return 'enviada';
      case 'rejeitada':
      case 'expirada':
      case 'rascunho':
        return normalized;
      default:
        return 'rascunho';
    }
  }

  private normalizeStatusFromDatabase(status: string | undefined): Proposta['status'] {
    const normalized = (status || '').toString().toLowerCase().trim();
    if (normalized === 'aceita') {
      return 'aprovada';
    }
    if (
      normalized === 'rascunho' ||
      normalized === 'enviada' ||
      normalized === 'visualizada' ||
      normalized === 'aprovada' ||
      normalized === 'rejeitada' ||
      normalized === 'expirada'
    ) {
      return normalized;
    }
    return 'rascunho';
  }

  private async resolveFallbackUserId(empresaId: string): Promise<string> {
    const usersRows: Array<{ id?: string }> = await this.propostaRepository.query(
      `
        SELECT id
        FROM users
        WHERE empresa_id = $1
        ORDER BY COALESCE(criado_em, NOW()) DESC
        LIMIT 1
      `,
      [empresaId],
    );

    return usersRows?.[0]?.id || randomUUID();
  }

  private async ensureLegacyOportunidadeId(
    empresaId: string,
    titulo: string,
    valor: number,
    vendedorId: string | null,
  ): Promise<string> {
    const oportunidadeColumns = await this.getTableColumns('oportunidades');
    const userColumn = oportunidadeColumns.has('usuario_id')
      ? 'usuario_id'
      : oportunidadeColumns.has('responsavel_id')
        ? 'responsavel_id'
        : null;

    const insertColumns: string[] = ['empresa_id', 'titulo', 'valor'];
    const insertValues: unknown[] = [empresaId, titulo, valor];

    if (userColumn) {
      insertColumns.push(userColumn);
      insertValues.push(vendedorId || (await this.resolveFallbackUserId(empresaId)));
    }

    if (oportunidadeColumns.has('estagio')) {
      insertColumns.push('estagio');
      insertValues.push('lead');
    }

    if (oportunidadeColumns.has('probabilidade')) {
      insertColumns.push('probabilidade');
      insertValues.push(0);
    }

    const placeholders = insertValues.map((_, index) => `$${index + 1}`).join(', ');
    const result: Array<{ id: string }> = await this.propostaRepository.query(
      `
        INSERT INTO oportunidades (${insertColumns.map((column) => `"${column}"`).join(', ')})
        VALUES (${placeholders})
        RETURNING id
      `,
      insertValues,
    );

    return result?.[0]?.id || randomUUID();
  }

  private buildLegacyInterface(
    row: any,
    overrides: Partial<Proposta> = {},
    defaultClienteNome = 'Cliente nao informado',
  ): Proposta {
    const valor = Number(row?.valor ?? overrides.valor ?? 0);
    const total = Number(overrides.total ?? overrides.valor ?? row?.total ?? valor);
    const subtotal = Number(overrides.subtotal ?? total);
    const descontoGlobal = Number(overrides.descontoGlobal ?? row?.descontoGlobal ?? 0);
    const impostos = Number(overrides.impostos ?? row?.impostos ?? 0);
    const criadaEmIso = this.toIsoString(
      row?.criado_em ?? row?.criadaEm ?? overrides.criadaEm ?? overrides.createdAt,
    );
    const atualizadaEmIso = this.toIsoString(
      row?.atualizado_em ?? row?.atualizadaEm ?? overrides.atualizadaEm ?? overrides.updatedAt,
    );
    const dataVencimentoIso = row?.validade
      ? this.toIsoString(row.validade)
      : overrides.dataVencimento;

    const clienteFallback: Proposta['cliente'] = {
      id: 'cliente-legacy',
      nome: defaultClienteNome,
      email: '',
    };

    const cliente =
      overrides.cliente && typeof overrides.cliente === 'object' ? overrides.cliente : clienteFallback;

    return {
      id: row?.id ?? overrides.id ?? randomUUID(),
      numero: row?.numero ?? overrides.numero ?? this.gerarNumero(),
      titulo: row?.titulo ?? overrides.titulo,
      cliente,
      produtos: overrides.produtos ?? [],
      subtotal,
      descontoGlobal,
      impostos,
      total,
      valor,
      formaPagamento: overrides.formaPagamento ?? 'avista',
      validadeDias: overrides.validadeDias ?? 30,
      observacoes: overrides.observacoes ?? row?.descricao ?? undefined,
      incluirImpostosPDF: overrides.incluirImpostosPDF ?? false,
      status: this.normalizeStatusFromDatabase(row?.status ?? (overrides.status as string)),
      dataVencimento: dataVencimentoIso,
      criadaEm: criadaEmIso,
      atualizadaEm: atualizadaEmIso,
      createdAt: criadaEmIso,
      updatedAt: atualizadaEmIso,
      source: overrides.source ?? row?.source ?? 'api',
      vendedor: overrides.vendedor,
      portalAccess: overrides.portalAccess,
      emailDetails: overrides.emailDetails,
    };
  }

  /**
   * Converter entidade para interface de retorno
   */
  private entityToInterface(entity: PropostaEntity): Proposta {
    return {
      id: entity.id,
      numero: entity.numero,
      titulo: entity.titulo,
      cliente: entity.cliente,
      produtos: entity.produtos,
      subtotal: Number(entity.subtotal),
      descontoGlobal: Number(entity.descontoGlobal),
      impostos: Number(entity.impostos),
      total: Number(entity.total),
      valor: Number(entity.valor),
      formaPagamento: entity.formaPagamento as any,
      validadeDias: entity.validadeDias,
      observacoes: entity.observacoes,
      incluirImpostosPDF: entity.incluirImpostosPDF,
      status: entity.status as any,
      dataVencimento: entity.dataVencimento?.toISOString(),
      criadaEm: entity.criadaEm?.toISOString(),
      atualizadaEm: entity.atualizadaEm?.toISOString(),
      createdAt: entity.criadaEm?.toISOString(),
      updatedAt: entity.atualizadaEm?.toISOString(),
      source: entity.source,
      vendedor: entity.vendedor
        ? {
            id: entity.vendedor.id,
            nome: entity.vendedor.nome,
            email: entity.vendedor.email,
            tipo: (() => {
              const vendedorRole = (entity.vendedor.role || '').toString().toLowerCase();
              if (vendedorRole === 'admin' || vendedorRole === 'superadmin') return 'admin';
              if (vendedorRole === 'gerente' || vendedorRole === 'manager') return 'gerente';
              return 'vendedor';
            })(),
            ativo: entity.vendedor.ativo,
          }
        : entity.vendedor_id,
      portalAccess: entity.portalAccess || undefined,
      emailDetails: entity.emailDetails || undefined,
    };
  }

  private gerarId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    return `PROP-2025-${timestamp}-${random}`;
  }

  private gerarNumero(): string {
    return `PROP-2025-${this.contadorId.toString().padStart(3, '0')}`;
  }

  /**
   * Lista todas as propostas
   */
  async listarPropostas(empresaId?: string): Promise<Proposta[]> {
    try {
      const columns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(columns);

      if (legacySchema) {
        const createdColumn = columns.has('criado_em') ? 'criado_em' : 'criadaEm';
        const updatedColumn = columns.has('atualizado_em') ? 'atualizado_em' : 'atualizadaEm';
        const whereClause = empresaId ? 'WHERE p.empresa_id = $1' : '';
        const params = empresaId ? [empresaId] : [];
        const descricaoExpr = columns.has('descricao')
          ? 'p.descricao'
          : columns.has('observacoes')
            ? 'p.observacoes'
            : 'NULL';
        const validadeExpr = columns.has('validade')
          ? 'p.validade'
          : columns.has('dataVencimento')
            ? 'p."dataVencimento"'
            : 'NULL';

        const rows: any[] = await this.propostaRepository.query(
          `
            SELECT
              p.id,
              p.numero,
              p.titulo,
              p.valor,
              p.status,
              ${descricaoExpr} AS descricao,
              ${validadeExpr} AS validade,
              p.${createdColumn} AS criado_em,
              p.${updatedColumn} AS atualizado_em
            FROM propostas p
            ${whereClause}
            ORDER BY p.${createdColumn} DESC
          `,
          params,
        );

        return rows.map((row) => this.buildLegacyInterface(row));
      }

      const entities = await this.propostaRepository.find({
        where: empresaId ? { empresaId } : undefined,
        order: { criadaEm: 'DESC' },
        relations: columns.has('vendedor_id') ? ['vendedor'] : [],
      });

      this.logger.debug(`${entities.length} propostas encontradas no banco`);
      return entities.map((entity) => this.entityToInterface(entity));
    } catch (error) {
      this.logger.error('Erro ao listar propostas', error?.stack || String(error));
      return [];
    }
  }

  /**
   * Obtém uma proposta específica
   */
  async obterProposta(id: string, empresaId?: string): Promise<Proposta | null> {
    try {
      const columns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(columns);

      if (legacySchema) {
        const createdColumn = columns.has('criado_em') ? 'criado_em' : 'criadaEm';
        const updatedColumn = columns.has('atualizado_em') ? 'atualizado_em' : 'atualizadaEm';
        const whereClause = empresaId
          ? 'WHERE p.id = $1 AND p.empresa_id = $2'
          : 'WHERE p.id = $1';
        const params = empresaId ? [id, empresaId] : [id];
        const descricaoExpr = columns.has('descricao')
          ? 'p.descricao'
          : columns.has('observacoes')
            ? 'p.observacoes'
            : 'NULL';
        const validadeExpr = columns.has('validade')
          ? 'p.validade'
          : columns.has('dataVencimento')
            ? 'p."dataVencimento"'
            : 'NULL';

        const rows: any[] = await this.propostaRepository.query(
          `
            SELECT
              p.id,
              p.numero,
              p.titulo,
              p.valor,
              p.status,
              ${descricaoExpr} AS descricao,
              ${validadeExpr} AS validade,
              p.${createdColumn} AS criado_em,
              p.${updatedColumn} AS atualizado_em
            FROM propostas p
            ${whereClause}
            LIMIT 1
          `,
          params,
        );

        if (!rows?.[0]) {
          return null;
        }

        return this.buildLegacyInterface(rows[0]);
      }

      const entity = await this.propostaRepository.findOne({
        where: empresaId ? { id, empresaId } : { id },
        relations: columns.has('vendedor_id') ? ['vendedor'] : [],
      });

      return entity ? this.entityToInterface(entity) : null;
    } catch (error) {
      this.logger.error('Erro ao obter proposta', error?.stack || String(error));
      return null;
    }
  }

  /**
   * Cria uma nova proposta
   */
  async criarProposta(dadosProposta: Partial<Proposta>, empresaId?: string): Promise<Proposta> {
    try {
      const numero = this.gerarNumero();
      this.contadorId++;
      const empresaIdProposta =
        empresaId ?? (dadosProposta as any).empresaId ?? (dadosProposta as any).empresa_id;

      // Buscar vendedor pelo nome para obter o UUID
      let vendedorId = null;
      if (dadosProposta.vendedor) {
        // Se vendedor for um objeto, usar o ID direto
        if (typeof dadosProposta.vendedor === 'object' && dadosProposta.vendedor.id) {
          vendedorId = dadosProposta.vendedor.id;
          this.logger.debug(`Vendedor recebido (objeto): ${JSON.stringify({ nome: this.summarizeText((dadosProposta.vendedor as any).nome, 40), vendedorId })}`);
        } else {
          // Se vendedor for uma string, buscar pelo nome
          const nomeVendedor =
            typeof dadosProposta.vendedor === 'string'
              ? dadosProposta.vendedor
              : dadosProposta.vendedor.nome;

          const vendedor = await this.userRepository.findOne({
            where: empresaIdProposta
              ? { nome: nomeVendedor, empresa_id: empresaIdProposta }
              : { nome: nomeVendedor },
          });

          if (vendedor) {
            vendedorId = vendedor.id;
            this.logger.debug(`Vendedor encontrado por nome: ${JSON.stringify({ nome: this.summarizeText(nomeVendedor, 40), vendedorId })}`);
          } else {
            this.logger.warn(`Vendedor nao encontrado: ${this.summarizeText(nomeVendedor, 40)}`);
          }
        }
      }

      // Processar cliente baseado no tipo de dados recebido
      let clienteProcessado;
      if (typeof dadosProposta.cliente === 'string') {
        // 🔍 BUSCAR CLIENTE REAL NO BANCO ao invés de gerar email fictício
        const nomeCliente = dadosProposta.cliente as string;
        this.logger.debug(`Buscando cliente real por nome: ${this.summarizeText(nomeCliente, 50)}`);

        try {
          // Buscar cliente real pelo nome (busca flexível)
          const clienteReal = await this.clienteRepository.findOne({
            where: empresaIdProposta
              ? [
                  { nome: Like(`%${nomeCliente}%`), empresaId: empresaIdProposta },
                  { nome: nomeCliente, empresaId: empresaIdProposta },
                ]
              : [{ nome: Like(`%${nomeCliente}%`) }, { nome: nomeCliente }],
          });

          if (clienteReal) {
            this.logger.debug(`Cliente real encontrado: ${JSON.stringify({ clienteId: clienteReal.id, nome: this.summarizeText(clienteReal.nome, 50), email: this.maskEmail(clienteReal.email) })}`);
            clienteProcessado = {
              id: clienteReal.id,
              nome: clienteReal.nome,
              email: clienteReal.email, // ✅ USAR EMAIL REAL
              telefone: clienteReal.telefone, // ✅ USAR TELEFONE REAL
              documento: clienteReal.documento || '',
              status: clienteReal.status || 'lead',
            };
          } else {
            this.logger.warn(`Cliente nao encontrado no cadastro: ${this.summarizeText(nomeCliente, 50)}`);
            // ✅ NÃO gerar email fictício - deixar vazio para busca posterior
            clienteProcessado = {
              id: 'cliente-temp',
              nome: nomeCliente,
              email: '', // ← DEIXAR VAZIO ao invés de gerar fictício
              telefone: '',
              documento: '',
              status: 'lead',
            };
          }
        } catch (error) {
          this.logger.error('Erro ao buscar cliente no banco', error?.stack || String(error));
          // Fallback sem email fictício
          clienteProcessado = {
            id: 'cliente-temp',
            nome: nomeCliente,
            email: '', // ← NÃO gerar email fictício
            telefone: '',
            documento: '',
            status: 'lead',
          };
        }
      } else if (dadosProposta.cliente && typeof dadosProposta.cliente === 'object') {
        // Se é objeto, usar como está
        clienteProcessado = dadosProposta.cliente;
      } else {
        // Fallback para cliente padrão SEM EMAIL FICTÍCIO
        clienteProcessado = {
          id: 'cliente-default',
          nome: 'Cliente Temporário',
          email: '', // ✅ NÃO gerar email fictício
          telefone: '',
          documento: '',
          status: 'lead',
        };
      }

      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);

      if (legacySchema) {
        const titulo = dadosProposta.titulo || `Proposta ${numero}`;
        const valor = Number(dadosProposta.valor || dadosProposta.total || 0);
        const validadeDias = dadosProposta.validadeDias || 30;
        const dataVencimento =
          dadosProposta.dataVencimento ||
          new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000).toISOString();
        const insertColumns: string[] = ['empresa_id', 'numero', 'titulo', 'valor', 'status'];
        const insertValues: unknown[] = [
          empresaIdProposta,
          numero,
          titulo,
          valor,
          this.normalizeStatusToDatabase(dadosProposta.status, true),
        ];

        if (propostaColumns.has('oportunidade_id')) {
          insertColumns.push('oportunidade_id');
          insertValues.push(
            await this.ensureLegacyOportunidadeId(empresaIdProposta, titulo, valor, vendedorId),
          );
        }

        if (propostaColumns.has('descricao')) {
          insertColumns.push('descricao');
          insertValues.push(dadosProposta.observacoes ?? null);
        }

        if (propostaColumns.has('validade')) {
          insertColumns.push('validade');
          insertValues.push(new Date(dataVencimento));
        }

        const placeholders = insertValues.map((_, index) => `$${index + 1}`).join(', ');
        const createdColumn = propostaColumns.has('criado_em') ? 'criado_em' : 'criadaEm';
        const updatedColumn = propostaColumns.has('atualizado_em') ? 'atualizado_em' : 'atualizadaEm';

        const rows: any[] = await this.propostaRepository.query(
          `
            INSERT INTO propostas (${insertColumns.map((column) => `"${column}"`).join(', ')})
            VALUES (${placeholders})
            RETURNING
              id,
              numero,
              titulo,
              valor,
              status,
              ${
                propostaColumns.has('descricao')
                  ? 'descricao'
                  : propostaColumns.has('observacoes')
                    ? 'observacoes'
                    : 'NULL'
              } AS descricao,
              ${
                propostaColumns.has('validade')
                  ? 'validade'
                  : propostaColumns.has('dataVencimento')
                    ? '"dataVencimento"'
                    : 'NULL'
              } AS validade,
              ${createdColumn} AS criado_em,
              ${updatedColumn} AS atualizado_em
          `,
          insertValues,
        );

        return this.buildLegacyInterface(
          rows?.[0],
          {
            cliente: clienteProcessado,
            produtos: dadosProposta.produtos || [],
            subtotal: dadosProposta.subtotal || 0,
            descontoGlobal: dadosProposta.descontoGlobal || 0,
            impostos: dadosProposta.impostos || 0,
            total: dadosProposta.total || valor,
            valor,
            formaPagamento: dadosProposta.formaPagamento || 'avista',
            validadeDias,
            observacoes: dadosProposta.observacoes,
            incluirImpostosPDF: dadosProposta.incluirImpostosPDF || false,
            source: dadosProposta.source || 'api',
            vendedor: dadosProposta.vendedor,
          },
          typeof dadosProposta.cliente === 'string' ? dadosProposta.cliente : clienteProcessado?.nome,
        );
      }

      const novaProposta = this.propostaRepository.create({
        empresaId: empresaIdProposta,
        numero,
        titulo: dadosProposta.titulo || `Proposta ${numero}`,
        cliente: clienteProcessado,
        produtos: dadosProposta.produtos || [],
        subtotal: dadosProposta.subtotal || 0,
        descontoGlobal: dadosProposta.descontoGlobal || 0,
        impostos: dadosProposta.impostos || 0,
        total: dadosProposta.total || 0,
        valor: dadosProposta.valor || dadosProposta.total || 0,
        formaPagamento: dadosProposta.formaPagamento || 'avista',
        validadeDias: dadosProposta.validadeDias || 30,
        observacoes: dadosProposta.observacoes,
        incluirImpostosPDF: dadosProposta.incluirImpostosPDF || false,
        status: dadosProposta.status || 'rascunho',
        dataVencimento: dadosProposta.dataVencimento
          ? new Date(dadosProposta.dataVencimento)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        source: dadosProposta.source || 'api',
        vendedor_id: vendedorId,
      });

      const propostaSalva = await this.propostaRepository.save(novaProposta);
      this.logger.log(`✅ Proposta criada no banco: ${propostaSalva.id} - ${propostaSalva.numero}`);

      return this.entityToInterface(propostaSalva);
    } catch (error) {
      this.logger.error('Erro ao criar proposta', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Atualiza dados de uma proposta (além de status)
   */
  async atualizarProposta(
    id: string,
    dadosProposta: Partial<Proposta>,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const propostaColumns = await this.getTableColumns('propostas');
      const legacySchema = this.isLegacyPropostasSchema(propostaColumns);

      if (legacySchema) {
        const setClauses: string[] = [];
        const params: unknown[] = [];
        let idx = 1;

        if (dadosProposta.titulo !== undefined) {
          setClauses.push(`"titulo" = $${idx++}`);
          params.push(dadosProposta.titulo || null);
        }

        const valorAtualizado =
          dadosProposta.valor !== undefined
            ? Number(dadosProposta.valor)
            : dadosProposta.total !== undefined
              ? Number(dadosProposta.total)
              : undefined;
        if (valorAtualizado !== undefined && Number.isFinite(valorAtualizado)) {
          setClauses.push(`"valor" = $${idx++}`);
          params.push(valorAtualizado);
        }

        if (dadosProposta.status !== undefined) {
          setClauses.push(`"status" = $${idx++}`);
          params.push(this.normalizeStatusToDatabase(dadosProposta.status, true));
        }

        if (dadosProposta.source !== undefined && propostaColumns.has('source')) {
          setClauses.push(`"source" = $${idx++}`);
          params.push(dadosProposta.source || null);
        }

        const observacoesColumn = propostaColumns.has('observacoes')
          ? 'observacoes'
          : propostaColumns.has('descricao')
            ? 'descricao'
            : null;
        if (observacoesColumn && dadosProposta.observacoes !== undefined) {
          setClauses.push(`"${observacoesColumn}" = $${idx++}`);
          params.push(dadosProposta.observacoes || null);
        }

        const validadeColumn = propostaColumns.has('validade')
          ? 'validade'
          : propostaColumns.has('dataVencimento')
            ? 'dataVencimento'
            : null;
        const validadeDias =
          dadosProposta.validadeDias !== undefined ? Number(dadosProposta.validadeDias) : undefined;
        const dataVencimentoValue =
          dadosProposta.dataVencimento ??
          (validadeDias && Number.isFinite(validadeDias)
            ? new Date(Date.now() + validadeDias * 24 * 60 * 60 * 1000).toISOString()
            : undefined);
        if (validadeColumn && dataVencimentoValue) {
          setClauses.push(`"${validadeColumn}" = $${idx++}`);
          params.push(new Date(dataVencimentoValue));
        }

        if (setClauses.length === 0) {
          const existente = await this.obterProposta(id, empresaId);
          if (!existente) throw new Error(`Proposta com ID ${id} nao encontrada`);
          return existente;
        }

        params.push(id);
        const idParam = `$${idx++}`;
        let whereClause = `id = ${idParam}`;

        if (empresaId) {
          params.push(empresaId);
          whereClause += ` AND empresa_id = $${idx++}`;
        }

        const updateResult: Array<{ id: string }> = await this.propostaRepository.query(
          `
            UPDATE propostas
            SET ${setClauses.join(', ')}
            WHERE ${whereClause}
            RETURNING id
          `,
          params,
        );

        if (!updateResult?.[0]?.id) {
          throw new Error(`Proposta com ID ${id} nao encontrada`);
        }

        const propostaAtualizada = await this.obterProposta(id, empresaId);
        if (!propostaAtualizada) {
          throw new Error(`Proposta com ID ${id} nao encontrada`);
        }
        return propostaAtualizada;
      }

      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id, empresaId } : { id },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${id} nao encontrada`);
      }

      if (dadosProposta.titulo !== undefined) {
        proposta.titulo = dadosProposta.titulo || null;
      }

      if (dadosProposta.cliente !== undefined) {
        if (typeof dadosProposta.cliente === 'string') {
          const clienteAtual = proposta.cliente || { id: 'cliente-temp', nome: '', email: '' };
          proposta.cliente = {
            ...clienteAtual,
            nome: dadosProposta.cliente,
            email: clienteAtual.email || '',
          } as any;
        } else if (dadosProposta.cliente && typeof dadosProposta.cliente === 'object') {
          proposta.cliente = dadosProposta.cliente as any;
        }
      }

      if (dadosProposta.produtos !== undefined) {
        proposta.produtos = (dadosProposta.produtos || []) as any;
      }

      if (dadosProposta.subtotal !== undefined) {
        proposta.subtotal = Number(dadosProposta.subtotal);
      }
      if (dadosProposta.descontoGlobal !== undefined) {
        proposta.descontoGlobal = Number(dadosProposta.descontoGlobal);
      }
      if (dadosProposta.impostos !== undefined) {
        proposta.impostos = Number(dadosProposta.impostos);
      }

      const totalFoiEnviado = dadosProposta.total !== undefined;
      const valorFoiEnviado = dadosProposta.valor !== undefined;
      if (totalFoiEnviado) {
        proposta.total = Number(dadosProposta.total);
        if (!valorFoiEnviado) proposta.valor = Number(dadosProposta.total);
      }
      if (valorFoiEnviado) {
        proposta.valor = Number(dadosProposta.valor);
        if (!totalFoiEnviado) proposta.total = Number(dadosProposta.valor);
      }

      if (dadosProposta.formaPagamento !== undefined) {
        proposta.formaPagamento = dadosProposta.formaPagamento as any;
      }

      if (dadosProposta.validadeDias !== undefined) {
        proposta.validadeDias = Number(dadosProposta.validadeDias);
      }

      if (dadosProposta.observacoes !== undefined) {
        proposta.observacoes = dadosProposta.observacoes || null;
      }

      if (dadosProposta.incluirImpostosPDF !== undefined) {
        proposta.incluirImpostosPDF = Boolean(dadosProposta.incluirImpostosPDF);
      }

      if (dadosProposta.status !== undefined) {
        proposta.status = dadosProposta.status;
      }

      if (dadosProposta.dataVencimento !== undefined) {
        proposta.dataVencimento = dadosProposta.dataVencimento
          ? new Date(dadosProposta.dataVencimento)
          : null;
      } else if (dadosProposta.validadeDias !== undefined && Number.isFinite(proposta.validadeDias)) {
        proposta.dataVencimento = new Date(Date.now() + proposta.validadeDias * 24 * 60 * 60 * 1000);
      }

      if (dadosProposta.source !== undefined) {
        proposta.source = dadosProposta.source || null;
      }

      if (dadosProposta.vendedor !== undefined) {
        let vendedorId: string | null = null;

        if (dadosProposta.vendedor && typeof dadosProposta.vendedor === 'object') {
          vendedorId = (dadosProposta.vendedor as any).id || null;
        } else if (typeof dadosProposta.vendedor === 'string') {
          const vendedor = await this.userRepository.findOne({
            where: empresaId ? { nome: dadosProposta.vendedor, empresa_id: empresaId } : { nome: dadosProposta.vendedor },
          });
          vendedorId = vendedor?.id || null;
        }

        proposta.vendedor_id = vendedorId;
      }

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`✅ Proposta atualizada: ${propostaAtualizada.id}`);
      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao atualizar proposta', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Remove uma proposta
   */
  async removerProposta(id: string, empresaId?: string): Promise<boolean> {
    try {
      const resultado = await this.propostaRepository.delete(
        empresaId ? { id, empresaId } : { id },
      );
      return resultado.affected > 0;
    } catch (error) {
      this.logger.error('Erro ao remover proposta', error?.stack || String(error));
      return false;
    }
  }

  /**
   * Atualiza o status de uma proposta
   */
  async atualizarStatus(
    propostaId: string,
    status: string,
    source?: string,
    observacoes?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      this.logger.debug(`atualizarStatus chamado: ${JSON.stringify({ propostaId, tipoPropostaId: typeof propostaId, status, source: source || null, hasObservacoes: Boolean(observacoes) })}`);

      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      proposta.status = status;
      if (source) proposta.source = source;
      if (observacoes) proposta.observacoes = observacoes;

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`✅ Status da proposta ${propostaId} atualizado para: ${status}`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao atualizar status', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Atualiza o status de uma proposta com validação automática
   */
  async atualizarStatusComValidacao(
    propostaId: string,
    status: string,
    source?: string,
    observacoes?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      // Validações específicas para transições automáticas
      if (status === 'aprovada' || status === 'rejeitada') {
        if (proposta.status !== 'visualizada' && proposta.status !== 'enviada') {
          this.logger.warn(
            `⚠️ Transição automática de '${proposta.status}' para '${status}' pode não ser válida`,
          );
        }
      }

      proposta.status = status;
      if (source) proposta.source = source;
      if (observacoes) proposta.observacoes = observacoes;

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`✅ Status da proposta ${propostaId} atualizado com validação para: ${status}`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao atualizar status com validacao', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Marca proposta como visualizada via portal
   */
  async marcarComoVisualizada(
    propostaId: string,
    ip?: string,
    userAgent?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      proposta.status = 'visualizada';
      proposta.portalAccess = {
        accessedAt: new Date().toISOString(),
        ip,
        userAgent,
      };

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`👁️ Proposta ${propostaId} marcada como visualizada`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao marcar como visualizada', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Registra envio de email
   */
  async registrarEnvioEmail(
    propostaId: string,
    emailCliente: string,
    linkPortal?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      const proposta = await this.propostaRepository.findOne({
        where: empresaId ? { id: propostaId, empresaId } : { id: propostaId },
      });

      if (!proposta) {
        throw new Error(`Proposta com ID ${propostaId} não encontrada`);
      }

      proposta.status = 'enviada';
      proposta.emailDetails = {
        sentAt: new Date().toISOString(),
        emailCliente,
        linkPortal,
      };

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`Email registrado para proposta ${propostaId} (${this.maskEmail(emailCliente)})`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao registrar envio de email', error?.stack || String(error));
      throw error;
    }
  }

  /**
   * Marca proposta como enviada (usado pela sincronização automática)
   */
  async marcarComoEnviada(
    propostaIdOuNumero: string,
    emailCliente: string,
    linkPortal?: string,
    empresaId?: string,
  ): Promise<Proposta> {
    try {
      this.logger.debug(`Marcando proposta ${propostaIdOuNumero} como enviada automaticamente`);

      // Tentar encontrar por ID (UUID) primeiro, depois por número
      let proposta = await this.propostaRepository
        .findOne({
          where: empresaId
            ? { id: propostaIdOuNumero, empresaId }
            : { id: propostaIdOuNumero },
        })
        .catch(() => null); // Capturar erro de UUID inválido

      // Se não encontrou por ID, tentar por número
      if (!proposta) {
        proposta = await this.propostaRepository.findOne({
          where: empresaId
            ? { numero: propostaIdOuNumero, empresaId }
            : { numero: propostaIdOuNumero },
        });
      }

      if (!proposta) {
        throw new Error(`Proposta com ID/Número ${propostaIdOuNumero} não encontrada`);
      }

      // Atualizar status para enviada
      proposta.status = 'enviada';
      proposta.emailDetails = {
        sentAt: new Date().toISOString(),
        emailCliente,
        linkPortal,
      };

      const propostaAtualizada = await this.propostaRepository.save(proposta);
      this.logger.log(`✅ Proposta ${proposta.numero} marcada como enviada automaticamente`);

      return this.entityToInterface(propostaAtualizada);
    } catch (error) {
      this.logger.error('Erro ao marcar proposta como enviada', error?.stack || String(error));
      throw error;
    }
  }
}
