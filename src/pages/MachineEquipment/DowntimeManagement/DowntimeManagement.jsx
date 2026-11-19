import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper,
  Select, Snackbar, Stack, Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, ThemeProvider as MuiThemeProvider, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import ViewListOutlinedIcon from "@mui/icons-material/ViewListOutlined";

import { getCurrentUser } from "../../../auth/auth";
import usePagePermission from "../../../auth/usePagePermission";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import AgGridTable from "../../../components/tables/BasicTables/BasicTableOne";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { KpiTile, colShares, downloadExcel, fitColumns, useRequest } from "../../MaterialManagement/materialUi";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, fitPageSx, panelSx, toolBtnSx, who } from "../../shared/onePage";
import { DialogHeader, Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, dialogPaperSx, num, pageTheme } from "../../ProductionManagement/ProductionPlanning/ui";
import { SystemStatusBar } from "../../ProductionManagement/WorkOrders/WorkOrderManagement/WoParts";
import { label, localeTag, setActiveLanguage, tx } from "../machineLocales";
import { CATEGORY_COLORS, DT_STATUS_COLORS, DowntimeDialog, Pill, REASON_COLORS, minText, reasonName } from "../machineUi";

const API = `${API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "")}/api/downtime`;
const EMPTY_FILTER = { equipment_id: "", area_id: "", reason_code_id: "", category: "", shift_id: "", status: "" };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const delta = (cur, prev, digits = 0, unit = "") => (prev == null || cur == null ? "" : `${cur - prev > 0 ? "↑" : cur - prev < 0 ? "↓" : "•"} ${num(Math.abs(cur - prev), digits)}${unit} ${tx("vs previous period")}`);

