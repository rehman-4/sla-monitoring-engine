import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ServiceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { Modal } from '../components/common/Modal';
import {
  Server,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Shield,
  Layers,
  Activity
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { timeRange, refreshKey } = useTimeRange();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating service
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceTier, setNewServiceTier] = useState('tier-2');
  const [newServiceTeam, setNewServiceTeam] = useState('Core Platform');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const data = await api.getServices(timeRange);
      setServices(data);
    } catch (e) {
      console.error('Failed to load services', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [timeRange, refreshKey]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    try {
      await api.createService({
        name: newServiceName.trim(),
        tier: newServiceTier as any,
        owner_team: newServiceTeam.trim(),
        description: newServiceDesc.trim(),
      });
      setIsCreateModalOpen(false);
      setNewServiceName('');
      setNewServiceDesc('');
      fetchServices();
    } catch (e) {
      console.error('Failed to create service', e);
    }
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.owner_team.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier = tierFilter === 'all' || s.tier === tierFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesTier && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Services</h2>
          <p className="text-xs text-slate-400 mt-1">
            Catalog of monitored cloud microservices, performance telemetry, and health indicators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/service-map')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Dependency Map</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-brand transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register Service</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by service name, owner team, or description..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Tier Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Tiers</option>
              <option value="tier-1">Tier 1 (Critical)</option>
              <option value="tier-2">Tier 2</option>
              <option value="tier-3">Tier 3</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="healthy">Healthy</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <GlassPanel>
        {isLoading && services.length === 0 ? (
          <SkeletonTable rows={8} />
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Service Name</th>
                  <th className="table-header">Tier</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Availability</th>
                  <th className="table-header">Throughput (RPS)</th>
                  <th className="table-header">Error Rate</th>
                  <th className="table-header">P95 Latency</th>
                  <th className="table-header">Error Budget</th>
                  <th className="table-header text-right">Active Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredServices.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/services/${s.id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="table-cell font-semibold text-white group-hover:text-brand-300">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-slate-400 group-hover:text-brand-400" />
                        <span>{s.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block pl-6">
                        {s.owner_team} • {s.environment}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 uppercase">
                        {s.tier}
                      </span>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                    <td className="table-cell font-mono">
                      <span className={s.availability < 99.9 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                        {s.availability?.toFixed(2)}%
                      </span>
                    </td>
                    <td className="table-cell font-mono text-slate-300">
                      {s.requests_per_sec?.toFixed(0)} <span className="text-[10px] text-slate-500">rps</span>
                    </td>
                    <td className="table-cell font-mono">
                      <span className={s.error_rate > 0.1 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {s.error_rate?.toFixed(3)}%
                      </span>
                    </td>
                    <td className="table-cell font-mono text-slate-300">
                      <span className={s.p95_latency > 200 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {s.p95_latency?.toFixed(1)} ms
                      </span>
                    </td>
                    <td className="table-cell font-mono text-xs">
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden my-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            s.error_budget_remaining < 40
                              ? 'bg-rose-500'
                              : s.error_budget_remaining < 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${s.error_budget_remaining || 80}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {s.error_budget_remaining?.toFixed(0)}% remaining
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      {s.active_alerts_count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">
                          {s.active_alerts_count} firing
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {/* Register Service Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Register New Cloud Microservice"
        subtitle="Add a service into ShopCloud topology monitoring catalog"
      >
        <form onSubmit={handleCreateService} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Service Name</label>
            <input
              type="text"
              required
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="e.g. Recommendations Engine"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Tier</label>
              <select
                value={newServiceTier}
                onChange={(e) => setNewServiceTier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value="tier-1">Tier 1 (Critical Path)</option>
                <option value="tier-2">Tier 2 (High Priority)</option>
                <option value="tier-3">Tier 3 (Supporting)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Owner Team</label>
              <input
                type="text"
                value={newServiceTeam}
                onChange={(e) => setNewServiceTeam(e.target.value)}
                placeholder="e.g. Search & Recs"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              placeholder="Brief description of service function and upstream clients..."
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
              Register Service
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
