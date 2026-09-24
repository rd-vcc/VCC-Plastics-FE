import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import "./locales";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, CircularProgress, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Paper, Select, Snackbar, Stack, Switch,
  Table, TableBody, TableCell, TableHead, TableRow, TextField, ThemeProvider as MuiThemeProvider, Tooltip, Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReportGmailerrorredOutlinedIcon from "@mui/icons-material/ReportGmailerrorredOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import TrackChangesOutlinedIcon from "@mui/icons-material/TrackChangesOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { API_CONFIG } from "../../../config/config";
import { useTheme as useAppTheme } from "../../../context/ThemeContext";
import { KpiTile, downloadCsv, useRequest } from "../../MaterialManagement/materialUi";
import { Dot, EMPTY, Head, btn, cardSx, ddmmhhmm, hhmm, num, pageTheme } from "../ProductionPlanning/ui";
import { SystemStatusBar } from "../WorkOrders/WorkOrderManagement/WoParts";
import { localeTag, setActiveLanguage, tx } from "./dashLocales";

const API = `${API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "")}/api/production-dashboard`;
const VIEW_KEY = "vcc_production_dashboard_view";
const MACHINE_COLORS = { RUNNING: "#12B76A", IDLE: "#F79009", DOWN: "#F04438", MAINTENANCE: "#2E90FA", OFFLINE: "#98A2B3" };
const MACHINE_TEXT = { RUNNING: "Running", IDLE: "Idle", DOWN: "Down", MAINTENANCE: "Maintenance", OFFLINE: "Offline" };
const STATE_COLORS = { ON_TRACK: "#12B76A", AHEAD: "#2E90FA", AT_RISK: "#F79009", DELAY: "#F04438", NOT_STARTED: "#98A2B3", COMPLETED: "#0E9384", ON_HOLD: "#7A5AF8" };
const STATE_TEXT = { ON_TRACK: "On Track", AHEAD: "Ahead", AT_RISK: "At Risk", DELAY: "Delay", NOT_STARTED: "Not Started", COMPLETED: "Completed", ON_HOLD: "On Hold" };
const SEVERITY = { ERROR: [ErrorOutlineIcon, "#F04438"], WARNING: [WarningAmberOutlinedIcon, "#F79009"], INFO: [InfoOutlinedIcon, "#2E90FA"] };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const readView = () => { try { return JSON.parse(localStorage.getItem(VIEW_KEY) || "null"); } catch { return null; } };
const vs = (a, b) => (b ? `${a >= b ? "↑" : "↓"} ${num(Math.abs(((a - b) / b) * 100), 1)}% ${tx("vs yesterday")}` : "");

