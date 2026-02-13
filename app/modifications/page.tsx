"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Logo from "@/components/Logo";

const MOCK_MODS = [
  { id: "mod-001", number: "SB-737-57-1326", title: "Усиление нервюры крыла", aircraft: "Boeing 737-800", applicability: "RA-73701, RA-73702, RA-73704", type: "SB", status: "approved", approvedBy: "Росавиация", date: "2026-01-10" },
  { id: "mod-002", number: "STC-SSJ-2025-014", title: "Установка системы TCAS II v7.1", aircraft: "Sukhoi Superjet 100", applicability: "RA-89001, RA-89002, RA-89003, RA-89004", type: "STC", status: "in_progress", approvedBy: "EASA", date: "2025-11-20" },
  { id: "mod-003", number: "EO-MI8-2026-003", title: "Модификация топливной системы", aircraft: "Mi-8MTV-1", applicability: "RA-02801", type: "EO", status: "planned", approvedBy: "Росавиация", date: "2026-02-01" },
  { id: "mod-004", number: "SB-IL96-72-0045", title: "Замена блоков FADEC двигателей ПС-90А", aircraft: "Il-96-300", applicability: "RA-96017", type: "SB", status: "completed", approvedBy: "Росавиация", date: "2025-08-15" },
  { id: "mod-005", number: "AD-MOD-IL76-2025", title: "Доработка системы наддува по AD", aircraft: "Il-76TD-90VD", applicability: "RA-76511", type: "AD compliance", status: "completed", approvedBy: "Росавиация", date: "2025-10-01" },
];

const stColors: Record<string,string> = { approved: "#ff9800", in_progress: "#2196f3", planned: "#9c27b0", completed: "#4caf50" };
const stLabels: Record<string,string> = { approved: "Одобрена", in_progress: "Выполняется", planned: "Запланирована", completed: "Завершена" };

export default function ModificationsPage() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_MODS : MOCK_MODS.filter(m => m.status === filter);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <Logo size="large" />
        <p style={{ color: "#666", margin: "16px 0 24px" }}>Модификации и доработки воздушных судов</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Модификации ВС</h2>
            <p style={{ fontSize: "14px", color: "#666" }}>Service Bulletins, STC, Engineering Orders — EASA Part-21, Росавиация</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[["approved","Одобрена","#fff3e0"],["in_progress","Выполняется","#e3f2fd"],["planned","Запланирована","#f3e5f5"],["completed","Завершена","#e8f5e9"]].map(([s,l,bg]) => (
            <div key={s} onClick={() => setFilter(filter===s?"all":s)} style={{ background: bg, padding: "16px", borderRadius: "8px", textAlign: "center", cursor: "pointer", border: filter===s ? "2px solid #1e3a5f" : "2px solid transparent" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: stColors[s] }}>{MOCK_MODS.filter(m=>m.status===s).length}</div>
              <div style={{ fontSize: "13px", color: "#666" }}>{l}</div>
            </div>
          ))}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
          <thead><tr style={{ background: "#1e3a5f", color: "white" }}>
            {["НОМЕР","ОПИСАНИЕ","ТИП ВС","ТИП","ПРИМЕНИМОСТЬ","СТАТУС","ОДОБРЕНО"].map(h => <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: "12px" }}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(m => (
            <tr key={m.id} style={{ borderBottom: "1px solid #e0e0e0" }}>
              <td style={{ padding: "12px", fontWeight: 600, fontSize: "13px" }}>{m.number}</td>
              <td style={{ padding: "12px", fontSize: "13px" }}>{m.title}</td>
              <td style={{ padding: "12px" }}>{m.aircraft}</td>
              <td style={{ padding: "12px" }}><span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", background: "#e0e0e0" }}>{m.type}</span></td>
              <td style={{ padding: "12px", fontSize: "12px", color: "#666" }}>{m.applicability}</td>
              <td style={{ padding: "12px" }}><span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", color: "white", background: stColors[m.status] }}>{stLabels[m.status]}</span></td>
              <td style={{ padding: "12px", fontSize: "13px" }}>{m.approvedBy}<br/><span style={{ fontSize: "11px", color: "#999" }}>{m.date}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
