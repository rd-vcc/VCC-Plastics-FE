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
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, panelSx } from "../../shared/onePage";
import { MACHINE_COLORS } from "../../MachineEquipment/machineUi";
import { label, tx, txs } from "../maintLocales";
import { DonutCard, MaintFrame, useMaintData, useMaintPage } from "../maintPage";
import { COST_COLORS, MAINT_API, PLAN_STATUS_COLORS, PlanStatusPill, PriorityPill, RequestDialog, TypePill, WoDialog, assetPath, dateText, moneyShort, woPath } from "../maintUi";

const vs = (a, b) => {
  if (a == null || b == null || !b) return tx("vs last month");
  return `${a >= b ? "↑" : "↓"} ${num(Math.abs(((a - b) / b) * 100), 1)}% ${tx("vs last month")}`;
};

export default function MaintenanceOverview() {
  const page = useMaintPage();
  const { navigate, dark, axisColor, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [dialog, setDialog] = useState(null);
  const { data, loading, lastUpdate, live, setLive, load } = useMaintData(page, `${MAINT_API}/overview`, { interval: 60000, paused: Boolean(dialog) });
  const k = data?.kpis || {};
  const eq = data?.equipment_status || {};
  const eqEntries = ["RUNNING", "IDLE", "DOWN", "MAINTENANCE", "OFFLINE"].map((s) => [s, eq[s] || 0, label("machineStatus", s)]).filter(([, n]) => n);
  const w = data?.work || {};
  const costEntries = data ? Object.entries(data.cost_breakdown).map(([c, v]) => [c, v, label("cost", c)]).filter(([, v]) => v) : [];
  const exportCsv = () => downloadExcel("maintenance-overdue.csv", ["WO", "Asset", "Type", "Priority", "Overdue days", "Technician"],
    (data?.overdue || []).map((o) => [o.wo_no, o.asset_code, o.wo_type, o.priority, o.overdue_days, o.technician]));
  const quick = [
    [txs("New request (short)", "Create Maintenance Request"), NoteAddOutlinedIcon, "#1570EF", () => setDialog({ type: "request" }), !canEdit],
    [txs("New WO (short)", "Create Work Order"), AddTaskOutlinedIcon, "#12B76A", () => setDialog({ type: "wo" }), !canEdit],
    [txs("PM calendar (short)", "PM Calendar"), CalendarMonthOutlinedIcon, "#F79009", () => navigate("/maintenance-management/planning"), false],
    [txs("Equipment (short)", "Equipment List"), PrecisionManufacturingOutlinedIcon, "#7A5AF8", () => navigate("/machine-equipment/machine-monitoring"), false],
    [txs("Spare parts (short)", "Spare Parts Availability"), SettingsOutlinedIcon, "#0E9384", () => notify("info", tx("Spare parts module is not live yet.")), false],
    [txs("Reports (short)", "Reports"), SummarizeOutlinedIcon, "#F04438", () => navigate("/maintenance-management/history"), false],
  ];
  const workTiles = [
    [tx("Planned PM"), w.planned_pm, CalendarMonthOutlinedIcon, "#1570EF", "/maintenance-management/planning"], [tx("Preventive"), w.preventive, EventRepeatOutlinedIcon, "#2E90FA", "/maintenance-management/machine-equipment-maintenance"],
    [tx("Corrective"), w.corrective, BuildCircleOutlinedIcon, "#F04438", "/maintenance-management/machine-equipment-maintenance"], [tx("In Progress"), w.in_progress, SettingsOutlinedIcon, "#1570EF", "/maintenance-management/machine-equipment-maintenance"],
    [tx("Completed"), w.completed, CheckCircleOutlineIcon, "#12B76A", "/maintenance-management/history"], [tx("Pending"), w.pending, HourglassEmptyOutlinedIcon, "#667085", "/maintenance-management/machine-equipment-maintenance"],
  ];
  const base = chartBase(dark, axisColor);
  const empty = <EmptyBody text={tx("No data.")} />;

  return (
    <MaintFrame fit page={page} title={tx("Maintenance Overview")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Overall Equipment Effectiveness")} value={k.oee != null ? num(k.oee, 1) : EMPTY} unit={k.oee != null ? "%" : ""} sub={tx("today")} icon={SpeedOutlinedIcon} onClick={() => navigate("/machine-equipment/machine-monitoring")} />
            <KpiTile tone="success" title={tx("PM Compliance")} value={k.pm_compliance != null ? num(k.pm_compliance, 1) : EMPTY} unit={k.pm_compliance != null ? "%" : ""} sub={vs(k.pm_compliance, k.pm_compliance_prev)} icon={VerifiedUserOutlinedIcon} onClick={() => navigate("/maintenance-management/planning")} />
            <KpiTile tone="warning" title={tx("Maintenance Cost (MTD)")} value={moneyShort(k.cost)} unit={k.currency} sub={vs(k.cost, k.cost_prev)} icon={PaidOutlinedIcon} onClick={() => navigate("/maintenance-management/history")} />
            <KpiTile tone="danger" title={tx("Breakdown (MTD)")} value={num(k.breakdown)} unit={tx("cases")} sub={vs(k.breakdown, k.breakdown_prev)} icon={ReportProblemOutlinedIcon} onClick={() => navigate("/maintenance-management/machine-equipment-maintenance")} />
            <KpiTile tone="accent" title={tx("MTTR (MTD)")} value={k.mttr != null ? num(k.mttr, 2) : EMPTY} unit={tx("hour")} sub={vs(k.mttr, k.mttr_prev)} icon={TimerOutlinedIcon} onClick={() => navigate("/maintenance-management/history")} />
            <KpiTile tone="info" title={tx("MTBF (MTD)")} value={k.mtbf != null ? num(k.mtbf, 1) : EMPTY} unit={tx("hour")} sub={k.mtbf_prev != null ? vs(k.mtbf, k.mtbf_prev) : `${k.failures} ${tx("cases")}`} icon={TimerOutlinedIcon} onClick={() => navigate("/maintenance-management/history")} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "repeat(3, minmax(0,1fr))" } }}>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Equipment Status Summary")} />
              {eqEntries.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer" }} onClick={() => navigate("/machine-equipment/machine-monitoring")}>
                  <DonutCard entries={eqEntries} colors={MACHINE_COLORS} dark={dark} axisColor={axisColor} height={130} size={120} />
                  <Stack direction="row" sx={{ gap: 1.5, px: 1.5, pb: 1, flexWrap: "wrap" }}>
                    <Typography variant="caption">{tx("Molds in maintenance / repair")}: <b>{data.mold_status.IN_MAINTENANCE || 0} / {data.mold_status.IN_REPAIR || 0}</b></Typography>
                    <Typography variant="caption">{tx("Tools in maintenance")}: <b>{data.tool_status.IN_MAINTENANCE || 0}</b></Typography>
                  </Stack>
                </Box>
              ) : empty}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Maintenance Work Summary (Today)")} />
              <Box sx={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gridAutoRows: "1fr", gap: 0.75, px: 1.25, pb: 1.25 }}>
                {workTiles.map(([t, n, Icon, color, path]) => (
                  <Stack key={t} spacing={0.25} onClick={() => navigate(path)} sx={{ justifyContent: "center", border: 1, borderColor: "divider", borderRadius: 1.5, px: 1, py: 0.5, minWidth: 0, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", minWidth: 0 }}><Icon sx={{ fontSize: 15, color }} /><Typography variant="caption" color="text.secondary" noWrap>{t}</Typography></Stack>
                    <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1, color }}>{n ?? 0}</Typography>
                  </Stack>
                ))}
              </Box>
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Top Overdue Maintenance")} action={<Typography variant="caption" color="text.secondary">{data.overdue.length}</Typography>} />
              {data.overdue.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(30, 22, 26, 22) }}>
                    <TableHead><TableRow><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Equipment")}</TableCell><TableCell>{tx("Overdue")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.overdue.map((o) => (
                      <TableRow key={o.id} hover onClick={() => navigate(woPath(o))} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{o.wo_no}</TableCell><TableCell>{o.asset_code}</TableCell>
                        <TableCell sx={{ color: "#F04438", fontWeight: 700 }}>{o.overdue_days ? tx("{n} days overdue", { n: o.overdue_days }) : tx("today")}</TableCell>
                        <TableCell align="center"><PriorityPill value={o.priority} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : empty}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Maintenance Cost Breakdown (MTD)")} />
              {costEntries.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => navigate("/maintenance-management/history")}>
                  <Box sx={{ width: "100%" }}><DonutCard entries={costEntries} colors={COST_COLORS} dark={dark} axisColor={axisColor} height={140} size={130} centerLabel={k.currency} formatter={(v) => moneyShort(v)} /></Box>
                </Box>
              ) : empty}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 3" } }}>
              <Head title={tx("Maintenance Trend")} action={<Stack direction="row" spacing={1.5}><Dot color="#12B76A" text={tx("Planned PM")} /><Dot color="#F04438" text={tx("Corrective")} /><Dot color="#1570EF" text={tx("Total")} /></Stack>} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="line" height="100%" series={[{ name: tx("Planned PM"), data: data.trend.map((t) => t.planned_pm) }, { name: tx("Corrective"), data: data.trend.map((t) => t.corrective) }, { name: tx("Total"), data: data.trend.map((t) => t.total) }]} options={{
                  ...base, colors: ["#12B76A", "#F04438", "#1570EF"], stroke: { width: 2, curve: "straight" }, markers: { size: 3 },
                  xaxis: { ...base.xaxis, categories: data.trend.map((t) => `${t.week} (${dateText(t.from).slice(0, 5)})`) },
                  yaxis: { min: 0, forceNiceScale: true, tickAmount: 4, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "3 / 5" } }}>
              <Head title={tx("Upcoming Maintenance (Next 7 Days)")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate("/maintenance-management/planning")}>{tx("View all")}</Typography>} />
              {data.upcoming.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(14, 22, 22, 18, 24) }}>
                    <TableHead><TableRow><TableCell>{tx("Date")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Equipment")}</TableCell><TableCell align="center">{tx("Type")}</TableCell><TableCell align="center">{tx("Status")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.upcoming.map((u) => (
                      <TableRow key={u.plan_id} hover onClick={() => navigate(u.wo_id ? woPath({ asset_type: u.asset_type, id: u.wo_id }) : `/maintenance-management/planning?plan=${u.plan_id}`)} sx={{ cursor: "pointer" }}>
                        <TableCell sx={{ color: PLAN_STATUS_COLORS[u.status] === "#F04438" ? "#F04438" : undefined }}>{dateText(u.date)}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{u.wo_no || u.plan_no}</TableCell><TableCell>{u.asset_code}</TableCell>
                        <TableCell align="center"><TypePill value={u.type} /></TableCell><TableCell align="center"><PlanStatusPill value={u.status} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : empty}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" } }}>
              <Head title={tx("Equipment Health Alerts")} action={<Typography variant="caption" color="text.secondary">{data.alerts.length}</Typography>} />
              {data.alerts.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(14, 12, 52, 12, 10) }}>
                    <TableHead><TableRow><TableCell>{tx("Equipment")}</TableCell><TableCell>{tx("Type")}</TableCell><TableCell>{tx("Alert")}</TableCell><TableCell>{tx("Time")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.alerts.map((a, i) => {
                      const path = assetPath(a.asset_type, a.asset_id);
                      const text = a.kind === "ALARM" || a.message !== a.kind ? a.message : label("alertKind", a.kind);
                      return (
                        <TableRow key={i} hover onClick={() => path && navigate(path)} sx={{ cursor: path ? "pointer" : "default" }}>
                          <TableCell sx={{ fontWeight: 700, color: path ? "#1570EF" : undefined }}>{a.asset_code}</TableCell><TableCell>{label("assetType", a.asset_type)}</TableCell>
                          <TableCell title={text}>{text}</TableCell>
                          <TableCell>{a.time ? (String(a.time).length > 10 ? ddmmhhmm(a.time) : dateText(a.time)) : EMPTY}</TableCell>
                          <TableCell align="center"><PriorityPill value={a.priority} /></TableCell></TableRow>
                      );
                    })}</TableBody>
                  </Table>
                </Box>
              ) : empty}
            </Paper>
            <Box sx={{ gridColumn: { lg: "4" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
            </Box>
          </Box>
          {dialog?.type === "request" ? <RequestDialog lookups={lookups} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load({ silent: true }); }} /> : null}
          {dialog?.type === "wo" ? <WoDialog mode="create" lookups={lookups} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); load({ silent: true }); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
