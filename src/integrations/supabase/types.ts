export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      asset_history_archive: {
        Row: {
          asset_name: string
          change_reason: string | null
          change_type: string
          changed_by: string
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          original_asset_id: string
        }
        Insert: {
          asset_name: string
          change_reason?: string | null
          change_type: string
          changed_by: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          original_asset_id: string
        }
        Update: {
          asset_name?: string
          change_reason?: string | null
          change_type?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          original_asset_id?: string
        }
        Relationships: []
      }
      asset_reminders: {
        Row: {
          cbkh: string | null
          cbqln: string | null
          created_at: string | null
          id: string
          is_sent: boolean | null
          ngay_den_han: string
          ten_ts: string
        }
        Insert: {
          cbkh?: string | null
          cbqln?: string | null
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          ngay_den_han: string
          ten_ts: string
        }
        Update: {
          cbkh?: string | null
          cbqln?: string | null
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          ngay_den_han?: string
          ten_ts?: string
        }
        Relationships: []
      }
      asset_transactions: {
        Row: {
          asset_code: number
          asset_year: number
          created_at: string | null
          id: string
          note: string | null
          parts_day: string
          room: string
          staff_code: string
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          asset_code: number
          asset_year: number
          created_at?: string | null
          id?: string
          note?: string | null
          parts_day: string
          room: string
          staff_code: string
          transaction_date: string
          transaction_type: string
        }
        Update: {
          asset_code?: number
          asset_year?: number
          created_at?: string | null
          id?: string
          note?: string | null
          parts_day?: string
          room?: string
          staff_code?: string
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: []
      }
      cbcrc: {
        Row: {
          email: string
          id: string
          ten_nv: string
        }
        Insert: {
          email: string
          id?: string
          ten_nv: string
        }
        Update: {
          email?: string
          id?: string
          ten_nv?: string
        }
        Relationships: []
      }
      cbkh: {
        Row: {
          email: string
          id: string
          ten_nv: string
        }
        Insert: {
          email: string
          id?: string
          ten_nv: string
        }
        Update: {
          email?: string
          id?: string
          ten_nv?: string
        }
        Relationships: []
      }
      cbqln: {
        Row: {
          email: string
          id: string
          ten_nv: string
        }
        Insert: {
          email: string
          id?: string
          ten_nv: string
        }
        Update: {
          email?: string
          id?: string
          ten_nv?: string
        }
        Relationships: []
      }
      crc_reminders: {
        Row: {
          cbcrc: string | null
          created_at: string | null
          id: string
          is_sent: boolean | null
          ldpcrc: string | null
          loai_bt_crc: string
          ngay_thuc_hien: string
          quycrc: string | null
        }
        Insert: {
          cbcrc?: string | null
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          ldpcrc?: string | null
          loai_bt_crc: string
          ngay_thuc_hien: string
          quycrc?: string | null
        }
        Update: {
          cbcrc?: string | null
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          ldpcrc?: string | null
          loai_bt_crc?: string
          ngay_thuc_hien?: string
          quycrc?: string | null
        }
        Relationships: []
      }
      ldpcrc: {
        Row: {
          email: string
          id: string
          ten_nv: string
        }
        Insert: {
          email: string
          id?: string
          ten_nv: string
        }
        Update: {
          email?: string
          id?: string
          ten_nv?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          is_seen: boolean | null
          message: string
          notification_type: string
          recipient_username: string
          related_data: Json | null
          seen_at: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_seen?: boolean | null
          message: string
          notification_type: string
          recipient_username: string
          related_data?: Json | null
          seen_at?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          is_seen?: boolean | null
          message?: string
          notification_type?: string
          recipient_username?: string
          related_data?: Json | null
          seen_at?: string | null
          title?: string
        }
        Relationships: []
      }
      other_assets: {
        Row: {
          created_at: string | null
          deposit_date: string | null
          deposit_receiver: string | null
          depositor: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string | null
          withdrawal_date: string | null
          withdrawal_deliverer: string | null
          withdrawal_receiver: string | null
        }
        Insert: {
          created_at?: string | null
          deposit_date?: string | null
          deposit_receiver?: string | null
          depositor?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
          withdrawal_date?: string | null
          withdrawal_deliverer?: string | null
          withdrawal_receiver?: string | null
        }
        Update: {
          created_at?: string | null
          deposit_date?: string | null
          deposit_receiver?: string | null
          depositor?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
          withdrawal_date?: string | null
          withdrawal_deliverer?: string | null
          withdrawal_receiver?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: number
          username: string
          subscription: Json
          created_at: string | null
        }
        Insert: {
          id?: number
          username: string
          subscription: Json
          created_at?: string | null
        }
        Update: {
          id?: number
          username?: string
          subscription?: Json
          created_at?: string | null
        }
        Relationships: []
      }
      quycrc: {
        Row: {
          email: string
          id: string
          ten_nv: string
        }
        Insert: {
          email: string
          id?: string
          ten_nv: string
        }
        Update: {
          email?: string
          id?: string
          ten_nv?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          id: string
          event_type: string
          username: string | null
          event_data: Json | null
          user_agent: string | null
          ip_address: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          event_type: string
          username?: string | null
          event_data?: Json | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          username?: string | null
          event_data?: Json | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      sent_asset_reminders: {
        Row: {
          cbkh: string | null
          cbqln: string | null
          created_at: string | null
          id: string
          is_sent: boolean | null
          ngay_den_han: string
          sent_date: string
          ten_ts: string
        }
        Insert: {
          cbkh?: string | null
          cbqln?: string | null
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          ngay_den_han: string
          sent_date: string
          ten_ts: string
        }
        Update: {
          cbkh?: string | null
          cbqln?: string | null
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          ngay_den_han?: string
          sent_date?: string
          ten_ts?: string
        }
        Relationships: []
      }
      sent_crc_reminders: {
        Row: {
          cbcrc: string | null
          created_at: string | null
          id: string
          is_sent: boolean | null
          ldpcrc: string | null
          loai_bt_crc: string
          ngay_thuc_hien: string
          quycrc: string | null
          sent_date: string
        }
        Insert: {
          cbcrc?: string | null
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          ldpcrc?: string | null
          loai_bt_crc: string
          ngay_thuc_hien: string
          quycrc?: string | null
          sent_date: string
        }
        Update: {
          cbcrc?: string | null
          created_at?: string | null
          id?: string
          is_sent?: boolean | null
          ldpcrc?: string | null
          loai_bt_crc?: string
          ngay_thuc_hien?: string
          quycrc?: string | null
          sent_date?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          account_status: string | null
          created_at: string | null
          department: string | null
          email: string | null
          failed_login_attempts: number | null
          id: string
          last_failed_login: string | null
          locked_at: string | null
          password: string
          role: string | null
          staff_name: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          account_status?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          failed_login_attempts?: number | null
          id?: string
          last_failed_login?: string | null
          locked_at?: string | null
          password: string
          role?: string | null
          staff_name?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          account_status?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          failed_login_attempts?: number | null
          id?: string
          last_failed_login?: string | null
          locked_at?: string | null
          password?: string
          role?: string | null
          staff_name?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          id: string
          alert_id: string
          rule_id: string
          rule_name: string
          metric: string
          current_value: number
          threshold: number
          severity: string
          message: string
          acknowledged: boolean | null
          acknowledged_by: string | null
          acknowledged_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          alert_id: string
          rule_id: string
          rule_name: string
          metric: string
          current_value: number
          threshold: number
          severity: string
          message: string
          acknowledged?: boolean | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          alert_id?: string
          rule_id?: string
          rule_name?: string
          metric?: string
          current_value?: number
          threshold?: number
          severity?: string
          message?: string
          acknowledged?: boolean | null
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_errors: {
        Row: {
          created_at: string | null
          error_data: Json | null
          error_message: string
          error_stack: string | null
          error_type: string
          function_name: string | null
          id: string
          ip_address: string | null
          request_url: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolution_notes: string | null
          severity: string | null
          status: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_data?: Json | null
          error_message: string
          error_stack?: string | null
          error_type: string
          function_name?: string | null
          id?: string
          ip_address?: string | null
          request_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          severity?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_data?: Json | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          function_name?: string | null
          id?: string
          ip_address?: string | null
          request_url?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          severity?: string | null
          status?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          additional_data: Json | null
          created_at: string | null
          id: string
          metric_name: string
          metric_type: string
          metric_unit: string | null
          metric_value: number
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string | null
          id?: string
          metric_name: string
          metric_type: string
          metric_unit?: string | null
          metric_value: number
        }
        Update: {
          additional_data?: Json | null
          created_at?: string | null
          id?: string
          metric_name?: string
          metric_type?: string
          metric_unit?: string | null
          metric_value?: number
        }
        Relationships: []
      }
      system_status: {
        Row: {
          created_at: string | null
          error_rate: number | null
          id: string
          last_check: string | null
          response_time_ms: number | null
          service_name: string
          status: string
          status_data: Json | null
          uptime_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          error_rate?: number | null
          id?: string
          last_check?: string | null
          response_time_ms?: number | null
          service_name: string
          status: string
          status_data?: Json | null
          uptime_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          error_rate?: number | null
          id?: string
          last_check?: string | null
          response_time_ms?: number | null
          service_name?: string
          status?: string
          status_data?: Json | null
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          actions_performed: number | null
          browser_name: string | null
          created_at: string | null
          device_type: string | null
          duration_minutes: number | null
          id: string
          ip_address: string | null
          os_name: string | null
          pages_visited: number | null
          session_start: string | null
          session_end: string | null
          session_data: Json | null
          updated_at: string | null
          username: string
        }
        Insert: {
          actions_performed?: number | null
          browser_name?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_minutes?: number | null
          id?: string
          ip_address?: string | null
          os_name?: string | null
          pages_visited?: number | null
          session_start?: string | null
          session_end?: string | null
          session_data?: Json | null
          updated_at?: string | null
          username: string
        }
        Update: {
          actions_performed?: number | null
          browser_name?: string | null
          created_at?: string | null
          device_type?: string | null
          duration_minutes?: number | null
          id?: string
          ip_address?: string | null
          os_name?: string | null
          pages_visited?: number | null
          session_start?: string | null
          session_end?: string | null
          session_data?: Json | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_info: {
        Args: Record<PropertyKey, never>
        Returns: { username: string; role: string; department: string }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_username: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      hash_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_config: {
        Args: {
          setting_name: string
          new_value: string
          is_local?: boolean
        }
        Returns: string
      }
      update_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      verify_password: {
        Args: {
          input_password: string
          stored_hash: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  Name extends keyof PublicSchema['Enums'],
  Enum extends PublicSchema['Enums'][Name] = PublicSchema['Enums'][Name],
> = Enum