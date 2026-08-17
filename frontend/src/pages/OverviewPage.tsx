import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { OverviewKPIs, ServiceItem, AlertItem, IncidentItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { GlassPanel } from '../components/common/GlassPanel';
import { SkeletonCard, SkeletonTable } from '../components/common/SkeletonLoader';
import { SimulationBanner } from '../components/simulator/SimulationBanner';
import {
  Server,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Activity,
  Radio,
  Clock,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { timeRange, refreshKey } = useTimeRange();

  const [kpis, setKpis] = useState<OverviewKPIs | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<AlertItem[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<IncidentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [kpiRes, svcRes, alertRes, incRes] = await Promise.all([
          api.getOverviewKPIs(timeRange),
          api.getServices(timeRange),
          api.getAlerts({ status: 'open' }),
          api.getIncidents({ status: 'active' }),
        ]);
        setKpis(kpiRes);
        setServices(svcRes);
        setActiveAlerts(alertRes);
        setActiveIncidents(incRes);
      } catch (e) {
        console.error('Failed to load overview data', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange, refreshKey]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Overview</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Live SRE Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time reliability, SLA compliance, and multi-service health monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/service-map')}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-all flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Topology Map</span>
          </button>
          <button
            onClick={() => navigate('/slos')}
            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-brand transition-all flex items-center gap-1.5"
          >
            <span>View All SLOs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Scenario Simulator Controller */}
      <SimulationBanner />

      {/* Top SRE KPI Cards Grid */}
      {isLoading && !kpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            title="System Health"
            value={kpis.system_health_status.toUpperCase()}
            subtitle={`${kpis.healthy_services_count}/${kpis.total_services_count} Services Healthy`}
            status={kpis.system_health_status}
            sparklineData={kpis.sparklines?.health}
            sparklineColor={
              kpis.system_health_status === 'healthy'
                ? '#10b981'
                : kpis.system_health_status === 'warning'
                ? '#f59e0b'
                : '#ef4444'
            }
            tooltipText="Aggregate system status based on availability, error rates, and active alert severity."
            onClick={() => navigate('/services')}
          />

          <MetricCard
            title="Availability"
            value={`${kpis.availability.toFixed(2)}%`}
            target={`${kpis.availability_target.toFixed(2)}%`}
            subtitle="Trailing window average"
            status={kpis.availability >= kpis.availability_target ? 'healthy' : 'critical'}
            trend={{
              value: kpis.availability >= kpis.availability_target ? '+0.04%' : '-0.55%',
              direction: kpis.availability >= kpis.availability_target ? 'up' : 'down',
              isGood: kpis.availability >= kpis.availability_target,
            }}
            sparklineData={kpis.sparklines?.availability}
            sparklineColor="#10b981"
            tooltipText="Percentage of successful requests (status < 500) across all services."
            onClick={() => navigate('/slis')}
          />

          <MetricCard
            title="SLO Compliance"
            value={`${kpis.slo_compliance_percent.toFixed(1)}%`}
            subtitle="30-Day Rolling Window"
            status={kpis.slo_compliance_percent >= 98.0 ? 'healthy' : 'warning'}
            sparklineData={[99.5, 99.2, 98.8, 99.0, kpis.slo_compliance_percent]}
            sparklineColor="#6366f1"
            tooltipText="Percentage of defined Service Level Objectives meeting their designated targets."
            onClick={() => navigate('/slos')}
          />

          <MetricCard
            title="SLA Compliance"
            value={`${kpis.sla_compliance_percent.toFixed(1)}%`}
            subtitle="Customer Agreements"
            status={kpis.sla_compliance_percent >= 99.0 ? 'healthy' : 'critical'}
            sparklineData={[99.8, 99.8, 99.7, 99.9, kpis.sla_compliance_percent]}
            sparklineColor="#38bdf8"
            tooltipText="Contractual customer availability SLA compliance rate."
            onClick={() => navigate('/slas')}
          />

          <MetricCard
            title="Error Budget"
            value={`${kpis.error_budget_remaining_percent.toFixed(1)}%`}
            subtitle="Budget Remaining"
            status={
              kpis.error_budget_remaining_percent >= 60
                ? 'healthy'
                : kpis.error_budget_remaining_percent >= 30
                ? 'warning'
                : 'critical'
            }
            sparklineData={[80, 75, 72, 70, kpis.error_budget_remaining_percent]}
            sparklineColor="#f59e0b"
            tooltipText="Aggregate error budget remaining across all active 30-day SLOs."
            onClick={() => navigate('/error-budgets')}
          />

          <MetricCard
            title="Active Incidents"
            value={kpis.active_incidents_count}
            subtitle={`${kpis.active_alerts_count} Active Alerts`}
            status={kpis.active_incidents_count === 0 ? 'healthy' : 'critical'}
            trend={{
              value: `${kpis.active_alerts_count} alerts`,
              direction: kpis.active_incidents_count > 0 ? 'up' : 'neutral',
              isGood: kpis.active_incidents_count === 0,
            }}
            sparklineData={[0, 0, 1, 0, kpis.active_incidents_count]}
            sparklineColor="#ef4444"
            tooltipText="Count of currently active or investigating SRE incidents."
            onClick={() => navigate('/incidents')}
          />
        </div>
      ) : null}

      {/* Main Content Layout: Service Health Table + Live Alerts / Incidents Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Service Health Table (2 Columns wide on XL) */}
        <div className="xl:col-span-2">
          <GlassPanel
            title="Service Health"
            subtitle="Live status, throughput, latency percentiles, and error rates per microservice"
            headerAction={
              <button
                onClick={() => navigate('/services')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {isLoading && services.length === 0 ? (
              <SkeletonTable rows={6} />
            ) : (
              <div className="overflow-x-auto -mx-5 -mb-5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="table-header">Service</th>
                      <th className="table-header">Status</th>
                      <th className="table-header">Availability</th>
                      <th className="table-header">Throughput</th>
                      <th className="table-header">Error Rate</th>
                      <th className="table-header">P95 Latency</th>
                      <th className="table-header">Error Budget</th>
                      <th className="table-header text-right">Alerts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {services.map((svc) => (
                      <tr
                        key={svc.id}
                        onClick={() => navigate(`/services/${svc.id}`)}
                        className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                      >
                        <td className="table-cell font-semibold text-white group-hover:text-brand-300 transition-colors">
                          <div className="flex items-center gap-2">
                            <Server className="w-4 h-4 text-slate-400 group-hover:text-brand-400" />
                            <span>{svc.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono block pl-6">
                            {svc.owner_team}
                          </span>
                        </td>
                        <td className="table-cell">
                          <StatusBadge status={svc.status} size="sm" />
                        </td>
                        <td className="table-cell font-mono font-medium">
                          <span className={svc.availability < 99.9 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                            {svc.availability?.toFixed(2)}%
                          </span>
                        </td>
                        <td className="table-cell font-mono text-slate-300">
                          {svc.requests_per_sec?.toFixed(0)} <span className="text-[10px] text-slate-500">req/s</span>
                        </td>
                        <td className="table-cell font-mono">
                          <span className={svc.error_rate > 0.1 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                            {svc.error_rate?.toFixed(3)}%
                          </span>
                        </td>
                        <td className="table-cell font-mono text-slate-300">
                          <span className={svc.p95_latency > 200 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                            {svc.p95_latency?.toFixed(1)} ms
                          </span>
                        </td>
                        <td className="table-cell font-mono text-xs">
                          <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden my-1">
                            <div
                              className={`h-1.5 rounded-full ${
                                svc.error_budget_remaining < 40
                                  ? 'bg-rose-500'
                                  : svc.error_budget_remaining < 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${svc.error_budget_remaining || 80}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {svc.error_budget_remaining?.toFixed(0)}% left
                          </span>
                        </td>
                        <td className="table-cell text-right">
                          {svc.active_alerts_count > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              {svc.active_alerts_count}
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
        </div>

        {/* Right Sidebar: Active Incidents & Firing Alerts Feed */}
        <div className="space-y-6">
          {/* Active Incidents Card */}
          <GlassPanel
            title="Active Incidents"
            subtitle={`${activeIncidents.length} active triage tickets`}
            headerAction={
              <button
                onClick={() => navigate('/incidents')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                All Incidents
              </button>
            }
          >
            {activeIncidents.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <span>No active incidents. Systems operational.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {activeIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => navigate(`/incidents/${inc.id}`)}
                    className="p-3 bg-rose-950/30 border border-rose-900/60 rounded-xl hover:bg-rose-900/40 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-rose-400">{inc.id}</span>
                      <StatusBadge status={inc.severity} size="sm" />
                    </div>
                    <h5 className="text-xs font-semibold text-white leading-snug">{inc.title}</h5>
                    <p className="text-[11px] text-slate-300 line-clamp-2">{inc.impact}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-rose-900/40">
                      <span>Lead: {inc.lead_sre}</span>
                      <span>{inc.duration_minutes}m active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          {/* Firing Alerts Card */}
          <GlassPanel
            title="Firing Alerts"
            subtitle={`${activeAlerts.length} triggered monitor rules`}
            headerAction={
              <button
                onClick={() => navigate('/alerts')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
              >
                All Alerts
              </button>
            }
          >
            {activeAlerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <span>No active alerts firing.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeAlerts.slice(0, 4).map((a) => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/alerts/${a.id}`)}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white truncate">{a.service_name}</span>
                      <StatusBadge status={a.severity} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-300 line-clamp-1">{a.title}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2">
                      <span>Val: {a.current_value} (Limit: {a.threshold_value})</span>
                      <span>{a.duration_minutes}m ago</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};
