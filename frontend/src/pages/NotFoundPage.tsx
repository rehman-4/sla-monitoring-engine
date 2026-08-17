import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-400">
        <ShieldAlert className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-1">Page Not Found</h3>
      <p className="text-xs text-slate-400 max-w-sm mb-6">
        The telemetry view or resource you requested does not exist or has been relocated.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-glow-brand flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Overview</span>
      </button>
    </div>
  );
};
