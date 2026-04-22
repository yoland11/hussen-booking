import type { PaymentStatus, StaffGender, LocationType, ServiceType } from "@/types/booking";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      admin_login_rate_limits: {
        Row: {
          attempts: number;
          identifier: string;
          locked_until: string | null;
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          identifier: string;
          locked_until?: string | null;
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          identifier?: string;
          locked_until?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_deliveries: {
        Row: {
          booking_id: string;
          channel: "web_push";
          created_at: string;
          id: string;
          push_subscription_id: string;
          reminder_kind: "today" | "tomorrow";
        };
        Insert: {
          booking_id: string;
          channel?: "web_push";
          created_at?: string;
          id?: string;
          push_subscription_id: string;
          reminder_kind: "today" | "tomorrow";
        };
        Update: {
          booking_id?: string;
          channel?: "web_push";
          created_at?: string;
          id?: string;
          push_subscription_id?: string;
          reminder_kind?: "today" | "tomorrow";
        };
        Relationships: [];
      };
      bookings: {
        Row: {
          booking_date: string;
          created_at: string;
          customer_name: string;
          extra_details: string | null;
          id: string;
          location_type: LocationType | null;
          notes: string | null;
          paid_amount: number | string;
          payment_status: PaymentStatus | null;
          phone: string;
          remaining_amount: number | string;
          service_type: ServiceType | null;
          session_size: string | null;
          staff_gender: StaffGender | null;
          total_amount: number | string;
          updated_at: string;
        };
        Insert: {
          booking_date: string;
          created_at?: string;
          customer_name: string;
          extra_details?: string | null;
          id?: string;
          location_type?: LocationType | null;
          notes?: string | null;
          paid_amount: number;
          payment_status?: PaymentStatus | null;
          phone: string;
          service_type?: ServiceType | null;
          session_size?: string | null;
          staff_gender?: StaffGender | null;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          booking_date?: string;
          created_at?: string;
          customer_name?: string;
          extra_details?: string | null;
          id?: string;
          location_type?: LocationType | null;
          notes?: string | null;
          paid_amount?: number;
          payment_status?: PaymentStatus | null;
          phone?: string;
          service_type?: ServiceType | null;
          session_size?: string | null;
          staff_gender?: StaffGender | null;
          total_amount?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          p256dh: string;
          updated_at: string;
          user_agent: string | null;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          p256dh: string;
          updated_at?: string;
          user_agent?: string | null;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          updated_at?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
