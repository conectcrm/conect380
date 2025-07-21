"use strict";
exports.__esModule = true;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var react_query_1 = require("react-query");
var react_hot_toast_1 = require("react-hot-toast");
var AuthContext_1 = require("./contexts/AuthContext");
var ThemeContext_1 = require("./contexts/ThemeContext");
var I18nContext_1 = require("./contexts/I18nContext");
var LoginPage_1 = require("./features/auth/LoginPage");
var DashboardLayout_1 = require("./components/layout/DashboardLayout");
var DashboardPage_1 = require("./features/dashboard/DashboardPage");
var ClientesPage_1 = require("./features/clientes/ClientesPage");
var PropostasPage_1 = require("./features/propostas/PropostasPage");
var useAuth_1 = require("./hooks/useAuth");
// Configuração do React Query
var queryClient = new react_query_1.QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false
        }
    }
});
// Componente de rota protegida
var ProtectedRoute = function (_a) {
    var children = _a.children;
    var _b = (0, useAuth_1.useAuth)(), isAuthenticated = _b.isAuthenticated, isLoading = _b.isLoading;
    if (isLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>);
    }
    return isAuthenticated ? <>{children}</> : <react_router_dom_1.Navigate to="/login" replace/>;
};
// Componente principal de rotas
var AppRoutes = function () {
    var isAuthenticated = (0, useAuth_1.useAuth)().isAuthenticated;
    if (isAuthenticated) {
        return (<DashboardLayout_1["default"]>
        <react_router_dom_1.Routes>
          <react_router_dom_1.Route path="/" element={<react_router_dom_1.Navigate to="/dashboard" replace/>}/>
          <react_router_dom_1.Route path="/dashboard" element={<DashboardPage_1["default"] />}/>
          <react_router_dom_1.Route path="/clientes" element={<ClientesPage_1["default"] />}/>
          <react_router_dom_1.Route path="/propostas" element={<PropostasPage_1["default"] />}/>
          <react_router_dom_1.Route path="*" element={<react_router_dom_1.Navigate to="/dashboard" replace/>}/>
        </react_router_dom_1.Routes>
      </DashboardLayout_1["default"]>);
    }
    return (<react_router_dom_1.Routes>
      <react_router_dom_1.Route path="/login" element={<LoginPage_1["default"] />}/>
      <react_router_dom_1.Route path="*" element={<react_router_dom_1.Navigate to="/login" replace/>}/>
    </react_router_dom_1.Routes>);
};
var App = function () {
    return (<react_query_1.QueryClientProvider client={queryClient}>
      <I18nContext_1.I18nProvider>
        <ThemeContext_1.ThemeProvider>
          <AuthContext_1.AuthProvider>
            <react_router_dom_1.BrowserRouter>
              <div className="App">
                <AppRoutes />
                <react_hot_toast_1.Toaster position="top-right" toastOptions={{
            duration: 4000,
            style: {
                background: '#363636',
                color: '#fff'
            }
        }}/>
              </div>
            </react_router_dom_1.BrowserRouter>
          </AuthContext_1.AuthProvider>
        </ThemeContext_1.ThemeProvider>
      </I18nContext_1.I18nProvider>
    </react_query_1.QueryClientProvider>);
};
exports["default"] = App;
