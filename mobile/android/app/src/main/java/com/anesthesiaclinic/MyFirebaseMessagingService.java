package com.anesthesiaclinic;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import org.json.JSONObject;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID_EMERGENCY = "emergency_channel";
    private static final String CHANNEL_ID_DEFAULT = "default_channel";
    private static final String PREFS_NAME = "NotificationPrefs";
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private static final long RETRY_DELAY = 5000; // 5 seconds

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Emergency Channel
            NotificationChannel emergencyChannel = new NotificationChannel(
                CHANNEL_ID_EMERGENCY,
                "Emergency Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            emergencyChannel.setDescription("Critical notifications that require immediate attention");
            emergencyChannel.enableVibration(true);
            emergencyChannel.setVibrationPattern(new long[]{0, 500, 200, 500});
            emergencyChannel.setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            );

            // Default Channel
            NotificationChannel defaultChannel = new NotificationChannel(
                CHANNEL_ID_DEFAULT,
                "Default Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            );
            defaultChannel.setDescription("Regular app notifications");
            defaultChannel.enableVibration(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(emergencyChannel);
            notificationManager.createNotificationChannel(defaultChannel);
        }
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        // Check notification preferences
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (!prefs.getBoolean("notifications_enabled", true)) {
            return;
        }

        // Get notification data
        String type = remoteMessage.getData().get("type");
        boolean isEmergency = "EMERGENCY".equals(type);
        
        // Check specific notification type preferences
        if (!shouldShowNotification(type, prefs)) {
            return;
        }

        // Create and show notification
        showNotification(remoteMessage, isEmergency);
    }

    private boolean shouldShowNotification(String type, SharedPreferences prefs) {
        if (type == null) return true;
        
        switch (type) {
            case "OPERATION_NOTE":
                return prefs.getBoolean("operation_notes_enabled", true);
            case "MESSAGE":
                return prefs.getBoolean("messages_enabled", true);
            case "PATIENT_UPDATE":
                return prefs.getBoolean("patient_updates_enabled", true);
            case "MENTION":
                return prefs.getBoolean("mentions_enabled", true);
            case "REACTION":
                return prefs.getBoolean("reactions_enabled", true);
            case "EMERGENCY":
                return prefs.getBoolean("emergency_alerts_enabled", true);
            default:
                return true;
        }
    }

    private void showNotification(RemoteMessage remoteMessage, boolean isEmergency) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        // Add notification data to intent
        Bundle bundle = new Bundle();
        for (String key : remoteMessage.getData().keySet()) {
            bundle.putString(key, remoteMessage.getData().get(key));
        }
        intent.putExtras(bundle);

        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE
        );

        String channelId = isEmergency ? CHANNEL_ID_EMERGENCY : CHANNEL_ID_DEFAULT;
        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(remoteMessage.getNotification().getTitle())
            .setContentText(remoteMessage.getNotification().getBody())
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setPriority(isEmergency ? NotificationCompat.PRIORITY_HIGH : NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent);

        if (isEmergency) {
            notificationBuilder.setCategory(NotificationCompat.CATEGORY_ALARM)
                             .setVibrate(new long[]{0, 500, 200, 500});
        }

        // Show notification with retry mechanism
        showNotificationWithRetry(notificationBuilder.build(), 0);
    }

    private void showNotificationWithRetry(android.app.Notification notification, int attempt) {
        try {
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
            notificationManager.notify(getNotificationId(), notification);
        } catch (Exception e) {
            if (attempt < MAX_RETRY_ATTEMPTS) {
                // Retry after delay
                new android.os.Handler().postDelayed(() -> {
                    showNotificationWithRetry(notification, attempt + 1);
                }, RETRY_DELAY);
            }
        }
    }

    private int getNotificationId() {
        return (int) System.currentTimeMillis();
    }

    @Override
    public void onNewToken(String token) {
        // Send token to server with retry mechanism
        sendRegistrationToServer(token, 0);
    }

    private void sendRegistrationToServer(String token, int attempt) {
        try {
            // Implement your server token update logic here
            // For example, using Retrofit or other networking library
            
            // Store token locally
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString("fcm_token", token).apply();
        } catch (Exception e) {
            if (attempt < MAX_RETRY_ATTEMPTS) {
                // Retry after delay
                new android.os.Handler().postDelayed(() -> {
                    sendRegistrationToServer(token, attempt + 1);
                }, RETRY_DELAY);
            }
        }
    }
}