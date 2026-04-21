export const SERVICE_TYPES = ["عيد ميلاد", "زفاف", "جلسة"] as const;
export const LOCATION_TYPES = ["داخلي", "خارجي", "قاعة"] as const;
export const STAFF_GENDERS = ["نسائي", "رجالي"] as const;
export const PAYMENT_STATUSES = ["واصل", "غير واصل", "جزئي"] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];
export type LocationType = (typeof LOCATION_TYPES)[number];
export type StaffGender = (typeof STAFF_GENDERS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type Booking = {
  id: string;
  customer_name: string;
  phone: string;
  booking_date: string;
  service_type: ServiceType | null;
  session_size: string | null;
  location_type: LocationType | null;
  staff_gender: StaffGender | null;
  extra_details: string | null;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: PaymentStatus | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingPayload = Omit<
  Booking,
  "id" | "remaining_amount" | "created_at" | "updated_at"
>;

export type BookingFilter = "all" | "today" | "upcoming" | "month";
