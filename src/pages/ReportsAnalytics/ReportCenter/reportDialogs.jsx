import { useCallback, useEffect, useState } from "react";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, FormControlLabel, IconButton, LinearProgress, MenuItem, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import TableViewOutlinedIcon from "@mui/icons-material/TableViewOutlined";

import { getAccessToken } from "../../../auth/auth";
import { resolveImageUrl } from "../../../components/common/ImageUploadField";
import { API_CONFIG } from "../../../config/config";
import { DialogHeader, EMPTY, btn, ddmmhhmm, dialogPaperSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { isVi, label, tx } from "./reportLocales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
export const REPORT_API = `${BASE}/api/reports`;
export const RANGES = ["TODAY", "YESTERDAY", "LAST_7", "LAST_30", "MTD", "LAST_MONTH"];
export const reportName = (r) => (isVi() ? r.name_vi || r.vi || r.name_en : r.name_en || r.en);
const dateText = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : EMPTY);

export function fmtCell(v, type) {
  if (v == null || v === "") return EMPTY;
  if (type === "int") return num(v, 0);
  if (type === "num") return num(v, 3);
  if (type === "money") return `${num(v, 0)} ₫`;
  if (type === "pct") return `${num(v, 2)}%`;
  if (type === "date") return dateText(v);
  if (type === "datetime") return ddmmhhmm(v);
  return String(v);
}

/** Download a server file (export endpoint needs the bearer token). */
export async function download(url, fallbackName) {
  const token = getAccessToken();
  const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body?.detail || `HTTP ${r.status}`);
  }
  const blob = await r.blob();
  const name = (r.headers.get("content-disposition") || "").match(/filename="([^"]+)"/)?.[1] || fallbackName;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v != null)).toString();

/** Printable page (Print / Save as PDF) of the preview data. */
function printReport(title, data) {
  const cols = data.columns;
  const esc = (s) => String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const head = cols.map((c) => `<th>${esc(isVi() ? c.vi : c.en)}</th>`).join("");
  const body = data.rows.map((r) => `<tr>${cols.map((c) => `<td class="${["int", "num", "money", "pct"].includes(c.type) ? "n" : ""}">${esc(fmtCell(r[c.key], c.type))}</td>`).join("")}</tr>`).join("");
  const summary = data.summary.map((s) => `<span><b>${esc(isVi() ? s.vi : s.en)}:</b> ${esc(fmtCell(s.value, s.type))}</span>`).join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<html><head><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;font-size:11px;margin:16px}h1{font-size:18px;margin:0}
    .sub{color:#667085;margin:4px 0 10px}.sum span{display:inline-block;margin:0 14px 6px 0}table{border-collapse:collapse;width:100%}th,td{border:1px solid #D0D5DD;padding:3px 5px;text-align:left}
    th{background:#E8F1FF}td.n{text-align:right}@page{size:landscape;margin:10mm}</style></head><body><h1>${esc(title)}</h1>
    <div class="sub">${esc(tx("Period"))}: ${dateText(data.range.from)} – ${dateText(data.range.to)} · ${esc(tx("Generated"))}: ${new Date().toLocaleString()} · VCC Plastics MES</div>
    <div class="sum">${summary}</div><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 300);
}

