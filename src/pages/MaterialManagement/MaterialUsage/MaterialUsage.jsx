import "./locales";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar,
  Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, ThemeProvider as MuiThemeProvider, Typography,
Tooltip, } from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BalanceOutlinedIcon from "@mui/icons-material/BalanceOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EcoOutlinedIcon from "@mui/icons-material/EnergySavingsLeafOutlined";
import FilterListIcon from "@mui/icons-material/FilterList";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ScaleOutlinedIcon from "@mui/icons-material/ScaleOutlined";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { Dot, EMPTY, Head, QuickAction, QuickActions, btn, cardSx, ddmmhhmm, num, pageTheme, person } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, localeTag, setActiveLanguage, tx } from "../materialLocales";
import { colShares, fitColumns, CATEGORY_COLORS, KpiTile, downloadExcel, qty, tons, useRequest } from "../materialUi";
import { UsagePill, WorkOrderUsageDialog, diffColor, signed } from "./UsageDialogs";

const API = `${API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "")}/api/material-usage`;
const EMPTY_FILTER = { work_order_id: "", category: "", material_id: "", machine_id: "" };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };

export default function MaterialUsage() {
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
  const gridRef = useRef(null);

  const [lookups, setLookups] = useState(null);
  const [period, setPeriod] = useState({ from: daysAgo(6), to: daysAgo(0) });
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [statusFilter, setStatusFilter] = useState("");
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
    const wo = Number(params.get("wo"));
    if (wo) setDialog({ type: "wo", id: wo });
  }, [params]);

  const tolerance = data?.settings?.["material.usage_tolerance_pct"] ?? 3;
  const lines = useMemo(() => (data?.lines || []).filter((l) => !statusFilter || l.status === statusFilter), [data, statusFilter]);
  const columns = useMemo(() => fitColumns([
    { headerName: tx("Work Order"), field: "wo_no", width: 110, pinned: "left", cellStyle: { fontWeight: 700 } },
    { headerName: tx("Material"), field: "material_code", width: 86 },
    { headerName: tx("Unit"), field: "unit", width: 52 },
    { headerName: tx("Standard"), field: "standard_qty", width: 72, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Actual"), field: "actual_qty", width: 72, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Difference"), field: "diff_qty", width: 76, type: "numericColumn", valueFormatter: (p) => (p.data.status === "PENDING" ? EMPTY : signed(p.value)),
      cellStyle: (p) => ({ color: p.data.status === "PENDING" ? undefined : diffColor(p.value), fontWeight: 700 }) },
    { headerName: tx("Difference (%)"), field: "diff_pct", width: 96, type: "numericColumn",
      valueFormatter: (p) => (p.data.status === "PENDING" || p.value == null ? EMPTY : `${signed(p.value, 2)}%`),
      cellStyle: (p) => ({ color: p.data.status === "PENDING" ? undefined : diffColor(p.value) }) },
    { headerName: tx("Usage Rate"), field: "usage_rate", width: 96, type: "numericColumn", valueFormatter: (p) => (p.data.status === "PENDING" || p.value == null ? EMPTY : `${num(p.value, 2)}%`) },
    { headerName: tx("Group"), colId: "category", width: 96, valueGetter: (p) => label("category", p.data.category) },
    { headerName: tx("Product"), field: "product_name", width: 100, flex: 1.4, tooltipField: "product_name" },
    { headerName: tx("Status"), field: "status", width: 112, pinned: "right", cellRenderer: (p) => <UsagePill value={p.value} /> },
  ]), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const v = data.variance;
  const categories = Object.entries(data.by_category).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
  const catTotal = categories.reduce((a, [, value]) => a + value, 0);
  const selectSx = { minWidth: 150, flex: "1 1 150px" };
  const showStatus = (status) => { setStatusFilter(status); if (status) setShowFilter(true); gridRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); };
  const exportLines = () => downloadExcel(`material-usage-${period.from}_${period.to}.csv`,
    ["Work Order", "Product", "Material", "Group", "Unit", "Standard", "Actual", "Difference", "Difference %", "Usage rate %", "Status"],
    lines.map((l) => [l.wo_no, l.product_name, l.material_code, l.category, l.unit, l.standard_qty, l.actual_qty, l.diff_qty, l.diff_pct, l.usage_rate, l.status]));
  const exportRecords = () => downloadExcel(`material-usage-records-${period.from}_${period.to}.csv`,
    ["Time", "Usage No", "Work Order", "Material", "Lot", "Quantity", "Unit", "Source", "Machine", "Operator", "Remark"],
    data.recent.map((u) => [u.used_at, u.usage_no, u.wo_no, u.material_code, u.lot_no, u.qty, u.unit, u.source, u.machine_code, u.actor, u.remark]));
  const quick = [
    [tx("Material Status"), ViewInArOutlinedIcon, "#12B76A", () => navigate("/material-management/status")],
    [tx("Material Requirement"), CalculateOutlinedIcon, "#F79009", () => navigate("/material-management/requirement")],
    [tx("Material Allocation"), AddTaskOutlinedIcon, "#1570EF", () => navigate("/material-management/allocation")],
    [tx("Lot History"), HistoryOutlinedIcon, "#7A5AF8", () => navigate("/material-management/lot-history")],
  ];
  const activeFilters = Object.values(filter).filter(Boolean).length + (statusFilter ? 1 : 0);
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const fill = { flex: 1, minHeight: 0 };
  const panel = { ...cardSx, display: "flex", flexDirection: "column", minHeight: { xs: 220, xl: 0 } };
  const emptyBody = <Box sx={{ flex: 1, display: "grid", placeItems: "center", pb: 2 }}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></Box>;
  const tableSx = { "& td, & th": { fontSize: 11, px: 0.75, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800 } };
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const chartBase = {
    chart: { background: "transparent", toolbar: { show: false }, zoom: { enabled: false }, fontFamily: '"Bai Jamjuree", sans-serif', parentHeightOffset: 0 },
    legend: { show: false }, dataLabels: { enabled: false }, tooltip: { theme: dark ? "dark" : "light" },
    grid: { borderColor: dark ? "#263244" : "#EEF2F6", strokeDashArray: 3, padding: { top: -8, right: 8, bottom: -4, left: 4 } },
    xaxis: { labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: axisColor, fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: axisColor, fontSize: "10px" } } },
  };
  const varianceRows = [
    [tx("Over Standard"), `${signed(v.over_pct, 2)}%`, tx("Total over"), `${num(v.over_qty, 3)} kg`, tx("{n} work orders", { n: v.over_wo }), "#F04438", WarningAmberOutlinedIcon, "OVER"],
    [tx("Saving"), `${num(v.saving_pct, 2)}%`, tx("Total saving"), `${num(v.saving_qty, 3)} kg`, tx("{n} work orders", { n: v.saving_wo }), "#12B76A", EcoOutlinedIcon, "SAVING"],
    [tx("Total difference"), `${signed(v.diff_qty)} kg`, tx("Rate"), `${signed(v.diff_pct, 2)}%`, "", "#2E90FA", BalanceOutlinedIcon, ""],
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      {/* One screen on lg+: toolbar · KPI · 3-column grid (lines ×2 | trend + group mix / top | variance | recent + quick actions bottom-right) */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: { lg: "calc(var(--app-vh, 100vh) - 74px)" }, minHeight: 0, "& > *": { flexShrink: 0 } }}>
        <PageMeta title={`${tx("Material Usage")} | VCC Plastics`} description={tx("Track and analyse material consumption in real time")} />
        <PageBreadcrumb pageTitle={tx("Material Usage")} />

        <Paper elevation={0} sx={{ ...cardSx, p: 0.75 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <Button startIcon={<FilterListIcon />} onClick={() => setShowFilter((x) => !x)}
              sx={{ ...toolBtnSx, ...(showFilter || activeFilters ? { borderColor: "primary.main", color: "primary.main" } : {}) }}>
              {tx("Filter")}{activeFilters ? ` (${activeFilters})` : ""}
            </Button>
            <TextField size="small" type="date" label={tx("Period from")} value={period.from} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 140 }} />
            <TextField size="small" type="date" label={tx("Period to")} value={period.to} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 140 }} />
            <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!lines.length} onClick={exportLines} sx={toolBtnSx}>{tx("Usage Report")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {showFilter ? (
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center", mt: 0.75 }}>
              {[["work_order_id", tx("Work Order"), lookups.work_orders.map((w) => [w.id, w.wo_no])],
                ["category", tx("Group"), lookups.categories.map((c) => [c, label("category", c)])],
                ["material_id", tx("Material"), lookups.materials.map((m) => [m.id, m.material_code])],
                ["machine_id", tx("Machine / Area"), lookups.machines.map((m) => [m.id, m.equipment_code])]].map(([key, text, options]) => (
                <FormControl key={key} size="small" sx={selectSx}><InputLabel>{text}</InputLabel>
                  <Select label={text} value={filter[key]} onChange={(e) => setFilter((f) => ({ ...f, [key]: e.target.value }))}>
                    <MenuItem value="">{tx("All")}</MenuItem>{options.map(([val, n]) => <MenuItem key={val} value={val}>{n}</MenuItem>)}
                  </Select></FormControl>
              ))}
              <FormControl size="small" sx={selectSx}><InputLabel>{tx("Status")}</InputLabel>
                <Select label={tx("Status")} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="">{tx("All")}</MenuItem>{["OVER", "WITHIN", "SAVING", "PENDING"].map((s) => <MenuItem key={s} value={s}>{label("usageStatus", s)}</MenuItem>)}
                </Select></FormControl>
              <Button onClick={() => { setFilter(EMPTY_FILTER); setStatusFilter(""); }} sx={btn("cancel")}>{tx("Clear")}</Button>
            </Stack>
          ) : null}
          {loading ? <LinearProgress sx={{ mt: 0.5, height: 2 }} /> : null}
        </Paper>

        <KpiCardGroup>
          <KpiTile tone="primary" title={tx("Total Consumption")} value={tons(k.consumed, 3)} unit={tx("tons")} sub={`${k.work_orders} ${tx("work orders")}`} icon={ScaleOutlinedIcon} />
          <KpiTile tone="success" title={tx("Standard Usage")} value={tons(k.standard, 3)} unit={tx("tons")} icon={LayersOutlinedIcon} />
          <KpiTile tone="warning" title={tx("Actual Usage")} value={tons(k.actual, 3)} unit={tx("tons")} icon={InsightsOutlinedIcon} />
          <KpiTile tone="accent" title={tx("Usage Difference")} value={`${k.diff > 0 ? "+" : ""}${tons(k.diff, 3)}`} unit={tx("tons")} icon={BalanceOutlinedIcon} />
          <KpiTile tone="danger" title={tx("Over Standard")} value={signed(k.over_pct, 2)} unit="%" sub={tx("Tolerance ±{n}%", { n: num(tolerance, 1) })} icon={PercentOutlinedIcon} onClick={() => showStatus("OVER")} />
          <KpiTile tone="info" title={tx("Completed WOs")} value={num(k.completed_wo)} unit={tx("work orders")} icon={AssignmentTurnedInOutlinedIcon} />
        </KpiCardGroup>

        {/* One 3-column grid so every card edge lines up; quick actions in the bottom-right corner */}
        <Box sx={{ flex: { lg: "1 1 0" }, minHeight: 0, display: "grid", gap: 1,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "repeat(3, minmax(0,1fr))" }, gridTemplateRows: { xl: "minmax(0,1.25fr) minmax(0,1fr)" } }}>
          <Paper elevation={0} sx={{ ...panel, gridColumn: { lg: "1 / -1", xl: "1 / span 2" } }} ref={gridRef}>
            <Head title={tx("Material Usage by Work Order")} subtitle={`(${lines.length})`}
              action={<Tooltip title={tx("Standard = BOM × (good + reject). Status uses tolerance ±{n}%.", { n: num(tolerance, 1) })}><InfoOutlinedIcon sx={{ fontSize: 16, color: "text.secondary", cursor: "help" }} /></Tooltip>} />
            <Box sx={{ ...fill, px: 1, pb: 1, minHeight: { xs: 320, xl: 0 } }}>
              <AgGridTable rowData={lines} columnDefs={columns} height="100%" rowHeight={27} getRowId={(p) => p.data.key} onRowClicked={(e) => setDialog({ type: "wo", id: e.data.work_order_id })} />
            </Box>
          </Paper>
          <Stack spacing={1} sx={{ minHeight: 0 }}>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Usage Trend")} subtitle="(KG)" />
              <Box sx={{ ...fill, px: 0.5 }}>
                <Chart type="line" height="100%" series={[
                  { name: tx("Standard"), data: data.trend.map((t) => t.standard) },
                  { name: tx("Actual"), data: data.trend.map((t) => t.actual) },
                  { name: tx("Difference"), data: data.trend.map((t) => t.diff) },
                ]} options={{ ...chartBase, colors: ["#1570EF", "#12B76A", "#F79009"], stroke: { width: 2, curve: "straight" }, markers: { size: 2.5, strokeWidth: 0 },
                  xaxis: { ...chartBase.xaxis, categories: data.trend.map((t) => t.date.slice(8, 10) + "/" + t.date.slice(5, 7)) },
                  yaxis: { ...chartBase.yaxis, forceNiceScale: true, labels: { ...chartBase.yaxis.labels, formatter: (val) => num(val, 1) } },
                  tooltip: { ...chartBase.tooltip, y: { formatter: (val) => `${num(val, 3)} kg` } } }} />
              </Box>
              <Stack direction="row" spacing={1.5} sx={{ justifyContent: "center", pb: 0.75 }}><Dot color="#1570EF" text={tx("Standard")} /><Dot color="#12B76A" text={tx("Actual")} /><Dot color="#F79009" text={tx("Difference")} /></Stack>
            </Paper>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Usage Distribution by Group")} />
              {categories.length === 0 ? emptyBody : (
                <Box sx={{ ...fill, display: "grid", gridTemplateColumns: "120px minmax(0,1fr)", alignItems: "center", gap: 1, pl: 0.5, pr: 1.5 }}>
                  <Chart type="donut" height={124} series={categories.map(([, value]) => Number(value.toFixed(3)))} options={{
                    chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: categories.map(([c]) => label("category", c)),
                    colors: categories.map(([c]) => CATEGORY_COLORS[c]), legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] },
                    tooltip: { theme: dark ? "dark" : "light", y: { formatter: (val) => `${num(val, 3)} kg` } },
                    plotOptions: { pie: { donut: { size: "76%", labels: { show: true, total: { show: true, label: tx("tons"), fontSize: "10px", color: axisColor, formatter: () => tons(catTotal, 3) }, name: { fontSize: "10px", offsetY: -2 }, value: { fontSize: "17px", fontWeight: 800, offsetY: 2, color: dark ? "#F3F4F6" : "#172033" } } } } },
                  }} />
                  <Stack spacing={0.7} sx={{ minWidth: 0 }}>
                    {categories.map(([c, value]) => (
                      <Box key={c} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", columnGap: 1, alignItems: "center" }}>
                        <Box sx={{ minWidth: 0, overflow: "hidden", "& .MuiTypography-root": { fontSize: 11, whiteSpace: "nowrap" } }}><Dot color={CATEGORY_COLORS[c]} text={label("category", c)} /></Box>
                        <Typography variant="caption" sx={{ fontSize: 11, whiteSpace: "nowrap" }}><b>{num(value, 1)} kg</b> <Box component="span" sx={{ color: "text.secondary" }}>· {num((value / catTotal) * 100, 0)}%</Box></Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Stack>

          <Paper elevation={0} sx={panel}>
            <Head title={tx("Top Material Consumption")} subtitle="(KG)" />
            {data.top_materials.length === 0 ? emptyBody : (
              <Stack spacing={1} sx={{ ...fill, px: 1.5, pb: 1, overflow: "auto" }}>
                {data.top_materials.map((m) => (
                  <Box key={m.material_id}>
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", mb: 0.3 }}>
                      <Typography variant="caption" noWrap title={m.material_name} sx={{ minWidth: 0 }}><b>{m.material_code}</b> · {m.material_name}</Typography>
                      <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}><b>{num(m.qty, 3)}</b> <Box component="span" sx={{ color: "text.secondary" }}>· {num(m.ratio, 1)}%</Box></Typography>
                    </Stack>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${m.ratio}%`, height: "100%", borderRadius: 3, bgcolor: "#12B76A" }} /></Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
          <Paper elevation={0} sx={panel}>
            <Head title={tx("Usage Variance Analysis")} action={<Button size="small" startIcon={<ReportProblemOutlinedIcon sx={{ fontSize: "16px !important" }} />} onClick={() => showStatus("OVER")} sx={{ textTransform: "none", py: 0 }}>{tx("Show large variances")}</Button>} />
            <Stack sx={{ ...fill, px: 1.5, pb: 1, gap: 0.75, justifyContent: "space-evenly", overflow: "auto" }}>
              {varianceRows.map(([title, value, subTitle, subValue, count, color, Icon, status]) => (
                <Box key={title} onClick={() => showStatus(status)} sx={{ display: "grid", gridTemplateColumns: "30px minmax(0,1fr) minmax(0,1fr) 16px", gap: 1.25, alignItems: "center", px: 1.25, py: 0.75,
                  borderRadius: 1.5, border: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: `${color}1A`, color }}><Icon sx={{ fontSize: 16 }} /></Box>
                  <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{title}</Typography><Typography fontWeight={800} sx={{ color, fontSize: 15, lineHeight: 1.3 }}>{value}</Typography></Box>
                  <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{subTitle}</Typography>
                    <Typography variant="caption" fontWeight={800} noWrap sx={{ display: "block", fontSize: 12 }}>{subValue} <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>{count}</Box></Typography></Box>
                  <ChevronRightIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </Box>
              ))}
            </Stack>
          </Paper>
          <Stack spacing={1} sx={{ minHeight: 0 }}>
            <Paper elevation={0} sx={{ ...panel, flex: 1 }}>
              <Head title={tx("Recent Usage History")} action={<Tooltip title={tx("Export Data")}><span><Button size="small" disabled={!data.recent.length} onClick={exportRecords} sx={{ minWidth: 0, p: 0.25 }}><FileDownloadOutlinedIcon sx={{ fontSize: 17 }} /></Button></span></Tooltip>} />
              <Box sx={{ ...fill, px: 1, pb: 1, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={{ ...tableSx, ...colShares(17, 19, 12, 8, 11, 13, 20) }}>
                  <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell align="right" title={tx("Quantity")}>{tx("Qty (short)")}</TableCell><TableCell>{tx("Machine")}</TableCell><TableCell title={tx("Source")}>{tx("Source (short)")}</TableCell><TableCell title={tx("Operator")}>{tx("Operator (short)")}</TableCell></TableRow></TableHead>
                  <TableBody>
                    {data.recent.length === 0 ? <TableRow><TableCell colSpan={7}><Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography></TableCell></TableRow> : data.recent.map((u) => (
                      <TableRow key={u.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ type: "wo", id: u.work_order_id })}>
                        <TableCell>{ddmmhhmm(u.used_at)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{u.wo_no}</TableCell><TableCell>{u.material_code}</TableCell>
                        <TableCell align="right">{qty(u.qty, u.unit)}</TableCell><TableCell>{u.machine_code || EMPTY}</TableCell>
                        <TableCell sx={{ color: u.source === "CLOSE_OUT" ? "#F04438" : u.source === "MANUAL" ? "#F79009" : undefined }}>{label("usageSource", u.source)}</TableCell>
                        <TableCell title={person(u.actor_name, u.actor)}>{person(u.actor_name, u.actor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, flexShrink: 0 }}>
              <Head title={tx("Quick Actions")} />
              <QuickActions columns={4} sx={{ pb: 1.25 }}>
                {quick.map(([text, Icon, color, onClick]) => <QuickAction key={text} icon={Icon} text={text} color={color} onClick={onClick} />)}
              </QuickActions>
            </Paper>
          </Stack>
        </Box>

        {dialog?.type === "wo" && (
          <WorkOrderUsageDialog api={API} request={request} workOrderId={dialog.id} canEdit={canEdit} actor={actor} notify={notify}
            onClose={() => setDialog(null)} onChanged={() => load({ silent: true })} />
        )}
        <Snackbar open={msg.open} autoHideDuration={6000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}

