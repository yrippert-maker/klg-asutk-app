import { loadAircraftRegistry } from '@/lib/load-registry';
import { RegulationDocument } from '@/lib/regulations';

/**
 * Вспомогательные функции для получения данных для ИИ агента
 * Используется внутри серверных API routes
 */
export async function getDataForAI(dataType: string, filters?: any) {
  switch (dataType) {
    case 'aircraft':
      return await getAircraftData(filters);
    case 'regulations':
      return await getRegulationsData(filters);
    case 'organizations':
      return await getOrganizationsData(filters);
    case 'risks':
      return await getRisksData(filters);
    case 'audits':
      return await getAuditsData(filters);
    case 'checklists':
      return await getChecklistsData(filters);
    case 'applications':
      return await getApplicationsData(filters);
    case 'users':
      return await getUsersData(filters);
    case 'documents':
      return await getDocumentsData(filters);
    default:
      return null;
  }
}

async function getAircraftData(filters?: any) {
  try {
    const aircraft = await loadAircraftRegistry();
    
    let filtered = aircraft;
    if (filters) {
      if (filters.registrationNumber) {
        filtered = filtered.filter((a: any) => 
          a.registrationNumber?.toLowerCase().includes(filters.registrationNumber.toLowerCase())
        );
      }
      if (filters.operator) {
        filtered = filtered.filter((a: any) => 
          a.operator?.toLowerCase().includes(filters.operator.toLowerCase())
        );
      }
      if (filters.type) {
        filtered = filtered.filter((a: any) => 
          a.aircraftType?.toLowerCase().includes(filters.type.toLowerCase())
        );
      }
      if (filters.status) {
        filtered = filtered.filter((a: any) => a.status === filters.status);
      }
    }
    
    return {
      dataType: 'aircraft',
      count: filtered.length,
      data: filtered,
    };
  } catch (error) {
    const mockAircraft = [
      { id: '1', registrationNumber: 'RA-12345', serialNumber: 'SN-001', aircraftType: 'Boeing 737-800', operator: 'Аэрофлот', status: 'Активен', flightHours: 12500 },
      { id: '2', registrationNumber: 'RA-67890', serialNumber: 'SN-002', aircraftType: 'Airbus A320', operator: 'S7 Airlines', status: 'Активен', flightHours: 8900 },
      { id: '3', registrationNumber: 'RA-11111', serialNumber: 'SN-003', aircraftType: 'Boeing 777-300ER', operator: 'Аэрофлот', status: 'На обслуживании', flightHours: 15200 },
    ];
    return {
      dataType: 'aircraft',
      count: mockAircraft.length,
      data: mockAircraft,
    };
  }
}

async function getRegulationsData(_filters?: any) {
  const mockRegulations: RegulationDocument[] = [
    {
      id: 'chicago-convention',
      title: 'Конвенция о международной гражданской авиации (Chicago Convention)',
      source: 'ICAO',
      type: 'convention',
      category: 'Основополагающий документ',
      version: '2024',
      lastUpdated: new Date().toISOString(),
      content: 'Конвенция о международной гражданской авиации...',
    },
  ];
  
  return {
    dataType: 'regulations',
    count: mockRegulations.length,
    data: mockRegulations,
  };
}

async function getOrganizationsData(_filters?: any) {
  const mockOrganizations = [
    { id: '1', name: 'Аэрофлот', type: 'Авиакомпания', aircraftCount: 150, status: 'Активна' },
    { id: '2', name: 'S7 Airlines', type: 'Авиакомпания', aircraftCount: 95, status: 'Активна' },
    { id: '3', name: 'Уральские авиалинии', type: 'Авиакомпания', aircraftCount: 45, status: 'Активна' },
  ];
  
  return {
    dataType: 'organizations',
    count: mockOrganizations.length,
    data: mockOrganizations,
  };
}

async function getRisksData(_filters?: any) {
  const mockRisks = [
    { id: '1', title: 'Высокий износ двигателя', level: 'Высокий', category: 'Техническое состояние', aircraft: 'RA-12345', status: 'Требует внимания', date: '2025-01-20' },
    { id: '2', title: 'Недостаточное техническое обслуживание', level: 'Средний', category: 'Обслуживание', aircraft: 'RA-67890', status: 'В работе', date: '2025-01-19' },
    { id: '3', title: 'Критическая неисправность системы управления', level: 'Критический', category: 'Техническое состояние', aircraft: 'RA-11111', status: 'Требует внимания', date: '2025-01-21' },
  ];
  
  return {
    dataType: 'risks',
    count: mockRisks.length,
    data: mockRisks,
  };
}

async function getAuditsData(_filters?: any) {
  const mockAudits = [
    { id: '1', organization: 'Аэрофлот', type: 'Плановый', status: 'Запланирован', date: '2025-02-01', result: null },
    { id: '2', organization: 'S7 Airlines', type: 'Внеплановый', status: 'В процессе', date: '2025-01-21', result: null },
    { id: '3', organization: 'Уральские авиалинии', type: 'Плановый', status: 'Завершён', date: '2024-12-15', result: 'Соответствует требованиям' },
  ];
  
  return {
    dataType: 'audits',
    count: mockAudits.length,
    data: mockAudits,
  };
}

async function getChecklistsData(_filters?: any) {
  const mockChecklists = [
    { id: '1', name: 'Предполетный осмотр', type: 'Ежедневный', aircraft: 'RA-12345', status: 'Выполнен', date: '2025-01-20' },
    { id: '2', name: 'Техническое обслуживание', type: 'Периодический', aircraft: 'RA-67890', status: 'В процессе', date: '2025-01-21' },
  ];
  
  return {
    dataType: 'checklists',
    count: mockChecklists.length,
    data: mockChecklists,
  };
}

async function getApplicationsData(_filters?: any) {
  const mockApplications = [
    { id: '1', type: 'Сертификация ВС', aircraft: 'RA-12345', status: 'На рассмотрении', date: '2025-01-15' },
    { id: '2', type: 'Разрешение на эксплуатацию', aircraft: 'RA-67890', status: 'Одобрена', date: '2025-01-10' },
  ];
  
  return {
    dataType: 'applications',
    count: mockApplications.length,
    data: mockApplications,
  };
}

async function getUsersData(_filters?: any) {
  const mockUsers = [
    { id: '1', name: 'Иванов И.И.', role: 'Администратор', email: 'ivanov@example.com', status: 'Активен' },
    { id: '2', name: 'Петров П.П.', role: 'Инженер', email: 'petrov@example.com', status: 'Активен' },
    { id: '3', name: 'Сидоров С.С.', role: 'Аудитор', email: 'sidorov@example.com', status: 'Активен' },
  ];
  
  return {
    dataType: 'users',
    count: mockUsers.length,
    data: mockUsers,
  };
}

async function getDocumentsData(_filters?: any) {
  const mockDocuments = [
    { id: '1', name: 'Сертификат лётной годности', type: 'Сертификат', aircraft: 'RA-12345', date: '2025-01-15', status: 'Действителен' },
    { id: '2', name: 'Техническая документация', type: 'Техническая', aircraft: 'RA-67890', date: '2025-01-10', status: 'Действителен' },
    { id: '3', name: 'Отчёт о техническом обслуживании', type: 'Отчёт', aircraft: 'RA-11111', date: '2025-01-20', status: 'Требует обновления' },
  ];
  
  return {
    dataType: 'documents',
    count: mockDocuments.length,
    data: mockDocuments,
  };
}
