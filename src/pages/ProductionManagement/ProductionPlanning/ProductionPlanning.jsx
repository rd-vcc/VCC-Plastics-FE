import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem,
  Paper, Popover, Select, Snackbar, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  ThemeProvider as MuiThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";

import { getAccessToken, getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCard } from "../../../components/kpi/KpiCardSystem";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { label, localeTag, setActiveLanguage, tx } from "./locales";
import PlanningGantt, { PROGRESS_COLORS } from "./PlanningGantt";
import {
  AlertList, AlertsDialog, CapacityCheckDialog, MaterialCheckDialog, ProgressDialog, ScheduleDialog,
  SimulationDialog, WorkOrderDetailDialog, WorkOrderForm,
} from "./PlanningDialogs";
import {
  Dot, EMPTY, Head, MATERIAL_COLORS, PlanStatusChip, PriorityChip, btn, cardSx, ddmmhhmm, fmtDuration, hhmm,
  localIsoDate, num, pageTheme,
} from "./ui";

const API = `${API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "")}/api/production-planning`;
const VIEW_KEY = "vcc.productionPlanning.view";
const AUTO_REFRESH_MS = 60000;
const NO_FILTER = { group: "all", state: "all", priority: "all" };
const ORDER_BUCKETS = [
  ["ON_TRACK", "on_track"], ["AT_RISK", "at_risk"], ["DELAY", "delayed"], ["NOT_STARTED", "not_started"],
];

function readSavedView() {
  try { return JSON.parse(localStorage.getItem(VIEW_KEY) || "null"); } catch { return null; }
}

function currentShiftId(shifts) {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const toMin = (t) => { const [h, m] = String(t).split(":").map(Number); return h * 60 + m; };
  const match = shifts.find((s) => {
    const start = toMin(s.start_time), end = toMin(s.end_time);
    return end > start ? minutes >= start && minutes < end : minutes >= start || minutes < end;
  });
  return (match || shifts[0])?.id ?? "";
}

