import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Not, Repository } from 'typeorm';
import {
  CreateVehicleInventoryItemDto,
  ListVehicleInventoryItemsDto,
  RestoreVehicleInventoryItemDto,
  UpdateVehicleInventoryItemDto,
  UpdateVehicleInventoryStatusDto,
  vehicleInventoryStatuses,
} from './dto/vehicle-inventory.dto';
import { VehicleInventoryItem } from './entities/vehicle-inventory-item.entity';

@Injectable()
export class VehicleInventoryService {
  constructor(
    @InjectRepository(VehicleInventoryItem)
    private readonly vehicleInventoryRepository: Repository<VehicleInventoryItem>,
  ) {}

  private toNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private normalizeIdentifier(value?: string | null): string | null {
    const normalized = value?.trim().toUpperCase();
    return normalized ? normalized : null;
  }

  private normalizeRenavam(value?: string | null): string | null {
    const normalized = value?.replace(/\D/g, '').trim();
    return normalized ? normalized : null;
  }

  private ensureYearRange(anoFabricacao: number, anoModelo: number): void {
    if (Math.abs(anoModelo - anoFabricacao) > 1) {
      throw new BadRequestException(
        'Ano do modelo deve estar no intervalo de +/- 1 ano em relacao ao ano de fabricacao',
      );
    }
  }

