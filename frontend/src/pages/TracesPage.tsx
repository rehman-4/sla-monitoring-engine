import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TraceItem, ServiceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { TraceWaterfall } from '../components/traces/TraceWaterfall';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { GitCommit, Clock, CheckCircle, AlertCircle, Search, Info } from 'lucide-react';

export const TracesPage: React.FC = () => {
  const { refreshKey } = useTimeRange();
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [errorOnlyFilter, setErrorOnlyFilter] = useState<boolean>(false);

  const fetchTraces = async () => {
    setIsLoading(true);
    try {
      const [trcRes, svcRes] = await Promise.all([
        api.getTraces({
          service_id: serviceFilter !== 'all' ? serviceFilter : undefined,
          has_error: errorOnlyFilter ? true : undefined,
          limit: 25,
        }),
        api.getServices(),
      ]);
      setTraces(trcRes);
      setServices(svcRes);
      if (trcRes.length > 0 && !selectedTrace) {
        setSelectedTrace(trcRes[0]);
      }
    } catch (e) {
      console.error('Failed to load traces', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTraces();
  }, [serviceFilter, errorOnlyFilter, refreshKey]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Distributed Traces</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Trace Explorer
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end distributed transaction waterfalls across microservice RPC boundaries.
          </p>
        </div>
      </div>

      {/* Academic Disclaimer Notice */}
      <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-3 text-xs text-indigo-300 flex items-center gap-2.5">
        <Info className="w-4 h-4 flex-shrink-0 text-indigo-400" />
        <span>
          <strong>Note:</strong> Distributed traces and OpenTelemetry span hierarchies are realistically simulated for ShopCloud architecture.
        </span>
      </div>

      {/* Filter and Selection Header */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Root Ingress:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Ingress Services</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={errorOnlyFilter}
              onChange={(e) => setErrorOnlyFilter(e.target.checked)}
              className="rounded bg-slate-900 border-slate-800 text-brand-600 focus:ring-brand-500"
            />
            <span>Errors Only (5xx)</span>
          </label>
        </div>

        <span className="text-slate-400 font-mono">
          Showing <strong>{traces.length}</strong> traces
        </span>
      </div>

      {/* Main Grid: Trace List on Left, Waterfall on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trace List Selector */}
        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Recent Trace Executions
          </h3>

          {isLoading && traces.length === 0 ? (
            <SkeletonTable rows={4} />
          ) : traces.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No matching traces found.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {traces.map((t) => {
                const isSelected = selectedTrace?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTrace(t)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-800 border-brand-500 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-200">{t.id}</span>
                      {t.has_error ? (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800">
                          ERROR {t.http_status}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          200 OK
                        </span>
                      )}
                    </div>

                    <div className="font-semibold text-white truncate">{t.operation_name}</div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800 font-mono">
                      <span>{t.spans?.length || 0} spans</span>
                      <span>{t.total_duration_ms.toFixed(1)} ms</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Waterfall Canvas */}
        <div className="lg:col-span-2">
          {selectedTrace ? (
            <TraceWaterfall trace={selectedTrace} />
          ) : (
            <GlassPanel>
              <div className="p-12 text-center text-xs text-slate-400">
                Select a trace from the left panel to inspect the distributed span waterfall.
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
};
