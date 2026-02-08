'use client';

import { useEffect, useRef, useState } from 'react';

export default function ApiDocsPage() {
  const [SwaggerUI, setSwaggerUI] = useState<any>(null);
  const [spec, setSpec] = useState<any>(null);
  const swaggerRef = useRef<any>(null);

  useEffect(() => {
    // Динамически загружаем SwaggerUI только на клиенте
    if (typeof window !== 'undefined') {
      // Используем eval для обхода статического анализа Next.js
      const loadSwaggerUI = async () => {
        try {
          // @ts-ignore
          const swaggerModule = await eval('import("swagger-ui-react")');
          if (swaggerModule && swaggerModule.default) {
            setSwaggerUI(() => swaggerModule.default);
            // CSS загрузится автоматически
          }
        } catch (err) {
          console.warn('swagger-ui-react not installed:', err);
        }
      };
      loadSwaggerUI();
    }

    // Загружаем OpenAPI спецификацию
    fetch('/api/openapi')
      .then(res => res.json())
      .then(data => {
        setSpec(data);
        if (swaggerRef.current) {
          swaggerRef.current.specActions.updateSpec(data);
        }
      })
      .catch(err => {
        console.error('Failed to load OpenAPI spec:', err);
      });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
          API Документация
        </h1>
        <p style={{ fontSize: '16px', color: '#666' }}>
          Интерактивная документация для AI endpoints
        </p>
      </div>
      
      {!SwaggerUI ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <p>Загрузка Swagger UI...</p>
          <p style={{ fontSize: '14px', marginTop: '8px', color: '#999' }}>
            Если Swagger UI не загружается, установите: npm install swagger-ui-react
          </p>
          {spec && (
            <pre style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', overflow: 'auto', textAlign: 'left' }}>
              {JSON.stringify(spec, null, 2)}
            </pre>
          )}
        </div>
      ) : (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
          <SwaggerUI
            spec={spec}
            url="/api/openapi"
            ref={swaggerRef}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
          />
        </div>
      )}
    </div>
  );
}
