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
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
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
import { Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, localeTag, setActiveLanguage, tx } from "../materialLocales";
import { KpiTile, downloadCsv, qty, tons, useRequest } from "../materialUi";
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
  const columns = useMemo(() => [
    { headerName: tx("Allocation No."), field: "allocation_no", width: 140, pinned: "left", cellStyle: { fontWeight: 700 } },
    { headerName: tx("Work Order"), field: "wo_no", width: 140 },
    { headerName: tx("Material"), field: "material_code", width: 150 },
    { headerName: tx("Group"), colId: "category", width: 120, valueGetter: (p) => label("category", p.data.category) },
    { headerName: tx("Lot No."), field: "lot_no", width: 130 },
    { headerName: tx("Area"), field: "location_name", width: 140 },
    { headerName: tx("Reserved qty"), field: "reserved_qty", width: 110, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("In use qty"), field: "in_use_qty", width: 120, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Total"), field: "initial_qty", width: 100, type: "numericColumn", valueFormatter: (p) => `${num(p.value, 3)} ${p.data.unit}` },
    { headerName: tx("Allocated at"), field: "reserved_at", width: 120, valueFormatter: (p) => ddmmhhmm(p.value) },
    { headerName: tx("Reservation expiry"), field: "expires_at", width: 130, valueFormatter: (p) => (p.data.reserved_qty > 0 ? ddmmhhmm(p.value) : EMPTY),
      cellStyle: (p) => ({ color: p.data.hours_left != null && p.data.hours_left <= 4 ? "#F04438" : undefined, fontWeight: p.data.hours_left != null && p.data.hours_left <= 4 ? 800 : 400 }) },
    { headerName: tx("Status"), field: "status", width: 130, pinned: "right", cellRenderer: (p) => <AllocPill value={p.value} /> },
  ].map((c) => ({ filter: false, ...c })), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const statusSeries = STATUSES.map((s) => Number(((data.by_status[s] || 0) / 1000).toFixed(3)));
  const statusTotal = STATUSES.reduce((a, s) => a + (data.by_status[s] || 0), 0);
  const maxArea = Math.max(...data.by_area.map(([, v]) => v), 1);
  const selectSx = { minWidth: 150, flex: "1 1 150px" };
  const exportReport = () => downloadCsv(`material-allocations-${period.from}_${period.to}.csv`,
    ["Allocation No", "Work Order", "Order", "Material", "Lot", "Area", "Machine", "Reserved", "Issued", "Returned", "In use", "Unit", "Status", "Allocated at", "Expires at"],
    items.map((a) => [a.allocation_no, a.wo_no, a.order_no, a.material_code, a.lot_no, a.location_name, a.machine_code, a.reserved_qty, a.issued_qty, a.returned_qty,
      a.in_use_qty, a.unit, a.status, a.reserved_at, a.expires_at]));
  const refreshAll = () => { load({ silent: true }); loadLookups(); };
  const quick = [
    [tx("New Allocation"), AddTaskOutlinedIcon, () => setDialog({ type: "create" }), !canEdit],
    [tx("Material Transfer"), SwapHorizOutlinedIcon, () => navigate("/material-management/lot-history"), false],
    [tx("Release Reservation"), LockOpenOutlinedIcon, () => { const first = data.expiring[0] || items.find((a) => a.reserved_qty > 0); if (first) setDialog({ type: "detail", item: first }); }, !canEdit || !items.some((a) => a.reserved_qty > 0)],
    [tx("Material Status"), ViewInArOutlinedIcon, () => navigate("/material-management/status"), false],
    [tx("Material Usage"), TrendingDownOutlinedIcon, () => navigate("/material-management/usage"), false],
    [tx("Lot History"), HistoryOutlinedIcon, () => navigate("/material-management/lot-history"), false],
    [tx("Allocation Report"), FileDownloadOutlinedIcon, exportReport, !items.length],
  ];
  const tableSx = { "& td, & th": { fontSize: 11.5, px: 0.75, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800 } };

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Material Allocation")} | VCC Plastics`} description={tx("Allocate and reserve material for work orders")} />
        <PageBreadcrumb pageTitle={tx("Material Allocation")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{tx("Material Allocation")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Allocate and reserve material for work orders")}</Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
            <TextField size="small" type="date" label={tx("Period from")} value={period.from} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <TextField size="small" type="date" label={tx("Period to")} value={period.to} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={btn("cancel")}>{tx("Refresh")}</Button>
            <Button startIcon={<AddTaskOutlinedIcon />} disabled={!canEdit} onClick={() => setDialog({ type: "create" })} sx={btn("primary")}>{tx("New Allocation")}</Button>
          </Stack>
        </Box>
        {loading ? <LinearProgress sx={{ mb: 1 }} /> : null}

        <KpiCardGroup sx={{ mb: 1.5 }}>
          <KpiTile tone="primary" title={tx("Total Allocated")} value={tons(k.total, 3)} unit={tx("tons")} sub={`${k.count} ${tx("allocations")}`} icon={AssignmentOutlinedIcon} />
          <KpiTile tone="success" title={tx("In Use (at machine)")} value={tons(k.in_use, 3)} unit={tx("tons")} icon={PrecisionManufacturingOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: "IN_USE" }))} />
          <KpiTile tone="warning" title={tx("Reserved (t)")} value={tons(k.reserved, 3)} unit={tx("tons")} icon={HourglassBottomOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: "RESERVED" }))} />
          <KpiTile tone="accent" title={tx("Completed")} value={tons(k.completed, 3)} unit={tx("tons")} icon={TaskAltOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: "COMPLETED" }))} />
          <KpiTile tone="danger" title={tx("Cancelled")} value={tons(k.cancelled, 3)} unit={tx("tons")} icon={CancelOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, status: "CANCELLED" }))} />
          <KpiTile tone="info" title={tx("Reservations Expiring")} value={num(k.expiring)} unit={tx("allocations")} sub="≤ 4 h" icon={ScheduleOutlinedIcon} />
        </KpiCardGroup>

        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
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
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.9fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Allocation List")} subtitle={`(${items.length})`} />
            <Box sx={{ px: 1, pb: 1 }}>
              <AgGridTable rowData={items} columnDefs={columns} height={400} rowHeight={32} getRowId={(p) => String(p.data.id)} onRowClicked={(e) => setDialog({ type: "detail", item: e.data })} />
            </Box>
          </Paper>
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Allocation by Status")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.3fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Chart type="donut" height={170} series={statusSeries} options={{
                    chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: STATUSES.map((s) => label("allocStatus", s)), colors: STATUSES.map((s) => ALLOC_COLORS[s]),
                    legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 3)} t` } },
                    plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: tx("tons"), color: dark ? "#A7B0C0" : "#667085", formatter: () => tons(statusTotal, 3) }, value: { fontSize: "16px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033" } } } } },
                  }} />
                </Box>
                <Stack spacing={0.8}>
                  {STATUSES.map((s) => (
                    <Stack key={s} direction="row" sx={{ justifyContent: "space-between" }}>
                      <Dot color={ALLOC_COLORS[s]} text={label("allocStatus", s)} />
                      <Typography variant="caption" fontWeight={700}>{tons(data.by_status[s] || 0, 3)} t{statusTotal && ["IN_USE", "RESERVED"].includes(s) ? ` (${num(((data.by_status[s] || 0) / statusTotal) * 100, 1)}%)` : ""}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
              <Head title={tx("Allocation by Area")} subtitle="(KG)" />
              <Stack spacing={1} sx={{ px: 1.5, pb: 1.5 }}>
                {data.by_area.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.by_area.map(([area, value]) => (
                  <Box key={area} sx={{ display: "grid", gridTemplateColumns: "130px 1fr 80px", gap: 1, alignItems: "center" }}>
                    <Typography variant="caption" noWrap>{area}</Typography>
                    <Box sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${(value / maxArea) * 100}%`, height: "100%", bgcolor: "#1570EF" }} /></Box>
                    <Typography variant="caption" fontWeight={800} sx={{ textAlign: "right" }}>{num(value, 2)}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "1fr 1fr 1fr" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Reservations Expiring Soon")} />
            <Box sx={{ px: 1, pb: 1, maxHeight: 240, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={tableSx}>
                <TableHead><TableRow><TableCell>{tx("Allocation No.")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell align="right">{tx("Reserved qty")}</TableCell><TableCell>{tx("Reservation expiry")}</TableCell><TableCell align="right">{tx("Time left")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.expiring.length === 0 ? <TableRow><TableCell colSpan={6}>{tx("No data.")}</TableCell></TableRow> : data.expiring.map((a) => (
                    <TableRow key={a.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ type: "detail", item: a })}>
                      <TableCell sx={{ fontWeight: 700 }}>{a.allocation_no}</TableCell><TableCell>{a.material_code}</TableCell><TableCell>{a.wo_no}</TableCell>
                      <TableCell align="right">{qty(a.reserved_qty, a.unit)}</TableCell><TableCell>{ddmmhhmm(a.expires_at)}</TableCell>
                      <TableCell align="right" sx={{ color: "#F04438", fontWeight: 800 }}>{hoursText(a.hours_left)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Allocation by Work Order (Top 5)")} />
            <Box sx={{ px: 1, pb: 1 }}>
              <Table size="small" sx={tableSx}>
                <TableHead><TableRow><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Product")}</TableCell><TableCell align="right">{tx("Total Allocated")} (KG)</TableCell><TableCell>{tx("Work Order Status")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.by_work_order.length === 0 ? <TableRow><TableCell colSpan={4}>{tx("No data.")}</TableCell></TableRow> : data.by_work_order.map((w) => (
                    <TableRow key={w.work_order_id} hover sx={{ cursor: "pointer" }} onClick={() => setFilter((f) => ({ ...f, work_order_id: w.work_order_id }))}>
                      <TableCell sx={{ fontWeight: 700 }}>{w.wo_no}</TableCell><TableCell>{w.product_name}</TableCell>
                      <TableCell align="right">{num(w.total, 3)}</TableCell><TableCell>{w.wo_status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Recent Allocation History")} />
            <Box sx={{ px: 1, pb: 1, maxHeight: 240, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={tableSx}>
                <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Allocation No.")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell>{tx("Transaction")}</TableCell><TableCell align="right">{tx("Quantity")}</TableCell><TableCell>{tx("Operator")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.recent.length === 0 ? <TableRow><TableCell colSpan={6}>{tx("No data.")}</TableCell></TableRow> : data.recent.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{ddmmhhmm(t.acted_at)}</TableCell><TableCell>{t.reference_no}</TableCell><TableCell>{t.material_code}</TableCell>
                      <TableCell>{label("txn", t.txn_type)}</TableCell><TableCell align="right">{Number(t.qty_change) ? `${num(t.qty_change, 3)} ${t.unit}` : EMPTY}</TableCell><TableCell>{t.actor}</TableCell>
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
            {quick.map(([text, Icon, onClick, disabled]) => (
              <Button key={text} disabled={disabled} onClick={onClick} startIcon={<Icon sx={{ color: disabled ? "inherit" : "primary.main" }} />}
                sx={{ justifyContent: "flex-start", border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none", color: "text.primary", fontWeight: 700, py: 1.25 }}>{text}</Button>
            ))}
          </Box>
        </Paper>

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