export function PreviewDialog({ report, request, actor, notify, dark, axisColor, grid, onClose, onChanged }) {
  const [range, setRange] = useState(report.range_type || "LAST_7");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const lang = isVi() ? "vi" : "en";
  const params = range === "CUSTOM" ? { date_from: from, date_to: to } : { range_type: range };
  const run = useCallback(async () => {
    if (range === "CUSTOM" && (!from || !to)) return;
    setBusy(true);
    try { setData(await request(`${REPORT_API}/run/${report.code}?${qs({ ...params, lang, actor })}`)); onChanged?.(); } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  }, [report.code, range, from, to, actor]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [range]); // eslint-disable-line react-hooks/exhaustive-deps
  const exp = async (fmt) => {
    try { await download(`${REPORT_API}/export/${report.code}?${qs({ ...params, format: fmt, lang, actor })}`, `${report.code}.${fmt.toLowerCase()}`); notify("success", tx("Saved.")); onChanged?.(); }
    catch (e) { notify("error", e.message); }
  };
  const print = async () => {
    if (!data) return;
    printReport(reportName(report), data);
    try { await request(`${REPORT_API}/print/${report.code}`, { method: "POST", body: JSON.stringify({ date_from: data.range.from, date_to: data.range.to, rows: data.rows.length, actor }) }); onChanged?.(); } catch { /* print log only */ }
  };
  const chart = data?.chart;
  const colOf = (k) => data?.columns.find((c) => c.key === k);
  const chartRows = data && chart ? data.rows.slice(0, 40) : [];
  return (
    <Dialog open onClose={onClose} maxWidth="xl" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<AssessmentOutlinedIcon />} title={reportName(report)} subtitle={`${label("module", report.module)} · ${label("category", report.category)} · ${(isVi() ? report.description_vi : report.description) || ""}`} onClose={onClose} />
      {busy ? <LinearProgress /> : null}
      <DialogContent sx={{ pt: "12px !important" }}>
        <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap", mb: 1.5 }}>
          <TextField select size="small" label={tx("Period")} value={range} onChange={(e) => setRange(e.target.value)} sx={{ width: 190 }}>
            {[...RANGES, "CUSTOM"].map((r) => <MenuItem key={r} value={r}>{label("range", r)}</MenuItem>)}</TextField>
          {range === "CUSTOM" ? (
            <>
              <TextField size="small" type="date" label={tx("From")} value={from} onChange={(e) => setFrom(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="date" label={tx("To")} value={to} onChange={(e) => setTo(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
              <Button startIcon={<PlayArrowOutlinedIcon />} onClick={run} disabled={!from || !to} sx={btn("primary")}>{tx("Run")}</Button>
            </>
          ) : null}
          {data ? <Typography variant="caption" color="text.secondary">{dateText(data.range.from)} – {dateText(data.range.to)} · {data.rows.length} {tx("rows")} · {tx("Generated in")} {data.duration_ms} ms</Typography> : null}
          <Box sx={{ flex: 1 }} />
          <Button startIcon={<TableViewOutlinedIcon />} onClick={() => exp("XLSX")} disabled={!data} sx={btn("edit")}>{tx("Excel")}</Button>
          <Button startIcon={<DownloadOutlinedIcon />} onClick={() => exp("CSV")} disabled={!data} sx={btn("cancel")}>{tx("CSV")}</Button>
          <Button startIcon={<PrintOutlinedIcon />} onClick={print} disabled={!data} sx={btn("primary")}>{tx("Print / PDF")}</Button>
        </Stack>
        {data ? (
          <>
            <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mb: 1.5 }}>
              {data.summary.map((s) => (
                <Box key={s.en} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, px: 1.25, py: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{isVi() ? s.vi : s.en}</Typography>
                  <Typography variant="subtitle2" fontWeight={800}>{fmtCell(s.value, s.type)}</Typography>
                </Box>
              ))}
            </Stack>
            {chart && chartRows.length ? (
              <Box sx={{ mb: 1 }}>
                <Chart type={chart.type === "line" ? "line" : "bar"} height={230} series={chart.series.map((k) => ({ name: isVi() ? colOf(k)?.vi : colOf(k)?.en, data: chartRows.map((r) => r[k] ?? 0) }))}
                  options={{ chart: { background: "transparent", toolbar: { show: false }, stacked: Boolean(chart.stacked) }, dataLabels: { enabled: false }, grid,
                    stroke: { width: chart.type === "line" ? 2.5 : 0 }, plotOptions: { bar: { columnWidth: "55%", borderRadius: 2 } },
                    colors: ["#1570EF", "#F04438", "#F79009", "#12B76A", "#7A5AF8"], legend: { position: "top", labels: { colors: axisColor } },
                    xaxis: { categories: chartRows.map((r) => fmtCell(r[chart.x], colOf(chart.x)?.type)), labels: { style: { colors: axisColor, fontSize: "10px" }, rotate: -30, hideOverlappingLabels: true } },
                    yaxis: { labels: { style: { colors: axisColor }, formatter: (v) => num(v, 1) } }, tooltip: { theme: dark ? "dark" : "light" } }} />
              </Box>
            ) : null}
            <Box sx={{ maxHeight: 420, overflow: "auto", border: 1, borderColor: "divider", borderRadius: 1.5 }}>
              <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.45, whiteSpace: "nowrap" }, "& th": { fontWeight: 800, bgcolor: "background.paper" } }}>
                <TableHead><TableRow><TableCell>#</TableCell>{data.columns.map((c) => <TableCell key={c.key} align={["int", "num", "money", "pct"].includes(c.type) ? "right" : "left"}>{isVi() ? c.vi : c.en}</TableCell>)}</TableRow></TableHead>
                <TableBody>{data.rows.map((r, i) => (
                  <TableRow key={i} hover><TableCell>{i + 1}</TableCell>
                    {data.columns.map((c) => <TableCell key={c.key} align={["int", "num", "money", "pct"].includes(c.type) ? "right" : "left"} sx={{ maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis" }}
                      title={r[c.key] != null ? String(r[c.key]) : ""}>{fmtCell(r[c.key], c.type)}</TableCell>)}</TableRow>
                ))}</TableBody>
              </Table>
              {!data.rows.length ? <Typography variant="caption" color="text.secondary" sx={{ p: 1.5, display: "block" }}>{tx("No data.")}</Typography> : null}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>{tx("PDF: use Print and choose \"Save as PDF\".")}</Typography>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

const emptySchedule = (code) => ({ name: "", report_code: code || "", frequency: "DAILY", run_time: "08:00", weekday: 0, month_day: 1, range_type: "YESTERDAY", output_format: "XLSX",
  language: isVi() ? "vi" : "en", recipients: "", status: "ACTIVE" });

export function SchedulesDialog({ items, catalog, preset, request, actor, notify, onClose, onChanged }) {
  const [form, setForm] = useState(preset ? { ...emptySchedule(preset.code), name: reportName(preset) } : null);
  const [busy, setBusy] = useState(false);
  const ch = (k) => (e) => setForm((o) => ({ ...o, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    try {
      const body = JSON.stringify({ ...form, weekday: form.frequency === "WEEKLY" ? Number(form.weekday) : null, month_day: form.frequency === "MONTHLY" ? Number(form.month_day) : null,
        recipients: form.recipients || null, actor });
      if (form.id) await request(`${REPORT_API}/schedules/${form.id}`, { method: "PUT", body }); else await request(`${REPORT_API}/schedules`, { method: "POST", body });
      notify("success", tx("Saved.")); setForm(null); onChanged();
    } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  const act = async (fn, msg) => { setBusy(true); try { await fn(); notify("success", msg); onChanged(); } catch (e) { notify("error", e.message); } finally { setBusy(false); } };
  const nameOf = (code) => { const r = catalog.find((x) => x.code === code); return r ? reportName(r) : code; };
  const toForm = (s) => ({ ...s, run_time: String(s.run_time).slice(0, 5).padStart(5, "0"), weekday: s.weekday ?? 0, month_day: s.month_day ?? 1, recipients: s.recipients || "" });
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<EventRepeatOutlinedIcon />} title={tx("Scheduled Reports")} subtitle={tx("E-mail delivery is not configured yet: scheduled files are stored and listed in the Report History.")} onClose={onClose} />
      {busy ? <LinearProgress /> : null}
      <DialogContent sx={{ pt: "12px !important" }}>
        {form ? (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5, mb: 1.5 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1.5}>
                <TextField size="small" fullWidth required label={tx("Name")} value={form.name} onChange={ch("name")} />
                <TextField select size="small" fullWidth required label={tx("Report")} value={form.report_code} onChange={ch("report_code")}>
                  {catalog.map((r) => <MenuItem key={r.code} value={r.code}>{reportName(r)}</MenuItem>)}</TextField>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <TextField select size="small" fullWidth label={tx("Frequency")} value={form.frequency} onChange={ch("frequency")}>
                  {["DAILY", "WEEKLY", "MONTHLY"].map((f) => <MenuItem key={f} value={f}>{label("frequency", f)}</MenuItem>)}</TextField>
                {form.frequency === "WEEKLY" ? <TextField select size="small" fullWidth label={tx("Weekday")} value={form.weekday} onChange={ch("weekday")}>
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => <MenuItem key={d} value={d}>{label("weekday", d)}</MenuItem>)}</TextField> : null}
                {form.frequency === "MONTHLY" ? <TextField select size="small" fullWidth label={tx("Day of month")} value={form.month_day} onChange={ch("month_day")}>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}</TextField> : null}
                <TextField size="small" type="time" fullWidth label={tx("Time")} value={form.run_time} onChange={ch("run_time")} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField select size="small" fullWidth label={tx("Data range")} value={form.range_type} onChange={ch("range_type")}>
                  {RANGES.map((r) => <MenuItem key={r} value={r}>{label("range", r)}</MenuItem>)}</TextField>
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <TextField select size="small" label={tx("Format")} value={form.output_format} onChange={ch("output_format")} sx={{ width: 140 }}>
                  <MenuItem value="XLSX">Excel (XLSX)</MenuItem><MenuItem value="CSV">CSV</MenuItem></TextField>
                <TextField select size="small" label={tx("Language")} value={form.language} onChange={ch("language")} sx={{ width: 140 }}>
                  <MenuItem value="vi">Tiếng Việt</MenuItem><MenuItem value="en">English</MenuItem></TextField>
                <TextField select size="small" label={tx("Status")} value={form.status} onChange={ch("status")} sx={{ width: 150 }}>
                  <MenuItem value="ACTIVE">{label("status", "ACTIVE")}</MenuItem><MenuItem value="PAUSED">{label("status", "PAUSED")}</MenuItem></TextField>
                <TextField size="small" fullWidth label={tx("Recipients (e-mail, comma separated)")} value={form.recipients} onChange={ch("recipients")} />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                <Button onClick={() => setForm(null)} sx={btn("cancel")}>{tx("Back")}</Button>
                <Button onClick={save} disabled={busy || !form.name.trim() || !form.report_code} sx={btn("primary")}>{tx("Save")}</Button>
              </Stack>
            </Stack>
          </Box>
        ) : <Button startIcon={<EventRepeatOutlinedIcon />} onClick={() => setForm(emptySchedule())} sx={{ ...btn("primary"), mb: 1.5 }}>{tx("New schedule")}</Button>}
        <Box sx={{ maxHeight: 420, overflow: "auto" }}>
          <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { fontWeight: 800, bgcolor: "background.paper" } }}>
            <TableHead><TableRow><TableCell>{tx("Name")}</TableCell><TableCell>{tx("Report")}</TableCell><TableCell>{tx("Frequency")}</TableCell><TableCell>{tx("Data range")}</TableCell>
              <TableCell>{tx("Format")}</TableCell><TableCell>{tx("Next run")}</TableCell><TableCell>{tx("Last run")}</TableCell><TableCell>{tx("Status")}</TableCell><TableCell align="right">{tx("Actions")}</TableCell></TableRow></TableHead>
            <TableBody>{items.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>{s.name}</TableCell><TableCell>{nameOf(s.report_code)}</TableCell>
                <TableCell>{label("frequency", s.frequency)}{s.frequency === "WEEKLY" ? ` · ${label("weekday", s.weekday)}` : s.frequency === "MONTHLY" ? ` · ${s.month_day}` : ""} · {String(s.run_time).slice(0, 5)}</TableCell>
                <TableCell>{label("range", s.range_type)}</TableCell><TableCell>{s.output_format}</TableCell><TableCell>{s.next_run_at ? ddmmhhmm(s.next_run_at) : EMPTY}</TableCell>
                <TableCell>{s.last_run_at ? `${ddmmhhmm(s.last_run_at)} · ${label("status", s.last_status)}` : EMPTY}</TableCell>
                <TableCell sx={{ color: s.status === "ACTIVE" ? "#12B76A" : "#98A2B3", fontWeight: 800 }}>{label("status", s.status)}</TableCell>
                <TableCell align="right">
                  <Tooltip title={tx("Run now")}><IconButton size="small" onClick={() => act(() => request(`${REPORT_API}/schedules/${s.id}/run`, { method: "POST", body: JSON.stringify({ actor }) }), tx("Schedule run finished"))}><PlayArrowOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title={tx("Edit")}><IconButton size="small" onClick={() => setForm(toForm(s))}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title={tx("Delete")}><IconButton size="small" color="error" onClick={() => act(() => request(`${REPORT_API}/schedules/${s.id}`, { method: "DELETE" }), tx("Deleted."))}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                </TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button></DialogActions>
    </Dialog>
  );
}

