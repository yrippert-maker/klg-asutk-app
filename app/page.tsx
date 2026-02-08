// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>Numerology App</h1>
      <p style={{ marginTop: 12, fontSize: 16 }}>
        Главная страница подключена. Дальше сюда можно перенести ваш калькулятор
        и отчёт (express / углубленный / полный).
      </p>

      <div style={{ marginTop: 20 }}>
        <Link href="/dashboard">Перейти к дашборду</Link>
      </div>
    </main>
  );
}
