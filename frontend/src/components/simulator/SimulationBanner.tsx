import React, { useState } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Play, Flame, RefreshCw, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const SimulationBanner: React.FC = () => {
  const {
    simulationMode,
    isLoading,
    activeToast,
    triggerDegraded,
    triggerCritical,
    triggerReset,
    dismissToast,
  } = useSimulation();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="mb-6 space-y-3">
      {/* Active simulation alert banner */}
      {activeToast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium shadow-lg transition-all animate-fadeIn ${
            simulationMode === 'critical_incident'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800 shadow-glow-critical'
              : simulationMode === 'incident'
              ? 'bg-amber-950/90 text-amber-200 border-amber-800 shadow-glow-warning'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800 shadow-glow-healthy'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {simulationMode === 'critical_incident' && <Flame className="w-4 h-4 text-rose-400 flex-shrink-0 animate-bounce" />}
            {simulationMode === 'incident' && <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />}
            {simulationMode === 'normal' && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
            <span>{activeToast}</span>
          </div>
          <button
            onClick={dismissToast}
            className="p-1 rounded hover:bg-black/30 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Interactive Demo Simulator Bar */}
      <div className="glass-panel p-4 border-brand-500/30 bg-gradient-to-r from-background-card via-slate-900/90 to-background-secondary flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/30 text-brand-400">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Interactive SRE Scenario Simulator
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  simulationMode === 'critical_incident'
                    ? 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse-subtle'
                    : simulationMode === 'incident'
                    ? 'bg-amber-950 text-amber-400 border-amber-800'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                }`}
              >
                Current State: {simulationMode.replace('_', ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject real telemetry faults to demonstrate automated SLO breaches, SLA alerts, and incident triage.
            </p>
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            disabled={isLoading}
            onClick={triggerDegraded}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              simulationMode === 'incident'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-glow-warning font-bold'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Simulate Incident (Warning)</span>
          </button>

          <button
            disabled={isLoading}
            onClick={triggerCritical}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              simulationMode === 'critical_incident'
                ? 'bg-rose-600 text-white border-rose-500 shadow-glow-critical font-bold animate-pulse-subtle'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Simulate Critical Incident (P1 Outage)</span>
          </button>

          <button
            disabled={isLoading}
            onClick={triggerReset}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
              simulationMode === 'normal'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700 hover:bg-emerald-900/60'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Restore / Recover</span>
          </button>
        </div>
      </div>
    </div>
  );
};
