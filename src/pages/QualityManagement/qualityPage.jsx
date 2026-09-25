import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import { Box, MenuItem, TextField, Typography } from "@mui/material";

import { getCurrentUser } from "../../auth/auth";
import usePagePermission from "../../auth/usePagePermission";
import { useTheme as useAppTheme } from "../../context/ThemeContext";
import { useRequest } from "../MaterialManagement/materialUi";
import { pageTheme } from "../ProductionManagement/ProductionPlanning/ui";
import { setActiveLanguage as setMaintLanguage } from "../MaintenanceManagement/maintLocales";
import { MaintFrame, useMaintData } from "../MaintenanceManagement/maintPage";
import { SEL } from "../MaintenanceManagement/maintUi";
import { label, setActiveLanguage, tx } from "./qualityLocales";
import { QUALITY_API } from "./qualityUi";

export { DonutCard } from "../MaintenanceManagement/maintPage";
export const useQualityData = useMaintData;
export const QualityFrame = MaintFrame;

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const todayIso = () => iso(new Date());
export const daysAgoIso = (n) => iso(new Date(Date.now() - n * 86400000));
export const monthStartIso = () => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth(), 1)); };
export const monthEndIso = () => { const d = new Date(); return iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };

export function useQualityPage() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  setMaintLanguage(language);
  const { theme } = useAppTheme();
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { canEdit } = usePagePermission();
  const u = getCurrentUser();
  const actor = u?.full_name ? `${u.full_name} (${u.employee_code})` : u?.employee_code || "SYSTEM";
  const request = useRequest();
  const [lookups, setLookups] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  const reloadLookups = useCallback(() => request(`${QUALITY_API}/lookups`).then(setLookups).catch(() => {}), [request]);
  useEffect(() => { reloadLookups(); }, [reloadLookups]);
  const dark = theme === "dark";
  return {
    language, dark, muiTheme, navigate, params, setParams, canEdit, actor, request, lookups, reloadLookups, msg, setMsg, notify,
    axisColor: dark ? "#A7B0C0" : "#667085", grid: { borderColor: dark ? "#263244" : "#EEF2F6" },
    tableSx: { "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } },
  };
}

/** Query string from an object, empty values skipped. */
export const qsOf = (obj) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => { if (v !== "" && v != null) p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export function DateRange({ from, to, onChange }) {
  return (
    <>
      <TextField size="small" type="date" label={tx("From")} value={from} onChange={(e) => onChange(e.target.value, to)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
      <TextField size="small" type="date" label={tx("To")} value={to} onChange={(e) => onChange(from, e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
    </>
  );
}

/** Filter select with an "All" entry: items = [[value, text]]. */
export function FilterSelect({ labelText, value, onChange, items, width = 150 }) {
  return (
    <TextField select size="small" label={labelText} value={value ?? ""} onChange={(e) => onChange(e.target.value)} slotProps={SEL} sx={{ width }}>
      <MenuItem value="">{tx("All")}</MenuItem>
      {items.map(([v, t]) => <MenuItem key={v} value={v}>{t}</MenuItem>)}
    </TextField>
  );
}

/** Semicircle gauge with the target mark written below. */
export function GaugeChart({ value, target, dark, height = 220, suffix = "%" }) {
  const color = value == null ? "#98A2B3" : value >= target ? "#12B76A" : value >= target - 5 ? "#F79009" : "#F04438";
  return (
    <Box sx={{ textAlign: "center", pb: 1 }}>
      <Chart type="radialBar" height={height} series={[value ?? 0]} options={{
        chart: { background: "transparent", sparkline: { enabled: true } }, colors: [color],
        plotOptions: { radialBar: { startAngle: -90, endAngle: 90, hollow: { size: "62%" }, track: { background: dark ? "#263244" : "#EEF2F6" },
          dataLabels: { name: { show: true, offsetY: 22, color: dark ? "#A7B0C0" : "#667085", fontSize: "12px" },
            value: { offsetY: -14, fontSize: "26px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: () => (value == null ? "—" : `${value}${suffix}`) } } } },
        labels: [tx("Compliance")], stroke: { lineCap: "round" } }} />
      <Typography variant="caption" sx={{ color: "#1570EF", fontWeight: 700 }}>{tx("Target")}: ≥ {target}{suffix}</Typography>
    </Box>
  );
}

/** Tiny line for the repeat-defect trend. */
export function Sparkline({ data, color = "#F04438", width = 90 }) {
  return <Chart type="line" width={width} height={28} series={[{ data }]} options={{ chart: { sparkline: { enabled: true } }, stroke: { width: 1.5, curve: "straight" }, colors: [color], tooltip: { enabled: false } }} />;
}

export const labelOf = label;
