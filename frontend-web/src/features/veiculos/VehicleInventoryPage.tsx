import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Car,
  CheckCircle2,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DataTableCard,
  EmptyState,
  FiltersBar,
  InlineStats,
  LoadingSkeleton,
  PageHeader,
  SectionCard,
  shellFieldTokens,
} from '../../components/layout-v2';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { userHasPermission } from '../../config/menuConfig';
import { useAuth } from '../../hooks/useAuth';
import { useConfirmation } from '../../hooks/useConfirmation';
import {
  type VehicleFuelType,
  type VehicleInventoryItem,
  type VehicleInventoryStatus,
  type VehicleTransmissionType,
  vehicleInventoryService,
} from '../../services/vehicleInventoryService';

type FormState = {
  code: string;
  marca: string;
  modelo: string;
  versao: string;
  anoFabricacao: string;
  anoModelo: string;
  quilometragem: string;
  combustivel: VehicleFuelType | '';
  cambio: VehicleTransmissionType | '';
  cor: string;
  placa: string;
  chassi: string;
  renavam: string;
  valorCompra: string;
  valorVenda: string;
  status: VehicleInventoryStatus;
};

const STATUS_OPTIONS: Array<{ value: VehicleInventoryStatus; label: string }> = [
  { value: 'disponivel', label: 'Disponivel' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'indisponivel', label: 'Indisponivel' },
];

const FUEL_OPTIONS: Array<{ value: VehicleFuelType; label: string }> = [
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'etanol', label: 'Etanol' },
  { value: 'flex', label: 'Flex' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'eletrico', label: 'Eletrico' },
  { value: 'hibrido', label: 'Hibrido' },
  { value: 'gnv', label: 'GNV' },
  { value: 'outro', label: 'Outro' },
];

const TRANSMISSION_OPTIONS: Array<{ value: VehicleTransmissionType; label: string }> = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatico', label: 'Automatico' },
  { value: 'cvt', label: 'CVT' },
  { value: 'semi_automatico', label: 'Semi-automatico' },
  { value: 'outro', label: 'Outro' },
];

