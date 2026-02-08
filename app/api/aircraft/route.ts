export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getCachedAircraft } from '@/lib/api/cached-api';
import { paginatedQuery } from '@/lib/database/query-optimizer';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { aircraftFiltersSchema, validateRequestParams } from '@/lib/validation/api-validation';
import { logWarn } from '@/lib/logger';

/**
 * API Route для получения данных о воздушных судах
 * Поддерживает кэширование, пагинацию и фильтрацию
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting (мягкий лимит для внутренних запросов)
    try {
      const identifier = getRateLimitIdentifier(request);
      const rateLimitResult = rateLimit(identifier, 200, 60000); // 200 запросов в минуту
      if (!rateLimitResult.allowed) {
        // Не блокируем запросы, только логируем
        logWarn('Rate limit warning for /api/aircraft', { component: 'api', action: 'rate-limit' });
      }
    } catch (rateLimitError) {
      // Игнорируем ошибки rate limiting, продолжаем выполнение
      logWarn('Rate limit check failed, continuing', {
        component: 'api',
        action: 'rate-limit',
        error: rateLimitError instanceof Error ? rateLimitError.message : String(rateLimitError),
      });
    }

    // Валидация параметров запроса
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, unknown> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const validatedParams = validateRequestParams(aircraftFiltersSchema, params);
    const { page, limit, paginate: usePagination, status: validatedStatus } = validatedParams;

    // Если нужна пагинация на сервере
    if (usePagination && process.env.DB_HOST) {
      const filters: any[] = [];
      if (validatedStatus) {
        filters.push(validatedStatus);
      }

      const baseQuery = validatedStatus
        ? 'SELECT * FROM aircraft WHERE status = $1'
        : 'SELECT * FROM aircraft';

      const result = await paginatedQuery(
        baseQuery,
        page,
        limit,
        filters,
        'created_at DESC'
      );

      return NextResponse.json(result, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Получение всех данных с кэшированием
    const aircraft = await getCachedAircraft();

    // Если запрос без пагинации (нет параметра paginate=true), возвращаем все данные как массив
    // Это для обратной совместимости с компонентами, которые ожидают массив
    if (!usePagination) {
      return NextResponse.json(aircraft, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Клиентская пагинация (если не используется серверная)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAircraft = aircraft.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        data: paginatedAircraft,
        pagination: {
          page,
          limit,
          total: aircraft.length,
          totalPages: Math.ceil(aircraft.length / limit),
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    return handleError(error, {
      path: '/api/aircraft',
      method: 'GET',
    });
  }
}
