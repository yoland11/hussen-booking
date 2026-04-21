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
      bookings: {
        Row: {
          booking_date: string;
          created_at: string;
          customer_name: string;
          extra_details: string | null;
          id: string;
          location_type: LocationType;
          notes: string | null;
          paid_amount: number | string;
          payment_status: PaymentStatus;
          phone: string;
          remaining_amount: number | string;
          service_type: ServiceType;
          session_size: string;
          staff_gender: StaffGender;
          total_amount: number | string;
          updated_at: string;
        };
        Insert: {
          booking_date: string;
          created_at?: string;
          customer_name: string;
          extra_details?: string | null;
          id?: string;
          location_type: LocationType;
          notes?: string | null;
          paid_amount: number;
          payment_status: PaymentStatus;
          phone: string;
          service_type: ServiceType;
          session_size: string;
          staff_gender: StaffGender;
          total_amount: number;
          updated_at?: string;
        };
        Update: {
          booking_date?: string;
          created_at?: string;
          customer_name?: string;
          extra_details?: string | null;
          id?: string;
          location_type?: LocationType;
          notes?: string | null;
          paid_amount?: number;
          payment_status?: PaymentStatus;
          phone?: string;
          service_type?: ServiceType;
          session_size?: string;
          staff_gender?: StaffGender;
          total_amount?: number;
          updated_at?: string;
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
