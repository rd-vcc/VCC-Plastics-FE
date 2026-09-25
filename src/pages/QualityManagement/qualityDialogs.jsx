import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, FormControlLabel, LinearProgress, MenuItem, Stack, Tab, Table, TableBody,
  TableCell, TableHead, TableRow, Tabs, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlineOutlined";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import StraightenOutlinedIcon from "@mui/icons-material/StraightenOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";

import { resolveImageUrl } from "../../components/common/ImageUploadField";
import { DialogHeader, EMPTY, btn, ddmmhhmm, dialogPaperSx, num, toInputDateTime } from "../ProductionManagement/ProductionPlanning/ui";
import { InfoRows } from "../MaintenanceManagement/maintUi";
import { label, tx } from "./qualityLocales";
import {
  API_BASE, ALERT_STATUS_COLORS, CAL_STATUS_COLORS, CalStatusPill, EquipStatePill, Events, NG_STATUS_COLORS, NgStatusPill, PLAN_STATUS_COLORS, PlanStatusPill,
  PriorityPill, QUALITY_API, ResultText, alertText, SeverityPill, AlertStatusPill, TypePill, dateText, dueText, pctText, specText, toBase64, whenText,
} from "./qualityUi";

const iso = (v) => (v ? (v.length === 16 ? `${v}:00` : v) : null);
const nowLocal = (addMin = 0) => toInputDateTime(new Date(Date.now() + addMin * 60000 - new Date().getTimezoneOffset() * 60000).toISOString());
const todayLocal = () => nowLocal().slice(0, 10);

function Loading() {
  return <Box sx={{ height: 260, display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
}

function PersonSelect({ lookups, value, onChange, labelText, required, disabled }) {
  const list = lookups?.inspectors || [];
  return (
    <TextField select size="small" fullWidth required={required} disabled={disabled} label={labelText} value={value || ""} onChange={(e) => onChange(e.target.value)}>
      <MenuItem value="">—</MenuItem>
      {(value && !list.includes(value) ? [value, ...list] : list).map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
    </TextField>
  );
}

/** Asks a note / reason, then runs onConfirm(note). */
export function NoteDialog({ title, required, labelText, confirmText, danger, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async () => { setBusy(true); try { await onConfirm(note.trim()); } finally { setBusy(false); } };
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<FactCheckOutlinedIcon />} title={title} onClose={onClose} disabled={busy} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <TextField autoFocus fullWidth multiline minRows={3} size="small" required={required} label={labelText || tx("Reason")} value={note} onChange={(e) => setNote(e.target.value)} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={run} disabled={busy || (required && !note.trim())} sx={btn(danger ? "delete" : "primary")}>{confirmText || tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// INSPECTION
// =========================================================

export function PlanCreateDialog({ lookups, preset, item, request, actor, notify, onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    inspection_type: item?.inspection_type || preset?.inspection_type || "IPQC", work_order_id: item?.work_order_id || preset?.work_order_id || "",
    product_id: item?.product_id || preset?.product_id || "", material_lot_id: item?.material_lot_id || "", process: item?.process || "",
    frequency_type: item?.frequency_type || "", frequency_value: item?.frequency_value || "", sample_size: item?.sample_size || "",
    planned_at: toInputDateTime(item?.planned_at) || nowLocal(), due_at: toInputDateTime(item?.due_at) || "", inspector: item?.inspector || "", remark: item?.remark || "" }));
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const iqc = f.inspection_type === "IQC";
  const save = async () => {
    setSaving(true);
    try {
      const body = JSON.stringify({ ...f, work_order_id: iqc ? null : f.work_order_id || null, product_id: iqc ? null : f.product_id || null, material_lot_id: iqc ? f.material_lot_id || null : null,
        process: f.process || null, frequency_type: f.frequency_type || null, frequency_value: f.frequency_value ? Number(f.frequency_value) : null,
        sample_size: f.sample_size ? Number(f.sample_size) : null, planned_at: iso(f.planned_at), due_at: iso(f.due_at), actor, version: item?.version });
      const r = item ? await request(`${QUALITY_API}/inspections/${item.id}`, { method: "PUT", body }) : await request(`${QUALITY_API}/inspections`, { method: "POST", body });
      notify("success", item ? tx("Saved.") : `${tx("Created")} ${r.plan_no}`); onSaved(r);
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<FactCheckOutlinedIcon />} title={item ? `${tx("Edit")} · ${item.plan_no}` : tx("Create Inspection Plan")} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("Inspection Type")} value={f.inspection_type} onChange={ch("inspection_type")} disabled={Boolean(item)}>
              {(lookups?.inspection_types || []).map((t) => <MenuItem key={t} value={t}>{label("inspectionType", t)}</MenuItem>)}</TextField>
            <TextField select size="small" fullWidth label={tx("Process")} value={f.process} onChange={ch("process")} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
              <MenuItem value="">{tx("Auto")}</MenuItem>
              {(lookups?.processes || []).map((t) => <MenuItem key={t} value={t}>{label("process", t)}</MenuItem>)}</TextField>
          </Stack>
          {iqc ? (
            <TextField select size="small" required label={tx("Material Lot")} value={f.material_lot_id} onChange={ch("material_lot_id")} disabled={Boolean(item)}>
              {(lookups?.lots || []).map((l) => <MenuItem key={l.id} value={l.id}>{l.lot_no} — {l.material_code} {l.material_name}</MenuItem>)}</TextField>
          ) : (
            <Stack direction="row" spacing={1.5}>
              <TextField select size="small" fullWidth label={tx("Work Order")} value={f.work_order_id} onChange={ch("work_order_id")} disabled={Boolean(item)}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
                <MenuItem value="">—</MenuItem>
                {(lookups?.work_orders || []).map((w) => <MenuItem key={w.id} value={w.id}>{w.wo_no} · {w.product_code} · {w.machine_code || "—"} ({label("woStatus", w.status)})</MenuItem>)}</TextField>
              <TextField select size="small" fullWidth label={tx("Product")} value={f.product_id} onChange={ch("product_id")} disabled={Boolean(item) || Boolean(f.work_order_id)}
                slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
                <MenuItem value="">{f.work_order_id ? tx("From the work order") : "—"}</MenuItem>
                {(lookups?.products || []).map((p) => <MenuItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</MenuItem>)}</TextField>
            </Stack>
          )}
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("Frequency")} value={f.frequency_type} onChange={ch("frequency_type")} disabled={Boolean(item)}
              slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
              <MenuItem value="">{tx("Auto")}</MenuItem>
              {(lookups?.frequency_types || []).map((t) => <MenuItem key={t} value={t}>{label("frequency", t)}</MenuItem>)}</TextField>
            {f.frequency_type === "TIME" || f.frequency_type === "QTY" ? (
              <TextField size="small" type="number" fullWidth label={f.frequency_type === "TIME" ? tx("Every (minutes)") : tx("Every (pcs)")} value={f.frequency_value} onChange={ch("frequency_value")} />
            ) : null}
            <TextField size="small" type="number" fullWidth label={tx("Sample Size")} value={f.sample_size} onChange={ch("sample_size")} placeholder={tx("Auto")} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField size="small" type="datetime-local" fullWidth label={tx("Planned Time")} value={f.planned_at} onChange={ch("planned_at")} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField size="small" type="datetime-local" fullWidth label={tx("Due Time")} value={f.due_at} onChange={ch("due_at")} slotProps={{ inputLabel: { shrink: true } }} helperText={f.due_at ? "" : tx("Auto")} />
          </Stack>
          <PersonSelect lookups={lookups} labelText={tx("Inspector")} value={f.inspector} onChange={(v) => setF((o) => ({ ...o, inspector: v }))} />
          <TextField size="small" multiline minRows={2} label={tx("Remark")} value={f.remark} onChange={ch("remark")} />
          <Typography variant="caption" color="text.secondary">{tx("The inspection standard is taken from the active Quality Standard of the product.")}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={save} disabled={saving || (iqc ? !f.material_lot_id : !f.work_order_id && !f.product_id)} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

const outOfSpec = (c, v) => v !== "" && v != null && !Number.isNaN(Number(v)) && ((c.lsl != null && Number(v) < Number(c.lsl)) || (c.usl != null && Number(v) > Number(c.usl)));

function SampleForm({ detail, lookups, request, actor, notify, onSaved }) {
  const { plan, characteristics: chars } = detail;
  const gauges = lookups?.gauges || [];
  const defaultGauge = useCallback((c) => {
    const usable = gauges.filter((g) => g.usable);
    return (usable.find((g) => g.type_id === c.equipment_type_id) || usable[0] || {}).id || "";
  }, [gauges]);
  const [vals, setVals] = useState({});
  const [gaugeOf, setGaugeOf] = useState({});
  const [defect, setDefect] = useState("");
  const [position, setPosition] = useState("");
  const [remark, setRemark] = useState("");
  const [manual, setManual] = useState("OK");
  const [reinspect, setReinspect] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setGaugeOf((o) => { const n = { ...o }; chars.forEach((c) => { if (n[c.id] == null && c.characteristic_type !== "ATTRIBUTE") n[c.id] = defaultGauge(c); }); return n; }); }, [chars, defaultGauge]);
  const isNg = chars.length ? chars.some((c) => (c.characteristic_type === "ATTRIBUTE" ? vals[c.id] === "NG" : outOfSpec(c, vals[c.id]))) : manual === "NG";
  const missing = chars.some((c) => (c.characteristic_type === "ATTRIBUTE" ? !vals[c.id] : vals[c.id] === "" || vals[c.id] == null || !gaugeOf[c.id]));
  const save = async () => {
    setSaving(true);
    try {
      const r = await request(`${QUALITY_API}/inspections/${plan.id}/samples`, { method: "POST", body: JSON.stringify({
        measurements: chars.map((c) => (c.characteristic_type === "ATTRIBUTE" ? { characteristic_id: c.id, attr_result: vals[c.id] } : { characteristic_id: c.id, value: Number(vals[c.id]), equipment_id: gaugeOf[c.id] || null })),
        result: chars.length ? null : manual, defect_code_id: defect || null, position: position || `Sample ${plan.done_qty + 1}`, remark: remark || null, is_reinspection: reinspect, actor }) });
      setVals({}); setDefect(""); setRemark(""); setPosition(""); setManual("OK");
      notify(r.result === "NG" ? "warning" : "success", `${tx("Sample")} ${plan.done_qty + 1}: ${label("result", r.result)}${r.ng ? ` · ${tx("NG record created")} ${r.ng.ng_no}` : ""}${r.warnings?.length ? ` · ${r.warnings.join("; ")}` : ""}`);
      onSaved();
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25 }}>
      <Stack direction="row" sx={{ alignItems: "center", mb: 1, gap: 1 }}>
        <StraightenOutlinedIcon sx={{ color: "#1570EF" }} />
        <Typography variant="subtitle2" fontWeight={800} sx={{ flex: 1 }}>{tx("Record sample")} {plan.done_qty + 1} / {plan.sample_size}</Typography>
        {detail.control === "BLOCK" ? <Typography variant="caption" color="text.secondary">{tx("Invalid measuring equipment is blocked.")}</Typography> : null}
      </Stack>
      {chars.length ? (
        <Table size="small" sx={{ "& td, & th": { fontSize: 12, px: 0.75, py: 0.4 } }}>
          <TableHead><TableRow><TableCell>{tx("Characteristic")}</TableCell><TableCell>{tx("Specification")}</TableCell><TableCell sx={{ width: 150 }}>{tx("Value")}</TableCell><TableCell>{tx("Measuring Equipment")}</TableCell></TableRow></TableHead>
          <TableBody>{chars.map((c) => {
            const attr = c.characteristic_type === "ATTRIBUTE";
            const bad = attr ? vals[c.id] === "NG" : outOfSpec(c, vals[c.id]);
            return (
              <TableRow key={c.id} sx={{ bgcolor: bad ? "#F044380F" : undefined }}>
                <TableCell sx={{ fontWeight: 700 }}>{c.characteristic_name}{c.is_critical ? <Typography component="span" variant="caption" sx={{ color: "#F04438", ml: 0.5 }}>★</Typography> : null}</TableCell>
                <TableCell>{specText(c)}</TableCell>
                <TableCell>{attr ? (
                  <ToggleButtonGroup exclusive size="small" value={vals[c.id] || null} onChange={(e, v) => v && setVals((o) => ({ ...o, [c.id]: v }))}>
                    <ToggleButton value="OK" sx={{ px: 1.5, py: 0.25, fontWeight: 800, color: "#12B76A" }}>OK</ToggleButton>
                    <ToggleButton value="NG" sx={{ px: 1.5, py: 0.25, fontWeight: 800, color: "#F04438" }}>NG</ToggleButton>
                  </ToggleButtonGroup>
                ) : (
                  <TextField size="small" type="number" value={vals[c.id] ?? ""} onChange={(e) => setVals((o) => ({ ...o, [c.id]: e.target.value }))} error={bad}
                    slotProps={{ htmlInput: { step: "any" }, input: { endAdornment: c.unit ? <Typography variant="caption" color="text.secondary">{c.unit}</Typography> : null } }} sx={{ width: 140 }} />
                )}</TableCell>
                <TableCell>{attr ? <Typography variant="caption" color="text.secondary">{tx("Visual")}</Typography> : (
                  <TextField select size="small" value={gaugeOf[c.id] || ""} onChange={(e) => setGaugeOf((o) => ({ ...o, [c.id]: e.target.value }))} sx={{ minWidth: 190 }}>
                    {gauges.map((g) => <MenuItem key={g.id} value={g.id} disabled={!g.usable && detail.control === "BLOCK"}>{g.code} — {g.name}{g.usable ? "" : ` (${label("equipState", g.state)})`}</MenuItem>)}
                  </TextField>
                )}</TableCell>
              </TableRow>
            );
          })}</TableBody>
        </Table>
      ) : (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="caption">{tx("No characteristics in the standard: record the result directly.")}</Typography>
          <ToggleButtonGroup exclusive size="small" value={manual} onChange={(e, v) => v && setManual(v)}>
            <ToggleButton value="OK" sx={{ px: 2, fontWeight: 800, color: "#12B76A" }}>OK</ToggleButton>
            <ToggleButton value="NG" sx={{ px: 2, fontWeight: 800, color: "#F04438" }}>NG</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1, alignItems: "center" }}>
        <TextField select size="small" label={tx("Defect")} value={defect} onChange={(e) => setDefect(e.target.value)} sx={{ width: 200 }} required={isNg} error={isNg && !defect && !chars.some((c) => c.characteristic_type !== "ATTRIBUTE" && outOfSpec(c, vals[c.id]))}>
          <MenuItem value="">—</MenuItem>
          {(lookups?.defects || []).map((d) => <MenuItem key={d.id} value={d.id}>{d.reason_code} — {d.reason_name}</MenuItem>)}</TextField>
        <TextField size="small" label={tx("Sampling Position")} value={position} onChange={(e) => setPosition(e.target.value)} placeholder={`Sample ${plan.done_qty + 1}`} sx={{ width: 170 }} />
        <TextField size="small" label={tx("Remark")} value={remark} onChange={(e) => setRemark(e.target.value)} sx={{ flex: 1, minWidth: 160 }} />
        <FormControlLabel control={<Checkbox size="small" checked={reinspect} onChange={(e) => setReinspect(e.target.checked)} />} label={<Typography variant="caption">{tx("Re-inspection")}</Typography>} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: isNg ? "#F04438" : "#12B76A", minWidth: 40 }}>{isNg ? "NG" : "OK"}</Typography>
        <Button startIcon={<SaveOutlinedIcon />} onClick={save} disabled={saving || missing} sx={btn("primary")}>{tx("Save sample")}</Button>
      </Stack>
    </Box>
  );
}

