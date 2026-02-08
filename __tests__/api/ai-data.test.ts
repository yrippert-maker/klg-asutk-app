/**
 * Integration тесты для API endpoints
 */
import { describe, it, expect, beforeEach } from '@jest/globals';
import { POST } from '@/app/api/ai-data/route';
import { NextRequest } from 'next/server';

describe('API: /api/ai-data', () => {
  beforeEach(() => {
    // Очистка моков перед каждым тестом
    jest.clearAllMocks();
  });

  it('должен возвращать сводку при dataType=all', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai-data', {
      method: 'POST',
      body: JSON.stringify({ dataType: 'all' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('aircraft');
    expect(data.summary).toHaveProperty('risks');
  });

  it('должен возвращать данные о ВС при dataType=aircraft', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai-data', {
      method: 'POST',
      body: JSON.stringify({ dataType: 'aircraft' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('dataType', 'aircraft');
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('должен возвращать ошибку при неверном dataType', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai-data', {
      method: 'POST',
      body: JSON.stringify({ dataType: 'invalid' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('должен валидировать фильтры', async () => {
    const request = new NextRequest('http://localhost:3000/api/ai-data', {
      method: 'POST',
      body: JSON.stringify({
        dataType: 'aircraft',
        filters: {
          registrationNumber: 'RA-12345',
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
