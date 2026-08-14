import { useCallback, useEffect, useState } from 'react';
import { formatSingaporeDate, getSingaporeNow } from '@/lib/timezone';

interface ReminderTodo {
  id: number;
  title: string;
  due_date: string | null;
}

function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    getNotificationPermission()
  );

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('denied');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== permission) {
      setPermission(Notification.permission);
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    let active = true;

    const poll = async () => {
      if (!active || Notification.permission !== 'granted') {
        return;
      }

      try {
        const response = await fetch('/api/notifications/check');
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          data?: ReminderTodo[];
        };
        const dueTodos = payload.data ?? [];

        for (const todo of dueTodos) {
          if (!active || Notification.permission !== 'granted') {
            return;
          }

          const markResponse = await fetch(`/api/todos/${todo.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              last_notification_sent: getSingaporeNow().toISOString(),
            }),
          });

          if (!markResponse.ok) {
            continue;
          }

          new Notification(todo.title, {
            body: `Due ${formatSingaporeDate(todo.due_date)}`,
            tag: `todo-${todo.id}`,
          });
        }
      } catch {
        // Best effort notification polling.
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [permission]);

  return { permission, requestPermission };
}
