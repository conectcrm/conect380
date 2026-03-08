import {
  Menu,
  ShieldCheck,
  Users,
  Building2,
  Settings2,
  ClipboardList,
  LogOut,
  WalletCards,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const menuItems = [
  { to: '/', label: 'Painel', icon: ShieldCheck },
  { to: '/governance/users', label: 'Usuarios e Permissoes', icon: Users },
  { to: '/governance/companies', label: 'Empresas', icon: Building2 },
  { to: '/governance/billing', label: 'Cobranca', icon: WalletCards },
  { to: '/governance/audit', label: 'Auditoria', icon: ClipboardList },
  { to: '/governance/system', label: 'Sistema', icon: Settings2 },
];

export const GuardianLayout = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="admin-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <header className="sidebar-brand">
          <span className="brand-kicker">Conect360</span>
          <strong>Guardian</strong>
        </header>

        <nav className="sidebar-nav">
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
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <footer className="sidebar-footer">
          <div className="user-mini">
            <strong>{user?.nome || 'Guardian Operator'}</strong>
            <span>{user?.email || '-'}</span>
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
            <h1>Painel Guardian</h1>
            <p>Superficie dedicada a governanca critica do ecossistema Conect360.</p>
          </div>
        </header>
        <section className="content-wrap">
          <Outlet />
        </section>
      </main>
    </div>
  );
};
