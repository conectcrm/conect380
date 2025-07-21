"use strict";
exports.__esModule = true;
exports.SalesEvolutionChart = void 0;
var react_1 = require("react");
var salesData = [
    { month: 'Jan', sales: 120000, quantity: 45 },
    { month: 'Fev', sales: 150000, quantity: 52 },
    { month: 'Mar', sales: 180000, quantity: 68 },
    { month: 'Abr', sales: 135000, quantity: 48 },
    { month: 'Mai', sales: 195000, quantity: 72 },
    { month: 'Jun', sales: 225000, quantity: 85 },
    { month: 'Jul', sales: 210000, quantity: 78 },
    { month: 'Ago', sales: 240000, quantity: 90 },
    { month: 'Set', sales: 260000, quantity: 95 },
    { month: 'Out', sales: 275000, quantity: 102 },
    { month: 'Nov', sales: 290000, quantity: 108 },
    { month: 'Dez', sales: 320000, quantity: 125 }
];
var SalesEvolutionChart = function (_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b, _c = _a.isLoading, isLoading = _c === void 0 ? false : _c;
    var _d = (0, react_1.useState)('sales'), viewMode = _d[0], setViewMode = _d[1];
    var _e = (0, react_1.useState)(null), hoveredIndex = _e[0], setHoveredIndex = _e[1];
    if (isLoading) {
        return (<div className={"bg-white rounded-lg shadow-sm border border-gray-200 p-6 ".concat(className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>);
    }
    var maxValue = Math.max.apply(Math, salesData.map(function (item) {
        return viewMode === 'sales' ? item.sales : item.quantity;
    }));
    var formatValue = function (value) {
        if (viewMode === 'sales') {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        }
        return value.toString();
    };
    return (<div className={"bg-white rounded-lg shadow-sm border border-gray-200 p-6 ".concat(className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Evolução de Vendas
        </h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={function () { return setViewMode('sales'); }} className={"px-3 py-1 text-sm font-medium rounded-md transition-colors ".concat(viewMode === 'sales'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900')} aria-pressed={viewMode === 'sales'}>
            Valor
          </button>
          <button onClick={function () { return setViewMode('quantity'); }} className={"px-3 py-1 text-sm font-medium rounded-md transition-colors ".concat(viewMode === 'quantity'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900')} aria-pressed={viewMode === 'quantity'}>
            Quantidade
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <div className="flex items-end justify-between h-full space-x-2">
          {salesData.map(function (item, index) {
            var value = viewMode === 'sales' ? item.sales : item.quantity;
            var height = (value / maxValue) * 100;
            return (<div key={item.month} className="flex-1 flex flex-col items-center group" onMouseEnter={function () { return setHoveredIndex(index); }} onMouseLeave={function () { return setHoveredIndex(null); }}>
                {/* Tooltip */}
                {hoveredIndex === index && (<div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 z-10 whitespace-nowrap">
                    <div className="font-medium">{item.month}</div>
                    <div>{formatValue(value)}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>)}
                
                {/* Bar */}
                <div className="w-full bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600" style={{ height: "".concat(height, "%"), minHeight: '4px' }} role="img" aria-label={"".concat(item.month, ": ").concat(formatValue(value))}/>
                
                {/* Month label */}
                <div className="mt-2 text-xs text-gray-600 font-medium">
                  {item.month}
                </div>
              </div>);
        })}
        </div>
      </div>

      {/* Legend/Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-sm mr-2"></div>
              <span className="text-gray-600">
                {viewMode === 'sales' ? 'Vendas (R$)' : 'Quantidade'}
              </span>
            </div>
          </div>
          <div className="text-gray-500">
            Total: {formatValue(salesData.reduce(function (sum, item) {
            return sum + (viewMode === 'sales' ? item.sales : item.quantity);
        }, 0))}
          </div>
        </div>
      </div>

      {/* Accessibility table for screen readers */}
      <table className="sr-only" aria-label="Dados de vendas por mês">
        <caption>Evolução de vendas mensais</caption>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Valor (R$)</th>
            <th>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {salesData.map(function (item) { return (<tr key={item.month}>
              <td>{item.month}</td>
              <td>{formatValue(item.sales)}</td>
              <td>{item.quantity}</td>
            </tr>); })}
        </tbody>
      </table>
    </div>);
};
exports.SalesEvolutionChart = SalesEvolutionChart;
exports["default"] = exports.SalesEvolutionChart;
