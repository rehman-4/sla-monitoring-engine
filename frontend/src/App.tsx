import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TimeRangeProvider } from './context/TimeRangeContext';
import { SimulationProvider } from './context/SimulationContext';
import { NotificationProvider } from './context/NotificationContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { ServiceMapPage } from './pages/ServiceMapPage';
import { SliPage } from './pages/SliPage';
import { SloPage } from './pages/SloPage';
import { ErrorBudgetPage } from './pages/ErrorBudgetPage';
import { SlaPage } from './pages/SlaPage';
import { MonitorsPage } from './pages/MonitorsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AlertDetailPage } from './pages/AlertDetailPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { LogsPage } from './pages/LogsPage';
import { TracesPage } from './pages/TracesPage';
import { MetricsPage } from './pages/MetricsPage';
import { DashboardsPage } from './pages/DashboardsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  return (
    <Router>
      <TimeRangeProvider>
        <SimulationProvider>
          <NotificationProvider>
            <div className="min-h-screen bg-background text-slate-100 flex">
              {/* Collapsible Left Sidebar */}
              <Sidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                activeAlertsCount={0}
                activeIncidentsCount={0}
              />

              {/* Main Content Area */}
              <div
                className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
                  collapsed ? 'md:ml-20' : 'md:ml-64'
                }`}
              >
                {/* Top Navigation */}
                <TopNav collapsed={collapsed} setCollapsed={setCollapsed} />

                {/* Page Content Viewport */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 mt-16 max-w-[1600px] w-full mx-auto">
                  <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
                    <Route path="/service-map" element={<ServiceMapPage />} />
                    <Route path="/slis" element={<SliPage />} />
                    <Route path="/slos" element={<SloPage />} />
                    <Route path="/error-budgets" element={<ErrorBudgetPage />} />
                    <Route path="/slas" element={<SlaPage />} />
                    <Route path="/monitors" element={<MonitorsPage />} />
                    <Route path="/alerts" element={<AlertsPage />} />
                    <Route path="/alerts/:alertId" element={<AlertDetailPage />} />
                    <Route path="/incidents" element={<IncidentsPage />} />
                    <Route path="/incidents/:incidentId" element={<IncidentDetailPage />} />
                    <Route path="/logs" element={<LogsPage />} />
                    <Route path="/traces" element={<TracesPage />} />
                    <Route path="/metrics" element={<MetricsPage />} />
                    <Route path="/dashboards" element={<DashboardsPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
              </div>
            </div>
          </NotificationProvider>
        </SimulationProvider>
      </TimeRangeProvider>
    </Router>
  );
}

export default App;
