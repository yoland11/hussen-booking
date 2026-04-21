import type { Booking, BookingFilter } from "@/types/booking";

export const BRAND_NAME = "حسين بيرام";
export const BRAND_SUBTITLE = "نظام حجوزات الجلسات التصويرية";
export const SESSION_SECRET_MIN_LENGTH = 32;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MINUTES = 15;
export const LOGIN_LOCK_MINUTES = 15;
export const SESSION_COOKIE_NAME = "hb_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const FILTER_OPTIONS: Array<{ value: BookingFilter; label: string }> = [
  { value: "all", label: "كل الحجوزات" },
  { value: "today", label: "اليوم" },
  { value: "upcoming", label: "القادمة" },
  { value: "month", label: "هذا الشهر" },
];

export type BookingFormState = {
  customer_name: string;
  phone: string;
  booking_date: string;
  service_type: string;
  session_size: string;
  location_type: string;
  staff_gender: string;
  extra_details: string;
  total_amount: string;
  paid_amount: string;
  payment_status: string;
  notes: string;
};

export const EMPTY_BOOKING_FORM: BookingFormState = {
  customer_name: "",
  phone: "",
  booking_date: new Date().toISOString().slice(0, 10),
  service_type: "جلسة",
  session_size: "٣٠ / ٤٠",
  location_type: "داخلي",
  staff_gender: "رجالي",
  extra_details: "",
  total_amount: "0",
  paid_amount: "0",
  payment_status: "غير واصل",
  notes: "",
};

export function isTodayBooking(booking: Pick<Booking, "booking_date">) {
  return booking.booking_date === new Date().toISOString().slice(0, 10);
}
