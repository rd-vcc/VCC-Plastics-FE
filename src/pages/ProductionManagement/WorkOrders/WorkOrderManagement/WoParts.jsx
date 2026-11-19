import { resolveImageUrl } from "../../../../components/common/ImageUploadField";
import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, FormControl, InputLabel, LinearProgress, MenuItem, Paper, Select, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CircleIcon from "@mui/icons-material/Circle";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";

import { DialogHeader, EMPTY, PRIORITY_COLORS, btn, cardSx, ddmmhhmm, dialogPaperSx, num, person } from "../../ProductionPlanning/ui";
import { WO_STATUS_COLORS } from "../woStatus";
import { label, localeTag, tx } from "./woLocales";


// =========================================================
// SYSTEM STATUS BAR (MES / PLC / Robot / AGV / IoT / DB / API)
// =========================================================

export function SystemStatusBar({ system: sys }) {
  const sysColor = { ONLINE: "#12B76A", OFFLINE: "#F04438", NOT_CONNECTED: "#98A2B3" };
  const sysText = { ONLINE: tx("Online"), OFFLINE: tx("Offline"), NOT_CONNECTED: tx("Not connected") };
  if (!sys) return null;
  return (
    <Paper elevation={0} sx={{ ...cardSx, px: 2, py: 1, display: "flex", flexWrap: "wrap", gap: 2.5, alignItems: "center", bgcolor: (theme) => (theme.palette.mode === "dark" ? "#0B1220" : "#101828"), color: "#fff" }}>
      <Typography variant="caption" fontWeight={800} sx={{ opacity: 0.8 }}>{tx("System Status")}</Typography>
      {[["MES", sys.MES], ["PLC", sys.PLC], ["Robot", sys.ROBOT], ["AGV", sys.AGV], ["IoT Gateway", sys.IOT_GATEWAY], ["Database", sys.DATABASE], ["API", sys.API]].map(([name, st]) => (
        <Stack key={name} direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          <Typography variant="caption" fontWeight={700}>{name}</Typography>
          <CircleIcon sx={{ fontSize: 10, color: sysColor[st] }} /><Typography variant="caption" sx={{ color: sysColor[st] }}>{sysText[st]}</Typography>
        </Stack>
      ))}
      <Box sx={{ flex: 1 }} />
      <Typography variant="caption">{tx("Last Sync")}: {new Date(sys.last_sync).toLocaleTimeString(localeTag())}</Typography>
      <Typography variant="caption">{tx("Server Time")}: {new Date(sys.server_time).toLocaleTimeString(localeTag())}</Typography>
      <Typography variant="caption">{tx("Version")}: v{sys.version}</Typography>
    </Paper>
  );
}

const pillSx = (color, width) => ({
  display: "inline-block", width, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle",
  px: 0.5, py: 0.2, borderRadius: 1, fontSize: 10, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40`,
});

export function WoStatusPill({ value }) {
  return <Box component="span" title={label("woStatus", value)} sx={pillSx(WO_STATUS_COLORS[value] || "#667085", 104)}>{label("woStatus", value)}</Box>;
}

export function PriorityPill({ value }) {
  return <Box component="span" sx={pillSx(PRIORITY_COLORS[value] || "#667085", 80)}>{label("priority", value)}</Box>;
}

export const EXCEPTION_COLORS = { DELAYED: "#F04438", WAITING_MATERIAL: "#F79009", WAITING_MOLD: "#7A5AF8", WAITING_MAINTENANCE: "#DC6803" };

export const delayText = (minutes) => {
  if (!minutes) return EMPTY;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m} ${tx("min")}`;
};

// =========================================================
// VISUAL OVERVIEW (product / machine / mold)
// =========================================================

function Visual({ image, icon: Icon, color, onClick }) {
  return (
    <Tooltip title={image ? "" : tx("Upload the image in master data")}>
      <Box onClick={onClick} sx={{ width: 100, height: 80, flexShrink: 0, borderRadius: 1.5, overflow: "hidden", cursor: onClick ? "pointer" : "default",
        display: "grid", placeItems: "center", border: 1, borderColor: "divider",
        background: image ? "transparent" : `radial-gradient(circle at 30% 25%, ${color}33, ${color}0D 60%, transparent 75%)` }}>
        {image ? <Box component="img" src={resolveImageUrl(image)} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <Icon sx={{ fontSize: 36, color, opacity: 0.85 }} />}
      </Box>
    </Tooltip>
  );
}

function InfoRows({ rows }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "84px minmax(0,1fr)", columnGap: 0.75, rowGap: 0.25, alignContent: "center", minWidth: 0, flex: 1 }}>
      {rows.map(([k, v]) => [
        <Typography key={`${k}-k`} variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11, lineHeight: 1.5 }}>{k}</Typography>,
        <Typography key={`${k}-v`} variant="caption" fontWeight={700} component="div" noWrap sx={{ minWidth: 0, fontSize: 11, fontWeight: 600, lineHeight: 1.5 }} title={typeof v === "string" ? v : undefined}>{v ?? EMPTY}</Typography>,
      ])}
    </Box>
  );
}

