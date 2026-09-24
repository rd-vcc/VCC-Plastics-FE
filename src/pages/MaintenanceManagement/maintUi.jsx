import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, FormControl, IconButton, InputLabel, LinearProgress, MenuItem, Select, Stack, Tab,
  Table, TableBody, TableCell, TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentIndOutlinedIcon from "@mui/icons-material/AssignmentIndOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import { resolveImageUrl } from "../../components/common/ImageUploadField";
import { API_CONFIG } from "../../config/config";
import { DialogHeader, EMPTY, btn, ddmmhhmm, dialogPaperSx, num, toInputDateTime } from "../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "./maintLocales";

const BASE = API_CONFIG.VCC_PLASTICS_API.replace(/\/$/, "");
export const MAINT_API = `${BASE}/api/maintenance`;
export const REQ_STATUS_COLORS = { NEW: "#2E90FA", IN_REVIEW: "#F79009", APPROVED: "#12B76A", REJECTED: "#F04438", COMPLETED: "#0E9384", CANCELLED: "#98A2B3" };
export const WO_STATUS_COLORS = { RELEASED: "#667085", ASSIGNED: "#F79009", IN_PROGRESS: "#2E90FA", PAUSED: "#EAAA08", VERIFICATION: "#7A5AF8", COMPLETED: "#12B76A", CLOSED: "#475467", CANCELLED: "#98A2B3", OVERDUE: "#F04438" };
export const PLAN_STATUS_COLORS = { PLANNED: "#667085", UPCOMING: "#2E90FA", OVERDUE: "#F04438", SCHEDULED: "#7A5AF8", IN_PROGRESS: "#F79009", INACTIVE: "#98A2B3" };
export const PRIORITY_COLORS = { HIGH: "#F04438", MEDIUM: "#F79009", LOW: "#12B76A" };
export const TYPE_COLORS = { PM: "#2E90FA", CORRECTIVE: "#F79009", BREAKDOWN: "#F04438", INSPECTION: "#7A5AF8", CALIBRATION: "#0E9384", PREVENTIVE: "#2E90FA", OTHER: "#98A2B3" };
export const ASSET_COLORS = { MACHINE: "#2E90FA", EQUIPMENT: "#0E9384", MOLD: "#7A5AF8", TOOL: "#F79009" };
export const CONDITION_COLORS = { NOT_CHECKED: "#98A2B3", GOOD: "#12B76A", MONITOR: "#EAAA08", ATTENTION: "#F79009", CRITICAL: "#F04438" };
export const CHART_COLORS = ["#2E90FA", "#12B76A", "#F79009", "#7A5AF8", "#F04438", "#0E9384", "#98A2B3"];
export const COST_COLORS = { PARTS: "#1570EF", LABOR: "#F04438", OUTSOURCING: "#F79009", TOOLS: "#7A5AF8", OTHERS: "#98A2B3" };

const pillSx = (color, width) => ({
  display: "inline-block", width, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", verticalAlign: "middle",
  px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}55`,
});
export const Pill = ({ group, value, colors, width = 104 }) => <Box component="span" title={label(group, value)} sx={pillSx(colors[value] || "#667085", width)}>{label(group, value)}</Box>;
export const WoStatusPill = ({ value }) => <Pill group="woStatus" value={value} colors={WO_STATUS_COLORS} />;
export const ReqStatusPill = ({ value }) => <Pill group="requestStatus" value={value} colors={REQ_STATUS_COLORS} />;
export const PlanStatusPill = ({ value }) => <Pill group="planStatus" value={value} colors={PLAN_STATUS_COLORS} />;
export const PriorityPill = ({ value }) => <Pill group="priority" value={value} colors={PRIORITY_COLORS} width={80} />;
export const TypePill = ({ value, group = "woType" }) => <Pill group={group} value={value} colors={TYPE_COLORS} width={88} />;

/** slotProps for filter selects whose "All" value is empty: keep the label shrunk. */
export const SEL = { inputLabel: { shrink: true }, select: { displayEmpty: true } };

export const money = (v, digits = 0) => (v == null ? EMPTY : `${num(v, digits)} ₫`);
export const moneyShort = (v) => (v == null ? EMPTY : v >= 1e9 ? `${num(v / 1e9, 2)} B` : v >= 1e6 ? `${num(v / 1e6, 2)} M` : num(v, 0));
export const hhmmFromMinutes = (m) => (m == null ? EMPTY : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.round(m % 60)).padStart(2, "0")}`);
export const dateText = (v) => (v ? String(v).slice(0, 10).split("-").reverse().join("/") : EMPTY);
export const assetPath = (type, id) => (type === "MACHINE" || type === "EQUIPMENT" ? `/machine-equipment/machine-detail?machine=${id}` : type === "MOLD" ? `/mold-management/detail?mold=${id}` : null);
export const scopeOf = (type) => (type === "MOLD" ? "mold" : type === "TOOL" ? "production-tool" : "machine-equipment");
export const woPath = (w) => `/maintenance-management/${scopeOf(w.asset_type)}-maintenance?wo=${w.wo_id || w.id}`;
export const dueText = (days) => (days == null ? EMPTY : days < 0 ? tx("{n} days overdue", { n: -days }) : days === 0 ? tx("today") : tx("in {n} days", { n: days }));

export function AssetCell({ code, name, type, onClick }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" fontWeight={800} sx={{ display: "block", color: onClick ? "#1570EF" : undefined, cursor: onClick ? "pointer" : "default" }} noWrap
        onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}>{code || EMPTY}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5 }} noWrap>{name}{type ? ` · ${label("assetType", type)}` : ""}</Typography>
    </Box>
  );
}

export function InfoRows({ rows, cols = "auto 1fr" }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: cols, columnGap: 1.5, rowGap: 0.45, alignItems: "baseline", minWidth: 0 }}>
      {rows.filter(Boolean).map(([a, b, color]) => [
        <Typography key={`${a}k`} variant="caption" color="text.secondary" noWrap>{a}</Typography>,
        <Typography key={`${a}v`} variant="caption" fontWeight={700} sx={{ color, minWidth: 0, overflowWrap: "anywhere" }}>{b ?? EMPTY}</Typography>])}
    </Box>
  );
}

export function QuickActionGrid({ actions, columns = "repeat(auto-fill, minmax(110px, 1fr))" }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: columns, gap: 0.75 }}>
      {actions.map(([text, Icon, color, onClick, disabled]) => (
        <Button key={text} disabled={disabled} onClick={onClick} sx={{ flexDirection: "column", gap: 0.4, py: 1, border: 1, borderColor: "divider", borderRadius: 1.5, textTransform: "none",
          fontSize: 11, fontWeight: 700, color: "text.primary", lineHeight: 1.2, minWidth: 0 }}><Icon sx={{ color: disabled ? "action.disabled" : color }} />{text}</Button>
      ))}
    </Box>
  );
}

