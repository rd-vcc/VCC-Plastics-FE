import "./locales";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper,
  Select, Snackbar, Stack, Switch, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, ThemeProvider as MuiThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import AddAlertOutlinedIcon from "@mui/icons-material/AddAlertOutlined";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VolumeOffOutlinedIcon from "@mui/icons-material/VolumeOffOutlined";
import VolumeUpOutlinedIcon from "@mui/icons-material/VolumeUpOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { KpiTile, colShares, downloadExcel, fitColumns, useRequest } from "../../MaterialManagement/materialUi";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, fitPageSx, panelSx, toolBtnSx } from "../../shared/onePage";
import { DialogHeader, Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, dialogPaperSx, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { SystemStatusBar } from "../../ProductionManagement/WorkOrders/WorkOrderManagement/WoParts";
import { label, localeTag, setActiveLanguage, tx } from "../machineLocales";
import { ALARM_STATUS_COLORS, AlarmDialog, DowntimeDialog, PRIORITY_COLORS, Pill, PriorityPill, ReportAlarmDialog, minText } from "../machineUi";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/alarms`;
const DT_API = `${BASE}/api/downtime`;
const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const EMPTY_FILTER = { equipment_id: "", area_id: "", equipment_category: "" };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const TYPE_COLORS = ["#1570EF", "#12B76A", "#7A5AF8", "#F79009", "#0E9384", "#98A2B3"];

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "square"; o.frequency.value = 880; g.gain.value = 0.05; o.connect(g); g.connect(ctx.destination);
    o.start(); setTimeout(() => { o.stop(); ctx.close(); }, 350);
  } catch { /* audio blocked */ }
}

function BulkDialog({ mode, count, onClose, onSubmit, saving }) {
  const [note, setNote] = useState("");
  const [hours, setHours] = useState(4);
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<NotificationsActiveOutlinedIcon />} title={`${tx(mode === "shelve" ? "Shelve" : "Acknowledge")} · ${tx("Selected")}: ${count}`} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          {mode === "shelve" ? <TextField size="small" type="number" label={tx("Shelve for (hours)")} value={hours} onChange={(e) => setHours(e.target.value)} inputProps={{ min: 1, max: 72 }} /> : null}
          <TextField size="small" multiline minRows={2} required={mode === "shelve"} label={tx("Note")} value={note} onChange={(e) => setNote(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onSubmit({ note, hours: Number(hours) })} disabled={saving || (mode === "shelve" && !note.trim())} sx={btn("primary")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AlarmHistory() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const request = useRequest();

  const [lookups, setLookups] = useState(null);
  const [dtLookups, setDtLookups] = useState(null);
  const [view, setView] = useState("active");
  const [tab, setTab] = useState("ALL");
  const [period, setPeriod] = useState({ from: ymd(new Date()), to: ymd(new Date()) });
  const [filter, setFilter] = useState({ ...EMPTY_FILTER, equipment_id: Number(params.get("machine")) || "" });
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sound, setSound] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [distView, setDistView] = useState("type");
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  const lastCritical = useRef(null);

  useEffect(() => {
    request(`${API}/lookups`).then(setLookups).catch((e) => notify("error", e.message));
    request(`${DT_API}/lookups`).then(setDtLookups).catch(() => {});
  }, [request, notify]);
  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ date_from: period.from, date_to: period.to, view });
      Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v); });
      const next = await request(`${API}/summary?${q}`);
      setData(next); setLastUpdate(new Date());
      setSelected((s) => new Set([...s].filter((id) => next.alarms.some((a) => a.id === id))));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [period, filter, view, request, notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, 15000);
    return () => clearInterval(t);
  }, [autoRefresh, load, dialog]);
  useEffect(() => {
    if (!data) return;
    const c = data.kpis.critical;
    if (sound && lastCritical.current != null && c > lastCritical.current) beep();
    lastCritical.current = c;
  }, [data, sound]);

  const rows = useMemo(() => (data?.alarms || []).filter((a) => tab === "ALL" || (tab === "SHELVED" ? a.status === "SHELVED" : a.priority === tab && a.status !== "SHELVED")), [data, tab]);
  const toggle = (id) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const columns = useMemo(() => fitColumns([
    { headerName: "", colId: "sel", width: 46, minWidth: 46, pinned: "left", sortable: false, resizable: false,
      cellRenderer: (p) => <Checkbox size="small" checked={selected.has(p.data.id)} onClick={(e) => { e.stopPropagation(); toggle(p.data.id); }} sx={{ p: 0.25 }} /> },
    { headerName: tx("Time"), field: "raised_at", width: 110, valueFormatter: (p) => ddmmhhmm(p.value) },
    { headerName: tx("Alarm ID"), field: "alarm_no", width: 140, cellStyle: { fontWeight: 700, color: "#1570EF" } },
    { headerName: tx("Priority"), field: "priority", width: 108, cellRenderer: (p) => <PriorityPill value={p.value} /> },
    { headerName: tx("Equipment"), field: "equipment_code", width: 100, cellStyle: { fontWeight: 700 } },
    { headerName: tx("Area"), field: "area_name", width: 100 },
    { headerName: tx("Alarm Message"), field: "message", width: 260 },
    { headerName: tx("Duration"), field: "duration_min", width: 95, type: "numericColumn", valueFormatter: (p) => minText(p.value) },
    { headerName: tx("Source"), field: "source", width: 90, valueFormatter: (p) => label("source", p.value) },
    { headerName: tx("Status"), field: "status", width: 126, pinned: "right", cellRenderer: (p) => <Pill group="alarmStatus" value={p.value} colors={ALARM_STATUS_COLORS} /> },
  ]), [language, selected]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const pct = (n) => (k.active ? `${num((n / k.active) * 100, 1)}%` : "0%");
  const bulk = async (mode, { note, hours }) => {
    setSaving(true);
    try {
      const r = await request(`${API}/bulk/${mode}`, { method: "POST", body: JSON.stringify({ ids: [...selected], actor, note: note.trim() || null, hours }) });
      notify(r.skipped.length ? "warning" : "success", `${tx("Done: {n}", { n: r.done })}${r.skipped.length ? ` · ${tx("Skipped: {list}", { list: r.skipped.join("; ") })}` : ""}`);
      setDialog(null); setSelected(new Set()); await load({ silent: true });
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const openBulk = (mode) => (selected.size ? setDialog({ type: "bulk", mode }) : notify("info", tx("Select alarms in the list first.")));
  const exportCsv = () => downloadExcel(`alarms-${period.from}_${period.to}.csv`,
    ["Alarm ID", "Time", "Priority", "Equipment", "Area", "Message", "Duration min", "Status", "Source", "Value", "Limit", "Acknowledged by", "Closed by"],
    rows.map((a) => [a.alarm_no, a.raised_at, a.priority, a.equipment_code, a.area_name, a.message, a.duration_min, a.status, a.source, a.value, a.limit_value, a.acknowledged_by, a.closed_by]));
  const heatMax = Math.max(...data.heatmap.flatMap((h) => h.cells), 1);
  const maxArea = Math.max(...data.by_area.map(([, n]) => n), 1);
  const typeTotal = data.by_type.reduce((a, [, n]) => a + n, 0);
  const tableSx = { "& .MuiTableCell-root": { fontSize: 11, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } };
  const tabs = [["ALL", tx("All"), data.alarms.length], ...PRIORITIES.map((p) => [p, label("priority", p), data.alarms.filter((a) => a.priority === p && a.status !== "SHELVED").length]),
    ["SHELVED", tx("Shelved"), data.alarms.filter((a) => a.status === "SHELVED").length]];

  const base = chartBase(dark, axisColor);
  const activeFilters = Object.values(filter).filter(Boolean).length;
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const quick = [
    [`${tx("Acknowledge")}${selected.size ? ` (${selected.size})` : ""}`, CheckCircleOutlineIcon, "#12B76A", () => openBulk("acknowledge"), !canEdit],
    [`${tx("Shelve")}${selected.size ? ` (${selected.size})` : ""}`, ArchiveOutlinedIcon, "#7A5AF8", () => openBulk("shelve"), !canEdit],
    [tx("Report Alarm"), AddAlertOutlinedIcon, "#F04438", () => setDialog({ type: "report" }), !canEdit],
    [tx("Request Maintenance"), BuildOutlinedIcon, "#1570EF", () => navigate("/maintenance-management/requests?create=1")],
    [tx("Downtime Management"), ReportProblemOutlinedIcon, "#F79009", () => navigate("/machine-equipment/downtime-management")],
    [tx("Machine Monitoring"), NotificationsActiveOutlinedIcon, "#0E9384", () => navigate("/machine-equipment/machine-monitoring")],
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={fitPageSx}>
        <PageMeta title={`${tx("Alarm History")} | VCC Plastics`} description={tx("Alarm lifecycle: raise, acknowledge, shelve, clear and close")} />
        <PageBreadcrumb pageTitle={tx("Alarm History")} />
        <Paper elevation={0} sx={{ ...cardSx, p: 0.75, position: "relative", overflow: "hidden" }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<NotificationsActiveOutlinedIcon />} onClick={() => setView("active")} sx={view === "active" ? btn("primary") : toolBtnSx}>{tx("Active View")}</Button>
            <Button startIcon={<HistoryOutlinedIcon />} onClick={() => setView("history")} sx={view === "history" ? btn("primary") : toolBtnSx}>{tx("History View")}</Button>
            <FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
            {view === "history" ? (
              <>
                <TextField size="small" type="date" label={tx("Period from")} value={period.from} onChange={(e) => setPeriod((o) => ({ ...o, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
                <TextField size="small" type="date" label={tx("Period to")} value={period.to} onChange={(e) => setPeriod((o) => ({ ...o, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
              </>
            ) : null}
            <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!rows.length} onClick={exportCsv} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} sx={toolBtnSx}>{tx("Print")}</Button>
            <Button startIcon={sound ? <VolumeUpOutlinedIcon /> : <VolumeOffOutlinedIcon />} onClick={() => { if (!sound) beep(); setSound((s) => !s); }} sx={toolBtnSx}>{tx(sound ? "Sound On" : "Sound Off")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
              label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {showFilter ? (
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center", mt: 0.75 }}>
              {[["equipment_id", tx("Equipment"), lookups.equipment.map((e) => [e.id, e.equipment_code])], ["area_id", tx("Area"), lookups.areas.map((a) => [a.id, a.name])],
                ["equipment_category", tx("Equipment type"), lookups.categories.map((c) => [c, c])]].map(([key, text, options]) => (
                <FormControl key={key} size="small" sx={{ width: 170 }}><InputLabel>{text}</InputLabel>
                  <Select label={text} value={filter[key]} onChange={(e) => setFilter((f) => ({ ...f, [key]: e.target.value }))}>
                    <MenuItem value="">{tx("All")}</MenuItem>{options.map(([v, n]) => <MenuItem key={v} value={v}>{n}</MenuItem>)}
                  </Select></FormControl>
              ))}
              <Button onClick={() => setFilter(EMPTY_FILTER)} disabled={!activeFilters} sx={toolBtnSx}>{tx("Clear")}</Button>
            </Stack>
          ) : null}
          {loading ? <LinearProgress sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2 }} /> : null}
        </Paper>

        <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(8, minmax(0,1fr))" }}>
          <KpiTile tone="danger" title={tx("Active Alarms")} value={num(k.active)} sub={k.active ? tx("Need attention") : ""} icon={NotificationsActiveOutlinedIcon} onClick={() => { setView("active"); setTab("ALL"); }} />
          <KpiTile tone="danger" title={tx("Critical")} value={`${num(k.critical)} (${pct(k.critical)})`} icon={ErrorOutlineIcon} onClick={() => { setView("active"); setTab("CRITICAL"); }} />
          <KpiTile tone="warning" title={tx("High")} value={`${num(k.high)} (${pct(k.high)})`} icon={ReportProblemOutlinedIcon} onClick={() => { setView("active"); setTab("HIGH"); }} />
          <KpiTile tone="accent" title={tx("Medium")} value={`${num(k.medium)} (${pct(k.medium)})`} icon={WarningAmberOutlinedIcon} onClick={() => { setView("active"); setTab("MEDIUM"); }} />
          <KpiTile tone="success" title={tx("Low")} value={`${num(k.low)} (${pct(k.low)})`} icon={InfoOutlinedIcon} onClick={() => { setView("active"); setTab("LOW"); }} />
          <KpiTile tone="info" title={tx("Shelved")} value={num(k.shelved)} icon={ArchiveOutlinedIcon} onClick={() => { setView("active"); setTab("SHELVED"); }} />
          <KpiTile tone="primary" title={tx("Today Alarms")} value={num(k.today)} sub={`${k.today >= k.yesterday ? "↑" : "↓"} ${num(Math.abs(k.today - k.yesterday))} ${tx("vs yesterday")}`} icon={ScheduleOutlinedIcon} onClick={() => setView("history")} />
          <KpiTile tone="accent" title={tx("Average Clearance Time")} value={k.clearance != null ? num(k.clearance, 1) : EMPTY} unit={k.clearance != null ? tx("min") : ""}
            sub={k.clearance_yesterday != null ? `${tx("vs yesterday")}: ${num(k.clearance_yesterday, 1)} ${tx("min")}` : ""} icon={TimerOutlinedIcon} />
        </KpiCardGroup>

        <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" } }}>
          {/* priority split lives in the KPI tiles and the list tabs, so no separate priority donut */}
          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 380, lg: 0 } }}>
            <Head title={`${tx("Alarm List")} (${view === "active" ? tx("Active View") : tx("History View")})`} action={(
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 26, "& .MuiTab-root": { minHeight: 26, py: 0, px: 1, minWidth: 0, textTransform: "none", fontWeight: 700, fontSize: 11 } }}>
                {tabs.map(([key, text, n]) => <Tab key={key} value={key} label={`${text} (${n})`} />)}
              </Tabs>
            )} />
            <Box sx={{ flex: 1, minHeight: 0, px: 1, pb: 1 }}>
              <AgGridTable rowData={rows} columnDefs={columns} height="100%" rowHeight={29} getRowId={(r) => String(r.data.id)} onRowClicked={(e) => setDialog({ type: "alarm", id: e.data.id })}
                getRowStyle={(r) => (r.data.priority === "CRITICAL" && r.data.status === "ACTIVE" ? { background: dark ? "rgba(240,68,56,.12)" : "#FEF3F2" } : null)} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
            <Head title={tx("Alarm Trend (Last 24 Hours)")} action={<Stack direction="row" spacing={1}>{PRIORITIES.map((p) => <Dot key={p} color={PRIORITY_COLORS[p]} text={label("priority", p)} />)}</Stack>} />
            <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
              <Chart type="line" height="100%" series={PRIORITIES.map((p) => ({ name: label("priority", p), data: data.trend24.map((h) => h[p]) }))} options={{
                ...base, colors: PRIORITIES.map((p) => PRIORITY_COLORS[p]), stroke: { width: 2, curve: "smooth" },
                xaxis: { ...base.xaxis, categories: data.trend24.map((h) => h.hour), tickAmount: 6 }, yaxis: { labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } },
                tooltip: { ...base.tooltip, shared: true } }} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
            <Head title={distView === "area" ? tx("Active Alarms by Area") : tx("Alarm by Equipment Type")} action={(
              <ToggleButtonGroup exclusive size="small" value={distView} onChange={(e, v) => v && setDistView(v)}>
                <ToggleButton value="type" sx={toggleSx}>{tx("Equipment type")}</ToggleButton>
                <ToggleButton value="area" sx={toggleSx}>{tx("Area")}</ToggleButton>
              </ToggleButtonGroup>
            )} />
            {distView === "type" ? (typeTotal ? (
              <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                <Chart type="donut" height={150} series={data.by_type.map(([, n]) => n)} options={{
                  chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: data.by_type.map(([t]) => t), colors: TYPE_COLORS,
                  legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
                  plotOptions: { pie: { donut: { size: "70%", labels: { show: true, total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(typeTotal) }, value: { fontSize: "14px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033" } } } } },
                }} />
                <Stack spacing={0.5}>{data.by_type.map(([t, n], i) => <Stack key={t} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}><Box sx={{ minWidth: 0, overflow: "hidden" }}><Dot color={TYPE_COLORS[i % TYPE_COLORS.length]} text={t} /></Box><Typography variant="caption" fontWeight={700}>{n}</Typography></Stack>)}</Stack>
              </Box>
            ) : <EmptyBody text={tx("No data.")} />) : (data.by_area.length ? (
              <Stack spacing={1} sx={{ flex: 1, minHeight: 0, overflow: "auto", justifyContent: "center", px: 1.5, pb: 1 }}>
                {data.by_area.map(([a, n], i) => (
                  <Box key={a} sx={{ display: "grid", gridTemplateColumns: "110px 1fr 28px", gap: 1, alignItems: "center" }}>
                    <Typography variant="caption" noWrap title={a}>{a}</Typography>
                    <Box sx={{ height: 9, borderRadius: 1, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${(n / maxArea) * 100}%`, height: "100%", bgcolor: ["#F04438", "#F79009", "#EAAA08", "#12B76A"][i % 4] }} /></Box>
                    <Typography variant="caption" fontWeight={800} sx={{ textAlign: "right" }}>{n}</Typography>
                  </Box>
                ))}
              </Stack>
            ) : <EmptyBody text={tx("No data.")} />)}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "3" } }}>
            <Head title={tx("Alarm Heatmap (by Time of Day)")} />
            {data.heatmap.length ? (
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                <Box sx={{ display: "grid", gridTemplateColumns: "80px repeat(12, minmax(18px, 1fr))", gap: 0.4 }}>
                  <Box />{Array.from({ length: 12 }, (_, i) => <Typography key={i} variant="caption" color="text.secondary" sx={{ textAlign: "center", fontSize: 10 }}>{String(i * 2).padStart(2, "0")}</Typography>)}
                  {data.heatmap.map((row) => [
                    <Typography key={`${row.area}l`} variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10 }} title={row.area}>{row.area}</Typography>,
                    ...row.cells.map((c, i) => (
                      <Tooltip key={`${row.area}${i}`} title={`${row.area} ${String(i * 2).padStart(2, "0")}:00 · ${c}`}>
                        <Box sx={{ height: 18, borderRadius: 0.5, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, color: c / heatMax > 0.5 ? "#fff" : "text.secondary",
                          bgcolor: c ? `rgba(240,68,56,${0.15 + 0.85 * (c / heatMax)})` : "action.hover" }}>{c || ""}</Box>
                      </Tooltip>
                    )),
                  ])}
                </Box>
              </Box>
            ) : <EmptyBody text={tx("No data.")} />}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
            <Head title={tx("Alarm Rate Trend (%)")} />
            <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
              <Chart type="line" height="100%" series={[{ name: tx("Alarm Rate (%)"), data: data.rate_trend.map((d) => d.rate) }]} options={{
                ...base, colors: ["#F04438"], stroke: { width: 2, curve: "straight" }, markers: { size: 3 },
                xaxis: { ...base.xaxis, categories: data.rate_trend.map((d) => `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}`) },
                yaxis: { min: 0, tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => `${num(v, 1)}%` } } }} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
            <Head title={tx("Top 5 Alarm Reasons")} action={<Typography variant="caption" color="text.secondary">{tx("Total")}: {data.period_total}</Typography>} />
            {data.top_reasons.length ? (
              <Box sx={fillSx}>
                <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(64, 18, 18) }}>
                  <TableHead><TableRow><TableCell>{tx("Reason")}</TableCell><TableCell align="right">{tx("Count")}</TableCell><TableCell align="right">{tx("Rate")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.top_reasons.map(([r, n]) => (
                    <TableRow key={r}><TableCell title={r}>{r}</TableCell><TableCell align="right">{n}</TableCell>
                      <TableCell align="right">{num((n / Math.max(data.period_total, 1)) * 100, 1)}%</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            ) : <EmptyBody text={tx("No data.")} />}
          </Paper>

          <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "3" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
            <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
          </Box>
        </Box>

        <SystemStatusBar system={data.system} />

        {dialog?.type === "alarm" && (
          <AlarmDialog api={API} request={request} alarmId={dialog.id} canEdit={canEdit} actor={actor} notify={notify} onClose={() => setDialog(null)} onChanged={() => load({ silent: true })}
            onReportDowntime={(a) => setDialog({ type: "downtime", preset: { equipment_id: a.equipment_id, reason_text: a.message, alarm_id: a.id } })} />
        )}
        {dialog?.type === "downtime" && dtLookups && (
          <DowntimeDialog mode="report" api={DT_API} request={request} lookups={dtLookups} preset={dialog.preset} actor={actor} notify={notify} onClose={() => setDialog(null)}
            onSaved={() => { setDialog(null); load({ silent: true }); }} />
        )}
        {dialog?.type === "report" && <ReportAlarmDialog api={API} request={request} lookups={lookups} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load({ silent: true }); }} />}
        {dialog?.type === "bulk" && <BulkDialog mode={dialog.mode} count={selected.size} saving={saving} onClose={() => setDialog(null)} onSubmit={(v) => bulk(dialog.mode, v)} />}
        <Snackbar open={msg.open} autoHideDuration={5000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
