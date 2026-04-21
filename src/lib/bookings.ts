import "server-only";

import { notFound } from "next/navigation";

import { resolvePaymentStatus } from "@/lib/format";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { Booking, BookingPayload } from "@/types/booking";
import type { Database } from "@/types/database";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

function toNumber(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function normalizeBooking(row: BookingRow): Booking {
  return {
    ...row,
    total_amount: toNumber(row.total_amount),
    paid_amount: toNumber(row.paid_amount),
    remaining_amount: toNumber(row.remaining_amount),
  };
}

function serializePayload(payload: BookingPayload) {
  return {
    ...payload,
    payment_status: resolvePaymentStatus(payload.total_amount, payload.paid_amount),
  };
}

export async function getBookings() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("booking_date", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeBooking);
}

export async function getBookingById(id: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return normalizeBooking(data);
}

export async function getBookingOrThrow(id: string) {
  const booking = await getBookingById(id);

  if (!booking) {
    notFound();
  }

  return booking;
}

export async function createBooking(payload: BookingPayload) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .insert(serializePayload(payload))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeBooking(data);
}

export async function updateBooking(id: string, payload: BookingPayload) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .update(serializePayload(payload))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return normalizeBooking(data);
}

export async function deleteBooking(id: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
