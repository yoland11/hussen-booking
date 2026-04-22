import "server-only";

import webpush from "web-push";

import { getBookings } from "@/lib/bookings";
import {
  buildReminderNotification,
  getReminderDateTokens,
  type ReminderKind,
} from "@/lib/notification-content";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type PushSubscriptionInput = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

let configuredPublicKey: string | null = null;

function getWebPushConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

function ensureWebPushConfigured() {
  const config = getWebPushConfig();

  if (!config) {
    return null;
  }

  if (configuredPublicKey !== config.publicKey) {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    configuredPublicKey = config.publicKey;
  }

  return config;
}

function deliveryKey(bookingId: string, subscriptionId: string, reminderKind: ReminderKind) {
  return `${bookingId}:${subscriptionId}:${reminderKind}:web_push`;
}

export function getWebPushPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

export function isWebPushConfigured() {
  return Boolean(getWebPushConfig());
}

export async function upsertPushSubscription(
  subscription: PushSubscriptionInput,
  userAgent: string | null,
) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent,
      },
      {
        onConflict: "endpoint",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function removePushSubscription(endpoint: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendDueReminderPushes(now = new Date()) {
  if (!ensureWebPushConfigured()) {
    return {
      sent: 0,
      skipped: 0,
      removed: 0,
      errors: 0,
      bookings: 0,
      message: "إعدادات Web Push غير مكتملة.",
    };
  }

  const [bookings, subscriptionsResult] = await Promise.all([
    getBookings(),
    getSupabaseAdmin().from("push_subscriptions").select("*"),
  ]);

  if (subscriptionsResult.error) {
    throw new Error(subscriptionsResult.error.message);
  }

  const subscriptions = subscriptionsResult.data ?? [];

  if (!subscriptions.length) {
    return {
      sent: 0,
      skipped: 0,
      removed: 0,
      errors: 0,
      bookings: 0,
      message: "لا توجد اشتراكات Push محفوظة.",
    };
  }

  const { today, tomorrow } = getReminderDateTokens(now);
  const dueBookings = bookings.filter(
    (booking) => booking.booking_date === today || booking.booking_date === tomorrow,
  );

  if (!dueBookings.length) {
    return {
      sent: 0,
      skipped: 0,
      removed: 0,
      errors: 0,
      bookings: 0,
      message: "لا توجد جلسات تستحق إشعارًا الآن.",
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: deliveries, error: deliveriesError } = await supabase
    .from("notification_deliveries")
    .select("booking_id, push_subscription_id, reminder_kind, channel")
    .in(
      "booking_id",
      dueBookings.map((booking) => booking.id),
    )
    .eq("channel", "web_push");

  if (deliveriesError) {
    throw new Error(deliveriesError.message);
  }

  const delivered = new Set(
    (deliveries ?? []).map((item) =>
      deliveryKey(item.booking_id, item.push_subscription_id, item.reminder_kind),
    ),
  );

  let sent = 0;
  let skipped = 0;
  let removed = 0;
  let errors = 0;

  for (const booking of dueBookings) {
    const reminderKind: ReminderKind = booking.booking_date === today ? "today" : "tomorrow";
    const payload = buildReminderNotification(booking, reminderKind);

    for (const subscription of subscriptions) {
      const key = deliveryKey(booking.id, subscription.id, reminderKind);

      if (delivered.has(key)) {
        skipped += 1;
        continue;
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(payload),
        );

        const { error } = await supabase.from("notification_deliveries").insert({
          booking_id: booking.id,
          push_subscription_id: subscription.id,
          reminder_kind: reminderKind,
          channel: "web_push",
        });

        if (error && error.code !== "23505") {
          throw new Error(error.message);
        }

        delivered.add(key);
        sent += 1;
      } catch (error) {
        const statusCode =
          typeof error === "object" && error !== null && "statusCode" in error
            ? Number(error.statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
          removed += 1;
          continue;
        }

        errors += 1;
      }
    }
  }

  return {
    sent,
    skipped,
    removed,
    errors,
    bookings: dueBookings.length,
    message: "تم فحص إشعارات الحجوزات.",
  };
}
