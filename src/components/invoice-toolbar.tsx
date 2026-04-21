"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buildInvoiceShareText } from "@/lib/format";
import type { Booking } from "@/types/booking";

import styles from "./invoice-view.module.css";

type InvoiceToolbarProps = {
  booking: Booking;
  autoPrint?: boolean;
};

export function InvoiceToolbar({ booking, autoPrint = false }: InvoiceToolbarProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (autoPrint) {
      const timer = window.setTimeout(() => {
        if (window.NativeBridge?.printCurrentPage) {
          window.NativeBridge.printCurrentPage();
          return;
        }

        window.print();
      }, 350);
      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [autoPrint]);

  async function handleShare() {
    const text = buildInvoiceShareText(booking);

    if (navigator.share) {
      await navigator.share({
        title: "فاتورة حسين بيرام",
        text,
      });
      return;
    }

    if (window.NativeBridge?.shareText) {
      window.NativeBridge.shareText("فاتورة حسين بيرام", text);
      return;
    }

    await navigator.clipboard.writeText(text);
    setFeedback("تم نسخ نص الفاتورة إلى الحافظة.");
    window.setTimeout(() => setFeedback(null), 2800);
  }

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarActions}>
        <Link href="/dashboard" className={styles.toolbarButton}>
          العودة للوحة
        </Link>
        <button
          type="button"
          className={styles.toolbarButton}
          onClick={() => {
            if (window.NativeBridge?.printCurrentPage) {
              window.NativeBridge.printCurrentPage();
              return;
            }

            window.print();
          }}
        >
          طباعة PDF
        </button>
        <button type="button" className={styles.toolbarButton} onClick={handleShare}>
          مشاركة الفاتورة
        </button>
      </div>

      {feedback ? <p className={styles.toolbarHint}>{feedback}</p> : null}
    </div>
  );
}
