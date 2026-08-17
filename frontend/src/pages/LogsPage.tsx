import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LogItem, ServiceItem } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { GlassPanel } from '../components/common/GlassPanel';
import { SkeletonTable } from '../components/common/SkeletonLoader';
import { FileText, Search, Filter, RefreshCw, ChevronDown, ChevronRight, Terminal } from 'lucide-react';

export const LogsPage: React.FC = () => {
  const { refreshKey } = useTimeRange();

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const [logRes, svcRes] = await Promise.all([
        api.getLogs({
          service_id: serviceFilter !== 'all' ? serviceFilter : undefined,
          level: levelFilter !== 'all' ? levelFilter : undefined,
          query: searchQuery.trim() || undefined,
          limit: 100,
        }),
        api.getServices(),
      ]);
      setLogs(logRes);
      setServices(svcRes);
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [serviceFilter, levelFilter, refreshKey]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Logs Explorer</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Simulated Log Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect structured application logs across all ShopCloud microservices.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Stream</span>
        </button>
      </div>

      {/* Query and Filter Bar */}
      <div className="glass-panel p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs by keyword, exception, or request_id (e.g. REQ-77401, timeout)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-brand"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
          <div className="flex items-center gap-4">
            {/* Service filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Service:</span>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Services</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Severity Level:</span>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Levels</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>

          <span className="text-slate-400 font-mono">
            Found <strong>{logs.length}</strong> log entries
          </span>
        </div>
      </div>

      {/* Log Stream Output */}
      <GlassPanel>
        {isLoading && logs.length === 0 ? (
          <SkeletonTable rows={8} />
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono">
            No matching log records found for the current query.
          </div>
        ) : (
          <div className="space-y-1 font-mono text-xs max-h-[600px] overflow-y-auto">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;

              return (
                <div
                  key={log.id}
                  className="rounded-lg bg-slate-950/60 border border-slate-900 hover:border-slate-800 transition-colors"
                >
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-2.5 flex items-start gap-2.5 cursor-pointer text-[11px]"
                  >
                    <button className="text-slate-500 mt-0.5">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    <span className="text-slate-500 select-none whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>

                    <span
                      className={`px-1.5 py-0.2 rounded font-bold uppercase whitespace-nowrap ${
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

                    <span className="text-indigo-400 font-semibold whitespace-nowrap">
                      [{log.service_name || log.service_id}]
                    </span>

                    {log.request_id && (
                      <span className="text-slate-400 font-mono whitespace-nowrap">
                        {log.request_id}
                      </span>
                    )}

                    <span className="text-slate-200 flex-1 truncate">{log.message}</span>

                    <span className="text-slate-500 whitespace-nowrap">{log.duration_ms}ms</span>
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300 space-y-2">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500 block">HTTP Method:</span>
                          <span className="text-white font-bold">{log.http_method}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">HTTP Status:</span>
                          <span className="text-white font-bold">{log.http_status}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Duration:</span>
                          <span className="text-white font-bold">{log.duration_ms} ms</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Log ID:</span>
                          <span className="text-white font-mono">{log.id}</span>
                        </div>
                      </div>

                      {log.metadata_json && Object.keys(log.metadata_json).length > 0 && (
                        <div>
                          <span className="text-slate-500 block text-[11px] mb-1">Structured Payload (JSON):</span>
                          <pre className="p-2 rounded bg-black/60 text-[11px] text-cyan-300 overflow-x-auto">
                            {JSON.stringify(log.metadata_json, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
};
