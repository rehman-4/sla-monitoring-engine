import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Network,
  Activity,
  FileText,
  GitCommit,
  Layers,
  Target,
  PieChart,
  FileCheck,
  Radio,
  AlertTriangle,
  Flame,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  activeAlertsCount?: number;
  activeIncidentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  activeAlertsCount = 0,
  activeIncidentsCount = 0,
}) => {
  const location = useLocation();

  const navSections = [
    {
      title: 'Overview',
      items: [
        { name: 'Home', path: '/', icon: LayoutDashboard },
        { name: 'Services', path: '/services', icon: Server },
        { name: 'Service Map', path: '/service-map', icon: Network },
      ],
    },
    {
      title: 'Observability',
      items: [
        { name: 'Metrics', path: '/metrics', icon: Activity },
        { name: 'Logs', path: '/logs', icon: FileText },
        { name: 'Traces', path: '/traces', icon: GitCommit },
        { name: 'Dashboards', path: '/dashboards', icon: Layers },
      ],
    },
    {
      title: 'Reliability',
      items: [
        { name: 'SLIs', path: '/slis', icon: Compass },
        { name: 'SLOs', path: '/slos', icon: Target },
        { name: 'Error Budgets', path: '/error-budgets', icon: PieChart },
        { name: 'SLAs', path: '/slas', icon: FileCheck },
      ],
    },
    {
      title: 'Operations',
      items: [
        { name: 'Monitors', path: '/monitors', icon: Radio },
        {
          name: 'Alerts',
          path: '/alerts',
          icon: AlertTriangle,
          badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
          badgeColor: 'bg-amber-500 text-slate-950',
        },
        {
          name: 'Incidents',
          path: '/incidents',
          icon: Flame,
          badge: activeIncidentsCount > 0 ? activeIncidentsCount : undefined,
          badgeColor: 'bg-rose-500 text-white animate-pulse',
        },
      ],
    },
    {
      title: 'Management',
      items: [
        { name: 'Team', path: '/settings?tab=team', icon: Users },
        { name: 'Settings', path: '/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-background-secondary border-r border-border flex flex-col justify-between transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-glow-brand font-bold text-base">
                SC
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide leading-none">
                  ShopCloud
                </h1>
                <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
                  Observability
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-glow-brand font-bold text-sm">
              SC
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden md:block"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation items */}
        <div className="py-4 px-3 overflow-y-auto max-h-[calc(100vh-8rem)] space-y-6">
          {navSections.map((section, idx) => (
            <div key={idx}>
              {!collapsed && (
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                      title={collapsed ? item.name : undefined}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                      {!collapsed && <span className="flex-1 truncate">{item.name}</span>}
                      {!collapsed && item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            item.badgeColor || 'bg-brand-600 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SRE Lead Footer Info */}
      <div className="p-3 border-t border-border bg-background-card/50">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
              SC
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">Sarah Chen</div>
              <div className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>SRE On-Call</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-300">
            SC
          </div>
        )}
      </div>
    </aside>
  );
};
