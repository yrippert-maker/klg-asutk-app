"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Logo from "@/components/Logo";

const MOCK_DEFECTS = [
  { id: "def-001", number: "DEF-2026-001", aircraft: "RA-02801", aircraftType: "Mi-8MTV-1", title: "Микротрещина стойки основного шасси", category: "structural", severity: "critical", status: "open", reportedBy: "Козлов Д.М.", reportDate: "2026-01-28", ata: "32" },
  { id: "def-002", number: "DEF-2026-002", aircraft: "RA-73703", aircraftType: "Boeing 737-800", title: "Коррозия обшивки в зоне крыла", category: "corrosion", severity: "major", status: "deferred", reportedBy: "Белов К.Н.", reportDate: "2025-12-10", ata: "57" },
  { id: "def-003", number: "DEF-2026-003", aircraft: "RA-89003", aircraftType: "SSJ-100", title: "Утечка гидрожидкости в шасси", category: "system", severity: "major", status: "in_repair", reportedBy: "Иванов С.К.", reportDate: "2026-02-03", ata: "29" },
  { id: "def-004", number: "DEF-2026-004", aircraft: "RA-73701", aircraftType: "Boeing 737-800", title: "Трещина лобового стекла кабины", category: "structural", severity: "minor", status: "repaired", reportedBy: "Петров И.В.", reportDate: "2026-01-15", ata: "56" },
  { id: "def-005", number: "DEF-2026-005", aircraft: "RA-76511", aircraftType: "Il-76TD-90VD", title: "Расхождение в формулярах двигателей", category: "documentation", severity: "minor", status: "open", reportedBy: "Морозова Е.А.", reportDate: "2026-01-20", ata: "72" },
  { id: "def-006", number: "DEF-2026-006", aircraft: "RA-89001", aircraftType: "SSJ-100", title: "Неисправность датчика температуры EGT", category: "avionics", severity: "major", status: "in_repair", reportedBy: "Сидоров А.П.", reportDate: "2026-02-06", ata: "77" },
];

const sevColors: Record<string,string> = { critical: "#d32f2f", major: "#e65100", minor: "#f9a825" };
const stColors: Record<string,string> = { open: "#ff9800", deferred: "#9c27b0", in_repair: "#2196f3", repaired: "#4caf50" };
const stLabels: Record<string,string> = { open: "Открыт", deferred: "Отложен (MEL/CDL)", in_repair: "В ремонте", repaired: "Устранён" };

export default function DefectsPage() {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MOCK_DEFECTS : MOCK_DEFECTS.filter(d => d.status === filter);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ marginLeft: "280px", flex: 1, padding: "32px" }}>
        <Logo size="large" />
        <p style={{ color: "#666", margin: "16px 0 24px" }}>Учёт и контроль дефектов воздушных судов</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Дефекты</h2>
            <p style={{ fontSize: "14px", color: "#666" }}>Реестр дефектов — ATA iSpec 2200, EASA Part-M, MEL/CDL</p>
          </div>
          <button style={{ padding: "10px 20px", background: "#1e3a5f", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>+ Зарегистрировать дефект</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
          {[["open","Открытые","#fff3e0"],["deferred","Отложенные","#f3e5f5"],["in_repair","В ремонте","#e3f2fd"],["repaired","Устранённые","#e8f5e9"]].map(([s,l,bg]) => (
            <div key={s} onClick={() => setFilter(filter===s?"all":s)} style={{ background: bg, padding: "16px", borderRadius: "8px", textAlign: "center", cursor: "pointer", border: filter===s ? "2px solid #1e3a5f" : "2px solid transparent" }}>
              <div style={{ fontSize: "28px", fontWeight: "bold", color: stColors[s] }}>{MOCK_DEFECTS.filter(d=>d.status===s).length}</div>
              <div style={{ fontSize: "13px", color: "#666" }}>{l}</div>
            </div>
          ))}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white" }}>
          <thead><tr style={{ background: "#1e3a5f", color: "white" }}>
            {["№ ДЕФЕКТА","ВС","ATA","ОПИСАНИЕ","СЕРЬЁЗНОСТЬ","СТАТУС","ДАТА"].map(h => <th key={h} style={{ padding: "12px", textAlign: "left", fontSize: "12px" }}>{h}</th>)}
          </tr></thead>
          <tbody>{filtered.map(d => (
            <tr key={d.id} style={{ borderBottom: "1px solid #e0e0e0", background: d.severity==="critical" ? "#fff5f5" : "transparent" }}>
              <td style={{ padding: "12px", fontWeight: 600 }}>{d.number}</td>
              <td style={{ padding: "12px" }}>{d.aircraft}</td>
              <td style={{ padding: "12px", fontSize: "13px" }}>ATA {d.ata}</td>
              <td style={{ padding: "12px", fontSize: "13px" }}>{d.title}</td>
              <td style={{ padding: "12px" }}><span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", color: "white", background: sevColors[d.severity] }}>{d.severity}</span></td>
              <td style={{ padding: "12px" }}><span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "11px", color: "white", background: stColors[d.status] }}>{stLabels[d.status]}</span></td>
              <td style={{ padding: "12px", fontSize: "13px" }}>{d.reportDate}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
