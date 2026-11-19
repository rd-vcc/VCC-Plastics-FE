import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputAdornment, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar,
  Stack, Switch, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Tooltip, TextField, ThemeProvider as MuiThemeProvider, Typography,
} from "@mui/material";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";

import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { KpiTile, downloadExcel, useRequest } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, QuickAction, QuickActions, btn, cardSx, ddmmhhmm, num, pageTheme } from "../ProductionPlanning/ui";
import { ProductionLogDialog } from "../WorkOrders/ProductionExecution/ExParts";
import { SystemStatusBar } from "../WorkOrders/WorkOrderManagement/WoParts";
import { localeTag, setActiveLanguage, tx } from "./resLocales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const API = `${BASE}/api/production-results`;
const EXEC_API = `${BASE}/api/production-execution`;
const EMPTY_FILTER = { machine_id: "", product_id: "", customer_id: "", shift_id: "" };
const STATE_COLORS = { COMPLETED: "#12B76A", IN_PROGRESS: "#2E90FA", CANCELLED: "#F04438" };
const REASON_COLORS = ["#F04438", "#F79009", "#0E9384", "#7A5AF8", "#2E90FA", "#98A2B3", "#EE46BC"];
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const presetRange = (key) => {
  const t = new Date();
  if (key === "yesterday") { const y = new Date(t); y.setDate(t.getDate() - 1); return { from: ymd(y), to: ymd(y) }; }
  if (key === "week") { const m = new Date(t); m.setDate(t.getDate() - ((t.getDay() + 6) % 7)); return { from: ymd(m), to: ymd(t) }; }
  if (key === "month") return { from: ymd(new Date(t.getFullYear(), t.getMonth(), 1)), to: ymd(t) };
  return { from: ymd(t), to: ymd(t) };
};
const pill = (color) => ({ display: "inline-block", width: 104, textAlign: "center", px: 0.5, py: 0.2, borderRadius: 1, fontSize: 10, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40` });

function delta(cur, prev, digits = 0, unit = "") {
  if (prev == null || cur == null) return "";
  const d = cur - prev;
  return `${d > 0 ? "↑" : d < 0 ? "↓" : "•"} ${num(Math.abs(d), digits)}${unit} ${tx("vs previous period")}`;
}

export default function ProductionResults() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const request = useRequest();

  const [lookups, setLookups] = useState(null);
  const [range, setRange] = useState(presetRange("today"));
  const [preset, setPreset] = useState("today");
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [tab, setTab] = useState("ALL");
  const [data, setData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "info", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  useEffect(() => { request(`${API}/lookups`).then(setLookups).catch((e) => notify("error", e.message)); }, [request, notify]);
  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ date_from: range.from, date_to: range.to });
      Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v); });
      if (search.trim()) q.set("search", search.trim());
      setData(await request(`${API}/summary?${q}`)); setLastUpdate(new Date());
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [range, filter, search, request, notify]);
  useEffect(() => { const t = setTimeout(() => load(), search ? 350 : 0); return () => clearTimeout(t); }, [load, search]);
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, 60000);
    return () => clearInterval(t);
  }, [autoRefresh, load, dialog]);

  const items = useMemo(() => data?.items || [], [data]);
  const tabItems = useMemo(() => items.filter((w) => tab === "ALL" || w.result_state === tab), [items, tab]);
  const columns = useMemo(() => [
    { headerName: tx("WO No."), field: "wo_no", width: 110, pinned: "left", cellStyle: { fontWeight: 700, color: "#1570EF" } },
    { headerName: tx("Production Order No."), field: "order_no", width: 100 },
    { headerName: tx("Product"), field: "product_name", flex: 1, minWidth: 100, tooltipField: "product_name" },
    { headerName: tx("Machine"), field: "machine_code", width: 70 },
    { headerName: tx("Mold"), field: "mold_code", width: 94 },
    { headerName: tx("Planned"), headerTooltip: tx("Planned Qty"), field: "planned_qty", width: 70, type: "numericColumn", valueFormatter: (p) => num(p.value) },
    { headerName: tx("Good"), headerTooltip: tx("Good (PCS)"), field: "good_qty", width: 60, type: "numericColumn", valueFormatter: (p) => num(p.value), cellStyle: { color: "#039855", fontWeight: 700 } },
    { headerName: tx("Reject"), headerTooltip: tx("Reject (PCS)"), field: "reject_qty", width: 56, type: "numericColumn", valueFormatter: (p) => num(p.value), cellStyle: { color: "#D92D20" } },
    { headerName: tx("Yield (%)"), colId: "yield", width: 70, type: "numericColumn", valueGetter: (p) => p.data.metrics.yield_pct, valueFormatter: (p) => (p.value != null ? num(p.value, 2) : EMPTY) },
    { headerName: "OEE", colId: "oee", width: 60, type: "numericColumn", valueGetter: (p) => p.data.metrics.oee_pct, valueFormatter: (p) => (p.value != null ? `${num(p.value, 1)}%` : EMPTY) },
    { headerName: tx("Completed Time"), field: "completed_at", width: 92, valueFormatter: (p) => ddmmhhmm(p.value) },
    { headerName: tx("Operator"), field: "operator_code", width: 80 },
    { headerName: tx("Status"), field: "result_state", width: 116, pinned: "right", cellRenderer: (p) => <Box component="span" sx={pill(STATE_COLORS[p.value])}>{tx({ COMPLETED: "Completed", IN_PROGRESS: "In Progress", CANCELLED: "Cancelled" }[p.value])}</Box> },
  ].map((c) => ({ filter: false, minWidth: c.width, ...c })), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const p = k.prev;
  const counts = { ALL: items.length, COMPLETED: items.filter((w) => w.result_state === "COMPLETED").length, IN_PROGRESS: items.filter((w) => w.result_state === "IN_PROGRESS").length, CANCELLED: items.filter((w) => w.result_state === "CANCELLED").length };
  const applyPreset = (key) => { setPreset(key); setRange(presetRange(key)); };
  const exportCsv = () => downloadExcel(`production-results-${range.from}_${range.to}.csv`,
    ["WO No", "Production Order", "Product", "Customer", "Machine", "Mold", "Planned", "Good", "Reject", "Yield %", "OEE %", "Avg cycle s", "Completed", "Operator", "Status"],
    tabItems.map((w) => [w.wo_no, w.order_no, w.product_name, w.customer_name, w.machine_code, w.mold_code, w.planned_qty, w.good_qty, w.reject_qty, w.metrics.yield_pct,
      w.metrics.oee_pct, w.metrics.avg_cycle_sec, w.completed_at, w.operator_code, w.result_state]));
  const printReport = () => {
    const w = window.open("", "_blank", "width=1000,height=760");
    if (!w) return;
    const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const rows = tabItems.map((x) => `<tr><td>${esc(x.wo_no)}</td><td>${esc(x.order_no)}</td><td>${esc(x.product_name)}</td><td>${esc(x.machine_code)}</td><td class="r">${num(x.planned_qty)}</td><td class="r">${num(x.good_qty)}</td><td class="r">${num(x.reject_qty)}</td><td class="r">${x.metrics.yield_pct ?? "—"}</td><td class="r">${x.metrics.oee_pct ?? "—"}</td><td>${esc(ddmmhhmm(x.completed_at))}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(tx("Production Results"))}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#101828}
      h1{font-size:20px;margin:0}table{border-collapse:collapse;width:100%;margin-top:12px}th,td{border:1px solid #D0D5DD;padding:5px 7px;font-size:11px;text-align:left}th{background:#F2F4F7}.r{text-align:right}
      .k{display:flex;gap:18px;margin-top:10px;font-size:12px}</style></head><body><h1>${esc(tx("Production Results"))}</h1><div>${esc(range.from)} → ${esc(range.to)}</div>
      <div class="k"><b>${esc(tx("Total Production"))}: ${num(k.total)}</b><b>${esc(tx("Good Quantity"))}: ${num(k.good)}</b><b>${esc(tx("Reject Quantity"))}: ${num(k.reject)}</b>
      <b>Yield: ${k.yield ?? "—"}%</b><b>OEE: ${k.oee ?? "—"}%</b></div><table><tr><th>WO</th><th>PO</th><th>${esc(tx("Product"))}</th><th>${esc(tx("Machine"))}</th><th>${esc(tx("Planned Qty"))}</th>
      <th>${esc(tx("Good (PCS)"))}</th><th>${esc(tx("Reject (PCS)"))}</th><th>Yield %</th><th>OEE %</th><th>${esc(tx("Completed Time"))}</th></tr>${rows}</table>
      <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const grid = { borderColor: dark ? "#263244" : "#EEF2F6" };
  const cats = data.trend.map((t) => `${t.date.slice(8, 10)}/${t.date.slice(5, 7)}`);
  const activeFilters = Object.values(filter).filter(Boolean).length;
  const fill = { flex: 1, minHeight: 0 };
  const panel = { ...cardSx, display: "flex", flexDirection: "column", minHeight: { xs: 220, xl: 0 } };
  const emptyBody = <Box sx={{ flex: 1, display: "grid", placeItems: "center", pb: 2 }}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></Box>;
  const chartBase = {
    chart: { background: "transparent", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: '"Bai Jamjuree", sans-serif', parentHeightOffset: 0 },
    legend: { show: false }, dataLabels: { enabled: false }, tooltip: { theme: dark ? "dark" : "light" },
    grid: { ...grid, strokeDashArray: 3, padding: { top: -8, right: 8, bottom: -4, left: 4 } },
    xaxis: { labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: axisColor, fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: axisColor, fontSize: "10px" } } },
  };
  const reasonTotal = data.reject_reasons.reduce((a, [, n]) => a + n, 0);
  const reasonName = (r) => (r === "UNSPECIFIED" ? tx("UNSPECIFIED") : r);
  const tableSx = { "& td, & th": { fontSize: 11, px: 0.75, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800 } };
  const quick = [
    [tx("Production Log"), ListAltOutlinedIcon, () => (selectedId ? setDialog({ type: "log", id: selectedId }) : notify("info", tx("Select a work order in the list to open its production log."))), "#1570EF"],
    [tx("Quality Detail"), FactCheckOutlinedIcon, () => navigate("/quality-management/inspection-management"), "#7A5AF8"],
    [tx("Downtime Detail"), BuildCircleOutlinedIcon, () => navigate("/machine-equipment/downtime-management"), "#F04438"],
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: { lg: "calc(var(--app-vh, 100vh) - 74px)" }, minHeight: 0, "& > *": { flexShrink: 0 } }}>
        <PageMeta title={`${tx("Production Results")} | VCC Plastics`} description={tx("Production output, quality and performance by period")} />
        <PageBreadcrumb pageTitle={tx("Production Results")} />

        <Paper elevation={0} sx={{ ...cardSx, p: 0.75 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<FilterListIcon />} onClick={() => setShowFilter((v) => !v)}
              sx={{ ...toolBtnSx, ...(showFilter || activeFilters ? { borderColor: "primary.main", color: "primary.main" } : {}) }}>
              {tx("Filter")}{activeFilters ? ` (${activeFilters})` : ""}
            </Button>
            <TextField size="small" placeholder={tx("Search WO, order, product, machine, mold...")} value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 240 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
            <TextField size="small" type="date" label={tx("Date from")} value={range.from} onChange={(e) => { setPreset(""); setRange((r) => ({ ...r, from: e.target.value })); }} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 140 }} />
            <TextField size="small" type="date" label={tx("Date to")} value={range.to} onChange={(e) => { setPreset(""); setRange((r) => ({ ...r, to: e.target.value })); }} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 140 }} />
            {[["today", "Today"], ["yesterday", "Yesterday"], ["week", "This Week"], ["month", "This Month"]].map(([key, text]) => (
              <Button key={key} onClick={() => applyPreset(key)} sx={preset === key ? btn("primary") : toolBtnSx}>{tx(text)}</Button>
            ))}
            <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!tabItems.length} onClick={exportCsv} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<PrintOutlinedIcon />} onClick={printReport} sx={toolBtnSx}>{tx("Print")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
              label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {showFilter ? (
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center", mt: 0.75 }}>
              {[["machine_id", tx("Machine"), lookups.machines.map((m) => [m.id, m.equipment_code])], ["product_id", tx("Product"), lookups.products.map((x) => [x.id, `${x.product_code} — ${x.product_name}`])],
                ["customer_id", tx("Customer"), lookups.customers.map((c) => [c.id, c.short_name || c.customer_name])], ["shift_id", tx("Shift"), lookups.shifts.map((s) => [s.id, `${s.shift_code} · ${s.shift_name}`])]].map(([key, text, options]) => (
                <FormControl key={key} size="small" sx={{ minWidth: 150, flex: "1 1 150px" }}><InputLabel>{text}</InputLabel>
                  <Select label={text} value={filter[key]} onChange={(e) => setFilter((f) => ({ ...f, [key]: e.target.value }))}>
                    <MenuItem value="">{tx("All")}</MenuItem>{options.map(([v, n]) => <MenuItem key={v} value={v}>{n}</MenuItem>)}
                  </Select></FormControl>
              ))}
              <Button onClick={() => { setFilter(EMPTY_FILTER); setSearch(""); }} sx={btn("cancel")}>{tx("Clear")}</Button>
            </Stack>
          ) : null}
          {loading ? <LinearProgress sx={{ mt: 0.5, height: 2 }} /> : null}
        </Paper>

        <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
          <KpiTile tone="primary" title={tx("Total Production")} value={num(k.total)} unit="pcs" sub={delta(k.total, p.total)} icon={WarehouseOutlinedIcon} />
          <KpiTile tone="success" title={tx("Good Quantity")} value={num(k.good)} unit="pcs" sub={delta(k.good, p.good)} icon={InsightsOutlinedIcon} />
          <KpiTile tone="danger" title={tx("Reject Quantity")} value={num(k.reject)} unit="pcs" sub={delta(k.reject, p.reject)} icon={ReportGmailerrorredOutlinedIcon} />
          <KpiTile tone="accent" title={tx("Yield (Good Rate)")} value={k.yield != null ? num(k.yield, 2) : EMPTY} unit={k.yield != null ? "%" : ""} sub={delta(k.yield, p.yield, 2, "%")} icon={PercentOutlinedIcon} />
          <KpiTile tone="warning" title={tx("Scrap Rate")} value={k.scrap != null ? num(k.scrap, 2) : EMPTY} unit={k.scrap != null ? "%" : ""} sub={delta(k.scrap, p.scrap, 2, "%")} icon={DeleteSweepOutlinedIcon} />
          <KpiTile tone="info" title={tx("OEE (Average)")} value={k.oee != null ? num(k.oee, 1) : EMPTY} unit={k.oee != null ? "%" : ""} icon={SpeedOutlinedIcon} />
          <KpiTile tone="primary" title={tx("Avg Cycle Time")} value={k.avg_cycle != null ? num(k.avg_cycle, 1) : EMPTY} unit={k.avg_cycle != null ? "s" : ""} sub={delta(k.avg_cycle, p.avg_cycle, 1, " s")} icon={TimerOutlinedIcon} />
        </KpiCardGroup>

        {/* One grid: 4 work columns + a 360px summary column. Results table over the analysis row; quick actions bottom-right */}
        <Box sx={{ flex: "1 1 0", minHeight: { xs: 900, lg: 0 }, display: "grid", gap: 1,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "repeat(4, minmax(0,1fr)) 360px" }, gridTemplateRows: { xl: "minmax(0,1fr) 214px" } }}>
          <Paper elevation={0} sx={{ ...panel, gridColumn: { md: "1 / -1", xl: "1 / span 4" } }}>
            <Head title={tx("Production Results by Work Order")} action={<Tooltip title={tx("Period totals come from the production log; the list shows each work order's totals.")}><InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} /></Tooltip>} />
            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ flexShrink: 0, minHeight: 29, px: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 29, textTransform: "none", fontWeight: 700, fontSize: 11.5 } }}>
              {[["ALL", "All"], ["COMPLETED", "Completed"], ["IN_PROGRESS", "In Progress"], ["CANCELLED", "Cancelled"]].map(([key, text]) => <Tab key={key} value={key} label={`${tx(text)} (${counts[key]})`} />)}
            </Tabs>
            <Box sx={{ p: 1, flex: 1, minHeight: { xs: 320, lg: 0 } }}>
              <AgGridTable rowData={tabItems} columnDefs={columns} height="100%" rowHeight={27} getRowId={(r) => String(r.data.id)} onRowClicked={(e) => setSelectedId(e.data.id)}
                onRowDoubleClicked={(e) => navigate(`/production-management/work-orders/management?wo=${e.data.id}`)}
                getRowStyle={(r) => (r.data.id === selectedId ? { background: dark ? "rgba(46,144,250,.16)" : "#EFF8FF" } : null)} />
            </Box>
          </Paper>

          <Stack spacing={1} sx={{ minHeight: 0, gridColumn: { xl: 5 }, gridRow: { xl: 1 } }}>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Production Summary by Product")} />
              <Stack spacing={1} sx={{ ...fill, px: 1.5, pb: 1, overflow: "auto" }}>
                {data.products.length === 0 ? emptyBody : data.products.map((x) => (
                  <Box key={x.product_id} sx={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 1.25, alignItems: "center" }}>
                    <Box sx={{ height: 48, borderRadius: 1.5, display: "grid", placeItems: "center", border: 1, borderColor: "divider", overflow: "hidden", background: x.product_image ? "transparent" : "radial-gradient(circle at 30% 25%, #1570EF33, #1570EF0D 60%, transparent 75%)" }}>
                      {x.product_image ? <Box component="img" src={resolveImageUrl(x.product_image)} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ViewInArOutlinedIcon sx={{ fontSize: 22, color: "#1570EF" }} />}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
                        <Typography variant="caption" fontWeight={800} noWrap title={x.product_name}>{x.product_name} <Typography component="span" variant="caption" color="text.secondary">· {x.work_orders} WO</Typography></Typography>
                        <Typography variant="caption" fontWeight={800} sx={{ color: "#039855" }}>{x.yield != null ? `${num(x.yield, 2)}%` : EMPTY}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{tx("Planned")} <b>{num(x.planned)}</b> · {tx("Good")} <b>{num(x.good)}</b> · {tx("Reject")} <b>{num(x.reject)}</b></Typography>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${Math.min(x.completion || 0, 100)}%`, height: "100%", bgcolor: "#12B76A" }} /></Box>
                        <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}>{num(x.completion, 0)}%</Typography>
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, flexShrink: 0 }}>
              <Head title={tx("Quality Summary")} />
              <Box title={tx("Rework = NG pieces with the Rework disposition in NG Management.")} sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0.75, px: 1.25, pb: 1.25 }}>
                {[["PPM", data.quality.ppm != null ? num(data.quality.ppm) : EMPTY, VerifiedOutlinedIcon, "#1570EF"],
                  ["FPY", data.quality.fpy != null ? `${num(data.quality.fpy, 1)}%` : EMPTY, FactCheckOutlinedIcon, "#12B76A"],
                  [tx("Rework Qty"), num(data.quality.rework), AutorenewOutlinedIcon, "#F79009"],
                  [tx("Scrap Qty"), num(data.quality.scrap), DeleteSweepOutlinedIcon, "#F04438"]].map(([t, v, Icon, color]) => (
                  <Box key={t} onClick={() => navigate("/quality-management/dashboard")} sx={{ textAlign: "center", border: 1, borderColor: "divider", borderRadius: 1.5, px: 0.25, py: 0.6, cursor: "pointer", minWidth: 0, "&:hover": { bgcolor: "action.hover" } }}>
                    <Icon sx={{ color, fontSize: 16 }} />
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", fontSize: 10 }}>{t}</Typography>
                    <Typography fontWeight={800} sx={{ fontSize: 15, lineHeight: 1.3 }}>{v}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Stack>

          <Paper elevation={0} sx={panel}>
            <Head title={tx("Production Trend")} subtitle="(pcs)" />
            <Box sx={{ ...fill, px: 0.5 }}>
              <Chart type="line" height="100%" series={[{ name: tx("Good"), type: "column", data: data.trend.map((t) => t.good) }, { name: tx("Reject"), type: "column", data: data.trend.map((t) => t.reject) },
                { name: "Yield (%)", type: "line", data: data.trend.map((t) => t.yield) }]}
                options={{ ...chartBase, colors: ["#12B76A", "#F04438", "#1570EF"], stroke: { width: [0, 0, 2], curve: "straight" }, markers: { size: [0, 0, 2.5], strokeWidth: 0 },
                  plotOptions: { bar: { columnWidth: "55%", borderRadius: 2 } }, xaxis: { ...chartBase.xaxis, categories: cats },
                  yaxis: [{ seriesName: tx("Good"), min: 0, forceNiceScale: true, labels: { ...chartBase.yaxis.labels, formatter: (v) => num(v) } }, { seriesName: tx("Good"), show: false },
                    { opposite: true, min: 0, max: 100, tickAmount: 4, labels: { ...chartBase.yaxis.labels, formatter: (v) => `${num(v, 0)}%` } }],
                  tooltip: { ...chartBase.tooltip, shared: true } }} />
            </Box>
            <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center", pb: 0.75 }}><Dot color="#12B76A" text={tx("Good")} /><Dot color="#F04438" text={tx("Reject")} /><Dot color="#1570EF" text="Yield (%)" /></Stack>
          </Paper>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Reject Rate by Reason")} />
            {reasonTotal ? (
              <Box sx={{ ...fill, display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", alignItems: "center", gap: 1, pl: 0.5, pr: 1.5 }}>
                <Chart type="donut" height={128} series={data.reject_reasons.map(([, n]) => n)} options={{
                  chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: data.reject_reasons.map(([r]) => reasonName(r)),
                  colors: data.reject_reasons.map((_, i) => REASON_COLORS[i % REASON_COLORS.length]), legend: { show: false }, dataLabels: { enabled: false },
                  stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
                  plotOptions: { pie: { donut: { size: "76%", labels: { show: true, total: { show: true, label: tx("Total (pcs)"), color: axisColor, fontSize: "10px", formatter: () => num(reasonTotal) }, name: { fontSize: "10px", offsetY: -2 }, value: { fontSize: "18px", fontWeight: 800, offsetY: 2, color: dark ? "#F3F4F6" : "#172033" } } } } },
                }} />
                <Stack spacing={0.7} sx={{ minWidth: 0, maxHeight: 150, overflow: "auto" }}>
                  {data.reject_reasons.map(([r, n], i) => (
                    <Box key={r} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", columnGap: 1, alignItems: "center" }}>
                      <Box sx={{ minWidth: 0, overflow: "hidden", "& .MuiTypography-root": { fontSize: 11, whiteSpace: "nowrap" } }}><Dot color={REASON_COLORS[i % REASON_COLORS.length]} text={reasonName(r)} /></Box>
                      <Typography variant="caption" sx={{ fontSize: 11, whiteSpace: "nowrap" }}><b>{num(n)}</b> <Box component="span" sx={{ color: "text.secondary" }}>· {num((n / reasonTotal) * 100, 0)}%</Box></Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ) : emptyBody}
          </Paper>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Top Machines by Performance")} />
            <Box sx={{ ...fill, px: 1, pb: 1, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={tableSx}>
                <TableHead><TableRow><TableCell>{tx("Machine")}</TableCell><TableCell align="right">{tx("Good")}</TableCell><TableCell align="right">{tx("Reject")}</TableCell><TableCell>OEE</TableCell><TableCell align="right">Yield</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.machines.length === 0 ? <TableRow><TableCell colSpan={5}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></TableCell></TableRow> : data.machines.map((m) => (
                    <TableRow key={m.machine_id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/machine-equipment/machine-detail?machine=${m.machine_id}`)}>
                      <TableCell sx={{ fontWeight: 800, color: "#1570EF" }} title={m.model}>{m.machine_code}</TableCell>
                      <TableCell align="right">{num(m.good)}</TableCell><TableCell align="right">{num(m.reject)}</TableCell>
                      <TableCell><Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Typography variant="caption" sx={{ width: 32 }}>{m.oee != null ? `${num(m.oee, 0)}%` : EMPTY}</Typography>
                        <Box sx={{ width: 32, height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${m.oee || 0}%`, height: "100%", bgcolor: (m.oee || 0) >= 85 ? "#12B76A" : (m.oee || 0) >= 65 ? "#F79009" : "#F04438" }} /></Box></Stack></TableCell>
                      <TableCell align="right">{m.yield != null ? `${num(m.yield, 1)}%` : EMPTY}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Production by Shift")} />
            <Box sx={{ ...fill, px: 1, pb: 1, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={tableSx}>
                <TableHead><TableRow><TableCell>{tx("Shift")}</TableCell><TableCell align="right">{tx("Planned")}</TableCell><TableCell align="right">{tx("Good")}</TableCell><TableCell align="right">{tx("Reject")}</TableCell><TableCell align="right">Yield</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.shifts.map((s) => (
                    <TableRow key={s.shift_id} hover sx={{ cursor: "pointer" }} onClick={() => { setFilter((f) => ({ ...f, shift_id: s.shift_id })); setShowFilter(true); }}>
                      <TableCell sx={{ fontWeight: 700, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis" }} title={`${s.shift_name} (${s.start} ~ ${s.end})`}>{s.shift_name}</TableCell><TableCell align="right">{num(s.planned)}</TableCell>
                      <TableCell align="right">{num(s.good)}</TableCell><TableCell align="right">{num(s.reject)}</TableCell>
                      <TableCell align="right">{s.yield != null ? `${num(s.yield, 1)}%` : EMPTY}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={{ ...panel, gridColumn: { xl: 5 }, gridRow: { xl: 2 } }}>
            <Head title={tx("Quick Actions")} action={<Typography variant="caption" color="text.secondary" noWrap>{tx("Selected")}: <b>{items.find((w) => w.id === selectedId)?.wo_no || EMPTY}</b></Typography>} />
            <QuickActions columns={2} sx={{ ...fill, pb: 1 }}>
              {quick.map(([text, Icon, onClick, color]) => <QuickAction key={text} icon={Icon} text={text} color={color} onClick={onClick} />)}
            </QuickActions>
          </Paper>
        </Box>

        <SystemStatusBar system={data.system} />

        {dialog?.type === "log" && <ProductionLogDialog api={EXEC_API} request={request} woId={dialog.id} notify={notify} onClose={() => setDialog(null)} />}
        <Snackbar open={msg.open} autoHideDuration={5000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

