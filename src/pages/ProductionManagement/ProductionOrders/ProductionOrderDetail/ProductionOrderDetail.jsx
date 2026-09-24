import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, FormControlLabel,
  LinearProgress, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Snackbar, Stack, Switch, Tab, Table, TableBody, TableCell,
  TableHead, TableRow, Tabs, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import PublishOutlinedIcon from "@mui/icons-material/PublishOutlined";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";

import { getAccessToken, getCurrentUser } from "../../../../auth/auth";
import usePagePermission from "../../../../auth/usePagePermission";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import PageMeta from "../../../../components/common/PageMeta";
import { API_CONFIG } from "../../../../config/config";
import { useTheme as useAppTheme } from "../../../../context/ThemeContext";
import { ProgressDialog, WorkOrderForm } from "../../ProductionPlanning/PlanningDialogs";
import { setActiveLanguage as setPlanningLanguage } from "../../ProductionPlanning/locales";
import { DialogHeader, Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, dialogPaperSx, fmtDuration, num, pageTheme } from "../../ProductionPlanning/ui";
import { CopyDialog, OrderForm, PriorityDialog, ReasonDialog } from "../ProductionOrderList/OrderDialogs";
import { PROGRESS_COLORS, PriorityPill, ProgressBar, ProgressStatePill, StatusPill, WO_STATUS_COLORS, WoStatusPill } from "../orderUi";
import { activityText, label, localeTag, setActiveLanguage, timelineText, tx, woStatusText } from "./locales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/production-orders`;
const PLANNING_API = `${BASE}/api/production-planning`;
const AUTO_REFRESH_MS = 60000;
const TABS = [
  ["overview", "Overview", AssessmentOutlinedIcon], ["plan", "Production Plan", EventNoteOutlinedIcon],
  ["progress", "Production Progress", ShowChartOutlinedIcon], ["quality", "Quality & Scrap", VerifiedUserOutlinedIcon],
  ["material", "Material & Consumption", Inventory2OutlinedIcon], ["machine", "Machine & Mold", PrecisionManufacturingOutlinedIcon],
  ["cost", "Cost & Performance", PaidOutlinedIcon], ["history", "History & Log", HistoryOutlinedIcon],
];
const WO_BUCKETS = [["total", "#1570EF"], ...["IN_PRODUCTION", "RELEASED", "SCHEDULED", "UNSCHEDULED", "ON_HOLD", "COMPLETED", "CLOSED", "CANCELLED"].map((k) => [k, WO_STATUS_COLORS[k]])];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function Row({ name, value, strong, color }) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center", py: 0.45 }}>
      <Typography variant="caption" color="text.secondary">{name}</Typography>
      <Typography variant="caption" fontWeight={strong ? 800 : 700} sx={{ textAlign: "right", color }}>{value ?? EMPTY}</Typography>
    </Stack>
  );
}

function Metric({ icon, color, name, value, unit, hint }) {
  const Icon = icon;
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", py: 0.75 }}>
      <Box sx={{ width: 30, height: 30, borderRadius: 1, border: `1px solid ${color}55`, color, display: "grid", placeItems: "center", flexShrink: 0 }}><Icon sx={{ fontSize: 18 }} /></Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" sx={{ display: "block" }}>{name}</Typography>
        {hint ? <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5, lineHeight: 1.2 }}>{hint}</Typography> : null}
      </Box>
      <Typography variant="subtitle1" fontWeight={800} sx={{ color: value == null ? "text.disabled" : color, whiteSpace: "nowrap" }}>
        {value == null ? EMPTY : value}{value != null && unit ? <Typography component="span" variant="caption" fontWeight={700} sx={{ ml: 0.5, color: "text.primary" }}>{unit}</Typography> : null}
      </Typography>
    </Stack>
  );
}

