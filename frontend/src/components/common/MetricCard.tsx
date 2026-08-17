import React from 'react';
import { Sparkline } from '../charts/Sparkline';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  target?: string;
  status?: 'healthy' | 'warning' | 'critical' | 'info';
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    isGood: boolean;
  };
  sparklineData?: number[];
  sparklineColor?: string;
  tooltipText?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  target,
  status = 'healthy',
  trend,
  sparklineData,
  sparklineColor,
  tooltipText,
  onClick,
}) => {
  const statusGlowBorder = {
    healthy: 'hover:border-emerald-500/50 hover:shadow-glow-healthy',
    warning: 'hover:border-amber-500/50 hover:shadow-glow-warning border-amber-900/40',
    critical: 'hover:border-rose-500/50 hover:shadow-glow-critical border-rose-900/50',
    info: 'hover:border-cyan-500/50 hover:shadow-glow-brand',
  }[status];

  const defaultColor = {
    healthy: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
    info: '#06b6d4',
  }[status];

  return (
    <div
      onClick={onClick}
      className={`glass-panel p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${statusGlowBorder}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {title}
          </span>
          {tooltipText && (
            <div className="relative group/tip cursor-help">
              <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 transition-colors" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tip:block bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg py-1 px-2.5 w-48 shadow-xl z-30 pointer-events-none text-center">
                {tooltipText}
              </div>
            </div>
          )}
        </div>

        {target && (
          <span className="text-[11px] font-mono font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            Target: <strong className="text-slate-200">{target}</strong>
          </span>
        )}
      </div>

      {/* Main Metric Value & Trend */}
      <div className="flex items-baseline justify-between mt-1 mb-2">
        <div className="text-3xl font-extrabold font-mono tracking-tight text-white flex items-baseline gap-1">
          {value}
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isGood
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                : 'bg-rose-950/60 text-rose-400 border border-rose-800/50'
            }`}
          >
            {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {/* Subtitle & Sparkline Footer */}
      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-4">
        {subtitle && (
          <p className="text-xs text-slate-400 truncate flex-1">{subtitle}</p>
        )}

        {sparklineData && sparklineData.length > 0 && (
          <div className="w-24 h-8 flex-shrink-0">
            <Sparkline
              data={sparklineData}
              color={sparklineColor || defaultColor}
              height={32}
            />
          </div>
        )}
      </div>
    </div>
  );
};
