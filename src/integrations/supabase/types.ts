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
      bank_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          matched_expense_id: string | null
          status: string | null
          transaction_date: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          matched_expense_id?: string | null
          status?: string | null
          transaction_date: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          matched_expense_id?: string | null
          status?: string | null
          transaction_date?: string
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
          comment: string | null
          created_at: string
          design_rating: number | null
          ease_of_use: number | null
          id: string
          rating: number
          section: string
          suggestions: string | null
          usefulness: number | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          design_rating?: number | null
          ease_of_use?: number | null
          id?: string
          rating: number
          section: string
          suggestions?: string | null
          usefulness?: number | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          design_rating?: number | null
          ease_of_use?: number | null
          id?: string
          rating?: number
          section?: string
          suggestions?: string | null
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
      category_budgets: {
        Row: {
          alert_threshold: number
          category: string
          created_at: string | null
          id: string
          monthly_budget: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold?: number
          category: string
          created_at?: string | null
          id?: string
          monthly_budget?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold?: number
          category?: string
          created_at?: string | null
          id?: string
          monthly_budget?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          description: string | null
          end_date: string | null
          entity_id: string | null
          extracted_terms: Json | null
          file_name: string
          file_path: string
          file_type: string | null
          id: string
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
          description?: string | null
          end_date?: string | null
          entity_id?: string | null
          extracted_terms?: Json | null
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
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
          description?: string | null
          end_date?: string | null
          entity_id?: string | null
          extracted_terms?: Json | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
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
          description: string | null
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
          description?: string | null
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
          description?: string | null
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
      mileage: {
        Row: {
          client_id: string | null
          created_at: string | null
          date: string
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
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
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
      profiles: {
        Row: {
          beta_expires_at: string | null
          beta_extended_by: string | null
          beta_extension_reason: string | null
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
          onboarding_completed: boolean | null
          province: string | null
          rut: string | null
          tax_regime: string | null
          updated_at: string | null
          work_types: Database["public"]["Enums"]["work_type"][] | null
        }
        Insert: {
          beta_expires_at?: string | null
          beta_extended_by?: string | null
          beta_extension_reason?: string | null
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
          onboarding_completed?: boolean | null
          province?: string | null
          rut?: string | null
          tax_regime?: string | null
          updated_at?: string | null
          work_types?: Database["public"]["Enums"]["work_type"][] | null
        }
        Update: {
          beta_expires_at?: string | null
          beta_extended_by?: string | null
          beta_extension_reason?: string | null
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
          onboarding_completed?: boolean | null
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
          converted_at: string | null
          converted_to_user: boolean | null
          country: string | null
          created_at: string
          email: string
          failed_questions: number[] | null
          goal: string | null
          id: string
          name: string
          obstacle: string | null
          phone: string | null
          quiz_level: string | null
          quiz_score: number | null
          situation: string | null
          time_spent: string | null
          updated_at: string
        }
        Insert: {
          converted_at?: string | null
          converted_to_user?: boolean | null
          country?: string | null
          created_at?: string
          email: string
          failed_questions?: number[] | null
          goal?: string | null
          id?: string
          name: string
          obstacle?: string | null
          phone?: string | null
          quiz_level?: string | null
          quiz_score?: number | null
          situation?: string | null
          time_spent?: string | null
          updated_at?: string
        }
        Update: {
          converted_at?: string | null
          converted_to_user?: boolean | null
          country?: string | null
          created_at?: string
          email?: string
          failed_questions?: number[] | null
          goal?: string | null
          id?: string
          name?: string
          obstacle?: string | null
          phone?: string | null
          quiz_level?: string | null
          quiz_score?: number | null
          situation?: string | null
          time_spent?: string | null
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_beta_tester: {
        Args: { p_days?: number; p_user_id: string }
        Returns: undefined
      }
      award_beta_points: {
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
      can_use_ai: {
        Args: { credit_limit?: number; user_uuid: string }
        Returns: boolean
      }
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
      extend_beta_access: {
        Args: { p_days: number; p_reason?: string; p_user_id: string }
        Returns: undefined
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
        Returns: boolean
      }
      revoke_beta_access: {
        Args: { p_reason?: string; p_user_id: string }
        Returns: undefined
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