export function InspectionDialog({ planId, lookups, request, actor, notify, canEdit, onClose, onChanged, navigate }) {
  const [d, setD] = useState(null);
  const [note, setNote] = useState(null);
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState("samples");
  const load = useCallback(async () => {
    try { setD(await request(`${QUALITY_API}/inspections/${planId}`)); } catch (e) { notify("error", e.message); }
  }, [planId, request, notify]);
  useEffect(() => { load(); }, [load]);
  const changed = () => { load(); onChanged?.(); };
  const act = async (action, body = {}) => {
    try { await request(`${QUALITY_API}/inspections/${planId}/${action}`, { method: "POST", body: JSON.stringify({ ...body, version: d.plan.version, actor }) }); notify("success", tx("Saved.")); changed(); }
    catch (e) { notify("error", e.message); }
  };
  const p = d?.plan;
  const open = p && ["NOT_STARTED", "IN_PROGRESS"].includes(p.status);
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<FactCheckOutlinedIcon />} title={p ? `${p.plan_no} · ${label("inspectionType", p.inspection_type)}` : tx("Inspection Plan")}
        subtitle={p ? [p.wo_no, p.product_code && `${p.product_code} ${p.product_name}`, p.lot_no, p.machine_code, p.mold_code].filter(Boolean).join(" · ") : ""} onClose={onClose} />
      <DialogContent sx={{ pt: "12px !important" }}>
        {!d ? <Loading /> : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px minmax(0,1fr)" }, gap: 2 }}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: "center" }}><PlanStatusPill value={p.display_status} />{p.result ? <ResultText value={p.result} /> : null}</Stack>
              <InfoRows rows={[
                [tx("Inspection Type"), label("inspectionType", p.inspection_type)], [tx("Process"), label("process", p.process)],
                [tx("Work Order"), p.wo_no ? <Typography component="span" variant="caption" fontWeight={700} sx={{ color: "#1570EF", cursor: "pointer" }}
                  onClick={() => navigate(`/production-management/work-orders/management?wo=${p.work_order_id}`)}>{p.wo_no}</Typography> : EMPTY],
                [tx("Product"), p.product_code ? `${p.product_code} — ${p.product_name}` : EMPTY], p.lot_no ? [tx("Material Lot"), `${p.lot_no} · ${p.material_code || ""}`] : null,
                [tx("Machine"), p.machine_code], [tx("Mold"), p.mold_code], [tx("Standard"), p.standard_name ? `${p.standard_name} (Rev ${p.revision_no})` : tx("No standard")],
                [tx("Frequency"), p.frequency_type === "TIME" ? `${tx("every")} ${p.frequency_value} ${tx("min")}` : label("frequency", p.frequency_type)],
                [tx("Sample Size"), `${p.done_qty} / ${p.sample_size}`], [tx("Planned Time"), ddmmhhmm(p.planned_at)],
                [tx("Due Time"), ddmmhhmm(p.due_at), p.display_status === "OVERDUE" ? "#F04438" : undefined], [tx("Shift"), p.shift_name],
                [tx("Inspector"), p.inspector], [tx("Source"), label("planSource", p.source)], [tx("OK Rate"), pctText(p.ok_rate)], [tx("NG Rate"), pctText(p.ng_rate), p.ng_qty ? "#F04438" : undefined],
                p.remark ? [tx("Remark"), p.remark] : null,
              ]} />
              {d.ng.length ? (
                <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                  {tx("NG records")}: {d.ng.map((n) => <Typography key={n.id} component="span" variant="caption" fontWeight={800} sx={{ color: "#1570EF", cursor: "pointer", mr: 1 }}
                    onClick={() => navigate(`/quality-management/ng-management?ng=${n.id}`)}>{n.ng_no}</Typography>)}
                </Alert>
              ) : null}
              {canEdit && open ? (
                <Stack spacing={0.75} sx={{ mt: 1.5 }}>
                  {p.status === "NOT_STARTED" ? <Button startIcon={<PlayCircleOutlineIcon />} onClick={() => act("start", { data: { inspector: actor } })} sx={btn("primary")}>{tx("Start inspection")}</Button> : null}
                  {p.status === "NOT_STARTED" ? <Button startIcon={<BuildOutlinedIcon />} onClick={() => setEdit(true)} sx={btn("edit")}>{tx("Edit")}</Button> : null}
                  {p.status === "IN_PROGRESS" && p.done_qty ? <Button startIcon={<AssignmentTurnedInOutlinedIcon />} onClick={() => setNote({ action: "complete", required: p.done_qty < p.sample_size })} sx={btn("edit")}>{tx("Complete with recorded samples")}</Button> : null}
                  <Button startIcon={<CancelOutlinedIcon />} onClick={() => setNote({ action: "cancel", required: true, danger: true })} sx={btn("delete")}>{tx("Cancel plan")}</Button>
                </Stack>
              ) : null}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ minHeight: 36, mb: 1, "& .MuiTab-root": { minHeight: 36, textTransform: "none", fontWeight: 700 } }}>
                <Tab value="samples" label={`${tx("Samples")} (${d.records.length})`} /><Tab value="standard" label={`${tx("Standard")} (${d.characteristics.length})`} /><Tab value="history" label={tx("History")} />
              </Tabs>
              {tab === "samples" ? (
                <Stack spacing={1.5}>
                  {canEdit && open && p.done_qty < p.sample_size ? <SampleForm detail={d} lookups={lookups} request={request} actor={actor} notify={notify} onSaved={changed} /> : null}
                  <Box sx={{ overflow: "auto", maxHeight: 360 }}>
                    <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.4, whiteSpace: "nowrap" }, "& th": { fontWeight: 800, bgcolor: "background.paper" } }}>
                      <TableHead><TableRow><TableCell>#</TableCell><TableCell>{tx("Time")}</TableCell>
                        {d.characteristics.map((c) => <TableCell key={c.id} align="right">{c.characteristic_name}</TableCell>)}
                        <TableCell align="center">{tx("Result")}</TableCell><TableCell>{tx("Defect")}</TableCell><TableCell>{tx("Inspector")}</TableCell><TableCell>{tx("Remark")}</TableCell></TableRow></TableHead>
                      <TableBody>{d.records.map((r) => {
                        const by = Object.fromEntries((r.measurements || []).map((m) => [m.characteristic_id, m]));
                        return (
                          <TableRow key={r.id}>
                            <TableCell>{r.sample_no}{r.is_reinspection ? " (R)" : ""}</TableCell><TableCell>{ddmmhhmm(r.inspected_at)}</TableCell>
                            {d.characteristics.map((c) => { const m = by[c.id]; return (
                              <TableCell key={c.id} align="right" sx={{ color: m?.result === "NG" ? "#F04438" : undefined, fontWeight: m?.result === "NG" ? 800 : 400 }}>
                                {m ? (m.measured_value != null ? num(m.measured_value, 4) : m.attr_result) : EMPTY}
                                {m?.gauge_code ? <Typography component="span" sx={{ fontSize: 9.5, color: "text.secondary", ml: 0.5 }}>{m.gauge_code}</Typography> : null}
                              </TableCell>); })}
                            <TableCell align="center"><ResultText value={r.result} /></TableCell><TableCell>{r.defect_name || EMPTY}</TableCell><TableCell>{r.inspector}</TableCell>
                            <TableCell sx={{ whiteSpace: "normal !important", maxWidth: 220 }}>{r.remark || EMPTY}</TableCell>
                          </TableRow>
                        );
                      })}</TableBody>
                    </Table>
                    {!d.records.length ? <Typography variant="caption" color="text.secondary" sx={{ p: 1, display: "block" }}>{tx("No samples recorded yet.")}</Typography> : null}
                  </Box>
                </Stack>
              ) : null}
              {tab === "standard" ? (
                <Table size="small" sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.4 } }}>
                  <TableHead><TableRow><TableCell>{tx("Characteristic")}</TableCell><TableCell>{tx("Nominal")}</TableCell><TableCell>{tx("Specification")}</TableCell><TableCell>{tx("Method")}</TableCell>
                    <TableCell>{tx("Equipment type")}</TableCell><TableCell>{tx("SPC")}</TableCell></TableRow></TableHead>
                  <TableBody>{d.characteristics.map((c) => (
                    <TableRow key={c.id}><TableCell sx={{ fontWeight: 700 }}>{c.characteristic_name}{c.is_critical ? " ★" : ""}</TableCell><TableCell>{c.nominal_value ?? EMPTY}</TableCell>
                      <TableCell>{specText(c)}</TableCell><TableCell>{c.inspection_method || EMPTY}</TableCell><TableCell>{c.equipment_type_name || EMPTY}</TableCell>
                      <TableCell>{c.is_spc ? label("chartType", c.chart_type) : EMPTY}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              ) : null}
              {tab === "history" ? <Events events={d.events} group="planAction" colors={PLAN_STATUS_COLORS} /> : null}
            </Box>
          </Box>
        )}
      </DialogContent>
      {note ? <NoteDialog title={note.action === "cancel" ? tx("Cancel plan") : tx("Complete with recorded samples")} required={note.required} danger={note.danger}
        onClose={() => setNote(null)} onConfirm={async (text) => { await act(note.action, { note: text }); setNote(null); }} /> : null}
      {edit && p ? <PlanCreateDialog lookups={lookups} item={p} request={request} actor={actor} notify={notify} onClose={() => setEdit(false)} onSaved={() => { setEdit(false); changed(); }} /> : null}
    </Dialog>
  );
}

