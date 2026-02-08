'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import UserEditModal from '@/components/UserEditModal';
import Logo from '@/components/Logo';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Иванов Иван Иванович',
      email: 'ivanov@klg.ru',
      role: 'Администратор',
      status: 'Активен',
      lastLogin: '2025-01-21 10:30',
    },
    {
      id: '2',
      name: 'Петров Петр Петрович',
      email: 'petrov@klg.ru',
      role: 'Инспектор',
      status: 'Активен',
      lastLogin: '2025-01-21 09:15',
    },
    {
      id: '3',
      name: 'Сидоров Сидор Сидорович',
      email: 'sidorov@klg.ru',
      role: 'Оператор',
      status: 'Неактивен',
      lastLogin: '2025-01-20 16:45',
    },
  ]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Logo size="large" />
          <p style={{ fontSize: '16px', color: '#666', marginTop: '16px', marginBottom: '24px' }}>
            Система контроля лётной годности воздушных судов · Безопасность и качество
          </p>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Пользователи
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Управление пользователями системы
            </p>
          </div>
          <div>
            <button style={{
              padding: '10px 20px',
              backgroundColor: '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
              Добавить пользователя
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', gap: '8px' }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#1e3a5f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>
            Все
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#1e3a5f',
            border: '1px solid #1e3a5f',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>
            Активные
          </button>
          <button style={{
            padding: '8px 16px',
            backgroundColor: 'transparent',
            color: '#1e3a5f',
            border: '1px solid #1e3a5f',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}>
            Администраторы
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a5f', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  Имя
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  Email
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  Роль
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  Статус
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  Последний вход
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} style={{
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                }}>
                  <td style={{ padding: '12px' }}>{user.name}</td>
                  <td style={{ padding: '12px' }}>{user.email}</td>
                  <td style={{ padding: '12px' }}>{user.role}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: user.status === 'Активен' ? '#4caf50' : '#999',
                      color: 'white',
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>{user.lastLogin}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1e3a5f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Редактировать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <UserEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onSave={handleSaveUser}
        />
      </div>
    </div>
  );
}
