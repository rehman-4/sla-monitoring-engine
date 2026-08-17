import React, { useState, useEffect } from 'react';
import { useTimeRange, TimeRange, RefreshInterval } from '../../context/TimeRangeContext';
import { useNotification } from '../../context/NotificationContext';
import { useSimulation } from '../../context/SimulationContext';
import { CmdKModal } from './CmdKModal';
import {
  Menu,
  Search,
  Clock,
  RotateCw,
  Bell,
  Check,
  ChevronDown,
  Play,
  HelpCircle,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface TopNavProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ collapsed, setCollapsed }) => {
  const {
    timeRange,
    setTimeRange,
    refreshInterval,
    setRefreshInterval,
    triggerRefresh,
    isRefreshing,
  } = useTimeRange();

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();
  const { simulationMode } = useSimulation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [isRefreshDropdownOpen, setIsRefreshDropdownOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const timeOptions: { label: string; value: TimeRange }[] = [
    { label: 'Last 15 minutes', value: '15m' },
    { label: 'Last 1 hour', value: '1h' },
    { label: 'Last 6 hours', value: '6h' },
    { label: 'Last 24 hours', value: '24h' },
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
  ];

  const refreshOptions: { label: string; value: RefreshInterval }[] = [
    { label: 'Auto: Every 10s', value: '10s' },
    { label: 'Auto: Every 30s', value: '30s' },
    { label: 'Auto: Every 1m', value: '1m' },
    { label: 'Auto-refresh: Off', value: 'off' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 right-0 h-16 z-30 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300 flex items-center justify-between px-4 lg:px-6 ${
          collapsed ? 'left-20' : 'left-64'
        }`}
      >
        {/* Left: Sidebar Toggle + Org / Env Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span>ShopCloud Prod</span>
              <span className="text-[10px] text-slate-500 font-mono">us-east-1</span>
            </div>

            {simulationMode !== 'normal' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse">
                <ShieldAlert className="w-3 h-3" />
                <span>Simulation Active</span>
              </span>
            )}
          </div>
        </div>

        {/* Center: Global Search trigger */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 rounded-xl text-xs text-slate-400 transition-all shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500" />
              <span>Search services, alerts, incidents, SLOs...</span>
            </div>
            <kbd className="px-2 py-0.5 bg-slate-800 text-[10px] font-mono text-slate-300 rounded border border-slate-700">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Time Range Selector */}
          <div className="relative">
            <button
              onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-brand-400" />
              <span>{timeOptions.find((o) => o.value === timeRange)?.label || timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isTimeDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs animate-fadeIn"
                onClick={() => setIsTimeDropdownOpen(false)}
              >
                {timeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTimeRange(opt.value)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      timeRange === opt.value ? 'text-brand-400 font-semibold bg-brand-950/40' : 'text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {timeRange === opt.value && <Check className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Control & Interval */}
          <div className="relative flex items-center">
            <button
              onClick={triggerRefresh}
              disabled={isRefreshing}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-l-xl text-slate-300 hover:text-white transition-all"
              title="Refresh Telemetry"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsRefreshDropdownOpen(!isRefreshDropdownOpen)}
              className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 border-y border-r border-slate-800 rounded-r-xl text-[11px] font-mono text-slate-400 flex items-center gap-1"
            >
              <span>{refreshInterval}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {isRefreshDropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 text-xs animate-fadeIn"
                onClick={() => setIsRefreshDropdownOpen(false)}
              >
                {refreshOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRefreshInterval(opt.value)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      refreshInterval === opt.value ? 'text-brand-400 font-semibold bg-brand-950/40' : 'text-slate-300'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {refreshInterval === opt.value && <Check className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white relative transition-all"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-background-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                <div className="p-3.5 border-b border-border flex items-center justify-between bg-background-secondary">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No recent notifications.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 text-xs transition-colors cursor-pointer ${
                          n.is_read ? 'bg-transparent text-slate-400' : 'bg-slate-800/40 text-slate-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white truncate">{n.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Cmd+K Search Modal */}
      <CmdKModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
