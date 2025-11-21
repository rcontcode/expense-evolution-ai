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
      clients: {
        Row: {
          billing_profile: Json | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          province: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_profile?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          province?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_profile?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          province?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
          billing_profile: Json | null
          client_id: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          status: Database["public"]["Enums"]["contract_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_profile?: Json | null
          client_id?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_profile?: Json | null
          client_id?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          user_id?: string
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
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          status: Database["public"]["Enums"]["document_status"] | null
          thumbnail_path: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          thumbnail_path?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["public"]["Enums"]["document_status"] | null
          thumbnail_path?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string | null
          currency: string | null
          date: string
          description: string | null
          document_id: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["expense_status"] | null
          updated_at: string | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          date: string
          description?: string | null
          document_id?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["expense_status"] | null
          updated_at?: string | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          date?: string
          description?: string | null
          document_id?: string | null
          id?: string
          notes?: string | null
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
            foreignKeyName: "expenses_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
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
      mileage: {
        Row: {
          client_id: string | null
          created_at: string | null
          date: string
          id: string
          kilometers: number
          purpose: string | null
          route: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          kilometers: number
          purpose?: string | null
          route: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          kilometers?: number
          purpose?: string | null
          route?: string
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
            foreignKeyName: "mileage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          language: string | null
          onboarding_completed: boolean | null
          province: string | null
          updated_at: string | null
          work_types: Database["public"]["Enums"]["work_type"][] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          language?: string | null
          onboarding_completed?: boolean | null
          province?: string | null
          updated_at?: string | null
          work_types?: Database["public"]["Enums"]["work_type"][] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          onboarding_completed?: boolean | null
          province?: string | null
          updated_at?: string | null
          work_types?: Database["public"]["Enums"]["work_type"][] | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_use_ai: {
        Args: { credit_limit?: number; user_uuid: string }
        Returns: boolean
      }
      get_monthly_ai_credits_used: {
        Args: { user_uuid: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
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
      user_role: ["user", "accountant", "admin"],
      work_type: ["employee", "contractor", "corporation"],
    },
  },
} as const