function DetailDialog({ item, canEdit, onClose, onAction, navigate }) {
  const rows = [[tx("Equipment"), `${item.equipment_code} — ${item.equipment_name}`], [tx("Area"), item.area_name], [tx("Work Order"), item.wo_no],
    [tx("Reason Code"), item.reason_code ? `${item.reason_code} — ${item.reason_name}` : null], [tx("Reason"), item.reason_text], [tx("Category"), label("dtCategory", item.category)],
    [tx("Start Time"), ddmmhhmm(item.started_at)], [tx("End Time"), item.ended_at ? ddmmhhmm(item.ended_at) : null], [tx("Duration"), minText(item.total_min)],
    [tx("Source"), label("source", item.source)], [tx("Reported By"), item.reporter], [tx("Root cause"), item.root_cause], [tx("Action taken"), item.action_taken],
    ["Alarm", item.alarm_no]];
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<BuildCircleOutlinedIcon />} title={`${tx("Downtime Detail")} · ${item.downtime_no}`} subtitle={reasonName(item)} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}><Pill group="dtStatus" value={item.status} colors={DT_STATUS_COLORS} /><Pill group="dtCategory" value={item.category} colors={CATEGORY_COLORS} /></Stack>
        <Box sx={{ display: "grid", gridTemplateColumns: "38% 62%", rowGap: 0.75 }}>
          {rows.map(([k, v]) => [<Typography key={`${k}k`} variant="caption" color="text.secondary">{k}</Typography>, <Typography key={`${k}v`} variant="caption" fontWeight={700}>{v || EMPTY}</Typography>])}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        <Button disabled={!canEdit || item.status !== "OPEN" || item.source === "MES"} onClick={() => onAction("close")} sx={btn("primary")}>{tx("Close Downtime")}</Button>
        <Button disabled={!canEdit || item.status === "CANCELLED"} onClick={() => onAction("edit")} sx={btn("edit")}>{tx("Edit")}</Button>
        <Button disabled={!canEdit || item.status === "CANCELLED" || (item.source === "MES" && item.status === "OPEN")} onClick={() => onAction("cancel")} sx={btn("delete")}>{tx("Cancel Downtime")}</Button>
        <Button onClick={() => navigate(`/machine-equipment/machine-detail?machine=${item.equipment_id}`)} sx={btn("cancel")}>{tx("Machine Detail")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function DowntimeManagement() {
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
  const [period, setPeriod] = useState({ from: ymd(new Date()), to: ymd(new Date()) });
  const [filter, setFilter] = useState({ ...EMPTY_FILTER, equipment_id: Number(params.get("machine")) || "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [dialog, setDialog] = useState(params.get("report") ? { type: "report", preset: { equipment_id: Number(params.get("machine")) || "" } } : null);
  const [showFilter, setShowFilter] = useState(false);
  const [reasonView, setReasonView] = useState("chart");
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  useEffect(() => { request(`${API}/lookups`).then(setLookups).catch((e) => notify("error", e.message)); }, [request, notify]);
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
    const t = setInterval(() => { if (!dialog) load({ silent: true }); }, 30000);
    return () => clearInterval(t);
  }, [autoRefresh, load, dialog]);

  const columns = useMemo(() => fitColumns([
    { headerName: tx("No."), field: "downtime_no", width: 140, pinned: "left", cellStyle: { fontWeight: 700 } },
    { headerName: tx("Start Time"), field: "started_at", width: 110, valueFormatter: (p) => ddmmhhmm(p.value) },
    { headerName: tx("End Time"), field: "ended_at", width: 110, valueFormatter: (p) => (p.value ? ddmmhhmm(p.value) : EMPTY) },
    { headerName: tx("Machine"), field: "equipment_code", width: 95, cellStyle: { color: "#1570EF", fontWeight: 700 } },
    { headerName: tx("Work Order"), field: "wo_no", width: 125 },
    { headerName: tx("Reason"), colId: "reason", width: 190, valueGetter: (p) => reasonName(p.data) },
    { headerName: tx("Reason Code"), field: "reason_code", width: 105 },
    { headerName: tx("Duration (min)"), field: "duration_min", width: 110, type: "numericColumn", valueFormatter: (p) => num(p.value, 0) },
    { headerName: tx("Category"), field: "category", width: 120, cellRenderer: (p) => <Pill group="dtCategory" value={p.value} colors={CATEGORY_COLORS} width={100} /> },
    { headerName: tx("Reported By"), field: "reporter", width: 150, valueFormatter: (p) => who(p.value) },
    { headerName: tx("Source"), field: "source", width: 90, valueFormatter: (p) => label("source", p.value) },
    { headerName: tx("Status"), field: "status", width: 124, pinned: "right", cellRenderer: (p) => <Pill group="dtStatus" value={p.value} colors={DT_STATUS_COLORS} /> },
  ]), [language]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const p = k.prev;
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const cats = data.trend.map((t) => `${t.date.slice(8, 10)}/${t.date.slice(5, 7)}`);
  const reasonLabel = (r) => (r === "UNSPECIFIED" ? tx("Unspecified") : r);
  const maxMachine = Math.max(...data.by_machine.map((m) => m.minutes), 1);
  const heatMax = Math.max(...data.heatmap.flatMap((h) => h.cells), 1);
  const exportCsv = () => downloadExcel(`downtime-${period.from}_${period.to}.csv`,
    ["No", "Start", "End", "Machine", "Work Order", "Reason code", "Reason", "Duration min", "Category", "Status", "Source", "Reporter", "Root cause", "Action"],
    data.events.map((d) => [d.downtime_no, d.started_at, d.ended_at, d.equipment_code, d.wo_no, d.reason_code, reasonName(d), d.duration_min, d.category, d.status, d.source, d.reporter, d.root_cause, d.action_taken]));
  const openDetail = (item) => setDialog({ type: "detail", item });
  const afterSave = () => { setDialog(null); load({ silent: true }); request(`${API}/lookups`).then(setLookups).catch(() => {}); };
  const donut = (labels, series, colors, total) => ({
    chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels, colors, legend: { show: false }, dataLabels: { enabled: false },
    stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 0)} ${tx("min")}` } },
    plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: `${tx("Total")} (${tx("min")})`, color: axisColor, formatter: () => num(total, 0) }, value: { fontSize: "14.5px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033" } } } } },
  });
  const tableSx = { "& .MuiTableCell-root": { fontSize: 11, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800, bgcolor: "background.paper" } };

  const base = chartBase(dark, axisColor);
  const activeFilters = Object.values(filter).filter(Boolean).length;
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const quick = [
    [tx("Report Downtime"), ReportProblemOutlinedIcon, "#F04438", () => setDialog({ type: "report", preset: { equipment_id: filter.equipment_id } }), !canEdit],
    [tx("Request Maintenance"), BuildOutlinedIcon, "#1570EF", () => navigate("/maintenance-management/requests?create=1")],
    [tx("Maintenance History"), HistoryOutlinedIcon, "#7A5AF8", () => navigate("/maintenance-management/history")],
    [tx("Machine Monitoring"), ViewListOutlinedIcon, "#0E9384", () => navigate("/machine-equipment/machine-monitoring")],
    [tx("Equipment Monitoring"), PrecisionManufacturingOutlinedIcon, "#12B76A", () => navigate("/machine-equipment/equipment-monitoring")],
    [tx("Alarm History"), NotificationsOutlinedIcon, "#F79009", () => navigate("/machine-equipment/alarm-history")],
  ];

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box sx={fitPageSx}>
        <PageMeta title={`${tx("Downtime Management")} | VCC Plastics`} description={tx("Record, classify and analyse machine stops")} />
        <PageBreadcrumb pageTitle={tx("Downtime Management")} />
        <Paper elevation={0} sx={{ ...cardSx, p: 0.75, position: "relative", overflow: "hidden" }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <TextField size="small" type="date" label={tx("Period from")} value={period.from} onChange={(e) => setPeriod((o) => ({ ...o, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
            <TextField size="small" type="date" label={tx("Period to")} value={period.to} onChange={(e) => setPeriod((o) => ({ ...o, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
            <FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
            <Button startIcon={<FileDownloadOutlinedIcon />} disabled={!data.events.length} onClick={exportCsv} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} sx={toolBtnSx}>{tx("Print")}</Button>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            <FormControlLabel sx={{ mr: 0 }} control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
              label={<Typography variant="caption" fontWeight={700}>{tx("Auto Refresh")}</Typography>} />
          </Stack>
          {showFilter ? (
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center", mt: 0.75 }}>
              {[["equipment_id", tx("Machine"), lookups.equipment.map((e) => [e.id, e.equipment_code])], ["area_id", tx("Area"), lookups.areas.map((a) => [a.id, a.name])],
                ["reason_code_id", tx("Reason Code"), lookups.reasons.map((r) => [r.id, `${r.reason_code} — ${r.reason_name}`])],
                ["category", tx("Category"), ["PLANNED", "UNPLANNED"].map((c) => [c, label("dtCategory", c)])], ["shift_id", tx("Shift"), lookups.shifts.map((s) => [s.id, s.shift_name])],
                ["status", tx("Status"), ["OPEN", "CLOSED"].map((s) => [s, label("dtStatus", s)])]].map(([key, text, options]) => (
                <FormControl key={key} size="small" sx={{ width: 160 }}><InputLabel>{text}</InputLabel>
                  <Select label={text} value={filter[key]} onChange={(e) => setFilter((f) => ({ ...f, [key]: e.target.value }))}>
                    <MenuItem value="">{tx("All")}</MenuItem>{options.map(([v, n]) => <MenuItem key={v} value={v}>{n}</MenuItem>)}
                  </Select></FormControl>
              ))}
              <Button onClick={() => setFilter(EMPTY_FILTER)} disabled={!activeFilters} sx={toolBtnSx}>{tx("Clear")}</Button>
            </Stack>
          ) : null}
          {loading ? <LinearProgress sx={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2 }} /> : null}
        </Paper>

        <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
          <KpiTile tone="danger" title={tx("Total Downtime")} value={num(k.total_min, 0)} unit={tx("min")} sub={delta(k.total_min, p.total_min, 0, ` ${tx("min")}`)} icon={AccessTimeOutlinedIcon} />
          <KpiTile tone="success" title={tx("Downtime Events")} value={num(k.events)} sub={`${k.open} ${tx("open")} · ${delta(k.events, p.events)}`} icon={PlayCircleOutlineIcon} onClick={() => setFilter((f) => ({ ...f, status: "OPEN" }))} />
          <KpiTile tone="info" title={tx("Affected Machines")} value={num(k.machines)} unit={tx("machines")} sub={delta(k.machines, p.machines)} icon={PrecisionManufacturingOutlinedIcon} />
          <KpiTile tone="accent" title={tx("Downtime Rate")} value={k.rate != null ? num(k.rate, 2) : EMPTY} unit={k.rate != null ? "%" : ""} sub={delta(k.rate, p.rate, 2, "%")} icon={PercentOutlinedIcon} />
          <KpiTile tone="warning" title={tx("MTTR (Avg)")} value={k.mttr != null ? num(k.mttr, 1) : EMPTY} unit={k.mttr != null ? tx("min") : ""} sub={delta(k.mttr, p.mttr, 1, ` ${tx("min")}`)} icon={TimerOutlinedIcon} />
          <KpiTile tone="primary" title={tx("Planned Downtime")} value={num(k.planned_min, 0)} unit={tx("min")} sub={delta(k.planned_min, p.planned_min, 0, ` ${tx("min")}`)} icon={EventAvailableOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, category: "PLANNED" }))} />
          <KpiTile tone="danger" title={tx("Unplanned Downtime")} value={num(k.unplanned_min, 0)} unit={tx("min")} sub={delta(k.unplanned_min, p.unplanned_min, 0, ` ${tx("min")}`)} icon={ReportProblemOutlinedIcon} onClick={() => setFilter((f) => ({ ...f, category: "UNPLANNED" }))} />
        </KpiCardGroup>

        {/* recent events = top of the event list, rate trend = line of the downtime trend, category split = the planned / unplanned tiles: not repeated */}
        <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)" } }}>
          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 380, lg: 0 } }}>
            <Head title={tx("Downtime Event List")} action={<Typography variant="caption" color="text.secondary">{data.events.length}</Typography>} />
            <Box sx={{ flex: 1, minHeight: 0, px: 1, pb: 1 }}>
              <AgGridTable rowData={data.events} columnDefs={columns} height="100%" rowHeight={27} getRowId={(r) => String(r.data.id)} onRowClicked={(e) => openDetail(e.data)} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "1" } }}>
            <Head title={reasonView === "table" ? tx("Top Downtime Reasons") : tx("Downtime Overview")} action={(
              <ToggleButtonGroup exclusive size="small" value={reasonView} onChange={(e, v) => v && setReasonView(v)}>
                <ToggleButton value="chart" sx={toggleSx}>{tx("Chart")}</ToggleButton>
                <ToggleButton value="table" sx={toggleSx}>{tx("Table")}</ToggleButton>
              </ToggleButtonGroup>
            )} />
            {!data.by_reason.length ? <EmptyBody text={tx("No data.")} /> : reasonView === "chart" ? (
              <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
                <Chart type="donut" height={150} series={data.by_reason.map((r) => r[1])}
                  options={donut(data.by_reason.map((r) => reasonLabel(r[0])), null, data.by_reason.map((_, i) => REASON_COLORS[i % REASON_COLORS.length]), k.total_min)} />
                <Stack spacing={0.5}>{data.by_reason.slice(0, 6).map(([r, m, pct], i) => (
                  <Stack key={r} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}><Box sx={{ minWidth: 0, overflow: "hidden" }}><Dot color={REASON_COLORS[i % REASON_COLORS.length]} text={reasonLabel(r)} /></Box>
                    <Typography variant="caption" fontWeight={700} sx={{ whiteSpace: "nowrap" }}>{num(m, 0)} ({num(pct, 1)}%)</Typography></Stack>
                ))}</Stack>
              </Box>
            ) : (
              <Box sx={fillSx}>
                <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(56, 24, 20) }}>
                  <TableHead><TableRow><TableCell>{tx("Reason")}</TableCell><TableCell align="right">{tx("min")}</TableCell><TableCell align="right">{tx("Rate")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.by_reason.map(([r, m, pct]) => (
                    <TableRow key={r} hover sx={{ cursor: "pointer" }} onClick={() => { const rc = lookups.reasons.find((x) => x.reason_name === r); if (rc) setFilter((f) => ({ ...f, reason_code_id: rc.id })); }}>
                      <TableCell title={reasonLabel(r)}>{reasonLabel(r)}</TableCell><TableCell align="right">{num(m, 0)}</TableCell><TableCell align="right">{num(pct, 1)}%</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            )}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "4" }, gridRow: { lg: "2" } }}>
            <Head title={tx("Downtime by Machine")} action={<Typography variant="caption" color="text.secondary">{tx("min")} · %</Typography>} />
            {data.by_machine.length ? (
              <Stack spacing={1} sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
                {data.by_machine.map((m, i) => (
                  <Box key={m.equipment_id} sx={{ display: "grid", gridTemplateColumns: "80px 1fr 50px 44px", gap: 1, alignItems: "center", cursor: "pointer" }} onClick={() => navigate(`/machine-equipment/machine-detail?machine=${m.equipment_id}`)}>
                    <Typography variant="caption" fontWeight={800} sx={{ color: "#1570EF" }}>{m.equipment_code}</Typography>
                    <Box sx={{ height: 9, borderRadius: 1, bgcolor: "action.hover", overflow: "hidden" }}><Box sx={{ width: `${(m.minutes / maxMachine) * 100}%`, height: "100%", bgcolor: REASON_COLORS[i % REASON_COLORS.length] }} /></Box>
                    <Typography variant="caption" fontWeight={800} sx={{ textAlign: "right" }}>{num(m.minutes, 0)}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>{num(m.rate, 1)}%</Typography>
                  </Box>
                ))}
              </Stack>
            ) : <EmptyBody text={tx("No data.")} />}
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" }, gridRow: { lg: "3" } }}>
            <Head title={tx("Downtime Trend")} action={<Stack direction="row" spacing={1.5}><Dot color="#1570EF" text={tx("Downtime (min)")} /><Dot color="#F04438" text={tx("Downtime Rate (%)")} /></Stack>} />
            <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
              <Chart type="line" height="100%" series={[{ name: tx("Downtime (min)"), type: "column", data: data.trend.map((t) => t.minutes) }, { name: tx("Downtime Rate (%)"), type: "line", data: data.trend.map((t) => t.rate) }]}
                options={{ ...base, colors: ["#1570EF", "#F04438"], stroke: { width: [0, 2], curve: "smooth" }, markers: { size: [0, 3] }, plotOptions: { bar: { columnWidth: "45%", borderRadius: 2 } },
                  xaxis: { ...base.xaxis, categories: cats },
                  yaxis: [{ tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } }, { opposite: true, tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => `${num(v, 1)}%` } }],
                  tooltip: { ...base.tooltip, shared: true } }} />
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
            <Head title={`${tx("Downtime by Time of Day")} (${tx("min")})`} />
            <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "40px repeat(12, minmax(16px, 1fr))", gap: 0.4 }}>
                <Box />{Array.from({ length: 12 }, (_, i) => <Typography key={i} variant="caption" color="text.secondary" sx={{ textAlign: "center", fontSize: 10 }}>{String(i * 2).padStart(2, "0")}</Typography>)}
                {data.heatmap.map((row) => [
                  <Typography key={`${row.date}l`} variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{row.date.slice(8, 10)}/{row.date.slice(5, 7)}</Typography>,
                  ...row.cells.map((c, i) => (
                    <Tooltip key={`${row.date}${i}`} title={`${row.date} ${String(i * 2).padStart(2, "0")}:00 · ${num(c, 0)} ${tx("min")}`}>
                      <Box sx={{ height: 16, borderRadius: 0.5, bgcolor: c ? `rgba(240,68,56,${0.15 + 0.85 * (c / heatMax)})` : "action.hover" }} />
                    </Tooltip>
                  )),
                ])}
              </Box>
            </Box>
          </Paper>

          <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "3" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
            <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
          </Box>
        </Box>

        <SystemStatusBar system={data.system} />

        {dialog?.type === "detail" && <DetailDialog item={dialog.item} canEdit={canEdit} navigate={navigate} onClose={() => setDialog(null)} onAction={(mode) => setDialog({ type: "form", mode, item: dialog.item })} />}
        {dialog?.type === "form" && <DowntimeDialog mode={dialog.mode} api={API} request={request} lookups={lookups} item={dialog.item} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={afterSave} />}
        {dialog?.type === "report" && <DowntimeDialog mode="report" api={API} request={request} lookups={lookups} preset={dialog.preset} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={afterSave} />}
        <Snackbar open={msg.open} autoHideDuration={5000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
