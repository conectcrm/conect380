import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Cliente, StatusCliente, TipoCliente } from './cliente.entity';
import { ClienteAnexo } from './cliente-anexo.entity';
import { PaginationParams, PaginatedResponse } from '../../common/interfaces/common.interface';

type ClientesQueryParams = PaginationParams & {
  ids?: string[] | string;
};

@Injectable()
export class ClientesService {
  private statusColumnSupported: boolean | null = null;
  private avatarColumnSupported: boolean | null = null;
  private clienteAnexosTableSupported: boolean | null = null;

  constructor(
    @InjectRepository(Cliente)
    private clienteRepository: Repository<Cliente>,
    @InjectRepository(ClienteAnexo)
    private clienteAnexoRepository: Repository<ClienteAnexo>,
  ) {}

  async create(clienteData: Partial<Cliente>): Promise<Cliente> {
    const status = this.normalizeStatus(clienteData.status) ?? StatusCliente.LEAD;
    const ativo = clienteData.ativo ?? status !== StatusCliente.INATIVO;
    const avatarUrl = this.extractAvatarUrl(clienteData);
    const canPersistAvatar = avatarUrl !== undefined && (await this.hasAvatarColumn());

    const clientePayload: Partial<Cliente> = {
      nome: clienteData.nome,
      email: clienteData.email,
      telefone: clienteData.telefone,
      tipo: clienteData.tipo ?? TipoCliente.PESSOA_FISICA,
      documento: (clienteData as any).documento ?? (clienteData as any).cpf_cnpj,
      endereco: clienteData.endereco,
      cidade: clienteData.cidade,
      estado: clienteData.estado,
      cep: clienteData.cep,
      observacoes: clienteData.observacoes,
      empresaId: clienteData.empresaId,
      ativo,
    };

    if (canPersistAvatar) {
      clientePayload.avatar_url = avatarUrl ?? null;
    }

    const cliente = this.clienteRepository.create(clientePayload);

    const saved = await this.clienteRepository.save(cliente);

    if (await this.hasStatusColumn()) {
      await this.updateStatusColumn(saved.id, saved.empresaId, status);
    }

    const reloaded = await this.findById(saved.id, saved.empresaId);
    if (reloaded) {
      return reloaded;
    }

    const fallback = { ...saved, status } as Cliente;
    if (avatarUrl !== undefined) {
      fallback.avatar_url = avatarUrl;
      fallback.avatar = avatarUrl ?? undefined;
      fallback.avatarUrl = avatarUrl ?? undefined;
    }
    return fallback;
  }