function SimpleTable({ columns, rows, onRowClick, empty }) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ "& td, & th": { fontSize: 12, px: 1, whiteSpace: "nowrap" }, "& th": { fontWeight: 800, color: "text.secondary" } }}>
        <TableHead><TableRow>{columns.map((c) => <TableCell key={c.key} align={c.align}>{c.title}</TableCell>)}</TableRow></TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={columns.length}><Typography variant="caption" color="text.secondary">{empty || tx("No data.")}</Typography></TableCell></TableRow>
          ) : rows.map((r, i) => (
            <TableRow key={r.id ?? i} hover={Boolean(onRowClick)} onClick={onRowClick ? () => onRowClick(r) : undefined} sx={{ cursor: onRowClick ? "pointer" : "default" }}>
              {columns.map((c) => <TableCell key={c.key} align={c.align}>{c.render ? c.render(r) : r[c.key] ?? EMPTY}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function NoteDialog({ saving, onClose, onSave }) {
  const [text, setText] = useState("");
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<NoteAddOutlinedIcon />} title={tx("Add Note")} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <TextField autoFocus fullWidth multiline minRows={4} placeholder={tx("Write a note...")} value={text} onChange={(e) => setText(e.target.value)} inputProps={{ maxLength: 2000 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button disabled={saving || !text.trim()} onClick={() => onSave(text.trim())} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ProductionOrderDetail() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  setPlanningLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";

  const [orderId, setOrderId] = useState(null);
  const [record, setRecord] = useState(null);
  const [options, setOptions] = useState([]);
  const [lookups, setLookups] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [menu, setMenu] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });

  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);
  const request = useCallback(async (url, options = {}) => {
    const token = getAccessToken();
    const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      const d = body?.detail;
      const error = new Error((Array.isArray(d) ? d.map((x) => x.msg).join("; ") : typeof d === "object" && d ? d.message : d) || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return body;
  }, []);
  const post = (url, payload, method = "POST") => request(url, { method, body: JSON.stringify(payload) });

  // ---- resolve ?order= / ?wo= / ?id= -----------------------------------------------------
  const orderNo = params.get("order");
  const woNo = params.get("wo");
  const idParam = params.get("id");
  useEffect(() => {
    setNotFound(false);
    if (idParam) { setOrderId(Number(idParam)); return; }
    if (!orderNo && !woNo) { setOrderId(null); return; }
    const query = orderNo ? `order_no=${encodeURIComponent(orderNo)}` : `wo_no=${encodeURIComponent(woNo)}`;
    request(`${API}/resolve?${query}`).then((r) => setOrderId(r.id)).catch(() => { setOrderId(null); setNotFound(true); });
  }, [orderNo, woNo, idParam, request]);
  useEffect(() => {
    request(`${API}/orders?limit=500`).then((d) => setOptions(d.items)).catch(() => setOptions([]));
    request(`${API}/lookups`).then(setLookups).catch(() => setLookups(null));
  }, [request]);

  const load = useCallback(async ({ silent } = {}) => {
    if (!orderId) { setRecord(null); return; }
    if (!silent) setLoading(true);
    try { setRecord(await request(`${API}/orders/${orderId}/record`)); setLastUpdate(new Date()); }
    catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [orderId, request, notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh || !orderId) return undefined;
    const timer = setInterval(() => { if (!dialog) load({ silent: true }); }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [autoRefresh, orderId, load, dialog]);

  const selectOrder = (order) => { if (order) setParams({ order: order.order_no }); };

  // ---- actions ----------------------------------------------------------------------------
  const run = async (fn, text) => {
    setSaving(true);
    try { await fn(); if (text) notify("success", text); await load({ silent: true }); return true; }
    catch (e) { notify("error", e.message); return false; } finally { setSaving(false); }
  };
  const order = record?.order;
  const transition = (step, remark, text) => run(async () => { await post(`${API}/orders/${order.id}/${step}`, { version: order.version, actor, remark }); setDialog(null); }, text);
  const saveOrder = (payload) => run(async () => {
    const result = await post(`${API}/orders/${order.id}`, { ...payload, version: order.version, updated_by: actor }, "PUT");
    setDialog(null);
    if (payload.order_no !== order.order_no) setParams({ order: payload.order_no });
    return result;
  }, tx("Order saved."));
  const changePriority = (priority, remark) => run(async () => { await post(`${API}/orders/${order.id}/priority`, { priority, remark, version: order.version, actor }, "PATCH"); setDialog(null); }, tx("Priority updated."));
  const copyOrder = (newNo) => run(async () => {
    const result = await post(`${API}/orders/${order.id}/copy`, { new_order_no: newNo, created_by: actor });
    setDialog(null); setParams({ order: result.order_no });
  }, tx("Order copied."));
  const deleteOrder = () => {
    if (!window.confirm(tx("Delete this draft order?"))) return;
    run(async () => { await request(`${API}/orders/${order.id}`, { method: "DELETE" }); navigate("/production-management/production-orders/list"); }, tx("Order deleted."));
  };
  const addNote = (text) => run(async () => { await post(`${API}/orders/${order.id}/notes`, { note_text: text, created_by: actor }); setDialog(null); }, tx("Note added."));
  const addCustomer = async (payload) => {
    try {
      const result = await post(`${BASE}/api/customers`, { ...payload, created_by: actor });
      setLookups(await request(`${API}/lookups`));
      return result.id;
    } catch (e) { notify("error", e.message); return null; }
  };
  const openAddWorkOrder = async () => {
    try {
      const [planningLookups, next] = await Promise.all([request(`${PLANNING_API}/lookups`), request(`${PLANNING_API}/next-wo-no`)]);
      setDialog({ type: "woForm", lookups: planningLookups, woNo: next.wo_no, initial: {
        production_order_id: order.id, product_id: order.product_id, planned_qty: order.unplanned_qty || order.order_qty,
        due_date: order.due_date ? String(order.due_date).slice(0, 16) : "", priority: order.priority, source: "SALES_ORDER", source_ref: order.order_no,
      } });
    } catch (e) { notify("error", e.message); }
  };
  const saveWorkOrder = (payload) => run(async () => { await post(`${PLANNING_API}/work-orders`, { ...payload, created_by: actor }); setDialog(null); }, tx("Work order saved."));
  const saveProgress = (wo, qty, reject) => run(async () => {
    await post(`${PLANNING_API}/work-orders/${wo.id}/progress`, { actual_qty: qty, reject_qty: reject, version: wo.version, actor }, "PATCH");
    setDialog(null);
  }, tx("Progress updated."));

  const printOrder = () => {
    if (!record) return;
    const o = record.order;
    const rows = record.work_orders.map((w) => `<tr><td>${escapeHtml(w.wo_no)}</td><td>${escapeHtml(w.machine_code)}</td><td>${escapeHtml(w.mold_code)}</td><td>${escapeHtml(ddmmhhmm(w.planned_start))}</td><td>${escapeHtml(ddmmhhmm(w.planned_end))}</td><td class="r">${num(w.planned_qty)}</td><td class="r">${num(w.actual_qty)}</td><td class="r">${num(w.reject_qty)}</td><td>${escapeHtml(woStatusText(w.status))}</td></tr>`).join("");
    const info = [[tx("Customer"), o.customer_name], [tx("Product"), `${o.product_code} — ${o.product_name}`], [tx("Order Quantity"), `${num(o.order_qty)} PCS`],
      [tx("Priority"), label("priority", o.priority)], [tx("Status"), label("status", o.status)], [tx("Plan Start"), ddmmhhmm(o.planned_start)],
      [tx("Plan End"), ddmmhhmm(o.planned_end)], [tx("Due Date"), ddmmhhmm(o.due_date)], [tx("Good Pieces"), num(o.good_qty)], [tx("Reject Pieces"), num(o.reject_qty)],
      [tx("Progress"), `${num(o.progress_pct, 1)}%`], [tx("Source"), `${label("source", o.source)} ${o.source_ref || ""}`]]
      .map(([k, v]) => `<div><span>${escapeHtml(k)}</span><b>${escapeHtml(v ?? EMPTY)}</b></div>`).join("");
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${escapeHtml(o.order_no)}</title><style>
      body{font-family:Arial,sans-serif;color:#172033;margin:24px}h1{font-size:20px;margin:0 0 4px}small{color:#667085}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin:16px 0}.grid div{display:flex;justify-content:space-between;border-bottom:1px solid #eaecf0;padding:4px 0;font-size:12px}
      table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #d0d5dd;padding:4px 6px;text-align:left}th{background:#f2f4f7}.r{text-align:right}
    </style></head><body><h1>${escapeHtml(tx("Production Order"))} ${escapeHtml(o.order_no)}</h1><small>${escapeHtml(new Date().toLocaleString(localeTag()))}</small>
    <div class="grid">${info}</div><h3>${escapeHtml(tx("Work Orders in This Production Order"))}</h3>
    <table><thead><tr><th>${escapeHtml(tx("Work Order No."))}</th><th>${escapeHtml(tx("Machine"))}</th><th>${escapeHtml(tx("Mold"))}</th><th>${escapeHtml(tx("Plan Start"))}</th><th>${escapeHtml(tx("Plan End"))}</th><th>${escapeHtml(tx("Planned Qty (PCS)"))}</th><th>${escapeHtml(tx("Good Pieces"))}</th><th>${escapeHtml(tx("Reject Pieces"))}</th><th>${escapeHtml(tx("Status"))}</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const goWorkOrder = (w) => navigate(`/production-management/work-orders/management?wo=${encodeURIComponent(w.wo_no)}`);
  const orderQuery = order ? `?order=${encodeURIComponent(order.order_no)}` : "";

  // ---- render --------------------------------------------------------------------------------
  const toolBtnSx = btn("cancel", { height: 34, px: 1.5, whiteSpace: "nowrap" });
  const status = order?.status;
  const finalStatus = ["COMPLETED", "CLOSED", "CANCELLED"].includes(status);
  const picker = (
    <Autocomplete size="small" sx={{ width: 300 }} options={options} value={options.find((o) => o.id === orderId) || null}
      getOptionLabel={(o) => `${o.order_no} · ${o.customer_short_name || o.customer_name || EMPTY} · ${o.product_name}`}
      isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, v) => selectOrder(v)}
      renderInput={(p) => <TextField {...p} label={order ? tx("Switch order") : tx("Select a production order")} />} />
  );

  const moreItems = order ? [
    { key: "release", icon: PublishOutlinedIcon, text: tx("Release Order"), onClick: () => transition("release", null, tx("Order released.")), disabled: status !== "DRAFT" },
    { key: "complete", icon: TaskAltOutlinedIcon, text: tx("Complete Order"), onClick: () => setDialog({ type: "complete" }), disabled: status !== "IN_PRODUCTION" },
    { key: "close", icon: LockOutlinedIcon, text: tx("Close Order"), onClick: () => setDialog({ type: "close" }), disabled: status !== "COMPLETED" },
    { key: "note", icon: NoteAddOutlinedIcon, text: tx("Add Note"), onClick: () => setDialog({ type: "note" }), disabled: false },
    { key: "delete", icon: DeleteOutlineIcon, text: tx("Delete Order"), onClick: deleteOrder, disabled: status !== "DRAFT" || order.wo_count > 0, danger: true },
  ] : [];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${order ? `${order.order_no} · ` : ""}${tx("Production Order Detail")} | VCC Plastics`} description={tx("Electronic production record of one production order")} />
        <PageBreadcrumb pageTitle={tx("Production Order Detail")} />

        {/* ③ Action toolbar */}
        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/production-management/production-orders/list")} sx={toolBtnSx}>{tx("Back to List")}</Button>
            <Button startIcon={<EditOutlinedIcon />} disabled={!order || !canEdit || finalStatus} onClick={() => setDialog({ type: "edit" })} sx={toolBtnSx}>{tx("Edit Order")}</Button>
            <Button startIcon={<FlagOutlinedIcon />} disabled={!order || !canEdit || finalStatus} onClick={() => setDialog({ type: "priority" })} sx={toolBtnSx}>{tx("Change Priority")}</Button>
            <Button startIcon={<ContentCopyOutlinedIcon />} disabled={!order || !canEdit} onClick={() => setDialog({ type: "copy" })} sx={toolBtnSx}>{tx("Copy Order")}</Button>
            <Button startIcon={<CancelOutlinedIcon />} disabled={!order || !canEdit || !["DRAFT", "RELEASED", "SCHEDULING"].includes(status)} onClick={() => setDialog({ type: "cancel" })} sx={toolBtnSx}>{tx("Cancel Order")}</Button>
            <Button startIcon={<PrintOutlinedIcon />} disabled={!order} onClick={printOrder} sx={toolBtnSx}>{tx("Print")}</Button>
            <Button startIcon={<MoreHorizIcon />} disabled={!order} onClick={(e) => setMenu(e.currentTarget)} sx={toolBtnSx}>{tx("More")}</Button>
            <Box sx={{ flex: 1 }} />
            {picker}
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {loading ? <LinearProgress sx={{ mt: 1 }} /> : null}
        </Paper>
        <Menu open={Boolean(menu)} anchorEl={menu} onClose={() => setMenu(null)}>
          {moreItems.map((a) => {
            const Icon = a.icon;
            return (
              <MenuItem key={a.key} disabled={!canEdit || a.disabled} onClick={() => { setMenu(null); a.onClick(); }} sx={{ color: a.danger ? "error.main" : "inherit" }}>
                <ListItemIcon sx={{ color: "inherit" }}><Icon fontSize="small" /></ListItemIcon><ListItemText>{a.text}</ListItemText>
              </MenuItem>
            );
          })}
        </Menu>

        {!order ? (
          <Paper elevation={0} sx={{ ...cardSx, p: 5, textAlign: "center" }}>
            {loading ? <CircularProgress /> : (
              <Stack spacing={2} sx={{ alignItems: "center" }}>
                {notFound ? <Alert severity="warning">{tx("Production order not found.")}</Alert> : null}
                <Typography color="text.secondary">{tx("Select a production order")}</Typography>
                {picker}
              </Stack>
            )}
          </Paper>
        ) : (
          <OrderRecord record={record} tab={tab} setTab={setTab} dark={dark} canEdit={canEdit} saving={saving} orderQuery={orderQuery}
            navigate={navigate} goWorkOrder={goWorkOrder} onAddNote={() => setDialog({ type: "note" })} onAddWorkOrder={openAddWorkOrder}
            onPrint={printOrder} onProgress={(w) => setDialog({ type: "progress", item: w })} />
        )}

        {/* dialogs */}
        {dialog?.type === "edit" && lookups && (
          <OrderForm item={order} lookups={lookups} saving={saving} onClose={() => setDialog(null)} onSave={saveOrder} onAddCustomer={addCustomer} />
        )}
        {dialog?.type === "priority" && <PriorityDialog order={order} saving={saving} onClose={() => setDialog(null)} onSave={changePriority} />}
        {dialog?.type === "copy" && <CopyDialog order={order} saving={saving} onClose={() => setDialog(null)} onConfirm={copyOrder} />}
        {dialog?.type === "cancel" && (
          <ReasonDialog danger required title={tx("Cancel Order")} subtitle={order.order_no} message={tx("Cancelling also cancels the order's unreleased work orders.")}
            reasonLabel={tx("Cancel Reason")} saving={saving} onClose={() => setDialog(null)} onConfirm={(r) => transition("cancel", r, tx("Order cancelled."))} />
        )}
        {dialog?.type === "complete" && (
          <ReasonDialog title={tx("Complete Order")} subtitle={order.order_no} message={tx("Complete this order? Remaining quantity will not be produced.")}
            saving={saving} onClose={() => setDialog(null)} onConfirm={(r) => transition("complete", r, tx("Order completed."))} />
        )}
        {dialog?.type === "close" && (
          <ReasonDialog title={tx("Close Order")} subtitle={order.order_no} message={tx("Close this order?")}
            saving={saving} onClose={() => setDialog(null)} onConfirm={(r) => transition("close", r, tx("Order closed."))} />
        )}
        {dialog?.type === "note" && <NoteDialog saving={saving} onClose={() => setDialog(null)} onSave={addNote} />}
        {dialog?.type === "woForm" && (
          <WorkOrderForm initial={dialog.initial} lookups={dialog.lookups} defaultWoNo={dialog.woNo} saving={saving} onClose={() => setDialog(null)} onSave={saveWorkOrder} />
        )}
        {dialog?.type === "progress" && (
          <ProgressDialog wo={dialog.item} saving={saving} onClose={() => setDialog(null)} onSave={(qty, reject) => saveProgress(dialog.item, qty, reject)} />
        )}

        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

// =========================================================
// RECORD BODY
// =========================================================

function OrderRecord({ record, tab, setTab, dark, canEdit, saving, orderQuery, navigate, goWorkOrder, onAddNote, onAddWorkOrder, onPrint, onProgress }) {
  const { order, output, quality, material, performance, work_orders: workOrders, wo_summary: woSummary, timeline, notes, activity, machines, molds, schedule } = record;
  const textColor = dark ? "#F3F4F6" : "#172033";
  const progressColor = PROGRESS_COLORS[order.progress_state] || "#12B76A";

  const radial = {
    series: [Math.min(output.progress_pct || 0, 100)],
    options: {
      chart: { type: "radialBar", sparkline: { enabled: true }, fontFamily: '"Bai Jamjuree", sans-serif' }, colors: [progressColor],
      plotOptions: { radialBar: { hollow: { size: "62%" }, track: { background: dark ? "#1F2937" : "#EAECF0" },
        dataLabels: { name: { show: true, offsetY: 22, color: dark ? "#A7B0C0" : "#667085", fontSize: "11px" }, value: { offsetY: -10, fontSize: "24px", fontWeight: 800, color: textColor, formatter: () => `${num(output.progress_pct, 1)}%` } } } },
      labels: [tx("Progress")],
    },
  };
  const woDonutKeys = WO_BUCKETS.filter(([k]) => k !== "total");
  const woDonut = {
    series: woDonutKeys.map(([k]) => woSummary[k] || 0),
    options: {
      chart: { type: "donut", background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' },
      labels: woDonutKeys.map(([k]) => woStatusText(k)), colors: woDonutKeys.map(([, c]) => c), legend: { show: false }, dataLabels: { enabled: false },
      stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
      plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: "WO", color: dark ? "#A7B0C0" : "#667085", formatter: () => String(woSummary.total) }, value: { fontSize: "20px", fontWeight: 800, color: textColor } } } } },
    },
  };

  const woColumns = [
    { key: "wo_no", title: tx("Work Order No."), render: (w) => <Box component="span" sx={{ color: "primary.main", fontWeight: 700, textDecoration: "underline" }}>{w.wo_no}</Box> },
    { key: "machine_code", title: tx("Machine") },
    { key: "mold_code", title: tx("Mold") },
    { key: "planned_qty", title: tx("Planned Qty (PCS)"), align: "right", render: (w) => num(w.planned_qty) },
    { key: "actual_qty", title: tx("Completed (PCS)"), align: "right", render: (w) => num(w.actual_qty) },
    { key: "progress", title: tx("Progress"), render: (w) => <Box sx={{ width: 110 }}><ProgressBar value={w.progress_pct} color={WO_STATUS_COLORS[w.status]} /></Box> },
    { key: "status", title: tx("Status"), render: (w) => <WoStatusPill value={w.status} text={woStatusText(w.status)} /> },
  ];
  const openLink = (text, to) => <Button size="small" endIcon={<ShowChartOutlinedIcon fontSize="small" />} onClick={() => navigate(to)} sx={{ textTransform: "none" }}>{text}</Button>;

  const quickActions = [
    [tx("Report Downtime"), ReportProblemOutlinedIcon, "#F04438", () => navigate(`/machine-equipment/downtime-management${orderQuery}`)],
    [tx("Request Material"), ViewInArOutlinedIcon, "#12B76A", () => navigate(`/material-management/requirement${orderQuery}`)],
    [tx("Add Work Order"), AddCircleOutlineIcon, "#1570EF", onAddWorkOrder, !canEdit || !["RELEASED", "SCHEDULING", "IN_PRODUCTION"].includes(order.status)],
    [tx("Quality Check"), VerifiedUserOutlinedIcon, "#7A5AF8", () => navigate(`/quality-management/inspection-management${orderQuery}`)],
    [tx("Change Schedule"), EditCalendarOutlinedIcon, "#F79009", () => navigate(`/production-management/planning${orderQuery}`)],
    [tx("Print Order"), PrintOutlinedIcon, "#1570EF", onPrint],
  ];

  const notesCard = (full) => (
    <Paper elevation={0} sx={{ ...cardSx, display: "flex", flexDirection: "column" }}>
      <Head title={tx("Notes")} action={<Button size="small" disabled={saving} startIcon={<NoteAddOutlinedIcon fontSize="small" />} onClick={onAddNote} sx={{ textTransform: "none" }}>{tx("Add Note")}</Button>} />
      <Box sx={{ px: 1.5, pb: 1, flex: 1, overflow: "auto", maxHeight: full ? "none" : 210 }}>
        {notes.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No notes yet.")}</Typography> : (full ? notes : notes.slice(0, 3)).map((n) => (
          <Box key={n.id} sx={{ py: 0.9, borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{ddmmhhmm(n.created_at)} · {n.created_by || EMPTY}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{n.note_text}</Typography>
          </Box>
        ))}
      </Box>
      {!full && notes.length > 3 ? <Button size="small" onClick={() => setTab("history")} sx={{ m: 1, textTransform: "none" }}>{tx("View All Notes")}</Button> : null}
    </Paper>
  );

  return (
    <>
      {/* ④ Order header */}
      <Paper elevation={0} sx={{ ...cardSx, p: 1.5, mb: 1.5 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)", xl: "1.6fr repeat(8, 1fr)" }, gap: 1.5, alignItems: "center" }}>
          <Box sx={{ gridColumn: { xs: "1 / -1", xl: "auto" } }}>
            <Typography variant="caption" color="text.secondary">{tx("Production Order")}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="h5" fontWeight={800} sx={{ color: "primary.main" }}>{order.order_no}</Typography>
              <ProgressStatePill value={order.progress_state} />
              <StatusPill value={order.status} />
            </Stack>
          </Box>
          {[[tx("Customer"), order.customer_name || EMPTY], [tx("Product"), order.product_name], [tx("Order Quantity"), `${num(order.order_qty)} PCS`],
            [tx("Priority"), <PriorityPill key="p" value={order.priority} />], [tx("Order Type"), label("source", order.source)],
            [tx("Created By"), order.created_by || EMPTY], [tx("Created Date"), ddmmhhmm(order.created_at)], [tx("Last Update"), ddmmhhmm(order.updated_at)]].map(([k, v]) => (
            <Box key={k} sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{k}</Typography>
              <Typography variant="body2" fontWeight={700} noWrap component="div">{v}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ⑤ Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 1.5, borderBottom: 1, borderColor: "divider", minHeight: 40, "& .MuiTab-root": { minHeight: 40, textTransform: "none", fontWeight: 700, fontSize: 13 } }}>
        {TABS.map(([key, text, Icon]) => <Tab key={key} value={key} icon={<Icon fontSize="small" />} iconPosition="start" label={tx(text)} />)}
      </Tabs>

      {tab === "overview" && (
        <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "1.25fr 0.95fr 1.5fr" }, gap: 1.5, mb: 1.5 }}>
            {/* ⑥ Progress */}
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Production Progress")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "170px 1fr", alignItems: "center", gap: 1, px: 1.5 }}>
                <Chart type="radialBar" height={170} series={radial.series} options={radial.options} />
                <Box>
                  <Row name={tx("Planned Quantity")} value={`${num(output.order_qty)} PCS`} />
                  <Row name={tx("Good Pieces")} value={`${num(output.good_qty)} PCS`} color="#12B76A" />
                  <Row name={tx("Reject Pieces")} value={`${num(output.reject_qty)} PCS`} color="#F04438" />
                  <Row name={tx("Remaining")} value={`${num(output.remaining_qty)} PCS`} color="#1570EF" />
                </Box>
              </Box>
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <LinearProgress variant="determinate" value={Math.min(output.progress_pct || 0, 100)} sx={{ height: 10, borderRadius: 5, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: progressColor, borderRadius: 5 } }} />
                <Stack direction="row" sx={{ justifyContent: "space-between", mt: 0.75 }}>
                  <Typography variant="caption" color="text.secondary">{tx("Start")}: {ddmmhhmm(order.planned_start)}</Typography>
                  <Typography variant="caption" color="text.secondary">{tx("End")}: {ddmmhhmm(order.planned_end)}</Typography>
                </Stack>
              </Box>
            </Paper>

            {/* ⑦ Timeline */}
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Status Timeline")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                {timeline.map((step, i) => {
                  const color = step.status === "CANCELLED" ? "#F04438" : step.current ? "#1570EF" : step.done ? "#12B76A" : "#98A2B3";
                  const Icon = step.status === "CANCELLED" ? HighlightOffOutlinedIcon : step.current ? RadioButtonCheckedIcon : step.done ? CheckCircleOutlineIcon : RadioButtonCheckedIcon;
                  return (
                    <Stack key={step.status} direction="row" spacing={1.25} sx={{ position: "relative", pb: i === timeline.length - 1 ? 0 : 1.25 }}>
                      {i < timeline.length - 1 ? <Box sx={{ position: "absolute", left: 11, top: 24, bottom: 0, borderLeft: `2px ${step.done ? "solid" : "dashed"} ${step.done ? "#12B76A" : "#D0D5DD"}` }} /> : null}
                      <Icon sx={{ color, fontSize: 24, bgcolor: "background.paper", zIndex: 1, opacity: step.done || step.current ? 1 : 0.6 }} />
                      <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: "1fr auto", gap: 1 }}>
                        <Typography variant="body2" fontWeight={step.current ? 800 : 700} sx={{ color: step.current ? color : "text.primary" }}>{timelineText(step.status)}</Typography>
                        <Box sx={{ textAlign: "right" }}>
                          <Typography variant="caption" sx={{ display: "block", color: step.current ? color : "text.secondary" }}>{step.at ? ddmmhhmm(step.at) : EMPTY}</Typography>
                          {step.actor ? <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{step.actor}</Typography> : null}
                        </Box>
                      </Box>
                    </Stack>
                  );
                })}
              </Box>
            </Paper>

            {/* ⑧ Order information */}
            <Paper elevation={0} sx={{ ...cardSx, gridColumn: { lg: "1 / -1", xl: "auto" } }}>
              <Head title={tx("Order Information")} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 3, px: 1.5, pb: 1.5 }}>
                <Box>
                  <Row name={tx("Order No.")} value={order.order_no} />
                  <Row name={tx("Customer")} value={order.customer_name} />
                  <Row name={tx("Product")} value={order.product_name} />
                  <Row name={tx("Product Code")} value={order.product_code} />
                  <Row name={tx("Order Quantity")} value={`${num(order.order_qty)} PCS`} />
                  <Row name={tx("UOM")} value="PCS" />
                  <Row name={tx("Order Type")} value={`${label("source", order.source)}${order.source_ref ? ` · ${order.source_ref}` : ""}`} />
                </Box>
                <Box>
                  <Row name={tx("Priority")} value={<PriorityPill value={order.priority} />} />
                  <Row name={tx("Plan Start")} value={ddmmhhmm(order.planned_start)} />
                  <Row name={tx("Plan End")} value={ddmmhhmm(order.planned_end)} />
                  <Row name={tx("Due Date")} value={ddmmhhmm(order.due_date)} />
                  <Row name={tx("Status")} value={<ProgressStatePill value={order.progress_state} />} />
                  <Row name={tx("Workflow")} value={label("status", order.status)} />
                  <Row name={tx("Plant")} value={order.factory_node_name} />
                  <Row name={tx("Description")} value={order.remark || EMPTY} />
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* ⑨ Summary cards + ⑩ WO donut */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "repeat(4, 1fr) 1.15fr" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Output Summary")} />
              <Box sx={{ px: 1.5, pb: 1 }}>
                <Metric icon={CheckCircleOutlineIcon} color="#12B76A" name={tx("Good Pieces")} value={num(output.good_qty)} unit="PCS" />
                <Metric icon={HighlightOffOutlinedIcon} color="#F04438" name={tx("Reject Pieces")} value={num(output.reject_qty)} unit="PCS" />
                <Metric icon={ViewInArOutlinedIcon} color="#1570EF" name={tx("Total Pieces")} value={num(output.total_qty)} unit="PCS" />
                <Metric icon={AssessmentOutlinedIcon} color="#7A5AF8" name={tx("Yield (FPY)")} value={output.yield_pct == null ? null : `${num(output.yield_pct, 1)}%`} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Quality Summary")} />
              <Box sx={{ px: 1.5, pb: 1 }}>
                <Metric icon={ScienceOutlinedIcon} color="#12B76A" name={tx("Defect Rate")} hint={`${tx("vs Target")}: ${tx("No target")}`} value={quality.defect_rate_pct == null ? null : `${num(quality.defect_rate_pct, 2)}%`} />
                <Metric icon={ShowChartOutlinedIcon} color="#F79009" name="PPM" hint={`${tx("vs Target")}: ${tx("No target")}`} value={quality.ppm == null ? null : num(quality.ppm)} />
                <Metric icon={VerifiedUserOutlinedIcon} color="#7A5AF8" name="FPY" value={quality.fpy_pct == null ? null : `${num(quality.fpy_pct, 1)}%`} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Material Consumption")} />
              <Box sx={{ px: 1.5, pb: 1 }}>
                <Metric icon={Inventory2OutlinedIcon} color="#1570EF" name={tx("Planned Material")} value={num(material.planned_qty, 1)} unit="kg" />
                <Metric icon={WarehouseOutlinedIcon} color="#12B76A" name={tx("Actual Consumption")} hint={material.basis === "ACTUAL" ? tx("Recorded in Material Usage") : tx("BOM standard × produced pieces")} value={num(material.actual_qty, 1)} unit="kg" />
                <Metric icon={ViewInArOutlinedIcon} color="#1570EF" name={tx("Remaining")} value={num(material.remaining_qty, 1)} unit="kg" />
                <Metric icon={AssessmentOutlinedIcon} color="#7A5AF8" name={tx("Usage Rate")} value={material.usage_pct == null ? null : `${num(material.usage_pct, 1)}%`} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Machine Performance")} subtitle={tx("(This Order)")} />
              <Box sx={{ px: 1.5, pb: 1 }}>
                <Metric icon={AssessmentOutlinedIcon} color="#12B76A" name={tx("OEE (Avg.)")} value={performance.oee_pct} />
                <Metric icon={PrecisionManufacturingOutlinedIcon} color="#1570EF" name={tx("Availability")} value={performance.availability_pct} />
                <Metric icon={ShowChartOutlinedIcon} color="#F79009" name={tx("Performance")} value={performance.performance_pct} />
                <Metric icon={VerifiedUserOutlinedIcon} color="#7A5AF8" name={tx("Quality")} value={performance.quality_pct == null ? null : `${num(performance.quality_pct, 1)}%`} />
                <Tooltip title={performance.reason}><Typography variant="caption" color="text.secondary">{tx("Needs Production Execution / IoT data")}</Typography></Tooltip>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Related Work Orders")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                <Stack spacing={0.75}>
                  {WO_BUCKETS.map(([k, color]) => (
                    <Stack key={k} direction="row" sx={{ justifyContent: "space-between" }}>
                      <Dot color={color} text={k === "total" ? tx("Total") : woStatusText(k)} />
                      <Typography variant="caption" fontWeight={800}>{woSummary[k] || 0}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Box sx={{ minWidth: 0 }}><Chart type="donut" height={170} series={woDonut.series} options={woDonut.options} /></Box>
              </Box>
            </Paper>
          </Box>

          {/* ⑩ WO table | ⑪ Notes | ⑫ Quick actions */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "2.2fr 0.9fr 1.2fr" }, gap: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Work Orders in This Production Order")} />
              <Box sx={{ px: 1, pb: 1 }}><SimpleTable columns={woColumns} rows={workOrders} onRowClick={goWorkOrder} /></Box>
            </Paper>
            {notesCard(false)}
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Quick Actions")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, px: 1.5, pb: 1.5 }}>
                {quickActions.map(([text, Icon, color, onClick, disabled]) => (
                  <Button key={text} disabled={disabled} onClick={onClick}
                    sx={{ flexDirection: "column", gap: 0.75, py: 1.5, px: 0.5, border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none", color: "text.primary", fontWeight: 700, fontSize: 12, lineHeight: 1.2 }}>
                    <Icon sx={{ fontSize: 28, color: disabled ? "inherit" : color }} />{text}
                  </Button>
                ))}
              </Box>
            </Paper>
          </Box>
        </>
      )}

      {tab === "plan" && (
        <Paper elevation={0} sx={cardSx}>
          <Head title={tx("Production Plan")} action={openLink(tx("Open Production Planning"), `/production-management/planning${orderQuery}`)} />
          <Stack direction="row" spacing={3} sx={{ px: 1.5, pb: 1, flexWrap: "wrap" }}>
            <Row name={tx("Schedule window")} value={`${ddmmhhmm(schedule.start)} → ${ddmmhhmm(schedule.end)}`} />
            <Row name={tx("Scheduled Qty")} value={`${num(schedule.planned_qty)} / ${num(order.order_qty)} PCS`} />
            <Row name={tx("Unplanned Qty")} value={`${num(schedule.unplanned_qty)} PCS`} color={schedule.unplanned_qty ? "#F79009" : undefined} />
          </Stack>
          <Box sx={{ px: 1, pb: 1 }}>
            <SimpleTable rows={workOrders} onRowClick={goWorkOrder} columns={[
              woColumns[0],
              { key: "plan_code", title: tx("Plan") }, { key: "plan_status", title: tx("Plan Status"), render: (w) => w.plan_status || EMPTY },
              woColumns[1], woColumns[2],
              { key: "planned_start", title: tx("Plan Start"), render: (w) => ddmmhhmm(w.planned_start) },
              { key: "planned_end", title: tx("Plan End"), render: (w) => ddmmhhmm(w.planned_end) },
              { key: "duration", title: tx("Duration"), render: (w) => fmtDuration(w.duration_minutes) },
              woColumns[3], woColumns[6],
            ]} />
          </Box>
        </Paper>
      )}

      {tab === "progress" && (
        <Paper elevation={0} sx={cardSx}>
          <Head title={tx("Production Progress")} action={openLink(tx("Open Production Execution"), `/production-management/work-orders/execution${orderQuery}`)} />
          <Box sx={{ px: 1, pb: 1 }}>
            <SimpleTable rows={workOrders} onRowClick={goWorkOrder} columns={[
              ...woColumns.slice(0, 5),
              { key: "reject_qty", title: tx("Reject Pieces"), align: "right", render: (w) => num(w.reject_qty) },
              woColumns[5], woColumns[6],
              { key: "act", title: "", render: (w) => (["SCHEDULED", "RELEASED", "IN_PRODUCTION", "ON_HOLD", "COMPLETED"].includes(w.status) && canEdit
                ? <Button size="small" onClick={(e) => { e.stopPropagation(); onProgress(w); }} sx={{ textTransform: "none" }}>{tx("Record Progress")}</Button> : null) },
            ]} />
          </Box>
        </Paper>
      )}

      {tab === "quality" && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "320px 1fr" }, gap: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quality Summary")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <Row name={tx("Good Pieces")} value={num(output.good_qty)} color="#12B76A" />
              <Row name={tx("Reject Pieces")} value={num(output.reject_qty)} color="#F04438" />
              <Row name={tx("Defect Rate")} value={quality.defect_rate_pct == null ? EMPTY : `${num(quality.defect_rate_pct, 2)}%`} />
              <Row name="PPM" value={quality.ppm == null ? EMPTY : num(quality.ppm)} />
              <Row name="FPY" value={quality.fpy_pct == null ? EMPTY : `${num(quality.fpy_pct, 1)}%`} />
              <Alert severity="info" sx={{ mt: 1, py: 0 }}>{quality.reason}</Alert>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Defect rate by work order")} action={openLink(tx("Open Quality Inspection"), `/quality-management/inspection-management${orderQuery}`)} />
            <Box sx={{ px: 1, pb: 1 }}>
              <SimpleTable rows={quality.by_work_order} columns={[
                { key: "wo_no", title: tx("Work Order No.") },
                { key: "good_qty", title: tx("Good Pieces"), align: "right", render: (r) => num(r.good_qty) },
                { key: "reject_qty", title: tx("Reject Pieces"), align: "right", render: (r) => num(r.reject_qty) },
                { key: "defect_rate_pct", title: tx("Defect Rate"), align: "right", render: (r) => (r.defect_rate_pct == null ? EMPTY : `${num(r.defect_rate_pct, 2)}%`) },
              ]} />
            </Box>
          </Paper>
        </Box>
      )}

      {tab === "material" && (
        <Paper elevation={0} sx={cardSx}>
          <Head title={tx("Material & Consumption")} action={openLink(tx("Open Material Management"), `/material-management/usage${orderQuery}`)} />
          <Box sx={{ px: 1.5, pb: 1 }}>
            <Alert severity="info" sx={{ py: 0, mb: 1 }}>{material.basis === "ACTUAL" ? tx("Actual consumption recorded per lot and machine in Material Usage.") : tx("Usage shows the BOM standard for the pieces produced until actual consumption is recorded.")}{material.bom_revision ? ` · BOM ${material.bom_revision}` : ""}</Alert>
            {!material.has_assignment && material.rows.length ? <Alert severity="warning" sx={{ py: 0, mb: 1 }}>{tx("Preview from the active BOM: materials are assigned when the order is released.")}</Alert> : null}
            <SimpleTable rows={material.rows.map((m) => ({ ...m, id: m.material_id }))} columns={[
              { key: "material_code", title: tx("Material"), render: (m) => `${m.material_code} — ${m.material_name}` },
              { key: "unit", title: tx("Unit") },
              { key: "planned_qty", title: tx("Planned Material"), align: "right", render: (m) => num(m.planned_qty, 2) },
              ...(material.basis === "ACTUAL" ? [{ key: "standard_qty", title: tx("Standard Usage"), align: "right", render: (m) => num(m.standard_qty, 3) }] : []),
              { key: "actual_qty", title: tx("Actual Consumption"), align: "right", render: (m) => num(m.actual_qty, 3) },
              ...(material.basis === "ACTUAL" ? [{ key: "diff_qty", title: tx("Usage Difference"), align: "right",
                render: (m) => (m.diff_qty == null ? "—" : <Box component="span" sx={{ fontWeight: 700, color: m.diff_qty > 0 ? "#F04438" : m.diff_qty < 0 ? "#12B76A" : "inherit" }}>
                  {`${m.diff_qty > 0 ? "+" : ""}${num(m.diff_qty, 3)}${m.diff_pct == null ? "" : ` (${m.diff_pct > 0 ? "+" : ""}${num(m.diff_pct, 1)}%)`}`}</Box>) }] : []),
              { key: "remaining_qty", title: tx("Remaining"), align: "right", render: (m) => num(m.remaining_qty, 2) },
              { key: "usage_pct", title: tx("Usage Rate"), render: (m) => <Box sx={{ width: 140 }}><ProgressBar value={m.usage_pct || 0} color="#7A5AF8" /></Box> },
              { key: "wo_nos", title: tx("Used by"), render: (m) => m.wo_nos.join(", ") },
            ]} />
          </Box>
        </Paper>
      )}

      {tab === "machine" && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Machines")} />
            <Box sx={{ px: 1, pb: 1 }}>
              <SimpleTable rows={machines} onRowClick={(m) => navigate(`/machine-equipment/machine-detail?machine=${m.id}`)} columns={[
                { key: "code", title: tx("Machine"), render: (m) => `${m.code} — ${m.name}` },
                { key: "status", title: tx("Status") },
                { key: "planned_minutes", title: tx("Planned time"), align: "right", render: (m) => fmtDuration(m.planned_minutes) },
                { key: "good_qty", title: tx("Good Pieces"), align: "right", render: (m) => num(m.good_qty) },
                { key: "reject_qty", title: tx("Reject Pieces"), align: "right", render: (m) => num(m.reject_qty) },
                { key: "wo_nos", title: tx("Work Orders"), render: (m) => m.wo_nos.join(", ") },
              ]} />
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Molds")} />
            <Box sx={{ px: 1, pb: 1 }}>
              <SimpleTable rows={molds} onRowClick={(m) => navigate(`/mold-management/detail?mold=${m.id}`)} columns={[
                { key: "code", title: tx("Mold"), render: (m) => `${m.code} — ${m.name}` },
                { key: "status", title: tx("Status") },
                { key: "cavity", title: tx("Cavity") },
                { key: "shot", title: tx("Shot usage"), render: (m) => <Box sx={{ width: 150 }}><ProgressBar value={m.shot_usage_pct || 0} color={m.shot_usage_pct > 90 ? "#F04438" : "#1570EF"} /></Box> },
                { key: "wo_nos", title: tx("Work Orders"), render: (m) => m.wo_nos.join(", ") },
              ]} />
            </Box>
          </Paper>
        </Box>
      )}

      {tab === "cost" && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Machine Performance")} subtitle={tx("(This Order)")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <Metric icon={AssessmentOutlinedIcon} color="#12B76A" name={tx("OEE (Avg.)")} value={performance.oee_pct} />
              <Metric icon={PrecisionManufacturingOutlinedIcon} color="#1570EF" name={tx("Availability")} value={performance.availability_pct} />
              <Metric icon={ShowChartOutlinedIcon} color="#F79009" name={tx("Performance")} value={performance.performance_pct} />
              <Metric icon={VerifiedUserOutlinedIcon} color="#7A5AF8" name={tx("Quality")} value={performance.quality_pct == null ? null : `${num(performance.quality_pct, 1)}%`} />
              <Alert severity="info" sx={{ mt: 1, py: 0 }}>{performance.reason}</Alert>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Cost data is not available yet")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <Alert severity="info" icon={<PaidOutlinedIcon />} sx={{ py: 0.5 }}>{tx("Cost needs material prices, machine hour rates and labour rates, which are not in the master data yet.")}</Alert>
            </Box>
          </Paper>
        </Box>
      )}

      {tab === "history" && (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.6fr 1fr" }, gap: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Activity Log")} />
            <Box sx={{ px: 1, pb: 1 }}>
              <SimpleTable rows={activity.map((a, i) => ({ ...a, id: i }))} columns={[
                { key: "at", title: tx("Time"), render: (a) => ddmmhhmm(a.at) },
                { key: "source", title: tx("Order"), render: (a) => a.wo_no || tx("Production Order") },
                { key: "action", title: tx("Event"), render: (a) => activityText(a) },
                { key: "status", title: tx("Status"), render: (a) => (a.from_status || a.to_status ? `${a.from_status || EMPTY} → ${a.to_status || EMPTY}` : EMPTY) },
                { key: "actor", title: tx("User") },
                { key: "remark", title: tx("Details"), render: (a) => <Typography variant="caption" sx={{ whiteSpace: "normal" }}>{a.remark || EMPTY}</Typography> },
              ]} />
            </Box>
          </Paper>
          {notesCard(true)}
        </Box>
      )}
    </>
  );
}