const MACHINE_COLORS = { RUNNING: "#12B76A", IDLE: "#F79009", MAINTENANCE: "#F04438", DOWN: "#F04438", OFFLINE: "#98A2B3" };
const MOLD_COLORS = { IN_PRODUCTION: "#12B76A", AVAILABLE: "#2E90FA", IN_MAINTENANCE: "#F79009", IN_REPAIR: "#F04438" };
const StateText = ({ value, colors }) => (value ? <Box component="span" sx={{ color: colors[value] || "inherit", display: "inline-flex", alignItems: "center", gap: 0.5 }}><CircleIcon sx={{ fontSize: 8 }} />{value}</Box> : EMPTY);
const joined = (...parts) => parts.filter((x) => x != null && x !== "").join(" · ") || null;

function ReadyItem({ ok, text, na }) {
  const Icon = na ? RemoveCircleOutlineIcon : ok ? CheckCircleIcon : HighlightOffIcon;
  const color = na ? "#98A2B3" : ok ? "#12B76A" : "#F04438";
  return <Stack direction="row" spacing={0.4} sx={{ alignItems: "center", minWidth: 0 }}><Icon sx={{ fontSize: 13, color }} /><Typography variant="caption" fontWeight={600} noWrap sx={{ fontSize: 11 }}>{text}</Typography></Stack>;
}

