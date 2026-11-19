import "./locales";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Box, Button, Dialog, DialogContent, IconButton, LinearProgress, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from "@mui/material";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import FullscreenOutlinedIcon from "@mui/icons-material/FullscreenOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";

import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import MachineLayoutBoard, { LAYOUT_STATUS_COLORS } from "../../../components/machine/MachineLayoutBoard";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { API_CONFIG } from "../../../config/config";
import { KpiTile, colShares, downloadExcel } from "../../MaterialManagement/materialUi";
import { DialogHeader, Dot, EMPTY, Head, cardSx, ddmmhhmm, dialogPaperSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { setActiveLanguage as setMaintLanguage } from "../../MaintenanceManagement/maintLocales";
import { DonutCard, MaintFrame, useMaintData } from "../../MaintenanceManagement/maintPage";
import { EmptyBody, FilterToggle, cellsSx, fillSx, fitGridSx, panelSx, toolBtnSx } from "../../shared/onePage";
import { SEL } from "../../MaintenanceManagement/maintUi";
import { useQualityPage } from "../../QualityManagement/qualityPage";
import { label, setActiveLanguage, tx } from "./dashLocales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const DASH_API = `${BASE}/api/dashboard/overview`;
const VIEW_KEY = "vcc_dashboard_view";
const STATE_COLORS = { AHEAD: "#1570EF", ON_TRACK: "#12B76A", AT_RISK: "#F79009", DELAY: "#F04438", NOT_STARTED: "#98A2B3", COMPLETED: "#12B76A" };
const SEV_COLORS = { ERROR: "#F04438", WARNING: "#F79009", INFO: "#2E90FA" };
const DT_COLORS = ["#F04438", "#F79009", "#EAAA08", "#2E90FA", "#7A5AF8", "#98A2B3"];

const loadView = () => { try { return JSON.parse(localStorage.getItem(VIEW_KEY) || "{}"); } catch { return {}; } };
const todayIso = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };

function vs(cur, prev, unit = "", goodWhenUp = true) {
  if (cur == null || prev == null) return tx("no data yesterday");
  const d = Math.round((cur - prev) * 10) / 10;
  if (d === 0) return `= ${tx("vs yesterday")}`;
  return `${d > 0 ? "▲" : "▼"} ${num(Math.abs(d), 1)}${unit} ${tx("vs yesterday")}${goodWhenUp === null ? "" : ""}`;
}
const pctChange = (a, b) => (a == null || b == null || !b ? null : Math.round(((a - b) / b) * 1000) / 10);

function AssistantBlock({ title, rows, onClick }) {
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1.25, py: 0.75, cursor: onClick ? "pointer" : "default", "&:hover": onClick ? { bgcolor: "action.hover" } : undefined }} onClick={onClick}>
      <Typography variant="caption" fontWeight={800} sx={{ display: "block", mb: 0.25 }}>{title}</Typography>
      {rows.map(([k, v, color]) => (
        <Stack key={k} direction="row" sx={{ justifyContent: "space-between", py: 0.2 }}>
          <Typography variant="caption">{k}</Typography><Typography variant="caption" fontWeight={800} sx={{ color }}>{v}</Typography>
        </Stack>
      ))}
    </Box>
  );
}

