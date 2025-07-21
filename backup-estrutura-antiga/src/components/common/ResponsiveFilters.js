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
exports.ResponsiveFilters = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var useAccessibility_1 = require("../../hooks/useAccessibility");
var ResponsiveFilters = function (_a) {
    var filtros = _a.filtros, setFiltros = _a.setFiltros;
    var _b = (0, react_1.useState)(false), isExpanded = _b[0], setIsExpanded = _b[1];
    var announceToScreenReader = (0, useAccessibility_1.useAccessibility)({ announceChanges: true }).announceToScreenReader;
    var filtersId = react_1["default"].useId();
    var handleToggleExpand = function () {
        var newState = !isExpanded;
        setIsExpanded(newState);
        announceToScreenReader(newState ? 'Filtros expandidos' : 'Filtros recolhidos', 'polite');
    };
    var handleFilterChange = function (filterType, value) {
        var _a;
        setFiltros(__assign(__assign({}, filtros), (_a = {}, _a[filterType] = value, _a)));
        announceToScreenReader("Filtro ".concat(filterType, " alterado para ").concat(value), 'polite');
    };
    return (<section className="bg-white rounded-lg shadow-sm border mb-4 sm:mb-6" role="region" aria-label="Filtros do dashboard">
      {/* Mobile Toggle */}
      <div className="sm:hidden">
        <button onClick={handleToggleExpand} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-colors" aria-expanded={isExpanded} aria-controls={"".concat(filtersId, "-content")} aria-label={"".concat(isExpanded ? 'Recolher' : 'Expandir', " filtros do dashboard")}>
          <div className="flex items-center gap-2">
            <lucide_react_1.Filter className="w-4 h-4 text-gray-500" aria-hidden="true"/>
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          <lucide_react_1.ChevronDown className={"w-4 h-4 text-gray-500 transition-transform duration-200 ".concat(isExpanded ? 'rotate-180' : '')}/>
        </button>
        
        {isExpanded && (<div className="px-4 pb-4 space-y-3 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Período
              </label>
              <select value={filtros.periodo} onChange={function (e) { return setFiltros(__assign(__assign({}, filtros), { periodo: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="ultimo_mes">Último mês</option>
                <option value="ultimo_trimestre">Último trimestre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Vendedor
              </label>
              <select value={filtros.vendedor} onChange={function (e) { return setFiltros(__assign(__assign({}, filtros), { vendedor: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="Todos">Todos os vendedores</option>
                <option value="João Silva">João Silva</option>
                <option value="Maria Santos">Maria Santos</option>
                <option value="Pedro Costa">Pedro Costa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Região
              </label>
              <select value={filtros.regiao} onChange={function (e) { return setFiltros(__assign(__assign({}, filtros), { regiao: e.target.value })); }} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="Todas">Todas as regiões</option>
                <option value="Norte">Norte</option>
                <option value="Sul">Sul</option>
                <option value="Sudeste">Sudeste</option>
                <option value="Centro-Oeste">Centro-Oeste</option>
                <option value="Nordeste">Nordeste</option>
              </select>
            </div>
          </div>)}
      </div>

      {/* Desktop Filters */}
      <div className="hidden sm:block p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <lucide_react_1.Filter className="w-4 h-4 text-gray-500"/>
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          
          <select value={filtros.periodo} onChange={function (e) { return setFiltros(__assign(__assign({}, filtros), { periodo: e.target.value })); }} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="ultimo_mes">Último mês</option>
            <option value="ultimo_trimestre">Último trimestre</option>
          </select>
          
          <select value={filtros.vendedor} onChange={function (e) { return setFiltros(__assign(__assign({}, filtros), { vendedor: e.target.value })); }} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="Todos">Todos os vendedores</option>
            <option value="João Silva">João Silva</option>
            <option value="Maria Santos">Maria Santos</option>
            <option value="Pedro Costa">Pedro Costa</option>
          </select>
          
          <select value={filtros.regiao} onChange={function (e) { return setFiltros(__assign(__assign({}, filtros), { regiao: e.target.value })); }} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="Todas">Todas as regiões</option>
            <option value="Norte">Norte</option>
            <option value="Sul">Sul</option>
            <option value="Sudeste">Sudeste</option>
            <option value="Centro-Oeste">Centro-Oeste</option>
            <option value="Nordeste">Nordeste</option>
          </select>
        </div>
      </div>
    </section>);
};
exports.ResponsiveFilters = ResponsiveFilters;
