export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getDataForAI } from '../ai-data-helper';
import { filterSchema } from '@/lib/validation';
import { handleError } from '@/lib/error-handler';
import { logAudit } from '@/lib/logger';

/**
 * API endpoint для предоставления ИИ агенту доступа ко всем базам данных
 * ИИ агент может запрашивать данные через этот endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query: _query, dataType, filters } = body;
    
    // Валидация фильтров
    if (filters) {
      filterSchema(filters);
    }
    
    // Логирование доступа
    const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown';
    logAudit('AI_DATA_ACCESS', dataType || 'all', { ip, dataType, filters });

    if (dataType === 'all') {
      // Возвращаем сводку по всем базам данным
      return NextResponse.json({
        summary: {
          aircraft: { count: 3, description: 'Воздушные суда' },
          regulations: { count: 19, description: 'Нормативные документы' },
          organizations: { count: 3, description: 'Организации' },
          risks: { count: 3, description: 'Риски' },
          audits: { count: 3, description: 'Аудиты' },
          checklists: { count: 2, description: 'Чек-листы' },
          applications: { count: 2, description: 'Заявки' },
          users: { count: 3, description: 'Пользователи' },
          documents: { count: 3, description: 'Документы' },
        },
        message: 'Используйте dataType для получения детальной информации по каждой базе данных',
      });
    }

    // Получаем данные через helper функцию
    const result = await getDataForAI(dataType, filters);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Неизвестный тип данных', availableTypes: ['aircraft', 'regulations', 'organizations', 'risks', 'audits', 'checklists', 'applications', 'users', 'documents', 'all'] },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return handleError(error, {
      path: '/api/ai-data',
      method: 'POST',
    });
  }
}

