export type ServiceStatus = 'healthy' | 'warning' | 'critical' | 'unknown';
export type ServiceTier = 'tier-1' | 'tier-2' | 'tier-3';
export type MetricType = 'availability' | 'latency_p95' | 'latency' | 'error_rate' | 'cpu_percent' | 'memory_percent';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'active' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
export type SlaStatus = 'Compliant' | 'At Risk' | 'Breached';
export type SloStatus = 'PASS' | 'WARNING' | 'BREACHED';
export type SimulationMode = 'normal' | 'incident' | 'critical_incident';

export interface ServiceItem {
  id: string;
  name: string;
  slug: string;
  tier: ServiceTier;
  status: ServiceStatus;
  description?: string;
  owner_team: string;
  environment: string;
  created_at: string;
  availability: number;
  requests_per_sec: number;
  error_rate: number;
  p50_latency: number;
  p95_latency: number;
  p99_latency: number;
  active_alerts_count: number;
  active_slos_count: number;
  error_budget_remaining: number;
}

export interface ServiceTopologyNode {
  id: string;
  name: string;
  tier: string;
  status: ServiceStatus;
  availability: number;
  requests_per_sec: number;
  p95_latency: number;
  error_rate: number;
  error_budget_remaining: number;
  active_alerts: number;
  x?: number;
  y?: number;
}

export interface ServiceTopologyEdge {
  id: string;
  source: string;
  target: string;
  call_type: string;
  avg_latency_ms: number;
}

export interface ServiceTopology {
  nodes: ServiceTopologyNode[];
  edges: ServiceTopologyEdge[];
}

export interface MetricPoint {
  timestamp: string;
  requests_per_sec: number;
  error_rate: number;
  p50_latency: number;
  p95_latency: number;
  p99_latency: number;
  availability: number;
  cpu_percent: number;
  memory_percent: number;
}

export interface MetricQueryResponse {
  service_id: string;
  service_name: string;
  time_range: string;
  points: MetricPoint[];
  summary: {
    avg_rps: number;
    avg_error_rate: number;
    avg_p95: number;
    avg_availability: number;
    min_p95: number;
    max_p95: number;
  };
}

export interface SliItem {
  service_id: string;
  service_name: string;
  tier: string;
  time_range: string;
  availability: {
    current: number;
    target: number;
    status: 'PASS' | 'FAIL';
  };
  latency: {
    current: number;
    target: number;
    status: 'PASS' | 'FAIL';
  };
  error_rate: {
    current: number;
    target: number;
    status: 'PASS' | 'FAIL';
  };
  requests_per_sec: number;
  p50_latency: number;
  p99_latency: number;
}

export interface SloItem {
  id: string;
  name: string;
  service_id: string;
  service_name?: string;
  metric_type: string;
  target_percentage: number;
  target_value?: number;
  time_window_days: number;
  warning_threshold: number;
  critical_threshold: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  current_compliance: number;
  current_value_formatted: string;
  status: SloStatus;
  error_budget_total_percent: number;
  error_budget_consumed_percent: number;
  error_budget_remaining_percent: number;
  burn_rate_1h: number;
  burn_rate_6h: number;
  burn_rate_24h: number;
}

export interface ErrorBudgetItem {
  service_id: string;
  service_name: string;
  slo_id: string;
  slo_name: string;
  metric_type: string;
  allowed_budget_percent: number;
  consumed_budget_percent: number;
  remaining_budget_percent: number;
  budget_used_percentage: number;
  burn_rate_1h: number;
  burn_rate_6h: number;
  burn_rate_24h: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface ErrorBudgetOverviewResponse {
  allowed_budget_total: number;
  consumed_budget_total: number;
  remaining_budget_total: number;
  budget_used_overall_percent: number;
  budget_remaining_overall_percent: number;
  services_consuming_most: ErrorBudgetItem[];
  all_budgets: ErrorBudgetItem[];
}

export interface SlaItem {
  id: string;
  name: string;
  service_id: string;
  service_name?: string;
  customer_tier: string;
  metric_type: string;
  target_percentage: number;
  target_value?: number;
  current_compliance: number;
  status: SlaStatus;
  penalty_risk: string;
  penalty_terms?: string;
  created_at: string;
}

export interface MonitorItem {
  id: string;
  name: string;
  service_id: string;
  service_name?: string;
  metric_type: string;
  condition: string;
  warning_threshold: number;
  critical_threshold: number;
  evaluation_window_minutes: number;
  severity: AlertSeverity;
  is_enabled: boolean;
  notification_channel: string;
  description?: string;
  current_value?: number;
  status: string;
  created_at: string;
}

export interface AlertItem {
  id: string;
  service_id: string;
  service_name?: string;
  monitor_id?: string;
  slo_id?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description?: string;
  metric_type: string;
  current_value: number;
  threshold_value: number;
  started_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  acknowledged_by?: string;
  incident_id?: string;
  duration_minutes?: number;
}

export interface IncidentTimelineItem {
  timestamp: string;
  message: string;
  author: string;
  type: string;
}

export interface IncidentItem {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  summary?: string;
  impact?: string;
  root_cause?: string;
  primary_service_id?: string;
  affected_services: string[];
  lead_sre: string;
  started_at: string;
  resolved_at?: string;
  duration_minutes?: number;
  timeline: IncidentTimelineItem[];
  alerts_count: number;
}

export interface LogItem {
  id: string;
  service_id: string;
  service_name?: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  request_id?: string;
  http_method: string;
  http_status: number;
  duration_ms: number;
  metadata_json: Record<string, any>;
}

export interface TraceSpanItem {
  id: string;
  trace_id: string;
  parent_span_id?: string;
  service_id: string;
  service_name?: string;
  span_name: string;
  start_offset_ms: number;
  duration_ms: number;
  status: 'ok' | 'error';
  error_message?: string;
  tags: Record<string, any>;
}

export interface TraceItem {
  id: string;
  root_service_id: string;
  root_service_name?: string;
  operation_name: string;
  timestamp: string;
  total_duration_ms: number;
  http_status: number;
  has_error: boolean;
  user_id?: string;
  spans: TraceSpanItem[];
}

export interface DashboardItem {
  id: string;
  title: string;
  description?: string;
  is_default: boolean;
  tags: string[];
  layout_config: any[];
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  severity: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface GlobalSearchItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  status?: string;
  url: string;
}

export interface OverviewKPIs {
  system_health_status: 'healthy' | 'warning' | 'critical';
  system_health_score: number;
  availability: number;
  availability_target: number;
  slo_compliance_percent: number;
  sla_compliance_percent: number;
  error_budget_remaining_percent: number;
  active_incidents_count: number;
  active_alerts_count: number;
  total_services_count: number;
  healthy_services_count: number;
  sparklines: {
    health: number[];
    availability: number[];
    error_rate: number[];
    latency: number[];
  };
}

export interface SimulationStatusResponse {
  simulation_mode: SimulationMode;
  is_active_incident: boolean;
  severity: string;
}
