'use client';

import { useState, useEffect } from 'react';
import NotificationCenter from './NotificationCenter';

export interface Notification {
  id: string;
  type: 'critical_risk' | 'upcoming_audit' | 'expiring_document' | 'aircraft_status_change';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationBellProps {
  userId?: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    // Обновляем уведомления каждые 5 минут
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        const unread = (data.notifications || []).filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Ошибка загрузки уведомлений:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Ошибка отметки уведомления как прочитанного:', error);
    }
  };

  const criticalUnread = notifications.filter(n => !n.read && n.priority === 'critical').length;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          fontSize: '24px',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={`Уведомления${unreadCount > 0 ? ` (${unreadCount} непрочитанных)` : ''}`}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: criticalUnread > 0 ? '#f44336' : '#2196f3',
            color: 'white',
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid white',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {criticalUnread > 0 && (
          <span style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: '#f44336',
            animation: 'pulse 2s infinite',
          }} />
        )}
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
          <NotificationCenter
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClose={() => setIsOpen(false)}
          />
        </>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </>
  );
}
