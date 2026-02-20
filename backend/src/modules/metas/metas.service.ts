import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
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
