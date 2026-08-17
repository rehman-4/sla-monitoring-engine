import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="glass-panel p-5 animate-pulse">
    <div className="h-3 bg-slate-800 rounded w-1/3 mb-3" />
    <div className="h-8 bg-slate-700/60 rounded w-2/3 mb-3" />
    <div className="h-2 bg-slate-800 rounded w-full" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="glass-panel p-4 animate-pulse">
    <div className="h-8 bg-slate-800/80 rounded mb-4" />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-slate-800/40 rounded mb-2" />
    ))}
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="glass-panel p-5 animate-pulse h-64 flex flex-col justify-between">
    <div className="h-4 bg-slate-800 rounded w-1/4" />
    <div className="h-40 bg-slate-800/40 rounded" />
  </div>
);
