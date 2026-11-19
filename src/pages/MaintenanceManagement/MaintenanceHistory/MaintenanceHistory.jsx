import "./locales";
import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, InputAdornment, LinearProgress, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
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
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, hhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, panelSx, who } from "../../shared/onePage";
import { label, tx, txs } from "../maintLocales";
import { DonutCard, MaintFrame, useMaintData, useMaintPage } from "../maintPage";
import {
  SEL,
  ASSET_COLORS, MAINT_API, PRIORITY_COLORS, TYPE_COLORS, TypePill, WoDialog, WoStatusPill, WorkOrderPanel, assetPath, dateText, hhmmFromMinutes, money,
} from "../maintUi";

const iso = (d) => d.toISOString().slice(0, 10);

export default function MaintenanceHistory() {
  const page = useMaintPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, lookups, request, actor, notify, canEdit } = page;
  const [range, setRange] = useState(() => ({ from: iso(new Date(Date.now() - 29 * 86400000)), to: iso(new Date()) }));
  const [dialog, setDialog] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [distView, setDistView] = useState("asset");
  const [trendView, setTrendView] = useState("downtime");
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
  const exportCsv = () => downloadExcel("maintenance-history.csv", ["WO No.", "Completed", "Asset", "Asset type", "Maintenance type", "Task", "Status", "Technician", "Start", "End", "Downtime (min)", "Parts", "Labor", "Total cost", "Result", "Root cause"],
    items.map((w) => [w.wo_no, w.completed_at, w.asset_code, w.asset_type, w.wo_type, w.task_name, w.status, w.technician, w.actual_start, w.actual_finish, w.downtime_actual_minutes, w.parts_cost, w.labor_cost, w.total_cost, w.result, w.root_cause]));
  const quick = [
    [tx("Create Manual WO"), NoteAddOutlinedIcon, "#1570EF", () => setDialog({ type: "wo" }), !canEdit],
    [txs("PM calendar (short)", "PM Calendar"), CalendarMonthOutlinedIcon, "#F79009", () => navigate("/maintenance-management/planning"), false],
    [tx("Asset / Tool"), GridViewOutlinedIcon, "#7A5AF8", () => navigate("/machine-equipment/machine-monitoring"), false],
    [txs("Spare parts (short)", "Spare Parts Check"), SettingsOutlinedIcon, "#12B76A", () => notify("info", tx("Spare parts module is not live yet.")), false],
    [tx("Tool Calibration"), VerifiedUserOutlinedIcon, "#0E9384", () => navigate("/maintenance-management/production-tool-maintenance"), false],
    [tx("Downtime Report"), ReportProblemOutlinedIcon, "#F04438", () => navigate("/machine-equipment/downtime-management"), false],
  ];
  const base = chartBase(dark, axisColor);
  const activeFilters = Object.values(f).filter(Boolean).length;
  const filters = showFilter ? (
    <>
      <TextField size="small" placeholder={tx("Search...")} value={f.q} onChange={set("q")} sx={{ width: 220 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      <TextField select size="small" slotProps={SEL} label={tx("Asset type")} value={f.asset_type} onChange={set("asset_type")} sx={{ minWidth: 150 }}><MenuItem value="">{tx("All")}</MenuItem>
        {["MACHINE", "MOLD", "TOOL"].map((t) => <MenuItem key={t} value={t}>{t === "MACHINE" ? tx("Machines & equipment") : label("assetType", t)}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Asset / Tool")} value={f.asset} onChange={set("asset")} sx={{ minWidth: 150 }}><MenuItem value="">{tx("All")}</MenuItem>{assets.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Maintenance Type")} value={f.type} onChange={set("type")} sx={{ minWidth: 150 }}><MenuItem value="">{tx("All")}</MenuItem>{(lookups?.wo_types || []).map((t) => <MenuItem key={t} value={t}>{label("woType", t)}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Priority")} value={f.priority} onChange={set("priority")} sx={{ minWidth: 130 }}><MenuItem value="">{tx("All")}</MenuItem>{(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
    </>
  ) : null;
  const toggleSx = { px: 0.9, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const dist = distView === "type" ? [entries(data?.by_type, "woType", lookups?.wo_types), TYPE_COLORS]
    : distView === "priority" ? [entries(data?.by_priority, "priority", ["HIGH", "MEDIUM", "LOW"]), PRIORITY_COLORS]
      : [entries(data?.by_asset_type, "assetType", ["MACHINE", "EQUIPMENT", "MOLD", "TOOL"]), ASSET_COLORS];
  const trend = trendView === "mttr" ? (data?.mttr_trend || []).map((d) => [d.date, d.mttr]) : (data?.downtime_trend || []).map((d) => [d.date, d.hours]);

  return (
    <MaintFrame fit page={page} title={tx("Maintenance History")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} filters={filters}
      toolbar={<>
        <TextField size="small" type="date" label={tx("Date from")} value={range.from} onChange={(e) => setRange((o) => ({ ...o, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
        <TextField size="small" type="date" label={tx("Date to")} value={range.to} onChange={(e) => setRange((o) => ({ ...o, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 150 }} />
        <FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
      </>}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(4, minmax(0,1fr))", xl: "repeat(7, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Maintenance")} value={num(k.total)} sub={k.total_prev ? `${vsPrev(k.total, k.total_prev)} ${tx("vs previous period")}` : ""} icon={ClassOutlinedIcon} onClick={() => setF((o) => ({ ...o, type: "" }))} />
            <KpiTile tone="success" title={tx("Completed")} value={num(k.completed)} sub={money(k.cost)} icon={AssignmentTurnedInOutlinedIcon} />
            <KpiTile tone="accent" title={tx("Preventive Maintenance")} value={num(k.preventive)} sub={pct(k.preventive, k.total)} icon={EventRepeatOutlinedIcon} />
            <KpiTile tone="warning" title={tx("Corrective Maintenance")} value={num(k.corrective)} sub={pct(k.corrective, k.total)} icon={BuildOutlinedIcon} />
            <KpiTile tone="danger" title={tx("Total Downtime (period)")} value={hhmmFromMinutes((k.downtime_hours || 0) * 60)} unit={tx("hours")} sub={k.downtime_prev ? `${vsPrev(k.downtime_hours, k.downtime_prev)} ${tx("vs previous period")}` : ""} icon={TimerOutlinedIcon} />
            <KpiTile tone="info" title={tx("MTTR (period)")} value={k.mttr != null ? num(k.mttr, 2) : EMPTY} unit={tx("hours")} sub={k.mttr_prev != null ? `${vsPrev(k.mttr, k.mttr_prev)} ${tx("vs previous period")}` : ""} icon={ScheduleOutlinedIcon} />
            <KpiTile tone="primary" title={tx("PM Compliance")} value={k.pm_compliance != null ? num(k.pm_compliance, 1) : EMPTY} unit={k.pm_compliance != null ? "%" : ""} sub={`${dateText(data.period.from)} – ${dateText(data.period.to)}`} icon={VerifiedUserOutlinedIcon} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,0.85fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Maintenance History List")} action={<Typography variant="caption" color="text.secondary">{items.length} {tx("rows")}</Typography>} />
              {items.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(10, 7.5, 14, 9, 13, 10.5, 11, 6, 6, 6, 7) }}>
                    <TableHead><TableRow>
                      <TableCell>{tx("WO No.")}</TableCell><TableCell>{tx("Date")}</TableCell><TableCell>{tx("Asset / Tool")}</TableCell><TableCell align="center">{tx("Maintenance Type")}</TableCell>
                      <TableCell>{tx("Work Type")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell>{tx("Technician")}</TableCell><TableCell>{tx("Start Time")}</TableCell>
                      <TableCell>{tx("End Time")}</TableCell><TableCell align="right">{tx("Downtime")}</TableCell><TableCell align="right">{tx("Cost")}</TableCell>
                    </TableRow></TableHead>
                    <TableBody>{items.map((w) => (
                      <TableRow key={w.id} hover selected={w.id === selectedId} onClick={() => setParams({ wo: String(w.id) })} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{w.wo_no}</TableCell><TableCell>{dateText(w.completed_at)}</TableCell>
                        <TableCell title={`${w.asset_code} · ${w.asset_name} · ${label("assetType", w.asset_type)}`}>
                          <Box component="b" sx={{ color: assetPath(w.asset_type, w.asset_id) ? "#1570EF" : undefined, cursor: "pointer" }}
                            onClick={(e) => { const path = assetPath(w.asset_type, w.asset_id); if (path) { e.stopPropagation(); navigate(path); } }}>{w.asset_code}</Box> · {w.asset_name}</TableCell>
                        <TableCell align="center"><TypePill value={w.wo_type} /></TableCell>
                        <TableCell title={w.task_name}>{w.task_name}</TableCell>
                        <TableCell align="center"><WoStatusPill value={w.status} /></TableCell><TableCell title={who(w.technician)}>{who(w.technician)}</TableCell>
                        <TableCell>{w.actual_start ? hhmm(w.actual_start) : EMPTY}</TableCell><TableCell>{w.actual_finish ? hhmm(w.actual_finish) : EMPTY}</TableCell>
                        <TableCell align="right">{hhmmFromMinutes(w.downtime_actual_minutes)}</TableCell><TableCell align="right">{num(w.total_cost)}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Maintenance Detail")} />
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1.25 }}>
                <WorkOrderPanel woId={selectedId} lookups={lookups} request={request} actor={actor} canEdit={canEdit} notify={notify} navigate={navigate} readOnly onChanged={() => load({ silent: true })} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={panelSx}>
              <Head title={distView === "type" ? tx("Maintenance by Type") : distView === "priority" ? tx("Maintenance by Priority") : tx("Maintenance by Asset Type")} action={(
                <ToggleButtonGroup exclusive size="small" value={distView} onChange={(e, v) => v && setDistView(v)}>
                  <ToggleButton value="asset" sx={toggleSx}>{tx("Asset type")}</ToggleButton>
                  <ToggleButton value="type" sx={toggleSx}>{tx("Type")}</ToggleButton>
                  <ToggleButton value="priority" sx={toggleSx}>{tx("Priority")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {dist[0].length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: "100%" }}><DonutCard entries={dist[0]} colors={dist[1]} dark={dark} axisColor={axisColor} height={140} size={130} /></Box>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Top Downtime Assets")} />
              {data.top_downtime.length ? (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                  {data.top_downtime.map(([a, h]) => (
                    <Box key={a} sx={{ display: "grid", gridTemplateColumns: "80px 1fr 48px", gap: 1, alignItems: "center", cursor: "pointer" }} onClick={() => setF((o) => ({ ...o, asset: o.asset === a ? "" : a }))}>
                      <Typography variant="caption" fontWeight={700} noWrap>{a}</Typography>
                      <LinearProgress variant="determinate" value={(h / topMax) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "#1570EF" } }} />
                      <Typography variant="caption" fontWeight={800} align="right">{hhmmFromMinutes(h * 60)}</Typography>
                    </Box>
                  ))}
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={trendView === "mttr" ? tx("MTTR Trend") : tx("Downtime Trend")} action={(
                <ToggleButtonGroup exclusive size="small" value={trendView} onChange={(e, v) => v && setTrendView(v)}>
                  <ToggleButton value="downtime" sx={toggleSx}>{tx("Downtime")}</ToggleButton>
                  <ToggleButton value="mttr" sx={toggleSx}>MTTR</ToggleButton>
                </ToggleButtonGroup>
              )} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart key={trendView} type="line" height="100%" series={[{ name: trendView === "mttr" ? "MTTR" : tx("Downtime"), data: trend.map(([, v]) => v) }]} options={{
                  ...base, colors: [trendView === "mttr" ? "#475467" : "#1570EF"], stroke: { width: 2 }, markers: { size: 2 },
                  xaxis: { ...base.xaxis, categories: trend.map(([d]) => dateText(d).slice(0, 5)), tickAmount: 5 },
                  yaxis: { min: 0, tickAmount: 3, labels: { ...base.yaxis.labels, formatter: (v) => num(v, trendView === "mttr" ? 1 : 0) } },
                  tooltip: { ...base.tooltip, y: { formatter: (v) => (v == null ? EMPTY : `${num(v, 2)} h`) } } }} />
              </Box>
            </Paper>
            <Box sx={{ display: "flex", minHeight: 0, "& > *": { flex: 1 } }}><QuickCard title={tx("Quick Actions")} actions={quick} columns={3} /></Box>
          </Box>
          {dialog?.type === "wo" ? <WoDialog mode="create" lookups={lookups} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load({ silent: true }); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
