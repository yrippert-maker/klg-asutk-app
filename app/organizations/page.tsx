'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import OrganizationDetailsModal from '@/components/OrganizationDetailsModal';
import OrganizationCreateModal from '@/components/OrganizationCreateModal';
import OrganizationEditModal from '@/components/OrganizationEditModal';
import SearchModal from '@/components/SearchModal';
import Logo from '@/components/Logo';
import { aircraftApi, Aircraft } from '@/lib/api';

export default function OrganizationsPage() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<Map<string, Aircraft[]>>(new Map());
  const [selectedOrganization, setSelectedOrganization] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchOrganization, setSearchOrganization] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<{ name: string; type?: string; address?: string; contact?: string; email?: string; phone?: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await aircraftApi.getAircraft();
        setAircraft(data);
        
        // Группируем по операторам
        const operatorsMap = new Map<string, Aircraft[]>();
        data.forEach(a => {
          const operator = a.operator && a.operator !== 'Не указан' ? a.operator : 'Не указан';
          if (!operatorsMap.has(operator)) {
            operatorsMap.set(operator, []);
          }
          operatorsMap.get(operator)!.push(a);
        });
        
        setOperators(operatorsMap);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const operatorsList = Array.from(operators.entries()).sort((a, b) => b[1].length - a[1].length);

  const handleShowDetails = (operator: string) => {
    setSelectedOrganization(operator);
    setIsDetailsModalOpen(true);
  };

  const handleSearch = (operator: string) => {
    setSearchOrganization(operator);
    setIsSearchModalOpen(true);
  };

  const handleEditAircraft = (editedAircraft: Aircraft) => {
    // Обновляем данные в состоянии
    setAircraft(prev => prev.map(a => a.id === editedAircraft.id ? editedAircraft : a));
    
    // Обновляем группировку по операторам
    const operatorsMap = new Map<string, Aircraft[]>();
    const updatedAircraft = aircraft.map(a => a.id === editedAircraft.id ? editedAircraft : a);
    updatedAircraft.forEach(a => {
      const operator = a.operator && a.operator !== 'Не указан' ? a.operator : 'Не указан';
      if (!operatorsMap.has(operator)) {
        operatorsMap.set(operator, []);
      }
      operatorsMap.get(operator)!.push(a);
    });
    setOperators(operatorsMap);
    
    alert(`Данные воздушного судна ${editedAircraft.registrationNumber} обновлены`);
  };

  const getOrganizationAircraft = (operator: string): Aircraft[] => {
    return operators.get(operator) || [];
  };

  const getSearchAircraft = (): Aircraft[] => {
    // Если searchOrganization null, ищем по всем aircraft
    // Если указана организация, ищем только в её aircraft
    if (searchOrganization === null) {
      return aircraft;
    }
    return operators.get(searchOrganization) || [];
  };

  const handleCreateOrganization = (organizationData: any) => {
    // Здесь можно добавить логику сохранения новой организации
    // Пока просто показываем уведомление
    alert(`Организация "${organizationData.name}" успешно создана`);
    // В реальном приложении здесь был бы вызов API для сохранения
  };

  const handleEdit = (operator: string) => {
    // Создаём объект организации из названия оператора
    setEditingOrganization({
      name: operator,
      type: 'Авиакомпания', // По умолчанию, можно будет изменить в форме
    });
    setIsEditModalOpen(true);
  };

  const handleSaveOrganization = (updatedOrganization: any) => {
    // Здесь можно добавить логику обновления организации
    // Пока просто показываем уведомление
    alert(`Организация "${updatedOrganization.name}" успешно обновлена`);
    // В реальном приложении здесь был бы вызов API для обновления
    // Также нужно обновить названия операторов в aircraft, если изменилось название организации
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
              Организации
            </h2>
            <p style={{ fontSize: '14px', color: '#666' }}>
              Управление организациями и операторами воздушных судов
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setSearchOrganization(null);
                setIsSearchModalOpen(true);
              }}
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
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#1e3a5f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Добавить организацию
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div>Загрузка данных...</div>
          </div>
        ) : operatorsList.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {operatorsList.map(([operator, aircraftList]) => (
              <div key={operator} style={{
                backgroundColor: 'white',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {operator}
                    </h3>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      {aircraftList.length} воздушных судов
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleSearch(operator)}
                      style={{
                        padding: '8px 16px',
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
                      onClick={() => handleShowDetails(operator)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#e0e0e0',
                        color: '#333',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      Подробнее
                    </button>
                    <button
                      onClick={() => handleEdit(operator)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#1e3a5f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '12px',
                }}>
                  {aircraftList.slice(0, 5).map(a => (
                    <div key={a.id} style={{
                      padding: '12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}>
                      <div style={{ fontWeight: '500' }}>{a.registrationNumber}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{a.aircraftType}</div>
                    </div>
                  ))}
                  {aircraftList.length > 5 && (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      +{aircraftList.length - 5} ещё
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '20px',
            borderRadius: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px', marginRight: '12px' }}>ℹ️</span>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Нет данных</div>
                <div style={{ fontSize: '14px' }}>
                  Организации не найдены. Проверьте данные реестра.
                </div>
              </div>
            </div>
          </div>
        )}

        <OrganizationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedOrganization(null);
          }}
          organization={selectedOrganization || ''}
          aircraft={selectedOrganization ? getOrganizationAircraft(selectedOrganization) : []}
          onEdit={handleEditAircraft}
        />

        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => {
            setIsSearchModalOpen(false);
            setSearchOrganization(null);
          }}
          aircraft={getSearchAircraft()}
          searchType="organization"
        />

        <OrganizationCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateOrganization}
        />

        <OrganizationEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingOrganization(null);
          }}
          organization={editingOrganization}
          onSave={handleSaveOrganization}
        />
      </div>
    </div>
  );
}
