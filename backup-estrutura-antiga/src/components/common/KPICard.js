"use strict";
exports.__esModule = true;
exports.KPICard = void 0;
var react_1 = require("react");
var icons_1 = require("../icons");
var colorClasses = {
    blue: {
        bg: 'bg-blue-50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        text: 'text-blue-600',
        border: 'border-blue-200'
    },
    green: {
        bg: 'bg-green-50',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        text: 'text-green-600',
        border: 'border-green-200'
    },
    purple: {
        bg: 'bg-purple-50',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-200'
    },
    orange: {
        bg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        text: 'text-orange-600',
        border: 'border-orange-200'
    },
    red: {
        bg: 'bg-red-50',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        text: 'text-red-600',
        border: 'border-red-200'
    }
};
var KPICard = function (_a) {
    var title = _a.title, value = _a.value, subtitle = _a.subtitle, icon = _a.icon, trend = _a.trend, _b = _a.isLoading, isLoading = _b === void 0 ? false : _b, _c = _a.color, color = _c === void 0 ? 'blue' : _c, _d = _a.className, className = _d === void 0 ? '' : _d, ariaLabel = _a["aria-label"], ariaDescribedBy = _a["aria-describedby"];
    var colors = colorClasses[color];
    var cardId = react_1["default"].useId();
    var valueId = "".concat(cardId, "-value");
    var trendId = "".concat(cardId, "-trend");
    // Gera aria-label automático se não fornecido
    var autoAriaLabel = ariaLabel || "".concat(title, ": ").concat(typeof value === 'number' ? value.toLocaleString('pt-BR') : value).concat(trend ? ", tend\u00EAncia ".concat(trend.isPositive ? 'positiva' : 'negativa', " de ").concat(trend.value, "%") : '');
    if (isLoading) {
        return (<div className={"bg-white rounded-xl shadow-sm border p-4 sm:p-6 ".concat(className)} role="status" aria-label="Carregando dados do indicador" aria-live="polite">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-20 sm:w-24" aria-hidden="true"></div>
          <div className={"p-2 sm:p-3 rounded-xl ".concat(colors.iconBg)} aria-hidden="true">
            <icons_1.LoaderIcon size={20} className={"sm:w-6 sm:h-6 ".concat(colors.iconColor)}/>
          </div>
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="h-6 sm:h-8 bg-gray-200 rounded animate-pulse w-16 sm:w-20" aria-hidden="true"></div>
          <div className="h-2 sm:h-3 bg-gray-200 rounded animate-pulse w-24 sm:w-32" aria-hidden="true"></div>
        </div>
        <span className="sr-only">Carregando indicador: {title}</span>
      </div>);
    }
    return (<article className={"\n        bg-white rounded-xl shadow-sm border hover:shadow-md \n        transition-all duration-200 p-4 sm:p-6 ".concat(colors.border, " ").concat(className, "\n        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2\n      ")} role="region" aria-label={autoAriaLabel} aria-describedby={ariaDescribedBy} tabIndex={0}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-medium text-gray-600 truncate pr-2" id={"".concat(cardId, "-title")}>
          {title}
        </h3>
        <div className={"p-2 sm:p-3 rounded-xl ".concat(colors.iconBg, " flex-shrink-0")} aria-label={"\u00CDcone do indicador ".concat(title)} role="img">
          <div className={colors.iconColor} aria-hidden="true">
            {icon}
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="space-y-1 sm:space-y-2">
        <p className="text-xl sm:text-3xl font-bold text-gray-900 break-all" id={valueId} aria-label={"Valor: ".concat(typeof value === 'number' ? value.toLocaleString('pt-BR') : value)}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </p>
        
        {/* Trend and Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
          {subtitle && (<p className="text-xs sm:text-sm text-gray-500 truncate" aria-label={"Descri\u00E7\u00E3o: ".concat(subtitle)}>
              {subtitle}
            </p>)}
          
          {trend && (<div className={"\n                flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full self-start sm:self-auto\n                ".concat(trend.isPositive
                ? 'text-green-700 bg-green-100'
                : 'text-red-700 bg-red-100', "\n              ")} id={trendId} role="status" aria-label={"Tend\u00EAncia ".concat(trend.isPositive ? 'positiva' : 'negativa', " de ").concat(Math.abs(trend.value), "% ").concat(trend.label)}>
              {trend.isPositive ? (<icons_1.ArrowUpIcon size={10} aria-hidden="true"/>) : (<icons_1.ArrowDownIcon size={10} aria-hidden="true"/>)}
              <span className="whitespace-nowrap" aria-hidden="true">{Math.abs(trend.value)}%</span>
              <span className="text-gray-500 hidden sm:inline" aria-hidden="true">{trend.label}</span>
            </div>)}
        </div>
      </div>
    </article>);
};
exports.KPICard = KPICard;
