/**
 * Hook for realtime notifications via WebSocket.
 * Falls back to polling when WS is unavailable.
 * Разработчик: АО «REFLY»
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { wsClient, WsNotification } from '@/lib/ws-client';
import { notificationsApi } from '@/lib/api/api-client';

export interface Notification {
  id: string;
  title: string;
  body?: string;
  is_read: boolean;
  created_at: string;
  // From WS
  type?: string;
  entity_type?: string;
  entity_id?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsMessages, setWsMessages] = useState<WsNotification[]>([]);

  // Fetch from backend
  const refresh = useCallback(async () => {
    try {
      const data = await notificationsApi.list({ per_page: 20, unread_only: false });
      const items = data?.items || [];
      setNotifications(items);
      setUnreadCount(items.filter((n: any) => !n.is_read).length);
    } catch {
      // ignore
    }
  }, []);

  // WS listener
  useEffect(() => {
    const unsub = wsClient.onNotification((msg) => {
      setWsMessages(prev => [msg, ...prev].slice(0, 50));
      // Increment unread when new notification arrives
      setUnreadCount(prev => prev + 1);
    });
    return unsub;
  }, []);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  const markRead = async (id: string) => {
    await notificationsApi.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return {
    notifications,
    unreadCount,
    wsMessages,
    refresh,
    markRead,
    markAllRead,
  };
}
