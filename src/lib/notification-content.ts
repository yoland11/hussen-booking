import { formatDate, formatOptionalText } from "@/lib/format";
import type { Booking } from "@/types/booking";

type ReminderKind = "today" | "tomorrow";

const baghdadDatePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Baghdad",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toDateToken(date: Date) {
  const parts = baghdadDatePartsFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function getReminderDateTokens(now = new Date()) {
  const today = toDateToken(now);
  const tomorrow = toDateToken(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  return { today, tomorrow };
}

export function buildReminderNotification(booking: Booking, kind: ReminderKind) {
  const title = kind === "today" ? "موعد جلسة اليوم" : "تذكير بجلسة قريبة";
  const lead = kind === "today" ? "موعد الجلسة اليوم." : "موعد الجلسة غدًا.";
  const service = formatOptionalText(booking.service_type, "جلسة تصوير");
  const dateText = formatDate(booking.booking_date);
  const body = `${lead} العميل: ${booking.customer_name} | ${service} | ${dateText} | الوقت غير محدد`;

  return {
    title,
    body,
    url: "/dashboard",
    tag: `booking-${booking.id}-${kind}`,
  };
}

export type { ReminderKind };
