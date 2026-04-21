"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { BrandHeader } from "@/components/brand-header";
import { CopyrightFooter } from "@/components/copyright-footer";
import {
  EMPTY_BOOKING_FORM,
  FILTER_OPTIONS,
  isTodayBooking,
  type BookingFormState,
} from "@/lib/constants";
import {
  createInvoiceNumber,
  formatCurrency,
  formatDate,
  formatDateTime,
  getPaymentStatusTone,
  resolvePaymentStatus,
} from "@/lib/format";
import type { Booking, BookingFilter, BookingPayload } from "@/types/booking";

import styles from "./dashboard-client.module.css";

type DashboardClientProps = {
  initialBookings: Booking[];
};

type FeedbackState = {
  message: string;
  tone: "success" | "error" | "info";
} | null;

type FormState = BookingFormState;

function toFormState(booking: Booking): FormState {
  return {
    customer_name: booking.customer_name,
    phone: booking.phone,
    booking_date: booking.booking_date,
    service_type: booking.service_type,
    session_size: booking.session_size,
    location_type: booking.location_type,
    staff_gender: booking.staff_gender,
    extra_details: booking.extra_details ?? "",
    total_amount: String(booking.total_amount),
    paid_amount: String(booking.paid_amount),
    payment_status: booking.payment_status,
    notes: booking.notes ?? "",
  };
}

function filterBookings(bookings: Booking[], query: string, activeFilter: BookingFilter) {
  const normalizedQuery = query.trim().toLowerCase();
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  return bookings.filter((booking) => {
    const matchesQuery =
      !normalizedQuery ||
      booking.customer_name.toLowerCase().includes(normalizedQuery) ||
      booking.phone.toLowerCase().includes(normalizedQuery);

    if (!matchesQuery) {
      return false;
    }

    if (activeFilter === "today") {
      return booking.booking_date === today;
    }

    if (activeFilter === "upcoming") {
      return booking.booking_date >= today;
    }

    if (activeFilter === "month") {
      return booking.booking_date.startsWith(monthPrefix);
    }

    return true;
  });
}

function getStats(bookings: Booking[]) {
  const today = new Date().toISOString().slice(0, 10);

  return {
    totalBookings: bookings.length,
    todayBookings: bookings.filter((booking) => booking.booking_date === today).length,
    totalPaid: bookings.reduce((sum, booking) => sum + booking.paid_amount, 0),
    totalRemaining: bookings.reduce((sum, booking) => sum + booking.remaining_amount, 0),
  };
}

