import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MonitorItem, ServiceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { Modal } from '../components/common/Modal';
import { Radio, Plus, Trash2, Power, Bell, Clock, Search } from 'lucide-react';

export const MonitorsPage: React.FC = () => {
  const { refreshKey } = useTimeRange();
  const [monitors, setMonitors] = useState<MonitorItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [metricType, setMetricType] = useState('availability');
  const [condition, setCondition] = useState('lt');
  const [warningThreshold, setWarningThreshold] = useState(99.92);
  const [criticalThreshold, setCriticalThreshold] = useState(99.50);
  const [evalWindow, setEvalWindow] = useState(5);
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('warning');
  const [channels, setChannels] = useState('#sre-oncall, pagerduty');
  const [description, setDescription] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [monRes, svcRes] = await Promise.all([
        api.getMonitors(),
        api.getServices(),
      ]);
      setMonitors(monRes);
      setServices(svcRes);
      if (svcRes.length > 0 && !serviceId) {
        setServiceId(svcRes[0].id);
      }
    } catch (e) {
      console.error('Failed to load monitors', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleToggleMonitor = async (mon: MonitorItem) => {
    try {
      await api.updateMonitor(mon.id, { is_enabled: !mon.is_enabled });
      fetchData();
    } catch (e) {
      console.error('Failed to toggle monitor', e);
    }
  };

  const handleDeleteMonitor = async (id: string) => {
    if (!confirm('Are you sure you want to delete this monitor?')) return;
    try {
      await api.deleteMonitor(id);
      fetchData();
    } catch (e) {
      console.error('Failed to delete monitor', e);
    }
  };

  const handleCreateMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serviceId) return;

    try {
      await api.createMonitor({
        name: name.trim(),
        service_id: serviceId,
        metric_type: metricType,
        condition,
        warning_threshold: Number(warningThreshold),
        critical_threshold: Number(criticalThreshold),
        evaluation_window_minutes: Number(evalWindow),
        severity,
        is_enabled: true,
        notification_channel: channels.trim(),
        description: description.trim(),
      });
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      fetchData();
    } catch (e) {
      console.error('Failed to create monitor', e);
    }
  };

  const filteredMonitors = monitors.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.service_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Monitors</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Rule Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configurable alert rules continuously evaluating telemetry thresholds and routing pager events.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-brand transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Monitor</span>
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
            placeholder="Search monitors by name or service..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Monitors Table */}
      <GlassPanel>
        {isLoading && monitors.length === 0 ? (
          <SkeletonTable rows={5} />
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Monitor Name</th>
                  <th className="table-header">Service</th>
                  <th className="table-header">Condition & Thresholds</th>
                  <th className="table-header">Window</th>
                  <th className="table-header">Routing Channel</th>
                  <th className="table-header">Current Value</th>
                  <th className="table-header">Status</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredMonitors.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="table-cell font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-brand-400" />
                        <span>{m.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block pl-6 max-w-xs truncate">
                        {m.description}
                      </span>
                    </td>
                    <td className="table-cell font-medium text-slate-200">
                      {m.service_name || m.service_id}
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-300">
                      <div>
                        {m.metric_type} {m.condition} {m.warning_threshold} (Warn)
                      </div>
                      <div className="text-rose-400 font-bold">
                        {m.metric_type} {m.condition} {m.critical_threshold} (Crit)
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-400">
                      {m.evaluation_window_minutes} mins
                    </td>
                    <td className="table-cell text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.notification_channel}</span>
                      </div>
                    </td>
                    <td className="table-cell font-mono font-bold text-white">
                      {m.current_value !== undefined ? m.current_value.toFixed(2) : '-'}
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={m.status} size="sm" />
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleMonitor(m)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            m.is_enabled
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60'
                              : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'
                          }`}
                          title={m.is_enabled ? 'Disable Monitor' : 'Enable Monitor'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMonitor(m.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Monitor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {/* Create Monitor Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Telemetry Monitor Rule"
        subtitle="Set up automated rule conditions and notification escalations"
      >
        <form onSubmit={handleCreateMonitor} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Monitor Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Order Service Latency Spike Alert"
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
                <option value="latency_p95">Latency P95 (ms)</option>
                <option value="error_rate">Error Rate (%)</option>
                <option value="cpu_percent">CPU Usage (%)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value="lt">Less Than (&lt;)</option>
                <option value="gt">Greater Than (&gt;)</option>
                <option value="lte">Less Than or Equal (&le;)</option>
                <option value="gte">Greater Than or Equal (&ge;)</option>
              </select>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Evaluation Window</label>
              <select
                value={evalWindow}
                onChange={(e) => setEvalWindow(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value={1}>1 Minute</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value="critical">Critical (Page On-Call)</option>
                <option value="warning">Warning (Team Alert)</option>
                <option value="info">Info (Log Only)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Notification Routing Channels</label>
            <input
              type="text"
              value={channels}
              onChange={(e) => setChannels(e.target.value)}
              placeholder="e.g. #sre-alerts, PagerDuty P1"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of failure scenarios..."
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
              Save Monitor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
