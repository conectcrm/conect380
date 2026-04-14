import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Meta as MetaEntity, MetaTipo } from './entities/meta.entity';

export interface Meta {
  id?: string;
  tipo: 'mensal' | 'trimestral' | 'anual';
  periodo: string;
  vendedorId?: string | null;
  regiao?: string;
  valor: number;
  descricao?: string;
  ativa: boolean;
  empresaId?: string;
  criadaEm: Date;
  atualizadaEm: Date;
}

export interface CreateMetaDto {
  tipo: 'mensal' | 'trimestral' | 'anual';
  periodo: string;
  vendedorId?: string;
  regiao?: string;
  valor: number;
  descricao?: string;
  empresaId?: string;
}

export interface UpdateMetaDto extends Partial<CreateMetaDto> {
  ativa?: boolean;
}

@Injectable()
export class MetasService {
  private readonly logger = new Logger(MetasService.name);
  private vendedorIdSchemaMode: 'uuid' | 'integer' | null = null;
  private vendedorIdSchemaModePromise: Promise<'uuid' | 'integer'> | null = null;

  constructor(
    @InjectRepository(MetaEntity)
    private readonly metasRepository: Repository<MetaEntity>,
  ) {}

  async findAll(empresaId?: string): Promise<Meta[]> {
    const where: FindOptionsWhere<MetaEntity> = {};
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const metas = await this.metasRepository.find({
      where,
      order: {
        periodo: 'DESC',
        criadaEm: 'DESC',
      },
    });

    return metas.map((meta) => this.toMetaDto(meta));
  }

  async findOne(id: string, empresaId?: string): Promise<Meta> {
    const where: FindOptionsWhere<MetaEntity> = { id };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const meta = await this.metasRepository.findOne({ where });
    if (!meta) {
      throw new NotFoundException('Meta nao encontrada');
    }

    return this.toMetaDto(meta);
  }

  async create(createMetaDto: CreateMetaDto, empresaId?: string): Promise<Meta> {
    const vendedorNormalizado = await this.parseVendedorId(createMetaDto.vendedorId);
    const meta = this.metasRepository.create({
      tipo: this.normalizeTipo(createMetaDto.tipo),
      periodo: createMetaDto.periodo,
      valor: Number(createMetaDto.valor) || 0,
      vendedorId: vendedorNormalizado,
      regiao: this.normalizeOptionalText(createMetaDto.regiao),
      descricao: this.normalizeOptionalText(createMetaDto.descricao),
      ativa: true,
      empresaId: empresaId || createMetaDto.empresaId || null,
    });

    const savedMeta = await this.metasRepository.save(meta);
    return this.toMetaDto(savedMeta);
  }

  async update(id: string, updateMetaDto: UpdateMetaDto, empresaId?: string): Promise<Meta> {
    const metaAtual = await this.findOneEntity(id, empresaId);

    if (updateMetaDto.tipo !== undefined) {
      metaAtual.tipo = this.normalizeTipo(updateMetaDto.tipo);
    }
    if (updateMetaDto.periodo !== undefined) {
      metaAtual.periodo = updateMetaDto.periodo;
    }
    if (updateMetaDto.valor !== undefined) {
      metaAtual.valor = Number(updateMetaDto.valor) || 0;
    }
    if (updateMetaDto.vendedorId !== undefined) {
      metaAtual.vendedorId = await this.parseVendedorId(updateMetaDto.vendedorId);
    }
    if (updateMetaDto.regiao !== undefined) {
      metaAtual.regiao = this.normalizeOptionalText(updateMetaDto.regiao);
    }
    if (updateMetaDto.descricao !== undefined) {
      metaAtual.descricao = this.normalizeOptionalText(updateMetaDto.descricao);
    }
    if (updateMetaDto.ativa !== undefined) {
      metaAtual.ativa = Boolean(updateMetaDto.ativa);
    }

    const savedMeta = await this.metasRepository.save(metaAtual);
    return this.toMetaDto(savedMeta);
  }

