"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Logo from "@/components/Logo";

const MOCK_DIRECTIVES = [
  { id: "ad-001", number: "FAA AD 2026-02-15", title: "Boeing 737-800 — Inspection of wing spar", aircraft: "Boeing 737-800", status: "open", deadline: "2026-06-01", priority: "high" },
  { id: "ad-002", number: "EASA AD 2025-0234", title: "CFM56-7B — Fan blade inspection", aircraft: "Boeing 737-800", status: "complied", deadline: "2025-12-15", priority: "medium" },
  { id: "ad-003", number: "FATA AD 2026-001", title: "SaM146 — Oil system check", aircraft: "Sukhoi Superjet 100", status: "open", deadline: "2026-04-20", priority: "high" },
  { id: "ad-004", number: "EASA AD 2025-0198", title: "Landing gear retract actuator", aircraft: "Sukhoi Superjet 100", status: "in_progress", deadline: "2026-03-01", priority: "critical" },
  { id: "ad-005", number: "Rosaviation AD 2025-45", title: "An-148 — Fuel system modification", aircraft: "An-148-100V", status: "complied", deadline: "2025-10-30", priority: "medium" },
  { id: "ad-006", number: "FATA AD 2026-003", title: "TV3-117VM — Turbine disc inspection", aircraft: "Mi-8MTV-1", status: "open", deadline: "2026-05-15", priority: "critical" },
];

const statusColors: Record<string, string> = { open: "#ff9800", in_progress: "#2196f3", complied: "#4caf50" };
const statusLabels: Record<string, string> = { open: "Открыта", in_progress: "В работе", complied: "Выполнена" };
const prioColors: Record<string, string> = { critical: "#d32f2f", high: "#e65100", medium: "#f9a825" };

export default function AirworthinessPage() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_DIRECTIVES : MOCK_DIRECTIVES.filter(d => d.status === filter);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <Logo size="large" />
        <p style={{ color: "#666", margin: "16px 0 24px" }}>Директивы лётной годности и сертификация</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Лётная годность</h2>
            <p style={{ fontSize: "14px", color: "#666" }}>Директивы лётной годности (AD/АД) — ИКАО, EASA, Росавиация</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            {[["all","Все"],["open","Открытые"],["in_progress","В работе"],["complied","Выполненные"]].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: "8px 16px", border: filter===v ? "2px solid #1e3a5f" : "1px solid #ddd", borderRadius: "6px", background: filter===v ? "#e3f2fd" : "white", cursor: "pointer", fontSize: "13px", fontWeight: filter===v ? 700 : 400 }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#fff3e0", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#e65100" }}>{MOCK_DIRECTIVES.filter(d=>d.status==="open").length}</div>
            <div style={{ fontSize: "13px", color: "#666" }}>Открытых AD</div>
          </div>
          <div style={{ background: "#e3f2fd", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#1565c0" }}>{MOCK_DIRECTIVES.filter(d=>d.status==="in_progress").length}</div>
            <div style={{ fontSize: "13px", color: "#666" }}>В работе</div>
          </div>
          <div style={{ background: "#e8f5e9", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2e7d32" }}>{MOCK_DIRECTIVES.filter(d=>d.status==="complied").length}</div>
            <div style={{ fontSize: "13px", color: "#666" }}>Выполненных</div>
          </div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
          <thead><tr style={{ background: "#1e3a5f", color: "white" }}>
            {["НОМЕР AD","ОПИСАНИЕ","ТИП ВС","ПРИОРИТЕТ","СТАТУС","СРОК"].map(h => <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: "12px" }}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(d => (
            <tr key={d.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
              <td style={{ padding: "12px", fontWeight: 600 }}>{d.number}</td>
              <td style={{ padding: "12px", fontSize: "13px" }}>{d.title}</td>
              <td style={{ padding: "12px" }}>{d.aircraft}</td>
              <td style={{ padding: "12px" }}><span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", color: "white", background: prioColors[d.priority] || "#999" }}>{d.priority}</span></td>
              <td style={{ padding: "12px" }}><span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", color: "white", background: statusColors[d.status] || "#999" }}>{statusLabels[d.status]}</span></td>
              <td style={{ padding: "12px", fontSize: "13px" }}>{d.deadline}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
