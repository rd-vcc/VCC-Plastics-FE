import { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, Divider, FormControl, IconButton,
  InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import PrecisionManufacturingOutlinedIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";

import { alertText, label, tx } from "./locales";
import { PROGRESS_COLORS } from "./PlanningGantt";
import {
  Dot, DialogHeader, EMPTY, MATERIAL_COLORS, PriorityChip, SEVERITY_COLORS, btn, ddmmhhmm, dialogPaperSx,
  durationMinutes, fmtDuration, fromInputDateTime, num, toInputDateTime,
} from "./ui";

const PRIORITIES = ["URGENT", "HIGH", "MEDIUM", "LOW"];
const SOURCES = ["MANUAL", "SALES_ORDER", "FORECAST", "STOCK"];
const BLOCKED = new Set(["MAINTENANCE", "DOWN", "OFFLINE"]);

function InfoGrid({ items }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 3, rowGap: 0.9 }}>
      {items.map(([k, v]) => (
        <Box key={k} sx={{ display: "grid", gridTemplateColumns: "44% 56%", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">{k}</Typography>
          <Typography variant="caption" fontWeight={700} sx={{ wordBreak: "break-word" }}>{v ?? EMPTY}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function AlertList({ alerts, onAlertClick, dense }) {
  if (!alerts.length) return <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>{tx("No alerts.")}</Typography>;
  return (
    <Stack divider={<Divider flexItem />}>
      {alerts.map((a, i) => {
        const { title, message } = alertText(a);
        return (
          <Box key={`${a.code}-${a.wo_no}-${a.ref}-${i}`} onClick={onAlertClick ? () => onAlertClick(a) : undefined}
            sx={{ display: "flex", gap: 1, py: dense ? 0.6 : 0.9, px: 0.5, cursor: onAlertClick ? "pointer" : "default", "&:hover": onAlertClick ? { bgcolor: "action.hover" } : {} }}>
            <Box sx={{ width: 8, height: 8, mt: 0.7, borderRadius: "50%", bgcolor: SEVERITY_COLORS[a.severity], flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ display: "block" }} variant="caption" fontWeight={800}>{title}</Typography>
              <Typography sx={{ display: "block" }} variant="caption" color="text.secondary">{message}</Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

// =========================================================
// WORK ORDER FORM
// =========================================================

export function WorkOrderForm({ item, initial, lookups, defaultWoNo, saving, onClose, onSave }) {
  const [f, setF] = useState(item ? {
    wo_no: item.wo_no, production_order_id: item.production_order_id ?? "", product_id: item.product_id, mold_id: item.mold_id ?? "", material_id: item.material_id ?? "",
    planned_qty: item.planned_qty, cavity: item.cavity, cycle_time_sec: item.cycle_time_sec, setup_minutes: item.setup_minutes,
    part_weight_g: item.part_weight_g ?? "", due_date: toInputDateTime(item.due_date), priority: item.priority, source: item.source,
    source_ref: item.source_ref || "", backlog_reason: item.backlog_reason || "", remark: item.remark || "",
  } : {
    wo_no: defaultWoNo || "", production_order_id: "", product_id: "", mold_id: "", material_id: "", planned_qty: "", cavity: 1, cycle_time_sec: "",
    setup_minutes: 0, part_weight_g: "", due_date: "", priority: "MEDIUM", source: "MANUAL", source_ref: "", backlog_reason: "", remark: "",
    ...(initial || {}),
  });
  const orders = lookups.production_orders || [];
  const pickOrder = (e) => {
    const orderId = e.target.value;
    const order = orders.find((o) => o.id === orderId);
    setF((o) => (order ? {
      ...o, production_order_id: orderId, product_id: order.product_id,
      planned_qty: Math.max(Number(order.order_qty) - Number(order.wo_planned_qty || 0), 0) || o.planned_qty,
      due_date: toInputDateTime(order.due_date) || o.due_date, priority: order.priority, source_ref: order.order_no,
    } : { ...o, production_order_id: "" }));
  };
  useEffect(() => { if (!item && defaultWoNo) setF((o) => (o.wo_no ? o : { ...o, wo_no: defaultWoNo })); }, [defaultWoNo, item]);
  const ch = (k) => (e) => setF((o) => ({ ...o, [k]: e.target.value }));

  const linkedMoldIds = useMemo(
    () => new Set(lookups.mold_products.filter((mp) => Number(mp.product_id) === Number(f.product_id)).map((mp) => mp.mold_id)),
    [lookups.mold_products, f.product_id],
  );
  const molds = useMemo(() => [...lookups.molds].sort((a, b) => Number(linkedMoldIds.has(b.id)) - Number(linkedMoldIds.has(a.id))), [lookups.molds, linkedMoldIds]);
  const pickMold = (e) => {
    const moldId = e.target.value;
    const mold = lookups.molds.find((m) => m.id === moldId);
    const link = lookups.mold_products.find((mp) => mp.mold_id === moldId && Number(mp.product_id) === Number(f.product_id));
    setF((o) => ({ ...o, mold_id: moldId, cavity: link?.cavity_quantity || mold?.cavity_count || o.cavity }));
  };
  const minutes = durationMinutes(f.planned_qty, f.cavity, f.cycle_time_sec, f.setup_minutes);
  const valid = f.wo_no.trim() && f.product_id && Number(f.planned_qty) > 0 && Number(f.cavity) > 0 && Number(f.cycle_time_sec) > 0;

  const submit = () => onSave({
    wo_no: f.wo_no.trim(), production_order_id: f.production_order_id ? Number(f.production_order_id) : null, product_id: Number(f.product_id), mold_id: f.mold_id ? Number(f.mold_id) : null,
    material_id: f.material_id ? Number(f.material_id) : null, planned_qty: Number(f.planned_qty), cavity: Number(f.cavity),
    cycle_time_sec: Number(f.cycle_time_sec), setup_minutes: Number(f.setup_minutes || 0),
    part_weight_g: f.part_weight_g === "" ? null : Number(f.part_weight_g), due_date: fromInputDateTime(f.due_date),
    priority: f.priority, source: f.source, source_ref: f.source_ref || null, backlog_reason: f.backlog_reason || null,
    remark: f.remark || null,
  });

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<AssignmentOutlinedIcon />} title={item ? tx("Edit Work Order") : tx("Create Work Order")} subtitle={item?.wo_no} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
          <TextField required size="small" label={tx("Work Order No.")} value={f.wo_no} onChange={ch("wo_no")} />
          <FormControl size="small">
            <InputLabel>{tx("Production Order")}</InputLabel>
            <Select label={tx("Production Order")} value={f.production_order_id} onChange={pickOrder}>
              <MenuItem value="">{EMPTY}</MenuItem>
              {orders.map((o) => (
                <MenuItem key={o.id} value={o.id}>
                  {o.order_no} · {o.customer_short_name || o.customer_name || EMPTY} · {num(Math.max(o.order_qty - o.wo_planned_qty, 0))}/{num(o.order_qty)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl required size="small">
            <InputLabel>{tx("Product")}</InputLabel>
            <Select label={tx("Product")} value={f.product_id} onChange={ch("product_id")} disabled={Boolean(f.production_order_id)}>
              {lookups.products.map((p) => <MenuItem key={p.id} value={p.id}>{p.product_code} — {p.product_name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{tx("Mold")}</InputLabel>
            <Select label={tx("Mold")} value={f.mold_id} onChange={pickMold}>
              <MenuItem value="">{EMPTY}</MenuItem>
              {molds.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {linkedMoldIds.has(m.id) ? "★ " : ""}{m.mold_code} — {m.mold_name} ({m.status})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField required size="small" type="number" label={tx("Planned Qty")} value={f.planned_qty} onChange={ch("planned_qty")} inputProps={{ min: 1 }} />
          <TextField required size="small" type="number" label={tx("Cavity")} value={f.cavity} onChange={ch("cavity")} inputProps={{ min: 1 }} />
          <TextField required size="small" type="number" label={tx("Cycle Time (s)")} value={f.cycle_time_sec} onChange={ch("cycle_time_sec")} inputProps={{ min: 0.1, step: 0.1 }} />
          <TextField size="small" type="number" label={tx("Setup (min)")} value={f.setup_minutes} onChange={ch("setup_minutes")} inputProps={{ min: 0 }} />
          <TextField size="small" type="datetime-local" label={tx("Due Date")} value={f.due_date} onChange={ch("due_date")} InputLabelProps={{ shrink: true }} />
          <FormControl size="small">
            <InputLabel>{tx("Priority")}</InputLabel>
            <Select label={tx("Priority")} value={f.priority} onChange={ch("priority")}>
              {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{label("priority", p)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{tx("Source")}</InputLabel>
            <Select label={tx("Source")} value={f.source} onChange={ch("source")}>
              {SOURCES.map((s) => <MenuItem key={s} value={s}>{label("source", s)}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label={tx("Source Ref.")} value={f.source_ref} onChange={ch("source_ref")} />
          <TextField size="small" label={tx("Backlog Reason")} value={f.backlog_reason} onChange={ch("backlog_reason")} sx={{ gridColumn: { md: "span 2" } }} />
          <TextField size="small" multiline minRows={2} label={tx("Remark")} value={f.remark} onChange={ch("remark")} sx={{ gridColumn: "1 / -1" }} />
        </Box>
        <Alert severity="info" sx={{ mt: 2, py: 0 }}>{tx("Estimated duration")}: <b>{valid ? fmtDuration(minutes) : EMPTY}</b> · {tx("Materials come from the product's active BOM (Product Master).")}</Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button onClick={submit} disabled={saving || !valid} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// SCHEDULE
// =========================================================

export function ScheduleDialog({ wo, machines, windowStart, initialMachineId, initialStart, saving, onClose, onSave }) {
  const [machineId, setMachineId] = useState(initialMachineId || wo.machine_id || "");
  const [start, setStart] = useState(toInputDateTime(initialStart || wo.planned_start || windowStart));
  const minutes = durationMinutes(wo.planned_qty, wo.cavity, wo.cycle_time_sec, wo.setup_minutes);
  const end = start ? new Date(new Date(start).getTime() + minutes * 60000) : null;
  const machine = machines.find((m) => m.id === machineId);
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<EventAvailableOutlinedIcon />} title={tx("Schedule Work Order")} subtitle={`${wo.wo_no} · ${wo.product_name}`} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <Stack spacing={2}>
          <FormControl size="small" fullWidth>
            <InputLabel>{tx("Machine")}</InputLabel>
            <Select label={tx("Machine")} value={machineId} onChange={(e) => setMachineId(e.target.value)}>
              {machines.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.equipment_code} — {m.equipment_name} · {m.group_name || EMPTY} · {label("machineStatus", m.operational_status)} · {num(m.planned_hours, 1)}h
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {machine && BLOCKED.has(machine.operational_status) ? (
            <Alert severity="error" sx={{ py: 0 }}>{alertText({ code: "MACHINE_UNAVAILABLE", params: { wo: wo.wo_no, machine: machine.equipment_code, status: machine.operational_status } }).message}</Alert>
          ) : null}
          <TextField size="small" type="datetime-local" label={tx("Planned Start")} value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} />
          <InfoGrid items={[
            [tx("Estimated duration"), fmtDuration(minutes)],
            [tx("Planned End"), end ? ddmmhhmm(end) : EMPTY],
            [tx("Planned Qty"), num(wo.planned_qty)],
            [tx("Mold"), wo.mold_code],
          ]} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button disabled={saving || !machineId || !start} onClick={() => onSave({ machine_id: Number(machineId), planned_start: fromInputDateTime(start) })} sx={btn("primary")}>{tx("Schedule")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// PROGRESS
// =========================================================

export function ProgressDialog({ wo, saving, onClose, onSave }) {
  const [qty, setQty] = useState(wo.actual_qty ?? 0);
  const [reject, setReject] = useState(wo.reject_qty ?? 0);
  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<SpeedOutlinedIcon />} title={tx("Record Progress")} subtitle={wo.wo_no} onClose={onClose} disabled={saving} />
      <DialogContent sx={{ pt: "20px !important" }}>
        <Stack spacing={2}>
          <Alert severity="info" sx={{ py: 0 }}>{tx("Actual quantity is entered manually until Production Execution is available.")}</Alert>
          <TextField size="small" type="number" label={`${tx("Actual Qty")} / ${num(wo.planned_qty)}`} value={qty} onChange={(e) => setQty(e.target.value)} inputProps={{ min: 0 }} />
          <TextField size="small" type="number" label={tx("Reject Qty")} value={reject} onChange={(e) => setReject(e.target.value)} inputProps={{ min: 0 }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={btn("cancel")}>{tx("Cancel")}</Button>
        <Button disabled={saving || qty === "" || Number(qty) < 0 || Number(reject) < 0} onClick={() => onSave(Number(qty), Number(reject || 0))} sx={btn("primary")}>{tx("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// WORK ORDER DETAIL
// =========================================================

export function WorkOrderDetailDialog({ wo, alerts, canEdit, planEditable, saving, onClose, onEdit, onSchedule, onUnschedule, onCancel, onProgress, onOpenDetail }) {
  const editable = canEdit && (wo.status === "UNSCHEDULED" || (wo.status === "SCHEDULED" && planEditable));
  const state = wo.progress_state;
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<AssignmentOutlinedIcon />} title={wo.wo_no} subtitle={`${wo.product_code} — ${wo.product_name}`} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", mb: 1.5 }}>
          <PriorityChip value={wo.priority} />
          <Typography variant="caption" fontWeight={800}>{label("woStatus", wo.status)}</Typography>
          {state ? <Dot color={PROGRESS_COLORS[state]} text={label("progress", state)} /> : null}
        </Stack>
        <InfoGrid items={[
          [tx("Machine"), wo.machine_code ? `${wo.machine_code} — ${wo.machine_name}` : EMPTY],
          [tx("Mold"), wo.mold_code ? `${wo.mold_code} — ${wo.mold_name}` : EMPTY],
          [tx("Planned Start"), ddmmhhmm(wo.planned_start)], [tx("Planned End"), ddmmhhmm(wo.planned_end)],
          [tx("Production Order"), wo.order_no ? `${wo.order_no}${wo.customer_short_name || wo.customer_name ? ` · ${wo.customer_short_name || wo.customer_name}` : ""}` : EMPTY],
          [tx("Reject Qty"), num(wo.reject_qty)],
          [tx("Planned Qty"), num(wo.planned_qty)], [tx("Actual Qty"), num(wo.actual_qty)],
          [tx("Cavity"), wo.cavity], [tx("Cycle Time (s)"), num(wo.cycle_time_sec, 2)],
          [tx("Setup (min)"), wo.setup_minutes], [tx("Estimated duration"), fmtDuration(durationMinutes(wo.planned_qty, wo.cavity, wo.cycle_time_sec, wo.setup_minutes))],
          [tx("Material"), wo.material_code ? `${wo.material_code} — ${wo.material_name}` : EMPTY], [tx("Part Weight (g)"), num(wo.part_weight_g, 3)],
          [tx("Due Date"), ddmmhhmm(wo.due_date)], [tx("Source"), `${label("source", wo.source)}${wo.source_ref ? ` · ${wo.source_ref}` : ""}`],
          [tx("Backlog Reason"), wo.backlog_reason], [tx("Remark"), wo.remark],
        ]} />
        {alerts.length ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{tx("Planning Alerts")}</Typography>
            <AlertList alerts={alerts} dense />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        <Button onClick={() => onOpenDetail(wo)} sx={btn("cancel")}>{tx("Open Order Detail")}</Button>
        <Box sx={{ flex: 1 }} />
        {editable && wo.status !== "UNSCHEDULED" ? <Button disabled={saving} onClick={() => onUnschedule(wo)} sx={btn("cancel")}>{tx("Move to Backlog")}</Button> : null}
        {editable ? <Button disabled={saving} color="error" onClick={() => onCancel(wo)} sx={btn("delete")}>{tx("Cancel Work Order")}</Button> : null}
        {canEdit && ["SCHEDULED", "RELEASED", "IN_PRODUCTION", "ON_HOLD", "COMPLETED"].includes(wo.status) ? <Button disabled={saving} onClick={() => onProgress(wo)} sx={btn("edit")}>{tx("Record Progress")}</Button> : null}
        {editable ? <Button disabled={saving} onClick={() => onEdit(wo)} sx={btn("edit")}>{tx("Edit")}</Button> : null}
        {editable ? <Button disabled={saving} onClick={() => onSchedule(wo)} sx={btn("primary")}>{tx("Schedule")}</Button> : null}
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// SIMULATION
// =========================================================

export function SimulationDialog({ planId, areaId, workOrders, backlog, machines, request, api, onClose }) {
  const candidates = useMemo(() => [...workOrders, ...backlog], [workOrders, backlog]);
  const [changes, setChanges] = useState([{ id: "", machine_id: "", planned_start: "", planned_qty: "" }]);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const update = (index, key, value) => setChanges((list) => list.map((c, i) => {
    if (i !== index) return c;
    const next = { ...c, [key]: value };
    if (key === "id") {
      const wo = candidates.find((w) => w.id === value);
      next.machine_id = wo?.machine_id || "";
      next.planned_start = toInputDateTime(wo?.planned_start);
      next.planned_qty = wo?.planned_qty || "";
    }
    return next;
  }));

  const run = async () => {
    setRunning(true); setError("");
    try {
      const payload = changes.filter((c) => c.id).map((c) => {
        const wo = candidates.find((w) => w.id === c.id);
        return {
          id: c.id,
          machine_id: c.machine_id && c.machine_id !== wo?.machine_id ? Number(c.machine_id) : (wo?.status === "UNSCHEDULED" && c.machine_id ? Number(c.machine_id) : null),
          planned_start: c.planned_start && c.planned_start !== toInputDateTime(wo?.planned_start) ? fromInputDateTime(c.planned_start) : null,
          planned_qty: c.planned_qty && Number(c.planned_qty) !== Number(wo?.planned_qty) ? Number(c.planned_qty) : null,
        };
      });
      setResult(await request(`${api}/simulate`, { method: "POST", body: JSON.stringify({ plan_id: planId, area_id: areaId || null, changes: payload }) }));
    } catch (e) { setError(e.message); } finally { setRunning(false); }
  };

  const metrics = result ? [
    [tx("Planned Orders"), result.before.kpis.planned_orders, result.after.kpis.planned_orders],
    [tx("Planned Production"), num(result.before.kpis.planned_qty), num(result.after.kpis.planned_qty)],
    [tx("Total Utilization"), `${result.before.capacity_totals.utilization}%`, `${result.after.capacity_totals.utilization}%`],
    [tx("Material Availability"), `${result.before.material_summary.availability_pct}%`, `${result.after.material_summary.availability_pct}%`],
    [tx("At Risk Orders"), result.before.kpis.at_risk, result.after.kpis.at_risk],
    [tx("Delayed Orders"), result.before.kpis.delayed, result.after.kpis.delayed],
    [tx("Errors"), result.before.checks.error_count, result.after.checks.error_count],
    [tx("Warnings"), result.before.checks.warning_count, result.after.checks.warning_count],
  ] : [];

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<ScienceOutlinedIcon />} title={tx("Plan Simulation")} subtitle={tx("Simulation compares the current plan with your changes without saving anything.")} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={1.25}>
          {changes.map((c, index) => (
            <Box key={index} sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 2fr 1.6fr 1fr auto" }, gap: 1, alignItems: "center" }}>
              <FormControl size="small">
                <InputLabel>{tx("Work Order")}</InputLabel>
                <Select label={tx("Work Order")} value={c.id} onChange={(e) => update(index, "id", e.target.value)}>
                  {candidates.map((w) => <MenuItem key={w.id} value={w.id}>{w.wo_no} · {w.product_name} · {label("woStatus", w.status)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>{tx("Machine")}</InputLabel>
                <Select label={tx("Machine")} value={c.machine_id} onChange={(e) => update(index, "machine_id", e.target.value)}>
                  <MenuItem value="">{tx("Keep")}</MenuItem>
                  {machines.map((m) => <MenuItem key={m.id} value={m.id}>{m.equipment_code} · {label("machineStatus", m.operational_status)}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField size="small" type="datetime-local" label={tx("Planned Start")} value={c.planned_start} onChange={(e) => update(index, "planned_start", e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField size="small" type="number" label={tx("Planned Qty")} value={c.planned_qty} onChange={(e) => update(index, "planned_qty", e.target.value)} />
              <IconButton size="small" color="error" disabled={changes.length === 1} onClick={() => setChanges((l) => l.filter((_, i) => i !== index))}><DeleteOutlineIcon fontSize="small" /></IconButton>
            </Box>
          ))}
          <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<AddIcon />} onClick={() => setChanges((l) => [...l, { id: "", machine_id: "", planned_start: "", planned_qty: "" }])}>{tx("Add Change")}</Button>
          </Stack>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {result ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1.3fr" }, gap: 2 }}>
              <Table size="small">
                <TableHead><TableRow><TableCell /><TableCell align="right">{tx("Current")}</TableCell><TableCell align="right">{tx("Simulated")}</TableCell></TableRow></TableHead>
                <TableBody>
                  {metrics.map(([k, a, b]) => (
                    <TableRow key={k}>
                      <TableCell>{k}</TableCell><TableCell align="right">{a}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: String(a) !== String(b) ? "primary.main" : "inherit" }}>{b}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ maxHeight: 320, overflow: "auto" }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>{tx("Alerts after simulation")}</Typography>
                <AlertList alerts={result.after.alerts} dense />
              </Box>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button>
        <Button disabled={running || !changes.some((c) => c.id)} onClick={run} sx={btn("primary")}>{tx("Run Simulation")}</Button>
      </DialogActions>
    </Dialog>
  );
}

// =========================================================
// CAPACITY CHECK
// =========================================================

export function CapacityCheckDialog({ capacity, totals, machines, onGroupClick, onClose }) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<PrecisionManufacturingOutlinedIcon />} title={tx("Capacity Check")} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{tx("Machine Group")}</TableCell><TableCell align="right">{tx("Machines")}</TableCell>
              <TableCell align="right">{tx("Available (h)")}</TableCell><TableCell align="right">{tx("Planned (h)")}</TableCell>
              <TableCell align="right">{tx("Est. Capacity (PCS)")}</TableCell><TableCell align="right">{tx("Utilization")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {capacity.map((c) => (
              <TableRow key={c.group_code} hover sx={{ cursor: "pointer" }} onClick={() => onGroupClick(c)}>
                <TableCell>{c.group_name}</TableCell>
                <TableCell align="right">{c.available_machines}/{c.total_machines}</TableCell>
                <TableCell align="right">{num(c.available_hours, 1)}</TableCell>
                <TableCell align="right">{num(c.planned_hours, 1)}</TableCell>
                <TableCell align="right">{num(c.capacity_qty)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: c.utilization > 100 ? "#F04438" : c.utilization > 85 ? "#F79009" : "#12B76A" }}>{c.utilization}%</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>{tx("Total")}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{totals.available_machines}/{totals.total_machines}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{num(totals.available_hours, 1)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{num(totals.planned_hours, 1)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{num(totals.capacity_qty)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>{totals.utilization}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 2, mb: 0.5 }}>{tx("Machines")}</Typography>
        <Table size="small">
          <TableHead><TableRow><TableCell>{tx("Machine")}</TableCell><TableCell>{tx("Machine Group")}</TableCell><TableCell>{tx("Status")}</TableCell><TableCell align="right">{tx("Planned (h)")}</TableCell></TableRow></TableHead>
          <TableBody>
            {machines.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.equipment_code} — {m.equipment_name}</TableCell><TableCell>{m.group_name || EMPTY}</TableCell>
                <TableCell sx={{ color: m.available ? "inherit" : "#F04438", fontWeight: m.available ? 400 : 800 }}>{label("machineStatus", m.operational_status)}</TableCell>
                <TableCell align="right">{num(m.planned_hours, 2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button></DialogActions>
    </Dialog>
  );
}

// =========================================================
// MATERIAL CHECK + STOCK
// =========================================================

export function MaterialCheckDialog({ materials, api, request, canEdit, actor, onChanged, onMaterialClick, onClose }) {
  const [stock, setStock] = useState([]);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState("");
  const load = () => request(`${api}/material-stock`).then(setStock).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const needed = new Set(materials.map((m) => m.material_id));
  const save = async () => {
    try {
      await request(`${api}/material-stock/${edit.material_id}`, { method: "PUT", body: JSON.stringify({ safety_stock_qty: Number(edit.safety_stock_qty || 0), updated_by: actor }) });
      setEdit(null); await load(); onChanged(tx("Stock updated."));
    } catch (e) { setError(e.message); }
  };
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<Inventory2OutlinedIcon />} title={tx("Material Check")} onClose={onClose} />
      <DialogContent sx={{ pt: "16px !important" }}>
        {error ? <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert> : null}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{tx("Material")}</TableCell><TableCell align="right">{tx("Required")}</TableCell><TableCell align="right">{tx("Available")}</TableCell>
              <TableCell align="right">{tx("Safety Stock")}</TableCell><TableCell>{tx("Availability")}</TableCell><TableCell>{tx("Used by")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.length === 0 ? <TableRow><TableCell colSpan={6}>{tx("No data.")}</TableCell></TableRow> : materials.map((m) => (
              <TableRow key={m.material_id} hover sx={{ cursor: "pointer" }} onClick={() => onMaterialClick(m)}>
                <TableCell>{m.material_code}<Typography sx={{ display: "block" }} variant="caption" color="text.secondary">{m.material_name}</Typography></TableCell>
                <TableCell align="right">{num(m.required_qty, 2)} {m.unit}</TableCell>
                <TableCell align="right">{m.has_stock_record ? `${num(m.available_qty, 2)} ${m.unit}` : tx("No stock record")}</TableCell>
                <TableCell align="right">{num(m.safety_stock_qty, 2)}</TableCell>
                <TableCell><Dot color={MATERIAL_COLORS[m.status]} text={label("material", m.status)} /></TableCell>
                <TableCell><Typography variant="caption">{m.wo_nos.join(", ")}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 2.5 }}>{tx("Material Stock")}</Typography>
        <Typography variant="caption" color="text.secondary">{tx("Stock is maintained here until the Material Management module is available.")}</Typography>
        <Box sx={{ maxHeight: 280, overflow: "auto", mt: 0.5 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow><TableCell>{tx("Material")}</TableCell><TableCell align="right">{tx("Available")}</TableCell><TableCell align="right">{tx("Safety Stock")}</TableCell><TableCell align="right" /></TableRow></TableHead>
            <TableBody>
              {[...stock].sort((a, b) => Number(needed.has(b.material_id)) - Number(needed.has(a.material_id))).map((s) => (
                <TableRow key={s.material_id}>
                  <TableCell sx={{ fontWeight: needed.has(s.material_id) ? 800 : 400 }}>{s.material_code} — {s.material_name}</TableCell>
                  {edit?.material_id === s.material_id ? (
                    <>
                      <TableCell align="right">{s.available_qty == null ? tx("No stock record") : `${num(s.available_qty, 2)} ${s.unit || ""}`}</TableCell>
                      <TableCell align="right"><TextField size="small" type="number" value={edit.safety_stock_qty} onChange={(e) => setEdit({ ...edit, safety_stock_qty: e.target.value })} sx={{ width: 110 }} /></TableCell>
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Button size="small" onClick={() => setEdit(null)}>{tx("Cancel")}</Button>
                        <Button size="small" variant="contained" onClick={save}>{tx("Save")}</Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell align="right">{s.available_qty == null ? tx("No stock record") : `${num(s.available_qty, 2)} ${s.unit || ""}`}</TableCell>
                      <TableCell align="right">{num(s.safety_stock_qty, 2)}</TableCell>
                      <TableCell align="right"><Button size="small" disabled={!canEdit} onClick={() => setEdit({ material_id: s.material_id, safety_stock_qty: s.safety_stock_qty ?? 0 })}>{tx("Safety Stock")}</Button></TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button></DialogActions>
    </Dialog>
  );
}

// =========================================================
// ALERTS
// =========================================================

export function AlertsDialog({ alerts, title, message, onAlertClick, onClose }) {
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={message ? <FactCheckOutlinedIcon /> : <NotificationsActiveOutlinedIcon />} tone={message ? "danger" : "primary"} title={title || tx("Planning Alerts")} subtitle={message} onClose={onClose} />
      <DialogContent sx={{ pt: "12px !important", maxHeight: 520 }}>
        <AlertList alerts={alerts} onAlertClick={onAlertClick} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} sx={btn("cancel")}>{tx("Close")}</Button></DialogActions>
    </Dialog>
  );
}

