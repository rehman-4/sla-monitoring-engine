import React from 'react';

interface ErrorBudgetGaugeProps {
  remainingPercent: number; // e.g. 68.5%
  allowedBudget: number;    // e.g. 0.10%
  consumedBudget: number;   // e.g. 0.032%
  size?: number;
}

export const ErrorBudgetGauge: React.FC<ErrorBudgetGaugeProps> = ({
  remainingPercent = 68.0,
  allowedBudget = 0.10,
  consumedBudget = 0.032,
  size = 200,
}) => {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc calculation for gauge (240 degree gauge)
  const arcLength = circumference * 0.75;
  const offset = arcLength - (remainingPercent / 100) * arcLength;

  let gaugeColor = '#10b981'; // Emerald (Healthy)
  let statusText = 'HEALTHY';
  let glowColor = 'rgba(16, 185, 129, 0.4)';

  if (remainingPercent < 30) {
    gaugeColor = '#ef4444'; // Red (Critical)
    statusText = 'CRITICAL';
    glowColor = 'rgba(239, 68, 68, 0.4)';
  } else if (remainingPercent < 60) {
    gaugeColor = '#f59e0b'; // Amber (Warning)
    statusText = 'WARNING';
    glowColor = 'rgba(245, 158, 11, 0.4)';
  }

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div style={{ width: size, height: size * 0.85 }} className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-135"
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.4s ease',
              filter: `drop-shadow(0 0 8px ${glowColor})`,
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
            {remainingPercent.toFixed(1)}%
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 mt-0.5">
            Budget Remaining
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 uppercase tracking-widest border"
            style={{
              color: gaugeColor,
              borderColor: `${gaugeColor}66`,
              backgroundColor: `${gaugeColor}1a`,
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Allowed vs Consumed Stats */}
      <div className="grid grid-cols-2 gap-4 w-full mt-3 pt-3 border-t border-border/60 text-center">
        <div>
          <div className="text-[11px] text-slate-400">Allowed Budget</div>
          <div className="text-sm font-mono font-bold text-slate-200">{allowedBudget.toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-400">Consumed</div>
          <div className="text-sm font-mono font-bold text-slate-200">{consumedBudget.toFixed(3)}%</div>
        </div>
      </div>
    </div>
  );
};
