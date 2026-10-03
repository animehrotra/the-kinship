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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appreciation_responses: {
        Row: {
          created_at: string
          id: string
          is_testimonial_candidate: boolean
          response_text: string | null
          sentiment: string
          source: string
          testimonial_consent: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_testimonial_candidate?: boolean
          response_text?: string | null
          sentiment: string
          source: string
          testimonial_consent?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_testimonial_candidate?: boolean
          response_text?: string | null
          sentiment?: string
          source?: string
          testimonial_consent?: boolean
          user_id?: string
        }
        Relationships: []
      }
      contact_tags: {
        Row: {
          contact_id: string
          id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          id?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived: boolean
          birthday: string | null
          circle: Database["public"]["Enums"]["circle_tier"]
          created_at: string
          email: string | null
          id: string
          last_interaction_at: string | null
          last_notified_for_nudge_at: string | null
          last_nudged_at: string | null
          name: string
          next_nudge_at: string | null
          notes: string | null
          nudge_end_date: string | null
          nudge_frequency: Database["public"]["Enums"]["nudge_frequency"]
          nudge_interval_unit: string
          nudge_interval_value: number
          nudge_start_date: string | null
          phone: string | null
          renudge_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          birthday?: string | null
          circle: Database["public"]["Enums"]["circle_tier"]
          created_at?: string
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          last_notified_for_nudge_at?: string | null
          last_nudged_at?: string | null
          name: string
          next_nudge_at?: string | null
          notes?: string | null
          nudge_end_date?: string | null
          nudge_frequency?: Database["public"]["Enums"]["nudge_frequency"]
          nudge_interval_unit?: string
          nudge_interval_value?: number
          nudge_start_date?: string | null
          phone?: string | null
          renudge_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          birthday?: string | null
          circle?: Database["public"]["Enums"]["circle_tier"]
          created_at?: string
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          last_notified_for_nudge_at?: string | null
          last_nudged_at?: string | null
          name?: string
          next_nudge_at?: string | null
          notes?: string | null
          nudge_end_date?: string | null
          nudge_frequency?: Database["public"]["Enums"]["nudge_frequency"]
          nudge_interval_unit?: string
          nudge_interval_value?: number
          nudge_start_date?: string | null
          phone?: string | null
          renudge_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          app_version: string | null
          category: string
          closed_at: string | null
          created_at: string
          id: string
          message: string
          page_url: string | null
          screenshot_path: string | null
          user_agent: string | null
          user_id: string
          viewport: string | null
        }
        Insert: {
          app_version?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          message: string
          page_url?: string | null
          screenshot_path?: string | null
          user_agent?: string | null
          user_id: string
          viewport?: string | null
        }
        Update: {
          app_version?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string
          id?: string
          message?: string
          page_url?: string | null
          screenshot_path?: string | null
          user_agent?: string | null
          user_id?: string
          viewport?: string | null
        }
        Relationships: []
      }
      interactions: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      life_events: {
        Row: {
          contact_id: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          recurring: boolean
          title: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          recurring?: boolean
          title: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          recurring?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      nudge_events: {
        Row: {
          contact_id: string
          created_at: string
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudge_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nudge_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_state: {
        Row: {
          created_at: string
          last_tip_shown_at: string | null
          milestone_1_seen: boolean
          milestone_2_seen: boolean
          milestone_3_seen: boolean
          positive_response: boolean
          seen_tips: string[]
          tour_completed_at: string | null
          tour_skipped: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_tip_shown_at?: string | null
          milestone_1_seen?: boolean
          milestone_2_seen?: boolean
          milestone_3_seen?: boolean
          positive_response?: boolean
          seen_tips?: string[]
          tour_completed_at?: string | null
          tour_skipped?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_tip_shown_at?: string | null
          milestone_1_seen?: boolean
          milestone_2_seen?: boolean
          milestone_3_seen?: boolean
          positive_response?: boolean
          seen_tips?: string[]
          tour_completed_at?: string | null
          tour_skipped?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          last_nudge_notified_on: string | null
          last_seen_release: string | null
          notify_hour: number
          notify_minute: number
          notify_timezone: string
          upcoming_nudge_window_days: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          last_nudge_notified_on?: string | null
          last_seen_release?: string | null
          notify_hour?: number
          notify_minute?: number
          notify_timezone?: string
          upcoming_nudge_window_days?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          last_nudge_notified_on?: string | null
          last_seen_release?: string | null
          notify_hour?: number
          notify_minute?: number
          notify_timezone?: string
          upcoming_nudge_window_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      act_on_overdue_nudge: {
        Args: {
          p_action: string
          p_contact_id: string
          p_interaction_at?: string
          p_interaction_type?: Database["public"]["Enums"]["interaction_type"]
          p_notes?: string
        }
        Returns: undefined
      }
      claim_contact_nudge: {
        Args: {
          p_contact_id: string
          p_expected_at: string
          p_expected_count: number
          p_type: string
        }
        Returns: boolean
      }
      cleanup_closed_feedback: { Args: never; Returns: undefined }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      circle_tier: "inner_circle" | "close" | "casual" | "reconnect"
      interaction_type: "texted" | "called" | "met_up" | "video_call" | "social"
      nudge_frequency: "weekly" | "biweekly" | "monthly" | "quarterly"
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
    Enums: {
      app_role: ["admin", "user"],
      circle_tier: ["inner_circle", "close", "casual", "reconnect"],
      interaction_type: ["texted", "called", "met_up", "video_call", "social"],
      nudge_frequency: ["weekly", "biweekly", "monthly", "quarterly"],
    },
  },
} as const
