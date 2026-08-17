import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardItem, OverviewKPIs, ServiceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Layers, Plus, LayoutGrid, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

export const DashboardsPage: React.FC = () => {
  const navigate = useNavigate();
  const { timeRange, refreshKey } = useTimeRange();

  const [dashboards, setDashboards] = useState<DashboardItem[]>([]);
  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, kpiRes, svcRes] = await Promise.all([
        api.getDashboards(),
        api.getOverviewKPIs(timeRange),
        api.getServices(timeRange),
      ]);
      setDashboards(dashRes);
      setKpis(kpiRes);
      setServices(svcRes);
    } catch (e) {
      console.error('Failed to load dashboards', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange, refreshKey]);

  const handleCreateDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.createDashboard({
        title: newTitle.trim(),
        description: newDesc.trim(),
        is_default: false,
        tags: ['custom', 'sre'],
        layout_config: [],
      });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      fetchData();
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
            <h2 className="text-2xl font-bold tracking-tight text-white">Operational Dashboards</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Custom Views
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Curated executive and operational views for incident triage and reliability reviews.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-brand transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Dashboard</span>
        </button>
      </div>

      {/* Dashboard List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dashboards.map((d) => (
          <div
            key={d.id}
            className="glass-panel p-5 border-brand-500/40 bg-gradient-to-b from-slate-900/90 to-background-card flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-950 text-brand-300 border border-brand-800 uppercase">
                  {d.is_default ? 'System Default' : 'Custom'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {new Date(d.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{d.title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{d.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <div className="flex gap-1.5">
                {d.tags?.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.2 bg-slate-900 text-slate-400 rounded">
                    #{t}
                  </span>
                ))}
              </div>
              <span className="text-xs text-brand-400 font-semibold flex items-center gap-1">
                <span>Active</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview of Default Production Overview */}
      <div className="pt-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-400" />
          <span>ShopCloud Production Overview (Live Preview)</span>
        </h3>

        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="System Availability"
              value={`${kpis.availability.toFixed(2)}%`}
              target="99.90%"
              status="healthy"
              sparklineData={kpis.sparklines.availability}
            />
            <MetricCard
              title="SLO Compliance"
              value={`${kpis.slo_compliance_percent.toFixed(1)}%`}
              status="healthy"
              sparklineData={[99.5, 99.2, 99.0, kpis.slo_compliance_percent]}
            />
            <MetricCard
              title="Error Budget"
              value={`${kpis.error_budget_remaining_percent.toFixed(1)}%`}
              status="healthy"
              sparklineData={[80, 75, 70, kpis.error_budget_remaining_percent]}
            />
            <MetricCard
              title="Active Incidents"
              value={kpis.active_incidents_count}
              status={kpis.active_incidents_count === 0 ? 'healthy' : 'critical'}
              sparklineData={[0, 0, 1, kpis.active_incidents_count]}
            />
          </div>
        )}
      </div>

      {/* Create Dashboard Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Operational Dashboard"
        subtitle="Build custom telemetry grid layouts"
      >
        <form onSubmit={handleCreateDashboard} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Dashboard Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Checkout & Billing Executive Health"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description</label>
            <textarea
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Purpose and audience for this dashboard..."
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
              Create Dashboard
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
