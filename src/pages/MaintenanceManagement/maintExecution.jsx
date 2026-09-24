import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Box, Button, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
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
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { KpiCardGroup } from "../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../MaterialManagement/materialUi";
import { EMPTY, Head, btn, cardSx, hhmm, num } from "../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "./maintLocales";
import { DonutCard, MaintFrame, useMaintData, useMaintPage } from "./maintPage";
import {
  SEL,
  AssetCell, CONDITION_COLORS, MAINT_API, MiniProgress, PRIORITY_COLORS, PriorityPill, QuickActionGrid, TYPE_COLORS, TypePill, WO_STATUS_COLORS, WoDialog, WoStatusPill, WorkOrderPanel,
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
  const { navigate, params, setParams, dark, axisColor, grid, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [dialog, setDialog] = useState(null);
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
  const entries = (obj, group, keys, colors) => (keys || Object.keys(obj || {})).map((key) => [key, obj?.[key] || 0, label(group, key)]).filter(([, n]) => n);
  const exportCsv = () => downloadCsv(`maintenance-${scope.toLowerCase()}.csv`, ["WO No.", "Type", "Asset", "Task", "Priority", "Status", "Technician", "Planned start", "Planned finish", "Actual start", "Progress %", "Downtime (min)", "Cost"],
    items.map((w) => [w.wo_no, w.wo_type, w.asset_code, w.task_name, w.priority, w.status, w.technician, w.planned_start, w.planned_finish, w.actual_start, w.progress, w.downtime_actual_minutes, w.total_cost]));
  const sel = all.find((w) => w.id === selectedId);
  const quick = [
    [tx("Create Work Order"), AddTaskOutlinedIcon, "#1570EF", () => setDialog({ type: "wo" }), !canEdit],
    [tx("PM Calendar"), CalendarMonthOutlinedIcon, "#F79009", () => navigate("/maintenance-management/planning"), false],
    ...(scope === "MOLD" ? [
      [tx("Mold Detail"), ViewInArOutlinedIcon, "#7A5AF8", () => navigate(`/mold-management/detail${sel ? `?mold=${sel.asset_id}` : ""}`), false],
      [tx("Mold Shot Counter"), SpeedOutlinedIcon, "#0E9384", () => navigate(`/mold-management/shot-counter${sel ? `?mold=${sel.asset_id}` : ""}`), false],
      [tx("Mold Location"), LocationOnOutlinedIcon, "#12B76A", () => navigate(`/mold-management/location${sel ? `?mold=${sel.asset_id}` : ""}`), false],
    ] : scope === "TOOL" ? [
      [tx("Tool Calibration"), VerifiedUserOutlinedIcon, "#0E9384", () => navigate("/maintenance-management/planning"), false],
    ] : [
      [tx("Equipment List"), PrecisionManufacturingOutlinedIcon, "#7A5AF8", () => navigate("/machine-equipment/machine-monitoring"), false],
      [tx("Technician List"), GroupsOutlinedIcon, "#1570EF", () => setF((o) => ({ ...o, technician: "" })), false],
    ]),
    [tx("Spare Parts Check"), SettingsOutlinedIcon, "#12B76A", () => notify("info", tx("Spare parts module is not live yet.")), false],
    [tx("Work Order Kanban"), ViewKanbanOutlinedIcon, "#1570EF", () => setF((o) => ({ ...o, status: "" })), false],
    [tx("Downtime Management"), ReportProblemOutlinedIcon, "#F04438", () => navigate("/machine-equipment/downtime-management"), false],
    [tx("Reports"), SummarizeOutlinedIcon, "#F04438", () => navigate("/maintenance-management/history"), false],
  ];
  const workloadMax = Math.max(1, ...(data?.workload || []).map(([, n]) => n));
  const selSx = { minWidth: 130 };
  const moldAsset = detail?.wo?.id === selectedId ? detail.asset : null;
  const comps = detail?.wo?.id === selectedId ? detail.components : [];
  const compCounts = ["GOOD", "MONITOR", "ATTENTION", "CRITICAL", "NOT_CHECKED"].map((c) => [c, comps.filter((x) => x.condition_code === c).length, label("condition", c)]).filter(([, n]) => n);

  const downtimeCard = (
    <Paper elevation={0} sx={cardSx}>
      <Head title={tx(scope === "MACHINE" ? "Downtime (Today)" : cfg.downtimeKpi)} />
      <Box sx={{ px: 1.5, pb: 1.5 }}>
        <Typography variant="caption" color="text.secondary">{tx("Total Downtime")}</Typography>
        <Typography variant="h5" fontWeight={800} sx={{ color: "#1570EF" }}>{hhmmFromMinutes((k.downtime_today_hours || 0) * 60)}</Typography>
        <Typography variant="caption" color="text.secondary">{tx("hours")}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>{tx("Breakdown Downtime")}</Typography>
        <Typography variant="h6" fontWeight={800} sx={{ color: "#F04438" }}>{hhmmFromMinutes((k.breakdown_downtime_today_hours || 0) * 60)}</Typography>
      </Box>
    </Paper>
  );
  const mttrCard = (
    <Paper elevation={0} sx={cardSx}>
      <Head title={tx("MTTR (7 days)")} />
      <Box sx={{ px: 1.5 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: "#1570EF" }}>{k.mttr_7d != null ? num(k.mttr_7d, 2) : EMPTY}</Typography>
        <Typography variant="caption" color="text.secondary">{tx("hours")} · {tx("MTTR (Today)")}: {k.mttr_today != null ? num(k.mttr_today, 2) : EMPTY}</Typography>
      </Box>
      <Chart type="line" height={90} series={[{ name: "MTTR", data: (data?.mttr_trend || []).map((m) => m.mttr) }]} options={{
        chart: { sparkline: { enabled: true }, background: "transparent" }, colors: ["#12B76A"], stroke: { width: 2 }, markers: { size: 2 }, tooltip: { theme: dark ? "dark" : "light", x: { show: false }, y: { formatter: (v) => (v == null ? EMPTY : `${num(v, 2)} h`) } } }} />
    </Paper>
  );

  return (
    <MaintFrame page={page} title={tx(cfg.title)} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system}
      actions={canEdit ? <Button startIcon={<AddIcon />} onClick={() => setDialog({ type: "wo" })} sx={btn("primary")}>{tx("Create Work Order")}</Button> : null}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
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
          </Box>

          <Paper elevation={0} sx={{ ...cardSx, p: 1.25, mb: 1.5 }}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
              <TextField select size="small" slotProps={SEL} label={tx("Type")} value={f.type} onChange={set("type")} sx={selSx}><MenuItem value="">{tx("All")}</MenuItem>
                {(lookups?.wo_types || []).filter((t) => t !== "CALIBRATION" || scope === "TOOL").map((t) => <MenuItem key={t} value={t}>{label("woType", t)}</MenuItem>)}</TextField>
              <TextField select size="small" slotProps={SEL} label={tx("Status")} value={f.status} onChange={set("status")} sx={selSx}><MenuItem value="">{tx("All")}</MenuItem>
                {["OVERDUE", "RELEASED", "ASSIGNED", "IN_PROGRESS", "PAUSED", "VERIFICATION", "COMPLETED", "CLOSED", "CANCELLED"].map((s) => <MenuItem key={s} value={s}>{label("woStatus", s)}</MenuItem>)}</TextField>
              <TextField select size="small" slotProps={SEL} label={tx("Priority")} value={f.priority} onChange={set("priority")} sx={selSx}><MenuItem value="">{tx("All")}</MenuItem>
                {(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
              <TextField select size="small" slotProps={SEL} label={tx(scope === "MOLD" ? "Mold No." : scope === "TOOL" ? "Tool No." : "Asset / Equipment")} value={f.asset} onChange={set("asset")} sx={{ minWidth: 150 }}><MenuItem value="">{tx("All")}</MenuItem>
                {assets.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}</TextField>
              <TextField select size="small" slotProps={SEL} label={tx("Technician")} value={f.technician} onChange={set("technician")} sx={{ minWidth: 150 }}><MenuItem value="">{tx("All")}</MenuItem>
                {techs.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}</TextField>
              <TextField size="small" placeholder={tx("Search...")} value={f.q} onChange={set("q")} sx={{ width: 220 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
            </Stack>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.5fr) minmax(0,1.1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx(cfg.listTitle)} subtitle={`(${items.length})`} />
              <Box sx={{ px: 1, pb: 1, height: 520, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow>
                    <TableCell>{tx("WO No.")}</TableCell><TableCell align="center">{tx("Type")}</TableCell>
                    <TableCell>{tx(scope === "MOLD" ? "Mold No." : scope === "TOOL" ? "Tool No." : "Asset / Equipment")}</TableCell>
                    {scope === "MOLD" ? <TableCell align="right">{tx("Shot Count")}</TableCell> : null}
                    <TableCell>{tx("Task / Work")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell><TableCell align="center">{tx("Status")}</TableCell>
                    <TableCell>{tx("Technician")}</TableCell><TableCell>{tx("Start Time")}</TableCell><TableCell>{tx("Due Time")}</TableCell>
                    {scope === "MACHINE" ? <TableCell align="right">{tx("Est. Downtime")}</TableCell> : null}
                    {scope === "MOLD" ? <TableCell>{tx("Plan / Request")}</TableCell> : null}
                    <TableCell>{tx("Progress")}</TableCell>
                  </TableRow></TableHead>
                  <TableBody>{items.map((w) => (
                    <TableRow key={w.id} hover selected={w.id === selectedId} onClick={() => setParams({ wo: String(w.id) })} sx={{ cursor: "pointer" }}>
                      <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{w.wo_no}</TableCell><TableCell align="center"><TypePill value={w.wo_type} /></TableCell>
                      <TableCell sx={{ maxWidth: 170 }}><AssetCell code={w.asset_code} name={w.asset_name} onClick={assetPath(w.asset_type, w.asset_id) ? () => navigate(assetPath(w.asset_type, w.asset_id)) : undefined} /></TableCell>
                      {scope === "MOLD" ? <TableCell align="right">{num(w.asset_shot)}</TableCell> : null}
                      <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{w.task_name}</TableCell>
                      <TableCell align="center"><PriorityPill value={w.priority} /></TableCell>
                      <TableCell align="center"><WoStatusPill value={w.overdue && !["VERIFICATION"].includes(w.status) ? "OVERDUE" : w.status} /></TableCell>
                      <TableCell>{w.technician || EMPTY}</TableCell>
                      <TableCell>{w.actual_start ? hhmm(w.actual_start) : EMPTY}</TableCell>
                      <TableCell sx={{ color: w.overdue ? "#F04438" : undefined }}>{w.planned_finish ? `${dateText(w.planned_finish).slice(0, 5)} ${hhmm(w.planned_finish)}` : dateText(w.due_date)}</TableCell>
                      {scope === "MACHINE" ? <TableCell align="right">{hhmmFromMinutes(w.est_downtime_minutes ?? w.est_minutes)}</TableCell> : null}
                      {scope === "MOLD" ? <TableCell sx={{ color: "#1570EF" }}>{w.plan_no || w.request_no || EMPTY}</TableCell> : null}
                      <TableCell><MiniProgress value={w.progress} /></TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
                {!items.length ? <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>{tx("No data.")}</Typography> : null}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx(cfg.panelTitle)} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                <WorkOrderPanel woId={selectedId} lookups={lookups} request={request} actor={actor} canEdit={canEdit} notify={notify} navigate={navigate} onChanged={() => load({ silent: true })} />
              </Box>
            </Paper>
          </Box>

          {scope === "MOLD" ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0,1fr))", xl: "minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.2fr) minmax(0,0.9fr) minmax(0,0.9fr)" }, gap: 1.5, mb: 1.5 }}>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Shot Count & Life Remaining")} subtitle={moldAsset ? `(${moldAsset.code})` : ""} />
                {moldAsset ? (
                  <Box sx={{ display: "grid", gridTemplateColumns: "130px 1fr", alignItems: "center", px: 1.5, pb: 1.5, gap: 1 }}>
                    <Chart type="radialBar" height={150} series={[Math.max(100 - (moldAsset.life_used_pct || 0), 0)]} options={{
                      chart: { background: "transparent", sparkline: { enabled: true } }, colors: [(moldAsset.life_used_pct || 0) >= 90 ? "#F04438" : (moldAsset.life_used_pct || 0) >= 75 ? "#F79009" : "#12B76A"],
                      plotOptions: { radialBar: { hollow: { size: "60%" }, track: { background: dark ? "#263244" : "#EEF2F6" }, dataLabels: { name: { offsetY: 16, fontSize: "10px", color: axisColor },
                        value: { offsetY: -10, fontSize: "18px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: (v) => `${num(v, 0)}%` } } } }, labels: [tx("Remaining Life")] }} />
                    <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.4 }}>
                      {[[tx("Current Shot Count"), num(moldAsset.current_shot)], [tx("Life Limit"), num(moldAsset.design_shot)], [tx("Remaining Shots"), num(moldAsset.remaining_shot)], [tx("Expected Replace Date"), dateText(moldAsset.eol_date)]].map(([a, b]) => [
                        <Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>, <Typography key={`${a}v`} variant="caption" fontWeight={700} align="right">{b}</Typography>])}
                    </Box>
                  </Box>
                ) : <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>{tx("Select a row in the list.")}</Typography>}
              </Paper>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Mold Health")} />
                {moldAsset ? (
                  <Box sx={{ px: 1, pb: 1 }}>
                    <Chart type="radialBar" height={170} series={[moldAsset.health || 0]} options={{
                      chart: { background: "transparent", sparkline: { enabled: true } }, colors: [moldAsset.health >= 80 ? "#12B76A" : moldAsset.health >= 60 ? "#F79009" : "#F04438"],
                      plotOptions: { radialBar: { startAngle: -110, endAngle: 110, hollow: { size: "62%" }, track: { background: dark ? "#263244" : "#EEF2F6" },
                        dataLabels: { name: { offsetY: 20, fontSize: "11px", color: axisColor }, value: { offsetY: -12, fontSize: "20px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: (v) => `${num(v, 0)} / 100` } } } },
                      labels: [tx("Health Score")] }} />
                  </Box>
                ) : null}
              </Paper>
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Component Status")} />
                <DonutCard entries={compCounts} colors={CONDITION_COLORS} dark={dark} axisColor={axisColor} />
              </Paper>
              {downtimeCard}
              {mttrCard}
            </Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(3, minmax(0,1fr))" }, gap: 1.5, mb: 1.5 }}>
              <Paper elevation={0} sx={cardSx}><Head title={tx("Work Orders by Status")} />
                <DonutCard entries={entries(data.by_status, "woStatus", ["IN_PROGRESS", "PAUSED", "VERIFICATION", "COMPLETED", "RELEASED", "ASSIGNED", "OVERDUE", "CLOSED", "CANCELLED"])} colors={WO_STATUS_COLORS} dark={dark} axisColor={axisColor} /></Paper>
              <Paper elevation={0} sx={cardSx}><Head title={tx("Work Orders by Type")} /><DonutCard entries={entries(data.by_type, "woType", lookups?.wo_types)} colors={TYPE_COLORS} dark={dark} axisColor={axisColor} /></Paper>
              <Paper elevation={0} sx={cardSx}><Head title={tx("Work Orders by Priority")} /><DonutCard entries={entries(data.by_priority, "priority", ["HIGH", "MEDIUM", "LOW"])} colors={PRIORITY_COLORS} dark={dark} axisColor={axisColor} /></Paper>
              {downtimeCard}
              {mttrCard}
              <Paper elevation={0} sx={cardSx}>
                <Head title={tx("Technician Workload")} />
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  {!data.workload.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : data.workload.map(([t, n]) => (
                    <Box key={t} sx={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 1fr 20px", gap: 1, alignItems: "center", mb: 0.6, cursor: "pointer" }} onClick={() => setF((o) => ({ ...o, technician: o.technician === t ? "" : t }))}>
                      <Typography variant="caption" noWrap>{t}</Typography>
                      <LinearProgress variant="determinate" value={(n / workloadMax) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "#1570EF" } }} />
                      <Typography variant="caption" fontWeight={800} align="right">{n}</Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
          )}

          <Paper elevation={0} sx={cardSx}><Head title={tx("Quick Actions")} /><Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns="repeat(auto-fill, minmax(120px, 1fr))" /></Box></Paper>

          {dialog?.type === "wo" ? <WoDialog mode="create" lookups={lookups} scopeTypes={cfg.types} request={request} actor={actor} notify={notify} preset={{ wo_type: scope === "TOOL" ? "PM" : "CORRECTIVE" }}
            onClose={() => setDialog(null)} onSaved={(id) => { setDialog(null); load({ silent: true }); if (id) setParams({ wo: String(id) }); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
