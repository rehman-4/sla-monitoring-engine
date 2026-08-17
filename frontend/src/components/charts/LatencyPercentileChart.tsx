import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

interface LatencyPercentileChartProps {
  data: Array<{
    timestamp: string;
    p50_latency: number;
    p95_latency: number;
    p99_latency: number;
  }>;
  sloThreshold?: number;
  height?: number;
}

export const LatencyPercentileChart: React.FC<LatencyPercentileChartProps> = ({
  data,
  sloThreshold = 200,
  height = 260,
}) => {
  const formattedData = data.map((d) => {
    const date = new Date(d.timestamp);
    const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    return {
      ...d,
      displayTime: timeStr,
    };
  });

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="displayTime"
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
          />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#1e293b' }}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              borderColor: '#334155',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            }}
            formatter={(value: any, name: any) => [`${value} ms`, name]}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
          />
          {sloThreshold && (
            <ReferenceLine
              y={sloThreshold}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: `SLO Limit (${sloThreshold}ms)`,
                fill: '#f87171',
                fontSize: 10,
                position: 'insideTopLeft',
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="p50_latency"
            name="P50 Latency"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="p95_latency"
            name="P95 Latency"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="p99_latency"
            name="P99 Latency"
            stroke="#ec4899"
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