export function DashboardClient({ initialBookings }: DashboardClientProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<BookingFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_BOOKING_FORM);
  const [feedback, setFeedback] = useState<FeedbackState>({
    message: "تم تحميل الحجوزات من قاعدة البيانات السحابية.",
    tone: "info",
  });
  const [isPending, startTransition] = useTransition();

  const todayBookings = bookings.filter((booking) => isTodayBooking(booking));
  const visibleBookings = filterBookings(bookings, query, activeFilter);
  const stats = getStats(bookings);

  const remainingPreview = Math.max(
    Number(form.total_amount || 0) - Number(form.paid_amount || 0),
    0,
  );

  function updateFormField(name: keyof FormState, value: string) {
    setForm((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "total_amount" || name === "paid_amount") {
        next.payment_status = resolvePaymentStatus(
          Number(next.total_amount || 0),
          Number(next.paid_amount || 0),
        );
      }

      return next;
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      ...EMPTY_BOOKING_FORM,
      booking_date: new Date().toISOString().slice(0, 10),
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const payload: BookingPayload = {
      customer_name: form.customer_name.trim(),
      phone: form.phone.trim(),
      booking_date: form.booking_date,
      service_type: form.service_type as BookingPayload["service_type"],
      session_size: form.session_size.trim(),
      location_type: form.location_type as BookingPayload["location_type"],
      staff_gender: form.staff_gender as BookingPayload["staff_gender"],
      extra_details: form.extra_details.trim() || null,
      total_amount: Number(form.total_amount || 0),
      paid_amount: Number(form.paid_amount || 0),
      payment_status: form.payment_status as BookingPayload["payment_status"],
      notes: form.notes.trim() || null,
    };

    startTransition(async () => {
      const response = await fetch(editingId ? `/api/bookings/${editingId}` : "/api/bookings", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { booking?: Booking; message?: string }
        | null;

      if (!response.ok || !result?.booking) {
        setFeedback({
          tone: "error",
          message: result?.message || "تعذر حفظ الحجز. حاول مرة أخرى.",
        });
        return;
      }

      setBookings((current) => {
        if (editingId) {
          return current.map((booking) => (booking.id === editingId ? result.booking! : booking));
        }

        return [result.booking!, ...current];
      });

      setFeedback({
        tone: "success",
        message: editingId ? "تم تحديث الحجز بنجاح." : "تم حفظ الحجز الجديد بنجاح.",
      });
      resetForm();
    });
  }

  function startEditing(booking: Booking) {
    setEditingId(booking.id);
    setForm(toFormState(booking));
    setFeedback({
      tone: "info",
      message: `أنت الآن تعدل حجز ${booking.customer_name}.`,
    });
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(booking: Booking) {
    const confirmed = window.confirm(`هل تريد حذف حجز ${booking.customer_name} نهائياً؟`);

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: "DELETE",
      });

      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setFeedback({
          tone: "error",
          message: result?.message || "تعذر حذف الحجز حالياً.",
        });
        return;
      }

      setBookings((current) => current.filter((item) => item.id !== booking.id));

      if (editingId === booking.id) {
        resetForm();
      }

      setFeedback({
        tone: "success",
        message: "تم حذف الحجز بنجاح.",
      });
    });
  }

  async function handleLogout() {
    startTransition(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <main className={styles.page}>
      <BrandHeader
        eyebrow="لوحة إدارة الحجوزات"
        actions={
          <button type="button" className={styles.secondaryButton} onClick={handleLogout}>
            تسجيل الخروج
          </button>
        }
        stats={[
          { label: "إجمالي الحجوزات", value: String(stats.totalBookings) },
          { label: "حجوزات اليوم", value: String(stats.todayBookings) },
          { label: "المبالغ الواصلة", value: formatCurrency(stats.totalPaid) },
          { label: "المبالغ المتبقية", value: formatCurrency(stats.totalRemaining) },
        ]}
      />

      {todayBookings.length ? (
        <section className={styles.todayAlerts} aria-label="تنبيهات جلسات اليوم">
          {todayBookings.map((booking) => (
            <div key={booking.id} className={styles.todayBanner}>
              <span className={styles.todayBannerBadge}>اليوم</span>
              <strong>جلسة اليوم: {booking.customer_name}</strong>
            </div>
          ))}
        </section>
      ) : null}

      {feedback ? (
        <div className={`${styles.notice} ${styles[feedback.tone]}`}>{feedback.message}</div>
      ) : null}

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <span className={styles.panelEyebrow}>إدارة الحجز</span>
            <h2>{editingId ? "تعديل الحجز الحالي" : "إضافة حجز جديد"}</h2>
          </div>
          {editingId ? (
            <button type="button" className={styles.ghostButton} onClick={resetForm}>
              إلغاء التعديل
            </button>
          ) : null}
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.sectionCard}>
            <h3>بيانات العميل</h3>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span>اسم العميل</span>
                <input
                  value={form.customer_name}
                  onChange={(event) => updateFormField("customer_name", event.target.value)}
                  placeholder="الاسم الكامل"
                />
              </label>

              <label className={styles.field}>
                <span>رقم الهاتف</span>
                <input
                  dir="ltr"
                  value={form.phone}
                  onChange={(event) => updateFormField("phone", event.target.value)}
                  placeholder="07XX XXX XXXX"
                />
              </label>
            </div>

            <label className={styles.field}>
              <span>تاريخ الحجز</span>
              <input
                type="date"
                value={form.booking_date}
                onChange={(event) => updateFormField("booking_date", event.target.value)}
              />
            </label>
          </div>

          <div className={styles.sectionCard}>
            <h3>نوع الجلسة</h3>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span>نوع الجلسة</span>
                <select
                  value={form.service_type}
                  onChange={(event) => updateFormField("service_type", event.target.value)}
                >
                  <option value="عيد ميلاد">عيد ميلاد</option>
                  <option value="زفاف">زفاف</option>
                  <option value="جلسة">جلسة</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>تفاصيل الجلسة</span>
                <select
                  value={form.session_size}
                  onChange={(event) => updateFormField("session_size", event.target.value)}
                >
                  <option value="٣٠ / ٤٠">٣٠ / ٤٠</option>
                  <option value="٣٠ / ٦٠">٣٠ / ٦٠</option>
                  <option value="مخصص">مخصص</option>
                </select>
              </label>
            </div>

            <label className={styles.field}>
              <span>تفاصيل إضافية</span>
              <textarea
                rows={3}
                value={form.extra_details}
                onChange={(event) => updateFormField("extra_details", event.target.value)}
                placeholder="تفاصيل إضافية عن الجلسة أو المقاس أو المتطلبات الخاصة"
              />
            </label>
          </div>

          <div className={styles.sectionCard}>
            <h3>موقع الجلسة والكادر</h3>
            <div className={styles.gridTwo}>
              <label className={styles.field}>
                <span>موقع الجلسة</span>
                <select
                  value={form.location_type}
                  onChange={(event) => updateFormField("location_type", event.target.value)}
                >
                  <option value="داخلي">داخلي</option>
                  <option value="خارجي">خارجي</option>
                  <option value="قاعة">قاعة</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>الكادر</span>
                <select
                  value={form.staff_gender}
                  onChange={(event) => updateFormField("staff_gender", event.target.value)}
                >
                  <option value="نسائي">نسائي</option>
                  <option value="رجالي">رجالي</option>
                </select>
              </label>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <h3>الحساب</h3>
            <div className={styles.gridThree}>
              <label className={styles.field}>
                <span>إجمالي الحساب</span>
                <input
                  type="number"
                  min="0"
                  value={form.total_amount}
                  onChange={(event) => updateFormField("total_amount", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>المبلغ الواصل</span>
                <input
                  type="number"
                  min="0"
                  value={form.paid_amount}
                  onChange={(event) => updateFormField("paid_amount", event.target.value)}
                />
              </label>

              <div className={styles.remainingCard}>
                <span>المتبقي</span>
                <strong>{formatCurrency(remainingPreview)}</strong>
              </div>
            </div>

            <label className={styles.field}>
              <span>حالة الدفع</span>
              <select
                value={form.payment_status}
                onChange={(event) => updateFormField("payment_status", event.target.value)}
              >
                <option value="واصل">واصل</option>
                <option value="غير واصل">غير واصل</option>
                <option value="جزئي">جزئي</option>
              </select>
            </label>
          </div>

          <div className={styles.sectionCard}>
            <h3>الملاحظات</h3>
            <label className={styles.field}>
              <span>ملاحظات إضافية</span>
              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) => updateFormField("notes", event.target.value)}
                placeholder="أي تعليمات أو ملاحظات داخلية تخص الحجز"
              />
            </label>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton} disabled={isPending}>
              {isPending ? "جارٍ الحفظ..." : editingId ? "تحديث الحجز" : "حفظ الحجز"}
            </button>
            <button type="button" className={styles.ghostButton} onClick={resetForm}>
              تفريغ الحقول
            </button>
          </div>
        </form>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <span className={styles.panelEyebrow}>البحث والفلترة</span>
            <h2>قائمة الحجوزات</h2>
            <p>ابحث باسم العميل أو رقم الهاتف، وفلتر حسب التاريخ بسرعة.</p>
          </div>
          <div className={styles.resultCount}>
            يعرض {visibleBookings.length} من أصل {bookings.length}
          </div>
        </div>

        <div className={styles.filterBar}>
          <label className={styles.field}>
            <span>بحث بالاسم أو الهاتف</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="مثال: أحمد أو 077..."
            />
          </label>

          <label className={styles.field}>
            <span>فلترة التاريخ</span>
            <select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value as BookingFilter)}>
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className={styles.ghostButton} onClick={() => {
            setQuery("");
            setActiveFilter("all");
          }}>
            مسح الفلاتر
          </button>
        </div>

        <div className={styles.cardList}>
          {visibleBookings.length ? (
            visibleBookings.map((booking) => {
              const tone = getPaymentStatusTone(booking.payment_status);

              return (
                <article
                  key={booking.id}
                  className={`${styles.bookingCard} ${isTodayBooking(booking) ? styles.todayCard : ""}`}
                >
                  <div className={styles.cardHead}>
                    <div>
                      <div className={styles.titleRow}>
                        <h3>{booking.customer_name}</h3>
                        {isTodayBooking(booking) ? <span className={styles.todayPill}>حجز اليوم</span> : null}
                      </div>
                      <p className={styles.meta}>
                        <span>{booking.phone}</span>
                        <span>{formatDate(booking.booking_date)}</span>
                        <span>{createInvoiceNumber(booking)}</span>
                      </p>
                    </div>

                    <span className={`${styles.statusBadge} ${styles[tone]}`}>{booking.payment_status}</span>
                  </div>

                  <div className={styles.tags}>
                    <span>{booking.service_type}</span>
                    <span>{booking.session_size}</span>
                    <span>{booking.location_type}</span>
                    <span>{booking.staff_gender}</span>
                  </div>

                  {booking.extra_details ? (
                    <p className={styles.detailsText}>{booking.extra_details}</p>
                  ) : null}

                  <div className={styles.financeGrid}>
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
                  </div>

                  {booking.notes ? <p className={styles.notes}>{booking.notes}</p> : null}

                  <div className={styles.timestamps}>
                    <span>أضيف: {formatDateTime(booking.created_at)}</span>
                    <span>آخر تحديث: {formatDateTime(booking.updated_at)}</span>
                  </div>

                  <div className={styles.actions}>
                    <button type="button" className={styles.secondaryButton} onClick={() => startEditing(booking)}>
                      تعديل الحجز
                    </button>
                    <Link href={`/dashboard/invoices/${booking.id}`} target="_blank" className={styles.secondaryButton}>
                      معاينة الفاتورة
                    </Link>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => window.open(`/dashboard/invoices/${booking.id}?print=1`, "_blank", "noopener,noreferrer")}
                    >
                      طباعة PDF
                    </button>
                    <button type="button" className={styles.dangerButton} onClick={() => handleDelete(booking)}>
                      حذف
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className={styles.emptyState}>
              <h3>لا توجد نتائج مطابقة</h3>
              <p>جرّب تعديل البحث أو الفلترة، أو أضف حجزًا جديدًا من النموذج أعلاه.</p>
            </div>
          )}
        </div>
      </section>

      <CopyrightFooter />
    </main>
  );
}
