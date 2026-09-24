import { resolveImageUrl } from "../../../../components/common/ImageUploadField";
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, FormControl, FormControlLabel, InputLabel, LinearProgress, MenuItem, Select,
  Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircleIcon from "@mui/icons-material/Circle";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

import { DialogHeader, EMPTY, btn, ddmmhhmm, dialogPaperSx, num } from "../../ProductionPlanning/ui";
import { WO_STATUS_COLORS } from "../woStatus";
import { PriorityPill, WoStatusPill } from "../WorkOrderManagement/WoParts";
import { label, tx } from "./exLocales";

export const hms = (seconds) => {
  if (seconds == null) return EMPTY;
  const s = Math.max(Math.round(seconds), 0);
  return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
export const readinessText = (r) => { const [code, ref] = String(r).split(":"); return ref ? `${tx(code)} (${ref})` : tx(code); };
const MACHINE_COLORS = { RUNNING: "#12B76A", IDLE: "#F79009", MAINTENANCE: "#F04438", DOWN: "#F04438", OFFLINE: "#98A2B3" };
const MOLD_COLORS = { IN_PRODUCTION: "#12B76A", AVAILABLE: "#2E90FA", IN_MAINTENANCE: "#F79009", IN_REPAIR: "#F04438" };

function Gauge({ value, color, dark }) {
  return (
    <Box sx={{ width: 110, mx: "auto" }}>
      <Chart type="radialBar" height={130} series={[Math.min(Math.max(value || 0, 0), 100)]} options={{
        chart: { background: "transparent", sparkline: { enabled: true } }, colors: [color],
        plotOptions: { radialBar: { hollow: { size: "58%" }, track: { background: dark ? "#263244" : "#EAECF0" },
          dataLabels: { name: { show: false }, value: { offsetY: 6, fontSize: "18px", fontWeight: 800, color: dark ? "#F3F4F6" : "#172033", formatter: (v) => `${num(v, 0)}%` } } } },
      }} />
    </Box>
  );
}

function Thumb({ image, icon: Icon, color, onClick }) {
  return (
    <Box onClick={onClick} sx={{ height: 96, borderRadius: 2, display: "grid", placeItems: "center", border: 1, borderColor: "divider", cursor: onClick ? "pointer" : "default", overflow: "hidden",
      background: image ? "transparent" : `radial-gradient(circle at 30% 25%, ${color}33, ${color}0D 60%, transparent 75%)` }}>
      {image ? <Box component="img" src={resolveImageUrl(image)} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <Icon sx={{ fontSize: 56, color }} />}
    </Box>
  );
}

const Row = ({ k, v, color }) => [
  <Typography key={`${k}-k`} variant="caption" color="text.secondary" noWrap>{k}</Typography>,
  <Typography key={`${k}-v`} variant="caption" fontWeight={700} noWrap sx={{ color }} component="div">{v ?? EMPTY}</Typography>,
];

export function SelectedPanel({ wo, dark, onMachine, onMold, onOrder, onWorkOrder }) {
  const m = wo.metrics || {};
  const lifeLeft = wo.design_shot ? Math.max(Number(wo.design_shot) - Number(wo.current_shot || 0), 0) : null;
  const sec = (t) => <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary", lineHeight: 1.8, display: "block" }}>{t}</Typography>;
  return (
    <Stack spacing={1.25}>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
        {[[tx("Product"), wo.product_name, wo.product_image, ViewInArOutlinedIcon, "#1570EF", null],
          [tx("Machine"), `${wo.machine_code || EMPTY}${wo.machine_model ? ` · ${wo.machine_model}` : ""}`, wo.machine_image, PrecisionManufacturingOutlinedIcon, "#0BA5EC", wo.machine_id ? onMachine : null],
          [tx("Mold"), `${wo.mold_code || EMPTY} · ${wo.mold_cavity ?? wo.cavity} cav`, wo.mold_image, GridViewOutlinedIcon, "#7A5AF8", wo.mold_id ? onMold : null]].map(([title, sub, img, Icon, color, onClick]) => (
          <Box key={title} sx={{ minWidth: 0 }}>
            <Typography variant="overline" sx={{ fontWeight: 800, color: "text.secondary", lineHeight: 1.6 }}>{title}</Typography>
            <Typography variant="caption" fontWeight={700} noWrap sx={{ display: "block", mb: 0.5 }}>{sub}</Typography>
            <Thumb image={img} icon={Icon} color={color} onClick={onClick} />
          </Box>
        ))}
      </Box>
      <Box>
        <Stack direction="row" sx={{ justifyContent: "space-between" }}><Typography variant="caption" color="text.secondary">{tx("Progress")}</Typography>
          <Typography variant="caption" fontWeight={800}>{num(wo.good_qty)} / {num(wo.planned_qty)} · {num(wo.progress_pct, 1)}%</Typography></Stack>
        <LinearProgress variant="determinate" value={Math.min(wo.progress_pct || 0, 100)} sx={{ height: 7, borderRadius: 4, "& .MuiLinearProgress-bar": { bgcolor: WO_STATUS_COLORS[wo.status] } }} />
      </Box>
      {sec(tx("Production Information"))}
      <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr auto 1fr", columnGap: 1.5, rowGap: 0.4 }}>
        <Typography variant="caption" color="text.secondary">{tx("Production Order No.")}</Typography>
        <Typography variant="caption" fontWeight={700} noWrap sx={{ color: "#1570EF", cursor: wo.order_no ? "pointer" : "default" }} onClick={wo.order_no ? onOrder : undefined}>{wo.order_no || EMPTY}</Typography>
        {Row({ k: tx("Area"), v: wo.area_name })}
        {Row({ k: tx("Customer"), v: wo.customer_short_name || wo.customer_name })}
        {Row({ k: tx("Shift"), v: wo.shift_code })}
        {Row({ k: tx("Planned Qty"), v: `${num(wo.planned_qty)} pcs` })}
        {Row({ k: tx("Leader"), v: wo.leader_code })}
        {Row({ k: tx("Good (PCS)"), v: `${num(wo.good_qty)} pcs`, color: "#12B76A" })}
        {Row({ k: tx("Operator"), v: wo.operator_code })}
        {Row({ k: tx("Reject (PCS)"), v: `${num(wo.reject_qty)} pcs`, color: "#F04438" })}
        <Typography variant="caption" color="text.secondary">{tx("Priority")}</Typography><Box><PriorityPill value={wo.priority} /></Box>
        {Row({ k: tx("Remaining"), v: `${num(wo.remaining_qty)} pcs` })}
        {Row({ k: tx("Status since"), v: ddmmhhmm(wo.status === "ON_HOLD" ? wo.held_at : wo.started_at) })}
        {Row({ k: tx("Start Time"), v: ddmmhhmm(wo.started_at || wo.planned_start) })}
        {Row({ k: tx("Hold reason"), v: wo.status === "ON_HOLD" ? wo.hold_reason : null })}
        {Row({ k: tx("Due Time"), v: ddmmhhmm(wo.due_date) })}
        <Typography variant="caption" color="text.secondary">WO</Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color: "#1570EF", cursor: "pointer" }} onClick={onWorkOrder}>{wo.wo_no}</Typography>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" fontWeight={800}>{tx("Machine Status")}</Typography>
            <Box component="span" sx={{ fontSize: 11, fontWeight: 700, color: MACHINE_COLORS[wo.machine_status] || "#667085", display: "inline-flex", alignItems: "center", gap: 0.5 }}><CircleIcon sx={{ fontSize: 8 }} />{wo.machine_status || EMPTY}</Box>
          </Stack>
          <Gauge value={m.availability_pct} color="#12B76A" dark={dark} />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.3 }}>
            {Row({ k: tx("Run Time"), v: hms(m.run_seconds) })}{Row({ k: tx("Stop Time"), v: hms(m.stop_seconds) })}
            {Row({ k: tx("Cycle Time (Avg)"), v: m.avg_cycle_sec ? `${num(m.avg_cycle_sec, 1)} s / ${num(wo.cycle_time_sec, 1)} s` : null })}
            {Row({ k: "OEE", v: m.oee_pct != null ? `${num(m.oee_pct, 1)}%` : null })}
          </Box>
        </Box>
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" fontWeight={800}>{tx("Mold Status")}</Typography>
            <Box component="span" sx={{ fontSize: 11, fontWeight: 700, color: MOLD_COLORS[wo.mold_status] || "#667085", display: "inline-flex", alignItems: "center", gap: 0.5 }}><CircleIcon sx={{ fontSize: 8 }} />{wo.mold_status || EMPTY}</Box>
          </Stack>
          <Gauge value={wo.mold_usage_pct} color={wo.mold_usage_pct >= 90 ? "#F04438" : "#7A5AF8"} dark={dark} />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.3 }}>
            {Row({ k: tx("Shot Counter"), v: num(wo.current_shot) })}{Row({ k: tx("Life (Max)"), v: num(wo.design_shot) })}
            {Row({ k: tx("Life remaining"), v: lifeLeft != null ? num(lifeLeft) : null })}{Row({ k: tx("Shots"), v: num(m.shots) })}
          </Box>
        </Box>
      </Box>
    </Stack>
  );
}

