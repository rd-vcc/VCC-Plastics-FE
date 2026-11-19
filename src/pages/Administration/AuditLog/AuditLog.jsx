import "./locales";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Chart from "react-apexcharts";
import {
  Alert, Avatar, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, FormControlLabel, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DataObjectOutlinedIcon from "@mui/icons-material/DataObjectOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import FilterAltOffOutlinedIcon from "@mui/icons-material/FilterAltOffOutlined";
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
import { KpiTile, colShares } from "../../MaterialManagement/materialUi";
import { DialogHeader, Dot, EMPTY, Head, btn, dialogPaperSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { setActiveLanguage as setMaintLanguage } from "../../MaintenanceManagement/maintLocales";
import { DonutCard, MaintFrame, useMaintData } from "../../MaintenanceManagement/maintPage";
import { EmptyBody, FilterToggle, QuickCard, cellsSx, chartBase, fillSx, fitGridSx, panelSx, toolBtnSx } from "../../shared/onePage";
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
  return <Box component="span" sx={{ display: "inline-block", width, textAlign: "center", px: 0.5, py: 0.15, borderRadius: 1, fontSize: 10, fontWeight: 700, color: c, bgcolor: `${c}1A`, border: `1px solid ${c}55` }}>{label(group, value)}</Box>;
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
      <DialogContent sx={{ pt: "12px !important", pb: 1 }}>
        <Stack spacing={0.75}>
          {[["enabled", "Record data-changing actions"], ["capture_changes", "Store before / after values of updates"], ["log_exports", "Record exports and downloads"]].map(([k, t]) => (
            <FormControlLabel key={k} control={<Checkbox checked={f[k]} onChange={(e) => setF((o) => ({ ...o, [k]: e.target.checked }))} />} label={<Typography variant="body2">{tx(t)}</Typography>} />
          ))}
          <TextField size="small" type="number" label={tx("Retention (days)")} value={f.retention_days} onChange={(e) => setF((o) => ({ ...o, retention_days: Number(e.target.value) }))}
            slotProps={{ htmlInput: { min: 30, max: 3650 } }} />
          <Alert severity="info" icon={<LockOutlinedIcon />} sx={{ py: 0 }}>{tx("Audit records are append-only: they cannot be edited or deleted, only aged out after the retention period.")}</Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
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
  const { dark, axisColor, tableSx, request, notify, canEdit } = page;
  const [range, setRange] = useState("LAST_7");
  const [dates, setDates] = useState({ from: daysAgo(6), to: iso(new Date()) });
  const [f, setF] = useState({ user: "", module: "", action: "", severity: "", result: "", ip: "", data_type: "", source: "" });
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [distView, setDistView] = useState("module");
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
  const activeFilters = Object.values(f).filter(Boolean).length;
  const toolbar = (
    <>
      <TextField select size="small" label={tx("Time Range")} value={range} onChange={(e) => setRange(e.target.value)} sx={{ width: 150 }}>
        {[["TODAY", "Today"], ["LAST_7", "Last 7 Days"], ["LAST_30", "Last 30 Days"], ["CUSTOM", "Custom"]].map(([v, t]) => <MenuItem key={v} value={v}>{tx(t)}</MenuItem>)}</TextField>
      {range === "CUSTOM" ? (
        <>
          <TextField size="small" type="date" label={tx("From")} value={dates.from} onChange={(e) => e.target.value && setDates((o) => ({ ...o, from: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
          <TextField size="small" type="date" label={tx("To")} value={dates.to} onChange={(e) => e.target.value && setDates((o) => ({ ...o, to: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 145 }} />
        </>
      ) : null}
      <TextField size="small" placeholder={tx("Search by user, action, record, message...")} value={search} onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") setApplied(search.trim()); }} sx={{ width: 250 }}
        slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setApplied(search.trim())}><SearchIcon fontSize="small" /></IconButton></InputAdornment> } }} />
      <FilterToggle label={tx("Filter")} open={showFilter} count={activeFilters} onClick={() => setShowFilter((v) => !v)} />
    </>
  );
  const filters = showFilter ? (
    <>
      {[["user", "User", "All Users", (lk.users || []).map((u) => [u.user_code, u.user_label || u.user_code]), 200],
        ["module", "Module", "All Modules", (lk.modules || []).map((m) => [m, label("module", m)]), 170],
        ["action", "Action", "All Actions", (lk.actions || []).map((a) => [a, label("action", a)]), 160],
        ["severity", "Severity", "All Severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => [s, label("severity", s)]), 130],
        ["result", "Result", "All Results", ["SUCCESS", "FAILED"].map((s) => [s, label("result", s)]), 130],
        ["ip", "IP Address", "All IP Addresses", (lk.ips || []).map((i) => [i, i]), 150],
        ["data_type", "Data Type", "All Data Types", (lk.data_types || []).map((t) => [t, label("dt", t)]), 170],
        ["source", "Source", "All Sources", ["API", "AUTH", "MODULE"].map((s) => [s, label("source", s)]), 150]].map(([key, lab, all, items, w]) => (
        <TextField key={key} select size="small" label={tx(lab)} value={f[key]} onChange={set(key)} slotProps={SEL} sx={{ width: w }}>
          <MenuItem value="">{tx(all)}</MenuItem>{items.map(([v, t]) => <MenuItem key={v} value={v}>{t}</MenuItem>)}</TextField>
      ))}
      <Button onClick={clear} sx={toolBtnSx}>{tx("Clear")}</Button>
    </>
  ) : null;
  const quick = [
    [tx("Audit Settings"), SettingsOutlinedIcon, "#1570EF", () => setSettingsOpen(true), !canEdit],
    [tx("Scheduled Reports"), EventRepeatOutlinedIcon, "#7A5AF8", () => navigate("/reports-analytics/report-center")],
    [tx("Failed Attempts"), LockOutlinedIcon, "#F04438", () => { setF((o) => ({ ...o, result: "FAILED" })); setShowFilter(true); }],
    [tx("User Management"), GroupOutlinedIcon, "#12B76A", () => navigate("/administration/user-management")],
    [tx("Role & Permission"), AdminPanelSettingsOutlinedIcon, "#F79009", () => navigate("/administration/role-permission")],
    [tx("Clear"), FilterAltOffOutlinedIcon, "#667085", clear],
  ];
  const dist = distView === "severity" ? sevEntries.map(([s, n]) => [s, n, label("severity", s)]) : sum.data?.by_module?.map(([m, n]) => [m, n, label("module", m)]) || [];
  const distColors = distView === "severity" ? SEV_COLORS : Object.fromEntries((sum.data?.by_module || []).map(([m], i) => [m, MOD_COLORS[i % MOD_COLORS.length]]));
  const toggleSx = { px: 1, py: 0.1, textTransform: "none", fontWeight: 700, fontSize: 10.5 };
  const base = chartBase(dark, axisColor);
  const d = detail;
  const userOf = (r) => r.user_label || r.user_name || r.user_code || tx("Unknown");

  return (
    <MaintFrame fit page={page} title={tx("Audit Log")} loading={sum.loading || list.loading} ready={Boolean(sum.data)} lastUpdate={sum.lastUpdate} live={sum.live} setLive={sum.setLive}
      onRefresh={() => { sum.load(); list.load(); }} onExport={() => exportLog("XLSX")} toolbar={toolbar} filters={filters} system={sum.data?.system}>
      {sum.data ? (
        <>
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

          <Box sx={{ ...fitGridSx, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))", lg: "repeat(4, minmax(0,1fr))" }, gridTemplateRows: { lg: "minmax(0,1fr) minmax(0,1fr) minmax(0,0.9fr)" } }}>
            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "1 / 4" }, gridRow: { lg: "1 / 3" }, minHeight: { xs: 360, lg: 0 } }}>
              <Head title={`${tx("Activity Log")} (${num(list.data?.total || 0)})`}
                action={<Typography variant="caption" color="text.secondary" noWrap title={tx("The old module histories were imported: status changes before the Audit Log was enabled.")}>
                  {tx("showing {n} of {t}", { n: num(rows.length), t: num(list.data?.total || 0) })} · {num(sum.data.overall?.n)} {tx("records in total")} · {tx("since")} {fmtTime(sum.data.overall?.first_at)}</Typography>} />
              {rows.length ? (
                <Box sx={fillSx}>
                  <Table size="small" stickyHeader sx={{ ...tableSx, ...cellsSx, ...colShares(12.5, 15, 9, 9, 11, 9, 8, 8, 9, 9.5) }}>
                    <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("User")}</TableCell><TableCell>{tx("Role")}</TableCell><TableCell>{tx("Module")}</TableCell>
                      <TableCell>{tx("Action")}</TableCell><TableCell>{tx("Data Type")}</TableCell><TableCell>{tx("Record ID")}</TableCell><TableCell>{tx("IP Address")}</TableCell>
                      <TableCell align="center">{tx("Result")}</TableCell><TableCell align="center">{tx("Severity")}</TableCell></TableRow></TableHead>
                    <TableBody>{rows.map((r) => (
                      <TableRow key={r.id} hover selected={sel === r.id} sx={{ cursor: "pointer" }} onClick={() => setSel(r.id)}>
                        <TableCell>{fmtTime(r.event_at)}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }} title={userOf(r)}>{userOf(r)}</TableCell><TableCell title={r.role_name || ""}>{r.role_name || EMPTY}</TableCell>
                        <TableCell>{label("module", r.module)}</TableCell>
                        <TableCell>{label("action", r.action)}{r.has_changes ? <DataObjectOutlinedIcon sx={{ fontSize: 11.5, ml: 0.4, verticalAlign: "middle", color: "#1570EF" }} /> : null}</TableCell>
                        <TableCell title={label("dt", r.data_type)}>{label("dt", r.data_type)}</TableCell><TableCell sx={{ color: "#1570EF", fontWeight: 700 }} title={r.record_id || ""}>{r.record_id || EMPTY}</TableCell><TableCell>{r.ip_address || EMPTY}</TableCell>
                        <TableCell align="center"><Pill value={r.result} colors={RES_COLORS} group="result" /></TableCell><TableCell align="center"><Pill value={r.severity} colors={SEV_COLORS} group="severity" /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { md: "1 / -1", lg: "4" }, gridRow: { lg: "1 / 3" } }}>
              <Head title={tx("Activity Details")} action={d ? <IconButton size="small" onClick={() => setSel(null)}><CloseIcon fontSize="small" /></IconButton> : null} />
              {!d ? <EmptyBody text={tx("Select a row to see its details.")} /> : (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1.25 }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 1 }}>
                    <Avatar sx={{ bgcolor: "#1570EF", width: 30, height: 30, fontSize: 12 }}>{initials(d.user_code_name || d.user_name || d.user_code)}</Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" fontWeight={800} noWrap sx={{ display: "block", color: d.user_code ? "#1570EF" : undefined, cursor: d.user_code ? "pointer" : "default" }}
                        onClick={() => d.user_code && navigate("/administration/user-management")}>{userOf(d)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ cursor: d.role_name ? "pointer" : "default" }} onClick={() => d.role_name && navigate("/administration/role-permission")}>{d.role_name || EMPTY}</Typography>
                    </Box>
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 1.5, rowGap: 0.3 }}>
                    {[[tx("Time"), fmtTime(d.event_at)], [tx("Module"), label("module", d.module)], [tx("Action"), label("action", d.action)], [tx("Description"), d.description],
                      [tx("Data Type"), label("dt", d.data_type)], [tx("Record ID"), d.record_id], [tx("IP Address"), d.ip_address], [tx("Result"), <Pill key="r" value={d.result} colors={RES_COLORS} group="result" />],
                      [tx("Severity"), <Pill key="s" value={d.severity} colors={SEV_COLORS} group="severity" />], [tx("HTTP"), d.status_code], [tx("Duration"), d.duration_ms != null ? `${d.duration_ms} ms` : EMPTY],
                      [tx("Browser / Device"), d.user_agent], [tx("Session ID"), d.session_id], [tx("Source"), label("source", d.source)], d.message ? [tx("Message"), d.message] : null]
                      .filter(Boolean).map(([a, b]) => [<Typography key={`${a}k`} variant="caption" color="text.secondary">{a}</Typography>,
                        <Typography key={`${a}v`} variant="caption" fontWeight={700} sx={{ overflowWrap: "anywhere", color: a === tx("Message") ? "#F04438" : undefined }}>{b ?? EMPTY}</Typography>])}
                  </Box>
                  <Typography variant="caption" fontWeight={800} sx={{ display: "block", mt: 1.25, mb: 0.5 }}>{tx("Before / After Changes")}</Typography>
                  {d.changes?.length ? (
                    <Box sx={{ maxHeight: 200, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1.5 }}>
                      <Table size="small" sx={{ "& .MuiTableCell-root": { fontSize: 10, px: 0.75, py: 0.4, verticalAlign: "top" }, "& th": { fontWeight: 800 } }}>
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
                      <Typography variant="caption" fontWeight={800} sx={{ display: "block", mt: 1.25, mb: 0.5 }}>{tx("Request data")}</Typography>
                      <Box component="pre" sx={{ m: 0, p: 1, bgcolor: "action.hover", borderRadius: 1.5, fontSize: 10, maxHeight: 150, overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                        {JSON.stringify(d.request, null, 2)}</Box>
                    </>
                  ) : null}
                  {d.related?.length ? (
                    <>
                      <Typography variant="caption" fontWeight={800} sx={{ display: "block", mt: 1.25, mb: 0.5 }}>{tx("Related records")} · {d.record_id}</Typography>
                      {d.related.map((r) => (
                        <Stack key={r.id} direction="row" spacing={1} onClick={() => setSel(r.id)} sx={{ py: 0.3, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}>
                          <Typography variant="caption" color="text.secondary" sx={{ width: 118, flexShrink: 0 }}>{fmtTime(r.event_at)}</Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ flex: 1 }} noWrap>{label("action", r.action)}</Typography><Typography variant="caption" noWrap>{userOf(r)}</Typography>
                        </Stack>
                      ))}
                    </>
                  ) : null}
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "1" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Activities Over Time")} action={<Stack direction="row" spacing={1.5}><Dot color="#1570EF" text={tx("Activities")} /><Dot color="#F04438" text={tx("Failed")} /></Stack>} />
              <Box sx={{ flex: 1, minHeight: 0, px: 1 }}>
                <Chart type="area" height="100%" series={[{ name: tx("Activities"), data: sum.data.trend.map((t) => t.count) }, { name: tx("Failed"), data: sum.data.trend.map((t) => t.failed) }]} options={{
                  ...base, colors: ["#1570EF", "#F04438"], stroke: { width: 2 }, fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0.02 } }, markers: { size: 2 },
                  xaxis: { ...base.xaxis, categories: sum.data.trend.map((t) => `${String(t.date).slice(8, 10)}/${String(t.date).slice(5, 7)}`) },
                  yaxis: { min: 0, tickAmount: 3, labels: { ...base.yaxis.labels, formatter: (v) => num(v, 0) } } }} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "2" }, gridRow: { lg: "3" } }}>
              <Head title={distView === "severity" ? tx("Activity Severity Distribution") : tx("Activities by Module")} action={(
                <ToggleButtonGroup exclusive size="small" value={distView} onChange={(e, v) => v && setDistView(v)}>
                  <ToggleButton value="module" sx={toggleSx}>{tx("Module")}</ToggleButton>
                  <ToggleButton value="severity" sx={toggleSx}>{tx("Severity")}</ToggleButton>
                </ToggleButtonGroup>
              )} />
              {dist.length ? (
                <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", alignItems: "center" }}>
                  <Box sx={{ width: "100%", "& .MuiStack-root": { maxHeight: 150, overflow: "auto" } }}>
                    <DonutCard entries={dist} colors={distColors} dark={dark} axisColor={axisColor} height={140} size={130} />
                  </Box>
                </Box>
              ) : <EmptyBody text={tx("No data.")} />}
            </Paper>

            <Paper elevation={0} sx={{ ...panelSx, gridColumn: { lg: "3" }, gridRow: { lg: "3" } }}>
              <Head title={tx("Top Users by Activities")} action={<Typography variant="caption" color="text.secondary">{tx("Total Users")}: <b>{num(k.users)}</b></Typography>} />
              <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: 1.5, pb: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                {sum.data.top_users.map((u, i) => (
                  <Box key={u.code || u.u} sx={{ cursor: u.code ? "pointer" : "default" }} onClick={() => u.code && setF((o) => ({ ...o, user: u.code }))}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}><Typography variant="caption" fontWeight={700} noWrap>{i + 1}. {u.u}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{num(u.n)} ({num((u.n / Math.max(k.total, 1)) * 100, 1)}%)</Typography></Stack>
                    <LinearProgress variant="determinate" value={(u.n / topMax) * 100} sx={{ height: 5, borderRadius: 3 }} />
                  </Box>
                ))}
              </Box>
            </Paper>

            <Box sx={{ gridColumn: { lg: "4" }, gridRow: { lg: "3" }, display: "flex", minHeight: 0, "& > *": { flex: 1 } }}>
              <QuickCard title={tx("Quick Actions")} actions={quick} columns={3} />
            </Box>
          </Box>
          {settingsOpen ? <SettingsDialog settings={sum.data.settings || {}} request={request} notify={notify} onClose={() => setSettingsOpen(false)} onSaved={() => { setSettingsOpen(false); sum.load(); list.load(); }} /> : null}
        </>
      ) : null}
    </MaintFrame>
  );
}
