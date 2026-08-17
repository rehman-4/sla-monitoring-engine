import React, { useState } from 'react';
import { TraceItem, TraceSpanItem } from '../../types';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface TraceWaterfallProps {
  trace: TraceItem;
}

export const TraceWaterfall: React.FC<TraceWaterfallProps> = ({ trace }) => {
  const [selectedSpan, setSelectedSpan] = useState<TraceSpanItem | null>(trace.spans[0] || null);

  const totalDuration = trace.total_duration_ms || 100;

  const getServiceBadgeColor = (serviceId: string) => {
    switch (serviceId) {
      case 'shopcloud-api':
        return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60';
      case 'auth-service':
        return 'text-blue-400 bg-blue-950/60 border-blue-800/60';
      case 'order-service':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'payment-service':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
      case 'search-service':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      default:
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
    }
  };

  return (
    <div className="space-y-6">
      {/* Trace Overview Header */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-brand-400 bg-brand-950/80 px-2 py-0.5 rounded border border-brand-800/60">
              {trace.id}
            </span>
            <h3 className="text-base font-semibold text-white">{trace.operation_name}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Initiated at {new Date(trace.timestamp).toLocaleTimeString()} by user {trace.user_id || 'anonymous'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Total Duration: <strong className="font-mono text-white">{trace.total_duration_ms.toFixed(1)} ms</strong></span>
          </div>

          <div className="flex items-center gap-1.5">
            {trace.has_error ? (
              <span className="badge badge-critical">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Error {trace.http_status}</span>
              </span>
            ) : (
              <span className="badge badge-healthy">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Success 200</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Waterfall & Span Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waterfall Gantt list */}
        <div className="lg:col-span-2 glass-panel p-4 overflow-x-auto">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-3 mb-3 border-b border-border/80 font-mono">
            <span>SPAN HIERARCHY</span>
            <span>TIMELINE (0ms — {totalDuration.toFixed(0)}ms)</span>
          </div>

          <div className="space-y-2">
            {trace.spans.map((span) => {
              const leftPercent = (span.start_offset_ms / totalDuration) * 100;
              const widthPercent = Math.max(3, (span.duration_ms / totalDuration) * 100);
              const isSelected = selectedSpan?.id === span.id;
              const isError = span.status === 'error';

              return (
                <div
                  key={span.id}
                  onClick={() => setSelectedSpan(span)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-slate-800/90 border-brand-500 shadow-md'
                      : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getServiceBadgeColor(span.service_id)}`}>
                        {span.service_name || span.service_id}
                      </span>
                      <span className="font-semibold text-slate-200">{span.span_name}</span>
                    </div>
                    <span className="font-mono text-slate-400 text-[11px]">{span.duration_ms.toFixed(1)} ms</span>
                  </div>

                  {/* Gantt Bar track */}
                  <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`absolute top-0 bottom-0 rounded-full ${
                        isError
                          ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                          : 'bg-brand-500 shadow-[0_0_6px_#6366f1]'
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Span Detail Pane */}
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white pb-3 mb-4 border-b border-border">
              Span Attributes & Metadata
            </h4>

            {selectedSpan ? (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Span ID</span>
                  <p className="font-mono text-slate-200 mt-0.5">{selectedSpan.id}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Service</span>
                  <p className="text-slate-200 mt-0.5 font-medium">{selectedSpan.service_name} ({selectedSpan.service_id})</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Duration</span>
                  <p className="font-mono text-slate-200 mt-0.5">{selectedSpan.duration_ms.toFixed(2)} ms (Offset: {selectedSpan.start_offset_ms.toFixed(2)} ms)</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Status</span>
                  <div className="mt-1">
                    {selectedSpan.status === 'error' ? (
                      <span className="badge badge-critical">ERROR: {selectedSpan.error_message || 'Span failed'}</span>
                    ) : (
                      <span className="badge badge-healthy">OK (No error)</span>
                    )}
                  </div>
                </div>
                {selectedSpan.tags && Object.keys(selectedSpan.tags).length > 0 && (
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">Span Tags</span>
                    <div className="mt-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                      {Object.entries(selectedSpan.tags).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-400">{k}:</span>
                          <span className="text-indigo-300">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Click any span in the waterfall to inspect tags and error details.</p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border/80 text-[11px] text-slate-400 italic">
            Simulated OpenTelemetry trace generated for ShopCloud Distributed Architecture.
          </div>
        </div>
      </div>
    </div>
  );
};
