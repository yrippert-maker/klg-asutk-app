'use client';

export default function AIAccessSettings() {
  const users = [
    { id: '1', name: 'Иванов И.И.', email: 'ivanov@klg.ru', role: 'Оператор', hasAccess: true },
    { id: '2', name: 'Петров П.П.', email: 'petrov@klg.ru', role: 'Оператор', hasAccess: false },
    { id: '3', name: 'Сидоров С.С.', email: 'sidorov@klg.ru', role: 'Оператор', hasAccess: true },
  ];

  return (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>
        Управление доступом к ИИ агенту
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            border: '1px solid #2196f3',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
            ℹ️ Информация
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ИИ агент может анализировать документы и автоматически вносить данные в карточки ВС,
            аудитов и чек-листов. Наделите операторов доступом для использования этой функции.
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
            Операторы с доступом к ИИ агенту
          </label>
          <div
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {users.map((user) => (
                <div
                  key={user.id}
                  style={{
                    padding: '12px',
                    backgroundColor: user.hasAccess ? '#e8f5e9' : '#f5f5f5',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{user.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {user.email} • {user.role}
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={user.hasAccess}
                      onChange={(e) => {
                        console.log(`Доступ для ${user.name}: ${e.target.checked}`);
                      }}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '12px', color: user.hasAccess ? '#4caf50' : '#666' }}>
                      {user.hasAccess ? 'Доступ разрешён' : 'Доступ запрещён'}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>Полный доступ ИИ агенту</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Разрешить ИИ агенту автоматически вносить данные в карточки ВС, аудитов и чек-листов
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500' }}>
              Автоматическая обработка документов
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ИИ агент будет автоматически извлекать данные из загруженных документов (PDF, XLS,
              CSV, изображения)
            </div>
          </div>
        </label>

        <div
          style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            borderRadius: '4px',
            border: '1px solid #ffc107',
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>⚠️ Важно</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            Все действия ИИ агента логируются в системе аудита. Рекомендуется проверять
            автоматически внесённые данные перед их сохранением.
          </div>
        </div>
      </div>
    </div>
  );
}
