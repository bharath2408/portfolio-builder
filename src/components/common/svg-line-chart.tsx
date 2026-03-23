"use client";

interface DataPoint {
  label: string;
  value: number;
}

interface SvgLineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
}

export function SvgLineChart({ data, height = 200, color = "hsl(var(--primary))" }: SvgLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border/50 bg-card" style={{ height }}>
        <p className="text-[12px] text-muted-foreground/50">No data yet</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - (d.value / maxValue) * chartHeight,
    ...d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const lastPoint = points[points.length - 1]!;
  const firstPoint = points[0]!;
  const areaD = `${pathD} L ${lastPoint.x} ${padding.top + chartHeight} L ${firstPoint.x} ${padding.top + chartHeight} Z`;

  const yTicks = Array.from({ length: 4 }, (_, i) => {
    const value = Math.round((maxValue / 3) * i);
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return { value, y };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      {yTicks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y}
            stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="4 4" opacity={0.5}
          />
          <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" fontSize={10} fill="hsl(var(--muted-foreground))" opacity={0.5}>
            {tick.value}
          </text>
        </g>
      ))}
      <path d={areaD} fill={color} opacity={0.08} />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
      {points.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((p, i) => (
        <text key={i} x={p.x} y={height - 8} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))" opacity={0.5}>
          {p.label}
        </text>
      ))}
    </svg>
  );
}
