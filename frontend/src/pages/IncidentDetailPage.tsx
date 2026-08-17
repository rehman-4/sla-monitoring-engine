import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { IncidentItem, AlertItem } from '../types';
import { GlassPanel } from '../components/common/GlassPanel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import {
  Flame,
  ArrowLeft,
  Clock,
  User,
  AlertTriangle,
  Send,
  CheckCircle2,
  Server,
  Shield,
  FileText,
  Activity
} from 'lucide-react';

export const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<IncidentItem | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [newNote, setNewNote] = useState('');
  const [author, setAuthor] = useState('Sarah Chen (Lead SRE)');
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncident = async () => {
    if (!incidentId) return;
    setIsLoading(true);
    try {
      const [incRes, alertRes] = await Promise.all([
        api.getIncidentById(incidentId),
        api.getAlerts(),
      ]);
      setIncident(incRes);
      setAlerts(alertRes.filter((a) => a.incident_id === incidentId));
    } catch (e) {
      console.error('Failed to load incident', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [incidentId]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentId || !newNote.trim()) return;

    try {
      await api.addIncidentEvent(incidentId, {
        message: newNote.trim(),
        author: author.trim(),
        type: 'note',
      });
      setNewNote('');
      fetchIncident();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveIncident = async () => {
    if (!incidentId) return;
    try {
      await api.updateIncident(incidentId, {
        status: 'resolved',
        root_cause: incident?.root_cause || 'Root cause identified and remediated via deployment roll-back and cache pool reset.',
      });
      fetchIncident();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading && !incident) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="text-center py-16">
        <Flame className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Incident Not Found</h3>
        <button
          onClick={() => navigate('/incidents')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs rounded-xl font-semibold"
        >
          Back to Incidents
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
            onClick={() => navigate('/incidents')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Incidents</span>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-rose-400" />
              <span>{incident.title}</span>
            </h2>
            <StatusBadge status={incident.severity} size="md" />
          </div>
          <span className="text-xs text-slate-400 font-mono mt-1 block">Incident ID: {incident.id}</span>
        </div>

        <div className="flex items-center gap-2">
          {incident.status !== 'resolved' ? (
            <button
              onClick={handleResolveIncident}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-glow-healthy"
            >
              Resolve Incident
            </button>
          ) : (
            <span className="badge badge-healthy text-xs px-3 py-1">RESOLVED</span>
          )}
        </div>
      </div>

      {/* Main Grid: Summary & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Summary and Impact */}
          <GlassPanel title="Incident Overview & Impact Assessment">
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  Summary
                </span>
                <p className="text-slate-200 mt-1 leading-relaxed text-sm">
                  {incident.summary || 'Initial investigation ongoing.'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                  Impact
                </span>
                <p className="text-rose-300 mt-1 font-mono">
                  {incident.impact || 'Service latency and error rates degraded.'}
                </p>
              </div>

              {incident.root_cause && (
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                    Root Cause Analysis (RCA)
                  </span>
                  <p className="text-slate-300 mt-1 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    {incident.root_cause}
                  </p>
                </div>
              )}
            </div>
          </GlassPanel>

          {/* Timeline Feed */}
          <GlassPanel title="Incident Investigation Timeline">
            <div className="space-y-4">
              <div className="relative pl-6 border-l-2 border-slate-800 space-y-6 my-2">
                {incident.timeline?.map((ev, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-background-card ${
                        ev.type === 'metric_alert'
                          ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                          : ev.type === 'status_change'
                          ? 'bg-amber-500'
                          : 'bg-brand-500'
                      }`}
                    />
                    <div className="text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{ev.author}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1 leading-relaxed">{ev.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Note Input */}
              {incident.status !== 'resolved' && (
                <form onSubmit={handleAddEvent} className="pt-4 border-t border-border flex gap-2">
                  <input
                    type="text"
                    required
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Post timeline update or mitigation note..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-glow-brand"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </button>
                </form>
              )}
            </div>
          </GlassPanel>
        </div>

        {/* Metadata Sidebar */}
        <div className="space-y-6">
          <GlassPanel title="Incident Metadata">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-slate-400">Status</span>
                <span className="font-bold text-white uppercase">{incident.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-slate-400">Severity</span>
                <StatusBadge status={incident.severity} size="sm" />
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-slate-400">Incident Lead</span>
                <span className="font-semibold text-slate-200">{incident.lead_sre}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/60">
                <span className="text-slate-400">Started</span>
                <span className="font-mono text-slate-300">{new Date(incident.started_at).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Duration</span>
                <span className="font-mono text-slate-300">{incident.duration_minutes} mins</span>
              </div>
            </div>
          </GlassPanel>

          {/* Related Alerts */}
          <GlassPanel title={`Correlated Alerts (${alerts.length})`}>
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-400">No individual alerts directly tied to this incident.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => navigate(`/alerts/${a.id}`)}
                    className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl hover:bg-slate-800 cursor-pointer transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white truncate">{a.service_name}</span>
                      <StatusBadge status={a.severity} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{a.title}</p>
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