  private normalizeItem(item: VehicleInventoryItem) {
    return {
      id: item.id,
      empresaId: item.empresaId,
      code: item.code ?? null,
      marca: item.marca,
      modelo: item.modelo,
      versao: item.versao ?? null,
      anoFabricacao: this.toNumber(item.anoFabricacao),
      anoModelo: this.toNumber(item.anoModelo),
      quilometragem:
        item.quilometragem === null || item.quilometragem === undefined
          ? null
          : this.toNumber(item.quilometragem),
      combustivel: item.combustivel ?? null,
      cambio: item.cambio ?? null,
      cor: item.cor ?? null,
      placa: item.placa ?? null,
      chassi: item.chassi ?? null,
      renavam: item.renavam ?? null,
      valorCompra:
        item.valorCompra === null || item.valorCompra === undefined
          ? null
          : this.toNumber(item.valorCompra),
      valorVenda: this.toNumber(item.valorVenda),
      status: item.status,
      metadata: item.metadata ?? null,
      deletedAt: item.deletedAt ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private buildQuery(empresaId: string, includeDeleted = false) {
    const qb = this.vehicleInventoryRepository
      .createQueryBuilder('item')
      .where('item.empresa_id = :empresaId', { empresaId });

    if (includeDeleted) {
      qb.withDeleted();
    } else {
      qb.andWhere('item.deleted_at IS NULL');
    }

    return qb;
  }

  private async ensureUniqueIdentifiers(
    empresaId: string,
    payload: {
      placa?: string | null;
      chassi?: string | null;
      renavam?: string | null;
    },
    excludeId?: string,
  ): Promise<void> {
    const placa = this.normalizeIdentifier(payload.placa);
    const chassi = this.normalizeIdentifier(payload.chassi);
    const renavam = this.normalizeRenavam(payload.renavam);

    if (!placa && !chassi && !renavam) {
      return;
    }

    const conflicts = await this.vehicleInventoryRepository.find({
      where: [
        ...(placa
          ? [
              {
                empresaId,
                placa,
                deletedAt: IsNull(),
                ...(excludeId ? { id: Not(excludeId) } : {}),
              },
            ]
          : []),
        ...(chassi
          ? [
              {
                empresaId,
                chassi,
                deletedAt: IsNull(),
                ...(excludeId ? { id: Not(excludeId) } : {}),
              },
            ]
          : []),
        ...(renavam
          ? [
              {
                empresaId,
                renavam,
                deletedAt: IsNull(),
                ...(excludeId ? { id: Not(excludeId) } : {}),
              },
            ]
          : []),
      ],
      select: ['id', 'placa', 'chassi', 'renavam'],
      take: 1,
    });

    const [conflict] = conflicts;
    if (!conflict) return;

    if (placa && conflict.placa === placa) {
      throw new BadRequestException('Ja existe um veiculo ativo com esta placa');
    }

    if (chassi && conflict.chassi === chassi) {
      throw new BadRequestException('Ja existe um veiculo ativo com este chassi');
    }

    if (renavam && conflict.renavam === renavam) {
      throw new BadRequestException('Ja existe um veiculo ativo com este renavam');
    }
  }

  private async findItemOrFail(
    id: string,
    empresaId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<VehicleInventoryItem> {
    const qb = this.buildQuery(empresaId, options?.includeDeleted ?? false).andWhere(
      'item.id = :id',
      { id },
    );

    const item = await qb.getOne();
    if (!item) {
      throw new NotFoundException('Veiculo nao encontrado');
    }

    return item;
  }

  async listItems(empresaId: string, filtros: ListVehicleInventoryItemsDto) {
    const page = Math.max(1, filtros.page ?? 1);
    const limit = Math.min(100, Math.max(1, filtros.limit ?? 20));

    const qb = this.buildQuery(empresaId, filtros.includeDeleted ?? false);

    if (filtros.search) {
      qb.andWhere(
        new Brackets((subQuery) => {
          subQuery
            .where('item.marca ILIKE :search', { search: `%${filtros.search}%` })
            .orWhere('item.modelo ILIKE :search', { search: `%${filtros.search}%` })
            .orWhere('COALESCE(item.versao, \'\') ILIKE :search', {
              search: `%${filtros.search}%`,
            })
            .orWhere('COALESCE(item.placa, \'\') ILIKE :search', {
              search: `%${filtros.search}%`,
            })
            .orWhere('COALESCE(item.chassi, \'\') ILIKE :search', {
              search: `%${filtros.search}%`,
            })
            .orWhere('COALESCE(item.renavam, \'\') ILIKE :search', {
              search: `%${filtros.search}%`,
            });
        }),
      );
    }

    if (filtros.status) {
      qb.andWhere('item.status = :status', { status: filtros.status });
    }

    if (filtros.marca) {
      qb.andWhere('item.marca ILIKE :marca', { marca: `%${filtros.marca.trim()}%` });
    }

    if (filtros.modelo) {
      qb.andWhere('item.modelo ILIKE :modelo', { modelo: `%${filtros.modelo.trim()}%` });
    }

    if (filtros.combustivel) {
      qb.andWhere('item.combustivel = :combustivel', { combustivel: filtros.combustivel });
    }

    if (filtros.cambio) {
      qb.andWhere('item.cambio = :cambio', { cambio: filtros.cambio });
    }

    if (filtros.anoFabricacaoMin !== undefined) {
      qb.andWhere('item.ano_fabricacao >= :anoFabricacaoMin', {
        anoFabricacaoMin: filtros.anoFabricacaoMin,
      });
    }

    if (filtros.anoFabricacaoMax !== undefined) {
      qb.andWhere('item.ano_fabricacao <= :anoFabricacaoMax', {
        anoFabricacaoMax: filtros.anoFabricacaoMax,
      });
    }

    if (filtros.anoModeloMin !== undefined) {
      qb.andWhere('item.ano_modelo >= :anoModeloMin', {
        anoModeloMin: filtros.anoModeloMin,
      });
    }

    if (filtros.anoModeloMax !== undefined) {
      qb.andWhere('item.ano_modelo <= :anoModeloMax', {
        anoModeloMax: filtros.anoModeloMax,
      });
    }

    const sortField =
      filtros.sortBy === 'valor_venda'
        ? 'item.valor_venda'
        : filtros.sortBy === 'ano_modelo'
          ? 'item.ano_modelo'
          : filtros.sortBy === 'quilometragem'
            ? 'item.quilometragem'
            : filtros.sortBy === 'updated_at'
              ? 'item.updated_at'
              : 'item.created_at';
    const sortDirection = filtros.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(sortField, sortDirection)
      .addOrderBy('item.marca', 'ASC')
      .addOrderBy('item.modelo', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((item) => this.normalizeItem(item)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getItem(id: string, empresaId: string) {
    const item = await this.findItemOrFail(id, empresaId, { includeDeleted: true });
    return this.normalizeItem(item);
  }

  async createItem(empresaId: string, payload: CreateVehicleInventoryItemDto) {
    this.ensureYearRange(payload.anoFabricacao, payload.anoModelo);
    await this.ensureUniqueIdentifiers(empresaId, payload);

    const item = this.vehicleInventoryRepository.create({
      empresaId,
      code: payload.code?.trim() || null,
      marca: payload.marca.trim(),
      modelo: payload.modelo.trim(),
      versao: payload.versao?.trim() || null,
      anoFabricacao: payload.anoFabricacao,
      anoModelo: payload.anoModelo,
      quilometragem: payload.quilometragem ?? null,
      combustivel: payload.combustivel ?? null,
      cambio: payload.cambio ?? null,
      cor: payload.cor?.trim() || null,
      placa: this.normalizeIdentifier(payload.placa),
      chassi: this.normalizeIdentifier(payload.chassi),
      renavam: this.normalizeRenavam(payload.renavam),
      valorCompra: payload.valorCompra ?? null,
      valorVenda: payload.valorVenda,
      status: payload.status ?? 'disponivel',
      metadata: payload.metadata ?? null,
    });

    const saved = await this.vehicleInventoryRepository.save(item);
    return this.getItem(saved.id, empresaId);
  }

  async updateItem(id: string, empresaId: string, payload: UpdateVehicleInventoryItemDto) {
    const item = await this.findItemOrFail(id, empresaId, { includeDeleted: true });

    const anoFabricacao = payload.anoFabricacao ?? item.anoFabricacao;
    const anoModelo = payload.anoModelo ?? item.anoModelo;
    this.ensureYearRange(anoFabricacao, anoModelo);

    await this.ensureUniqueIdentifiers(
      empresaId,
      {
        placa: payload.placa !== undefined ? payload.placa : item.placa,
        chassi: payload.chassi !== undefined ? payload.chassi : item.chassi,
        renavam: payload.renavam !== undefined ? payload.renavam : item.renavam,
      },
      item.id,
    );

    if (payload.code !== undefined) item.code = payload.code?.trim() || null;
    if (payload.marca !== undefined) item.marca = payload.marca.trim();
    if (payload.modelo !== undefined) item.modelo = payload.modelo.trim();
    if (payload.versao !== undefined) item.versao = payload.versao?.trim() || null;
    if (payload.anoFabricacao !== undefined) item.anoFabricacao = payload.anoFabricacao;
    if (payload.anoModelo !== undefined) item.anoModelo = payload.anoModelo;
    if (payload.quilometragem !== undefined) item.quilometragem = payload.quilometragem ?? null;
    if (payload.combustivel !== undefined) item.combustivel = payload.combustivel ?? null;
    if (payload.cambio !== undefined) item.cambio = payload.cambio ?? null;
    if (payload.cor !== undefined) item.cor = payload.cor?.trim() || null;
    if (payload.placa !== undefined) item.placa = this.normalizeIdentifier(payload.placa);
    if (payload.chassi !== undefined) item.chassi = this.normalizeIdentifier(payload.chassi);
    if (payload.renavam !== undefined) item.renavam = this.normalizeRenavam(payload.renavam);
    if (payload.valorCompra !== undefined) item.valorCompra = payload.valorCompra ?? null;
    if (payload.valorVenda !== undefined) item.valorVenda = payload.valorVenda;
    if (payload.status !== undefined) item.status = payload.status;
    if (payload.metadata !== undefined) item.metadata = payload.metadata ?? null;

    await this.vehicleInventoryRepository.save(item);
    return this.getItem(id, empresaId);
  }

  async updateStatus(id: string, empresaId: string, payload: UpdateVehicleInventoryStatusDto) {
    const item = await this.findItemOrFail(id, empresaId, { includeDeleted: true });
    item.status = payload.status;
    await this.vehicleInventoryRepository.save(item);
    return this.getItem(id, empresaId);
  }

  async removeItem(id: string, empresaId: string) {
    const item = await this.findItemOrFail(id, empresaId, { includeDeleted: true });
    if (!item.deletedAt) {
      item.deletedAt = new Date();
      if (item.status !== 'vendido') {
        item.status = 'indisponivel';
      }
      await this.vehicleInventoryRepository.save(item);
    }

    return { message: 'Veiculo removido do estoque com sucesso' };
  }

  async restoreItem(id: string, empresaId: string, payload?: RestoreVehicleInventoryItemDto) {
    const item = await this.findItemOrFail(id, empresaId, { includeDeleted: true });
    if (!item.deletedAt) {
      return this.normalizeItem(item);
    }

    item.deletedAt = null;
    item.status = payload?.status ?? 'disponivel';

    if (!vehicleInventoryStatuses.includes(item.status as (typeof vehicleInventoryStatuses)[number])) {
      throw new BadRequestException('Status informado para restauracao e invalido');
    }

    await this.vehicleInventoryRepository.save(item);
    return this.getItem(id, empresaId);
  }

  async getStats(empresaId: string) {
    const raw = await this.vehicleInventoryRepository
      .createQueryBuilder('item')
      .select('COUNT(*)', 'totalItems')
      .addSelect(`COUNT(*) FILTER (WHERE item.deleted_at IS NULL)`, 'activeItems')
      .addSelect(
        `COUNT(*) FILTER (WHERE item.deleted_at IS NULL AND item.status = 'disponivel')`,
        'availableItems',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE item.deleted_at IS NULL AND item.status = 'reservado')`,
        'reservedItems',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE item.deleted_at IS NULL AND item.status = 'vendido')`,
        'soldItems',
      )
      .addSelect(`COUNT(*) FILTER (WHERE item.deleted_at IS NOT NULL)`, 'deletedItems')
      .addSelect(
        `COALESCE(SUM(item.valor_venda) FILTER (WHERE item.deleted_at IS NULL), 0)`,
        'totalSaleValue',
      )
      .where('item.empresa_id = :empresaId', { empresaId })
      .getRawOne();

    return {
      totalItems: this.toNumber(raw?.totalitems ?? raw?.totalItems, 0),
      activeItems: this.toNumber(raw?.activeitems ?? raw?.activeItems, 0),
      availableItems: this.toNumber(raw?.availableitems ?? raw?.availableItems, 0),
      reservedItems: this.toNumber(raw?.reserveditems ?? raw?.reservedItems, 0),
      soldItems: this.toNumber(raw?.solditems ?? raw?.soldItems, 0),
      deletedItems: this.toNumber(raw?.deleteditems ?? raw?.deletedItems, 0),
      totalSaleValue: this.toNumber(raw?.totalsalevalue ?? raw?.totalSaleValue, 0),
    };
  }
}
