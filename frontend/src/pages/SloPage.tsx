import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SloItem, ServiceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { Modal } from '../components/common/Modal';
import { Target, Plus, Search, Trash2, Edit3, Flame, ExternalLink } from 'lucide-react';

export const SloPage: React.FC = () => {
  const { refreshKey } = useTimeRange();
  const [slos, setSlos] = useState<SloItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Create SLO form fields
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [metricType, setMetricType] = useState('availability');
  const [targetPercentage, setTargetPercentage] = useState(99.90);
  const [targetValue, setTargetValue] = useState<number | undefined>(200);
  const [timeWindowDays, setTimeWindowDays] = useState(30);
  const [warningThreshold, setWarningThreshold] = useState(99.92);
  const [criticalThreshold, setCriticalThreshold] = useState(99.90);
  const [description, setDescription] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [sloData, svcData] = await Promise.all([
        api.getSlos(),
        api.getServices(),
      ]);
      setSlos(sloData);
      setServices(svcData);
      if (svcData.length > 0 && !serviceId) {
        setServiceId(svcData[0].id);
      }
    } catch (e) {
      console.error('Failed to load SLOs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleCreateSlo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serviceId) return;

    try {
      await api.createSlo({
        name: name.trim(),
        service_id: serviceId,
        metric_type: metricType,
        target_percentage: Number(targetPercentage),
        target_value: targetValue ? Number(targetValue) : undefined,
        time_window_days: Number(timeWindowDays),
        warning_threshold: Number(warningThreshold),
        critical_threshold: Number(criticalThreshold),
        description: description.trim(),
        is_active: true,
      });

      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      fetchData();
    } catch (e) {
      console.error('Failed to create SLO', e);
    }
  };

  const handleDeleteSlo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this SLO?')) return;
    try {
      await api.deleteSlo(id);
      fetchData();
    } catch (e) {
      console.error('Failed to delete SLO', e);
    }
  };

  const filteredSlos = slos.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.service_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">SLO Management</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Service Level Objectives
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target reliability commitments defined across 30-day rolling evaluation windows.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-brand transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create New SLO</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-panel p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SLOs by name or service..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* SLOs Table */}
      <GlassPanel>
        {isLoading && slos.length === 0 ? (
          <SkeletonTable rows={6} />
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">SLO Name</th>
                  <th className="table-header">Service</th>
                  <th className="table-header">Metric Type</th>
                  <th className="table-header">Target</th>
                  <th className="table-header">Current SLI</th>
                  <th className="table-header">Rolling Compliance</th>
                  <th className="table-header">Error Budget Remaining</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSlos.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="table-cell font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-400" />
                        <span>{s.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block pl-6 max-w-xs truncate">
                        {s.description}
                      </span>
                    </td>
                    <td className="table-cell font-medium text-slate-200">
                      {s.service_name || s.service_id}
                    </td>
                    <td className="table-cell">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-900 text-slate-300 border border-slate-800">
                        {s.metric_type}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-slate-200">
                      {s.target_percentage}% {s.target_value ? `(≤ ${s.target_value}ms)` : ''}
                    </td>
                    <td className="table-cell font-mono font-bold text-white">
                      {s.current_value_formatted}
                    </td>
                    <td className="table-cell font-mono">
                      <span className={s.current_compliance >= 99.0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {s.current_compliance.toFixed(2)}%
                      </span>
                    </td>
                    <td className="table-cell font-mono text-xs">
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden my-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            s.error_budget_remaining_percent < 30
                              ? 'bg-rose-500'
                              : s.error_budget_remaining_percent < 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${s.error_budget_remaining_percent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {s.error_budget_remaining_percent.toFixed(1)}% remaining
                      </span>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="table-cell text-right">
                      <button
                        onClick={(e) => handleDeleteSlo(s.id, e)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete SLO"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {/* Create SLO Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Service Level Objective (SLO)"
        subtitle="Define reliability target, rolling window, and alerting thresholds"
      >
        <form onSubmit={handleCreateSlo} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">SLO Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Payment Service 99.95% Availability"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Service</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Metric Type</label>
              <select
                value={metricType}
                onChange={(e) => setMetricType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value="availability">Availability (%)</option>
                <option value="latency_p95">P95 Latency (ms)</option>
                <option value="error_rate">Error Rate (%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target %</label>
              <input
                type="number"
                step="0.01"
                required
                value={targetPercentage}
                onChange={(e) => setTargetPercentage(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Warning Threshold</label>
              <input
                type="number"
                step="0.01"
                required
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Critical Threshold</label>
              <input
                type="number"
                step="0.01"
                required
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description & Business Justification</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the user impact and motivation for this SLO..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold shadow-glow-brand"
            >
              Save & Persist SLO
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
