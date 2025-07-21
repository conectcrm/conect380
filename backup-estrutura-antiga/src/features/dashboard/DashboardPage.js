"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var react_1 = require("react");
var I18nContext_1 = require("../../contexts/I18nContext");
var RecentActivitiesWidget_1 = require("../../components/widgets/RecentActivitiesWidget");
var GoalsWidget_1 = require("../../components/widgets/GoalsWidget");
var KPICard_1 = require("../../components/common/KPICard");
var ResponsiveFilters_1 = require("../../components/common/ResponsiveFilters");
var ResponsiveDashboardLayout_1 = require("../../components/layout/ResponsiveDashboardLayout");
var useKPIData_1 = require("../../hooks/useKPIData");
var lucide_react_1 = require("lucide-react");
// Hook para animação de contador
function useContadorAnimado(valorFinal, duracao) {
    if (duracao === void 0) { duracao = 1200; }
    var _a = (0, react_1.useState)(0), valor = _a[0], setValor = _a[1];
    (0, react_1.useEffect)(function () {
        if (valorFinal === 0) {
            setValor(0);
            return;
        }
        var incremento = valorFinal / (duracao / 16);
        var valorAtual = 0;
        var timer = setInterval(function () {
            valorAtual += incremento;
            if (valorAtual >= valorFinal) {
                setValor(valorFinal);
                clearInterval(timer);
            }
            else {
                setValor(Math.floor(valorAtual));
            }
        }, 16);
        return function () { return clearInterval(timer); };
    }, [valorFinal, duracao]);
    return valor;
}
var KpiCard = function (_a) {
    var title = _a.title, value = _a.value, icon = _a.icon, _b = _a.destaque, destaque = _b === void 0 ? false : _b, tooltip = _a.tooltip, _c = _a.animado, animado = _c === void 0 ? false : _c, _d = _a.trend, trend = _d === void 0 ? 'neutral' : _d, trendValue = _a.trendValue, _e = _a.formato, formato = _e === void 0 ? 'number' : _e;
    var valorAnimado = useContadorAnimado(typeof value === 'number' && animado ? value : 0);
    var formatarValor = function (val) {
        if (typeof val === 'string')
            return val;
        switch (formato) {
            case 'currency':
                return new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(val);
            case 'percentage':
                return "".concat(val, "%");
            default:
                return val.toLocaleString('pt-BR');
        }
    };
    var valorExibido = animado && typeof value === 'number' ? valorAnimado : value;
    return (<div className={"bg-white p-6 rounded-lg shadow-sm border-l-4 transition-all hover:shadow-md ".concat(destaque ? 'border-l-blue-500 bg-blue-50' : 'border-l-gray-300')} title={tooltip}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={"text-2xl font-bold ".concat(destaque ? 'text-blue-700' : 'text-gray-900')}>
            {formatarValor(valorExibido)}
          </p>
          {trendValue && (<div className={"flex items-center mt-1 text-sm ".concat(trend === 'up' ? 'text-green-600' :
                trend === 'down' ? 'text-red-600' : 'text-gray-500')}>
              {trend === 'up' && <lucide_react_1.ArrowUp className="w-4 h-4 mr-1"/>}
              {trend === 'down' && <lucide_react_1.ArrowDown className="w-4 h-4 mr-1"/>}
              {trendValue}
            </div>)}
        </div>
        <div className={"p-3 rounded-full ".concat(destaque ? 'bg-blue-100' : 'bg-gray-100')}>
          {icon}
        </div>
      </div>
    </div>);
};
// Componente de filtros
var Filtros = function (_a) {
    var filtros = _a.filtros, setFiltros = _a.setFiltros;
    var t = (0, I18nContext_1.useI18n)().t;
    return (<div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <lucide_react_1.Filter className="w-4 h-4 text-gray-500"/>
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        
        <select value={filtros.periodo} onChange={function (e) { return setFiltros(__assign(__assign({}, filtros), { periodo: e.target.value })); }} className="px-3 py-1 border rounded text-sm">
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="ultimo_mes">Último mês</option>
          <option value="ultimo_trimestre">Último trimestre</option>
        </select>
        
        <select value={filtros.vendedor} onChange={function (e) { return setFiltros(__assign(__assign({}, filtros), { vendedor: e.target.value })); }} className="px-3 py-1 border rounded text-sm">
          <option value="Todos">Todos os vendedores</option>
          <option value="João Silva">João Silva</option>
          <option value="Maria Santos">Maria Santos</option>
          <option value="Pedro Costa">Pedro Costa</option>
        </select>
        
        <select value={filtros.regiao} onChange={function (e) { return setFiltros(__assign(__assign({}, filtros), { regiao: e.target.value })); }} className="px-3 py-1 border rounded text-sm">
          <option value="Todas">Todas as regiões</option>
          <option value="Norte">Norte</option>
          <option value="Sul">Sul</option>
          <option value="Sudeste">Sudeste</option>
          <option value="Centro-Oeste">Centro-Oeste</option>
          <option value="Nordeste">Nordeste</option>
        </select>
        
        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1">
          <lucide_react_1.Download className="w-4 h-4"/>
          Exportar
        </button>
      </div>
    </div>);
};
// Componente de tabela de propostas recentes
var TabelaPropostasRecentes = function (_a) {
    var propostas = _a.propostas;
    var statusIcons = {
        'Aprovada': <lucide_react_1.CheckSquare className="w-4 h-4 text-green-600"/>,
        'Rejeitada': <lucide_react_1.X className="w-4 h-4 text-red-600"/>,
        'Pendente': <lucide_react_1.Clock className="w-4 h-4 text-yellow-500"/>,
        'Negociação': <lucide_react_1.Target className="w-4 h-4 text-blue-500"/>
    };
    return (<div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Propostas Recentes</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
              Ver todas
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Vendedor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {propostas.length === 0 ? (<tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma proposta encontrada
                </td>
              </tr>) : (propostas.map(function (proposta, index) { return (<tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{proposta.cliente}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(proposta.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {statusIcons[proposta.status]}
                      <span className={"text-sm px-2 py-1 rounded-full ".concat(proposta.status === 'Aprovada' ? 'bg-green-100 text-green-800' :
                proposta.status === 'Rejeitada' ? 'bg-red-100 text-red-800' :
                    proposta.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800')}>
                        {proposta.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(proposta.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-sm">{proposta.vendedor}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded" title="Visualizar">
                        <lucide_react_1.Eye className="w-4 h-4"/>
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Editar">
                        <lucide_react_1.Edit className="w-4 h-4"/>
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded" title="Mais opções">
                        <lucide_react_1.MoreHorizontal className="w-4 h-4"/>
                      </button>
                    </div>
                  </td>
                </tr>); }))}
          </tbody>
        </table>
      </div>
    </div>);
};
// Componente de ranking de vendedores
var RankingVendedores = function () {
    var vendedores = [
        { nome: 'João Silva', vendas: 15, valor: 125000, meta: 100000 },
        { nome: 'Maria Santos', vendas: 12, valor: 98000, meta: 80000 },
        { nome: 'Pedro Costa', vendas: 8, valor: 67000, meta: 70000 },
        { nome: 'Ana Oliveira', vendas: 6, valor: 45000, meta: 50000 },
    ];
    return (<div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Ranking de Vendedores</h3>
        <button className="text-sm text-blue-600 hover:underline">Ver todos</button>
      </div>
      
      <div className="space-y-4">
        {vendedores.map(function (vendedor, index) {
            var percentualMeta = (vendedor.valor / vendedor.meta) * 100;
            return (<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ".concat(index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-400' : 'bg-blue-500')}>
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium">{vendedor.nome}</p>
                  <p className="text-sm text-gray-500">{vendedor.vendas} vendas</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-medium">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(vendedor.valor)}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div className={"h-2 rounded-full ".concat(percentualMeta >= 100 ? 'bg-green-500' : 'bg-blue-500')} style={{ width: "".concat(Math.min(percentualMeta, 100), "%") }}></div>
                  </div>
                  <span className={"text-xs ".concat(percentualMeta >= 100 ? 'text-green-600' : 'text-gray-500')}>
                    {percentualMeta.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>);
        })}
      </div>
    </div>);
};
var DashboardPage = function () {
    var t = (0, I18nContext_1.useI18n)().t;
    var _a = (0, useKPIData_1.useKPIData)(), kpiData = _a.data, kpiLoading = _a.isLoading, kpiError = _a.error;
    var _b = (0, react_1.useState)({
        periodo: "2025",
        vendedor: "Todos",
        regiao: "Todas"
    }), filtros = _b[0], setFiltros = _b[1];
    var _c = (0, react_1.useState)({
        totalClientes: 248,
        propostasAtivas: 32,
        receitaMensal: 125000,
        taxaConversao: 68,
        ultimasPropostas: [
            {
                cliente: "Empresa ABC Ltda",
                valor: 25000,
                status: "Aprovada",
                data: "2025-01-15",
                vendedor: "João Silva"
            },
            {
                cliente: "Tech Solutions Inovação",
                valor: 18500,
                status: "Negociação",
                data: "2025-01-14",
                vendedor: "Maria Santos"
            },
            {
                cliente: "Digital Marketing Pro",
                valor: 12000,
                status: "Pendente",
                data: "2025-01-13",
                vendedor: "Pedro Costa"
            },
            {
                cliente: "StartUp Growth",
                valor: 8500,
                status: "Aprovada",
                data: "2025-01-12",
                vendedor: "Ana Oliveira"
            },
            {
                cliente: "Consultoria Empresarial",
                valor: 15000,
                status: "Rejeitada",
                data: "2025-01-11",
                vendedor: "João Silva"
            }
        ]
    }), dados = _c[0], setDados = _c[1];
    var _d = (0, react_1.useState)(false), loading = _d[0], setLoading = _d[1];
    // Simulação de carregamento de dados
    (0, react_1.useEffect)(function () {
        setLoading(true);
        var timer = setTimeout(function () {
            setLoading(false);
        }, 500);
        return function () { return clearTimeout(timer); };
    }, [filtros]);
    if (loading) {
        return (<div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(function (i) { return (<div key={i} className="bg-gray-200 h-32 rounded-lg"></div>); })}
          </div>
        </div>
      </div>);
    }
    // Dashboard padrão sempre ativo
    return (<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout title="Dashboard" subtitle="Bem-vindo! Aqui está o resumo do seu negócio hoje" actions={<>
          <div className="hidden sm:flex items-center text-sm text-gray-500 mr-4">
            <lucide_react_1.Clock className="w-4 h-4 mr-1"/>
            Última atualização: {new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            })}
          </div>
          
          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors">
            <lucide_react_1.Calendar className="w-4 h-4"/>
            <span className="hidden sm:inline">Agendar</span>
          </button>
          
          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm transition-colors shadow-sm">
            <lucide_react_1.Plus className="w-4 h-4"/>
            <span className="hidden sm:inline">Nova Proposta</span>
          </button>
        </>}>
      {/* Header Melhorado */}
      <div className="mb-6">
        {/* Status Indicators com melhor responsividade */}
        <div className="bg-white rounded-lg p-4 shadow-sm border mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors" title="Sistema operacional e estável">
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Sistema Online</span>
              <div className="hidden sm:block w-1 h-1 bg-gray-300 rounded-full"></div>
              <span className="hidden sm:inline text-xs text-gray-500">Todos os serviços funcionando</span>
            </div>
            
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-orange-50 p-2 rounded transition-colors" title="Itens que precisam de atenção">
              <div className="relative">
                <lucide_react_1.Bell className="w-4 h-4 text-orange-500"/>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">5 pendências</span>
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Urgente</span>
            </div>
            
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-blue-50 p-2 rounded transition-colors" title="Atividades programadas para hoje">
              <lucide_react_1.Activity className="w-4 h-4 text-blue-500"/>
              <span className="text-sm font-medium text-gray-700">8 tarefas hoje</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">6 concluídas</span>
            </div>
            
            {/* Indicador adicional de performance */}
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-green-50 p-2 rounded transition-colors ml-auto" title="Meta mensal atual">
              <lucide_react_1.Target className="w-4 h-4 text-green-500"/>
              <span className="text-sm font-medium text-gray-700">Meta: 78%</span>
              <div className="w-16 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação por Abas com badges */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex flex-wrap gap-2 sm:gap-8 overflow-x-auto">
            <button className="py-2 px-3 border-b-2 border-blue-500 text-blue-600 text-sm font-medium bg-blue-50 rounded-t-lg whitespace-nowrap">
              <div className="flex items-center gap-2">
                <lucide_react_1.TrendingUp className="w-4 h-4"/>
                Visão Geral
              </div>
            </button>
            <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm font-medium transition-colors hover:bg-gray-50 rounded-t-lg whitespace-nowrap">
              <div className="flex items-center gap-2">
                <lucide_react_1.DollarSign className="w-4 h-4"/>
                Vendas
                <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded">+12%</span>
              </div>
            </button>
            <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm font-medium transition-colors hover:bg-gray-50 rounded-t-lg whitespace-nowrap">
              <div className="flex items-center gap-2">
                <lucide_react_1.Users className="w-4 h-4"/>
                Clientes
                <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">248</span>
              </div>
            </button>
            <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm font-medium transition-colors hover:bg-gray-50 rounded-t-lg whitespace-nowrap">
              <div className="flex items-center gap-2">
                <lucide_react_1.FileText className="w-4 h-4"/>
                Propostas
                <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded">32</span>
              </div>
            </button>
            <button className="py-2 px-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 text-sm font-medium transition-colors hover:bg-gray-50 rounded-t-lg whitespace-nowrap">
              <div className="flex items-center gap-2">
                <lucide_react_1.BarChart3 className="w-4 h-4"/>
                Relatórios
              </div>
            </button>
          </nav>
        </div>

        {/* Resumo Rápido com ícones e melhor design responsivo */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-blue-100 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center group cursor-pointer hover:transform hover:scale-105 transition-all duration-200 p-2">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <lucide_react_1.UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"/>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">157</div>
              <div className="text-xs text-blue-600 font-medium">Novos Leads</div>
              <div className="text-xs text-blue-500 mt-1 hidden sm:block">+23% vs mês anterior</div>
            </div>
            
            <div className="text-center group cursor-pointer hover:transform hover:scale-105 transition-all duration-200 p-2">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <lucide_react_1.TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"/>
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">R$ 89.650</div>
              <div className="text-xs text-green-600 font-medium">Vendas do Mês</div>
              <div className="text-xs text-green-500 mt-1 hidden sm:block">Meta: R$ 100k</div>
            </div>
            
            <div className="text-center group cursor-pointer hover:transform hover:scale-105 transition-all duration-200 p-2">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                  <lucide_react_1.Heart className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600"/>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-orange-600 mb-1">94.2%</div>
              <div className="text-xs text-orange-600 font-medium">Satisfação Cliente</div>
              <div className="text-xs text-orange-500 mt-1 hidden sm:block">Excelente!</div>
            </div>
            
            <div className="text-center group cursor-pointer hover:transform hover:scale-105 transition-all duration-200 p-2">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                  <lucide_react_1.Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600"/>
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-purple-600 mb-1">18</div>
              <div className="text-xs text-purple-600 font-medium">Reuniões Hoje</div>
              <div className="text-xs text-purple-500 mt-1 hidden sm:block">Próxima: 14:30</div>
            </div>
          </div>
        </div>
      </div>
      {/* Filtros */}
      <ResponsiveFilters_1.ResponsiveFilters filtros={filtros} setFiltros={setFiltros}/>
      
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <KPICard_1.KPICard title="Total de Clientes" value={(kpiData === null || kpiData === void 0 ? void 0 : kpiData.totalClientes.value) || 248} icon={<lucide_react_1.Users size={24}/>} trend={kpiData === null || kpiData === void 0 ? void 0 : kpiData.totalClientes.trend} isLoading={kpiLoading} color="blue"/>
        
        <KPICard_1.KPICard title="Propostas Ativas" value={(kpiData === null || kpiData === void 0 ? void 0 : kpiData.propostasAtivas.value) || 32} icon={<lucide_react_1.FileText size={24}/>} trend={kpiData === null || kpiData === void 0 ? void 0 : kpiData.propostasAtivas.trend} isLoading={kpiLoading} color="orange"/>
        
        <KPICard_1.KPICard title="Receita do Mês" value={(kpiData === null || kpiData === void 0 ? void 0 : kpiData.receitaMes.value) || "R$ 125.000,00"} icon={<lucide_react_1.DollarSign size={24}/>} trend={kpiData === null || kpiData === void 0 ? void 0 : kpiData.receitaMes.trend} isLoading={kpiLoading} color="green"/>
        
        <KPICard_1.KPICard title="Taxa de Conversão" value={(kpiData === null || kpiData === void 0 ? void 0 : kpiData.taxaConversao.value) || "68%"} icon={<lucide_react_1.TrendingUp size={24}/>} trend={kpiData === null || kpiData === void 0 ? void 0 : kpiData.taxaConversao.trend} isLoading={kpiLoading} color="purple"/>
      </div>

      {/* Error State */}
      {kpiError && (<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <lucide_react_1.AlertTriangle className="w-5 h-5 text-red-600 mr-2"/>
            <p className="text-red-800 font-medium">Erro ao carregar dados</p>
          </div>
          <p className="text-red-600 text-sm mt-1">{kpiError}</p>
        </div>)}

      {/* Área de Gráficos e Widgets - Layout Responsivo */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Gráfico de Evolução de Vendas */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
            <h3 className="text-lg font-semibold mb-2 sm:mb-0">Evolução de Vendas</h3>
            <div className="flex items-center gap-2 text-sm">
              <button className="px-3 py-1 text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors">
                Valor
              </button>
              <button className="px-3 py-1 text-gray-600 hover:bg-gray-50 rounded transition-colors">
                Quantidade
              </button>
            </div>
          </div>
          
          {/* Gráfico de Linha Responsivo */}
          <div className="h-64 sm:h-80 relative">
            <div className="absolute inset-0 flex items-end justify-between bg-gray-50 rounded p-2">
              {[
            { mes: 'Jan', valor: 180000, altura: '45%' },
            { mes: 'Fev', valor: 220000, altura: '55%' },
            { mes: 'Mar', valor: 190000, altura: '47%' },
            { mes: 'Abr', valor: 250000, altura: '62%' },
            { mes: 'Mai', valor: 280000, altura: '70%' },
            { mes: 'Jun', valor: 240000, altura: '60%' },
            { mes: 'Jul', valor: 300000, altura: '75%' },
            { mes: 'Ago', valor: 320000, altura: '80%' },
            { mes: 'Set', valor: 290000, altura: '72%' },
            { mes: 'Out', valor: 340000, altura: '85%' },
            { mes: 'Nov', valor: 360000, altura: '90%' },
            { mes: 'Dez', valor: 400000, altura: '100%' }
        ].map(function (item, index) { return (<div key={index} className="flex flex-col items-center flex-1 group cursor-pointer">
                  <div className="w-full mx-1 bg-blue-500 hover:bg-blue-600 transition-all duration-300 rounded-t relative group-hover:shadow-lg" style={{ height: item.altura }} title={"".concat(item.mes, ": ").concat(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor))}>
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(item.valor)}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 mt-2 font-medium">{item.mes}</span>
                </div>); })}
            </div>
          </div>
          
          {/* Resumo */}
          <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Total: </span>
              <span className="text-blue-600 font-semibold">R$ 2.600.000</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-gray-600">Vendas (R$)</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Funil de Vendas Responsivo */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Funil de Vendas</h3>
            <button className="text-sm text-blue-600 hover:underline">Ver detalhes</button>
          </div>
          
          <div className="space-y-4">
            {[
            { etapa: 'Leads', total: 150, conversao: 100, cor: 'bg-blue-500', corFundo: 'bg-blue-50' },
            { etapa: 'Qualificados', total: 89, conversao: 59.3, cor: 'bg-green-500', corFundo: 'bg-green-50' },
            { etapa: 'Propostas', total: 45, conversao: 50.6, cor: 'bg-yellow-500', corFundo: 'bg-yellow-50' },
            { etapa: 'Negociação', total: 23, conversao: 51.1, cor: 'bg-orange-500', corFundo: 'bg-orange-50' },
            { etapa: 'Fechados', total: 15, conversao: 65.2, cor: 'bg-purple-500', corFundo: 'bg-purple-50' }
        ].map(function (item, index) { return (<div key={index} className={"p-3 rounded-lg ".concat(item.corFundo, " border border-opacity-20")}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={"w-3 h-3 rounded-full ".concat(item.cor)}></div>
                    <span className="font-medium text-gray-800">{item.etapa}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-gray-900">{item.total}</span>
                    <span className="text-sm text-gray-500">({item.conversao.toFixed(1)}%)</span>
                  </div>
                </div>
                
                {/* Barra de Progresso */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={"h-2 rounded-full ".concat(item.cor, " transition-all duration-500")} style={{ width: "".concat((item.total / 150) * 100, "%") }}></div>
                  </div>
                </div>
              </div>); })}
          </div>
          
          {/* Conversão Geral */}
          <div className="mt-6 pt-4 border-t bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Taxa de Conversão Geral</span>
              <span className="text-lg font-bold text-green-600">10%</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              15 fechamentos de 150 leads iniciais
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Análises e Status - Layout Responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Status das Propostas - Gráfico Circular */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Status das Propostas</h3>
            <button className="text-sm text-blue-600 hover:underline">Ver todas</button>
          </div>
          
          {/* Gráfico Circular Responsivo */}
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8"/>
                
                {/* Pendentes - 41.4% */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray={"".concat(41.4 * 2.51, " 251.2")} strokeDashoffset="0" className="transition-all duration-500"/>
                
                {/* Aprovadas - 27.6% */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={"".concat(27.6 * 2.51, " 251.2")} strokeDashoffset={"-".concat(41.4 * 2.51)} className="transition-all duration-500"/>
                
                {/* Negociação - 20.7% */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="8" strokeDasharray={"".concat(20.7 * 2.51, " 251.2")} strokeDashoffset={"-".concat((41.4 + 27.6) * 2.51)} className="transition-all duration-500"/>
                
                {/* Rejeitadas - 10.3% */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray={"".concat(10.3 * 2.51, " 251.2")} strokeDashoffset={"-".concat((41.4 + 27.6 + 20.7) * 2.51)} className="transition-all duration-500"/>
              </svg>
              
              {/* Centro com total */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">29</span>
                <span className="text-xs text-gray-500 font-medium">Total</span>
              </div>
            </div>
            
            {/* Legenda Responsiva */}
            <div className="mt-4 space-y-2 w-full">
              {[
            { label: 'Pendentes', valor: 12, percent: '41.4%', cor: 'bg-yellow-500' },
            { label: 'Aprovadas', valor: 8, percent: '27.6%', cor: 'bg-green-500' },
            { label: 'Negociação', valor: 6, percent: '20.7%', cor: 'bg-blue-500' },
            { label: 'Rejeitadas', valor: 3, percent: '10.3%', cor: 'bg-red-500' }
        ].map(function (item, index) { return (<div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={"w-3 h-3 rounded-full ".concat(item.cor)}></div>
                    <span className="text-gray-700">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.valor}</span>
                    <span className="text-gray-500">{item.percent}</span>
                  </div>
                </div>); })}
            </div>
          </div>
        </div>
        
        {/* Ações Rápidas Melhoradas */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
          
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 rounded-lg transition-colors border border-blue-200 hover:border-blue-300">
              <div className="p-2 bg-blue-100 rounded-full">
                <lucide_react_1.Plus className="w-4 h-4 text-blue-600"/>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Nova Proposta</p>
                <p className="text-sm text-gray-500">Criar proposta para cliente</p>
              </div>
              <lucide_react_1.ChevronRight className="w-4 h-4 text-gray-400"/>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-green-50 rounded-lg transition-colors border border-green-200 hover:border-green-300">
              <div className="p-2 bg-green-100 rounded-full">
                <lucide_react_1.Calendar className="w-4 h-4 text-green-600"/>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Agendar Reunião</p>
                <p className="text-sm text-gray-500">Marcar call com prospect</p>
              </div>
              <lucide_react_1.ChevronRight className="w-4 h-4 text-gray-400"/>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-orange-50 rounded-lg transition-colors border border-orange-200 hover:border-orange-300">
              <div className="p-2 bg-orange-100 rounded-full">
                <lucide_react_1.Users className="w-4 h-4 text-orange-600"/>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Novo Lead</p>
                <p className="text-sm text-gray-500">Cadastrar novo prospect</p>
              </div>
              <lucide_react_1.ChevronRight className="w-4 h-4 text-gray-400"/>
            </button>
            
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-purple-50 rounded-lg transition-colors border border-purple-200 hover:border-purple-300">
              <div className="p-2 bg-purple-100 rounded-full">
                <lucide_react_1.BarChart3 className="w-4 h-4 text-purple-600"/>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Relatório</p>
                <p className="text-sm text-gray-500">Gerar análise de vendas</p>
              </div>
              <lucide_react_1.ChevronRight className="w-4 h-4 text-gray-400"/>
            </button>
          </div>
        </div>

        {/* Análise de Performance Compacta Melhorada */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Performance</h3>
          
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Ticket Médio</p>
                  <p className="text-lg font-bold text-blue-700">R$ 18.750</p>
                  <p className="text-xs text-blue-500">+12% vs mês anterior</p>
                </div>
                <lucide_react_1.TrendingUp className="w-6 h-6 text-blue-500"/>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium">Ciclo Médio</p>
                  <p className="text-lg font-bold text-green-700">12 dias</p>
                  <p className="text-xs text-green-500">-3 dias vs meta</p>
                </div>
                <lucide_react_1.Clock className="w-6 h-6 text-green-500"/>
              </div>
            </div>
          </div>

          {/* Progresso por Etapa */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Progresso por Etapa</h4>
            {[
            { etapa: 'Prospecção', valor: 45, meta: 50, cor: 'bg-blue-500' },
            { etapa: 'Qualificação', valor: 32, meta: 40, cor: 'bg-yellow-500' },
            { etapa: 'Proposta', valor: 28, meta: 30, cor: 'bg-orange-500' },
            { etapa: 'Fechamento', valor: 15, meta: 20, cor: 'bg-green-500' }
        ].map(function (item, index) { return (<div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={"w-2 h-2 rounded-full ".concat(item.cor)}></div>
                    <span className="text-xs font-medium text-gray-700">{item.etapa}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-gray-900">{item.valor}</span>
                    <span className="text-xs text-gray-500">/{item.meta}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className={"h-1.5 rounded-full ".concat(item.cor, " transition-all duration-500")} style={{ width: "".concat((item.valor / item.meta) * 100, "%") }}></div>
                </div>
              </div>); })}
          </div>
        </div>
      </div>

      {/* Linha de Tabela e Ranking - Layout Compacto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Tabela de Propostas Recentes */}
        <div>
          <TabelaPropostasRecentes propostas={dados.ultimasPropostas}/>
        </div>
        
        {/* Ranking de Vendedores */}
        <div>
          <RankingVendedores />
        </div>
      </div>

      {/* Última linha de Widgets - Layout Compacto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Atividades Recentes */}
        <div>
          <RecentActivitiesWidget_1.RecentActivitiesWidget isLoading={kpiLoading}/>
        </div>
        
        {/* Metas e Objetivos */}
        <div>
          <GoalsWidget_1.GoalsWidget isLoading={kpiLoading}/>
        </div>
      </div>

      {/* Alertas e Notificações - Linha Separada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-6">
        {/* Alertas e Notificações */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <lucide_react_1.AlertTriangle className="w-5 h-5 text-orange-500"/>
              Alertas
            </h3>
            <button className="text-sm text-blue-600 hover:underline">Ver todos</button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 border-l-4 border-red-400 rounded">
              <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-500 mt-0.5"/>
              <div>
                <p className="text-sm font-medium text-red-800">Proposta vencida</p>
                <p className="text-xs text-red-600">Tech Solutions - Proposta venceu há 3 dias</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <lucide_react_1.Clock className="w-4 h-4 text-yellow-500 mt-0.5"/>
              <div>
                <p className="text-sm font-medium text-yellow-800">Follow-up pendente</p>
                <p className="text-xs text-yellow-600">Empresa ABC - Último contato há 5 dias</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <lucide_react_1.Bell className="w-4 h-4 text-blue-500 mt-0.5"/>
              <div>
                <p className="text-sm font-medium text-blue-800">Reunião agendada</p>
                <p className="text-xs text-blue-600">StartUp Growth - Hoje às 15:00</p>
              </div>
            </div>
          </div>
        </div>

        {/* Atividades Recentes Detalhadas */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <lucide_react_1.Activity className="w-5 h-5 text-green-500"/>
              Atividades Recentes
            </h3>
            <button className="text-sm text-blue-600 hover:underline">Ver todas</button>
          </div>
          
          <div className="space-y-4">
            {[
            {
                icon: <lucide_react_1.CheckSquare className="w-4 h-4 text-green-500"/>,
                titulo: "Proposta aprovada",
                descricao: "Empresa ABC aprovou proposta de R$ 25.000",
                tempo: "2 horas atrás",
                usuario: "João Silva"
            },
            {
                icon: <lucide_react_1.Plus className="w-4 h-4 text-blue-500"/>,
                titulo: "Novo cliente cadastrado",
                descricao: "Digital Marketing Pro foi adicionado ao sistema",
                tempo: "4 horas atrás",
                usuario: "Maria Santos"
            },
            {
                icon: <lucide_react_1.Edit className="w-4 h-4 text-orange-500"/>,
                titulo: "Proposta atualizada",
                descricao: "Valores da proposta para StartUp Growth foram ajustados",
                tempo: "6 horas atrás",
                usuario: "Pedro Costa"
            },
            {
                icon: <lucide_react_1.Calendar className="w-4 h-4 text-purple-500"/>,
                titulo: "Reunião realizada",
                descricao: "Meeting com Tech Solutions - Apresentação do produto",
                tempo: "1 dia atrás",
                usuario: "Ana Oliveira"
            }
        ].map(function (atividade, index) { return (<div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-b-0">
                <div className="p-2 bg-gray-100 rounded-full">
                  {atividade.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{atividade.titulo}</p>
                  <p className="text-xs text-gray-600">{atividade.descricao}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{atividade.tempo}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{atividade.usuario}</span>
                  </div>
                </div>
              </div>); })}
          </div>
        </div>
      </div>
    </ResponsiveDashboardLayout_1.ResponsiveDashboardLayout>);
};
exports["default"] = DashboardPage;
