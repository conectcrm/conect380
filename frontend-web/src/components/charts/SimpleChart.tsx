import React from 'react';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleChartProps {
  data: ChartData[];
  type: 'bar' | 'line' | 'doughnut';
  height?: number;
  showLabels?: boolean;
}

const SimpleChart: React.FC<SimpleChartProps> = ({
  data,
  type,
  height = 200,
  showLabels = true
}) => {
  // Guard: Se data for undefined/null/vazio, retornar estado vazio
  const safeData = data || [];

  if (safeData.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <p className="text-gray-400 text-sm">Sem dados para exibir</p>
      </div>
    );
  }

  const maxValue = Math.max(...safeData.map(d => d.value));

  if (type === 'bar') {
    return (
      <div className="w-full" style={{ height }}>
        <div className="flex items-end justify-center h-full gap-4 px-4">
          {safeData.map((item, index) => {
            const barHeight = (item.value / maxValue) * (height - 40);
            const color = item.color || `hsl(${(index * 60) % 360}, 70%, 50%)`;

            return (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs font-medium mb-1">
                  {item.value.toLocaleString('pt-BR')}
                </div>
                <div
                  className="w-12 transition-all duration-500 ease-out"
                  style={{
                    height: barHeight,
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0'
                  }}
                />
                {showLabels && (
                  <div className="text-xs text-gray-600 mt-2 text-center w-16">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    const points = safeData.map((item, index) => {
      const x = (index / (safeData.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 80;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="w-full" style={{ height }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="overflow-visible">
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            points={points}
            className="drop-shadow-sm"
          />
          {safeData.map((item, index) => {
            const x = (index / (safeData.length - 1)) * 100;
            const y = 100 - (item.value / maxValue) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#3B82F6"
                className="drop-shadow-sm"
              />
            );
          })}
        </svg>
        {showLabels && (
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            {safeData.map((item, index) => (
              <span key={index}>{item.label}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (type === 'doughnut') {
    const total = safeData.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    const radius = 40;
    const center = 50;

    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="relative">
          <svg width="120" height="120" viewBox="0 0 100 100">
            {safeData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = (cumulativePercentage / 100) * 360 - 90;
              const endAngle = startAngle + angle;

              const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
              const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
              const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
              const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);

              const largeArc = angle > 180 ? 1 : 0;
              const color = item.color || `hsl(${(index * 60) % 360}, 70%, 50%)`;

              const pathData = [
                `M ${center} ${center}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              cumulativePercentage += percentage;

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={color}
                  className="drop-shadow-sm"
                />
              );
            })}
            <circle
              cx={center}
              cy={center}
              r="20"
              fill="white"
              className="drop-shadow-sm"
            />
          </svg>

          {showLabels && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold">{total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          )}
        </div>

        {showLabels && (
          <div className="ml-4 space-y-2">
            {safeData.map((item, index) => {
              const color = item.color || `hsl(${(index * 60) % 360}, 70%, 50%)`;
              const percentage = ((item.value / total) * 100).toFixed(1);

              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-gray-700">{item.label}</span>
                  <span className="text-gray-500">({percentage}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default SimpleChart;
