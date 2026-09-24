import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, Checkbox, CircularProgress, Divider, FormControl, FormControlLabel, IconButton, InputAdornment,
  InputLabel, LinearProgress, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Popover, Select, Snackbar, Stack, Switch,
  Tab, Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PlaylistAddOutlinedIcon from "@mui/icons-material/PlaylistAddOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { getAccessToken, getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import PageMeta from "../../../../components/common/PageMeta";
import { KpiCard, KpiCardGroup } from "../../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../../config/config";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { WorkOrderForm } from "../../ProductionPlanning/PlanningDialogs";
import { setActiveLanguage as setPlanningLanguage } from "../../ProductionPlanning/locales";
import { Dot, EMPTY, Head, PRIORITY_COLORS, btn, cardSx, ddmmhhmm, num, pageTheme } from "../../ProductionPlanning/ui";
import { PROGRESS_COLORS, PriorityPill, ProgressBar, StatusPill } from "../orderUi";
import {
  AdvancedSearchDialog, CopyDialog, ImportDialog, OrderForm, PriorityDialog, ReasonDialog, downloadImportTemplate,
} from "./OrderDialogs";
import { label, localeTag, setActiveLanguage, tx } from "./locales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/production-orders`;
const PLANNING_API = `${BASE}/api/production-planning`;
const AUTO_REFRESH_MS = 60000;
const COLUMN_KEY = "vcc.productionOrderList.columns";
const EMPTY_SEARCH = { keyword: "", statuses: [], customer_id: "", product_id: "", priority: "", source: "", date_from: "", date_to: "", due_from: "", due_to: "" };

const TABS = [
  ["ALL", "All Orders"], ["ON_TRACK", "On Track"], ["AT_RISK", "At Risk"], ["DELAY", "Delay"], ["COMPLETED", "Completed"], ["CANCELLED", "Cancelled"],
];
const GROUPS = { none: null, customer: (r) => r.customer_short_name || r.customer_name || EMPTY, product: (r) => r.product_name, priority: (r) => label("priority", r.priority), status: (r) => label("status", r.status) };
const OPTIONAL_COLUMNS = ["customer", "product", "order_qty", "priority", "planned_start", "planned_end", "due_date", "status", "progress", "good_qty", "reject_qty", "source"];
const DEFAULT_HIDDEN = ["due_date", "source"];

