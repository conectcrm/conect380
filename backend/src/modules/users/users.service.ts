import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';

type UsersReadScopeInput = {
  user_ids?: unknown;
  allowed_roles?: unknown;
};

type UsersReadScopeFilters = {
  userIds: string[];
  allowedRoles: UserRole[];
};

const ATENDIMENTO_PERMISSION_TOKENS = [
  'ATENDIMENTO',
  'ATENDIMENTO_DLQ_MANAGE',
  'ATENDIMENTO_CHATS_REPLY',
  'ATENDIMENTO_TICKETS_READ',
  'ATENDIMENTO_CHATS_READ',
  'ATENDIMENTO_TICKETS_CREATE',
  'ATENDIMENTO_TICKETS_UPDATE',
  'ATENDIMENTO_TICKETS_ASSIGN',
  'ATENDIMENTO_TICKETS_CLOSE',
  'ATENDIMENTO_FILAS_MANAGE',
  'ATENDIMENTO_SLA_MANAGE',
  'atendimento.dlq.manage',
  'atendimento.chats.reply',
  'atendimento.tickets.read',
  'atendimento.chats.read',
  'atendimento.tickets.create',
  'atendimento.tickets.update',
  'atendimento.tickets.assign',
  'atendimento.tickets.close',
  'atendimento.filas.manage',
  'atendimento.sla.manage',
];

