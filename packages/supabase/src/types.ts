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
export type SubscriptionTier = "free" | "starter" | "growth" | "enterprise";
export type MerchantStaffRole = "cashier" | "manager" | "owner";
export type MerchantStaffStatus = "pending" | "active" | "disabled";
export type CustomerStatus = "active" | "suspended";
export type MerchantStatus =
  | "pending"
  | "pending_verification"
  | "active"
  | "suspended"
  | "rejected";
export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";
export type SubscriptionStatus =
  | "free"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";
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
export type NotificationRecipientType = "merchant_staff" | "customer" | "admin";
export type NotificationChannel = "in_app" | "email";
export type NotificationType =
  | "dispute_filed"
  | "dispute_resolved"
  | "dispute_sla_breach"
  | "reward_unlocked"
  | "merchant_approved"
  | "smart_promo";

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
          status_reason: string | null;
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
          status_reason?: string | null;
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
          status_reason?: string | null;
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
      loyalty_card_locations: {
        Row: {
          loyalty_card_id: string;
          location_id: string;
          stamp_allowed: boolean;
          redeem_allowed: boolean;
        };
        Insert: {
          loyalty_card_id: string;
          location_id: string;
          stamp_allowed?: boolean;
          redeem_allowed?: boolean;
        };
        Update: {
          loyalty_card_id?: string;
          location_id?: string;
          stamp_allowed?: boolean;
          redeem_allowed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "loyalty_card_locations_loyalty_card_id_fkey";
            columns: ["loyalty_card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loyalty_card_locations_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "merchant_locations";
            referencedColumns: ["id"];
          },
        ];
      };
      merchants: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          business_address: string | null;
          business_card_image_url: string | null;
          business_name: string;
          category: string;
          country: CountryCode;
          created_at: string;
          email: string;
          id: string;
          logo_url: string | null;
          phone: string | null;
          primary_color: string;
          registration_number: string | null;
          rejection_reason: string | null;
          smart_promo_enabled: boolean;
          smart_promo_threshold: number;
          status: MerchantStatus;
          status_reason: string | null;
          subscription_tier: SubscriptionTier;
          user_id: string;
          verification_status: VerificationStatus;
          verified_at: string | null;
          website_url: string | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          business_address?: string | null;
          business_card_image_url?: string | null;
          business_name: string;
          category: string;
          country: CountryCode;
          created_at?: string;
          email: string;
          id?: string;
          logo_url?: string | null;
          phone?: string | null;
          primary_color?: string;
          registration_number?: string | null;
          rejection_reason?: string | null;
          smart_promo_enabled?: boolean;
          smart_promo_threshold?: number;
          status?: MerchantStatus;
          status_reason?: string | null;
          subscription_tier?: SubscriptionTier;
          user_id: string;
          verification_status?: VerificationStatus;
          verified_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          business_address?: string | null;
          business_card_image_url?: string | null;
          business_name?: string;
          category?: string;
          country?: CountryCode;
          created_at?: string;
          email?: string;
          id?: string;
          logo_url?: string | null;
          phone?: string | null;
          primary_color?: string;
          registration_number?: string | null;
          rejection_reason?: string | null;
          smart_promo_enabled?: boolean;
          smart_promo_threshold?: number;
          status?: MerchantStatus;
          status_reason?: string | null;
          subscription_tier?: SubscriptionTier;
          user_id?: string;
          verification_status?: VerificationStatus;
          verified_at?: string | null;
          website_url?: string | null;
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
          amount_spent: number | null;
          approved_by: string | null;
          created_at: string;
          customer_card_id: string;
          device_info: Json | null;
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
          amount_spent?: number | null;
          approved_by?: string | null;
          created_at?: string;
          customer_card_id: string;
          device_info?: Json | null;
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
          amount_spent?: number | null;
          approved_by?: string | null;
          created_at?: string;
          customer_card_id?: string;
          device_info?: Json | null;
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
      stamp_transactions: {
        Row: {
          amount_spent: number;
          approved_by: string | null;
          customer_card_id: string;
          customer_id: string;
          device_info: Json | null;
          id: string;
          location_id: string | null;
          loyalty_card_id: string;
          merchant_id: string;
          session_token: string;
          stamp_session_id: string;
          stamped_at: string;
        };
        Insert: {
          amount_spent: number;
          approved_by?: string | null;
          customer_card_id: string;
          customer_id: string;
          device_info?: Json | null;
          id?: string;
          location_id?: string | null;
          loyalty_card_id: string;
          merchant_id: string;
          session_token: string;
          stamp_session_id: string;
          stamped_at?: string;
        };
        Update: {
          amount_spent?: number;
          approved_by?: string | null;
          customer_card_id?: string;
          customer_id?: string;
          device_info?: Json | null;
          id?: string;
          location_id?: string | null;
          loyalty_card_id?: string;
          merchant_id?: string;
          session_token?: string;
          stamp_session_id?: string;
          stamped_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stamp_transactions_stamp_session_id_fkey";
            columns: ["stamp_session_id"];
            isOneToOne: true;
            referencedRelation: "stamp_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stamp_transactions_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "merchant_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stamp_transactions_merchant_id_fkey";
            columns: ["merchant_id"];
            isOneToOne: false;
            referencedRelation: "merchants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stamp_transactions_loyalty_card_id_fkey";
            columns: ["loyalty_card_id"];
            isOneToOne: false;
            referencedRelation: "loyalty_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      stamp_disputes: {
        Row: {
          amount_claimed: number;
          created_at: string;
          currency_code: string;
          customer_card_id: string;
          customer_id: string;
          description: string;
          id: string;
          merchant_id: string;
          merchant_response: string | null;
          resolved_at: string | null;
          sla_alerted_at: string | null;
          stamp_session_id: string | null;
          status: string;
          visit_date: string;
        };
        Insert: {
          amount_claimed: number;
          created_at?: string;
          currency_code?: string;
          customer_card_id: string;
          customer_id: string;
          description: string;
          id?: string;
          merchant_id: string;
          merchant_response?: string | null;
          resolved_at?: string | null;
          sla_alerted_at?: string | null;
          stamp_session_id?: string | null;
          status?: string;
          visit_date: string;
        };
        Update: {
          amount_claimed?: number;
          created_at?: string;
          currency_code?: string;
          customer_card_id?: string;
          customer_id?: string;
          description?: string;
          id?: string;
          merchant_id?: string;
          merchant_response?: string | null;
          resolved_at?: string | null;
          sla_alerted_at?: string | null;
          stamp_session_id?: string | null;
          status?: string;
          visit_date?: string;
        };
        Relationships: [];
      };
      merchant_customer_notes: {
        Row: {
          customer_id: string;
          id: string;
          merchant_id: string;
          note: string;
          updated_at: string;
        };
        Insert: {
          customer_id: string;
          id?: string;
          merchant_id: string;
          note?: string;
          updated_at?: string;
        };
        Update: {
          customer_id?: string;
          id?: string;
          merchant_id?: string;
          note?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      merchant_staff: {
        Row: {
          id: string;
          merchant_id: string;
          user_id: string | null;
          invited_email: string;
          display_name: string | null;
          role: MerchantStaffRole;
          status: MerchantStaffStatus;
          pin_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          user_id?: string | null;
          invited_email: string;
          display_name?: string | null;
          role?: MerchantStaffRole;
          status?: MerchantStaffStatus;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          user_id?: string | null;
          invited_email?: string;
          display_name?: string | null;
          role?: MerchantStaffRole;
          status?: MerchantStaffStatus;
          pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      merchant_subscriptions: {
        Row: {
          id: string;
          merchant_id: string;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          payment_provider: "esewa" | "khalti" | null;
          provider_customer_id: string | null;
          terms_accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          payment_provider?: "esewa" | "khalti" | null;
          provider_customer_id?: string | null;
          terms_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          trial_ends_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          payment_provider?: "esewa" | "khalti" | null;
          provider_customer_id?: string | null;
          terms_accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      merchant_invoices: {
        Row: {
          id: string;
          merchant_id: string;
          subscription_id: string | null;
          amount_npr: number;
          tier: SubscriptionTier;
          status: "pending" | "paid" | "failed" | "refunded";
          provider: "esewa" | "khalti" | null;
          provider_reference: string | null;
          invoice_period_start: string | null;
          invoice_period_end: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          subscription_id?: string | null;
          amount_npr: number;
          tier: SubscriptionTier;
          status?: "pending" | "paid" | "failed" | "refunded";
          provider?: "esewa" | "khalti" | null;
          provider_reference?: string | null;
          invoice_period_start?: string | null;
          invoice_period_end?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          subscription_id?: string | null;
          amount_npr?: number;
          tier?: SubscriptionTier;
          status?: "pending" | "paid" | "failed" | "refunded";
          provider?: "esewa" | "khalti" | null;
          provider_reference?: string | null;
          invoice_period_start?: string | null;
          invoice_period_end?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      merchant_verification_documents: {
        Row: {
          id: string;
          merchant_id: string;
          document_type: "registration" | "pan" | "business_license" | "other";
          file_url: string;
          status: "pending" | "approved" | "rejected";
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          document_type: "registration" | "pan" | "business_license" | "other";
          file_url: string;
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          document_type?: "registration" | "pan" | "business_license" | "other";
          file_url?: string;
          status?: "pending" | "approved" | "rejected";
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      smart_promo_notifications: {
        Row: {
          id: string;
          merchant_id: string;
          customer_id: string;
          customer_card_id: string;
          reward_cycle_key: string;
          stamps_remaining: number;
          sent_at: string;
        };
        Insert: {
          id?: string;
          merchant_id: string;
          customer_id: string;
          customer_card_id: string;
          reward_cycle_key: string;
          stamps_remaining: number;
          sent_at?: string;
        };
        Update: {
          id?: string;
          merchant_id?: string;
          customer_id?: string;
          customer_card_id?: string;
          reward_cycle_key?: string;
          stamps_remaining?: number;
          sent_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_type: NotificationRecipientType;
          recipient_id: string;
          type: NotificationType;
          title_key: string;
          body_key: string;
          payload: Record<string, unknown>;
          channel: NotificationChannel;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_type: NotificationRecipientType;
          recipient_id: string;
          type: NotificationType;
          title_key: string;
          body_key: string;
          payload?: Record<string, unknown>;
          channel?: NotificationChannel;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_type?: NotificationRecipientType;
          recipient_id?: string;
          type?: NotificationType;
          title_key?: string;
          body_key?: string;
          payload?: Record<string, unknown>;
          channel?: NotificationChannel;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
        Args: {
          p_session_id: string;
          p_amount_spent: number;
          p_approved_by?: string | null;
        };
        Returns: undefined;
      };
      current_customer_id: { Args: never; Returns: string };
      current_merchant_id: { Args: never; Returns: string };
      current_merchant_ids: { Args: never; Returns: string[] };
      merchant_role_for: {
        Args: { p_merchant_id: string };
        Returns: MerchantStaffRole;
      };
      increment_stamps: {
        Args: { card_id: string; new_status: string };
        Returns: undefined;
      };
      issue_stamp_manual: { Args: { p_card_id: string }; Returns: string };
      resolve_stamp_dispute: {
        Args: {
          p_dispute_id: string;
          p_status: string;
          p_response?: string | null;
          p_issue_stamp?: boolean;
        };
        Returns: string;
      };
      void_stamp: { Args: { p_session_id: string }; Returns: undefined };
      process_dispute_sla_breach_notifications: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
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
