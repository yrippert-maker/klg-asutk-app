'use client';

import Sidebar from '@/components/Sidebar';
import Logo from '@/components/Logo';
import RegulationViewModal from '@/components/RegulationViewModal';
import { useState, useEffect } from 'react';

// ISR: revalidate работает только в серверных компонентах, не в клиентских
// export const revalidate = 3600; // Удалено, так как это клиентский компонент

import { RegulationDocument } from '@/lib/regulations';

type Regulation = RegulationDocument;

export default function RegulationsPage() {
  const [selectedRegulation, setSelectedRegulation] = useState<Regulation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных с кэшированием
  useEffect(() => {
    const loadRegulations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/regulations');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // console.log('[Regulations] API response:', { 
          isArray: Array.isArray(data), 
          hasDocuments: !!data?.documents, 
          documentsLength: data?.documents?.length || 0,
          total: data?.total 
        });
        // API возвращает объект с documents и total
        const regulationsArray = Array.isArray(data) 
          ? data 
          : (data?.documents || data?.data || []);
        console.log('[Regulations] Processed regulations:', regulationsArray.length);
        setRegulations(regulationsArray);
      } catch (error) {
        console.error('Ошибка загрузки нормативных документов:', error);
        setRegulations([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadRegulations();
  }, []);

  const handleViewRegulation = (regulation: Regulation) => {
    setSelectedRegulation(regulation);
    setIsModalOpen(true);
  };

  const regulationsBySource = regulations.reduce((acc, reg) => {
    if (!acc[reg.source]) {
      acc[reg.source] = [];
    }
    acc[reg.source].push(reg);
    return acc;
  }, {} as Record<string, Regulation[]>);

  // Логирование для отладки
  useEffect(() => {
    console.log('[Regulations] State:', {
      loading,
      regulationsCount: regulations.length,
      sourcesCount: Object.keys(regulationsBySource).length,
      sources: Object.keys(regulationsBySource),
    });
  }, [loading, regulations.length, regulationsBySource]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div id="main-content" role="main" style={{ marginLeft: '280px', flex: 1, padding: '32px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Logo size="large" />
          <p style={{ fontSize: '16px', color: '#666', marginTop: '16px', marginBottom: '24px' }}>
            Нормативные документы и стандарты гражданской авиации
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Нормативные документы
          </h2>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Международные и российские нормативные документы по гражданской авиации
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#666' }}>Загрузка документов...</div>
          </div>
        ) : regulations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '16px' }}>Нормативные документы не найдены</div>
            <div style={{ fontSize: '14px', color: '#999', marginBottom: '16px' }}>
              Загружено: {regulations.length} документов
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetch('/api/regulations')
                  .then(res => res.json())
                  .then(data => {
                    console.log('[Regulations] Reload response:', data);
                    const regulationsArray = Array.isArray(data) ? data : (data?.documents || data?.data || []);
                    setRegulations(regulationsArray);
                  })
                  .catch(err => console.error('Ошибка загрузки:', err))
                  .finally(() => setLoading(false));
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Повторить загрузку
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {Object.entries(regulationsBySource).map(([source, sourceRegulations]) => (
              <div key={source} style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
                  {source}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                  {sourceRegulations.map((regulation) => (
                    <div
                      key={regulation.id}
                      onClick={() => handleViewRegulation(regulation)}
                      style={{
                        padding: '16px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        {regulation.title}
                      </div>
                      {regulation.version && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Версия: {regulation.version}
                        </div>
                      )}
                      {regulation.lastUpdated && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          Дата: {new Date(regulation.lastUpdated).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedRegulation && (
          <RegulationViewModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedRegulation(null);
            }}
            document={selectedRegulation}
          />
        )}
      </div>
    </div>
  );
}
