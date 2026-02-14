'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui';
import FormField from '@/components/ui/FormField';

interface Props { isOpen: boolean; onClose: () => void; onCreate: (data: any) => void; }

export default function ChecklistCreateModal({ isOpen, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('ФАП-М');
  const [items, setItems] = useState<{ code: string; text: string }[]>([{ code: 'P.001', text: '' }]);

  const addItem = () => setItems([...items, { code: `P.${String(items.length + 1).padStart(3, '0')}`, text: '' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string) => setItems(items.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  const handleCreate = () => {
    if (!name.trim()) return alert('Укажите название');
    const validItems = items.filter(it => it.text.trim());
    onCreate({ name, domain, version: 1, items: validItems.map((it, i) => ({ ...it, sort_order: i + 1 })) });
    setName(''); setItems([{ code: 'P.001', text: '' }]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Создать чек-лист" size="lg"
      footer={<><button onClick={onClose} className="btn-secondary">Отмена</button><button onClick={handleCreate} className="btn-primary">Создать</button></>}>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <FormField label="Название" required><input value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Чек-лист инспекции" /></FormField>
        <FormField label="Домен">
          <select value={domain} onChange={e => setDomain(e.target.value)} className="input-field">
            <option>ФАП-М</option><option>ATA</option><option>REFLY_CSV</option><option>CSV</option><option>custom</option>
          </select>
        </FormField>
      </div>
      <div className="mb-3 flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-600">Пункты проверки ({items.length})</h4>
        <button onClick={addItem} className="btn-sm bg-green-500 text-white">+ Добавить пункт</button>
      </div>
      <div className="max-h-80 overflow-y-auto space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={item.code} onChange={e => updateItem(i, 'code', e.target.value)}
              className="input-field w-24 text-xs font-mono" placeholder="P.001" />
            <input value={item.text} onChange={e => updateItem(i, 'text', e.target.value)}
              className="input-field flex-1" placeholder="Текст пункта проверки..." />
            <button onClick={() => removeItem(i)} className="btn-sm bg-red-100 text-red-600 hover:bg-red-200" title="Удалить">×</button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
