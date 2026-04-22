package com.husseinbayram.bookings;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

final class BookingNotificationScheduler {
    static final String CHANNEL_ID = "booking_reminders";
    private static final String PREFS_NAME = "hb_booking_notifications";
    private static final String KEY_ENABLED = "enabled";
    private static final String KEY_BOOKINGS_JSON = "bookings_json";
    private static final String EXTRA_BOOKING_ID = "booking_id";
    private static final String EXTRA_BOOKING_NAME = "booking_name";
    private static final String EXTRA_BOOKING_DATE = "booking_date";
    private static final String EXTRA_SERVICE_TYPE = "service_type";
    private static final String EXTRA_REMINDER_KIND = "reminder_kind";
    private static final String REMINDER_TODAY = "today";
    private static final String REMINDER_TOMORROW = "tomorrow";

    private BookingNotificationScheduler() {}

    static void ensureNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
        if (notificationManager == null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                context.getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription(context.getString(R.string.notification_channel_description));
        notificationManager.createNotificationChannel(channel);
    }

    static boolean areNotificationsEnabled(Context context) {
        return getPrefs(context).getBoolean(KEY_ENABLED, false) && hasRuntimePermission(context)
                && NotificationManagerCompat.from(context).areNotificationsEnabled();
    }

    static void setNotificationsEnabled(Context context, boolean enabled) {
        getPrefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply();
    }

    static void sync(Context context, String bookingsJson) {
        cancelScheduledNotifications(context, getStoredBookings(context));
        getPrefs(context).edit().putString(KEY_BOOKINGS_JSON, bookingsJson).apply();

        if (!areNotificationsEnabled(context)) {
            return;
        }

        scheduleFromJson(context, bookingsJson);
    }

    static void disableAndClear(Context context) {
        setNotificationsEnabled(context, false);
        cancelScheduledNotifications(context, getStoredBookings(context));
    }

    static void rescheduleStored(Context context) {
        if (!areNotificationsEnabled(context)) {
            return;
        }

        String bookingsJson = getStoredBookings(context);
        cancelScheduledNotifications(context, bookingsJson);
        scheduleFromJson(context, bookingsJson);
    }

    static void markDelivered(Context context, String bookingId, String reminderKind) {
        getPrefs(context).edit().putBoolean(deliveredKey(bookingId, reminderKind), true).apply();
    }

    private static void scheduleFromJson(Context context, String bookingsJson) {
        if (bookingsJson == null || bookingsJson.isEmpty()) {
            return;
        }

        try {
            JSONArray array = new JSONArray(bookingsJson);
            Set<String> activeKeys = new HashSet<>();

            for (int index = 0; index < array.length(); index += 1) {
                JSONObject booking = array.optJSONObject(index);
                if (booking == null) {
                    continue;
                }

                String bookingId = booking.optString("id", "");
                String bookingName = booking.optString("customer_name", "");
                String bookingDate = booking.optString("booking_date", "");
                String serviceType = booking.optString("service_type", "");

                if (bookingId.isEmpty() || bookingName.isEmpty() || bookingDate.isEmpty()) {
                    continue;
                }

                scheduleReminder(context, bookingId, bookingName, bookingDate, serviceType, REMINDER_TODAY);
                scheduleReminder(context, bookingId, bookingName, bookingDate, serviceType, REMINDER_TOMORROW);

                activeKeys.add(deliveredKey(bookingId, REMINDER_TODAY));
                activeKeys.add(deliveredKey(bookingId, REMINDER_TOMORROW));
            }

            pruneDeliveredFlags(context, activeKeys);
        } catch (Exception ignored) {
            // Skip malformed booking payloads without breaking the app.
        }
    }

    private static void pruneDeliveredFlags(Context context, Set<String> activeKeys) {
        SharedPreferences prefs = getPrefs(context);
        SharedPreferences.Editor editor = prefs.edit();

        for (String key : prefs.getAll().keySet()) {
          if (key.startsWith("delivered_") && !activeKeys.contains(key)) {
              editor.remove(key);
          }
        }

        editor.apply();
    }

    private static void scheduleReminder(
            Context context,
            String bookingId,
            String bookingName,
            String bookingDate,
            String serviceType,
            String reminderKind
    ) {
        if (wasDelivered(context, bookingId, reminderKind)) {
            return;
        }

        long triggerAtMillis = computeTriggerAtMillis(bookingDate, reminderKind);
        if (triggerAtMillis <= 0L) {
            return;
        }

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }

        PendingIntent pendingIntent = createPendingIntent(
                context,
                bookingId,
                bookingName,
                bookingDate,
                serviceType,
                reminderKind,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        alarmManager.setWindow(
                AlarmManager.RTC_WAKEUP,
                triggerAtMillis,
                5 * 60 * 1000L,
                pendingIntent
        );
    }

