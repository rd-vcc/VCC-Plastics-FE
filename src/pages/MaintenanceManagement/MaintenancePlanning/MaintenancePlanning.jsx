import "./locales";
import { useCallback, useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { Alert, Box, Button, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import HourglassTopOutlinedIcon from "@mui/icons-material/HourglassTopOutlined";
import PowerSettingsNewOutlinedIcon from "@mui/icons-material/PowerSettingsNewOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, btn, ddmmhhmm, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, panelSx, who } from "../../shared/onePage";
import { label, tx, txs } from "../maintLocales";
import { DonutCard, MaintFrame, useMaintData, useMaintPage } from "../maintPage";
import {
  SEL,
  ASSET_COLORS, AssetCell, InfoRows, MAINT_API, PRIORITY_COLORS, PlanDialog, PlanStatusPill, PriorityPill, Timeline, WoDialog, WoStatusPill,
  assetPath, dateText, dueText, hhmmFromMinutes, woPath,
} from "../maintUi";

const TABS = ["ALL", "DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "SHUTDOWN", "SHOT"];

export default function MaintenancePlanning() {
  const page = useMaintPage();
  const { navigate, params, setParams, dark, axisColor, tableSx, canEdit, lookups, request, actor, notify } = page;
  const [dialog, setDialog] = useState(() => (params.get("create") ? { type: "create", preset: { asset_type: params.get("asset_type"), asset_id: Number(params.get("asset_id")) || "" } } : null));
  const { data, loading, lastUpdate, live, setLive, load } = useMaintData(page, `${MAINT_API}/plans`, { interval: 60000, paused: Boolean(dialog) });
  const [tab, setTab] = useState("ALL");
  const [f, setF] = useState({ q: "", asset_type: "", status: "", active: "ACTIVE" });
  const [selectedId, setSelectedId] = useState(Number(params.get("plan")) || null);
  const [detail, setDetail] = useState(null);
  const [dtab, setDtab] = useState(0);
  const [showFilter, setShowFilter] = useState(false);
  const [distView, setDistView] = useState("asset");
  const set = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const all = data?.items || [];
  const items = useMemo(() => all.filter((p) => (tab === "ALL" || p.plan_type === tab) && (!f.asset_type || p.asset_type === f.asset_type || (f.asset_type === "MACHINE" && p.asset_type === "EQUIPMENT"))
    && (!f.status || p.plan_status === f.status) && (!f.active || (f.active === "ACTIVE" ? p.status === "ACTIVE" : p.status !== "ACTIVE"))
    && (!f.q || `${p.plan_no} ${p.asset_code} ${p.asset_name} ${p.task_name} ${p.technician || ""}`.toLowerCase().includes(f.q.toLowerCase()))), [all, tab, f]);
  const loadDetail = useCallback(() => { if (selectedId) request(`${MAINT_API}/plans/${selectedId}`).then(setDetail).catch(() => setDetail(null)); else setDetail(null); }, [selectedId, request]);
  useEffect(() => { loadDetail(); }, [loadDetail, lastUpdate]);
  useEffect(() => { if (!selectedId && items.length) setSelectedId(items[0].id); }, [items, selectedId]);
  const k = data?.kpis || {};
  const p = detail?.id === selectedId ? detail : null;
  const row = all.find((x) => x.id === selectedId);
  const refresh = () => { load({ silent: true }); loadDetail(); };
  const post = async (url, body) => { try { await request(url, { method: "POST", body: JSON.stringify({ ...body, actor }) }); notify("success", tx("Saved.")); refresh(); } catch (e) { notify("error", e.message); } };
  const count = (t) => all.filter((x) => x.status === "ACTIVE" && (t === "ALL" || x.plan_type === t)).length;
  const freq = (x) => (x.frequency_unit === "SHOT" ? `${tx("every")} ${num(x.interval_value)} ${tx("shots")}` : `${tx("every")} ${x.interval_value} ${tx("days")}`);
  const exportCsv = () => downloadExcel("maintenance-plans.csv", ["Plan No.", "Plan type", "Asset", "Asset type", "Task", "Next due", "Frequency", "Status", "Priority", "Technician", "Open WO"],
    items.map((x) => [x.plan_no, x.plan_type, x.asset_code, x.asset_type, x.task_name, x.next_due_date, freq(x), x.plan_status, x.priority, x.technician, x.open_wo_no]));
  const quick = [
    [tx("Create PM Plan"), CalendarMonthOutlinedIcon, "#1570EF", () => setDialog({ type: "create" }), !canEdit],
    [txs("Equipment (short)", "Equipment List"), PrecisionManufacturingOutlinedIcon, "#7A5AF8", () => navigate("/machine-equipment/machine-monitoring"), false],
    [tx("Mold List"), GridViewOutlinedIcon, "#0E9384", () => navigate("/mold-management/list"), false],
    [txs("Technicians (short)", "Technician List"), GroupsOutlinedIcon, "#1570EF", () => navigate("/maintenance-management/machine-equipment-maintenance"), false],
    [txs("Spare parts (short)", "Spare Parts Check"), SettingsOutlinedIcon, "#12B76A", () => notify("info", tx("Spare parts module is not live yet.")), false],
    [txs("Reports (short)", "Reports"), SummarizeOutlinedIcon, "#F04438", () => navigate("/maintenance-management/history"), false],
  ];
  const auto = p && p.source !== "MANUAL";
  const upcomingMax = Math.max(1, ...(data?.upcoming || []).map((u) => u.count));
  const base = chartBase(dark, axisColor);
  const activeFilters = [f.q, f.asset_type, f.status, f.active !== "ACTIVE" ? "x" : ""].filter(Boolean).length;
  const filters = showFilter ? (
    <>
      <TextField size="small" placeholder={tx("Search...")} value={f.q} onChange={set("q")} sx={{ width: 220 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }} />
      <TextField select size="small" slotProps={SEL} label={tx("Asset type")} value={f.asset_type} onChange={set("asset_type")} sx={{ minWidth: 150 }}>
        <MenuItem value="">{tx("All")}</MenuItem>{["MACHINE", "MOLD", "TOOL"].map((t) => <MenuItem key={t} value={t}>{t === "MACHINE" ? tx("Machines & equipment") : label("assetType", t)}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Status")} value={f.status} onChange={set("status")} sx={{ minWidth: 150 }}>
        <MenuItem value="">{tx("All")}</MenuItem>{["OVERDUE", "UPCOMING", "IN_PROGRESS", "SCHEDULED", "PLANNED"].map((s) => <MenuItem key={s} value={s}>{label("planStatus", s)}</MenuItem>)}</TextField>
      <TextField select size="small" slotProps={SEL} label={tx("Applied")} value={f.active} onChange={set("active")} sx={{ minWidth: 150 }}>
        <MenuItem value="ACTIVE">{tx("Active")}</MenuItem><MenuItem value="INACTIVE">{label("planStatus", "INACTIVE")}</MenuItem><MenuItem value="">{tx("All")}</MenuItem></TextField>
    </>
  ) : null;
  const distEntries = distView === "priority"
    ? ["HIGH", "MEDIUM", "LOW"].map((t) => [t, data?.overdue_by_priority?.[t] || 0, label("priority", t)]).filter(([, n]) => n)
    : ["MACHINE", "EQUIPMENT", "MOLD", "TOOL"].map((t) => [t, data?.by_asset_type?.[t] || 0, label("assetType", t)]).filter(([, n]) => n);
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };

  return (
    <MaintFrame fit page={page} title={tx("Maintenance Planning")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive}
      onRefresh={() => load()} onExport={exportCsv} system={data?.system} filters={filters}
      toolbar={<FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Total Planned Tasks")} value={num(k.total)} sub="" icon={EventNoteOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "" }))} />
            <KpiTile tone="success" title={tx("Completed (30 days)")} value={num(k.completed_30d)} sub="" icon={AssignmentTurnedInOutlinedIcon} />
            <KpiTile tone="warning" title={tx("In Progress")} value={num(k.in_progress)} sub="" icon={HourglassTopOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "IN_PROGRESS" }))} />
            <KpiTile tone="accent" title={tx("Upcoming (7 Days)")} value={num(k.upcoming)} sub="" icon={EventAvailableOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "UPCOMING" }))} />
            <KpiTile tone="danger" title={tx("Overdue")} value={num(k.overdue)} sub="" icon={WarningAmberOutlinedIcon} onClick={() => setF((o) => ({ ...o, status: "OVERDUE" }))} />
            <KpiTile tone="info" title={tx("PM Compliance")} value={k.pm_compliance != null ? num(k.pm_compliance, 1) : EMPTY} unit={k.pm_compliance != null ? "%" : ""} sub={tx("PM Compliance (MTD)")} icon={VerifiedUserOutlinedIcon} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,0.85fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Plan List")} action={(
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  {/* plan-type chips are the list's type filter */}
                  {TABS.map((t) => {
                    const on = tab === t;
                    return (
                      <Box key={t} component="button" type="button" onClick={() => setTab(t)}
                        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, height: 22, px: 0.75, borderRadius: 1, cursor: "pointer", font: "inherit", fontSize: 10.5, fontWeight: 700,
                          border: 1, borderColor: on ? "primary.main" : "divider", bgcolor: on ? "rgba(21,112,239,.08)" : "background.paper", color: "text.primary" }}>
                        {t === "ALL" ? tx("All") : label("planType", t)}<Box component="span" sx={{ color: "#1570EF", fontWeight: 800 }}>{count(t)}</Box>
                      </Box>
                    );
                  })}
                </Stack>
              )} />
              {items.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(11, 8, 15, 13, 8, 8, 10.5, 8, 9.5, 9) }}>
                    <TableHead><TableRow>
                      <TableCell>{tx("Plan No.")}</TableCell><TableCell>{tx("Plan Type")}</TableCell><TableCell>{tx("Asset / Equipment")}</TableCell><TableCell>{tx("Task Name")}</TableCell>
                      <TableCell>{tx("Planned Date")}</TableCell><TableCell>{tx("Frequency")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell align="center">{tx("Priority")}</TableCell>
                      <TableCell>{tx("Assigned To")}</TableCell><TableCell>{tx("Work Order")}</TableCell>
                    </TableRow></TableHead>
                    <TableBody>{items.map((x) => (
                      <TableRow key={x.id} hover selected={x.id === selectedId} onClick={() => { setSelectedId(x.id); setDtab(0); }} sx={{ cursor: "pointer", opacity: x.status === "ACTIVE" ? 1 : 0.55 }}>
                        <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{x.plan_no}{x.source !== "MANUAL" ? <Box component="span" sx={{ ml: 0.5, fontSize: 10, color: "#7A5AF8", fontWeight: 800 }}>AUTO</Box> : null}</TableCell>
                        <TableCell>{label("planType", x.plan_type)}</TableCell>
                        <TableCell title={`${x.asset_code} · ${x.asset_name} · ${label("assetType", x.asset_type)}`}><b>{x.asset_code}</b> · {x.asset_name}</TableCell>
                        <TableCell title={x.task_name}>{x.task_name}</TableCell>
                        <TableCell sx={{ color: x.plan_status === "OVERDUE" ? "#F04438" : undefined, fontWeight: x.plan_status === "OVERDUE" ? 800 : 400 }}
                          title={x.shots_left != null ? `${num(x.shots_left)} ${tx("shots")}` : ""}>{dateText(x.next_due_date)}</TableCell>
                        <TableCell title={freq(x)}>{freq(x)}</TableCell><TableCell align="center"><PlanStatusPill value={x.plan_status} /></TableCell><TableCell align="center"><PriorityPill value={x.priority} /></TableCell>
                        <TableCell title={who(x.open_wo_technician || x.technician)}>{who(x.open_wo_technician || x.technician)}</TableCell>
                        <TableCell>{x.open_wo_no ? <Box component="span" sx={{ color: "#1570EF", fontWeight: 700 }} onClick={(e) => { e.stopPropagation(); navigate(woPath({ asset_type: x.asset_type, id: x.open_wo_id })); }}>{x.open_wo_no}</Box> : EMPTY}</TableCell>
                      </TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={tx("Plan Detail")} subtitle={p ? p.plan_no : ""} action={p ? <PlanStatusPill value={p.plan_status} /> : null} />
              {!p ? <EmptyBody text={tx("Select a row in the list.")} /> : (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", px: 1.5, pb: 1.25 }}>
                  {auto ? <Alert severity="info" sx={{ py: 0, mb: 0.75, fontSize: 11 }}>{tx("Automatic plan (from Mold Master / Production Tool settings)")}</Alert> : null}
                  <Tabs value={dtab} onChange={(_, v) => setDtab(v)} variant="scrollable" sx={{ minHeight: 27, mb: 1, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 27, py: 0, textTransform: "none", fontSize: 11, fontWeight: 700, px: 1 } }}>
                    <Tab label={tx("Information")} /><Tab label={`${tx("Tasks")} (${(p.checklist || []).length})`} /><Tab label={`${tx("Spare Parts")} (${(p.spare_parts || []).length})`} />
                    <Tab label={`${tx("Work Orders")} (${p.work_orders.length})`} /><Tab label={tx("History")} />
                  </Tabs>
                  <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                    {dtab === 0 ? (
                      <InfoRows rows={[[tx("Plan Type"), label("planType", p.plan_type)], [tx("Type"), label("woType", p.wo_type)],
                        [tx("Asset / Equipment"), <Box key="a" component="span" sx={{ color: assetPath(p.asset_type, p.asset_id) ? "#1570EF" : undefined, cursor: "pointer" }}
                          onClick={() => assetPath(p.asset_type, p.asset_id) && navigate(assetPath(p.asset_type, p.asset_id))}>{p.asset?.code} · {p.asset?.name}</Box>],
                        [tx("Asset type"), label("assetType", p.asset_type)], [tx("Task Name"), p.task_name], [tx("Frequency"), freq(p)],
                        [tx("Next due"), `${dateText(p.next_due_date)}${p.next_due_date ? ` · ${dueText(Math.round((new Date(p.next_due_date) - new Date(new Date().toDateString())) / 86400000))}` : ""}`],
                        p.frequency_unit === "SHOT" ? [tx("Next due shot"), num(p.next_due_shot)] : null, [tx("Priority"), <PriorityPill key="p" value={p.priority} />],
                        [tx("Assigned To"), who(p.technician)], [tx("Estimated Duration"), hhmmFromMinutes(p.est_minutes)], [tx("Location"), p.asset?.location], [tx("Description"), p.description],
                        [tx("Last done"), ddmmhhmm(p.last_done_at)], [tx("Created By"), who(p.created_by)], [tx("Created Date"), ddmmhhmm(p.created_at)], [tx("Last Updated"), ddmmhhmm(p.updated_at)]]} />
                    ) : null}
                    {dtab === 1 ? (p.checklist || []).map((c, i) => <Typography key={i} variant="caption" sx={{ display: "block", py: 0.4, borderBottom: 1, borderColor: "divider" }}>{i + 1}. {c}</Typography>) : null}
                    {dtab === 2 ? (
                      <Table size="small" sx={{ ...tableSx, ...cellsSx }}><TableHead><TableRow><TableCell>{tx("Part code")}</TableCell><TableCell>{tx("Part name")}</TableCell><TableCell align="right">{tx("Qty")}</TableCell><TableCell align="right">{tx("Unit cost")}</TableCell></TableRow></TableHead>
                        <TableBody>{(p.spare_parts || []).map((sp, i) => <TableRow key={i}><TableCell>{sp.part_code || EMPTY}</TableCell><TableCell>{sp.part_name}</TableCell><TableCell align="right">{num(sp.qty, 2)} {sp.unit || ""}</TableCell><TableCell align="right">{num(sp.unit_cost)}</TableCell></TableRow>)}</TableBody></Table>
                    ) : null}
                    {dtab === 3 ? (
                      <Table size="small" sx={{ ...tableSx, ...cellsSx }}><TableHead><TableRow><TableCell>{tx("WO No.")}</TableCell><TableCell>{tx("Status")}</TableCell><TableCell>{tx("Technician")}</TableCell><TableCell>{tx("Actual Finish")}</TableCell></TableRow></TableHead>
                        <TableBody>{p.work_orders.map((w) => (
                          <TableRow key={w.id} hover onClick={() => navigate(woPath(w))} sx={{ cursor: "pointer" }}><TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{w.wo_no}</TableCell>
                            <TableCell><WoStatusPill value={w.status} /></TableCell><TableCell>{who(w.technician)}</TableCell><TableCell>{ddmmhhmm(w.actual_finish)}</TableCell></TableRow>))}</TableBody></Table>
                    ) : null}
                    {dtab === 4 ? <Timeline events={p.events} /> : null}
                  </Box>
                  {canEdit ? (
                    <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
                      {!auto ? <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setDialog({ type: "edit" })} sx={btn("cancel")}>{tx("Edit Plan")}</Button> : null}
                      <Button size="small" startIcon={<ContentCopyOutlinedIcon />} onClick={() => post(`${MAINT_API}/plans/${p.id}/duplicate`, {})} sx={btn("cancel")}>{tx("Duplicate Plan")}</Button>
                      {!auto ? <Button size="small" startIcon={<PowerSettingsNewOutlinedIcon />} onClick={() => post(`${MAINT_API}/plans/${p.id}/status`, { note: p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })} sx={btn("cancel")}>{p.status === "ACTIVE" ? tx("Deactivate") : tx("Activate")}</Button> : null}
                      {p.status === "ACTIVE" && !p.work_orders.some((w) => ["RELEASED", "ASSIGNED", "IN_PROGRESS", "PAUSED", "VERIFICATION"].includes(w.status))
                        ? <Button size="small" fullWidth startIcon={<AddTaskOutlinedIcon />} onClick={() => setDialog({ type: "wo" })} sx={btn("primary")}>{tx("Create Work Order")}</Button> : null}
                    </Stack>
                  ) : null}
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Planned Tasks Trend")} action={<Stack direction="row" spacing={1}><Dot color="#12B76A" text={tx("Planned")} /><Dot color="#1570EF" text={tx("Completed")} /><Dot color="#F04438" text={tx("Overdue")} /></Stack>} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="line" height="100%" series={[{ name: tx("Planned"), data: data.trend.map((t) => t.planned) }, { name: tx("Completed"), data: data.trend.map((t) => t.completed) }, { name: tx("Overdue"), data: data.trend.map((t) => t.overdue) }]} options={{
                  ...base, colors: ["#12B76A", "#1570EF", "#F04438"], stroke: { width: 2 }, markers: { size: 3 },
                  xaxis: { ...base.xaxis, categories: data.trend.map((t) => t.week) }, yaxis: { min: 0, forceNiceScale: true, tickAmount: 3, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={distView === "priority" ? tx("Overdue Tasks by Priority") : tx("Tasks by Asset Type")} action={(
                <ToggleButtonGroup exclusive size="small" value={distView} onChange={(e, v) => v && setDistView(v)}>
                  <ToggleButton value="asset" sx={toggleSx}>{tx("Asset type")}</ToggleButton>
                  <ToggleButton value="priority" sx={toggleSx}>{tx("Priority")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {distEntries.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: "100%" }}><DonutCard entries={distEntries} colors={distView === "priority" ? PRIORITY_COLORS : ASSET_COLORS} dark={dark} axisColor={axisColor} height={140} size={130} /></Box>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>
            <Paper elevation={0} sx={panelSx}>
              <Head title={tx("Upcoming Tasks (Next 7 Days)")} action={<Typography variant="caption" fontWeight={800}>{tx("Total")}: {data.upcoming.reduce((a, u) => a + u.count, 0)}</Typography>} />
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                {data.upcoming.map((u, i) => (
                  <Box key={u.date} sx={{ display: "grid", gridTemplateColumns: "70px 1fr 26px", gap: 1, alignItems: "center" }}>
                    <Typography variant="caption">{i === 0 ? tx("today") : dateText(u.date).slice(0, 5)}</Typography>
                    <LinearProgress variant="determinate" value={(u.count / upcomingMax) * 100} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: "#1570EF" } }} />
                    <Typography variant="caption" fontWeight={800} align="right">{u.count}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
            <Box sx={{ display: "flex", minHeight: 0, "& > *": { flex: 1 } }}><QuickCard title={tx("Quick Actions")} actions={quick} columns={3} /></Box>
          </Box>

          {dialog?.type === "create" ? <PlanDialog lookups={lookups} preset={dialog.preset} request={request} actor={actor} notify={notify}
            onClose={() => { setDialog(null); if (params.get("create")) setParams({}); }} onSaved={() => { setDialog(null); if (params.get("create")) setParams({}); load({ silent: true }); }} /> : null}
          {dialog?.type === "edit" && p ? <PlanDialog lookups={lookups} item={p} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); refresh(); }} /> : null}
          {dialog?.type === "wo" && p ? <WoDialog mode="from-plan" lookups={lookups} item={p} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)}
            onSaved={() => { setDialog(null); refresh(); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
