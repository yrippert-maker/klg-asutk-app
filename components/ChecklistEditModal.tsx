'use client';

import { useState } from 'react';
import { checklistsApi } from '@/lib/api/api-client';

export interface ChecklistEditModalTemplate {
  id: string;
  name: string;
  description?: string | null;
  domain?: string | null;
  version: number;
  items: { id: string; code: string; text: string; sort_order: number }[];
}

interface Props {
  template: ChecklistEditModalTemplate;
  onClose: () => void;
  onSaved: () => void;
}

export default function ChecklistEditModal({ template, onClose, onSaved }: Props) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? '');
  const [savingHeader, setSavingHeader] = useState(false);
  const [items, setItems] = useState(template.items);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editText, setEditText] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newText, setNewText] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const saveHeader = async () => {
    setSavingHeader(true);
    try {
      await checklistsApi.updateTemplate(template.id, {
        name: name.trim() || template.name,
        description: description.trim() || null,
      });
      onSaved();
    } finally {
      setSavingHeader(false);
    }
  };

  const startEdit = (item: { id: string; code: string; text: string }) => {
    setEditingId(item.id);
    setEditCode(item.code);
    setEditText(item.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await checklistsApi.updateItem(editingId, { code: editCode.trim(), text: editText.trim() });
      setItems((prev) =>
        prev.map((i) => (i.id === editingId ? { ...i, code: editCode.trim(), text: editText.trim() } : i))
      );
      setEditingId(null);
      onSaved();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Удалить пункт?')) return;
    setDeletingId(itemId);
    try {
      await checklistsApi.deleteItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const addItem = async () => {
    const code = newCode.trim();
    const text = newText.trim();
    if (!code || !text) return;
    setAdding(true);
    try {
      const created = await checklistsApi.addItem(template.id, {
        code,
        text,
        domain: template.domain ?? undefined,
        sort_order: items.length + 1,
      });
      setItems((prev) => [...prev, created]);
      setNewCode('');
      setNewText('');
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 p-4">
          <div className="mb-2">
            <label className="text-xs text-gray-500">Название</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="mb-2">
            <label className="text-xs text-gray-500">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={saveHeader}
            disabled={savingHeader}
            className="rounded bg-primary-500 px-3 py-1.5 text-sm text-white hover:bg-primary-600 disabled:opacity-50"
          >
            {savingHeader ? 'Сохранение…' : 'Сохранить заголовок'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="group flex items-start gap-2 rounded border border-gray-100 bg-gray-50/50 p-2"
              >
                <span className="w-6 shrink-0 text-xs text-gray-400">{idx + 1}</span>
                {editingId === item.id ? (
                  <>
                    <input
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      placeholder="Код"
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Текст"
                      className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                    >
                      Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded bg-gray-400 px-2 py-1 text-xs text-white hover:bg-gray-500"
                    >
                      Отмена
                    </button>
                  </>
                ) : (
                  <>
                    <span className="min-w-[80px] shrink-0 text-xs font-medium text-primary-600">{item.code}</span>
                    <span className="min-w-0 flex-1 text-sm text-gray-800">{item.text}</span>
                    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded p-1 hover:bg-gray-200"
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteItem(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded p-1 hover:bg-red-100 disabled:opacity-50"
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-2 rounded border border-dashed border-gray-300 bg-gray-50/50 p-3">
            <div>
              <label className="text-xs text-gray-500">Код</label>
              <input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Напр. 148.16"
                className="ml-1 w-28 rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="min-w-0 flex-1">
              <label className="text-xs text-gray-500">Текст</label>
              <input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Текст пункта"
                className="ml-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={addItem}
              disabled={adding || !newCode.trim() || !newText.trim()}
              className="rounded bg-primary-500 px-3 py-1.5 text-sm text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {adding ? '…' : 'Добавить'}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
          <span>
            {template.domain ?? '—'} · v{template.version} · {items.length} пунктов
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-gray-200 px-3 py-1.5 hover:bg-gray-300"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
