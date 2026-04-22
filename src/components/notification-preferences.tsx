"use client";

import { useEffect, useState, useTransition } from "react";

import type { Booking } from "@/types/booking";

import styles from "./notification-preferences.module.css";

type NotificationPreferencesProps = {
  bookings: Booking[];
};

type ChannelMode = "native" | "web" | "unsupported";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(normalized);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

async function registerBookingWorker() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

export function NotificationPreferences({ bookings }: NotificationPreferencesProps) {
  const [mode, setMode] = useState<ChannelMode>("unsupported");
  const [enabled, setEnabled] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<string>("default");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    const initialize = async () => {
      const nativeBridge = window.NativeBridge;

      if (nativeBridge?.requestNotificationPermission) {
        if (cancelled) {
          return;
        }

        const active = nativeBridge.areNotificationsEnabled?.() ?? false;
        setMode("native");
        setEnabled(active);
        setPermissionState(active ? "granted" : "default");
        return;
      }

      if (
        "Notification" in window &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        window.isSecureContext
      ) {
        setMode("web");
        setPermissionState(Notification.permission);

        try {
          const registration = await registerBookingWorker();
          const subscription = await registration.pushManager.getSubscription();

          if (cancelled) {
            return;
          }

          if (subscription) {
            await fetch("/api/notifications/subscribe", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(subscription.toJSON()),
            });
          }

          setEnabled(Boolean(subscription));
        } catch {
          if (!cancelled) {
            setFeedback("تعذر تهيئة إشعارات النظام داخل هذا المتصفح.");
          }
        }
      }
    };

    const frameId = window.requestAnimationFrame(() => {
      void initialize();
    });

    const handleNativeEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ enabled?: boolean }>).detail;
      const nextEnabled = Boolean(detail?.enabled);
      setEnabled(nextEnabled);
      setPermissionState(nextEnabled ? "granted" : "default");
    };

    window.addEventListener(
      "hb-native-notifications-changed",
      handleNativeEvent as EventListener,
    );

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      window.removeEventListener(
        "hb-native-notifications-changed",
        handleNativeEvent as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    if (mode !== "native" || !enabled || !window.NativeBridge?.syncBookingNotifications) {
      return;
    }

    const compactBookings = bookings.map((booking) => ({
      id: booking.id,
      customer_name: booking.customer_name,
      booking_date: booking.booking_date,
      service_type: booking.service_type ?? "",
    }));

    window.NativeBridge.syncBookingNotifications(JSON.stringify(compactBookings));
  }, [bookings, enabled, mode]);

  async function enableWebNotifications() {
    if (!VAPID_PUBLIC_KEY) {
      setFeedback("مفاتيح Web Push غير مهيأة بعد داخل إعدادات البيئة.");
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionState(permission);

    if (permission !== "granted") {
      setFeedback("تم رفض الإذن. يمكنك تفعيل الإشعارات لاحقًا من إعدادات المتصفح.");
      return;
    }

    const registration = await registerBookingWorker();
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription.toJSON()),
    });

    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      throw new Error(payload?.message || "تعذر تفعيل إشعارات الويب.");
    }

    setEnabled(true);
    setFeedback(payload?.message || "تم تفعيل إشعارات الحجوزات.");
  }

  async function disableWebNotifications() {
    const registration = await registerBookingWorker();
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await fetch("/api/notifications/subscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();
    }

    setEnabled(false);
    setFeedback("تم إيقاف إشعارات الحجوزات على هذا المتصفح.");
  }

  function enableNativeNotifications() {
    window.NativeBridge?.requestNotificationPermission?.();

    window.setTimeout(() => {
      const nextEnabled = window.NativeBridge?.areNotificationsEnabled?.() ?? false;
      setEnabled(nextEnabled);
      setPermissionState(nextEnabled ? "granted" : "default");

      if (nextEnabled) {
        setFeedback("تم تفعيل إشعارات التطبيق على هذا الجهاز.");
      }
    }, 900);
  }

  function disableNativeNotifications() {
    window.NativeBridge?.clearScheduledNotifications?.();
    setEnabled(false);
    setPermissionState("default");
    setFeedback("تم إيقاف الإشعارات المحلية على هذا الجهاز.");
  }

  function handleToggle() {
    setFeedback(null);

    startTransition(async () => {
      try {
        if (enabled) {
          if (mode === "native") {
            disableNativeNotifications();
            return;
          }

          if (mode === "web") {
            await disableWebNotifications();
            return;
          }

          return;
        }

        if (mode === "native") {
          enableNativeNotifications();
          return;
        }

        if (mode === "web") {
          await enableWebNotifications();
          return;
        }

        setFeedback("هذا الجهاز لا يدعم إشعارات النظام من هذه الواجهة.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "تعذر تحديث حالة الإشعارات.");
      }
    });
  }

  const statusText =
    mode === "unsupported"
      ? "غير مدعومة على هذا الجهاز"
      : enabled
        ? "مفعلة"
        : permissionState === "denied"
          ? "مرفوضة من النظام"
          : "غير مفعلة";

  return (
    <section className={styles.panel}>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>إشعارات النظام</span>
        <h3>تذكيرات حقيقية خارج الصفحة</h3>
        <p>
          فعّل الإشعارات ليصلك تنبيه عند جلسات اليوم وتذكير مسبق للجلسات القريبة، مع
          فتح لوحة الحجوزات مباشرة عند الضغط على الإشعار.
        </p>
      </div>

      <div className={styles.actions}>
        <span
          className={`${styles.status} ${
            enabled ? styles.statusEnabled : mode === "unsupported" ? styles.statusMuted : styles.statusIdle
          }`}
        >
          {statusText}
        </span>

        <button
          type="button"
          className={styles.toggleButton}
          onClick={handleToggle}
          disabled={isPending || mode === "unsupported"}
        >
          {isPending
            ? "جارٍ التحديث..."
            : enabled
              ? "إيقاف الإشعارات"
              : "تفعيل الإشعارات"}
        </button>
      </div>

      {feedback ? <p className={styles.feedback}>{feedback}</p> : null}
    </section>
  );
}