    private static void cancelScheduledNotifications(Context context, String bookingsJson) {
        if (bookingsJson == null || bookingsJson.isEmpty()) {
            return;
        }

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }

        try {
            JSONArray array = new JSONArray(bookingsJson);
            for (int index = 0; index < array.length(); index += 1) {
                JSONObject booking = array.optJSONObject(index);
                if (booking == null) {
                    continue;
                }

                String bookingId = booking.optString("id", "");
                if (bookingId.isEmpty()) {
                    continue;
                }

                PendingIntent todayIntent = createPendingIntent(
                        context,
                        bookingId,
                        "",
                        "",
                        "",
                        REMINDER_TODAY,
                        PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                );
                if (todayIntent != null) {
                    alarmManager.cancel(todayIntent);
                }

                PendingIntent tomorrowIntent = createPendingIntent(
                        context,
                        bookingId,
                        "",
                        "",
                        "",
                        REMINDER_TOMORROW,
                        PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                );
                if (tomorrowIntent != null) {
                    alarmManager.cancel(tomorrowIntent);
                }
            }
        } catch (Exception ignored) {
            // Ignore bad cached payloads.
        }
    }

    private static PendingIntent createPendingIntent(
            Context context,
            String bookingId,
            String bookingName,
            String bookingDate,
            String serviceType,
            String reminderKind,
            int flags
    ) {
        Intent intent = new Intent(context, BookingReminderReceiver.class);
        intent.putExtra(EXTRA_BOOKING_ID, bookingId);
        intent.putExtra(EXTRA_BOOKING_NAME, bookingName);
        intent.putExtra(EXTRA_BOOKING_DATE, bookingDate);
        intent.putExtra(EXTRA_SERVICE_TYPE, serviceType);
        intent.putExtra(EXTRA_REMINDER_KIND, reminderKind);

        return PendingIntent.getBroadcast(
                context,
                requestCodeFor(bookingId, reminderKind),
                intent,
                flags
        );
    }

    private static int requestCodeFor(String bookingId, String reminderKind) {
        return Math.abs((bookingId + ":" + reminderKind).hashCode());
    }

    private static long computeTriggerAtMillis(String bookingDate, String reminderKind) {
        Calendar bookingDay = parseDate(bookingDate);
        if (bookingDay == null) {
            return -1L;
        }

        Calendar now = Calendar.getInstance();
        Calendar trigger = (Calendar) bookingDay.clone();

        if (REMINDER_TOMORROW.equals(reminderKind)) {
            trigger.add(Calendar.DAY_OF_YEAR, -1);
            trigger.set(Calendar.HOUR_OF_DAY, 19);
            trigger.set(Calendar.MINUTE, 0);
        } else {
            trigger.set(Calendar.HOUR_OF_DAY, 9);
            trigger.set(Calendar.MINUTE, 0);

            if (sameDate(trigger, now) && trigger.before(now)) {
                Calendar instant = (Calendar) now.clone();
                instant.add(Calendar.SECOND, 10);
                trigger = instant;
            }
        }

        trigger.set(Calendar.SECOND, 0);
        trigger.set(Calendar.MILLISECOND, 0);

        if (trigger.before(now)) {
            return -1L;
        }

        return trigger.getTimeInMillis();
    }

    private static boolean sameDate(Calendar left, Calendar right) {
        return left.get(Calendar.YEAR) == right.get(Calendar.YEAR)
                && left.get(Calendar.DAY_OF_YEAR) == right.get(Calendar.DAY_OF_YEAR);
    }

    private static Calendar parseDate(String bookingDate) {
        try {
            Date parsedDate = new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(bookingDate);
            if (parsedDate == null) {
                return null;
            }

            Calendar calendar = Calendar.getInstance();
            calendar.setTime(parsedDate);
            return calendar;
        } catch (ParseException ignored) {
            return null;
        }
    }

    private static boolean wasDelivered(Context context, String bookingId, String reminderKind) {
        return getPrefs(context).getBoolean(deliveredKey(bookingId, reminderKind), false);
    }

    private static String deliveredKey(String bookingId, String reminderKind) {
        return "delivered_" + bookingId + "_" + reminderKind;
    }

    private static String getStoredBookings(Context context) {
        return getPrefs(context).getString(KEY_BOOKINGS_JSON, "[]");
    }

    private static SharedPreferences getPrefs(Context context) {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private static boolean hasRuntimePermission(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            return true;
        }

        return ContextCompat.checkSelfPermission(context, android.Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }
}
