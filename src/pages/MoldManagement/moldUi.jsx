import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, Divider, FormControl, IconButton, InputLabel, LinearProgress, ListItemIcon, Menu, MenuItem, Select,
  Stack, TextField, Typography,
} from "@mui/material";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ViewInArOutlinedIcon from "@mui/icons-material/ViewInArOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { resolveImageUrl } from "../../components/common/ImageUploadField";
import { API_CONFIG } from "../../config/config";
import { DialogHeader, EMPTY, btn, dialogPaperSx, num } from "../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "./moldLocales";

export const MOLD_API = `${API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "")}/api/mold-management`;
export const MOLD_STATUSES = ["IN_PRODUCTION", "AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR", "LOCKED", "RETIRED", "SCRAPPED"];
export const MOLD_STATUS_COLORS = { IN_PRODUCTION: "#12B76A", AVAILABLE: "#2E90FA", IN_MAINTENANCE: "#7A5AF8", IN_REPAIR: "#F04438", LOCKED: "#344054", RETIRED: "#98A2B3", SCRAPPED: "#667085", OUT_OF_SERVICE: "#98A2B3" };
export const LOCATION_TYPES = ["MACHINE", "STORAGE", "MAINTENANCE", "REPAIR", "SCRAP", "NOT_ASSIGNED"];
export const LOCATION_COLORS = { MACHINE: "#12B76A", STORAGE: "#2E90FA", MAINTENANCE: "#7A5AF8", REPAIR: "#F04438", SCRAP: "#667085", NOT_ASSIGNED: "#F79009" };
export const LIFE_BUCKET_COLORS = ["#12B76A", "#2E90FA", "#7A5AF8", "#F79009", "#F04438"];
export const ALERT_LEVEL_COLORS = { CRITICAL: "#F04438", WARNING: "#F79009" };
export const REASON_COLORS = ["#7A5AF8", "#2E90FA", "#12B76A", "#F79009", "#F04438", "#98A2B3"];
export const lifeColor = (v) => (v == null ? "#98A2B3" : v >= 90 ? "#F04438" : v >= 75 ? "#F79009" : "#12B76A");
export const healthColor = (v) => (v == null ? "#98A2B3" : v >= 80 ? "#12B76A" : v >= 60 ? "#F79009" : "#F04438");
// which status actions are offered for a status (mirrors the backend rules)
export const STATUS_ACTIONS = {
  SEND_MAINTENANCE: ["AVAILABLE", "LOCKED"], SEND_REPAIR: ["AVAILABLE", "IN_MAINTENANCE", "LOCKED"], COMPLETE: ["IN_MAINTENANCE", "IN_REPAIR"],
  LOCK: ["AVAILABLE", "IN_MAINTENANCE", "IN_REPAIR"], UNLOCK: ["LOCKED"], RETIRE: ["AVAILABLE", "LOCKED", "IN_REPAIR", "IN_MAINTENANCE"],
  SCRAP: ["AVAILABLE", "LOCKED", "IN_REPAIR", "RETIRED"], REACTIVATE: ["RETIRED"],
};
const REASON_REQUIRED = ["LOCK", "SEND_REPAIR", "RETIRE", "SCRAP"];

export const dateText = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : EMPTY);
export const hoursText = (h) => {
  if (h == null) return EMPTY;
  const m = Math.round(h * 60);
  const d = Math.floor(m / 1440);
  const hh = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  return d ? `${d}d ${hh}h ${String(mm).padStart(2, "0")}m` : hh ? `${hh}h ${String(mm).padStart(2, "0")}m` : `${mm}m`;
};
export const pmText = (m) => {
  if (m.pm_days_left == null) return EMPTY;
  if (m.pm_overdue || m.pm_days_left < 0) return tx("overdue");
  return m.pm_days_left === 0 ? tx("today") : tx("in {n} days", { n: m.pm_days_left });
};
export const locationText = (m) => (m.location_type === "MACHINE" ? m.machine_code : m.location_label || label("locationType", m.location_type));

