import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ErrorBudgetOverviewResponse } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorBudgetGauge } from '../components/charts/ErrorBudgetGauge';
import { BurnRateMeter } from '../components/charts/BurnRateMeter';
import { SkeletonCard, SkeletonTable } from '../components/common/SkeletonLoader';
import { PieChart, Flame, AlertOctagon, TrendingDown, ArrowRight, ShieldCheck } from 'lucide-react';

export const ErrorBudgetPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshKey } = useTimeRange();
  const [data, setData] = useState<ErrorBudgetOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await api.getErrorBudgets();
        setData(res);
      } catch (e) {
        console.error('Failed to load error budgets', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Error Budgets</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              SRE Budget Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track remaining allowable downtime budget, multi-window burn rates, and top consuming services.
          </p>
        </div>

        <button
          onClick={() => navigate('/slos')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
        >
          <span>Manage SLO Definitions</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Allowed Error Budget
              </span>
              <div className="text-2xl font-extrabold font-mono text-white mt-1">
                {data.allowed_budget_total.toFixed(3)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Maximum tolerable 30-day failure rate</p>
            </div>

            <div className="glass-panel p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Budget Consumed
              </span>
              <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">
                {data.consumed_budget_total.toFixed(3)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Cumulative failures over window</p>
            </div>

            <div className="glass-panel p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Budget Remaining
              </span>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                {data.remaining_budget_total.toFixed(3)}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Available failure margin</p>
            </div>

            <div className="glass-panel p-5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Budget Used %
              </span>
              <div className="text-2xl font-extrabold font-mono text-white mt-1">
                {data.budget_used_overall_percent.toFixed(1)}%
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mt-2">
                <div
                  className={`h-1.5 rounded-full ${
                    data.budget_used_overall_percent > 70
                      ? 'bg-rose-500'
                      : data.budget_used_overall_percent > 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, data.budget_used_overall_percent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Visual Gauge + Multi-Window Burn Rate */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassPanel
              title="Overall Error Budget Gauge"
              subtitle="Current 30-day aggregate error budget status"
            >
              <div className="py-4">
                <ErrorBudgetGauge
                  remainingPercent={data.budget_remaining_overall_percent}
                  allowedBudget={data.allowed_budget_total}
                  consumedBudget={data.consumed_budget_total}
                  size={260}
                />
              </div>
            </GlassPanel>

            <GlassPanel
              title="Multi-Window Multi-Burn-Rate (Google SRE Standard)"
              subtitle="Consumption velocity across 1h, 6h, and 24h rolling windows"
            >
              <BurnRateMeter
                burn1h={data.services_consuming_most[0]?.burn_rate_1h || 0.85}
                burn6h={data.services_consuming_most[0]?.burn_rate_6h || 1.10}
                burn24h={data.services_consuming_most[0]?.burn_rate_24h || 0.95}
              />
            </GlassPanel>
          </div>

          {/* Services Consuming Most Error Budget Table */}
          <GlassPanel
            title="Services Consuming the Most Error Budget"
            subtitle="Top microservices ranked by budget depletion"
          >
            <div className="overflow-x-auto -mx-5 -mb-5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="table-header">Service Name</th>
                    <th className="table-header">SLO Target</th>
                    <th className="table-header">Allowed Budget</th>
                    <th className="table-header">Consumed</th>
                    <th className="table-header">Budget Used %</th>
                    <th className="table-header">1h Burn Rate</th>
                    <th className="table-header">6h Burn Rate</th>
                    <th className="table-header text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data.all_budgets.map((b) => (
                    <tr
                      key={b.slo_id}
                      onClick={() => navigate(`/services/${b.service_id}`)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="table-cell font-semibold text-white">
                        <div>{b.service_name}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{b.slo_name}</span>
                      </td>
                      <td className="table-cell font-mono text-slate-300">
                        {b.metric_type}
                      </td>
                      <td className="table-cell font-mono text-slate-300">
                        {b.allowed_budget_percent.toFixed(3)}%
                      </td>
                      <td className="table-cell font-mono text-amber-400 font-medium">
                        {b.consumed_budget_percent.toFixed(3)}%
                      </td>
                      <td className="table-cell font-mono text-xs">
                        <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden my-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              b.budget_used_percentage > 70
                                ? 'bg-rose-500'
                                : b.budget_used_percentage > 40
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, b.budget_used_percentage)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {b.budget_used_percentage.toFixed(1)}% consumed
                        </span>
                      </td>
                      <td className="table-cell font-mono font-bold text-slate-200">
                        {b.burn_rate_1h.toFixed(2)}x
                      </td>
                      <td className="table-cell font-mono text-slate-300">
                        {b.burn_rate_6h.toFixed(2)}x
                      </td>
                      <td className="table-cell text-right">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </>
      ) : null}
    </div>
  );
};