@Injectable()
export class UsersService {
  private userColumnsCache: Set<string> | null = null;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Empresa)
    private empresaRepository: Repository<Empresa>,
  ) {}

  private async getUsersTableColumns(): Promise<Set<string>> {
    if (this.userColumnsCache) {
      return this.userColumnsCache;
    }

    const rows: Array<{ column_name: string }> = await this.userRepository.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
      `,
    );

    this.userColumnsCache = new Set(rows.map((row) => row.column_name));
    return this.userColumnsCache;
  }

  private resolveUsersColumnExpression(
    columns: Set<string>,
    alias: string,
    candidates: string[],
    fallbackExpression: string = 'NULL',
  ): string {
    for (const candidate of candidates) {
      if (columns.has(candidate)) {
        return `u.${candidate} AS ${alias}`;
      }
    }

    return `${fallbackExpression} AS ${alias}`;
  }

  private buildUserSelect(columns: Set<string>, includePassword: boolean = false): string {
    const baseSelect = [
      'u.id',
      'u.nome',
      'u.email',
      this.resolveUsersColumnExpression(columns, 'telefone', ['telefone']),
      'u.role',
      this.resolveUsersColumnExpression(columns, 'permissoes', ['permissoes']),
      'u.empresa_id',
      this.resolveUsersColumnExpression(columns, 'avatar_url', ['avatar_url']),
      this.resolveUsersColumnExpression(columns, 'idioma_preferido', ['idioma_preferido'], "'pt-BR'"),
      this.resolveUsersColumnExpression(columns, 'configuracoes', ['configuracoes']),
      'u.ativo',
      this.resolveUsersColumnExpression(columns, 'deve_trocar_senha', ['deve_trocar_senha'], 'false'),
      this.resolveUsersColumnExpression(columns, 'status_atendente', ['status_atendente']),
      this.resolveUsersColumnExpression(columns, 'capacidade_maxima', ['capacidade_maxima'], 'NULL'),
      this.resolveUsersColumnExpression(columns, 'tickets_ativos', ['tickets_ativos'], 'NULL'),
      this.resolveUsersColumnExpression(columns, 'ultimo_login', ['ultimo_login']),
      this.resolveUsersColumnExpression(columns, 'created_at', ['created_at', 'criado_em']),
      this.resolveUsersColumnExpression(columns, 'updated_at', ['updated_at', 'atualizado_em']),
      'e.id AS empresa_rel_id',
      'e.nome AS empresa_nome',
      'e.slug AS empresa_slug',
      'e.cnpj AS empresa_cnpj',
      'e.plano AS empresa_plano',
      'e.ativo AS empresa_ativo',
      'e.subdominio AS empresa_subdominio',
    ];

    if (includePassword) {
      baseSelect.splice(3, 0, 'u.senha');
    } else {
      baseSelect.splice(3, 0, 'NULL::text AS senha');
    }

    return baseSelect.join(',\n          ');
  }

  private mapRawUser(raw: any): User {
    const permissoes =
      raw.permissoes && typeof raw.permissoes === 'string'
        ? raw.permissoes.split(',').filter(Boolean)
        : raw.permissoes ?? null;

    const empresa =
      raw.empresa_rel_id && raw.empresa_nome && raw.empresa_slug
        ? ({
            id: raw.empresa_rel_id,
            nome: raw.empresa_nome,
            slug: raw.empresa_slug,
            cnpj: raw.empresa_cnpj ?? null,
            plano: raw.empresa_plano ?? null,
            ativo: raw.empresa_ativo ?? null,
            subdominio: raw.empresa_subdominio ?? null,
          } as Empresa)
        : undefined;

    return this.userRepository.create({
      id: raw.id,
      nome: raw.nome,
      email: raw.email,
      senha: raw.senha,
      telefone: raw.telefone,
      role: raw.role,
      permissoes,
      empresa_id: raw.empresa_id,
      avatar_url: raw.avatar_url,
      idioma_preferido: raw.idioma_preferido,
      configuracoes: raw.configuracoes,
      ativo: raw.ativo,
      deve_trocar_senha: raw.deve_trocar_senha,
      status_atendente: raw.status_atendente,
      capacidade_maxima: raw.capacidade_maxima,
      tickets_ativos: raw.tickets_ativos,
      ultimo_login: raw.ultimo_login,
      created_at: raw.created_at,
      updated_at: raw.updated_at,
      empresa,
    } as Partial<User>);
  }

  private normalizeRoleInput(role: unknown): UserRole | null {
    if (typeof role !== 'string') {
      return null;
    }

    const normalized = role.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    switch (normalized) {
      case 'superadmin':
        return UserRole.SUPERADMIN;
      case 'admin':
      case 'administrador':
        return UserRole.ADMIN;
      case 'gerente':
      case 'manager':
      case 'gestor':
        return UserRole.GERENTE;
      case 'vendedor':
        return UserRole.VENDEDOR;
      case 'suporte':
      case 'support':
      case 'user':
      case 'usuario':
      case 'operacional':
        return UserRole.SUPORTE;
      case 'financeiro':
        return UserRole.FINANCEIRO;
      default:
        return null;
    }
  }

  private normalizeRoleForCreate(userData: Partial<User>): Partial<User> {
    const roleNormalizado = this.normalizeRoleInput(userData.role);
    return {
      ...userData,
      role: roleNormalizado ?? UserRole.VENDEDOR,
    };
  }

  private normalizeRoleForUpdate(userData: Partial<User>): Partial<User> {
    if (userData.role === undefined) {
      return userData;
    }

    const roleNormalizado = this.normalizeRoleInput(userData.role);
    if (!roleNormalizado) {
      const { role, ...rest } = userData;
      return rest;
    }

    return {
      ...userData,
      role: roleNormalizado,
    };
  }

  private normalizeReadScopeUserIds(userIds: unknown): string[] {
    if (!Array.isArray(userIds)) {
      return [];
    }

    const normalized = userIds
      .filter((id): id is string => typeof id === 'string')
      .map((id) => id.trim())
      .filter(Boolean);

    return Array.from(new Set(normalized));
  }

  private normalizeReadScopeRoles(roles: unknown): UserRole[] {
    if (!Array.isArray(roles)) {
      return [];
    }

    const normalized = roles
      .map((role) => this.normalizeRoleInput(role))
      .filter((role): role is UserRole => !!role);

    return Array.from(new Set(normalized));
  }

  private resolveReadScopeFilters(input?: UsersReadScopeInput): UsersReadScopeFilters {
    return {
      userIds: this.normalizeReadScopeUserIds(input?.user_ids),
      allowedRoles: this.normalizeReadScopeRoles(input?.allowed_roles),
    };
  }

  private appendReadScopeClause(
    whereClauses: string[],
    whereValues: unknown[],
    scopeFilters: UsersReadScopeFilters,
  ): void {
    if (scopeFilters.userIds.length === 0 && scopeFilters.allowedRoles.length === 0) {
      return;
    }

    const scopeClauses: string[] = [];

    if (scopeFilters.userIds.length > 0) {
      const userPlaceholders = scopeFilters.userIds.map((id) => {
        whereValues.push(id);
        return `$${whereValues.length}`;
      });
      scopeClauses.push(`u.id IN (${userPlaceholders.join(', ')})`);
    }

    if (scopeFilters.allowedRoles.length > 0) {
      const rolePlaceholders = scopeFilters.allowedRoles.map((role) => {
        whereValues.push(role);
        return `$${whereValues.length}`;
      });
      scopeClauses.push(`u.role IN (${rolePlaceholders.join(', ')})`);
    }

    if (scopeClauses.length === 1) {
      whereClauses.push(scopeClauses[0]);
      return;
    }

    whereClauses.push(`(${scopeClauses.join(' OR ')})`);
  }

  private filterUsersByReadScope(users: User[], scopeFilters: UsersReadScopeFilters): User[] {
    if (scopeFilters.userIds.length === 0 && scopeFilters.allowedRoles.length === 0) {
      return users;
    }

    const userIdSet = new Set(scopeFilters.userIds);
    const roleSet = new Set(scopeFilters.allowedRoles);

    return users.filter((user) => {
      if (user.id && userIdSet.has(user.id)) {
        return true;
      }

      if (roleSet.size === 0) {
        return false;
      }

      const normalizedRole = this.normalizeRoleInput(user.role);
      return !!normalizedRole && roleSet.has(normalizedRole);
    });
  }

  private isActiveFlag(value: unknown): boolean {
    return value === true || value === 'true' || value === 't' || value === 1 || value === '1';
  }

  private normalizePermissionsInput(permissoes: unknown): string | null {
    if (Array.isArray(permissoes)) {
      const values = permissoes
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);

      return values.length > 0 ? values.join(',') : null;
    }

    if (typeof permissoes === 'string') {
      const values = permissoes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      return values.length > 0 ? values.join(',') : null;
    }

    return null;
  }

  private normalizeSortDirection(direction: unknown): 'ASC' | 'DESC' {
    const normalized = typeof direction === 'string' ? direction.trim().toUpperCase() : 'ASC';
    return normalized === 'DESC' ? 'DESC' : 'ASC';
  }

  private resolveUsersSortColumn(orderBy: unknown, columns: Set<string>): string {
    const normalized = typeof orderBy === 'string' ? orderBy.trim().toLowerCase() : 'nome';

    switch (normalized) {
      case 'email':
        return 'u.email';
      case 'role':
        return 'u.role';
      case 'created_at':
        if (columns.has('created_at')) {
          return 'u.created_at';
        }
        if (columns.has('criado_em')) {
          return 'u.criado_em';
        }
        return 'u.nome';
      case 'ultimo_login':
        if (columns.has('ultimo_login')) {
          return 'u.ultimo_login';
        }
        if (columns.has('updated_at')) {
          return 'u.updated_at';
        }
        if (columns.has('atualizado_em')) {
          return 'u.atualizado_em';
        }
        return 'u.nome';
      case 'nome':
      default:
        return 'u.nome';
    }
  }

  private async persistOptionalUsersColumns(
    id: string,
    userData: Partial<User>,
    empresaId?: string,
  ): Promise<void> {
    const columns = await this.getUsersTableColumns();
    const setClauses: string[] = [];
    const values: unknown[] = [];

    const pushAssignment = (column: string, value: unknown, cast?: 'json'): void => {
      if (!columns.has(column) || value === undefined) {
        return;
      }

      values.push(value);
      const valueExpression = cast ? `$${values.length}::${cast}` : `$${values.length}`;
      setClauses.push(`${column} = ${valueExpression}`);
    };

    const normalizedPermissions =
      userData.permissoes === undefined
        ? undefined
        : this.normalizePermissionsInput(userData.permissoes);

    pushAssignment('telefone', userData.telefone);
    pushAssignment('permissoes', normalizedPermissions);
    pushAssignment('avatar_url', userData.avatar_url);
    pushAssignment('idioma_preferido', userData.idioma_preferido);
    pushAssignment(
      'configuracoes',
      userData.configuracoes === undefined ? undefined : JSON.stringify(userData.configuracoes ?? null),
      'json',
    );
    pushAssignment('status_atendente', userData.status_atendente);
    pushAssignment('capacidade_maxima', userData.capacidade_maxima);
    pushAssignment('tickets_ativos', userData.tickets_ativos);
    pushAssignment('ativo', userData.ativo);

    if (setClauses.length === 0) {
      return;
    }

    const whereClauses = [`id = $${values.length + 1}`];
    values.push(id);

    if (empresaId) {
      whereClauses.push(`empresa_id = $${values.length + 1}`);
      values.push(empresaId);
    }

    await this.userRepository.query(
      `
        UPDATE users
        SET ${setClauses.join(',\n            ')}
        WHERE ${whereClauses.join(' AND ')}
      `,
      values,
    );
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const columns = await this.getUsersTableColumns();
    const select = this.buildUserSelect(columns, true);

    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          ${select}
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.email = $1
        LIMIT 1
      `,
      [email],
    );

    const raw = rows?.[0];
    if (!raw) {
      return undefined;
    }

    return this.mapRawUser(raw);
  }

  async findById(id: string): Promise<User | undefined> {
    const columns = await this.getUsersTableColumns();
    const select = this.buildUserSelect(columns, false);

    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          ${select}
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.id = $1
        LIMIT 1
      `,
      [id],
    );

    const raw = rows?.[0];
    if (!raw) {
      return undefined;
    }

    return this.mapRawUser(raw);
  }

  private async findByIdWithPassword(id: string): Promise<User | undefined> {
    const columns = await this.getUsersTableColumns();
    const select = this.buildUserSelect(columns, true);

    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          ${select}
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.id = $1
        LIMIT 1
      `,
      [id],
    );

    const raw = rows?.[0];
    if (!raw) {
      return undefined;
    }

    return this.mapRawUser(raw);
  }

  /**
   * Busca usuário por ID (inclui senha - para validação de senha antiga)
   * Diferente de findById que NÃO retorna senha
   */
  async findOne(id: string, empresaId?: string): Promise<User | undefined> {
    const user = await this.findByIdWithPassword(id);
    if (!user) {
      return undefined;
    }

    if (empresaId && user.empresa_id !== empresaId) {
      return undefined;
    }

    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    const normalizedData = this.normalizeRoleForCreate(userData);
    const user = this.userRepository.create(normalizedData);
    const savedUser = await this.userRepository.save(user);
    await this.persistOptionalUsersColumns(savedUser.id, normalizedData, savedUser.empresa_id);
    return this.findById(savedUser.id);
  }

  async createWithHash(userData: Partial<User>): Promise<User> {
    // Buscar primeira empresa ativa se não fornecida
    if (!userData.empresa_id) {
      const empresa = await this.empresaRepository.findOne({
        where: { ativo: true },
      });

      if (!empresa) {
        throw new Error('Nenhuma empresa ativa encontrada');
      }

      userData.empresa_id = empresa.id;
    }

    const normalizedData = this.normalizeRoleForCreate(userData);
    const user = this.userRepository.create(normalizedData);
    const savedUser = await this.userRepository.save(user);
    await this.persistOptionalUsersColumns(savedUser.id, normalizedData, savedUser.empresa_id);
    return this.findById(savedUser.id);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const normalizedData = this.normalizeRoleForUpdate(userData);
    await this.userRepository.update(id, normalizedData);
    await this.persistOptionalUsersColumns(id, normalizedData);
    return this.findById(id);
  }

  async findByEmpresa(empresaId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { empresa_id: empresaId },
      relations: ['empresa'],
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    const columns = await this.getUsersTableColumns();
    if (!columns.has('ultimo_login')) {
      return;
    }

    await this.userRepository.query(
      `
        UPDATE users
        SET ultimo_login = $1
        WHERE id = $2
      `,
      [new Date(), id],
    );
  }

  /**
   * Atualiza senha do usuário e marca como ativo (primeiro acesso concluído)
   * @param id ID do usuário
   * @param hashedPassword Senha já com hash bcrypt
   * @param ativar Se true, marca usuário como ativo (default: true)
   */
  async updatePassword(id: string, hashedPassword: string, ativar: boolean = true): Promise<void> {
    await this.userRepository.update(id, {
      senha: hashedPassword,
      ativo: ativar,
      deve_trocar_senha: false,
    });
  }

  async listarComFiltros(filtros: any): Promise<{ usuarios: User[]; total: number }> {
    try {
      const columns = await this.getUsersTableColumns();
      const select = this.buildUserSelect(columns, false);
      const scopeFilters = this.resolveReadScopeFilters(filtros);
      const whereClauses: string[] = ['u.empresa_id = $1'];
      const whereValues: unknown[] = [filtros.empresa_id];

      const busca = typeof filtros.busca === 'string' ? filtros.busca.trim() : '';
      if (busca) {
        whereValues.push(`%${busca}%`);
        const placeholder = `$${whereValues.length}`;
        whereClauses.push(`(u.nome ILIKE ${placeholder} OR u.email ILIKE ${placeholder})`);
      }

      const roleFilter = this.normalizeRoleInput(filtros.role);
      if (roleFilter) {
        whereValues.push(roleFilter);
        whereClauses.push(`u.role = $${whereValues.length}`);
      }

      if (typeof filtros.ativo === 'boolean') {
        whereValues.push(filtros.ativo);
        whereClauses.push(`u.ativo = $${whereValues.length}`);
      }

      this.appendReadScopeClause(whereClauses, whereValues, scopeFilters);

      const whereSql = whereClauses.join('\n          AND ');
      const countRows: Array<{ total: string | number }> = await this.userRepository.query(
        `
          SELECT COUNT(*)::int AS total
          FROM users u
          WHERE ${whereSql}
        `,
        whereValues,
      );

      const totalRaw = countRows?.[0]?.total ?? 0;
      const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw) || 0;

      // Garantir que a direção seja em maiúsculas para o TypeORM
      const limiteRaw = Number(filtros.limite ?? 10);
      const paginaRaw = Number(filtros.pagina ?? 1);
      const limite = Number.isFinite(limiteRaw) ? Math.max(1, Math.floor(limiteRaw)) : 10;
      const pagina = Number.isFinite(paginaRaw) ? Math.max(1, Math.floor(paginaRaw)) : 1;
      const offset = (pagina - 1) * limite;

      const direcao = this.normalizeSortDirection(filtros.direcao);
      const orderBy = this.resolveUsersSortColumn(filtros.ordenacao, columns);
      const dataValues = [...whereValues, limite, offset];
      const limitPlaceholder = `$${whereValues.length + 1}`;
      const offsetPlaceholder = `$${whereValues.length + 2}`;

      const rows: any[] = await this.userRepository.query(
        `
          SELECT
            ${select}
          FROM users u
          LEFT JOIN empresas e ON e.id = u.empresa_id
          WHERE ${whereSql}
          ORDER BY ${orderBy} ${direcao}
          LIMIT ${limitPlaceholder}
          OFFSET ${offsetPlaceholder}
        `,
        dataValues,
      );

      const usuarios = rows.map((row) => this.mapRawUser(row));
      return { usuarios, total };
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      return { usuarios: [], total: 0 };
    }
  }

  async obterEstatisticas(empresa_id: string, scopeInput: UsersReadScopeInput = {}): Promise<any> {
    const scopeFilters = this.resolveReadScopeFilters(scopeInput);
    const whereClauses: string[] = ['u.empresa_id = $1'];
    const whereValues: unknown[] = [empresa_id];
    this.appendReadScopeClause(whereClauses, whereValues, scopeFilters);

    const whereSql = whereClauses.join('\n          AND ');
    const rows: Array<{ role: string; ativo: boolean | string | number; total: string | number }> =
      await this.userRepository.query(
        `
          SELECT
            u.role AS role,
            u.ativo AS ativo,
            COUNT(*)::int AS total
          FROM users u
          WHERE ${whereSql}
          GROUP BY u.role, u.ativo
        `,
        whereValues,
      );

    let total = 0;
    let ativos = 0;
    let inativos = 0;
    let adminCount = 0;
    let gerenteCount = 0;
    let vendedorCount = 0;
    let suporteCount = 0;
    let financeiroCount = 0;

    for (const row of rows) {
      const count = typeof row.total === 'number' ? row.total : Number(row.total) || 0;
      if (count <= 0) {
        continue;
      }

      total += count;
      if (this.isActiveFlag(row.ativo)) {
        ativos += count;
      } else {
        inativos += count;
      }

      const role = this.normalizeRoleInput(row.role);
      if (role === UserRole.ADMIN) {
        adminCount += count;
      } else if (role === UserRole.GERENTE) {
        gerenteCount += count;
      } else if (role === UserRole.VENDEDOR) {
        vendedorCount += count;
      } else if (role === UserRole.SUPORTE) {
        suporteCount += count;
      } else if (role === UserRole.FINANCEIRO) {
        financeiroCount += count;
      }
    }

    return {
      total,
      ativos,
      inativos,
      por_perfil: {
        admin: adminCount,
        gerente: gerenteCount,
        manager: gerenteCount, // alias legado
        vendedor: vendedorCount,
        suporte: suporteCount,
        financeiro: financeiroCount,
        user: suporteCount, // alias legado
      },
    };
  }
  async listarAtendentes(empresa_id: string, scopeInput: UsersReadScopeInput = {}): Promise<User[]> {
    const columns = await this.getUsersTableColumns();
    const select = this.buildUserSelect(columns, false);
    const scopeFilters = this.resolveReadScopeFilters(scopeInput);
    const atendimentoPermissionWhere = ATENDIMENTO_PERMISSION_TOKENS.map(
      (token) =>
        `
            u.permissoes = '${token}'
            OR u.permissoes LIKE '${token},%'
            OR u.permissoes LIKE '%,${token}'
            OR u.permissoes LIKE '%,${token},%'
        `.trim(),
    ).join('\n            OR ');

    if (!columns.has('permissoes')) {
      const fallbackRows: any[] = await this.userRepository.query(
        `
          SELECT
            ${select}
          FROM users u
          LEFT JOIN empresas e ON e.id = u.empresa_id
          WHERE u.empresa_id = $1
            AND u.ativo = true
            AND u.role = $2
          ORDER BY u.nome ASC
        `,
        [empresa_id, UserRole.SUPORTE],
      );

      const fallbackUsers = fallbackRows.map((row) => this.mapRawUser(row));
      return this.filterUsersByReadScope(fallbackUsers, scopeFilters);
    }

    const rows: any[] = await this.userRepository.query(
      `
        SELECT
          ${select}
        FROM users u
        LEFT JOIN empresas e ON e.id = u.empresa_id
        WHERE u.empresa_id = $1
          AND u.ativo = true
          AND (
            ${atendimentoPermissionWhere}
          )
        ORDER BY u.nome ASC
      `,
      [empresa_id],
    );

    const atendentes = rows.map((row) => this.mapRawUser(row));
    return this.filterUsersByReadScope(atendentes, scopeFilters);
  }

  async criar(userData: Partial<User>): Promise<User> {
    // Validação de campos obrigatórios
    if (!userData.nome || !userData.email || !userData.senha || !userData.empresa_id) {
      throw new Error('Campos obrigatórios ausentes: nome, email, senha, empresa_id');
    }

    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(userData.senha, 10);
    const userDataWithHashedPassword = this.normalizeRoleForCreate({
      ...userData,
      senha: hashedPassword,
    });

    const user = this.userRepository.create(userDataWithHashedPassword);

    try {
      const savedUser = await this.userRepository.save(user);
      await this.persistOptionalUsersColumns(savedUser.id, userDataWithHashedPassword, savedUser.empresa_id);
      return this.findById(savedUser.id);
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      if (err.code === '23505' && String(err.detail).includes('email')) {
        throw new Error('Já existe um usuário cadastrado com este e-mail.');
      }
      throw err;
    }
  }

  async atualizar(id: string, userData: Partial<User>, empresa_id: string): Promise<User> {
    const normalizedData = this.normalizeRoleForUpdate(userData);
    await this.userRepository.update({ id, empresa_id }, normalizedData);
    await this.persistOptionalUsersColumns(id, normalizedData, empresa_id);
    const user = await this.findById(id);
    if (!user || user.empresa_id !== empresa_id) {
      throw new NotFoundException('Usuario nao encontrado');
    }

    return user;
  }

  async excluir(id: string, empresa_id: string): Promise<void> {
    try {
      const resultado = await this.userRepository.delete({ id, empresa_id });

      if (!resultado.affected) {
        throw new NotFoundException('Usuário não encontrado');
      }
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error.driverError?.code === '23503' ||
          error.driverError?.code === 'ER_ROW_IS_REFERENCED_2')
      ) {
        throw new ConflictException(
          'Não é possível excluir este usuário porque existem registros relacionados em outros módulos. Reatribua ou conclua os vínculos antes de excluir.',
        );
      }

      throw error;
    }
  }

  async resetarSenha(id: string, empresa_id: string): Promise<string> {
    const usuario = await this.userRepository.findOne({ where: { id, empresa_id } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const novaSenha = this.gerarSenhaTemporaria();
    const senhaHasheada = await bcrypt.hash(novaSenha, 10);

    await this.userRepository.update(
      { id, empresa_id },
      {
        senha: senhaHasheada,
        deve_trocar_senha: true,
      },
    );

    return novaSenha;
  }

  private gerarSenhaTemporaria(): string {
    const letrasMaiusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const letrasMinusculas = 'abcdefghijkmnpqrstuvwxyz';
    const numeros = '23456789';
    const simbolos = '@#$%&*?!';
    const conjuntoCompleto = `${letrasMaiusculas}${letrasMinusculas}${numeros}${simbolos}`;

    const gerarCaractere = (fonte: string) => fonte[Math.floor(Math.random() * fonte.length)];

    const base = [
      gerarCaractere(letrasMaiusculas),
      gerarCaractere(letrasMinusculas),
      gerarCaractere(numeros),
      gerarCaractere(simbolos),
    ];

    while (base.length < 12) {
      base.push(gerarCaractere(conjuntoCompleto));
    }

    for (let i = base.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [base[i], base[j]] = [base[j], base[i]];
    }

    return base.join('');
  }

  async alterarStatus(id: string, ativo: boolean, empresa_id: string): Promise<User> {
    console.log(
      `🔧 UsersService.alterarStatus - ID: ${id}, Ativo: ${ativo}, Empresa: ${empresa_id}`,
    );

    // Verificar se o usuário existe e pertence à empresa
    const usuario = await this.userRepository.findOne({
      where: { id, empresa_id },
      relations: ['empresa'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Atualizar o status
    await this.userRepository.update({ id, empresa_id }, { ativo });

    // Buscar o usuário atualizado
    const usuarioAtualizado = await this.userRepository.findOne({
      where: { id, empresa_id },
      relations: ['empresa'],
    });

    console.log(`✅ Status do usuário ${id} alterado para: ${ativo ? 'ATIVO' : 'INATIVO'}`);

    return usuarioAtualizado;
  }

  async ativarEmMassa(ids: string[], empresa_id: string): Promise<void> {
    for (const id of ids) {
      await this.userRepository.update({ id, empresa_id }, { ativo: true });
    }
  }

  async desativarEmMassa(ids: string[], empresa_id: string): Promise<void> {
    for (const id of ids) {
      await this.userRepository.update({ id, empresa_id }, { ativo: false });
    }
  }
}
