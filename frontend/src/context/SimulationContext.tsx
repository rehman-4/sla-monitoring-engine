import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { SimulationMode } from '../types';
import { useTimeRange } from './TimeRangeContext';

interface SimulationContextType {
  simulationMode: SimulationMode;
  isLoading: boolean;
  activeToast: string | null;
  triggerDegraded: () => Promise<void>;
  triggerCritical: () => Promise<void>;
  triggerReset: () => Promise<void>;
  dismissToast: () => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('normal');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<string | null>(null);
  const { triggerRefresh } = useTimeRange();

  const fetchStatus = async () => {
    try {
      const res = await api.getSimulationStatus();
      setSimulationMode(res.simulation_mode);
    } catch (e) {
      console.error('Failed to get simulation status', e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const triggerDegraded = async () => {
    setIsLoading(true);
    try {
      const res = await api.simulateDegradedIncident();
      setSimulationMode('incident');
      setActiveToast(`⚠️ Incident Injected: Payment Service latency degraded (285ms). SLO breached! Warning alert dispatched.`);
      triggerRefresh();
    } catch (e) {
      console.error('Failed to trigger degraded incident', e);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCritical = async () => {
    setIsLoading(true);
    try {
      const res = await api.simulateCriticalIncident();
      setSimulationMode('critical_incident');
      setActiveToast(`🔥 CRITICAL P1 INCIDENT: Connection pool deadlock on Payment Service! Availability dropped to 99.35% (SLA Violated).`);
      triggerRefresh();
    } catch (e) {
      console.error('Failed to trigger critical incident', e);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerReset = async () => {
    setIsLoading(true);
    try {
      await api.resetSimulation();
      setSimulationMode('normal');
      setActiveToast(`✅ System Restored: All 8 microservices recovered to nominal health (99.97% aggregate availability).`);
      triggerRefresh();
    } catch (e) {
      console.error('Failed to reset simulation', e);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissToast = () => {
    setActiveToast(null);
  };

  return (
    <SimulationContext.Provider
      value={{
        simulationMode,
        isLoading,
        activeToast,
        triggerDegraded,
        triggerCritical,
        triggerReset,
        dismissToast,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};
