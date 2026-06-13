import { useState, useEffect, useCallback } from "react";
import {
  listNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "@/services/notifications";
import { getToken } from "@/lib/getToken";

const POLL_INTERVAL = 60_000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    const token = getToken();
    const result = await listNotifications(token);
    if (result.ok) {
      setNotifications(result.data.items);
      setUnreadCount(result.data.unreadCount);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (id: string) => {
    const token = getToken();
    await markAsRead(token, id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    const token = getToken();
    await markAllAsRead(token);
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? now }))
    );
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, handleMarkAsRead, handleMarkAllAsRead };
}
