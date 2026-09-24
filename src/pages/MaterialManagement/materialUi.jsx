import { useCallback } from "react";
import { Box } from "@mui/material";
import { KpiCard } from "../../components/kpi/KpiCardSystem";
import { getAccessToken } from "../../auth/auth";
import { API_CONFIG } from "../../config/config";
import { num } from "../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "./materialLocales";

export const MATERIAL_API = `${API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "")}/api/material-inventory`;
export const LOT_STATUS_COLORS = { IN_STOCK: "#12B76A", IN_USE: "#2E90FA", WAITING_IQC: "#F79009", HOLD: "#F04438", EXPIRED: "#7A5AF8", CONSUMED: "#98A2B3", CLOSED: "#667085" };
export const CATEGORY_COLORS = { VIRGIN_RESIN: "#1570EF", REGRIND: "#12B76A", MASTERBATCH: "#F79009", ADDITIVE: "#7A5AF8", PACKAGING: "#EE46BC", OTHERS: "#98A2B3" };

/** kg -> tonnes, 2 decimals (dashboard convention agreed 23/09/2026). */
export const tons = (kg, digits = 2) => num(Number(kg || 0) / 1000, digits);
/** Quantity in the material's own unit. */
export const qty = (value, unit) => `${num(value, 3)} ${unit || ""}`.trim();

export function useRequest() {
  return useCallback(async (url, options = {}) => {
    const token = getAccessToken();
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const d = body?.detail;
      const text = Array.isArray(d) ? d.map((x) => x.msg).join("; ") : typeof d === "object" && d ? d.message : d;
      throw new Error(text || (response.status === 409 ? tx("This record was changed by someone else. Please reload and try again.") : `HTTP ${response.status}`));
    }
    return body;
  }, []);
}

export function LotStatusPill({ value }) {
  const color = LOT_STATUS_COLORS[value] || "#667085";
  return (
    <Box component="span" title={label("lotStatus", value)} sx={{ display: "inline-block", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle", width: 104, px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40`, whiteSpace: "nowrap" }}>
      {label("lotStatus", value)}
    </Box>
  );
}

/** Shared KpiCard (components/kpi) with an optional click-through. */
export function KpiTile({ title, value, unit, sub, icon, tone = "primary", onClick }) {
  const Icon = icon;
  return (
    <Box onClick={onClick} sx={{ minWidth: 0, cursor: onClick ? "pointer" : "default" }}>
      <KpiCard label={title} value={unit ? `${value} ${unit}` : value} note={sub} icon={<Icon />} tone={tone} />
    </Box>
  );
}

export function downloadCsv(filename, header, rows) {
  const cell = (v) => { const t = v == null ? "" : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom + [header.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))].join("\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
