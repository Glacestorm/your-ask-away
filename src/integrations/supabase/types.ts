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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
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
      notifications: {
        Row: {
          alert_id: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metric_value: number | null
          severity: string
          threshold_value: number | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metric_value?: number | null
          severity: string
          threshold_value?: number | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_id?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metric_value?: number | null
          severity?: string
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
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      check_tpp_rate_limit: {
        Args: { p_endpoint: string; p_tpp_id: string }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      cleanup_tpp_rate_limits: { Args: never; Returns: undefined }
      expire_open_banking_consents: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_superadmin: { Args: { _user_id: string }; Returns: boolean }
      is_visit_gestor: {
        Args: { _user_id: string; _visit_id: string }
        Returns: boolean
      }
      is_visit_participant: {
        Args: { _user_id: string; _visit_id: string }
        Returns: boolean
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
      provisional_period_type: "quarterly" | "semiannual" | "annual"
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
      provisional_period_type: ["quarterly", "semiannual", "annual"],
    },
  },
} as const
