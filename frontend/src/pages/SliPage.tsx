import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SliItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { Compass, CheckCircle, XCircle, Search, Filter } from 'lucide-react';

export const SliPage: React.FC = () => {
  const { timeRange, refreshKey } = useTimeRange();
  const [slis, setSlis] = useState<SliItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [metricFilter, setMetricFilter] = useState<string>('all');

  useEffect(() => {
    const fetchSlis = async () => {
      setIsLoading(true);
      try {
        const data = await api.getSlis(timeRange);
        setSlis(data);
      } catch (e) {
        console.error('Failed to load SLIs', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlis();
  }, [timeRange, refreshKey]);

  const filteredSlis = slis.filter((s) =>
    s.service_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Service Level Indicators (SLIs)</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
            SLI Monitor
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Direct quantitative measures of the service quality provided to users over the selected evaluation window.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by service name..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">View Metric:</span>
          <select
            value={metricFilter}
            onChange={(e) => setMetricFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All SLIs (Availability, Latency, Error Rate)</option>
            <option value="availability">Availability Only</option>
            <option value="latency">Latency Only</option>
            <option value="error_rate">Error Rate Only</option>
          </select>
        </div>
      </div>

      {/* SLIs Table */}
      <GlassPanel>
        {isLoading && slis.length === 0 ? (
          <SkeletonTable rows={8} />
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Service</th>
                  {(metricFilter === 'all' || metricFilter === 'availability') && (
                    <th className="table-header">Availability SLI (≥ 99.90%)</th>
                  )}
                  {(metricFilter === 'all' || metricFilter === 'latency') && (
                    <th className="table-header">Latency P95 SLI (≤ 200ms)</th>
                  )}
                  {(metricFilter === 'all' || metricFilter === 'error_rate') && (
                    <th className="table-header">Error Rate SLI (≤ 0.10%)</th>
                  )}
                  <th className="table-header">Throughput</th>
                  <th className="table-header text-right">Aggregate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSlis.map((item) => {
                  const allPass =
                    item.availability.status === 'PASS' &&
                    item.latency.status === 'PASS' &&
                    item.error_rate.status === 'PASS';

                  return (
                    <tr key={item.service_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="table-cell font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-indigo-400" />
                          <span>{item.service_name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block pl-6">
                          {item.service_id}
                        </span>
                      </td>

                      {/* Availability SLI */}
                      {(metricFilter === 'all' || metricFilter === 'availability') && (
                        <td className="table-cell">
                          <div className="flex items-center gap-2 font-mono">
                            <span className={item.availability.status === 'PASS' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                              {item.availability.current.toFixed(2)}%
                            </span>
                            <span className="text-slate-500 text-[11px]">(Target: {item.availability.target}%)</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${item.availability.status === 'PASS' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                              {item.availability.status}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Latency SLI */}
                      {(metricFilter === 'all' || metricFilter === 'latency') && (
                        <td className="table-cell">
                          <div className="flex items-center gap-2 font-mono">
                            <span className={item.latency.status === 'PASS' ? 'text-slate-200 font-medium' : 'text-amber-400 font-bold'}>
                              {item.latency.current.toFixed(1)} ms
                            </span>
                            <span className="text-slate-500 text-[11px]">(Target: ≤{item.latency.target}ms)</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${item.latency.status === 'PASS' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                              {item.latency.status}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Error Rate SLI */}
                      {(metricFilter === 'all' || metricFilter === 'error_rate') && (
                        <td className="table-cell">
                          <div className="flex items-center gap-2 font-mono">
                            <span className={item.error_rate.status === 'PASS' ? 'text-slate-200 font-medium' : 'text-rose-400 font-bold'}>
                              {item.error_rate.current.toFixed(3)}%
                            </span>
                            <span className="text-slate-500 text-[11px]">(Target: ≤{item.error_rate.target}%)</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${item.error_rate.status === 'PASS' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                              {item.error_rate.status}
                            </span>
                          </div>
                        </td>
                      )}

                      <td className="table-cell font-mono text-slate-300">
                        {item.requests_per_sec.toFixed(0)} rps
                      </td>

                      <td className="table-cell text-right">
                        {allPass ? (
                          <span className="badge badge-healthy">ALL PASS</span>
                        ) : (
                          <span className="badge badge-warning">DEGRADED</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
