import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, LinearProgress, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import HandymanOutlinedIcon from "@mui/icons-material/HandymanOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { KpiCardGroup } from "../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, hhmm, num } from "../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, fillSx, fitGridSx, panelSx, who } from "../shared/onePage";
import { label, tx, txs } from "./maintLocales";
import { DonutCard, MaintFrame, useMaintData, useMaintPage } from "./maintPage";
import {
  SEL,
  CONDITION_COLORS, DonutLegend, MAINT_API, MiniProgress, PRIORITY_COLORS, PriorityPill, TYPE_COLORS, TypePill, WO_STATUS_COLORS, WoDialog, WoStatusPill, WorkOrderPanel,
  assetPath, dateText, hhmmFromMinutes,
} from "./maintUi";

const CONFIG = {
  MACHINE: { title: "Machine & Equipment Maintenance", listTitle: "Work Order List", panelTitle: "Selected Work Order", types: ["MACHINE", "EQUIPMENT"], downtimeKpi: "Breakdown (Today)" },
  MOLD: { title: "Mold Maintenance", listTitle: "Mold Work Order List", panelTitle: "Mold Work Order Detail", types: ["MOLD"], downtimeKpi: "Mold Downtime (Today)" },
  TOOL: { title: "Production Tool Maintenance", listTitle: "Tool Work Order List", panelTitle: "Selected Tool Work Order", types: ["TOOL"], downtimeKpi: "Tool Downtime (Today)" },
};

