import {
  Menu,
  ShieldCheck,
  Shield,
  Users,
  Building2,
  Settings2,
  ClipboardList,
  LogOut,
  WalletCards,
  LockKeyhole,
  Fingerprint,
  Palette,
} from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const menuItems = [
  {
    to: '/',
    label: 'Painel',
    description: 'Visao executiva da superficie critica',
    icon: ShieldCheck,
  },
  {
    to: '/governance/users',
    label: 'Usuarios e Permissoes',
    description: 'Fila formal, excecoes e revisao de acesso',
    icon: Users,
  },
  {
    to: '/governance/companies',
    label: 'Empresas',
    description: 'Operacao cross-tenant e governanca de clientes',
    icon: Building2,
  },
  {
    to: '/governance/billing',
    label: 'Cobranca',
    description: 'Planos, assinaturas e confiabilidade financeira',
    icon: WalletCards,
  },
  {
    to: '/governance/audit',
    label: 'Auditoria',
    description: 'Rastro critico e trilha imutavel de eventos',
    icon: ClipboardList,
  },
  {
    to: '/governance/system',
    label: 'Sistema',
    description: 'Break-glass, aprovacao e revogacao sensiveis',
    icon: Settings2,
  },
  {
    to: '/governance/branding',
    label: 'Branding',
    description: 'Identidade visual global e banner de manutencao',
    icon: Palette,
  },
];

export const GuardianLayout = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const currentItem =
    menuItems.find((item) =>
      item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
    ) ?? menuItems[0];

  return (
    <div className="admin-shell">
      <button
        type="button"
        className={`sidebar-scrim ${open ? 'visible' : ''}`}
        aria-label="Fechar menu lateral"
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <header className="sidebar-brand guardian-brand-card">
          <div className="guardian-brand-mark">
            <Shield size={18} />
          </div>
          <div className="guardian-brand-copy">
            <span className="brand-kicker">Conect360</span>
            <strong>Guardian</strong>
            <small>Superficie isolada para operacoes criticas</small>
          </div>
          <span className="sidebar-status-pill">Isolado</span>
        </header>

        <nav className="sidebar-nav" aria-label="Navegacao principal do Guardian">
          <span className="sidebar-section-label">Governanca</span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <span className="sidebar-link-icon">
                  <Icon size={16} />
                </span>
                <span className="sidebar-link-copy">
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </NavLink>
            );
          })}
        </nav>

        <footer className="sidebar-footer">
          <div className="guardian-operator-card">
            <div className="user-mini">
              <strong>{user?.nome || 'Guardian Operator'}</strong>
              <span>{user?.email || '-'}</span>
            </div>
            <div className="operator-flags">
              <span>
                <LockKeyhole size={12} />
                Superadmin
              </span>
              <span>
                <Fingerprint size={12} />
                MFA
              </span>
            </div>
          </div>
          <button type="button" className="button ghost full-width" onClick={logout}>
            <LogOut size={14} />
            Encerrar sessao
          </button>
        </footer>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button
            type="button"
            className="button ghost only-mobile"
            onClick={() => setOpen((current) => !current)}
          >
            <Menu size={18} />
          </button>
          <div className="topbar-title">
            <span className="page-kicker">Guardian Surface</span>
            <h1>{currentItem.label}</h1>
            <p>{currentItem.description}</p>
          </div>
          <div className="topbar-actions">
            <span className="topbar-chip">Controle sensivel</span>
            <span className="topbar-chip">Auditoria ativa</span>
            <span className="topbar-chip topbar-chip-strong">MFA obrigatorio</span>
          </div>
        </header>
        <section className="content-wrap">
          <Outlet />
        </section>
      </main>
    </div>
  );
};
