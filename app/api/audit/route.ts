export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { searchAuditLogs, exportAuditLogs, AuditSearchFilters } from '@/lib/audit/audit-service';
import { handleError } from '@/lib/error-handler';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

/**
 * GET /api/audit - Поиск записей аудита
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getRateLimitIdentifier(request);
    const rateLimitResult = rateLimit(identifier);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    const filters: AuditSearchFilters = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resourceType: searchParams.get('resourceType') || undefined,
      resourceId: searchParams.get('resourceId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      ipAddress: searchParams.get('ipAddress') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const format = searchParams.get('format') as 'json' | 'csv' | null;

    // Если запрошен экспорт
    if (format) {
      const exported = await exportAuditLogs(filters, format);
      const contentType = format === 'json' ? 'application/json' : 'text/csv';
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      
      return new NextResponse(exported, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Обычный поиск
    const result = await searchAuditLogs(filters, limit, offset);

    return NextResponse.json({
      logs: result.logs,
      total: result.total,
      limit,
      offset,
    });
  } catch (error) {
    return handleError(error, {
      path: '/api/audit',
      method: 'GET',
    });
  }
}