export default function MaintenanceExecution({ scope }) {
  const cfg = CONFIG[scope];
  const page = useMaintPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [dialog, setDialog] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [distView, setDistView] = useState("status");
  const { data, loading, lastUpdate, live, setLive, load } = useMaintData(page, `${MAINT_API}/work-orders?scope=${scope}`, { paused: Boolean(dialog) });
  const [f, setF] = useState({ q: "", type: "", status: "", priority: "", technician: "", asset: "" });
  const selectedId = Number(params.get("wo")) || null;
  const [detail, setDetail] = useState(null);
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const all = data?.items || [];
  const items = useMemo(() => all.filter((w) => (!f.type || w.wo_type === f.type) && (!f.status || (f.status === "OVERDUE" ? w.overdue : w.status === f.status)) && (!f.priority || w.priority === f.priority)
    && (!f.technician || w.technician === f.technician) && (!f.asset || w.asset_code === f.asset)
    && (!f.q || `${w.wo_no} ${w.asset_code} ${w.asset_name} ${w.task_name} ${w.technician || ""}`.toLowerCase().includes(f.q.toLowerCase()))), [all, f]);
  useEffect(() => { if (!selectedId && items.length) setParams({ wo: String(items[0].id) }, { replace: true }); }, [items, selectedId, setParams]);
  useEffect(() => { if (scope === "MOLD" && selectedId) request(`${MAINT_API}/work-orders/${selectedId}`).then(setDetail).catch(() => setDetail(null)); }, [scope, selectedId, request, lastUpdate]);
  const k = data?.kpis || {};
  const assets = [...new Set(all.map((w) => w.asset_code).filter(Boolean))].sort();
  const techs = [...new Set(all.map((w) => w.technician).filter(Boolean))].sort();
  const entries = (obj, group, keys) => (keys || Object.keys(obj || {})).map((key) => [key, obj?.[key] || 0, label(group, key)]).filter(([, n]) => n);
  const exportCsv = () => downloadExcel(`maintenance-${scope.toLowerCase()}.csv`, ["WO No.", "Type", "Asset", "Task", "Priority", "Status", "Technician", "Planned start", "Planned finish", "Actual start", "Progress %", "Downtime (min)", "Cost"],
    items.map((w) => [w.wo_no, w.wo_type, w.asset_code, w.task_name, w.priority, w.status, w.technician, w.planned_start, w.planned_finish, w.actual_start, w.progress, w.downtime_actual_minutes, w.total_cost]));
  const sel = all.find((w) => w.id === selectedId);
  const quick = [
    [txs("New WO (short)", "Create Work Order"), AddTaskOutlinedIcon, "#1570EF", () => setDialog({ type: "wo" }), !canEdit],
    [txs("PM calendar (short)", "PM Calendar"), CalendarMonthOutlinedIcon, "#F79009", () => navigate("/maintenance-management/planning"), false],
    ...(scope === "MOLD" ? [
      [tx("Mold Detail"), ViewInArOutlinedIcon, "#7A5AF8", () => navigate(`/mold-management/detail${sel ? `?mold=${sel.asset_id}` : ""}`), false],
      [tx("Mold Shot Counter"), SpeedOutlinedIcon, "#0E9384", () => navigate(`/mold-management/shot-counter${sel ? `?mold=${sel.asset_id}` : ""}`), false],
      [tx("Mold Location"), LocationOnOutlinedIcon, "#12B76A", () => navigate(`/mold-management/location${sel ? `?mold=${sel.asset_id}` : ""}`), false],
    ] : [
      scope === "TOOL"
        ? [tx("Maintenance Overview"), DashboardOutlinedIcon, "#7A5AF8", () => navigate("/maintenance-management/overview"), false]
        : [txs("Equipment (short)", "Equipment List"), PrecisionManufacturingOutlinedIcon, "#7A5AF8", () => navigate("/machine-equipment/machine-monitoring"), false],
      [txs("Spare parts (short)", "Spare Parts Check"), SettingsOutlinedIcon, "#12B76A", () => notify("info", tx("Spare parts module is not live yet.")), false],
      [tx("Downtime Management"), ReportProblemOutlinedIcon, "#F04438", () => navigate("/machine-equipment/downtime-management"), false],
    ]),
    [txs("Reports (short)", "Reports"), SummarizeOutlinedIcon, "#F04438", () => navigate("/maintenance-management/history"), false],
  ];
  const workloadMax = Math.max(1, ...(data?.workload || []).map(([, n]) => n));
  const selSx = { minWidth: 130 };
  const moldAsset = detail?.wo?.id === selectedId ? detail.asset : null;
  const comps = detail?.wo?.id === selectedId ? detail.components : [];
  const compCounts = ["GOOD", "MONITOR", "ATTENTION", "CRITICAL", "NOT_CHECKED"].map((c) => [c, comps.filter((x) => x.condition_code === c).length, label("condition", c)]).filter(([, n]) => n);
  const activeFilters = Object.values(f).filter(Boolean).length;
  const filters = showFilter ? (
    <>
      <TextField size="small" placeholder={tx("Search...")} value={f.q} onChange={set("q")} sx={{ width: 220 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      <TextField select size="small" slotProps={SEL} label={tx("Type")} value={f.type} onChange={set("type")} sx={selSx}><MenuItem value="">{tx("All")}</MenuItem>
        {(lookups?.wo_types || []).filter((t) => t !== "CALIBRATION" || scope === "TOOL").map((t) => <MenuItem key={t} value={t}>{label("woType", t)}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Status")} value={f.status} onChange={set("status")} sx={selSx}><MenuItem value="">{tx("All")}</MenuItem>
        {["OVERDUE", "RELEASED", "ASSIGNED", "IN_PROGRESS", "PAUSED", "VERIFICATION", "COMPLETED", "CLOSED", "CANCELLED"].map((s) => <MenuItem key={s} value={s}>{label("woStatus", s)}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Priority")} value={f.priority} onChange={set("priority")} sx={selSx}><MenuItem value="">{tx("All")}</MenuItem>
        {(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx(scope === "MOLD" ? "Mold No." : scope === "TOOL" ? "Tool No." : "Asset / Equipment")} value={f.asset} onChange={set("asset")} sx={{ minWidth: 150 }}><MenuItem value="">{tx("All")}</MenuItem>
        {assets.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Technician")} value={f.technician} onChange={set("technician")} sx={{ minWidth: 170 }}><MenuItem value="">{tx("All")}</MenuItem>
        {techs.map((t) => <MenuItem key={t} value={t}>{who(t)}</MenuItem>)}</TextField>
    </>
  ) : null;
  const toggleSx = { px: 0.9, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const dist = distView === "type" ? [entries(data?.by_type, "woType", lookups?.wo_types), TYPE_COLORS]
    : distView === "priority" ? [entries(data?.by_priority, "priority", ["HIGH", "MEDIUM", "LOW"]), PRIORITY_COLORS]
      : [entries(data?.by_status, "woStatus", ["IN_PROGRESS", "PAUSED", "VERIFICATION", "COMPLETED", "RELEASED", "ASSIGNED", "OVERDUE", "CLOSED", "CANCELLED"]), WO_STATUS_COLORS];
  const cols = scope === "MOLD" ? [10, 8.5, 13, 7, 11, 7.5, 10, 9, 8, 9, 7] : scope === "TOOL" ? [10, 8.5, 14, 19.5, 7.5, 10, 10, 5.5, 8, 7] : [10, 8.5, 14, 13, 7.5, 10, 10, 5.5, 8, 6.5, 7];
  const empty = <EmptyBody text={tx("No data.")} />;

  // today's downtime and the MTTR trend in one card (the MTTR 7-day value is already a KPI tile)
  const downtimeCard = (
    <Paper elevation={0} sx={panelSx}>
      <Head title={tx(scope === "MACHINE" ? "Downtime (Today)" : cfg.downtimeKpi)} action={<Dot color="#12B76A" text={tx("MTTR (7 days)")} />} />
      <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.1fr)", alignItems: "center", gap: 1, px: 1.5, pb: 1 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{tx("Total Downtime")}</Typography>
          <Typography variant="h6" fontWeight={800} sx={{ color: "#1570EF", lineHeight: 1.2 }}>{hhmmFromMinutes((k.downtime_today_hours || 0) * 60)}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>{tx("Breakdown Downtime")}</Typography>
          <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#F04438", lineHeight: 1.2 }}>{hhmmFromMinutes((k.breakdown_downtime_today_hours || 0) * 60)}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>{tx("MTTR (Today)")}: <b>{k.mttr_today != null ? `${num(k.mttr_today, 2)} ${tx("hours")}` : EMPTY}</b></Typography>
        </Box>
        <Box sx={{ height: "100%", minHeight: 0 }}>
          <Chart type="line" height="100%" series={[{ name: "MTTR", data: (data?.mttr_trend || []).map((m) => m.mttr) }]} options={{
            chart: { sparkline: { enabled: true }, background: "transparent" }, colors: ["#12B76A"], stroke: { width: 2 }, markers: { size: 2 }, tooltip: { theme: dark ? "dark" : "light", x: { show: false }, y: { formatter: (v) => (v == null ? EMPTY : `${num(v, 2)} h`) } } }} />
        </Box>
      </Box>
    </Paper>
  );

  return (
    <MaintFrame fit page={page} title={tx(cfg.title)} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} filters={filters}
      toolbar={<FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx(scope === "MOLD" ? "Mold Work Orders" : scope === "TOOL" ? "Tool Work Orders" : "Total Work Orders")} value={num(k.total)} sub={`${k.open} ${tx("open")}`} icon={AssignmentOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "" }))} />
            <KpiTile tone="success" title={tx("In Progress")} value={num(k.in_progress)} sub="" icon={HandymanOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "IN_PROGRESS" }))} />
            <KpiTile tone="accent" title={tx("Completed (Today)")} value={num(k.completed_today)} sub="" icon={CheckBoxOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "COMPLETED" }))} />
            <KpiTile tone="warning" title={tx("Overdue")} value={num(k.overdue)} sub="" icon={WarningAmberOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "OVERDUE" }))} />
            {scope === "MACHINE" ? <KpiTile tone="danger" title={tx("Breakdown (Today)")} value={num(k.breakdown_today)} sub="" icon={ReportProblemOutlinedIcon} />
              : <KpiTile tone="danger" title={tx(cfg.downtimeKpi)} value={hhmmFromMinutes((k.downtime_today_hours || 0) * 60)} unit={tx("hours")} sub="" icon={TimerOutlinedIcon} />}
            <KpiTile tone="info" title={tx("MTTR (7 days)")} value={k.mttr_7d != null ? num(k.mttr_7d, 2) : EMPTY} unit={tx("hours")} sub="" icon={ScheduleOutlinedIcon} />
            <KpiTile tone="primary" title={tx("PM Compliance (MTD)")} value={k.pm_compliance != null ? num(k.pm_compliance, 1) : EMPTY} unit={k.pm_compliance != null ? "%" : ""} sub="" icon={VerifiedUserOutlinedIcon} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,0.85fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx(cfg.listTitle)} action={<Typography variant="caption" color="text.secondary">{items.length} {tx("rows")}</Typography>} />
              {items.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(...cols) }}>
                    <TableHead><TableRow>
                      <TableCell>{tx("WO No.")}</TableCell><TableCell align="center">{tx("Type")}</TableCell>
                      <TableCell>{tx(scope === "MOLD" ? "Mold No." : scope === "TOOL" ? "Tool No." : "Asset / Equipment")}</TableCell>
                      {scope === "MOLD" ? <TableCell align="right">{tx("Shot Count")}</TableCell> : null}
                      <TableCell>{tx("Task / Work")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell><TableCell align="center">{tx("Status")}</TableCell>
                      <TableCell>{tx("Technician")}</TableCell>{scope !== "MOLD" ? <TableCell>{tx("Start Time")}</TableCell> : null}<TableCell>{tx("Due Time")}</TableCell>
                      {scope === "MACHINE" ? <TableCell align="right">{tx("Est. Downtime")}</TableCell> : null}
                      {scope === "MOLD" ? <TableCell>{tx("Plan / Request")}</TableCell> : null}
                      <TableCell>{tx("Progress")}</TableCell>
                    </TableRow></TableHead>
                    <TableBody>{items.map((w) => (
                      <TableRow key={w.id} hover selected={w.id === selectedId} onClick={() => setParams({ wo: String(w.id) })} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{w.wo_no}</TableCell><TableCell align="center"><TypePill value={w.wo_type} /></TableCell>
                        <TableCell title={`${w.asset_code} · ${w.asset_name}`}>
                          <Box component="b" sx={{ color: assetPath(w.asset_type, w.asset_id) ? "#1570EF" : undefined, cursor: "pointer" }}
                            onClick={(e) => { const path = assetPath(w.asset_type, w.asset_id); if (path) { e.stopPropagation(); navigate(path); } }}>{w.asset_code}</Box> · {w.asset_name}</TableCell>
                        {scope === "MOLD" ? <TableCell align="right">{num(w.asset_shot)}</TableCell> : null}
                        <TableCell title={w.task_name}>{w.task_name}</TableCell>
                        <TableCell align="center"><PriorityPill value={w.priority} /></TableCell>
                        <TableCell align="center"><WoStatusPill value={w.overdue && !["VERIFICATION"].includes(w.status) ? "OVERDUE" : w.status} /></TableCell>
                        <TableCell title={who(w.technician)}>{who(w.technician)}</TableCell>
                        {scope !== "MOLD" ? <TableCell>{w.actual_start ? hhmm(w.actual_start) : EMPTY}</TableCell> : null}
                        <TableCell sx={{ color: w.overdue ? "#F04438" : undefined }}>{w.planned_finish ? `${dateText(w.planned_finish).slice(0, 5)} ${hhmm(w.planned_finish)}` : dateText(w.due_date)}</TableCell>
                        {scope === "MACHINE" ? <TableCell align="right">{hhmmFromMinutes(w.est_downtime_minutes ?? w.est_minutes)}</TableCell> : null}
                        {scope === "MOLD" ? <TableCell sx={{ color: "#1570EF" }}>{w.plan_no || w.request_no || EMPTY}</TableCell> : null}
                        <TableCell><MiniProgress value={w.progress} /></TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : empty}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx(cfg.panelTitle)} />
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1.25 }}>
                <WorkOrderPanel woId={selectedId} lookups={lookups} request={request} actor={actor} canEdit={canEdit} notify={notify} navigate={navigate} onChanged={() => load({ silent: true })} />
              </Box>
            </Paper>

            {scope === "MOLD" ? (
              <>
                <Paper elevation={0} sx={panelSx}>
                  <Head title={tx("Shot Count & Life Remaining")} subtitle={moldAsset ? `(${moldAsset.code})` : ""} />
                  {moldAsset ? (
                    <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "120px 1fr", alignItems: "center", px: 1.25, pb: 1, gap: 1 }}>
                      <Chart type="radialBar" height={130} series={[Math.max(100 - (moldAsset.life_used_pct || 0), 0)]} options={{
                        chart: { background: "transparent", sparkline: { enabled: true } }, colors: [(moldAsset.life_used_pct || 0) >= 90 ? "#F04438" : (moldAsset.life_used_pct || 0) >= 75 ? "#F79009" : "#12B76A"],
                        plotOptions: { radialBar: { hollow: { size: "60%" }, track: { background: dark ? "#263244" : "#EEF2F6" }, dataLabels: { name: { offsetY: 16, fontSize: "10px", color: axisColor },
                          value: { offsetY: -10, fontSize: "14px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: (v) => `${num(v, 0)}%` } } } }, labels: [tx("Remaining Life")] }} />
                      <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1, rowGap: 0.4 }}>
                        {[[tx("Current Shot Count"), num(moldAsset.current_shot)], [tx("Life Limit"), num(moldAsset.design_shot)], [tx("Remaining Shots"), num(moldAsset.remaining_shot)], [tx("Expected Replace Date"), dateText(moldAsset.eol_date)]].map(([a, b]) => [
                          <Typography key={`${a}k`} variant="caption" color="text.secondary" noWrap>{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700} align="right">{b}</Typography>])}
                      </Box>
                    </Box>
                  ) : <EmptyBody text={tx("Select a row in the list.")} />}
                </Paper>
                <Paper elevation={0} sx={panelSx}>
                  <Head title={tx("Mold Health")} action={<Typography variant="caption" color="text.secondary">{tx("Component Status")}</Typography>} />
                  {moldAsset ? (
                    <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "110px minmax(0,1fr)", alignItems: "center", gap: 1, px: 1, pb: 1 }}>
                      <Chart type="radialBar" height={130} series={[moldAsset.health || 0]} options={{
                        chart: { background: "transparent", sparkline: { enabled: true } }, colors: [moldAsset.health >= 80 ? "#12B76A" : moldAsset.health >= 60 ? "#F79009" : "#F04438"],
                        plotOptions: { radialBar: { startAngle: -110, endAngle: 110, hollow: { size: "62%" }, track: { background: dark ? "#263244" : "#EEF2F6" },
                          dataLabels: { name: { offsetY: 18, fontSize: "10px", color: axisColor }, value: { offsetY: -10, fontSize: "14px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: (v) => `${num(v, 0)}` } } } },
                        labels: [tx("Health Score")] }} />
                      {compCounts.length ? <DonutLegend items={compCounts} colors={CONDITION_COLORS} total={compCounts.reduce((a, [, n]) => a + n, 0)} /> : <Typography variant="caption" color="text.disabled">{tx("No data.")}</Typography>}
                    </Box>
                  ) : <EmptyBody text={tx("Select a row in the list.")} />}
                </Paper>
                {downtimeCard}
              </>
            ) : (
              <>
                <Paper elevation={0} sx={panelSx}>
                  <Head title={distView === "type" ? tx("Work Orders by Type") : distView === "priority" ? tx("Work Orders by Priority") : tx("Work Orders by Status")} action={(
                    <ToggleButtonGroup exclusive size="small" value={distView} onChange={(e, v) => v && setDistView(v)}>
                      <ToggleButton value="status" sx={toggleSx}>{tx("Status")}</ToggleButton>
                      <ToggleButton value="type" sx={toggleSx}>{tx("Type")}</ToggleButton>
                      <ToggleButton value="priority" sx={toggleSx}>{tx("Priority")}</ToggleButton>
                    </ToggleButtonGroup>
                  )} />
                  {dist[0].length ? (
                    <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}>
                      <Box sx={{ width: "100%" }}><DonutCard entries={dist[0]} colors={dist[1]} dark={dark} axisColor={axisColor} height={140} size={130} /></Box>
                    </Box>
                  ) : empty}
                </Paper>
                {downtimeCard}
                <Paper elevation={0} sx={panelSx}>
                  <Head title={tx("Technician Workload")} />
                  {data.workload.length ? (
                    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                      {data.workload.map(([t, n]) => (
                        <Box key={t} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) 1fr 20px", gap: 1, alignItems: "center", cursor: "pointer" }} onClick={() => setF((o) => ({ ...o, technician: o.technician === t ? "" : t }))}>
                          <Typography variant="caption" noWrap title={who(t)}>{who(t)}</Typography>
                          <LinearProgress variant="determinate" value={(n / workloadMax) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "#1570EF" } }} />
                          <Typography variant="caption" fontWeight={800} align="right">{n}</Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : empty}
                </Paper>
              </>
            )}
            <Box sx={{ display: "flex", minHeight: 0, "& > *": { flex: 1 } }}><QuickCard title={tx("Quick Actions")} actions={quick} columns={3} /></Box>
          </Box>

          {dialog?.type === "wo" ? <WoDialog mode="create" lookups={lookups} scopeTypes={cfg.types} request={request} actor={actor} notify={notify} preset={{ wo_type: scope === "TOOL" ? "PM" : "CORRECTIVE" }}
            onClose={() => setDialog(null)} onSaved={(id) => { setDialog(null); load({ silent: true }); if (id) setParams({ wo: String(id) }); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
