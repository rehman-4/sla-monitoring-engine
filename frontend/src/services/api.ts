import axios from 'axios';
import {
  OverviewKPIs,
  ServiceItem,
  ServiceTopology,
  MetricQueryResponse,
  SliItem,
  SloItem,
  ErrorBudgetOverviewResponse,
  SlaItem,
  MonitorItem,
  AlertItem,
  IncidentItem,
  LogItem,
  TraceItem,
  DashboardItem,
  NotificationItem,
  GlobalSearchItem,
  SimulationStatusResponse
} from '../types';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Overview
  getOverviewKPIs: (timeRange = '24h') =>
    apiClient.get<OverviewKPIs>(`/overview?time_range=${timeRange}`).then((r) => r.data),

  // Services
  getServices: (timeRange = '24h') =>
    apiClient.get<ServiceItem[]>(`/services?time_range=${timeRange}`).then((r) => r.data),
  
  getServiceById: (id: string, timeRange = '24h') =>
    apiClient.get<ServiceItem>(`/services/${id}?time_range=${timeRange}`).then((r) => r.data),

  getServiceTopology: () =>
    apiClient.get<ServiceTopology>('/services/topology').then((r) => r.data),

  createService: (data: Partial<ServiceItem>) =>
    apiClient.post<ServiceItem>('/services', data).then((r) => r.data),

  // Metrics
  getMetrics: (serviceId: string, timeRange = '24h') =>
    apiClient.get<MetricQueryResponse>(`/metrics?service_id=${serviceId}&time_range=${timeRange}`).then((r) => r.data),

  // SLIs
  getSlis: (timeRange = '24h', serviceId?: string) => {
    const url = serviceId ? `/slis?time_range=${timeRange}&service_id=${serviceId}` : `/slis?time_range=${timeRange}`;
    return apiClient.get<SliItem[]>(url).then((r) => r.data);
  },

  // SLOs & Error Budgets
  getSlos: () => apiClient.get<SloItem[]>('/slos').then((r) => r.data),
  getSloById: (id: string) => apiClient.get<SloItem>(`/slos/${id}`).then((r) => r.data),
  createSlo: (data: any) => apiClient.post<SloItem>('/slos', data).then((r) => r.data),
  updateSlo: (id: string, data: any) => apiClient.put<SloItem>(`/slos/${id}`, data).then((r) => r.data),
  deleteSlo: (id: string) => apiClient.delete(`/slos/${id}`).then((r) => r.data),
  getErrorBudgets: () => apiClient.get<ErrorBudgetOverviewResponse>('/slos/error-budgets').then((r) => r.data),

  // SLAs
  getSlas: () => apiClient.get<SlaItem[]>('/slas').then((r) => r.data),
  createSla: (data: any) => apiClient.post<SlaItem>('/slas', data).then((r) => r.data),
  updateSla: (id: string, data: any) => apiClient.put<SlaItem>(`/slas/${id}`, data).then((r) => r.data),
  deleteSla: (id: string) => apiClient.delete(`/slas/${id}`).then((r) => r.data),

  // Monitors
  getMonitors: () => apiClient.get<MonitorItem[]>('/monitors').then((r) => r.data),
  createMonitor: (data: any) => apiClient.post<MonitorItem>('/monitors', data).then((r) => r.data),
  updateMonitor: (id: string, data: any) => apiClient.put<MonitorItem>(`/monitors/${id}`, data).then((r) => r.data),
  deleteMonitor: (id: string) => apiClient.delete(`/monitors/${id}`).then((r) => r.data),

  // Alerts
  getAlerts: (params?: { status?: string; severity?: string; service_id?: string }) =>
    apiClient.get<AlertItem[]>('/alerts', { params }).then((r) => r.data),
  getAlertById: (id: string) => apiClient.get<AlertItem>(`/alerts/${id}`).then((r) => r.data),
  acknowledgeAlert: (id: string, acknowledgedBy = 'Sarah Chen (Lead SRE)') =>
    apiClient.post<AlertItem>(`/alerts/${id}/acknowledge`, { acknowledged_by: acknowledgedBy }).then((r) => r.data),
  resolveAlert: (id: string) =>
    apiClient.post<AlertItem>(`/alerts/${id}/resolve`).then((r) => r.data),

  // Incidents
  getIncidents: (params?: { status?: string; severity?: string }) =>
    apiClient.get<IncidentItem[]>('/incidents', { params }).then((r) => r.data),
  getIncidentById: (id: string) => apiClient.get<IncidentItem>(`/incidents/${id}`).then((r) => r.data),
  createIncident: (data: any) => apiClient.post<IncidentItem>('/incidents', data).then((r) => r.data),
  updateIncident: (id: string, data: any) => apiClient.put<IncidentItem>(`/incidents/${id}`, data).then((r) => r.data),
  addIncidentEvent: (id: string, event: { message: string; author?: string; type?: string }) =>
    apiClient.post<IncidentItem>(`/incidents/${id}/events`, event).then((r) => r.data),

  // Logs
  getLogs: (params?: { service_id?: string; level?: string; query?: string; request_id?: string; limit?: number }) =>
    apiClient.get<LogItem[]>('/logs', { params }).then((r) => r.data),

  // Traces
  getTraces: (params?: { service_id?: string; has_error?: boolean; limit?: number }) =>
    apiClient.get<TraceItem[]>('/traces', { params }).then((r) => r.data),
  getTraceById: (id: string) => apiClient.get<TraceItem>(`/traces/${id}`).then((r) => r.data),

  // Dashboards
  getDashboards: () => apiClient.get<DashboardItem[]>('/dashboards').then((r) => r.data),
  getDashboardById: (id: string) => apiClient.get<DashboardItem>(`/dashboards/${id}`).then((r) => r.data),
  createDashboard: (data: any) => apiClient.post<DashboardItem>('/dashboards', data).then((r) => r.data),

  // Notifications
  getNotifications: () => apiClient.get<NotificationItem[]>('/notifications').then((r) => r.data),
  markNotificationRead: (id: string) => apiClient.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllNotificationsRead: () => apiClient.post('/notifications/read-all').then((r) => r.data),

  // Global Search
  search: (query: string) => apiClient.get<GlobalSearchItem[]>(`/search?q=${encodeURIComponent(query)}`).then((r) => r.data),

  // Simulation
  getSimulationStatus: () => apiClient.get<SimulationStatusResponse>('/simulation/status').then((r) => r.data),
  simulateDegradedIncident: () => apiClient.post('/simulation/simulate').then((r) => r.data),
  simulateCriticalIncident: () => apiClient.post('/simulation/simulate-critical').then((r) => r.data),
  resetSimulation: () => apiClient.post('/simulation/reset').then((r) => r.data),
};
