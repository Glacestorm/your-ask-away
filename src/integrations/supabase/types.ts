export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_control_policies: {
        Row: {
          access_level: string
          approved_by: string | null
          conditions: Json | null
          created_at: string | null
          description: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          is_active: boolean | null
          policy_name: string
          policy_type: string
          roles_affected: string[] | null
          updated_at: string | null
        }
        Insert: {
          access_level: string
          approved_by?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          policy_name: string
          policy_type: string
          roles_affected?: string[] | null
          updated_at?: string | null
        }
        Update: {
          access_level?: string
          approved_by?: string | null
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          policy_name?: string
          policy_type?: string
          roles_affected?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      action_plan_steps: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          plan_id: string
          step_number: number
          title: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          plan_id: string
          step_number: number
          title: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          plan_id?: string
          step_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          created_at: string
          current_value: number | null
          description: string | null
          gap_percentage: number | null
          generated_at: string
          id: string
          status: string
          target_date: string | null
          target_metric: string
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          gap_percentage?: number | null
          generated_at?: string
          id?: string
          status?: string
          target_date?: string | null
          target_metric: string
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          description?: string | null
          gap_percentage?: number | null
          generated_at?: string
          id?: string
          status?: string
          target_date?: string | null
          target_metric?: string
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_interventions: {
        Row: {
          ai_analysis: string
          auto_execute_at: string | null
          created_at: string
          diagnostic_log_id: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          issue_description: string
          proposed_solution: string
          reverted_at: string | null
          reverted_by: string | null
          rollback_data: Json | null
          solution_code: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          ai_analysis: string
          auto_execute_at?: string | null
          created_at?: string
          diagnostic_log_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          issue_description: string
          proposed_solution: string
          reverted_at?: string | null
          reverted_by?: string | null
          rollback_data?: Json | null
          solution_code?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          ai_analysis?: string
          auto_execute_at?: string | null
          created_at?: string
          diagnostic_log_id?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          issue_description?: string
          proposed_solution?: string
          reverted_at?: string | null
          reverted_by?: string | null
          rollback_data?: Json | null
          solution_code?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_interventions_diagnostic_log_id_fkey"
            columns: ["diagnostic_log_id"]
            isOneToOne: false
            referencedRelation: "system_diagnostic_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_task_queue: {
        Row: {
          ai_reasoning: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          due_date: string | null
          estimated_value: number | null
          id: string
          priority: number
          result_notes: string | null
          status: string
          suggested_action: string | null
          target_entity_id: string | null
          target_entity_type: string | null
          target_gestor_id: string | null
          task_description: string | null
          task_title: string
          task_type: string
          updated_at: string
        }
        Insert: {
          ai_reasoning?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          estimated_value?: number | null
          id?: string
          priority?: number
          result_notes?: string | null
          status?: string
          suggested_action?: string | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_gestor_id?: string | null
          task_description?: string | null
          task_title: string
          task_type: string
          updated_at?: string
        }
        Update: {
          ai_reasoning?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          due_date?: string | null
          estimated_value?: number | null
          id?: string
          priority?: number
          result_notes?: string | null
          status?: string
          suggested_action?: string | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          target_gestor_id?: string | null
          task_description?: string | null
          task_title?: string
          task_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_task_queue_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_task_queue_target_gestor_id_fkey"
            columns: ["target_gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_history: {
        Row: {
          alert_id: string
          alert_name: string
          condition_type: string
          escalated_at: string | null
          escalation_level: number | null
          escalation_notified_to: Json | null
          id: string
          metric_type: string
          metric_value: number
          notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          target_gestor_id: string | null
          target_office: string | null
          target_type: string | null
          threshold_value: number
          triggered_at: string
        }
        Insert: {
          alert_id: string
          alert_name: string
          condition_type: string
          escalated_at?: string | null
          escalation_level?: number | null
          escalation_notified_to?: Json | null
          id?: string
          metric_type: string
          metric_value: number
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          target_gestor_id?: string | null
          target_office?: string | null
          target_type?: string | null
          threshold_value: number
          triggered_at?: string
        }
        Update: {
          alert_id?: string
          alert_name?: string
          condition_type?: string
          escalated_at?: string | null
          escalation_level?: number | null
          escalation_notified_to?: Json | null
          id?: string
          metric_type?: string
          metric_value?: number
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          target_gestor_id?: string | null
          target_office?: string | null
          target_type?: string | null
          threshold_value?: number
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_history_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_history_target_gestor_id_fkey"
            columns: ["target_gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          active: boolean | null
          alert_name: string
          condition_type: string
          created_at: string | null
          created_by: string | null
          escalation_enabled: boolean | null
          escalation_hours: number | null
          id: string
          last_checked: string | null
          max_escalation_level: number | null
          metric_type: string
          period_type: string
          target_gestor_id: string | null
          target_office: string | null
          target_type: string | null
          threshold_value: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          alert_name: string
          condition_type: string
          created_at?: string | null
          created_by?: string | null
          escalation_enabled?: boolean | null
          escalation_hours?: number | null
          id?: string
          last_checked?: string | null
          max_escalation_level?: number | null
          metric_type: string
          period_type: string
          target_gestor_id?: string | null
          target_office?: string | null
          target_type?: string | null
          threshold_value: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          alert_name?: string
          condition_type?: string
          created_at?: string | null
          created_by?: string | null
          escalation_enabled?: boolean | null
          escalation_hours?: number | null
          id?: string
          last_checked?: string | null
          max_escalation_level?: number | null
          metric_type?: string
          period_type?: string
          target_gestor_id?: string | null
          target_office?: string | null
          target_type?: string | null
          threshold_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_target_gestor_id_fkey"
            columns: ["target_gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_predictions: {
        Row: {
          accuracy_score: number | null
          actual_value: number | null
          confidence_interval_high: number | null
          confidence_interval_low: number | null
          confidence_level: number | null
          created_at: string
          entity_id: string | null
          entity_type: string
          feature_importances: Json | null
          id: string
          input_features: Json | null
          metadata: Json | null
          model_name: string
          model_version: string | null
          predicted_category: string | null
          predicted_value: number | null
          prediction_date: string
          prediction_horizon_days: number
          prediction_type: string
          priority_score: number | null
          recommendations: Json | null
          scenario: string | null
          scenario_parameters: Json | null
          valid_until: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_value?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          confidence_level?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          feature_importances?: Json | null
          id?: string
          input_features?: Json | null
          metadata?: Json | null
          model_name: string
          model_version?: string | null
          predicted_category?: string | null
          predicted_value?: number | null
          prediction_date?: string
          prediction_horizon_days: number
          prediction_type: string
          priority_score?: number | null
          recommendations?: Json | null
          scenario?: string | null
          scenario_parameters?: Json | null
          valid_until?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_value?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          confidence_level?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          feature_importances?: Json | null
          id?: string
          input_features?: Json | null
          metadata?: Json | null
          model_name?: string
          model_version?: string | null
          predicted_category?: string | null
          predicted_value?: number | null
          prediction_date?: string
          prediction_horizon_days?: number
          prediction_type?: string
          priority_score?: number | null
          recommendations?: Json | null
          scenario?: string | null
          scenario_parameters?: Json | null
          valid_until?: string | null
        }
        Relationships: []
      }
      anonymized_training_data: {
        Row: {
          aggregated_metrics: Json
          aggregation_period: string
          anonymization_level: string
          created_at: string
          data_type: string
          expires_at: string
          id: string
          period_end: string
          period_start: string
          purpose: string
          sample_size: number
          source_hash: string
          techniques_applied: string[]
          transfer_restrictions: string
        }
        Insert: {
          aggregated_metrics?: Json
          aggregation_period: string
          anonymization_level?: string
          created_at?: string
          data_type: string
          expires_at?: string
          id?: string
          period_end: string
          period_start: string
          purpose?: string
          sample_size: number
          source_hash: string
          techniques_applied?: string[]
          transfer_restrictions?: string
        }
        Update: {
          aggregated_metrics?: Json
          aggregation_period?: string
          anonymization_level?: string
          created_at?: string
          data_type?: string
          expires_at?: string
          id?: string
          period_end?: string
          period_start?: string
          purpose?: string
          sample_size?: number
          source_hash?: string
          techniques_applied?: string[]
          transfer_restrictions?: string
        }
        Relationships: []
      }
      app_modules: {
        Row: {
          base_price: number | null
          category: Database["public"]["Enums"]["module_category"]
          changelog: Json | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          documentation_url: string | null
          features: Json | null
          id: string
          is_core: boolean | null
          is_required: boolean | null
          min_core_version: string | null
          module_icon: string | null
          module_key: string
          module_name: string
          screenshots: Json | null
          sector: Database["public"]["Enums"]["sector_type"] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          base_price?: number | null
          category?: Database["public"]["Enums"]["module_category"]
          changelog?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          documentation_url?: string | null
          features?: Json | null
          id?: string
          is_core?: boolean | null
          is_required?: boolean | null
          min_core_version?: string | null
          module_icon?: string | null
          module_key: string
          module_name: string
          screenshots?: Json | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          base_price?: number | null
          category?: Database["public"]["Enums"]["module_category"]
          changelog?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          documentation_url?: string | null
          features?: Json | null
          id?: string
          is_core?: boolean | null
          is_required?: boolean | null
          min_core_version?: string | null
          module_icon?: string | null
          module_key?: string
          module_name?: string
          screenshots?: Json | null
          sector?: Database["public"]["Enums"]["sector_type"] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      asset_inventory: {
        Row: {
          asset_name: string
          asset_type: string
          backup_policy: string | null
          classification: string
          created_at: string | null
          criticality: string
          data_types: string[] | null
          dependencies: string[] | null
          description: string | null
          id: string
          is_active: boolean | null
          last_review_date: string | null
          location: string | null
          next_review_date: string | null
          owner: string | null
          recovery_point_objective: number | null
          recovery_time_objective: number | null
          updated_at: string | null
        }
        Insert: {
          asset_name: string
          asset_type: string
          backup_policy?: string | null
          classification: string
          created_at?: string | null
          criticality: string
          data_types?: string[] | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_review_date?: string | null
          location?: string | null
          next_review_date?: string | null
          owner?: string | null
          recovery_point_objective?: number | null
          recovery_time_objective?: number | null
          updated_at?: string | null
        }
        Update: {
          asset_name?: string
          asset_type?: string
          backup_policy?: string | null
          classification?: string
          created_at?: string | null
          criticality?: string
          data_types?: string[] | null
          dependencies?: string[] | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_review_date?: string | null
          location?: string | null
          next_review_date?: string | null
          owner?: string | null
          recovery_point_objective?: number | null
          recovery_time_objective?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assistant_conversation_audit: {
        Row: {
          content: string
          context: string | null
          conversation_id: string
          created_at: string
          id: string
          input_method: string | null
          role: string
          user_deleted_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          context?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          input_method?: string | null
          role: string
          user_deleted_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          context?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          input_method?: string | null
          role?: string
          user_deleted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assistant_knowledge_documents: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          document_type: string
          external_url: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          content_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_type?: string
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_evidence: {
        Row: {
          collected_at: string | null
          created_at: string
          data: Json
          evidence_period_end: string
          evidence_period_start: string
          evidence_type: string
          file_url: string | null
          id: string
          is_validated: boolean | null
          organization_id: string | null
          source_query: string | null
          source_table: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          collected_at?: string | null
          created_at?: string
          data?: Json
          evidence_period_end: string
          evidence_period_start: string
          evidence_type: string
          file_url?: string | null
          id?: string
          is_validated?: boolean | null
          organization_id?: string | null
          source_query?: string | null
          source_table?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          collected_at?: string | null
          created_at?: string
          data?: Json
          evidence_period_end?: string
          evidence_period_start?: string
          evidence_type?: string
          file_url?: string | null
          id?: string
          is_validated?: boolean | null
          organization_id?: string | null
          source_query?: string | null
          source_table?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_evidence_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          category: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          request_id: string | null
          session_id: string | null
          severity: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          category?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          category?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_reports_generated: {
        Row: {
          auditor_emails: string[] | null
          compliance_score: number | null
          created_at: string
          findings_summary: Json | null
          generated_at: string | null
          generated_by: string | null
          id: string
          organization_id: string | null
          pdf_url: string | null
          report_period_end: string
          report_period_start: string
          report_type: string
          sections_data: Json | null
          sector_key: string
          sent_at: string | null
          sent_to_auditors: boolean | null
          template_id: string | null
        }
        Insert: {
          auditor_emails?: string[] | null
          compliance_score?: number | null
          created_at?: string
          findings_summary?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          organization_id?: string | null
          pdf_url?: string | null
          report_period_end: string
          report_period_start: string
          report_type: string
          sections_data?: Json | null
          sector_key: string
          sent_at?: string | null
          sent_to_auditors?: boolean | null
          template_id?: string | null
        }
        Update: {
          auditor_emails?: string[] | null
          compliance_score?: number | null
          created_at?: string
          findings_summary?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          organization_id?: string | null
          pdf_url?: string | null
          report_period_end?: string
          report_period_start?: string
          report_type?: string
          sections_data?: Json | null
          sector_key?: string
          sent_at?: string | null
          sent_to_auditors?: boolean | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_generated_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_reports_generated_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "auditor_report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      auditor_questions: {
        Row: {
          category: string
          created_at: string
          expected_evidence: Json | null
          id: string
          is_active: boolean | null
          priority: string
          question_code: string
          question_text: string
          regulation_code: string
          sector_key: string
          standard_response_template: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          expected_evidence?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: string
          question_code: string
          question_text: string
          regulation_code: string
          sector_key: string
          standard_response_template?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          expected_evidence?: Json | null
          id?: string
          is_active?: boolean | null
          priority?: string
          question_code?: string
          question_text?: string
          regulation_code?: string
          sector_key?: string
          standard_response_template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      auditor_report_templates: {
        Row: {
          created_at: string
          evidence_types: string[] | null
          frequency: string
          id: string
          is_active: boolean | null
          regulation_code: string
          required_questions: Json | null
          sections: Json
          sector_key: string
          template_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_types?: string[] | null
          frequency: string
          id?: string
          is_active?: boolean | null
          regulation_code: string
          required_questions?: Json | null
          sections?: Json
          sector_key: string
          template_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_types?: string[] | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          regulation_code?: string
          required_questions?: Json | null
          sections?: Json
          sector_key?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      auditor_responses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_generated_evidence: Json | null
          created_at: string
          evidence_urls: string[] | null
          id: string
          last_updated_at: string | null
          organization_id: string | null
          question_id: string
          response_text: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_generated_evidence?: Json | null
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          last_updated_at?: string | null
          organization_id?: string | null
          question_id: string
          response_text?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_generated_evidence?: Json | null
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          last_updated_at?: string | null
          organization_id?: string | null
          question_id?: string
          response_text?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditor_responses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditor_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "auditor_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_challenges: {
        Row: {
          attempts: number | null
          challenge_code: string | null
          challenge_type: Database["public"]["Enums"]["auth_factor_type"]
          created_at: string | null
          email_sent_at: string | null
          expires_at: string
          id: string
          max_attempts: number | null
          session_id: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          challenge_code?: string | null
          challenge_type: Database["public"]["Enums"]["auth_factor_type"]
          created_at?: string | null
          email_sent_at?: string | null
          expires_at: string
          id?: string
          max_attempts?: number | null
          session_id: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          challenge_code?: string | null
          challenge_type?: Database["public"]["Enums"]["auth_factor_type"]
          created_at?: string | null
          email_sent_at?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number | null
          session_id?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      backup_verifications: {
        Row: {
          backup_date: string
          backup_type: string
          created_at: string | null
          data_integrity_verified: boolean | null
          id: string
          notes: string | null
          restoration_time_seconds: number | null
          restored_successfully: boolean | null
          verification_date: string | null
          verification_result: string
          verified_by: string | null
        }
        Insert: {
          backup_date: string
          backup_type: string
          created_at?: string | null
          data_integrity_verified?: boolean | null
          id?: string
          notes?: string | null
          restoration_time_seconds?: number | null
          restored_successfully?: boolean | null
          verification_date?: string | null
          verification_result: string
          verified_by?: string | null
        }
        Update: {
          backup_date?: string
          backup_type?: string
          created_at?: string | null
          data_integrity_verified?: boolean | null
          id?: string
          notes?: string | null
          restoration_time_seconds?: number | null
          restored_successfully?: boolean | null
          verification_date?: string | null
          verification_result?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      balance_sheets: {
        Row: {
          accruals_assets: number | null
          available_for_sale_assets_adjustment: number | null
          capital_grants: number | null
          cash_equivalents: number | null
          created_at: string
          current_year_result: number | null
          deferred_tax_assets: number | null
          deferred_tax_liabilities: number | null
          goodwill: number | null
          hedging_operations_adjustment: number | null
          id: string
          intangible_assets: number | null
          interim_dividend: number | null
          inventory: number | null
          legal_reserve: number | null
          liabilities_held_for_sale: number | null
          long_term_accruals: number | null
          long_term_debts: number | null
          long_term_financial_investments: number | null
          long_term_group_debts: number | null
          long_term_group_investments: number | null
          long_term_provisions: number | null
          long_term_trade_receivables: number | null
          non_current_assets_held_for_sale: number | null
          other_creditors: number | null
          other_equity_instruments: number | null
          other_value_adjustments: number | null
          real_estate_investments: number | null
          retained_earnings: number | null
          revaluation_reserve: number | null
          share_capital: number | null
          share_premium: number | null
          short_term_accruals: number | null
          short_term_debts: number | null
          short_term_financial_investments: number | null
          short_term_group_debts: number | null
          short_term_group_receivables: number | null
          short_term_provisions: number | null
          statement_id: string
          statutory_reserves: number | null
          tangible_assets: number | null
          trade_payables: number | null
          trade_receivables: number | null
          translation_differences: number | null
          treasury_shares: number | null
          updated_at: string
          voluntary_reserves: number | null
        }
        Insert: {
          accruals_assets?: number | null
          available_for_sale_assets_adjustment?: number | null
          capital_grants?: number | null
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          goodwill?: number | null
          hedging_operations_adjustment?: number | null
          id?: string
          intangible_assets?: number | null
          interim_dividend?: number | null
          inventory?: number | null
          legal_reserve?: number | null
          liabilities_held_for_sale?: number | null
          long_term_accruals?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_group_debts?: number | null
          long_term_group_investments?: number | null
          long_term_provisions?: number | null
          long_term_trade_receivables?: number | null
          non_current_assets_held_for_sale?: number | null
          other_creditors?: number | null
          other_equity_instruments?: number | null
          other_value_adjustments?: number | null
          real_estate_investments?: number | null
          retained_earnings?: number | null
          revaluation_reserve?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_accruals?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_group_debts?: number | null
          short_term_group_receivables?: number | null
          short_term_provisions?: number | null
          statement_id: string
          statutory_reserves?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          translation_differences?: number | null
          treasury_shares?: number | null
          updated_at?: string
          voluntary_reserves?: number | null
        }
        Update: {
          accruals_assets?: number | null
          available_for_sale_assets_adjustment?: number | null
          capital_grants?: number | null
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          goodwill?: number | null
          hedging_operations_adjustment?: number | null
          id?: string
          intangible_assets?: number | null
          interim_dividend?: number | null
          inventory?: number | null
          legal_reserve?: number | null
          liabilities_held_for_sale?: number | null
          long_term_accruals?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_group_debts?: number | null
          long_term_group_investments?: number | null
          long_term_provisions?: number | null
          long_term_trade_receivables?: number | null
          non_current_assets_held_for_sale?: number | null
          other_creditors?: number | null
          other_equity_instruments?: number | null
          other_value_adjustments?: number | null
          real_estate_investments?: number | null
          retained_earnings?: number | null
          revaluation_reserve?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_accruals?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_group_debts?: number | null
          short_term_group_receivables?: number | null
          short_term_provisions?: number | null
          statement_id?: string
          statutory_reserves?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          translation_differences?: number | null
          treasury_shares?: number | null
          updated_at?: string
          voluntary_reserves?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "balance_sheets_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: true
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      best_practice_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          practice_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          practice_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          practice_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "best_practice_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "best_practice_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "best_practice_comments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "best_practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "best_practice_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      best_practice_likes: {
        Row: {
          created_at: string | null
          id: string
          practice_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          practice_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          practice_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "best_practice_likes_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "best_practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "best_practice_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      best_practices: {
        Row: {
          category: string
          content: string
          created_at: string | null
          gestor_id: string
          id: string
          likes_count: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          gestor_id: string
          id?: string
          likes_count?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          gestor_id?: string
          id?: string
          likes_count?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "best_practices_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bpmn_process_definitions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          edges: Json
          entity_type: string
          escalation_rules: Json | null
          id: string
          is_active: boolean | null
          is_template: boolean | null
          name: string
          nodes: Json
          sla_config: Json | null
          tenant_id: string | null
          trigger_conditions: Json | null
          updated_at: string
          updated_by: string | null
          variables_schema: Json | null
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          edges?: Json
          entity_type: string
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name: string
          nodes?: Json
          sla_config?: Json | null
          tenant_id?: string | null
          trigger_conditions?: Json | null
          updated_at?: string
          updated_by?: string | null
          variables_schema?: Json | null
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          edges?: Json
          entity_type?: string
          escalation_rules?: Json | null
          id?: string
          is_active?: boolean | null
          is_template?: boolean | null
          name?: string
          nodes?: Json
          sla_config?: Json | null
          tenant_id?: string | null
          trigger_conditions?: Json | null
          updated_at?: string
          updated_by?: string | null
          variables_schema?: Json | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "bpmn_process_definitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bpmn_process_definitions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bpmn_process_instances: {
        Row: {
          actual_completion: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          current_node_id: string
          entity_id: string
          entity_type: string
          expected_completion: string | null
          history: Json | null
          id: string
          previous_node_id: string | null
          process_definition_id: string
          sla_status: string | null
          started_at: string
          status: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          actual_completion?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          current_node_id: string
          entity_id: string
          entity_type: string
          expected_completion?: string | null
          history?: Json | null
          id?: string
          previous_node_id?: string | null
          process_definition_id: string
          sla_status?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          actual_completion?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          current_node_id?: string
          entity_id?: string
          entity_type?: string
          expected_completion?: string | null
          history?: Json | null
          id?: string
          previous_node_id?: string | null
          process_definition_id?: string
          sla_status?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "bpmn_process_instances_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bpmn_process_instances_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bpmn_process_instances_process_definition_id_fkey"
            columns: ["process_definition_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_telemetry: {
        Row: {
          channel: string | null
          created_at: string
          id: string
          metadata: Json | null
          metric_type: string
          period_end: string
          period_start: string
          segment: string | null
          updated_at: string
          user_id: string | null
          value: number
        }
        Insert: {
          channel?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type: string
          period_end: string
          period_start: string
          segment?: string | null
          updated_at?: string
          user_id?: string | null
          value: number
        }
        Update: {
          channel?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          period_end?: string
          period_start?: string
          segment?: string | null
          updated_at?: string
          user_id?: string | null
          value?: number
        }
        Relationships: []
      }
      cash_flow_statements: {
        Row: {
          corporate_tax_paid: number | null
          created_at: string
          depreciation_adjustments: number | null
          exchange_differences_adjustments: number | null
          exchange_rate_effect: number | null
          financial_expenses_adjustments: number | null
          financial_income_adjustments: number | null
          financing_dividends_paid: number | null
          financing_interest_paid: number | null
          financing_payments_debt: number | null
          financing_payments_equity: number | null
          financing_payments_group_debt: number | null
          financing_receipts_debt: number | null
          financing_receipts_equity: number | null
          financing_receipts_grants: number | null
          financing_receipts_group_debt: number | null
          gains_losses_financial_instruments: number | null
          gains_losses_fixed_assets: number | null
          grants_adjustments: number | null
          id: string
          impairment_adjustments: number | null
          inventory_changes: number | null
          investing_dividends_received: number | null
          investing_interest_received: number | null
          investing_payments_financial: number | null
          investing_payments_group: number | null
          investing_payments_intangible: number | null
          investing_payments_other: number | null
          investing_payments_real_estate: number | null
          investing_payments_tangible: number | null
          investing_receipts_financial: number | null
          investing_receipts_group: number | null
          investing_receipts_intangible: number | null
          investing_receipts_other: number | null
          investing_receipts_real_estate: number | null
          investing_receipts_tangible: number | null
          operating_dividends_received: number | null
          operating_interest_paid: number | null
          operating_interest_received: number | null
          operating_result: number | null
          other_financing_payments: number | null
          other_investing_receipts: number | null
          other_operating_changes: number | null
          other_operating_payments: number | null
          payables_changes: number | null
          provisions_variation: number | null
          receivables_changes: number | null
          statement_id: string
          updated_at: string
          working_capital_changes: number | null
        }
        Insert: {
          corporate_tax_paid?: number | null
          created_at?: string
          depreciation_adjustments?: number | null
          exchange_differences_adjustments?: number | null
          exchange_rate_effect?: number | null
          financial_expenses_adjustments?: number | null
          financial_income_adjustments?: number | null
          financing_dividends_paid?: number | null
          financing_interest_paid?: number | null
          financing_payments_debt?: number | null
          financing_payments_equity?: number | null
          financing_payments_group_debt?: number | null
          financing_receipts_debt?: number | null
          financing_receipts_equity?: number | null
          financing_receipts_grants?: number | null
          financing_receipts_group_debt?: number | null
          gains_losses_financial_instruments?: number | null
          gains_losses_fixed_assets?: number | null
          grants_adjustments?: number | null
          id?: string
          impairment_adjustments?: number | null
          inventory_changes?: number | null
          investing_dividends_received?: number | null
          investing_interest_received?: number | null
          investing_payments_financial?: number | null
          investing_payments_group?: number | null
          investing_payments_intangible?: number | null
          investing_payments_other?: number | null
          investing_payments_real_estate?: number | null
          investing_payments_tangible?: number | null
          investing_receipts_financial?: number | null
          investing_receipts_group?: number | null
          investing_receipts_intangible?: number | null
          investing_receipts_other?: number | null
          investing_receipts_real_estate?: number | null
          investing_receipts_tangible?: number | null
          operating_dividends_received?: number | null
          operating_interest_paid?: number | null
          operating_interest_received?: number | null
          operating_result?: number | null
          other_financing_payments?: number | null
          other_investing_receipts?: number | null
          other_operating_changes?: number | null
          other_operating_payments?: number | null
          payables_changes?: number | null
          provisions_variation?: number | null
          receivables_changes?: number | null
          statement_id: string
          updated_at?: string
          working_capital_changes?: number | null
        }
        Update: {
          corporate_tax_paid?: number | null
          created_at?: string
          depreciation_adjustments?: number | null
          exchange_differences_adjustments?: number | null
          exchange_rate_effect?: number | null
          financial_expenses_adjustments?: number | null
          financial_income_adjustments?: number | null
          financing_dividends_paid?: number | null
          financing_interest_paid?: number | null
          financing_payments_debt?: number | null
          financing_payments_equity?: number | null
          financing_payments_group_debt?: number | null
          financing_receipts_debt?: number | null
          financing_receipts_equity?: number | null
          financing_receipts_grants?: number | null
          financing_receipts_group_debt?: number | null
          gains_losses_financial_instruments?: number | null
          gains_losses_fixed_assets?: number | null
          grants_adjustments?: number | null
          id?: string
          impairment_adjustments?: number | null
          inventory_changes?: number | null
          investing_dividends_received?: number | null
          investing_interest_received?: number | null
          investing_payments_financial?: number | null
          investing_payments_group?: number | null
          investing_payments_intangible?: number | null
          investing_payments_other?: number | null
          investing_payments_real_estate?: number | null
          investing_payments_tangible?: number | null
          investing_receipts_financial?: number | null
          investing_receipts_group?: number | null
          investing_receipts_intangible?: number | null
          investing_receipts_other?: number | null
          investing_receipts_real_estate?: number | null
          investing_receipts_tangible?: number | null
          operating_dividends_received?: number | null
          operating_interest_paid?: number | null
          operating_interest_received?: number | null
          operating_result?: number | null
          other_financing_payments?: number | null
          other_investing_receipts?: number | null
          other_operating_changes?: number | null
          other_operating_payments?: number | null
          payables_changes?: number | null
          provisions_variation?: number | null
          receivables_changes?: number | null
          statement_id?: string
          updated_at?: string
          working_capital_changes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_statements_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: true
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_connectors: {
        Row: {
          channel_type: string
          config: Json | null
          created_at: string | null
          credentials_valid: boolean | null
          daily_limit: number | null
          health_status: string | null
          id: string
          is_active: boolean | null
          last_health_check: string | null
          provider: string
          rate_limit: number | null
          stats: Json | null
          updated_at: string | null
        }
        Insert: {
          channel_type: string
          config?: Json | null
          created_at?: string | null
          credentials_valid?: boolean | null
          daily_limit?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          provider: string
          rate_limit?: number | null
          stats?: Json | null
          updated_at?: string | null
        }
        Update: {
          channel_type?: string
          config?: Json | null
          created_at?: string | null
          credentials_valid?: boolean | null
          daily_limit?: number | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          last_health_check?: string | null
          provider?: string
          rate_limit?: number | null
          stats?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string | null
          thumbnail_url: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id?: string | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string | null
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          file_url: string | null
          id: string
          is_edited: boolean | null
          message_type: string | null
          metadata: Json | null
          priority: string | null
          reactions: Json | null
          read_by: string[] | null
          reply_to_id: string | null
          room_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          priority?: string | null
          reactions?: Json | null
          read_by?: string[] | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          file_url?: string | null
          id?: string
          is_edited?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          priority?: string | null
          reactions?: Json | null
          read_by?: string[] | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          room_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          name: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_typing: {
        Row: {
          id: string
          room_id: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          room_id?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          room_id?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_typing_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          last_used_at: string | null
          permissions: string[] | null
          prefix: string
          rate_limit: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          last_used_at?: string | null
          permissions?: string[] | null
          prefix: string
          rate_limit?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          last_used_at?: string | null
          permissions?: string[] | null
          prefix?: string
          rate_limit?: number | null
        }
        Relationships: []
      }
      cms_audit_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cms_blocks: {
        Row: {
          block_key: string
          block_name: string
          block_type: string
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          is_global: boolean | null
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          block_key: string
          block_name: string
          block_type?: string
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          block_key?: string
          block_name?: string
          block_type?: string
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_global?: boolean | null
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: Json
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: Json
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: Json
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_comments: {
        Row: {
          author_email: string | null
          author_id: string | null
          author_name: string | null
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          parent_id: string | null
          post_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          author_email?: string | null
          author_id?: string | null
          author_name?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "cms_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content_engagement: {
        Row: {
          avg_read_time: number | null
          clicks: number | null
          comments_count: number | null
          content_id: string
          content_title: string | null
          content_type: string
          created_at: string | null
          date: string
          id: string
          likes: number | null
          scroll_depth: number | null
          shares: number | null
        }
        Insert: {
          avg_read_time?: number | null
          clicks?: number | null
          comments_count?: number | null
          content_id: string
          content_title?: string | null
          content_type?: string
          created_at?: string | null
          date?: string
          id?: string
          likes?: number | null
          scroll_depth?: number | null
          shares?: number | null
        }
        Update: {
          avg_read_time?: number | null
          clicks?: number | null
          comments_count?: number | null
          content_id?: string
          content_title?: string | null
          content_type?: string
          created_at?: string | null
          date?: string
          id?: string
          likes?: number | null
          scroll_depth?: number | null
          shares?: number | null
        }
        Relationships: []
      }
      cms_content_versions: {
        Row: {
          change_summary: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_current: boolean | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          content: Json
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_current?: boolean | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_current?: boolean | null
          version_number?: number
        }
        Relationships: []
      }
      cms_content_workflow: {
        Row: {
          assignee: string | null
          content_id: string
          content_title: string | null
          content_type: string
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          priority: string | null
          reviewer: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          assignee?: string | null
          content_id: string
          content_title?: string | null
          content_type?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reviewer?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          assignee?: string | null
          content_id?: string
          content_title?: string | null
          content_type?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          reviewer?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_dashboard_layouts: {
        Row: {
          created_at: string | null
          created_by: string | null
          grid_config: Json | null
          id: string
          is_default: boolean | null
          layout_name: string
          target_role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          widgets: Json
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          grid_config?: Json | null
          id?: string
          is_default?: boolean | null
          layout_name: string
          target_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          widgets?: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          grid_config?: Json | null
          id?: string
          is_default?: boolean | null
          layout_name?: string
          target_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          widgets?: Json
        }
        Relationships: []
      }
      cms_editorial_calendar: {
        Row: {
          assignee: string | null
          channel: string | null
          color: string | null
          content_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          title: string
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          assignee?: string | null
          channel?: string | null
          color?: string | null
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          title: string
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          assignee?: string | null
          channel?: string | null
          color?: string | null
          content_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_editorial_calendar_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "cms_content_workflow"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_email_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          html_content: Json
          id: string
          is_active: boolean | null
          subject: Json
          template_key: string
          template_name: string
          text_content: Json | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content?: Json
          id?: string
          is_active?: boolean | null
          subject?: Json
          template_key: string
          template_name: string
          text_content?: Json | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          html_content?: Json
          id?: string
          is_active?: boolean | null
          subject?: Json
          template_key?: string
          template_name?: string
          text_content?: Json | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      cms_feature_flags: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          flag_key: string
          flag_name: string
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          rollout_percentage: number | null
          start_date: string | null
          target_offices: string[] | null
          target_roles: Database["public"]["Enums"]["app_role"][] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          flag_key: string
          flag_name: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          rollout_percentage?: number | null
          start_date?: string | null
          target_offices?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          flag_key?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          rollout_percentage?: number | null
          start_date?: string | null
          target_offices?: string[] | null
          target_roles?: Database["public"]["Enums"]["app_role"][] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_media_folders: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          folder_name: string
          icon: string | null
          id: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          folder_name: string
          icon?: string | null
          id?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          folder_name?: string
          icon?: string | null
          id?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_media_library: {
        Row: {
          alt_text: Json | null
          caption: Json | null
          created_at: string | null
          description: string | null
          duration: number | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          folder_id: string | null
          height: number | null
          id: string
          metadata: Json | null
          mime_type: string
          original_name: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          updated_at: string | null
          uploaded_by: string | null
          width: number | null
        }
        Insert: {
          alt_text?: Json | null
          caption?: Json | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          folder_id?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type: string
          original_name: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: Json | null
          caption?: Json | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          folder_id?: string | null
          height?: number | null
          id?: string
          metadata?: Json | null
          mime_type?: string
          original_name?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          width?: number | null
        }
        Relationships: []
      }
      cms_navigation_items: {
        Row: {
          badge_color: string | null
          badge_text: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_external: boolean | null
          is_visible: boolean | null
          label: Json
          menu_location: string
          parent_id: string | null
          sort_order: number | null
          target: string | null
          updated_at: string | null
          url: string | null
          visible_to_roles: Database["public"]["Enums"]["app_role"][] | null
        }
        Insert: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_external?: boolean | null
          is_visible?: boolean | null
          label?: Json
          menu_location: string
          parent_id?: string | null
          sort_order?: number | null
          target?: string | null
          updated_at?: string | null
          url?: string | null
          visible_to_roles?: Database["public"]["Enums"]["app_role"][] | null
        }
        Update: {
          badge_color?: string | null
          badge_text?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_external?: boolean | null
          is_visible?: boolean | null
          label?: Json
          menu_location?: string
          parent_id?: string | null
          sort_order?: number | null
          target?: string | null
          updated_at?: string | null
          url?: string | null
          visible_to_roles?: Database["public"]["Enums"]["app_role"][] | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_navigation_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_navigation_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_notification_templates: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          message: Json
          template_key: string
          template_name: string
          title: Json
          updated_at: string | null
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message?: Json
          template_key: string
          template_name: string
          title?: Json
          updated_at?: string | null
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          message?: Json
          template_key?: string
          template_name?: string
          title?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_page_analytics: {
        Row: {
          avg_time_on_page: number | null
          bounce_rate: number | null
          conversion_rate: number | null
          conversions: number | null
          created_at: string | null
          date: string
          id: string
          page_id: string | null
          page_path: string
          page_title: string | null
          unique_visitors: number | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          page_id?: string | null
          page_path: string
          page_title?: string | null
          unique_visitors?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          conversion_rate?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          page_id?: string | null
          page_path?: string
          page_title?: string | null
          unique_visitors?: number | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_page_analytics_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_page_revisions: {
        Row: {
          change_summary: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          page_id: string
          revision_number: number
          title: Json
        }
        Insert: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          page_id: string
          revision_number?: number
          title?: Json
        }
        Update: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          page_id?: string
          revision_number?: number
          title?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cms_page_revisions_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_pages: {
        Row: {
          allowed_roles: Database["public"]["Enums"]["app_role"][] | null
          author_id: string | null
          content: Json
          created_at: string | null
          featured_image: string | null
          id: string
          is_homepage: boolean | null
          meta_description: Json | null
          meta_title: Json | null
          parent_id: string | null
          published_at: string | null
          requires_auth: boolean | null
          scheduled_at: string | null
          slug: string
          sort_order: number | null
          status: string | null
          template: string | null
          title: Json
          updated_at: string | null
        }
        Insert: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][] | null
          author_id?: string | null
          content?: Json
          created_at?: string | null
          featured_image?: string | null
          id?: string
          is_homepage?: boolean | null
          meta_description?: Json | null
          meta_title?: Json | null
          parent_id?: string | null
          published_at?: string | null
          requires_auth?: boolean | null
          scheduled_at?: string | null
          slug: string
          sort_order?: number | null
          status?: string | null
          template?: string | null
          title?: Json
          updated_at?: string | null
        }
        Update: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][] | null
          author_id?: string | null
          content?: Json
          created_at?: string | null
          featured_image?: string | null
          id?: string
          is_homepage?: boolean | null
          meta_description?: Json | null
          meta_title?: Json | null
          parent_id?: string | null
          published_at?: string | null
          requires_auth?: boolean | null
          scheduled_at?: string | null
          slug?: string
          sort_order?: number | null
          status?: string | null
          template?: string | null
          title?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cms_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_post_revisions: {
        Row: {
          change_summary: string | null
          content: Json
          created_at: string | null
          created_by: string | null
          id: string
          post_id: string
          revision_number: number
          title: Json
        }
        Insert: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          post_id: string
          revision_number?: number
          title?: Json
        }
        Update: {
          change_summary?: string | null
          content?: Json
          created_at?: string | null
          created_by?: string | null
          id?: string
          post_id?: string
          revision_number?: number
          title?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cms_post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "cms_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "cms_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "cms_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_posts: {
        Row: {
          allow_comments: boolean | null
          author_id: string | null
          category_id: string | null
          content: Json
          created_at: string | null
          excerpt: Json | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          meta_description: Json | null
          meta_title: Json | null
          published_at: string | null
          reading_time_minutes: number | null
          scheduled_at: string | null
          slug: string
          status: string
          title: Json
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          allow_comments?: boolean | null
          author_id?: string | null
          category_id?: string | null
          content?: Json
          created_at?: string | null
          excerpt?: Json | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          meta_description?: Json | null
          meta_title?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          slug: string
          status?: string
          title?: Json
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          allow_comments?: boolean | null
          author_id?: string | null
          category_id?: string | null
          content?: Json
          created_at?: string | null
          excerpt?: Json | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          meta_description?: Json | null
          meta_title?: Json | null
          published_at?: string | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          slug?: string
          status?: string
          title?: Json
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cms_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_realtime_visitors: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          device_type: string | null
          first_seen: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          page_path: string
          page_title: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          first_seen?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          page_path: string
          page_title?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          first_seen?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          page_path?: string
          page_title?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      cms_redirects: {
        Row: {
          created_at: string | null
          hit_count: number | null
          id: string
          is_active: boolean | null
          redirect_type: number | null
          source_path: string
          target_path: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          redirect_type?: number | null
          source_path: string
          target_path: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hit_count?: number | null
          id?: string
          is_active?: boolean | null
          redirect_type?: number | null
          source_path?: string
          target_path?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_seo_meta: {
        Row: {
          canonical_url: string | null
          created_at: string | null
          description: Json | null
          id: string
          keywords: Json | null
          og_description: Json | null
          og_image: string | null
          og_title: Json | null
          page_path: string
          robots: string | null
          structured_data: Json | null
          title: Json | null
          twitter_card: string | null
          updated_at: string | null
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          keywords?: Json | null
          og_description?: Json | null
          og_image?: string | null
          og_title?: Json | null
          page_path: string
          robots?: string | null
          structured_data?: Json | null
          title?: Json | null
          twitter_card?: string | null
          updated_at?: string | null
        }
        Update: {
          canonical_url?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          keywords?: Json | null
          og_description?: Json | null
          og_image?: string | null
          og_title?: Json | null
          page_path?: string
          robots?: string | null
          structured_data?: Json | null
          title?: Json | null
          twitter_card?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_site_settings: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          label: string
          setting_key: string
          setting_type: string
          setting_value: Json
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          label: string
          setting_key: string
          setting_type?: string
          setting_value?: Json
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          label?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: Json | null
          id: string
          is_active: boolean | null
          name: Json
          slug: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          is_active?: boolean | null
          name?: Json
          slug: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: Json | null
          id?: string
          is_active?: boolean | null
          name?: Json
          slug?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      cms_theme_config: {
        Row: {
          animations: Json | null
          borders: Json | null
          colors: Json | null
          created_at: string | null
          created_by: string | null
          custom_css: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          shadows: Json | null
          spacing: Json | null
          theme_name: string
          typography: Json | null
          updated_at: string | null
        }
        Insert: {
          animations?: Json | null
          borders?: Json | null
          colors?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_css?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          shadows?: Json | null
          spacing?: Json | null
          theme_name: string
          typography?: Json | null
          updated_at?: string | null
        }
        Update: {
          animations?: Json | null
          borders?: Json | null
          colors?: Json | null
          created_at?: string | null
          created_by?: string | null
          custom_css?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          shadows?: Json | null
          spacing?: Json | null
          theme_name?: string
          typography?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cms_translations: {
        Row: {
          created_at: string | null
          id: string
          is_reviewed: boolean | null
          locale: string
          namespace: string
          reviewed_at: string | null
          reviewed_by: string | null
          translation_key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_reviewed?: boolean | null
          locale: string
          namespace?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          translation_key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_reviewed?: boolean | null
          locale?: string
          namespace?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          translation_key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      cms_webhooks_config: {
        Row: {
          created_at: string | null
          created_by: string | null
          endpoint_url: string
          events: string[]
          headers: Json | null
          id: string
          is_active: boolean | null
          last_status: number | null
          last_triggered_at: string | null
          retry_count: number | null
          secret_key: string | null
          updated_at: string | null
          webhook_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          endpoint_url: string
          events: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_status?: number | null
          last_triggered_at?: string | null
          retry_count?: number | null
          secret_key?: string | null
          updated_at?: string | null
          webhook_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          endpoint_url?: string
          events?: string[]
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_status?: number | null
          last_triggered_at?: string | null
          retry_count?: number | null
          secret_key?: string | null
          updated_at?: string | null
          webhook_name?: string
        }
        Relationships: []
      }
      cms_widgets: {
        Row: {
          allowed_roles: Database["public"]["Enums"]["app_role"][] | null
          component_name: string
          created_at: string | null
          default_config: Json | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          widget_key: string
          widget_name: string
          widget_type: string
        }
        Insert: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][] | null
          component_name: string
          created_at?: string | null
          default_config?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          widget_key: string
          widget_name: string
          widget_type: string
        }
        Update: {
          allowed_roles?: Database["public"]["Enums"]["app_role"][] | null
          component_name?: string
          created_at?: string | null
          default_config?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          widget_key?: string
          widget_name?: string
          widget_type?: string
        }
        Relationships: []
      }
      cms_workflow_history: {
        Row: {
          changed_by: string | null
          comment: string | null
          content_id: string
          created_at: string | null
          from_status: string | null
          id: string
          to_status: string
          workflow_id: string | null
        }
        Insert: {
          changed_by?: string | null
          comment?: string | null
          content_id: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          to_status: string
          workflow_id?: string | null
        }
        Update: {
          changed_by?: string | null
          comment?: string | null
          content_id?: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          to_status?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cms_workflow_history_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "cms_content_workflow"
            referencedColumns: ["id"]
          },
        ]
      }
      cnae_bundles: {
        Row: {
          bundle_description: string | null
          bundle_name: string
          cnae_codes: string[]
          created_at: string | null
          discount_percentage: number
          id: string
          is_active: boolean | null
          is_ai_suggested: boolean | null
          max_discount_cap: number | null
          min_cnaes_required: number | null
          updated_at: string | null
        }
        Insert: {
          bundle_description?: string | null
          bundle_name: string
          cnae_codes: string[]
          created_at?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean | null
          is_ai_suggested?: boolean | null
          max_discount_cap?: number | null
          min_cnaes_required?: number | null
          updated_at?: string | null
        }
        Update: {
          bundle_description?: string | null
          bundle_name?: string
          cnae_codes?: string[]
          created_at?: string | null
          discount_percentage?: number
          id?: string
          is_active?: boolean | null
          is_ai_suggested?: boolean | null
          max_discount_cap?: number | null
          min_cnaes_required?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cnae_pricing: {
        Row: {
          base_price: number
          cnae_code: string
          complexity_tier: string
          created_at: string | null
          id: string
          includes_features: string[] | null
          is_active: boolean | null
          sector_category: string | null
          tier_multipliers: Json | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          cnae_code: string
          complexity_tier?: string
          created_at?: string | null
          id?: string
          includes_features?: string[] | null
          is_active?: boolean | null
          sector_category?: string | null
          tier_multipliers?: Json | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          cnae_code?: string
          complexity_tier?: string
          created_at?: string | null
          id?: string
          includes_features?: string[] | null
          is_active?: boolean | null
          sector_category?: string | null
          tier_multipliers?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cnae_sector_mapping: {
        Row: {
          cnae_code: string
          cnae_description: string | null
          created_at: string
          default_kpis: string[] | null
          default_regulations: string[] | null
          id: string
          sector: string
          sector_name: string
        }
        Insert: {
          cnae_code: string
          cnae_description?: string | null
          created_at?: string
          default_kpis?: string[] | null
          default_regulations?: string[] | null
          id?: string
          sector: string
          sector_name: string
        }
        Update: {
          cnae_code?: string
          cnae_description?: string | null
          created_at?: string
          default_kpis?: string[] | null
          default_regulations?: string[] | null
          id?: string
          sector?: string
          sector_name?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string
          beneficios: number | null
          bp: string | null
          client_type: string | null
          cnae: string | null
          created_at: string | null
          email: string | null
          employees: number | null
          facturacion_anual: number | null
          fecha_ultima_visita: string | null
          gestor_id: string | null
          id: string
          import_batch_id: string | null
          ingresos_creand: number | null
          is_vip: boolean | null
          latitude: number
          legal_form: string | null
          longitude: number
          name: string
          observaciones: string | null
          oficina: string | null
          parroquia: string
          periodo_facturacion: string | null
          phone: string | null
          pl_banco: number | null
          registration_number: string | null
          sector: string | null
          status_id: string | null
          tags: string[] | null
          tax_id: string | null
          turnover: number | null
          updated_at: string | null
          vinculacion_entidad_1: number | null
          vinculacion_entidad_2: number | null
          vinculacion_entidad_3: number | null
          vinculacion_modo: string | null
          vip_notes: string | null
          website: string | null
        }
        Insert: {
          address: string
          beneficios?: number | null
          bp?: string | null
          client_type?: string | null
          cnae?: string | null
          created_at?: string | null
          email?: string | null
          employees?: number | null
          facturacion_anual?: number | null
          fecha_ultima_visita?: string | null
          gestor_id?: string | null
          id?: string
          import_batch_id?: string | null
          ingresos_creand?: number | null
          is_vip?: boolean | null
          latitude: number
          legal_form?: string | null
          longitude: number
          name: string
          observaciones?: string | null
          oficina?: string | null
          parroquia: string
          periodo_facturacion?: string | null
          phone?: string | null
          pl_banco?: number | null
          registration_number?: string | null
          sector?: string | null
          status_id?: string | null
          tags?: string[] | null
          tax_id?: string | null
          turnover?: number | null
          updated_at?: string | null
          vinculacion_entidad_1?: number | null
          vinculacion_entidad_2?: number | null
          vinculacion_entidad_3?: number | null
          vinculacion_modo?: string | null
          vip_notes?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          beneficios?: number | null
          bp?: string | null
          client_type?: string | null
          cnae?: string | null
          created_at?: string | null
          email?: string | null
          employees?: number | null
          facturacion_anual?: number | null
          fecha_ultima_visita?: string | null
          gestor_id?: string | null
          id?: string
          import_batch_id?: string | null
          ingresos_creand?: number | null
          is_vip?: boolean | null
          latitude?: number
          legal_form?: string | null
          longitude?: number
          name?: string
          observaciones?: string | null
          oficina?: string | null
          parroquia?: string
          periodo_facturacion?: string | null
          phone?: string | null
          pl_banco?: number | null
          registration_number?: string | null
          sector?: string | null
          status_id?: string | null
          tags?: string[] | null
          tax_id?: string | null
          turnover?: number | null
          updated_at?: string | null
          vinculacion_entidad_1?: number | null
          vinculacion_entidad_2?: number | null
          vinculacion_entidad_3?: number | null
          vinculacion_modo?: string | null
          vip_notes?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_colors"
            referencedColumns: ["id"]
          },
        ]
      }
      company_bank_affiliations: {
        Row: {
          account_number: string | null
          active: boolean | null
          affiliation_percentage: number | null
          affiliation_type: string | null
          bank_code: string | null
          bank_name: string
          company_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          notes: string | null
          priority_order: number | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          active?: boolean | null
          affiliation_percentage?: number | null
          affiliation_type?: string | null
          bank_code?: string | null
          bank_name: string
          company_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          priority_order?: number | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          active?: boolean | null
          affiliation_percentage?: number | null
          affiliation_type?: string | null
          bank_code?: string | null
          bank_name?: string
          company_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          priority_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_cnaes: {
        Row: {
          cnae_code: string
          company_id: string
          created_at: string | null
          discount_applied: number | null
          id: string
          installed_module_id: string | null
          is_primary: boolean | null
          license_price: number | null
          percentage_activity: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          cnae_code: string
          company_id: string
          created_at?: string | null
          discount_applied?: number | null
          id?: string
          installed_module_id?: string | null
          is_primary?: boolean | null
          license_price?: number | null
          percentage_activity?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          cnae_code?: string
          company_id?: string
          created_at?: string | null
          discount_applied?: number | null
          id?: string
          installed_module_id?: string | null
          is_primary?: boolean | null
          license_price?: number | null
          percentage_activity?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_cnaes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_cnaes_installed_module_id_fkey"
            columns: ["installed_module_id"]
            isOneToOne: false
            referencedRelation: "installed_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      company_contacts: {
        Row: {
          company_id: string
          contact_name: string
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          notes: string | null
          phone: string | null
          position: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          contact_name: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          contact_name?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_documents: {
        Row: {
          company_id: string
          created_at: string | null
          document_name: string
          document_type: string | null
          document_url: string | null
          file_size: number | null
          id: string
          notes: string | null
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          document_name: string
          document_type?: string | null
          document_url?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          document_name?: string
          document_type?: string | null
          document_url?: string | null
          file_size?: number | null
          id?: string
          notes?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_financial_statements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          fiscal_year: number
          id: string
          is_archived: boolean
          source: Database["public"]["Enums"]["financial_data_source"]
          statement_type: Database["public"]["Enums"]["financial_statement_type"]
          status: Database["public"]["Enums"]["financial_statement_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          fiscal_year: number
          id?: string
          is_archived?: boolean
          source?: Database["public"]["Enums"]["financial_data_source"]
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
          status?: Database["public"]["Enums"]["financial_statement_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          id?: string
          is_archived?: boolean
          source?: Database["public"]["Enums"]["financial_data_source"]
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
          status?: Database["public"]["Enums"]["financial_statement_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_financial_statements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_financial_statements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_financial_statements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_photos: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string | null
          photo_url: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_url?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_photos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_products: {
        Row: {
          active: boolean | null
          company_id: string
          contract_date: string | null
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          active?: boolean | null
          company_id: string
          contract_date?: string | null
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          active?: boolean | null
          company_id?: string
          contract_date?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      company_tpv_terminals: {
        Row: {
          commission_rate: number | null
          company_id: string
          created_at: string
          id: string
          installation_date: string | null
          monthly_transactions: number | null
          monthly_volume: number | null
          notes: string | null
          provider: string
          status: string | null
          terminal_id: string
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          company_id: string
          created_at?: string
          id?: string
          installation_date?: string | null
          monthly_transactions?: number | null
          monthly_volume?: number | null
          notes?: string | null
          provider: string
          status?: string | null
          terminal_id: string
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          company_id?: string
          created_at?: string
          id?: string
          installation_date?: string | null
          monthly_transactions?: number | null
          monthly_volume?: number | null
          notes?: string | null
          provider?: string
          status?: string | null
          terminal_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_company_tpv"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          document_id: string
          employee_id: string
          id: string
          ip_address: string | null
          notes: string | null
          signature_hash: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          document_id: string
          employee_id: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          signature_hash?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          document_id?: string
          employee_id?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          signature_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_acknowledgments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          category: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          document_id: string
          due_date: string | null
          evidence_urls: string[] | null
          id: string
          notes: string | null
          organization_id: string | null
          priority: string | null
          requirement_description: string | null
          requirement_key: string
          requirement_title: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          document_id: string
          due_date?: string | null
          evidence_urls?: string[] | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          priority?: string | null
          requirement_description?: string | null
          requirement_key: string
          requirement_title: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          document_id?: string
          due_date?: string | null
          evidence_urls?: string[] | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          priority?: string | null
          requirement_description?: string | null
          requirement_key?: string
          requirement_title?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_requirements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_review_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          document_id: string | null
          due_date: string | null
          id: string
          organization_id: string | null
          priority: string | null
          requirement_id: string | null
          result: string | null
          status: string | null
          task_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          requirement_id?: string | null
          result?: string | null
          status?: string | null
          task_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          requirement_id?: string | null
          result?: string | null
          status?: string | null
          task_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_review_tasks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_review_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_review_tasks_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "compliance_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      concepts: {
        Row: {
          active: boolean | null
          concept_key: string
          concept_type: string
          concept_value: string
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          concept_key: string
          concept_type: string
          concept_value: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          concept_key?: string
          concept_type?: string
          concept_value?: string
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consolidated_balance_sheets: {
        Row: {
          accruals_assets: number | null
          available_for_sale_assets_adjustment: number | null
          capital_grants: number | null
          cash_equivalents: number | null
          created_at: string
          current_year_result: number | null
          deferred_tax_assets: number | null
          deferred_tax_liabilities: number | null
          goodwill: number | null
          goodwill_eliminations: number | null
          hedging_operations_adjustment: number | null
          id: string
          intangible_assets: number | null
          intercompany_eliminations: number | null
          interim_dividend: number | null
          inventory: number | null
          legal_reserve: number | null
          liabilities_held_for_sale: number | null
          long_term_accruals: number | null
          long_term_debts: number | null
          long_term_financial_investments: number | null
          long_term_group_debts: number | null
          long_term_group_investments: number | null
          long_term_provisions: number | null
          long_term_trade_receivables: number | null
          minority_interests: number | null
          non_current_assets_held_for_sale: number | null
          other_creditors: number | null
          other_equity_instruments: number | null
          other_value_adjustments: number | null
          real_estate_investments: number | null
          retained_earnings: number | null
          revaluation_reserve: number | null
          share_capital: number | null
          share_premium: number | null
          short_term_accruals: number | null
          short_term_debts: number | null
          short_term_financial_investments: number | null
          short_term_group_debts: number | null
          short_term_group_receivables: number | null
          short_term_provisions: number | null
          statement_id: string
          statutory_reserves: number | null
          tangible_assets: number | null
          trade_payables: number | null
          trade_receivables: number | null
          translation_differences: number | null
          treasury_shares: number | null
          updated_at: string
          voluntary_reserves: number | null
        }
        Insert: {
          accruals_assets?: number | null
          available_for_sale_assets_adjustment?: number | null
          capital_grants?: number | null
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          goodwill?: number | null
          goodwill_eliminations?: number | null
          hedging_operations_adjustment?: number | null
          id?: string
          intangible_assets?: number | null
          intercompany_eliminations?: number | null
          interim_dividend?: number | null
          inventory?: number | null
          legal_reserve?: number | null
          liabilities_held_for_sale?: number | null
          long_term_accruals?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_group_debts?: number | null
          long_term_group_investments?: number | null
          long_term_provisions?: number | null
          long_term_trade_receivables?: number | null
          minority_interests?: number | null
          non_current_assets_held_for_sale?: number | null
          other_creditors?: number | null
          other_equity_instruments?: number | null
          other_value_adjustments?: number | null
          real_estate_investments?: number | null
          retained_earnings?: number | null
          revaluation_reserve?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_accruals?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_group_debts?: number | null
          short_term_group_receivables?: number | null
          short_term_provisions?: number | null
          statement_id: string
          statutory_reserves?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          translation_differences?: number | null
          treasury_shares?: number | null
          updated_at?: string
          voluntary_reserves?: number | null
        }
        Update: {
          accruals_assets?: number | null
          available_for_sale_assets_adjustment?: number | null
          capital_grants?: number | null
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          goodwill?: number | null
          goodwill_eliminations?: number | null
          hedging_operations_adjustment?: number | null
          id?: string
          intangible_assets?: number | null
          intercompany_eliminations?: number | null
          interim_dividend?: number | null
          inventory?: number | null
          legal_reserve?: number | null
          liabilities_held_for_sale?: number | null
          long_term_accruals?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_group_debts?: number | null
          long_term_group_investments?: number | null
          long_term_provisions?: number | null
          long_term_trade_receivables?: number | null
          minority_interests?: number | null
          non_current_assets_held_for_sale?: number | null
          other_creditors?: number | null
          other_equity_instruments?: number | null
          other_value_adjustments?: number | null
          real_estate_investments?: number | null
          retained_earnings?: number | null
          revaluation_reserve?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_accruals?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_group_debts?: number | null
          short_term_group_receivables?: number | null
          short_term_provisions?: number | null
          statement_id?: string
          statutory_reserves?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          translation_differences?: number | null
          treasury_shares?: number | null
          updated_at?: string
          voluntary_reserves?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consolidated_balance_sheets_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "consolidated_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidated_financial_statements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          fiscal_year: number
          group_id: string
          id: string
          source: string
          statement_type: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          fiscal_year: number
          group_id: string
          id?: string
          source?: string
          statement_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          group_id?: string
          id?: string
          source?: string
          statement_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidated_financial_statements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidated_financial_statements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidated_financial_statements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "consolidation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidation_group_members: {
        Row: {
          company_id: string
          consolidation_method: string
          created_at: string
          group_id: string
          id: string
          is_parent: boolean
          participation_percentage: number
        }
        Insert: {
          company_id: string
          consolidation_method?: string
          created_at?: string
          group_id: string
          id?: string
          is_parent?: boolean
          participation_percentage?: number
        }
        Update: {
          company_id?: string
          consolidation_method?: string
          created_at?: string
          group_id?: string
          id?: string
          is_parent?: boolean
          participation_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_group_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "consolidation_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidation_groups: {
        Row: {
          created_at: string
          created_by: string | null
          fiscal_year: number
          group_name: string
          id: string
          notes: string | null
          parent_company_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fiscal_year: number
          group_name: string
          id?: string
          notes?: string | null
          parent_company_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          group_name?: string
          id?: string
          notes?: string | null
          parent_company_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidation_groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidation_groups_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      continuous_controls: {
        Row: {
          auto_generate_evidence: boolean | null
          check_frequency: string
          check_logic: Json | null
          check_query: string | null
          control_category: string
          control_code: string
          control_description: string | null
          control_name: string
          created_at: string | null
          evidence_template: Json | null
          id: string
          is_active: boolean | null
          last_execution_at: string | null
          notification_channels: string[] | null
          notification_recipients: Json | null
          remediation_steps: Json | null
          severity_on_failure: string | null
          threshold_config: Json | null
          updated_at: string | null
        }
        Insert: {
          auto_generate_evidence?: boolean | null
          check_frequency: string
          check_logic?: Json | null
          check_query?: string | null
          control_category: string
          control_code: string
          control_description?: string | null
          control_name: string
          created_at?: string | null
          evidence_template?: Json | null
          id?: string
          is_active?: boolean | null
          last_execution_at?: string | null
          notification_channels?: string[] | null
          notification_recipients?: Json | null
          remediation_steps?: Json | null
          severity_on_failure?: string | null
          threshold_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          auto_generate_evidence?: boolean | null
          check_frequency?: string
          check_logic?: Json | null
          check_query?: string | null
          control_category?: string
          control_code?: string
          control_description?: string | null
          control_name?: string
          created_at?: string | null
          evidence_template?: Json | null
          id?: string
          is_active?: boolean | null
          last_execution_at?: string | null
          notification_channels?: string[] | null
          notification_recipients?: Json | null
          remediation_steps?: Json | null
          severity_on_failure?: string | null
          threshold_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      control_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          affected_count: number | null
          affected_entities: Json | null
          alert_type: string
          control_id: string
          created_at: string | null
          description: string | null
          evidence_summary: Json | null
          execution_id: string | null
          id: string
          recommended_actions: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_count?: number | null
          affected_entities?: Json | null
          alert_type: string
          control_id: string
          created_at?: string | null
          description?: string | null
          evidence_summary?: Json | null
          execution_id?: string | null
          id?: string
          recommended_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_count?: number | null
          affected_entities?: Json | null
          alert_type?: string
          control_id?: string
          created_at?: string | null
          description?: string | null
          evidence_summary?: Json | null
          execution_id?: string | null
          id?: string
          recommended_actions?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_alerts_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "continuous_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_alerts_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "control_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      control_executions: {
        Row: {
          ai_analysis: string | null
          ai_recommendations: Json | null
          control_id: string
          created_at: string | null
          error_message: string | null
          evidence_ids: string[] | null
          execution_end: string | null
          execution_start: string
          findings: Json | null
          id: string
          items_checked: number | null
          items_failed: number | null
          items_passed: number | null
          metrics_collected: Json | null
          status: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_recommendations?: Json | null
          control_id: string
          created_at?: string | null
          error_message?: string | null
          evidence_ids?: string[] | null
          execution_end?: string | null
          execution_start?: string
          findings?: Json | null
          id?: string
          items_checked?: number | null
          items_failed?: number | null
          items_passed?: number | null
          metrics_collected?: Json | null
          status?: string
        }
        Update: {
          ai_analysis?: string | null
          ai_recommendations?: Json | null
          control_id?: string
          created_at?: string | null
          error_message?: string | null
          evidence_ids?: string[] | null
          execution_end?: string | null
          execution_start?: string
          findings?: Json | null
          id?: string
          items_checked?: number | null
          items_failed?: number | null
          items_passed?: number | null
          metrics_collected?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "control_executions_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "continuous_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          company_id: string | null
          created_at: string
          generated_at: string
          id: string
          key_topics: string[] | null
          last_activity: string | null
          message_count: number | null
          room_id: string | null
          sentiment: string | null
          summary_text: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          key_topics?: string[] | null
          last_activity?: string | null
          message_count?: number | null
          room_id?: string | null
          sentiment?: string | null
          summary_text?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          key_topics?: string[] | null
          last_activity?: string | null
          message_count?: number | null
          room_id?: string | null
          sentiment?: string | null
          summary_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_summaries_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_action_log: {
        Row: {
          action_data: Json | null
          action_source: string
          action_type: string
          ai_reasoning: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          executed_at: string | null
          id: string
          outcome: string | null
          outcome_details: Json | null
          outcome_value: number | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          action_data?: Json | null
          action_source: string
          action_type: string
          ai_reasoning?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          id?: string
          outcome?: string | null
          outcome_details?: Json | null
          outcome_value?: number | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          action_data?: Json | null
          action_source?: string
          action_type?: string
          ai_reasoning?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          executed_at?: string | null
          id?: string
          outcome?: string | null
          outcome_details?: Json | null
          outcome_value?: number | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_action_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "copilot_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_role_configs: {
        Row: {
          available_tools: Json | null
          context_sources: string[] | null
          copilot_description: string | null
          copilot_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          priority_metrics: string[] | null
          quick_actions: Json | null
          role: string
          system_prompt: string
          updated_at: string | null
        }
        Insert: {
          available_tools?: Json | null
          context_sources?: string[] | null
          copilot_description?: string | null
          copilot_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority_metrics?: string[] | null
          quick_actions?: Json | null
          role: string
          system_prompt: string
          updated_at?: string | null
        }
        Update: {
          available_tools?: Json | null
          context_sources?: string[] | null
          copilot_description?: string | null
          copilot_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          priority_metrics?: string[] | null
          quick_actions?: Json | null
          role?: string
          system_prompt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      copilot_sessions: {
        Row: {
          active_suggestions: Json | null
          context_data: Json | null
          created_at: string | null
          id: string
          last_interaction: string | null
          metrics_snapshot: Json | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_suggestions?: Json | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          last_interaction?: string | null
          metrics_snapshot?: Json | null
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_suggestions?: Json | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          last_interaction?: string | null
          metrics_snapshot?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      core_banking_configs: {
        Row: {
          api_endpoint: string
          api_version: string | null
          auth_config: Json | null
          auth_type: string
          core_type: string
          created_at: string | null
          created_by: string | null
          entity_name: string
          id: string
          is_active: boolean | null
          retry_config: Json | null
          timeout_ms: number | null
          updated_at: string | null
        }
        Insert: {
          api_endpoint: string
          api_version?: string | null
          auth_config?: Json | null
          auth_type: string
          core_type: string
          created_at?: string | null
          created_by?: string | null
          entity_name: string
          id?: string
          is_active?: boolean | null
          retry_config?: Json | null
          timeout_ms?: number | null
          updated_at?: string | null
        }
        Update: {
          api_endpoint?: string
          api_version?: string | null
          auth_config?: Json | null
          auth_type?: string
          core_type?: string
          created_at?: string | null
          created_by?: string | null
          entity_name?: string
          id?: string
          is_active?: boolean | null
          retry_config?: Json | null
          timeout_ms?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_360_profiles: {
        Row: {
          active_products: number | null
          avg_monthly_volume: number | null
          avg_visit_frequency_days: number | null
          churn_probability: number | null
          clv_score: number | null
          communication_preferences: Json | null
          company_id: string | null
          compliance_status: string | null
          created_at: string | null
          credit_score: number | null
          cross_sell_opportunities: Json | null
          health_score: number | null
          id: string
          interaction_summary: Json | null
          last_calculated_at: string | null
          last_visit_date: string | null
          lifecycle_stage: string | null
          next_best_actions: Json | null
          preferred_channel: string | null
          preferred_contact_time: string | null
          recommended_products: Json | null
          rfm_score: Json | null
          risk_flags: Json | null
          segment: string | null
          successful_visits: number | null
          tier: string | null
          total_products: number | null
          total_transaction_volume: number | null
          total_visits: number | null
          updated_at: string | null
        }
        Insert: {
          active_products?: number | null
          avg_monthly_volume?: number | null
          avg_visit_frequency_days?: number | null
          churn_probability?: number | null
          clv_score?: number | null
          communication_preferences?: Json | null
          company_id?: string | null
          compliance_status?: string | null
          created_at?: string | null
          credit_score?: number | null
          cross_sell_opportunities?: Json | null
          health_score?: number | null
          id?: string
          interaction_summary?: Json | null
          last_calculated_at?: string | null
          last_visit_date?: string | null
          lifecycle_stage?: string | null
          next_best_actions?: Json | null
          preferred_channel?: string | null
          preferred_contact_time?: string | null
          recommended_products?: Json | null
          rfm_score?: Json | null
          risk_flags?: Json | null
          segment?: string | null
          successful_visits?: number | null
          tier?: string | null
          total_products?: number | null
          total_transaction_volume?: number | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Update: {
          active_products?: number | null
          avg_monthly_volume?: number | null
          avg_visit_frequency_days?: number | null
          churn_probability?: number | null
          clv_score?: number | null
          communication_preferences?: Json | null
          company_id?: string | null
          compliance_status?: string | null
          created_at?: string | null
          credit_score?: number | null
          cross_sell_opportunities?: Json | null
          health_score?: number | null
          id?: string
          interaction_summary?: Json | null
          last_calculated_at?: string | null
          last_visit_date?: string | null
          lifecycle_stage?: string | null
          next_best_actions?: Json | null
          preferred_channel?: string | null
          preferred_contact_time?: string | null
          recommended_products?: Json | null
          rfm_score?: Json | null
          risk_flags?: Json | null
          segment?: string | null
          successful_visits?: number | null
          tier?: string | null
          total_products?: number | null
          total_transaction_volume?: number | null
          total_visits?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_360_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_action_recommendations: {
        Row: {
          action_description: string | null
          action_title: string
          action_type: string
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          due_date: string | null
          estimated_value: number | null
          expected_impact: string | null
          id: string
          priority: number | null
          source_model: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          action_description?: string | null
          action_title: string
          action_type: string
          assigned_to?: string | null
          company_id: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          due_date?: string | null
          estimated_value?: number | null
          expected_impact?: string | null
          id?: string
          priority?: number | null
          source_model?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          action_description?: string | null
          action_title?: string
          action_type?: string
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          due_date?: string | null
          estimated_value?: number | null
          expected_impact?: string | null
          id?: string
          priority?: number | null
          source_model?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_action_recommendations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_consents: {
        Row: {
          company_id: string | null
          consent_type: string
          contact_id: string | null
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          id: string
          ip_address: string | null
          legal_basis: string | null
          metadata: Json | null
          source: string | null
          status: string
          updated_at: string | null
          user_agent: string | null
          version: string | null
          withdrawn_at: string | null
        }
        Insert: {
          company_id?: string | null
          consent_type: string
          contact_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          legal_basis?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
          version?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          company_id?: string | null
          consent_type?: string
          contact_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          ip_address?: string | null
          legal_basis?: string | null
          metadata?: Json | null
          source?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
          version?: string | null
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_consents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_consents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_interactions: {
        Row: {
          channel: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          importance: string | null
          interaction_date: string
          interaction_type: string
          metadata: Json | null
          outcome: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          sentiment: string | null
          subject: string | null
        }
        Insert: {
          channel?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          importance?: string | null
          interaction_date: string
          interaction_type: string
          metadata?: Json | null
          outcome?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sentiment?: string | null
          subject?: string | null
        }
        Update: {
          channel?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          importance?: string | null
          interaction_date?: string
          interaction_type?: string
          metadata?: Json | null
          outcome?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          sentiment?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_interactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_journeys: {
        Row: {
          bpmn_process_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_segment_id: string | null
          exit_conditions: Json | null
          goals: Json | null
          id: string
          name: string
          stats: Json | null
          status: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          bpmn_process_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_segment_id?: string | null
          exit_conditions?: Json | null
          goals?: Json | null
          id?: string
          name: string
          stats?: Json | null
          status?: string
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          bpmn_process_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_segment_id?: string | null
          exit_conditions?: Json | null
          goals?: Json | null
          id?: string
          name?: string
          stats?: Json | null
          status?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_journeys_bpmn_process_id_fkey"
            columns: ["bpmn_process_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_quote_items: {
        Row: {
          created_at: string
          custom_price: number
          id: string
          license_type: string
          module_key: string
          module_name: string
          notes: string | null
          quantity: number
          quote_id: string
        }
        Insert: {
          created_at?: string
          custom_price: number
          id?: string
          license_type?: string
          module_key: string
          module_name: string
          notes?: string | null
          quantity?: number
          quote_id: string
        }
        Update: {
          created_at?: string
          custom_price?: number
          id?: string
          license_type?: string
          module_key?: string
          module_name?: string
          notes?: string | null
          quantity?: number
          quote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "customer_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_quotes: {
        Row: {
          assigned_by: string | null
          created_at: string
          customer_company: string | null
          customer_email: string
          customer_name: string | null
          customer_tax_id: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          customer_company?: string | null
          customer_email: string
          customer_name?: string | null
          customer_tax_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          customer_company?: string | null
          customer_email?: string
          customer_name?: string | null
          customer_tax_id?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      customer_rfm_scores: {
        Row: {
          calculated_at: string
          company_id: string
          created_at: string
          frequency_count: number
          frequency_score: number
          id: string
          monetary_score: number
          monetary_value: number
          recency_days: number
          recency_score: number
          recommended_actions: string[] | null
          rfm_score: number | null
          rfm_segment: string
          segment_description: string | null
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          company_id: string
          created_at?: string
          frequency_count?: number
          frequency_score: number
          id?: string
          monetary_score: number
          monetary_value?: number
          recency_days?: number
          recency_score: number
          recommended_actions?: string[] | null
          rfm_score?: number | null
          rfm_segment: string
          segment_description?: string | null
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          company_id?: string
          created_at?: string
          frequency_count?: number
          frequency_score?: number
          id?: string
          monetary_score?: number
          monetary_value?: number
          recency_days?: number
          recency_score?: number
          recommended_actions?: string[] | null
          rfm_score?: number | null
          rfm_segment?: string
          segment_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_rfm_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          calculated_at: string
          churn_probability: number | null
          churn_risk_level: string | null
          clv_estimate: number | null
          clv_percentile: number | null
          company_id: string
          created_at: string
          decision_path: string[] | null
          engagement_score: number | null
          feature_importance: Json | null
          id: string
          loyalty_score: number | null
          model_confidence: number | null
          model_version: string | null
          next_best_action: string | null
          priority_score: number | null
          profitability_tier: string | null
          recommended_actions: Json | null
          segment_name: string
          segment_type: string
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          churn_probability?: number | null
          churn_risk_level?: string | null
          clv_estimate?: number | null
          clv_percentile?: number | null
          company_id: string
          created_at?: string
          decision_path?: string[] | null
          engagement_score?: number | null
          feature_importance?: Json | null
          id?: string
          loyalty_score?: number | null
          model_confidence?: number | null
          model_version?: string | null
          next_best_action?: string | null
          priority_score?: number | null
          profitability_tier?: string | null
          recommended_actions?: Json | null
          segment_name: string
          segment_type?: string
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          churn_probability?: number | null
          churn_risk_level?: string | null
          clv_estimate?: number | null
          clv_percentile?: number | null
          company_id?: string
          created_at?: string
          decision_path?: string[] | null
          engagement_score?: number | null
          feature_importance?: Json | null
          id?: string
          loyalty_score?: number | null
          model_confidence?: number | null
          model_version?: string | null
          next_best_action?: string | null
          priority_score?: number | null
          profitability_tier?: string | null
          recommended_actions?: Json | null
          segment_name?: string
          segment_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_segments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      data_processing_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          ip_address: unknown
          policy_version: string
          revoked_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          policy_version?: string
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          ip_address?: unknown
          policy_version?: string
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          assigned_to: string | null
          availability: Json | null
          company: string
          company_size: string | null
          contacted_at: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          notes: string | null
          phone: string | null
          position: string | null
          scheduled_at: string | null
          sector: string | null
          source_page: string | null
          status: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          assigned_to?: string | null
          availability?: Json | null
          company: string
          company_size?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          scheduled_at?: string | null
          sector?: string | null
          source_page?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          assigned_to?: string | null
          availability?: Json | null
          company?: string
          company_size?: string | null
          contacted_at?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          scheduled_at?: string | null
          sector?: string | null
          source_page?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_sessions: {
        Row: {
          cleanup_status: string | null
          created_at: string
          created_companies: number | null
          created_goals: number | null
          created_visits: number | null
          data_ids: Json | null
          demo_user_id: string | null
          ended_at: string | null
          id: string
          ip_address: string | null
          sections_visited: string[] | null
          selected_role: string
          started_at: string
          tour_completed: boolean | null
          tour_step: number | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          cleanup_status?: string | null
          created_at?: string
          created_companies?: number | null
          created_goals?: number | null
          created_visits?: number | null
          data_ids?: Json | null
          demo_user_id?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          sections_visited?: string[] | null
          selected_role: string
          started_at?: string
          tour_completed?: boolean | null
          tour_step?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          cleanup_status?: string | null
          created_at?: string
          created_companies?: number | null
          created_goals?: number | null
          created_visits?: number | null
          data_ids?: Json | null
          demo_user_id?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          sections_visited?: string[] | null
          selected_role?: string
          started_at?: string
          tour_completed?: boolean | null
          tour_step?: number | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      developer_api_keys: {
        Row: {
          allowed_ips: string[] | null
          allowed_origins: string[] | null
          api_key_hash: string
          created_at: string | null
          environment: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_name: string
          key_prefix: string
          last_used_at: string | null
          partner_company_id: string | null
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          revoked_at: string | null
          revoked_reason: string | null
          scopes: string[] | null
          total_requests: number | null
          user_id: string
        }
        Insert: {
          allowed_ips?: string[] | null
          allowed_origins?: string[] | null
          api_key_hash: string
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          partner_company_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          revoked_reason?: string | null
          scopes?: string[] | null
          total_requests?: number | null
          user_id: string
        }
        Update: {
          allowed_ips?: string[] | null
          allowed_origins?: string[] | null
          api_key_hash?: string
          created_at?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          partner_company_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          revoked_reason?: string | null
          scopes?: string[] | null
          total_requests?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_api_keys_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      dora_compliance_items: {
        Row: {
          article: string
          completion_date: string | null
          created_at: string
          evidence_description: string | null
          evidence_url: string | null
          id: string
          implementation_status: string
          notes: string | null
          priority: string | null
          requirement_category: string
          requirement_description: string | null
          requirement_title: string
          responsible_person: string | null
          target_date: string | null
          updated_at: string
        }
        Insert: {
          article: string
          completion_date?: string | null
          created_at?: string
          evidence_description?: string | null
          evidence_url?: string | null
          id?: string
          implementation_status?: string
          notes?: string | null
          priority?: string | null
          requirement_category: string
          requirement_description?: string | null
          requirement_title: string
          responsible_person?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Update: {
          article?: string
          completion_date?: string | null
          created_at?: string
          evidence_description?: string | null
          evidence_url?: string | null
          id?: string
          implementation_status?: string
          notes?: string | null
          priority?: string | null
          requirement_category?: string
          requirement_description?: string | null
          requirement_title?: string
          responsible_person?: string | null
          target_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dynamic_kpis: {
        Row: {
          alert_status: string | null
          alert_threshold_high: number | null
          alert_threshold_low: number | null
          benchmark_percentile: number | null
          benchmark_value: number | null
          calculation_formula: Json | null
          change_percentage: number | null
          confidence_score: number | null
          created_at: string
          current_value: number | null
          data_sources: string[] | null
          entity_id: string
          entity_type: string
          id: string
          kpi_category: string
          kpi_code: string
          kpi_name: string
          metadata: Json | null
          period_end: string
          period_start: string
          period_type: string
          previous_value: number | null
          sector_average: number | null
          trend: string | null
          trend_strength: number | null
          updated_at: string
        }
        Insert: {
          alert_status?: string | null
          alert_threshold_high?: number | null
          alert_threshold_low?: number | null
          benchmark_percentile?: number | null
          benchmark_value?: number | null
          calculation_formula?: Json | null
          change_percentage?: number | null
          confidence_score?: number | null
          created_at?: string
          current_value?: number | null
          data_sources?: string[] | null
          entity_id: string
          entity_type: string
          id?: string
          kpi_category: string
          kpi_code: string
          kpi_name: string
          metadata?: Json | null
          period_end: string
          period_start: string
          period_type: string
          previous_value?: number | null
          sector_average?: number | null
          trend?: string | null
          trend_strength?: number | null
          updated_at?: string
        }
        Update: {
          alert_status?: string | null
          alert_threshold_high?: number | null
          alert_threshold_low?: number | null
          benchmark_percentile?: number | null
          benchmark_value?: number | null
          calculation_formula?: Json | null
          change_percentage?: number | null
          confidence_score?: number | null
          created_at?: string
          current_value?: number | null
          data_sources?: string[] | null
          entity_id?: string
          entity_type?: string
          id?: string
          kpi_category?: string
          kpi_code?: string
          kpi_name?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          period_type?: string
          previous_value?: number | null
          sector_average?: number | null
          trend?: string | null
          trend_strength?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      email_reminder_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean
          id: string
          updated_at: string | null
          urgency_level: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean
          id?: string
          updated_at?: string | null
          urgency_level?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean
          id?: string
          updated_at?: string | null
          urgency_level?: string
          user_id?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          html_content: string
          id: string
          is_active: boolean | null
          subject: string
          template_name: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          subject: string
          template_name: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          subject?: string
          template_name?: string
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      encrypted_fields: {
        Row: {
          created_at: string | null
          created_by: string | null
          encrypted_value: string
          entity_id: string
          entity_type: string
          field_name: string
          id: string
          iv: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          encrypted_value: string
          entity_id: string
          entity_type: string
          field_name: string
          id?: string
          iv: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          encrypted_value?: string
          entity_id?: string
          entity_type?: string
          field_name?: string
          id?: string
          iv?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enriched_transactions: {
        Row: {
          amount: number
          category: string | null
          company_id: string | null
          confidence_score: number | null
          created_at: string | null
          enriched_at: string | null
          id: string
          is_recurring: boolean | null
          location: Json | null
          mcc_code: string | null
          merchant_logo_url: string | null
          merchant_name: string | null
          original_transaction_id: string | null
          raw_description: string | null
          recurring_frequency: string | null
          recurring_type: string | null
          subcategory: string | null
          transaction_date: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          enriched_at?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: Json | null
          mcc_code?: string | null
          merchant_logo_url?: string | null
          merchant_name?: string | null
          original_transaction_id?: string | null
          raw_description?: string | null
          recurring_frequency?: string | null
          recurring_type?: string | null
          subcategory?: string | null
          transaction_date: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          company_id?: string | null
          confidence_score?: number | null
          created_at?: string | null
          enriched_at?: string | null
          id?: string
          is_recurring?: boolean | null
          location?: Json | null
          mcc_code?: string | null
          merchant_logo_url?: string | null
          merchant_name?: string | null
          original_transaction_id?: string | null
          raw_description?: string | null
          recurring_frequency?: string | null
          recurring_type?: string | null
          subcategory?: string | null
          transaction_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enriched_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      equity_changes_statements: {
        Row: {
          adjusted_initial_grants: number | null
          adjusted_initial_other_equity: number | null
          adjusted_initial_reserves: number | null
          adjusted_initial_result: number | null
          adjusted_initial_retained_earnings: number | null
          adjusted_initial_share_capital: number | null
          adjusted_initial_share_premium: number | null
          adjusted_initial_treasury_shares: number | null
          adjusted_initial_value_adjustments: number | null
          created_at: string
          criterion_changes_reserves: number | null
          criterion_changes_retained: number | null
          error_adjustments_reserves: number | null
          error_adjustments_retained: number | null
          final_grants: number | null
          final_other_equity: number | null
          final_reserves: number | null
          final_result: number | null
          final_retained_earnings: number | null
          final_share_capital: number | null
          final_share_premium: number | null
          final_treasury_shares: number | null
          final_value_adjustments: number | null
          id: string
          initial_grants: number | null
          initial_other_equity: number | null
          initial_reserves: number | null
          initial_result: number | null
          initial_retained_earnings: number | null
          initial_share_capital: number | null
          initial_share_premium: number | null
          initial_treasury_shares: number | null
          initial_value_adjustments: number | null
          statement_id: string
          updated_at: string
          variation_dividends: number | null
          variation_grants: number | null
          variation_income_expenses_equity: number | null
          variation_other: number | null
          variation_reserves: number | null
          variation_result: number | null
          variation_share_capital: number | null
          variation_share_premium: number | null
          variation_treasury_shares: number | null
        }
        Insert: {
          adjusted_initial_grants?: number | null
          adjusted_initial_other_equity?: number | null
          adjusted_initial_reserves?: number | null
          adjusted_initial_result?: number | null
          adjusted_initial_retained_earnings?: number | null
          adjusted_initial_share_capital?: number | null
          adjusted_initial_share_premium?: number | null
          adjusted_initial_treasury_shares?: number | null
          adjusted_initial_value_adjustments?: number | null
          created_at?: string
          criterion_changes_reserves?: number | null
          criterion_changes_retained?: number | null
          error_adjustments_reserves?: number | null
          error_adjustments_retained?: number | null
          final_grants?: number | null
          final_other_equity?: number | null
          final_reserves?: number | null
          final_result?: number | null
          final_retained_earnings?: number | null
          final_share_capital?: number | null
          final_share_premium?: number | null
          final_treasury_shares?: number | null
          final_value_adjustments?: number | null
          id?: string
          initial_grants?: number | null
          initial_other_equity?: number | null
          initial_reserves?: number | null
          initial_result?: number | null
          initial_retained_earnings?: number | null
          initial_share_capital?: number | null
          initial_share_premium?: number | null
          initial_treasury_shares?: number | null
          initial_value_adjustments?: number | null
          statement_id: string
          updated_at?: string
          variation_dividends?: number | null
          variation_grants?: number | null
          variation_income_expenses_equity?: number | null
          variation_other?: number | null
          variation_reserves?: number | null
          variation_result?: number | null
          variation_share_capital?: number | null
          variation_share_premium?: number | null
          variation_treasury_shares?: number | null
        }
        Update: {
          adjusted_initial_grants?: number | null
          adjusted_initial_other_equity?: number | null
          adjusted_initial_reserves?: number | null
          adjusted_initial_result?: number | null
          adjusted_initial_retained_earnings?: number | null
          adjusted_initial_share_capital?: number | null
          adjusted_initial_share_premium?: number | null
          adjusted_initial_treasury_shares?: number | null
          adjusted_initial_value_adjustments?: number | null
          created_at?: string
          criterion_changes_reserves?: number | null
          criterion_changes_retained?: number | null
          error_adjustments_reserves?: number | null
          error_adjustments_retained?: number | null
          final_grants?: number | null
          final_other_equity?: number | null
          final_reserves?: number | null
          final_result?: number | null
          final_retained_earnings?: number | null
          final_share_capital?: number | null
          final_share_premium?: number | null
          final_treasury_shares?: number | null
          final_value_adjustments?: number | null
          id?: string
          initial_grants?: number | null
          initial_other_equity?: number | null
          initial_reserves?: number | null
          initial_result?: number | null
          initial_retained_earnings?: number | null
          initial_share_capital?: number | null
          initial_share_premium?: number | null
          initial_treasury_shares?: number | null
          initial_value_adjustments?: number | null
          statement_id?: string
          updated_at?: string
          variation_dividends?: number | null
          variation_grants?: number | null
          variation_income_expenses_equity?: number | null
          variation_other?: number | null
          variation_reserves?: number | null
          variation_result?: number | null
          variation_share_capital?: number | null
          variation_share_premium?: number | null
          variation_treasury_shares?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equity_changes_statements_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: true
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          component_name: string | null
          created_at: string
          error_code: string | null
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          session_id: string | null
          severity: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          component_name?: string | null
          created_at?: string
          error_code?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          component_name?: string | null
          created_at?: string
          error_code?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          session_id?: string | null
          severity?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_document_embeddings: {
        Row: {
          chunk_index: number
          company_id: string
          content: string
          created_at: string
          document_type: string
          embedding: string | null
          fiscal_year: number
          id: string
          metadata: Json | null
          statement_id: string | null
          updated_at: string
        }
        Insert: {
          chunk_index?: number
          company_id: string
          content: string
          created_at?: string
          document_type: string
          embedding?: string | null
          fiscal_year: number
          id?: string
          metadata?: Json | null
          statement_id?: string | null
          updated_at?: string
        }
        Update: {
          chunk_index?: number
          company_id?: string
          content?: string
          created_at?: string
          document_type?: string
          embedding?: string | null
          fiscal_year?: number
          id?: string
          metadata?: Json | null
          statement_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_document_embeddings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_document_embeddings_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_notes: {
        Row: {
          created_at: string
          id: string
          note_content: string | null
          note_number: number
          note_title: string
          statement_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_content?: string | null
          note_number: number
          note_title: string
          statement_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note_content?: string | null
          note_number?: number
          note_title?: string
          statement_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_notes_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_rag_conversations: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_rag_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_rag_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_rag_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "financial_rag_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_statements_archive: {
        Row: {
          archived_at: string
          archived_by: string | null
          balance_sheet_data: Json | null
          cash_flow_data: Json | null
          company_id: string
          created_at: string
          equity_changes_data: Json | null
          fiscal_year: number
          id: string
          income_statement_data: Json | null
          notes_data: Json | null
          original_statement_id: string
          statement_type: Database["public"]["Enums"]["financial_statement_type"]
        }
        Insert: {
          archived_at?: string
          archived_by?: string | null
          balance_sheet_data?: Json | null
          cash_flow_data?: Json | null
          company_id: string
          created_at?: string
          equity_changes_data?: Json | null
          fiscal_year: number
          id?: string
          income_statement_data?: Json | null
          notes_data?: Json | null
          original_statement_id: string
          statement_type: Database["public"]["Enums"]["financial_statement_type"]
        }
        Update: {
          archived_at?: string
          archived_by?: string | null
          balance_sheet_data?: Json | null
          cash_flow_data?: Json | null
          company_id?: string
          created_at?: string
          equity_changes_data?: Json | null
          fiscal_year?: number
          id?: string
          income_statement_data?: Json | null
          notes_data?: Json | null
          original_statement_id?: string
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "financial_statements_archive_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_statements_archive_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_modules: {
        Row: {
          accounting_ratios: Json | null
          ai_generated: boolean | null
          cnae_code: string
          compliance_panel_config: Json | null
          components: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          generation_metadata: Json | null
          id: string
          is_published: boolean | null
          kpis: Json | null
          module_key: string
          module_name: string
          regulations: Json | null
          sector: string
          sector_name: string
          updated_at: string
          visit_form_config: Json | null
        }
        Insert: {
          accounting_ratios?: Json | null
          ai_generated?: boolean | null
          cnae_code: string
          compliance_panel_config?: Json | null
          components?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_metadata?: Json | null
          id?: string
          is_published?: boolean | null
          kpis?: Json | null
          module_key: string
          module_name: string
          regulations?: Json | null
          sector: string
          sector_name: string
          updated_at?: string
          visit_form_config?: Json | null
        }
        Update: {
          accounting_ratios?: Json | null
          ai_generated?: boolean | null
          cnae_code?: string
          compliance_panel_config?: Json | null
          components?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_metadata?: Json | null
          id?: string
          is_published?: boolean | null
          kpis?: Json | null
          module_key?: string
          module_name?: string
          regulations?: Json | null
          sector?: string
          sector_name?: string
          updated_at?: string
          visit_form_config?: Json | null
        }
        Relationships: []
      }
      geocode_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          assigned_to: string | null
          contributes_to_parent: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          goal_level: string | null
          id: string
          metric_type: string
          office: string | null
          parent_goal_id: string | null
          period_end: string
          period_start: string
          period_type: string
          target_value: number
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          assigned_to?: string | null
          contributes_to_parent?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          goal_level?: string | null
          id?: string
          metric_type: string
          office?: string | null
          parent_goal_id?: string | null
          period_end: string
          period_start: string
          period_type: string
          target_value: number
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          assigned_to?: string | null
          contributes_to_parent?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          goal_level?: string | null
          id?: string
          metric_type?: string
          office?: string | null
          parent_goal_id?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          target_value?: number
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      holding_subscriptions: {
        Row: {
          annual_total: number | null
          created_at: string | null
          features_included: Json | null
          id: string
          is_active: boolean | null
          monthly_total: number | null
          parent_company_id: string
          subscription_tier: string
          total_cnaes: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
          volume_discount: number | null
        }
        Insert: {
          annual_total?: number | null
          created_at?: string | null
          features_included?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_total?: number | null
          parent_company_id: string
          subscription_tier?: string
          total_cnaes?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          volume_discount?: number | null
        }
        Update: {
          annual_total?: number | null
          created_at?: string | null
          features_included?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_total?: number | null
          parent_company_id?: string
          subscription_tier?: string
          total_cnaes?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
          volume_discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "holding_subscriptions_parent_company_id_fkey"
            columns: ["parent_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string | null
          created_by: string | null
          failed_records: number
          filename: string | null
          id: string
          notes: string | null
          successful_records: number
          total_records: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          failed_records?: number
          filename?: string | null
          id?: string
          notes?: string | null
          successful_records?: number
          total_records?: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          failed_records?: number
          filename?: string | null
          id?: string
          notes?: string | null
          successful_records?: number
          total_records?: number
        }
        Relationships: []
      }
      income_statements: {
        Row: {
          capitalized_work: number | null
          corporate_tax: number | null
          created_at: string
          depreciation: number | null
          discontinued_operations_result: number | null
          excess_provisions: number | null
          exchange_differences: number | null
          financial_expenses: number | null
          financial_income: number | null
          grants_allocation: number | null
          id: string
          impairment_financial_instruments: number | null
          impairment_trade_operations: number | null
          inventory_variation: number | null
          net_turnover: number | null
          operating_grants: number | null
          other_financial_results: number | null
          other_operating_expenses: number | null
          other_operating_income: number | null
          other_operating_results: number | null
          personnel_expenses: number | null
          statement_id: string
          supplies: number | null
          updated_at: string
        }
        Insert: {
          capitalized_work?: number | null
          corporate_tax?: number | null
          created_at?: string
          depreciation?: number | null
          discontinued_operations_result?: number | null
          excess_provisions?: number | null
          exchange_differences?: number | null
          financial_expenses?: number | null
          financial_income?: number | null
          grants_allocation?: number | null
          id?: string
          impairment_financial_instruments?: number | null
          impairment_trade_operations?: number | null
          inventory_variation?: number | null
          net_turnover?: number | null
          operating_grants?: number | null
          other_financial_results?: number | null
          other_operating_expenses?: number | null
          other_operating_income?: number | null
          other_operating_results?: number | null
          personnel_expenses?: number | null
          statement_id: string
          supplies?: number | null
          updated_at?: string
        }
        Update: {
          capitalized_work?: number | null
          corporate_tax?: number | null
          created_at?: string
          depreciation?: number | null
          discontinued_operations_result?: number | null
          excess_provisions?: number | null
          exchange_differences?: number | null
          financial_expenses?: number | null
          financial_income?: number | null
          grants_allocation?: number | null
          id?: string
          impairment_financial_instruments?: number | null
          impairment_trade_operations?: number | null
          inventory_variation?: number | null
          net_turnover?: number | null
          operating_grants?: number | null
          other_financial_results?: number | null
          other_operating_expenses?: number | null
          other_operating_income?: number | null
          other_operating_results?: number | null
          personnel_expenses?: number | null
          statement_id?: string
          supplies?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_statements_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: true
            referencedRelation: "company_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_packs: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          features: Json | null
          id: string
          included_modules: string[] | null
          industry_key: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          included_modules?: string[] | null
          industry_key: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          included_modules?: string[] | null
          industry_key?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      installed_modules: {
        Row: {
          created_at: string | null
          id: string
          installed_at: string | null
          installed_by: string | null
          is_active: boolean | null
          last_used_at: string | null
          license_key: string | null
          license_type: Database["public"]["Enums"]["license_type"]
          module_id: string
          organization_id: string
          settings: Json | null
          updated_at: string | null
          usage_stats: Json | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          license_key?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          module_id: string
          organization_id?: string
          settings?: Json | null
          updated_at?: string | null
          usage_stats?: Json | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          installed_at?: string | null
          installed_by?: string | null
          is_active?: boolean | null
          last_used_at?: string | null
          license_key?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          module_id?: string
          organization_id?: string
          settings?: Json | null
          updated_at?: string | null
          usage_stats?: Json | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "installed_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_mappings: {
        Row: {
          config_id: string | null
          core_field: string
          created_at: string | null
          default_value: string | null
          direction: string
          entity_type: string
          id: string
          is_required: boolean | null
          obelixia_field: string
          transformation_rule: Json | null
          updated_at: string | null
        }
        Insert: {
          config_id?: string | null
          core_field: string
          created_at?: string | null
          default_value?: string | null
          direction: string
          entity_type: string
          id?: string
          is_required?: boolean | null
          obelixia_field: string
          transformation_rule?: Json | null
          updated_at?: string | null
        }
        Update: {
          config_id?: string | null
          core_field?: string
          created_at?: string | null
          default_value?: string | null
          direction?: string
          entity_type?: string
          id?: string
          is_required?: boolean | null
          obelixia_field?: string
          transformation_rule?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_mappings_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "core_banking_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          config_id: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          max_attempts: number | null
          operation_type: string
          payload: Json
          priority: number | null
          result: Json | null
          scheduled_at: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          config_id?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          operation_type: string
          payload: Json
          priority?: number | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          config_id?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          max_attempts?: number | null
          operation_type?: string
          payload?: Json
          priority?: number | null
          result?: Json | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_queue_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "core_banking_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_assistant_conversations: {
        Row: {
          context_type: string
          created_at: string
          id: string
          is_sensitive: boolean | null
          requires_human_review: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context_type?: string
          created_at?: string
          id?: string
          is_sensitive?: boolean | null
          requires_human_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context_type?: string
          created_at?: string
          id?: string
          is_sensitive?: boolean | null
          requires_human_review?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      internal_assistant_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          flagged_for_review: boolean | null
          id: string
          is_sensitive: boolean | null
          metadata: Json | null
          role: string
          sources: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          flagged_for_review?: boolean | null
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          role: string
          sources?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          flagged_for_review?: boolean | null
          id?: string
          is_sensitive?: boolean | null
          metadata?: Json | null
          role?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "internal_assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "internal_assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_enrollments: {
        Row: {
          company_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          current_step_id: string | null
          enrolled_at: string | null
          exit_reason: string | null
          exited_at: string | null
          id: string
          journey_id: string
          next_action_at: string | null
          status: string
          step_history: Json | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_step_id?: string | null
          enrolled_at?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          id?: string
          journey_id: string
          next_action_at?: string | null
          status?: string
          step_history?: Json | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          current_step_id?: string | null
          enrolled_at?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          id?: string
          journey_id?: string
          next_action_at?: string | null
          status?: string
          step_history?: Json | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "customer_journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          action_type: string | null
          config: Json | null
          created_at: string | null
          delay_duration: unknown
          delay_until_time: string | null
          id: string
          journey_id: string
          next_step_id: string | null
          no_step_id: string | null
          stats: Json | null
          step_order: number
          step_type: string
          template_id: string | null
          updated_at: string | null
          yes_step_id: string | null
        }
        Insert: {
          action_type?: string | null
          config?: Json | null
          created_at?: string | null
          delay_duration?: unknown
          delay_until_time?: string | null
          id?: string
          journey_id: string
          next_step_id?: string | null
          no_step_id?: string | null
          stats?: Json | null
          step_order: number
          step_type: string
          template_id?: string | null
          updated_at?: string | null
          yes_step_id?: string | null
        }
        Update: {
          action_type?: string | null
          config?: Json | null
          created_at?: string | null
          delay_duration?: unknown
          delay_until_time?: string | null
          id?: string
          journey_id?: string
          next_step_id?: string | null
          no_step_id?: string | null
          stats?: Json | null
          step_order?: number
          step_type?: string
          template_id?: string | null
          updated_at?: string | null
          yes_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "customer_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_next_step_id_fkey"
            columns: ["next_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_no_step_id_fkey"
            columns: ["no_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_steps_yes_step_id_fkey"
            columns: ["yes_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_report_history: {
        Row: {
          created_at: string
          html_content: string
          id: string
          recipients: Json
          report_date: string
          report_type: string
          sent_count: number
          stats: Json
          total_recipients: number
        }
        Insert: {
          created_at?: string
          html_content: string
          id?: string
          recipients?: Json
          report_date: string
          report_type?: string
          sent_count?: number
          stats: Json
          total_recipients?: number
        }
        Update: {
          created_at?: string
          html_content?: string
          id?: string
          recipients?: Json
          report_date?: string
          report_type?: string
          sent_count?: number
          stats?: Json
          total_recipients?: number
        }
        Relationships: []
      }
      lead_magnet_downloads: {
        Row: {
          company: string | null
          downloaded_at: string | null
          email: string
          email_sent: boolean | null
          email_sent_at: string | null
          full_name: string
          id: string
          lead_magnet_key: string
          lead_magnet_name: string
          phone: string | null
          position: string | null
          sector: string | null
          source_page: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company?: string | null
          downloaded_at?: string | null
          email: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name: string
          id?: string
          lead_magnet_key: string
          lead_magnet_name: string
          phone?: string | null
          position?: string | null
          sector?: string | null
          source_page?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company?: string | null
          downloaded_at?: string | null
          email?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          full_name?: string
          id?: string
          lead_magnet_key?: string
          lead_magnet_name?: string
          phone?: string | null
          position?: string | null
          sector?: string | null
          source_page?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      lowcode_form_definitions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          fields: Json
          form_key: string
          form_name: string
          id: string
          module_id: string | null
          permissions: Json | null
          settings: Json | null
          status: string | null
          updated_at: string | null
          validations: Json | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields?: Json
          form_key: string
          form_name: string
          id?: string
          module_id?: string | null
          permissions?: Json | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          validations?: Json | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          fields?: Json
          form_key?: string
          form_name?: string
          id?: string
          module_id?: string | null
          permissions?: Json | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          validations?: Json | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_form_definitions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_form_submissions: {
        Row: {
          created_at: string | null
          data: Json
          form_id: string | null
          id: string
          metadata: Json | null
          status: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: Json
          form_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          form_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "lowcode_form_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_modules: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          forms: string[] | null
          icon: string | null
          id: string
          module_key: string
          module_name: string
          pages: string[] | null
          permissions: Json | null
          published_at: string | null
          reports: string[] | null
          rules: string[] | null
          settings: Json | null
          status: string | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          forms?: string[] | null
          icon?: string | null
          id?: string
          module_key: string
          module_name: string
          pages?: string[] | null
          permissions?: Json | null
          published_at?: string | null
          reports?: string[] | null
          rules?: string[] | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          forms?: string[] | null
          icon?: string | null
          id?: string
          module_key?: string
          module_name?: string
          pages?: string[] | null
          permissions?: Json | null
          published_at?: string | null
          reports?: string[] | null
          rules?: string[] | null
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      lowcode_page_definitions: {
        Row: {
          blocks: Json
          created_at: string | null
          created_by: string | null
          data_sources: Json | null
          description: string | null
          id: string
          layout: Json
          module_id: string | null
          page_key: string
          page_name: string
          settings: Json | null
          status: string | null
          updated_at: string | null
          visibility_rules: Json | null
        }
        Insert: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json | null
          description?: string | null
          id?: string
          layout?: Json
          module_id?: string | null
          page_key: string
          page_name: string
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          visibility_rules?: Json | null
        }
        Update: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          data_sources?: Json | null
          description?: string | null
          id?: string
          layout?: Json
          module_id?: string | null
          page_key?: string
          page_name?: string
          settings?: Json | null
          status?: string | null
          updated_at?: string | null
          visibility_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_page_definitions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_report_definitions: {
        Row: {
          aggregations: Json | null
          columns: Json
          created_at: string | null
          created_by: string | null
          data_source: Json
          description: string | null
          export_formats: string[] | null
          filters: Json | null
          grouping: Json | null
          id: string
          module_id: string | null
          permissions: Json | null
          report_key: string
          report_name: string
          schedule: Json | null
          sorting: Json | null
          updated_at: string | null
          visualizations: Json | null
        }
        Insert: {
          aggregations?: Json | null
          columns?: Json
          created_at?: string | null
          created_by?: string | null
          data_source: Json
          description?: string | null
          export_formats?: string[] | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          module_id?: string | null
          permissions?: Json | null
          report_key: string
          report_name: string
          schedule?: Json | null
          sorting?: Json | null
          updated_at?: string | null
          visualizations?: Json | null
        }
        Update: {
          aggregations?: Json | null
          columns?: Json
          created_at?: string | null
          created_by?: string | null
          data_source?: Json
          description?: string | null
          export_formats?: string[] | null
          filters?: Json | null
          grouping?: Json | null
          id?: string
          module_id?: string | null
          permissions?: Json | null
          report_key?: string
          report_name?: string
          schedule?: Json | null
          sorting?: Json | null
          updated_at?: string | null
          visualizations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_report_definitions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_rule_executions: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          input_data: Json | null
          output_data: Json | null
          rule_id: string | null
          status: string | null
          trigger_data: Json | null
          triggered_by: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          rule_id?: string | null
          status?: string | null
          trigger_data?: Json | null
          triggered_by?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          rule_id?: string | null
          status?: string | null
          trigger_data?: Json | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_rule_executions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "lowcode_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      lowcode_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          module_id: string | null
          priority: number | null
          rule_key: string
          rule_name: string
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: string | null
          priority?: number | null
          rule_key: string
          rule_name: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: string | null
          priority?: number | null
          rule_key?: string
          rule_name?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lowcode_rules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      map_color_mode: {
        Row: {
          created_at: string | null
          id: string
          mode: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mode?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mode?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      map_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      map_tooltip_config: {
        Row: {
          created_at: string
          display_order: number
          enabled: boolean
          field_label: string
          field_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          enabled?: boolean
          field_label: string
          field_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          enabled?: boolean
          field_label?: string
          field_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_events: {
        Row: {
          created_at: string | null
          event_name: string
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          referrer: string | null
          sector: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          sector?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          referrer?: string | null
          sector?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      marketplace_installations: {
        Row: {
          application_id: string | null
          config: Json | null
          created_at: string | null
          expires_at: string | null
          id: string
          installed_by: string
          is_active: boolean | null
          last_used_at: string | null
          license_key: string | null
          license_type: string | null
          organization_id: string
          uninstall_reason: string | null
          uninstalled_at: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          application_id?: string | null
          config?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installed_by: string
          is_active?: boolean | null
          last_used_at?: string | null
          license_key?: string | null
          license_type?: string | null
          organization_id: string
          uninstall_reason?: string | null
          uninstalled_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          application_id?: string | null
          config?: Json | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          installed_by?: string
          is_active?: boolean | null
          last_used_at?: string | null
          license_key?: string | null
          license_type?: string | null
          organization_id?: string
          uninstall_reason?: string | null
          uninstalled_at?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_installations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          application_id: string | null
          cons: string | null
          created_at: string | null
          helpful_count: number | null
          id: string
          is_verified_purchase: boolean | null
          pros: string | null
          rating: number
          response_at: string | null
          response_by: string | null
          response_text: string | null
          review_text: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_id?: string | null
          cons?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          pros?: string | null
          rating: number
          response_at?: string | null
          response_by?: string | null
          response_text?: string | null
          review_text?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_id?: string | null
          cons?: string | null
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          pros?: string | null
          rating?: number
          response_at?: string | null
          response_by?: string | null
          response_text?: string | null
          review_text?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_requirements: {
        Row: {
          created_at: string | null
          id: string
          last_mfa_challenge: string | null
          mfa_bypass_until: string | null
          mfa_enabled: boolean | null
          mfa_method: string | null
          mfa_required: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_mfa_challenge?: string | null
          mfa_bypass_until?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          mfa_required?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_mfa_challenge?: string | null
          mfa_bypass_until?: string | null
          mfa_enabled?: boolean | null
          mfa_method?: string | null
          mfa_required?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ml_ab_tests: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          model_a_id: string | null
          model_b_id: string | null
          results: Json | null
          start_date: string
          status: string | null
          test_name: string
          traffic_split_a: number | null
          updated_at: string | null
          winner_model_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          model_a_id?: string | null
          model_b_id?: string | null
          results?: Json | null
          start_date?: string
          status?: string | null
          test_name: string
          traffic_split_a?: number | null
          updated_at?: string | null
          winner_model_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          model_a_id?: string | null
          model_b_id?: string | null
          results?: Json | null
          start_date?: string
          status?: string | null
          test_name?: string
          traffic_split_a?: number | null
          updated_at?: string | null
          winner_model_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_ab_tests_model_a_id_fkey"
            columns: ["model_a_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_tests_model_b_id_fkey"
            columns: ["model_b_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_ab_tests_winner_model_id_fkey"
            columns: ["winner_model_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_model_executions: {
        Row: {
          companies_processed: number | null
          completed_at: string | null
          error_message: string | null
          executed_by: string | null
          execution_status: string
          execution_time_ms: number | null
          id: string
          model_type: string
          model_version: string | null
          parameters: Json | null
          results_summary: Json | null
          segments_created: number | null
          started_at: string
        }
        Insert: {
          companies_processed?: number | null
          completed_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          model_type: string
          model_version?: string | null
          parameters?: Json | null
          results_summary?: Json | null
          segments_created?: number | null
          started_at?: string
        }
        Update: {
          companies_processed?: number | null
          completed_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          model_type?: string
          model_version?: string | null
          parameters?: Json | null
          results_summary?: Json | null
          segments_created?: number | null
          started_at?: string
        }
        Relationships: []
      }
      ml_model_registry: {
        Row: {
          ab_test_group: string | null
          ab_test_weight: number | null
          created_at: string | null
          created_by: string | null
          deployed_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_production: boolean | null
          model_name: string
          model_type: string
          parameters: Json | null
          performance_metrics: Json | null
          trained_at: string | null
          training_data_info: Json | null
          updated_at: string | null
          version: string
        }
        Insert: {
          ab_test_group?: string | null
          ab_test_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          deployed_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_production?: boolean | null
          model_name: string
          model_type: string
          parameters?: Json | null
          performance_metrics?: Json | null
          trained_at?: string | null
          training_data_info?: Json | null
          updated_at?: string | null
          version: string
        }
        Update: {
          ab_test_group?: string | null
          ab_test_weight?: number | null
          created_at?: string | null
          created_by?: string | null
          deployed_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_production?: boolean | null
          model_name?: string
          model_type?: string
          parameters?: Json | null
          performance_metrics?: Json | null
          trained_at?: string | null
          training_data_info?: Json | null
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      ml_prediction_logs: {
        Row: {
          ab_test_id: string | null
          actual_outcome: Json | null
          company_id: string | null
          created_at: string | null
          explanation_id: string | null
          id: string
          input_features: Json
          is_correct: boolean | null
          latency_ms: number | null
          model_id: string | null
          prediction: Json
          prediction_probability: number | null
        }
        Insert: {
          ab_test_id?: string | null
          actual_outcome?: Json | null
          company_id?: string | null
          created_at?: string | null
          explanation_id?: string | null
          id?: string
          input_features: Json
          is_correct?: boolean | null
          latency_ms?: number | null
          model_id?: string | null
          prediction: Json
          prediction_probability?: number | null
        }
        Update: {
          ab_test_id?: string | null
          actual_outcome?: Json | null
          company_id?: string | null
          created_at?: string | null
          explanation_id?: string | null
          id?: string
          input_features?: Json
          is_correct?: boolean | null
          latency_ms?: number | null
          model_id?: string | null
          prediction?: Json
          prediction_probability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ml_prediction_logs_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "ml_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_prediction_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_prediction_logs_explanation_id_fkey"
            columns: ["explanation_id"]
            isOneToOne: false
            referencedRelation: "model_explanations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_prediction_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_model_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      model_explanations: {
        Row: {
          company_id: string | null
          confidence_intervals: Json | null
          counterfactuals: Json | null
          created_at: string | null
          created_by: string | null
          decision_path: string[] | null
          feature_importances: Json | null
          human_readable_explanation: string | null
          id: string
          lime_weights: Json | null
          model_type: string
          model_version: string | null
          prediction_id: string | null
          shap_values: Json | null
        }
        Insert: {
          company_id?: string | null
          confidence_intervals?: Json | null
          counterfactuals?: Json | null
          created_at?: string | null
          created_by?: string | null
          decision_path?: string[] | null
          feature_importances?: Json | null
          human_readable_explanation?: string | null
          id?: string
          lime_weights?: Json | null
          model_type: string
          model_version?: string | null
          prediction_id?: string | null
          shap_values?: Json | null
        }
        Update: {
          company_id?: string | null
          confidence_intervals?: Json | null
          counterfactuals?: Json | null
          created_at?: string | null
          created_by?: string | null
          decision_path?: string[] | null
          feature_importances?: Json | null
          human_readable_explanation?: string | null
          id?: string
          lime_weights?: Json | null
          model_type?: string
          model_version?: string | null
          prediction_id?: string | null
          shap_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "model_explanations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      module_components: {
        Row: {
          admin_section_key: string | null
          component_name: string
          component_path: string
          component_type: string | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          menu_icon: string | null
          menu_label: string | null
          menu_order: number | null
          module_key: string
          permissions_required: string[] | null
          props_config: Json | null
          route_path: string | null
          updated_at: string | null
        }
        Insert: {
          admin_section_key?: string | null
          component_name: string
          component_path: string
          component_type?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          menu_icon?: string | null
          menu_label?: string | null
          menu_order?: number | null
          module_key: string
          permissions_required?: string[] | null
          props_config?: Json | null
          route_path?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_section_key?: string | null
          component_name?: string
          component_path?: string
          component_type?: string | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          menu_icon?: string | null
          menu_label?: string | null
          menu_order?: number | null
          module_key?: string
          permissions_required?: string[] | null
          props_config?: Json | null
          route_path?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      nba_action_types: {
        Row: {
          action_category: string
          action_code: string
          action_description: string | null
          action_name: string
          created_at: string | null
          effort_level: string | null
          estimated_mrr_impact: number | null
          execution_config: Json | null
          execution_type: string
          id: string
          is_active: boolean | null
          priority_weight: number | null
          target_roles: string[]
          updated_at: string | null
        }
        Insert: {
          action_category: string
          action_code: string
          action_description?: string | null
          action_name: string
          created_at?: string | null
          effort_level?: string | null
          estimated_mrr_impact?: number | null
          execution_config?: Json | null
          execution_type: string
          id?: string
          is_active?: boolean | null
          priority_weight?: number | null
          target_roles: string[]
          updated_at?: string | null
        }
        Update: {
          action_category?: string
          action_code?: string
          action_description?: string | null
          action_name?: string
          created_at?: string | null
          effort_level?: string | null
          estimated_mrr_impact?: number | null
          execution_config?: Json | null
          execution_type?: string
          id?: string
          is_active?: boolean | null
          priority_weight?: number | null
          target_roles?: string[]
          updated_at?: string | null
        }
        Relationships: []
      }
      nba_queue: {
        Row: {
          action_type_id: string | null
          ai_reasoning: string | null
          context_data: Json | null
          created_at: string | null
          entity_id: string
          entity_type: string
          estimated_value: number | null
          executed_at: string | null
          executed_by: string | null
          execution_result: Json | null
          expires_at: string | null
          id: string
          mrr_impact_actual: number | null
          priority: number | null
          score: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_type_id?: string | null
          ai_reasoning?: string | null
          context_data?: Json | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          estimated_value?: number | null
          executed_at?: string | null
          executed_by?: string | null
          execution_result?: Json | null
          expires_at?: string | null
          id?: string
          mrr_impact_actual?: number | null
          priority?: number | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_type_id?: string | null
          ai_reasoning?: string | null
          context_data?: Json | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          estimated_value?: number | null
          executed_at?: string | null
          executed_by?: string | null
          execution_result?: Json | null
          expires_at?: string | null
          id?: string
          mrr_impact_actual?: number | null
          priority?: number | null
          score?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nba_queue_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "nba_action_types"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_channels: {
        Row: {
          channel_name: string
          channel_type: string
          config: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          channel_name: string
          channel_type?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          channel_name?: string
          channel_type?: string
          config?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          alert_type: string
          created_at: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          min_severity: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          min_severity?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          min_severity?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_subscriptions: {
        Row: {
          channel_id: string
          created_at: string | null
          delivery_methods: string[] | null
          filters: Json | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          delivery_methods?: string[] | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          delivery_methods?: string[] | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_subscriptions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_webhooks: {
        Row: {
          channel_id: string | null
          created_at: string | null
          created_by: string | null
          events: string[] | null
          failure_count: number | null
          headers: Json | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          name: string
          retry_config: Json | null
          secret_key: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name: string
          retry_config?: Json | null
          secret_key?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          created_by?: string | null
          events?: string[] | null
          failure_count?: number | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string
          retry_config?: Json | null
          secret_key?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_webhooks_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          alert_id: string | null
          channel_id: string | null
          created_at: string | null
          delivery_status: Json | null
          event_type: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          metric_value: number | null
          priority: number | null
          severity: string
          source_system: string | null
          threshold_value: number | null
          title: string
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          alert_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          delivery_status?: Json | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          metric_value?: number | null
          priority?: number | null
          severity: string
          source_system?: string | null
          threshold_value?: number | null
          title: string
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          alert_id?: string | null
          channel_id?: string | null
          created_at?: string | null
          delivery_status?: Json | null
          event_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          metric_value?: number | null
          priority?: number | null
          severity?: string
          source_system?: string | null
          threshold_value?: number | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "notification_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      obelixia_content: {
        Row: {
          content: string
          content_key: string
          content_type: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
          updated_at: string
          updated_by: string | null
          version: number | null
        }
        Insert: {
          content: string
          content_key: string
          content_type: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          content_key?: string
          content_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number | null
        }
        Relationships: []
      }
      obelixia_invoices: {
        Row: {
          cover_letter: string | null
          created_at: string
          created_by: string | null
          customer_address: string | null
          customer_company: string | null
          customer_email: string
          customer_name: string | null
          customer_tax_id: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          items: Json
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          quote_id: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_company?: string | null
          customer_email: string
          customer_name?: string | null
          customer_tax_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          items?: Json
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          created_by?: string | null
          customer_address?: string | null
          customer_company?: string | null
          customer_email?: string
          customer_name?: string | null
          customer_tax_id?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          items?: Json
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          quote_id?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obelixia_invoices_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "customer_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      obelixia_module_pricing: {
        Row: {
          base_price: number
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_discount: number | null
          module_key: string
          module_name: string
          monthly_divisor: number | null
          perpetual_multiplier: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_discount?: number | null
          module_key: string
          module_name: string
          monthly_divisor?: number | null
          perpetual_multiplier?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_price?: number
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_discount?: number | null
          module_key?: string
          module_name?: string
          monthly_divisor?: number | null
          perpetual_multiplier?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      omnichannel_messages: {
        Row: {
          channel: string
          clicked_at: string | null
          company_id: string | null
          contact_id: string | null
          content: string | null
          cost: number | null
          created_at: string | null
          delivered_at: string | null
          direction: string
          engagement_data: Json | null
          external_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          journey_id: string | null
          journey_step_id: string | null
          message_type: string | null
          metadata: Json | null
          opened_at: string | null
          sent_at: string | null
          sent_by: string | null
          status: string
          subject: string | null
          template_id: string | null
          template_variables: Json | null
          updated_at: string | null
        }
        Insert: {
          channel: string
          clicked_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          content?: string | null
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          engagement_data?: Json | null
          external_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string | null
        }
        Update: {
          channel?: string
          clicked_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          content?: string | null
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          engagement_data?: Json | null
          external_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          journey_id?: string | null
          journey_step_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          opened_at?: string | null
          sent_at?: string | null
          sent_by?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          template_variables?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "omnichannel_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omnichannel_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omnichannel_messages_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "customer_journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "omnichannel_messages_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      omnichannel_templates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          category: string | null
          channel: string
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          html_content: string | null
          id: string
          is_active: boolean | null
          name: string
          preview_text: string | null
          stats: Json | null
          subject: string | null
          updated_at: string | null
          variables: string[] | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          category?: string | null
          channel: string
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          preview_text?: string | null
          stats?: Json | null
          subject?: string | null
          updated_at?: string | null
          variables?: string[] | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          category?: string | null
          channel?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          preview_text?: string | null
          stats?: Json | null
          subject?: string | null
          updated_at?: string | null
          variables?: string[] | null
          version?: number | null
        }
        Relationships: []
      }
      open_banking_audit_log: {
        Row: {
          consent_id: string | null
          created_at: string
          endpoint: string
          id: string
          interaction_id: string
          ip_address: string | null
          method: string
          request_body: Json | null
          request_headers: Json | null
          response_body: Json | null
          response_status: number | null
          tpp_id: string
          user_id: string | null
        }
        Insert: {
          consent_id?: string | null
          created_at?: string
          endpoint: string
          id?: string
          interaction_id: string
          ip_address?: string | null
          method: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_status?: number | null
          tpp_id: string
          user_id?: string | null
        }
        Update: {
          consent_id?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          interaction_id?: string
          ip_address?: string | null
          method?: string
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          response_status?: number | null
          tpp_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      open_banking_consents: {
        Row: {
          authorized_at: string | null
          consent_id: string
          created_at: string
          expiration_date: string
          frequency_per_day: number | null
          id: string
          last_action_date: string | null
          permissions: string[]
          recurring_indicator: boolean | null
          revoked_at: string | null
          sca_status: string | null
          status: string
          tpp_id: string
          transaction_from_date: string | null
          transaction_to_date: string | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          authorized_at?: string | null
          consent_id: string
          created_at?: string
          expiration_date: string
          frequency_per_day?: number | null
          id?: string
          last_action_date?: string | null
          permissions?: string[]
          recurring_indicator?: boolean | null
          revoked_at?: string | null
          sca_status?: string | null
          status?: string
          tpp_id: string
          transaction_from_date?: string | null
          transaction_to_date?: string | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          authorized_at?: string | null
          consent_id?: string
          created_at?: string
          expiration_date?: string
          frequency_per_day?: number | null
          id?: string
          last_action_date?: string | null
          permissions?: string[]
          recurring_indicator?: boolean | null
          revoked_at?: string | null
          sca_status?: string | null
          status?: string
          tpp_id?: string
          transaction_from_date?: string | null
          transaction_to_date?: string | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "open_banking_consents_tpp_id_fkey"
            columns: ["tpp_id"]
            isOneToOne: false
            referencedRelation: "registered_tpps"
            referencedColumns: ["tpp_id"]
          },
        ]
      }
      opportunities: {
        Row: {
          actual_close_date: string | null
          company_id: string
          contact_id: string | null
          created_at: string | null
          description: string | null
          estimated_close_date: string | null
          estimated_value: number | null
          id: string
          lost_reason: string | null
          notes: string | null
          owner_id: string | null
          probability: number | null
          products: Json | null
          stage: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_close_date?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          probability?: number | null
          products?: Json | null
          stage?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_close_date?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_close_date?: string | null
          estimated_value?: number | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          probability?: number | null
          products?: Json | null
          stage?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_compliance_documents: {
        Row: {
          acknowledgment_deadline: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          document_type: string
          effective_date: string | null
          expiry_date: string | null
          file_url: string | null
          id: string
          is_mandatory: boolean | null
          metadata: Json | null
          organization_id: string | null
          parent_document_id: string | null
          regulation_source: string | null
          renewal_frequency: string | null
          requires_acknowledgment: boolean | null
          sector: string | null
          sector_key: string | null
          status: string | null
          title: string
          updated_at: string | null
          version: string | null
        }
        Insert: {
          acknowledgment_deadline?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type: string
          effective_date?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_mandatory?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          parent_document_id?: string | null
          regulation_source?: string | null
          renewal_frequency?: string | null
          requires_acknowledgment?: boolean | null
          sector?: string | null
          sector_key?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          acknowledgment_deadline?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          document_type?: string
          effective_date?: string | null
          expiry_date?: string | null
          file_url?: string | null
          id?: string
          is_mandatory?: boolean | null
          metadata?: Json | null
          organization_id?: string | null
          parent_document_id?: string | null
          regulation_source?: string | null
          renewal_frequency?: string | null
          requires_acknowledgment?: boolean | null
          sector?: string | null
          sector_key?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_compliance_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_compliance_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          api_scopes: string[] | null
          app_key: string
          app_name: string
          banner_url: string | null
          billing_period: string | null
          category: string
          changelog: Json | null
          created_at: string | null
          description: string | null
          documentation_url: string | null
          icon_url: string | null
          id: string
          install_count: number | null
          is_certified: boolean | null
          is_featured: boolean | null
          is_premium: boolean | null
          min_plan: string | null
          partner_company_id: string | null
          price_amount: number | null
          price_currency: string | null
          price_type: string | null
          privacy_policy_url: string | null
          rating_average: number | null
          rating_count: number | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshots: Json | null
          short_description: string | null
          status: string | null
          subcategory: string | null
          submitted_at: string | null
          support_url: string | null
          tags: string[] | null
          terms_url: string | null
          trial_days: number | null
          updated_at: string | null
          version: string | null
          video_url: string | null
          webhook_url: string | null
        }
        Insert: {
          api_scopes?: string[] | null
          app_key: string
          app_name: string
          banner_url?: string | null
          billing_period?: string | null
          category: string
          changelog?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          install_count?: number | null
          is_certified?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          min_plan?: string | null
          partner_company_id?: string | null
          price_amount?: number | null
          price_currency?: string | null
          price_type?: string | null
          privacy_policy_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots?: Json | null
          short_description?: string | null
          status?: string | null
          subcategory?: string | null
          submitted_at?: string | null
          support_url?: string | null
          tags?: string[] | null
          terms_url?: string | null
          trial_days?: number | null
          updated_at?: string | null
          version?: string | null
          video_url?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_scopes?: string[] | null
          app_key?: string
          app_name?: string
          banner_url?: string | null
          billing_period?: string | null
          category?: string
          changelog?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          icon_url?: string | null
          id?: string
          install_count?: number | null
          is_certified?: boolean | null
          is_featured?: boolean | null
          is_premium?: boolean | null
          min_plan?: string | null
          partner_company_id?: string | null
          price_amount?: number | null
          price_currency?: string | null
          price_type?: string | null
          privacy_policy_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots?: Json | null
          short_description?: string | null
          status?: string | null
          subcategory?: string | null
          submitted_at?: string | null
          support_url?: string | null
          tags?: string[] | null
          terms_url?: string | null
          trial_days?: number | null
          updated_at?: string | null
          version?: string | null
          video_url?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_applications_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_companies: {
        Row: {
          approved_by: string | null
          company_name: string
          contact_email: string
          contact_phone: string | null
          contract_expires_at: string | null
          contract_signed_at: string | null
          created_at: string | null
          description: string | null
          id: string
          joined_at: string | null
          legal_name: string | null
          logo_url: string | null
          metadata: Json | null
          partner_tier: string | null
          revenue_share_percent: number | null
          status: string | null
          tax_id: string | null
          total_installations: number | null
          total_revenue: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          approved_by?: string | null
          company_name: string
          contact_email: string
          contact_phone?: string | null
          contract_expires_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          joined_at?: string | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          partner_tier?: string | null
          revenue_share_percent?: number | null
          status?: string | null
          tax_id?: string | null
          total_installations?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          approved_by?: string | null
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          contract_expires_at?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          joined_at?: string | null
          legal_name?: string | null
          logo_url?: string | null
          metadata?: Json | null
          partner_tier?: string | null
          revenue_share_percent?: number | null
          status?: string | null
          tax_id?: string | null
          total_installations?: number | null
          total_revenue?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partner_revenue_transactions: {
        Row: {
          application_id: string | null
          created_at: string | null
          currency: string | null
          external_transaction_id: string | null
          gross_amount: number
          id: string
          installation_id: string | null
          invoice_url: string | null
          metadata: Json | null
          organization_id: string | null
          paid_at: string | null
          partner_amount: number
          partner_company_id: string | null
          payment_method: string | null
          period_end: string | null
          period_start: string | null
          platform_fee: number
          status: string | null
          transaction_type: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          currency?: string | null
          external_transaction_id?: string | null
          gross_amount: number
          id?: string
          installation_id?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          organization_id?: string | null
          paid_at?: string | null
          partner_amount: number
          partner_company_id?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          platform_fee: number
          status?: string | null
          transaction_type: string
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          currency?: string | null
          external_transaction_id?: string | null
          gross_amount?: number
          id?: string
          installation_id?: string | null
          invoice_url?: string | null
          metadata?: Json | null
          organization_id?: string | null
          paid_at?: string | null
          partner_amount?: number
          partner_company_id?: string | null
          payment_method?: string | null
          period_end?: string | null
          period_start?: string | null
          platform_fee?: number
          status?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_revenue_transactions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_revenue_transactions_installation_id_fkey"
            columns: ["installation_id"]
            isOneToOne: false
            referencedRelation: "marketplace_installations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_revenue_transactions_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_users: {
        Row: {
          created_at: string | null
          id: string
          is_primary_contact: boolean | null
          partner_company_id: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          partner_company_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary_contact?: boolean | null
          partner_company_id?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_users_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_webhooks: {
        Row: {
          created_at: string | null
          events: string[]
          failure_count: number | null
          id: string
          is_active: boolean | null
          last_response_body: string | null
          last_response_code: number | null
          last_triggered_at: string | null
          partner_company_id: string | null
          secret_hash: string
          success_count: number | null
          updated_at: string | null
          webhook_name: string
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          events: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_response_body?: string | null
          last_response_code?: number | null
          last_triggered_at?: string | null
          partner_company_id?: string | null
          secret_hash: string
          success_count?: number | null
          updated_at?: string | null
          webhook_name: string
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          events?: string[]
          failure_count?: number | null
          id?: string
          is_active?: boolean | null
          last_response_body?: string | null
          last_response_code?: number | null
          last_triggered_at?: string | null
          partner_company_id?: string | null
          secret_hash?: string
          success_count?: number | null
          updated_at?: string | null
          webhook_name?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_webhooks_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_value: number
          alert_type: string
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          metric_name: string
          severity: string | null
          threshold_value: number
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value: number
          alert_type: string
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          metric_name: string
          severity?: string | null
          threshold_value: number
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_value?: number
          alert_type?: string
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          metric_name?: string
          severity?: string | null
          threshold_value?: number
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          connection_type: string | null
          created_at: string
          delta: number | null
          device_type: string | null
          id: string
          metadata: Json | null
          metric_name: string
          page_path: string | null
          rating: string | null
          session_id: string | null
          url: string | null
          user_agent: string | null
          value: number
        }
        Insert: {
          connection_type?: string | null
          created_at?: string
          delta?: number | null
          device_type?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          page_path?: string | null
          rating?: string | null
          session_id?: string | null
          url?: string | null
          user_agent?: string | null
          value: number
        }
        Update: {
          connection_type?: string | null
          created_at?: string
          delta?: number | null
          device_type?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          page_path?: string | null
          rating?: string | null
          session_id?: string | null
          url?: string | null
          user_agent?: string | null
          value?: number
        }
        Relationships: []
      }
      pipeline_snapshots: {
        Row: {
          avg_deal_age_days: number | null
          avg_deal_value: number | null
          by_stage: Json | null
          conversion_rate: number | null
          created_at: string
          gestor_id: string | null
          health_score: number | null
          id: string
          office: string | null
          snapshot_date: string
          total_opportunities: number | null
          total_value: number | null
          velocity_score: number | null
          win_rate: number | null
        }
        Insert: {
          avg_deal_age_days?: number | null
          avg_deal_value?: number | null
          by_stage?: Json | null
          conversion_rate?: number | null
          created_at?: string
          gestor_id?: string | null
          health_score?: number | null
          id?: string
          office?: string | null
          snapshot_date?: string
          total_opportunities?: number | null
          total_value?: number | null
          velocity_score?: number | null
          win_rate?: number | null
        }
        Update: {
          avg_deal_age_days?: number | null
          avg_deal_value?: number | null
          by_stage?: Json | null
          conversion_rate?: number | null
          created_at?: string
          gestor_id?: string | null
          health_score?: number | null
          id?: string
          office?: string | null
          snapshot_date?: string
          total_opportunities?: number | null
          total_value?: number | null
          velocity_score?: number | null
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_snapshots_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plugin_permissions: {
        Row: {
          application_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          is_sensitive: boolean | null
          permission_key: string
          permission_name: string
          requires_approval: boolean | null
        }
        Insert: {
          application_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          permission_key: string
          permission_name: string
          requires_approval?: boolean | null
        }
        Update: {
          application_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          is_sensitive?: boolean | null
          permission_key?: string
          permission_name?: string
          requires_approval?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "plugin_permissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_api_tiers: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          price_monthly: number | null
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          rate_limit_per_minute: number | null
          tier_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          price_monthly?: number | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          tier_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          price_monthly?: number | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          tier_name?: string
        }
        Relationships: []
      }
      premium_integrations: {
        Row: {
          category: string
          certification_expires_at: string | null
          certification_level: string | null
          certified_at: string | null
          certified_by: string | null
          config_schema: Json | null
          created_at: string | null
          description: string | null
          documentation_url: string | null
          features: Json | null
          id: string
          install_count: number | null
          integration_key: string
          integration_name: string
          is_active: boolean | null
          is_featured: boolean | null
          logo_url: string | null
          partner_company_id: string | null
          pricing_info: Json | null
          provider: string
          required_secrets: string[] | null
          setup_guide_url: string | null
          supported_regions: string[] | null
          updated_at: string | null
        }
        Insert: {
          category: string
          certification_expires_at?: string | null
          certification_level?: string | null
          certified_at?: string | null
          certified_by?: string | null
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          features?: Json | null
          id?: string
          install_count?: number | null
          integration_key: string
          integration_name: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          partner_company_id?: string | null
          pricing_info?: Json | null
          provider: string
          required_secrets?: string[] | null
          setup_guide_url?: string | null
          supported_regions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          certification_expires_at?: string | null
          certification_level?: string | null
          certified_at?: string | null
          certified_by?: string | null
          config_schema?: Json | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          features?: Json | null
          id?: string
          install_count?: number | null
          integration_key?: string
          integration_name?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          logo_url?: string | null
          partner_company_id?: string | null
          pricing_info?: Json | null
          provider?: string
          required_secrets?: string[] | null
          setup_guide_url?: string | null
          supported_regions?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "premium_integrations_partner_company_id_fkey"
            columns: ["partner_company_id"]
            isOneToOne: false
            referencedRelation: "partner_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_addons: {
        Row: {
          addon_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          addon_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          addon_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_tiers: {
        Row: {
          base_price: number
          billing_period: string
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          max_companies: number | null
          max_users: number | null
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          base_price?: number
          billing_period?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_companies?: number | null
          max_users?: number | null
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          base_price?: number
          billing_period?: string
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_companies?: number | null
          max_users?: number | null
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      process_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          duration_ms: number | null
          entity_id: string
          entity_type: string
          from_state: string | null
          id: string
          metadata: Json | null
          node_id: string | null
          occurred_at: string
          process_definition_id: string | null
          process_instance_id: string | null
          tenant_id: string | null
          to_state: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          duration_ms?: number | null
          entity_id: string
          entity_type: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          node_id?: string | null
          occurred_at?: string
          process_definition_id?: string | null
          process_instance_id?: string | null
          tenant_id?: string | null
          to_state?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          duration_ms?: number | null
          entity_id?: string
          entity_type?: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          node_id?: string | null
          occurred_at?: string
          process_definition_id?: string | null
          process_instance_id?: string | null
          tenant_id?: string | null
          to_state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      process_mining_snapshots: {
        Row: {
          analysis_results: Json
          created_at: string
          created_by: string | null
          date_from: string | null
          date_to: string | null
          description: string | null
          entity_type: string | null
          id: string
          name: string
          process_definition_id: string | null
        }
        Insert: {
          analysis_results?: Json
          created_at?: string
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string
          name: string
          process_definition_id?: string | null
        }
        Update: {
          analysis_results?: Json
          created_at?: string
          created_by?: string | null
          date_from?: string | null
          date_to?: string | null
          description?: string | null
          entity_type?: string | null
          id?: string
          name?: string
          process_definition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_mining_snapshots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_mining_snapshots_process_definition_id_fkey"
            columns: ["process_definition_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      process_sla_violations: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          actual_duration: unknown
          created_at: string
          escalated_to: string[] | null
          escalation_level: number | null
          exceeded_by: unknown
          exceeded_percentage: number | null
          expected_duration: unknown
          id: string
          instance_id: string
          node_id: string
          node_name: string | null
          notification_sent: boolean | null
          notification_sent_at: string | null
          process_definition_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          violation_type: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_duration?: unknown
          created_at?: string
          escalated_to?: string[] | null
          escalation_level?: number | null
          exceeded_by?: unknown
          exceeded_percentage?: number | null
          expected_duration?: unknown
          id?: string
          instance_id: string
          node_id: string
          node_name?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          process_definition_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          violation_type: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          actual_duration?: unknown
          created_at?: string
          escalated_to?: string[] | null
          escalation_level?: number | null
          exceeded_by?: unknown
          exceeded_percentage?: number | null
          expected_duration?: unknown
          id?: string
          instance_id?: string
          node_id?: string
          node_name?: string | null
          notification_sent?: boolean | null
          notification_sent_at?: string | null
          process_definition_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_sla_violations_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_sla_violations_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_sla_violations_process_definition_id_fkey"
            columns: ["process_definition_id"]
            isOneToOne: false
            referencedRelation: "bpmn_process_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_sla_violations_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string | null
          email: string
          full_name: string | null
          gestor_number: string | null
          id: string
          oficina: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          gestor_number?: string | null
          id: string
          oficina?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          gestor_number?: string | null
          id?: string
          oficina?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      provisional_balance_sheets: {
        Row: {
          cash_equivalents: number | null
          created_at: string
          current_year_result: number | null
          deferred_tax_assets: number | null
          deferred_tax_liabilities: number | null
          id: string
          intangible_assets: number | null
          inventory: number | null
          long_term_debts: number | null
          long_term_financial_investments: number | null
          long_term_provisions: number | null
          other_creditors: number | null
          provisional_statement_id: string
          real_estate_investments: number | null
          reserves: number | null
          retained_earnings: number | null
          share_capital: number | null
          share_premium: number | null
          short_term_debts: number | null
          short_term_financial_investments: number | null
          short_term_provisions: number | null
          tangible_assets: number | null
          trade_payables: number | null
          trade_receivables: number | null
          updated_at: string
        }
        Insert: {
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          id?: string
          intangible_assets?: number | null
          inventory?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_provisions?: number | null
          other_creditors?: number | null
          provisional_statement_id: string
          real_estate_investments?: number | null
          reserves?: number | null
          retained_earnings?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_provisions?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          updated_at?: string
        }
        Update: {
          cash_equivalents?: number | null
          created_at?: string
          current_year_result?: number | null
          deferred_tax_assets?: number | null
          deferred_tax_liabilities?: number | null
          id?: string
          intangible_assets?: number | null
          inventory?: number | null
          long_term_debts?: number | null
          long_term_financial_investments?: number | null
          long_term_provisions?: number | null
          other_creditors?: number | null
          provisional_statement_id?: string
          real_estate_investments?: number | null
          reserves?: number | null
          retained_earnings?: number | null
          share_capital?: number | null
          share_premium?: number | null
          short_term_debts?: number | null
          short_term_financial_investments?: number | null
          short_term_provisions?: number | null
          tangible_assets?: number | null
          trade_payables?: number | null
          trade_receivables?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisional_balance_sheets_provisional_statement_id_fkey"
            columns: ["provisional_statement_id"]
            isOneToOne: true
            referencedRelation: "provisional_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      provisional_financial_statements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          created_by: string | null
          fiscal_year: number
          id: string
          is_approved: boolean
          period_number: number
          period_type: Database["public"]["Enums"]["provisional_period_type"]
          source: Database["public"]["Enums"]["financial_data_source"]
          statement_type: Database["public"]["Enums"]["financial_statement_type"]
          status: Database["public"]["Enums"]["financial_statement_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          fiscal_year: number
          id?: string
          is_approved?: boolean
          period_number?: number
          period_type?: Database["public"]["Enums"]["provisional_period_type"]
          source?: Database["public"]["Enums"]["financial_data_source"]
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
          status?: Database["public"]["Enums"]["financial_statement_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          fiscal_year?: number
          id?: string
          is_approved?: boolean
          period_number?: number
          period_type?: Database["public"]["Enums"]["provisional_period_type"]
          source?: Database["public"]["Enums"]["financial_data_source"]
          statement_type?: Database["public"]["Enums"]["financial_statement_type"]
          status?: Database["public"]["Enums"]["financial_statement_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisional_financial_statements_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisional_financial_statements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisional_financial_statements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provisional_income_statements: {
        Row: {
          capitalized_work: number | null
          corporate_tax: number | null
          created_at: string
          depreciation: number | null
          exchange_differences: number | null
          financial_expenses: number | null
          financial_income: number | null
          id: string
          impairment_financial_instruments: number | null
          impairment_trade_operations: number | null
          inventory_variation: number | null
          net_turnover: number | null
          operating_grants: number | null
          other_financial_results: number | null
          other_operating_expenses: number | null
          other_operating_income: number | null
          other_operating_results: number | null
          personnel_expenses: number | null
          provisional_statement_id: string
          supplies: number | null
          updated_at: string
        }
        Insert: {
          capitalized_work?: number | null
          corporate_tax?: number | null
          created_at?: string
          depreciation?: number | null
          exchange_differences?: number | null
          financial_expenses?: number | null
          financial_income?: number | null
          id?: string
          impairment_financial_instruments?: number | null
          impairment_trade_operations?: number | null
          inventory_variation?: number | null
          net_turnover?: number | null
          operating_grants?: number | null
          other_financial_results?: number | null
          other_operating_expenses?: number | null
          other_operating_income?: number | null
          other_operating_results?: number | null
          personnel_expenses?: number | null
          provisional_statement_id: string
          supplies?: number | null
          updated_at?: string
        }
        Update: {
          capitalized_work?: number | null
          corporate_tax?: number | null
          created_at?: string
          depreciation?: number | null
          exchange_differences?: number | null
          financial_expenses?: number | null
          financial_income?: number | null
          id?: string
          impairment_financial_instruments?: number | null
          impairment_trade_operations?: number | null
          inventory_variation?: number | null
          net_turnover?: number | null
          operating_grants?: number | null
          other_financial_results?: number | null
          other_operating_expenses?: number | null
          other_operating_income?: number | null
          other_operating_results?: number | null
          personnel_expenses?: number | null
          provisional_statement_id?: string
          supplies?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisional_income_statements_provisional_statement_id_fkey"
            columns: ["provisional_statement_id"]
            isOneToOne: true
            referencedRelation: "provisional_financial_statements"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string | null
          created_at: string | null
          device_name: string | null
          device_type: string | null
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_key?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_key?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      registered_tpps: {
        Row: {
          authorization_status: string
          authorized_at: string | null
          contact_email: string | null
          country_code: string | null
          created_at: string
          expires_at: string | null
          id: string
          organization_id: string | null
          qsealc_certificate: string | null
          qwac_certificate: string | null
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          redirect_uris: string[]
          registration_number: string | null
          regulatory_authority: string | null
          services: string[]
          tpp_id: string
          tpp_name: string
          updated_at: string
        }
        Insert: {
          authorization_status?: string
          authorized_at?: string | null
          contact_email?: string | null
          country_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          qsealc_certificate?: string | null
          qwac_certificate?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          redirect_uris?: string[]
          registration_number?: string | null
          regulatory_authority?: string | null
          services?: string[]
          tpp_id: string
          tpp_name: string
          updated_at?: string
        }
        Update: {
          authorization_status?: string
          authorized_at?: string | null
          contact_email?: string | null
          country_code?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          organization_id?: string | null
          qsealc_certificate?: string | null
          qwac_certificate?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          redirect_uris?: string[]
          registration_number?: string | null
          regulatory_authority?: string | null
          services?: string[]
          tpp_id?: string
          tpp_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      regulation_update_notifications: {
        Row: {
          affected_organizations: string[] | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          notified_users: string[] | null
          read_at: string | null
          regulation_id: string | null
          sector: string
          title: string
        }
        Insert: {
          affected_organizations?: string[] | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          notified_users?: string[] | null
          read_at?: string | null
          regulation_id?: string | null
          sector: string
          title: string
        }
        Update: {
          affected_organizations?: string[] | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          notified_users?: string[] | null
          read_at?: string | null
          regulation_id?: string | null
          sector?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulation_update_notifications_regulation_id_fkey"
            columns: ["regulation_id"]
            isOneToOne: false
            referencedRelation: "organization_compliance_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      regulation_updates: {
        Row: {
          action_required: boolean | null
          affected_regulations: string[] | null
          ai_analysis: string | null
          created_at: string | null
          id: string
          keywords: string[] | null
          notified_at: string | null
          notified_users: string[] | null
          priority: Database["public"]["Enums"]["impact_level"] | null
          processed: boolean | null
          publication_date: string | null
          relevance_score: number | null
          sector_key: string
          source: string
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_required?: boolean | null
          affected_regulations?: string[] | null
          ai_analysis?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          notified_at?: string | null
          notified_users?: string[] | null
          priority?: Database["public"]["Enums"]["impact_level"] | null
          processed?: boolean | null
          publication_date?: string | null
          relevance_score?: number | null
          sector_key: string
          source: string
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_required?: boolean | null
          affected_regulations?: string[] | null
          ai_analysis?: string | null
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          notified_at?: string | null
          notified_users?: string[] | null
          priority?: Database["public"]["Enums"]["impact_level"] | null
          processed?: boolean | null
          publication_date?: string | null
          relevance_score?: number | null
          sector_key?: string
          source?: string
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resilience_tests: {
        Row: {
          conducted_by: string | null
          created_at: string
          critical_findings_count: number | null
          executive_summary: string | null
          findings: Json | null
          high_findings_count: number | null
          id: string
          low_findings_count: number | null
          medium_findings_count: number | null
          recommendations: string | null
          remediation_deadline: string | null
          remediation_status: string | null
          report_url: string | null
          reviewed_by: string | null
          scope: string
          status: string
          target_systems: string[] | null
          test_date: string
          test_duration_hours: number | null
          test_name: string
          test_type: string
          tester_certification: string | null
          tester_organization: string | null
          updated_at: string
        }
        Insert: {
          conducted_by?: string | null
          created_at?: string
          critical_findings_count?: number | null
          executive_summary?: string | null
          findings?: Json | null
          high_findings_count?: number | null
          id?: string
          low_findings_count?: number | null
          medium_findings_count?: number | null
          recommendations?: string | null
          remediation_deadline?: string | null
          remediation_status?: string | null
          report_url?: string | null
          reviewed_by?: string | null
          scope: string
          status?: string
          target_systems?: string[] | null
          test_date: string
          test_duration_hours?: number | null
          test_name: string
          test_type: string
          tester_certification?: string | null
          tester_organization?: string | null
          updated_at?: string
        }
        Update: {
          conducted_by?: string | null
          created_at?: string
          critical_findings_count?: number | null
          executive_summary?: string | null
          findings?: Json | null
          high_findings_count?: number | null
          id?: string
          low_findings_count?: number | null
          medium_findings_count?: number | null
          recommendations?: string | null
          remediation_deadline?: string | null
          remediation_status?: string | null
          report_url?: string | null
          reviewed_by?: string | null
          scope?: string
          status?: string
          target_systems?: string[] | null
          test_date?: string
          test_duration_hours?: number | null
          test_name?: string
          test_type?: string
          tester_certification?: string | null
          tester_organization?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      revenue_signals: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          ai_analysis: Json | null
          confidence_score: number | null
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          gestor_id: string | null
          id: string
          is_actioned: boolean | null
          is_read: boolean | null
          office: string | null
          potential_value: number | null
          recommended_action: string | null
          severity: string
          signal_type: string
          title: string
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          ai_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          gestor_id?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          office?: string | null
          potential_value?: number | null
          recommended_action?: string | null
          severity?: string
          signal_type: string
          title: string
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          ai_analysis?: Json | null
          confidence_score?: number | null
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          gestor_id?: string | null
          id?: string
          is_actioned?: boolean | null
          is_read?: boolean | null
          office?: string | null
          potential_value?: number | null
          recommended_action?: string | null
          severity?: string
          signal_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_signals_actioned_by_fkey"
            columns: ["actioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_signals_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          assessment_date: string
          assessment_name: string
          assessment_type: string
          assessor_id: string | null
          created_at: string
          id: string
          identified_risks: Json | null
          methodology: string | null
          mitigation_measures: Json | null
          next_review_date: string | null
          residual_risk_score: number | null
          risk_level: string | null
          risk_score: number | null
          scope: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_date: string
          assessment_name: string
          assessment_type: string
          assessor_id?: string | null
          created_at?: string
          id?: string
          identified_risks?: Json | null
          methodology?: string | null
          mitigation_measures?: Json | null
          next_review_date?: string | null
          residual_risk_score?: number | null
          risk_level?: string | null
          risk_score?: number | null
          scope: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          assessment_date?: string
          assessment_name?: string
          assessment_type?: string
          assessor_id?: string | null
          created_at?: string
          id?: string
          identified_risks?: Json | null
          methodology?: string | null
          mitigation_measures?: Json | null
          next_review_date?: string | null
          residual_risk_score?: number | null
          risk_level?: string | null
          risk_score?: number | null
          scope?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          badge_color: string | null
          badge_icon: string | null
          created_at: string
          description: string | null
          gestor_id: string
          id: string
          metadata: Json | null
          points: number
          quota_id: string | null
          unlocked_at: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          gestor_id: string
          id?: string
          metadata?: Json | null
          points?: number
          quota_id?: string | null
          unlocked_at?: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          badge_color?: string | null
          badge_icon?: string | null
          created_at?: string
          description?: string | null
          gestor_id?: string
          id?: string
          metadata?: Json | null
          points?: number
          quota_id?: string | null
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_achievements_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_achievements_quota_id_fkey"
            columns: ["quota_id"]
            isOneToOne: false
            referencedRelation: "sales_quotas"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_leaderboard: {
        Row: {
          achievements_count: number | null
          badges: Json | null
          calculated_at: string
          gestor_id: string
          id: string
          period_start: string
          period_type: string
          previous_rank: number | null
          rank_change: number | null
          rank_position: number
          streak_days: number | null
          total_deals_won: number | null
          total_points: number | null
          total_value: number | null
          total_visits: number | null
        }
        Insert: {
          achievements_count?: number | null
          badges?: Json | null
          calculated_at?: string
          gestor_id: string
          id?: string
          period_start: string
          period_type?: string
          previous_rank?: number | null
          rank_change?: number | null
          rank_position: number
          streak_days?: number | null
          total_deals_won?: number | null
          total_points?: number | null
          total_value?: number | null
          total_visits?: number | null
        }
        Update: {
          achievements_count?: number | null
          badges?: Json | null
          calculated_at?: string
          gestor_id?: string
          id?: string
          period_start?: string
          period_type?: string
          previous_rank?: number | null
          rank_change?: number | null
          rank_position?: number
          streak_days?: number | null
          total_deals_won?: number | null
          total_points?: number | null
          total_value?: number | null
          total_visits?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_leaderboard_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_quotas: {
        Row: {
          achievement_percentage: number | null
          actual_new_clients: number | null
          actual_products_sold: number | null
          actual_value: number
          actual_visits: number | null
          created_at: string
          created_by: string | null
          gestor_id: string
          id: string
          period_end: string
          period_start: string
          period_type: string
          target_new_clients: number | null
          target_products_sold: number | null
          target_value: number
          target_visits: number | null
          updated_at: string
        }
        Insert: {
          achievement_percentage?: number | null
          actual_new_clients?: number | null
          actual_products_sold?: number | null
          actual_value?: number
          actual_visits?: number | null
          created_at?: string
          created_by?: string | null
          gestor_id: string
          id?: string
          period_end: string
          period_start: string
          period_type?: string
          target_new_clients?: number | null
          target_products_sold?: number | null
          target_value?: number
          target_visits?: number | null
          updated_at?: string
        }
        Update: {
          achievement_percentage?: number | null
          actual_new_clients?: number | null
          actual_products_sold?: number | null
          actual_value?: number
          actual_visits?: number | null
          created_at?: string
          created_by?: string | null
          gestor_id?: string
          id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          target_new_clients?: number | null
          target_products_sold?: number | null
          target_value?: number
          target_visits?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_quotas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_quotas_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_simulations: {
        Row: {
          base_parameters: Json
          best_case_results: Json | null
          constraints: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_shared: boolean | null
          monte_carlo_iterations: number | null
          name: string
          recommendations: Json | null
          run_completed_at: string | null
          run_started_at: string | null
          scenario_type: string
          sensitivity_analysis: Json | null
          shared_with: string[] | null
          simulation_results: Json | null
          status: string | null
          updated_at: string
          variables: Json
          worst_case_results: Json | null
        }
        Insert: {
          base_parameters: Json
          best_case_results?: Json | null
          constraints?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          monte_carlo_iterations?: number | null
          name: string
          recommendations?: Json | null
          run_completed_at?: string | null
          run_started_at?: string | null
          scenario_type: string
          sensitivity_analysis?: Json | null
          shared_with?: string[] | null
          simulation_results?: Json | null
          status?: string | null
          updated_at?: string
          variables: Json
          worst_case_results?: Json | null
        }
        Update: {
          base_parameters?: Json
          best_case_results?: Json | null
          constraints?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean | null
          monte_carlo_iterations?: number | null
          name?: string
          recommendations?: Json | null
          run_completed_at?: string | null
          run_started_at?: string | null
          scenario_type?: string
          sensitivity_analysis?: Json | null
          shared_with?: string[] | null
          simulation_results?: Json | null
          status?: string | null
          updated_at?: string
          variables?: Json
          worst_case_results?: Json | null
        }
        Relationships: []
      }
      scheduled_health_checks: {
        Row: {
          check_type: string
          created_at: string
          details: Json
          email_sent: boolean | null
          email_sent_at: string | null
          error_modules: number
          healthy_modules: number
          id: string
          overall_status: string
          total_modules: number
          warning_modules: number
        }
        Insert: {
          check_type: string
          created_at?: string
          details: Json
          email_sent?: boolean | null
          email_sent_at?: string | null
          error_modules: number
          healthy_modules: number
          id?: string
          overall_status: string
          total_modules: number
          warning_modules: number
        }
        Update: {
          check_type?: string
          created_at?: string
          details?: Json
          email_sent?: boolean | null
          email_sent_at?: string | null
          error_modules?: number
          healthy_modules?: number
          id?: string
          overall_status?: string
          total_modules?: number
          warning_modules?: number
        }
        Relationships: []
      }
      sector_chart_of_accounts: {
        Row: {
          account_structure: Json
          benchmark_ranges: Json
          cnae_codes: string[]
          compliance_rules: Json | null
          created_at: string | null
          id: string
          ratio_definitions: Json
          sector_key: string
          sector_name: string
          tax_implications: Json | null
          updated_at: string | null
          zscore_coefficients: Json
          zscore_model: string | null
        }
        Insert: {
          account_structure?: Json
          benchmark_ranges?: Json
          cnae_codes?: string[]
          compliance_rules?: Json | null
          created_at?: string | null
          id?: string
          ratio_definitions?: Json
          sector_key: string
          sector_name: string
          tax_implications?: Json | null
          updated_at?: string | null
          zscore_coefficients?: Json
          zscore_model?: string | null
        }
        Update: {
          account_structure?: Json
          benchmark_ranges?: Json
          cnae_codes?: string[]
          compliance_rules?: Json | null
          created_at?: string | null
          id?: string
          ratio_definitions?: Json
          sector_key?: string
          sector_name?: string
          tax_implications?: Json | null
          updated_at?: string | null
          zscore_coefficients?: Json
          zscore_model?: string | null
        }
        Relationships: []
      }
      sector_ratio_benchmarks: {
        Row: {
          average_value: number | null
          cnae_code: string
          created_at: string | null
          id: string
          max_value: number | null
          min_value: number | null
          ratio_category: string
          ratio_name: string
          sample_size: number | null
          sector_key: string
          source: string | null
          standard_deviation: number | null
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          average_value?: number | null
          cnae_code: string
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          ratio_category?: string
          ratio_name: string
          sample_size?: number | null
          sector_key: string
          source?: string | null
          standard_deviation?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          average_value?: number | null
          cnae_code?: string
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          ratio_category?: string
          ratio_name?: string
          sample_size?: number | null
          sector_key?: string
          source?: string | null
          standard_deviation?: number | null
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      sector_regulations: {
        Row: {
          authority: string
          created_at: string | null
          effective_date: string | null
          expiration_date: string | null
          full_text_url: string | null
          id: string
          impact_level: Database["public"]["Enums"]["impact_level"] | null
          is_mandatory: boolean | null
          iso_codes: string[] | null
          publication_date: string | null
          regulation_code: string
          regulation_name: string
          requirements: Json | null
          sector_key: string
          status: Database["public"]["Enums"]["regulation_status"] | null
          summary: string | null
          superseded_by: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          authority: string
          created_at?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          full_text_url?: string | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"] | null
          is_mandatory?: boolean | null
          iso_codes?: string[] | null
          publication_date?: string | null
          regulation_code: string
          regulation_name: string
          requirements?: Json | null
          sector_key: string
          status?: Database["public"]["Enums"]["regulation_status"] | null
          summary?: string | null
          superseded_by?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          authority?: string
          created_at?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          full_text_url?: string | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"] | null
          is_mandatory?: boolean | null
          iso_codes?: string[] | null
          publication_date?: string | null
          regulation_code?: string
          regulation_name?: string
          requirements?: Json | null
          sector_key?: string
          status?: Database["public"]["Enums"]["regulation_status"] | null
          summary?: string | null
          superseded_by?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sector_regulations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "sector_regulations"
            referencedColumns: ["id"]
          },
        ]
      }
      sector_zscore_coefficients: {
        Row: {
          created_at: string | null
          description: string | null
          gray_zone_min: number | null
          id: string
          safe_zone_min: number | null
          sector_key: string
          sector_name: string
          updated_at: string | null
          x1_coefficient: number | null
          x2_coefficient: number | null
          x3_coefficient: number | null
          x4_coefficient: number | null
          x5_coefficient: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          gray_zone_min?: number | null
          id?: string
          safe_zone_min?: number | null
          sector_key: string
          sector_name: string
          updated_at?: string | null
          x1_coefficient?: number | null
          x2_coefficient?: number | null
          x3_coefficient?: number | null
          x4_coefficient?: number | null
          x5_coefficient?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          gray_zone_min?: number | null
          id?: string
          safe_zone_min?: number | null
          sector_key?: string
          sector_name?: string
          updated_at?: string | null
          x1_coefficient?: number | null
          x2_coefficient?: number | null
          x3_coefficient?: number | null
          x4_coefficient?: number | null
          x5_coefficient?: number | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          affected_data_types: string[] | null
          affected_systems: string[] | null
          assigned_to: string | null
          authority_reference: string | null
          authority_report_date: string | null
          containment_time: string | null
          created_at: string
          description: string
          detection_time: string
          id: string
          incident_type: string
          lessons_learned: string | null
          remediation_actions: string | null
          reported_by: string | null
          reported_to_authority: boolean | null
          resolution_time: string | null
          root_cause: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_data_types?: string[] | null
          affected_systems?: string[] | null
          assigned_to?: string | null
          authority_reference?: string | null
          authority_report_date?: string | null
          containment_time?: string | null
          created_at?: string
          description: string
          detection_time: string
          id?: string
          incident_type: string
          lessons_learned?: string | null
          remediation_actions?: string | null
          reported_by?: string | null
          reported_to_authority?: boolean | null
          resolution_time?: string | null
          root_cause?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_data_types?: string[] | null
          affected_systems?: string[] | null
          assigned_to?: string | null
          authority_reference?: string | null
          authority_report_date?: string | null
          containment_time?: string | null
          created_at?: string
          description?: string
          detection_time?: string
          id?: string
          incident_type?: string
          lessons_learned?: string | null
          remediation_actions?: string | null
          reported_by?: string | null
          reported_to_authority?: boolean | null
          resolution_time?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      segment_management_policies: {
        Row: {
          action_triggers: Json | null
          automated_actions: Json | null
          communication_channel: string[] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          offer_types: string[] | null
          policy_name: string
          priority_level: number | null
          segment_name: string
          target_metrics: Json | null
          updated_at: string
          visit_frequency_days: number | null
        }
        Insert: {
          action_triggers?: Json | null
          automated_actions?: Json | null
          communication_channel?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          offer_types?: string[] | null
          policy_name: string
          priority_level?: number | null
          segment_name: string
          target_metrics?: Json | null
          updated_at?: string
          visit_frequency_days?: number | null
        }
        Update: {
          action_triggers?: Json | null
          automated_actions?: Json | null
          communication_channel?: string[] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          offer_types?: string[] | null
          policy_name?: string
          priority_level?: number | null
          segment_name?: string
          target_metrics?: Json | null
          updated_at?: string
          visit_frequency_days?: number | null
        }
        Relationships: []
      }
      segment_members: {
        Row: {
          added_at: string | null
          company_id: string
          contact_id: string | null
          id: string
          is_active: boolean | null
          match_score: number | null
          metadata: Json | null
          removed_at: string | null
          segment_id: string
        }
        Insert: {
          added_at?: string | null
          company_id: string
          contact_id?: string | null
          id?: string
          is_active?: boolean | null
          match_score?: number | null
          metadata?: Json | null
          removed_at?: string | null
          segment_id: string
        }
        Update: {
          added_at?: string | null
          company_id?: string
          contact_id?: string | null
          id?: string
          is_active?: boolean | null
          match_score?: number | null
          metadata?: Json | null
          removed_at?: string | null
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segment_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segment_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      segment_rules: {
        Row: {
          auto_enroll_journeys: string[] | null
          condition_logic: string | null
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_refreshed_at: string | null
          member_count: number | null
          name: string
          refresh_frequency: unknown
          rule_type: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          auto_enroll_journeys?: string[] | null
          condition_logic?: string | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          member_count?: number | null
          name: string
          refresh_frequency?: unknown
          rule_type?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          auto_enroll_journeys?: string[] | null
          condition_logic?: string | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_refreshed_at?: string | null
          member_count?: number | null
          name?: string
          refresh_frequency?: unknown
          rule_type?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sepa_instant_payments: {
        Row: {
          amount: number
          created_at: string | null
          creditor_bic: string | null
          creditor_iban: string
          creditor_name: string
          currency: string | null
          debtor_iban: string
          debtor_name: string
          end_to_end_id: string
          id: string
          instruction_id: string | null
          processing_time_ms: number | null
          rejection_reason: string | null
          remittance_info: string | null
          settlement_date: string | null
          status: string | null
          tpp_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          creditor_bic?: string | null
          creditor_iban: string
          creditor_name: string
          currency?: string | null
          debtor_iban: string
          debtor_name: string
          end_to_end_id: string
          id?: string
          instruction_id?: string | null
          processing_time_ms?: number | null
          rejection_reason?: string | null
          remittance_info?: string | null
          settlement_date?: string | null
          status?: string | null
          tpp_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          creditor_bic?: string | null
          creditor_iban?: string
          creditor_name?: string
          currency?: string | null
          debtor_iban?: string
          debtor_name?: string
          end_to_end_id?: string
          id?: string
          instruction_id?: string | null
          processing_time_ms?: number | null
          rejection_reason?: string | null
          remittance_info?: string | null
          settlement_date?: string | null
          status?: string | null
          tpp_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      session_risk_assessments: {
        Row: {
          created_at: string | null
          device_fingerprint_id: string | null
          id: string
          ip_address: string | null
          location_data: Json | null
          location_id: string | null
          requires_step_up: boolean | null
          risk_factors: Json | null
          risk_level: Database["public"]["Enums"]["auth_risk_level"]
          risk_score: number
          session_id: string
          step_up_completed: boolean | null
          step_up_factor: Database["public"]["Enums"]["auth_factor_type"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint_id?: string | null
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          location_id?: string | null
          requires_step_up?: boolean | null
          risk_factors?: Json | null
          risk_level?: Database["public"]["Enums"]["auth_risk_level"]
          risk_score?: number
          session_id: string
          step_up_completed?: boolean | null
          step_up_factor?:
            | Database["public"]["Enums"]["auth_factor_type"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint_id?: string | null
          id?: string
          ip_address?: string | null
          location_data?: Json | null
          location_id?: string | null
          requires_step_up?: boolean | null
          risk_factors?: Json | null
          risk_level?: Database["public"]["Enums"]["auth_risk_level"]
          risk_score?: number
          session_id?: string
          step_up_completed?: boolean | null
          step_up_factor?:
            | Database["public"]["Enums"]["auth_factor_type"]
            | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_risk_assessments_device_fingerprint_id_fkey"
            columns: ["device_fingerprint_id"]
            isOneToOne: false
            referencedRelation: "user_device_fingerprints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_risk_assessments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "user_location_history"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_delivery_logs: {
        Row: {
          id: string
          logged_at: string
          provider_response: Json | null
          sms_id: string | null
          status: string
          status_code: string | null
        }
        Insert: {
          id?: string
          logged_at?: string
          provider_response?: Json | null
          sms_id?: string | null
          status: string
          status_code?: string | null
        }
        Update: {
          id?: string
          logged_at?: string
          provider_response?: Json | null
          sms_id?: string | null
          status?: string
          status_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_delivery_logs_sms_id_fkey"
            columns: ["sms_id"]
            isOneToOne: false
            referencedRelation: "sms_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_notifications: {
        Row: {
          company_id: string | null
          contact_name: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string
          phone_number: string
          provider_message_id: string | null
          retry_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          phone_number: string
          provider_message_id?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          phone_number?: string
          provider_message_id?: string | null
          retry_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_notifications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          usage_count: number | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          usage_count?: number | null
          variables?: string[] | null
        }
        Relationships: []
      }
      status_colors: {
        Row: {
          color_hex: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          status_name: string
          updated_at: string | null
        }
        Insert: {
          color_hex: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          status_name: string
          updated_at?: string | null
        }
        Update: {
          color_hex?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          status_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_bundles: {
        Row: {
          badge: string | null
          bundle_key: string
          bundle_name: string
          bundle_price: number
          created_at: string
          current_uses: number | null
          description: string | null
          discount_percent: number
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_uses: number | null
          module_keys: string[]
          original_price: number
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          badge?: string | null
          bundle_key: string
          bundle_name: string
          bundle_price: number
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_percent: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_uses?: number | null
          module_keys: string[]
          original_price: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          badge?: string | null
          bundle_key?: string
          bundle_name?: string
          bundle_price?: number
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_percent?: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_uses?: number | null
          module_keys?: string[]
          original_price?: number
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      store_cart: {
        Row: {
          added_at: string
          id: string
          license_type: string | null
          module_id: string | null
          module_key: string
          quantity: number
          session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          added_at?: string
          id?: string
          license_type?: string | null
          module_id?: string | null
          module_key: string
          quantity?: number
          session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          added_at?: string
          id?: string
          license_type?: string | null
          module_id?: string | null
          module_key?: string
          quantity?: number
          session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_cart_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      store_order_items: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          license_duration_months: number | null
          module_id: string | null
          module_key: string
          module_name: string
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          license_duration_months?: number | null
          module_id?: string | null
          module_key: string
          module_name: string
          order_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          license_duration_months?: number | null
          module_id?: string | null
          module_key?: string
          module_name?: string
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "store_order_items_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "app_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "store_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_orders: {
        Row: {
          billing_address: string | null
          company_name: string | null
          country: string | null
          created_at: string
          currency: string | null
          customer_email: string
          customer_name: string | null
          discount_amount: number | null
          id: string
          license_type: string | null
          metadata: Json | null
          notes: string | null
          order_number: string
          phone: string | null
          promo_code: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          subtotal: number
          tax_amount: number | null
          tax_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          customer_email: string
          customer_name?: string | null
          discount_amount?: number | null
          id?: string
          license_type?: string | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          phone?: string | null
          promo_code?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          currency?: string | null
          customer_email?: string
          customer_name?: string | null
          discount_amount?: number | null
          id?: string
          license_type?: string | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string
          phone?: string | null
          promo_code?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          tax_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_promotions: {
        Row: {
          applicable_modules: string[] | null
          created_at: string
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          min_order_amount: number | null
          promo_code: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_modules?: string[] | null
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          promo_code: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_modules?: string[] | null
          created_at?: string
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          promo_code?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      stress_test_executions: {
        Row: {
          created_at: string
          error_message: string | null
          executed_by: string | null
          execution_end: string | null
          execution_start: string
          id: string
          metrics: Json | null
          passed: boolean | null
          results: Json | null
          simulation_id: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          executed_by?: string | null
          execution_end?: string | null
          execution_start?: string
          id?: string
          metrics?: Json | null
          passed?: boolean | null
          results?: Json | null
          simulation_id: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          executed_by?: string | null
          execution_end?: string | null
          execution_start?: string
          id?: string
          metrics?: Json | null
          passed?: boolean | null
          results?: Json | null
          simulation_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "stress_test_executions_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "stress_test_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      stress_test_simulations: {
        Row: {
          created_at: string
          created_by: string | null
          execution_duration_seconds: number | null
          execution_mode: string
          id: string
          last_execution: string | null
          metrics: Json | null
          next_execution: string | null
          passed: boolean | null
          results: Json | null
          scenario_description: string | null
          schedule_cron: string | null
          simulation_name: string
          simulation_type: string
          status: string
          success_criteria: Json | null
          target_systems: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          execution_duration_seconds?: number | null
          execution_mode?: string
          id?: string
          last_execution?: string | null
          metrics?: Json | null
          next_execution?: string | null
          passed?: boolean | null
          results?: Json | null
          scenario_description?: string | null
          schedule_cron?: string | null
          simulation_name: string
          simulation_type: string
          status?: string
          success_criteria?: Json | null
          target_systems?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          execution_duration_seconds?: number | null
          execution_mode?: string
          id?: string
          last_execution?: string | null
          metrics?: Json | null
          next_execution?: string | null
          passed?: boolean | null
          results?: Json | null
          scenario_description?: string | null
          schedule_cron?: string | null
          simulation_name?: string
          simulation_type?: string
          status?: string
          success_criteria?: Json | null
          target_systems?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      suggestion_votes: {
        Row: {
          created_at: string
          id: string
          suggestion_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "user_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_diagnostic_logs: {
        Row: {
          checks: Json
          created_at: string
          diagnostic_type: string
          error_details: string | null
          id: string
          module_key: string | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          checks?: Json
          created_at?: string
          diagnostic_type: string
          error_details?: string | null
          id?: string
          module_key?: string | null
          status: string
          triggered_by?: string | null
        }
        Update: {
          checks?: Json
          created_at?: string
          diagnostic_type?: string
          error_details?: string | null
          id?: string
          module_key?: string | null
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      third_party_providers: {
        Row: {
          certifications: string[] | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          created_at: string
          created_by: string | null
          criticality: string
          data_access_level: string | null
          data_location: string | null
          exit_strategy: string | null
          id: string
          incident_count: number | null
          last_audit_date: string | null
          next_audit_date: string | null
          notes: string | null
          provider_name: string
          provider_type: string
          risk_level: string | null
          risk_score: number | null
          services_provided: string[] | null
          sla_compliance_rate: number | null
          status: string
          substitute_provider: string | null
          updated_at: string
        }
        Insert: {
          certifications?: string[] | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          created_by?: string | null
          criticality: string
          data_access_level?: string | null
          data_location?: string | null
          exit_strategy?: string | null
          id?: string
          incident_count?: number | null
          last_audit_date?: string | null
          next_audit_date?: string | null
          notes?: string | null
          provider_name: string
          provider_type: string
          risk_level?: string | null
          risk_score?: number | null
          services_provided?: string[] | null
          sla_compliance_rate?: number | null
          status?: string
          substitute_provider?: string | null
          updated_at?: string
        }
        Update: {
          certifications?: string[] | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          created_at?: string
          created_by?: string | null
          criticality?: string
          data_access_level?: string | null
          data_location?: string | null
          exit_strategy?: string | null
          id?: string
          incident_count?: number | null
          last_audit_date?: string | null
          next_audit_date?: string | null
          notes?: string | null
          provider_name?: string
          provider_type?: string
          risk_level?: string | null
          risk_score?: number | null
          services_provided?: string[] | null
          sla_compliance_rate?: number | null
          status?: string
          substitute_provider?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tpp_premium_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          started_at: string | null
          status: string | null
          tier_id: string | null
          tpp_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          tier_id?: string | null
          tpp_id: string
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          tier_id?: string | null
          tpp_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tpp_premium_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "premium_api_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      tpp_rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          tpp_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          tpp_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          tpp_id?: string
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "tpp_rate_limits_tpp_id_fkey"
            columns: ["tpp_id"]
            isOneToOne: false
            referencedRelation: "registered_tpps"
            referencedColumns: ["tpp_id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint_id: string | null
          device_name: string | null
          id: string
          is_active: boolean | null
          trusted_at: string
          trusted_by: string | null
          trusted_until: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          trusted_at?: string
          trusted_by?: string | null
          trusted_until?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          trusted_at?: string
          trusted_by?: string | null
          trusted_until?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trusted_devices_device_fingerprint_id_fkey"
            columns: ["device_fingerprint_id"]
            isOneToOne: false
            referencedRelation: "user_device_fingerprints"
            referencedColumns: ["id"]
          },
        ]
      }
      user_behavior_patterns: {
        Row: {
          avg_session_duration: number | null
          created_at: string | null
          id: string
          last_analyzed_at: string | null
          typical_actions_per_session: number | null
          typical_devices: Json | null
          typical_locations: Json | null
          typical_login_hours: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_session_duration?: number | null
          created_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          typical_actions_per_session?: number | null
          typical_devices?: Json | null
          typical_locations?: Json | null
          typical_login_hours?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_session_duration?: number | null
          created_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          typical_actions_per_session?: number | null
          typical_devices?: Json | null
          typical_locations?: Json | null
          typical_login_hours?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_device_fingerprints: {
        Row: {
          browser_info: Json | null
          created_at: string | null
          device_hash: string
          first_seen_at: string | null
          id: string
          is_trusted: boolean | null
          language: string | null
          last_ip: string | null
          last_location: string | null
          last_seen_at: string | null
          login_count: number | null
          os_info: Json | null
          screen_resolution: string | null
          timezone: string | null
          trust_expires_at: string | null
          user_id: string
        }
        Insert: {
          browser_info?: Json | null
          created_at?: string | null
          device_hash: string
          first_seen_at?: string | null
          id?: string
          is_trusted?: boolean | null
          language?: string | null
          last_ip?: string | null
          last_location?: string | null
          last_seen_at?: string | null
          login_count?: number | null
          os_info?: Json | null
          screen_resolution?: string | null
          timezone?: string | null
          trust_expires_at?: string | null
          user_id: string
        }
        Update: {
          browser_info?: Json | null
          created_at?: string | null
          device_hash?: string
          first_seen_at?: string | null
          id?: string
          is_trusted?: boolean | null
          language?: string | null
          last_ip?: string | null
          last_location?: string | null
          last_seen_at?: string | null
          login_count?: number | null
          os_info?: Json | null
          screen_resolution?: string | null
          timezone?: string | null
          trust_expires_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_location_history: {
        Row: {
          city: string | null
          country_code: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          is_vpn: boolean | null
          latitude: number | null
          longitude: number | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_vpn?: boolean | null
          latitude?: number | null
          longitude?: number | null
          user_id: string
        }
        Update: {
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          is_vpn?: boolean | null
          latitude?: number | null
          longitude?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_login_locations: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          id: string
          ip_address: string | null
          is_proxy: boolean | null
          is_vpn: boolean | null
          isp: string | null
          latitude: number | null
          longitude: number | null
          region: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          is_proxy?: boolean | null
          is_vpn?: boolean | null
          isp?: string | null
          latitude?: number | null
          longitude?: number | null
          region?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_passkeys: {
        Row: {
          active: boolean
          counter: number
          created_at: string
          credential_id: string
          device_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          counter?: number
          created_at?: string
          credential_id: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          counter?: number
          created_at?: string
          credential_id?: string
          device_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_suggestions: {
        Row: {
          admin_notes: string | null
          ai_response: string | null
          category: string | null
          context: string | null
          created_at: string
          id: string
          priority: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source: string | null
          status: string | null
          suggestion_text: string
          updated_at: string
          user_id: string | null
          votes_count: number | null
        }
        Insert: {
          admin_notes?: string | null
          ai_response?: string | null
          category?: string | null
          context?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
          suggestion_text: string
          updated_at?: string
          user_id?: string | null
          votes_count?: number | null
        }
        Update: {
          admin_notes?: string | null
          ai_response?: string | null
          category?: string | null
          context?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source?: string | null
          status?: string | null
          suggestion_text?: string
          updated_at?: string
          user_id?: string | null
          votes_count?: number | null
        }
        Relationships: []
      }
      vertical_bpmn_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          process_definition: Json | null
          template_key: string
          template_name: string
          vertical_pack_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          process_definition?: Json | null
          template_key: string
          template_name: string
          vertical_pack_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          process_definition?: Json | null
          template_key?: string
          template_name?: string
          vertical_pack_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vertical_bpmn_templates_vertical_pack_id_fkey"
            columns: ["vertical_pack_id"]
            isOneToOne: false
            referencedRelation: "vertical_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      vertical_dashboards: {
        Row: {
          created_at: string | null
          dashboard_key: string
          dashboard_name: string
          id: string
          is_default: boolean | null
          layout: Json | null
          vertical_pack_id: string | null
          widgets: Json | null
        }
        Insert: {
          created_at?: string | null
          dashboard_key: string
          dashboard_name: string
          id?: string
          is_default?: boolean | null
          layout?: Json | null
          vertical_pack_id?: string | null
          widgets?: Json | null
        }
        Update: {
          created_at?: string | null
          dashboard_key?: string
          dashboard_name?: string
          id?: string
          is_default?: boolean | null
          layout?: Json | null
          vertical_pack_id?: string | null
          widgets?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "vertical_dashboards_vertical_pack_id_fkey"
            columns: ["vertical_pack_id"]
            isOneToOne: false
            referencedRelation: "vertical_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      vertical_integrations: {
        Row: {
          api_type: string | null
          config_schema: Json | null
          created_at: string | null
          documentation_url: string | null
          id: string
          integration_key: string
          integration_name: string
          is_active: boolean | null
          is_required: boolean | null
          provider: string | null
          vertical_pack_id: string | null
        }
        Insert: {
          api_type?: string | null
          config_schema?: Json | null
          created_at?: string | null
          documentation_url?: string | null
          id?: string
          integration_key: string
          integration_name: string
          is_active?: boolean | null
          is_required?: boolean | null
          provider?: string | null
          vertical_pack_id?: string | null
        }
        Update: {
          api_type?: string | null
          config_schema?: Json | null
          created_at?: string | null
          documentation_url?: string | null
          id?: string
          integration_key?: string
          integration_name?: string
          is_active?: boolean | null
          is_required?: boolean | null
          provider?: string | null
          vertical_pack_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vertical_integrations_vertical_pack_id_fkey"
            columns: ["vertical_pack_id"]
            isOneToOne: false
            referencedRelation: "vertical_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      vertical_modules: {
        Row: {
          component_path: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          is_core: boolean | null
          module_key: string
          module_name: string
          updated_at: string | null
          vertical_pack_id: string | null
        }
        Insert: {
          component_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_core?: boolean | null
          module_key: string
          module_name: string
          updated_at?: string | null
          vertical_pack_id?: string | null
        }
        Update: {
          component_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          is_core?: boolean | null
          module_key?: string
          module_name?: string
          updated_at?: string | null
          vertical_pack_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vertical_modules_vertical_pack_id_fkey"
            columns: ["vertical_pack_id"]
            isOneToOne: false
            referencedRelation: "vertical_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      vertical_packs: {
        Row: {
          bpmn_templates: Json | null
          cnae_codes: string[]
          color_scheme: Json | null
          created_at: string | null
          dashboard_templates: Json | null
          demo_config: Json | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          included_integrations: string[] | null
          included_modules: string[]
          is_active: boolean | null
          pricing_config: Json | null
          updated_at: string | null
          vertical_key: string
          vertical_name: string
        }
        Insert: {
          bpmn_templates?: Json | null
          cnae_codes?: string[]
          color_scheme?: Json | null
          created_at?: string | null
          dashboard_templates?: Json | null
          demo_config?: Json | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          included_integrations?: string[] | null
          included_modules?: string[]
          is_active?: boolean | null
          pricing_config?: Json | null
          updated_at?: string | null
          vertical_key: string
          vertical_name: string
        }
        Update: {
          bpmn_templates?: Json | null
          cnae_codes?: string[]
          color_scheme?: Json | null
          created_at?: string | null
          dashboard_templates?: Json | null
          demo_config?: Json | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          included_integrations?: string[] | null
          included_modules?: string[]
          is_active?: boolean | null
          pricing_config?: Json | null
          updated_at?: string | null
          vertical_key?: string
          vertical_name?: string
        }
        Relationships: []
      }
      visit_participants: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
          visit_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_participants_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_reminder_preferences: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          minutes_before: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          minutes_before?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          minutes_before?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visit_sheet_audit: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          user_id: string | null
          visit_sheet_id: string
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
          visit_sheet_id: string
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          user_id?: string | null
          visit_sheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_sheet_audit_visit_sheet_id_fkey"
            columns: ["visit_sheet_id"]
            isOneToOne: false
            referencedRelation: "visit_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_sheet_photos: {
        Row: {
          created_at: string
          id: string
          photo_caption: string | null
          photo_url: string
          uploaded_at: string
          uploaded_by: string | null
          visit_sheet_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_caption?: string | null
          photo_url: string
          uploaded_at?: string
          uploaded_by?: string | null
          visit_sheet_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_caption?: string | null
          photo_url?: string
          uploaded_at?: string
          uploaded_by?: string | null
          visit_sheet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_sheet_photos_visit_sheet_id_fkey"
            columns: ["visit_sheet_id"]
            isOneToOne: false
            referencedRelation: "visit_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_sheet_templates: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          template_data: Json
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_data?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      visit_sheets: {
        Row: {
          acciones_acordadas: Json | null
          actualizacion_kyc: string | null
          ahorro_inversion_disponible: number | null
          ai_generated_at: string | null
          ai_next_steps: string[] | null
          ai_risks: string[] | null
          ai_summary: string | null
          canal: string | null
          cargo_contacto: string | null
          company_id: string
          created_at: string
          diagnostico_inicial: Json | null
          documentacion_pendiente: string | null
          duracion: number | null
          ebitda_estimado: number | null
          email_contacto: string | null
          endeudamiento_particular: number | null
          endeudamiento_total: number | null
          facturacion_anual: number | null
          fecha: string
          firma_digital: string | null
          firma_fecha: string | null
          firma_nombre_firmante: string | null
          gestor_id: string
          hora: string | null
          id: string
          ingresos_netos_mensuales: number | null
          liquidez_disponible: number | null
          necesidades_detectadas: Json | null
          nivel_vinculacion_recomendado: string | null
          notas_gestor: string | null
          oportunidades_futuras: string | null
          persona_contacto: string | null
          potencial_anual_estimado: number | null
          probabilidad_cierre: number | null
          productos_actuales: Json | null
          productos_ofrecidos: Json | null
          productos_servicios: Json | null
          propuesta_valor: Json | null
          proxima_cita: string | null
          proxima_llamada: string | null
          renovaciones: string | null
          responsable_seguimiento: string | null
          resultado_oferta: string | null
          revision_cartera: string | null
          riesgos_cumplimiento: Json | null
          situacion_laboral: string | null
          telefono_contacto: string | null
          template_id: string | null
          tipo_cliente: string | null
          tipo_visita: string | null
          tpv_volumen_mensual: number | null
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
          validation_status: string | null
          visit_id: string
        }
        Insert: {
          acciones_acordadas?: Json | null
          actualizacion_kyc?: string | null
          ahorro_inversion_disponible?: number | null
          ai_generated_at?: string | null
          ai_next_steps?: string[] | null
          ai_risks?: string[] | null
          ai_summary?: string | null
          canal?: string | null
          cargo_contacto?: string | null
          company_id: string
          created_at?: string
          diagnostico_inicial?: Json | null
          documentacion_pendiente?: string | null
          duracion?: number | null
          ebitda_estimado?: number | null
          email_contacto?: string | null
          endeudamiento_particular?: number | null
          endeudamiento_total?: number | null
          facturacion_anual?: number | null
          fecha: string
          firma_digital?: string | null
          firma_fecha?: string | null
          firma_nombre_firmante?: string | null
          gestor_id: string
          hora?: string | null
          id?: string
          ingresos_netos_mensuales?: number | null
          liquidez_disponible?: number | null
          necesidades_detectadas?: Json | null
          nivel_vinculacion_recomendado?: string | null
          notas_gestor?: string | null
          oportunidades_futuras?: string | null
          persona_contacto?: string | null
          potencial_anual_estimado?: number | null
          probabilidad_cierre?: number | null
          productos_actuales?: Json | null
          productos_ofrecidos?: Json | null
          productos_servicios?: Json | null
          propuesta_valor?: Json | null
          proxima_cita?: string | null
          proxima_llamada?: string | null
          renovaciones?: string | null
          responsable_seguimiento?: string | null
          resultado_oferta?: string | null
          revision_cartera?: string | null
          riesgos_cumplimiento?: Json | null
          situacion_laboral?: string | null
          telefono_contacto?: string | null
          template_id?: string | null
          tipo_cliente?: string | null
          tipo_visita?: string | null
          tpv_volumen_mensual?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
          visit_id: string
        }
        Update: {
          acciones_acordadas?: Json | null
          actualizacion_kyc?: string | null
          ahorro_inversion_disponible?: number | null
          ai_generated_at?: string | null
          ai_next_steps?: string[] | null
          ai_risks?: string[] | null
          ai_summary?: string | null
          canal?: string | null
          cargo_contacto?: string | null
          company_id?: string
          created_at?: string
          diagnostico_inicial?: Json | null
          documentacion_pendiente?: string | null
          duracion?: number | null
          ebitda_estimado?: number | null
          email_contacto?: string | null
          endeudamiento_particular?: number | null
          endeudamiento_total?: number | null
          facturacion_anual?: number | null
          fecha?: string
          firma_digital?: string | null
          firma_fecha?: string | null
          firma_nombre_firmante?: string | null
          gestor_id?: string
          hora?: string | null
          id?: string
          ingresos_netos_mensuales?: number | null
          liquidez_disponible?: number | null
          necesidades_detectadas?: Json | null
          nivel_vinculacion_recomendado?: string | null
          notas_gestor?: string | null
          oportunidades_futuras?: string | null
          persona_contacto?: string | null
          potencial_anual_estimado?: number | null
          probabilidad_cierre?: number | null
          productos_actuales?: Json | null
          productos_ofrecidos?: Json | null
          productos_servicios?: Json | null
          propuesta_valor?: Json | null
          proxima_cita?: string | null
          proxima_llamada?: string | null
          renovaciones?: string | null
          responsable_seguimiento?: string | null
          resultado_oferta?: string | null
          revision_cartera?: string | null
          riesgos_cumplimiento?: Json | null
          situacion_laboral?: string | null
          telefono_contacto?: string | null
          template_id?: string | null
          tipo_cliente?: string | null
          tipo_visita?: string | null
          tpv_volumen_mensual?: number | null
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          validation_status?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_sheets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_responsable_seguimiento_fkey"
            columns: ["responsable_seguimiento"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "visit_sheet_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_sheets_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          company_id: string
          created_at: string | null
          gestor_id: string
          id: string
          notes: string | null
          pactos_realizados: string | null
          porcentaje_vinculacion: number | null
          productos_ofrecidos: string[] | null
          result: string | null
          visit_date: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          gestor_id: string
          id?: string
          notes?: string | null
          pactos_realizados?: string | null
          porcentaje_vinculacion?: number | null
          productos_ofrecidos?: string[] | null
          result?: string | null
          visit_date: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          gestor_id?: string
          id?: string
          notes?: string | null
          pactos_realizados?: string | null
          porcentaje_vinculacion?: number | null
          productos_ofrecidos?: string[] | null
          result?: string | null
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vrp_mandates: {
        Row: {
          consent_id: string | null
          created_at: string | null
          creditor_account: string
          creditor_name: string
          currency: string | null
          debtor_account: string
          frequency: string
          id: string
          max_amount: number
          max_per_period: number | null
          reference: string | null
          status: string | null
          tpp_id: string
          updated_at: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          consent_id?: string | null
          created_at?: string | null
          creditor_account: string
          creditor_name: string
          currency?: string | null
          debtor_account: string
          frequency: string
          id?: string
          max_amount: number
          max_per_period?: number | null
          reference?: string | null
          status?: string | null
          tpp_id: string
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          consent_id?: string | null
          created_at?: string | null
          creditor_account?: string
          creditor_name?: string
          currency?: string | null
          debtor_account?: string
          frequency?: string
          id?: string
          max_amount?: number
          max_per_period?: number | null
          reference?: string | null
          status?: string | null
          tpp_id?: string
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vrp_mandates_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "open_banking_consents"
            referencedColumns: ["id"]
          },
        ]
      }
      vrp_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          end_to_end_id: string
          execution_date: string | null
          failure_reason: string | null
          id: string
          mandate_id: string | null
          payment_reference: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          end_to_end_id: string
          execution_date?: string | null
          failure_reason?: string | null
          id?: string
          mandate_id?: string | null
          payment_reference?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          end_to_end_id?: string
          execution_date?: string | null
          failure_reason?: string | null
          id?: string
          mandate_id?: string | null
          payment_reference?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vrp_payments_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "vrp_mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_delivery_logs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          notification_id: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number | null
          success: boolean | null
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          success?: boolean | null
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          notification_id?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number | null
          success?: boolean | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_delivery_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "notification_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      anonymize_financial_data_for_training: {
        Args: {
          p_data_type: string
          p_period_end: string
          p_period_start: string
        }
        Returns: string
      }
      calculate_cnae_price: {
        Args: {
          p_cnae_code: string
          p_company_turnover?: number
          p_existing_cnaes?: number
        }
        Returns: Json
      }
      calculate_customer_360: {
        Args: { p_company_id: string }
        Returns: undefined
      }
      can_view_alert: {
        Args: { _alert_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_alert_history: {
        Args: { _alert_history_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_profile: {
        Args: { _profile_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_visit_sheet: {
        Args: { _user_id: string; _visit_sheet_id: string }
        Returns: boolean
      }
      check_expiring_acknowledgments: { Args: never; Returns: undefined }
      check_pending_acknowledgments: { Args: never; Returns: undefined }
      check_tpp_rate_limit: {
        Args: { p_endpoint: string; p_tpp_id: string }
        Returns: boolean
      }
      cleanup_expired_training_data: { Args: never; Returns: number }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      cleanup_tpp_rate_limits: { Args: never; Returns: undefined }
      detect_process_bottlenecks: {
        Args: { p_date_from?: string; p_process_definition_id?: string }
        Returns: {
          avg_duration_ms: number
          bottleneck_score: number
          event_count: number
          max_duration_ms: number
          min_duration_ms: number
          node_id: string
        }[]
      }
      emit_process_event: {
        Args: {
          p_action: string
          p_actor_type?: string
          p_entity_id: string
          p_entity_type: string
          p_from_state?: string
          p_metadata?: Json
          p_to_state?: string
        }
        Returns: string
      }
      expire_open_banking_consents: { Args: never; Returns: undefined }
      find_applicable_bundles: {
        Args: { p_cnae_codes: string[] }
        Returns: {
          bundle_id: string
          bundle_name: string
          discount_percentage: number
          match_count: number
          matching_cnaes: string[]
        }[]
      }
      get_company_chart_of_accounts: {
        Args: { p_company_id: string }
        Returns: Json
      }
      get_customer_quote_by_token: {
        Args: { p_email: string; p_quote_id: string }
        Returns: {
          customer_company: string
          customer_email: string
          customer_name: string
          items: Json
          quote_id: string
          status: string
          valid_until: string
        }[]
      }
      get_installed_modules: {
        Args: { _organization_id?: string }
        Returns: {
          category: Database["public"]["Enums"]["module_category"]
          license_type: Database["public"]["Enums"]["license_type"]
          module_key: string
          module_name: string
          sector: Database["public"]["Enums"]["sector_type"]
          settings: Json
          valid_until: string
        }[]
      }
      get_process_mining_stats: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_entity_type?: string
        }
        Returns: Json
      }
      get_sector_ratios: { Args: { p_cnae_code: string }; Returns: Json }
      get_sector_regulations: {
        Args: { _sector_key: string }
        Returns: {
          authority: string
          id: string
          impact_level: Database["public"]["Enums"]["impact_level"]
          regulation_code: string
          regulation_name: string
          requirements: Json
          summary: string
        }[]
      }
      get_turnover_tier: { Args: { p_turnover: number }; Returns: string }
      get_volume_discount: { Args: { p_cnae_count: number }; Returns: number }
      get_zscore_coefficients: { Args: { p_sector_key: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_superadmin: { Args: { _user_id: string }; Returns: boolean }
      is_mfa_required_for_role: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_module_installed: {
        Args: { _module_key: string; _organization_id?: string }
        Returns: boolean
      }
      is_partner_member: {
        Args: { _partner_company_id: string; _user_id: string }
        Returns: boolean
      }
      is_visit_gestor: {
        Args: { _user_id: string; _visit_id: string }
        Returns: boolean
      }
      is_visit_participant: {
        Args: { _user_id: string; _visit_id: string }
        Returns: boolean
      }
      load_sector_compliance: {
        Args: { p_organization_id: string; p_sector: string }
        Returns: number
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_category?: string
          p_ip_address?: unknown
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_severity?: string
          p_table_name: string
          p_user_agent?: string
        }
        Returns: string
      }
      log_cms_audit: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_name?: string
          p_entity_type: string
          p_new_value?: Json
          p_old_value?: Json
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          _action: string
          _details?: Json
          _resource_id?: string
          _resource_type: string
          _severity?: string
        }
        Returns: undefined
      }
      publish_notification: {
        Args: {
          p_action_label?: string
          p_action_url?: string
          p_channel_name: string
          p_event_type?: string
          p_message: string
          p_metadata?: Json
          p_priority?: number
          p_severity?: string
          p_target_roles?: string[]
          p_target_user_ids?: string[]
          p_title: string
        }
        Returns: string[]
      }
      search_financial_embeddings: {
        Args: {
          filter_company_id?: string
          filter_fiscal_year?: number
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          company_id: string
          content: string
          document_type: string
          fiscal_year: number
          id: string
          metadata: Json
          similarity: number
          statement_id: string
        }[]
      }
      subscribe_to_channel: {
        Args: {
          p_channel_name: string
          p_delivery_methods?: string[]
          p_user_id: string
        }
        Returns: string
      }
      validate_accounting_sync: {
        Args: { p_company_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "superadmin"
        | "admin"
        | "user"
        | "auditor"
        | "director_comercial"
        | "director_oficina"
        | "responsable_comercial"
      auth_factor_type:
        | "password"
        | "otp_email"
        | "otp_sms"
        | "device_trust"
        | "biometric"
        | "security_question"
      auth_risk_level: "low" | "medium" | "high" | "critical"
      financial_data_source: "manual" | "pdf_import"
      financial_statement_status: "draft" | "submitted" | "approved"
      financial_statement_type: "normal" | "abreujat" | "simplificat"
      impact_level: "critical" | "high" | "medium" | "low" | "informative"
      license_type: "perpetual" | "subscription" | "trial" | "free"
      module_category: "core" | "horizontal" | "vertical" | "addon"
      provisional_period_type: "quarterly" | "semiannual" | "annual"
      regulation_status:
        | "active"
        | "pending"
        | "superseded"
        | "expired"
        | "draft"
      sector_type:
        | "banking"
        | "health"
        | "industry"
        | "retail"
        | "realestate"
        | "technology"
        | "education"
        | "hospitality"
        | "logistics"
        | "energy"
        | "agriculture"
        | "professional"
        | "government"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "superadmin",
        "admin",
        "user",
        "auditor",
        "director_comercial",
        "director_oficina",
        "responsable_comercial",
      ],
      auth_factor_type: [
        "password",
        "otp_email",
        "otp_sms",
        "device_trust",
        "biometric",
        "security_question",
      ],
      auth_risk_level: ["low", "medium", "high", "critical"],
      financial_data_source: ["manual", "pdf_import"],
      financial_statement_status: ["draft", "submitted", "approved"],
      financial_statement_type: ["normal", "abreujat", "simplificat"],
      impact_level: ["critical", "high", "medium", "low", "informative"],
      license_type: ["perpetual", "subscription", "trial", "free"],
      module_category: ["core", "horizontal", "vertical", "addon"],
      provisional_period_type: ["quarterly", "semiannual", "annual"],
      regulation_status: [
        "active",
        "pending",
        "superseded",
        "expired",
        "draft",
      ],
      sector_type: [
        "banking",
        "health",
        "industry",
        "retail",
        "realestate",
        "technology",
        "education",
        "hospitality",
        "logistics",
        "energy",
        "agriculture",
        "professional",
        "government",
      ],
    },
  },
} as const
