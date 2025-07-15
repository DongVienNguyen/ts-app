export interface SystemError {
  id?: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  function_name?: string;
  user_id?: string;
  request_url?: string;
  user_agent?: string;
  ip_address?: string;
  severity?: string;
  status?: string;
  error_data?: any;
  created_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  assigned_to?: string;
  isNew?: boolean;
}

export interface SystemMetric {
  id?: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  additional_data?: any;
  created_at?: string;
}

export interface SystemStatus {
  id?: string;
  service_name: string;
  status: string;
  response_time_ms?: number;
  error_rate?: number;
  uptime_percentage?: number;
  status_data?: any;
  last_check?: string;
  created_at?: string;
}

export interface SystemAlert {
  id?: string;
  alert_id: string;
  rule_id?: string;
  rule_name?: string;
  metric?: string;
  current_value?: number;
  threshold?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged?: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at?: string;
  updated_at?: string;
  isNew?: boolean;
}