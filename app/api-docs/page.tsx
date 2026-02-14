'use client';

export default function ApiDocsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Documentation</h1>
      <p className="text-gray-600 mb-4">Swagger UI available at: <a href="http://localhost:8000/docs" className="text-blue-600 underline">http://localhost:8000/docs</a></p>
      <iframe src="http://localhost:8000/docs" className="w-full h-[80vh] border rounded" />
    </div>
  );
}
