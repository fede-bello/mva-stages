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
      contact_requests: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          offer_url: string | null
          reply_email: string | null
          resolved: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          offer_url?: string | null
          reply_email?: string | null
          resolved?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          offer_url?: string | null
          reply_email?: string | null
          resolved?: boolean
        }
        Relationships: []
      }
      offer_reports: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string | null
          offer_id: string
          resolved: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message?: string | null
          offer_id: string
          resolved?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string | null
          offer_id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "offer_reports_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          apply_contact: string | null
          apply_method: string
          apply_url: string | null
          april_start: string
          ats: string | null
          city: string | null
          country: string | null
          created_at: string
          deadline: string | null
          description: string | null
          duration_months_max: number | null
          duration_months_min: number | null
          duration_text: string | null
          first_seen: string
          id: string
          msc_eligible: string
          notes: string | null
          org_type: string | null
          organization: string
          posted_date: string | null
          reference: string | null
          requirements: string | null
          slug: string
          source_type: string
          source_url: string | null
          start_text: string | null
          status: string
          status_checked: string | null
          stipend_max_eur_month: number | null
          stipend_min_eur_month: number | null
          stipend_text: string | null
          title: string
          title_en: string | null
          topics: string[]
          updated_at: string
          verified: boolean
          work_mode: string
        }
        Insert: {
          apply_contact?: string | null
          apply_method?: string
          apply_url?: string | null
          april_start?: string
          ats?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration_months_max?: number | null
          duration_months_min?: number | null
          duration_text?: string | null
          first_seen?: string
          id?: string
          msc_eligible?: string
          notes?: string | null
          org_type?: string | null
          organization: string
          posted_date?: string | null
          reference?: string | null
          requirements?: string | null
          slug?: string
          source_type?: string
          source_url?: string | null
          start_text?: string | null
          status?: string
          status_checked?: string | null
          stipend_max_eur_month?: number | null
          stipend_min_eur_month?: number | null
          stipend_text?: string | null
          title: string
          title_en?: string | null
          topics?: string[]
          updated_at?: string
          verified?: boolean
          work_mode?: string
        }
        Update: {
          apply_contact?: string | null
          apply_method?: string
          apply_url?: string | null
          april_start?: string
          ats?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration_months_max?: number | null
          duration_months_min?: number | null
          duration_text?: string | null
          first_seen?: string
          id?: string
          msc_eligible?: string
          notes?: string | null
          org_type?: string | null
          organization?: string
          posted_date?: string | null
          reference?: string | null
          requirements?: string | null
          slug?: string
          source_type?: string
          source_url?: string | null
          start_text?: string | null
          status?: string
          status_checked?: string | null
          stipend_max_eur_month?: number | null
          stipend_min_eur_month?: number | null
          stipend_text?: string | null
          title?: string
          title_en?: string | null
          topics?: string[]
          updated_at?: string
          verified?: boolean
          work_mode?: string
        }
        Relationships: []
      }
    }
    Views: {
      offer_report_counts: {
        Row: {
          offer_id: string | null
          open_reports: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_reports_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_personal_email: { Args: { t: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