  async findAll(empresaId: string, params: PaginationParams): Promise<PaginatedResponse<Cliente>> {
    const page = this.toPositiveInt(params.page, 1);
    const limit = this.toPositiveInt(params.limit, 10);
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'DESC';
    const hasStatusColumn = await this.hasStatusColumn();

    const sortMap: Record<string, string> = {
      created_at: 'cliente.created_at',
      updated_at: 'cliente.updated_at',
      nome: 'cliente.nome',
      email: 'cliente.email',
      tipo: 'cliente.tipo',
      status: hasStatusColumn ? 'cliente.status' : 'cliente.ativo',
    };
    const sortColumn = sortMap[sortBy] ?? sortMap.created_at;
    const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId });

    await this.applyFilters(queryBuilder, params);
    queryBuilder
      .orderBy(sortColumn, direction)
      .skip((page - 1) * limit)
      .take(limit);

    const [clientes, total] = await queryBuilder.getManyAndCount();
    const normalizedStatus = this.normalizeStatus(params.status as any);
    const data = await this.attachStatuses(clientes, normalizedStatus);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listForExport(empresaId: string, params: ClientesQueryParams): Promise<Cliente[]> {
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'DESC';
    const hasStatusColumn = await this.hasStatusColumn();

    const sortMap: Record<string, string> = {
      created_at: 'cliente.created_at',
      updated_at: 'cliente.updated_at',
      nome: 'cliente.nome',
      email: 'cliente.email',
      tipo: 'cliente.tipo',
      status: hasStatusColumn ? 'cliente.status' : 'cliente.ativo',
    };
    const sortColumn = sortMap[sortBy] ?? sortMap.created_at;
    const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const queryBuilder = this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId });

    await this.applyFilters(queryBuilder, params);
    queryBuilder.orderBy(sortColumn, direction);

    const clientes = await queryBuilder.getMany();
    const normalizedStatus = this.normalizeStatus(params.status as any);
    return this.attachStatuses(clientes, normalizedStatus);
  }

  exportToCsv(clientes: Cliente[]): string {
    const headers = [
      'id',
      'nome',
      'email',
      'telefone',
      'tipo',
      'status',
      'documento',
      'cidade',
      'estado',
      'cep',
      'endereco',
      'observacoes',
      'created_at',
      'updated_at',
    ];

    const rows = clientes.map((cliente) => [
      cliente.id,
      cliente.nome,
      cliente.email,
      cliente.telefone,
      cliente.tipo,
      cliente.status,
      cliente.documento,
      cliente.cidade,
      cliente.estado,
      cliente.cep,
      cliente.endereco,
      cliente.observacoes,
      cliente.created_at ? new Date(cliente.created_at).toISOString() : '',
      cliente.updated_at ? new Date(cliente.updated_at).toISOString() : '',
    ]);

    return [headers, ...rows]
      .map((line) => line.map((value) => this.escapeCsv(value)).join(','))
      .join('\n');
  }

  async findById(id: string, empresaId: string): Promise<Cliente | undefined> {
    const cliente = await this.clienteRepository.findOne({
      where: { id, empresaId },
    });

    if (!cliente) {
      return undefined;
    }

    const [withStatus] = await this.attachStatuses([cliente]);
    return withStatus;
  }

  async update(id: string, empresaId: string, updateData: Partial<Cliente>): Promise<Cliente> {
    const payload: Partial<Cliente> = { ...updateData };
    delete (payload as any).status;
    delete (payload as any).avatar;
    delete (payload as any).avatarUrl;

    if ((updateData as any).documento !== undefined || (updateData as any).cpf_cnpj !== undefined) {
      payload.documento = (updateData as any).documento ?? (updateData as any).cpf_cnpj;
    }

    const avatarUrl = this.extractAvatarUrl(updateData);
    if (avatarUrl !== undefined && (await this.hasAvatarColumn())) {
      payload.avatar_url = avatarUrl;
    } else {
      delete (payload as any).avatar_url;
    }

    const normalizedStatus = this.normalizeStatus((updateData as any).status);
    if (normalizedStatus) {
      payload.ativo = normalizedStatus !== StatusCliente.INATIVO;
    } else if (payload.ativo === false) {
      // Compatibilidade para clients antigos que só enviam ativo=false.
      (updateData as any).status = StatusCliente.INATIVO;
    }

    await this.clienteRepository.update({ id, empresaId }, payload);

    if (normalizedStatus && (await this.hasStatusColumn())) {
      await this.updateStatusColumn(id, empresaId, normalizedStatus);
    }

    return this.findById(id, empresaId);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    await this.clienteRepository.update({ id, empresaId }, { ativo: false });

    if (await this.hasStatusColumn()) {
      await this.updateStatusColumn(id, empresaId, StatusCliente.INATIVO);
    }
  }

  async getByStatus(empresaId: string, status: StatusCliente): Promise<Cliente[]> {
    const normalizedStatus = this.normalizeStatus(status) ?? StatusCliente.LEAD;
    const ativo = normalizedStatus !== StatusCliente.INATIVO;

    const queryBuilder = this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId })
      .andWhere('cliente.ativo = :ativo', { ativo })
      .orderBy('cliente.updated_at', 'DESC');

    if (await this.hasStatusColumn()) {
      queryBuilder.andWhere('cliente.status = :status', { status: normalizedStatus });
    }

    const clientes = await queryBuilder.getMany();
    return this.attachStatuses(clientes, normalizedStatus);
  }

  async updateStatus(id: string, empresaId: string, status: StatusCliente): Promise<Cliente> {
    const normalizedStatus = this.normalizeStatus(status) ?? StatusCliente.LEAD;
    const ativo = normalizedStatus !== StatusCliente.INATIVO;

    await this.clienteRepository.update({ id, empresaId }, { ativo });

    if (await this.hasStatusColumn()) {
      await this.updateStatusColumn(id, empresaId, normalizedStatus);
    }

    return this.findById(id, empresaId);
  }

  async updateAvatar(id: string, empresaId: string, avatarUrl: string): Promise<Cliente> {
    if (!(await this.hasAvatarColumn())) {
      return this.findById(id, empresaId);
    }

    await this.clienteRepository.update({ id, empresaId }, { avatar_url: avatarUrl });
    return this.findById(id, empresaId);
  }

  async listAnexos(id: string, empresaId: string): Promise<ClienteAnexo[]> {
    if (!(await this.hasClienteAnexosTable())) {
      return [];
    }

    return this.clienteAnexoRepository.find({
      where: { clienteId: id, empresaId },
      order: { created_at: 'DESC' },
    });
  }

  async addAnexo(
    id: string,
    empresaId: string,
    anexoData: Pick<ClienteAnexo, 'nome' | 'tipo' | 'tamanho' | 'url'>,
  ): Promise<ClienteAnexo> {
    if (!(await this.hasClienteAnexosTable())) {
      throw new ServiceUnavailableException(
        'Anexos de cliente indisponiveis ate executar as migrations.',
      );
    }

    const anexo = this.clienteAnexoRepository.create({
      clienteId: id,
      empresaId,
      nome: anexoData.nome,
      tipo: anexoData.tipo,
      tamanho: anexoData.tamanho,
      url: anexoData.url,
    });

    return this.clienteAnexoRepository.save(anexo);
  }

  async removeAnexo(id: string, anexoId: string, empresaId: string): Promise<ClienteAnexo | null> {
    if (!(await this.hasClienteAnexosTable())) {
      throw new ServiceUnavailableException(
        'Anexos de cliente indisponiveis ate executar as migrations.',
      );
    }

    const anexo = await this.clienteAnexoRepository.findOne({
      where: { id: anexoId, clienteId: id, empresaId },
    });

    if (!anexo) {
      return null;
    }

    await this.clienteAnexoRepository.delete({ id: anexo.id });
    return anexo;
  }

  async getClientesProximoContato(empresaId: string): Promise<Cliente[]> {
    const clientes = await this.clienteRepository.find({
      where: {
        empresaId,
        ativo: true,
      },
      order: { updated_at: 'DESC' },
    });

    return this.attachStatuses(clientes);
  }

  async getEstatisticas(empresaId: string) {
    const totalClientes = await this.clienteRepository.count({
      where: { empresaId, ativo: true },
    });

    const inativos = await this.clienteRepository.count({
      where: { empresaId, ativo: false },
    });

    let ativos = totalClientes;
    let leads = 0;
    let prospects = 0;

    if (await this.hasStatusColumn()) {
      const [ativosCount, leadsCount, prospectsCount] = await Promise.all([
        this.countByStatus(empresaId, StatusCliente.CLIENTE),
        this.countByStatus(empresaId, StatusCliente.LEAD),
        this.countByStatus(empresaId, StatusCliente.PROSPECT),
      ]);

      ativos = ativosCount;
      leads = leadsCount;
      prospects = prospectsCount;
    }

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const novosClientesMes = await this.clienteRepository
      .createQueryBuilder('cliente')
      .where('cliente.empresa_id = :empresaId', { empresaId })
      .andWhere('cliente.ativo = true')
      .andWhere('cliente.created_at >= :inicioMes', { inicioMes })
      .getCount();

    return {
      total: totalClientes,
      ativos,
      leads,
      prospects,
      inativos,
      totalClientes,
      clientesAtivos: ativos,
      novosClientesMes,
    };
  }

  private async applyFilters(
    queryBuilder: SelectQueryBuilder<Cliente>,
    params: ClientesQueryParams,
  ): Promise<void> {
    const normalizedStatus = this.normalizeStatus(params.status as any);
    const hasStatusColumn = await this.hasStatusColumn();

    if (normalizedStatus) {
      const ativo = normalizedStatus !== StatusCliente.INATIVO;
      queryBuilder.andWhere('cliente.ativo = :ativo', { ativo });

      if (hasStatusColumn) {
        queryBuilder.andWhere('cliente.status = :status', { status: normalizedStatus });
      }
    } else {
      queryBuilder.andWhere('cliente.ativo = true');
    }

    if (params.search) {
      queryBuilder.andWhere(
        '(cliente.nome ILIKE :search OR cliente.email ILIKE :search OR cliente.telefone ILIKE :search OR cliente.documento ILIKE :search)',
        {
          search: `%${params.search}%`,
        },
      );
    }

    if (params.tipo) {
      queryBuilder.andWhere('cliente.tipo = :tipo', { tipo: params.tipo });
    }

    const ids = this.normalizeIds(params.ids);
    if (ids.length > 0) {
      queryBuilder.andWhere('cliente.id IN (:...ids)', { ids });
    }
  }

  private async attachStatuses(
    clientes: Cliente[],
    fallbackStatus?: StatusCliente,
  ): Promise<Cliente[]> {
    if (clientes.length === 0) {
      return clientes;
    }

    const hasStatusColumn = await this.hasStatusColumn();
    if (!hasStatusColumn) {
      clientes.forEach((cliente) => {
        cliente.status =
          fallbackStatus ?? (cliente.ativo ? StatusCliente.CLIENTE : StatusCliente.INATIVO);
      });
      return this.attachAvatarFields(clientes);
    }

    const ids = clientes.map((cliente) => cliente.id);
    const rows: Array<{ id: string; status: StatusCliente }> = await this.clienteRepository.query(
      `
        SELECT id, status
        FROM clientes
        WHERE id = ANY($1::uuid[])
      `,
      [ids],
    );

    const statusById = new Map(rows.map((row) => [row.id, row.status]));

    clientes.forEach((cliente) => {
      cliente.status =
        statusById.get(cliente.id) ??
        fallbackStatus ??
        (cliente.ativo ? StatusCliente.CLIENTE : StatusCliente.INATIVO);
    });

    return this.attachAvatarFields(clientes);
  }

  private async countByStatus(empresaId: string, status: StatusCliente): Promise<number> {
    const rows: Array<{ total: string }> = await this.clienteRepository.query(
      `
        SELECT COUNT(*)::text AS total
        FROM clientes
        WHERE empresa_id = $1
          AND status = $2
          AND ativo = $3
      `,
      [empresaId, status, status !== StatusCliente.INATIVO],
    );

    return Number(rows?.[0]?.total ?? 0);
  }

  private normalizeIds(ids?: string[] | string): string[] {
    if (!ids) {
      return [];
    }

    if (Array.isArray(ids)) {
      return ids.filter(Boolean);
    }

    return String(ids)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  private normalizeStatus(status?: string | StatusCliente): StatusCliente | undefined {
    if (!status) {
      return undefined;
    }

    const value = String(status) as StatusCliente;
    if (Object.values(StatusCliente).includes(value)) {
      return value;
    }

    return undefined;
  }

  private toPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.floor(parsed);
  }

  private async hasStatusColumn(): Promise<boolean> {
    if (this.statusColumnSupported !== null) {
      return this.statusColumnSupported;
    }

    const result: Array<{ exists: boolean }> = await this.clienteRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'status'
        ) AS "exists"
      `,
    );

    this.statusColumnSupported = Boolean(result?.[0]?.exists);
    return this.statusColumnSupported;
  }

  private async hasAvatarColumn(): Promise<boolean> {
    if (this.avatarColumnSupported !== null) {
      return this.avatarColumnSupported;
    }

    const result: Array<{ exists: boolean }> = await this.clienteRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'clientes'
            AND column_name = 'avatar_url'
        ) AS "exists"
      `,
    );

    this.avatarColumnSupported = Boolean(result?.[0]?.exists);
    return this.avatarColumnSupported;
  }

  async isAnexosStorageAvailable(): Promise<boolean> {
    return this.hasClienteAnexosTable();
  }

  private async hasClienteAnexosTable(): Promise<boolean> {
    if (this.clienteAnexosTableSupported !== null) {
      return this.clienteAnexosTableSupported;
    }

    const result: Array<{ exists: boolean }> = await this.clienteRepository.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'cliente_anexos'
        ) AS "exists"
      `,
    );

    this.clienteAnexosTableSupported = Boolean(result?.[0]?.exists);
    return this.clienteAnexosTableSupported;
  }

  private async attachAvatarFields(clientes: Cliente[]): Promise<Cliente[]> {
    if (clientes.length === 0) {
      return clientes;
    }

    if (!(await this.hasAvatarColumn())) {
      clientes.forEach((cliente) => {
        const avatar = this.extractAvatarUrl(cliente);
        cliente.avatar_url = avatar;
        cliente.avatar = avatar ?? undefined;
        cliente.avatarUrl = avatar ?? undefined;
      });
      return clientes;
    }

    const ids = clientes.map((cliente) => cliente.id);
    const rows: Array<{ id: string; avatar_url: string | null }> =
      await this.clienteRepository.query(
        `
        SELECT id, avatar_url
        FROM clientes
        WHERE id = ANY($1::uuid[])
      `,
        [ids],
      );

    const avatarById = new Map(rows.map((row) => [row.id, row.avatar_url]));

    clientes.forEach((cliente) => {
      const avatar = avatarById.get(cliente.id) ?? null;
      cliente.avatar_url = avatar;
      cliente.avatar = avatar ?? undefined;
      cliente.avatarUrl = avatar ?? undefined;
    });

    return clientes;
  }

  private extractAvatarUrl(value: unknown): string | null | undefined {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const typedValue = value as Record<string, unknown>;
    const avatar = typedValue.avatar_url ?? typedValue.avatarUrl ?? typedValue.avatar ?? undefined;

    if (avatar === undefined) {
      return undefined;
    }

    if (avatar === null) {
      return null;
    }

    const parsed = String(avatar).trim();
    return parsed.length > 0 ? parsed : null;
  }

  private async updateStatusColumn(
    id: string,
    empresaId: string,
    status: StatusCliente,
  ): Promise<void> {
    await this.clienteRepository.query(
      `
        UPDATE clientes
        SET status = $1
        WHERE id = $2
          AND empresa_id = $3
      `,
      [status, id, empresaId],
    );
  }

  private escapeCsv(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    const raw = String(value);
    const escaped = raw.replace(/"/g, '""');
    if (/[",\n\r]/.test(escaped)) {
      return `"${escaped}"`;
    }

    return escaped;
  }
}
