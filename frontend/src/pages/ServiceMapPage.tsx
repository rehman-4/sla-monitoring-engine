import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ServiceTopology } from '../types';
import { useTimeRange } from '../context/TimeRangeContext';
import { ServiceTopologyMap } from '../components/servicemap/ServiceTopologyMap';
import { GlassPanel } from '../components/common/GlassPanel';
import { SkeletonChart } from '../components/common/SkeletonLoader';
import { SimulationBanner } from '../components/simulator/SimulationBanner';
import { Network, Info, Activity } from 'lucide-react';

export const ServiceMapPage: React.FC = () => {
  const { refreshKey } = useTimeRange();
  const [topology, setTopology] = useState<ServiceTopology | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTopology = async () => {
      setIsLoading(true);
      try {
        const data = await api.getServiceTopology();
        setTopology(data);
      } catch (e) {
        console.error('Failed to load topology', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopology();
  }, [refreshKey]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Service Map</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-950 text-brand-300 border border-brand-800">
              Live Topology Graph
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visual service dependency topology displaying live communication channels, edge latency, and health states.
          </p>
        </div>
      </div>

      {/* Simulator bar */}
      <SimulationBanner />

      {/* Topology Graph Container */}
      {isLoading && !topology ? (
        <SkeletonChart />
      ) : topology ? (
        <div className="space-y-4">
          <ServiceTopologyMap topology={topology} />

          {/* SRE Architecture Notes */}
          <GlassPanel className="bg-slate-900/40">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <h4 className="font-semibold text-white">How the Service Map Works</h4>
                <p className="text-slate-400 leading-relaxed">
                  Edges represent synchronous HTTP, gRPC, and asynchronous Kafka messaging connections between microservices. Hover over any node to highlight immediate upstream callers and downstream dependencies. Click any node to drill into deep latency and telemetry metrics.
                </p>
              </div>
            </div>
          </GlassPanel>
        </div>
      ) : null}
    </div>
  );
};
