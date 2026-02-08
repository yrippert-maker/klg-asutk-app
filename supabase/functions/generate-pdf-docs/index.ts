import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Project documentation data
const projectDocumentation = {
  title: "REFLY - Система контроля лётной годности",
  subtitle: "Техническая документация проекта",
  version: "1.0.0",
  date: new Date().toLocaleDateString('ru-RU'),
  
  overview: {
    title: "Обзор проекта",
    content: `REFLY — это ERP-система для авиационного бизнеса Mura Menasa FZCO. 
Система обеспечивает комплексный контроль лётной годности воздушных судов и включает модули 
для управления закупками, финансами, персоналом, документооборотом, контролем качества, 
безопасностью и нормативной базой (EASA, ICAO, FAA, ARMAK).`
  },

  techStack: {
    title: "Технологический стек",
    items: [
      { name: "React 18", description: "UI библиотека" },
      { name: "Vite", description: "Сборщик и dev-сервер" },
      { name: "TypeScript", description: "Типизация" },
      { name: "React Router v6", description: "Маршрутизация" },
      { name: "Tailwind CSS", description: "Стилизация" },
      { name: "shadcn/ui", description: "Компоненты UI" },
      { name: "TanStack Query", description: "Управление состоянием" },
      { name: "Lucide React", description: "Иконки" },
      { name: "Recharts", description: "Графики" },
      { name: "Lovable Cloud", description: "Бэкенд (БД, Auth, Storage)" }
    ]
  },

  architecture: {
    title: "Архитектура приложения",
    layers: [
      {
        name: "Presentation Layer",
        components: ["Pages", "Layout Components", "UI Components"]
      },
      {
        name: "Business Logic Layer", 
        components: ["Hooks", "Utils", "Services"]
      },
      {
        name: "Data Layer",
        components: ["TanStack Query", "Supabase Client", "API"]
      }
    ]
  },

  modules: [
    { name: "Dashboard", path: "/", description: "Главная панель с метриками и быстрыми действиями" },
    { name: "Закупки и ТМЦ", path: "/procurement", description: "Управление заявками и товарно-материальными ценностями" },
    { name: "Финансы", path: "/finance", description: "Платежи, бюджетирование, импорт/экспорт данных" },
    { name: "Персонал", path: "/hr", description: "HR-процессы, отпуска, зарплата" },
    { name: "Документооборот", path: "/documents", description: "Генерация и управление документами" },
    { name: "ОТК", path: "/quality", description: "Контроль качества, фиксация дефектов, AI-анализ" },
    { name: "Безопасность", path: "/safety", description: "Грузоподъемная техника, пожарная безопасность" },
    { name: "Регламенты", path: "/regulations", description: "База регламентов ARMAK, EASA, ICAO, FAA" },
    { name: "AI Помощник", path: "/ai-assistant", description: "Анализ документов, извлечение данных" },
    { name: "AI Inbox", path: "/inbox", description: "Входящие AI-обработанные данные" },
    { name: "Настройки", path: "/settings", description: "Конфигурация системы" }
  ],

  fileStructure: {
    title: "Структура проекта",
    tree: `
src/
├── App.tsx                    # Конфигурация роутера
├── main.tsx                   # Точка входа
├── index.css                  # Глобальные стили + CSS токены
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx      # Основной layout
│   │   ├── Sidebar.tsx        # Боковая навигация
│   │   └── Header.tsx         # Верхний header
│   │
│   ├── dashboard/
│   │   ├── MetricCard.tsx     # Карточки метрик
│   │   ├── ModuleCard.tsx     # Карточки модулей
│   │   ├── ActivityFeed.tsx   # Лента активности
│   │   ├── QuickActions.tsx   # Быстрые действия
│   │   └── SystemStatus.tsx   # Статус системы
│   │
│   └── ui/                    # 40+ shadcn компонентов
│
├── pages/                     # Страницы приложения
├── hooks/                     # Кастомные хуки
└── lib/                       # Утилиты
    `
  },

  designSystem: {
    title: "Дизайн-система REFLY",
    principles: [
      "Светлая тема с минималистичным дизайном",
      "Синие градиенты (REFLY Sphere)",
      "Шрифт Inter для текста",
      "Скругленные углы (border-radius: 12-16px)",
      "Мягкие тени и анимации"
    ],
    colors: [
      { name: "Primary", value: "hsl(217, 91%, 60%)", description: "Основной синий" },
      { name: "Secondary", value: "hsl(220, 14%, 96%)", description: "Фоновый серый" },
      { name: "Accent", value: "hsl(217, 91%, 60%)", description: "Акцентный" },
      { name: "Success", value: "hsl(142, 76%, 36%)", description: "Успех" },
      { name: "Warning", value: "hsl(38, 92%, 50%)", description: "Предупреждение" },
      { name: "Destructive", value: "hsl(0, 84%, 60%)", description: "Ошибка" }
    ]
  },

  diagrams: {
    routing: `
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    BrowserRouter                         ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │                      Routes                          │││
│  │  │                                                      │││
│  │  │  /              → Dashboard                          │││
│  │  │  /procurement   → Procurement                        │││
│  │  │  /finance       → Finance                            │││
│  │  │  /hr            → HR                                 │││
│  │  │  /documents     → Documents                          │││
│  │  │  /quality       → Quality                            │││
│  │  │  /safety        → Safety                             │││
│  │  │  /regulations   → Regulations                        │││
│  │  │  /ai-assistant  → AIAssistant                        │││
│  │  │  /inbox         → Inbox                              │││
│  │  │  /settings      → Settings                           │││
│  │  │  *              → NotFound                           │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
    `,
    
    components: `
┌────────────────────────────────────────────────────────────────┐
│                         AppLayout                               │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐│
│  │   Sidebar    │  │              Main Content                 ││
│  │              │  │  ┌────────────────────────────────────┐  ││
│  │  • Dashboard │  │  │             Header                  │  ││
│  │  • Закупки   │  │  │  Title | Search | Theme | User     │  ││
│  │  • Финансы   │  │  └────────────────────────────────────┘  ││
│  │  • Персонал  │  │  ┌────────────────────────────────────┐  ││
│  │  • Документы │  │  │           Page Content              │  ││
│  │  • ОТК       │  │  │                                     │  ││
│  │  • Безоп.    │  │  │    (Dashboard, Procurement, etc.)   │  ││
│  │  • Регламенты│  │  │                                     │  ││
│  │  • AI        │  │  └────────────────────────────────────┘  ││
│  │  • Inbox     │  │                                          ││
│  │  • Настройки │  │                                          ││
│  └──────────────┘  └──────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
    `,

    dataFlow: `
┌─────────────────────────────────────────────────────────────────┐
│                        Data Flow                                 │
│                                                                  │
│   ┌──────────┐      ┌──────────────┐      ┌─────────────────┐   │
│   │   User   │ ──── │  Components  │ ──── │  TanStack Query │   │
│   │  Action  │      │   (React)    │      │   (Cache/Sync)  │   │
│   └──────────┘      └──────────────┘      └─────────────────┘   │
│                                                    │             │
│                                                    ▼             │
│                                           ┌─────────────────┐   │
│                                           │ Supabase Client │   │
│                                           └─────────────────┘   │
│                                                    │             │
│                                                    ▼             │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    Lovable Cloud                         │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │   │
│   │  │ Database │  │   Auth   │  │ Storage  │  │ Edge Fn │  │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
    `
  }
};

