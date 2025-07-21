"use strict";
exports.__esModule = true;
exports.SalesFunnelChart = void 0;
var react_1 = require("react");
var defaultData = [
    { stage: 'Leads', value: 150, color: '#3b82f6', count: 150 },
    { stage: 'Qualificados', value: 89, color: '#10b981', count: 89 },
    { stage: 'Propostas', value: 45, color: '#f59e0b', count: 45 },
    { stage: 'Negociação', value: 23, color: '#f97316', count: 23 },
    { stage: 'Fechados', value: 15, color: '#8b5cf6', count: 15 },
];
var SalesFunnelChart = function (_a) {
    var _b = _a.data, data = _b === void 0 ? defaultData : _b, _c = _a.isLoading, isLoading = _c === void 0 ? false : _c;
    var maxValue = Math.max.apply(Math, data.map(function (item) { return item.value; }));
    if (isLoading) {
        return (<div className="bg-white rounded-xl shadow-sm border p-6" role="status" aria-label="Carregando funil de vendas">
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-4 w-32"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(function (i) { return (<div key={i} className="flex items-center space-x-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
              <div className="h-6 bg-gray-200 rounded animate-pulse flex-1"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
            </div>); })}
        </div>
      </div>);
    }
    return (<div className="bg-white rounded-xl shadow-sm border p-6" role="region" aria-label="Funil de vendas - Conversão por etapa">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Funil de Vendas
      </h3>

      <div className="space-y-4" role="list" aria-label="Etapas do funil de vendas">
        {data.map(function (item, index) {
            var percentage = (item.value / maxValue) * 100;
            var conversionRate = index > 0 ? ((item.value / data[index - 1].value) * 100).toFixed(1) : '100.0';
            return (<div key={item.stage} className="group" role="listitem" aria-label={"".concat(item.stage, ": ").concat(item.count, " leads, ").concat(conversionRate, "% de convers\u00E3o")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} aria-hidden="true"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {item.stage}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {item.count}
                  </span>
                  {index > 0 && (<span className="text-xs text-gray-500">
                      ({conversionRate}%)
                    </span>)}
                </div>
              </div>
              
              <div className="relative">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden" role="progressbar" aria-valuenow={item.value} aria-valuemin={0} aria-valuemax={maxValue} aria-label={"".concat(item.stage, ": ").concat(item.count, " de ").concat(maxValue, " leads")}>
                  <div className="h-full rounded-lg transition-all duration-300 ease-in-out group-hover:opacity-80" style={{
                    width: "".concat(percentage, "%"),
                    backgroundColor: item.color
                }}></div>
                </div>
                
                {/* Números dentro da barra */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-white drop-shadow-sm" aria-hidden="true">
                    {item.count}
                  </span>
                </div>
              </div>
            </div>);
        })}
      </div>

      {/* Status das Propostas */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">
          Status das Propostas
        </h4>
        
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="2"/>
              {/* Pendentes - 41.4% */}
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="41.4, 100" strokeDashoffset="25"/>
              {/* Aprovadas - 27.6% */}
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="27.6, 100" strokeDashoffset="25" transform="rotate(149 18 18)"/>
              {/* Negociação - 20.7% */}
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="20.7, 100" strokeDashoffset="25" transform="rotate(248 18 18)"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">29</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Pendentes</span>
            </div>
            <span className="font-medium">41.4%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Aprovadas</span>
            </div>
            <span className="font-medium">27.6%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Negociação</span>
            </div>
            <span className="font-medium">20.7%</span>
          </div>
        </div>
      </div>

      {/* Tabela de dados acessível para leitores de tela */}
      <table className="sr-only">
        <caption>Dados do funil de vendas por etapa</caption>
        <thead>
          <tr>
            <th scope="col">Etapa</th>
            <th scope="col">Quantidade</th>
            <th scope="col">Taxa de Conversão</th>
          </tr>
        </thead>
        <tbody>
          {data.map(function (item, index) {
            var conversionRate = index > 0 ? ((item.value / data[index - 1].value) * 100).toFixed(1) : '100.0';
            return (<tr key={item.stage}>
                <td>{item.stage}</td>
                <td>{item.count}</td>
                <td>{conversionRate}%</td>
              </tr>);
        })}
        </tbody>
      </table>
    </div>);
};
exports.SalesFunnelChart = SalesFunnelChart;
