import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputAdornment, InputLabel, LinearProgress, Menu, MenuItem, Paper, Select,
  Snackbar, Stack, Switch, Tab, Tabs, TextField, ThemeProvider as MuiThemeProvider, Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import PageMeta from "../../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../../config/config";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { KpiTile, downloadCsv, useRequest } from "../../../MaterialManagement/materialUi";
import { WorkOrderForm } from "../../ProductionPlanning/PlanningDialogs";
import { setActiveLanguage as setPlanningLanguage } from "../../ProductionPlanning/locales";
import { Dot, EMPTY, Head, PRIORITY_COLORS, btn, cardSx, ddmmhhmm, num, pageTheme, toInputDateTime } from "../../ProductionPlanning/ui";
import { WO_STATUSES, WO_STATUS_COLORS } from "../woStatus";
import { ActionDialog, EXCEPTION_COLORS, PriorityPill, SystemStatusBar, VisualOverview, WoDetailDialog, WoStatusPill, delayText, printWorkOrder } from "./WoParts";
import { label, localeTag, setActiveLanguage, tx } from "./woLocales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/work-orders`;
const PLANNING_API = `${BASE}/api/production-planning`;
const EMPTY_FILTER = { machine_id: "", priority: "", area_id: "", shift_id: "" };
const TABS = ["ALL", "UNSCHEDULED", "SCHEDULED", "RELEASED", "IN_PRODUCTION", "ON_HOLD", "COMPLETED", "CLOSED", "CANCELLED", "DELAYED"];
const TREND_KEYS = [["IN_PRODUCTION"], ["RELEASED"], ["SCHEDULED", "UNSCHEDULED"], ["ON_HOLD"], ["COMPLETED", "CLOSED"]];
const SUCCESS = { release: "Work order released.", hold: "Work order on hold.", resume: "Work order resumed.", cancel: "Work order cancelled.",
  priority: "Priority changed.", complete: "Work order completed.", close: "Work order closed." };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function WorkOrderManagement() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  setPlanningLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const request = useRequest();

  const [lookups, setLookups] = useState(null);
  const [period, setPeriod] = useState({ from: ymd(new Date()), to: ymd(new Date()) });
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("ALL");
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
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
      const q = new URLSearchParams({ date_from: period.from, date_to: period.to });
      Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v); });
      if (search.trim()) q.set("search", search.trim());
      const next = await request(`${API}/summary?${q}`);
      setData(next); setLastUpdate(new Date());
      setSelectedId((id) => (id && next.items.some((w) => w.id === id) ? id : next.items[0]?.id ?? null));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [period, filter, search, request, notify]);
  useEffect(() => { const t = setTimeout(() => load(), search ? 350 : 0); return () => clearTimeout(t); }, [load, search]);
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, 60000);
    return () => clearInterval(t);
  }, [autoRefresh, load, dialog]);
  useEffect(() => { const wo = Number(params.get("wo")); if (wo) setSelectedId(wo); }, [params]);

  const items = useMemo(() => data?.items || [], [data]);
  const selected = items.find((w) => w.id === selectedId) || null;
  const tabItems = useMemo(() => items.filter((w) => tab === "ALL" || (tab === "DELAYED" ? w.delayed : w.status === tab)), [items, tab]);
  const counts = useMemo(() => {
    const c = { ALL: items.length, DELAYED: items.filter((w) => w.delayed).length };
    WO_STATUSES.forEach((s) => { c[s] = items.filter((w) => w.status === s).length; });
    return c;
  }, [items]);

  const openRelease = async (wo) => {
    setDialog({ type: "action", mode: "release", wo }); setDetail(null);
    try { setDetail(await request(`${API}/${wo.id}`)); } catch (e) { notify("error", e.message); }
  };
  const runAction = async (mode, wo, { reason, priority }) => {
    setSaving(true);
    try {
      const body = { actor, version: wo.version };
      if (["hold", "cancel", "complete", "priority"].includes(mode)) body.reason = reason;
      if (mode === "priority") body.priority = priority;
      await request(`${API}/${wo.id}/${mode}`, { method: "POST", body: JSON.stringify(body) });
      setDialog(null); notify("success", tx(SUCCESS[mode])); await load({ silent: true });
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const openForm = async (copyFrom) => {
    try {
      const [planningLookups, next] = await Promise.all([request(`${PLANNING_API}/lookups`), request(`${PLANNING_API}/next-wo-no`)]);
      const initial = copyFrom ? {
        production_order_id: copyFrom.production_order_id ?? "", product_id: copyFrom.product_id, mold_id: copyFrom.mold_id ?? "", material_id: copyFrom.material_id ?? "",
        planned_qty: copyFrom.planned_qty, cavity: copyFrom.cavity, cycle_time_sec: copyFrom.cycle_time_sec, setup_minutes: copyFrom.setup_minutes,
        part_weight_g: copyFrom.part_weight_g ?? "", due_date: toInputDateTime(copyFrom.due_date), priority: copyFrom.priority, source: copyFrom.source || "MANUAL",
        source_ref: copyFrom.source_ref || "", remark: copyFrom.remark || "",
      } : undefined;
      setDialog({ type: "form", lookups: planningLookups, woNo: next?.wo_no || next?.next_wo_no || "", initial });
    } catch (e) { notify("error", e.message); }
  };
  const saveForm = async (payload) => {
    setSaving(true);
    try {
      const created = await request(`${PLANNING_API}/work-orders`, { method: "POST", body: JSON.stringify({ ...payload, created_by: actor }) });
      setDialog(null); notify("success", tx("Work order saved.")); await load({ silent: true });
      if (created?.id) setSelectedId(created.id);
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const exportCsv = () => downloadCsv(`work-orders-${period.from}_${period.to}.csv`,
    ["WO No", "Production Order", "Product", "Customer", "Machine", "Mold", "Area", "Shift", "Planned Qty", "Priority", "Status", "Start", "Due", "Progress %", "Good", "Reject", "Remaining", "Delayed", "Delay min"],
    tabItems.map((w) => [w.wo_no, w.order_no, w.product_name, w.customer_name, w.machine_code, w.mold_code, w.area_name, w.shift_code, w.planned_qty, w.priority, w.status,
      w.planned_start, w.due_date, w.progress_pct, w.good_qty, w.reject_qty, w.remaining_qty, w.delayed ? "Y" : "", w.delay_minutes]));

  const columns = useMemo(() => [
    { headerName: tx("WO No."), field: "wo_no", width: 128, pinned: "left", cellStyle: { fontWeight: 700, color: "#1570EF" } },
    { headerName: tx("Production Order No."), field: "order_no", width: 120 },
    { headerName: tx("Product"), field: "product_name", width: 140 },
    { headerName: tx("Customer"), colId: "customer", width: 100, valueGetter: (p) => p.data.customer_short_name || p.data.customer_name },
    { headerName: tx("Machine"), field: "machine_code", width: 90 },
    { headerName: tx("Mold"), field: "mold_code", width: 90 },
    { headerName: tx("Planned Qty"), field: "planned_qty", width: 90, type: "numericColumn", valueFormatter: (p) => num(p.value) },
    { headerName: tx("Priority"), field: "priority", width: 100, cellRenderer: (p) => <PriorityPill value={p.value} /> },
    { headerName: tx("Start Time"), field: "planned_start", width: 110, valueFormatter: (p) => ddmmhhmm(p.value) },
    { headerName: tx("Due Time"), field: "due_date", width: 110, valueFormatter: (p) => ddmmhhmm(p.value),
      cellStyle: (p) => (p.data.delayed ? { color: "#F04438", fontWeight: 800 } : null) },
    { headerName: tx("Progress"), field: "progress_pct", width: 140, cellRenderer: (p) => (
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", height: "100%" }}>
        <Typography variant="caption" sx={{ width: 38, textAlign: "right", fontWeight: 700 }}>{num(p.value, 0)}%</Typography>
        <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${Math.min(p.value, 100)}%`, height: "100%", bgcolor: WO_STATUS_COLORS[p.data.status] }} /></Box>
      </Stack>) },
    { headerName: tx("Good (PCS)"), field: "good_qty", width: 95, type: "numericColumn", valueFormatter: (p) => num(p.value) },
    { headerName: tx("Alerts"), colId: "alerts", width: 90, cellRenderer: (p) => (
      <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", height: "100%" }}>
        {p.data.exceptions.map((e) => <Box key={e} title={label("exception", e)} sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: EXCEPTION_COLORS[e] || "#98A2B3" }} />)}
      </Stack>) },
    { headerName: tx("Status"), field: "status", width: 126, pinned: "right", cellRenderer: (p) => <WoStatusPill value={p.value} /> },
  ].map((c) => ({ filter: false, ...c })), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const deltaNote = (d) => `${d > 0 ? "↑" : d < 0 ? "↓" : "•"} ${Math.abs(d || 0)} ${tx("vs yesterday")}`;
  const s = selected;
  const can = (mode) => {
    if (!s || !canEdit) return false;
    return {
      release: s.status === "SCHEDULED", hold: ["SCHEDULED", "RELEASED", "IN_PRODUCTION"].includes(s.status), resume: s.status === "ON_HOLD",
      cancel: ["UNSCHEDULED", "SCHEDULED", "RELEASED", "ON_HOLD"].includes(s.status) && !s.good_qty,
      priority: !["COMPLETED", "CLOSED", "CANCELLED"].includes(s.status), complete: ["IN_PRODUCTION", "ON_HOLD", "RELEASED"].includes(s.status) && s.good_qty > 0,
      close: s.status === "COMPLETED",
    }[mode];
  };
  const act = (mode) => (mode === "release" ? openRelease(s) : setDialog({ type: "action", mode, wo: s }));
  const holdOrResume = s?.status === "ON_HOLD" ? "resume" : "hold";
  const quick = [
    [tx("Create Work Order"), AddCircleOutlineIcon, "#1570EF", () => openForm(), !canEdit],
    [tx("Release"), PlayCircleOutlineIcon, "#12B76A", () => act("release"), !can("release")],
    [tx(holdOrResume === "resume" ? "Resume" : "Hold"), holdOrResume === "resume" ? PlayCircleOutlineIcon : PauseCircleOutlineIcon, "#F79009", () => act(holdOrResume), !can(holdOrResume)],
    [tx("Cancel"), CancelOutlinedIcon, "#F04438", () => act("cancel"), !can("cancel")],
    [tx("Change Priority"), FlagOutlinedIcon, "#1570EF", () => act("priority"), !can("priority")],
    [tx("Copy Work Order"), ContentCopyOutlinedIcon, "#1570EF", () => openForm(s), !s || !canEdit],
    [tx("Print"), PrintOutlinedIcon, "#1570EF", () => printWorkOrder(s), !s],
    [tx("Export"), FileDownloadOutlinedIcon, "#1570EF", exportCsv, !tabItems.length],
  ];
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const priorityKeys = ["URGENT", "HIGH", "MEDIUM", "LOW"].filter((p) => data.by_priority[p]);
  const priorityTotal = priorityKeys.reduce((a, p) => a + data.by_priority[p], 0);
  const statusKeys = WO_STATUSES.filter((st) => data.by_status[st]);
  const maxMachine = Math.max(...data.by_machine.map(([, n]) => n), 1);
  const donut = (keys, values, colors, total, labels) => ({
    chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels, colors, legend: { show: false }, dataLabels: { enabled: false },
    stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
    plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: tx("Total"), color: axisColor, formatter: () => String(total) }, value: { fontSize: "18px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033" } } } } },
  });

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Work Order Management")} | VCC Plastics`} description={tx("Work Order command center: status, progress and shop-floor actions")} />
        <PageBreadcrumb pageTitle={tx("Work Order Management")} />

        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <TextField size="small" placeholder={tx("Search WO, order, product, machine, mold...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 280 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            <Button startIcon={<AddCircleOutlineIcon />} disabled={!canEdit} onClick={() => openForm()} sx={btn("primary")}>{tx("Create Work Order")}</Button>
            <Button startIcon={<PlayCircleOutlineIcon />} disabled={!can("release")} onClick={() => act("release")} sx={toolBtnSx}>{tx("Release")}</Button>
            <Button startIcon={holdOrResume === "resume" ? <PlayCircleOutlineIcon /> : <PauseCircleOutlineIcon />} disabled={!can(holdOrResume)} onClick={() => act(holdOrResume)} sx={toolBtnSx}>{tx(holdOrResume === "resume" ? "Resume" : "Hold")}</Button>
            <Button startIcon={<CancelOutlinedIcon />} disabled={!can("cancel")} onClick={() => act("cancel")} sx={toolBtnSx}>{tx("Cancel")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!tabItems.length} onClick={exportCsv} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<MoreHorizIcon />} onClick={(e) => setMoreAnchor(e.currentTarget)} sx={toolBtnSx}>{tx("More")}</Button>
            <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
              {[["priority", FlagOutlinedIcon, "Change Priority"], ["complete", TaskAltOutlinedIcon, "Complete"], ["close", LockOutlinedIcon, "Close WO"]].map(([mode, Icon, text]) => (
                <MenuItem key={mode} disabled={!can(mode)} onClick={() => { setMoreAnchor(null); act(mode); }}><Icon fontSize="small" sx={{ mr: 1 }} />{tx(text)}</MenuItem>
              ))}
              <MenuItem disabled={!s || !canEdit} onClick={() => { setMoreAnchor(null); openForm(s); }}><ContentCopyOutlinedIcon fontSize="small" sx={{ mr: 1 }} />{tx("Copy Work Order")}</MenuItem>
              <MenuItem disabled={!s} onClick={() => { setMoreAnchor(null); printWorkOrder(s); }}><PrintOutlinedIcon fontSize="small" sx={{ mr: 1 }} />{tx("Print")}</MenuItem>
              <MenuItem disabled={!s} onClick={() => { setMoreAnchor(null); setDialog({ type: "detail", id: s.id }); }}><InsightsOutlinedIcon fontSize="small" sx={{ mr: 1 }} />{tx("Work Order Detail")}</MenuItem>
            </Menu>
            <Box sx={{ flex: 1 }} />
            <Stack sx={{ alignItems: "flex-end" }}>
              <FormControlLabel sx={{ mr: 0 }} labelPlacement="start" control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
                label={<Typography variant="caption" fontWeight={700} sx={{ mr: 1 }}>{tx("Auto Refresh")}</Typography>} />
              <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            </Stack>
          </Stack>
        </Paper>
        {loading ? <LinearProgress sx={{ mb: 1 }} /> : null}

        <KpiCardGroup sx={{ mb: 1.5 }} columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
          <KpiTile tone="primary" title={tx("Total Work Orders")} value={num(k.total.value)} sub={deltaNote(k.total.delta)} icon={AssignmentOutlinedIcon} onClick={() => setTab("ALL")} />
          <KpiTile tone="warning" title={tx("Queued")} value={`${num(k.queued.value)} (${num(k.queued.pct, 1)}%)`} sub={tx("{n} not scheduled", { n: k.queued.created })} icon={HourglassEmptyOutlinedIcon} onClick={() => setTab("SCHEDULED")} />
          <KpiTile tone="info" title={tx("Released")} value={`${num(k.released.value)} (${num(k.released.pct, 1)}%)`} sub={deltaNote(k.released.delta)} icon={PlayCircleOutlineIcon} onClick={() => setTab("RELEASED")} />
          <KpiTile tone="success" title={tx("In Production")} value={`${num(k.in_production.value)} (${num(k.in_production.pct, 1)}%)`} sub={deltaNote(k.in_production.delta)} icon={InsightsOutlinedIcon} onClick={() => setTab("IN_PRODUCTION")} />
          <KpiTile tone="accent" title={tx("On Hold")} value={`${num(k.on_hold.value)} (${num(k.on_hold.pct, 1)}%)`} sub={deltaNote(k.on_hold.delta)} icon={PauseCircleOutlineIcon} onClick={() => setTab("ON_HOLD")} />
          <KpiTile tone="primary" title={tx("Completed Today")} value={num(k.completed_today.value)} sub={deltaNote(k.completed_today.delta)} icon={CheckCircleOutlineIcon} onClick={() => setTab("COMPLETED")} />
          <KpiTile tone="danger" title={tx("Delayed")} value={`${num(k.delayed.value)} (${num(k.delayed.pct, 1)}%)`} icon={ScheduleOutlinedIcon} onClick={() => setTab("DELAYED")} />
        </KpiCardGroup>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 400px" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Stack direction="row" sx={{ alignItems: "center", px: 1, gap: 1, flexWrap: "wrap", borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ minHeight: 42, flex: 1, "& .MuiTab-root": { minHeight: 42, textTransform: "none", fontWeight: 700, fontSize: 13, px: 1.25 } }}>
                {TABS.map((t) => <Tab key={t} value={t} label={`${t === "ALL" ? tx("All") : t === "DELAYED" ? tx("Delayed") : label("woStatus", t)} (${counts[t] || 0})`}
                  sx={t === "DELAYED" && counts.DELAYED ? { color: "#F04438" } : undefined} />)}
              </Tabs>
            </Stack>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center", p: 1 }}>
              {[["machine_id", tx("Machine"), lookups.machines.map((m) => [m.id, m.equipment_code])],
                ["priority", tx("Priority"), lookups.priorities.map((p) => [p, label("priority", p)])],
                ["area_id", tx("Area"), lookups.areas.map((a) => [a.id, a.name])],
                ["shift_id", tx("Shift"), lookups.shifts.map((sh) => [sh.id, `${sh.shift_code} · ${sh.shift_name}`])]].map(([key, text, options]) => (
                <FormControl key={key} size="small" sx={{ minWidth: 130, flex: "1 1 130px" }}><InputLabel>{text}</InputLabel>
                  <Select label={text} value={filter[key]} onChange={(e) => setFilter((f) => ({ ...f, [key]: e.target.value }))}>
                    <MenuItem value="">{tx("All")}</MenuItem>{options.map(([v, n]) => <MenuItem key={v} value={v}>{n}</MenuItem>)}
                  </Select></FormControl>
              ))}
              <TextField size="small" type="date" label={tx("Period from")} value={period.from} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 145 }} />
              <TextField size="small" type="date" label={tx("Period to")} value={period.to} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 145 }} />
              <Button onClick={() => { setFilter(EMPTY_FILTER); setSearch(""); }} sx={btn("cancel")}>{tx("Clear")}</Button>
            </Stack>
            <Box sx={{ px: 1, pb: 1 }}>
              <AgGridTable rowData={tabItems} columnDefs={columns} height={600} rowHeight={34} getRowId={(p) => String(p.data.id)}
                onRowClicked={(e) => setSelectedId(e.data.id)} onRowDoubleClicked={(e) => setDialog({ type: "detail", id: e.data.id })}
                getRowStyle={(p) => (p.data.id === selectedId ? { background: dark ? "rgba(46,144,250,.16)" : "#EFF8FF" } : null)} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...cardSx, p: 1.5, maxHeight: { xl: 756 }, overflowY: { xl: "auto" } }}>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800 }}>{tx("Selected Work Order")}</Typography>
            {!s ? <Typography variant="body2" color="text.secondary">{tx("Select a work order in the list.")}</Typography> : (
              <>
                <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate(`/production-management/work-orders/execution?wo=${s.id}`)}>{s.wo_no}</Typography>
                  <WoStatusPill value={s.status} /><PriorityPill value={s.priority} />
                </Stack>
                {s.order_no ? <Typography variant="caption" sx={{ display: "block", mb: 1, cursor: "pointer", color: "#1570EF" }}
                  onClick={() => navigate(`/production-management/production-orders/detail?order=${encodeURIComponent(s.order_no)}`)}>{tx("Production Order No.")}: {s.order_no}</Typography> : null}
                {s.exceptions.length ? (
                  <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap", mb: 1 }}>
                    {s.exceptions.map((e) => <Box key={e} component="span" sx={{ fontSize: 11, fontWeight: 700, px: 0.75, py: 0.2, borderRadius: 1, color: EXCEPTION_COLORS[e], bgcolor: `${EXCEPTION_COLORS[e]}1A` }}>
                      {label("exception", e)}{e === "DELAYED" && s.delay_minutes ? ` · ${delayText(s.delay_minutes)}` : ""}</Box>)}
                  </Stack>
                ) : null}
                {s.status === "ON_HOLD" && s.hold_reason ? <Alert severity="warning" sx={{ py: 0, mb: 1 }}>{tx("Hold reason")}: {s.hold_reason}</Alert> : null}
                <VisualOverview wo={s}
                  onMachine={() => navigate(`/machine-equipment/machine-detail?machine=${s.machine_id}`)} onMold={() => navigate(`/mold-management/detail?mold=${s.mold_id}`)} />
              </>
            )}
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, display: "block", mt: 1.5 }}>{tx("Quick Actions")}</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.75 }}>
              {quick.map(([text, Icon, color, onClick, disabled]) => (
                <Button key={text} disabled={disabled} onClick={onClick} sx={{ flexDirection: "column", gap: 0.25, py: 0.75, border: 1, borderColor: "divider", borderRadius: 1.5,
                  textTransform: "none", fontSize: 11, fontWeight: 700, lineHeight: 1.2, color: "text.primary", minWidth: 0 }}>
                  <Icon sx={{ color: disabled ? "action.disabled" : color }} />{text}
                </Button>
              ))}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "1fr 1fr 1fr" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Work Order Status Distribution")} />
            <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1.5 }}>
              <Chart type="donut" height={190} series={statusKeys.length ? statusKeys.map((st) => data.by_status[st]) : [1]}
                options={donut(statusKeys, null, statusKeys.length ? statusKeys.map((st) => WO_STATUS_COLORS[st]) : ["#EAECF0"], items.length, statusKeys.length ? statusKeys.map((st) => label("woStatus", st)) : [tx("No data.")])} />
              <Stack spacing={0.6}>
                {statusKeys.map((st) => (
                  <Stack key={st} direction="row" sx={{ justifyContent: "space-between", cursor: "pointer" }} onClick={() => setTab(st)}>
                    <Dot color={WO_STATUS_COLORS[st]} text={label("woStatus", st)} />
                    <Typography variant="caption" fontWeight={700}>{data.by_status[st]} ({num(data.by_status[st] / Math.max(items.length, 1) * 100, 1)}%)</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Work Orders by Priority")} subtitle={`(${tx("open work orders")})`} />
            <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1.5 }}>
              <Chart type="donut" height={190} series={priorityKeys.length ? priorityKeys.map((p) => data.by_priority[p]) : [1]}
                options={donut(priorityKeys, null, priorityKeys.length ? priorityKeys.map((p) => PRIORITY_COLORS[p]) : ["#EAECF0"], priorityTotal, priorityKeys.length ? priorityKeys.map((p) => label("priority", p)) : [tx("No data.")])} />
              <Stack spacing={0.6}>
                {priorityKeys.map((p) => (
                  <Stack key={p} direction="row" sx={{ justifyContent: "space-between", cursor: "pointer" }} onClick={() => setFilter((f) => ({ ...f, priority: p }))}>
                    <Dot color={PRIORITY_COLORS[p]} text={label("priority", p)} />
                    <Typography variant="caption" fontWeight={700}>{data.by_priority[p]} ({num(data.by_priority[p] / Math.max(priorityTotal, 1) * 100, 1)}%)</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Work Orders by Machine")} subtitle={`(${tx("open work orders")})`} />
            <Stack spacing={1.1} sx={{ px: 1.5, pb: 1.5 }}>
              {data.by_machine.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.by_machine.map(([code, n]) => (
                <Box key={code} sx={{ display: "grid", gridTemplateColumns: "90px 1fr 32px", gap: 1, alignItems: "center" }}>
                  <Typography variant="caption" fontWeight={700} noWrap>{code === "UNASSIGNED" ? tx("Unassigned") : code === "OTHERS" ? tx("Others") : code}</Typography>
                  <Box sx={{ height: 10, borderRadius: 1, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${(n / maxMachine) * 100}%`, height: "100%", bgcolor: code === "UNASSIGNED" ? "#98A2B3" : "#1570EF" }} /></Box>
                  <Typography variant="caption" fontWeight={800} sx={{ textAlign: "right" }}>{n}</Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.4fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Work Orders by Status Trend (7 days)")} />
            <Box sx={{ px: 1, pb: 0.5 }}>
              <Chart type="line" height={240} series={TREND_KEYS.map((keys) => ({ name: label("woStatus", keys[0]), data: data.trend.map((t) => keys.reduce((a, key) => a + (t[key] || 0), 0)) }))} options={{
                chart: { background: "transparent", toolbar: { show: false }, fontFamily: '"Bai Jamjuree", sans-serif' },
                colors: TREND_KEYS.map((keys) => WO_STATUS_COLORS[keys[0]]), stroke: { width: 2.5, curve: "smooth" }, markers: { size: 3 },
                xaxis: { categories: data.trend.map((t) => `${t.date.slice(8, 10)}/${t.date.slice(5, 7)}`), labels: { style: { colors: axisColor, fontSize: "10px" } } },
                yaxis: { labels: { style: { colors: axisColor }, formatter: (v) => num(v) } }, legend: { position: "bottom", labels: { colors: axisColor } },
                grid: { borderColor: dark ? "#263244" : "#EEF2F6" }, tooltip: { theme: dark ? "dark" : "light" },
              }} />
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Delayed Work Orders")} subtitle={`(${data.kpis.delayed.value})`} action={<WarningAmberOutlinedIcon sx={{ color: "#F04438" }} fontSize="small" />} />
            <Box sx={{ px: 1.5, pb: 1.5, maxHeight: 270, overflow: "auto" }}>
              {data.delayed.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.delayed.map((w) => (
                <Box key={w.id} onClick={() => setSelectedId(w.id)} sx={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 0.5, py: 0.9, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Typography variant="caption" fontWeight={800} sx={{ color: "#1570EF" }}>{w.wo_no}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{w.product_name} · {w.machine_code || EMPTY}</Typography></Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }} noWrap>
                      {tx("Reason")}: {w.delay_reason ? (label("exception", w.delay_reason) !== w.delay_reason ? label("exception", w.delay_reason) : w.delay_reason) : EMPTY} · {tx("Due Time")}: {ddmmhhmm(w.due_date)}
                    </Typography>
                  </Box>
                  <Stack sx={{ alignItems: "flex-end" }}><Typography variant="caption" fontWeight={800} sx={{ color: "#F04438" }}>+{delayText(w.delay_minutes)}</Typography><WoStatusPill value={w.status} /></Stack>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        <SystemStatusBar system={data.system} />

        {dialog?.type === "action" && (
          <ActionDialog mode={dialog.mode} wo={dialog.wo} detail={detail} saving={saving} onClose={() => setDialog(null)} onSubmit={(v) => runAction(dialog.mode, dialog.wo, v)} />
        )}
        {dialog?.type === "form" && (
          <WorkOrderForm initial={dialog.initial} lookups={dialog.lookups} defaultWoNo={dialog.woNo} saving={saving} onClose={() => setDialog(null)} onSave={saveForm} />
        )}
        {dialog?.type === "detail" && (
          <WoDetailDialog api={API} request={request} woId={dialog.id} notify={notify} onClose={() => setDialog(null)}
            onExecution={(w) => navigate(`/production-management/work-orders/execution?wo=${w.id}`)}
            onOrder={(w) => navigate(`/production-management/production-orders/detail?order=${encodeURIComponent(w.order_no)}`)} />
        )}
        <Snackbar open={msg.open} autoHideDuration={6000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
