export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Hand-maintained Supabase `Database` types.
 *
 * `pnpm supabase:types` writes raw CLI output to `types.generated.ts` (gitignored).
 * After schema changes: diff against this file and merge new columns/tables here,
 * keeping strict unions below on check-constraint columns (Postgres `text` → plain `string` in codegen).
 */
/** Strict unions — mirror supabase/migrations check constraints */
export type CountryCode = "NP" | "FI";
export type CurrencyCode = "NPR" | "EUR";
export type CustomerStatus = "active" | "suspended";
export type MerchantStatus = "pending" | "active" | "suspended" | "rejected";
export type RewardStatus = "collecting" | "pending_otp" | "unlocked";
export type RewardType = "free_item" | "percent_discount" | "fixed_discount";
export type StampSource = "qr_scan" | "admin_manual";
export type StampSessionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "voided";
export type RedemptionStatus = "pending" | "redeemed";
export type OtpPurpose = "redemption" | "signup";
export type AuditTargetType = "merchant" | "customer" | "stamp" | "redemption";

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          admin_id: string;
          created_at: string;
          id: string;
          notes: string | null;
          target_id: string;
          target_type: AuditTargetType;
        };
        Insert: {
          action: string;
          admin_id: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          target_id: string;
          target_type: AuditTargetType;
        };
        Update: {
          action?: string;
          admin_id?: string;
          created_at?: string;
          id?: string;
          notes?: string | null;
          target_id?: string;
          target_type?: string;
        };
        Relationships: [];
      };
      customer_cards: {
        Row: {
          created_at: string;
          current_stamps: number;
          customer_id: string;
          cycle_number: number;
          id: string;
          last_stamped_at: string | null;
          loyalty_card_id: string;
          merchant_id: string;
          reward_status: RewardStatus;
          targets_reached: number;
          total_stamps_ever: number;
        };
        Insert: {
          created_at?: string;
          current_stamps?: number;
          customer_id: string;
          cycle_number?: number;
          id?: string;
          last_stamped_at?: string | null;
          loyalty_card_id: string;
          merchant_id: string;
          reward_status?: RewardStatus;
          targets_reached?: number;
          total_stamps_ever?: number;
        };
        Update: {
          created_at?: string;
          current_stamps?: number;
          customer_id?: string;
          cycle_number?: number;
          id?: string;
          last_stamped_at?: string | null;
          loyalty_card_id?: string;
          merchant_id?: string;
          reward_status?: RewardStatus;
          targets_reached?: number;
          total_stamps_ever?: number;
        };
        Relationships: [
          {
            foreignKeyName: "customer_cards_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_cards_loyalty_card_id_fkey";
            columns: ["loyalty_card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "customer_cards_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          country_code: CountryCode;
          created_at: string;
          deleted_at: string | null;
          id: string;
          last_active_at: string;
          name: string | null;
          phone: string;
          status: CustomerStatus;
        };
        Insert: {
          country_code: CountryCode;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          last_active_at?: string;
          name?: string | null;
          phone: string;
          status?: CustomerStatus;
        };
        Update: {
          country_code?: CountryCode;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          last_active_at?: string;
          name?: string | null;
          phone?: string;
          status?: CustomerStatus;
        };
        Relationships: [];
      };
      loyalty_cards: {
        Row: {
          card_name: string;
          created_at: string;
          description: string;
          id: string;
          is_active: boolean;
          merchant_id: string;
          min_spend: number;
          min_spend_currency: CurrencyCode;
          reward_description: string;
          reward_type: RewardType;
          reward_value: string;
          stamp_target: number;
        };
        Insert: {
          card_name: string;
          created_at?: string;
          description: string;
          id?: string;
          is_active?: boolean;
          merchant_id: string;
          min_spend?: number;
          min_spend_currency: CurrencyCode;
          reward_description: string;
          reward_type: RewardType;
          reward_value: string;
          stamp_target: number;
        };
        Update: {
          card_name?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_active?: boolean;
          merchant_id?: string;
          min_spend?: number;
          min_spend_currency?: CurrencyCode;
          reward_description?: string;
          reward_type?: RewardType;
          reward_value?: string;
          stamp_target?: number;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_cards_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      merchants: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          business_name: string;
          category: string;
          country: CountryCode;
          created_at: string;
          email: string;
          id: string;
          logo_url: string | null;
          phone: string | null;
          primary_color: string;
          rejection_reason: string | null;
          status: MerchantStatus;
          user_id: string;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          business_name: string;
          category: string;
          country: CountryCode;
          created_at?: string;
          email: string;
          id?: string;
          logo_url?: string | null;
          phone?: string | null;
          primary_color?: string;
          rejection_reason?: string | null;
          status?: MerchantStatus;
          user_id: string;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          business_name?: string;
          category?: string;
          country?: CountryCode;
          created_at?: string;
          email?: string;
          id?: string;
          logo_url?: string | null;
          phone?: string | null;
          primary_color?: string;
          rejection_reason?: string | null;
          status?: MerchantStatus;
          user_id?: string;
        };
        Relationships: [];
      };
      merchant_locations: {
        Row: {
          address: string | null;
          city: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          is_primary: boolean;
          merchant_id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_primary?: boolean;
          merchant_id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          is_primary?: boolean;
          merchant_id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "merchant_locations_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      otp_tokens: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          otp_hash: string;
          phone: string;
          purpose: OtpPurpose;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          otp_hash: string;
          phone: string;
          purpose?: OtpPurpose;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          otp_hash?: string;
          phone?: string;
          purpose?: OtpPurpose;
        };
        Relationships: [];
      };
      redemptions: {
        Row: {
          created_at: string;
          customer_card_id: string;
          cycle_number: number;
          id: string;
          location_id: string | null;
          merchant_id: string;
          redeemed_at: string | null;
          redemption_code: string;
          status: RedemptionStatus;
        };
        Insert: {
          created_at?: string;
          customer_card_id: string;
          cycle_number?: number;
          id?: string;
          location_id?: string | null;
          merchant_id: string;
          redeemed_at?: string | null;
          redemption_code: string;
          status?: RedemptionStatus;
        };
        Update: {
          created_at?: string;
          customer_card_id?: string;
          cycle_number?: number;
          id?: string;
          location_id?: string | null;
          merchant_id?: string;
          redeemed_at?: string | null;
          redemption_code?: string;
          status?: RedemptionStatus;
        };
        Relationships: [
          {
            foreignKeyName: "redemptions_customer_card_id_fkey";
            columns: ["customer_card_id"];
            isOneToOne: false;
            referencedRelation: "customer_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redemptions_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "merchant_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redemptions_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
      stamp_sessions: {
        Row: {
          created_at: string;
          customer_card_id: string;
          id: string;
          location_id: string | null;
          merchant_id: string;
          rejection_reason: string | null;
          resolved_at: string | null;
          session_token: string;
          source: StampSource;
          status: StampSessionStatus;
        };
        Insert: {
          created_at?: string;
          customer_card_id: string;
          id?: string;
          location_id?: string | null;
          merchant_id: string;
          rejection_reason?: string | null;
          resolved_at?: string | null;
          session_token: string;
          source?: StampSource;
          status?: StampSessionStatus;
        };
        Update: {
          created_at?: string;
          customer_card_id?: string;
          id?: string;
          location_id?: string | null;
          merchant_id?: string;
          rejection_reason?: string | null;
          resolved_at?: string | null;
          session_token?: string;
          source?: StampSource;
          status?: StampSessionStatus;
        };
        Relationships: [
          {
            foreignKeyName: "stamp_sessions_customer_card_id_fkey";
            columns: ["customer_card_id"];
            isOneToOne: false;
            referencedRelation: "customer_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stamp_sessions_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "merchant_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stamp_sessions_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_redemption: {
        Args: { p_redemption_id: string };
        Returns: undefined;
      };
      approve_stamp_session: {
        Args: { p_session_id: string };
        Returns: undefined;
      };
      current_customer_id: { Args: never; Returns: string };
      current_merchant_id: { Args: never; Returns: string };
      current_merchant_ids: { Args: never; Returns: string[] };
      increment_stamps: {
        Args: { card_id: string; new_status: string };
        Returns: undefined;
      };
      issue_stamp_manual: { Args: { p_card_id: string }; Returns: string };
      void_stamp: { Args: { p_session_id: string }; Returns: undefined };
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

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      country_code: ["NP", "FI"] as const,
      merchant_status: ["pending", "active", "suspended", "rejected"] as const,
      customer_status: ["active", "suspended"] as const,
      reward_status: ["collecting", "pending_otp", "unlocked"] as const,
    },
  },
} as const;