// =========================================================
// NG RECORDS
// =========================================================

export function NgCreateDialog({ lookups, preset, request, actor, notify, onClose, onSaved }) {
  const [f, setF] = useState(() => ({ source: preset?.source || "IPQC", work_order_id: preset?.work_order_id || "", product_id: preset?.product_id || "", machine_id: preset?.machine_id || "",
    mold_id: preset?.mold_id || "", material_lot_id: "", defect_code_id: preset?.defect_code_id || "", process: preset?.process || "INJECTION", ng_qty: preset?.ng_qty || "",
    inspected_qty: "", priority: "", owner: "", description: preset?.description || "", detected_at: nowLocal(), hold_wo: false }));
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const save = async () => {
    setSaving(true);
    try {
      const body = { ...f, ng_qty: Number(f.ng_qty), inspected_qty: f.inspected_qty ? Number(f.inspected_qty) : null, detected_at: iso(f.detected_at), actor };
      ["work_order_id", "product_id", "machine_id", "mold_id", "material_lot_id", "defect_code_id", "priority", "owner"].forEach((k) => { if (!body[k]) body[k] = null; });
      const r = await request(`${QUALITY_API}/ng`, { method: "POST", body: JSON.stringify(body) });
      notify("success", `${tx("Created")} ${r.ng_no}`); onSaved(r);
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  const sel = { inputLabel: { shrink: true }, select: { displayEmpty: true } };
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ReportProblemOutlinedIcon />} tone="danger" title={tx("Create NG Record")} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("NG Source")} value={f.source} onChange={ch("source")}>
              {(lookups?.ng_sources || []).map((t) => <MenuItem key={t} value={t}>{label("ngSource", t)}</MenuItem>)}</TextField>
            <TextField select size="small" fullWidth label={tx("Process")} value={f.process} onChange={ch("process")}>
              {(lookups?.processes || []).map((t) => <MenuItem key={t} value={t}>{label("process", t)}</MenuItem>)}</TextField>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("Work Order")} value={f.work_order_id} onChange={ch("work_order_id")} slotProps={sel}>
              <MenuItem value="">—</MenuItem>
              {(lookups?.work_orders || []).map((w) => <MenuItem key={w.id} value={w.id}>{w.wo_no} · {w.product_code} · {w.machine_code || "—"}</MenuItem>)}</TextField>
            <TextField select size="small" fullWidth label={tx("Product")} value={f.product_id} onChange={ch("product_id")} disabled={Boolean(f.work_order_id)} slotProps={sel}>
              <MenuItem value="">{f.work_order_id ? tx("From the work order") : "—"}</MenuItem>
              {(lookups?.products || []).map((p) => <MenuItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</MenuItem>)}</TextField>
          </Stack>
          {f.source === "IQC" ? (
            <TextField select size="small" label={tx("Material Lot")} value={f.material_lot_id} onChange={ch("material_lot_id")}>
              {(lookups?.lots || []).map((l) => <MenuItem key={l.id} value={l.id}>{l.lot_no} — {l.material_code}</MenuItem>)}</TextField>
          ) : !f.work_order_id ? (
            <Stack direction="row" spacing={1.5}>
              <TextField select size="small" fullWidth label={tx("Machine")} value={f.machine_id} onChange={ch("machine_id")} slotProps={sel}>
                <MenuItem value="">—</MenuItem>{(lookups?.machines || []).map((m) => <MenuItem key={m.id} value={m.id}>{m.code} — {m.name}</MenuItem>)}</TextField>
              <TextField select size="small" fullWidth label={tx("Mold")} value={f.mold_id} onChange={ch("mold_id")} slotProps={sel}>
                <MenuItem value="">—</MenuItem>{(lookups?.molds || []).map((m) => <MenuItem key={m.id} value={m.id}>{m.code} — {m.name}</MenuItem>)}</TextField>
            </Stack>
          ) : null}
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth required label={tx("Defect")} value={f.defect_code_id} onChange={ch("defect_code_id")}>
              {(lookups?.defects || []).map((d) => <MenuItem key={d.id} value={d.id}>{d.reason_code} — {d.reason_name}</MenuItem>)}</TextField>
            <TextField size="small" type="number" required label={tx("NG Qty")} value={f.ng_qty} onChange={ch("ng_qty")} sx={{ width: 120 }} />
            <TextField size="small" type="number" label={tx("Inspected Qty")} value={f.inspected_qty} onChange={ch("inspected_qty")} sx={{ width: 130 }} />
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("Priority")} value={f.priority} onChange={ch("priority")} slotProps={sel}>
              <MenuItem value="">{tx("Auto")}</MenuItem>{(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
            <PersonSelect lookups={lookups} labelText={tx("Owner")} value={f.owner} onChange={(v) => setF((o) => ({ ...o, owner: v }))} />
            <TextField size="small" type="datetime-local" fullWidth label={tx("Detected at")} value={f.detected_at} onChange={ch("detected_at")} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          <TextField size="small" multiline minRows={2} label={tx("Description")} value={f.description} onChange={ch("description")} />
          {f.work_order_id ? <FormControlLabel control={<Checkbox size="small" checked={f.hold_wo} onChange={(e) => setF((o) => ({ ...o, hold_wo: e.target.checked }))} />}
            label={<Typography variant="caption">{tx("Hold the work order now (containment)")}</Typography>} /> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={save} disabled={saving || !f.ng_qty || !f.defect_code_id || (!f.work_order_id && !f.product_id && !f.material_lot_id)} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

const NG_FLOW = ["NEW", "INVESTIGATING", "CA_IN_PROGRESS", "WAITING_VERIFICATION", "CLOSED"];

function NgSteps({ status, events }) {
  const idx = NG_FLOW.indexOf(status === "REOPENED" ? "INVESTIGATING" : status);
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", mb: 1.5 }}>
      {NG_FLOW.map((s, i) => {
        const ev = (events || []).find((e) => e.to_status === s);
        const color = i <= idx ? NG_STATUS_COLORS[s] : "#D0D5DD";
        return (
          <Box key={s} sx={{ textAlign: "center", position: "relative" }}>
            {i > 0 ? <Box sx={{ position: "absolute", top: 8, left: 0, right: "50%", height: 2, bgcolor: i <= idx ? "#12B76A" : "#D0D5DD" }} /> : null}
            {i < 4 ? <Box sx={{ position: "absolute", top: 8, left: "50%", right: 0, height: 2, bgcolor: i < idx ? "#12B76A" : "#D0D5DD" }} /> : null}
            <CheckCircleOutlineIcon sx={{ position: "relative", fontSize: 18, color, bgcolor: "background.paper", borderRadius: "50%" }} />
            <Typography variant="caption" sx={{ display: "block", fontSize: 10.5, fontWeight: 700 }}>{label("ngStep", s)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{ev ? ddmmhhmm(ev.event_at) : EMPTY}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export function NgDetailDialog({ ngId, lookups, request, actor, notify, canEdit, onClose, onChanged, navigate, initialTab }) {
  const [d, setD] = useState(null);
  const [f, setF] = useState({});
  const [tab, setTab] = useState(initialTab || "info");
  const [note, setNote] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await request(`${QUALITY_API}/ng/${ngId}`);
      setD(r);
      const n = r.ng;
      setF({ owner: n.owner || "", priority: n.priority, due_date: n.due_date || "", description: n.description || "", disposition: n.disposition || "", rework_qty: n.rework_qty ?? 0,
        scrap_qty: n.scrap_qty ?? 0, containment: n.containment || "", root_cause_category: n.root_cause_category || "", root_cause: n.root_cause || "",
        corrective_action: n.corrective_action || "", preventive_action: n.preventive_action || "", verification_result: n.verification_result || "", defect_code_id: n.defect_code_id || "" });
    } catch (e) { notify("error", e.message); }
  }, [ngId, request, notify]);
  useEffect(() => { load(); }, [load]);
  const n = d?.ng;
  const closed = n?.status === "CLOSED";
  const editable = canEdit && n && !closed;
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const body = (extra = {}) => {
    const b = { ...f, rework_qty: Number(f.rework_qty || 0), scrap_qty: Number(f.scrap_qty || 0), version: n.version, actor, ...extra };
    ["due_date", "disposition", "root_cause_category", "defect_code_id", "owner"].forEach((k) => { if (b[k] === "") b[k] = null; });
    return JSON.stringify(b);
  };
  const run = async (fn) => { setBusy(true); try { await fn(); notify("success", tx("Saved.")); await load(); onChanged?.(); } catch (e) { notify("error", e.message); } finally { setBusy(false); } };
  const save = () => run(() => request(`${QUALITY_API}/ng/${ngId}`, { method: "PUT", body: body() }));
  const act = (action, extra) => run(() => request(`${QUALITY_API}/ng/${ngId}/${action}`, { method: "POST", body: closed ? JSON.stringify({ version: n.version, actor, ...extra }) : body(extra) }));
  const actions = !n || !canEdit ? [] : [
    ["NEW", "REOPENED"].includes(n.status) && [tx("Start investigation"), "start_investigation", PlayCircleOutlineIcon, "primary"],
    ["INVESTIGATING", "REOPENED"].includes(n.status) && [tx("Start corrective action"), "start_ca", BuildOutlinedIcon, "primary"],
    n.status === "CA_IN_PROGRESS" && [tx("Submit for verification"), "submit_verify", AssignmentTurnedInOutlinedIcon, "primary"],
    n.status === "WAITING_VERIFICATION" && [tx("Verify effective & close"), "verify", VerifiedOutlinedIcon, "primary"],
    n.status === "WAITING_VERIFICATION" && [tx("Not effective"), "reject_verify", ReplayOutlinedIcon, "delete", true],
    closed && [tx("Reopen"), "reopen", ReplayOutlinedIcon, "edit", true],
  ].filter(Boolean);
  const sel = { inputLabel: { shrink: true }, select: { displayEmpty: true } };
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ReportProblemOutlinedIcon />} tone="danger" title={n ? `${n.ng_no} · ${n.defect_name || tx("Unclassified")}` : tx("NG Record")}
        subtitle={n ? [label("ngSource", n.source), n.wo_no, n.product_code && `${n.product_code} ${n.product_name}`, n.machine_code, n.mold_code].filter(Boolean).join(" · ") : ""} onClose={onClose} />
      {busy ? <LinearProgress /> : null}
      <DialogContent sx={{ pt: "12px !important" }}>
        {!d ? <Loading /> : (
          <>
            <NgSteps status={n.status} events={[...d.events].reverse()} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "270px minmax(0,1fr)" }, gap: 2 }}>
              <Box>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}><NgStatusPill value={n.status} /><PriorityPill value={n.priority} /></Stack>
                <InfoRows rows={[
                  [tx("Detected at"), ddmmhhmm(n.detected_at)], [tx("NG Source"), label("ngSource", n.source)], [tx("Process"), label("process", n.process)],
                  [tx("Work Order"), n.wo_no ? <Typography component="span" variant="caption" fontWeight={700} sx={{ color: "#1570EF", cursor: "pointer" }}
                    onClick={() => navigate(`/production-management/work-orders/management?wo=${n.work_order_id}`)}>{n.wo_no}</Typography> : EMPTY],
                  [tx("Product"), n.product_code ? `${n.product_code} — ${n.product_name}` : EMPTY],
                  [tx("Machine"), n.machine_code ? <Typography component="span" variant="caption" fontWeight={700} sx={{ color: "#1570EF", cursor: "pointer" }}
                    onClick={() => navigate(`/machine-equipment/machine-detail?machine=${n.machine_id}`)}>{n.machine_code}</Typography> : EMPTY],
                  [tx("Mold"), n.mold_code ? <Typography component="span" variant="caption" fontWeight={700} sx={{ color: "#1570EF", cursor: "pointer" }}
                    onClick={() => navigate(`/mold-management/detail?mold=${n.mold_id}`)}>{n.mold_code}</Typography> : EMPTY],
                  n.lot_no ? [tx("Material Lot"), n.lot_no] : null,
                  [tx("Inspection"), n.plan_no ? <Typography component="span" variant="caption" fontWeight={700} sx={{ color: "#1570EF", cursor: "pointer" }}
                    onClick={() => navigate(`/quality-management/inspection-management?plan=${n.inspection_plan_id}`)}>{n.plan_no}</Typography> : EMPTY],
                  n.characteristic_name ? [tx("Characteristic"), n.characteristic_name] : null,
                  [tx("NG Qty"), num(n.ng_qty), "#F04438"], [tx("Inspected Qty"), n.inspected_qty != null ? num(n.inspected_qty) : EMPTY], [tx("NG Rate"), pctText(n.ng_rate)],
                  [tx("Detected by"), n.detected_by], [tx("Due date"), dateText(n.due_date), n.overdue ? "#F04438" : undefined],
                  [tx("Work order held"), n.wo_held ? tx("Yes") : tx("No"), n.wo_held ? "#F04438" : undefined],
                  n.repeat_of_no ? [tx("Repeat of"), <Typography key="r" component="span" variant="caption" fontWeight={800} sx={{ color: "#F04438", cursor: "pointer" }}
                    onClick={() => navigate(`/quality-management/ng-management?ng=${n.repeat_of_id}`)}>{n.repeat_of_no}</Typography>] : null,
                ]} />
                {canEdit && n.work_order_id && !n.wo_held && !closed ? (
                  <Button fullWidth startIcon={<PauseCircleOutlineIcon />} onClick={() => act("hold_wo")} disabled={busy} sx={{ ...btn("delete"), mt: 1.5 }}>{tx("Hold work order")}</Button>
                ) : null}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ minHeight: 36, mb: 1.5, "& .MuiTab-root": { minHeight: 36, textTransform: "none", fontWeight: 700 } }}>
                  <Tab value="info" label={tx("Information")} /><Tab value="containment" label={tx("Containment & Disposition")} /><Tab value="rca" label={tx("Root Cause & Action")} />
                  <Tab value="verify" label={tx("Verification")} /><Tab value="history" label={tx("History")} /><Tab value="related" label={`${tx("Related NG")} (${d.related.length})`} />
                </Tabs>
                {tab === "info" ? (
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5}>
                      <TextField select size="small" fullWidth disabled={!editable} label={tx("Defect")} value={f.defect_code_id} onChange={ch("defect_code_id")}>
                        {(lookups?.defects || []).map((x) => <MenuItem key={x.id} value={x.id}>{x.reason_code} — {x.reason_name}</MenuItem>)}</TextField>
                      <TextField select size="small" fullWidth disabled={!editable} label={tx("Priority")} value={f.priority} onChange={ch("priority")}>
                        {(lookups?.priorities || []).map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <PersonSelect lookups={lookups} disabled={!editable} labelText={tx("Owner")} value={f.owner} onChange={(v) => setF((o) => ({ ...o, owner: v }))} />
                      <TextField size="small" type="date" fullWidth disabled={!editable} label={tx("Due date")} value={f.due_date} onChange={ch("due_date")} slotProps={{ inputLabel: { shrink: true } }} />
                    </Stack>
                    <TextField size="small" multiline minRows={3} disabled={!editable} label={tx("Description")} value={f.description} onChange={ch("description")} />
                  </Stack>
                ) : null}
                {tab === "containment" ? (
                  <Stack spacing={1.5}>
                    <TextField size="small" multiline minRows={2} disabled={!editable} label={tx("Containment action")} value={f.containment} onChange={ch("containment")}
                      placeholder={tx("Segregate / sort suspect pieces, hold the lot...")} />
                    <Stack direction="row" spacing={1.5}>
                      <TextField select size="small" fullWidth disabled={!editable} label={tx("Disposition")} value={f.disposition} onChange={ch("disposition")} slotProps={sel}>
                        <MenuItem value="">—</MenuItem>{(lookups?.dispositions || []).map((t) => <MenuItem key={t} value={t}>{label("disposition", t)}</MenuItem>)}</TextField>
                      <TextField size="small" type="number" disabled={!editable} label={tx("Rework Qty")} value={f.rework_qty} onChange={ch("rework_qty")} sx={{ width: 140 }} />
                      <TextField size="small" type="number" disabled={!editable} label={tx("Scrap Qty")} value={f.scrap_qty} onChange={ch("scrap_qty")} sx={{ width: 140 }} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{tx("The disposition is required before verification. Rework quantities appear in Production Results.")}</Typography>
                  </Stack>
                ) : null}
                {tab === "rca" ? (
                  <Stack spacing={1.5}>
                    <TextField select size="small" disabled={!editable} label={tx("Root cause category (4M)")} value={f.root_cause_category} onChange={ch("root_cause_category")} slotProps={sel}>
                      <MenuItem value="">—</MenuItem>{(lookups?.root_causes || []).map((t) => <MenuItem key={t} value={t}>{label("rootCause", t)}</MenuItem>)}</TextField>
                    <TextField size="small" multiline minRows={2} disabled={!editable} label={tx("Root cause (5 Why)")} value={f.root_cause} onChange={ch("root_cause")} />
                    <TextField size="small" multiline minRows={2} disabled={!editable} label={tx("Corrective action")} value={f.corrective_action} onChange={ch("corrective_action")} />
                    <TextField size="small" multiline minRows={2} disabled={!editable} label={tx("Preventive action")} value={f.preventive_action} onChange={ch("preventive_action")} />
                  </Stack>
                ) : null}
                {tab === "verify" ? (
                  <Stack spacing={1.5}>
                    <TextField size="small" multiline minRows={3} disabled={!editable} label={tx("Verification result")} value={f.verification_result} onChange={ch("verification_result")}
                      placeholder={tx("e.g. 3 consecutive shifts without recurrence")} />
                    {closed ? <Alert severity="success" sx={{ py: 0 }}>{tx("Closed at")} {ddmmhhmm(n.closed_at)}</Alert> : null}
                  </Stack>
                ) : null}
                {tab === "history" ? <Events events={d.events} group="ngAction" /> : null}
                {tab === "related" ? (
                  <Table size="small" sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.4 } }}>
                    <TableHead><TableRow><TableCell>{tx("NG No.")}</TableCell><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Defect")}</TableCell><TableCell align="right">{tx("Qty")}</TableCell><TableCell>{tx("Status")}</TableCell></TableRow></TableHead>
                    <TableBody>{d.related.map((r) => (
                      <TableRow key={r.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/quality-management/ng-management?ng=${r.id}`)}>
                        <TableCell sx={{ color: "#1570EF", fontWeight: 700 }}>{r.ng_no}</TableCell><TableCell>{ddmmhhmm(r.detected_at)}</TableCell><TableCell>{r.defect_name}</TableCell>
                        <TableCell align="right">{num(r.ng_qty)}</TableCell><TableCell><NgStatusPill value={r.status} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                ) : null}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
        <Box sx={{ flex: 1 }} />
        {editable ? <Button startIcon={<SaveOutlinedIcon />} onClick={save} disabled={busy} sx={btn("edit")}>{tx("Save")}</Button> : null}
        {actions.map(([text, a, Icon, kind, needNote]) => (
          <Button key={a} startIcon={<Icon />} disabled={busy} sx={btn(kind)} onClick={() => (needNote ? setNote({ action: a, title: text }) : act(a))}>{text}</Button>
        ))}
      </DialogActions>
      {note ? <NoteDialog title={note.title} required onClose={() => setNote(null)} onConfirm={async (text) => { await act(note.action, { note: text }); setNote(null); }} /> : null}
    </Dialog>
  );
}

// =========================================================
// MEASURING EQUIPMENT
// =========================================================

export function EquipmentDialog({ equipmentId, lookups, request, actor, notify, canEdit, onClose, onChanged, navigate, initialTab }) {
  const [d, setD] = useState(null);
  const [tab, setTab] = useState(initialTab || "calibration");
  const [pop, setPop] = useState(null);
  const load = useCallback(async () => {
    try { setD(await request(`${QUALITY_API}/equipment/${equipmentId}`)); } catch (e) { notify("error", e.message); }
  }, [equipmentId, request, notify]);
  useEffect(() => { load(); }, [load]);
  const e = d?.equipment;
  const act = async (action, body = {}) => {
    try {
      const r = await request(`${QUALITY_API}/equipment/${equipmentId}/${action}`, { method: "POST", body: JSON.stringify({ ...body, version: e.version, actor }) });
      notify("success", r?.plan_no ? `${tx("Calibration plan created")} ${r.plan_no}` : tx("Saved.")); setPop(null); load(); onChanged?.();
    } catch (err) { notify("error", err.message); }
  };
  const scrapped = e?.state === "SCRAPPED";
  const buttons = !e || !canEdit || scrapped ? [] : [
    [tx("Request calibration"), EventRepeatOutlinedIcon, "primary", () => act("request_calibration"), Boolean(e.open_plan_id)],
    [tx("Move location"), SwapHorizOutlinedIcon, "edit", () => setPop({ type: "move" })],
    e.state !== "UNDER_REPAIR" && e.state !== "OUT_OF_SERVICE" && [tx("Report broken"), BuildOutlinedIcon, "delete", () => setPop({ type: "note", action: "report_broken", title: tx("Report broken") })],
    e.state === "UNDER_REPAIR" && [tx("Repaired"), CheckCircleOutlineIcon, "edit", () => act("repaired")],
    e.state !== "OUT_OF_SERVICE" && [tx("Out of service"), BlockOutlinedIcon, "delete", () => setPop({ type: "note", action: "out_of_service", title: tx("Out of service") })],
    e.state === "OUT_OF_SERVICE" && [tx("Return to service"), PlayCircleOutlineIcon, "edit", () => act("return_to_service")],
    [tx("Scrap"), DeleteOutlineIcon, "delete", () => setPop({ type: "note", action: "scrap", title: tx("Scrap") })],
  ].filter(Boolean);
  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<StraightenOutlinedIcon />} title={e ? `${e.equipment_code} · ${e.equipment_name}` : tx("Measuring Equipment")} subtitle={e ? [e.type_name, e.model, e.serial_number].filter(Boolean).join(" · ") : ""} onClose={onClose} />
      <DialogContent sx={{ pt: "12px !important" }}>
        {!d ? <Loading /> : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px minmax(0,1fr)" }, gap: 2 }}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}><EquipStatePill value={e.state} /></Stack>
              <InfoRows rows={[
                [tx("Equipment ID"), e.equipment_code], [tx("Type"), e.type_name], [tx("Manufacturer"), e.manufacturer], [tx("Model"), e.model], [tx("Serial No."), e.serial_number],
                [tx("Measurement range"), e.measurement_range], [tx("Resolution"), e.resolution], [tx("Accuracy"), e.accuracy], [tx("Required Cpk"), e.required_cpk ? `≥ ${e.required_cpk}` : EMPTY],
                [tx("Usage location"), e.location], [tx("Owner"), e.owner_code], [tx("Calibration cycle"), `${e.calibration_cycle_days} ${tx("days")}`], [tx("Calibration lab"), e.calibration_lab],
                [tx("Last calibration"), dateText(e.last_calibration_date)], [tx("Next calibration"), dateText(e.next_calibration_date), ["OVERDUE"].includes(e.state) ? "#F04438" : e.state === "DUE_SOON" ? "#F79009" : undefined],
                [tx("Remaining"), dueText(e.days_left)], [tx("Last used"), whenText(e.last_used_at)], e.lock_reason ? [tx("Lock reason"), e.lock_reason, "#F04438"] : null,
              ]} />
              {!e.usable ? <Alert severity="warning" sx={{ mt: 1, py: 0 }}>{tx("Not allowed for inspection")}: {label("equipState", e.state)}</Alert> : null}
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>{tx("Technical data is maintained by the administrator in the Measuring Equipment Master.")}</Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Tabs value={tab} onChange={(ev, v) => setTab(v)} sx={{ minHeight: 36, mb: 1, "& .MuiTab-root": { minHeight: 36, textTransform: "none", fontWeight: 700 } }}>
                <Tab value="calibration" label={`${tx("Calibration History")} (${d.history.length})`} /><Tab value="plans" label={`${tx("Calibration Plans")} (${d.plans.length})`} />
                <Tab value="usage" label={`${tx("Usage")} (${d.usage.length})`} /><Tab value="events" label={tx("History")} />
              </Tabs>
              <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                {tab === "calibration" ? (
                  <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.4, whiteSpace: "nowrap" }, "& th": { fontWeight: 800, bgcolor: "background.paper" } }}>
                    <TableHead><TableRow><TableCell>{tx("Calibration date")}</TableCell><TableCell>{tx("Next due")}</TableCell><TableCell>{tx("Result")}</TableCell><TableCell>{tx("Lab")}</TableCell>
                      <TableCell>{tx("Calibrated by")}</TableCell><TableCell>{tx("Certificate")}</TableCell></TableRow></TableHead>
                    <TableBody>{d.history.map((h) => (
                      <TableRow key={h.id}><TableCell>{dateText(h.calibration_date)}</TableCell><TableCell>{dateText(h.next_due_date)}</TableCell><TableCell><ResultText value={h.result} /></TableCell>
                        <TableCell>{h.lab || EMPTY}</TableCell><TableCell>{h.calibrated_by || EMPTY}</TableCell>
                        <TableCell>{h.certificate_url ? <Typography component="span" variant="caption" sx={{ color: "#1570EF", cursor: "pointer", fontWeight: 700 }}
                          onClick={() => window.open(resolveImageUrl(h.certificate_url), "_blank", "noopener")}>{h.certificate_no || tx("File")}</Typography> : h.certificate_no || EMPTY}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                ) : null}
                {tab === "plans" ? (
                  <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.4, whiteSpace: "nowrap" }, "& th": { fontWeight: 800, bgcolor: "background.paper" } }}>
                    <TableHead><TableRow><TableCell>{tx("Plan No.")}</TableCell><TableCell>{tx("Planned Date")}</TableCell><TableCell>{tx("Lab")}</TableCell><TableCell align="center">{tx("Status")}</TableCell><TableCell>{tx("Result")}</TableCell></TableRow></TableHead>
                    <TableBody>{d.plans.map((p) => (
                      <TableRow key={p.id} hover sx={{ cursor: "pointer" }} onClick={() => navigate(`/quality-management/calibration-management?plan=${p.id}`)}>
                        <TableCell sx={{ color: "#1570EF", fontWeight: 700 }}>{p.plan_no}</TableCell><TableCell>{dateText(p.planned_date)}</TableCell><TableCell>{p.lab}</TableCell>
                        <TableCell align="center"><CalStatusPill value={p.display_status} /></TableCell><TableCell><ResultText value={p.result} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                ) : null}
                {tab === "usage" ? (
                  <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.4, whiteSpace: "nowrap" }, "& th": { fontWeight: 800, bgcolor: "background.paper" } }}>
                    <TableHead><TableRow><TableCell>{tx("Time")}</TableCell><TableCell>{tx("Plan No.")}</TableCell><TableCell>{tx("Work Order")}</TableCell><TableCell>{tx("Characteristic")}</TableCell>
                      <TableCell align="right">{tx("Value")}</TableCell><TableCell>{tx("Result")}</TableCell></TableRow></TableHead>
                    <TableBody>{d.usage.map((u, i) => (
                      <TableRow key={i}><TableCell>{ddmmhhmm(u.inspected_at)}</TableCell><TableCell>{u.plan_no}</TableCell><TableCell>{u.wo_no || EMPTY}</TableCell><TableCell>{u.characteristic_name}</TableCell>
                        <TableCell align="right">{u.measured_value != null ? num(u.measured_value, 4) : EMPTY}</TableCell><TableCell><ResultText value={u.result} /></TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                ) : null}
                {tab === "events" ? <Events events={d.events} group="equipmentAction" colors={{}} /> : null}
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
        <Box sx={{ flex: 1 }} />
        {buttons.map(([text, Icon, kind, fn, disabled]) => <Button key={text} startIcon={<Icon />} onClick={fn} disabled={disabled} sx={btn(kind)}>{text}</Button>)}
      </DialogActions>
      {pop?.type === "note" ? <NoteDialog title={pop.title} required danger onClose={() => setPop(null)} onConfirm={(text) => act(pop.action, { note: text })} /> : null}
      {pop?.type === "move" ? <MoveDialog lookups={lookups} current={e?.location} onClose={() => setPop(null)} onConfirm={(loc, text) => act("move", { usage_location: loc, note: text })} /> : null}
    </Dialog>
  );
}

function MoveDialog({ lookups, current, onClose, onConfirm }) {
  const [loc, setLoc] = useState("");
  const [note, setNote] = useState("");
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<SwapHorizOutlinedIcon />} title={tx("Move location")} subtitle={`${tx("Current")}: ${current || EMPTY}`} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <TextField select size="small" label={tx("New usage location")} value={loc} onChange={(e) => setLoc(e.target.value)}>
            {(lookups?.locations || []).filter((l) => l !== current).map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}</TextField>
          <TextField size="small" label={tx("Remark")} value={note} onChange={(e) => setNote(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={() => onConfirm(loc, note)} disabled={!loc} sx={btn("primary")}>{tx("Confirm")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// CALIBRATION
// =========================================================

export function CalCreateDialog({ lookups, preset, item, request, actor, notify, onClose, onSaved }) {
  const [f, setF] = useState(() => ({ equipment_id: item?.equipment_id || preset?.equipment_id || "", planned_date: item?.planned_date || todayLocal(), lab: item?.lab || "",
    owner: item?.owner || "", priority: item?.priority || "MEDIUM", remark: item?.remark || "" }));
  const [saving, setSaving] = useState(false);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  const save = async () => {
    setSaving(true);
    try {
      const body = JSON.stringify({ ...f, equipment_id: Number(f.equipment_id), lab: f.lab || null, owner: f.owner || null, version: item?.version, actor });
      const r = item ? await request(`${QUALITY_API}/calibration/${item.id}`, { method: "PUT", body }) : await request(`${QUALITY_API}/calibration`, { method: "POST", body });
      notify("success", item ? tx("Saved.") : `${tx("Created")} ${r.plan_no}`); onSaved(r);
    } catch (e) { notify("error", e.message); } finally { setSaving(false); }
  };
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<EventRepeatOutlinedIcon />} title={item ? `${tx("Reschedule")} · ${item.plan_no}` : tx("Create Calibration Plan")} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <TextField select size="small" required label={tx("Measuring Equipment")} value={f.equipment_id} onChange={ch("equipment_id")} disabled={Boolean(item)}>
            {(lookups?.gauges || []).filter((g) => g.state !== "SCRAPPED").map((g) => <MenuItem key={g.id} value={g.id}>{g.code} — {g.name} ({label("equipState", g.state)})</MenuItem>)}</TextField>
          <Stack direction="row" spacing={1.5}>
            <TextField size="small" type="date" fullWidth label={tx("Planned Date")} value={f.planned_date} onChange={ch("planned_date")} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField select size="small" fullWidth label={tx("Priority")} value={f.priority} onChange={ch("priority")}>
              {["HIGH", "MEDIUM", "LOW"].map((t) => <MenuItem key={t} value={t}>{label("priority", t)}</MenuItem>)}</TextField>
          </Stack>
          <Stack direction="row" spacing={1.5}>
            <TextField select size="small" fullWidth label={tx("Calibration lab")} value={f.lab} onChange={ch("lab")} slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
              <MenuItem value="">{tx("Auto")}</MenuItem>{(lookups?.labs || []).map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}</TextField>
            <PersonSelect lookups={lookups} labelText={tx("Owner")} value={f.owner} onChange={(v) => setF((o) => ({ ...o, owner: v }))} />
          </Stack>
          <TextField size="small" multiline minRows={2} label={tx("Remark")} value={f.remark} onChange={ch("remark")} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Back")}</Button>
        <Button onClick={save} disabled={saving || !f.equipment_id} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export function CalDetailDialog({ planId, lookups, request, actor, notify, canEdit, onClose, onChanged, navigate }) {
  const [d, setD] = useState(null);
  const [mode, setMode] = useState(null);
  const [f, setF] = useState({ result: "PASS", calibration_date: todayLocal(), certificate_no: "", certificate_url: "", calibrated_by: "", lab: "", note: "" });
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const load = useCallback(async () => {
    try { const r = await request(`${QUALITY_API}/calibration/${planId}`); setD(r); setF((o) => ({ ...o, lab: r.plan.lab || "" })); } catch (e) { notify("error", e.message); }
  }, [planId, request, notify]);
  useEffect(() => { load(); }, [load]);
  const p = d?.plan;
  const open = p && ["PLANNED", "IN_PROGRESS"].includes(p.status);
  const act = async (action, body = {}) => {
    setBusy(true);
    try { await request(`${QUALITY_API}/calibration/${planId}/${action}`, { method: "POST", body: JSON.stringify({ ...body, version: p.version, actor }) }); notify("success", tx("Saved.")); setMode(null); await load(); onChanged?.(); }
    catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const up = await request(`${API_BASE}/api/files/documents`, { method: "POST", body: JSON.stringify({ category: "quality", filename: file.name, data: await toBase64(file) }) });
      setF((o) => ({ ...o, certificate_url: up.url }));
    } catch (e) { notify("error", e.message); } finally { setBusy(false); if (input.current) input.current.value = ""; }
  };
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<EventRepeatOutlinedIcon />} title={p ? `${p.plan_no} · ${p.equipment_code}` : tx("Calibration Plan")} subtitle={p ? `${p.equipment_name} · ${p.type_name}` : ""} onClose={onClose} />
      {busy ? <LinearProgress /> : null}
      <DialogContent sx={{ pt: "12px !important" }}>
        {!d ? <Loading /> : (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px minmax(0,1fr)" }, gap: 2 }}>
            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}><CalStatusPill value={p.display_status} /><PriorityPill value={p.priority} /></Stack>
              <InfoRows rows={[
                [tx("Equipment"), <Typography key="e" component="span" variant="caption" fontWeight={700} sx={{ color: "#1570EF", cursor: "pointer" }}
                  onClick={() => navigate(`/quality-management/measuring-equipment?equipment=${p.equipment_id}`)}>{p.equipment_code}</Typography>],
                [tx("Model"), p.model], [tx("Serial No."), p.serial_number], [tx("Usage location"), p.location], [tx("Calibration cycle"), `${p.calibration_cycle_days} ${tx("days")}`],
                [tx("Last calibration"), dateText(p.last_calibration_date)], [tx("Planned Date"), dateText(p.planned_date), p.display_status === "OVERDUE" ? "#F04438" : undefined],
                [tx("Remaining"), p.status === "COMPLETED" ? EMPTY : dueText(p.days_left)], [tx("Lab"), p.lab], [tx("Owner"), p.owner], [tx("Source"), label("calSource", p.source)],
                p.sent_at ? [tx("Sent at"), ddmmhhmm(p.sent_at)] : null, p.calibration_date ? [tx("Calibration date"), dateText(p.calibration_date)] : null,
                p.result ? [tx("Result"), <ResultText key="r" value={p.result} />] : null, p.certificate_no ? [tx("Certificate"), p.certificate_url
                  ? <Typography key="c" component="span" variant="caption" fontWeight={700} sx={{ color: "#1570EF", cursor: "pointer" }} onClick={() => window.open(resolveImageUrl(p.certificate_url), "_blank", "noopener")}>{p.certificate_no}</Typography>
                  : p.certificate_no] : null,
                p.on_time != null ? [tx("On time"), p.on_time ? tx("Yes") : tx("No"), p.on_time ? "#12B76A" : "#F04438"] : null, p.remark ? [tx("Remark"), p.remark] : null,
              ]} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              {mode === "complete" ? (
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5, mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{tx("Record calibration result")}</Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5}>
                      <ToggleButtonGroup exclusive size="small" value={f.result} onChange={(e, v) => v && setF((o) => ({ ...o, result: v }))}>
                        {["PASS", "ADJUSTED", "FAIL"].map((r) => <ToggleButton key={r} value={r} sx={{ px: 1.5, fontWeight: 800 }}>{label("result", r)}</ToggleButton>)}
                      </ToggleButtonGroup>
                      <TextField size="small" type="date" label={tx("Calibration date")} value={f.calibration_date} onChange={ch("calibration_date")} slotProps={{ inputLabel: { shrink: true } }} />
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <TextField size="small" fullWidth required={f.result !== "FAIL"} label={tx("Certificate No.")} value={f.certificate_no} onChange={ch("certificate_no")} />
                      <TextField select size="small" fullWidth label={tx("Lab")} value={f.lab} onChange={ch("lab")}>
                        {(lookups?.labs || []).map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}</TextField>
                      <TextField size="small" fullWidth label={tx("Calibrated by")} value={f.calibrated_by} onChange={ch("calibrated_by")} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <input ref={input} type="file" hidden accept="application/pdf,image/*" onChange={(e) => upload(e.target.files?.[0])} />
                      <Button startIcon={<UploadFileOutlinedIcon />} onClick={() => input.current?.click()} disabled={busy} sx={btn("cancel")}>{tx("Upload certificate (PDF)")}</Button>
                      {f.certificate_url ? <Typography variant="caption" sx={{ color: "#12B76A", fontWeight: 700 }}>{tx("File uploaded")}</Typography> : null}
                    </Stack>
                    <TextField size="small" multiline minRows={2} label={tx("Remark")} value={f.note} onChange={ch("note")} />
                    {f.result === "FAIL" ? <Alert severity="error" sx={{ py: 0 }}>{tx("A failed calibration locks the equipment: it cannot be used for inspection until a passed calibration.")}</Alert> : null}
                    <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                      <Button onClick={() => setMode(null)} sx={btn("cancel")}>{tx("Back")}</Button>
                      <Button startIcon={<VerifiedOutlinedIcon />} disabled={busy || (f.result !== "FAIL" && !f.certificate_no.trim())} sx={btn("primary")}
                        onClick={() => act("complete", { result: f.result, calibration_date: f.calibration_date, certificate_no: f.certificate_no || null, certificate_url: f.certificate_url || null,
                          calibrated_by: f.calibrated_by || null, lab: f.lab || null, note: f.note || null })}>{tx("Save result")}</Button>
                    </Stack>
                  </Stack>
                </Box>
              ) : null}
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{tx("Calibration History")}</Typography>
              <Box sx={{ maxHeight: 220, overflow: "auto", mb: 1.5 }}>
                <Table size="small" stickyHeader sx={{ "& td, & th": { fontSize: 11.5, px: 0.75, py: 0.4, whiteSpace: "nowrap" }, "& th": { fontWeight: 800, bgcolor: "background.paper" } }}>
                  <TableHead><TableRow><TableCell>{tx("Calibration date")}</TableCell><TableCell>{tx("Next due")}</TableCell><TableCell>{tx("Result")}</TableCell><TableCell>{tx("Lab")}</TableCell><TableCell>{tx("Certificate")}</TableCell></TableRow></TableHead>
                  <TableBody>{d.history.map((h) => (
                    <TableRow key={h.id}><TableCell>{dateText(h.calibration_date)}</TableCell><TableCell>{dateText(h.next_due_date)}</TableCell><TableCell><ResultText value={h.result} /></TableCell>
                      <TableCell>{h.lab || EMPTY}</TableCell><TableCell>{h.certificate_url ? <Typography component="span" variant="caption" sx={{ color: "#1570EF", cursor: "pointer", fontWeight: 700 }}
                        onClick={() => window.open(resolveImageUrl(h.certificate_url), "_blank", "noopener")}>{h.certificate_no || tx("File")}</Typography> : h.certificate_no || EMPTY}</TableCell></TableRow>
                  ))}</TableBody>
                </Table>
              </Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{tx("History")}</Typography>
              <Events events={d.events} group="calAction" colors={CAL_STATUS_COLORS} />
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
        <Box sx={{ flex: 1 }} />
        {canEdit && open ? (
          <>
            <Button startIcon={<BuildOutlinedIcon />} onClick={() => setMode("edit")} sx={btn("edit")}>{tx("Reschedule")}</Button>
            <Button startIcon={<CancelOutlinedIcon />} onClick={() => setMode("cancel")} sx={btn("delete")}>{tx("Cancel plan")}</Button>
            {p.status === "PLANNED" ? <Button startIcon={<LocalShippingOutlinedIcon />} onClick={() => act("start", { lab: f.lab || null })} disabled={busy} sx={btn("edit")}>{tx("Send / start calibration")}</Button> : null}
            <Button startIcon={<VerifiedOutlinedIcon />} onClick={() => setMode("complete")} sx={btn("primary")}>{tx("Record result")}</Button>
          </>
        ) : null}
      </DialogActions>
      {mode === "cancel" ? <NoteDialog title={tx("Cancel plan")} required danger onClose={() => setMode(null)} onConfirm={(text) => act("cancel", { note: text })} /> : null}
      {mode === "edit" && p ? <CalCreateDialog lookups={lookups} item={p} request={request} actor={actor} notify={notify} onClose={() => setMode(null)} onSaved={() => { setMode(null); load(); onChanged?.(); }} /> : null}
    </Dialog>
  );
}

// =========================================================
// ALERTS
// =========================================================

export const alertPath = (a) => ({
  NG: `/quality-management/ng-management?ng=${a.ref_id}`, PLAN: `/quality-management/inspection-management?plan=${a.ref_id}`,
  GAUGE: `/quality-management/measuring-equipment?equipment=${a.ref_id}`, WO: `/quality-management/inspection-management?wo=${a.ref_id}`,
  MACHINE: `/machine-equipment/machine-detail?machine=${a.ref_id}`, MOLD: `/mold-management/detail?mold=${a.ref_id}`, PRODUCT: `/quality-management/spc-monitoring?product=${a.ref_id}`,
}[a.ref_type] || null);

export function AlertDialog({ alert, lookups, request, actor, notify, canEdit, onClose, onChanged, navigate }) {
  const [owner, setOwner] = useState(alert.owner || "");
  const [busy, setBusy] = useState(false);
  const act = async (action, extra = {}) => {
    setBusy(true);
    try { await request(`${QUALITY_API}/alerts/${alert.id}/${action}`, { method: "POST", body: JSON.stringify({ actor, ...extra }) }); notify("success", tx("Saved.")); onChanged(); onClose(); }
    catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  const path = alertPath(alert);
  const openState = ["NEW", "ACKNOWLEDGED", "IN_PROGRESS"].includes(alert.status);
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<NotificationsActiveOutlinedIcon />} tone="danger" title={label("alertKind", alert.kind)} subtitle={ddmmhhmm(alert.raised_at)} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.5}>
          <Typography variant="body2" fontWeight={700}>{alertText(alert)}</Typography>
          <Typography variant="caption" color="text.secondary">{alert.message}</Typography>
          <InfoRows rows={[[tx("Severity"), <SeverityPill key="s" value={alert.severity} />], [tx("Status"), <AlertStatusPill key="t" value={alert.status} />],
            [tx("Object"), alert.ref_code], [tx("Owner"), alert.owner], alert.resolved_at ? [tx("Resolved at"), ddmmhhmm(alert.resolved_at)] : null]} />
          {canEdit && openState ? (
            <Stack direction="row" spacing={1}>
              <PersonSelect lookups={lookups} labelText={tx("Owner")} value={owner} onChange={setOwner} />
              <Button onClick={() => act("assign", { data: { owner } })} disabled={busy || !owner} sx={btn("edit")}>{tx("Assign")}</Button>
            </Stack>
          ) : null}
          <Typography variant="caption" color="text.secondary">{tx("System alerts are resolved automatically when the condition disappears.")}</Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1, flexWrap: "wrap" }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
        {path ? <Button onClick={() => { onClose(); navigate(path); }} sx={btn("edit")}>{tx("Open detail")}</Button> : null}
        <Box sx={{ flex: 1 }} />
        {canEdit && alert.status === "NEW" ? <Button onClick={() => act("acknowledge")} disabled={busy} sx={btn("edit")}>{tx("Acknowledge")}</Button> : null}
        {canEdit && ["NEW", "ACKNOWLEDGED"].includes(alert.status) ? <Button onClick={() => act("start")} disabled={busy} sx={btn("edit")}>{tx("In progress")}</Button> : null}
        {canEdit && openState ? <Button onClick={() => act("resolve")} disabled={busy} sx={btn("primary")}>{tx("Resolve")}</Button> : null}
        {canEdit && alert.status === "RESOLVED" ? <Button onClick={() => act("close")} disabled={busy} sx={btn("primary")}>{tx("Close alert")}</Button> : null}
      </DialogActions>
    </Dialog>
  );
}

export { TypePill, LockOutlinedIcon };
