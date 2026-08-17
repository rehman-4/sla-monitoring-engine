import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { GlobalSearchItem } from '../../types';
import { Search, Server, AlertTriangle, Flame, Target, Radio, FileText, ArrowRight, X } from 'lucide-react';

interface CmdKModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CmdKModal: React.FC<CmdKModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await api.search(query.trim());
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'service':
        return Server;
      case 'alert':
        return AlertTriangle;
      case 'incident':
        return Flame;
      case 'slo':
      case 'sla':
        return Target;
      case 'monitor':
        return Radio;
      default:
        return FileText;
    }
  };

  const handleSelect = (item: GlobalSearchItem) => {
    onClose();
    navigate(item.url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Search Dialog */}
      <div className="relative w-full max-w-xl bg-background-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 animate-fadeIn">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border bg-background-secondary/80">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, alerts, incidents, SLOs, monitors..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {isLoading && (
            <div className="p-4 text-center text-xs text-slate-400">
              Searching observability catalog...
            </div>
          )}

          {!isLoading && query && results.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching observability entities found for "{query}".
            </div>
          )}

          {!query && (
            <div className="p-4 text-xs text-slate-500 space-y-2">
              <div className="font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                Quick Navigation Suggestions
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <button
                  onClick={() => { onClose(); navigate('/services'); }}
                  className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-left flex items-center gap-2"
                >
                  <Server className="w-3.5 h-3.5 text-indigo-400" />
                  <span>All Microservices</span>
                </button>
                <button
                  onClick={() => { onClose(); navigate('/slos'); }}
                  className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-left flex items-center gap-2"
                >
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SLO & Error Budgets</span>
                </button>
                <button
                  onClick={() => { onClose(); navigate('/incidents'); }}
                  className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-left flex items-center gap-2"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Active Incidents</span>
                </button>
                <button
                  onClick={() => { onClose(); navigate('/service-map'); }}
                  className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-left flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Topology Map</span>
                </button>
              </div>
            </div>
          )}

          {results.map((item) => {
            const Icon = getItemIcon(item.type);
            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                className="p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center justify-between gap-3 group transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 group-hover:text-brand-400 group-hover:border-brand-500/40 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                    {item.type}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Shortcut Key */}
        <div className="px-4 py-2 border-t border-border bg-background-secondary flex items-center justify-between text-[11px] text-slate-400">
          <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
          <span><strong>ESC</strong> to close</span>
        </div>
      </div>
    </div>
  );
};
