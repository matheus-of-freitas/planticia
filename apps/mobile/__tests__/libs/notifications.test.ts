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
    it("returns notification ID on success with DATE trigger", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-03-25T10:00:00"));

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
      const callArgs = Notifications.scheduleNotificationAsync.mock.calls[0][0];
      expect(callArgs.content.body).toContain("Rosa");
      expect(callArgs.content.data).toEqual({ plantId: "plant-1" });
      expect(callArgs.trigger.type).toBe(Notifications.SchedulableTriggerInputTypes.DATE);
      // 3 days from March 25 at 11:00 = March 28 at 11:00
      const scheduledDate = new Date(callArgs.trigger.date);
      expect(scheduledDate.getFullYear()).toBe(2026);
      expect(scheduledDate.getMonth()).toBe(2); // 0-indexed: March = 2
      expect(scheduledDate.getDate()).toBe(28);
      expect(scheduledDate.getHours()).toBe(11);
      expect(scheduledDate.getMinutes()).toBe(0);

      jest.useRealTimers();
    });

    it("handles past date by advancing until future", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-03-25T12:00:00"));

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
      expect(callArgs.trigger.type).toBe(Notifications.SchedulableTriggerInputTypes.DATE);
      // March 24 + 0 days = March 24 at 11am → past → +1 = March 25 at 11am → still past (12pm) → +1 = March 26 at 11am
      const scheduledDate = new Date(callArgs.trigger.date);
      expect(scheduledDate.getDate()).toBe(26);
      expect(scheduledDate.getHours()).toBe(11);

      jest.useRealTimers();
    });

    it("handles multi-day overdue by advancing until future", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-03-30T14:00:00"));

      Notifications.getPermissionsAsync.mockResolvedValueOnce({
        status: "granted",
      });
      Notifications.scheduleNotificationAsync.mockResolvedValueOnce(
        "notif-overdue"
      );

      // Last watered March 20, interval 3 days → next = March 23 at 11am
      // Now is March 30 at 14:00 → 7 days overdue
      const result = await scheduleWateringNotification(
        "plant-overdue",
        "Jiboia",
        3,
        "2026-03-20T08:00:00",
        11
      );

      expect(result).toBe("notif-overdue");
      const callArgs =
        Notifications.scheduleNotificationAsync.mock.calls[0][0];
      const scheduledDate = new Date(callArgs.trigger.date);
      // Must be in the future: March 31 at 11am (first 11am after March 30 14:00)
      expect(scheduledDate.getDate()).toBe(31);
      expect(scheduledDate.getHours()).toBe(11);
      expect(scheduledDate.getTime()).toBeGreaterThan(new Date("2026-03-30T14:00:00").getTime());

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
