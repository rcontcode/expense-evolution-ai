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
      admin_operational_costs: {
        Row: {
          amount_usd: number
          category: string
          created_at: string
          description: string | null
          id: string
          month: string
          period: string
          updated_at: string
        }
        Insert: {
          amount_usd?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          month?: string
          period?: string
          updated_at?: string
        }
        Update: {
          amount_usd?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          month?: string
          period?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          action_type: string
          contract_id: string | null
          created_at: string | null
          credits_used: number | null
          document_id: string | null
          error_message: string | null
          id: string
          success: boolean | null
          user_id: string
        }
        Insert: {
          action_type: string
          contract_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          success?: boolean | null
          user_id: string
        }
        Update: {
          action_type?: string
          contract_id?: string | null
          created_at?: string | null
          credits_used?: number | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          success?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          category: string
          created_at: string | null
          currency: string | null
          current_value: number
          entity_id: string | null
          id: string
          is_liquid: boolean | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          currency?: string | null
          current_value?: number
          entity_id?: string | null
          id?: string
          is_liquid?: boolean | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          currency?: string | null
          current_value?: number
          entity_id?: string | null
          id?: string
          is_liquid?: boolean | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          action_type: string
          executed_at: string
          id: string
          lead_id: string
          result_data: Json | null
          rule_id: string | null
          status: string
        }
        Insert: {
          action_type: string
          executed_at?: string
          id?: string
          lead_id: string
          result_data?: Json | null
          rule_id?: string | null
          status?: string
        }
        Update: {
          action_type?: string
          executed_at?: string
          id?: string
          lead_id?: string
          result_data?: Json | null
          rule_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          created_by: string | null
          delay_minutes: number | null
          description: string | null
          execution_count: number
          id: string
          is_enabled: boolean | null
          last_executed_at: string | null
          name: string
          trigger_condition: Json | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          delay_minutes?: number | null
          description?: string | null
          execution_count?: number
          id?: string
          is_enabled?: boolean | null
          last_executed_at?: string | null
          name: string
          trigger_condition?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          created_by?: string | null
          delay_minutes?: number | null
          description?: string | null
          execution_count?: number
          id?: string
          is_enabled?: boolean | null
          last_executed_at?: string | null
          name?: string
          trigger_condition?: Json | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          amount: number
          auto_categorized: boolean | null
          bank_name: string | null
          category: string | null
          created_at: string | null
          description: string | null
          duplicate_hash: string | null
          id: string
          is_recurring: boolean | null
          matched_expense_id: string | null
          matched_income_id: string | null
          original_amount: number | null
          recurring_type: string | null
          status: string | null
          transaction_date: string
          transaction_type: string | null
          user_id: string
        }
        Insert: {
          amount: number
          auto_categorized?: boolean | null
          bank_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duplicate_hash?: string | null
          id?: string
          is_recurring?: boolean | null
          matched_expense_id?: string | null
          matched_income_id?: string | null
          original_amount?: number | null
          recurring_type?: string | null
          status?: string | null
          transaction_date: string
          transaction_type?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          auto_categorized?: boolean | null
          bank_name?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duplicate_hash?: string | null
          id?: string
          is_recurring?: boolean | null
          matched_expense_id?: string | null
          matched_income_id?: string | null
          original_amount?: number | null
          recurring_type?: string | null
          status?: string | null
          transaction_date?: string
          transaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_matched_expense_id_fkey"
            columns: ["matched_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_matched_income_id_fkey"
            columns: ["matched_income_id"]
            isOneToOne: false
            referencedRelation: "income"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_bug_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          page_path: string | null
          report_type: string
          screenshot_url: string | null
          severity: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          page_path?: string | null
          report_type?: string
          screenshot_url?: string | null
          severity?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          page_path?: string | null
          report_type?: string
          screenshot_url?: string | null
          severity?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      beta_code_uses: {
        Row: {
          code_id: string | null
          id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code_id?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code_id?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beta_code_uses_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "beta_invitation_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_code_uses_used_by_fkey"
            columns: ["used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_feedback: {
        Row: {
          allow_as_testimonial: boolean
          comment: string | null
          created_at: string
          design_rating: number | null
          display_name_override: string | null
          ease_of_use: number | null
          id: string
          is_published_testimonial: boolean
          rating: number
          section: string
          suggestions: string | null
          testimonial_approved_at: string | null
          testimonial_approved_by: string | null
          usefulness: number | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          allow_as_testimonial?: boolean
          comment?: string | null
          created_at?: string
          design_rating?: number | null
          display_name_override?: string | null
          ease_of_use?: number | null
          id?: string
          is_published_testimonial?: boolean
          rating: number
          section: string
          suggestions?: string | null
          testimonial_approved_at?: string | null
          testimonial_approved_by?: string | null
          usefulness?: number | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          allow_as_testimonial?: boolean
          comment?: string | null
          created_at?: string
          design_rating?: number | null
          display_name_override?: string | null
          ease_of_use?: number | null
          id?: string
          is_published_testimonial?: boolean
          rating?: number
          section?: string
          suggestions?: string | null
          testimonial_approved_at?: string | null
          testimonial_approved_by?: string | null
          usefulness?: number | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: []
      }
      beta_goal_completions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_progress: number
          goal_id: string
          id: string
          points_awarded: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          goal_id: string
          id?: string
          points_awarded?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          goal_id?: string
          id?: string
          points_awarded?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beta_goal_completions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "beta_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_goals: {
        Row: {
          created_at: string
          description_en: string
          description_es: string
          goal_key: string
          goal_type: string
          icon: string
          id: string
          is_active: boolean
          name_en: string
          name_es: string
          points_reward: number
          sort_order: number
          target_value: number
        }
        Insert: {
          created_at?: string
          description_en: string
          description_es: string
          goal_key: string
          goal_type: string
          icon?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_es: string
          points_reward?: number
          sort_order?: number
          target_value?: number
        }
        Update: {
          created_at?: string
          description_en?: string
          description_es?: string
          goal_key?: string
          goal_type?: string
          icon?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_es?: string
          points_reward?: number
          sort_order?: number
          target_value?: number
        }
        Relationships: []
      }
      beta_invitation_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      beta_referral_codes: {
        Row: {
          code: string
          created_at: string
          current_referrals: number | null
          id: string
          is_active: boolean | null
          max_referrals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          current_referrals?: number | null
          id?: string
          is_active?: boolean | null
          max_referrals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          current_referrals?: number | null
          id?: string
          is_active?: boolean | null
          max_referrals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      beta_referrals: {
        Row: {
          created_at: string
          id: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code_id: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code_id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beta_referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "beta_referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_reward_redemptions: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          points_spent: number
          reward_type: string
          status: string
          subscription_end_date: string | null
          tier_at_redemption: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          points_spent?: number
          reward_type: string
          status?: string
          subscription_end_date?: string | null
          tier_at_redemption: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          points_spent?: number
          reward_type?: string
          status?: string
          subscription_end_date?: string | null
          tier_at_redemption?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      beta_tester_points: {
        Row: {
          best_streak: number
          bug_report_points: number
          created_at: string
          feature_usage_points: number
          feedback_points: number
          id: string
          last_activity_date: string | null
          referral_points: number
          reward_claimed: boolean
          reward_claimed_at: string | null
          streak_days: number
          tier: string
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          bug_report_points?: number
          created_at?: string
          feature_usage_points?: number
          feedback_points?: number
          id?: string
          last_activity_date?: string | null
          referral_points?: number
          reward_claimed?: boolean
          reward_claimed_at?: string | null
          streak_days?: number
          tier?: string
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          bug_report_points?: number
          created_at?: string
          feature_usage_points?: number
          feedback_points?: number
          id?: string
          last_activity_date?: string | null
          referral_points?: number
          reward_claimed?: boolean
          reward_claimed_at?: string | null
          streak_days?: number
          tier?: string
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bill_payments: {
        Row: {
          amount_paid: number
          bill_id: string
          confirmation_number: string | null
          created_at: string
          expense_id: string | null
          id: string
          notes: string | null
          paid_date: string
          payment_method: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          bill_id: string
          confirmation_number?: string | null
          created_at?: string
          expense_id?: string | null
          id?: string
          notes?: string | null
          paid_date?: string
          payment_method?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          bill_id?: string
          confirmation_number?: string | null
          created_at?: string
          expense_id?: string | null
          id?: string
          notes?: string | null
          paid_date?: string
          payment_method?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "recurring_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_alert_rules: {
        Row: {
          category: string | null
          condition_type: string
          created_at: string
          entity_id: string | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          notify_method: string
          threshold_amount: number
          threshold_percentage: number | null
          user_id: string
        }
        Insert: {
          category?: string | null
          condition_type?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          notify_method?: string
          threshold_amount?: number
          threshold_percentage?: number | null
          user_id: string
        }
        Update: {
          category?: string | null
          condition_type?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          notify_method?: string
          threshold_amount?: number
          threshold_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_alert_rules_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_rollovers: {
        Row: {
          category: string
          created_at: string
          entity_id: string | null
          id: string
          month: string
          rollover_amount: number
          source_month: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          entity_id?: string | null
          id?: string
          month: string
          rollover_amount?: number
          source_month: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          month?: string
          rollover_amount?: number
          source_month?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_rollovers_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      category_budgets: {
        Row: {
          alert_threshold: number
          category: string
          created_at: string | null
          entity_id: string | null
          id: string
          monthly_budget: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold?: number
          category: string
          created_at?: string | null
          entity_id?: string | null
          id?: string
          monthly_budget?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold?: number
          category?: string
          created_at?: string | null
          entity_id?: string | null
          id?: string
          monthly_budget?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_budgets_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          address_lat: number | null
          address_lng: number | null
          billing_profile: Json | null
          client_type: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          entity_id: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          payment_terms: number | null
          province: string | null
          tax_id: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          address_lat?: number | null
          address_lng?: number | null
          billing_profile?: Json | null
          client_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          entity_id?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          payment_terms?: number | null
          province?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          address_lat?: number | null
          address_lng?: number | null
          billing_profile?: Json | null
          client_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          entity_id?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          payment_terms?: number | null
          province?: string | null
          tax_id?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          ai_processed_at: string | null
          auto_renew: boolean | null
          billing_profile: Json | null
          client_id: string | null
          contract_type: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          end_date: string | null
          entity_id: string | null
          extracted_terms: Json | null
          file_name: string
          file_path: string
          file_type: string | null
          group_id: string | null
          id: string
          page_order: number | null
          reimbursement_terms: Json | null
          renewal_notice_days: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"] | null
          title: string | null
          updated_at: string | null
          user_id: string
          user_notes: string | null
          value: number | null
        }
        Insert: {
          ai_processed_at?: string | null
          auto_renew?: boolean | null
          billing_profile?: Json | null
          client_id?: string | null
          contract_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          entity_id?: string | null
          extracted_terms?: Json | null
          file_name: string
          file_path: string
          file_type?: string | null
          group_id?: string | null
          id?: string
          page_order?: number | null
          reimbursement_terms?: Json | null
          renewal_notice_days?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          user_notes?: string | null
          value?: number | null
        }
        Update: {
          ai_processed_at?: string | null
          auto_renew?: boolean | null
          billing_profile?: Json | null
          client_id?: string | null
          contract_type?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          entity_id?: string | null
          extracted_terms?: Json | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          group_id?: string | null
          id?: string
          page_order?: number | null
          reimbursement_terms?: Json | null
          renewal_notice_days?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          user_notes?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_border_transfers: {
        Row: {
          amount_from: number
          amount_to: number
          created_at: string | null
          currency_from: string
          currency_to: string
          exchange_rate: number
          from_entity_id: string | null
          id: string
          notes: string | null
          purpose: string | null
          to_entity_id: string | null
          transfer_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_from: number
          amount_to: number
          created_at?: string | null
          currency_from: string
          currency_to: string
          exchange_rate: number
          from_entity_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          to_entity_id?: string | null
          transfer_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_from?: number
          amount_to?: number
          created_at?: string | null
          currency_from?: string
          currency_to?: string
          exchange_rate?: number
          from_entity_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          to_entity_id?: string | null
          transfer_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_border_transfers_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_border_transfers_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_border_transfers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      decoded_codes: {
        Row: {
          category: string | null
          confidence_count: number | null
          created_at: string | null
          decoded_meaning: string
          id: string
          last_seen_at: string | null
          original_code: string
          updated_at: string | null
          user_id: string
          vendor_context: string | null
        }
        Insert: {
          category?: string | null
          confidence_count?: number | null
          created_at?: string | null
          decoded_meaning: string
          id?: string
          last_seen_at?: string | null
          original_code: string
          updated_at?: string | null
          user_id: string
          vendor_context?: string | null
        }
        Update: {
          category?: string | null
          confidence_count?: number | null
          created_at?: string | null
          decoded_meaning?: string
          id?: string
          last_seen_at?: string | null
          original_code?: string
          updated_at?: string | null
          user_id?: string
          vendor_context?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          expense_id: string | null
          extracted_data: Json | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          review_status: string | null
          reviewed_at: string | null
          status: Database["public"]["Enums"]["document_status"] | null
          thumbnail_path: string | null
          updated_at: string | null
          user_corrections: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expense_id?: string | null
          extracted_data?: Json | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          review_status?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          thumbnail_path?: string | null
          updated_at?: string | null
          user_corrections?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expense_id?: string | null
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          review_status?: string | null
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["document_status"] | null
          thumbnail_path?: string | null
          updated_at?: string | null
          user_corrections?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_leaderboard: {
        Row: {
          achievements_count: number
          display_name: string
          focus_minutes: number
          health_score: number
          id: string
          streak_days: number
          total_score: number
          updated_at: string
          user_id: string
          week_key: string
        }
        Insert: {
          achievements_count?: number
          display_name?: string
          focus_minutes?: number
          health_score?: number
          id?: string
          streak_days?: number
          total_score?: number
          updated_at?: string
          user_id: string
          week_key: string
        }
        Update: {
          achievements_count?: number
          display_name?: string
          focus_minutes?: number
          health_score?: number
          id?: string
          streak_days?: number
          total_score?: number
          updated_at?: string
          user_id?: string
          week_key?: string
        }
        Relationships: []
      }
      ecosystem_notifications: {
        Row: {
          action_tool: string | null
          action_url: string | null
          created_at: string
          emoji: string | null
          id: string
          is_read: boolean
          message_en: string
          message_es: string
          notification_type: string
          source_app: string
          title_en: string
          title_es: string
          user_id: string
        }
        Insert: {
          action_tool?: string | null
          action_url?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_read?: boolean
          message_en: string
          message_es: string
          notification_type: string
          source_app?: string
          title_en: string
          title_es: string
          user_id: string
        }
        Update: {
          action_tool?: string | null
          action_url?: string | null
          created_at?: string
          emoji?: string | null
          id?: string
          is_read?: boolean
          message_en?: string
          message_es?: string
          notification_type?: string
          source_app?: string
          title_en?: string
          title_es?: string
          user_id?: string
        }
        Relationships: []
      }
      ecosystem_streaks: {
        Row: {
          best_streak: number
          combined_days_this_week: number
          current_streak: number
          finance_days_this_week: number
          focus_days_this_week: number
          id: string
          last_activity_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          combined_days_this_week?: number
          current_streak?: number
          finance_days_this_week?: number
          focus_days_this_week?: number
          id?: string
          last_activity_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          combined_days_this_week?: number
          current_streak?: number
          finance_days_this_week?: number
          focus_days_this_week?: number
          id?: string
          last_activity_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      education_daily_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          minutes_consumed: number | null
          notes: string | null
          pages_read: number | null
          resource_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          log_date?: string
          minutes_consumed?: number | null
          notes?: string | null
          pages_read?: number | null
          resource_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          minutes_consumed?: number | null
          notes?: string | null
          pages_read?: number | null
          resource_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_daily_logs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "financial_education"
            referencedColumns: ["id"]
          },
        ]
      }
      education_practice_logs: {
        Row: {
          created_at: string
          id: string
          impact_rating: number | null
          outcome: string | null
          practice_date: string
          practice_description: string
          practice_type: string | null
          resource_id: string | null
          suggested_resource_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          impact_rating?: number | null
          outcome?: string | null
          practice_date?: string
          practice_description: string
          practice_type?: string | null
          resource_id?: string | null
          suggested_resource_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          impact_rating?: number | null
          outcome?: string | null
          practice_date?: string
          practice_description?: string
          practice_type?: string | null
          resource_id?: string | null
          suggested_resource_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "education_practice_logs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "financial_education"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_results: {
        Row: {
          clicked: boolean | null
          converted: boolean | null
          id: string
          lead_id: string
          opened: boolean | null
          sent_at: string | null
          test_id: string
          variant: string
        }
        Insert: {
          clicked?: boolean | null
          converted?: boolean | null
          id?: string
          lead_id: string
          opened?: boolean | null
          sent_at?: string | null
          test_id: string
          variant: string
        }
        Update: {
          clicked?: boolean | null
          converted?: boolean | null
          id?: string
          lead_id?: string
          opened?: boolean | null
          sent_at?: string | null
          test_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "email_ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_tests: {
        Row: {
          created_at: string | null
          id: string
          name: string
          split_ratio: number
          started_at: string | null
          status: string
          template_a: string
          template_b: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          split_ratio?: number
          started_at?: string | null
          status?: string
          template_a: string
          template_b: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          split_ratio?: number
          started_at?: string | null
          status?: string
          template_a?: string
          template_b?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string | null
          from_currency: string
          id: string
          rate: number
          rate_date: string
          source: string | null
          to_currency: string
        }
        Insert: {
          created_at?: string | null
          from_currency: string
          id?: string
          rate: number
          rate_date: string
          source?: string | null
          to_currency: string
        }
        Update: {
          created_at?: string | null
          from_currency?: string
          id?: string
          rate?: number
          rate_date?: string
          source?: string | null
          to_currency?: string
        }
        Relationships: []
      }
      expense_tags: {
        Row: {
          created_at: string | null
          expense_id: string
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          expense_id: string
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          expense_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_tags_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          currency: string | null
          date: string
          deleted_at: string | null
          description: string | null
          document_id: string | null
          entity_id: string | null
          exchange_rate_used: number | null
          id: string
          notes: string | null
          original_currency: string | null
          project_id: string | null
          reimbursement_type: string | null
          status: Database["public"]["Enums"]["expense_status"] | null
          updated_at: string | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          currency?: string | null
          date: string
          deleted_at?: string | null
          description?: string | null
          document_id?: string | null
          entity_id?: string | null
          exchange_rate_used?: number | null
          id?: string
          notes?: string | null
          original_currency?: string | null
          project_id?: string | null
          reimbursement_type?: string | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          updated_at?: string | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          deleted_at?: string | null
          description?: string | null
          document_id?: string | null
          entity_id?: string | null
          exchange_rate_used?: number | null
          id?: string
          notes?: string | null
          original_currency?: string | null
          project_id?: string | null
          reimbursement_type?: string | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          updated_at?: string | null
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      export_logs: {
        Row: {
          created_at: string | null
          export_type: string
          file_name: string
          file_path: string | null
          filters: Json | null
          id: string
          record_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          export_type: string
          file_name: string
          file_path?: string | null
          filters?: Json | null
          id?: string
          record_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          export_type?: string
          file_name?: string
          file_path?: string | null
          filters?: Json | null
          id?: string
          record_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          category: string
          description: string | null
          enabled: boolean
          flag_key: string
          id: string
          label: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          description?: string | null
          enabled?: boolean
          flag_key: string
          id?: string
          label?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          description?: string | null
          enabled?: boolean
          flag_key?: string
          id?: string
          label?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      feature_usage_logs: {
        Row: {
          action_type: string
          created_at: string
          feature_name: string
          id: string
          metadata: Json | null
          page_path: string
          session_id: string | null
          user_id: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          feature_name: string
          id?: string
          metadata?: Json | null
          page_path: string
          session_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          feature_name?: string
          id?: string
          metadata?: Json | null
          page_path?: string
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_education: {
        Row: {
          author: string | null
          category: string | null
          completed_date: string | null
          created_at: string
          daily_goal_minutes: number | null
          daily_goal_pages: number | null
          id: string
          impact_rating: number | null
          key_lessons: string | null
          minutes_consumed: number | null
          notes: string | null
          pages_read: number | null
          progress_percentage: number | null
          resource_type: string
          started_date: string | null
          status: string | null
          suggested_resource_id: string | null
          title: string
          total_minutes: number | null
          total_pages: number | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          completed_date?: string | null
          created_at?: string
          daily_goal_minutes?: number | null
          daily_goal_pages?: number | null
          id?: string
          impact_rating?: number | null
          key_lessons?: string | null
          minutes_consumed?: number | null
          notes?: string | null
          pages_read?: number | null
          progress_percentage?: number | null
          resource_type?: string
          started_date?: string | null
          status?: string | null
          suggested_resource_id?: string | null
          title: string
          total_minutes?: number | null
          total_pages?: number | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          category?: string | null
          completed_date?: string | null
          created_at?: string
          daily_goal_minutes?: number | null
          daily_goal_pages?: number | null
          id?: string
          impact_rating?: number | null
          key_lessons?: string | null
          minutes_consumed?: number | null
          notes?: string | null
          pages_read?: number | null
          progress_percentage?: number | null
          resource_type?: string
          started_date?: string | null
          status?: string | null
          suggested_resource_id?: string | null
          title?: string
          total_minutes?: number | null
          total_pages?: number | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_focus_sessions: {
        Row: {
          completed: boolean
          created_at: string
          duration_minutes: number
          id: string
          session_type: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration_minutes: number
          id?: string
          session_type: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration_minutes?: number
          id?: string
          session_type?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      financial_habit_logs: {
        Row: {
          completed_at: string
          habit_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          habit_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          habit_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "financial_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_habits: {
        Row: {
          best_streak: number | null
          created_at: string
          current_streak: number | null
          frequency: string
          habit_description: string | null
          habit_name: string
          id: string
          is_active: boolean | null
          last_completed_at: string | null
          target_per_period: number | null
          updated_at: string
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          best_streak?: number | null
          created_at?: string
          current_streak?: number | null
          frequency?: string
          habit_description?: string | null
          habit_name: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          target_per_period?: number | null
          updated_at?: string
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          best_streak?: number | null
          created_at?: string
          current_streak?: number | null
          frequency?: string
          habit_description?: string | null
          habit_name?: string
          id?: string
          is_active?: boolean | null
          last_completed_at?: string | null
          target_per_period?: number | null
          updated_at?: string
          user_id?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      financial_journal: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          entry_type: string
          id: string
          lessons_learned: string | null
          mood: string | null
          related_expense_id: string | null
          related_income_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entry_date?: string
          entry_type?: string
          id?: string
          lessons_learned?: string | null
          mood?: string | null
          related_expense_id?: string | null
          related_income_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          entry_type?: string
          id?: string
          lessons_learned?: string | null
          mood?: string | null
          related_expense_id?: string | null
          related_income_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_journal_related_expense_id_fkey"
            columns: ["related_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_journal_related_income_id_fkey"
            columns: ["related_income_id"]
            isOneToOne: false
            referencedRelation: "income"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_worry_entries: {
        Row: {
          content: string
          converted_to_journal: boolean
          created_at: string
          id: string
          released: boolean
          user_id: string
          worry_category: string
        }
        Insert: {
          content: string
          converted_to_journal?: boolean
          created_at?: string
          id?: string
          released?: boolean
          user_id: string
          worry_category?: string
        }
        Update: {
          content?: string
          converted_to_journal?: boolean
          created_at?: string
          id?: string
          released?: boolean
          user_id?: string
          worry_category?: string
        }
        Relationships: []
      }
      fiscal_entities: {
        Row: {
          color: string | null
          country: string
          created_at: string | null
          default_currency: string | null
          entity_type: string
          fiscal_year_end: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          name: string
          notes: string | null
          province: string | null
          tax_id: string | null
          tax_id_type: string | null
          tax_regime: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          country: string
          created_at?: string | null
          default_currency?: string | null
          entity_type?: string
          fiscal_year_end?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name: string
          notes?: string | null
          province?: string | null
          tax_id?: string | null
          tax_id_type?: string | null
          tax_regime?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          country?: string
          created_at?: string | null
          default_currency?: string | null
          entity_type?: string
          fiscal_year_end?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          province?: string | null
          tax_id?: string | null
          tax_id_type?: string | null
          tax_regime?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_entities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string | null
          currency: string | null
          date: string
          deleted_at: string | null
          description: string | null
          document_id: string | null
          entity_id: string | null
          exchange_rate_used: number | null
          id: string
          income_type: Database["public"]["Enums"]["income_type"]
          is_taxable: boolean | null
          notes: string | null
          original_currency: string | null
          project_id: string | null
          recurrence: Database["public"]["Enums"]["recurrence_type"] | null
          recurrence_end_date: string | null
          source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          date: string
          deleted_at?: string | null
          description?: string | null
          document_id?: string | null
          entity_id?: string | null
          exchange_rate_used?: number | null
          id?: string
          income_type: Database["public"]["Enums"]["income_type"]
          is_taxable?: boolean | null
          notes?: string | null
          original_currency?: string | null
          project_id?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          recurrence_end_date?: string | null
          source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          deleted_at?: string | null
          description?: string | null
          document_id?: string | null
          entity_id?: string | null
          exchange_rate_used?: number | null
          id?: string
          income_type?: Database["public"]["Enums"]["income_type"]
          is_taxable?: boolean | null
          notes?: string | null
          original_currency?: string | null
          project_id?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          recurrence_end_date?: string | null
          source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_goals: {
        Row: {
          asset_class: string | null
          color: string | null
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          goal_type: string
          id: string
          is_achievable: boolean | null
          is_measurable: boolean | null
          is_relevant: boolean | null
          is_specific: boolean | null
          monthly_target: number | null
          name: string
          notes: string | null
          relevance_reason: string | null
          risk_level: string | null
          status: string | null
          target_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          asset_class?: string | null
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          goal_type?: string
          id?: string
          is_achievable?: boolean | null
          is_measurable?: boolean | null
          is_relevant?: boolean | null
          is_specific?: boolean | null
          monthly_target?: number | null
          name: string
          notes?: string | null
          relevance_reason?: string | null
          risk_level?: string | null
          status?: string | null
          target_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          asset_class?: string | null
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          goal_type?: string
          id?: string
          is_achievable?: boolean | null
          is_measurable?: boolean | null
          is_relevant?: boolean | null
          is_specific?: boolean | null
          monthly_target?: number | null
          name?: string
          notes?: string | null
          relevance_reason?: string | null
          risk_level?: string | null
          status?: string | null
          target_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_follow_ups: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
          notes: string | null
          scheduled_at: string
          task_type: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          scheduled_at: string
          task_type: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          scheduled_at?: string
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_follow_ups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "quiz_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_interactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          direction: string | null
          id: string
          interaction_type: string
          lead_id: string
          notes: string | null
          outcome: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          direction?: string | null
          id?: string
          interaction_type: string
          lead_id: string
          notes?: string | null
          outcome?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          direction?: string | null
          id?: string
          interaction_type?: string
          lead_id?: string
          notes?: string | null
          outcome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "quiz_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_message_templates: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_auto: boolean | null
          language: string
          message_type: string
          name: string
          tags: string[] | null
          target_app: string
          template_type: string
          updated_at: string
          use_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_auto?: boolean | null
          language?: string
          message_type?: string
          name: string
          tags?: string[] | null
          target_app?: string
          template_type?: string
          updated_at?: string
          use_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_auto?: boolean | null
          language?: string
          message_type?: string
          name?: string
          tags?: string[] | null
          target_app?: string
          template_type?: string
          updated_at?: string
          use_count?: number | null
        }
        Relationships: []
      }
      lead_nurturing_log: {
        Row: {
          created_at: string | null
          executed_at: string | null
          id: string
          lead_id: string
          message_generated: string | null
          scheduled_for: string
          sequence_id: string | null
          status: string | null
          step_index: number
        }
        Insert: {
          created_at?: string | null
          executed_at?: string | null
          id?: string
          lead_id: string
          message_generated?: string | null
          scheduled_for: string
          sequence_id?: string | null
          status?: string | null
          step_index: number
        }
        Update: {
          created_at?: string | null
          executed_at?: string | null
          id?: string
          lead_id?: string
          message_generated?: string | null
          scheduled_for?: string
          sequence_id?: string | null
          status?: string | null
          step_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_nurturing_log_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "lead_nurturing_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_nurturing_sequences: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          name: string
          steps: Json
          trigger_priority: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          steps?: Json
          trigger_priority?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          steps?: Json
          trigger_priority?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          category: string
          created_at: string | null
          currency: string | null
          current_balance: number
          debt_type: string | null
          due_date: string | null
          entity_id: string | null
          generates_income: boolean | null
          id: string
          interest_rate: number | null
          minimum_payment: number | null
          monthly_income_generated: number | null
          name: string
          notes: string | null
          original_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          currency?: string | null
          current_balance?: number
          debt_type?: string | null
          due_date?: string | null
          entity_id?: string | null
          generates_income?: boolean | null
          id?: string
          interest_rate?: number | null
          minimum_payment?: number | null
          monthly_income_generated?: number | null
          name: string
          notes?: string | null
          original_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          currency?: string | null
          current_balance?: number
          debt_type?: string | null
          due_date?: string | null
          entity_id?: string | null
          generates_income?: boolean | null
          id?: string
          interest_rate?: number | null
          minimum_payment?: number | null
          monthly_income_generated?: number | null
          name?: string
          notes?: string | null
          original_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liabilities_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      managed_apps: {
        Row: {
          app_type: string
          color: string
          created_at: string
          created_by: string | null
          description: string
          icon: string
          id: string
          is_active: boolean
          lead_count: number
          name: string
          source_key: string
          status: string
          updated_at: string
          url: string
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          app_type?: string
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          lead_count?: number
          name: string
          source_key: string
          status?: string
          updated_at?: string
          url?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          app_type?: string
          color?: string
          created_at?: string
          created_by?: string | null
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          lead_count?: number
          name?: string
          source_key?: string
          status?: string
          updated_at?: string
          url?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      mileage: {
        Row: {
          client_id: string | null
          created_at: string | null
          date: string
          deleted_at: string | null
          end_address: string | null
          end_lat: number | null
          end_lng: number | null
          entity_id: string | null
          id: string
          kilometers: number
          purpose: string | null
          recurrence: string | null
          recurrence_days: number[] | null
          recurrence_end_date: string | null
          route: string
          route_snapshot_url: string | null
          start_address: string | null
          start_lat: number | null
          start_lng: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date: string
          deleted_at?: string | null
          end_address?: string | null
          end_lat?: number | null
          end_lng?: number | null
          entity_id?: string | null
          id?: string
          kilometers: number
          purpose?: string | null
          recurrence?: string | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          route: string
          route_snapshot_url?: string | null
          start_address?: string | null
          start_lat?: number | null
          start_lng?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date?: string
          deleted_at?: string | null
          end_address?: string | null
          end_lat?: number | null
          end_lng?: number | null
          entity_id?: string | null
          id?: string
          kilometers?: number
          purpose?: string | null
          recurrence?: string | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          route?: string
          route_snapshot_url?: string | null
          start_address?: string | null
          start_lat?: number | null
          start_lng?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_control_history: {
        Row: {
          categories_data: Json | null
          created_at: string
          features_ready: number
          features_total: number
          global_score: number
          id: string
          system_fuel_score: number
          user_id: string
          week_key: string
        }
        Insert: {
          categories_data?: Json | null
          created_at?: string
          features_ready?: number
          features_total?: number
          global_score?: number
          id?: string
          system_fuel_score?: number
          user_id: string
          week_key: string
        }
        Update: {
          categories_data?: Json | null
          created_at?: string
          features_ready?: number
          features_total?: number
          global_score?: number
          id?: string
          system_fuel_score?: number
          user_id?: string
          week_key?: string
        }
        Relationships: []
      }
      net_worth_snapshots: {
        Row: {
          created_at: string | null
          id: string
          net_worth: number
          snapshot_date: string
          total_assets: number
          total_liabilities: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          net_worth?: number
          snapshot_date: string
          total_assets?: number
          total_liabilities?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          net_worth?: number
          snapshot_date?: string
          total_assets?: number
          total_liabilities?: number
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          advance_days: number
          created_at: string
          enabled: boolean
          id: string
          max_reminders: number
          notification_type: string
          preferred_hour: number | null
          repeat_frequency: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advance_days?: number
          created_at?: string
          enabled?: boolean
          id?: string
          max_reminders?: number
          notification_type: string
          preferred_hour?: number | null
          repeat_frequency?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advance_days?: number
          created_at?: string
          enabled?: boolean
          id?: string
          max_reminders?: number
          notification_type?: string
          preferred_hour?: number | null
          repeat_frequency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          message: string
          muted: boolean | null
          read: boolean | null
          snoozed_until: string | null
          source_id: string | null
          source_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          message: string
          muted?: boolean | null
          read?: boolean | null
          snoozed_until?: string | null
          source_id?: string | null
          source_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          message?: string
          muted?: boolean | null
          read?: boolean | null
          snoozed_until?: string | null
          source_id?: string | null
          source_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      outgoing_webhook_logs: {
        Row: {
          created_at: string | null
          event: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          event: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          event?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outgoing_webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "outgoing_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      outgoing_webhooks: {
        Row: {
          created_at: string | null
          events: string[]
          id: string
          is_active: boolean | null
          name: string
          secret_key: string
          url: string
        }
        Insert: {
          created_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          name: string
          secret_key?: string
          url: string
        }
        Update: {
          created_at?: string | null
          events?: string[]
          id?: string
          is_active?: boolean | null
          name?: string
          secret_key?: string
          url?: string
        }
        Relationships: []
      }
      pay_yourself_first_settings: {
        Row: {
          best_streak_months: number | null
          created_at: string
          current_month_income: number | null
          current_month_saved: number | null
          id: string
          last_payment_date: string | null
          streak_months: number | null
          target_percentage: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak_months?: number | null
          created_at?: string
          current_month_income?: number | null
          current_month_saved?: number | null
          id?: string
          last_payment_date?: string | null
          streak_months?: number | null
          target_percentage?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak_months?: number | null
          created_at?: string
          current_month_income?: number | null
          current_month_saved?: number | null
          id?: string
          last_payment_date?: string | null
          streak_months?: number | null
          target_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_configurations: {
        Row: {
          bank_analyses_per_month: number
          clients_limit: number
          contract_analyses_per_month: number
          created_at: string
          description: string | null
          display_name: string | null
          expenses_per_month: number
          export_excel_enabled: boolean
          fire_calculator_enabled: boolean
          gamification_enabled: boolean
          id: string
          incomes_per_month: number
          is_active: boolean
          mentorship_components: number
          mileage_enabled: boolean
          net_worth_enabled: boolean
          ocr_scans_per_month: number
          plan_type: string
          projects_limit: number
          rrsp_tfsa_optimizer_enabled: boolean
          sort_order: number
          t2125_export_enabled: boolean
          tags_unlimited: boolean
          tax_calendar_enabled: boolean
          tax_optimizer_enabled: boolean
          updated_at: string
          voice_assistant_enabled: boolean
          voice_minutes_per_month: number
          voice_requests_per_month: number
        }
        Insert: {
          bank_analyses_per_month?: number
          clients_limit?: number
          contract_analyses_per_month?: number
          created_at?: string
          description?: string | null
          display_name?: string | null
          expenses_per_month?: number
          export_excel_enabled?: boolean
          fire_calculator_enabled?: boolean
          gamification_enabled?: boolean
          id?: string
          incomes_per_month?: number
          is_active?: boolean
          mentorship_components?: number
          mileage_enabled?: boolean
          net_worth_enabled?: boolean
          ocr_scans_per_month?: number
          plan_type: string
          projects_limit?: number
          rrsp_tfsa_optimizer_enabled?: boolean
          sort_order?: number
          t2125_export_enabled?: boolean
          tags_unlimited?: boolean
          tax_calendar_enabled?: boolean
          tax_optimizer_enabled?: boolean
          updated_at?: string
          voice_assistant_enabled?: boolean
          voice_minutes_per_month?: number
          voice_requests_per_month?: number
        }
        Update: {
          bank_analyses_per_month?: number
          clients_limit?: number
          contract_analyses_per_month?: number
          created_at?: string
          description?: string | null
          display_name?: string | null
          expenses_per_month?: number
          export_excel_enabled?: boolean
          fire_calculator_enabled?: boolean
          gamification_enabled?: boolean
          id?: string
          incomes_per_month?: number
          is_active?: boolean
          mentorship_components?: number
          mileage_enabled?: boolean
          net_worth_enabled?: boolean
          ocr_scans_per_month?: number
          plan_type?: string
          projects_limit?: number
          rrsp_tfsa_optimizer_enabled?: boolean
          sort_order?: number
          t2125_export_enabled?: boolean
          tags_unlimited?: boolean
          tax_calendar_enabled?: boolean
          tax_optimizer_enabled?: boolean
          updated_at?: string
          voice_assistant_enabled?: boolean
          voice_minutes_per_month?: number
          voice_requests_per_month?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_mood: string | null
          beta_expires_at: string | null
          beta_extended_by: string | null
          beta_extension_reason: string | null
          beta_plan_level: string | null
          birth_date: string | null
          business_name: string | null
          business_number: string | null
          business_start_date: string | null
          country: string | null
          created_at: string | null
          display_currency: string | null
          display_preferences: Json | null
          email: string | null
          fiscal_year_end: string | null
          full_name: string | null
          gst_hst_registered: boolean | null
          id: string
          is_beta_tester: boolean | null
          language: string | null
          multi_country_enabled: boolean | null
          nickname: string | null
          onboarding_completed: boolean | null
          profile_completion_percentage: number | null
          province: string | null
          rut: string | null
          tax_regime: string | null
          updated_at: string | null
          work_types: Database["public"]["Enums"]["work_type"][] | null
        }
        Insert: {
          avatar_mood?: string | null
          beta_expires_at?: string | null
          beta_extended_by?: string | null
          beta_extension_reason?: string | null
          beta_plan_level?: string | null
          birth_date?: string | null
          business_name?: string | null
          business_number?: string | null
          business_start_date?: string | null
          country?: string | null
          created_at?: string | null
          display_currency?: string | null
          display_preferences?: Json | null
          email?: string | null
          fiscal_year_end?: string | null
          full_name?: string | null
          gst_hst_registered?: boolean | null
          id: string
          is_beta_tester?: boolean | null
          language?: string | null
          multi_country_enabled?: boolean | null
          nickname?: string | null
          onboarding_completed?: boolean | null
          profile_completion_percentage?: number | null
          province?: string | null
          rut?: string | null
          tax_regime?: string | null
          updated_at?: string | null
          work_types?: Database["public"]["Enums"]["work_type"][] | null
        }
        Update: {
          avatar_mood?: string | null
          beta_expires_at?: string | null
          beta_extended_by?: string | null
          beta_extension_reason?: string | null
          beta_plan_level?: string | null
          birth_date?: string | null
          business_name?: string | null
          business_number?: string | null
          business_start_date?: string | null
          country?: string | null
          created_at?: string | null
          display_currency?: string | null
          display_preferences?: Json | null
          email?: string | null
          fiscal_year_end?: string | null
          full_name?: string | null
          gst_hst_registered?: boolean | null
          id?: string
          is_beta_tester?: boolean | null
          language?: string | null
          multi_country_enabled?: boolean | null
          nickname?: string | null
          onboarding_completed?: boolean | null
          profile_completion_percentage?: number | null
          province?: string | null
          rut?: string | null
          tax_regime?: string | null
          updated_at?: string | null
          work_types?: Database["public"]["Enums"]["work_type"][] | null
        }
        Relationships: []
      }
      project_clients: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          project_id: string
          role: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          project_id: string
          role?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_clients_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          client_id: string | null
          color: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          end_date: string | null
          entity_id: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          entity_id?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          client_id?: string | null
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          entity_id?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_leads: {
        Row: {
          comments: string | null
          contact_notes: string | null
          contacted_at: string | null
          converted_at: string | null
          converted_to_user: boolean | null
          country: string | null
          created_at: string
          email: string
          failed_questions: number[] | null
          ghl_synced: boolean | null
          goal: string | null
          id: string
          lead_score: number | null
          metadata: Json | null
          name: string
          obstacle: string | null
          phone: string | null
          pipeline_stage: string | null
          priority: string | null
          quiz_level: string | null
          quiz_score: number | null
          situation: string | null
          source: string
          tags: string[] | null
          time_spent: string | null
          updated_at: string
        }
        Insert: {
          comments?: string | null
          contact_notes?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          converted_to_user?: boolean | null
          country?: string | null
          created_at?: string
          email: string
          failed_questions?: number[] | null
          ghl_synced?: boolean | null
          goal?: string | null
          id?: string
          lead_score?: number | null
          metadata?: Json | null
          name: string
          obstacle?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          priority?: string | null
          quiz_level?: string | null
          quiz_score?: number | null
          situation?: string | null
          source?: string
          tags?: string[] | null
          time_spent?: string | null
          updated_at?: string
        }
        Update: {
          comments?: string | null
          contact_notes?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          converted_to_user?: boolean | null
          country?: string | null
          created_at?: string
          email?: string
          failed_questions?: number[] | null
          ghl_synced?: boolean | null
          goal?: string | null
          id?: string
          lead_score?: number | null
          metadata?: Json | null
          name?: string
          obstacle?: string | null
          phone?: string | null
          pipeline_stage?: string | null
          priority?: string | null
          quiz_level?: string | null
          quiz_score?: number | null
          situation?: string | null
          source?: string
          tags?: string[] | null
          time_spent?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recurring_bills: {
        Row: {
          amount: number
          auto_pay: boolean | null
          bank_account: string | null
          bank_name: string | null
          beneficiary: string | null
          category: string
          color: string | null
          created_at: string
          currency: string | null
          description: string | null
          due_day: number | null
          end_date: string | null
          entity_id: string | null
          frequency: string
          frequency_months: number | null
          icon: string | null
          id: string
          last_paid_date: string | null
          name: string
          next_due_date: string
          notes: string | null
          payee_account: string | null
          payee_name: string | null
          payment_details: string | null
          payment_method_type: string
          priority: string | null
          reminder_days_before: number | null
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          auto_pay?: boolean | null
          bank_account?: string | null
          bank_name?: string | null
          beneficiary?: string | null
          category?: string
          color?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_day?: number | null
          end_date?: string | null
          entity_id?: string | null
          frequency?: string
          frequency_months?: number | null
          icon?: string | null
          id?: string
          last_paid_date?: string | null
          name: string
          next_due_date: string
          notes?: string | null
          payee_account?: string | null
          payee_name?: string | null
          payment_details?: string | null
          payment_method_type?: string
          priority?: string | null
          reminder_days_before?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_pay?: boolean | null
          bank_account?: string | null
          bank_name?: string | null
          beneficiary?: string | null
          category?: string
          color?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          due_day?: number | null
          end_date?: string | null
          entity_id?: string | null
          frequency?: string
          frequency_months?: number | null
          icon?: string | null
          id?: string
          last_paid_date?: string | null
          name?: string
          next_due_date?: string
          notes?: string | null
          payee_account?: string | null
          payee_name?: string | null
          payment_details?: string | null
          payment_method_type?: string
          priority?: string | null
          reminder_days_before?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_bills_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "fiscal_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_leads: {
        Row: {
          converted_at: string | null
          converted_user_id: string | null
          created_at: string
          email: string
          id: string
          marketing_consent: boolean
          name: string | null
          referral_code: string
          referrer_id: string | null
          reminder_count: number | null
          reminder_sent_at: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          converted_at?: string | null
          converted_user_id?: string | null
          created_at?: string
          email: string
          id?: string
          marketing_consent?: boolean
          name?: string | null
          referral_code: string
          referrer_id?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          converted_at?: string | null
          converted_user_id?: string | null
          created_at?: string
          email?: string
          id?: string
          marketing_consent?: boolean
          name?: string | null
          referral_code?: string
          referrer_id?: string | null
          reminder_count?: number | null
          reminder_sent_at?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      savings_contributions: {
        Row: {
          amount: number
          contribution_date: string
          created_at: string
          goal_id: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contribution_date?: string
          created_at?: string
          goal_id: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contribution_date?: string
          created_at?: string
          goal_id?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          color: string | null
          created_at: string | null
          current_amount: number | null
          deadline: string | null
          id: string
          is_achievable: boolean | null
          is_measurable: boolean | null
          is_relevant: boolean | null
          is_specific: boolean | null
          name: string
          priority: number | null
          relevance_reason: string | null
          status: string | null
          target_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          is_achievable?: boolean | null
          is_measurable?: boolean | null
          is_relevant?: boolean | null
          is_specific?: boolean | null
          name: string
          priority?: number | null
          relevance_reason?: string | null
          status?: string | null
          target_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          deadline?: string | null
          id?: string
          is_achievable?: boolean | null
          is_measurable?: boolean | null
          is_relevant?: boolean | null
          is_specific?: boolean | null
          name?: string
          priority?: number | null
          relevance_reason?: string | null
          status?: string | null
          target_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scan_sessions: {
        Row: {
          created_at: string
          device_type: string | null
          ended_at: string | null
          id: string
          notes: string | null
          receipts_approved: number | null
          receipts_captured: number | null
          receipts_rejected: number | null
          started_at: string
          total_amount: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          receipts_approved?: number | null
          receipts_captured?: number | null
          receipts_rejected?: number | null
          started_at?: string
          total_amount?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          receipts_approved?: number | null
          receipts_captured?: number | null
          receipts_rejected?: number | null
          started_at?: string
          total_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          preferences: Json | null
          reminders: Json | null
          tax_rules: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preferences?: Json | null
          reminders?: Json | null
          tax_rules?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preferences?: Json | null
          reminders?: Json | null
          tax_rules?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_status_alerts: {
        Row: {
          affected_features: string[] | null
          alert_type: string
          created_at: string
          created_by: string | null
          estimated_resolution: string | null
          estimated_resolution_en: string | null
          id: string
          is_active: boolean | null
          message: string
          message_en: string | null
          resolved_at: string | null
          severity: string
          title: string
          title_en: string | null
        }
        Insert: {
          affected_features?: string[] | null
          alert_type: string
          created_at?: string
          created_by?: string | null
          estimated_resolution?: string | null
          estimated_resolution_en?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          message_en?: string | null
          resolved_at?: string | null
          severity: string
          title: string
          title_en?: string | null
        }
        Update: {
          affected_features?: string[] | null
          alert_type?: string
          created_at?: string
          created_by?: string | null
          estimated_resolution?: string | null
          estimated_resolution_en?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          message_en?: string | null
          resolved_at?: string | null
          severity?: string
          title?: string
          title_en?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_knowledge_assessment: {
        Row: {
          accountant_info: string | null
          additional_notes: string | null
          business_legal_name: string | null
          business_registration_date: string | null
          business_start_date_notes: string | null
          business_structure_knowledge: number | null
          business_tax_id: string | null
          completed_at: string | null
          country: string
          created_at: string
          deductions_knowledge: number | null
          employee_end_date: string | null
          employment_transition_notes: string | null
          filing_deadlines_knowledge: number | null
          first_business_revenue_date: string | null
          general_tax_knowledge: number | null
          gst_filing_frequency: string | null
          gst_registration_date: string | null
          has_accountant: boolean | null
          has_employees: boolean | null
          has_filed_before: boolean | null
          has_international_income: boolean | null
          has_separate_bank_account: boolean | null
          has_tax_debts: boolean | null
          home_office_details: string | null
          id: string
          international_income_details: string | null
          iva_filing_frequency: string | null
          iva_registration_date: string | null
          knowledge_gaps: Json | null
          knows_fiscal_year_end: boolean | null
          knows_gst_hst_status: boolean | null
          knows_personal_tax_deadline: boolean | null
          knows_tax_regime: boolean | null
          pays_tax_installments: boolean | null
          previous_filings_notes: string | null
          record_keeping_method: string | null
          revenue_pattern: string | null
          revenue_range: string | null
          switched_from_employee: boolean | null
          tax_debts_details: string | null
          tax_software_used: string | null
          updated_at: string
          user_id: string
          uses_home_office: boolean | null
          uses_vehicle_for_business: boolean | null
        }
        Insert: {
          accountant_info?: string | null
          additional_notes?: string | null
          business_legal_name?: string | null
          business_registration_date?: string | null
          business_start_date_notes?: string | null
          business_structure_knowledge?: number | null
          business_tax_id?: string | null
          completed_at?: string | null
          country?: string
          created_at?: string
          deductions_knowledge?: number | null
          employee_end_date?: string | null
          employment_transition_notes?: string | null
          filing_deadlines_knowledge?: number | null
          first_business_revenue_date?: string | null
          general_tax_knowledge?: number | null
          gst_filing_frequency?: string | null
          gst_registration_date?: string | null
          has_accountant?: boolean | null
          has_employees?: boolean | null
          has_filed_before?: boolean | null
          has_international_income?: boolean | null
          has_separate_bank_account?: boolean | null
          has_tax_debts?: boolean | null
          home_office_details?: string | null
          id?: string
          international_income_details?: string | null
          iva_filing_frequency?: string | null
          iva_registration_date?: string | null
          knowledge_gaps?: Json | null
          knows_fiscal_year_end?: boolean | null
          knows_gst_hst_status?: boolean | null
          knows_personal_tax_deadline?: boolean | null
          knows_tax_regime?: boolean | null
          pays_tax_installments?: boolean | null
          previous_filings_notes?: string | null
          record_keeping_method?: string | null
          revenue_pattern?: string | null
          revenue_range?: string | null
          switched_from_employee?: boolean | null
          tax_debts_details?: string | null
          tax_software_used?: string | null
          updated_at?: string
          user_id: string
          uses_home_office?: boolean | null
          uses_vehicle_for_business?: boolean | null
        }
        Update: {
          accountant_info?: string | null
          additional_notes?: string | null
          business_legal_name?: string | null
          business_registration_date?: string | null
          business_start_date_notes?: string | null
          business_structure_knowledge?: number | null
          business_tax_id?: string | null
          completed_at?: string | null
          country?: string
          created_at?: string
          deductions_knowledge?: number | null
          employee_end_date?: string | null
          employment_transition_notes?: string | null
          filing_deadlines_knowledge?: number | null
          first_business_revenue_date?: string | null
          general_tax_knowledge?: number | null
          gst_filing_frequency?: string | null
          gst_registration_date?: string | null
          has_accountant?: boolean | null
          has_employees?: boolean | null
          has_filed_before?: boolean | null
          has_international_income?: boolean | null
          has_separate_bank_account?: boolean | null
          has_tax_debts?: boolean | null
          home_office_details?: string | null
          id?: string
          international_income_details?: string | null
          iva_filing_frequency?: string | null
          iva_registration_date?: string | null
          knowledge_gaps?: Json | null
          knows_fiscal_year_end?: boolean | null
          knows_gst_hst_status?: boolean | null
          knows_personal_tax_deadline?: boolean | null
          knows_tax_regime?: boolean | null
          pays_tax_installments?: boolean | null
          previous_filings_notes?: string | null
          record_keeping_method?: string | null
          revenue_pattern?: string | null
          revenue_range?: string | null
          switched_from_employee?: boolean | null
          tax_debts_details?: string | null
          tax_software_used?: string | null
          updated_at?: string
          user_id?: string
          uses_home_office?: boolean | null
          uses_vehicle_for_business?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_knowledge_assessment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_tracking: {
        Row: {
          bank_analyses_count: number
          contract_analyses_count: number
          created_at: string
          expenses_count: number
          id: string
          incomes_count: number
          ocr_scans_count: number
          period_start: string
          updated_at: string
          user_id: string
          voice_minutes_used: number | null
          voice_requests_count: number
        }
        Insert: {
          bank_analyses_count?: number
          contract_analyses_count?: number
          created_at?: string
          expenses_count?: number
          id?: string
          incomes_count?: number
          ocr_scans_count?: number
          period_start?: string
          updated_at?: string
          user_id: string
          voice_minutes_used?: number | null
          voice_requests_count?: number
        }
        Update: {
          bank_analyses_count?: number
          contract_analyses_count?: number
          created_at?: string
          expenses_count?: number
          id?: string
          incomes_count?: number
          ocr_scans_count?: number
          period_start?: string
          updated_at?: string
          user_id?: string
          voice_minutes_used?: number | null
          voice_requests_count?: number
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_key: string
          id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address: string
          created_at: string | null
          id: string
          label: string | null
          last_used_at: string | null
          lat: number | null
          lng: number | null
          use_count: number | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          lat?: number | null
          lng?: number | null
          use_count?: number | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          label?: string | null
          last_used_at?: string | null
          lat?: number | null
          lng?: number | null
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_financial_level: {
        Row: {
          created_at: string | null
          experience_points: number | null
          id: string
          last_activity_date: string | null
          level: number | null
          streak_days: number | null
          total_investments: number | null
          total_savings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          experience_points?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          streak_days?: number | null
          total_investments?: number | null
          total_savings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          experience_points?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          streak_days?: number | null
          total_investments?: number | null
          total_savings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_financial_profile: {
        Row: {
          available_capital: number | null
          created_at: string | null
          financial_education_level: string | null
          id: string
          interests: string[] | null
          monthly_investment_capacity: number | null
          passions: string[] | null
          preferred_income_type: string | null
          risk_tolerance: string | null
          talents: string[] | null
          time_availability: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_capital?: number | null
          created_at?: string | null
          financial_education_level?: string | null
          id?: string
          interests?: string[] | null
          monthly_investment_capacity?: number | null
          passions?: string[] | null
          preferred_income_type?: string | null
          risk_tolerance?: string | null
          talents?: string[] | null
          time_availability?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_capital?: number | null
          created_at?: string | null
          financial_education_level?: string | null
          id?: string
          interests?: string[] | null
          monthly_investment_capacity?: number | null
          passions?: string[] | null
          preferred_income_type?: string | null
          risk_tolerance?: string | null
          talents?: string[] | null
          time_availability?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_library_favorites: {
        Row: {
          created_at: string
          id: string
          resource_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_life_profile: {
        Row: {
          anniversary_date: string | null
          biggest_fears: string[] | null
          biggest_financial_mistake: string | null
          birthday_month: number | null
          bucket_list: string[] | null
          career_goals: string[] | null
          children_ages: string[] | null
          children_count: number | null
          company_size: string | null
          created_at: string
          custom_milestones: Json | null
          daily_routine: string | null
          dependents_count: number | null
          employment_status: string | null
          financial_fears: string[] | null
          has_children: boolean | null
          hobbies: string[] | null
          id: string
          industry: string | null
          job_title: string | null
          last_profile_prompt: string | null
          life_dreams: string[] | null
          money_personality: string | null
          motivations: string[] | null
          passions: string[] | null
          pets: string[] | null
          profile_prompts_dismissed: number | null
          proudest_financial_achievement: string | null
          relationship_status: string | null
          role_models: string | null
          sections_completed: string[] | null
          side_hustle: boolean | null
          side_hustle_type: string | null
          sports: string[] | null
          updated_at: string
          user_id: string
          work_life_balance: string | null
          years_experience: number | null
        }
        Insert: {
          anniversary_date?: string | null
          biggest_fears?: string[] | null
          biggest_financial_mistake?: string | null
          birthday_month?: number | null
          bucket_list?: string[] | null
          career_goals?: string[] | null
          children_ages?: string[] | null
          children_count?: number | null
          company_size?: string | null
          created_at?: string
          custom_milestones?: Json | null
          daily_routine?: string | null
          dependents_count?: number | null
          employment_status?: string | null
          financial_fears?: string[] | null
          has_children?: boolean | null
          hobbies?: string[] | null
          id?: string
          industry?: string | null
          job_title?: string | null
          last_profile_prompt?: string | null
          life_dreams?: string[] | null
          money_personality?: string | null
          motivations?: string[] | null
          passions?: string[] | null
          pets?: string[] | null
          profile_prompts_dismissed?: number | null
          proudest_financial_achievement?: string | null
          relationship_status?: string | null
          role_models?: string | null
          sections_completed?: string[] | null
          side_hustle?: boolean | null
          side_hustle_type?: string | null
          sports?: string[] | null
          updated_at?: string
          user_id: string
          work_life_balance?: string | null
          years_experience?: number | null
        }
        Update: {
          anniversary_date?: string | null
          biggest_fears?: string[] | null
          biggest_financial_mistake?: string | null
          birthday_month?: number | null
          bucket_list?: string[] | null
          career_goals?: string[] | null
          children_ages?: string[] | null
          children_count?: number | null
          company_size?: string | null
          created_at?: string
          custom_milestones?: Json | null
          daily_routine?: string | null
          dependents_count?: number | null
          employment_status?: string | null
          financial_fears?: string[] | null
          has_children?: boolean | null
          hobbies?: string[] | null
          id?: string
          industry?: string | null
          job_title?: string | null
          last_profile_prompt?: string | null
          life_dreams?: string[] | null
          money_personality?: string | null
          motivations?: string[] | null
          passions?: string[] | null
          pets?: string[] | null
          profile_prompts_dismissed?: number | null
          proudest_financial_achievement?: string | null
          relationship_status?: string | null
          role_models?: string | null
          sections_completed?: string[] | null
          side_hustle?: boolean | null
          side_hustle_type?: string | null
          sports?: string[] | null
          updated_at?: string
          user_id?: string
          work_life_balance?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          billing_period: Database["public"]["Enums"]["billing_period"] | null
          created_at: string
          expires_at: string | null
          has_bundle: boolean
          id: string
          is_active: boolean
          plan_type: Database["public"]["Enums"]["plan_type"]
          started_at: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          created_at?: string
          expires_at?: string | null
          has_bundle?: boolean
          id?: string
          is_active?: boolean
          plan_type?: Database["public"]["Enums"]["plan_type"]
          started_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: Database["public"]["Enums"]["billing_period"] | null
          created_at?: string
          expires_at?: string | null
          has_bundle?: boolean
          id?: string
          is_active?: boolean
          plan_type?: Database["public"]["Enums"]["plan_type"]
          started_at?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_rate_limits: {
        Row: {
          id: string
          identifier: string
          identifier_type: string
          request_count: number
          window_start: string
        }
        Insert: {
          id?: string
          identifier: string
          identifier_type?: string
          request_count?: number
          window_start?: string
        }
        Update: {
          id?: string
          identifier?: string
          identifier_type?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      data_health_check: {
        Row: {
          detail: string | null
          entity_type: string | null
          issue_type: string | null
          record_date: string | null
          record_id: string | null
          record_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_beta_tester: {
        Args: { p_days?: number; p_user_id: string }
        Returns: undefined
      }
      apply_beta_reward: { Args: { p_redemption_id: string }; Returns: Json }
      can_use_ai: {
        Args: { credit_limit?: number; user_uuid: string }
        Returns: boolean
      }
      capture_referral_lead: {
        Args: {
          p_email: string
          p_marketing_consent: boolean
          p_name: string
          p_referral_code: string
        }
        Returns: Json
      }
      check_beta_weekly_quota: { Args: { p_user_id: string }; Returns: Json }
      claim_beta_reward: {
        Args: { p_reward_type: string; p_user_id: string }
        Returns: {
          admin_notes: string | null
          created_at: string
          id: string
          points_spent: number
          reward_type: string
          status: string
          subscription_end_date: string | null
          tier_at_redemption: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "beta_reward_redemptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_first_admin: { Args: never; Returns: boolean }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      extend_beta_access: {
        Args: { p_days: number; p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      get_ecosystem_leaderboard: {
        Args: { p_week_key?: string }
        Returns: {
          achievements_count: number
          display_name: string
          focus_minutes: number
          health_score: number
          rank: number
          streak_days: number
          total_score: number
        }[]
      }
      get_monthly_ai_credits_used: {
        Args: { user_uuid: string }
        Returns: number
      }
      get_or_create_monthly_usage: {
        Args: { p_user_id: string }
        Returns: {
          bank_analyses_count: number
          contract_analyses_count: number
          created_at: string
          expenses_count: number
          id: string
          incomes_count: number
          ocr_scans_count: number
          period_start: string
          updated_at: string
          user_id: string
          voice_minutes_used: number | null
          voice_requests_count: number
        }
        SetofOptions: {
          from: "*"
          to: "usage_tracking"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_user_beta_stats: { Args: { target_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: {
        Args: { p_usage_type: string; p_user_id: string }
        Returns: undefined
      }
      increment_voice_usage: {
        Args: { p_minutes: number; p_user_id: string }
        Returns: undefined
      }
      internal_award_beta_points: {
        Args: { p_category?: string; p_points: number; p_user_id: string }
        Returns: {
          best_streak: number
          bug_report_points: number
          created_at: string
          feature_usage_points: number
          feedback_points: number
          id: string
          last_activity_date: string | null
          referral_points: number
          reward_claimed: boolean
          reward_claimed_at: string | null
          streak_days: number
          tier: string
          total_points: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "beta_tester_points"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: { p_user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      revoke_beta_access: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: undefined
      }
      unlock_achievement: {
        Args: {
          p_achievement_description?: string
          p_achievement_key: string
          p_achievement_name?: string
          p_points?: number
        }
        Returns: string
      }
      update_beta_streak: {
        Args: { p_user_id: string }
        Returns: {
          best_streak: number
          bug_report_points: number
          created_at: string
          feature_usage_points: number
          feedback_points: number
          id: string
          last_activity_date: string | null
          referral_points: number
          reward_claimed: boolean
          reward_claimed_at: string | null
          streak_days: number
          tier: string
          total_points: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "beta_tester_points"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      use_beta_invitation_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      use_beta_referral_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      validate_any_beta_code: { Args: { p_code: string }; Returns: Json }
      validate_beta_invitation_code: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      billing_period: "monthly" | "annual"
      contract_status: "uploaded" | "pending_ai" | "ready"
      document_status:
        | "pending"
        | "possible_duplicate"
        | "classified"
        | "archived"
      expense_status:
        | "pending"
        | "classified"
        | "deductible"
        | "non_deductible"
        | "reimbursable"
        | "rejected"
        | "under_review"
        | "finalized"
      income_type:
        | "salary"
        | "client_payment"
        | "bonus"
        | "gift"
        | "refund"
        | "investment_stocks"
        | "investment_crypto"
        | "investment_funds"
        | "passive_rental"
        | "passive_royalties"
        | "online_business"
        | "freelance"
        | "other"
      plan_type: "free" | "premium" | "pro"
      recurrence_type:
        | "one_time"
        | "daily"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "quarterly"
        | "yearly"
      user_role: "user" | "accountant" | "admin"
      work_type: "employee" | "contractor" | "corporation"
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
      billing_period: ["monthly", "annual"],
      contract_status: ["uploaded", "pending_ai", "ready"],
      document_status: [
        "pending",
        "possible_duplicate",
        "classified",
        "archived",
      ],
      expense_status: [
        "pending",
        "classified",
        "deductible",
        "non_deductible",
        "reimbursable",
        "rejected",
        "under_review",
        "finalized",
      ],
      income_type: [
        "salary",
        "client_payment",
        "bonus",
        "gift",
        "refund",
        "investment_stocks",
        "investment_crypto",
        "investment_funds",
        "passive_rental",
        "passive_royalties",
        "online_business",
        "freelance",
        "other",
      ],
      plan_type: ["free", "premium", "pro"],
      recurrence_type: [
        "one_time",
        "daily",
        "weekly",
        "biweekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
      user_role: ["user", "accountant", "admin"],
      work_type: ["employee", "contractor", "corporation"],
    },
  },
} as const