// =========================================================
// ACTION DIALOG
// =========================================================

const TITLES = { start: "Start Production", output: "Report Output", reject: "Reject", adjust: "Qty Adjustment", hold: "Hold", end: "End Production" };

export function ExecDialog({ mode, wo, reasons, saving, actor, onClose, onSubmit }) {
  const [f, setF] = useState({ operator: wo.operator_code || actor || "", leader: wo.leader_code || "", good: "", reject: "", reason_code_id: "", reason: "",
    from_good: false, qty: "", good_total: wo.good_qty, reject_total: wo.reject_qty, remark: "" });
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const pickReason = (e) => {
    const r = reasons.find((x) => x.id === e.target.value);
    setF((o) => ({ ...o, reason_code_id: e.target.value, reason: o.reason || (r ? `${r.reason_code} ${r.reason_name}` : "") }));
  };
  const n = (v) => Number(v || 0);
  const valid = {
    start: f.operator.trim() && !(wo.readiness || []).length,
    output: n(f.good) + n(f.reject) > 0 && (!n(f.reject) || f.reason.trim()),
    reject: n(f.qty) > 0 && f.reason.trim() && (!f.from_good || n(f.qty) <= wo.good_qty),
    adjust: f.reason.trim() && f.good_total !== "" && f.reject_total !== "" && (n(f.good_total) !== wo.good_qty || n(f.reject_total) !== wo.reject_qty),
    hold: f.reason.trim(), end: true,
  }[mode];
  const danger = mode === "end" || mode === "hold";
  const reasonField = (lbl) => (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
      {reasons.length ? (
        <FormControl size="small" sx={{ minWidth: 200 }}><InputLabel>{tx("Reason code")}</InputLabel>
          <Select label={tx("Reason code")} value={f.reason_code_id} onChange={pickReason}>
            <MenuItem value="">{EMPTY}</MenuItem>{reasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.reason_code} — {r.reason_name}</MenuItem>)}
          </Select></FormControl>
      ) : null}
      <TextField size="small" required label={lbl} value={f.reason} onChange={ch("reason")} sx={{ flex: 1 }} />
    </Stack>
  );
  const submit = () => onSubmit({
    start: { operator: f.operator.trim(), leader: f.leader.trim() || null },
    output: { good: n(f.good), reject: n(f.reject), reason_code_id: f.reason_code_id || null, reason: f.reason.trim() || null },
    reject: { qty: n(f.qty), from_good: f.from_good, reason_code_id: f.reason_code_id || null, reason: f.reason.trim() },
    adjust: { good_total: n(f.good_total), reject_total: n(f.reject_total), reason: f.reason.trim() },
    hold: { reason_code_id: f.reason_code_id || null, reason: f.reason.trim() },
    end: { remark: f.remark.trim() || null },
  }[mode]);
  const m = wo.metrics || {};
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<FactCheckOutlinedIcon />} title={tx(TITLES[mode])} subtitle={`${wo.wo_no} · ${wo.product_name} · ${wo.machine_code || EMPTY}`} onClose={onClose} disabled={saving} tone={danger ? "danger" : "primary"} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
            <WoStatusPill value={wo.status} />
            <Typography variant="caption" color="text.secondary">{tx("Current")}: {tx("Good")} <b>{num(wo.good_qty)}</b> · {tx("Reject")} <b>{num(wo.reject_qty)}</b> · {tx("Planned")} <b>{num(wo.planned_qty)}</b></Typography>
          </Stack>
          {mode === "start" ? (
            <>
              <Typography variant="subtitle2" fontWeight={800}>{tx("Readiness check")}</Typography>
              {(wo.readiness || []).length ? wo.readiness.map((r) => <Stack key={r} direction="row" spacing={0.75} sx={{ alignItems: "center" }}><HighlightOffIcon sx={{ fontSize: 18, color: "#F04438" }} /><Typography variant="body2">{readinessText(r)}</Typography></Stack>)
                : <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}><CheckCircleIcon sx={{ fontSize: 18, color: "#12B76A" }} /><Typography variant="body2">{tx("Ready to start.")}</Typography></Stack>}
              <Typography variant="caption" color="text.secondary">{tx("First-off approval is checked when the Quality module is live.")}</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField size="small" required label={tx("Operator code")} value={f.operator} onChange={ch("operator")} sx={{ flex: 1 }} />
                <TextField size="small" label={tx("Leader code")} value={f.leader} onChange={ch("leader")} sx={{ flex: 1 }} />
              </Stack>
            </>
          ) : null}
          {mode === "output" ? (
            <>
              <Alert severity="info" sx={{ py: 0 }}>{tx("Output is entered manually until PLC / IoT is connected.")}</Alert>
              <Stack direction="row" spacing={1.5}>
                <TextField size="small" type="number" label={tx("Good qty")} value={f.good} onChange={ch("good")} inputProps={{ min: 0 }} sx={{ flex: 1 }} autoFocus />
                <TextField size="small" type="number" label={tx("Reject qty")} value={f.reject} onChange={ch("reject")} inputProps={{ min: 0 }} sx={{ flex: 1 }} />
              </Stack>
              {n(f.reject) > 0 ? reasonField(tx("Reject reason")) : null}
            </>
          ) : null}
          {mode === "reject" ? (
            <>
              <TextField size="small" type="number" label={tx("Reject qty")} value={f.qty} onChange={ch("qty")} inputProps={{ min: 1 }} autoFocus />
              <FormControlLabel control={<Checkbox size="small" checked={f.from_good} onChange={ch("from_good")} />} label={<Typography variant="body2">{tx("Move from good (found at inspection)")}</Typography>} />
              {reasonField(tx("Reject reason"))}
            </>
          ) : null}
          {mode === "adjust" ? (
            <>
              <Stack direction="row" spacing={1.5}>
                <TextField size="small" type="number" label={tx("New good total")} value={f.good_total} onChange={ch("good_total")} inputProps={{ min: 0 }} sx={{ flex: 1 }} />
                <TextField size="small" type="number" label={tx("New reject total")} value={f.reject_total} onChange={ch("reject_total")} inputProps={{ min: 0 }} sx={{ flex: 1 }} />
              </Stack>
              <TextField size="small" required label={tx("Adjustment reason")} value={f.reason} onChange={ch("reason")} />
            </>
          ) : null}
          {mode === "hold" ? reasonField(tx("Hold reason")) : null}
          {mode === "end" ? (
            <>
              <Alert severity="warning" sx={{ py: 0 }}>{tx("End production completes the work order, back-flushes material and releases left-over reservations.")}</Alert>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1 }}>
                {[["Yield", m.yield_pct], ["Availability", m.availability_pct], ["Performance", m.performance_pct], ["OEE", m.oee_pct]].map(([k, v]) => (
                  <Box key={k} sx={{ textAlign: "center", border: 1, borderColor: "divider", borderRadius: 2, p: 0.75 }}>
                    <Typography variant="caption" color="text.secondary">{tx(k)}</Typography><Typography variant="subtitle1" fontWeight={800}>{v != null ? `${num(v, 1)}%` : EMPTY}</Typography>
                  </Box>
                ))}
              </Box>
              <TextField size="small" label={tx("Remark")} value={f.remark} onChange={ch("remark")} />
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={submit} disabled={saving || !valid} sx={btn(danger ? "delete" : "primary")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// PRODUCTION LOG
// =========================================================

export function ProductionLogDialog({ api, request, woId, notify, onClose }) {
  const [wo, setWo] = useState(null);
  useEffect(() => { request(`${api}/${woId}`).then(setWo).catch((e) => notify("error", e.message)); }, [api, woId, request, notify]);
  const sx = { "& td, & th": { fontSize: 12, whiteSpace: "nowrap", px: 1 }, "& th": { color: "text.secondary", fontWeight: 800 } };
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<FactCheckOutlinedIcon />} title={`${tx("Production Log")}${wo ? ` · ${wo.wo_no}` : ""}`} subtitle={wo ? `${wo.product_name} · ${wo.machine_code || EMPTY}` : ""} onClose={onClose} />
      <DialogContent sx={{ pt: "12px !important" }}>
        {!wo ? <LinearProgress /> : (
          <Box sx={{ maxHeight: 480, overflow: "auto" }}>
            <Table size="small" stickyHeader sx={sx}>
              <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Event")}</TableCell><TableCell align="right">{tx("Good")}</TableCell>
                <TableCell align="right">{tx("Reject")}</TableCell><TableCell align="right">{tx("Cycle (s)")}</TableCell><TableCell>{tx("Reason")}</TableCell><TableCell>{tx("By")}</TableCell></TableRow></TableHead>
              <TableBody>
                {wo.logs.length === 0 ? <TableRow><TableCell colSpan={7}>{tx("No data.")}</TableCell></TableRow> : wo.logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{ddmmhhmm(l.event_at)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{label("event", l.event_type)}</TableCell>
                    <TableCell align="right" sx={{ color: l.good_qty < 0 ? "#F04438" : undefined }}>{l.good_qty ? num(l.good_qty) : EMPTY}</TableCell>
                    <TableCell align="right" sx={{ color: l.reject_qty ? "#F04438" : undefined }}>{l.reject_qty ? num(l.reject_qty) : EMPTY}</TableCell>
                    <TableCell align="right">{l.cycle_time_sec ? num(l.cycle_time_sec, 1) : EMPTY}</TableCell>
                    <TableCell sx={{ maxWidth: 280, whiteSpace: "normal" }}>{l.reason_name ? `${l.reason_code} ${l.reason_name}${l.reason_text ? ` · ${l.reason_text}` : ""}` : l.reason_text || EMPTY}</TableCell>
                    <TableCell>{l.actor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button></DialogActions>
    </Dialog>
  );
}

// =========================================================
// PRINT PRODUCTION REPORT
// =========================================================

const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function printProductionReport(wo) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const m = wo.metrics || {};
  const row = (k, v) => `<tr><th>${esc(k)}</th><td>${esc(v ?? "—")}</td></tr>`;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(wo.wo_no)}</title>
    <style>body{font-family:Arial,sans-serif;margin:24px;color:#101828}h1{font-size:20px;margin:0 0 4px}table{border-collapse:collapse;width:100%;margin-top:12px}
    th,td{border:1px solid #D0D5DD;padding:6px 8px;font-size:12px;text-align:left}th{background:#F2F4F7;width:32%}</style></head><body>
    <h1>${esc(tx("Print Production Report"))} · ${esc(wo.wo_no)}</h1><div>${esc(label("woStatus", wo.status))} · ${esc(new Date().toLocaleString())}</div><table>
    ${row(tx("Production Order No."), wo.order_no)}${row(tx("Product"), `${wo.product_code} — ${wo.product_name}`)}${row(tx("Machine"), wo.machine_code)}${row(tx("Mold"), wo.mold_code)}
    ${row(tx("Shift"), wo.shift_code)}${row(tx("Operator"), wo.operator_code)}${row(tx("Leader"), wo.leader_code)}
    ${row(tx("Planned Qty"), num(wo.planned_qty))}${row(tx("Good qty"), num(wo.good_qty))}${row(tx("Reject qty"), num(wo.reject_qty))}
    ${row(tx("Start Time"), ddmmhhmm(wo.started_at))}${row(tx("Run Time"), hms(m.run_seconds))}${row(tx("Stop Time"), hms(m.stop_seconds))}
    ${row("Yield", m.yield_pct != null ? `${m.yield_pct}%` : null)}${row("OEE", m.oee_pct != null ? `${m.oee_pct}%` : null)}
    ${row(tx("Cycle Time (Avg)"), m.avg_cycle_sec ? `${m.avg_cycle_sec} s` : null)}</table>
    <script>window.onload=()=>{window.print();}</script></body></html>`);
  w.document.close();
}

