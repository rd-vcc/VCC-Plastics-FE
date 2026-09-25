import "./locales";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Avatar, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, FormControlLabel, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DataObjectOutlinedIcon from "@mui/icons-material/DataObjectOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";

import { KpiCardGroup } from "../../../components/kpi/KpiCardSystem";
import { API_CONFIG } from "../../../config/config";
import { KpiTile } from "../../MaterialManagement/materialUi";
import { DialogHeader, EMPTY, Head, btn, cardSx, dialogPaperSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { setActiveLanguage as setMaintLanguage } from "../../MaintenanceManagement/maintLocales";
import { MaintFrame, useMaintData } from "../../MaintenanceManagement/maintPage";
import { SEL } from "../../MaintenanceManagement/maintUi";
import { useQualityPage } from "../../QualityManagement/qualityPage";
import { download } from "../../ReportsAnalytics/ReportCenter/reportDialogs";
import { isVi, label, setActiveLanguage, tx } from "./auditLocales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
const AUDIT_API = `${BASE}/api/audit-logs`;
const SEV_COLORS = { LOW: "#12B76A", MEDIUM: "#F79009", HIGH: "#F04438", CRITICAL: "#B42318" };
const RES_COLORS = { SUCCESS: "#12B76A", FAILED: "#F04438" };
const MOD_COLORS = ["#1570EF", "#F79009", "#12B76A", "#7A5AF8", "#F04438", "#0E9384", "#2E90FA", "#EAAA08", "#98A2B3"];
const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const daysAgo = (n) => iso(new Date(Date.now() - n * 86400000));
const fmtTime = (v) => { if (!v) return EMPTY; const s = String(v); return `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)} ${s.slice(11, 19)}`; };
const Pill = ({ value, colors, group, width = 86 }) => {
  const c = colors[value] || "#667085";
  return <Box component="span" sx={{ display: "inline-block", width, textAlign: "center", px: 0.5, py: 0.15, borderRadius: 1, fontSize: 11, fontWeight: 700, color: c, bgcolor: `${c}1A`, border: `1px solid ${c}55` }}>{label(group, value)}</Box>;
};
const show = (v) => (v == null ? EMPTY : typeof v === "object" ? JSON.stringify(v) : String(v));
const initials = (n) => String(n || "?").replace(/\(.*\)/, "").trim().split(/\s+/).slice(-2).map((w) => w[0]).join("").toUpperCase();

function SettingsDialog({ settings, request, notify, onClose, onSaved }) {
  const [f, setF] = useState({ enabled: settings["audit.enabled"] !== "0", capture_changes: settings["audit.capture_changes"] !== "0", log_exports: settings["audit.log_exports"] !== "0",
    retention_days: Number(settings["audit.retention_days"] || 730) });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try { await request(`${AUDIT_API}/settings/config`, { method: "PUT", body: JSON.stringify(f) }); notify("success", tx("Saved.")); onSaved(); } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<SettingsOutlinedIcon />} title={tx("Audit Settings")} onClose={onClose} disabled={busy} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1}>
          {[["enabled", "Record data-changing actions"], ["capture_changes", "Store before / after values of updates"], ["log_exports", "Record exports and downloads"]].map(([k, t]) => (
            <FormControlLabel key={k} control={<Checkbox checked={f[k]} onChange={(e) => setF((o) => ({ ...o, [k]: e.target.checked }))} />} label={<Typography variant="body2">{tx(t)}</Typography>} />
          ))}
          <TextField size="small" type="number" label={tx("Retention (days)")} value={f.retention_days} onChange={(e) => setF((o) => ({ ...o, retention_days: Number(e.target.value) }))}
            slotProps={{ htmlInput: { min: 30, max: 3650 } }} />
          <Alert severity="info" icon={<LockOutlinedIcon />} sx={{ py: 0 }}>{tx("Audit records are append-only: they cannot be edited or deleted, only aged out after the retention period.")}</Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={save} disabled={busy || f.retention_days < 30} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AuditLog() {
  const page = useQualityPage();
  const { i18n } = useTranslation();
  setActiveLanguage(i18n.resolvedLanguage || i18n.language || "en");
  setMaintLanguage(i18n.resolvedLanguage || i18n.language || "en");
  const navigate = useNavigate();
  const { dark, axisColor, grid, tableSx, request, notify, canEdit } = page;
  const [range, setRange] = useState("LAST_7");
  const [dates, setDates] = useState({ from: daysAgo(6), to: iso(new Date()) });
  const [f, setF] = useState({ user: "", module: "", action: "", severity: "", result: "", ip: "", data_type: "", source: "" });
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    if (range === "TODAY") setDates({ from: iso(new Date()), to: iso(new Date()) });
    if (range === "LAST_7") setDates({ from: daysAgo(6), to: iso(new Date()) });
    if (range === "LAST_30") setDates({ from: daysAgo(29), to: iso(new Date()) });
  }, [range]);
  const query = new URLSearchParams(Object.entries({ date_from: dates.from, date_to: dates.to, ...f, search: applied }).filter(([, v]) => v)).toString();
  const sum = useMaintData(page, `${AUDIT_API}/summary?${query}`, { interval: 60000, paused: Boolean(settingsOpen) });
  const list = useMaintData(page, `${AUDIT_API}?${query}&limit=500`, { interval: 60000, paused: Boolean(settingsOpen) });
  useEffect(() => {
    if (!sel) { setDetail(null); return; }
    request(`${AUDIT_API}/${sel}`).then(setDetail).catch((e) => notify("error", e.message));
  }, [sel, request, notify]);
  const k = sum.data?.kpis || {};
  const lk = sum.data?.lookups || {};
  const rows = list.data?.items || [];
  const set = (key) => (e) => setF((o) => ({ ...o, [key]: e.target.value }));
  const clear = () => { setF({ user: "", module: "", action: "", severity: "", result: "", ip: "", data_type: "", source: "" }); setSearch(""); setApplied(""); setRange("LAST_7"); };
  const exportLog = async (fmt) => {
    try { await download(`${AUDIT_API}/export/file?${query}&format=${fmt}&lang=${isVi() ? "vi" : "en"}`, `audit-log.${fmt.toLowerCase()}`); } catch (e) { notify("error", e.message); }
  };
  const change = k.total_prev ? Math.round(((k.total - k.total_prev) / k.total_prev) * 1000) / 10 : null;
  const sevEntries = ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => [s, sum.data?.by_severity?.[s] || 0]).filter(([, n]) => n);
  const topMax = sum.data?.top_users?.[0]?.n || 1;
  const toolbar = (
    <>
      <Button startIcon={<FileDownloadOutlinedIcon />} onClick={() => exportLog("XLSX")} sx={btn("edit")}>{tx("Export Log")}</Button>
      <Button startIcon={<EventRepeatOutlinedIcon />} onClick={() => navigate("/reports-analytics/report-center")} sx={{ ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" }}>{tx("Scheduled Reports")}</Button>
      {canEdit ? <Button startIcon={<SettingsOutlinedIcon />} onClick={() => setSettingsOpen(true)} sx={{ ...btn("cancel"), bgcolor: "background.paper", border: 1, borderColor: "divider" }}>{tx("Audit Settings")}</Button> : null}
    </>
  );
  const d = detail;

  return (
    <MaintFrame page={page} title={tx("Audit Log")} loading={sum.loading || list.loading} ready={Boolean(sum.data)} lastUpdate={sum.lastUpdate} live={sum.live} setLive={sum.setLive}
      onRefresh={() => { sum.load(); list.load(); }} onExport={() => exportLog("CSV")} toolbar={toolbar} system={sum.data?.system}>
      {sum.data ? (
        <>
          <Box sx={{ mb: 1.5 }}>
            <KpiCardGroup columns={{ xs: "repeat(2, minmax(0,1fr))", md: "repeat(3, minmax(0,1fr))", xl: "repeat(6, minmax(0,1fr))" }}>
              <KpiTile tone="primary" title={tx("Total Activities")} value={num(k.total)} sub={change != null ? `${change >= 0 ? "▲" : "▼"} ${num(Math.abs(change), 1)}% ${tx("vs previous period")}` : tx("vs previous period")}
                icon={TimelineOutlinedIcon} onClick={clear} />
              <KpiTile tone="success" title={tx("Users")} value={num(k.users)} sub={tx("active users")} icon={GroupOutlinedIcon} />
              <KpiTile tone="warning" title={tx("Modules")} value={num(k.modules)} sub={tx("modules accessed")} icon={ViewInArOutlinedIcon} />
              <KpiTile tone="accent" title={tx("Critical Events")} value={num(k.critical)} sub={tx("require attention")} icon={GppMaybeOutlinedIcon} onClick={() => setF((o) => ({ ...o, severity: "HIGH" }))} />
              <KpiTile tone="info" title={tx("Failed Attempts")} value={num(k.failed_access)} sub={`${tx("login / access failures")} · ${num(k.failed)} ${tx("Failed")}`} icon={LockOutlinedIcon}
                onClick={() => setF((o) => ({ ...o, result: "FAILED" }))} />
              <KpiTile tone="danger" title={tx("Data Changes")} value={num(k.changes)} sub={tx("data modified")} icon={StorageOutlinedIcon} />
            </KpiCardGroup>
          </Box>

          <Paper elevation={0} sx={{ ...cardSx, p: 1.25, mb: 1.5 }}>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <TextField size="small" label={tx("Search")} placeholder={tx("Search by user, action, record, message...")} value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setApplied(search.trim()); }} sx={{ width: 260 }} slotProps={{ inputLabel: { shrink: true },
                  input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setApplied(search.trim())}><SearchIcon fontSize="small" /></IconButton></InputAdornment> } }} />
              <TextField select size="small" label={tx("Time Range")} value={range} onChange={(e) => setRange(e.target.value)} sx={{ width: 160 }}>
                {[["TODAY", "Today"], ["LAST_7", "Last 7 Days"], ["LAST_30", "Last 30 Days"], ["CUSTOM", "Custom"]].map(([v, t]) => <MenuItem key={v} value={v}>{tx(t)}</MenuItem>)}</TextField>
              {range === "CUSTOM" ? (
                <>
                  <TextField size="small" type="date" label={tx("From")} value={dates.from} onChange={(e) => e.target.value && setDates((o) => ({ ...o, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField size="small" type="date" label={tx("To")} value={dates.to} onChange={(e) => e.target.value && setDates((o) => ({ ...o, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
                </>
              ) : null}
              {[["user", "User", "All Users", (lk.users || []).map((u) => [u.user_code, u.user_name || u.user_code]), 190],
                ["module", "Module", "All Modules", (lk.modules || []).map((m) => [m, label("module", m)]), 190],
                ["action", "Action", "All Actions", (lk.actions || []).map((a) => [a, label("action", a)]), 170],
                ["severity", "Severity", "All Severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => [s, label("severity", s)]), 140],
                ["result", "Result", "All Results", ["SUCCESS", "FAILED"].map((s) => [s, label("result", s)]), 140],
                ["ip", "IP Address", "All IP Addresses", (lk.ips || []).map((i) => [i, i]), 160],
                ["data_type", "Data Type", "All Data Types", (lk.data_types || []).map((t) => [t, label("dt", t)]), 180],
                ["source", "Source", "All Sources", ["API", "AUTH", "MODULE"].map((s) => [s, label("source", s)]), 170]].map(([key, lab, all, items, w]) => (
                <TextField key={key} select size="small" label={tx(lab)} value={f[key]} onChange={set(key)} slotProps={SEL} sx={{ width: w }}>
                  <MenuItem value="">{tx(all)}</MenuItem>{items.map(([v, t]) => <MenuItem key={v} value={v}>{t}</MenuItem>)}</TextField>
              ))}
              <Button onClick={clear} sx={btn("cancel")}>{tx("Clear")}</Button>
            </Stack>
          </Paper>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "minmax(0,1fr) 380px" }, gap: 1.5, mb: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={`${tx("Activity Log")} (${num(list.data?.total || 0)})`} action={<Typography variant="caption" color="text.secondary">{tx("showing {n} of {t}", { n: num(rows.length), t: num(list.data?.total || 0) })}</Typography>} />
              {list.loading ? <LinearProgress /> : null}
              <Box sx={{ px: 1, pb: 1, height: 520, overflow: "auto" }}>
                <Table size="small" stickyHeader sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("User")}</TableCell><TableCell>{tx("Role")}</TableCell><TableCell>{tx("Module")}</TableCell>
                    <TableCell>{tx("Action")}</TableCell><TableCell>{tx("Data Type")}</TableCell><TableCell>{tx("Record ID")}</TableCell><TableCell>{tx("IP Address")}</TableCell>
                    <TableCell align="center">{tx("Result")}</TableCell><TableCell align="center">{tx("Severity")}</TableCell></TableRow></TableHead>
                  <TableBody>{rows.map((r) => (
                    <TableRow key={r.id} hover selected={sel === r.id} sx={{ cursor: "pointer" }} onClick={() => setSel(r.id)}>
                      <TableCell>{fmtTime(r.event_at)}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{r.user_name || r.user_code || tx("Unknown")}</TableCell><TableCell>{r.role_name || EMPTY}</TableCell>
                      <TableCell>{label("module", r.module)}</TableCell>
                      <TableCell>{label("action", r.action)}{r.has_changes ? <DataObjectOutlinedIcon sx={{ fontSize: 13, ml: 0.4, verticalAlign: "middle", color: "#1570EF" }} /> : null}</TableCell>
                      <TableCell>{label("dt", r.data_type)}</TableCell><TableCell sx={{ color: "#1570EF", fontWeight: 700 }}>{r.record_id || EMPTY}</TableCell><TableCell>{r.ip_address || EMPTY}</TableCell>
                      <TableCell align="center"><Pill value={r.result} colors={RES_COLORS} group="result" /></TableCell><TableCell align="center"><Pill value={r.severity} colors={SEV_COLORS} group="severity" /></TableCell></TableRow>
                  ))}</TableBody>
                </Table>
                {!rows.length ? <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: "block" }}>{tx("No data.")}</Typography> : null}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, pb: 1, display: "block" }}>
                {num(sum.data.overall?.n)} {tx("records in total")} · {tx("since")} {fmtTime(sum.data.overall?.first_at)} · {tx("The old module histories were imported: status changes before the Audit Log was enabled.")}</Typography>
            </Paper>

            <Paper elevation={0} sx={{ ...cardSx, alignSelf: "start" }}>
              <Head title={tx("Activity Details")} action={d ? <IconButton size="small" onClick={() => setSel(null)}><CloseIcon fontSize="small" /></IconButton> : null} />
              {!d ? <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, pb: 1.5, display: "block" }}>{tx("Select a row to see its details.")}</Typography> : (
                <Box sx={{ px: 1.5, pb: 1.5 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: "#1570EF", width: 44, height: 44, fontSize: 16 }}>{initials(d.user_name || d.user_code)}</Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: d.user_code ? "#1570EF" : undefined, cursor: d.user_code ? "pointer" : "default" }}
                        onClick={() => d.user_code && navigate("/administration/user-management")}>{d.user_name || d.user_code || tx("Unknown")}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ cursor: d.role_name ? "pointer" : "default" }} onClick={() => d.role_name && navigate("/administration/role-permission")}>{d.role_name || EMPTY}</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.45 }}>
                    {[[tx("Time"), fmtTime(d.event_at)], [tx("Module"), label("module", d.module)], [tx("Action"), label("action", d.action)], [tx("Description"), d.description],
                      [tx("Data Type"), label("dt", d.data_type)], [tx("Record ID"), d.record_id], [tx("IP Address"), d.ip_address], [tx("Result"), <Pill key="r" value={d.result} colors={RES_COLORS} group="result" />],
                      [tx("Severity"), <Pill key="s" value={d.severity} colors={SEV_COLORS} group="severity" />], [tx("HTTP"), d.status_code], [tx("Duration"), d.duration_ms != null ? `${d.duration_ms} ms` : EMPTY],
                      [tx("Browser / Device"), d.user_agent], [tx("Session ID"), d.session_id], [tx("Source"), label("source", d.source)], d.message ? [tx("Message"), d.message] : null]
                      .filter(Boolean).map(([a, b]) => [<Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>,
                        <Typography key={`${a}v`} variant="caption" fontWeight={700} sx={{ overflowWrap: "anywhere", color: a === tx("Message") ? "#F04438" : undefined }}>{b ?? EMPTY}</Typography>])}
                  </Box>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 0.5 }}>{tx("Before / After Changes")}</Typography>
                  {d.changes?.length ? (
                    <Box sx={{ maxHeight: 220, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                      <Table size="small" sx={{ "& td, & th": { fontSize: 11, px: 0.75, py: 0.4, verticalAlign: "top" }, "& th": { fontWeight: 800 } }}>
                        <TableHead><TableRow><TableCell>{tx("Field")}</TableCell><TableCell>{tx("Before")}</TableCell><TableCell>{tx("After")}</TableCell></TableRow></TableHead>
                        <TableBody>{d.changes.map((c) => (
                          <TableRow key={c.field}><TableCell sx={{ fontWeight: 700 }}>{c.field}</TableCell>
                            <TableCell sx={{ color: "#B42318", bgcolor: "#F044380A", overflowWrap: "anywhere", maxWidth: 110 }}>{show(c.before)}</TableCell>
                            <TableCell sx={{ color: "#067647", bgcolor: "#12B76A0F", overflowWrap: "anywhere", maxWidth: 110 }}>{show(c.after)}</TableCell></TableRow>
                        ))}</TableBody>
                      </Table>
                    </Box>
                  ) : <Typography variant="caption" color="text.secondary">{tx("No field change recorded.")}</Typography>}
                  {d.request ? (
                    <>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 0.5 }}>{tx("Request data")}</Typography>
                      <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "action.hover", borderRadius: 1.5, fontSize: 10.5, maxHeight: 160, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {JSON.stringify(d.request, null, 2)}</Box>
                    </>
                  ) : null}
                  {d.related?.length ? (
                    <>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1.5, mb: 0.5 }}>{tx("Related records")} · {d.record_id}</Typography>
                      {d.related.map((r) => (
                        <Stack key={r.id} direction="row" spacing={1} onClick={() => setSel(r.id)} sx={{ py: 0.4, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                          <Typography variant="caption" color="text.secondary" sx={{ width: 120 }}>{fmtTime(r.event_at)}</Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ flex: 1 }}>{label("action", r.action)}</Typography><Typography variant="caption">{r.user_name}</Typography>
                        </Stack>
                      ))}
                    </>
                  ) : null}
                </Box>
              )}
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", xl: "repeat(4, minmax(0,1fr))" }, gap: 1.5 }}>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Activities Over Time")} />
              <Box sx={{ px: 1 }}>
                <Chart type="area" height={230} series={[{ name: tx("Activities"), data: sum.data.trend.map((t) => t.count) }, { name: tx("Failed"), data: sum.data.trend.map((t) => t.failed) }]} options={{
                  chart: { background: "transparent", toolbar: { show: false } }, colors: ["#1570EF", "#F04438"], stroke: { width: 2 }, fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.02 } },
                  dataLabels: { enabled: false }, markers: { size: 3 }, grid, legend: { position: "top", labels: { colors: axisColor } },
                  xaxis: { categories: sum.data.trend.map((t) => `${String(t.date).slice(8, 10)}/${String(t.date).slice(5, 7)}`), labels: { style: { colors: axisColor, fontSize: "10px" }, hideOverlappingLabels: true } },
                  yaxis: { min: 0, labels: { style: { colors: axisColor }, formatter: (v) => num(v, 0) } }, tooltip: { theme: dark ? "dark" : "light" } }} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Activities by Module")} />
              {sum.data.by_module.length ? (
                <Chart type="donut" height={230} series={sum.data.by_module.map(([, n]) => n)} options={{
                  labels: sum.data.by_module.map(([m]) => label("module", m)), colors: MOD_COLORS, legend: { position: "right", labels: { colors: axisColor }, fontSize: "10px" }, dataLabels: { enabled: false },
                  chart: { background: "transparent", events: { dataPointSelection: (e, c, cfg) => { const m = sum.data.by_module[cfg.dataPointIndex]; if (m) setF((o) => ({ ...o, module: m[0] })); } } },
                  stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
                  plotOptions: { pie: { donut: { size: "64%", labels: { show: true, name: { color: axisColor, fontSize: "11px" }, value: { color: dark ? "#fff" : "#101828", fontWeight: 800 }, total: { show: true, label: tx("Total"), color: axisColor } } } } } }} />
              ) : <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>{tx("No data.")}</Typography>}
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Top Users by Activities")} />
              <Box sx={{ px: 1.5, pb: 1.5 }}>
                {sum.data.top_users.map((u, i) => (
                  <Box key={u.u} sx={{ py: 0.6, cursor: u.code ? "pointer" : "default" }} onClick={() => u.code && setF((o) => ({ ...o, user: u.code }))}>
                    <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="caption" fontWeight={700}>{i + 1}. {u.u}</Typography>
                      <Typography variant="caption" color="text.secondary">{num(u.n)} ({num((u.n / Math.max(k.total, 1)) * 100, 1)}%)</Typography></Stack>
                    <LinearProgress variant="determinate" value={(u.n / topMax) * 100} sx={{ height: 5, borderRadius: 3 }} />
                  </Box>
                ))}
                <Stack direction="row" sx={{ justifyContent: "space-between", mt: 1 }}><Typography variant="caption" fontWeight={800}>{tx("Total Users")}</Typography><Typography variant="caption" fontWeight={800}>{num(k.users)}</Typography></Stack>
              </Box>
            </Paper>
            <Paper elevation={0} sx={cardSx}>
              <Head title={tx("Activity Severity Distribution")} />
              {sevEntries.length ? (
                <Chart type="donut" height={230} series={sevEntries.map(([, n]) => n)} options={{
                  labels: sevEntries.map(([s]) => label("severity", s)), colors: sevEntries.map(([s]) => SEV_COLORS[s]), legend: { position: "right", labels: { colors: axisColor }, fontSize: "11px" },
                  dataLabels: { enabled: false }, chart: { background: "transparent", events: { dataPointSelection: (e, c, cfg) => { const s = sevEntries[cfg.dataPointIndex]; if (s) setF((o) => ({ ...o, severity: s[0] })); } } },
                  stroke: { width: 1, colors: [dark ? "#111827" : "#fff"] }, tooltip: { theme: dark ? "dark" : "light" },
                  plotOptions: { pie: { donut: { size: "64%", labels: { show: true, name: { color: axisColor, fontSize: "11px" }, value: { color: dark ? "#fff" : "#101828", fontWeight: 800 }, total: { show: true, label: tx("Total"), color: axisColor } } } } } }} />
              ) : <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>{tx("No data.")}</Typography>}
            </Paper>
          </Box>
          {settingsOpen ? <SettingsDialog settings={sum.data.settings || {}} request={request} notify={notify} onClose={() => setSettingsOpen(false)} onSaved={() => { setSettingsOpen(false); sum.load(); list.load(); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}

