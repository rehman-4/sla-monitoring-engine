import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MetricQueryResponse, ServiceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { TimeSeriesChart } from '../components/charts/TimeSeriesChart';
import { LatencyPercentileChart } from '../components/charts/LatencyPercentileChart';
import { SkeletonChart } from '../components/common/SkeletonLoader';
import { Activity, Server, Cpu, Database, RefreshCw, BarChart2 } from 'lucide-react';

export const MetricsPage: React.FC = () => {
  const { timeRange, refreshKey } = useTimeRange();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('shopcloud-api');
  const [metricData, setMetricData] = useState<MetricQueryResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('latency');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const svcs = await api.getServices();
        setServices(svcs);
        if (svcs.length > 0 && !selectedServiceId) {
          setSelectedServiceId(svcs[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (!selectedServiceId) return;

    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const data = await api.getMetrics(selectedServiceId, timeRange);
        setMetricData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [selectedServiceId, timeRange, refreshKey]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Metrics Explorer</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Time Series
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore and aggregate CPU, RAM, throughput, latency percentiles, and error rate telemetry.
          </p>
        </div>
      </div>

      {/* Query Selector Controls */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Target Service:</span>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-semibold"
            >
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Metric Series:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="latency">Response Latency (P50, P95, P99)</option>
              <option value="requests_per_sec">Throughput (Requests / sec)</option>
              <option value="error_rate">Error Rate (%)</option>
              <option value="availability">Availability (%)</option>
              <option value="cpu_percent">CPU Utilization (%)</option>
              <option value="memory_percent">Memory Utilization (%)</option>
            </select>
          </div>
        </div>

        {metricData && (
          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-400">
            <span>Points: <strong className="text-white">{metricData.points.length}</strong></span>
            <span>Avg P95: <strong className="text-amber-400">{metricData.summary.avg_p95}ms</strong></span>
            <span>Avg RPS: <strong className="text-indigo-400">{metricData.summary.avg_rps}</strong></span>
          </div>
        )}
      </div>

      {/* Main Chart Viewer */}
      {isLoading && !metricData ? (
        <SkeletonChart />
      ) : metricData ? (
        <div className="space-y-6">
          <GlassPanel
            title={`${selectedMetric.replace('_', ' ').toUpperCase()} — ${metricData.service_name}`}
            subtitle={`Aggregated telemetry over ${timeRange} window`}
          >
            {selectedMetric === 'latency' ? (
              <LatencyPercentileChart data={metricData.points} sloThreshold={200} height={340} />
            ) : (
              <TimeSeriesChart
                data={metricData.points}
                dataKey={selectedMetric}
                name={selectedMetric.replace('_', ' ')}
                color={
                  selectedMetric === 'error_rate'
                    ? '#ef4444'
                    : selectedMetric === 'availability'
                    ? '#10b981'
                    : selectedMetric === 'cpu_percent'
                    ? '#f59e0b'
                    : '#6366f1'
                }
                unit={selectedMetric.includes('percent') || selectedMetric === 'availability' || selectedMetric === 'error_rate' ? '%' : ''}
                height={340}
              />
            )}
          </GlassPanel>

          {/* Statistical Aggregation Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4">
              <span className="text-slate-400 text-xs">Average Throughput</span>
              <div className="text-xl font-extrabold font-mono text-white mt-1">
                {metricData.summary.avg_rps} rps
              </div>
            </div>

            <div className="glass-panel p-4">
              <span className="text-slate-400 text-xs">Average Error Rate</span>
              <div className="text-xl font-extrabold font-mono text-rose-400 mt-1">
                {metricData.summary.avg_error_rate}%
              </div>
            </div>

            <div className="glass-panel p-4">
              <span className="text-slate-400 text-xs">P95 Peak Latency</span>
              <div className="text-xl font-extrabold font-mono text-amber-400 mt-1">
                {metricData.summary.max_p95} ms
              </div>
            </div>

            <div className="glass-panel p-4">
              <span className="text-slate-400 text-xs">Window Availability</span>
              <div className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
                {metricData.summary.avg_availability}%
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
