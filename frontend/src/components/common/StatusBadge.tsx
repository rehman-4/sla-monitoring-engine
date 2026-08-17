import React from 'react';
import { CheckCircle, AlertTriangle, AlertOctagon, Info, MinusCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const norm = (status || '').toLowerCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let IconComponent = Info;
  let label = status;

  if (norm === 'healthy' || norm === 'pass' || norm === 'compliant' || norm === 'ok' || norm === 'resolved') {
    colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    IconComponent = CheckCircle;
  } else if (norm === 'warning' || norm === 'at risk' || norm === 'warn' || norm === 'medium' || norm === 'high') {
    colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-700/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
    IconComponent = AlertTriangle;
  } else if (norm === 'critical' || norm === 'breached' || norm === 'fail' || norm === 'active' || norm === 'error') {
    colorClasses = 'bg-rose-950/80 text-rose-400 border-rose-700/60 shadow-[0_0_12px_rgba(239,68,68,0.25)] animate-pulse-subtle';
    IconComponent = AlertOctagon;
  } else if (norm === 'disabled' || norm === 'inactive') {
    colorClasses = 'bg-slate-900 text-slate-400 border-slate-800';
    IconComponent = MinusCircle;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2 font-semibold',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full font-medium border uppercase tracking-wider ${colorClasses} ${sizeClasses}`}>
      {showIcon && <IconComponent className={iconSizes} />}
      <span>{label}</span>
    </span>
  );
};
