import "./locales";
import { useState } from "react";
import Chart from "react-apexcharts";
import { Box, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, downloadCsv } from "../../MaterialManagement/materialUi";
import { EMPTY, Head, cardSx, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { MACHINE_COLORS } from "../../MachineEquipment/machineUi";
import { label, tx } from "../maintLocales";
import { DonutCard, MaintFrame, useMaintData, useMaintPage } from "../maintPage";
import { COST_COLORS, MAINT_API, PLAN_STATUS_COLORS, PlanStatusPill, PriorityPill, QuickActionGrid, RequestDialog, TypePill, WoDialog, assetPath, dateText, moneyShort, woPath } from "../maintUi";

const vs = (a, b) => {
  if (a == null || b == null || !b) return tx("vs last month");
  return `${a >= b ? "↑" : "↓"} ${num(Math.abs(((a - b) / b) * 100), 1)}% ${tx("vs last month")}`;
};

export default function MaintenanceOverview() {
  const page = useMaintPage();
  const { navigate, dark, axisColor, grid, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [dialog, setDialog] = useState(null);
  const { data, loading, lastUpdate, live, setLive, load } = useMaintData(page, `${MAINT_API}/overview`, { interval: 60000, paused: Boolean(dialog) });
  const k = data?.kpis || {};
  const eq = data?.equipment_status || {};
  const eqEntries = ["RUNNING", "IDLE", "DOWN", "MAINTENANCE", "OFFLINE"].map((s) => [s, eq[s] || 0, label("machineStatus", s)]).filter(([, n]) => n);
  const w = data?.work || {};
  const costEntries = data ? Object.entries(data.cost_breakdown).map(([c, v]) => [c, v, label("cost", c)]).filter(([, v]) => v) : [];
  const exportCsv = () => downloadCsv("maintenance-overdue.csv", ["WO", "Asset", "Type", "Priority", "Overdue days", "Technician"],
    (data?.overdue || []).map((o) => [o.wo_no, o.asset_code, o.wo_type, o.priority, o.overdue_days, o.technician]));
  const quick = [
    [tx("Create Maintenance Request"), NoteAddOutlinedIcon, "#1570EF", () => setDialog({ type: "request" }), !canEdit],
    [tx("Create Work Order"), AddTaskOutlinedIcon, "#12B76A", () => setDialog({ type: "wo" }), !canEdit],
    [tx("PM Calendar"), CalendarMonthOutlinedIcon, "#F79009", () => navigate("/maintenance-management/planning"), false],
    [tx("Equipment List"), PrecisionManufacturingOutlinedIcon, "#7A5AF8", () => navigate("/machine-equipment/machine-monitoring"), false],
    [tx("Spare Parts Availability"), SettingsOutlinedIcon, "#0E9384", () => notify("info", tx("Spare parts module is not live yet.")), false],
    [tx("Reports"), SummarizeOutlinedIcon, "#F04438", () => navigate("/maintenance-management/history"), false],
  ];
  const workTiles = [
    [tx("Planned PM"), w.planned_pm, CalendarMonthOutlinedIcon, "#1570EF", "/maintenance-management/planning"], [tx("Preventive"), w.preventive, EventRepeatOutlinedIcon, "#2E90FA", "/maintenance-management/machine-equipment-maintenance"],
    [tx("Corrective"), w.corrective, BuildCircleOutlinedIcon, "#F04438", "/maintenance-management/machine-equipment-maintenance"], [tx("In Progress"), w.in_progress, SettingsOutlinedIcon, "#1570EF", "/maintenance-management/machine-equipment-maintenance"],
    [tx("Completed"), w.completed, CheckCircleOutlineIcon, "#12B76A", "/maintenance-management/history"], [tx("Pending"), w.pending, HourglassEmptyOutlinedIcon, "#667085", "/maintenance-management/machine-equipment-maintenance"],
  ];

  return (
    <MaintFrame page={page} title={tx("Maintenance Overview")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system}>
      {data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Overall Equipment Effectiveness")} value={k.oee != null ? num(k.oee, 1) : EMPTY} unit={k.oee != null ? "%" : ""} sub={tx("today")} icon={SpeedOutlinedIcon} onClick={() => navigate("/machine-equipment/machine-monitoring")} />
              <KpiTile tone="success" title={tx("PM Compliance")} value={k.pm_compliance != null ? num(k.pm_compliance, 1) : EMPTY} unit={k.pm_compliance != null ? "%" : ""} sub={vs(k.pm_compliance, k.pm_compliance_prev)} icon={VerifiedUserOutlinedIcon} onClick={() => navigate("/maintenance-management/planning")} />
              <KpiTile tone="warning" title={tx("Maintenance Cost (MTD)")} value={moneyShort(k.cost)} unit={k.currency} sub={vs(k.cost, k.cost_prev)} icon={PaidOutlinedIcon} onClick={() => navigate("/maintenance-management/history")} />
              <KpiTile tone="danger" title={tx("Breakdown (MTD)")} value={num(k.breakdown)} unit={tx("cases")} sub={vs(k.breakdown, k.breakdown_prev)} icon={ReportProblemOutlinedIcon} onClick={() => navigate("/maintenance-management/machine-equipment-maintenance")} />
              <KpiTile tone="accent" title={tx("MTTR (MTD)")} value={k.mttr != null ? num(k.mttr, 2) : EMPTY} unit={tx("hour")} sub={vs(k.mttr, k.mttr_prev)} icon={TimerOutlinedIcon} onClick={() => navigate("/maintenance-management/history")} />
              <KpiTile tone="info" title={tx("MTBF (MTD)")} value={k.mtbf != null ? num(k.mtbf, 1) : EMPTY} unit={tx("hour")} sub={k.mtbf_prev != null ? vs(k.mtbf, k.mtbf_prev) : `${k.failures} ${tx("cases")}`} icon={TimerOutlinedIcon} onClick={() => navigate("/maintenance-management/history")} />
            </KpiCardGroup>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) minmax(0,1.3fr) minmax(0,1.3fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Equipment Status Summary")} />
              <Box sx={{ cursor: "pointer" }} onClick={() => navigate("/machine-equipment/machine-monitoring")}>
                <DonutCard entries={eqEntries} colors={MACHINE_COLORS} dark={dark} axisColor={axisColor} height={170} />
              </Box>
              <Stack direction="row" sx={{ gap: 2, px: 1.5, pb: 1.5, flexWrap: "wrap" }}>
                <Typography variant="caption">{tx("Molds in maintenance / repair")}: <b>{data.mold_status.IN_MAINTENANCE || 0} / {data.mold_status.IN_REPAIR || 0}</b></Typography>
                <Typography variant="caption">{tx("Tools in maintenance")}: <b>{data.tool_status.IN_MAINTENANCE || 0}</b></Typography>
              </Stack>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Maintenance Work Summary (Today)")} />
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, px: 1.5, pb: 1.5 }}>
                {workTiles.map(([t, n, Icon, color, path]) => (
                  <Stack key={t} direction="row" spacing={1} onClick={() => navigate(path)} sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 2, p: 1.25, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                    <Icon sx={{ fontSize: 30, color }} />
                    <Box><Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{t}</Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1, color }}>{n ?? 0}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>{tx("Work Orders")}</Typography></Box>
                  </Stack>
                ))}
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Top Overdue Maintenance")} />
              <Box sx={{ px: 1, pb: 1, maxHeight: 250, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Equipment")}</TableCell><TableCell>{tx("Overdue")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.overdue.map((o) => (
                    <TableRow key={o.id} hover onClick={() => navigate(woPath(o))} sx={{ cursor: "pointer" }}>
                      <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{o.wo_no}</TableCell><TableCell>{o.asset_code}</TableCell>
                      <TableCell sx={{ color: "#F04438", fontWeight: 700 }}>{o.overdue_days ? tx("{n} days overdue", { n: o.overdue_days }) : tx("today")}</TableCell>
                      <TableCell align="center"><PriorityPill value={o.priority} /></TableCell></TableRow>
                  ))}</TableBody>
                </Table>
                {!data.overdue.length ? <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>{tx("No data.")}</Typography> : null}
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.1fr) minmax(0,1.3fr) minmax(0,1.1fr)" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Maintenance Trend")} />
              <Box sx={{ px: 1, pb: 0.5 }}>
                <Chart type="line" height={230} series={[{ name: tx("Planned PM"), data: data.trend.map((t) => t.planned_pm) }, { name: tx("Corrective"), data: data.trend.map((t) => t.corrective) }, { name: tx("Total"), data: data.trend.map((t) => t.total) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#12B76A", "#F04438", "#1570EF"], stroke: { width: 2.5, curve: "straight" }, markers: { size: 4 },
                  xaxis: { categories: data.trend.map((t) => `${t.week} (${dateText(t.from).slice(0, 5)})`), labels: { style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } }, legend: { position: "top", labels: { colors: axisColor } }, grid, tooltip: { theme: dark ? "dark" : "light" } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Upcoming Maintenance (Next 7 Days)")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate("/maintenance-management/planning")}>{tx("View all")}</Typography>} />
              <Box sx={{ px: 1, pb: 1, maxHeight: 250, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Date")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Equipment")}</TableCell><TableCell align="center">{tx("Type")}</TableCell><TableCell align="center">{tx("Status")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.upcoming.map((u) => (
                    <TableRow key={u.plan_id} hover onClick={() => navigate(u.wo_id ? woPath({ asset_type: u.asset_type, id: u.wo_id }) : `/maintenance-management/planning?plan=${u.plan_id}`)} sx={{ cursor: "pointer" }}>
                      <TableCell sx={{ color: PLAN_STATUS_COLORS[u.status] === "#F04438" ? "#F04438" : undefined }}>{dateText(u.date)}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{u.wo_no || u.plan_no}</TableCell><TableCell>{u.asset_code}</TableCell>
                      <TableCell align="center"><TypePill value={u.type} /></TableCell><TableCell align="center"><PlanStatusPill value={u.status} /></TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Maintenance Cost Breakdown (MTD)")} />
              <Box sx={{ cursor: "pointer" }} onClick={() => navigate("/maintenance-management/history")}>
                <DonutCard entries={costEntries} colors={COST_COLORS} dark={dark} axisColor={axisColor} height={180} centerLabel={k.currency} formatter={(v) => moneyShort(v)} />
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1.4fr) minmax(0,1fr)" }, gap: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Equipment Health Alerts")} />
              <Box sx={{ px: 1, pb: 1, maxHeight: 230, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Equipment")}</TableCell><TableCell>{tx("Type")}</TableCell><TableCell>{tx("Alert")}</TableCell><TableCell>{tx("Time")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell></TableRow></TableHead>
                  <TableBody>{data.alerts.map((a, i) => {
                    const path = assetPath(a.asset_type, a.asset_id);
                    return (
                      <TableRow key={i} hover onClick={() => path && navigate(path)} sx={{ cursor: path ? "pointer" : "default" }}>
                        <TableCell sx={{ fontWeight: 700, color: path ? "#1570EF" : undefined }}>{a.asset_code}</TableCell><TableCell>{label("assetType", a.asset_type)}</TableCell>
                        <TableCell sx={{ whiteSpace: "normal" }}>{a.kind === "ALARM" || a.message !== a.kind ? a.message : label("alertKind", a.kind)}</TableCell>
                        <TableCell>{a.time ? (String(a.time).length > 10 ? ddmmhhmm(a.time) : dateText(a.time)) : EMPTY}</TableCell>
                        <TableCell align="center"><PriorityPill value={a.priority} /></TableCell></TableRow>
                    );
                  })}</TableBody>
                </Table>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Quick Actions")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}><QuickActionGrid actions={quick} columns="repeat(3, 1fr)" /></Box>
            </Paper>
          </Box>
          {dialog?.type === "request" ? <RequestDialog lookups={lookups} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load({ silent: true }); }} /> : null}
          {dialog?.type === "wo" ? <WoDialog mode="create" lookups={lookups} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load({ silent: true }); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
