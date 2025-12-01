import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 * Required for Android 13+ and iOS
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Notification permission not granted");
    return false;
  }

  // Android-specific channel setup
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("watering-reminders", {
      name: "Lembretes de Rega",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4CAF50",
    });
  }

  return true;
}

/**
 * Calculate the next watering date based on interval and last watered date
 */
function calculateNextWateringDate(
  wateringIntervalDays: number,
  lastWateredAt?: string | null
): Date {
  const baseDate = lastWateredAt ? new Date(lastWateredAt) : new Date();
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + wateringIntervalDays);
  return nextDate;
}

/**
 * Schedule a watering reminder notification for a plant
 * Returns the notification identifier for future cancellation
 */
export async function scheduleWateringNotification(
  plantId: string,
  plantName: string,
  wateringIntervalDays: number,
  lastWateredAt?: string | null,
  wateringHour: number = 11
): Promise<string> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    throw new Error("Notification permission not granted");
  }

  const nextWateringDate = calculateNextWateringDate(wateringIntervalDays, lastWateredAt);
  nextWateringDate.setHours(wateringHour, 0, 0, 0);
  const now = new Date();

  let secondsUntilNotification = Math.floor((nextWateringDate.getTime() - now.getTime()) / 1000);
  if (secondsUntilNotification < 60) {
    nextWateringDate.setDate(nextWateringDate.getDate() + 1);
    secondsUntilNotification = Math.floor((nextWateringDate.getTime() - now.getTime()) / 1000);
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌱 Hora de regar!",
      body: `${plantName} precisa de água hoje`,
      data: { plantId },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: secondsUntilNotification,
      repeats: true,
      channelId: Platform.OS === "android" ? "watering-reminders" : undefined,
    },
  });

  console.log(
    `Scheduled notification for ${plantName} in ${secondsUntilNotification}s (ID: ${notificationId})`
  );
  return notificationId;
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
  console.log(`Cancelled notification: ${notificationId}`);
}

/**
 * Cancel all scheduled notifications for a specific plant
 */
export async function cancelPlantNotifications(plantId: string): Promise<void> {
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

  for (const notification of scheduledNotifications) {
    if (notification.content.data?.plantId === plantId) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      console.log(`Cancelled notification for plant ${plantId}: ${notification.identifier}`);
    }
  }
}

/**
 * Reschedule a plant's watering notification
 * Cancels existing notifications for the plant and schedules a new one
 */
export async function rescheduleWateringNotification(
  plantId: string,
  plantName: string,
  wateringIntervalDays: number,
  lastWateredAt?: string | null,
  wateringHour: number = 11
): Promise<string> {
  await cancelPlantNotifications(plantId);

  return scheduleWateringNotification(
    plantId,
    plantName,
    wateringIntervalDays,
    lastWateredAt,
    wateringHour
  );
}