export function Timeline({ events }) {
  if (!events?.length) return <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography>;
  return (
    <Box>
      {events.map((e, i) => (
        <Box key={e.id} sx={{ display: "grid", gridTemplateColumns: "92px 14px 1fr", gap: 0.75 }}>
          <Typography variant="caption" color="text.secondary" sx={{ pt: 0.2 }}>{ddmmhhmm(e.event_at)}</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", mt: 0.5, bgcolor: WO_STATUS_COLORS[e.to_status] || REQ_STATUS_COLORS[e.to_status] || "#98A2B3" }} />
            {i < events.length - 1 ? <Box sx={{ flex: 1, width: 2, bgcolor: "divider", my: 0.25 }} /> : null}
          </Box>
          <Box sx={{ pb: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={700} sx={{ display: "block" }}>{label("action", e.action)}{e.action === "STAGE" && e.note ? ` · ${label("stage", e.note)}` : ""}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10.5 }}>{e.actor}{e.note && e.action !== "STAGE" ? ` · ${e.note}` : ""}</Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

/** Horizontal steps Released -> Closed with the time of each step (history detail). */
export function WoSteps({ events }) {
  const steps = [["CREATE", "RELEASED"], ["ASSIGN", "ASSIGNED"], ["START", "IN_PROGRESS"], ["SUBMIT", "VERIFICATION"], ["VERIFY", "COMPLETED"], ["CLOSE", "CLOSED"]];
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", mt: 1 }}>
      {steps.map(([a, st], i) => {
        const ev = [...(events || [])].reverse().find((e) => e.action === a);
        const color = ev ? "#12B76A" : "#D0D5DD";
        return (
          <Box key={a} sx={{ textAlign: "center", position: "relative" }}>
            {i > 0 ? <Box sx={{ position: "absolute", top: 8, left: 0, right: "50%", height: 2, bgcolor: color }} /> : null}
            {i < 5 ? <Box sx={{ position: "absolute", top: 8, left: "50%", right: 0, height: 2, bgcolor: [...(events || [])].some((e) => e.action === steps[i + 1][0]) ? "#12B76A" : "#D0D5DD" }} /> : null}
            <CheckCircleOutlineIcon sx={{ position: "relative", fontSize: 18, color, bgcolor: "background.paper", borderRadius: "50%" }} />
            <Typography variant="caption" sx={{ display: "block", fontSize: 10.5, fontWeight: 700 }}>{label("woStatus", st)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{ev ? ddmmhhmm(ev.event_at) : EMPTY}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// =========================================================
// DIALOGS
// =========================================================

const iso = (v) => (v ? (v.length === 16 ? `${v}:00` : v) : null);
const nowLocal = () => toInputDateTime(new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString());

function AssetPicker({ lookups, value, onChange, disabled, types }) {
  const assets = (lookups?.assets || []).filter((a) => !types || types.includes(a.asset_type));
  const kinds = [...new Set(assets.map((a) => a.asset_type))];
  const [kind, setKind] = useState(value.asset_type || kinds[0] || "MACHINE");
  useEffect(() => { if (value.asset_type) setKind(value.asset_type === "EQUIPMENT" ? "MACHINE" : value.asset_type); }, [value.asset_type]);
  const list = assets.filter((a) => (kind === "MACHINE" ? ["MACHINE", "EQUIPMENT"].includes(a.asset_type) : a.asset_type === kind));
  return (
    <Stack direction="row" spacing={1.5}>
      <FormControl size="small" sx={{ minWidth: 150 }} disabled={disabled}><InputLabel>{tx("Asset type")}</InputLabel>
        <Select label={tx("Asset type")} value={kind} onChange={(e) => { setKind(e.target.value); onChange({ asset_type: "", asset_id: "" }); }}>
          {[...new Set(kinds.map((k) => (k === "EQUIPMENT" ? "MACHINE" : k)))].map((k) => <MenuItem key={k} value={k}>{k === "MACHINE" ? tx("Machines & equipment") : label("assetType", k)}</MenuItem>)}
        </Select></FormControl>
      <FormControl size="small" fullWidth required disabled={disabled}><InputLabel>{tx("Asset")}</InputLabel>
        <Select label={tx("Asset")} value={value.asset_id ? `${value.asset_type}:${value.asset_id}` : ""} onChange={(e) => { const [t, i] = e.target.value.split(":"); onChange({ asset_type: t, asset_id: Number(i) }); }}>
          {list.map((a) => <MenuItem key={`${a.asset_type}:${a.id}`} value={`${a.asset_type}:${a.id}`}>{a.code} — {a.name}</MenuItem>)}
        </Select></FormControl>
    </Stack>
  );
}

function TechSelect({ lookups, value, onChange, labelText, required }) {
  const list = lookups?.technicians || [];
  return (
    <TextField select size="small" fullWidth required={required} label={labelText || tx("Technician")} value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <MenuItem value="">—</MenuItem>
      {(value && !list.includes(value) ? [value, ...list] : list).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
    </TextField>
  );
}

export function RequestDialog({ lookups, item, preset, request, actor, onClose, onSaved, notify }) {
  const [f, setF] = useState(() => ({ asset_type: item?.asset_type || preset?.asset_type || "", asset_id: item?.asset_id || preset?.asset_id || "", request_type: item?.request_type || "CORRECTIVE",
    priority: item?.priority || "MEDIUM", short_description: item?.short_description || "", description: item?.description || "", department: item?.department || "Production",
    required_date: toInputDateTime(item?.required_date) || "" }));
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const save = async () => {
    setSaving(true);
    try {
      const body = JSON.stringify({ ...f, asset_id: Number(f.asset_id), required_date: iso(f.required_date), actor, version: item?.version });
      if (item) await request(`${MAINT_API}/requests/${item.id}`, { method: "PUT", body }); else await request(`${MAINT_API}/requests`, { method: "POST", body });
      notify("success", tx("Saved.")); onSaved();
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<BuildOutlinedIcon />} title={item ? `${tx("Edit")} · ${item.request_no}` : tx("Create Maintenance Request")} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <AssetPicker lookups={lookups} value={f} onChange={(v) => setF((o) => ({ ...o, ...v }))} />
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("Request Type")} value={f.request_type} onChange={ch("request_type")}>
              {(lookups?.request_types || []).map((t) => <MenuItem key={t} value={t}>{label("requestType", t)}</MenuItem>)}</TextField>
            <TextField select size="small" fullWidth label={tx("Priority")} value={f.priority} onChange={ch("priority")}>
              {(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
          </Stack>
          <TextField size="small" required label={tx("Short Description")} value={f.short_description} onChange={ch("short_description")} />
          <TextField size="small" multiline minRows={3} label={tx("Detail Description")} value={f.description} onChange={ch("description")} />
          <Stack direction="row" spacing={1.5}>
            <TextField size="small" fullWidth label={tx("Department")} value={f.department} onChange={ch("department")} />
            <TextField size="small" fullWidth type="datetime-local" label={tx("Required Date")} value={f.required_date} onChange={ch("required_date")} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={save} disabled={saving || !f.asset_id || !f.short_description.trim()} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function NoteDialog({ title, noteLabel, required = true, danger, technicianMode, lookups, initialTech, onSubmit, onClose }) {
  const [note, setNote] = useState("");
  const [tech, setTech] = useState(initialTech || "");
  const [saving, setSaving] = useState(false);
  const submit = async () => { setSaving(true); try { await onSubmit({ note: note.trim(), technician: tech }); } finally { setSaving(false); } };
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={technicianMode ? <AssignmentIndOutlinedIcon /> : <FactCheckOutlinedIcon />} title={title} onClose={onClose} disabled={saving} tone={danger ? "danger" : "primary"} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          {technicianMode ? <TechSelect lookups={lookups} value={tech} onChange={setTech} required /> : null}
          {!technicianMode || noteLabel ? <TextField size="small" multiline minRows={2} required={required} label={noteLabel || tx("Reason")} value={note} onChange={(e) => setNote(e.target.value)} autoFocus={!technicianMode} /> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={submit} disabled={saving || (technicianMode ? !tech : required && !note.trim())} sx={btn(danger ? "delete" : "primary")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

/** Create a WO (manual / from a request / from a plan) or edit one. */
export function WoDialog({ mode = "create", lookups, item, preset, scopeTypes, request, actor, onClose, onSaved, notify }) {
  const wo = mode === "edit" ? item : null;
  const [f, setF] = useState(() => ({
    asset_type: wo?.asset_type || item?.asset_type || preset?.asset_type || "", asset_id: wo?.asset_id || item?.asset_id || preset?.asset_id || "",
    wo_type: wo?.wo_type || (mode === "from-plan" ? item?.wo_type : mode === "from-request" ? { CORRECTIVE: "CORRECTIVE", PREVENTIVE: "PM", INSPECTION: "INSPECTION", CALIBRATION: "CALIBRATION", OTHER: "CORRECTIVE" }[item?.request_type] : preset?.wo_type) || "CORRECTIVE",
    priority: wo?.priority || item?.priority || "MEDIUM", task_name: wo?.task_name || item?.task_name || item?.short_description || "", description: wo?.description || item?.description || "",
    technician: wo?.technician || item?.technician || "", assistant: wo?.assistant || "", planned_start: toInputDateTime(wo?.planned_start) || nowLocal(),
    planned_finish: toInputDateTime(wo?.planned_finish) || "", est_minutes: wo?.est_minutes ?? item?.est_minutes ?? "", est_downtime_minutes: wo?.est_downtime_minutes ?? "",
    outsourcing_cost: wo?.outsourcing_cost ?? 0, tool_cost: wo?.tool_cost ?? 0, other_cost: wo?.other_cost ?? 0, result: wo?.result || "", root_cause: wo?.root_cause || "",
    calibration_result: wo?.calibration_result || "", calibration_value: wo?.calibration_value || "" }));
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const nz = (v) => (v === "" || v == null ? null : Number(v));
  const save = async () => {
    setSaving(true);
    try {
      const body = JSON.stringify({ ...f, asset_id: nz(f.asset_id), planned_start: iso(f.planned_start), planned_finish: iso(f.planned_finish), est_minutes: nz(f.est_minutes),
        est_downtime_minutes: nz(f.est_downtime_minutes), outsourcing_cost: Number(f.outsourcing_cost || 0), tool_cost: Number(f.tool_cost || 0), other_cost: Number(f.other_cost || 0),
        calibration_result: f.calibration_result || null, actor, version: wo?.version });
      const url = mode === "edit" ? `${MAINT_API}/work-orders/${wo.id}` : mode === "from-request" ? `${MAINT_API}/requests/${item.id}/work-order`
        : mode === "from-plan" ? `${MAINT_API}/plans/${item.id}/work-order` : `${MAINT_API}/work-orders`;
      const res = await request(url, { method: mode === "edit" ? "PUT" : "POST", body });
      notify("success", tx("Saved.")); onSaved(res?.id);
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const title = mode === "edit" ? `${tx("Edit")} · ${wo.wo_no}` : mode === "from-request" ? tx("Create work order from this request") : mode === "from-plan" ? tx("Create work order from this plan") : tx("Create Work Order");
  const isTool = f.asset_type === "TOOL";
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<BuildOutlinedIcon />} title={title} subtitle={item?.request_no || item?.plan_no || ""} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <AssetPicker lookups={lookups} value={f} types={scopeTypes} onChange={(v) => setF((o) => ({ ...o, ...v }))} disabled={mode !== "create"} />
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("Type")} value={f.wo_type} onChange={ch("wo_type")} disabled={mode === "edit" || mode === "from-plan"}>
              {(lookups?.wo_types || []).filter((t) => t !== "CALIBRATION" || isTool).map((t) => <MenuItem key={t} value={t}>{label("woType", t)}</MenuItem>)}</TextField>
            <TextField select size="small" fullWidth label={tx("Priority")} value={f.priority} onChange={ch("priority")}>
              {(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
          </Stack>
          <TextField size="small" required label={tx("Task Name")} value={f.task_name} onChange={ch("task_name")} />
          <TextField size="small" multiline minRows={2} label={tx("Description")} value={f.description} onChange={ch("description")} />
          <Stack direction="row" spacing={1.5}>
            <TechSelect lookups={lookups} value={f.technician} onChange={(v) => setF((o) => ({ ...o, technician: v }))} />
            <TechSelect lookups={lookups} value={f.assistant} onChange={(v) => setF((o) => ({ ...o, assistant: v }))} labelText={tx("Assistant")} />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField size="small" fullWidth type="datetime-local" label={tx("Planned Start")} value={f.planned_start} onChange={ch("planned_start")} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField size="small" fullWidth type="datetime-local" label={tx("Planned Finish")} value={f.planned_finish} onChange={ch("planned_finish")} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField size="small" fullWidth type="number" label={tx("Est. minutes")} value={f.est_minutes} onChange={ch("est_minutes")} />
            <TextField size="small" fullWidth type="number" label={tx("Est. downtime (min)")} value={f.est_downtime_minutes} onChange={ch("est_downtime_minutes")} />
          </Stack>
          {mode === "edit" ? (
            <>
              <Stack direction="row" spacing={1.5}>
                <TextField size="small" fullWidth type="number" label={tx("Outsourcing cost")} value={f.outsourcing_cost} onChange={ch("outsourcing_cost")} />
                <TextField size="small" fullWidth type="number" label={tx("Tool cost")} value={f.tool_cost} onChange={ch("tool_cost")} />
                <TextField size="small" fullWidth type="number" label={tx("Other cost")} value={f.other_cost} onChange={ch("other_cost")} />
              </Stack>
              <TextField size="small" multiline minRows={2} label={tx("Result")} value={f.result} onChange={ch("result")} />
              <TextField size="small" label={tx("Root cause")} value={f.root_cause} onChange={ch("root_cause")} />
              {wo?.wo_type === "CALIBRATION" ? (
                <Stack direction="row" spacing={1.5}>
                  <TextField select size="small" fullWidth label={tx("Calibration result")} value={f.calibration_result} onChange={ch("calibration_result")}>
                    <MenuItem value="">—</MenuItem><MenuItem value="PASS">{tx("Pass")}</MenuItem><MenuItem value="FAIL">{tx("Fail")}</MenuItem></TextField>
                  <TextField size="small" fullWidth label={tx("Measured value")} value={f.calibration_value} onChange={ch("calibration_value")} />
                </Stack>
              ) : null}
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={save} disabled={saving || !f.asset_id || !f.task_name.trim()} sx={btn("primary")}>{mode === "edit" ? tx("Save") : tx("Create")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function PlanDialog({ lookups, item, preset, request, actor, onClose, onSaved, notify }) {
  const [f, setF] = useState(() => ({
    asset_type: item?.asset_type || preset?.asset_type || "", asset_id: item?.asset_id || preset?.asset_id || "", task_name: item?.task_name || "", wo_type: item?.wo_type || "PM",
    frequency_unit: item?.frequency_unit || "DAY", interval_value: item?.interval_value || 30, plan_type: item?.plan_type || "", next_due_date: item?.next_due_date || new Date().toISOString().slice(0, 10),
    next_due_shot: item?.next_due_shot ?? "", priority: item?.priority || "MEDIUM", technician: item?.technician || "", est_minutes: item?.est_minutes ?? 60, description: item?.description || "",
    checklist: (item?.checklist || []).join("\n"), parts: (item?.spare_parts || []).map((p) => ({ ...p })) }));
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const setPart = (i, k, v) => setF((o) => ({ ...o, parts: o.parts.map((p, j) => (j === i ? { ...p, [k]: v } : p)) }));
  const save = async () => {
    setSaving(true);
    try {
      const body = JSON.stringify({ asset_type: f.asset_type, asset_id: Number(f.asset_id), task_name: f.task_name, wo_type: f.wo_type, frequency_unit: f.frequency_unit,
        interval_value: Number(f.interval_value), plan_type: f.plan_type || null, next_due_date: f.frequency_unit === "DAY" ? f.next_due_date || null : null,
        next_due_shot: f.frequency_unit === "SHOT" && f.next_due_shot !== "" ? Number(f.next_due_shot) : null, priority: f.priority, technician: f.technician || null,
        est_minutes: f.est_minutes === "" ? null : Number(f.est_minutes), description: f.description || null, checklist: f.checklist.split("\n").map((s) => s.trim()).filter(Boolean),
        spare_parts: f.parts.filter((p) => (p.part_name || "").trim()).map((p) => ({ part_code: p.part_code || null, part_name: p.part_name.trim(), qty: Number(p.qty || 1), unit: p.unit || null, unit_cost: Number(p.unit_cost || 0) })),
        actor, version: item?.version });
      if (item) await request(`${MAINT_API}/plans/${item.id}`, { method: "PUT", body }); else await request(`${MAINT_API}/plans`, { method: "POST", body });
      notify("success", tx("Saved.")); onSaved();
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<BuildOutlinedIcon />} title={item ? `${tx("Edit Plan")} · ${item.plan_no}` : tx("Create Maintenance Plan")} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <AssetPicker lookups={lookups} value={f} onChange={(v) => setF((o) => ({ ...o, ...v, frequency_unit: v.asset_type === "MOLD" ? o.frequency_unit : "DAY" }))} />
          <Stack direction="row" spacing={1.5}>
            <TextField size="small" fullWidth required label={tx("Task Name")} value={f.task_name} onChange={ch("task_name")} />
            <TextField select size="small" sx={{ minWidth: 160 }} label={tx("Type")} value={f.wo_type} onChange={ch("wo_type")}>
              {["PM", "INSPECTION", ...(f.asset_type === "TOOL" ? ["CALIBRATION"] : [])].map((t) => <MenuItem key={t} value={t}>{label("woType", t)}</MenuItem>)}</TextField>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("Unit")} value={f.frequency_unit} onChange={ch("frequency_unit")} disabled={f.asset_type !== "MOLD"}>
              <MenuItem value="DAY">{tx("Days")}</MenuItem><MenuItem value="SHOT">{tx("Shots")}</MenuItem></TextField>
            <TextField size="small" fullWidth type="number" required label={tx("Interval")} value={f.interval_value} onChange={ch("interval_value")} />
            {f.frequency_unit === "DAY" ? <TextField size="small" fullWidth type="date" label={tx("Next due")} value={f.next_due_date || ""} onChange={ch("next_due_date")} slotProps={{ inputLabel: { shrink: true } }} />
              : <TextField size="small" fullWidth type="number" label={tx("Next due shot")} value={f.next_due_shot} onChange={ch("next_due_shot")} />}
            <TextField select size="small" fullWidth label={tx("Plan Type")} value={f.plan_type} onChange={ch("plan_type")}>
              <MenuItem value="">{tx("Auto")}</MenuItem>{(lookups?.plan_types || []).filter((t) => t !== "SHOT").map((t) => <MenuItem key={t} value={t}>{label("planType", t)}</MenuItem>)}</TextField>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("Priority")} value={f.priority} onChange={ch("priority")}>
              {(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
            <TechSelect lookups={lookups} value={f.technician} onChange={(v) => setF((o) => ({ ...o, technician: v }))} />
            <TextField size="small" fullWidth type="number" label={tx("Est. minutes")} value={f.est_minutes} onChange={ch("est_minutes")} />
          </Stack>
          <TextField size="small" multiline minRows={2} label={tx("Description")} value={f.description} onChange={ch("description")} />
          <TextField size="small" multiline minRows={3} label={`${tx("Checklist")} (${tx("one item per line")})`} value={f.checklist} onChange={ch("checklist")} />
          <Box>
            <Stack direction="row" sx={{ alignItems: "center", mb: 0.5 }}><Typography variant="caption" fontWeight={800} sx={{ flex: 1 }}>{tx("Spare Parts")}</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setF((o) => ({ ...o, parts: [...o.parts, { part_code: "", part_name: "", qty: 1, unit: "pcs", unit_cost: 0 }] }))}>{tx("Add")}</Button></Stack>
            {f.parts.map((p, i) => (
              <Stack key={i} direction="row" spacing={1} sx={{ mb: 0.75 }}>
                <TextField size="small" label={tx("Part code")} value={p.part_code || ""} onChange={(e) => setPart(i, "part_code", e.target.value)} sx={{ width: 130 }} />
                <TextField size="small" label={tx("Part name")} value={p.part_name || ""} onChange={(e) => setPart(i, "part_name", e.target.value)} sx={{ flex: 1 }} />
                <TextField size="small" type="number" label={tx("Qty")} value={p.qty} onChange={(e) => setPart(i, "qty", e.target.value)} sx={{ width: 80 }} />
                <TextField size="small" label={tx("Unit")} value={p.unit || ""} onChange={(e) => setPart(i, "unit", e.target.value)} sx={{ width: 80 }} />
                <TextField size="small" type="number" label={tx("Unit cost")} value={p.unit_cost} onChange={(e) => setPart(i, "unit_cost", e.target.value)} sx={{ width: 130 }} />
                <IconButton size="small" onClick={() => setF((o) => ({ ...o, parts: o.parts.filter((_, j) => j !== i) }))}><DeleteOutlineIcon fontSize="small" /></IconButton>
              </Stack>
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={save} disabled={saving || !f.asset_id || !f.task_name.trim() || !Number(f.interval_value)} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// ATTACHMENTS
// =========================================================

const toBase64 = (file) => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });

export function Attachments({ owner, ownerId, items, request, actor, canEdit, onChanged, notify }) {
  const input = useRef(null);
  const [kind, setKind] = useState("BEFORE");
  const [busy, setBusy] = useState(false);
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const image = /^image\//.test(file.type);
      const up = await request(`${BASE}/api/files/${image ? "images" : "documents"}`, { method: "POST", body: JSON.stringify({ category: "maintenance", filename: file.name, data: await toBase64(file) }) });
      await request(`${MAINT_API}/${owner}/${ownerId}/attachments`, { method: "POST", body: JSON.stringify({ kind: image ? kind : "FILE", file_url: up.url, file_name: file.name, file_size: up.size, actor }) });
      onChanged();
    } catch (e) { notify("error", e.message); } finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  const remove = async (a) => {
    try { await request(`${MAINT_API}/${owner}/${ownerId}/attachments/${a.id}`, { method: "DELETE" }); onChanged(); } catch (e) { notify("error", e.message); }
  };
  const photos = items.filter((a) => a.kind !== "FILE");
  const files = items.filter((a) => a.kind === "FILE");
  return (
    <Box>
      {canEdit ? (
        <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}>
          <ToggleButtonGroup size="small" exclusive value={kind} onChange={(_, v) => v && setKind(v)}>
            <ToggleButton value="BEFORE" sx={{ textTransform: "none", py: 0.25 }}>{tx("Before")}</ToggleButton><ToggleButton value="AFTER" sx={{ textTransform: "none", py: 0.25 }}>{tx("After")}</ToggleButton>
          </ToggleButtonGroup>
          <input ref={input} type="file" hidden accept="image/*,.pdf,.docx,.xlsx,.pptx" onChange={(e) => upload(e.target.files?.[0])} />
          <Button size="small" variant="outlined" startIcon={<UploadFileOutlinedIcon />} disabled={busy} onClick={() => input.current?.click()} sx={{ textTransform: "none" }}>{tx("Upload photo / file")}</Button>
          {busy ? <CircularProgress size={16} /> : null}
        </Stack>
      ) : null}
      {!items.length ? <Typography variant="caption" color="text.secondary">{tx("No data.")}</Typography> : null}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))", gap: 0.75, mb: files.length ? 1 : 0 }}>
        {photos.map((a) => (
          <Box key={a.id} sx={{ position: "relative", border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden", height: 80, cursor: "pointer" }} onClick={() => window.open(resolveImageUrl(a.file_url), "_blank", "noopener")}>
            <Box component="img" src={resolveImageUrl(a.file_url)} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <Chip size="small" label={tx(a.kind === "AFTER" ? "After" : "Before")} sx={{ position: "absolute", left: 4, top: 4, height: 18, fontSize: 10, bgcolor: a.kind === "AFTER" ? "#12B76A" : "#F79009", color: "#fff" }} />
            {canEdit ? <IconButton size="small" onClick={(e) => { e.stopPropagation(); remove(a); }} sx={{ position: "absolute", right: 0, top: 0, bgcolor: "rgba(255,255,255,.8)" }}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton> : null}
          </Box>
        ))}
      </Box>
      {files.map((a) => (
        <Stack key={a.id} direction="row" spacing={1} sx={{ alignItems: "center", py: 0.5, borderBottom: 1, borderColor: "divider" }}>
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: "#1570EF" }} />
          <Typography variant="caption" fontWeight={700} sx={{ flex: 1, color: "#1570EF", cursor: "pointer" }} noWrap onClick={() => window.open(resolveImageUrl(a.file_url), "_blank", "noopener")}>{a.file_name}</Typography>
          {canEdit ? <IconButton size="small" onClick={() => remove(a)}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton> : null}
        </Stack>
      ))}
    </Box>
  );
}

// =========================================================
// WORK ORDER PANEL
// =========================================================

export function WorkOrderPanel({ woId, lookups, request, actor, canEdit: canEditPage, notify, onChanged, navigate, readOnly, extraTabs }) {
  const [d, setD] = useState(null);
  const [tab, setTab] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [newItem, setNewItem] = useState("");
  const [part, setPart] = useState({ part_code: "", part_name: "", qty: 1, unit: "pcs", unit_cost: 0 });
  const [labor, setLabor] = useState({ technician: "", labor_type: "REPAIR", hours: 1 });
  const load = useCallback(() => { if (woId) request(`${MAINT_API}/work-orders/${woId}`).then(setD).catch((e) => notify("error", e.message)); }, [woId, request, notify]);
  useEffect(() => { setD(null); setTab(0); load(); }, [load]);
  if (!woId) return <Typography variant="caption" color="text.secondary">{tx("Select a row in the list.")}</Typography>;
  if (!d) return <Box sx={{ height: 200, display: "grid", placeItems: "center" }}><CircularProgress size={28} /></Box>;
  const w = d.wo;
  const a = d.asset || {};
  const open = ["RELEASED", "ASSIGNED", "IN_PROGRESS", "PAUSED", "VERIFICATION"].includes(w.status);
  const canEdit = canEditPage && !readOnly && open;
  const refresh = () => { load(); onChanged?.(); };
  const act = async (action, body = {}) => {
    try { await request(`${MAINT_API}/work-orders/${w.id}/${action}`, { method: "POST", body: JSON.stringify({ ...body, actor, version: w.version }) }); notify("success", tx("Saved.")); setDialog(null); refresh(); }
    catch (e) { notify("error", e.message); }
  };
  const call = async (url, method, body) => { try { await request(url, { method, body: body ? JSON.stringify({ ...body, actor }) : undefined }); refresh(); } catch (e) { notify("error", e.message); } };
  const tableSx = { "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.4 }, "& th": { color: "text.secondary", fontWeight: 800 } };
  const isMold = w.asset_type === "MOLD";
  const tabs = [["info", tx("Information")], ["check", `${tx("Checklist")} (${d.checklist.length})`], ...(isMold ? [["comp", `${tx("Components")} (${d.components.length})`]] : []),
    ["parts", `${tx("Spare Parts")} (${d.parts.length})`], ["labor", `${tx("Labor")} (${d.labor.length})`], ["att", `${tx("Attachments")} (${d.attachments.length})`], ["hist", tx("History")], ...(extraTabs || [])];
  const key = tabs[tab]?.[0];
  const path = assetPath(w.asset_type, w.asset_id);
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5, flexWrap: "wrap" }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ color: "#1570EF" }}>{w.wo_no}</Typography><WoStatusPill value={w.overdue ? "OVERDUE" : w.status} />
        {w.overdue ? <WoStatusPill value={w.status} /> : null}
        {!open ? <Chip size="small" icon={<LockOutlinedIcon sx={{ fontSize: 14 }} />} label={tx("The work order is read-only.")} sx={{ height: 20, fontSize: 10.5 }} /> : null}
      </Stack>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 32, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": { minHeight: 32, py: 0, textTransform: "none", fontSize: 12, fontWeight: 700, px: 1 } }}>
        {tabs.map(([k, t]) => <Tab key={k} label={t} />)}
      </Tabs>
      <Box sx={{ pt: 1.25, minHeight: 250, maxHeight: 360, overflow: "auto" }}>
        {key === "info" ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "120px minmax(0,1fr) minmax(0,1fr)" }, gap: 1.5 }}>
            <Box sx={{ height: 100, borderRadius: 1.5, border: 1, borderColor: "divider", display: "grid", placeItems: "center", overflow: "hidden", bgcolor: "action.hover" }}>
              {a.image_url ? <Box component="img" src={resolveImageUrl(a.image_url)} alt="" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : <PrecisionManufacturingOutlinedIcon sx={{ fontSize: 48, color: "#1570EF" }} />}
            </Box>
            <InfoRows rows={[[tx("Type"), label("woType", w.wo_type)], [label("assetType", w.asset_type), <Box key="a" component="span" sx={{ color: path ? "#1570EF" : undefined, cursor: path ? "pointer" : "default" }} onClick={() => path && navigate(path)}>{a.code} · {a.name}</Box>],
              w.asset_type === "TOOL" ? [tx("Tool Category"), a.tool_category] : [tx("Machine Model"), [a.manufacturer, a.model].filter(Boolean).join(" ") || a.sub],
              [tx("Serial No."), a.serial_number], [tx("Location"), a.location || a.location_label], [tx("Priority"), <PriorityPill key="p" value={w.priority} />],
              [tx("Requested by"), w.requested_by], [tx("Plan / Request"), [w.plan_no, w.request_no].filter(Boolean).join(" · ") || null], [tx("Task Name"), w.task_name],
              [tx("Description"), w.description], w.stage ? [tx("Stage"), label("stage", w.stage)] : null, w.result ? [tx("Result"), w.result] : null, w.root_cause ? [tx("Root cause"), w.root_cause] : null,
              w.wo_type === "CALIBRATION" ? [tx("Calibration result"), w.calibration_result ? `${w.calibration_result === "PASS" ? tx("Pass") : tx("Fail")}${w.calibration_value ? ` · ${w.calibration_value}` : ""}` : null, w.calibration_result === "FAIL" ? "#F04438" : "#12B76A"] : null]} />
            <InfoRows rows={[[tx("Planned Start"), ddmmhhmm(w.planned_start)], [tx("Planned Finish"), ddmmhhmm(w.planned_finish)], [tx("Actual Start"), ddmmhhmm(w.actual_start)],
              [tx("Actual Finish"), ddmmhhmm(w.actual_finish)], [tx("Elapsed Time"), w.actual_start ? hhmmFromMinutes(w.work_minutes) : null], [tx("Estimated Duration"), hhmmFromMinutes(w.est_minutes)],
              [tx("Remaining Time"), w.remaining_minutes != null ? hhmmFromMinutes(w.remaining_minutes) : null], [tx("Technician"), w.technician], [tx("Assistant"), w.assistant],
              [tx("Downtime (Est.)"), w.est_downtime_minutes != null ? hhmmFromMinutes(w.est_downtime_minutes) : null], [tx("Downtime (Actual)"), w.downtime_actual_minutes != null ? hhmmFromMinutes(w.downtime_actual_minutes) : null],
              w.downtime_no ? [tx("Linked downtime"), w.downtime_no] : null, [tx("Total cost"), money(w.total_cost)]]} />
          </Box>
        ) : null}
        {key === "check" ? (
          <Box>
            {d.checklist.map((c) => (
              <Stack key={c.id} direction="row" spacing={1} sx={{ alignItems: "center", py: 0.5, borderBottom: 1, borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary" sx={{ width: 18 }}>{c.seq}</Typography>
                <Typography variant="caption" sx={{ flex: 1, fontWeight: 600 }}>{c.item}</Typography>
                <ToggleButtonGroup size="small" exclusive value={c.result || null} disabled={!canEdit || !["IN_PROGRESS", "PAUSED"].includes(w.status)}
                  onChange={(_, v) => call(`${MAINT_API}/work-orders/${w.id}/checklist/${c.id}`, "PUT", { result: v, note: c.note })}>
                  {[["OK", "#12B76A"], ["NG", "#F04438"], ["NA", "#98A2B3"]].map(([v, color]) => (
                    <ToggleButton key={v} value={v} sx={{ py: 0, px: 1, fontSize: 11, fontWeight: 800, "&.Mui-selected": { color: "#fff", bgcolor: color, "&:hover": { bgcolor: color } } }}>{v === "NA" ? "N/A" : v}</ToggleButton>))}
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary" sx={{ width: 90 }} noWrap>{c.done_by || ""}</Typography>
              </Stack>
            ))}
            {canEdit ? (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField size="small" fullWidth placeholder={tx("Add item")} value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                <Button size="small" startIcon={<AddIcon />} disabled={!newItem.trim()} onClick={() => { call(`${MAINT_API}/work-orders/${w.id}/checklist`, "POST", { item: newItem }); setNewItem(""); }}>{tx("Add")}</Button>
              </Stack>
            ) : null}
          </Box>
        ) : null}
        {key === "comp" ? (
          <Table size="small" sx={tableSx}>
            <TableHead><TableRow><TableCell>{tx("Components")}</TableCell><TableCell>{tx("Condition")}</TableCell><TableCell>{tx("Action")}</TableCell><TableCell>{tx("Note")}</TableCell></TableRow></TableHead>
            <TableBody>{d.components.map((c) => (
              <TableRow key={c.id}>
                <TableCell sx={{ fontWeight: 700 }}>{label("component", c.component)}</TableCell>
                <TableCell>
                  <Select size="small" variant="standard" disableUnderline value={c.condition_code} disabled={!canEdit} onChange={(e) => call(`${MAINT_API}/work-orders/${w.id}/components/${c.component}`, "PUT", { condition_code: e.target.value, action_code: c.action_code, note: c.note })}
                    sx={{ fontSize: 11.5, fontWeight: 700, color: CONDITION_COLORS[c.condition_code] }}>
                    {(lookups?.component_conditions || []).map((v) => <MenuItem key={v} value={v} sx={{ color: CONDITION_COLORS[v], fontWeight: 700 }}>{label("condition", v)}</MenuItem>)}
                  </Select>
                </TableCell>
                <TableCell>
                  <Select size="small" variant="standard" disableUnderline value={c.action_code} disabled={!canEdit} onChange={(e) => call(`${MAINT_API}/work-orders/${w.id}/components/${c.component}`, "PUT", { condition_code: c.condition_code, action_code: e.target.value, note: c.note })} sx={{ fontSize: 11.5 }}>
                    {(lookups?.component_actions || []).map((v) => <MenuItem key={v} value={v}>{label("compAction", v)}</MenuItem>)}
                  </Select>
                </TableCell>
                <TableCell sx={{ whiteSpace: "normal" }}>{c.note || EMPTY}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        ) : null}
        {key === "parts" ? (
          <Box>
            <Table size="small" sx={tableSx}>
              <TableHead><TableRow><TableCell>{tx("Part code")}</TableCell><TableCell>{tx("Part name")}</TableCell><TableCell align="right">{tx("Qty")}</TableCell><TableCell align="right">{tx("Unit cost")}</TableCell><TableCell align="right">{tx("Amount")}</TableCell><TableCell /></TableRow></TableHead>
              <TableBody>{d.parts.map((p) => (
                <TableRow key={p.id}><TableCell>{p.part_code || EMPTY}</TableCell><TableCell sx={{ fontWeight: 700 }}>{p.part_name}</TableCell><TableCell align="right">{num(p.qty, 2)} {p.unit || ""}</TableCell>
                  <TableCell align="right">{num(p.unit_cost)}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{num(p.amount)}</TableCell>
                  <TableCell padding="none">{canEdit ? <IconButton size="small" onClick={() => call(`${MAINT_API}/work-orders/${w.id}/parts/${p.id}`, "DELETE")}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton> : null}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
            {canEdit ? (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField size="small" label={tx("Part code")} value={part.part_code} onChange={(e) => setPart((o) => ({ ...o, part_code: e.target.value }))} sx={{ width: 110 }} />
                <TextField size="small" label={tx("Part name")} value={part.part_name} onChange={(e) => setPart((o) => ({ ...o, part_name: e.target.value }))} sx={{ flex: 1 }} />
                <TextField size="small" type="number" label={tx("Qty")} value={part.qty} onChange={(e) => setPart((o) => ({ ...o, qty: e.target.value }))} sx={{ width: 70 }} />
                <TextField size="small" label={tx("Unit")} value={part.unit} onChange={(e) => setPart((o) => ({ ...o, unit: e.target.value }))} sx={{ width: 64 }} />
                <TextField size="small" type="number" label={tx("Unit cost")} value={part.unit_cost} onChange={(e) => setPart((o) => ({ ...o, unit_cost: e.target.value }))} sx={{ width: 110 }} />
                <Button size="small" startIcon={<AddIcon />} disabled={!part.part_name.trim() || !(Number(part.qty) > 0)}
                  onClick={() => { call(`${MAINT_API}/work-orders/${w.id}/parts`, "POST", { ...part, qty: Number(part.qty), unit_cost: Number(part.unit_cost || 0) }); setPart({ part_code: "", part_name: "", qty: 1, unit: "pcs", unit_cost: 0 }); }}>{tx("Add")}</Button>
              </Stack>
            ) : null}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>{tx("Parts")}: {money(w.parts_cost)}</Typography>
          </Box>
        ) : null}
        {key === "labor" ? (
          <Box>
            <Table size="small" sx={tableSx}>
              <TableHead><TableRow><TableCell>{tx("Technician")}</TableCell><TableCell>{tx("Labor type")}</TableCell><TableCell align="right">{tx("Hours")}</TableCell><TableCell align="right">{tx("Rate")}</TableCell><TableCell align="right">{tx("Amount")}</TableCell><TableCell /></TableRow></TableHead>
              <TableBody>{d.labor.map((l) => (
                <TableRow key={l.id}><TableCell sx={{ fontWeight: 700 }}>{l.technician}</TableCell><TableCell>{label("laborType", l.labor_type)}</TableCell><TableCell align="right">{num(l.hours, 2)}</TableCell>
                  <TableCell align="right">{num(l.rate)}</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>{num(l.amount)}</TableCell>
                  <TableCell padding="none">{canEdit ? <IconButton size="small" onClick={() => call(`${MAINT_API}/work-orders/${w.id}/labor/${l.id}`, "DELETE")}><DeleteOutlineIcon sx={{ fontSize: 16 }} /></IconButton> : null}</TableCell></TableRow>
              ))}</TableBody>
            </Table>
            {canEdit ? (
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Box sx={{ flex: 1 }}><TechSelect lookups={lookups} value={labor.technician} onChange={(v) => setLabor((o) => ({ ...o, technician: v }))} /></Box>
                <TextField select size="small" label={tx("Labor type")} value={labor.labor_type} onChange={(e) => setLabor((o) => ({ ...o, labor_type: e.target.value }))} sx={{ width: 140 }}>
                  {(lookups?.labor_types || []).map((v) => <MenuItem key={v} value={v}>{label("laborType", v)}</MenuItem>)}</TextField>
                <TextField size="small" type="number" label={tx("Hours")} value={labor.hours} onChange={(e) => setLabor((o) => ({ ...o, hours: e.target.value }))} sx={{ width: 80 }} />
                <Button size="small" startIcon={<AddIcon />} disabled={!labor.technician || !(Number(labor.hours) > 0)}
                  onClick={() => { call(`${MAINT_API}/work-orders/${w.id}/labor`, "POST", { ...labor, hours: Number(labor.hours) }); setLabor({ technician: "", labor_type: "REPAIR", hours: 1 }); }}>{tx("Add")}</Button>
              </Stack>
            ) : null}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>{tx("Labor")}: {num(w.labor_hours, 2)} h · {money(w.labor_cost)} ({num(lookups?.labor_rate)} ₫/h)</Typography>
          </Box>
        ) : null}
        {key === "att" ? <Attachments owner="work-orders" ownerId={w.id} items={d.attachments} request={request} actor={actor} canEdit={canEditPage && !readOnly} onChanged={load} notify={notify} /> : null}
        {key === "hist" ? <><Timeline events={d.events} /><WoSteps events={d.events} /></> : null}
        {extraTabs?.find(([k]) => k === key)?.[2]?.(d)}
      </Box>
      {canEditPage && !readOnly ? (
        <Stack direction="row" sx={{ gap: 0.75, flexWrap: "wrap", mt: 1.25, pt: 1, borderTop: 1, borderColor: "divider" }}>
          {["RELEASED", "ASSIGNED", "IN_PROGRESS", "PAUSED"].includes(w.status) ? <Button size="small" startIcon={<AssignmentIndOutlinedIcon />} onClick={() => setDialog({ type: "assign" })} sx={btn("cancel")}>{tx("Assign")}</Button> : null}
          {["RELEASED", "ASSIGNED"].includes(w.status) ? <Button size="small" startIcon={<PlayCircleOutlineIcon />} onClick={() => act("START")} sx={{ ...btn("cancel"), color: "#12B76A" }}>{tx("Start Work")}</Button> : null}
          {w.status === "IN_PROGRESS" ? <Button size="small" startIcon={<PauseCircleOutlineIcon />} onClick={() => setDialog({ type: "pause" })} sx={{ ...btn("cancel"), color: "#F79009" }}>{tx("Pause Work")}</Button> : null}
          {w.status === "PAUSED" ? <Button size="small" startIcon={<PlayCircleOutlineIcon />} onClick={() => act("RESUME")} sx={{ ...btn("cancel"), color: "#12B76A" }}>{tx("Resume Work")}</Button> : null}
          {["IN_PROGRESS", "PAUSED"].includes(w.status) && d.stages?.length ? (
            <TextField select size="small" label={tx("Stage")} value={w.stage || ""} onChange={(e) => act("STAGE", { stage: e.target.value })} sx={{ minWidth: 170 }}>
              {d.stages.map((s) => <MenuItem key={s} value={s}>{label("stage", s)}</MenuItem>)}</TextField>
          ) : null}
          {["IN_PROGRESS", "PAUSED"].includes(w.status) ? <Button size="small" startIcon={<CheckCircleOutlineIcon />} onClick={() => act("SUBMIT")} sx={btn("primary")}>{tx("Complete Work")}</Button> : null}
          {w.status === "VERIFICATION" ? <Button size="small" startIcon={<VerifiedOutlinedIcon />} onClick={() => act("VERIFY")} sx={btn("primary")}>{tx("Verify")}</Button> : null}
          {w.status === "VERIFICATION" ? <Button size="small" startIcon={<ReplayOutlinedIcon />} onClick={() => setDialog({ type: "reject" })} sx={btn("cancel")}>{tx("Send Back")}</Button> : null}
          {w.status === "COMPLETED" ? <Button size="small" startIcon={<LockOutlinedIcon />} onClick={() => act("CLOSE")} sx={btn("cancel")}>{tx("Close WO")}</Button> : null}
          {open ? <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setDialog({ type: "edit" })} sx={btn("cancel")}>{tx("Edit")}</Button> : null}
          {["RELEASED", "ASSIGNED"].includes(w.status) ? <Button size="small" startIcon={<CancelOutlinedIcon />} onClick={() => setDialog({ type: "cancel" })} sx={btn("delete")}>{tx("Cancel WO")}</Button> : null}
        </Stack>
      ) : null}
      {w.status === "IN_PROGRESS" && d.checklist.some((c) => !c.result) ? <Alert severity="info" sx={{ mt: 1, py: 0, fontSize: 12 }}>{tx("Checklist items")}: {d.checklist.filter((c) => c.result).length}/{d.checklist.length}</Alert> : null}
      {dialog?.type === "assign" ? <NoteDialog title={tx("Assign")} technicianMode required={false} lookups={lookups} initialTech={w.technician} onClose={() => setDialog(null)} onSubmit={({ technician }) => act("ASSIGN", { technician })} /> : null}
      {dialog?.type === "pause" ? <NoteDialog title={tx("Pause Work")} onClose={() => setDialog(null)} onSubmit={({ note }) => act("PAUSE", { note })} /> : null}
      {dialog?.type === "reject" ? <NoteDialog title={tx("Send Back")} danger onClose={() => setDialog(null)} onSubmit={({ note }) => act("REJECT", { note })} /> : null}
      {dialog?.type === "cancel" ? <NoteDialog title={tx("Cancel WO")} danger onClose={() => setDialog(null)} onSubmit={({ note }) => act("CANCEL", { note })} /> : null}
      {dialog?.type === "edit" ? <WoDialog mode="edit" lookups={lookups} item={w} request={request} actor={actor} notify={notify} onClose={() => setDialog(null)} onSaved={() => { setDialog(null); refresh(); }} /> : null}
    </Box>
  );
}

export function MiniProgress({ value }) {
  const color = value >= 100 ? "#12B76A" : value > 0 ? "#2E90FA" : "#D0D5DD";
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", width: 90 }}>
      <LinearProgress variant="determinate" value={value || 0} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { bgcolor: color } }} />
      <Typography variant="caption" sx={{ width: 30, textAlign: "right" }}>{value || 0}%</Typography>
    </Stack>
  );
}

export function DonutLegend({ items, colors, total, formatter }) {
  return (
    <Stack spacing={0.45}>{items.map(([k, n, text], i) => (
      <Stack key={k} direction="row" spacing={0.75} sx={{ alignItems: "center" }}><Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: colors[k] || CHART_COLORS[i % CHART_COLORS.length] }} />
        <Typography variant="caption" sx={{ flex: 1 }} noWrap>{text}</Typography>
        <Typography variant="caption" fontWeight={800}>{formatter ? formatter(n) : n}{total ? ` (${num((n / total) * 100, 1)}%)` : ""}</Typography></Stack>))}</Stack>
  );
}

export { Tooltip };
