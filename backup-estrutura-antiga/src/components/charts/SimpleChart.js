"use strict";
exports.__esModule = true;
var react_1 = require("react");
var SimpleChart = function (_a) {
    var data = _a.data, type = _a.type, _b = _a.height, height = _b === void 0 ? 200 : _b, _c = _a.showLabels, showLabels = _c === void 0 ? true : _c;
    var maxValue = Math.max.apply(Math, data.map(function (d) { return d.value; }));
    if (type === 'bar') {
        return (<div className="w-full" style={{ height: height }}>
        <div className="flex items-end justify-center h-full gap-4 px-4">
          {data.map(function (item, index) {
                var barHeight = (item.value / maxValue) * (height - 40);
                var color = item.color || "hsl(".concat((index * 60) % 360, ", 70%, 50%)");
                return (<div key={index} className="flex flex-col items-center">
                <div className="text-xs font-medium mb-1">
                  {item.value.toLocaleString('pt-BR')}
                </div>
                <div className="w-12 transition-all duration-500 ease-out" style={{
                        height: barHeight,
                        backgroundColor: color,
                        borderRadius: '4px 4px 0 0'
                    }}/>
                {showLabels && (<div className="text-xs text-gray-600 mt-2 text-center w-16">
                    {item.label}
                  </div>)}
              </div>);
            })}
        </div>
      </div>);
    }
    if (type === 'line') {
        var points = data.map(function (item, index) {
            var x = (index / (data.length - 1)) * 100;
            var y = 100 - (item.value / maxValue) * 80;
            return "".concat(x, ",").concat(y);
        }).join(' ');
        return (<div className="w-full" style={{ height: height }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
          <polyline fill="none" stroke="#3B82F6" strokeWidth="2" points={points} className="drop-shadow-sm"/>
          {data.map(function (item, index) {
                var x = (index / (data.length - 1)) * 100;
                var y = 100 - (item.value / maxValue) * 80;
                return (<circle key={index} cx={x} cy={y} r="3" fill="#3B82F6" className="drop-shadow-sm"/>);
            })}
        </svg>
        {showLabels && (<div className="flex justify-between mt-2 text-xs text-gray-600">
            {data.map(function (item, index) { return (<span key={index}>{item.label}</span>); })}
          </div>)}
      </div>);
    }
    if (type === 'doughnut') {
        var total_1 = data.reduce(function (sum, item) { return sum + item.value; }, 0);
        var cumulativePercentage_1 = 0;
        var radius_1 = 40;
        var center_1 = 50;
        return (<div className="flex items-center justify-center" style={{ height: height }}>
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 100 100">
            {data.map(function (item, index) {
                var percentage = (item.value / total_1) * 100;
                var angle = (percentage / 100) * 360;
                var startAngle = (cumulativePercentage_1 / 100) * 360 - 90;
                var endAngle = startAngle + angle;
                var x1 = center_1 + radius_1 * Math.cos((startAngle * Math.PI) / 180);
                var y1 = center_1 + radius_1 * Math.sin((startAngle * Math.PI) / 180);
                var x2 = center_1 + radius_1 * Math.cos((endAngle * Math.PI) / 180);
                var y2 = center_1 + radius_1 * Math.sin((endAngle * Math.PI) / 180);
                var largeArc = angle > 180 ? 1 : 0;
                var color = item.color || "hsl(".concat((index * 60) % 360, ", 70%, 50%)");
                var pathData = [
                    "M ".concat(center_1, " ").concat(center_1),
                    "L ".concat(x1, " ").concat(y1),
                    "A ".concat(radius_1, " ").concat(radius_1, " 0 ").concat(largeArc, " 1 ").concat(x2, " ").concat(y2),
                    'Z'
                ].join(' ');
                cumulativePercentage_1 += percentage;
                return (<path key={index} d={pathData} fill={color} className="drop-shadow-sm"/>);
            })}
            <circle cx={center_1} cy={center_1} r="20" fill="white" className="drop-shadow-sm"/>
          </svg>
          
          {showLabels && (<div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold">{total_1}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>)}
        </div>
        
        {showLabels && (<div className="ml-4 space-y-2">
            {data.map(function (item, index) {
                    var color = item.color || "hsl(".concat((index * 60) % 360, ", 70%, 50%)");
                    var percentage = ((item.value / total_1) * 100).toFixed(1);
                    return (<div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}/>
                  <span className="text-gray-700">{item.label}</span>
                  <span className="text-gray-500">({percentage}%)</span>
                </div>);
                })}
          </div>)}
      </div>);
    }
    return null;
};
exports["default"] = SimpleChart;
