import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputAdornment, InputLabel, LinearProgress, Menu, MenuItem, Paper, Select,
  Snackbar, Stack, Switch, Tab, Tabs, TextField, ThemeProvider as MuiThemeProvider, Typography,
} from "@mui/material";
import AddchartOutlinedIcon from "@mui/icons-material/AddchartOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import MonitorHeartOutlinedIcon from "@mui/icons-material/MonitorHeartOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";

import { getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import PageMeta from "../../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../../config/config";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { KpiTile, downloadExcel, useRequest } from "../../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, num, pageTheme, person } from "../../ProductionPlanning/ui";
import { WO_STATUS_COLORS } from "../woStatus";
import { ActionDialog, SystemStatusBar, WoStatusPill } from "../WorkOrderManagement/WoParts";
import { ExecDialog, ProductionLogDialog, SelectedPanel, printProductionReport, readinessText } from "./ExParts";
import { label, localeTag, setActiveLanguage, tx } from "./exLocales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/production-execution`;
const WO_API = `${BASE}/api/work-orders`;
const REASON_BAR_COLORS = ["#F04438", "#F79009", "#7A5AF8", "#2E90FA", "#0BA5EC", "#98A2B3"];
const TABS = [["IN_PRODUCTION", "Active"], ["ON_HOLD", "On Hold"], ["RELEASED", "Ready to Start"], ["DONE", "Completed Today"]];
const SUCCESS = { start: "Production started.", output: "Output recorded.", reject: "Reject recorded.", adjust: "Quantities adjusted.",
  hold: "Work order on hold.", resume: "Work order resumed.", end: "Production ended.", priority: "Priority changed." };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const vsNote = (today, yesterday, unit = "") => (yesterday == null ? "" : `${tx("yesterday {n}", { n: `${num(yesterday, unit === "%" ? 2 : 0)}${unit}` })}${today != null && yesterday ? ` · ${today >= yesterday ? "↑" : "↓"} ${num(Math.abs(((today - yesterday) / (yesterday || 1)) * 100), 1)}%` : ""}`);

export default function ProductionExecution() {
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
  const [day, setDay] = useState(ymd(new Date()));
  const [filter, setFilter] = useState({ machine_id: "", shift_id: "" });
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("IN_PRODUCTION");
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [moreAnchor, setMoreAnchor] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  useEffect(() => { request(`${API}/lookups`).then(setLookups).catch((e) => notify("error", e.message)); }, [request, notify]);
  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ business_date: day });
      Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v); });
      if (search.trim()) q.set("search", search.trim());
      const next = await request(`${API}/summary?${q}`);
      setData(next); setLastUpdate(new Date());
      setSelectedId((id) => (id && next.items.some((w) => w.id === id) ? id : next.items[0]?.id ?? null));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [day, filter, search, request, notify]);
  useEffect(() => { const t = setTimeout(() => load(), search ? 350 : 0); return () => clearTimeout(t); }, [load, search]);
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, 30000);
    return () => clearInterval(t);
  }, [autoRefresh, load, dialog]);
  useEffect(() => { const wo = Number(params.get("wo")); if (wo) setSelectedId(wo); }, [params]);
  const loadDetail = useCallback(async (id) => {
    if (!id) { setDetail(null); return; }
    try { setDetail(await request(`${API}/${id}`)); } catch (e) { notify("error", e.message); }
  }, [request, notify]);
  useEffect(() => { loadDetail(selectedId); }, [selectedId, data, loadDetail]);

  const items = useMemo(() => data?.items || [], [data]);
  useEffect(() => {
    if (!selectedId || !items.length) return;
    const w = items.find((x) => x.id === selectedId);
    if (w) setTab(["COMPLETED", "CLOSED"].includes(w.status) ? "DONE" : w.status);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps
  const tabItems = useMemo(() => items.filter((w) => (tab === "DONE" ? ["COMPLETED", "CLOSED"].includes(w.status) : w.status === tab)), [items, tab]);
  const counts = useMemo(() => ({ IN_PRODUCTION: items.filter((w) => w.status === "IN_PRODUCTION").length, ON_HOLD: items.filter((w) => w.status === "ON_HOLD").length,
    RELEASED: items.filter((w) => w.status === "RELEASED").length, DONE: items.filter((w) => ["COMPLETED", "CLOSED"].includes(w.status)).length }), [items]);
  const s = items.find((w) => w.id === selectedId) || null;
  const sel = detail && s && detail.id === s.id ? { ...s, ...detail } : s;

  const runExec = async (mode, wo, body) => {
    setSaving(true);
    try {
      const url = mode === "priority" ? `${WO_API}/${wo.id}/priority` : `${API}/${wo.id}/${mode}`;
      const res = await request(url, { method: "POST", body: JSON.stringify({ ...body, actor, version: wo.version }) });
      setDialog(null);
      const missing = (res?.not_at_machine || []).map((m) => `${m.material_code} (${num(m.missing_qty, 3)} ${m.unit})`).join(", ");
      notify(missing ? "warning" : "success", missing ? `${tx(SUCCESS[mode])} ${tx("Material not at machine: {list}", { list: missing })}` : tx(SUCCESS[mode]));
      await load({ silent: true });
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const addNote = async () => {
    if (!note.trim() || !s) return;
    try { await request(`${API}/${s.id}/notes`, { method: "POST", body: JSON.stringify({ text: note.trim(), actor }) }); setNote(""); notify("success", tx("Note added.")); loadDetail(s.id); }
    catch (e) { notify("error", e.message); }
  };
  const exportCsv = () => downloadExcel(`production-execution-${day}.csv`,
    ["WO No", "Production Order", "Product", "Machine", "Mold", "Status", "Planned", "Good", "Reject", "Progress %", "Avg cycle s", "Ideal cycle s", "Yield %", "OEE %", "Start", "Operator"],
    tabItems.map((w) => [w.wo_no, w.order_no, w.product_name, w.machine_code, w.mold_code, w.status, w.planned_qty, w.good_qty, w.reject_qty, w.progress_pct,
      w.metrics.avg_cycle_sec, w.cycle_time_sec, w.metrics.yield_pct, w.metrics.oee_pct, w.started_at, w.operator_code ? person(w.operator_code_name, w.operator_code) : ""]));

  const columns = useMemo(() => [
    { headerName: tx("WO No."), field: "wo_no", width: 110, pinned: "left", cellStyle: { fontWeight: 700, color: "#1570EF" } },
    { headerName: tx("Production Order No."), field: "order_no", width: 98 },
    { headerName: tx("Product"), field: "product_name", flex: 1, minWidth: 90, tooltipField: "product_name" },
    { headerName: tx("Machine"), field: "machine_code", width: 68 },
    { headerName: tx("Mold"), field: "mold_code", width: 94 },
    { headerName: tx("Planned"), headerTooltip: tx("Planned Qty"), field: "planned_qty", width: 68, type: "numericColumn", valueFormatter: (p) => num(p.value) },
    { headerName: tx("Good"), headerTooltip: tx("Good (PCS)"), field: "good_qty", width: 58, type: "numericColumn", valueFormatter: (p) => num(p.value), cellStyle: { color: "#039855", fontWeight: 700 } },
    { headerName: tx("Reject"), headerTooltip: tx("Reject (PCS)"), field: "reject_qty", width: 56, type: "numericColumn", valueFormatter: (p) => num(p.value), cellStyle: { color: "#D92D20" } },
    { headerName: tx("Progress"), field: "progress_pct", width: 96, cellRenderer: (p) => (
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", height: "100%" }}>
        <Typography variant="caption" sx={{ width: 29, textAlign: "right", fontWeight: 700 }}>{num(p.value, 0)}%</Typography>
        <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${Math.min(p.value, 100)}%`, height: "100%", bgcolor: WO_STATUS_COLORS[p.data.status] }} /></Box>
      </Stack>) },
    { headerName: tx("Cycle (s)"), colId: "cycle", width: 70, type: "numericColumn", valueGetter: (p) => p.data.metrics.avg_cycle_sec,
      valueFormatter: (p) => (p.value ? num(p.value, 1) : EMPTY), cellStyle: (p) => (p.value && p.value > p.data.cycle_time_sec * 1.1 ? { color: "#F04438", fontWeight: 700 } : null) },
    { headerName: "OEE", colId: "oee", width: 60, type: "numericColumn", valueGetter: (p) => p.data.metrics.oee_pct, valueFormatter: (p) => (p.value != null ? `${num(p.value, 1)}%` : EMPTY) },
    { headerName: tx("Start Time"), colId: "start", width: 78, valueGetter: (p) => p.data.started_at || p.data.planned_start, valueFormatter: (p) => ddmmhhmm(p.value) },
    { headerName: tx("Status"), field: "status", width: 116, pinned: "right", cellRenderer: (p) => <WoStatusPill value={p.value} /> },
  ].map((c) => ({ filter: false, minWidth: c.width, ...c })), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const can = (mode) => {
    if (!s || !canEdit) return false;
    const st = s.status;
    return { start: st === "RELEASED", output: st === "IN_PRODUCTION", reject: ["IN_PRODUCTION", "ON_HOLD"].includes(st), adjust: ["IN_PRODUCTION", "ON_HOLD", "COMPLETED"].includes(st),
      hold: ["RELEASED", "IN_PRODUCTION"].includes(st), resume: st === "ON_HOLD", end: ["IN_PRODUCTION", "ON_HOLD"].includes(st) && (s.good_qty + s.reject_qty) > 0,
      priority: !["COMPLETED", "CLOSED", "CANCELLED"].includes(st) }[mode];
  };
  const open = (mode) => {
    if (mode === "resume") return runExec("resume", s, {});
    if (mode === "priority") return setDialog({ type: "priority", wo: s });
    return setDialog({ type: "exec", mode, wo: sel });
  };
  const holdMode = s?.status === "ON_HOLD" ? "resume" : "hold";
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const tool = [
    [s?.status === "RELEASED" ? "start" : holdMode === "resume" ? "resume" : "hold", s?.status === "RELEASED" ? tx("Start Production") : tx(holdMode === "resume" ? "Resume" : "Hold"),
      s?.status === "RELEASED" || holdMode === "resume" ? PlayCircleOutlineIcon : PauseCircleOutlineIcon],
    ["output", tx("Report Output"), AddchartOutlinedIcon], ["end", tx("End Production"), StopCircleOutlinedIcon],
    ["reject", tx("Reject"), BlockOutlinedIcon], ["adjust", tx("Qty Adjustment"), EditNoteOutlinedIcon],
  ];
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const grid = { borderColor: dark ? "#263244" : "#EEF2F6" };
  const statusKeys = ["IN_PRODUCTION", "ON_HOLD", "RELEASED", "COMPLETED", "CLOSED"].filter((st) => data.by_status[st]);
  const statusTotal = statusKeys.reduce((a, st) => a + data.by_status[st], 0);
  const goodRejectTotal = k.good_today + k.reject_today;
  const maxReason = Math.max(...data.top_reasons.map(([, n]) => n), 1);
  const reasonText = (r) => (tx(r) !== r ? tx(r) : r);
  const donutOpts = (labels, colors, total) => ({
    chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels, colors, legend: { show: false }, dataLabels: { enabled: false },
    stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
    plotOptions: { pie: { donut: { size: "76%", labels: { show: true, total: { show: true, label: tx("Total"), color: axisColor, fontSize: "10px", formatter: () => num(total) }, name: { fontSize: "10px", offsetY: -2 }, value: { fontSize: "18px", fontWeight: 800, offsetY: 2, color: dark ? "#F3F4F6" : "#172033" } } } } },
  });
  const cats = data.trend.map((t) => `${t.date.slice(8, 10)}/${t.date.slice(5, 7)}`);
  // Shared look for the analysis cards: same paddings, axis text, no in-chart legend (legends sit in the card header).
  const chartCard = { ...cardSx, display: "flex", flexDirection: "column" };
  const chartBody = { flex: 1, minHeight: { xs: 150, xl: 0 }, px: 0.5 };
  const donutBody = { flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "116px minmax(0,1fr)", alignItems: "center", gap: 1, pl: 0.5, pr: 1.5 };
  const emptyBody = <Box sx={{ flex: 1, display: "grid", placeItems: "center", pb: 2 }}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></Box>;
  const chartBase = {
    chart: { background: "transparent", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: '"Bai Jamjuree", sans-serif', parentHeightOffset: 0 },
    legend: { show: false }, dataLabels: { enabled: false }, tooltip: { theme: dark ? "dark" : "light" },
    grid: { ...grid, strokeDashArray: 3, padding: { top: -8, right: 8, bottom: -4, left: 4 } },
    xaxis: { labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: axisColor, fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: axisColor, fontSize: "10px" } } },
  };
  const legendRow = (key, color, text, value, pct) => (
    <Box key={key} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", columnGap: 1, alignItems: "center" }}>
      <Box sx={{ minWidth: 0, overflow: "hidden", "& .MuiTypography-root": { fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }}><Dot color={color} text={text} /></Box>
      <Typography variant="caption" sx={{ fontSize: 11, whiteSpace: "nowrap" }}><b>{value}</b> <Box component="span" sx={{ color: "text.secondary" }}>· {pct}</Box></Typography>
    </Box>
  );

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: { lg: "calc(var(--app-vh, 100vh) - 74px)" }, minHeight: 0, "& > *": { flexShrink: 0 } }}>
        <PageMeta title={`${tx("Production Execution")} | VCC Plastics`} description={tx("Real-time control of work orders at the machines")} />
        <PageBreadcrumb pageTitle={tx("Production Execution")} />

        <Paper elevation={0} sx={{ ...cardSx, p: 0.75 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            {tool.map(([mode, text, Icon]) => (
              <Button key={mode} startIcon={<Icon />} disabled={!can(mode)} onClick={() => open(mode)} sx={mode === "output" ? btn("primary") : toolBtnSx}>{text}</Button>
            ))}
            <Button startIcon={<MonitorHeartOutlinedIcon />} onClick={() => navigate("/machine-equipment/machine-monitoring")} sx={toolBtnSx}>{tx("Param Monitor")}</Button>
            <Button startIcon={<ListAltOutlinedIcon />} disabled={!s} onClick={() => setDialog({ type: "log", id: s.id })} sx={toolBtnSx}>{tx("Production Log")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!tabItems.length} onClick={exportCsv} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<MoreHorizIcon />} onClick={(e) => setMoreAnchor(e.currentTarget)} sx={toolBtnSx}>{tx("More")}</Button>
            <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
              <MenuItem disabled={!can("priority")} onClick={() => { setMoreAnchor(null); open("priority"); }}><FlagOutlinedIcon fontSize="small" sx={{ mr: 1 }} />{tx("Change Priority")}</MenuItem>
              <MenuItem disabled={!s} onClick={() => { setMoreAnchor(null); printProductionReport(sel); }}><PrintOutlinedIcon fontSize="small" sx={{ mr: 1 }} />{tx("Print Production Report")}</MenuItem>
              <MenuItem disabled={!s} onClick={() => { setMoreAnchor(null); navigate(`/production-management/work-orders/management?wo=${s.id}`); }}><InsightsOutlinedIcon fontSize="small" sx={{ mr: 1 }} />{tx("Work Order Management")}</MenuItem>
            </Menu>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
              label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {loading ? <LinearProgress sx={{ mt: 0.5, height: 2 }} /> : null}
        </Paper>

        <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
          <KpiTile tone="primary" title={tx("Active Work Orders")} value={num(k.active)} sub={tx("{n} on hold · {m} ready", { n: k.on_hold, m: k.ready })} icon={AssignmentOutlinedIcon} onClick={() => setTab("IN_PRODUCTION")} />
          <KpiTile tone="info" title={tx("Planned Qty (Today)")} value={num(k.planned_qty)} unit="pcs" icon={TaskAltOutlinedIcon} />
          <KpiTile tone="success" title={tx("Good Qty (Today)")} value={num(k.good_today)} unit="pcs" sub={vsNote(k.good_today, k.good_yesterday)} icon={InsightsOutlinedIcon} />
          <KpiTile tone="danger" title={tx("Reject Qty (Today)")} value={num(k.reject_today)} unit="pcs" sub={vsNote(k.reject_today, k.reject_yesterday)} icon={ReportGmailerrorredOutlinedIcon} />
          <KpiTile tone="accent" title={tx("Yield (Today)")} value={k.yield_today != null ? num(k.yield_today, 2) : EMPTY} unit={k.yield_today != null ? "%" : ""} sub={vsNote(k.yield_today, k.yield_yesterday, "%")} icon={PercentOutlinedIcon} />
          <KpiTile tone="warning" title={tx("OEE (Line Average)")} value={k.oee != null ? num(k.oee, 1) : EMPTY} unit={k.oee != null ? "%" : ""} icon={SpeedOutlinedIcon} />
          <KpiTile tone="primary" title={tx("Avg Cycle Time")} value={k.avg_cycle != null ? num(k.avg_cycle, 1) : EMPTY} unit={k.avg_cycle != null ? "s" : ""} sub={k.ideal_cycle ? tx("ideal {n} s", { n: num(k.ideal_cycle, 1) }) : ""} icon={TimerOutlinedIcon} />
        </KpiCardGroup>

        <Box sx={{ flex: "1 1 0", minHeight: { xs: 640, lg: 0 }, display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 460px" }, gap: 1 }}>
          <Paper elevation={0} sx={{ ...cardSx, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Stack direction="row" sx={{ flexShrink: 0, alignItems: "center", px: 1, borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 30, flex: 1, "& .MuiTab-root": { minHeight: 30, textTransform: "none", fontWeight: 700, fontSize: 11.5 } }}>
                {TABS.map(([key, text]) => <Tab key={key} value={key} label={`${tx(text)} (${counts[key]})`} />)}
              </Tabs>
            </Stack>
            <Stack direction="row" sx={{ flexShrink: 0, gap: 1, flexWrap: "wrap", alignItems: "center", p: 1 }}>
              <TextField size="small" placeholder={tx("Search WO, order, product, machine, mold...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: "1 1 220px" }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
              {[["machine_id", tx("Machine"), lookups.machines.map((m) => [m.id, m.equipment_code])], ["shift_id", tx("Shift"), lookups.shifts.map((sh) => [sh.id, `${sh.shift_code} · ${sh.shift_name}`])]].map(([key, text, options]) => (
                <FormControl key={key} size="small" sx={{ minWidth: 140 }}><InputLabel>{text}</InputLabel>
                  <Select label={text} value={filter[key]} onChange={(e) => setFilter((f) => ({ ...f, [key]: e.target.value }))}>
                    <MenuItem value="">{tx("All")}</MenuItem>{options.map(([v, n]) => <MenuItem key={v} value={v}>{n}</MenuItem>)}
                  </Select></FormControl>
              ))}
              <TextField size="small" type="date" label={tx("Business date")} value={day} onChange={(e) => setDay(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
            </Stack>
            {tab === "RELEASED" && tabItems.some((w) => w.readiness.length) ? (
              <Alert severity="warning" sx={{ flexShrink: 0, mx: 1, mb: 1, py: 0 }}>
                {tabItems.filter((w) => w.readiness.length).map((w) => `${w.wo_no}: ${w.readiness.map(readinessText).join(", ")}`).join(" · ")}
              </Alert>
            ) : null}
            <Box sx={{ px: 1, pb: 1, flex: 1, minHeight: { xs: 360, lg: 0 } }}>
              <AgGridTable rowData={tabItems} columnDefs={columns} height="100%" rowHeight={29} getRowId={(p) => String(p.data.id)} onRowClicked={(e) => setSelectedId(e.data.id)}
                getRowStyle={(p) => (p.data.id === selectedId ? { background: dark ? "rgba(46,144,250,.16)" : "#EFF8FF" } : null)} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, px: 1.5, py: 0.75, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column" }} title={tx("Work Order Details")}>
            {!sel ? <Typography variant="body2" color="text.secondary">{tx("No active work order.")}</Typography> : (
              <>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                  <Typography fontWeight={800} sx={{ fontSize: 16, lineHeight: 1.3, color: "#1570EF", cursor: "pointer" }} onClick={() => navigate(`/production-management/work-orders/management?wo=${sel.id}`)}>{sel.wo_no}</Typography>
                  <WoStatusPill value={sel.status} />
                </Stack>
                <SelectedPanel wo={sel} dark={dark} sx={{ flex: 1, justifyContent: "space-evenly" }}
                  onMachine={() => navigate(`/machine-equipment/machine-detail?machine=${sel.machine_id}`)} onMold={() => navigate(`/mold-management/detail?mold=${sel.mold_id}`)}
                  onOrder={() => navigate(`/production-management/production-orders/detail?order=${encodeURIComponent(sel.order_no)}`)}
                  onWorkOrder={() => navigate(`/production-management/work-orders/management?wo=${sel.id}`)} />
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <TextField size="small" fullWidth placeholder={tx("Add a note (mold change, parameter change, incident...)")} value={note} onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} disabled={!canEdit} />
                  <Button onClick={addNote} disabled={!canEdit || !note.trim()} sx={btn("primary")}>{tx("Add")}</Button>
                </Stack>
                <Box sx={{ maxHeight: 64, overflow: "auto", mt: 0.5 }}>
                  {(detail?.logs || []).filter((l) => l.event_type === "NOTE").map((l) => (
                    <Typography key={l.id} variant="caption" sx={{ display: "block", py: 0.25 }}><b>{ddmmhhmm(l.event_at)} · {person(l.actor_name, l.actor)}:</b> {l.reason_text}</Typography>
                  ))}
                </Box>
              </>
            )}
          </Paper>
        </Box>

        {/* Analysis: six equal cards, each with a title row and a body that fills the card */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }, gap: 1, "& > *": { height: { xl: 176 } } }}>
          <Paper elevation={0} sx={chartCard}>
            <Head title={tx("Progress by Status")} />
            <Box sx={donutBody}>
              <Chart type="donut" height={128} series={statusKeys.length ? statusKeys.map((st) => data.by_status[st]) : [1]}
                options={donutOpts(statusKeys.length ? statusKeys.map((st) => label("woStatus", st)) : [tx("No data.")], statusKeys.length ? statusKeys.map((st) => WO_STATUS_COLORS[st]) : ["#EAECF0"], statusTotal)} />
              <Stack spacing={0.9} sx={{ minWidth: 0 }}>
                {statusKeys.length ? statusKeys.map((st) => legendRow(st, WO_STATUS_COLORS[st], label("woStatus", st), num(data.by_status[st]), `${num(data.by_status[st] / Math.max(statusTotal, 1) * 100, 0)}%`))
                  : <Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography>}
              </Stack>
            </Box>
          </Paper>
          <Paper elevation={0} sx={chartCard}>
            <Head title={tx("Good / Reject Analysis (Today)")} />
            <Box sx={donutBody}>
              <Chart type="donut" height={128} series={goodRejectTotal ? [k.good_today, k.reject_today] : [1]}
                options={donutOpts(goodRejectTotal ? [tx("Good"), tx("Reject")] : [tx("No data.")], goodRejectTotal ? ["#12B76A", "#F04438"] : ["#EAECF0"], goodRejectTotal)} />
              <Stack spacing={0.9} sx={{ minWidth: 0 }}>
                {legendRow("good", "#12B76A", tx("Good"), num(k.good_today), `${num(goodRejectTotal ? (k.good_today / goodRejectTotal) * 100 : 0, 1)}%`)}
                {legendRow("reject", "#F04438", tx("Reject"), num(k.reject_today), `${num(goodRejectTotal ? (k.reject_today / goodRejectTotal) * 100 : 0, 1)}%`)}
              </Stack>
            </Box>
          </Paper>
          <Paper elevation={0} sx={chartCard}>
            <Head title={tx("Top Delay Reasons")} />
            {data.top_reasons.length === 0 ? emptyBody : (
              <Stack spacing={0.9} sx={{ px: 1.5, pb: 1, flex: 1, minHeight: 0, overflow: "auto" }}>
                {data.top_reasons.map(([r, n], i) => (
                  <Box key={r}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", mb: 0.3 }}>
                      <Typography variant="caption" noWrap title={reasonText(r)} sx={{ minWidth: 0 }}>{reasonText(r)}</Typography>
                      <Typography variant="caption" fontWeight={800}>{n}</Typography>
                    </Stack>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}>
                      <Box sx={{ width: `${(n / maxReason) * 100}%`, height: "100%", borderRadius: 3, bgcolor: REASON_BAR_COLORS[i % REASON_BAR_COLORS.length] }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
          <Paper elevation={0} sx={chartCard}>
            <Head title={tx("Production Trend (7 days)")} subtitle="(pcs)" />
            <Box sx={chartBody}>
              <Chart type="line" height="100%" series={[{ name: tx("Planned"), data: data.trend.map((t) => t.planned) }, { name: tx("Good"), data: data.trend.map((t) => t.good) }, { name: tx("Reject"), data: data.trend.map((t) => t.reject) }]}
                options={{ ...chartBase, colors: ["#1570EF", "#12B76A", "#F04438"], stroke: { width: 2, curve: "straight" }, markers: { size: 2.5, strokeWidth: 0 },
                  xaxis: { ...chartBase.xaxis, categories: cats }, yaxis: { ...chartBase.yaxis, min: 0, forceNiceScale: true, labels: { ...chartBase.yaxis.labels, formatter: (v) => num(v) } } }} />
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center", pb: 0.75 }}><Dot color="#1570EF" text={tx("Planned")} /><Dot color="#12B76A" text={tx("Good")} /><Dot color="#F04438" text={tx("Reject")} /></Stack>
          </Paper>
          <Paper elevation={0} sx={chartCard}>
            <Head title={tx("Cycle Time Trend (avg)")} subtitle="(s)" action={k.ideal_cycle ? <Dot color="#F79009" text={`${tx("Ideal cycle")} ${num(k.ideal_cycle, 1)} s`} /> : null} />
            {data.trend.some((t) => t.cycle) ? (
              <Box sx={chartBody}>
                <Chart type="line" height="100%" series={[{ name: tx("Actual cycle"), data: data.trend.map((t) => (t.cycle ? Number(t.cycle.toFixed(1)) : null)) }]}
                  options={{ ...chartBase, colors: ["#1570EF"], stroke: { width: 2, curve: "straight" }, markers: { size: 3, strokeWidth: 0 },
                    xaxis: { ...chartBase.xaxis, categories: cats }, yaxis: { ...chartBase.yaxis, labels: { ...chartBase.yaxis.labels, formatter: (v) => num(v, 1) } },
                    annotations: k.ideal_cycle ? { yaxis: [{ y: k.ideal_cycle, borderColor: "#F79009", strokeDashArray: 4 }] } : {} }} />
              </Box>
            ) : emptyBody}
          </Paper>
          <Paper elevation={0} sx={chartCard}>
            <Head title={tx("Machine Utilization")} subtitle="(%)" />
            {data.machine_utilization.length ? (
              <Box sx={chartBody}>
                <Chart type="bar" height="100%" series={[{ name: tx("Utilization"), data: data.machine_utilization.map(([, v]) => v) }]}
                  options={{ ...chartBase, colors: ["#1570EF"], plotOptions: { bar: { columnWidth: "42%", borderRadius: 3, dataLabels: { position: "top" } } },
                    dataLabels: { enabled: true, formatter: (v) => `${num(v, 0)}%`, offsetY: -16, style: { fontSize: "10px", colors: [axisColor] } },
                    xaxis: { ...chartBase.xaxis, categories: data.machine_utilization.map(([m]) => m) },
                    yaxis: { ...chartBase.yaxis, min: 0, max: 100, tickAmount: 4, labels: { ...chartBase.yaxis.labels, formatter: (v) => `${num(v, 0)}%` } } }} />
              </Box>
            ) : emptyBody}
          </Paper>
        </Box>

        <SystemStatusBar system={data.system} />

        {dialog?.type === "exec" && (
          <ExecDialog mode={dialog.mode} wo={dialog.wo} reasons={lookups.reasons} employees={lookups.employees || []} saving={saving} actor={actor} onClose={() => setDialog(null)} onSubmit={(body) => runExec(dialog.mode, dialog.wo, body)} />
        )}
        {dialog?.type === "priority" && (
          <ActionDialog mode="priority" wo={dialog.wo} saving={saving} onClose={() => setDialog(null)} onSubmit={({ reason, priority }) => runExec("priority", dialog.wo, { reason, priority })} />
        )}
        {dialog?.type === "log" && <ProductionLogDialog api={API} request={request} woId={dialog.id} notify={notify} onClose={() => setDialog(null)} />}
        <Snackbar open={msg.open} autoHideDuration={6000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
