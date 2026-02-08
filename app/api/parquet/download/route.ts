export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrlForFile } from '@/lib/storage/s3-client';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(getRateLimitIdentifier(request));
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600');

    if (!key) {
      return NextResponse.json(
        { error: 'Параметр key обязателен' },
        { status: 400 }
      );
    }

    // Генерируем подписанный URL
    const signedUrl = await getSignedUrlForFile(key, expiresIn);

    return NextResponse.json({
      url: signedUrl,
      expiresIn,
    });
  } catch (error: any) {
    return handleError(error, {
      path: '/api/parquet/download',
      method: 'GET',
    });
  }
}
