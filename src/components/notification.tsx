"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

interface NotificationItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface NotificationProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export function DashboardNotification({ notifications, onDismiss }: NotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg ${
              notification.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : notification.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
            }`}
          >
            {notification.type === "success" && (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            {notification.type === "error" && (
              <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            {notification.type === "info" && (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <p className="flex-1 text-sm">{notification.message}</p>
            <button
              onClick={() => onDismiss(notification.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook to manage notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).slice(2);
    setNotifications((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      dismissNotification(id);
    }, 4000);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, addNotification, dismissNotification };
}