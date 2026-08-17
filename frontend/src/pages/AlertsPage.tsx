import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AlertItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { AlertTriangle, CheckCircle, ShieldAlert, ArrowRight, Check, XCircle } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshKey } = useTimeRange();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAlerts({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
      });
      setAlerts(data);
    } catch (e) {
      console.error('Failed to load alerts', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter, severityFilter, refreshKey]);

  const handleAcknowledge = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.acknowledgeAlert(id);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.resolveAlert(id);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Alerts</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Active Triage
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time alerting console with acknowledge and automated resolution lifecycle.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Status:</span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              {['all', 'open', 'acknowledged', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all font-medium ${
                    statusFilter === st ? 'bg-brand-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        <div className="text-slate-400 font-mono">
          Showing <strong>{alerts.length}</strong> alerts
        </div>
      </div>

      {/* Alerts Table */}
      <GlassPanel>
        {isLoading && alerts.length === 0 ? (
          <SkeletonTable rows={5} />
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <span>No alerts match your filter criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Alert Title</th>
                  <th className="table-header">Service</th>
                  <th className="table-header">Severity</th>
                  <th className="table-header">Metric & Breach</th>
                  <th className="table-header">Started At</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {alerts.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navigate(`/alerts/${a.id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="table-cell font-semibold text-white group-hover:text-brand-300">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${a.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`} />
                        <span>{a.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block pl-6">{a.id}</span>
                    </td>
                    <td className="table-cell font-medium text-slate-200">
                      {a.service_name || a.service_id}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={a.severity} size="sm" />
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-300">
                      <span>Val: <strong className="text-white">{a.current_value}</strong></span>{' '}
                      <span className="text-slate-500">(Limit: {a.threshold_value})</span>
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-400">
                      {new Date(a.started_at).toLocaleTimeString()} ({a.duration_minutes}m ago)
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${
                          a.status === 'open'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : a.status === 'acknowledged'
                            ? 'bg-amber-950 text-amber-300 border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === 'open' && (
                          <button
                            onClick={(e) => handleAcknowledge(a.id, e)}
                            className="px-2.5 py-1 bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/80 rounded-lg text-xs font-semibold"
                          >
                            Ack
                          </button>
                        )}
                        {a.status !== 'resolved' && (
                          <button
                            onClick={(e) => handleResolve(a.id, e)}
                            className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80 rounded-lg text-xs font-semibold"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
