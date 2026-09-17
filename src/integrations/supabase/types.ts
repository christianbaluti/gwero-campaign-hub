export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string;
          body: string;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          occurred_at: string;
          updated_at: string;
        };
        Insert: {
          activity_type?: string;
          body: string;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          occurred_at?: string;
          updated_at?: string;
        };
        Update: {
          activity_type?: string;
          body?: string;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          occurred_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agreement_items: {
        Row: {
          agreement_id: string;
          created_at: string;
          description: string;
          id: string;
          quantity: number;
          unit_price: number;
          updated_at: string;
        };
        Insert: {
          agreement_id: string;
          created_at?: string;
          description: string;
          id?: string;
          quantity?: number;
          unit_price?: number;
          updated_at?: string;
        };
        Update: {
          agreement_id?: string;
          created_at?: string;
          description?: string;
          id?: string;
          quantity?: number;
          unit_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agreement_items_agreement_id_fkey";
            columns: ["agreement_id"];
            isOneToOne: false;
            referencedRelation: "agreements";
            referencedColumns: ["id"];
          },
        ];
      };
      agreements: {
        Row: {
          agreement_type: string;
          auto_renew: boolean;
          billing_cycle: string;
          client_id: string;
          coverage_hours: string | null;
          created_at: string;
          currency: string;
          deal_id: string | null;
          end_date: string | null;
          id: string;
          notes: string | null;
          resolution_time_hours: number | null;
          response_time_hours: number | null;
          start_date: string | null;
          status: string;
          title: string;
          updated_at: string;
          value: number;
        };
        Insert: {
          agreement_type?: string;
          auto_renew?: boolean;
          billing_cycle?: string;
          client_id: string;
          coverage_hours?: string | null;
          created_at?: string;
          currency?: string;
          deal_id?: string | null;
          end_date?: string | null;
          id?: string;
          notes?: string | null;
          resolution_time_hours?: number | null;
          response_time_hours?: number | null;
          start_date?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
          value?: number;
        };
        Update: {
          agreement_type?: string;
          auto_renew?: boolean;
          billing_cycle?: string;
          client_id?: string;
          coverage_hours?: string | null;
          created_at?: string;
          currency?: string;
          deal_id?: string | null;
          end_date?: string | null;
          id?: string;
          notes?: string | null;
          resolution_time_hours?: number | null;
          response_time_hours?: number | null;
          start_date?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "agreements_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agreements_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "deals";
            referencedColumns: ["id"];
          },
        ];
      };
      campaign_recipients: {
        Row: {
          campaign_id: string;
          click_count: number;
          clicked_at: string | null;
          created_at: string;
          error: string | null;
          id: string;
          message_id: string | null;
          open_count: number;
          opened_at: string | null;
          prospect_id: string;
          replied_at: string | null;
          sent_at: string | null;
          status: string;
        };
        Insert: {
          campaign_id: string;
          click_count?: number;
          clicked_at?: string | null;
          created_at?: string;
          error?: string | null;
          id?: string;
          message_id?: string | null;
          open_count?: number;
          opened_at?: string | null;
          prospect_id: string;
          replied_at?: string | null;
          sent_at?: string | null;
          status?: string;
        };
        Update: {
          campaign_id?: string;
          click_count?: number;
          clicked_at?: string | null;
          created_at?: string;
          error?: string | null;
          id?: string;
          message_id?: string | null;
          open_count?: number;
          opened_at?: string | null;
          prospect_id?: string;
          replied_at?: string | null;
          sent_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_recipients_prospect_id_fkey";
            columns: ["prospect_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          attachments: Json;
          bcc: string[];
          body_html: string;
          cc: string[];
          created_at: string;
          id: string;
          mailbox_id: string | null;
          name: string;
          sent_at: string | null;
          status: string;
          subject: string;
          track_clicks: boolean;
          track_opens: boolean;
          updated_at: string;
        };
        Insert: {
          attachments?: Json;
          bcc?: string[];
          body_html?: string;
          cc?: string[];
          created_at?: string;
          id?: string;
          mailbox_id?: string | null;
          name: string;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          track_clicks?: boolean;
          track_opens?: boolean;
          updated_at?: string;
        };
        Update: {
          attachments?: Json;
          bcc?: string[];
          body_html?: string;
          cc?: string[];
          created_at?: string;
          id?: string;
          mailbox_id?: string | null;
          name?: string;
          sent_at?: string | null;
          status?: string;
          subject?: string;
          track_clicks?: boolean;
          track_opens?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaigns_mailbox_id_fkey";
            columns: ["mailbox_id"];
            isOneToOne: false;
            referencedRelation: "mailboxes";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          address: string | null;
          company: string | null;
          created_at: string;
          email: string | null;
          id: string;
          industry: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          prospect_id: string | null;
          status: string;
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          industry?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          prospect_id?: string | null;
          status?: string;
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          industry?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          prospect_id?: string | null;
          status?: string;
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_prospect_id_fkey";
            columns: ["prospect_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
      deals: {
        Row: {
          client_id: string | null;
          created_at: string;
          currency: string;
          expected_close_date: string | null;
          id: string;
          notes: string | null;
          owner: string | null;
          probability: number;
          prospect_id: string | null;
          stage: string;
          title: string;
          updated_at: string;
          value: number;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          currency?: string;
          expected_close_date?: string | null;
          id?: string;
          notes?: string | null;
          owner?: string | null;
          probability?: number;
          prospect_id?: string | null;
          stage?: string;
          title: string;
          updated_at?: string;
          value?: number;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          currency?: string;
          expected_close_date?: string | null;
          id?: string;
          notes?: string | null;
          owner?: string | null;
          probability?: number;
          prospect_id?: string | null;
          stage?: string;
          title?: string;
          updated_at?: string;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deals_prospect_id_fkey";
            columns: ["prospect_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
      mailbox_secrets: {
        Row: {
          imap_password: string | null;
          mailbox_id: string;
          smtp_password: string | null;
          updated_at: string;
        };
        Insert: {
          imap_password?: string | null;
          mailbox_id: string;
          smtp_password?: string | null;
          updated_at?: string;
        };
        Update: {
          imap_password?: string | null;
          mailbox_id?: string;
          smtp_password?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mailbox_secrets_mailbox_id_fkey";
            columns: ["mailbox_id"];
            isOneToOne: true;
            referencedRelation: "mailboxes";
            referencedColumns: ["id"];
          },
        ];
      };
      mailboxes: {
        Row: {
          created_at: string;
          from_email: string;
          from_name: string | null;
          id: string;
          imap_host: string | null;
          imap_port: number | null;
          imap_username: string | null;
          is_default: boolean;
          last_status: string | null;
          last_sync_at: string | null;
          name: string;
          provider: string;
          smtp_host: string | null;
          smtp_port: number | null;
          smtp_secure: boolean;
          smtp_username: string | null;
        };
        Insert: {
          created_at?: string;
          from_email: string;
          from_name?: string | null;
          id?: string;
          imap_host?: string | null;
          imap_port?: number | null;
          imap_username?: string | null;
          is_default?: boolean;
          last_status?: string | null;
          last_sync_at?: string | null;
          name: string;
          provider?: string;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_secure?: boolean;
          smtp_username?: string | null;
        };
        Update: {
          created_at?: string;
          from_email?: string;
          from_name?: string | null;
          id?: string;
          imap_host?: string | null;
          imap_port?: number | null;
          imap_username?: string | null;
          is_default?: boolean;
          last_status?: string | null;
          last_sync_at?: string | null;
          name?: string;
          provider?: string;
          smtp_host?: string | null;
          smtp_port?: number | null;
          smtp_secure?: boolean;
          smtp_username?: string | null;
        };
        Relationships: [];
      };
      prospects: {
        Row: {
          company: string | null;
          created_at: string;
          email: string;
          extra: Json;
          first_name: string | null;
          id: string;
          job_title: string | null;
          last_name: string | null;
          notes: string | null;
          phone: string | null;
          source_file: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          company?: string | null;
          created_at?: string;
          email: string;
          extra?: Json;
          first_name?: string | null;
          id?: string;
          job_title?: string | null;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          source_file?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          company?: string | null;
          created_at?: string;
          email?: string;
          extra?: Json;
          first_name?: string | null;
          id?: string;
          job_title?: string | null;
          last_name?: string | null;
          notes?: string | null;
          phone?: string | null;
          source_file?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      replies: {
        Row: {
          campaign_id: string | null;
          created_at: string;
          external_id: string | null;
          from_email: string;
          id: string;
          mailbox_id: string | null;
          prospect_id: string | null;
          received_at: string;
          snippet: string | null;
          subject: string | null;
        };
        Insert: {
          campaign_id?: string | null;
          created_at?: string;
          external_id?: string | null;
          from_email: string;
          id?: string;
          mailbox_id?: string | null;
          prospect_id?: string | null;
          received_at?: string;
          snippet?: string | null;
          subject?: string | null;
        };
        Update: {
          campaign_id?: string | null;
          created_at?: string;
          external_id?: string | null;
          from_email?: string;
          id?: string;
          mailbox_id?: string | null;
          prospect_id?: string | null;
          received_at?: string;
          snippet?: string | null;
          subject?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "replies_campaign_id_fkey";
            columns: ["campaign_id"];
            isOneToOne: false;
            referencedRelation: "campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "replies_mailbox_id_fkey";
            columns: ["mailbox_id"];
            isOneToOne: false;
            referencedRelation: "mailboxes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "replies_prospect_id_fkey";
            columns: ["prospect_id"];
            isOneToOne: false;
            referencedRelation: "prospects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
