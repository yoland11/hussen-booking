import Image from "next/image";

import { CopyrightFooter } from "@/components/copyright-footer";
import { InvoicePrintShell } from "@/components/invoice-print-shell";
import { InvoiceToolbar } from "@/components/invoice-toolbar";
import { BRAND_NAME } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Booking } from "@/types/booking";

import styles from "./invoice-view.module.css";

type InvoiceViewProps = {
  booking: Booking;
  autoPrint?: boolean;
};

export function InvoiceView({ booking, autoPrint = false }: InvoiceViewProps) {
  return (
    <main className={styles.page}>
      <InvoiceToolbar booking={booking} autoPrint={autoPrint} />

      <InvoicePrintShell>
        <section className={styles.invoice}>
          <div className={styles.hero}>
            <div className={styles.logoCluster}>
              <div className={styles.logoCoin}>
                <Image
                  src="/brand/hb-logo.png"
                  alt="شعار حسين بيرام"
                  width={176}
                  height={56}
                  priority
                />
              </div>

              <div className={styles.heroCopy}>
                <h1>{BRAND_NAME}</h1>
                <p>فاتورة حجز جلسة تصوير</p>
              </div>
            </div>
          </div>

          <div className={styles.compactGrid}>
            <article className={styles.card}>
              <h2>بيانات العميل</h2>
              <ul className={styles.detailList}>
                <li>
                  <span>اسم العميل</span>
                  <strong>{booking.customer_name}</strong>
                </li>
                <li>
                  <span>رقم الهاتف</span>
                  <strong dir="ltr">{booking.phone}</strong>
                </li>
                <li>
                  <span>تاريخ الحجز</span>
                  <strong>{formatDate(booking.booking_date)}</strong>
                </li>
              </ul>
            </article>

            <article className={styles.card}>
              <h2>تفاصيل الجلسة</h2>
              <ul className={styles.detailList}>
                <li>
                  <span>نوع الجلسة</span>
                  <strong>{booking.service_type}</strong>
                </li>
                <li>
                  <span>تفاصيل الجلسة</span>
                  <strong>{booking.session_size}</strong>
                </li>
                <li>
                  <span>موقع الجلسة</span>
                  <strong>{booking.location_type}</strong>
                </li>
                <li>
                  <span>الكادر</span>
                  <strong>{booking.staff_gender}</strong>
                </li>
              </ul>

              <div className={styles.inlineFinance}>
                <div>
                  <span>إجمالي الحساب</span>
                  <strong>{formatCurrency(booking.total_amount)}</strong>
                </div>
                <div>
                  <span>الواصل</span>
                  <strong>{formatCurrency(booking.paid_amount)}</strong>
                </div>
                <div>
                  <span>المتبقي</span>
                  <strong>{formatCurrency(booking.remaining_amount)}</strong>
                </div>
                <div>
                  <span>حالة الدفع</span>
                  <strong>{booking.payment_status}</strong>
                </div>
              </div>
            </article>
          </div>

          {booking.extra_details ? (
            <article className={`${styles.wideCard} ${styles.compactSection}`}>
              <h2>تفاصيل إضافية</h2>
              <p>{booking.extra_details}</p>
            </article>
          ) : null}

          {booking.notes ? (
            <article className={`${styles.wideCard} ${styles.compactSection}`}>
              <h2>الملاحظات</h2>
              <p>{booking.notes}</p>
            </article>
          ) : null}

          <CopyrightFooter variant="invoice" />
        </section>
      </InvoicePrintShell>
    </main>
  );
}
