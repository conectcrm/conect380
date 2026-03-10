import { api } from './api';

export type VehicleInventoryStatus = 'disponivel' | 'reservado' | 'vendido' | 'indisponivel';
export type VehicleFuelType =
  | 'gasolina'
  | 'etanol'
  | 'flex'
  | 'diesel'
  | 'eletrico'
  | 'hibrido'
  | 'gnv'
  | 'outro';
export type VehicleTransmissionType =
  | 'manual'
  | 'automatico'
  | 'cvt'
  | 'semi_automatico'
  | 'outro';

export interface VehicleInventoryItem {
  id: string;
  empresaId: string;
  code?: string | null;
  marca: string;
  modelo: string;
  versao?: string | null;
  anoFabricacao: number;
  anoModelo: number;
  quilometragem?: number | null;
  combustivel?: VehicleFuelType | null;
  cambio?: VehicleTransmissionType | null;
  cor?: string | null;
  placa?: string | null;
  chassi?: string | null;
  renavam?: string | null;
  valorCompra?: number | null;
  valorVenda: number;
  status: VehicleInventoryStatus;
  metadata?: Record<string, unknown> | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleInventoryListFilters {
  search?: string;
  status?: VehicleInventoryStatus;
  marca?: string;
  modelo?: string;
  combustivel?: VehicleFuelType;
  cambio?: VehicleTransmissionType;
  anoFabricacaoMin?: number;
  anoFabricacaoMax?: number;
  anoModeloMin?: number;
  anoModeloMax?: number;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'created_at' | 'updated_at' | 'valor_venda' | 'ano_modelo' | 'quilometragem';
  sortOrder?: 'asc' | 'desc';
}

export interface VehicleInventoryListResponse {
  data: VehicleInventoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VehicleInventoryStats {
  totalItems: number;
  activeItems: number;
  availableItems: number;
  reservedItems: number;
  soldItems: number;
  deletedItems: number;
  totalSaleValue: number;
}

export interface CreateVehicleInventoryItemData {
  code?: string | null;
  marca: string;
  modelo: string;
  versao?: string | null;
  anoFabricacao: number;
  anoModelo: number;
  quilometragem?: number | null;
  combustivel?: VehicleFuelType | null;
  cambio?: VehicleTransmissionType | null;
  cor?: string | null;
  placa?: string | null;
  chassi?: string | null;
  renavam?: string | null;
  valorCompra?: number | null;
  valorVenda: number;
  status?: VehicleInventoryStatus;
  metadata?: Record<string, unknown>;
}

export type UpdateVehicleInventoryItemData = Partial<CreateVehicleInventoryItemData>;

class VehicleInventoryService {
  private buildParams(filters: VehicleInventoryListFilters = {}): string {
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.marca) params.append('marca', filters.marca);
    if (filters.modelo) params.append('modelo', filters.modelo);
    if (filters.combustivel) params.append('combustivel', filters.combustivel);
    if (filters.cambio) params.append('cambio', filters.cambio);
    if (filters.anoFabricacaoMin !== undefined) {
      params.append('anoFabricacaoMin', String(filters.anoFabricacaoMin));
    }
    if (filters.anoFabricacaoMax !== undefined) {
      params.append('anoFabricacaoMax', String(filters.anoFabricacaoMax));
    }
    if (filters.anoModeloMin !== undefined) {
      params.append('anoModeloMin', String(filters.anoModeloMin));
    }
    if (filters.anoModeloMax !== undefined) {
      params.append('anoModeloMax', String(filters.anoModeloMax));
    }
    if (filters.includeDeleted !== undefined) {
      params.append('includeDeleted', String(filters.includeDeleted));
    }
    if (filters.page !== undefined) params.append('page', String(filters.page));
    if (filters.limit !== undefined) params.append('limit', String(filters.limit));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return params.toString();
  }

  async listItems(filters: VehicleInventoryListFilters = {}): Promise<VehicleInventoryListResponse> {
    const query = this.buildParams(filters);
    const response = await api.get(`/vehicle-inventory/items${query ? `?${query}` : ''}`);
    return response.data;
  }

  async getItem(id: string): Promise<VehicleInventoryItem> {
    const response = await api.get(`/vehicle-inventory/items/${id}`);
    return response.data;
  }

  async createItem(data: CreateVehicleInventoryItemData): Promise<VehicleInventoryItem> {
    const response = await api.post('/vehicle-inventory/items', data);
    return response.data;
  }

  async updateItem(id: string, data: UpdateVehicleInventoryItemData): Promise<VehicleInventoryItem> {
    const response = await api.put(`/vehicle-inventory/items/${id}`, data);
    return response.data;
  }

  async updateStatus(id: string, status: VehicleInventoryStatus): Promise<VehicleInventoryItem> {
    const response = await api.patch(`/vehicle-inventory/items/${id}/status`, { status });
    return response.data;
  }

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/vehicle-inventory/items/${id}`);
  }

  async restoreItem(id: string, status: VehicleInventoryStatus = 'disponivel') {
    const response = await api.patch(`/vehicle-inventory/items/${id}/restore`, { status });
    return response.data as VehicleInventoryItem;
  }

  async getStats(): Promise<VehicleInventoryStats> {
    const response = await api.get('/vehicle-inventory/stats');
    return response.data;
  }
}

export const vehicleInventoryService = new VehicleInventoryService();
