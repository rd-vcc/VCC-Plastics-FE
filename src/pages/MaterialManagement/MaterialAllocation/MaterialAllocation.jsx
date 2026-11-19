import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar,
  Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, ThemeProvider as MuiThemeProvider, Typography,
} from "@mui/material";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import TrendingDownOutlinedIcon from "@mui/icons-material/TrendingDownOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { Dot, EMPTY, Head, QuickAction, QuickActions, btn, cardSx, ddmmhhmm, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, localeTag, setActiveLanguage, tx } from "../materialLocales";
import { KpiTile, colShares, downloadExcel, fitColumns, qty, tons, useRequest } from "../materialUi";
import { ALLOC_COLORS, AllocPill, AllocationDetailDialog, CreateAllocationDialog, hoursText } from "./AllocationDialogs";

const API = `${API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "")}/api/material-allocations`;
const STATUSES = ["IN_USE", "RESERVED", "COMPLETED", "CANCELLED"];
const EMPTY_FILTER = { status: "", work_order_id: "", category: "", material_id: "", location_id: "" };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export default function MaterialAllocation() {
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
  const [period, setPeriod] = useState({ from: today(), to: today() });
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  const loadLookups = useCallback(() => request(`${API}/lookups`).then(setLookups).catch((e) => notify("error", e.message)), [request, notify]);
  useEffect(() => { loadLookups(); }, [loadLookups]);
  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ date_from: period.from, date_to: period.to });
      Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v); });
      setData(await request(`${API}/summary?${q}`)); setLastUpdate(new Date());
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [period, filter, request, notify]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, 60000);
    return () => clearInterval(t);
  }, [autoRefresh, load, dialog]);
  useEffect(() => {
    const order = params.get("order");
    if (order && lookups && !dialog) setDialog({ type: "create" });
  }, [params, lookups]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => data?.items || [], [data]);
  const columns = useMemo(() => fitColumns([
    { headerName: tx("Slip No."), headerTooltip: tx("Allocation No."), field: "allocation_no", width: 112, pinned: "left", cellStyle: { fontWeight: 700 } },
    { headerName: tx("Work Order"), field: "wo_no", width: 108 },
    { headerName: tx("Material"), field: "material_code", width: 78 },
    { headerName: tx("Group (short)"), headerTooltip: tx("Group"), colId: "category", width: 92, valueGetter: (p) => label("category", p.data.category), tooltipValueGetter: (p) => label("category", p.data.category) },
    { headerName: tx("Lot No."), field: "lot_no", width: 94 },
    { headerName: tx("Area"), field: "location_name", width: 86, tooltipField: "location_name" },
    { headerName: tx("Reserved qty"), field: "reserved_qty", width: 68, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("In use"), headerTooltip: tx("In use qty"), field: "in_use_qty", width: 76, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Total"), field: "initial_qty", width: 80, type: "numericColumn", valueFormatter: (p) => `${num(p.value, 3)} ${p.data.unit}` },
    { headerName: tx("Alloc. time"), headerTooltip: tx("Allocated at"), field: "reserved_at", width: 86, valueFormatter: (p) => ddmmhhmm(p.value) },
    { headerName: tx("Reservation expiry"), field: "expires_at", width: 108, valueFormatter: (p) => (p.data.reserved_qty > 0 ? ddmmhhmm(p.value) : EMPTY),
      cellStyle: (p) => ({ color: p.data.hours_left != null && p.data.hours_left <= 4 ? "#F04438" : undefined, fontWeight: p.data.hours_left != null && p.data.hours_left <= 4 ? 800 : 400 }) },
    { headerName: tx("Status"), field: "status", width: 112, pinned: "right", cellRenderer: (p) => <AllocPill value={p.value} /> },
  ]), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const statusSeries = STATUSES.map((s) => Number(((data.by_status[s] || 0) / 1000).toFixed(3)));
  const statusTotal = STATUSES.reduce((a, s) => a + (data.by_status[s] || 0), 0);
  const maxArea = Math.max(...data.by_area.map(([, v]) => v), 1);
  const selectSx = { minWidth: 150, flex: "1 1 150px" };
  const exportReport = () => downloadExcel(`material-allocations-${period.from}_${period.to}.csv`,
    ["Allocation No", "Work Order", "Order", "Material", "Lot", "Area", "Machine", "Reserved", "Issued", "Returned", "In use", "Unit", "Status", "Allocated at", "Expires at"],
    items.map((a) => [a.allocation_no, a.wo_no, a.order_no, a.material_code, a.lot_no, a.location_name, a.machine_code, a.reserved_qty, a.issued_qty, a.returned_qty,
      a.in_use_qty, a.unit, a.status, a.reserved_at, a.expires_at]));
  const refreshAll = () => { load({ silent: true }); loadLookups(); };
  const quick = [
    [tx("New Allocation"), AddTaskOutlinedIcon, "#1570EF", () => setDialog({ type: "create" }), !canEdit, true],
    [tx("Release Reservation"), LockOpenOutlinedIcon, "#F79009", () => { const first = data.expiring[0] || items.find((a) => a.reserved_qty > 0); if (first) setDialog({ type: "detail", item: first }); }, !canEdit || !items.some((a) => a.reserved_qty > 0)],
    [tx("Material Status"), ViewInArOutlinedIcon, "#12B76A", () => navigate("/material-management/status"), false],
    [tx("Material Usage"), TrendingDownOutlinedIcon, "#F04438", () => navigate("/material-management/usage"), false],
    [tx("Lot History"), HistoryOutlinedIcon, "#7A5AF8", () => navigate("/material-management/lot-history"), false],
  ];
  const tableSx = { "& td, & th": { fontSize: 11, px: 0.75, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800 } };
  const activeFilters = Object.values(filter).filter(Boolean).length;
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const fill = { flex: 1, minHeight: 0 };
  const panel = { ...cardSx, display: "flex", flexDirection: "column", minHeight: { xs: 220, xl: 0 } };
  const tableBody = { ...fill, px: 1, pb: 1, overflow: "auto" };
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const emptyBody = <Box sx={{ flex: 1, display: "grid", placeItems: "center", pb: 2 }}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></Box>;

  return (
    <MuiThemeProvider theme={muiTheme}>
      {/* One screen on lg+: toolbar · KPI · 3-column grid (list ×2 | status + area / expiring | by WO | recent + quick actions bottom-right) */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: { lg: "calc(var(--app-vh, 100vh) - 74px)" }, minHeight: 0, "& > *": { flexShrink: 0 } }}>
        <PageMeta title={`${tx("Material Allocation")} | VCC Plastics`} description={tx("Allocate and reserve material for work orders")} />
        <PageBreadcrumb pageTitle={tx("Material Allocation")} />

        <Paper elevation={0} sx={{ ...cardSx, p: 0.75 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<FilterListIcon />} onClick={() => setShowFilter((v) => !v)}
              sx={{ ...toolBtnSx, ...(showFilter || activeFilters ? { borderColor: "primary.main", color: "primary.main" } : {}) }}>
              {tx("Filter")}{activeFilters ? ` (${activeFilters})` : ""}
            </Button>
            <TextField size="small" type="date" label={tx("Period from")} value={period.from} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 140 }} />
            <TextField size="small" type="date" label={tx("Period to")} value={period.to} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 140 }} />
            <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!items.length} onClick={exportReport} sx={toolBtnSx}>{tx("Export")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {showFilter ? (
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center", mt: 0.75 }}>
              {[["status", tx("Status"), STATUSES.map((s) => [s, label("allocStatus", s)])],
                ["work_order_id", tx("Work Order"), lookups.work_orders.map((w) => [w.id, w.wo_no])],
                ["category", tx("Group"), lookups.categories.map((c) => [c, label("category", c)])],
                ["material_id", tx("Material"), lookups.materials.map((m) => [m.id, m.material_code])],
                ["location_id", tx("Area"), lookups.locations.map((l) => [l.id, l.location_name])]].map(([key, text, options]) => (
                <FormControl key={key} size="small" sx={selectSx}><InputLabel>{text}</InputLabel>
                  <Select label={text} value={filter[key]} onChange={(e) => setFilter((f) => ({ ...f, [key]: e.target.value }))}>
                    <MenuItem value="">{tx("All")}</MenuItem>{options.map(([v, n]) => <MenuItem key={v} value={v}>{n}</MenuItem>)}
                  </Select></FormControl>
              ))}
              <Button onClick={() => setFilter(EMPTY_FILTER)} sx={btn("cancel")}>{tx("Clear")}</Button>
            </Stack>
          ) : null}
          {loading ? <LinearProgress sx={{ mt: 0.5, height: 2 }} /> : null}
        </Paper>

        <KpiCardGroup>
          <KpiTile tone="primary" title={tx("Total Allocated")} value={tons(k.total, 3)} unit={tx("tons")} sub={`${k.count} ${tx("allocations")}`} icon={AssignmentOutlinedIcon} />
          <KpiTile tone="success" title={tx("In Use (at machine)")} value={tons(k.in_use, 3)} unit={tx("tons")} icon={PrecisionManufacturingOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: "IN_USE" }))} />
          <KpiTile tone="warning" title={tx("Reserved (t)")} value={tons(k.reserved, 3)} unit={tx("tons")} icon={HourglassBottomOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: "RESERVED" }))} />
          <KpiTile tone="accent" title={tx("Completed")} value={tons(k.completed, 3)} unit={tx("tons")} icon={TaskAltOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: "COMPLETED" }))} />
          <KpiTile tone="danger" title={tx("Cancelled")} value={tons(k.cancelled, 3)} unit={tx("tons")} icon={CancelOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: "CANCELLED" }))} />
          <KpiTile tone="info" title={tx("Reservations Expiring")} value={num(k.expiring)} unit={tx("allocations")} sub="≤ 4 h" icon={ScheduleOutlinedIcon} />
        </KpiCardGroup>

        {/* One 3-column grid so every card edge lines up; quick actions in the bottom-right corner */}
        <Box sx={{ flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "repeat(3, minmax(0,1fr))" }, gridTemplateRows: { xl: "minmax(0,1.25fr) minmax(0,1fr)" } }}>
          <Paper elevation={0} sx={{ ...panel, gridColumn: { lg: "1 / -1", xl: "1 / span 2" } }}>
            <Head title={tx("Allocation List")} subtitle={`(${items.length})`} />
            <Box sx={{ ...fill, px: 1, pb: 1, minHeight: { xs: 320, xl: 0 } }}>
              <AgGridTable rowData={items} columnDefs={columns} height="100%" rowHeight={27} getRowId={(p) => String(p.data.id)} onRowClicked={(e) => setDialog({ type: "detail", item: e.data })} />
            </Box>
          </Paper>
          <Stack spacing={1} sx={{ minHeight: 0 }}>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Allocation by Status")} />
              <Box sx={{ ...fill, display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", alignItems: "center", gap: 1, pl: 0.5, pr: 1.5 }}>
                <Chart type="donut" height={124} series={statusTotal ? statusSeries : [1]} options={{
                  chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: statusTotal ? STATUSES.map((s) => label("allocStatus", s)) : [tx("No data.")], colors: statusTotal ? STATUSES.map((s) => ALLOC_COLORS[s]) : ["#EAECF0"],
                  legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { enabled: Boolean(statusTotal), theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 3)} t` } },
                  plotOptions: { pie: { donut: { size: "76%", labels: { show: true, total: { show: true, label: tx("tons"), fontSize: "10px", color: axisColor, formatter: () => tons(statusTotal, 3) }, name: { fontSize: "10px", offsetY: -2 }, value: { fontSize: "17px", fontWeight: 800, offsetY: 2, color: dark ? "#F3F4F6" : "#172033" } } } } },
                }} />
                <Stack spacing={0.7} sx={{ minWidth: 0 }}>
                  {STATUSES.map((s) => (
                    <Box key={s} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", columnGap: 1, alignItems: "center" }}>
                      <Box sx={{ minWidth: 0, overflow: "hidden", "& .MuiTypography-root": { fontSize: 11, whiteSpace: "nowrap" } }}><Dot color={ALLOC_COLORS[s]} text={label("allocStatus", s)} /></Box>
                      <Typography variant="caption" sx={{ fontSize: 11, whiteSpace: "nowrap" }}><b>{tons(data.by_status[s] || 0, 3)} t</b> <Box component="span" sx={{ color: "text.secondary" }}>· {num(statusTotal ? ((data.by_status[s] || 0) / statusTotal) * 100 : 0, 0)}%</Box></Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Allocation by Area")} subtitle="(KG)" />
              {data.by_area.length === 0 ? emptyBody : (
                <Stack sx={{ ...fill, px: 1.5, pb: 1, gap: 1.1, overflow: "auto", justifyContent: data.by_area.length < 4 ? "center" : "flex-start" }}>
                  {data.by_area.map(([area, value]) => (
                    <Box key={area}>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", mb: 0.3 }}>
                        <Typography variant="caption" noWrap sx={{ minWidth: 0, fontSize: 11.5 }}>{area}</Typography>
                        <Typography variant="caption" fontWeight={800} sx={{ fontSize: 11.5 }}>{num(value, 2)}</Typography>
                      </Stack>
                      <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${(value / maxArea) * 100}%`, height: "100%", borderRadius: 3, bgcolor: "#1570EF" }} /></Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Paper>
          </Stack>

          <Paper elevation={0} sx={panel}>
            <Head title={tx("Reservations Expiring Soon")} />
            <Box sx={tableBody}>
              <Table size="small" stickyHeader sx={{ ...tableSx, ...colShares(26, 18, 24, 16, 16) }}>
                <TableHead><TableRow><TableCell>{tx("Slip No.")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell align="right">{tx("Reserved qty")}</TableCell><TableCell align="right">{tx("Time left")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.expiring.length === 0 ? <TableRow><TableCell colSpan={5}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></TableCell></TableRow> : data.expiring.map((a) => (
                    <TableRow key={a.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ type: "detail", item: a })} title={`${tx("Reservation expiry")}: ${ddmmhhmm(a.expires_at)}`}>
                      <TableCell sx={{ fontWeight: 700 }}>{a.allocation_no}</TableCell><TableCell>{a.material_code}</TableCell><TableCell>{a.wo_no}</TableCell>
                      <TableCell align="right">{qty(a.reserved_qty, a.unit)}</TableCell>
                      <TableCell align="right" sx={{ color: "#F04438", fontWeight: 800 }}>{hoursText(a.hours_left)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Allocation by Work Order (Top 5)")} />
            <Box sx={tableBody}>
              <Table size="small" stickyHeader sx={{ ...tableSx, ...colShares(25, 33, 18, 24) }}>
                <TableHead><TableRow><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Product")}</TableCell><TableCell align="right" title={tx("Total Allocated")}>{tx("Total (KG)")}</TableCell><TableCell>{tx("Work Order Status")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.by_work_order.length === 0 ? <TableRow><TableCell colSpan={4}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></TableCell></TableRow> : data.by_work_order.map((w) => (
                    <TableRow key={w.work_order_id} hover sx={{ cursor: "pointer" }} onClick={() => { setFilter((f) => ({ ...f, work_order_id: w.work_order_id })); setShowFilter(true); }}>
                      <TableCell sx={{ fontWeight: 700 }}>{w.wo_no}</TableCell><TableCell title={w.product_name}>{w.product_name}</TableCell>
                      <TableCell align="right">{num(w.total, 3)}</TableCell><TableCell>{w.wo_status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Stack spacing={1} sx={{ minHeight: 0 }}>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Recent Allocation History")} />
              <Box sx={tableBody}>
                <Table size="small" stickyHeader sx={{ ...tableSx, ...colShares(17, 22, 22, 17, 22) }}>
                  <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Slip No.")}</TableCell><TableCell title={tx("Transaction")}>{tx("Transaction (short)")}</TableCell><TableCell align="right" title={tx("Quantity")}>{tx("Qty (short)")}</TableCell><TableCell title={tx("Operator")}>{tx("Operator (short)")}</TableCell></TableRow></TableHead>
                  <TableBody>
                    {data.recent.length === 0 ? <TableRow><TableCell colSpan={5}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></TableCell></TableRow> : data.recent.map((t) => (
                      <TableRow key={t.id} title={t.material_code}>
                        <TableCell>{ddmmhhmm(t.acted_at)}</TableCell><TableCell>{t.reference_no}</TableCell>
                        <TableCell>{label("txn", t.txn_type)}</TableCell><TableCell align="right">{Number(t.qty_change) ? `${num(t.qty_change, 3)} ${t.unit}` : EMPTY}</TableCell><TableCell>{t.actor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, flexShrink: 0 }}>
              <Head title={tx("Quick Actions")} />
              <QuickActions columns={3} sx={{ pb: 1.25 }}>
                {quick.map(([text, Icon, color, onClick, disabled, primary]) => <QuickAction key={text} icon={Icon} text={text} color={color} onClick={onClick} disabled={disabled} primary={primary} />)}
              </QuickActions>
            </Paper>
          </Stack>
        </Box>

        {dialog?.type === "create" && (
          <CreateAllocationDialog api={API} request={request} lookups={lookups} actor={actor} notify={notify} onClose={() => setDialog(null)} onChanged={refreshAll} />
        )}
        {dialog?.type === "detail" && (
          <AllocationDetailDialog api={API} request={request} allocation={dialog.item} machines={lookups.machines} canEdit={canEdit} actor={actor} notify={notify}
            onClose={() => setDialog(null)} onChanged={refreshAll} />
        )}
        <Snackbar open={msg.open} autoHideDuration={6000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

