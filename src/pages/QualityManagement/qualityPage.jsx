import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

import { getCurrentUser } from "../../auth/auth";
import usePagePermission from "../../auth/usePagePermission";
import { useTheme as useAppTheme } from "../../context/ThemeContext";
import { useRequest } from "../MaterialManagement/materialUi";
import { EMPTY, Head, QuickAction, QuickActions, btn, cardSx, pageTheme } from "../ProductionManagement/ProductionPlanning/ui";
import { setActiveLanguage as setMaintLanguage } from "../MaintenanceManagement/maintLocales";
import { MaintFrame, useMaintData } from "../MaintenanceManagement/maintPage";
import { SEL } from "../MaintenanceManagement/maintUi";
import { label, setActiveLanguage, tx } from "./qualityLocales";
import { QUALITY_API } from "./qualityUi";

export { DonutCard } from "../MaintenanceManagement/maintPage";
export const useQualityData = useMaintData;

const actionBtnSx = btn("primary", { px: 1.5, py: 0.5, fontSize: 11, boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
  "&.Mui-disabled": { color: "text.disabled", backgroundColor: "action.disabledBackground", borderColor: "transparent", boxShadow: "none" },
  "&.Mui-disabled .MuiSvgIcon-root": { color: "text.disabled" } });

/** Row actions under a list table, in the system primary button style; `actions` = [text, Icon, color, onClick, disabled]. */
export function TableActionBar({ actions, selectedText }) {
  return (
    <Box sx={{ px: 1.5, py: 1, borderTop: 1, borderColor: "divider", display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
      <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
        {actions.map(([text, Icon, , onClick, disabled]) => (
          <Button key={text} size="small" disabled={disabled} onClick={onClick} startIcon={<Icon />} sx={actionBtnSx}>{text}</Button>
        ))}
      </Stack>
      <Typography variant="caption" color={selectedText ? "#1570EF" : "text.secondary"} fontWeight={selectedText ? 700 : 400} noWrap>
        {selectedText || tx("Select a row in the list.")}</Typography>
    </Box>
  );
}
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
    tableSx: { "& .MuiTableCell-root": { fontSize: 11, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } },
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
          dataLabels: { name: { show: true, offsetY: 22, color: dark ? "#A7B0C0" : "#667085", fontSize: "11px" },
            value: { offsetY: -14, fontSize: "20px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: () => (value == null ? "—" : `${value}${suffix}`) } } } },
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

/* ---- one-screen layout helpers (shared by every quality page) ---- */
export const panelSx = { ...cardSx, display: "flex", flexDirection: "column", minHeight: { xs: 220, lg: 0 }, minWidth: 0 };
export const fillSx = { flex: 1, minHeight: 0, overflow: "auto", px: 1, pb: 1 };
export const EmptyBody = ({ text }) => <Box sx={{ flex: 1, display: "grid", placeItems: "center", pb: 2 }}><Typography variant="caption" color="text.disabled">{text || tx("No data.")}</Typography></Box>;

/** Filter toggle of the toolbar: highlighted while open or while any filter is set. */
export function FilterToggle({ open, count, onClick }) {
  return (
    <Button startIcon={<FilterListIcon />} onClick={onClick}
      sx={{ ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider", ...(open || count ? { borderColor: "primary.main", color: "primary.main" } : {}) }}>
      {tx("Filter")}{count ? ` (${count})` : ""}
    </Button>
  );
}

/** Quick Actions card filling its grid cell; actions = [text, Icon, color, onClick, disabled]. */
export function QuickCard({ actions, columns = 3 }) {
  return (
    <Paper elevation={0} sx={panelSx}>
      <Head title={tx("Quick Actions")} />
      <QuickActions columns={columns} sx={{ flex: 1, pb: 1.25 }}>
        {actions.map(([text, Icon, color, onClick, disabled]) => <QuickAction key={text} icon={Icon} text={text} color={color} onClick={onClick} disabled={disabled} />)}
      </QuickActions>
    </Paper>
  );
}

/** Compact ApexCharts base options. */
export const chartBase = (dark, axisColor) => ({
  chart: { background: "transparent", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: '"Bai Jamjuree", sans-serif', parentHeightOffset: 0 },
  legend: { show: false }, dataLabels: { enabled: false }, tooltip: { theme: dark ? "dark" : "light" },
  grid: { borderColor: dark ? "#263244" : "#EEF2F6", strokeDashArray: 3, padding: { top: 0, right: 8, bottom: -4, left: 4 } },
  xaxis: { labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: axisColor, fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
  yaxis: { labels: { style: { colors: axisColor, fontSize: "10px" } } },
});

/** A person stored as "Full name (code)" is shown as "Full name - code". */
export const who = (v) => { if (!v) return EMPTY; const m = /^(.*\S)\s*\(([^()]+)\)$/.exec(String(v)); return m ? `${m[1]} - ${m[2]}` : v; };

/** Short label for a narrow tile ("X (short)" key); English and missing keys fall back to the full text. */
export const txs = (key, full) => (tx(key) === key ? tx(full) : tx(key));
