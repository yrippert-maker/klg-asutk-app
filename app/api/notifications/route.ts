export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json([
    { id: "n-001", type: "warning", title: "C-Check просрочен", message: "Boeing 737-800 RA-73701: C-Check просрочен на 12 дней", read: false, createdAt: "2026-02-07T10:00:00Z" },
    { id: "n-002", type: "info", title: "Аудит начат", message: "Плановый аудит REFLY Airlines стартовал", read: false, createdAt: "2026-02-06T14:30:00Z" },
    { id: "n-003", type: "critical", title: "Дефект шасси", message: "Ми-8 RA-02801: микротрещина в стойке шасси", read: true, createdAt: "2026-02-05T09:15:00Z" },
  ], { status: 200 });
}