const pillSx = (color, width) => ({
  display: "inline-block", width, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle",
  px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}55`,
});
export const MoldStatusPill = ({ value }) => (
  <Box component="span" title={label("moldStatus", value)} sx={{ ...pillSx(MOLD_STATUS_COLORS[value] || "#667085", 104), ...(value === "LOCKED" ? { color: "text.primary" } : {}) }}>{label("moldStatus", value)}</Box>
);
export const LocationPill = ({ value }) => <Box component="span" title={label("locationType", value)} sx={pillSx(LOCATION_COLORS[value] || "#667085", 104)}>{label("locationType", value)}</Box>;
export const HealthBadge = ({ value }) => (
  <Box component="span" sx={{ ...pillSx(healthColor(value), 40), fontSize: 12 }}>{value ?? EMPTY}</Box>
);
export function LifeBar({ value, width = 90 }) {
  if (value == null) return EMPTY;
  const color = lifeColor(value);
  return (
    <Box sx={{ width, display: "inline-block", verticalAlign: "middle" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, color, lineHeight: 1.2, textAlign: "center" }}>{num(value, 1)}%</Typography>
      <LinearProgress variant="determinate" value={Math.min(value, 100)} sx={{ height: 5, borderRadius: 3, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: color } }} />
    </Box>
  );
}
export function MoldImage({ src, height = 140, iconSize = 64 }) {
  return (
    <Box sx={{ height, borderRadius: 2, border: 1, borderColor: "divider", display: "grid", placeItems: "center", overflow: "hidden", bgcolor: "action.hover" }}>
      {src ? <Box component="img" src={resolveImageUrl(src)} alt="" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        : <ViewInArOutlinedIcon sx={{ fontSize: iconSize, color: "#1570EF", opacity: 0.8 }} />}
    </Box>
  );
}
export function LifeGauge({ value, dark, height = 190, labelText }) {
  const color = lifeColor(value);
  return (
    <Chart type="radialBar" height={height} series={[Math.min(value || 0, 100)]} options={{
      chart: { background: "transparent", sparkline: { enabled: true } }, colors: [color],
      plotOptions: { radialBar: { startAngle: -125, endAngle: 125, hollow: { size: "64%" }, track: { background: dark ? "#263244" : "#EEF2F6" },
        dataLabels: { name: { show: true, offsetY: 22, color: dark ? "#A7B0C0" : "#667085", fontSize: "12px" },
          value: { offsetY: -10, fontSize: "24px", fontWeight: 800, color: dark ? "#fff" : "#101828", formatter: () => (value != null ? `${num(value, 1)}%` : EMPTY) } } } },
      labels: [labelText || tx("Life Used")] }} />
  );
}
export function InfoGrid({ rows, cols = "auto 1fr", gap = 0.4 }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: cols, columnGap: 1.5, rowGap: gap, alignItems: "baseline", minWidth: 0 }}>
      {rows.filter(Boolean).map(([a, b, color]) => [
        <Typography key={`${a}k`} variant="caption" color="text.secondary" noWrap>{a}</Typography>,
        <Typography key={`${a}v`} variant="caption" fontWeight={700} sx={{ color, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{b ?? EMPTY}</Typography>])}
    </Box>
  );
}
export function QuickActionGrid({ actions, columns = "repeat(auto-fill, minmax(96px, 1fr))" }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: columns, gap: 0.75 }}>
      {actions.map(([text, Icon, color, onClick, disabled]) => (
        <Button key={text} disabled={disabled} onClick={onClick} sx={{ flexDirection: "column", gap: 0.4, py: 1, border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none",
          fontSize: 11, fontWeight: 700, color: "text.primary", lineHeight: 1.2, minWidth: 0 }}><Icon sx={{ color: disabled ? "action.disabled" : color }} />{text}</Button>
      ))}
    </Box>
  );
}

// =========================================================
// ROW MENU: navigate + operational actions
// =========================================================

export function MoldRowMenu({ mold, canEdit, navigate, onAction }) {
  const [anchor, setAnchor] = useState(null);
  const go = (path) => { setAnchor(null); navigate(path); };
  const act = (mode) => { setAnchor(null); onAction(mode, mold); };
  const mounted = Boolean(mold.current_machine_id);
  const out = mold.status === "RETIRED" || mold.status === "SCRAPPED";
  return (
    <>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}><MoreVertIcon fontSize="small" /></IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)} onClick={(e) => e.stopPropagation()}>
        <MenuItem onClick={() => go(`/mold-management/detail?mold=${mold.id}`)}><ListItemIcon><VisibilityOutlinedIcon fontSize="small" /></ListItemIcon>{tx("Mold Detail")}</MenuItem>
        <MenuItem onClick={() => go(`/mold-management/shot-counter?mold=${mold.id}`)}><ListItemIcon><SpeedOutlinedIcon fontSize="small" /></ListItemIcon>{tx("Shot Counter")}</MenuItem>
        <MenuItem onClick={() => go(`/mold-management/installation-history?mold=${mold.id}`)}><ListItemIcon><HistoryOutlinedIcon fontSize="small" /></ListItemIcon>{tx("Installation History")}</MenuItem>
        <MenuItem onClick={() => go(`/mold-management/location?mold=${mold.id}`)}><ListItemIcon><LocationOnOutlinedIcon fontSize="small" /></ListItemIcon>{tx("Mold Location")}</MenuItem>
        {canEdit ? <Divider /> : null}
        {canEdit ? <MenuItem disabled={mounted || mold.status !== "AVAILABLE"} onClick={() => act("install")}><ListItemIcon><LoginOutlinedIcon fontSize="small" /></ListItemIcon>{tx("Install Mold")}</MenuItem> : null}
        {canEdit ? <MenuItem disabled={!mounted} onClick={() => act("remove")}><ListItemIcon><LogoutOutlinedIcon fontSize="small" /></ListItemIcon>{tx("Remove Mold")}</MenuItem> : null}
        {canEdit ? <MenuItem disabled={mounted} onClick={() => act("move")}><ListItemIcon><SwapHorizOutlinedIcon fontSize="small" /></ListItemIcon>{tx("Move Location")}</MenuItem> : null}
        {canEdit ? <MenuItem disabled={mounted} onClick={() => act("status")}><ListItemIcon><FactCheckOutlinedIcon fontSize="small" /></ListItemIcon>{tx("Change Status")}</MenuItem> : null}
        {canEdit ? <MenuItem disabled={out} onClick={() => act("shots")}><ListItemIcon><TuneOutlinedIcon fontSize="small" /></ListItemIcon>{tx("Adjust Shot Counter")}</MenuItem> : null}
      </Menu>
    </>
  );
}

// =========================================================
// ACTION DIALOG: install / remove / move / status / shots
// =========================================================

export function MoldActionDialog({ mode, mold, lookups, request, actor, onClose, onDone, notify, presetAction }) {
  const actions = Object.keys(STATUS_ACTIONS).filter((a) => STATUS_ACTIONS[a].includes(mold.status));
  const [f, setF] = useState({ machine_id: "", work_order_id: "", minutes: "", remark: "", reason: mode === "remove" ? "END_OF_PLAN" : "", to_location_id: "", location_id: "",
    action: presetAction && actions.includes(presetAction) ? presetAction : actions[0] || "", maintenance_type: "", technician: "", downtime_hours: "", value: mold.current_shot ?? 0 });
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  useEffect(() => { if (mode === "status" && f.action === "SEND_MAINTENANCE" && !f.maintenance_type) setF((o) => ({ ...o, maintenance_type: "PM_SHOT" })); }, [mode, f.action, f.maintenance_type]);
  const locations = lookups?.locations || [];
  const locFor = (cat) => locations.filter((l) => !cat || l.location_category === cat);
  const suggested = { SEND_MAINTENANCE: "MAINTENANCE", SEND_REPAIR: "REPAIR", SCRAP: "SCRAP", COMPLETE: "STORAGE", RETIRE: null }[f.action];
  const wos = (lookups?.work_orders || []).filter((w) => w.mold_id === mold.id && (!f.machine_id || !w.machine_id || w.machine_id === Number(f.machine_id)));
  const valid = mode === "install" ? f.machine_id : mode === "remove" ? f.reason : mode === "move" ? f.location_id : mode === "shots" ? f.remark.trim() && f.value !== "" && Number(f.value) >= 0
    : f.action && (!REASON_REQUIRED.includes(f.action) || f.remark.trim());
  const nz = (v) => (v === "" || v == null ? null : Number(v));
  const submit = async () => {
    setSaving(true);
    try {
      const base = `${MOLD_API}/molds/${mold.id}`;
      if (mode === "install") await request(`${base}/install`, { method: "POST", body: JSON.stringify({ machine_id: Number(f.machine_id), work_order_id: nz(f.work_order_id), minutes: nz(f.minutes), remark: f.remark.trim() || null, actor }) });
      if (mode === "remove") await request(`${base}/remove`, { method: "POST", body: JSON.stringify({ reason: f.reason, minutes: nz(f.minutes), remark: f.remark.trim() || null, to_location_id: nz(f.to_location_id), actor }) });
      if (mode === "move") await request(`${base}/move`, { method: "POST", body: JSON.stringify({ location_id: Number(f.location_id), reason: f.remark.trim() || null, actor }) });
      if (mode === "status") await request(`${base}/status`, { method: "POST", body: JSON.stringify({ action: f.action, reason: f.remark.trim() || null, location_id: nz(f.location_id),
        maintenance_type: f.maintenance_type || null, technician: f.technician.trim() || null, downtime_hours: nz(f.downtime_hours), actor }) });
      if (mode === "shots") await request(`${base}/shots`, { method: "POST", body: JSON.stringify({ value: Number(f.value), reason: f.remark.trim(), actor }) });
      notify("success", tx("Saved."));
      onDone();
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const title = { install: "Install Mold", remove: "Remove Mold", move: "Move Location", status: "Change Status", shots: "Adjust Shot Counter" }[mode];
  const locSelect = (key, text, list, allowKeep) => (
    <FormControl size="small" fullWidth><InputLabel>{text}</InputLabel>
      <Select label={text} value={f[key]} onChange={ch(key)}>
        {allowKeep ? <MenuItem value=""><em>{tx("Keep current location")}</em></MenuItem> : null}
        {list.map((l) => <MenuItem key={l.id} value={l.id} disabled={Boolean(l.capacity && l.mold_count >= l.capacity && l.id !== mold.current_location_id)}>
          {l.node_code} — {l.node_name} · {label("locationType", l.location_category)}{l.capacity ? ` (${l.mold_count}/${l.capacity})` : ""}</MenuItem>)}
      </Select></FormControl>
  );
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<BuildOutlinedIcon />} title={tx(title)} subtitle={`${mold.mold_code} · ${mold.mold_name} · ${label("moldStatus", mold.status)}`} onClose={onClose} disabled={saving}
        tone={mode === "status" && ["SCRAP", "RETIRE", "LOCK"].includes(f.action) ? "danger" : "primary"} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          {mode === "install" ? (
            <>
              <FormControl size="small" required fullWidth><InputLabel>{tx("Machine")}</InputLabel>
                <Select label={tx("Machine")} value={f.machine_id} onChange={ch("machine_id")}>
                  {(lookups?.machines || []).map((m) => <MenuItem key={m.id} value={m.id} disabled={Boolean(m.mounted_mold)}>{m.equipment_code} — {m.equipment_name}{m.mounted_mold ? ` · ${m.mounted_mold}` : ""}</MenuItem>)}
                </Select></FormControl>
              <FormControl size="small" fullWidth><InputLabel>{tx("Work Order")}</InputLabel>
                <Select label={tx("Work Order")} value={f.work_order_id} onChange={ch("work_order_id")}>
                  <MenuItem value="">—</MenuItem>{wos.map((w) => <MenuItem key={w.id} value={w.id}>{w.wo_no} · {w.product_name} · {label("woStatus", w.status)}</MenuItem>)}
                </Select></FormControl>
              <TextField size="small" type="number" label={tx("Install time (min)")} value={f.minutes} onChange={ch("minutes")} slotProps={{ htmlInput: { min: 0 } }} />
            </>
          ) : null}
          {mode === "remove" ? (
            <>
              <FormControl size="small" required fullWidth><InputLabel>{tx("Removal reason")}</InputLabel>
                <Select label={tx("Removal reason")} value={f.reason} onChange={ch("reason")}>
                  {(lookups?.removal_reasons || []).map((r) => <MenuItem key={r} value={r}>{label("removalReason", r)} · {(lookups.planned_reasons || []).includes(r) ? tx("Planned") : tx("Unplanned")}</MenuItem>)}
                </Select></FormControl>
              <TextField size="small" type="number" label={tx("Remove time (min)")} value={f.minutes} onChange={ch("minutes")} slotProps={{ htmlInput: { min: 0 } }} />
              {locSelect("to_location_id", tx("Move to"), locFor(f.reason === "PM" ? "MAINTENANCE" : f.reason === "BREAKDOWN" ? "REPAIR" : null), true)}
            </>
          ) : null}
          {mode === "move" ? locSelect("location_id", tx("Move to"), locations.filter((l) => l.id !== mold.current_location_id), false) : null}
          {mode === "status" ? (
            <>
              {!actions.length ? <Alert severity="info">{tx("No data.")}</Alert> : (
                <FormControl size="small" required fullWidth><InputLabel>{tx("Action")}</InputLabel>
                  <Select label={tx("Action")} value={f.action} onChange={(e) => setF((o) => ({ ...o, action: e.target.value, location_id: "" }))}>
                    {actions.map((a) => <MenuItem key={a} value={a}>{label("statusAction", a)}</MenuItem>)}
                  </Select></FormControl>
              )}
              {["SEND_MAINTENANCE", "COMPLETE"].includes(f.action) ? (
                <FormControl size="small" fullWidth><InputLabel>{tx("Maintenance type")}</InputLabel>
                  <Select label={tx("Maintenance type")} value={f.maintenance_type} onChange={ch("maintenance_type")}>
                    <MenuItem value="">—</MenuItem>{(lookups?.maintenance_types || []).map((m) => <MenuItem key={m} value={m}>{label("maintenanceType", m)}</MenuItem>)}
                  </Select></FormControl>
              ) : null}
              {f.action === "COMPLETE" ? (
                <Stack direction="row" spacing={1.5}>
                  <TextField size="small" fullWidth label={tx("Technician")} value={f.technician} onChange={ch("technician")} />
                  <TextField size="small" fullWidth type="number" label={tx("Downtime (h)")} value={f.downtime_hours} onChange={ch("downtime_hours")} helperText={tx("Leave empty to calculate from the time in maintenance / repair.")} />
                </Stack>
              ) : null}
              {f.action ? locSelect("location_id", tx("Move to"), locFor(suggested), true) : null}
            </>
          ) : null}
          {mode === "shots" ? (
            <>
              <Alert severity="warning" sx={{ py: 0 }}>{tx("Adjusting the shot counter is logged. Use it only after a counter fault or verified count.")}</Alert>
              <TextField size="small" type="number" required label={tx("New shot count")} value={f.value} onChange={ch("value")} helperText={`${tx("Current Shot")}: ${num(mold.current_shot)}`} slotProps={{ htmlInput: { min: 0 } }} />
            </>
          ) : null}
          <TextField size="small" multiline minRows={2} required={mode === "shots" || (mode === "status" && REASON_REQUIRED.includes(f.action))}
            label={mode === "shots" || mode === "status" ? tx("Reason") : tx("Remark")} value={f.remark} onChange={ch("remark")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={submit} disabled={saving || !valid} sx={btn(mode === "status" && ["SCRAP", "RETIRE", "LOCK"].includes(f.action) ? "delete" : "primary")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}
