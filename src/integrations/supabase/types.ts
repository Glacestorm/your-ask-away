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
      goals: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metric_type: string
          period_end: string
          period_start: string
          period_type: string
          target_value: number
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metric_type: string
          period_end: string
          period_start: string
          period_type: string
          target_value: number
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metric_type?: string
          period_end?: string
          period_start?: string
          period_type?: string
          target_value?: number
          updated_at?: string | null
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
      visit_sheets: {
        Row: {
          acciones_acordadas: Json | null
          actualizacion_kyc: string | null
          ahorro_inversion_disponible: number | null
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
      financial_data_source: "manual" | "pdf_import"
      financial_statement_status: "draft" | "submitted" | "approved"
      financial_statement_type: "normal" | "abreujat" | "simplificat"
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
      financial_data_source: ["manual", "pdf_import"],
      financial_statement_status: ["draft", "submitted", "approved"],
      financial_statement_type: ["normal", "abreujat", "simplificat"],
    },
  },
} as const
