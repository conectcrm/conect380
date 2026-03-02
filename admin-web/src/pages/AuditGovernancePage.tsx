import { AxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type ActivityItem = {
  id: string;
  tipo: string;
  descricao: string;
  timestamp?: string;
  categoria?: string | null;
  evento?: string | null;
  detalhes?: string;
  usuario?: {
    nome?: string;
  };
};

type DateRange = {
  startDate: string;
  endDate: string;
};

const PAGE_SIZE = 20;

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const parseErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const toApiStartDate = (value: string): string => `${value}T00:00:00.000Z`;
const toApiEndDate = (value: string): string => `${value}T23:59:59.999Z`;

export const AuditGovernancePage = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number | boolean> = {
        limit: 200,
        admin_only: true,
      };

      if (appliedDateRange.startDate) {
        params.data_inicio = toApiStartDate(appliedDateRange.startDate);
      }
      if (appliedDateRange.endDate) {
        params.data_fim = toApiEndDate(appliedDateRange.endDate);
      }

      const response = await api.get('/admin/bff/audit/activities', { params });

      const list = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
      setActivities(
        Array.isArray(list)
          ? list.map((item: Record<string, unknown>) => ({
              id: String(item.id ?? ''),
              tipo: String(item.tipo ?? ''),
              descricao: String(item.descricao ?? ''),
              categoria: typeof item.categoria === 'string' ? item.categoria : null,
              evento: typeof item.evento === 'string' ? item.evento : null,
              detalhes: typeof item.detalhes === 'string' ? item.detalhes : undefined,
              timestamp:
                typeof item.timestamp === 'string'
                  ? item.timestamp
                  : typeof item.created_at === 'string'
                    ? item.created_at
                    : undefined,
              usuario:
                typeof item.usuario === 'object' && item.usuario
                  ? (item.usuario as ActivityItem['usuario'])
                  : undefined,
            }))
          : [],
      );
      setCurrentPage(1);
    } catch (loadError) {
      setError(parseErrorMessage(loadError, 'Falha ao carregar trilha de auditoria administrativa.'));
    } finally {
      setLoading(false);
    }
  }, [appliedDateRange.endDate, appliedDateRange.startDate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const activity of activities) {
      if (activity.categoria) {
        set.add(activity.categoria);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return activities.filter((activity) => {
      if (categoryFilter !== 'ALL' && activity.categoria !== categoryFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableFields = [
        activity.descricao,
        activity.tipo,
        activity.categoria || '',
        activity.evento || '',
        activity.usuario?.nome || '',
      ]
        .join(' ')
        .toLowerCase();

      return searchableFields.includes(normalizedSearch);
    });
  }, [activities, categoryFilter, searchTerm]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredActivities.length / PAGE_SIZE)),
    [filteredActivities.length],
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pagedActivities = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredActivities.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredActivities]);

  const handleApplyDateFilter = () => {
    if (dateRange.startDate && dateRange.endDate && dateRange.endDate < dateRange.startDate) {
      setError('Periodo invalido: data final nao pode ser menor que a data inicial.');
      return;
    }

    setError(null);
    setAppliedDateRange({ ...dateRange });
  };

  const handleClearDateFilter = () => {
    setError(null);
    setDateRange({ startDate: '', endDate: '' });
    setAppliedDateRange({ startDate: '', endDate: '' });
  };

  return (
    <section className="card">
      <header className="card-headline">
        <h2>Auditoria administrativa</h2>
        <button type="button" className="button secondary" onClick={() => void loadData()} disabled={loading}>
          Recarregar
        </button>
      </header>
      <p className="subtle">
        Trilha de eventos administrativos via gateway com filtros por categoria, busca e periodo.
      </p>

      <div className="filters-bar">
        <label>
          Categoria
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">Todas</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Buscar
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Descricao, usuario, evento..."
          />
        </label>

        <label>
          Data inicio
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(event) => setDateRange((current) => ({ ...current, startDate: event.target.value }))}
          />
        </label>

        <label>
          Data fim
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(event) => setDateRange((current) => ({ ...current, endDate: event.target.value }))}
          />
        </label>
      </div>

      <div className="filters-actions">
        <button type="button" className="button secondary tiny" onClick={handleApplyDateFilter} disabled={loading}>
          Aplicar periodo
        </button>
        <button type="button" className="button ghost tiny" onClick={handleClearDateFilter} disabled={loading}>
          Limpar periodo
        </button>
      </div>

      {loading ? <p>Carregando trilha...</p> : null}
      {!loading && error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <>
          <p className="subtle pagination-info">
            Exibindo {filteredActivities.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filteredActivities.length)} de {filteredActivities.length}{' '}
            eventos
          </p>

          <ul className="timeline">
            {pagedActivities.map((activity) => (
              <li key={activity.id}>
                <span>{formatDate(activity.timestamp)}</span>
                <strong>{activity.descricao}</strong>
                <small>
                  {activity.tipo} - {activity.usuario?.nome || 'Sistema'}
                  {activity.categoria ? ` - ${activity.categoria}` : ''}
                  {activity.evento ? ` - ${activity.evento}` : ''}
                </small>
              </li>
            ))}
            {pagedActivities.length === 0 ? <li>Nenhum evento encontrado para os filtros aplicados.</li> : null}
          </ul>

          <div className="pagination-bar">
            <button
              type="button"
              className="button ghost tiny"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Anterior
            </button>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              className="button ghost tiny"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              Proxima
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
};
