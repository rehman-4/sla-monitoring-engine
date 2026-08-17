import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { AlertItem } from '../types';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Server,
  Target,
  Flame,
  User,
  Activity
} from 'lucide-react';

export const AlertDetailPage: React.FC = () => {
  const { alertId } = useParams<{ alertId: string }>();
  const navigate = useNavigate();

  const [alert, setAlert] = useState<AlertItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlert = async () => {
    if (!alertId) return;
    setIsLoading(true);
    try {
      const data = await api.getAlertById(alertId);
      setAlert(data);
    } catch (e) {
      console.error('Failed to load alert', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlert();
  }, [alertId]);

  const handleAcknowledge = async () => {
    if (!alertId) return;
    try {
      await api.acknowledgeAlert(alertId);
      fetchAlert();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async () => {
    if (!alertId) return;
    try {
      await api.resolveAlert(alertId);
      fetchAlert();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading && !alert) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Alert Not Found</h3>
        <button
          onClick={() => navigate('/alerts')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs rounded-xl font-semibold"
        >
          Back to Alerts
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Alerts</span>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">{alert.title}</h2>
            <StatusBadge status={alert.severity} size="md" />
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">Alert ID: {alert.id}</span>
        </div>

        <div className="flex items-center gap-2">
          {alert.status === 'open' && (
            <button
              onClick={handleAcknowledge}
              className="px-4 py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded-xl text-xs font-semibold"
            >
              Acknowledge Alert
            </button>
          )}
          {alert.status !== 'resolved' && (
            <button
              onClick={handleResolve}
              className="px-4 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-semibold shadow-glow-healthy"
            >
              Mark Resolved
            </button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <GlassPanel title="Alert Details & Telemetry Breach">
            <div className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed text-sm">{alert.description}</p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Metric Evaluated</span>
                  <p className="font-mono text-sm font-bold text-white mt-1 uppercase">{alert.metric_type}</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Value at Breach</span>
                  <p className="font-mono text-sm font-bold text-rose-400 mt-1">{alert.current_value}</p>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Threshold Limit</span>
                  <p className="font-mono text-sm font-bold text-slate-200 mt-1">{alert.threshold_value}</p>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Timeline */}
          <GlassPanel title="Alert Lifecycle Timeline">
            <div className="space-y-4 text-xs font-mono">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shadow-[0_0_8px_#ef4444]" />
                <div>
                  <div className="text-white font-bold">Alert Triggered & Dispatched</div>
                  <div className="text-slate-400 text-[11px]">{new Date(alert.started_at).toLocaleString()}</div>
                </div>
              </div>

              {alert.acknowledged_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                  <div>
                    <div className="text-white font-bold">Acknowledged by {alert.acknowledged_by}</div>
                    <div className="text-slate-400 text-[11px]">{new Date(alert.acknowledged_at).toLocaleString()}</div>
                  </div>
                </div>
              )}

              {alert.resolved_at && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  <div>
                    <div className="text-white font-bold">Alert Resolved</div>
                    <div className="text-slate-400 text-[11px]">{new Date(alert.resolved_at).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </GlassPanel>
        </div>

        {/* Related Context Sidebar */}
        <div className="space-y-6">
          <GlassPanel title="Associated Service">
            <div
              onClick={() => navigate(`/services/${alert.service_id}`)}
              className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl hover:bg-slate-800 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-brand-400" />
                <div>
                  <div className="text-xs font-semibold text-white">{alert.service_name || alert.service_id}</div>
                  <div className="text-[10px] text-slate-400">Click to view service metrics</div>
                </div>
              </div>
              <ArrowLeft className="w-4 h-4 text-slate-500 transform rotate-180" />
            </div>
          </GlassPanel>

          {alert.incident_id && (
            <GlassPanel title="Correlated Incident">
              <div
                onClick={() => navigate(`/incidents/${alert.incident_id}`)}
                className="p-3 bg-rose-950/30 border border-rose-900 rounded-xl hover:bg-rose-900/40 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-mono font-bold text-rose-300">{alert.incident_id}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">Open incident triage ticket linked</p>
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
};