function readHiddenColumns() {
  try { return JSON.parse(localStorage.getItem(COLUMN_KEY) || "null") || DEFAULT_HIDDEN; } catch { return DEFAULT_HIDDEN; }
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export default function ProductionOrderList() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  setPlanningLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [lookups, setLookups] = useState(null);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState(EMPTY_SEARCH);
  const [plantId, setPlantId] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [tab, setTab] = useState("ALL");
  const [groupBy, setGroupBy] = useState("none");
  const [hidden, setHidden] = useState(readHiddenColumns);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [checkedIds, setCheckedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [anchor, setAnchor] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });

  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  const request = useCallback(async (url, options = {}) => {
    const token = getAccessToken();
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const d = body?.detail;
      const text = Array.isArray(d) ? d.map((x) => x.msg).join("; ") : typeof d === "object" && d ? d.message : d;
      const error = new Error(text || (response.status === 409 ? tx("This record was changed by someone else. Please reload and try again.") : `HTTP ${response.status}`));
      error.status = response.status;
      error.errors = d?.errors;
      throw error;
    }
    return body;
  }, []);

  useEffect(() => { request(`${API}/lookups`).then(setLookups).catch((e) => notify("error", e.message)); }, [request, notify]);

  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(search).forEach(([k, v]) => {
        if (k === "statuses") { if (v.length) params.set("status", v.join(",")); } else if (v !== "" && v != null) params.set(k, v);
      });
      if (plantId) params.set("factory_node_id", plantId);
      const result = await request(`${API}/orders?${params}`);
      setData(result);
      setLastUpdate(new Date());
      setSelectedId((old) => (result.items.some((o) => o.id === old) ? old : result.items[0]?.id ?? null));
      setCheckedIds((old) => old.filter((id) => result.items.some((o) => o.id === id)));
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [search, plantId, request, notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(() => { if (!dialog) load({ silent: true }); }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, load, dialog]);
  useEffect(() => {
    const timer = setTimeout(() => setSearch((s) => (s.keyword === keywordInput ? s : { ...s, keyword: keywordInput })), 350);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const loadDetail = useCallback(async (id) => {
    if (!id) { setDetail(null); return; }
    try { setDetail(await request(`${API}/orders/${id}`)); } catch (e) { notify("error", e.message); }
  }, [request, notify]);
  useEffect(() => { loadDetail(selectedId); }, [selectedId, loadDetail, data]);

  const items = useMemo(() => data?.items || [], [data]);
  const summary = data?.summary;
  const rows = useMemo(() => {
    const filtered = tab === "ALL" ? items : items.filter((o) => o.progress_state === tab);
    const keyOf = GROUPS[groupBy];
    if (!keyOf) return filtered;
    const counts = {};
    filtered.forEach((o) => { const k = keyOf(o); counts[k] = (counts[k] || 0) + 1; });
    const sorted = [...filtered].sort((a, b) => String(keyOf(a)).localeCompare(String(keyOf(b))));
    return sorted.map((o, i) => ({ ...o, _group: keyOf(o), _groupFirst: i === 0 || keyOf(sorted[i - 1]) !== keyOf(o), _groupCount: counts[keyOf(o)] }));
  }, [items, tab, groupBy]);
  const tabCount = (key) => (key === "ALL" ? items.length : summary?.progress_states?.[key] ?? 0);

  // ---- actions ------------------------------------------------------------------------
  const run = async (fn, successText) => {
    setSaving(true);
    try { const result = await fn(); if (successText) notify("success", successText); await load({ silent: true }); return result ?? true; }
    catch (e) { notify("error", e.message); return false; }
    finally { setSaving(false); }
  };
  const post = (url, body, method = "POST") => request(url, { method, body: JSON.stringify(body) });

  const openCreate = async () => {
    let orderNo = "";
    try { orderNo = (await request(`${API}/next-no`)).order_no; } catch { /* the user can type one */ }
    setDialog({ type: "orderForm", defaultOrderNo: orderNo });
  };
  const saveOrder = (payload) => run(async () => {
    const item = dialog?.item;
    const result = await post(item ? `${API}/orders/${item.id}` : `${API}/orders`,
      item ? { ...payload, version: item.version, updated_by: actor } : { ...payload, created_by: actor }, item ? "PUT" : "POST");
    setDialog(null);
    if (result?.id) setSelectedId(result.id);
  }, tx("Order saved."));
  const addCustomer = async (payload) => {
    try {
      const result = await post(`${BASE}/api/customers`, { ...payload, created_by: actor });
      setLookups(await request(`${API}/lookups`));
      notify("success", tx("Customer saved."));
      return result.id;
    } catch (e) { notify("error", e.message); return null; }
  };
  const transition = (order, step, remark, text) => run(async () => {
    await post(`${API}/orders/${order.id}/${step}`, { version: order.version, actor, remark });
    setDialog(null);
  }, text);
  const changePriority = (order, priority, remark) => run(async () => {
    await post(`${API}/orders/${order.id}/priority`, { priority, remark, version: order.version, actor }, "PATCH");
    setDialog(null);
  }, tx("Priority updated."));
  const copyOrder = (order, newNo) => run(async () => {
    const result = await post(`${API}/orders/${order.id}/copy`, { new_order_no: newNo, created_by: actor });
    setDialog(null); setSelectedId(result.id);
  }, tx("Order copied."));
  const deleteOrder = (order) => {
    if (!window.confirm(tx("Delete this draft order?"))) return;
    run(async () => { await request(`${API}/orders/${order.id}`, { method: "DELETE" }); setSelectedId(null); }, tx("Order deleted."));
  };
  const releaseSelected = () => run(async () => {
    const targets = items.filter((o) => checkedIds.includes(o.id) && o.status === "DRAFT");
    for (const order of targets) await post(`${API}/orders/${order.id}/release`, { version: order.version, actor });
    notify("success", tx("{n} orders released.", { n: targets.length }));
  });
  const importOrders = async (importRows) => {
    setSaving(true);
    try {
      const result = await post(`${API}/orders/import`, { rows: importRows, factory_node_id: plantId || null, created_by: actor });
      setDialog(null); notify("success", tx("{n} orders imported.", { n: result.created.length })); await load({ silent: true });
      return null;
    } catch (e) {
      if (e.errors) return { errors: e.errors };
      notify("error", e.message); return null;
    } finally { setSaving(false); }
  };
  const openCreateWorkOrder = async (order) => {
    try {
      const [planningLookups, next] = await Promise.all([request(`${PLANNING_API}/lookups`), request(`${PLANNING_API}/next-wo-no`)]);
      setDialog({
        type: "woForm", lookups: planningLookups, woNo: next.wo_no,
        initial: {
          production_order_id: order.id, product_id: order.product_id, planned_qty: order.unplanned_qty || order.order_qty,
          due_date: order.due_date ? String(order.due_date).slice(0, 16) : "", priority: order.priority, source: "SALES_ORDER", source_ref: order.order_no,
        },
      });
    } catch (e) { notify("error", e.message); }
  };
  const saveWorkOrder = (payload) => run(async () => {
    await post(`${PLANNING_API}/work-orders`, { ...payload, created_by: actor });
    setDialog(null);
  }, tx("Work order saved."));

  const exportCsv = () => {
    const header = ["Order No", "Customer", "Product Code", "Product", "Order Qty", "Priority", "Plan Start", "Plan End", "Due", "Status", "Progress State", "Progress %", "Good", "Reject", "Source", "Source Ref"];
    const lines = rows.map((o) => [o.order_no, o.customer_name, o.product_code, o.product_name, o.order_qty, o.priority, o.planned_start, o.planned_end,
      o.due_date, o.status, o.progress_state, o.progress_pct, o.good_qty, o.reject_qty, o.source, o.source_ref].map(csvCell).join(","));
    const blob = new Blob([`\uFEFF${[header.join(","), ...lines].join("\n")}`], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `production-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const goDetail = (order) => navigate(`/production-management/production-orders/detail?order=${encodeURIComponent(order.order_no)}`);
  const goPlanning = (order) => navigate(`/production-management/planning${order ? `?order=${encodeURIComponent(order.order_no)}` : ""}`);

  const toggleColumn = (key) => setHidden((old) => {
    const next = old.includes(key) ? old.filter((k) => k !== key) : [...old, key];
    try { localStorage.setItem(COLUMN_KEY, JSON.stringify(next)); } catch { /* per-browser preference only */ }
    return next;
  });

  // ---- grid ---------------------------------------------------------------------------------
  const selected = detail && detail.id === selectedId ? detail : items.find((o) => o.id === selectedId) || null;
  const visibleIds = rows.map((r) => r.id);
  const allChecked = visibleIds.length > 0 && visibleIds.every((id) => checkedIds.includes(id));
  const someChecked = visibleIds.some((id) => checkedIds.includes(id));
  const toggleChecked = (id) => setCheckedIds((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]));
  const toggleAll = () => setCheckedIds((old) => (allChecked ? old.filter((id) => !visibleIds.includes(id)) : [...new Set([...old, ...visibleIds])]));
  const columnDefs = useMemo(() => {
    const cols = [
      { headerName: "", colId: "select", width: 44, minWidth: 44, pinned: "left", sortable: false, resizable: false,
        headerComponent: () => <Checkbox size="small" checked={allChecked} indeterminate={!allChecked && someChecked} onChange={toggleAll} sx={{ p: 0.25 }} />,
        cellRenderer: (p) => <Checkbox size="small" checked={checkedIds.includes(p.data.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleChecked(p.data.id)} sx={{ p: 0.25 }} /> },
      ...(groupBy !== "none" ? [{
        headerName: tx("Group By"), colId: "group", pinned: "left", width: 150, sortable: false, filter: false,
        valueGetter: (p) => (p.data._groupFirst ? `${p.data._group} (${p.data._groupCount})` : ""), cellStyle: { fontWeight: 800 },
      }] : []),
      { headerName: tx("Order No."), field: "order_no", colId: "order_no", width: 140, pinned: "left",
        cellRenderer: (p) => <Box component="span" onClick={(e) => { e.stopPropagation(); goDetail(p.data); }} sx={{ color: "primary.main", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>{p.value}</Box> },
      { headerName: tx("Customer"), colId: "customer", width: 120, valueGetter: (p) => p.data.customer_short_name || p.data.customer_name || EMPTY },
      { headerName: tx("Product"), colId: "product", minWidth: 150, flex: 1, valueGetter: (p) => p.data.product_name },
      { headerName: tx("Order Qty (PCS)"), field: "order_qty", colId: "order_qty", width: 120, type: "numericColumn", valueFormatter: (p) => num(p.value) },
      { headerName: tx("Priority"), field: "priority", colId: "priority", width: 100, cellRenderer: (p) => <PriorityPill value={p.value} /> },
      { headerName: tx("Plan Start"), field: "planned_start", colId: "planned_start", width: 120, valueFormatter: (p) => ddmmhhmm(p.value) },
      { headerName: tx("Plan End"), field: "planned_end", colId: "planned_end", width: 120, valueFormatter: (p) => ddmmhhmm(p.value) },
      { headerName: tx("Due Date"), field: "due_date", colId: "due_date", width: 120, valueFormatter: (p) => ddmmhhmm(p.value) },
      { headerName: tx("Status"), field: "status", colId: "status", width: 130, cellRenderer: (p) => <StatusPill value={p.value} /> },
      { headerName: tx("Progress"), field: "progress_pct", colId: "progress", width: 170, cellRenderer: (p) => <ProgressBar value={p.value} state={p.data.progress_state} /> },
      { headerName: tx("Good Pieces"), field: "good_qty", colId: "good_qty", width: 110, type: "numericColumn", valueFormatter: (p) => num(p.value) },
      { headerName: tx("Reject Pieces"), field: "reject_qty", colId: "reject_qty", width: 110, type: "numericColumn", valueFormatter: (p) => num(p.value) },
      { headerName: tx("Source"), field: "source", colId: "source", width: 120, valueFormatter: (p) => label("source", p.value) },
      { headerName: tx("Action"), colId: "action", width: 90, pinned: "right", sortable: false, filter: false, cellRenderer: (p) => (
        <Stack direction="row" sx={{ alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          <IconButton size="small" onClick={() => goDetail(p.data)}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={(e) => { setSelectedId(p.data.id); setAnchor({ type: "row", el: e.currentTarget, order: p.data }); }}><MoreVertIcon fontSize="small" /></IconButton>
        </Stack>
      ) },
    ];
    return cols.map((c) => ({ filter: false, ...c, ...(OPTIONAL_COLUMNS.includes(c.colId) ? { hide: hidden.includes(c.colId) } : {}) }));
  }, [groupBy, hidden, language, checkedIds, allChecked, someChecked]); // eslint-disable-line react-hooks/exhaustive-deps


  // ---- charts ---------------------------------------------------------------------------------
  const chartText = dark ? "#A7B0C0" : "#667085";
  const donut = (labels, series, colors, centerLabel) => ({
    series,
    options: {
      chart: { type: "donut", fontFamily: '"Bai Jamjuree", sans-serif', background: "transparent" },
      labels, colors, legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] },
      plotOptions: { pie: { donut: { size: "66%", labels: { show: true, total: { show: true, label: centerLabel, color: chartText, formatter: () => String(series.reduce((a, b) => a + b, 0)) }, value: { color: dark ? "#F3F4F6" : "#172033", fontSize: "20px", fontWeight: 800 } } } } },
      tooltip: { theme: dark ? "dark" : "light" },
    },
  });
  const statusKeys = ["ON_TRACK", "AT_RISK", "DELAY", "COMPLETED", "NOT_STARTED", "CANCELLED"];
  const customerSlices = useMemo(() => {
    const list = summary?.by_customer || [];
    const top = list.slice(0, 4);
    const rest = list.slice(4).reduce((a, c) => a + c.count, 0);
    return rest ? [...top, { customer_name: tx("Others"), count: rest }] : top;
  }, [summary, language]); // eslint-disable-line react-hooks/exhaustive-deps
  const CUSTOMER_COLORS = ["#12B76A", "#F79009", "#F04438", "#7A5AF8", "#98A2B3"];

  const Legend = ({ entries }) => (
    <Stack spacing={0.9} sx={{ minWidth: 0 }}>
      {entries.map(([name, value, total, color]) => (
        <Stack key={name} direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
          <Dot color={color} text={name} />
          <Typography variant="caption" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>{value} ({num(total ? (value / total) * 100 : 0, 1)}%)</Typography>
        </Stack>
      ))}
    </Stack>
  );

  if (!lookups) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;

  const k = summary?.kpis;
  const plants = lookups.factory_nodes.filter((n) => n.node_type === "FACTORY");
  const toolBtnSx = btn("cancel", { height: 34, px: 1.5, whiteSpace: "nowrap" });
  const activeFilters = ["customer_id", "product_id", "priority", "source", "date_from", "date_to", "due_from", "due_to"].filter((f) => search[f]).length + (search.statuses.length ? 1 : 0) + (plantId ? 1 : 0);
  const machineId = selected?.machine_ids?.[0];
  const status = selected?.status;

  const actionItems = (order) => order ? [
    { key: "view", icon: VisibilityOutlinedIcon, text: tx("View Order Detail"), onClick: () => goDetail(order) },
    { key: "edit", icon: EditOutlinedIcon, text: tx("Edit Order"), onClick: () => setDialog({ type: "orderForm", item: order }), disabled: !canEdit || ["COMPLETED", "CLOSED", "CANCELLED"].includes(order.status) },
    { key: "release", icon: PublishOutlinedIcon, text: tx("Release Order"), onClick: () => transition(order, "release", null, tx("Order released.")), disabled: !canEdit || order.status !== "DRAFT" },
    { key: "wo", icon: PlaylistAddOutlinedIcon, text: tx("Create Work Order"), onClick: () => openCreateWorkOrder(order), disabled: !canEdit || !["RELEASED", "SCHEDULING", "IN_PRODUCTION"].includes(order.status) },
    { key: "schedule", icon: EditCalendarOutlinedIcon, text: tx("Edit Schedule"), onClick: () => goPlanning(order) },
    { key: "priority", icon: FlagOutlinedIcon, text: tx("Change Priority"), onClick: () => setDialog({ type: "priority", item: order }), disabled: !canEdit || ["COMPLETED", "CLOSED", "CANCELLED"].includes(order.status) },
    { key: "complete", icon: TaskAltOutlinedIcon, text: tx("Complete Order"), onClick: () => setDialog({ type: "complete", item: order }), disabled: !canEdit || order.status !== "IN_PRODUCTION" },
    { key: "close", icon: LockOutlinedIcon, text: tx("Close Order"), onClick: () => setDialog({ type: "close", item: order }), disabled: !canEdit || order.status !== "COMPLETED" },
    { key: "copy", icon: ContentCopyOutlinedIcon, text: tx("Copy Order"), onClick: () => setDialog({ type: "copy", item: order }), disabled: !canEdit },
    { key: "cancel", icon: CancelOutlinedIcon, text: tx("Cancel Order"), onClick: () => setDialog({ type: "cancel", item: order }), disabled: !canEdit || !["DRAFT", "RELEASED", "SCHEDULING"].includes(order.status), danger: true },
    { key: "delete", icon: DeleteOutlineIcon, text: tx("Delete Order"), onClick: () => deleteOrder(order), disabled: !canEdit || order.status !== "DRAFT" || order.wo_count > 0, danger: true },
  ] : [];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Production Order List")} | VCC Plastics`} description={tx("Track, prioritise and coordinate every production order across its lifecycle")} />
        <PageBreadcrumb pageTitle={tx("Production Order List")} />

        {/* ③ Order toolbar */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<FilterAltOutlinedIcon />} onClick={(e) => setAnchor({ type: "filter", el: e.currentTarget })} sx={toolBtnSx}>{tx("Filter")}{activeFilters ? ` (${activeFilters})` : ""}</Button>
            <Button startIcon={<ManageSearchOutlinedIcon />} onClick={() => setDialog({ type: "search" })} sx={toolBtnSx}>{tx("Advanced Search")}</Button>
            <Button startIcon={<AddCircleOutlineIcon />} disabled={!canEdit} onClick={openCreate} sx={toolBtnSx}>{tx("Create Order")}</Button>
            <Button startIcon={<UploadFileOutlinedIcon />} disabled={!canEdit} onClick={() => setDialog({ type: "import" })} sx={toolBtnSx}>{tx("Import Orders")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} disabled={!rows.length} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<MoreHorizIcon />} onClick={(e) => setAnchor({ type: "more", el: e.currentTarget })} sx={toolBtnSx}>{tx("More")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {loading ? <LinearProgress sx={{ mt: 1 }} /> : null}
        </Paper>

        {/* ④ Order KPI */}
        {k ? (
          <KpiCardGroup sx={{ mb: 1.5 }}>
            <KpiCard tone="primary" label={tx("Total Orders")} value={num(k.total)} note={`+${k.created_today} ${tx("today")}`} icon={<AssignmentOutlinedIcon />} />
            <KpiCard tone="success" label={tx("On Track")} value={`${num(k.on_track)} (${num(k.on_track_pct, 1)}%)`} note={tx("of total")} icon={<CheckCircleOutlineIcon />} />
            <KpiCard tone="warning" label={tx("At Risk")} value={`${num(k.at_risk)} (${num(k.at_risk_pct, 1)}%)`} note={tx("of total")} icon={<ReportProblemOutlinedIcon />} />
            <KpiCard tone="danger" label={tx("Delay")} value={`${num(k.delay)} (${num(k.delay_pct, 1)}%)`} note={tx("of total")} icon={<ScheduleOutlinedIcon />} />
            <KpiCard tone="accent" label={tx("Completed")} value={`${num(k.completed)} (${num(k.completed_pct, 1)}%)`} note={`+${k.completed_today} ${tx("today")}`} icon={<FlagOutlinedIcon />} />
            <KpiCard tone="info" label={tx("Total Good Pieces")} value={`${num(k.good_qty)} PCS`}
              note={`${tx("Reject")} ${num(k.reject_qty)} · ${tx("Reject rate")} ${num(k.good_qty + k.reject_qty ? (k.reject_qty / (k.good_qty + k.reject_qty)) * 100 : 0, 2)}%`}
              icon={<Inventory2OutlinedIcon />} />
          </KpiCardGroup>
        ) : null}

        {/* ⑤ List | ⑥ Detail + ⑦ Related */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 300px" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={{ ...cardSx, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Head title={tx("Production Orders List")} />
            <Stack direction="row" sx={{ px: 1.5, pb: 1, gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 32, "& .MuiTabs-indicator": { display: "none" }, "& .MuiTab-root": { minHeight: 30, py: 0.25, px: 1.25, mr: 0.75, border: 1, borderColor: "divider", borderRadius: 1, textTransform: "none", fontSize: 12.5, fontWeight: 700 }, "& .Mui-selected": { bgcolor: "primary.main", color: "#fff !important", borderColor: "primary.main" } }}>
                {TABS.map(([key, text]) => <Tab key={key} value={key} label={`${tx(text)} (${tabCount(key)})`} />)}
              </Tabs>
              <Box sx={{ flex: 1 }} />
              <TextField size="small" placeholder={tx("Search order, product, customer...")} value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} sx={{ width: 240 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>{tx("Group By")}</InputLabel>
                <Select label={tx("Group By")} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <MenuItem value="none">{tx("None")}</MenuItem>
                  <MenuItem value="customer">{tx("Customer")}</MenuItem>
                  <MenuItem value="product">{tx("Product")}</MenuItem>
                  <MenuItem value="priority">{tx("Priority")}</MenuItem>
                  <MenuItem value="status">{tx("Status")}</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={tx("Columns")}><IconButton onClick={(e) => setAnchor({ type: "columns", el: e.currentTarget })} sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}><SettingsOutlinedIcon fontSize="small" /></IconButton></Tooltip>
            </Stack>
            <Box sx={{ px: 1, pb: 1, flex: 1 }}>
              <AgGridTable rowData={rows} columnDefs={columnDefs} loading={loading} height={420} rowHeight={34}
                onRowClicked={(e) => setSelectedId(e.data.id)} getRowId={(p) => String(p.data.id)} />
            </Box>
          </Paper>

          <Stack spacing={1.5}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Order Detail")} subtitle={tx("(Selected)")} action={selected ? <Button size="small" sx={{ textTransform: "none" }} onClick={() => goDetail(selected)}>{tx("View Detail")}</Button> : null} />
              {selected ? (
                <Stack spacing={0.9} sx={{ px: 1.5, pb: 1.5 }}>
                  {[
                    [tx("Order No."), selected.order_no], [tx("Product"), selected.product_name],
                    [tx("Customer"), selected.customer_name || EMPTY], [tx("Order Quantity"), `${num(selected.order_qty)} PCS`],
                    [tx("Plan Start"), ddmmhhmm(selected.planned_start)], [tx("Plan End"), ddmmhhmm(selected.planned_end)],
                    [tx("Due Date"), ddmmhhmm(selected.due_date)], [tx("Work Orders"), `${selected.wo_count} · ${tx("Unplanned Qty")} ${num(selected.unplanned_qty)}`],
                    [tx("Source"), `${label("source", selected.source)}${selected.source_ref ? ` · ${selected.source_ref}` : ""}`],
                  ].map(([name, value]) => (
                    <Stack key={name} direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
                      <Typography variant="caption" color="text.secondary">{name}</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ textAlign: "right" }}>{value}</Typography>
                    </Stack>
                  ))}
                  <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary">{tx("Status")}</Typography>
                    <Stack direction="row" spacing={0.75}><StatusPill value={selected.status} /><Dot color={PROGRESS_COLORS[selected.progress_state]} text={label("progress", selected.progress_state)} /></Stack>
                  </Stack>
                  <Box><Typography variant="caption" color="text.secondary">{tx("Progress")}</Typography><ProgressBar value={selected.progress_pct} state={selected.progress_state} /></Box>
                  <Stack direction="row" spacing={1} sx={{ pt: 0.5, flexWrap: "wrap", gap: 1 }}>
                    {status === "DRAFT" ? <Button size="small" disabled={!canEdit || saving} onClick={() => transition(selected, "release", null, tx("Order released."))} sx={btn("primary", { flex: 1 })}>{tx("Release Order")}</Button> : null}
                    {["RELEASED", "SCHEDULING", "IN_PRODUCTION"].includes(status) ? <Button size="small" disabled={!canEdit || saving} onClick={() => openCreateWorkOrder(selected)} sx={btn("primary", { flex: 1 })}>{tx("Create Work Order")}</Button> : null}
                    {status === "IN_PRODUCTION" ? <Button size="small" disabled={!canEdit || saving} onClick={() => setDialog({ type: "complete", item: selected })} sx={btn("edit", { flex: 1 })}>{tx("Complete Order")}</Button> : null}
                    {status === "COMPLETED" ? <Button size="small" disabled={!canEdit || saving} onClick={() => setDialog({ type: "close", item: selected })} sx={btn("edit", { flex: 1 })}>{tx("Close Order")}</Button> : null}
                  </Stack>
                </Stack>
              ) : <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{tx("Select an order to view details.")}</Typography>}
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Related Information")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.75, px: 1.5, pb: 1.5 }}>
                {[
                  [tx("Production Execution"), ShowChartOutlinedIcon, `/production-management/work-orders/execution?order=${encodeURIComponent(selected?.order_no || "")}`],
                  [tx("Quality Result"), VerifiedOutlinedIcon, `/quality-management/inspection-management?order=${encodeURIComponent(selected?.order_no || "")}`],
                  [tx("Material Usage"), Inventory2OutlinedIcon, `/material-management/usage?order=${encodeURIComponent(selected?.order_no || "")}`],
                  [tx("Machine"), PrecisionManufacturingOutlinedIcon, machineId ? `/machine-equipment/machine-detail?machine=${machineId}` : null],
                ].map(([text, Icon, to]) => (
                  <Button key={text} disabled={!selected || !to} onClick={() => navigate(to)}
                    sx={{ flexDirection: "column", gap: 0.5, py: 1, px: 0.5, border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none", fontSize: 11, lineHeight: 1.2, color: "text.primary", minWidth: 0 }}>
                    <Icon sx={{ color: "primary.main" }} />{text}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Stack>
        </Box>

        {/* ⑧–⑪ Analysis | ⑫ Quick actions */}
        {summary ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "1fr 1fr 1.1fr 1fr 300px" }, gap: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Orders by Status")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.3fr)", alignItems: "center", gap: 1, px: 1, pb: 1 }}>
                <Box sx={{ minWidth: 0 }}><Chart type="donut" height={190} {...donut(statusKeys.map((s) => label("progress", s)), statusKeys.map((s) => summary.progress_states[s]), statusKeys.map((s) => PROGRESS_COLORS[s]), tx("Total"))} /></Box>
                <Legend entries={statusKeys.map((s) => [label("progress", s), summary.progress_states[s], k.total, PROGRESS_COLORS[s]])} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Orders by Priority")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.3fr)", alignItems: "center", gap: 1, px: 1, pb: 1 }}>
                <Box sx={{ minWidth: 0 }}><Chart type="donut" height={190} {...donut(summary.by_priority.map((p) => label("priority", p.priority)), summary.by_priority.map((p) => p.count), summary.by_priority.map((p) => PRIORITY_COLORS[p.priority]), tx("Total"))} /></Box>
                <Legend entries={summary.by_priority.map((p) => [label("priority", p.priority), p.count, k.total, PRIORITY_COLORS[p.priority]])} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Top 5 Products by Order Quantity")} subtitle="(PCS)" />
              <Box sx={{ px: 1 }}>
                <Chart type="bar" height={200} series={[{ name: "PCS", data: summary.top_products.map((p) => p.order_qty) }]} options={{
                  chart: { toolbar: { show: false }, background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' },
                  plotOptions: { bar: { horizontal: true, barHeight: "55%", borderRadius: 2 } }, colors: ["#1570EF"],
                  dataLabels: { enabled: true, formatter: (v) => num(v), style: { fontSize: "11px" }, offsetX: 4 },
                  xaxis: { categories: summary.top_products.map((p) => p.product_name), tickAmount: 3, labels: { style: { colors: chartText }, formatter: (v) => (Number(v) >= 1000 ? `${num(Number(v) / 1000)}K` : num(v)) } },
                  yaxis: { labels: { style: { colors: chartText }, maxWidth: 120 } }, grid: { borderColor: dark ? "#344054" : "#EAECF0" },
                  tooltip: { theme: dark ? "dark" : "light" },
                }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Orders by Customer")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.3fr)", alignItems: "center", gap: 1, px: 1, pb: 1 }}>
                <Box sx={{ minWidth: 0 }}><Chart type="donut" height={190} {...donut(customerSlices.map((c) => c.customer_name), customerSlices.map((c) => c.count), CUSTOMER_COLORS, tx("Total"))} /></Box>
                <Legend entries={customerSlices.map((c, i) => [c.customer_name, c.count, k.total, CUSTOMER_COLORS[i]])} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Quick Actions")} />
              <Stack spacing={0.75} sx={{ px: 1.5, pb: 1.5 }}>
                {actionItems(selected).filter((a) => ["view", "schedule", "priority", "cancel", "copy"].includes(a.key)).map((a) => {
                  const Icon = a.icon;
                  return (
                    <Button key={a.key} disabled={!selected || a.disabled} onClick={a.onClick} startIcon={<Icon />}
                      sx={{ justifyContent: "flex-start", textTransform: "none", border: 1, borderColor: "divider", borderRadius: 1, color: a.danger ? "error.main" : "primary.main", fontWeight: 700 }}>
                      {a.text}
                    </Button>
                  );
                })}
              </Stack>
            </Paper>
          </Box>
        ) : null}

        {/* menus */}
        <Menu open={anchor?.type === "row"} anchorEl={anchor?.el} onClose={() => setAnchor(null)}>
          {actionItems(anchor?.order).map((a) => {
            const Icon = a.icon;
            return (
              <MenuItem key={a.key} disabled={a.disabled} onClick={() => { setAnchor(null); a.onClick(); }} sx={{ color: a.danger ? "error.main" : "inherit" }}>
                <ListItemIcon sx={{ color: "inherit" }}><Icon fontSize="small" /></ListItemIcon><ListItemText>{a.text}</ListItemText>
              </MenuItem>
            );
          })}
        </Menu>
        <Menu open={anchor?.type === "more"} anchorEl={anchor?.el} onClose={() => setAnchor(null)}>
          <MenuItem disabled={!canEdit || !items.some((o) => checkedIds.includes(o.id) && o.status === "DRAFT")} onClick={() => { setAnchor(null); releaseSelected(); }}>
            <ListItemIcon><PublishOutlinedIcon fontSize="small" /></ListItemIcon><ListItemText>{tx("Release Selected")} ({items.filter((o) => checkedIds.includes(o.id) && o.status === "DRAFT").length})</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => { setAnchor(null); downloadImportTemplate(); }}>
            <ListItemIcon><FileDownloadOutlinedIcon fontSize="small" /></ListItemIcon><ListItemText>{tx("Download Import Template")}</ListItemText>
          </MenuItem>
        </Menu>
        <Menu open={anchor?.type === "columns"} anchorEl={anchor?.el} onClose={() => setAnchor(null)}>
          {columnDefs.filter((c) => OPTIONAL_COLUMNS.includes(c.colId)).map((c) => (
            <MenuItem key={c.colId} dense onClick={() => toggleColumn(c.colId)}>
              <Checkbox size="small" checked={!hidden.includes(c.colId)} sx={{ p: 0.25, mr: 1 }} />{c.headerName}
            </MenuItem>
          ))}
        </Menu>
        <Popover open={anchor?.type === "filter"} anchorEl={anchor?.el} onClose={() => setAnchor(null)} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
          <Stack spacing={1.5} sx={{ p: 2, width: 280 }}>
            <FormControl size="small">
              <InputLabel>{tx("Plant")}</InputLabel>
              <Select label={tx("Plant")} value={plantId} onChange={(e) => setPlantId(e.target.value)}>
                <MenuItem value="">{tx("All")}</MenuItem>
                {plants.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
            {[["customer_id", tx("Customer"), lookups.customers.map((c) => [c.id, c.customer_name])],
              ["product_id", tx("Product"), lookups.products.map((p) => [p.id, `${p.product_code} — ${p.product_name}`])],
              ["priority", tx("Priority"), ["URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => [p, label("priority", p)])]].map(([key, text, options]) => (
              <FormControl key={key} size="small">
                <InputLabel>{text}</InputLabel>
                <Select label={text} value={search[key]} onChange={(e) => setSearch((s) => ({ ...s, [key]: e.target.value }))}>
                  <MenuItem value="">{tx("All")}</MenuItem>
                  {options.map(([value, name]) => <MenuItem key={value} value={value}>{name}</MenuItem>)}
                </Select>
              </FormControl>
            ))}
            <Divider />
            <Button onClick={() => { setSearch(EMPTY_SEARCH); setKeywordInput(""); setPlantId(""); }} sx={btn("cancel")}>{tx("Clear")}</Button>
          </Stack>
        </Popover>

        {/* dialogs */}
        {dialog?.type === "orderForm" && (
          <OrderForm item={dialog.item} lookups={lookups} defaultOrderNo={dialog.defaultOrderNo} plantId={plantId} saving={saving}
            onClose={() => setDialog(null)} onSave={saveOrder} onAddCustomer={addCustomer} />
        )}
        {dialog?.type === "priority" && <PriorityDialog order={dialog.item} saving={saving} onClose={() => setDialog(null)} onSave={(p, r) => changePriority(dialog.item, p, r)} />}
        {dialog?.type === "copy" && <CopyDialog order={dialog.item} saving={saving} onClose={() => setDialog(null)} onConfirm={(no) => copyOrder(dialog.item, no)} />}
        {dialog?.type === "cancel" && (
          <ReasonDialog danger required title={tx("Cancel Order")} subtitle={dialog.item.order_no} message={tx("Cancelling also cancels the order's unreleased work orders.")}
            reasonLabel={tx("Cancel Reason")} saving={saving} onClose={() => setDialog(null)} onConfirm={(r) => transition(dialog.item, "cancel", r, tx("Order cancelled."))} />
        )}
        {dialog?.type === "complete" && (
          <ReasonDialog title={tx("Complete Order")} subtitle={dialog.item.order_no} message={tx("Complete this order? Remaining quantity will not be produced.")}
            saving={saving} onClose={() => setDialog(null)} onConfirm={(r) => transition(dialog.item, "complete", r, tx("Order completed."))} />
        )}
        {dialog?.type === "close" && (
          <ReasonDialog title={tx("Close Order")} subtitle={dialog.item.order_no} message={tx("Close this order?")}
            saving={saving} onClose={() => setDialog(null)} onConfirm={(r) => transition(dialog.item, "close", r, tx("Order closed."))} />
        )}
        {dialog?.type === "import" && <ImportDialog saving={saving} onClose={() => setDialog(null)} onImport={importOrders} />}
        {dialog?.type === "search" && (
          <AdvancedSearchDialog value={{ ...search, keyword: keywordInput }} lookups={lookups} onClose={() => setDialog(null)}
            onApply={(value) => { setSearch(value); setKeywordInput(value.keyword); setDialog(null); }} />
        )}
        {dialog?.type === "woForm" && (
          <WorkOrderForm initial={dialog.initial} lookups={dialog.lookups} defaultWoNo={dialog.woNo} saving={saving} onClose={() => setDialog(null)} onSave={saveWorkOrder} />
        )}

        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
