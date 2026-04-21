import { z } from "zod";

import {
  LOCATION_TYPES,
  PAYMENT_STATUSES,
  SERVICE_TYPES,
  STAFF_GENDERS,
} from "@/types/booking";

const optionalString = (max: number, message: string) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) return "";
      if (typeof value === "string") return value.trim();
      return value;
    },
    z.string().max(max, message),
  );

export const loginSchema = z.object({
  pin: z
    .string()
    .trim()
    .regex(/^\d{4,8}$/, "يجب إدخال رمز PIN مكوّن من ٤ إلى ٨ أرقام."),
});

export const bookingPayloadSchema = z
  .object({
    customer_name: z.string().trim().min(2, "اسم العميل مطلوب.").max(120),

    phone: z.string().trim().min(7, "رقم الهاتف مطلوب.").max(25),

    booking_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ الحجز غير صالح."),

    service_type: z.enum(SERVICE_TYPES),

    session_size: z
      .string()
      .trim()
      .min(1, "تفاصيل الجلسة مطلوبة.")
      .max(80),

    location_type: z.enum(LOCATION_TYPES),

    staff_gender: z.enum(STAFF_GENDERS),

    extra_details: optionalString(600, "تفاصيل الجلسة طويلة جداً."),

    total_amount: z.number().finite().nonnegative(),

    paid_amount: z.number().finite().nonnegative(),

    payment_status: z.enum(PAYMENT_STATUSES),

    notes: optionalString(1200, "الملاحظات طويلة جداً."),
  })
  .refine((value) => value.paid_amount <= value.total_amount, {
    message: "المبلغ الواصل لا يمكن أن يكون أكبر من إجمالي الحساب.",
    path: ["paid_amount"],
  });