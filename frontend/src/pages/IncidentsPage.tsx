import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { IncidentItem, ServiceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { Modal } from '../components/common/Modal';
import { Flame, Plus, Clock, AlertOctagon, CheckCircle2, User, Search } from 'lucide-react';

export const IncidentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshKey } = useTimeRange();

  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('high');
  const [primaryServiceId, setPrimaryServiceId] = useState('');
  const [summary, setSummary] = useState('');
  const [impact, setImpact] = useState('');
  const [leadSre, setLeadSre] = useState('Sarah Chen (Lead SRE)');

  const fetchIncidents = async () => {
    setIsLoading(true);
    try {
      const [incRes, svcRes] = await Promise.all([
        api.getIncidents({ status: statusFilter !== 'all' ? statusFilter : undefined }),
        api.getServices(),
      ]);
      setIncidents(incRes);
      setServices(svcRes);
      if (svcRes.length > 0 && !primaryServiceId) {
        setPrimaryServiceId(svcRes[0].id);
      }
    } catch (e) {
      console.error('Failed to load incidents', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, refreshKey]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.createIncident({
        title: title.trim(),
        severity,
        primary_service_id: primaryServiceId,
        affected_services: [primaryServiceId],
        summary: summary.trim(),
        impact: impact.trim(),
        lead_sre: leadSre.trim(),
      });
      setIsCreateModalOpen(false);
      setTitle('');
      setSummary('');
      setImpact('');
      fetchIncidents();
    } catch (e) {
      console.error('Failed to create incident', e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Incident Management</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800">
              SRE Incident Response
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Declare, triage, investigate, and document cloud outages and degradation postmortems.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-glow-critical transition-all flex items-center gap-1.5"
        >
          <Flame className="w-4 h-4" />
          <span>Declare Incident</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-panel p-4 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Status:</span>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            {(['all', 'active', 'resolved'] as const).map((st) => (
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

        <div className="text-slate-400 font-mono">
          Total: <strong>{incidents.length}</strong> incidents
        </div>
      </div>

      {/* Incidents Table */}
      <GlassPanel>
        {isLoading && incidents.length === 0 ? (
          <SkeletonTable rows={4} />
        ) : incidents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <span>No incidents found for this filter.</span>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Incident ID & Title</th>
                  <th className="table-header">Severity</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Primary Service</th>
                  <th className="table-header">Lead SRE</th>
                  <th className="table-header">Started At</th>
                  <th className="table-header">Duration</th>
                  <th className="table-header text-right">Firing Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="table-cell font-semibold text-white group-hover:text-brand-300">
                      <div className="flex items-center gap-2">
                        <Flame className={`w-4 h-4 ${inc.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`} />
                        <span>{inc.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block pl-6">{inc.id}</span>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={inc.severity} size="sm" />
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${
                          inc.status === 'active' || inc.status === 'investigating'
                            ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse'
                            : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        }`}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-slate-300">
                      {inc.primary_service_id || 'Multiple'}
                    </td>
                    <td className="table-cell text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inc.lead_sre}</span>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-400">
                      {new Date(inc.started_at).toLocaleTimeString()}
                    </td>
                    <td className="table-cell font-mono text-xs text-slate-300">
                      {inc.duration_minutes} mins
                    </td>
                    <td className="table-cell text-right">
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800">
                        {inc.alerts_count || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {/* Declare Incident Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Declare New SRE Incident"
        subtitle="Initialize an active triage ticket with incident commander"
      >
        <form onSubmit={handleCreateIncident} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Incident Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Major Outage on Payment Service Ingress"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value="critical">Critical (P1 Outage)</option>
                <option value="high">High (P2 Degradation)</option>
                <option value="medium">Medium (P3 Partial)</option>
                <option value="low">Low (P4 Minor)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Primary Impacted Service</label>
              <select
                value={primaryServiceId}
                onChange={(e) => setPrimaryServiceId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Customer / System Impact</label>
            <input
              type="text"
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="e.g. 1,200 checkout failures over 15 minutes, 0.4% error rate"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Executive Summary</label>
            <textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Initial findings, customer symptoms, and immediate mitigation attempts..."
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
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-glow-critical"
            >
              Declare Incident
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
