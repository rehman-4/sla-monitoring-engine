import React, { createContext, useContext, useState, useEffect } from 'react';

export type TimeRange = '15m' | '1h' | '6h' | '24h' | '7d' | '30d';
export type RefreshInterval = 'off' | '10s' | '30s' | '1m';

interface TimeRangeContextType {
  timeRange: TimeRange;
  setTimeRange: (tr: TimeRange) => void;
  refreshInterval: RefreshInterval;
  setRefreshInterval: (ri: RefreshInterval) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
}

const TimeRangeContext = createContext<TimeRangeContextType | undefined>(undefined);

export const TimeRangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>('30s');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    if (refreshInterval === 'off') return;

    const msMap: Record<RefreshInterval, number> = {
      off: 0,
      '10s': 10000,
      '30s': 30000,
      '1m': 60000,
    };

    const interval = setInterval(() => {
      triggerRefresh();
    }, msMap[refreshInterval]);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <TimeRangeContext.Provider
      value={{
        timeRange,
        setTimeRange,
        refreshInterval,
        setRefreshInterval,
        refreshKey,
        triggerRefresh,
        isRefreshing,
      }}
    >
      {children}
    </TimeRangeContext.Provider>
  );
};

export const useTimeRange = () => {
  const context = useContext(TimeRangeContext);
  if (!context) {
    throw new Error('useTimeRange must be used within a TimeRangeProvider');
  }
  return context;
};
