'use client';
import { useState, useEffect } from 'react';

interface OnlineUser { id: string; name: string; role: string; }

export default function OnlineUsers() {
  const [users, setUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/health');
        const data = await res.json();
        // Approximate from WS stats
        const count = data.ws_active_users || 0;
        const mockUsers: OnlineUser[] = count > 0
          ? [{ id: '1', name: 'Вы', role: 'admin' }]
          : [];
        setUsers(mockUsers);
      } catch { setUsers([]); }
    };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-xs text-gray-500">
        {users.length > 0 ? `${users.length} онлайн` : 'Offline'}
      </span>
    </div>
  );
}