export function HistoryDialog({ request, notify, catalog, onClose, onOpen }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { request(`${REPORT_API}/history?limit=300`).then(setRows).catch((e) => notify("error", e.message)); }, [request, notify]);
  const nameOf = (r) => { const c = catalog.find((x) => x.code === r.report_code); return c ? reportName(c) : r.report_name || r.report_code; };
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<HistoryOutlinedIcon />} title={tx("Report History")} onClose={onClose} />
      <DialogContent sx={{ pt: "12px !important" }}>
        {!rows ? <LinearProgress /> : (
          <Box sx={{ maxHeight: 520, overflow: "auto" }}>
            <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.5, whiteSpace: "nowrap" }, "& th": { fontWeight: 800, bgcolor: "background.paper" } }}>
              <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Report")}</TableCell><TableCell>{tx("Action")}</TableCell><TableCell>{tx("Period")}</TableCell>
                <TableCell align="right">{tx("Rows")}</TableCell><TableCell align="right">{tx("Duration")}</TableCell><TableCell>{tx("User")}</TableCell><TableCell>{tx("Status")}</TableCell><TableCell>{tx("File")}</TableCell></TableRow></TableHead>
              <TableBody>{rows.map((r) => {
                const c = catalog.find((x) => x.code === r.report_code);
                return (
                  <TableRow key={r.id} hover>
                    <TableCell>{ddmmhhmm(r.created_at)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: c ? "#1570EF" : undefined, cursor: c ? "pointer" : "default" }} onClick={() => c && onOpen(c)}>{nameOf(r)}</TableCell>
                    <TableCell>{label("action", r.action)}{r.output_format ? ` · ${r.output_format}` : ""}</TableCell>
                    <TableCell>{r.date_from ? `${dateText(r.date_from)} – ${dateText(r.date_to)}` : EMPTY}</TableCell>
                    <TableCell align="right">{num(r.row_count)}</TableCell><TableCell align="right">{r.duration_ms} ms</TableCell><TableCell>{r.actor || EMPTY}</TableCell>
                    <TableCell sx={{ color: r.status === "SUCCESS" ? "#12B76A" : "#F04438", fontWeight: 700 }} title={r.message || ""}>{label("status", r.status)}</TableCell>
                    <TableCell>{r.file_url ? <Button size="small" startIcon={<DownloadOutlinedIcon />} onClick={() => window.open(resolveImageUrl(r.file_url), "_blank", "noopener")}>
                      {tx("Download")} ({num(r.file_size / 1024, 1)} KB)</Button> : EMPTY}</TableCell></TableRow>
                );
              })}</TableBody>
            </Table>
            {!rows.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : null}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CreateReportDialog({ catalog, request, actor, notify, onClose, onSaved }) {
  const standard = catalog.filter((r) => r.type === "STANDARD");
  const [f, setF] = useState({ base_code: standard[0]?.code || "", name: "", description: "", range_type: "LAST_7", is_shared: true });
  const [busy, setBusy] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const save = async () => {
    setBusy(true);
    try { const r = await request(`${REPORT_API}/saved`, { method: "POST", body: JSON.stringify({ ...f, description: f.description || null, actor }) }); notify("success", tx("Saved.")); onSaved(r.code); }
    catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<NoteAddOutlinedIcon />} title={tx("Create Report")} subtitle={tx("A custom report is a standard report saved with its own name and default period.")} onClose={onClose} disabled={busy} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <TextField select size="small" label={tx("Base report")} value={f.base_code} onChange={ch("base_code")}>
            {standard.map((r) => <MenuItem key={r.code} value={r.code}>{label("module", r.module)} · {reportName(r)}</MenuItem>)}</TextField>
          <TextField size="small" required label={tx("Name")} value={f.name} onChange={ch("name")} />
          <TextField size="small" multiline minRows={2} label={tx("Description")} value={f.description} onChange={ch("description")} />
          <TextField select size="small" label={tx("Default range")} value={f.range_type} onChange={ch("range_type")}>
            {RANGES.map((r) => <MenuItem key={r} value={r}>{label("range", r)}</MenuItem>)}</TextField>
          <FormControlLabel control={<Checkbox size="small" checked={f.is_shared} onChange={(e) => setF((o) => ({ ...o, is_shared: e.target.checked }))} />} label={<Typography variant="caption">{tx("Shared with everyone")}</Typography>} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={save} disabled={busy || !f.name.trim() || !f.base_code} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export { Alert };
