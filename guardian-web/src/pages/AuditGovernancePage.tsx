import { AxiosError } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

type CriticalAuditItem = {
  id: number;
  createdAt: string;
  actorUserId: string;
  actorRole?: string | null;
  actorEmail?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  httpMethod: string;
  route: string;
  statusCode: number;
  outcome: string;
  requestId?: string | null;
  errorMessage?: string | null;
};

type DateRange = {
  startDate: string;
  endDate: string;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const PAGE_SIZE = 20;

const formatDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
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

const buildExportFilename = (extension: 'csv' | 'json') => {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  return `guardian-critical-audit-${stamp}.${extension}`;
};

const triggerDownload = (content: BlobPart, mimeType: string, filename: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const AuditGovernancePage = () => {
  const [activities, setActivities] = useState<CriticalAuditItem[]>([]);
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: PAGE_SIZE,
      };

      if (outcomeFilter !== 'ALL') {
        params.outcome = outcomeFilter;
      }
      if (methodFilter !== 'ALL') {
        params.method = methodFilter;
      }
      if (targetTypeFilter.trim()) {
        params.target_type = targetTypeFilter.trim();
      }
      if (routeFilter.trim()) {
        params.route = routeFilter.trim();
      }
      if (appliedDateRange.startDate) {
        params.data_inicio = toApiStartDate(appliedDateRange.startDate);
      }
      if (appliedDateRange.endDate) {
        params.data_fim = toApiEndDate(appliedDateRange.endDate);
      }

      const response = await api.get('/guardian/bff/audit/critical', { params });
      const list = Array.isArray(response.data?.data) ? response.data.data : [];
      const responseMeta = response.data?.meta ?? {};

      setActivities(
        list.map((entry: Record<string, unknown>) => ({
          id: Number(entry.id ?? 0),
          createdAt: String(entry.createdAt ?? ''),
          actorUserId: String(entry.actorUserId ?? ''),
          actorRole: typeof entry.actorRole === 'string' ? entry.actorRole : null,
          actorEmail: typeof entry.actorEmail === 'string' ? entry.actorEmail : null,
          targetType: typeof entry.targetType === 'string' ? entry.targetType : null,
          targetId: typeof entry.targetId === 'string' ? entry.targetId : null,
          httpMethod: String(entry.httpMethod ?? '-'),
          route: String(entry.route ?? '-'),
          statusCode: Number(entry.statusCode ?? 0),
          outcome: String(entry.outcome ?? '-'),
          requestId: typeof entry.requestId === 'string' ? entry.requestId : null,
          errorMessage: typeof entry.errorMessage === 'string' ? entry.errorMessage : null,
        })),
      );

      setMeta({
        total: Number(responseMeta.total ?? list.length),
        page: Number(responseMeta.page ?? currentPage),
        limit: Number(responseMeta.limit ?? PAGE_SIZE),
        totalPages: Math.max(1, Number(responseMeta.totalPages ?? 1)),
      });
    } catch (loadError) {
      setError(parseErrorMessage(loadError, 'Falha ao carregar trilha critica de auditoria guardian.'));
    } finally {
      setLoading(false);
    }
  }, [appliedDateRange.endDate, appliedDateRange.startDate, currentPage, methodFilter, outcomeFilter, routeFilter, targetTypeFilter]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleApplyDateFilter = () => {
    if (dateRange.startDate && dateRange.endDate && dateRange.endDate < dateRange.startDate) {
      setError('Periodo invalido: data final nao pode ser menor que a data inicial.');
      return;
    }

    setError(null);
    setCurrentPage(1);
    setAppliedDateRange({ ...dateRange });
  };

  const handleClearDateFilter = () => {
    setError(null);
    setDateRange({ startDate: '', endDate: '' });
    setAppliedDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };

  const runExport = useCallback(
    async (format: 'csv' | 'json') => {
      setExporting(true);
      setError(null);

      try {
        const params: Record<string, string | number> = {
          format,
          limit: 2000,
        };

        if (outcomeFilter !== 'ALL') {
          params.outcome = outcomeFilter;
        }
        if (methodFilter !== 'ALL') {
          params.method = methodFilter;
        }
        if (targetTypeFilter.trim()) {
          params.target_type = targetTypeFilter.trim();
        }
        if (routeFilter.trim()) {
          params.route = routeFilter.trim();
        }
        if (appliedDateRange.startDate) {
          params.data_inicio = toApiStartDate(appliedDateRange.startDate);
        }
        if (appliedDateRange.endDate) {
          params.data_fim = toApiEndDate(appliedDateRange.endDate);
        }

        const response = await api.get('/guardian/bff/audit/critical/export', { params });
        if (format === 'csv') {
          const csvContent = String(response.data?.data ?? '');
          triggerDownload(csvContent, 'text/csv;charset=utf-8', buildExportFilename('csv'));
          return;
        }

        const payload = response.data?.data ?? [];
        triggerDownload(JSON.stringify(payload, null, 2), 'application/json;charset=utf-8', buildExportFilename('json'));
      } catch (exportError) {
        setError(parseErrorMessage(exportError, 'Falha ao exportar trilha critica.'));
      } finally {
        setExporting(false);
      }
    },
    [appliedDateRange.endDate, appliedDateRange.startDate, methodFilter, outcomeFilter, routeFilter, targetTypeFilter],
  );

  return (
    <section className="card">
      <header className="card-headline">
        <h2>Auditoria critica guardian</h2>
        <button type="button" className="button secondary" onClick={() => void loadData()} disabled={loading}>
          Recarregar
        </button>
      </header>
      <p className="subtle">
        Trilha imutavel de eventos criticos com filtros server-side e exportacao CSV/JSON.
      </p>

      <div className="filters-bar">
        <label>
          Outcome
          <select
            value={outcomeFilter}
            onChange={(event) => {
              setOutcomeFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">Todos</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </label>

        <label>
          Metodo
          <select
            value={methodFilter}
            onChange={(event) => {
              setMethodFilter(event.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="ALL">Todos</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </label>

        <label>
          Tipo alvo
          <input
            type="text"
            value={targetTypeFilter}
            onChange={(event) => {
              setTargetTypeFilter(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="empresa, billing_subscription..."
          />
        </label>

        <label>
          Rota
          <input
            type="text"
            value={routeFilter}
            onChange={(event) => {
              setRouteFilter(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="/guardian/empresas"
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
        <button
          type="button"
          className="button secondary tiny"
          onClick={() => void runExport('csv')}
          disabled={loading || exporting}
        >
          Exportar CSV
        </button>
        <button
          type="button"
          className="button ghost tiny"
          onClick={() => void runExport('json')}
          disabled={loading || exporting}
        >
          Exportar JSON
        </button>
      </div>

      {loading ? <p>Carregando trilha critica...</p> : null}
      {!loading && error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <>
          <p className="subtle pagination-info">
            Exibindo {activities.length === 0 ? 0 : (meta.page - 1) * meta.limit + 1}-
            {Math.min(meta.page * meta.limit, meta.total)} de {meta.total} eventos criticos
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Outcome</th>
                  <th>Metodo</th>
                  <th>Rota</th>
                  <th>Alvo</th>
                  <th>Ator</th>
                  <th>Status HTTP</th>
                  <th>Request ID</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{formatDate(activity.createdAt)}</td>
                    <td>{activity.outcome}</td>
                    <td>{activity.httpMethod}</td>
                    <td>{activity.route}</td>
                    <td>
                      {activity.targetType || '-'}
                      {activity.targetId ? ` (${activity.targetId})` : ''}
                    </td>
                    <td>
                      {activity.actorEmail || activity.actorUserId}
                      {activity.actorRole ? ` (${activity.actorRole})` : ''}
                    </td>
                    <td>{activity.statusCode}</td>
                    <td>{activity.requestId || '-'}</td>
                  </tr>
                ))}
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={8}>Nenhum evento critico encontrado para os filtros aplicados.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <button
              type="button"
              className="button ghost tiny"
              disabled={meta.page <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              Anterior
            </button>
            <span>
              Pagina {meta.page} de {meta.totalPages}
            </span>
            <button
              type="button"
              className="button ghost tiny"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setCurrentPage((page) => Math.min(meta.totalPages, page + 1))}
            >
              Proxima
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
};
