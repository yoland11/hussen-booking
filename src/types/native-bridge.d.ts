export {};

declare global {
  interface Window {
    NativeBridge?: {
      printCurrentPage?: () => void;
      shareText?: (title: string, text: string) => void;
      areNotificationsEnabled?: () => boolean;
      requestNotificationPermission?: () => void;
      syncBookingNotifications?: (bookingsJson: string) => void;
      clearScheduledNotifications?: () => void;
    };
  }
}
