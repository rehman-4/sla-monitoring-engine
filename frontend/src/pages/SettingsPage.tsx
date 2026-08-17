import React, { useState } from 'react';
import { GlassPanel } from '../components/common/GlassPanel';
import { Users, Settings, Shield, Bell, Database, Terminal, CheckCircle2, Award } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'team' | 'alerting' | 'academic'>('academic');

  const teamMembers = [
    { name: 'Sarah Chen', role: 'Lead SRE / On-Call Incident Commander', email: 'sarah.chen@shopcloud.internal', status: 'On-Call' },
    { name: 'Alex Morgan', role: 'Staff Reliability Engineer (Search & Ingress)', email: 'alex.morgan@shopcloud.internal', status: 'Active' },
    { name: 'David Kim', role: 'DevOps & Kubernetes Infrastructure Engineer', email: 'david.kim@shopcloud.internal', status: 'Active' },
    { name: 'Elena Rostova', role: 'Checkout & Payments Platform SRE', email: 'elena.rostova@shopcloud.internal', status: 'Active' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Platform Settings & Team</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
            Configuration
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Manage SRE on-call rosters, alerting escalations, retention windows, and academic project specifications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs font-semibold">
        <button
          onClick={() => setActiveTab('academic')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'academic'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Academic Case Study & Architecture</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'team'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>SRE Team Roster</span>
        </button>

        <button
          onClick={() => setActiveTab('alerting')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'alerting'
              ? 'border-brand-500 text-brand-400 bg-brand-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notification Channels</span>
        </button>
      </div>

      {/* Tab: Academic Architecture Documentation */}
      {activeTab === 'academic' && (
        <div className="space-y-6">
          <GlassPanel title="ShopCloud Observability Platform — Architectural Specification">
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <h4 className="text-sm font-bold text-white mb-1">Academic Demonstration Context</h4>
                <p className="text-slate-400">
                  This project demonstrates a production-grade SRE reliability platform implementing the full Google SRE SLA / SLO / SLI mathematical methodology, multi-window error budget burn rate tracking, distributed tracing waterfalls, and interactive incident simulation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1.5">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Real Application Logic (Backend & Engine)</span>
                  </h5>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li>Availability & Error Rate SLI mathematical calculation</li>
                    <li>30-Day Rolling Window SLO compliance evaluator</li>
                    <li>Google SRE Multi-Window Multi-Burn-Rate engine (1h, 6h, 24h, 30d)</li>
                    <li>SQLAlchemy 2.0 ORM database layer with SQLite persistence</li>
                    <li>FastAPI REST API endpoints and CRUD controllers</li>
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-900 space-y-1.5">
                  <h5 className="font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span>Simulated Cloud Telemetry</span>
                  </h5>
                  <ul className="list-disc list-inside text-slate-400 space-y-1">
                    <li>30-day realistic time-series metric points generator</li>
                    <li>Microservice topology dependency communication edges</li>
                    <li>Stateful fault injector (Degraded warning & P1 Outage)</li>
                    <li>Distributed OpenTelemetry span waterfalls</li>
                    <li>Structured JSON application logs stream</li>
                  </ul>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Tab: Team */}
      {activeTab === 'team' && (
        <GlassPanel title="Site Reliability Engineering Roster" subtitle="Active on-call escalation list">
          <div className="divide-y divide-border/60">
            {teamMembers.map((m) => (
              <div key={m.email} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-950 border border-brand-800 flex items-center justify-center font-bold text-brand-300">
                    {m.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h5 className="font-bold text-white">{m.name}</h5>
                    <p className="text-slate-400">{m.role}</p>
                    <span className="text-[10px] font-mono text-slate-500">{m.email}</span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                    m.status === 'On-Call'
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Tab: Alerting Channels */}
      {activeTab === 'alerting' && (
        <GlassPanel title="Notification & Webhook Channels" subtitle="Connected escalation integrations">
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">#sre-oncall (Slack)</span>
                <p className="text-slate-400 text-[11px]">Receives all warning and critical alert dispatches</p>
              </div>
              <span className="badge badge-healthy">CONNECTED</span>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">PagerDuty Service (Escalation Policy 1)</span>
                <p className="text-slate-400 text-[11px]">High urgency SMS/phone pages for P1 Incidents</p>
              </div>
              <span className="badge badge-healthy">CONNECTED</span>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
};
