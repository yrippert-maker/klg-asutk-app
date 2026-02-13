"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Logo from "@/components/Logo";

const MOCK_TASKS = [
  { id: "mt-001", taskNumber: "WO-2026-0041", aircraft: "RA-73701", aircraftType: "Boeing 737-800", type: "C-Check", status: "overdue", assignedTo: "S7 Technics", startDate: "2026-01-20", dueDate: "2026-01-27", description: "Плановый C-Check по программе ТО" },
  { id: "mt-002", taskNumber: "WO-2026-0042", aircraft: "RA-89002", aircraftType: "SSJ-100", type: "A-Check", status: "in_progress", assignedTo: "REFLY MRO", startDate: "2026-02-05", dueDate: "2026-02-12", description: "A-Check каждые 750 лётных часов" },
  { id: "mt-003", taskNumber: "WO-2026-0043", aircraft: "RA-02801", aircraftType: "Mi-8MTV-1", type: "Периодическое ТО", status: "in_progress", assignedTo: "UTair Engineering", startDate: "2026-02-01", dueDate: "2026-02-15", description: "100-часовая форма + замена масла" },
  { id: "mt-004", taskNumber: "WO-2026-0044", aircraft: "RA-73702", aircraftType: "Boeing 737-800", type: "Линейное ТО", status: "planned", assignedTo: "REFLY MRO", startDate: "2026-02-20", dueDate: "2026-02-21", description: "Transit check после дальнемагистрального рейса" },
  { id: "mt-005", taskNumber: "WO-2026-0045", aircraft: "RA-89001", aircraftType: "SSJ-100", type: "AD выполнение", status: "planned", assignedTo: "S7 Technics", startDate: "2026-03-01", dueDate: "2026-03-05", description: "Выполнение EASA AD 2025-0198" },
  { id: "mt-006", taskNumber: "WO-2026-0046", aircraft: "RA-96017", aircraftType: "Il-96-300", type: "D-Check", status: "completed", assignedTo: "VASO MRO", startDate: "2025-09-01", dueDate: "2025-12-15", description: "Капитальный ремонт D-Check" },
  { id: "mt-007", taskNumber: "WO-2026-0047", aircraft: "RA-76511", aircraftType: "Il-76TD-90VD", type: "B-Check", status: "completed", assignedTo: "Volga-Dnepr Technics", startDate: "2025-11-10", dueDate: "2025-12-01", description: "B-Check по программе ТО изготовителя" },
];

const sColors: Record<string, string> = { overdue: "#d32f2f", in_progress: "#2196f3", planned: "#ff9800", completed: "#4caf50" };
const sLabels: Record<string, string> = { overdue: "Просрочено", in_progress: "В работе", planned: "Запланировано", completed: "Завершено" };

export default function MaintenancePage() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_TASKS : MOCK_TASKS.filter(t => t.status === filter);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <Logo size="large" />
        <p style={{ color: "#666", margin: "16px 0 24px" }}>Управление техническим обслуживанием воздушных судов</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Техническое обслуживание</h2>
            <p style={{ fontSize: "14px", color: "#666" }}>Рабочие задания (Work Orders) — EASA Part-145 / ФАП-145</p>
          </div>
          <button style={{ padding: "10px 20px", background: "#1e3a5f", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>+ Новое задание</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[["overdue","Просрочено","#ffebee"],["in_progress","В работе","#e3f2fd"],["planned","Запланировано","#fff3e0"],["completed","Завершено","#e8f5e9"]].map(([s,l,bg]) => (
            <div key={s} onClick={() => setFilter(filter===s?"all":s)} style={{ background: bg, padding: "16px", borderRadius: "8px", textAlign: "center", cursor: "pointer", border: filter===s ? "2px solid #1e3a5f" : "2px solid transparent" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: sColors[s] }}>{MOCK_TASKS.filter(t=>t.status===s).length}</div>
              <div style={{ fontSize: "13px", color: "#666" }}>{l}</div>
            </div>
          ))}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
          <thead><tr style={{ background: "#1e3a5f", color: "white" }}>
            {["WO №","ВС","ТИП ВС","ФОРМА ТО","ИСПОЛНИТЕЛЬ","СТАТУС","СРОК"].map(h => <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: "12px" }}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(t => (
            <tr key={t.id} style={{ borderBottom: "1px solid #e0e0e0", background: t.status==="overdue" ? "#fff5f5" : "transparent" }}>
              <td style={{ padding: "12px", fontWeight: 600 }}>{t.taskNumber}</td>
              <td style={{ padding: "12px" }}>{t.aircraft}</td>
              <td style={{ padding: "12px", fontSize: "13px" }}>{t.aircraftType}</td>
              <td style={{ padding: "12px" }}>{t.type}</td>
              <td style={{ padding: "12px", fontSize: "13px" }}>{t.assignedTo}</td>
              <td style={{ padding: "12px" }}><span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", color: "white", background: sColors[t.status] }}>{sLabels[t.status]}</span></td>
              <td style={{ padding: "12px", fontSize: "13px" }}>{t.dueDate}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
