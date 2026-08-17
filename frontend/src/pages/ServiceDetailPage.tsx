import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ServiceItem, MetricQueryResponse, SloItem, AlertItem, LogItem, TraceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { GlassPanel } from '../components/common/GlassPanel';
import { MetricCard } from '../components/common/MetricCard';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';
import { LatencyPercentileChart } from '../components/charts/LatencyPercentileChart';
import { ErrorBudgetGauge } from '../components/charts/ErrorBudgetGauge';
import { SkeletonCard, SkeletonChart } from '../components/common/SkeletonLoader';
import { TraceWaterfall } from '../components/traces/TraceWaterfall';
import {
  Server,
  ArrowLeft,
  Activity,
  AlertTriangle,
  FileText,
  GitCommit,
  Target,
  Clock,
  Layers,
  Shield,
  ExternalLink
} from 'lucide-react';

export const ServiceDetailPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { timeRange, refreshKey } = useTimeRange();

  const [service, setService] = useState<ServiceItem | null>(null);
  const [metrics, setMetrics] = useState<MetricQueryResponse | null>(null);
  const [slos, setSlos] = useState<SloItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<TraceItem | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'slos' | 'logs' | 'traces'>('metrics');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!serviceId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [svcRes, metRes, sloRes, alertRes, logRes, trcRes] = await Promise.all([
          api.getServiceById(serviceId, timeRange),
          api.getMetrics(serviceId, timeRange),
          api.getSlos(),
          api.getAlerts({ service_id: serviceId }),
          api.getLogs({ service_id: serviceId, limit: 15 }),
          api.getTraces({ service_id: serviceId, limit: 5 }),
        ]);

        setService(svcRes);
        setMetrics(metRes);
        setSlos(sloRes.filter((s) => s.service_id === serviceId));
        setAlerts(alertRes);
        setLogs(logRes);
        setTraces(trcRes);
        if (trcRes.length > 0) {
          setSelectedTrace(trcRes[0]);
        }
      } catch (e) {
        console.error('Failed to load service detail', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [serviceId, timeRange, refreshKey]);

  if (isLoading && !service) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <SkeletonChart />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-16">
        <Server className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Service Not Found</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">The service "{serviceId}" was not found in catalog.</p>
        <button
          onClick={() => navigate('/services')}
          className="px-4 py-2 bg-brand-600 text-white text-xs rounded-xl font-semibold"
        >
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Breadcrumb & Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <button
            onClick={() => navigate('/services')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to all services</span>
          </button>

          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Server className="w-6 h-6 text-brand-400" />
              <span>{service.name}</span>
            </h2>
            <StatusBadge status={service.status} size="md" />
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 uppercase">
              {service.tier}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {service.description || 'Monitored microservice in ShopCloud platform architecture.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400">Owner:</span>
          <span className="text-slate-200 font-semibold">{service.owner_team}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Env:</span>
          <span className="text-slate-200 font-semibold uppercase">{service.environment}</span>
        </div>
      </div>

      {/* Hero Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Availability"
          value={`${service.availability?.toFixed(2)}%`}
          target="99.90%"
          status={service.availability >= 99.9 ? 'healthy' : 'critical'}
          subtitle="Trailing window SLI"
          sparklineData={metrics?.points.map((p) => p.availability)}
          sparklineColor="#10b981"
        />

        <MetricCard
          title="Throughput"
          value={`${service.requests_per_sec?.toFixed(0)} rps`}
          subtitle={`Avg: ${metrics?.summary.avg_rps || service.requests_per_sec?.toFixed(0)} rps`}
          status="info"
          sparklineData={metrics?.points.map((p) => p.requests_per_sec)}
          sparklineColor="#6366f1"
        />

        <MetricCard
          title="Error Rate"
          value={`${service.error_rate?.toFixed(3)}%`}
          target="≤ 0.10%"
          status={service.error_rate <= 0.1 ? 'healthy' : 'critical'}
          subtitle="HTTP 5xx error percentage"
          sparklineData={metrics?.points.map((p) => p.error_rate)}
          sparklineColor={service.error_rate <= 0.1 ? '#10b981' : '#ef4444'}
        />

        <MetricCard
          title="P95 Latency"
          value={`${service.p95_latency?.toFixed(1)} ms`}
          target="≤ 200 ms"
          status={service.p95_latency <= 200 ? 'healthy' : 'warning'}
          subtitle={`P50: ${service.p50_latency?.toFixed(1)}ms | P99: ${service.p99_latency?.toFixed(1)}ms`}
          sparklineData={metrics?.points.map((p) => p.p95_latency)}
          sparklineColor="#f59e0b"
        />

        <MetricCard
          title="Error Budget"
          value={`${service.error_budget_remaining?.toFixed(1)}%`}
          subtitle="30-day budget remaining"
          status={service.error_budget_remaining >= 60 ? 'healthy' : service.error_budget_remaining >= 30 ? 'warning' : 'critical'}
          sparklineData={[80, 75, 70, service.error_budget_remaining]}
          sparklineColor="#38bdf8"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-semibold">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'metrics'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Performance Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('slos')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'slos'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>SLOs & Error Budget ({slos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'logs'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Live Logs ({logs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('traces')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'traces'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Distributed Traces ({traces.length})</span>
        </button>
      </div>

      {/* Tab 1: Interactive Performance Charts */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latency Percentiles Chart */}
            <GlassPanel
              title="Latency Percentiles (P50, P95, P99)"
              subtitle="Response time breakdown with SLO threshold reference limit"
            >
              <LatencyPercentileChart
                data={metrics.points}
                sloThreshold={200}
                height={260}
              />
            </GlassPanel>

            {/* Request Rate (RPS) Chart */}
            <GlassPanel
              title="Throughput (Requests Per Second)"
              subtitle="Inbound HTTP query traffic volume over time"
            >
              <TimeSeriesChart
                data={metrics.points}
                dataKey="requests_per_sec"
                name="RPS"
                color="#6366f1"
                unit=" rps"
                height={260}
              />
            </GlassPanel>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Error Rate Chart */}
            <GlassPanel
              title="Error Rate (%)"
              subtitle="Percentage of 5xx HTTP server failures over time"
            >
              <TimeSeriesChart
                data={metrics.points}
                dataKey="error_rate"
                name="Error Rate"
                color="#ef4444"
                unit="%"
                height={260}
              />
            </GlassPanel>

            {/* Availability Chart */}
            <GlassPanel
              title="Availability Trend (%)"
              subtitle="Uptime percentage vs 99.90% Target commitment"
            >
              <TimeSeriesChart
                data={metrics.points}
                dataKey="availability"
                name="Availability"
                color="#10b981"
                unit="%"
                height={260}
              />
            </GlassPanel>
          </div>
        </div>
      )}

      {/* Tab 2: SLOs and Error Budget Breakdown */}
      {activeTab === 'slos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {slos.length === 0 ? (
              <GlassPanel>
                <div className="p-8 text-center text-xs text-slate-400">
                  No SLOs currently configured specifically for {service.name}.
                </div>
              </GlassPanel>
            ) : (
              slos.map((slo) => (
                <GlassPanel key={slo.id}>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/80">
                    <div>
                      <h4 className="text-sm font-semibold text-white">{slo.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{slo.description}</p>
                    </div>
                    <StatusBadge status={slo.status} size="md" />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[11px]">Target</span>
                      <p className="text-sm font-mono font-bold text-white mt-1">{slo.target_percentage}%</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[11px]">Current Value</span>
                      <p className="text-sm font-mono font-bold text-slate-200 mt-1">{slo.current_value_formatted}</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[11px]">Budget Remaining</span>
                      <p className="text-sm font-mono font-bold text-emerald-400 mt-1">
                        {slo.error_budget_remaining_percent}%
                      </p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 text-[11px]">1h Burn Rate</span>
                      <p className="text-sm font-mono font-bold text-amber-400 mt-1">{slo.burn_rate_1h}x</p>
                    </div>
                  </div>
                </GlassPanel>
              ))
            )}
          </div>

          <div>
            <GlassPanel title="Service Error Budget Gauge" subtitle="30-Day Allowed vs Consumed Margin">
              <ErrorBudgetGauge
                remainingPercent={service.error_budget_remaining || 80.0}
                allowedBudget={0.10}
                consumedBudget={service.error_rate || 0.03}
                size={220}
              />
            </GlassPanel>
          </div>
        </div>
      )}

      {/* Tab 3: Correlated Live Logs */}
      {activeTab === 'logs' && (
        <GlassPanel title="Service Logs Stream" subtitle={`Recent log entries for ${service.name}`}>
          <div className="space-y-2 font-mono text-xs max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-900 flex items-start gap-3 text-[11px]"
              >
                <span className="text-slate-500 select-none">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                    log.level === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-400'
                      : log.level === 'ERROR'
                      ? 'bg-rose-900/60 text-rose-300'
                      : log.level === 'WARN'
                      ? 'bg-amber-950 text-amber-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-slate-400 font-mono">{log.request_id || '-'}</span>
                <span className="text-slate-200 flex-1">{log.message}</span>
                <span className="text-slate-500">{log.duration_ms}ms</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Tab 4: Distributed Traces */}
      {activeTab === 'traces' && (
        <div>
          {selectedTrace ? (
            <TraceWaterfall trace={selectedTrace} />
          ) : (
            <GlassPanel>
              <div className="p-8 text-center text-xs text-slate-400">
                No active distributed traces found for this service.
              </div>
            </GlassPanel>
          )}
        </div>
      )}
    </div>
  );
};