  async remove(id: string, empresaId?: string): Promise<void> {
    const meta = await this.findOneEntity(id, empresaId);
    await this.metasRepository.remove(meta);
  }

  async findByPeriodo(tipo: string, periodo: string, empresaId?: string): Promise<Meta[]> {
    const where: FindOptionsWhere<MetaEntity> = {
      tipo: this.normalizeTipo(tipo),
      periodo,
      ativa: true,
    };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const metas = await this.metasRepository.find({
      where,
      order: { atualizadaEm: 'DESC' },
    });

    return metas.map((meta) => this.toMetaDto(meta));
  }

  async findByVendedor(vendedorId: string, empresaId?: string): Promise<Meta[]> {
    const vendedor = await this.parseVendedorId(vendedorId);
    if (vendedor === undefined) {
      return [];
    }

    const where: FindOptionsWhere<MetaEntity> = {
      vendedorId: vendedor,
      ativa: true,
    };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const metas = await this.metasRepository.find({
      where,
      order: { atualizadaEm: 'DESC' },
    });

    return metas.map((meta) => this.toMetaDto(meta));
  }

  async getMetaAtual(
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<Meta | null> {
    const periodoMensal = this.getPeriodoAtual(MetaTipo.MENSAL);
    const vendedor = await this.parseVendedorId(vendedorId);
    const regiaoNormalizada = this.normalizeOptionalText(regiao);

    const baseWhere: FindOptionsWhere<MetaEntity> = {
      tipo: MetaTipo.MENSAL,
      periodo: periodoMensal,
      ativa: true,
    };

    if (empresaId) {
      baseWhere.empresaId = empresaId;
    }

    const buscarMeta = async (
      extra: Partial<FindOptionsWhere<MetaEntity>>,
    ): Promise<MetaEntity | null> => {
      const where: FindOptionsWhere<MetaEntity> = {
        ...baseWhere,
        ...extra,
      };

      return await this.metasRepository.findOne({
        where,
        order: { atualizadaEm: 'DESC' },
      });
    };

    if (vendedor !== undefined && regiaoNormalizada) {
      const especifica = await buscarMeta({
        vendedorId: vendedor,
        regiao: regiaoNormalizada,
      });
      if (especifica) return this.toMetaDto(especifica);
    }

    if (vendedor !== undefined) {
      const porVendedor = await buscarMeta({
        vendedorId: vendedor,
        regiao: null,
      });
      if (porVendedor) return this.toMetaDto(porVendedor);
    }

    if (regiaoNormalizada) {
      const porRegiao = await buscarMeta({
        vendedorId: null,
        regiao: regiaoNormalizada,
      });
      if (porRegiao) return this.toMetaDto(porRegiao);
    }

    const geral = await buscarMeta({
      vendedorId: null,
      regiao: null,
    });
    if (geral) return this.toMetaDto(geral);

    const fallbackWhere: FindOptionsWhere<MetaEntity> = {
      ativa: true,
    };
    if (empresaId) {
      fallbackWhere.empresaId = empresaId;
    }

    const fallback = await this.metasRepository.findOne({
      where: fallbackWhere,
      order: {
        tipo: 'ASC',
        periodo: 'DESC',
        atualizadaEm: 'DESC',
      },
    });

    return fallback ? this.toMetaDto(fallback) : null;
  }

  async getMetaValorParaRange(
    dataInicio: Date,
    dataFim: Date,
    vendedorId?: string,
    regiao?: string,
    empresaId?: string,
  ): Promise<number> {
    if (!(dataInicio instanceof Date) || !(dataFim instanceof Date)) {
      return 0;
    }

    if (Number.isNaN(dataInicio.getTime()) || Number.isNaN(dataFim.getTime())) {
      return 0;
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);

    const rangeStart = inicio <= fim ? inicio : fim;
    const rangeEnd = inicio <= fim ? fim : inicio;

    const vendedor = await this.parseVendedorId(vendedorId);
    const regiaoNormalizada = this.normalizeOptionalText(regiao);

    const escopos: Array<{
      vendedorId: string | null;
      regiao: string | null;
    }> = [];

    if (vendedor !== undefined && regiaoNormalizada) {
      escopos.push({ vendedorId: vendedor, regiao: regiaoNormalizada });
    }
    if (vendedor !== undefined) {
      escopos.push({ vendedorId: vendedor, regiao: null });
    }
    if (regiaoNormalizada) {
      escopos.push({ vendedorId: null, regiao: regiaoNormalizada });
    }
    escopos.push({ vendedorId: null, regiao: null });

    for (const escopo of escopos) {
      const metas = await this.buscarMetasDoRange(
        rangeStart,
        rangeEnd,
        escopo.vendedorId,
        escopo.regiao,
        empresaId,
      );

      if (!metas.length) {
        continue;
      }

      return this.calcularMetaProrata(rangeStart, rangeEnd, metas);
    }

    return 0;
  }

  private async findOneEntity(id: string, empresaId?: string): Promise<MetaEntity> {
    const where: FindOptionsWhere<MetaEntity> = { id };
    if (empresaId) {
      where.empresaId = empresaId;
    }

    const meta = await this.metasRepository.findOne({ where });
    if (!meta) {
      throw new NotFoundException('Meta nao encontrada');
    }

    return meta;
  }

  private toMetaDto(meta: MetaEntity): Meta {
    return {
      id: meta.id,
      tipo: meta.tipo,
      periodo: meta.periodo,
      vendedorId: meta.vendedorId ?? undefined,
      regiao: meta.regiao ?? undefined,
      valor: Number(meta.valor) || 0,
      descricao: meta.descricao ?? undefined,
      ativa: meta.ativa,
      empresaId: meta.empresaId ?? undefined,
      criadaEm: meta.criadaEm,
      atualizadaEm: meta.atualizadaEm,
    };
  }

  private normalizeTipo(tipo: string): MetaTipo {
    if (tipo === MetaTipo.TRIMESTRAL) return MetaTipo.TRIMESTRAL;
    if (tipo === MetaTipo.ANUAL) return MetaTipo.ANUAL;
    return MetaTipo.MENSAL;
  }

  private async buscarMetasDoRange(
    dataInicio: Date,
    dataFim: Date,
    vendedorId: string | null,
    regiao: string | null,
    empresaId?: string,
  ): Promise<MetaEntity[]> {
    const periodosMensais = this.buildPeriodosMensais(dataInicio, dataFim);
    const periodosTrimestrais = this.buildPeriodosTrimestrais(dataInicio, dataFim);
    const periodosAnuais = this.buildPeriodosAnuais(dataInicio, dataFim);

    const whereBase: FindOptionsWhere<MetaEntity> = {
      ativa: true,
      vendedorId,
      regiao,
    };

    if (empresaId) {
      whereBase.empresaId = empresaId;
    }

    const buscas: Promise<MetaEntity[]>[] = [];

    if (periodosMensais.length > 0) {
      buscas.push(
        this.metasRepository.find({
          where: {
            ...whereBase,
            tipo: MetaTipo.MENSAL,
            periodo: In(periodosMensais),
          },
          order: { atualizadaEm: 'DESC' },
        }),
      );
    }

    if (periodosTrimestrais.length > 0) {
      buscas.push(
        this.metasRepository.find({
          where: {
            ...whereBase,
            tipo: MetaTipo.TRIMESTRAL,
            periodo: In(periodosTrimestrais),
          },
          order: { atualizadaEm: 'DESC' },
        }),
      );
    }

    if (periodosAnuais.length > 0) {
      buscas.push(
        this.metasRepository.find({
          where: {
            ...whereBase,
            tipo: MetaTipo.ANUAL,
            periodo: In(periodosAnuais),
          },
          order: { atualizadaEm: 'DESC' },
        }),
      );
    }

    if (buscas.length === 0) {
      return [];
    }

    const resultados = await Promise.all(buscas);
    const metas = resultados.flat();

    const unicas = new Map<string, MetaEntity>();
    for (const meta of metas) {
      const periodoNormalizado = this.normalizePeriodo(meta.tipo, meta.periodo);
      const chave = `${meta.tipo}:${periodoNormalizado || meta.periodo}`;
      if (!unicas.has(chave)) {
        unicas.set(chave, meta);
      }
    }

    return Array.from(unicas.values());
  }

  private calcularMetaProrata(dataInicio: Date, dataFim: Date, metas: MetaEntity[]): number {
    const metasMensais = new Map<string, MetaEntity>();
    const metasTrimestrais = new Map<string, MetaEntity>();
    const metasAnuais = new Map<string, MetaEntity>();

    metas.forEach((meta) => {
      const periodo = this.normalizePeriodo(meta.tipo, meta.periodo);
      if (!periodo) {
        return;
      }

      if (meta.tipo === MetaTipo.MENSAL) {
        metasMensais.set(periodo, meta);
        return;
      }
      if (meta.tipo === MetaTipo.TRIMESTRAL) {
        metasTrimestrais.set(periodo, meta);
        return;
      }
      metasAnuais.set(periodo, meta);
    });

    let total = 0;
    const cursor = new Date(dataInicio);
    cursor.setHours(0, 0, 0, 0);
    const limite = new Date(dataFim);
    limite.setHours(0, 0, 0, 0);

    while (cursor <= limite) {
      const mensal = metasMensais.get(this.toPeriodoMensal(cursor));
      const trimestral = metasTrimestrais.get(this.toPeriodoTrimestral(cursor));
      const anual = metasAnuais.get(this.toPeriodoAnual(cursor));

      if (mensal) {
        total += this.getValorDiarioMeta(cursor, mensal);
      } else if (trimestral) {
        total += this.getValorDiarioMeta(cursor, trimestral);
      } else if (anual) {
        total += this.getValorDiarioMeta(cursor, anual);
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return Number(total.toFixed(2));
  }

  private getValorDiarioMeta(data: Date, meta: MetaEntity): number {
    const valorMeta = Number(meta.valor) || 0;
    if (valorMeta <= 0) {
      return 0;
    }

    const diasNoPeriodo = this.getDiasNoPeriodo(meta.tipo, data);
    if (diasNoPeriodo <= 0) {
      return 0;
    }

    return valorMeta / diasNoPeriodo;
  }

  private getDiasNoPeriodo(tipo: MetaTipo, data: Date): number {
    if (tipo === MetaTipo.ANUAL) {
      const ano = data.getFullYear();
      const inicioAno = new Date(ano, 0, 1);
      const inicioProximoAno = new Date(ano + 1, 0, 1);
      return Math.max(
        1,
        Math.round((inicioProximoAno.getTime() - inicioAno.getTime()) / 86_400_000),
      );
    }

    if (tipo === MetaTipo.TRIMESTRAL) {
      const ano = data.getFullYear();
      const quarter = Math.floor(data.getMonth() / 3);
      const inicioTrimestre = new Date(ano, quarter * 3, 1);
      const inicioProximoTrimestre = new Date(ano, quarter * 3 + 3, 1);
      return Math.max(
        1,
        Math.round((inicioProximoTrimestre.getTime() - inicioTrimestre.getTime()) / 86_400_000),
      );
    }

    const ano = data.getFullYear();
    const mes = data.getMonth();
    return new Date(ano, mes + 1, 0).getDate();
  }

  private buildPeriodosMensais(dataInicio: Date, dataFim: Date): string[] {
    const periodos = new Set<string>();
    const cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1);
    const limite = new Date(dataFim.getFullYear(), dataFim.getMonth(), 1);

    while (cursor <= limite) {
      periodos.add(this.toPeriodoMensal(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return Array.from(periodos);
  }

  private buildPeriodosTrimestrais(dataInicio: Date, dataFim: Date): string[] {
    return Array.from(
      new Set(this.buildPeriodosMensais(dataInicio, dataFim).map((periodo) => this.toPeriodoTrimestral(periodo))),
    );
  }

  private buildPeriodosAnuais(dataInicio: Date, dataFim: Date): string[] {
    return Array.from(
      new Set(this.buildPeriodosMensais(dataInicio, dataFim).map((periodo) => this.toPeriodoAnual(periodo))),
    );
  }

  private normalizePeriodo(tipo: MetaTipo, periodo: string): string | null {
    const bruto = (periodo || '').trim();
    if (!bruto) {
      return null;
    }

    if (tipo === MetaTipo.ANUAL) {
      const match = /^(\d{4})$/.exec(bruto);
      return match ? match[1] : null;
    }

    if (tipo === MetaTipo.TRIMESTRAL) {
      const match = /^(\d{4})-Q([1-4])$/i.exec(bruto);
      return match ? `${match[1]}-Q${match[2]}` : null;
    }

    const match = /^(\d{4})-(\d{1,2})$/.exec(bruto);
    if (!match) {
      return null;
    }
    return `${match[1]}-${String(Number(match[2])).padStart(2, '0')}`;
  }

  private toPeriodoMensal(data: Date | string): string {
    if (typeof data === 'string') {
      return data.slice(0, 7);
    }
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
  }

  private toPeriodoTrimestral(data: Date | string): string {
    if (typeof data === 'string') {
      const [anoRaw, mesRaw] = data.split('-');
      const ano = Number(anoRaw);
      const mes = Number(mesRaw);
      const quarter = Math.floor((mes - 1) / 3) + 1;
      return `${ano}-Q${quarter}`;
    }

    const ano = data.getFullYear();
    const quarter = Math.floor(data.getMonth() / 3) + 1;
    return `${ano}-Q${quarter}`;
  }

  private toPeriodoAnual(data: Date | string): string {
    if (typeof data === 'string') {
      return data.slice(0, 4);
    }
    return String(data.getFullYear());
  }

  private getPeriodoAtual(tipo: MetaTipo): string {
    const now = new Date();
    const year = now.getFullYear();

    if (tipo === MetaTipo.ANUAL) {
      return `${year}`;
    }

    if (tipo === MetaTipo.TRIMESTRAL) {
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      return `${year}-Q${quarter}`;
    }

    return `${year}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private async getVendedorIdSchemaMode(): Promise<'uuid' | 'integer'> {
    if (this.vendedorIdSchemaMode) {
      return this.vendedorIdSchemaMode;
    }

    if (this.vendedorIdSchemaModePromise) {
      return this.vendedorIdSchemaModePromise;
    }

    this.vendedorIdSchemaModePromise = (async () => {
      try {
        const rows: Array<{ data_type?: string; udt_name?: string }> = await this.metasRepository.query(
          `
            SELECT data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'metas'
              AND column_name = 'vendedor_id'
            LIMIT 1
          `,
        );

        const raw = rows?.[0];
        const dataType = (raw?.data_type || '').toLowerCase();
        const udtName = (raw?.udt_name || '').toLowerCase();

        if (udtName === 'uuid') {
          return 'uuid';
        }

        if (dataType.includes('integer') || udtName.includes('int')) {
          return 'integer';
        }
      } catch (error) {
        this.logger.warn(
          `Falha ao detectar schema de metas.vendedor_id; fallback para UUID. Motivo: ${
            (error as Error)?.message || 'desconhecido'
          }`,
        );
      }

      return 'uuid';
    })();

    const mode = await this.vendedorIdSchemaModePromise;
    this.vendedorIdSchemaMode = mode;
    this.vendedorIdSchemaModePromise = null;

    return mode;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private async parseVendedorId(vendedorId?: string | null): Promise<string | undefined> {
    if (vendedorId === null || vendedorId === undefined) {
      return undefined;
    }

    const trimmed = vendedorId.trim();
    if (!trimmed) {
      return undefined;
    }

    const schemaMode = await this.getVendedorIdSchemaMode();

    if (schemaMode === 'integer') {
      if (/^\d+$/.test(trimmed)) {
        return trimmed;
      }

      // Schema legado integer: UUID deve ser ignorado para evitar erro de cast.
      return undefined;
    }

    return this.isUuid(trimmed) ? trimmed : undefined;
  }

  private normalizeOptionalText(value?: string | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
