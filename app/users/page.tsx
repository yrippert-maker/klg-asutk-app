'use client';
import { useState, useEffect, useMemo } from 'react';
import UserEditModal from '@/components/UserEditModal';
import { PageLayout, DataTable, StatusBadge, Modal } from '@/components/ui';

const RL: Record<string, string> = { admin: 'Администратор', authority_inspector: 'Инспектор', favt_inspector: 'Инспектор ФАВТ', operator_manager: 'Менеджер оператора', operator_user: 'Оператор', mro_manager: 'Менеджер ТОиР', mro_specialist: 'Специалист ТОиР', mro_user: 'Специалист ТОиР', engineer: 'Инженер', inspector: 'Инспектор' };
const RC: Record<string, string> = { admin: 'bg-green-500', authority_inspector: 'bg-blue-500', favt_inspector: 'bg-blue-500', operator_manager: 'bg-orange-500', operator_user: 'bg-orange-400', mro_manager: 'bg-purple-500', mro_specialist: 'bg-purple-400', mro_user: 'bg-purple-400', engineer: 'bg-teal-500', inspector: 'bg-indigo-500' };

const DEMO_USERS = [
  { id: '1', display_name: 'Иванов Иван Иванович', email: 'ivanov@company.ru', role: 'admin', organization_name: 'АО «Авиакомпания»', status: 'active', last_login: '2024-12-01T10:00:00Z' },
  { id: '2', display_name: 'Петрова Мария Сергеевна', email: 'petrova@favt.gov.ru', role: 'authority_inspector', organization_name: 'ФАВТ', status: 'active', last_login: '2024-12-02T09:15:00Z' },
  { id: '3', display_name: 'Сидоров Пётр Андреевич', email: 'sidorov@operator.ru', role: 'operator_manager', organization_name: 'ООО «АвиаСервис»', status: 'active', last_login: '2024-11-28T14:20:00Z' },
  { id: '4', display_name: 'Козлова Анна Викторовна', email: 'kozlova@mro.ru', role: 'mro_manager', organization_name: 'ПАО «ТОиР»', status: 'active', last_login: '2024-12-01T08:00:00Z' },
  { id: '5', display_name: 'Новиков Алексей Дмитриевич', email: 'novikov@company.ru', role: 'engineer', organization_name: 'АО «Авиакомпания»', status: 'active', last_login: '2024-11-30T16:45:00Z' },
  { id: '6', display_name: 'Морозова Елена Игоревна', email: 'morozova@favt.gov.ru', role: 'inspector', organization_name: 'Ространснадзор', status: 'active', last_login: '2024-11-29T11:00:00Z' },
  { id: '7', display_name: 'Волков Дмитрий Николаевич', email: 'volkov@operator.ru', role: 'operator_user', organization_name: 'ООО «АвиаСервис»', status: 'active', last_login: '2024-11-27T12:30:00Z' },
  { id: '8', display_name: 'Соколова Ольга Павловна', email: 'sokolova@mro.ru', role: 'mro_specialist', organization_name: 'ПАО «ТОиР»', status: 'inactive', last_login: '2024-10-15T09:00:00Z' },
  { id: '9', display_name: 'Лебедев Андрей Владимирович', email: 'lebedev@company.ru', role: 'operator_user', organization_name: 'АО «Авиакомпания»', status: 'active', last_login: '2024-12-02T07:20:00Z' },
  { id: '10', display_name: 'Кузнецова Татьяна Александровна', email: 'kuznetsova@favt.gov.ru', role: 'favt_inspector', organization_name: 'Минтранс / ФАВТ', status: 'active', last_login: '2024-12-01T15:10:00Z' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [orgFilter, setOrgFilter] = useState('');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ display_name: '', email: '', role: 'operator_user', organization_name: '' });
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/users')
      .then(r => r.json())
      .then(d => setUsers(Array.isArray(d?.items) && d.items.length > 0 ? d.items : DEMO_USERS))
      .catch(() => setUsers(DEMO_USERS))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter) list = list.filter(u => u.role === roleFilter);
    if (orgFilter) list = list.filter(u => (u.organization_name || '').toLowerCase().includes(orgFilter.toLowerCase()));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.display_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, roleFilter, orgFilter, search]);

  const handleSaveEdit = (payload: any) => {
    if (editingUser?.id) setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...payload } : u));
    setEditingUser(null);
  };

  const handleAdd = () => {
    setUsers(prev => [{ ...addForm, id: String(Date.now()), organization_name: addForm.organization_name || '—', status: 'active', last_login: null }, ...prev]);
    setAddOpen(false);
    setAddForm({ display_name: '', email: '', role: 'operator_user', organization_name: '' });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить пользователя?')) return;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleExport = () => {
    const headers = ['ФИО', 'Email', 'Роль', 'Организация', 'Статус', 'Последний вход'];
    const rows = filtered.map(u => [
      u.display_name || '',
      u.email || '',
      RL[u.role] || u.role,
      u.organization_name || '',
      u.status === 'active' ? 'Активен' : 'Неактивен',
      u.last_login ? new Date(u.last_login).toLocaleString('ru-RU') : '—',
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const rolesForFilter = Array.from(new Set(users.map(u => u.role).filter(Boolean)));

  return (
    <PageLayout
      title="Пользователи"
      subtitle={loading ? 'Загрузка...' : `Всего: ${filtered.length}`}
      actions={
        <>
          <input type="text" placeholder="Поиск (ФИО, email)..." value={search} onChange={e => setSearch(e.target.value)} className="input-field w-56" />
          <select value={roleFilter ?? ''} onChange={e => setRoleFilter(e.target.value || undefined)} className="input-field w-40">
            <option value="">Все роли</option>
            {rolesForFilter.map(r => <option key={r} value={r}>{RL[r] || r}</option>)}
          </select>
          <input type="text" placeholder="Организация..." value={orgFilter} onChange={e => setOrgFilter(e.target.value)} className="input-field w-48" />
          <button onClick={handleExport} className="btn-sm bg-gray-100 text-gray-700">Экспорт</button>
          <button onClick={() => setAddOpen(true)} className="btn-primary">+ Добавить пользователя</button>
        </>
      }
    >
      {loading ? <div className="text-center py-10 text-gray-400">⏳ Загрузка...</div> : filtered.length > 0 ? (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50">
              <th className="table-header">ФИО</th><th className="table-header">Email</th><th className="table-header">Роль</th>
              <th className="table-header">Организация</th><th className="table-header">Статус</th><th className="table-header">Последний вход</th><th className="table-header">Действия</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="table-cell font-medium">{u.display_name || '—'}</td>
                  <td className="table-cell text-gray-600">{u.email || '—'}</td>
                  <td className="table-cell"><StatusBadge status={u.role} colorMap={RC} labelMap={RL} /></td>
                  <td className="table-cell text-gray-600">{u.organization_name || '—'}</td>
                  <td className="table-cell"><span className={`badge ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{u.status === 'active' ? 'Активен' : 'Неактивен'}</span></td>
                  <td className="table-cell text-sm text-gray-500">{u.last_login ? new Date(u.last_login).toLocaleString('ru-RU') : '—'}</td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <button onClick={() => setEditingUser(u)} className="btn-sm bg-gray-100 text-gray-600 hover:bg-gray-200 p-1.5 rounded" title="Редактировать">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="btn-sm bg-red-100 text-red-600 hover:bg-red-200">Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="card p-5 bg-blue-50 flex items-center gap-3"><span>ℹ️</span><span>Нет пользователей</span></div>}

      <UserEditModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} onSave={handleSaveEdit} />

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Добавить пользователя" size="md"
        footer={<><button onClick={() => setAddOpen(false)} className="btn-secondary">Отмена</button><button onClick={handleAdd} className="btn-primary">Добавить</button></>}>
        <div className="space-y-3">
          <div><label className="text-xs font-medium text-gray-600">ФИО</label><input value={addForm.display_name} onChange={e => setAddForm(f => ({ ...f, display_name: e.target.value }))} className="input-field w-full mt-1" placeholder="Иванов И. И." /></div>
          <div><label className="text-xs font-medium text-gray-600">Email</label><input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className="input-field w-full mt-1" placeholder="user@company.ru" /></div>
          <div><label className="text-xs font-medium text-gray-600">Роль</label><select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className="input-field w-full mt-1">{Object.entries(RL).slice(0, 10).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="text-xs font-medium text-gray-600">Организация</label><input value={addForm.organization_name} onChange={e => setAddForm(f => ({ ...f, organization_name: e.target.value }))} className="input-field w-full mt-1" placeholder="Организация" /></div>
        </div>
      </Modal>
    </PageLayout>
  );
}
