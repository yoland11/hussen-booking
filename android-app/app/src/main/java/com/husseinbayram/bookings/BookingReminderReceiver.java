package com.husseinbayram.bookings;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class BookingReminderReceiver extends BroadcastReceiver {
    private static final String EXTRA_BOOKING_ID = "booking_id";
    private static final String EXTRA_BOOKING_NAME = "booking_name";
    private static final String EXTRA_BOOKING_DATE = "booking_date";
    private static final String EXTRA_SERVICE_TYPE = "service_type";
    private static final String EXTRA_REMINDER_KIND = "reminder_kind";

    @Override
    public void onReceive(Context context, Intent intent) {
        BookingNotificationScheduler.ensureNotificationChannel(context);

        if (!BookingNotificationScheduler.areNotificationsEnabled(context)) {
            return;
        }

        String bookingId = intent.getStringExtra(EXTRA_BOOKING_ID);
        String bookingName = intent.getStringExtra(EXTRA_BOOKING_NAME);
        String bookingDate = intent.getStringExtra(EXTRA_BOOKING_DATE);
        String serviceType = intent.getStringExtra(EXTRA_SERVICE_TYPE);
        String reminderKind = intent.getStringExtra(EXTRA_REMINDER_KIND);

        if (bookingId == null || bookingName == null || bookingDate == null || reminderKind == null) {
            return;
        }

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.putExtra("open_path", "/dashboard");
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, BookingNotificationScheduler.CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .setContentTitle(
                        "today".equals(reminderKind)
                                ? context.getString(R.string.notification_title_today)
                                : context.getString(R.string.notification_title_tomorrow)
                )
                .setContentText(buildBody(context, bookingName, bookingDate, serviceType, reminderKind))
                .setStyle(new NotificationCompat.BigTextStyle().bigText(
                        buildBody(context, bookingName, bookingDate, serviceType, reminderKind)
                ))
                .setContentIntent(android.app.PendingIntent.getActivity(
                        context,
                        Math.abs((bookingId + ":open").hashCode()),
                        openIntent,
                        android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE
                ))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT);

        NotificationManagerCompat.from(context).notify(
                Math.abs((bookingId + ":" + reminderKind).hashCode()),
                builder.build()
        );

        BookingNotificationScheduler.markDelivered(context, bookingId, reminderKind);
    }

    private String buildBody(
            Context context,
            String bookingName,
            String bookingDate,
            String serviceType,
            String reminderKind
    ) {
        String dateLabel = formatDateLabel(bookingDate);
        String sessionLabel = serviceType == null || serviceType.trim().isEmpty()
                ? context.getString(R.string.notification_default_session)
                : serviceType.trim();
        String lead = "today".equals(reminderKind)
                ? context.getString(R.string.notification_lead_today)
                : context.getString(R.string.notification_lead_tomorrow);

        return lead + " - " + bookingName + " - " + sessionLabel + " - " + dateLabel
                + " - " + context.getString(R.string.notification_time_unknown);
    }

    private String formatDateLabel(String rawDate) {
        try {
            Date date = new SimpleDateFormat("yyyy-MM-dd", Locale.US).parse(rawDate);
            if (date == null) {
                return rawDate;
            }

            return new SimpleDateFormat("yyyy/MM/dd", new Locale("ar", "IQ")).format(date);
        } catch (ParseException ignored) {
            return rawDate;
        }
    }
}
