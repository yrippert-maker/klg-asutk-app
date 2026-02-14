'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Notification {
  type: string;
  data: { message: string; severity?: string };
  timestamp: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSocket for real-time notifications
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/notifications`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const notif = JSON.parse(event.data);
          setNotifications(prev => [notif, ...prev].slice(0, 50));
          setUnread(prev => prev + 1);
        } catch {}
      };
      ws.onerror = () => {};
      ws.onclose = () => {};
    } catch {}

    return () => { wsRef.current?.close(); };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) setUnread(0);
  };

  const severityColor = (s?: string) => {
    switch (s) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-600';
      default: return 'text-blue-500';
    }
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={handleOpen} className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors" title="Уведомления">
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
            <span className="text-sm font-bold">Уведомления</span>
            <Link href="/inbox" className="text-[10px] text-blue-500 hover:underline">Все →</Link>
          </div>
          {notifications.length > 0 ? (
            <div>
              {notifications.slice(0, 10).map((n, i) => (
                <div key={i} className="px-3 py-2 border-b border-gray-50 hover:bg-gray-50">
                  <div className={`text-xs font-medium ${severityColor(n.data?.severity)}`}>{n.data?.message || n.type}</div>
                  <div className="text-[9px] text-gray-400 mt-0.5">{new Date(n.timestamp).toLocaleTimeString('ru-RU')}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">Нет новых уведомлений</div>
          )}
        </div>
      )}
    </div>
  );
}