// Compact: sized so the whole panel fits beside the table on a 1080p screen without scrolling.
export function VisualOverview({ wo, onMachine, onMold }) {
  const section = (title, extra) => (
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", borderTop: 1, borderColor: "divider", pt: 0.4 }}>
      <Typography variant="overline" sx={{ fontWeight: 800, fontSize: 10.5, letterSpacing: ".06em", color: "text.primary", lineHeight: 1.6 }}>{title}</Typography>{extra}
    </Stack>
  );
  const bar = (value, color) => <LinearProgress variant="determinate" value={Math.min(value || 0, 100)} sx={{ height: 5, borderRadius: 3, "& .MuiLinearProgress-bar": { bgcolor: color } }} />;
  const ex = wo.exceptions || [];
  return (
    <Stack spacing={0.6}>
      {section(tx("Product"), <Typography variant="caption" fontWeight={800}>{tx("Progress")}: {num(wo.progress_pct, 1)}%</Typography>)}
      <Stack direction="row" spacing={1.25}>
        <Visual image={wo.product_image} icon={ViewInArOutlinedIcon} color="#1570EF" />
        <InfoRows rows={[[tx("Product"), joined(wo.product_code, wo.product_name)], [tx("Customer"), wo.customer_short_name || wo.customer_name],
          [tx("Part weight"), wo.part_weight_g ? `${num(wo.part_weight_g, 2)} g` : null],
          [tx("Plan / Good / NG"), `${num(wo.planned_qty)} / ${num(wo.good_qty)} / ${num(wo.reject_qty)}`], [tx("Remaining"), num(wo.remaining_qty)]]} />
      </Stack>
      {bar(wo.progress_pct, WO_STATUS_COLORS[wo.status])}
      {section(tx("Machine"))}
      <Stack direction="row" spacing={1.25}>
        <Visual image={wo.machine_image} icon={PrecisionManufacturingOutlinedIcon} color="#0BA5EC" onClick={wo.machine_id ? onMachine : undefined} />
        <InfoRows rows={[[tx("Machine"), joined(wo.machine_code, wo.machine_name)], [tx("Type / Model"), joined(wo.machine_type, [wo.machine_manufacturer, wo.machine_model].filter(Boolean).join(" "))],
          [tx("Status"), <StateText key="m" value={wo.machine_status} colors={MACHINE_COLORS} />], [tx("Area / Shift"), joined(wo.area_name, wo.shift_code)]]} />
      </Stack>
      {section(tx("Mold"))}
      <Stack direction="row" spacing={1.25}>
        <Visual image={wo.mold_image} icon={GridViewOutlinedIcon} color="#7A5AF8" onClick={wo.mold_id ? onMold : undefined} />
        <InfoRows rows={[[tx("Mold"), joined(wo.mold_code, wo.mold_name)], [tx("Cavity / Type"), joined(wo.mold_cavity ?? wo.cavity, wo.mold_type)],
          [tx("Mold Status"), <StateText key="s" value={wo.mold_status} colors={MOLD_COLORS} />],
          [tx("Shot Count"), wo.design_shot ? `${num(wo.current_shot)} / ${num(wo.design_shot)}` : null]]} />
      </Stack>
      {wo.mold_usage_pct != null ? bar(wo.mold_usage_pct, wo.mold_usage_pct >= 90 ? "#F04438" : "#12B76A") : null}
      {section(tx("Readiness"))}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 1.5, rowGap: 0.75, py: 0.25 }}>
        <ReadyItem ok={!ex.includes("WAITING_MAINTENANCE") && Boolean(wo.machine_id)} text={tx("Machine ready")} />
        <ReadyItem ok={!ex.includes("WAITING_MOLD")} text={tx("Mold ready")} />
        <ReadyItem ok={!ex.includes("WAITING_MATERIAL")} text={tx("Material ready")} />
        <Tooltip title={tx("Not required yet (Quality module)")}><Box><ReadyItem na text={tx("First-off")} /></Box></Tooltip>
      </Box>
    </Stack>
  );
}

// =========================================================
// ACTION DIALOG (release / hold / resume / cancel / priority / complete / close)
// =========================================================

const ACTION_TITLES = { release: "Release Work Order", hold: "Hold", resume: "Resume", cancel: "Cancel", priority: "Change Priority", complete: "Complete", close: "Close WO" };
const REASON_LABELS = { hold: "Hold reason", cancel: "Cancel reason", complete: "Complete short reason", priority: "Reason" };
const MISSING_TEXT = { machine: "Machine", mold: "Mold", product: "Product", planned_qty: "Planned Qty", planned_start: "Start Time", due_time: "Due Time" };

