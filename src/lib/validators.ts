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

const nullableString = (max: number, message: string) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
      }
      return value;
    },
    z.string().max(max, message).nullable(),
  );

const nullableEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
      }
      return value;
    },
    z.enum(values).nullable(),
  );

const optionalAmount = () =>
  z.preprocess(
    (value) => {
      if (value === null || value === undefined || value === "") return 0;
      if (typeof value === "string") return Number(value);
      return value;
    },
    z.number().finite().nonnegative(),
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

    service_type: nullableEnum(SERVICE_TYPES),

    session_size: nullableString(80, "تفاصيل الجلسة طويلة جداً."),

    location_type: nullableEnum(LOCATION_TYPES),

    staff_gender: nullableEnum(STAFF_GENDERS),

    extra_details: optionalString(600, "تفاصيل الجلسة طويلة جداً."),

    total_amount: optionalAmount(),

    paid_amount: optionalAmount(),

    payment_status: nullableEnum(PAYMENT_STATUSES),

    notes: optionalString(1200, "الملاحظات طويلة جداً."),
  })
  .refine((value) => value.paid_amount <= value.total_amount, {
    message: "المبلغ الواصل لا يمكن أن يكون أكبر من إجمالي الحساب.",
    path: ["paid_amount"],
  });
