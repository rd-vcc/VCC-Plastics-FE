import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, ButtonGroup, CircularProgress, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, InputLabel,
  LinearProgress, MenuItem, Paper, Select, Snackbar, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField,
  ThemeProvider as MuiThemeProvider, Tooltip, Typography,
} from "@mui/material";
import AddShoppingCartOutlinedIcon from "@mui/icons-material/AddShoppingCartOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { DialogHeader, Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, dialogPaperSx, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, localeTag, setActiveLanguage, tx } from "../materialLocales";
import { CATEGORY_COLORS, KpiTile, downloadCsv, qty, tons, useRequest } from "../materialUi";

const API = `${API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "")}/api/material-requirements`;
const STATUS_COLORS = { CRITICAL: "#D92D20", SHORT: "#F04438", ENOUGH: "#12B76A", EXCESS: "#2E90FA" };
const PRIORITY_COLORS = { HIGH: "#F04438", MEDIUM: "#F79009", LOW: "#12B76A" };
const EMPTY_FILTER = { category: "", material_id: "", work_order_id: "", priority: "", include_unscheduled: true };

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function weekRange(offsetWeeks = 0) {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + offsetWeeks * 7);
  return { from: iso(monday), to: iso(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)) };
}

function Pill({ color, text, width = 104 }) {
  return (
    <Box component="span" title={text} sx={{ display: "inline-block", width, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle",
      px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40` }}>{text}</Box>
  );
}

function LinesDialog({ row, period, request, canEdit, actor, notify, onClose, onChanged }) {
  const [lines, setLines] = useState(null);
  const [edit, setEdit] = useState(null);
  const load = useCallback(() => {
    const q = new URLSearchParams({ material_id: row.material_id, date_from: period.from, date_to: period.to, include_unscheduled: period.include_unscheduled });
    return request(`${API}/lines?${q}`).then(setLines).catch((e) => notify("error", e.message));
  }, [row, period, request, notify]);
  useEffect(() => { load(); }, [load]);
  const save = async () => {
    try {
      await request(`${API}/lines/${edit.id}/adjust`, { method: "PUT", body: JSON.stringify({ adjustment_qty: Number(edit.value || 0), reason: edit.reason.trim(), actor }) });
      notify("success", tx("Requirement adjusted.")); setEdit(null); await load(); onChanged();
    } catch (e) { notify("error", e.message); }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ViewInArOutlinedIcon />} title={`${tx("Requirement Lines")} · ${row.material_code}`} subtitle={row.material_name} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        {!lines ? <LinearProgress /> : (
          <Box sx={{ maxHeight: 460, overflow: "auto" }}>
            <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 12, whiteSpace: "nowrap" } }}>
              <TableHead><TableRow>
                <TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Product")}</TableCell><TableCell>{tx("Earliest need")}</TableCell><TableCell>BOM</TableCell>
                <TableCell align="right">{tx("Planned")}</TableCell><TableCell align="right">{tx("Adjustment")}</TableCell><TableCell align="right">{tx("Total Need")}</TableCell>
                <TableCell align="right">{tx("Allocated")}</TableCell><TableCell align="right">{tx("Covered")}</TableCell><TableCell align="right">{tx("Short")}</TableCell><TableCell />
              </TableRow></TableHead>
              <TableBody>
                {lines.length === 0 ? <TableRow><TableCell colSpan={11}>{tx("No data.")}</TableCell></TableRow> : lines.map((l) => (
                  <TableRow key={l.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{l.wo_no}{l.order_no ? <Typography component="span" variant="caption" color="text.secondary"> · {l.order_no}</Typography> : null}</TableCell>
                    <TableCell>{l.product_name}</TableCell>
                    <TableCell>{l.required_date ? ddmmhhmm(l.required_date) : tx("Unscheduled")}</TableCell>
                    <TableCell>{l.bom_revision || EMPTY}</TableCell>
                    <TableCell align="right">{num(l.open_qty, 3)}</TableCell>
                    <TableCell align="right">
                      {edit?.id === l.id ? <TextField size="small" type="number" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} sx={{ width: 100 }} inputProps={{ step: "any" }} /> : num(l.adjustment_qty, 3)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{num(l.need_qty, 3)}</TableCell>
                    <TableCell align="right">{num(l.allocated_qty, 3)}</TableCell>
                    <TableCell align="right">{num(l.covered_qty, 3)}</TableCell>
                    <TableCell align="right" sx={{ color: l.short_qty > 0 ? "#F04438" : "inherit", fontWeight: l.short_qty > 0 ? 800 : 400 }}>{num(l.short_qty, 3)}</TableCell>
                    <TableCell align="right">
                      {edit?.id === l.id ? null : <Button size="small" disabled={!canEdit} startIcon={<TuneOutlinedIcon fontSize="small" />} onClick={() => setEdit({ id: l.id, value: l.adjustment_qty, reason: "" })}>{tx("Adjust")}</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
        {edit ? (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2, p: 1.5, border: 1, borderColor: "divider", borderRadius: 2, alignItems: "center" }}>
            <Typography variant="subtitle2" fontWeight={800}>{tx("Adjust Requirement")}</Typography>
            <TextField size="small" type="number" label={`${tx("New adjustment")} (${row.unit})`} value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} helperText={tx("Positive adds material, negative reduces it.")} />
            <TextField size="small" required label={tx("Reason")} value={edit.reason} onChange={(e) => setEdit({ ...edit, reason: e.target.value })} sx={{ flex: 1 }} />
            <Button onClick={() => setEdit(null)} sx={btn("cancel")}>{tx("Cancel")}</Button>
            <Button disabled={!edit.reason.trim() || edit.value === ""} onClick={save} sx={btn("primary")}>{tx("Save")}</Button>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button></DialogActions>
    </Dialog>
  );
}

function SimpleListDialog({ icon, title, subtitle, columns, rows, onExport, onClose }) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={icon} title={title} subtitle={subtitle} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Box sx={{ maxHeight: 460, overflow: "auto" }}>
          <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 12, whiteSpace: "nowrap" } }}>
            <TableHead><TableRow>{columns.map(([k, h, align]) => <TableCell key={k} align={align}>{h}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={columns.length}>{tx("No data.")}</TableCell></TableRow> : rows.map((r, i) => (
                <TableRow key={r.id ?? i}>{columns.map(([k, , align, render]) => <TableCell key={k} align={align}>{render ? render(r) : r[k] ?? EMPTY}</TableCell>)}</TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {onExport ? <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!rows.length} onClick={onExport} sx={btn("edit")}>{tx("Export")}</Button> : null}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function MaterialRequirement() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const { canEdit } = usePagePermission();
  const actor = getCurrentUser()?.employee_code || "SYSTEM";
  const request = useRequest();

  const [lookups, setLookups] = useState(null);
  const [period, setPeriod] = useState(() => weekRange(0));
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  useEffect(() => { request(`${API}/lookups`).then(setLookups).catch((e) => notify("error", e.message)); }, [request, notify]);
  const load = useCallback(async ({ silent } = {}) => {
    if (!period.from || !period.to) return;
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ date_from: period.from, date_to: period.to, include_unscheduled: filter.include_unscheduled });
      ["category", "material_id", "work_order_id", "priority"].forEach((k) => { if (filter[k]) q.set(k, filter[k]); });
      setData(await request(`${API}/summary?${q}`)); setLastUpdate(new Date());
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [period, filter, request, notify]);
  useEffect(() => { load(); }, [load]);

  const recalculate = async () => {
    setSaving(true);
    try { await request(`${API}/recalculate`, { method: "POST", body: JSON.stringify({ actor }) }); notify("success", tx("Requirements recalculated.")); await load({ silent: true }); }
    catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const openAdjustments = async () => {
    try { setAdjustments(await request(`${API}/adjustments`)); setDialog({ type: "adjustments" }); } catch (e) { notify("error", e.message); }
  };

  const rows = useMemo(() => data?.rows || [], [data]);
  const columns = useMemo(() => [
    { headerName: tx("Material Code"), field: "material_code", width: 150, pinned: "left", cellStyle: { fontWeight: 700 } },
    { headerName: tx("Material Name"), field: "material_name", minWidth: 170, flex: 1 },
    { headerName: tx("Group"), colId: "category", width: 130, valueGetter: (p) => label("category", p.data.category) },
    { headerName: tx("Unit"), field: "unit", width: 70 },
    { headerName: tx("Planned"), field: "planned_qty", width: 110, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Adjustment"), field: "adjustment_qty", width: 110, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Total Need"), field: "total_qty", width: 120, type: "numericColumn", valueFormatter: (p) => num(p.value, 3), cellStyle: { fontWeight: 800 } },
    { headerName: tx("Allocated"), field: "allocated_qty", width: 110, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Available"), field: "available_qty", width: 120, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Difference"), field: "difference_qty", width: 120, type: "numericColumn", valueFormatter: (p) => `${p.value > 0 ? "+" : ""}${num(p.value, 3)}`,
      cellStyle: (p) => ({ fontWeight: 800, color: p.value < 0 ? "#F04438" : "#12B76A" }) },
    { headerName: tx("Earliest need"), field: "earliest_date", width: 120, valueFormatter: (p) => (p.value ? ddmmhhmm(p.value) : tx("Unscheduled")) },
    { headerName: tx("Status"), field: "status", width: 130, pinned: "right", cellRenderer: (p) => <Pill color={STATUS_COLORS[p.value]} text={label("reqStatus", p.value)} /> },
    { headerName: tx("Priority"), field: "priority", width: 110, pinned: "right", cellRenderer: (p) => <Pill width={80} color={PRIORITY_COLORS[p.value]} text={label("priority", p.value)} /> },
  ].map((c) => ({ filter: false, ...c })), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const totals = rows.reduce((a, r) => (String(r.unit).toUpperCase() === "KG" ? { planned: a.planned + r.planned_qty, adj: a.adj + r.adjustment_qty, total: a.total + r.total_qty, available: a.available + r.available_qty, diff: a.diff + r.difference_qty } : a),
    { planned: 0, adj: 0, total: 0, available: 0, diff: 0 });
  const distribution = Object.entries(data.distribution);
  const distTotal = distribution.reduce((a, [, v]) => a + v, 0);
  const selectSx = { minWidth: 150, flex: "1 1 150px" };
  const exportReport = () => downloadCsv(`material-requirement-${period.from}_${period.to}.csv`,
    ["Material", "Name", "Group", "Unit", "Planned", "Adjustment", "Total", "Available", "Difference", "Earliest need", "Status", "Priority", "Work orders"],
    rows.map((r) => [r.material_code, r.material_name, label("category", r.category), r.unit, r.planned_qty, r.adjustment_qty, r.total_qty, r.available_qty,
      r.difference_qty, r.earliest_date, r.status, r.priority, r.work_orders.join(" ")]));
  const exportPurchase = () => downloadCsv(`purchase-suggestions-${period.from}.csv`,
    ["Material", "Name", "Unit", "Shortage", "Safety stock", "Waiting IQC", "Suggested qty", "Needed by"],
    data.purchase_suggestions.map((p) => [p.material_code, p.material_name, p.unit, p.shortage_qty, p.safety_stock_qty, p.waiting_iqc_qty, p.suggested_qty, p.needed_by]));
  const maxShort = Math.max(...data.critical.map((r) => -r.difference_qty), 1);
  const quick = [
    [tx("Material Allocation"), Inventory2OutlinedIcon, () => navigate("/material-management/allocation")],
    [tx("Material Usage"), TrendingDownOutlinedIcon, () => navigate("/material-management/usage")],
    [tx("Lot History"), HistoryOutlinedIcon, () => navigate("/material-management/lot-history")],
    [tx("Create purchase suggestions"), AddShoppingCartOutlinedIcon, () => setDialog({ type: "purchase" })],
    [tx("Requirement Report"), FileDownloadOutlinedIcon, exportReport],
    [tx("Adjustment History"), TuneOutlinedIcon, openAdjustments],
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Material Requirement")} | VCC Plastics`} description={tx("Material needs from the production plan and BOM")} />
        <PageBreadcrumb pageTitle={tx("Material Requirement")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{tx("Material Requirement")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Material needs from the production plan and BOM")}</Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
            <ButtonGroup size="small" variant="outlined">
              <Button onClick={() => setPeriod(weekRange(0))}>{tx("This week")}</Button>
              <Button onClick={() => setPeriod(weekRange(1))}>{tx("Next week")}</Button>
              <Button onClick={() => { const t = new Date(); setPeriod({ from: iso(t), to: iso(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 29)) }); }}>{tx("Next 30 days")}</Button>
            </ButtonGroup>
            <TextField size="small" type="date" label={tx("Period from")} value={period.from} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <TextField size="small" type="date" label={tx("Period to")} value={period.to} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={btn("cancel")}>{tx("Refresh")}</Button>
            <Button startIcon={<CalculateOutlinedIcon />} disabled={!canEdit || saving} onClick={recalculate} sx={btn("cancel")}>{tx("Recalculate")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportReport} sx={btn("primary")}>{tx("Export")}</Button>
          </Stack>
        </Box>
        {loading ? <LinearProgress sx={{ mb: 1 }} /> : null}
        {lookups.products_without_bom?.length ? (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            {tx("Products without an active BOM are not counted: {list}", { list: lookups.products_without_bom.map((p) => p.product_code).join(", ") })}
          </Alert>
        ) : null}

        <KpiCardGroup sx={{ mb: 1.5 }}>
          <KpiTile tone="primary" title={tx("Total Requirement")} value={tons(k.total_requirement)} unit={tx("tons")} sub={`${k.material_count} ${tx("types")} · ${tx("in period")}`} icon={ViewInArOutlinedIcon} />
          <KpiTile tone="success" title={tx("Available Stock")} value={tons(k.available)} unit={tx("tons")} sub={tx("Stock left for the period = available stock minus needs dated before the period.")} icon={WarehouseOutlinedIcon} />
          <KpiTile tone="warning" title={tx("Shortage (t)")} value={tons(k.shortage)} unit={tx("tons")} icon={TrendingDownOutlinedIcon} />
          <KpiTile tone="accent" title={tx("Materials Running Short")} value={num(k.short_count)} unit={tx("types")} icon={Inventory2OutlinedIcon} onClick={() => setFilter((f) => ({ ...f, priority: "" }))} />
          <KpiTile tone="danger" title={tx("Critical Shortage")} value={num(k.critical_count)} unit={tx("types")} icon={ReportProblemOutlinedIcon} />
          <KpiTile tone="info" title={tx("PO Suggestions")} value={num(k.purchase_count)} unit={tx("suggestions")} icon={AddShoppingCartOutlinedIcon} onClick={() => setDialog({ type: "purchase" })} />
        </KpiCardGroup>

        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={selectSx}><InputLabel>{tx("Group")}</InputLabel>
              <Select label={tx("Group")} value={filter.category} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{lookups.categories.map((c) => <MenuItem key={c} value={c}>{label("category", c)}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={selectSx}><InputLabel>{tx("Material")}</InputLabel>
              <Select label={tx("Material")} value={filter.material_id} onChange={(e) => setFilter((f) => ({ ...f, material_id: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{lookups.materials.map((m) => <MenuItem key={m.id} value={m.id}>{m.material_code}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={selectSx}><InputLabel>{tx("Work Order")}</InputLabel>
              <Select label={tx("Work Order")} value={filter.work_order_id} onChange={(e) => setFilter((f) => ({ ...f, work_order_id: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{lookups.work_orders.map((w) => <MenuItem key={w.id} value={w.id}>{w.wo_no}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={selectSx}><InputLabel>{tx("Priority")}</InputLabel>
              <Select label={tx("Priority")} value={filter.priority} onChange={(e) => setFilter((f) => ({ ...f, priority: e.target.value }))}>
                <MenuItem value="">{tx("All")}</MenuItem>{["HIGH", "MEDIUM", "LOW"].map((p) => <MenuItem key={p} value={p}>{label("priority", p)}</MenuItem>)}
              </Select></FormControl>
            <FormControlLabel control={<Switch size="small" checked={filter.include_unscheduled} onChange={(e) => setFilter((f) => ({ ...f, include_unscheduled: e.target.checked }))} />}
              label={<Typography variant="caption" fontWeight={700}>{tx("Include unscheduled")}</Typography>} />
            <Button onClick={() => setFilter(EMPTY_FILTER)} sx={btn("cancel")}>{tx("Clear")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.8fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Material Requirement List")} subtitle={`(${rows.length})`} />
            <Box sx={{ px: 1 }}>
              <AgGridTable rowData={rows} columnDefs={columns} height={380} rowHeight={32} getRowId={(p) => String(p.data.material_id)} onRowClicked={(e) => setDialog({ type: "lines", row: e.data })} />
            </Box>
            <Stack direction="row" sx={{ px: 2, py: 1, gap: 3, flexWrap: "wrap", borderTop: 1, borderColor: "divider" }}>
              <Typography variant="caption" fontWeight={800}>{tx("Total")} (KG)</Typography>
              <Typography variant="caption">{tx("Planned")}: <b>{num(totals.planned, 2)}</b></Typography>
              <Typography variant="caption">{tx("Adjustment")}: <b>{num(totals.adj, 2)}</b></Typography>
              <Typography variant="caption">{tx("Total Need")}: <b>{num(totals.total, 2)}</b></Typography>
              <Typography variant="caption">{tx("Available")}: <b>{num(totals.available, 2)}</b></Typography>
              <Typography variant="caption">{tx("Difference")}: <b style={{ color: totals.diff < 0 ? "#F04438" : "#12B76A" }}>{num(totals.diff, 2)}</b></Typography>
            </Stack>
          </Paper>
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Requirement Trend (shortage vs excess)")} subtitle="(t)" />
              <Box sx={{ px: 1 }}>
                <Chart type="area" height={200} series={[
                  { name: tx("Shortfall"), data: data.trend.map((t) => -Number((t.shortage / 1000).toFixed(3))) },
                  { name: tx("Excess"), data: data.trend.map((t) => Number((t.excess / 1000).toFixed(3))) },
                ]} options={{
                  chart: { toolbar: { show: false }, background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, colors: ["#F04438", "#12B76A"],
                  stroke: { width: 2, curve: "smooth" }, fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.05 } }, markers: { size: 3 }, dataLabels: { enabled: false },
                  xaxis: { categories: data.trend.map((t) => `${String(t.week_start).slice(8, 10)}/${String(t.week_start).slice(5, 7)} (${tx("Week")} ${t.week_no})`), labels: { style: { colors: dark ? "#A7B0C0" : "#667085", fontSize: "10px" } } },
                  yaxis: { labels: { style: { colors: dark ? "#A7B0C0" : "#667085" }, formatter: (v) => num(v, 2) } }, grid: { borderColor: dark ? "#344054" : "#EAECF0" },
                  legend: { position: "top", labels: { colors: dark ? "#A7B0C0" : "#667085" } }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(Math.abs(v), 3)} t` } },
                }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Requirement by Material Group")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.3fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Chart type="donut" height={170} series={distribution.map(([, v]) => Number((v / 1000).toFixed(3)))} options={{
                    chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: distribution.map(([c]) => label("category", c)),
                    colors: distribution.map(([c]) => CATEGORY_COLORS[c]), legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] },
                    plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: tx("tons"), color: dark ? "#A7B0C0" : "#667085", formatter: () => tons(distTotal) }, value: { fontSize: "16px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033" } } } } },
                    tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 3)} t` } },
                  }} />
                </Box>
                <Stack spacing={0.8}>
                  {distribution.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : distribution.map(([c, v]) => (
                    <Stack key={c} direction="row" sx={{ justifyContent: "space-between" }}>
                      <Dot color={CATEGORY_COLORS[c]} text={label("category", c)} />
                      <Typography variant="caption" fontWeight={700}>{num(distTotal ? (v / distTotal) * 100 : 0, 1)}% ({tons(v)} t)</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "1fr 1fr 1.2fr" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Top Critical Shortages")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              {data.critical.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.critical.map((r) => (
                <Box key={r.material_id} onClick={() => setDialog({ type: "lines", row: r })} sx={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 90px", gap: 1, alignItems: "center", py: 0.6, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                  <Typography variant="caption" fontWeight={700} noWrap>{r.material_code}</Typography>
                  <Typography variant="caption" noWrap>{r.material_name}</Typography>
                  <Box sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${(-r.difference_qty / maxShort) * 100}%`, height: "100%", bgcolor: STATUS_COLORS[r.status] }} /></Box>
                  <Typography variant="caption" fontWeight={800} sx={{ textAlign: "right", color: STATUS_COLORS[r.status] }}>{qty(-r.difference_qty, r.unit)}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Suggested Actions")} />
            <Stack spacing={1} sx={{ px: 1.5, pb: 1.5 }}>
              {[
                [AddShoppingCartOutlinedIcon, "#F04438", tx("Create purchase suggestions"), tx("{n} materials are short", { n: data.actions.purchase }), data.actions.purchase, () => setDialog({ type: "purchase" })],
                [EditCalendarOutlinedIcon, "#F79009", tx("Adjust production plan"), tx("{n} work orders need review", { n: data.actions.adjust_plan }), data.actions.adjust_plan, () => navigate("/production-management/planning")],
                [LockOpenOutlinedIcon, "#12B76A", tx("Release IQC / Hold stock"), tx("{n} short materials have stock waiting in IQC or Hold", { n: data.actions.release_stock }), data.actions.release_stock, () => navigate("/material-management/lot-history?status=HOLD")],
              ].map(([Icon, color, title, sub, count, onClick]) => (
                <Stack key={title} direction="row" onClick={onClick} sx={{ alignItems: "center", gap: 1.25, p: 1.25, border: 1, borderColor: "divider", borderRadius: 1.5, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: color, color: "#fff", display: "grid", placeItems: "center" }}><Icon fontSize="small" /></Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={800}>{title}</Typography>
                    <Typography variant="caption" color="text.secondary">{sub}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 24, height: 24, px: 0.75, borderRadius: 12, bgcolor: count ? color : "action.disabledBackground", color: "#fff", fontSize: 12, fontWeight: 800, display: "grid", placeItems: "center" }}>{count}</Box>
                  <ChevronRightIcon fontSize="small" color="disabled" />
                </Stack>
              ))}
            </Stack>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Work Orders at Material Risk")} subtitle={`(${data.work_order_risk.length})`} />
            <Box sx={{ px: 1, pb: 1, maxHeight: 260, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, whiteSpace: "nowrap" } }}>
                <TableHead><TableRow><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Product")}</TableCell><TableCell>{tx("Earliest need")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell>{tx("Risk")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.work_order_risk.length === 0 ? <TableRow><TableCell colSpan={5}>{tx("No data.")}</TableCell></TableRow> : data.work_order_risk.map((w) => (
                    <TableRow key={w.work_order_id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/production-management/work-orders/management?wo=${encodeURIComponent(w.wo_no)}`)}>
                      <TableCell sx={{ fontWeight: 700 }}>{w.wo_no}</TableCell><TableCell>{w.product_name}</TableCell>
                      <TableCell>{w.required_date ? ddmmhhmm(w.required_date) : tx("Unscheduled")}</TableCell>
                      <TableCell><Tooltip title={w.materials.join(", ")}><span>{w.materials.join(", ")}</span></Tooltip></TableCell>
                      <TableCell><Pill width={80} color={PRIORITY_COLORS[w.risk]} text={label("priority", w.risk)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>

        <Paper elevation={0} sx={cardSx}>
          <Head title={tx("Quick Actions")} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)", xl: "repeat(7, 1fr)" }, gap: 1, px: 1.5, pb: 1.5 }}>
            {quick.map(([text, Icon, onClick]) => (
              <Button key={text} onClick={onClick} startIcon={<Icon sx={{ color: "primary.main" }} />}
                sx={{ justifyContent: "flex-start", border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none", color: "text.primary", fontWeight: 700, py: 1.25 }}>{text}</Button>
            ))}
          </Box>
        </Paper>

        {dialog?.type === "lines" && (
          <LinesDialog row={dialog.row} period={{ ...period, include_unscheduled: filter.include_unscheduled }} request={request} canEdit={canEdit} actor={actor} notify={notify}
            onClose={() => setDialog(null)} onChanged={() => load({ silent: true })} />
        )}
        {dialog?.type === "purchase" && (
          <SimpleListDialog icon={<AddShoppingCartOutlinedIcon />} title={tx("Purchase Suggestions")} subtitle={tx("Purchase orders are placed in ERP; export this list to send it.")}
            rows={data.purchase_suggestions} onExport={exportPurchase} onClose={() => setDialog(null)}
            columns={[["material_code", tx("Material Code")], ["material_name", tx("Material Name")], ["shortage_qty", tx("Shortfall"), "right", (r) => qty(r.shortage_qty, r.unit)],
              ["safety_stock_qty", tx("Safety Stock"), "right", (r) => qty(r.safety_stock_qty, r.unit)], ["waiting_iqc_qty", tx("Waiting IQC stock"), "right", (r) => qty(r.waiting_iqc_qty, r.unit)],
              ["suggested_qty", tx("Suggested qty"), "right", (r) => <b>{qty(r.suggested_qty, r.unit)}</b>], ["needed_by", tx("Needed by"), undefined, (r) => (r.needed_by ? ddmmhhmm(r.needed_by) : EMPTY)]]} />
        )}
        {dialog?.type === "adjustments" && (
          <SimpleListDialog icon={<TuneOutlinedIcon />} title={tx("Adjustment History")} rows={adjustments} onClose={() => setDialog(null)}
            columns={[["acted_at", tx("Time"), undefined, (r) => ddmmhhmm(r.acted_at)], ["wo_no", tx("Work Order")], ["material_code", tx("Material")],
              ["old_qty", tx("Old"), "right", (r) => qty(r.old_qty, r.unit)], ["new_qty", tx("New"), "right", (r) => qty(r.new_qty, r.unit)], ["reason", tx("Reason")], ["actor", tx("Operator")]]} />
        )}

        <Snackbar open={msg.open} autoHideDuration={4500} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
