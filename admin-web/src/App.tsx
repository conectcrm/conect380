import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAdminAuth } from './auth/RequireAdminAuth';
import { AdminLayout } from './layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { GovernanceDashboardPage } from './pages/GovernanceDashboardPage';
import { UsersGovernancePage } from './pages/UsersGovernancePage';
import { CompaniesGovernancePage } from './pages/CompaniesGovernancePage';
import { AuditGovernancePage } from './pages/AuditGovernancePage';
import { SystemGovernancePage } from './pages/SystemGovernancePage';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAdminAuth>
            <AdminLayout />
          </RequireAdminAuth>
        }
      >
        <Route index element={<GovernanceDashboardPage />} />
        <Route path="governance/users" element={<UsersGovernancePage />} />
        <Route path="governance/companies" element={<CompaniesGovernancePage />} />
        <Route path="governance/audit" element={<AuditGovernancePage />} />
        <Route path="governance/system" element={<SystemGovernancePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
