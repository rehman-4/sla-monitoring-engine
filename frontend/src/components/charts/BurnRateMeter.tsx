import React from 'react';
import { Flame, AlertTriangle, CheckCircle } from 'lucide-react';

interface BurnRateMeterProps {
  burn1h: number;
  burn6h: number;
  burn24h: number;
  targetMax?: number;
}

export const BurnRateMeter: React.FC<BurnRateMeterProps> = ({
  burn1h = 0.8,
  burn6h = 1.1,
  burn24h = 0.9,
  targetMax = 1.0,
}) => {
  const windows = [
    { label: '1-Hour Burn Rate', val: burn1h, limit: 14.4, desc: 'P1 Incident limit (>14.4x consumes 2% in 1h)' },
    { label: '6-Hour Burn Rate', val: burn6h, limit: 6.0, desc: 'P2 Alert limit (>6x consumes 5% in 6h)' },
    { label: '24-Hour Burn Rate', val: burn24h, limit: 1.0, desc: 'Nominal 1x budget consumption rate' },
  ];

  return (
    <div className="space-y-4">
      {windows.map((w, i) => {
        const isCritical = w.val >= w.limit;
        const isWarning = w.val >= w.limit * 0.7 && !isCritical;
        const barPct = Math.min(100, (w.val / (w.limit * 1.5)) * 100);

        let barColor = 'bg-emerald-500';
        let badgeColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
        if (isCritical) {
          barColor = 'bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';
          badgeColor = 'text-rose-400 bg-rose-950/80 border-rose-800/80 animate-pulse-subtle';
        } else if (isWarning) {
          barColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
          badgeColor = 'text-amber-400 bg-amber-950/80 border-amber-800/80';
        }

        return (
          <div key={i} className="bg-slate-900/60 border border-border/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Flame className={`w-4 h-4 ${isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold text-slate-200">{w.label}</span>
              </div>
              <div className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${badgeColor}`}>
                {w.val.toFixed(2)}x
              </div>
            </div>

            {/* Progress track */}
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden my-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.max(4, barPct)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
              <span>{w.desc}</span>
              <span className="font-mono">Threshold: {w.limit}x</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
