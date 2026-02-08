'use client';

// Отключаем статическую генерацию для этой страницы

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Logo from '@/components/Logo';
import AircraftTable from '@/components/AircraftTable';
import SearchModal from '@/components/SearchModal';
import Pagination from '@/components/Pagination';
import { useAircraftData } from '@/hooks/useSWRData';
import { useUrlParams } from '@/hooks/useUrlParams';

export default function AircraftPage() {
  const { params } = useUrlParams();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  
  const page = params.page || 1;
  const limit = params.limit || 50;
  
  // Используем SWR для кэширования данных
  const { data, error, isLoading, mutate } = useAircraftData({
    page,
    limit,
    paginate: true, // Используем server-side пагинацию
  });

  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  if (error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
          <div style={{ color: 'red' }}>
            Ошибка загрузки данных: {error.message}
          </div>
        </div>
      </div>
    );
  }

  const aircraft = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 1,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div id="main-content" role="main" style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Logo size="large" />
          <p style={{ fontSize: '16px', color: '#666', marginTop: '16px', marginBottom: '24px' }}>
            Реестр воздушных судов гражданской авиации РФ
          </p>
        </div>

        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Воздушные суда
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              {isLoading ? 'Загрузка...' : `Всего записей: ${pagination.total}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Поиск
            </button>
            <button
              onClick={() => mutate()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Обновить
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#666' }}>Загрузка данных...</div>
          </div>
        ) : (
          <>
            <AircraftTable aircraft={aircraft} />
            {pagination.totalPages > 1 && (
              <div style={{ marginTop: '24px' }}>
                <Pagination
                  total={pagination.total}
                  limit={pagination.limit}
                  currentPage={pagination.page}
                />
              </div>
            )}
          </>
        )}

        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          aircraft={aircraft}
          searchType="aircraft"
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  );
}
