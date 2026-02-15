export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

/**
 * OpenAPI спецификация для AI endpoints
 */
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'KLG ASUTK AI API',
    version: '1.0.0',
    description: 'API для взаимодействия с AI-системой контроля лётной годности воздушных судов',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || '',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/ai/agent': {
      post: {
        summary: 'Обработка естественного языка запроса',
        description: 'Обрабатывает запрос на естественном языке и возвращает ответ с reasoning',
        tags: ['AI Agent'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['query'],
                properties: {
                  query: {
                    type: 'string',
                    description: 'Запрос на естественном языке',
                    example: 'Покажи все активные воздушные суда',
                  },
                  mode: {
                    type: 'string',
                    enum: ['copilot', 'autonomous'],
                    default: 'copilot',
                    description: 'Режим работы агента',
                  },
                  context: {
                    type: 'object',
                    description: 'Дополнительный контекст для запроса',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Успешный ответ',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    answer: {
                      type: 'string',
                      description: 'Ответ на запрос',
                    },
                    reasoning: {
                      type: 'array',
                      items: {
                        type: 'string',
                      },
                      description: 'Цепочка рассуждений',
                    },
                    actions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          type: { type: 'string' },
                          description: { type: 'string' },
                          executed: { type: 'boolean' },
                          result: { type: 'object' },
                        },
                      },
                    },
                    confidence: {
                      type: 'number',
                      minimum: 0,
                      maximum: 1,
                      description: 'Уверенность в ответе',
                    },
                    mode: {
                      type: 'string',
                      enum: ['copilot', 'autonomous'],
                    },
                    intent: {
                      type: 'object',
                      properties: {
                        intent: { type: 'string' },
                        confidence: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Неверный запрос',
          },
          '429': {
            description: 'Превышен лимит запросов',
          },
          '500': {
            description: 'Внутренняя ошибка сервера',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Сообщение об ошибке',
          },
          code: {
            type: 'string',
            description: 'Код ошибки',
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'AI Agent',
      description: 'Endpoints для взаимодействия с автономным агентом',
    },
  ],
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
