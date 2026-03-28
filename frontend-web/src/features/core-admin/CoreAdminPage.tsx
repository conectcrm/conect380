import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

type OverviewData = {
  generated_at?: string;
  pending_access_requests?: number;
  admin_security_alerts?: number;
  pending_break_glass_requests?: number;
  active_break_glass_accesses?: number;
  users?: {
    total?: number;
    ativos?: number;
    inativos?: number;
  };
};

type CompanyItem = {
  id?: string;
  nome?: string;
  status?: string;
  plano?: string;
  ativo?: boolean;
};

type PlanoItem = {
  id: string;
  nome: string;
  codigo: string;
  preco: number;
  ativo: boolean;
};

const SUPER_ADMIN_ALIASES = new Set([
  'superadmin',
]);

const CoreAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<OverviewData>({});
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [plans, setPlans] = useState<PlanoItem[]>([]);

  const isSuperAdmin = useMemo(() => {
    const role = String(user?.role || '')
      .trim()
      .toLowerCase();
    return SUPER_ADMIN_ALIASES.has(role);
  }, [user?.role]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [overviewResponse, companiesResponse, plansResponse] = await Promise.all([
          api.get('/core-admin/bff/overview'),
          api.get('/core-admin/bff/companies', { params: { page: 1, limit: 8 } }),
          api.get('/core-admin/planos'),
        ]);

        setOverview((overviewResponse.data?.data || {}) as OverviewData);
        setCompanies((companiesResponse.data?.data || []) as CompanyItem[]);
        setPlans((plansResponse.data || []) as PlanoItem[]);
      } catch (loadError: any) {
        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            'Falha ao carregar painel Core Admin',
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-100 bg-white p-6">
          <h1 className="text-xl font-semibold text-[#002333]">Acesso restrito</h1>
          <p className="mt-2 text-sm text-[#587285]">
            O painel Core Admin e exclusivo para SUPER_ADMIN.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-[#D9E6EC] bg-white p-6 text-sm text-[#587285]">
          Carregando painel Core Admin...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <header className="rounded-xl border border-[#D9E6EC] bg-white p-6">
        <h1 className="text-2xl font-semibold text-[#002333]">Core Admin</h1>
        <p className="mt-2 text-sm text-[#587285]">
          Governanca centralizada da plataforma SaaS (multi-tenant).
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="Usuarios totais"
          value={String(overview.users?.total ?? 0)}
        />
        <MetricCard
          label="Solicitacoes de acesso"
          value={String(overview.pending_access_requests ?? 0)}
        />
        <MetricCard
          label="Alertas de seguranca"
          value={String(overview.admin_security_alerts ?? 0)}
        />
        <MetricCard
          label="Break-glass ativos"
          value={String(overview.active_break_glass_accesses ?? 0)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#D9E6EC] bg-white p-4">
          <h2 className="text-base font-semibold text-[#002333]">Empresas (amostra)</h2>
          <div className="mt-3 space-y-2">
            {companies.length === 0 ? (
              <p className="text-sm text-[#587285]">Nenhuma empresa retornada.</p>
            ) : (
              companies.map((company) => (
                <div
                  key={company.id || company.nome}
                  className="flex items-center justify-between rounded-lg border border-[#E3EDF2] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#002333]">{company.nome || 'Empresa'}</p>
                    <p className="text-xs text-[#587285]">
                      Plano: {company.plano || 'n/d'} • Status: {company.status || 'n/d'}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-[#159A9C]">
                    {company.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#D9E6EC] bg-white p-4">
          <h2 className="text-base font-semibold text-[#002333]">Catalogo de planos</h2>
          <div className="mt-3 space-y-2">
            {plans.length === 0 ? (
              <p className="text-sm text-[#587285]">Nenhum plano encontrado.</p>
            ) : (
              plans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border border-[#E3EDF2] px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-[#002333]">{plan.nome}</p>
                    <p className="text-xs text-[#587285]">{plan.codigo}</p>
                  </div>
                  <span className="text-xs font-medium text-[#0F7B7D]">
                    R$ {Number(plan.preco || 0).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-[#D9E6EC] bg-white p-4">
    <p className="text-xs uppercase tracking-wide text-[#587285]">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-[#002333]">{value}</p>
  </div>
);

export default CoreAdminPage;
