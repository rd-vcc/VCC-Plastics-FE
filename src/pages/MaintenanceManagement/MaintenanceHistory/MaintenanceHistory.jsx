import "./locales";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ClassOutlinedIcon from "@mui/icons-material/ClassOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, cardSx, hhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../maintLocales";
import { DonutCard, MaintFrame, useMaintData, useMaintPage } from "../maintPage";
import {
  SEL,
  ASSET_COLORS, AssetCell, MAINT_API, PRIORITY_COLORS, QuickActionGrid, TYPE_COLORS, TypePill, WoDialog, WoStatusPill, WorkOrderPanel, assetPath, dateText, hhmmFromMinutes, money,
} from "../maintUi";

const iso = (d) => d.toISOString().slice(0, 10);

export default function MaintenanceHistory() {
  const page = useMaintPage();
  const { navigate, params, setParams, dark, axisColor, grid, tableSx, lookups, request, actor, notify, canEdit } = page;
  const [range, setRange] = useState(() => ({ from: iso(new Date(Date.now() - 29 * 86400000)), to: iso(new Date()) }));
  const [dialog, setDialog] = useState(null);
  const { data, loading, lastUpdate, live, setLive, load } = useMaintData(page, `${MAINT_API}/work-orders?scope=ALL&history=true&date_from=${range.from}&date_to=${range.to}`, { interval: 120000, paused: Boolean(dialog) });
  const [f, setF] = useState({ q: "", asset_type: "", type: "", priority: "", asset: "" });
  const selectedId = Number(params.get("wo")) || null;
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const all = data?.items || [];
  const items = useMemo(() => all.filter((w) => (!f.asset_type || w.asset_type === f.asset_type || (f.asset_type === "MACHINE" && w.asset_type === "EQUIPMENT")) && (!f.type || w.wo_type === f.type)
    && (!f.priority || w.priority === f.priority) && (!f.asset || w.asset_code === f.asset)
    && (!f.q || `${w.wo_no} ${w.asset_code} ${w.asset_name} ${w.task_name} ${w.technician || ""}`.toLowerCase().includes(f.q.toLowerCase()))), [all, f]);
  useEffect(() => { if (!selectedId && items.length) setParams({ wo: String(items[0].id) }, { replace: true }); }, [items, selectedId, setParams]);
  const k = data?.kpis || {};
  const assets = [...new Set(all.map((w) => w.asset_code).filter(Boolean))].sort();
  const entries = (obj, group, keys) => (keys || Object.keys(obj || {})).map((key) => [key, obj?.[key] || 0, label(group, key)]).filter(([, n]) => n);
  const topMax = Math.max(1, ...(data?.top_downtime || []).map(([, h]) => h));
  const pct = (a, b) => (b ? `${num((a / b) * 100, 1)}%` : "");
  const vsPrev = (a, b) => (b ? `${a >= b ? "↑" : "↓"} ${num(Math.abs(((a - b) / b) * 100), 1)}%` : "");
  const exportCsv = () => downloadCsv("maintenance-history.csv", ["WO No.", "Completed", "Asset", "Asset type", "Maintenance type", "Task", "Status", "Technician", "Start", "End", "Downtime (min)", "Parts", "Labor", "Total cost", "Result", "Root cause"],
    items.map((w) => [w.wo_no, w.completed_at, w.asset_code, w.asset_type, w.wo_type, w.task_name, w.status, w.technician, w.actual_start, w.actual_finish, w.downtime_actual_minutes, w.parts_cost, w.labor_cost, w.total_cost, w.result, w.root_cause]));
  const quick = [
    [tx("Create Manual WO"), NoteAddOutlinedIcon, "#1570EF", () => setDialog({ type: "wo" }), !canEdit],
    [tx("PM Calendar"), CalendarMonthOutlinedIcon, "#F79009", () => navigate("/maintenance-management/planning"), false],
    [tx("Asset / Tool"), GridViewOutlinedIcon, "#7A5AF8", () => navigate("/machine-equipment/machine-monitoring"), false],
    [tx("Spare Parts Check"), SettingsOutlinedIcon, "#12B76A", () => notify("info", tx("Spare parts module is not live yet.")), false],
    [tx("Tool Calibration"), VerifiedUserOutlinedIcon, "#0E9384", () => navigate("/maintenance-management/production-tool-maintenance"), false],
    [tx("Downtime Report"), ReportProblemOutlinedIcon, "#F04438", () => navigate("/machine-equipment/downtime-management"), false],
    [tx("Maintenance Report"), SummarizeOutlinedIcon, "#F04438", exportCsv, false],
  ];

  return (
    <MaintFrame page={page} title={tx("Maintenance History")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system}
      toolbar={<>
        <TextField size="small" type="date" label={tx("Date from")} value={range.from} onChange={(e) => setRange((o) => ({ ...o, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
        <TextField size="small" type="date" label={tx("Date to")} value={range.to} onChange={(e) => setRange((o) => ({ ...o, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
      </>}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total Maintenance")} value={num(k.total)} sub={k.total_prev ? `${vsPrev(k.total, k.total_prev)} ${tx("vs previous period")}` : ""} icon={ClassOutlinedIcon} onClick={() => setF((o) => ({ ...o, type: "" }))} />
              <KpiTile tone="success" title={tx("Completed")} value={num(k.completed)} sub={money(k.cost)} icon={AssignmentTurnedInOutlinedIcon} />
              <KpiTile tone="accent" title={tx("Preventive Maintenance")} value={num(k.preventive)} sub={pct(k.preventive, k.total)} icon={EventRepeatOutlinedIcon} />
              <KpiTile tone="warning" title={tx("Corrective Maintenance")} value={num(k.corrective)} sub={pct(k.corrective, k.total)} icon={BuildOutlinedIcon} />
              <KpiTile tone="danger" title={tx("Total Downtime (period)")} value={hhmmFromMinutes((k.downtime_hours || 0) * 60)} unit={tx("hours")} sub={k.downtime_prev ? `${vsPrev(k.downtime_hours, k.downtime_prev)} ${tx("vs previous period")}` : ""} icon={TimerOutlinedIcon} />
              <KpiTile tone="info" title={tx("MTTR (period)")} value={k.mttr != null ? num(k.mttr, 2) : EMPTY} unit={tx("hours")} sub={k.mttr_prev != null ? `${vsPrev(k.mttr, k.mttr_prev)} ${tx("vs previous period")}` : ""} icon={ScheduleOutlinedIcon} />
              <KpiTile tone="primary" title={tx("PM Compliance")} value={k.pm_compliance != null ? num(k.pm_compliance, 1) : EMPTY} unit={k.pm_compliance != null ? "%" : ""} sub={`${dateText(data.period.from)} – ${dateText(data.period.to)}`} icon={VerifiedUserOutlinedIcon} />
            </KpiCardGroup>
          </Box>

          <Paper elevation={0} sx={{ ...cardSx, p: 1.25, mb: 1.5 }}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
              <TextField select size="small" slotProps={SEL} label={tx("Asset type")} value={f.asset_type} onChange={set("asset_type")} sx={{ minWidth: 150 }}><MenuItem value="">{tx("All")}</MenuItem>
                {["MACHINE", "MOLD", "TOOL"].map((t) => <MenuItem key={t} value={t}>{t === "MACHINE" ? tx("Machines & equipment") : label("assetType", t)}</MenuItem>)}</TextField>
              <TextField select size="small" slotProps={SEL} label={tx("Asset / Tool")} value={f.asset} onChange={set("asset")} sx={{ minWidth: 150 }}><MenuItem value="">{tx("All")}</MenuItem>{assets.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField>
              <TextField select size="small" slotProps={SEL} label={tx("Maintenance Type")} value={f.type} onChange={set("type")} sx={{ minWidth: 150 }}><MenuItem value="">{tx("All")}</MenuItem>{(lookups?.wo_types || []).map((t) => <MenuItem key={t} value={t}>{label("woType", t)}</MenuItem>)}</TextField>
              <TextField select size="small" slotProps={SEL} label={tx("Priority")} value={f.priority} onChange={set("priority")} sx={{ minWidth: 130 }}><MenuItem value="">{tx("All")}</MenuItem>{(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
              <TextField size="small" placeholder={tx("Search...")} value={f.q} onChange={set("q")} sx={{ width: 240 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            </Stack>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.5fr) minmax(0,1.1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Maintenance History List")} subtitle={`(${items.length})`} />
              <Box sx={{ px: 1, pb: 1, height: 520, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow>
                    <TableCell>{tx("WO No.")}</TableCell><TableCell>{tx("Date")}</TableCell><TableCell>{tx("Asset / Tool")}</TableCell><TableCell align="center">{tx("Maintenance Type")}</TableCell>
                    <TableCell>{tx("Work Type")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell>{tx("Technician")}</TableCell><TableCell>{tx("Start Time")}</TableCell>
                    <TableCell>{tx("End Time")}</TableCell><TableCell align="right">{tx("Downtime")}</TableCell><TableCell align="right">{tx("Cost")}</TableCell>
                  </TableRow></TableHead>
                  <TableBody>{items.map((w) => (
                    <TableRow key={w.id} hover selected={w.id === selectedId} onClick={() => setParams({ wo: String(w.id) })} sx={{ cursor: "pointer" }}>
                      <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{w.wo_no}</TableCell><TableCell>{dateText(w.completed_at)}</TableCell>
                      <TableCell sx={{ maxWidth: 170 }}><AssetCell code={w.asset_code} name={w.asset_name} type={w.asset_type} onClick={assetPath(w.asset_type, w.asset_id) ? () => navigate(assetPath(w.asset_type, w.asset_id)) : undefined} /></TableCell>
                      <TableCell align="center"><TypePill value={w.wo_type} /></TableCell>
                      <TableCell sx={{ maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis" }}>{w.task_name}</TableCell>
                      <TableCell align="center"><WoStatusPill value={w.status} /></TableCell><TableCell>{w.technician || EMPTY}</TableCell>
                      <TableCell>{w.actual_start ? hhmm(w.actual_start) : EMPTY}</TableCell><TableCell>{w.actual_finish ? hhmm(w.actual_finish) : EMPTY}</TableCell>
                      <TableCell align="right">{hhmmFromMinutes(w.downtime_actual_minutes)}</TableCell><TableCell align="right">{num(w.total_cost)}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
                {!items.length ? <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>{tx("No data.")}</Typography> : null}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Maintenance Detail")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <WorkOrderPanel woId={selectedId} lookups={lookups} request={request} actor={actor} canEdit={canEdit} notify={notify} navigate={navigate} readOnly onChanged={() => load({ silent: true })} />
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(3, minmax(0,1fr))" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}><Head title={tx("Maintenance by Asset Type")} /><DonutCard entries={entries(data.by_asset_type, "assetType", ["MACHINE", "EQUIPMENT", "MOLD", "TOOL"])} colors={ASSET_COLORS} dark={dark} axisColor={axisColor} /></Paper>
            <Paper elevation={0} sx={cardSx}><Head title={tx("Maintenance by Type")} /><DonutCard entries={entries(data.by_type, "woType", lookups?.wo_types)} colors={TYPE_COLORS} dark={dark} axisColor={axisColor} /></Paper>
            <Paper elevation={0} sx={cardSx}><Head title={tx("Maintenance by Priority")} /><DonutCard entries={entries(data.by_priority, "priority", ["HIGH", "MEDIUM", "LOW"])} colors={PRIORITY_COLORS} dark={dark} axisColor={axisColor} /></Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Top Downtime Assets")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                {!data.top_downtime.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.top_downtime.map(([a, h]) => (
                  <Box key={a} sx={{ display: "grid", gridTemplateColumns: "70px 1fr 48px", gap: 1, alignItems: "center", mb: 0.6, cursor: "pointer" }} onClick={() => setF((o) => ({ ...o, asset: o.asset === a ? "" : a }))}>
                    <Typography variant="caption" fontWeight={700} noWrap>{a}</Typography>
                    <LinearProgress variant="determinate" value={(h / topMax) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "#1570EF" } }} />
                    <Typography variant="caption" fontWeight={800} align="right">{hhmmFromMinutes(h * 60)}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Downtime Trend")} />
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Chart type="line" height={180} series={[{ name: tx("Downtime"), data: data.downtime_trend.map((d) => d.hours) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#1570EF"], stroke: { width: 2 }, markers: { size: 2 },
                  xaxis: { categories: data.downtime_trend.map((d) => dateText(d.date).slice(0, 5)), tickAmount: 5, labels: { rotate: 0, style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: { min: 0, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } }, grid, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${num(v, 2)} h` } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("MTTR Trend")} />
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Chart type="line" height={180} series={[{ name: "MTTR", data: data.mttr_trend.map((d) => d.mttr) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#475467"], stroke: { width: 2 }, markers: { size: 3 },
                  xaxis: { categories: data.mttr_trend.map((d) => dateText(d.date).slice(0, 5)), tickAmount: 5, labels: { rotate: 0, style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: { min: 0, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 1) } }, grid, tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => (v == null ? EMPTY : `${num(v, 2)} h`) } } }} />
              </Box>
            </Paper>
          </Box>

          <Paper elevation={0} sx={cardSx}><Head title={tx("Quick Actions")} /><Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns="repeat(auto-fill, minmax(120px, 1fr))" /></Box></Paper>
          {dialog?.type === "wo" ? <WoDialog mode="create" lookups={lookups} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load({ silent: true }); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
