import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type DashboardCard = {
  label: string;
  value: string;
  hint?: string;
};

export const GovernanceDashboardPage = () => {
  const [cards, setCards] = useState<DashboardCard[]>([
    { label: 'Usuarios ativos', value: '-' },
    { label: 'Pendencias de aprovacao', value: '-' },
    { label: 'Alertas admin recentes', value: '-' },
    { label: 'Break-glass pendente', value: '-' },
    { label: 'Break-glass ativos', value: '-' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const response = await api.get('/admin/bff/overview');
        const overview = response.data?.data ?? {};
        const users = (overview?.users as Record<string, unknown> | undefined) ?? {};

        setCards([
          {
            label: 'Usuarios ativos',
            value: String(users?.ativos ?? 0),
            hint: `Total: ${users?.total ?? 0}`,
          },
          {
            label: 'Pendencias de aprovacao',
            value: String(overview?.pending_access_requests ?? 0),
            hint: 'Alteracoes sensiveis aguardando segunda aprovacao',
          },
          {
            label: 'Alertas admin recentes',
            value: String(overview?.admin_security_alerts ?? 0),
            hint: 'Canal in-app de seguranca administrativa',
          },
          {
            label: 'Break-glass pendente',
            value: String(overview?.pending_break_glass_requests ?? 0),
            hint: 'Solicitacoes emergenciais aguardando aprovacao',
          },
          {
            label: 'Break-glass ativos',
            value: String(overview?.active_break_glass_accesses ?? 0),
            hint: 'Acessos emergenciais com expiracao em andamento',
          },
        ]);
      } catch {
        setCards([
          { label: 'Usuarios ativos', value: 'n/d' },
          { label: 'Pendencias de aprovacao', value: 'n/d' },
          { label: 'Alertas admin recentes', value: 'n/d' },
          { label: 'Break-glass pendente', value: 'n/d' },
          { label: 'Break-glass ativos', value: 'n/d' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="page-grid">
      <section className="card">
        <h2>Resumo operacional</h2>
        <p className="subtle">
          Indicadores centralizados pelo gateway administrativo (`/admin/bff/overview`).
        </p>
        <div className="kpi-grid">
          {cards.map((card) => (
            <article key={card.label} className="kpi-card">
              <span>{card.label}</span>
              <strong>{loading ? '...' : card.value}</strong>
              {card.hint ? <small>{card.hint}</small> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Status do scaffold ADM-301</h2>
        <ul className="clean-list">
          <li>App administrativa separada em `admin-web`.</li>
          <li>Autenticacao e guard de acesso administrativo.</li>
          <li>Menu dedicado para governanca (usuarios, empresas, auditoria e sistema).</li>
          <li>Base de deploy isolado preparada para subdominio `admin.*`.</li>
        </ul>
      </section>
    </div>
  );
};
