import {
  ArrowRight,
  Building2,
  ClipboardList,
  Palette,
  Settings2,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../lib/api';

type DashboardCard = {
  label: string;
  value: string;
  hint?: string;
};

type CapabilityCard = {
  key: string;
  label: string;
  enabled: boolean;
  enabledHint: string;
  disabledHint: string;
};

const quickActions = [
  {
    to: '/governance/users',
    label: 'Usuarios e Permissoes',
    description: 'Inspecionar usuarios e decidir pendencias formais de acesso.',
    icon: Users,
  },
  {
    to: '/governance/companies',
    label: 'Empresas',
    description: 'Atuar por tenant, revisar usuarios e aplicar excecoes administrativas.',
    icon: Building2,
  },
  {
    to: '/governance/billing',
    label: 'Cobranca',
    description: 'Governar planos e assinaturas sem operacao manual de rotina.',
    icon: WalletCards,
  },
  {
    to: '/governance/audit',
    label: 'Auditoria',
    description: 'Inspecionar trilha critica, exportar evidencias e rastrear incidentes.',
    icon: ClipboardList,
  },
  {
    to: '/governance/system',
    label: 'Sistema',
    description: 'Aprovar, auditar e revogar break-glass do ecossistema.',
    icon: Settings2,
  },
  {
    to: '/governance/branding',
    label: 'Branding',
    description: 'Gerenciar logos globais, favicon e banner de manutencao.',
    icon: Palette,
  },
];

export const GovernanceDashboardPage = () => {
  const [cards, setCards] = useState<DashboardCard[]>([
    { label: 'Usuarios ativos', value: '-' },
    { label: 'Pendencias de aprovacao', value: '-' },
    { label: 'Alertas de seguranca', value: '-' },
    { label: 'Break-glass pendente', value: '-' },
    { label: 'Break-glass ativos', value: '-' },
  ]);
  const [capabilities, setCapabilities] = useState<CapabilityCard[]>([
    {
      key: 'break-glass-request',
      label: 'Solicitar break-glass',
      enabled: false,
      enabledHint: 'Excecao habilitada para solicitacao direta pelo Guardian.',
      disabledHint: 'Solicitacao fica fora do Guardian e segue fluxo operacional formal.',
    },
    {
      key: 'manual-billing-cycle',
      label: 'Ciclo manual de cobranca',
      enabled: false,
      enabledHint: 'Operacao manual liberada para intervencao controlada.',
      disabledHint: 'Billing critico segue automacao e reconciliacao, sem job manual na UI.',
    },
    {
      key: 'plan-deletion',
      label: 'Exclusao fisica de plano',
      enabled: false,
      enabledHint: 'Catalogo permite remocao fisica por excecao.',
      disabledHint: 'Planos devem ser arquivados ou versionados, nunca apagados por rotina.',
    },
    {
      key: 'direct-recertification',
      label: 'Recertificacao direta',
      enabled: false,
      enabledHint: 'Aprovacao direta fora da fila formal foi liberada.',
      disabledHint: 'Recertificacao segue fila formal e dupla aprovacao.',
    },
    {
      key: 'company-module-management',
      label: 'Modulos por empresa',
      enabled: false,
      enabledHint: 'Catalogo de modulos foi publicado para governanca por tenant.',
      disabledHint: 'Capacidade bloqueada ate maturidade do catalogo Guardian.',
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const [overviewResponse, capabilitiesResponse] = await Promise.all([
          api.get('/core-admin/bff/overview'),
          api.get('/core-admin/bff/capabilities'),
        ]);
        const overview = overviewResponse.data?.data ?? {};
        const capabilityState = capabilitiesResponse.data?.data ?? {};
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
            label: 'Alertas de seguranca',
            value: String(overview?.admin_security_alerts ?? 0),
            hint: 'Canal in-app de seguranca guardian',
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
        setCapabilities((current) =>
          current.map((item) => ({
            ...item,
            enabled:
              (item.key === 'break-glass-request' &&
                capabilityState?.allowBreakGlassRequestCreation === true) ||
              (item.key === 'manual-billing-cycle' &&
                capabilityState?.allowManualBillingDueDateCycle === true) ||
              (item.key === 'plan-deletion' &&
                capabilityState?.allowPlanDeletion === true) ||
              (item.key === 'direct-recertification' &&
                capabilityState?.allowDirectAccessRecertification === true) ||
              (item.key === 'company-module-management' &&
                capabilityState?.allowCompanyModuleManagement === true),
          })),
        );
      } catch {
        setCards([
          { label: 'Usuarios ativos', value: 'n/d' },
          { label: 'Pendencias de aprovacao', value: 'n/d' },
          { label: 'Alertas de seguranca', value: 'n/d' },
          { label: 'Break-glass pendente', value: 'n/d' },
          { label: 'Break-glass ativos', value: 'n/d' },
        ]);
        setCapabilities((current) =>
          current.map((item) => ({
            ...item,
            enabled: false,
          })),
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="dashboard-shell">
      <section className="card dashboard-span-full guardian-hero-card">
        <div className="guardian-hero-copy">
          <span className="page-kicker">Guardian Command</span>
          <h2>Governanca critica separada do produto operacional</h2>
          <p className="subtle">
            Painel isolado para operacoes sensiveis do ecossistema Conect360, com foco em
            autorizacao forte, trilha de auditoria e administracao cross-tenant.
          </p>
          <div className="hero-chip-row">
            <span>Billing critico</span>
            <span>Cross-tenant</span>
            <span>Auditoria imutavel</span>
          </div>
        </div>
        <div className="guardian-hero-side">
          <div className="hero-signal-card">
            <ShieldCheck size={20} />
            <strong>Superficie protegida</strong>
            <small>MFA, trilha critica e fluxo dedicado para operacoes de alto risco.</small>
          </div>
        </div>
      </section>

      <section className="card dashboard-span-wide">
        <header className="card-headline">
          <h2>Resumo operacional</h2>
          <span className="subtle-inline">Gateway `/core-admin/bff/overview`</span>
        </header>
        <div className="kpi-grid guardian-kpi-grid">
          {cards.map((card) => (
            <article key={card.label} className="kpi-card">
              <span>{card.label}</span>
              <strong>{loading ? '...' : card.value}</strong>
              {card.hint ? <small>{card.hint}</small> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="card dashboard-span-narrow">
        <header className="card-headline">
          <h2>Politica ativa</h2>
          <span className="subtle-inline">Gateway `/core-admin/bff/capabilities`</span>
        </header>
        <div className="policy-grid">
          {capabilities.map((item) => (
            <article key={item.key} className="policy-card">
              <div className="policy-card-top">
                <strong>{item.label}</strong>
                <span className={`policy-state-pill ${item.enabled ? 'enabled' : 'disabled'}`}>
                  {item.enabled ? 'Excecao ativa' : 'Bloqueado'}
                </span>
              </div>
              <p>{item.enabled ? item.enabledHint : item.disabledHint}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card dashboard-span-full">
        <header className="card-headline">
          <h2>Rotas principais</h2>
          <span className="subtle-inline">Fluxos mais acessados do Guardian</span>
        </header>
        <div className="quick-links-grid">
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className="quick-link-card">
                <span className="quick-link-icon">
                  <Icon size={18} />
                </span>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
                <span className="quick-link-cta">
                  Abrir
                  <ArrowRight size={14} />
                </span>
              </NavLink>
            );
          })}
        </div>
      </section>

      <section className="card dashboard-span-full">
        <h2>Prontidao operacional</h2>
        <ul className="guardian-checklist">
          <li>Guardian separado do sistema principal e protegido por autenticacao exclusiva.</li>
          <li>Superadmin com trilha de auditoria critica nas operacoes sensiveis.</li>
          <li>Break-glass aprovado e revogado no Guardian, com solicitacao originada fora dele.</li>
          <li>Billing sensivel sem execucao manual de jobs financeiros ou exclusao fisica de plano.</li>
        </ul>
      </section>
    </div>
  );
};

