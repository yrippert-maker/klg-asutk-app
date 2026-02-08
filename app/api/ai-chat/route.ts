export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';
import { logAudit, logSecurity, logError, logWarn } from '@/lib/logger';
import { sanitizeText } from '@/lib/sanitize';
import { withTimeout, TIMEOUTS } from '@/lib/resilience/timeout';
import { retryWithBackoff, RETRY_CONFIGS } from '@/lib/resilience/retry';
import { circuitBreakers } from '@/lib/resilience/circuit-breaker';
import { bulkheads } from '@/lib/resilience/bulkhead';
import { overloadProtectors } from '@/lib/resilience/overload-protection';
import { recordPerformance } from '@/lib/monitoring/metrics';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Overload protection
    if (!overloadProtectors.ai.check()) {
      recordPerformance('/api/ai-chat', Date.now() - startTime, 503, { method: 'POST' });
      return NextResponse.json(
        { error: 'AI service overloaded, please try again later' },
        { status: 503 }
      );
    }

    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const limitCheck = rateLimit(identifier, 50, 60000); // 50 запросов в минуту
    
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
    
    // Проверяем, есть ли файлы в запросе (FormData)
    const contentType = request.headers.get('content-type') || '';
    let message = '';
    let history: any[] = [];
    let files: any[] = [];
    const fileContents: Array<{ name: string; type: string; content: string }> = [];
    
    if (contentType.includes('multipart/form-data')) {
      // Обработка FormData с файлами
      const formData = await request.formData();
      message = formData.get('message') as string || '';
      const historyStr = formData.get('history') as string;
      if (historyStr) {
        try {
          history = JSON.parse(historyStr);
        } catch (e) {
          history = [];
        }
      }
      
      const fileCount = parseInt(formData.get('fileCount') as string || '0');
      for (let i = 0; i < fileCount; i++) {
        const file = formData.get(`file_${i}`) as File;
        if (file) {
          files.push({
            name: file.name,
            size: file.size,
            type: file.type,
          });
          
          // Читаем содержимое файла
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Парсим файл в зависимости от типа
          try {
            const { parseDocument } = await import('@/lib/ai/document-parser');
            const content = await parseDocument(buffer, file.name, file.type);
            fileContents.push({
              name: file.name,
              type: file.type,
              content: content,
            });
          } catch (error) {
            logError(`Ошибка парсинга файла ${file.name}`, error);
            fileContents.push({
              name: file.name,
              type: file.type,
              content: `[Не удалось прочитать файл: ${file.name}]`,
            });
          }
        }
      }
    } else {
      // Обычный JSON запрос
      const body = await request.json();
      message = body.message || '';
      history = body.history || [];
      files = body.files || [];
    }
    
    // Санитизация входных данных
    message = sanitizeText(message);
    if (history && Array.isArray(history)) {
      history = history.map((msg: any) => ({
        ...msg,
        content: sanitizeText(msg.content || ''),
      }));
    }
    
    // Логирование использования ИИ агента
    logAudit('AI_CHAT_REQUEST', 'ai-chat', {
      identifier,
      messageLength: message.length,
      hasFiles: files && files.length > 0,
    });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API ключ не настроен', response: generateMockResponse(message, files) },
        { status: 200 } // Возвращаем 200, но используем заглушку
      );
    }

    try {
      // Получаем доступные данные из системы для контекста
      const dataContext = '\n\nДоступные базы данных в системе:\n' +
        '- Воздушные суда: данные из реестра\n' +
        '- Нормативные документы: 19+ документов (ICAO, EASA, FAA, МАК, АРМАК, ФАП)\n' +
        '- Организации: авиакомпании и операторы\n' +
        '- Риски: критические, высокие, средние, низкие\n' +
        '- Аудиты: плановые и внеплановые\n' +
        '- Чек-листы: предполетные осмотры, техническое обслуживание\n' +
        '- Заявки: сертификация, разрешения\n' +
        '- Пользователи: администраторы, инженеры, аудиторы\n' +
        '- Документы: сертификаты, техническая документация, отчёты';

      // Формируем системное сообщение с полной информацией о системе
      const systemMessage = {
        role: 'system' as const,
        content: `Ты ИИ агент системы контроля лётной годности воздушных судов. ` +
          `Твоя задача - помогать пользователям с управлением системой, анализом документов, ` +
          `внесением данных в базу, поиском информации. ` +
          `Отвечай на русском языке профессионально, точно и дружелюбно.\n\n` +
          `У ТЕБЯ ЕСТЬ ПОЛНЫЙ ДОСТУП КО ВСЕМ БАЗАМ ДАННЫХ СИСТЕМЫ И ВОЗМОЖНОСТЬ ВНОСИТЬ ДАННЫЕ:\n\n` +
          `ВАЖНО: Когда пользователь загружает документы (PDF, XLS, CSV, изображения), ` +
          `ты должен проанализировать их содержимое и автоматически извлечь данные для внесения в систему. ` +
          `Если в документах есть информация о воздушных судах, аудитах или чек-листах, ` +
          `предложи пользователю внести эти данные в соответствующие карточки.\n\n` +
          `1. ВОЗДУШНЫЕ СУДА (aircraft):\n` +
          `   - Регистрационные номера, типы, операторы, статусы\n` +
          `   - Для получения данных используй: POST /api/ai-data с dataType: "aircraft"\n` +
          `   - Можешь фильтровать по: registrationNumber, operator, type, status\n\n` +
          `2. НОРМАТИВНЫЕ ДОКУМЕНТЫ (regulations):\n` +
          `   - Конвенция о международной гражданской авиации (Chicago Convention) с 19 приложениями (ICAO)\n` +
          `   - Документы ICAO (Annexes)\n` +
          `   - Правила EASA (Европейское агентство по безопасности авиации)\n` +
          `   - Правила FAA (Федеральное управление гражданской авиации США)\n` +
          `   - Документы МАК (Межгосударственный авиационный комитет)\n` +
          `   - Документы АРМАК (Агентство по регулированию гражданской авиации)\n` +
          `   - Авиационные правила РФ (ФАП-128, ФАП-145, ФАП-147, ФАП-21, ФАП-25, ФАП-29, ФАП-39, ФАП-50)\n` +
          `   - Воздушный кодекс РФ\n` +
          `   - Для получения данных используй: POST /api/ai-data с dataType: "regulations"\n\n` +
          `3. ОРГАНИЗАЦИИ (organizations):\n` +
          `   - Авиакомпании и операторы\n` +
          `   - Для получения данных используй: POST /api/ai-data с dataType: "organizations"\n\n` +
          `4. РИСКИ (risks):\n` +
          `   - Уровни: Критический, Высокий, Средний, Низкий\n` +
          `   - Категории, статусы, привязка к ВС\n` +
          `   - Для получения данных используй: POST /api/ai-data с dataType: "risks"\n\n` +
          
          '5. АУДИТЫ (audits):\n' +
          '   - Плановые и внеплановые аудиты\n' +
          '   - Статусы: Запланирован, В процессе, Завершён\n' +
          '   - Для получения данных используй: POST /api/ai-data с dataType: "audits"\n\n' +
          
          '6. ЧЕК-ЛИСТЫ (checklists):\n' +
          '   - Предполетные осмотры, техническое обслуживание\n' +
          '   - Для получения данных используй: POST /api/ai-data с dataType: "checklists"\n\n' +
          
          '7. ЗАЯВКИ (applications):\n' +
          '   - Сертификация, разрешения на эксплуатацию\n' +
          '   - Для получения данных используй: POST /api/ai-data с dataType: "applications"\n\n' +
          
          '8. ПОЛЬЗОВАТЕЛИ (users):\n' +
          '   - Администраторы, инженеры, аудиторы\n' +
          '   - Для получения данных используй: POST /api/ai-data с dataType: "users"\n\n' +
          
          '9. ДОКУМЕНТЫ (documents):\n' +
          '   - Сертификаты, техническая документация, отчёты\n' +
          '   - Для получения данных используй: POST /api/ai-data с dataType: "documents"\n\n' +
          
          'КАК РАБОТАТЬ С ДАННЫМИ:\n' +
          '- Когда пользователь спрашивает о данных, автоматически запрашивай их через /api/ai-data\n' +
          '- Используй полученные данные для точных ответов\n' +
          '- При поиске применяй фильтры для уточнения результатов\n' +
          '- Если пользователь просит добавить данные, уточни необходимую информацию и предложи структурированный формат\n' +
          '- При ответах на вопросы о нормативных требованиях ссылайся на соответствующие документы\n\n' +
          
          'ПРИМЕРЫ ЗАПРОСОВ:\n' +
          '- "Сколько воздушных судов у Аэрофлота?" → запроси aircraft с фильтром operator: "Аэрофлот"\n' +
          '- "Какие критические риски есть?" → запроси risks с фильтром level: "Критический"\n' +
          '- "Покажи все аудиты" → запроси audits\n' +
          '- "Найди ВС RA-12345" → запроси aircraft с фильтром registrationNumber: "RA-12345"\n\n' +
          
          dataContext
      };

      // Анализируем запрос пользователя и определяем, нужно ли запросить данные
      const userMessageContent = message;
      let dataToInclude = '';

      // Определяем, запрашивает ли пользователь данные
      const lowerMessage = message.toLowerCase();
      const dataKeywords: Record<string, string[]> = {
        aircraft: ['вс', 'воздушн', 'самолёт', 'самолет', 'aircraft', 'регистрац'],
        risks: ['риск', 'риски', 'опасн', 'проблем'],
        audits: ['аудит', 'проверк', 'инспекц'],
        organizations: ['организац', 'компани', 'авиакомпани', 'оператор'],
        checklists: ['чек-лист', 'чеклист', 'осмотр', 'проверк'],
        applications: ['заявк', 'сертификац', 'разрешен'],
        users: ['пользовател', 'пользователь', 'пользователи', 'user'],
        documents: ['документ', 'сертификат', 'отчёт', 'отчет'],
        regulations: ['норматив', 'правил', 'требован', 'стандарт', 'fap', 'icao', 'easa', 'faa'],
      };

      // Определяем тип данных для запроса
      let requestedDataType: string | null = null;
      for (const [dataType, keywords] of Object.entries(dataKeywords)) {
        if (keywords.some(keyword => lowerMessage.includes(keyword))) {
          requestedDataType = dataType;
          break;
        }
      }

      // Если запрашиваются данные, получаем их через внутренний вызов
      if (requestedDataType) {
        try {
          // Используем внутренний импорт для получения данных
          const { getDataForAI } = await import('../ai-data-helper');
          const dataResult = await getDataForAI(requestedDataType, extractFilters(message));
          
          if (dataResult && dataResult.data) {
            dataToInclude = `\n\n[ДАННЫЕ ИЗ СИСТЕМЫ]\n` +
              `Тип: ${dataResult.dataType}\n` +
              `Количество записей: ${dataResult.count}\n` +
              `Данные: ${JSON.stringify(dataResult.data.slice(0, 10), null, 2)}${dataResult.count > 10 ? `\n... и еще ${dataResult.count - 10} записей` : ''}\n` +
              `[КОНЕЦ ДАННЫХ]`;
          }
        } catch (error) {
          logWarn('Не удалось получить данные для ИИ агента', { error: String(error) });
          // Продолжаем без данных
        }
      }

      // Формируем массив сообщений для OpenAI
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        systemMessage,
        ...history.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: `${userMessageContent}${files && files.length > 0 
            ? `\n\nПрикреплены файлы: ${files.map((f: any) => f.name).join(', ')}` 
            : ''}${fileContents.length > 0 
            ? `\n\n[СОДЕРЖИМОЕ ФАЙЛОВ]\n${fileContents.map(f => `Файл: ${f.name}\n${f.content.substring(0, 5000)}${f.content.length > 5000 ? '...' : ''}`).join('\n\n---\n\n')}\n[КОНЕЦ СОДЕРЖИМОГО ФАЙЛОВ]`
            : ''}${dataToInclude}`,
        },
      ];

      // Запрос к OpenAI API
      if (!openai) {
        throw new Error('OpenAI API ключ не настроен');
      }
      if (!openai) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 503 }
        );
      }

      // Используем bulkhead, circuit breaker, retry и timeout для устойчивости
      const completion = await bulkheads.ai.execute(async () => {
        return circuitBreakers.openai.execute(async () => {
          return retryWithBackoff(
            () =>
              withTimeout(
                openai.chat.completions.create({
                  model: 'gpt-4o-mini', // Используем более доступную модель
                  messages: messages,
                  temperature: 0.7,
                  max_tokens: 1000,
                }),
                TIMEOUTS.OPENAI_API,
                'OpenAI API request timed out'
              ),
            {
              ...RETRY_CONFIGS.OPENAI_API,
              onRetry: (attempt, error) => {
                logWarn(`OpenAI chat retry attempt ${attempt}`, { error: error.message });
              },
            }
          );
        });
      });

      const aiResponse = completion.choices[0]?.message?.content || 'Извините, не удалось получить ответ.';

      // Запись метрики производительности
      const duration = Date.now() - startTime;
      recordPerformance('/api/ai-chat', duration, 200, { method: 'POST' });

      return NextResponse.json({
        response: aiResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (openaiError: any) {
      logError('Ошибка OpenAI API', openaiError);
      
      // Если ошибка API, возвращаем заглушку
      return NextResponse.json({
        response: `${generateMockResponse(message, files)}\n\n⚠️ Примечание: OpenAI API временно недоступен, используется локальная обработка.`,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    return handleError(error, {
      path: '/api/ai-chat',
      method: 'POST',
    });
  }
}

// Функция для извлечения фильтров из запроса пользователя
function extractFilters(message: string): any {
  const filters: any = {};
  const lowerMessage = message.toLowerCase();

  // Извлечение регистрационного номера ВС
  const regNumberMatch = message.match(/RA-[\dA-Z]+/i);
  if (regNumberMatch) {
    filters.registrationNumber = regNumberMatch[0];
  }

  // Извлечение оператора/компании
  const companies = ['аэрофлот', 's7', 'уральск', 'победа', 'нордавиа'];
  for (const company of companies) {
    if (lowerMessage.includes(company)) {
      filters.operator = company;
      break;
    }
  }

  // Извлечение уровня риска
  if (lowerMessage.includes('критическ')) {
    filters.level = 'Критический';
  } else if (lowerMessage.includes('высок')) {
    filters.level = 'Высокий';
  } else if (lowerMessage.includes('средн')) {
    filters.level = 'Средний';
  } else if (lowerMessage.includes('низк')) {
    filters.level = 'Низкий';
  }

  // Извлечение статуса
  if (lowerMessage.includes('активн')) {
    filters.status = 'Активен';
  } else if (lowerMessage.includes('обслуживан')) {
    filters.status = 'На обслуживании';
  }

  return Object.keys(filters).length > 0 ? filters : undefined;
}

// Функция-заглушка для случаев, когда API недоступен
function generateMockResponse(message: string, files: any[]): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('добавить') || lowerMessage.includes('создать')) {
    if (lowerMessage.includes('вс') || lowerMessage.includes('воздушн')) {
      return `Для добавления воздушного судна мне нужна следующая информация:\n\n` +
        `1. Регистрационный номер (например: RA-12345)\n` +
        `2. Серийный номер\n` +
        `3. Тип ВС (например: Boeing 737-800)\n` +
        `4. Оператор (название компании)\n` +
        `5. Статус (Активен/На обслуживании)\n\n` +
        `Предоставьте эти данные в структурированном виде, и я внесу их в базу.`;
    }
    if (lowerMessage.includes('риск')) {
      return `Для добавления риска требуется:\n\n` +
        `1. Название риска\n` +
        `2. Уровень: Критический/Высокий/Средний/Низкий\n` +
        `3. Категория\n` +
        `4. ВС (регистрационный номер)\n` +
        `5. Описание\n\n` +
        `Укажите эти данные для автоматического внесения.`;
    }
  }

  if (lowerMessage.includes('найти') || lowerMessage.includes('поиск')) {
    return `Я могу помочь с поиском:\n\n` +
      `• Воздушное судно по номеру\n` +
      `• Риски по уровню или категории\n` +
      `• Документы по типу или ВС\n` +
      `• Аудиты по организации или дате\n\n` +
      `Уточните, что именно нужно найти?`;
  }

  if (files && files.length > 0) {
    return `Получено ${files.length} файл(ов). Анализирую содержимое...\n\n` +
      `Если в файлах есть структурированные данные (списки ВС, риски, документы), ` +
      `я могу автоматически извлечь их и предложить внести в базу данных.\n\n` +
      `Продолжить анализ?`;
  }

  return `Я ИИ агент системы контроля лётной годности. Могу помочь с:\n\n` +
    `✅ Добавлением данных в базу (ВС, риски, документы, аудиты)\n` +
    `✅ Поиском информации по системе\n` +
    `✅ Анализом прикрепленных файлов\n` +
    `✅ Генерацией отчетов\n` +
    `✅ Ответами на вопросы о системе\n\n` +
    `Что именно вам нужно?`;
}
