export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { uploadParquetFile } from '@/lib/storage/s3-client';
import { rateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';
import { handleError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = rateLimit(getRateLimitIdentifier(request));
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Слишком много запросов' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;

    if (!file || !key) {
      return NextResponse.json(
        { error: 'Файл и ключ обязательны' },
        { status: 400 }
      );
    }

    // Конвертируем File в Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Загружаем в S3
    const s3Key = await uploadParquetFile(key, buffer);

    return NextResponse.json({
      success: true,
      key: s3Key,
      size: buffer.length,
    });
  } catch (error: any) {
    return handleError(error, {
      path: '/api/parquet/upload',
      method: 'POST',
    });
  }
}
