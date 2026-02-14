'use client';
import { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui';

interface Props { isOpen: boolean; onClose: () => void; }

interface Message { role: 'user' | 'assistant' | 'system'; content: string; ts: number; }

export default function AIAgentModal({ isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([{ role: 'system', content: 'AI-ассистент КЛГ АСУ ТК готов к работе. Задайте вопрос о лётной годности, нормативных документах или данных в системе.', ts: Date.now() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim(), ts: Date.now() };
    setMessages(m => [...m, userMsg]);
    setInput(''); setLoading(true);
    try {
      const res = await fetch('/api/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) }) });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: data.content || data.message || 'Нет ответа', ts: Date.now() }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: `Ошибка: ${e.message}. Проверьте подключение к AI API.`, ts: Date.now() }]);
    } finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🤖 AI Ассистент" size="lg">
      <div className="flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                m.role === 'user' ? 'bg-primary-500 text-white rounded-br-sm' :
                m.role === 'system' ? 'bg-gray-100 text-gray-500 italic' :
                'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>{new Date(m.ts).toLocaleTimeString('ru-RU')}</div>
              </div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-gray-100 px-4 py-3 rounded-xl text-gray-400">Думаю...</div></div>}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 shrink-0">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Задайте вопрос..." className="input-field flex-1" disabled={loading} />
          <button onClick={send} disabled={loading || !input.trim()} className="btn-primary disabled:opacity-50">Отправить</button>
        </div>
      </div>
    </Modal>
  );
}
