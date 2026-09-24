import { useCallback, useEffect, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, FormControl, InputAdornment, InputLabel, LinearProgress,
  MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import AutoModeOutlinedIcon from "@mui/icons-material/AutoModeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

import { DialogHeader, EMPTY, btn, ddmmhhmm, dialogPaperSx, num } from "../../ProductionManagement/ProductionPlanning/ui";
import { label, tx } from "../materialLocales";
import { qty } from "../materialUi";

export const ALLOC_COLORS = { RESERVED: "#F79009", IN_USE: "#2E90FA", COMPLETED: "#12B76A", CANCELLED: "#F04438" };

export function AllocPill({ value }) {
  const color = ALLOC_COLORS[value] || "#667085";
  return (
    <Box component="span" title={label("allocStatus", value)} sx={{ display: "inline-block", width: 104, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis",
      whiteSpace: "nowrap", verticalAlign: "middle", px: 0.5, py: 0.2, borderRadius: 1, fontSize: 11, fontWeight: 700, color, bgcolor: `${color}1A`, border: `1px solid ${color}40` }}>
      {label("allocStatus", value)}
    </Box>
  );
}

export const hoursText = (h) => (h == null ? EMPTY : h < 1 ? `${Math.max(Math.round(h * 60), 0)} min` : `${num(h, 1)} h`);

// =========================================================
// CREATE (per work order, FEFO suggestions)
// =========================================================

export function CreateAllocationDialog({ api, request, lookups, actor, initialWorkOrderId, notify, onClose, onChanged }) {
  const [woId, setWoId] = useState(initialWorkOrderId || null);
  const [lines, setLines] = useState(null);
  const [inputs, setInputs] = useState({});
  const [busy, setBusy] = useState(false);
  const wo = lookups.work_orders.find((w) => w.id === woId);

  const load = useCallback(async () => {
    if (!woId) { setLines(null); return; }
    try {
      const data = await request(`${api}/work-orders/${woId}/lines`);
      setLines(data);
      const next = {};
      data.forEach((l) => l.lots.forEach((lot) => { next[`${l.id}-${lot.id}`] = lot.suggested_qty || ""; }));
      setInputs(next);
    } catch (e) { notify("error", e.message); }
  }, [woId, api, request, notify]);
  useEffect(() => { load(); }, [load]);

  const reserveOne = async (line, lot) => {
    const value = Number(inputs[`${line.id}-${lot.id}`] || 0);
    if (!(value > 0)) return;
    setBusy(true);
    try {
      await request(api, { method: "POST", body: JSON.stringify({ requirement_id: line.id, lot_id: lot.id, qty: value, actor }) });
      notify("success", tx("Material reserved.")); await load(); onChanged();
    } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  const auto = async () => {
    setBusy(true);
    try {
      const result = await request(`${api}/auto`, { method: "POST", body: JSON.stringify({ work_order_id: woId, actor }) });
      notify(result.missing.length ? "warning" : "success",
        result.missing.length
          ? `${tx("{n} allocations created.", { n: result.created.length })} ${tx("Not enough stock for: {list}", { list: result.missing.map((m) => `${m.material_code} (${num(m.missing_qty, 3)} ${m.unit})`).join(", ") })}`
          : tx("{n} allocations created.", { n: result.created.length }));
      await load(); onChanged();
    } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="lg" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<AddTaskOutlinedIcon />} title={tx("New Allocation")} subtitle={tx("Lots are suggested FEFO: earliest expiry first.")} onClose={onClose} disabled={busy} />
      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: { sm: "center" } }}>
          <Autocomplete size="small" sx={{ flex: 1 }} options={lookups.work_orders} value={wo || null}
            getOptionLabel={(w) => `${w.wo_no} · ${w.product_name}${w.machine_code ? ` · ${w.machine_code}` : ""}${w.planned_start ? ` · ${ddmmhhmm(w.planned_start)}` : ""}`}
            isOptionEqualToValue={(a, b) => a.id === b.id} onChange={(_, w) => setWoId(w?.id ?? null)}
            renderInput={(p) => <TextField {...p} label={tx("Select a work order")} />} />
          <Button startIcon={<AutoModeOutlinedIcon />} disabled={!woId || busy || !lines?.some((l) => l.remaining_qty > 0 && l.lots.length)} onClick={auto} sx={btn("primary")}>{tx("Auto allocate (FEFO)")}</Button>
        </Stack>
        {busy ? <LinearProgress sx={{ mb: 1 }} /> : null}
        {!woId ? null : !lines ? <LinearProgress /> : lines.length === 0 ? <Alert severity="info">{tx("No data.")}</Alert> : (
          <Stack spacing={1.5}>
            {lines.map((line) => (
              <Box key={line.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2, overflow: "hidden" }}>
                <Stack direction="row" sx={{ px: 1.5, py: 1, gap: 2, flexWrap: "wrap", alignItems: "center", bgcolor: "action.hover" }}>
                  <Typography variant="subtitle2" fontWeight={800}>{line.material_code}</Typography>
                  <Typography variant="caption">{tx("Need")}: <b>{qty(line.need_qty, line.unit)}</b></Typography>
                  <Typography variant="caption">{tx("Allocated")}: <b>{qty(line.allocated_qty, line.unit)}</b></Typography>
                  <Typography variant="caption" sx={{ color: line.remaining_qty > 0 ? "#F04438" : "#12B76A" }}>
                    {line.remaining_qty > 0 ? <>{tx("Remaining")}: <b>{qty(line.remaining_qty, line.unit)}</b></> : <b>{tx("Fully allocated")}</b>}
                  </Typography>
                </Stack>
                {line.remaining_qty > 0 ? (
                  line.lots.length === 0 ? <Alert severity="warning" sx={{ m: 1, py: 0 }}>{tx("No usable lot (in stock, IQC passed, not expired).")}</Alert> : (
                    <Table size="small" sx={{ "& td, & th": { fontSize: 12, whiteSpace: "nowrap" } }}>
                      <TableHead><TableRow>
                        <TableCell>{tx("Lot No.")}</TableCell><TableCell>{tx("Location")}</TableCell><TableCell>{tx("Expiry")}</TableCell>
                        <TableCell align="right">{tx("Free")}</TableCell><TableCell align="right">{tx("Suggested")}</TableCell><TableCell align="right">{tx("Reserved qty")}</TableCell><TableCell />
                      </TableRow></TableHead>
                      <TableBody>
                        {line.lots.map((lot) => (
                          <TableRow key={lot.id} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{lot.lot_no}</TableCell><TableCell>{lot.location_name}</TableCell>
                            <TableCell>{lot.expiry_date ? String(lot.expiry_date).split("-").reverse().join("/") : EMPTY}</TableCell>
                            <TableCell align="right">{qty(lot.free_qty, line.unit)}</TableCell>
                            <TableCell align="right">{lot.suggested_qty ? qty(lot.suggested_qty, line.unit) : EMPTY}</TableCell>
                            <TableCell align="right">
                              <TextField size="small" type="number" value={inputs[`${line.id}-${lot.id}`] ?? ""} sx={{ width: 120 }} inputProps={{ min: 0, step: "any" }}
                                onChange={(e) => setInputs((o) => ({ ...o, [`${line.id}-${lot.id}`]: e.target.value }))}
                                InputProps={{ endAdornment: <InputAdornment position="end">{line.unit}</InputAdornment> }} />
                            </TableCell>
                            <TableCell align="right"><Button size="small" disabled={busy || !(Number(inputs[`${line.id}-${lot.id}`]) > 0)} onClick={() => reserveOne(line, lot)}>{tx("Reserve")}</Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )
                ) : null}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose} disabled={busy} sx={btn("cancel")}>{tx("Close")}</Button></DialogActions>
    </Dialog>
  );
}

// =========================================================
// DETAIL + ACTIONS
// =========================================================

export function AllocationDetailDialog({ api, request, allocation, machines, canEdit, actor, notify, onClose, onChanged }) {
  const [a, setA] = useState(allocation);
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => request(`${api}/${allocation.id}`).then(setA).catch((e) => notify("error", e.message)), [api, allocation.id, request, notify]);
  useEffect(() => { load(); }, [load]);

  const open = (m) => {
    setMode(m);
    setForm(m === "issue" ? { qty: a.reserved_qty, machine_id: a.machine_id || a.wo_machine_id || "" } : m === "return" ? { qty: a.in_use_qty, reason: "" } : m === "extend" ? { hours: 8 } : { reason: "" });
  };
  const submit = async () => {
    setBusy(true);
    try {
      const body = { actor, version: a.version };
      if (mode === "issue") Object.assign(body, { qty: Number(form.qty), machine_id: form.machine_id || null });
      if (mode === "return") Object.assign(body, { qty: Number(form.qty), reason: form.reason.trim() });
      if (mode === "release") Object.assign(body, { reason: form.reason.trim() });
      if (mode === "extend") Object.assign(body, { hours: Number(form.hours) });
      await request(`${api}/${a.id}/${mode}`, { method: "POST", body: JSON.stringify(body) });
      notify("success", tx({ issue: "Material issued to machine.", return: "Material returned.", release: "Reservation released.", extend: "Reservation extended." }[mode]));
      setMode(null); await load(); onChanged();
    } catch (e) { notify("error", e.message); } finally { setBusy(false); }
  };
  const valid = mode === "issue" ? Number(form.qty) > 0 && Number(form.qty) <= a.reserved_qty + 1e-3 && form.machine_id
    : mode === "return" ? Number(form.qty) > 0 && Number(form.qty) <= a.in_use_qty + 1e-3 && form.reason?.trim()
      : mode === "release" ? form.reason?.trim() : mode === "extend" ? Number(form.hours) > 0 : false;
  const info = [
    [tx("Work Order"), `${a.wo_no}${a.order_no ? ` · ${a.order_no}` : ""}`], [tx("Product"), a.product_name],
    [tx("Material"), `${a.material_code} — ${a.material_name}`], [tx("Lot No."), a.lot_no],
    [tx("Area"), a.location_name], [tx("Machine"), a.machine_code || EMPTY],
    [tx("Status"), <AllocPill key="s" value={a.status} />], [tx("Allocated at"), ddmmhhmm(a.reserved_at)],
    [tx("Reserved qty"), qty(a.reserved_qty, a.unit)], [tx("Issued"), qty(a.issued_qty, a.unit)],
    [tx("Returned"), qty(a.returned_qty, a.unit)], [tx("In use qty"), qty(a.in_use_qty, a.unit)],
    [tx("Reservation expiry"), a.reserved_qty > 0 ? `${ddmmhhmm(a.expires_at)} (${hoursText(a.hours_left)})` : EMPTY], [tx("Reason"), a.cancel_reason || EMPTY],
  ];
  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="md" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <DialogHeader icon={<Inventory2OutlinedIcon />} title={`${tx("Allocation Detail")} · ${a.allocation_no}`} subtitle={`${a.material_code} · ${a.lot_no}`} onClose={onClose} disabled={busy} />
      <DialogContent sx={{ pt: "16px !important", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, gap: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "42% 58%", rowGap: 0.9, columnGap: 1, alignContent: "start" }}>
          {info.map(([k, v]) => [
            <Typography key={`${k}-k`} variant="caption" color="text.secondary">{k}</Typography>,
            <Typography key={`${k}-v`} variant="caption" fontWeight={700} component="div">{v}</Typography>,
          ])}
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{tx("Recent Allocation History")}</Typography>
          {(a.transactions || []).map((t) => (
            <Box key={t.id} sx={{ py: 0.6, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="caption" fontWeight={800} sx={{ display: "block" }}>{label("txn", t.txn_type)}{Number(t.qty_change) ? ` · ${Number(t.qty_change) > 0 ? "+" : ""}${num(t.qty_change, 3)} ${a.unit}` : ""}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {ddmmhhmm(t.acted_at)} · {t.actor}{t.to_location ? ` · ${t.from_location ? `${t.from_location} → ` : ""}${t.to_location}` : ""}{t.machine_code ? ` · ${t.machine_code}` : ""}{t.remark ? ` · ${t.remark}` : ""}
              </Typography>
            </Box>
          ))}
          {mode ? (
            <Stack spacing={1.5} sx={{ mt: 2, p: 1.5, border: 1, borderColor: "divider", borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={800}>{tx({ issue: "Issue to Machine", return: "Return Material", release: "Release Reservation", extend: "Extend Reservation" }[mode])}</Typography>
              {mode === "issue" || mode === "return" ? (
                <TextField size="small" type="number" label={tx("Quantity")} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  InputProps={{ endAdornment: <InputAdornment position="end">{a.unit}</InputAdornment> }} inputProps={{ min: 0, step: "any" }} />
              ) : null}
              {mode === "issue" ? (
                <FormControl size="small"><InputLabel>{tx("Machine")}</InputLabel>
                  <Select label={tx("Machine")} value={form.machine_id} onChange={(e) => setForm({ ...form, machine_id: e.target.value })}>
                    {machines.map((m) => <MenuItem key={m.id} value={m.id}>{m.equipment_code} — {m.equipment_name}</MenuItem>)}
                  </Select></FormControl>
              ) : null}
              {mode === "return" || mode === "release" ? <TextField size="small" required label={tx("Reason")} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /> : null}
              {mode === "extend" ? <TextField size="small" type="number" label={tx("Hours")} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} inputProps={{ min: 1 }} /> : null}
              <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                <Button onClick={() => setMode(null)} disabled={busy} sx={btn("cancel")}>{tx("Cancel")}</Button>
                <Button onClick={submit} disabled={busy || !valid} sx={btn(mode === "release" ? "delete" : "primary")}>{tx("Confirm")}</Button>
              </Stack>
            </Stack>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: "wrap", gap: 1 }}>
        <Button disabled={!canEdit || busy || a.reserved_qty <= 0} onClick={() => open("issue")} sx={btn("primary")}>{tx("Issue to Machine")}</Button>
        <Button disabled={!canEdit || busy || a.in_use_qty <= 0} onClick={() => open("return")} sx={btn("edit")}>{tx("Return Material")}</Button>
        <Button disabled={!canEdit || busy || a.reserved_qty <= 0} onClick={() => open("extend")} sx={btn("edit")}>{tx("Extend Reservation")}</Button>
        <Button disabled={!canEdit || busy || a.reserved_qty <= 0} color="error" onClick={() => open("release")} sx={btn("delete")}>{tx("Release Reservation")}</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={busy} sx={btn("cancel")}>{tx("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
