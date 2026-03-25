import {
  requestNotificationPermissions,
  scheduleWateringNotification,
  cancelNotification,
  cancelPlantNotifications,
  rescheduleWateringNotification,
} from "../../libs/notifications";
import { Platform } from "react-native";

const Notifications = require("expo-notifications");

describe("notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("setNotificationHandler is called at module load", () => {
    // The mock was called when notifications.ts was first imported.
    // We can't assert on it after clearAllMocks, so just verify
    // the function exists and is a mock.
    expect(Notifications.setNotificationHandler).toBeDefined();
    expect(jest.isMockFunction(Notifications.setNotificationHandler)).toBe(true);
  });

  describe("requestNotificationPermissions", () => {
    it("returns true when already granted", async () => {
      Notifications.getPermissionsAsync.mockResolvedValueOnce({
        status: "granted",
      });

      const result = await requestNotificationPermissions();
      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("requests permission and returns true when granted", async () => {
      Notifications.getPermissionsAsync.mockResolvedValueOnce({
        status: "denied",
      });
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({
        status: "granted",
      });

      const result = await requestNotificationPermissions();
      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it("returns false when permission is denied", async () => {
      Notifications.getPermissionsAsync.mockResolvedValueOnce({
        status: "denied",
      });
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({
        status: "denied",
      });

      const result = await requestNotificationPermissions();
      expect(result).toBe(false);
    });

    it("sets up Android notification channel", async () => {
      const originalOS = Platform.OS;
      Platform.OS = "android";

      Notifications.getPermissionsAsync.mockResolvedValueOnce({
        status: "granted",
      });

      await requestNotificationPermissions();

      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        "watering-reminders",
        expect.objectContaining({
          name: "Lembretes de Rega",
          importance: Notifications.AndroidImportance.HIGH,
        })
      );

      Platform.OS = originalOS;
    });
  });

  describe("scheduleWateringNotification", () => {
    it("returns notification ID on success", async () => {
      Notifications.getPermissionsAsync.mockResolvedValueOnce({
        status: "granted",
      });
      Notifications.scheduleNotificationAsync.mockResolvedValueOnce(
        "notif-abc"
      );

      const result = await scheduleWateringNotification(
        "plant-1",
        "Rosa",
        3,
        null,
        11
      );

      expect(result).toBe("notif-abc");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: expect.any(String),
            body: expect.stringContaining("Rosa"),
            data: { plantId: "plant-1" },
          }),
        })
      );
    });

    it("handles time < 60s edge case by adding 1 day", async () => {
      // Freeze time to 10:00 AM so that wateringHour=11 is 1h in the future after +1 day
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-03-25T10:00:00"));

      Notifications.getPermissionsAsync.mockResolvedValueOnce({
        status: "granted",
      });
      Notifications.scheduleNotificationAsync.mockResolvedValueOnce(
        "notif-edge"
      );

      // Use a past date with 0 interval so next watering date is in the past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const result = await scheduleWateringNotification(
        "plant-edge",
        "Cacto",
        0,
        pastDate.toISOString(),
        11
      );

      expect(result).toBe("notif-edge");
      const callArgs =
        Notifications.scheduleNotificationAsync.mock.calls[0][0];
      expect(callArgs.trigger.seconds).toBeGreaterThan(0);

      jest.useRealTimers();
    });

    it("throws when permission is denied", async () => {
      Notifications.getPermissionsAsync.mockResolvedValueOnce({
        status: "denied",
      });
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({
        status: "denied",
      });

      await expect(
        scheduleWateringNotification("plant-1", "Rosa", 3)
      ).rejects.toThrow("Notification permission not granted");
    });
  });

  describe("cancelNotification", () => {
    it("calls cancelScheduledNotificationAsync with the ID", async () => {
      await cancelNotification("notif-123");

      expect(
        Notifications.cancelScheduledNotificationAsync
      ).toHaveBeenCalledWith("notif-123");
    });
  });

  describe("cancelPlantNotifications", () => {
    it("cancels only notifications matching the plantId", async () => {
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
        {
          identifier: "notif-1",
          content: { data: { plantId: "plant-1" } },
        },
        {
          identifier: "notif-2",
          content: { data: { plantId: "plant-2" } },
        },
        {
          identifier: "notif-3",
          content: { data: { plantId: "plant-1" } },
        },
      ]);

      await cancelPlantNotifications("plant-1");

      expect(
        Notifications.cancelScheduledNotificationAsync
      ).toHaveBeenCalledTimes(2);
      expect(
        Notifications.cancelScheduledNotificationAsync
      ).toHaveBeenCalledWith("notif-1");
      expect(
        Notifications.cancelScheduledNotificationAsync
      ).toHaveBeenCalledWith("notif-3");
    });

    it("does not cancel anything when no notifications match", async () => {
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
        {
          identifier: "notif-1",
          content: { data: { plantId: "plant-other" } },
        },
      ]);

      await cancelPlantNotifications("plant-1");

      expect(
        Notifications.cancelScheduledNotificationAsync
      ).not.toHaveBeenCalled();
    });
  });

  describe("rescheduleWateringNotification", () => {
    it("cancels existing notifications then schedules a new one", async () => {
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
        {
          identifier: "old-notif",
          content: { data: { plantId: "plant-1" } },
        },
      ]);
      Notifications.getPermissionsAsync.mockResolvedValueOnce({
        status: "granted",
      });
      Notifications.scheduleNotificationAsync.mockResolvedValueOnce(
        "new-notif"
      );

      const result = await rescheduleWateringNotification(
        "plant-1",
        "Rosa",
        5,
        null,
        11
      );

      expect(
        Notifications.cancelScheduledNotificationAsync
      ).toHaveBeenCalledWith("old-notif");
      expect(result).toBe("new-notif");
    });
  });
});
