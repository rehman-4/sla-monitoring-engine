import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SlaItem, ServiceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { Modal } from '../components/common/Modal';
import { FileCheck, Plus, Shield, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const SlaPage: React.FC = () => {
  const { refreshKey } = useTimeRange();
  const [slas, setSlas] = useState<SlaItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [customerTier, setCustomerTier] = useState('Enterprise');
  const [targetPercentage, setTargetPercentage] = useState(99.50);
  const [penaltyTerms, setPenaltyTerms] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [slaRes, svcRes] = await Promise.all([
        api.getSlas(),
        api.getServices(),
      ]);
      setSlas(slaRes);
      setServices(svcRes);
      if (svcRes.length > 0 && !serviceId) {
        setServiceId(svcRes[0].id);
      }
    } catch (e) {
      console.error('Failed to load SLAs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const handleCreateSla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !serviceId) return;

    try {
      await api.createSla({
        name: name.trim(),
        service_id: serviceId,
        customer_tier: customerTier,
        target_percentage: Number(targetPercentage),
        penalty_terms: penaltyTerms.trim(),
      });
      setIsCreateModalOpen(false);
      setName('');
      setPenaltyTerms('');
      fetchData();
    } catch (e) {
      console.error('Failed to create SLA', e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">SLA Management</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Customer Contracts
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Service Level Agreements contractual guarantees and financial penalty risk tracking.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-brand transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer SLA</span>
        </button>
      </div>

      {/* SLAs Table */}
      <GlassPanel>
        {isLoading && slas.length === 0 ? (
          <SkeletonTable rows={4} />
        ) : (
          <div className="overflow-x-auto -mx-5 -my-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="table-header">Contract Agreement</th>
                  <th className="table-header">Service</th>
                  <th className="table-header">Customer Tier</th>
                  <th className="table-header">SLA Target</th>
                  <th className="table-header">Actual Compliance</th>
                  <th className="table-header">Penalty Terms</th>
                  <th className="table-header">Penalty Risk</th>
                  <th className="table-header text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {slas.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="table-cell font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-brand-400" />
                        <span>{s.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block pl-6">{s.id}</span>
                    </td>
                    <td className="table-cell font-medium text-slate-200">
                      {s.service_name || s.service_id}
                    </td>
                    <td className="table-cell">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800 uppercase">
                        {s.customer_tier}
                      </span>
                    </td>
                    <td className="table-cell font-mono text-slate-200 font-bold">
                      {s.target_percentage.toFixed(2)}%
                    </td>
                    <td className="table-cell font-mono">
                      <span className={s.current_compliance >= s.target_percentage ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {s.current_compliance.toFixed(3)}%
                      </span>
                    </td>
                    <td className="table-cell text-xs text-slate-400 max-w-xs truncate">
                      {s.penalty_terms || 'Standard service credit applies'}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          s.penalty_risk === 'Triggered'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                            : s.penalty_risk === 'High'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {s.penalty_risk}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <StatusBadge status={s.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

      {/* Create SLA Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Customer Service Level Agreement"
        subtitle="Establish legally-binding SLA availability thresholds"
      >
        <form onSubmit={handleCreateSla} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Agreement Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Enterprise Payment Processing SLA"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Service</label>
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
              <label className="block text-slate-300 font-medium mb-1">Customer Tier</label>
              <select
                value={customerTier}
                onChange={(e) => setCustomerTier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Enterprise">Enterprise (99.80%+ Guarantee)</option>
                <option value="Business">Business (99.50% Guarantee)</option>
                <option value="Standard">Standard (99.00% Guarantee)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Target Availability %</label>
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
            <label className="block text-slate-300 font-medium mb-1">Financial Penalty Terms</label>
            <textarea
              rows={3}
              value={penaltyTerms}
              onChange={(e) => setPenaltyTerms(e.target.value)}
              placeholder="e.g. 15% billing credit for monthly unannounced downtime > 0.20%..."
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
              Save SLA Contract
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
