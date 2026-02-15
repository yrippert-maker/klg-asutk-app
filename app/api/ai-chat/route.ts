export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';
import { logAudit, logSecurity, logError, logWarn } from '@/lib/logger';
import { sanitizeText } from '@/lib/sanitize';
import { recordPerformance } from '@/lib/monitoring/metrics';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const limitCheck = rateLimit(identifier, 50, 60000);
    if (!limitCheck.allowed) {
      logSecurity('Rate limit exceeded', { identifier, path: '/api/ai-chat' });
      recordPerformance('/api/ai-chat', Date.now() - startTime, 429, { method: 'POST' });
      return NextResponse.json(
        {
          error: 'Превышен лимит запросов. Попробуйте позже.',
          code: 'RATE_LIMIT_EXCEEDED',
          resetTime: limitCheck.resetTime,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '50',
            'X-RateLimit-Remaining': limitCheck.remaining.toString(),
            'X-RateLimit-Reset': limitCheck.resetTime.toString(),
          },
        }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let message = '';
    let history: { role: string; content: string }[] = [];
    let files: any[] = [];
    const fileContents: Array<{ name: string; type: string; content: string }> = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      message = (formData.get('message') as string) || '';
      const historyStr = formData.get('history') as string;
      if (historyStr) {
        try {
          history = JSON.parse(historyStr);
        } catch {
          history = [];
        }
      }
      const fileCount = parseInt((formData.get('fileCount') as string) || '0');
      for (let i = 0; i < fileCount; i++) {
        const file = formData.get(`file_${i}`) as File;
        if (file) {
          files.push({ name: file.name, size: file.size, type: file.type });
          try {
            const { parseDocument } = await import('@/lib/ai/document-parser');
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const content = await parseDocument(buffer, file.name, file.type);
            fileContents.push({ name: file.name, type: file.type, content });
          } catch (err) {
            logError(`Ошибка парсинга файла ${file.name}`, err);
            fileContents.push({
              name: file.name,
              type: file.type,
              content: `[Не удалось прочитать файл: ${file.name}]`,
            });
          }
        }
      }
    } else {
      const body = await request.json();
      message = body.message || '';
      history = body.history || [];
      files = body.files || [];
    }

    message = sanitizeText(message);
    if (Array.isArray(history)) {
      history = history.map((msg: any) => ({
        ...msg,
        content: sanitizeText(msg.content || ''),
      }));
    }

    logAudit('AI_CHAT_REQUEST', 'ai-chat', {
      identifier,
      messageLength: message.length,
      hasFiles: files?.length > 0,
    });

    const authHeader =
      request.headers.get('authorization') ||
      (request.cookies.get('auth-token')?.value ? `Bearer ${request.cookies.get('auth-token').value}` : null);

    const dataContext =
      '\n\nДоступные базы данных в системе:\n' +
      '- Воздушные суда, нормативные документы, организации, риски, аудиты, чек-листы, заявки, пользователи, документы';

    let prompt = message;
    if (history?.length) {
      const historyText = history
        .map((m: any) => `${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${m.content}`)
        .join('\n\n');
      prompt = `[Предыдущий диалог]\n${historyText}\n\n[Текущий вопрос]\n${message}`;
    }
    if (fileContents.length > 0) {
      prompt +=
        '\n\n[СОДЕРЖИМОЕ ФАЙЛОВ]\n' +
        fileContents
          .map(
            (f) =>
              `Файл: ${f.name}\n${f.content.substring(0, 5000)}${f.content.length > 5000 ? '...' : ''}`
          )
          .join('\n\n---\n\n') +
        '\n[КОНЕЦ СОДЕРЖИМОГО ФАЙЛОВ]';
    }

    const backendChatUrl = `${BACKEND_URL.replace(/\/$/, '')}/api/v1/ai/chat`;
    const res = await fetch(backendChatUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        prompt,
        task: 'chat',
        context: dataContext,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      if (res.status === 503) {
        return NextResponse.json({
          response: `${generateMockResponse(message, files)}\n\n⚠️ Примечание: AI-сервис (Anthropic Claude) недоступен. Проверьте ANTHROPIC_API_KEY на бэкенде.`,
          timestamp: new Date().toISOString(),
        });
      }
      recordPerformance('/api/ai-chat', Date.now() - startTime, res.status, { method: 'POST' });
      return NextResponse.json(
        { error: errBody.detail || 'AI-сервис недоступен' },
        { status: res.status }
      );
    }

    const data = await res.json();
    recordPerformance('/api/ai-chat', Date.now() - startTime, 200, { method: 'POST' });
    return NextResponse.json({
      response: data.result || 'Извините, не удалось получить ответ.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logError('Ошибка AI chat (Anthropic proxy)', error);
    return handleError(error, { path: '/api/ai-chat', method: 'POST' });
  }
}

function generateMockResponse(message: string, files: any[]): string {
  const lower = message.toLowerCase();
  if (lower.includes('добавить') || lower.includes('создать')) {
    if (lower.includes('вс') || lower.includes('воздушн')) {
      return 'Для добавления воздушного судна нужны: регистрационный номер, серийный номер, тип ВС, оператор, статус.';
    }
    if (lower.includes('риск')) {
      return 'Для добавления риска укажите: название, уровень (Критический/Высокий/Средний/Низкий), категорию, ВС, описание.';
    }
  }
  if (lower.includes('найти') || lower.includes('поиск')) {
    return 'Могу помочь с поиском: ВС по номеру, риски по уровню, документы, аудиты. Уточните, что искать?';
  }
  if (files?.length) {
    return `Получено ${files.length} файл(ов). Анализирую содержимое. При наличии структурированных данных предложу внести их в базу.`;
  }
  return 'Я AI-ассистент системы контроля лётной годности (Anthropic Claude). Могу помочь с данными, поиском, анализом файлов и отчётами. Что нужно?';
}
