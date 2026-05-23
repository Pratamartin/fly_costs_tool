import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification, NotificationType } from "@/services/notifications";

interface NotificationsPanelProps {
  role: "admin" | "coordinator" | "student";
  dark?: boolean;
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function getExpenseRoute(role: string, expenseId: string | null): string | null {
  if (!expenseId) return null;
  switch (role) {
    case "admin": return `/dashboard/admin/expenses/detail?id=${expenseId}`;
    case "student": return `/dashboard/student/expenses/detail/${expenseId}`;
    case "coordinator": return `/dashboard/coordinator`;
    default: return null;
  }
}

function NotifIcon({ type }: { type: NotificationType }) {
  if (type === "EXPENSE_APPROVED" || type === "EXPENSE_CONCLUDED")
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-green-600">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      </div>
    );
  if (type === "EXPENSE_REJECTED")
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-red-600">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </div>
    );
  if (type === "EXPENSE_PENDING_REVIEW")
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-yellow-600">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
      </div>
    );
  if (type === "EXPENSE_CORRECTION_REQUESTED")
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-orange-600">
          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
        </svg>
      </div>
    );
  if (type === "PROJECT_ASSIGNED")
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-blue-600">
          <path d="M3.75 3A1.75 1.75 0 002 4.75v3.26a3.235 3.235 0 011.75-.51h12.5c.644 0 1.245.188 1.75.51V6.75A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75zM3.75 9A1.75 1.75 0 002 10.75v4.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-4.5A1.75 1.75 0 0016.25 9H3.75z" />
        </svg>
      </div>
    );
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 text-gray-500">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
    </div>
  );
}

function NotifItem({
  notif,
  role,
  onMarkAsRead,
  onClose,
}: {
  notif: Notification;
  role: string;
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const isUnread = notif.readAt === null;

  function handleClick() {
    if (isUnread) onMarkAsRead(notif.id);
    const route = getExpenseRoute(role, notif.expenseId);
    if (route) {
      router.push(route);
      onClose();
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${
        isUnread ? "bg-blue-50/60" : ""
      }`}
    >
      <NotifIcon type={notif.type} />
      <div className="min-w-0 flex-1">
        <p className={`text-xs leading-snug ${isUnread ? "font-semibold text-gray-800" : "font-medium text-gray-600"}`}>
          {notif.message}
        </p>
        <p className="mt-0.5 text-[10px] text-gray-400">{formatRelative(notif.createdAt)}</p>
      </div>
      {isUnread && (
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  );
}

export default function NotificationsPanel({ role, dark = false }: NotificationsPanelProps) {
  const { notifications, unreadCount, handleMarkAsRead, handleMarkAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const bellClass = dark
    ? "relative rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white transition"
    : "relative rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={bellClass}
        aria-label="Notificações"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" clipRule="evenodd" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[200] mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Notificações</span>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-100 px-1.5 text-[10px] font-bold text-red-600">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                </svg>
                Marcar todas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 divide-y divide-gray-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-gray-200">
                  <path fillRule="evenodd" d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-gray-400">Nenhuma notificação</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotifItem
                  key={n.id}
                  notif={n}
                  role={role}
                  onMarkAsRead={handleMarkAsRead}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
