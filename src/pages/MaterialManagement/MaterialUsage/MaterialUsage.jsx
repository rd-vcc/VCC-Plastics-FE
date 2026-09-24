import "./locales";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar,
  Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, ThemeProvider as MuiThemeProvider, Typography,
} from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BalanceOutlinedIcon from "@mui/icons-material/BalanceOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import EcoOutlinedIcon from "@mui/icons-material/EnergySavingsLeafOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
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
import { Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, localeTag, setActiveLanguage, tx } from "../materialLocales";
import { CATEGORY_COLORS, KpiTile, downloadCsv, qty, tons, useRequest } from "../materialUi";
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
  const columns = useMemo(() => [
    { headerName: tx("Work Order"), field: "wo_no", width: 125, pinned: "left", cellStyle: { fontWeight: 700 } },
    { headerName: tx("Material"), field: "material_code", width: 125 },
    { headerName: tx("Unit"), field: "unit", width: 60 },
    { headerName: tx("Standard"), field: "standard_qty", width: 85, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Actual"), field: "actual_qty", width: 85, type: "numericColumn", valueFormatter: (p) => num(p.value, 3) },
    { headerName: tx("Difference"), field: "diff_qty", width: 90, type: "numericColumn", valueFormatter: (p) => (p.data.status === "PENDING" ? EMPTY : signed(p.value)),
      cellStyle: (p) => ({ color: p.data.status === "PENDING" ? undefined : diffColor(p.value), fontWeight: 700 }) },
    { headerName: tx("Difference (%)"), field: "diff_pct", width: 100, type: "numericColumn",
      valueFormatter: (p) => (p.data.status === "PENDING" || p.value == null ? EMPTY : `${signed(p.value, 2)}%`),
      cellStyle: (p) => ({ color: p.data.status === "PENDING" ? undefined : diffColor(p.value) }) },
    { headerName: tx("Usage Rate"), field: "usage_rate", width: 95, type: "numericColumn", valueFormatter: (p) => (p.data.status === "PENDING" || p.value == null ? EMPTY : `${num(p.value, 2)}%`) },
    { headerName: tx("Group"), colId: "category", width: 110, valueGetter: (p) => label("category", p.data.category) },
    { headerName: tx("Product"), field: "product_name", width: 135 },
    { headerName: tx("Status"), field: "status", width: 122, pinned: "right", cellRenderer: (p) => <UsagePill value={p.value} /> },
  ].map((c) => ({ filter: false, ...c })), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const v = data.variance;
  const categories = Object.entries(data.by_category).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
  const catTotal = categories.reduce((a, [, value]) => a + value, 0);
  const selectSx = { minWidth: 150, flex: "1 1 150px" };
  const showStatus = (status) => { setStatusFilter(status); gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const exportLines = () => downloadCsv(`material-usage-${period.from}_${period.to}.csv`,
    ["Work Order", "Product", "Material", "Group", "Unit", "Standard", "Actual", "Difference", "Difference %", "Usage rate %", "Status"],
    lines.map((l) => [l.wo_no, l.product_name, l.material_code, l.category, l.unit, l.standard_qty, l.actual_qty, l.diff_qty, l.diff_pct, l.usage_rate, l.status]));
  const exportRecords = () => downloadCsv(`material-usage-records-${period.from}_${period.to}.csv`,
    ["Time", "Usage No", "Work Order", "Material", "Lot", "Quantity", "Unit", "Source", "Machine", "Operator", "Remark"],
    data.recent.map((u) => [u.used_at, u.usage_no, u.wo_no, u.material_code, u.lot_no, u.qty, u.unit, u.source, u.machine_code, u.actor, u.remark]));
  const quick = [
    [tx("Material Status"), ViewInArOutlinedIcon, () => navigate("/material-management/status")],
    [tx("Material Requirement"), CalculateOutlinedIcon, () => navigate("/material-management/requirement")],
    [tx("Material Allocation"), AddTaskOutlinedIcon, () => navigate("/material-management/allocation")],
    [tx("Lot History"), HistoryOutlinedIcon, () => navigate("/material-management/lot-history")],
    [tx("Usage Report"), DescriptionOutlinedIcon, exportLines],
    [tx("Variance Analysis"), QueryStatsOutlinedIcon, () => showStatus("OVER")],
    [tx("Export Data"), FileDownloadOutlinedIcon, exportRecords],
  ];
  const tableSx = { "& td, & th": { fontSize: 11.5, px: 0.75, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800 } };
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const varianceRows = [
    [tx("Over Standard"), `${signed(v.over_pct, 2)}%`, tx("Total over"), `${num(v.over_qty, 3)} kg`, tx("{n} work orders", { n: v.over_wo }), "#F04438", WarningAmberOutlinedIcon, "OVER"],
    [tx("Saving"), `${num(v.saving_pct, 2)}%`, tx("Total saving"), `${num(v.saving_qty, 3)} kg`, tx("{n} work orders", { n: v.saving_wo }), "#12B76A", EcoOutlinedIcon, "SAVING"],
    [tx("Total difference"), `${signed(v.diff_qty)} kg`, tx("Rate"), `${signed(v.diff_pct, 2)}%`, "", "#2E90FA", BalanceOutlinedIcon, ""],
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box>
        <PageMeta title={`${tx("Material Usage")} | VCC Plastics`} description={tx("Track and analyse material consumption in real time")} />
        <PageBreadcrumb pageTitle={tx("Material Usage")} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr auto" }, gap: 1.5, alignItems: "center", mb: 1.5 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{tx("Material Usage")}</Typography>
            <Typography variant="body2" color="text.secondary">{tx("Track and analyse material consumption in real time")}</Typography>
          </Box>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
            <TextField size="small" type="date" label={tx("Period from")} value={period.from} onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <TextField size="small" type="date" label={tx("Period to")} value={period.to} onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />} label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={btn("cancel")}>{tx("Refresh")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!lines.length} onClick={exportLines} sx={btn("primary")}>{tx("Usage Report")}</Button>
          </Stack>
        </Box>
        {loading ? <LinearProgress sx={{ mb: 1 }} /> : null}

        <KpiCardGroup sx={{ mb: 1.5 }}>
          <KpiTile tone="primary" title={tx("Total Consumption")} value={tons(k.consumed, 3)} unit={tx("tons")} sub={`${k.work_orders} ${tx("work orders")}`} icon={ScaleOutlinedIcon} />
          <KpiTile tone="success" title={tx("Standard Usage")} value={tons(k.standard, 3)} unit={tx("tons")} icon={LayersOutlinedIcon} />
          <KpiTile tone="warning" title={tx("Actual Usage")} value={tons(k.actual, 3)} unit={tx("tons")} icon={InsightsOutlinedIcon} />
          <KpiTile tone="accent" title={tx("Usage Difference")} value={`${k.diff > 0 ? "+" : ""}${tons(k.diff, 3)}`} unit={tx("tons")} icon={BalanceOutlinedIcon} />
          <KpiTile tone="danger" title={tx("Over Standard")} value={signed(k.over_pct, 2)} unit="%" sub={tx("Tolerance ±{n}%", { n: num(tolerance, 1) })} icon={PercentOutlinedIcon} onClick={() => showStatus("OVER")} />
          <KpiTile tone="info" title={tx("Completed WOs")} value={num(k.completed_wo)} unit={tx("work orders")} icon={AssignmentTurnedInOutlinedIcon} />
        </KpiCardGroup>

        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
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
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
          </Stack>
        </Paper>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.9fr) minmax(0,1fr)" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx} ref={gridRef}>
            <Head title={tx("Material Usage by Work Order")} subtitle={`(${lines.length})`} />
            <Box sx={{ px: 1, pb: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>{tx("Standard = BOM × (good + reject). Status uses tolerance ±{n}%.", { n: num(tolerance, 1) })}</Typography>
              <AgGridTable rowData={lines} columnDefs={columns} height={430} rowHeight={32} getRowId={(p) => p.data.key} onRowClicked={(e) => setDialog({ type: "wo", id: e.data.work_order_id })} />
            </Box>
          </Paper>
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Usage Trend")} subtitle="(KG)" />
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Chart type="line" height={215} series={[
                  { name: tx("Standard"), data: data.trend.map((t) => t.standard) },
                  { name: tx("Actual"), data: data.trend.map((t) => t.actual) },
                  { name: tx("Difference"), data: data.trend.map((t) => t.diff) },
                ]} options={{
                  chart: { background: "transparent", toolbar: { show: false }, fontFamily: '"Bai Jamjuree", sans-serif' },
                  colors: ["#1570EF", "#12B76A", "#F79009"], stroke: { width: [2.5, 2.5, 2], curve: "smooth" }, markers: { size: 3 },
                  xaxis: { categories: data.trend.map((t) => t.date.slice(8, 10) + "/" + t.date.slice(5, 7)), labels: { style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: { labels: { style: { colors: axisColor }, formatter: (val) => num(val, 1) } },
                  legend: { position: "top", horizontalAlign: "left", labels: { colors: axisColor } }, grid: { borderColor: dark ? "#263244" : "#EEF2F6" },
                  tooltip: { theme: dark ? "dark" : "light", y: { formatter: (val) => `${num(val, 3)} kg` } },
                }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, flex: 1 }}>
              <Head title={tx("Usage Distribution by Group")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.3fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Chart type="donut" height={170} series={categories.length ? categories.map(([, value]) => Number(value.toFixed(3))) : [1]} options={{
                    chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' },
                    labels: categories.length ? categories.map(([c]) => label("category", c)) : [tx("No data.")],
                    colors: categories.length ? categories.map(([c]) => CATEGORY_COLORS[c]) : [dark ? "#344054" : "#EAECF0"],
                    legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] },
                    tooltip: { enabled: categories.length > 0, theme: dark ? "dark" : "light", y: { formatter: (val) => `${num(val, 3)} kg` } },
                    plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: tx("tons"), color: axisColor, formatter: () => tons(catTotal, 3) }, value: { fontSize: "16px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033" } } } } },
                  }} />
                </Box>
                <Stack spacing={0.8}>
                  {categories.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : categories.map(([c, value]) => (
                    <Stack key={c} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                      <Dot color={CATEGORY_COLORS[c]} text={label("category", c)} />
                      <Typography variant="caption" fontWeight={700}>{num((value / catTotal) * 100, 1)}% ({num(value, 3)} kg)</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "1fr 1fr 1.2fr" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Top Material Consumption")} subtitle="(KG)" />
            <Box sx={{ px: 1, pb: 1 }}>
              <Table size="small" sx={tableSx}>
                <TableHead><TableRow><TableCell>{tx("Material")}</TableCell><TableCell align="right">{tx("Consumption")}</TableCell><TableCell>{tx("Usage Ratio")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.top_materials.length === 0 ? <TableRow><TableCell colSpan={3}>{tx("No data.")}</TableCell></TableRow> : data.top_materials.map((m) => (
                    <TableRow key={m.material_id}>
                      <TableCell><Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{m.material_code}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{m.material_name}</Typography></TableCell>
                      <TableCell align="right">{num(m.qty, 3)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Typography variant="caption" sx={{ width: 44, textAlign: "right" }}>{num(m.ratio, 1)}%</Typography>
                          <Box sx={{ width: 80, height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${m.ratio}%`, height: "100%", bgcolor: "#12B76A" }} /></Box>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Usage Variance Analysis")} />
            <Stack spacing={1} sx={{ px: 1.5, pb: 1.5 }}>
              {varianceRows.map(([title, value, subTitle, subValue, count, color, Icon, status]) => (
                <Box key={title} onClick={() => showStatus(status)} sx={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 20px", gap: 1.25, alignItems: "center", p: 1.25,
                  borderRadius: 2, border: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: `${color}1A`, color }}><Icon fontSize="small" /></Box>
                  <Box><Typography variant="caption" color="text.secondary">{title}</Typography><Typography variant="subtitle1" fontWeight={800} sx={{ color }}>{value}</Typography></Box>
                  <Box><Typography variant="caption" color="text.secondary">{subTitle}</Typography>
                    <Typography variant="subtitle2" fontWeight={800}>{subValue} <Typography component="span" variant="caption" color="text.secondary">{count}</Typography></Typography></Box>
                  <ChevronRightIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </Box>
              ))}
              <Button size="small" startIcon={<ReportProblemOutlinedIcon />} onClick={() => showStatus("OVER")} sx={{ alignSelf: "flex-start", textTransform: "none" }}>{tx("Show large variances")}</Button>
            </Stack>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Recent Usage History")} />
            <Box sx={{ px: 1, pb: 1, maxHeight: 290, overflow: "auto" }}>
              <Table size="small" stickyHeader sx={tableSx}>
                <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Material")}</TableCell><TableCell align="right">{tx("Quantity")}</TableCell><TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Source")}</TableCell><TableCell>{tx("Operator")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.recent.length === 0 ? <TableRow><TableCell colSpan={7}>{tx("No data.")}</TableCell></TableRow> : data.recent.map((u) => (
                    <TableRow key={u.id} hover sx={{ cursor: "pointer" }} onClick={() => setDialog({ type: "wo", id: u.work_order_id })}>
                      <TableCell>{ddmmhhmm(u.used_at)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{u.wo_no}</TableCell><TableCell>{u.material_code}</TableCell>
                      <TableCell align="right">{qty(u.qty, u.unit)}</TableCell><TableCell>{u.machine_code || EMPTY}</TableCell>
                      <TableCell sx={{ color: u.source === "CLOSE_OUT" ? "#F04438" : u.source === "MANUAL" ? "#F79009" : undefined }}>{label("usageSource", u.source)}</TableCell><TableCell>{u.actor}</TableCell>
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