function Timeline({ rows, start, end, onOpen }) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const span = e - s;
  const now = Date.now();
  const pos = (t) => Math.min(Math.max(((new Date(t).getTime() - s) / span) * 100, 0), 100);
  const ticks = Array.from({ length: Math.floor(span / 7200000) + 1 }, (_, i) => s + i * 7200000);
  return (
    <Box sx={{ px: 1.5, pb: 1.5 }}>
      <Box sx={{ display: "grid", gridTemplateColumns: "120px 1fr", mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={800}>{tx("Work Order")}</Typography>
        <Box sx={{ position: "relative", height: 16 }}>
          {ticks.map((t) => <Typography key={t} variant="caption" color="text.secondary" sx={{ position: "absolute", left: `${pos(t)}%`, transform: "translateX(-50%)" }}>{hhmm(t)}</Typography>)}
        </Box>
      </Box>
      <Box sx={{ position: "relative" }}>
        {now > s && now < e ? (
          <Box sx={{ position: "absolute", top: 0, bottom: 0, left: `calc(120px + (100% - 120px) * ${pos(now) / 100})`, borderLeft: "2px dashed #F04438", zIndex: 1 }}>
            <Box sx={{ position: "absolute", top: -2, left: -20, fontSize: 10, fontWeight: 800, color: "#fff", bgcolor: "#F04438", px: 0.5, borderRadius: 0.5 }}>{hhmm(now)}</Box>
          </Box>
        ) : null}
        {rows.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No work order")}</Typography> : rows.map((r) => {
          const planBefore = new Date(r.planned_end).getTime() <= s;
          const actualStart = r.started_at ? new Date(r.started_at).getTime() : null;
          const actualEnd = r.completed_at ? new Date(r.completed_at).getTime() : r.held_at ? new Date(r.held_at).getTime() : Math.min(now, e);
          const color = STATE_COLORS[r.progress_state] || "#2E90FA";
          return (
            <Box key={r.id} onClick={() => onOpen(r)} sx={{ display: "grid", gridTemplateColumns: "120px 1fr", alignItems: "center", py: 0.6, borderTop: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
              <Box sx={{ minWidth: 0 }}><Typography variant="caption" fontWeight={800} sx={{ display: "block", color: "#1570EF" }} noWrap>{r.wo_no}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{r.product_name} · {r.machine_code || EMPTY}</Typography></Box>
              <Box sx={{ position: "relative", height: 34 }}>
                {!planBefore ? <Tooltip title={`${tx("Plan")}: ${ddmmhhmm(r.planned_start)} → ${ddmmhhmm(r.planned_end)}`}>
                  <Box sx={{ position: "absolute", top: 22, height: 5, borderRadius: 3, bgcolor: "action.selected", left: `${pos(r.planned_start)}%`, width: `${Math.max(pos(r.planned_end) - pos(r.planned_start), 0.5)}%` }} /></Tooltip>
                  : <Typography variant="caption" sx={{ position: "absolute", top: 20, left: 0, fontSize: 10, lineHeight: 1.3, color: "#F04438" }}>{tx("Planned before this shift")}: {ddmmhhmm(r.planned_end)}</Typography>}
                {actualStart && actualEnd > s ? (
                  <Tooltip title={`${tx("Actual")}: ${ddmmhhmm(r.started_at)} → ${r.completed_at ? ddmmhhmm(r.completed_at) : tx("Now")}`}>
                    <Box sx={{ position: "absolute", top: 4, height: 13, borderRadius: 1, bgcolor: color, left: `${pos(Math.max(actualStart, s))}%`, width: `${Math.max(pos(actualEnd) - pos(Math.max(actualStart, s)), 0.8)}%` }} />
                  </Tooltip>
                ) : null}
                <Typography variant="caption" fontWeight={800} sx={{ position: "absolute", top: 18, right: 0, color }}>{num(r.progress_pct, 0)}%</Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Stack direction="row" sx={{ gap: 1.5, flexWrap: "wrap", mt: 1 }}>
        {["ON_TRACK", "AHEAD", "AT_RISK", "DELAY", "ON_HOLD", "NOT_STARTED"].map((k) => <Dot key={k} color={STATE_COLORS[k]} text={tx(STATE_TEXT[k])} />)}
      </Stack>
    </Box>
  );
}

export default function ProductionDashboard() {
  const { i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language || "en";
  setActiveLanguage(language);
  const { theme } = useAppTheme();
  const dark = theme === "dark";
  const muiTheme = useMemo(() => pageTheme(theme), [theme]);
  const navigate = useNavigate();
  const request = useRequest();
  const rootRef = useRef(null);
  const saved = useMemo(() => readView(), []);

  const [lookups, setLookups] = useState(null);
  const [filter, setFilter] = useState({ area_id: saved?.area_id ?? "", shift_id: saved?.shift_id ?? "", business_date: ymd(new Date()) });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(saved?.autoRefresh ?? true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [msg, setMsg] = useState({ open: false, type: "success", text: "" });
  const notify = useCallback((type, text) => setMsg({ open: true, type, text }), []);

  useEffect(() => {
    request(`${API}/lookups`).then((l) => { setLookups(l); setFilter((f) => (f.shift_id === "" && l.current_shift_id ? { ...f, shift_id: l.current_shift_id } : f)); })
      .catch((e) => notify("error", e.message));
  }, [request, notify]);
  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const q = new URLSearchParams({ business_date: filter.business_date });
      if (filter.area_id) q.set("area_id", filter.area_id);
      if (filter.shift_id && filter.shift_id !== "ALL") q.set("shift_id", filter.shift_id);
      setData(await request(`${API}/summary?${q}`)); setLastUpdate(new Date());
    } catch (e) { notify("error", e.message); } finally { setLoading(false); }
  }, [filter, request, notify]);
  useEffect(() => { if (lookups) load(); }, [load, lookups]);
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const t = setInterval(() => load({ silent: true }), 30000);
    return () => clearInterval(t);
  }, [autoRefresh, load]);

  if (!lookups || !data) return <Box sx={{ height: 400, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  const k = data.kpis;
  const sh = data.shift;
  const axisColor = dark ? "#A7B0C0" : "#667085";
  const grid = { borderColor: dark ? "#263244" : "#EEF2F6" };
  const toolBtnSx = { ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" };
  const saveView = () => { try { localStorage.setItem(VIEW_KEY, JSON.stringify({ area_id: filter.area_id, shift_id: filter.shift_id, autoRefresh })); notify("success", tx("View saved.")); } catch { /* storage blocked */ } };
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    try { await navigator.clipboard.writeText(url); notify("success", tx("Link copied.")); } catch { notify("info", url); }
  };
  const fullscreen = () => { const el = rootRef.current; if (!document.fullscreenElement && el?.requestFullscreen) el.requestFullscreen(); else if (document.exitFullscreen) document.exitFullscreen(); };
  const exportCsv = () => downloadCsv(`production-dashboard-${filter.business_date}.csv`, ["Metric", "Value"], [
    ["Window", `${ddmmhhmm(data.window.start)} - ${ddmmhhmm(data.window.end)}`], ["OEE %", k.oee], ["Achievement %", k.achievement], ["Good", k.good], ["Reject", k.reject],
    ["Target", k.target], ["Remaining", k.remaining], ["WO in progress", k.in_progress],
    ...data.machines.map((m) => [`Machine ${m.equipment_code}`, `${m.status} ${m.wo_no || ""} ${m.progress_pct ?? ""}`]),
    ...data.by_hour.map((h) => [`Hour ${h.hour}`, `plan ${h.plan} / actual ${h.actual ?? ""}`])]);
  const areas = [...new Set(data.machines.map((m) => m.area_name || "—"))];
  const stateKeys = ["ON_TRACK", "AHEAD", "AT_RISK", "DELAY", "ON_HOLD", "NOT_STARTED", "COMPLETED"].filter((s) => data.wo_states[s]);
  const stateTotal = stateKeys.reduce((a, s) => a + data.wo_states[s], 0);
  const alertText = (a) => tx(a.code, { n: a.code === "WO_DELAYED" ? `${Math.floor((a.minutes || 0) / 60)}h${String((a.minutes || 0) % 60).padStart(2, "0")}` : a.code === "MATERIAL_SHORTAGE" ? a.count : a.value != null ? num(a.value, 1) : "" });
  const openAlert = (a) => {
    if (a.type === "MACHINE") navigate(`/machine-equipment/machine-detail?machine=${a.ref_id}`);
    else if (a.type === "WORK_ORDER" || a.type === "QUALITY") navigate(`/production-management/work-orders/execution?wo=${a.ref_id}`);
    else if (a.type === "MATERIAL") navigate("/material-management/requirement");
    else if (a.type === "MOLD") navigate(`/mold-management/detail?mold=${a.ref_id}`);
  };
  const shiftName = sh.shift_name || tx("Whole day");

  return (
    <MuiThemeProvider theme={muiTheme}>
      <Box ref={rootRef} sx={{ bgcolor: "background.default" }}>
        <PageMeta title={`${tx("Production Dashboard")} | VCC Plastics`} description={tx("Real-time overview of the shift")} />
        <PageBreadcrumb pageTitle={tx("Production Dashboard")} />

        <Paper elevation={0} sx={{ ...cardSx, p: 1, mb: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Button startIcon={<RefreshIcon />} onClick={() => load()} sx={toolBtnSx}>{tx("Refresh")}</Button>
            <FormControl size="small" sx={{ minWidth: 150 }}><InputLabel>{tx("Area")}</InputLabel>
              <Select label={tx("Area")} value={filter.area_id} onChange={(e) => setFilter((f) => ({ ...f, area_id: e.target.value }))}>
                <MenuItem value="">{tx("All Areas")}</MenuItem>{lookups.areas.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </Select></FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}><InputLabel>{tx("Shift")}</InputLabel>
              <Select label={tx("Shift")} value={filter.shift_id} onChange={(e) => setFilter((f) => ({ ...f, shift_id: e.target.value }))}>
                <MenuItem value="ALL">{tx("Whole day")}</MenuItem>
                {lookups.shifts.map((s) => <MenuItem key={s.id} value={s.id}>{s.shift_name} ({String(Math.floor(s.start_min / 60)).padStart(2, "0")}:{String(s.start_min % 60).padStart(2, "0")} ~ {String(Math.floor(s.end_min / 60)).padStart(2, "0")}:{String(s.end_min % 60).padStart(2, "0")})</MenuItem>)}
              </Select></FormControl>
            <TextField size="small" type="date" label={tx("Business date")} value={filter.business_date} onChange={(e) => setFilter((f) => ({ ...f, business_date: e.target.value }))} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <Button startIcon={<BookmarkBorderOutlinedIcon />} onClick={saveView} sx={toolBtnSx}>{tx("Save View")}</Button>
            <Button startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv} sx={toolBtnSx}>{tx("Export")}</Button>
            <Button startIcon={<PrintOutlinedIcon />} onClick={() => window.print()} sx={toolBtnSx}>{tx("Print")}</Button>
            <Button startIcon={<ShareOutlinedIcon />} onClick={share} sx={toolBtnSx}>{tx("Share")}</Button>
            <Button startIcon={<FullscreenIcon />} onClick={fullscreen} sx={toolBtnSx}>{tx("Fullscreen")}</Button>
            <Box sx={{ flex: 1 }} />
            <Stack sx={{ alignItems: "flex-end" }}>
              <FormControlLabel sx={{ mr: 0 }} labelPlacement="start" control={<Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
                label={<Typography variant="caption" fontWeight={700} sx={{ mr: 1 }}>{tx("Auto Refresh")}</Typography>} />
              <Typography variant="caption" color="text.secondary">{tx("Last Update")}: {lastUpdate ? lastUpdate.toLocaleString(localeTag()) : EMPTY}</Typography>
            </Stack>
          </Stack>
        </Paper>
        {loading ? <LinearProgress sx={{ mb: 1 }} /> : null}

        <KpiCardGroup sx={{ mb: 1.5 }}>
          <KpiTile tone="primary" title="OEE" value={k.oee != null ? num(k.oee, 1) : EMPTY} unit={k.oee != null ? "%" : ""} sub={shiftName} icon={SpeedOutlinedIcon} onClick={() => navigate("/production-management/results")} />
          <KpiTile tone="success" title={tx("Production Achievement")} value={k.achievement != null ? num(k.achievement, 1) : EMPTY} unit={k.achievement != null ? "%" : ""} sub={`${num(k.good)} / ${num(k.target)} pcs`} icon={EmojiEventsOutlinedIcon} />
          <KpiTile tone="info" title={tx("Good Pieces")} value={num(k.good)} unit="pcs" sub={vs(k.good, k.good_yesterday)} icon={InsightsOutlinedIcon} />
          <KpiTile tone="danger" title={tx("Reject Pieces")} value={num(k.reject)} unit="pcs" sub={vs(k.reject, k.reject_yesterday)} icon={ReportGmailerrorredOutlinedIcon} />
          <KpiTile tone="accent" title={tx("Today's Target")} value={num(k.target)} unit="pcs" sub={`${tx("Remaining")}: ${num(k.remaining)}${k.carry_over ? ` · ${tx("incl. carry-over {n}", { n: num(k.carry_over) })}` : ""}`} icon={TrackChangesOutlinedIcon} />
          <KpiTile tone="warning" title={tx("Work Orders In Progress")} value={num(k.in_progress)} sub={`${tx("On Track")} ${k.on_track} · ${tx("At Risk")} ${k.at_risk} · ${tx("Delay")} ${k.delay}`} icon={AssignmentOutlinedIcon} onClick={() => navigate("/production-management/work-orders/execution")} />
        </KpiCardGroup>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "minmax(0,1.15fr) minmax(0,1fr) 340px" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Injection Area Overview")} action={<Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>{Object.keys(MACHINE_COLORS).map((s) => <Dot key={s} color={MACHINE_COLORS[s]} text={tx(MACHINE_TEXT[s])} />)}</Stack>} />
            <Stack spacing={1.5} sx={{ px: 1.5, pb: 1.5 }}>
              {areas.map((area) => (
                <Box key={area} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1, bgcolor: dark ? "rgba(255,255,255,.02)" : "#F8FAFC" }}>
                  <Typography variant="caption" fontWeight={800} sx={{ display: "inline-block", px: 1, py: 0.25, mb: 1, borderRadius: 1, color: "#fff", bgcolor: "#1570EF" }}>{area}</Typography>
                  {(() => { const img = data.machines.find((m) => (m.area_name || "—") === area && m.area_image)?.area_image; return img ? <Box component="img" src={resolveImageUrl(img)} alt="" sx={{ display: "block", width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 1.5, mb: 1, bgcolor: "background.paper" }} /> : null; })()}
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 1 }}>
                    {data.machines.filter((m) => (m.area_name || "—") === area).map((m) => {
                      const color = MACHINE_COLORS[m.status] || "#98A2B3";
                      return (
                        <Box key={m.id} onClick={() => navigate(`/machine-equipment/machine-detail?machine=${m.id}`)} sx={{ borderRadius: 2, border: 2, borderColor: color, bgcolor: "background.paper", p: 1, cursor: "pointer", "&:hover": { boxShadow: 3 } }}>
                          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                            <Typography variant="caption" fontWeight={800}>{m.equipment_code}</Typography>
                            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color, boxShadow: m.status === "RUNNING" ? `0 0 0 3px ${color}33` : "none" }} />
                          </Stack>
                          <Box sx={{ display: "grid", placeItems: "center", py: 0.5, height: 52 }}>{m.image_url ? <Box component="img" src={resolveImageUrl(m.image_url)} alt="" sx={{ maxWidth: "100%", height: 48, objectFit: "contain" }} /> : <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 34, color }} />}</Box>
                          <Typography variant="caption" sx={{ display: "block", color, fontWeight: 700 }}>{tx(MACHINE_TEXT[m.status] || m.status)}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>{m.wo_no || tx("No work order")}</Typography>
                          {m.progress_pct != null ? <LinearProgress variant="determinate" value={Math.min(m.progress_pct, 100)} sx={{ mt: 0.5, height: 5, borderRadius: 3, "& .MuiLinearProgress-bar": { bgcolor: color } }} /> : null}
                          {m.oee != null ? <Typography variant="caption" color="text.secondary">OEE {num(m.oee, 1)}%</Typography> : null}
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Production Timeline (Gantt)")} subtitle={`${hhmm(data.window.start)} – ${hhmm(data.window.end)}`} />
            <Timeline rows={data.timeline} start={data.window.start} end={data.window.end} onOpen={(r) => (r.order_no ? navigate(`/production-management/production-orders/detail?order=${encodeURIComponent(r.order_no)}`) : navigate(`/production-management/work-orders/management?wo=${r.id}`))} />
          </Paper>
          <Stack spacing={1.5}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Production Alerts")} subtitle={`(${data.alerts.length})`} />
              <Box sx={{ px: 1.5, pb: 1, maxHeight: 250, overflow: "auto" }}>
                {data.alerts.length === 0 ? <Typography variant="caption" color="text.secondary">{tx("No alerts.")}</Typography> : data.alerts.map((a, i) => {
                  const [Icon, color] = SEVERITY[a.severity];
                  return (
                    <Stack key={i} direction="row" spacing={1} onClick={() => openAlert(a)} sx={{ py: 0.75, borderBottom: 1, borderColor: "divider", cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                      <Icon sx={{ color, fontSize: 20, mt: 0.25 }} />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="caption" fontWeight={800} sx={{ display: "block" }}>{a.ref}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{alertText(a)}{a.detail ? ` · ${a.detail}` : ""}</Typography>
                      </Box>
                      {a.at ? <Typography variant="caption" color="text.secondary">{hhmm(a.at)}</Typography> : null}
                    </Stack>
                  );
                })}
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ ...cardSx, cursor: "pointer" }} onClick={() => navigate("/production-management/results")}>
              <Head title={`${tx("Shift Summary")} (${shiftName})`} />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.6, px: 1.5, pb: 1.5 }}>
                {[[tx("Planned Production"), `${num(sh.planned)} pcs`], [tx("Actual Production"), `${num(sh.actual)} pcs`], [tx("Good Pieces"), `${num(sh.good)} pcs`],
                  [tx("Reject Pieces"), `${num(sh.reject)} pcs`], [tx("Reject Rate"), sh.reject_rate != null ? `${num(sh.reject_rate, 2)}%` : EMPTY],
                  [tx("Remaining"), `${num(sh.remaining)} pcs`], [tx("Achievement"), sh.achievement != null ? `${num(sh.achievement, 1)}%` : EMPTY]].map(([key, v], i) => [
                  <Typography key={`${key}k`} variant="caption" color="text.secondary">{key}</Typography>,
                  <Typography key={`${key}v`} variant="caption" fontWeight={800} sx={{ textAlign: "right", color: i === 6 ? "#12B76A" : i === 3 ? "#F04438" : undefined }}>{v}</Typography>,
                ])}
              </Box>
            </Paper>
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr", xl: "minmax(0,1.15fr) minmax(0,1fr) minmax(0,0.8fr) 340px" }, gap: 1.5, mb: 1.5 }}>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Production by Hour")} subtitle={`(${shiftName})`} />
            <Box sx={{ px: 1, pb: 0.5 }}>
              <Chart type="line" height={240} series={[{ name: tx("Plan (PCS)"), data: data.by_hour.map((h) => h.plan) }, { name: tx("Actual (PCS)"), data: data.by_hour.map((h) => h.actual) }]}
                options={{ chart: { background: "transparent", toolbar: { show: false }, fontFamily: '"Bai Jamjuree", sans-serif' }, colors: ["#1570EF", "#12B76A"],
                  stroke: { width: [2, 3], curve: "straight", dashArray: [6, 0] }, markers: { size: [0, 4] }, xaxis: { categories: data.by_hour.map((h) => h.hour), labels: { style: { colors: axisColor, fontSize: "10px" } } },
                  yaxis: { labels: { style: { colors: axisColor }, formatter: (v) => num(v) } }, legend: { position: "top", labels: { colors: axisColor } }, grid, tooltip: { theme: dark ? "dark" : "light", shared: true } }} />
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Top 5 Machines by OEE")} />
            <Box sx={{ px: 1, pb: 1 }}>
              <Table size="small" sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, whiteSpace: "nowrap" }, "& th": { color: "text.secondary", fontWeight: 800 } }}>
                <TableHead><TableRow><TableCell>{tx("Machine")}</TableCell><TableCell align="right">OEE</TableCell><TableCell align="right">{tx("Availability")}</TableCell><TableCell align="right">{tx("Performance")}</TableCell><TableCell align="right">{tx("Quality")}</TableCell><TableCell>{tx("Status")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {data.top_machines.length === 0 ? <TableRow><TableCell colSpan={6}>{tx("No data.")}</TableCell></TableRow> : data.top_machines.map((m) => (
                    <TableRow key={m.machine_id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/machine-equipment/machine-detail?machine=${m.machine_id}`)}>
                      <TableCell sx={{ fontWeight: 800, color: "#1570EF" }}>{m.machine_code}</TableCell><TableCell align="right" sx={{ fontWeight: 800 }}>{num(m.oee, 1)}%</TableCell>
                      <TableCell align="right">{m.availability != null ? `${num(m.availability, 1)}%` : EMPTY}</TableCell><TableCell align="right">{m.performance != null ? `${num(m.performance, 1)}%` : EMPTY}</TableCell>
                      <TableCell align="right">{m.quality != null ? `${num(m.quality, 1)}%` : EMPTY}</TableCell><TableCell><Dot color={MACHINE_COLORS[m.status] || "#98A2B3"} text={tx(MACHINE_TEXT[m.status] || m.status)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Work Order Status")} />
            <Box sx={{ px: 1.5, pb: 1.5 }}>
              <Chart type="donut" height={170} series={stateKeys.length ? stateKeys.map((s) => data.wo_states[s]) : [1]} options={{
                chart: { background: "transparent", fontFamily: '"Bai Jamjuree", sans-serif' }, labels: stateKeys.length ? stateKeys.map((s) => tx(STATE_TEXT[s])) : [tx("No data.")],
                colors: stateKeys.length ? stateKeys.map((s) => STATE_COLORS[s]) : ["#EAECF0"], legend: { show: false }, dataLabels: { enabled: false }, stroke: { width: 2, colors: [dark ? "#111827" : "#fff"] },
                tooltip: { theme: dark ? "dark" : "light" }, plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: tx("WO"), color: axisColor, formatter: () => String(stateTotal) }, value: { fontSize: "18px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033" } } } } },
              }} />
              <Stack spacing={0.5}>{stateKeys.map((s) => (
                <Stack key={s} direction="row" sx={{ justifyContent: "space-between" }}><Dot color={STATE_COLORS[s]} text={tx(STATE_TEXT[s])} />
                  <Typography variant="caption" fontWeight={700}>{data.wo_states[s]} ({num(data.wo_states[s] / Math.max(stateTotal, 1) * 100, 0)}%)</Typography></Stack>
              ))}</Stack>
            </Box>
          </Paper>
          <Paper elevation={0} sx={cardSx}>
            <Head title={tx("Quick Actions")} />
            <Stack spacing={1} sx={{ px: 1.5, pb: 1.5 }}>
              {[[tx("Create Work Order"), AddCircleOutlineIcon, "/production-management/work-orders/management"], [tx("Report Downtime"), BuildOutlinedIcon, "/machine-equipment/downtime-management"],
                [tx("Quality Inspection"), VerifiedUserOutlinedIcon, "/quality-management/inspection-management"], [tx("Material Request"), Inventory2OutlinedIcon, "/material-management/allocation"]].map(([text, Icon, to]) => (
                <Button key={text} onClick={() => navigate(to)} startIcon={<Icon />} sx={{ justifyContent: "flex-start", border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none", fontWeight: 700, py: 1.1, color: "primary.main" }}>{text}</Button>
              ))}
            </Stack>
          </Paper>
        </Box>

        <SystemStatusBar system={data.system} />
        <Snackbar open={msg.open} autoHideDuration={4000} onClose={() => setMsg((o) => ({ ...o, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <Alert severity={msg.type} variant="filled" onClose={() => setMsg((o) => ({ ...o, open: false }))}>{msg.text}</Alert>
        </Snackbar>
      </Box>
    </MuiThemeProvider>
  );
}