export default function Dashboard() {
  const page = useQualityPage();
  const { i18n } = useTranslation();
  setActiveLanguage(i18n.resolvedLanguage || i18n.language || "en");
  setMaintLanguage(i18n.resolvedLanguage || i18n.language || "en");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { dark, axisColor, tableSx, request, notify } = page;
  const saved = useMemo(loadView, []);
  const [f, setF] = useState({ business_date: params.get("date") || saved.business_date || todayIso(), shift_id: params.get("shift") || saved.shift_id || "",
    area_id: params.get("area") || saved.area_id || "" });
  const [lk, setLk] = useState(null);
  const [areaTab, setAreaTab] = useState("ALL");
  const [notes, setNotes] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [ratio, setRatio] = useState(null);
  useEffect(() => { request(`${BASE}/api/production-dashboard/lookups`).then((r) => { setLk(r); setF((o) => (o.shift_id || !r.current_shift_id || o.business_date !== todayIso() ? o : { ...o, shift_id: String(r.current_shift_id) })); }).catch(() => {}); }, [request]);
  const url = `${DASH_API}?${new URLSearchParams(Object.entries(f).filter(([, v]) => v !== "" && v != null))}`;
  const { data, loading, lastUpdate, live, setLive, load } = useMaintData(page, url, { interval: 30000, paused: notes });
  const k = data?.kpis || {};
  const ms = data?.machine_status || {};
  const set = (key) => (e) => setF((o) => ({ ...o, [key]: e.target.value }));
  const areas = data?.areas || [];
  const boardArea = areaTab === "ALL" ? (areas.length === 1 ? areas[0] : null) : areas.find((a) => a.id === areaTab);
  const items = (data?.machines || []).filter((m) => !boardArea || m.layout_node_id === boardArea.id);
  const boardImage = boardArea?.image_url;
  // width / height of the layout image, so the board can be scaled to the card height
  useEffect(() => {
    if (!boardImage) { setRatio(null); return; }
    const img = new Image();
    img.onload = () => setRatio(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : null);
    img.src = resolveImageUrl(boardImage);
  }, [boardImage]);
  const dt = data?.downtime || [];
  const dtTotal = dt.reduce((a, d) => a + d.minutes, 0);
  const shiftDay = (n) => setF((o) => {
    const d = new Date(`${o.business_date}T00:00:00`);
    d.setDate(d.getDate() + n);
    const v = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    return v > todayIso() ? o : { ...o, business_date: v };
  });
  const saveView = () => { try { localStorage.setItem(VIEW_KEY, JSON.stringify(f)); notify("success", tx("View saved.")); } catch { notify("error", tx("Cannot save the view in this browser.")); } };
  const share = () => {
    const link = `${window.location.origin}/?${new URLSearchParams({ date: f.business_date, ...(f.shift_id ? { shift: f.shift_id } : {}), ...(f.area_id ? { area: f.area_id } : {}) })}`;
    navigator.clipboard?.writeText(link).then(() => notify("success", tx("Link copied."))).catch(() => notify("info", link));
  };
  const fullscreen = () => { const el = document.documentElement; if (!document.fullscreenElement) el.requestFullscreen?.(); else document.exitFullscreen?.(); };
  const exportCsv = () => data && downloadExcel(`dashboard-${f.business_date}.csv`, ["Section", "Item", "Value"], [
    ["KPI", "OEE %", k.oee], ["KPI", "Achievement %", k.achievement], ["KPI", "Good pcs", k.good], ["KPI", "Reject pcs", k.reject], ["KPI", "Active alarms", k.active_alarms],
    ["KPI", "WO in progress", k.wo_in_progress], ...data.orders.map((o) => ["Order", o.order_no, `${o.actual}/${o.plan} (${o.progress}%) ${o.state}`]),
    ...dt.map((d) => ["Downtime", d.reason, `${d.minutes} min`]), ["Machines", "Running", ms.running], ["Machines", "Idle", ms.idle], ["Machines", "Down", ms.down], ["Machines", "Maintenance", ms.maintenance],
  ]);
  const tooltip = (m) => (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" fontWeight={800} sx={{ display: "block" }}>{m.equipment_code} · {label("machineStatus", m.operational_status)}</Typography>
      <Typography variant="caption" sx={{ display: "block" }}>{m.wo_no ? `${m.wo_no} · ${m.product_name || ""}` : tx("No work order")}</Typography>
      {m.oee != null ? <Typography variant="caption" sx={{ display: "block" }}>OEE {num(m.oee, 1)}%</Typography> : null}
      {m.alarms ? <Typography variant="caption" sx={{ display: "block", color: "#FDA29B" }}>{m.alarms} {tx("active alarms")}</Typography> : null}
    </Box>
  );
  const notePath = (n) => ({ MACHINE: n.ref_id && `/machine-equipment/machine-detail?machine=${n.ref_id}`, WORK_ORDER: n.ref_id && `/production-management/work-orders/management?wo=${n.ref_id}`,
    MOLD: n.ref_id && `/mold-management/detail?mold=${n.ref_id}`, MATERIAL: "/material-management/requirement", QUALITY: "/quality-management/dashboard",
    ALARM: "/machine-equipment/alarm-history", NG: `/quality-management/ng-management?ng=${n.ref_id}`, PLAN: `/quality-management/inspection-management?plan=${n.ref_id}`,
    GAUGE: `/quality-management/measuring-equipment?equipment=${n.ref_id}`, WO: "/quality-management/dashboard", PRODUCT: "/quality-management/spc-monitoring" }[n.type]
    || (n.source === "QUALITY" ? "/quality-management/dashboard" : null));
  const activeFilters = (f.area_id ? 1 : 0) + (f.shift_id ? 1 : 0);
  const toolbar = (
    <>
      <Stack direction="row" sx={{ alignItems: "center" }}>
        <IconButton size="small" onClick={() => shiftDay(-1)} title={tx("Previous day")}><ChevronLeftIcon /></IconButton>
        <TextField size="small" type="date" label={tx("Business Date")} value={f.business_date} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: todayIso(), onClick: (e) => { try { e.currentTarget.showPicker?.(); } catch { /* not supported */ } } } }} sx={{ width: 160 }}
          onChange={(e) => { const v = e.target.value; if (/^\d{4}-\d{2}-\d{2}$/.test(v)) setF((o) => ({ ...o, business_date: v })); }} />
        <IconButton size="small" onClick={() => shiftDay(1)} disabled={f.business_date >= todayIso()} title={tx("Next day")}><ChevronRightIcon /></IconButton>
      </Stack>
      <FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
    </>
  );
  const filters = showFilter ? (
    <>
      <TextField size="small" label={tx("Plant")} value={data?.plant?.name || ""} slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }} sx={{ width: 150 }} />
      <TextField select size="small" label={tx("Area")} value={f.area_id} onChange={set("area_id")} slotProps={SEL} sx={{ width: 160 }}>
        <MenuItem value="">{tx("All Area")}</MenuItem>{(lk?.areas || []).map((a) => <MenuItem key={a.id} value={String(a.id)}>{a.name}</MenuItem>)}</TextField>
      <TextField select size="small" label={tx("Shift")} value={f.shift_id} onChange={set("shift_id")} slotProps={SEL} sx={{ width: 190 }}>
        <MenuItem value="">{tx("Whole day")}</MenuItem>{(lk?.shifts || []).map((s) => <MenuItem key={s.id} value={String(s.id)}>{s.shift_name}</MenuItem>)}</TextField>
    </>
  ) : null;
  const actions = (
    <>
      <Button startIcon={<BookmarkBorderOutlinedIcon />} onClick={saveView} sx={toolBtnSx}>{tx("Save View")}</Button>
      <Button startIcon={<ShareOutlinedIcon />} onClick={share} sx={toolBtnSx}>{tx("Share")}</Button>
      <Button startIcon={<FullscreenOutlinedIcon />} onClick={fullscreen} sx={toolBtnSx}>{tx("Fullscreen")}</Button>
    </>
  );

  return (
    <MaintFrame fit page={page} title={tx("Dashboard")} loading={loading} ready={Boolean(data)} lastUpdate={lastUpdate} live={live} setLive={setLive} onRefresh={() => load()}
      onExport={exportCsv} toolbar={toolbar} filters={filters} actions={actions} system={data?.system}>
      {data ? (
        <>
          <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
            <KpiTile tone="primary" title={tx("Overall Equipment Effectiveness")} value={k.oee != null ? num(k.oee, 1) : EMPTY} unit={k.oee != null ? "%" : ""} sub={vs(k.oee, k.oee_prev, "%")}
              icon={SpeedOutlinedIcon} onClick={() => navigate("/production-management/dashboard")} />
            <KpiTile tone="success" title={tx("Production Achievement")} value={k.achievement != null ? num(k.achievement, 1) : EMPTY} unit={k.achievement != null ? "%" : ""}
              sub={vs(k.achievement, k.achievement_prev, "%")} icon={TrendingUpOutlinedIcon} onClick={() => navigate("/production-management/dashboard")} />
            <KpiTile tone="warning" title={tx("Good Pieces")} value={num(k.good)} sub={pctChange(k.good, k.good_prev) != null ? `${pctChange(k.good, k.good_prev) > 0 ? "▲" : "▼"} ${num(Math.abs(pctChange(k.good, k.good_prev)), 1)}% ${tx("vs yesterday")}` : `${tx("yesterday")}: ${num(k.good_prev)}`}
              icon={CheckCircleOutlineIcon} onClick={() => navigate("/production-management/results")} />
            <KpiTile tone="danger" title={tx("Reject Pieces")} value={num(k.reject)} sub={pctChange(k.reject, k.reject_prev) != null ? `${pctChange(k.reject, k.reject_prev) > 0 ? "▲" : "▼"} ${num(Math.abs(pctChange(k.reject, k.reject_prev)), 1)}% ${tx("vs yesterday")}` : `${tx("yesterday")}: ${num(k.reject_prev)}`}
              icon={ReportProblemOutlinedIcon} onClick={() => navigate("/quality-management/ng-management")} />
            <KpiTile tone="accent" title={tx("Active Alarms")} value={num(k.active_alarms)} sub={`${num(k.alarms_window)} ${tx("raised in the period")} · ${tx("yesterday")} ${num(k.alarms_prev)}`}
              icon={NotificationsActiveOutlinedIcon} onClick={() => navigate("/machine-equipment/alarm-history")} />
            <KpiTile tone="info" title={tx("Work Orders In Progress")} value={num(k.wo_in_progress)} sub={`${k.on_track} ${tx("on track")} · ${k.at_risk} ${tx("at risk")} · ${k.delay} ${tx("delay")}`}
              icon={AssignmentOutlinedIcon} onClick={() => navigate("/production-management/work-orders/management")} />
          </KpiCardGroup>

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "minmax(0,1fr) 360px" }, gridTemplateRows: { lg: "auto minmax(0,1fr) minmax(0,1fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1" }, gridRow: { lg: "1 / 4" }, minHeight: { xs: 380, lg: 0 } }}>
              <Head title={tx("Factory Overview")} action={
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  {areas.length > 1 ? (
                    <Tabs value={areaTab} onChange={(e, v) => setAreaTab(v)} sx={{ minHeight: 26, mr: 1, "& .MuiTab-root": { minHeight: 26, py: 0, px: 1, minWidth: 0, textTransform: "none", fontWeight: 700, fontSize: 11 } }}>
                      <Tab value="ALL" label={tx("All")} />{areas.map((a) => <Tab key={a.id} value={a.id} label={`${a.name} (${a.count})`} />)}
                    </Tabs>
                  ) : null}
                  {["RUNNING", "IDLE", "DOWN", "MAINTENANCE"].map((s) => <Dot key={s} color={LAYOUT_STATUS_COLORS[s]} text={`${label("machineStatus", s)} (${ms[s.toLowerCase()] || 0})`} />)}
                </Stack>} />
              {/* the layout keeps its image proportions and is as large as the card allows; machines sit in % of the image */}
              <Box sx={{ flex: 1, minHeight: 0, px: 1.5, pb: 1.25, containerType: "size", display: "flex", justifyContent: "center", alignItems: "flex-start", overflow: ratio ? "hidden" : "auto" }}>
                <Box sx={{ width: ratio ? `min(100cqw, calc(100cqh * ${ratio}))` : "100%" }} title={tx("Click a machine to open Machine Detail.")}>
                  <MachineLayoutBoard image={boardArea?.image_url} items={items} minHeight={300} renderTooltip={tooltip} onSelect={(m) => navigate(`/machine-equipment/machine-detail?machine=${m.id}`)}
                    emptyText={boardArea?.image_url ? "" : tx("No layout image yet: machines are placed on a grid (set it in Factory Structure).")} />
                </Box>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...cardSx, gridColumn: { md: "1 / -1", lg: "2" }, gridRow: { lg: "1" } }}>
              <Head title={<Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}><AutoAwesomeOutlinedIcon sx={{ color: "#1570EF", fontSize: 16 }} />{tx("Factory Assistant")}</Box>}
                action={<Box component="button" type="button" onClick={() => setNotes(true)} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, border: 0, bgcolor: "transparent", cursor: "pointer", font: "inherit", fontSize: 11, fontWeight: 700, color: "#1570EF" }}>
                  <NotificationsActiveOutlinedIcon sx={{ fontSize: 15 }} />{tx("Notifications")} ({data.notifications.length})</Box>} />
              <Box sx={{ px: 1.25, pb: 1.25, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.75 }}>
                <AssistantBlock title={tx("Production Status")} onClick={() => navigate("/machine-equipment/machine-monitoring")} rows={[
                  [tx("Running Machines"), `${ms.running} / ${ms.total}`, LAYOUT_STATUS_COLORS.RUNNING], [tx("Idle Machines"), `${ms.idle} / ${ms.total}`, LAYOUT_STATUS_COLORS.IDLE],
                  [tx("Down Machines"), `${ms.down} / ${ms.total}`, LAYOUT_STATUS_COLORS.DOWN], [tx("Maintenance"), `${ms.maintenance} / ${ms.total}`, LAYOUT_STATUS_COLORS.MAINTENANCE]]} />
                <AssistantBlock title={`${tx("Shift Summary")}${data.shift?.shift_name ? ` · ${data.shift.shift_name}` : ""}`} onClick={() => navigate("/production-management/results")} rows={[
                  [tx("Planned Production"), `${num(data.shift.planned)} PCS`], [tx("Actual Production"), `${num(data.shift.actual)} PCS`],
                  [tx("Achievement"), data.shift.achievement != null ? `${num(data.shift.achievement, 1)}%` : EMPTY, "#12B76A"],
                  [tx("Good Rate"), data.shift.actual ? `${num((data.shift.good / data.shift.actual) * 100, 1)}%` : EMPTY, "#12B76A"]]} />
                <AssistantBlock title={tx("Material Readiness")} onClick={() => navigate("/material-management/status")} rows={[
                  [tx("Ready"), data.material.ready, "#12B76A"], [tx("Running Low"), data.material.running_low, "#F79009"], [tx("Out of Stock / Shortage"), data.material.out_of_stock, "#F04438"]]} />
                <AssistantBlock title={tx("Maintenance Reminder")} onClick={() => navigate("/maintenance-management/overview")} rows={[
                  [tx("Due Today"), data.maintenance.due_today, "#12B76A"], [tx("Overdue"), data.maintenance.overdue, "#F04438"]]} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "2" } }}>
              <Head title={tx("Production Progress (Top 5 Orders)")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate("/production-management/production-orders/list")}>{tx("View All")}</Typography>} />
              {data.orders.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(32, 40, 28) }}>
                    <TableHead><TableRow><TableCell>{tx("Order No.")}</TableCell><TableCell>{tx("Progress")}</TableCell><TableCell>{tx("Status")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.orders.map((o) => (
                      <TableRow key={o.id} hover sx={{ cursor: "pointer" }} title={`${o.product} · ${num(o.actual)}/${num(o.plan)} PCS`} onClick={() => navigate(`/production-management/production-orders/detail?order=${o.order_no}`)}>
                        <TableCell sx={{ fontWeight: 700, color: "#1570EF" }}>{o.order_no}</TableCell>
                        <TableCell><Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                          <LinearProgress variant="determinate" value={Math.min(o.progress || 0, 100)} sx={{ flex: 1, height: 6, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: STATE_COLORS[o.state] } }} />
                          <Typography variant="caption" sx={{ minWidth: 34, textAlign: "right" }}>{num(o.progress, 1)}%</Typography></Stack></TableCell>
                        <TableCell sx={{ color: STATE_COLORS[o.state], fontWeight: 800 }}>{label("orderState", o.state)}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No open production order.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Downtime Analysis")} action={<Typography variant="caption" sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => navigate("/machine-equipment/downtime-management")}>{tx("View Detail")}</Typography>} />
              {dt.length ? (
                <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => navigate("/machine-equipment/downtime-management")}>
                  <Box sx={{ width: "100%" }}>
                    <DonutCard entries={dt.map((d) => [d.reason, d.minutes, d.reason])} colors={Object.fromEntries(dt.map((d, i) => [d.reason, DT_COLORS[i % DT_COLORS.length]]))}
                      dark={dark} axisColor={axisColor} height={140} size={130} centerLabel={tx("min")} formatter={(v) => num(v, 0)} />
                  </Box>
                </Box>
              ) : <EmptyBody text={tx("No downtime in the period.")} />}
            </Paper>
          </Box>

          {notes ? (
            <Dialog open onClose={() => setNotes(false)} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
              <DialogHeader icon={<NotificationsActiveOutlinedIcon />} title={tx("Notifications")} subtitle={tx("Production alerts, open quality alerts and active machine alarms")} onClose={() => setNotes(false)} />
              <DialogContent sx={{ pt: "8px !important", pb: 1.5 }}>
                <Box sx={{ maxHeight: 480, overflow: "auto" }}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(16, 50, 16, 18) }}>
                    <TableHead><TableRow><TableCell>{tx("Source")}</TableCell><TableCell>{tx("Notification")}</TableCell><TableCell>{tx("Object")}</TableCell><TableCell>{tx("Time")}</TableCell></TableRow></TableHead>
                    <TableBody>{data.notifications.map((n, i) => {
                      const to = notePath(n);
                      return (
                        <TableRow key={i} hover sx={{ cursor: to ? "pointer" : "default" }} onClick={() => to && navigate(to)}>
                          <TableCell><Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: SEV_COLORS[n.severity], flexShrink: 0 }} />
                            <span>{label("source", n.source)}</span></Stack></TableCell>
                          <TableCell sx={{ whiteSpace: "normal !important" }}>{label("note", n.code)}{n.detail ? <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{n.detail}</Typography> : null}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: to ? "#1570EF" : undefined }} title={n.ref || ""}>{n.ref || EMPTY}</TableCell><TableCell>{n.at ? ddmmhhmm(n.at) : EMPTY}</TableCell></TableRow>
                      );
                    })}</TableBody>
                  </Table>
                </Box>
              </DialogContent>
            </Dialog>
          ) : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
