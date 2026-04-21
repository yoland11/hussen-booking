import type { Booking, PaymentStatus } from "@/types/booking";

const arabicDateFormatter = new Intl.DateTimeFormat("ar-IQ", {
  dateStyle: "long",
});

const arabicDateTimeFormatter = new Intl.DateTimeFormat("ar-IQ", {
  dateStyle: "medium",
  timeStyle: "short",
});

const moneyFormatter = new Intl.NumberFormat("ar-IQ", {
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return `${moneyFormatter.format(value)} د.ع`;
}

export function formatDate(value: string) {
  return arabicDateFormatter.format(new Date(value));
}

export function formatDateTime(value: string) {
  return arabicDateTimeFormatter.format(new Date(value));
}

export function calculateRemaining(total: number, paid: number) {
  return Math.max(total - paid, 0);
}

export function resolvePaymentStatus(total: number, paid: number): PaymentStatus {
  if (paid <= 0) {
    return "غير واصل";
  }

  if (calculateRemaining(total, paid) === 0) {
    return "واصل";
  }

  return "جزئي";
}

export function createInvoiceNumber(booking: Pick<Booking, "id" | "created_at">) {
  const dateToken = booking.created_at.slice(0, 10).replaceAll("-", "");
  const shortId = booking.id.replaceAll("-", "").slice(0, 8).toUpperCase();
  return `HB-${dateToken}-${shortId}`;
}

export function buildInvoiceShareText(booking: Booking) {
  return [
    `فاتورة ${createInvoiceNumber(booking)}`,
    `الاستوديو: حسين بيرام`,
    `العميل: ${booking.customer_name}`,
    `الهاتف: ${booking.phone}`,
    `تاريخ الحجز: ${formatDate(booking.booking_date)}`,
    `نوع الجلسة: ${booking.service_type}`,
    `موقع الجلسة: ${booking.location_type}`,
    `الكادر: ${booking.staff_gender}`,
    `إجمالي الحساب: ${formatCurrency(booking.total_amount)}`,
    `المبلغ الواصل: ${formatCurrency(booking.paid_amount)}`,
    `المتبقي: ${formatCurrency(booking.remaining_amount)}`,
    `حالة الدفع: ${booking.payment_status}`,
    booking.notes ? `ملاحظات: ${booking.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function getPaymentStatusTone(status: PaymentStatus) {
  switch (status) {
    case "واصل":
      return "success";
    case "جزئي":
      return "warning";
    default:
      return "danger";
  }
}