export function ActionDialog({ mode, wo, detail, saving, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState(wo.priority);
  const needsReason = Boolean(REASON_LABELS[mode]);
  const missing = detail?.release_missing || [];
  const valid = (!needsReason || reason.trim()) && (mode !== "priority" || priority !== wo.priority) && (mode !== "release" || (detail && missing.length === 0));
  const danger = mode === "cancel" || mode === "close";
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<AssignmentOutlinedIcon />} title={tx(ACTION_TITLES[mode])} subtitle={`${wo.wo_no} · ${wo.product_name}`} onClose={onClose} disabled={saving} tone={danger ? "danger" : "primary"} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><WoStatusPill value={wo.status} /><PriorityPill value={wo.priority} />
            <Typography variant="caption" color="text.secondary">{wo.machine_code || EMPTY} · {wo.mold_code || EMPTY} · {num(wo.good_qty)}/{num(wo.planned_qty)}</Typography></Stack>
          {mode === "release" ? (
            !detail ? <LinearProgress /> : (
              <>
                <Alert severity="info" sx={{ py: 0 }}>{tx("Before release define: machine, mold, product, planned quantity, start time and due time.")}</Alert>
                {missing.length ? <Alert severity="error" sx={{ py: 0 }}>{tx("Missing")}: {missing.map((m) => tx(MISSING_TEXT[m] || m)).join(", ")}</Alert>
                  : <Alert severity="success" sx={{ py: 0 }}>{tx("Ready to release.")}</Alert>}
                <Typography variant="caption" color="text.secondary">{tx("Release does not start production. Machine, mold, material and first-off are checked again when production starts.")}</Typography>
              </>
            )
          ) : null}
          {mode === "close" ? <Alert severity="warning" sx={{ py: 0 }}>{tx("Close locks the work order record. Return or close out material at the machine first.")}</Alert> : null}
          {mode === "resume" && wo.hold_reason ? <Alert severity="info" sx={{ py: 0 }}>{tx("Hold reason")}: {wo.hold_reason}</Alert> : null}
          {mode === "priority" ? (
            <FormControl size="small"><InputLabel>{tx("New priority")}</InputLabel>
              <Select label={tx("New priority")} value={priority} onChange={(e) => setPriority(e.target.value)}>
                {["URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => <MenuItem key={p} value={p}>{label("priority", p)}</MenuItem>)}
              </Select></FormControl>
          ) : null}
          {needsReason ? <TextField size="small" required multiline minRows={2} label={tx(REASON_LABELS[mode])} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus /> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25 }}>
        <Button onClick={() => onSubmit({ reason: reason.trim(), priority })} disabled={saving || !valid} sx={btn(danger ? "delete" : "primary")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// DETAIL (history + materials)
// =========================================================

// material requirement line status → [label key, colour]
const LINE_STATUS = { PLANNED: ["Not allocated", "#98A2B3"], ASSIGNED: ["Assigned", "#2E90FA"], SHORT: ["Short", "#F04438"],
  RESERVED: ["Reserved (line)", "#F79009"], READY: ["Issued to machine", "#12B76A"], CANCELLED: ["Cancelled", "#98A2B3"] };

export function WoDetailDialog({ api, request, woId, notify, onClose, onExecution, onOrder }) {
  const [wo, setWo] = useState(null);
  useEffect(() => { request(`${api}/${woId}`).then(setWo).catch((e) => notify("error", e.message)); }, [api, woId, request, notify]);
  const tableSx = { "& td, & th": { fontSize: 11, whiteSpace: "nowrap", px: 1 }, "& th": { color: "text.secondary", fontWeight: 800 } };
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<AssignmentOutlinedIcon />} title={`${tx("Work Order Detail")}${wo ? ` · ${wo.wo_no}` : ""}`} subtitle={wo ? `${wo.order_no || EMPTY} · ${wo.product_name}` : ""} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        {!wo ? <LinearProgress /> : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "360px 1fr" }, gap: 3 }}>
            <VisualOverview wo={wo} />
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                <WoStatusPill value={wo.status} /><PriorityPill value={wo.priority} />
                {wo.exceptions.map((e) => <Box key={e} component="span" sx={pillSx(EXCEPTION_COLORS[e] || "#667085", 130)}>{label("exception", e)}</Box>)}
                <Box sx={{ flex: 1 }} />
                <Button size="small" onClick={() => onOrder(wo)} disabled={!wo.order_no}>{tx("Open Production Order")}</Button>
                <Button size="small" onClick={() => onExecution(wo)}>{tx("Open Production Execution")}</Button>
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1.5 }}>
                {[[tx("Start Time"), ddmmhhmm(wo.planned_start)], [tx("Due Time"), ddmmhhmm(wo.due_date)], [tx("Plan"), wo.plan_code || EMPTY],
                  [tx("Delay"), wo.delayed ? delayText(wo.delay_minutes) : EMPTY]].map(([k, v]) => (
                  <Box key={k}><Typography variant="caption" color="text.secondary">{k}</Typography><Typography variant="subtitle2" fontWeight={800}>{v}</Typography></Box>
                ))}
              </Box>
              {wo.hold_reason && wo.status === "ON_HOLD" ? <Alert severity="warning" sx={{ py: 0 }}>{tx("Hold reason")}: {wo.hold_reason}</Alert> : null}
              {wo.cancel_reason && wo.status === "CANCELLED" ? <Alert severity="error" sx={{ py: 0 }}>{tx("Cancel reason")}: {wo.cancel_reason}</Alert> : null}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{tx("Materials")}</Typography>
                <Table size="small" sx={tableSx}>
                  <TableHead><TableRow><TableCell>{tx("Material")}</TableCell><TableCell align="right">{tx("Required")}</TableCell><TableCell align="right">{tx("Allocated")}</TableCell><TableCell>{tx("Status")}</TableCell></TableRow></TableHead>
                  <TableBody>
                    {wo.materials.length === 0 ? <TableRow><TableCell colSpan={4}>{tx("No data.")}</TableCell></TableRow> : wo.materials.map((m) => (
                      <TableRow key={m.id}><TableCell sx={{ fontWeight: 700 }}>{m.material_code}</TableCell><TableCell align="right">{num(m.required_qty, 3)} {m.unit}</TableCell>
                        <TableCell align="right">{num(m.allocated_qty, 3)} {m.unit}</TableCell><TableCell sx={{ fontWeight: 700, color: LINE_STATUS[m.status]?.[1] || "text.secondary" }}>{LINE_STATUS[m.status] ? tx(LINE_STATUS[m.status][0]) : m.status}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{tx("History")}</Typography>
                <Box sx={{ maxHeight: 260, overflow: "auto" }}>
                  <Table size="small" stickyHeader sx={tableSx}>
                    <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Action")}</TableCell><TableCell>{tx("Status")}</TableCell><TableCell>{tx("Actor")}</TableCell><TableCell>{tx("Reason")}</TableCell></TableRow></TableHead>
                    <TableBody>
                      {wo.history.map((h, i) => (
                        <TableRow key={i}><TableCell>{ddmmhhmm(h.acted_at)}</TableCell><TableCell sx={{ fontWeight: 700 }}>{label("action", h.action)}</TableCell>
                          <TableCell>{h.from_status && h.from_status !== h.to_status ? `${label("woStatus", h.from_status)} → ` : ""}{label("woStatus", h.to_status)}</TableCell>
                          <TableCell>{person(h.actor_name, h.actor)}</TableCell><TableCell sx={{ maxWidth: 320, whiteSpace: "normal" }}>{h.remark || EMPTY}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// =========================================================
// PRINT
// =========================================================

const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function printWorkOrder(wo) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const row = (k, v) => `<tr><th>${esc(k)}</th><td>${esc(v ?? "—")}</td></tr>`;
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(wo.wo_no)}</title>
    <style>body{font-family:Arial,sans-serif;margin:24px;color:#101828}h1{font-size:20px;margin:0 0 4px}table{border-collapse:collapse;width:100%;margin-top:12px}
    th,td{border:1px solid #D0D5DD;padding:6px 8px;font-size:12px;text-align:left}th{background:#F2F4F7;width:30%}</style></head><body>
    <h1>${esc(tx("Work Order"))} ${esc(wo.wo_no)}</h1><div>${esc(label("woStatus", wo.status))} · ${esc(label("priority", wo.priority))}</div><table>
    ${row(tx("Production Order No."), wo.order_no)}${row(tx("Product"), `${wo.product_code} — ${wo.product_name}`)}${row(tx("Customer"), wo.customer_name)}
    ${row(tx("Machine"), wo.machine_code)}${row(tx("Mold"), wo.mold_code)}${row(tx("Area / Shift"), [wo.area_name, wo.shift_code].filter(Boolean).join(" · "))}
    ${row(tx("Planned Qty"), num(wo.planned_qty))}${row(tx("Good (PCS)"), num(wo.good_qty))}${row(tx("Reject"), num(wo.reject_qty))}
    ${row(tx("Start Time"), ddmmhhmm(wo.planned_start))}${row(tx("Due Time"), ddmmhhmm(wo.due_date))}</table>
    <script>window.onload=()=>{window.print();}</script></body></html>`);
  w.document.close();
}