const EMPTY_FORM: FormState = {
  code: '',
  marca: '',
  modelo: '',
  versao: '',
  anoFabricacao: '',
  anoModelo: '',
  quilometragem: '',
  combustivel: '',
  cambio: '',
  cor: '',
  placa: '',
  chassi: '',
  renavam: '',
  valorCompra: '',
  valorVenda: '',
  status: 'disponivel',
};

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const parseOptionalNumber = (value: string): number | null | undefined => {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const mapItemToForm = (item: VehicleInventoryItem): FormState => ({
  code: item.code || '',
  marca: item.marca || '',
  modelo: item.modelo || '',
  versao: item.versao || '',
  anoFabricacao: String(item.anoFabricacao || ''),
  anoModelo: String(item.anoModelo || ''),
  quilometragem:
    item.quilometragem === null || item.quilometragem === undefined
      ? ''
      : String(item.quilometragem),
  combustivel: item.combustivel || '',
  cambio: item.cambio || '',
  cor: item.cor || '',
  placa: item.placa || '',
  chassi: item.chassi || '',
  renavam: item.renavam || '',
  valorCompra:
    item.valorCompra === null || item.valorCompra === undefined ? '' : String(item.valorCompra),
  valorVenda: String(item.valorVenda || ''),
  status: item.status,
});

const VehicleInventoryPage: React.FC = () => {
  const { user } = useAuth();
  const { confirmationState, showConfirmation } = useConfirmation();
  const canCreate = userHasPermission(user, 'crm.produtos.create');
  const canUpdate = userHasPermission(user, 'crm.produtos.update');
  const canDelete = userHasPermission(user, 'crm.produtos.delete');

  const [items, setItems] = useState<VehicleInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | VehicleInventoryStatus>('todos');
  const [fuelFilter, setFuelFilter] = useState<'' | VehicleFuelType>('');
  const [transmissionFilter, setTransmissionFilter] = useState<'' | VehicleTransmissionType>('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState({
    totalItems: 0,
    availableItems: 0,
    reservedItems: 0,
    soldItems: 0,
    deletedItems: 0,
    totalSaleValue: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<VehicleInventoryItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const marcaInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [listResponse, statsResponse] = await Promise.all([
        vehicleInventoryService.listItems({
          search: debouncedSearchTerm || undefined,
          status: statusFilter !== 'todos' ? statusFilter : undefined,
          combustivel: fuelFilter || undefined,
          cambio: transmissionFilter || undefined,
          includeDeleted,
          page,
          limit,
          sortBy: 'created_at',
          sortOrder: 'desc',
        }),
        vehicleInventoryService.getStats(),
      ]);

      setItems(listResponse.data || []);
      setTotalItems(listResponse.meta?.total || 0);
      setTotalPages(listResponse.meta?.totalPages || 1);
      setStats({
        totalItems: statsResponse.totalItems || 0,
        availableItems: statsResponse.availableItems || 0,
        reservedItems: statsResponse.reservedItems || 0,
        soldItems: statsResponse.soldItems || 0,
        deletedItems: statsResponse.deletedItems || 0,
        totalSaleValue: statsResponse.totalSaleValue || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar estoque de veiculos:', error);
      setError('Erro ao carregar estoque de veiculos. Tente novamente.');
      toast.error('Nao foi possivel carregar o estoque de veiculos.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, fuelFilter, includeDeleted, limit, page, statusFilter, transmissionFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, statusFilter, fuelFilter, transmissionFilter, includeDeleted]);

  const statusLabelMap = useMemo(
    () =>
      STATUS_OPTIONS.reduce<Record<string, string>>((acc, option) => {
        acc[option.value] = option.label;
        return acc;
      }, {}),
    [],
  );

  const hasFilters = useMemo(
    () =>
      searchTerm.trim().length > 0 ||
      statusFilter !== 'todos' ||
      Boolean(fuelFilter) ||
      Boolean(transmissionFilter) ||
      includeDeleted,
    [fuelFilter, includeDeleted, searchTerm, statusFilter, transmissionFilter],
  );

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('todos');
    setFuelFilter('');
    setTransmissionFilter('');
    setIncludeDeleted(false);
    setPage(1);
  }, []);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }, []);

  const openEdit = useCallback((item: VehicleInventoryItem) => {
    setEditing(item);
    setForm(mapItemToForm(item));
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeModal();
    };

    document.addEventListener('keydown', handleKeyDown);

    const raf = window.requestAnimationFrame(() => {
      marcaInputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeModal, isModalOpen]);

  const saveItem = async () => {
    const anoFabricacao = Number(form.anoFabricacao);
    const anoModelo = Number(form.anoModelo);
    const valorVenda = Number(form.valorVenda);

    if (!form.marca.trim() || !form.modelo.trim()) {
      toast.error('Marca e modelo sao obrigatorios.');
      return;
    }

    if (!Number.isFinite(anoFabricacao) || !Number.isFinite(anoModelo)) {
      toast.error('Ano de fabricacao e ano de modelo sao obrigatorios.');
      return;
    }

    if (!Number.isFinite(valorVenda)) {
      toast.error('Valor de venda e obrigatorio.');
      return;
    }

    const quilometragem = parseOptionalNumber(form.quilometragem);
    if (quilometragem === null) {
      toast.error('Quilometragem invalida.');
      return;
    }

    const valorCompra = parseOptionalNumber(form.valorCompra);
    if (valorCompra === null) {
      toast.error('Valor de compra invalido.');
      return;
    }

    const payload = {
      code: form.code.trim() || null,
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      versao: form.versao.trim() || null,
      anoFabricacao,
      anoModelo,
      quilometragem: quilometragem ?? null,
      combustivel: form.combustivel || null,
      cambio: form.cambio || null,
      cor: form.cor.trim() || null,
      placa: form.placa.trim() || null,
      chassi: form.chassi.trim() || null,
      renavam: form.renavam.trim() || null,
      valorCompra: valorCompra ?? null,
      valorVenda,
      status: form.status,
    };

    try {
      setSaving(true);
      if (editing) {
        await vehicleInventoryService.updateItem(editing.id, payload);
        toast.success('Veiculo atualizado com sucesso.');
      } else {
        await vehicleInventoryService.createItem(payload);
        toast.success('Veiculo cadastrado com sucesso.');
      }
      closeModal();
      await loadData();
    } catch (error: any) {
      console.error('Erro ao salvar veiculo:', error);
      toast.error(error?.response?.data?.message || 'Falha ao salvar veiculo.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item: VehicleInventoryItem) => {
    showConfirmation({
      title: 'Remover veiculo do estoque?',
      message: `Remover ${item.marca} ${item.modelo} do estoque?`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      icon: 'danger',
      confirmButtonClass: 'bg-[#B33A3A] hover:bg-[#9F2F2F] focus:ring-[#B33A3A]',
      onConfirm: () => {
        void (async () => {
          try {
            await vehicleInventoryService.deleteItem(item.id);
            toast.success('Veiculo removido com sucesso.');
            await loadData();
          } catch (error: any) {
            console.error('Erro ao remover veiculo:', error);
            toast.error(error?.response?.data?.message || 'Falha ao remover veiculo.');
          }
        })();
      },
    });
  };

  const restoreItem = async (item: VehicleInventoryItem) => {
    try {
      await vehicleInventoryService.restoreItem(item.id);
      toast.success('Veiculo restaurado com sucesso.');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao restaurar veiculo:', error);
      toast.error(error?.response?.data?.message || 'Falha ao restaurar veiculo.');
    }
  };

  const updateStatus = async (item: VehicleInventoryItem, status: VehicleInventoryStatus) => {
    try {
      await vehicleInventoryService.updateStatus(item.id, status);
      toast.success('Status atualizado.');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error?.response?.data?.message || 'Falha ao atualizar status.');
    }
  };

  const inlineStats = useMemo(
    () => [
      { label: 'Total', value: String(stats.totalItems), tone: 'neutral' as const },
      { label: 'Disponiveis', value: String(stats.availableItems), tone: 'accent' as const },
      { label: 'Reservados', value: String(stats.reservedItems), tone: 'neutral' as const },
      { label: 'Vendidos', value: String(stats.soldItems), tone: 'neutral' as const },
      { label: 'Removidos', value: String(stats.deletedItems), tone: 'warning' as const },
      { label: 'Valor potencial', value: formatCurrency(stats.totalSaleValue), tone: 'neutral' as const },
    ],
    [stats],
  );

  if (loading && items.length === 0 && !error) {
    return (
      <div className="space-y-4 pt-1 sm:pt-2">
        <LoadingSkeleton lines={7} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="space-y-4 p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Car className="h-6 w-6 text-[#159A9C]" />
              Estoque de Veiculos
            </span>
          }
          description="Modulo especializado para lojas de veiculos: cadastro, status e precificacao."
          actions={
            <>
              <button
                type="button"
                onClick={() => void loadData()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-[#D6E3E9] bg-white px-3 py-2 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#159A9C] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0F7B7D]"
                >
                  <Plus className="h-4 w-4" />
                  Novo veiculo
                </button>
              )}
            </>
          }
        />

        <InlineStats stats={inlineStats} />
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="grid w-full grid-cols-1 gap-3 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8FA6B2]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por marca, modelo, versao, placa ou chassi..."
                className={shellFieldTokens.withIcon}
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className={shellFieldTokens.base}
            aria-label="Filtrar por status"
          >
            <option value="todos">Status: Todos</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={fuelFilter}
            onChange={(event) => setFuelFilter(event.target.value as typeof fuelFilter)}
            className={shellFieldTokens.base}
            aria-label="Filtrar por combustivel"
          >
            <option value="">Combustivel: Todos</option>
            {FUEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={transmissionFilter}
            onChange={(event) =>
              setTransmissionFilter(event.target.value as typeof transmissionFilter)
            }
            className={shellFieldTokens.base}
            aria-label="Filtrar por cambio"
          >
            <option value="">Cambio: Todos</option>
            {TRANSMISSION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="flex h-10 items-center gap-2 rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm text-[#244455]">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => setIncludeDeleted(event.target.checked)}
              className="h-4 w-4 accent-[#1A9E87]"
            />
            Exibir removidos
          </label>
        </div>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2 text-xs">
              {statusFilter !== 'todos' && (
                <span className="rounded-full border border-[#D4E2E7] bg-white px-3 py-1 font-medium text-[#244455]">
                  Status: {statusLabelMap[statusFilter] || statusFilter}
                </span>
              )}
              {fuelFilter && (
                <span className="rounded-full border border-[#D4E2E7] bg-white px-3 py-1 font-medium text-[#244455]">
                  Combustivel:{' '}
                  {FUEL_OPTIONS.find((option) => option.value === fuelFilter)?.label || fuelFilter}
                </span>
              )}
              {transmissionFilter && (
                <span className="rounded-full border border-[#D4E2E7] bg-white px-3 py-1 font-medium text-[#244455]">
                  Cambio:{' '}
                  {TRANSMISSION_OPTIONS.find((option) => option.value === transmissionFilter)?.label ||
                    transmissionFilter}
                </span>
              )}
              {includeDeleted && (
                <span className="rounded-full border border-[#E9D7BD] bg-[#FFF7E9] px-3 py-1 font-medium text-[#8A5A1A]">
                  Incluindo removidos
                </span>
              )}
              {searchTerm.trim() && (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-3 py-1 font-medium text-[#0F7B7D]">
                  Busca ativa
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D4E2E7] bg-white px-3 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </FiltersBar>

      <DataTableCard>
        <div className="border-b border-[#E1EAEE] bg-[#F8FBFC] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#516F7D]">
              <h3 className="text-sm font-semibold text-[#1B3B4E]">
                Lista de veiculos ({totalItems})
              </h3>
              {hasFilters && (
                <span className="rounded-full border border-[#CDE6DF] bg-[#ECF7F3] px-2 py-0.5 text-xs font-medium text-[#0F7B7D]">
                  filtros ativos
                </span>
              )}
              {loading && items.length > 0 && (
                <span className="inline-flex items-center gap-2 text-xs text-[#607B89]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#1A9E87]" />
                  atualizando
                </span>
              )}
            </div>
            <div className="text-xs text-[#607B89]">
              Pagina {page} de {totalPages}
            </div>
          </div>
        </div>

        {error && (
          <div className="border-b border-[#E1EAEE] bg-[#FFF7F7] px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#B4233A]">{error}</p>
              <button
                type="button"
                onClick={() => void loadData()}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#E7C4CB] bg-white px-3 text-xs font-medium text-[#B4233A] transition hover:bg-[#FFF2F4]"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState
              icon={<Car className="h-5 w-5" />}
              title={error ? 'Falha ao carregar veiculos' : 'Nenhum veiculo encontrado'}
              description={
                error
                  ? 'Verifique sua conexao e tente novamente.'
                  : totalItems === 0 && !hasFilters
                    ? 'Comece cadastrando seu primeiro veiculo no estoque.'
                    : 'Tente ajustar os filtros ou o termo de busca.'
              }
              action={
                error ? (
                  <button
                    type="button"
                    onClick={() => void loadData()}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition hover:bg-[#0F7B7D]"
                  >
                    Tentar novamente
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D4E2E7] bg-white px-4 text-sm font-medium text-[#244455] transition hover:bg-[#F6FAFB]"
                      >
                        Limpar filtros
                      </button>
                    )}
                    {canCreate && (
                      <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white transition hover:bg-[#0F7B7D]"
                      >
                        <Plus className="h-4 w-4" />
                        Cadastrar veiculo
                      </button>
                    )}
                  </div>
                )
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-[#F6FAFB]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5F7B89]">
                      Veiculo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5F7B89]">
                      Ano
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5F7B89]">
                      Tec.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5F7B89]">
                      Identificadores
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5F7B89]">
                      Valor venda
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#5F7B89]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#5F7B89]">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t border-[#EDF3F6]">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-[#123347]">
                          {item.marca} {item.modelo}
                        </p>
                        <p className="text-xs text-[#5F7B89]">
                          {item.versao || '-'} {item.code ? `- ${item.code}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#244455]">
                        {item.anoFabricacao}/{item.anoModelo}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#244455]">
                        <p>KM: {item.quilometragem ?? '-'}</p>
                        <p>
                          {item.combustivel || '-'} / {item.cambio || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#244455]">
                        <p>Placa: {item.placa || '-'}</p>
                        <p>Chassi: {item.chassi || '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#123347]">
                        <p className="font-medium">{formatCurrency(item.valorVenda)}</p>
                        <p className="text-xs text-[#5F7B89]">
                          Compra: {item.valorCompra ? formatCurrency(item.valorCompra) : '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {canUpdate && !item.deletedAt ? (
                          <select
                            value={item.status}
                            onChange={(event) =>
                              void updateStatus(item, event.target.value as VehicleInventoryStatus)
                            }
                            className="h-8 rounded-md border border-[#D6E3E9] bg-white px-2 text-xs text-[#244455] outline-none"
                            aria-label="Atualizar status"
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm text-[#244455]">
                            {statusLabelMap[item.status] || item.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {item.deletedAt ? (
                            canUpdate && (
                              <button
                                type="button"
                                onClick={() => void restoreItem(item)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D6E3E9] text-[#35538A] transition hover:bg-[#F6FAFB]"
                                title="Restaurar"
                              >
                                <Undo2 className="h-4 w-4" />
                              </button>
                            )
                          ) : (
                            <>
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(item)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D6E3E9] text-[#159A9C] transition hover:bg-[#F6FAFB]"
                                  title="Editar"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => void removeItem(item)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D6E3E9] text-[#B33A3A] transition hover:bg-[#FDF6F6]"
                                  title="Remover"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {loading && items.length > 0 && (
                    <tr className="border-t border-[#EDF3F6]">
                      <td colSpan={7} className="px-4 py-3 text-xs text-[#6B8794]">
                        Atualizando lista...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[#EDF3F6] bg-[#FAFCFD] px-4 py-3 text-xs text-[#5F7B89] sm:px-5">
              <p>
                {items.length} de {totalItems} registro(s)
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-md border border-[#D6E3E9] bg-white px-3 py-1 text-[#244455] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Anterior
                </button>
                <span>
                  Pagina {page} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                  disabled={page >= totalPages || loading}
                  className="rounded-md border border-[#D6E3E9] bg-white px-3 py-1 text-[#244455] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Proxima
                </button>
              </div>
            </div>
          </>
        )}
      </DataTableCard>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target !== event.currentTarget) return;
            closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vehicle-inventory-modal-title"
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#D6E3E9] bg-white shadow-2xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-[#E4EDF1] bg-white px-5 py-4">
              <h2 id="vehicle-inventory-modal-title" className="text-lg font-semibold text-[#123347]">
                {editing ? 'Editar veiculo' : 'Novo veiculo'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#D6E3E9] text-[#5F7B89]"
                aria-label="Fechar modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#123347]">Identificacao</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Codigo</span>
                    <input
                      value={form.code}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, code: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Marca *</span>
                    <input
                      ref={marcaInputRef}
                      value={form.marca}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, marca: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Modelo *</span>
                    <input
                      value={form.modelo}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, modelo: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Versao</span>
                    <input
                      value={form.versao}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, versao: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#123347]">Tecnico</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Ano fabricacao *</span>
                    <input
                      type="number"
                      value={form.anoFabricacao}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, anoFabricacao: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Ano modelo *</span>
                    <input
                      type="number"
                      value={form.anoModelo}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, anoModelo: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Quilometragem</span>
                    <input
                      type="number"
                      min={0}
                      value={form.quilometragem}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, quilometragem: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Cor</span>
                    <input
                      value={form.cor}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, cor: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Combustivel</span>
                    <select
                      value={form.combustivel}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          combustivel: event.target.value as FormState['combustivel'],
                        }))
                      }
                      className={shellFieldTokens.base}
                    >
                      <option value="">Nao informado</option>
                      {FUEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Cambio</span>
                    <select
                      value={form.cambio}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          cambio: event.target.value as FormState['cambio'],
                        }))
                      }
                      className={shellFieldTokens.base}
                    >
                      <option value="">Nao informado</option>
                      {TRANSMISSION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Placa</span>
                    <input
                      value={form.placa}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, placa: event.target.value }))
                      }
                      className={`${shellFieldTokens.base} uppercase`}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Chassi</span>
                    <input
                      value={form.chassi}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, chassi: event.target.value }))
                      }
                      className={`${shellFieldTokens.base} uppercase`}
                    />
                  </label>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-[#123347]">Comercial</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Renavam</span>
                    <input
                      value={form.renavam}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, renavam: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Valor compra</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.valorCompra}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, valorCompra: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Valor venda *</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={form.valorVenda}
                      onChange={(event) =>
                        setForm((previous) => ({ ...previous, valorVenda: event.target.value }))
                      }
                      className={shellFieldTokens.base}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-xs text-[#5F7B89]">Status</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((previous) => ({
                          ...previous,
                          status: event.target.value as VehicleInventoryStatus,
                        }))
                      }
                      className={shellFieldTokens.base}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-[#D6E3E9] bg-[#F8FBFD] px-3 py-2 text-xs text-[#244455]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#159A9C]" />
                  Status selecionado: {statusLabelMap[form.status]}
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 border-t border-[#E4EDF1] bg-white px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 items-center rounded-lg border border-[#D6E3E9] px-4 text-sm font-medium text-[#244455]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveItem()}
                disabled={saving}
                className="inline-flex h-10 items-center rounded-lg bg-[#159A9C] px-4 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alteracoes' : 'Cadastrar veiculo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal confirmationState={confirmationState} />
    </div>
  );
};

export default VehicleInventoryPage;