function descendants(nodes, rootId) {
  const result = [];
  const walk = (parentId) => nodes.filter((n) => n.parent_id === parentId).forEach((n) => { result.push(n); walk(n.id); });
  walk(rootId);
  return result;
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function ProductionPlanning() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [lookups, setLookups] = useState(null);
  const [plantId, setPlantId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [planDate, setPlanDate] = useState(localIsoDate());
  const [zoom, setZoom] = useState("shift");
  const [filters, setFilters] = useState(NO_FILTER);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [nextWoNo, setNextWoNo] = useState("");
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });

  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  const request = useCallback(async (url, options = {}) => {
    const token = getAccessToken();
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    const data = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const detail = data?.detail;
      const text = Array.isArray(detail) ? detail.map((d) => d.msg).join("; ") : typeof detail === "object" && detail ? detail.message : detail;
      const error = new Error(text || (response.status === 409 ? tx("This record was changed by someone else. Please reload and try again.") : `HTTP ${response.status}`));
      error.status = response.status;
      error.alerts = detail?.alerts;
      throw error;
    }
    return data;
  }, []);

  // ---- lookups + defaults ---------------------------------------------------
  useEffect(() => {
    request(`${API}/lookups`).then((data) => {
      setLookups(data);
      const saved = readSavedView();
      const plants = data.factory_nodes.filter((n) => n.node_type === "FACTORY");
      const shiftIds = new Set(data.shifts.map((s) => s.id));
      setPlantId(saved?.plantId && data.factory_nodes.some((n) => n.id === saved.plantId) ? saved.plantId : plants[0]?.id ?? "");
      setAreaId(saved?.areaId && data.factory_nodes.some((n) => n.id === saved.areaId) ? saved.areaId : "");
      setShiftId(saved?.shiftId && shiftIds.has(saved.shiftId) ? saved.shiftId : currentShiftId(data.shifts));
      if (saved?.zoom) setZoom(saved.zoom);
      if (saved?.filters) setFilters({ ...NO_FILTER, ...saved.filters });
    }).catch((e) => notify("error", e.message));
  }, [request, notify]);

  const plants = useMemo(() => (lookups?.factory_nodes || []).filter((n) => n.node_type === "FACTORY"), [lookups]);
  const areas = useMemo(() => (lookups && plantId ? descendants(lookups.factory_nodes, plantId) : []), [lookups, plantId]);

  const load = useCallback(async ({ silent } = {}) => {
    if (!shiftId || !planDate) return;
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ plan_date: planDate, shift_id: shiftId });
      if (plantId) params.set("factory_node_id", plantId);
      if (areaId) params.set("area_id", areaId);
      setBoard(await request(`${API}/board?${params}`));
      setLastUpdate(new Date());
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [shiftId, planDate, plantId, areaId, request, notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => { if (!dialog) load({ silent: true }); }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, load, dialog]);

  const plan = board?.plan || null;
  const planEditable = plan?.status === "DRAFT";
  const windowStart = board ? new Date(board.window.start) : null;
  const windowEnd = board ? new Date(board.window.end) : null;
  const serverNow = board ? new Date(board.server_time) : null;

  // ---- filtering -------------------------------------------------------------
  const groupOfMachine = useMemo(() => {
    const map = {};
    (board?.capacity || []).forEach((c) => c.machine_ids.forEach((id) => { map[id] = c.group_code; }));
    return map;
  }, [board]);
  const matches = useCallback((wo) => (
    (filters.group === "all" || groupOfMachine[wo.machine_id] === filters.group)
    && (filters.state === "all" || wo.progress_state === filters.state)
    && (filters.priority === "all" || wo.priority === filters.priority)
  ), [filters, groupOfMachine]);
  const workOrders = useMemo(() => (board?.work_orders || []).filter(matches), [board, matches]);
  const backlog = useMemo(() => (board?.backlog || []).filter((b) => filters.priority === "all" || b.priority === filters.priority), [board, filters.priority]);
  const ganttRows = useMemo(() => {
    if (zoom === "shift") return workOrders;
    const states = Object.fromEntries((board?.work_orders || []).map((w) => [w.id, w.progress_state]));
    return (board?.day_items || [])
      .map((w) => ({ ...w, progress_state: states[w.id] || (w.status === "COMPLETED" ? "COMPLETED" : "NOT_STARTED") }))
      .filter(matches);
  }, [zoom, workOrders, board, matches]);
  const activeFilterCount = Object.values(filters).filter((v) => v !== "all").length;

  // ---- actions -----------------------------------------------------------------
  const run = async (fn, successText) => {
    setSaving(true);
    try { await fn(); if (successText) notify("success", successText); await load({ silent: true }); return true; }
    catch (e) {
      if (e.alerts?.length) setDialog({ type: "alerts", alerts: e.alerts, title: tx("Blocking issues"), message: e.message });
      else notify("error", e.message);
      return false;
    } finally { setSaving(false); }
  };

  const openCreateWo = async () => {
    setDialog({ type: "woForm" });
    try { setNextWoNo((await request(`${API}/next-wo-no?plan_date=${planDate}`)).wo_no); } catch { setNextWoNo(""); }
  };
  const saveWorkOrder = async (payload) => {
    const item = dialog?.item;
    return run(async () => {
      await request(item ? `${API}/work-orders/${item.id}` : `${API}/work-orders`, {
        method: item ? "PUT" : "POST",
        body: JSON.stringify(item ? { ...payload, version: item.version, updated_by: actor } : { ...payload, created_by: actor }),
      });
      setDialog(null);
      setLookups(await request(`${API}/lookups`));
    }, tx("Work order saved."));
  };
  const scheduleWorkOrder = (wo, { machine_id: machineId, planned_start: plannedStart }) => run(async () => {
    await request(`${API}/work-orders/${wo.id}/schedule`, { method: "POST", body: JSON.stringify({ plan_id: plan.id, machine_id: machineId, planned_start: plannedStart, version: wo.version, actor }) });
    setDialog(null);
  }, tx("Work order scheduled."));
  const applyRecommendation = (b) => scheduleWorkOrder(b, { machine_id: b.recommendation.machine_id, planned_start: String(b.recommendation.planned_start).slice(0, 19) });
  const unscheduleWorkOrder = (wo) => run(async () => {
    await request(`${API}/work-orders/${wo.id}/unschedule`, { method: "POST", body: JSON.stringify({ version: wo.version, actor }) });
    setDialog(null);
  }, tx("Work order moved to backlog."));
  const cancelWorkOrder = (wo) => {
    if (!window.confirm(tx("Cancel this work order?"))) return;
    run(async () => {
      await request(`${API}/work-orders/${wo.id}/cancel`, { method: "POST", body: JSON.stringify({ version: wo.version, actor }) });
      setDialog(null);
    }, tx("Work order cancelled."));
  };
  const saveProgress = (wo, qty, reject) => run(async () => {
    await request(`${API}/work-orders/${wo.id}/progress`, { method: "PATCH", body: JSON.stringify({ actual_qty: qty, reject_qty: reject, version: wo.version, actor }) });
    setDialog(null);
  }, tx("Progress updated."));
  const createPlan = () => run(() => request(`${API}/plans`, { method: "POST", body: JSON.stringify({ plan_date: planDate, shift_id: shiftId, factory_node_id: plantId || null, created_by: actor }) }), tx("Plan created."));
  const transitionPlan = (step, text) => {
    if (step === "publish" && !window.confirm(tx("Publish this plan? Scheduled work orders will be released to Production Execution."))) return;
    run(() => request(`${API}/plans/${plan.id}/${step}`, { method: "POST", body: JSON.stringify({ version: plan.version, actor }) }), text);
  };

  const saveView = () => {
    try { localStorage.setItem(VIEW_KEY, JSON.stringify({ plantId, areaId, shiftId, zoom, filters })); notify("success", tx("Plan view saved.")); }
    catch (e) { notify("error", e.message); }
  };
  const exportPlan = () => {
    const header = ["WO", "Status", "Progress", "Priority", "Product", "Machine", "Mold", "Material", "Planned Start", "Planned End", "Due", "Planned Qty", "Actual Qty"];
    const lines = [...(board?.work_orders || []), ...(board?.backlog || [])].map((w) => [
      w.wo_no, w.status, w.progress_state || "", w.priority, `${w.product_code} ${w.product_name}`, w.machine_code || "", w.mold_code || "",
      w.material_code || "", w.planned_start || "", w.planned_end || "", w.due_date || "", w.planned_qty, w.actual_qty,
    ].map(csvCell).join(","));
    const blob = new Blob([`\uFEFF${[header.join(","), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${plan?.plan_code || `production-plan-${planDate}`}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openOrderDetail = (wo) => navigate(`/production-management/production-orders/detail?wo=${encodeURIComponent(wo.wo_no)}`);
  const openWorkOrder = (wo) => setDialog({ type: "woDetail", item: wo });
  const findWo = (woNo) => [...(board?.work_orders || []), ...(board?.backlog || [])].find((w) => w.wo_no === woNo);
  const onAlertClick = (a) => {
    const wo = a.wo_no && findWo(a.wo_no);
    if (wo) openWorkOrder(wo);
    else if (a.code.startsWith("MATERIAL")) setDialog({ type: "material" });
    else if (a.code === "CAPACITY_OVERLOAD") setDialog({ type: "capacity" });
  };

  // ---- charts --------------------------------------------------------------------
  const chartText = dark ? "#A7B0C0" : "#667085";
  const gridColor = dark ? "#344054" : "#EAECF0";
  const kpis = board?.kpis;
  const materialSummary = board?.material_summary;

  const orderDonut = useMemo(() => ({
    series: ORDER_BUCKETS.map(([, key]) => kpis?.[key] || 0),
    options: {
      chart: { type: "donut", fontFamily: '"Bai Jamjuree", sans-serif', background: "transparent" },
      labels: ORDER_BUCKETS.map(([state]) => label("progress", state)),
      colors: ORDER_BUCKETS.map(([state]) => PROGRESS_COLORS[state]),
      legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] },
      plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: tx("Total"), color: chartText, formatter: () => String(kpis?.planned_orders || 0) }, value: { color: dark ? "#F3F4F6" : "#172033", fontSize: "22px", fontWeight: 800 } } } } },
      tooltip: { theme: dark ? "dark" : "light" },
    },
  }), [kpis, dark, chartText, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const radial = (value, color) => ({
    series: [Math.min(Number(value) || 0, 100)],
    options: {
      chart: { type: "radialBar", sparkline: { enabled: true }, fontFamily: '"Bai Jamjuree", sans-serif' },
      colors: [color],
      plotOptions: { radialBar: { hollow: { size: "58%" }, track: { background: gridColor }, dataLabels: { name: { show: false }, value: { offsetY: 6, fontSize: "18px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033", formatter: () => `${num(value, 1)}%` } } } },
    },
  });

  const hourlyChart = useMemo(() => ({
    series: [
      { name: tx("Capacity (machine-h)"), data: (board?.hourly || []).map((h) => h.capacity) },
      { name: tx("Demand (machine-h)"), data: (board?.hourly || []).map((h) => h.demand) },
    ],
    options: {
      chart: { type: "line", toolbar: { show: false }, fontFamily: '"Bai Jamjuree", sans-serif', background: "transparent" },
      colors: ["#2E90FA", "#12B76A"], stroke: { width: [2, 3], curve: "smooth", dashArray: [5, 0] }, markers: { size: 3 },
      xaxis: { categories: (board?.hourly || []).map((h) => h.hour), labels: { style: { colors: chartText } }, axisBorder: { color: gridColor }, axisTicks: { color: gridColor } },
      yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: chartText }, formatter: (v) => num(v, 1) } },
      grid: { borderColor: gridColor }, legend: { position: "top", labels: { colors: chartText } }, tooltip: { theme: dark ? "dark" : "light" },
      annotations: serverNow && windowStart && serverNow > windowStart && serverNow < windowEnd ? { xaxis: [{ x: `${String(serverNow.getHours()).padStart(2, "0")}:00`, borderColor: "#F04438", strokeDashArray: 4 }] } : {},
    },
  }), [board, dark, chartText, gridColor, language]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- render helpers ----------------------------------------------------------
  const selectSx = { minWidth: 150, "& .MuiInputBase-root": { height: 36 } };
  const toolBtnSx = btn("cancel", { height: 34, px: 1.5, whiteSpace: "nowrap" });
  const quickActions = [
    { key: "create", icon: AddCircleOutlineIcon, text: tx("Create Work Order"), onClick: openCreateWo, disabled: !canEdit },
    { key: "capacity", icon: TrackChangesOutlinedIcon, text: tx("Capacity Check"), onClick: () => setDialog({ type: "capacity" }), disabled: !plan },
    { key: "material", icon: Inventory2OutlinedIcon, text: tx("Material Check"), onClick: () => setDialog({ type: "material" }), disabled: !plan },
    { key: "simulate", icon: ScienceOutlinedIcon, text: tx("Plan Simulation"), onClick: () => setDialog({ type: "simulate" }), disabled: !plan },
    plan?.status === "CONFIRMED"
      ? { key: "reopen", icon: LockOpenOutlinedIcon, text: tx("Reopen Plan"), onClick: () => transitionPlan("reopen", tx("Plan reopened.")), disabled: !canEdit || saving }
      : { key: "confirm", icon: AssignmentTurnedInOutlinedIcon, text: tx("Confirm Plan"), onClick: () => transitionPlan("confirm", tx("Plan confirmed.")), disabled: !canEdit || saving || !planEditable },
    { key: "publish", icon: PublishOutlinedIcon, text: tx("Publish Plan"), onClick: () => transitionPlan("publish", tx("Plan published to Production Execution.")), disabled: !canEdit || saving || plan?.status !== "CONFIRMED", primary: true },
  ];

  if (!lookups) {
    return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Production Planning")} | VCC Plastics`} description={tx("Build, balance and publish the production plan against real factory capacity")} />
        <PageBreadcrumb pageTitle={tx("Production Planning")} />

        {/* ① Context selectors + ③ Planning toolbar */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            <FormControl size="small" sx={selectSx}>
              <InputLabel shrink>{tx("Plant")}</InputLabel>
              <Select label={tx("Plant")} notched displayEmpty value={plantId} onChange={(e) => { setPlantId(e.target.value); setAreaId(""); }}>
                <MenuItem value="">{tx("All Plants")}</MenuItem>
                {plants.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={selectSx}>
              <InputLabel shrink>{tx("Area")}</InputLabel>
              <Select label={tx("Area")} notched displayEmpty value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                <MenuItem value="">{tx("All Areas")}</MenuItem>
                {areas.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ ...selectSx, minWidth: 200 }}>
              <InputLabel>{tx("Shift")}</InputLabel>
              <Select label={tx("Shift")} value={shiftId} onChange={(e) => setShiftId(e.target.value)}>
                {lookups.shifts.map((s) => <MenuItem key={s.id} value={s.id}>{s.shift_name} ({String(s.start_time).slice(0, 5)} ~ {String(s.end_time).slice(0, 5)})</MenuItem>)}
              </Select>
            </FormControl>
            <TextField size="small" type="date" label={tx("Business Date")} value={planDate} onChange={(e) => setPlanDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ "& .MuiInputBase-root": { height: 36 } }} />
            <Box sx={{ flex: 1 }} />
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<FilterAltOutlinedIcon />} onClick={(e) => setFilterAnchor(e.currentTarget)} sx={toolBtnSx}>{tx("Filter")}{activeFilterCount ? ` (${activeFilterCount})` : ""}</Button>
            <Button startIcon={<BookmarkBorderOutlinedIcon />} onClick={saveView} sx={toolBtnSx}>{tx("Save Plan View")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportPlan} disabled={!board} sx={toolBtnSx}>{tx("Export Plan")}</Button>
            <Button startIcon={<ScienceOutlinedIcon />} onClick={() => setDialog({ type: "simulate" })} disabled={!plan} sx={toolBtnSx}>{tx("Simulation")}</Button>
            <Button startIcon={<PrecisionManufacturingOutlinedIcon />} onClick={() => setDialog({ type: "capacity" })} disabled={!plan} sx={toolBtnSx}>{tx("Capacity Check")}</Button>
            <Button startIcon={<FactCheckOutlinedIcon />} onClick={() => setDialog({ type: "material" })} disabled={!plan} sx={toolBtnSx}>{tx("Material Check")}</Button>
          </Stack>
          <Stack direction="row" sx={{ mt: 1, flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            {plan ? (
              <>
                <Typography variant="subtitle2" fontWeight={800}>{plan.plan_code}</Typography>
                <PlanStatusChip value={plan.status} />
                {board.checks.error_count ? <Dot color="#F04438" text={`${board.checks.error_count} ${tx("Blocking issues")}`} /> : null}
                {board.checks.warning_count ? <Dot color="#F79009" text={`${board.checks.warning_count} ${tx("Warnings")}`} /> : null}
              </>
            ) : null}
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}
            </Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {loading ? <LinearProgress sx={{ mt: 1 }} /> : null}
        </Paper>

        <Popover open={Boolean(filterAnchor)} anchorEl={filterAnchor} onClose={() => setFilterAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
          <Stack spacing={1.5} sx={{ p: 2, width: 260 }}>
            <FormControl size="small">
              <InputLabel>{tx("Machine Group")}</InputLabel>
              <Select label={tx("Machine Group")} value={filters.group} onChange={(e) => setFilters((f) => ({ ...f, group: e.target.value }))}>
                <MenuItem value="all">{tx("All")}</MenuItem>
                {(board?.capacity || []).map((c) => <MenuItem key={c.group_code} value={c.group_code}>{c.group_name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>{tx("Progress State")}</InputLabel>
              <Select label={tx("Progress State")} value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))}>
                <MenuItem value="all">{tx("All")}</MenuItem>
                {Object.keys(PROGRESS_COLORS).map((s) => <MenuItem key={s} value={s}>{label("progress", s)}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>{tx("Priority")}</InputLabel>
              <Select label={tx("Priority")} value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
                <MenuItem value="all">{tx("All")}</MenuItem>
                {["URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => <MenuItem key={p} value={p}>{label("priority", p)}</MenuItem>)}
              </Select>
            </FormControl>
            <Button onClick={() => setFilters(NO_FILTER)} sx={btn("cancel")}>{tx("Clear")}</Button>
          </Stack>
        </Popover>

        {!board ? null : !plan ? (
          <>
            <Paper elevation={0} sx={{ ...cardSx, p: 4, textAlign: "center", mb: 1.5 }}>
              <Typography sx={{ mb: 2 }} color="text.secondary">{tx("No plan exists for this date, shift and plant yet.")}</Typography>
              <Stack sx={{ justifyContent: "center" }} direction="row" spacing={1.5}>
                <Button disabled={!canEdit || saving} onClick={createPlan} sx={btn("primary")}>{tx("Create Plan")}</Button>
                <Button disabled={!canEdit} onClick={openCreateWo} sx={btn("cancel")}>{tx("Create Work Order")}</Button>
              </Stack>
            </Paper>
            <BacklogCard rows={backlog} canSchedule={false} saving={saving} onOpen={openWorkOrder} onApply={applyRecommendation} onSchedule={() => {}} />
          </>
        ) : (
          <>
            {/* ④ Planning KPI */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr)) 1.45fr" }, gap: 1.5, mb: 1.5 }}>
              <KpiCard tone="info" label={tx("Planned Production")} value={`${num(kpis.planned_qty)} PCS`} note={`${tx("This Shift Target")} · ${tx("Actual")} ${num(kpis.actual_qty)}`} />
              <KpiCard tone="success" label={tx("Total Capacity")} value={kpis.capacity_qty == null ? EMPTY : `${num(kpis.capacity_qty)} PCS`} note={`${tx("Load")} ${kpis.capacity_utilization}%`} />
              <KpiCard tone="accent" label={tx("Planned Orders")} value={kpis.planned_orders} note={`${backlog.length} backlog`} />
              <KpiCard tone="warning" label={tx("On Track Orders")} value={kpis.on_track} note={`${kpis.on_track_pct}%`} gradient="linear-gradient(135deg, #F79009 0%, #FDB022 100%)" />
              <KpiCard tone="danger" label={tx("At Risk Orders")} value={kpis.at_risk} note={`${kpis.at_risk_pct}% · ${tx("Need Attention")}`} />
              <KpiCard tone="info" label={tx("Delayed Orders")} value={kpis.delayed} note={`${kpis.delayed_pct}% · ${tx("Delayed")}`} gradient="linear-gradient(135deg, #0E9384 0%, #15B79E 100%)" />
              <Paper elevation={0} sx={{ ...cardSx, p: 1.25, display: "flex", alignItems: "center", gap: 1, gridColumn: { xs: "1 / -1", xl: "auto" }, cursor: "pointer" }} onClick={() => setDialog({ type: "material" })}>
                <Box sx={{ width: 96, flexShrink: 0 }}><Chart type="radialBar" height={110} {...radial(materialSummary.availability_pct, "#12B76A")} /></Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="caption" fontWeight={800} sx={{ display: "block", mb: 0.5 }}>{tx("Material Availability")}</Typography>
                  {[["ENOUGH", materialSummary.enough], ["RUNNING_LOW", materialSummary.running_low], ["SHORTAGE", materialSummary.shortage]].map(([k, v]) => (
                    <Stack sx={{ justifyContent: "space-between" }} key={k} direction="row"><Dot color={MATERIAL_COLORS[k]} text={label("material", k)} /><Typography variant="caption" fontWeight={800}>{v}</Typography></Stack>
                  ))}
                </Box>
              </Paper>
            </Box>

            {/* ⑤ Gantt | ⑥ Capacity | ⑦ Material */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "1.55fr 1.1fr 0.85fr" }, gap: 1.5, mb: 1.5 }}>
              <Paper elevation={0} sx={{ ...cardSx, gridColumn: { lg: "1 / -1", xl: "auto" } }}>
                <Head title={tx("Planning Board (Gantt)")} action={
                  <Stack sx={{ alignItems: "center" }} direction="row" spacing={1}>
                    <ToggleButtonGroup size="small" exclusive value={zoom} onChange={(_, v) => v && setZoom(v)} sx={{ "& .MuiToggleButton-root": { py: 0.2, px: 1, fontSize: 11, textTransform: "none" } }}>
                      <ToggleButton value="shift">{tx("Shift View")}</ToggleButton>
                      <ToggleButton value="day">{tx("Day View")}</ToggleButton>
                    </ToggleButtonGroup>
                    <Typography variant="caption" color="text.secondary">{new Date(`${planDate}T00:00:00`).toLocaleDateString(localeTag())}</Typography>
                  </Stack>
                } />
                <Box sx={{ px: 1, pb: 1 }}>
                  <PlanningGantt rows={ganttRows} now={serverNow} onSelect={openWorkOrder} height={330}
                    rangeStart={zoom === "shift" ? windowStart : new Date(`${planDate}T00:00:00`)}
                    rangeEnd={zoom === "shift" ? windowEnd : new Date(new Date(`${planDate}T00:00:00`).getTime() + 86400000)}
                    tickHours={zoom === "shift" ? 1 : 2} />
                </Box>
              </Paper>

              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Capacity Overview (By Machine Group)")} />
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 120px" }, alignItems: "center", px: 1, pb: 1 }}>
                  <Table size="small" sx={{ "& td, & th": { px: 0.75, fontSize: 12 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>{tx("Machine Group")}</TableCell><TableCell align="right">{tx("Machines")}</TableCell>
                        <TableCell align="right">{tx("Available (h)")}</TableCell><TableCell align="right">{tx("Planned (h)")}</TableCell>
                        <TableCell align="right">{tx("Utilization")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {board.capacity.map((c) => (
                        <TableRow key={c.group_code} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/machine-equipment/machine-monitoring?group=${c.group_id || ""}`)}>
                          <TableCell sx={{ fontWeight: 700 }}>{c.group_name}</TableCell>
                          <TableCell align="right">{c.available_machines}/{c.total_machines}</TableCell>
                          <TableCell align="right">{num(c.available_hours, 1)}</TableCell>
                          <TableCell align="right">{num(c.planned_hours, 1)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: c.utilization > 100 ? "#F04438" : c.utilization > 85 ? "#F79009" : "#12B76A" }}>{c.utilization}%</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>{tx("Total")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>{board.capacity_totals.available_machines}/{board.capacity_totals.total_machines}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>{num(board.capacity_totals.available_hours, 1)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>{num(board.capacity_totals.planned_hours, 1)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>{board.capacity_totals.utilization}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Box sx={{ textAlign: "center" }}>
                    <Chart type="radialBar" height={130} {...radial(board.capacity_totals.utilization, board.capacity_totals.utilization > 100 ? "#F04438" : "#12B76A")} />
                    <Typography variant="caption" color="text.secondary">{tx("Total Utilization")}</Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ ...cardSx, display: "flex", flexDirection: "column" }}>
                <Head title={tx("Material Readiness")} />
                <Box sx={{ px: 1.5, flex: 1, overflow: "auto", maxHeight: 300 }}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.5, borderBottom: 1, borderColor: "divider" }}>
                    <Typography variant="caption" fontWeight={800} color="text.secondary">{tx("Material")}</Typography>
                    <Typography variant="caption" fontWeight={800} color="text.secondary">{tx("Availability")}</Typography>
                  </Stack>
                  {board.materials.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : board.materials.map((m) => (
                    <Tooltip key={m.material_id} placement="left" title={`${tx("Required")} ${num(m.required_qty, 2)} ${m.unit} · ${tx("Available")} ${num(m.available_qty, 2)} ${m.unit}`}>
                      <Stack direction="row" onClick={() => navigate(`/material-management/status?material=${encodeURIComponent(m.material_code)}`)}
                        sx={{ justifyContent: "space-between", alignItems: "center", py: 0.75, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                        <Typography variant="caption" fontWeight={600} noWrap sx={{ mr: 1 }}>{m.material_code}</Typography>
                        <Dot color={MATERIAL_COLORS[m.status]} text={label("material", m.status)} />
                      </Stack>
                    </Tooltip>
                  ))}
                </Box>
                <Button size="small" endIcon={<ChevronRightIcon />} onClick={() => setDialog({ type: "material" })} sx={{ m: 1, alignSelf: "center", textTransform: "none" }}>{tx("View Details")}</Button>
              </Paper>
            </Box>

            {/* ⑧ Order summary | ⑨ Capacity vs Demand | ⑩ Plan vs Achievement | ⑪ Alerts */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "0.95fr 1.35fr 1fr 1.05fr" }, gap: 1.5, mb: 1.5 }}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Order Summary")} />
                <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.1fr)", alignItems: "center", gap: 1, px: 1, pb: 1 }}>
                  <Box sx={{ minWidth: 0 }}><Chart type="donut" height={200} series={orderDonut.series} options={orderDonut.options} /></Box>
                  <Stack spacing={1} sx={{ minWidth: 0 }}>
                    {ORDER_BUCKETS.map(([state, key]) => (
                      <Stack sx={{ justifyContent: "space-between" }} key={state} direction="row" spacing={1}>
                        <Dot color={PROGRESS_COLORS[state]} text={label("progress", state)} />
                        <Typography variant="caption" fontWeight={700}>{kpis[key]} ({kpis[`${key}_pct`]}%)</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Paper>

              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Capacity vs Demand (Hourly)")} />
                <Box sx={{ px: 1 }}><Chart type="line" height={210} series={hourlyChart.series} options={hourlyChart.options} /></Box>
              </Paper>

              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Plan vs Achievement (This Shift)")} />
                <Stack spacing={1.25} sx={{ px: 1.5, pb: 1.5 }}>
                  {[[tx("Planned"), board.achievement.planned_qty, 100, "#1570EF"],
                    [tx("Expected by now"), board.achievement.expected_qty, board.achievement.planned_qty ? (board.achievement.expected_qty / board.achievement.planned_qty) * 100 : 0, "#98A2B3"],
                    [tx("Actual"), board.achievement.actual_qty, board.achievement.achievement_pct, "#12B76A"]].map(([k, v, p, color]) => (
                    <Box key={k}>
                      <Stack sx={{ justifyContent: "space-between" }} direction="row">
                        <Typography variant="caption" color="text.secondary">{k}</Typography>
                        <Typography variant="caption" fontWeight={800}>{num(v)} PCS · {num(p, 1)}%</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={Math.min(p, 100)} sx={{ height: 14, borderRadius: 1, bgcolor: dark ? "#1F2937" : "#F2F4F7", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 1 } }} />
                    </Box>
                  ))}
                  <Alert icon={<TrackChangesOutlinedIcon fontSize="small" />} severity={board.achievement.remaining_qty ? "info" : "success"} sx={{ py: 0 }}>
                    {tx("Need {qty} PCS to achieve target", { qty: num(board.achievement.remaining_qty) })}
                    {board.achievement.schedule_adherence_pct != null ? <><br />{tx("Schedule adherence")}: <b>{board.achievement.schedule_adherence_pct}%</b></> : null}
                  </Alert>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ ...cardSx, display: "flex", flexDirection: "column" }}>
                <Head title={tx("Planning Alerts")} action={<Button size="small" sx={{ textTransform: "none" }} onClick={() => setDialog({ type: "alerts", alerts: board.alerts })}>{tx("View All")} ({board.alerts.length})</Button>} />
                <Box sx={{ px: 1, pb: 1, overflow: "auto", maxHeight: 230 }}>
                  <AlertList alerts={board.alerts.slice(0, 6)} onAlertClick={onAlertClick} dense />
                </Box>
              </Paper>
            </Box>

            {/* ⑫ Backlog | ⑬ Quick actions */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1.6fr 1fr" }, gap: 1.5 }}>
              <BacklogCard rows={backlog} canSchedule={canEdit && planEditable} saving={saving} onOpen={openWorkOrder} onApply={applyRecommendation}
                onSchedule={(b) => setDialog({ type: "schedule", item: b })} />
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Quick Actions")} />
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" }, gap: 1, p: 1.5, pt: 0.5 }}>
                  {quickActions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <Button key={a.key} disabled={a.disabled} onClick={a.onClick}
                        sx={{ flexDirection: "column", gap: 0.75, py: 1.5, border: 1, borderColor: a.primary ? "primary.main" : "divider", borderRadius: 1.5, textTransform: "none", color: a.primary ? "primary.main" : "text.primary", fontWeight: 700, fontSize: 12.5 }}>
                        <Icon sx={{ fontSize: 28, color: a.disabled ? "inherit" : "primary.main" }} />
                        {a.text}
                      </Button>
                    );
                  })}
                </Box>
              </Paper>
            </Box>
          </>
        )}

        {/* dialogs */}
        {dialog?.type === "woForm" && (
          <WorkOrderForm item={dialog.item} lookups={lookups} defaultWoNo={nextWoNo} saving={saving} onClose={() => setDialog(null)} onSave={saveWorkOrder} />
        )}
        {dialog?.type === "woDetail" && (
          <WorkOrderDetailDialog wo={dialog.item} alerts={(board?.alerts || []).filter((a) => a.wo_no === dialog.item.wo_no)}
            canEdit={canEdit} planEditable={planEditable} saving={saving} onClose={() => setDialog(null)}
            onEdit={(wo) => setDialog({ type: "woForm", item: wo })}
            onSchedule={(wo) => (plan ? setDialog({ type: "schedule", item: wo }) : notify("warning", tx("No plan exists for this date, shift and plant yet.")))}
            onUnschedule={unscheduleWorkOrder} onCancel={cancelWorkOrder}
            onProgress={(wo) => setDialog({ type: "progress", item: wo })} onOpenDetail={openOrderDetail} />
        )}
        {dialog?.type === "schedule" && plan && (
          <ScheduleDialog wo={dialog.item} machines={board.machines} windowStart={board.window.start} saving={saving}
            initialMachineId={dialog.item.recommendation?.machine_id} initialStart={dialog.item.recommendation?.planned_start}
            onClose={() => setDialog(null)} onSave={(values) => scheduleWorkOrder(dialog.item, values)} />
        )}
        {dialog?.type === "progress" && (
          <ProgressDialog wo={dialog.item} saving={saving} onClose={() => setDialog(null)} onSave={(qty, reject) => saveProgress(dialog.item, qty, reject)} />
        )}
        {dialog?.type === "simulate" && plan && (
          <SimulationDialog planId={plan.id} areaId={areaId} workOrders={board.work_orders} backlog={board.backlog} machines={board.machines}
            request={request} api={API} onClose={() => setDialog(null)} />
        )}
        {dialog?.type === "capacity" && plan && (
          <CapacityCheckDialog capacity={board.capacity} totals={board.capacity_totals} machines={board.machines} onClose={() => setDialog(null)}
            onGroupClick={(c) => navigate(`/machine-equipment/machine-monitoring?group=${c.group_id || ""}`)} />
        )}
        {dialog?.type === "material" && plan && (
          <MaterialCheckDialog materials={board.materials} api={API} request={request} canEdit={canEdit} actor={actor}
            onChanged={(text) => { notify("success", text); load({ silent: true }); }}
            onMaterialClick={(m) => navigate(`/material-management/status?material=${encodeURIComponent(m.material_code)}`)}
            onClose={() => setDialog(null)} />
        )}
        {dialog?.type === "alerts" && (
          <AlertsDialog alerts={dialog.alerts} title={dialog.title} message={dialog.message} onClose={() => setDialog(null)}
            onAlertClick={(a) => { setDialog(null); onAlertClick(a); }} />
        )}

        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

function BacklogCard({ rows, canSchedule, saving, onOpen, onApply, onSchedule }) {
  return (
    <Paper elevation={0} sx={cardSx}>
      <Head title={tx("Unscheduled / Backlog Orders")} subtitle={`(${rows.length})`} />
      <Box sx={{ px: 1, pb: 1, overflowX: "auto", maxHeight: 300 }}>
        <Table size="small" stickyHeader sx={{ "& td, & th": { px: 0.75, fontSize: 12, whiteSpace: "nowrap" } }}>
          <TableHead>
            <TableRow>
              <TableCell>{tx("Order No.")}</TableCell><TableCell>{tx("Product")}</TableCell><TableCell align="right">{tx("Qty (PCS)")}</TableCell>
              <TableCell>{tx("Priority")}</TableCell><TableCell>{tx("Due")}</TableCell><TableCell>{tx("Duration")}</TableCell>
              <TableCell>{tx("Reason")}</TableCell><TableCell>{tx("Recommended Action")}</TableCell><TableCell align="right" />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={9}><Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography></TableCell></TableRow>
            ) : rows.map((b) => {
              const rec = b.recommendation;
              return (
                <TableRow key={b.id} hover sx={{ cursor: "pointer" }} onClick={() => onOpen(b)}>
                  <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>{b.wo_no}</TableCell>
                  <TableCell>{b.product_name}</TableCell>
                  <TableCell align="right">{num(b.planned_qty)}</TableCell>
                  <TableCell><PriorityChip value={b.priority} /></TableCell>
                  <TableCell>{ddmmhhmm(b.due_date)}</TableCell>
                  <TableCell>{fmtDuration(b.duration_minutes)}</TableCell>
                  <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{b.backlog_reason || EMPTY}</TableCell>
                  <TableCell>
                    {rec?.type === "SLOT"
                      ? tx("Add to {start}–{end} ({machine})", { start: hhmm(rec.planned_start), end: hhmm(rec.planned_end), machine: rec.machine_code })
                      : rec ? tx("Schedule next shift") : EMPTY}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    {canSchedule && rec?.type === "SLOT" ? <Button size="small" disabled={saving} onClick={() => onApply(b)} sx={{ minWidth: 0, textTransform: "none" }}>{tx("Apply")}</Button> : null}
                    {canSchedule ? <Button size="small" disabled={saving} onClick={() => onSchedule(b)} sx={{ minWidth: 0, textTransform: "none" }}>{tx("Schedule")}</Button> : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}