// Generate HTML content for PDF
function generateHTMLDocument(): string {
  const doc = projectDocumentation;
  
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background: #ffffff;
      padding: 40px;
    }
    
    .cover {
      text-align: center;
      padding: 100px 40px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border-radius: 16px;
      margin-bottom: 60px;
    }
    
    .cover h1 {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    
    .cover h2 {
      font-size: 24px;
      font-weight: 400;
      opacity: 0.9;
      margin-bottom: 40px;
    }
    
    .cover .meta {
      font-size: 14px;
      opacity: 0.8;
    }
    
    .section {
      margin-bottom: 48px;
      page-break-inside: avoid;
    }
    
    .section h2 {
      font-size: 28px;
      font-weight: 700;
      color: #1d4ed8;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 3px solid #3b82f6;
    }
    
    .section h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 24px 0 16px;
    }
    
    .section p {
      font-size: 16px;
      color: #4a4a68;
      margin-bottom: 16px;
    }
    
    .tech-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .tech-item {
      background: #f8fafc;
      padding: 16px;
      border-radius: 12px;
      border-left: 4px solid #3b82f6;
    }
    
    .tech-item strong {
      color: #1d4ed8;
    }
    
    .module-list {
      background: #f8fafc;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .module-item {
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .module-item:last-child {
      border-bottom: none;
    }
    
    .module-path {
      background: #1d4ed8;
      color: white;
      padding: 4px 12px;
      border-radius: 6px;
      font-family: monospace;
      font-size: 13px;
      min-width: 140px;
    }
    
    .module-name {
      font-weight: 600;
      color: #1a1a2e;
      min-width: 160px;
    }
    
    .module-desc {
      color: #64748b;
      font-size: 14px;
    }
    
    .diagram {
      background: #1a1a2e;
      color: #22d3ee;
      padding: 24px;
      border-radius: 12px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre;
      margin: 16px 0;
    }
    
    .file-tree {
      background: #1e293b;
      color: #94a3b8;
      padding: 24px;
      border-radius: 12px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      white-space: pre;
      margin: 16px 0;
    }
    
    .color-palette {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .color-item {
      text-align: center;
    }
    
    .color-swatch {
      width: 100%;
      height: 60px;
      border-radius: 12px;
      margin-bottom: 8px;
    }
    
    .color-name {
      font-weight: 600;
      color: #1a1a2e;
    }
    
    .color-value {
      font-size: 12px;
      color: #64748b;
      font-family: monospace;
    }
    
    .principles-list {
      list-style: none;
    }
    
    .principles-list li {
      padding: 12px 16px;
      background: #f0f9ff;
      margin-bottom: 8px;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
    }
    
    .toc {
      background: #f8fafc;
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 48px;
    }
    
    .toc h2 {
      font-size: 24px;
      margin-bottom: 24px;
      border-bottom: none;
      padding-bottom: 0;
    }
    
    .toc-list {
      list-style: none;
    }
    
    .toc-list li {
      padding: 8px 0;
      border-bottom: 1px dashed #e2e8f0;
    }
    
    .toc-list li:last-child {
      border-bottom: none;
    }
    
    .toc-list a {
      color: #1d4ed8;
      text-decoration: none;
    }
    
    .layer-box {
      background: #f8fafc;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 16px;
      border-left: 4px solid #3b82f6;
    }
    
    .layer-title {
      font-weight: 600;
      color: #1d4ed8;
      margin-bottom: 8px;
    }
    
    .layer-components {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .layer-component {
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 13px;
    }
    
    .footer {
      text-align: center;
      padding: 40px;
      color: #64748b;
      font-size: 14px;
      border-top: 1px solid #e2e8f0;
      margin-top: 60px;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <h1>🛫 ${doc.title}</h1>
    <h2>${doc.subtitle}</h2>
    <div class="meta">
      <p>Версия: ${doc.version}</p>
      <p>Дата: ${doc.date}</p>
    </div>
  </div>
  
  <!-- Table of Contents -->
  <div class="toc">
    <h2>📋 Содержание</h2>
    <ol class="toc-list">
      <li><a href="#overview">1. Обзор проекта</a></li>
      <li><a href="#tech-stack">2. Технологический стек</a></li>
      <li><a href="#architecture">3. Архитектура приложения</a></li>
      <li><a href="#modules">4. Модули системы</a></li>
      <li><a href="#file-structure">5. Структура файлов</a></li>
      <li><a href="#design-system">6. Дизайн-система</a></li>
      <li><a href="#diagrams">7. Диаграммы</a></li>
    </ol>
  </div>
  
  <!-- Overview -->
  <div class="section" id="overview">
    <h2>1. ${doc.overview.title}</h2>
    <p>${doc.overview.content}</p>
  </div>
  
  <!-- Tech Stack -->
  <div class="section" id="tech-stack">
    <h2>2. ${doc.techStack.title}</h2>
    <div class="tech-grid">
      ${doc.techStack.items.map(item => `
        <div class="tech-item">
          <strong>${item.name}</strong> — ${item.description}
        </div>
      `).join('')}
    </div>
  </div>
  
  <!-- Architecture -->
  <div class="section" id="architecture">
    <h2>3. ${doc.architecture.title}</h2>
    ${doc.architecture.layers.map(layer => `
      <div class="layer-box">
        <div class="layer-title">${layer.name}</div>
        <div class="layer-components">
          ${layer.components.map(c => `<span class="layer-component">${c}</span>`).join('')}
        </div>
      </div>
    `).join('')}
  </div>
  
  <!-- Modules -->
  <div class="section" id="modules">
    <h2>4. Модули системы</h2>
    <div class="module-list">
      ${doc.modules.map(m => `
        <div class="module-item">
          <span class="module-path">${m.path}</span>
          <span class="module-name">${m.name}</span>
          <span class="module-desc">${m.description}</span>
        </div>
      `).join('')}
    </div>
  </div>
  
  <!-- File Structure -->
  <div class="section" id="file-structure">
    <h2>5. ${doc.fileStructure.title}</h2>
    <div class="file-tree">${doc.fileStructure.tree}</div>
  </div>
  
  <!-- Design System -->
  <div class="section" id="design-system">
    <h2>6. ${doc.designSystem.title}</h2>
    
    <h3>Принципы дизайна</h3>
    <ul class="principles-list">
      ${doc.designSystem.principles.map(p => `<li>✓ ${p}</li>`).join('')}
    </ul>
    
    <h3>Цветовая палитра</h3>
    <div class="color-palette">
      ${doc.designSystem.colors.map(c => `
        <div class="color-item">
          <div class="color-swatch" style="background: ${c.value}"></div>
          <div class="color-name">${c.name}</div>
          <div class="color-value">${c.value}</div>
        </div>
      `).join('')}
    </div>
  </div>
  
  <!-- Diagrams -->
  <div class="section" id="diagrams">
    <h2>7. Диаграммы</h2>
    
    <h3>Маршрутизация (Routing)</h3>
    <div class="diagram">${doc.diagrams.routing}</div>
    
    <h3>Компоненты (Layout)</h3>
    <div class="diagram">${doc.diagrams.components}</div>
    
    <h3>Поток данных (Data Flow)</h3>
    <div class="diagram">${doc.diagrams.dataFlow}</div>
  </div>
  
  <!-- Footer -->
  <div class="footer">
    <p>REFLY — Всё под контролем</p>
    <p>Документация сгенерирована автоматически</p>
  </div>
</body>
</html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating PDF documentation...');
    
    const htmlContent = generateHTMLDocument();
    
    // Return HTML that can be printed to PDF in browser
    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: unknown) {
    console.error('Error generating documentation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
