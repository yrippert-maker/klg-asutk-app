'use client';

import { Aircraft } from '@/lib/api/api-client';

interface AircraftTableProps {
  aircraft: Aircraft[];
}

export default function AircraftTable({ aircraft }: AircraftTableProps) {
  if (aircraft.length === 0) {
    return (
      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '20px', marginRight: '12px' }}>ℹ️</span>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Нет данных</div>
          <div style={{ fontSize: '14px' }}>
            Воздушные суда не найдены. Проверьте подключение к API.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
        <thead>
          <tr style={{ backgroundColor: '#1e3a5f', color: 'white' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
              РЕГИСТРАЦИОННЫЙ НОМЕР
            </th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
              СЕРИЙНЫЙ НОМЕР
            </th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
              ТИП ВС
            </th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
              ОПЕРАТОР
            </th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
              СТАТУС
            </th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
              НАЛЕТ (Ч)
            </th>
            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold' }}>
              ДЕЙСТВИЯ
            </th>
          </tr>
        </thead>
        <tbody>
          {aircraft.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={{ padding: '12px' }}>{item.registrationNumber}</td>
              <td style={{ padding: '12px' }}>{item.serialNumber}</td>
              <td style={{ padding: '12px' }}>{item.aircraftType}</td>
              <td style={{ padding: '12px' }}>{item.operator}</td>
              <td style={{ padding: '12px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: item.status === 'Активен' ? '#4caf50' : '#ff9800',
                  color: 'white',
                }}>
                  {item.status}
                </span>
              </td>
              <td style={{ padding: '12px' }}>{item.flightHours}</td>
              <td style={{ padding: '12px' }}>
                <button
                  onClick={() => alert(`Действия для ВС ${item.registrationNumber}`)}
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
                  Действия
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
