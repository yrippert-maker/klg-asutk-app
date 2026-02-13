// app/page.tsx — КЛГ: система контроля лётной годности воздушных судов
import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 32, fontWeight: 700 }}>REFLY — Контроль лётной годности</h1>
      <p style={{ marginTop: 12, fontSize: 16 }}>
        Система контроля лётной годности воздушных судов (КЛГ АСУ ТК).
      </p>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <Link href="/dashboard" style={{ color: "#1e3a5f", fontWeight: 600 }}>
          → Дашборд
        </Link>
        <Link href="/aircraft" style={{ color: "#1e3a5f" }}>ВС и типы</Link>
        <Link href="/regulations" style={{ color: "#1e3a5f" }}>Нормативные документы</Link>
        <Link href="/airworthiness" style={{ color: "#1e3a5f" }}>Лётная годность</Link>
        <Link href="/organizations" style={{ color: "#1e3a5f" }}>Организации</Link>
      </div>
    </main>
  );
}
