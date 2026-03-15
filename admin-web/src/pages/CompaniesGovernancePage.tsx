import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type CompanyItem = {
  id: string;
  nome: string;
  plano?: string;
  status?: string;
  ativo?: boolean;
};

export const CompaniesGovernancePage = () => {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/admin/bff/companies', { params: { page: 1, limit: 20 } });
        const items = response.data?.data ?? [];

        setCompanies(
          Array.isArray(items)
            ? items.map((item: Record<string, unknown>) => ({
                id: String(item.id ?? ''),
                nome: String(item.nome ?? ''),
                plano: typeof item.plano === 'string' ? item.plano : undefined,
                status: typeof item.status === 'string' ? item.status : undefined,
                ativo: typeof item.ativo === 'boolean' ? item.ativo : undefined,
              }))
            : [],
        );
      } catch {
        setError('Falha ao carregar empresas administrativas.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <section className="card">
      <h2>Empresas administradas</h2>
      <p className="subtle">
        Governanca de tenant consumindo endpoint consolidado do admin BFF.
      </p>

      {loading ? <p>Carregando empresas...</p> : null}
      {!loading && error ? <p className="error-text">{error}</p> : null}

      {!loading && !error ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Ativa</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.nome}</td>
                  <td>{company.plano || '-'}</td>
                  <td>{company.status || '-'}</td>
                  <td>{company.ativo ? 'Sim' : 'Nao'}</td>
                </tr>
              ))}
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={4}>Nenhuma empresa encontrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};
