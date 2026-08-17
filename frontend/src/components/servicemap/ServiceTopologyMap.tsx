import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceTopology } from '../../types';
import { Activity, Zap, Server, Shield, ShoppingCart, CreditCard, Search, Bell, Database } from 'lucide-react';

interface ServiceTopologyMapProps {
  topology: ServiceTopology;
}

export const ServiceTopologyMap: React.FC<ServiceTopologyMapProps> = ({ topology }) => {
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'shopcloud-api':
        return Zap;
      case 'auth-service':
        return Shield;
      case 'payment-service':
        return CreditCard;
      case 'order-service':
        return ShoppingCart;
      case 'search-service':
        return Search;
      case 'notification-service':
        return Bell;
      case 'inventory-service':
      case 'product-catalog':
        return Database;
      default:
        return Server;
    }
  };

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return { border: '#10b981', bg: '#064e3b', glow: 'rgba(16, 185, 129, 0.4)', text: '#34d399' };
      case 'warning':
        return { border: '#f59e0b', bg: '#78350f', glow: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24' };
      case 'critical':
        return { border: '#ef4444', bg: '#7f1d1d', glow: 'rgba(239, 68, 68, 0.6)', text: '#f87171' };
      default:
        return { border: '#64748b', bg: '#1e293b', glow: 'rgba(100, 116, 139, 0.3)', text: '#cbd5e1' };
    }
  };

  const nodeMap = new Map(topology.nodes.map((n) => [n.id, n]));

  return (
    <div className="relative w-full overflow-x-auto bg-slate-950/70 border border-border rounded-2xl p-6 min-h-[560px] flex items-center justify-center select-none shadow-2xl">
      <svg
        viewBox="0 0 1000 520"
        className="w-full max-w-[1000px] h-auto overflow-visible"
      >
        <defs>
          {/* Arrowhead marker */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="28"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
          </marker>
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="28"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#818cf8" />
          </marker>
        </defs>

        {/* Edges */}
        {topology.edges.map((edge) => {
          const src = nodeMap.get(edge.source);
          const tgt = nodeMap.get(edge.target);
          if (!src || !tgt || src.x === undefined || src.y === undefined || tgt.x === undefined || tgt.y === undefined)
            return null;

          const isConnected =
            hoveredNode === edge.source || hoveredNode === edge.target;

          // Midpoint for latency badge
          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2;

          return (
            <g key={edge.id} className="transition-all duration-300">
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={isConnected ? '#818cf8' : '#334155'}
                strokeWidth={isConnected ? 2.5 : 1.5}
                strokeDasharray={edge.call_type === 'async_queue' ? '5 5' : 'none'}
                markerEnd={isConnected ? 'url(#arrow-active)' : 'url(#arrow)'}
              />
              {/* Latency label */}
              <rect
                x={midX - 22}
                y={midY - 10}
                width={44}
                height={20}
                rx={4}
                fill="#090d16"
                stroke="#1e293b"
                strokeWidth={1}
              />
              <text
                x={midX}
                y={midY + 4}
                textAnchor="middle"
                fontSize="10"
                fill={isConnected ? '#a5b4fc' : '#64748b'}
                fontFamily="JetBrains Mono, monospace"
              >
                {edge.avg_latency_ms}ms
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {topology.nodes.map((node) => {
          if (node.x === undefined || node.y === undefined) return null;
          const colors = getNodeColor(node.status);
          const Icon = getServiceIcon(node.id);
          const isHovered = hoveredNode === node.id;

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer transition-all duration-300"
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => navigate(`/services/${node.id}`)}
            >
              {/* Glow filter behind node */}
              <circle
                r={isHovered ? 42 : 36}
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth={isHovered ? 3 : 2}
                style={{
                  filter: `drop-shadow(0 0 ${isHovered ? '16px' : '8px'} ${colors.glow})`,
                  transition: 'all 0.3s ease',
                }}
              />

              {/* Status pulse ring for critical / warning */}
              {node.status !== 'healthy' && (
                <circle
                  r={48}
                  fill="none"
                  stroke={colors.border}
                  strokeWidth="1.5"
                  className="animate-ping opacity-40 origin-center"
                />
              )}

              {/* Icon inside */}
              <foreignObject x="-14" y="-14" width="28" height="28">
                <div className="flex items-center justify-center w-full h-full text-white">
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </foreignObject>

              {/* Service Label Tag */}
              <text
                y="52"
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#f1f5f9"
                className="select-none"
              >
                {node.name}
              </text>

              {/* Availability & RPS Subtext */}
              <text
                y="68"
                textAnchor="middle"
                fontSize="10"
                fill={colors.text}
                fontFamily="JetBrains Mono, monospace"
                className="select-none"
              >
                {node.availability.toFixed(2)}% | {node.requests_per_sec.toFixed(0)} rps
              </text>

              {/* Active alerts badge */}
              {node.active_alerts > 0 && (
                <g transform="translate(24, -24)">
                  <circle r="10" fill="#ef4444" stroke="#090d16" strokeWidth="2" />
                  <text
                    y="3.5"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#ffffff"
                  >
                    {node.active_alerts}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          <span className="text-slate-300">Healthy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]" />
          <span className="text-slate-300">Warning (SLO Breach)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
          <span className="text-slate-300">Critical (SLA Breach)</span>
        </div>
      </div>
    </div>
  );
};
