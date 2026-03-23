import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireGuardianAuth } from './auth/RequireGuardianAuth';
import { GuardianLayout } from './layout/GuardianLayout';
import { LoginPage } from './pages/LoginPage';
import { GovernanceDashboardPage } from './pages/GovernanceDashboardPage';
import { UsersGovernancePage } from './pages/UsersGovernancePage';
import { CompaniesGovernancePage } from './pages/CompaniesGovernancePage';
import { BillingGovernancePage } from './pages/BillingGovernancePage';
import { AuditGovernancePage } from './pages/AuditGovernancePage';
import { SystemGovernancePage } from './pages/SystemGovernancePage';
import { BrandingGovernancePage } from './pages/BrandingGovernancePage';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireGuardianAuth>
            <GuardianLayout />
          </RequireGuardianAuth>
        }
      >
        <Route index element={<GovernanceDashboardPage />} />
        <Route path="governance/users" element={<UsersGovernancePage />} />
        <Route path="governance/companies" element={<CompaniesGovernancePage />} />
        <Route path="governance/billing" element={<BillingGovernancePage />} />
        <Route path="governance/audit" element={<AuditGovernancePage />} />
        <Route path="governance/system" element={<SystemGovernancePage />} />
        <Route path="governance/branding" element={<BrandingGovernancePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
