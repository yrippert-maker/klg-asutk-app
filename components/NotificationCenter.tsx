'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClose: () => void;
}

export default function NotificationCenter({
  notifications,
  onMarkAsRead,
  onClose,
}: NotificationCenterProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unread = notifications.filter(n => !n.read && n.priority === 'critical').length;
    setUnreadCount(unread);

    // Воспроизведение звука для критических уведомлений
    if (unread > 0 && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Игнорируем ошибки автовоспроизведения
      });
    }
  }, [notifications]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return 'ℹ️';
      case 'low': return '✅';
      default: return '📌';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
    }
  };

  const criticalNotifications = notifications.filter(n => n.priority === 'critical');
  const otherNotifications = notifications.filter(n => n.priority !== 'critical');

  return (
    <>
      {/* Скрытый audio элемент для звуковых сигналов */}
      {typeof window !== 'undefined' && (
        <audio ref={audioRef} preload="auto" style={{ display: 'none' }}>
          <source src="/sounds/alert-critical.mp3" type="audio/mpeg" />
          <source src="/sounds/alert-critical.ogg" type="audio/ogg" />
        </audio>
      )}

      <div style={{
        position: 'fixed',
        top: '80px',
        right: '24px',
        width: '400px',
        maxHeight: '600px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Заголовок */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
            Уведомления
            {unreadCount > 0 && (
              <span style={{
                marginLeft: '8px',
                padding: '2px 8px',
                backgroundColor: '#f44336',
                color: 'white',
                borderRadius: '12px',
                fontSize: '12px',
              }}>
                {unreadCount}
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        {/* Список уведомлений */}
        <div style={{
          overflowY: 'auto',
          maxHeight: '500px',
        }}>
          {notifications.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#999',
            }}>
              Нет уведомлений
            </div>
          ) : (
            <>
              {/* Критические уведомления */}
              {criticalNotifications.length > 0 && (
                <div>
                  {criticalNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        backgroundColor: notification.read ? 'white' : '#fff3e0',
                        borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#fff3e0';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ fontSize: '24px' }}>
                          {getPriorityIcon(notification.priority)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            color: getPriorityColor(notification.priority),
                          }}>
                            {notification.title}
                            {!notification.read && (
                              <span style={{
                                marginLeft: '8px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: getPriorityColor(notification.priority),
                                display: 'inline-block',
                              }} />
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                            {notification.message}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {new Date(notification.createdAt).toLocaleString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Остальные уведомления */}
              {otherNotifications.length > 0 && (
                <div>
                  {otherNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e0e0e0',
                        cursor: 'pointer',
                        backgroundColor: notification.read ? 'white' : '#f9f9f9',
                        borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = notification.read ? 'white' : '#f9f9f9';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ fontSize: '20px' }}>
                          {getPriorityIcon(notification.priority)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '4px',
                            color: '#333',
                          }}>
                            {notification.title}
                            {!notification.read && (
                              <span style={{
                                marginLeft: '8px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: getPriorityColor(notification.priority),
                                display: 'inline-block',
                              }} />
                            )}
                          </div>
                          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                            {notification.message}
                          </div>
                          <div style={{ fontSize: '11px', color: '#999' }}>
                            {new Date(notification.createdAt).toLocaleString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
